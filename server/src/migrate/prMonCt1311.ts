/**
 * MON-CT-1311 (chủ SP 13/11, thay N18 phần "Checkpoint tách R · W · L · S") — KET, PET mặc định HAI môn L+S, R+W; Quản trị đổi môn mọi chương trình lớp thường.
 *   1. Thêm `assessment_attempts.bo_mon` (bộ môn lượt đã ghi giữ khi đổi môn — `boMonTheoLuot`). Chạy lặp không làm gì; khớp `schema.sql`.
 *   2. MỘT lần (khoá `demo_config` `pr_mon_ct_1311_at`): KET / PET còn đúng bộ 4 môn của P13 (L · R · W · S) → L+S, R+W qua CHÍNH đường Quản trị đổi môn
 *      (`apDoiMon`: lượt chưa ghi đổi, lượt đã ghi giữ bộ cũ, phân công gộp khi các môn thành phần cùng một GV). Quản trị đã sửa khác → không đụng.
 *      Nhật ký nguồn "migrate prMonCt1311".
 */
import { tx } from '../db.ts';
import { voiNguon, writeAudit } from '../platform/audit.ts';
import { apDoiMon } from '../platform/doiMonCt.ts';
import { demoToday } from '../demoConfig.ts';
import { nowIso } from '../util.ts';
import { CHUONG_TRINH_LIEN_TUC_CO_SAN } from '../../../shared/domain/index.ts';

export const KHOA_PR_MON_CT_1311 = 'pr_mon_ct_1311_at';
export const NGUON_PR_MON_CT_1311 = 'migrate prMonCt1311';
const BON = ['listening', 'reading', 'writing', 'speaking'];

/** Bước 1 — TRƯỚC mọi bước đọc bộ môn của lượt. */
export function themCotPrMonCt1311(conn: any, applied: string[]) {
  const cot = new Set((conn.prepare(`SELECT name FROM pragma_table_info('assessment_attempts')`).all() as any[]).map((c) => c.name as string));
  if (!cot.size || cot.has('bo_mon')) return;
  conn.exec('ALTER TABLE assessment_attempts ADD COLUMN bo_mon TEXT');
  applied.push('MON-CT-1311: thêm assessment_attempts.bo_mon (lượt đã ghi giữ bộ môn khi Quản trị đổi môn chương trình). Dữ liệu cũ giữ nguyên.');
}

/** Bước 2 — cuối migrate (cần bảng lịch, phân công, sổ nghĩa vụ đã đủ). */
export function migratePrMonCt1311(conn: any, applied: string[]) {
  if (!conn.prepare(`SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'ket_qua_huy'`).get()) return;
  if (conn.prepare('SELECT 1 FROM demo_config WHERE key = ?').get(KHOA_PR_MON_CT_1311)) return;
  tx(() => {
    for (const c of CHUONG_TRINH_LIEN_TUC_CO_SAN) {
      const cu = (conn.prepare('SELECT skill FROM programme_skills WHERE programme_code = ? ORDER BY seq, skill').all(c.code) as any[]).map((r) => r.skill as string);
      if (cu.length !== BON.length || BON.some((k) => !cu.includes(k))) continue;
      const kq = voiNguon(NGUON_PR_MON_CT_1311, () => {
        const r = apDoiMon(conn, { userId: null } as any, c.code, c.skills, demoToday());
        writeAudit({ actorUserId: null, action: 'programme_updated', entityType: 'programmes', entityLabel: c.code, before: { mon: cu }, after: { mon: c.skills } });
        return r;
      });
      if (kq) applied.push(`MON-CT-1311: ${c.code} — môn L · R · W · S → L+S, R+W; ${kq.lopDangChay} lớp đang học · ${kq.luotDoi} bài Test chưa ghi đổi môn · ${kq.luotGiu} bài đã ghi giữ bộ cũ · ${kq.lopChonLaiGv} lớp cần chọn lại GV.`);
    }
    conn.prepare('INSERT INTO demo_config (key, value, updated_at) VALUES (?,?,?)').run(KHOA_PR_MON_CT_1311, nowIso(), nowIso());
  });
}
