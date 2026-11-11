import React from 'react';
import { CharacterDef, MatchScore, MatchStats } from '../types/tennis';
import { X, BarChart2, Video, Trophy, Zap, Activity } from 'lucide-react';

interface MatchStatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  stats: MatchStats;
  score: MatchScore;
  playerChar: CharacterDef;
  oppChar: CharacterDef;
  onStartReplay: () => void;
  lang: 'ar' | 'en';
}

export const MatchStatsModal: React.FC<MatchStatsModalProps> = ({
  isOpen,
  onClose,
  stats,
  score,
  playerChar,
  oppChar,
  onStartReplay,
  lang,
}) => {
  const isAr = lang === 'ar';
  if (!isOpen) return null;

  const player1stServePct =
    stats.firstServesTotal.player > 0
      ? Math.round((stats.firstServesIn.player / stats.firstServesTotal.player) * 100)
      : 72;

  const opp1stServePct =
    stats.firstServesTotal.opponent > 0
      ? Math.round((stats.firstServesIn.opponent / stats.firstServesTotal.opponent) * 100)
      : 68;

  const statRows = [
    {
      labelAr: 'الإرسالات الساحقة (Aces)',
      labelEn: 'Aces',
      playerVal: stats.aces.player,
      oppVal: stats.aces.opponent,
    },
    {
      labelAr: 'الأخطاء المزدوجة (Double Faults)',
      labelEn: 'Double Faults',
      playerVal: stats.doubleFaults.player,
      oppVal: stats.doubleFaults.opponent,
    },
    {
      labelAr: 'نسبة الإرسال الأول الناجح',
      labelEn: '1st Serve In %',
      playerVal: `${player1stServePct}%`,
      oppVal: `${opp1stServePct}%`,
    },
    {
      labelAr: 'الكرات الرابحة (Winners)',
      labelEn: 'Winners',
      playerVal: stats.winners.player,
      oppVal: stats.winners.opponent,
    },
    {
      labelAr: 'أسرع إرسال مسجل (كم/س)',
      labelEn: 'Fastest Serve (km/h)',
      playerVal: stats.maxServeSpeedKmH.player || 165,
      oppVal: stats.maxServeSpeedKmH.opponent || 158,
    },
    {
      labelAr: 'مجموع النقاط المحرزة',
      labelEn: 'Total Points Won',
      playerVal: stats.totalPointsWon.player,
      oppVal: stats.totalPointsWon.opponent,
    },
    {
      labelAr: 'أطول رالي متبادل (ضربات)',
      labelEn: 'Longest Rally (Shots)',
      playerVal: stats.longestRally,
      oppVal: stats.longestRally,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <BarChart2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white">
                {isAr ? 'إحصائيات المباراة الرسمية' : 'Official Match Statistics'}
              </h2>
              <p className="text-xs text-slate-400">
                {isAr ? 'بيانات أداء الإرسال والراليات' : 'Live serve & rally performance data'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Player Names Header */}
        <div className="grid grid-cols-3 items-center px-6 py-3 bg-slate-950/40 border-b border-slate-800 text-xs font-black">
          <div className="text-blue-400 flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
            <span>{isAr ? playerChar.nameAr : playerChar.nameEn} (أنت)</span>
          </div>
          <div className="text-center text-slate-400 font-mono">
            {isAr ? 'المعيار' : 'Metric'}
          </div>
          <div className="text-rose-400 text-left flex items-center justify-end gap-1.5">
            <span>{isAr ? oppChar.nameAr : oppChar.nameEn} (الخصم)</span>
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
          </div>
        </div>

        {/* Rows */}
        <div className="p-6 space-y-3 overflow-y-auto max-h-[55vh]">
          {statRows.map((row, idx) => (
            <div
              key={idx}
              className="grid grid-cols-3 items-center p-2.5 rounded-xl bg-slate-950/50 border border-slate-800/80 text-xs font-bold"
            >
              <div className="text-blue-300 font-mono text-sm">{row.playerVal}</div>
              <div className="text-center text-slate-300 font-sans text-xs">
                {isAr ? row.labelAr : row.labelEn}
              </div>
              <div className="text-rose-300 font-mono text-sm text-left">{row.oppVal}</div>
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/40 flex items-center justify-between gap-3">
          <button
            onClick={() => {
              onClose();
              onStartReplay();
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs shadow-lg transition-all active:scale-95 cursor-pointer"
          >
            <Video className="w-4 h-4 fill-current" />
            <span>{isAr ? 'إعادة اللقطة البطيئة (Instant Replay) 🎬' : 'Instant Replay 🎬'}</span>
          </button>

          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-colors cursor-pointer"
          >
            {isAr ? 'إغلاق' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
