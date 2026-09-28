/**
 * PR-DUYET (T78, K5 §5, K5-67, NEN Q12): bảng `yeu_cau_duyet` (hộp Chờ duyệt) + 3 chỉ mục · cột `tasks.assignee_name` (Vận hành tên
 * ngoài) · `notifications.duong` (Nhắc trỏ đúng dòng) · chép yêu cầu ĐANG CHỜ của hai luồng cũ thành thẻ `cho`.
 * Hai quyền mới (`request.approve`, `cycle.edit`) do `migratePermissions` có sẵn tự thêm. Chạy lại không nhân đôi: chỉ mục một phần
 * `ux_ycd_dang_cho` + `INSERT … ON CONFLICT DO NOTHING`.
 */
import { tx } from '../db.ts';
import { demoToday } from '../demoConfig.ts';
import { LOAI_YC_META } from '../../../shared/domain/index.ts';

export const SQL_BANG_YEU_CAU = `
CREATE TABLE IF NOT EXISTS yeu_cau_duyet (
  id INTEGER PRIMARY KEY,
  loai TEXT NOT NULL, phan_loai TEXT NOT NULL,
  doi_tuong_loai TEXT NOT NULL, doi_tuong_id INTEGER NOT NULL,
  hoc_vien_id INTEGER REFERENCES students(id), lop_id INTEGER REFERENCES classes(id), chi_nhanh_id INTEGER REFERENCES branches(id),
  nguoi_xin INTEGER REFERENCES users(id),
  ly_do TEXT, bang_chung TEXT, du_lieu TEXT,
  han_duyet TEXT, trang_thai TEXT NOT NULL DEFAULT 'cho',
  nguoi_duyet INTEGER REFERENCES users(id), ly_do_tu_choi TEXT, tra_loi TEXT, ly_do_dong TEXT,
  tu_duyet INTEGER NOT NULL DEFAULT 0, tao_luc TEXT NOT NULL, xu_ly_luc TEXT
);
CREATE INDEX IF NOT EXISTS ix_ycd_trang_thai ON yeu_cau_duyet (trang_thai, phan_loai);
CREATE INDEX IF NOT EXISTS ix_ycd_doi_tuong ON yeu_cau_duyet (doi_tuong_loai, doi_tuong_id);
CREATE UNIQUE INDEX IF NOT EXISTS ux_ycd_dang_cho ON yeu_cau_duyet (loai, doi_tuong_loai, doi_tuong_id) WHERE trang_thai = 'cho';
-- quét quá hạn tra "đã báo chưa" theo dedup_key (không theo người nhận)
CREATE INDEX IF NOT EXISTS ix_notifications_dedup ON notifications (dedup_key);
`;

/* PA đang chờ QL của Case còn mở — cùng điều kiện nhóm việc `decide` cũ (mywork.ts, trước PR-DUYET). */
const PA_CHO = `iv.approval_state = 'pending' AND iv.status != 'cancelled' AND sc.status != 'done'`;
/* Lần ghi kết quả "Xin hỗ trợ QL" kiểu cũ gần nhất của PA (Q3) — ghi chú của lần đó đi vào lý do thẻ. */
const XIN_CU = `(SELECT COALESCE(NULLIF(TRIM(fu.decision_note), ''), fu.note) FROM case_followups fu
                  WHERE fu.intervention_id = iv.id AND fu.next_step = 'ask_manager' ORDER BY fu.id DESC LIMIT 1)`;
const XIN_CU_CO = `EXISTS (SELECT 1 FROM case_followups fu WHERE fu.intervention_id = iv.id AND fu.next_step = 'ask_manager')`;
const TIEN_TO_XIN_CU = 'Xin ý kiến (trước khi có hộp Chờ duyệt): ';

const SELECT_PA = `
  SELECT 'de_xuat_pa', ?, 'intervention', iv.id,
         COALESCE(sc.student_id, a.student_id), COALESCE(a.class_id, cur.class_id), COALESCE(ac.branch_id, cc.branch_id),
         iv.recorded_by,
         CASE WHEN ${XIN_CU_CO} THEN ? || COALESCE(${XIN_CU}, '') ELSE iv.description END,
         iv.approval_due, 'cho', COALESCE(iv.updated_at, iv.created_at)
    FROM case_interventions iv
    JOIN sos_cases sc ON sc.id = iv.case_id
    LEFT JOIN assessment_attempts a ON a.id = sc.attempt_id
    LEFT JOIN enrollments cur ON cur.student_id = COALESCE(sc.student_id, a.student_id) AND cur.status = 'active'
    LEFT JOIN classes ac ON ac.id = a.class_id
    LEFT JOIN classes cc ON cc.id = cur.class_id
   WHERE ${PA_CHO}`;
const SELECT_DOI = `
  SELECT 'lich_thi', ?, 'skill_move', r.id, a.student_id, a.class_id, cl.branch_id, r.requested_by, r.reason,
         r.decide_by, 'cho', r.created_at
    FROM skill_move_requests r
    JOIN assessment_attempts a ON a.id = r.attempt_id
    LEFT JOIN classes cl ON cl.id = a.class_id
   WHERE r.status = 'pending'`;
