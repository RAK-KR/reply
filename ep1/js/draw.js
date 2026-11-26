// 1편 그림: 분전반, 직원 소개판, 안내도, 동전, CCTV 녹화기
import { makeCanvas, grain, roundRect, rng } from '../../shared/draw.js';
import { CIRCUITS } from './content.js';

const SANS = '"Gothic A1", sans-serif';
const MONO = '"Nanum Gothic Coding", monospace';

export function drawPanelFace(c, S) {
  const x = c.getContext('2d'), w = c.width, h = c.height;
  x.fillStyle = '#4a5452'; x.fillRect(0, 0, w, h);
  x.fillStyle = '#e8e2cc'; x.fillRect(20, 16, w - 40, 46);
  x.fillStyle = '#222'; x.font = `bold 26px ${SANS}`; x.textAlign = 'center'; x.fillText('1층 분전반', w / 2, 48);
  // 주 차단기
  const main = S.main;
  x.fillStyle = '#2a2e2d'; roundRect(x, w / 2 - 60, 80, 120, 90, 10); x.fill();
  x.fillStyle = main ? '#d0d0c8' : '#7a2a20'; roundRect(x, w / 2 - 22, main ? 92 : 122, 44, 36, 6); x.fill();
  x.fillStyle = '#ddd'; x.font = `18px ${SANS}`; x.fillText(main ? '주 차단기 ON' : '주 차단기 OFF', w / 2, 192);
  CIRCUITS.forEach((cc, i) => {
    const bx = 30 + (i % 3) * 120, by = 220 + Math.floor(i / 3) * 140;
    x.fillStyle = '#2a2e2d'; roundRect(x, bx, by, 100, 110, 8); x.fill();
    const on = S[cc.id];
    x.fillStyle = on ? '#d8d8d0' : '#555'; roundRect(x, bx + 34, on ? by + 12 : by + 42, 32, 30, 5); x.fill();
    x.fillStyle = '#efe8d0'; x.fillRect(bx + 4, by + 80, 92, 26);
    x.fillStyle = '#222'; x.font = `bold 15px ${SANS}`;
    const n = '①②③④⑤⑥'[i];
    x.fillText(`${n} ${cc.name.split(' · ')[0]}`, bx + 50, by + 98);
  });
  grain(x, w, h, 10, 4);
}

const STAFF = [
  ['구인모', '책임연구원', '8601', '#3a4a5a'],
  ['윤서경', '연구원', '9504', '#5a3a4a'],
  ['마태진', '설비 기사', '9107', '#4a4a3a'],
  ['박정만', '경비', '9802', '#3a5a4a'],
];
export function drawStaff(c) {
  const x = c.getContext('2d'), w = c.width, h = c.height;
  x.fillStyle = '#dcd6c2'; x.fillRect(0, 0, w, h);
  x.fillStyle = '#2f4a46'; x.fillRect(0, 0, w, 60);
  x.fillStyle = '#eef'; x.font = `bold 30px ${SANS}`; x.textAlign = 'center'; x.fillText('함께 일하는 사람들 · 1999', w / 2, 42);
  STAFF.forEach(([n, t, id, col], i) => {
    const bx = 30 + i * 215, by = 86;
    x.fillStyle = '#f4f1e6'; x.fillRect(bx, by, 190, 300);
    x.fillStyle = col; x.fillRect(bx + 35, by + 16, 120, 150);
    // 얼굴 실루엣 (바랜 사진)
    x.fillStyle = 'rgba(230,220,200,0.55)'; x.beginPath(); x.arc(bx + 95, by + 70, 30, 0, 7); x.fill();
    x.beginPath(); x.ellipse(bx + 95, by + 160, 50, 46, 0, Math.PI, 0); x.fill();
    x.fillStyle = '#222'; x.font = `bold 30px ${SANS}`; x.fillText(n, bx + 95, by + 210);
    x.font = `20px ${SANS}`; x.fillText(t, bx + 95, by + 242);
    x.fillStyle = '#666'; x.font = `18px ${MONO}`; x.fillText(`사번 ${id}`, bx + 95, by + 276);
  });
  grain(x, w, h, 16, 9);
}

