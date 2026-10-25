EDUTRACE
Detailed Solution and Implementation Blueprint
Smart India Hackathon 2026 | Problem Statement 26263
Development of an APAAR ID-Based Student Data Management and Verification Platform for AICTE-Approved Institutions
SIGNATURE APPROACH: PREDICT • EXPLAIN • RESOLVE
Prepared as a working solution reference for concept design, prototype implementation, and SIH presentation alignment.
Date: 25 October 2026
NOTE: Prototype boundary: this document proposes a demonstrable student-data workflow using synthetic records and simulated integrations. It does not claim live access, endorsement, or official verification by AICTE, APAAR, ABC, DigiLocker, or any government system.

# Document Guide
This document consolidates the problem statement, the core EduTrace proposal, the additional differentiators agreed for the concept, implementation architecture, risks, build plan, and research sources. It distinguishes the problem statement requirements from the team’s proposed design choices.
• 1. Executive Summary
• 2. Problem Statement Profile and Context
• 3. Problem Analysis and Need
• 4. PS Requirements and Solution Traceability
• 5. Proposed Solution at a Glance
• 6. Users, Roles, and Permissions
• 7. Core Functional Modules
• 8. Additional Plan and Differentiators
• 9. Signature Workflow: Predict–Explain–Resolve
• 10. Data Model and Fields
• 11. Validation, Duplicate, and Intake Logic
• 12. Technical Architecture and Stack
• 13. Security, Privacy, and Governance
• 14. User Interface and Dashboards
• 15. Integration Strategy
• 16. Implementation Roadmap and Priorities
• 17. Test Plan and Impact Measurement
• 18. Risks and Mitigations
• 19. Deployment and Operational Plan
• 20. Prototype Demonstration Storyline
• 21. Six-Slide SIH Presentation Alignment
• 22. Decisions, Assumptions, and Non-Goals
• 23. Research References
• 24. Glossary
NOTE: Reading convention: “PS requirement” describes what the problem statement asks for; “proposed design” describes our solution approach; “prototype boundary” marks work that must be simulated until authorized access is available.

# 1. Executive Summary
EduTrace is a proposed APAAR-linked student data management and verification platform for AICTE-approved institutions. It is designed to help institutions submit student-level enrolment information after admissions, validate records, identify potential duplicates and data inconsistencies, compare admissions against configured approved-intake rules, manage discrepancies through a review workflow, and make traceable records available to authorized users.
The underlying problem is a fragmented and uneven student-data reporting environment. The PS describes that AICTE receives student-related information through different mechanisms: PGDM institutions provide detailed annual student data, while other AICTE-approved institutions may primarily provide statistical totals such as total enrolment during approval. That makes it harder to maintain one complete, authentic, and verifiable student-level view across the ecosystem. APAAR is intended to serve as a national academic identity; the solution should use that identifier as a stable academic reference rather than issue or invent identifiers itself. [R1–R4]
The proposed product has two complementary jobs: (1) data operations, including institution/programme setup, uploads, validation, admission-capacity monitoring, and case correction; and (2) authorized verification, including evidence-backed status checks, audit trails, reports, and privacy-conscious verification tokens or QR codes.
The signature differentiator is “Predict–Explain–Resolve.” EduTrace should not only flag a record. It should show what triggered the flag, which data or rule supports it, who needs to review it, what resolution was selected, and what evidence was retained. This human-review model helps reduce unsupported “fraud” conclusions from duplicate matches or anomalies.
Recommended implementation stack: React frontend, Node.js/Express REST API, PostgreSQL, role-based access control, audit logging, Docker-ready packaging, and a prototype deployment using a static frontend host such as Vercel and an API host such as Render or Railway. External APAAR/ABC, institution ERP, and AICTE integrations should be implemented behind adapters. In the prototype those adapters return clearly labelled simulated responses; live calls require valid authorization, credentials, technical specifications, and security review.
NOTE: Core promise: one structured student-data workflow from institutional submission to validation, explainable discrepancy handling, authorized verification, and reporting — with a clear distinction between local validation, simulated integration, and official verification.

# 2. Problem Statement Profile and Context

Field | Details
--- | ---
Problem statement ID | SIH26263 / PS 26263 (as listed in the SIH 2026 problem statement references)
Title | Development of an APAAR ID-Based Student Data Management and Verification Platform for AICTE-Approved Institutions
Organization / bureau | AICTE; Regulation Bureau is the working organizational context supplied for this project
Category | Software
Theme | Smart Automation
Primary problem area | Student-level data submission, validation, record verification, admission monitoring, interoperability, and regulatory reporting
Target users | AICTE/authorized regulators, AICTE-approved institutions, institution data operators, authorized verifiers, and students through limited self-service functions
Proposed project name | EduTrace — APAAR-Linked Student Data Intelligence and Verification Platform
Signature differentiator | Predict–Explain–Resolve

## 2.1 Problem statement in plain language
AICTE needs a more consistent way to receive, validate, monitor, and verify detailed student-level information across approved institutions. The submission mechanisms described in the PS differ by institution type, so the information available centrally may not always provide a complete, uniform, student-level picture. The proposed platform should make APAAR ID the academic identifier around which student enrolment records can be organized and checked. [R1–R2]

## 2.2 What the PS asks the team to build
• A secure platform or API for approved institutions to upload and update student-level data using APAAR ID as the unique academic identifier, after admissions are completed.
• Structured fields including approved intake, actual student enrolment, supernumerary seats, NRI category, OCI status, Foreign National (FN) status, and other relevant student information.
• Automated checks for duplicate records, missing or invalid APAAR IDs, admissions that exceed the applicable approved intake, inconsistent student data, and potential duplicate enrolment across institutions.
• Dashboards for AICTE and institutions to monitor admissions and student records, with the PS expressing a real-time monitoring goal.
• A secure verification mechanism for authorized stakeholders, such as AICTE, institutions, employers, and other regulatory bodies.
• Generation of verifiable student records linked to the student’s academic identity.
• Integration/API capability with existing institutional and AICTE systems.
• Data security and privacy controls, authentication, role-based access control, audit trails, and consent mechanisms where applicable.
• Reports to support policy-making, accreditation, monitoring, and regulatory activity.
• Support for displaying or printing APAAR ID alongside the student ID on certificates issued by degree-awarding bodies, subject to applicable institutional and policy requirements.

## 2.3 Intended outcome
The intended outcome is a scalable, secure, interoperable and user-friendly APAAR-based student data management and verification system that can be integrated with the AICTE portal. The process envisioned by the problem statement can be summarized as: Institution → Student Data Upload → APAAR Validation → Data Verification → AICTE Central Repository → Analytics and Monitoring → Authorized Verification. [R1–R2]
NOTE: Important boundary: APAAR is a national academic identity, not a number the prototype should create. EduTrace can validate local format, detect internal inconsistencies, and simulate an external lookup; it must not label those checks as official APAAR/ABC verification unless an authorized system confirms them. APAAR official materials describe APAAR as a 12-digit unique code. [R3–R4]

