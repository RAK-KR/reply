// 연구소 공통 재질과 소품 (콘크리트, 그을음, 형광등, 단말기, 프린터, 사물함, 배관)
import * as THREE from 'three';
import { makeCanvas, rng, grain, roundRect } from './draw.js';

function tex(c, rx = 1, ry = 1) {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(rx, ry);
  t.anisotropy = 8;
  return t;
}
function blot(ctx, r, w, h, n, color, maxR) {
  for (let i = 0; i < n; i++) {
    const x = r() * w, y = r() * h, rad = maxR * (0.3 + r());
    const g = ctx.createRadialGradient(x, y, 0, x, y, rad);
    g.addColorStop(0, color); g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g; ctx.fillRect(x - rad, y - rad, rad * 2, rad * 2);
  }
}

// 페인트 칠한 벽: 아래는 청록 띠, 위는 미색. soot: 0~1 그을음, wet: 아래 물 자국
export function wallCanvas({ low = '#3f6f6a', high = '#cfcabb', split = 0.36, soot = 0, wet = 0, seed = 5, decay = 0.5 } = {}) {
  const w = 512, h = 512, c = makeCanvas(w, h), x = c.getContext('2d'), r = rng(seed);
  x.fillStyle = high; x.fillRect(0, 0, w, h);
  x.fillStyle = low; x.fillRect(0, h * (1 - split), w, h * split);
  x.fillStyle = 'rgba(0,0,0,0.25)'; x.fillRect(0, h * (1 - split) - 3, w, 4);
  blot(x, r, w, h, 10 + decay * 20, `rgba(90,80,50,${0.05 + decay * 0.08})`, 120);
  // 벗겨진 페인트
  for (let i = 0; i < decay * 26; i++) {
    x.fillStyle = `rgba(150,150,140,${0.3 + r() * 0.4})`;
    const px = r() * w, py = r() * h, s = 4 + r() * 18;
    x.beginPath(); x.ellipse(px, py, s, s * (0.4 + r() * 0.6), r() * 3, 0, Math.PI * 2); x.fill();
  }
  // 흘러내린 얼룩
  for (let i = 0; i < decay * 10; i++) {
    const px = r() * w; const g = x.createLinearGradient(px, 0, px, h);
    g.addColorStop(0, 'rgba(70,60,40,0)'); g.addColorStop(0.5, 'rgba(70,60,40,0.12)'); g.addColorStop(1, 'rgba(70,60,40,0)');
    x.fillStyle = g; x.fillRect(px, r() * h * 0.5, 3 + r() * 5, h * 0.6);
  }
  if (wet) { const g = x.createLinearGradient(0, h, 0, h * (1 - wet)); g.addColorStop(0, 'rgba(20,30,28,0.55)'); g.addColorStop(1, 'rgba(20,30,28,0)'); x.fillStyle = g; x.fillRect(0, h * (1 - wet), w, h * wet); }
  if (soot) {
    const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, `rgba(10,8,6,${0.85 * soot})`); g.addColorStop(0.7, `rgba(10,8,6,${0.35 * soot})`); g.addColorStop(1, 'rgba(10,8,6,0.05)');
    x.fillStyle = g; x.fillRect(0, 0, w, h);
    blot(x, r, w, h, 30 * soot, `rgba(5,4,3,${0.4 * soot})`, 120);
  }
  grain(x, w, h, 14, seed + 1);
  return c;
}
export function concreteCanvas({ tone = 120, soot = 0, wet = 0, seed = 9 } = {}) {
  const w = 512, h = 512, c = makeCanvas(w, h), x = c.getContext('2d'), r = rng(seed);
  x.fillStyle = `rgb(${tone},${tone + 2},${tone - 2})`; x.fillRect(0, 0, w, h);
  blot(x, r, w, h, 40, 'rgba(60,60,55,0.12)', 90);
  blot(x, r, w, h, 25, 'rgba(200,200,190,0.06)', 70);
  x.strokeStyle = 'rgba(50,50,45,0.25)'; x.lineWidth = 2;
  for (let y = 0; y <= h; y += 128) { x.beginPath(); x.moveTo(0, y); x.lineTo(w, y); x.stroke(); }
  for (let i = 0; i < 30; i++) { x.fillStyle = 'rgba(40,40,35,0.4)'; x.beginPath(); x.arc(r() * w, r() * h, 1 + r() * 2, 0, 7); x.fill(); }
  if (wet) { blot(x, r, w, h, 20, `rgba(20,30,30,${0.3 * wet})`, 140); }
  if (soot) { blot(x, r, w, h, 40 * soot, `rgba(8,6,4,${0.5 * soot})`, 130); }
  grain(x, w, h, 18, seed + 2);
  return c;
}
export function floorCanvas({ base = '#6d7672', soot = 0, wet = 0, seed = 13, tile = 128 } = {}) {
  const w = 512, h = 512, c = makeCanvas(w, h), x = c.getContext('2d'), r = rng(seed);
  for (let ty = 0; ty < h; ty += tile) for (let tx = 0; tx < w; tx += tile) {
    const v = (r() - 0.5) * 16;
    x.fillStyle = base; x.fillRect(tx, ty, tile, tile);
    x.fillStyle = `rgba(${v > 0 ? 255 : 0},${v > 0 ? 255 : 0},${v > 0 ? 255 : 0},${Math.abs(v) / 200})`; x.fillRect(tx, ty, tile, tile);
  }
  // 테라조 점
  for (let i = 0; i < 900; i++) { x.fillStyle = `rgba(${200 + r() * 50},${200 + r() * 50},${190 + r() * 50},${0.15 + r() * 0.25})`; x.fillRect(r() * w, r() * h, 1 + r() * 3, 1 + r() * 3); }
  x.strokeStyle = 'rgba(30,35,33,0.45)'; x.lineWidth = 2;
  for (let p = 0; p <= w; p += tile) { x.beginPath(); x.moveTo(p, 0); x.lineTo(p, h); x.stroke(); x.beginPath(); x.moveTo(0, p); x.lineTo(w, p); x.stroke(); }
  blot(x, r, w, h, 18, 'rgba(60,50,30,0.12)', 100);
  if (wet) blot(x, r, w, h, 16, `rgba(10,20,20,${0.45 * wet})`, 150);
  if (soot) blot(x, r, w, h, 26 * soot, `rgba(6,5,4,${0.55 * soot})`, 120);
  grain(x, w, h, 12, seed + 3);
  return c;
}
export function ceilingCanvas({ soot = 0, seed = 17 } = {}) {
  const w = 512, h = 512, c = makeCanvas(w, h), x = c.getContext('2d'), r = rng(seed);
  x.fillStyle = '#c9c7bc'; x.fillRect(0, 0, w, h);
  for (let i = 0; i < 1500; i++) { x.fillStyle = 'rgba(90,90,80,0.25)'; x.fillRect(r() * w, r() * h, 1.5, 1.5); }
  x.strokeStyle = '#8c8a80'; x.lineWidth = 5;
  for (let p = 0; p <= w; p += 256) { x.beginPath(); x.moveTo(p, 0); x.lineTo(p, h); x.stroke(); x.beginPath(); x.moveTo(0, p); x.lineTo(w, p); x.stroke(); }
  blot(x, r, w, h, 8, 'rgba(120,90,40,0.18)', 90);
  if (soot) blot(x, r, w, h, 40 * soot, `rgba(5,4,3,${0.7 * soot})`, 140);
  return c;
}

