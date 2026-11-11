import { BallState, CourtTheme, ShotType, TennisPlayerSettings } from '../types/tennis';

export const COURT_HALF_LENGTH = 11.885;
export const COURT_HALF_WIDTH = 4.115;
export const COURT_DOUBLES_HALF_WIDTH = 5.485;
export const SERVICE_LINE_Z = 6.40;
export const NET_HEIGHT_CENTER = 0.914;
export const NET_HEIGHT_POSTS = 1.07;
export const BALL_RADIUS = 0.033; // Official radius ~3.3cm (rendered visually scaled)
export const VISUAL_BALL_RADIUS = 0.155; // Enhanced size for clear ball tracking

export interface SurfaceProperties {
  friction: number;
  restitution: number;
  spinKick: number;
}

export const COURT_SURFACES: Record<CourtTheme, SurfaceProperties> = {
  sakura: {
    // Clay / Blossom: High friction, medium bounce, heavy topspin kick
    friction: 0.82,
    restitution: 0.72,
    spinKick: 1.15,
  },
  cyberpunk: {
    // Hard Court: Medium friction, high true bounce, fast pace
    friction: 0.72,
    restitution: 0.78,
    spinKick: 1.0,
  },
  volcano: {
    // Fast Basalt: Low-medium friction, explosive high restitution
    friction: 0.68,
    restitution: 0.84,
    spinKick: 1.1,
  },
  celestial: {
    // Grass / Marble: Slick low friction, skids low, slice stays flat
    friction: 0.58,
    restitution: 0.69,
    spinKick: 0.85,
  },
};

export interface HitPhysicsParams {
  hitter: 'player' | 'opponent';
  targetX: number;
  targetZ: number;
  shotType: ShotType;
  settings?: TennisPlayerSettings;
  powerMultiplier?: number;
  accuracyMultiplier?: number;
  spinMultiplier?: number;
  isServe?: boolean;
  serveAttempt?: 1 | 2;
  sweetSpotRatio?: number; // 0.0 (miss/mishit) to 1.0 (dead center sweet spot)
  specialType?: 'lightning' | 'cherry' | 'fire' | 'phantom' | 'iron';
}

export class TennisPhysics {
  // Physical parameters
  public gravity: number = -11.8; // m/s^2 (scaled for snappy responsive gameplay)
  private dragCoefficient: number = 0.0068; // Aerodynamic drag factor
  private magnusLiftCoeff: number = 0.038;
  private magnusSideCoeff: number = 0.042;

  /**
   * Update ball motion across dt with gravity, aerodynamic drag, Magnus spin curve,
   * net collision, and court ground bounce.
   */
  public updateBall(
    ball: BallState,
    dt: number,
    courtTheme: CourtTheme = 'sakura'
  ): {
    bounced: boolean;
    hitNet: boolean;
    clippedNetCord: boolean;
    outOfBounds: boolean;
    bouncePosition?: { x: number; y: number; z: number };
  } {
    if (!ball.active) {
      return { bounced: false, hitNet: false, clippedNetCord: false, outOfBounds: false };
    }

    const clampedDt = Math.min(dt, 0.025);
    const surface = COURT_SURFACES[courtTheme] || COURT_SURFACES.sakura;

    // Velocity magnitude and aerodynamic drag
    const speed = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy + ball.vz * ball.vz);
    ball.speedKmH = Math.round(speed * 3.6);

    const dragForce = this.dragCoefficient * speed;

    // Magnus effect forces
    // Topspin (spinX > 0) exerts downward force; backspin (spinX < 0) generates lift
    const magnusY = -ball.spinX * speed * this.magnusLiftCoeff;
    const magnusX = ball.spinY * speed * this.magnusSideCoeff;

    // Integrate accelerations
    ball.vx += (magnusX - ball.vx * dragForce) * clampedDt;
    ball.vy += (this.gravity + magnusY - ball.vy * dragForce) * clampedDt;
    ball.vz += (-ball.vz * dragForce) * clampedDt;

