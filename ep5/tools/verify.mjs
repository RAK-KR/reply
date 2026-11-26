// 5편 퍼즐 검증: node tools/verify.mjs
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { verify } from '../../shared/verify-core.mjs';
import { P } from '../js/puzzle.js';
import { CODES, DURESS } from '../js/content.js';

// 거울은 좌우를 뒤집는다: 바퀴 순서가 거꾸로 보인다 → 보이는 순서 그대로 읽으면 협박 번호
const mirrorOrder = [...CODES.vault].reverse().join('');
verify({
  P,
  root: path.join(path.dirname(fileURLToPath(import.meta.url)), '..'),
  checks: [
    [DURESS === '5813' && CODES.vault === '3185', `진짜 번호 ${CODES.vault}, 협박 번호(거꾸로) ${DURESS}`],
    [mirrorOrder === DURESS, '거울에 보이는 순서 그대로 = 협박 번호'],
    [CODES.vault !== DURESS, '진짜 번호와 협박 번호가 다름 (대칭 번호 아님)'],
    [CODES.gate === '9107', '터널 자물쇠 = 마태진 사번 9107'],
  ],
  required: {
    connect_power: '금고 전원', jack_4: '4번 잭(금고 회선)', r_who: '금고 회선에 정체 알리기', r_fake: '메인 회선의 가짜 이야기', r_help: '뒤판 풀어 달라기',
    take_mirror: '점검 거울', read_dial: '거울로 바퀴 읽기', read_plaque: '안내판(협박 번호)', send_duress: '협박 번호 보내기', r_caught: '체포 확인',
    look_gate: '터널 철문 확인', read_pumptag: '펌프 꼬리표', r_exit: '철문 이야기', r_lock: '자물쇠 번호 보내기',
  },
});
