import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Neo theo vị trí của chính tệp cấu hình, không theo thư mục đang đứng khi chạy lệnh:
// nếu neo theo cwd, chạy lệnh từ thư mục khác sẽ làm hỏng alias và Vite báo lỗi khó hiểu.
const projectRoot = path.dirname(fileURLToPath(import.meta.url));
// Cổng máy dev: PORT = cổng API (cùng biến server/src/index.ts đọc), WEB_PORT = cổng giao diện. Trùng cổng thì đặt hai biến này.
const apiPort = Number(process.env.PORT ?? 4000);
const webPort = Number(process.env.WEB_PORT ?? 5173);

export default defineConfig({
  plugins: [react()],
  root: projectRoot,
  resolve: {
    alias: [
      /* TAI-NHANH: `shared/i18n/index.ts` lấy từ điển qua './tuDien.ts' — web thay bằng bản tải khi trang tiếng Anh. */
      { find: /^\.\/tuDien\.ts$/, replacement: path.resolve(projectRoot, 'web/src/lib/tuDienWeb.ts') },
      { find: '@shared', replacement: path.resolve(projectRoot, 'shared') },
    ],
  },
  server: {
    port: webPort,
    strictPort: false,
    proxy: { '/api': { target: `http://127.0.0.1:${apiPort}`, changeOrigin: true } },
  },
  /* `await` cấp cao (tuDienWeb.ts) cần ES2022: Chrome / Edge 89, Firefox 89, Safari 15 trở lên. */
  build: { outDir: 'dist/web', emptyOutDir: true, target: ['es2022', 'chrome89', 'edge89', 'firefox89', 'safari15'],
    /* Phông số Inter đã cắt (~2,7 KB) dưới ngưỡng nhúng 4 KB: giữ tệp riêng để trình duyệt chỉ tải weight đang hiện (unicode-range), không nhúng cả 5 vào CSS. */
    assetsInlineLimit: (tep) => (tep.endsWith('.woff2') ? false : undefined) },
});
