/**
 * ⋮ HỒ SƠ HV › XOÁ HỌC VIÊN (PR-XOA, đặc tả 2026-09-24 §1) — Quản lý / Quản trị của em (`cycle.edit` theo phạm vi em, OV-12a chủ SP 14/10; trước đây chỉ
 * Quản trị), kiểm ở MÁY CHỦ. Chọn nhiều › Xoá (`hangLoat.ts`) đi qua đúng hàm này, mỗi em một request.
 *
 * Xoá HẲN mọi dòng gắn em, trực tiếp và gián tiếp, trong MỘT giao dịch: lỗi ở bất kỳ câu nào → cuộn lại, không dòng nào mất,
 * không tệp nào mất. Tệp trong kho (Netlify Blobs / ổ đĩa) chỉ xoá SAU khi giao dịch chốt (`xoaTepSauGiaoDich`).
 *
 * DANH SÁCH BẢNG VIẾT CỨNG (Q6): dựng từ `PRAGMA foreign_key_list` lúc chạy là 62 câu mỗi lần trên Turso. Phép kiểm
 * `xoaDuLieu.tests.ts` (X1, X2, X4) dựng lại đồ thị từ PRAGMA và ĐỎ khi một bảng mới trỏ tới học viên mà mảng dưới đây quên.
 *
 * GOM THEO TẬP (Turso): mỗi câu xoá cả một tập bằng `WHERE … IN (SELECT …)`, tham số có tên `?1` — số câu cố định, không đổi theo
 * số lượt Test / Case của em. Thứ tự con → cha. Giữ lại: `audit_logs` cũ (Q1), `tasks` (chỉ gỡ liên kết, Q3), mã HV không tái dùng (Q8),
 * lớp của em không tự kết thúc (Q9).
 */
import { db, tx } from '../db.ts';
import { CHU_XAC_NHAN_XOA, PERMISSIONS, khopXacNhanXoa } from '../../../shared/domain/index.ts';
import { HttpError, badRequest, notFound } from '../util.ts';
import { require_, type Principal } from '../permissions.ts';
import { writeAudit } from '../platform/audit.ts';
import { xoaTepSauGiaoDich } from '../platform/attachments.ts';
import { conLaiMs } from '../platform/hanGio.ts';

const CHI_QL = 'Chỉ Quản lý của học viên này hoặc Quản trị hệ thống mới xoá được học viên.';

/** Bao đóng theo FK của `students` (41 bảng, PR-TK +2, PR-OV12g +1, OV-15c +1, SV-BAI-LOP +1, SV-YT-TVV +2, SV-S-EXPERT +1, UI-HO-SO-LOP +1, P9a XET-LAI +1) — phép kiểm X1 so bằng đúng với đồ thị dựng từ PRAGMA. */
export const BANG_CUA_HOC_VIEN: readonly string[] = [
  'students', 'enrollments', 'learning_cycles', 'lo_trinh_tiep_theo', 'lo_trinh_nhap', 'journey_events', 'teacher_estimates', 'cycle_target_revisions',
  'assessment_attempts', 'assessment_scores', 'attempt_skills', 'attempt_skill_skips', 'attempt_schedule_history', 'skill_move_requests',
  'sos_cases', 'case_interventions', 'case_followups', 'case_intervention_revisions', 'case_issues', 'case_sources', 'case_milestones',
  'sos_case_history', 'case_signals', 'task_students', 'task_case_links',
  'violations', 'violation_history', 'discipline_measures', 'measure_violations', 'sos_coordination_actions',
  'yeu_cau_duyet', 'y_thuc_khai_bac', 'mini_test', 'lenh_chuyen_lop', 'ban_giao_mon', 'ket_qua_huy',
  'ban_chup_lo_trinh', 'ban_chup_luot', 'case_followup_buoi', 'gop_y_tuan', 'ghi_chu_lich_thi', 'bai_tren_lop', 'viec_bao_ph', 'viec_bao_ph_lan', 's_expert', 'danh_gia_dau_ra', 'xet_lai_lo_trinh',
];

/** Dòng của NGƯỜI KHÁC trỏ vào dữ liệu của em (Q5) — đặt NULL, không xoá. Cả ba cột cho phép NULL. */
export const CANH_NULL: readonly string[] = ['sos_cases.previous_case_id', 'case_followups.evidence_attempt_id', 'tasks.source_sos_case_id'];

