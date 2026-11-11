import React from 'react';
import { ServeState, ShotType } from '../types/tennis';
import {
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  Zap,
  CircleDot,
  Wind,
  Flame,
  Activity,
} from 'lucide-react';

interface TouchControlsProps {
  onMoveChange: (move: { x: number; z: number }) => void;
  onAimChange: (aim: number) => void;
  onHit: (shotType: ShotType) => void;
  isSuperReady: boolean;
  status: string;
  serveState: ServeState;
  stamina: number;
  lastShotType: string;
  lang: 'ar' | 'en';
}

export const TouchControls: React.FC<TouchControlsProps> = ({
  onMoveChange,
  onAimChange,
  onHit,
  isSuperReady,
  status,
  serveState,
  stamina,
  lastShotType,
  lang,
}) => {
  const isAr = lang === 'ar';
  const isServing = status === 'serving';

  return (
    <div className="absolute inset-x-0 bottom-24 px-4 flex items-end justify-between pointer-events-none z-20 select-none">
      {/* Left side: Virtual D-Pad for Movement & Aiming Angle */}
      <div className="pointer-events-auto flex flex-col items-center">
        {/* Dynamic Stamina Gauge above D-Pad */}
        <div className="mb-2 w-36 px-2.5 py-1 rounded-xl bg-slate-950/80 border border-slate-800 backdrop-blur-md shadow-lg flex items-center justify-between text-[11px] font-bold">
          <span className="flex items-center gap-1 text-slate-300">
            <Activity className="w-3 h-3 text-cyan-400" />
            {isAr ? 'اللياقة' : 'STAMINA'}
          </span>
          <span className="font-mono text-cyan-300">{Math.round(stamina)}%</span>
        </div>

        <div className="grid grid-cols-3 gap-1.5 p-2 bg-slate-950/75 border border-slate-800 rounded-2xl backdrop-blur-md shadow-2xl">
          <div />
          <button
            aria-label="Move Up / Forward"
            className="w-12 h-12 rounded-xl bg-slate-800 active:bg-blue-600 active:scale-95 text-white flex items-center justify-center transition-all border border-slate-700 cursor-pointer"
            onTouchStart={() => onMoveChange({ x: 0, z: -1 })}
            onTouchEnd={() => onMoveChange({ x: 0, z: 0 })}
            onMouseDown={() => onMoveChange({ x: 0, z: -1 })}
            onMouseUp={() => onMoveChange({ x: 0, z: 0 })}
          >
            <ArrowUp className="w-5 h-5 text-blue-400" />
          </button>
          <div />

          <button
            aria-label="Move Left / Crosscourt Left"
            className="w-12 h-12 rounded-xl bg-slate-800 active:bg-blue-600 active:scale-95 text-white flex items-center justify-center transition-all border border-slate-700 cursor-pointer"
            onTouchStart={() => {
              onMoveChange({ x: -1, z: 0 });
              onAimChange(-1);
            }}
            onTouchEnd={() => {
              onMoveChange({ x: 0, z: 0 });
              onAimChange(0);
            }}
            onMouseDown={() => {
              onMoveChange({ x: -1, z: 0 });
              onAimChange(-1);
            }}
            onMouseUp={() => {
              onMoveChange({ x: 0, z: 0 });
              onAimChange(0);
            }}
          >
            <ArrowLeft className="w-5 h-5 text-blue-400" />
          </button>

          <div className="w-12 h-12 rounded-xl bg-slate-900 flex items-center justify-center border border-slate-800">
            <CircleDot className="w-4 h-4 text-slate-500" />
          </div>

          <button
            aria-label="Move Right / Crosscourt Right"
            className="w-12 h-12 rounded-xl bg-slate-800 active:bg-blue-600 active:scale-95 text-white flex items-center justify-center transition-all border border-slate-700 cursor-pointer"
            onTouchStart={() => {
              onMoveChange({ x: 1, z: 0 });
              onAimChange(1);
            }}
            onTouchEnd={() => {
              onMoveChange({ x: 0, z: 0 });
              onAimChange(0);
            }}
            onMouseDown={() => {
              onMoveChange({ x: 1, z: 0 });
              onAimChange(1);
            }}
            onMouseUp={() => {
              onMoveChange({ x: 0, z: 0 });
              onAimChange(0);
            }}
          >
            <ArrowRight className="w-5 h-5 text-blue-400" />
          </button>

          <div />
          <button
            aria-label="Move Down / Backward Baseline"
            className="w-12 h-12 rounded-xl bg-slate-800 active:bg-blue-600 active:scale-95 text-white flex items-center justify-center transition-all border border-slate-700 cursor-pointer"
            onTouchStart={() => onMoveChange({ x: 0, z: 1 })}
            onTouchEnd={() => onMoveChange({ x: 0, z: 0 })}
            onMouseDown={() => onMoveChange({ x: 0, z: 1 })}
            onMouseUp={() => onMoveChange({ x: 0, z: 0 })}
          >
            <ArrowDown className="w-5 h-5 text-blue-400" />
          </button>
          <div />
        </div>

        <span className="text-[10px] font-bold text-slate-400 mt-1 tracking-wider">
          {isAr ? 'التحرك وتوجيه الزاوية' : 'MOVE & ANGLE AIM'}
        </span>
      </div>

      {/* Right side: Action Shot Buttons */}
      <div className="pointer-events-auto flex flex-col items-end gap-2">
        {/* Dynamic Serve Timing Indicator during serve toss */}
        {serveState.phase === 'tossing' && (
          <div className="px-3 py-1.5 rounded-xl bg-slate-950/90 border border-amber-400/80 shadow-2xl backdrop-blur-md flex flex-col items-center">
            <span className="text-[10px] font-black text-amber-300">
              {isAr ? 'اضغط الآن لتسديد الكرة في القمة!' : 'STRIKE NOW AT APEX!'}
            </span>
            <div className="w-28 h-2 bg-slate-800 rounded-full mt-1 overflow-hidden relative">
              <div className="absolute left-1/2 -translate-x-1/2 w-8 h-full bg-emerald-400/60" />
              <div
                className="h-full bg-amber-400 rounded-full transition-all"
                style={{
                  width: `${Math.min(100, (serveState.tossTimer / 0.52) * 50)}%`,
                }}
              />
            </div>
          </div>
        )}

        {/* Row 1: Tactical Shots: Lob & Drop Shot */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onHit('lob')}
            className="px-2.5 py-1.5 rounded-xl bg-slate-900/80 active:bg-slate-700 active:scale-95 border border-slate-700 text-slate-300 flex items-center gap-1 text-[11px] font-bold shadow-md cursor-pointer"
            title={isAr ? 'كرة ساقطة خلف الخصم (Lob)' : 'High Lob (O)'}
          >
            <span>{isAr ? 'لوب (O)' : 'LOB (O)'}</span>
          </button>

          <button
            onClick={() => onHit('dropshot')}
            className="px-2.5 py-1.5 rounded-xl bg-slate-900/80 active:bg-slate-700 active:scale-95 border border-slate-700 text-slate-300 flex items-center gap-1 text-[11px] font-bold shadow-md cursor-pointer"
            title={isAr ? 'كرة قصيرة مباغتة (Drop shot)' : 'Drop Shot (P)'}
          >
            <span>{isAr ? 'دروب (P)' : 'DROP (P)'}</span>
          </button>

          {/* Super Smash Ultimate Button */}
          <button
            onClick={() => onHit('special')}
            className={`px-3 py-1.5 rounded-xl font-black text-xs flex items-center gap-1 shadow-xl transition-all active:scale-95 cursor-pointer ${
              isSuperReady
                ? 'bg-gradient-to-r from-amber-400 via-rose-500 to-purple-600 text-white border border-amber-300 animate-bounce'
                : 'bg-slate-900/80 text-slate-500 border border-slate-800'
            }`}
          >
            <Zap className={`w-3.5 h-3.5 ${isSuperReady ? 'text-yellow-200' : 'text-slate-600'}`} />
            <span>{isAr ? 'الخارق (L)' : 'SUPER (L)'}</span>
          </button>
        </div>

        {/* Row 2: Core Shots: Slice, Topspin, and Primary Drive/Serve */}
        <div className="flex items-center gap-2">
          {/* Slice (Backspin) */}
          <button
            onClick={() => onHit('slice')}
            className="w-13 h-13 rounded-2xl bg-indigo-950/85 active:bg-indigo-600 active:scale-95 border border-indigo-500/50 text-indigo-200 flex flex-col items-center justify-center transition-all shadow-xl cursor-pointer"
          >
            <span className="text-xs font-black">{isAr ? 'سلايس' : 'SLICE'}</span>
            <span className="text-[9px] text-indigo-400">(K)</span>
          </button>

          {/* Topspin */}
          <button
            onClick={() => onHit('topspin')}
            className="w-13 h-13 rounded-2xl bg-cyan-950/85 active:bg-cyan-600 active:scale-95 border border-cyan-500/50 text-cyan-200 flex flex-col items-center justify-center transition-all shadow-xl cursor-pointer"
          >
            <span className="text-xs font-black">{isAr ? 'توبسبين' : 'TOP'}</span>
            <span className="text-[9px] text-cyan-400">(J)</span>
          </button>

          {/* Primary Drive / Serve Button */}
          <button
            onClick={() => onHit('flat')}
            className="w-18 h-18 rounded-2xl bg-gradient-to-tr from-emerald-600 to-lime-500 active:from-emerald-700 active:to-lime-600 active:scale-90 border-2 border-lime-300 text-slate-950 flex flex-col items-center justify-center font-black transition-all shadow-2xl cursor-pointer"
          >
            <span className="text-sm font-black tracking-tight">
              {isServing
                ? serveState.phase === 'tossing'
                  ? isAr
                    ? 'تسديد!'
                    : 'HIT!'
                  : isAr
                  ? 'رمي الكرة'
                  : 'TOSS'
                : isAr
                ? 'ضربة'
                : 'HIT'}
            </span>
            <span className="text-[10px] opacity-80">(Space)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