export function labMats(K, o = {}) {
  const soot = o.soot || 0, wet = o.wet || 0;
  const m = (c, rx, ry, extra = {}) => new THREE.MeshStandardMaterial({ map: tex(c, rx, ry), roughness: 0.9, ...extra });
  return {
    wall: m(wallCanvas({ soot, wet, seed: o.seed || 5, decay: o.decay ?? 0.6 }), 1, 1),
    wallClean: m(wallCanvas({ soot: 0, wet: 0, seed: (o.seed || 5) + 50, decay: o.decay ?? 0.6 }), 1, 1),
    concrete: m(concreteCanvas({ soot, wet, seed: (o.seed || 5) + 3 }), 1, 1, { roughness: 1 }),
    floor: m(floorCanvas({ soot, wet, seed: (o.seed || 5) + 7 }), 1, 1, { roughness: wet ? 0.35 : 0.75 }),
    ceiling: m(ceilingCanvas({ soot, seed: (o.seed || 5) + 11 }), 1, 1, { roughness: 1 }),
    steel: new THREE.MeshStandardMaterial({ color: 0x7d8a88, roughness: 0.45, metalness: 0.7 }),
    darkSteel: new THREE.MeshStandardMaterial({ color: 0x3a4240, roughness: 0.5, metalness: 0.7 }),
    rust: new THREE.MeshStandardMaterial({ color: 0x6e4a32, roughness: 0.9, metalness: 0.3 }),
    green: new THREE.MeshStandardMaterial({ color: 0x40655f, roughness: 0.55, metalness: 0.3 }),
    cream: new THREE.MeshStandardMaterial({ color: 0xc8c2ac, roughness: 0.6 }),
    beige: new THREE.MeshStandardMaterial({ color: 0xbdb59a, roughness: 0.5 }),
    black: new THREE.MeshStandardMaterial({ color: 0x141616, roughness: 0.6 }),
    rubber: new THREE.MeshStandardMaterial({ color: 0x1b1d1d, roughness: 0.95 }),
    glass: new THREE.MeshStandardMaterial({ color: 0x9fc0c0, roughness: 0.05, metalness: 0.1, transparent: true, opacity: 0.16 }),
    paper: new THREE.MeshStandardMaterial({ color: 0xd9d3b8, roughness: 0.95 }),
    wood: new THREE.MeshStandardMaterial({ color: 0x5c4630, roughness: 0.7 }),
    charred: new THREE.MeshStandardMaterial({ color: 0x1a1612, roughness: 1 }),
    water: new THREE.MeshStandardMaterial({ color: 0x1c3a3a, roughness: 0.05, metalness: 0.4, transparent: true, opacity: 0.85 }),
  };
}

