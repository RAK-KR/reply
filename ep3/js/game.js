// 3편 "공명로" — 상호작용과 진행
import { run } from '../../shared/engine.js';
import { setHum, setDrips } from '../../shared/audio.js';
import { createState, doAction, can } from './puzzle.js';
import { buildRoom } from './room.js';
import { DOCS, CODES, INTRO, ENDING, ENDING_LAST, FIRST, SENDS, PAD, ANSWER, WORDS } from './content.js';

const anim = { desk: 0, cab: 0, hatch: 0 };
const vis = { booted: false, report: false };
let after = null;
const has = (S, i) => S.inv.includes(i);

const game = {
  epLabel: '3편', epNum: 3,
  createState, doAction,
  docs: DOCS,
  intro: INTRO, ending: ENDING, endingLast: ENDING_LAST, endingStep: 2.4,
  nextLink: { label: '4편: 기계실', href: '../ep4/' },
  startPos: { x: 0, z: 4.6, yaw: 0 },
  itemNames: { bar: '쇠지렛대', notebook: '윤서경의 수첩' },
  labels: {
    toolbox: '비상 도구함', resonator: '공명로', firedoor: '방화문', whiteboard: '화이트보드', poster: '안전 수칙 포스터', desk: '책상 서랍',
    signin: '출입 서명부', panel: '공명로 제어 패널', t3: '제어실 단말기 T3', report: '사고 조사 보고서', cabinet: '쓰러진 캐비닛', hatch: '케이블 점검구',
  },
  buildRoom,
  exposure: 1.3,
  titleCamera(camera, t) {
    camera.position.set(-1 + Math.sin(t * 0.08) * 1.2, 1.6, 1.2);
    camera.rotation.set(0.08, 0.3 + Math.sin(t * 0.05) * 0.3, 0, 'YXZ');
  },
  onStart() { setDrips(true); },
  notebookExtra(ctx) {
    return ctx.S.k.k_note ? [{ label: '수첩 해독 적기', open: () => ctx.__decode() }] : [];
  },

  handlers(ctx) {
    const { say, act, openPanel, showDoc, ui, sfx, link } = ctx;
    const S = () => ctx.S;
    function terminal() {
      ctx.terminal({
        title: '제어실 단말기 T3',
        header: '청람망 T3 · 실험실 제어실\n동조 주기 27 · 회선 상태: 연결됨',
        sends: () => Object.entries(SENDS).filter(([id]) => can(S(), id)).map(([id, s]) => ({ id, label: s.label })),
        onSend: (id) => { if (!act(id)) return; const s = SENDS[id]; link.me(s.me); link.recv(s.reply); after = id; },
      });
    }
    // 수첩 해독: 글자판에서 차례로 눌러 옮겨 적는다
    function decode() {
      let out = '';
      const wrap = document.createElement('div'); wrap.className = 'col';
      const show = document.createElement('div'); show.className = 'pad-out';
      const pad = document.createElement('div'); pad.className = 'pad';
      const render = () => { show.textContent = out || '·'; };
      PAD.forEach((ch) => {
        const b = document.createElement('button'); b.textContent = ch;
        b.onclick = (e) => { e.stopPropagation(); if (out.length < 16) { out += ch; sfx.dial(); render(); } };
        pad.appendChild(b);
      });
      const row = document.createElement('div'); row.className = 'row';
      const del = document.createElement('button'); del.textContent = '한 글자 지움';
      del.onclick = (e) => { e.stopPropagation(); out = [...out].slice(0, -1).join(''); render(); };
      const ok = document.createElement('button'); ok.textContent = '이대로 적기';
      ok.onclick = (e) => {
        e.stopPropagation();
        if (out === ANSWER) {
          if (!S().k.k_lines) { ui.setText('맞는 것 같기도 한데… 포스터 5~8줄을 확인하기 전엔 확신할 수 없다.'); return; }
          act('decode'); sfx.reveal();
          ui.setText(`수첩에 옮겨 적었다.<br><b>${WORDS.join(' / ')}</b><br>범인, 마 기사. 해치. 금고 회선만.`);
          return;
        }
        sfx.wrong(); ui.shake(show); ui.setText('뜻이 이어지지 않는다. 줄 번호와 글자 수를 다시 세어 보자. (띄어쓰기는 세지 않는다)');
      };
      row.append(del, ok);
      wrap.append(show, pad, row);
      render();
      openPanel({ title: '수첩 해독 적기', content: wrap, wide: true, text: S().k.k_decoded ? `이미 풀었다: <b>${WORDS.join(' / ')}</b>` : '수첩의 "줄-글자"를 안전 수칙에서 찾아 차례로 누른다. 낱말 사이 띄어쓰기는 넣지 않는다.' });
      render();
    }
    ctx.__decode = decode;
    return {
      toolbox() {
        if (has(S(), 'bar') || S().deskOpen) { say('빈 비상 도구함.'); return; }
        act('take_bar'); sfx.clank(); say('비상 도구함 유리는 이미 깨져 있다. 쇠지렛대를 꺼냈다.');
      },
      resonator() { say('공명로. 사람 키보다 큰 쇠 고리. 코일 덮개가 녹아 흘러내린 채 굳었다. 27년 전 오늘 밤 이게 터졌다.', 6000); },
      firedoor() { act('look_firedoor'); say('지하 3층 계단으로 가는 방화문. 불에 휘어 문틀에 박혔다. 지렛대로도 꿈쩍 안 한다.'); },
      whiteboard() { act('read_whiteboard'); showDoc('whiteboard'); },
      poster() { act('read_poster'); showDoc('poster'); },
      desk() {
        if (!S().deskOpen) {
          if (!has(S(), 'bar')) { say('그을린 책상 서랍. 열이 닿아 휘어서 손으로는 안 열린다.'); return; }
          act('open_desk'); sfx.clank(); sfx.drawer();
        }
        act('read_note');
        showDoc('note', '휘어진 서랍 안에 젖었다 마른 수첩 하나. 마지막 장에 숫자 쌍이 줄지어 적혀 있다.<br>해독은 수첩(Tab)의 "수첩 해독 적기"에서.');
      },
      signin() { act('read_signin'); showDoc('signin'); },
      panel() {
        act('read_panel');
        showDoc('panelTag', '녹아 붙은 다이얼들. 출력 다이얼은 9에 멈춰 있다. 차단기 하나만 내려가 있다.<br>패널 옆구리에 철사로 묶은 점검 꼬리표.');
      },
      t3() {
        if (!vis.booted) { vis.booted = true; link.sys('── 청람망 T3 부팅 ──'); sfx.crt(); link.recv(FIRST); }
        terminal();
      },
      report() { act('read_report'); showDoc('report'); },
      cabinet() {
        if (S().hatchShown) return;
        if (!S().k.k_decoded) { say('불에 그을려 쓰러진 철제 캐비닛. 무겁다. 굳이 치울 이유가 없다.'); return; }
        act('reveal_hatch'); sfx.clank(); say('"해치". 캐비닛을 어깨로 밀어냈다. 그 밑 바닥에 쇠 뚜껑, 케이블 점검구가 있다.', 6000);
      },
      hatch() {
        if (!S().hatchShown) { this.cabinet(); return; }
        act('read_tag');
        openPanel({
          title: '케이블 점검구', content: '', wide: false,
          text: '바닥 쇠 뚜껑. 네 자리 번호 자물쇠와 철사로 묶은 꼬리표.<br>"케이블 점검구 (지하 3층 기계실까지) · 점검: M · 번호: 늘 쓰는 걸로"',
          buttons: [{ label: '번호를 넣는다', onClick: () => { ui.close(); setTimeout(() => ctx.keypad('점검구 자물쇠', '네 자리. "늘 쓰는 걸로".', (v) => {
            if (v !== CODES.hatch) return false;
            act('open_hatch'); sfx.door(); setTimeout(() => ctx.finish(), 1800); return true;
          }), 60); } }],
        });
      },
    };
  },

  hintText(S) {
    const k = S.k;
    if (!k.sent_cause) return k.k_report ? ['상대가 물은 것에 답해 주세요.', '단말기 T3로 사고 조사 보고서 내용을 보내세요.'] : ['상대는 사고 원인을 묻습니다. 조사관들이 무언가를 제어실 벽에 붙여 두었습니다.', '제어실 남쪽 벽의 사고 조사 보고서를 읽고 단말기로 보내세요.'];
    if (!k.k_note) return S.inv.includes('bar') ? ['윤서경의 책상이 실험실 남서쪽에 있습니다.', '쇠지렛대로 책상 서랍을 열고 수첩을 읽으세요.'] : ['책상 서랍은 손으로는 안 열립니다. 비상용 도구가 근처에 있습니다.', '승강기 앞 복도 벽의 비상 도구함에서 쇠지렛대를 꺼내 윤서경의 책상 서랍을 여세요.'];
    if (!k.k_lines) return ['수첩의 방식은 "안전 수칙의 몇째 줄 몇째 글자". 그런데 포스터 아래쪽이 탔습니다. 1999년에는 멀쩡하겠지요.', '포스터를 본 뒤 단말기로 5~8줄을 읽어 달라고 하세요.'];
    if (!k.k_decoded) return ['숫자 쌍은 "줄-글자"입니다. 띄어쓰기를 빼고 그 줄의 몇째 글자인지 세세요. 슬래시는 낱말 구분입니다.', `${WORDS.join(' / ')} — 수첩(Tab)의 "수첩 해독 적기"에서 차례로 누르세요.`];
    if (!S.hatchShown) return ['해독한 낱말 중 하나는 장소입니다. 제어실 바닥을 보세요.', '제어실의 쓰러진 캐비닛을 밀어내면 케이블 점검구(해치)가 있습니다.'];
    return ['꼬리표에는 "M"이 "늘 쓰는 걸로" 했다고 적혀 있습니다. 실험실 입구 서명부에 이름마다 무엇이 적혀 있나요?', '마태진의 사번 9107. (해독 내용을 단말기로 보내면 상대도 알려 줍니다.)'];
  },

  update(ctx, dt, t) {
    const { refs, link, S } = ctx;
    if (!refs) return;
    setHum(0.3);
    refs.labTube.update(t);
    const fl = 0.85 + Math.sin(t * 2.3) * 0.08 + Math.sin(t * 13.1) * 0.04;
    [refs.emA, refs.emB, refs.emC].forEach((e) => { e.l.intensity = 2.4 * fl; });
    const sig = link.log.length;
    if (sig !== refs._sig) { refs._sig = sig; refs.t3.draw(link.log.flatMap((m) => wrap(`${m.who === 'me' ? '> ' : ''}${m.text}`, 30)), true); }
    if (after && !link.waiting) {
      const id = after; after = null;
      if (id === 'send_cause') { vis.report = true; ctx.changed('제어실 벽, 보고서 쪽.'); }
    }
    const e = (k, target, sp = 3) => { anim[k] += (target - anim[k]) * Math.min(1, dt * sp); return anim[k]; };
    refs.desk.position.z = 1.33 - e('desk', S.deskOpen ? 1 : 0) * 0.25;
    const c = e('cab', S.hatchShown ? 1 : 0, 2);
    refs.cabinet.position.z = -1.6 - c * 1.05; refs.cabinet.rotation.y = c * 0.12;
    const h = e('hatch', S.done ? 1 : 0, 2);
    refs.hatchLid.rotation.x = -h * 1.6; refs.hatchLid.position.z = -1.6 - h * 0.4; refs.hatchLid.position.y = h * 0.4;
    refs.hatchHole.visible = h > 0.05;
    refs.bar.visible = !S.inv.includes('bar') && !S.deskOpen;
  },
};
function wrap(s, n) { const out = []; for (let i = 0; i < s.length; i += n) out.push(s.slice(i, i + n)); return out; }

run(game);
