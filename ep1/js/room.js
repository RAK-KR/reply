// 1층: 로비와 경비실
import * as THREE from 'three';
import { makeKit } from '../../shared/build.js';
import { labMats, room, tube, crt, printer, textCanvas, canvasTex } from '../../shared/lab.js';
import { makeCanvas } from '../../shared/draw.js';
import { drawStaff, drawPanelFace, drawPlanSign } from './draw.js';

export const LOBBY = { x0: -4, x1: 4, z0: -3, z1: 3, h: 3.2 };
export const GUARD = { x0: 4, x1: 7, z0: -3, z1: 0.6, h: 2.8 };
export const GDOOR = { z0: -1.6, z1: -0.8 };
export const STAIR = { x0: -2.6, x1: -1.6 };

export function buildRoom(scene, ctx) {
  const K = makeKit(scene);
  const M = labMats(K, { seed: 21, decay: 0.7 });
  const refs = {};
  scene.background = new THREE.Color(0x020405);
  scene.add(new THREE.HemisphereLight(0x3a5060, 0x0a0c0c, 0.32));

  // ── 로비 ──
  room(K, M, { ...LOBBY, doors: [{ side: 'n', a: STAIR.x0, b: STAIR.x1, h: 2.1 }, { side: 'e', a: GDOOR.z0, b: GDOOR.z1, h: 2.1 }, { side: 's', a: -1.2, b: 1.2, h: 2.4 }] });
  // 정문 유리 (바깥은 어두운 밤)
  const night = textCanvas(512, 256, [], { bg: '#0b1620' });
  { const x = night.getContext('2d'); const g = x.createLinearGradient(0, 0, 0, 256); g.addColorStop(0, '#0d1b28'); g.addColorStop(1, '#05080a'); x.fillStyle = g; x.fillRect(0, 0, 512, 256); x.fillStyle = '#c9d8e8'; x.beginPath(); x.arc(390, 60, 16, 0, 7); x.fill(); }
  K.glowPlane(night, 2.4, 2.4, 0, 1.2, 3.25, Math.PI);
  K.box(2.4, 2.4, 0.03, M.glass, 0, 1.2, 3.0);
  K.box(0.06, 2.4, 0.08, M.darkSteel, 0, 1.2, 3.0);
  K.box(2.5, 0.08, 0.1, M.darkSteel, 0, 2.42, 3.0);
  // 바깥 쇠사슬
  for (let i = 0; i < 9; i++) { const l = K.box(0.06, 0.03, 0.02, M.rust, -0.25 + i * 0.06, 1.05 + Math.sin(i) * 0.02, 3.08); l.rotation.z = i % 2 ? 0.4 : -0.4; }
  K.tag(K.hit('frontDoor', 2.4, 2.4, 0.1, 0, 1.2, 2.98), 'frontDoor');
  K.collide(-4, 4, 2.9, 3.1);
  const moon = new THREE.DirectionalLight(0x6d8aa8, 0.5); moon.position.set(1, 3, 7); moon.target.position.set(-1, 0, -2); scene.add(moon, moon.target);

  // 안내 데스크와 T1
  K.box(2.6, 1.0, 0.6, M.cream, 0.3, 0.5, -0.3);
  K.box(2.7, 0.05, 0.7, M.green, 0.3, 1.02, -0.3);
  K.collide(-1.05, 1.65, -0.65, 0.05);
  refs.t1 = crt(K, M, 't1', 0.2, 1.045, -0.38, 0);
  refs.printer = printer(K, M, 'printer', 1.15, 1.045, -0.42, 0);
  // 재떨이
  const ash = new THREE.Group();
  K.cyl(0.08, 0.07, 0.03, M.glass, 0, 0.015, 0, ash);
  const butt = K.cyl(0.006, 0.006, 0.05, M.paper, 0.02, 0.03, 0, ash); butt.rotation.z = Math.PI / 2; butt.visible = false;
  ash.position.set(-0.6, 1.045, -0.15); scene.add(ash); K.tag(ash, 'ashtray'); refs.butt = butt;
  K.hit('ashtray', 0.22, 0.12, 0.22, -0.6, 1.08, -0.15);

  // 분전반 (서쪽 벽)
  const pc = makeCanvas(400, 520); drawPanelFace(pc, {});
  refs.panelCanvas = pc;
  K.box(0.12, 0.9, 0.7, M.darkSteel, -3.94, 1.4, -0.6);
  refs.panelFace = K.canvasPlane(pc, 0.62, 0.8, -3.875, 1.4, -0.6, Math.PI / 2, 0.6);
  K.tag(refs.panelFace, 'panel');
  K.hit('panel', 0.2, 0.9, 0.7, -3.85, 1.4, -0.6);
  // 굵은 임시 전선
  const cable = K.cyl(0.025, 0.025, 1.0, M.rubber, -3.9, 0.45, -0.6); cable.castShadow = false;
  const cable2 = K.cyl(0.025, 0.025, 3.6, M.rubber, -3.85, 0.03, 1.2); cable2.rotation.x = Math.PI / 2;

  // 철거팀 접이식 탁자, 작업등, 메모판
  K.box(1.1, 0.04, 0.6, M.steel, -2.9, 0.74, 1.3);
  [[-3.4, 1.05], [-2.4, 1.05], [-3.4, 1.55], [-2.4, 1.55]].forEach(([x, z]) => K.cyl(0.015, 0.015, 0.74, M.steel, x, 0.37, z));
  K.collide(-3.5, -2.3, 0.95, 1.65);
  const clip = K.box(0.24, 0.01, 0.32, M.paper, -3.05, 0.765, 1.25); clip.rotation.y = 0.2; K.tag(clip, 'clip');
  K.hit('clip', 0.34, 0.08, 0.4, -3.05, 0.79, 1.25);
  // 배터리 작업등 (처음부터 켜져 있음)
  const lamp = new THREE.Group();
  K.box(0.16, 0.2, 0.1, K.std({ color: 0xd8a020, roughness: 0.5 }), 0, 0.1, 0, lamp);
  K.box(0.13, 0.11, 0.01, K.std({ color: 0xfff3d0, emissive: 0xffe0a0, emissiveIntensity: 2 }), 0, 0.12, 0.055, lamp);
  lamp.position.set(-2.55, 0.76, 1.35); lamp.rotation.y = -2.4; scene.add(lamp); K.tag(lamp, 'lamp');
  const wl = new THREE.SpotLight(0xffdfb0, 7, 7, 0.8, 0.6, 1.4); wl.position.set(-2.55, 0.9, 1.35); wl.target.position.set(-3.9, 1.3, -0.6); wl.castShadow = true; wl.shadow.mapSize.set(512, 512); scene.add(wl, wl.target);
  // 메모판 (신문)
  const board = new THREE.Group();
  K.box(1.0, 0.7, 0.03, K.std({ color: 0x8a6a48, roughness: 0.9 }), 0, 0, 0, board);
  const nc = textCanvas(400, 300, [{ t: '청람해양연구소 지하 화재', size: 30, bold: true }, { t: '"연구원 무단 실험"', size: 26 }, { t: '2000년 1월 3일', size: 18 }, '━━━━━━━━━━━━━━━', '지난해 12월 31일 밤 11시', '59분께 지하 실험 설비에서…'], { bg: '#d8d0b8', size: 20, font: '"Nanum Myeongjo", serif' });
  K.canvasPlane(nc, 0.5, 0.38, -0.15, 0.02, 0.02, 0, 0.9, board);
  const cc = textCanvas(300, 200, [{ t: '건물 이력', size: 34, bold: true }, '1986 개소', '1999.12.31 화재', '2000.3 폐쇄'], { bg: '#f2f0e8', size: 26 });
  K.canvasPlane(cc, 0.3, 0.2, 0.3, 0.15, 0.02, 0, 0.9, board);
  board.position.set(-3.88, 1.5, 1.4); board.rotation.y = Math.PI / 2; scene.add(board); K.tag(board, 'news');

  // 층별 안내도 (서쪽 벽, 남쪽)
  const plc = makeCanvas(420, 560); drawPlanSign(plc);
  K.tag(K.canvasPlane(plc, 0.6, 0.8, -3.98, 1.6, 2.35, Math.PI / 2, 0.5), 'plan');

  // 직원 소개판 (북쪽 벽 가운데)
  const stc = makeCanvas(900, 420); drawStaff(stc);
  K.tag(K.canvasPlane(stc, 1.5, 0.7, -0.2, 1.65, -2.98, 0, 0.6), 'staff');
  // 간판 글자 (③)
  const sgc = textCanvas(1024, 128, [{ t: '청람 해양연구소', size: 92, bold: true, align: 'center', font: '"Nanum Myeongjo", serif', color: '#d8f2ea' }], { bg: '', pad: 0 });
  const signMat = new THREE.MeshStandardMaterial({ map: canvasTex(sgc), transparent: true, emissive: 0x9ff0d8, emissiveMap: canvasTex(sgc), emissiveIntensity: 0 });
  K.plane(2.4, 0.3, signMat, -0.2, 2.6, -2.97).castShadow = false;
  refs.signMat = signMat;

  // 계단문
  const stairMat = K.std({ color: 0x5d6e6a, roughness: 0.5, metalness: 0.5 });
  refs.stairDoor = K.door(STAIR.x0, LOBBY.z0, 'x', STAIR.x1 - STAIR.x0, stairMat, 'stairDoor', M.steel);
  K.hit('stairDoor', 1.0, 2.0, 0.1, (STAIR.x0 + STAIR.x1) / 2, 1.0, LOBBY.z0);
  const ssc = textCanvas(256, 96, [{ t: '비상계단', size: 40, bold: true, align: 'center' }], { bg: '#2f6a4a', fg: '#fff', pad: 10 });
  K.canvasPlane(ssc, 0.4, 0.15, -2.1, 2.25, -2.97);
  // 번호판 (⑤)
  const kp = new THREE.Group();
  K.box(0.12, 0.18, 0.03, M.darkSteel, 0, 0, 0, kp);
  refs.stairLed = new THREE.MeshStandardMaterial({ color: 0x220000, emissive: 0xff3020, emissiveIntensity: 0 });
  K.box(0.03, 0.015, 0.01, refs.stairLed, 0, 0.065, 0.018, kp);
  kp.position.set(-1.35, 1.3, -2.97); scene.add(kp); K.tag(kp, 'stairPad');
  K.hit('stairPad', 0.2, 0.26, 0.08, -1.35, 1.3, -2.95);
  K.collide(STAIR.x0, STAIR.x1, LOBBY.z0 - 0.05, LOBBY.z0 + 0.05, () => ctx.S.done);

  // 승강기
  K.box(1.2, 2.1, 0.06, M.steel, 1.8, 1.05, -2.96);
  K.box(0.01, 2.1, 0.07, M.black, 1.8, 1.05, -2.95);
  const ec = textCanvas(256, 128, [{ t: '고장', size: 50, bold: true, align: 'center', color: '#b02020' }, { t: '사용 금지', size: 30, align: 'center' }], { bg: '#f0ece0', pad: 8 });
  K.canvasPlane(ec, 0.36, 0.18, 1.5, 1.4, -2.92);
  K.tag(K.hit('elevator', 1.2, 2.1, 0.1, 1.8, 1.05, -2.93), 'elevator');

  // 수족관 (②)
  const tank = new THREE.Group();
  K.box(1.0, 0.7, 0.04, K.std({ color: 0x2a2a28 }), 0, 0.35, 0, tank);
  const tglass = K.box(0.96, 0.5, 0.4, K.std({ color: 0x9fc0c0, transparent: true, opacity: 0.22, roughness: 0.1 }), 0, 0.97, 0, tank);
  K.box(0.9, 0.06, 0.34, K.std({ color: 0x8a8070, roughness: 1 }), 0, 0.75, 0, tank);
  refs.tankLight = new THREE.MeshStandardMaterial({ color: 0x113340, emissive: 0x30a0ff, emissiveIntensity: 0 });
  K.box(0.9, 0.03, 0.3, refs.tankLight, 0, 1.23, 0, tank);
  tank.position.set(3.4, 0, 2.2); tank.rotation.y = -Math.PI / 2; scene.add(tank); K.tag(tank, 'tank');
  refs.tankPoint = K.pointLight(0x3090ff, 0, 3.2, 1.0, 2.2, false, 256, 3);
  K.collide(3.15, 3.75, 1.65, 2.75);
  tglass.castShadow = false;

  // 화분 (입구 왼쪽)
  const pot = new THREE.Group();
  K.cyl(0.2, 0.15, 0.4, K.std({ color: 0x8a5a3a, roughness: 0.9 }), 0, 0.2, 0, pot);
  for (let i = 0; i < 5; i++) { const st = K.cyl(0.008, 0.006, 0.6, K.std({ color: 0x5a4a30 }), Math.sin(i * 1.3) * 0.06, 0.65, Math.cos(i * 1.3) * 0.06, pot); st.rotation.z = (i - 2) * 0.18; }
  pot.position.set(-2.9, 0, 2.5); scene.add(pot); K.tag(pot, 'pot');
  K.collide(-3.15, -2.65, 2.25, 2.75);
  refs.coin = K.cyl(0.013, 0.013, 0.003, K.std({ color: 0x8a8470, metalness: 0.7, roughness: 0.5 }), -2.62, 0.002, 2.42); refs.coin.visible = false;

  // 벤치
  K.box(1.4, 0.06, 0.4, M.wood, 1.6, 0.45, 1.6); K.box(1.4, 0.42, 0.04, M.darkSteel, 1.6, 0.21, 1.6);
  K.collide(0.85, 2.35, 1.35, 1.85);

  // 로비 형광등 (①)
  refs.lobbyTubes = [tube(K, -1.6, 3.15, 0.2, { len: 1.3, intensity: 5, dist: 9, shadow: true }), tube(K, 1.6, 3.15, -0.6, { len: 1.3, intensity: 4.5, dist: 9 })];

  // 경비실 문과 유리창
  const gdoorMat = K.std({ color: 0x6e7c78, roughness: 0.5, metalness: 0.4 });
  refs.guardDoor = K.door(LOBBY.x1, GDOOR.z1, 'z', GDOOR.z1 - GDOOR.z0, gdoorMat, 'guardDoor', M.steel);
  K.hit('guardDoor', 0.1, 2.0, 0.8, LOBBY.x1, 1.0, (GDOOR.z0 + GDOOR.z1) / 2);
  const gp = new THREE.Group();
  K.box(0.03, 0.18, 0.12, M.darkSteel, 0, 0, 0, gp);
  refs.guardLed = new THREE.MeshStandardMaterial({ color: 0x220000, emissive: 0x30ff80, emissiveIntensity: 0 });
  K.box(0.01, 0.015, 0.03, refs.guardLed, -0.018, 0.065, 0, gp);
  gp.position.set(3.97, 1.3, -0.55); scene.add(gp); K.tag(gp, 'guardPad');
  K.hit('guardPad', 0.08, 0.26, 0.2, 3.95, 1.3, -0.55);
  const gsc = textCanvas(256, 80, [{ t: '경비실', size: 44, bold: true, align: 'center' }], { bg: '#e8e4d4', pad: 8 });
  K.canvasPlane(gsc, 0.36, 0.11, 3.97, 2.25, -1.2, -Math.PI / 2);
  K.collide(LOBBY.x1 - 0.05, LOBBY.x1 + 0.05, GDOOR.z0, GDOOR.z1, () => ctx.S.guardOpen);

  // ── 경비실 ──
  room(K, M, { ...GUARD, doors: [{ side: 'w', a: GDOOR.z0, b: GDOOR.z1, h: 2.1 }] });
  refs.guardTube = tube(K, 5.6, 2.75, -1.2, { len: 1.0, axis: 'z', intensity: 3.2, dist: 5, shadow: true });
  // 책상, 일지, CCTV
  K.box(0.7, 0.75, 2.0, M.cream, 6.6, 0.375, -1.6);
  K.box(0.75, 0.04, 2.05, M.green, 6.6, 0.77, -1.6);
  K.collide(6.2, 7, -2.65, -0.55);
  const binder = K.box(0.26, 0.05, 0.34, K.std({ color: 0x2a3a6a, roughness: 0.8 }), 6.45, 0.815, -1.0); K.tag(binder, 'log');
  K.hit('log', 0.34, 0.1, 0.4, 6.45, 0.83, -1.0);
  refs.cctv = [crt(K, M, 'cctv', 6.7, 0.79, -1.9, -Math.PI / 2, { color: 0x3a3e3c }), crt(K, M, 'cctv', 6.7, 1.2, -1.9, -Math.PI / 2, { color: 0x3a3e3c })];
  const rec = new THREE.Group();
  K.box(0.4, 0.1, 0.3, M.black, 0, 0.05, 0, rec);
  refs.recLed = new THREE.MeshBasicMaterial({ color: 0x113311 });
  K.box(0.12, 0.03, 0.005, refs.recLed, -0.05, 0.06, 0.152, rec);
  rec.position.set(6.6, 0.79, -2.45); rec.rotation.y = -Math.PI / 2; scene.add(rec); K.tag(rec, 'recorder');
  // 출입 기록기
  const cr = new THREE.Group(); K.box(0.22, 0.12, 0.2, M.beige, 0, 0.06, 0, cr); K.box(0.16, 0.005, 0.1, M.paper, 0, 0.125, 0.05, cr);
  cr.position.set(6.55, 0.79, -0.7); scene.add(cr); K.tag(cr, 'cardlog');
  // 야간 잠금 스위치 (북쪽 벽)
  const ns = new THREE.Group();
  K.box(0.3, 0.36, 0.05, M.cream, 0, 0, 0, ns);
  refs.nightLever = K.box(0.05, 0.12, 0.05, K.std({ color: 0xb02a20 }), 0, 0.05, 0.04, ns);
  ns.position.set(5.2, 1.45, -2.97); scene.add(ns); K.tag(ns, 'nightSwitch');
  const nsc = textCanvas(256, 140, [{ t: '계단문 야간 잠금', size: 26, bold: true, align: 'center' }, { t: '위: 잠금   아래: 해제', size: 22, align: 'center' }], { bg: '#e8e4d4', pad: 10 });
  K.canvasPlane(nsc, 0.32, 0.17, 5.2, 1.82, -2.97);
  // 전기난로 (④에 꽂혀 있음)
  const ht = new THREE.Group();
  K.box(0.45, 0.55, 0.22, K.std({ color: 0x9a9a92, roughness: 0.4, metalness: 0.5 }), 0, 0.3, 0, ht);
  refs.heaterGlow = new THREE.MeshStandardMaterial({ color: 0x331100, emissive: 0xff5010, emissiveIntensity: 0 });
  for (let i = 0; i < 3; i++) K.box(0.36, 0.02, 0.01, refs.heaterGlow, 0, 0.18 + i * 0.12, 0.115, ht);
  refs.plug = K.box(0.05, 0.07, 0.05, M.black, 0.32, 0.25, -0.05, ht);
  ht.position.set(4.6, 0, -2.6); scene.add(ht); K.tag(ht, 'heater');
  K.collide(4.35, 4.85, -2.75, -2.45);
  refs.heaterLight = K.pointLight(0xff6020, 0, 4.6, 0.4, -2.3, false, 256, 2.5);
  // 빈 열쇠함
  const kb = new THREE.Group(); K.box(0.5, 0.6, 0.06, M.wood, 0, 0, 0, kb);
  for (let i = 0; i < 12; i++) K.box(0.012, 0.012, 0.04, M.steel, -0.18 + (i % 4) * 0.12, 0.2 - Math.floor(i / 4) * 0.18, 0.04, kb);
  kb.position.set(5.6, 1.5, 0.57); kb.rotation.y = Math.PI; scene.add(kb); K.tag(kb, 'keybox');
  // 달력
  const cal = textCanvas(300, 380, [{ t: '1999', size: 40, bold: true, align: 'center' }, { t: '12월', size: 60, bold: true, align: 'center', color: '#b02020' }, { t: '일 월 화 수 목 금 토', size: 24, align: 'center' }, { t: '26 27 28 29 30 (31)', size: 26, align: 'center' }], { bg: '#f4f1e6', pad: 14 });
  K.tag(K.canvasPlane(cal, 0.3, 0.38, 6.97, 1.6, -0.2, -Math.PI / 2), 'calendar');

  const areas = [
    { x0: LOBBY.x0, x1: LOBBY.x1, z0: LOBBY.z0, z1: LOBBY.z1 },
    { x0: GUARD.x0, x1: GUARD.x1, z0: GUARD.z0, z1: GUARD.z1 },
    { x0: 3.6, x1: 4.4, z0: GDOOR.z0 + 0.22, z1: GDOOR.z1 - 0.22, tight: true, open: () => ctx.S.guardOpen },
  ];
  return { refs, areas, colliders: K.colliders };
}
