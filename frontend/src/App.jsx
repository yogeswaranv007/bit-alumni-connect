import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './components/common/ProtectedRoute';
import { DashboardLayout } from './components/layout/DashboardLayout';

// Public Pages
import { LandingPage } from './pages/public/LandingPage';
import { LoginPage } from './pages/public/LoginPage';
import { RegisterPage } from './pages/public/RegisterPage';
import { PublicVerifyPage } from './pages/public/PublicVerifyPage';
import { DirectoryPage } from './pages/alumni/DirectoryPage';

// Alumni Pages
import { AlumniDashboard } from './pages/alumni/AlumniDashboard';
import { CreateProfilePage } from './pages/alumni/CreateProfilePage';
import { AlumniProfilePage } from './pages/alumni/AlumniProfilePage';
import { DigitalIdPage } from './pages/alumni/DigitalIdPage';

// Admin Pages
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminAlumniListPage } from './pages/admin/AdminAlumniListPage';

export const App = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/verify/:token" element={<PublicVerifyPage />} />

      {/* Directory is accessible to both guests and authenticated members */}
      <Route path="/directory" element={<DirectoryPage />} />

      {/* Alumni Self-Registration Wizard (Protected) */}
      <Route
        path="/alumni/create-profile"
        element={
          <ProtectedRoute requiredRole="ROLE_ALUMNI">
            <CreateProfilePage />
          </ProtectedRoute>
        }
      />

      {/* Alumni Dashboard Routes (Protected within DashboardLayout) */}
      <Route
        path="/alumni"
        element={
          <ProtectedRoute requiredRole="ROLE_ALUMNI">
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<AlumniDashboard />} />
        <Route path="profile" element={<AlumniProfilePage />} />
        <Route path="virtual-id" element={<DigitalIdPage />} />
        <Route index element={<Navigate to="/alumni/dashboard" replace />} />
      </Route>

      {/* Admin Console Routes (Protected within DashboardLayout) */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute requiredRole="ROLE_ADMIN">
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="alumni" element={<AdminAlumniListPage />} />
        <Route index element={<Navigate to="/admin/dashboard" replace />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;