// ---------------------------------------------------------------- các tập (SQL con, tham số ?1)
const Y = 'SELECT id FROM learning_cycles WHERE student_id = ?1';
const A = `SELECT id FROM assessment_attempts WHERE student_id = ?1 OR cycle_id IN (${Y})`;
const C = `SELECT id FROM sos_cases WHERE student_id = ?1 OR attempt_id IN (${A}) OR cycle_id IN (${Y})`;
const I = `SELECT id FROM case_interventions WHERE case_id IN (${C})`;
const F = `SELECT id FROM case_followups WHERE case_id IN (${C}) OR intervention_id IN (${I})`;
const G = `SELECT id FROM case_signals WHERE student_id = ?1 OR case_id IN (${C}) OR attempt_id IN (${A}) OR cycle_id IN (${Y})`;
const V = `SELECT id FROM violations WHERE student_id = ?1 OR cycle_id IN (${Y})`;
const M = `SELECT id FROM discipline_measures WHERE student_id = ?1 OR cycle_id IN (${Y})`;
const X = `SELECT id FROM sos_coordination_actions WHERE student_id = ?1 OR attempt_id IN (${A})`;
const R = `SELECT id FROM skill_move_requests WHERE attempt_id IN (${A})`;
const Q = 'SELECT id FROM yeu_cau_duyet WHERE hoc_vien_id = ?1';

/** Tệp đính kèm theo liên kết mềm `owner_type/owner_id` (không có FK). `unit_report` không thuộc học viên. */
const DK_TEP = `(owner_type = 'sos_case' AND owner_id IN (${C}))
  OR (owner_type = 'case_intervention' AND owner_id IN (${I}))
  OR (owner_type = 'violation' AND owner_id IN (${V}))
  OR (owner_type = 'discipline_measure' AND owner_id IN (${M}))
  OR (owner_type = 'sos_coordination_action' AND owner_id IN (${X}))`;

/** Thông báo theo liên kết mềm `entity_type/entity_id` (Q2). `nhac_viec` (entity_id NULL) giữ. */
const DK_THONG_BAO = `(entity_type = 'student' AND entity_id = ?1)
  OR (entity_type = 'assessment_attempt' AND entity_id IN (${A}))
  OR (entity_type = 'sos_case' AND entity_id IN (${C}))
  OR (entity_type = 'case_signal' AND entity_id IN (${G}))
  OR (entity_type = 'discipline_measure' AND entity_id IN (${M}))
  OR (entity_type = 'skill_move_requests' AND entity_id IN (${R}))
  OR (entity_type = 'case_intervention' AND entity_id IN (${I}))
  OR (entity_type = 'violation' AND entity_id IN (${V}))
  OR (entity_type = 'sos_coordination_action' AND entity_id IN (${X}))
  OR (entity_type = 'yeu_cau_duyet' AND entity_id IN (${Q}))`;

/**
 * THỨ TỰ CON → CHA trong `tx`. Tập được tính LẠI ở từng câu, nên một câu chỉ được dùng tập của bảng CHƯA xoá (ví dụ mọi câu dùng C
 * đứng trước câu xoá `sos_cases`). `attachments#tep` là câu ĐỌC khoá tệp để xoá trong kho sau khi chốt.
 */