export function drawPlanSign(c) {
  const x = c.getContext('2d'), w = c.width, h = c.height;
  x.fillStyle = '#1e3532'; x.fillRect(0, 0, w, h);
  x.fillStyle = '#e8f2ee'; x.font = `bold 30px ${SANS}`; x.textAlign = 'center'; x.fillText('층별 안내', w / 2, 52);
  const rows = [['1F', '로비 · 경비실'], ['B1', '기록 보관실'], ['B2', '실험실 · 공명로'], ['B3', '기계실'], ['B4', '금고실 · 배수 터널']];
  rows.forEach(([f, t], i) => {
    const y = 110 + i * 80;
    x.fillStyle = '#3f6f6a'; roundRect(x, 30, y - 36, 80, 56, 8); x.fill();
    x.fillStyle = '#fff'; x.font = `bold 30px ${SANS}`; x.fillText(f, 70, y + 2);
    x.textAlign = 'left'; x.font = `26px ${SANS}`; x.fillText(t, 130, y + 2); x.textAlign = 'center';
  });
  x.fillStyle = '#9fd0c4'; x.font = `18px ${SANS}`; x.fillText('금고 단말(T5)은 별도 회선', w / 2, 520);
  grain(x, w, h, 10, 3);
}

export function drawCoin(c) {
  const x = c.getContext('2d'), w = c.width, h = c.height;
  x.fillStyle = '#3a2e24'; x.fillRect(0, 0, w, h);
  const r = rng(5);
  for (let i = 0; i < 300; i++) { x.fillStyle = `rgba(${90 + r() * 40},${70 + r() * 30},50,0.5)`; x.fillRect(r() * w, r() * h, 3, 3); }
  const cx = w / 2, cy = h / 2, R = h * 0.36;
  const g = x.createRadialGradient(cx - 30, cy - 30, 10, cx, cy, R);
  g.addColorStop(0, '#d8d2bc'); g.addColorStop(1, '#8a8470');
  x.fillStyle = g; x.beginPath(); x.arc(cx, cy, R, 0, 7); x.fill();
  x.strokeStyle = '#6a6452'; x.lineWidth = 6; x.stroke();
  x.fillStyle = '#5e5848'; x.font = `bold 64px ${SANS}`; x.textAlign = 'center'; x.fillText('500', cx, cy + 10);
  x.font = `bold 26px ${SANS}`; x.fillText('1999', cx, cy + 60);
  // 녹
  for (let i = 0; i < 30; i++) { x.fillStyle = `rgba(110,80,40,${0.2 + r() * 0.3})`; x.beginPath(); x.arc(cx + (r() - 0.5) * R * 1.6, cy + (r() - 0.5) * R * 1.6, 3 + r() * 10, 0, 7); x.fill(); }
  // 긁힌 Y
  x.strokeStyle = 'rgba(240,235,220,0.9)'; x.lineWidth = 4; x.lineCap = 'round';
  x.beginPath(); x.moveTo(cx - 40, cy - 70); x.lineTo(cx - 6, cy - 30); x.lineTo(cx + 34, cy - 74); x.moveTo(cx - 6, cy - 30); x.lineTo(cx - 8, cy + 4); x.stroke();
  grain(x, w, h, 14, 7);
}

export function drawRecorder(c) {
  const x = c.getContext('2d'), w = c.width, h = c.height;
  x.fillStyle = '#141616'; x.fillRect(0, 0, w, h);
  x.fillStyle = '#081a0c'; roundRect(x, 40, 50, w - 80, 120, 10); x.fill();
  x.fillStyle = '#5fe08a'; x.font = `30px ${MONO}`; x.textAlign = 'center';
  x.fillText('LAST REC 99-12-31 22:07', w / 2, 110);
  x.font = `24px ${MONO}`; x.fillText('MANUAL STOP', w / 2, 150);
  x.fillStyle = '#aaa'; x.font = `20px ${SANS}`; x.fillText('CCTV 녹화기 — 1층 로비 · 지하 복도', w / 2, 220);
  grain(x, w, h, 10, 2);
}
export { makeCanvas };
