import React, { useState, useEffect } from 'react';
import {
  Gauge,
  Sparkles,
  Play,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  Info,
  Calendar,
  Layers,
} from 'lucide-react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function CapacityTwin() {
  const { user } = useAuth();
  const [tab, setTab] = useState('twin'); // 'twin' | 'monitoring' | 'yoy'
  const [institutions, setInstitutions] = useState([]);
  const [selectedInstId, setSelectedInstId] = useState('');
  const [programmes, setProgrammes] = useState([]);
  const [selectedProgId, setSelectedProgId] = useState('');
  const [academicYears, setAcademicYears] = useState([]);
  const [selectedYearId, setSelectedYearId] = useState('');

  // What-If Simulation Inputs
  const [proposedGeneral, setProposedGeneral] = useState(10);
  const [proposedNri, setProposedNri] = useState(2);
  const [proposedOci, setProposedOci] = useState(1);
  const [proposedSuper, setProposedSuper] = useState(2);
  const [simulating, setSimulating] = useState(false);
  const [simResult, setSimResult] = useState(null);

  // YOY State
  const [fromYearId, setFromYearId] = useState('');
  const [toYearId, setToYearId] = useState('');
  const [yoyData, setYoyData] = useState(null);
  const [loadingYoy, setLoadingYoy] = useState(false);

  // Monitoring State
  const [intakeConfigs, setIntakeConfigs] = useState([]);

  useEffect(() => {
    async function loadInitial() {
      try {
        const [instRes, progRes, ayRes] = await Promise.all([
          api.get('/institutions'),
          api.get('/institutions/programmes/all'),
          api.get('/institutions/academic-years/all'),
        ]);

        const insts = instRes.data.institutions || [];
        const progs = progRes.data.programmes || [];
        const ays = ayRes.data.academicYears || [];

        setInstitutions(insts);
        setProgrammes(progs);
        setAcademicYears(ays);

        if (insts.length > 0) setSelectedInstId(user?.institutionId || insts[0].id);
        if (progs.length > 0) setSelectedProgId(progs[0].id);
        if (ays.length > 0) {
          setSelectedYearId(ays[0].id);
          if (ays.length > 1) {
            setFromYearId(ays[1].id);
            setToYearId(ays[0].id);
          }
        }
      } catch (err) {
        console.error('Failed to load initial data for capacity twin:', err);
      }
    }
    loadInitial();
  }, [user]);

  const handleRunSimulation = async (e) => {
    e?.preventDefault();
    setSimulating(true);
    setSimResult(null);

    try {
      const res = await api.post('/capacity/simulate', {
        institutionId: selectedInstId,
        programmeId: selectedProgId,
        academicYearId: selectedYearId,
        proposedAdditions: {
          general: Number(proposedGeneral),
          nri: Number(proposedNri),
          oci: Number(proposedOci),
          supernumerary: Number(proposedSuper),
        },
      });
      setSimResult(res.data.simulation);
    } catch (err) {
      alert(err.response?.data?.error || 'Simulation failed');
    } finally {
      setSimulating(false);
    }
  };

  const handleRunYoy = async () => {
    if (!fromYearId || !toYearId || !selectedInstId) return;
    setLoadingYoy(true);
    try {
      const res = await api.get('/capacity/year-comparison', {
        params: {
          institutionId: selectedInstId,
          fromYearId,
          toYearId,
        },
      });
      setYoyData(res.data);
    } catch (err) {
      alert(err.response?.data?.error || 'Year-over-year comparison failed');
    } finally {
      setLoadingYoy(false);
    }
  };

  useEffect(() => {
    if (tab === 'yoy' && fromYearId && toYearId && selectedInstId) {
      handleRunYoy();
    }
  }, [tab, fromYearId, toYearId, selectedInstId]);

  return (
    <div>
      {/* Header */}
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h4 className="fw-bold text-dark mb-1">Intake Capacity & Digital Twin Simulator</h4>
          <p className="text-muted small mb-0">
            Predict regulatory quota violations before admission confirmation • Model NRI/OCI caps • What-if scenario testing
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="card border-0 shadow-sm rounded-3 mb-4 bg-white p-2">
        <div className="nav nav-pills gap-2">
          <button
            className={`nav-link btn-sm ${tab === 'twin' ? 'active' : ''}`}
            onClick={() => setTab('twin')}
          >
            Digital Twin What-If Simulator
          </button>
          <button
            className={`nav-link btn-sm ${tab === 'yoy' ? 'active' : ''}`}
            onClick={() => setTab('yoy')}
          >
            Year-over-Year (YOY) Intelligence
          </button>
        </div>
      </div>

      {/* Tab 1: What-If Simulator */}
      {tab === 'twin' && (
        <div className="row g-4">
          {/* Left Form: Scenario Inputs */}
          <div className="col-lg-5">
            <div className="glass-card h-100 p-4">
              <div className="d-flex align-items-center gap-2 mb-3">
                <div className="bg-primary text-white p-2 rounded d-flex align-items-center justify-content-center" style={{ width: 32, height: 32 }}>
                  <Layers size={18} />
                </div>
                <h6 className="mb-0 fw-bold">Simulation Parameters</h6>
              </div>

              {/* Disclaimer */}
              <div className="p-3 bg-info bg-opacity-10 border border-info border-opacity-25 rounded small text-dark mb-4">
                <div className="fw-semibold text-primary mb-1 d-flex align-items-center gap-1">
                  <Sparkles size={14} />
                  <span>Digital Twin Guarantee</span>
                </div>
                Simulations are projected calculations. <strong>No actual student records or database rows are modified.</strong>
              </div>

              <form onSubmit={handleRunSimulation}>
                <div className="mb-3">
                  <label className="form-label small fw-semibold">Target Institution</label>
                  <select
                    className="form-select form-select-sm"
                    value={selectedInstId}
                    onChange={(e) => setSelectedInstId(e.target.value)}
                    required
                  >
                    {institutions.map((i) => (
                      <option key={i.id} value={i.id}>
                        {i.name} ({i.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mb-3">
                  <label className="form-label small fw-semibold">Target Programme</label>
                  <select
                    className="form-select form-select-sm"
                    value={selectedProgId}
                    onChange={(e) => setSelectedProgId(e.target.value)}
                    required
                  >
                    {programmes.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mb-4">
                  <label className="form-label small fw-semibold">Academic Session</label>
                  <select
                    className="form-select form-select-sm"
                    value={selectedYearId}
                    onChange={(e) => setSelectedYearId(e.target.value)}
                    required
                  >
                    {academicYears.map((ay) => (
                      <option key={ay.id} value={ay.id}>
                        {ay.label}
                      </option>
                    ))}
                  </select>
                </div>

                <h6 className="fw-bold small text-uppercase text-secondary mb-3">
                  Proposed Admissions by Category
                </h6>

                <div className="row g-2 mb-4">
                  <div className="col-6">
                    <label className="form-label small text-muted">General Seats</label>
                    <input
                      type="number"
                      className="form-control form-control-sm"
                      min="0"
                      value={proposedGeneral}
                      onChange={(e) => setProposedGeneral(e.target.value)}
                    />
                  </div>
                  <div className="col-6">
                    <label className="form-label small text-muted">NRI Seats (Max 5%)</label>
                    <input
                      type="number"
                      className="form-control form-control-sm"
                      min="0"
                      value={proposedNri}
                      onChange={(e) => setProposedNri(e.target.value)}
                    />
                  </div>
                  <div className="col-6">
                    <label className="form-label small text-muted">OCI / PIO Seats</label>
                    <input
                      type="number"
                      className="form-control form-control-sm"
                      min="0"
                      value={proposedOci}
                      onChange={(e) => setProposedOci(e.target.value)}
                    />
                  </div>
                  <div className="col-6">
                    <label className="form-label small text-muted">Supernumerary</label>
                    <input
                      type="number"
                      className="form-control form-control-sm"
                      min="0"
                      value={proposedSuper}
                      onChange={(e) => setProposedSuper(e.target.value)}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary-et w-100 d-flex align-items-center justify-content-center gap-2"
                  disabled={simulating}
                >
                  <Play size={15} />
                  <span>{simulating ? 'Simulating Digital Twin...' : 'Run Capacity Simulation'}</span>
                </button>
              </form>
            </div>
          </div>

          {/* Right: Simulation Twin Results */}
          <div className="col-lg-7">
            {simResult ? (
              <div className="glass-card h-100 p-4">
                <div className="d-flex align-items-center justify-content-between mb-3 border-bottom pb-2">
                  <h6 className="mb-0 fw-bold">Projected Outcome (Simulation)</h6>
                  <span className="badge bg-warning-subtle text-warning border border-warning-subtle">
                    {simResult.simulationType}
                  </span>
                </div>

                {/* Status Callout */}
                {simResult.isCompliant ? (
                  <div className="p-3 bg-success bg-opacity-10 border border-success border-opacity-25 rounded-3 mb-4 d-flex align-items-center gap-3">
                    <CheckCircle2 size={32} className="text-success" />
                    <div>
                      <h6 className="fw-bold text-success mb-1">Proposed Intake is AICTE Compliant</h6>
                      <p className="text-muted small mb-0">All additions fit safely within the approved quota and category sub-limits.</p>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-danger bg-opacity-10 border border-danger border-opacity-25 rounded-3 mb-4 d-flex align-items-center gap-3">
                    <AlertTriangle size={32} className="text-danger" />
                    <div>
                      <h6 className="fw-bold text-danger mb-1">Regulatory Violation Triggered!</h6>
                      <p className="text-muted small mb-0">Proceeding with these admissions will breach AICTE approved intake thresholds.</p>
                    </div>
                  </div>
                )}

                {/* Numbers Grid */}
                <div className="row g-3 mb-4">
                  <div className="col-4">
                    <div className="p-3 bg-light rounded text-center border">
                      <div className="text-muted small">Current Enrolled</div>
                      <div className="fs-4 fw-bold">{simResult.currentEnrolled}</div>
                    </div>
                  </div>
                  <div className="col-4">
                    <div className="p-3 bg-light rounded text-center border">
                      <div className="text-muted small">Simulated Total</div>
                      <div className="fs-4 fw-bold text-primary">{simResult.simulatedTotal}</div>
                    </div>
                  </div>
                  <div className="col-4">
                    <div className="p-3 bg-light rounded text-center border">
                      <div className="text-muted small">Approved Limit</div>
                      <div className="fs-4 fw-bold">{simResult.approvedIntake}</div>
                    </div>
                  </div>
                </div>

                {/* Triggered Rules List */}
                <h6 className="fw-bold mb-2">Rule Evaluation Feedback</h6>
                {simResult.violations?.length > 0 ? (
                  <div className="d-flex flex-column gap-2 mb-4">
                    {simResult.violations.map((v, i) => (
                      <div key={i} className="p-2 bg-danger bg-opacity-10 border border-danger border-opacity-25 rounded small text-danger">
                        <strong>{v.ruleCode}:</strong> {v.message}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-2 bg-success bg-opacity-10 border border-success border-opacity-25 rounded small text-success mb-4">
                    ✓ All checks passed (CAP-01 Approved Intake, CAP-02 NRI 5% cap, CAP-03 15% Supernumerary).
                  </div>
                )}

                <div className="p-3 bg-light rounded small text-muted border">
                  <strong>Regulatory Basis:</strong> Rule version <strong>{simResult.ruleVersion}</strong> under AICTE Process Handbook Chapter II & III.
                </div>
              </div>
            ) : (
              <div className="glass-card h-100 p-5 text-center d-flex flex-column align-items-center justify-content-center">
                <Gauge size={56} className="text-muted opacity-50 mb-3" />
                <h6 className="fw-bold">No Simulation Executed Yet</h6>
                <p className="text-muted small mb-0" style={{ maxWidth: 360 }}>
                  Select an institution, programme, and proposed seat additions on the left, then click <strong>"Run Capacity Simulation"</strong> to model outcomes.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Year-over-Year (YOY) Intelligence */}
      {tab === 'yoy' && (
        <div className="glass-card p-4">
          <div className="d-flex align-items-center justify-content-between mb-4">
            <div>
              <h5 className="fw-bold mb-1">Academic Year Comparison & Variance Intelligence</h5>
              <div className="text-muted small">Detect unexpected enrolment collapse, unapproved closures, or &gt;30% seat surges</div>
            </div>

            <div className="d-flex gap-2 align-items-center">
              <span className="small text-muted">Baseline:</span>
              <select
                className="form-select form-select-sm"
                style={{ width: 130 }}
                value={fromYearId}
                onChange={(e) => setFromYearId(e.target.value)}
              >
                {academicYears.map((ay) => (
                  <option key={ay.id} value={ay.id}>{ay.label}</option>
                ))}
              </select>

              <span className="small text-muted">Compare With:</span>
              <select
                className="form-select form-select-sm"
                style={{ width: 130 }}
                value={toYearId}
                onChange={(e) => setToYearId(e.target.value)}
              >
                {academicYears.map((ay) => (
                  <option key={ay.id} value={ay.id}>{ay.label}</option>
                ))}
              </select>

              <button className="btn btn-sm btn-primary-et" onClick={handleRunYoy} disabled={loadingYoy}>
                {loadingYoy ? 'Comparing...' : 'Evaluate Variance'}
              </button>
            </div>
          </div>

          {yoyData?.comparison?.length > 0 ? (
            <div className="table-responsive">
              <table className="et-table">
                <thead>
                  <tr>
                    <th>Programme</th>
                    <th>{yoyData.fromYear?.label} Count</th>
                    <th>{yoyData.toYear?.label} Count</th>
                    <th>Variance (Diff)</th>
                    <th>AICTE Compliance Flag</th>
                  </tr>
                </thead>
                <tbody>
                  {yoyData.comparison.map((item, idx) => (
                    <tr key={idx}>
                      <td className="fw-semibold">{item.programmeName}</td>
                      <td>{item.fromCount} enrolled</td>
                      <td className="fw-bold">{item.toCount} enrolled</td>
                      <td>
                        <span className={`fw-semibold ${item.diff > 0 ? 'text-success' : item.diff < 0 ? 'text-danger' : 'text-muted'}`}>
                          {item.diff > 0 ? `+${item.diff}` : item.diff}
                        </span>
                      </td>
                      <td>
                        {item.flag ? (
                          <span className="badge bg-warning-subtle text-warning border border-warning-subtle">
                            {item.flag.code}: {item.flag.reason}
                          </span>
                        ) : (
                          <span className="badge bg-success-subtle text-success border border-success-subtle">
                            Normal Progression
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-5 text-muted small">
              Click "Evaluate Variance" to compare academic sessions.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