# 3. Problem Analysis and Need

## 3.1 Operational gaps addressed

Gap described or implied by the PS | Operational consequence | EduTrace response
--- | --- | ---
Different submission mechanisms and levels of detail | Records can be uneven, difficult to reconcile, or incomplete across institutions. | Common data schema, standardized import templates, and institution/programme/academic-year views.
Missing or invalid academic identifiers | A record may not be reliably linked to a student identity. | Local format checks and status labels; official lookup only through authorized integration.
Duplicate records within or across institutions | Possible double counting, conflicting records, or enrolment exceptions. | Exact-match and candidate-match detection with evidence and human resolution.
Approved intake and actual enrolment must be compared | Excess admissions or category-specific exceptions may be overlooked. | Configurable intake rules, count reconciliation, and capacity simulation.
Verification must be restricted to authorized stakeholders | Uncontrolled disclosure of personal student data is a risk. | Least-privilege roles, scoped verification outputs, token expiry, audit trail.
Reports are needed for governance and monitoring | Decision-makers may lack consistent, reviewable evidence. | Dashboards, case statuses, exportable reports, and rule-version traceability.

## 3.2 Design principles
• Use a single canonical student/enrolment data model with institution, programme, and academic-year context.
• Treat APAAR as an identifier reference, not as permission to collect any adjacent identifier or demographic detail without need and authority.
• Separate validation outcomes: format-valid, internally consistent, simulated external check, and official external verification.
• Every material flag should have a reason code, supporting values, rule version, timestamp, and next action.
• Duplicate detection should create a review case; it should not automatically label a student or institution as fraudulent.
• Admission-capacity rules must be configurable by the authorized policy owner and versioned; the product should not invent category-seat rules.
• Use synthetic data in demos and development until the team has a lawful, approved data source.
• Design integrations behind adapters so the prototype can later connect to authorized APIs without rewriting the whole business layer.

# 4. PS Requirements and Solution Traceability
The table below maps every major PS requirement to a proposed EduTrace capability and to evidence that can be shown in a prototype. It is useful for implementation planning, presentation writing, and judging preparation.

PS requirement | EduTrace response | Prototype evidence
--- | --- | ---
1. Secure institution upload/update using APAAR | Institution portal, CSV/Excel ingestion, student/enrolment APIs, record versioning, role-based access. | Upload a synthetic cohort, show batch status, and edit/correct a record.
2. Approved intake, actual enrolment, supernumerary, NRI, OCI, FN and other fields | Programme/year intake configuration and seat-category fields; versioned rule configuration. | Dashboard shows approved capacity, current counts, category breakdown, and flagged overage.
3. Duplicate, missing/invalid APAAR, over-intake, inconsistency, cross-institution duplicates | Validation engine with reason codes and a duplicate review queue. | Create examples for missing ID, invalid format, repeated ID, inconsistent field, and intake threshold.
4. Real-time monitoring dashboards | Dashboard updates as records enter the prototype; simulated data sync state for external sources. | Show live UI updates for local actions and make external connection status explicitly simulated.
5. Secure verification by authorized stakeholders | Limited verifier portal with scoped views, authorization checks, and logged access. | Show a permitted verifier checking a demonstration record and an unauthorized role being denied.
6. Verifiable records linked to academic identity | Record reference, verification status, evidence summary, and revocable short-lived QR/reference token. | Scan a prototype QR/reference to open a limited verification view; label it prototype-only.
7. Existing institution and AICTE integration/API capability | Adapter interface, REST endpoints, source mappings, retries, job logs, and mock adapters. | Show a mock adapter returning simulated success/failure and a reconciliation log.
8. Security, privacy, authentication, RBAC, audit trails, consent mechanisms | RBAC, input validation, minimal data collection, encryption controls, audit logging, purpose/notice records where applicable. | Demonstrate role scopes, audit events, masking, and visible privacy notice in demo.
9. Policy, accreditation, monitoring and regulatory reports | CSV/PDF-style reports, intake summaries, exception aging, validation coverage, institution/programme filters. | Export sample institution and cross-institution review reports.
10. Print/display APAAR ID with student ID on degree certificates | Certificate-display setting or verification record template; apply masking/access and institutional approval policies. | Demonstrate a mock certificate/record layout using synthetic IDs; do not claim official certificate issuance.
NOTE: Do not drop the certificate-display requirement when moving from PPT to implementation. The current six-slide deck summarizes it indirectly through verification; the detailed solution should explicitly include it as a requirement-driven feature.

# 5. Proposed Solution at a Glance
EduTrace is a unified workflow platform, not just a student database. It connects data intake, local validation, configured rule checks, exception review, verification, and reporting. The key product outputs are a reliable student/enrolment record, a traceable validation status, and a reviewable evidence trail.

## 5.1 End-to-end solution flow
Institution user signs in → selects institution, programme, and academic year → uploads or updates student-level data → the ingestion service validates file structure → field validation checks missing/invalid values → identity checks classify APAAR status → duplicate and intake checks run against allowed scope → the rule engine creates explainable flags → exception cases are assigned for review → the authorized reviewer resolves or escalates each case → audit trail is stored → dashboards/reports update → an authorized user may issue or check a limited verification reference.

## 5.2 What EduTrace is not
• It is not an APAAR ID generator.
• It is not an official AICTE portal or official government-endorsed system.
• It is not proof of official identity when it only performed local checks or used a mock adapter.
• It is not an automatic fraud adjudication tool. Candidate matches and rule anomalies require context and human review.
• It does not replace the approval rules or authority of AICTE or the relevant regulator.
• It does not grant employers or other external entities unrestricted access to student records.

# 6. Users, Roles, and Permissions

Role | Permissions and boundaries
--- | ---
Platform/Super Admin | Manage tenant configuration, user provisioning, integration settings, rule versions, and system health. No routine data browsing unless needed and authorized.
AICTE/Regulatory Admin | View permitted cross-institution dashboards, set or publish approved rule versions when authorized, review flagged cases, access aggregated reports, and track institutional submission status.
Institution Admin | Maintain the institution’s programmes, academic years, approved-intake values, user roles, upload permissions, and local review queue.
Institution Data Operator | Upload or update records, view validation errors, correct fields within permission, and submit batches for review.
Reviewer / Compliance Officer | Inspect reason codes and supporting evidence, request corrections, mark cases resolved, escalate ambiguous cases, and enter decision notes.
Authorized External Verifier | Verify only the minimum permitted attributes for a permitted purpose; access is scoped, time-bound where practical, and audit-logged.
Student / Record Holder (limited optional portal) | View the student’s own permitted status and submit correction requests; cannot browse other students or modify authoritative institutional data directly.
Authorization must be checked on the server for every protected resource and every record ID. Hiding a UI button is not sufficient access control. The permissions matrix should be testable by role and tenant/institution scope.

