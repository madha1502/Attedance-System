/**
 * Excel Attendance Report Generator
 * Uses SheetJS (xlsx) to construct institutional attendance spreadsheets.
 */

import * as XLSX from 'xlsx';
import { AttendanceSessionRecord } from '../types/attendance';

export function generateAttendanceWorkbook(session: AttendanceSessionRecord): XLSX.WorkBook {
  const wb = XLSX.utils.book_new();

  // 1. Prepare Main Attendance Sheet Data
  const sheetData: (string | number)[][] = [];

  // Institutional Header Banner
  sheetData.push(['V.S.B. ENGINEERING COLLEGE']);
  sheetData.push(['(An Autonomous Institution, Affiliated to Anna University, Chennai)']);
  sheetData.push(['NH-67, Covai Road, Karur - 639 111, Tamil Nadu']);
  sheetData.push(['INSTITUTIONAL ATTENDANCE MANAGEMENT SYSTEM (IAMS) - PHASE 2']);
  sheetData.push([]);

  // Session Scope & Metadata
  sheetData.push(['SESSION AUDIT DETAILS']);
  sheetData.push(['Session ID:', session.sessionId, '', 'Department:', `${session.departmentName} (${session.departmentCode})`]);
  sheetData.push(['Session Date:', session.sessionDate, '', 'Academic Class:', `Year ${session.year} - Section ${session.section}`]);
  sheetData.push(['Session Time:', session.sessionTime, '', 'Camera Duration:', `${session.recordingDurationSeconds} Seconds (Live Capture)`]);
  sheetData.push(['Total Enrolled:', session.results.length, '', 'Attendance Rate:', `${session.attendancePercentage}%`]);
  sheetData.push(['Present Count:', session.presentCount, '', 'Absent Count:', session.absentCount]);
  sheetData.push(['Flagged Count:', session.flaggedCount, '', 'Unknown Faces:', session.unknownFacesCount]);
  sheetData.push([]);

  // Attendance Records Table Header
  sheetData.push([
    'S.No',
    'Register Number',
    'Student Name',
    'Attendance Status',
    'Confidence (%)',
    'Detections Count',
    'First Detected At',
    'Verification Notes / Review Reason',
  ]);

  // Student Attendance Rows
  session.results.forEach((r, idx) => {
    sheetData.push([
      idx + 1,
      r.registerNumber,
      r.name,
      r.status.toUpperCase(),
      r.confidence > 0 ? `${r.confidence}%` : 'N/A',
      r.detectionsCount,
      r.firstDetectedAt || 'N/A',
      r.flagReason || (r.status === 'Present' ? 'Verified by biometric face embedding match' : 'No facial match in session video'),
    ]);
  });

  const wsMain = XLSX.utils.aoa_to_sheet(sheetData);

  // Column Width formatting
  wsMain['!cols'] = [
    { wch: 6 },  // S.No
    { wch: 18 }, // Register Number
    { wch: 28 }, // Student Name
    { wch: 22 }, // Attendance Status
    { wch: 16 }, // Confidence
    { wch: 18 }, // Detections Count
    { wch: 20 }, // First Detected At
    { wch: 45 }, // Notes
  ];

  XLSX.utils.book_append_sheet(wb, wsMain, 'Attendance_Roster');

  // 2. Prepare Unknown Faces & Audit Log Sheet
  const auditData: (string | number)[][] = [];
  auditData.push(['UNKNOWN / UNREGISTERED FACES AUDIT LOG']);
  auditData.push(['Session ID:', session.sessionId]);
  auditData.push(['Total Unknown Face Encounters:', session.unknownFaces.length]);
  auditData.push([]);
  auditData.push(['Encounter ID', 'Frame Index', 'Timestamp (ms)', 'Highest Similarity (%)', 'Nearest Enrolled Candidate', 'Operator Action']);

  if (session.unknownFaces.length === 0) {
    auditData.push(['None', 'N/A', 'N/A', 'N/A', 'N/A', 'All detected faces successfully resolved against cohort']);
  } else {
    session.unknownFaces.forEach((u, idx) => {
      auditData.push([
        `UNK-${idx + 1}`,
        u.frameIndex,
        `${(u.timestampMs / 1000).toFixed(1)}s`,
        `${u.confidenceBest}%`,
        u.nearestStudentName || 'Unrecognized',
        'Flagged for Manual Verification',
      ]);
    });
  }

  const wsAudit = XLSX.utils.aoa_to_sheet(auditData);
  wsAudit['!cols'] = [
    { wch: 16 },
    { wch: 14 },
    { wch: 18 },
    { wch: 22 },
    { wch: 28 },
    { wch: 35 },
  ];

  XLSX.utils.book_append_sheet(wb, wsAudit, 'Unknown_Faces_Audit');

  return wb;
}

export function generateAttendanceExcelBuffer(session: AttendanceSessionRecord): Uint8Array {
  const wb = generateAttendanceWorkbook(session);
  const out = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  return new Uint8Array(out);
}

export function downloadAttendanceExcel(session: AttendanceSessionRecord): string {
  const wb = generateAttendanceWorkbook(session);
  const fileName =
    session.excelFileName ||
    `VSBEC_Attendance_${session.departmentCode}_Y${session.year}_Sec${session.section}_${session.sessionDate}.xlsx`;

  XLSX.writeFile(wb, fileName);
  return fileName;
}
