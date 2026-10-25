# MASTER PROMPT FOR CODEX
# EduTrace: APAAR-Based Student Data Management and Verification Platform
## Smart India Hackathon 2026 | Problem Statement 26263

Act as a senior full-stack engineer, application architect, database designer, security engineer, and product UI/UX designer. Build a complete, working, demonstrable web application named **EduTrace** for Smart India Hackathon 2026 Problem Statement 26263:

**“Development of an APAAR ID-Based Student Data Management and Verification Platform for AICTE-Approved Institutions.”**

Your job is to implement the actual application in the current workspace. Do not merely provide suggestions, a plan, a design image, or a static frontend. Inspect the repository, understand the existing code, create or modify the necessary files, run the application and tests, and resolve implementation errors.

The application must be impressive enough for a national-level hackathon demonstration while remaining technically realistic, privacy-conscious, and honest about integrations that are not available to the team.

---

# 1. PRODUCT VISION

Build EduTrace as a unified platform for managing, validating, reviewing, and verifying student records associated with AICTE-approved institutions and APAAR-linked academic identity.

The core workflow is:

INSTITUTION → STUDENT DATA UPLOAD → DATA VALIDATION → APAAR FORMAT CHECK → DUPLICATE DETECTION → ADMISSION AND INTAKE CHECKS → EVIDENCE-BASED REVIEW → AUTHORIZED VERIFICATION → REPORTING AND AUDIT

EduTrace should support institutions submitting and updating student-level records, administrators monitoring student data and admission capacity, and authorized verifiers inspecting permitted information.

The platform must demonstrate these problem-statement capabilities:

1. Secure student-data upload and updating using APAAR as the intended unique academic identifier.
2. Management of approved intake, actual enrolment, supernumerary seats, NRI category, OCI status, Foreign National (FN) status, and other necessary student information.
3. Detection of missing or invalid APAAR identifiers, duplicates, inconsistent records, and potential cross-institution duplicate enrolments.
4. Admission-capacity comparison against configured approved-intake and applicable seat rules.
5. Separate dashboards for institutions and platform administrators.
6. Authorized, privacy-conscious student record verification.
7. Support for generating student verification records associated with academic identity.
8. Extensible integration adapters for institutional systems and authorized AICTE/APAAR/ABC services.
9. Authentication, authorization, consent controls, audit trails, and appropriate personal-data protection.
10. Reports for monitoring, accreditation support, compliance review, and policy analysis.
11. A configurable certificate or document template capable of displaying the student ID and APAAR ID where authorized.

The platform must also implement the additional differentiators described below.

# 2. TECHNOLOGY STACK

Use the following stack unless the existing repository already has an appropriate, functioning equivalent.

## Frontend
- React
- Vite
- JavaScript with JSX
- Bootstrap 5 for responsive layout and styling
- Lucide React icons
- Recharts for dashboards and analytics
- React Router for navigation
- Axios or a consistent fetch-based API service layer

Do not convert the frontend to Next.js. Use React with Vite.

## Backend
- Node.js
- Express.js
- REST API architecture
- Prisma ORM
- PostgreSQL
- Zod for server-side request and schema validation
- Secure cookie-based authentication or an equally secure, properly implemented session mechanism
- bcrypt or Argon2 for password hashing
- Helmet, rate limiting, and carefully configured CORS where applicable

## Data processing and utilities
- CSV and Excel import support
- Server-side input validation
- QR-code generation for privacy-preserving verification references
- PDF or printable report generation where appropriate
- Structured application logs
- Automated tests

## Deployment and developer experience
- Docker
- Docker Compose for local development
- PostgreSQL service configuration
- `.env.example`
- Database migration and seeding scripts
- Clear README instructions
- Production-build scripts

Use stable, compatible package versions. Do not introduce technologies that are not needed merely to make the architecture look more advanced.

# 3. FIRST ACTION: INSPECT THE WORKSPACE

Before writing code:

1. Inspect the current directory, package files, source files, Git status, and existing application structure.
2. Determine whether this is an empty repository, a partial implementation, or an existing project.
3. Reuse working components and preserve existing functionality.
4. Identify missing features, broken dependencies, incomplete routes, schema problems, and configuration gaps.
5. Create a concise implementation checklist.
6. Begin implementing the checklist immediately.