# 7. Core Functional Modules

## 7.1 Institution, programme, and academic-year registry
Create institution records; map institution codes; configure programmes and approved intake by academic year; record who supplied or approved each value; keep historical configurations instead of overwriting prior years.

## 7.2 Student identity and enrolment management
Maintain a student identity reference separate from the enrolment record. Support multiple academic-year enrolments, programme changes, transfers, withdrawal/completion status, admission category, and links to relevant institution/programme/year records.

## 7.3 Bulk data ingestion
Accept CSV/Excel templates; show column mapping; validate file type and row shape; run dry-run checks; present row-level errors; allow corrected re-upload; maintain batch ID, source, uploader, import time, and batch outcome.

## 7.4 APAAR/ABC identifier handling
Record APAAR status as not supplied, format invalid, pending external check, externally verified, external check failed, or unresolved. Store only the information needed. Do not generate an APAAR ID or infer official validity from a 12-digit format check.

## 7.5 Automated validation engine
Run required-field, type/format, cross-field, academic-year, institution/programme, intake, duplicate, and source-consistency rules. Every result includes severity, reason code, fields used, rule version, and recommended next action.

## 7.6 Intake monitoring and capacity digital twin
Compare actual enrolment with configured approved intake and applicable seat-category/supernumerary rules. Provide what-if scenarios for proposed additions, with the assumptions and rule version visible. It is a decision-support simulation, not a substitute for regulatory approval.

## 7.7 Duplicate detection and resolution
Find exact identifier matches within a dataset and across authorized institution scopes; optionally produce candidate matches based on permitted, minimal attributes. Present records side by side, evidence and match method, and a disposition such as confirmed duplicate, legitimate transfer/multiple enrolment, not a match, or needs escalation.

## 7.8 Exception and case management
Create a case when validation flags a problem. Support owner assignment, severity, due/age status, comments, correction request, resubmission, evidence attachments or references, reviewer decision, closure reason, and escalation.

## 7.9 Dashboards and reports
Institution dashboard, regulatory overview, intake comparison, batch processing results, exception aging, duplicate review queue, data quality trends, integration health, and exportable reports. Filter by institution, programme, academic year, status, and rule version.

## 7.10 Authorized verification
Provide a verification reference or QR that resolves to a limited verification page. Show only authorized fields and source/status labels. Log who accessed it, when, purpose if required, and what data was returned.

## 7.11 Evidence provenance and audit trail
Record source, import batch, rule version, date/time, actor, field changes, before/after values where appropriate, decision note, review history, and external adapter request/result metadata with secrets and personal details omitted.

## 7.12 Certificate/record display support
Support a configurable student record or mock certificate view showing institutional student ID with APAAR ID in the authorized format. Allow masking or omission depending on policy and user permissions. The prototype should use synthetic identifiers and must not represent itself as an official certificate issuer.

# 8. Additional Plan and Differentiators
These are the additional solution ideas agreed for EduTrace. They build on the required upload, validation, monitoring, verification, integration, and reporting capabilities. Not every differentiator needs to be fully implemented in the first prototype; use the priorities in Section 16.

## A. Explainable Regulatory Risk Engine
Create risk or priority flags based on configured rules, not unexplained model output. Each flag should show the trigger, facts used, severity, rule version, and recommended reviewer action. If a numeric priority score is used, expose how it is calculated and never treat it as a final regulatory decision.

## B. Smart Cross-Institution Duplicate Detection
Detect exact APAAR-token matches across permitted institution datasets and route possible conflicts for review. Keep “exact match” separate from fuzzy candidate matching. Candidate matching should use only permitted attributes, show why the match was suggested, and avoid automatically calling it fraud.

## C. Admission Capacity Digital Twin
Provide a what-if view to test how planned admissions compare with the configured approved intake and the relevant supernumerary/category rules. The user sees current count, proposed change, simulated result, and rules applied. The rules must be maintained by an authorized owner and may differ by programme or year.

## D. Data Provenance and Evidence Trail
Maintain a timeline for each record and case: imported from which batch, checked by which rules, changed by whom, reviewed by whom, and resolved with what reason. The audit record should be append-oriented and protected from ordinary user alteration.

## E. Integration Health and Reconciliation Centre
Show adapter name, simulated/live mode, last attempted sync, last successful sync, records sent/received, errors, retry count, and pending jobs. In prototype mode label all external status as simulated. Design retry behaviour to be idempotent and do not expose credentials in logs.

## F. Privacy-Preserving Verification
Issue a random, revocable, short-lived verification reference or QR that does not embed the full student record or full APAAR ID in the QR payload. Resolve it server-side and return minimum fields permitted for that verifier. This is a prototype verification feature, not an official APAAR credential.

## G. AI Compliance Copilot
Optional advanced feature. Answer institution staff questions using a curated collection of approved, versioned rules and guidance. Show citations to the source paragraph/rule and the applicable version. If evidence is missing or the question exceeds the source set, say so and route the question to a human. Do not let the model invent regulations or make binding compliance decisions.

## H. Closed-Loop Exception Resolution
Turn every discrepancy into a trackable case with an owner, status, correction request, evidence, review notes, and closure reason. Institutions can see what action is required and authorized reviewers can see the history.

## I. Academic-Year Change Intelligence
Compare year-over-year enrolment, programme data, intake configuration, and unresolved exceptions. Flag unusual changes for investigation, with the baseline and calculation visible. A trend is a signal for review, not evidence of wrongdoing.

## J. Guided Data-Correction Assistant
Explain why a value failed validation, identify the field that needs attention, give a permitted example format, and show the exact correction needed. Bulk upload error reports should link to row number and field; users should correct source records and re-upload rather than silently auto-edit authoritative data.

## K. Integration-ready API and Adapter Layer
Define a stable internal interface for the APAAR/ABC adapter, institution ERP adapter, and AICTE adapter. Mapping, authentication, retry and error handling belong to the adapter, so the core validation and case-management services can operate on the normalized internal model.

## L. Secure Certificate and Student-ID Display
Include the PS requirement to support APAAR ID alongside the institution student ID on certificate/record displays. For the prototype use synthetic IDs; in a real deployment, the exact presentation, masking, and issuance process must be confirmed with the responsible institution and applicable policy.

# 9. Signature Workflow: Predict–Explain–Resolve
Predict–Explain–Resolve is the central differentiator. It is intended to make the platform’s checks actionable and auditable, not merely produce a dashboard of red warnings.

