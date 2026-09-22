import crypto from 'node:crypto';
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

  app.use(traLoiLoi);

  return app;
}

/**
 * BỘ XỬ LÝ LỖI CUỐI (AN-3, PR-AN). Người dùng KHÔNG BAO GIỜ thấy câu SQL, tên bảng hay thông điệp nội bộ:
 *   · HttpError       — câu có chủ đích của nghiệp vụ, trả nguyên như cũ.
 *   · thân JSON hỏng  — 400 / quá lớn 413, câu tiếng Việt.
 *   · vi phạm ràng buộc — 409 câu chung; chi tiết vào log.
 *   · còn lại         — 500 "Có lỗi · mã {mã}" (THUAT_NGU g14-054). Cùng mã in vào log kèm lỗi gốc: người dùng báo mã, người sửa
 *                       tìm đúng dòng (Netlify › Logs › Functions › api). Log KHÔNG in thân yêu cầu (có mật khẩu).
 * Máy dev cũng vậy — lỗi gốc đọc ở cửa sổ lệnh đang chạy `npm run dev`.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function traLoiLoi(err: unknown, req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof HttpError) {
    res.status(err.status).json({ error: err.message, details: err.details ?? undefined });
    return;
  }
  const e = (err ?? {}) as { type?: unknown; code?: unknown };
  if (e.type === 'entity.parse.failed') {
    res.status(400).json({ error: 'Dữ liệu gửi lên không đọc được. Tải lại trang rồi thử lại.' });
    return;
  }
  if (e.type === 'entity.too.large') {
    res.status(413).json({ error: 'Dữ liệu gửi lên quá lớn.' });
    return;
  }
  const message = err instanceof Error ? err.message : String(err);
  if (/SQLITE_CONSTRAINT|constraint failed/i.test(message) || (typeof e.code === 'string' && e.code.startsWith('SQLITE_CONSTRAINT'))) {
    console.warn('[api] 409', req.method, req.path, message);
    res.status(409).json({ error: 'Dữ liệu bị trùng hoặc vi phạm ràng buộc.' });
    return;
  }
  const ma = crypto.randomBytes(4).toString('hex');
  console.error(`[api] mã ${ma}`, req.method, req.path, err);
  res.status(500).json({
    error: `Có lỗi · mã ${ma}. Thử lại sau ít phút; nếu vẫn lỗi, báo Quản trị hệ thống kèm mã này.`,
    details: { ma },
  });
}
