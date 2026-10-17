import React, { useState } from 'react';
import {
  X,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Building2,
  Users,
  Search,
  Sparkles,
  RefreshCw,
  HelpCircle,
  Eye,
} from 'lucide-react';
import { AttendanceSessionRecord } from '../types/attendance';
import { downloadAttendanceExcel } from '../services/excelReportGenerator';

interface AttendanceResultsModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: AttendanceSessionRecord | null;
}

export const AttendanceResultsModal: React.FC<AttendanceResultsModalProps> = ({
  isOpen,
  onClose,
  session,
}) => {
  const [activeTab, setActiveTab] = useState<'roster' | 'unknown'>('roster');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Present' | 'Absent' | 'Flagged'>('All');
  const [search, setSearch] = useState('');
  const [isExporting, setIsExporting] = useState(false);

  if (!isOpen || !session) return null;

  const isProcessing = session.status === 'processing';

  const handleDownloadExcel = () => {
    setIsExporting(true);
    try {
      downloadAttendanceExcel(session);
    } catch (err) {
      console.error('Failed generating Excel report:', err);
    } finally {
      setTimeout(() => setIsExporting(false), 800);
    }
  };

  const filteredResults = session.results.filter((r) => {
    const matchesFilter =
      statusFilter === 'All'
        ? true
        : statusFilter === 'Present'
        ? r.status === 'Present'
        : statusFilter === 'Absent'
        ? r.status === 'Absent'
        : r.status === 'Flagged for Review';

    const matchesSearch =
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.registerNumber.includes(search);

    return matchesFilter && matchesSearch;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 to-blue-950 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-emerald-600 rounded-xl text-white shadow-sm">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold tracking-tight">
                  Attendance Session Audit &amp; Report
                </h3>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono uppercase ${
                    session.status === 'completed'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse'
                  }`}
                >
                  {session.status}
                </span>
              </div>
              <p className="text-xs text-blue-200">
                Session: {session.sessionId} • {session.sessionDate} at {session.sessionTime}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Active Background Processing Progress Bar */}
          {isProcessing && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl space-y-2 animate-in fade-in">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-blue-950 flex items-center space-x-1.5">
                  <RefreshCw className="w-4 h-4 text-blue-600 animate-spin" />
                  <span>{session.processingStatusText}</span>
                </span>
                <span className="font-mono font-bold text-blue-800">
                  {session.processingProgress}%
                </span>
              </div>
              <div className="w-full h-2.5 bg-blue-200/80 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 transition-all duration-300 ease-out"
                  style={{ width: `${session.processingProgress}%` }}
                />
              </div>
              <p className="text-[11px] text-blue-700">
                Processing is asynchronous. You can close this window or continue using the app while recognition finishes.
              </p>
            </div>
          )}

          {/* Metrics Summary Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
              <span className="text-[11px] font-bold text-slate-500 uppercase block">Enrolled</span>
              <span className="text-xl font-black text-slate-900 font-mono mt-0.5 block">
                {session.results.length}
              </span>
              <span className="text-[10px] text-slate-400 font-medium">Students</span>
            </div>

            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl">
              <span className="text-[11px] font-bold text-emerald-800 uppercase block flex items-center space-x-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                <span>Present</span>
              </span>
              <span className="text-xl font-black text-emerald-950 font-mono mt-0.5 block">
                {session.presentCount}
              </span>
              <span className="text-[10px] text-emerald-700 font-bold">
                {session.attendancePercentage}% Rate
              </span>
            </div>

            <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl">
              <span className="text-[11px] font-bold text-red-800 uppercase block flex items-center space-x-1">
                <XCircle className="w-3 h-3 text-red-600" />
                <span>Absent</span>
              </span>
              <span className="text-xl font-black text-red-950 font-mono mt-0.5 block">
                {session.absentCount}
              </span>
              <span className="text-[10px] text-red-700 font-medium">Not detected</span>
            </div>

            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl">
              <span className="text-[11px] font-bold text-amber-800 uppercase block flex items-center space-x-1">
                <AlertTriangle className="w-3 h-3 text-amber-600" />
                <span>Flagged</span>
              </span>
              <span className="text-xl font-black text-amber-950 font-mono mt-0.5 block">
                {session.flaggedCount}
              </span>
              <span className="text-[10px] text-amber-700 font-medium">Low confidence</span>
            </div>

            <div className="p-3.5 bg-purple-50 border border-purple-200 rounded-xl col-span-2 sm:col-span-1">
              <span className="text-[11px] font-bold text-purple-800 uppercase block">Unknown</span>
              <span className="text-xl font-black text-purple-950 font-mono mt-0.5 block">
                {session.unknownFacesCount}
              </span>
              <span className="text-[10px] text-purple-700 font-medium">Unregistered</span>
            </div>
          </div>

          {/* Download Excel Action Bar */}
          <div className="p-4 bg-gradient-to-r from-emerald-500/10 via-blue-500/10 to-transparent border border-emerald-500/20 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3">
            <div>
              <h4 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                <span>Automated Excel Report (.xlsx)</span>
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Complete student-by-student attendance audit with date, time, confidence, and unknown face records.
              </p>
            </div>

            <button
              onClick={handleDownloadExcel}
              disabled={isExporting}
              className="w-full sm:w-auto px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs shadow-md transition-all flex items-center justify-center space-x-2 cursor-pointer shrink-0"
            >
              <Download className="w-4 h-4" />
              <span>{isExporting ? 'Generating XLSX...' : 'Download Excel Report'}</span>
            </button>
          </div>

          {/* Sub Navigation Tabs */}
          <div className="flex border-b border-slate-200 space-x-4 text-xs font-bold">
            <button
              onClick={() => setActiveTab('roster')}
              className={`pb-2 border-b-2 transition-colors cursor-pointer ${
                activeTab === 'roster'
                  ? 'border-[#0066b2] text-[#0066b2]'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Student Attendance Table ({session.results.length})
            </button>
            <button
              onClick={() => setActiveTab('unknown')}
              className={`pb-2 border-b-2 transition-colors cursor-pointer flex items-center space-x-1.5 ${
                activeTab === 'unknown'
                  ? 'border-[#0066b2] text-[#0066b2]'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <span>Unknown Faces Audit</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-purple-100 text-purple-700 font-mono">
                {session.unknownFaces.length}
              </span>
            </button>
          </div>

          {/* TAB 1: STUDENT ROSTER ATTENDANCE TABLE */}
          {activeTab === 'roster' && (
            <div className="space-y-3">
              {/* Filter pills & search */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
                <div className="flex items-center space-x-1.5 w-full sm:w-auto">
                  {(['All', 'Present', 'Absent', 'Flagged'] as const).map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setStatusFilter(filter)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                        statusFilter === filter
                          ? 'bg-slate-900 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {filter}
                    </button>
                  ))}
                </div>

                <div className="relative w-full sm:w-64">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search students..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0066b2]"
                  />
                </div>
              </div>

              {/* Attendance Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                    <tr>
                      <th className="px-3.5 py-2.5">S.No</th>
                      <th className="px-3.5 py-2.5">Register No</th>
                      <th className="px-3.5 py-2.5">Student Name</th>
                      <th className="px-3.5 py-2.5">Status</th>
                      <th className="px-3.5 py-2.5">Confidence</th>
                      <th className="px-3.5 py-2.5">First Seen</th>
                      <th className="px-3.5 py-2.5">Detections</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-sans">
                    {filteredResults.map((r, idx) => (
                      <tr key={r.registerNumber} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-3.5 py-2 font-mono text-slate-400">{idx + 1}</td>
                        <td className="px-3.5 py-2 font-mono font-bold text-slate-900">
                          {r.registerNumber}
                        </td>
                        <td className="px-3.5 py-2 font-semibold text-slate-800">
                          {r.name}
                        </td>
                        <td className="px-3.5 py-2">
                          {r.status === 'Present' ? (
                            <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>Present</span>
                            </span>
                          ) : r.status === 'Flagged for Review' ? (
                            <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                              <AlertTriangle className="w-3 h-3 text-amber-600" />
                              <span>Flagged</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-red-50 text-red-700 border border-red-200">
                              <XCircle className="w-3 h-3 text-red-600" />
                              <span>Absent</span>
                            </span>
                          )}
                        </td>
                        <td className="px-3.5 py-2 font-mono">
                          {r.confidence > 0 ? (
                            <span
                              className={`font-bold ${
                                r.confidence >= 76
                                  ? 'text-emerald-700'
                                  : r.confidence >= 60
                                  ? 'text-amber-700'
                                  : 'text-slate-500'
                              }`}
                            >
                              {r.confidence}%
                            </span>
                          ) : (
                            <span className="text-slate-400">N/A</span>
                          )}
                        </td>
                        <td className="px-3.5 py-2 font-mono text-slate-600">
                          {r.firstDetectedAt || '—'}
                        </td>
                        <td className="px-3.5 py-2 font-mono text-slate-700">
                          {r.detectionsCount > 0 ? `${r.detectionsCount} frames` : '0'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: UNKNOWN FACES AUDIT */}
          {activeTab === 'unknown' && (
            <div className="space-y-4">
              {session.unknownFaces.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                  <h4 className="text-sm font-bold text-slate-800">
                    No Unregistered Faces Encountered
                  </h4>
                  <p className="text-xs text-slate-500">
                    All individuals detected in the live camera footage resolved cleanly against the registered cohort roster.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {session.unknownFaces.map((u, idx) => (
                    <div
                      key={u.id}
                      className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2"
                    >
                      <div className="aspect-video bg-black rounded-lg overflow-hidden relative">
                        <img
                          src={u.snapshotUrl}
                          alt={`Unknown #${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <span className="absolute top-2 left-2 px-2 py-0.5 bg-slate-950/80 text-amber-300 font-mono text-[10px] rounded font-bold">
                          Frame {u.frameIndex}
                        </span>
                      </div>
                      <div className="text-xs space-y-0.5">
                        <div className="flex items-center justify-between">
                          <strong className="text-slate-800">Unknown #{idx + 1}</strong>
                          <span className="font-mono text-slate-500">
                            {(u.timestampMs / 1000).toFixed(1)}s
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500">
                          Highest Similarity: {u.confidenceBest}% (Below 76% threshold)
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>Excel generated dynamically via SheetJS</span>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleDownloadExcel}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg transition-colors cursor-pointer flex items-center space-x-1"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download .xlsx</span>
            </button>
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-700 font-semibold hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
