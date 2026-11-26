// 퍼즐 검증 공통 로직 (3~5편 tools/verify.mjs가 사용)
import fs from 'node:fs';
import path from 'node:path';

export function verify({ P, checks = [], required = {}, root, winKey = 'done' }) {
  let failed = 0;
  const ok = (cond, msg) => { console.log(`${cond ? 'PASS' : 'FAIL'}  ${msg}`); if (!cond) failed++; };
  checks.forEach(([cond, msg]) => ok(cond, msg));

  const ids = Object.keys(P.ACTIONS).filter((id) => !P.ACTIONS[id].flavor);
  function explore(banned = new Set()) {
    const start = P.createState();
    const seen = new Map([[P.stateKey(start), start]]);
    const edges = new Map();
    const queue = [start];
    let win = null;
    while (queue.length) {
      const s = queue.shift();
      const key = P.stateKey(s);
      edges.set(key, []);
      for (const id of ids) {
        if (banned.has(id) || !P.can(s, id, true)) continue;
        const n = P.cloneState(s);
        P.doAction(n, id, true);
        const nk = P.stateKey(n);
        if (nk === key) continue;
        edges.get(key).push(nk);
        if (!seen.has(nk)) {
          n._path = [...(s._path || []), id];
          seen.set(nk, n); queue.push(n);
          if (n[winKey] && !win) win = n;
        }
      }
    }
    return { seen, edges, win };
  }
  const all = explore();
  ok(!!all.win, `탈출 가능 (최단 ${all.win?._path.length}단계, 상태 ${all.seen.size}개 탐색)`);
  console.log('      최단 경로: ' + all.win?._path.join(' → '));
  const rev = new Map();
  for (const [k, outs] of all.edges) for (const o of outs) { if (!rev.has(o)) rev.set(o, []); rev.get(o).push(k); }
  const good = new Set();
  const q = [...all.seen.values()].filter((s) => s[winKey]).map(P.stateKey);
  q.forEach((k) => good.add(k));
  while (q.length) { const k = q.shift(); for (const p of rev.get(k) || []) if (!good.has(p)) { good.add(p); q.push(p); } }
  const stuck = [...all.seen.keys()].filter((k) => !good.has(k));
  ok(stuck.length === 0, `막힘 상태 없음 (${stuck.length}개)`);
  for (const [id, label] of Object.entries(required)) ok(!explore(new Set([id])).win, `'${label}' 없이는 탈출 불가`);
  console.log('\n단서 추적표');
  for (const [id, a] of Object.entries(P.ACTIONS)) if (a.code) console.log(`  ${id.padEnd(16)} 번호 ${a.code()}  ← 필요한 단서: ${typeof a.needs === 'function' ? (a.needsText || '조건식') : (a.needs || []).join(', ')}`);
  const files = [];
  (function walk(d) {
    for (const f of fs.readdirSync(d)) {
      const p = path.join(d, f);
      if (f === 'node_modules' || f.startsWith('.')) continue;
      if (fs.statSync(p).isDirectory()) walk(p);
      else if (/\.(js|mjs|html|css|md)$/.test(f)) files.push(p);
    }
  })(root);
  const HAN = new RegExp('[' + String.fromCharCode(0x4e00) + '-' + String.fromCharCode(0x9fff) + String.fromCharCode(0x3400) + '-' + String.fromCharCode(0x4dbf) + ']');
  const han = files.filter((f) => HAN.test(fs.readFileSync(f, 'utf8')));
  ok(han.length === 0, `한자 없음 (${files.length}개 파일 검사)${han.length ? ': ' + han.join(', ') : ''}`);
  console.log(failed ? `\n실패 ${failed}건` : '\n모든 검사 통과');
  process.exit(failed ? 1 : 0);
}

export { makePuzzle } from './puzzle-core.js';
