import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import {
  BallState,
  CharacterDef,
  CourtTheme,
  DEFAULT_PLAYER_SETTINGS,
  DifficultyLevel,
  GameMode,
  MatchLength,
  MatchScore,
  MatchStats,
  PlayerOutfit,
  PlayerStats,
  ReplayFrame,
  ServeState,
  ShotType,
  StageDef,
  TennisPlayerSettings,
} from '../types/tennis';
import {
  tennisPhysics,
  COURT_HALF_LENGTH,
  COURT_HALF_WIDTH,
  VISUAL_BALL_RADIUS,
} from './physics';
import { AnimeCharacter } from './characterModel';
import { CourtBuilder } from './courtBuilder';
import { soundManager } from '../audio/soundManager';
import { DIFFICULTIES } from './stagesData';

const _camTarget = new THREE.Vector3();

export const isSoftwareGl = (() => {
  const gl = document.createElement('canvas').getContext('webgl2');
  if (!gl) return true;
  const ext = gl.getExtension('WEBGL_debug_renderer_info');
  const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
  const gpu = String(gl.getParameter(param));
  gl.getExtension('WEBGL_lose_context')?.loseContext();
  return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
})();

function createTennisBallTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;

  // Official optic yellow tennis ball felt (high contrast)
  ctx.fillStyle = '#ccff00';
  ctx.fillRect(0, 0, 256, 128);

  // Micro felt texture stippling
  ctx.fillStyle = 'rgba(175, 220, 0, 0.4)';
  for (let i = 0; i < 300; i++) {
    const rx = Math.random() * 256;
    const ry = Math.random() * 128;
    ctx.fillRect(rx, ry, 2, 2);
  }

  // Dark seam trench shadow outline for depth
  ctx.strokeStyle = 'rgba(90, 125, 0, 0.7)';
  ctx.lineWidth = 10;
  ctx.beginPath();
  ctx.arc(64, 64, 45, 0.4, Math.PI - 0.4);
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(192, 64, 45, Math.PI + 0.4, -0.4);
  ctx.stroke();

  // Crisp white inner seam
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.arc(64, 64, 45, 0.4, Math.PI - 0.4);
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(192, 64, 45, Math.PI + 0.4, -0.4);
  ctx.stroke();

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export interface EngineCallbacks {
  onScoreUpdate: (score: MatchScore) => void;
  onStatsUpdate: (playerStats: PlayerStats, oppStats: PlayerStats) => void;
  onMatchStatsUpdate: (matchStats: MatchStats) => void;
  onServeStateUpdate: (serveState: ServeState) => void;
  onSpecialCutIn: (char: CharacterDef, moveNameAr: string, kanji: string) => void;
  onMatchEnd: (winner: 'player' | 'opponent', stage: StageDef) => void;
}

export class TennisEngine {
  private container: HTMLElement;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private clock: THREE.Clock;
  private frameId: number = 0;
  private isDestroyed: boolean = false;

  public courtBuilder: CourtBuilder;
  private playerModel: AnimeCharacter;
  private opponentModel: AnimeCharacter;
  private ballMesh: THREE.Mesh;
  private ballShadow: THREE.Mesh;
  private ballTrailPoints: THREE.Points;
  private ballTrailPositions: Float32Array;
  private landingMarker: THREE.Mesh;
  public isCelebrating: boolean = false;
  public celebrationPose: 'arms_up' | 'fist_pump' | 'racket_raise' | 'wave' | 'trophy' = 'arms_up';
  public celebrationAngle: 'orbit' | 'closeup' | 'crane' | 'hero' = 'orbit';
  public celebrationTime: number = 0;
  private confettiGroup: THREE.Group | null = null;
  private confettiParticles: { mesh: THREE.Mesh; rotSpeed: THREE.Vector3; vy: number; vx: number }[] = [];
  private flashLight: THREE.PointLight | null = null;
  private flashTimer: number = 0;

  public currentStage: StageDef;
  public currentTheme: CourtTheme;
  public difficulty: DifficultyLevel;
  public playerChar: CharacterDef;
  public opponentChar: CharacterDef;
  public callbacks: EngineCallbacks;

  // Fully adjustable player settings connected directly to gameplay physics
  public settings: TennisPlayerSettings = { ...DEFAULT_PLAYER_SETTINGS };

  // Game Mode & Match Length
  public gameMode: GameMode = 'vs_robot';
  public matchLength: MatchLength = 1;
  public practiceRallies: number = 0;
  public practiceShots: number = 0;

  // Ball State
  public ball: BallState = {
    x: 0,
    y: 1.0,
    z: 10.5,
    vx: 0,
    vy: 0,
    vz: 0,
    spinX: 0,
    spinY: 0,
    spinZ: 0,
    active: false,
    bounces: 0,
    lastHitter: null,
    hasBouncedOnPlayerSide: false,
    hasBouncedOnOpponentSide: false,
    isSpecialActive: false,
    flameTrail: false,
    sparkCount: 0,
    speedKmH: 0,
    isServe: false,
    serveAttempt: 1,
  };

  // Official Pro Tennis Match Score
  public score: MatchScore = {
    playerPoints: 0,
    opponentPoints: 0,
    playerGames: 0,
    opponentGames: 0,
    playerSets: 0,
    opponentSets: 0,
    server: 'player',
    status: 'serving',
    statusMessageAr: 'استعد للإرسال الأول! (اضغط مسافة لرفع الكرة)',
    statusMessageEn: '1st Serve! (Press Space to toss ball)',
    isDeuce: false,
    isAdvantage: null,
    isTiebreak: false,
    playerTiebreakPoints: 0,
    opponentTiebreakPoints: 0,
    lastShotSpeedKmH: 120,
    serveAttempt: 1,
  };

  // Advanced Serve Mechanics
  public serveState: ServeState = {
    phase: 'idle',
    tossTimer: 0,
    tossApexY: 2.8,
    timingScore: 1.0,
    attempt: 1,
    power: 75,
    directionX: 0,
    spinType: 'flat',
  };

  // Match Statistics
  public matchStats: MatchStats = {
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
  };

  public playerStats: PlayerStats = {
    points: 0,
    games: 0,
    sets: 0,
    superGauge: 30,
    stamina: 100,
  };

  public oppStats: PlayerStats = {
    points: 0,
    games: 0,
    sets: 0,
    superGauge: 20,
    stamina: 100,
  };

  // Movement & Input
  public moveInput = { x: 0, z: 0 };
  public aimDirection: number = 0; // -1 (left crosscourt), 0 (center), +1 (right)
  public cameraMode: 'follow' | 'broadcast' | 'action' | 'sideline' = 'follow';

  public playerPos = { x: 0, z: 11.2 };
  public oppPos = { x: 0, z: -11.2 };

  // AI Opponent Strategy
  private aiDecisionTimer: number = 0;
  private aiTargetX: number = 0;
  private aiTargetZ: number = -11.2;
  private aiShotChoice: ShotType = 'forehand';
  private cameraShake: number = 0;

  // Replay System
  private replayBuffer: ReplayFrame[] = [];
  public isReplaying: boolean = false;
  private replayIndex: number = 0;

