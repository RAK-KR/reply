// 효과음과 공간 소리 (WebAudio로 직접 합성, 외부 파일 없음)
let ctx = null, master = null, humGain = null, dripTimer = null, waterGain = null, pumpGain = null;

function whiteBuffer(sec = 1) {
  const b = ctx.createBuffer(1, Math.max(1, ctx.sampleRate * sec), ctx.sampleRate);
  const d = b.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  return b;
}
function brownBuffer(sec = 3) {
  const b = ctx.createBuffer(1, ctx.sampleRate * sec, ctx.sampleRate);
  const d = b.getChannelData(0);
  let last = 0;
  for (let i = 0; i < d.length; i++) { last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02; d[i] = last * 3.5; }
  return b;
}

export function initAudio() {
  if (ctx) return;
  ctx = new (window.AudioContext || window.webkitAudioContext)();
  master = ctx.createGain();
  master.gain.value = window.BSSettings ? window.BSSettings.get('vol') : 0.8;
  window.addEventListener('reply-vol', (e) => { master.gain.setTargetAtTime(e.detail, ctx.currentTime, 0.03); });
  master.connect(ctx.destination);
  // 형광등과 전선의 웅웅거림 (전기가 들어와 있을 때)
  humGain = ctx.createGain(); humGain.gain.value = 0;
  [100, 200, 300].forEach((f, i) => { const o = ctx.createOscillator(); o.frequency.value = f; const g = ctx.createGain(); g.gain.value = [1, 0.35, 0.15][i]; o.connect(g); g.connect(humGain); o.start(); });
  humGain.connect(master);
  // 건물 전체의 낮은 바람 소리
  const n = ctx.createBufferSource(); n.buffer = brownBuffer(4); n.loop = true;
  const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 380;
  const g = ctx.createGain(); g.gain.value = 0.03;
  n.connect(lp); lp.connect(g); g.connect(master); n.start();
  // 물 소리 (지하층)
  const w = ctx.createBufferSource(); w.buffer = brownBuffer(5); w.loop = true;
  const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 900; bp.Q.value = 0.4;
  waterGain = ctx.createGain(); waterGain.gain.value = 0;
  w.connect(bp); bp.connect(waterGain); waterGain.connect(master); w.start();
  // 펌프
  const p = ctx.createOscillator(); p.type = 'sawtooth'; p.frequency.value = 48;
  const pl = ctx.createBiquadFilter(); pl.type = 'lowpass'; pl.frequency.value = 220;
  pumpGain = ctx.createGain(); pumpGain.gain.value = 0;
  p.connect(pl); pl.connect(pumpGain); pumpGain.connect(master); p.start();
}

export function setHum(level) { if (ctx) humGain.gain.setTargetAtTime(level * 0.006, ctx.currentTime, 0.08); }
export function setWater(level) { if (ctx) waterGain.gain.setTargetAtTime(level * 0.05, ctx.currentTime, 0.6); }
export function setPump(on) { if (ctx) pumpGain.gain.setTargetAtTime(on ? 0.05 : 0, ctx.currentTime, 0.4); }
export function setDrips(on) {
  clearInterval(dripTimer);
  if (!on) return;
  dripTimer = setInterval(() => { if (Math.random() < 0.5) tone({ freq: 1400 + Math.random() * 900, dur: 0.06, gain: 0.025, slide: 0.6 }); }, 1700);
}

