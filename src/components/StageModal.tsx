import React, { useState } from 'react';
import { StageDef, CharacterDef } from '../types/tennis';
import { STAGES, CHARACTERS } from '../game/stagesData';
import { X, Trophy, CheckCircle2, Lock, Zap, Award, Flame, Wind, Shield } from 'lucide-react';

interface StageModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentStage: StageDef;
  onSelectStage: (stage: StageDef) => void;
  selectedPlayerChar: CharacterDef;
  onSelectPlayerChar: (char: CharacterDef) => void;
  unlockedLevel: number;
  lang: 'ar' | 'en';
}

export const StageModal: React.FC<StageModalProps> = ({
  isOpen,
  onClose,
  currentStage,
  onSelectStage,
  selectedPlayerChar,
  onSelectPlayerChar,
  unlockedLevel,
  lang,
}) => {
  const [activeTab, setActiveTab] = useState<'stages' | 'characters'>('stages');
  const isAr = lang === 'ar';

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
      <div className="relative w-full max-w-3xl max-h-[90vh] bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white">
                {isAr ? 'بطولة أبطال التنس الخارق' : 'Anime Tennis Championship'}
              </h2>
              <p className="text-xs text-slate-400">
                {isAr ? 'اختر المرحلة أو بدّل شخصيتك المفضلة' : 'Select stage or switch your anime hero'}
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

        {/* Tab switcher */}
        <div className="flex border-b border-slate-800 px-6 pt-2 bg-slate-950/30">
          <button
            onClick={() => setActiveTab('stages')}
            className={`pb-3 px-4 font-black text-sm border-b-2 transition-all cursor-pointer ${
              activeTab === 'stages'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            {isAr ? 'المراحل الخمس المتصاعدة' : 'Progressive Stages (1-5)'}
          </button>
          <button
            onClick={() => setActiveTab('characters')}
            className={`pb-3 px-4 font-black text-sm border-b-2 transition-all cursor-pointer ${
              activeTab === 'characters'
                ? 'border-indigo-400 text-indigo-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            {isAr ? 'قائمة الشخصيات والقدرات' : 'Anime Heroes Roster'}
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {activeTab === 'stages' ? (
            <div className="grid gap-3.5">
              {STAGES.map((stg) => {
                const opp = CHARACTERS.find((c) => c.id === stg.opponentId)!;
                const isCurrent = currentStage.level === stg.level;
                const isLocked = stg.level > unlockedLevel;

                return (
                  <div
                    key={stg.level}
                    className={`relative p-4 rounded-2xl border transition-all ${
                      isCurrent
                        ? 'bg-amber-500/10 border-amber-400/80 shadow-lg'
                        : isLocked
                        ? 'bg-slate-950/40 border-slate-800 opacity-60'
                        : 'bg-slate-800/40 border-slate-700/60 hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3.5">
                        <div
                          className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-xl text-white shadow-md border ${
                            isCurrent
                              ? 'bg-gradient-to-tr from-amber-500 to-orange-400 border-amber-300'
                              : 'bg-slate-800 border-slate-700'
                          }`}
                        >
                          {stg.level}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-base font-black text-white">
                              {isAr ? stg.nameAr : stg.nameEn}
                            </h3>
                            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                              {isAr ? stg.difficultyLabelAr : stg.difficultyLabelEn}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 mt-1 max-w-md">
                            {isAr ? stg.descriptionAr : stg.descriptionEn}
                          </p>
                          <div className="flex items-center gap-2 mt-2 text-xs text-indigo-300 font-semibold">
                            <span>{isAr ? 'الخصم:' : 'Opponent:'}</span>
                            <span className="font-bold text-white">{isAr ? opp.nameAr : opp.nameEn}</span>
                            <span className="text-slate-500">•</span>
                            <span className="text-amber-400 font-mono">
                              {isAr ? opp.specialMoveAr : opp.specialMoveEn}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Action */}
                      <div>
                        {isLocked ? (
                          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 text-slate-500 text-xs font-bold border border-slate-700">
                            <Lock className="w-4 h-4" />
                            <span>{isAr ? 'مقفل' : 'Locked'}</span>
                          </div>
                        ) : isCurrent ? (
                          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 text-slate-950 text-xs font-black shadow-md">
                            <CheckCircle2 className="w-4 h-4" />
                            <span>{isAr ? 'المرحلة الحالية' : 'Current'}</span>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              onSelectStage(stg);
                              onClose();
                            }}
                            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black shadow-md transition-all active:scale-95 cursor-pointer"
                          >
                            {isAr ? 'بدء النزال' : 'Play Stage'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Character Selection Roster */
            <div className="grid sm:grid-cols-2 gap-4">
              {CHARACTERS.map((char) => {
                const isSelected = selectedPlayerChar.id === char.id;

                return (
                  <div
                    key={char.id}
                    className={`p-4 rounded-2xl border transition-all ${
                      isSelected
                        ? 'bg-indigo-950/40 border-indigo-500 shadow-xl ring-2 ring-indigo-500/30'
                        : 'bg-slate-800/30 border-slate-700/60 hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${char.avatarColor} border-2 border-white/20 shadow-lg flex items-center justify-center text-2xl font-black text-white shrink-0`}
                      >
                        {char.nameAr[0]}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-black text-white text-base truncate">
                            {isAr ? char.nameAr : char.nameEn}
                          </h4>
                          <span className="text-xl font-black text-amber-400 font-mono">
                            {char.specialKanji}
                          </span>
                        </div>
                        <p className="text-xs text-indigo-300 font-semibold truncate">
                          {isAr ? char.titleAr : char.titleEn}
                        </p>
                      </div>
                    </div>

                    {/* Stats Radar Bars */}
                    <div className="mt-3.5 space-y-1.5 text-[11px] font-bold">
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1 text-cyan-300">
                          <Wind className="w-3.5 h-3.5" /> {isAr ? 'السرعة' : 'Speed'}
                        </span>
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map((i) => (
                            <span
                              key={i}
                              className={`w-3.5 h-1.5 rounded-full ${
                                i <= char.speed ? 'bg-cyan-400' : 'bg-slate-800'
                              }`}
                            />
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1 text-amber-300">
                          <Flame className="w-3.5 h-3.5" /> {isAr ? 'القوة' : 'Power'}
                        </span>
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map((i) => (
                            <span
                              key={i}
                              className={`w-3.5 h-1.5 rounded-full ${
                                i <= char.power ? 'bg-amber-400' : 'bg-slate-800'
                              }`}
                            />
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1 text-pink-300">
                          <Zap className="w-3.5 h-3.5" /> {isAr ? 'الدوران واللولب' : 'Spin'}
                        </span>
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map((i) => (
                            <span
                              key={i}
                              className={`w-3.5 h-1.5 rounded-full ${
                                i <= char.spin ? 'bg-pink-400' : 'bg-slate-800'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Special Move Card */}
                    <div className="mt-3 p-2 rounded-xl bg-slate-950/50 border border-slate-800 flex items-center justify-between">
                      <div className="text-[11px] text-amber-300 font-bold">
                        {isAr ? char.specialMoveAr : char.specialMoveEn}
                      </div>
                      <button
                        onClick={() => onSelectPlayerChar(char)}
                        className={`px-3 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                        }`}
                      >
                        {isSelected ? (isAr ? 'المحدد حالياً' : 'Selected') : isAr ? 'اختيار' : 'Select'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
