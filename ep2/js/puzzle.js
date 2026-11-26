// 2편 퍼즐 진행
import { makePuzzle } from '../../shared/puzzle-core.js';
import { PLACES } from './content.js';

export function createState() {
  return { inv: [], archOpen: false, keyLoc: null, l6pried: false, ventOpen: false, done: false, k: {} };
}
const flavor = (k, req = () => true) => ({ req, learn: [k], flavor: true });
const has = (s, i) => s.inv.includes(i);
const T = (s) => s.archOpen;   // T2 단말은 기록실 안

export const ACTIONS = {
  read_crew: flavor('k_rules'),
  read_hydrant: flavor('k_hydrant'),
  look_stairs: flavor('k_blocked'),
  read_copylog: flavor('k_copy', (s) => s.archOpen),
  look_shaft: { req: () => true, learn: ['k_shaft'] },
  read_roster: { req: () => true, learn: ['k_roster'] },
  open_arch: { req: (s) => !s.archOpen, needs: ['k_roster'], code: () => '9107', apply: (s) => { s.archOpen = true; } },
  read_index: { req: (s) => s.archOpen, learn: ['k_index'] },
  open_card: { req: (s) => s.archOpen, needs: ['k_index'], learn: ['k_inv'] },
  send_inv: { req: (s) => T(s) && !s.k.sent_inv, needs: ['k_inv'], learn: ['sent_inv'] },
  send_shaft: { req: (s) => T(s) && s.k.sent_inv && !s.k.sent_shaft, needs: ['k_shaft'], learn: ['sent_shaft'], apply: (s) => { s.keyLoc = 'locker6'; s.l6pried = true; } },
  check_l6: { req: (s) => s.l6pried, learn: ['k_l6'] },
  send_empty: { req: (s) => T(s) && s.k.sent_shaft && !s.k.sent_empty, needs: ['k_l6'], learn: ['sent_empty'] },
  take_coin: { req: (s) => !has(s, 'coin') && !s.ventOpen, apply: (s) => { s.inv.push('coin'); } },
  open_vent: { req: (s) => s.archOpen && has(s, 'coin') && !s.ventOpen, apply: (s) => { s.ventOpen = true; s.inv = s.inv.filter((i) => i !== 'coin'); } },
  take_key: { req: (s) => s.ventOpen && s.keyLoc === 'vent' && !has(s, 'key'), apply: (s) => { s.inv.push('key'); } },
  open_shaft: { req: (s) => has(s, 'key') && !s.done, apply: (s) => { s.done = true; } },
};
for (const p of Object.keys(PLACES)) {
  if (p === 'locker6') continue;
  ACTIONS[`stash_${p}`] = { req: (s) => T(s) && s.k.sent_empty && !has(s, 'key') && s.keyLoc !== p, apply: (s) => { s.keyLoc = p; } };
}

export const P = makePuzzle(ACTIONS, createState);
export const { can, doAction } = P;
