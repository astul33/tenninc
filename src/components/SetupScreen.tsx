import React, { useState } from 'react';
import {
  CourtTheme,
  DifficultyLevel,
  GameMode,
  MatchLength,
  PlayerOutfit,
  PLAYER_OUTFITS,
  StageDef,
} from '../types/tennis';
import { COURTS_LIST, DIFFICULTIES, STAGES } from '../game/stagesData';
import {
  Trophy,
  Play,
  Gauge,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Flame,
  Zap,
  Shield,
  Layers,
  User,
  Bot,
  Shirt,
  Timer,
  CheckCircle2,
  XCircle,
  Sparkles,
  HelpCircle,
  Sliders,
  Languages,
} from 'lucide-react';
import { soundManager } from '../audio/soundManager';

export interface LaunchConfig {
  gameMode: GameMode;
  difficulty: DifficultyLevel;
  stage: StageDef;
  court: CourtTheme;
  outfit: PlayerOutfit;
  matchLength: MatchLength;
}

interface SetupScreenProps {
  onStartGame: (config: LaunchConfig) => void;
  lang: 'ar' | 'en';
  onToggleLang?: () => void;
  onOpenSettings?: () => void;
  onOpenHelp?: () => void;
}

type MenuView = 'title' | 'mode_select' | 'match_setup' | 'confirm_ready' | 'loading';

