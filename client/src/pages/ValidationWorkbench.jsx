import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Filter,
  Play,
  Search,
  Check,
  X,
  RefreshCw,
  Eye,
  Info,
  ArrowRight,
} from 'lucide-react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function ValidationWorkbench() {
  const { hasRole } = useAuth();
  const [issues, setIssues] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(15);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [runMessage, setRunMessage] = useState('');

  // Filters
  const [severity, setSeverity] = useState('');
  const [status, setStatus] = useState('OPEN');
  const [ruleCode, setRuleCode] = useState('');
  const [search, setSearch] = useState('');

  // Guided Resolution Modal
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [resolutionNote, setResolutionNote] = useState('');
  const [resolving, setResolving] = useState(false);

  const fetchIssues = async () => {
    setLoading(true);
    try {
      const params = { page, limit };
      if (severity) params.severity = severity;
      if (status) params.status = status;
      if (ruleCode) params.ruleCode = ruleCode;
      if (search) params.search = search;

      const res = await api.get('/validation/issues', { params });
      setIssues(res.data.issues || []);
      setTotal(res.data.total || 0);
    } catch (err) {
      console.error('Error fetching validation issues:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIssues();
  }, [page, severity, status, ruleCode]);

  const handleRunValidation = async () => {
    setRunning(true);
    setRunMessage('');
    try {
      const res = await api.post('/validation/run', {});
      setRunMessage(res.data.message || 'Validation engine completed successfully');
      fetchIssues();
    } catch (err) {
      setRunMessage(err.response?.data?.error || 'Validation run failed');
    } finally {
      setRunning(false);
    }
  };

  const handleResolveIssue = async (resolutionStatus) => {
    if (!selectedIssue) return;
    setResolving(true);
    try {
      await api.patch(`/validation/issues/${selectedIssue.id}`, {
        status: resolutionStatus,
        resolutionNote: resolutionNote || `Marked as ${resolutionStatus} via Validation Workbench`,
      });
      setSelectedIssue(null);
      setResolutionNote('');
      fetchIssues();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update issue');
    } finally {
      setResolving(false);
    }
  };

  const getSeverityBadgeClass = (sev) => {
    switch (sev) {
      case 'CRITICAL': return 'bg-danger text-white';
      case 'HIGH': return 'bg-danger-subtle text-danger border border-danger-subtle';
      case 'MEDIUM': return 'bg-warning-subtle text-warning border border-warning-subtle';
      case 'LOW': return 'bg-info-subtle text-info border border-info-subtle';
      default: return 'bg-light text-muted border';
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h4 className="fw-bold text-dark mb-1">Validation & Compliance Workbench</h4>
          <p className="text-muted small mb-0">
            Automated multi-layer rules engine: Predict inconsistencies • Explain regulatory impact • Guided resolution
          </p>
        </div>
        <div className="d-flex gap-2">
          {hasRole('PLATFORM_ADMIN', 'INSTITUTION_ADMIN') && (
            <button
              className="btn btn-sm btn-primary-et d-flex align-items-center gap-1"
              onClick={handleRunValidation}
              disabled={running}
            >
              <Play size={14} />
              <span>{running ? 'Evaluating Rules...' : 'Run Engine Scan'}</span>
            </button>
          )}
          <button className="btn btn-sm btn-outline-secondary" onClick={fetchIssues}>
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {runMessage && (
        <div className="alert alert-info py-2 px-3 small d-flex align-items-center gap-2 mb-4">
          <Info size={16} />
          <span>{runMessage}</span>
        </div>
      )}

      {/* Filter Strip */}
      <div className="card border-0 shadow-sm rounded-3 p-3 mb-4 bg-white">
        <div className="row g-2 align-items-center">
          <div className="col-md-3">
            <select
              className="form-select form-select-sm"
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All Statuses</option>
              <option value="OPEN">Open (Requires Action)</option>
              <option value="UNDER_REVIEW">Under Review</option>
              <option value="RESOLVED">Resolved</option>
              <option value="FALSE_POSITIVE">False Positive</option>
            </select>
          </div>

          <div className="col-md-3">
            <select
              className="form-select form-select-sm"
              value={severity}
              onChange={(e) => {
                setSeverity(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All Severities</option>
              <option value="CRITICAL">Critical (Intake Exceeded / Cross-Dup)</option>
              <option value="HIGH">High (Invalid Format / Required Missing)</option>
              <option value="MEDIUM">Medium (Missing APAAR / Year Mismatch)</option>
              <option value="LOW">Low (Variance)</option>
            </select>
          </div>

          <div className="col-md-3">
            <select
              className="form-select form-select-sm"
              value={ruleCode}
              onChange={(e) => {
                setRuleCode(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All Validation Rules</option>
              <option value="FMT-01">FMT-01 (Missing APAAR)</option>
              <option value="FMT-02">FMT-02 (Invalid APAAR Format)</option>
              <option value="DUP-01">DUP-01 (Intra-Institution Duplicate)</option>
              <option value="DUP-02">DUP-02 (Cross-Institution Duplicate)</option>
              <option value="CAP-01">CAP-01 (Approved Intake Exceeded)</option>
              <option value="CAP-02">CAP-02 (NRI Quota Exceeded)</option>
            </select>
          </div>

          <div className="col-md-3">
            <input
              type="text"
              className="form-control form-control-sm"
              placeholder="Search explanation or student..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchIssues()}
            />
          </div>
        </div>
      </div>

      {/* Issues Table */}
      <div className="glass-card mb-4">
        <div className="glass-card-header">
          <div className="fw-semibold small">
            Showing <span className="fw-bold text-dark">{issues.length}</span> of {total} findings
          </div>
          <div className="text-muted small">AICTE Rule Grounded • Traceable to Version</div>
        </div>

        <div className="table-responsive">
          <table className="et-table">
            <thead>
              <tr>
                <th>Rule Code</th>
                <th>Student / Record</th>
                <th>Severity</th>
                <th>Plain-English Explanation (Explain)</th>
                <th>Recommended Action</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" className="text-center py-5">
                    <div className="spinner-border spinner-border-sm text-primary"></div>
                    <span className="ms-2 text-muted small">Loading validation findings...</span>
                  </td>
                </tr>
              ) : issues.length > 0 ? (
                issues.map((iss) => (
                  <tr key={iss.id}>
                    <td>
                      <div className="fw-bold font-monospace text-primary">{iss.rule?.code}</div>
                      <div className="text-muted" style={{ fontSize: '0.68rem' }}>{iss.ruleVersion}</div>
                    </td>
                    <td>
                      <div className="fw-semibold text-dark">
                        {iss.enrollment?.firstName} {iss.enrollment?.lastName}
                      </div>
                      <div className="text-muted small font-monospace">
                        {iss.enrollment?.institutionStudentId} • {iss.enrollment?.institution?.code}
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${getSeverityBadgeClass(iss.severity)}`} style={{ fontSize: '0.7rem' }}>
                        {iss.severity}
                      </span>
                    </td>
                    <td style={{ maxWidth: 300 }}>
                      <div className="small text-secondary" style={{ lineHeight: 1.4 }}>
                        {iss.explanation}
                      </div>
                    </td>
                    <td style={{ maxWidth: 220 }}>
                      <div className="small text-muted" style={{ fontSize: '0.78rem' }}>
                        {iss.recommendedAction || 'Update record to comply with rule.'}
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${
                        iss.status === 'RESOLVED'
                          ? 'bg-success-subtle text-success border border-success-subtle'
                          : iss.status === 'OPEN'
                          ? 'bg-warning-subtle text-warning border border-warning-subtle'
                          : 'bg-light text-muted border'
                      }`}>
                        {iss.status}
                      </span>
                    </td>
                    <td>
                      <div className="d-flex align-items-center gap-1">
                        <button
                          className="btn btn-xs btn-outline-primary py-1 px-2"
                          style={{ fontSize: '0.72rem' }}
                          onClick={() => setSelectedIssue(iss)}
                        >
                          Resolve
                        </button>
                        {iss.enrollment?.id && (
                          <Link
                            to={`/students/${iss.enrollment.id}`}
                            className="btn btn-xs btn-outline-secondary py-1 px-2"
                            style={{ fontSize: '0.72rem' }}
                            title="Inspect Student Profile"
                          >
                            <Eye size={12} />
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="text-center py-5 text-muted small">
                    No active validation issues match the selected filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Guided Data-Correction Modal */}
      {selectedIssue && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow">
              <div className="modal-header">
                <div>
                  <h6 className="modal-title fw-bold">Guided Data-Correction Assistant</h6>
                  <span className="badge bg-primary-subtle text-primary border border-primary-subtle font-monospace" style={{ fontSize: '0.7rem' }}>
                    {selectedIssue.rule?.code} — {selectedIssue.rule?.name}
                  </span>
                </div>
                <button type="button" className="btn-close" onClick={() => setSelectedIssue(null)}></button>
              </div>

              <div className="modal-body">
                <div className="p-3 bg-light rounded border mb-3">
                  <div className="fw-semibold small text-dark mb-1">Regulatory Finding:</div>
                  <p className="text-muted small mb-2">{selectedIssue.explanation}</p>
                  <div className="small text-primary">
                    <strong>Recommended Action:</strong> {selectedIssue.recommendedAction}
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label small fw-semibold">Resolution Justification / Audit Note</label>
                  <textarea
                    className="form-control form-control-sm"
                    rows="3"
                    placeholder="Provide justification or reference supporting documentary evidence..."
                    value={resolutionNote}
                    onChange={(e) => setResolutionNote(e.target.value)}
                  ></textarea>
                </div>
              </div>

              <div className="modal-footer d-flex justify-content-between">
                <button
                  type="button"
                  className="btn btn-sm btn-outline-danger"
                  onClick={() => handleResolveIssue('FALSE_POSITIVE')}
                  disabled={resolving}
                >
                  Mark False Positive
                </button>

                <div className="d-flex gap-2">
                  <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => setSelectedIssue(null)}>
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm btn-success"
                    onClick={() => handleResolveIssue('RESOLVED')}
                    disabled={resolving}
                  >
                    {resolving ? 'Recording...' : 'Mark Resolved'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
