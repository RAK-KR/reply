// 시리즈 진행 기록 (어느 편까지 깼는지). 모든 편과 선택 화면이 함께 쓴다.
(function () {
  const KEY = 'reply-cleared', ALL = 'reply-unlock-all';
  const get = () => { try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch (e) { return []; } };
  const BSP = {
    cleared: get,
    markCleared(n) { try { const c = get(); if (!c.includes(n)) { c.push(n); localStorage.setItem(KEY, JSON.stringify(c)); } } catch (e) { /* 저장 불가 */ } },
    unlockAll() { try { localStorage.setItem(ALL, '1'); } catch (e) { /* 저장 불가 */ } },
    reset() { try { localStorage.removeItem(KEY); localStorage.removeItem(ALL); } catch (e) { /* 저장 불가 */ } },
    allOpen() { try { return localStorage.getItem(ALL) === '1'; } catch (e) { return false; } },
    canPlay(n) { return n === 1 || BSP.allOpen() || get().includes(n - 1); },
    // 잠긴 편에 주소로 바로 들어오면 시작 버튼을 막는다
    gate(n) {
      document.addEventListener('DOMContentLoaded', () => {
        if (BSP.canPlay(n)) return;
        const b = document.getElementById('start');
        if (!b) return;
        b.disabled = true;
        b.textContent = `${n - 1}편을 먼저 끝내 주세요`;
        b.style.opacity = '0.6';
      });
    },
  };
  window.BSP = BSP;
}());
