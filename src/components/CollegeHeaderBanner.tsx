import React from 'react';
import { COLLEGE_CONFIG } from '../config/departments.config';
import { CollegeLogo } from './CollegeLogo';

interface CollegeHeaderBannerProps {
  layout?: 'horizontal' | 'stacked' | 'compact';
  theme?: 'dark' | 'light';
  className?: string;
}

export const CollegeHeaderBanner: React.FC<CollegeHeaderBannerProps> = ({
  layout = 'horizontal',
  theme = 'light',
  className = '',
}) => {
  if (layout === 'compact') {
    return (
      <div className={`flex items-center space-x-3 ${className}`}>
        <div className="w-12 h-12 shrink-0">
          <CollegeLogo size="sm" />
        </div>
        <div>
          <h2
            className={`text-base font-black tracking-tight leading-tight uppercase ${
              theme === 'dark' ? 'text-white' : 'text-[#0066b2]'
            }`}
          >
            {COLLEGE_CONFIG.name}
          </h2>
          <p className="text-[11px] font-bold text-red-600 leading-tight">
            ({COLLEGE_CONFIG.autonomousStatus})
          </p>
          <p className="text-[10px] text-slate-500 font-medium">
            {COLLEGE_CONFIG.location}
          </p>
        </div>
      </div>
    );
  }

  if (layout === 'stacked') {
    return (
      <div className={`flex flex-col items-center text-center ${className}`}>
        <div className="w-28 h-28 sm:w-32 sm:h-32 mb-4 shrink-0 drop-shadow-lg">
          <CollegeLogo size="lg" glow={theme === 'dark'} />
        </div>
        <div className="space-y-1">
          <h1
            className={`text-2xl sm:text-3xl font-black tracking-tight uppercase ${
              theme === 'dark' ? 'text-white' : 'text-[#0066b2]'
            }`}
            style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}
          >
            {COLLEGE_CONFIG.name}
          </h1>
          <p className="text-sm sm:text-base font-bold text-red-600">
            ({COLLEGE_CONFIG.autonomousStatus})
          </p>
          <p
            className={`text-xs sm:text-sm font-bold ${
              theme === 'dark' ? 'text-blue-300' : 'text-[#0a4b9c]'
            }`}
          >
            ({COLLEGE_CONFIG.researchInstituteStatus})
          </p>
          <div className="pt-1.5 space-y-0.5 text-[11px] sm:text-xs">
            <p className={theme === 'dark' ? 'text-slate-300' : 'text-slate-800 font-semibold'}>
              {COLLEGE_CONFIG.approvals}
            </p>
            <p className={theme === 'dark' ? 'text-slate-400' : 'text-slate-700 font-medium'}>
              {COLLEGE_CONFIG.nbaNaac}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Full Horizontal Lockup matching the user's uploaded banner exactly
  return (
    <div
      className={`flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 p-4 rounded-2xl ${
        theme === 'dark'
          ? 'bg-slate-900/90 text-white border border-slate-800'
          : 'bg-white text-slate-900 shadow-md border border-slate-200'
      } ${className}`}
    >
      {/* Official Circular Seal */}
      <div className="w-24 h-24 sm:w-28 sm:h-28 shrink-0 flex items-center justify-center">
        <CollegeLogo size="lg" />
      </div>

      {/* Official Accreditation Typography */}
      <div className="flex-1 text-center sm:text-left space-y-0.5">
        <h1
          className={`text-xl sm:text-2xl lg:text-3xl font-black tracking-tight uppercase leading-tight ${
            theme === 'dark' ? 'text-white' : 'text-[#0066b2]'
          }`}
          style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}
        >
          {COLLEGE_CONFIG.name}
        </h1>
        <p className="text-sm sm:text-base font-bold text-red-600 leading-tight">
          ({COLLEGE_CONFIG.autonomousStatus})
        </p>
        <p
          className={`text-xs sm:text-sm font-bold leading-tight ${
            theme === 'dark' ? 'text-blue-300' : 'text-[#0a4b9c]'
          }`}
        >
          ({COLLEGE_CONFIG.researchInstituteStatus})
        </p>
        <p
          className={`text-[11px] sm:text-xs pt-1 leading-snug ${
            theme === 'dark' ? 'text-slate-300' : 'text-slate-900 font-semibold'
          }`}
        >
          {COLLEGE_CONFIG.approvals}
        </p>
        <p
          className={`text-[11px] sm:text-xs leading-snug ${
            theme === 'dark' ? 'text-slate-400' : 'text-slate-800 font-medium'
          }`}
        >
          {COLLEGE_CONFIG.nbaNaac}
        </p>
      </div>
    </div>
  );
};
