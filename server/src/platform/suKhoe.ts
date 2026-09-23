import type { Request, Response } from 'express';
import { isInitialised } from '../db.ts';

/**
 * /api/health (AN-4, PR-AN). Công khai vì màn đăng nhập bản chính cần biết máy chủ còn sống (AN-7). Hai thứ phải đúng:
 *   · RẺ: hỏi database một lần rồi nhớ trong đời bản hàm. Đã khởi tạo thì không bao giờ hỏi lại; chưa khởi tạo thì hỏi lại
 *     tối đa HOI_LAI_SAU_MS một lần — ai gọi dồn dập cũng không tốn thêm lượt đọc Turso.
 *   · KHÔNG LỘ GÌ: chỉ `{ ok, seeded }`. Database lỗi → 503 `{ ok: false, seeded: false }`, lỗi gốc chỉ vào log.
 *   · Database LỖI cũng giữ nhịp HOI_LAI_SAU_MS (PR-Z2c): trong khoảng đó trả lại 503 đã nhớ, không hỏi lại mỗi lần gọi.
 */
export const HOI_LAI_SAU_MS = 30_000;

export function taoSuKhoe(hoi: () => boolean = isInitialised, bayGio: () => number = Date.now) {
  let daKhoiTao = false;
  let loi = false;
  let lanHoi = Number.NEGATIVE_INFINITY;
  return (_req: Request, res: Response) => {
    res.set('Cache-Control', 'no-store');
    if (!daKhoiTao && bayGio() - lanHoi >= HOI_LAI_SAU_MS) {
      lanHoi = bayGio();
      try {
        daKhoiTao = hoi();
        loi = false;
      } catch (e) {
        loi = true;
        console.error('[health]', e);
      }
    }
    if (loi) {
      res.status(503).json({ ok: false, seeded: false });
      return;
    }
    res.json({ ok: true, seeded: daKhoiTao });
  };
}
