const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { parse } = require('csv-parse/sync');
const XLSX = require('xlsx');
const { v4: uuidv4 } = require('uuid');
const prisma = require('../utils/prisma');
const { validateApaarFormat, generateApaarHmac, maskApaar, encryptApaar, hashFile } = require('../utils/crypto');
const { createAuditEvent, auditContextFromReq } = require('../utils/audit');
const validationService = require('../services/validationService');

// ── File Upload Configuration ──────────────────────────────────────────────

const UPLOAD_DIR = path.join(__dirname, '../../uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => cb(null, `${uuidv4()}${path.extname(file.originalname)}`),
});

const ALLOWED_TYPES = [
  'text/csv', 'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
];

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!['.csv', '.xlsx', '.xls'].includes(ext)) {
      return cb(new Error('Only CSV and Excel files are allowed'));
    }
    cb(null, true);
  },
});

// ── REQUIRED COLUMNS ──────────────────────────────────────────────────────

const REQUIRED_COLUMNS = [
  'institution_student_id', 'first_name', 'last_name',
  'apaar_id', 'programme_code', 'admission_date', 'admission_category',
];

const OPTIONAL_COLUMNS = [
  'email', 'phone', 'is_nri', 'is_oci', 'is_foreign_national', 'is_supernumerary',
];

// ── Parse File to Rows ────────────────────────────────────────────────────

function parseFile(filePath, originalName) {
  const ext = path.extname(originalName).toLowerCase();

  if (ext === '.csv') {
    const content = fs.readFileSync(filePath, 'utf8');
    return parse(content, { columns: true, skip_empty_lines: true, trim: true });
  }

  // Excel
  const workbook = XLSX.readFile(filePath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  return XLSX.utils.sheet_to_json(sheet, { defval: '' });
}

// ── Validate a Single Row ─────────────────────────────────────────────────

async function validateRow(row, rowNumber, institutionId, programmeId, academicYearId) {
  const errors = [];
  const warnings = [];

  // Normalize keys to snake_case
  const normalized = Object.fromEntries(
    Object.entries(row).map(([k, v]) => [k.toLowerCase().replace(/\s+/g, '_').replace(/-/g, '_'), String(v || '').trim()])
  );

  // Required field checks
  for (const col of REQUIRED_COLUMNS) {
    if (!normalized[col] && col !== 'apaar_id') { // apaar_id can be missing (generates FMT-01)
      errors.push({ field: col, code: 'FMT-03', message: `Required field '${col}' is missing or empty` });
    }
  }

  if (errors.length > 0) return { status: 'REJECTED', errors, warnings, normalized };

  // APAAR format validation
  const apaarValidation = validateApaarFormat(normalized.apaar_id);
  if (normalized.apaar_id && !apaarValidation.valid) {
    errors.push({ field: 'apaar_id', code: 'FMT-02', message: 'APAAR ID must be 12 numeric digits or DEMO-APAAR-XXXXXX format' });
  }

  // Admission date
  const admissionDate = new Date(normalized.admission_date);
  if (isNaN(admissionDate)) {
    errors.push({ field: 'admission_date', code: 'FMT-03', message: 'Invalid admission date format. Use YYYY-MM-DD' });
  }

  // Admission category
  const validCategories = ['GENERAL', 'OBC', 'SC', 'ST', 'EWS', 'NRI', 'OCI', 'FOREIGN_NATIONAL', 'SUPERNUMERARY', 'OTHER'];
  const category = normalized.admission_category?.toUpperCase();
  if (category && !validCategories.includes(category)) {
    errors.push({ field: 'admission_category', code: 'FMT-03', message: `Invalid category. Must be one of: ${validCategories.join(', ')}` });
  }

  // Duplicate check within DB
  if (normalized.apaar_id && apaarValidation.valid) {
    const hmacToken = generateApaarHmac(normalized.apaar_id);
    const existingStudent = await prisma.student.findFirst({ where: { apaarHmacToken: hmacToken } });
    if (existingStudent) {
      warnings.push({ field: 'apaar_id', code: 'DUP-01', message: 'This APAAR identifier already exists in the database. Will be flagged for review.' });
    }
  }

  const status = errors.length > 0 ? 'REJECTED' : warnings.length > 0 ? 'FLAGGED' : 'ACCEPTED';
  return { status, errors, warnings, normalized };
}

// ── CONTROLLERS ───────────────────────────────────────────────────────────

/**
 * POST /api/import-jobs — upload file and create import job (dry-run)
 */
async function uploadImport(req, res, next) {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded', code: 'NO_FILE' });

    const { institutionId, academicYearId, programmeId } = req.body;
    if (!institutionId || !academicYearId || !programmeId) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: 'institutionId, academicYearId, and programmeId are required', code: 'MISSING_FIELDS' });
    }

    // Institution scope check
    if (req.institutionScope && req.institutionScope !== institutionId) {
      fs.unlinkSync(req.file.path);
      return res.status(403).json({ error: 'Access denied to this institution', code: 'FORBIDDEN' });
    }

    // Hash for idempotency
    const fileBuffer = fs.readFileSync(req.file.path);
    const fileHash = hashFile(fileBuffer);

    const existing = await prisma.dataImportJob.findFirst({
      where: { fileHash, institutionId, status: { in: ['COMMITTED', 'DRY_RUN_COMPLETE'] } },
    });
    if (existing) {
      fs.unlinkSync(req.file.path);
      return res.json({ job: existing, message: 'Identical file already imported', isDuplicate: true });
    }

    // Parse file
    let rows;
    try {
      rows = parseFile(req.file.path, req.file.originalname);
    } catch (parseErr) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: 'Failed to parse file: ' + parseErr.message, code: 'PARSE_ERROR' });
    }

    // Create import job
    const job = await prisma.dataImportJob.create({
      data: {
        institutionId,
        academicYearId,
        uploadedById: req.user.id,
        fileName: req.file.originalname,
        fileHash,
        fileSizeBytes: req.file.size,
        status: 'PROCESSING',
        totalRows: rows.length,
      },
    });

    // Validate all rows
    let accepted = 0, rejected = 0, flagged = 0;
    const rowResults = [];

    for (let i = 0; i < rows.length; i++) {
      const { status, errors, warnings, normalized } = await validateRow(
        rows[i], i + 1, institutionId, programmeId, academicYearId
      );

      if (status === 'ACCEPTED') accepted++;
      else if (status === 'REJECTED') rejected++;
      else if (status === 'FLAGGED') flagged++;

      rowResults.push({ jobId: job.id, rowNumber: i + 1, status, rawData: rows[i], errors, warnings });
    }

    // Batch insert row results
    await prisma.importRowResult.createMany({ data: rowResults });

    // Update job
    await prisma.dataImportJob.update({
      where: { id: job.id },
      data: {
        status: 'DRY_RUN_COMPLETE',
        acceptedRows: accepted,
        rejectedRows: rejected,
        flaggedRows: flagged,
        errorSummary: { total: rows.length, accepted, rejected, flagged },
      },
    });

    const updatedJob = await prisma.dataImportJob.findUnique({ where: { id: job.id } });

    await createAuditEvent({
      ...auditContextFromReq(req),
      action: 'IMPORT_UPLOADED',
      entityType: 'DataImportJob',
      entityId: job.id,
      diff: { after: { fileName: req.file.originalname, totalRows: rows.length, accepted, rejected } },
    });

    // Clean up temp file
    fs.unlinkSync(req.file.path);

    res.status(201).json({ job: updatedJob });
  } catch (err) {
    if (req.file?.path && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    next(err);
  }
}

