import * as THREE from 'three';
import { CourtTheme } from '../types/tennis';
import {
  COURT_HALF_LENGTH,
  COURT_HALF_WIDTH,
  COURT_DOUBLES_HALF_WIDTH,
  SERVICE_LINE_Z,
  NET_HEIGHT_CENTER,
  NET_HEIGHT_POSTS,
} from './physics';

/**
 * Creates procedural texture for the tennis court markings
 */
function createCourtLinesTexture(theme: CourtTheme): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 2048;
  const ctx = canvas.getContext('2d')!;

  if (theme === 'sakura') {
    // Ultra-dark tournament navy blue inner court with dark apron (zero glare, maximum optic yellow ball contrast)
    ctx.fillStyle = '#060b14';
    ctx.fillRect(0, 0, 1024, 2048);
    ctx.fillStyle = '#0d1e36'; // Rich deep dark navy
    const innerMarginX = (1 - COURT_DOUBLES_HALF_WIDTH / 8.5) * 512;
    const innerMarginY = (1 - COURT_HALF_LENGTH / 15.0) * 1024;
    ctx.fillRect(innerMarginX, innerMarginY, 1024 - innerMarginX * 2, 2048 - innerMarginY * 2);
  } else if (theme === 'cyberpunk') {
    ctx.fillStyle = '#020408';
    ctx.fillRect(0, 0, 1024, 2048);
    ctx.fillStyle = '#050e1a'; // Ultra-dark graphite navy
    const innerMarginX = (1 - COURT_DOUBLES_HALF_WIDTH / 8.5) * 512;
    const innerMarginY = (1 - COURT_HALF_LENGTH / 15.0) * 1024;
    ctx.fillRect(innerMarginX, innerMarginY, 1024 - innerMarginX * 2, 2048 - innerMarginY * 2);
  } else if (theme === 'volcano') {
    ctx.fillStyle = '#070504';
    ctx.fillRect(0, 0, 1024, 2048);
    ctx.fillStyle = '#1c0d08'; // Very deep dark terracotta clay (matte, dark, non-glaring)
    const innerMarginX = (1 - COURT_DOUBLES_HALF_WIDTH / 8.5) * 512;
    const innerMarginY = (1 - COURT_HALF_LENGTH / 15.0) * 1024;
    ctx.fillRect(innerMarginX, innerMarginY, 1024 - innerMarginX * 2, 2048 - innerMarginY * 2);
  } else {
    ctx.fillStyle = '#03050a';
    ctx.fillRect(0, 0, 1024, 2048);
    ctx.fillStyle = '#071324'; // Deep dark midnight blue
    const innerMarginX = (1 - COURT_DOUBLES_HALF_WIDTH / 8.5) * 512;
    const innerMarginY = (1 - COURT_HALF_LENGTH / 15.0) * 1024;
    ctx.fillRect(innerMarginX, innerMarginY, 1024 - innerMarginX * 2, 2048 - innerMarginY * 2);
  }

  // Crisp, high-contrast white tennis lines
  const lineColor = '#ffffff';
  ctx.strokeStyle = lineColor;
  ctx.lineWidth = 12;

  const toPxX = (x: number) => 512 + (x / 8.5) * 512;
  const toPxY = (z: number) => 1024 + (z / 15.0) * 1024;

  const leftD = toPxX(-COURT_DOUBLES_HALF_WIDTH);
  const rightD = toPxX(COURT_DOUBLES_HALF_WIDTH);
  const topB = toPxY(-COURT_HALF_LENGTH);
  const botB = toPxY(COURT_HALF_LENGTH);
  ctx.strokeRect(leftD, topB, rightD - leftD, botB - topB);

  const leftS = toPxX(-COURT_HALF_WIDTH);
  const rightS = toPxX(COURT_HALF_WIDTH);
  ctx.beginPath();
  ctx.moveTo(leftS, topB);
  ctx.lineTo(leftS, botB);
  ctx.moveTo(rightS, topB);
  ctx.lineTo(rightS, botB);
  ctx.stroke();

  const servTop = toPxY(-SERVICE_LINE_Z);
  const servBot = toPxY(SERVICE_LINE_Z);
  ctx.beginPath();
  ctx.moveTo(leftS, servTop);
  ctx.lineTo(rightS, servTop);
  ctx.moveTo(leftS, servBot);
  ctx.lineTo(rightS, servBot);
  ctx.stroke();

  const netY = toPxY(0);
  ctx.beginPath();
  ctx.moveTo(512, servTop);
  ctx.lineTo(512, servBot);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(512, topB);
  ctx.lineTo(512, topB + 30);
  ctx.moveTo(512, botB);
  ctx.lineTo(512, botB - 30);
  ctx.stroke();

  ctx.strokeStyle = theme === 'cyberpunk' ? '#ff007f' : '#cbd5e1';
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.moveTo(leftD - 20, netY);
  ctx.lineTo(rightD + 20, netY);
  ctx.stroke();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/**
 * Procedural Net Mesh Texture
 */
function createNetTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d')!;

  ctx.clearRect(0, 0, 64, 64);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
  ctx.lineWidth = 1.8;

  for (let i = 0; i <= 64; i += 8) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, 64);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, i);
    ctx.lineTo(64, i);
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(32, 4);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/**
 * Cute 3D Potato Spectator
 */
class PotatoSpectator {
  public group: THREE.Group;
  public basePosY: number;
  public basePos: THREE.Vector3;
  private leftArm: THREE.Mesh;
  private rightArm: THREE.Mesh;
  private body: THREE.Mesh;
  public jumpTime: number = 0;
  public isJumping: boolean = false;
  private randomPhase: number;

  constructor(x: number, y: number, z: number, rotationY: number, potatoType: number) {
    this.group = new THREE.Group();
    this.basePos = new THREE.Vector3(x, y, z);
    this.basePosY = y;
    this.group.position.copy(this.basePos);
    this.group.rotation.y = rotationY;
    this.randomPhase = Math.random() * Math.PI * 2;

    const potatoColors = [0xd4a373, 0xdda15e, 0xbc6c25, 0xcd853f, 0xc89758];
    const pColor = potatoColors[potatoType % potatoColors.length];

    const potatoMat = new THREE.MeshStandardMaterial({
      color: pColor,
      roughness: 0.75,
      metalness: 0.05,
    });

    const potatoGeo = new THREE.SphereGeometry(0.32, 12, 12);
    const posAttr = potatoGeo.attributes.position;
    for (let i = 0; i < posAttr.count; i++) {
      const vx = posAttr.getX(i);
      const vy = posAttr.getY(i);
      const vz = posAttr.getZ(i);
      const bump = 1.0 + Math.sin(vx * 6 + vy * 5) * 0.06;
      posAttr.setXYZ(i, vx * 0.95 * bump, vy * 1.25 * bump, vz * 0.9 * bump);
    }
    potatoGeo.computeVertexNormals();

    this.body = new THREE.Mesh(potatoGeo, potatoMat);
    this.body.position.y = 0.38;
    this.body.castShadow = true;
    this.group.add(this.body);

    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x1e293b });
    const glintMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

    [-0.09, 0.09].forEach((eyeX) => {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 8), eyeMat);
      eye.position.set(eyeX, 0.42, 0.26);
      this.group.add(eye);

      const glint = new THREE.Mesh(new THREE.SphereGeometry(0.016, 6, 6), glintMat);
      glint.position.set(eyeX + 0.012, 0.435, 0.285);
      this.group.add(glint);
    });

    const blushMat = new THREE.MeshBasicMaterial({ color: 0xf43f5e });
    [-0.14, 0.14].forEach((bx) => {
      const blush = new THREE.Mesh(new THREE.CircleGeometry(0.04, 8), blushMat);
      blush.position.set(bx, 0.36, 0.28);
      this.group.add(blush);
    });

    const mouthMat = new THREE.MeshBasicMaterial({ color: 0x881337 });
    const mouth = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.015, 8), mouthMat);
    mouth.rotation.x = Math.PI / 2;
    mouth.position.set(0, 0.33, 0.28);
    this.group.add(mouth);

    const armMat = new THREE.MeshStandardMaterial({ color: pColor, roughness: 0.8 });
    const armGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.18, 6);

    this.leftArm = new THREE.Mesh(armGeo, armMat);
    this.leftArm.position.set(-0.32, 0.36, 0);
    this.leftArm.rotation.z = 0.6;
    this.group.add(this.leftArm);

    this.rightArm = new THREE.Mesh(armGeo, armMat);
    this.rightArm.position.set(0.32, 0.36, 0);
    this.rightArm.rotation.z = -0.6;
    this.group.add(this.rightArm);

    const bandMat = new THREE.MeshStandardMaterial({
      color: [0xef4444, 0x3b82f6, 0x10b981, 0xf59e0b, 0x8b5cf6][potatoType % 5],
      roughness: 0.5,
    });
    const headband = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.035, 6, 16), bandMat);
    headband.rotation.x = Math.PI / 2;
    headband.position.set(0, 0.56, 0);
    this.group.add(headband);
  }

  public triggerJump() {
    this.isJumping = true;
    this.jumpTime = 0;
  }

  public update(dt: number, globalCheer: boolean) {
    if (globalCheer && !this.isJumping) {
      this.triggerJump();
    }

    if (this.isJumping) {
      this.jumpTime += dt * 5.5;
      const phase = this.jumpTime * Math.PI;
      const jumpHeight = Math.max(0, Math.sin(phase) * 0.7);

      this.group.position.y = this.basePosY + jumpHeight;

      if (jumpHeight > 0.05) {
        this.body.scale.set(0.85, 1.25, 0.85);
        this.leftArm.rotation.z = 2.2 + Math.sin(this.jumpTime * 14) * 0.4;
        this.rightArm.rotation.z = -2.2 - Math.sin(this.jumpTime * 14) * 0.4;
      } else {
        this.body.scale.set(1.15, 0.85, 1.15);
        this.leftArm.rotation.z = 0.6;
        this.rightArm.rotation.z = -0.6;
      }

      if (this.jumpTime >= Math.PI * 2) {
        this.isJumping = false;
        this.group.position.y = this.basePosY;
        this.body.scale.set(1, 1, 1);
        this.leftArm.rotation.z = 0.6;
        this.rightArm.rotation.z = -0.6;
      }
    } else {
      const t = performance.now() * 0.003 + this.randomPhase;
      this.body.rotation.z = Math.sin(t) * 0.08;
      this.group.position.y = this.basePosY + Math.abs(Math.sin(t * 1.5)) * 0.03;
      this.leftArm.rotation.z = 0.6 + Math.sin(t * 2) * 0.15;
      this.rightArm.rotation.z = -0.6 - Math.sin(t * 2) * 0.15;
    }
  }
}

