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
import { NotificationsPage } from './pages/common/NotificationsPage';

// Auth & Verification Pages
import { LoginPage } from './pages/public/LoginPage';
import { StudentLoginPage } from './pages/public/StudentLoginPage';
import { AlumniLoginPage } from './pages/public/AlumniLoginPage';
import { RegisterPage } from './pages/public/RegisterPage';
import { PublicVerifyPage } from './pages/public/PublicVerifyPage';
import { DirectoryPage } from './pages/alumni/DirectoryPage';

// Alumni Dashboard & Profile Pages
import { AlumniDashboard } from './pages/alumni/AlumniDashboard';
import { CreateProfilePage } from './pages/alumni/CreateProfilePage';
import { AlumniProfilePage } from './pages/alumni/AlumniProfilePage';
import { DigitalIdPage } from './pages/alumni/DigitalIdPage';
import { ProfileChangeRequestPage } from './pages/alumni/ProfileChangeRequestPage';
import { AlumniCampusVisits } from './pages/alumni/AlumniCampusVisits';

// Faculty / Staff Pages
import { FacultyCampusVisits } from './pages/faculty/FacultyCampusVisits';

// Watchman Gate Security Portal
import { WatchmanPortal } from './pages/watchman/WatchmanPortal';

// Admin Console Pages
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminAlumniListPage } from './pages/admin/AdminAlumniListPage';
import { AdminChangeRequestsPage } from './pages/admin/AdminChangeRequestsPage';
import { AdminChangeRequestReviewPage } from './pages/admin/AdminChangeRequestReviewPage';
import { AdminCampusVisits } from './pages/admin/AdminCampusVisits';
import { AdminCampusEntryLogs } from './pages/admin/AdminCampusEntryLogs';
import { AdminRfidManagement } from './pages/admin/AdminRfidManagement';
import { AdminStudentRegistrationsPage } from './pages/admin/AdminStudentRegistrationsPage';

// Community Forum
import { CommunityPage } from './pages/community/CommunityPage';

// Student Portal Pages
import { StudentRegisterPage } from './pages/student/StudentRegisterPage';
import { StudentDashboard } from './pages/student/StudentDashboard';
import { StudentProfilePage } from './pages/student/StudentProfilePage';
import { StudentDigitalIdPage } from './pages/student/StudentDigitalIdPage';
import { StudentVerifyPage } from './pages/student/StudentVerifyPage';

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
        <Route
          path="/notifications"
          element={
            <ProtectedRoute>
              <NotificationsPage />
            </ProtectedRoute>
          }
        />
      </Route>

      {/* Standalone Auth & Verification Routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/student/login" element={<StudentLoginPage />} />
      <Route path="/alumni/login" element={<AlumniLoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/student/register" element={<StudentRegisterPage />} />
      <Route path="/register/student" element={<StudentRegisterPage />} />
      <Route path="/verify/student/:token" element={<StudentVerifyPage />} />
      <Route path="/verify/:token" element={<PublicVerifyPage />} />
      <Route path="/directory" element={<DirectoryPage />} />

      {/* Dedicated Watchman Gate Verification Portal */}
      <Route
        path="/watchman"
        element={
          <ProtectedRoute requiredRole={['ROLE_WATCHMAN', 'ROLE_ADMIN']}>
            <WatchmanPortal />
          </ProtectedRoute>
        }
      />

      {/* Alumni Self-Registration Wizard (Protected) */}
      <Route
        path="/alumni/create-profile"
        element={
          <ProtectedRoute requiredRole="ROLE_ALUMNI">
            <CreateProfilePage />
          </ProtectedRoute>
        }
      />

      {/* Faculty Scoped Approvals Portal */}
      <Route
        path="/faculty"
        element={
          <ProtectedRoute requiredRole={['ROLE_STAFF', 'ROLE_ADMIN']}>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route path="campus-visits" element={<FacultyCampusVisits />} />
        <Route path="campus-entry-logs" element={<AdminCampusEntryLogs />} />
        <Route path="community" element={<CommunityPage />} />
        <Route index element={<Navigate to="/faculty/campus-visits" replace />} />
      </Route>

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
        <Route path="campus-visits" element={<AlumniCampusVisits />} />
        <Route path="profile" element={<AlumniProfilePage />} />
        <Route path="change-request" element={<ProfileChangeRequestPage />} />
        <Route path="virtual-id" element={<DigitalIdPage />} />
        <Route path="community" element={<CommunityPage />} />
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
        <Route path="student-registrations" element={<AdminStudentRegistrationsPage />} />
        <Route path="campus-visits" element={<AdminCampusVisits />} />
        <Route path="campus-entry-logs" element={<AdminCampusEntryLogs />} />
        <Route path="rfid-management" element={<AdminRfidManagement />} />
        <Route path="change-requests" element={<AdminChangeRequestsPage />} />
        <Route path="change-requests/:id" element={<AdminChangeRequestReviewPage />} />
        <Route path="community" element={<CommunityPage />} />
        <Route index element={<Navigate to="/admin/dashboard" replace />} />
      </Route>

      {/* Student Portal Routes (Protected within DashboardLayout) */}
      <Route
        path="/student"
        element={
          <ProtectedRoute requiredRole="ROLE_STUDENT">
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<StudentDashboard />} />
        <Route path="profile" element={<StudentProfilePage />} />
        <Route path="digital-id" element={<StudentDigitalIdPage />} />
        <Route path="community" element={<CommunityPage />} />
        <Route index element={<Navigate to="/student/dashboard" replace />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;
