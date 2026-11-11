import { CharacterDef, DifficultyLevel, GameMode, MatchScore, PlayerStats, StageDef } from '../types/tennis';
import { Zap, Flame, Sparkles, Activity, Bot } from 'lucide-react';
import { DIFFICULTIES } from '../game/stagesData';

interface ScoreBoardProps {
  score: MatchScore;
  playerChar: CharacterDef;
  oppChar: CharacterDef;
  playerStats: PlayerStats;
  oppStats: PlayerStats;
  stage: StageDef;
  difficulty: DifficultyLevel;
  lang: 'ar' | 'en';
  gameMode?: GameMode;
}

export const ScoreBoard: React.FC<ScoreBoardProps> = ({
  score,
  playerChar,
  oppChar,
  playerStats,
  oppStats,
  stage,
  difficulty,
  lang,
  gameMode = 'vs_robot',
}) => {
  const isAr = lang === 'ar';
  const diffConf = DIFFICULTIES[difficulty];

  return (
    <div className="absolute top-2 left-1/2 -translate-x-1/2 w-full max-w-3xl px-3 z-20 pointer-events-none select-none">
      {/* Top Banner Tournament & Stage & Speed Radar */}
      <div className="flex items-center justify-between bg-slate-950/90 border border-slate-700/80 rounded-t-xl px-4 py-1.5 shadow-2xl backdrop-blur-md">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
          <span className="text-xs font-black tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-yellow-200">
            {isAr ? 'تدريب مسابقة التنس العالمي' : 'World Tennis Tournament Training'}
          </span>
          <span className="text-slate-600 hidden sm:inline">•</span>
          <span className="text-xs font-bold text-slate-300 hidden sm:inline">
            {isAr ? stage.nameAr : stage.nameEn}
          </span>
        </div>

        {/* Speed Radar & Difficulty Badges */}
        <div className="flex items-center gap-2">
          {/* Live Speedometer Radar */}
          <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono font-black text-cyan-400">
            <Activity className="w-3.5 h-3.5 text-cyan-400" />
            <span>{score.lastShotSpeedKmH || 115}</span>
            <span className="text-[10px] text-slate-400 font-sans">{isAr ? 'كم/س' : 'km/h'}</span>
          </div>

          {/* Difficulty Badge */}
          <div className={`text-[11px] font-black px-2.5 py-0.5 rounded-lg border ${diffConf.badgeColor}`}>
            {isAr ? diffConf.nameAr : diffConf.nameEn}
          </div>

          {/* Potato Spectators Badge */}
          <div className="hidden sm:flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-200">
            <span>🥔</span>
            <span>{isAr ? 'جمهور بطاطس' : 'Potato Fans'}</span>
          </div>
        </div>
      </div>

      {/* Main Scoreboard Body */}
      <div className="grid grid-cols-12 bg-slate-900/90 border-x border-b border-slate-700/80 rounded-b-xl shadow-2xl overflow-hidden backdrop-blur-md">
        {/* Player Side */}
        <div className="col-span-5 p-2.5 flex items-center gap-2.5 bg-gradient-to-r from-blue-950/70 to-slate-900/40">
          <div
            className={`w-11 h-11 rounded-lg bg-gradient-to-br ${playerChar.avatarColor} flex items-center justify-center font-black text-lg text-white shadow-lg border border-white/20 shrink-0`}
          >
            {playerChar.nameAr[0]}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-black text-white truncate">
                {isAr ? playerChar.nameAr : playerChar.nameEn}
              </span>
              {score.server === 'player' && (
                <span className="w-2 h-2 rounded-full bg-lime-400 shadow-sm shadow-lime-400 animate-ping" />
              )}
            </div>
            {/* Super Gauge */}
            <div className="mt-1">
              <div className="flex items-center justify-between text-[10px] text-blue-300 font-bold mb-0.5">
                <span className="flex items-center gap-0.5">
                  <Zap className="w-3 h-3 text-cyan-400" />
                  {isAr ? 'الطاقة الخارقة' : 'SUPER GAUGE'}
                </span>
                <span>{playerStats.superGauge}%</span>
              </div>
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden border border-blue-500/30">
                <div
                  className={`h-full transition-all duration-300 ${
                    playerStats.superGauge >= 100
                      ? 'bg-gradient-to-r from-cyan-400 via-amber-300 to-rose-400 shadow-lg animate-pulse'
                      : 'bg-gradient-to-r from-blue-500 to-cyan-400'
                  }`}
                  style={{ width: `${playerStats.superGauge}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Center Tennis Score */}
        <div className="col-span-2 flex flex-col items-center justify-center bg-slate-950/90 border-x border-slate-800 py-1 px-1">
          <div className="text-[10px] font-bold tracking-wider text-slate-400 uppercase font-mono">
            {isAr ? 'الأشواط' : 'GAMES'}
          </div>
          <div className="flex items-center gap-2 text-xl font-black font-mono tracking-tight text-white my-0.5">
            <span className="text-blue-400">{score.playerGames}</span>
            <span className="text-slate-600">:</span>
            <span className="text-rose-400">{score.opponentGames}</span>
          </div>
          <div className="flex items-center gap-2 px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-xs font-black font-mono text-amber-400">
            {score.isDeuce ? (
              <span>DEUCE</span>
            ) : score.isAdvantage ? (
              <span>ADV: {score.isAdvantage === 'player' ? 'P' : 'CPU'}</span>
            ) : (
              <>
                <span>{score.playerPoints}</span>
                <span className="text-slate-500">-</span>
                <span>{score.opponentPoints}</span>
              </>
            )}
          </div>
        </div>

        {/* Opponent Side / Ball Machine in Practice Mode */}
        <div className="col-span-5 p-2.5 flex items-center justify-end gap-2.5 bg-gradient-to-l from-rose-950/70 to-slate-900/40">
          <div className="min-w-0 flex-1 text-right">
            <div className="flex items-center justify-end gap-1.5">
              {score.server === 'opponent' && (
                <span className="w-2 h-2 rounded-full bg-lime-400 shadow-sm shadow-lime-400 animate-ping" />
              )}
              <span className="text-sm font-black text-white truncate">
                {gameMode === 'practice'
                  ? isAr
                    ? 'آلة الكرات الآلية 🤖🎾'
                    : 'Ball Machine 🤖🎾'
                  : isAr
                  ? oppChar.nameAr
                  : oppChar.nameEn}
              </span>
            </div>
            {/* Opponent Gauge or Practice Mode Label */}
            <div className="mt-1">
              <div className="flex items-center justify-between text-[10px] text-rose-300 font-bold mb-0.5">
                <span>{gameMode === 'practice' ? (isAr ? 'تلقيم آلي' : 'AUTO FEED') : `${oppStats.superGauge}%`}</span>
                <span className="flex items-center gap-0.5">
                  {gameMode === 'practice' ? (isAr ? 'تدريب فردي' : 'SOLO') : isAr ? 'طاقة الخصم' : 'CPU SUPER'}
                  <Flame className="w-3 h-3 text-rose-400" />
                </span>
              </div>
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden border border-rose-500/30">
                <div
                  className="h-full bg-gradient-to-l from-rose-500 to-orange-400 transition-all duration-300"
                  style={{ width: gameMode === 'practice' ? '100%' : `${oppStats.superGauge}%` }}
                />
              </div>
            </div>
          </div>
          <div
            className={`w-11 h-11 rounded-lg ${
              gameMode === 'practice'
                ? 'bg-slate-800 border-cyan-400/40 text-cyan-300'
                : `bg-gradient-to-br ${oppChar.avatarColor} text-white`
            } flex items-center justify-center font-black text-lg shadow-lg border shrink-0`}
          >
            {gameMode === 'practice' ? '🤖' : oppChar.nameAr[0]}
          </div>
        </div>
      </div>

      {/* Dynamic Status / Referee Message Pill */}
      {score.statusMessageAr && (
        <div className="mt-1.5 flex justify-center">
          <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-slate-950/90 border border-amber-500/50 shadow-xl backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin" />
            <span className="text-xs font-bold text-amber-200">
              {isAr ? score.statusMessageAr : score.statusMessageEn}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