Do not stop after describing the plan. Do not replace the entire application blindly. Make incremental changes, run the relevant commands, and verify the results.

If the workspace is empty, scaffold a maintainable monorepo with separate `client` and `server` applications and shared development scripts.

If an essential credential or official API is unavailable, implement the simulated adapter and continue with the rest of the application. Never make up credentials or pretend an integration works.

# 4. APPLICATION ARCHITECTURE

Implement this architecture:

USER PORTALS
  |
  v
REACT FRONTEND
  |
  v
EXPRESS REST API
  |
  +---- Authentication and access control
  |
  +---- Student data management
  |
  +---- Import and validation service
  |
  +---- Duplicate detection engine
  |
  +---- Intake and capacity rules engine
  |
  +---- Risk assessment and exception management
  |
  +---- Verification service
  |
  +---- Reporting and analytics
  |
  +---- Audit and data-provenance service
  |
  +---- Integration adapter layer
  |
  v
POSTGRESQL DATABASE

INTEGRATION ADAPTERS
  |
  +---- APAAR/ABC adapter
  +---- Institutional ERP adapter
  +---- AICTE data and rules adapter

For the hackathon prototype, these external adapters must run in an explicitly labelled simulation mode until legitimate API access is configured.

All meaningful business rules must be enforced on the backend. Do not rely on frontend-only authorization or validation.

# 5. USER ROLES AND PERMISSIONS

Implement role-based access control with institution-level data isolation.

## Platform Administrator / AICTE Demonstration Administrator
Can:
- Manage institutions and institution status.
- Manage academic years, programmes, and configured intake rules.
- View aggregate platform-level dashboards.
- Review authorized cross-institution discrepancies.
- Configure validation rules.
- View audit records and integration health.
- Generate platform-level reports.
- Manage users and permissions.
- Monitor exception resolution.

Clearly label this as a prototype administrator role, not an actual AICTE account.

## Institution Administrator
Can:
- Manage the institution's authorized users.
- Manage its programmes and academic years within assigned permissions.
- Submit and update student data.
- Import CSV/Excel files.
- Review validation errors.
- Manage institution-specific exceptions.
- View intake and enrolment summaries.
- Generate permitted institution-level reports.

Must not access unrelated institutions' individual student data.

## Data Entry Operator
Can:
- Create or edit permitted student records.
- Import student data.
- View import validation results.
- Submit records for validation.
- Correct records assigned to the user.

Must not manage platform-wide settings or grant administrative privileges.

## Authorized Verifier
Can:
- Verify only records for which the user has a valid permission, purpose, and scope.
- Access only the permitted subset of student information.
- View verification status and evidence relevant to the request.
- Record the verification outcome.

## Student
Can:
- View their own permitted record details.
- View record status and correction requests.
- See consent and verification-sharing status.
- Revoke supported optional verification-sharing grants.
- Submit corrections through a controlled review workflow.

Do not expose all student records to every authenticated user.

Create a centralized authorization middleware and test access control for every sensitive endpoint.

# 6. CORE MODULE A: INSTITUTION AND STUDENT DATA MANAGEMENT

Build the complete CRUD workflows for:

- Institutions
- Institution users
- Academic years
- Programmes and courses
- Approved intake configurations
- Student records
- Admission records
- Validation cases
- Verification requests
- Audit entries
- Reports
- Integration jobs

## Student record fields

Include the necessary fields to support the problem statement and the prototype, such as:

- Internal student record ID
- Institution ID
- Student ID or enrolment number
- APAAR identifier or clearly labelled synthetic demonstration identifier
- Student name
- Programme or course
- Academic year
- Admission date
- Admission category
- Enrolment status
- NRI category where applicable
- OCI status where applicable
- Foreign National status where applicable
- Admission seat category
- Relevant verification status
- Consent and sharing metadata where applicable
- Created timestamp
- Last-updated timestamp
- Record source and provenance

Use an extensible design for additional fields. Collect only information necessary for a defined workflow.

Prefer soft deletion or explicit archival for records whose history must be retained. Implement configurable retention rules rather than unrestricted permanent storage.

