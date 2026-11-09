/**
 * W-LECH (chủ SP 10/11 tối, `plan.md` mục 4 B' mục 1) — ĐỔI DỮ LIỆU MỘT LẦN: lượt Writing "lệch" sinh trước CV-SUA-1011 (#1273) — một task W có "-"
 * (không điểm), task kia trống (không "-", không điểm). Luật mới: "-" ở một W = cả buổi Writing vắng. W còn trống nhận "-", chốt cả buổi:
 *   · "-" chưa chốt ở ĐÚNG tuần đang xếp (Mock) → đi đúng đường GV gõ "-" vào ô trống (`saveScore`): dời / huỷ, hoặc cả hai Không dự thi nếu MT cũ.
 *   · còn lại (dấu đã chốt / Không dự thi, hoặc dấu ở tuần cũ khi lịch đã đổi / chưa xếp) → W trống chép ĐÚNG dấu đó, lịch giữ nguyên.
 * Mỗi ô một dòng nhật ký `score.no_show` (`theo: <ô gốc>`); GV gỡ bằng "Bỏ vắng" như mọi dấu "-". Khoá `demo_config` → chạy lặp không làm gì,
 * không bao giờ đụng dữ liệu sinh sau deploy (đã theo luật mới).
 */
import { demoToday } from '../demoConfig.ts';
import { nowIso } from '../util.ts';
import { loadPrincipal } from '../permissions.ts';
import { refreshOutcome, saveScore } from '../fasttrack/attempts.ts';
import { writeAudit } from '../platform/audit.ts';

export const KHOA_PR_W_LECH = 'pr_w_lech_da_chay';

const KIA_SQL = `CASE d.skill WHEN 'writing1' THEN 'writing2' ELSE 'writing1' END`;

/** Lượt lệch (chỉ đọc): ô "-" `co` + ô trống `trong`. */
export function luotWLech(conn: any): any[] {
  return conn.prepare(
    `SELECT a.id AS attempt_id, a.kind, k.planned_period_id, d.id AS score_id, d.skill AS co, ${KIA_SQL} AS trong,
            d.no_show_period_id, d.no_show_by, d.no_show_late, d.no_show_settled_at, d.no_show_cu
       FROM assessment_scores d
       JOIN assessment_attempts a ON a.id = d.attempt_id AND a.status != 'cancelled'
       JOIN attempt_skills k ON k.attempt_id = a.id AND k.skill = 'writing' AND k.required = 1
      WHERE d.skill IN ('writing1', 'writing2') AND d.no_show_period_id IS NOT NULL AND d.band IS NULL AND d.raw_score IS NULL
        AND COALESCE(k.bo_task, '') != ${KIA_SQL}
        AND NOT EXISTS (SELECT 1 FROM assessment_scores e WHERE e.attempt_id = a.id AND e.skill = ${KIA_SQL}
                          AND (e.no_show_period_id IS NOT NULL OR e.band IS NOT NULL OR e.raw_score IS NOT NULL))
      ORDER BY a.id`,
  ).all() as any[];
}

/** Dọn — không khoá (phép kiểm gọi thẳng). `chot`: đi đường gõ "-"; `chep`: chép dấu. Lần hai không còn lượt nào. */
export function donWLech(conn: any, today: string = demoToday()): { chot: number; chep: number } {
  const ds = luotWLech(conn);
  if (!ds.length) return { chot: 0, chep: 0 };
  /* Ghi bằng tên Quản trị hệ thống (quyền mọi lớp, như PR-MT-VANG-RESET); nhật ký ghi rõ là dọn dữ liệu. */
  const qt = (conn.prepare(`SELECT ur.user_id AS id FROM user_roles ur JOIN roles r ON r.id = ur.role_id
    WHERE r.key = 'system_admin' AND ur.status = 'active' ORDER BY ur.user_id LIMIT 1`).get() as any)?.id;
  const p = qt ? loadPrincipal(qt) : null;
  let chot = 0, chep = 0;
  for (const r of ds) {
    const theoLich = p && r.kind === 'mock' && r.planned_period_id === r.no_show_period_id && !r.no_show_settled_at && !r.no_show_cu;
    if (theoLich) {
      try { saveScore(p, r.attempt_id, r.trong, { noShow: true }, today); chot++; continue; } catch (e) {
        /* Chỉ lỗi nghiệp vụ (4xx: cần hỏi, chưa có tuần…) mới rơi về chép dấu; lỗi khác (mạng, DB) ném — bước migrate cuộn lại, chạy lại sau. */
        const st = (e as any)?.status;
        if (!(st >= 400 && st < 500)) throw e;
        console.warn(`[migrate] W-LECH: lượt ${r.attempt_id} không chốt được (${(e as any)?.message}) — chép dấu.`);
      }
    }
    conn.prepare(
      `INSERT INTO assessment_scores (attempt_id, skill, no_show_period_id, no_show_by, no_show_at, no_show_late, no_show_settled_at, no_show_cu)
       VALUES (?,?,?,?,?,?,?,?)
       ON CONFLICT (attempt_id, skill) DO UPDATE SET no_show_period_id = excluded.no_show_period_id, no_show_by = excluded.no_show_by,
         no_show_at = excluded.no_show_at, no_show_late = excluded.no_show_late, no_show_settled_at = excluded.no_show_settled_at, no_show_cu = excluded.no_show_cu`,
    ).run(r.attempt_id, r.trong, r.no_show_period_id, r.no_show_by, nowIso(), r.no_show_late, r.no_show_settled_at, r.no_show_cu);
    writeAudit({
      actorUserId: null, action: 'score.no_show', entityType: 'assessment_attempt', entityId: r.attempt_id, entityLabel: r.trong,
      before: null, after: { noShow: true, khongDuThi: !!r.no_show_cu, theo: r.co, lyDo: 'Dọn W lệch (W-LECH)' },
    });
    if (p) refreshOutcome(p, r.attempt_id);
    chep++;
  }
  return { chot, chep };
}

export function migratePrWLech(conn: any, applied: string[]) {
  if (conn.prepare('SELECT 1 FROM demo_config WHERE key = ?').get(KHOA_PR_W_LECH)) return;
  const { chot, chep } = donWLech(conn);
  conn.prepare('INSERT OR REPLACE INTO demo_config (key, value, updated_at) VALUES (?,?,?)').run(KHOA_PR_W_LECH, nowIso(), nowIso());
  if (chot + chep) applied.push(`W-LECH (chủ SP 10/11): ${chot + chep} lượt Writing lệch — W trống nhận "-" (${chot} chốt theo luật vắng, ${chep} chép dấu).`);
}