export const SetupScreen: React.FC<SetupScreenProps> = ({
  onStartGame,
  lang,
  onToggleLang,
  onOpenSettings,
  onOpenHelp,
}) => {
  // Navigation View State
  const [currentView, setCurrentView] = useState<MenuView>('title');

  // Match Configuration States
  const [selectedMode, setSelectedMode] = useState<GameMode>('vs_robot');
  const [selectedDifficulty, setSelectedDifficulty] = useState<DifficultyLevel>('normal');
  const [selectedStage, setSelectedStage] = useState<StageDef>(STAGES[0]);
  const [selectedCourt, setSelectedCourt] = useState<CourtTheme>('sakura');
  const [selectedOutfit, setSelectedOutfit] = useState<PlayerOutfit>(PLAYER_OUTFITS[0]);
  const [selectedMatchLength, setSelectedMatchLength] = useState<MatchLength>(1);

  // Setup tab when in 'match_setup'
  const [setupTab, setSetupTab] = useState<'difficulty' | 'court' | 'outfit' | 'length'>('difficulty');

  // Loading animation progress
  const [loadingProgress, setLoadingProgress] = useState(0);

  const isAr = lang === 'ar';

  const handleModeChoose = (mode: GameMode) => {
    soundManager.playPointChime(true);
    setSelectedMode(mode);
    setCurrentView('match_setup');
  };

  const handleProceedToConfirmation = () => {
    soundManager.playPointChime(true);
    setCurrentView('confirm_ready');
  };

  const handleConfirmYes = () => {
    soundManager.playCharge();
    setCurrentView('loading');
    setLoadingProgress(10);

    const interval = window.setInterval(() => {
      setLoadingProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            onStartGame({
              gameMode: selectedMode,
              difficulty: selectedDifficulty,
              stage: selectedStage,
              court: selectedCourt,
              outfit: selectedOutfit,
              matchLength: selectedMatchLength,
            });
          }, 300);
          return 100;
        }
        return prev + 22;
      });
    }, 100);
  };

  const handleConfirmNo = () => {
    soundManager.playCrowdCheer(false);
    setCurrentView('match_setup');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/90 backdrop-blur-xl overflow-y-auto select-none">
      <div className="absolute inset-0 bg-gradient-to-tr from-indigo-950/60 via-slate-950/80 to-blue-950/50 pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(56,189,248,0.12)_0%,transparent_75%)] pointer-events-none" />

      {/* ============================================================== */}
      {/* STEP 1: TITLE SCREEN / MAIN MENU (LARGE START / PLAY BUTTON)  */}
      {/* ============================================================== */}
      {currentView === 'title' && (
        <div className="relative w-full max-w-2xl bg-slate-900/95 border-2 border-amber-400/80 rounded-3xl shadow-[0_0_80px_rgba(245,158,11,0.25)] p-6 sm:p-10 flex flex-col items-center text-center backdrop-blur-2xl my-auto animate-in fade-in zoom-in-95 duration-300">
          {/* Top Brand Badges */}
          <div className="flex items-center gap-2 mb-4">
            <span className="px-3 py-1 rounded-full bg-amber-500/15 border border-amber-400/40 text-amber-300 text-xs font-black flex items-center gap-1.5 shadow-sm">
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              <span>{isAr ? 'البطولة العالمية الكبرى ATP' : 'ATP World Championship'}</span>
            </span>
            <span className="px-3 py-1 rounded-full bg-blue-500/15 border border-blue-400/40 text-blue-300 text-xs font-black flex items-center gap-1.5">
              <span>🥔</span>
              <span>{isAr ? 'جمهور بطاطس تفاعلي' : 'Interactive Potato Fans'}</span>
            </span>
          </div>

          {/* Main Tournament Title */}
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-300 to-rose-300 drop-shadow-lg mb-2">
            {isAr ? 'تدريب مسابقة التنس العالمي' : 'World Tennis Tournament Training'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-md mb-8 leading-relaxed">
            {isAr
              ? 'محاكاة تنس احترافية واقعية فائقة الدقة: فيزياء الكرة الحقيقية، لاعب بشري واقعي، 4 مستويات صعوبة، وتدريب فردي ضد آلة الكرات أو مباريات ضد الروبوت.'
              : 'Ultra-realistic ATP pro tennis simulation: authentic ball physics, photorealistic human athlete, 4 difficulty tiers, and solo practice or robot match.'}
          </p>

          {/* Large Start / Play Button (Step 1 Requirement) */}
          <button
            onClick={() => {
              soundManager.playPointChime(true);
              setCurrentView('mode_select');
            }}
            className="group relative w-full sm:w-80 py-5 px-8 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 hover:from-emerald-400 hover:to-cyan-300 text-slate-950 font-black text-xl shadow-[0_0_40px_rgba(16,185,129,0.55)] transition-all transform hover:scale-105 active:scale-95 cursor-pointer flex items-center justify-center gap-3 mb-6"
          >
            <div className="w-10 h-10 rounded-xl bg-slate-950/20 flex items-center justify-center text-slate-950">
              <Play className="w-6 h-6 fill-current transition-transform group-hover:scale-110" />
            </div>
            <span className="tracking-wide">
              {isAr ? 'ابدأ اللعب الآن 🎾🔥' : 'START / PLAY 🎾🔥'}
            </span>
          </button>

          {/* Secondary Quick Menu Controls */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-4 border-t border-slate-800/80 w-full text-xs">
            {onOpenSettings && (
              <button
                onClick={onOpenSettings}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 font-bold transition-all border border-slate-700 cursor-pointer"
              >
                <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                <span>{isAr ? 'إعدادات الفيزياء (0-100)' : 'Physics Settings'}</span>
              </button>
            )}

            {onOpenHelp && (
              <button
                onClick={onOpenHelp}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 font-bold transition-all border border-slate-700 cursor-pointer"
              >
                <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
                <span>{isAr ? 'دليل التحكم والضربات' : 'Controls Guide'}</span>
              </button>
            )}

            {onToggleLang && (
              <button
                onClick={onToggleLang}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 font-bold transition-all border border-slate-700 cursor-pointer"
              >
                <Languages className="w-3.5 h-3.5 text-rose-400" />
                <span>{lang.toUpperCase()}</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* STEP 2: CHOOSE GAME MODE (OPTION 1: PLAY ALONE / OPTION 2: ROBOT) */}
      {/* ============================================================== */}
      {currentView === 'mode_select' && (
        <div className="relative w-full max-w-3xl bg-slate-900/95 border border-slate-700 rounded-3xl shadow-2xl p-6 sm:p-8 flex flex-col backdrop-blur-2xl my-auto animate-in fade-in duration-200">
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                <Trophy className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-black text-white">
                  {isAr ? 'الخطوة 2: اختر نمط اللعب' : 'Step 2: Choose Game Mode'}
                </h2>
                <p className="text-xs text-slate-400">
                  {isAr ? 'حدد إن كنت ترغب بالتدريب بمفردك أو بدء مباراة ضد الروبوت' : 'Select solo practice or competitive AI match'}
                </p>
              </div>
            </div>

            <button
              onClick={() => setCurrentView('title')}
              className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all cursor-pointer border border-slate-700"
            >
              {isAr ? 'الرئيسية ↩️' : 'Main Menu ↩️'}
            </button>
          </div>

          {/* Mode Cards: Option 1 & Option 2 */}
          <div className="grid sm:grid-cols-2 gap-5 mb-6">
            {/* OPTION 1: PLAY ALONE (تدريب فردي حر) */}
            <button
              onClick={() => handleModeChoose('practice')}
              className="p-6 rounded-3xl bg-gradient-to-b from-cyan-950/50 to-slate-900/90 hover:from-cyan-900/60 hover:to-slate-900 border-2 border-cyan-500/40 hover:border-cyan-400 text-right transition-all flex flex-col justify-between shadow-xl cursor-pointer group active:scale-98"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-black text-xl border border-cyan-500/30 shadow-inner group-hover:scale-110 transition-transform">
                    <User className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-black px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                    {isAr ? 'الخيار 1 • تدريب حر' : 'Option 1 • Solo'}
                  </span>
                </div>

                <h3 className="text-xl font-black text-white group-hover:text-cyan-300 transition-colors mb-2">
                  {isAr ? 'اللعب الفردي (PLAY ALONE)' : 'PLAY ALONE'}
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed mb-4">
                  {isAr
                    ? 'تدرب بمفردك في الملعب بحرية تامة دون خصم، مع حركة حرة، آلة كرات آلية، وتدريب على الإرسال والضربات مع رادار السرعة.'
                    : 'Practice tennis alone without an opponent. Full court freedom, automated ball feeding machine, and serve speed tracking.'}
                </p>

                <div className="space-y-1.5 text-[11px] text-cyan-200 font-bold">
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                    <span>{isAr ? 'لا يوجد خصم منافس في الملعب' : 'No AI opponent on the other side'}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                    <span>{isAr ? 'حرية كاملة في الحركة وتجربة الضربات العشر' : 'Free movement and 10-shot practice'}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                    <span>{isAr ? 'تلقيم كرات آلي مستمر وتتبع الراليات' : 'Continuous ball feeder & rally counter'}</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-cyan-900/60 flex items-center justify-between text-xs font-black text-cyan-400 group-hover:translate-x-1 transition-transform">
                <span>{isAr ? 'اختر التدريب الفردي' : 'Select Practice Mode'}</span>
                <ChevronLeft className="w-4 h-4" />
              </div>
            </button>

            {/* OPTION 2: PLAY AGAINST ROBOT (اللعب ضد الروبوت) */}
            <button
              onClick={() => handleModeChoose('vs_robot')}
              className="p-6 rounded-3xl bg-gradient-to-b from-indigo-950/50 to-slate-900/90 hover:from-indigo-900/60 hover:to-slate-900 border-2 border-indigo-500/40 hover:border-indigo-400 text-right transition-all flex flex-col justify-between shadow-xl cursor-pointer group active:scale-98"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-black text-xl border border-indigo-500/30 shadow-inner group-hover:scale-110 transition-transform">
                    <Bot className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-black px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    {isAr ? 'الخيار 2 • مباراة رسمية' : 'Option 2 • Match'}
                  </span>
                </div>

                <h3 className="text-xl font-black text-white group-hover:text-indigo-300 transition-colors mb-2">
                  {isAr ? 'ضد الروبوت (PLAY AGAINST ROBOT)' : 'PLAY AGAINST ROBOT'}
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed mb-4">
                  {isAr
                    ? 'ابدأ مباراة رسمية ضد روبوت ذكاء اصطناعي يتحرك بذكاء في أرجاء الملعب، يتوقع مسار الكرات، ويرد الضربات بتكتيكات متنوعة.'
                    : 'Start a full match against an AI tennis opponent that moves around the court, predicts trajectories, and returns shots.'}
                </p>

                <div className="space-y-1.5 text-[11px] text-indigo-200 font-bold">
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                    <span>{isAr ? 'روبوت يتحرك في الملعب ويتوقع مكان الهبوط' : 'Robot moves and predicts ball landing'}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                    <span>{isAr ? 'ضربات تكتيكية متنوعة وهجوم على الشبكة' : 'Intelligent tactical returns & volleys'}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                    <span>{isAr ? 'مستويات صعوبة قابلة للتعديل بالكامل' : 'Fully adjustable AI difficulty tiers'}</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-indigo-900/60 flex items-center justify-between text-xs font-black text-indigo-400 group-hover:translate-x-1 transition-transform">
                <span>{isAr ? 'اختر مواجهة الروبوت' : 'Select Robot Match'}</span>
                <ChevronLeft className="w-4 h-4" />
              </div>
            </button>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* STEP 4: MATCH SETUP (DIFFICULTY, COURT, OUTFIT, MATCH LENGTH) */}
      {/* ============================================================== */}
      {currentView === 'match_setup' && (
        <div className="relative w-full max-w-4xl bg-slate-900/95 border border-slate-700 rounded-3xl shadow-2xl p-6 sm:p-8 flex flex-col backdrop-blur-2xl my-auto animate-in fade-in duration-200">
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-blue-500/20 text-blue-400 border border-blue-500/30">
                <Sliders className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-black text-white">
                  {isAr ? 'الخطوة 4: تخصيص وإعداد المباراة' : 'Step 4: Match Setup & Customization'}
                </h2>
                <p className="text-xs text-slate-400">
                  {isAr
                    ? `النمط المحدد: ${selectedMode === 'practice' ? 'التدريب الفردي الحر' : 'مباراة ضد الروبوت الذكي'}`
                    : `Active Mode: ${selectedMode === 'practice' ? 'Solo Practice' : 'AI Robot Match'}`}
                </p>
              </div>
            </div>

            {/* Setup Category Tabs */}
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-2xl border border-slate-800">
              <button
                onClick={() => setSetupTab('difficulty')}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  setupTab === 'difficulty' ? 'bg-amber-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                {isAr ? 'الصعوبة' : 'Difficulty'}
              </button>
              <button
                onClick={() => setSetupTab('court')}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  setupTab === 'court' ? 'bg-amber-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                {isAr ? 'الملعب' : 'Court'}
              </button>
              <button
                onClick={() => setSetupTab('outfit')}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  setupTab === 'outfit' ? 'bg-amber-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                {isAr ? 'الزي' : 'Outfit'}
              </button>
              <button
                onClick={() => setSetupTab('length')}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  setupTab === 'length' ? 'bg-amber-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                {isAr ? 'مدة الشوط' : 'Length'}
              </button>
            </div>
          </div>

          {/* Tab Content */}
          <div className="min-h-[280px]">
            {/* 1. MATCH DIFFICULTY */}
            {setupTab === 'difficulty' && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 mb-2">
                  <Gauge className="w-5 h-5 text-cyan-400" />
                  <span className="text-sm font-black text-white">
                    {isAr ? 'اختر مستوى الصعوبة المطلوب:' : 'Select Difficulty Tier:'}
                  </span>
                </div>
                <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-3">
                  {(['easy', 'normal', 'hard', 'impossible'] as DifficultyLevel[]).map((diffKey) => {
                    const conf = DIFFICULTIES[diffKey];
                    const isSelected = selectedDifficulty === diffKey;
                    return (
                      <button
                        key={diffKey}
                        onClick={() => setSelectedDifficulty(diffKey)}
                        className={`p-4 rounded-2xl border text-right transition-all flex flex-col justify-between cursor-pointer ${
                          isSelected
                            ? 'bg-amber-500/15 border-amber-400 shadow-xl ring-2 ring-amber-400/40'
                            : 'bg-slate-800/40 border-slate-700 hover:border-slate-500'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className={`text-xs font-black px-2 py-0.5 rounded-full border ${conf.badgeColor}`}>
                              {isAr ? conf.nameAr : conf.nameEn}
                            </span>
                            {diffKey === 'impossible' ? (
                              <Flame className="w-4 h-4 text-rose-500 animate-pulse" />
                            ) : diffKey === 'hard' ? (
                              <Zap className="w-4 h-4 text-amber-400" />
                            ) : diffKey === 'normal' ? (
                              <Trophy className="w-4 h-4 text-blue-400" />
                            ) : (
                              <Shield className="w-4 h-4 text-emerald-400" />
                            )}
                          </div>
                          <h4 className="text-base font-black text-white mb-1">
                            {isAr ? conf.nameAr : conf.nameEn}
                          </h4>
                          <p className="text-xs text-slate-400">{isAr ? conf.descriptionAr : conf.descriptionEn}</p>
                        </div>
                        <div className="mt-3 pt-2 border-t border-slate-700/60 text-[11px] font-bold text-amber-300">
                          {isAr ? 'سرعة الإرسال: ' : 'Serve: '} {conf.serveSpeedKmH} كم/س
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 2. COURT TYPE */}
            {setupTab === 'court' && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="w-5 h-5 text-pink-400" />
                  <span className="text-sm font-black text-white">
                    {isAr ? 'اختر الملعب المفضل للمباراة:' : 'Select Court Environment:'}
                  </span>
                </div>
                <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-3">
                  {COURTS_LIST.map((c) => {
                    const isSelected = selectedCourt === c.id;
                    return (
                      <button
                        key={c.id}
                        onClick={() => setSelectedCourt(c.id)}
                        className={`p-3.5 rounded-2xl border text-right transition-all flex flex-col justify-between cursor-pointer ${
                          isSelected
                            ? 'bg-amber-500/15 border-amber-400 shadow-xl ring-2 ring-amber-400/40'
                            : 'bg-slate-800/40 border-slate-700 hover:border-slate-500'
                        }`}
                      >
                        <div
                          className={`w-full h-16 rounded-xl bg-gradient-to-r ${c.previewGradient} flex items-center justify-center font-black text-sm text-white mb-2 shadow-inner border border-white/20`}
                        >
                          {isAr ? c.nameAr : c.nameEn}
                        </div>
                        <h4 className="text-sm font-black text-white">{isAr ? c.nameAr : c.nameEn}</h4>
                        <p className="text-[11px] text-slate-400 mt-1">{isAr ? c.descriptionAr : c.descriptionEn}</p>
                        <div className="mt-2 pt-2 border-t border-slate-700/60 text-[10px] text-cyan-300 font-bold">
                          {isAr ? c.surfaceAr : c.surfaceEn}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 3. PLAYER OUTFIT */}
            {setupTab === 'outfit' && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 mb-2">
                  <Shirt className="w-5 h-5 text-emerald-400" />
                  <span className="text-sm font-black text-white">
                    {isAr ? 'اختر الزي الرياضي للاعب البشري:' : 'Choose Athletic Player Outfit:'}
                  </span>
                </div>
                <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-3">
                  {PLAYER_OUTFITS.map((outfit) => {
                    const isSelected = selectedOutfit.id === outfit.id;
                    const jerseyHex = '#' + outfit.jerseyColor.toString(16).padStart(6, '0');
                    const secHex = '#' + outfit.secondaryColor.toString(16).padStart(6, '0');

                    return (
                      <button
                        key={outfit.id}
                        onClick={() => setSelectedOutfit(outfit)}
                        className={`p-4 rounded-2xl border text-right transition-all flex flex-col justify-between cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-500/15 border-emerald-400 shadow-xl ring-2 ring-emerald-400/40'
                            : 'bg-slate-800/40 border-slate-700 hover:border-slate-500'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-2xl">{outfit.badge}</span>
                            <div className="flex items-center gap-1.5 p-1 rounded-lg bg-slate-950 border border-slate-800">
                              <span
                                className="w-4 h-4 rounded-full border border-white/40 shadow-sm"
                                style={{ backgroundColor: jerseyHex }}
                              />
                              <span
                                className="w-4 h-4 rounded-full border border-white/40 shadow-sm"
                                style={{ backgroundColor: secHex }}
                              />
                            </div>
                          </div>
                          <h4 className="text-sm font-black text-white mb-1">
                            {isAr ? outfit.nameAr : outfit.nameEn}
                          </h4>
                          <span className="text-[11px] text-slate-400">
                            {isAr ? 'خامة بيكي رياضية مسامية ومضادة للتعرق' : 'Breathable technical mesh fabric'}
                          </span>
                        </div>

                        <div className="mt-3 pt-2 border-t border-slate-700/60 text-[10px] text-emerald-300 font-bold">
                          {isSelected ? (isAr ? '✓ الزي المختار' : '✓ Selected') : (isAr ? 'اضغط للاختيار' : 'Click to select')}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 4. MATCH LENGTH */}
            {setupTab === 'length' && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 mb-2">
                  <Timer className="w-5 h-5 text-amber-400" />
                  <span className="text-sm font-black text-white">
                    {isAr ? 'اختر مدة ونظام المباراة:' : 'Select Match Length:'}
                  </span>
                </div>
                <div className="grid sm:grid-cols-3 gap-4">
                  {[
                    {
                      len: 1 as MatchLength,
                      nameAr: 'شوط سريع (Game 1)',
                      nameEn: '1 Game Quick Match',
                      descAr: 'الفائز بالشوط الأول يفوز بالمباراة مباشرة (تدريب سريع ومباشر).',
                      descEn: 'First to 1 game wins the match immediately. Quick training round.',
                    },
                    {
                      len: 2 as MatchLength,
                      nameAr: 'أفضل 3 أشواط (Best of 3)',
                      nameEn: 'Best of 3 Games',
                      descAr: 'الفائز بشوطين أولاً يحسم اللقاء (تحدٍ متوازن وممتع).',
                      descEn: 'First to win 2 games takes the match. Balanced competition.',
                    },
                    {
                      len: 6 as MatchLength,
                      nameAr: 'مجموعة كاملة (Full Set 6)',
                      nameEn: 'Full 6-Game Set',
                      descAr: 'نظام التنس الاحترافي الكامل (6 أشواط مع شوط كسر التعادل عند 6-6).',
                      descEn: 'Full pro set: first to 6 games with 7-point tie-break at 6-6.',
                    },
                  ].map((item) => {
                    const isSelected = selectedMatchLength === item.len;
                    return (
                      <button
                        key={item.len}
                        onClick={() => setSelectedMatchLength(item.len)}
                        className={`p-5 rounded-2xl border text-right transition-all flex flex-col justify-between cursor-pointer ${
                          isSelected
                            ? 'bg-amber-500/15 border-amber-400 shadow-xl ring-2 ring-amber-400/40'
                            : 'bg-slate-800/40 border-slate-700 hover:border-slate-500'
                        }`}
                      >
                        <div>
                          <div className="text-2xl font-black text-amber-400 font-mono mb-2">
                            {item.len} {isAr ? 'شوط' : 'Game'}
                          </div>
                          <h4 className="text-base font-black text-white mb-1">
                            {isAr ? item.nameAr : item.nameEn}
                          </h4>
                          <p className="text-xs text-slate-400 leading-relaxed">{isAr ? item.descAr : item.descEn}</p>
                        </div>
                        <div className="mt-4 pt-2 border-t border-slate-700/60 text-xs font-bold text-amber-300">
                          {isSelected ? (isAr ? '✓ مختار' : '✓ Selected') : (isAr ? 'اختيار' : 'Select')}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Action Bar */}
          <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between">
            <button
              onClick={() => setCurrentView('mode_select')}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
              <span>{isAr ? 'تغيير نمط اللعب' : 'Change Mode'}</span>
            </button>

            <button
              onClick={handleProceedToConfirmation}
              className="flex items-center gap-2 px-7 py-3 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-black text-sm shadow-xl transition-all cursor-pointer active:scale-95"
            >
              <span>{isAr ? 'متابعة لتأكيد اللعب 🎾' : 'Next: Confirm & Play 🎾'}</span>
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* STEP 3: ASK THE PLAYER ("Are you ready to play?") WITH YES / NO */}
      {/* ============================================================== */}
      {currentView === 'confirm_ready' && (
        <div className="relative w-full max-w-xl bg-slate-900/95 border-2 border-amber-400 rounded-3xl shadow-[0_0_80px_rgba(245,158,11,0.3)] p-6 sm:p-8 flex flex-col items-center text-center backdrop-blur-2xl my-auto animate-in zoom-in-95 duration-200">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-amber-500 to-yellow-300 text-slate-950 flex items-center justify-center font-black text-2xl shadow-xl mb-4 animate-bounce">
            🎾
          </div>

          {/* Step 3 Prompt as specifically requested */}
          <h2 className="text-2xl sm:text-3xl font-black text-white mb-2">
            {isAr ? 'هل أنت مستعد لبدء اللعب؟' : 'Are you ready to play?'}
          </h2>
          <p className="text-xs text-slate-300 mb-6">
            {isAr
              ? 'راجع إعداداتك بالأسفل ثم اضغط نعم لبدء المباراة والدخول للملعب فوراً!'
              : 'Review your selected settings below and confirm to enter the court!'}
          </p>

          {/* Match Configuration Summary Card */}
          <div className="w-full p-4 rounded-2xl bg-slate-950/70 border border-slate-800 text-xs text-slate-300 space-y-2.5 mb-6 text-right">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
              <span className="text-slate-400">{isAr ? 'نمط اللعبة:' : 'Game Mode:'}</span>
              <span className="font-black text-cyan-300">
                {selectedMode === 'practice'
                  ? isAr
                    ? 'التدريب الفردي الحر (Play Alone)'
                    : 'Solo Practice (Play Alone)'
                  : isAr
                  ? 'مباراة ضد الروبوت (Play Against Robot)'
                  : 'Play Against Robot'}
              </span>
            </div>

            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
              <span className="text-slate-400">{isAr ? 'مستوى الصعوبة:' : 'Difficulty:'}</span>
              <span className="font-bold text-amber-300">
                {DIFFICULTIES[selectedDifficulty][isAr ? 'nameAr' : 'nameEn']}
              </span>
            </div>

            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
              <span className="text-slate-400">{isAr ? 'الملعب المختار:' : 'Court:'}</span>
              <span className="font-bold text-pink-300">
                {COURTS_LIST.find((c) => c.id === selectedCourt)?.[isAr ? 'nameAr' : 'nameEn']}
              </span>
            </div>

            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
              <span className="text-slate-400">{isAr ? 'الزي الرياضي:' : 'Player Outfit:'}</span>
              <span className="font-bold text-emerald-300">{isAr ? selectedOutfit.nameAr : selectedOutfit.nameEn}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-400">{isAr ? 'نظام المباراة:' : 'Match Length:'}</span>
              <span className="font-bold text-white">
                {selectedMatchLength === 1
                  ? isAr
                    ? 'شوط سريع واحد (1 Game)'
                    : '1 Game Quick'
                  : selectedMatchLength === 2
                  ? isAr
                    ? 'أفضل 3 أشواط (Best of 3)'
                    : 'Best of 3'
                  : isAr
                  ? 'مجموعة كاملة 6 أشواط (Full Set)'
                  : 'Full 6-Game Set'}
              </span>
            </div>
          </div>

          {/* YES and NO Confirmation Buttons (Step 3 Requirement) */}
          <div className="grid grid-cols-2 gap-4 w-full">
            {/* NO – Go back to the previous menu */}
            <button
              onClick={handleConfirmNo}
              className="flex items-center justify-center gap-2 py-3.5 px-5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-black text-sm border border-slate-700 transition-all cursor-pointer active:scale-95"
            >
              <XCircle className="w-4 h-4 text-rose-400" />
              <span>{isAr ? 'لا (رجوع للإعدادات)' : 'NO – Go Back'}</span>
            </button>

            {/* YES – Start the game */}
            <button
              onClick={handleConfirmYes}
              className="flex items-center justify-center gap-2 py-3.5 px-5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-sm shadow-[0_0_30px_rgba(16,185,129,0.5)] transition-all cursor-pointer active:scale-95"
            >
              <CheckCircle2 className="w-5 h-5" />
              <span>{isAr ? 'نعم (ابدأ اللعب! 🎾🔥)' : 'YES – Start Game!'}</span>
            </button>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* LOADING LAUNCH TRANSITION SCREEN                              */}
      {/* ============================================================== */}
      {currentView === 'loading' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-950/95 backdrop-blur-2xl">
          <div className="w-full max-w-md text-center space-y-5">
            <div className="text-6xl animate-bounce">🥔🎾🔥</div>

            <div>
              <h3 className="text-2xl font-black text-amber-300">
                {isAr ? 'جاري دخول أرضية الملعب...' : 'Entering Championship Court...'}
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                {selectedMode === 'practice'
                  ? isAr
                    ? 'جاري تجهيز آلة الكرات الآلية والتدريب الفردي الحر!'
                    : 'Setting up automated ball machine and solo practice court!'
                  : isAr
                  ? 'جاري تحضير روبوت الذكاء الاصطناعي وجماهير البطاطس في المدرجات!'
                  : 'Booting AI tennis robot and seating Potato fans in the stands!'}
              </p>
            </div>

            <div className="w-full h-3.5 bg-slate-800 rounded-full overflow-hidden border border-slate-700 p-0.5">
              <div
                className="h-full bg-gradient-to-r from-amber-400 via-emerald-400 to-cyan-400 rounded-full transition-all duration-150"
                style={{ width: `${loadingProgress}%` }}
              />
            </div>

            <div className="text-xs font-mono font-bold text-cyan-300">
              {loadingProgress}% • {isAr ? 'تهيئة فيزياء الكرة ونموذج اللاعب الواقعي' : 'Loading Physics & Realistic Athlete'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
