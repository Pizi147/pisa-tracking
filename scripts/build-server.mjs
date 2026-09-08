/**
 * Biên dịch mã máy chủ TypeScript thành JavaScript thuần trong dist-server/.
 *
 * Lý do không chạy thẳng TypeScript bằng tsx: tsx nạp mã trong một isolate riêng,
 * còn better-sqlite3 là native addon đăng ký cleanup hook theo environment. Khi tiến
 * trình kết thúc, Node huỷ isolate và bung assertion "(env) != nullptr" rồi crash —
 * lỗi này xuất hiện trên Windows và rất khó hiểu với người dùng không rành kỹ thuật.
 * Chạy bằng node thuần thì không còn lớp isolate trung gian đó.
 */
import { build } from 'esbuild';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export const buildOptions = {
  entryPoints: [
    path.join(ROOT, 'server/src/index.ts'),
    path.join(ROOT, 'server/src/seed/run.ts'),
    path.join(ROOT, 'server/src/tests/run.ts'),
  ],
  outbase: path.join(ROOT, 'server/src'),
  outdir: path.join(ROOT, 'dist-server'),
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node20',
  packages: 'external',      // giữ nguyên các gói trong node_modules, gồm cả native addon
  sourcemap: true,
  logLevel: 'warning',
};

if (import.meta.url === `file://${process.argv[1]}`) {
  await build(buildOptions);
}
