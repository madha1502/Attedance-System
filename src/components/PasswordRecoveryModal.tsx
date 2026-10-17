import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Mail,
  KeyRound,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Copy,
  Check,
  ExternalLink,
  ShieldAlert,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  Building2,
  Send,
  Clock,
  Sparkles,
  RefreshCw,
  FastForward,
} from 'lucide-react';
import { COLLEGE_CONFIG, DEPARTMENTS, getStoredDepartmentProfile } from '../config/departments.config';
import { hashPassword, generateSalt } from '../utils/crypto';

interface PasswordRecoveryModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialDepartmentId?: string;
  onPasswordResetSuccess?: (username: string, newPass: string) => void;
}

const TOTAL_WAIT_SECONDS = 6;
const RESEND_COOLDOWN_SECONDS = 30;

export const PasswordRecoveryModal: React.FC<PasswordRecoveryModalProps> = ({
  isOpen,
  onClose,
  initialDepartmentId,
  onPasswordResetSuccess,
}) => {
  const [selectedDeptId, setSelectedDeptId] = useState<string>(initialDepartmentId || 'cse');
  const [step, setStep] = useState<'request' | 'waiting' | 'sent' | 'resetting' | 'done'>('request');
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Simulated email delivery countdown state
  const [countdown, setCountdown] = useState<number>(TOTAL_WAIT_SECONDS);
  const [isPaused, setIsPaused] = useState(false);

  // Resend cooldown timer
  const [resendCooldown, setResendCooldown] = useState<number>(0);

  // Simulated link state
  const [resetToken, setResetToken] = useState('');
  const [matchedDepartment, setMatchedDepartment] = useState<typeof DEPARTMENTS[0] | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Reset password inputs
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // Timer reference for safe cleanup
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const resendTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Clean timers when modal closes or unmounts
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (resendTimerRef.current) clearInterval(resendTimerRef.current);
    };
  }, []);

  // Handle countdown timer during 'waiting' step
  useEffect(() => {
    if (step !== 'waiting') return;
    if (isPaused) return;

    if (countdown <= 0) {
      // Countdown completed: deliver simulated email
      handleDeliveryComplete();
      return;
    }

    timerRef.current = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [step, countdown, isPaused]);

  // Handle resend cooldown countdown
  useEffect(() => {
    if (resendCooldown <= 0) return;

    resendTimerRef.current = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => {
      if (resendTimerRef.current) clearInterval(resendTimerRef.current);
    };
  }, [resendCooldown]);

  if (!isOpen) return null;

  // Sync initial department and email on open
  useEffect(() => {
    if (isOpen) {
      const targetId = initialDepartmentId || 'cse';
      setSelectedDeptId(targetId);
      const base = DEPARTMENTS.find((d) => d.id === targetId) || DEPARTMENTS[0];
      const profile = getStoredDepartmentProfile(base);
      setEmail(profile.coordinatorEmail);
      setMatchedDepartment(profile);
      setStep('request');
      setError(null);
    }
  }, [isOpen, initialDepartmentId]);

  const handleSelectDepartment = (deptId: string) => {
    setSelectedDeptId(deptId);
    const base = DEPARTMENTS.find((d) => d.id === deptId) || DEPARTMENTS[0];
    const profile = getStoredDepartmentProfile(base);
    setEmail(profile.coordinatorEmail);
    setMatchedDepartment(profile);
    setError(null);
  };

  const activeDeptProfile = matchedDepartment || getStoredDepartmentProfile(
    DEPARTMENTS.find((d) => d.id === selectedDeptId) || DEPARTMENTS[0]
  );

  const simulatedResetUrl = `https://vsbec.ac.in/portal/auth/reset?token=${resetToken}&dept=${
    activeDeptProfile.id || 'dept'
  }`;

  // Start simulated delivery with countdown
  const handleRequestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setError('Please enter a valid department email address.');
      return;
    }

    const currentBase = DEPARTMENTS.find((d) => d.id === selectedDeptId) || DEPARTMENTS[0];
    const foundDept = getStoredDepartmentProfile(currentBase);

    const token = `VSBEC-RST-${Date.now().toString(36).toUpperCase()}-${Math.random()
      .toString(36)
      .substring(2, 8)
      .toUpperCase()}`;

    setMatchedDepartment(foundDept);
    setResetToken(token);
    setCountdown(TOTAL_WAIT_SECONDS);
    setIsPaused(false);
    setStep('waiting');
  };

  // Called when countdown finishes or user skips wait
  const handleDeliveryComplete = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setStep('sent');
    setResendCooldown(RESEND_COOLDOWN_SECONDS);
  };

  // Resend handler
  const handleResend = () => {
    if (resendCooldown > 0) return;
    setCountdown(TOTAL_WAIT_SECONDS);
    setIsPaused(false);
    setStep('waiting');
  };

  // Handle setting new password
  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match. Please re-enter.');
      return;
    }

    setIsUpdating(true);
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Compute salt and hash for verification in console/logs
    const salt = generateSalt(16);
    await hashPassword(newPassword, salt);

    setIsUpdating(false);
    setStep('done');
  };

  const handleFinishAndLogin = () => {
    const deptUsername = matchedDepartment ? `dept_${matchedDepartment.id}` : 'dept_cse';
    if (onPasswordResetSuccess) {
      onPasswordResetSuccess(deptUsername, newPassword);
    }
    handleClose();
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(simulatedResetUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleClose = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (resendTimerRef.current) clearInterval(resendTimerRef.current);
    setStep('request');
    setEmail('');
    setError(null);
    setNewPassword('');
    setConfirmPassword('');
    onClose();
  };

  // Calculate progress percentage for countdown bar
  const progressPercent = Math.min(
    100,
    Math.max(0, Math.round(((TOTAL_WAIT_SECONDS - countdown) / TOTAL_WAIT_SECONDS) * 100))
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 to-blue-950 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-[#0066b2] rounded-xl text-white shadow-sm">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold tracking-tight">
                Department Password Recovery
              </h3>
              <p className="text-xs text-blue-200">
                {COLLEGE_CONFIG.shortName} • Institutional Attendance Portal
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          {/* ===================================================================
              STEP 1: REQUEST PROMPT WITH DEPARTMENT SELECTION
             =================================================================== */}
          {step === 'request' && (
            <form onSubmit={handleRequestSubmit} className="space-y-4">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 flex items-start space-x-2">
                <Sparkles className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <p>
                  Each department has its own distinct Head of Department (HOD) and official email address.
                  Select your department below to automatically route the recovery link to the authorized coordinator.
                </p>
              </div>

              {/* Error Banner */}
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center space-x-2 text-xs text-red-800 animate-in fade-in">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* 1. Department Selection Pills */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                  <span className="flex items-center space-x-1">
                    <Building2 className="w-3.5 h-3.5 text-blue-600" />
                    <span>1. Select Your Department</span>
                  </span>
                  <span className="text-[10px] text-blue-600 font-medium">8 Departments</span>
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {DEPARTMENTS.map((d) => {
                    const isSelected = d.id === selectedDeptId;
                    return (
                      <button
                        key={d.id}
                        type="button"
                        onClick={() => handleSelectDepartment(d.id)}
                        className={`py-1.5 px-2 text-xs font-bold rounded-lg transition-all cursor-pointer border flex flex-col items-center justify-center ${
                          isSelected
                            ? 'bg-[#0066b2] text-white border-blue-600 shadow-xs ring-2 ring-blue-500/30'
                            : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                        }`}
                      >
                        <span className="leading-tight">{d.code}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Active Department HOD Card Preview */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Department HOD Recipient:
                  </span>
                  <span
                    className="text-[10px] font-bold px-1.5 py-0.2 rounded text-white"
                    style={{ backgroundColor: activeDeptProfile.accentColor }}
                  >
                    {activeDeptProfile.code}
                  </span>
                </div>
                <div className="text-xs font-bold text-slate-900">
                  {activeDeptProfile.coordinatorName}
                </div>
                <div className="text-[11px] text-slate-600">
                  {activeDeptProfile.coordinatorDesignation || 'Head of Department'}
                </div>
              </div>

              {/* 2. Official Email Input */}
              <div>
                <label
                  htmlFor="recovery-email"
                  className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5"
                >
                  2. Department Coordinator Email
                </label>
                <div className="relative rounded-xl shadow-xs">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    id="recovery-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (error) setError(null);
                    }}
                    placeholder={`e.g. hod.${selectedDeptId}@vsbec.ac.in`}
                    className="block w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0066b2] focus:border-transparent transition-colors font-mono"
                  />
                </div>
              </div>

              {/* Security Notice */}
              <div className="p-3 bg-blue-50/70 border border-blue-200/60 rounded-xl flex items-start space-x-2 text-[11px] text-blue-900">
                <ShieldAlert className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <span>
                  For institutional integrity, password recovery links are routed to each department's
                  designated Head of Department (HOD) mailbox.
                </span>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={!email}
                className="w-full flex items-center justify-center space-x-2 py-3 px-4 bg-[#0066b2] hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold rounded-xl shadow-md transition-all cursor-pointer disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4" />
                <span>Request Recovery Email for {activeDeptProfile.code}</span>
              </button>
            </form>
          )}

          {/* ===================================================================
              STEP 2: SIMULATED WAITING COUNTDOWN TIMER SCREEN
             =================================================================== */}
          {step === 'waiting' && (
            <div className="py-2 space-y-5 animate-in fade-in">
              <div className="text-center space-y-2">
                {/* Circular Animated Pulse with Clock */}
                <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full border-4 border-blue-100 animate-ping opacity-30" />
                  <div className="absolute inset-0 rounded-full border-4 border-blue-200" />
                  <svg className="w-20 h-20 -rotate-90">
                    <circle
                      cx="40"
                      cy="40"
                      r="36"
                      stroke="#0066b2"
                      strokeWidth="4"
                      fill="transparent"
                      strokeDasharray={226}
                      strokeDashoffset={226 - (226 * progressPercent) / 100}
                      className="transition-all duration-1000 ease-linear"
                    />
                  </svg>
                  <div className="absolute flex flex-col items-center justify-center">
                    <span className="text-xl font-black font-mono text-slate-900 leading-none">
                      {countdown}s
                    </span>
                    <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">
                      Wait
                    </span>
                  </div>
                </div>

                <h4 className="text-base font-bold text-slate-900 tracking-tight">
                  Simulating Institutional Email Dispatch...
                </h4>
                <p className="text-xs text-slate-600 max-w-sm mx-auto">
                  Connecting to VSBEC mail relay to generate a cryptographically signed recovery token for{' '}
                  <strong className="font-mono text-blue-700">{email}</strong>.
                </p>
              </div>

              {/* Progress Bar & Realtime Simulation Pipeline */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
                <div className="flex items-center justify-between text-xs text-slate-600 font-medium">
                  <span className="flex items-center space-x-1.5">
                    <Clock className="w-3.5 h-3.5 text-blue-600 animate-spin" />
                    <span>Estimated Inbox Delivery:</span>
                  </span>
                  <span className="font-mono font-bold text-blue-700">{countdown} seconds</span>
                </div>

                {/* Visual Progress Bar */}
                <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-600 to-[#0066b2] transition-all duration-1000 ease-linear"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>

                {/* Milestone Stepper */}
                <div className="pt-1 space-y-1.5 text-[11px] font-mono">
                  <div className="flex items-center space-x-2 text-emerald-700">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>1. Department MX record verified: vsbec.ac.in</span>
                  </div>
                  <div
                    className={`flex items-center space-x-2 ${
                      countdown <= 4 ? 'text-emerald-700' : 'text-slate-400'
                    }`}
                  >
                    {countdown <= 4 ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    ) : (
                      <div className="w-3.5 h-3.5 rounded-full border border-slate-300 shrink-0" />
                    )}
                    <span>2. One-time encrypted token generated</span>
                  </div>
                  <div
                    className={`flex items-center space-x-2 ${
                      countdown <= 1 ? 'text-emerald-700' : 'text-slate-400'
                    }`}
                  >
                    {countdown <= 1 ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    ) : (
                      <div className="w-3.5 h-3.5 rounded-full border border-slate-300 shrink-0" />
                    )}
                    <span>3. In-transit to department coordinator inbox</span>
                  </div>
                </div>
              </div>

              {/* Responsive User Controls: Skip wait or Pause */}
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleDeliveryComplete}
                  className="flex-1 flex items-center justify-center space-x-1.5 py-2.5 px-4 bg-[#0066b2] hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-md transition-all cursor-pointer"
                >
                  <FastForward className="w-3.5 h-3.5" />
                  <span>Instant Deliver (Skip Waiting)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsPaused(!isPaused)}
                  className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition-colors cursor-pointer border border-slate-200"
                >
                  {isPaused ? 'Resume' : 'Pause'}
                </button>

                <button
                  type="button"
                  onClick={() => setStep('request')}
                  className="py-2.5 px-3 bg-white hover:bg-slate-50 text-slate-600 font-semibold rounded-xl text-xs transition-colors cursor-pointer border border-slate-200"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* ===================================================================
              STEP 3: SIMULATED EMAIL DELIVERED (INBOX PREVIEW)
             =================================================================== */}
          {step === 'sent' && (
            <div className="space-y-4 animate-in fade-in">
              <div className="flex items-center space-x-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                <div className="p-2 bg-emerald-600 text-white rounded-lg">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-emerald-950">
                    Recovery Link Successfully Delivered
                  </h4>
                  <p className="text-xs text-emerald-800">
                    Simulated email sent to <strong className="font-mono">{email}</strong>
                  </p>
                </div>
              </div>

              {/* Simulated Inbox Preview Card */}
              <div className="border border-slate-200 rounded-xl bg-slate-50/80 p-4 space-y-3 font-sans text-xs">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <span className="font-bold text-slate-800 flex items-center space-x-1.5">
                    <Mail className="w-3.5 h-3.5 text-blue-600" />
                    <span>Simulated Coordinator Inbox Preview</span>
                  </span>
                  <span className="text-[10px] text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded font-mono">
                    Token Valid for 15 mins
                  </span>
                </div>

                <div className="space-y-1 text-slate-600">
                  <div>
                    <strong className="text-slate-800">From:</strong> {COLLEGE_CONFIG.supportEmail}
                  </div>
                  <div>
                    <strong className="text-slate-800">To:</strong> {email}
                  </div>
                  <div>
                    <strong className="text-slate-800">Subject:</strong> Password Reset Request for{' '}
                    <span className="text-[#0066b2] font-semibold">
                      {matchedDepartment?.name} ({matchedDepartment?.code})
                    </span>
                  </div>
                </div>

                {/* Simulated Reset URL Box */}
                <div className="mt-3 p-3 bg-white border border-slate-200 rounded-lg space-y-2">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                    One-Time Password Reset Link:
                  </span>
                  <div className="p-2 bg-slate-900 rounded font-mono text-[11px] text-blue-300 break-all select-all flex items-center justify-between">
                    <span>{simulatedResetUrl}</span>
                    <button
                      type="button"
                      onClick={handleCopyLink}
                      className="ml-2 text-slate-400 hover:text-white shrink-0 cursor-pointer"
                      title="Copy link"
                    >
                      {copiedLink ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Action Buttons & Resend with Cooldown */}
              <div className="space-y-2 pt-1">
                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    type="button"
                    onClick={() => setStep('resetting')}
                    className="flex-1 flex items-center justify-center space-x-1.5 py-3 px-4 bg-[#0066b2] hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition-all cursor-pointer text-xs"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>Simulate Clicking Reset Link</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setStep('request')}
                    className="flex items-center justify-center space-x-1 py-3 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition-all cursor-pointer text-xs"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Change Email</span>
                  </button>
                </div>

                {/* Resend button with active cooldown counter */}
                <div className="text-center pt-1">
                  <button
                    type="button"
                    disabled={resendCooldown > 0}
                    onClick={handleResend}
                    className="text-xs text-blue-600 hover:text-blue-800 disabled:text-slate-400 font-medium inline-flex items-center space-x-1 cursor-pointer disabled:cursor-not-allowed"
                  >
                    <RefreshCw className={`w-3 h-3 ${resendCooldown > 0 ? '' : 'text-blue-600'}`} />
                    {resendCooldown > 0 ? (
                      <span>Resend recovery email in {resendCooldown}s</span>
                    ) : (
                      <span>Resend recovery email</span>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ===================================================================
              STEP 4: INTERACTIVE PASSWORD RESET SCREEN
             =================================================================== */}
          {step === 'resetting' && (
            <form onSubmit={handleResetSubmit} className="space-y-4 animate-in fade-in">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-500 block">Resetting Password for:</span>
                  <strong className="text-slate-900 font-bold text-sm">
                    {matchedDepartment?.name} ({matchedDepartment?.code})
                  </strong>
                </div>
                <span className="px-2 py-1 bg-white font-mono text-[11px] font-bold text-blue-700 rounded border border-blue-200">
                  Username: dept_{matchedDepartment?.id}
                </span>
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center space-x-2 text-xs text-red-800 animate-in fade-in">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* New Password */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  New Department Password (Min. 8 Chars)
                </label>
                <div className="relative rounded-xl shadow-xs">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new strong password"
                    className="block w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0066b2]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Confirm New Password
                </label>
                <div className="relative rounded-xl shadow-xs">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-type new password"
                    className="block w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0066b2]"
                  />
                </div>
              </div>

              {/* Submit Reset */}
              <button
                type="submit"
                disabled={isUpdating || newPassword.length < 8 || newPassword !== confirmPassword}
                className="w-full flex items-center justify-center space-x-2 py-3 px-4 bg-[#0066b2] hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold rounded-xl shadow-md transition-all cursor-pointer disabled:cursor-not-allowed"
              >
                {isUpdating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Updating Department Password...</span>
                  </>
                ) : (
                  <>
                    <KeyRound className="w-4 h-4" />
                    <span>Confirm &amp; Update Password</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* ===================================================================
              STEP 5: SUCCESS CONFIRMATION
             =================================================================== */}
          {step === 'done' && (
            <div className="text-center py-4 space-y-4 animate-in fade-in">
              <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div className="space-y-1">
                <h4 className="text-lg font-bold text-slate-900">
                  Department Password Reset Complete
                </h4>
                <p className="text-xs text-slate-600 max-w-sm mx-auto">
                  The password for{' '}
                  <strong className="text-slate-900">
                    {matchedDepartment?.name} (dept_{matchedDepartment?.id})
                  </strong>{' '}
                  has been simulated as updated. You can now log in immediately.
                </p>
              </div>

              <button
                type="button"
                onClick={handleFinishAndLogin}
                className="w-full flex items-center justify-center space-x-2 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition-all cursor-pointer"
              >
                <span>Return to Login with New Password</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>{COLLEGE_CONFIG.name} Security</span>
          <button
            type="button"
            onClick={handleClose}
            className="text-slate-600 hover:text-slate-800 font-medium cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