## Duplicate handling

Use an internal primary key for database relationships. Treat APAAR as the intended unique academic identifier for applicable records, subject to legitimate data scope and authorized verification.

Do not assume that a duplicate identifier automatically proves fraud. Distinguish exact identifier conflicts, similar-name matches, and other potential inconsistencies.

Support:
- Search and filtering.
- Pagination.
- Record detail pages.
- Edit forms.
- Record status history.
- Validation summaries.
- Permission-aware record display.
- Institution and academic-year filtering.

# 7. CORE MODULE B: BULK CSV AND EXCEL UPLOADS

Implement a working import workflow, not merely a file-selection button.

The workflow must support:

1. Downloadable sample import template.
2. CSV and Excel file selection.
3. File-type and size validation.
4. Column mapping or clear required-column guidance.
5. Preview of imported rows.
6. Row-level field validation.
7. Duplicate checks against existing records.
8. Capacity-rule checks.
9. Import summary before final submission.
10. User confirmation before committing accepted records.
11. Row-level rejection reasons.
12. Downloadable validation error report.
13. Import job history.
14. Counts of accepted, rejected, flagged, and skipped rows.

Use a staging workflow so that malformed files do not corrupt existing records.

Use database transactions for operations that require atomicity. Make duplicate imports idempotent where appropriate.

The UI should clearly distinguish:
- Format validation
- Local database consistency checks
- Simulated external verification
- Official verification, which is unavailable unless configured and authorized

# 8. CORE MODULE C: APAAR AND ACADEMIC IDENTITY VALIDATION

Implement several explicit validation states:

- Missing identifier
- Invalid identifier format
- Local identifier accepted for further checks
- Potential duplicate identifier
- Simulated verification passed
- Simulated verification failed
- Pending authorized verification
- Official verification unavailable

A 12-digit format check is only a format check. It does not prove the identifier exists, belongs to the named student, or has been verified by an official system.

For demo data, use clearly marked synthetic identifiers such as `DEMO-APAAR-000001`. Never generate or assign fabricated identifiers that are presented as real government-issued APAAR IDs.

Implement a configurable validation policy so that synthetic demo identifiers can pass sandbox-specific checks without weakening the live-format validation policy.

Never claim that the application has verified a student's real APAAR identity unless a genuine, authorized verification response exists.

Display sensitive identifiers in masked form by default. Restrict full-identifier viewing to authorized workflows.

Where appropriate, implement encryption for stored sensitive identifiers and keyed digests for matching. Store encryption and matching secrets in environment variables, never in source control.

# 9. CORE MODULE D: ADMISSION CAPACITY AND INTAKE VALIDATION

This is a central part of the problem statement. Implement real server-side rules.

Store:
- Institution
- Programme
- Academic year
- Approved intake
- Actual admitted/enrolled count
- Applicable supernumerary seat configuration
- Seat categories and applicable limits
- NRI category counts where applicable
- OCI category information where applicable
- Foreign National category information where applicable
- Rule version and effective academic year

Provide:
- Expected capacity versus current enrolment
- Remaining capacity under the configured rules
- Intake threshold alerts
- Programme-wise and institution-wise breakdowns
- Historical comparisons across academic years
- Review cases for possible excess admission
- Drill-down to records that contributed to a count

Do not assume every seat category may be added to the approved intake. Implement configurable, versioned rules and separate seat-category counts so authorized administrators can configure the applicable policy.

A potential capacity violation must be marked for review. Do not automatically reject a student or make an official regulatory determination.

# 10. ADDITIONAL DIFFERENTIATOR 1: EXPLAINABLE REGULATORY RISK ENGINE

Build an explainable rules-based engine named **Predict–Explain–Resolve**.

Do not claim to have developed a trained AI model unless an actual model and evaluation are implemented.

The engine should:
- Evaluate records against configured validation rules.
- Assign severity: Informational, Low, Medium, High, or Critical.
- Optionally calculate a configurable risk score.
- Record the rules that triggered the flag.
- Record relevant evidence and field-level discrepancies.
- Explain why the case was created in plain language.
- Recommend a next action.
- Record rule version and evaluation timestamp.
- Allow authorized review and resolution.

