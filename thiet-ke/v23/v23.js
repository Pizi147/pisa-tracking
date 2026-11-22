// v23 · phần đọc mockup: bộ biểu tượng + nút đổi chế độ màu (Gốc = 1440 tối · 375 sáng). Không lên web.
document.body.insertAdjacentHTML('afterbegin', `<svg width="0" height="0" style="position:absolute" aria-hidden="true">
<symbol id="i-chev" viewBox="0 0 16 16"><path d="M6 3.5L10.5 8 6 12.5"/></symbol>
<symbol id="i-lui" viewBox="0 0 16 16"><path d="M10 3.5L5.5 8l4.5 4.5"/></symbol>
<symbol id="i-tim" viewBox="0 0 16 16"><circle cx="7" cy="7" r="4.5"/><path d="M10.5 10.5L14 14"/></symbol>
<symbol id="i-chuong" viewBox="0 0 16 16"><path d="M4 11V7a4 4 0 0 1 8 0v4l1.5 1.5h-11zM6.5 14a1.5 1.5 0 0 0 3 0"/></symbol>
<symbol id="i-x" viewBox="0 0 16 16"><path d="M4 4l8 8M12 4l-8 8"/></symbol>
<symbol id="i-ba" viewBox="0 0 16 16"><circle cx="3.5" cy="8" r=".9"/><circle cx="8" cy="8" r=".9"/><circle cx="12.5" cy="8" r=".9"/></symbol>
<symbol id="i-i" viewBox="0 0 16 16"><circle cx="8" cy="8" r="6"/><path d="M8 7.2v4M8 4.9v.01"/></symbol>
<symbol id="i-ok" viewBox="0 0 16 16"><circle cx="8" cy="8" r="6"/><path d="M5.3 8.2l1.8 1.8 3.6-3.8"/></symbol>
<symbol id="i-dau" viewBox="0 0 16 16"><path d="M3.5 8.3l3 3 6-6.6"/></symbol>
<symbol id="i-menu" viewBox="0 0 16 16"><path d="M2.5 4h11M2.5 8h11M2.5 12h11"/></symbol>
<symbol id="i-lich" viewBox="0 0 16 16"><rect x="2.5" y="3.5" width="11" height="10" rx="1"/><path d="M2.5 6.5h11M5.5 2v3M10.5 2v3"/></symbol>
<symbol id="i-goi" viewBox="0 0 16 16"><path d="M5.5 2.5l1.5 3-1.5 1.2a7 7 0 0 0 3.8 3.8L10.5 9l3 1.5v2a1 1 0 0 1-1 1A10 10 0 0 1 2.5 3.5a1 1 0 0 1 1-1z"/></symbol>
<symbol id="i-loc" viewBox="0 0 16 16"><path d="M2.5 3.5h11L9.5 8.5v4l-3 1v-5z"/></symbol>
</svg>`);
const nhom = document.querySelector('.che-mk');
if (nhom) {
  const khung = [...document.querySelectorAll('.man, .dt')];
  khung.forEach((k) => { k.dataset.goc = k.classList.contains('sang') ? 'sang' : 'toi'; });
  nhom.addEventListener('click', (e) => {
    const b = e.target.closest('button[data-che]'); if (!b) return;
    nhom.querySelectorAll('button').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    khung.forEach((k) => { const c = b.dataset.che === 'goc' ? k.dataset.goc : b.dataset.che; k.classList.toggle('toi', c === 'toi'); k.classList.toggle('sang', c === 'sang'); });
  });
}
document.querySelectorAll('[data-mot-phan]').forEach((e) => { e.indeterminate = true; });