const COT = `(loai, phan_loai, doi_tuong_loai, doi_tuong_id, hoc_vien_id, lop_id, chi_nhanh_id, nguoi_xin, ly_do, han_duyet, trang_thai, tao_luc)`;

/** Chép yêu cầu đang chờ của hai luồng cũ thành thẻ. Seed gọi lại để PA/đề nghị dời dựng bằng SQL cũng có thẻ. Trả số thẻ MỚI tạo. */
export function napYeuCauTuNguonCu(conn: any): { pa: number; doi: number } {
  /* `WHERE` của SELECT đứng trước ON CONFLICT — SQLite cần nó để không đọc nhầm ON CONFLICT thành điều kiện JOIN. */
  const pa = conn.prepare(`INSERT INTO yeu_cau_duyet ${COT} ${SELECT_PA} ON CONFLICT DO NOTHING`)
    .run(LOAI_YC_META.de_xuat_pa.phanLoai, TIEN_TO_XIN_CU).changes as number;
  const doi = conn.prepare(`INSERT INTO yeu_cau_duyet ${COT} ${SELECT_DOI} ON CONFLICT DO NOTHING`)
    .run(LOAI_YC_META.lich_thi.phanLoai).changes as number;
  return { pa, doi };
}

const coCot = (conn: any, bang: string, cot: string) =>
  (conn.prepare('SELECT name FROM pragma_table_info(?)').all(bang) as any[]).some((c) => c.name === cot);

export function migratePrDuyet(conn: any, applied: string[]) {
  tx(() => {
    conn.exec(SQL_BANG_YEU_CAU);
    if (!coCot(conn, 'tasks', 'assignee_name')) conn.exec('ALTER TABLE tasks ADD COLUMN assignee_name TEXT');
    if (!coCot(conn, 'notifications', 'duong')) conn.exec('ALTER TABLE notifications ADD COLUMN duong TEXT');
    const { pa, doi } = napYeuCauTuNguonCu(conn);
    if (pa + doi > 0) applied.push(`Hộp Chờ duyệt: tạo ${pa + doi} thẻ (Đề xuất PA ${pa} · Dời lịch ${doi})`);
  });
}

/** Chạy thử (chỉ đọc): thẻ sẽ tạo, thẻ chết bị bỏ, GVCN sẽ mất quyền sửa target/lộ trình. Không đọc bảng mới → chạy được trước migrate. */
export function keHoachDuyet(conn: any, homNay = demoToday()) {
  const coBang = !!conn.prepare("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'yeu_cau_duyet'").get();
  const daCo = (loai: string, cot: string) => coBang
    ? `AND NOT EXISTS (SELECT 1 FROM yeu_cau_duyet y WHERE y.loai = '${loai}' AND y.doi_tuong_id = ${cot} AND y.trang_thai = 'cho')` : '';
  const mauPa = conn.prepare(
    `SELECT iv.id, s.full_name AS hv, COALESCE(ac.code, cc.code) AS lop, iv.approval_due AS han, ${XIN_CU_CO} AS xinCu
       FROM case_interventions iv JOIN sos_cases sc ON sc.id = iv.case_id
       LEFT JOIN assessment_attempts a ON a.id = sc.attempt_id
       LEFT JOIN students s ON s.id = COALESCE(sc.student_id, a.student_id)
       LEFT JOIN enrollments cur ON cur.student_id = s.id AND cur.status = 'active'
       LEFT JOIN classes ac ON ac.id = a.class_id LEFT JOIN classes cc ON cc.id = cur.class_id
      WHERE ${PA_CHO} ${daCo('de_xuat_pa', 'iv.id')} GROUP BY iv.id ORDER BY iv.approval_due, iv.id`).all() as any[];
  const mauDoi = conn.prepare(
    `SELECT r.id, s.full_name AS hv, cl.code AS lop, r.decide_by AS han, r.decide_by < ? AS qua
       FROM skill_move_requests r JOIN assessment_attempts a ON a.id = r.attempt_id
       LEFT JOIN students s ON s.id = a.student_id LEFT JOIN classes cl ON cl.id = a.class_id
      WHERE r.status = 'pending' ${daCo('lich_thi', 'r.id')} ORDER BY r.decide_by, r.id`).all(homNay) as any[];
  const paChet = (conn.prepare(
    `SELECT COUNT(*) n FROM case_interventions iv JOIN sos_cases sc ON sc.id = iv.case_id
      WHERE iv.approval_state = 'pending' AND NOT (${PA_CHO})`).get() as any).n as number;
  /* Đề nghị dời đã quá `decide_by`: vẫn thành thẻ, nhưng `sweepExpiredMoves` huỷ ở lần đọc đầu → thẻ tự đóng ngay. */
  const doiQuaHan = mauDoi.filter((r) => r.qua).length;
  const gvcnMatQuyen = (conn.prepare(
    `SELECT COUNT(DISTINCT ta.user_id) n FROM teacher_assignments ta
      WHERE ta.is_core = 1 AND ta.status = 'active'
        AND EXISTS (SELECT 1 FROM user_roles ur JOIN roles r ON r.id = ur.role_id WHERE ur.user_id = ta.user_id AND r.key = 'teacher')`).get() as any).n as number;
  return { mauPa, mauDoi, paChet, doiQuaHan, gvcnMatQuyen };
}
