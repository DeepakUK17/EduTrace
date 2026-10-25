const { z } = require('zod');

/**
 * Middleware factory that validates request body, query, or params using Zod.
 * Usage: router.post('/route', validate({ body: schema }), handler)
 */
function validate({ body, query, params } = {}) {
  return (req, res, next) => {
    const errors = [];

    if (body) {
      const result = body.safeParse(req.body);
      if (!result.success) {
        errors.push(...result.error.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
          source: 'body',
        })));
      } else {
        req.body = result.data;
      }
    }

    if (query) {
      const result = query.safeParse(req.query);
      if (!result.success) {
        errors.push(...result.error.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
          source: 'query',
        })));
      } else {
        req.query = result.data;
      }
    }

    if (params) {
      const result = params.safeParse(req.params);
      if (!result.success) {
        errors.push(...result.error.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
          source: 'params',
        })));
      } else {
        req.params = result.data;
      }
    }

    if (errors.length > 0) {
      return res.status(422).json({
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: errors,
      });
    }

    next();
  };
}

// ============================================================
// COMMON SCHEMAS
// ============================================================

const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

const uuidSchema = z.object({
  id: z.string().uuid('Invalid ID format'),
});

// ============================================================
// AUTH SCHEMAS
// ============================================================

const loginSchema = z.object({
  email: z.string().email('Invalid email address').toLowerCase(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  role: z.enum(['PLATFORM_ADMIN', 'INSTITUTION_ADMIN', 'DATA_OPERATOR', 'VERIFIER', 'STUDENT']),
  institutionId: z.string().uuid().optional().nullable(),
});

// ============================================================
// INSTITUTION SCHEMAS
// ============================================================

const createInstitutionSchema = z.object({
  name: z.string().min(2).max(200),
  code: z.string().min(2).max(50).toUpperCase(),
  type: z.string().min(2).max(100),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  pincode: z.string().regex(/^\d{6}$/, 'Pincode must be 6 digits').optional(),
  aicteCode: z.string().optional(),
  website: z.string().url().optional(),
});

// ============================================================
// PROGRAMME SCHEMAS
// ============================================================

const createProgrammeSchema = z.object({
  institutionId: z.string().uuid(),
  name: z.string().min(2).max(200),
  code: z.string().min(2).max(50).toUpperCase(),
  level: z.enum(['UNDERGRADUATE', 'POSTGRADUATE', 'DIPLOMA', 'DOCTORATE', 'OTHER']),
  duration: z.coerce.number().int().min(1).max(10),
});

// ============================================================
// ACADEMIC YEAR SCHEMAS
// ============================================================

const createAcademicYearSchema = z.object({
  label: z.string().regex(/^\d{4}-\d{2}$/, 'Label must be in format YYYY-YY (e.g., 2024-25)'),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
});

// ============================================================
// INTAKE CONFIGURATION SCHEMAS
// ============================================================

const createIntakeConfigSchema = z.object({
  institutionId: z.string().uuid(),
  programmeId: z.string().uuid(),
  academicYearId: z.string().uuid(),
  approvedIntake: z.coerce.number().int().min(0),
  supernumeraryAllowance: z.coerce.number().int().min(0).default(0),
  nriLimit: z.coerce.number().int().min(0).default(0),
  ociLimit: z.coerce.number().int().min(0).default(0),
  foreignNationalLimit: z.coerce.number().int().min(0).default(0),
  ewsReservation: z.coerce.number().int().min(0).default(0),
  scReservation: z.coerce.number().int().min(0).default(0),
  stReservation: z.coerce.number().int().min(0).default(0),
  obcReservation: z.coerce.number().int().min(0).default(0),
  sourceDocument: z.string().optional(),
  ruleVersion: z.string().default('v1.0'),
});

// ============================================================
// ENROLLMENT SCHEMAS
// ============================================================

const createEnrollmentSchema = z.object({
  institutionStudentId: z.string().min(1).max(100),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  email: z.string().email().optional().nullable(),
  phone: z.string().optional().nullable(),
  apaarId: z.string().optional().nullable(), // Raw APAAR - processed server-side
  institutionId: z.string().uuid(),
  programmeId: z.string().uuid(),
  academicYearId: z.string().uuid(),
  admissionDate: z.coerce.date(),
  admissionCategory: z.enum([
    'GENERAL', 'OBC', 'SC', 'ST', 'EWS',
    'NRI', 'OCI', 'FOREIGN_NATIONAL', 'SUPERNUMERARY', 'OTHER'
  ]).default('GENERAL'),
  isNri: z.boolean().default(false),
  isOci: z.boolean().default(false),
  isForeignNational: z.boolean().default(false),
  isSupernumerary: z.boolean().default(false),
});

// ============================================================
// CASE SCHEMAS
// ============================================================

const updateCaseStatusSchema = z.object({
  status: z.enum([
    'ASSIGNED', 'UNDER_REVIEW', 'AWAITING_CORRECTION', 'RESUBMITTED',
    'RESOLVED', 'REJECTED', 'ESCALATED', 'FALSE_POSITIVE', 'CLOSED_WITH_EXPLANATION'
  ]),
  reason: z.string().min(10, 'Please provide a reason (min 10 characters)'),
});

const addCommentSchema = z.object({
  content: z.string().min(1).max(2000),
  attachmentRef: z.string().optional(),
});

// ============================================================
// VERIFICATION SCHEMAS
// ============================================================

const createVerificationTokenSchema = z.object({
  studentId: z.string().uuid(),
  purpose: z.string().min(5).max(500),
  permittedFields: z.array(z.string()).min(1),
  expiresInDays: z.coerce.number().int().min(1).max(365).default(7),
  isSingleUse: z.boolean().default(false),
});

// ============================================================
// CAPACITY SIMULATION SCHEMAS
// ============================================================

const capacitySimulationSchema = z.object({
  institutionId: z.string().uuid(),
  programmeId: z.string().uuid(),
  academicYearId: z.string().uuid(),
  name: z.string().min(1).max(200),
  description: z.string().optional(),
  proposedAdmissions: z.object({
    GENERAL: z.coerce.number().int().min(0).default(0),
    OBC: z.coerce.number().int().min(0).default(0),
    SC: z.coerce.number().int().min(0).default(0),
    ST: z.coerce.number().int().min(0).default(0),
    EWS: z.coerce.number().int().min(0).default(0),
    NRI: z.coerce.number().int().min(0).default(0),
    OCI: z.coerce.number().int().min(0).default(0),
    FOREIGN_NATIONAL: z.coerce.number().int().min(0).default(0),
    SUPERNUMERARY: z.coerce.number().int().min(0).default(0),
  }),
});

module.exports = {
  validate,
  paginationSchema,
  uuidSchema,
  loginSchema,
  createUserSchema,
  createInstitutionSchema,
  createProgrammeSchema,
  createAcademicYearSchema,
  createIntakeConfigSchema,
  createEnrollmentSchema,
  updateCaseStatusSchema,
  addCommentSchema,
  createVerificationTokenSchema,
  capacitySimulationSchema,
};
