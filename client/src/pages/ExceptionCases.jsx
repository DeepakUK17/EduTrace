import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  Clock,
  CheckCircle2,
  MessageSquare,
  UserCheck,
  Send,
  Plus,
  RefreshCw,
  Eye,
  ShieldAlert,
} from 'lucide-react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function ExceptionCases() {
  const { user, hasRole } = useAuth();
  const [cases, setCases] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  // Filters
  const [status, setStatus] = useState('');
  const [severity, setSeverity] = useState('');

  // Selected Case Detail
  const [activeCase, setActiveCase] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [commenting, setCommenting] = useState(false);

  // Status Update Modal
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [targetStatus, setTargetStatus] = useState('UNDER_REVIEW');
  const [resolutionCode, setResolutionCode] = useState('');
  const [resolutionNote, setResolutionNote] = useState('');
  const [transitioning, setTransitioning] = useState(false);

  const fetchCases = async () => {
    setLoading(true);
    try {
      const params = {};
      if (status) params.status = status;
      if (severity) params.severity = severity;
      const res = await api.get('/cases', { params });
      setCases(res.data.cases || []);
      setTotal(res.data.total || 0);
    } catch (err) {
      console.error('Failed to load exception cases:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCaseDetail = async (caseId) => {
    try {
      const res = await api.get(`/cases/${caseId}`);
      setActiveCase(res.data.case);
      setComments(res.data.case.comments || []);
    } catch (err) {
      console.error('Failed to load case detail:', err);
    }
  };

  useEffect(() => {
    fetchCases();
  }, [status, severity]);

  const handleSelectCase = (c) => {
    setActiveCase(c);
    fetchCaseDetail(c.id);
  };

  const handleAddComment = async (e) => {
    e?.preventDefault();
    if (!newComment.trim() || !activeCase) return;
    setCommenting(true);
    try {
      const res = await api.post(`/cases/${activeCase.id}/comments`, {
        content: newComment,
      });
      setComments((prev) => [...prev, res.data.comment]);
      setNewComment('');
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to add comment');
    } finally {
      setCommenting(false);
    }
  };

  const handleStatusTransition = async (e) => {
    e?.preventDefault();
    if (!activeCase) return;
    setTransitioning(true);
    try {
      await api.patch(`/cases/${activeCase.id}/status`, {
        status: targetStatus,
        resolutionCode,
        resolutionNote,
      });
      setShowStatusModal(false);
      fetchCaseDetail(activeCase.id);
      fetchCases();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update case status');
    } finally {
      setTransitioning(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h4 className="fw-bold text-dark mb-1">Exception Case Management (Resolve)</h4>
          <p className="text-muted small mb-0">
            Lifecycle tracking from detection to regulatory resolution with evidence timeline and accountability
          </p>
        </div>
        <button className="btn btn-sm btn-outline-secondary" onClick={fetchCases}>
          <RefreshCw size={14} />
        </button>
      </div>

      {/* Filter Strip */}
      <div className="card border-0 shadow-sm rounded-3 p-3 mb-4 bg-white">
        <div className="row g-2">
          <div className="col-md-4">
            <select
              className="form-select form-select-sm"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="">All Case Lifecycles</option>
              <option value="DETECTED">Detected</option>
              <option value="ASSIGNED">Assigned</option>
              <option value="UNDER_REVIEW">Under Review</option>
              <option value="AWAITING_CORRECTION">Awaiting Correction</option>
              <option value="RESOLVED">Resolved</option>
              <option value="ESCALATED">Escalated</option>
            </select>
          </div>

          <div className="col-md-4">
            <select
              className="form-select form-select-sm"
              value={severity}
              onChange={(e) => setSeverity(e.target.value)}
            >
              <option value="">All Severities</option>
              <option value="CRITICAL">Critical (Dual Enrolment / Excess Quota)</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* Two Column Layout: List on Left, Detail & Timeline on Right */}
      <div className="row g-4">
        <div className="col-lg-6">
          <div className="glass-card">
            <div className="glass-card-header">
              <h6 className="mb-0 fw-bold">Active Cases ({total})</h6>
              <span className="small text-muted">Click row to open timeline</span>
            </div>
            <div className="table-responsive">
              <table className="et-table">
                <thead>
                  <tr>
                    <th>Type / Title</th>
                    <th>Severity</th>
                    <th>Status</th>
                    <th>Assignee</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="4" className="text-center py-4">
                        <div className="spinner-border spinner-border-sm text-primary"></div>
                      </td>
                    </tr>
                  ) : cases.length > 0 ? (
                    cases.map((c) => (
                      <tr
                        key={c.id}
                        style={{ cursor: 'pointer', backgroundColor: activeCase?.id === c.id ? '#f1f5f9' : 'transparent' }}
                        onClick={() => handleSelectCase(c)}
                      >
                        <td>
                          <div className="fw-semibold text-dark small">{c.title}</div>
                          <div className="text-muted" style={{ fontSize: '0.68rem' }}>{c.type}</div>
                        </td>
                        <td>
                          <span className={`badge ${
                            c.severity === 'CRITICAL' ? 'bg-danger text-white' : 'bg-warning-subtle text-warning border border-warning-subtle'
                          }`} style={{ fontSize: '0.68rem' }}>
                            {c.severity}
                          </span>
                        </td>
                        <td>
                          <span className={`badge ${
                            c.status === 'RESOLVED' ? 'bg-success-subtle text-success' : 'bg-light text-dark border'
                          }`} style={{ fontSize: '0.68rem' }}>
                            {c.status}
                          </span>
                        </td>
                        <td className="small text-muted">
                          {c.assignedTo ? `${c.assignedTo.firstName} ${c.assignedTo.lastName}` : 'Unassigned'}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="text-center py-4 text-muted small">
                        No exception cases found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Detail Pane */}
        <div className="col-lg-6">
          {activeCase ? (
            <div className="glass-card p-4">
              <div className="d-flex align-items-center justify-content-between mb-3 border-bottom pb-2">
                <div>
                  <h6 className="fw-bold mb-1">{activeCase.title}</h6>
                  <span className="badge bg-light text-muted border font-monospace" style={{ fontSize: '0.68rem' }}>
                    ID: {activeCase.id}
                  </span>
                </div>

                {hasRole('PLATFORM_ADMIN', 'INSTITUTION_ADMIN') && (
                  <button
                    className="btn btn-sm btn-primary-et"
                    onClick={() => setShowStatusModal(true)}
                  >
                    Change Status
                  </button>
                )}
              </div>

              <p className="text-secondary small mb-3">{activeCase.description}</p>

              {/* Case Metadata */}
              <div className="p-3 bg-light rounded border mb-4 small">
                <div className="row g-2">
                  <div className="col-6">
                    <span className="text-muted">Type:</span> <strong>{activeCase.type}</strong>
                  </div>
                  <div className="col-6">
                    <span className="text-muted">Current Status:</span> <strong>{activeCase.status}</strong>
                  </div>
                  <div className="col-6">
                    <span className="text-muted">Assigned Reviewer:</span>{' '}
                    <span>{activeCase.assignedTo ? `${activeCase.assignedTo.firstName} ${activeCase.assignedTo.lastName}` : 'Unassigned'}</span>
                  </div>
                  <div className="col-6">
                    <span className="text-muted">Target Due Date:</span>{' '}
                    <span>{activeCase.dueDate ? new Date(activeCase.dueDate).toLocaleDateString() : 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Comments / Audit Notes Thread */}
              <h6 className="fw-bold small mb-2 d-flex align-items-center gap-1">
                <MessageSquare size={14} />
                <span>Evidence & Review Notes Thread</span>
              </h6>

              <div className="p-2 border rounded bg-white mb-3" style={{ maxHeight: 220, overflowY: 'auto' }}>
                {comments.length > 0 ? (
                  comments.map((cm) => (
                    <div key={cm.id} className="p-2 border-bottom mb-2 small">
                      <div className="d-flex justify-content-between text-muted" style={{ fontSize: '0.7rem' }}>
                        <strong>{cm.author ? `${cm.author.firstName} ${cm.author.lastName}` : 'Reviewer'}</strong>
                        <span>{new Date(cm.createdAt).toLocaleString()}</span>
                      </div>
                      <div className="mt-1">{cm.content}</div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-3 text-muted small">No comments logged yet.</div>
                )}
              </div>

              {/* Add Comment Form */}
              <form onSubmit={handleAddComment} className="d-flex gap-2">
                <input
                  type="text"
                  className="form-control form-control-sm"
                  placeholder="Add note or evidence reference..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  disabled={commenting}
                />
                <button type="submit" className="btn btn-sm btn-primary" disabled={!newComment.trim() || commenting}>
                  <Send size={14} />
                </button>
              </form>
            </div>
          ) : (
            <div className="glass-card h-100 p-5 text-center d-flex flex-column align-items-center justify-content-center text-muted small">
              <AlertTriangle size={40} className="opacity-50 mb-2" />
              <span>Select an exception case on the left to review its lifecycle and audit history.</span>
            </div>
          )}
        </div>
      </div>

      {/* Status Transition Modal */}
      {showStatusModal && activeCase && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow">
              <div className="modal-header">
                <h5 className="modal-title fw-bold">Transition Case Lifecycle</h5>
                <button type="button" className="btn-close" onClick={() => setShowStatusModal(false)}></button>
              </div>

              <form onSubmit={handleStatusTransition}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label small fw-semibold">Target Status</label>
                    <select
                      className="form-select form-select-sm"
                      value={targetStatus}
                      onChange={(e) => setTargetStatus(e.target.value)}
                    >
                      <option value="UNDER_REVIEW">UNDER_REVIEW (Active Investigation)</option>
                      <option value="AWAITING_CORRECTION">AWAITING_CORRECTION (Institution Action Required)</option>
                      <option value="RESOLVED">RESOLVED (Complaint Closed / Compliant)</option>
                      <option value="REJECTED">REJECTED (Admission Disallowed)</option>
                      <option value="ESCALATED">ESCALATED (Referred to Central AICTE Committee)</option>
                      <option value="FALSE_POSITIVE">FALSE_POSITIVE (Erroneous Trigger)</option>
                    </select>
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-semibold">Audit Rationale Note *</label>
                    <textarea
                      className="form-control form-control-sm"
                      rows="3"
                      required
                      placeholder="Explain regulatory justification for this lifecycle transition..."
                      value={resolutionNote}
                      onChange={(e) => setResolutionNote(e.target.value)}
                    ></textarea>
                  </div>
                </div>

                <div className="modal-footer">
                  <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => setShowStatusModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-sm btn-primary-et" disabled={transitioning}>
                    {transitioning ? 'Saving...' : 'Confirm Transition'}
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
