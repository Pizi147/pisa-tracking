/**
 * K3-16 (chủ SP 11/11) — ĐỔI DỮ LIỆU MỘT LẦN lúc deploy: trước #1303, MT sau trượt lại thêm PA quy chế mới nhưng PA cũ "đến MTn" / "1 tháng" ĐANG CHẠY vẫn
 * chờ mốc dự kiến → Case chạy cùng lúc hai PA quy chế. PA cũ sang "Kết quả cuối" như đường sống `paHetMocTruotLai`: `followup_due` = ngày PA mới ra đời
 * (không muộn hơn hôm nay / mốc cũ), loại mốc giữ. "Đến lúc thi" không đụng (PA-TRUNG). Nhật ký `sos_case_history` `pa_het_moc_k316` giữ mốc cũ →
 * `khoiPhucK316` trả lại. Khoá `demo_config` → chạy lặp không làm gì.
 */
import { nowIso } from '../util.ts';
import { demoToday } from '../demoConfig.ts';
import { CHO_DOI_PA } from '../cases/sosState.ts';

export const KHOA_PR_K316 = 'pr_k316_da_chay';
const TRUONG = 'pa_het_moc_k316';

/** PA cũ cần đổi — CHỈ ĐỌC: `moc` = ngày PA quy chế mới (chờ xác nhận / đang chạy) đầu tiên ra đời sau nó, không muộn hơn hôm nay. */
export function paCuK316(conn: any): { id: number; case_id: number; followup_due: string | null; moc: string }[] {
  const hom = demoToday();
  return (conn.prepare(
    `SELECT o.id, o.case_id, o.followup_due,
            (SELECT MIN(substr(n.created_at, 1, 10)) FROM case_interventions n WHERE n.case_id = o.case_id AND n.id > o.id AND n.preset = 1
               AND n.kind != 'bo_tro' AND n.status IN ('planned', 'started')) AS moi
       FROM case_interventions o JOIN sos_cases sc ON sc.id = o.case_id
      WHERE o.preset = 1 AND o.status = 'started' AND o.confirmed_at IS NOT NULL AND o.moc_quy_che IN ('one_month', 'until_next_mt')
        AND NOT ${CHO_DOI_PA('o')} AND sc.status != 'done'
      ORDER BY o.id`,
  ).all() as any[])
    .filter((r) => r.moi != null)
    .map((r) => ({ id: r.id, case_id: r.case_id, followup_due: r.followup_due, moc: r.moi < hom ? r.moi : hom }))
    .filter((r) => r.followup_due == null || r.followup_due > r.moc);
}

/** Đổi — không khoá (phép kiểm gọi thẳng). Trả id PA đã đổi. */
export function doiK316(conn: any): number[] {
  const up = conn.prepare('UPDATE case_interventions SET followup_due = ?, updated_at = ? WHERE id = ?');
  const ls = conn.prepare(`INSERT INTO sos_case_history (case_id, field, old_value, new_value, actor_user_id, created_at) VALUES (?, '${TRUONG}', ?, ?, NULL, ?)`);
  return paCuK316(conn).map((r) => {
    up.run(r.moc, nowIso(), r.id);
    ls.run(r.case_id, JSON.stringify({ pa: r.id, cu: r.followup_due }), r.moc, nowIso());
    return r.id;
  });
}

/** Khôi phục: mỗi PA về mốc cũ theo nhật ký (chỉ `followup_due`), dòng nhật ký đổi thành `…_khoi_phuc` để không trả hai lần. Trả id PA đã trả. */
export function khoiPhucK316(conn: any): number[] {
  const ra: number[] = [];
  for (const h of conn.prepare(`SELECT id, old_value FROM sos_case_history WHERE field = '${TRUONG}' ORDER BY id DESC`).all() as any[]) {
    const { pa, cu } = JSON.parse(h.old_value);
    conn.prepare('UPDATE case_interventions SET followup_due = ?, updated_at = ? WHERE id = ?').run(cu, nowIso(), pa);
    conn.prepare(`UPDATE sos_case_history SET field = '${TRUONG}_khoi_phuc' WHERE id = ?`).run(h.id);
    ra.push(pa);
  }
  return ra;
}

export function migratePrK316(conn: any, applied: string[]) {
  if (conn.prepare('SELECT 1 FROM demo_config WHERE key = ?').get(KHOA_PR_K316)) return;
  const ds = doiK316(conn);
  conn.prepare('INSERT OR REPLACE INTO demo_config (key, value, updated_at) VALUES (?,?,?)').run(KHOA_PR_K316, demoToday(), nowIso());
  if (ds.length) applied.push(`K3-16: ${ds.length} PA quy chế cũ "đến MTn" / "1 tháng" đang chạy cạnh PA mới → Kết quả cuối (khôi phục: khoiPhucK316), id ${ds.join(', ')}.`);
}
