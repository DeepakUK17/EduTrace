const express = require('express');
const router = express.Router();
const caseController = require('../controllers/caseController');
const { authenticate, authorize, scopeToInstitution } = require('../middleware/auth');
const { validate, updateCaseStatusSchema } = require('../middleware/validate');

router.use(authenticate);

router.get(
  '/',
  authorize('PLATFORM_ADMIN', 'INSTITUTION_ADMIN', 'DATA_OPERATOR', 'VERIFIER'),
  scopeToInstitution,
  caseController.listCases
);

router.post(
  '/',
  authorize('PLATFORM_ADMIN', 'INSTITUTION_ADMIN', 'DATA_OPERATOR'),
  scopeToInstitution,
  caseController.createCase
);

router.get(
  '/:id',
  authorize('PLATFORM_ADMIN', 'INSTITUTION_ADMIN', 'DATA_OPERATOR', 'VERIFIER'),
  scopeToInstitution,
  caseController.getCase
);

router.patch(
  '/:id/status',
  authorize('PLATFORM_ADMIN', 'INSTITUTION_ADMIN', 'VERIFIER'),
  scopeToInstitution,
  validate({ body: updateCaseStatusSchema }),
  caseController.updateCaseStatus
);

router.post(
  '/:id/assign',
  authorize('PLATFORM_ADMIN', 'INSTITUTION_ADMIN'),
  scopeToInstitution,
  caseController.assignCase
);

router.post(
  '/:id/comments',
  authorize('PLATFORM_ADMIN', 'INSTITUTION_ADMIN', 'DATA_OPERATOR', 'VERIFIER'),
  scopeToInstitution,
  caseController.addComment
);

module.exports = router;
