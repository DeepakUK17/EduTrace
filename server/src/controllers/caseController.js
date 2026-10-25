const prisma = require('../utils/prisma');
const { createAuditEvent, auditContextFromReq } = require('../utils/audit');

/**
 * GET /api/cases
 */
async function listCases(req, res, next) {
  try {
    const { page = 1, limit = 20, status, severity, type, assignedToId } = req.query;
    const skip = (page - 1) * limit;

    const where = {};
    if (req.institutionScope) {
      where.enrollment = { institutionId: req.institutionScope };
    }
    if (status) where.status = status;
    if (severity) where.severity = severity;
    if (type) where.type = type;
    if (assignedToId) where.assignedToId = assignedToId;

    const [cases, total] = await Promise.all([
      prisma.exceptionCase.findMany({
        where, skip: Number(skip), take: Number(limit),
        include: {
          enrollment: {
            select: {
              id: true, firstName: true, lastName: true, institutionStudentId: true,
              institution: { select: { id: true, name: true } },
              programme: { select: { id: true, name: true } },
              academicYear: { select: { id: true, label: true } },
              student: { select: { apaarStatus: true, apaarMasked: true } },
            },
          },
          assignedTo: { select: { id: true, firstName: true, lastName: true, email: true } },
          createdBy: { select: { id: true, firstName: true, lastName: true } },
          _count: { select: { comments: true } },
        },
        orderBy: [{ severity: 'desc' }, { createdAt: 'desc' }],
      }),
      prisma.exceptionCase.count({ where }),
    ]);

    res.json({ cases, total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / limit) });
  } catch (err) { next(err); }
}

/**
 * GET /api/cases/:id
 */
async function getCase(req, res, next) {
  try {
    const exceptionCase = await prisma.exceptionCase.findUnique({
      where: { id: req.params.id },
      include: {
        enrollment: {
          include: {
            student: { select: { id: true, apaarStatus: true, apaarMasked: true } },
            institution: true, programme: true, academicYear: true,
          },
        },
        assignedTo: { select: { id: true, firstName: true, lastName: true, email: true } },
        createdBy: { select: { id: true, firstName: true, lastName: true } },
        comments: {
          include: { author: { select: { id: true, firstName: true, lastName: true, role: true } } },
          orderBy: { createdAt: 'asc' },
        },
        statusHistory: { orderBy: { createdAt: 'asc' } },
      },
    });

    if (!exceptionCase) return res.status(404).json({ error: 'Case not found', code: 'NOT_FOUND' });

    // Institution scope check
    if (req.institutionScope && exceptionCase.enrollment?.institutionId !== req.institutionScope) {
      return res.status(403).json({ error: 'Access denied', code: 'FORBIDDEN' });
    }

    res.json({ case: exceptionCase });
  } catch (err) { next(err); }
}

/**
 * PATCH /api/cases/:id/status
 */
async function updateCaseStatus(req, res, next) {
  try {
    const { status, reason } = req.body;
    const existing = await prisma.exceptionCase.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ error: 'Case not found', code: 'NOT_FOUND' });

    const updated = await prisma.$transaction(async (tx) => {
      const c = await tx.exceptionCase.update({
        where: { id: req.params.id },
        data: {
          status,
          ...(status === 'ASSIGNED' && { assignedToId: req.user.id }),
          ...(['RESOLVED', 'REJECTED', 'FALSE_POSITIVE', 'CLOSED_WITH_EXPLANATION'].includes(status) && {
            resolutionNote: reason,
            resolvedAt: new Date(),
          }),
          ...(status === 'ESCALATED' && { isEscalated: true }),
        },
      });

      await tx.caseStatusHistory.create({
        data: {
          caseId: req.params.id,
          fromStatus: existing.status,
          toStatus: status,
          actorId: req.user.id,
          reason,
        },
      });

      return c;
    });

    await createAuditEvent({
      ...auditContextFromReq(req),
      action: status.includes('RESOLV') ? 'CASE_RESOLVED' : 'CASE_STATUS_CHANGED',
      entityType: 'ExceptionCase',
      entityId: req.params.id,
      diff: { before: { status: existing.status }, after: { status }, reason },
    });

    res.json({ case: updated });
  } catch (err) { next(err); }
}

/**
 * POST /api/cases/:id/assign
 */
async function assignCase(req, res, next) {
  try {
    const { assignedToId } = req.body;
    const updated = await prisma.exceptionCase.update({
      where: { id: req.params.id },
      data: { assignedToId, status: 'ASSIGNED' },
      include: { assignedTo: { select: { id: true, firstName: true, lastName: true } } },
    });

    await createAuditEvent({
      ...auditContextFromReq(req),
      action: 'CASE_ASSIGNED',
      entityType: 'ExceptionCase',
      entityId: req.params.id,
      diff: { after: { assignedToId } },
    });

    res.json({ case: updated });
  } catch (err) { next(err); }
}

/**
 * POST /api/cases/:id/comments
 */
async function addComment(req, res, next) {
  try {
    const { content, attachmentRef } = req.body;
    const comment = await prisma.exceptionComment.create({
      data: { caseId: req.params.id, authorId: req.user.id, content, attachmentRef },
      include: { author: { select: { id: true, firstName: true, lastName: true, role: true } } },
    });

    await createAuditEvent({
      ...auditContextFromReq(req),
      action: 'CASE_COMMENTED',
      entityType: 'ExceptionCase',
      entityId: req.params.id,
    });

    res.status(201).json({ comment });
  } catch (err) { next(err); }
}

/**
 * POST /api/cases — manually create a case
 */
async function createCase(req, res, next) {
  try {
    const { type, severity, enrollmentId, title, description, evidence } = req.body;

    const exceptionCase = await prisma.exceptionCase.create({
      data: { type, severity, enrollmentId, title, description, evidence, createdById: req.user.id },
    });

    await createAuditEvent({
      ...auditContextFromReq(req),
      action: 'CASE_CREATED',
      entityType: 'ExceptionCase',
      entityId: exceptionCase.id,
      diff: { after: { type, severity, enrollmentId } },
    });

    res.status(201).json({ case: exceptionCase });
  } catch (err) { next(err); }
}

module.exports = { listCases, getCase, updateCaseStatus, assignCase, addComment, createCase };