Stage | What the platform does | Example output
--- | --- | ---
PREDICT | Run configured data-quality, duplicate, intake, and consistency checks; flag records or cases needing attention. | “Potential cross-institution duplicate: same protected APAAR matching token appears in two active enrolments.”
EXPLAIN | Expose the rule or condition, fields compared, evidence references, severity, and rule version. | “Flag triggered by Rule DUP-02, version 1.3; same identifier token found in Institution A and Institution B; status and dates require review.”
RESOLVE | Assign the case, collect correction or supporting evidence, record reviewer decision, and close/escalate. | “Reviewed: legitimate transfer; prior enrolment closed. Case resolved by authorized reviewer; audit event stored.”

## 9.1 Rules and status model
• New → Validating → Needs Correction / Needs Review → In Review → Resolved / Rejected / Escalated → Closed
• Every state transition must record actor, timestamp, reason, and any supporting evidence.
• High-severity or policy-sensitive cases should require an authorized reviewer; the system should not quietly auto-resolve them.
• Corrections should preserve a traceable revision history rather than erase the original imported value.

# 10. Data Model and Fields
Keep the record of a student’s identity distinct from each institutional enrolment. That avoids modelling one student as a different person in every academic year and allows controlled review of transfers, programme changes, and potential duplicate enrolments.

## 10.1 Core entities

Entity / table | Purpose and indicative fields
--- | ---
institutions | institution_id, name, official institution code, type, status, source/provenance
programmes | programme_id, institution_id, name/code, level, status
academic_years | academic_year_id, label, start/end dates, status
intake_rules | institution_id, programme_id, academic_year_id, approved_intake, supernumerary/category limits, effective dates, source document/reference, rule_version, approved_by
student_identities | internal student key, encrypted APAAR ID if retention is authorized/necessary, protected HMAC match token, masked display value, identity check status
enrolments | enrolment_id, student key, institution, programme, academic year, institution student ID, admission date, category (NRI/OCI/FN/other as applicable), status, source batch
ingestion_batches | batch_id, institution, academic year, uploaded_by, file hash, source template version, submitted/processed times, row counts, overall status
validation_results | result_id, entity/case, rule_id, rule_version, severity, status, field names, evidence references, created_at
duplicate_candidates | candidate_id, record pair/reference, match method, evidence features, confidence/priority if used, reviewer disposition
exception_cases | case_id, type, severity, assigned_to, status, due/age timestamps, resolution code, notes
audit_events | event_id, actor, role, action, entity reference, timestamp, before/after diff or hash, purpose/reason, correlation ID
integration_jobs | job_id, adapter, simulated/live flag, job type, idempotency key, status, attempt count, request/response metadata with secrets redacted
verification_tokens | token_id/hash, subject reference, permitted fields, audience/purpose if required, expiry, revoked_at, created_by, access log reference
users_roles | user, role, institution scope, account state, authentication metadata, created/updated timestamps
rule_versions | rule_id, version, effective dates, configuration, source reference, approval state, publisher

## 10.2 Required PS student-data fields
• APAAR ID status and identifier handling state (do not confuse a format check with official verification).
• Institution student ID and internal record reference.
• Institution, programme, and academic year.
• Approved intake and actual enrolled count at the appropriate programme/year/category level.
• Supernumerary seat designation and applicable allowance/rule reference.
• NRI category, OCI status, Foreign National (FN) status, and other relevant admission category fields as applicable.
• Enrolment status, admission date or date range when required for the workflow, source batch and provenance.
• Validation state, exceptions, resolution outcome, and authorized verification status.

## 10.3 Data minimization recommendations
Do not include Aadhaar, full date of birth, parental details, personal mobile numbers, or other sensitive attributes in the prototype unless a specific requirement and valid authorization make them necessary. These may appear in processes for APAAR generation in school contexts, but they are not a reason for this prototype to collect them by default. Use synthetic data in development and demos. Prefer a masked APAAR display and a server-managed protected matching token. A plain unsalted hash of a 12-digit identifier is not a sufficient privacy control because the identifier space is limited; if cross-record matching is needed, consider a keyed HMAC stored securely and access-controlled encryption for the raw identifier only where justified.

# 11. Validation, Duplicate, and Intake Logic

## 11.1 Validation layers

Layer | Checks | Output label
--- | --- | ---
Layer 1: Local format validation | Missing value, length/pattern, data type, required columns, allowed enumerations. | Format valid / format invalid / missing
Layer 2: Internal consistency | Field conflicts, repeated identifiers in uploaded batch, institution/programme/year mismatch, impossible or inconsistent status dates. | Consistent / inconsistent / needs correction
Layer 3: Cross-record checks | Potential same student across institution records, enrolment status conflicts, over-intake comparison, year-over-year anomaly. | No issue detected / potential match / rule exception
Layer 4: External official check | Call an approved APAAR/ABC or authorized institutional API using approved credentials and documented API semantics. | Officially verified / not verified / unavailable / error
Layer 5: Human adjudication | Review context, source documents/records, transfer state, category rules, and institutional explanation. | Confirmed / not a duplicate / corrected / escalated / unresolved
The UI must label the layer that produced the result. A record can be format-valid without being officially verified. An external adapter failure must not silently convert to “valid.”

## 11.2 Duplicate detection
• Exact matching: within a batch and database, compare protected APAAR matching tokens where the system has authority to process the identifier.
• Cross-institution matching: compare across only the institution scope the current operator/reviewer is authorized to use.
• Candidate matching: if enabled, compare only approved/minimized attributes; clearly state why the candidate was suggested. Keep the feature behind configuration until privacy and false-positive behaviour are tested.
• Context-aware disposition: a same-identifier match may result from a transfer, old enrolment not marked as inactive, concurrent enrolment that needs review, data entry error, or an actual duplicate. The platform must let a reviewer decide.
• Reviewer evidence: show institution, programme, year, enrolment status, date and source of each record, subject to access policy. Mask fields not needed for the decision.
• Never use a fuzzy score as an automatic fraud verdict or automatic admission rejection.

## 11.3 Intake and capacity logic
The intake engine should compare enrolled counts with the relevant approved intake configuration for the correct institution, programme, academic year and applicable seat categories. It should read a versioned ruleset rather than hard-code a single formula for every institution.
The calculation should distinguish regular approved intake from supernumerary and other categories according to the exact rule configuration supplied by an authorized administrator. Do not assume all supernumerary seats are additive in the same way, or invent the allowed NRI/OCI/FN limits. If a required rule is not configured, report “rule configuration missing” instead of guessing.
Recommended outputs include approved intake, actual count, remaining configured capacity, category-wise counts where relevant, possible overage, rule version, source reference, and an exception case if the threshold is exceeded. A capacity digital twin allows a user to propose a number of additional admissions and see the simulated effect without changing actual enrolment records.