Example:

Issue: Potential duplicate student identifier
Evidence: The identifier is already associated with another active record.
Risk: High
Recommended action: Review the conflicting records and confirm ownership through an authorized process.
Status: Pending review

Never label a student as fraudulent solely because of a match or heuristic. Keep risk assessment explainable and reviewable.

# 11. ADDITIONAL DIFFERENTIATOR 2: CROSS-INSTITUTION DUPLICATE REVIEW

Implement duplicate-detection workflows using:
- Exact identifier conflicts.
- Similar student attributes where legally and operationally appropriate.
- Institution and academic-year context.
- Enrolment status.
- Potential repeated or conflicting admissions.

Provide a restricted cross-institution review queue.

Each case must show:
- Match type
- Matching fields
- Non-matching fields where useful
- Confidence or rule-based match score, clearly labelled
- Evidence
- Institution scope
- Assigned reviewer
- Status and history

Do not expose another institution's complete student record to unauthorized users. Use minimal cross-institution evidence and privileged review access.

Do not automatically merge records or declare fraud. Provide merge recommendations only as a reviewed administrative action, with audit history and rollback where feasible.

# 12. ADDITIONAL DIFFERENTIATOR 3: ADMISSION CAPACITY DIGITAL TWIN

Create a simulation workspace where institution administrators can explore the consequences of proposed admission decisions before final submission.

The user should be able to:
- Select an institution, programme, and academic year.
- Inspect configured intake values and category limits.
- Enter a proposed number of additional admissions by category.
- Run a what-if scenario.
- Compare current counts with proposed counts.
- See threshold warnings and affected rules.
- Inspect the difference between current and simulated state.
- Save named scenarios if appropriate.
- Export a scenario summary.

A simulation must never modify official or approved student records unless the user separately initiates and confirms the real record workflow.

Label simulation outputs as projections, not actual enrolment figures.

# 13. ADDITIONAL DIFFERENTIATOR 4: DATA PROVENANCE AND EVIDENCE TRAIL

Maintain a traceable history for important operations:
- Student record created
- Student record updated
- Data imported
- Validation executed
- Rule triggered
- Exception assigned
- Reviewer decision recorded
- Consent granted or revoked
- Verification request created
- Verification performed
- Report generated
- Integration job succeeded or failed

For important changes, record:
- Acting user
- Timestamp
- Action
- Affected record reference
- Previous and new values when appropriate
- Reason for change
- Source or import-job reference
- Rule version when applicable

Keep personal information out of general application logs. Mask or omit sensitive identifier values from logs.

Audit logs should be append-only through normal application permissions. Do not provide an ordinary user with an edit or delete action for audit events.

# 14. ADDITIONAL DIFFERENTIATOR 5: INTEGRATION HEALTH AND RECONCILIATION CENTRE

Implement an Integration Centre showing:
- Connector name
- Environment: Simulation or Authorized Live
- Last attempt timestamp
- Last successful synchronization
- Success/failure status
- Records processed
- Records requiring reconciliation
- Error summaries
- Retry count
- Next retry or next action

Build a small adapter interface so an authorized integration can be added later without rewriting the core business logic.

Implement mock adapters for:
1. APAAR/ABC
2. Institution ERP
3. AICTE data and rules

The mock adapters must return deterministic sample responses and realistic errors. They must not make up successful official responses.

Support:
- Retryable and non-retryable errors
- Exponential backoff for appropriate retryable jobs
- Idempotency keys
- Duplicate-job prevention
- Reconciliation reports
- Manual retry by an authorized user

Never place fake government API credentials or undocumented endpoints in the code.

# 15. ADDITIONAL DIFFERENTIATOR 6: PRIVACY-PRESERVING VERIFICATION

Create a verification request workflow for authorized stakeholders.

A verification link or QR code should contain only a random, opaque, revocable reference, not the APAAR ID, full student profile, or other sensitive information.

Implement:
- Creation of a verification reference
- Expiration date
- Revocation
- Optional single-use mode
- Consent or legal-purpose checks appropriate to the workflow
- Minimal permitted response fields
- Audit entry for creation, viewing, expiry, revocation, and use

