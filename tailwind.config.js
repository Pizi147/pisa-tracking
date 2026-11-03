/**
 * Màu nghĩa đọc từ `web/src/index.css :root` (một chỗ khai báo) qua bộ ba RGB → dùng được độ trong (`bg-bad/15`).
 * `text-ok` · `bg-ok-bg` · `border-ok-line`; `late` không nền riêng ở chỗ dùng chữ, nhưng vẫn có `bg-late-bg`.
 */
const v = (n) => `rgb(var(--${n}-rgb) / <alpha-value>)`;
const nghia = (n) => ({ DEFAULT: v(n), bg: v(`${n}-bg`), line: v(`${n}-line`) });

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './web/src/**/*.{ts,tsx}'],
  /*
   * AUDIT-LOI F02: phủ định JS (`!k`, `!pt`, `!rong`…) trùng tên lớp tự viết ở index.css → Tailwind coi là lớp "important" và chép lại khối CSS đó;
   * trong `@media` bản chép mất selector (`{ grid-… }` — 14 cảnh báo css-syntax-error khi build). Chặn đúng các chữ này; phép kiểm
   * `scripts/kiem-css.mjs` (trong `npm run check`) báo chữ mới trùng tên lớp để thêm vào đây.
   */
  blocklist: ['!bam', '!bang', '!cham', '!chon', '!ct', '!cu', '!cua', '!doi', '!dong', '!gon', '!h', '!k', '!loi', '!lu', '!moi', '!nhat', '!nhap', '!p', '!pt',
    '!qua', '!rong', '!so', '!t', '!td', '!th', '!thieu', '!trong', '!tvv'],
  theme: {
    /*
     * NEN-TYPO-MAU (04 mục 2.2): THANG CHỮ 12 · 13 · 14 · 15 · 17 · 22 · 28 — đặt `fontSize` (không extend) để lớp ngoài thang không sinh được.
     * 13 dùng `text-[13px]`. Line-height Việt: một dòng có cắt ≥ 1,5; nhiều dòng ≥ 1,45; tiêu đề ≥ 1,3. Phép kiểm `prNenTypoMau` K-CHU-1/2.
     */
    fontSize: {
      xs: ['12px', '1.4'],    // tối thiểu: badge, dòng phụ ô điểm, chú thích
      sm: ['14px', '1.45'],   // lưới dày, giá trị trong panel
      base: ['15px', '1.5'],  // chữ thường, ô bảng, nút
      lg: ['17px', '1.35'],   // tiêu đề khối / panel
      xl: ['22px', '1.3'],    // tiêu đề trang
      '2xl': ['28px', '1.1'], // số lớn
    },
    extend: {
      /* NEN-V8: bóng nổi (menu, panel, hộp, toast) theo mockup v8 — một biến `--bong-noi` (index.css) cho tối và sáng. */
      boxShadow: { lg: 'var(--bong-noi)', xl: 'var(--bong-noi)', '2xl': 'var(--bong-noi)' },
      colors: {
        // NEN-TYPO-MAU: kết quả điểm — chỉ tô chính con số / ký hiệu ✓ ✗ (`text-kq-vuot`), không nền.
        'kq-vuot': v('kq-vuot'), 'kq-bang': v('kq-bang'), 'kq-duoi': v('kq-duoi'),
        ok: nghia('ok'), bad: nghia('bad'), late: nghia('late'), soon: nghia('soon'),
        doing: nghia('doing'), done: nghia('done'), muted: nghia('muted'),
        dat: nghia('dat'),
        // SOS: viền (`border-sos1`) + chữ (`text-sos1-chu`); nền SOS 2 / 3 là `--sos2-nen` / `--sos3-nen` (`lopSos`); nền hàng đã thi `bg-da-thi`.
        sos1: { DEFAULT: v('sos1'), chu: v('sos1-chu') }, sos2: { DEFAULT: v('sos2'), chu: v('sos2-chu') }, sos3: { DEFAULT: v('sos3'), chu: v('sos3-chu') },
        'da-thi': v('da-thi-bg'),
        dim: v('text-dim'), faint: v('text-faint'),
        // Ghi đè (PR-SANG, Q5): MỌI cấp màu Tailwind còn dùng trong web/src đi qua biến của index.css → đổi theo chế độ sáng/tối,
        // không sửa từng component. Tên (`slate-100`, `white`…) là tên CŨ; giá trị theo chế độ. Phép kiểm `prSang` S6 báo cấp dùng mà chưa ánh xạ.
        rose: { 200: v('bad'), 300: v('bad'), 400: v('bad') },
        amber: { 100: v('soon'), 200: v('soon'), 300: v('soon'), 400: v('soon'), 500: v('soon') },
        sky: { 200: v('doing'), 300: v('doing'), 400: v('doing'), 500: v('doing') },
        emerald: { 200: v('ok'), 300: v('ok') },
        // slate-100/200/300 = chữ chính/phụ (tối sáng · sáng đậm) · 400/500 = chữ phụ · 600/700 = CHỈ dấu trang trí (—, /, →)
        slate: { 100: v('chu-1'), 200: v('chu-2'), 300: v('chu-3'), 400: v('text-dim'), 500: v('text-faint'), 600: v('chu-mo'), 700: v('chu-mo-2') },
        white: v('phu'), // lớp phủ rê chuột (`bg-white/5`, `hover:text-white`): trắng ở tối, mực ở sáng
      },
      fontFamily: {
        sans: ['var(--font-sans)'], // 'Be Vietnam Pro' tự phục vụ + dự phòng: khai ở index.css
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      // D4 bổ sung (chủ SP 27/10: web phải dịu như mockup): mockup V5 không dùng 800 — `font-extrabold` cũ hiện ra 700.
      fontWeight: { extrabold: '700' },
      borderRadius: { xl: '0.75rem', '2xl': '1rem' },
    },
  },
  plugins: [],
};
