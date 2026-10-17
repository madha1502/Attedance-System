# Institutional Attendance Management System (IAMS) - Phase 1

Phase 1 provides the foundation for the college attendance platform:
1. **Startup Screen**: Displays the college logo/seal with an animated academic welcome screen and countdown.
2. **Login Screen**: Department-based authentication with credential verification.
3. **Department-Based Access**: Identifies and scopes the active department (`dept_cse`, `dept_mech`, `dept_ece`, etc.), setting the session boundary for Phase 2 attendance tracking.

---

## 🚀 How to Run the Application

This project uses a standard, lightweight stack: **React 19 + TypeScript + Vite + Tailwind CSS**. It has zero complex external database dependencies for Phase 1 and runs smoothly on any machine.

### Prerequisites
- Node.js (v18 or higher recommended)
- npm or bun

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Start the Development Server
```bash
npm run dev
```
Open your browser at `http://localhost:3000`.

### Step 3: Production Build
```bash
npm run build
npm run preview
```

---

## 📍 File Locations & Where to Replace Placeholders

| Asset / Configuration | File Path | Instructions |
| :--- | :--- | :--- |
| **College Logo** | `/public/logo.png` | Replace this file with your official college emblem / crest (transparent PNG, recommended 256x256 or 512x512). If absent, it automatically renders the SVG seal at `/public/logo.svg`. |
| **College Metadata** | `/src/config/departments.config.ts` | Edit `COLLEGE_CONFIG` to change college name, motto, campus code, accreditation, and academic year. |
| **Departments & Credentials** | `/src/config/departments.config.ts` | Edit `DEPARTMENTS` array (department names, codes, sections, coordinators) and `DEPARTMENT_CREDENTIALS` (hashed logins). |
| **Authentication Logic** | `/src/context/AuthContext.tsx` | Provides `useAuth()` hook with `session`, `activeDepartment`, `login()`, and `logout()`. |
| **Cryptographic Utilities** | `/src/utils/crypto.ts` | Salt generation and salted SHA-256 verification using the standard Web Crypto API. |

---

## 🔒 How Credentials are Stored & Managed

Passwords are **never stored or handled in plain text**:
1. Each department has a random 16-byte cryptographic salt (hex-encoded).
2. When creating credentials, the password is encrypted via:
   $$\text{passwordHash} = \text{SHA-256}(\text{salt} + \text{":"} + \text{plainTextPassword})$$
3. During login, the input password is concatenated with that department's stored salt, hashed with SHA-256, and compared against the stored hash in **constant time** (`timingSafeEqual`) to protect against timing attacks.

---

## 🔑 Department Password Recovery Flow

For forgotten credentials:
1. Click **"Forgot password?"** next to the password input on the Login Screen.
2. Enter the department coordinator email address (e.g. `hod.cse@vsbec.ac.in`). Quick autofill chips are provided for test coordinator emails.
3. The modal launches an interactive **6-second countdown timer** simulating mail server routing and MX record validation, complete with animated progress ring and step milestones.
4. **Responsive Controls:** Users can click **"Instant Deliver (Skip Waiting)"** to bypass the countdown immediately, or pause/cancel anytime without freezing the UI.
5. Once delivered, an institutional email preview displays with a 15-minute secure token reset link (`https://vsbec.ac.in/portal/auth/reset?token=...`).
6. Click **"Simulate Clicking Reset Link"** to interactively set and confirm a new 8+ character department password, which automatically updates the login form for immediate authentication.

---

## ➕ How to Add a New Department

To add a new department (e.g., *Biotechnology & Bioengineering*, code `BT`, username `dept_biotech`, password `BioTech@2026`):

### Option A: Using the In-App Live Generator (Recommended)
1. In the app, click **"Credentials & Setup Guide"** in the top-right corner.
2. Switch to the **"Hash Generator & Add Dept"** tab.
3. Type the department details and password.
4. Click **"Copy Code Snippet"** and paste it directly into `/src/config/departments.config.ts`.

### Option B: Manual Configuration
Open `/src/config/departments.config.ts`:

1. Append the new department definition to the `DEPARTMENTS` array:
```typescript
{
  id: 'biotech',
  name: 'Biotechnology & Bioengineering',
  code: 'BT',
  defaultSection: 'Section BT-1 (Batch 2023-2027)',
  coordinatorName: 'Dr. Jane Foster, Ph.D.',
  coordinatorEmail: 'hod.biotech@aits.edu',
  accentColor: '#059669',
  isActive: true,
}
```

2. Generate a random salt (e.g. 16 hex bytes) and the SHA-256 hash of `salt:password`.
3. Append the credential entry to `DEPARTMENT_CREDENTIALS`:
```typescript
{
  username: 'dept_biotech',
  departmentId: 'biotech',
  salt: 'your_generated_salt_hex',
  passwordHash: 'your_computed_sha256_hash',
  label: 'Biotechnology Dept Office',
  samplePasswordHint: 'BioTech@2026',
}
```
4. Save the file. The new department is immediately active on the login screen and can log in without any server restart.

---

## 📋 Default Sample Department Credentials (Pre-Configured)

You can click any of the 1-click test chips on the login screen or use these credentials:

| Department | Username | Sample Password | Section Scoped |
| :--- | :--- | :--- | :--- |
| **Computer Science & Engineering (CSE)** | `dept_cse` | `CsePass@2026` | Section A & B |
| **Artificial Intelligence & Data Science (AI & DS)** | `dept_aids` | `AiDsPass@2026` | Section AI-1 |
| **Information Technology (IT)** | `dept_it` | `ItPass@2026` | Section IT-1 |
| **Electronics & Comm. (ECE)** | `dept_ece` | `EcePass@2026` | Section ECE-A |
| **Electrical & Electronics (EEE)** | `dept_eee` | `EeePass@2026` | Section EEE-1 |
| **Mechanical Engineering (MECH)** | `dept_mech` | `MechPass@2026` | Section MECH-1 |
| **Civil Engineering (CIVIL)** | `dept_civil` | `CivilPass@2026` | Section CIVIL-1 |
| **Biomedical Engineering (BME)** | `dept_bme` | `BmePass@2026` | Section BME-1 |

---

## 🔮 Phase 2 Readiness (No Login Rewrite Needed)

The application architecture isolates authentication into `AuthContext`:
- In Phase 2, attendance marking components, student rosters, and report exporters can simply consume:
  ```typescript
  import { useAuth } from './context/AuthContext';

  function AttendanceRollCall() {
    const { activeDepartment } = useAuth();
    // activeDepartment.id => 'cse'
    // activeDepartment.code => 'CSE'
    // activeDepartment.defaultSection => 'Section A & B'
  }
  ```
- All Phase 2 tables, queries, and filters will automatically receive the authenticated department context with zero changes required to Phase 1.
