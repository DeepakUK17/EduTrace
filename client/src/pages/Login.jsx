import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ShieldCheck, ArrowRight, UserCheck, Key, Lock, Sparkles, AlertCircle } from 'lucide-react';
import { useAuth, DEMO_ACCOUNTS } from '../context/AuthContext';

export default function Login() {
  const { login, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('admin@edutrace.demo');
  const [password, setPassword] = useState('Demo@Admin1');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // If already authenticated, redirect
  React.useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === 'PLATFORM_ADMIN') navigate('/platform-dashboard');
      else if (user.role === 'VERIFIER') navigate('/verifier-dashboard');
      else navigate('/institution-dashboard');
    }
  }, [isAuthenticated, user, navigate]);

  const handleSubmit = async (e) => {
    e?.preventDefault();
    setError('');
    setLoading(true);

    try {
      const loggedUser = await login(email, password);
      if (loggedUser.role === 'PLATFORM_ADMIN') navigate('/platform-dashboard');
      else if (loggedUser.role === 'VERIFIER') navigate('/verifier-dashboard');
      else navigate('/institution-dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid credentials. Please verify your email and password.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectDemo = (acc) => {
    setEmail(acc.email);
    setPassword(acc.password);
  };

  return (
    <div className="min-vh-100 d-flex flex-column bg-light">
      {/* Top Banner */}
      <div className="bg-dark text-info text-center py-2 px-3 small fw-medium d-flex align-items-center justify-content-center gap-2">
        <Sparkles size={14} />
        <span>Smart India Hackathon 2026 • AICTE PS 26263 • Predict · Explain · Resolve</span>
      </div>

      <div className="container py-5 flex-grow-1 d-flex align-items-center justify-content-center">
        <div className="row w-100 justify-content-center" style={{ maxWidth: 1050 }}>
          {/* Left Hero Card */}
          <div className="col-lg-6 mb-4 mb-lg-0">
            <div className="p-4 p-md-5 h-100 rounded-4 text-white d-flex flex-column justify-content-between" style={{ background: 'linear-gradient(145deg, #0f172a 0%, #1e293b 100%)' }}>
              <div>
                <div className="d-flex align-items-center gap-2 mb-3">
                  <div className="bg-primary text-white p-2 rounded-3 d-flex align-items-center justify-content-center" style={{ width: 44, height: 44 }}>
                    <ShieldCheck size={28} />
                  </div>
                  <div>
                    <h3 className="fw-bold mb-0 text-white tracking-wide">EduTrace</h3>
                    <div className="text-info small">AICTE Regulation Bureau • PS 26263</div>
                  </div>
                </div>

                <h4 className="fw-bold text-white mt-4 mb-3">
                  APAAR ID-Based Student Data Management & Verification Platform
                </h4>
                <p className="text-light text-opacity-75 mb-4" style={{ fontSize: '0.95rem', lineHeight: 1.6 }}>
                  A production-grade regulatory platform bridging institutions, students, and regulatory authorities with cryptographic privacy, intake digital twin modeling, and automated compliance auditing.
                </p>

                <div className="d-flex flex-column gap-2 mb-4">
                  <div className="d-flex align-items-center gap-2 text-light text-opacity-90 small">
                    <span className="badge bg-primary-subtle text-primary p-1">1</span>
                    <span>HMAC-tokenized duplicate detection across institutions</span>
                  </div>
                  <div className="d-flex align-items-center gap-2 text-light text-opacity-90 small">
                    <span className="badge bg-primary-subtle text-primary p-1">2</span>
                    <span>Approved intake capacity digital twin with what-if simulation</span>
                  </div>
                  <div className="d-flex align-items-center gap-2 text-light text-opacity-90 small">
                    <span className="badge bg-primary-subtle text-primary p-1">3</span>
                    <span>Privacy-preserving opaque QR verification without data leakage</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-top border-secondary border-opacity-25 text-muted small">
                All external government connectors run in transparent simulated prototype mode.
              </div>
            </div>
          </div>

          {/* Right Form Card */}
          <div className="col-lg-5">
            <div className="card border-0 shadow-sm rounded-4 p-4 p-md-5">
              <h4 className="fw-bold text-dark mb-1">Sign In</h4>
              <p className="text-muted small mb-4">Access the EduTrace regulatory portal</p>

              {error && (
                <div className="alert alert-danger py-2 px-3 small d-flex align-items-center gap-2 mb-3">
                  <AlertCircle size={16} />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label className="form-label small fw-semibold text-secondary">Email Address</label>
                  <input
                    type="email"
                    className="form-control"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="mb-4">
                  <label className="form-label small fw-semibold text-secondary">Password</label>
                  <input
                    type="password"
                    className="form-control"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-primary-et w-100 py-2 d-flex align-items-center justify-content-center gap-2 fw-semibold"
                  disabled={loading}
                >
                  {loading ? 'Authenticating...' : 'Sign In to Portal'}
                  <ArrowRight size={16} />
                </button>
              </form>

              {/* Demo Personas for Judges */}
              <div className="mt-4 pt-3 border-top">
                <div className="text-muted small fw-semibold mb-2 text-uppercase" style={{ fontSize: '0.7rem' }}>
                  Quick Demo Accounts (1-Click Fill)
                </div>
                <div className="d-flex flex-column gap-2">
                  {DEMO_ACCOUNTS.map((acc) => (
                    <button
                      key={acc.role}
                      type="button"
                      className={`btn btn-sm text-start py-1 px-2 d-flex align-items-center justify-content-between ${
                        email === acc.email ? 'btn-primary' : 'btn-outline-secondary'
                      }`}
                      style={{ fontSize: '0.78rem' }}
                      onClick={() => handleSelectDemo(acc)}
                    >
                      <span>{acc.label}</span>
                      <span className="opacity-75">{acc.email.split('@')[0]}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
