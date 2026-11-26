// 5편 퍼즐 진행
import { makePuzzle } from '../../shared/puzzle-core.js';
import { START_JACK, REAL_JACK, MAIN_JACKS, CODES, DURESS } from './content.js';

export function createState() {
  return { inv: [], power: false, jack: START_JACK, coverOff: false, trapped: false, lost: false, gateOpen: false, done: false, k: {} };
}
const flavor = (k, req = () => true) => ({ req, learn: [k], flavor: true });
const has = (s, i) => s.inv.includes(i);
const real = (s) => s.power && s.jack === REAL_JACK && !s.lost;
const main = (s) => s.power && MAIN_JACKS.includes(s.jack);

export const ACTIONS = {
  read_cutting: flavor('k_cut'),
  f_accuse: { req: (s) => main(s) && !s.trapped && !s.k.sent_accuse, needs: ['k_truth'], learn: ['sent_accuse'], flavor: true },
  connect_power: { req: (s) => !s.power, apply: (s) => { s.power = true; } },
  read_plaque: { req: () => true, learn: ['k_plaque'] },
  r_who: { req: (s) => real(s) && !s.k.sent_who, learn: ['sent_who'] },
  r_fake: { req: (s) => real(s) && s.k.sent_who && !s.k.k_truth, learn: ['k_truth'] },
  r_help: { req: (s) => real(s) && s.k.k_truth && !s.coverOff, apply: (s) => { s.coverOff = true; } },
  take_mirror: { req: (s) => !has(s, 'mirror'), apply: (s) => { s.inv.push('mirror'); } },
  read_dial: { req: (s) => s.coverOff && has(s, 'mirror'), learn: ['k_dial'] },
  send_duress: { req: (s) => main(s) && !s.trapped, needs: ['k_dial', 'k_plaque'], code: () => DURESS, apply: (s) => { s.trapped = true; } },
  send_real: { req: (s) => main(s) && !s.trapped, flavor: true, apply: (s) => { s.lost = true; } },   // 나쁜 결말 (되돌리기)
  r_caught: { req: (s) => real(s) && s.trapped && !s.k.k_safe, learn: ['k_safe'] },
  look_gate: { req: () => true, learn: ['k_gate'] },
  read_pumptag: { req: () => true, learn: ['k_pump'] },
  r_exit: { req: (s) => real(s) && s.k.k_safe && !s.k.sent_exit, needs: ['k_gate'], learn: ['sent_exit'] },
  r_lock: { req: (s) => real(s) && s.k.sent_exit && !s.gateOpen, needs: ['k_pump'], code: () => CODES.gate, apply: (s) => { s.gateOpen = true; } },
  read_box: { req: (s) => s.gateOpen, learn: ['k_box'], flavor: true },
  leave: { req: (s) => s.gateOpen && !s.done, apply: (s) => { s.done = true; } },
};
for (let j = 1; j <= 4; j++) ACTIONS[`jack_${j}`] = { req: (s) => s.power && s.jack !== j, apply: (s) => { s.jack = j; } };

export const P = makePuzzle(ACTIONS, createState);
export const { can, doAction } = P;
