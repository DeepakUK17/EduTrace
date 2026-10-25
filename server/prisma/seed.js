const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const { generateApaarHmac, encryptApaar, maskApaar, generateVerificationTokenRef, hashTokenRef } = require('../src/utils/crypto');

const prisma = new PrismaClient();

async function main() {
  console.log('--- Seeding EduTrace Database (SIH 2026 - PS 26263) ---');

  // 1. Clean existing records in reverse dependency order
  console.log('Clearing existing data...');
  await prisma.auditEvent.deleteMany();
  await prisma.exceptionComment.deleteMany();
  await prisma.caseStatusHistory.deleteMany();
  await prisma.exceptionCase.deleteMany();
  await prisma.duplicateMatch.deleteMany();
  await prisma.validationIssue.deleteMany();
  await prisma.importRowResult.deleteMany();
  await prisma.dataImportJob.deleteMany();
  await prisma.verificationRequest.deleteMany();
  await prisma.consentRecord.deleteMany();
  await prisma.enrollment.deleteMany();
  await prisma.student.deleteMany();
  await prisma.intakeConfiguration.deleteMany();
  await prisma.capacityScenario.deleteMany();
  await prisma.programme.deleteMany();
  await prisma.institution.deleteMany();
  await prisma.academicYear.deleteMany();
  await prisma.validationRule.deleteMany();
  await prisma.integrationJob.deleteMany();
  await prisma.integrationConnector.deleteMany();
  await prisma.user.deleteMany();

  // 2. Academic Years
  console.log('Creating Academic Years...');
  const ay2024 = await prisma.academicYear.create({
    data: {
      label: '2024-25',
      startDate: new Date('2024-07-01'),
      endDate: new Date('2025-06-30'),
      status: 'ACTIVE',
    },
  });

  const ay2025 = await prisma.academicYear.create({
    data: {
      label: '2025-26',
      startDate: new Date('2025-07-01'),
      endDate: new Date('2026-06-30'),
      status: 'ACTIVE',
    },
  });

  // 3. Institutions
  console.log('Creating Institutions...');
  const instAIT = await prisma.institution.create({
    data: {
      name: 'Apex Institute of Technology',
      code: 'AIT-DEL',
      type: 'Engineering & Technology',
      address: 'Institutional Area, Sector 62',
      city: 'New Delhi',
      state: 'Delhi',
      pincode: '110001',
      aicteCode: '1-10023451',
      website: 'https://apextech.demo.edu',
      status: 'ACTIVE',
    },
  });

  const instBCE = await prisma.institution.create({
    data: {
      name: 'Bharat College of Engineering',
      code: 'BCE-MUM',
      type: 'Engineering',
      address: 'Vidyanagari, Kalina',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400098',
      aicteCode: '1-20034562',
      website: 'https://bharateng.demo.edu',
      status: 'ACTIVE',
    },
  });

  const instCUT = await prisma.institution.create({
    data: {
      name: 'Chanakya University of Technology',
      code: 'CUT-BLR',
      type: 'University Faculty',
      address: 'Electronic City Phase 1',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '560100',
      aicteCode: '1-30045673',
      website: 'https://chanakyatech.demo.edu',
      status: 'ACTIVE',
    },
  });

  const instDIAS = await prisma.institution.create({
    data: {
      name: 'Delhi Institute of Advanced Studies',
      code: 'DIAS-DEL',
      type: 'Management & Computer Applications',
      address: 'Rohini Sector 25',
      city: 'New Delhi',
      state: 'Delhi',
      pincode: '110085',
      aicteCode: '1-40056784',
      website: 'https://dias.demo.edu',
      status: 'ACTIVE',
    },
  });

  // 4. Programmes
  console.log('Creating Programmes...');
  const progAitCse = await prisma.programme.create({
    data: {
      institutionId: instAIT.id,
      name: 'Computer Science & Engineering',
      code: 'CSE',
      level: 'UNDERGRADUATE',
      duration: 4,
      status: 'ACTIVE',
    },
  });

  const progAitEce = await prisma.programme.create({
    data: {
      institutionId: instAIT.id,
      name: 'Electronics & Communication Engineering',
      code: 'ECE',
      level: 'UNDERGRADUATE',
      duration: 4,
      status: 'ACTIVE',
    },
  });

  const progAitMba = await prisma.programme.create({
    data: {
      institutionId: instAIT.id,
      name: 'Master of Business Administration',
      code: 'MBA',
      level: 'POSTGRADUATE',
      duration: 2,
      status: 'ACTIVE',
    },
  });

  const progBceCse = await prisma.programme.create({
    data: {
      institutionId: instBCE.id,
      name: 'Computer Science & Engineering',
      code: 'CSE',
      level: 'UNDERGRADUATE',
      duration: 4,
      status: 'ACTIVE',
    },
  });

  const progBceMca = await prisma.programme.create({
    data: {
      institutionId: instBCE.id,
      name: 'Master of Computer Applications',
      code: 'MCA',
      level: 'POSTGRADUATE',
      duration: 2,
      status: 'ACTIVE',
    },
  });

  // 5. Intake Configurations
  console.log('Creating Intake Configurations...');
  await prisma.intakeConfiguration.create({
    data: {
      institutionId: instAIT.id,
      programmeId: progAitCse.id,
      academicYearId: ay2025.id,
      approvedIntake: 60,
      supernumeraryAllowance: 9,
      nriLimit: 3,
      ociLimit: 3,
      foreignNationalLimit: 3,
      ewsReservation: 6,
      scReservation: 9,
      stReservation: 5,
      obcReservation: 16,
      ruleVersion: 'v1.0',
      isActive: true,
      publishedAt: new Date(),
    },
  });

  await prisma.intakeConfiguration.create({
    data: {
      institutionId: instAIT.id,
      programmeId: progAitEce.id,
      academicYearId: ay2025.id,
      approvedIntake: 60,
      supernumeraryAllowance: 9,
      nriLimit: 3,
      ociLimit: 3,
      foreignNationalLimit: 3,
      ruleVersion: 'v1.0',
      isActive: true,
      publishedAt: new Date(),
    },
  });

  await prisma.intakeConfiguration.create({
    data: {
      institutionId: instAIT.id,
      programmeId: progAitMba.id,
      academicYearId: ay2025.id,
      approvedIntake: 30,
      supernumeraryAllowance: 4,
      nriLimit: 1,
      ociLimit: 1,
      foreignNationalLimit: 2,
      ruleVersion: 'v1.0',
      isActive: true,
      publishedAt: new Date(),
    },
  });

  await prisma.intakeConfiguration.create({
    data: {
      institutionId: instBCE.id,
      programmeId: progBceCse.id,
      academicYearId: ay2025.id,
      approvedIntake: 60,
      supernumeraryAllowance: 9,
      ruleVersion: 'v1.0',
      isActive: true,
      publishedAt: new Date(),
    },
  });

  // Historical (2024-25) for YOY intelligence
  await prisma.intakeConfiguration.create({
    data: {
      institutionId: instAIT.id,
      programmeId: progAitCse.id,
      academicYearId: ay2024.id,
      approvedIntake: 60,
      ruleVersion: 'v1.0',
      isActive: true,
    },
  });

  // 6. Validation Rules
  console.log('Creating Validation Rules...');
  const rules = [
    {
      code: 'FMT-01',
      version: 'v1.0',
      name: 'APAAR Identifier Missing',
      description: 'Student record lacks an APAAR or ABC academic identity token.',
      layer: 1,
      severity: 'MEDIUM',
      category: 'FORMAT',
      logic: 'apaarStatus == MISSING or apaarHmacToken == null',
      recommendedAction: 'Obtain student APAAR ID from Academic Bank of Credits and update record.',
    },
    {
      code: 'FMT-02',
      version: 'v1.0',
      name: 'APAAR Identifier Invalid Format',
      description: 'APAAR ID does not conform to 12-digit numeric or DEMO-APAAR format specification.',
      layer: 1,
      severity: 'HIGH',
      category: 'FORMAT',
      logic: 'Regex match failure against ^[0-9]{12}$ and ^DEMO-APAAR-[A-Za-z0-9]{6,}$',
      recommendedAction: 'Verify correct 12-digit APAAR number with student identity document.',
    },
    {
      code: 'FMT-03',
      version: 'v1.0',
      name: 'Required Field Missing',
      description: 'Essential student profile fields (e.g. admission date, category) are missing.',
      layer: 1,
      severity: 'HIGH',
      category: 'FORMAT',
      logic: 'Null or empty values in mandatory schema attributes',
      recommendedAction: 'Update missing demographic or academic fields.',
    },
    {
      code: 'CON-01',
      version: 'v1.0',
      name: 'Programme/Year Academic Mismatch',
      description: 'Admission date outside permissible academic session window.',
      layer: 2,
      severity: 'MEDIUM',
      category: 'CONSISTENCY',
      logic: 'admissionDate < academicYear.startDate or admissionDate > academicYear.endDate',
      recommendedAction: 'Verify admission date with institutional admission register.',
    },
    {
      code: 'DUP-01',
      version: 'v1.0',
      name: 'Intra-Institution Duplicate Record',
      description: 'Same APAAR HMAC identity token found multiple times within the same institution.',
      layer: 3,
      severity: 'HIGH',
      category: 'DUPLICATE',
      logic: 'Match on apaarHmacToken within same institutionId',
      recommendedAction: 'Review duplicate entries in Duplicate Review Workbench.',
    },
    {
      code: 'DUP-02',
      version: 'v1.0',
      name: 'Cross-Institution Duplicate Enrolment',
      description: 'Student appears actively enrolled concurrently in two distinct AICTE approved institutions.',
      layer: 3,
      severity: 'CRITICAL',
      category: 'DUPLICATE',
      logic: 'Match on apaarHmacToken across distinct institutionIds with status=ACTIVE',
      recommendedAction: 'Escalate to AICTE Regulation Bureau for transfer or dual-enrolment review.',
    },
    {
      code: 'CAP-01',
      version: 'v1.0',
      name: 'Approved Intake Capacity Exceeded',
      description: 'Active enrolments in programme exceed AICTE approved intake limit.',
      layer: 3,
      severity: 'CRITICAL',
      category: 'CAPACITY',
      logic: 'activeCount > approvedIntake',
      recommendedAction: 'Audit admissions against sanctioned quota; remove unapproved seats.',
    },
    {
      code: 'CAP-02',
      version: 'v1.0',
      name: 'NRI/OCI Quota Exceeded',
      description: 'Enrolments under NRI or OCI category exceed statutory sub-limits.',
      layer: 3,
      severity: 'HIGH',
      category: 'CAPACITY',
      logic: 'nriCount > nriLimit or ociCount > ociLimit',
      recommendedAction: 'Verify NRI eligibility certificates and adjust admissions.',
    },
    {
      code: 'CAP-03',
      version: 'v1.0',
      name: 'Supernumerary Allowance Exceeded',
      description: 'Total supernumerary admissions exceed permissible 15% allowance.',
      layer: 3,
      severity: 'HIGH',
      category: 'CAPACITY',
      logic: 'supernumeraryCount > supernumeraryAllowance',
      recommendedAction: 'Verify AICTE approval letter for supernumerary sanction.',
    },
    {
      code: 'YOY-01',
      version: 'v1.0',
      name: 'Unexpected Year-over-Year Enrolment Drop',
      description: 'Programme shows zero or steep enrolment decline without AICTE closure notice.',
      layer: 3,
      severity: 'LOW',
      category: 'CONSISTENCY',
      logic: 'currentCount == 0 and priorCount > 0',
      recommendedAction: 'Check if programme is under moratorium or discontinued.',
    },
    {
      code: 'YOY-02',
      version: 'v1.0',
      name: 'Significant Variance in Student Intake',
      description: 'Intake changed by greater than 30% from preceding academic baseline.',
      layer: 3,
      severity: 'INFORMATIONAL',
      category: 'CONSISTENCY',
      logic: 'abs(diff / priorCount) > 0.3',
      recommendedAction: 'Inspect institutional admission trends.',
    },
  ];

  const dbRules = {};
  for (const r of rules) {
    dbRules[r.code] = await prisma.validationRule.create({ data: r });
  }

  // 7. Users
  console.log('Creating Demo Users...');
  const userAdmin = await prisma.user.create({
    data: {
      email: 'admin@edutrace.demo',
      passwordHash: await bcrypt.hash('Demo@Admin1', 10),
      firstName: 'Rajesh',
      lastName: 'Kumar',
      role: 'PLATFORM_ADMIN',
      status: 'ACTIVE',
    },
  });

  const userInstAdmin = await prisma.user.create({
    data: {
      email: 'inst.admin@apextech.demo',
      passwordHash: await bcrypt.hash('Demo@Inst1', 10),
      firstName: 'Dr. Sunita',
      lastName: 'Verma',
      role: 'INSTITUTION_ADMIN',
      institutionId: instAIT.id,
      status: 'ACTIVE',
    },
  });

  const userOperator = await prisma.user.create({
    data: {
      email: 'operator@apextech.demo',
      passwordHash: await bcrypt.hash('Demo@Oper1', 10),
      firstName: 'Amit',
      lastName: 'Patel',
      role: 'DATA_OPERATOR',
      institutionId: instAIT.id,
      status: 'ACTIVE',
    },
  });

  const userVerifier = await prisma.user.create({
    data: {
      email: 'verifier@edutrace.demo',
      passwordHash: await bcrypt.hash('Demo@Verif1', 10),
      firstName: 'Priya',
      lastName: 'Nair',
      role: 'VERIFIER',
      status: 'ACTIVE',
    },
  });

  const userStudent = await prisma.user.create({
    data: {
      email: 'student@apextech.demo',
      passwordHash: await bcrypt.hash('Demo@Stud1', 10),
      firstName: 'Arjun',
      lastName: 'Sharma',
      role: 'STUDENT',
      institutionId: instAIT.id,
      status: 'ACTIVE',
    },
  });

  // 8. Integration Connectors
  console.log('Creating Integration Connectors (Simulated Adapters)...');
  const connApaar = await prisma.integrationConnector.create({
    data: {
      name: 'APAAR_ABC',
      type: 'APAAR_ABC',
      mode: 'SIMULATED',
      status: 'HEALTHY',
      lastAttemptAt: new Date(),
      lastSuccessAt: new Date(),
    },
  });

  const connErp = await prisma.integrationConnector.create({
    data: {
      name: 'INSTITUTION_ERP',
      type: 'INSTITUTION_ERP',
      mode: 'SIMULATED',
      status: 'HEALTHY',
      lastAttemptAt: new Date(),
      lastSuccessAt: new Date(),
    },
  });

  const connAicte = await prisma.integrationConnector.create({
    data: {
      name: 'AICTE',
      type: 'AICTE',
      mode: 'SIMULATED',
      status: 'HEALTHY',
      lastAttemptAt: new Date(),
      lastSuccessAt: new Date(),
    },
  });

  // Seed a sample integration job
  await prisma.integrationJob.create({
    data: {
      connectorId: connApaar.id,
      jobType: 'HEALTH_CHECK',
      idempotencyKey: 'init-apaar-check-001',
      status: 'SUCCESS',
      attempts: 1,
      responseMeta: { result: 'SYNTHETIC_HEARTBEAT_ACK', latencyMs: 38 },
    },
  });

  // 9. Students and Enrollments (Synthetic Records)
  console.log('Creating Synthetic Students and Enrollments...');

  const firstNames = ['Aarav', 'Vivaan', 'Aditya', 'Vihaan', 'Arjun', 'Sai', 'Reyansh', 'Ayaan', 'Krishna', 'Ishaan', 'Diya', 'Saanvi', 'Ananya', 'Aadhya', 'Pari', 'Avani', 'Myra', 'Ira', 'Anika', 'Meera', 'Rohan', 'Kavya', 'Sneha', 'Tanvi', 'Dev'];
  const lastNames = ['Sharma', 'Verma', 'Patel', 'Singh', 'Kumar', 'Reddy', 'Chopra', 'Gupta', 'Iyer', 'Deshmukh', 'Mehta', 'Joshi', 'Bose', 'Rao', 'Nair'];

  // Helper to create synthetic student + enrollment
  async function createSyntheticStudent({
    apaarNumber,
    firstName,
    lastName,
    instId,
    progId,
    ayId,
    category = 'GENERAL',
    isNri = false,
    isOci = false,
    isSupernumerary = false,
    admissionDate = new Date('2025-07-20'),
    rollNo,
    apaarStatusOverride,
  }) {
    let apaarStatus = 'LOCAL_ACCEPTED';
    let apaarHmacToken = null;
    let apaarMasked = null;
    let apaarEncrypted = null;

    if (!apaarNumber) {
      apaarStatus = 'MISSING';
    } else if (apaarNumber.includes('INVALID')) {
      apaarStatus = 'INVALID_FORMAT';
      apaarMasked = apaarNumber;
    } else {
      apaarHmacToken = generateApaarHmac(apaarNumber);
      apaarMasked = maskApaar(apaarNumber);
      apaarEncrypted = encryptApaar(apaarNumber);
      apaarStatus = apaarStatusOverride || 'LOCAL_ACCEPTED';
    }

    const student = await prisma.student.create({
      data: {
        apaarStatus,
        apaarHmacToken,
        apaarMasked,
        apaarEncrypted,
        apaarIsDemoMode: true,
      },
    });

    const enrollment = await prisma.enrollment.create({
      data: {
        studentId: student.id,
        institutionId: instId,
        programmeId: progId,
        academicYearId: ayId,
        institutionStudentId: rollNo,
        firstName,
        lastName,
        email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@demo.edu`,
        phone: `98765${Math.floor(10000 + Math.random() * 90000)}`,
        admissionDate,
        admissionCategory: category,
        isNri,
        isOci,
        isSupernumerary,
        status: 'ACTIVE',
        provenance: 'SYNTHETIC_SEED',
      },
    });

    return { student, enrollment };
  }

  // 9a. Normal cohort for AIT CSE (approx 45 students)
  const aitCseStudents = [];
  for (let i = 1; i <= 45; i++) {
    const fn = firstNames[i % firstNames.length];
    const ln = lastNames[(i * 3) % lastNames.length];
    const apaar = `DEMO-APAAR-${String(i).padStart(6, '0')}`;
    const res = await createSyntheticStudent({
      apaarNumber: apaar,
      firstName: fn,
      lastName: ln,
      instId: instAIT.id,
      progId: progAitCse.id,
      ayId: ay2025.id,
      rollNo: `AIT-25-CSE-${String(i).padStart(3, '0')}`,
    });
    aitCseStudents.push(res);
  }

  // 9b. NRI and Supernumerary cohort in AIT CSE (4 students - pushes NRI near limit)
  for (let i = 1; i <= 3; i++) {
    await createSyntheticStudent({
      apaarNumber: `DEMO-APAAR-NRI${String(i).padStart(3, '0')}`,
      firstName: 'Kabir',
      lastName: `Overseas${i}`,
      instId: instAIT.id,
      progId: progAitCse.id,
      ayId: ay2025.id,
      category: 'NRI',
      isNri: true,
      rollNo: `AIT-25-CSE-NRI${i}`,
    });
  }

  // 9c. Intentional Missing APAAR cases (FMT-01)
  const missing1 = await createSyntheticStudent({
    apaarNumber: null,
    firstName: 'Suresh',
    lastName: 'Choudhary',
    instId: instAIT.id,
    progId: progAitCse.id,
    ayId: ay2025.id,
    rollNo: 'AIT-25-CSE-091',
  });

  const missing2 = await createSyntheticStudent({
    apaarNumber: null,
    firstName: 'Pooja',
    lastName: 'Reddy',
    instId: instAIT.id,
    progId: progAitEce.id,
    ayId: ay2025.id,
    rollNo: 'AIT-25-ECE-042',
  });

  // Attach validation issue to missing1
  await prisma.validationIssue.create({
    data: {
      enrollmentId: missing1.enrollment.id,
      ruleId: dbRules['FMT-01'].id,
      ruleVersion: 'v1.0',
      severity: 'MEDIUM',
      status: 'OPEN',
      fieldsAffected: ['apaarId'],
      evidence: { value: null, expected: '12-digit APAAR ID or DEMO-APAAR-XXXXXX' },
      explanation: 'No APAAR academic identifier has been provided for this student record. An APAAR ID is required for academic credit linkage.',
      recommendedAction: 'Obtain the student\'s APAAR ID from the Academic Bank of Credits and update the record.',
    },
  });

  // 9d. Intentional Invalid APAAR format (FMT-02)
  const invalid1 = await createSyntheticStudent({
    apaarNumber: 'DEMO-INVALID-99',
    firstName: 'Naveen',
    lastName: 'Saxena',
    instId: instAIT.id,
    progId: progAitCse.id,
    ayId: ay2025.id,
    rollNo: 'AIT-25-CSE-092',
  });

  await prisma.validationIssue.create({
    data: {
      enrollmentId: invalid1.enrollment.id,
      ruleId: dbRules['FMT-02'].id,
      ruleVersion: 'v1.0',
      severity: 'HIGH',
      status: 'OPEN',
      fieldsAffected: ['apaarId'],
      evidence: { value: 'DEMO-INVALID-99', expected: '12 numeric digits OR DEMO-APAAR-XXXXXX' },
      explanation: 'The provided APAAR identifier does not match the expected 12-digit format.',
      recommendedAction: 'Verify the APAAR ID from the official APAAR portal and re-enter.',
    },
  });

  // 9e. Intentional Cross-Institution Duplicate (DUP-02):
  // Student "Rahul Sharma" with same APAAR enrolled at both AIT (CSE) and BCE (CSE)
  const sharedApaar = 'DEMO-APAAR-DUP999';
  const sharedHmac = generateApaarHmac(sharedApaar);

  const studentA = await prisma.student.create({
    data: {
      apaarStatus: 'POTENTIAL_DUPLICATE',
      apaarHmacToken: sharedHmac,
      apaarMasked: maskApaar(sharedApaar),
      apaarEncrypted: encryptApaar(sharedApaar),
      apaarIsDemoMode: true,
    },
  });

  const enrollA = await prisma.enrollment.create({
    data: {
      studentId: studentA.id,
      institutionId: instAIT.id,
      programmeId: progAitCse.id,
      academicYearId: ay2025.id,
      institutionStudentId: 'AIT-25-CSE-DUP1',
      firstName: 'Rahul',
      lastName: 'Sharma',
      email: 'rahul.sharma@ait.demo.edu',
      phone: '9811223344',
      admissionDate: new Date('2025-07-15'),
      admissionCategory: 'GENERAL',
      status: 'ACTIVE',
      provenance: 'SYNTHETIC_SEED',
    },
  });

  const studentB = await prisma.student.create({
    data: {
      apaarStatus: 'POTENTIAL_DUPLICATE',
      apaarHmacToken: sharedHmac,
      apaarMasked: maskApaar(sharedApaar),
      apaarEncrypted: encryptApaar(sharedApaar),
      apaarIsDemoMode: true,
    },
  });

  const enrollB = await prisma.enrollment.create({
    data: {
      studentId: studentB.id,
      institutionId: instBCE.id,
      programmeId: progBceCse.id,
      academicYearId: ay2025.id,
      institutionStudentId: 'BCE-25-CSE-DUP2',
      firstName: 'Rahul',
      lastName: 'Sharma',
      email: 'rahul.s@bce.demo.edu',
      phone: '9811223344',
      admissionDate: new Date('2025-07-28'),
      admissionCategory: 'GENERAL',
      status: 'ACTIVE',
      provenance: 'SYNTHETIC_SEED',
    },
  });

  // Create DuplicateMatch record
  await prisma.duplicateMatch.create({
    data: {
      recordAId: studentA.id,
      recordBId: studentB.id,
      matchType: 'CROSS_INSTITUTION_EXACT',
      matchScore: 1.0,
      evidence: {
        matchedFields: ['apaarHmacToken', 'firstName', 'lastName'],
        institutionA: instAIT.name,
        institutionB: instBCE.name,
        apaarMasked: maskApaar(sharedApaar),
      },
      disposition: 'PENDING_REVIEW',
      isCrossInstitution: true,
    },
  });

  // Attach DUP-02 validation issue
  await prisma.validationIssue.create({
    data: {
      enrollmentId: enrollA.id,
      ruleId: dbRules['DUP-02'].id,
      ruleVersion: 'v1.0',
      severity: 'CRITICAL',
      status: 'OPEN',
      fieldsAffected: ['apaarHmacToken', 'institutionId'],
      evidence: {
        duplicateWith: instBCE.name,
        otherRollNo: 'BCE-25-CSE-DUP2',
        studentName: 'Rahul Sharma',
      },
      explanation: 'Potential cross-institution duplicate enrolment detected: Same APAAR identity token is active at both Apex Institute of Technology and Bharat College of Engineering.',
      recommendedAction: 'Review in Duplicate Workbench; confirm if legitimate transfer or unauthorized dual enrolment.',
    },
  });

  // 9f. Intentional Intra-Institution Duplicate (DUP-01):
  // Two records in AIT with same APAAR
  const intraApaar = 'DEMO-APAAR-INTRA88';
  const intraHmac = generateApaarHmac(intraApaar);

  const studentIntra1 = await prisma.student.create({
    data: {
      apaarStatus: 'POTENTIAL_DUPLICATE',
      apaarHmacToken: intraHmac,
      apaarMasked: maskApaar(intraApaar),
      apaarEncrypted: encryptApaar(intraApaar),
      apaarIsDemoMode: true,
    },
  });

  const enrollIntra1 = await prisma.enrollment.create({
    data: {
      studentId: studentIntra1.id,
      institutionId: instAIT.id,
      programmeId: progAitMba.id,
      academicYearId: ay2025.id,
      institutionStudentId: 'AIT-25-MBA-015',
      firstName: 'Deepak',
      lastName: 'Malhotra',
      admissionDate: new Date('2025-07-22'),
      status: 'ACTIVE',
      provenance: 'SYNTHETIC_SEED',
    },
  });

  const studentIntra2 = await prisma.student.create({
    data: {
      apaarStatus: 'POTENTIAL_DUPLICATE',
      apaarHmacToken: intraHmac,
      apaarMasked: maskApaar(intraApaar),
      apaarEncrypted: encryptApaar(intraApaar),
      apaarIsDemoMode: true,
    },
  });

  const enrollIntra2 = await prisma.enrollment.create({
    data: {
      studentId: studentIntra2.id,
      institutionId: instAIT.id,
      programmeId: progAitMba.id,
      academicYearId: ay2025.id,
      institutionStudentId: 'AIT-25-MBA-028',
      firstName: 'Deepak',
      lastName: 'Malhotra',
      admissionDate: new Date('2025-07-25'),
      status: 'ACTIVE',
      provenance: 'SYNTHETIC_SEED',
    },
  });

  await prisma.duplicateMatch.create({
    data: {
      recordAId: studentIntra1.id,
      recordBId: studentIntra2.id,
      matchType: 'EXACT_IDENTIFIER',
      matchScore: 1.0,
      evidence: {
        matchedFields: ['apaarHmacToken'],
        institution: instAIT.name,
        apaarMasked: maskApaar(intraApaar),
      },
      disposition: 'PENDING_REVIEW',
      isCrossInstitution: false,
    },
  });

  // 10. Exception Cases
  console.log('Creating Exception Cases...');
  const case1 = await prisma.exceptionCase.create({
    data: {
      type: 'CROSS_INSTITUTION_CONFLICT',
      severity: 'CRITICAL',
      status: 'ASSIGNED',
      enrollmentId: enrollA.id,
      title: 'Simultaneous Active Enrolment in AIT and BCE',
      description: 'Student Rahul Sharma has matching APAAR hash token in Apex Institute (CSE) and Bharat College (CSE). Dual full-time degree violates AICTE regulations.',
      assignedToId: userAdmin.id,
      createdById: userAdmin.id,
      dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      evidence: {
        recordA: enrollA.id,
        recordB: enrollB.id,
        apaarMasked: maskApaar(sharedApaar),
      },
    },
  });

  await prisma.exceptionComment.create({
    data: {
      caseId: case1.id,
      authorId: userAdmin.id,
      content: 'Contacted Bharat College registrar to verify whether student initiated migration or transfer certificate.',
    },
  });

  const case2 = await prisma.exceptionCase.create({
    data: {
      type: 'MISSING_IDENTIFIER',
      severity: 'MEDIUM',
      status: 'UNDER_REVIEW',
      enrollmentId: missing1.enrollment.id,
      title: 'Missing APAAR ID for Enrolled Student',
      description: 'Student Suresh Choudhary admitted without APAAR ID. 30-day onboarding window expiring.',
      assignedToId: userInstAdmin.id,
      createdById: userOperator.id,
      dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
    },
  });

  // 11. Verification Tokens
  console.log('Creating Verification Tokens...');
  const demoTokenRef = 'demo-verify-ref-2026';
  await prisma.verificationRequest.create({
    data: {
      tokenRef: demoTokenRef,
      tokenHash: hashTokenRef(demoTokenRef),
      studentId: aitCseStudents[0].student.id,
      createdById: userInstAdmin.id,
      purpose: 'Employment Verification — Tata Consultancy Services',
      permittedFields: ['name', 'institution', 'programme', 'academicYear', 'apaarStatus', 'apaarMasked', 'enrollmentStatus', 'verificationNote'],
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      status: 'ACTIVE',
      isSingleUse: false,
    },
  });

  // Expired token for verifier dashboard testing
  const expiredTokenRef = 'demo-expired-ref-2025';
  await prisma.verificationRequest.create({
    data: {
      tokenRef: expiredTokenRef,
      tokenHash: hashTokenRef(expiredTokenRef),
      studentId: aitCseStudents[1].student.id,
      createdById: userInstAdmin.id,
      purpose: 'Internship Background Verification',
      permittedFields: ['name', 'institution', 'programme'],
      expiresAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // Expired 2 days ago
      status: 'EXPIRED',
    },
  });

  // 12. Initial Audit Events
  console.log('Creating Initial Audit Events...');
  await prisma.auditEvent.create({
    data: {
      actorId: userAdmin.id,
      actorRole: 'PLATFORM_ADMIN',
      action: 'INTAKE_RULE_PUBLISHED',
      entityType: 'IntakeConfiguration',
      entityId: instAIT.id,
      reason: 'AICTE Annual Approval Process 2025-26 rules synchronized.',
    },
  });

  await prisma.auditEvent.create({
    data: {
      actorId: userAdmin.id,
      actorRole: 'PLATFORM_ADMIN',
      action: 'CASE_CREATED',
      entityType: 'ExceptionCase',
      entityId: case1.id,
      reason: 'Auto-created from cross-institution DUP-02 rule violation.',
    },
  });

  console.log('--- Database Seeding Completed Successfully! ---');
  console.log('Demo Accounts:');
  console.log('  Platform Admin:    admin@edutrace.demo        / Demo@Admin1');
  console.log('  Institution Admin: inst.admin@apextech.demo   / Demo@Inst1');
  console.log('  Data Operator:     operator@apextech.demo     / Demo@Oper1');
  console.log('  Verifier:          verifier@edutrace.demo     / Demo@Verif1');
  console.log('  Student:           student@apextech.demo      / Demo@Stud1');
}

if (require.main === module) {
  main()
    .catch((e) => {
      console.error('Seeding error:', e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}

module.exports = { seedDatabase: main };
