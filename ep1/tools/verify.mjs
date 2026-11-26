// 1편 퍼즐 검증: node tools/verify.mjs
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { verify } from '../../shared/verify-core.mjs';
import { P, load } from '../js/puzzle.js';
import { CODES, LIMIT } from '../js/content.js';

const s = P.createState();
const with_ = (o) => ({ ...s, main: true, ...o });
verify({
  P,
  root: path.join(path.dirname(fileURLToPath(import.meta.url)), '..'),
  checks: [
    [load(with_({ c1: true, c4: true, c5: true })) > LIMIT, '난로를 꽂은 채 ①④⑤를 켜면 한도 초과 (2.6kW)'],
    [load(with_({ c1: true, c4: true, c5: true, heater: false })) <= LIMIT, '난로를 뽑으면 ①④⑤를 함께 켤 수 있음 (1.8kW)'],
    [load(with_({ c1: true, c5: true })) <= LIMIT && load(with_({ c4: true, c5: true })) <= LIMIT, '①⑤, ④⑤ 조합은 난로가 있어도 가능 (막힘 없음)'],
    [CODES.stair === '0101', '계단문: 12월 31일 23:30에 "다음 날"(1월 1일) → 0101'],
    [CODES.stair !== '1231', '오늘 날짜(1231)는 정답이 아님'],
  ],
  required: {
    toggle_c1: '① 로비·단말 전원', toggle_c5: '⑤ 잠금장치 전원', toggle_c4: '④ 경비실 전원', send_year: '연도 알리기', look_pot: '화분 밑 동전',
    send_coin: '동전 알리기', read_news: '신문', send_fire: '화재 알리기', open_guard: '경비실 열기', read_log: '경비 일지',
    send_log: '일지 보내기(규칙을 받음)', toggle_night: '야간 잠금 해제',
  },
});
