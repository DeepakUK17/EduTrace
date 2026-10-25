import React, { useState, useEffect } from 'react';
import {
  Network,
  Activity,
  CheckCircle2,
  AlertCircle,
  Play,
  RotateCw,
  RefreshCw,
  Info,
  Server,
} from 'lucide-react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function IntegrationHealth() {
  const { hasRole } = useAuth();
  const [connectors, setConnectors] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState({});
  const [testResults, setTestResults] = useState({});

  const fetchIntegrations = async () => {
    setLoading(true);
    try {
      const [connRes, jobsRes] = await Promise.all([
        api.get('/integrations'),
        api.get('/integrations/jobs'),
      ]);
      setConnectors(connRes.data.connectors || []);
      setJobs(jobsRes.data.jobs || []);
    } catch (err) {
      console.error('Failed to load integration status:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIntegrations();
  }, []);

  const handleTestConnector = async (adapterName) => {
    setTesting((prev) => ({ ...prev, [adapterName]: true }));
    try {
      const res = await api.post(`/integrations/${adapterName}/test`);
      setTestResults((prev) => ({
        ...prev,
        [adapterName]: res.data.simulatedResponse,
      }));
      fetchIntegrations();
    } catch (err) {
      alert(err.response?.data?.error || `Failed to test ${adapterName}`);
    } finally {
      setTesting((prev) => ({ ...prev, [adapterName]: false }));
    }
  };

  const handleRetryJob = async (jobId) => {
    try {
      await api.post(`/integrations/jobs/${jobId}/retry`);
      fetchIntegrations();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to retry job');
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h4 className="fw-bold text-dark mb-1">Integration Health Centre</h4>
          <p className="text-muted small mb-0">
            Adapter statuses, mock government endpoints, and integration job telemetry
          </p>
        </div>
        <button className="btn btn-sm btn-outline-secondary" onClick={fetchIntegrations}>
          <RefreshCw size={14} />
        </button>
      </div>

      {/* Global Disclaimer */}
      <div className="p-3 bg-light rounded-3 border mb-4 text-muted small d-flex align-items-center gap-2">
        <Info size={16} className="text-primary flex-shrink-0" />
        <span>
          <strong>SIMULATION NOTICE:</strong> All external government adapters (APAAR/ABC, AICTE, ERP) run in transparent <strong>SIMULATED</strong> prototype mode. No unauthorized live government requests are generated.
        </span>
      </div>

      {/* Connectors Cards Grid */}
      <div className="row g-4 mb-4">
        {connectors.map((c) => {
          const isTesting = testing[c.name];
          const testRes = testResults[c.name];

          return (
            <div key={c.id} className="col-md-4">
              <div className="glass-card h-100 p-4 d-flex flex-column justify-content-between">
                <div>
                  <div className="d-flex align-items-center justify-content-between mb-3">
                    <div className="d-flex align-items-center gap-2">
                      <div className="bg-primary text-white p-2 rounded d-flex align-items-center justify-content-center" style={{ width: 34, height: 34 }}>
                        <Server size={18} />
                      </div>
                      <div>
                        <h6 className="fw-bold mb-0 text-dark">{c.name}</h6>
                        <span className="badge bg-light text-muted border" style={{ fontSize: '0.65rem' }}>
                          Type: {c.type}
                        </span>
                      </div>
                    </div>
                    <span className={`badge ${
                      c.status === 'HEALTHY' ? 'bg-success-subtle text-success border border-success-subtle' : 'bg-warning-subtle text-warning'
                    }`}>
                      {c.status}
                    </span>
                  </div>

                  <div className="mb-3 small">
                    <div className="text-muted">Operational Mode:</div>
                    <span className="badge bg-info-subtle text-info border border-info-subtle fw-bold">
                      {c.mode}
                    </span>
                  </div>

                  <p className="text-muted" style={{ fontSize: '0.75rem', lineHeight: 1.4 }}>
                    {c.disclaimer}
                  </p>

                  {testRes && (
                    <div className="p-2 bg-light rounded border small mb-3">
                      <div className="fw-semibold text-primary" style={{ fontSize: '0.7rem' }}>
                        Simulated Heartbeat ACK:
                      </div>
                      <div className="text-muted" style={{ fontSize: '0.68rem' }}>
                        {testRes.message || JSON.stringify(testRes)}
                      </div>
                    </div>
                  )}
                </div>

                {hasRole('PLATFORM_ADMIN') && (
                  <button
                    className="btn btn-sm btn-outline-primary w-100 d-flex align-items-center justify-content-center gap-1"
                    onClick={() => handleTestConnector(c.name)}
                    disabled={isTesting}
                  >
                    <Play size={13} />
                    <span>{isTesting ? 'Pinging Mock Adapter...' : 'Test Connector'}</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Integration Jobs Telemetry Table */}
      <div className="glass-card">
        <div className="glass-card-header">
          <h6 className="mb-0 fw-bold">Integration Jobs Telemetry ({jobs.length})</h6>
          <span className="small text-muted">Idempotency-tracked outbound calls</span>
        </div>

        <div className="table-responsive">
          <table className="et-table">
            <thead>
              <tr>
                <th>Connector</th>
                <th>Job Type</th>
                <th>Attempts</th>
                <th>Status</th>
                <th>Created At</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {jobs.length > 0 ? (
                jobs.map((j) => (
                  <tr key={j.id}>
                    <td className="fw-semibold">{j.connector?.name}</td>
                    <td>
                      <span className="badge bg-light text-dark border font-monospace" style={{ fontSize: '0.7rem' }}>
                        {j.jobType}
                      </span>
                    </td>
                    <td>
                      <span className="small">{j.attempts} / {j.maxAttempts || 3}</span>
                    </td>
                    <td>
                      <span className={`badge ${
                        j.status === 'SUCCESS'
                          ? 'bg-success-subtle text-success border border-success-subtle'
                          : j.status === 'FAILED'
                          ? 'bg-danger-subtle text-danger'
                          : 'bg-light text-muted border'
                      }`}>
                        {j.status}
                      </span>
                    </td>
                    <td className="small text-muted">
                      {new Date(j.createdAt).toLocaleString()}
                    </td>
                    <td>
                      {j.status === 'FAILED' && hasRole('PLATFORM_ADMIN') && (
                        <button
                          className="btn btn-xs btn-outline-primary py-1 px-2 d-inline-flex align-items-center gap-1"
                          style={{ fontSize: '0.72rem' }}
                          onClick={() => handleRetryJob(j.id)}
                        >
                          <RotateCw size={11} />
                          <span>Retry</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="text-center py-4 text-muted small">
                    No integration jobs recorded yet.
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
