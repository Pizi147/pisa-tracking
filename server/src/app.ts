import express from 'express';
import cookieParser from 'cookie-parser';
import type { NextFunction, Request, Response } from 'express';
import { isInitialised } from './db.ts';
import { attachPrincipal } from './auth.ts';
import { api } from './routes/index.ts';
import { HttpError } from './util.ts';

/**
 * ỨNG DỤNG EXPRESS — tách khỏi `index.ts` (chỗ gọi `listen`) để phép kiểm dựng được ĐÚNG ứng dụng đang chạy trên một cổng tạm và
 * gọi thẳng đường API bằng HTTP thật (PR-J). Trước đó repo không có phép kiểm HTTP nào; với luật "kiểm ở máy chủ, không chỉ ẩn
 * nút" (chuỗi Thư cảnh cáo, GVBM không tạo được biện pháp), một phép kiểm chỉ gọi hàm dịch vụ thì chưa chứng minh được đường
 * HTTP thật cũng từ chối.
 */
export function createApp() {
  const app = express();

  /* Trên Netlify, lời gọi /api/x được chuyển tới /.netlify/functions/api/x. Đưa về /api/x để mọi route giữ nguyên. */
  app.use((req, _res, next) => {
    const tienTo = '/.netlify/functions/api';
    if (req.url.startsWith(tienTo)) req.url = '/api' + req.url.slice(tienTo.length);
    next();
  });

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
    const code = (err as { code?: unknown })?.code;
    if (/SQLITE_CONSTRAINT|constraint failed/i.test(message) || (typeof code === 'string' && code.startsWith('SQLITE_CONSTRAINT'))) {
      res.status(409).json({ error: 'Dữ liệu bị trùng hoặc vi phạm ràng buộc.', details: { raw: message } });
      return;
    }
    console.error('[api]', err);
    res.status(500).json({ error: 'Lỗi hệ thống: ' + message });
  });

  return app;
}
