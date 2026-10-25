const prisma = require('./prisma');
const logger = require('./logger');

/**
 * Create an audit event for a sensitive operation.
 * Personal identifiers are never written to audit logs.
 */
async function createAuditEvent({
  actorId = null,
  actorRole = null,
  action,
  entityType,
  entityId = null,
  diff = null,
  reason = null,
  correlationId = null,
  ipAddress = null,
  userAgent = null,
}) {
  try {
    await prisma.auditEvent.create({
      data: {
        actorId,
        actorRole,
        action,
        entityType,
        entityId,
        diff: diff ? sanitizeDiff(diff) : null,
        reason,
        correlationId,
        ipAddress,
        userAgent,
      },
    });
  } catch (err) {
    // Audit failures must not crash the main request
    logger.error({ err, action, entityType }, 'Failed to write audit event');
  }
}

/**
 * Remove sensitive fields from diff objects before storing.
 */
function sanitizeDiff(diff) {
  const SENSITIVE = [
    'passwordHash', 'apaarEncrypted', 'apaarHmacToken',
    'password', 'token', 'secret', 'key',
  ];

  if (!diff || typeof diff !== 'object') return diff;

  const sanitize = (obj) => {
    if (Array.isArray(obj)) return obj.map(sanitize);
    if (typeof obj !== 'object' || obj === null) return obj;

    return Object.fromEntries(
      Object.entries(obj).map(([k, v]) => {
        if (SENSITIVE.some((s) => k.toLowerCase().includes(s.toLowerCase()))) {
          return [k, '[REDACTED]'];
        }
        return [k, sanitize(v)];
      })
    );
  };

  return sanitize(diff);
}

/**
 * Extract audit context from an Express request.
 */
function auditContextFromReq(req) {
  return {
    actorId: req.user?.id || null,
    actorRole: req.user?.role || null,
    ipAddress: req.ip || req.connection?.remoteAddress,
    userAgent: req.headers?.['user-agent'],
    correlationId: req.headers?.['x-correlation-id'] || null,
  };
}

module.exports = { createAuditEvent, auditContextFromReq };
