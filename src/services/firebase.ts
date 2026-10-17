import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  doc,
  getDoc,
  getDocFromServer,
  setDoc,
  collection,
  query,
  getDocs,
  orderBy,
  limit,
  onSnapshot,
  Firestore,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { AttendanceSessionRecord, StudentProfile } from '../types/attendance';
import { Department } from '../types/auth';

// Initialize Firebase App
export const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// CRITICAL: Initialize Firestore with custom database ID
export const db: Firestore = getFirestore(app, firebaseConfig.firestoreDatabaseId);

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  timestamp: string;
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): void {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    operationType,
    path,
    timestamp: new Date().toISOString(),
  };
  console.warn('Firestore Operation Notice:', JSON.stringify(errInfo));
}

/**
 * Validates connection to live Firestore database instance.
 */
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'admin_settings', 'connection_test'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firestore client is currently offline or connecting in background.');
    }
    return false;
  }
}

// Immediately trigger background connectivity validation
testFirestoreConnection().catch(() => {});

/* =========================================================================
   ATTENDANCE SESSIONS CLOUD PERSISTENCE
   ========================================================================= */

/**
 * Persist completed attendance session to Firestore cloud database
 */
export async function saveAttendanceSessionToCloud(session: AttendanceSessionRecord): Promise<boolean> {
  const path = `attendance_sessions/${session.id}`;
  try {
    // Sanitize results array to avoid non-serializable fields
    const sanitizedSession: Record<string, unknown> = {
      id: session.id,
      sessionId: session.sessionId,
      departmentId: session.departmentId,
      departmentCode: session.departmentCode,
      departmentName: session.departmentName,
      year: session.year,
      section: session.section,
      sessionDate: session.sessionDate,
      sessionTime: session.sessionTime,
      recordingDurationSeconds: session.recordingDurationSeconds,
      status: session.status,
      totalFramesAnalyzed: session.totalFramesAnalyzed || 0,
      totalFacesDetected: session.totalFacesDetected || 0,
      presentCount: session.presentCount || 0,
      absentCount: session.absentCount || 0,
      flaggedCount: session.flaggedCount || 0,
      unknownFacesCount: session.unknownFacesCount || 0,
      attendancePercentage: session.attendancePercentage || 0,
      results: session.results.map((r) => ({
        registerNumber: r.registerNumber,
        name: r.name,
        status: r.status,
        confidence: r.confidence,
        detectionsCount: r.detectionsCount,
        firstDetectedAt: r.firstDetectedAt || '',
        flagReason: r.flagReason || null,
      })),
      createdAt: session.createdAt || new Date().toISOString(),
      completedAt: session.completedAt || new Date().toISOString(),
    };

    await setDoc(doc(db, 'attendance_sessions', session.id), sanitizedSession);
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    return false;
  }
}

/**
 * Fetch recent attendance sessions from Firestore cloud database
 */
export async function getCloudAttendanceSessions(
  departmentId?: string,
  limitCount: number = 50
): Promise<AttendanceSessionRecord[]> {
  const path = 'attendance_sessions';
  try {
    const q = query(collection(db, path), orderBy('completedAt', 'desc'), limit(limitCount));
    const snapshot = await getDocs(q);
    const sessions: AttendanceSessionRecord[] = [];

    snapshot.forEach((docSnap) => {
      const data = docSnap.data() as AttendanceSessionRecord;
      if (!departmentId || data.departmentId === departmentId) {
        sessions.push(data);
      }
    });

    return sessions;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
}

/**
 * Subscribe to real-time attendance session updates from Firestore
 */
export function subscribeToCloudAttendanceSessions(
  onUpdate: (sessions: AttendanceSessionRecord[]) => void,
  departmentId?: string
): () => void {
  const path = 'attendance_sessions';
  try {
    const q = query(collection(db, path), orderBy('completedAt', 'desc'), limit(30));
    return onSnapshot(
      q,
      (snapshot) => {
        const sessions: AttendanceSessionRecord[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data() as AttendanceSessionRecord;
          if (!departmentId || data.departmentId === departmentId) {
            sessions.push(data);
          }
        });
        onUpdate(sessions);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, path);
      }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return () => {};
  }
}

