import React, { useState, useEffect } from 'react';
import {
  X,
  Users,
  UserPlus,
  Trash2,
  ShieldCheck,
  Search,
  CheckCircle2,
  Calendar,
  Building2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { StudentProfile } from '../types/attendance';
import { getRoster, deleteStudent, resetCohortTo100Students } from '../services/studentStore';

interface RosterManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenAddStudent: () => void;
}

export const RosterManagementModal: React.FC<RosterManagementModalProps> = ({
  isOpen,
  onClose,
  onOpenAddStudent,
}) => {
  const { session, activeDepartment } = useAuth();
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const loadStudents = () => {
    if (!session || !activeDepartment) return;
    const list = getRoster(activeDepartment.id, session.year, session.section);
    setStudents(list);
  };

  const handleResetTo100 = () => {
    if (!session || !activeDepartment) return;
    const restored = resetCohortTo100Students(activeDepartment.id, session.year, session.section);
    setStudents(restored);
  };

  useEffect(() => {
    if (isOpen) {
      loadStudents();
    }
  }, [isOpen, session, activeDepartment]);

  if (!isOpen) return null;

  const filtered = students.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.registerNumber.includes(searchQuery)
  );

  const handleDelete = (regNum: string, name: string) => {
    if (!session || !activeDepartment) return;
    if (window.confirm(`Remove ${name} from this cohort roster?`)) {
      deleteStudent(activeDepartment.id, session.year, session.section, regNum);
      loadStudents();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 to-blue-950 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-600 rounded-xl text-white shadow-sm">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold tracking-tight">
                Student Biometric Cohort Roster
              </h3>
              <p className="text-xs text-blue-200">
                Department of {activeDepartment?.name} ({activeDepartment?.code}) • Year {session?.year} - Sec {session?.section}
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

        {/* Action & Filter Bar */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name or register no..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0066b2]"
            />
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto justify-end flex-wrap gap-1.5">
            <span className="text-xs text-slate-500 font-mono font-medium">
              Enrolled: <strong className="text-slate-900">{students.length}</strong> / 100 students
            </span>
            <button
              type="button"
              onClick={handleResetTo100}
              className="flex items-center space-x-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs border border-slate-300 transition-colors cursor-pointer"
              title="Ensure full 100 students cohort is populated for this department"
            >
              <span>Reset 100-Student Cohort</span>
            </button>
            <button
              onClick={() => {
                onClose();
                onOpenAddStudent();
              }}
              className="flex items-center space-x-1.5 px-3.5 py-2 bg-[#0066b2] hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-xs transition-colors cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Register New Student</span>
            </button>
          </div>
        </div>

        {/* Table List */}
        <div className="flex-1 overflow-y-auto p-4">
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-slate-400 space-y-2">
              <Users className="w-10 h-10 mx-auto text-slate-300" />
              <p className="text-sm font-medium">No students found matching query.</p>
            </div>
          ) : (
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Photo</th>
                    <th className="px-4 py-3">Register Number</th>
                    <th className="px-4 py-3">Student Name</th>
                    <th className="px-4 py-3">Cohort</th>
                    <th className="px-4 py-3">Biometric Quality</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-sans">
                  {filtered.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-2.5">
                        <div className="w-9 h-9 rounded-full overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                          <img
                            src={s.faceThumbnail}
                            alt={s.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </td>
                      <td className="px-4 py-2.5 font-mono font-bold text-slate-900">
                        {s.registerNumber}
                      </td>
                      <td className="px-4 py-2.5 font-semibold text-slate-800">
                        {s.name}
                      </td>
                      <td className="px-4 py-2.5 font-mono text-slate-500">
                        {s.departmentCode} - Year {s.year} - {s.section}
                      </td>
                      <td className="px-4 py-2.5">
                        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>{s.qualityScore}% Quality</span>
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <button
                          onClick={() => handleDelete(s.id, s.name)}
                          className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                          title="Remove from roster"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>Face descriptors stored in 128-d normalized embeddings</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-700 font-medium hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Close Roster
          </button>
        </div>
      </div>
    </div>
  );
};
