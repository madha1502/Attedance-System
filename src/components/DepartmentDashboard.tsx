import React, { useState, useEffect } from 'react';
import {
  LogOut,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  Shield,
  Layers,
  Users,
  ClipboardList,
  FileSpreadsheet,
  Cpu,
  HelpCircle,
  Copy,
  Check,
  ChevronRight,
  Camera,
  Video,
  UserPlus,
  Download,
  AlertTriangle,
  RefreshCw,
  Sparkles,
  Play,
  RotateCcw,
  CheckCircle,
  XCircle,
  Eye,
  FileDown,
  Edit3,
  Mail,
} from 'lucide-react';
import { CollegeLogo } from './CollegeLogo';
import { COLLEGE_CONFIG } from '../config/departments.config';
import { useAuth } from '../context/AuthContext';
import { LiveAttendanceWindow } from './LiveAttendanceWindow';
import { StudentRegistrationModal } from './StudentRegistrationModal';
import { AttendanceResultsModal } from './AttendanceResultsModal';
import { RosterManagementModal } from './RosterManagementModal';
import { EditHodModal } from './EditHodModal';
import { attendanceProcessor } from '../services/attendanceProcessor';
import { downloadAttendanceExcel } from '../services/excelReportGenerator';
import { getRoster } from '../services/studentStore';
import { AttendanceSessionRecord } from '../types/attendance';

interface DepartmentDashboardProps {}

