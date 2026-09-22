import type { Request, Response } from 'express';
import { isInitialised } from '../db.ts';

/**
 * /api/health (AN-4, PR-AN). Công khai vì màn đăng nhập bản chính cần biết máy chủ còn sống (AN-7). Hai thứ phải đúng:
 *   · RẺ: hỏi database một lần rồi nhớ trong đời bản hàm. Đã khởi tạo thì không bao giờ hỏi lại; chưa khởi tạo thì hỏi lại
 *     tối đa HOI_LAI_SAU_MS một lần — ai gọi dồn dập cũng không tốn thêm lượt đọc Turso.
 *   · KHÔNG LỘ GÌ: chỉ `{ ok, seeded }`. Database lỗi → 503 `{ ok: false, seeded: false }`, lỗi gốc chỉ vào log.
 */
export const HOI_LAI_SAU_MS = 30_000;

export function taoSuKhoe(hoi: () => boolean = isInitialised, bayGio: () => number = Date.now) {
  let daKhoiTao = false;
  let lanHoi = Number.NEGATIVE_INFINITY;
  return (_req: Request, res: Response) => {
    res.set('Cache-Control', 'no-store');
    try {
      if (!daKhoiTao && bayGio() - lanHoi >= HOI_LAI_SAU_MS) {
        lanHoi = bayGio();
        daKhoiTao = hoi();
      }
      res.json({ ok: true, seeded: daKhoiTao });
    } catch (e) {
      lanHoi = Number.NEGATIVE_INFINITY;   // lần sau hỏi lại ngay
      console.error('[health]', e);
      res.status(503).json({ ok: false, seeded: false });
    }
  };
}
