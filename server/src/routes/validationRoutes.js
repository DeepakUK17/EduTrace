const express = require('express');
const router = express.Router();
const validationController = require('../controllers/validationController');
const { authenticate, authorize, scopeToInstitution } = require('../middleware/auth');

router.use(authenticate);

router.get('/rules', validationController.listRules);

router.post(
  '/run',
  authorize('PLATFORM_ADMIN', 'INSTITUTION_ADMIN', 'DATA_OPERATOR'),
  scopeToInstitution,
  validationController.triggerValidation
);

router.get(
  '/issues',
  scopeToInstitution,
  validationController.listIssues
);

router.get(
  '/issues/:id',
  scopeToInstitution,
  validationController.getIssue
);

router.patch(
  '/issues/:id',
  authorize('PLATFORM_ADMIN', 'INSTITUTION_ADMIN'),
  scopeToInstitution,
  validationController.updateIssue
);

module.exports = router;
