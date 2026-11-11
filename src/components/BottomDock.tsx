import React, { useState } from 'react';
import {
  Trophy,
  Users,
  Volume2,
  VolumeX,
  Music,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Languages,
  Sliders,
  BarChart2,
  Camera,
  Sparkles,
} from 'lucide-react';
import { soundManager } from '../audio/soundManager';

interface BottomDockProps {
  cameraMode: 'follow' | 'broadcast' | 'action' | 'sideline';
  onCameraChange: (mode: 'follow' | 'broadcast' | 'action' | 'sideline') => void;
  onOpenStages: () => void;
  onOpenCharacters: () => void;
  onOpenSettings: () => void;
  onOpenStats: () => void;
  onRestartMatch: () => void;
  lang: 'ar' | 'en';
  onToggleLang: () => void;
  onToggleHelp: () => void;
  onOpenVictoryVideo: () => void;
}

export const BottomDock: React.FC<BottomDockProps> = ({
  cameraMode,
  onCameraChange,
  onOpenStages,
  onOpenCharacters,
  onOpenSettings,
  onOpenStats,
  onRestartMatch,
  lang,
  onToggleLang,
  onToggleHelp,
  onOpenVictoryVideo,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMuted, setIsMuted] = useState(soundManager.getMuted());
  const [isMusicActive, setIsMusicActive] = useState(false);

  const isAr = lang === 'ar';

  const handleToggleMute = () => {
    const muted = soundManager.toggleMute();
    setIsMuted(muted);
  };

  const handleToggleMusic = () => {
    if (isMusicActive) {
      soundManager.stopMusic();
      setIsMusicActive(false);
    } else {
      soundManager.startMusic();
      setIsMusicActive(true);
    }
  };

  return (
    <div
      className="fixed z-30 transition-transform duration-300"
      style={{
        bottom: '12px',
        left: '50%',
        transform: isCollapsed ? 'translate(-50%, calc(100% - 28px))' : 'translate(-50%, 0)',
        maxWidth: 'min(980px, 98vw)',
        width: 'max-content',
      }}
    >
      {/* Collapse / Expand Toggle Tab */}
      <div className="flex justify-center -mb-px">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="flex items-center gap-1.5 px-4 py-1 bg-slate-900/95 hover:bg-slate-800 text-slate-300 hover:text-white rounded-t-xl border-t border-x border-slate-700/80 text-[11px] font-bold shadow-lg transition-colors cursor-pointer select-none"
        >
          {isCollapsed ? (
            <>
              <ChevronUp className="w-3.5 h-3.5 text-cyan-400" />
              <span>{isAr ? 'إظهار لوحة التحكم ▴' : 'Show Controls ▴'}</span>
            </>
          ) : (
            <>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              <span>{isAr ? 'إخفاء (وضع السينما) ▾' : 'Cinema Mode ▾'}</span>
            </>
          )}
        </button>
      </div>

      {/* Main Unified Bottom Dock Panel */}
      <div className="flex flex-wrap items-center justify-center gap-1.5 p-2 bg-slate-950/92 border border-slate-700/80 rounded-2xl shadow-2xl backdrop-blur-md">
        {/* Pro Settings Sliders */}
        <button
          onClick={onOpenSettings}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/40 text-cyan-200 text-xs font-black transition-all active:scale-95 cursor-pointer"
          title={isAr ? 'تعديل فيزياء الكرة وسرعة وقوة اللاعب' : 'Adjust Physics & Player Controls'}
        >
          <Sliders className="w-4 h-4 text-cyan-400" />
          <span>{isAr ? 'الإعدادات والفيزياء' : 'Physics & Tuning'}</span>
        </button>

        {/* Match Statistics */}
        <button
          onClick={onOpenStats}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-200 text-xs font-black transition-all active:scale-95 cursor-pointer"
          title={isAr ? 'إحصائيات الإرسال والراليات والإعادة' : 'Match Stats & Replay'}
        >
          <BarChart2 className="w-4 h-4 text-emerald-400" />
          <span>{isAr ? 'الإحصائيات والإعادة' : 'Match Stats'}</span>
        </button>

        <div className="h-5 w-px bg-slate-800 hidden sm:block" />

        {/* Tournament Stages Button */}
        <button
          onClick={onOpenStages}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-200 text-xs font-black transition-all active:scale-95 cursor-pointer"
        >
          <Trophy className="w-3.5 h-3.5 text-amber-400" />
          <span>{isAr ? 'المراحل' : 'Stages'}</span>
        </button>

        {/* Grand Slam Victory Video Button */}
        <button
          onClick={onOpenVictoryVideo}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/25 to-yellow-500/20 hover:from-amber-500/40 hover:to-yellow-500/30 border border-amber-400/60 text-amber-300 text-xs font-black shadow-[0_0_15px_rgba(245,158,11,0.2)] transition-all active:scale-95 cursor-pointer animate-pulse"
          title={isAr ? 'مشاهدة فيديو احتفال التتويج التاريخي وهتاف الجماهير' : 'Watch Grand Slam Victory Celebration & Crowd Roar'}
        >
          <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
          <span>{isAr ? 'فيديو التتويج 🏆' : 'Victory Video 🏆'}</span>
        </button>

        {/* Characters Roster Button */}
        <button
          onClick={onOpenCharacters}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-500/40 text-indigo-200 text-xs font-black transition-all active:scale-95 cursor-pointer"
        >
          <Users className="w-3.5 h-3.5 text-indigo-400" />
          <span>{isAr ? 'الشخصيات' : 'Roster'}</span>
        </button>

        <div className="h-5 w-px bg-slate-800 hidden sm:block" />

        {/* Camera Views Group */}
        <div className="flex items-center gap-0.5 bg-slate-900/80 p-0.5 rounded-xl border border-slate-800">
          <button
            onClick={() => onCameraChange('follow')}
            className={`px-2 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              cameraMode === 'follow'
                ? 'bg-blue-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {isAr ? 'خلفي' : 'Follow'}
          </button>
          <button
            onClick={() => onCameraChange('broadcast')}
            className={`px-2 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              cameraMode === 'broadcast'
                ? 'bg-blue-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {isAr ? 'بث تلفزيوني' : 'Broadcast'}
          </button>
          <button
            onClick={() => onCameraChange('action')}
            className={`px-2 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              cameraMode === 'action'
                ? 'bg-blue-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {isAr ? 'أكشن' : 'Action'}
          </button>
          <button
            onClick={() => onCameraChange('sideline')}
            className={`px-2 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              cameraMode === 'sideline'
                ? 'bg-blue-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {isAr ? 'جانبي' : 'Sideline'}
          </button>
        </div>

        <div className="h-5 w-px bg-slate-800 hidden sm:block" />

        {/* Audio / Music Buttons */}
        <button
          onClick={handleToggleMusic}
          title={isAr ? 'موسيقى الأنمي الحماسية' : 'Anime BGM'}
          className={`p-1.5 rounded-xl border transition-all cursor-pointer ${
            isMusicActive
              ? 'bg-pink-600/25 border-pink-500/60 text-pink-300'
              : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
          }`}
        >
          <Music className="w-4 h-4" />
        </button>

        <button
          onClick={handleToggleMute}
          title={isAr ? 'كتم/تشغيل المؤثرات' : 'Mute/Unmute SFX'}
          className="p-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 transition-all cursor-pointer"
        >
          {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
        </button>

        {/* Reset Point/Match */}
        <button
          onClick={onRestartMatch}
          title={isAr ? 'إعادة الشوط' : 'Restart Match'}
          className="p-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 transition-all cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        {/* Language Switcher */}
        <button
          onClick={onToggleLang}
          className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-bold transition-all cursor-pointer"
        >
          <Languages className="w-3.5 h-3.5 text-cyan-400" />
          <span>{lang.toUpperCase()}</span>
        </button>

        {/* Help / Instructions */}
        <button
          onClick={onToggleHelp}
          title={isAr ? 'طريقة اللعب والأزرار' : 'Controls & How to Play'}
          className="p-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-amber-400 transition-all cursor-pointer"
        >
          <HelpCircle className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
