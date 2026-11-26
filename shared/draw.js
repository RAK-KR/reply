// 공통 그림 도구 (3~5편)
// 조사 화면, 액자 사진, 벽에 맺히는 바깥 풍경 등을 캔버스에 그린다

export function makeCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return c;
}

export function rng(seed) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

export const HAND = '"Nanum Pen Script", "Gaegu", cursive';
export const SERIF = '"Nanum Myeongjo", serif';

export function grain(ctx, w, h, amt, seed) {
  const r = rng(seed);
  const img = ctx.getImageData(0, 0, w, h);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const n = (r() - 0.5) * amt;
    d[i] += n; d[i + 1] += n; d[i + 2] += n;
  }
  ctx.putImageData(img, 0, 0);
}

export function vignette(ctx, w, h, strength = 0.6, color = '0,0,0') {
  const g = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.25, w / 2, h / 2, Math.max(w, h) * 0.7);
  g.addColorStop(0, `rgba(${color},0)`);
  g.addColorStop(1, `rgba(${color},${strength})`);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
}

export function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.max(0, Math.min(255, (n >> 16) + amt));
  const g = Math.max(0, Math.min(255, ((n >> 8) & 255) + amt));
  const b = Math.max(0, Math.min(255, (n & 255) + amt));
  return `rgb(${r},${g},${b})`;
}

export function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// ───────── 초상 사진 ─────────
const PEOPLE = {
  grandpa: { hair: 'bald', glasses: true, coat: '#2a2420' },
  woman: { hair: 'long', glasses: false, coat: '#3b2c2c' },
  child: { hair: 'short', glasses: false, coat: '#4a3c2a', small: true },
  man: { hair: 'short', glasses: false, coat: '#25262a' },
  couple: { couple: true },
};

export function drawPortrait(c, who, seed = 1) {
  const ctx = c.getContext('2d'), w = c.width, h = c.height;
  const bg = ctx.createRadialGradient(w / 2, h * 0.4, 0, w / 2, h / 2, w * 0.8);
  bg.addColorStop(0, '#b9a585'); bg.addColorStop(1, '#5e4e38');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);
  const p = PEOPLE[who];
  if (p.couple) {
    figure(ctx, w * 0.36, h, w * 0.85, PEOPLE.man);
    figure(ctx, w * 0.66, h, w * 0.78, PEOPLE.woman);
  } else {
    figure(ctx, w / 2, h, p.small ? w * 0.8 : w, p);
  }
  soften(c, 1.6);
  ctx.fillStyle = 'rgba(110,70,25,0.26)';
  ctx.fillRect(0, 0, w, h);
  vignette(ctx, w, h, 0.65);
  grain(ctx, w, h, 26, seed * 13);
}

// 오래된 인화지처럼 살짝 흐리게
export function soften(c, px) {
  const tmp = makeCanvas(c.width, c.height);
  const t = tmp.getContext('2d');
  t.filter = `blur(${px}px) sepia(0.35) contrast(0.92)`;
  t.drawImage(c, 0, 0);
  const ctx = c.getContext('2d');
  ctx.clearRect(0, 0, c.width, c.height);
  ctx.drawImage(tmp, 0, 0);
}

