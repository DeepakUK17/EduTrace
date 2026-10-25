const express = require('express');
const router = express.Router();
const verificationController = require('../controllers/verificationController');
const { authenticate, authorize } = require('../middleware/auth');
const { validate, createVerificationTokenSchema } = require('../middleware/validate');

// Protected token management routes
router.get(
  '/',
  authenticate,
  authorize('PLATFORM_ADMIN', 'INSTITUTION_ADMIN', 'VERIFIER'),
  verificationController.listVerificationTokens
);

router.post(
  '/',
  authenticate,
  authorize('PLATFORM_ADMIN', 'INSTITUTION_ADMIN', 'VERIFIER'),
  validate({ body: createVerificationTokenSchema }),
  verificationController.createVerificationToken
);

router.post(
  '/:id/revoke',
  authenticate,
  authorize('PLATFORM_ADMIN', 'INSTITUTION_ADMIN'),
  verificationController.revokeToken
);

module.exports = router;
