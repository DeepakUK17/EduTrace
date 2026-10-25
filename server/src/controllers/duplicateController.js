const prisma = require('../utils/prisma');

/**
 * GET /api/duplicates
 */
async function listDuplicates(req, res, next) {
  try {
    const { page = 1, limit = 20, disposition, matchType, crossInstitution } = req.query;
    const skip = (page - 1) * limit;

    const where = {};
    if (disposition) where.disposition = disposition;
    if (matchType) where.matchType = matchType;
    if (crossInstitution !== undefined) where.isCrossInstitution = crossInstitution === 'true';

    // Non-admin users can only see cross-institution duplicates for their institution
    if (req.user.role !== 'PLATFORM_ADMIN') {
      where.OR = [
        { recordA: { enrollments: { some: { institutionId: req.user.institutionId } } } },
        { recordB: { enrollments: { some: { institutionId: req.user.institutionId } } } },
      ];
      // Institution users cannot see cross-institution details
      if (req.user.role !== 'VERIFIER') {
        where.isCrossInstitution = false;
      }
    }

    const [duplicates, total] = await Promise.all([
      prisma.duplicateMatch.findMany({
        where, skip: Number(skip), take: Number(limit),
        include: {
          recordA: {
            include: {
              enrollments: {
                where: { status: 'ACTIVE', isArchived: false },
                include: {
                  institution: { select: { id: true, name: true } },
                  programme: { select: { id: true, name: true } },
                  academicYear: { select: { id: true, label: true } },
                },
                take: 1,
              },
            },
          },
          recordB: {
            include: {
              enrollments: {
                where: { status: 'ACTIVE', isArchived: false },
                include: {
                  institution: { select: { id: true, name: true } },
                  programme: { select: { id: true, name: true } },
                  academicYear: { select: { id: true, label: true } },
                },
                take: 1,
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.duplicateMatch.count({ where }),
    ]);

    // Mask HMAC tokens before sending
    const masked = duplicates.map((d) => ({
      ...d,
      recordA: { ...d.recordA, apaarHmacToken: undefined, apaarEncrypted: undefined },
      recordB: { ...d.recordB, apaarHmacToken: undefined, apaarEncrypted: undefined },
    }));

    res.json({ duplicates: masked, total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / limit) });
  } catch (err) { next(err); }
}

/**
 * POST /api/duplicates/:id/disposition
 */
async function recordDisposition(req, res, next) {
  try {
    const { disposition, dispositionNote } = req.body;

    const validDispositions = [
      'CONFIRMED_DUPLICATE', 'LEGITIMATE_TRANSFER', 'NOT_A_MATCH',
      'NEEDS_ESCALATION', 'FALSE_POSITIVE'
    ];

    if (!validDispositions.includes(disposition)) {
      return res.status(400).json({ error: `Invalid disposition. Must be one of: ${validDispositions.join(', ')}`, code: 'INVALID_DISPOSITION' });
    }

    const updated = await prisma.duplicateMatch.update({
      where: { id: req.params.id },
      data: { disposition, dispositionNote, reviewedById: req.user.id, reviewedAt: new Date() },
    });

    const { createAuditEvent } = require('../utils/audit');
    await createAuditEvent({
      actorId: req.user.id,
      actorRole: req.user.role,
      action: 'DUPLICATE_DISPOSITION_RECORDED',
      entityType: 'DuplicateMatch',
      entityId: req.params.id,
      diff: { after: { disposition, dispositionNote } },
    });

    res.json({ duplicate: updated });
  } catch (err) { next(err); }
}

module.exports = { listDuplicates, recordDisposition };
