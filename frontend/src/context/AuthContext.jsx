import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../api/authApi';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('bit_auth_token'));
  const [loading, setLoading] = useState(true);

  const fetchCurrentUser = async () => {
    try {
      const response = await authApi.getCurrentUser();
      if (response.success && response.data) {
        setUser(response.data);
        localStorage.setItem('bit_auth_user', JSON.stringify(response.data));
      }
    } catch (err) {
      console.warn('Failed to load user profile with existing token:', err);
      logout();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchCurrentUser();
    } else {
      setLoading(false);
    }

    const handleUnauthorized = () => {
      logout();
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, [token]);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const response = await authApi.login({ email, password });
      if (response.success && response.data) {
        const { accessToken, user: userData } = response.data;
        localStorage.setItem('bit_auth_token', accessToken);
        localStorage.setItem('bit_auth_user', JSON.stringify(userData));
        setToken(accessToken);
        setUser(userData);
        return { success: true, user: userData };
      }
      return { success: false, message: response.message || 'Login failed' };
    } catch (err) {
      return { success: false, message: err.message || 'Invalid email or password' };
    } finally {
      setLoading(false);
    }
  };

  const register = async (fullName, email, password) => {
    setLoading(true);
    try {
      const response = await authApi.register({ fullName, email, password });
      if (response.success && response.data) {
        const { accessToken, user: userData } = response.data;
        localStorage.setItem('bit_auth_token', accessToken);
        localStorage.setItem('bit_auth_user', JSON.stringify(userData));
        setToken(accessToken);
        setUser(userData);
        return { success: true, user: userData };
      }
      return { success: false, message: response.message || 'Registration failed' };
    } catch (err) {
      return { success: false, message: err.message || 'Registration failed' };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('bit_auth_token');
    localStorage.removeItem('bit_auth_user');
    setToken(null);
    setUser(null);
  };

  const hasRole = (roleName) => {
    if (!user || !user.roles) return false;
    return user.roles.includes(roleName);
  };

  const isAdmin = () => hasRole('ROLE_ADMIN') || hasRole('ROLE_STAFF');
  const isAlumni = () => hasRole('ROLE_ALUMNI');

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: !!token && !!user,
        login,
        register,
        logout,
        refreshUser: fetchCurrentUser,
        hasRole,
        isAdmin,
        isAlumni,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