## 11.4 Explainable rule example
NOTE: Example: Rule CAP-01 checks the counted enrolments for a specified institution, programme, academic year, and configured category against the approved limit in rule version 2026-27.v1. If the count exceeds that limit, the system creates a “capacity review required” case and stores the counts and rule source. It does not declare a legal violation until the authorized reviewer confirms the applicable rule and context.

# 12. Technical Architecture and Stack

## 12.1 Recommended stack

Layer | Technology | Responsibility
--- | --- | ---
Frontend | React with Vite; HTML, CSS, JavaScript | Institution/admin/verifier portals, upload screens, dashboards, case review, reports.
Backend | Node.js + Express.js | REST API, validation services, role checks, case workflow, business rules, adapter orchestration.
Database | PostgreSQL | Institution/programme/year data, student identity references, enrolments, cases, rule versions, audit events.
Integration | REST adapter interfaces; mock adapters for prototype | Normalize calls to APAAR/ABC, institution ERP, and AICTE-side systems when authorized.
Security | RBAC, validated input schemas, secure session/token handling, secret management, audit logging | Least privilege, access checks, protection of personal data, traceable activity.
Packaging | Docker-ready application and migration scripts | Repeatable local and future controlled deployment.
Prototype hosting | Frontend on Vercel; backend on Render/Railway or equivalent; managed PostgreSQL | Demonstration deployment. Production choice must follow institutional/security approval.

## 12.2 Logical architecture
User portals (institution, regulatory/admin, authorized verifier, optional student self-service) → React UI → Express REST API → authorization middleware → domain services (student records, import validation, intake rules, duplicate detection, case management, reporting, verification) → PostgreSQL. External integrations are isolated behind APAAR/ABC, institution ERP, and AICTE adapters. All critical actions produce audit events. A background worker may process larger uploads, reconciliation jobs, and retryable adapter tasks.

## 12.3 Suggested backend service boundaries
• Auth and authorization service: sign-in, role assignment, institution scope, permission checking.
• Institution/master-data service: institution, programmes, academic years, intake rule configuration.
• Ingestion service: upload validation, column mapping, batch status, row-level error report, idempotent re-upload.
• Validation/rules service: versioned rules and structured findings.
• Duplicate service: candidate generation, match evidence, reviewer disposition.
• Exception service: assignments, state machine, correction requests, comments, resolution reasons.
• Integration service: adapter registry, simulated/live mode, retries, reconciliation logs, health status.
• Verification/reporting service: scoped verification response, short-lived token, dashboards and exports.
• Audit service: append event for each sensitive or consequential action.

## 12.4 Suggested REST endpoint groups

Endpoint group | Example routes | Notes
--- | --- | ---
Auth and users | POST /api/auth/login; GET /api/me; GET/POST /api/users | Protect user creation and role assignment; do not allow self-elevation.
Institutions and programmes | GET/POST /api/institutions; GET/POST /api/programmes; GET/POST /api/academic-years | Scope institution users to their own institution.
Intake and rules | GET/POST /api/intake-rules; POST /api/intake-rules/:id/publish | Rule publishing needs authorized role and version history.
Student records/enrolment | GET/POST /api/students; GET/POST /api/enrolments; PATCH /api/enrolments/:id | Prefer separate student identity and enrolment objects.
Bulk ingestion | POST /api/import-batches; GET /api/import-batches/:id; GET /api/import-batches/:id/errors | Use upload-size limits, schema validation, idempotency and row-level feedback.
Validation and cases | POST /api/validation/run; GET /api/validation/results; GET/POST /api/cases; PATCH /api/cases/:id/status | Record rule version, reasons, reviewer, and resolution.
Duplicate review | GET /api/duplicates/candidates; POST /api/duplicates/:id/disposition | Enforce cross-institution permissions and log reviewer decisions.
Integration jobs | GET /api/integrations/status; POST /api/integrations/:adapter/test; GET /api/integration-jobs | Expose simulated/live mode; never expose tokens/secrets.
Verification | POST /api/verification-tokens; GET /api/verify/:token | Opaque token, expiry, revocation, audience/purpose and minimal response.
Reports and audit | GET /api/reports/intake; GET /api/reports/data-quality; GET /api/audit-events | Restrict sensitive reports and exports to approved roles.
These are proposed endpoint examples, not an official AICTE API specification. Align naming, payloads, authentication, and API contracts with the actual authorized specifications if integration is approved.

# 13. Security, Privacy, and Governance
The PS explicitly asks for data security, privacy, authentication, role-based access control, audit trails, and consent mechanisms. The following are design controls, not a claim that the prototype is already certified or legally compliant. Use the current official law, applicable commencement notifications, institutional rules, and formal security review before production. [R7–R8]

## 13.1 Minimum security controls
• Authentication: secure sign-in, password hashing through a modern password-hashing algorithm if passwords are stored, safe session lifecycle, rate limiting, and account disable/revocation.
• Authorization: enforce role and institution scope on every API endpoint and record operation; implement object-level checks, not merely UI hiding.
• Least privilege: external verifiers receive only the minimum fields needed for their permitted purpose; institution operators cannot view other institutions unless specifically authorized.
• Input and upload security: schema validation, file type and size limits, formula-injection prevention in exports, malware scanning where available, and safe error handling.
• Data protection: TLS in transit, managed secrets, encryption at rest where supported, secure backups, masked identifier display, and restricted access to key material.
• Audit: log authentication and authorization events, imports, exports, record edits, rule changes, duplicate dispositions, verification requests and reviewer decisions. Keep audit logs protected from ordinary edits.
• API protection: apply OWASP API Security Top 10 guidance, especially object-level authorization, broken authentication, property-level authorization, rate limiting, API inventory management, and safe consumption of upstream APIs. [R9]
• Operational security: separate demo and production environments; keep secrets out of source control and logs; patch dependencies; run dependency and security checks; prepare backup and incident procedures.
• Privacy by default: collect the minimum necessary fields, define a purpose for each data element, set retention and deletion rules, and restrict exports.
• Consent/notice handling: capture a suitable notice/consent record when applicable to the authorized use case. Do not assume that a checkbox alone establishes the legal basis for every regulatory processing activity.

## 13.2 APAAR identifier safeguards
• Keep APAAR status distinct from an ID format check and from an official external verification response.
• Show a masked identifier in routine tables; reveal the full value only to roles that are explicitly authorized and have a business need.
• For matching, consider a keyed HMAC token rather than a plain hash. Store encryption keys and HMAC secrets outside the database and restrict access.
• Never put a full APAAR ID or student profile into a publicly scannable QR payload. Use an opaque random token that the server resolves and can expire or revoke.
• Log the verifier, time, purpose where required, token scope, and fields disclosed.
• Use synthetic identifiers and synthetic student data throughout the public hackathon demo.