The displayed result should state that it is an EduTrace prototype verification response based on the available record and its verification status.

Do not present an EduTrace QR code as an official APAAR credential or as proof of a live government-system check.

Mask personal identifiers in results by default.

# 16. ADDITIONAL DIFFERENTIATOR 7: AI COMPLIANCE COPILOT

Add a small compliance-assistance workspace only if it can be implemented with a reliable, honest design.

It should help authorized users understand:
- Why a record was flagged
- Which configured rule applies
- Which fields are missing
- What action the reviewer should take next
- What an institution must correct before re-submission

Ground answers in the application's configured rules, rule descriptions, available official reference documents, and relevant record evidence.

For the initial prototype:
- Use deterministic templates or a retrieval-based approach.
- Display the rule or source supporting each answer.
- Clearly indicate when no supporting rule or reference is available.
- Never invent government regulations or claim that an unverified source is official.
- Do not send personal student data to an external AI provider without explicit configuration, authorization, and a privacy review.

The copilot must not independently approve admissions, establish fraud, or make final regulatory decisions.

If no reliable implementation is possible with the available dependencies, provide a well-designed rule-explanation assistant instead of pretending to have a production-ready AI integration.

# 17. ADDITIONAL DIFFERENTIATOR 8: CLOSED-LOOP EXCEPTION RESOLUTION

Build a complete case-management system.

Every issue should move through a configurable lifecycle such as:

Detected → Assigned → Under Review → Awaiting Correction → Resubmitted → Resolved

Alternative outcomes:
- Rejected
- Escalated
- False Positive
- Closed With Explanation

Implement:
- Case ownership
- Priority and severity
- Due date where configured
- Comments and evidence
- Requested corrections
- Re-submission
- Reviewer decision
- Escalation
- Full history
- Resolution summary

Notify the appropriate in-app users when cases are assigned or require their action. Do not pretend that an email or SMS has been sent unless the corresponding service is configured and has actually succeeded.

# 18. ADDITIONAL DIFFERENTIATOR 9: ACADEMIC-YEAR CHANGE INTELLIGENCE

Compare a student's or institution's records between two academic years.

Detect potential:
- Programme changes
- Missing records
- Repeated active enrolment
- Changed student details
- Admission-count changes
- Unresolved cases carried forward
- Unexpected differences in institutional totals

Show a comparison table with:
- Previous value
- Current value
- Difference
- Evidence
- Flag reason
- Review status

Use the configured rules to identify anomalies. Do not assume a difference is improper without reviewing valid explanations such as transfers, programme changes, or graduation.

# 19. ADDITIONAL DIFFERENTIATOR 10: GUIDED DATA-CORRECTION ASSISTANT

When a row fails validation:
- Explain the problem in plain language.
- Identify the field that needs correction.
- Show accepted format or allowed values.
- Suggest a correction only when supported by reliable information.
- Allow an authorized user to edit the field.
- Re-run validation after correction.
- Preserve the original value and correction history in the audit trail.

Do not silently alter identifiers or important personal data. Require human confirmation for substantive corrections.

# 20. DASHBOARDS AND ANALYTICS

Build polished dashboards with meaningful real database values.

## Platform administrator dashboard
Display:
- Registered institutions
- Total student records
- Records awaiting review
- Validation failures
- Potential duplicate cases
- Institution and programme intake status
- Recent audit events
- Integration health
- Trends across academic years

## Institution dashboard
Display:
- Total enrolled students
- Records pending validation
- Import success and failure counts
- Potential duplicates
- Programmes near configured intake limits
- Cases awaiting institution action
- Recent record updates
- Reports and exports

## Verifier dashboard
Display:
- Assigned verification requests
- Requests awaiting review
- Expired or revoked references
- Recent permitted verification activity

Use server-derived metrics. Charts, tables, and KPI cards must represent actual seeded or user-created database records, not invented values.

Provide filters by institution, programme, academic year, category, and status as appropriate.

# 21. REPORTING

Implement useful reports such as:
- Institution student summary
- Programme-wise actual enrolment versus approved intake
- Seat-category summary
- Missing or invalid field report
- Potential duplicate review report
- Exception resolution report
- Academic-year comparison
- Verification activity report
- Audit trail report
- Import error report
- Integration reconciliation report

