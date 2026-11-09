/**
 * HÀM ĐỊNH KỲ CỦA BẢN CHÍNH — đối chiếu sổ nghĩa vụ mỗi đêm, 5 lần 02:20 – 06:20 giờ VN (spec 2.3). Lịch ở `netlify.toml` (`[functions."doi-chieu-so"]`). Không có logic
 * nghiệp vụ ở đây: mọi thứ ở `server/src/ops/doiChieuSo.ts`. Kết quả in ra log (Netlify › Logs › Functions › doi-chieu-so).
 */
import { doiChieuSo } from '../../server/src/ops/doiChieuSo.ts';
import { db } from '../../server/src/db.ts';

/* File này CHỈ chạy trên Netlify — luôn là bản chính (cùng lý do `api.ts`). */
process.env.BAN_CHINH = '1';

export const handler = async () => {
  try {
    /* 5 lần mỗi đêm (19:20 – 23:20 UTC): bài của mọi chi nhánh mỗi lần (nhẹ), VIỆC của chi nhánh thứ (giờ UTC − 19) — một lượt Công việc mỗi lần. */
    const cns = (db().prepare('SELECT id FROM branches ORDER BY id').all() as any[]).map((r) => r.id as number);
    const luot = new Date().getUTCHours() - 19;
    const kq = doiChieuSo(undefined, luot >= 0 && luot < cns.length ? [cns[luot]] : []);
    console.log('[doi-chieu-so]', JSON.stringify(kq));
    return { statusCode: 200, body: JSON.stringify(kq) };
  } catch (e) {
    console.error('[doi-chieu-so] lỗi', e);
    return { statusCode: 500, body: JSON.stringify({ ok: false }) };
  }
};
