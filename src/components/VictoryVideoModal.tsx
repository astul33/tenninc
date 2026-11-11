import React, { useState, useEffect } from 'react';
import {
  Trophy,
  X,
  Volume2,
  Camera,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Flame,
  Award,
  Video,
  Smile,
  Zap,
} from 'lucide-react';
import { soundManager } from '../audio/soundManager';

interface VictoryVideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: 'ar' | 'en';
  onSelectPose: (pose: 'arms_up' | 'fist_pump' | 'racket_raise' | 'wave' | 'trophy') => void;
  onSelectAngle: (angle: 'orbit' | 'closeup' | 'crane' | 'hero') => void;
  currentPose: 'arms_up' | 'fist_pump' | 'racket_raise' | 'wave' | 'trophy';
  currentAngle: 'orbit' | 'closeup' | 'crane' | 'hero';
  stageName: string;
}

export const VictoryVideoModal: React.FC<VictoryVideoModalProps> = ({
  isOpen,
  onClose,
  lang,
  onSelectPose,
  onSelectAngle,
  currentPose,
  currentAngle,
  stageName,
}) => {
  const isAr = lang === 'ar';
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [speed, setSpeed] = useState<number>(1.0);
  const [activeChant, setActiveChant] = useState<string | null>(null);
  const [flashActive, setFlashActive] = useState<boolean>(false);

  // Trigger flash and crowd cheer on mount
  useEffect(() => {
    if (isOpen) {
      soundManager.playVictoryRoar();
      const interval = setInterval(() => {
        setFlashActive(true);
        setTimeout(() => setFlashActive(false), 80);
      }, 700);
      return () => clearInterval(interval);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const playCrowdVoice = (type: string, label: string) => {
    setActiveChant(label);
    if (type === 'boo') {
      soundManager.playCrowdBoo(3.5);
    } else if (type === 'cheer') {
      soundManager.playCrowdCheer(true);
    } else if (type === 'gasp') {
      soundManager.playCrowdGasp();
    } else if (type === 'chant') {
      soundManager.playCrowdChant();
    } else if (type === 'whistle') {
      soundManager.playStadiumFanWhistle();
    } else {
      soundManager.playVictoryRoar();
    }

    setTimeout(() => setActiveChant(null), 3000);
  };

  const poses = [
    {
      id: 'arms_up' as const,
      nameAr: 'رفع الذراعين والصراخ',
      nameEn: 'Raise Both Arms & Roar',
      descAr: 'احتفال ملحمي بالصراخ نحو السماء',
      descEn: 'Epic roar towards the sky',
      icon: Flame,
    },
    {
      id: 'fist_pump' as const,
      nameAr: 'قبضة النصر والركبة',
      nameEn: 'Champion Fist Pump',
      descAr: 'نزول على الركبة وقبضة حديدية حماسية',
      descEn: 'Knee-slide aggressive fist pump',
      icon: Zap,
    },
    {
      id: 'racket_raise' as const,
      nameAr: 'وقفة البطل مع المضرب',
      nameEn: 'Racket Held High',
      descAr: 'رفع المضرب عالياً بفخر واعتزاز',
      descEn: 'Proud stance holding racket to heavens',
      icon: Award,
    },
    {
      id: 'wave' as const,
      nameAr: 'ابتسامة وتلويح للكاميرا',
      nameEn: 'Confident Smile & Wave',
      descAr: 'النظر لعدسة البث بابتسامة الواثق',
      descEn: 'Smiling at the broadcast camera',
      icon: Smile,
    },
    {
      id: 'trophy' as const,
      nameAr: 'رفع الكأس الذهبي 🏆',
      nameEn: 'Lift Grand Slam Trophy',
      descAr: 'رفع كأس البطولة الذهبي فوق الرأس',
      descEn: 'Lifting the golden championship cup',
      icon: Trophy,
    },
  ];

  const cameraAngles = [
    { id: 'orbit' as const, nameAr: 'دوران 360°', nameEn: '360° Orbit', icon: '🎥' },
    { id: 'closeup' as const, nameAr: 'زوم وجه البطل', nameEn: 'Face Zoom', icon: '🔍' },
    { id: 'hero' as const, nameAr: 'زاوية أرضية بطولية', nameEn: 'Hero Low-Angle', icon: '⚡' },
    { id: 'crane' as const, nameAr: 'رافعة الملعب الجوية', nameEn: 'Stadium Crane', icon: '🏗️' },
  ];

  const chants = [
    { id: 'boo', textAr: 'بووووووووووووووووووووووو!', textEn: 'BOOOOOOOOOOOOO!', type: 'boo', color: 'from-amber-600 to-red-600' },
    { id: 'hey', textAr: 'هي هي هيييييييييي!', textEn: 'HEEEEEEEEEY! HEEEEEEEY!', type: 'chant', color: 'from-blue-600 to-indigo-600' },
    { id: 'woo', textAr: 'ووووووووووووووووووووو!', textEn: 'WOOOOOOOOOOOOOO!', type: 'cheer', color: 'from-purple-600 to-pink-600' },
    { id: 'yay', textAr: 'ياااااااااااااااااااي!', textEn: 'YAAAAAAAAAAAAAY!', type: 'cheer', color: 'from-emerald-600 to-teal-600' },
    { id: 'letgo', textAr: 'يلاااااااااااااااااااا!', textEn: "LET'S GOOOOOOOOOO!", type: 'roar', color: 'from-yellow-500 to-amber-600' },
    { id: 'whistle', textAr: 'صافرات الجماهير 🎺', textEn: 'Stadium Whistle 🎺', type: 'whistle', color: 'from-cyan-600 to-blue-600' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-slate-950/85 backdrop-blur-md">
      {/* Flashbulb flash effect */}
      {flashActive && (
        <div className="absolute inset-0 bg-white/15 pointer-events-none z-50 transition-opacity" />
      )}

      {/* Floating Confetti Particle Layer */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {Array.from({ length: 40 }).map((_, i) => (
          <div
            key={i}
            className="absolute animate-bounce"
            style={{
              top: `${(i * 17) % 100}%`,
              left: `${(i * 23) % 100}%`,
              animationDuration: `${1.5 + (i % 5) * 0.4}s`,
              transform: `rotate(${i * 45}deg)`,
            }}
          >
            <div
              className="w-3 h-4 rounded-sm shadow-lg opacity-80"
              style={{
                backgroundColor: ['#ffd700', '#38bdf8', '#ef4444', '#10b981', '#a855f7', '#f59e0b'][
                  i % 6
                ],
              }}
            />
          </div>
        ))}
      </div>

      <div className="relative w-full max-w-4xl max-h-[92vh] bg-slate-900/95 border-2 border-amber-400/80 rounded-3xl shadow-[0_0_60px_rgba(245,158,11,0.35)] flex flex-col overflow-hidden">
        {/* Top TV Broadcast Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border-b border-amber-500/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-300 flex items-center justify-center shadow-lg text-slate-950 font-black">
              <Trophy className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-red-600 text-white animate-pulse">
                  ● LIVE BROADCAST
                </span>
                <span className="text-xs text-amber-400 font-bold">{stageName}</span>
              </div>
              <h1 className="text-xl md:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-300 to-amber-400">
                {isAr ? 'فيديو التتويج التاريخي • بطل الجراند سلام 🏆' : 'GRAND SLAM CHAMPIONSHIP VICTORY VIDEO 🏆'}
              </h1>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Active Chant Banner (When crowd shouts) */}
        {activeChant && (
          <div className="bg-gradient-to-r from-amber-500 via-rose-500 to-purple-600 py-2 px-4 text-center text-white font-black text-base tracking-widest animate-pulse shadow-md">
            🏟️ 15,000 FANS: "{activeChant}" 🔥🔥🔥
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Section 1: Champion Celebrations & Poses */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>{isAr ? 'حركات ووضعيات احتفال البطل' : 'Champion Victory Poses'}</span>
              </h3>
              <span className="text-xs text-slate-400">
                {isAr ? 'اختر الحركة وسيقوم اللاعب بتنفيذها فوراً' : 'Select a pose to perform live'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
              {poses.map((p) => {
                const Icon = p.icon;
                const isSelected = currentPose === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => onSelectPose(p.id)}
                    className={`flex items-start gap-3 p-3.5 rounded-2xl border text-right transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-gradient-to-br from-amber-500/25 to-yellow-500/10 border-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.25)] scale-[1.02]'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-800/50'
                    }`}
                  >
                    <div
                      className={`p-2.5 rounded-xl shrink-0 ${
                        isSelected
                          ? 'bg-amber-400 text-slate-950 font-black'
                          : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="overflow-hidden">
                      <div className="text-sm font-bold text-white truncate">
                        {isAr ? p.nameAr : p.nameEn}
                      </div>
                      <div className="text-[11px] text-slate-400 truncate mt-0.5">
                        {isAr ? p.descAr : p.descEn}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 2: Dramatic Camera Angles & Slow-Mo Controls */}
          <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <Camera className="w-4 h-4 text-cyan-400" />
                <span>{isAr ? 'زوايا التصوير التلفزيوني والإخراج' : 'Cinematic Broadcast Angles'}</span>
              </h3>

              {/* Speed Buttons */}
              <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-700">
                <span className="text-[11px] text-slate-400 px-2">
                  {isAr ? 'سرعة العرض:' : 'Speed:'}
                </span>
                {[
                  { val: 0.25, label: '0.25x Super Slow' },
                  { val: 0.5, label: '0.5x Slow-Mo' },
                  { val: 1.0, label: '1.0x Realtime' },
                ].map((s) => (
                  <button
                    key={s.val}
                    onClick={() => setSpeed(s.val)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                      speed === s.val
                        ? 'bg-cyan-500 text-slate-950 shadow-md'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {cameraAngles.map((cam) => {
                const isSelected = currentAngle === cam.id;
                return (
                  <button
                    key={cam.id}
                    onClick={() => onSelectAngle(cam.id)}
                    className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-md'
                        : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <span className="text-base">{cam.icon}</span>
                    <span>{isAr ? cam.nameAr : cam.nameEn}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 3: Live Stadium Crowd Soundboard */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-rose-400" />
                <span>
                  {isAr
                    ? 'أصوات وهتافات الجمهور الحقيقية في الملعب 📣'
                    : 'Stadium Crowd Shouts & Chants 📣'}
                </span>
              </h3>
              <span className="text-xs text-rose-300/80">
                {isAr ? 'اضغط لسماع هتاف الجمهور بصوت عالي جداً!' : 'Click to hear the crowd roar!'}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {chants.map((c) => (
                <button
                  key={c.id}
                  onClick={() => playCrowdVoice(c.type, isAr ? c.textAr : c.textEn)}
                  className={`p-3 rounded-2xl bg-gradient-to-r ${c.color} text-white font-black text-xs md:text-sm shadow-lg hover:brightness-110 active:scale-95 transition-all text-center flex items-center justify-center gap-2 cursor-pointer`}
                >
                  <Volume2 className="w-4 h-4 shrink-0" />
                  <span className="truncate">{isAr ? c.textAr : c.textEn}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="px-6 py-4 bg-slate-950/80 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            <span>
              {isAr
                ? 'احتفال بطل التنس مستمر أمام الجمهور في البث المباشر!'
                : 'Championship celebration running live in front of the stadium crowd!'}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => playCrowdVoice('roar', isAr ? 'هتاف أسطوري!' : 'Massive Roar!')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black text-xs shadow-lg hover:brightness-110 active:scale-95 transition-all cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isAr ? 'تشجيع جماهيري جنوني 💥' : 'Trigger Huge Crowd Roar 💥'}</span>
            </button>

            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-all cursor-pointer"
            >
              {isAr ? 'إغلاق الفيديو' : 'Close Video'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
