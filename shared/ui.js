// 화면 위 UI: 안내 문구, 조사 창, 자물쇠, 번호판, 수첩
import { sfx } from './audio.js';

const $ = (id) => document.getElementById(id);

// 포인터 잠금을 유지한 채 조사 창을 조작하는 가상 커서
const cursor = {
  x: 0, y: 0, on: false,
  el() { return $('vcursor'); },
  show() {
    this.on = true;
    this.x = window.innerWidth / 2; this.y = window.innerHeight / 2;
    this.el().classList.add('show');
    this.place();
  },
  hide() { this.on = false; this.el().classList.remove('show'); this.hover(null); },
  move(dx, dy) {
    if (!this.on) return;
    this.x = Math.max(0, Math.min(window.innerWidth - 1, this.x + dx));
    this.y = Math.max(0, Math.min(window.innerHeight - 1, this.y + dy));
    this.place();
  },
  place() {
    this.el().style.transform = `translate(${this.x}px, ${this.y}px)`;
    this.hover(document.elementFromPoint(this.x, this.y));
  },
  hover(el) {
    const b = el && el.closest ? el.closest('button') : null;
    if (this._h && this._h !== b) this._h.classList.remove('vhover');
    if (b) b.classList.add('vhover');
    this._h = b;
  },
  target() { return document.elementFromPoint(this.x, this.y); },
  click() {
    const el = this.target();
    if (!el) return;
    if (!el.closest('#panel')) { ui.close(); return; }   // 창 바깥을 누르면 닫기
    const b = el.closest('button');
    if (b) b.click();
  },
  wheel(dy) {
    const el = this.target();
    if (el && el.classList.contains('dial-val')) el.dispatchEvent(new WheelEvent('wheel', { deltaY: dy, cancelable: true }));
  },
};

