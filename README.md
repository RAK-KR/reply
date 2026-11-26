# 회신 (REPLY)

철거를 앞둔 해양연구소에 갇힌 밤, 27년 전 같은 밤의 단말기와 글자를 주고받으며 지하로 내려가는 1인칭 3D 방탈출 시리즈입니다. SF 스릴러, 다섯 편, 어려운 난이도. PC 브라우저 전용입니다.

## 플레이 주소
https://rak-kr.github.io/reply/

들어가면 편 선택 화면이 나옵니다. 앞 편을 끝내면 다음 편이 열리고, 진행 기록은 브라우저에 저장됩니다. 순서대로 하는 것을 권합니다.

1. 접속 (CONNECTED) — 1층 로비 · 경비실
2. 원본 (ORIGINALS) — 지하 1층 기록 보관실
3. 공명로 (RESONATOR) — 지하 2층 실험실
4. 기계실 (ENGINE ROOM) — 지하 3층 기계실
5. 회신 (REPLY) — 지하 4층 금고실, 마지막 편

저장소: https://github.com/RAK-KR/reply

## 조작
- WASD: 이동 / 마우스: 시점
- E 또는 클릭: 살펴보기
- Tab: 수첩 (읽은 문서 다시 보기)
- H: 힌트 (살짝 / 정답 2단계)
- Esc: 일시정지 (소리 크기, 마우스 감도)
- 단말기: 보낼 말을 골라서 보냅니다. 숫자는 키보드로 바로 입력할 수 있습니다.

## 파일 구조
- `index.html`, `hub/` — 편 선택 화면
- `shared/` — 모든 편이 같이 쓰는 엔진
  - `engine.js` 렌더링·입력·조사 창·수첩·힌트·엔딩, `terminal.js` 단말기 대화
  - `lab.js` 연구소 재질과 소품, `build.js` 방 짓는 도구, `audio.js` 소리(직접 합성)
  - `puzzle-core.js` 퍼즐 상태, `verify-core.mjs` 퍼즐 검증, `playtest_core.py` 자동 플레이
  - `progress.js` 진행 기록, `settings.js` 소리·감도 설정
- `ep1/` ~ `ep5/` — 편마다 다른 것만
  - `js/content.js` 대사·문서·정답, `js/puzzle.js` 진행 규칙, `js/room.js` 3D 공간, `js/game.js` 상호작용, `js/draw.js`(1편) 그림
  - `tools/verify.mjs` 퍼즐 검증 (`node ep1/tools/verify.mjs`), `tools/playtest.py` 헤드리스 자동 플레이

각 편의 `js/content.js`와 `tools/` 폴더에는 정답과 스토리가 그대로 들어 있습니다. 직접 플레이하기 전에는 열어 보지 않는 것을 권합니다.
