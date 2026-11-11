import React, { useEffect, useState } from 'react';
import { CharacterDef } from '../types/tennis';

interface AnimeCutInProps {
  activeChar: CharacterDef | null;
  moveNameAr: string;
  kanji: string;
  onComplete: () => void;
}

export const AnimeCutIn: React.FC<AnimeCutInProps> = ({
  activeChar,
  moveNameAr,
  kanji,
  onComplete,
}) => {
  const [animStep, setAnimStep] = useState<number>(0);

  useEffect(() => {
    if (!activeChar) {
      setAnimStep(0);
      return;
    }

    setAnimStep(1); // Slash entry
    const t1 = setTimeout(() => setAnimStep(2), 200); // Main flash
    const t2 = setTimeout(() => setAnimStep(3), 1100); // Exit
    const t3 = setTimeout(() => {
      setAnimStep(0);
      onComplete();
    }, 1400);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [activeChar, onComplete]);

  if (!activeChar || animStep === 0) return null;

  return (
    <div className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center overflow-hidden">
      {/* Background Manga Speed Lines (radial flash) */}
      <div className="absolute inset-0 bg-black/60 mix-blend-multiply" />
      <div
        className="absolute inset-0 opacity-70"
        style={{
          backgroundImage:
            'repeating-conic-gradient(from 0deg, rgba(255,255,255,0.2) 0deg 4deg, transparent 4deg 12deg)',
        }}
      />

      {/* Diagonal Anime Slash Banner */}
      <div
        className={`relative w-full max-w-5xl py-7 px-8 transform -skew-y-3 transition-all duration-300 ${
          animStep === 1
            ? 'scale-90 opacity-0 translate-x-32'
            : animStep === 2
            ? 'scale-100 opacity-100 translate-x-0'
            : 'scale-110 opacity-0 -translate-x-32'
        }`}
      >
        {/* Glow border background */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-slate-950/95 to-transparent border-y-4 border-amber-400 shadow-[0_0_50px_rgba(251,191,36,0.6)]" />

        <div className="relative z-10 flex items-center justify-between px-6">
          {/* Right/Arabic side info */}
          <div className="text-right">
            <div className="inline-block px-3 py-1 bg-red-600 text-white font-black text-xs tracking-wider rounded-sm shadow-md mb-2">
              必殺 • ضربة قاضية فائقة
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-orange-400 to-rose-400 drop-shadow-md">
              {moveNameAr}
            </h2>
            <p className="text-lg font-bold text-cyan-300 mt-1">
              {activeChar.nameAr} • {activeChar.titleAr}
            </p>
          </div>

          {/* Huge Japanese Kanji Character in Center/Left */}
          <div className="flex items-center gap-4">
            <div className="text-7xl md:text-9xl font-black font-mono tracking-tighter text-white/90 drop-shadow-[0_0_25px_rgba(255,255,255,0.8)] select-none">
              {kanji}
            </div>
            <div
              className={`w-24 h-24 md:w-32 md:h-32 rounded-2xl bg-gradient-to-br ${activeChar.avatarColor} border-2 border-amber-300 shadow-2xl flex items-center justify-center text-5xl font-black text-white`}
            >
              {activeChar.nameAr[0]}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