# 14. User Interface and Dashboards

Screen | Main content | Primary actions
--- | --- | ---
Login and role landing page | Current user, role, institution scope, notice and session controls. | Sign in; open permitted workspace.
Institution dashboard | Total uploads, accepted rows, records needing correction, exception queue, intake summary. | Upload batch; review errors; open cases.
Student/enrolment workspace | Search, filters, institution/programme/year, masked APAAR state, enrolment/category status. | View permitted record; request correction; open evidence.
Bulk import wizard | Template download, column mapping, dry run, batch progress, row-level error file. | Validate file; confirm import; download errors.
Validation results | Issue type, severity, rule ID/version, explanation, affected fields, next action. | Assign/submit for review; correct; re-run checks.
Duplicate review workbench | Two or more records side by side, match reason, scope, statuses and provenance. | Confirm, dismiss, request information, or escalate.
Intake capacity dashboard | Approved intake, current enrolled counts, configured category/supernumerary values, capacity scenario. | Run what-if scenario; create review case.
Exception management | Case owner, state, aging, comments, evidence, correction request and resolution reason. | Assign; request correction; resolve; reopen/escalate.
Integration health centre | Adapter mode, sync attempts, last status, record counts, retries, error summaries. | Test mock connector; retry safe job; view reconciliation report.
Authorized verification page | Minimum identity and record facts permitted for the verifier; source/status label; expiry. | Verify a reference; record access; report mismatch.
Regulatory analytics | Institution and programme filters; intake status; issue categories; trends; audit summary. | Generate/ export permitted report.
Certificate/record preview | Mock student ID with APAAR ID display/masking per configured policy. | Preview printable layout using synthetic records.

# 15. Integration Strategy

## 15.1 Adapter-first design
Define an internal adapter contract such as: validateIdentifier(input) → typed result; fetchStudentReference(input) → minimal normalized response; sendStudentRecords(batch) → accepted/rejected summary; fetchSyncStatus() → status and timestamps. The precise names and payloads must be changed to match the officially documented API after access is granted. The domain logic should not depend on provider-specific fields or error codes.

## 15.2 Prototype adapter modes

Mode | Behaviour | How the UI must label it
--- | --- | ---
Local validation | Checks shape and consistency within the submitted data and configured rules. | “Local validation — not an official APAAR check.”
Simulated external adapter | Returns fixed, synthetic success/failure examples so workflows can be demonstrated. | “Simulated integration — no live government call made.”
Authorized live adapter | Calls official documented service with approved credentials and scopes, when available. | “Official external result” only when the response truly comes from that system and can be traced.

## 15.3 Reconciliation and reliability
• Assign an idempotency key to each outbound batch so retries do not create duplicates.
• Record batch totals: submitted, accepted, rejected, pending, and error rows.
• Use bounded retries with backoff for retryable failures; route persistent failures to a visible exception queue.
• Keep a correlation ID across UI action, backend operation, adapter call, and audit record.
• Never interpret timeouts as successful official verification; show unavailable/unknown until reconciled.
• Protect API credentials in a secret manager/environment configuration, never in client-side React code.

# 16. Implementation Roadmap and Priorities
The best strategy is a complete, well-explained core flow first, then additional differentiators. This increases the chance of a functioning prototype and avoids a broad feature list with shallow or non-working screens.

Priority / phase | Implement | Definition of done
--- | --- | ---
Phase 0 — Foundation | Repo, linting, database schema/migrations, local env, sample synthetic dataset, shared UI shell, role model. | Application starts reproducibly; seed data loads; environment variables and migration instructions are documented.
Phase 1 — Master data and access | Login, RBAC, institution/programme/year setup, intake-rule configuration, basic audit events. | Institution users are scoped; admin and institution roles see different permissions.
Phase 2 — Student ingestion | Student/enrolment CRUD, CSV/Excel template, row validation, dry run, import batch history and error report. | Upload demo file, inspect errors, correct rows, import clean records, and trace the batch.
Phase 3 — Rules and core monitoring | Missing/invalid APAAR format state, inconsistency checks, exact duplicate candidates, intake comparison, dashboards. | Known seeded test cases trigger the expected rules with a visible explanation.
Phase 4 — Predict–Explain–Resolve | Exception cases, owner assignment, review notes, correction/resubmission, resolution states, audit history. | A flagged record can be followed through the entire review lifecycle.
Phase 5 — Verification and reporting | Limited verifier portal, opaque QR/reference token, report export, certificate/record preview with synthetic IDs. | A verifier can only see permitted fields; token expires or revokes; use is logged.
Phase 6 — Additional differentiators | Integration health centre, capacity simulation, year-over-year change intelligence, guided correction, advanced duplicate review. | Each feature has an explicit, testable workflow and does not bypass authorization.
Phase 7 — Optional advanced feature | Grounded compliance copilot using a curated rule/reference set with citations and refusal when unsupported. | Every answer links to source/version; no unsupported answer or automatic binding decision.

## 16.1 MVP must-have checklist
• Role-based login and institution scope.
• Institution, programme, academic-year and approved-intake setup.
• Student/enrolment records with APAAR status explicitly labelled.
• CSV/Excel upload with row-level validation errors.
• Validation results and explainable reason codes.
• Exact duplicate candidate detection and human-review disposition.
• Approved-intake comparison with configurable rules.
• Exception lifecycle and audit trail.
• Institution/regulatory dashboard and sample report export.
• Mock integration adapter with simulated/live labels.
• Working demo route and known synthetic test cases.

## 16.2 Stretch features (only after core flow is reliable)
• Integration health and reconciliation dashboard.
• Capacity digital twin with what-if simulation.
• Academic-year change intelligence.
• Privacy-preserving QR/reference with expiry and revocation.
• Guided data-correction assistant.
• Compliance copilot grounded in a curated official-source collection.
• More sophisticated record matching beyond exact identifier matches.
NOTE: Recommended trade-off: demonstrate five complete workflows rather than ten decorative modules. A feature only counts as part of the prototype if the user can complete the workflow and see the stored result.

# 17. Test Plan and Impact Measurement

## 17.1 Functional test scenarios

