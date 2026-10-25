const crypto = require('crypto');
const QRCode = require('qrcode');
const prisma = require('../utils/prisma');
const { generateVerificationTokenRef, hashTokenRef } = require('../utils/crypto');
const { createAuditEvent, auditContextFromReq } = require('../utils/audit');

const PROTOTYPE_DISCLAIMER = 'EduTrace Prototype Verification — NOT an Official APAAR Credential — For Demonstration Only';

/**
 * POST /api/verification-tokens
 */
async function createVerificationToken(req, res, next) {
  try {
    const { studentId, purpose, permittedFields, expiresInDays = 7, isSingleUse = false } = req.body;

    // Verify student exists
    const student = await prisma.student.findUnique({ where: { id: studentId } });
    if (!student) return res.status(404).json({ error: 'Student not found', code: 'NOT_FOUND' });

    const tokenRef = generateVerificationTokenRef();
    const tokenHash = hashTokenRef(tokenRef);
    const expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000);

    // Build verification URL (uses opaque tokenRef only, never APAAR ID)
    const baseUrl = process.env.FRONTEND_ORIGIN || 'http://localhost:5173';
    const verifyUrl = `${baseUrl}/verify/${tokenRef}`;

    // Generate QR code
    const qrCodeDataUrl = await QRCode.toDataURL(verifyUrl, {
      width: 256,
      margin: 2,
      color: { dark: '#1e3a5f', light: '#ffffff' },
    });

    const token = await prisma.verificationRequest.create({
      data: {
        tokenRef,
        tokenHash,
        studentId,
        createdById: req.user.id,
        purpose,
        permittedFields,
        expiresAt,
        isSingleUse,
        status: 'ACTIVE',
      },
      include: {
        student: { select: { id: true, apaarStatus: true, apaarMasked: true } },
        createdBy: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    await createAuditEvent({
      ...auditContextFromReq(req),
      action: 'VERIFICATION_TOKEN_CREATED',
      entityType: 'VerificationRequest',
      entityId: token.id,
      diff: { after: { studentId, purpose, permittedFields, expiresAt } },
    });

    res.status(201).json({
      token: { ...token, tokenRef: undefined }, // Never return raw tokenRef in list/detail
      tokenRef, // Return once at creation for QR/link generation
      verifyUrl,
      qrCode: qrCodeDataUrl,
      disclaimer: PROTOTYPE_DISCLAIMER,
    });
  } catch (err) { next(err); }
}

/**
 * GET /api/verify/:tokenRef — public endpoint for QR verification
 */
async function verifyToken(req, res, next) {
  try {
    const { tokenRef } = req.params;
    const tokenHash = hashTokenRef(tokenRef);

    const token = await prisma.verificationRequest.findUnique({
      where: { tokenHash },
      include: {
        student: {
          include: {
            enrollments: {
              where: { status: 'ACTIVE', isArchived: false },
              include: {
                institution: { select: { id: true, name: true, code: true } },
                programme: { select: { id: true, name: true, code: true } },
                academicYear: { select: { id: true, label: true } },
              },
              take: 1,
            },
          },
        },
      },
    });

    if (!token) {
      return res.status(404).json({ error: 'Verification reference not found or invalid', code: 'NOT_FOUND', disclaimer: PROTOTYPE_DISCLAIMER });
    }

    // Check expiry
    if (token.status === 'EXPIRED' || new Date() > token.expiresAt) {
      await prisma.verificationRequest.update({ where: { tokenHash }, data: { status: 'EXPIRED' } });
      return res.status(410).json({ error: 'Verification reference has expired', code: 'TOKEN_EXPIRED', disclaimer: PROTOTYPE_DISCLAIMER });
    }

    // Check revocation
    if (token.status === 'REVOKED') {
      return res.status(410).json({ error: 'Verification reference has been revoked', code: 'TOKEN_REVOKED', disclaimer: PROTOTYPE_DISCLAIMER });
    }

    // Single-use check
    if (token.isSingleUse && token.usedAt) {
      return res.status(410).json({ error: 'This single-use verification reference has already been used', code: 'TOKEN_USED', disclaimer: PROTOTYPE_DISCLAIMER });
    }

    // Mark as used (single-use)
    if (token.isSingleUse) {
      await prisma.verificationRequest.update({ where: { tokenHash }, data: { usedAt: new Date(), status: 'USED' } });
    }

    // Build response with ONLY permitted fields
    const enrollment = token.student.enrollments[0];
    const fullData = {
      name: enrollment ? `${enrollment.firstName} ${enrollment.lastName}` : null,
      institution: enrollment?.institution?.name,
      programme: enrollment?.programme?.name,
      academicYear: enrollment?.academicYear?.label,
      apaarStatus: token.student.apaarStatus,
      apaarMasked: token.student.apaarMasked, // Always masked in verification
      enrollmentStatus: enrollment?.status,
      admissionCategory: enrollment?.admissionCategory,
      verificationNote: `Record validated by EduTrace platform. APAAR status: ${token.student.apaarStatus}. This is a prototype verification response — not an official government-issued credential.`,
    };

    const response = {};
    for (const field of token.permittedFields) {
      if (fullData[field] !== undefined) response[field] = fullData[field];
    }

    // Log access
    await createAuditEvent({
      action: 'VERIFICATION_TOKEN_ACCESSED',
      entityType: 'VerificationRequest',
      entityId: token.id,
      reason: token.purpose,
      ipAddress: req.ip,
    });

    res.json({
      verified: true,
      purpose: token.purpose,
      expiresAt: token.expiresAt,
      data: response,
      disclaimer: PROTOTYPE_DISCLAIMER,
      validationLayer: 'LOCAL_DATABASE_CHECK',
      validationNote: 'This verification is based on locally stored records and has not been cross-verified with official APAAR/ABC systems.',
    });
  } catch (err) { next(err); }
}

/**
 * POST /api/verification-tokens/:id/revoke
 */
async function revokeToken(req, res, next) {
  try {
    const token = await prisma.verificationRequest.findUnique({ where: { id: req.params.id } });
    if (!token) return res.status(404).json({ error: 'Token not found', code: 'NOT_FOUND' });

    if (!['ACTIVE'].includes(token.status)) {
      return res.status(400).json({ error: `Cannot revoke token with status: ${token.status}`, code: 'INVALID_STATE' });
    }

    await prisma.verificationRequest.update({
      where: { id: req.params.id },
      data: { status: 'REVOKED', revokedAt: new Date() },
    });

    await createAuditEvent({
      ...auditContextFromReq(req),
      action: 'VERIFICATION_TOKEN_REVOKED',
      entityType: 'VerificationRequest',
      entityId: req.params.id,
      reason: req.body.reason || 'Manual revocation',
    });

    res.json({ message: 'Token revoked successfully' });
  } catch (err) { next(err); }
}

/**
 * GET /api/verification-tokens
 */
async function listVerificationTokens(req, res, next) {
  try {
    const { page = 1, limit = 20, status, studentId } = req.query;
    const skip = (page - 1) * limit;

    // Auto-expire tokens
    await prisma.verificationRequest.updateMany({
      where: { status: 'ACTIVE', expiresAt: { lt: new Date() } },
      data: { status: 'EXPIRED' },
    });

    const where = {};
    if (status) where.status = status;
    if (studentId) where.studentId = studentId;
    if (!['PLATFORM_ADMIN', 'VERIFIER'].includes(req.user.role)) {
      where.createdById = req.user.id;
    }

    const [tokens, total] = await Promise.all([
      prisma.verificationRequest.findMany({
        where, skip: Number(skip), take: Number(limit),
        select: {
          id: true, purpose: true, permittedFields: true, expiresAt: true,
          revokedAt: true, isSingleUse: true, usedAt: true, status: true,
          createdAt: true,
          student: { select: { id: true, apaarStatus: true, apaarMasked: true } },
          createdBy: { select: { id: true, firstName: true, lastName: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.verificationRequest.count({ where }),
    ]);

    res.json({ tokens, total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / limit) });
  } catch (err) { next(err); }
}

module.exports = { createVerificationToken, verifyToken, revokeToken, listVerificationTokens };