Support CSV export where appropriate and PDF or print-friendly output for key reports.

Enforce the same permission rules for exports as for viewing data on screen. Never let an export bypass record access controls.

# 22. CERTIFICATE AND STUDENT DOCUMENT SUPPORT

The problem statement calls for the ability to support displaying APAAR ID with the student ID on certificates issued by degree-awarding bodies.

Build a configurable printable student-record or certificate template containing:
- Institution name and logo
- Student name
- Student ID or enrolment number
- Programme
- Academic year or completion details where relevant
- APAAR identifier display according to authorization and configuration
- Verification reference or status where appropriate

Clearly mark prototype-generated samples as demonstrations. Do not create a fake government seal or claim the sample document was issued or authenticated by AICTE.

Mask the APAAR ID by default in previews and general views. Allow full display only when the relevant user is authorized and the workflow permits it.

# 23. SECURITY, PRIVACY, AND TRUST

Security must be implemented in code, not only listed in the README.

Requirements:
- Secure password hashing
- Secure session handling
- Authorization checks on every protected endpoint
- Institution-level access isolation
- Input validation on frontend and backend
- Protection against SQL injection through safe ORM use
- Rate limiting on login and sensitive endpoints
- Correct CORS policy
- HTTP security headers
- Safe file-upload handling
- File size and type restrictions
- No secrets committed to source control
- Minimal data collection and display
- Masked sensitive identifiers
- Audit history for sensitive operations
- Consent and verification-sharing controls
- Revocable verification references
- Configurable retention and archival behavior
- Safe errors that do not leak stack traces or personal information

Use synthetic records throughout the seed data, screenshots, and demo workflow. Clearly label all synthetic identifiers and mock verification responses.

Do not collect real student records to make the demonstration appear authentic.

# 24. DATA MODEL

Design a normalized Prisma schema with appropriate relationships, constraints, and indexes.

Include entities such as:
- User
- Role or permission mapping
- Institution
- AcademicYear
- Programme
- IntakeConfiguration
- Student
- StudentEnrollment
- DataImportJob
- ImportRowResult
- ValidationRule
- ValidationRun
- ValidationIssue
- DuplicateMatch
- ExceptionCase
- ExceptionComment
- VerificationRequest
- ConsentRecord
- AuditEvent
- IntegrationConnector
- IntegrationJob
- ReconciliationItem
- CapacityScenario
- ReportJob or ReportRecord where appropriate

You may adjust the schema to avoid duplication and improve data integrity, but document major decisions.

Use:
- UUIDs or non-guessable internal identifiers where appropriate
- Foreign keys
- Unique constraints where justified
- Transaction boundaries for multi-record operations
- Indexes for common searches and reports
- Created and updated timestamps
- Academic-year scoping where necessary

Do not use an APAAR number as the database primary key.

Do not store secrets, real credentials, or unnecessary sensitive data in seeded records.

# 25. API DESIGN

Organize the Express API into maintainable modules with clear routes, controllers or handlers, services, validation schemas, and authorization middleware.

Provide endpoints for:
- Authentication and current user
- Institutions
- Users
- Programmes and academic years
- Intake configurations
- Student records
- Bulk imports and validation previews
- Validation rules and validation runs
- Duplicate-review cases
- Exception management
- Capacity simulations
- Verification requests
- Consent management
- Reports and exports
- Audit history
- Integrations and reconciliation
- Dashboard metrics
- Academic-year comparisons
- Rule explanations or compliance assistance

Use consistent HTTP status codes, error shapes, pagination, filtering, and request validation.

Document the API through a README or OpenAPI specification.

The backend must enforce business rules even when a user bypasses the frontend.

# 26. USER INTERFACE AND DESIGN QUALITY

Create a modern, professional, government-tech dashboard suitable for a national hackathon demonstration.

Visual direction:
- Clean white or very light background
- Navy and blue as primary colours
- Restrained teal, green, amber, and red status accents
- Consistent spacing and typography
- Readable data tables
- Clear charts
- Small, consistent icons
- Rounded panels without excessive decoration
- Professional empty, loading, success, and error states

