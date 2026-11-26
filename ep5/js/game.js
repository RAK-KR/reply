// 5편 "회신" — 상호작용과 진행 (메인 회선과 금고 회선, 두 개의 대화)
import { run } from '../../shared/engine.js';
import { setHum, setDrips, setWater } from '../../shared/audio.js';
import { makeLink, terminalPanel } from '../../shared/terminal.js';
import { makeCanvas } from '../../shared/draw.js';
import { createState, doAction, can } from './puzzle.js';
import { buildRoom, GATE_X } from './room.js';
import {
  DOCS, CODES, DURESS, JACKS, MAIN_JACKS, REAL_JACK, INTRO, ENDING, ENDING_LAST, SUMMARY, BAD,
  FAKE_FIRST, FAKE, FAKE_WRONG, FAKE_TRAP, FAKE_GONE, REAL_FIRST, REAL, REAL_LOCK_OK, REAL_LOCK_BAD, REAL_SILENT,
} from './content.js';

const anim = { soot: 1, gate: 0 };
const vis = { mainBooted: false, realBooted: false, cover: false, gate: false, dial: CODES.vault, trapShown: false };
const linkMain = makeLink();
const linkReal = makeLink();
let after = null;
const has = (S, i) => S.inv.includes(i);
const cur = (S) => (S.jack === REAL_JACK ? linkReal : linkMain);

// 거울에 비친 잠금 바퀴 (좌우가 뒤집혀 보인다)
function drawMirror(c, code) {
  const x = c.getContext('2d'), w = c.width, h = c.height;
  x.fillStyle = '#050606'; x.fillRect(0, 0, w, h);
  x.save(); x.beginPath(); x.ellipse(w / 2, h / 2, w * 0.46, h * 0.44, 0, 0, Math.PI * 2); x.clip();
  const g = x.createRadialGradient(w / 2, h / 2, 10, w / 2, h / 2, w * 0.5); g.addColorStop(0, '#3a4040'); g.addColorStop(1, '#0e1212');
  x.fillStyle = g; x.fillRect(0, 0, w, h);
  x.translate(w, 0); x.scale(-1, 1);   // 거울: 좌우 반전
  [...code].forEach((d, i) => {
    const cx = w * 0.2 + i * w * 0.2, cy = h / 2;
    x.fillStyle = '#b8b2a0'; x.fillRect(cx - 42, cy - 70, 84, 140);
    x.fillStyle = 'rgba(0,0,0,0.35)'; x.fillRect(cx - 42, cy - 70, 84, 28); x.fillRect(cx - 42, cy + 42, 84, 28);
    x.fillStyle = '#1a1612'; x.font = 'bold 76px "Nanum Gothic Coding", monospace'; x.textAlign = 'center'; x.fillText(d, cx, cy + 27);
  });
  x.restore();
  x.strokeStyle = '#8a9a9a'; x.lineWidth = 6; x.beginPath(); x.ellipse(w / 2, h / 2, w * 0.46, h * 0.44, 0, 0, Math.PI * 2); x.stroke();
}

