import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  ShieldCheck,
  AlertTriangle,
  FileText,
  Printer,
  Edit,
  CheckCircle2,
  Lock,
  Sparkles,
  Info,
  Clock,
  BookOpen,
} from 'lucide-react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function StudentDetail() {
  const { id } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'overview';
  const { user, hasRole } = useAuth();

  const [enrollment, setEnrollment] = useState(null);
  const [certificate, setCertificate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Edit APAAR Modal
  const [showEditApaar, setShowEditApaar] = useState(false);
  const [newApaar, setNewApaar] = useState('');
  const [updating, setUpdating] = useState(false);

  // Unmask toggle for certificate
  const [unmaskCertificate, setUnmaskCertificate] = useState(false);

  const fetchStudent = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/students/${id}`);
      setEnrollment(res.data.enrollment);
      setNewApaar(res.data.enrollment.student?.apaarMasked || '');
      setError(null);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load student details');
    } finally {
      setLoading(false);
    }
  };

  const fetchCertificate = async () => {
    try {
      const res = await api.get(`/students/${id}/certificate-preview`, {
        params: { unmask: unmaskCertificate },
      });
      setCertificate(res.data.certificate);
    } catch (err) {
      console.error('Failed to load certificate preview:', err);
    }
  };

  useEffect(() => {
    fetchStudent();
  }, [id]);

  useEffect(() => {
    if (activeTab === 'certificate') {
      fetchCertificate();
    }
  }, [id, activeTab, unmaskCertificate]);

  const handleUpdateApaar = async (e) => {
    e.preventDefault();
    setUpdating(true);
    try {
      await api.patch(`/students/${id}`, { apaarId: newApaar });
      setShowEditApaar(false);
      fetchStudent();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update APAAR ID');
    } finally {
      setUpdating(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="d-flex align-items-center justify-content-center py-5">
        <div className="spinner-border text-primary" role="status"></div>
        <span className="ms-2 text-muted">Loading student profile...</span>
      </div>
    );
  }

  if (error || !enrollment) {
    return (
      <div className="alert alert-danger d-flex align-items-center justify-content-between">
        <span>{error || 'Student record not found'}</span>
        <Link to="/students" className="btn btn-sm btn-outline-danger">
          Back to Students List
        </Link>
      </div>
    );
  }

  const { student, institution, programme, academicYear, validationIssues, exceptionCases } = enrollment;

  return (
    <div>
      {/* Back button */}
      <div className="mb-3 no-print">
        <Link to="/students" className="btn btn-sm btn-link text-decoration-none p-0 d-inline-flex align-items-center gap-1 text-muted">
          <ArrowLeft size={16} />
          <span>Back to Students</span>
        </Link>
      </div>

      {/* Student Profile Header */}
      <div className="glass-card mb-4 no-print">
        <div className="p-4 d-flex flex-wrap align-items-center justify-content-between gap-3">
          <div className="d-flex align-items-center gap-3">
            <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center fw-bold fs-4" style={{ width: 56, height: 56 }}>
              {enrollment.firstName?.[0]}{enrollment.lastName?.[0]}
            </div>
            <div>
              <div className="d-flex align-items-center gap-2">
                <h4 className="fw-bold mb-0 text-dark">
                  {enrollment.firstName} {enrollment.lastName}
                </h4>
                <span className={`badge-apaar badge-apaar-${student?.apaarStatus || 'MISSING'}`}>
                  {student?.apaarStatus}
                </span>
              </div>
              <div className="text-muted small mt-1">
                Roll No: <span className="font-monospace fw-semibold text-dark">{enrollment.institutionStudentId}</span> •{' '}
                {programme?.name} ({programme?.code}) • {institution?.name}
              </div>
            </div>
          </div>

          <div className="d-flex gap-2">
            {hasRole('PLATFORM_ADMIN', 'INSTITUTION_ADMIN') && (
              <button className="btn btn-sm btn-outline-primary d-flex align-items-center gap-1" onClick={() => setShowEditApaar(true)}>
                <Edit size={14} />
                <span>Update APAAR</span>
              </button>
            )}
            <button
              className={`btn btn-sm ${activeTab === 'certificate' ? 'btn-primary' : 'btn-outline-secondary'} d-flex align-items-center gap-1`}
              onClick={() => setSearchParams({ tab: 'certificate' })}
            >
              <FileText size={14} />
              <span>Certificate View</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-top px-4 pt-2 d-flex gap-4">
          <button
            className={`btn btn-link text-decoration-none px-1 py-2 fw-semibold ${
              activeTab === 'overview' ? 'text-primary border-bottom border-primary border-2' : 'text-muted'
            }`}
            onClick={() => setSearchParams({ tab: 'overview' })}
          >
            Overview & APAAR Identity
          </button>
          <button
            className={`btn btn-link text-decoration-none px-1 py-2 fw-semibold d-flex align-items-center gap-1 ${
              activeTab === 'validation' ? 'text-primary border-bottom border-primary border-2' : 'text-muted'
            }`}
            onClick={() => setSearchParams({ tab: 'validation' })}
          >
            <span>Validation Findings</span>
            {validationIssues?.length > 0 && (
              <span className="badge bg-warning text-dark py-0 px-1" style={{ fontSize: '0.7rem' }}>
                {validationIssues.length}
              </span>
            )}
          </button>
          <button
            className={`btn btn-link text-decoration-none px-1 py-2 fw-semibold ${
              activeTab === 'cases' ? 'text-primary border-bottom border-primary border-2' : 'text-muted'
            }`}
            onClick={() => setSearchParams({ tab: 'cases' })}
          >
            Exception Cases ({exceptionCases?.length || 0})
          </button>
          <button
            className={`btn btn-link text-decoration-none px-1 py-2 fw-semibold ${
              activeTab === 'certificate' ? 'text-primary border-bottom border-primary border-2' : 'text-muted'
            }`}
            onClick={() => setSearchParams({ tab: 'certificate' })}
          >
            Academic Record & Certificate
          </button>
        </div>
      </div>

      {/* Tab: Overview */}
      {activeTab === 'overview' && (
        <div className="row g-4 no-print">
          <div className="col-md-6">
            <div className="glass-card h-100">
              <div className="glass-card-header">
                <h6 className="mb-0 fw-bold">Academic Identity Token (APAAR)</h6>
                <span className="badge bg-light text-muted border">HMAC Tokenized</span>
              </div>
              <div className="glass-card-body">
                <div className="mb-3">
                  <div className="text-muted small">Masked APAAR Identifier</div>
                  <div className="fs-5 fw-bold font-monospace text-primary">
                    {student?.apaarMasked || 'NOT REGISTERED'}
                  </div>
                </div>

                <div className="mb-3">
                  <div className="text-muted small">Validation Lifecycle State</div>
                  <span className={`badge-apaar badge-apaar-${student?.apaarStatus}`}>
                    {student?.apaarStatus}
                  </span>
                </div>

                <div className="p-3 bg-light rounded border text-muted small">
                  <div className="fw-semibold text-dark mb-1 d-flex align-items-center gap-1">
                    <Lock size={14} className="text-success" />
                    <span>Cryptographic Protection</span>
                  </div>
                  Raw APAAR identifiers are never stored in plaintext. They are encrypted using AES-256 and represented by a non-reversible HMAC-SHA256 token for duplicate matching without cross-institution data exposure.
                </div>
              </div>
            </div>
          </div>

          <div className="col-md-6">
            <div className="glass-card h-100">
              <div className="glass-card-header">
                <h6 className="mb-0 fw-bold">Admission & Quota Profile</h6>
                <span className="badge bg-light text-dark border">{enrollment.admissionCategory}</span>
              </div>
              <div className="glass-card-body">
                <div className="row g-3">
                  <div className="col-6">
                    <div className="text-muted small">Admission Date</div>
                    <div className="fw-semibold">{new Date(enrollment.admissionDate).toLocaleDateString()}</div>
                  </div>
                  <div className="col-6">
                    <div className="text-muted small">Academic Session</div>
                    <div className="fw-semibold">{academicYear?.label}</div>
                  </div>
                  <div className="col-6">
                    <div className="text-muted small">NRI Quota Seat</div>
                    <div className="fw-semibold">{enrollment.isNri ? 'Yes (Under 5% Sub-Limit)' : 'No'}</div>
                  </div>
                  <div className="col-6">
                    <div className="text-muted small">OCI / PIO Quota</div>
                    <div className="fw-semibold">{enrollment.isOci ? 'Yes (Supernumerary)' : 'No'}</div>
                  </div>
                  <div className="col-6">
                    <div className="text-muted small">Contact Email</div>
                    <div className="small text-truncate">{enrollment.email || 'N/A'}</div>
                  </div>
                  <div className="col-6">
                    <div className="text-muted small">Contact Phone</div>
                    <div className="small">{enrollment.phone || 'N/A'}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Validation Findings */}
      {activeTab === 'validation' && (
        <div className="no-print">
          {validationIssues?.length > 0 ? (
            <div className="d-flex flex-column gap-3">
              {validationIssues.map((issue) => (
                <div key={issue.id} className="card border-0 shadow-sm rounded-3 p-3 border-start border-4 border-warning bg-white">
                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <div className="d-flex align-items-center gap-2">
                      <span className="badge bg-warning-subtle text-warning border border-warning-subtle font-monospace">
                        {issue.rule?.code || 'RULE'}
                      </span>
                      <h6 className="mb-0 fw-bold">{issue.rule?.name}</h6>
                    </div>
                    <span className="badge bg-light text-muted border">
                      Severity: {issue.severity}
                    </span>
                  </div>

                  <p className="text-secondary small mb-2">{issue.explanation}</p>

                  {issue.recommendedAction && (
                    <div className="p-2 bg-light rounded small text-dark mb-2">
                      <strong>Recommended Correction:</strong> {issue.recommendedAction}
                    </div>
                  )}

                  <div className="d-flex align-items-center justify-content-between pt-2 border-top">
                    <div className="text-muted small">
                      Affected Attributes: {issue.fieldsAffected?.join(', ') || 'N/A'}
                    </div>
                    <button
                      className="btn btn-sm btn-outline-primary"
                      onClick={() => setShowEditApaar(true)}
                    >
                      Apply Inline Correction
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="glass-card text-center py-5">
              <CheckCircle2 size={40} className="text-success mb-2" />
              <h6 className="fw-bold">No Active Compliance Issues</h6>
              <p className="text-muted small mb-0">This student record complies with all AICTE format, consistency, and capacity rules.</p>
            </div>
          )}
        </div>
      )}

      {/* Tab: Exception Cases */}
      {activeTab === 'cases' && (
        <div className="no-print">
          {exceptionCases?.length > 0 ? (
            <div className="d-flex flex-column gap-3">
              {exceptionCases.map((c) => (
                <div key={c.id} className="card border-0 shadow-sm rounded-3 p-3 bg-white">
                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <div className="d-flex align-items-center gap-2">
                      <span className="badge bg-danger-subtle text-danger border border-danger-subtle">
                        {c.type}
                      </span>
                      <h6 className="mb-0 fw-bold">{c.title}</h6>
                    </div>
                    <span className="badge bg-light text-dark border">
                      Status: {c.status}
                    </span>
                  </div>
                  <p className="text-muted small mb-3">{c.description}</p>
                  <div className="d-flex align-items-center justify-content-between pt-2 border-top text-muted small">
                    <span>Assigned to: {c.assignedTo ? `${c.assignedTo.firstName} ${c.assignedTo.lastName}` : 'Unassigned'}</span>
                    <Link to="/cases" className="btn btn-sm btn-link p-0 text-decoration-none">
                      Manage Case →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="glass-card text-center py-5">
              <Info size={36} className="text-muted mb-2" />
              <h6 className="fw-bold">No Exception Cases Logged</h6>
              <p className="text-muted small mb-0">There are no escalated governance or duplicate cases associated with this enrollment.</p>
            </div>
          )}
        </div>
      )}

      {/* Tab: Certificate / Academic Record Preview (Phase 14 & Printable) */}
      {activeTab === 'certificate' && certificate && (
        <div>
          {/* Print Controls Bar */}
          <div className="card border-0 shadow-sm p-3 mb-4 bg-white no-print">
            <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
              <div className="d-flex align-items-center gap-2">
                <FileText size={20} className="text-primary" />
                <div>
                  <div className="fw-bold small">Printable Student Academic Verification Record</div>
                  <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                    Standard template displaying Student ID, APAAR ID, and AICTE institution approval
                  </div>
                </div>
              </div>

              <div className="d-flex align-items-center gap-3">
                {hasRole('PLATFORM_ADMIN', 'INSTITUTION_ADMIN') && (
                  <div className="form-check form-switch mb-0">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="unmaskToggle"
                      checked={unmaskCertificate}
                      onChange={(e) => setUnmaskCertificate(e.target.checked)}
                    />
                    <label className="form-check-label small" htmlFor="unmaskToggle">
                      Unmask APAAR (Authorized Only)
                    </label>
                  </div>
                )}

                <button className="btn btn-sm btn-primary-et d-flex align-items-center gap-2" onClick={handlePrint}>
                  <Printer size={15} />
                  <span>Print Document</span>
                </button>
              </div>
            </div>
          </div>

          {/* Printable Document Sheet */}
          <div className="printable-document p-5 mx-auto shadow-sm" style={{ maxWidth: 840 }}>
            {/* Watermark Overlay */}
            <div className="watermark-overlay">
              {certificate.watermark}
            </div>

            {/* Document Header */}
            <div className="text-center pb-4 mb-4 border-bottom border-2 border-dark position-relative">
              <div className="text-uppercase small fw-bold text-muted tracking-wider mb-1">
                All India Council for Technical Education (AICTE) Approved Institution
              </div>
              <h3 className="fw-bold mb-1 text-dark text-uppercase tracking-wide">
                {certificate.institution.name}
              </h3>
              <div className="small text-muted mb-2">
                AICTE Approval Code: <strong className="font-monospace">{certificate.institution.code}</strong> • {certificate.institution.address}
              </div>
              <div className="badge bg-dark text-white px-3 py-1 font-monospace" style={{ fontSize: '0.78rem' }}>
                STUDENT ACADEMIC IDENTITY & ADMISSION RECORD
              </div>
            </div>

            {/* Document Meta Row */}
            <div className="row g-2 mb-4 small">
              <div className="col-6">
                <span className="text-muted">Document Reference:</span>{' '}
                <strong className="font-monospace">{certificate.documentNumber}</strong>
              </div>
              <div className="col-6 text-end">
                <span className="text-muted">Issued Date:</span>{' '}
                <strong>{new Date(certificate.generatedAt).toLocaleDateString()}</strong>
              </div>
            </div>

            {/* Student Details Grid */}
            <div className="card border border-dark rounded-2 p-3 mb-4 bg-transparent position-relative">
              <h6 className="fw-bold text-uppercase border-bottom pb-2 mb-3 small">
                Student & Academic Enrollment Particulars
              </h6>

              <div className="row g-3" style={{ fontSize: '0.88rem' }}>
                <div className="col-sm-6">
                  <div className="text-muted small">Student Full Name:</div>
                  <div className="fw-bold fs-6">{certificate.student.fullName}</div>
                </div>

                <div className="col-sm-6">
                  <div className="text-muted small">Institutional Student Roll No:</div>
                  <div className="fw-bold font-monospace fs-6">{certificate.student.institutionStudentId}</div>
                </div>

                <div className="col-sm-6">
                  <div className="text-muted small">APAAR Academic Account ID:</div>
                  <div className="fw-bold font-monospace text-primary fs-6">
                    {certificate.student.apaarId}
                  </div>
                  <div className="text-muted" style={{ fontSize: '0.7rem' }}>
                    Status: {certificate.student.apaarStatus}
                  </div>
                </div>

                <div className="col-sm-6">
                  <div className="text-muted small">Enrolled Programme:</div>
                  <div className="fw-bold">{certificate.student.programme} ({certificate.student.programmeCode})</div>
                </div>

                <div className="col-sm-6">
                  <div className="text-muted small">Academic Session:</div>
                  <div className="fw-semibold">{certificate.student.academicYear}</div>
                </div>

                <div className="col-sm-6">
                  <div className="text-muted small">Admission Quota / Category:</div>
                  <div className="fw-semibold">{certificate.student.admissionCategory}</div>
                </div>

                <div className="col-sm-6">
                  <div className="text-muted small">Admission Date:</div>
                  <div>{new Date(certificate.student.admissionDate).toLocaleDateString()}</div>
                </div>

                <div className="col-sm-6">
                  <div className="text-muted small">Compliance & Validation Status:</div>
                  <div className="fw-bold text-success">
                    {certificate.complianceStatus}
                  </div>
                </div>
              </div>
            </div>

            {/* Regulatory Sign-off */}
            <div className="row align-items-end mt-5 pt-4">
              <div className="col-6">
                <div className="font-monospace small text-muted">
                  Digitally Authenticated by EduTrace
                  <br />
                  Cryptographic Integrity Token Valid
                </div>
              </div>
              <div className="col-6 text-end">
                <div className="d-inline-block border-top border-dark pt-1 px-4 text-center">
                  <div className="fw-bold small">Authorized Signatory</div>
                  <div className="text-muted" style={{ fontSize: '0.72rem' }}>Registrar / Academic Dean</div>
                </div>
              </div>
            </div>

            {/* Disclaimer Footer */}
            <div className="mt-4 pt-3 border-top text-center text-muted" style={{ fontSize: '0.68rem', lineHeight: 1.4 }}>
              <strong>PROTOTYPE DISCLAIMER:</strong> {certificate.disclaimer}
            </div>
          </div>
        </div>
      )}

      {/* Edit APAAR Modal */}
      {showEditApaar && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow">
              <div className="modal-header">
                <h5 className="modal-title fw-bold">Update APAAR Identifier</h5>
                <button type="button" className="btn-close" onClick={() => setShowEditApaar(false)}></button>
              </div>
              <form onSubmit={handleUpdateApaar}>
                <div className="modal-body">
                  <p className="text-muted small">
                    Updating the APAAR ID will re-evaluate format validation (FMT-01/02), intra-institution duplicate matches (DUP-01), and cross-institution conflicts (DUP-02).
                  </p>
                  <div className="mb-3">
                    <label className="form-label small fw-semibold">New APAAR ID</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. 123456789012 or DEMO-APAAR-XXXXXX"
                      value={newApaar}
                      onChange={(e) => setNewApaar(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => setShowEditApaar(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-sm btn-primary-et" disabled={updating}>
                    {updating ? 'Validating...' : 'Update & Re-validate'}
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
