import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Upload,
  FileSpreadsheet,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Download,
  ArrowRight,
  ArrowLeft,
  FileCheck,
  RefreshCw,
  Info,
} from 'lucide-react';
import api from '../api/client';

export default function ImportWizard() {
  const [step, setStep] = useState(1);
  const [academicYears, setAcademicYears] = useState([]);
  const [academicYearId, setAcademicYearId] = useState('');
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [job, setJob] = useState(null);
  const [previewRows, setPreviewRows] = useState([]);
  const [committing, setCommitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadYears() {
      try {
        const res = await api.get('/institutions/academic-years/all');
        const years = res.data.academicYears || [];
        setAcademicYears(years);
        if (years.length > 0) setAcademicYearId(years[0].id);
      } catch (err) {
        console.error('Failed to load academic years:', err);
      }
    }
    loadYears();
  }, []);

  const handleFileChange = (e) => {
    if (e.target.files?.[0]) {
      setFile(e.target.files[0]);
      setError(null);
    }
  };

  const handleUploadDryRun = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a CSV or Excel file to upload');
      return;
    }

    setUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('academicYearId', academicYearId);

    try {
      const res = await api.post('/import-jobs', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setJob(res.data.job);
      setPreviewRows(res.data.previewRows || []);
      setStep(3); // Go to dry-run results
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to upload and validate file');
    } finally {
      setUploading(false);
    }
  };

  const handleCommit = async () => {
    if (!job) return;
    setCommitting(true);
    setError(null);

    try {
      const res = await api.post(`/import-jobs/${job.id}/commit`);
      setJob(res.data.job);
      setStep(5); // Success confirmation
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to commit import job');
    } finally {
      setCommitting(false);
    }
  };

  const handleDownloadTemplate = () => {
    window.location.href = `${api.defaults.baseURL}/import-jobs/template`;
  };

  return (
    <div className="mx-auto" style={{ maxWidth: 960 }}>
      {/* Page Header */}
      <div className="mb-4">
        <h4 className="fw-bold text-dark mb-1">Bulk Student Data Import Wizard</h4>
        <p className="text-muted small mb-0">
          Staged ingestion pipeline with multi-layer dry run, APAAR format check, and duplicate detection
        </p>
      </div>

      {/* 5-Step Progress Indicator */}
      <div className="card border-0 shadow-sm rounded-3 p-3 mb-4 bg-white">
        <div className="d-flex align-items-center justify-content-between position-relative">
          {[
            { num: 1, title: 'Upload File' },
            { num: 2, title: 'Dry-Run Check' },
            { num: 3, title: 'Validation Results' },
            { num: 4, title: 'Confirm Commit' },
            { num: 5, title: 'Complete' },
          ].map((s) => {
            const isCompleted = step > s.num;
            const isCurrent = step === s.num;

            return (
              <div key={s.num} className="d-flex flex-column align-items-center z-1 text-center" style={{ minWidth: 90 }}>
                <div
                  className={`rounded-circle d-flex align-items-center justify-content-center fw-bold mb-1 ${
                    isCompleted
                      ? 'bg-success text-white'
                      : isCurrent
                      ? 'bg-primary text-white'
                      : 'bg-light text-muted border'
                  }`}
                  style={{ width: 32, height: 32, fontSize: '0.85rem' }}
                >
                  {isCompleted ? <CheckCircle size={16} /> : s.num}
                </div>
                <div
                  className={`small ${isCurrent ? 'fw-bold text-dark' : 'text-muted'}`}
                  style={{ fontSize: '0.72rem' }}
                >
                  {s.title}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {error && (
        <div className="alert alert-danger py-2 px-3 small d-flex align-items-center gap-2 mb-4">
          <AlertTriangle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Step 1: Upload */}
      {step === 1 && (
        <div className="glass-card p-4">
          <h5 className="fw-bold mb-3">Step 1: Select Academic Dataset</h5>

          <form onSubmit={handleUploadDryRun}>
            <div className="row g-3 mb-4">
              <div className="col-md-6">
                <label className="form-label small fw-semibold">Target Academic Session</label>
                <select
                  className="form-select form-select-sm"
                  value={academicYearId}
                  onChange={(e) => setAcademicYearId(e.target.value)}
                  required
                >
                  {academicYears.map((ay) => (
                    <option key={ay.id} value={ay.id}>
                      {ay.label} ({new Date(ay.startDate).getFullYear()} - {new Date(ay.endDate).getFullYear()})
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-md-6 d-flex align-items-end">
                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary w-100 d-flex align-items-center justify-content-center gap-2"
                  onClick={handleDownloadTemplate}
                >
                  <Download size={14} />
                  <span>Download Sample CSV Template</span>
                </button>
              </div>
            </div>

            {/* Drag & Drop File Box */}
            <div
              className="border border-2 border-dashed rounded-3 p-5 text-center mb-4 bg-light"
              style={{ cursor: 'pointer' }}
              onClick={() => document.getElementById('fileUploadInput').click()}
            >
              <FileSpreadsheet size={48} className="text-primary mb-2 opacity-75" />
              <h6 className="fw-semibold mb-1">
                {file ? file.name : 'Click to select or drag CSV / Excel file'}
              </h6>
              <p className="text-muted small mb-0">
                {file ? `${(file.size / 1024).toFixed(1)} KB` : 'Supports .csv and .xlsx files (Max 5MB)'}
              </p>
              <input
                id="fileUploadInput"
                type="file"
                className="d-none"
                accept=".csv, .xlsx, .xls"
                onChange={handleFileChange}
              />
            </div>

            <div className="p-3 bg-light rounded border text-muted small mb-4">
              <div className="fw-semibold text-dark mb-1 d-flex align-items-center gap-1">
                <Info size={14} className="text-primary" />
                <span>Dry-Run Pipeline Information</span>
              </div>
              Uploading does not immediately insert records into the database. A 5-layer dry-run test checks column headers, APAAR format (12-digit), duplicate hashes, and approved intake capacity.
            </div>

            <div className="d-flex justify-content-end">
              <button type="submit" className="btn btn-primary-et d-flex align-items-center gap-2" disabled={!file || uploading}>
                {uploading ? (
                  <>
                    <div className="spinner-border spinner-border-sm" role="status"></div>
                    <span>Running Dry-Run Checks...</span>
                  </>
                ) : (
                  <>
                    <span>Execute Dry-Run Pipeline</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Step 3: Dry-Run Results */}
      {step === 3 && job && (
        <div className="glass-card p-4">
          <div className="d-flex align-items-center justify-content-between mb-4">
            <div>
              <h5 className="fw-bold mb-1">Step 3: Dry-Run Pipeline Results</h5>
              <div className="text-muted small">File: <strong>{job.fileName}</strong> • Status: {job.status}</div>
            </div>
            <button className="btn btn-sm btn-outline-secondary" onClick={() => setStep(1)}>
              Upload Another
            </button>
          </div>

          {/* Metric Badges */}
          <div className="row g-3 mb-4">
            <div className="col-3">
              <div className="p-3 bg-light rounded border text-center">
                <div className="text-muted small">Total Rows</div>
                <div className="fs-4 fw-bold">{job.totalRows}</div>
              </div>
            </div>
            <div className="col-3">
              <div className="p-3 bg-success bg-opacity-10 border border-success border-opacity-25 rounded text-center">
                <div className="text-success small fw-semibold">Accepted</div>
                <div className="fs-4 fw-bold text-success">{job.acceptedRows}</div>
              </div>
            </div>
            <div className="col-3">
              <div className="p-3 bg-warning bg-opacity-10 border border-warning border-opacity-25 rounded text-center">
                <div className="text-warning small fw-semibold">Flagged (Warnings)</div>
                <div className="fs-4 fw-bold text-warning">{job.flaggedRows}</div>
              </div>
            </div>
            <div className="col-3">
              <div className="p-3 bg-danger bg-opacity-10 border border-danger border-opacity-25 rounded text-center">
                <div className="text-danger small fw-semibold">Rejected (Errors)</div>
                <div className="fs-4 fw-bold text-danger">{job.rejectedRows}</div>
              </div>
            </div>
          </div>

          {/* Preview Row Results Table */}
          <h6 className="fw-bold mb-2">Parsed Row Samples (Preview)</h6>
          <div className="table-responsive mb-4 border rounded">
            <table className="et-table mb-0">
              <thead>
                <tr>
                  <th>Row</th>
                  <th>Status</th>
                  <th>Student Name</th>
                  <th>APAAR Token</th>
                  <th>Programme</th>
                  <th>Validation Notes / Errors</th>
                </tr>
              </thead>
              <tbody>
                {previewRows.map((r) => (
                  <tr key={r.rowNumber}>
                    <td className="font-monospace small">#{r.rowNumber}</td>
                    <td>
                      <span className={`badge ${
                        r.status === 'ACCEPTED'
                          ? 'bg-success-subtle text-success border border-success-subtle'
                          : r.status === 'FLAGGED'
                          ? 'bg-warning-subtle text-warning border border-warning-subtle'
                          : 'bg-danger-subtle text-danger'
                      }`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="fw-medium">
                      {r.rawData?.firstName} {r.rawData?.lastName}
                    </td>
                    <td className="font-monospace small">
                      {r.rawData?.apaarId || 'MISSING'}
                    </td>
                    <td>{r.rawData?.programmeCode || 'CSE'}</td>
                    <td className="small text-danger">
                      {r.errors?.map((err, i) => (
                        <div key={i}>
                          <strong>{err.field}:</strong> {err.message}
                        </div>
                      ))}
                      {(!r.errors || r.errors.length === 0) && (
                        <span className="text-success">Validated successfully</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="d-flex justify-content-between pt-3 border-top">
            <button className="btn btn-sm btn-outline-secondary" onClick={() => setStep(1)}>
              <ArrowLeft size={14} className="me-1" />
              <span>Back to Upload</span>
            </button>

            <button
              className="btn btn-primary-et d-flex align-items-center gap-2"
              onClick={() => setStep(4)}
              disabled={job.acceptedRows === 0}
            >
              <span>Proceed to Commit ({job.acceptedRows} Records)</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Confirm Commit */}
      {step === 4 && job && (
        <div className="glass-card p-4 text-center">
          <FileCheck size={48} className="text-primary mx-auto mb-3" />
          <h5 className="fw-bold mb-2">Confirm Database Ingestion</h5>
          <p className="text-muted small mb-4" style={{ maxWidth: 480, margin: '0 auto' }}>
            You are about to commit <strong>{job.acceptedRows}</strong> validated student records into PostgreSQL. Each student record will be encrypted with AES-256 and assigned an HMAC token for duplicate indexing.
          </p>

          <div className="d-flex justify-content-center gap-3">
            <button className="btn btn-sm btn-outline-secondary" onClick={() => setStep(3)}>
              Review Results Again
            </button>
            <button className="btn btn-primary-et py-2 px-4" onClick={handleCommit} disabled={committing}>
              {committing ? 'Committing to Database...' : 'Confirm & Ingest Records'}
            </button>
          </div>
        </div>
      )}

      {/* Step 5: Complete */}
      {step === 5 && job && (
        <div className="glass-card p-5 text-center">
          <CheckCircle size={56} className="text-success mx-auto mb-3" />
          <h4 className="fw-bold mb-2">Import Successfully Committed!</h4>
          <p className="text-muted small mb-4">
            Batch ID: <span className="font-monospace">{job.id}</span>
            <br />
            {job.acceptedRows} student records are now actively enrolled in EduTrace.
          </p>

          <div className="d-flex justify-content-center gap-3">
            <Link to="/students" className="btn btn-primary-et">
              View Student Records
            </Link>
            <Link to="/validation" className="btn btn-outline-secondary">
              Inspect Validation Workbench
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
