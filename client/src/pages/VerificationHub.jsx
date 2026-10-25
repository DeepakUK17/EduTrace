import React, { useState, useEffect } from 'react';
import {
  QrCode,
  ShieldCheck,
  Plus,
  Copy,
  ExternalLink,
  Download,
  XCircle,
  CheckCircle,
  Clock,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function VerificationHub() {
  const { user, hasRole } = useAuth();
  const [tokens, setTokens] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  // Create Token Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [students, setStudents] = useState([]);
  const [studentId, setStudentId] = useState('');
  const [purpose, setPurpose] = useState('Employment Verification — Background Check');
  const [expiresInDays, setExpiresInDays] = useState(30);
  const [isSingleUse, setIsSingleUse] = useState(false);
  const [permittedFields, setPermittedFields] = useState([
    'name',
    'institution',
    'programme',
    'academicYear',
    'apaarStatus',
    'apaarMasked',
    'verificationNote',
  ]);
  const [creating, setCreating] = useState(false);
  const [createdQr, setCreatedQr] = useState(null);

  const fetchTokens = async () => {
    setLoading(true);
    try {
      const res = await api.get('/verification-tokens');
      setTokens(res.data.tokens || []);
      setTotal(res.data.total || 0);
    } catch (err) {
      console.error('Failed to load verification tokens:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadStudents = async () => {
    try {
      const res = await api.get('/students', { params: { limit: 50 } });
      const list = res.data.enrollments || [];
      setStudents(list);
      if (list.length > 0) setStudentId(list[0].student?.id || '');
    } catch (err) {
      console.error('Failed to load students:', err);
    }
  };

  useEffect(() => {
    fetchTokens();
    loadStudents();
  }, []);

  const handleCreateToken = async (e) => {
    e?.preventDefault();
    if (!studentId) return;
    setCreating(true);

    try {
      const res = await api.post('/verification-tokens', {
        studentId,
        purpose,
        permittedFields,
        expiresInDays: Number(expiresInDays),
        isSingleUse,
      });
      setCreatedQr(res.data);
      setShowCreateModal(false);
      fetchTokens();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to create verification token');
    } finally {
      setCreating(false);
    }
  };

  const handleRevoke = async (tokenId) => {
    if (!confirm('Are you sure you want to revoke this verification token immediately?')) return;
    try {
      await api.post(`/verification-tokens/${tokenId}/revoke`);
      fetchTokens();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to revoke token');
    }
  };

  const toggleField = (f) => {
    if (permittedFields.includes(f)) {
      setPermittedFields(permittedFields.filter((item) => item !== f));
    } else {
      setPermittedFields([...permittedFields, f]);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h4 className="fw-bold text-dark mb-1">Privacy-Preserving Verification Hub</h4>
          <p className="text-muted small mb-0">
            Generate revocable, time-bound, or single-use opaque QR references without exposing raw database records
          </p>
        </div>
        <div className="d-flex gap-2">
          <button
            className="btn btn-sm btn-primary-et d-flex align-items-center gap-1"
            onClick={() => setShowCreateModal(true)}
          >
            <Plus size={14} />
            <span>Issue New QR Token</span>
          </button>
          <button className="btn btn-sm btn-outline-secondary" onClick={fetchTokens}>
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* Newly Created QR Display Banner */}
      {createdQr && (
        <div className="card border-0 shadow-sm rounded-3 p-4 mb-4 bg-white border-start border-4 border-success">
          <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
            <div className="d-flex align-items-center gap-4">
              <img
                src={createdQr.qrCode}
                alt="Verification QR Code"
                style={{ width: 120, height: 120, borderRadius: 8, border: '1px solid #e2e8f0' }}
              />
              <div>
                <span className="badge bg-success-subtle text-success border border-success-subtle mb-1">
                  Active QR Verification Reference
                </span>
                <h5 className="fw-bold mb-1">Opaque Token Reference Generated</h5>
                <div className="text-muted small mb-2 font-monospace">
                  {createdQr.token?.tokenRef}
                </div>
                <div className="d-flex gap-2">
                  <a
                    href={`/verify/${createdQr.token?.tokenRef}`}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-sm btn-outline-primary d-inline-flex align-items-center gap-1 py-1"
                  >
                    <span>Test Verify URL</span>
                    <ExternalLink size={13} />
                  </a>
                  <button
                    className="btn btn-sm btn-outline-secondary py-1"
                    onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}/verify/${createdQr.token?.tokenRef}`);
                      alert('Copied verification URL to clipboard!');
                    }}
                  >
                    Copy Link
                  </button>
                </div>
              </div>
            </div>
            <button className="btn btn-sm btn-link text-muted" onClick={() => setCreatedQr(null)}>
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Active Tokens Table */}
      <div className="glass-card mb-4">
        <div className="glass-card-header">
          <h6 className="mb-0 fw-bold">Active & Historical Verification Tokens ({total})</h6>
          <span className="text-muted small">Opaque QR URL contains NO student PII</span>
        </div>

        <div className="table-responsive">
          <table className="et-table">
            <thead>
              <tr>
                <th>Student Masked APAAR</th>
                <th>Verification Purpose</th>
                <th>Permitted Disclosures</th>
                <th>Validity Mode</th>
                <th>Expires</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" className="text-center py-5">
                    <div className="spinner-border spinner-border-sm text-primary"></div>
                  </td>
                </tr>
              ) : tokens.length > 0 ? (
                tokens.map((t) => (
                  <tr key={t.id}>
                    <td>
                      <span className="font-monospace fw-semibold">
                        {t.student?.apaarMasked || 'NOT REGISTERED'}
                      </span>
                    </td>
                    <td>
                      <div className="fw-medium text-dark small">{t.purpose}</div>
                      <div className="text-muted" style={{ fontSize: '0.68rem' }}>By: {t.createdBy?.firstName}</div>
                    </td>
                    <td>
                      <span className="badge bg-light text-muted border" style={{ fontSize: '0.68rem' }}>
                        {t.permittedFields?.length || 0} fields permitted
                      </span>
                    </td>
                    <td>
                      <span className="small text-muted">
                        {t.isSingleUse ? 'Single-Use' : 'Multi-Use'}
                      </span>
                    </td>
                    <td className="small text-muted">
                      {new Date(t.expiresAt).toLocaleDateString()}
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
                    <td>
                      <div className="d-flex align-items-center gap-1">
                        <a
                          href={`/verify/${t.tokenRef || t.id}`}
                          target="_blank"
                          rel="noreferrer"
                          className="btn btn-xs btn-outline-primary py-1 px-2 d-inline-flex align-items-center gap-1"
                          style={{ fontSize: '0.72rem' }}
                        >
                          <span>Test</span>
                          <ExternalLink size={11} />
                        </a>

                        {t.status === 'ACTIVE' && (
                          <button
                            className="btn btn-xs btn-outline-danger py-1 px-2"
                            style={{ fontSize: '0.72rem' }}
                            onClick={() => handleRevoke(t.id)}
                          >
                            Revoke
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="text-center py-4 text-muted small">
                    No verification tokens generated yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Token Modal */}
      {showCreateModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow">
              <div className="modal-header">
                <h5 className="modal-title fw-bold">Issue Privacy-Preserving QR Token</h5>
                <button type="button" className="btn-close" onClick={() => setShowCreateModal(false)}></button>
              </div>

              <form onSubmit={handleCreateToken}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label small fw-semibold">Select Student *</label>
                    <select
                      className="form-select form-select-sm"
                      value={studentId}
                      onChange={(e) => setStudentId(e.target.value)}
                      required
                    >
                      {students.map((st) => (
                        <option key={st.id} value={st.student?.id}>
                          {st.firstName} {st.lastName} ({st.institutionStudentId}) — {st.student?.apaarMasked}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-semibold">Verification Purpose *</label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      value={purpose}
                      onChange={(e) => setPurpose(e.target.value)}
                      required
                    />
                  </div>

                  <div className="row g-2 mb-3">
                    <div className="col-6">
                      <label className="form-label small fw-semibold">Validity Window</label>
                      <select
                        className="form-select form-select-sm"
                        value={expiresInDays}
                        onChange={(e) => setExpiresInDays(e.target.value)}
                      >
                        <option value={7}>7 Days</option>
                        <option value={30}>30 Days</option>
                        <option value={90}>90 Days</option>
                        <option value={365}>1 Year</option>
                      </select>
                    </div>

                    <div className="col-6 d-flex align-items-end">
                      <div className="form-check mb-1">
                        <input
                          type="checkbox"
                          className="form-check-input"
                          id="singleUseCheck"
                          checked={isSingleUse}
                          onChange={(e) => setIsSingleUse(e.target.checked)}
                        />
                        <label className="form-check-label small" htmlFor="singleUseCheck">
                          Single-Use Only (Burn on verify)
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="mb-2">
                    <label className="form-label small fw-semibold">Permitted Data Disclosures (Zero-Knowledge Limit)</label>
                    <div className="d-flex flex-column gap-1 p-2 bg-light rounded border small">
                      {[
                        { key: 'name', label: 'Student Full Name' },
                        { key: 'institution', label: 'AICTE Institution Name' },
                        { key: 'programme', label: 'Enrolled Degree Programme' },
                        { key: 'academicYear', label: 'Academic Session Year' },
                        { key: 'apaarStatus', label: 'APAAR Identity Status' },
                        { key: 'apaarMasked', label: 'Masked APAAR ID' },
                        { key: 'admissionCategory', label: 'Admission Category Quota' },
                      ].map((field) => (
                        <div key={field.key} className="form-check">
                          <input
                            type="checkbox"
                            className="form-check-input"
                            id={`field-${field.key}`}
                            checked={permittedFields.includes(field.key)}
                            onChange={() => toggleField(field.key)}
                          />
                          <label className="form-check-label" htmlFor={`field-${field.key}`}>
                            {field.label}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="modal-footer">
                  <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => setShowCreateModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-sm btn-primary-et" disabled={creating}>
                    {creating ? 'Generating QR...' : 'Generate QR Verification Reference'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
