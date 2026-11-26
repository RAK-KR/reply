// 지하 1층: 복도, 기록 보관실, 휴게실
import * as THREE from 'three';
import { makeKit } from '../../shared/build.js';
import { labMats, room, tube, crt, printer, locker, textCanvas } from '../../shared/lab.js';

export const COR = { x0: -1, x1: 1, z0: -4, z1: 5, h: 2.8 };
export const ARCH = { x0: -6, x1: -1, z0: -4, z1: 1, h: 2.8 };
export const LOUNGE = { x0: 1, x1: 5, z0: -2.5, z1: 1.5, h: 2.8 };
export const ADOOR = { z0: -0.9, z1: -0.1 };
export const LOPEN = { z0: -0.8, z1: 0.4 };
export const LOCKER_Z = [-2.05, -1.6, -1.15, -0.7, -0.25, 0.2];

export function buildRoom(scene, ctx) {
  const K = makeKit(scene);
  const M = labMats(K, { seed: 33, decay: 0.8, wet: 0.15 });
  const refs = {};
  scene.background = new THREE.Color(0x010202);
  scene.add(new THREE.HemisphereLight(0x40575a, 0x0a0c0c, 0.22));

  // ── 복도 ──
  room(K, M, { ...COR, doors: [{ side: 'w', a: ADOOR.z0, b: ADOOR.z1 }, { side: 'e', a: LOPEN.z0, b: LOPEN.z1 }, { side: 'n', a: -0.6, b: 0.6, h: 2.2 }] });
  refs.corTubes = [tube(K, 0, 2.75, 2.5, { axis: 'z', intensity: 3, dist: 6, shadow: true }), tube(K, 0, 2.75, -2.2, { axis: 'z', intensity: 3, dist: 6 })];
  refs.corTubes.forEach((t) => t.set(true)); refs.corTubes[1].flicker(0.6);
  // 무너진 계단 잔해
  const rub = K.std({ color: 0x6a6a64, roughness: 1 });
  [[-0.6, 4.5, 0.5], [0.3, 4.7, 0.7], [0.7, 4.3, 0.4], [-0.2, 4.9, 0.9], [0, 4.2, 0.3]].forEach(([x, z, s], i) => { const b = K.box(s, s * 0.7, s, rub, x, s * 0.35, z); b.rotation.set(i * 0.4, i, i * 0.3); });
  const rebar = K.cyl(0.01, 0.01, 1.4, M.rust, 0.2, 0.9, 4.6); rebar.rotation.z = 0.8;
  K.tag(K.hit('stairs', 2, 1.6, 1, 0, 0.8, 4.5), 'stairs');
  K.collide(-1, 1, 3.95, 5);
  const ns = textCanvas(420, 220, [{ t: '지하 2층 계단 붕괴', size: 34, bold: true, color: '#a01818' }, { t: '(2011년 누수)', size: 24 }, { t: '화물 승강기 통로 사다리 이용', size: 26 }, { t: '— 철거팀', size: 20 }], { bg: '#f2e64a', size: 24 });
  K.canvasPlane(ns, 0.5, 0.26, 0.98, 1.6, 3.4, -Math.PI / 2);
  // 반출 목록, 당번표
  K.tag(K.canvasPlane(textCanvas(300, 400, [{ t: '반출 목록', size: 36, bold: true }, '지하 1층', '────────', '열린 서랍·사물함 →', '전부 반출', '잠긴 것 → 열지 않음', '시설물 → 손 안 댐'], { bg: '#f4f2ea', size: 24 }), 0.3, 0.4, -0.98, 1.5, 2.2, Math.PI / 2), 'crew');
  K.tag(K.canvasPlane(textCanvas(320, 300, [{ t: '기록실 당번', size: 34, bold: true }, '12/06 박정만', '12/13 윤서경', '12/20 구인모', '12/27 마태진'], { bg: '#e8e2cc', size: 26, font: '"Nanum Pen Script", cursive' }), 0.32, 0.3, -0.98, 1.5, 0.75, Math.PI / 2), 'roster');
  // 기록실 문과 번호판
  refs.archDoor = K.door(COR.x0, ADOOR.z0, 'z', ADOOR.z1 - ADOOR.z0, K.std({ color: 0x51625e, roughness: 0.5, metalness: 0.4 }), 'archDoor', M.steel);
  refs.archDoor.rotation.y = Math.PI;
  K.hit('archDoor', 0.1, 2, 0.8, COR.x0, 1, (ADOOR.z0 + ADOOR.z1) / 2);
  const kp = new THREE.Group(); K.box(0.03, 0.18, 0.12, M.darkSteel, 0, 0, 0, kp);
  refs.archLed = new THREE.MeshStandardMaterial({ color: 0x220000, emissive: 0xff3020, emissiveIntensity: 1.6 });
  K.box(0.01, 0.015, 0.03, refs.archLed, 0.018, 0.065, 0, kp);
  kp.position.set(-0.97, 1.3, 0.15); scene.add(kp); K.tag(kp, 'archPad');
  K.hit('archPad', 0.08, 0.26, 0.2, -0.95, 1.3, 0.15);
  K.collide(COR.x0 - 0.05, COR.x0 + 0.05, ADOOR.z0, ADOOR.z1, () => ctx.S.archOpen);
  K.canvasPlane(textCanvas(256, 80, [{ t: '기록 보관실', size: 40, bold: true, align: 'center' }], { bg: '#e8e4d4', pad: 8 }), 0.4, 0.12, -0.97, 2.25, -0.5, Math.PI / 2);
  // 소화전
  const hy = new THREE.Group();
  K.box(0.12, 0.8, 0.6, K.std({ color: 0xa82020, roughness: 0.5 }), 0, 0, 0, hy);
  refs.hyDoor = K.box(0.02, 0.6, 0.5, K.std({ color: 0xc83030, roughness: 0.4 }), -0.07, 0, 0, hy);
  K.canvasPlane(textCanvas(200, 80, [{ t: '소화전', size: 44, bold: true, align: 'center', color: '#fff' }], { bg: '#a82020', pad: 6 }), 0.3, 0.12, -0.085, 0.2, 0, -Math.PI / 2, 0.6, hy);
  hy.position.set(0.94, 1.1, -3.1); scene.add(hy); K.tag(hy, 'hydrant');
  // 화물 승강기 문
  refs.shaftDoorL = K.box(0.6, 2.2, 0.06, M.steel, -0.3, 1.1, -3.98);
  refs.shaftDoorR = K.box(0.6, 2.2, 0.06, M.steel, 0.3, 1.1, -3.98);
  K.box(0.06, 0.06, 0.02, M.black, 0, 1.9, -3.94);
  K.canvasPlane(textCanvas(256, 80, [{ t: '화물 승강기', size: 40, bold: true, align: 'center' }], { bg: '#e8e4d4', pad: 8 }), 0.4, 0.12, 0, 2.45, -3.97);
  K.tag(K.hit('shaft', 1.2, 2.2, 0.1, 0, 1.1, -3.95), 'shaft');
  // 통로 속 사다리 (문이 열리면 보인다)
  const sh = new THREE.Group();
  K.box(1.4, 0.02, 1.4, M.black, 0, -0.01, -4.8, sh);
  for (let i = 0; i < 8; i++) K.box(0.5, 0.025, 0.025, M.rust, 0, 0.2 + i * 0.3, -5.45, sh);
  K.box(0.03, 2.6, 0.03, M.rust, -0.25, 1.2, -5.45, sh); K.box(0.03, 2.6, 0.03, M.rust, 0.25, 1.2, -5.45, sh);
  scene.add(sh); refs.shaftInside = sh;
  K.collide(-0.6, 0.6, -4.05, -3.95);

  // ── 기록 보관실 ──
  room(K, M, { ...ARCH, doors: [{ side: 'e', a: ADOOR.z0, b: ADOOR.z1 }] });
  refs.archTube = tube(K, -3.5, 2.75, -1.5, { len: 1.3, intensity: 3.5, dist: 7, shadow: true });
  refs.archTube.set(true); refs.archTube.flicker(0.15);
  // 카드 서랍장
  const cab = new THREE.Group();
  const wood = K.std({ color: 0x6a5238, roughness: 0.7 });
  K.box(1.6, 1.25, 0.5, wood, 0, 0.625, 0, cab);
  for (let r = 0; r < 5; r++) for (let c = 0; c < 6; c++) {
    K.box(0.24, 0.2, 0.02, K.std({ color: 0x7d6446, roughness: 0.6 }), -0.65 + c * 0.26, 1.08 - r * 0.22, 0.26, cab);
    K.box(0.06, 0.02, 0.02, M.steel, -0.65 + c * 0.26, 1.06 - r * 0.22, 0.28, cab);
  }
  cab.position.set(-3.8, 0, -3.72); scene.add(cab); K.tag(cab, 'catalog');
  K.collide(-4.65, -2.95, -4, -3.45);
  K.tag(K.canvasPlane(textCanvas(260, 300, [{ t: '서랍 찾는 법', size: 28, bold: true }, '행 = 해', '열 = 분류', '(자세히는 →)'], { bg: '#efe9d8', size: 24 }), 0.26, 0.3, -2.94, 0.9, -3.72, Math.PI / 2), 'index');
  // 선반 (테이프는 전부 반출)
  const shelfMat = K.std({ color: 0x5e6a66, roughness: 0.5, metalness: 0.5 });
  const rack = (x, z0, z1) => {
    const g = new THREE.Group();
    for (let i = 0; i < 5; i++) K.box(0.45, 0.03, z1 - z0, shelfMat, 0, 0.15 + i * 0.45, 0, g);
    [[-0.2, z0 - (z0 + z1) / 2], [0.2, z0 - (z0 + z1) / 2], [-0.2, z1 - (z0 + z1) / 2], [0.2, z1 - (z0 + z1) / 2]].forEach(([dx, dz]) => K.box(0.03, 2.1, 0.03, shelfMat, dx, 1.05, dz, g));
    g.position.set(x, 0, (z0 + z1) / 2); scene.add(g); K.tag(g, 'shelf');
    K.collide(x - 0.25, x + 0.25, z0, z1);
    return g;
  };
  rack(-5.7, -3.3, -0.6);
  rack(-4.1, -2.9, -0.4);
  for (let i = 0; i < 6; i++) K.box(0.18, 0.12, 0.03, K.std({ color: 0x2a2a2a }), -4.1, 0.65 + (i % 2) * 0.45, -2.5 + i * 0.35).rotation.y = 0.3 * i;
  K.canvasPlane(textCanvas(300, 80, [{ t: '3번 선반 · T-31~T-38', size: 26, bold: true }], { bg: '#efe9d8', pad: 8 }), 0.32, 0.08, -3.84, 1.55, -1.6, Math.PI / 2);
  // 복사기
  K.box(1.0, 0.75, 0.6, M.cream, -1.6, 0.375, -3.3);
  const dup = new THREE.Group();
  K.box(0.6, 0.25, 0.4, M.beige, 0, 0.125, 0, dup);
  for (let i = 0; i < 2; i++) { const r = K.cyl(0.08, 0.08, 0.02, M.black, -0.15 + i * 0.3, 0.26, 0, dup); r.rotation.x = Math.PI / 2; }
  K.box(0.2, 0.005, 0.25, M.paper, 0.2, 0.26, 0.15, dup);
  dup.position.set(-1.6, 0.75, -3.3); scene.add(dup); K.tag(dup, 'copier');
  K.collide(-2.1, -1.1, -3.6, -3.0);
  // T2 책상
  K.box(1.4, 0.75, 0.6, M.cream, -2.1, 0.375, 0.68);
  K.box(1.45, 0.04, 0.65, M.green, -2.1, 0.77, 0.68);
  refs.drawer = K.box(0.4, 0.15, 0.5, M.beige, -2.55, 0.6, 0.6);
  K.tag(refs.drawer, 'drawer');
  K.collide(-2.85, -1.35, 0.35, 1);
  refs.t2 = crt(K, M, 't2', -2.2, 0.79, 0.74, Math.PI);
  refs.printer = printer(K, M, 'printer', -1.6, 0.79, 0.78, Math.PI);
  refs.printer.paper.visible = true;
  // 환기구 (남쪽 벽 아래)
  const vent = new THREE.Group();
  refs.ventCover = new THREE.Group();
  K.box(0.5, 0.36, 0.02, M.steel, 0, 0, 0, refs.ventCover);
  for (let i = 0; i < 7; i++) K.box(0.44, 0.02, 0.02, M.darkSteel, 0, -0.14 + i * 0.047, 0.012, refs.ventCover);
  [[-0.22, 0.15], [0.22, 0.15], [-0.22, -0.15], [0.22, -0.15]].forEach(([x, y]) => { const s = K.cyl(0.015, 0.015, 0.01, M.steel, x, y, 0.016, refs.ventCover); s.rotation.x = Math.PI / 2; });
  vent.add(refs.ventCover);
  K.box(0.46, 0.32, 0.01, M.black, 0, 0, -0.03, vent);
  refs.ventKey = K.box(0.12, 0.02, 0.04, K.std({ color: 0xb09050, metalness: 0.8, roughness: 0.4 }), 0.05, -0.12, -0.01, vent);
  vent.position.set(-4.6, 0.35, 0.97); vent.rotation.y = Math.PI; scene.add(vent); K.tag(vent, 'vent');
  K.hit('vent', 0.55, 0.42, 0.1, -4.6, 0.35, 0.95);

  // ── 휴게실 ──
  room(K, M, { ...LOUNGE, doors: [{ side: 'w', a: LOPEN.z0, b: LOPEN.z1 }] });
  refs.lTube = tube(K, 3, 2.75, -0.5, { len: 1.2, intensity: 3, dist: 6, shadow: true });
  refs.lTube.set(true);
  const noSmoke = textCanvas(120, 120, [{ t: '금연', size: 46, bold: true, align: 'center', color: '#c02020' }], { bg: '#fff', pad: 22, border: '#c02020' });
  refs.lockers = LOCKER_Z.map((z, i) => locker(K, M, `locker${i + 1}`, 4.77, z, -Math.PI / 2, { label: ['구인모', '', '박정만', '공용', '공용', '윤서경'][i] || `${i + 1}`, color: 0x5d7a72, sticker: i === 5 ? noSmoke : null }));
  K.collide(4.5, 5, -2.3, 0.45);
  for (let i = 0; i < 6; i++) K.canvasPlane(textCanvas(80, 80, [{ t: `${i + 1}`, size: 50, bold: true, align: 'center' }], { bg: '#e8e4d2', pad: 12 }), 0.06, 0.06, 4.535, 1.65, LOCKER_Z[i] + 0.12, -Math.PI / 2);
  // 자판기
  const vm = new THREE.Group();
  K.box(0.8, 1.8, 0.7, K.std({ color: 0x9a2a2a, roughness: 0.4, metalness: 0.3 }), 0, 0.9, 0, vm);
  K.box(0.6, 0.8, 0.02, K.std({ color: 0x223, emissive: 0x112233, emissiveIntensity: 0.3 }), 0, 1.25, 0.36, vm);
  K.box(0.14, 0.08, 0.04, M.black, 0.25, 0.35, 0.36, vm);
  vm.position.set(2.0, 0, -2.12); scene.add(vm); K.tag(vm, 'vending');
  K.collide(1.55, 2.45, -2.5, -1.75);
  // 소파와 게시판
  K.box(1.6, 0.4, 0.7, K.std({ color: 0x3a4a5a, roughness: 0.9 }), 3.2, 0.2, 1.1); K.box(1.6, 0.4, 0.15, K.std({ color: 0x3a4a5a, roughness: 0.9 }), 3.2, 0.6, 1.4);
  K.collide(2.35, 4.05, 0.7, 1.5);
  K.tag(K.canvasPlane(textCanvas(400, 300, [{ t: '1999 송년회 (12/24)', size: 28, bold: true }, '구 박사님 · 서경 씨 · 마 기사님', '박 반장님 — 모두 수고했어요', '', '※ 휴게실 금연 (서경)'], { bg: '#f0ead8', size: 22 }), 0.5, 0.38, 3.2, 1.65, 1.47, Math.PI), 'board');

  const areas = [
    { x0: COR.x0, x1: COR.x1, z0: COR.z0, z1: COR.z1 },
    { x0: ARCH.x0, x1: ARCH.x1, z0: ARCH.z0, z1: ARCH.z1 },
    { x0: LOUNGE.x0, x1: LOUNGE.x1, z0: LOUNGE.z0, z1: LOUNGE.z1 },
    { x0: -1.4, x1: -0.6, z0: ADOOR.z0 + 0.22, z1: ADOOR.z1 - 0.22, tight: true, open: () => ctx.S.archOpen },
    { x0: 0.6, x1: 1.4, z0: LOPEN.z0 + 0.2, z1: LOPEN.z1 - 0.2, tight: true },
  ];
  return { refs, areas, colliders: K.colliders };
}
