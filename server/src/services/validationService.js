const prisma = require('../utils/prisma');
const { validateApaarFormat, generateApaarHmac, maskApaar, encryptApaar } = require('../utils/crypto');
const { createAuditEvent } = require('../utils/audit');

// ── VALIDATION RULES ──────────────────────────────────────────────────────────
// Loaded from DB; these are the rule codes used server-side

const RULE_CODES = {
  FMT_01: 'FMT-01', // APAAR missing
  FMT_02: 'FMT-02', // APAAR invalid format
  FMT_03: 'FMT-03', // Required field missing
  CON_01: 'CON-01', // Programme/year mismatch
  DUP_01: 'DUP-01', // Exact duplicate (same institution)
  DUP_02: 'DUP-02', // Exact duplicate (cross-institution)
  CAP_01: 'CAP-01', // Enrolled count exceeds approved intake
  CAP_02: 'CAP-02', // Category-specific limit exceeded
  CAP_03: 'CAP-03', // Supernumerary limit exceeded
};

/**
 * Run all validation layers against a single enrollment.
 * Creates ValidationIssue records for each finding.
 * Called after create/update/import operations.
 */
async function runValidation(enrollmentId, actorId = null) {
  const enrollment = await prisma.enrollment.findUnique({
    where: { id: enrollmentId },
    include: {
      student: true,
      institution: true,
      programme: true,
      academicYear: true,
    },
  });

  if (!enrollment) return;

  // Mark existing open issues as stale (close them before re-evaluating)
  await prisma.validationIssue.updateMany({
    where: { enrollmentId, status: 'OPEN' },
    data: { status: 'WONT_FIX' },
  });

  const issues = [];

  // ── Layer 1: Format Validation ────────────────────────────────────────────

  // FMT-01: Missing APAAR
  if (enrollment.student.apaarStatus === 'MISSING') {
    issues.push({
      ruleCode: RULE_CODES.FMT_01,
      severity: 'MEDIUM',
      fieldsAffected: ['apaarId'],
      evidence: { value: null, expected: '12-digit APAAR ID or DEMO-APAAR-XXXXXX' },
      explanation: 'No APAAR academic identifier has been provided for this student record. An APAAR ID is required for verification purposes.',
      recommendedAction: 'Obtain the student\'s APAAR ID from the Academic Bank of Credits and update the record.',
    });
  }

  // FMT-02: Invalid format
  if (enrollment.student.apaarStatus === 'INVALID_FORMAT') {
    issues.push({
      ruleCode: RULE_CODES.FMT_02,
      severity: 'HIGH',
      fieldsAffected: ['apaarId'],
      evidence: { expected: '12 numeric digits OR DEMO-APAAR-XXXXXX format' },
      explanation: 'The provided APAAR identifier does not match the expected format. A valid APAAR ID must be exactly 12 numeric digits.',
      recommendedAction: 'Verify the APAAR ID from the student\'s ABC account or the official APAAR portal and re-enter it correctly.',
    });
  }

  // ── Layer 3: Cross-Record Checks ──────────────────────────────────────────

  // DUP-01/DUP-02: Duplicate APAAR token
  if (enrollment.student.apaarStatus === 'POTENTIAL_DUPLICATE' && enrollment.student.apaarHmacToken) {
    const duplicates = await prisma.student.findMany({
      where: {
        apaarHmacToken: enrollment.student.apaarHmacToken,
        NOT: { id: enrollment.studentId },
      },
      include: {
        enrollments: {
          where: { status: 'ACTIVE', isArchived: false },
          include: { institution: { select: { id: true, name: true } } },
        },
      },
    });

    for (const dup of duplicates) {
      const isCrossInstitution = dup.enrollments.some(
        (e) => e.institutionId !== enrollment.institutionId
      );
      const ruleCode = isCrossInstitution ? RULE_CODES.DUP_02 : RULE_CODES.DUP_01;

      issues.push({
        ruleCode,
        severity: isCrossInstitution ? 'HIGH' : 'MEDIUM',
        fieldsAffected: ['apaarId'],
        evidence: {
          matchType: 'EXACT_IDENTIFIER',
          duplicateStudentId: dup.id,
          institutions: dup.enrollments.map((e) => e.institution?.name),
        },
        explanation: `The APAAR identifier for this student matches another active ${isCrossInstitution ? 'cross-institution' : ''} record. This may indicate a duplicate enrollment, data entry error, or a legitimate transfer that needs review.`,
        recommendedAction: 'Review both records in the Duplicate Review Workbench. Do not assume fraud — check for transfers or data entry errors.',
      });

      // Create DuplicateMatch record
      const existingMatch = await prisma.duplicateMatch.findFirst({
        where: { OR: [
          { recordAId: enrollment.studentId, recordBId: dup.id },
          { recordAId: dup.id, recordBId: enrollment.studentId },
        ]},
      });

      if (!existingMatch) {
        await prisma.duplicateMatch.create({
          data: {
            recordAId: enrollment.studentId,
            recordBId: dup.id,
            matchType: isCrossInstitution ? 'CROSS_INSTITUTION_EXACT' : 'EXACT_IDENTIFIER',
            matchScore: 1.0,
            evidence: {
              matchedOn: 'APAAR_HMAC_TOKEN',
              institutionA: enrollment.institution?.name,
              institutionB: dup.enrollments[0]?.institution?.name,
            },
            isCrossInstitution,
          },
        });
      }
    }
  }

  // CAP-01: Capacity check
  const intakeConfig = await prisma.intakeConfiguration.findUnique({
    where: {
      institutionId_programmeId_academicYearId: {
        institutionId: enrollment.institutionId,
        programmeId: enrollment.programmeId,
        academicYearId: enrollment.academicYearId,
      },
    },
  });

  if (intakeConfig) {
    const currentCount = await prisma.enrollment.count({
      where: {
        institutionId: enrollment.institutionId,
        programmeId: enrollment.programmeId,
        academicYearId: enrollment.academicYearId,
        status: 'ACTIVE',
        isArchived: false,
      },
    });

    if (currentCount > intakeConfig.approvedIntake) {
      issues.push({
        ruleCode: RULE_CODES.CAP_01,
        severity: 'HIGH',
        fieldsAffected: ['admissionCategory', 'programmeId', 'academicYearId'],
        evidence: {
          approvedIntake: intakeConfig.approvedIntake,
          currentEnrollment: currentCount,
          excess: currentCount - intakeConfig.approvedIntake,
          ruleVersion: intakeConfig.ruleVersion,
        },
        explanation: `The total active enrollment (${currentCount}) exceeds the approved intake (${intakeConfig.approvedIntake}) for this programme and academic year. Rule version: ${intakeConfig.ruleVersion}.`,
        recommendedAction: 'Review the enrollment records for this programme. Verify if any admissions fall under supernumerary or special category rules. Escalate to the institution admin for review.',
      });
    }

    // CAP-03: Supernumerary check
    if (enrollment.isSupernumerary) {
      const supernumeraryCount = await prisma.enrollment.count({
        where: {
          institutionId: enrollment.institutionId,
          programmeId: enrollment.programmeId,
          academicYearId: enrollment.academicYearId,
          isSupernumerary: true,
          status: 'ACTIVE',
          isArchived: false,
        },
      });

      if (supernumeraryCount > intakeConfig.supernumeraryAllowance) {
        issues.push({
          ruleCode: RULE_CODES.CAP_03,
          severity: 'MEDIUM',
          fieldsAffected: ['isSupernumerary'],
          evidence: {
            supernumeraryAllowance: intakeConfig.supernumeraryAllowance,
            currentSupernumerary: supernumeraryCount,
          },
          explanation: `Supernumerary enrollment (${supernumeraryCount}) exceeds the configured allowance (${intakeConfig.supernumeraryAllowance}).`,
          recommendedAction: 'Review supernumerary admissions against the approved intake configuration.',
        });
      }
    }
  }

  // ── Create ValidationIssue records ───────────────────────────────────────

  for (const issue of issues) {
    const rule = await prisma.validationRule.findFirst({
      where: { code: issue.ruleCode, isActive: true },
      orderBy: { createdAt: 'desc' },
    });

    if (rule) {
      await prisma.validationIssue.create({
        data: {
          enrollmentId,
          ruleId: rule.id,
          ruleVersion: rule.version,
          severity: issue.severity,
          fieldsAffected: issue.fieldsAffected,
          evidence: issue.evidence,
          explanation: issue.explanation,
          recommendedAction: issue.recommendedAction,
        },
      });

      // Auto-create exception case for HIGH/CRITICAL issues
      if (['HIGH', 'CRITICAL'].includes(issue.severity)) {
        const existingCase = await prisma.exceptionCase.findFirst({
          where: {
            enrollmentId,
            status: { notIn: ['RESOLVED', 'REJECTED', 'FALSE_POSITIVE', 'CLOSED_WITH_EXPLANATION'] },
          },
        });

        if (!existingCase) {
          await prisma.exceptionCase.create({
            data: {
              type: issue.ruleCode.startsWith('DUP') ? 'DUPLICATE_RECORD'
                : issue.ruleCode.startsWith('CAP') ? 'CAPACITY_VIOLATION'
                : issue.ruleCode.startsWith('FMT') ? 'MISSING_IDENTIFIER'
                : 'VALIDATION_FAILURE',
              severity: issue.severity === 'HIGH' ? 'HIGH' : 'CRITICAL',
              enrollmentId,
              title: issue.explanation.slice(0, 200),
              description: issue.explanation,
              evidence: issue.evidence,
              createdById: actorId || enrollment.institutionId,
            },
          });
        }
      }
    }
  }

  await createAuditEvent({
    actorId,
    action: 'VALIDATION_RUN',
    entityType: 'Enrollment',
    entityId: enrollmentId,
    diff: { issuesFound: issues.length },
  });

  return issues;
}

