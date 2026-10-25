const prisma = require('../utils/prisma');
const { createAuditEvent, auditContextFromReq } = require('../utils/audit');

// ─── INSTITUTIONS ────────────────────────────────────────────

async function listInstitutions(req, res, next) {
  try {
    const { page = 1, limit = 20, status, search } = req.query;
    const skip = (page - 1) * limit;

    const where = {};
    if (req.institutionScope) where.id = req.institutionScope;
    if (status) where.status = status;
    if (search) where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { code: { contains: search, mode: 'insensitive' } },
    ];

    const [institutions, total] = await Promise.all([
      prisma.institution.findMany({
        where, skip: Number(skip), take: Number(limit),
        include: { _count: { select: { programmes: true, enrollments: true } } },
        orderBy: { name: 'asc' },
      }),
      prisma.institution.count({ where }),
    ]);

    res.json({ institutions, total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / limit) });
  } catch (err) { next(err); }
}

async function getInstitution(req, res, next) {
  try {
    const inst = await prisma.institution.findUnique({
      where: { id: req.params.id },
      include: {
        programmes: { where: { status: 'ACTIVE' } },
        _count: { select: { enrollments: true, users: true } },
      },
    });
    if (!inst) return res.status(404).json({ error: 'Institution not found', code: 'NOT_FOUND' });

    // Institution scope check
    if (req.institutionScope && inst.id !== req.institutionScope) {
      return res.status(403).json({ error: 'Access denied', code: 'FORBIDDEN' });
    }
    res.json({ institution: inst });
  } catch (err) { next(err); }
}

async function createInstitution(req, res, next) {
  try {
    const institution = await prisma.institution.create({ data: req.body });
    await createAuditEvent({ ...auditContextFromReq(req), action: 'STUDENT_CREATED', entityType: 'Institution', entityId: institution.id });
    res.status(201).json({ institution });
  } catch (err) { next(err); }
}

async function updateInstitution(req, res, next) {
  try {
    const inst = await prisma.institution.update({ where: { id: req.params.id }, data: req.body });
    res.json({ institution: inst });
  } catch (err) { next(err); }
}

// ─── PROGRAMMES ──────────────────────────────────────────────

async function listProgrammes(req, res, next) {
  try {
    const { institutionId, status } = req.query;
    const where = {};
    if (req.institutionScope) where.institutionId = req.institutionScope;
    else if (institutionId) where.institutionId = institutionId;
    if (status) where.status = status;

    const programmes = await prisma.programme.findMany({
      where,
      include: { institution: { select: { id: true, name: true, code: true } } },
      orderBy: [{ institution: { name: 'asc' } }, { name: 'asc' }],
    });
    res.json({ programmes });
  } catch (err) { next(err); }
}

async function createProgramme(req, res, next) {
  try {
    const prog = await prisma.programme.create({
      data: req.body,
      include: { institution: { select: { id: true, name: true } } },
    });
    res.status(201).json({ programme: prog });
  } catch (err) { next(err); }
}

async function updateProgramme(req, res, next) {
  try {
    const prog = await prisma.programme.update({ where: { id: req.params.id }, data: req.body });
    res.json({ programme: prog });
  } catch (err) { next(err); }
}

// ─── ACADEMIC YEARS ──────────────────────────────────────────

async function listAcademicYears(req, res, next) {
  try {
    const years = await prisma.academicYear.findMany({ orderBy: { startDate: 'desc' } });
    res.json({ academicYears: years });
  } catch (err) { next(err); }
}

async function createAcademicYear(req, res, next) {
  try {
    const year = await prisma.academicYear.create({ data: req.body });
    res.status(201).json({ academicYear: year });
  } catch (err) { next(err); }
}

// ─── INTAKE CONFIGURATIONS ───────────────────────────────────

async function listIntakeConfigs(req, res, next) {
  try {
    const { institutionId, programmeId, academicYearId } = req.query;
    const where = {};
    if (req.institutionScope) where.institutionId = req.institutionScope;
    else if (institutionId) where.institutionId = institutionId;
    if (programmeId) where.programmeId = programmeId;
    if (academicYearId) where.academicYearId = academicYearId;

    const configs = await prisma.intakeConfiguration.findMany({
      where,
      include: {
        institution: { select: { id: true, name: true } },
        programme: { select: { id: true, name: true, code: true } },
        academicYear: { select: { id: true, label: true } },
      },
      orderBy: [{ academicYear: { startDate: 'desc' } }, { programme: { name: 'asc' } }],
    });

    // Enrich with current enrollment counts
    const enriched = await Promise.all(configs.map(async (config) => {
      const count = await prisma.enrollment.count({
        where: {
          institutionId: config.institutionId,
          programmeId: config.programmeId,
          academicYearId: config.academicYearId,
          status: 'ACTIVE',
          isArchived: false,
        },
      });
      return {
        ...config,
        currentEnrollment: count,
        remainingCapacity: Math.max(0, config.approvedIntake - count),
        utilizationPct: config.approvedIntake > 0 ? Math.round((count / config.approvedIntake) * 100) : 0,
        isOverCapacity: count > config.approvedIntake,
      };
    }));

    res.json({ intakeConfigurations: enriched });
  } catch (err) { next(err); }
}

async function createIntakeConfig(req, res, next) {
  try {
    const config = await prisma.intakeConfiguration.create({
      data: req.body,
      include: {
        institution: { select: { id: true, name: true } },
        programme: { select: { id: true, name: true } },
        academicYear: { select: { id: true, label: true } },
      },
    });
    await createAuditEvent({
      ...auditContextFromReq(req),
      action: 'INTAKE_RULE_PUBLISHED',
      entityType: 'IntakeConfiguration',
      entityId: config.id,
      diff: { after: { approvedIntake: config.approvedIntake, ruleVersion: config.ruleVersion } },
    });
    res.status(201).json({ intakeConfiguration: config });
  } catch (err) { next(err); }
}

async function publishIntakeConfig(req, res, next) {
  try {
    const config = await prisma.intakeConfiguration.update({
      where: { id: req.params.id },
      data: { publishedAt: new Date(), publishedBy: req.user.id },
    });
    await createAuditEvent({
      ...auditContextFromReq(req),
      action: 'INTAKE_RULE_PUBLISHED',
      entityType: 'IntakeConfiguration',
      entityId: config.id,
    });
    res.json({ intakeConfiguration: config });
  } catch (err) { next(err); }
}

module.exports = {
  listInstitutions, getInstitution, createInstitution, updateInstitution,
  listProgrammes, createProgramme, updateProgramme,
  listAcademicYears, createAcademicYear,
  listIntakeConfigs, createIntakeConfig, publishIntakeConfig,
};
