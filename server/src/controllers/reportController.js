const prisma = require('../utils/prisma');
const { createAuditEvent, auditContextFromReq } = require('../utils/audit');

/**
 * GET /api/reports/institution-summary — Institution student summary
 */
async function institutionSummary(req, res, next) {
  try {
    const { institutionId, academicYearId } = req.query;
    if (req.institutionScope && req.institutionScope !== institutionId) {
      return res.status(403).json({ error: 'Access denied', code: 'FORBIDDEN' });
    }

    const where = { isArchived: false };
    if (institutionId) where.institutionId = institutionId;
    if (academicYearId) where.academicYearId = academicYearId;
    if (req.institutionScope) where.institutionId = req.institutionScope;

    const [enrollments, byStatus, byCategory, byApaarStatus] = await Promise.all([
      prisma.enrollment.count({ where }),
      prisma.enrollment.groupBy({ by: ['status'], _count: { id: true }, where }),
      prisma.enrollment.groupBy({ by: ['admissionCategory'], _count: { id: true }, where }),
      prisma.enrollment.groupBy({ by: ['status'], _count: { id: true }, where: { ...where, student: { apaarStatus: 'MISSING' } } }),
    ]);

    await createAuditEvent({ ...auditContextFromReq(req), action: 'REPORT_EXPORTED', entityType: 'Report', reason: 'institution-summary' });
    res.json({ totalEnrollments: enrollments, byStatus, byCategory, byApaarStatus });
  } catch (err) { next(err); }
}

/**
 * GET /api/reports/intake-comparison — Programme vs approved intake
 */
async function intakeComparison(req, res, next) {
  try {
    const { institutionId, academicYearId } = req.query;
    const where = {};
    if (req.institutionScope) where.institutionId = req.institutionScope;
    else if (institutionId) where.institutionId = institutionId;
    if (academicYearId) where.academicYearId = academicYearId;

    const configs = await prisma.intakeConfiguration.findMany({
      where,
      include: {
        institution: { select: { name: true } },
        programme: { select: { name: true, code: true } },
        academicYear: { select: { label: true } },
      },
    });

    const result = await Promise.all(configs.map(async (c) => {
      const actual = await prisma.enrollment.count({
        where: { institutionId: c.institutionId, programmeId: c.programmeId, academicYearId: c.academicYearId, status: 'ACTIVE', isArchived: false },
      });
      return {
        institution: c.institution.name,
        programme: c.programme.name,
        programmeCode: c.programme.code,
        academicYear: c.academicYear.label,
        approvedIntake: c.approvedIntake,
        actualEnrollment: actual,
        remaining: Math.max(0, c.approvedIntake - actual),
        utilizationPct: c.approvedIntake > 0 ? Math.round((actual / c.approvedIntake) * 100) : 0,
        isOverCapacity: actual > c.approvedIntake,
        ruleVersion: c.ruleVersion,
      };
    }));

    await createAuditEvent({ ...auditContextFromReq(req), action: 'REPORT_EXPORTED', entityType: 'Report', reason: 'intake-comparison' });
    res.json({ report: result });
  } catch (err) { next(err); }
}

/**
 * GET /api/reports/data-quality — Missing/invalid field report
 */
async function dataQuality(req, res, next) {
  try {
    const where = {};
    if (req.institutionScope) where.enrollment = { institutionId: req.institutionScope };

    const [missing, invalid, total] = await Promise.all([
      prisma.validationIssue.count({ where: { ...where, rule: { code: 'FMT-01' } } }),
      prisma.validationIssue.count({ where: { ...where, rule: { code: 'FMT-02' } } }),
      prisma.enrollment.count({ where: { isArchived: false, ...(req.institutionScope && { institutionId: req.institutionScope }) } }),
    ]);

    const issuesByRule = await prisma.validationIssue.groupBy({
      by: ['ruleId'],
      _count: { id: true },
      where,
    });

    await createAuditEvent({ ...auditContextFromReq(req), action: 'REPORT_EXPORTED', entityType: 'Report', reason: 'data-quality' });
    res.json({
      totalRecords: total,
      missingApaar: missing,
      invalidApaar: invalid,
      completePct: total > 0 ? Math.round(((total - missing - invalid) / total) * 100) : 100,
      issuesByRule: issuesByRule.map((i) => ({ ruleId: i.ruleId, count: i._count.id })),
    });
  } catch (err) { next(err); }
}

/**
 * GET /api/reports/exceptions — Exception resolution report
 */
async function exceptionsReport(req, res, next) {
  try {
    const { status, severity } = req.query;
    const where = {};
    if (req.institutionScope) where.enrollment = { institutionId: req.institutionScope };
    if (status) where.status = status;
    if (severity) where.severity = severity;

    const [byStatus, bySeverity, unresolved, avgDays] = await Promise.all([
      prisma.exceptionCase.groupBy({ by: ['status'], _count: { id: true }, where }),
      prisma.exceptionCase.groupBy({ by: ['severity'], _count: { id: true }, where }),
      prisma.exceptionCase.count({ where: { ...where, status: { notIn: ['RESOLVED', 'REJECTED', 'FALSE_POSITIVE', 'CLOSED_WITH_EXPLANATION'] } } }),
      prisma.exceptionCase.findMany({ where: { ...where, resolvedAt: { not: null } }, select: { createdAt: true, resolvedAt: true } }),
    ]);

    const avgResolutionDays = avgDays.length > 0
      ? Math.round(avgDays.reduce((sum, c) => sum + (c.resolvedAt - c.createdAt) / (1000 * 60 * 60 * 24), 0) / avgDays.length)
      : null;

    await createAuditEvent({ ...auditContextFromReq(req), action: 'REPORT_EXPORTED', entityType: 'Report', reason: 'exceptions' });
    res.json({ byStatus, bySeverity, unresolved, avgResolutionDays });
  } catch (err) { next(err); }
}

/**
 * GET /api/audit-events — Audit trail report (admin only)
 */
async function getAuditEvents(req, res, next) {
  try {
    const { page = 1, limit = 50, action, entityType, actorId, from, to } = req.query;
    const skip = (page - 1) * limit;

    const where = {};
    if (action) where.action = action;
    if (entityType) where.entityType = entityType;
    if (actorId) where.actorId = actorId;
    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt.gte = new Date(from);
      if (to) where.createdAt.lte = new Date(to);
    }

    const [events, total] = await Promise.all([
      prisma.auditEvent.findMany({
        where, skip: Number(skip), take: Number(limit),
        include: { actor: { select: { id: true, firstName: true, lastName: true, role: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.auditEvent.count({ where }),
    ]);

    res.json({ events, total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / limit) });
  } catch (err) { next(err); }
}

module.exports = { institutionSummary, intakeComparison, dataQuality, exceptionsReport, getAuditEvents };
