// 3편 퍼즐 진행
import { makePuzzle } from '../../shared/puzzle-core.js';

export function createState() {
  return { inv: [], deskOpen: false, hatchShown: false, done: false, k: {} };
}
const flavor = (k, req = () => true) => ({ req, learn: [k], flavor: true });
const has = (s, i) => s.inv.includes(i);

export const ACTIONS = {
  read_whiteboard: flavor('k_wb'),
  read_panel: flavor('k_ptag'),
  look_firedoor: flavor('k_firedoor'),
  take_bar: { req: (s) => !has(s, 'bar'), apply: (s) => { s.inv.push('bar'); } },
  open_desk: { req: (s) => has(s, 'bar') && !s.deskOpen, apply: (s) => { s.deskOpen = true; } },
  read_note: { req: (s) => s.deskOpen, learn: ['k_note'] },
  read_poster: { req: () => true, learn: ['k_poster'] },
  read_report: { req: () => true, learn: ['k_report'] },
  read_signin: { req: () => true, learn: ['k_signin'] },
  send_cause: { req: (s) => !s.k.sent_cause, needs: ['k_report'], learn: ['sent_cause'] },
  send_poster: { req: (s) => s.k.sent_cause && !s.k.k_lines, needs: ['k_note', 'k_poster'], learn: ['k_lines'] },
  decode: { req: (s) => s.k.k_note && s.k.k_lines && !s.k.k_decoded, learn: ['k_decoded'] },
  send_decoded: { req: (s) => !s.k.sent_decoded, needs: ['k_decoded'], learn: ['sent_decoded', 'k_hcode'] },
  reveal_hatch: { req: (s) => !s.hatchShown, needs: ['k_decoded'], apply: (s) => { s.hatchShown = true; } },
  read_tag: { req: (s) => s.hatchShown, learn: ['k_tag'] },
  open_hatch: {
    req: (s) => s.hatchShown && !s.done, code: () => '9107',
    needs: (k) => k.k_hcode || (k.k_tag && k.k_signin), needsText: '해독을 보내 상대에게 듣거나(k_hcode), 꼬리표 "늘 쓰는 걸로" + 서명부 사번(k_tag, k_signin)',
    apply: (s) => { s.done = true; },
  },
};

export const P = makePuzzle(ACTIONS, createState);
export const { can, doAction } = P;
