// 단말기 대화 (청람망). 받은 글자는 한 줄씩 찍히고, 보낼 수 있는 말은 목록으로 고른다.
// log: [{ who: 'them' | 'me' | 'sys', text, line? }]
import { sfx } from './audio.js';

export function makeLink({ onLine } = {}) {
  const link = {
    log: [],
    queue: [],
    busy: false,
    listeners: [],
    // 상대가 보낸 줄들 (한 줄씩 시간 차를 두고 찍힘)
    recv(lines, who = 'them') {
      (Array.isArray(lines) ? lines : [lines]).forEach((t) => this.queue.push({ who, text: t }));
      this.pump();
    },
    me(text) { this.log.push({ who: 'me', text }); sfx.send(); this.emit(); onLine && onLine({ who: 'me', text }); },
    sys(text) { this.log.push({ who: 'sys', text }); this.emit(); },
    pump() {
      if (this.busy || !this.queue.length) return;
      this.busy = true;
      const m = this.queue.shift();
      const delay = link.fast ? 0 : 650 + Math.min(1400, m.text.length * 28);
      setTimeout(() => {
        this.log.push(m);
        sfx.print(Math.min(16, 4 + m.text.length / 3));
        if (m.who === 'them' || m.who === 'real') sfx.recv();
        this.busy = false;
        this.emit();
        onLine && onLine(m);
        this.pump();
      }, delay);
    },
    get waiting() { return this.busy || this.queue.length > 0; },
    emit() { this.listeners.forEach((f) => f()); },
    on(f) { this.listeners.push(f); return () => { this.listeners = this.listeners.filter((g) => g !== f); }; },
  };
  return link;
}

// 대화 창. sends(): [{ id, label, input?: n }] / onSend(id, value)
export function terminalPanel(ctx, link, { title, header, sends, onSend, footer = '' }) {
  const { ui } = ctx;
  const wrap = document.createElement('div');
  wrap.className = 'term';
  const screen = document.createElement('div');
  screen.className = 'term-screen';
  const box = document.createElement('div');
  box.className = 'term-sends';
  wrap.append(screen, box);
  let inputMode = null;

  function renderLog() {
    const head = `<div class="t-head">${header}</div>`;
    screen.innerHTML = head + link.log.map((m) => `<div class="t-line t-${m.who}">${m.who === 'me' ? '&gt; ' : ''}${esc(m.text)}</div>`).join('')
      + (link.waiting ? '<div class="t-line t-wait">▌</div>' : '');
    screen.scrollTop = screen.scrollHeight;
  }
  function renderSends() {
    box.innerHTML = '';
    if (inputMode) return;
    if (link.waiting) { box.innerHTML = '<div class="t-note">글자가 찍히는 중…</div>'; return; }
    const list = sends();
    if (!list.length) { box.innerHTML = `<div class="t-note">${footer || '지금은 보낼 말이 없다. 무언가 더 알아내야 한다.'}</div>`; return; }
    list.forEach((s) => {
      const b = document.createElement('button');
      b.textContent = s.label;
      b.onclick = (e) => {
        e.stopPropagation();
        if (s.input) { openInput(s); return; }
        onSend(s.id);
        refresh();
      };
      box.appendChild(b);
    });
  }
  function openInput(s) {
    inputMode = s;
    box.innerHTML = `<div class="t-note">${s.prompt || '보낼 숫자'}</div>`;
    const lock = ui.dialLock(s.input, (v) => {
      inputMode = null; ctx.setInput(null);
      onSend(s.id, v);
      refresh();
    });
    lock.querySelector('.dial-go').textContent = '보내기';
    const cancel = document.createElement('button');
    cancel.textContent = '취소';
    cancel.onclick = (e) => { e.stopPropagation(); inputMode = null; ctx.setInput(null); refresh(); };
    box.append(lock, cancel);
    ctx.setInput(lock);
  }
  function refresh() { renderLog(); renderSends(); }
  const off = link.on(refresh);
  refresh();
  ctx.openPanel({ title, content: wrap, wide: true, onClose: () => { off(); ctx.setInput(null); } });
}

function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
