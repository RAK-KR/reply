// 시리즈 선택 화면
const EPISODES = [
  { n: 1, title: '접속', en: 'CONNECTED', place: '1층 로비 · 경비실' },
  { n: 2, title: '원본', en: 'ORIGINALS', place: '지하 1층 기록 보관실' },
  { n: 3, title: '공명로', en: 'RESONATOR', place: '지하 2층 실험실' },
  { n: 4, title: '기계실', en: 'ENGINE ROOM', place: '지하 3층 기계실' },
  { n: 5, title: '회신', en: 'REPLY', place: '지하 4층 금고실 · 마지막 편' },
];

function render() {
  const list = document.getElementById('episodes');
  const cleared = BSP.cleared();
  list.innerHTML = '';
  let nextMarked = false;
  EPISODES.forEach((ep) => {
    const done = cleared.includes(ep.n);
    const open = BSP.canPlay(ep.n);
    const isNext = open && !done && !nextMarked;
    if (isNext) nextMarked = true;
    const li = document.createElement('li');
    const el = document.createElement(open ? 'a' : 'div');
    el.className = `ep${done ? ' done' : ''}${isNext ? ' next' : ''}${open ? '' : ' locked'}`;
    if (open) el.href = `ep${ep.n}/`;
    el.innerHTML = `
      <div class="num">${ep.n}</div>
      <div class="body">
        <div class="title">${ep.title}</div>
        <div class="en">${ep.en}</div>
        <div class="place">${ep.place}</div>
      </div>
      <div class="state">${done ? '완료 · 다시 하기' : isNext ? '이어서 하기' : open ? '열림' : '잠김'}</div>`;
    li.appendChild(el);
    list.appendChild(li);
  });
}

document.getElementById('unlock').onclick = () => { BSP.unlockAll(); render(); };
document.getElementById('reset').onclick = () => {
  if (confirm('진행 기록을 지울까요? 1편부터 다시 열립니다.')) { BSP.reset(); render(); }
};
render();
