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
    return <Navigate to="/" replace />;
  }

  return children;
}

function RoleBasedHome() {
  const { user } = useAuth();
  if (user?.role === 'PLATFORM_ADMIN') return <Navigate to="/platform-dashboard" replace />;
  if (user?.role === 'VERIFIER') return <Navigate to="/verifier-dashboard" replace />;
  return <Navigate to="/institution-dashboard" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/verify/:tokenRef" element={<PublicVerify />} />

          {/* Protected Routes wrapped in AppShell */}
          <Route
            element={
              <RequireAuth>
                <AppShell />
              </RequireAuth>
            }
          >
            <Route path="/" element={<RoleBasedHome />} />
            <Route path="/platform-dashboard" element={<PlatformDashboard />} />
            <Route path="/institution-dashboard" element={<InstitutionDashboard />} />
            <Route path="/verifier-dashboard" element={<VerifierDashboard />} />
            <Route path="/institutions" element={<InstitutionsList />} />
            <Route path="/students" element={<StudentsList />} />
            <Route path="/students/:id" element={<StudentDetail />} />
            <Route path="/import" element={<ImportWizard />} />
            <Route path="/validation" element={<ValidationWorkbench />} />
            <Route path="/duplicates" element={<DuplicateWorkbench />} />
            <Route path="/capacity" element={<CapacityTwin />} />
            <Route path="/cases" element={<ExceptionCases />} />
            <Route path="/reports" element={<ReportsHub />} />
            <Route path="/verification" element={<VerificationHub />} />
            <Route path="/integrations" element={<IntegrationHealth />} />
            <Route path="/audit" element={<AuditLog />} />
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
