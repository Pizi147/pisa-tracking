import express from 'express';
import cookieParser from 'cookie-parser';
import type { NextFunction, Request, Response } from 'express';
import { db, isInitialised } from './db.ts';
import { attachPrincipal } from './auth.ts';
import { api } from './routes/index.ts';
import { HttpError } from './util.ts';

const PORT = Number(process.env.PORT ?? 4000);
const app = express();

app.use(express.json({ limit: '12mb' }));
app.use(cookieParser());
app.use(attachPrincipal);

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, seeded: isInitialised() });
});

app.use('/api', api);

app.use('/api', (_req, res) => {
  res.status(404).json({ error: 'Không tìm thấy endpoint.' });
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof HttpError) {
    res.status(err.status).json({ error: err.message, details: err.details ?? undefined });
    return;
  }
  const message = err instanceof Error ? err.message : 'Lỗi không xác định';
  if (/SQLITE_CONSTRAINT/i.test(message)) {
    res.status(409).json({ error: 'Dữ liệu bị trùng hoặc vi phạm ràng buộc.', details: { raw: message } });
    return;
  }
  console.error('[api]', err);
  res.status(500).json({ error: 'Lỗi hệ thống: ' + message });
});

if (!isInitialised()) {
  console.warn('\n⚠️  Chưa có dữ liệu. Chạy:  npm run seed\n');
} else {
  db();
}

app.listen(PORT, () => {
  console.log(`[api] PISA Progress demo API đang chạy tại http://localhost:${PORT}`);
});
