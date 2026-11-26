// 1편 퍼즐 진행 (화면과 분리 — 검증 스크립트도 같이 쓴다)
import { makePuzzle } from '../../shared/puzzle-core.js';
import { LIMIT, LOADS, HEATER } from './content.js';

export function createState() {
  return { inv: [], c1: false, c2: false, c3: false, c4: false, c5: false, main: false, heater: true, coin: false, guardOpen: false, nightLock: true, done: false, k: {} };
}
export const load = (s) => ['c1', 'c2', 'c3', 'c4', 'c5'].reduce((a, c) => a + (s[c] ? LOADS[c] - (c === 'c4' && !s.heater ? HEATER : 0) : 0), 0);
export const over = (s) => load(s) > LIMIT + 1e-9;
export const live = (s, c) => s.main && s[c];
const trip = (s) => { if (s.main && over(s)) s.main = false; };
const flip = (c) => ({ req: () => true, apply: (s) => { s[c] = !s[c]; trip(s); } });
const flavor = (k, req = () => true) => ({ req, learn: [k], flavor: true });
const term = (s) => live(s, 'c1');

export const ACTIONS = {
  read_clip: flavor('k_clip'),
  read_plan: flavor('k_plan'),
  read_news: { req: () => true, learn: ['k_news'] },
  toggle_c1: flip('c1'),
  toggle_c4: flip('c4'),
  toggle_c5: flip('c5'),
  toggle_c2: { ...flip('c2'), flavor: true },
  toggle_c3: { ...flip('c3'), flavor: true },
  toggle_main: { req: () => true, apply: (s) => { s.main = !s.main; trip(s); } },
  send_year: { req: (s) => term(s) && !s.k.sent_year, learn: ['sent_year'], apply: (s) => { s.coin = true; } },
  look_pot: { req: (s) => s.coin, learn: ['k_coin'] },
  send_coin: { req: (s) => term(s) && s.k.sent_year && !s.k.sent_coin, needs: ['k_coin'], learn: ['sent_coin'] },
  send_fire: { req: (s) => term(s) && s.k.sent_coin && !s.k.sent_fire, needs: ['k_news'], learn: ['sent_fire', 'k_gcode'] },
  open_guard: { req: (s) => !s.guardOpen && live(s, 'c5'), needs: ['k_gcode'], code: () => '4017', apply: (s) => { s.guardOpen = true; } },
  unplug_heater: { req: (s) => s.guardOpen && s.heater, apply: (s) => { s.heater = false; } },
  read_log: { req: (s) => s.guardOpen && live(s, 'c4'), learn: ['k_log'] },
  send_log: { req: (s) => term(s) && s.k.sent_fire && !s.k.sent_log, needs: ['k_log'], learn: ['sent_log', 'k_rule'] },
  toggle_night: { req: (s) => s.guardOpen, apply: (s) => { s.nightLock = !s.nightLock; } },
  open_stair: { req: (s) => live(s, 'c5') && !s.nightLock && !s.done, needs: ['k_log', 'k_rule'], code: () => '0101', apply: (s) => { s.done = true; } },
};

export const P = makePuzzle(ACTIONS, createState);
export const { can, doAction } = P;
