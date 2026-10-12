/**
 * HÀM ĐỊNH KỲ CỦA BẢN CHÍNH — quét sáng thứ Hai (RB-1: chuyển lớp tới hạn, chuông chấm chéo). Lịch ở `netlify.toml` (`[functions."chot-vang"]`). Không có logic
 * nghiệp vụ ở đây: mọi thứ ở `server/src/ops/chotVangDinhKy.ts`. Kết quả in ra log (Netlify › Logs › Functions › chot-vang).
 */
import { chotVangDinhKy } from '../../server/src/ops/chotVangDinhKy.ts';

/* File này CHỈ chạy trên Netlify — luôn là bản chính (cùng lý do `api.ts`). */
process.env.BAN_CHINH = '1';

export const handler = async () => {
  try {
    const kq = chotVangDinhKy();
    console.log('[chot-vang]', JSON.stringify(kq));
    return { statusCode: 200, body: JSON.stringify(kq) };
  } catch (e) {
    console.error('[chot-vang] lỗi', e);
    return { statusCode: 500, body: JSON.stringify({ ok: false }) };
  }
};
