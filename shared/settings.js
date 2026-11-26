// 소리 크기·마우스 감도 설정 (모든 편 공통). data-setting="vol" / "sens" 슬라이더를 서로 맞춰 주고 저장한다.
(function () {
  const KEYS = { vol: 'reply-volume', sens: 'reply-sens' };
  const DEF = { vol: 0.8, sens: 1 };
  const get = (k) => { try { const v = localStorage.getItem(KEYS[k]); return v === null ? DEF[k] : +v; } catch (e) { return DEF[k]; } };
  const set = (k, v) => { try { localStorage.setItem(KEYS[k], v); } catch (e) { /* 저장 불가 */ } };
  function bind() {
    document.querySelectorAll('input[data-setting]').forEach((inp) => {
      const k = inp.dataset.setting;
      inp.value = get(k);
      inp.addEventListener('input', () => {
        const v = +inp.value;
        set(k, v);
        document.querySelectorAll(`input[data-setting="${k}"]`).forEach((o) => { if (o !== inp) o.value = v; });
        window.dispatchEvent(new CustomEvent(`reply-${k}`, { detail: v }));
      });
      // 일시정지 화면에서 슬라이더를 만져도 게임으로 돌아가지 않게
      ['mousedown', 'click', 'pointerdown'].forEach((ev) => inp.addEventListener(ev, (e) => e.stopPropagation()));
    });
    document.querySelectorAll('.pause-opts').forEach((el) => el.addEventListener('click', (e) => e.stopPropagation()));
  }
  document.addEventListener('DOMContentLoaded', bind);
  window.BSSettings = { get };
}());
