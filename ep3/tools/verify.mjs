// 3편 퍼즐 검증: node tools/verify.mjs
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { verify } from '../../shared/verify-core.mjs';
import { P } from '../js/puzzle.js';
import { POSTER, CIPHER, BURNT_FROM, ANSWER, WORDS, PAD, charAt } from '../js/content.js';

const pairs = CIPHER.flat();
const needBurnt = pairs.filter(([l]) => l >= BURNT_FROM).length;
// 타 버린 줄을 모르면 풀 수 없는지: 5~8줄 글자는 1~4줄만으로 대신할 수 없다 (같은 자리를 다른 줄에서 찾을 수 없음)
verify({
  P,
  root: path.join(path.dirname(fileURLToPath(import.meta.url)), '..'),
  checks: [
    [WORDS.join(' / ') === '범인 / 마기사 / 해치 / 금고 / 회선만', `해독 결과: ${WORDS.join(' / ')}`],
    [pairs.every(([l, n]) => l >= 1 && l <= POSTER.length && n >= 1 && n <= [...POSTER[l - 1].replace(/ /g, '')].length), '모든 줄-글자 자리가 실제로 존재'],
    [needBurnt >= 7, `타 버린 5~8줄을 가리키는 글자 ${needBurnt}개 (1999년 쪽에서 읽어 줘야 풀림)`],
    [[...ANSWER].every((c) => PAD.includes(c)), '정답 글자가 모두 글자판에 있음'],
    [POSTER.length === 8, '포스터 8줄'],
  ],
  required: {
    take_bar: '쇠지렛대', open_desk: '책상 서랍', read_note: '수첩', read_poster: '포스터', read_report: '사고 보고서',
    send_cause: '사고 원인 보내기', send_poster: '포스터 5~8줄 받기', decode: '수첩 해독', reveal_hatch: '해치 찾기',
  },
});