export const CAU_XOA_HOC_VIEN: readonly { bang: string; sql: string }[] = [
  /* cắt vòng learning_cycles ↔ assessment_attempts */
  { bang: 'learning_cycles', sql: 'UPDATE learning_cycles SET baseline_attempt_id = NULL, outcome_attempt_id = NULL WHERE student_id = ?1' },
  /* Q5: dòng của em khác trỏ vào dữ liệu của em → NULL */
  { bang: 'sos_cases', sql: `UPDATE sos_cases SET previous_case_id = NULL WHERE previous_case_id IN (${C}) AND id NOT IN (${C})` },
  { bang: 'case_followups', sql: `UPDATE case_followups SET evidence_attempt_id = NULL WHERE evidence_attempt_id IN (${A}) AND id NOT IN (${F})` },
  { bang: 'tasks', sql: `UPDATE tasks SET source_sos_case_id = NULL WHERE source_sos_case_id IN (${C})` },
  /* liên kết mềm */
  { bang: 'attachments#tep', sql: `SELECT url FROM attachments WHERE kind = 'file' AND (${DK_TEP})` },
  { bang: 'attachments', sql: `DELETE FROM attachments WHERE ${DK_TEP}` },
  { bang: 'notifications', sql: `DELETE FROM notifications WHERE ${DK_THONG_BAO}` },
  /* PR-CT: quyết định chuyển lớp + dòng bàn giao của em (lệnh trỏ thẻ Chờ duyệt nên xoá TRƯỚC thẻ) */
  { bang: 'xet_lai_lo_trinh', sql: `DELETE FROM xet_lai_lo_trinh WHERE student_id = ?1 OR lenh_id IN (SELECT id FROM lenh_chuyen_lop WHERE student_id = ?1 OR tu_yeu_cau_id IN (${Q})) OR lenh_moi_id IN (SELECT id FROM lenh_chuyen_lop WHERE student_id = ?1 OR tu_yeu_cau_id IN (${Q}))` },   // P9a XET-LAI
  { bang: 'ban_giao_mon', sql: `DELETE FROM ban_giao_mon WHERE lenh_id IN (SELECT id FROM lenh_chuyen_lop WHERE student_id = ?1 OR tu_yeu_cau_id IN (${Q}))` },
  { bang: 'lenh_chuyen_lop', sql: `DELETE FROM lenh_chuyen_lop WHERE student_id = ?1 OR tu_yeu_cau_id IN (${Q})` },
  /* PR-DUYET: thẻ Chờ duyệt của em (đối tượng là PA/đề nghị dời/lộ trình của em — xoá cùng em) */
  { bang: 'yeu_cau_duyet', sql: 'DELETE FROM yeu_cau_duyet WHERE hoc_vien_id = ?1' },
  /* Case học thuật và mọi thứ treo dưới Case */
  { bang: 'task_case_links', sql: `DELETE FROM task_case_links WHERE case_id IN (${C})` },
  { bang: 'task_students', sql: `DELETE FROM task_students WHERE student_id = ?1 OR case_id IN (${C}) OR intervention_id IN (${I})` },
  { bang: 'case_intervention_revisions', sql: `DELETE FROM case_intervention_revisions WHERE case_id IN (${C}) OR intervention_id IN (${I}) OR followup_id IN (${F})` },
  { bang: 'case_followup_buoi', sql: `DELETE FROM case_followup_buoi WHERE followup_id IN (${F})` },   // OV-12h (CASCADE cũng xoá — ghi rõ cho phép kiểm bao đóng)
  { bang: 'case_followups', sql: `DELETE FROM case_followups WHERE id IN (${F})` },
  /*
   * `superseded_by` trỏ PA cùng Case — cùng câu nên FK (kiểm cuối câu) vẫn đúng. PA của Case KHÁC lỡ trỏ vào PA của em (dữ liệu lỗi) thì
   * theo luật bao đóng cũng thuộc em; con của nó chưa xoá nên FK hỏng → cả giao dịch lui, không mất gì.
   */
  { bang: 'case_interventions', sql: `DELETE FROM case_interventions WHERE case_id IN (${C}) OR superseded_by IN (${I})` },
  { bang: 'case_issues', sql: `DELETE FROM case_issues WHERE case_id IN (${C})` },
  { bang: 'case_sources', sql: `DELETE FROM case_sources WHERE case_id IN (${C})` },
  { bang: 'sos_case_history', sql: `DELETE FROM sos_case_history WHERE case_id IN (${C})` },
  { bang: 'case_milestones', sql: `DELETE FROM case_milestones WHERE case_id IN (${C}) OR attempt_id IN (${A})` },
  { bang: 'case_signals', sql: `DELETE FROM case_signals WHERE id IN (${G})` },
  { bang: 'sos_cases', sql: `DELETE FROM sos_cases WHERE id IN (${C})` },
  /* Ý thức: vi phạm ↔ PA xử lý (Q4 — PA của em khác lỡ nối vi phạm của em: chỉ mất dòng nối) */
  /* SV-YT-TVV: việc Báo PH của em / của lần xử lý của em (+ lịch sử ghi) trước lần xử lý */
  { bang: 'viec_bao_ph_lan', sql: `DELETE FROM viec_bao_ph_lan WHERE viec_id IN (SELECT id FROM viec_bao_ph WHERE student_id = ?1 OR measure_id IN (${M}))` },
  { bang: 'viec_bao_ph', sql: `DELETE FROM viec_bao_ph WHERE student_id = ?1 OR measure_id IN (${M})` },
  { bang: 'measure_violations', sql: `DELETE FROM measure_violations WHERE violation_id IN (${V}) OR measure_id IN (${M})` },
  { bang: 'violation_history', sql: `DELETE FROM violation_history WHERE violation_id IN (${V})` },
  { bang: 'discipline_measures', sql: `DELETE FROM discipline_measures WHERE id IN (${M})` },
  { bang: 'violations', sql: `DELETE FROM violations WHERE id IN (${V})` },
  { bang: 'sos_coordination_actions', sql: `DELETE FROM sos_coordination_actions WHERE id IN (${X})` },
  /* PR-LT2b: Mini Test trỏ lộ trình + bài Cuối khoá của em */
  { bang: 'mini_test', sql: `DELETE FROM mini_test WHERE student_id = ?1 OR cycle_id IN (${Y}) OR tu_attempt_id IN (${A})` },
  /* lượt Test — PR-MTa: kết quả MT đã huỷ do dời vượt (lượt bị vượt và lượt vượt đều của em) */
  { bang: 'ket_qua_huy', sql: `DELETE FROM ket_qua_huy WHERE attempt_id IN (${A}) OR vuot_boi_attempt_id IN (${A})` },
  { bang: 'skill_move_requests', sql: `DELETE FROM skill_move_requests WHERE attempt_id IN (${A})` },
  { bang: 'assessment_scores', sql: `DELETE FROM assessment_scores WHERE attempt_id IN (${A})` },
  { bang: 'attempt_skills', sql: `DELETE FROM attempt_skills WHERE attempt_id IN (${A})` },
  { bang: 'attempt_skill_skips', sql: `DELETE FROM attempt_skill_skips WHERE attempt_id IN (${A})` },
  { bang: 'attempt_schedule_history', sql: `DELETE FROM attempt_schedule_history WHERE attempt_id IN (${A})` },
  { bang: 'teacher_estimates', sql: `DELETE FROM teacher_estimates WHERE student_id = ?1 OR cycle_id IN (${Y})` },
  { bang: 'journey_events', sql: `DELETE FROM journey_events WHERE student_id = ?1 OR cycle_id IN (${Y})` },
  { bang: 'assessment_attempts', sql: `DELETE FROM assessment_attempts WHERE id IN (${A})` },
  /* lộ trình, lớp, em */
  { bang: 'y_thuc_khai_bac', sql: `DELETE FROM y_thuc_khai_bac WHERE student_id = ?1 OR chuoi_cycle_id IN (${Y})` },
  { bang: 'cycle_target_revisions', sql: `DELETE FROM cycle_target_revisions WHERE cycle_id IN (${Y})` },
  { bang: 'lo_trinh_tiep_theo', sql: 'DELETE FROM lo_trinh_tiep_theo WHERE student_id = ?1' },
  { bang: 'lo_trinh_nhap', sql: 'DELETE FROM lo_trinh_nhap WHERE student_id = ?1' },   // OV-3b
  /* PR-TK: bản chụp lộ trình (bảng dòng lượt trước, bảng chính sau) — đứng trước learning_cycles / students */
  { bang: 'ban_chup_luot', sql: `DELETE FROM ban_chup_luot WHERE ban_chup_id IN (SELECT id FROM ban_chup_lo_trinh WHERE student_id = ?1 OR cycle_id IN (${Y}))` },
  { bang: 'ban_chup_lo_trinh', sql: `DELETE FROM ban_chup_lo_trinh WHERE student_id = ?1 OR cycle_id IN (${Y})` },
  { bang: 'gop_y_tuan', sql: 'DELETE FROM gop_y_tuan WHERE student_id = ?1' },   // PR-OV12g
  { bang: 'bai_tren_lop', sql: 'DELETE FROM bai_tren_lop WHERE student_id = ?1' },   // SV-BAI-LOP
  { bang: 's_expert', sql: 'DELETE FROM s_expert WHERE student_id = ?1' },   // SV-S-EXPERT
  { bang: 'danh_gia_dau_ra', sql: 'DELETE FROM danh_gia_dau_ra WHERE student_id = ?1' },   // UI-HO-SO-LOP
  { bang: 'ghi_chu_lich_thi', sql: `DELETE FROM ghi_chu_lich_thi WHERE student_id = ?1 OR cycle_id IN (${Y})` },   // OV-15c
  { bang: 'enrollments', sql: 'DELETE FROM enrollments WHERE student_id = ?1' },
  { bang: 'learning_cycles', sql: 'DELETE FROM learning_cycles WHERE student_id = ?1' },
  { bang: 'students', sql: 'DELETE FROM students WHERE id = ?1' },
];

