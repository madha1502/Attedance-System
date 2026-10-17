/**
 * Type definitions for College Attendance Management System (Phase 1).
 *
 * Designed with strict separation of concerns so that Phase 2 (daily marking,
 * rosters, reports, biometric sync) directly consumes these scoped interfaces
 * without requiring any refactoring of Phase 1 login or credentials.
 */

export interface CollegeConfig {
  name: string;
  shortName: string;
  motto: string;
  accreditation: string;
  academicYear: string;
  campusCode: string;
  autonomousStatus?: string;
  researchInstituteStatus?: string;
  approvals?: string;
  nbaNaac?: string;
  location?: string;
  /**
   * Logo image asset path (default: '/logo.png').
   * If the file is not found, the app gracefully falls back to the embedded SVG crest.
   */
  logoPath: string;
  supportEmail: string;
}

export interface Department {
  /** Unique departmental identifier, e.g., 'cse', 'mech' */
  id: string;
  /** Formal department name, e.g., 'Computer Science & Engineering' */
  name: string;
  /** Short acronym code, e.g., 'CSE' */
  code: string;
  /** Department section / batch assignment */
  defaultSection: string;
  /** Head of Department or Attendance Coordinator name */
  coordinatorName: string;
  coordinatorEmail: string;
  coordinatorDesignation?: string;
  coordinatorPhone?: string;
  coordinatorCabin?: string;
  /** Departmental color accent for UI badges */
  accentColor: string;
  /** Current active status */
  isActive: boolean;
}

export interface DepartmentCredential {
  /** Login username, e.g., 'dept_cse' */
  username: string;
  /** Corresponds to department.id */
  departmentId: string;
  /** Cryptographic random salt (hex string) */
  salt: string;
  /** SHA-256 salted hash of the password (never plain text!) */
  passwordHash: string;
  /** Notes for administrators */
  label?: string;
  /**
   * Note on default sample password provided for initial testing.
   * This property is for developer reference in the setup guide.
   */
  samplePasswordHint?: string;
}

export type AcademicYearRoman = 'I' | 'II' | 'III' | 'IV';

export interface LoginCredentials {
  username: string;
  year: AcademicYearRoman;
  section: string;
  password: string;
}

export interface AuthSession {
  /** Unique session token */
  token: string;
  /** Role of the authenticated user: 'admin' or 'faculty' */
  role: 'admin' | 'faculty';
  /** The authenticated department object scoping the session (or institutional admin scope) */
  department: Department;
  /** Authenticated username */
  username: string;
  /** Academic class year: I, II, III, or IV */
  year: AcademicYearRoman;
  /** Single uppercase section character, e.g., 'A', 'B', 'C' */
  section: string;
  /** Timestamp of authentication */
  loginTime: string;
  /** Expiration timestamp (default 8 hours) */
  expiresAt: string;
}

export interface LoginResult {
  success: boolean;
  session?: AuthSession;
  errorMessage?: string;
}

/* =========================================================================
 * PHASE 2 SCOPING CONTRACTS (Ready for Phase 2 implementation)
 * ========================================================================= */

/**
 * Interface that all Phase 2 attendance actions will use.
 * Scoped automatically by Phase 1's active AuthSession.
 */
export interface Phase2ScopedAction {
  departmentId: string;
  departmentCode: string;
  section: string;
  academicYear: string;
}

/**
 * Placeholder structure for Phase 2 Student Roster records.
 */
export interface Phase2StudentSummary {
  id: string;
  rollNumber: string;
  name: string;
  departmentId: string;
  semester: number;
  section: string;
}
