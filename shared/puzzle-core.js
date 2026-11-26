// 퍼즐 상태 공통 헬퍼 (브라우저와 검증 스크립트가 함께 사용)
// 공통 퍼즐 헬퍼
export function makePuzzle(ACTIONS, createState) {
  const can = (s, id, strict = false) => {
    const a = ACTIONS[id];
    if (!a || !a.req(s)) return false;
    if (strict && a.needs && !(typeof a.needs === 'function' ? a.needs(s.k) : a.needs.every((k) => s.k[k]))) return false;
    return true;
  };
  const doAction = (s, id, strict = false) => {
    const a = ACTIONS[id];
    if (!can(s, id, strict)) return false;
    if (a.apply) a.apply(s);
    if (a.learn) a.learn.forEach((k) => { s.k[k] = true; });
    return true;
  };
  const cloneState = (s) => { const n = { ...s, inv: [...s.inv], k: { ...s.k } }; delete n._path; return n; };
  const stateKey = (s) => Object.keys(s).filter((k) => k !== '_path').sort().map((k) => {
    const v = s[k];
    if (k === 'inv') return v.slice().sort().join('+');
    if (k === 'k') return Object.keys(v).sort().join(',');
    return String(v);
  }).join('|');
  return { ACTIONS, createState, can, doAction, cloneState, stateKey };
}
