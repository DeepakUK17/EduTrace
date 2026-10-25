import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Building2,
  Users,
  AlertTriangle,
  Copy,
  ShieldCheck,
  Activity,
  ArrowUpRight,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import api from '../api/client';

const COLORS = ['#2563eb', '#0ea5e9', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function PlatformDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const res = await api.get('/dashboard/platform');
      setData(res.data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load platform dashboard data');
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
        <span className="ms-2 text-muted">Loading live platform analytics...</span>
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

  const { kpis, issuesBySeverity, issuesByLayer, institutionBreakdown, integrationHealth, recentAudit } = data || {};

  // Formatted chart data
  const severityChartData = issuesBySeverity?.map((s) => ({
    name: s.severity,
    count: s._count.id,
  })) || [];

  const layerChartData = issuesByLayer?.map((l) => ({
    layer: `Layer ${l.layer}`,
    count: l._count.id,
  })) || [];

  const instChartData = institutionBreakdown?.map((i) => ({
    name: i.code,
    fullName: i.name,
    students: i._count.enrollments,
  })) || [];

  return (
    <div>
      {/* Page Header */}
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h4 className="fw-bold text-dark mb-1">AICTE Platform Operations Overview</h4>
          <p className="text-muted small mb-0">
            Real-time compliance monitoring, capacity oversight, and duplicate analysis across institutions
          </p>
        </div>
        <button className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1" onClick={fetchDashboard}>
          <RefreshCw size={14} />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* KPI Cards Row */}
      <div className="row g-3 mb-4">
        <div className="col-sm-6 col-xl-2">
          <div className="kpi-card">
            <div className="kpi-title">Institutions</div>
            <div className="kpi-value text-primary">{kpis?.totalInstitutions || 0}</div>
            <div className="small text-muted mt-1">Approved Campuses</div>
          </div>
        </div>

        <div className="col-sm-6 col-xl-2">
          <div className="kpi-card">
            <div className="kpi-title">Enrolled Students</div>
            <div className="kpi-value text-dark">{kpis?.totalStudents || 0}</div>
            <div className="small text-muted mt-1">Active Records</div>
          </div>
        </div>

        <div className="col-sm-6 col-xl-2">
          <div className="kpi-card">
            <div className="kpi-title">Validation Alerts</div>
            <div className="kpi-value text-warning">{kpis?.openIssues || 0}</div>
            <div className="small text-muted mt-1">Requiring Review</div>
          </div>
        </div>

        <div className="col-sm-6 col-xl-2">
          <div className="kpi-card">
            <div className="kpi-title">Duplicates Detected</div>
            <div className="kpi-value text-danger">{kpis?.duplicateMatches || 0}</div>
            <div className="small text-muted mt-1">Cross & Intra Campus</div>
          </div>
        </div>

        <div className="col-sm-6 col-xl-2">
          <div className="kpi-card">
            <div className="kpi-title">Exception Cases</div>
            <div className="kpi-value text-info">{kpis?.openCases || 0}</div>
            <div className="small text-muted mt-1">Active Lifecycles</div>
          </div>
        </div>

        <div className="col-sm-6 col-xl-2">
          <div className="kpi-card">
            <div className="kpi-title">Capacity Alerts</div>
            <div className="kpi-value text-danger">{kpis?.capacityIssues || 0}</div>
            <div className="small text-muted mt-1">Over-intake Flags</div>
          </div>
        </div>
      </div>

      {/* Integration Health Strip */}
      <div className="card border-0 shadow-sm rounded-3 mb-4 p-3 bg-white">
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
          <div className="d-flex align-items-center gap-2">
            <Activity size={18} className="text-primary" />
            <span className="fw-semibold small">Integration Connectors Status:</span>
          </div>

          <div className="d-flex flex-wrap align-items-center gap-3">
            {integrationHealth?.map((conn) => (
              <div key={conn.id} className="d-flex align-items-center gap-2 small">
                <span
                  className="rounded-circle"
                  style={{
                    width: 8,
                    height: 8,
                    backgroundColor: conn.status === 'HEALTHY' ? '#10b981' : '#f59e0b',
                  }}
                ></span>
                <span className="fw-medium">{conn.name}</span>
                <span className="badge bg-light text-muted border py-0 px-1" style={{ fontSize: '0.65rem' }}>
                  {conn.mode}
                </span>
              </div>
            ))}
          </div>

          <Link to="/integrations" className="small text-primary text-decoration-none d-flex align-items-center gap-1">
            <span>Integration Health Centre</span>
            <ArrowUpRight size={14} />
          </Link>
        </div>
      </div>

      {/* Analytics Charts Row */}
      <div className="row g-4 mb-4">
        {/* Left: Issues by Severity Pie */}
        <div className="col-lg-4">
          <div className="glass-card h-100">
            <div className="glass-card-header">
              <h6 className="mb-0 fw-bold">Validation Issues by Severity</h6>
              <Link to="/validation" className="small text-decoration-none">View All</Link>
            </div>
            <div className="glass-card-body">
              {severityChartData.length > 0 ? (
                <div style={{ height: 260 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={severityChartData}
                        dataKey="count"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {severityChartData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="text-center py-5 text-muted small">No active issues recorded</div>
              )}
            </div>
          </div>
        </div>

        {/* Center: Issues by Validation Layer Bar */}
        <div className="col-lg-4">
          <div className="glass-card h-100">
            <div className="glass-card-header">
              <h6 className="mb-0 fw-bold">Issues by Validation Layer</h6>
              <span className="badge bg-light text-muted border">Multi-Layer Engine</span>
            </div>
            <div className="glass-card-body">
              {layerChartData.length > 0 ? (
                <div style={{ height: 260 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={layerChartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="layer" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Bar dataKey="count" fill="#2563eb" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="text-center py-5 text-muted small">No layer data</div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Enrolment by Institution Bar */}
        <div className="col-lg-4">
          <div className="glass-card h-100">
            <div className="glass-card-header">
              <h6 className="mb-0 fw-bold">Enrolments by Institution</h6>
              <Link to="/institutions" className="small text-decoration-none">Details</Link>
            </div>
            <div className="glass-card-body">
              {instChartData.length > 0 ? (
                <div style={{ height: 260 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={instChartData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                      <XAxis type="number" tick={{ fontSize: 12 }} />
                      <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={70} />
                      <Tooltip formatter={(value, name, props) => [value, props.payload.fullName]} />
                      <Bar dataKey="students" fill="#0ea5e9" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="text-center py-5 text-muted small">No institution data</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Audit Events Table */}
      <div className="glass-card">
        <div className="glass-card-header">
          <h6 className="mb-0 fw-bold">Recent Governance & Audit Events</h6>
          <Link to="/audit" className="small text-decoration-none">Full Audit Log</Link>
        </div>
        <div className="table-responsive">
          <table className="et-table">
            <thead>
              <tr>
                <th>Action</th>
                <th>Actor</th>
                <th>Entity Type</th>
                <th>Reason / Summary</th>
                <th>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {recentAudit?.length > 0 ? (
                recentAudit.map((evt) => (
                  <tr key={evt.id}>
                    <td>
                      <span className="badge bg-light text-dark border fw-medium" style={{ fontSize: '0.72rem' }}>
                        {evt.action}
                      </span>
                    </td>
                    <td>
                      <span className="fw-medium">
                        {evt.actor ? `${evt.actor.firstName} ${evt.actor.lastName}` : evt.actorRole || 'System'}
                      </span>
                    </td>
                    <td>
                      <span className="text-muted small">{evt.entityType}</span>
                    </td>
                    <td>
                      <span className="text-truncate d-inline-block small" style={{ maxWidth: 300 }}>
                        {evt.reason || 'Operation recorded'}
                      </span>
                    </td>
                    <td className="small text-muted">
                      {new Date(evt.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="text-center py-3 text-muted small">
                    No recent audit events
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