/**
 * Hàm Netlify bị cắt ở 10 s (Q7): 37 câu × tới ~100 ms trên Turso ≈ 4 s. `tx` tự chặn khi còn < 2,5 s là chưa đủ cho việc dài
 * này — còn ít hơn chừng này thì không bắt đầu xoá.
 */
export const XOA_CAN_CON_MS = 6_000;

/** "Những gì sẽ mất" — đúng thứ tự hiển thị của panel. */
const LOAI_MAT: { khoa: string; nhan: string; sql: string }[] = [
  { khoa: 'luotTest', nhan: 'Lượt Test', sql: `SELECT COUNT(*) FROM (${A})` },
  { khoa: 'diem', nhan: 'Điểm đã nhập', sql: `SELECT COUNT(*) FROM assessment_scores WHERE attempt_id IN (${A})` },
  { khoa: 'caseHocThuat', nhan: 'Case học thuật', sql: `SELECT COUNT(*) FROM (${C})` },
  { khoa: 'paHocThuat', nhan: 'PA học thuật', sql: `SELECT COUNT(*) FROM (${I})` },
  { khoa: 'ghiKetQua', nhan: 'Kết quả PA', sql: `SELECT COUNT(*) FROM (${F})` },
  { khoa: 'tinHieu', nhan: 'Case chờ xác nhận nguyên nhân', sql: `SELECT COUNT(*) FROM (${G})` },
  { khoa: 'viPham', nhan: 'Vi phạm', sql: `SELECT COUNT(*) FROM (${V})` },
  { khoa: 'paXuLy', nhan: 'Lần xử lý', sql: `SELECT COUNT(*) FROM (${M})` },
  { khoa: 'phoiHop', nhan: 'Phối hợp SOS', sql: `SELECT COUNT(*) FROM (${X})` },
  { khoa: 'tep', nhan: 'Tệp, liên kết đính kèm', sql: `SELECT COUNT(*) FROM attachments WHERE ${DK_TEP}` },
  { khoa: 'thongBao', nhan: 'Thông báo', sql: `SELECT COUNT(*) FROM notifications WHERE ${DK_THONG_BAO}` },
  { khoa: 'lopTungHoc', nhan: 'Lớp từng học', sql: 'SELECT COUNT(*) FROM enrollments WHERE student_id = ?1' },
];
/** Công việc (của Quản lý) nối tới em hoặc Case của em — GIỮ lại, chỉ bỏ liên kết (Q3). */
const CONG_VIEC_NOI = `SELECT COUNT(*) FROM (
  SELECT task_id FROM task_students WHERE student_id = ?1 OR case_id IN (${C}) OR intervention_id IN (${I})
  UNION SELECT task_id FROM task_case_links WHERE case_id IN (${C})
  UNION SELECT id FROM tasks WHERE source_sos_case_id IN (${C}))`;