  constructor(
    container: HTMLElement,
    stage: StageDef,
    courtTheme: CourtTheme,
    difficulty: DifficultyLevel,
    playerChar: CharacterDef,
    opponentChar: CharacterDef,
    callbacks: EngineCallbacks
  ) {
    this.container = container;
    this.currentStage = stage;
    this.currentTheme = courtTheme;
    this.difficulty = difficulty;
    this.playerChar = playerChar;
    this.opponentChar = opponentChar;
    this.callbacks = callbacks;
    this.clock = new THREE.Clock();

    // 1. Scene & Environment
    this.scene = new THREE.Scene();
    this.updateSceneFog();

    // 2. Camera Setup
    const aspect = container.clientWidth / container.clientHeight;
    this.camera = new THREE.PerspectiveCamera(50, aspect, 0.1, 200);
    this.camera.position.set(0, 6.2, 17.5);
    this.camera.lookAt(0, 1.2, 0);

    // 3. Renderer with PBR Tonemapping
    this.renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = !isSoftwareGl;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(this.renderer.domElement);

    // 4. Procedural Studio Reflection Map
    const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // 5. Pro Stadium 3-Point Lighting
    const keyLight = new THREE.DirectionalLight(0xfff5e6, 2.3);
    keyLight.position.set(14, 25, 16);
    if (!isSoftwareGl) {
      keyLight.castShadow = true;
      keyLight.shadow.mapSize.width = 1024;
      keyLight.shadow.mapSize.height = 1024;
      keyLight.shadow.camera.near = 1;
      keyLight.shadow.camera.far = 60;
      keyLight.shadow.camera.left = -16;
      keyLight.shadow.camera.right = 16;
      keyLight.shadow.camera.top = 22;
      keyLight.shadow.camera.bottom = -22;
      keyLight.shadow.bias = -0.0005;
      keyLight.shadow.normalBias = 0.02;
    }
    this.scene.add(keyLight);

    const fillLight = new THREE.HemisphereLight(0x93c5fd, 0x1e293b, 1.3);
    this.scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0x38bdf8, 0.85);
    rimLight.position.set(-15, 10, -20);
    this.scene.add(rimLight);

    // 6. 3D Court & Potato Fans
    this.courtBuilder = new CourtBuilder(this.currentTheme);
    this.scene.add(this.courtBuilder.courtGroup);

    // 7. Characters
    this.playerModel = new AnimeCharacter(this.playerChar);
    this.playerModel.group.position.set(this.playerPos.x, 0, this.playerPos.z);
    this.playerModel.group.rotation.y = Math.PI;
    this.scene.add(this.playerModel.group);

    this.opponentModel = new AnimeCharacter(this.opponentChar);
    this.opponentModel.group.position.set(this.oppPos.x, 0, this.oppPos.z);
    this.opponentModel.group.rotation.y = 0;
    this.scene.add(this.opponentModel.group);

    // 8. Ball, Dynamic Shadow, and Landing Marker
    const ballGeo = new THREE.SphereGeometry(VISUAL_BALL_RADIUS, 20, 20);
    const ballTex = createTennisBallTexture();
    const ballMat = new THREE.MeshStandardMaterial({
      map: ballTex,
      roughness: 0.45,
      metalness: 0.0,
      emissive: new THREE.Color(0x384a00),
      emissiveIntensity: 0.28, // Bright against dark court
    });
    this.ballMesh = new THREE.Mesh(ballGeo, ballMat);
    this.ballMesh.castShadow = true;
    this.scene.add(this.ballMesh);

