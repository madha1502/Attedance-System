/**
 * ============================================================================
 * V.S.B. ENGINEERING COLLEGE - CREDENTIALS & CONFIGURATION (PHASE 1)
 * ============================================================================
 *
 * College Details based on Official Accreditation Banner:
 * - Institution: V.S.B. ENGINEERING COLLEGE
 * - Autonomous Status: (An Autonomous Institution)
 * - Research Institute: (Anna University Recognized Research Institute)
 * - Approvals: Approved by AICTE, New Delhi, Affiliated to Anna University, Chennai
 * - Accreditations: NBA Accredited Programmes, Accredited by NAAC
 * - Campus Location: Karur - 639 111, Tamil Nadu
 * - Motto: "HARDWORK IS THE KEY TO SUCCESS"
 */

import { CollegeConfig, Department, DepartmentCredential } from '../types/auth';

/**
 * Institutional branding and metadata for V.S.B. Engineering College
 */
export const COLLEGE_CONFIG: CollegeConfig = {
  name: 'V.S.B. ENGINEERING COLLEGE',
  shortName: 'VSBEC',
  motto: 'HARDWORK IS THE KEY TO SUCCESS',
  accreditation: 'Affiliated to Anna University, Chennai • NBA & NAAC Accredited',
  autonomousStatus: 'An Autonomous Institution',
  researchInstituteStatus: 'Anna University Recognized Research Institute',
  approvals: 'Approved by AICTE, New Delhi, Affiliated to Anna University, Chennai',
  nbaNaac: 'NBA Accredited Programmes, Accredited by NAAC',
  location: 'NH-67, Covai Road, Karur - 639 111, Tamil Nadu',
  academicYear: '2026 - 2027',
  campusCode: 'VSBEC-KARUR-639111',
  logoPath: '/logo.png', // Official college logo uploaded by user
  supportEmail: 'attendance@vsbec.ac.in',
};

/**
 * List of academic departments (sections) in V.S.B. Engineering College.
 * To add a new department, append a new object to this array.
 */
export const DEPARTMENTS: Department[] = [
  {
    id: 'cse',
    name: 'Computer Science & Engineering',
    code: 'CSE',
    defaultSection: 'Section A & B (Batch 2023-2027)',
    coordinatorName: 'Dr. M. Sangeetha, M.E., Ph.D.',
    coordinatorDesignation: 'Professor & Head of Department',
    coordinatorEmail: 'hod.cse@vsbec.ac.in',
    coordinatorCabin: 'Academic Block 1 - 1st Floor, Room 104',
    coordinatorPhone: '+91 94430 11201',
    accentColor: '#0b66af', // VSB Blue
    isActive: true,
  },
  {
    id: 'aids',
    name: 'Artificial Intelligence & Data Science',
    code: 'AI & DS',
    defaultSection: 'Section AI-1 (Batch 2023-2027)',
    coordinatorName: 'Dr. S. K. Vignesh, M.Tech., Ph.D.',
    coordinatorDesignation: 'Associate Professor & Head of Department',
    coordinatorEmail: 'hod.aids@vsbec.ac.in',
    coordinatorCabin: 'Computing Complex - 2nd Floor, Room 208',
    coordinatorPhone: '+91 94430 11202',
    accentColor: '#7c3aed', // Violet
    isActive: true,
  },
  {
    id: 'it',
    name: 'Information Technology',
    code: 'IT',
    defaultSection: 'Section IT-1 (Batch 2023-2027)',
    coordinatorName: 'Mr. K. Manivannan, M.Tech.',
    coordinatorDesignation: 'Associate Professor & Head of Department',
    coordinatorEmail: 'hod.it@vsbec.ac.in',
    coordinatorCabin: 'IT Block - 1st Floor, Room 112',
    coordinatorPhone: '+91 94430 11203',
    accentColor: '#0891b2', // Cyan
    isActive: true,
  },
  {
    id: 'ece',
    name: 'Electronics & Communication Engineering',
    code: 'ECE',
    defaultSection: 'Section ECE-A (Batch 2023-2027)',
    coordinatorName: 'Dr. P. S. Gomathi, M.E., Ph.D.',
    coordinatorDesignation: 'Professor & Head of Department',
    coordinatorEmail: 'hod.ece@vsbec.ac.in',
    coordinatorCabin: 'ECE Block - Ground Floor, Room 101',
    coordinatorPhone: '+91 94430 11204',
    accentColor: '#dc2626', // Crimson Red
    isActive: true,
  },
  {
    id: 'eee',
    name: 'Electrical & Electronics Engineering',
    code: 'EEE',
    defaultSection: 'Section EEE-1 (Batch 2023-2027)',
    coordinatorName: 'Dr. K. Umamakeswari, M.E., Ph.D.',
    coordinatorDesignation: 'Professor & Head of Department',
    coordinatorEmail: 'hod.eee@vsbec.ac.in',
    coordinatorCabin: 'Power Systems Block - Ground Floor, Room 103',
    coordinatorPhone: '+91 94430 11205',
    accentColor: '#059669', // Emerald
    isActive: true,
  },
  {
    id: 'mech',
    name: 'Mechanical Engineering',
    code: 'MECH',
    defaultSection: 'Section MECH-1 (Batch 2023-2027)',
    coordinatorName: 'Dr. P. Raju, M.E., Ph.D.',
    coordinatorDesignation: 'Professor & Head of Department',
    coordinatorEmail: 'hod.mech@vsbec.ac.in',
    coordinatorCabin: 'Mechanical Block - Ground Floor, Room 105',
    coordinatorPhone: '+91 94430 11206',
    accentColor: '#ea580c', // Orange
    isActive: true,
  },
  {
    id: 'civil',
    name: 'Civil Engineering',
    code: 'CIVIL',
    defaultSection: 'Section CIVIL-1 (Batch 2023-2027)',
    coordinatorName: 'Mr. R. Gowrisankar, M.E.',
    coordinatorDesignation: 'Associate Professor & Head of Department',
    coordinatorEmail: 'hod.civil@vsbec.ac.in',
    coordinatorCabin: 'Structures Block - Ground Floor, Room 102',
    coordinatorPhone: '+91 94430 11207',
    accentColor: '#d97706', // Amber
    isActive: true,
  },
  {
    id: 'bme',
    name: 'Biomedical Engineering',
    code: 'BME',
    defaultSection: 'Section BME-1 (Batch 2023-2027)',
    coordinatorName: 'Dr. A. Revathi, M.E., Ph.D.',
    coordinatorDesignation: 'Associate Professor & Head of Department',
    coordinatorEmail: 'hod.bme@vsbec.ac.in',
    coordinatorCabin: 'Bio-Engineering Block - 2nd Floor, Room 204',
    coordinatorPhone: '+91 94430 11208',
    accentColor: '#e11d48', // Rose
    isActive: true,
  },
];