The application must include:
- Responsive sidebar navigation
- Top navigation with active user and role
- Breadcrumbs where helpful
- Search, sorting, filtering, pagination
- Accessible labels and keyboard-friendly forms
- Confirmation dialogs for sensitive actions
- Toasts or alerts for successful and failed operations
- Clear status badges
- Helpful empty states
- Form validation feedback
- Mobile- and desktop-responsive layouts

Do not build a single static landing page and call it complete. All major navigation links should lead to implemented, functional pages.

Keep the visual design consistent throughout the application.

# 27. DEMONSTRATION DATA AND DEMO ACCOUNTS

Create a deterministic seed script with fully synthetic records.

Include:
- Several fictional institutions
- Multiple programmes
- At least two academic years
- Different approved-intake configurations
- Student records in varied categories
- Valid demo-format records
- Missing identifier cases
- Invalid-format identifier cases
- Duplicate identifier cases
- Potential cross-institution duplicates
- Records with missing fields
- Records near or beyond configured intake limits
- Review cases in several lifecycle states
- Successful and failed simulated integration jobs
- Academic-year differences
- Verification references in active, expired, and revoked states

Make sure all records and names are explicitly fictional or synthetic. Do not use real APAAR identifiers.

Provide convenient demo login accounts for each role in development mode only. Document their credentials in the README, clearly state that they are for local demonstration, and prevent default demo credentials from being silently enabled in production.

The application should be visually populated and demonstrable immediately after the documented setup and seed commands.

# 28. TESTING AND ACCEPTANCE CRITERIA

Create automated tests for the most important rules.

At minimum, test:

1. Login and permission enforcement.
2. Cross-institution access restrictions.
3. Missing and invalid APAAR-format cases.
4. Synthetic-mode versus live-format validation behavior.
5. Duplicate identifier detection.
6. Cross-institution duplicate review.
7. Approved-intake comparison.
8. Supernumerary and category-rule configuration.
9. CSV/Excel validation and import errors.
10. Exception assignment and resolution lifecycle.
11. Verification-reference expiry and revocation.
12. Audit event creation for sensitive actions.
13. Report-export permission enforcement.
14. Integration retry and reconciliation behavior.
15. Academic-year comparison.
16. Data-correction history.

Use unit tests for rule engines and integration tests for API and database workflows. Add frontend tests for important forms or user flows where practical.

Do not report tests as passed unless they have actually run successfully.

# 29. REQUIRED LOCAL DEVELOPMENT EXPERIENCE

The completed project should provide simple commands such as:

- Install dependencies
- Start local development
- Start PostgreSQL
- Run database migrations
- Seed synthetic data
- Run tests
- Build production assets
- Start production mode

Use actual commands supported by the generated project. Document them in the README.

Provide:
- `.env.example`
- Docker Compose configuration
- Prisma schema and migrations
- Seed script
- API and frontend setup instructions
- Demo credentials for development mode
- Troubleshooting notes
- A clear list of simulated and unavailable official integrations

Do not expose environment-variable secrets in the frontend bundle.

# 30. DEPLOYMENT READINESS

Prepare the project for a prototype deployment using a React frontend hosting service and a Node.js backend hosting service with PostgreSQL.

Support environment-based configuration for:
- Database connection
- Session or authentication secrets
- API base URL
- Frontend origin
- Encryption key, if application-level identifier encryption is implemented
- Identifier matching key
- Integration mode
- Optional authorized external API configuration

Use safe production defaults. Disable demo credentials and verbose debug output in production.

Add a readiness or health endpoint that does not reveal secrets or personal data.

Document any additional deployment steps that cannot be automated.

# 31. INTEGRATION RULES: STRICT REQUIREMENTS

The prototype must distinguish among these states:

1. LOCAL FORMAT CHECK: The identifier satisfies configured formatting rules.
2. LOCAL DATA CHECK: The application found a match or discrepancy in its own database.
3. SIMULATED EXTERNAL CHECK: A mock adapter returned a demonstration response.
4. OFFICIAL EXTERNAL VERIFICATION: An authorized external system actually returned a verifiable response.

Never display state 1, 2, or 3 as state 4.