const game = {
  epLabel: '5편', epNum: 5,
  createState, doAction,
  docs: DOCS,
  intro: INTRO, ending: ENDING, endingLast: ENDING_LAST, endingStep: 2.6, summary: SUMMARY,
  nextLink: null,
  startPos: { x: -2.2, z: 3.4, yaw: 0.25 },
  itemNames: { mirror: '점검 거울' },
  exposure: 1.2,
  labels: {
    junction: '금고 전원 분기함', pumptag: '집수정 펌프', plaque: '금고 사용 안내', toolbox: '절단 작업 공구함', mech: '잠금 장치 함', shelf: '빈 선반',
    t5: '금고 단말기 T5', patch: '교환함', gate: '터널 철문', tinbox: '깡통 상자',
  },
  buildRoom,
  titleCamera(camera, t) {
    camera.position.set(-1.2 + Math.sin(t * 0.07) * 0.8, 1.6, 3.2);
    camera.rotation.set(0.04, 0.15 + Math.sin(t * 0.05) * 0.3, 0, 'YXZ');
  },
  onStart(ctx) {
    setDrips(true); setWater(0.35);
    const links = [linkMain, linkReal];
    window.__game.link = { get waiting() { return links.some((l) => l.waiting); }, set fast(v) { links.forEach((l) => { l.fast = v; }); }, get log() { return cur(ctx.S).log; } };
  },

  handlers(ctx) {
    const { say, act, openPanel, showDoc, ui, sfx } = ctx;
    const S = () => ctx.S;
    function terminal() {
      const st = S();
      const isReal = st.jack === REAL_JACK;
      const link = cur(st);
      if (isReal && !vis.realBooted) { vis.realBooted = true; link.sys('── 금고 회선 (4번 잭) 연결 ──'); link.recv(REAL_FIRST, 'real'); }
      if (!isReal && !vis.mainBooted) { vis.mainBooted = true; link.sys(`── 메인 회선 (${st.jack}번 잭) 연결 ──`); link.recv(FAKE_FIRST); }
      terminalPanel(ctx, link, {
        title: `금고 단말기 T5 · ${isReal ? '금고 회선 (4번 잭)' : `메인 회선 (${st.jack}번 잭)`}`,
        header: `청람망 T5 · 금고실\n동조 주기 27 · ${isReal ? '금고 전용 회선' : '청람망 메인 회선'}`,
        footer: st.trapped && !isReal ? '메인 회선은 끊겼다.' : (st.lost && isReal ? '금고 회선은 아무 응답이 없다.' : ''),
        sends: () => {
          const s2 = S();
          if (s2.jack === REAL_JACK) return Object.entries(REAL).filter(([id]) => can(s2, id)).map(([id, r]) => ({ id, label: r.label, input: r.input, prompt: r.prompt }));
          const out = [];
          if (can(s2, 'f_accuse')) out.push({ id: 'f_accuse', label: FAKE.f_accuse.label });
          if (!s2.trapped) out.push({ id: 'f_code', label: FAKE.f_code.label, input: 4, prompt: FAKE.f_code.prompt });
          return out;
        },
        onSend: (id, v) => {
          const s2 = S();
          if (id === 'f_accuse') { act('f_accuse'); linkMain.me(FAKE.f_accuse.me); linkMain.recv(FAKE.f_accuse.reply); return; }
          if (id === 'f_code') {
            linkMain.me(`금고 번호: ${v}`);
            if (v === CODES.vault) { act('send_real'); linkMain.recv(['3185… 고마워요.', '── 메인 회선 끊김 ──']); after = 'bad'; return; }
            if (v === DURESS && s2.k.k_dial) { s2.k.k_plaque = true; act('send_duress'); linkMain.recv(FAKE_TRAP); after = 'trap'; return; }
            linkMain.recv(FAKE_WRONG); return;
          }
          if (id === 'r_lock') {
            linkReal.me(`자물쇠 번호: ${v}`);
            if (v === CODES.gate) { s2.k.k_pump = true; act('r_lock'); linkReal.recv(REAL_LOCK_OK, 'real'); after = 'gate'; }
            else linkReal.recv(REAL_LOCK_BAD, 'real');
            return;
          }
          if (!act(id)) return;
          const r = REAL[id];
          linkReal.me(r.me); linkReal.recv(r.reply, 'real');
          after = id;
        },
      });
    }
    function patch() {
      const st = S();
      if (!st.power) { say('교환함. 잭 네 개 중 하나에 T5 케이블이 꽂혀 있다. 전기가 안 들어와 표시등이 꺼져 있다.'); return; }
      openPanel({
        title: '교환함', wide: true,
        text: `금고 단말 T5의 케이블을 어느 잭에 꽂을까. 지금: <b>${st.jack}번</b><br>${JACKS.join(' &nbsp;|&nbsp; ')}`,
        buttons: [1, 2, 3, 4].map((j) => ({ label: `${j}번 잭`, onClick: () => { if (S().jack !== j) { act(`jack_${j}`); sfx.key(); } ui.setText(`T5 케이블을 <b>${j}번 잭</b>에 꽂았다.<br>${JACKS.join(' &nbsp;|&nbsp; ')}`); } })),
      });
    }
    return {
      junction() {
        if (S().power) { say('금고 전원 케이블은 꽂혀 있다.'); return; }
        act('connect_power'); sfx.breaker(); setTimeout(() => sfx.crt(), 300);
        say('2001년 절단 작업 때 뽑아 둔 굵은 케이블을 분기함에 다시 꽂았다. 금고 안 형광등이 켜진다.');
      },
      pumptag() { act('read_pumptag'); showDoc('pumptag', '집수정 펌프. 몸통에 철사로 묶은 점검 꼬리표.'); },
      plaque() { act('read_plaque'); showDoc('plaque'); },
      toolbox() {
        if (!has(S(), 'mirror')) { act('take_mirror'); sfx.key(); act('read_cutting'); showDoc('cutting', '2001년 금고를 잘라 연 사람들이 두고 간 공구함. 그 위에 작업 기록과 <b>점검 거울</b>. 거울을 챙겼다.'); return; }
        showDoc('cutting');
      },
      mech() {
        if (!vis.cover) { say('금고 문 안쪽의 잠금 장치 함. 아래쪽 뒤판이 녹아 붙은 볼트로 막혀 있다. 2001년에도 못 열었다고 했다.'); return; }
        if (!has(S(), 'mirror')) { say('뒤판이 사라지고 아래쪽에 좁은 틈이 생겼다. 안에 숫자 바퀴가 있는 것 같은데, 틈이 바닥을 향해 있어 직접은 안 보인다.'); return; }
        act('read_dial');
        const c = makeCanvas(640, 300); drawMirror(c, vis.dial);
        openPanel({ title: '점검 거울 속 잠금 바퀴', content: ctx.img(c, 560), wide: true, text: '거울을 틈 아래로 넣어 비춰 보았다. 숫자 바퀴 네 개.<br>거울은 좌우를 뒤집어 보여 준다.' });
      },
      shelf() { say('텅 빈 선반. "2001.4.3 회수 — T-31~T-38 (8개)" 꼬리표.'); },
      t5() {
        if (!S().power) { say('금고 단말기 T5. 꺼져 있다. 전원이 끊긴 것 같다.'); return; }
        terminal();
      },
      patch,
      gate() {
        if (S().gateOpen) { say('활짝 열린 철문. 녹슨 채로 돌에 괴어져 있다. 그 너머 바다.'); return; }
        act('look_gate');
        say('바다 쪽 철문. 쇠사슬과 번호 자물쇠. 다이얼이 녹슬어 꿈쩍도 안 한다. 자물쇠 뒷면에 새긴 글자: M.', 6000);
      },
      tinbox() {
        if (!vis.gate) return;
        act('read_box'); showDoc('box', '철문 아래 녹슨 깡통 상자. 뚜껑을 비틀어 열자 기름종이에 싼 쪽지가 나왔다.');
      },
    };
  },

  hintText(S) {
    const k = S.k;
    if (!S.power) return ['금고 쪽 전기가 끊겨 있습니다. 전실 서쪽 벽을 보세요.', '전실 서쪽 벽 "금고 전원" 분기함에 늘어진 케이블을 꽂으세요.'];
    if (!k.sent_who) return ['T5는 지금 메인 회선에 꽂혀 있습니다. 안내판과 안내도(1편), 수첩(3편)에 적힌 "별도 회선"을 떠올리세요.', '금고 안 교환함에서 T5 케이블을 4번 잭에 꽂고 단말기로 말을 거세요.'];
    if (!k.k_truth) return ['금고 회선의 사람에게 메인 회선 이야기를 해 보세요.', '4번 잭 상태에서 "메인 회선의 윤서경" 이야기를 보내세요.'];
    if (!S.coverOff) return ['금고 회선의 윤서경에게 어떻게 하면 되는지 물어보세요.', '4번 잭에서 "어떻게 하면 되나"를 보내세요. 잠금 장치 함 뒤판을 풀어 줍니다.'];
    if (!k.k_dial) return has(S, 'mirror') ? ['금고 문 안쪽 잠금 장치 함의 틈을 거울로 보세요.', '금고 문(전실 쪽으로 열려 있음) 안쪽 면의 잠금 장치 함을 살펴보세요.'] : ['틈이 아래를 향해 있습니다. 2001년 작업자들이 두고 간 것이 있습니다.', '전실의 절단 작업 공구함에서 점검 거울을 챙긴 뒤 잠금 장치 함을 보세요.'];
    if (!S.trapped) return ['거울은 좌우를 뒤집습니다. 진짜 번호를 그 사람에게 그대로 주면 안 됩니다. 안내판의 "협박을 받을 때"를 읽어 보세요.', '거울에 보이는 순서 그대로가 5813 = 진짜 번호 3185를 거꾸로 한 협박 번호. 교환함을 1~3번 잭으로 바꾸고 그 사람에게 5813을 보내세요.'];
    if (!k.k_safe) return ['금고 회선의 윤서경은 어떻게 됐을까요.', '교환함 4번 잭으로 바꾸고 "그쪽은 어떻게 됐나"를 보내세요.'];
    if (!k.sent_exit) return ['당신도 나가야 합니다. 배수 터널 끝을 보세요.', '터널 끝 철문의 자물쇠를 살펴본 뒤 4번 잭으로 윤서경에게 자물쇠 이야기를 보내세요.'];
    if (!S.gateOpen) return ['자물쇠 뒷면의 M. 그 사람은 무엇이든 같은 번호를 씁니다. 전실 펌프에도 흔적이 있습니다.', '마태진의 사번 9107을 윤서경에게 보내세요.'];
    return ['철문이 열렸습니다.', '터널 끝 철문 밖으로 나가세요. (깡통 상자도 열어 보세요)'];
  },

  update(ctx, dt, t) {
    const { refs, S } = ctx;
    if (!refs) return;
    setHum(S.power ? 0.5 : 0);
    refs.vTube.set(S.power); refs.vTube.update(t);
    refs.em.l.intensity = 2.8 * (0.9 + Math.sin(t * 1.7) * 0.08); refs.em2.l.intensity = 2.4 * (0.9 + Math.sin(t * 2.3) * 0.1);
    refs.cableLoose.visible = !S.power; refs.cableIn.visible = S.power;
    refs.jackPlugs.forEach((p, i) => { p.visible = S.jack === i + 1; });
    refs.mirror.visible = !S.inv.includes('mirror');
    const link = cur(S);
    const sig = `${S.power}|${S.jack}|${link.log.length}`;
    if (sig !== refs._sig) { refs._sig = sig; refs.t5.draw(link.log.flatMap((m) => wrap(`${m.who === 'me' ? '> ' : ''}${m.text}`, 30)), S.power, S.jack === REAL_JACK ? '#8fe6ff' : '#7cf29a'); }
    if (after && !linkMain.waiting && !linkReal.waiting) {
      const id = after; after = null;
      if (id === 'r_help') { vis.cover = true; ctx.changed('금고 문 쪽에서 쇠붙이가 떨어지는 소리.'); }
      if (id === 'trap') { vis.dial = DURESS; vis.trapShown = true; ctx.sfx.alarm(); ctx.changed('벽의 그을음이… 옅어지고 있다.', 7000); }
      if (id === 'gate') { vis.gate = true; ctx.changed('터널 끝에서 쇠가 끌리는 소리. 바닷바람이 세졌다.'); }
      if (id === 'bad') {
        ctx.badEnd({ lines: BAD.lines, last: BAD.last, restore: (s) => { s.lost = false; linkMain.log.splice(-2); return s; } });
      }
    }
    // 그을음: 덫이 걸리면(화재가 일어나지 않게 되면) 사라진다
    anim.soot += ((vis.trapShown ? 0 : 1) - anim.soot) * Math.min(1, dt * 0.25);
    refs.soot.forEach((m) => { m.opacity = anim.soot; });
    refs.cover.visible = !vis.cover; refs.slot.visible = vis.cover;
    anim.gate += ((vis.gate ? 1 : 0) - anim.gate) * Math.min(1, dt * 1.5);
    refs.gate.rotation.y = -anim.gate * 1.4;
    refs.lock.visible = !vis.gate; refs.chain.visible = !vis.gate;
    refs.box.visible = vis.gate;
    // 열린 철문 밖으로 나가면 엔딩
    if (S.gateOpen && !S.done && ctx.started && !ctx.ui.open && ctx.player.pos.x > GATE_X + 0.3) { ctx.act('leave'); ctx.finish(); }
  },
};
function wrap(s, n) { const out = []; for (let i = 0; i < s.length; i += n) out.push(s.slice(i, i + n)); return out; }

run(game);
