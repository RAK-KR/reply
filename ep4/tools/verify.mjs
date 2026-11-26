// 4편 퍼즐 검증: node tools/verify.mjs
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { verify } from '../../shared/verify-core.mjs';
import { P } from '../js/puzzle.js';
import { VALVES, GOAL, START_OPEN, pumpResult, ROLL_OLD } from '../js/content.js';

// 64가지 밸브 조합 중 물이 빠지는 건 정확히 하나
const combos = [...Array(64).keys()].map((n) => Object.fromEntries(VALVES.map((v, i) => [v, !!(n >> i & 1)])));
const wins = combos.filter((c) => pumpResult(c).ok);
verify({
  P,
  root: path.join(path.dirname(fileURLToPath(import.meta.url)), '..'),
  checks: [
    [wins.length === 1 && VALVES.every((v) => wins[0][v] === GOAL[v]), `밸브 64가지 중 물이 빠지는 조합은 하나 (V1·V2·V4 열림)`],
    [!pumpResult(START_OPEN).ok, '처음 상태로는 안 빠짐'],
    [ROLL_OLD[0].includes('9107'), 'T4 종이 맨 위에 접속 사번 9107'],
  ],
  required: {
    power_on: '지하 3층 전원', read_roll: 'T4 프린터 종이', open_locker: '마태진 사물함', read_mnote: '밸브 색 목록', open_hatch: '해치 열기',
    toggle_V1: 'V1(빨강) 열기', toggle_V3: 'V3(노랑) 잠그기', toggle_V4: 'V4(초록) 열기', toggle_V5: 'V5(하양) 잠그기', run_pump: '펌프 돌리기',
  },
});
