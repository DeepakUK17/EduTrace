const prisma = require('../utils/prisma');
const { encryptApaar, generateApaarHmac, maskApaar, validateApaarFormat } = require('../utils/crypto');
const { createAuditEvent, auditContextFromReq } = require('../utils/audit');
const validationService = require('../services/validationService');

/**
 * GET /api/students
 */
async function listStudents(req, res, next) {
  try {
    const { page = 1, limit = 20, institutionId, programmeId, academicYearId,
      apaarStatus, status, category, search } = req.query;
    const skip = (page - 1) * limit;

    // Build enrollment filter
    const enrollWhere = { isArchived: false };
    if (req.institutionScope) enrollWhere.institutionId = req.institutionScope;
    else if (institutionId) enrollWhere.institutionId = institutionId;
    if (programmeId) enrollWhere.programmeId = programmeId;
    if (academicYearId) enrollWhere.academicYearId = academicYearId;
    if (status) enrollWhere.status = status;
    if (category) enrollWhere.admissionCategory = category;
    if (search) {
      enrollWhere.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { institutionStudentId: { contains: search, mode: 'insensitive' } },
      ];
    }

    const studentWhere = {};
    if (apaarStatus) studentWhere.apaarStatus = apaarStatus;

    const [enrollments, total] = await Promise.all([
      prisma.enrollment.findMany({
        where: { ...enrollWhere, student: studentWhere },
        skip: Number(skip),
        take: Number(limit),
        include: {
          student: { select: { id: true, apaarStatus: true, apaarMasked: true, apaarIsDemoMode: true } },
          institution: { select: { id: true, name: true, code: true } },
          programme: { select: { id: true, name: true, code: true } },
          academicYear: { select: { id: true, label: true } },
          _count: { select: { validationIssues: true, exceptionCases: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.enrollment.count({ where: { ...enrollWhere, student: studentWhere } }),
    ]);

    res.json({ enrollments, total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / limit) });
  } catch (err) { next(err); }
}

/**
 * POST /api/students
 */
async function createStudent(req, res, next) {
  try {
    const { apaarId, institutionId, programmeId, academicYearId, ...enrollData } = req.body;

    // Process APAAR identifier
    const apaarValidation = validateApaarFormat(apaarId);
    let apaarStatus = 'MISSING';
    let apaarEncrypted = null;
    let apaarHmacToken = null;
    let apaarMasked = null;
    let apaarIsDemoMode = false;

    if (apaarId) {
      if (!apaarValidation.valid) {
        apaarStatus = 'INVALID_FORMAT';
      } else {
        apaarIsDemoMode = apaarValidation.isDemoMode;
        apaarEncrypted = encryptApaar(apaarId);
        apaarHmacToken = generateApaarHmac(apaarId);
        apaarMasked = maskApaar(apaarId);

        // Check for duplicates using HMAC token
        const existingWithSameHmac = await prisma.student.findFirst({
          where: { apaarHmacToken, NOT: { apaarStatus: 'INVALID_FORMAT' } },
        });
        apaarStatus = existingWithSameHmac ? 'POTENTIAL_DUPLICATE' : 'LOCAL_ACCEPTED';
      }
    }

    // Create student identity + enrollment in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const student = await tx.student.create({
        data: { apaarStatus, apaarEncrypted, apaarHmacToken, apaarMasked, apaarIsDemoMode },
      });

      const enrollment = await tx.enrollment.create({
        data: {
          studentId: student.id,
          institutionId,
          programmeId,
          academicYearId,
          provenance: 'MANUAL_ENTRY',
          ...enrollData,
        },
        include: {
          student: { select: { id: true, apaarStatus: true, apaarMasked: true } },
          institution: { select: { id: true, name: true } },
          programme: { select: { id: true, name: true } },
          academicYear: { select: { id: true, label: true } },
        },
      });

      return { student, enrollment };
    });

    // Run validation async
    validationService.runValidation(result.enrollment.id, req.user.id).catch(() => {});

    await createAuditEvent({
      ...auditContextFromReq(req),
      action: 'STUDENT_CREATED',
      entityType: 'Enrollment',
      entityId: result.enrollment.id,
      diff: { after: { institutionId, programmeId, academicYearId, apaarStatus } },
    });

    res.status(201).json({ enrollment: result.enrollment, student: result.student });
  } catch (err) { next(err); }
}

/**
 * GET /api/students/:id
 */
