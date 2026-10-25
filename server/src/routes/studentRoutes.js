const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');
const { authenticate, authorize, scopeToInstitution } = require('../middleware/auth');
const { validate, createStudentSchema, updateStudentSchema } = require('../middleware/validate');

router.use(authenticate);

router.get(
  '/',
  scopeToInstitution,
  studentController.listStudents
);

router.post(
  '/',
  authorize('PLATFORM_ADMIN', 'INSTITUTION_ADMIN', 'DATA_OPERATOR'),
  scopeToInstitution,
  validate({ body: createStudentSchema }),
  studentController.createStudent
);

router.get(
  '/:id/certificate-preview',
  scopeToInstitution,
  studentController.getCertificatePreview
);

router.get(
  '/:id',
  scopeToInstitution,
  studentController.getStudent
);

router.patch(
  '/:id',
  authorize('PLATFORM_ADMIN', 'INSTITUTION_ADMIN', 'DATA_OPERATOR'),
  scopeToInstitution,
  validate({ body: updateStudentSchema }),
  studentController.updateStudent
);

module.exports = router;
