// 4편 "기계실" — 상호작용과 진행
import { run } from '../../shared/engine.js';
import { setHum, setDrips, setPump, setWater } from '../../shared/audio.js';
import { createState, doAction, can, valves } from './puzzle.js';
import { buildRoom, B4H } from './room.js';
import { DOCS, CODES, INTRO, ENDING, ENDING_LAST, FIRST, SENDS, ROLL_OLD, COLORS, VALVES, pumpResult } from './content.js';

const anim = { hatch: 0, water: 0, locker: 0, pump: 0 };
const vis = { booted: false, pumping: 0, needle: 0 };
let after = null;

const game = {
  epLabel: '4편', epNum: 4,
  createState, doAction,
  docs: DOCS,
  intro: INTRO, ending: ENDING, endingLast: ENDING_LAST, endingStep: 2.5,
  nextLink: { label: '5편: 회신', href: '../ep5/' },
  startPos: { x: -3.2, z: 2.2, yaw: -0.6 },
  itemNames: {},
  exposure: 1.25,
  labels: {
    trench: '케이블 통로', breaker: '지하 3층 전원', generator: '발전기', powercab: '공명로 전원반', b4hatch: '지하 4층 해치', pump: '배수 펌프',
    pumpbox: '펌프 조작함', schem: '배관도', t4: '기계실 단말기 T4', printer: '프린터 종이', ashtray2: '재떨이', mlocker: '사물함 "마태진"', duty: '근무표',
    ...Object.fromEntries(VALVES.map((v) => [`valve_${v}`, `${COLORS[v]} 손잡이 밸브`])),
  },
  buildRoom,
  titleCamera(camera, t) {
    camera.position.set(Math.sin(t * 0.07) * 1.5, 1.7, 1.5);
    camera.rotation.set(0.05, Math.sin(t * 0.05) * 0.4, 0, 'YXZ');
  },
  onStart() { setDrips(true); setWater(0.6); },
  showDoc(key, ctx) {
    if (key !== 'roll') return false;
    const live = ctx.link.log.filter((m) => m.who !== 'sys').map((m) => `<span class="new">${m.who === 'me' ? '[수신]' : '[발신]'} ${m.text}</span>`);
    ctx.note('roll'); ctx.sfx.paper();
    ctx.openPanel({
      title: DOCS.roll.title, wide: true,
      content: `<div class="paper print" style="max-height:58vh;overflow:auto">${[...ROLL_OLD.map((l, i) => (i === 0 ? `<b>${l}</b>` : l)), ...live].map((l) => `<div class="line">${l}</div>`).join('')}</div>`,
      text: '바닥까지 늘어진 누런 연속 용지. 27년 전 1999년 쪽 T4가 찍어 낸 종이다.<br>기록실과 실험실에서 오간 말이, <b>여기 기계실</b> 프린터에 찍혀 있다. ([발신]은 1999년 쪽에서 보낸 말)',
    });
    return true;
  },

  handlers(ctx) {
    const { say, act, openPanel, showDoc, ui, sfx, link } = ctx;
    const S = () => ctx.S;
    function terminal() {
      ctx.terminal({
        title: '기계실 단말기 T4',
        header: '청람망 T4 · 기계실\n동조 주기 27 · 회선 상태: 연결됨',
        sends: () => Object.entries(SENDS).filter(([id]) => can(S(), id)).map(([id, s]) => ({ id, label: s.label })),
        onSend: (id) => { if (!act(id)) return; const s = SENDS[id]; link.me(s.me); link.recv(s.reply); after = id; },
      });
    }
    const valve = (v) => () => {
      if (S().drained) { say('물은 다 뺐다. 이제 밸브는 건드릴 필요 없다.'); return; }
      act(`toggle_${v}`); sfx.clank();
      say(`${COLORS[v]} 손잡이를 돌렸다. → <b>${S()[v] ? '열림' : '잠김'}</b>`.replace(/<\/?b>/g, ''));
    };
    return {
      trench() { say('기어 나온 케이블 통로. 위층 제어실로 이어진다.'); },
      breaker() {
        if (S().power) { say('지하 3층 전원은 올라가 있다.'); return; }
        act('power_on'); sfx.breaker(); setTimeout(() => sfx.crt(), 400); say('레버를 올렸다. 살아남은 형광등 몇 개가 껌뻑이며 켜졌다.');
      },
      generator() { act('read_fuel'); showDoc('fuel', '1999년 발전기. 옆구리에 연료 일지가 집게로 꽂혀 있다.'); },
      powercab() { say('공명로 전원반. 차단기 네 개 중 세 번째만 내려간 채 녹아 붙었다.'); },
      b4hatch() {
        if (!S().hatchOpen) { act('open_hatch'); sfx.door(); setTimeout(() => sfx.water(), 300); say('해치를 열었다. 바로 아래까지 시커먼 물이 차 있다. 짠 냄새. 지하 4층이 잠겼다.', 6000); return; }
        if (!S().drained) { say('사다리가 물속으로 사라진다. 이대로는 못 내려간다.'); return; }
        act('descend'); sfx.clank(); setTimeout(() => ctx.finish(), 900);
      },
      pump() { say(S().drained ? '펌프가 낮게 웅웅거린다.' : '배수 펌프. 지하 4층 집수정에서 물을 끌어 올리는 장치.'); },
      pumpbox() {
        if (!S().power) { say('펌프 조작함. 단추를 눌러도 반응이 없다. 전기가 안 들어온다.'); return; }
        if (S().drained) { say('펌프가 돌고 있다. 지하 4층 물은 다 빠졌다.'); return; }
        const r = pumpResult(valves(S()));
        act('run_pump'); sfx.breaker(); setPump(true); vis.pumping = 2.5; vis.needle = r.ok ? 0.5 : 1;
        setTimeout(() => { if (!S().drained) setPump(false); }, 2500);
        if (r.ok && S().drained) { setTimeout(() => { sfx.water(); setWater(0.2); }, 800); }
        openPanel({ title: '배수 펌프', text: r.t + (r.ok ? '' : '<br><span class="keyhelp">밸브 상태를 바꿔 다시 돌려 보자.</span>') });
      },
      schem() { act('read_schem'); showDoc('schem'); },
      t4() {
        if (!S().power) { say('기계실 단말기 T4. 꺼져 있다.'); return; }
        if (!vis.booted) { vis.booted = true; link.sys('── 청람망 T4 부팅 ──'); link.recv(FIRST); }
        terminal();
      },
      printer() { act('read_roll'); showDoc('roll'); },
      ashtray2() { say('작업대 위 재떨이. 꽁초가 수북하다. 필터마다 "등대".'); },
      mlocker() {
        if (!S().lockerOpen) {
          ctx.keypad('사물함 "마태진"', '네 자리 번호 자물쇠.', (v) => {
            if (v !== CODES.locker) return false;
            S().k.k_roll = true; act('open_locker'); sfx.clank(); setTimeout(() => this.mlocker(), 300); return true;
          });
          return;
        }
        openPanel({
          title: '마태진의 사물함', text: '작업복, 등대 담배 두 갑. 위 칸에 수첩과 봉투.',
          buttons: [
            { label: '점검 수첩', onClick: () => { ui.close(); act('read_mnote'); setTimeout(() => showDoc('mnote'), 50); } },
            { label: '비행기표', onClick: () => { ui.close(); act('read_ticket'); setTimeout(() => showDoc('ticket'), 50); } },
            { label: '반쯤 탄 서류', onClick: () => { ui.close(); act('read_contract'); setTimeout(() => showDoc('contract'), 50); } },
          ],
        });
      },
      duty() { act('read_duty'); showDoc('duty'); },
      ...Object.fromEntries(VALVES.map((v) => [`valve_${v}`, valve(v)])),
    };
  },

  hintText(S) {
    const k = S.k;
    if (!S.power) return ['이 층은 전기가 끊겨 있습니다. 서쪽 벽을 보세요.', '서쪽 벽의 "지하 3층 전원" 레버를 올리세요.'];
    if (!S.hatchOpen) return ['내려갈 길부터 확인하세요.', '북서쪽 바닥의 지하 4층 해치를 여세요. 물이 차 있습니다.'];
    if (!k.k_roll) return ['단말기 옆 프린터에 긴 종이가 걸려 있습니다.', 'T4 프린터의 종이를 읽으세요. 맨 위 줄을 잘 보세요.'];
    if (!S.lockerOpen) return ['프린터 종이 맨 위에 그 사람의 접속 사번이 찍혀 있습니다. 이 방에 그 사람의 물건이 있다면…', '사물함 "마태진"의 번호는 9107(T4 접속 사번, 마태진은 무엇이든 자기 사번을 씀).'];
    if (!k.k_colors) return ['밸브 번호표는 타서 없습니다. 사물함 주인이 따로 외워 둔 게 있습니다.', '사물함의 점검 수첩: V1 빨강, V2 파랑, V3 노랑, V4 초록, V5 하양, V6 검정.'];
    if (!S.drained) {
      const v = valves(S);
      const wrong = VALVES.filter((x) => v[x] !== { V1: true, V2: true, V3: false, V4: true, V5: false, V6: false }[x]).map((x) => COLORS[x]);
      return ['배관도: 집수정→V1→V2→펌프→V4→바다. 다른 갈래(V3·V5·V6)는 모두 잠가야 합니다. 탄 부분은 단말기로 물어봐도 됩니다.', `V1·V2·V4를 열고 V3·V5·V6를 잠근 뒤 펌프 조작함 단추. 지금 바꿀 손잡이: ${wrong.join(', ') || '없음 (단추만 누르세요)'}.`];
    }
    return ['물이 빠졌습니다.', '지하 4층 해치로 내려가세요.'];
  },

  update(ctx, dt, t) {
    const { refs, link, S } = ctx;
    if (!refs) return;
    setHum(S.power ? 0.7 : 0);
    refs.hemi.intensity = S.power ? 0.55 : 0.28;
    refs.tubes.forEach((tb) => { tb.set(S.power); tb.update(t); });
    refs.em.forEach((e) => { e.l.intensity = 2.6 * (0.9 + Math.sin(t * 2.1) * 0.08); });
    refs.lever.position.y = S.power ? 0.08 : -0.08;
    const sig = `${S.power}|${link.log.length}`;
    if (sig !== refs._sig) { refs._sig = sig; refs.t4.draw(link.log.flatMap((m) => wrap(`${m.who === 'me' ? '> ' : ''}${m.text}`, 30)), S.power); }
    if (after && !link.waiting) {
      const id = after; after = null;
      if (id === 'send_schem') ctx.say('배관도의 탄 부분을 상대가 읽어 준 대로 수첩에 적어 두었다. (배관도 다시 보기)', 5000);
      if (id === 'send_roll') ctx.changed('프린터에서 종이가 한 줄 더 밀려 나왔다.');
    }
    // 대화 중 새 줄이 찍히면 프린터가 덜컹거린다
    if (refs._ll !== link.log.length) { refs._ll = link.log.length; refs.strip.scale.z = 1 + Math.min(0.6, link.log.length * 0.03); }
    VALVES.forEach((v) => { const r = refs.valves[v]; r.wheel.rotation.z += ((S[v] ? Math.PI / 2 : 0) - r.wheel.rotation.z) * Math.min(1, dt * 6); r.flag.rotation.z = S[v] ? 0 : Math.PI / 2; });
    const e = (k, target, sp = 3) => { anim[k] += (target - anim[k]) * Math.min(1, dt * sp); return anim[k]; };
    refs.hatchLid.rotation.x = -e('hatch', S.hatchOpen ? 1 : 0) * 1.7;
    refs.shaftWater.position.y = -0.15 - e('water', S.drained ? 1 : 0, 0.35) * 1.4;
    refs.locker.pivot.rotation.y = e('locker', S.lockerOpen ? 1 : 0) * 1.8;
    vis.pumping = Math.max(0, vis.pumping - dt);
    const run2 = S.drained || vis.pumping > 0;
    refs.pump.position.x = 0.6 + (run2 ? Math.sin(t * 60) * 0.004 : 0);
    refs.pumpBtn.material.emissiveIntensity = run2 ? 2 : 0;
    refs.needle.rotation.z = -(run2 ? vis.needle : 0) * 2.2;
  },
};
function wrap(s, n) { const out = []; for (let i = 0; i < s.length; i += n) out.push(s.slice(i, i + n)); return out; }

run(game);
