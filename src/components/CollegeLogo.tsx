import React, { useState } from 'react';
import { COLLEGE_CONFIG } from '../config/departments.config';

interface CollegeLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showLabel?: boolean;
  className?: string;
  glow?: boolean;
}

export const CollegeLogo: React.FC<CollegeLogoProps> = ({
  size = 'md',
  showLabel = false,
  className = '',
  glow = false,
}) => {
  const [imageError, setImageError] = useState(false);

  const dimensionMap = {
    sm: { container: 'w-10 h-10', icon: 40 },
    md: { container: 'w-16 h-16', icon: 64 },
    lg: { container: 'w-28 h-28 sm:w-32 sm:h-32', icon: 120 },
    xl: { container: 'w-36 h-36 sm:w-44 sm:h-44', icon: 160 },
  };

  const dim = dimensionMap[size];

  return (
    <div className={`flex flex-col items-center select-none ${className}`}>
      <div
        className={`relative ${dim.container} flex items-center justify-center rounded-2xl ${
          glow ? 'shadow-[0_0_35px_rgba(37,99,235,0.35)]' : ''
        }`}
      >
        {!imageError ? (
          <img
            src="/logo.png"
            alt={`${COLLEGE_CONFIG.name} Crest`}
            className="w-full h-full object-contain filter drop-shadow-md transition-transform duration-300 hover:scale-105"
            onError={() => {
              // Gracefully switch to SVG crest if PNG fails
              setImageError(true);
            }}
          />
        ) : (
          /* High-fidelity Fallback SVG Emblem */
          <img
            src="/logo.svg"
            alt={`${COLLEGE_CONFIG.name} Emblem`}
            className="w-full h-full object-contain filter drop-shadow-md"
          />
        )}
      </div>

      {showLabel && (
        <div className="mt-3 text-center">
          <h2 className="text-xl font-bold tracking-tight text-slate-900 font-serif">
            {COLLEGE_CONFIG.name}
          </h2>
          <p className="text-xs uppercase tracking-widest text-slate-500 font-medium mt-0.5">
            {COLLEGE_CONFIG.campusCode}
          </p>
        </div>
      )}
    </div>
  );
};
