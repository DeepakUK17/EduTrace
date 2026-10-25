const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { authenticate, authorize, scopeToInstitution } = require('../middleware/auth');

router.use(authenticate);

router.get(
  '/institution-summary',
  authorize('PLATFORM_ADMIN', 'INSTITUTION_ADMIN'),
  scopeToInstitution,
  reportController.institutionSummary
);

router.get(
  '/intake-comparison',
  authorize('PLATFORM_ADMIN', 'INSTITUTION_ADMIN'),
  scopeToInstitution,
  reportController.intakeComparison
);

router.get(
  '/data-quality',
  authorize('PLATFORM_ADMIN', 'INSTITUTION_ADMIN'),
  scopeToInstitution,
  reportController.dataQuality
);

router.get(
  '/exceptions',
  authorize('PLATFORM_ADMIN', 'INSTITUTION_ADMIN'),
  scopeToInstitution,
  reportController.exceptionsReport
);

router.get(
  '/audit-events',
  authorize('PLATFORM_ADMIN', 'INSTITUTION_ADMIN'),
  scopeToInstitution,
  reportController.getAuditEvents
);

module.exports = router;