export class CourtBuilder {
  public courtGroup: THREE.Group;
  public particles: THREE.Points | null = null;
  public theme: CourtTheme;
  private potatoes: PotatoSpectator[] = [];
  public potatoCheerActive: boolean = false;
  private cheerTimer: number = 0;

  constructor(theme: CourtTheme) {
    this.theme = theme;
    this.courtGroup = new THREE.Group();
    this.buildCourt();
    this.buildNet();
    this.buildStadium();
    this.buildPotatoSpectators();
    this.buildThemeProps();
    this.buildParticles();
  }

  private buildCourt() {
    const courtGeo = new THREE.PlaneGeometry(17, 30);
    const courtTex = createCourtLinesTexture(this.theme);

    const courtMat = new THREE.MeshStandardMaterial({
      map: courtTex,
      roughness: 0.92,
      metalness: 0.0,
    });
    courtMat.polygonOffset = true;
    courtMat.polygonOffsetFactor = -1;
    courtMat.polygonOffsetUnits = -1;

    const courtMesh = new THREE.Mesh(courtGeo, courtMat);
    courtMesh.rotation.x = -Math.PI / 2;
    courtMesh.position.y = 0.01;
    courtMesh.receiveShadow = true;
    this.courtGroup.add(courtMesh);

    const outerGeo = new THREE.PlaneGeometry(80, 80);
    let outerColor = 0x060b14;
    if (this.theme === 'sakura') outerColor = 0x060b14;
    if (this.theme === 'cyberpunk') outerColor = 0x020408;
    if (this.theme === 'volcano') outerColor = 0x070504;
    if (this.theme === 'celestial') outerColor = 0x03050a;

    const outerMat = new THREE.MeshStandardMaterial({
      color: outerColor,
      roughness: 0.95,
      metalness: 0.0,
    });
    const outerMesh = new THREE.Mesh(outerGeo, outerMat);
    outerMesh.rotation.x = -Math.PI / 2;
    outerMesh.position.y = 0;
    outerMesh.receiveShadow = true;
    this.courtGroup.add(outerMesh);
  }

