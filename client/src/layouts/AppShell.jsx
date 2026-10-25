import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  Users,
  Upload,
  ShieldCheck,
  Copy,
  Gauge,
  AlertTriangle,
  BarChart3,
  QrCode,
  Network,
  History,
  LogOut,
  Bot,
  UserCheck,
  ChevronDown,
  Sparkles,
} from 'lucide-react';
import { useAuth, DEMO_ACCOUNTS } from '../context/AuthContext';
import CopilotWidget from '../components/CopilotWidget';

export default function AppShell() {
  const { user, logout, switchDemoAccount, hasRole } = useAuth();
  const navigate = useNavigate();
  const [copilotOpen, setCopilotOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleRoleSwitch = async (roleName) => {
    await switchDemoAccount(roleName);
  };

  return (
    <div className="d-flex flex-column min-vh-100">
      {/* Prototype Banner */}
      <div className="prototype-disclaimer-banner no-print">
        <Sparkles size={14} />
        <span>
          <strong>AICTE PS 26263 • EduTrace Prototype</strong> — Automated APAAR Verification & Capacity Twin — All Live Government APIs Simulated
        </span>
      </div>

      <div className="d-flex flex-grow-1 position-relative">
        {/* Sidebar */}
        <aside className="app-sidebar no-print">
          {/* Brand */}
          <div className="sidebar-brand">
            <div className="d-flex align-items-center gap-2">
              <div className="bg-primary text-white p-1 rounded d-flex align-items-center justify-content-center" style={{ width: 34, height: 34 }}>
                <ShieldCheck size={20} />
              </div>
              <div>
                <h6 className="mb-0 fw-bold text-white tracking-wide">EduTrace</h6>
                <div style={{ fontSize: '0.68rem', color: '#38bdf8' }}>AICTE Regulation Bureau</div>
              </div>
            </div>
            {/* User role pill */}
            <div className="mt-2 pt-2 border-top border-secondary border-opacity-25 d-flex align-items-center justify-content-between">
              <span className="badge bg-secondary-subtle text-light border border-secondary border-opacity-50" style={{ fontSize: '0.68rem' }}>
                {user?.role?.replace('_', ' ')}
              </span>
              <span className="text-truncate text-muted" style={{ fontSize: '0.75rem', maxWidth: 120 }}>
                {user?.institution?.name || 'Central Platform'}
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="sidebar-nav">
            <div className="sidebar-section-title">Core Operations</div>

            {hasRole('PLATFORM_ADMIN') && (
              <NavLink to="/platform-dashboard" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                <LayoutDashboard size={17} />
                <span>Platform Dashboard</span>
              </NavLink>
            )}

            {hasRole('INSTITUTION_ADMIN', 'DATA_OPERATOR') && (
              <NavLink to="/institution-dashboard" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                <LayoutDashboard size={17} />
                <span>Institution Dashboard</span>
              </NavLink>
            )}

            {hasRole('VERIFIER') && (
              <NavLink to="/verifier-dashboard" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                <UserCheck size={17} />
                <span>Verifier Dashboard</span>
              </NavLink>
            )}

            {hasRole('PLATFORM_ADMIN') && (
              <NavLink to="/institutions" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                <Building2 size={17} />
                <span>Institutions & Quotas</span>
              </NavLink>
            )}

            {hasRole('PLATFORM_ADMIN', 'INSTITUTION_ADMIN', 'DATA_OPERATOR') && (
              <>
                <NavLink to="/students" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                  <Users size={17} />
                  <span>Student Records & APAAR</span>
                </NavLink>

                <NavLink to="/import" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                  <Upload size={17} />
                  <span>Bulk CSV/Excel Import</span>
                </NavLink>
              </>
            )}

            <div className="sidebar-section-title">Validation & Governance</div>

            {hasRole('PLATFORM_ADMIN', 'INSTITUTION_ADMIN', 'DATA_OPERATOR') && (
              <NavLink to="/validation" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                <ShieldCheck size={17} />
                <span>Validation Engine</span>
              </NavLink>
            )}

            {hasRole('PLATFORM_ADMIN', 'INSTITUTION_ADMIN', 'VERIFIER') && (
              <NavLink to="/duplicates" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                <Copy size={17} />
                <span>Duplicate Workbench</span>
              </NavLink>
            )}

            {hasRole('PLATFORM_ADMIN', 'INSTITUTION_ADMIN') && (
              <NavLink to="/capacity" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                <Gauge size={17} />
                <span>Intake & Digital Twin</span>
              </NavLink>
            )}

            {hasRole('PLATFORM_ADMIN', 'INSTITUTION_ADMIN', 'DATA_OPERATOR', 'VERIFIER') && (
              <NavLink to="/cases" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                <AlertTriangle size={17} />
                <span>Exception Cases</span>
              </NavLink>
            )}

            <div className="sidebar-section-title">Reports & Trust</div>

            {hasRole('PLATFORM_ADMIN', 'INSTITUTION_ADMIN') && (
              <NavLink to="/reports" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                <BarChart3 size={17} />
                <span>Reports & Analytics</span>
              </NavLink>
            )}

            {hasRole('PLATFORM_ADMIN', 'INSTITUTION_ADMIN', 'VERIFIER') && (
              <NavLink to="/verification" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                <QrCode size={17} />
                <span>QR Verification Tokens</span>
              </NavLink>
            )}

            {hasRole('PLATFORM_ADMIN', 'INSTITUTION_ADMIN') && (
              <NavLink to="/integrations" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                <Network size={17} />
                <span>Integration Health</span>
              </NavLink>
            )}

            {hasRole('PLATFORM_ADMIN', 'INSTITUTION_ADMIN') && (
              <NavLink to="/audit" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                <History size={17} />
                <span>Audit Trail</span>
              </NavLink>
            )}
          </div>

          {/* User profile card & Copilot button at bottom */}
          <div className="p-3 border-top border-secondary border-opacity-25">
            <button
              className="btn btn-outline-info btn-sm w-100 mb-2 d-flex align-items-center justify-content-center gap-2"
              onClick={() => setCopilotOpen(!copilotOpen)}
            >
              <Bot size={16} />
              <span>AI Compliance Copilot</span>
            </button>
            <div className="d-flex align-items-center justify-content-between">
              <div className="d-flex align-items-center gap-2 overflow-hidden">
                <div className="bg-primary rounded-circle text-white d-flex align-items-center justify-content-center" style={{ width: 28, height: 28, fontSize: '0.8rem' }}>
                  {user?.firstName?.[0] || 'U'}
                </div>
                <div className="overflow-hidden">
                  <div className="text-white text-truncate fw-semibold" style={{ fontSize: '0.8rem' }}>
                    {user?.firstName} {user?.lastName}
                  </div>
                  <div className="text-muted text-truncate" style={{ fontSize: '0.68rem' }}>
                    {user?.email}
                  </div>
                </div>
              </div>
              <button className="btn btn-link text-muted p-0 ms-2" onClick={handleLogout} title="Logout">
                <LogOut size={16} />
              </button>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="app-main flex-grow-1">
          {/* Topbar */}
          <header className="app-topbar no-print">
            <div className="d-flex align-items-center gap-2">
              <span className="badge bg-primary-subtle text-primary border border-primary-subtle px-2 py-1">
                PS 26263
              </span>
              <span className="text-muted" style={{ fontSize: '0.85rem' }}>
                Predict • Explain • Resolve
              </span>
            </div>

            <div className="d-flex align-items-center gap-3">
              {/* Quick Role Switcher for Hackathon Judges */}
              <div className="dropdown">
                <button
                  className="btn btn-sm btn-outline-secondary dropdown-toggle d-flex align-items-center gap-2"
                  type="button"
                  data-bs-toggle="dropdown"
                  style={{ fontSize: '0.8rem' }}
                >
                  <Users size={14} />
                  <span>Switch Role: <strong>{user?.role?.replace('_', ' ')}</strong></span>
                  <ChevronDown size={12} />
                </button>
                <ul className="dropdown-menu dropdown-menu-end shadow-sm" style={{ fontSize: '0.82rem' }}>
                  <li className="dropdown-header text-uppercase fw-bold" style={{ fontSize: '0.68rem' }}>
                    Demo Personas (Dev & Jury Testing)
                  </li>
                  {DEMO_ACCOUNTS.map((acc) => (
                    <li key={acc.role}>
                      <button
                        className={`dropdown-item d-flex align-items-center justify-content-between ${
                          user?.role === acc.role ? 'active' : ''
                        }`}
                        onClick={() => handleRoleSwitch(acc.role)}
                      >
                        <span>{acc.label}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Copilot button */}
              <button
                className="btn btn-sm btn-primary-et d-flex align-items-center gap-1"
                onClick={() => setCopilotOpen(!copilotOpen)}
                style={{ fontSize: '0.8rem' }}
              >
                <Bot size={15} />
                <span>AI Copilot</span>
              </button>
            </div>
          </header>

          {/* Page body */}
          <main className="p-4 flex-grow-1">
            <Outlet />
          </main>
        </div>
      </div>

      {/* Floating Copilot Widget */}
      <CopilotWidget isOpen={copilotOpen} onClose={() => setCopilotOpen(false)} />
    </div>
  );
}
