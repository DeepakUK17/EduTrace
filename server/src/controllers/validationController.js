const prisma = require('../utils/prisma');
const validationService = require('../services/validationService');
const { createAuditEvent, auditContextFromReq } = require('../utils/audit');

/**
 * POST /api/validation/run
 * Run validation on a specific enrollment or all active enrollments for an institution
 */
async function triggerValidation(req, res, next) {
  try {
    const { enrollmentId, institutionId } = req.body;

    if (enrollmentId) {
      await validationService.runValidation(enrollmentId, req.user.id);
      const updatedIssues = await prisma.validationIssue.findMany({
        where: { enrollmentId },
        include: { rule: true },
      });
      return res.json({ message: 'Validation completed for enrollment', issues: updatedIssues });
    }

    const targetInstitutionId = req.institutionScope || institutionId;
    const where = { isArchived: false };
    if (targetInstitutionId) where.institutionId = targetInstitutionId;

    const enrollments = await prisma.enrollment.findMany({
      where,
      select: { id: true },
      take: 200,
    });

    for (const e of enrollments) {
      await validationService.runValidation(e.id, req.user.id);
    }

    await createAuditEvent({
      ...auditContextFromReq(req),
      action: 'VALIDATION_BATCH_RUN',
      entityType: 'Institution',
      entityId: targetInstitutionId || 'ALL',
      reason: `Validation executed on ${enrollments.length} enrollments`,
    });

    res.json({ message: `Validation executed on ${enrollments.length} enrollments` });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/validation/issues
 * List validation findings across the system or scoped to institution
 */
async function listIssues(req, res, next) {
  try {
    const { page = 1, limit = 20, severity, status, ruleCode, search } = req.query;
    const skip = (page - 1) * limit;

    const where = {};
    if (severity) where.severity = severity;
    if (status) where.status = status;
    if (ruleCode) where.ruleCode = ruleCode;

    if (req.institutionScope) {
      where.enrollment = { institutionId: req.institutionScope };
    }

    if (search) {
      where.OR = [
        { explanation: { contains: search, mode: 'insensitive' } },
        { ruleCode: { contains: search, mode: 'insensitive' } },
        { enrollment: { firstName: { contains: search, mode: 'insensitive' } } },
        { enrollment: { lastName: { contains: search, mode: 'insensitive' } } },
        { enrollment: { institutionStudentId: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [issues, total] = await Promise.all([
      prisma.validationIssue.findMany({
        where,
        skip: Number(skip),
        take: Number(limit),
        include: {
          rule: true,
          enrollment: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              institutionStudentId: true,
              admissionCategory: true,
              institution: { select: { id: true, name: true, code: true } },
              programme: { select: { id: true, name: true, code: true } },
              academicYear: { select: { id: true, label: true } },
              student: { select: { id: true, apaarStatus: true, apaarMasked: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.validationIssue.count({ where }),
    ]);

    res.json({
      issues,
      total,
      page: Number(page),
      limit: Number(limit),
      pages: Math.ceil(total / limit),
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/validation/issues/:id
 */
async function getIssue(req, res, next) {
  try {
    const issue = await prisma.validationIssue.findUnique({
      where: { id: req.params.id },
      include: {
        rule: true,
        enrollment: {
          include: {
            student: true,
            institution: true,
            programme: true,
            academicYear: true,
          },
        },
      },
    });

    if (!issue) return res.status(404).json({ error: 'Issue not found', code: 'NOT_FOUND' });
    if (req.institutionScope && issue.enrollment.institutionId !== req.institutionScope) {
      return res.status(403).json({ error: 'Access denied', code: 'FORBIDDEN' });
    }

    res.json({ issue });
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/validation/issues/:id
 * Guided resolution: resolve, mark false positive, or apply inline correction
 */
async function updateIssue(req, res, next) {
  try {
    const { status, resolutionNote, correctedValue } = req.body;

    const existing = await prisma.validationIssue.findUnique({
      where: { id: req.params.id },
      include: { enrollment: true },
    });

    if (!existing) return res.status(404).json({ error: 'Issue not found', code: 'NOT_FOUND' });
    if (req.institutionScope && existing.enrollment.institutionId !== req.institutionScope) {
      return res.status(403).json({ error: 'Access denied', code: 'FORBIDDEN' });
    }

    const updated = await prisma.validationIssue.update({
      where: { id: req.params.id },
      data: {
        ...(status && { status }),
        resolvedAt: status === 'RESOLVED' || status === 'FALSE_POSITIVE' ? new Date() : undefined,
        resolvedById: req.user.id,
      },
    });

    await createAuditEvent({
      ...auditContextFromReq(req),
      action: 'VALIDATION_ISSUE_RESOLVED',
      entityType: 'ValidationIssue',
      entityId: existing.id,
      diff: {
        before: { status: existing.status },
        after: { status: updated.status, resolutionNote },
      },
      reason: resolutionNote || 'Issue status updated',
    });

    // If an inline correction was made on the enrollment, re-trigger validation
    if (correctedValue && existing.enrollmentId) {
      await validationService.runValidation(existing.enrollmentId, req.user.id);
    }

    res.json({ issue: updated });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/validation/rules
 * List all configured validation rules
 */
async function listRules(req, res, next) {
  try {
    const rules = await prisma.validationRule.findMany({
      orderBy: { code: 'asc' },
    });
    res.json({ rules });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  triggerValidation,
  listIssues,
  getIssue,
  updateIssue,
  listRules,
};
