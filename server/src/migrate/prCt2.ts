/**
 * PR-CT2 (§8) phần A: Kết quả cũ của PA Tutor kỳ vọng đầu ra (PA có Số buổi) chưa ghi Số buổi tuần này → 1 buổi, để đếm "đã dạy" khớp.
 * Chạy ĐÚNG MỘT LẦN nhờ khoá `demo_config` (khuôn `prQu.ts`): `case_followups` còn đường khác chèn dòng không `so_buoi`, chạy lại sẽ đếm oan.
 * Không đụng Bổ trợ miễn phí. Deploy: chạy SAU `migratePrPa` (điền Số buổi 10 cho PA) — thứ tự trong `migrate.ts` đảm bảo.
 */
import { nowIso } from '../util.ts';

export const KHOA_PR_CT2_DIEN_BUOI = 'pr_ct2_dien_buoi';

export function migratePrCt2(conn: any, applied: string[]) {
  if (!conn.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name = 'demo_config'").get()) return;
  if (conn.prepare('SELECT 1 FROM demo_config WHERE key = ?').get(KHOA_PR_CT2_DIEN_BUOI)) return;
  const n = conn.prepare(
    `UPDATE case_followups SET so_buoi = 1
      WHERE so_buoi IS NULL AND intervention_id IN (SELECT id FROM case_interventions WHERE kind = 'tutor' AND so_buoi IS NOT NULL
        AND case_id IN (SELECT id FROM sos_cases WHERE origin_kind = 'chuyen_cap' AND title LIKE 'Kỳ vọng đầu ra%'))`,
  ).run().changes;
  conn.prepare('INSERT INTO demo_config (key, value, updated_at) VALUES (?,?,?)').run(KHOA_PR_CT2_DIEN_BUOI, nowIso(), nowIso());
  if (n) applied.push(`PR-CT2: điền Số buổi tuần này = 1 cho ${n} Kết quả cũ của PA Tutor kỳ vọng đầu ra. Một lần.`);
}