/** MỘT câu đếm cho cả xem trước và `soDong` của audit. */
const CAU_DEM = `SELECT ${LOAI_MAT.map((l) => `(${l.sql}) AS ${l.khoa}`).join(', ')}, (${CONG_VIEC_NOI}) AS congViec`;
/** OV-12a: cùng câu cho CẢ TẬP em (Chọn nhiều › Xoá) — `?1` là mảng JSON id, mọi `= ?1` thành `IN (json_each)`: một câu, một tham số (Turso). */
const CAU_DEM_NHIEU = CAU_DEM.replaceAll('= ?1', 'IN (SELECT value FROM json_each(?1))');
/** "Những gì sẽ mất" của nhiều em gộp lại — chỉ loại > 0, thứ tự như `LOAI_MAT`. */
export function matNhieuEm(ids: number[]): { nhan: string; so: number }[] {
  if (!ids.length) return [];
  const r = db().prepare(CAU_DEM_NHIEU).get(JSON.stringify(ids)) as Record<string, number>;
  return LOAI_MAT.map((l) => ({ nhan: l.nhan, so: Number(r[l.khoa] ?? 0) })).filter((x) => x.so > 0);
}

export type XemXoaHocVien = {
  id: number; ma: string; ten: string; lop: string | null; email: string | null; dangHoc: boolean;
  /** Chỉ loại > 0, thứ tự như `LOAI_MAT`. */
  mat: { khoa: string; nhan: string; so: number }[];
  congViecGoLienKet: number;
};

