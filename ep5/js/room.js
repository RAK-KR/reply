// 지하 4층: 금고 전실, 금고실, 배수 터널
import * as THREE from 'three';
import { makeKit } from '../../shared/build.js';
import { labMats, room, tube, crt, textCanvas, wallPiece, canvasTex } from '../../shared/lab.js';
import { makeCanvas, rng } from '../../shared/draw.js';

export const ANTE = { x0: -3, x1: 3, z0: 0, z1: 4, h: 2.8 };
export const VAULT = { x0: -1.6, x1: 1.6, z0: -3.4, z1: 0, h: 2.5 };
export const TUN = { x0: 3, x1: 10.5, z0: 2.8, z1: 3.8, h: 2.2 };
export const GATE_X = 9.4;

function sootCanvas(seed) {
  const c = makeCanvas(512, 512), x = c.getContext('2d'), r = rng(seed);
  const g = x.createLinearGradient(0, 0, 0, 512); g.addColorStop(0, 'rgba(8,6,4,0.92)'); g.addColorStop(0.55, 'rgba(8,6,4,0.55)'); g.addColorStop(1, 'rgba(8,6,4,0.05)');
  x.fillStyle = g; x.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 40; i++) { const px = r() * 512, py = r() * 300, rad = 40 + r() * 110; const gg = x.createRadialGradient(px, py, 0, px, py, rad); gg.addColorStop(0, 'rgba(4,3,2,0.5)'); gg.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = gg; x.fillRect(px - rad, py - rad, rad * 2, rad * 2); }
  return c;
}

