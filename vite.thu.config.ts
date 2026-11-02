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
  resolve: { alias: { '@shared': path.resolve(projectRoot, 'shared') } },
  server: {
    port: webPort,
    strictPort: false,
    proxy: { '/api': { target: `http://127.0.0.1:${apiPort}`, changeOrigin: true } },
  },
  build: { outDir: 'dist/thu', emptyOutDir: true, rollupOptions: { treeshake: { moduleSideEffects: (id) => !/[/]shared[/]/.test(id) } } },
});
