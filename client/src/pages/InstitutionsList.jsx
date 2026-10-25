import React, { useState, useEffect } from 'react';
import {
  Building2,
  Plus,
  MapPin,
  ExternalLink,
  RefreshCw,
  Search,
  CheckCircle2,
} from 'lucide-react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function InstitutionsList() {
  const { hasRole } = useAuth();
  const [institutions, setInstitutions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    type: 'Engineering & Technology',
    aicteCode: '',
    city: '',
    state: '',
    website: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchInstitutions = async () => {
    setLoading(true);
    try {
      const res = await api.get('/institutions');
      setInstitutions(res.data.institutions || []);
    } catch (err) {
      console.error('Failed to load institutions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInstitutions();
  }, []);

  const handleCreate = async (e) => {
    e?.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/institutions', formData);
      setShowAddModal(false);
      setFormData({
        name: '',
        code: '',
        type: 'Engineering & Technology',
        aicteCode: '',
        city: '',
        state: '',
        website: '',
      });
      fetchInstitutions();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to create institution');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h4 className="fw-bold text-dark mb-1">AICTE Approved Institutions & Quotas</h4>
          <p className="text-muted small mb-0">
            Campuses, sanctioned programmes, and approved intake capacity configurations
          </p>
        </div>
        <div className="d-flex gap-2">
          {hasRole('PLATFORM_ADMIN') && (
            <button className="btn btn-sm btn-primary-et d-flex align-items-center gap-1" onClick={() => setShowAddModal(true)}>
              <Plus size={14} />
              <span>Register New Institution</span>
            </button>
          )}
          <button className="btn btn-sm btn-outline-secondary" onClick={fetchInstitutions}>
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* Institutions Cards Grid */}
      <div className="row g-4">
        {loading ? (
          <div className="col-12 text-center py-5">
            <div className="spinner-border text-primary"></div>
          </div>
        ) : institutions.length > 0 ? (
          institutions.map((inst) => (
            <div key={inst.id} className="col-md-6">
              <div className="glass-card h-100 p-4 d-flex flex-column justify-content-between">
                <div>
                  <div className="d-flex align-items-start justify-content-between mb-2">
                    <div className="d-flex align-items-center gap-3">
                      <div className="bg-primary text-white p-2 rounded-3 d-flex align-items-center justify-content-center" style={{ width: 44, height: 44 }}>
                        <Building2 size={24} />
                      </div>
                      <div>
                        <h6 className="fw-bold text-dark mb-0">{inst.name}</h6>
                        <div className="text-muted small font-monospace">Code: {inst.code}</div>
                      </div>
                    </div>
                    <span className="badge bg-success-subtle text-success border border-success-subtle">
                      {inst.status}
                    </span>
                  </div>

                  <div className="d-flex align-items-center gap-1 text-muted small mb-3">
                    <MapPin size={13} />
                    <span>{inst.city || 'Delhi'}, {inst.state || 'India'}</span>
                    {inst.aicteCode && (
                      <span className="ms-2 font-monospace" style={{ fontSize: '0.7rem' }}>
                        (AICTE: {inst.aicteCode})
                      </span>
                    )}
                  </div>

                  <div className="p-3 bg-light rounded-3 border mb-3">
                    <div className="row g-2 text-center small">
                      <div className="col-6 border-end">
                        <div className="text-muted" style={{ fontSize: '0.7rem' }}>Programmes</div>
                        <div className="fw-bold fs-6">{inst._count?.programmes || 0}</div>
                      </div>
                      <div className="col-6">
                        <div className="text-muted" style={{ fontSize: '0.7rem' }}>Active Enrolments</div>
                        <div className="fw-bold fs-6 text-primary">{inst._count?.enrollments || 0}</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="d-flex align-items-center justify-content-between pt-2 border-top">
                  <span className="text-muted small">{inst.type}</span>
                  {inst.website && (
                    <a
                      href={inst.website}
                      target="_blank"
                      rel="noreferrer"
                      className="small text-decoration-none d-flex align-items-center gap-1"
                    >
                      <span>Website</span>
                      <ExternalLink size={12} />
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-12 text-center py-5 text-muted small">
            No institutions registered.
          </div>
        )}
      </div>

      {/* Add Institution Modal */}
      {showAddModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow">
              <div className="modal-header">
                <h5 className="modal-title fw-bold">Register Approved Institution</h5>
                <button type="button" className="btn-close" onClick={() => setShowAddModal(false)}></button>
              </div>

              <form onSubmit={handleCreate}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label small fw-semibold">Institution Name *</label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      required
                      placeholder="e.g. National Institute of Technology"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>

                  <div className="row g-2 mb-3">
                    <div className="col-6">
                      <label className="form-label small fw-semibold">Campus Code *</label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        required
                        placeholder="e.g. NIT-DEL"
                        value={formData.code}
                        onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                      />
                    </div>
                    <div className="col-6">
                      <label className="form-label small fw-semibold">AICTE Approval Code</label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        placeholder="e.g. 1-90023451"
                        value={formData.aicteCode}
                        onChange={(e) => setFormData({ ...formData, aicteCode: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="row g-2 mb-3">
                    <div className="col-6">
                      <label className="form-label small fw-semibold">City</label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      />
                    </div>
                    <div className="col-6">
                      <label className="form-label small fw-semibold">State</label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        value={formData.state}
                        onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                <div className="modal-footer">
                  <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => setShowAddModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-sm btn-primary-et" disabled={submitting}>
                    {submitting ? 'Registering...' : 'Register Institution'}
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
