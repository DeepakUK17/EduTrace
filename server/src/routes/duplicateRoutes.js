const express = require('express');
const router = express.Router();
const duplicateController = require('../controllers/duplicateController');
const { authenticate, authorize, scopeToInstitution } = require('../middleware/auth');

router.use(authenticate);

router.get(
  '/',
  authorize('PLATFORM_ADMIN', 'INSTITUTION_ADMIN', 'VERIFIER'),
  scopeToInstitution,
  duplicateController.listDuplicates
);

router.post(
  '/:id/disposition',
  authorize('PLATFORM_ADMIN', 'INSTITUTION_ADMIN', 'VERIFIER'),
  duplicateController.recordDisposition
);

module.exports = router;
