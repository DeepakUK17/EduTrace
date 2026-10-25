import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  AlertTriangle,
  Upload,
  Gauge,
  CheckCircle2,
  Clock,
  ArrowRight,
  RefreshCw,
  TrendingUp,
} from 'lucide-react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function InstitutionDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const res = await api.get('/dashboard/institution');
      setData(res.data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load institution dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="d-flex align-items-center justify-content-center py-5">
        <div className="spinner-border text-primary" role="status"></div>
        <span className="ms-2 text-muted">Loading institution metrics...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger d-flex align-items-center justify-content-between">
        <span>{error}</span>
        <button className="btn btn-sm btn-outline-danger" onClick={fetchDashboard}>
          Retry
        </button>
      </div>
    );
  }

  const { totalEnrollments, pendingValidation, openCases, importJobs, recentImports, intakeConfigs } = data || {};

  return (
    <div>
      {/* Header */}
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h4 className="fw-bold text-dark mb-1">
            {user?.institution?.name || 'Institution Portal'}
          </h4>
          <p className="text-muted small mb-0">
            Intake quota monitoring, student APAAR compliance, and import processing
          </p>
        </div>
        <div className="d-flex gap-2">
          <Link to="/import" className="btn btn-sm btn-primary-et d-flex align-items-center gap-1">
            <Upload size={14} />
            <span>Upload Student CSV</span>
          </Link>
          <button className="btn btn-sm btn-outline-secondary" onClick={fetchDashboard}>
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="row g-3 mb-4">
        <div className="col-sm-6 col-md-3">
          <div className="kpi-card">
            <div className="kpi-title">Active Enrolments</div>
            <div className="kpi-value text-primary">{totalEnrollments || 0}</div>
            <div className="small text-muted mt-1">Total Enrolled Students</div>
          </div>
        </div>

        <div className="col-sm-6 col-md-3">
          <div className="kpi-card">
            <div className="kpi-title">Validation Issues</div>
            <div className="kpi-value text-warning">{pendingValidation || 0}</div>
            <div className="small text-muted mt-1">Pending Resolution</div>
          </div>
        </div>

        <div className="col-sm-6 col-md-3">
          <div className="kpi-card">
            <div className="kpi-title">Exception Cases</div>
            <div className="kpi-value text-info">{openCases || 0}</div>
            <div className="small text-muted mt-1">In Governance Lifecycle</div>
          </div>
        </div>

        <div className="col-sm-6 col-md-3">
          <div className="kpi-card">
            <div className="kpi-title">Import Batches</div>
            <div className="kpi-value text-success">{importJobs || 0}</div>
            <div className="small text-muted mt-1">CSV/Excel Datasets</div>
          </div>
        </div>
      </div>

      {/* Programme Intake Capacity Table */}
      <div className="glass-card mb-4">
        <div className="glass-card-header">
          <div>
            <h6 className="mb-0 fw-bold">Approved Intake vs Current Admissions</h6>
            <span className="text-muted small">Academic Year 2025-26 AICTE Quotas</span>
          </div>
          <Link to="/capacity" className="small text-decoration-none d-flex align-items-center gap-1">
            <span>Open Digital Twin Simulator</span>
            <ArrowRight size={14} />
          </Link>
        </div>
        <div className="table-responsive">
          <table className="et-table">
            <thead>
              <tr>
                <th>Programme</th>
                <th>Approved Intake</th>
                <th>Enrolled</th>
                <th>Capacity Usage</th>
                <th>Supernumerary / NRI Limits</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {intakeConfigs?.length > 0 ? (
                intakeConfigs.map((cfg) => {
                  const enrolled = cfg.programme?._count?.enrollments || 0;
                  const approved = cfg.approvedIntake || 1;
                  const pct = Math.round((enrolled / approved) * 100);
                  const isOver = pct > 100;
                  const isNear = pct >= 85 && !isOver;

                  return (
                    <tr key={cfg.id}>
                      <td>
                        <div className="fw-semibold text-dark">{cfg.programme?.name}</div>
                        <div className="text-muted small">Code: {cfg.programme?.code}</div>
                      </td>
                      <td>
                        <span className="fw-bold">{cfg.approvedIntake}</span> seats
                      </td>
                      <td>
                        <span className="fw-bold text-primary">{enrolled}</span> admitted
                      </td>
                      <td style={{ minWidth: 180 }}>
                        <div className="d-flex align-items-center gap-2">
                          <div className="progress flex-grow-1" style={{ height: 8 }}>
                            <div
                              className={`progress-bar ${
                                isOver ? 'bg-danger' : isNear ? 'bg-warning' : 'bg-success'
                              }`}
                              style={{ width: `${Math.min(pct, 100)}%` }}
                            ></div>
                          </div>
                          <span className="small fw-semibold" style={{ width: 45 }}>
                            {pct}%
                          </span>
                        </div>
                      </td>
                      <td className="small text-muted">
                        NRI: {cfg.nriLimit} • OCI: {cfg.ociLimit} • Supernumerary: {cfg.supernumeraryAllowance}
                      </td>
                      <td>
                        {isOver ? (
                          <span className="badge bg-danger-subtle text-danger border border-danger-subtle">
                            Over Capacity (CAP-01)
                          </span>
                        ) : isNear ? (
                          <span className="badge bg-warning-subtle text-warning border border-warning-subtle">
                            Near Capacity
                          </span>
                        ) : (
                          <span className="badge bg-success-subtle text-success border border-success-subtle">
                            Within Quota
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="6" className="text-center py-4 text-muted small">
                    No active intake configurations found for this campus.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Imports Table */}
      <div className="glass-card">
        <div className="glass-card-header">
          <h6 className="mb-0 fw-bold">Recent Bulk Student Imports</h6>
          <Link to="/import" className="small text-decoration-none">
            New Import Wizard
          </Link>
        </div>
        <div className="table-responsive">
          <table className="et-table">
            <thead>
              <tr>
                <th>File Name</th>
                <th>Academic Year</th>
                <th>Uploaded By</th>
                <th>Accepted / Total</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {recentImports?.length > 0 ? (
                recentImports.map((job) => (
                  <tr key={job.id}>
                    <td className="fw-medium">{job.fileName}</td>
                    <td>{job.academicYear?.label}</td>
                    <td className="small text-muted">
                      {job.uploadedBy ? `${job.uploadedBy.firstName} ${job.uploadedBy.lastName}` : 'System'}
                    </td>
                    <td>
                      <span className="text-success fw-bold">{job.acceptedRows}</span> / {job.totalRows}
                    </td>
                    <td>
                      <span className={`badge ${
                        job.status === 'COMMITTED'
                          ? 'bg-success-subtle text-success border border-success-subtle'
                          : job.status === 'DRY_RUN_COMPLETE'
                          ? 'bg-info-subtle text-info border border-info-subtle'
                          : 'bg-secondary-subtle text-secondary'
                      }`}>
                        {job.status}
                      </span>
                    </td>
                    <td className="small text-muted">
                      {new Date(job.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="text-center py-4 text-muted small">
                    No recent import jobs. Use the import wizard to upload student batches.
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