Test | Setup | Expected result
--- | --- | ---
Valid bulk upload | Clean synthetic CSV with institution/programme/year mapped. | Rows import; batch counts and audit events update.
Missing APAAR field | Student row has no identifier. | Format/status flag is shown; no official verification claim.
Invalid APAAR format | Identifier does not match expected local pattern. | Local format failure appears with correction guidance.
Duplicate within batch | Two synthetic enrolments use the same protected identifier token. | Duplicate candidate is created and routed to review.
Cross-institution candidate | Same synthetic identity appears in two institutional records. | Cross-scope match is visible only to authorized reviewer; it is not auto-labelled fraud.
Intake excess | Configured rule capacity is lower than test enrolment count. | Capacity case appears with counts and rule version.
Special category/supernumerary | Test data crosses a configured category-specific threshold. | Configured rule runs; missing configuration produces a configuration warning rather than an invented result.
Role restriction | Institution A user requests Institution B record. | Backend denies access and writes an appropriate security event.
Mock adapter error | Simulated external endpoint returns timeout or error. | Status stays unavailable/pending; retry/reconciliation is visible.
QR expiry/revocation | Use expired or revoked token. | Verification response is refused or appropriately limited; access attempt is logged.
Record correction | Operator corrects a failed value and re-runs rules. | Original value/revision is traceable; case state and audit trail update.
Report export | Authorized user exports a report. | Only scoped data is exported; export event is audited.

## 17.2 Impact indicators and formulas

Indicator | Definition / calculation | Use
--- | --- | ---
Data validation coverage | Records processed by validation checks ÷ total uploaded records × 100. | Shows whether the process covers the whole intake.
Incomplete-record rate | Records missing at least one required field ÷ total records × 100. | Track data quality before and after guided correction.
Duplicate-review workload | Number of candidate pairs/cases sent to human review, by match type. | Measure investigation volume and false-positive burden.
Confirmed duplicate rate | Confirmed duplicate cases ÷ duplicate cases reviewed × 100. | Estimate how useful candidate generation is; interpret with sample size.
Exception-resolution time | Median time from case creation to closure; also report unresolved aging. | Measure workflow efficiency without inventing baseline.
Audit-trail completeness | Relevant actions with required audit fields ÷ relevant actions sampled × 100. | Check traceability coverage.
Integration reconciliation | Jobs reconciled successfully ÷ jobs attempted × 100, separated by simulated/live mode. | Measure adapter reliability only for the mode actually used.
For the prototype, report measured counts and percentages after running a defined synthetic test set. Do not put a result on the PPT before measurement. Include the sample size, test setup, and limitations if reporting performance.

# 18. Risks and Mitigations

Risk | Potential effect | Mitigation
--- | --- | ---
No official API access or credentials | Prototype may not perform government-side validation. | Use simulated adapters; label the mode; document the API boundary; pursue authorized integration only through the responsible organization.
Poor or inconsistent source data | High number of upload errors and unreliable counts. | Template standardization, schema validation, preview/dry-run, row-level errors, re-upload and provenance.
False-positive duplicate matches | Legitimate transfer or multiple enrolment might be mislabelled. | Separate exact and fuzzy matches; human review; explain evidence; support “not a duplicate” and “legitimate transfer” outcomes.
Incorrect or stale intake rules | False capacity exceptions or missed overages. | Version rules; record source and effective period; require authorized publishing; warn when configuration is missing.
Privacy leakage | Unauthorized disclosure of student identifiers or enrolment details. | Minimize fields; mask IDs; encrypt sensitive values; strict RBAC; limited QR output; audit access.
Security vulnerability in API | Unauthorized access, data exposure, abuse of endpoints. | Threat modelling, server-side authorization, rate limits, input validation, secret management, logging, and OWASP API security review. [R9]
Mock/live ambiguity | Judges or users may think the prototype performed official verification. | Persistent labels in UI, sample output and slides; status enum differentiates local, simulated and official results.
AI copilot hallucination | Incorrect regulatory guidance may be treated as authoritative. | Defer until core works; constrain to curated sources; source/version citations; unsupported-answer fallback; human approval.
Uncontrolled feature creep | Core workflows remain incomplete. | MVP gate; phase roadmap; implement a feature only when its test and demo path work.
Certificate representation misunderstood | Mock certificate may be mistaken for official issuance. | Use “prototype preview”; synthetic data; no official seal/signature; obtain institutional approval for production use.
Privacy/legal obligations change | The production design may not fit current rules or agency requirements. | Reconfirm current DPDP Act/Rules commencement, official instructions, institutional agreements and security review before live launch. [R7–R8]

# 19. Deployment and Operational Plan

## 19.1 Prototype environments

Environment | Purpose | Data and controls
--- | --- | ---
Local development | Develop and test UI/API/database. | Synthetic records only; local .env ignored by Git; no production API keys.
Shared demo / staging | Judge and mentor demonstration. | Seeded synthetic dataset; HTTPS; restricted admin account; non-production tokens; resettable database.
Production candidate (future) | Authorized institutional deployment after approval. | Formal hosting/security review, legal and privacy review, approved access controls, incident monitoring, backups, retention policy and official integration credentials.

## 19.2 Suggested deployment shape
• React/Vite frontend: static hosting such as Vercel for the prototype.
• Express API: Render/Railway or equivalent host with environment-based configuration.
• PostgreSQL: managed database with backups, restricted network access and migration scripts.
• Dockerfile/compose: repeatable local development and future controlled deployment.
• CI: lint, type/schema tests, unit tests, API tests and migration checks on every change.
• Observability: structured logs, request correlation IDs, health endpoint, basic error tracking; redact secrets and personal data.
• Backup/restore: document how demo data is reset and how a future production database is backed up and restored.

# 20. Prototype Demonstration Storyline
A strong demo follows one student record through the entire workflow. Use a small prepared synthetic dataset with known expected outcomes so the reviewer sees genuine logic rather than an empty dashboard.
Open the institution dashboard and show the institution, programme, academic year, and configured approved intake.
Upload a prepared CSV containing clean rows plus examples of a missing APAAR ID, invalid local format, repeated identifier, inconsistent programme/year value, and an intake boundary case.
Show the dry-run summary: total rows, valid rows, rows needing correction, and issues by rule code.
Open one flagged record and demonstrate Predict–Explain–Resolve: visible reason, evidence, rule version, and next action.
Open the duplicate review workbench and show both candidate records; select a reviewer outcome such as “needs investigation” or “legitimate transfer” rather than announcing fraud.
Open the intake dashboard and run a capacity what-if scenario. Show the configured rule and the resulting exception without hard-coding unknown seat policies.
Use the mock APAAR/ABC integration centre. Show a simulated response and explicitly state that no official API call occurred.
Create a prototype verification QR/reference token. Open it using an authorized verifier role and demonstrate limited fields; then show expiry/revocation or an access-denied case.
Export a sample report and inspect the audit trail showing upload, validation, case review, resolution, and verification access.
NOTE: Demo close: “EduTrace turns student data submission into an explainable, traceable review process. The prototype proves the workflow with synthetic data; official APAAR/ABC and AICTE connectivity is an authorization-dependent integration step.”

# 21. Six-Slide SIH Presentation Alignment