/* =========================================================================
   DEPARTMENT PROFILES CLOUD PERSISTENCE
   ========================================================================= */

/**
 * Save updated department profile and HOD details to cloud
 */
export async function saveDepartmentProfileToCloud(dept: Department): Promise<boolean> {
  const path = `departments/${dept.id}`;
  try {
    await setDoc(doc(db, 'departments', dept.id), {
      ...dept,
      updatedAt: new Date().toISOString(),
    });
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    return false;
  }
}

/**
 * Fetch all cloud-persisted department profiles
 */
export async function getCloudDepartmentProfiles(): Promise<Record<string, Department>> {
  const path = 'departments';
  try {
    const snapshot = await getDocs(collection(db, path));
    const profiles: Record<string, Department> = {};
    snapshot.forEach((docSnap) => {
      profiles[docSnap.id] = docSnap.data() as Department;
    });
    return profiles;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return {};
  }
}

/* =========================================================================
   INSTITUTIONAL ADMIN SETTINGS PERSISTENCE
   ========================================================================= */

export interface InstitutionalSettings {
  academicYear: string;
  attendanceThresholdPercent: number;
  recordingDurationSeconds: number;
  allowAmbiguousFlags: boolean;
  institutionName: string;
  autonomousCode: string;
  lastUpdated: string;
  updatedBy: string;
}

export const DEFAULT_ADMIN_SETTINGS: InstitutionalSettings = {
  academicYear: '2025-2026',
  attendanceThresholdPercent: 75,
  recordingDurationSeconds: 60,
  allowAmbiguousFlags: true,
  institutionName: 'V.S.B. Engineering College',
  autonomousCode: 'VSBEC-AUTONOMOUS',
  lastUpdated: new Date().toISOString(),
  updatedBy: 'System Administrator',
};

export async function saveAdminSettingsToCloud(settings: InstitutionalSettings): Promise<boolean> {
  const path = 'admin_settings/institutional';
  try {
    await setDoc(doc(db, 'admin_settings', 'institutional'), {
      ...settings,
      lastUpdated: new Date().toISOString(),
    });
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    return false;
  }
}

export async function getAdminSettingsFromCloud(): Promise<InstitutionalSettings> {
  const path = 'admin_settings/institutional';
  try {
    const docSnap = await getDoc(doc(db, 'admin_settings', 'institutional'));
    if (docSnap.exists()) {
      return docSnap.data() as InstitutionalSettings;
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
  return DEFAULT_ADMIN_SETTINGS;
}

/* =========================================================================
   AUDIT LOGGING PERSISTENCE
   ========================================================================= */

export interface AuditLogEntry {
  id: string;
  actor: string;
  action: string;
  details: string;
  timestamp: string;
}

export async function logAuditEventToCloud(actor: string, action: string, details: string): Promise<void> {
  const id = `audit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const path = `audit_logs/${id}`;
  try {
    await setDoc(doc(db, 'audit_logs', id), {
      id,
      actor,
      action,
      details,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function getRecentAuditLogs(limitCount: number = 40): Promise<AuditLogEntry[]> {
  const path = 'audit_logs';
  try {
    const q = query(collection(db, path), orderBy('timestamp', 'desc'), limit(limitCount));
    const snapshot = await getDocs(q);
    const logs: AuditLogEntry[] = [];
    snapshot.forEach((d) => logs.push(d.data() as AuditLogEntry));
    return logs;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
}

/* =========================================================================
   STUDENT ROSTER CLOUD SYNC FOR N-NUMBER OF STUDENTS
   ========================================================================= */

export async function syncStudentsRosterToCloud(students: StudentProfile[]): Promise<number> {
  let count = 0;
  for (const s of students) {
    const docId = `${s.departmentId}_${s.year}_${s.section}_${s.registerNumber}`;
    const path = `students/${docId}`;
    try {
      await setDoc(doc(db, 'students', docId), {
        id: s.id,
        registerNumber: s.registerNumber,
        name: s.name,
        departmentId: s.departmentId,
        departmentCode: s.departmentCode,
        year: s.year,
        section: s.section,
        qualityScore: s.qualityScore,
        registeredAt: s.registeredAt || new Date().toISOString(),
      });
      count++;
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  }
  return count;
}