// 벽 한 조각: 텍스처 한 장이 바닥(0)부터 천장(H)까지 걸리게 (아래 청록 띠가 한 번만)
export function wallPiece(K, a, b, y0, y1, fixed, facing, mat, H) {
  if (y1 <= y0 + 0.001 || b <= a + 0.001) return null;
  const len = b - a, mid = (a + b) / 2;
  const ry = { s: Math.PI, n: 0, e: Math.PI / 2, w: -Math.PI / 2 }[facing];
  const m = mat.clone(); m.map = mat.map.clone();
  m.map.repeat.set(Math.max(0.3, len / 2.2), (y1 - y0) / H);
  m.map.offset.set(a / 2.2, y0 / H);
  m.map.needsUpdate = true;
  m.shadowSide = THREE.DoubleSide;
  const hh = y1 - y0;
  const p = new THREE.Mesh(new THREE.PlaneGeometry(len + 0.04, hh + 0.02), m);
  p.rotation.set(0, ry, 0);
  if (facing === 'n' || facing === 's') p.position.set(mid, (y0 + y1) / 2, fixed); else p.position.set(fixed, (y0 + y1) / 2, mid);
  p.receiveShadow = true; p.castShadow = true;
  K.scene.add(p);
  return p;
}

// 네모난 방 하나 (벽, 바닥, 천장). doors: [{ side:'n'|'s'|'e'|'w', a, b, h }]
export function room(K, M, { x0, x1, z0, z1, h = 3, doors = [], wall = M.wall, floor = M.floor, ceil = M.ceiling }) {
  const fl = K.floor(x0, x1, z0, z1, K.repeat(floor, (x1 - x0) / 2, (z1 - z0) / 2));
  K.ceiling(x0, x1, z0, z1, K.repeat(ceil, (x1 - x0) / 2, (z1 - z0) / 2), h);
  const pieces = [];
  const side = (s, a, b, fixed, facing) => {
    const ds = doors.filter((d) => d.side === s).sort((p, q) => p.a - q.a);
    let cur = a;
    ds.forEach((d) => {
      pieces.push(wallPiece(K, cur, d.a, 0, h, fixed, facing, wall, h));
      pieces.push(wallPiece(K, d.a, d.b, d.h || 2.1, h, fixed, facing, wall, h));
      cur = d.b;
    });
    pieces.push(wallPiece(K, cur, b, 0, h, fixed, facing, wall, h));
  };
  side('n', x0, x1, z0, 'n');
  side('s', x0, x1, z1, 's');
  side('w', z0, z1, x0, 'e');
  side('e', z0, z1, x1, 'w');
  return { floor: fl, walls: pieces.filter(Boolean) };
}