Slide | Purpose | Must communicate
--- | --- | ---
1. Title page | Identify project and team. | Exact PS ID/title, theme/category, registered team ID/name; keep to official template.
2. Proposed Solution | Explain the idea, problem, modules, innovation. | Problem understanding; student data management; intelligent verification; Predict–Explain–Resolve; duplicate review; intake simulation; evidence trail; prototype boundary.
3. Technical Approach | Show how components work. | React → Express API → PostgreSQL; adapter layer; validation logic; role/auth/audit; ingestion-to-report workflow.
4. Feasibility and Viability | Show practical build and risks. | Feasible stack; no official API assumption; risks and mitigations; staged implementation roadmap.
5. Impact and Benefits | Show users and measurable outcomes. | AICTE/regulators, institutions, students, authorized verifiers; quality, review transparency, intake monitoring, KPI definitions, no invented results.
6. Research and References | Demonstrate research basis. | Official PS portal, APAAR portal/FAQs, AICTE handbook, API Setu ABC catalogue, DPDP Act/Rules, OWASP API Security Top 10; prototype disclaimer.
The official SIH template was previously reviewed in this conversation: it calls for six presentation slides including the title slide and includes “Research and References” as Slide 6; the instruction slide is removable. Keep the provided template’s required pointers and check the latest submission instructions before uploading.

# 22. Decisions, Assumptions, and Non-Goals

## 22.1 Current decisions
• Project name: EduTrace (working name, can be renamed).
• Stack: React/Vite, Node.js/Express, PostgreSQL, Docker-ready deployment.
• Prototype data: synthetic only.
• External systems: mock adapters unless and until authorized access is supplied.
• Core approach: rules-first, explainable validation and human-reviewed exceptions.
• Signature differentiator: Predict–Explain–Resolve.
• Additional modules: capacity digital twin, integration health, provenance, privacy-preserving verification, academic-year change intelligence, guided correction, optional grounded compliance copilot.
• No claimed achieved performance percentages until measured.

## 22.2 Assumptions to validate
• The precise production API contracts and access process for APAAR/ABC/AICTE are not in the team’s possession at prototype design time.
• Approved intake and special category rules will need an authoritative source and a responsible rule owner.
• Institutions will have different source formats; the first release will need agreed import templates and mappings.
• External verifiers will need a defined business purpose and carefully restricted fields.
• Certificate display requirements and how APAAR ID is to appear must be checked against current institutional instructions before production.

## 22.3 Non-goals for the first prototype
• Generating APAAR IDs or replacing official APAAR enrolment/identity issuance workflows.
• Bypassing authorized government API access, CAPTCHA, authentication, or data-sharing terms.
• Automatic final decisions about fraud, admission eligibility, or compliance violations.
• Collecting Aadhaar or unrelated sensitive attributes just because they may appear in other education workflows.
• Claiming certification, production approval, official AICTE/APAAR endorsement, or government security accreditation.

# 23. Research References
Research status date: 25 October 2026. The official SIH portal is the governing source for the official problem statement and submission requirements. A public transcription/reference page was also reviewed for the detailed requirement text because the official page did not render fully in the research tool at the time of preparation. Before submission, confirm that the exact wording, title, deadline and current instructions match the SIH portal.
R1. Smart India Hackathon 2026 problem statement portal: https://www.sih.gov.in/sih2026PS — Primary place to confirm the official problem statement ID, wording and submission details.
R2. SIH26263 public problem-statement transcription/reference: https://zaidsayyed.in/tools/sih-problem-statements/sih26263 — Secondary reference used to review the detailed PS description and numbered requirements; not an official government source.
R3. APAAR official portal: https://apaar.education.gov.in/ — Official explanation of APAAR academic identity; portal describes APAAR as a unique 12-digit code.
R4. APAAR official FAQs: https://apaar.education.gov.in/faqs — Official FAQ material on APAAR, identity handling and related education processes.
R5. Academic Bank of Credits on API Setu: https://directory.apisetu.gov.in/api-collection/abc — Catalogue includes ABC/APAAR-related API listings. Catalogue presence does not grant credentials or production access.
R6. AICTE Approval Process Handbook 2024–2027: https://aicte.gov.in/sites/default/files/APH%20Final.pdf — Reference for institutional approval and approved-intake context; confirm the applicable rule/version before encoding rules.
R7. Digital Personal Data Protection Act, 2023 — India Code: https://www.indiacode.nic.in/indiacode/handle/123456789/22037?view_type=browse — Official legislation reference. Confirm applicable commencement provisions and current amendments/notifications before production.
R8. MeitY Act and Policies / Digital Personal Data Protection Rules, 2025: https://www.meity.gov.in/documents/act-and-policies/digital-personal-data-protection-rules-2025-gDOxUjMtQWa?pageTitle=Digital-Personal-Data-Protection-Rules-2025-2 — Official ministry page for the 2025 Rules and related documents; current applicability and commencement should be checked.
R9. OWASP API Security Top 10 (2023): https://api-security.owasp.org/editions/2023/en/0x11-t10/ — Security design guidance for API risks such as broken object-level authorization, broken authentication, and unsafe API use.
R10. APAAR FAQ: generation / status information: https://apaar.education.gov.in/faqs — Use as background only; this EduTrace prototype is not an APAAR generation service.
NOTE: Source discipline: distinguish (a) requirements from the PS, (b) facts from official reference sources, and (c) proposed product design. Do not present proposed features as official AICTE requirements unless the PS or authorized guidance says so.

# 24. Glossary

Term | Meaning in this document
--- | ---
APAAR | Automated Permanent Academic Account Registry; national academic identity described by official APAAR sources.
ABC | Academic Bank of Credits; API Setu lists ABC-related API capabilities. Access requires the relevant approval/credentials.
AICTE | All India Council for Technical Education, the sponsoring organization context for this problem statement.
RBAC | Role-Based Access Control; permissions assigned based on job role and scope.
REST API | HTTP-based interface used for communication between the frontend, backend and authorized adapters.
Adapter | A replaceable software component that translates an external system’s API into EduTrace’s normalized internal model.
Synthetic data | Invented records created for testing and demonstration; not real student information.
Provenance | Traceable information about the source, transformations, checks and decisions associated with a record.
Digital twin / what-if simulation | A model that estimates the effect of proposed admissions against configured rules without changing authoritative records.
HMAC | Keyed hash used to produce a stable matching token without storing a plain, easily guessed hash of an identifier.
Human-in-the-loop | A workflow in which software flags and explains potential issues, while an authorized person makes the consequential decision.
DPDP | Digital Personal Data Protection Act and related Rules; current applicability should be checked with the official sources.
OWASP API Security Top 10 | Security awareness reference listing common API risk categories and mitigation considerations.