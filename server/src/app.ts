import crypto from 'node:crypto';
import express from 'express';
import cookieParser from 'cookie-parser';
import type { NextFunction, Request, Response } from 'express';
import { attachPrincipal } from './auth.ts';
import { api } from './routes/index.ts';
import { HttpError } from './util.ts';
import { taoSuKhoe } from './platform/suKhoe.ts';
import { HAN_HAM_NETLIFY_MS, LOG_CHAM_MS, chayVoiHan } from './platform/hanGio.ts';
import { chayTrongRequest, demHienTai } from './platform/nguCanhRequest.ts';
import { donGiaoDichTreo, laLoiMatLuongTurso, loiTrongGiaoDich, moLaiKetNoi } from './db.ts';
import { laBanChinh } from './moiTruong.ts';

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
  app.use(demGio);
  app.use(moNguCanhRequest);
  /* AN-4: đặt trước attachPrincipal — gọi health kèm cookie cũ cũng không tốn một lượt hỏi phiên. */
  app.get('/api/health', taoSuKhoe());

  /* Phần chạy lại được khi mất luồng Turso (PR-Z2c-b): kiểm phiên + mọi đường API. */
  const luong = express.Router();
  luong.use(attachPrincipal);
  luong.use('/api', api);
  luong.use('/api', (_req, res) => {
    res.status(404).json({ error: 'Không tìm thấy endpoint.' });
  });
  app.use(luong);

  app.use(thuLaiKhiMatLuong(luong));
  app.use(traLoiLoi);

  return app;
}

/**
 * ĐẾM GIỜ MỖI LỜI GỌI (AN-5). Đặt SAU express.json/cookieParser: ngữ cảnh AsyncLocalStorage không đi qua sự kiện luồng của bộ đọc
 * thân yêu cầu. Đường tải tệp (multer) có thể mất hạn — khi đó chỉ là không chặn (an toàn như trước PR này).
 *   · Dọn giao dịch treo của lần gọi trước.
 *   · Log `[cham]` mọi lời gọi ≥ LOG_CHAM_MS — PR-Z2c đọc để biết trang nào cần gộp truy vấn.
 *   · Bản chính: gắn hạn HAN_HAM_NETLIFY_MS cho cả lời gọi.
 */
export function demGio(req: Request, res: Response, next: NextFunction): void {
  const batDau = Date.now();
  if (donGiaoDichTreo()) console.error('[api] đã cuộn lại một giao dịch bỏ dở từ lần gọi trước');
  res.on('finish', () => {
    const ms = Date.now() - batDau;
    if (ms >= LOG_CHAM_MS) console.warn(`[cham] ${req.method} ${req.path} ${ms} ms`);
  });
  if (!laBanChinh()) { next(); return; }
  chayVoiHan(batDau + HAN_HAM_NETLIFY_MS, next);
}

/**
 * MỞ NGỮ CẢNH REQUEST (PR-TD) — bộ nhớ tra cứu lặp + bộ đếm câu SQL, đặt SAU `express.json`/`cookieParser` (cùng lý
 * do chú thích của `demGio`: ngữ cảnh `AsyncLocalStorage` không đi qua sự kiện luồng của bộ đọc thân yêu cầu).
 * `PISA_DEM_SQL=1` (không đặt ở bản chính, biến không có trong `netlify.toml`) in `[sql]` mỗi request khi xong —
 * PR-Z2c dùng để biết trang nào cần gộp truy vấn tiếp.
 */
function moNguCanhRequest(req: Request, res: Response, next: NextFunction): void {
  chayTrongRequest(req.method, () => {
    if (process.env.PISA_DEM_SQL === '1') {
      const dem = demHienTai();
      res.on('finish', () => console.log(`[sql] ${req.method} ${req.originalUrl} ${dem?.n ?? 0} câu`));
    }
    next();
  });
}

const DA_THU_LAI = Symbol('daThuLaiMatLuong');

/**
 * MẤT LUỒNG TURSO → THỬ LẠI MỘT LẦN (PR-Z2c-b). Lỗi `stream not found` nghĩa là kết nối Turso giữ ở cấp module đã chết (xem
 * db.ts). Chỉ chạy lại khi an toàn:
 *   · request GET (POST/PUT/DELETE có thể đã ghi — chạy lại là ghi hai lần), chưa thử lại lần nào, chưa gửi gì về;
 *   · lỗi KHÔNG ném ra từ trong tx() (giao dịch có thể đã ghi dở).
 * Khi đó: bỏ kết nối cũ, ghi log một dòng, chạy lại kiểm phiên + đường API trong một ngữ cảnh request mới (bộ nhớ tra cứu
 * trống). Lần hai vẫn lỗi → lỗi đi thẳng tới traLoiLoi như cũ (người dùng thấy "Có lỗi · mã …"). Lỗi khác không bị đụng tới.
 */
export function thuLaiKhiMatLuong(luong: (req: Request, res: Response, next: NextFunction) => void) {
  return (err: unknown, req: Request, res: Response, next: NextFunction): void => {
    const r = req as Request & { [DA_THU_LAI]?: true };
    if (req.method !== 'GET' || r[DA_THU_LAI] || res.headersSent || !laLoiMatLuongTurso(err) || loiTrongGiaoDich(err)) {
      next(err);
      return;
    }
    r[DA_THU_LAI] = true;
    moLaiKetNoi();
    console.warn(`[turso] mất luồng (stream not found) — đã mở lại kết nối, thử lại ${req.method} ${req.path} một lần`);
    chayTrongRequest(req.method, () => luong(req, res, next));
  };
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
