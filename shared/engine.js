// 공통 엔진: 렌더러, 입력, 조사 창, 수첩, 2단계 힌트, 단말기 대화, 과거 변화 알림, 엔딩
// 편마다 다른 것(방, 퍼즐, 상호작용, 대사)은 game 객체로 받는다.
import * as THREE from 'three';
import { Player } from './player.js';
import { ui } from './ui.js';
import { initAudio, sfx, sfx2 } from './audio.js';
import { makeCanvas, letterHTML } from './draw.js';
import { makeLink, terminalPanel } from './terminal.js';

const $ = (id) => document.getElementById(id);

export function run(game) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = game.exposure || 1.0;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  $('game').appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x000000);
  const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.03, 60);
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  ui.names = game.itemNames;
  let S = game.createState();
  const notes = [];
  const seen = {};
  let refs, player;
  let started = false, ended = false, startTime = 0;
  let hovered = null;
  let activeInput = null;
  const link = makeLink({ onLine: (m) => game.onLine && game.onLine(m, ctx) });

  const ctx = {
    THREE, scene, camera, renderer, ui, sfx, sfx2, link,
    get S() { return S; },
    get refs() { return refs; },
    get player() { return player; },
    get startTime() { return startTime; },
    get started() { return started; },
    say: (t, ms) => ui.toast(t, ms),
    once: (k) => { if (seen[k]) return false; seen[k] = true; return true; },
    act(id) { const ok = game.doAction(S, id); ui.inventory(S.inv); return ok; },
    has: (i) => S.inv.includes(i),
    img: (c, w) => ui.canvasEl(c, w),
    makeCanvas,
    note(id) { if (!notes.includes(id)) notes.push(id); },
    openPanel(opts) {
      ui.panel({ ...opts, onClose: () => { activeInput = null; opts.onClose && opts.onClose(); resume(); } });
      if (player.locked) ui.cursor.show();
    },
    setInput(el) { activeInput = el; },
    // 과거(1999년)에서 한 일이 지금(2026년)에 반영됐을 때
    changed(text, ms = 6500) {
      sfx.changed();
      const el = $('changed');
      el.classList.remove('show'); void el.offsetWidth; el.classList.add('show');
      setTimeout(() => ui.toast(`…무언가 달라졌다. ${text || ''}`, ms), 900);
    },
    showDoc(key, extra = '', page = 0) {
      if (game.showDoc && game.showDoc(key, ctx, page)) return;
      const d = game.docs[key];
      sfx.paper(); ctx.note(key);
      const body = typeof d.body === 'function' ? d.body(S) : d.body;
      if (d.pages) {
        const [a, b] = d.pages[page];
        const last = page === d.pages.length - 1;
        ctx.openPanel({
          title: `${d.title} (${page + 1}/${d.pages.length})`, content: letterHTML({ ...d, body: body.slice(a, b) }), text: extra, wide: true,
          buttons: [
            ...(page > 0 ? [{ label: '앞 장', onClick: () => { ui.close(); setTimeout(() => ctx.showDoc(key, extra, page - 1), 40); } }] : []),
            ...(!last ? [{ label: '다음 장', onClick: () => { ui.close(); setTimeout(() => ctx.showDoc(key, extra, page + 1), 40); } }] : []),
          ],
        });
        return;
      }
      ctx.openPanel({ title: d.title, content: letterHTML({ ...d, body }), text: extra, wide: true });
    },
    dial(n, check, title, text) {
      const lock = ui.dialLock(n, (v, el) => {
        if (check(v)) { sfx.unlock(); ui.close(); }
        else { sfx.wrong(); ui.shake(el); }
      });
      ctx.openPanel({ title, content: lock, text: `${text}<br><span class="keyhelp">숫자 키로 바로 입력 · Enter</span>` });
      activeInput = lock;
    },
    keypad(title, text, check) {
      const pad = ui.keypad((v, el) => { if (check(v)) { sfx.unlock(); ui.close(); } else { sfx.wrong(); ui.shake(el); } });
      ctx.openPanel({ title, content: pad, text: `${text}<br><span class="keyhelp">숫자 키로 바로 입력 · Enter</span>` });
      activeInput = pad;
    },
    terminal(opts) { terminalPanel(ctx, link, opts); },
    finish,
    badEnd,
  };

  function resume() {
    ui.cursor.hide();
    if (!started || ended || document.pointerLockElement) return;
    setTimeout(() => { if (!ui.open) renderer.domElement.requestPointerLock?.(); }, 30);
  }

  const H = game.handlers(ctx);

  // ───────── 수첩 / 힌트 ─────────
  function notebook() {
    const extra = game.notebookExtra ? game.notebookExtra(ctx) : [];
    if (!notes.length && !extra.length) { ctx.say('아직 수첩에 적힌 게 없다.'); return; }
    const list = document.createElement('div'); list.className = 'notes';
    notes.forEach((n) => {
      const b = document.createElement('button');
      b.textContent = game.docs[n].title;
      b.onclick = (e) => { e.stopPropagation(); ui.close(); setTimeout(() => ctx.showDoc(n), 50); };
      list.appendChild(b);
    });
    extra.forEach(({ label, open }) => {
      const b = document.createElement('button');
      b.textContent = label;
      b.onclick = (e) => { e.stopPropagation(); ui.close(); setTimeout(open, 50); };
      list.appendChild(b);
    });
    ctx.openPanel({ title: '수첩', content: list, text: '읽은 것과 적어 둔 것을 다시 볼 수 있다.' });
  }
  function hint() {
    const h = game.hintText(S, ctx);
    const [small, full] = Array.isArray(h) ? h : [h, h];
    ctx.openPanel({
      title: '힌트', text: '어려운 편입니다. 막혔을 때만 보세요.',
      buttons: [
        { label: '살짝 보기', onClick: () => ui.setText(`<b>살짝</b><br>${small}`) },
        { label: '정답 보기', onClick: () => ui.setText(`<b>정답</b><br>${full}`) },
        { label: '닫기', onClick: () => ui.close() },
      ],
    });
  }

  // ───────── 조준 ─────────
  const ray = new THREE.Raycaster();
  ray.far = 2.6;
  const center = new THREE.Vector2(0, 0);
  const findId = (o) => { while (o) { if (o.userData && o.userData.id) return o.userData.id; o = o.parent; } return null; };

  function updateHover() {
    if (!player.locked || ui.open) { hovered = null; ui.prompt(''); ui.crosshair(false); return; }
    ray.setFromCamera(center, camera);
    const hits = ray.intersectObjects(scene.children, true);
    let id = null;
    for (const h of hits) {
      if (h.object.isPoints || h.object.userData.noHit || !h.object.visible) continue;
      if (!visibleChain(h.object)) continue;
      id = findId(h.object);
      break;
    }
    if (game.hoverFilter) id = game.hoverFilter(id, ctx);
    hovered = id;
    const label = id ? (typeof game.labels[id] === 'function' ? game.labels[id](S) : game.labels[id]) : '';
    ui.prompt(id ? `[E] ${label || ''}` : '');
    ui.crosshair(!!id);
  }
  function visibleChain(o) { while (o) { if (!o.visible) return false; o = o.parent; } return true; }

  function onUse() {
    if (!started || ended) return;
    if (ui.open) { ui.close(); return; }
    if (!player.locked) return;
    if (hovered && H[hovered]) H[hovered]();
  }

  document.addEventListener('keydown', (e) => {
    if (!started || ended) return;
    if (activeInput && ui.open && /^([0-9]|Backspace|Enter|ArrowUp|ArrowDown|ArrowLeft|ArrowRight)$/.test(e.key)) { activeInput.press(e.key); e.preventDefault(); return; }
    if (e.code === 'KeyE' || e.code === 'Space') { e.preventDefault(); onUse(); }
    else if (e.code === 'Escape' && ui.open) ui.close();
    else if (e.code === 'Tab') { e.preventDefault(); if (ui.open) ui.close(); else notebook(); }
    else if (e.code === 'KeyH' && !ui.open) hint();
  });
  renderer.domElement.addEventListener('mousedown', (e) => {
    if (!started || ended || e.button !== 0) return;
    if (ui.open && player.locked) { ui.cursor.click(); return; }
    if (!player.locked) { if (!ui.open) renderer.domElement.requestPointerLock?.(); return; }
    onUse();
  });
  document.addEventListener('mousemove', (e) => { if (ui.open && player.locked) ui.cursor.move(e.movementX, e.movementY); });
  renderer.domElement.addEventListener('wheel', (e) => { if (ui.open && player.locked) ui.cursor.wheel(e.deltaY); });
  $('overlay').addEventListener('mousedown', (e) => { if (e.target.id === 'overlay') ui.close(); });
  document.addEventListener('pointerlockerror', () => { if (started && !ended && !ui.open) $('pause').classList.add('show'); });
  $('pause').addEventListener('click', () => { renderer.domElement.requestPointerLock?.(); });
  document.addEventListener('pointerlockchange', () => {
    player.locked = document.pointerLockElement === renderer.domElement;
    if (!player.locked) ui.cursor.hide();
    $('pause').classList.toggle('show', started && !ended && !player.locked && !ui.open);
  });
  window.addEventListener('reply-sens', (e) => { if (player) player.sensitivity = e.detail; });

  // ───────── 엔딩 ─────────
  function finish() {
    ended = true;
    document.exitPointerLock?.();
    ui.prompt('');
    sfx.door();
    setTimeout(() => ui.fade(true, game.fadeColor || '#05090a', 2400), 700);
    setTimeout(showEnding, 3300);
  }
  function showEnding() {
    window.BSP && window.BSP.markCleared(game.epNum);
    sfx.ending();
    const el = $('ending'), body = $('ending-lines');
    body.innerHTML = '';
    el.classList.add('show');
    const step = game.endingStep || 2.1;
    let n = 0;
    const put = (node, d) => { node.style.animationDelay = `${d}s`; body.appendChild(node); };
    game.ending.forEach((t) => { const p = document.createElement('p'); p.textContent = t; put(p, 0.6 + n++ * step); });
    const last = document.createElement('p'); last.className = 'last'; last.textContent = game.endingLast;
    put(last, 1.4 + n * step);
    let d = 3 + n * step;
    if (game.summary) {
      const h = document.createElement('h3'); h.textContent = game.summary.title; put(h, d);
      game.summary.items.forEach(([a, b]) => {
        const it = document.createElement('div'); it.className = 'sum';
        it.innerHTML = `<b>${a}</b><span>${b}</span>`;
        put(it, d += 0.35);
      });
      d += 1;
    }
    const secs = Math.round((performance.now() - startTime) / 1000);
    const meta = document.createElement('p'); meta.className = 'meta';
    meta.innerHTML = `${game.epLabel} 플레이 시간 ${Math.floor(secs / 60)}분 ${secs % 60}초<br><button id="again">처음부터</button>${game.nextLink ? ` <button id="toNext">${game.nextLink.label}</button>` : ''} <button id="toHub">목록으로</button>`;
    put(meta, d + 0.6);
    $('again').onclick = () => location.reload();
    if (game.nextLink) $('toNext').onclick = () => { location.href = game.nextLink.href; };
    $('toHub').onclick = () => { location.href = '../'; };
    el.onmousedown = (e) => { if (e.target.tagName !== 'BUTTON') body.classList.add('all'); };
    ui.fade(false, game.fadeColor || '#05090a', 2000);
  }
  // 나쁜 결말: 화면을 보여 주고, 되돌리면 저장해 둔 상태로 돌아간다
  function badEnd({ lines, last, restore }) {
    document.exitPointerLock?.();
    ui.close();
    sfx.bad();
    const el = $('badend'), body = $('badend-lines');
    body.innerHTML = '';
    lines.forEach((t, i) => { const p = document.createElement('p'); p.textContent = t; p.style.animationDelay = `${0.5 + i * 1.6}s`; body.appendChild(p); });
    const l = document.createElement('p'); l.className = 'last'; l.textContent = last; l.style.animationDelay = `${1 + lines.length * 1.6}s`; body.appendChild(l);
    const b = document.createElement('button'); b.textContent = '보내기 전으로 되돌리기';
    b.style.animationDelay = `${2 + lines.length * 1.6}s`;
    b.onclick = () => { el.classList.remove('show'); if (restore) S = restore(S); ui.inventory(S.inv); renderer.domElement.requestPointerLock?.(); };
    body.appendChild(b);
    el.classList.add('show');
  }

  function start() {
    initAudio();
    $('title').classList.remove('show');
    const intro = $('intro');
    intro.classList.add('show');
    const box = $('intro-lines');
    box.innerHTML = '';
    game.intro.forEach((t, i) => { const p = document.createElement('p'); p.textContent = t; p.style.animationDelay = `${0.2 + i * 0.9}s`; box.appendChild(p); });
    const go = () => {
      if (started) return;
      started = true;
      intro.classList.remove('show');
      startTime = performance.now();
      renderer.domElement.requestPointerLock?.();
      setTimeout(() => ctx.say(game.startHint || '[E] 또는 클릭 살펴보기 · [Tab] 수첩 · [H] 힌트', 6000), 800);
      game.onStart && game.onStart(ctx);
    };
    $('intro-skip').onclick = go;
    window.__skipIntro = go;
  }

  async function boot() {
    try { await Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 3000))]); } catch (_) {}
    const built = game.buildRoom(scene, ctx);
    refs = built.refs;
    player = new Player(camera);
    player.areas = built.areas;
    player.colliders = built.colliders;
    player.pos.set(game.startPos.x, 1.6, game.startPos.z);
    player.yaw = game.startPos.yaw || 0;
    player.onStep = () => sfx.step();
    try { const s = localStorage.getItem('reply-sens'); if (s) player.sensitivity = +s; } catch (_) {}
    ui.inventory(S.inv);
    game.onBuilt && game.onBuilt(ctx);
    $('loading').classList.remove('show');
    $('title').classList.add('show');
    $('start').onclick = start;
    let last = performance.now();
    const loop = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (started) { player.frozen = ui.open || ended; player.update(dt); }
      else game.titleCamera(camera, now / 1000);
      game.update && game.update(ctx, dt, now / 1000);
      updateHover();
      renderer.render(scene, camera);
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);

    window.__game = {
      get S() { return S; }, H, player, ui, camera, ctx, link,
      get hovered() { player.update(0); camera.updateMatrixWorld(); updateHover(); return hovered; },
    };
  }
  boot();
}