/**
 * POST /api/import-jobs/:id/commit — commit accepted/flagged rows after user confirmation
 */
async function commitImport(req, res, next) {
  try {
    const job = await prisma.dataImportJob.findUnique({
      where: { id: req.params.id },
      include: { rows: true, academicYear: true },
    });

    if (!job) return res.status(404).json({ error: 'Import job not found', code: 'NOT_FOUND' });
    if (job.status !== 'DRY_RUN_COMPLETE') {
      return res.status(400).json({ error: 'Job must be in DRY_RUN_COMPLETE status to commit', code: 'INVALID_STATE' });
    }

    // Scope check
    if (req.institutionScope && job.institutionId !== req.institutionScope) {
      return res.status(403).json({ error: 'Access denied', code: 'FORBIDDEN' });
    }

    const { programmeId } = req.body;
    if (!programmeId) return res.status(400).json({ error: 'programmeId required', code: 'MISSING_FIELD' });

    const acceptedRows = job.rows.filter((r) => ['ACCEPTED', 'FLAGGED'].includes(r.status));
    let committed = 0;

    await prisma.$transaction(async (tx) => {
      for (const row of acceptedRows) {
        const data = row.rawData;
        const norm = Object.fromEntries(
          Object.entries(data).map(([k, v]) => [k.toLowerCase().replace(/\s+/g, '_').replace(/-/g, '_'), String(v || '').trim()])
        );

        const apaarId = norm.apaar_id;
        const apaarValidation = validateApaarFormat(apaarId);
        const apaarHmacToken = apaarId && apaarValidation.valid ? generateApaarHmac(apaarId) : null;

        let apaarStatus = 'MISSING';
        if (apaarId) {
          apaarStatus = apaarValidation.valid ? 'LOCAL_ACCEPTED' : 'INVALID_FORMAT';
          if (apaarHmacToken) {
            const dup = await tx.student.findFirst({ where: { apaarHmacToken } });
            if (dup) apaarStatus = 'POTENTIAL_DUPLICATE';
          }
        }

        const student = await tx.student.create({
          data: {
            apaarStatus,
            apaarEncrypted: apaarId && apaarValidation.valid ? encryptApaar(apaarId) : null,
            apaarHmacToken,
            apaarMasked: apaarId ? maskApaar(apaarId) : null,
            apaarIsDemoMode: apaarValidation.isDemoMode || false,
          },
        });

        const enrollment = await tx.enrollment.create({
          data: {
            studentId: student.id,
            institutionId: job.institutionId,
            academicYearId: job.academicYearId,
            programmeId,
            institutionStudentId: norm.institution_student_id,
            firstName: norm.first_name,
            lastName: norm.last_name,
            email: norm.email || null,
            phone: norm.phone || null,
            admissionDate: new Date(norm.admission_date),
            admissionCategory: (norm.admission_category || 'GENERAL').toUpperCase(),
            isNri: ['true', '1', 'yes'].includes((norm.is_nri || '').toLowerCase()),
            isOci: ['true', '1', 'yes'].includes((norm.is_oci || '').toLowerCase()),
            isForeignNational: ['true', '1', 'yes'].includes((norm.is_foreign_national || '').toLowerCase()),
            isSupernumerary: ['true', '1', 'yes'].includes((norm.is_supernumerary || '').toLowerCase()),
            sourceBatchId: job.id,
            provenance: 'CSV_UPLOAD',
          },
        });

        await tx.importRowResult.update({
          where: { id: row.id },
          data: { enrollmentId: enrollment.id },
        });

        committed++;
      }

      await tx.dataImportJob.update({
        where: { id: job.id },
        data: { status: 'COMMITTED', committedAt: new Date() },
      });
    });

    // Run validation on all committed enrollments async
    const committedEnrollments = await prisma.importRowResult.findMany({
      where: { jobId: job.id, enrollmentId: { not: null } },
      select: { enrollmentId: true },
    });

    for (const r of committedEnrollments) {
      validationService.runValidation(r.enrollmentId, req.user.id).catch(() => {});
    }

    await createAuditEvent({
      ...auditContextFromReq(req),
      action: 'IMPORT_COMMITTED',
      entityType: 'DataImportJob',
      entityId: job.id,
      diff: { after: { committed, programmeId } },
    });

    res.json({ message: `Successfully committed ${committed} records`, committed });
  } catch (err) { next(err); }
}

