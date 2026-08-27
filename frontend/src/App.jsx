import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './components/common/ProtectedRoute';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { PublicLayout } from './components/layout/PublicLayout';

// Public Community & Institutional Pages
import LandingPage from './pages/public/LandingPage';
import AlumniAssociationPage from './pages/public/AlumniAssociationPage';
import ChaptersPage from './pages/public/ChaptersPage';
import EventsPage from './pages/public/EventsPage';
import GalleryPage from './pages/public/GalleryPage';
import DistinguishedAlumniPage from './pages/public/DistinguishedAlumniPage';
import NewsletterPage from './pages/public/NewsletterPage';
import GraduationRegistrationPage from './pages/public/GraduationRegistrationPage';
import ResourcesPage from './pages/public/ResourcesPage';

// Auth & Verification Pages
import { LoginPage } from './pages/public/LoginPage';
import { RegisterPage } from './pages/public/RegisterPage';
import { PublicVerifyPage } from './pages/public/PublicVerifyPage';
import { DirectoryPage } from './pages/alumni/DirectoryPage';

// Alumni Dashboard & Profile Pages
import { AlumniDashboard } from './pages/alumni/AlumniDashboard';
import { CreateProfilePage } from './pages/alumni/CreateProfilePage';
import { AlumniProfilePage } from './pages/alumni/AlumniProfilePage';
import { DigitalIdPage } from './pages/alumni/DigitalIdPage';
import { ProfileChangeRequestPage } from './pages/alumni/ProfileChangeRequestPage';

// Admin Console Pages
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminAlumniListPage } from './pages/admin/AdminAlumniListPage';
import { AdminChangeRequestsPage } from './pages/admin/AdminChangeRequestsPage';
import { AdminChangeRequestReviewPage } from './pages/admin/AdminChangeRequestReviewPage';

export const App = () => {
  return (
    <Routes>
      {/* Public Community & Institutional Routes with PublicLayout (Navbar & Footer) */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/alumni-association" element={<AlumniAssociationPage />} />
        <Route path="/chapters" element={<ChaptersPage />} />
        <Route path="/events" element={<EventsPage />} />
        <Route path="/gallery" element={<GalleryPage />} />
        <Route path="/distinguished-alumni" element={<DistinguishedAlumniPage />} />
        <Route path="/newsletter" element={<NewsletterPage />} />
        <Route path="/graduation-registration" element={<GraduationRegistrationPage />} />
        <Route path="/resources" element={<ResourcesPage />} />
      </Route>

      {/* Standalone Auth & Verification Routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/verify/:token" element={<PublicVerifyPage />} />
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
        <Route path="change-request" element={<ProfileChangeRequestPage />} />
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
        <Route path="change-requests" element={<AdminChangeRequestsPage />} />
        <Route path="change-requests/:id" element={<AdminChangeRequestReviewPage />} />
        <Route index element={<Navigate to="/admin/dashboard" replace />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;
