import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import AppShell from './layouts/AppShell';

// Pages
import Login from './pages/Login';
import PlatformDashboard from './pages/PlatformDashboard';
import InstitutionDashboard from './pages/InstitutionDashboard';
import VerifierDashboard from './pages/VerifierDashboard';
import StudentsList from './pages/StudentsList';
import StudentDetail from './pages/StudentDetail';
import ImportWizard from './pages/ImportWizard';
import ValidationWorkbench from './pages/ValidationWorkbench';
import DuplicateWorkbench from './pages/DuplicateWorkbench';
import CapacityTwin from './pages/CapacityTwin';
import ExceptionCases from './pages/ExceptionCases';
import ReportsHub from './pages/ReportsHub';
import VerificationHub from './pages/VerificationHub';
import PublicVerify from './pages/PublicVerify';
import IntegrationHealth from './pages/IntegrationHealth';
import AuditLog from './pages/AuditLog';
import InstitutionsList from './pages/InstitutionsList';

function RequireAuth({ children, roles }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
        <div className="spinner-border text-primary" role="status"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/login?denied=true" replace />;
  }

  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/verify/:tokenRef" element={<PublicVerify />} />

          {/* Root URL always redirects directly to login */}
          <Route path="/" element={<Navigate to="/login" replace />} />

          {/* Protected Routes wrapped in AppShell */}
          <Route
            element={
              <RequireAuth>
                <AppShell />
              </RequireAuth>
            }
          >
            <Route
              path="/platform-dashboard"
              element={
                <RequireAuth roles={['PLATFORM_ADMIN']}>
                  <PlatformDashboard />
                </RequireAuth>
              }
            />
            <Route
              path="/institution-dashboard"
              element={
                <RequireAuth roles={['PLATFORM_ADMIN', 'INSTITUTION_ADMIN', 'DATA_OPERATOR']}>
                  <InstitutionDashboard />
                </RequireAuth>
              }
            />
            <Route
              path="/verifier-dashboard"
              element={
                <RequireAuth roles={['PLATFORM_ADMIN', 'VERIFIER']}>
                  <VerifierDashboard />
                </RequireAuth>
              }
            />
            <Route
              path="/institutions"
              element={
                <RequireAuth roles={['PLATFORM_ADMIN']}>
                  <InstitutionsList />
                </RequireAuth>
              }
            />
            <Route path="/students" element={<StudentsList />} />
            <Route path="/students/:id" element={<StudentDetail />} />
            <Route
              path="/import"
              element={
                <RequireAuth roles={['PLATFORM_ADMIN', 'INSTITUTION_ADMIN', 'DATA_OPERATOR']}>
                  <ImportWizard />
                </RequireAuth>
              }
            />
            <Route
              path="/validation"
              element={
                <RequireAuth roles={['PLATFORM_ADMIN', 'INSTITUTION_ADMIN', 'DATA_OPERATOR']}>
                  <ValidationWorkbench />
                </RequireAuth>
              }
            />
            <Route
              path="/duplicates"
              element={
                <RequireAuth roles={['PLATFORM_ADMIN', 'INSTITUTION_ADMIN', 'VERIFIER']}>
                  <DuplicateWorkbench />
                </RequireAuth>
              }
            />
            <Route
              path="/capacity"
              element={
                <RequireAuth roles={['PLATFORM_ADMIN', 'INSTITUTION_ADMIN']}>
                  <CapacityTwin />
                </RequireAuth>
              }
            />
            <Route
              path="/cases"
              element={
                <RequireAuth roles={['PLATFORM_ADMIN', 'INSTITUTION_ADMIN', 'DATA_OPERATOR', 'VERIFIER']}>
                  <ExceptionCases />
                </RequireAuth>
              }
            />
            <Route
              path="/reports"
              element={
                <RequireAuth roles={['PLATFORM_ADMIN', 'INSTITUTION_ADMIN']}>
                  <ReportsHub />
                </RequireAuth>
              }
            />
            <Route
              path="/verification"
              element={
                <RequireAuth roles={['PLATFORM_ADMIN', 'INSTITUTION_ADMIN', 'VERIFIER']}>
                  <VerificationHub />
                </RequireAuth>
              }
            />
            <Route
              path="/integrations"
              element={
                <RequireAuth roles={['PLATFORM_ADMIN', 'INSTITUTION_ADMIN']}>
                  <IntegrationHealth />
                </RequireAuth>
              }
            />
            <Route
              path="/audit"
              element={
                <RequireAuth roles={['PLATFORM_ADMIN', 'INSTITUTION_ADMIN']}>
                  <AuditLog />
                </RequireAuth>
              }
            />
          </Route>

          {/* Catch-all redirects to /login */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
