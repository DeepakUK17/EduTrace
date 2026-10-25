const jwt = require('jsonwebtoken');
const { createAuditEvent } = require('../utils/audit');

const JWT_SECRET = process.env.JWT_SECRET || 'dev_jwt_secret_change_in_production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

/**
 * Authenticate middleware - verifies JWT and attaches user to req.user
 */
async function authenticate(req, res, next) {
  try {
    // Support both Authorization header (Bearer token) and httpOnly cookie
    let token = null;

    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.slice(7);
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return res.status(401).json({
        error: 'Authentication required',
        code: 'NO_TOKEN',
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
      institutionId: decoded.institutionId,
      firstName: decoded.firstName,
      lastName: decoded.lastName,
    };

    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired', code: 'TOKEN_EXPIRED' });
    }
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token', code: 'INVALID_TOKEN' });
    }
    next(err);
  }
}

/**
 * Authorization middleware - checks allowed roles
 * Usage: router.get('/route', authenticate, authorize('PLATFORM_ADMIN', 'INSTITUTION_ADMIN'), handler)
 */
function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required', code: 'NO_USER' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      // Log unauthorized access attempt
      createAuditEvent({
        actorId: req.user.id,
        actorRole: req.user.role,
        action: 'USER_LOGIN_FAILED', // closest audit action for access denied
        entityType: 'Route',
        entityId: req.path,
        reason: `Role ${req.user.role} not in [${allowedRoles.join(', ')}]`,
      }).catch(() => {});

      return res.status(403).json({
        error: 'Access denied',
        code: 'FORBIDDEN',
        requiredRoles: allowedRoles,
        yourRole: req.user.role,
      });
    }

    next();
  };
}

/**
 * Institution scope middleware - ensures institution-scoped users
 * can only access their own institution's data.
 * Attach after authenticate.
 */
function scopeToInstitution(req, res, next) {
  const { role, institutionId } = req.user;

  // Platform admins can access any institution
  if (role === 'PLATFORM_ADMIN') return next();

  // Institution-scoped roles
  if (['INSTITUTION_ADMIN', 'DATA_OPERATOR'].includes(role)) {
    // Inject institution filter so controllers can use it
    req.institutionScope = institutionId;

    // If request targets a specific institution, verify it matches
    const targetInstitution =
      req.params.institutionId ||
      req.query.institutionId ||
      req.body?.institutionId;

    if (targetInstitution && targetInstitution !== institutionId) {
      return res.status(403).json({
        error: 'Access denied to this institution',
        code: 'INSTITUTION_SCOPE_VIOLATION',
      });
    }
  }

  next();
}

/**
 * Generate JWT token for a user
 */
function generateToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      institutionId: user.institutionId,
      firstName: user.firstName,
      lastName: user.lastName,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

module.exports = { authenticate, authorize, scopeToInstitution, generateToken };
