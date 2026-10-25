const bcrypt = require('bcryptjs');
const prisma = require('../utils/prisma');
const { createAuditEvent, auditContextFromReq } = require('../utils/audit');
const { AppError } = require('../middleware/errorHandler');

/**
 * GET /api/users
 */
async function listUsers(req, res, next) {
  try {
    const { page = 1, limit = 20, role, institutionId, status } = req.query;
    const skip = (page - 1) * limit;

    const where = {};

    // Institution-scoped users can only see their own institution's users
    if (req.user.role !== 'PLATFORM_ADMIN') {
      where.institutionId = req.user.institutionId;
    } else if (institutionId) {
      where.institutionId = institutionId;
    }

    if (role) where.role = role;
    if (status) where.status = status;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip: Number(skip),
        take: Number(limit),
        select: {
          id: true, email: true, firstName: true, lastName: true,
          role: true, status: true, institutionId: true, createdAt: true,
          institution: { select: { id: true, name: true, code: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where }),
    ]);

    res.json({ users, total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / limit) });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/users
 */
async function createUser(req, res, next) {
  try {
    const { email, password, firstName, lastName, role, institutionId } = req.body;

    // Prevent self-elevation: institution admins cannot create platform admins
    if (req.user.role === 'INSTITUTION_ADMIN' && role === 'PLATFORM_ADMIN') {
      return res.status(403).json({ error: 'Cannot create Platform Admin accounts', code: 'FORBIDDEN' });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: { email, passwordHash, firstName, lastName, role, institutionId: institutionId || null },
      select: {
        id: true, email: true, firstName: true, lastName: true,
        role: true, status: true, institutionId: true, createdAt: true,
      },
    });

    await createAuditEvent({
      ...auditContextFromReq(req),
      action: 'USER_CREATED',
      entityType: 'User',
      entityId: user.id,
      diff: { after: { email: user.email, role: user.role, institutionId: user.institutionId } },
    });

    res.status(201).json({ user });
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/users/:id
 */
async function updateUser(req, res, next) {
  try {
    const { id } = req.params;
    const { status, role, firstName, lastName } = req.body;

    // Cannot edit your own role
    if (id === req.user.id && role && role !== req.user.role) {
      return res.status(403).json({ error: 'Cannot change your own role', code: 'FORBIDDEN' });
    }

    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'User not found', code: 'NOT_FOUND' });

    // Institution admin can only manage their own institution's users
    if (req.user.role === 'INSTITUTION_ADMIN' && existing.institutionId !== req.user.institutionId) {
      return res.status(403).json({ error: 'Access denied', code: 'FORBIDDEN' });
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { ...(status && { status }), ...(role && { role }), ...(firstName && { firstName }), ...(lastName && { lastName }) },
      select: { id: true, email: true, firstName: true, lastName: true, role: true, status: true },
    });

    await createAuditEvent({
      ...auditContextFromReq(req),
      action: 'USER_UPDATED',
      entityType: 'User',
      entityId: id,
      diff: { before: { status: existing.status, role: existing.role }, after: { status: updated.status, role: updated.role } },
    });

    res.json({ user: updated });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/users/:id
 */
async function getUser(req, res, next) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: {
        id: true, email: true, firstName: true, lastName: true,
        role: true, status: true, institutionId: true, createdAt: true, updatedAt: true,
        institution: { select: { id: true, name: true, code: true } },
      },
    });
    if (!user) return res.status(404).json({ error: 'User not found', code: 'NOT_FOUND' });
    res.json({ user });
  } catch (err) {
    next(err);
  }
}

module.exports = { listUsers, createUser, updateUser, getUser };
