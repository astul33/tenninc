import React from 'react';

interface MangaSpeedLinesProps {
  isActive: boolean;
}

export const MangaSpeedLines: React.FC<MangaSpeedLinesProps> = ({ isActive }) => {
  if (!isActive) return null;

  return (
    <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden opacity-40 mix-blend-screen transition-opacity duration-300">
      <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="centerMask" cx="50%" cy="50%" r="50%">
            <stop offset="25%" stopColor="transparent" />
            <stop offset="100%" stopColor="white" />
          </radialGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#speedLinesPattern)" mask="url(#centerMask)" />
        <pattern id="speedLinesPattern" width="40" height="40" patternUnits="userSpaceOnUse">
          <line x1="0" y1="0" x2="20" y2="20" stroke="#38bdf8" strokeWidth="1.5" />
          <line x1="40" y1="0" x2="20" y2="20" stroke="#f43f5e" strokeWidth="1.5" />
        </pattern>
      </svg>
    </div>
  );
};