function figure(ctx, cx, h, scale, p) {
  const s = scale / 300;
  const headY = h * (p.small ? 0.5 : 0.4);
  // 몸
  ctx.fillStyle = p.coat;
  ctx.beginPath();
  ctx.moveTo(cx - 110 * s, h);
  ctx.quadraticCurveTo(cx - 100 * s, headY + 80 * s, cx, headY + 70 * s);
  ctx.quadraticCurveTo(cx + 100 * s, headY + 80 * s, cx + 110 * s, h);
  ctx.fill();
  // 옷깃
  ctx.fillStyle = '#d8d0c0';
  ctx.beginPath();
  ctx.moveTo(cx - 22 * s, headY + 72 * s); ctx.lineTo(cx, headY + 110 * s); ctx.lineTo(cx + 22 * s, headY + 72 * s);
  ctx.fill();
  // 목
  ctx.fillStyle = '#b58d68';
  ctx.fillRect(cx - 16 * s, headY + 40 * s, 32 * s, 36 * s);
  // 머리카락 (긴 머리는 얼굴 뒤)
  if (p.hair === 'long') {
    ctx.fillStyle = '#1e1610';
    ctx.beginPath(); ctx.ellipse(cx, headY + 10 * s, 58 * s, 85 * s, 0, 0, Math.PI * 2); ctx.fill();
  }
  // 얼굴
  const fg = ctx.createRadialGradient(cx - 12 * s, headY - 10 * s, 5 * s, cx, headY, 60 * s);
  fg.addColorStop(0, '#e0bf98'); fg.addColorStop(1, '#a37b58');
  ctx.fillStyle = fg;
  ctx.beginPath(); ctx.ellipse(cx, headY, 44 * s, 56 * s, 0, 0, Math.PI * 2); ctx.fill();
  // 머리
  ctx.fillStyle = p.hair === 'bald' ? '#cfcac0' : '#1e1610';
  if (p.hair === 'bald') {
    ctx.beginPath(); ctx.ellipse(cx - 40 * s, headY - 10 * s, 10 * s, 22 * s, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(cx + 40 * s, headY - 10 * s, 10 * s, 22 * s, 0, 0, Math.PI * 2); ctx.fill();
  } else {
    ctx.beginPath(); ctx.ellipse(cx, headY - 34 * s, 46 * s, 28 * s, 0, Math.PI, Math.PI * 2); ctx.fill();
  }
  // 눈
  ctx.fillStyle = '#2a1c12';
  ctx.beginPath(); ctx.ellipse(cx - 16 * s, headY - 4 * s, 5 * s, 3 * s, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(cx + 16 * s, headY - 4 * s, 5 * s, 3 * s, 0, 0, Math.PI * 2); ctx.fill();
  if (p.glasses) {
    ctx.strokeStyle = '#1a120c'; ctx.lineWidth = 3 * s;
    ctx.beginPath(); ctx.arc(cx - 17 * s, headY - 4 * s, 13 * s, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.arc(cx + 17 * s, headY - 4 * s, 13 * s, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx - 4 * s, headY - 5 * s); ctx.lineTo(cx + 4 * s, headY - 5 * s); ctx.stroke();
  }
  // 입 (살짝 웃음)
  ctx.strokeStyle = '#6a3e2a'; ctx.lineWidth = 2.5 * s;
  ctx.beginPath(); ctx.arc(cx, headY + 22 * s, 12 * s, 0.2 * Math.PI, 0.8 * Math.PI); ctx.stroke();
}

// 문서 HTML. hand: 'pen'(손글씨, 떨림) / 'neat'(인쇄) / 'type'(타자기) / 'print'(단말 프린터)
// 인쇄 계열은 줄에 HTML을 그대로 쓸 수 있다 (<s>번짐</s>, <span class="burnt">탐</span>, <span class="new">바뀐 줄</span>)
export function letterHTML(letter) {
  const printed = ['neat', 'type', 'print'].includes(letter.hand);
  const r = rng((letter.size || 20) * 7);
  const shake = printed ? 0 : (letter.shake ?? 0.2);
  const lines = letter.body.map((line) => {
    if (!line) return '<div class="line empty"></div>';
    if (printed || !shake || line.includes('<')) return `<div class="line">${line}</div>`;
    const chars = [...line].map((ch) => {
      if (ch === ' ') return ' ';
      const rot = (r() - 0.5) * 18 * shake;
      const dy = (r() - 0.5) * 10 * shake;
      return `<span style="display:inline-block;transform:translateY(${dy.toFixed(1)}px) rotate(${rot.toFixed(1)}deg)">${ch}</span>`;
    }).join('');
    return `<div class="line">${chars}</div>`;
  }).join('');
  const full = letter.body.filter((l) => l).length, empty = letter.body.length - full;
  const avail = (typeof window !== 'undefined' ? window.innerHeight : 900) * 0.9 - 200;
  const base = letter.size || (printed ? 15 : 28);
  const fs = Math.max(Math.min(base, 13), Math.min(base, avail / (full * (printed ? 1.75 : 1.36) + empty * 0.6 + 1.4)));
  const cls = printed ? `paper ${letter.hand}` : 'paper';
  return `<div class="${cls}" style="font-size:${fs.toFixed(1)}px">
    ${letter.date ? `<div class="date">${letter.date}</div>` : ''}${lines}</div>`;
}

// 크고 삐뚤빼뚤한 글씨 (눈이 거의 안 보이는 사람이 쓴 글씨)
export function shakyText(ctx, text, x, y, size, seed, color = '#2b2238', align = 'left') {
  const r = rng(seed);
  ctx.save();
  ctx.font = `${size}px ${HAND}`;
  const total = ctx.measureText(text).width * 1.05;
  let cx = align === 'center' ? x - total / 2 : x;
  for (const ch of text) {
    const cw = ctx.measureText(ch).width * 1.05;
    ctx.save();
    ctx.translate(cx + cw / 2, y + (r() - 0.5) * size * 0.18);
    ctx.rotate((r() - 0.5) * 0.3);
    ctx.font = `${size * (0.88 + r() * 0.28)}px ${HAND}`;
    ctx.textAlign = 'center';
    ctx.fillStyle = color;
    ctx.fillText(ch, 0, 0);
    ctx.restore();
    cx += cw;
  }
  ctx.restore();
}

// 종이 쪽지 (거울·물건에 붙은 것)
export function drawNote(c, lines, seed = 1, size = 0) {
  const ctx = c.getContext('2d'), w = c.width, h = c.height;
  ctx.fillStyle = '#ece3c9';
  ctx.fillRect(0, 0, w, h);
  vignette(ctx, w, h, 0.25, '120,90,40');
  // 테이프
  ctx.fillStyle = 'rgba(230,220,180,0.75)';
  ctx.fillRect(w * 0.38, -4, w * 0.24, h * 0.09);
  const fs = size || Math.min(h / (lines.length + 1) * 0.92, w / Math.max(...lines.map((l) => l.length)) * 1.6);
  lines.forEach((l, i) => shakyText(ctx, l, w * 0.07, (i + 1) * (h / (lines.length + 0.8)), fs, seed * 7 + i));
  grain(ctx, w, h, 10, seed + 3);
}


// 네거티브 필름 한 컷. painter(ctx, x, y, w, h)가 내용(명암 반전 톤)을 그린다.
// mark: 할아버지가 자르기 전 필름 가장자리에 써 둔 글씨의 한 조각
export function negativeFrame(c, painter, mark = '') {
  const ctx = c.getContext('2d'), w = c.width, h = c.height;
  ctx.fillStyle = '#2a1f12'; ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = '#c87a2a';
  for (let x = 8; x < w; x += 26) { ctx.fillRect(x, 6, 12, 10); ctx.fillRect(x, h - 16, 12, 10); }
  const fx = w * 0.1, fy = h * 0.18, fw = w * 0.8, fh = h * 0.64;
  ctx.fillStyle = '#d9a35a'; ctx.fillRect(fx, fy, fw, fh);
  ctx.save(); ctx.beginPath(); ctx.rect(fx, fy, fw, fh); ctx.clip();
  painter(ctx, fx, fy, fw, fh);
  ctx.restore();
  if (mark) {
    // 가장자리에 마커로 쓴 글씨 조각 (아래 테두리, 크게)
    ctx.save();
    ctx.fillStyle = 'rgba(245,240,225,0.92)';
    ctx.font = `bold ${h * 0.16}px "Nanum Pen Script", cursive`;
    ctx.textAlign = 'center';
    ctx.fillText(mark, w / 2, h * 0.96);
    ctx.restore();
  }
  grain(ctx, w, h, 18, 31);
}
// 네거티브 안의 작은 시계 (시, 분)
export function negClock(ctx, cx, cy, r, hh, mm) {
  ctx.fillStyle = '#5a3410'; ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#f2d39a'; ctx.lineWidth = Math.max(2, r * 0.12); ctx.lineCap = 'round';
  const hand = (a, len) => { ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(a - Math.PI / 2) * len, cy + Math.sin(a - Math.PI / 2) * len); ctx.stroke(); };
  hand(((hh % 12) + mm / 60) / 12 * Math.PI * 2, r * 0.5);
  hand(mm / 60 * Math.PI * 2, r * 0.8);
}
