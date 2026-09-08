import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Neo theo vị trí của chính tệp cấu hình, không theo thư mục đang đứng khi chạy lệnh:
// nếu neo theo cwd, chạy lệnh từ thư mục khác sẽ làm hỏng alias và Vite báo lỗi khó hiểu.
const projectRoot = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  root: projectRoot,
  resolve: { alias: { '@shared': path.resolve(projectRoot, 'shared') } },
  server: {
    port: 5173,
    strictPort: false,
    proxy: { '/api': { target: 'http://127.0.0.1:4000', changeOrigin: true } },
  },
  build: { outDir: 'dist/web', emptyOutDir: true },
});
