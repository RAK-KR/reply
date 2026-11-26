// 4편 퍼즐 진행
import { makePuzzle } from '../../shared/puzzle-core.js';
import { VALVES, START_OPEN, GOAL, pumpResult } from './content.js';

export function createState() {
  return { inv: [], power: false, lockerOpen: false, ...START_OPEN, drained: false, hatchOpen: false, done: false, k: {} };
}
const flavor = (k, req = () => true) => ({ req, learn: [k], flavor: true });
export const valves = (s) => Object.fromEntries(VALVES.map((v) => [v, s[v]]));

export const ACTIONS = {
  read_fuel: flavor('k_fuel'),
  read_duty: flavor('k_duty'),
  read_ticket: flavor('k_ticket', (s) => s.lockerOpen),
  read_contract: flavor('k_contract', (s) => s.lockerOpen),
  power_on: { req: (s) => !s.power, apply: (s) => { s.power = true; } },
  read_roll: { req: () => true, learn: ['k_roll'] },
  open_locker: { req: (s) => !s.lockerOpen, needs: ['k_roll'], code: () => '9107', apply: (s) => { s.lockerOpen = true; } },
  read_mnote: { req: (s) => s.lockerOpen, learn: ['k_colors'] },
  read_schem: { req: () => true, learn: ['k_schem'] },
  open_hatch: { req: (s) => !s.hatchOpen, learn: ['k_flood'], apply: (s) => { s.hatchOpen = true; } },
  send_flood: { req: (s) => s.power && !s.k.sent_flood, needs: ['k_flood'], learn: ['sent_flood'], flavor: true },
  send_schem: { req: (s) => s.power && s.k.sent_flood && !s.k.k_schem2, needs: ['k_schem'], learn: ['k_schem2'], flavor: true },
  send_roll: { req: (s) => s.power && !s.k.sent_roll, needs: ['k_roll'], learn: ['sent_roll'], flavor: true },
  run_pump: { req: (s) => s.power && !s.drained, needs: ['k_colors'], apply: (s) => { if (pumpResult(valves(s)).ok) s.drained = true; } },
  descend: { req: (s) => s.drained && s.hatchOpen && !s.done, apply: (s) => { s.done = true; } },
};
for (const v of VALVES) ACTIONS[`toggle_${v}`] = { req: (s) => !s.drained, apply: (s) => { s[v] = !s[v]; } };

export const P = makePuzzle(ACTIONS, createState);
export const { can, doAction } = P;
export { GOAL };