// 형광등 (켜고 끄기, 깜빡임)
export function tube(K, x, y, z, { len = 1.2, axis = 'x', color = 0xe8fff6, intensity = 4, dist = 7, shadow = false } = {}) {
  const g = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color: 0xdde8e2, emissive: color, emissiveIntensity: 0 });
  const housing = new THREE.MeshStandardMaterial({ color: 0xb8bcb4, roughness: 0.6, metalness: 0.4 });
  const L = axis === 'x' ? [len, 0.05, 0.16] : [0.16, 0.05, len];
  K.box(...L, housing, 0, 0.03, 0, g);
  const t = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, len * 0.94, 10), mat);
  if (axis === 'x') t.rotation.z = Math.PI / 2; else t.rotation.x = Math.PI / 2;
  t.userData.noHit = true; g.add(t);
  g.position.set(x, y, z); K.add(g, x, y, z);
  const l = K.pointLight(color, 0, x, y - 0.15, z, shadow, 512, dist);
  let on = false, flick = 0;
  return {
    set(v) { on = v; mat.emissiveIntensity = v ? 2.2 : 0; l.intensity = v ? intensity : 0; },
    flicker(v) { flick = v; },
    update(t2) {
      if (!on || !flick) return;
      const f = Math.sin(t2 * 31) * Math.sin(t2 * 7.3) > 0.93 - flick * 0.2 ? 0.15 : 1;
      mat.emissiveIntensity = 2.2 * f; l.intensity = intensity * f;
    },
    light: l,
  };
}

// 단말기 (CRT). draw(lines)로 화면 내용을 바꾼다
export function crt(K, M, id, x, y, z, ry = 0, { color = 0xbdb59a } = {}) {
  const g = new THREE.Group();
  const body = new THREE.MeshStandardMaterial({ color, roughness: 0.55 });
  K.box(0.46, 0.38, 0.42, body, 0, 0.19, 0, g);
  K.box(0.32, 0.16, 0.18, body, 0, 0.32, -0.24, g);
  K.box(0.5, 0.03, 0.2, body, 0, 0.015, 0.34, g); // 키보드
  for (let i = 0; i < 4; i++) K.box(0.44, 0.012, 0.03, M.cream, 0, 0.035, 0.27 + i * 0.035, g);
  const c = makeCanvas(512, 400);
  const t = tex(c);
  const scr = new THREE.Mesh(new THREE.PlaneGeometry(0.36, 0.28), new THREE.MeshBasicMaterial({ map: t, toneMapped: false }));
  scr.position.set(0, 0.2, 0.212); g.add(scr);
  g.rotation.y = ry; g.position.set(x, y, z); K.scene.add(g); K.tag(g, id);
  const glow = K.pointLight(0x55ff88, 0, x + Math.sin(ry) * 0.5, y + 0.25, z + Math.cos(ry) * 0.5, false, 256, 2.2);
  function draw(lines, on = true, tint = '#7cf29a') {
    const x2 = c.getContext('2d');
    x2.fillStyle = on ? '#02130a' : '#0b0d0c'; x2.fillRect(0, 0, 512, 400);
    if (on) {
      x2.font = '22px "Nanum Gothic Coding", monospace'; x2.fillStyle = tint;
      x2.shadowColor = tint; x2.shadowBlur = 8;
      lines.slice(-13).forEach((l, i) => x2.fillText(l.slice(0, 32), 20, 38 + i * 27));
      x2.shadowBlur = 0;
      for (let yy = 0; yy < 400; yy += 3) { x2.fillStyle = 'rgba(0,0,0,0.25)'; x2.fillRect(0, yy, 512, 1); }
    } else {
      const gr = x2.createRadialGradient(200, 150, 10, 256, 200, 300); gr.addColorStop(0, 'rgba(120,140,130,0.15)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
      x2.fillStyle = gr; x2.fillRect(0, 0, 512, 400);
    }
    t.needsUpdate = true;
    glow.intensity = on ? 0.12 : 0;
  }
  draw([], false);
  return { group: g, draw };
}

// 도트 프린터 (트레이에 종이가 있으면 보인다)
export function printer(K, M, id, x, y, z, ry = 0) {
  const g = new THREE.Group();
  const body = new THREE.MeshStandardMaterial({ color: 0xb4ae96, roughness: 0.6 });
  K.box(0.44, 0.14, 0.3, body, 0, 0.07, 0, g);
  K.box(0.4, 0.02, 0.06, M.black, 0, 0.145, 0.02, g);
  const paper = new THREE.Group();
  K.box(0.32, 0.005, 0.26, M.paper, 0, 0.003, 0.29, paper);
  const sheet = K.box(0.32, 0.22, 0.004, M.paper, 0, 0.25, -0.06, paper);
  sheet.rotation.x = -0.25;
  g.add(paper); paper.visible = false;
  g.rotation.y = ry; g.position.set(x, y, z); K.scene.add(g); K.tag(g, id);
  return { group: g, paper };
}

// 사물함 한 칸. 반환: { door(pivot), group }
export function locker(K, M, id, x, z, ry, { w = 0.42, h = 1.8, d = 0.45, label = '', color = 0x5d7a72, sticker = null } = {}) {
  const g = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.55, metalness: 0.45 });
  K.box(w, h, 0.02, mat, 0, h / 2, -d / 2 + 0.01, g);
  K.box(0.02, h, d, mat, -w / 2 + 0.01, h / 2, 0, g);
  K.box(0.02, h, d, mat, w / 2 - 0.01, h / 2, 0, g);
  K.box(w, 0.02, d, mat, 0, h - 0.01, 0, g);
  K.box(w, 0.02, d, mat, 0, 0.01, 0, g);
  K.box(w - 0.04, 0.02, d - 0.04, mat, 0, h * 0.72, 0, g);
  const pivot = new THREE.Group(); pivot.position.set(-w / 2, 0, d / 2); g.add(pivot);
  const door = new THREE.Group(); pivot.add(door);
  K.box(w - 0.01, h - 0.02, 0.02, mat, w / 2, h / 2, 0, door);
  for (let i = 0; i < 5; i++) K.box(w * 0.5, 0.012, 0.01, M.black, w / 2, h * 0.82 + i * 0.03, 0.012, door);
  K.box(0.04, 0.1, 0.03, M.steel, w - 0.06, h * 0.5, 0.02, door);
  if (label) {
    const c = makeCanvas(256, 96); const x2 = c.getContext('2d');
    x2.fillStyle = '#e8e4d2'; x2.fillRect(0, 0, 256, 96); x2.fillStyle = '#222'; x2.font = 'bold 44px "Gothic A1", sans-serif'; x2.textAlign = 'center'; x2.fillText(label, 128, 64);
    const p = new THREE.Mesh(new THREE.PlaneGeometry(w * 0.6, w * 0.22), new THREE.MeshStandardMaterial({ map: tex(c) }));
    p.position.set(w / 2, h * 0.66, 0.012); door.add(p);
  }
  if (sticker) { const p = new THREE.Mesh(new THREE.PlaneGeometry(0.09, 0.09), new THREE.MeshStandardMaterial({ map: tex(sticker) })); p.position.set(w * 0.3, h * 0.55, 0.012); door.add(p); }
  g.rotation.y = ry; g.position.set(x, 0, z); K.scene.add(g); K.tag(g, id);
  return { group: g, pivot };
}