  private buildNet() {
    const netGroup = new THREE.Group();
    const netWidth = COURT_DOUBLES_HALF_WIDTH * 2 + 1.2;
    const netHeight = NET_HEIGHT_CENTER;

    const netGeo = new THREE.PlaneGeometry(netWidth, netHeight);
    const netTex = createNetTexture();
    const netMat = new THREE.MeshStandardMaterial({
      map: netTex,
      transparent: true,
      opacity: 0.85,
      side: THREE.DoubleSide,
      roughness: 0.3,
    });
    const netMesh = new THREE.Mesh(netGeo, netMat);
    netMesh.position.set(0, netHeight / 2, 0);
    netGroup.add(netMesh);

    const tapeGeo = new THREE.BoxGeometry(netWidth, 0.08, 0.04);
    const tapeMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.3,
      metalness: 0.1,
    });
    const tapeMesh = new THREE.Mesh(tapeGeo, tapeMat);
    tapeMesh.position.set(0, netHeight, 0);
    tapeMesh.castShadow = true;
    netGroup.add(tapeMesh);

    const postGeo = new THREE.CylinderGeometry(0.06, 0.06, NET_HEIGHT_POSTS, 12);
    const postMat = new THREE.MeshStandardMaterial({
      color: this.theme === 'cyberpunk' ? 0x00f5ff : 0x0f172a,
      roughness: 0.25,
      metalness: 0.8,
    });

    [-netWidth / 2, netWidth / 2].forEach((px) => {
      const post = new THREE.Mesh(postGeo, postMat);
      post.position.set(px, NET_HEIGHT_POSTS / 2, 0);
      post.castShadow = true;
      netGroup.add(post);

      const knob = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 8), postMat);
      knob.position.set(px, NET_HEIGHT_POSTS, 0);
      netGroup.add(knob);
    });

    const chairGroup = new THREE.Group();
    chairGroup.position.set(-COURT_DOUBLES_HALF_WIDTH - 2.0, 0, 0);

    const legGeo = new THREE.CylinderGeometry(0.04, 0.04, 2.8, 8);
    const frameMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.6 });

    [-0.35, 0.35].forEach((cx) => {
      [-0.35, 0.35].forEach((cz) => {
        const leg = new THREE.Mesh(legGeo, frameMat);
        leg.position.set(cx, 1.4, cz);
        leg.castShadow = true;
        chairGroup.add(leg);
      });
    });

    const seatMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.8, 0.1, 0.8),
      new THREE.MeshStandardMaterial({ color: 0xef4444 })
    );
    seatMesh.position.y = 2.4;
    seatMesh.castShadow = true;
    chairGroup.add(seatMesh);

    const umpirePotato = new PotatoSpectator(0, 2.5, 0, Math.PI / 2, 0);
    chairGroup.add(umpirePotato.group);
    this.potatoes.push(umpirePotato);

    netGroup.add(chairGroup);
    this.courtGroup.add(netGroup);
  }

  private buildStadium() {
    const standMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.7,
      metalness: 0.2,
    });

    [-18, 18].forEach((zPos) => {
      for (let tier = 0; tier < 4; tier++) {
        const stepGeo = new THREE.BoxGeometry(32, 0.6, 1.2);
        const step = new THREE.Mesh(stepGeo, standMat);
        const sign = zPos > 0 ? 1 : -1;
        step.position.set(0, 0.3 + tier * 0.6, zPos + sign * tier * 1.2);
        step.castShadow = true;
        step.receiveShadow = true;
        this.courtGroup.add(step);
      }
    });

    [-12, 12].forEach((xPos) => {
      for (let tier = 0; tier < 4; tier++) {
        const stepGeo = new THREE.BoxGeometry(1.2, 0.6, 28);
        const step = new THREE.Mesh(stepGeo, standMat);
        const sign = xPos > 0 ? 1 : -1;
        step.position.set(xPos + sign * tier * 1.2, 0.3 + tier * 0.6, 0);
        step.castShadow = true;
        step.receiveShadow = true;
        this.courtGroup.add(step);
      }
    });

    const lightTowerGeo = new THREE.CylinderGeometry(0.25, 0.35, 12, 8);
    const lightTowerMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      metalness: 0.8,
      roughness: 0.3,
    });
    const lampMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

    const cornerCoords = [
      [-14, -18],
      [14, -18],
      [-14, 18],
      [14, 18],
    ];

    cornerCoords.forEach(([cx, cz]) => {
      const pole = new THREE.Mesh(lightTowerGeo, lightTowerMat);
      pole.position.set(cx, 6, cz);
      pole.castShadow = true;
      this.courtGroup.add(pole);

      const bracket = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.2, 0.4), lightTowerMat);
      bracket.position.set(cx, 12, cz);
      bracket.lookAt(0, 2, 0);
      this.courtGroup.add(bracket);

      const face = new THREE.Mesh(new THREE.PlaneGeometry(1.9, 0.9), lampMat);
      face.position.set(cx, 12, cz);
      face.lookAt(0, 2, 0);
      face.translateZ(0.22);
      this.courtGroup.add(face);
    });
  }

  private buildPotatoSpectators() {
    let potatoCount = 0;

    for (let i = 0; i < 14; i++) {
      const tier = i % 3;
      const x = -8 + (i * 16) / 14;
      const y = 0.6 + tier * 0.6;
      const z = 18 + tier * 1.2;
      const potato = new PotatoSpectator(x, y, z, Math.PI, potatoCount++);
      this.courtGroup.add(potato.group);
      this.potatoes.push(potato);
    }

    for (let i = 0; i < 14; i++) {
      const tier = i % 3;
      const x = -8 + (i * 16) / 14;
      const y = 0.6 + tier * 0.6;
      const z = -18 - tier * 1.2;
      const potato = new PotatoSpectator(x, y, z, 0, potatoCount++);
      this.courtGroup.add(potato.group);
      this.potatoes.push(potato);
    }

    for (let i = 0; i < 12; i++) {
      const tier = i % 3;
      const x = 12 + tier * 1.2;
      const y = 0.6 + tier * 0.6;
      const z = -7 + (i * 14) / 12;
      const potato = new PotatoSpectator(x, y, z, -Math.PI / 2, potatoCount++);
      this.courtGroup.add(potato.group);
      this.potatoes.push(potato);
    }

    for (let i = 0; i < 12; i++) {
      const tier = i % 3;
      const x = -12 - tier * 1.2;
      const y = 0.6 + tier * 0.6;
      const z = -7 + (i * 14) / 12;
      const potato = new PotatoSpectator(x, y, z, Math.PI / 2, potatoCount++);
      this.courtGroup.add(potato.group);
      this.potatoes.push(potato);
    }
  }

  public triggerPotatoJump() {
    this.potatoCheerActive = true;
    this.cheerTimer = 2.0;
    this.potatoes.forEach((p, idx) => {
      setTimeout(() => {
        p.triggerJump();
      }, (idx % 8) * 45);
    });
  }

  private buildThemeProps() {
    if (this.theme === 'sakura') {
      [-22, 22].forEach((tz) => {
        const torii = new THREE.Group();
        torii.position.set(0, 0, tz);

        const pillarGeo = new THREE.CylinderGeometry(0.3, 0.35, 7, 12);
        const redMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.4 });
        const blackMat = new THREE.MeshStandardMaterial({ color: 0x171717, roughness: 0.5 });

        [-3.5, 3.5].forEach((px) => {
          const p = new THREE.Mesh(pillarGeo, redMat);
          p.position.set(px, 3.5, 0);
          p.castShadow = true;
          torii.add(p);
        });

        const topBeam = new THREE.Mesh(new THREE.BoxGeometry(9.5, 0.6, 0.8), redMat);
        topBeam.position.set(0, 6.8, 0);
        torii.add(topBeam);

        const blackCap = new THREE.Mesh(new THREE.BoxGeometry(10.2, 0.2, 0.9), blackMat);
        blackCap.position.set(0, 7.15, 0);
        torii.add(blackCap);

        this.courtGroup.add(torii);
      });
    } else if (this.theme === 'cyberpunk') {
      const bannerGeo = new THREE.PlaneGeometry(12, 2.5);
      const neonMat = new THREE.MeshBasicMaterial({
        color: 0x00f5ff,
        side: THREE.DoubleSide,
      });

      [-21, 21].forEach((bz) => {
        const b = new THREE.Mesh(bannerGeo, neonMat);
        b.position.set(0, 4.5, bz);
        b.rotation.y = bz > 0 ? Math.PI : 0;
        this.courtGroup.add(b);
      });
    } else if (this.theme === 'volcano') {
      const rockGeo = new THREE.DodecahedronGeometry(2.5, 1);
      const rockMat = new THREE.MeshStandardMaterial({ color: 0x292524, roughness: 0.9 });
      [-17, 17].forEach((rx) => {
        const rock = new THREE.Mesh(rockGeo, rockMat);
        rock.position.set(rx, 1, 0);
        rock.castShadow = true;
        this.courtGroup.add(rock);
      });
    } else if (this.theme === 'celestial') {
      const colGeo = new THREE.CylinderGeometry(0.45, 0.5, 9, 16);
      const goldMat = new THREE.MeshStandardMaterial({
        color: 0xf59e0b,
        metalness: 0.9,
        roughness: 0.2,
      });
      [-15, 15].forEach((cx) => {
        [-15, 15].forEach((cz) => {
          const col = new THREE.Mesh(colGeo, goldMat);
          col.position.set(cx, 4.5, cz);
          col.castShadow = true;
          this.courtGroup.add(col);
        });
      });
    }
  }

  private buildParticles() {
    const count = 280;
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 40;
      positions[i * 3 + 1] = Math.random() * 8 + 0.5;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 45;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    let pColor = 0xfbcfe8;
    if (this.theme === 'cyberpunk') pColor = 0x38bdf8;
    if (this.theme === 'volcano') pColor = 0xf97316;
    if (this.theme === 'celestial') pColor = 0xfef08a;

    const mat = new THREE.PointsMaterial({
      color: pColor,
      size: 0.18,
      transparent: true,
      opacity: 0.75,
    });

    this.particles = new THREE.Points(geo, mat);
    this.courtGroup.add(this.particles);
  }

  public update(dt: number) {
    if (this.particles) {
      const posAttr = this.particles.geometry.attributes.position as THREE.BufferAttribute;
      const arr = posAttr.array as Float32Array;
      for (let i = 0; i < arr.length; i += 3) {
        arr[i + 1] -= dt * 0.8;
        arr[i] += Math.sin(arr[i + 1] + i) * dt * 0.3;
        if (arr[i + 1] < 0.2) {
          arr[i + 1] = 8.5;
        }
      }
      posAttr.needsUpdate = true;
    }

    if (this.cheerTimer > 0) {
      this.cheerTimer -= dt;
      if (this.cheerTimer <= 0) {
        this.potatoCheerActive = false;
      }
    }

    for (let i = 0; i < this.potatoes.length; i++) {
      this.potatoes[i].update(dt, this.potatoCheerActive);
    }
  }
}
