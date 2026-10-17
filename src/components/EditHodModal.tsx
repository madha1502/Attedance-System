import React, { useState, useEffect } from 'react';
import {
  X,
  UserCheck,
  Mail,
  Phone,
  Building,
  GraduationCap,
  RotateCcw,
  Save,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Building2,
} from 'lucide-react';
import { Department } from '../types/auth';
import { useAuth } from '../context/AuthContext';
import {
  DEPARTMENTS,
  getStoredDepartmentProfile,
  saveDepartmentProfile,
  resetDepartmentProfile,
} from '../config/departments.config';

interface EditHodModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetDepartmentId?: string;
  onProfileUpdated?: (updatedDept: Department) => void;
}

export const EditHodModal: React.FC<EditHodModalProps> = ({
  isOpen,
  onClose,
  targetDepartmentId,
  onProfileUpdated,
}) => {
  const { activeDepartment, updateDepartmentProfile } = useAuth();

  const [selectedDeptId, setSelectedDeptId] = useState<string>(
    targetDepartmentId || activeDepartment?.id || 'cse'
  );

  const [hodName, setHodName] = useState('');
  const [hodDesignation, setHodDesignation] = useState('');
  const [hodEmail, setHodEmail] = useState('');
  const [hodCabin, setHodCabin] = useState('');
  const [hodPhone, setHodPhone] = useState('');
  const [isSaved, setIsSaved] = useState(false);

  // Sync selected department and its stored profile
  useEffect(() => {
    if (isOpen) {
      const initialId = targetDepartmentId || activeDepartment?.id || 'cse';
      setSelectedDeptId(initialId);
      loadProfileForDept(initialId);
      setIsSaved(false);
    }
  }, [isOpen, targetDepartmentId, activeDepartment]);

  const loadProfileForDept = (deptId: string) => {
    const base = DEPARTMENTS.find((d) => d.id === deptId) || DEPARTMENTS[0];
    const profile = getStoredDepartmentProfile(base);
    setHodName(profile.coordinatorName || '');
    setHodDesignation(profile.coordinatorDesignation || 'Professor & Head of Department');
    setHodEmail(profile.coordinatorEmail || `hod.${deptId}@vsbec.ac.in`);
    setHodCabin(profile.coordinatorCabin || '');
    setHodPhone(profile.coordinatorPhone || '');
  };

  const handleDeptSelect = (deptId: string) => {
    setSelectedDeptId(deptId);
    loadProfileForDept(deptId);
    setIsSaved(false);
  };

  const currentDeptBase = DEPARTMENTS.find((d) => d.id === selectedDeptId) || DEPARTMENTS[0];

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hodName.trim() || !hodEmail.trim()) return;

    const updates: Partial<Department> = {
      coordinatorName: hodName.trim(),
      coordinatorDesignation: hodDesignation.trim(),
      coordinatorEmail: hodEmail.trim(),
      coordinatorCabin: hodCabin.trim(),
      coordinatorPhone: hodPhone.trim(),
    };

    const saved = saveDepartmentProfile(selectedDeptId, updates);

    // If currently logged-in department was updated, sync auth context
    if (activeDepartment && activeDepartment.id === selectedDeptId) {
      updateDepartmentProfile(updates);
    }

    if (saved && onProfileUpdated) {
      onProfileUpdated(saved);
    }

    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      onClose();
    }, 1200);
  };

  const handleReset = () => {
    const restored = resetDepartmentProfile(selectedDeptId);
    if (restored) {
      loadProfileForDept(selectedDeptId);
      if (activeDepartment && activeDepartment.id === selectedDeptId) {
        updateDepartmentProfile({
          coordinatorName: restored.coordinatorName,
          coordinatorDesignation: restored.coordinatorDesignation,
          coordinatorEmail: restored.coordinatorEmail,
          coordinatorCabin: restored.coordinatorCabin,
          coordinatorPhone: restored.coordinatorPhone,
        });
      }
      if (onProfileUpdated) {
        onProfileUpdated(restored);
      }
    }
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 to-blue-950 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div
              className="p-2 rounded-xl text-white shadow-xs"
              style={{ backgroundColor: currentDeptBase.accentColor }}
            >
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold tracking-tight">
                Department HOD &amp; Coordinator Directory
              </h3>
              <p className="text-xs text-blue-200">
                Department of {currentDeptBase.name} ({currentDeptBase.code})
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
          {/* Note Banner */}
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 flex items-start space-x-2">
            <Sparkles className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <strong className="block font-semibold">Department-to-Department Customization:</strong>
              <span>
                Each department has its own designated Head of Department (HOD) and official email address.
                Select any department below to inspect and customize its HOD information.
              </span>
            </div>
          </div>

          {/* Department Selector Pills */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center space-x-1">
              <Building2 className="w-3.5 h-3.5 text-blue-600" />
              <span>Select Department to Edit:</span>
            </label>
            <div className="flex flex-wrap gap-1.5">
              {DEPARTMENTS.map((d) => {
                const isSelected = d.id === selectedDeptId;
                return (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => handleDeptSelect(d.id)}
                    className={`px-2.5 py-1 text-xs rounded-lg font-bold transition-all cursor-pointer flex items-center space-x-1 ${
                      isSelected
                        ? 'bg-[#0066b2] text-white shadow-xs ring-2 ring-blue-500/40'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                    }`}
                  >
                    <span>{d.code}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {isSaved && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center space-x-2 text-xs text-emerald-800 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                HOD details for <strong>{currentDeptBase.name}</strong> saved and updated across the portal!
              </span>
            </div>
          )}

          {/* 1. HOD Full Name */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Head of Department (HOD) Name *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <GraduationCap className="w-4 h-4" />
              </div>
              <input
                type="text"
                required
                value={hodName}
                onChange={(e) => setHodName(e.target.value)}
                placeholder="e.g. Dr. M. Sangeetha, M.E., Ph.D."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0066b2]"
              />
            </div>
          </div>

          {/* 2. Designation */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Designation / Title
            </label>
            <input
              type="text"
              value={hodDesignation}
              onChange={(e) => setHodDesignation(e.target.value)}
              placeholder="e.g. Professor & Head of Department"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0066b2]"
            />
          </div>

          {/* 3. Official Email */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Official Departmental Email *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Mail className="w-4 h-4" />
              </div>
              <input
                type="email"
                required
                value={hodEmail}
                onChange={(e) => setHodEmail(e.target.value)}
                placeholder={`e.g. hod.${currentDeptBase.id}@vsbec.ac.in`}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0066b2]"
              />
            </div>
          </div>

          {/* 4. Grid: Cabin Location & Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Cabin / Office Location
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Building className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={hodCabin}
                  onChange={(e) => setHodCabin(e.target.value)}
                  placeholder="e.g. Academic Block 1 - Room 104"
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0066b2]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Contact Number / Intercom
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Phone className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={hodPhone}
                  onChange={(e) => setHodPhone(e.target.value)}
                  placeholder="e.g. +91 94430 11201"
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0066b2]"
                />
              </div>
            </div>
          </div>

          {/* Live Preview Card */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Department Preview ({currentDeptBase.code}):
            </span>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-slate-900">
                {hodName || 'HOD Name'}
              </span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-100 text-[#0066b2] font-semibold">
                {hodDesignation || 'HOD'}
              </span>
            </div>
            <p className="text-[11px] text-blue-600 font-mono">
              {hodEmail || `hod.${currentDeptBase.id}@vsbec.ac.in`}
            </p>
            {hodCabin && (
              <p className="text-[10px] text-slate-500">
                Location: {hodCabin} {hodPhone ? `• ${hodPhone}` : ''}
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleReset}
              className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold rounded-xl text-xs transition-colors flex items-center space-x-1 cursor-pointer"
              title="Reset this department to official college default"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset to Default</span>
            </button>

            <button
              type="submit"
              className="py-2.5 px-5 bg-[#0066b2] hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-md transition-all flex items-center space-x-1.5 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Save &amp; Update HOD Details</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