    const prevZ = ball.z;
    const prevY = ball.y;

    // Integrate positions
    ball.x += ball.vx * clampedDt;
    ball.y += ball.vy * clampedDt;
    ball.z += ball.vz * clampedDt;

    // Realistic Net Collision Detection
    let hitNet = false;
    let clippedNetCord = false;

    // Check if the ball crossed z = 0 this frame
    if ((prevZ > 0 && ball.z <= 0) || (prevZ < 0 && ball.z >= 0)) {
      // Calculate net height at current lateral position (catenary curve from center to posts)
      const normalizedX = Math.min(Math.abs(ball.x) / COURT_DOUBLES_HALF_WIDTH, 1.0);
      const netHeight = NET_HEIGHT_CENTER + (NET_HEIGHT_POSTS - NET_HEIGHT_CENTER) * (normalizedX * normalizedX);

      if (ball.y <= netHeight + VISUAL_BALL_RADIUS) {
        if (ball.y >= netHeight - 0.06) {
          // Clipped the white net cord! Ball slows and tumbles over
          ball.vy *= 0.35;
          ball.vz *= 0.48;
          ball.spinX *= 0.2;
          clippedNetCord = true;
          hitNet = true;
        } else {
          // Solid net hit - rebound backward
          ball.vz = -ball.vz * 0.18;
          ball.vx *= 0.25;
          ball.vy *= 0.3;
          hitNet = true;
        }
      }
    }

    // Realistic Court Ground Bounce
    let bounced = false;
    let bouncePos: { x: number; y: number; z: number } | undefined = undefined;

    if (ball.y <= VISUAL_BALL_RADIUS) {
      ball.y = VISUAL_BALL_RADIUS;
      bounced = true;
      ball.bounces++;
      bouncePos = { x: ball.x, y: ball.y, z: ball.z };

      // Base restitution modified by incoming vertical velocity & spin
      let restitution = surface.restitution;
      if (ball.isSpecialActive && ball.specialType === 'fire') {
        restitution = 0.90;
      }

      // Invert vertical velocity
      ball.vy = -ball.vy * restitution;

      // Spin conversion to horizontal kick and skid
      // Topspin kicks forward; slice/backspin checks up and stays low
      const spinKickEffect = ball.spinX * 0.45 * surface.spinKick;
      ball.vz = ball.vz * surface.friction + spinKickEffect;
      ball.vx = ball.vx * surface.friction + ball.spinY * 0.25;

      // Subside spin on court contact
      ball.spinX *= 0.45;
      ball.spinY *= 0.45;

      // Track court half bounces
      if (ball.z > 0) {
        ball.hasBouncedOnPlayerSide = true;
      } else {
        ball.hasBouncedOnOpponentSide = true;
      }
    }

    // Out of bounds check
    const isOutsideCourt =
      Math.abs(ball.x) > COURT_HALF_WIDTH || Math.abs(ball.z) > COURT_HALF_LENGTH;