async function getStudent(req, res, next) {
  try {
    const enrollment = await prisma.enrollment.findUnique({
      where: { id: req.params.id },
      include: {
        student: true,
        institution: { select: { id: true, name: true, code: true } },
        programme: { select: { id: true, name: true, code: true } },
        academicYear: { select: { id: true, label: true } },
        validationIssues: {
          include: { rule: { select: { code: true, name: true, description: true } } },
          orderBy: { createdAt: 'desc' },
        },
        exceptionCases: {
          include: { assignedTo: { select: { id: true, firstName: true, lastName: true } } },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!enrollment) return res.status(404).json({ error: 'Record not found', code: 'NOT_FOUND' });

    // Institution scope check
    if (req.institutionScope && enrollment.institutionId !== req.institutionScope) {
      return res.status(403).json({ error: 'Access denied', code: 'FORBIDDEN' });
    }

    // Mask APAAR for unauthorized roles
    const canViewFullApaar = ['PLATFORM_ADMIN'].includes(req.user.role);
    if (!canViewFullApaar && enrollment.student.apaarEncrypted) {
      enrollment.student.apaarEncrypted = '[MASKED]';
    }
    // Always hide HMAC token from API responses
    enrollment.student.apaarHmacToken = undefined;

    res.json({ enrollment });
  } catch (err) { next(err); }
}

/**
 * PATCH /api/students/:id
 */
async function updateStudent(req, res, next) {
  try {
    const { apaarId, ...updateData } = req.body;
    const existing = await prisma.enrollment.findUnique({
      where: { id: req.params.id },
      include: { student: true },
    });

    if (!existing) return res.status(404).json({ error: 'Record not found', code: 'NOT_FOUND' });
    if (req.institutionScope && existing.institutionId !== req.institutionScope) {
      return res.status(403).json({ error: 'Access denied', code: 'FORBIDDEN' });
    }

    // If APAAR is being updated, re-process it
    let studentUpdate = {};
    if (apaarId !== undefined) {
      const apaarValidation = validateApaarFormat(apaarId);
      if (!apaarId) {
        studentUpdate = { apaarStatus: 'MISSING', apaarEncrypted: null, apaarHmacToken: null, apaarMasked: null };
      } else if (!apaarValidation.valid) {
        studentUpdate = { apaarStatus: 'INVALID_FORMAT' };
      } else {
        const apaarHmacToken = generateApaarHmac(apaarId);
        const duplicate = await prisma.student.findFirst({
          where: { apaarHmacToken, NOT: { id: existing.studentId } },
        });
        studentUpdate = {
          apaarStatus: duplicate ? 'POTENTIAL_DUPLICATE' : 'LOCAL_ACCEPTED',
          apaarEncrypted: encryptApaar(apaarId),
          apaarHmacToken,
          apaarMasked: maskApaar(apaarId),
          apaarIsDemoMode: apaarValidation.isDemoMode,
        };
      }
    }

    const updated = await prisma.$transaction(async (tx) => {
      if (Object.keys(studentUpdate).length > 0) {
        await tx.student.update({ where: { id: existing.studentId }, data: studentUpdate });
      }
      return tx.enrollment.update({
        where: { id: req.params.id },
        data: updateData,
        include: {
          student: { select: { id: true, apaarStatus: true, apaarMasked: true } },
          institution: { select: { id: true, name: true } },
          programme: { select: { id: true, name: true } },
          academicYear: { select: { id: true, label: true } },
        },
      });
    });

    await createAuditEvent({
      ...auditContextFromReq(req),
      action: 'ENROLLMENT_UPDATED',
      entityType: 'Enrollment',
      entityId: req.params.id,
      diff: {
        before: { status: existing.status, admissionCategory: existing.admissionCategory },
        after: { status: updated.status, admissionCategory: updated.admissionCategory },
      },
    });

    // Re-run validation
    validationService.runValidation(req.params.id, req.user.id).catch(() => {});

    res.json({ enrollment: updated });
  } catch (err) { next(err); }
}

/**
 * GET /api/students/:id/certificate-preview
 * Printable student record / academic identity verification document preview
 */
async function getCertificatePreview(req, res, next) {
  try {
    const enrollment = await prisma.enrollment.findUnique({
      where: { id: req.params.id },
      include: {
        student: true,
        institution: true,
        programme: true,
        academicYear: true,
        validationIssues: { where: { status: 'OPEN' } },
      },
    });

    if (!enrollment) return res.status(404).json({ error: 'Record not found', code: 'NOT_FOUND' });
    if (req.institutionScope && enrollment.institutionId !== req.institutionScope) {
      return res.status(403).json({ error: 'Access denied', code: 'FORBIDDEN' });
    }

    await createAuditEvent({
      ...auditContextFromReq(req),
      action: 'CERTIFICATE_PREVIEW_GENERATED',
      entityType: 'Enrollment',
      entityId: enrollment.id,
      reason: 'Certificate / Academic Record preview accessed',
    });

    const canViewFullApaar = ['PLATFORM_ADMIN', 'INSTITUTION_ADMIN'].includes(req.user?.role);
    const apaarDisplay = canViewFullApaar && req.query.unmask === 'true' && enrollment.student.apaarEncrypted
      ? enrollment.student.apaarMasked // or unmasked if authorized
      : enrollment.student.apaarMasked || 'NOT REGISTERED';

    res.json({
      certificate: {
        documentNumber: `ET-${enrollment.id.substring(0, 8).toUpperCase()}`,
        generatedAt: new Date().toISOString(),
        institution: {
          name: enrollment.institution.name,
          code: enrollment.institution.code,
          address: enrollment.institution.address || 'AICTE Approved Campus',
          status: enrollment.institution.status,
        },
        student: {
          id: enrollment.student.id,
          fullName: `${enrollment.firstName} ${enrollment.lastName}`,
          institutionStudentId: enrollment.institutionStudentId,
          apaarId: apaarDisplay,
          apaarStatus: enrollment.student.apaarStatus,
          admissionDate: enrollment.admissionDate,
          admissionCategory: enrollment.admissionCategory,
          programme: enrollment.programme.name,
          programmeCode: enrollment.programme.code,
          academicYear: enrollment.academicYear.label,
          status: enrollment.status,
        },
        complianceStatus: enrollment.validationIssues.length === 0 ? 'VERIFIED_COMPLIANT' : 'PENDING_REVIEW',
        watermark: 'EDUTRACE PROTOTYPE — NOT AN OFFICIAL GOVERNMENT CERTIFICATE',
        disclaimer: 'This verification record is generated by EduTrace prototype for AICTE validation demonstration purposes. Official validation requires credentials through National Academic Depository (NAD) / Academic Bank of Credits (ABC).',
      },
    });
  } catch (err) { next(err); }
}

module.exports = { listStudents, createStudent, getStudent, updateStudent, getCertificatePreview };
