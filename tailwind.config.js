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
        ink: {
          950: '#080f16', 900: '#0b141d', 850: '#0f1a24', 800: '#13212d',
          750: '#182a38', 700: '#1e3444', 600: '#2a4557', 500: '#3d5b70',
        },
        teal: {
          300: '#5eead4', 400: '#2dd4bf', 500: '#14b8a6', 600: '#0d9488', 700: '#0f766e',
        },
        ok: nghia('ok'), bad: nghia('bad'), late: nghia('late'), soon: nghia('soon'),
        doing: nghia('doing'), done: nghia('done'), wait: nghia('wait'), muted: nghia('muted'),
        // N-1b: màu kết quả Test — cùng bảng với ok/soon/late/bad
        dat: nghia('dat'), sos1: nghia('sos1'), sos2: nghia('sos2'), sos3: nghia('sos3'),
        dim: v('text-dim'), faint: v('text-faint'),
        // Ghi đè: mọi chỗ còn gọi thẳng màu Tailwind (410 chỗ slate-500, hàng chục rose/amber/sky/emerald) đổi theo token.
        rose: { 200: v('bad'), 300: v('bad') }, amber: { 200: v('soon'), 300: v('soon') },
        sky: { 200: v('doing'), 300: v('doing') }, emerald: { 200: v('ok'), 300: v('ok') },
        slate: { 400: v('text-dim'), 500: v('text-faint') },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      borderRadius: { xl: '0.75rem', '2xl': '1rem' },
    },
  },
  plugins: [],
};
