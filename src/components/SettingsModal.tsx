import React from 'react';
import { DEFAULT_PLAYER_SETTINGS, TennisPlayerSettings } from '../types/tennis';
import {
  X,
  RotateCcw,
  Sliders,
  Zap,
  Gauge,
  Wind,
  Target,
  Activity,
  Shield,
  Bot,
} from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: TennisPlayerSettings;
  onUpdateSettings: (newSettings: Partial<TennisPlayerSettings>) => void;
  lang: 'ar' | 'en';
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  lang,
}) => {
  const isAr = lang === 'ar';
  if (!isOpen) return null;

  const handleReset = () => {
    onUpdateSettings({ ...DEFAULT_PLAYER_SETTINGS });
  };

  const sliders = [
    {
      key: 'runningSpeed' as keyof TennisPlayerSettings,
      nameAr: 'سرعة الجري والتحرك',
      nameEn: 'Running Speed',
      descAr: 'تحدد السرعة القصوى للاعب أثناء مطاردة الكرات الصعبة عبر الملعب.',
      descEn: 'Controls maximum player sprint speed when tracking deep shots.',
      icon: Wind,
      color: 'accent-cyan-400',
      min: 20,
      max: 100,
      unit: '%',
    },
    {
      key: 'shotPower' as keyof TennisPlayerSettings,
      nameAr: 'قوة الضربات والإرسال',
      nameEn: 'Shot Power',
      descAr: 'تزيد سرعة وانطلاق الكرة وتزيد قوة الإرسال والضربات الساحقة.',
      descEn: 'Controls kinetic ball exit velocity on groundstrokes and serves.',
      icon: Zap,
      color: 'accent-amber-400',
      min: 20,
      max: 100,
      unit: '%',
    },
    {
      key: 'accuracy' as keyof TennisPlayerSettings,
      nameAr: 'دقة التصويب والزوايا',
      nameEn: 'Shot Accuracy',
      descAr: 'تتحكم في دقة توجيه الكرة نحو خطوط وزوايا الملعب وتقلل هامش الخطأ.',
      descEn: 'Improves placement precision down the lines and cross-court.',
      icon: Target,
      color: 'accent-emerald-400',
      min: 20,
      max: 100,
      unit: '%',
    },
    {
      key: 'swingSpeed' as keyof TennisPlayerSettings,
      nameAr: 'سرعة أرجحة المضرب',
      nameEn: 'Swing Speed',
      descAr: 'تحدد سرعة دوران المضرب واستجابة الضربة والتوقيت السريع.',
      descEn: 'Governs stroke execution speed and fast reflex responsiveness.',
      icon: Activity,
      color: 'accent-purple-400',
      min: 20,
      max: 100,
      unit: '%',
    },
    {
      key: 'spin' as keyof TennisPlayerSettings,
      nameAr: 'معدل دوران الكرة (Spin)',
      nameEn: 'Ball Spin Rate',
      descAr: 'تتحكم في حدة التوبسبين الهابط والسلايس الزاحف وقوة تأثير ماغنوس.',
      descEn: 'Controls topspin dive, slice bite, and lateral aerodynamic curve.',
      icon: Gauge,
      color: 'accent-pink-400',
      min: 20,
      max: 100,
      unit: '%',
    },
    {
      key: 'agility' as keyof TennisPlayerSettings,
      nameAr: 'الرشاقة وتغيير الاتجاه',
      nameEn: 'Player Agility',
      descAr: 'تزيد تسارع اللاعب والفرملة والانطلاق السريع وتغيير الاتجاه.',
      descEn: 'Controls acceleration, sudden stops, and rapid direction changes.',
      icon: Shield,
      color: 'accent-blue-400',
      min: 20,
      max: 100,
      unit: '%',
    },
    {
      key: 'maxStamina' as keyof TennisPlayerSettings,
      nameAr: 'اللياقة والتحمل البدني',
      nameEn: 'Stamina & Endurance',
      descAr: 'تزيد سعة طاقة اللاعب وتقلل معدل الإرهاق أثناء الراليات الطويلة.',
      descEn: 'Controls endurance capacity during grueling multi-shot rallies.',
      icon: Activity,
      color: 'accent-lime-400',
      min: 30,
      max: 100,
      unit: '%',
    },
    {
      key: 'aiDifficulty' as keyof TennisPlayerSettings,
      nameAr: 'مستوى ذكاء الخصم (AI)',
      nameEn: 'AI Opponent Skill',
      descAr: 'تعدل مهارة الخصم وسرعة قراءته لمسار الكرة ودقة تسديداته.',
      descEn: 'Adjusts opponent anticipation, shot depth, and tactical variety.',
      icon: Bot,
      color: 'accent-rose-400',
      min: 10,
      max: 100,
      unit: '%',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
      <div className="relative w-full max-w-2xl max-h-[90vh] bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        {/* Tennis Court Visual Background */}
        <div className="absolute inset-0 pointer-events-none opacity-30 select-none overflow-hidden">
          <svg className="w-full h-full object-cover" viewBox="0 0 600 800" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Outer court apron */}
            <rect width="600" height="800" fill="#081426" />
            {/* Inner Court Floor */}
            <rect x="70" y="50" width="460" height="700" fill="#0f2b48" stroke="#ffffff" strokeWidth="4" />
            {/* Singles Lines */}
            <line x1="120" y1="50" x2="120" y2="750" stroke="#ffffff" strokeWidth="3" />
            <line x1="480" y1="50" x2="480" y2="750" stroke="#ffffff" strokeWidth="3" />
            {/* Service Lines */}
            <line x1="120" y1="230" x2="480" y2="230" stroke="#ffffff" strokeWidth="3" />
            <line x1="120" y1="570" x2="480" y2="570" stroke="#ffffff" strokeWidth="3" />
            {/* Center Service Line */}
            <line x1="300" y1="230" x2="300" y2="570" stroke="#ffffff" strokeWidth="3" />
            {/* Center Baselines Marks */}
            <line x1="300" y1="50" x2="300" y2="75" stroke="#ffffff" strokeWidth="3" />
            <line x1="300" y1="750" x2="300" y2="725" stroke="#ffffff" strokeWidth="3" />
            {/* Net */}
            <line x1="50" y1="400" x2="550" y2="400" stroke="#ffffff" strokeWidth="5" strokeDasharray="6 4" opacity="0.9" />
            <line x1="50" y1="400" x2="550" y2="400" stroke="#38bdf8" strokeWidth="2" opacity="0.8" />
            {/* Tennis Balls on Court */}
            <circle cx="210" cy="315" r="14" fill="#ccff00" />
            <path d="M 199 310 Q 210 320 221 310" stroke="#ffffff" strokeWidth="2" fill="none" />
            <circle cx="390" cy="480" r="14" fill="#ccff00" />
            <path d="M 379 475 Q 390 485 401 475" stroke="#ffffff" strokeWidth="2" fill="none" />
            {/* Radial Stadium Spotlight Glow */}
            <circle cx="300" cy="400" r="320" fill="url(#stadiumGlow)" />
            <defs>
              <radialGradient id="stadiumGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.18" />
                <stop offset="100%" stopColor="#081426" stopOpacity="0" />
              </radialGradient>
            </defs>
          </svg>
          {/* Subtle gradient vignette to keep UI text perfectly clear */}
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950/70 via-slate-900/60 to-slate-950/80" />
        </div>

        {/* Header */}
        <div className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/75 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white">
                {isAr ? 'إعدادات فيزياء وتحكم التنس' : 'Pro Tennis Physics & Controls'}
              </h2>
              <p className="text-xs text-slate-400">
                {isAr
                  ? 'كل شريط تمرير متصل مباشرة بفيزياء الكرة وسلوك اللاعب الحقيقي'
                  : 'Every slider is directly connected to real ball physics and player kinematics'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all border border-slate-700 cursor-pointer"
              title={isAr ? 'استعادة الإعدادات الافتراضية' : 'Reset to Defaults'}
            >
              <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
              <span>{isAr ? 'استعادة الافتراضي' : 'Reset to Default'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Sliders List */}
        <div className="relative z-10 flex-1 overflow-y-auto p-6 space-y-5">
          {sliders.map((s) => {
            const Icon = s.icon;
            const val = settings[s.key] as number;

            return (
              <div
                key={s.key}
                className="p-3.5 rounded-2xl bg-slate-950/60 backdrop-blur-sm border border-slate-800/90 hover:border-slate-700 transition-colors"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4 text-cyan-400" />
                    <span className="text-sm font-bold text-white">
                      {isAr ? s.nameAr : s.nameEn}
                    </span>
                  </div>
                  <div className="text-xs font-mono font-black px-2 py-0.5 rounded-lg bg-slate-800 text-amber-300 border border-slate-700">
                    {val}
                    {s.unit}
                  </div>
                </div>

                <p className="text-[11px] text-slate-400 mb-3">{isAr ? s.descAr : s.descEn}</p>

                <div className="flex items-center gap-3">
                  <span className="text-[10px] text-slate-500 font-mono">{s.min}</span>
                  <input
                    type="range"
                    min={s.min}
                    max={s.max}
                    value={val}
                    onChange={(e) => onUpdateSettings({ [s.key]: parseInt(e.target.value, 10) })}
                    className={`w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer ${s.color}`}
                  />
                  <span className="text-[10px] text-slate-500 font-mono">{s.max}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="relative z-10 px-6 py-3.5 border-t border-slate-800 bg-slate-950/70 backdrop-blur-sm flex justify-between items-center text-xs text-slate-400">
          <span>
            {isAr
              ? 'يتم تطبيق التغييرات فوراً أثناء المباراة'
              : 'Changes take effect immediately during gameplay'}
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition-all cursor-pointer"
          >
            {isAr ? 'تم وحفظ' : 'Apply & Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
