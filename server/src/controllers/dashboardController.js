const prisma = require('../utils/prisma');

/**
 * GET /api/dashboard/platform — Platform Admin metrics
 */
async function getPlatformDashboard(req, res, next) {
  try {
    const [
      totalInstitutions, totalStudents, totalEnrollments,
      pendingCases, openIssues, duplicateCases,
      recentAudit, integrationHealth,
      enrollmentsByStatus, issuesBySeverity,
    ] = await Promise.all([
      prisma.institution.count({ where: { status: 'ACTIVE' } }),
      prisma.student.count(),
      prisma.enrollment.count({ where: { isArchived: false } }),
      prisma.exceptionCase.count({ where: { status: { notIn: ['RESOLVED', 'REJECTED', 'FALSE_POSITIVE', 'CLOSED_WITH_EXPLANATION'] } } }),
      prisma.validationIssue.count({ where: { status: 'OPEN' } }),
      prisma.duplicateMatch.count({ where: { disposition: 'PENDING_REVIEW' } }),
      prisma.auditEvent.findMany({ orderBy: { createdAt: 'desc' }, take: 10, include: { actor: { select: { firstName: true, lastName: true, role: true } } } }),
      prisma.integrationConnector.findMany({ select: { id: true, name: true, mode: true, status: true, lastAttemptAt: true, lastSuccessAt: true } }),
      prisma.enrollment.groupBy({ by: ['status'], _count: { id: true } }),
      prisma.validationIssue.groupBy({ by: ['severity'], _count: { id: true }, where: { status: 'OPEN' } }),
    ]);

    // Academic year trends (enrollments per year)
    const yearTrends = await prisma.enrollment.groupBy({
      by: ['academicYearId'],
      _count: { id: true },
      where: { isArchived: false },
    });

    const yearLabels = await prisma.academicYear.findMany({ select: { id: true, label: true } });
    const yearMap = Object.fromEntries(yearLabels.map((y) => [y.id, y.label]));

    res.json({
      kpis: {
        totalInstitutions,
        totalStudents,
        totalEnrollments,
        pendingCases,
        openIssues,
        duplicateCases,
      },
      charts: {
        enrollmentsByStatus: enrollmentsByStatus.map((e) => ({ status: e.status, count: e._count.id })),
        issuesBySeverity: issuesBySeverity.map((i) => ({ severity: i.severity, count: i._count.id })),
        yearTrends: yearTrends.map((y) => ({ year: yearMap[y.academicYearId] || y.academicYearId, count: y._count.id })),
      },
      integrationHealth,
      recentAudit,
    });
  } catch (err) { next(err); }
}

/**
 * GET /api/dashboard/institution/:institutionId — Institution metrics
 */
async function getInstitutionDashboard(req, res, next) {
  try {
    const institutionId = req.institutionScope || req.params.institutionId;

    const [
      totalEnrollments, pendingValidation, openCases,
      importJobs, recentImports, issuesByRule,
      intakeConfigs,
    ] = await Promise.all([
      prisma.enrollment.count({ where: { institutionId, isArchived: false } }),
      prisma.validationIssue.count({
        where: { status: 'OPEN', enrollment: { institutionId } },
      }),
      prisma.exceptionCase.count({
        where: {
          status: { notIn: ['RESOLVED', 'REJECTED', 'FALSE_POSITIVE', 'CLOSED_WITH_EXPLANATION'] },
          enrollment: { institutionId },
        },
      }),
      prisma.dataImportJob.count({ where: { institutionId } }),
      prisma.dataImportJob.findMany({
        where: { institutionId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: { academicYear: { select: { label: true } }, uploadedBy: { select: { firstName: true, lastName: true } } },
      }),
      prisma.validationIssue.groupBy({
        by: ['ruleId'],
        _count: { id: true },
        where: { status: 'OPEN', enrollment: { institutionId } },
      }),
      prisma.intakeConfiguration.findMany({
        where: { institutionId, isActive: true },
        include: {
          programme: { select: { name: true, code: true } },
          academicYear: { select: { label: true } },
        },
      }),
    ]);

    // Enrich intake with current enrollment counts
    const intakeEnriched = await Promise.all(intakeConfigs.map(async (c) => {
      const count = await prisma.enrollment.count({
        where: { institutionId, programmeId: c.programmeId, academicYearId: c.academicYearId, status: 'ACTIVE', isArchived: false },
      });
      return {
        ...c,
        currentEnrollment: count,
        utilizationPct: c.approvedIntake > 0 ? Math.round((count / c.approvedIntake) * 100) : 0,
        isNearCapacity: count / c.approvedIntake >= 0.9,
        isOverCapacity: count > c.approvedIntake,
      };
    }));

    res.json({
      kpis: { totalEnrollments, pendingValidation, openCases, importJobs },
      intakeSummary: intakeEnriched,
      recentImports,
      issuesByRule: issuesByRule.map((i) => ({ ruleId: i.ruleId, count: i._count.id })),
    });
  } catch (err) { next(err); }
}

/**
 * GET /api/dashboard/verifier
 */
async function getVerifierDashboard(req, res, next) {
  try {
    // Auto-expire tokens
    await prisma.verificationRequest.updateMany({
      where: { status: 'ACTIVE', expiresAt: { lt: new Date() } },
      data: { status: 'EXPIRED' },
    });

    const [activeTokens, expiredTokens, revokedTokens, recentActivity] = await Promise.all([
      prisma.verificationRequest.count({ where: { createdById: req.user.id, status: 'ACTIVE' } }),
      prisma.verificationRequest.count({ where: { createdById: req.user.id, status: 'EXPIRED' } }),
      prisma.verificationRequest.count({ where: { createdById: req.user.id, status: 'REVOKED' } }),
      prisma.verificationRequest.findMany({
        where: { createdById: req.user.id },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: { id: true, purpose: true, status: true, expiresAt: true, createdAt: true, student: { select: { apaarMasked: true } } },
      }),
    ]);

    res.json({ kpis: { activeTokens, expiredTokens, revokedTokens }, recentActivity });
  } catch (err) { next(err); }
}

module.exports = { getPlatformDashboard, getInstitutionDashboard, getVerifierDashboard };
