/**
 * PA-TRUNG (chủ SP 07/11 14:01, plan.md mục 4) — ĐỔI DỮ LIỆU MỘT LẦN lúc deploy: MT sau trượt lại (MT3 → MT4…) đã sinh PA quy chế "đến lúc thi" thứ hai
 * "chờ xác nhận" cho Case đang có PA quy chế cùng loại "đến lúc thi" ĐANG CHẠY (gốc đã sửa ở `createPresetPlan`). PA thừa → Xoá PA hệ thống (`xoaPaTrongTx`,
 * cùng đường Xoá PA của người: Thùng rác 30 ngày — Khôi phục ở Quản trị › Đã xoá, nhật ký `intervention.delete` lý do "Dọn PA trùng") + một dòng
 * `sos_case_history` (`don_pa_trung`). Chỉ PA chưa xác nhận, chưa có kết quả. Khoá `demo_config` → chạy lặp không làm gì; DB mới ghi khoá sẵn (`duLieuNen`).
 */
import { nowIso } from '../util.ts';
import { demoToday } from '../demoConfig.ts';
import { loadCase, xoaPaTrongTx } from '../cases/cases.ts';
import { CHO_DOI_PA, UNCONFIRMED_PRESET } from '../cases/sosState.ts';

export const KHOA_PR_PA_TRUNG_0711 = 'pr_pa_trung_0711_da_chay';
export const LY_DO_PA_TRUNG = 'Dọn PA trùng';

/** PA quy chế "đến lúc thi" chờ xác nhận (chưa kết quả) của Case đã có PA quy chế cùng loại "đến lúc thi" đang chạy — CHỈ ĐỌC. */
export function paTrung(conn: any): any[] {
  return conn.prepare(
    `SELECT d.* FROM case_interventions d
      WHERE ${UNCONFIRMED_PRESET('d')} AND d.status = 'planned' AND d.moc_quy_che = 'until_exam' AND NOT ${CHO_DOI_PA('d')}
        AND NOT EXISTS (SELECT 1 FROM case_followups f WHERE f.intervention_id = d.id)
        AND EXISTS (SELECT 1 FROM case_interventions r WHERE r.case_id = d.case_id AND r.id != d.id AND r.preset = 1 AND r.kind = d.kind
                      AND r.moc_quy_che = 'until_exam' AND r.status = 'started')
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
  if (ds.length) applied.push(`PA-TRUNG: ${ds.length} PA quy chế "đến lúc thi" chờ xác nhận trùng PA đang chạy → Thùng rác (khôi phục được), id ${ds.join(', ')}.`);
}