    return {
      bounced,
      hitNet,
      clippedNetCord,
      outOfBounds: isOutsideCourt,
      bouncePosition: bouncePos,
    };
  }

  /**
   * Calculate realistic ball trajectory based on shot type, player settings,
   * sweet-spot accuracy, and targeted court landing location.
   */
  public executeShot(ball: BallState, params: HitPhysicsParams) {
    const startX = ball.x;
    const startY = Math.max(ball.y, 0.7);
    const startZ = ball.z;

    const settings = params.settings;
    const powerPct = settings ? settings.shotPower / 100 : (params.powerMultiplier || 1.0);
    const accuracyPct = settings ? settings.accuracy / 100 : (params.accuracyMultiplier || 0.8);
    const spinPct = settings ? settings.spin / 100 : (params.spinMultiplier || 0.7);
    const sweetSpot = params.sweetSpotRatio !== undefined ? params.sweetSpotRatio : 0.95;

    // Calculate aiming inaccuracy error based on accuracy setting & sweet spot contact
    const maxSpreadX = (1.0 - accuracyPct) * 1.8 + (1.0 - sweetSpot) * 1.4;
    const spreadX = (Math.random() - 0.5) * maxSpreadX;
    const targetX = Math.max(
      -COURT_HALF_WIDTH - 0.8,
      Math.min(COURT_HALF_WIDTH + 0.8, params.targetX + spreadX)
    );

    const targetZ = params.targetZ;
    const dx = targetX - startX;
    const dz = targetZ - startZ;
    const distanceZ = Math.abs(dz);

    // For opponent shots, scale power so the player has ample reaction time to track and hit the ball
    const effectivePower = params.hitter === 'opponent' ? powerPct * 0.68 : powerPct;

    // Shot physics parameters table (balanced for readable parabolic trajectory and human eye tracking)
    let baseSpeed = 16.5; // m/s
    let minNetClearance = 1.45; // meters above court ground
    let topspin = 3.0;
    let sidespin = 0.0;

    switch (params.shotType) {
      case 'flat':
        // High speed penetrating drive, low spin
        baseSpeed = 18.0 + effectivePower * 6.5;
        minNetClearance = 1.35;
        topspin = 1.5 * spinPct;
        sidespin = dx * 0.12;
        break;

      case 'topspin':
        // Heavy topspin dipping sharply, high kick
        baseSpeed = 16.5 + effectivePower * 5.5;
        minNetClearance = 1.75;
        topspin = 6.5 * spinPct;
        sidespin = dx * 0.20;
        break;

      case 'slice':
        // Underspin that floats and skids low
        baseSpeed = 14.5 + effectivePower * 4.0;
        minNetClearance = 1.30;
        topspin = -5.5 * spinPct;
        sidespin = (Math.random() - 0.5) * 1.8;
        break;

      case 'lob':
        // High defensive or offensive rainbow lob over net rusher
        baseSpeed = 12.0 + effectivePower * 3.0;
        minNetClearance = 3.8;
        topspin = 1.5;
        break;

      case 'dropshot':
        // Soft touch shot landing short right over the net with backspin
        baseSpeed = 11.5;
        minNetClearance = 1.25;
        topspin = -7.0 * spinPct;
        break;

      case 'smash':
        // Overhead smash driven steeply downward
        baseSpeed = 22.0 + effectivePower * 8.0;
        minNetClearance = 1.3;
        topspin = 4.0;
        break;

      case 'volley':
        // Block/drive volley taken out of the air at net
        baseSpeed = 17.0 + effectivePower * 5.0;
        minNetClearance = 1.35;
        topspin = -1.0;
        break;

      case 'serve':
        // Serve hit from high toss point
        baseSpeed = 20.0 + effectivePower * 8.0 * sweetSpot;
        minNetClearance = 1.35;
        topspin = 2.0;
        break;

      case 'special':
        // Anime Ultimate Smash
        baseSpeed = 25.0 + effectivePower * 7.0;
        minNetClearance = 1.3;
        topspin = 9.0;
        ball.isSpecialActive = true;
        ball.specialType = params.specialType;
        break;

      case 'forehand':
      case 'backhand':
      default:
        // Standard rally drive
        baseSpeed = 16.5 + effectivePower * 5.5;
        minNetClearance = 1.45;
        topspin = 3.0 * spinPct;
        sidespin = dx * 0.12;
        break;
    }

    // Minimum flight time: 0.90s for opponent shots (never a lightning teleport!), 0.65s for player drives
    const minTravelTime = params.hitter === 'opponent' ? 0.90 : 0.65;
    const travelTime = Math.max(distanceZ / baseSpeed, minTravelTime);

    ball.vz = dz / travelTime;
    ball.vx = dx / travelTime;

    // Time to cross the net (at z = 0)
    const netTime = Math.abs(startZ) / Math.max(Math.abs(ball.vz), 0.1);

    // Calculate vertical launch velocity vy required to clear the net safely
    if (params.shotType === 'lob') {
      ball.vy = 9.2 + powerPct * 2.5;
    } else if (params.shotType === 'smash') {
      ball.vy = -3.5 - powerPct * 2.0;
    } else {
      const requiredNetHeight = minNetClearance;
      ball.vy = (requiredNetHeight - startY - 0.5 * this.gravity * netTime * netTime) / netTime;
      ball.vy = Math.max(ball.vy, 1.8);
    }

    ball.spinX = topspin;
    ball.spinY = sidespin;
    ball.spinZ = 0;

    ball.bounces = 0;
    ball.lastHitter = params.hitter;
    ball.hasBouncedOnPlayerSide = false;
    ball.hasBouncedOnOpponentSide = false;
    ball.isServe = !!params.isServe;
    ball.serveAttempt = params.serveAttempt || 1;
    ball.active = true;

    // Recalculate immediate speed in km/h
    const speed = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy + ball.vz * ball.vz);
    ball.speedKmH = Math.round(speed * 3.6);
  }

  /**
   * Official Tennis Court Line Call Rule:
   * A ball touching any part of the boundary line is legally IN!
   */
  public isBounceInsideCourt(x: number, z: number, isSingles: boolean = true): boolean {
    const halfW = isSingles ? COURT_HALF_WIDTH : COURT_DOUBLES_HALF_WIDTH;
    const lineTolerance = VISUAL_BALL_RADIUS * 0.85;
    return Math.abs(x) <= halfW + lineTolerance && Math.abs(z) <= COURT_HALF_LENGTH + lineTolerance;
  }

  /**
   * Service Box Verification:
   * Checks if serve bounce landed in the legally designated diagonal service box.
   */
  public isServeBounceLegal(
    x: number,
    z: number,
    serverSide: 'right' | 'left',
    targetHalf: 'player' | 'opponent'
  ): boolean {
    const lineTolerance = VISUAL_BALL_RADIUS * 0.85;
    const minZ = 0;
    const maxZ = SERVICE_LINE_Z + lineTolerance;

    // Check Z bounds within service depth
    const isZValid =
      targetHalf === 'player'
        ? z >= minZ && z <= maxZ
        : z <= -minZ && z >= -maxZ;

    if (!isZValid) return false;

    // Check diagonal X box:
    // When server serves from the Right (Deuce Court), ball must land in receiver's Left box (x <= 0).
    // When server serves from the Left (Ad Court), ball must land in receiver's Right box (x >= 0).
    if (serverSide === 'right') {
      return x <= lineTolerance && x >= -COURT_HALF_WIDTH - lineTolerance;
    } else {
      return x >= -lineTolerance && x <= COURT_HALF_WIDTH + lineTolerance;
    }
  }

  /**
   * Predict ball landing position and arrival time (for intelligent AI and player markers).
   */
  public predictLanding(ball: BallState): { x: number; y: number; z: number; time: number } {
    if (!ball.active || ball.vz === 0) {
      return { x: ball.x, y: ball.y, z: ball.z, time: 0 };
    }

    // Solve trajectory quadratic: y(t) = y0 + vy*t + 0.5*g*t^2 = BALL_RADIUS
    const a = 0.5 * this.gravity;
    const b = ball.vy;
    const c = ball.y - VISUAL_BALL_RADIUS;

    const discriminant = b * b - 4 * a * c;
    let t = 0.8;
    if (discriminant >= 0) {
      const t1 = (-b - Math.sqrt(discriminant)) / (2 * a);
      const t2 = (-b + Math.sqrt(discriminant)) / (2 * a);
      t = Math.max(t1, t2);
      if (t <= 0) t = 0.8;
    }

    return {
      x: ball.x + ball.vx * t,
      y: VISUAL_BALL_RADIUS,
      z: ball.z + ball.vz * t,
      time: t,
    };
  }
}

export const tennisPhysics = new TennisPhysics();
