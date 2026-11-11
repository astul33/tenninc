export type CourtTheme = 'sakura' | 'cyberpunk' | 'volcano' | 'celestial';

export type DifficultyLevel = 'easy' | 'normal' | 'hard' | 'impossible';

export interface DifficultyConfig {
  id: DifficultyLevel;
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  descriptionEn: string;
  badgeColor: string;
  aiReactionDelay: number;
  aiAccuracy: number;
  ballSpeedMultiplier: number;
  serveSpeedKmH: number;
}

export type ShotType =
  | 'forehand'
  | 'backhand'
  | 'topspin'
  | 'slice'
  | 'flat'
  | 'lob'
  | 'dropshot'
  | 'smash'
  | 'volley'
  | 'serve'
  | 'special';

export interface TennisPlayerSettings {
  runningSpeed: number; // 0 - 100
  shotPower: number;    // 0 - 100
  accuracy: number;     // 0 - 100
  swingSpeed: number;   // 0 - 100
  spin: number;         // 0 - 100
  agility: number;      // 0 - 100
  maxStamina: number;   // 0 - 100
  aiDifficulty: number; // 0 - 100
}

export const DEFAULT_PLAYER_SETTINGS: TennisPlayerSettings = {
  runningSpeed: 65,
  shotPower: 70,
  accuracy: 80,
  swingSpeed: 75,
  spin: 70,
  agility: 75,
  maxStamina: 100,
  aiDifficulty: 60,
};

export interface CharacterDef {
  id: string;
  nameAr: string;
  nameEn: string;
  titleAr: string;
  titleEn: string;
  specialMoveAr: string;
  specialMoveEn: string;
  specialKanji: string;
  avatarColor: string;
  jerseyColor: number;
  secondaryColor: number;
  hairColor: number;
  hairStyle: 'spiky' | 'twin_tails' | 'flowing' | 'headband';
  gender?: 'male' | 'female';
  speed: number;       // 1 - 5
  power: number;       // 1 - 5
  spin: number;        // 1 - 5
  stamina: number;     // 1 - 5
  specialType: 'lightning' | 'cherry' | 'fire' | 'phantom' | 'iron';
}

export interface StageDef {
  level: number;
  nameAr: string;
  nameEn: string;
  opponentId: string;
  defaultTheme: CourtTheme;
  difficultyLabelAr: string;
  difficultyLabelEn: string;
  aiReactionTime: number;
  aiAccuracy: number;
  aiPower: number;
  pointsToWin: number;
  descriptionAr: string;
  descriptionEn: string;
}

export interface BallState {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  spinX: number; // topspin (>0) or backspin (<0)
  spinY: number; // sidespin curve
  spinZ: number;
  active: boolean;
  bounces: number;
  lastHitter: 'player' | 'opponent' | null;
  hasBouncedOnPlayerSide: boolean;
  hasBouncedOnOpponentSide: boolean;
  isSpecialActive: boolean;
  specialType?: 'lightning' | 'cherry' | 'fire' | 'phantom' | 'iron';
  flameTrail: boolean;
  sparkCount: number;
  speedKmH: number;
  isServe: boolean;
  serveAttempt: 1 | 2;
}

export interface PlayerStats {
  points: number;
  games: number;
  sets: number;
  superGauge: number;
  stamina: number; // 0 - 100
}

export interface MatchStats {
  aces: { player: number; opponent: number };
  doubleFaults: { player: number; opponent: number };
  firstServesIn: { player: number; opponent: number };
  firstServesTotal: { player: number; opponent: number };
  winners: { player: number; opponent: number };
  unforcedErrors: { player: number; opponent: number };
  maxServeSpeedKmH: { player: number; opponent: number };
  totalPointsWon: { player: number; opponent: number };
  longestRally: number;
  currentRally: number;
}

export type MatchStatus =
  | 'idle'
  | 'serving'
  | 'tossing'
  | 'rally'
  | 'point_scored'
  | 'game_over'
  | 'paused'
  | 'replaying';

export interface ServeState {
  phase: 'idle' | 'tossing' | 'ready_to_hit' | 'struck' | 'fault';
  tossTimer: number;
  tossApexY: number;
  timingScore: number; // 0 to 1.0 (sweet spot)
  attempt: 1 | 2;
  power: number;
  directionX: number;
  spinType: 'flat' | 'slice' | 'kick';
}

export interface MatchScore {
  playerPoints: number; // 0, 15, 30, 40
  opponentPoints: number;
  playerGames: number;
  opponentGames: number;
  playerSets: number;
  opponentSets: number;
  server: 'player' | 'opponent';
  status: MatchStatus;
  statusMessageAr: string;
  statusMessageEn: string;
  pointWinner?: 'player' | 'opponent';
  winner?: 'player' | 'opponent';
  isDeuce: boolean;
  isAdvantage: 'player' | 'opponent' | null;
  isTiebreak: boolean;
  playerTiebreakPoints: number;
  opponentTiebreakPoints: number;
  lastShotSpeedKmH: number;
  serveAttempt: 1 | 2;
}

export interface ReplayFrame {
  ballX: number;
  ballY: number;
  ballZ: number;
  playerX: number;
  playerZ: number;
  playerAnim: string;
  oppX: number;
  oppZ: number;
  oppAnim: string;
}

export type GameMode = 'practice' | 'vs_robot';
export type MatchLength = 1 | 2 | 6; // 1 Game Quick, Best of 3 (first to 2), Full Set (first to 6)

export interface PlayerOutfit {
  id: string;
  nameAr: string;
  nameEn: string;
  jerseyColor: number;
  secondaryColor: number;
  badge: string;
}

export const PLAYER_OUTFITS: PlayerOutfit[] = [
  {
    id: 'classic_white',
    nameAr: 'الأبيض الملكي (Classic White)',
    nameEn: 'Classic Tour White',
    jerseyColor: 0xf8fafc,
    secondaryColor: 0x1e293b,
    badge: '⚪',
  },
  {
    id: 'grand_navy',
    nameAr: 'الأزرق البحري (Grand Slam Navy)',
    nameEn: 'Grand Slam Navy',
    jerseyColor: 0x1e3a8a,
    secondaryColor: 0x38bdf8,
    badge: '🔵',
  },
  {
    id: 'sunset_crimson',
    nameAr: 'القرمزي الناري (Sunset Crimson)',
    nameEn: 'Sunset Crimson',
    jerseyColor: 0xb91c1c,
    secondaryColor: 0xf59e0b,
    badge: '🔴',
  },
  {
    id: 'cyber_emerald',
    nameAr: 'الزمردي النيوني (Cyber Emerald)',
    nameEn: 'Cyber Emerald',
    jerseyColor: 0x064e3b,
    secondaryColor: 0x10b981,
    badge: '🟢',
  },
];
