// 1편 "접속" — 상호작용과 진행
import { run } from '../../shared/engine.js';
import { setHum } from '../../shared/audio.js';
import { createState, doAction, can, live, load } from './puzzle.js';
import { buildRoom } from './room.js';
import { DOCS, CODES, INTRO, ENDING, ENDING_LAST, FIRST, SENDS, CIRCUITS } from './content.js';
import { makeCanvas, drawPanelFace, drawCoin, drawRecorder, drawStaff } from './draw.js';

const anim = { guard: 0, stair: 0 };
const vis = { coin: false, butt: false, termBooted: false, firstSent: false };
let after = null;

const game = {
  epLabel: '1편', epNum: 1,
  createState, doAction,
  docs: DOCS,
  intro: INTRO, ending: ENDING, endingLast: ENDING_LAST, endingStep: 2.4,
  nextLink: { label: '2편: 원본', href: '../ep2/' },
  startPos: { x: 0.2, z: 2.2, yaw: 0 },
  itemNames: {},
  labels: {
    frontDoor: '정문', t1: '안내 단말기', printer: '프린터', ashtray: '재떨이', panel: '분전반', clip: '철거팀 메모', lamp: '작업등',
    news: '메모판', plan: '층별 안내도', staff: '직원 소개판', stairDoor: '비상계단 문', stairPad: '계단문 번호판', elevator: '승강기',
    tank: '수족관', pot: '화분', guardDoor: '경비실 문', guardPad: '경비실 번호판', log: '경비 일지', cctv: 'CCTV 모니터', recorder: '녹화기',
    cardlog: '출입 기록기', nightSwitch: '야간 잠금 스위치', heater: '전기난로', keybox: '열쇠함', calendar: '달력',
  },
  buildRoom,
  showDoc(key, ctx) {
    if (key !== 'printout') return false;
    const lines = ctx.link.log.filter((m) => m.who !== 'sys').map((m) => `${m.who === 'me' ? '[수신]' : '[발신]'} ${m.text}`);
    ctx.note('printout'); ctx.sfx.paper();
    ctx.openPanel({
      title: DOCS.printout.title, wide: true,
      content: `<div class="paper print" style="max-height:56vh;overflow:auto">${['청람망 T1 (로비 안내)  1999-12-31', '', ...lines].map((l) => `<div class="line">${l}</div>`).join('')}</div>`,
      text: '누렇게 바랜 연속 용지. 방금 단말기에서 오간 글자들이 27년 묵은 종이에 찍혀 있다.<br>1999년 쪽 단말기가 찍어 낸 종이가, 그대로 여기 남아 있는 것이다. (1999년 쪽에서 보면 내가 보낸 말이 [수신]이다)',
    });
    return true;
  },
  titleCamera(camera, t) {
    camera.position.set(Math.sin(t * 0.07) * 0.8, 1.6, 2.2);
    camera.rotation.set(0.05, Math.sin(t * 0.05) * 0.3, 0, 'YXZ');
  },
  hoverFilter(id, ctx) {
    if (id === 'guardDoor' && ctx.S.guardOpen) return null;
    if (id === 'printer' && !vis.firstSent) return 'printer';
    return id;
  },

  handlers(ctx) {
    const { say, act, img, openPanel, showDoc, ui, sfx, link } = ctx;
    const S = () => ctx.S;
    const termOn = () => live(S(), 'c1');

    function panel() {
      const render = () => { const c = makeCanvas(400, 520); drawPanelFace(c, S()); return img(c, 330); };
      const refresh = (msg) => {
        const b = document.getElementById('panel-body'); b.innerHTML = ''; b.appendChild(render());
        ui.setText(msg || status());
        ctx.refs.panelCanvas && drawPanelFace(ctx.refs.panelCanvas, S());
        ctx.refs.panelFace.material.map.needsUpdate = true;
      };
      const status = () => '임시 전원에 연결된 1층 분전반. 회로 차단기 여섯 개와 주 차단기.';
      const toggle = (id) => {
        const wasMain = S().main;
        if (id === 'c6') {
          sfx.breaker();
          if (S().main) { S().main = false; setTimeout(() => sfx.trip(), 80); refresh('⑥ 승강기를 올리자마자 퍽, 하고 주 차단기가 떨어졌다. 승강기는 내리고 다시 올리자.'); }
          else refresh('⑥ 승강기를 올렸다가, 메모가 떠올라 바로 내렸다.');
          return;
        }
        act(`toggle_${id}`); sfx.breaker();
        if (id !== 'main' && wasMain && !S().main) { setTimeout(() => sfx.trip(), 80); refresh('퍽! 주 차단기가 떨어졌다. 한꺼번에 너무 많이 켠 것 같다.'); return; }
        if (id === 'main' && !S().main && !wasMain) { setTimeout(() => sfx.trip(), 80); refresh('주 차단기를 올리자마자 다시 떨어졌다. 켜져 있는 회로가 너무 많다.'); return; }
        refresh();
      };
      openPanel({
        title: '분전반', content: render(), text: status(), wide: true,
        buttons: [...CIRCUITS.map((c, i) => ({ label: `${'①②③④⑤⑥'[i]} ${c.name}`, onClick: () => toggle(c.id) })), { label: '주 차단기', onClick: () => toggle('main') }],
      });
    }

    function terminal() {
      ctx.terminal({
        title: '안내 단말기 T1',
        header: '청람망 T1 · 로비 안내\n동조 주기 27 · 회선 상태: 연결됨 (상대 단말 응답)',
        sends: () => Object.entries(SENDS).filter(([id]) => can(S(), id)).map(([id, s]) => ({ id, label: s.label })),
        onSend: (id) => {
          if (!termOn()) return;
          if (!act(id)) return;
          const s = SENDS[id];
          vis.firstSent = true;
          link.me(s.me);
          link.recv(s.reply);
          after = id;
        },
      });
    }

    return {
      frontDoor() { say('유리문 너머로 굵은 쇠사슬이 감겨 있다. 바깥에서 봉쇄했다.'); },
      t1() {
        if (!termOn()) { say('꺼진 단말기. 누런 플라스틱에 "청람망 T1"이라는 딱지.'); return; }
        terminal();
      },
      printer() {
        if (!link.log.some((m) => m.who !== 'sys')) { say('도트 프린터. 종이는 걸려 있지 않다.'); return; }
        showDoc('printout');
      },
      ashtray() { say(vis.butt ? '유리 재떨이에 누렇게 삭은 꽁초 하나. 필터에 작은 글씨로 "등대". 아까는 비어 있었다.' : '빈 유리 재떨이.'); },
      panel,
      clip() { act('read_clip'); showDoc('clip'); },
      lamp() { say('철거팀이 두고 간 배터리 작업등. 분전반 쪽을 비추고 있다.'); },
      news() { act('read_news'); showDoc('news'); },
      plan() { act('read_plan'); showDoc('plan'); },
      staff() {
        const c = makeCanvas(900, 420); drawStaff(c);
        openPanel({ title: '직원 소개판', content: img(c, 760), wide: true, text: '1999년 송년회 무렵 붙인 소개판. 사진은 다 바랬다.' });
      },
      stairDoor() { this.stairPad(); },
      stairPad() {
        if (S().done) return;
        if (!live(S(), 'c5')) { say('비상계단 문. 번호판이 꺼져 있다. 전기가 안 들어온다.'); return; }
        if (S().nightLock) { say('번호판에 빨간 글씨 "야간 잠금". 숫자를 눌러도 반응이 없다.'); sfx.wrong(); return; }
        ctx.keypad('계단문 번호판', '네 자리. 1999년 이후 아무도 바꾸지 않은 번호.', (v) => {
          if (v !== CODES.stair) return false;
          act('open_stair'); sfx.door();
          setTimeout(() => ctx.finish(), 1500);
          return true;
        });
      },
      elevator() { say('승강기. "고장 · 사용 금지". 문틈이 녹슬어 붙었다.'); },
      tank() { say(live(S(), 'c2') ? '물 없는 수족관에 파란 불만 들어온다. 바닥에 하얀 물때 줄이 몇 겹.' : '바싹 마른 수족관. 바닥에 하얀 물때 줄.'); },
      pot() {
        if (!vis.coin) { say('말라 죽은 화분. 들어 봐도 아무것도 없다.'); return; }
        act('look_pot'); sfx.key();
        const c = makeCanvas(420, 320); drawCoin(c);
        openPanel({ title: '화분 밑', content: img(c, 380), text: '화분 밑에 녹슨 동전 하나. <b>1999년</b> 500원. 표면에 날카로운 것으로 긁은 글자, <b>Y</b>.<br>아까 들어 봤을 땐 분명히 없었다.' });
      },
      guardDoor() { this.guardPad(); },
      guardPad() {
        if (S().guardOpen) return;
        if (!live(S(), 'c5')) { say('경비실 문. 번호판이 꺼져 있다.'); return; }
        ctx.keypad('경비실 번호판', '네 자리 번호.', (v) => {
          if (v !== CODES.guard) return false;
          S().k.k_gcode = true; act('open_guard'); setTimeout(() => sfx.door(), 150);
          say(live(S(), 'c4') ? '경비실 문이 열렸다.' : '경비실 문이 열렸다. 안은 캄캄하다.');
          return true;
        });
      },
      log() {
        if (!live(S(), 'c4')) { say('책상 위 파란 바인더. 어두워서 글씨가 안 보인다.'); return; }
        act('read_log'); showDoc('log');
      },
      cctv() { say(live(S(), 'c4') ? '모니터에 지지직거리는 잿빛 화면만.' : '꺼진 CCTV 모니터 두 대.'); },
      recorder() {
        if (!live(S(), 'c4')) { say('녹화기. 꺼져 있다.'); return; }
        const c = makeCanvas(520, 260); drawRecorder(c);
        openPanel({ title: 'CCTV 녹화기', content: img(c, 440), text: '전원이 들어오자 작은 창에 마지막 기록이 떴다. 1999년 12월 31일 밤 10시 7분, 누군가 녹화를 <b>손으로</b> 멈췄다.' });
      },
      cardlog() { say(live(S(), 'c4') ? '출입 기록기. 마지막으로 찍힌 줄: "99-12-31 21:30 Y-4 OUT".' : '출입 기록기. 종이가 반쯤 말려 있다.'); },
      nightSwitch() {
        act('toggle_night'); sfx.breaker();
        say(S().nightLock ? '스위치를 올렸다. 계단문 야간 잠금.' : '스위치를 내렸다. 계단문 야간 잠금 해제.');
      },
      heater() {
        if (!S().heater) { say('플러그를 뽑아 둔 전기난로. 옆면 라벨: 800W.'); return; }
        const on = live(S(), 'c4');
        openPanel({
          title: '전기난로', text: on ? '빨갛게 달아오른 전기난로. 27년 동안 콘센트에 꽂혀 있었다. 옆면 라벨: <b>800W</b>.' : '전기난로. 옆면 라벨: <b>800W</b>. 플러그가 벽 콘센트에 꽂혀 있다.',
          buttons: [{ label: '플러그를 뽑는다', onClick: () => { act('unplug_heater'); sfx.drawer(); ui.setText('플러그를 뽑았다. 이제 경비실 회로가 훨씬 덜 먹을 것이다.'); } }],
        });
      },
      keybox() { say('열쇠함. 고리마다 텅 비어 있다. 철거팀이 열쇠를 전부 거둬 간 모양이다.'); },
      calendar() { say('1999년 12월 달력. 31일에 동그라미.'); },
    };
  },

  hintText(S) {
    const k = S.k, term = live(S, 'c1');
    const power = '분전반에서 회로를 올린 뒤 주 차단기를 올리세요. 합계 2.0kW를 넘으면 떨어집니다.';
    if (!k.sent_year) return term ? ['안내 데스크 단말기에 누군가 글자를 보냈습니다.', '단말기에서 "여기는 2026년"을 보내세요.'] : ['서쪽 벽 분전반과 탁자 위 철거팀 메모를 보세요.', `① 로비 조명·안내 단말만 올리고 주 차단기를 올리세요. ${power}`];
    if (!k.k_coin) return ['상대가 1999년에서 로비 입구 쪽 화분 밑에 무언가를 두었다고 했습니다.', '정문 왼쪽 화분을 살펴보세요. 1999년에 둔 것은 2026년에도 남아 있습니다.'];
    if (!k.sent_coin) return ['본 것을 알려 주세요.', `단말기로 동전 이야기를 보내세요.${term ? '' : ' (①이 꺼져 있습니다)'}`];
    if (!k.sent_fire) return k.k_news ? ['신문에 나온 일을 알려 주세요.', '단말기로 화재 이야기를 보내세요.'] : ['상대는 오늘 밤 무슨 일이 있었는지 묻습니다. 로비에 그 밤을 다룬 기록이 붙어 있습니다.', '서쪽 벽 메모판의 신문을 읽고, 단말기로 화재 이야기를 보내세요.'];
    if (!S.guardOpen) return ['상대가 경비실 번호를 알려 줬습니다. 번호판에는 전기가 필요합니다.', `⑤ 출입 잠금장치를 켜고 경비실 번호판에 4017. ${power}`];
    if (!k.k_log) return ['경비실이 어둡습니다. ④ 경비실까지 켜면 한도를 넘습니다. 경비실 안에서 무엇이 전기를 먹고 있을까요?', '경비실 전기난로(800W) 플러그를 뽑으면 ①·④·⑤를 함께 켤 수 있습니다(1.8kW). ①을 잠깐 내리고 ④를 켜도 됩니다. 그다음 책상 위 경비 일지를 읽으세요.'];
    if (!k.sent_log) return ['상대는 시간이 다 적힌 기록을 원했습니다.', '단말기로 경비 일지 내용을 보내세요.'];
    if (S.nightLock) return ['계단문 번호판에 "야간 잠금"이 켜져 있다면, 그걸 거는 스위치는 경비원 자리 근처에 있습니다.', '경비실 북쪽 벽의 야간 잠금 스위치를 내리세요.'];
    return ['상대가 알려 준 규칙, 일지의 23:30 줄, 철거팀 메모의 "1999년에 마지막으로 바꾼 번호 그대로"를 합쳐 보세요.', '12월 31일 밤 23시 30분에 "다음 날"인 1월 1일로 바꿨습니다. 계단문 번호 0101.'];
  },

  onLine(m, ctx) { ctx.sfx.print(6); },

  update(ctx, dt, t) {
    const { refs, link } = ctx;
    if (!refs) return;
    const S = ctx.S;
    const L = (c) => live(S, c);
    refs.lobbyTubes.forEach((tb) => { tb.set(L('c1')); tb.update(t); });
    refs.lobbyTubes[1].flicker(0.4);
    refs.guardTube.set(L('c4')); refs.guardTube.update(t); refs.guardTube.flicker(0.2);
    refs.signMat.emissiveIntensity = L('c3') ? 1.6 : 0;
    refs.tankLight.emissiveIntensity = L('c2') ? 2 : 0; refs.tankPoint.intensity = L('c2') ? 1.2 : 0;
    refs.stairLed.emissiveIntensity = L('c5') ? 2 : 0;
    refs.stairLed.emissive.setHex(S.nightLock ? 0xff3020 : 0x30ff80);
    refs.guardLed.emissiveIntensity = L('c5') && !S.guardOpen ? 2 : 0;
    refs.heaterGlow.emissiveIntensity = L('c4') && S.heater ? 2.5 : 0; refs.heaterLight.intensity = L('c4') && S.heater ? 1.5 : 0;
    refs.plug.visible = S.heater;
    refs.recLed.color.setHex(L('c4') ? 0x40ff70 : 0x113311);
    refs.nightLever.position.y = S.nightLock ? 0.05 : -0.05;
    refs.coin.visible = vis.coin; refs.butt.visible = vis.butt;
    refs.printer.paper.visible = link.log.some((m) => m.who !== 'sys');
    setHum((L('c1') ? 1 : 0) + (L('c4') ? 0.6 : 0));
    // 단말기 화면
    const sig = `${L('c1')}|${link.log.length}`;
    if (sig !== refs._sig) {
      refs._sig = sig;
      refs.t1.draw(link.log.flatMap((m) => wrap(`${m.who === 'me' ? '> ' : ''}${m.text}`, 30)), L('c1'));
      [0, 1].forEach((i) => refs.cctv[i].draw(L('c4') ? ['NO SIGNAL'] : [], L('c4'), '#9aa'));
    }
    // 처음 켜지면 상대가 먼저 말을 건다
    if (L('c1') && !vis.termBooted && ctx.started) {
      vis.termBooted = true;
      link.sys('── 청람망 T1 부팅 ──');
      setTimeout(() => { ctx.sfx.crt(); ctx.say('단말기가 켜지자마자 혼자 글자를 찍기 시작한다.', 4500); link.recv(FIRST); }, 1500);
    }
    if (!L('c1') && ctx.ui.open && document.querySelector('.term')) { ctx.ui.close(); ctx.say('전원이 끊기며 단말기 화면이 꺼졌다.'); }
    // 답이 다 찍힌 뒤에 일어나는 일
    if (after && !link.waiting) {
      const id = after; after = null;
      if (id === 'send_year') { vis.coin = true; ctx.changed('로비 입구 쪽에서.'); }
      if (id === 'send_log') { vis.butt = true; ctx.changed('안내 데스크 쪽. 그리고 경비 일지도.'); }
    }
    const e = (k, target, sp = 3) => { anim[k] += (target - anim[k]) * Math.min(1, dt * sp); return anim[k]; };
    refs.guardDoor.rotation.y = e('guard', S.guardOpen ? 1 : 0) * 1.5;
    refs.stairDoor.rotation.y = e('stair', S.done ? 1 : 0, 1.5) * 1.4;
  },
};

function wrap(s, n) { const out = []; for (let i = 0; i < s.length; i += n) out.push(s.slice(i, i + n)); return out; }

run(game);
