# EduTrace — APAAR ID-Based Student Data Management & Verification Platform
**AICTE — Regulation Bureau | Signature: *Predict · Explain · Resolve***

---

## 🏛️ Executive Summary

**EduTrace** is an enterprise-grade regulatory, data management, and verification platform designed for AICTE-approved institutions and regulatory bureaus. It links students' **Automated Permanent Academic Account Registry (APAAR / ABC)** identifiers with institutional admission records, approved intake limits, supernumerary allowances (NRI, OCI, Foreign Nationals), and multi-layer compliance verification.

The platform embodies the AICTE triad:
1. **Predict:** Multi-layer rules engine flags format mismatches, duplicate tokens across campuses, and approved intake breaches *before* admissions are solidified.
2. **Explain:** Every compliance flag provides plain-English regulatory reasoning, rule codes (e.g. `CAP-01`, `DUP-02`), and citations from the AICTE Approval Process Handbook (APH).
3. **Resolve:** A full-lifecycle exception management workbench, guided data-correction assistant, and side-by-side duplicate workbench enable structured resolution with complete audit trails.

---

## 🚀 Live Cloud Deployment Stack (Configured & Ready)

| Layer | Service Provider | Configuration File | Notes |
|---|---|---|---|
| **Database** | **Neon PostgreSQL** | `server/prisma/schema.prisma` | Serverless PostgreSQL with SSL connection pooling |
| **Backend API** | **Render** | `render.yaml` | Node.js web service, auto-deploy, `/api/health` check |
| **Frontend UI** | **Vercel** | `vercel.json` | React + Vite with automatic `/api/*` reverse proxy |
| **Source Control** | **GitHub** | `.gitignore`, monorepo | Clean root workspace for backend and frontend |

---

## 🔑 Demo Personas (Pre-seeded in DB)

The system includes pre-configured credentials across all 5 operational roles:

| Role | Email | Password | Intended Workflow |
|---|---|---|---|
| **Platform Admin** | `admin@edutrace.demo` | `Demo@Admin1` | Central AICTE Bureau: National intake oversight, cross-institution duplicate review, integration telemetry. |
| **Institution Admin** | `inst.admin@apextech.demo` | `Demo@Inst1` | Apex Institute of Technology: Intake quota monitoring, digital twin simulation, exception case resolution. |
| **Data Operator** | `operator@apextech.demo` | `Demo@Oper1` | Registrar Office: Bulk CSV/Excel student upload, dry-run error fixing, record enrollment. |
| **Authorized Verifier**| `verifier@edutrace.demo` | `Demo@Verif1` | Employer / University: QR-based privacy-preserving academic credential verification. |
| **Student** | `student@apextech.demo` | `Demo@Stud1` | Academic identity inspection, printable AICTE certificate preview. |

---

## 📐 Architecture & Key Features

### 1. Cryptographic Privacy & APAAR Storage
- **No Plaintext APAARs in Database:** Stored using AES-256-CBC encryption.
- **HMAC-SHA256 Tokenization:** Exact duplicate matching across institutions is performed using cryptographic HMAC tokens (`apaarHmacToken`), ensuring data is never leaked between competing institutions.
- **Privacy Display Masking:** Default interfaces show masked values like `DEMO-APAAR-****01` or `****89012`.

### 2. The 8 APAAR Identity Lifecycle States
1. `MISSING`: No identifier provided in upload.
2. `INVALID_FORMAT`: Does not match 12-digit numeric or demo specification.
3. `LOCAL_ACCEPTED`: Valid format and tokenized successfully.
4. `POTENTIAL_DUPLICATE`: Matching HMAC token found in existing active records.
5. `SIMULATED_PASS`: Mock adapter verified token integrity.
6. `SIMULATED_FAIL`: Mock adapter returned format rejection.
7. `PENDING_OFFICIAL`: Queued for official government verification.
8. `OFFICIALLY_UNAVAILABLE`: Live government credentials pending authorization.

### 3. Intake Capacity Engine & Digital Twin Simulator
- Real-time comparison between active enrollments and `IntakeConfiguration.approvedIntake`.
- Statutory sub-limits: NRI (max 5%), OCI/PIO, and 15% supernumerary allowance.
- **What-If Digital Twin:** Interactive simulation that models hypothetical admissions by category without writing to the database. All responses carry the prominent `PROJECTION_NOT_OFFICIAL` watermark.
- **Year-over-Year (YOY) Intelligence:** Automatic detection of sudden >30% intake surges or unexpected zero-enrolment declines.

### 4. 5-Step Bulk Data Import Wizard
1. **Upload:** Accepts CSV and Excel files with size checks and sample template download.
2. **Preview:** Real-time preview of parsed columns and rows.
3. **Dry-Run Engine:** 5-layer checks (columns, Zod field schema, APAAR format, duplicate check, capacity check) showing accepted, flagged, and rejected counts.
4. **Confirm:** Explicit user confirmation before inserting into PostgreSQL.
5. **Commit & Provenance:** Atomic transaction logging provenance batch IDs.