type Em = { id: number; student_code: string; full_name: string; email: string | null; status: string; lop: string | null; lop_dang_hoc: number };

function docEm(sid: number): Em {
  const s = db().prepare(
    `SELECT s.id, s.student_code, s.full_name, s.email, s.status,
            (SELECT c.code FROM enrollments e JOIN classes c ON c.id = e.class_id
              WHERE e.student_id = s.id AND e.status IN ('active','paused') ORDER BY e.id DESC LIMIT 1) AS lop,
            EXISTS (SELECT 1 FROM enrollments e WHERE e.student_id = s.id AND e.status = 'active') AS lop_dang_hoc
       FROM students s WHERE s.id = ?1`,
  ).get(sid) as Em | undefined;
  if (!s) throw notFound('Học viên đã bị xoá hoặc không tồn tại.');
  return s;
}

function demMat(sid: number): { soDong: Record<string, number>; congViec: number } {
  const r = db().prepare(CAU_DEM).get(sid) as Record<string, number>;
  const soDong: Record<string, number> = {};
  for (const l of LOAI_MAT) soDong[l.khoa] = Number(r[l.khoa] ?? 0);
  return { soDong, congViec: Number(r.congViec ?? 0) };
}

/** GET /students/:id/xoa — bảng "những gì sẽ mất" cho panel (2 câu). Quản lý / Quản trị của em. */
export function xemXoaHocVien(p: Principal, studentId: number): XemXoaHocVien {
  const s = docEm(studentId);   // OV-12a: em đã bị xoá → 404 trước (quyền theo phạm vi em cần em còn tồn tại)
  require_(p, PERMISSIONS.CYCLE_EDIT, { studentId }, CHI_QL);
  const { soDong, congViec } = demMat(studentId);
  return {
    id: s.id, ma: s.student_code, ten: s.full_name, lop: s.lop ?? null, email: s.email || null,   // VN-1: phân biệt em trùng tên
    dangHoc: s.status === 'active' && !!s.lop_dang_hoc,
    mat: LOAI_MAT.filter((l) => soDong[l.khoa] > 0).map((l) => ({ khoa: l.khoa, nhan: l.nhan, so: soDong[l.khoa] })),
    congViecGoLienKet: congViec,
  };
}

/** POST /students/:id/xoa { maXacNhan } — xoá vĩnh viễn. Gõ XOÁ (OV-13f: mã HV không hiện trên màn — như Xoá nhiều em) hoặc đúng mã học viên. */
export function xoaHocVien(p: Principal, studentId: number, input: { maXacNhan?: unknown }): { ok: true; ma: string; soDong: Record<string, number> } {
  const s = docEm(studentId);   // OV-12a: em đã bị xoá → 404 trước
  require_(p, PERMISSIONS.CYCLE_EDIT, { studentId }, CHI_QL);
  const go = String(input.maXacNhan ?? '').trim();
  if (go !== s.student_code && !khopXacNhanXoa(go)) throw badRequest(`Gõ ${CHU_XAC_NHAN_XOA} để xác nhận xoá.`);
  const khoaTep: string[] = [];
  const soDong = tx(() => {
    const con = conLaiMs();
    if (con !== null && con < XOA_CAN_CON_MS) throw new HttpError(503, 'Máy chủ đang bận, chưa xoá gì. Thử lại sau ít phút.');
    const conn = db();
    const dem = demMat(studentId).soDong;
    for (const c of CAU_XOA_HOC_VIEN) {
      if (c.bang === 'attachments#tep') {
        for (const r of conn.prepare(c.sql).all(studentId) as { url: string }[]) khoaTep.push(r.url);
        continue;
      }
      conn.prepare(c.sql).run(studentId);
    }
    writeAudit({
      actorUserId: p.userId, action: 'student.delete', entityType: 'student', entityId: studentId,
      entityLabel: `${s.full_name} · ${s.student_code}`,
      before: { ma: s.student_code, ten: s.full_name, lop: s.lop ?? null, trangThai: s.status },
      after: { soDong: dem, soTep: khoaTep.length },
    });
    return dem;
  });
  /* SAU khi chốt (khuôn Task 6e): giao dịch lui thì không tệp nào mất; xoá tệp lỗi chỉ ghi log. */
  xoaTepSauGiaoDich(khoaTep);
  return { ok: true, ma: s.student_code, soDong };
}
