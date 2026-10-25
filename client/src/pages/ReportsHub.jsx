import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Download,
  Printer,
  FileSpreadsheet,
  Filter,
  CheckCircle,
  RefreshCw,
} from 'lucide-react';
import api from '../api/client';

export default function ReportsHub() {
  const [reportType, setReportType] = useState('institution-summary');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchReport = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/reports/${reportType}`);
      setData(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to generate report');
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [reportType]);

  const exportCsv = () => {
    if (!data) return;
    let headers = [];
    let rows = [];

    if (reportType === 'institution-summary') {
      headers = ['Institution Code', 'Institution Name', 'Approved Intake', 'Enrolled Students', 'Remaining Capacity'];
      rows = (data.summary || []).map((s) => [
        `"${s.code}"`,
        `"${s.name}"`,
        s.totalApprovedIntake,
        s.totalEnrolled,
        s.remainingCapacity,
      ]);
    } else if (reportType === 'intake-comparison') {
      headers = ['Institution', 'Programme', 'Approved Intake', 'Current Enrolled', 'Remaining Capacity', 'Utilization %'];
      rows = (data.programmes || []).map((p) => [
        `"${p.institutionName}"`,
        `"${p.programmeName}"`,
        p.approvedIntake,
        p.enrolled,
        p.remaining,
        `${p.utilizationPct}%`,
      ]);
    } else if (reportType === 'data-quality') {
      headers = ['Status', 'Total Students'];
      rows = (data.byStatus || []).map((s) => [`"${s.apaarStatus}"`, s._count.id]);
    } else if (reportType === 'exceptions') {
      headers = ['Status', 'Case Count'];
      rows = (data.byStatus || []).map((s) => [`"${s.status}"`, s._count.id]);
    }

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `edutrace_${reportType}_report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div>
      {/* Header */}
      <div className="d-flex align-items-center justify-content-between mb-4 no-print">
        <div>
          <h4 className="fw-bold text-dark mb-1">Compliance Reports & Accreditation Analytics</h4>
          <p className="text-muted small mb-0">
            Exportable regulatory audits, data quality indicators, and intake adherence reports
          </p>
        </div>

        <div className="d-flex gap-2">
          <button className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1" onClick={exportCsv} disabled={!data || loading}>
            <Download size={14} />
            <span>Export CSV</span>
          </button>
          <button className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1" onClick={() => window.print()} disabled={!data || loading}>
            <Printer size={14} />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Report Selector Pills */}
      <div className="card border-0 shadow-sm rounded-3 p-2 mb-4 bg-white no-print">
        <div className="nav nav-pills gap-2">
          <button
            className={`nav-link btn-sm ${reportType === 'institution-summary' ? 'active' : ''}`}
            onClick={() => setReportType('institution-summary')}
          >
            Institution Intake Summary
          </button>
          <button
            className={`nav-link btn-sm ${reportType === 'intake-comparison' ? 'active' : ''}`}
            onClick={() => setReportType('intake-comparison')}
          >
            Programme vs Approved Intake
          </button>
          <button
            className={`nav-link btn-sm ${reportType === 'data-quality' ? 'active' : ''}`}
            onClick={() => setReportType('data-quality')}
          >
            Data Quality & APAAR Health
          </button>
          <button
            className={`nav-link btn-sm ${reportType === 'exceptions' ? 'active' : ''}`}
            onClick={() => setReportType('exceptions')}
          >
            Exceptions Resolution Audit
          </button>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger py-2 small mb-4">{error}</div>
      )}

      {/* Printable Report Sheet */}
      <div className="glass-card p-4">
        <div className="d-flex align-items-center justify-content-between pb-3 mb-3 border-bottom">
          <div>
            <h5 className="fw-bold mb-1 text-dark text-capitalize">
              {reportType.replace('-', ' ')} Report
            </h5>
            <div className="text-muted small">
              Generated: {new Date().toLocaleDateString()} • AICTE Regulation Bureau PS 26263
            </div>
          </div>
          <span className="badge bg-light text-muted border">
            Confidential Regulatory Audit
          </span>
        </div>

        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border spinner-border-sm text-primary"></div>
            <div className="text-muted small mt-2">Aggregating live database metrics...</div>
          </div>
        ) : (
          <div>
            {/* Institution Summary Table */}
            {reportType === 'institution-summary' && data?.summary && (
              <div className="table-responsive">
                <table className="et-table">
                  <thead>
                    <tr>
                      <th>Institution Code</th>
                      <th>Campus Name</th>
                      <th>Approved Intake</th>
                      <th>Active Enrolments</th>
                      <th>Remaining Capacity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.summary.map((s) => (
                      <tr key={s.id}>
                        <td className="font-monospace fw-semibold">{s.code}</td>
                        <td className="fw-bold text-dark">{s.name}</td>
                        <td>{s.totalApprovedIntake} seats</td>
                        <td className="text-primary fw-bold">{s.totalEnrolled} admitted</td>
                        <td>
                          <span className={`fw-semibold ${s.remainingCapacity < 0 ? 'text-danger' : 'text-success'}`}>
                            {s.remainingCapacity} seats
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Programme vs Intake Table */}
            {reportType === 'intake-comparison' && data?.programmes && (
              <div className="table-responsive">
                <table className="et-table">
                  <thead>
                    <tr>
                      <th>Institution</th>
                      <th>Programme</th>
                      <th>Approved Intake</th>
                      <th>Current Enrolled</th>
                      <th>Remaining Capacity</th>
                      <th>Utilization %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.programmes.map((p) => (
                      <tr key={p.programmeId}>
                        <td className="small text-muted">{p.institutionName}</td>
                        <td className="fw-semibold text-dark">{p.programmeName}</td>
                        <td>{p.approvedIntake}</td>
                        <td className="fw-bold text-primary">{p.enrolled}</td>
                        <td>
                          <span className={p.remaining < 0 ? 'text-danger fw-bold' : 'text-muted'}>
                            {p.remaining}
                          </span>
                        </td>
                        <td>
                          <span className={`badge ${
                            p.utilizationPct > 100
                              ? 'bg-danger text-white'
                              : p.utilizationPct >= 85
                              ? 'bg-warning-subtle text-warning border border-warning-subtle'
                              : 'bg-success-subtle text-success'
                          }`}>
                            {p.utilizationPct}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Data Quality Report */}
            {reportType === 'data-quality' && data?.byStatus && (
              <div className="table-responsive">
                <table className="et-table">
                  <thead>
                    <tr>
                      <th>APAAR Identification Status</th>
                      <th>Student Record Count</th>
                      <th>Compliance Implication</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.byStatus.map((s, i) => (
                      <tr key={i}>
                        <td>
                          <span className={`badge-apaar badge-apaar-${s.apaarStatus}`}>
                            {s.apaarStatus}
                          </span>
                        </td>
                        <td className="fw-bold fs-6">{s._count.id}</td>
                        <td className="small text-muted">
                          {s.apaarStatus === 'LOCAL_ACCEPTED' && 'Compliant: Valid token ready for ABC credit linkage'}
                          {s.apaarStatus === 'MISSING' && 'High Risk: Student unassigned in Academic Bank of Credits'}
                          {s.apaarStatus === 'INVALID_FORMAT' && 'Critical: Value fails 12-digit format rule'}
                          {s.apaarStatus === 'POTENTIAL_DUPLICATE' && 'Review Required: Matching hash in system'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Exceptions Report */}
            {reportType === 'exceptions' && data?.byStatus && (
              <div className="table-responsive">
                <table className="et-table">
                  <thead>
                    <tr>
                      <th>Lifecycle Phase</th>
                      <th>Active Cases</th>
                      <th>Action Required</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.byStatus.map((s, i) => (
                      <tr key={i}>
                        <td className="fw-semibold">{s.status}</td>
                        <td className="fw-bold fs-6">{s._count.id}</td>
                        <td className="small text-muted">
                          {s.status === 'DETECTED' && 'Pending reviewer assignment'}
                          {s.status === 'UNDER_REVIEW' && 'Active audit investigation in progress'}
                          {s.status === 'RESOLVED' && 'Closed with recorded audit explanation'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
