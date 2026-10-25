const express = require('express');
const router = express.Router();
const importController = require('../controllers/importController');
const { authenticate, authorize, scopeToInstitution } = require('../middleware/auth');

// Template download does not require strict upload permissions
router.get('/template', importController.downloadTemplate);

router.use(authenticate);

router.get(
  '/',
  authorize('PLATFORM_ADMIN', 'INSTITUTION_ADMIN', 'DATA_OPERATOR'),
  scopeToInstitution,
  importController.listImportJobs
);

router.post(
  '/',
  authorize('PLATFORM_ADMIN', 'INSTITUTION_ADMIN', 'DATA_OPERATOR'),
  scopeToInstitution,
  importController.upload.single('file'),
  importController.uploadImport
);

router.get(
  '/:id',
  authorize('PLATFORM_ADMIN', 'INSTITUTION_ADMIN', 'DATA_OPERATOR'),
  scopeToInstitution,
  importController.getImportJob
);

router.get(
  '/:id/rows',
  authorize('PLATFORM_ADMIN', 'INSTITUTION_ADMIN', 'DATA_OPERATOR'),
  scopeToInstitution,
  importController.getImportRows
);

router.post(
  '/:id/commit',
  authorize('PLATFORM_ADMIN', 'INSTITUTION_ADMIN'),
  scopeToInstitution,
  importController.commitImport
);

module.exports = router;
