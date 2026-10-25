const express = require('express');
const router = express.Router();
const institutionController = require('../controllers/institutionController');
const { authenticate, authorize, scopeToInstitution } = require('../middleware/auth');
const {
  validate,
  createInstitutionSchema,
  createProgrammeSchema,
  createIntakeConfigSchema,
} = require('../middleware/validate');

router.use(authenticate);

// ─── Institutions ──────────────────────────────────────────
router.get('/', scopeToInstitution, institutionController.listInstitutions);
router.get('/:id', scopeToInstitution, institutionController.getInstitution);
router.post(
  '/',
  authorize('PLATFORM_ADMIN'),
  validate({ body: createInstitutionSchema }),
  institutionController.createInstitution
);
router.patch(
  '/:id',
  authorize('PLATFORM_ADMIN', 'INSTITUTION_ADMIN'),
  scopeToInstitution,
  institutionController.updateInstitution
);

// ─── Programmes ────────────────────────────────────────────
router.get('/programmes/all', scopeToInstitution, institutionController.listProgrammes);
router.post(
  '/programmes',
  authorize('PLATFORM_ADMIN', 'INSTITUTION_ADMIN'),
  scopeToInstitution,
  validate({ body: createProgrammeSchema }),
  institutionController.createProgramme
);
router.patch(
  '/programmes/:id',
  authorize('PLATFORM_ADMIN', 'INSTITUTION_ADMIN'),
  institutionController.updateProgramme
);

// ─── Academic Years ────────────────────────────────────────
router.get('/academic-years/all', institutionController.listAcademicYears);
router.post(
  '/academic-years',
  authorize('PLATFORM_ADMIN'),
  institutionController.createAcademicYear
);

// ─── Intake Configurations ─────────────────────────────────
router.get('/intake-configs/all', scopeToInstitution, institutionController.listIntakeConfigs);
router.post(
  '/intake-configs',
  authorize('PLATFORM_ADMIN', 'INSTITUTION_ADMIN'),
  scopeToInstitution,
  validate({ body: createIntakeConfigSchema }),
  institutionController.createIntakeConfig
);
router.post(
  '/intake-configs/:id/publish',
  authorize('PLATFORM_ADMIN', 'INSTITUTION_ADMIN'),
  institutionController.publishIntakeConfig
);

module.exports = router;
