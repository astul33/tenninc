/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { TennisEngine } from './game/tennisEngine';
import { CHARACTERS, STAGES } from './game/stagesData';
import {
  CharacterDef,
  CourtTheme,
  DEFAULT_PLAYER_SETTINGS,
  DifficultyLevel,
  GameMode,
  MatchScore,
  MatchStats,
  PlayerStats,
  ServeState,
  ShotType,
  StageDef,
  TennisPlayerSettings,
} from './types/tennis';
import { ScoreBoard } from './components/ScoreBoard';
import { BottomDock } from './components/BottomDock';
import { TouchControls } from './components/TouchControls';
import { AnimeCutIn } from './components/AnimeCutIn';
import { StageModal } from './components/StageModal';
import { HelpModal } from './components/HelpModal';
import { SettingsModal } from './components/SettingsModal';
import { MatchStatsModal } from './components/MatchStatsModal';
import { SetupScreen, LaunchConfig } from './components/SetupScreen';
import { MangaSpeedLines } from './components/MangaSpeedLines';
import { VictoryVideoModal } from './components/VictoryVideoModal';
import { Trophy, Play, RotateCcw, ArrowRight, Settings, Video, Sparkles } from 'lucide-react';

export default function App() {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const engineRef = useRef<TennisEngine | null>(null);

  // App & Tournament States
  const [lang, setLang] = useState<'ar' | 'en'>('ar');
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('normal');
  const [currentStage, setCurrentStage] = useState<StageDef>(STAGES[0]);
  const [currentCourt, setCurrentCourt] = useState<CourtTheme>('sakura');
  const [unlockedLevel, setUnlockedLevel] = useState<number>(1);
  const [playerChar, setPlayerChar] = useState<CharacterDef>(CHARACTERS[0]); // Ryuto
  const [oppChar, setOppChar] = useState<CharacterDef>(CHARACTERS[2]); // Kenji for Stage 1
  const [gameMode, setGameMode] = useState<GameMode>('vs_robot');

  // Show Setup / Loading Screen initially
  const [isSetupOpen, setIsSetupOpen] = useState<boolean>(true);

  // Professional Tennis Physics & Player Controls Settings (Sliders 0-100)
  const [settings, setSettings] = useState<TennisPlayerSettings>({ ...DEFAULT_PLAYER_SETTINGS });
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isStatsOpen, setIsStatsOpen] = useState<boolean>(false);
  const [lastShotType, setLastShotType] = useState<string>('flat');

  const [score, setScore] = useState<MatchScore>({
    playerPoints: 0,
    opponentPoints: 0,
    playerGames: 0,
    opponentGames: 0,
    playerSets: 0,
    opponentSets: 0,
    server: 'player',
    status: 'serving',
    statusMessageAr: 'استعد للإرسال الأول! اضغط مسافة أو زر الرمي',
    statusMessageEn: '1st Serve! Press Space or Toss button',
    isDeuce: false,
    isAdvantage: null,
    isTiebreak: false,
    playerTiebreakPoints: 0,
    opponentTiebreakPoints: 0,
    lastShotSpeedKmH: 120,
    serveAttempt: 1,
  });

  const [serveState, setServeState] = useState<ServeState>({
    phase: 'idle',
    tossTimer: 0,
    tossApexY: 2.8,
    timingScore: 1.0,
    attempt: 1,
    power: 75,
    directionX: 0,
    spinType: 'flat',
  });

  const [matchStats, setMatchStats] = useState<MatchStats>({
    aces: { player: 0, opponent: 0 },
    doubleFaults: { player: 0, opponent: 0 },
    firstServesIn: { player: 0, opponent: 0 },
    firstServesTotal: { player: 0, opponent: 0 },
    winners: { player: 0, opponent: 0 },
    unforcedErrors: { player: 0, opponent: 0 },
    maxServeSpeedKmH: { player: 0, opponent: 0 },
    totalPointsWon: { player: 0, opponent: 0 },
    longestRally: 0,
    currentRally: 0,
  });

  const [playerStats, setPlayerStats] = useState<PlayerStats>({
    points: 0,
    games: 0,
    sets: 0,
    superGauge: 30,
    stamina: 100,
  });

  const [oppStats, setOppStats] = useState<PlayerStats>({
    points: 0,
    games: 0,
    sets: 0,
    superGauge: 20,
    stamina: 100,
  });

  // Modals & Camera Overlays
  const [isStageModalOpen, setIsStageModalOpen] = useState(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [cameraMode, setCameraMode] = useState<'follow' | 'broadcast' | 'action' | 'sideline'>('follow');

  const [cutInState, setCutInState] = useState<{
    char: CharacterDef | null;
    moveName: string;
    kanji: string;
  }>({
    char: null,
    moveName: '',
    kanji: '',
  });

  const [matchVictory, setMatchVictory] = useState<{
    show: boolean;
    winner: 'player' | 'opponent';
    stage: StageDef;
  } | null>(null);

  // Grand Slam Victory Celebration & Video States
  const [isVictoryVideoOpen, setIsVictoryVideoOpen] = useState<boolean>(false);
  const [celebrationPose, setCelebrationPose] = useState<
    'arms_up' | 'fist_pump' | 'racket_raise' | 'wave' | 'trophy'
  >('arms_up');
  const [celebrationAngle, setCelebrationAngle] = useState<'orbit' | 'closeup' | 'crane' | 'hero'>(
    'orbit'
  );

  // Initialize Three.js Engine once on mount
  useEffect(() => {
    if (!mountRef.current) return;

    const engine = new TennisEngine(
      mountRef.current,
      currentStage,
      currentCourt,
      difficulty,
      playerChar,
      oppChar,
      {
        onScoreUpdate: (newScore) => setScore({ ...newScore }),
        onStatsUpdate: (pStats, oStats) => {
          setPlayerStats({ ...pStats });
          setOppStats({ ...oStats });
        },
        onMatchStatsUpdate: (mStats) => setMatchStats({ ...mStats }),
        onServeStateUpdate: (sState) => setServeState({ ...sState }),
        onSpecialCutIn: (char, moveNameAr, kanji) => {
          setCutInState({ char, moveName: moveNameAr, kanji });
        },
        onMatchEnd: (winner, stage) => {
          setMatchVictory({ show: true, winner, stage });
          if (winner === 'player') {
            if (stage.level >= unlockedLevel) {
              setUnlockedLevel(Math.min(stage.level + 1, 5));
            }
            engine.startVictoryCelebration('arms_up');
            setIsVictoryVideoOpen(true);
          }
        },
      }
    );

    engineRef.current = engine;

    return () => {
      engine.destroy();
      engineRef.current = null;
    };
  }, []);

  // Keyboard controls listener (All 10 shots + settings & camera shortcuts)
  useEffect(() => {
    const keysPressed: Record<string, boolean> = {};

    const updateMovement = () => {
      if (!engineRef.current) return;
      let mx = 0;
      let mz = 0;
      let aim = 0;

      if (keysPressed['ArrowLeft'] || keysPressed['KeyA'] || keysPressed['a']) {
        mx -= 1;
        aim = -1;
      }
      if (keysPressed['ArrowRight'] || keysPressed['KeyD'] || keysPressed['d']) {
        mx += 1;
        aim = 1;
      }
      if (keysPressed['ArrowUp'] || keysPressed['KeyW'] || keysPressed['w']) {
        mz -= 1;
      }
      if (keysPressed['ArrowDown'] || keysPressed['KeyS'] || keysPressed['s']) {
        mz += 1;
      }

      engineRef.current.moveInput.x = mx;
      engineRef.current.moveInput.z = mz;
      engineRef.current.aimDirection = aim;
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // Avoid hotkeys if typing in an input
      if ((e.target as HTMLElement)?.tagName === 'INPUT') return;

      if (e.repeat) return;
      keysPressed[e.code] = true;
      keysPressed[e.key] = true;
      updateMovement();

      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        setLastShotType('flat');
        engineRef.current?.playerHit('flat');
      } else if (e.code === 'KeyJ') {
        setLastShotType('topspin');
        engineRef.current?.playerHit('topspin');
      } else if (e.code === 'KeyK') {
        setLastShotType('slice');
        engineRef.current?.playerHit('slice');
      } else if (e.code === 'KeyL') {
        setLastShotType('special');
        engineRef.current?.playerHit('special');
      } else if (e.code === 'KeyO') {
        setLastShotType('lob');
        engineRef.current?.playerHit('lob');
      } else if (e.code === 'KeyP') {
        setLastShotType('dropshot');
        engineRef.current?.playerHit('dropshot');
      } else if (e.code === 'KeyC') {
        setCameraMode((prev) => {
          const modes: ('follow' | 'broadcast' | 'action' | 'sideline')[] = [
            'follow',
            'broadcast',
            'action',
            'sideline',
          ];
          const nextIdx = (modes.indexOf(prev) + 1) % modes.length;
          const next = modes[nextIdx];
          if (engineRef.current) engineRef.current.cameraMode = next;
          return next;
        });
      } else if (e.code === 'KeyU') {
        setIsSettingsOpen((prev) => !prev);
      } else if (e.code === 'KeyI') {
        setIsStatsOpen((prev) => !prev);
      } else if (e.code === 'KeyR') {
        engineRef.current?.startInstantReplay();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed[e.code] = false;
      keysPressed[e.key] = false;
      updateMovement();
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const handleCameraChange = (mode: 'follow' | 'broadcast' | 'action' | 'sideline') => {
    setCameraMode(mode);
    if (engineRef.current) {
      engineRef.current.cameraMode = mode;
    }
  };

  const handleUpdateSettings = (newSettings: Partial<TennisPlayerSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      engineRef.current?.updatePlayerSettings(updated);
      return updated;
    });
  };

  const handleStartFromSetup = (config: LaunchConfig) => {
    setDifficulty(config.difficulty);
    setCurrentStage(config.stage);
    setCurrentCourt(config.court);
    setGameMode(config.gameMode);

    const opponent = CHARACTERS.find((c) => c.id === config.stage.opponentId) || CHARACTERS[2];
    setOppChar(opponent);

    if (engineRef.current) {
      engineRef.current.setMatchConfig(
        config.stage,
        config.court,
        config.difficulty,
        opponent,
        config.gameMode,
        config.matchLength,
        config.outfit
      );
    }
    setIsSetupOpen(false);
  };

  const handleSelectStage = (stage: StageDef) => {
    setCurrentStage(stage);
    const opponent = CHARACTERS.find((c) => c.id === stage.opponentId) || CHARACTERS[1];
    setOppChar(opponent);

    if (engineRef.current) {
      engineRef.current.setMatchConfig(stage, currentCourt, difficulty, opponent);
    }
  };

  const handleSelectPlayerChar = (char: CharacterDef) => {
    setPlayerChar(char);
    if (engineRef.current) {
      engineRef.current.setPlayerCharacter(char);
    }
  };

  const handleRestartMatch = () => {
    if (engineRef.current) {
      engineRef.current.setMatchConfig(currentStage, currentCourt, difficulty, oppChar);
    }
    setMatchVictory(null);
  };

  const handleNextStage = () => {
    const nextLevel = Math.min(currentStage.level + 1, 5);
    const nextStg = STAGES.find((s) => s.level === nextLevel) || STAGES[0];
    handleSelectStage(nextStg);
    setMatchVictory(null);
  };

  const handleHit = useCallback((shotType: ShotType) => {
    setLastShotType(shotType);
    engineRef.current?.playerHit(shotType);
  }, []);

  const handleMoveChange = useCallback((move: { x: number; z: number }) => {
    if (engineRef.current) {
      engineRef.current.moveInput.x = move.x;
      engineRef.current.moveInput.z = move.z;
    }
  }, []);

  const handleAimChange = useCallback((aim: number) => {
    if (engineRef.current) {
      engineRef.current.aimDirection = aim;
    }
  }, []);

  const handleOpenVictoryVideo = () => {
    setIsVictoryVideoOpen(true);
    engineRef.current?.startVictoryCelebration(celebrationPose);
    engineRef.current?.setCelebrationAngle(celebrationAngle);
  };

  const handleSelectCelebrationPose = (
    pose: 'arms_up' | 'fist_pump' | 'racket_raise' | 'wave' | 'trophy'
  ) => {
    setCelebrationPose(pose);
    engineRef.current?.setCelebrationPose(pose);
  };

  const handleSelectCelebrationAngle = (angle: 'orbit' | 'closeup' | 'crane' | 'hero') => {
    setCelebrationAngle(angle);
    engineRef.current?.setCelebrationAngle(angle);
  };

  const handleCloseVictoryVideo = () => {
    setIsVictoryVideoOpen(false);
    engineRef.current?.stopVictoryCelebration();
  };

  const isAr = lang === 'ar';

  return (
    <div
      dir={isAr ? 'rtl' : 'ltr'}
      className="relative w-screen h-screen overflow-hidden bg-slate-950 font-sans select-none"
      style={{ fontFamily: isAr ? "'Cairo', sans-serif" : "system-ui, sans-serif" }}
    >
      {/* 1. Isolated WebGL 3D Canvas Mount */}
      <div ref={mountRef} className="absolute inset-0 w-full h-full" />

      {/* 2. Manga Speedlines Overlay for intense rallies */}
      <MangaSpeedLines isActive={score.status === 'rally'} />

      {/* 3. Anime Cut-In Screen for Super Smashes */}
      <AnimeCutIn
        activeChar={cutInState.char}
        moveNameAr={cutInState.moveName}
        kanji={cutInState.kanji}
        onComplete={() => setCutInState({ char: null, moveName: '', kanji: '' })}
      />

      {/* 4. Top Broadcast Scoreboard with Radar Speed & Potato Fans */}
      <ScoreBoard
        score={score}
        playerChar={playerChar}
        oppChar={oppChar}
        playerStats={playerStats}
        oppStats={oppStats}
        stage={currentStage}
        difficulty={difficulty}
        lang={lang}
        gameMode={gameMode}
      />

      {/* 5. Mobile & Touch Screen On-Screen Controls */}
      <TouchControls
        onMoveChange={handleMoveChange}
        onAimChange={handleAimChange}
        onHit={handleHit}
        isSuperReady={playerStats.superGauge >= 100}
        status={score.status}
        serveState={serveState}
        stamina={playerStats.stamina}
        lastShotType={lastShotType}
        lang={lang}
      />

      {/* 6. Unified Collapsible Bottom Dock */}
      <BottomDock
        cameraMode={cameraMode}
        onCameraChange={handleCameraChange}
        onOpenStages={() => setIsSetupOpen(true)}
        onOpenCharacters={() => setIsStageModalOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenStats={() => setIsStatsOpen(true)}
        onRestartMatch={handleRestartMatch}
        lang={lang}
        onToggleLang={() => setLang(lang === 'ar' ? 'en' : 'ar')}
        onToggleHelp={() => setIsHelpModalOpen(true)}
        onOpenVictoryVideo={handleOpenVictoryVideo}
      />

      {/* 7. Setup / Loading Screen (Easy/Normal/Hard/Impossible -> Stage -> Court -> Start) */}
      {isSetupOpen && (
        <SetupScreen
          onStartGame={handleStartFromSetup}
          lang={lang}
          onToggleLang={() => setLang(lang === 'ar' ? 'en' : 'ar')}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenHelp={() => setIsHelpModalOpen(true)}
        />
      )}

      {/* 8. Full Professional Physics & Player Sliders Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
        lang={lang}
      />

      {/* 9. Official Match Statistics & Instant Replay Modal */}
      <MatchStatsModal
        isOpen={isStatsOpen}
        onClose={() => setIsStatsOpen(false)}
        stats={matchStats}
        score={score}
        playerChar={playerChar}
        oppChar={oppChar}
        onStartReplay={() => engineRef.current?.startInstantReplay()}
        lang={lang}
      />

      {/* 10. Tournament Stage & Character Selection Modal */}
      <StageModal
        isOpen={isStageModalOpen}
        onClose={() => setIsStageModalOpen(false)}
        currentStage={currentStage}
        onSelectStage={handleSelectStage}
        selectedPlayerChar={playerChar}
        onSelectPlayerChar={handleSelectPlayerChar}
        unlockedLevel={unlockedLevel}
        lang={lang}
      />

      {/* 11. Help & Controls Guide Modal */}
      <HelpModal
        isOpen={isHelpModalOpen}
        onClose={() => setIsHelpModalOpen(false)}
        lang={lang}
      />

      {/* 12. Grand Slam Championship Victory Video Modal */}
      <VictoryVideoModal
        isOpen={isVictoryVideoOpen}
        onClose={handleCloseVictoryVideo}
        lang={lang}
        onSelectPose={handleSelectCelebrationPose}
        onSelectAngle={handleSelectCelebrationAngle}
        currentPose={celebrationPose}
        currentAngle={celebrationAngle}
        stageName={isAr ? currentStage.nameAr : currentStage.nameEn}
      />

      {/* 13. Match Victory / Defeat Modal */}
      {matchVictory?.show && !isVictoryVideoOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md">
          <div className="relative w-full max-w-md p-6 bg-slate-900 border-2 border-amber-400 rounded-3xl shadow-2xl text-center">
            {matchVictory.winner === 'player' ? (
              <>
                <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-tr from-amber-500 to-yellow-300 flex items-center justify-center shadow-2xl text-slate-950 mb-4 animate-bounce">
                  <Trophy className="w-10 h-10" />
                </div>
                <div className="text-3xl mb-1">🥔🎉</div>
                <h3 className="text-2xl font-black text-amber-300">
                  {isAr ? 'انتصار ساحق! 🎾🔥' : 'MATCH VICTORY! 🎾🔥'}
                </h3>
                <p className="text-xs text-slate-300 mt-2">
                  {isAr
                    ? `جمهور البطاطس والمدرجات تصرخ وتهتف باسمك! لقد حققت نقطة الفوز الخرافية وتأهلت للمرحلة التالية!`
                    : `The crowd goes wild! You hit the winning shot and qualified for the next stage!`}
                </p>

                {/* Watch Victory Video Button */}
                <div className="mt-4">
                  <button
                    onClick={handleOpenVictoryVideo}
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-slate-950 font-black text-xs md:text-sm shadow-[0_0_25px_rgba(245,158,11,0.4)] hover:brightness-110 active:scale-95 transition-all cursor-pointer animate-pulse"
                  >
                    <Video className="w-4 h-4" />
                    <span>
                      {isAr ? '🏆 شاهد فيديو التتويج وهتاف الجماهير الصاخب' : '🏆 Watch Victory Cinema & Roaring Crowd'}
                    </span>
                  </button>
                </div>
                <div className="mt-6 flex items-center justify-center gap-3">
                  <button
                    onClick={handleRestartMatch}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>{isAr ? 'إعادة اللعب' : 'Replay'}</span>
                  </button>
                  {currentStage.level < 5 ? (
                    <button
                      onClick={handleNextStage}
                      className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-black text-xs shadow-xl transition-all active:scale-95 cursor-pointer"
                    >
                      <span>{isAr ? 'المرحلة التالية' : 'Next Stage'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <div className="text-amber-400 font-black text-sm">
                      {isAr ? '🏆 بطل مسابقة التنس العالمي!' : '🏆 World Tennis Grand Champion!'}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <div className="w-20 h-20 mx-auto rounded-3xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 mb-4">
                  <RotateCcw className="w-10 h-10" />
                </div>
                <h3 className="text-2xl font-black text-rose-400">
                  {isAr ? 'خسارة الشوط!' : 'DEFEAT!'}
                </h3>
                <p className="text-xs text-slate-300 mt-2">
                  {isAr
                    ? 'الخصم أظهر مهارات خارقة! اضبط توقيت ضرباتك أو غيّر مستوى الصعوبة وحاول مجدداً.'
                    : 'The opponent landed fierce shots! Adjust your timing and try again.'}
                </p>
                <div className="mt-6 flex items-center justify-center gap-3">
                  <button
                    onClick={() => {
                      setMatchVictory(null);
                      setIsSetupOpen(true);
                    }}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all cursor-pointer"
                  >
                    <Settings className="w-4 h-4" />
                    <span>{isAr ? 'تغيير الإعدادات' : 'Setup'}</span>
                  </button>
                  <button
                    onClick={handleRestartMatch}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs shadow-xl transition-all active:scale-95 cursor-pointer"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    <span>{isAr ? 'محاولة جديدة' : 'Try Again'}</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
