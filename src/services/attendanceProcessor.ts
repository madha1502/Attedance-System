/**
 * Background Asynchronous Attendance Video Processor.
 *
 * Runs non-blocking frame extraction, multi-face detection,
 * student roster matching, deduplication, and automated Excel generation.
 */

import {
  AttendanceSessionRecord,
  DetectedFace,
  StudentAttendanceResult,
  UnknownFaceRecord,
} from '../types/attendance';
import { getRoster } from './studentStore';
import { detectFacesInCanvas, matchFaceToRoster } from './faceRecognition';
import { downloadAttendanceExcel } from './excelReportGenerator';
import { saveAttendanceSessionToCloud, logAuditEventToCloud } from './firebase';

export type ProcessingUpdateCallback = (session: AttendanceSessionRecord) => void;

class AttendanceProcessorService {
  private activeSession: AttendanceSessionRecord | null = null;
  private listeners: Set<ProcessingUpdateCallback> = new Set();
  private isProcessing = false;

  public subscribe(cb: ProcessingUpdateCallback): () => void {
    this.listeners.add(cb);
    if (this.activeSession) {
      cb(this.activeSession);
    }
    return () => {
      this.listeners.delete(cb);
    };
  }

  private notify() {
    if (!this.activeSession) return;
    const copy = { ...this.activeSession };
    this.listeners.forEach((cb) => cb(copy));
  }

  public getActiveSession(): AttendanceSessionRecord | null {
    return this.activeSession;
  }

