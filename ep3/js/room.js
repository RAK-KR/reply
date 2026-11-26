// 지하 2층: 승강기 통로 앞, 실험실(공명로), 제어실 — 불탄 층
import * as THREE from 'three';
import { makeKit } from '../../shared/build.js';
import { labMats, room, tube, crt, textCanvas, wallPiece } from '../../shared/lab.js';

export const COR = { x0: -1, x1: 1, z0: 2, z1: 5.5, h: 2.8 };
export const LAB = { x0: -5, x1: 3, z0: -4, z1: 2, h: 3.2 };
export const CTRL = { x0: 3, x1: 7, z0: -4, z1: 0, h: 3.2 };
export const CDOOR = { z0: -0.9, z1: -0.1 };
export const HATCH = { x: 4.4, z: -1.6 };

export function buildRoom(scene, ctx) {
  const K = makeKit(scene);
  const M = labMats(K, { seed: 44, decay: 0.9, soot: 0.75 });
  const refs = {};
  scene.background = new THREE.Color(0x010101);
  scene.add(new THREE.HemisphereLight(0x4a4a48, 0x0a0806, 0.2));
  // 연기 먼지
  const fog = new THREE.FogExp2(0x0c0a08, 0.05); scene.fog = fog;

  // ── 승강기 통로 앞 ──
  room(K, M, { ...COR, doors: [{ side: 'n', a: -0.6, b: 0.6, h: 2.2 }] });
  const sh = new THREE.Group();
  for (let i = 0; i < 8; i++) K.box(0.5, 0.025, 0.025, M.rust, 0, 0.2 + i * 0.3, 0, sh);
  K.box(0.03, 2.6, 0.03, M.rust, -0.25, 1.2, 0, sh); K.box(0.03, 2.6, 0.03, M.rust, 0.25, 1.2, 0, sh);
  sh.position.set(0, 0, 5.42); scene.add(sh);
  refs.emA = emergency(K, 0, 2.6, 4.6);
  // 비상 도구함
  const tb = new THREE.Group();
  K.box(0.1, 0.7, 0.5, K.std({ color: 0xa82020 }), 0, 0, 0, tb);
  refs.bar = K.box(0.03, 0.6, 0.03, K.std({ color: 0xc04030, metalness: 0.6, roughness: 0.4 }), -0.06, 0, 0.1, tb);
  K.canvasPlane(textCanvas(220, 80, [{ t: '비상 도구', size: 40, bold: true, align: 'center', color: '#fff' }], { bg: '#a82020', pad: 6 }), 0.3, 0.1, -0.055, 0.28, 0, -Math.PI / 2, 0.6, tb);
  tb.position.set(0.94, 1.2, 3.6); scene.add(tb); K.tag(tb, 'toolbox');

  // ── 실험실 ──
  const labRoom = room(K, M, { ...LAB, doors: [{ side: 's', a: -0.6, b: 0.6, h: 2.2 }, { side: 'e', a: CDOOR.z0, b: CDOOR.z1, h: 2.2 }, { side: 'w', a: -2.1, b: -1.1, h: 2.1 }, { side: 'e', a: -3.5, b: -1.5, h: 2.2 }] });
  // 제어실 유리창 아래쪽 벽 (창은 깨져서 틀만)
  wallPiece(K, -3.5, -1.5, 0, 1.0, LAB.x1, 'w', M.wall, LAB.h);
  wallPiece(K, -3.5, -1.5, 0, 1.0, LAB.x1 + 0.02, 'e', M.wall, LAB.h);
  K.box(0.08, 0.06, 2.0, M.darkSteel, LAB.x1, 1.03, -2.5); K.box(0.08, 0.06, 2.0, M.darkSteel, LAB.x1, 2.18, -2.5);
  for (const z of [-3.5, -2.5, -1.5]) K.box(0.08, 1.2, 0.06, M.darkSteel, LAB.x1, 1.6, z);
  for (let i = 0; i < 4; i++) { const g = K.box(0.01, 0.25 + i * 0.07, 0.3, M.glass, LAB.x1, 1.2 + i * 0.1, -3.2 + i * 0.5); g.rotation.x = i * 0.6; }
  K.collide(LAB.x1 - 0.06, LAB.x1 + 0.06, -3.5, -1.5);
  refs.labTube = tube(K, -1, 3.15, 0, { len: 1.3, intensity: 3.2, dist: 8, color: 0xfff0d8, shadow: true });
  refs.labTube.set(true); refs.labTube.flicker(0.9);
  refs.emB = emergency(K, -4.6, 2.6, -0.6);
  // 공명로 (불탄 고리 장치)
  const res = new THREE.Group();
  const ringMat = K.std({ color: 0x3a3430, roughness: 0.6, metalness: 0.7 });
  const ring = new THREE.Mesh(new THREE.TorusGeometry(1.0, 0.16, 16, 48), ringMat); ring.position.y = 1.55; ring.castShadow = true; res.add(ring);
  const ring2 = new THREE.Mesh(new THREE.TorusGeometry(0.72, 0.05, 10, 40), K.std({ color: 0x6a4a2a, metalness: 0.8, roughness: 0.4 })); ring2.position.y = 1.55; res.add(ring2);
  for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; const c = K.box(0.12, 0.2, 0.36, M.charred, Math.cos(a) * 1.0, 1.55 + Math.sin(a) * 1.0, 0, res); c.rotation.z = a; }
  K.box(2.4, 0.4, 0.9, M.darkSteel, 0, 0.2, 0, res);
  K.box(0.3, 0.9, 0.4, M.darkSteel, -0.9, 0.8, 0, res); K.box(0.3, 0.9, 0.4, M.darkSteel, 0.9, 0.8, 0, res);
  res.position.set(-2.2, 0, -3.2); scene.add(res); K.tag(res, 'resonator');
  const rl = K.std({ color: 0xc0a020, metalness: 0.5, roughness: 0.5 });
  K.box(3.6, 0.05, 0.05, rl, -2.2, 1.0, -2.0); K.box(3.6, 0.05, 0.05, rl, -2.2, 0.55, -2.0);
  for (let i = 0; i < 5; i++) K.box(0.05, 1.0, 0.05, rl, -4 + i * 0.9, 0.5, -2.0);
  K.collide(-4.1, -0.3, -4, -1.95);
  // 케이블 다발 (공명로 → 제어실)
  for (let i = 0; i < 3; i++) K.box(3.8, 0.06, 0.06, M.rubber, 0.9, 0.03, -3.0 + i * 0.12);
  // 방화문 (서쪽, 휘어서 안 열림)
  const fd = K.box(0.08, 2.1, 1.0, K.std({ color: 0x4a3a30, roughness: 0.8, metalness: 0.4 }), -4.98, 1.05, -1.6); fd.rotation.y = 0.04;
  K.tag(fd, 'firedoor');
  K.canvasPlane(textCanvas(256, 80, [{ t: '방화문 · B3 계단', size: 30, bold: true, align: 'center' }], { bg: '#d8d0b8', pad: 10 }), 0.42, 0.13, -4.93, 2.3, -1.6, Math.PI / 2);
  // 화이트보드
  const wbc = textCanvas(512, 300, [{ t: '동조 주기 27', size: 40, font: '"Nanum Pen Script", cursive', color: '#1a3a8a' }, { t: 'T1~T4 메인 / T5 금고 별도', size: 34, font: '"Nanum Pen Script", cursive', color: '#1a3a8a' }, { t: '외부에 절대 말하지 말 것', size: 34, font: '"Nanum Pen Script", cursive', color: '#a01818' }], { bg: '#d8d6cc' });
  { const x = wbc.getContext('2d'); const g = x.createLinearGradient(0, 300, 0, 120); g.addColorStop(0, 'rgba(10,8,6,0.95)'); g.addColorStop(1, 'rgba(10,8,6,0)'); x.fillStyle = g; x.fillRect(0, 0, 512, 300); }
  K.tag(K.canvasPlane(wbc, 1.4, 0.82, -4.97, 1.6, -3.1, Math.PI / 2), 'whiteboard');
  // 안전 수칙 포스터 (아래 절반이 탔다)
  const pc = textCanvas(400, 560, [{ t: '실험실 안전 수칙', size: 34, bold: true, align: 'center' }, '', '1. 실험 전에는 반드시', '2. 공명로 출력은 허가된', '3. 기록 테이프는 사용한', '4. 냉각수 밸브는 기사가'], { bg: '#e6e0c8', size: 24 });
  { const x = pc.getContext('2d'); x.fillStyle = '#120c08'; x.beginPath(); x.moveTo(0, 560); x.lineTo(0, 300); for (let i = 0; i <= 10; i++) x.lineTo(i * 40, 300 + Math.sin(i * 2.1) * 18 - (i % 3) * 8); x.lineTo(400, 560); x.fill(); }
  K.tag(K.canvasPlane(pc, 0.5, 0.7, -4.97, 1.5, 0.8, Math.PI / 2), 'poster');
  // 윤서경 책상 (남서쪽, 그을림)
  K.box(1.4, 0.75, 0.6, M.charred, -3.5, 0.375, 1.65);
  K.box(1.45, 0.04, 0.65, K.std({ color: 0x2a2622, roughness: 0.9 }), -3.5, 0.77, 1.65);
  refs.desk = K.box(0.5, 0.16, 0.05, K.std({ color: 0x3a3028, roughness: 0.9 }), -3.9, 0.6, 1.33);
  K.tag(refs.desk, 'desk'); K.hit('desk', 0.6, 0.3, 0.2, -3.9, 0.6, 1.33);
  const nameC = textCanvas(256, 70, [{ t: '윤서경', size: 40, bold: true, align: 'center' }], { bg: '#c8c0a8', pad: 6 });
  K.canvasPlane(nameC, 0.24, 0.065, -3.2, 0.83, 1.4, Math.PI, 0.9).rotation.x = -0.4;
  K.collide(-4.25, -2.75, 1.3, 2);
  // 출입 서명부 (입구 옆)
  K.tag(K.canvasPlane(textCanvas(300, 380, [{ t: '출입 서명부', size: 32, bold: true }, '1999.12.31', '────────', '윤서경 9504', '마태진 9107', '…'], { bg: '#dcd4bc', size: 26, font: '"Nanum Pen Script", cursive' }), 0.26, 0.33, 1.3, 1.45, 1.97, Math.PI), 'signin');

  // ── 제어실 ──
  room(K, M, { ...CTRL, doors: [{ side: 'w', a: CDOOR.z0, b: CDOOR.z1, h: 2.2 }, { side: 'w', a: -3.5, b: -1.5, h: 2.2 }] });
  // (창 아래 벽은 위에서 만듦)
  const cdoor = K.box(0.05, 2.1, 0.8, K.std({ color: 0x3a3430, roughness: 0.8 }), 3.35, 1.05, CDOOR.z1 + 0.35); cdoor.rotation.y = 1.3;
  refs.emC = emergency(K, 6.6, 2.7, -0.4, 0xff7050);
  // 제어 패널 (동쪽 벽)
  const pnl = new THREE.Group();
  K.box(0.7, 1.0, 2.2, M.darkSteel, 0, 0.5, 0, pnl);
  const face = K.box(0.4, 0.6, 2.2, M.charred, -0.12, 1.1, 0, pnl); face.rotation.z = -0.5;
  for (let i = 0; i < 6; i++) { const d = K.cyl(0.06, 0.06, 0.03, K.std({ color: 0x5a5040, metalness: 0.6 }), -0.3, 1.16, -0.8 + i * 0.32, pnl); d.rotation.z = Math.PI / 2 - 0.5; }
  for (let i = 0; i < 4; i++) K.box(0.05, 0.1, 0.05, K.std({ color: i === 2 ? 0x8a8a80 : 0x6a2a20 }), -0.22, 0.95, -0.6 + i * 0.4, pnl);
  K.box(0.02, 0.1, 0.12, M.paper, -0.36, 0.86, 0.7, pnl);
  pnl.position.set(6.6, 0, -2.2); scene.add(pnl); K.tag(pnl, 'panel');
  K.collide(6.2, 7, -3.3, -1.1);
  // T3 책상 (북쪽 벽)
  K.box(1.4, 0.75, 0.6, M.charred, 5.0, 0.375, -3.65); K.box(1.45, 0.04, 0.65, K.std({ color: 0x2a2622 }), 5.0, 0.77, -3.65);
  K.collide(4.25, 5.75, -4, -3.3);
  refs.t3 = crt(K, M, 't3', 5.0, 0.79, -3.7, 0, { color: 0x6a6458 });
  // 사고 조사 보고서 (남쪽 벽)
  K.tag(K.canvasPlane(textCanvas(360, 480, [{ t: '사고 조사 보고서', size: 30, bold: true }, '(요약) 2000.2', '──────────', '23:52 패널 조작', '23:59 과부하', '결론: 무단 실험'], { bg: '#eae6da', size: 24, font: '"Nanum Gothic Coding", monospace' }), 0.36, 0.48, 5.4, 1.5, -0.03, Math.PI), 'report');
  // 점검구 (바닥) — 넘어진 캐비닛이 덮고 있다
  const hatch = new THREE.Group();
  K.box(0.8, 0.03, 0.8, K.std({ color: 0x4a4a44, metalness: 0.6, roughness: 0.6 }), 0, 0.015, 0, hatch);
  for (let i = 0; i < 6; i++) K.box(0.7, 0.008, 0.03, M.darkSteel, 0, 0.034, -0.3 + i * 0.12, hatch);
  K.box(0.12, 0.03, 0.08, K.std({ color: 0xd8d0b0 }), 0.25, 0.04, 0.3, hatch);
  refs.hatchLid = hatch;
  hatch.position.set(HATCH.x, 0, HATCH.z); scene.add(hatch); K.tag(hatch, 'hatch');
  const kp = new THREE.Group(); K.box(0.16, 0.06, 0.12, M.darkSteel, 0, 0.03, 0, kp); kp.position.set(HATCH.x - 0.3, 0.03, HATCH.z + 0.48); scene.add(kp); K.tag(kp, 'hatch'); refs.hatchPad = kp;
  const cab = new THREE.Group();
  K.box(0.5, 1.6, 0.4, K.std({ color: 0x3a3632, roughness: 0.8, metalness: 0.4 }), 0, 0.2, 0, cab);
  cab.rotation.z = Math.PI / 2; cab.position.set(HATCH.x, 0.25, HATCH.z); scene.add(cab); K.tag(cab, 'cabinet'); refs.cabinet = cab;
  refs.hatchHole = K.box(0.76, 0.01, 0.76, K.std({ color: 0x000000 }), HATCH.x, 0.003, HATCH.z); refs.hatchHole.visible = false;
  K.collide(HATCH.x - 0.85, HATCH.x + 0.85, HATCH.z - 0.3, HATCH.z + 0.3, () => ctx.S.hatchShown);

  // 그을린 의자들
  for (const [x, z, r] of [[-1.5, 0.6, 0.4], [5.6, -2.8, 1.2], [4.0, -3.0, 2.2]]) { const c = new THREE.Group(); K.box(0.42, 0.05, 0.42, M.charred, 0, 0.45, 0, c); K.box(0.42, 0.45, 0.05, M.charred, 0, 0.7, -0.2, c); K.cyl(0.03, 0.03, 0.45, M.darkSteel, 0, 0.22, 0, c); c.position.set(x, 0, z); c.rotation.y = r; scene.add(c); }

  const areas = [
    { x0: COR.x0, x1: COR.x1, z0: COR.z0, z1: COR.z1 - 0.3 },
    { x0: LAB.x0, x1: LAB.x1, z0: LAB.z0, z1: LAB.z1 },
    { x0: CTRL.x0, x1: CTRL.x1, z0: CTRL.z0, z1: CTRL.z1 },
    { x0: -0.6, x1: 0.6, z0: 1.6, z1: 2.4, tight: true },
    { x0: 2.6, x1: 3.4, z0: CDOOR.z0 + 0.15, z1: CDOOR.z1 - 0.15, tight: true },
  ];
  return { refs, areas, colliders: K.colliders, fog };
}

// 비상등 (배터리, 붉은빛)
function emergency(K, x, y, z, color = 0xffb070) {
  const g = new THREE.Group();
  K.box(0.3, 0.1, 0.1, K.std({ color: 0xdedad0 }), 0, 0, 0, g);
  const m = K.std({ color: 0xffeecc, emissive: color, emissiveIntensity: 2 });
  K.box(0.08, 0.05, 0.03, m, -0.08, -0.02, 0.06, g); K.box(0.08, 0.05, 0.03, m, 0.08, -0.02, 0.06, g);
  K.add(g, x, y, z);
  const l = K.pointLight(color, 2.4, x, y - 0.2, z, false, 256, 6);
  return { m, l };
}
