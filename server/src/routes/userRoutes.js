const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticate, authorize } = require('../middleware/auth');
const { validate, createUserSchema, updateUserSchema } = require('../middleware/validate');

router.use(authenticate);

router.get(
  '/',
  authorize('PLATFORM_ADMIN', 'INSTITUTION_ADMIN'),
  userController.listUsers
);

router.post(
  '/',
  authorize('PLATFORM_ADMIN', 'INSTITUTION_ADMIN'),
  validate({ body: createUserSchema }),
  userController.createUser
);

router.get(
  '/:id',
  authorize('PLATFORM_ADMIN', 'INSTITUTION_ADMIN'),
  userController.getUser
);

router.patch(
  '/:id',
  authorize('PLATFORM_ADMIN', 'INSTITUTION_ADMIN'),
  validate({ body: updateUserSchema }),
  userController.updateUser
);

module.exports = router;