/**
 * GET /api/import-jobs
 */
async function listImportJobs(req, res, next) {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const skip = (page - 1) * limit;

    const where = {};
    if (req.institutionScope) where.institutionId = req.institutionScope;
    if (status) where.status = status;

    const [jobs, total] = await Promise.all([
      prisma.dataImportJob.findMany({
        where, skip: Number(skip), take: Number(limit),
        include: {
          institution: { select: { id: true, name: true } },
          academicYear: { select: { id: true, label: true } },
          uploadedBy: { select: { id: true, firstName: true, lastName: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.dataImportJob.count({ where }),
    ]);

    res.json({ jobs, total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / limit) });
  } catch (err) { next(err); }
}

/**
 * GET /api/import-jobs/:id
 */
async function getImportJob(req, res, next) {
  try {
    const job = await prisma.dataImportJob.findUnique({
      where: { id: req.params.id },
      include: {
        institution: { select: { id: true, name: true } },
        academicYear: { select: { id: true, label: true } },
        uploadedBy: { select: { id: true, firstName: true, lastName: true } },
        _count: { select: { rows: true } },
      },
    });
    if (!job) return res.status(404).json({ error: 'Job not found', code: 'NOT_FOUND' });
    if (req.institutionScope && job.institutionId !== req.institutionScope) {
      return res.status(403).json({ error: 'Access denied', code: 'FORBIDDEN' });
    }
    res.json({ job });
  } catch (err) { next(err); }
}

/**
 * GET /api/import-jobs/:id/rows
 */
async function getImportRows(req, res, next) {
  try {
    const { page = 1, limit = 50, status } = req.query;
    const skip = (page - 1) * limit;

    const job = await prisma.dataImportJob.findUnique({ where: { id: req.params.id } });
    if (!job) return res.status(404).json({ error: 'Job not found', code: 'NOT_FOUND' });
    if (req.institutionScope && job.institutionId !== req.institutionScope) {
      return res.status(403).json({ error: 'Access denied', code: 'FORBIDDEN' });
    }

    const where = { jobId: req.params.id };
    if (status) where.status = status;

    const [rows, total] = await Promise.all([
      prisma.importRowResult.findMany({
        where, skip: Number(skip), take: Number(limit),
        orderBy: { rowNumber: 'asc' },
      }),
      prisma.importRowResult.count({ where }),
    ]);

    res.json({ rows, total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / limit) });
  } catch (err) { next(err); }
}

/**
 * GET /api/import-jobs/template — download sample CSV
 */
function downloadTemplate(req, res) {
  const headers = [...REQUIRED_COLUMNS, ...OPTIONAL_COLUMNS].join(',');
  const sampleRow = [
    'STUD-001', 'Arjun', 'Sharma', 'DEMO-APAAR-000001', 'CSE', '2025-07-15', 'GENERAL',
    'arjun@demo.edu', '9876543210', 'false', 'false', 'false', 'false',
  ].join(',');

  const csv = `${headers}\n${sampleRow}\n`;
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=edutrace_import_template.csv');
  res.send(csv);
}

module.exports = { upload, uploadImport, commitImport, listImportJobs, getImportJob, getImportRows, downloadTemplate };