// 배관 (두 점 사이 원통)
export function pipe(K, mat, a, b, r = 0.05) {
  const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b);
  const len = A.distanceTo(B);
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 12), mat);
  m.position.copy(A).add(B).multiplyScalar(0.5);
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), B.clone().sub(A).normalize());
  m.castShadow = true; m.receiveShadow = true;
  K.scene.add(m);
  return m;
}

// 글자 판 (표지판, 종이) — lines: [{ t, size, color, font, align }] 또는 문자열
export function textCanvas(w, h, lines, { bg = '#e4e0d3', fg = '#1e2830', font = '"Gothic A1", sans-serif', pad = 24, size = 30, gap = 1.35, align = 'left', border = '' } = {}) {
  const c = makeCanvas(w, h), x = c.getContext('2d');
  if (bg) { x.fillStyle = bg; x.fillRect(0, 0, w, h); }
  if (border) { x.strokeStyle = border; x.lineWidth = 6; x.strokeRect(6, 6, w - 12, h - 12); }
  let y = pad;
  lines.forEach((l) => {
    const L = typeof l === 'string' ? { t: l } : l;
    const s = L.size || size;
    y += s;
    x.font = `${L.bold ? 'bold ' : ''}${s}px ${L.font || font}`;
    x.fillStyle = L.color || fg;
    x.textAlign = L.align || align;
    const xx = (L.align || align) === 'center' ? w / 2 : (L.align || align) === 'right' ? w - pad : pad;
    x.fillText(L.t, xx, y);
    y += s * (gap - 1);
  });
  return c;
}
export { tex as canvasTex, roundRect };
