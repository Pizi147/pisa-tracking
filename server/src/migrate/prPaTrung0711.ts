/**
 * PA-TRUNG (chủ SP 07/11 14:01, plan.md mục 4) — ĐỔI DỮ LIỆU MỘT LẦN lúc deploy: MT sau trượt lại (MT3 → MT4…) đã sinh PA quy chế "đến lúc thi" thứ hai
 * "chờ xác nhận" cho Case đang có PA quy chế cùng loại "đến lúc thi" ĐANG CHẠY (gốc đã sửa ở `createPresetPlan`). PA thừa → Xoá PA hệ thống (`xoaPaTrongTx`,
 * cùng đường Xoá PA của người: Thùng rác 30 ngày — Khôi phục ở Quản trị › Đã xoá, nhật ký `intervention.delete` lý do "Dọn PA trùng") + một dòng
 * `sos_case_history` (`don_pa_trung`). Gồm cả cặp PA "đến lúc thi" cùng loại ĐỀU đã xác nhận (lỗi cũ, GV đã xác nhận cả hai — chủ SP 07/11
 * "Merge + dọn cả 4"): giữ PA bắt đầu sớm nhất. Khoá `demo_config` → chạy lặp không làm gì; DB mới ghi khoá sẵn (`duLieuNen`).
 */
import { nowIso } from '../util.ts';
import { demoToday } from '../demoConfig.ts';
import { loadCase, xoaPaTrongTx } from '../cases/cases.ts';
import { CHO_DOI_PA, UNCONFIRMED_PRESET } from '../cases/sosState.ts';

export const KHOA_PR_PA_TRUNG_0711 = 'pr_pa_trung_0711_da_chay';
export const LY_DO_PA_TRUNG = 'Dọn PA trùng';

/**
 * PA quy chế "đến lúc thi" TRÙNG — CHỈ ĐỌC. Case đã có PA quy chế cùng loại "đến lúc thi" đang chạy (`r`):
 *   · PA chờ xác nhận (chưa kết quả) → trùng;
 *   · PA đã xác nhận, đang chạy (chủ SP 07/11 "dọn cả 4") → trùng khi `r` bắt đầu sớm hơn (cùng ngày: id nhỏ hơn) — GIỮ PA cũ nhất, kết quả đã ghi theo PA sau
 *     vào Thùng rác cùng PA (khôi phục trả đủ).
 */
export function paTrung(conn: any): any[] {
  return conn.prepare(
    `SELECT d.* FROM case_interventions d
      WHERE d.preset = 1 AND d.moc_quy_che = 'until_exam' AND NOT ${CHO_DOI_PA('d')}
        AND ((${UNCONFIRMED_PRESET('d')} AND d.status = 'planned' AND NOT EXISTS (SELECT 1 FROM case_followups f WHERE f.intervention_id = d.id))
             OR (d.confirmed_at IS NOT NULL AND d.status = 'started'))
        AND EXISTS (SELECT 1 FROM case_interventions r WHERE r.case_id = d.case_id AND r.id != d.id AND r.preset = 1 AND r.kind = d.kind
                      AND r.moc_quy_che = 'until_exam' AND r.status = 'started'
                      AND (d.confirmed_at IS NULL OR COALESCE(r.started_date, '') < COALESCE(d.started_date, '')
                           OR (COALESCE(r.started_date, '') = COALESCE(d.started_date, '') AND r.id < d.id)))
      ORDER BY d.id`,
  ).all() as any[];
}

/** Dọn — không khoá (phép kiểm gọi thẳng). Trả id PA đã dọn. */
export function donPaTrung(conn: any): number[] {
  const ls = conn.prepare(`INSERT INTO sos_case_history (case_id, field, old_value, new_value, actor_user_id, created_at) VALUES (?, 'don_pa_trung', ?, ?, NULL, ?)`);
  return paTrung(conn).map((iv) => {
    const { thungRacId } = xoaPaTrongTx({ userId: null }, iv, loadCase(iv.case_id), LY_DO_PA_TRUNG);
    ls.run(iv.case_id, `PA #${iv.id} ${iv.description ?? iv.kind}`, `Thùng rác #${thungRacId}`, nowIso());
    return iv.id as number;
  });
}

export function migratePrPaTrung0711(conn: any, applied: string[]) {
  if (conn.prepare('SELECT 1 FROM demo_config WHERE key = ?').get(KHOA_PR_PA_TRUNG_0711)) return;
  const ds = donPaTrung(conn);
  conn.prepare('INSERT OR REPLACE INTO demo_config (key, value, updated_at) VALUES (?,?,?)').run(KHOA_PR_PA_TRUNG_0711, demoToday(), nowIso());
  if (ds.length) applied.push(`PA-TRUNG: ${ds.length} PA quy chế "đến lúc thi" trùng PA cùng loại đang chạy (chờ xác nhận + đã xác nhận, giữ PA cũ nhất) → Thùng rác (khôi phục được), id ${ds.join(', ')}.`);
}
