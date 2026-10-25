import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  QrCode,
  ShieldCheck,
  CheckCircle,
  XCircle,
  Clock,
  Search,
  ExternalLink,
  Plus,
  RefreshCw,
} from 'lucide-react';
import api from '../api/client';

export default function VerifierDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchRef, setSearchRef] = useState('');
  const navigate = useNavigate();

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const res = await api.get('/dashboard/verifier');
      setData(res.data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load verifier dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const handleVerifySearch = (e) => {
    e?.preventDefault();
    if (searchRef.trim()) {
      window.open(`/verify/${searchRef.trim()}`, '_blank');
    }
  };

  if (loading) {
    return (
      <div className="d-flex align-items-center justify-content-center py-5">
        <div className="spinner-border text-primary" role="status"></div>
        <span className="ms-2 text-muted">Loading verifier workbench...</span>
      </div>
    );
  }

  const { kpis, recentActivity } = data || {};

  return (
    <div>
      {/* Header */}
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h4 className="fw-bold text-dark mb-1">Academic Verification Portal</h4>
          <p className="text-muted small mb-0">
            Privacy-preserving opaque QR verification without leaking raw student database records
          </p>
        </div>
        <div className="d-flex gap-2">
          <Link to="/verification" className="btn btn-sm btn-primary-et d-flex align-items-center gap-1">
            <Plus size={14} />
            <span>Create Verification QR Token</span>
          </Link>
          <button className="btn btn-sm btn-outline-secondary" onClick={fetchDashboard}>
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* Quick Lookup Bar */}
      <div className="card border-0 shadow-sm rounded-3 p-3 mb-4 bg-white">
        <form onSubmit={handleVerifySearch} className="row g-2 align-items-center">
          <div className="col-auto text-primary">
            <QrCode size={24} />
          </div>
          <div className="col-md-8 col-sm-7">
            <input
              type="text"
              className="form-control"
              placeholder="Enter opaque verification token reference (e.g. demo-verify-ref-2026)..."
              value={searchRef}
              onChange={(e) => setSearchRef(e.target.value)}
            />
          </div>
          <div className="col-auto">
            <button type="submit" className="btn btn-primary d-flex align-items-center gap-1">
              <Search size={15} />
              <span>Verify Reference</span>
            </button>
          </div>
        </form>
      </div>

      {/* KPI Cards */}
      <div className="row g-3 mb-4">
        <div className="col-sm-4">
          <div className="kpi-card">
            <div className="kpi-title">Active Verification Tokens</div>
            <div className="kpi-value text-success">{kpis?.activeTokens || 0}</div>
            <div className="small text-muted mt-1">Ready for Verification</div>
          </div>
        </div>

        <div className="col-sm-4">
          <div className="kpi-card">
            <div className="kpi-title">Expired Tokens</div>
            <div className="kpi-value text-warning">{kpis?.expiredTokens || 0}</div>
            <div className="small text-muted mt-1">Exceeded Validity Window</div>
          </div>
        </div>

        <div className="col-sm-4">
          <div className="kpi-card">
            <div className="kpi-title">Revoked Tokens</div>
            <div className="kpi-value text-danger">{kpis?.revokedTokens || 0}</div>
            <div className="small text-muted mt-1">Explicitly Inactive</div>
          </div>
        </div>
      </div>

      {/* Recent Verification Activity Table */}
      <div className="glass-card">
        <div className="glass-card-header">
          <h6 className="mb-0 fw-bold">Recent Verification Requests</h6>
          <Link to="/verification" className="small text-decoration-none">View All Tokens</Link>
        </div>
        <div className="table-responsive">
          <table className="et-table">
            <thead>
              <tr>
                <th>Student Masked APAAR</th>
                <th>Verification Purpose</th>
                <th>Status</th>
                <th>Expires At</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {recentActivity?.length > 0 ? (
                recentActivity.map((t) => (
                  <tr key={t.id}>
                    <td>
                      <span className="font-monospace fw-semibold">
                        {t.student?.apaarMasked || 'NOT REGISTERED'}
                      </span>
                    </td>
                    <td>
                      <span className="fw-medium text-dark">{t.purpose}</span>
                    </td>
                    <td>
                      <span className={`badge ${
                        t.status === 'ACTIVE'
                          ? 'bg-success-subtle text-success border border-success-subtle'
                          : t.status === 'EXPIRED'
                          ? 'bg-warning-subtle text-warning border border-warning-subtle'
                          : 'bg-danger-subtle text-danger'
                      }`}>
                        {t.status}
                      </span>
                    </td>
                    <td className="small text-muted">
                      {new Date(t.expiresAt).toLocaleDateString()}
                    </td>
                    <td>
                      <Link
                        to={`/verification?token=${t.id}`}
                        className="btn btn-xs btn-outline-primary py-1 px-2 d-inline-flex align-items-center gap-1"
                        style={{ fontSize: '0.75rem' }}
                      >
                        <span>Inspect QR</span>
                        <ExternalLink size={12} />
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="text-center py-4 text-muted small">
                    No active verification tokens found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