  /**
   * Starts background processing on captured frames.
   * Runs in sliced non-blocking asynchronous micro-tasks so the UI stays 100% fluid.
   */
  public async processRecordedSession(
    initialSession: AttendanceSessionRecord,
    capturedCanvases: HTMLCanvasElement[],
    timestampsMs: number[]
  ): Promise<AttendanceSessionRecord> {
    this.isProcessing = true;
    this.activeSession = {
      ...initialSession,
      status: 'processing',
      processingProgress: 0,
      processingStatusText: 'Initializing background recognition pipeline...',
    };
    this.notify();

    // 1. Fetch registered cohort roster
    const roster = getRoster(
      initialSession.departmentId,
      initialSession.year,
      initialSession.section
    );

    // Initial student results mapping (default all to Absent initially)
    const studentResultsMap = new Map<string, StudentAttendanceResult>();
    for (const student of roster) {
      studentResultsMap.set(student.registerNumber, {
        registerNumber: student.registerNumber,
        name: student.name,
        status: 'Absent',
        confidence: 0,
        detectionsCount: 0,
      });
    }

    const unknownFacesList: UnknownFaceRecord[] = [];
    const totalFrames = capturedCanvases.length;
    let facesFoundTotal = 0;

    // 2. Asynchronous frame-by-frame loop with yields to event loop
    for (let i = 0; i < totalFrames; i++) {
      const canvas = capturedCanvases[i];
      const timeMs = timestampsMs[i] || i * 1000;
      const formattedTimestamp = new Date(timeMs).toLocaleTimeString();

      // Non-blocking yield to main thread every frame
      await new Promise((resolve) => setTimeout(resolve, 35));

      // Update progress
      const progress = Math.min(95, Math.round(((i + 1) / totalFrames) * 90));
      this.activeSession = {
        ...this.activeSession,
        processingProgress: progress,
        processingStatusText: `Analyzing recorded footage: Frame ${i + 1} of ${totalFrames}...`,
      };
      this.notify();

      // Detect all faces in current frame
      const detectedInFrame: DetectedFace[] = await detectFacesInCanvas(canvas, timeMs);
      facesFoundTotal += detectedInFrame.length;

      // Match each face against registered students
      for (const detected of detectedInFrame) {
        const match = matchFaceToRoster(detected.descriptor, roster);

        if (match.isMatch && match.student) {
          // Reliable match: Mark student Present (deduplicated: counted once per session)
          const existing = studentResultsMap.get(match.student.registerNumber);
          if (existing) {
            const isFirstSeen = existing.status !== 'Present';
            studentResultsMap.set(match.student.registerNumber, {
              ...existing,
              status: 'Present',
              confidence: Math.max(existing.confidence, match.confidencePercent),
              detectionsCount: existing.detectionsCount + 1,
              firstDetectedAt: existing.firstDetectedAt || formattedTimestamp,
              flagReason: undefined,
            });
          }
        } else if (match.isAmbiguous && match.student) {
          // Ambiguous confidence: prefer a flagged result over a silent wrong mark
          const existing = studentResultsMap.get(match.student.registerNumber);
          if (existing && existing.status !== 'Present') {
            studentResultsMap.set(match.student.registerNumber, {
              ...existing,
              status: 'Flagged for Review',
              confidence: Math.max(existing.confidence, match.confidencePercent),
              detectionsCount: existing.detectionsCount + 1,
              firstDetectedAt: existing.firstDetectedAt || formattedTimestamp,
              flagReason: match.reason || 'Ambiguous match confidence; manual review advised.',
            });
          }
        } else if (match.isUnknown) {
          // Unknown face: record in unknown faces audit list
          unknownFacesList.push({
            id: `unk_${Date.now()}_${i}_${Math.random().toString(36).substring(2, 6)}`,
            frameIndex: i + 1,
            timestampMs: timeMs,
            snapshotUrl: canvas.toDataURL('image/jpeg', 0.55),
            confidenceBest: match.confidencePercent,
            nearestStudentName: match.student?.name,
          });
        }
      }
    }

    // 3. Finalize Attendance Session
    this.activeSession = {
      ...this.activeSession,
      processingProgress: 98,
      processingStatusText: 'Compiling institutional Excel attendance report...',
    };
    this.notify();

    await new Promise((resolve) => setTimeout(resolve, 300));

    const finalResults = Array.from(studentResultsMap.values());
    const presentCount = finalResults.filter((r) => r.status === 'Present').length;
    const flaggedCount = finalResults.filter((r) => r.status === 'Flagged for Review').length;
    const absentCount = finalResults.filter((r) => r.status === 'Absent').length;
    const totalEnrolled = finalResults.length || 1;
    const attendancePercentage = Math.round((presentCount / totalEnrolled) * 100);

    const completedSession: AttendanceSessionRecord = {
      ...this.activeSession,
      status: 'completed',
      processingProgress: 100,
      processingStatusText: 'Recognition completed. Excel report ready for download.',
      totalFramesAnalyzed: totalFrames,
      totalFacesDetected: facesFoundTotal,
      presentCount,
      absentCount,
      flaggedCount,
      unknownFacesCount: unknownFacesList.length,
      attendancePercentage,
      results: finalResults,
      unknownFaces: unknownFacesList,
      completedAt: new Date().toISOString(),
    };

    this.activeSession = completedSession;
    this.isProcessing = false;
    this.notify();

    // Auto-save session to history in localStorage
    try {
      const historyKey = `vsbec_att_history_${completedSession.departmentId}`;
      const existingHistoryRaw = localStorage.getItem(historyKey);
      const history: AttendanceSessionRecord[] = existingHistoryRaw ? JSON.parse(existingHistoryRaw) : [];
      localStorage.setItem(historyKey, JSON.stringify([completedSession, ...history.slice(0, 10)]));
    } catch {
      // Ignore quota
    }

    // Persist completed session to Cloud Database (Firebase Firestore)
    saveAttendanceSessionToCloud(completedSession).catch((err) =>
      console.warn('Could not sync completed session to Firestore:', err)
    );
    logAuditEventToCloud(
      completedSession.departmentId,
      'ATTENDANCE_SESSION_RECORDED',
      `Session ${completedSession.sessionId} recorded for ${completedSession.departmentName} (Year ${completedSession.year} Sec ${completedSession.section}): ${presentCount}/${totalEnrolled} Present (${attendancePercentage}%)`
    ).catch(() => {});

    return completedSession;
  }
}

export const attendanceProcessor = new AttendanceProcessorService();
