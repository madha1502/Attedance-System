import React, { useState, useEffect } from 'react';
import {
  Lock,
  User,
  Eye,
  EyeOff,
  LogIn,
  ShieldCheck,
  ArrowLeft,
  AlertCircle,
  Building2,
  Calendar,
  GraduationCap,
} from 'lucide-react';
import { CollegeLogo } from './CollegeLogo';
import { PasswordRecoveryModal } from './PasswordRecoveryModal';
import {
  COLLEGE_CONFIG,
  DEPARTMENTS,
  DEPARTMENT_CREDENTIALS,
} from '../config/departments.config';
import { useAuth } from '../context/AuthContext';
import { AcademicYearRoman } from '../types/auth';

interface LoginScreenProps {
  onBackToWelcome: () => void;
  initialCredentials?: { username: string; pass: string } | null;
}

const YEAR_OPTIONS: { value: AcademicYearRoman; label: string; sub: string }[] = [
  { value: 'I', label: 'Year I', sub: '1st Year' },
  { value: 'II', label: 'Year II', sub: '2nd Year' },
  { value: 'III', label: 'Year III', sub: '3rd Year' },
  { value: 'IV', label: 'Year IV', sub: 'Final Year' },
];

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onBackToWelcome,
  initialCredentials,
}) => {
  const { login, isLoading, error, clearError } = useAuth();

  // Inputs
  const [username, setUsername] = useState(initialCredentials?.username || '');
  const [year, setYear] = useState<AcademicYearRoman>('III');
  const [section, setSection] = useState('A');
  const [password, setPassword] = useState(initialCredentials?.pass || '');
  const [showPassword, setShowPassword] = useState(false);
  const [isRecoveryOpen, setIsRecoveryOpen] = useState(false);

  // Sync if passed
  useEffect(() => {
    if (initialCredentials) {
      setUsername(initialCredentials.username);
      setPassword(initialCredentials.pass);
      clearError();
    }
  }, [initialCredentials, clearError]);

  const normalizedUsername = username.trim().toLowerCase();
  const isAdminMode = normalizedUsername === 'admin' || normalizedUsername === 'vsbec_admin';

  // Matched department for department coordinators
  const matchedCred = DEPARTMENT_CREDENTIALS.find(
    (c) => c.username.toLowerCase() === normalizedUsername
  );
  const matchedDept = matchedCred
    ? DEPARTMENTS.find((d) => d.id === matchedCred.departmentId)
    : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    if (!username.trim() || !password.trim()) return;
    if (!isAdminMode && !section.trim()) return;

    await login(username, year, section, password);
  };

  const handleSectionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    const filtered = rawValue.toUpperCase().replace(/[^A-Z]/g, '');
    const singleChar = filtered.slice(-1);
    setSection(singleChar);
    if (error) clearError();
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-between items-center px-4 py-8 relative overflow-hidden select-none">
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-900 to-blue-950 pointer-events-none" />

      {/* Top Header Navigation - Clean Back Button */}
      <header className="w-full max-w-md flex items-center justify-between z-10">
        <button
          onClick={onBackToWelcome}
          className="flex items-center space-x-1.5 text-xs text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back</span>
        </button>
        <span className="text-xs text-slate-400 font-mono">Autonomous Portal</span>
      </header>

      {/* Center Auth Card */}
      <main className="w-full max-w-md my-auto z-10 py-4">
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
          {/* Header inside Card */}
          <div className="p-6 pb-4 bg-slate-50/80 border-b border-slate-200 text-center">
            <div className="inline-block mb-2">
              <CollegeLogo size="md" />
            </div>
            <h2 className="text-lg font-bold text-[#0066b2] tracking-tight leading-snug">
              {COLLEGE_CONFIG.name}
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              {isAdminMode
                ? 'Institutional Administrator Portal'
                : 'Department Attendance & Academic Portal'}
            </p>
          </div>

          {/* Role Status Banner */}
          {isAdminMode ? (
            <div className="bg-blue-50 border-b border-blue-200 px-5 py-2.5 flex items-center justify-between text-xs">
              <div className="flex items-center space-x-2 text-[#0066b2] font-semibold">
                <ShieldCheck className="w-4 h-4 text-[#0066b2]" />
                <span>Administrator Mode</span>
              </div>
              <span className="text-[11px] text-slate-500">Central Authority</span>
            </div>
          ) : matchedDept ? (
            <div className="bg-slate-50 border-b border-slate-200 px-5 py-2.5 flex items-center justify-between text-xs">
              <div className="flex items-center space-x-2">
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: matchedDept.accentColor }}
                />
                <span className="font-semibold text-slate-900">{matchedDept.name}</span>
              </div>
              <span className="text-xs text-slate-500 font-mono font-medium">{matchedDept.code}</span>
            </div>
          ) : null}

          {/* Login Form Body */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Error Banner */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start space-x-2 text-xs text-red-800 animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <strong className="font-semibold block">Authentication Error</strong>
                  <span>{error}</span>
                </div>
              </div>
            )}

            {/* 1. Username (Admin or Department) */}
            <div>
              <label
                htmlFor="username"
                className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1"
              >
                Username
              </label>
              <div className="relative rounded-xl">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  autoComplete="username"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    if (error) clearError();
                  }}
                  placeholder="Enter username"
                  className="block w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0066b2] focus:border-transparent transition-colors font-mono"
                />
              </div>
            </div>

            {/* Department-specific inputs: Year & Section (Hidden when Admin Mode is active) */}
            {!isAdminMode ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {/* Year */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1 flex items-center space-x-1">
                    <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
                    <span>Academic Year</span>
                  </label>
                  <select
                    value={year}
                    onChange={(e) => {
                      setYear(e.target.value as AcademicYearRoman);
                      if (error) clearError();
                    }}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0066b2]"
                  >
                    {YEAR_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label} ({opt.sub})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Section */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1 flex items-center space-x-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>Section</span>
                  </label>
                  <input
                    type="text"
                    maxLength={1}
                    value={section}
                    onChange={handleSectionChange}
                    placeholder="A, B, or C"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono font-bold text-center uppercase focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0066b2]"
                    required
                  />
                </div>
              </div>
            ) : (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 flex items-center space-x-2">
                <Building2 className="w-4 h-4 text-[#0066b2] shrink-0" />
                <span>Scope: All Departments &amp; Rosters</span>
              </div>
            )}

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label
                  htmlFor="password"
                  className="block text-xs font-semibold text-slate-700 uppercase tracking-wider"
                >
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setIsRecoveryOpen(true)}
                  className="text-xs text-[#0066b2] hover:underline"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative rounded-xl">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) clearError();
                  }}
                  placeholder="Enter password"
                  className="block w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0066b2] focus:border-transparent transition-colors font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 bg-[#0066b2] hover:bg-[#005596] text-white font-medium rounded-xl shadow-md shadow-blue-900/10 transition-colors cursor-pointer flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                {isLoading ? (
                  <span>Signing In...</span>
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span>
                      {isAdminMode ? 'Sign In to Administrator Panel' : 'Sign In to Department Console'}
                    </span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-4xl text-center text-xs text-slate-500 z-10 pt-2">
        <span>{COLLEGE_CONFIG.name} · Institutional Attendance Management System</span>
      </footer>

      {/* Password Recovery Modal */}
      <PasswordRecoveryModal
        isOpen={isRecoveryOpen}
        onClose={() => setIsRecoveryOpen(false)}
        initialDepartmentId={matchedDept?.id || 'cse'}
        onPasswordResetSuccess={(newUsername, newPass) => {
          setUsername(newUsername);
          setPassword(newPass);
          setIsRecoveryOpen(false);
        }}
      />
    </div>
  );
};