function burst({ freq = 1000, q = 1, dur = 0.08, gain = 0.3, type = 'bandpass', delay = 0 }) {
  if (!ctx) return;
  const t = ctx.currentTime + delay;
  const s = ctx.createBufferSource();
  s.buffer = whiteBuffer(dur + 0.05);
  const f = ctx.createBiquadFilter();
  f.type = type; f.frequency.value = freq; f.Q.value = q;
  const g = ctx.createGain();
  g.gain.setValueAtTime(gain, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  s.connect(f); f.connect(g); g.connect(master);
  s.start(t); s.stop(t + dur + 0.05);
}
function tone({ freq = 200, dur = 0.2, gain = 0.2, type = 'sine', delay = 0, slide = 0, attack = 0.01 }) {
  if (!ctx) return;
  const t = ctx.currentTime + delay;
  const o = ctx.createOscillator();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if (slide) o.frequency.exponentialRampToValueAtTime(freq * slide, t + dur);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(gain, t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g); g.connect(master);
  o.start(t); o.stop(t + dur + 0.05);
}

export const sfx = {
  step() { burst({ freq: 160 + Math.random() * 60, q: 0.8, dur: 0.09, gain: 0.12, type: 'lowpass' }); burst({ freq: 1200, q: 3, dur: 0.03, gain: 0.025, delay: 0.02 }); },
  paper() { burst({ freq: 3000, q: 0.6, dur: 0.18, gain: 0.08, type: 'highpass' }); burst({ freq: 2400, q: 0.6, dur: 0.12, gain: 0.05, type: 'highpass', delay: 0.12 }); },
  dial() { burst({ freq: 2600, q: 8, dur: 0.025, gain: 0.12 }); },
  wrong() { tone({ freq: 140, dur: 0.18, gain: 0.12, type: 'square' }); burst({ freq: 400, q: 2, dur: 0.06, gain: 0.1 }); },
  unlock() { burst({ freq: 1800, q: 6, dur: 0.04, gain: 0.2 }); burst({ freq: 900, q: 4, dur: 0.08, gain: 0.2, delay: 0.08 }); tone({ freq: 90, dur: 0.15, gain: 0.15, delay: 0.08 }); },
  drawer() { burst({ freq: 300, q: 0.5, dur: 0.4, gain: 0.12, type: 'lowpass' }); burst({ freq: 2200, q: 4, dur: 0.05, gain: 0.04, delay: 0.3 }); },
  door() { tone({ freq: 62, dur: 0.7, gain: 0.14, type: 'sawtooth', slide: 0.7 }); burst({ freq: 500, q: 1, dur: 0.5, gain: 0.06 }); burst({ freq: 3000, q: 6, dur: 0.12, gain: 0.03, delay: 0.5 }); },
  clank() { tone({ freq: 420, dur: 0.5, gain: 0.08, type: 'triangle', slide: 0.97 }); tone({ freq: 1130, dur: 0.35, gain: 0.04, type: 'sine' }); burst({ freq: 2500, q: 3, dur: 0.05, gain: 0.12 }); },
  key() { burst({ freq: 4200, q: 10, dur: 0.05, gain: 0.08 }); burst({ freq: 5200, q: 10, dur: 0.05, gain: 0.06, delay: 0.06 }); },
  breaker() { burst({ freq: 900, q: 3, dur: 0.05, gain: 0.25 }); tone({ freq: 70, dur: 0.12, gain: 0.2, type: 'square', delay: 0.02 }); },
  trip() { tone({ freq: 55, dur: 0.5, gain: 0.35, type: 'triangle', slide: 0.5 }); burst({ freq: 200, q: 1, dur: 0.25, gain: 0.3, type: 'lowpass' }); burst({ freq: 3000, q: 2, dur: 0.06, gain: 0.12 }); },
  screw() { for (let i = 0; i < 6; i++) burst({ freq: 3500 + Math.random() * 800, q: 12, dur: 0.03, gain: 0.05, delay: i * 0.09 }); },
  cloth() { burst({ freq: 800, q: 0.4, dur: 0.5, gain: 0.08 }); },
  crt() { tone({ freq: 15600, dur: 0.6, gain: 0.015 }); burst({ freq: 200, q: 0.5, dur: 0.3, gain: 0.12, type: 'lowpass' }); },
  // 단말기에 글자가 찍히는 소리
  print(n = 10) { for (let i = 0; i < n; i++) burst({ freq: 2600 + (i % 3) * 300, q: 6, dur: 0.018, gain: 0.05, delay: i * 0.045 }); },
  recv() { tone({ freq: 1180, dur: 0.09, gain: 0.05, type: 'square' }); tone({ freq: 1580, dur: 0.09, gain: 0.04, type: 'square', delay: 0.11 }); },
  send() { tone({ freq: 980, dur: 0.06, gain: 0.04, type: 'square' }); },
  // 과거가 바뀌었을 때: 낮게 빨려 들어가는 소리
  changed() {
    tone({ freq: 70, dur: 2.2, gain: 0.16, type: 'sine', slide: 1.6, attack: 0.9 });
    tone({ freq: 140.5, dur: 2.0, gain: 0.05, type: 'triangle', slide: 1.5, attack: 0.9 });
    burst({ freq: 600, q: 0.4, dur: 1.4, gain: 0.05, type: 'lowpass', delay: 0.2 });
  },
  reveal() { [110, 164.8, 220, 261.6].forEach((f, i) => tone({ freq: f, dur: 5, gain: 0.05, type: 'sine', delay: i * 0.35, attack: 0.4 })); },
  alarm() { for (let i = 0; i < 6; i++) tone({ freq: i % 2 ? 660 : 880, dur: 0.3, gain: 0.05, type: 'square', delay: i * 0.32 }); },
  water() { burst({ freq: 500, q: 0.3, dur: 1.4, gain: 0.08, type: 'lowpass' }); },
  ending() {
    const notes = [220, 261.6, 329.6, 293.7, 246.9, 261.6, 196, 220];
    notes.forEach((f, i) => { tone({ freq: f, dur: 1.8, gain: 0.045, delay: i * 0.7, attack: 0.2 }); tone({ freq: f / 2, dur: 2.4, gain: 0.03, delay: i * 0.7, attack: 0.3 }); });
  },
  bad() { [98, 92.5, 87.3].forEach((f, i) => tone({ freq: f, dur: 3, gain: 0.12, type: 'sawtooth', delay: i * 0.9, slide: 0.9 })); },
};
export const sfx2 = sfx;
