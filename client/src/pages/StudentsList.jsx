import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Search,
  Filter,
  Plus,
  FileText,
  AlertTriangle,
  CheckCircle,
  Eye,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function StudentsList() {
  const { hasRole } = useAuth();
  const [enrollments, setEnrollments] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(15);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [apaarStatus, setApaarStatus] = useState('');
  const [category, setCategory] = useState('');

  // Add Student Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [programmes, setProgrammes] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [institutions, setInstitutions] = useState([]);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    institutionStudentId: '',
    apaarId: '',
    programmeId: '',
    academicYearId: '',
    institutionId: '',
    admissionCategory: 'GENERAL',
    admissionDate: new Date().toISOString().split('T')[0],
    email: '',
    phone: '',
    isNri: false,
    isOci: false,
    isSupernumerary: false,
  });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const params = { page, limit };
      if (search) params.search = search;
      if (apaarStatus) params.apaarStatus = apaarStatus;
      if (category) params.category = category;

      const res = await api.get('/students', { params });
      setEnrollments(res.data.enrollments || []);
      setTotal(res.data.total || 0);
    } catch (err) {
      console.error('Error fetching students:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMasterData = async () => {
    try {
      const [progRes, ayRes, instRes] = await Promise.all([
        api.get('/institutions/programmes/all'),
        api.get('/institutions/academic-years/all'),
        api.get('/institutions'),
      ]);
      setProgrammes(progRes.data.programmes || []);
      setAcademicYears(ayRes.data.academicYears || []);
      setInstitutions(instRes.data.institutions || []);

      if (progRes.data.programmes?.length > 0) {
        setFormData((prev) => ({
          ...prev,
          programmeId: progRes.data.programmes[0].id,
          academicYearId: ayRes.data.academicYears?.[0]?.id || '',
          institutionId: instRes.data.institutions?.[0]?.id || '',
        }));
      }
    } catch (err) {
      console.error('Error loading master data:', err);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [page, apaarStatus, category]);

  useEffect(() => {
    fetchMasterData();
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchStudents();
  };

  const handleCreateStudent = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError('');

    try {
      await api.post('/students', formData);
      setShowAddModal(false);
      setFormData({
        firstName: '',
        lastName: '',
        institutionStudentId: '',
        apaarId: '',
        programmeId: programmes[0]?.id || '',
        academicYearId: academicYears[0]?.id || '',
        institutionId: institutions[0]?.id || '',
        admissionCategory: 'GENERAL',
        admissionDate: new Date().toISOString().split('T')[0],
        email: '',
        phone: '',
        isNri: false,
        isOci: false,
        isSupernumerary: false,
      });
      fetchStudents();
    } catch (err) {
      setFormError(err.response?.data?.error || 'Failed to create student record');
    } finally {
      setSubmitting(false);
    }
  };

  const totalPages = Math.ceil(total / limit) || 1;

  return (
    <div>
      {/* Header */}
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h4 className="fw-bold text-dark mb-1">Student Records & APAAR Identity</h4>
          <p className="text-muted small mb-0">
            Search, filter, inspect cryptographic tokens, and manage student admission lifecycles
          </p>
        </div>
        <div className="d-flex gap-2">
          {hasRole('PLATFORM_ADMIN', 'INSTITUTION_ADMIN', 'DATA_OPERATOR') && (
            <button className="btn btn-sm btn-primary-et d-flex align-items-center gap-1" onClick={() => setShowAddModal(true)}>
              <Plus size={14} />
              <span>Add Student Record</span>
            </button>
          )}
          <button className="btn btn-sm btn-outline-secondary" onClick={fetchStudents}>
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="card border-0 shadow-sm rounded-3 p-3 mb-4 bg-white">
        <form onSubmit={handleSearchSubmit} className="row g-2 align-items-center">
          <div className="col-md-4">
            <div className="input-group input-group-sm">
              <span className="input-group-text bg-light border-end-0">
                <Search size={14} className="text-muted" />
              </span>
              <input
                type="text"
                className="form-control border-start-0"
                placeholder="Search name, roll number..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="col-md-3">
            <select
              className="form-select form-select-sm"
              value={apaarStatus}
              onChange={(e) => {
                setApaarStatus(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All APAAR States (8 States)</option>
              <option value="LOCAL_ACCEPTED">LOCAL_ACCEPTED (Valid Token)</option>
              <option value="MISSING">MISSING (No Identifier)</option>
              <option value="INVALID_FORMAT">INVALID_FORMAT (Non-12 Digit)</option>
              <option value="POTENTIAL_DUPLICATE">POTENTIAL_DUPLICATE (Hash Match)</option>
              <option value="SIMULATED_PASS">SIMULATED_PASS (Adapter OK)</option>
            </select>
          </div>

          <div className="col-md-3">
            <select
              className="form-select form-select-sm"
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All Admission Categories</option>
              <option value="GENERAL">General</option>
              <option value="OBC">OBC</option>
              <option value="SC">SC</option>
              <option value="ST">ST</option>
              <option value="EWS">EWS</option>
              <option value="NRI">NRI (Quota Check)</option>
              <option value="OCI">OCI (Supernumerary)</option>
              <option value="FOREIGN_NATIONAL">Foreign National</option>
            </select>
          </div>

          <div className="col-md-2 d-flex gap-2">
            <button type="submit" className="btn btn-sm btn-primary w-100">
              Apply Filter
            </button>
          </div>
        </form>
      </div>

      {/* Students Table */}
      <div className="glass-card mb-4">
        <div className="glass-card-header">
          <div className="fw-semibold small">
            Showing <span className="fw-bold text-dark">{enrollments.length}</span> of {total} records
          </div>
          <div className="text-muted small">Masked APAAR Format Protected by HMAC Hash</div>
        </div>

        <div className="table-responsive">
          <table className="et-table">
            <thead>
              <tr>
                <th>Student Name</th>
                <th>Student ID / Roll</th>
                <th>APAAR Identifier</th>
                <th>Programme & Year</th>
                <th>Category</th>
                <th>Validation Flags</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" className="text-center py-5">
                    <div className="spinner-border spinner-border-sm text-primary"></div>
                    <span className="ms-2 text-muted small">Loading records...</span>
                  </td>
                </tr>
              ) : enrollments.length > 0 ? (
                enrollments.map((en) => {
                  const statusClass = `badge-apaar-${en.student?.apaarStatus || 'MISSING'}`;
                  const hasIssues = (en._count?.validationIssues || 0) > 0;

                  return (
                    <tr key={en.id}>
                      <td>
                        <div className="fw-semibold text-dark">
                          {en.firstName} {en.lastName}
                        </div>
                        <div className="text-muted small">{en.institution?.code}</div>
                      </td>
                      <td>
                        <span className="font-monospace small">{en.institutionStudentId}</span>
                      </td>
                      <td>
                        <div className="d-flex flex-column gap-1">
                          <span className={`badge-apaar ${statusClass}`}>
                            {en.student?.apaarMasked || 'NOT REGISTERED'}
                          </span>
                          <span className="text-muted font-monospace" style={{ fontSize: '0.65rem' }}>
                            {en.student?.apaarStatus}
                          </span>
                        </div>
                      </td>
                      <td>
                        <div className="small fw-medium">{en.programme?.name}</div>
                        <div className="text-muted" style={{ fontSize: '0.72rem' }}>{en.academicYear?.label}</div>
                      </td>
                      <td>
                        <span className="badge bg-light text-dark border" style={{ fontSize: '0.72rem' }}>
                          {en.admissionCategory}
                          {en.isNri && ' (NRI)'}
                          {en.isOci && ' (OCI)'}
                        </span>
                      </td>
                      <td>
                        {hasIssues ? (
                          <span className="badge bg-warning-subtle text-warning border border-warning-subtle d-inline-flex align-items-center gap-1">
                            <AlertTriangle size={12} />
                            <span>{en._count.validationIssues} Issues</span>
                          </span>
                        ) : (
                          <span className="badge bg-success-subtle text-success border border-success-subtle d-inline-flex align-items-center gap-1">
                            <CheckCircle size={12} />
                            <span>Compliant</span>
                          </span>
                        )}
                      </td>
                      <td>
                        <div className="d-flex align-items-center gap-1">
                          <Link
                            to={`/students/${en.id}`}
                            className="btn btn-xs btn-outline-primary py-1 px-2 d-inline-flex align-items-center gap-1"
                            style={{ fontSize: '0.75rem' }}
                            title="View student profile & issues"
                          >
                            <Eye size={13} />
                            <span>Details</span>
                          </Link>
                          <Link
                            to={`/students/${en.id}?tab=certificate`}
                            className="btn btn-xs btn-outline-secondary py-1 px-2 d-inline-flex align-items-center gap-1"
                            style={{ fontSize: '0.75rem' }}
                            title="Preview Certificate / Record"
                          >
                            <FileText size={13} />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="7" className="text-center py-5 text-muted small">
                    No student records matched your filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
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

      {/* Add Student Record Modal */}
      {showAddModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content border-0 shadow">
              <div className="modal-header">
                <h5 className="modal-title fw-bold">Add Student & Academic Enrolment</h5>
                <button type="button" className="btn-close" onClick={() => setShowAddModal(false)}></button>
              </div>

              <form onSubmit={handleCreateStudent}>
                <div className="modal-body">
                  {formError && <div className="alert alert-danger py-2 small">{formError}</div>}

                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label small fw-semibold">First Name *</label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        required
                        value={formData.firstName}
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label small fw-semibold">Last Name *</label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        required
                        value={formData.lastName}
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label small fw-semibold">Institutional Student ID / Roll No *</label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        placeholder="e.g. AIT-25-CSE-099"
                        required
                        value={formData.institutionStudentId}
                        onChange={(e) => setFormData({ ...formData, institutionStudentId: e.target.value })}
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label small fw-semibold">
                        APAAR ID / ABC Token <span className="text-muted fw-normal">(12-digits or DEMO-APAAR-XXXXXX)</span>
                      </label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        placeholder="e.g. DEMO-APAAR-000099"
                        value={formData.apaarId}
                        onChange={(e) => setFormData({ ...formData, apaarId: e.target.value })}
                      />
                    </div>

                    <div className="col-md-4">
                      <label className="form-label small fw-semibold">Programme *</label>
                      <select
                        className="form-select form-select-sm"
                        required
                        value={formData.programmeId}
                        onChange={(e) => setFormData({ ...formData, programmeId: e.target.value })}
                      >
                        {programmes.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} ({p.code})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="col-md-4">
                      <label className="form-label small fw-semibold">Academic Year *</label>
                      <select
                        className="form-select form-select-sm"
                        required
                        value={formData.academicYearId}
                        onChange={(e) => setFormData({ ...formData, academicYearId: e.target.value })}
                      >
                        {academicYears.map((ay) => (
                          <option key={ay.id} value={ay.id}>
                            {ay.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="col-md-4">
                      <label className="form-label small fw-semibold">Admission Category *</label>
                      <select
                        className="form-select form-select-sm"
                        required
                        value={formData.admissionCategory}
                        onChange={(e) => setFormData({ ...formData, admissionCategory: e.target.value })}
                      >
                        <option value="GENERAL">General</option>
                        <option value="OBC">OBC</option>
                        <option value="SC">SC</option>
                        <option value="ST">ST</option>
                        <option value="EWS">EWS</option>
                        <option value="NRI">NRI</option>
                        <option value="OCI">OCI</option>
                        <option value="FOREIGN_NATIONAL">Foreign National</option>
                        <option value="SUPERNUMERARY">Supernumerary</option>
                      </select>
                    </div>

                    <div className="col-md-6">
                      <label className="form-label small fw-semibold">Admission Date *</label>
                      <input
                        type="date"
                        className="form-control form-control-sm"
                        required
                        value={formData.admissionDate}
                        onChange={(e) => setFormData({ ...formData, admissionDate: e.target.value })}
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label small fw-semibold">Email Address</label>
                      <input
                        type="email"
                        className="form-control form-control-sm"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      />
                    </div>

                    <div className="col-12">
                      <div className="d-flex gap-4 p-2 bg-light rounded border">
                        <div className="form-check">
                          <input
                            type="checkbox"
                            className="form-check-input"
                            id="checkNri"
                            checked={formData.isNri}
                            onChange={(e) => setFormData({ ...formData, isNri: e.target.checked })}
                          />
                          <label className="form-check-label small" htmlFor="checkNri">
                            NRI Seat Quota
                          </label>
                        </div>
                        <div className="form-check">
                          <input
                            type="checkbox"
                            className="form-check-input"
                            id="checkOci"
                            checked={formData.isOci}
                            onChange={(e) => setFormData({ ...formData, isOci: e.target.checked })}
                          />
                          <label className="form-check-label small" htmlFor="checkOci">
                            OCI / PIO Quota
                          </label>
                        </div>
                        <div className="form-check">
                          <input
                            type="checkbox"
                            className="form-check-input"
                            id="checkSuper"
                            checked={formData.isSupernumerary}
                            onChange={(e) => setFormData({ ...formData, isSupernumerary: e.target.checked })}
                          />
                          <label className="form-check-label small" htmlFor="checkSuper">
                            Supernumerary
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="modal-footer">
                  <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => setShowAddModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-sm btn-primary-et" disabled={submitting}>
                    {submitting ? 'Registering...' : 'Register Student'}
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