    const bShadowGeo = new THREE.CircleGeometry(0.3, 16);
    const bShadowMat = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.7,
      depthWrite: false,
    });
    this.ballShadow = new THREE.Mesh(bShadowGeo, bShadowMat);
    this.ballShadow.rotation.x = -Math.PI / 2;
    this.ballShadow.position.y = 0.015;
    this.scene.add(this.ballShadow);

    // Dynamic Ball Landing Prediction Marker (glow ring)
    const markerGeo = new THREE.RingGeometry(0.24, 0.38, 20);
    const markerMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.0,
      side: THREE.DoubleSide,
    });
    this.landingMarker = new THREE.Mesh(markerGeo, markerMat);
    this.landingMarker.rotation.x = -Math.PI / 2;
    this.landingMarker.position.y = 0.02;
    this.scene.add(this.landingMarker);

    // Ball Aerodynamic Trail Particles
    const trailCount = 35;
    this.ballTrailPositions = new Float32Array(trailCount * 3);
    const trailGeo = new THREE.BufferGeometry();
    trailGeo.setAttribute('position', new THREE.BufferAttribute(this.ballTrailPositions, 3));
    const trailMat = new THREE.PointsMaterial({
      color: 0x38bdf8,
      size: 0.22,
      transparent: true,
      opacity: 0.7,
    });
    this.ballTrailPoints = new THREE.Points(trailGeo, trailMat);
    this.scene.add(this.ballTrailPoints);

    // 9. Grand Slam Championship Victory Confetti & Flashbulbs
    this.confettiGroup = new THREE.Group();
    this.confettiGroup.visible = false;
    this.scene.add(this.confettiGroup);

    const confettiColors = [0xffd700, 0x38bdf8, 0xef4444, 0x10b981, 0xa855f7, 0xf59e0b, 0xffffff];
    for (let i = 0; i < 260; i++) {
      const flakeGeo = new THREE.PlaneGeometry(0.12, 0.18);
      const color = confettiColors[i % confettiColors.length];
      const flakeMat = new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide });
      const flake = new THREE.Mesh(flakeGeo, flakeMat);
      flake.position.set(
        (Math.random() - 0.5) * 18,
        1 + Math.random() * 12,
        (Math.random() - 0.5) * 22
      );
      this.confettiGroup.add(flake);
      this.confettiParticles.push({
        mesh: flake,
        rotSpeed: new THREE.Vector3((Math.random() - 0.5) * 6, (Math.random() - 0.5) * 6, (Math.random() - 0.5) * 6),
        vy: -(1.5 + Math.random() * 2.5),
        vx: (Math.random() - 0.5) * 0.8,
      });
    }

    this.flashLight = new THREE.PointLight(0xffffff, 0, 45);
    this.flashLight.position.set(0, 8, 5);
    this.scene.add(this.flashLight);

    // Initial positioning
    this.resetForServe();

    window.addEventListener('resize', this.onWindowResize);
    this.tick();
  }

  private updateSceneFog() {
    let fogColor = 0x0f172a;
    if (this.currentTheme === 'sakura') fogColor = 0x1e1b4b;
    if (this.currentTheme === 'cyberpunk') fogColor = 0x030712;
    if (this.currentTheme === 'volcano') fogColor = 0x1c1917;
    if (this.currentTheme === 'celestial') fogColor = 0x17122c;
    this.scene.background = new THREE.Color(fogColor);
    this.scene.fog = new THREE.FogExp2(fogColor, 0.015);
  }

  public updatePlayerSettings(newSettings: Partial<TennisPlayerSettings>) {
    this.settings = { ...this.settings, ...newSettings };
    // Connect settings directly to physics & animations
    this.playerModel.swingSpeedMultiplier = 0.7 + (this.settings.swingSpeed / 100) * 0.7;
  }

  public setMatchConfig(
    stage: StageDef,
    courtTheme: CourtTheme,
    difficulty: DifficultyLevel,
    opponentChar: CharacterDef,
    gameMode: GameMode = 'vs_robot',
    matchLength: MatchLength = 1,
    outfit?: PlayerOutfit
  ) {
    this.currentStage = stage;
    this.currentTheme = courtTheme;
    this.difficulty = difficulty;
    this.opponentChar = opponentChar;
    this.gameMode = gameMode;
    this.matchLength = matchLength;
    this.practiceRallies = 0;
    this.practiceShots = 0;

    if (outfit) {
      this.playerChar.jerseyColor = outfit.jerseyColor;
      this.playerChar.secondaryColor = outfit.secondaryColor;
      this.setPlayerCharacter(this.playerChar);
    }

    this.scene.remove(this.courtBuilder.courtGroup);
    this.courtBuilder = new CourtBuilder(this.currentTheme);
    this.scene.add(this.courtBuilder.courtGroup);
    this.updateSceneFog();

    this.scene.remove(this.opponentModel.group);
    this.opponentModel = new AnimeCharacter(this.opponentChar);
    this.opponentModel.group.position.set(this.oppPos.x, 0, this.oppPos.z);
    this.opponentModel.group.rotation.y = 0;
    this.opponentModel.group.visible = gameMode === 'vs_robot';
    this.scene.add(this.opponentModel.group);

    this.score.playerPoints = 0;
    this.score.opponentPoints = 0;
    this.score.playerGames = 0;
    this.score.opponentGames = 0;
    this.score.playerSets = 0;
    this.score.opponentSets = 0;
    this.score.status = 'serving';
    this.score.server = 'player';
    this.score.serveAttempt = 1;

    if (gameMode === 'practice') {
      this.score.statusMessageAr = 'وضع التدريب الفردي الحر • اضرب الكرة أو أرسل بحرية!';
      this.score.statusMessageEn = 'Solo Practice Mode • Free hitting & rally practice!';
    }
    this.resetForServe();
  }

  public setPlayerCharacter(char: CharacterDef) {
    this.playerChar = char;
    this.scene.remove(this.playerModel.group);
    this.playerModel = new AnimeCharacter(this.playerChar);
    this.playerModel.group.position.set(this.playerPos.x, 0, this.playerPos.z);
    this.playerModel.group.rotation.y = Math.PI;
    this.scene.add(this.playerModel.group);
  }

  public resetForServe() {
    this.ball.active = false;
    this.ball.bounces = 0;
    this.ball.lastHitter = null;
    this.ball.isSpecialActive = false;
    this.ball.hasBouncedOnPlayerSide = false;
    this.ball.hasBouncedOnOpponentSide = false;
    this.ball.speedKmH = 0;

    // Service court side: Deuce (Right side) when sum of points is even, Ad (Left side) when odd
    const totalPoints = this.score.isTiebreak
      ? this.score.playerTiebreakPoints + this.score.opponentTiebreakPoints
      : this.score.playerPoints + this.score.opponentPoints;
    const isRightSide = totalPoints % 2 === 0;
    const serveX = isRightSide ? 2.4 : -2.4;

    this.serveState.phase = 'idle';
    this.serveState.tossTimer = 0;

    if (this.score.server === 'player') {
      this.playerPos.x = serveX;
      this.playerPos.z = COURT_HALF_LENGTH;
      this.oppPos.x = -serveX * 0.85;
      this.oppPos.z = -COURT_HALF_LENGTH - 0.5;

      this.ball.x = this.playerPos.x + 0.35;
      this.ball.y = 1.15;
      this.ball.z = this.playerPos.z - 0.4;
      this.ball.vx = 0;
      this.ball.vy = 0;
      this.ball.vz = 0;

      this.score.status = 'serving';
      const attemptStr = this.score.serveAttempt === 1 ? 'الأول' : 'الثاني';
      this.score.statusMessageAr = `إرسالك ${attemptStr}! (اضغط مسافة للرمي ثم اضغط للتسديد في القمة)`;
      this.score.statusMessageEn = `Your ${this.score.serveAttempt === 1 ? '1st' : '2nd'} Serve! (Press Space to toss & strike at apex)`;
    } else {
      this.oppPos.x = -serveX;
      this.oppPos.z = -COURT_HALF_LENGTH;
      this.playerPos.x = serveX * 0.85;
      this.playerPos.z = COURT_HALF_LENGTH + 0.5;

      this.ball.x = this.oppPos.x - 0.35;
      this.ball.y = 1.15;
      this.ball.z = this.oppPos.z + 0.4;
      this.ball.vx = 0;
      this.ball.vy = 0;
      this.ball.vz = 0;

      this.score.status = 'serving';
      this.score.statusMessageAr = 'استعد لرد إرسال الخصم!';
      this.score.statusMessageEn = 'Prepare to return opponent serve!';

      // Realistic AI decision delay before service toss
      const diffConf = DIFFICULTIES[this.difficulty];
      this.aiDecisionTimer = Math.max(0.7, diffConf.aiReactionDelay * 2.5);
    }

    this.callbacks.onScoreUpdate({ ...this.score });
    this.callbacks.onServeStateUpdate({ ...this.serveState });
  }

  /**
   * Advanced Serving Mechanic:
   * 1st press -> Tosses ball vertically up into the air.
   * 2nd press -> Strikes ball at current toss height (sweet spot at apex ~2.8m).
   */
  public handleServeAction() {
    if (this.score.status !== 'serving' || this.score.server !== 'player') return;

    if (this.serveState.phase === 'idle') {
      // Begin ball toss
      this.serveState.phase = 'tossing';
      this.serveState.tossTimer = 0;
      this.playerModel.triggerServeToss();
      soundManager.playToss();
      this.callbacks.onServeStateUpdate({ ...this.serveState });
      return;
    }

    if (this.serveState.phase === 'tossing') {
      // Execute serve strike
      this.executePlayerServe();
    }
  }

  private executePlayerServe() {
    this.serveState.phase = 'struck';
    this.playerModel.triggerStroke('serve', this.settings.swingSpeed);

    // Calculate timing score: apex is at t ~ 0.5s (height ~ 2.8m)
    const apexDiff = Math.abs(this.serveState.tossTimer - 0.52);
    // 0 diff = 1.0 (sweet spot), 0.35 diff = 0.3 (terrible mishit)
    const timingScore = Math.max(0.2, 1.0 - apexDiff * 2.4);
    this.serveState.timingScore = timingScore;

    // Target legal diagonal service box
    const isRightSide = (this.score.playerPoints + this.score.opponentPoints) % 2 === 0;
    const baseTargetX = isRightSide ? -2.0 : 2.0;
    const targetX = baseTargetX + this.aimDirection * 1.5;
    const targetZ = -4.5;

    // 1st serve = high power flat serve, 2nd serve = higher kick/slice spin
    const shotType: ShotType = this.score.serveAttempt === 1 ? 'flat' : 'topspin';

    tennisPhysics.executeShot(this.ball, {
      hitter: 'player',
      targetX,
      targetZ,
      shotType,
      settings: this.settings,
      sweetSpotRatio: timingScore,
      isServe: true,
      serveAttempt: this.score.serveAttempt,
    });

    // Update match stats
    if (this.score.serveAttempt === 1) {
      this.matchStats.firstServesTotal.player++;
    }
    const serveKmh = this.ball.speedKmH;
    if (serveKmh > this.matchStats.maxServeSpeedKmH.player) {
      this.matchStats.maxServeSpeedKmH.player = serveKmh;
    }
    this.score.lastShotSpeedKmH = serveKmh;

    soundManager.playHit('serve', this.settings.shotPower / 100, timingScore);

    this.score.status = 'rally';
    this.callbacks.onScoreUpdate({ ...this.score });
    this.callbacks.onServeStateUpdate({ ...this.serveState });
    this.callbacks.onMatchStatsUpdate({ ...this.matchStats });
  }

  /**
   * Player stroke execution during active rally:
   * Supports Forehand, Backhand, Topspin, Slice, Flat, Lob, Dropshot, Smash, Volley, Special.
   */
  public playerHit(shotType: ShotType) {
    if (this.score.status === 'game_over') return;

    // If serving, route to serving mechanic
    if (this.score.status === 'serving' && this.score.server === 'player') {
      this.handleServeAction();
      return;
    }

    if (this.score.status !== 'rally' || !this.ball.active) return;

    // Check distance between player and ball
    const distToBall = Math.hypot(this.playerPos.x - this.ball.x, this.playerPos.z - this.ball.z);
    const heightCheck = this.ball.y >= 0.2 && this.ball.y <= 3.2;

    if (distToBall <= 2.6 && heightCheck && this.ball.lastHitter !== 'player') {
      // Determine stroke category: Volley (if before bounce and near net), Smash (if high), or groundstroke
      const isVolley = this.ball.bounces === 0 && this.playerPos.z < 6.5;
      const isOverhead = this.ball.y >= 1.7;
      const isForehand = this.ball.x >= this.playerPos.x;

      let actualShot = shotType;
      if (isVolley && shotType === 'flat') {
        actualShot = 'volley';
      } else if (isOverhead && (shotType === 'flat' || shotType === 'smash')) {
        actualShot = 'smash';
      } else if (shotType === 'flat') {
        actualShot = isForehand ? 'forehand' : 'backhand';
      }

      // Check special anime smash
      if (actualShot === 'special') {
        if (this.playerStats.superGauge < 100) {
          actualShot = 'topspin';
        } else {
          this.playerStats.superGauge = 0;
          this.callbacks.onStatsUpdate(this.playerStats, this.oppStats);
          this.callbacks.onSpecialCutIn(
            this.playerChar,
            this.playerChar.specialMoveAr,
            this.playerChar.specialKanji
          );
          soundManager.playCharge();
          this.playerModel.setAuraVisible(true);
          setTimeout(() => this.playerModel.setAuraVisible(false), 1200);
          this.cameraShake = 0.5;
        }
      }

      // Trigger realistic animation
      this.playerModel.triggerStroke(actualShot, this.settings.swingSpeed);

      // Stamina consumption for powerful shots
      const staminaDrain = actualShot === 'smash' || actualShot === 'special' ? 8 : 4;
      this.playerStats.stamina = Math.max(0, this.playerStats.stamina - staminaDrain);
      this.playerModel.isExhausted = this.playerStats.stamina < 20;

      // Calculate targeted spot on opponent's half
      let targetX = this.aimDirection * 3.3 + (Math.random() - 0.5) * 0.4;
      if (this.aimDirection === 0) {
        // Aim cross-court away from opponent
        targetX = this.oppPos.x > 0 ? -2.9 : 2.9;
      }

      // Target depth based on stroke type
      let targetZ = -10.5;
      if (actualShot === 'dropshot') targetZ = -3.2;
      else if (actualShot === 'slice') targetZ = -7.5;
      else if (actualShot === 'lob') targetZ = -11.2;

      // Contact quality / sweet spot
      const contactDist = Math.abs(distToBall - 1.1);
      const sweetSpotRatio = Math.max(0.4, 1.0 - contactDist * 0.45);

      tennisPhysics.executeShot(this.ball, {
        hitter: 'player',
        targetX,
        targetZ,
        shotType: actualShot,
        settings: this.settings,
        sweetSpotRatio,
        specialType: this.playerChar.specialType,
      });

      this.score.lastShotSpeedKmH = this.ball.speedKmH;

      // Increment rally counter
      this.matchStats.currentRally++;
      if (this.matchStats.currentRally > this.matchStats.longestRally) {
        this.matchStats.longestRally = this.matchStats.currentRally;
      }

      // Build Super Gauge on clean hits
      this.playerStats.superGauge = Math.min(100, this.playerStats.superGauge + 15);
      this.callbacks.onStatsUpdate(this.playerStats, this.oppStats);
      this.callbacks.onMatchStatsUpdate({ ...this.matchStats });

      soundManager.playHit(actualShot, this.settings.shotPower / 100, sweetSpotRatio);
    }
  }

  public update(dt: number) {
    if (this.isDestroyed || this.isReplaying) return;

    // Grand Slam Victory Celebration Mode
    if (this.isCelebrating) {
      this.celebrationTime += dt;
      if (this.confettiGroup && this.confettiGroup.visible) {
        for (const p of this.confettiParticles) {
          p.mesh.position.y += p.vy * dt;
          p.mesh.position.x += p.vx * dt + Math.sin(this.celebrationTime * 3 + p.mesh.position.y) * dt * 0.5;
          p.mesh.rotation.x += p.rotSpeed.x * dt;
          p.mesh.rotation.y += p.rotSpeed.y * dt;
          p.mesh.rotation.z += p.rotSpeed.z * dt;
          if (p.mesh.position.y < 0.05) {
            p.mesh.position.y = 10 + Math.random() * 4;
            p.mesh.position.x = (Math.random() - 0.5) * 16;
          }
        }
      }

      this.flashTimer -= dt;
      if (this.flashTimer <= 0) {
        this.flashTimer = 0.12 + Math.random() * 0.35;
        if (this.flashLight) {
          this.flashLight.intensity = Math.random() > 0.4 ? 4.5 : 0;
          this.flashLight.position.set(
            (Math.random() - 0.5) * 28,
            6 + Math.random() * 8,
            (Math.random() - 0.5) * 32
          );
        }
      } else if (this.flashLight && this.flashLight.intensity > 0) {
        this.flashLight.intensity = Math.max(0, this.flashLight.intensity - dt * 25);
      }

      this.playerModel.update(dt);
      this.courtBuilder.update(dt);
      this.courtBuilder.triggerPotatoJump();
      this.updateCamera(dt);
      return;
    }

    // 1. Process Serve Toss Animation if in tossing phase
    if (this.serveState.phase === 'tossing') {
      this.serveState.tossTimer += dt;
      // Parabolic vertical toss equation: y = y0 + v0*t - 0.5*g*t^2
      const t = this.serveState.tossTimer;
      const v0 = 5.2; // vertical toss velocity
      this.ball.y = 1.15 + v0 * t - 0.5 * 9.8 * t * t;
      this.ball.x = this.playerPos.x + 0.35;
      this.ball.z = this.playerPos.z - 0.35;

      // If player doesn't strike, ball falls back down (fault or reset toss)
      if (t > 1.15) {
        this.resetForServe();
        return;
      }
      this.callbacks.onServeStateUpdate({ ...this.serveState });
    }

    // 2. Player Movement with realistic acceleration & agility
    this.updatePlayerMovement(dt);

    // 3. AI Opponent Logic
    this.updateAIOpponent(dt);

    // 4. Ball Aerodynamics & Court Physics
    this.updateBallPhysics(dt);

    // 5. Update 3D Visuals
    this.ballMesh.position.set(this.ball.x, Math.max(this.ball.y, VISUAL_BALL_RADIUS), this.ball.z);
    this.ballMesh.rotation.x += this.ball.vz * dt * 2.8;
    this.ballMesh.rotation.y += this.ball.spinY * dt * 2.2;

    this.ballShadow.position.set(this.ball.x, 0.015, this.ball.z);
    const shadowScale = Math.max(0.3, 1.0 - (this.ball.y / 5.0) * 0.7);
    this.ballShadow.scale.set(shadowScale, shadowScale, shadowScale);
    (this.ballShadow.material as THREE.MeshBasicMaterial).opacity = Math.max(
      0.1,
      0.5 - (this.ball.y / 6.0) * 0.4
    );

    // Update Landing Prediction Marker
    if (this.ball.active && this.ball.vz !== 0) {
      const pred = tennisPhysics.predictLanding(this.ball);
      this.landingMarker.position.set(pred.x, 0.02, pred.z);
      (this.landingMarker.material as THREE.MeshBasicMaterial).opacity = 0.65;
    } else {
      (this.landingMarker.material as THREE.MeshBasicMaterial).opacity = 0.0;
    }

    // Update Particle Trail & Characters
    this.updateBallTrail();
    this.playerModel.update(dt);
    this.opponentModel.update(dt);
    this.courtBuilder.update(dt);

    // Record frame into replay ring buffer
    this.recordReplayFrame();

    // 6. Camera Tracking
    this.updateCamera(dt);
  }

  private updatePlayerMovement(dt: number) {
    const isMoving = this.moveInput.x !== 0 || this.moveInput.z !== 0;

    // Movement speed scaled by player speed setting & current stamina
    const maxSpeed = 5.5 + (this.settings.runningSpeed / 100) * 5.5; // 5.5 - 11.0 m/s
    const staminaFactor = this.playerStats.stamina < 20 ? 0.65 : 1.0;
    const effectiveSpeed = maxSpeed * staminaFactor;

    // Agility controls responsiveness (acceleration)
    const agilityRate = 8.0 + (this.settings.agility / 100) * 16.0;

    if (isMoving) {
      const targetVx = this.moveInput.x * effectiveSpeed;
      const targetVz = this.moveInput.z * effectiveSpeed;

      this.playerPos.x += targetVx * dt;
      this.playerPos.z += targetVz * dt;

      // Play rubber shoe squeak on sharp direction shifts
      if (Math.abs(this.moveInput.x) > 0.5) {
        soundManager.playShoeSqueak();
      }

      // Stamina drain while running
      this.playerStats.stamina = Math.max(0, this.playerStats.stamina - dt * 4.5);
      this.playerModel.isExhausted = this.playerStats.stamina < 20;

      // Footwork animations: strafe vs running
      if (Math.abs(this.moveInput.x) > 0.8 && Math.abs(this.moveInput.z) < 0.3) {
        this.playerModel.animState = this.moveInput.x < 0 ? 'strafe_left' : 'strafe_right';
      } else {
        this.playerModel.animState = 'running';
      }
    } else {
      if (
        this.playerModel.animState === 'running' ||
        this.playerModel.animState === 'strafe_left' ||
        this.playerModel.animState === 'strafe_right'
      ) {
        this.playerModel.animState = 'idle';
      }
      // Regenerate stamina when standing still
      this.playerStats.stamina = Math.min(100, this.playerStats.stamina + dt * 6.5);
      this.playerModel.isExhausted = this.playerStats.stamina < 20;
    }

    // Boundary clamps
    this.playerPos.x = THREE.MathUtils.clamp(
      this.playerPos.x,
      -COURT_HALF_WIDTH - 1.4,
      COURT_HALF_WIDTH + 1.4
    );
    this.playerPos.z = THREE.MathUtils.clamp(this.playerPos.z, 1.2, COURT_HALF_LENGTH + 2.8);
    this.playerModel.group.position.set(this.playerPos.x, 0, this.playerPos.z);
  }

  private updateAIOpponent(dt: number) {
    const diffConf = DIFFICULTIES[this.difficulty];
    const aiSkill = this.settings.aiDifficulty / 100;

    // AI Serving State
    if (this.score.status === 'serving' && this.score.server === 'opponent') {
      if (this.aiDecisionTimer > 0) {
        this.aiDecisionTimer -= dt;
        if (this.aiDecisionTimer <= 0) {
          this.opponentModel.triggerServeToss();
          soundManager.playToss();

          setTimeout(() => {
            if (this.isDestroyed) return;
            this.opponentModel.triggerStroke('serve', 75);
            soundManager.playWhistle();

            const isRightSide = (this.score.playerPoints + this.score.opponentPoints) % 2 === 0;
            const targetX = (isRightSide ? -2.0 : 2.0) + (Math.random() - 0.5) * 0.8;
            const targetZ = 4.5;

            tennisPhysics.executeShot(this.ball, {
              hitter: 'opponent',
              targetX,
              targetZ,
              shotType: this.score.serveAttempt === 1 ? 'flat' : 'topspin',
              powerMultiplier: 0.80 * diffConf.ballSpeedMultiplier * aiSkill,
              accuracyMultiplier: diffConf.aiAccuracy * aiSkill,
              isServe: true,
              serveAttempt: this.score.serveAttempt,
            });

            this.score.lastShotSpeedKmH = this.ball.speedKmH;
            soundManager.playHit('serve', 1.0, 0.9);
            this.score.status = 'rally';
            this.callbacks.onScoreUpdate({ ...this.score });
          }, 450);
        }
      }
      return;
    }

    if (this.gameMode === 'practice') {
      if (this.score.status === 'rally' && this.ball.active && this.ball.lastHitter === 'player') {
        if (this.ball.z < -2.0 && (this.ball.bounces >= 1 || this.ball.z < -7.0)) {
          const returnTargetX = (Math.random() - 0.5) * 4.5;
          const returnTargetZ = 8.5 + Math.random() * 2.5;
          const shotTypes: ShotType[] = ['flat', 'topspin', 'slice', 'lob'];
          const randomShot = shotTypes[Math.floor(Math.random() * shotTypes.length)];

          tennisPhysics.executeShot(this.ball, {
            hitter: 'opponent',
            targetX: returnTargetX,
            targetZ: returnTargetZ,
            shotType: randomShot,
            powerMultiplier: 0.95,
            accuracyMultiplier: 0.95,
          });

          this.practiceRallies++;
          this.score.lastShotSpeedKmH = this.ball.speedKmH;
          this.score.statusMessageAr = `تدريب فردي حر • راليات متتالية: ${this.practiceRallies} 🎾 | سرعة: ${this.ball.speedKmH} كم/س`;
          this.score.statusMessageEn = `Solo Practice • Rally: ${this.practiceRallies} 🎾 | Speed: ${this.ball.speedKmH} km/h`;
          this.callbacks.onScoreUpdate({ ...this.score });
          soundManager.playHit(randomShot, 0.85, 0.95);
        }
      }
      return;
    }

    if (this.score.status !== 'rally' || !this.ball.active) return;

    // AI Tracking & Prediction
    const oppMaxSpeed = 7.5 * (this.opponentChar.speed / 4) * (0.8 + 0.4 * aiSkill);

    if (this.ball.vz < 0) {
      // Ball is traveling toward opponent
      const pred = tennisPhysics.predictLanding(this.ball);
      this.aiTargetX = pred.x * diffConf.aiAccuracy;
      this.aiTargetZ = -COURT_HALF_LENGTH + 0.5;

      // If ball is a drop shot, rush forward to net!
      if (this.ball.z > -4.0 && Math.abs(this.ball.vz) < 14) {
        this.aiTargetZ = -2.5; // Rush the net for a volley/passing shot
      }
    } else {
      // Ball going away - recover toward center baseline
      this.aiTargetX = 0;
      this.aiTargetZ = -COURT_HALF_LENGTH + 0.5;
    }

    const dx = this.aiTargetX - this.oppPos.x;
    const dz = this.aiTargetZ - this.oppPos.z;

    if (Math.abs(dx) > 0.15 || Math.abs(dz) > 0.15) {
      this.oppPos.x += Math.sign(dx) * Math.min(Math.abs(dx), oppMaxSpeed * dt);
      this.oppPos.z += Math.sign(dz) * Math.min(Math.abs(dz), oppMaxSpeed * dt);
      this.opponentModel.animState = 'running';
    } else if (this.opponentModel.animState === 'running') {
      this.opponentModel.animState = 'idle';
    }

    this.oppPos.x = THREE.MathUtils.clamp(
      this.oppPos.x,
      -COURT_HALF_WIDTH - 1.2,
      COURT_HALF_WIDTH + 1.2
    );
    this.oppPos.z = THREE.MathUtils.clamp(this.oppPos.z, -COURT_HALF_LENGTH - 2.8, -1.2);
    this.opponentModel.group.position.set(this.oppPos.x, 0, this.oppPos.z);

    // AI Strike Zone Detection
    const dist = Math.hypot(this.oppPos.x - this.ball.x, this.oppPos.z - this.ball.z);
    const heightOk = this.ball.y >= 0.25 && this.ball.y <= 2.8;

    if (dist <= 2.3 && heightOk && this.ball.lastHitter !== 'opponent') {
      const isForehand = this.ball.x <= this.oppPos.x;
      const isSuperReady = this.oppStats.superGauge >= 100;
      const isVolley = this.ball.bounces === 0 && this.oppPos.z > -6.0;

      let chosenShot: ShotType = isForehand ? 'forehand' : 'backhand';

      if (isSuperReady) {
        chosenShot = 'special';
        this.oppStats.superGauge = 0;
        this.callbacks.onStatsUpdate(this.playerStats, this.oppStats);
        this.callbacks.onSpecialCutIn(
          this.opponentChar,
          this.opponentChar.specialMoveAr,
          this.opponentChar.specialKanji
        );
        soundManager.playCharge();
        this.opponentModel.setAuraVisible(true);
        setTimeout(() => this.opponentModel.setAuraVisible(false), 1200);
        this.cameraShake = 0.5;
      } else if (isVolley) {
        chosenShot = 'volley';
      } else if (this.playerPos.z < 4.0 && Math.random() > 0.4) {
        // Player is at net -> AI plays a lob or passing shot!
        chosenShot = Math.random() > 0.5 ? 'lob' : 'slice';
      } else if (Math.random() > 0.6) {
        chosenShot = 'topspin';
      }

      this.opponentModel.triggerStroke(chosenShot, 75);

      // AI targets open court
      const targetX = (this.playerPos.x > 0 ? -2.8 : 2.8) + (Math.random() - 0.5) * 1.0;
      const targetZ = chosenShot === 'slice' ? 5.5 : chosenShot === 'lob' ? 11.0 : 10.5;

      tennisPhysics.executeShot(this.ball, {
        hitter: 'opponent',
        targetX,
        targetZ,
        shotType: chosenShot,
        powerMultiplier: 0.78 * diffConf.ballSpeedMultiplier * aiSkill,
        accuracyMultiplier: diffConf.aiAccuracy * aiSkill,
        specialType: this.opponentChar.specialType,
      });

      this.score.lastShotSpeedKmH = this.ball.speedKmH;

      this.oppStats.superGauge = Math.min(100, this.oppStats.superGauge + 15);
      this.matchStats.currentRally++;
      this.callbacks.onStatsUpdate(this.playerStats, this.oppStats);
      this.callbacks.onMatchStatsUpdate({ ...this.matchStats });
      soundManager.playHit(chosenShot, 1.0, 0.9);
    }
  }

  private updateBallPhysics(dt: number) {
    if (!this.ball.active) return;

    const res = tennisPhysics.updateBall(this.ball, dt, this.currentTheme);

    if (res.hitNet) {
      soundManager.playNetHit();
    }

    // Ball bounced on court
    if (res.bounced && res.bouncePosition) {
      soundManager.playBounce(
        Math.min(Math.abs(this.ball.vy) / 6.0, 1.0),
        this.currentTheme === 'sakura'
      );

      // Handle serve bounce rules
      if (this.ball.isServe && this.ball.bounces === 1) {
        const isRightSide = (this.score.playerPoints + this.score.opponentPoints) % 2 === 0;
        const serverSide = isRightSide ? 'right' : 'left';
        const targetHalf = this.ball.lastHitter === 'player' ? 'opponent' : 'player';

        const isServeLegal = tennisPhysics.isServeBounceLegal(
          this.ball.x,
          this.ball.z,
          serverSide,
          targetHalf
        );

        if (!isServeLegal) {
          // Service Fault!
          this.handleServiceFault();
          return;
        } else {
          // Legal Serve! Update first serve statistics
          if (this.ball.lastHitter === 'player' && this.score.serveAttempt === 1) {
            this.matchStats.firstServesIn.player++;
            this.callbacks.onMatchStatsUpdate({ ...this.matchStats });
          }
          this.ball.isServe = false;
        }
      }

      // Handle regular rally bounce rules
      if (this.ball.bounces === 1) {
        const isLegal = tennisPhysics.isBounceInsideCourt(this.ball.x, this.ball.z);
        if (!isLegal) {
          // Ball bounced OUT!
          const pointWinner = this.ball.lastHitter === 'player' ? 'opponent' : 'player';
          soundManager.speakUmpireCall(this.langText('خارج الملعب!', 'Out!'));
          this.handlePointEnd(pointWinner, 'خارج الملعب! (OUT)', 'Ball Out of Bounds!');
          return;
        }
      } else if (this.ball.bounces >= 2) {
        // Two bounces! Point awarded to last hitter
        const pointWinner = this.ball.lastHitter!;
        this.handlePointEnd(
          pointWinner,
          pointWinner === 'player' ? 'نقطة رابحة لك! 🎾' : 'نقطة للخصم!',
          pointWinner === 'player' ? 'Winner! Point to You' : 'Opponent Scores Point'
        );
        return;
      }
    }

    // Ball flew out without bouncing
    if (Math.abs(this.ball.z) > COURT_HALF_LENGTH + 9.0 || this.ball.y < -1.5) {
      if (this.ball.bounces === 0) {
        const pointWinner = this.ball.lastHitter === 'player' ? 'opponent' : 'player';
        soundManager.speakUmpireCall(this.langText('خارج الملعب!', 'Out!'));
        this.handlePointEnd(pointWinner, 'الكرة في الخارج (OUT)!', 'Ball Out!');
      } else {
        const pointWinner = this.ball.lastHitter!;
        this.handlePointEnd(pointWinner, 'نقطة مكتسبة!', 'Point Scored!');
      }
    }
  }

  private handleServiceFault() {
    this.ball.active = false;
    soundManager.speakUmpireCall(this.langText('خطأ إرسال!', 'Fault!'));

    if (this.score.serveAttempt === 1) {
      // First serve fault -> crowd gasp
      soundManager.playCrowdGasp();
      this.score.serveAttempt = 2;
      this.score.status = 'serving';
      this.score.statusMessageAr = 'خطأ إرسال أول! استعد للإرسال الثاني';
      this.score.statusMessageEn = '1st Service Fault! Prepare for 2nd serve';
      this.callbacks.onScoreUpdate({ ...this.score });

      setTimeout(() => {
        if (!this.isDestroyed) this.resetForServe();
      }, 1400);
    } else {
      // Second serve fault -> DOUBLE FAULT! Crowd boos!
      soundManager.speakUmpireCall(this.langText('خطأ مزدوج!', 'Double Fault!'));
      soundManager.playCrowdBoo(3.5);
      if (this.score.server === 'player') {
        this.matchStats.doubleFaults.player++;
      } else {
        this.matchStats.doubleFaults.opponent++;
      }
      this.callbacks.onMatchStatsUpdate({ ...this.matchStats });

      const pointWinner = this.score.server === 'player' ? 'opponent' : 'player';
      this.handlePointEnd(pointWinner, 'خطأ إرسال مزدوج! (Double Fault)', 'Double Fault!');
    }
  }

  private handlePointEnd(winner: 'player' | 'opponent', msgAr: string, msgEn: string) {
    this.ball.active = false;

    if (this.gameMode === 'practice') {
      this.score.status = 'point_scored';
      this.score.statusMessageAr = `تدريب فردي • رائع! استعد للكرة التالية (الرالي: ${this.practiceRallies})`;
      this.score.statusMessageEn = `Solo Practice • Good shot! Ready for next ball (Rally: ${this.practiceRallies})`;
      this.callbacks.onScoreUpdate({ ...this.score });
      setTimeout(() => {
        if (!this.isDestroyed) this.resetForServe();
      }, 1200);
      return;
    }

    this.score.status = 'point_scored';
    this.score.pointWinner = winner;
    this.score.statusMessageAr = msgAr;
    this.score.statusMessageEn = msgEn;

    soundManager.playPointChime(winner === 'player');
    if (winner === 'player') {
      soundManager.playCrowdCheer(true);
      this.courtBuilder.triggerPotatoJump();
    } else {
      soundManager.playCrowdBoo(2.6);
    }

    // Update match stats
    if (winner === 'player') {
      this.matchStats.totalPointsWon.player++;
      this.matchStats.winners.player++;
    } else {
      this.matchStats.totalPointsWon.opponent++;
      this.matchStats.winners.opponent++;
    }
    this.matchStats.currentRally = 0;
    this.callbacks.onMatchStatsUpdate({ ...this.matchStats });

    // Advance official tennis game score
    this.advanceTennisPoint(winner);

    // Reset serve attempt to 1 for the next point
    this.score.serveAttempt = 1;
    this.callbacks.onScoreUpdate({ ...this.score });

    setTimeout(() => {
      if (this.isDestroyed || this.score.status === 'game_over') return;
      this.resetForServe();
    }, 2200);
  }

  /**
   * Official Pro Tennis Point Engine:
   * 0 -> 15 -> 30 -> 40 -> Deuce -> Advantage -> Game
   * At 6-6: 7-point Tie-break
   */
  private advanceTennisPoint(winner: 'player' | 'opponent') {
    if (this.score.isTiebreak) {
      // Tiebreak scoring: simple numerical points up to 7 (with 2-point lead)
      if (winner === 'player') {
        this.score.playerTiebreakPoints++;
      } else {
        this.score.opponentTiebreakPoints++;
      }

      const pT = this.score.playerTiebreakPoints;
      const oT = this.score.opponentTiebreakPoints;

      if (pT >= 7 && pT - oT >= 2) {
        this.winGame('player');
      } else if (oT >= 7 && oT - pT >= 2) {
        this.winGame('opponent');
      }
      return;
    }

    let p = this.score.playerPoints;
    let o = this.score.opponentPoints;

    if (winner === 'player') {
      if (p === 0) p = 15;
      else if (p === 15) p = 30;
      else if (p === 30) p = 40;
      else if (p === 40) {
        if (o === 40) {
          if (this.score.isAdvantage === 'player') {
            this.winGame('player');
            return;
          } else if (this.score.isAdvantage === 'opponent') {
            this.score.isAdvantage = null; // Back to Deuce
            soundManager.speakUmpireCall(this.langText('تعادل!', 'Deuce!'));
          } else {
            this.score.isAdvantage = 'player';
            soundManager.speakUmpireCall(this.langText('أفضلية لك!', 'Advantage Player!'));
          }
        } else {
          this.winGame('player');
          return;
        }
      }
    } else {
      if (o === 0) o = 15;
      else if (o === 15) o = 30;
      else if (o === 30) o = 40;
      else if (o === 40) {
        if (p === 40) {
          if (this.score.isAdvantage === 'opponent') {
            this.winGame('opponent');
            return;
          } else if (this.score.isAdvantage === 'player') {
            this.score.isAdvantage = null;
            soundManager.speakUmpireCall(this.langText('تعادل!', 'Deuce!'));
          } else {
            this.score.isAdvantage = 'opponent';
            soundManager.speakUmpireCall(this.langText('أفضلية للخصم!', 'Advantage Receiver!'));
          }
        } else {
          this.winGame('opponent');
          return;
        }
      }
    }

    this.score.playerPoints = p;
    this.score.opponentPoints = o;
    this.score.isDeuce = p === 40 && o === 40 && this.score.isAdvantage === null;
  }

  private winGame(winner: 'player' | 'opponent') {
    this.score.playerPoints = 0;
    this.score.opponentPoints = 0;
    this.score.isAdvantage = null;
    this.score.isDeuce = false;
    this.score.isTiebreak = false;
    this.score.playerTiebreakPoints = 0;
    this.score.opponentTiebreakPoints = 0;

    if (winner === 'player') {
      this.score.playerGames++;
      this.playerStats.games = this.score.playerGames;
      soundManager.speakUmpireCall(this.langText('شوط لك!', 'Game, Player!'));
    } else {
      this.score.opponentGames++;
      this.oppStats.games = this.score.opponentGames;
      soundManager.speakUmpireCall(this.langText('شوط للخصم!', 'Game, Opponent!'));
    }

    // Switch server
    this.score.server = this.score.server === 'player' ? 'opponent' : 'player';

    // Check Set or Tiebreak conditions:
    const pG = this.score.playerGames;
    const oG = this.score.opponentGames;
    const pointsToWin = this.matchLength || this.currentStage.pointsToWin;

    // Trigger tie-break at 6-6 (if pointsToWin >= 6)
    if (pG === 6 && oG === 6) {
      this.score.isTiebreak = true;
      soundManager.speakUmpireCall(this.langText('شوط كسر التعادل!', 'Tiebreak!'));
      return;
    }

    if (pG >= pointsToWin && pG - oG >= (pointsToWin > 1 ? 2 : 1)) {
      this.score.playerSets++;
      this.playerStats.sets = this.score.playerSets;
      this.score.status = 'game_over';
      this.score.winner = 'player';
      this.score.statusMessageAr = 'مبروك! انتصار ساحق في المباراة! 🏆🔥';
      this.score.statusMessageEn = 'Victory! Match Won and Stage Cleared! 🏆';
      soundManager.speakUmpireCall(this.langText('مباراة وفوز مستحق!', 'Game, Set, and Match!'));
      soundManager.playVictoryRoar();
      this.startVictoryCelebration('arms_up');
      this.callbacks.onMatchEnd('player', this.currentStage);
    } else if (oG >= pointsToWin && oG - pG >= (pointsToWin > 1 ? 2 : 1)) {
      this.score.opponentSets++;
      this.oppStats.sets = this.score.opponentSets;
      this.score.status = 'game_over';
      this.score.winner = 'opponent';
      this.score.statusMessageAr = 'خسارة الشوط! حاول مجدداً مع تكتيك أفضل 💪';
      this.score.statusMessageEn = 'Defeat! Try again with sharper timing 💪';
      soundManager.speakUmpireCall(this.langText('المباراة للخصم!', 'Game, Set, Match Opponent!'));
      soundManager.playCrowdBoo(4.0);
      this.callbacks.onMatchEnd('opponent', this.currentStage);
    }

    this.callbacks.onScoreUpdate({ ...this.score });
  }

  private updateBallTrail() {
    if (!this.ballTrailPoints) return;
    const posAttr = this.ballTrailPoints.geometry.attributes.position as THREE.BufferAttribute;
    const arr = this.ballTrailPositions;

    for (let i = arr.length - 1; i >= 3; i--) {
      arr[i] = arr[i - 3];
    }
    arr[0] = this.ball.x;
    arr[1] = this.ball.y;
    arr[2] = this.ball.z;
    posAttr.needsUpdate = true;

    const trailMat = this.ballTrailPoints.material as THREE.PointsMaterial;
    if (this.ball.isSpecialActive) {
      trailMat.color.setHex(0xf97316);
      trailMat.size = 0.35;
    } else {
      trailMat.color.setHex(0x38bdf8);
      trailMat.size = 0.2;
    }
  }

  private recordReplayFrame() {
    if (this.replayBuffer.length > 360) {
      this.replayBuffer.shift();
    }
    this.replayBuffer.push({
      ballX: this.ball.x,
      ballY: this.ball.y,
      ballZ: this.ball.z,
      playerX: this.playerPos.x,
      playerZ: this.playerPos.z,
      playerAnim: this.playerModel.animState,
      oppX: this.oppPos.x,
      oppZ: this.oppPos.z,
      oppAnim: this.opponentModel.animState,
    });
  }

  public startInstantReplay() {
    if (this.replayBuffer.length < 20) return;
    this.isReplaying = true;
    this.replayIndex = 0;
  }

  public startVictoryCelebration(pose: 'arms_up' | 'fist_pump' | 'racket_raise' | 'wave' | 'trophy' = 'arms_up') {
    this.isCelebrating = true;
    this.celebrationTime = 0;
    this.celebrationPose = pose;
    this.ball.active = false;
    this.playerPos.set(0, 0, 8.5);
    this.playerModel.group.position.set(0, 0, 8.5);
    this.playerModel.group.rotation.y = Math.PI;
    this.playerModel.triggerCelebration(pose);
    if (this.confettiGroup) this.confettiGroup.visible = true;
    soundManager.playVictoryRoar();
    this.courtBuilder.triggerPotatoJump();
  }

  public setCelebrationPose(pose: 'arms_up' | 'fist_pump' | 'racket_raise' | 'wave' | 'trophy') {
    this.celebrationPose = pose;
    this.playerModel.triggerCelebration(pose);
  }

  public setCelebrationAngle(angle: 'orbit' | 'closeup' | 'crane' | 'hero') {
    this.celebrationAngle = angle;
  }

  public stopVictoryCelebration() {
    this.isCelebrating = false;
    this.playerModel.triggerCelebration('none');
    if (this.confettiGroup) this.confettiGroup.visible = false;
    if (this.flashLight) this.flashLight.intensity = 0;
  }

  private updateCamera(dt: number) {
    if (this.isCelebrating) {
      const pX = this.playerPos.x;
      const pZ = this.playerPos.z;

      if (this.celebrationAngle === 'orbit') {
        const radius = 4.2;
        const angle = this.celebrationTime * 0.7;
        this.camera.position.set(
          pX + Math.sin(angle) * radius,
          2.2 + Math.sin(this.celebrationTime * 0.5) * 0.25,
          pZ + Math.cos(angle) * radius
        );
        _camTarget.set(pX, 1.4, pZ);
        this.camera.lookAt(_camTarget);
      } else if (this.celebrationAngle === 'closeup') {
        this.camera.position.set(pX - 0.3, 1.65, pZ + 1.8);
        _camTarget.set(pX, 1.55, pZ);
        this.camera.lookAt(_camTarget);
      } else if (this.celebrationAngle === 'crane') {
        this.camera.position.set(pX + 8, 12.0, pZ + 12);
        _camTarget.set(pX, 0.8, pZ);
        this.camera.lookAt(_camTarget);
      } else if (this.celebrationAngle === 'hero') {
        this.camera.position.set(pX + 0.3, 0.4, pZ + 2.5);
        _camTarget.set(pX, 1.5, pZ);
        this.camera.lookAt(_camTarget);
      }
      return;
    }

    if (this.isReplaying) {
      // Cinematic slow-motion replay playback
      const frame = this.replayBuffer[this.replayIndex];
      if (frame) {
        this.ballMesh.position.set(frame.ballX, frame.ballY, frame.ballZ);
        this.playerModel.group.position.set(frame.playerX, 0, frame.playerZ);
        this.opponentModel.group.position.set(frame.oppX, 0, frame.oppZ);

        this.camera.position.set(12, 4.5, frame.ballZ + 4.0);
        _camTarget.set(frame.ballX, 1.2, frame.ballZ);
        this.camera.lookAt(_camTarget);

        this.replayIndex++;
        if (this.replayIndex >= this.replayBuffer.length) {
          this.exitInstantReplay();
        }
      }
      return;
    }

    if (this.cameraMode === 'follow') {
      // Dynamic third-person behind player
      const targetCamX = this.playerPos.x * 0.4;
      const targetCamY = 5.2 + Math.max(0, this.ball.y * 0.2);
      const targetCamZ = this.playerPos.z + 5.8;

      this.camera.position.x += (targetCamX - this.camera.position.x) * Math.min(dt * 6, 1);
      this.camera.position.y += (targetCamY - this.camera.position.y) * Math.min(dt * 5, 1);
      this.camera.position.z += (targetCamZ - this.camera.position.z) * Math.min(dt * 6, 1);

      _camTarget.set(this.ball.x * 0.2, 1.2, this.ball.z * 0.4);
      this.camera.lookAt(_camTarget);
    } else if (this.cameraMode === 'broadcast') {
      // Elevated Pro TV broadcast angle
      this.camera.position.set(0, 14.5, 22.0);
      _camTarget.set(0, 0.9, -1.0);
      this.camera.lookAt(_camTarget);
    } else if (this.cameraMode === 'action') {
      // Close dynamic action cam tracking ball and impact
      const targetCamX = this.ball.x * 0.5 + 2.5;
      const targetCamY = 3.2;
      const targetCamZ = this.ball.z + 6.0;
      this.camera.position.set(targetCamX, targetCamY, targetCamZ);
      _camTarget.set(this.ball.x, 1.2, this.ball.z);
      this.camera.lookAt(_camTarget);
    } else if (this.cameraMode === 'sideline') {
      // Court-level sideline angle
      this.camera.position.set(14.5, 3.2, 0);
      _camTarget.set(this.ball.x * 0.5, 1.2, this.ball.z * 0.5);
      this.camera.lookAt(_camTarget);
    }

    if (this.cameraShake > 0) {
      this.camera.position.x += (Math.random() - 0.5) * this.cameraShake;
      this.camera.position.y += (Math.random() - 0.5) * this.cameraShake;
      this.cameraShake = Math.max(0, this.cameraShake - dt * 2.0);
    }
  }

  private langText(ar: string, en: string): string {
    return this.callbacks ? en : ar;
  }

  private onWindowResize = () => {
    if (!this.container || this.isDestroyed) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  };

  private tick = () => {
    if (this.isDestroyed) return;
    const dt = Math.min(this.clock.getDelta(), 0.05);

    this.update(dt);
    this.renderer.render(this.scene, this.camera);

    if (isSoftwareGl) {
      this.afterDraw(this.tick);
    } else {
      this.frameId = requestAnimationFrame(this.tick);
    }
  };

  private afterDraw(cb: () => void) {
    const gl = this.renderer.getContext() as WebGL2RenderingContext;
    const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
    gl.flush();
    const poll = () => {
      if (this.isDestroyed) return;
      const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
      if (state === gl.UNSIGNALED) {
        this.frameId = window.setTimeout(poll, 5);
      } else {
        if (sync) gl.deleteSync(sync);
        this.frameId = window.setTimeout(cb, 60);
      }
    };
    this.frameId = window.setTimeout(poll, 5);
  }

  public destroy() {
    this.isDestroyed = true;
    window.removeEventListener('resize', this.onWindowResize);
    cancelAnimationFrame(this.frameId);
    clearTimeout(this.frameId);
    this.renderer.dispose();
  }
}
