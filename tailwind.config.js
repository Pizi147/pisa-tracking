/**
 * Màu nghĩa đọc từ `web/src/index.css :root` (một chỗ khai báo) qua bộ ba RGB → dùng được độ trong (`bg-bad/15`).
 * `text-ok` · `bg-ok-bg` · `border-ok-line`; `late` không nền riêng ở chỗ dùng chữ, nhưng vẫn có `bg-late-bg`.
 */
const v = (n) => `rgb(var(--${n}-rgb) / <alpha-value>)`;
const nghia = (n) => ({ DEFAULT: v(n), bg: v(`${n}-bg`), line: v(`${n}-line`) });

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './web/src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ok: nghia('ok'), bad: nghia('bad'), late: nghia('late'), soon: nghia('soon'),
        doing: nghia('doing'), done: nghia('done'), muted: nghia('muted'),
        dat: nghia('dat'),
        // OV-15a: SOS chỉ viền (`border-sos1`) + chữ (`text-sos1-chu`), không nền; nền hàng đã thi `bg-da-thi`.
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
      borderRadius: { xl: '0.75rem', '2xl': '1rem' },
    },
  },
  plugins: [],
};
