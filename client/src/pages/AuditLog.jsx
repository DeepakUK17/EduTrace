import React, { useState, useEffect } from 'react';
import {
  History,
  ShieldCheck,
  Search,
  Filter,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Eye,
} from 'lucide-react';
import api from '../api/client';

export default function AuditLog() {
  const [events, setEvents] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [loading, setLoading] = useState(true);

  // Filters
  const [action, setAction] = useState('');
  const [entityType, setEntityType] = useState('');
  const [selectedDiff, setSelectedDiff] = useState(null);

  const fetchAuditEvents = async () => {
    setLoading(true);
    try {
      const params = { page, limit };
      if (action) params.action = action;
      if (entityType) params.entityType = entityType;

      const res = await api.get('/reports/audit-events', { params });
      setEvents(res.data.events || []);
      setTotal(res.data.total || 0);
    } catch (err) {
      console.error('Failed to load audit events:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditEvents();
  }, [page, action, entityType]);

  const totalPages = Math.ceil(total / limit) || 1;

  return (
    <div>
      {/* Header */}
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h4 className="fw-bold text-dark mb-1">Append-Only Audit Trail & Provenance</h4>
          <p className="text-muted small mb-0">
            Immutable log of all user logins, student mutations, validation executions, and regulatory dispositions
          </p>
        </div>
        <button className="btn btn-sm btn-outline-secondary" onClick={fetchAuditEvents}>
          <RefreshCw size={14} />
        </button>
      </div>

      {/* Filter strip */}
      <div className="card border-0 shadow-sm rounded-3 p-3 mb-4 bg-white">
        <div className="row g-2">
          <div className="col-md-4">
            <select
              className="form-select form-select-sm"
              value={action}
              onChange={(e) => {
                setAction(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All Audited Actions</option>
              <option value="USER_LOGIN">USER_LOGIN</option>
              <option value="STUDENT_CREATED">STUDENT_CREATED</option>
              <option value="ENROLLMENT_UPDATED">ENROLLMENT_UPDATED</option>
              <option value="VALIDATION_RUN">VALIDATION_RUN</option>
              <option value="VALIDATION_ISSUE_RESOLVED">VALIDATION_ISSUE_RESOLVED</option>
              <option value="DUPLICATE_DISPOSITION_RECORDED">DUPLICATE_DISPOSITION_RECORDED</option>
              <option value="CASE_STATUS_CHANGED">CASE_STATUS_CHANGED</option>
              <option value="INTAKE_RULE_PUBLISHED">INTAKE_RULE_PUBLISHED</option>
            </select>
          </div>

          <div className="col-md-4">
            <select
              className="form-select form-select-sm"
              value={entityType}
              onChange={(e) => {
                setEntityType(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All Entity Types</option>
              <option value="Student">Student</option>
              <option value="Enrollment">Enrollment</option>
              <option value="ValidationIssue">ValidationIssue</option>
              <option value="DuplicateMatch">DuplicateMatch</option>
              <option value="ExceptionCase">ExceptionCase</option>
              <option value="IntakeConfiguration">IntakeConfiguration</option>
              <option value="User">User</option>
            </select>
          </div>
        </div>
      </div>

      {/* Events Table */}
      <div className="glass-card mb-4">
        <div className="glass-card-header">
          <h6 className="mb-0 fw-bold">Audit Event Ledger ({total} events)</h6>
          <span className="small text-muted">DPDP-Compliant Content Masking</span>
        </div>

        <div className="table-responsive">
          <table className="et-table">
            <thead>
              <tr>
                <th>Action</th>
                <th>Actor & Role</th>
                <th>Entity Type</th>
                <th>Entity ID</th>
                <th>Reason / Summary</th>
                <th>Diff</th>
                <th>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" className="text-center py-5">
                    <div className="spinner-border spinner-border-sm text-primary"></div>
                  </td>
                </tr>
              ) : events.length > 0 ? (
                events.map((evt) => (
                  <tr key={evt.id}>
                    <td>
                      <span className="badge bg-light text-dark border font-monospace" style={{ fontSize: '0.68rem' }}>
                        {evt.action}
                      </span>
                    </td>
                    <td>
                      <div className="fw-semibold small">
                        {evt.actor ? `${evt.actor.firstName} ${evt.actor.lastName}` : evt.actorRole || 'System'}
                      </div>
                      <div className="text-muted" style={{ fontSize: '0.68rem' }}>{evt.actorRole}</div>
                    </td>
                    <td>
                      <span className="small text-muted">{evt.entityType}</span>
                    </td>
                    <td>
                      <span className="font-monospace text-muted" style={{ fontSize: '0.68rem' }}>
                        {evt.entityId?.substring(0, 12)}...
                      </span>
                    </td>
                    <td>
                      <span className="small text-secondary">{evt.reason || 'Operation executed'}</span>
                    </td>
                    <td>
                      {evt.diff ? (
                        <button
                          className="btn btn-xs btn-outline-secondary py-0 px-2"
                          style={{ fontSize: '0.7rem' }}
                          onClick={() => setSelectedDiff(evt.diff)}
                        >
                          <Eye size={12} className="me-1" />
                          <span>View Diff</span>
                        </button>
                      ) : (
                        <span className="text-muted small">-</span>
                      )}
                    </td>
                    <td className="small text-muted">
                      {new Date(evt.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="text-center py-4 text-muted small">
                    No audit events recorded under this filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-3 border-top d-flex align-items-center justify-content-between">
          <div className="small text-muted">
            Page {page} of {totalPages}
          </div>
          <div className="d-flex gap-1">
            <button
              className="btn btn-sm btn-outline-secondary"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeft size={14} />
            </button>
            <button
              className="btn btn-sm btn-outline-secondary"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Diff Modal */}
      {selectedDiff && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow">
              <div className="modal-header">
                <h5 className="modal-title fw-bold">Audit Event Diff Inspection</h5>
                <button type="button" className="btn-close" onClick={() => setSelectedDiff(null)}></button>
              </div>
              <div className="modal-body">
                <pre className="p-3 bg-dark text-light rounded small" style={{ maxHeight: 300, overflowY: 'auto' }}>
                  {JSON.stringify(selectedDiff, null, 2)}
                </pre>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-sm btn-primary-et" onClick={() => setSelectedDiff(null)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
