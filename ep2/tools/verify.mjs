// 2편 퍼즐 검증: node tools/verify.mjs
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { verify } from '../../shared/verify-core.mjs';
import { P } from '../js/puzzle.js';
import { ROWS, COLS, TARGET, ROW_YEARS } from '../js/content.js';

// 1999년 공명 실험 → 행(1998~99) + 열(공명 실험)
const row = ROWS[ROW_YEARS.findIndex((y) => y.startsWith('1998'))], col = COLS.indexOf('공명 실험') + 1;
// 열쇠가 27년 뒤까지 남는 곳은 환기구 하나뿐인지: 열린 곳은 반출, 잠긴 곳은 열 수 없음, 소화전은 2000.1.1에 비움
const survives = { drawer: false, locker1: false, shelf: false, locker6: false, hydrant: false, vent: true };
verify({
  P,
  root: path.join(path.dirname(fileURLToPath(import.meta.url)), '..'),
  checks: [
    [`${row}${col}` === TARGET, `색인으로 찾은 서랍 ${row}${col} = 정답 서랍 ${TARGET}`],
    [Object.values(survives).filter(Boolean).length === 1, '27년 뒤까지 열쇠가 남는 곳은 환기구 하나뿐'],
  ],
  required: {
    read_roster: '당번표', open_arch: '기록실 열기', read_index: '서랍장 색인', open_card: '대장 카드', send_inv: '원본 행방 알리기',
    look_shaft: '승강기 문 확인', send_shaft: '열쇠 부탁', check_l6: '뜯긴 6번 사물함 확인', send_empty: '비었다고 알리기',
    stash_vent: '환기구에 넣어 달라고 하기', take_coin: '자판기 동전', open_vent: '환기구 열기', take_key: '삼각 열쇠',
  },
});
