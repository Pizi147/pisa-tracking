/**
 * HÀM ĐỊNH KỲ CỦA BẢN CHÍNH — đối chiếu sổ nghĩa vụ mỗi đêm, 5 lần 02:20 – 06:20 giờ VN (spec 2.3). Lịch ở `netlify.toml` (`[functions."doi-chieu-so"]`). Không có logic
 * nghiệp vụ ở đây: mọi thứ ở `server/src/ops/doiChieuSo.ts`. Kết quả in ra log (Netlify › Logs › Functions › doi-chieu-so).
 */
import { cnCuaLuot, doiChieuSo } from '../../server/src/ops/doiChieuSo.ts';
import { db } from '../../server/src/db.ts';

/* File này CHỈ chạy trên Netlify — luôn là bản chính (cùng lý do `api.ts`). */
process.env.BAN_CHINH = '1';

export const handler = async () => {
  try {
    /* 5 lần mỗi đêm (19:20 – 23:20 UTC): bài + việc của chi nhánh thứ (giờ UTC − 19), lượt cuối mọi chi nhánh còn lại (`cnCuaLuot`); việc Vận hành lặp lại: lượt đầu. */
    const cns = (db().prepare('SELECT id FROM branches ORDER BY id').all() as any[]).map((r) => r.id as number);
    const luot = new Date().getUTCHours() - 19;
    const kq = doiChieuSo(undefined, cnCuaLuot(cns, luot), luot === 0);   // VH-1: việc lặp lại chỉ lượt đầu
    console.log('[doi-chieu-so]', JSON.stringify(kq));
    return { statusCode: 200, body: JSON.stringify(kq) };
  } catch (e) {
    console.error('[doi-chieu-so] lỗi', e);
    return { statusCode: 500, body: JSON.stringify({ ok: false }) };
  }
};
