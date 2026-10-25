const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { authenticate, authorize, scopeToInstitution } = require('../middleware/auth');

router.use(authenticate);

router.get(
  '/platform',
  authorize('PLATFORM_ADMIN'),
  dashboardController.getPlatformDashboard
);

router.get(
  '/institution',
  authorize('PLATFORM_ADMIN', 'INSTITUTION_ADMIN', 'DATA_OPERATOR'),
  scopeToInstitution,
  dashboardController.getInstitutionDashboard
);

router.get(
  '/institution/:institutionId',
  authorize('PLATFORM_ADMIN', 'INSTITUTION_ADMIN', 'DATA_OPERATOR'),
  scopeToInstitution,
  dashboardController.getInstitutionDashboard
);

router.get(
  '/verifier',
  authorize('PLATFORM_ADMIN', 'VERIFIER'),
  dashboardController.getVerifierDashboard
);

module.exports = router;
