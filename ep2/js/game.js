// 2편 "원본" — 상호작용과 진행
import { run } from '../../shared/engine.js';
import { setHum, setDrips } from '../../shared/audio.js';
import { createState, doAction, can } from './puzzle.js';
import { buildRoom } from './room.js';
import { DOCS, CODES, INTRO, ENDING, ENDING_LAST, FIRST, SENDS, STASH, PLACES, ROWS, ROW_YEARS, COLS, TARGET } from './content.js';

const anim = { arch: 0, shaft: 0, l6: 0, vent: 0 };
const vis = { booted: false, l6: false, keyLoc: null };
let after = null;
const has = (S, i) => S.inv.includes(i);

const game = {
  epLabel: '2편', epNum: 2,
  createState, doAction,
  docs: DOCS,
  intro: INTRO, ending: ENDING, endingLast: ENDING_LAST, endingStep: 2.4,
  nextLink: { label: '3편: 공명로', href: '../ep3/' },
  startPos: { x: 0, z: 3.5, yaw: 0 },
  itemNames: { coin: '100원 동전', key: '삼각 열쇠' },
  labels: {
    stairs: '무너진 계단', crew: '반출 목록', roster: '당번표', archDoor: '기록실 문', archPad: '기록실 번호판', hydrant: '소화전',
    shaft: '화물 승강기 문', catalog: '카드 서랍장', index: '서랍장 옆면', shelf: '선반', copier: '테이프 복사기', drawer: '책상 서랍',
    t2: '기록실 단말기 T2', printer: '프린터', vent: '환기구', vending: '자판기', board: '게시판',
    locker1: '1번 사물함', locker2: '2번 사물함', locker3: '3번 사물함', locker4: '4번 사물함', locker5: '5번 사물함', locker6: '6번 사물함',
  },
  buildRoom,
  titleCamera(camera, t) {
    camera.position.set(0, 1.6, 3.6 - Math.sin(t * 0.1) * 0.6);
    camera.rotation.set(0.02, Math.sin(t * 0.06) * 0.25, 0, 'YXZ');
  },
  hoverFilter(id, ctx) { if (id === 'archDoor' && ctx.S.archOpen) return null; return id; },
  onStart() { setDrips(true); },

  handlers(ctx) {
    const { say, act, openPanel, showDoc, ui, sfx, link } = ctx;
    const S = () => ctx.S;
    function terminal() {
      ctx.terminal({
        title: '기록실 단말기 T2',
        header: '청람망 T2 · 기록 보관실\n동조 주기 27 · 회선 상태: 연결됨',
        sends: () => [
          ...Object.entries(SENDS).filter(([id]) => can(S(), id)).map(([id, s]) => ({ id, label: s.label })),
          ...Object.entries(STASH).filter(([id]) => can(S(), id)).map(([id, s]) => ({ id, label: s.label })),
        ],
        onSend: (id) => {
          if (!act(id)) return;
          const s = SENDS[id] || STASH[id];
          link.me(s.me || `${PLACES[s.place]}에 넣어 주세요.`);
          link.recv(s.reply);
          after = id;
        },
      });
    }
    function catalog() {
      const grid = document.createElement('div'); grid.className = 'col';
      const g = document.createElement('div'); g.className = 'pad'; g.style.gridTemplateColumns = 'repeat(6, 64px)';
      ROWS.forEach((r) => COLS.forEach((_, c) => {
        const b = document.createElement('button'); b.textContent = `${r}${c + 1}`; b.style.fontSize = '15px';
        b.onclick = (e) => { e.stopPropagation(); openDrawer(`${r}${c + 1}`); };
        g.appendChild(b);
      }));
      grid.appendChild(g);
      openPanel({ title: '카드 서랍장', content: grid, wide: true, text: '서랍 서른 개. 앞면에는 A1부터 E6까지 기호만 붙어 있다. 어느 서랍을 열까.' });
    }
    function openDrawer(code) {
      sfx.drawer();
      if (code === TARGET) {
        if (!S().k.k_index) { ui.setText(`${code} 서랍. 카드가 수십 장이다. 무작정 넘기기엔 너무 많다. 서랍장에 찾는 법이 적혀 있을 것 같다.`); return; }
        act('open_card'); ui.close(); setTimeout(() => showDoc('card'), 60); return;
      }
      const r = ROWS.indexOf(code[0]), c = +code[1] - 1;
      ui.setText(`${code} 서랍 — <b>${ROW_YEARS[r]} · ${COLS[c]}</b> 기록 카드들. 찾는 것과는 상관없다.`);
    }
    return {
      stairs() { act('look_stairs'); say('지하 2층으로 이어지는 계단. 무너진 천장 콘크리트와 철근이 꽉 메웠다.'); },
      crew() { act('read_crew'); showDoc('crew'); },
      roster() { act('read_roster'); showDoc('roster'); },
      archDoor() { this.archPad(); },
      archPad() {
        if (S().archOpen) return;
        ctx.keypad('기록 보관실 번호판', '네 자리. 그 주 당번이 정한 번호.', (v) => {
          if (v !== CODES.arch) return false;
          S().k.k_roster = true; act('open_arch'); setTimeout(() => sfx.door(), 150); say('기록 보관실 문이 열렸다.');
          return true;
        });
      },
      hydrant() {
        act('read_hydrant'); sfx.clank();
        showDoc('hydrant', '빨간 함 안에는 새 호스가 단정하게 감겨 있다. 다른 건 아무것도 없다. 문 안쪽에 점검표.');
      },
      shaft() {
        act('look_shaft');
        if (!has(S(), 'key')) { say('화물 승강기 문. 가운데에 세모난 열쇠 구멍. 비상용 삼각 열쇠가 있어야 열린다.'); return; }
        act('open_shaft'); sfx.unlock(); sfx.door(); setTimeout(() => ctx.finish(), 2200);
      },
      catalog,
      index() { act('read_index'); showDoc('index'); },
      shelf() { say('텅 빈 철제 선반. 테이프는 철거팀이 전부 가져갔다. 선반 뒤 벽까지 휑하다.'); },
      copier() { act('read_copylog'); showDoc('copylog', '테이프 복사기. 기록 종이가 기계에 물린 채 누렇게 굳었다.'); },
      drawer() { sfx.drawer(); say('책상 서랍. 열려 있고 텅 비었다.'); },
      t2() {
        if (!vis.booted) {
          vis.booted = true; link.sys('── 청람망 T2 부팅 ──'); sfx.crt();
          link.recv(FIRST);
        }
        terminal();
      },
      printer() { say('1층 것과 같은 도트 프린터. 종이가 걸려 있지만, 한 줄도 찍혀 있지 않다.'); },
      vent() {
        const st = S();
        if (!st.ventOpen) {
          if (!has(st, 'coin')) { say(vis.keyLoc === 'vent' ? '환기구 덮개. 넓적한 일자 나사 네 개. 나사 머리에 긁힌 자국이 보인다. 맨손으로는 안 돌아간다.' : '벽 아래 환기구 덮개. 넓적한 일자 나사 네 개로 고정돼 있다. 맨손으로는 안 돌아간다.'); return; }
          act('open_vent'); sfx.screw(); say('동전을 나사 홈에 끼워 하나씩 돌렸다. 덮개가 떨어졌다.');
          return;
        }
        if (st.keyLoc === 'vent' && vis.keyLoc === 'vent' && !has(st, 'key')) { act('take_key'); sfx.key(); say('환기구 안쪽, 먼지 속에 삼각 열쇠. 27년 묵은 먼지가 고르게 덮여 있다.'); return; }
        say(has(st, 'key') ? '빈 환기구.' : '환기구 안. 먼지뿐이다.');
      },
      vending() {
        if (has(S(), 'coin') || S().ventOpen) { say('불 꺼진 자판기. 반환구는 비었다.'); return; }
        act('take_coin'); sfx.key(); say('반환구에 100원짜리 하나. 1998년. 누가 거스름돈을 깜빡했다.');
      },
      board() { say('1999 송년회 사진들. 아래쪽에 손글씨로 "※ 휴게실 금연 (서경)".'); },
      locker1() { say('1번 사물함 "구인모". 문이 열려 있고 텅 비었다.'); },
      locker2() { say('2번 사물함. 이름표가 없다. 비어 있다.'); },
      locker3() { say('3번 사물함 "박정만". 열려 있고 텅 비었다.'); },
      locker4() { say('4번 사물함 "공용". 비었다.'); },
      locker5() { say('5번 사물함 "공용". 비었다.'); },
      locker6() {
        if (!vis.l6) { say('6번 사물함 "윤서경". 세 자리 번호 자물쇠가 잠겨 있다. 문에 "금연" 스티커.'); return; }
        act('check_l6'); sfx.clank();
        say('6번 사물함 문이 뜯겨 휘어 있다. 안은 텅 비었다. 문 안쪽에 "금연 — 서경" 스티커만 남았다.', 6500);
      },
    };
  },

  hintText(S) {
    const k = S.k;
    if (!S.archOpen) return ['기록실 문 번호는 그 주 당번이 정합니다. 복도 벽을 보세요.', '당번표에 12/27~01/02 당번은 마태진(9107)이고 "늘 쓰는 걸로 함"이라 적혀 있습니다. 9107.'];
    if (!k.sent_inv) {
      if (!k.k_inv) return ['상대가 찾는 건 1999년 공명 실험 원본입니다. 대장 카드가 든 서랍장에는 찾는 법이 붙어 있습니다.', '서랍장 옆면의 색인: 1998~99년은 E행, 공명 실험은 4열. E4 서랍을 열고 카드를 읽은 뒤 단말기로 보내세요.'];
      return ['찾은 카드 내용을 상대에게 알려 주세요.', '단말기 T2에서 대장 카드 내용을 보내세요.'];
    }
    if (!k.sent_shaft) return k.k_shaft ? ['내려가려면 무엇이 필요한지 상대에게 말해 보세요.', '단말기로 삼각 열쇠 이야기를 보내세요.'] : ['아래층으로 갈 길을 찾아보세요. 복도 끝.', '복도 북쪽 끝 화물 승강기 문을 살펴본 뒤 단말기로 삼각 열쇠 이야기를 보내세요.'];
    if (!k.k_l6) return ['상대가 열쇠를 넣었다는 곳을 확인해 보세요.', '휴게실 6번 사물함을 열어 보세요.'];
    if (!k.sent_empty) return ['본 것을 알려 주세요.', '단말기로 6번 사물함이 비었다고 보내세요.'];
    if (S.keyLoc !== 'vent') return ['철거팀 반출 목록과 소화전 점검표를 읽어 보세요. 27년 동안 누가 무엇을 열고 무엇을 가져갔는지.', '열린 곳은 철거팀이 비웠고, 소화전은 2000년 1월 1일 화재 때 비웠습니다. 손대지 않은 "벽 시설물"인 기록실 환기구에 넣어 달라고 하세요.'];
    if (!S.ventOpen) return ['환기구 나사는 넓적한 일자 홈입니다. 드라이버 대신 쓸 만한 게 휴게실 어딘가에 있습니다.', '휴게실 자판기 반환구의 100원으로 환기구 나사를 푸세요.'];
    if (!S.inv.includes('key')) return ['열린 환기구 안을 보세요.', '환기구 안의 삼각 열쇠를 집으세요.'];
    return ['열쇠가 생겼습니다.', '복도 끝 화물 승강기 문을 삼각 열쇠로 여세요.'];
  },

  update(ctx, dt, t) {
    const { refs, link, S } = ctx;
    if (!refs) return;
    setHum(1);
    refs.corTubes.forEach((tb) => tb.update(t)); refs.archTube.update(t);
    const sig = link.log.length;
    if (sig !== refs._sig) { refs._sig = sig; refs.t2.draw(link.log.flatMap((m) => wrap(`${m.who === 'me' ? '> ' : ''}${m.text}`, 30)), true); }
    if (after && !link.waiting) {
      const id = after; after = null;
      if (id === 'send_shaft') { vis.l6 = true; vis.keyLoc = 'locker6'; ctx.changed('휴게실 쪽에서 쇠붙이가 비틀리는 소리가 났던 것 같다.'); }
      if (STASH[id]) { vis.keyLoc = STASH[id].place; ctx.changed(STASH[id].place === 'vent' ? '기록실 벽 쪽.' : ''); }
    }
    refs.archLed.emissive.setHex(S.archOpen ? 0x30ff80 : 0xff3020);
    const e = (k, target, sp = 3) => { anim[k] += (target - anim[k]) * Math.min(1, dt * sp); return anim[k]; };
    refs.archDoor.rotation.y = Math.PI - e('arch', S.archOpen ? 1 : 0) * 1.5;
    const sh = e('shaft', S.done ? 1 : 0, 1.5);
    refs.shaftDoorL.position.x = -0.3 - sh * 0.55; refs.shaftDoorR.position.x = 0.3 + sh * 0.55;
    refs.shaftInside.visible = sh > 0.02;
    refs.lockers[5].pivot.rotation.y = e('l6', vis.l6 ? 1 : 0) * 1.9;
    refs.lockers[0].pivot.rotation.y = 0.5;
    refs.lockers[2].pivot.rotation.y = 0.35;
    refs.ventCover.position.z = e('vent', S.ventOpen ? 1 : 0) * 0.2;
    refs.ventCover.rotation.x = -anim.vent * 1.2;
    refs.ventKey.visible = S.keyLoc === 'vent' && vis.keyLoc === 'vent' && !S.inv.includes('key');
  },
};
function wrap(s, n) { const out = []; for (let i = 0; i < s.length; i += n) out.push(s.slice(i, i + n)); return out; }

run(game);
