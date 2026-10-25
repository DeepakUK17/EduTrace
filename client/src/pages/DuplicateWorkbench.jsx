import React, { useState, useEffect } from 'react';
import {
  Copy,
  AlertTriangle,
  CheckCircle2,
  GitCompare,
  ArrowRight,
  ShieldAlert,
  Info,
  RefreshCw,
} from 'lucide-react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function DuplicateWorkbench() {
  const { hasRole } = useAuth();
  const [duplicates, setDuplicates] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [dispositionFilter, setDispositionFilter] = useState('');
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [disposition, setDisposition] = useState('CONFIRMED_DUPLICATE');
  const [dispositionNote, setDispositionNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchDuplicates = async () => {
    setLoading(true);
    try {
      const params = {};
      if (dispositionFilter) params.disposition = dispositionFilter;
      const res = await api.get('/duplicates', { params });
      setDuplicates(res.data.duplicates || []);
      setTotal(res.data.total || 0);
    } catch (err) {
      console.error('Failed to load duplicate matches:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDuplicates();
  }, [dispositionFilter]);

  const handleRecordDisposition = async (e) => {
    e?.preventDefault();
    if (!selectedMatch) return;
    if (!dispositionNote.trim()) {
      alert('Please enter a disposition note explaining the reasoning.');
      return;
    }

    setSubmitting(true);
    try {
      await api.post(`/duplicates/${selectedMatch.id}/disposition`, {
        disposition,
        dispositionNote,
      });
      setSelectedMatch(null);
      setDispositionNote('');
      fetchDuplicates();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to record disposition');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h4 className="fw-bold text-dark mb-1">Duplicate Detection & Review Workbench</h4>
          <p className="text-muted small mb-0">
            HMAC token-based exact match & cross-institution conflict resolution with evidence comparison
          </p>
        </div>
        <button className="btn btn-sm btn-outline-secondary" onClick={fetchDuplicates}>
          <RefreshCw size={14} />
        </button>
      </div>

      {/* Filter strip */}
      <div className="card border-0 shadow-sm rounded-3 p-3 mb-4 bg-white">
        <div className="row g-2 align-items-center">
          <div className="col-md-4">
            <select
              className="form-select form-select-sm"
              value={dispositionFilter}
              onChange={(e) => setDispositionFilter(e.target.value)}
            >
              <option value="">All Review Dispositions</option>
              <option value="PENDING_REVIEW">Pending Review</option>
              <option value="CONFIRMED_DUPLICATE">Confirmed Duplicate</option>
              <option value="LEGITIMATE_TRANSFER">Legitimate Transfer</option>
              <option value="NOT_A_MATCH">Not A Match</option>
              <option value="NEEDS_ESCALATION">Needs Escalation</option>
            </select>
          </div>
          <div className="col-md-8 text-end text-muted small">
            Cross-institution duplicate details are privileged to AICTE Regulation Bureau reviewers.
          </div>
        </div>
      </div>

      {/* Matches Grid */}
      <div className="row g-4">
        {loading ? (
          <div className="col-12 text-center py-5">
            <div className="spinner-border text-primary"></div>
            <div className="text-muted small mt-2">Loading candidate duplicates...</div>
          </div>
        ) : duplicates.length > 0 ? (
          duplicates.map((dup) => {
            const enrollA = dup.recordA?.enrollments?.[0];
            const enrollB = dup.recordB?.enrollments?.[0];

            return (
              <div key={dup.id} className="col-12">
                <div className="glass-card">
                  <div className="glass-card-header">
                    <div className="d-flex align-items-center gap-2">
                      <span className={`badge ${
                        dup.isCrossInstitution
                          ? 'bg-danger text-white'
                          : 'bg-warning-subtle text-warning border border-warning-subtle'
                      }`}>
                        {dup.matchType}
                      </span>
                      <span className="fw-semibold text-dark small">
                        {dup.isCrossInstitution ? 'Cross-Institution Conflict' : 'Intra-Institution Duplicate'}
                      </span>
                    </div>

                    <div className="d-flex align-items-center gap-2">
                      <span className={`badge ${
                        dup.disposition === 'PENDING_REVIEW'
                          ? 'bg-warning-subtle text-warning border border-warning-subtle'
                          : 'bg-success-subtle text-success border border-success-subtle'
                      }`}>
                        {dup.disposition}
                      </span>
                      <button
                        className="btn btn-sm btn-primary-et"
                        onClick={() => {
                          setSelectedMatch(dup);
                          setDisposition('CONFIRMED_DUPLICATE');
                          setDispositionNote('');
                        }}
                      >
                        Review & Decide
                      </button>
                    </div>
                  </div>

                  {/* Side-by-Side Comparison Grid */}
                  <div className="p-3">
                    <div className="row g-3">
                      {/* Record A */}
                      <div className="col-md-6">
                        <div className="p-3 rounded-3 border bg-light h-100">
                          <div className="text-uppercase small fw-bold text-primary mb-2">
                            Record A: {enrollA?.institution?.name || 'Institution A'}
                          </div>
                          <div className="d-flex flex-column gap-1 small">
                            <div>
                              <span className="text-muted">Student Name:</span>{' '}
                              <strong>{enrollA?.firstName} {enrollA?.lastName}</strong>
                            </div>
                            <div>
                              <span className="text-muted">Roll No:</span>{' '}
                              <span className="font-monospace">{enrollA?.institutionStudentId}</span>
                            </div>
                            <div>
                              <span className="text-muted">Masked APAAR:</span>{' '}
                              <span className="font-monospace text-primary">{dup.recordA?.apaarMasked}</span>
                            </div>
                            <div>
                              <span className="text-muted">Programme:</span>{' '}
                              <span>{enrollA?.programme?.name}</span>
                            </div>
                            <div>
                              <span className="text-muted">Academic Session:</span>{' '}
                              <span>{enrollA?.academicYear?.label}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Record B */}
                      <div className="col-md-6">
                        <div className="p-3 rounded-3 border bg-light h-100">
                          <div className="text-uppercase small fw-bold text-danger mb-2">
                            Record B: {enrollB?.institution?.name || 'Institution B'}
                          </div>
                          <div className="d-flex flex-column gap-1 small">
                            <div>
                              <span className="text-muted">Student Name:</span>{' '}
                              <strong>{enrollB?.firstName} {enrollB?.lastName}</strong>
                            </div>
                            <div>
                              <span className="text-muted">Roll No:</span>{' '}
                              <span className="font-monospace">{enrollB?.institutionStudentId}</span>
                            </div>
                            <div>
                              <span className="text-muted">Masked APAAR:</span>{' '}
                              <span className="font-monospace text-danger">{dup.recordB?.apaarMasked}</span>
                            </div>
                            <div>
                              <span className="text-muted">Programme:</span>{' '}
                              <span>{enrollB?.programme?.name}</span>
                            </div>
                            <div>
                              <span className="text-muted">Academic Session:</span>{' '}
                              <span>{enrollB?.academicYear?.label}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {dup.dispositionNote && (
                      <div className="mt-3 p-2 bg-light rounded small border">
                        <strong>Review Note:</strong> {dup.dispositionNote}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-12 text-center py-5 text-muted small">
            No duplicate records detected under current filter.
          </div>
        )}
      </div>

      {/* Review Modal */}
      {selectedMatch && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow">
              <div className="modal-header">
                <h5 className="modal-title fw-bold">Duplicate Match Disposition</h5>
                <button type="button" className="btn-close" onClick={() => setSelectedMatch(null)}></button>
              </div>

              <form onSubmit={handleRecordDisposition}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label small fw-semibold">Disposition Decision *</label>
                    <select
                      className="form-select form-select-sm"
                      value={disposition}
                      onChange={(e) => setDisposition(e.target.value)}
                    >
                      <option value="CONFIRMED_DUPLICATE">CONFIRMED DUPLICATE (Simultaneous Regular Enrollment)</option>
                      <option value="LEGITIMATE_TRANSFER">LEGITIMATE TRANSFER (Student migrated with TC)</option>
                      <option value="NOT_A_MATCH">NOT A MATCH (Distinct Students)</option>
                      <option value="NEEDS_ESCALATION">NEEDS ESCALATION (Refer to AICTE Bureau)</option>
                      <option value="FALSE_POSITIVE">FALSE POSITIVE (System Artifact)</option>
                    </select>
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-semibold">Justification / Audit Note *</label>
                    <textarea
                      className="form-control form-control-sm"
                      rows="3"
                      placeholder="Explain your finding and evidence inspected..."
                      required
                      value={dispositionNote}
                      onChange={(e) => setDispositionNote(e.target.value)}
                    ></textarea>
                  </div>
                </div>

                <div className="modal-footer">
                  <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => setSelectedMatch(null)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-sm btn-primary-et" disabled={submitting}>
                    {submitting ? 'Recording...' : 'Commit Disposition'}
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
