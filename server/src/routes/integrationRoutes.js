const express = require('express');
const router = express.Router();
const integrationController = require('../controllers/integrationController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

router.get(
  '/',
  authorize('PLATFORM_ADMIN', 'INSTITUTION_ADMIN'),
  integrationController.getIntegrationStatus
);

router.get(
  '/status',
  authorize('PLATFORM_ADMIN', 'INSTITUTION_ADMIN'),
  integrationController.getIntegrationStatus
);

router.post(
  '/:adapter/test',
  authorize('PLATFORM_ADMIN'),
  integrationController.testConnector
);

router.get(
  '/jobs',
  authorize('PLATFORM_ADMIN', 'INSTITUTION_ADMIN'),
  integrationController.listIntegrationJobs
);

router.post(
  '/jobs/:id/retry',
  authorize('PLATFORM_ADMIN'),
  integrationController.retryJob
);

module.exports = router;