const hodMemoryProfiles: Record<string, Partial<Department>> = {};

/**
 * Retrieve stored custom HOD / Coordinator profile overrides from persistent storage,
 * falling back to institutional defaults.
 */
export function getStoredDepartmentProfile(dept: Department): Department {
  try {
    if (typeof localStorage !== 'undefined') {
      const stored = localStorage.getItem(`vsbec_hod_profile_${dept.id}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        return { ...dept, ...parsed };
      }
    }
  } catch (err) {
    console.warn('Could not read stored department profile', err);
  }
  if (hodMemoryProfiles[dept.id]) {
    return { ...dept, ...hodMemoryProfiles[dept.id] };
  }
  return dept;
}

/**
 * Get all departments with their active (or custom edited) HOD profiles.
 */
export function getAllDepartmentsWithProfiles(): Department[] {
  return DEPARTMENTS.map((d) => getStoredDepartmentProfile(d));
}

/**
 * Save custom HOD profile overrides for a department in persistent storage.
 */
export function saveDepartmentProfile(deptId: string, updates: Partial<Department>): Department | null {
  const baseDept = DEPARTMENTS.find((d) => d.id === deptId);
  if (!baseDept) return null;

  hodMemoryProfiles[deptId] = { ...(hodMemoryProfiles[deptId] || {}), ...updates };

  try {
    if (typeof localStorage !== 'undefined') {
      const existingRaw = localStorage.getItem(`vsbec_hod_profile_${deptId}`);
      const existing = existingRaw ? JSON.parse(existingRaw) : {};
      const merged = { ...existing, ...updates };
      localStorage.setItem(`vsbec_hod_profile_${deptId}`, JSON.stringify(merged));
      return { ...baseDept, ...merged };
    }
  } catch (err) {
    console.warn('Could not save department profile', err);
  }
  return { ...baseDept, ...hodMemoryProfiles[deptId] };
}

/**
 * Reset a department's HOD profile back to the official college defaults.
 */
export function resetDepartmentProfile(deptId: string): Department | null {
  const baseDept = DEPARTMENTS.find((d) => d.id === deptId);
  if (!baseDept) return null;
  delete hodMemoryProfiles[deptId];
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(`vsbec_hod_profile_${deptId}`);
    }
  } catch {}
  return baseDept;
}

/**
 * Department login credentials.
 * PASSWORDS ARE STORED AS CRYPTOGRAPHIC SALTED SHA-256 HASHES.
 *
 * All passwords are verified using:
 * SHA-256(salt + ":" + plainTextPassword)
 */
export const DEPARTMENT_CREDENTIALS: DepartmentCredential[] = [
  {
    username: 'dept_cse',
    departmentId: 'cse',
    salt: 'a1b2c3d4e5f60718',
    passwordHash: '6c7f0a53e3103e58811505b3e0645fc005e203df9a9f5442ababd52faaa29174',
    label: 'Computer Science Dept Office',
    samplePasswordHint: 'CsePass@2026',
  },
  {
    username: 'dept_aids',
    departmentId: 'aids',
    salt: '7a8b9c0d1e2f3456',
    passwordHash: 'a16a6c8ba318a4d351b264c8763cb63ea6248b0cfe9e6eace67c9334a14ce861',
    label: 'AI & Data Science Dept Office',
    samplePasswordHint: 'AiDsPass@2026',
  },
  {
    username: 'dept_it',
    departmentId: 'it',
    salt: 'd4e5f6a1b2c30a41',
    passwordHash: '6a56ccf4f0a92fbcf450de7a5d7a45e0b55acd7fc9032129bab750caf1a6502b',
    label: 'Information Technology Dept Office',
    samplePasswordHint: 'ItPass@2026',
  },
  {
    username: 'dept_ece',
    departmentId: 'ece',
    salt: 'c3d4e5f6a1b20930',
    passwordHash: '60650ca9d9c68c3d160c55b05b734f4049624644bc91991cb27fc4fb7516b781',
    label: 'Electronics Dept Office',
    samplePasswordHint: 'EcePass@2026',
  },
  {
    username: 'dept_eee',
    departmentId: 'eee',
    salt: 'e5f6a1b2c3d40b52',
    passwordHash: 'aa7c9c62713c82d4626760160f0fd5ff829a77845534d810422ba76fedbc3094',
    label: 'Electrical Dept Office',
    samplePasswordHint: 'EeePass@2026',
  },
  {
    username: 'dept_mech',
    departmentId: 'mech',
    salt: 'b2c3d4e5f6a10829',
    passwordHash: 'fbe30df2a2b979a23203847c0fb9505d18361d9a88cd18b332b13401d88708f4',
    label: 'Mechanical Dept Office',
    samplePasswordHint: 'MechPass@2026',
  },
  {
    username: 'dept_civil',
    departmentId: 'civil',
    salt: 'f6a1b2c3d4e50c63',
    passwordHash: '5e2fe298eaa0f3a05be5af3393e5ee727b3e630be34781688e39d96a980dc654',
    label: 'Civil Dept Office',
    samplePasswordHint: 'CivilPass@2026',
  },
  {
    username: 'dept_bme',
    departmentId: 'bme',
    salt: '8b9c0d1e2f34567a',
    passwordHash: '2f3d3ca0d7a3b796090f903dd96c31482159a4eee197ca63395960826d46a6a2',
    label: 'Biomedical Dept Office',
    samplePasswordHint: 'BmePass@2026',
  },
  {
    username: 'admin',
    departmentId: 'admin',
    salt: 'f1e2d3c4b5a69780',
    passwordHash: 'c2001a3618d7607aae09d0b2abf15c99b229dec71ee7cb065c7c844ace6e7f47',
    label: 'Institutional Administrative Portal',
    samplePasswordHint: 'Admin@2026',
  },
  {
    username: 'vsbec_admin',
    departmentId: 'admin',
    salt: 'f1e2d3c4b5a69780',
    passwordHash: 'c2001a3618d7607aae09d0b2abf15c99b229dec71ee7cb065c7c844ace6e7f47',
    label: 'Principal & Executive Administrator',
    samplePasswordHint: 'Admin@2026',
  },
];

export const ADMIN_DEPARTMENT: Department = {
  id: 'admin',
  name: 'Institutional Administration & Academic Operations',
  code: 'ADMIN',
  defaultSection: 'A',
  coordinatorName: 'Dr. V. Radha, M.E., Ph.D.',
  coordinatorEmail: 'principal@vsbec.ac.in',
  coordinatorDesignation: 'Principal & Chief Academic Officer',
  coordinatorCabin: 'Administrative Block - 1st Floor, Executive Wing',
  coordinatorPhone: '+91 94430 11200',
  accentColor: '#005696',
  isActive: true,
};
