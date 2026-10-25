const prisma = require('../utils/prisma');
const { createAuditEvent, auditContextFromReq } = require('../utils/audit');

/**
 * POST /api/capacity/simulate — What-if capacity simulation
 * NOTE: This NEVER modifies actual records. Results are projections only.
 */
async function simulateCapacity(req, res, next) {
  try {
    const { institutionId, programmeId, academicYearId, name, description, proposedAdmissions } = req.body;

    // Scope check
    if (req.institutionScope && req.institutionScope !== institutionId) {
      return res.status(403).json({ error: 'Access denied to this institution', code: 'FORBIDDEN' });
    }

    // Get intake config
    const intakeConfig = await prisma.intakeConfiguration.findUnique({
      where: { institutionId_programmeId_academicYearId: { institutionId, programmeId, academicYearId } },
      include: {
        institution: { select: { name: true } },
        programme: { select: { name: true } },
        academicYear: { select: { label: true } },
      },
    });

    if (!intakeConfig) {
      return res.status(404).json({
        error: 'No intake configuration found for this institution/programme/year combination',
        code: 'NO_INTAKE_CONFIG',
      });
    }

    // Get current counts by category
    const currentEnrollments = await prisma.enrollment.groupBy({
      by: ['admissionCategory'],
      _count: { id: true },
      where: { institutionId, programmeId, academicYearId, status: 'ACTIVE', isArchived: false },
    });

    const currentByCategory = Object.fromEntries(
      currentEnrollments.map((e) => [e.admissionCategory, e._count.id])
    );
    const currentTotal = Object.values(currentByCategory).reduce((sum, c) => sum + c, 0);

    // Calculate proposed totals
    const proposedByCategory = { ...currentByCategory };
    for (const [cat, count] of Object.entries(proposedAdmissions)) {
      proposedByCategory[cat] = (proposedByCategory[cat] || 0) + (count || 0);
    }
    const proposedTotal = Object.values(proposedByCategory).reduce((sum, c) => sum + c, 0);
    const proposedAdditional = proposedTotal - currentTotal;

    // Evaluate rules
    const rulesTriggered = [];

    if (proposedTotal > intakeConfig.approvedIntake) {
      rulesTriggered.push({
        code: 'CAP-01',
        severity: 'HIGH',
        message: `Proposed total (${proposedTotal}) exceeds approved intake (${intakeConfig.approvedIntake})`,
        excess: proposedTotal - intakeConfig.approvedIntake,
      });
    }

    const proposedNri = proposedByCategory['NRI'] || 0;
    if (proposedNri > intakeConfig.nriLimit) {
      rulesTriggered.push({
        code: 'CAP-02',
        severity: 'MEDIUM',
        message: `Proposed NRI admissions (${proposedNri}) exceed NRI limit (${intakeConfig.nriLimit})`,
      });
    }

    const proposedSuper = proposedByCategory['SUPERNUMERARY'] || 0;
    if (proposedSuper > intakeConfig.supernumeraryAllowance) {
      rulesTriggered.push({
        code: 'CAP-03',
        severity: 'MEDIUM',
        message: `Proposed supernumerary (${proposedSuper}) exceeds allowance (${intakeConfig.supernumeraryAllowance})`,
      });
    }

    const simulatedResults = {
      currentTotal,
      proposedTotal,
      proposedAdditional,
      remainingAfterProposal: Math.max(0, intakeConfig.approvedIntake - proposedTotal),
      currentByCategory,
      proposedByCategory,
      rulesTriggered,
      simulationType: 'PROJECTION_NOT_OFFICIAL',
      simulationNote: 'This is a projection based on configured rules. It does not represent official regulatory approval or an actual enrollment record change.',
      ruleVersion: intakeConfig.ruleVersion,
      intakeConfig: {
        approvedIntake: intakeConfig.approvedIntake,
        supernumeraryAllowance: intakeConfig.supernumeraryAllowance,
        nriLimit: intakeConfig.nriLimit,
        ociLimit: intakeConfig.ociLimit,
      },
    };

    // Save scenario
    const scenario = await prisma.capacityScenario.create({
      data: {
        institutionId,
        programmeId,
        academicYearId,
        createdById: req.user.id,
        name,
        description,
        proposedAdmissions,
        simulatedResults,
        ruleVersion: intakeConfig.ruleVersion,
      },
    });

    res.status(201).json({
      scenario,
      simulatedResults,
      disclaimer: 'PROJECTION ONLY — Not official enrollment data. Rule version: ' + intakeConfig.ruleVersion,
    });
  } catch (err) { next(err); }
}

/**
 * GET /api/capacity/scenarios
 */
