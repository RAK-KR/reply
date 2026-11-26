// 지하 3층: 기계실 (발전기, 공명로 전원반, 배수 펌프, 마태진의 작업대)
import * as THREE from 'three';
import { makeKit } from '../../shared/build.js';
import { labMats, room, tube, crt, printer, locker, pipe, textCanvas } from '../../shared/lab.js';
import { ROOM_ORDER, HEX } from './content.js';

export const MR = { x0: -5, x1: 5, z0: -4, z1: 4, h: 3.4 };
export const B4H = { x: -1.2, z: -3.0 };
export const VALVE_X = (i) => 2.0 + i * 0.52;

export function buildRoom(scene, ctx) {
  const K = makeKit(scene);
  const M = labMats(K, { seed: 55, decay: 0.9, soot: 0.6 });
  const refs = {};
  scene.background = new THREE.Color(0x010101);
  refs.hemi = new THREE.HemisphereLight(0x5a5c58, 0x0a0806, 0.28); scene.add(refs.hemi);
  scene.fog = new THREE.FogExp2(0x0a0908, 0.025);

  room(K, M, { ...MR });
  refs.tubes = [tube(K, -2.5, 3.35, -1.2, { len: 1.3, intensity: 7, dist: 10, shadow: true }), tube(K, 2.5, 3.35, -1.8, { len: 1.3, intensity: 6.5, dist: 10 }), tube(K, 1.0, 3.35, 2.4, { len: 1.3, intensity: 6, dist: 9 })];
  refs.tubes[1].flicker(0.5);
  refs.em = [emergency(K, -4.6, 2.8, 2.6), emergency(K, 4.6, 2.8, -2.0, 0xff7050)];

  // 도착한 케이블 통로 구멍
  K.box(0.8, 0.01, 0.8, K.std({ color: 0x000000 }), -3.8, 0.004, 3.0);
  const tl = K.box(0.8, 0.03, 0.8, K.std({ color: 0x4a4a44, metalness: 0.6 }), -3.8, 0.4, 3.42); tl.rotation.x = -1.4;
  K.tag(K.hit('trench', 0.8, 0.2, 0.8, -3.8, 0.1, 3.0), 'trench');
  // 지하 3층 분전함 (서쪽 벽)
  const bx = new THREE.Group();
  K.box(0.12, 0.6, 0.45, M.darkSteel, 0, 0, 0, bx);
  refs.lever = K.box(0.06, 0.16, 0.06, K.std({ color: 0x202020 }), 0.08, -0.08, 0, bx);
  K.canvasPlane(textCanvas(260, 90, [{ t: '지하 3층 전원', size: 36, bold: true, align: 'center' }], { bg: '#e0dccc', pad: 10 }), 0.32, 0.11, 0.065, 0.2, 0, Math.PI / 2, 0.8, bx);
  bx.position.set(-4.93, 1.4, 1.5); scene.add(bx); K.tag(bx, 'breaker');
  // 발전기
  const gen = new THREE.Group();
  K.box(2.0, 1.1, 1.2, K.std({ color: 0x3a4a42, roughness: 0.6, metalness: 0.5 }), 0, 0.55, 0, gen);
  K.cyl(0.25, 0.25, 0.9, M.darkSteel, -0.6, 1.3, 0, gen);
  for (let i = 0; i < 6; i++) K.box(0.05, 0.6, 1.0, M.darkSteel, 0.3 + i * 0.12, 0.75, 0, gen);
  K.box(0.24, 0.32, 0.01, M.paper, 0.6, 0.6, 0.605, gen);
  gen.position.set(-3.5, 0, -2.9); scene.add(gen); K.tag(gen, 'generator');
  K.collide(-4.6, -2.4, -3.6, -2.2);
  // 공명로 전원반
  const pc = new THREE.Group();
  K.box(0.5, 2.2, 1.6, M.darkSteel, 0, 1.1, 0, pc);
  for (let i = 0; i < 4; i++) K.box(0.06, 0.18, 0.08, K.std({ color: i === 2 ? 0x8a2a20 : 0x777770 }), 0.27, 1.3 + (i === 2 ? -0.1 : 0.08), -0.5 + i * 0.33, pc);
  K.canvasPlane(textCanvas(300, 90, [{ t: '공명로 전원반', size: 36, bold: true, align: 'center' }], { bg: '#e0dccc', pad: 10 }), 0.45, 0.13, 0.26, 1.9, 0, Math.PI / 2, 0.8, pc);
  pc.position.set(-4.72, 0, -0.4); scene.add(pc); K.tag(pc, 'powercab');
  K.collide(-5, -4.45, -1.2, 0.4);
  // 지하 4층 해치
  const hl = new THREE.Group();
  K.box(0.9, 0.04, 0.9, K.std({ color: 0x55554e, metalness: 0.6, roughness: 0.5 }), 0, 0, 0.45, hl);
  K.box(0.1, 0.04, 0.04, M.steel, 0, 0.04, 0.8, hl);
  hl.position.set(B4H.x, 0.02, B4H.z - 0.45); scene.add(hl); K.tag(hl, 'b4hatch'); refs.hatchLid = hl;
  K.box(1.0, 0.03, 1.0, M.darkSteel, B4H.x, 0.002, B4H.z).visible = true;
  const shaftWater = new THREE.Mesh(new THREE.PlaneGeometry(0.86, 0.86), new THREE.MeshStandardMaterial({ color: 0x24504c, emissive: 0x0a2a28, emissiveIntensity: 0.6, roughness: 0.05, metalness: 0.3 }));
  shaftWater.rotation.x = -Math.PI / 2; shaftWater.position.set(B4H.x, -0.15, B4H.z); scene.add(shaftWater); refs.shaftWater = shaftWater;
  const hole = K.box(0.86, 0.02, 0.86, K.std({ color: 0x000000 }), B4H.x, -1.6, B4H.z);
  for (let i = 0; i < 5; i++) K.box(0.5, 0.025, 0.025, M.rust, B4H.x, -0.3 - i * 0.28, B4H.z - 0.4);
  K.tag(K.hit('b4hatch', 1.0, 0.2, 1.0, B4H.x, 0.1, B4H.z), 'b4hatch');
  K.canvasPlane(textCanvas(300, 80, [{ t: '↓ 지하 4층 · 금고실', size: 32, bold: true, align: 'center' }], { bg: '#e8e4d4', pad: 8 }), 0.5, 0.13, B4H.x, 1.6, -3.97);
  // 배수 펌프
  const pump = new THREE.Group();
  K.cyl(0.35, 0.35, 0.7, K.std({ color: 0x2a5a7a, roughness: 0.5, metalness: 0.5 }), 0, 0.5, 0, pump).rotation.z = Math.PI / 2;
  K.box(0.9, 0.15, 0.7, M.darkSteel, 0, 0.075, 0, pump);
  K.cyl(0.25, 0.25, 0.4, K.std({ color: 0x3a3a3a, metalness: 0.6 }), 0.55, 0.5, 0, pump).rotation.z = Math.PI / 2;
  pump.position.set(0.6, 0, -3.2); scene.add(pump); K.tag(pump, 'pump'); refs.pump = pump;
  K.collide(-0.05, 1.25, -3.6, -2.8);
  // 펌프 조작함 (북쪽 벽)
  const cb = new THREE.Group();
  K.box(0.5, 0.6, 0.15, M.cream, 0, 0, 0, cb);
  refs.pumpBtn = K.cyl(0.06, 0.06, 0.05, K.std({ color: 0x20a040, emissive: 0x20ff60, emissiveIntensity: 0 }), -0.1, -0.1, 0.09, cb); refs.pumpBtn.rotation.x = Math.PI / 2;
  K.cyl(0.09, 0.09, 0.02, K.std({ color: 0xf0f0e8 }), 0.12, 0.12, 0.08, cb).rotation.x = Math.PI / 2;
  refs.needle = K.box(0.005, 0.07, 0.005, K.std({ color: 0xc02020 }), 0.12, 0.12, 0.095, cb);
  K.canvasPlane(textCanvas(240, 70, [{ t: '배수 펌프', size: 34, bold: true, align: 'center' }], { bg: '#e8e4d4', pad: 6 }), 0.3, 0.09, 0, 0.22, 0.08, 0, 0.8, cb);
  cb.position.set(1.2, 1.4, -3.92); scene.add(cb); K.tag(cb, 'pumpbox');
  // 배관도 (북쪽 벽, 아래쪽이 탔다)
  const sc = textCanvas(500, 380, [{ t: '배수 배관도', size: 34, bold: true }, '집수정 ─ V1 ─┬ V2 ─ 펌프', '                └ V3 ─', '펌프 ─┬ V4 ─ 바다 배출구', '        ├ V5 ─', '        └ V6 ─'], { bg: '#e6e2d4', size: 26, font: '"Nanum Gothic Coding", monospace' });
  { const x = sc.getContext('2d'); x.fillStyle = '#100b08'; for (let i = 0; i < 3; i++) { x.beginPath(); x.ellipse(330, 155 + i * 98, 120, 34, 0.1 * i, 0, 7); x.fill(); } }
  K.tag(K.canvasPlane(sc, 0.8, 0.6, -0.2, 1.6, -3.96), 'schem');
  // 밸브 줄 (북쪽 벽 배관)
  const pmat = K.std({ color: 0x5a5e5a, roughness: 0.5, metalness: 0.6 });
  pipe(K, pmat, [1.6, 0.6, -3.75], [5.0, 0.6, -3.75], 0.06);
  pipe(K, pmat, [1.6, 2.2, -3.75], [5.0, 2.2, -3.75], 0.06);
  refs.valves = {};
  ROOM_ORDER.forEach((v, i) => {
    const x = VALVE_X(i);
    pipe(K, pmat, [x, 0.6, -3.75], [x, 2.2, -3.75], 0.045);
    const w = new THREE.Group();
    const wheel = new THREE.Mesh(new THREE.TorusGeometry(0.11, 0.018, 8, 20), K.std({ color: HEX[v], roughness: 0.5, metalness: 0.3 }));
    w.add(wheel);
    for (let k = 0; k < 3; k++) { const sp = K.box(0.2, 0.015, 0.015, K.std({ color: HEX[v] }), 0, 0, 0, w); sp.rotation.z = k * Math.PI / 3; }
    K.box(0.06, 0.06, 0.12, M.darkSteel, 0, 0, -0.06, w);
    w.position.set(x, 1.3, -3.6); scene.add(w); K.tag(w, `valve_${v}`);
    K.hit(`valve_${v}`, 0.3, 0.3, 0.2, x, 1.3, -3.55);
    // 열림 표시: 손잡이 옆 작은 깃발
    const flag = K.box(0.04, 0.08, 0.01, K.std({ color: 0xf0f0e0 }), x + 0.16, 1.3, -3.62);
    refs.valves[v] = { wheel: w, flag };
  });
  K.collide(1.7, 5, -4, -3.4);
  // T4 책상 (남쪽 벽)
  K.box(1.6, 0.75, 0.6, M.charred, 0, 0.375, 3.68); K.box(1.65, 0.04, 0.65, K.std({ color: 0x2a2622 }), 0, 0.77, 3.68);
  K.collide(-0.85, 0.85, 3.35, 4);
  refs.t4 = crt(K, M, 't4', -0.2, 0.79, 3.62, Math.PI, { color: 0x8a8070 });
  refs.printer = printer(K, M, 'printer', 0.55, 0.79, 3.66, Math.PI);
  refs.printer.paper.visible = true;
  // 바닥까지 늘어진 종이
  const strip = K.box(0.3, 0.005, 0.9, M.paper, 0.55, 0.79, 3.0); strip.rotation.x = -0.9; strip.position.y = 0.45; strip.userData.id = 'printer';
  K.tag(strip, 'printer'); refs.strip = strip;
  // 마태진 작업대와 사물함 (남동쪽)
  K.box(1.6, 0.85, 0.6, K.std({ color: 0x4a4038, roughness: 0.8 }), 3.6, 0.425, 3.68);
  for (let i = 0; i < 5; i++) K.box(0.03, 0.2, 0.03, M.steel, 3.0 + i * 0.25, 1.4, 3.97);
  K.box(0.3, 0.03, 0.05, K.std({ color: 0xc04030 }), 3.4, 0.88, 3.6);
  K.collide(2.75, 4.45, 3.35, 4);
  const ash = K.cyl(0.07, 0.06, 0.03, M.glass, 4.2, 0.88, 3.5); K.tag(ash, 'ashtray2');
  refs.locker = locker(K, M, 'mlocker', 4.77, 2.3, -Math.PI / 2, { label: '마태진', color: 0x4a5a56 });
  K.collide(4.5, 5, 2.05, 2.55);
  K.tag(K.canvasPlane(textCanvas(300, 380, [{ t: '설비 근무표', size: 32, bold: true }, '설비 기사', '마태진', '12/31 09~18시', '이후 비번'], { bg: '#d8d0b8', size: 26 }), 0.28, 0.35, 4.97, 1.6, 1.2, -Math.PI / 2), 'duty');

  const areas = [{ x0: MR.x0, x1: MR.x1, z0: MR.z0, z1: MR.z1 }];
  K.collide(B4H.x - 0.5, B4H.x + 0.5, B4H.z - 0.5, B4H.z + 0.5);
  K.collide(-4.2, -3.4, 2.6, 3.4);
  return { refs, areas, colliders: K.colliders };
}

function emergency(K, x, y, z, color = 0xffb070) {
  const g = new THREE.Group();
  K.box(0.3, 0.1, 0.1, K.std({ color: 0xdedad0 }), 0, 0, 0, g);
  const m = K.std({ color: 0xffeecc, emissive: color, emissiveIntensity: 2 });
  K.box(0.08, 0.05, 0.03, m, -0.08, -0.02, 0.06, g); K.box(0.08, 0.05, 0.03, m, 0.08, -0.02, 0.06, g);
  K.add(g, x, y, z);
  return { m, l: K.pointLight(color, 2.6, x, y - 0.2, z, false, 256, 7) };
}
