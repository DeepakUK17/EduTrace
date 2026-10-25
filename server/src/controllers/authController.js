const bcrypt = require('bcryptjs');
const prisma = require('../utils/prisma');
const { generateToken } = require('../middleware/auth');
const { createAuditEvent, auditContextFromReq } = require('../utils/audit');
const { AppError } = require('../middleware/errorHandler');

/**
 * POST /api/auth/login
 */
async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { email },
      include: { institution: { select: { id: true, name: true, code: true } } },
    });

    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      await createAuditEvent({
        ...auditContextFromReq(req),
        action: 'USER_LOGIN_FAILED',
        entityType: 'User',
        entityId: user?.id || null,
        reason: 'Invalid credentials',
      });
      return res.status(401).json({ error: 'Invalid email or password', code: 'INVALID_CREDENTIALS' });
    }

    if (user.status !== 'ACTIVE') {
      return res.status(403).json({ error: 'Account is not active', code: 'ACCOUNT_INACTIVE' });
    }

    const token = generateToken(user);

    await createAuditEvent({
      actorId: user.id,
      actorRole: user.role,
      action: 'USER_LOGIN',
      entityType: 'User',
      entityId: user.id,
      ...auditContextFromReq(req),
    });

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        institution: user.institution,
        institutionId: user.institutionId,
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/auth/logout
 */
async function logout(req, res, next) {
  try {
    await createAuditEvent({
      actorId: req.user?.id,
      actorRole: req.user?.role,
      action: 'USER_LOGOUT',
      entityType: 'User',
      entityId: req.user?.id,
      ...auditContextFromReq(req),
    });
    res.json({ message: 'Logged out successfully' });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/auth/me
 */
async function getMe(req, res, next) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true, email: true, firstName: true, lastName: true,
        role: true, institutionId: true, status: true, createdAt: true,
        institution: { select: { id: true, name: true, code: true, status: true } },
      },
    });

    if (!user) return res.status(404).json({ error: 'User not found', code: 'NOT_FOUND' });
    res.json({ user });
  } catch (err) {
    next(err);
  }
}

module.exports = { login, logout, getMe };