export function buildRoom(scene, ctx) {
  const K = makeKit(scene);
  const M = labMats(K, { seed: 66, decay: 0.8, wet: 0.5 });
  const refs = {};
  scene.background = new THREE.Color(0x010101);
  refs.hemi = new THREE.HemisphereLight(0x5a6a74, 0x0a0c0c, 0.5); scene.add(refs.hemi);
  scene.fog = new THREE.FogExp2(0x070a0b, 0.03);

  // ── 금고 전실 ──
  room(K, M, { ...ANTE, doors: [{ side: 'n', a: -1.2, b: 1.2, h: 2.4 }, { side: 'e', a: TUN.z0, b: TUN.z1, h: 2.2 }] });
  refs.em = emergency(K, -2.6, 2.5, 3.6);
  refs.em2 = emergency(K, -0.4, 2.6, 0.25, 0xff9060);
  // 위층에서 내려온 사다리
  for (let i = 0; i < 8; i++) K.box(0.5, 0.025, 0.025, M.rust, -2.2, 0.2 + i * 0.32, 3.94);
  K.box(0.03, 2.8, 0.03, M.rust, -2.45, 1.4, 3.94); K.box(0.03, 2.8, 0.03, M.rust, -1.95, 1.4, 3.94);
  K.box(0.9, 0.02, 0.9, K.std({ color: 0x000000 }), -2.2, 2.79, 3.55);
  // 물웅덩이
  for (const [x, z, s] of [[-0.5, 2.4, 1.2], [1.8, 3.3, 0.9], [-2.0, 1.2, 0.8]]) { const p = new THREE.Mesh(new THREE.CircleGeometry(s, 24), K.std({ color: 0x1a2424, roughness: 0.05, metalness: 0.5 })); p.rotation.x = -Math.PI / 2; p.position.set(x, 0.006, z); scene.add(p); }
  // 금고 전원 분기함 (서쪽 벽) + 늘어진 케이블
  const jb = new THREE.Group();
  K.box(0.12, 0.5, 0.4, M.darkSteel, 0, 0, 0, jb);
  K.box(0.05, 0.08, 0.1, M.black, 0.08, -0.1, 0, jb);
  jb.position.set(-2.93, 1.3, 1.0); scene.add(jb); K.tag(jb, 'junction');
  refs.cableLoose = K.box(0.04, 0.9, 0.04, M.rubber, -2.8, 0.45, 1.25); refs.cableLoose.rotation.z = 0.3; refs.cableLoose.userData.id = 'junction';
  refs.cableIn = K.box(0.04, 0.7, 0.04, M.rubber, -2.88, 0.85, 0.95); refs.cableIn.visible = false;
  K.canvasPlane(textCanvas(260, 90, [{ t: '금고 전원', size: 40, bold: true, align: 'center' }], { bg: '#e0dccc', pad: 10 }), 0.3, 0.1, -2.94, 1.7, 1.0, Math.PI / 2);
  // 집수정 펌프
  const pm = new THREE.Group();
  K.cyl(0.25, 0.25, 0.6, K.std({ color: 0x2a5a7a, roughness: 0.5, metalness: 0.5 }), 0, 0.3, 0, pm);
  K.box(0.12, 0.16, 0.01, M.paper, 0, 0.35, 0.26, pm);
  pm.position.set(-2.5, 0, 2.3); scene.add(pm); K.tag(pm, 'pumptag');
  K.collide(-2.8, -2.2, 2.0, 2.6);
  // 안내판 (북쪽 벽, 금고 왼쪽)
  K.tag(K.canvasPlane(textCanvas(360, 440, [{ t: '금고 사용 안내', size: 32, bold: true }, '· 번호 네 자리', '· 금고 단말 T5', '  = 별도 회선', '· 협박을 받을 때', '  번호를 거꾸로', '· 잠금 장치 함', '  뒤판'], { bg: '#e2ddd0', size: 26 }), 0.42, 0.52, -2.1, 1.5, 0.03), 'plaque');
  // 절단 작업 공구함 + 점검 거울
  K.box(0.6, 0.3, 0.35, K.std({ color: 0xb8401e, roughness: 0.6 }), -1.9, 0.15, 0.7);
  refs.mirror = new THREE.Group();
  K.cyl(0.005, 0.005, 0.3, M.steel, 0, 0, 0, refs.mirror).rotation.z = Math.PI / 2;
  K.cyl(0.035, 0.035, 0.005, K.std({ color: 0xd8e8f0, metalness: 1, roughness: 0.05 }), 0.17, 0, 0, refs.mirror);
  refs.mirror.position.set(-1.9, 0.31, 0.7); scene.add(refs.mirror);
  K.tag(K.hit('toolbox', 0.65, 0.4, 0.4, -1.9, 0.2, 0.7), 'toolbox');
  K.collide(-2.2, -1.6, 0.52, 0.88);

  // ── 금고 문 (2001년에 경첩 쪽을 잘라 전실 쪽으로 열어 둠) ──
  const pivot = new THREE.Group(); pivot.position.set(1.2, 0, 0.02);
  const door = new THREE.Group();
  const steel = K.std({ color: 0x6f7774, roughness: 0.35, metalness: 0.85 });
  const disk = new THREE.Mesh(new THREE.CylinderGeometry(1.15, 1.15, 0.36, 40), steel); disk.rotation.x = Math.PI / 2; disk.position.set(-1.15, 1.2, -0.18); disk.castShadow = true; door.add(disk);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(1.15, 0.04, 8, 40), K.std({ color: 0x4a504e, metalness: 0.9, roughness: 0.4 })); rim.position.set(-1.15, 1.2, 0.0); door.add(rim);
  for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; const b = K.cyl(0.05, 0.05, 0.3, M.steel, -1.15 + Math.cos(a) * 1.0, 1.2 + Math.sin(a) * 1.0, -0.18, door); b.rotation.x = Math.PI / 2; }
  // 안쪽 면의 잠금 장치 함
  const mech = new THREE.Group();
  K.box(0.5, 0.36, 0.14, M.darkSteel, 0, 0, 0, mech);
  refs.cover = K.box(0.46, 0.04, 0.12, K.std({ color: 0x5a3e2a, roughness: 0.8, metalness: 0.4 }), 0, -0.2, 0, mech);
  refs.slot = K.box(0.4, 0.01, 0.08, K.std({ color: 0x000000 }), 0, -0.181, 0, mech); refs.slot.visible = false;
  mech.position.set(-0.75, 1.15, -0.43); door.add(mech);
  K.tag(mech, 'mech'); refs.mech = mech;
  pivot.add(door); scene.add(pivot); pivot.rotation.y = Math.PI / 2 * 0.98;
  refs.door = pivot;
  K.collide(0.78, 1.38, 0.05, 2.4);
  // 문틀 둘레
  const ring = new THREE.Mesh(new THREE.TorusGeometry(1.22, 0.08, 10, 40), K.std({ color: 0x3a403e, metalness: 0.8, roughness: 0.4 })); ring.position.set(0, 1.2, 0.02); scene.add(ring);

  // ── 금고 안 ──
  room(K, M, { ...VAULT, doors: [{ side: 's', a: -1.2, b: 1.2, h: 2.4 }] });
  refs.vTube = tube(K, 0, 2.45, -1.6, { len: 1.2, axis: 'z', intensity: 4.5, dist: 6, shadow: true });
  // 빈 선반
  const sm = K.std({ color: 0x5e6a66, metalness: 0.5, roughness: 0.5 });
  for (let i = 0; i < 4; i++) K.box(2.6, 0.03, 0.4, sm, 0, 0.3 + i * 0.5, -3.15);
  K.box(0.03, 2.0, 0.4, sm, -1.3, 1.0, -3.15); K.box(0.03, 2.0, 0.4, sm, 1.3, 1.0, -3.15);
  K.tag(K.canvasPlane(textCanvas(300, 120, [{ t: '2001.4.3 회수', size: 32, bold: true }, 'T-31 ~ T-38 (8개)'], { bg: '#efe9d8', size: 26 }), 0.3, 0.12, 0, 0.92, -2.94), 'shelf');
  K.collide(-1.6, 1.6, -3.4, -2.9);
  // T5 단말과 교환함 (서쪽 벽)
  K.box(0.6, 0.75, 1.1, M.cream, -1.28, 0.375, -1.6); K.box(0.65, 0.04, 1.15, M.green, -1.28, 0.77, -1.6);
  K.collide(-1.6, -0.95, -2.2, -1.0);
  refs.t5 = crt(K, M, 't5', -1.3, 0.79, -1.6, Math.PI / 2, { color: 0x8a8070 });
  const pb = new THREE.Group();
  K.box(0.08, 0.5, 0.5, M.darkSteel, 0, 0, 0, pb);
  refs.jackPlugs = [];
  for (let j = 0; j < 4; j++) { K.box(0.02, 0.05, 0.05, M.black, 0.05, 0.15 - j * 0.1, -0.1, pb); const pl = K.box(0.06, 0.04, 0.04, K.std({ color: 0xd0a020 }), 0.08, 0.15 - j * 0.1, -0.1, pb); pl.visible = false; refs.jackPlugs.push(pl); }
  K.box(0.02, 0.2, 0.02, M.rubber, 0.09, 0, 0.12, pb);
  pb.position.set(-1.56, 1.35, -0.55); scene.add(pb); K.tag(pb, 'patch');
  K.canvasPlane(textCanvas(200, 70, [{ t: '교환함', size: 36, bold: true, align: 'center' }], { bg: '#e0dccc', pad: 8 }), 0.2, 0.07, -1.55, 1.7, -0.55, Math.PI / 2);

  // ── 배수 터널 ──
  const tunWall = K.std({ map: M.concrete.map, color: 0x8a908c, roughness: 1 });
  room(K, { ...M, wall: tunWall }, { ...TUN, doors: [{ side: 'w', a: TUN.z0, b: TUN.z1, h: 2.2 }], wall: tunWall });
  const tw = new THREE.Mesh(new THREE.PlaneGeometry(7.5, 1.0), K.std({ color: 0x1a2626, roughness: 0.05, metalness: 0.5 })); tw.rotation.x = -Math.PI / 2; tw.position.set(6.75, 0.008, 3.3); scene.add(tw);
  refs.tunLight = K.pointLight(0x9fb8d0, 1.2, 9.8, 1.4, 3.3, false, 256, 8);
  // 바다 (터널 끝)
  const sea = makeCanvas(256, 256); { const x = sea.getContext('2d'); const g = x.createLinearGradient(0, 0, 0, 256); g.addColorStop(0, '#0c1a2a'); g.addColorStop(0.55, '#1a3448'); g.addColorStop(0.6, '#0a1620'); g.addColorStop(1, '#050a0e'); x.fillStyle = g; x.fillRect(0, 0, 256, 256); x.fillStyle = '#cfe0ea'; x.beginPath(); x.arc(180, 60, 10, 0, 7); x.fill(); for (let i = 0; i < 40; i++) { x.fillStyle = 'rgba(200,220,235,0.4)'; x.fillRect(Math.random() * 256, 150 + Math.random() * 30, 10, 1); } }
  K.glowPlane(sea, 1.0, 2.2, TUN.x1 - 0.02, 1.1, 3.3, -Math.PI / 2);
  // 철문 (쇠창살) + 자물쇠
  const gate = new THREE.Group();
  for (let i = 0; i < 6; i++) K.box(0.04, 2.1, 0.04, M.rust, 0, 1.05, -0.45 + i * 0.18, gate);
  K.box(0.05, 0.05, 1.0, M.rust, 0, 1.9, -0.05, gate); K.box(0.05, 0.05, 1.0, M.rust, 0, 0.3, -0.05, gate);
  gate.position.set(GATE_X, 0, TUN.z1 - 0.05); scene.add(gate); K.tag(gate, 'gate');
  refs.gate = new THREE.Group(); refs.gate.position.set(GATE_X, 0, TUN.z1 - 0.05); scene.add(refs.gate);
  gate.position.set(0, 0, 0); refs.gate.add(gate);
  refs.lock = new THREE.Group();
  K.box(0.1, 0.13, 0.05, K.std({ color: 0x7a5a3a, metalness: 0.6, roughness: 0.7 }), 0, 0, 0, refs.lock);
  const sh = new THREE.Mesh(new THREE.TorusGeometry(0.035, 0.008, 6, 12, Math.PI), M.rust); sh.position.y = 0.065; refs.lock.add(sh);
  for (let i = 0; i < 4; i++) K.box(0.016, 0.03, 0.03, K.std({ color: 0x5a4a3a }), -0.03 + i * 0.02, -0.02, 0.025, refs.lock);
  refs.lock.position.set(GATE_X - 0.06, 1.1, TUN.z0 + 0.5); scene.add(refs.lock); K.tag(refs.lock, 'gate');
  const chain = new THREE.Group(); for (let i = 0; i < 6; i++) { const l = K.box(0.03, 0.06, 0.02, M.rust, 0, i * 0.05, 0, chain); l.rotation.y = i % 2 ? 1.5 : 0; } chain.position.set(GATE_X - 0.06, 0.95, TUN.z0 + 0.5); scene.add(chain); refs.chain = chain;
  K.collide(GATE_X - 0.08, GATE_X + 0.08, TUN.z0, TUN.z1, () => ctx.S.gateOpen);
  // 깡통 상자 (철문이 열리면)
  refs.box = new THREE.Group();
  K.box(0.24, 0.12, 0.16, K.std({ color: 0x8a6a4a, metalness: 0.6, roughness: 0.6 }), 0, 0.06, 0, refs.box);
  refs.box.position.set(GATE_X - 0.5, 0, 3.0); scene.add(refs.box); K.tag(refs.box, 'tinbox'); refs.box.visible = false;
  K.hit('tinbox', 0.35, 0.3, 0.3, GATE_X - 0.5, 0.12, 3.0).visible = true;

  // ── 그을음 (불이 없던 일이 되면 사라진다) ──
  const sootMat = new THREE.MeshBasicMaterial({ map: canvasTex(sootCanvas(3)), transparent: true, depthWrite: false, opacity: 1 });
  const sootMat2 = sootMat.clone(); sootMat2.map = canvasTex(sootCanvas(9));
  refs.soot = [sootMat, sootMat2];
  const sp = (w, h, x, y, z, ry, m) => { const p = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m); p.position.set(x, y, z); p.rotation.y = ry; p.userData.noHit = true; p.renderOrder = 2; scene.add(p); };
  sp(1.8, 2.8, -2.1, 1.4, 0.04, 0, sootMat); sp(1.8, 2.8, 2.1, 1.4, 0.04, 0, sootMat2);
  sp(4, 2.8, -2.96, 1.4, 2, Math.PI / 2, sootMat2); sp(6, 2.8, 0, 1.4, 3.96, Math.PI, sootMat);
  sp(3.4, 2.5, -1.56, 1.25, -1.7, Math.PI / 2, sootMat); sp(3.4, 2.5, 1.56, 1.25, -1.7, -Math.PI / 2, sootMat2); sp(3.2, 2.5, 0, 1.25, -3.36, 0, sootMat);
  const sc = new THREE.Mesh(new THREE.PlaneGeometry(6, 4), sootMat2); sc.rotation.x = Math.PI / 2; sc.position.set(0, 2.78, 2); sc.userData.noHit = true; scene.add(sc);

  const areas = [
    { x0: ANTE.x0, x1: ANTE.x1, z0: ANTE.z0, z1: ANTE.z1 },
    { x0: VAULT.x0, x1: VAULT.x1, z0: VAULT.z0, z1: VAULT.z1 },
    { x0: -1.2, x1: 1.2, z0: -0.4, z1: 0.4, tight: true },
    { x0: TUN.x0, x1: GATE_X + 0.1, z0: TUN.z0, z1: TUN.z1 },
    { x0: GATE_X - 0.2, x1: TUN.x1, z0: TUN.z0, z1: TUN.z1, open: () => ctx.S.gateOpen },
    { x0: 2.6, x1: 3.4, z0: TUN.z0 + 0.2, z1: TUN.z1 - 0.2, tight: true },
  ];
  return { refs, areas, colliders: K.colliders };
}

function emergency(K, x, y, z, color = 0xffb070) {
  const g = new THREE.Group();
  K.box(0.3, 0.1, 0.1, K.std({ color: 0xdedad0 }), 0, 0, 0, g);
  const m = K.std({ color: 0xffeecc, emissive: color, emissiveIntensity: 2 });
  K.box(0.08, 0.05, 0.03, m, -0.08, -0.02, 0.06, g); K.box(0.08, 0.05, 0.03, m, 0.08, -0.02, 0.06, g);
  K.add(g, x, y, z);
  return { m, l: K.pointLight(color, 2.8, x, y - 0.2, z, false, 256, 8) };
}