Do not fabricate:
- API credentials
- Government approval
- Live database access
- Official identity-verification results
- Actual production synchronization
- Regulatory decisions
- Security certifications

If authorized integration details are not supplied, leave the connector in simulation mode, document the missing prerequisites, and complete all locally testable features.

# 32. BUILD PRIORITY AND IMPLEMENTATION ORDER

Implement the product in working stages, verifying each stage before moving on.

## Phase 1: Application foundation
- Inspect or scaffold repository
- Configure React, Express, PostgreSQL, Prisma
- Implement authentication
- Implement roles and permission checks
- Create core database schema
- Add synthetic seed data
- Establish design system and navigation

## Phase 2: Core problem-statement workflow
- Institution and programme management
- Student records
- CSV/Excel imports
- Identifier format validation
- Duplicate detection
- Intake validation
- Admin and institution dashboards
- Review workflows
- Reports and audit history

## Phase 3: Differentiators
- Predict–Explain–Resolve risk engine
- Cross-institution duplicate-review queue
- Admission Capacity Digital Twin
- Provenance and evidence trail
- Integration Health Centre
- Privacy-preserving verification references
- Rule-grounded compliance assistance
- Closed-loop exception management
- Academic-year change intelligence
- Guided correction assistant

## Phase 4: Production-quality finishing
- Tests
- Security checks
- Responsive design
- Empty, loading, and error states
- Exports
- Certificate and printable verification templates
- Docker and seed workflows
- README and API documentation
- Production build and final verification

Where time is limited, prioritize complete and reliable core workflows over decorative features. Keep every additional feature clearly labelled if it is a prototype simulation.

# 33. DEFINITION OF DONE

Do not consider the application complete until:

- The frontend starts successfully.
- The backend starts successfully.
- PostgreSQL can be initialized and seeded using the documented workflow.
- Users can log in using documented development credentials.
- Permissions are enforced on the backend.
- Student records can be created, edited, searched, filtered, and reviewed.
- CSV/Excel files can be previewed, validated, and imported with row-level results.
- Duplicate and admission-capacity rules work against seeded data.
- Risk flags include understandable reasons and evidence.
- Exception cases can be assigned, corrected, reviewed, and resolved.
- Dashboards use actual application data.
- Authorized verification references can expire and be revoked.
- Audit events are recorded for important operations.
- Integration simulations are visibly distinct from official verification.
- Core automated tests have been executed and their actual results recorded.
- The production frontend build succeeds.
- README instructions permit another developer to reproduce the setup.
- The final implementation does not contain fabricated official integrations or unsupported success claims.

# 34. HOW YOU SHOULD WORK AS CODEX

Make concrete changes in the current workspace.

Work independently through implementation without repeatedly asking me to approve minor decisions. Make reasonable engineering choices and document assumptions. Ask only when a genuinely blocking decision cannot be safely resolved from the repository and requirements.

After each meaningful stage:
1. Run relevant commands and tests.
2. Fix failures that are caused by your changes.
3. Check for authorization bypasses and accidental exposure of sensitive fields.
4. Review whether the feature works end to end rather than only looking complete visually.
5. Keep the README and configuration aligned with the implementation.

Do not stop when the initial architecture or frontend is generated. Continue until the available implementation is running and the core workflows are tested.

Do not silently delete existing functionality. Do not hide errors, hardcode fabricated results, or use placeholder buttons for required functionality.

If you cannot finish an optional feature, clearly state what is implemented, what is only simulated, and what remains incomplete.

# 35. FINAL RESPONSE AFTER IMPLEMENTATION

When development is finished, provide a concise but specific completion report containing:

1. What was implemented.
2. Major pages and workflows.
3. Architecture and technology stack.
4. Database setup and seed commands.
5. How to run the application locally.
6. Demo accounts and role permissions.
7. Automated test commands and actual results.
8. Build status.
9. Deployment instructions.
10. Features running in simulation mode.
11. Official API credentials or approvals still required.
12. Known limitations and remaining work.

The final goal is a working, secure, polished, end-to-end **EduTrace SIH 2026 prototype** that demonstrates how APAAR-linked student data could be managed, validated, reviewed, and verified responsibly for AICTE-approved institutions.

Start by inspecting the current workspace, then implement the application.