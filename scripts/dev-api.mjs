/** Chạy máy chủ dữ liệu ở chế độ phát triển: biên dịch lại và khởi động lại khi mã đổi. */
import { context } from 'esbuild';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildOptions } from './build-server.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ENTRY = path.join(ROOT, 'dist-server', 'index.js');

let child = null;
const startServer = () => {
  if (child) child.kill();
  child = spawn(process.execPath, [ENTRY], { stdio: 'inherit', cwd: ROOT });
};

const ctx = await context({
  ...buildOptions,
  plugins: [
    {
      name: 'restart-server',
      setup(b) {
        b.onEnd((result) => {
          if (result.errors.length) return;
          startServer();
        });
      },
    },
  ],
});

await ctx.watch();

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    if (child) child.kill();
    void ctx.dispose().then(() => process.exit(0));
  });
}
