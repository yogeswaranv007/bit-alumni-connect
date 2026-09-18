import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LoadingSpinner } from './LoadingSpinner';

export const ProtectedRoute = ({ children, requiredRole }) => {
  const { isAuthenticated, loading, user, hasRole, isWatchman, isAdmin, isStaff, isAlumni } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <LoadingSpinner size="lg" text="Authenticating session..." />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredRole) {
    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    const hasAnyRole = roles.some((role) => hasRole(role));

    if (!hasAnyRole) {
      if (isWatchman()) {
        return <Navigate to="/watchman" replace />;
      }
      if (isStaff()) {
        return <Navigate to="/faculty/campus-visits" replace />;
      }
      if (isAdmin()) {
        return <Navigate to="/admin/dashboard" replace />;
      }
      if (isAlumni()) {
        return <Navigate to="/alumni/dashboard" replace />;
      }
      return <Navigate to="/" replace />;
    }
  }

  return children;
};