### 5. Privacy-Preserving Opaque QR Verification
- Generating a verification token produces an opaque UUID reference (`/verify/:tokenRef`).
- The QR payload contains **only** this URL reference — never student PII or raw APAAR numbers.
- Time-bound expiry (7, 30, 90 days), single-use option, and granular disclosure permissions.
- Public `/verify/:tokenRef` portal allows instant credential checking for employers.

### 6. AI Compliance Copilot (Rule-Grounded)
- Floating assistant grounded in the AICTE Approval Process Handbook (APH) and active validation rules.
- Answers regulatory questions regarding quotas, supernumerary seats, and rule codes (`CAP-01`, `DUP-02`, `FMT-01`).
- Disclaimer: Grounded in AICTE guidelines — not legal advice.

---

## 🛠️ Step-by-Step Deployment Instructions

### Step 1: Create Free Neon PostgreSQL Database
1. Go to [https://neon.tech](https://neon.tech) and create a free project named `edutrace`.
2. Copy the **Connection String** (e.g., `postgresql://username:password@ep-xxxx.region.aws.neon.tech/edutrace?sslmode=require`).

### Step 2: Push Code to GitHub
```bash
git init
git add .
git commit -m "feat: complete EduTrace platform"
git branch -M main
git remote add origin https://github.com/<your-username>/<your-repo-name>.git
git push -u origin main
```

### Step 3: Deploy Backend on Render
1. Go to [https://render.com](https://render.com) and click **New > Blueprint** (or **New > Web Service**).
2. Connect your GitHub repository.
3. Render will automatically read `render.yaml` with settings:
   - **Root Directory:** `server`
   - **Build Command:** `npm install && npx prisma generate && npx prisma migrate deploy`
   - **Start Command:** `npm start`
4. In Render Dashboard, add Environment Variables:
   - `DATABASE_URL`: *(Your Neon PostgreSQL connection string)*
   - `APAAR_ENCRYPTION_KEY`: `MDEyMzQ1Njc4OTAxMjM0NTY3ODkwMTIzNDU2Nzg5MDE=` *(32-byte base64 key)*
   - `APAAR_HMAC_SECRET`: *(Any secure random 32-character string)*
   - `JWT_SECRET`: *(Any secure random 32-character string)*
   - `FRONTEND_ORIGIN`: `https://<your-app>.vercel.app`
   - `INTEGRATION_MODE`: `SIMULATED`
5. Click **Deploy**. Note your Render URL (e.g. `https://edutrace-api.onrender.com`).
6. Seed database on Render:
   In the Render Web Shell (or locally connected to Neon), run:
   ```bash
   node prisma/seed.js
   ```

### Step 4: Deploy Frontend on Vercel
1. Go to [https://vercel.com](https://vercel.com) and click **Add New > Project**.
2. Select your GitHub repository.
3. Vercel automatically detects `vercel.json`:
   - **Framework Preset:** Vite
   - **Root Directory:** `./`
   - **Output Directory:** `client/dist`
4. In Vercel Environment Variables:
   - `VITE_API_URL`: `https://<your-render-backend-url>.onrender.com/api`
5. Click **Deploy**!

---

## 💻 Local Development Setup

### Prerequisites
- Node.js (v18 or v20+)
- npm v9+

### Option A: Standard Local Setup
```bash
# 1. Install root, server, and client dependencies
npm run install:all

# 2. Configure server/.env (copy from .env.example)
cd server
cp ../.env.example .env
# Set DATABASE_URL to your local or Neon PostgreSQL instance

# 3. Generate Prisma client, run migrations, and seed demo records
npx prisma generate
npx prisma migrate dev --name init
npm run seed

# 4. Run tests to verify setup
npm test

# 5. Start both Backend and Frontend concurrently from root
cd ..
npm run dev
```
- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:5000/api`
- Health check: `http://localhost:5000/api/health`

### Option B: Docker Compose
```bash
docker-compose up --build
```

---

## 🧪 Automated Test Suite

Run unit and integration tests:
```bash
cd server
npm test
```
Test coverage includes:
- APAAR format validation (12-digit numeric & synthetic `DEMO-APAAR-*` tokens)
- Deterministic HMAC-SHA256 duplicate generation
- AES-256 reversible encryption and decryption
- Opaque verification token generation and hash verification
- API Health check (`GET /api/health`) and structured 404/401 error handlers

---

## 🛡️ Simulation vs Official Integration Notice

In compliance with SIH guidelines and national data privacy standards:
- **No live credentials** for official government portals (NAD, DigiLocker, ABC) are hardcoded.
- All external adapters (`APAAR_ABC`, `INSTITUTION_ERP`, `AICTE`) run in explicit **SIMULATED** mode.
- Any generated verification certificate or QR reference prominently carries the watermark:
  > **"EDUTRACE PROTOTYPE — NOT AN OFFICIAL GOVERNMENT CERTIFICATE"**

---

## 👥 Contributors & SIH 2026 Team
Built for **Smart India Hackathon 2026** • Problem Statement ID: **26263**  
*Regulation Bureau, All India Council for Technical Education (AICTE)*