export const DepartmentDashboard: React.FC<DepartmentDashboardProps> = () => {
  const { session, activeDepartment, logout } = useAuth();
  const [copiedToken, setCopiedToken] = useState(false);

  // Phase 2 Modal & Window States
  const [isAttendanceWindowOpen, setIsAttendanceWindowOpen] = useState(false);
  const [isRegistrationOpen, setIsRegistrationOpen] = useState(false);
  const [isRosterOpen, setIsRosterOpen] = useState(false);
  const [isResultsOpen, setIsResultsOpen] = useState(false);
  const [isEditHodOpen, setIsEditHodOpen] = useState(false);

  // Active Session & Background Processing State
  const [activeSession, setActiveSession] = useState<AttendanceSessionRecord | null>(null);
  const [recentSessions, setRecentSessions] = useState<AttendanceSessionRecord[]>([]);
  const [rosterCount, setRosterCount] = useState<number>(0);

  // Refresh roster count for active cohort
  const refreshRosterCount = () => {
    if (!session || !activeDepartment) return;
    const roster = getRoster(activeDepartment.id, session.year, session.section);
    setRosterCount(roster.length);
  };

  // Subscribe to background attendance processor updates
  useEffect(() => {
    refreshRosterCount();

    // Load recent sessions from localStorage
    if (activeDepartment) {
      try {
        const historyKey = `vsbec_att_history_${activeDepartment.id}`;
        const raw = localStorage.getItem(historyKey);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            setRecentSessions(parsed);
          }
        }
      } catch (err) {
        console.warn('Failed loading attendance history:', err);
      }
    }

    const unsubscribe = attendanceProcessor.subscribe((updatedSession) => {
      setActiveSession(updatedSession);
      if (updatedSession.status === 'completed') {
        // Update recent sessions list
        setRecentSessions((prev) => {
          const filtered = prev.filter((s) => s.sessionId !== updatedSession.sessionId);
          return [updatedSession, ...filtered.slice(0, 9)];
        });
      }
    });

    return () => {
      unsubscribe();
    };
  }, [activeDepartment, session]);

  if (!session || !activeDepartment) {
    return null;
  }

  const handleCopyToken = () => {
    navigator.clipboard.writeText(session.token);
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 2000);
  };

  const loginDate = new Date(session.loginTime).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  const handleOpenResults = (s?: AttendanceSessionRecord) => {
    if (s) {
      setActiveSession(s);
    }
    setIsResultsOpen(true);
  };

  const handleQuickDownloadLatest = (e: React.MouseEvent, targetSession?: AttendanceSessionRecord) => {
    e.stopPropagation();
    const s = targetSession || activeSession || recentSessions[0];
    if (s) {
      downloadAttendanceExcel(s);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-between">
      {/* Top Department Navigation Bar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Left: College Brand & Department Identity */}
            <div className="flex items-center space-x-3">
              <CollegeLogo size="sm" />
              <div>
                <div className="flex items-center space-x-2">
                  <h1 className="text-base font-black text-[#0066b2] tracking-tight leading-none uppercase">
                    {COLLEGE_CONFIG.name}
                  </h1>
                  <span className="text-slate-300">|</span>
                  <span
                    className="text-xs px-2 py-0.5 rounded font-bold font-mono text-white shadow-xs"
                    style={{ backgroundColor: activeDepartment.accentColor }}
                  >
                    {activeDepartment.code}
                  </span>
                </div>
                <div className="flex items-center space-x-2 mt-0.5">
                  <span className="text-[10px] font-bold text-red-600 uppercase">
                    Autonomous
                  </span>
                  <span className="text-slate-300 text-[10px]">•</span>
                  <p className="text-xs text-slate-600 font-medium truncate max-w-xs sm:max-w-md">
                    {activeDepartment.name} • Year {session.year} - Sec {session.section}
                  </p>
                </div>
              </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center space-x-2 sm:space-x-3">
              {/* Primary ATTENDANCE Trigger Button */}
              <button
                onClick={() => setIsAttendanceWindowOpen(true)}
                className="flex items-center space-x-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-red-600 hover:bg-red-700 shadow-md shadow-red-600/20 rounded-lg transition-all cursor-pointer transform hover:-translate-y-0.5"
                title="Open live camera window and record 1-2 min attendance"
              >
                <Video className="w-3.5 h-3.5 animate-pulse text-white" />
                <span>Attendance (Live REC)</span>
              </button>

              <button
                onClick={logout}
                className="flex items-center space-x-1.5 px-3.5 py-1.5 text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors cursor-pointer"
                title="End department session"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Logout ({activeDepartment.code})</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Scoped Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full flex-1 space-y-6">
        {/* ACTIVE BACKGROUND PROCESSING BANNER */}
        {activeSession && activeSession.status === 'processing' && (
          <div className="p-4 bg-gradient-to-r from-blue-900 to-indigo-950 text-white rounded-2xl shadow-lg border border-blue-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in fade-in">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600/40 border border-blue-400/50 flex items-center justify-center shrink-0">
                <RefreshCw className="w-5 h-5 text-blue-300 animate-spin" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <h3 className="text-sm font-bold tracking-tight">
                    Background Face Recognition in Progress
                  </h3>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-blue-500/30 text-blue-200 border border-blue-400/30">
                    ASYNC PIPELINE
                  </span>
                </div>
                <p className="text-xs text-blue-200">
                  {activeSession.processingStatusText} ({activeSession.totalFramesAnalyzed} frames captured)
                </p>
                <div className="w-64 max-w-full h-2 bg-blue-950 rounded-full overflow-hidden border border-blue-800">
                  <div
                    className="h-full bg-blue-400 transition-all duration-300"
                    style={{ width: `${activeSession.processingProgress}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2 shrink-0">
              <button
                onClick={() => setIsResultsOpen(true)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer flex items-center space-x-1.5"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>View Live Progress ({activeSession.processingProgress}%)</span>
              </button>
            </div>
          </div>
        )}

        {/* LATEST COMPLETED SESSION SUMMARY BANNER */}
        {activeSession && activeSession.status === 'completed' && (
          <div className="p-4 bg-gradient-to-r from-emerald-50 via-white to-blue-50 border border-emerald-300 rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 animate-in fade-in">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-emerald-600 text-white rounded-xl shadow-xs shrink-0">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="text-sm font-bold text-slate-900">
                    Attendance Session Completed: {activeSession.sessionId}
                  </h3>
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10px] font-bold rounded font-mono">
                    {activeSession.attendancePercentage}% Present
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 mt-1">
                  <span>
                    Present: <strong className="text-emerald-700 font-bold">{activeSession.presentCount}</strong>
                  </span>
                  <span>•</span>
                  <span>
                    Absent: <strong className="text-red-700 font-bold">{activeSession.absentCount}</strong>
                  </span>
                  <span>•</span>
                  <span>
                    Flagged: <strong className="text-amber-700 font-bold">{activeSession.flaggedCount}</strong>
                  </span>
                  <span>•</span>
                  <span>
                    Unknown: <strong className="text-purple-700 font-bold">{activeSession.unknownFacesCount}</strong>
                  </span>
                  <span>•</span>
                  <span className="font-mono text-slate-500">
                    {activeSession.sessionDate} at {activeSession.sessionTime}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2 shrink-0">
              <button
                onClick={(e) => handleQuickDownloadLatest(e, activeSession)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center space-x-1.5 cursor-pointer transform hover:-translate-y-0.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Excel (.xlsx)</span>
              </button>

              <button
                onClick={() => setIsResultsOpen(true)}
                className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-semibold rounded-xl transition-colors cursor-pointer flex items-center space-x-1"
              >
                <Eye className="w-3.5 h-3.5 text-blue-600" />
                <span>Audit Log</span>
              </button>
            </div>
          </div>
        )}

        {/* Department Identity Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div
            className="h-3 w-full"
            style={{ backgroundColor: activeDepartment.accentColor }}
          />
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Column 1: Department Overview */}
              <div className="lg:col-span-2 space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <span
                      className="inline-block px-2.5 py-1 text-xs font-bold rounded uppercase tracking-wider text-white mb-2"
                      style={{ backgroundColor: activeDepartment.accentColor }}
                    >
                      Department of {activeDepartment.code}
                    </span>
                    <h3 className="text-2xl font-bold text-slate-900 tracking-tight">
                      {activeDepartment.name}
                    </h3>
                    <div className="flex flex-wrap items-center gap-2 mt-2.5">
                      <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-blue-50 text-[#0066b2] border border-blue-200">
                        <span>Academic Year: <strong>Year {session.year}</strong></span>
                      </span>
                      <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-amber-50 text-amber-900 border border-amber-200 font-mono">
                        <span>Class Section: <strong>{session.section}</strong></span>
                      </span>
                      <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 font-mono">
                        <span>Cohort: {activeDepartment.code}-{session.year}-{session.section}</span>
                      </span>
                      <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-purple-50 text-purple-800 border border-purple-200 font-mono">
                        <Users className="w-3.5 h-3.5 text-purple-600" />
                        <span>Enrolled Roster: {rosterCount} Students</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Quick Action Buttons Toolbar */}
                <div className="pt-2 flex flex-wrap gap-2.5">
                  <button
                    onClick={() => setIsAttendanceWindowOpen(true)}
                    className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center space-x-2 cursor-pointer transform hover:-translate-y-0.5"
                  >
                    <Video className="w-4 h-4 animate-pulse" />
                    <span>Launch Attendance Camera (1-2 Min)</span>
                  </button>

                  <button
                    onClick={() => setIsRegistrationOpen(true)}
                    className="px-4 py-2.5 bg-[#0066b2] hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center space-x-1.5 cursor-pointer"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>Add Student (Live Snapshot)</span>
                  </button>

                  <button
                    onClick={() => setIsRosterOpen(true)}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl border border-slate-300 transition-colors flex items-center space-x-1.5 cursor-pointer"
                  >
                    <Users className="w-4 h-4 text-purple-600" />
                    <span>Manage Cohort Roster ({rosterCount})</span>
                  </button>

                  {recentSessions.length > 0 && (
                    <button
                      onClick={(e) => handleQuickDownloadLatest(e)}
                      className="px-4 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-semibold text-xs rounded-xl border border-emerald-200 transition-colors flex items-center space-x-1.5 cursor-pointer"
                      title="Download Excel report for latest session"
                    >
                      <Download className="w-4 h-4 text-emerald-600" />
                      <span>Download Latest Excel</span>
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold block">
                          Head of Department (HOD)
                        </span>
                        <button
                          type="button"
                          onClick={() => setIsEditHodOpen(true)}
                          className="text-[11px] font-bold text-blue-600 hover:text-blue-800 flex items-center space-x-1 cursor-pointer bg-white px-2 py-0.5 rounded border border-blue-200 hover:border-blue-300 shadow-2xs"
                          title="Edit HOD name, designation, email, and cabin for this department"
                        >
                          <Edit3 className="w-3 h-3 text-blue-600" />
                          <span>Edit HOD</span>
                        </button>
                      </div>
                      <span className="text-sm font-bold text-slate-900 block mt-1">
                        {activeDepartment.coordinatorName}
                      </span>
                      {activeDepartment.coordinatorDesignation && (
                        <span className="text-[11px] font-semibold text-slate-600 block mt-0.5">
                          {activeDepartment.coordinatorDesignation}
                        </span>
                      )}
                    </div>
                    <div className="mt-2.5 pt-2 border-t border-slate-200/80 space-y-0.5 text-xs">
                      <div className="flex items-center space-x-1 text-blue-600 font-mono text-[11px]">
                        <Mail className="w-3 h-3 text-blue-500 shrink-0" />
                        <span>{activeDepartment.coordinatorEmail}</span>
                      </div>
                      {activeDepartment.coordinatorCabin && (
                        <p className="text-[10px] text-slate-500 truncate mt-0.5">
                          {activeDepartment.coordinatorCabin} {activeDepartment.coordinatorPhone ? `• ${activeDepartment.coordinatorPhone}` : ''}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold block">
                      Institution &amp; Location
                    </span>
                    <span className="text-sm font-semibold text-slate-900 block mt-0.5">
                      {COLLEGE_CONFIG.name}
                    </span>
                    <span className="text-xs text-slate-600 block">
                      {COLLEGE_CONFIG.location}
                    </span>
                  </div>
                </div>
              </div>

              {/* Column 2: Session Security Details */}
              <div className="bg-slate-50 p-5 rounded-xl border border-slate-200/80 flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex items-center space-x-1.5 text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                    <Shield className="w-4 h-4 text-emerald-600" />
                    <span>Active Session Scope</span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between py-1 border-b border-slate-200">
                      <span className="text-slate-500">Username:</span>
                      <span className="font-mono font-semibold text-slate-800">{session.username}</span>
                    </div>

                    <div className="flex items-center justify-between py-1 border-b border-slate-200">
                      <span className="text-slate-500">Year &amp; Section:</span>
                      <span className="font-mono font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                        Year {session.year} • Sec {session.section}
                      </span>
                    </div>

                    <div className="flex items-center justify-between py-1 border-b border-slate-200">
                      <span className="text-slate-500">Login Time:</span>
                      <span className="font-mono text-slate-700 flex items-center space-x-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>{loginDate}</span>
                      </span>
                    </div>

                    <div className="flex items-center justify-between py-1 border-b border-slate-200">
                      <span className="text-slate-500">Recognition Threshold:</span>
                      <span className="font-mono font-semibold text-emerald-700">&ge; 76% (Match)</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={logout}
                    className="w-full py-2 px-3 text-xs font-medium text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg transition-colors flex items-center justify-center space-x-1.5 cursor-pointer shadow-2xs"
                  >
                    <Building2 className="w-3.5 h-3.5 text-slate-500" />
                    <span>Switch Department</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Department Attendance Operations */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
                <Layers className="w-5 h-5 text-[#0066b2]" />
                <span>Department Attendance Operations</span>
              </h3>
              <p className="text-xs text-slate-500">
                Classroom facial recognition recording, student roster management, and institutional attendance reports.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Slot 1: Live Video Attendance Marking */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs relative overflow-hidden group hover:border-red-400 transition-all flex flex-col justify-between">
              <div className="absolute top-0 right-0 w-24 h-24 bg-red-50 rounded-bl-full -mr-8 -mt-8 pointer-events-none transition-transform group-hover:scale-110" />
              <div>
                <div className="p-2.5 bg-red-100 text-red-700 rounded-xl w-fit mb-3">
                  <Video className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-bold text-slate-900">1. Live Attendance Camera</h4>
                <p className="text-xs text-slate-500 mt-1.5">
                  Launch 1–2 minute classroom camera sweep to identify and verify enrolled student presence.
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 space-y-2">
                <button
                  onClick={() => setIsAttendanceWindowOpen(true)}
                  className="w-full py-2 px-3 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-lg transition-colors flex items-center justify-center space-x-1.5 cursor-pointer shadow-xs"
                >
                  <Video className="w-3.5 h-3.5 animate-pulse" />
                  <span>Start Live Attendance</span>
                </button>
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>Duration: 1–2 mins</span>
                  <span className="text-emerald-600 font-bold">Camera Ready</span>
                </div>
              </div>
            </div>

            {/* Slot 2: Student Biometric Roster & Registration */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs relative overflow-hidden group hover:border-blue-400 transition-all flex flex-col justify-between">
              <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-bl-full -mr-8 -mt-8 pointer-events-none transition-transform group-hover:scale-110" />
              <div>
                <div className="p-2.5 bg-blue-100 text-blue-700 rounded-xl w-fit mb-3">
                  <UserPlus className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-bold text-slate-900">2. Student Registration</h4>
                <p className="text-xs text-slate-500 mt-1.5">
                  Register new student face biometric descriptors and manage cohort enrollments.
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 space-y-2">
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    onClick={() => setIsRegistrationOpen(true)}
                    className="py-2 px-2 bg-[#0066b2] hover:bg-blue-700 text-white font-bold text-xs rounded-lg transition-colors flex items-center justify-center space-x-1 cursor-pointer shadow-xs"
                  >
                    <UserPlus className="w-3 h-3" />
                    <span>Add Student</span>
                  </button>
                  <button
                    onClick={() => setIsRosterOpen(true)}
                    className="py-2 px-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-lg border border-slate-300 transition-colors flex items-center justify-center space-x-1 cursor-pointer"
                  >
                    <Users className="w-3 h-3 text-purple-600" />
                    <span>View Roster</span>
                  </button>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>Enrolled: {rosterCount}</span>
                  <span className="text-blue-600 font-medium">Cohort Active</span>
                </div>
              </div>
            </div>

            {/* Slot 3: Excel Report Generation & Audit */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs relative overflow-hidden group hover:border-emerald-400 transition-all flex flex-col justify-between">
              <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-bl-full -mr-8 -mt-8 pointer-events-none transition-transform group-hover:scale-110" />
              <div>
                <div className="p-2.5 bg-emerald-100 text-emerald-700 rounded-xl w-fit mb-3">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-bold text-slate-900">3. Official Excel Reports</h4>
                <p className="text-xs text-slate-500 mt-1.5">
                  Export institutional .xlsx attendance sheets with register numbers, timestamps, and percentages.
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 space-y-2">
                <button
                  onClick={() => {
                    if (recentSessions.length > 0 || activeSession) {
                      setIsResultsOpen(true);
                    } else {
                      setIsAttendanceWindowOpen(true);
                    }
                  }}
                  className="w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg transition-colors flex items-center justify-center space-x-1.5 cursor-pointer shadow-xs"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>
                    {recentSessions.length > 0 ? 'Export Excel Report' : 'Record Session'}
                  </span>
                </button>
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>Format: XLSX</span>
                  <span className="text-emerald-700 font-bold">Official College Format</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RECENT ATTENDANCE SESSIONS & DOWNLOADS TABLE */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                <span>Attendance Sessions &amp; Exportable Excel Reports</span>
              </h3>
              <p className="text-xs text-slate-500">
                All attendance sessions recorded for {activeDepartment.code} Year {session.year} Section {session.section}.
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsAttendanceWindowOpen(true)}
                className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center space-x-1.5 cursor-pointer"
              >
                <Video className="w-3.5 h-3.5 animate-pulse" />
                <span>New Session</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            {recentSessions.length === 0 && !activeSession ? (
              <div className="text-center py-12 px-4 space-y-3">
                <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
                  <Video className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-800">No Attendance Sessions Recorded Yet</h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto mt-0.5">
                    Click "Launch Attendance Camera" above to stream 1–2 minutes of classroom video and automatically mark attendance with face recognition.
                  </p>
                </div>
                <button
                  onClick={() => setIsAttendanceWindowOpen(true)}
                  className="px-4 py-2 bg-[#0066b2] hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer inline-flex items-center space-x-1.5"
                >
                  <Video className="w-4 h-4" />
                  <span>Record First Attendance Session</span>
                </button>
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Session ID</th>
                    <th className="px-4 py-3">Date &amp; Time</th>
                    <th className="px-4 py-3">Duration</th>
                    <th className="px-4 py-3">Attendance Rate</th>
                    <th className="px-4 py-3">Present / Enrolled</th>
                    <th className="px-4 py-3">Flagged</th>
                    <th className="px-4 py-3">Unknown</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-sans">
                  {recentSessions.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3 font-mono font-bold text-slate-900">
                        {s.sessionId}
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-600">
                        {s.sessionDate} • {s.sessionTime}
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-600">
                        {s.recordingDurationSeconds}s
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 font-mono">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>{s.attendancePercentage}%</span>
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono">
                        <strong className="text-emerald-700">{s.presentCount}</strong> /{' '}
                        <span className="text-slate-500">{s.results.length}</span>
                      </td>
                      <td className="px-4 py-3 font-mono">
                        {s.flaggedCount > 0 ? (
                          <span className="text-amber-700 font-bold">{s.flaggedCount}</span>
                        ) : (
                          <span className="text-slate-400">0</span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-mono">
                        {s.unknownFacesCount > 0 ? (
                          <span className="text-purple-700 font-bold">{s.unknownFacesCount}</span>
                        ) : (
                          <span className="text-slate-400">0</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right space-x-2">
                        <button
                          onClick={() => handleOpenResults(s)}
                          className="px-2.5 py-1 text-slate-700 hover:text-[#0066b2] bg-slate-100 hover:bg-blue-50 border border-slate-200 rounded-lg font-semibold transition-colors cursor-pointer"
                        >
                          View Audit
                        </button>
                        <button
                          onClick={(e) => handleQuickDownloadLatest(e, s)}
                          className="px-2.5 py-1 text-emerald-800 hover:text-emerald-950 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg font-bold transition-colors cursor-pointer inline-flex items-center space-x-1"
                        >
                          <Download className="w-3 h-3 text-emerald-600" />
                          <span>.XLSX</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500">
          <div className="flex items-center space-x-2">
            <span>{COLLEGE_CONFIG.name}</span>
            <span>•</span>
            <span>{COLLEGE_CONFIG.accreditation}</span>
          </div>
          <div className="mt-2 sm:mt-0 flex items-center space-x-2">
            <span>Logged in as: <strong className="text-slate-700 font-mono">{session.username}</strong></span>
          </div>
        </div>
      </footer>

      {/* PHASE 2 MODALS & FULL-SCREEN LIVE WINDOW */}
      {/* 1. Full-Screen Live Video Stream Attendance Window */}
      <LiveAttendanceWindow
        isOpen={isAttendanceWindowOpen}
        onClose={() => setIsAttendanceWindowOpen(false)}
        onStartedBackgroundProcessing={(newSession) => {
          setActiveSession(newSession);
        }}
      />

      {/* 2. Student Biometric Registration Modal */}
      <StudentRegistrationModal
        isOpen={isRegistrationOpen}
        onClose={() => setIsRegistrationOpen(false)}
        onStudentRegistered={() => {
          refreshRosterCount();
        }}
      />

      {/* 3. Cohort Roster Management Modal */}
      <RosterManagementModal
        isOpen={isRosterOpen}
        onClose={() => {
          setIsRosterOpen(false);
          refreshRosterCount();
        }}
        onOpenAddStudent={() => {
          setIsRegistrationOpen(true);
        }}
      />

      {/* 4. Attendance Results & Excel Export Modal */}
      <AttendanceResultsModal
        isOpen={isResultsOpen}
        onClose={() => setIsResultsOpen(false)}
        session={activeSession || recentSessions[0] || null}
      />

      {/* 5. Custom HOD Profile Edit Modal */}
      <EditHodModal
        isOpen={isEditHodOpen}
        onClose={() => setIsEditHodOpen(false)}
      />
    </div>
  );
};
