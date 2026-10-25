const express = require('express');
const router = express.Router();
const capacityController = require('../controllers/capacityController');
const { authenticate, authorize, scopeToInstitution } = require('../middleware/auth');
const { validate, simulateCapacitySchema } = require('../middleware/validate');

router.use(authenticate);

router.post(
  '/simulate',
  authorize('PLATFORM_ADMIN', 'INSTITUTION_ADMIN'),
  scopeToInstitution,
  validate({ body: simulateCapacitySchema }),
  capacityController.simulateCapacity
);

router.get(
  '/scenarios',
  authorize('PLATFORM_ADMIN', 'INSTITUTION_ADMIN'),
  scopeToInstitution,
  capacityController.listScenarios
);

router.get(
  '/scenarios/:id',
  authorize('PLATFORM_ADMIN', 'INSTITUTION_ADMIN'),
  scopeToInstitution,
  capacityController.getScenario
);

router.get(
  '/year-comparison',
  authorize('PLATFORM_ADMIN', 'INSTITUTION_ADMIN'),
  scopeToInstitution,
  capacityController.yearComparison
);

module.exports = router;
