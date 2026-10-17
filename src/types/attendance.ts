/**
 * Phase 2 Attendance System Types
 * Automated attendance system built on live camera capture,
 * background face recognition, and Excel reporting.
 */

import { AcademicYearRoman } from './auth';

export type AttendanceStatus = 'Present' | 'Absent' | 'Flagged for Review';

export interface FaceQualityReport {
  isValid: boolean;
  score: number; // 0 - 100
  lighting: 'good' | 'too_dark' | 'too_bright';
  sharpness: 'sharp' | 'blurry';
  faceCount: number;
  message: string;
}

export interface StudentProfile {
  id: string;
  registerNumber: string; // Unique student identifier (e.g., 922521104001)
  name: string;
  departmentId: string; // e.g. 'cse'
  departmentCode: string; // e.g. 'CSE'
  year: AcademicYearRoman; // I, II, III, IV
  section: string; // A, B, etc.
  faceDescriptor: number[]; // Normalized 128-d face embedding
  faceThumbnail: string; // Base64 data URL for UI display
  qualityScore: number;
  registeredAt: string;
}

export interface DetectedFace {
  box: { x: number; y: number; width: number; height: number };
  descriptor: number[];
  quality: FaceQualityReport;
  snapshotUrl?: string;
  timestampMs: number;
}

export interface StudentAttendanceResult {
  registerNumber: string;
  name: string;
  status: AttendanceStatus;
  confidence: number; // 0 - 100%
  firstDetectedAt?: string;
  detectionsCount: number;
  flagReason?: string;
}

export interface UnknownFaceRecord {
  id: string;
  frameIndex: number;
  timestampMs: number;
  snapshotUrl: string;
  confidenceBest: number;
  nearestStudentName?: string;
}

export interface AttendanceSessionRecord {
  id: string;
  sessionId: string;
  departmentId: string;
  departmentCode: string;
  departmentName: string;
  year: AcademicYearRoman;
  section: string;
  sessionDate: string; // YYYY-MM-DD
  sessionTime: string; // HH:mm:ss
  recordingDurationSeconds: number; // Configurable: 60 - 120 seconds
  status: 'recording' | 'processing' | 'completed' | 'failed';
  processingProgress: number; // 0 - 100%
  processingStatusText: string;
  totalFramesAnalyzed: number;
  totalFacesDetected: number;
  presentCount: number;
  absentCount: number;
  flaggedCount: number;
  unknownFacesCount: number;
  attendancePercentage: number;
  results: StudentAttendanceResult[];
  unknownFaces: UnknownFaceRecord[];
  excelFileName?: string;
  createdAt: string;
  completedAt?: string;
}
