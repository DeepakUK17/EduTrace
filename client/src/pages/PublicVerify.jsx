import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Building2,
  GraduationCap,
  Calendar,
  Lock,
  Sparkles,
} from 'lucide-react';
import api from '../api/client';

export default function PublicVerify() {
  const { tokenRef } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function verify() {
      setLoading(true);
      try {
        const res = await api.get(`/verify/${tokenRef}`);
        setData(res.data);
        setError(null);
      } catch (err) {
        setError(err.response?.data?.error || 'Verification reference is invalid, expired, or revoked');
        setData(null);
      } finally {
        setLoading(false);
      }
    }
    verify();
  }, [tokenRef]);

  return (
    <div className="min-vh-100 bg-light d-flex flex-column">
      {/* Top Banner */}
      <div className="bg-dark text-info text-center py-2 px-3 small fw-medium d-flex align-items-center justify-content-center gap-2">
        <Sparkles size={14} />
        <span>EduTrace Prototype Academic Verification • AICTE PS 26263</span>
      </div>

      <div className="container py-5 flex-grow-1 d-flex align-items-center justify-content-center">
        <div className="card border-0 shadow-sm rounded-4 overflow-hidden" style={{ maxWidth: 640, width: '100%' }}>
          {/* Header */}
          <div className="p-4 text-white text-center" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)' }}>
            <div className="bg-primary bg-opacity-25 p-2 rounded-circle d-inline-flex mb-2">
              <ShieldCheck size={36} className="text-info" />
            </div>
            <h4 className="fw-bold mb-1">Academic Credential Verification</h4>
            <div className="text-info small font-monospace">Token Ref: {tokenRef}</div>
          </div>

          <div className="p-4 p-md-5 bg-white">
            {loading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status"></div>
                <div className="text-muted small mt-2">Resolving opaque cryptographic reference...</div>
              </div>
            ) : error ? (
              <div className="text-center py-4">
                <XCircle size={56} className="text-danger mb-3" />
                <h5 className="fw-bold text-dark">Verification Failed</h5>
                <p className="text-muted small mb-4">{error}</p>
                <div className="p-3 bg-light rounded small text-muted border">
                  The verification token reference could not be validated. It may have expired, been revoked by the institution, or already used in single-use mode.
                </div>
              </div>
            ) : data ? (
              <div>
                {/* Success Indicator */}
                <div className="d-flex align-items-center gap-3 p-3 bg-success bg-opacity-10 border border-success border-opacity-25 rounded-3 mb-4">
                  <CheckCircle2 size={32} className="text-success flex-shrink-0" />
                  <div>
                    <h6 className="fw-bold text-success mb-1">Authentic Academic Record Verified</h6>
                    <div className="text-muted small" style={{ fontSize: '0.78rem' }}>
                      Cryptographic token resolved with institution-authorized disclosure permissions.
                    </div>
                  </div>
                </div>

                {/* Disclosed Fields Grid */}
                <div className="card border rounded-3 p-3 mb-4 bg-light">
                  <h6 className="fw-bold text-uppercase small text-secondary mb-3 border-bottom pb-2">
                    Permitted Academic Disclosures
                  </h6>

                  <div className="row g-3 small">
                    {data.name && (
                      <div className="col-sm-6">
                        <div className="text-muted">Student Name:</div>
                        <div className="fw-bold fs-6">{data.name}</div>
                      </div>
                    )}

                    {data.institution && (
                      <div className="col-sm-6">
                        <div className="text-muted">AICTE Institution:</div>
                        <div className="fw-bold">{data.institution}</div>
                      </div>
                    )}

                    {data.programme && (
                      <div className="col-sm-6">
                        <div className="text-muted">Programme:</div>
                        <div className="fw-semibold">{data.programme}</div>
                      </div>
                    )}

                    {data.academicYear && (
                      <div className="col-sm-6">
                        <div className="text-muted">Academic Session:</div>
                        <div className="fw-semibold">{data.academicYear}</div>
                      </div>
                    )}

                    {data.apaarMasked && (
                      <div className="col-sm-6">
                        <div className="text-muted">Masked APAAR ID:</div>
                        <div className="fw-bold font-monospace text-primary">{data.apaarMasked}</div>
                      </div>
                    )}

                    {data.apaarStatus && (
                      <div className="col-sm-6">
                        <div className="text-muted">APAAR Identity State:</div>
                        <span className="badge bg-success-subtle text-success border border-success-subtle">
                          {data.apaarStatus}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {data.verificationNote && (
                  <p className="text-muted small mb-4" style={{ lineHeight: 1.5 }}>
                    {data.verificationNote}
                  </p>
                )}

                {/* Regulatory Disclaimer */}
                <div className="p-3 bg-light rounded text-center small text-muted border">
                  <strong>PROTOTYPE DISCLAIMER:</strong> {data.disclaimer || 'EduTrace Prototype Verification — NOT an Official APAAR Credential.'}
                </div>
              </div>
            ) : null}

            <div className="text-center mt-4 pt-3 border-top">
              <Link to="/login" className="small text-decoration-none text-muted">
                Return to EduTrace Portal
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