async function listScenarios(req, res, next) {
  try {
    const { page = 1, limit = 20, institutionId } = req.query;
    const skip = (page - 1) * limit;

    const where = { isArchived: false };
    if (req.institutionScope) where.institutionId = req.institutionScope;
    else if (institutionId) where.institutionId = institutionId;

    const [scenarios, total] = await Promise.all([
      prisma.capacityScenario.findMany({
        where, skip: Number(skip), take: Number(limit),
        include: {
          institution: { select: { id: true, name: true } },
          programme: { select: { id: true, name: true } },
          academicYear: { select: { id: true, label: true } },
          createdBy: { select: { id: true, firstName: true, lastName: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.capacityScenario.count({ where }),
    ]);

    res.json({ scenarios, total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / limit) });
  } catch (err) { next(err); }
}

/**
 * GET /api/capacity/scenarios/:id
 */
async function getScenario(req, res, next) {
  try {
    const scenario = await prisma.capacityScenario.findUnique({
      where: { id: req.params.id },
      include: {
        institution: true, programme: true, academicYear: true,
        createdBy: { select: { id: true, firstName: true, lastName: true } },
      },
    });
    if (!scenario) return res.status(404).json({ error: 'Scenario not found', code: 'NOT_FOUND' });
    if (req.institutionScope && scenario.institutionId !== req.institutionScope) {
      return res.status(403).json({ error: 'Access denied', code: 'FORBIDDEN' });
    }
    res.json({ scenario });
  } catch (err) { next(err); }
}

/**
 * GET /api/year-comparison — Academic Year Change Intelligence
 */
async function yearComparison(req, res, next) {
  try {
    const { institutionId, fromYearId, toYearId } = req.query;
    if (!institutionId || !fromYearId || !toYearId) {
      return res.status(400).json({ error: 'institutionId, fromYearId, and toYearId are required', code: 'MISSING_PARAMS' });
    }

    if (req.institutionScope && req.institutionScope !== institutionId) {
      return res.status(403).json({ error: 'Access denied', code: 'FORBIDDEN' });
    }

    const [fromEnrollments, toEnrollments, fromYear, toYear] = await Promise.all([
      prisma.enrollment.findMany({
        where: { institutionId, academicYearId: fromYearId, isArchived: false },
        include: { programme: { select: { id: true, name: true } }, student: { select: { apaarStatus: true } } },
      }),
      prisma.enrollment.findMany({
        where: { institutionId, academicYearId: toYearId, isArchived: false },
        include: { programme: { select: { id: true, name: true } }, student: { select: { apaarStatus: true } } },
      }),
      prisma.academicYear.findUnique({ where: { id: fromYearId } }),
      prisma.academicYear.findUnique({ where: { id: toYearId } }),
    ]);

    // Compare by programme
    const fromByProg = {};
    const toByProg = {};

    for (const e of fromEnrollments) {
      fromByProg[e.programmeId] = fromByProg[e.programmeId] || { name: e.programme.name, count: 0 };
      fromByProg[e.programmeId].count++;
    }
    for (const e of toEnrollments) {
      toByProg[e.programmeId] = toByProg[e.programmeId] || { name: e.programme.name, count: 0 };
      toByProg[e.programmeId].count++;
    }

    const allProgIds = new Set([...Object.keys(fromByProg), ...Object.keys(toByProg)]);
    const comparison = [];

    for (const progId of allProgIds) {
      const from = fromByProg[progId]?.count || 0;
      const to = toByProg[progId]?.count || 0;
      const diff = to - from;
      const name = fromByProg[progId]?.name || toByProg[progId]?.name;

      let flag = null;
      if (from > 0 && to === 0) flag = { code: 'YOY-01', reason: 'Programme had enrollments in prior year but none in current year' };
      if (from === 0 && to > 0) flag = { code: 'YOY-03', reason: 'New programme enrollments with no prior year baseline' };
      if (Math.abs(diff / Math.max(from, 1)) > 0.3) flag = { code: 'YOY-02', reason: `Enrollment changed by more than 30% (${diff > 0 ? '+' : ''}${diff})` };

      comparison.push({ programmeId: progId, programmeName: name, fromCount: from, toCount: to, diff, flag });
    }

    res.json({
      fromYear, toYear,
      institutionId,
      comparison,
      summary: {
        totalFrom: fromEnrollments.length,
        totalTo: toEnrollments.length,
        totalDiff: toEnrollments.length - fromEnrollments.length,
        flaggedProgrammes: comparison.filter((c) => c.flag).length,
      },
    });
  } catch (err) { next(err); }
}

module.exports = { simulateCapacity, listScenarios, getScenario, yearComparison };