export const ui = {
  open: false,
  onClose: null,
  cursor,

  prompt(text) {
    const el = $('prompt');
    if (!text) { el.classList.remove('show'); return; }
    el.textContent = text;
    el.classList.add('show');
  },

  crosshair(active) {
    $('crosshair').classList.toggle('active', !!active);
  },

  toast(text, ms = 3800) {
    const el = $('toast');
    el.textContent = text;
    el.classList.add('show');
    clearTimeout(this._tt);
    this._tt = setTimeout(() => el.classList.remove('show'), ms);
  },

  inventory(items) {
    const names = this.names || {};
    $('inventory').innerHTML = items.map((i) => `<div class="slot"><span class="ico ico-${i}"></span>${names[i]}</div>`).join('');
  },

  // 조사 창. content: HTMLElement 또는 HTML 문자열
  panel({ title = '', content = '', text = '', buttons = [], wide = false, onClose = null }) {
    const p = $('panel');
    const body = $('panel-body');
    $('panel-title').textContent = title;
    body.innerHTML = '';
    if (typeof content === 'string') body.innerHTML = content;
    else if (content) body.appendChild(content);
    $('panel-text').innerHTML = text;
    const bar = $('panel-buttons');
    bar.innerHTML = '';
    buttons.forEach((b) => {
      const btn = document.createElement('button');
      btn.textContent = b.label;
      btn.onclick = (e) => { e.stopPropagation(); b.onClick(); };
      bar.appendChild(btn);
    });
    p.classList.toggle('wide', wide);
    $('overlay').classList.add('show');
    this.open = true;
    this.onClose = onClose;
  },

  setText(html) { $('panel-text').innerHTML = html; },

  close() {
    if (!this.open) return;
    $('overlay').classList.remove('show');
    this.open = false;
    const cb = this.onClose;
    this.onClose = null;
    cb && cb();
  },

  canvasEl(c, maxW = 520) {
    const img = document.createElement('img');
    img.src = c.toDataURL();
    img.style.maxWidth = maxW + 'px';
    img.className = 'closeup';
    return img;
  },

  // 다이얼 자물쇠 (숫자 n칸)
  dialLock(n, onSubmit) {
    const wrap = document.createElement('div');
    wrap.className = 'dials';
    const vals = new Array(n).fill(0);
    const cols = [];
    for (let i = 0; i < n; i++) {
      const col = document.createElement('div');
      col.className = 'dial';
      const up = document.createElement('button'); up.textContent = '▲';
      const v = document.createElement('div'); v.className = 'dial-val'; v.textContent = '0';
      const dn = document.createElement('button'); dn.textContent = '▼';
      const set = (d) => { vals[i] = (vals[i] + d + 10) % 10; v.textContent = vals[i]; sfx.dial(); };
      up.onclick = (e) => { e.stopPropagation(); set(1); };
      dn.onclick = (e) => { e.stopPropagation(); set(-1); };
      v.onwheel = (e) => { e.preventDefault(); set(e.deltaY < 0 ? 1 : -1); };
      col.append(up, v, dn);
      wrap.appendChild(col);
      cols.push(v);
    }
    const go = document.createElement('button');
    go.className = 'dial-go';
    go.textContent = '당겨 보기';
    go.onclick = (e) => { e.stopPropagation(); onSubmit(vals.join(''), wrap); };
    wrap.appendChild(go);
    // 키보드: 숫자를 누르면 현재 칸에 넣고 다음 칸으로
    let cur = 0;
    const mark = () => cols.forEach((c, i) => c.classList.toggle('cur', i === cur));
    mark();
    wrap.press = (k) => {
      if (/^[0-9]$/.test(k)) { vals[cur] = +k; cols[cur].textContent = k; sfx.dial(); cur = Math.min(n - 1, cur + 1); }
      else if (k === 'Backspace' || k === 'ArrowLeft') cur = Math.max(0, cur - 1);
      else if (k === 'ArrowRight') cur = Math.min(n - 1, cur + 1);
      else if (k === 'ArrowUp' || k === 'ArrowDown') { vals[cur] = (vals[cur] + (k === 'ArrowUp' ? 1 : 9)) % 10; cols[cur].textContent = vals[cur]; sfx.dial(); }
      else if (k === 'Enter') { onSubmit(vals.join(''), wrap); cur = 0; }
      mark();
    };
    wrap.setValue = (s) => { s.split('').forEach((d, i) => { vals[i] = +d; cols[i].textContent = d; }); };
    return wrap;
  },

  keypad(onSubmit) {
    const wrap = document.createElement('div');
    wrap.className = 'keypad';
    const screen = document.createElement('div');
    screen.className = 'kp-screen';
    let val = '';
    const render = () => { screen.textContent = val.padEnd(4, '_').split('').join(' '); };
    render();
    wrap.appendChild(screen);
    const grid = document.createElement('div');
    grid.className = 'kp-grid';
    ['1', '2', '3', '4', '5', '6', '7', '8', '9', '지움', '0', '확인'].forEach((k) => {
      const b = document.createElement('button');
      b.textContent = k;
      b.onclick = (e) => {
        e.stopPropagation();
        sfx.dial();
        if (k === '지움') val = val.slice(0, -1);
        else if (k === '확인') { if (val.length === 4) { const v = val; val = ''; render(); onSubmit(v, wrap); return; } }
        else if (val.length < 4) val += k;
        render();
      };
      grid.appendChild(b);
    });
    wrap.appendChild(grid);
    wrap.press = (k) => {
      if (/^[0-9]$/.test(k) && val.length < 4) { val += k; sfx.dial(); }
      else if (k === 'Backspace') val = val.slice(0, -1);
      else if (k === 'Enter' && val.length === 4) { const v = val; val = ''; render(); onSubmit(v, wrap); return; }
      render();
    };
    return wrap;
  },

  shake(el) {
    el.classList.remove('shake');
    void el.offsetWidth;
    el.classList.add('shake');
  },

  fade(on, color = '#000', ms = 1200) {
    const f = $('fade');
    f.style.background = color;
    f.style.transition = `opacity ${ms}ms`;
    f.classList.toggle('show', on);
  },
};