/**
 * Get validation results for an enrollment or all (with filters)
 */
async function getValidationIssues(req, res, next) {
  try {
    const { enrollmentId, severity, status, ruleCode, page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const where = {};
    if (enrollmentId) where.enrollmentId = enrollmentId;
    if (severity) where.severity = severity;
    if (status) where.status = status;
    if (ruleCode) where.rule = { code: ruleCode };

    // Institution scope
    if (req.institutionScope) {
      where.enrollment = { institutionId: req.institutionScope };
    }

    const [issues, total] = await Promise.all([
      prisma.validationIssue.findMany({
        where,
        skip: Number(skip),
        take: Number(limit),
        include: {
          rule: { select: { id: true, code: true, name: true, layer: true, category: true } },
          enrollment: {
            select: {
              id: true, firstName: true, lastName: true, institutionStudentId: true,
              institution: { select: { id: true, name: true } },
              programme: { select: { id: true, name: true } },
              academicYear: { select: { id: true, label: true } },
            },
          },
        },
        orderBy: [{ severity: 'desc' }, { createdAt: 'desc' }],
      }),
      prisma.validationIssue.count({ where }),
    ]);

    res.json({ issues, total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / limit) });
  } catch (err) { next(err); }
}

/**
 * POST /api/validation/run — manually trigger validation for an enrollment
 */
async function triggerValidation(req, res, next) {
  try {
    const { enrollmentId } = req.body;
    if (!enrollmentId) return res.status(400).json({ error: 'enrollmentId required', code: 'MISSING_FIELD' });

    const issues = await runValidation(enrollmentId, req.user.id);
    res.json({ message: 'Validation complete', issuesFound: issues.length, issues });
  } catch (err) { next(err); }
}

module.exports = { runValidation, getValidationIssues, triggerValidation };
