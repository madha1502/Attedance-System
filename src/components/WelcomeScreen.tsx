import React from 'react';
import { ArrowRight, MapPin, Building2, ShieldCheck } from 'lucide-react';
import { CollegeHeaderBanner } from './CollegeHeaderBanner';
import { COLLEGE_CONFIG } from '../config/departments.config';

interface WelcomeScreenProps {
  onProceed: () => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onProceed }) => {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-between items-center px-4 py-8 text-white relative overflow-hidden select-none">
      {/* Background Subtle Gradient & Grid */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(0,102,178,0.2),transparent)] pointer-events-none" />
      <div
        className="absolute inset-0 opacity-[0.02] pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, #ffffff 1px, transparent 0)',
          backgroundSize: '32px 32px',
        }}
      />

      {/* Top Bar - Clean Institutional Brand */}
      <header className="w-full max-w-5xl flex items-center justify-between z-10">
        <div className="flex items-center space-x-2 text-xs font-medium text-slate-300">
          <Building2 className="w-4 h-4 text-[#0066b2]" />
          <span>VSB Engineering College Autonomous Portal</span>
        </div>
        <div className="flex items-center space-x-1.5 text-xs text-slate-400 font-mono">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Institutional Access</span>
        </div>
      </header>

      {/* Main Welcome Hero Content */}
      <main className="w-full max-w-2xl flex flex-col items-center text-center z-10 my-auto py-8">
        {/* Official College Lockup Banner */}
        <div
          className="w-full transition-transform hover:scale-[1.005] duration-200 cursor-pointer"
          onClick={onProceed}
        >
          <CollegeHeaderBanner layout="stacked" theme="dark" />
        </div>

        {/* System Subtitle */}
        <div className="mt-8 space-y-2 max-w-lg">
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            Classroom Attendance &amp; Academic Management Portal
          </h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            Institutional authentication gateway for Department Heads, Faculty Coordinators, and Administrative Officers.
          </p>
        </div>

        {/* Action Controls - Deliberate Entrance (No auto-advance timer or clutter) */}
        <div className="mt-8 flex flex-col items-center justify-center gap-3 w-full max-w-xs">
          <button
            onClick={onProceed}
            className="w-full flex items-center justify-center space-x-2.5 px-6 py-3.5 bg-[#0066b2] hover:bg-[#005596] text-white font-medium rounded-xl shadow-lg shadow-blue-900/20 transition-all duration-200 cursor-pointer"
          >
            <span>Proceed to Login</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </main>

      {/* Footer Info */}
      <footer className="w-full max-w-5xl flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 z-10 pt-4 border-t border-slate-800/80">
        <div className="flex items-center space-x-1.5 mb-2 sm:mb-0">
          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span>{COLLEGE_CONFIG.location}</span>
        </div>
        <div className="flex items-center space-x-4">
          <span>Academic Year: <strong className="text-slate-300 font-normal">{COLLEGE_CONFIG.academicYear}</strong></span>
          <span>·</span>
          <span>Campus Code: <strong className="text-slate-300 font-normal">{COLLEGE_CONFIG.campusCode}</strong></span>
          <span>·</span>
          <span>Accreditation: <strong className="text-slate-300 font-normal">NAAC A+, NBA Tier-1</strong></span>
        </div>
      </footer>
    </div>
  );
};
