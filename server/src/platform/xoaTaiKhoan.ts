/**
 * QUẢN TRỊ HỆ THỐNG › TÀI KHOẢN › ⋯ › XOÁ TÀI KHOẢN (PR-XOA, đặc tả 2026-09-24 §3) — CHỈ Quản trị hệ thống, kiểm ở MÁY CHỦ.
 *
 *   Chưa có DẤU VẾT  → xoá HẲN: dòng `users` cùng 9 bảng thiết lập (vai, quyền riêng, email phụ, kỹ năng, tuỳ chọn, phiên, phân công,
 *                      thông báo tới người đó, theo dõi công việc).
 *   Có dấu vết       → xoá MỀM (Q11): khoá và ẩn — `status='deleted'`, `deleted_at`, tên thêm " (đã xoá)" (lịch sử mọi nơi tự ghi kèm),
 *                      email giải phóng `da-xoa-{id}@invalid` (tạo lại được tài khoản cùng email), bỏ mật khẩu + mọi phiên, kết thúc vai và
 *                      phân công. Các ô chọn người đã lọc `status='active'` nên người đã xoá tự ẩn (Q13).
 *
 * "Dấu vết" = một dòng ở bảng dữ liệu nghiệp vụ trỏ tới người này — 61 cột `dau_vet` của `COT_TRO_TAI_KHOAN` (dựng từ `PRAGMA
 * foreign_key_list`, 70 cột trỏ `users`; phép kiểm T1 đỏ khi có cột mới chưa phân loại).
 * Chặn: tự xoá mình · Quản trị hệ thống cuối cùng · đang là GVCN lớp còn hoạt động. Cảnh báo (không chặn): lớp sẽ thiếu GV môn · việc
 * đang giao cho người này (Q12).
 */
import { db, tx } from '../db.ts';
import { PERMISSIONS, soSanhLop, tenMon } from '../../../shared/domain/index.ts';
import { demoToday } from '../demoConfig.ts';
import { badRequest, notFound, nowIso } from '../util.ts';
import { require_, type Principal } from '../permissions.ts';
import { writeAudit } from './audit.ts';

const CHI_ADMIN = 'Chỉ Quản trị hệ thống mới xoá được tài khoản.';
const DA_XOA = 'Tài khoản đã xoá.';

type Loai = 'dau_vet' | 'thiet_lap';
const c = (bang: string, cot: string, loai: Loai, nhan: string) => ({ bang, cot, loai, nhan });
const DV = 'dau_vet' as const;
const TL = 'thiet_lap' as const;

/** 80 cột FK trỏ `users.id` (PR-HSM thêm `assessment_scores.examiner_user_id`; PR-LT2b thêm 2; PR-CT thêm 4 cột quyết định chuyển lớp / bàn giao) (bảng tham chiếu của kế hoạch). `nhan` gộp dòng "Có dấu vết" của panel. */
export const COT_TRO_TAI_KHOAN: readonly { bang: string; cot: string; loai: Loai; nhan: string }[] = [
  /* thiết lập (9) — xoá hẳn thì xoá theo; xoá mềm xử lý riêng (Q11) */
  c('user_roles', 'user_id', TL, 'vai trò'), c('user_permissions', 'user_id', TL, 'quyền riêng'), c('user_emails', 'user_id', TL, 'email phụ'),
  c('user_skills', 'user_id', TL, 'kỹ năng'), c('user_prefs', 'user_id', TL, 'tuỳ chọn'), c('demo_sessions', 'user_id', TL, 'phiên đăng nhập'),
  c('teacher_assignments', 'user_id', TL, 'phân công'), c('notifications', 'user_id', TL, 'thông báo'), c('task_followers', 'user_id', TL, 'theo dõi công việc'),
  /* dấu vết (66) */
  c('assessment_attempts', 'created_by', DV, 'lượt Test'), c('assessment_attempts', 'deadline_override_by', DV, 'lượt Test'),
  c('assessment_scores', 'entered_by', DV, 'điểm đã nhập'), c('assessment_scores', 'no_show_by', DV, 'điểm đã nhập'),
  c('assessment_scores', 'examiner_user_id', DV, 'điểm đã nhập'), c('assessment_scores', 'nhan_xet_phu_trach_by', DV, 'điểm đã nhập'),   // OV-13k
  c('attachments', 'uploaded_by', DV, 'tệp đính kèm'),
  /* PR-OV2a: TVV phụ trách em — dấu vết (xoá mềm), KHÔNG thiết lập: thiết lập bị DELETE theo, sẽ xoá luôn học viên. */
  c('students', 'consultant_user_id', DV, 'học viên phụ trách tư vấn'),
  c('attempt_schedule_history', 'actor_user_id', DV, 'lịch Test'), c('attempt_skill_skips', 'created_by', DV, 'lịch Test'),
  c('attempt_skills', 'scope_by', DV, 'lịch Test'), c('attempt_skills', 'sit_by', DV, 'lịch Test'), c('attempt_skills', 'deadline_override_by', DV, 'lịch Test'),
  c('audit_logs', 'actor_user_id', DV, 'nhật ký thao tác'),
  c('case_followups', 'observer_user_id', DV, 'Case'),
  c('case_followups', 'phu_trach_user_id', DV, 'Case'),   // PR-LUI-a2: Người phụ trách của lần ghi kết quả PA
  c('case_intervention_revisions', 'actor_user_id', DV, 'Case'), c('case_intervention_revisions', 'old_performer_user_id', DV, 'Case'),
  c('case_intervention_revisions', 'new_performer_user_id', DV, 'Case'),
  c('case_interventions', 'performer_user_id', DV, 'Case'), c('case_interventions', 'recorded_by', DV, 'Case'),
  c('case_interventions', 'approval_by', DV, 'Case'), c('case_interventions', 'confirmed_by', DV, 'Case'),
  c('case_issues', 'created_by', DV, 'Case'), c('case_milestones', 'created_by', DV, 'Case'), c('case_sources', 'created_by', DV, 'Case'),
  c('case_signals', 'owner_user_id', DV, 'Case chờ xác nhận nguyên nhân'), c('case_signals', 'resolved_by', DV, 'Case chờ xác nhận nguyên nhân'),
  c('cycle_target_revisions', 'actor_user_id', DV, 'lộ trình'),
  c('discipline_measures', 'owner_user_id', DV, 'lần xử lý'), c('discipline_measures', 'performed_by', DV, 'lần xử lý'),
  c('discipline_measures', 'confirmed_by', DV, 'lần xử lý'), c('discipline_measures', 'created_by', DV, 'lần xử lý'),
  c('viec_bao_ph', 'bo_boi', DV, 'việc Báo PH'), c('viec_bao_ph_lan', 'ghi_boi', DV, 'việc Báo PH'),   // SV-YT-TVV
  c('journey_events', 'created_by', DV, 'hành trình'), c('lo_trinh_tiep_theo', 'updated_by', DV, 'lộ trình tiếp theo'),
  c('lo_trinh_tiep_theo', 'quyet_boi', DV, 'lộ trình tiếp theo'), c('mini_test', 'ghi_boi', DV, 'Mini Test'),
  c('lo_trinh_tiep_theo', 'kq_de_xuat_boi', DV, 'lộ trình tiếp theo'), c('lo_trinh_nhap', 'sua_boi', DV, 'nháp lộ trình'),   // OV-3b
  c('ket_qua_huy', 'huy_boi', DV, 'kết quả MT đã huỷ'), c('ket_qua_huy', 'khoi_phuc_boi', DV, 'kết quả MT đã huỷ'),
  c('measure_violations', 'added_by', DV, 'lần xử lý'),
  c('skill_move_requests', 'requested_by', DV, 'xin dời lịch'), c('skill_move_requests', 'decided_by', DV, 'xin dời lịch'),
  c('sos_case_history', 'actor_user_id', DV, 'Case'),
  c('sos_cases', 'outcome_by', DV, 'Case'), c('sos_cases', 'owner_user_id', DV, 'Case'), c('sos_cases', 'reported_by', DV, 'Case'),
  c('sos_cases', 'closed_by', DV, 'Case'), c('sos_cases', 'acknowledged_by', DV, 'Case'), c('sos_cases', 'head_confirmed_by', DV, 'Case'),
  c('sos_coordination_actions', 'performed_by', DV, 'Phối hợp SOS'), c('sos_coordination_actions', 'removed_by', DV, 'Phối hợp SOS'),
  c('task_history', 'actor_user_id', DV, 'công việc'), c('task_updates', 'actor_user_id', DV, 'công việc'),
  c('tasks', 'assignee_user_id', DV, 'công việc'), c('tasks', 'watcher_user_id', DV, 'công việc'),
  c('tasks', 'created_by', DV, 'công việc'), c('tasks', 'help_user_id', DV, 'công việc'),
  c('teacher_estimates', 'assessed_by', DV, 'ước lượng'),
  c('unit_report_history', 'actor_user_id', DV, 'họp đơn vị'), c('unit_report_task_links', 'created_by', DV, 'họp đơn vị'),
  c('unit_reports', 'reporter_user_id', DV, 'họp đơn vị'), c('unit_reports', 'submitted_by', DV, 'họp đơn vị'),
  /* Q10: lịch sử duyệt / cấp quyền cho NGƯỜI KHÁC — xoá hẳn là mất căn cứ "ai duyệt" */
  c('user_permissions', 'granted_by', DV, 'duyệt, cấp quyền'), c('users', 'approved_by', DV, 'duyệt, cấp quyền'),
  c('yeu_cau_duyet', 'nguoi_xin', DV, 'yêu cầu duyệt'), c('yeu_cau_duyet', 'nguoi_duyet', DV, 'yêu cầu duyệt'),
  c('violation_history', 'actor_user_id', DV, 'vi phạm'), c('violations', 'reported_by', DV, 'vi phạm'), c('violations', 'invalidated_by', DV, 'vi phạm'),
  c('violations', 'ghi_nhan_boi', DV, 'vi phạm'),
  c('y_thuc_khai_bac', 'khai_boi', DV, 'xác nhận cấp bậc vi phạm'), c('y_thuc_khai_bac', 'sua_boi', DV, 'xác nhận cấp bậc vi phạm'),
  c('lenh_chuyen_lop', 'nguoi_ra_lenh', DV, 'quyết định chuyển lớp'), c('lenh_chuyen_lop', 'huy_boi', DV, 'quyết định chuyển lớp'),
  c('lenh_chuyen_lop', 'xac_nhan_boi', DV, 'bàn giao'), c('ban_giao_mon', 'nguoi_ghi', DV, 'bàn giao'),
  c('gop_y_tuan', 'ghi_boi', DV, 'góp ý hàng tuần'),   // OV-12g
  c('bai_tren_lop', 'ghi_boi', DV, 'tiến độ trên lớp'), c('bai_tren_lop', 'sua_boi', DV, 'tiến độ trên lớp'),   // SV-BAI-LOP
  c('ghi_chu_lich_thi', 'created_by', DV, 'ghi chú lịch Test'),   // OV-15c
  c('tutors', 'created_by', DV, 'danh sách tutor'), c('tutors', 'updated_by', DV, 'danh sách tutor'),   // TU-a
  c('tutor_nhan_xet', 'nguoi_id', DV, 'nhận xét về tutor'),
];

const COT_DAU_VET = COT_TRO_TAI_KHOAN.filter((x) => x.loai === 'dau_vet');
const COT_THIET_LAP = COT_TRO_TAI_KHOAN.filter((x) => x.loai === 'thiet_lap');
/**
 * Câu đếm mọi cột dấu vết (tham số ?1), CHIA NHÓM ≤ 20 vế UNION ALL (PR-XOA-b): Turso từ chối câu gộp quá ~50 vế ("too many terms
 * in compound SELECT", đo trên DB thử 24/09: 50 được, 64 hỏng) — file cục bộ cho tới 500 nên phép kiểm không thấy.
 */
export const VE_TOI_DA_MOT_CAU = 20;
export const CAU_DAU_VET: string[] = [];
for (let i = 0; i < COT_DAU_VET.length; i += VE_TOI_DA_MOT_CAU) {
  CAU_DAU_VET.push(COT_DAU_VET.slice(i, i + VE_TOI_DA_MOT_CAU)
    .map((x) => `SELECT '${x.bang}.${x.cot}' AS k, COUNT(*) AS n FROM ${x.bang} WHERE ${x.cot} = ?1`)
    .join('\nUNION ALL '));
}

export type XemXoaTaiKhoan = {
  id: number; ten: string; email: string | null; vai: string[]; chiNhanh: string[];
  soDauVet: number;
  /** Gộp theo nhãn, chỉ nhãn > 0, giảm dần. */
  chiTiet: { nhan: string; so: number }[];
  cach: 'han' | 'mem'; chan: string | null; canhBao: string[];
};

type Nguoi = {
  id: number; full_name: string; email: string | null; status: string; approval_state: string;
  vai: string | null; chi_nhanh: string | null; la_qt: number; so_qt_khac: number; lop_gvcn: string | null;
};

/** Người + vai + chi nhánh + đủ dữ kiện để chặn — MỘT câu. */
function docNguoi(userId: number, homNay: string): Nguoi {
  const u = db().prepare(
    `SELECT u.id, u.full_name, u.email, u.status, u.approval_state,
            (SELECT group_concat(DISTINCT r.name_vi) FROM user_roles ur JOIN roles r ON r.id = ur.role_id
              WHERE ur.user_id = u.id AND ur.status = 'active') AS vai,
            (SELECT group_concat(DISTINCT b.name) FROM user_roles ur JOIN branches b ON b.id = ur.branch_id
              WHERE ur.user_id = u.id AND ur.status = 'active') AS chi_nhanh,
            EXISTS (SELECT 1 FROM user_roles ur JOIN roles r ON r.id = ur.role_id
                     WHERE ur.user_id = u.id AND ur.status = 'active' AND r.key = 'system_admin') AS la_qt,
            (SELECT COUNT(DISTINCT u2.id) FROM users u2 JOIN user_roles ur ON ur.user_id = u2.id JOIN roles r ON r.id = ur.role_id
              WHERE r.key = 'system_admin' AND ur.status = 'active' AND u2.status = 'active' AND u2.id != u.id) AS so_qt_khac,
            (SELECT group_concat(code, ', ') FROM (SELECT DISTINCT c.code FROM teacher_assignments ta JOIN classes c ON c.id = ta.class_id
              WHERE ta.user_id = u.id AND ta.is_core = 1 AND ta.status = 'active' AND c.status = 'active'
                AND (ta.effective_to IS NULL OR ta.effective_to >= ?2))) AS lop_gvcn
       FROM users u WHERE u.id = ?1`,
  ).get(userId, homNay) as Nguoi | undefined;
  if (!u || u.approval_state === 'pending') throw notFound('Không tìm thấy tài khoản.');
  return u;
}

function lyDoChan(p: Principal, u: Nguoi): string | null {
  if (u.id === p.userId) return 'Không tự xoá tài khoản của chính mình.';
  if (u.la_qt && u.status === 'active' && u.so_qt_khac === 0) return 'Đây là Quản trị hệ thống cuối cùng.';
  /* PR-UXF-a U1: group_concat không hứa thứ tự — sắp bằng soSanhLop. */
  if (u.lop_gvcn) return `Đổi GVCN lớp ${u.lop_gvcn.split(', ').sort((a, b) => soSanhLop({ code: a }, { code: b })).join(', ')} trước.`;
  return null;
}

function demDauVet(userId: number): { tong: number; theoCot: Map<string, number> } {
  const rows = CAU_DAU_VET.flatMap((cau) => db().prepare(cau).all(userId) as { k: string; n: number }[]);
  const theoCot = new Map(rows.map((r) => [r.k, Number(r.n)]));
  return { tong: rows.reduce((s, r) => s + Number(r.n), 0), theoCot };
}

/** GET /admin/accounts/:id/xoa — panel xác nhận (4 câu). Chỉ Quản trị hệ thống. */
export function xemXoaTaiKhoan(p: Principal, userId: number): XemXoaTaiKhoan {
  require_(p, PERMISSIONS.ADMIN_CONFIG, { anyScope: true }, CHI_ADMIN);
  const homNay = demoToday();
  const u = docNguoi(userId, homNay);
  if (u.status === 'deleted') throw badRequest(DA_XOA);
  const dv = demDauVet(userId);
  const gop = new Map<string, number>();
  for (const x of COT_DAU_VET) {
    const n = dv.theoCot.get(`${x.bang}.${x.cot}`) ?? 0;
    if (n) gop.set(x.nhan, (gop.get(x.nhan) ?? 0) + n);
  }
  const conn = db();
  const canhBao: string[] = [];
  /* GVBM đang dạy lớp còn hoạt động — lớp sẽ thiếu GV môn đó. */
  const mon = conn.prepare(
    `SELECT DISTINCT c.code, c.programme_code, ta.skill FROM teacher_assignments ta JOIN classes c ON c.id = ta.class_id
      WHERE ta.user_id = ?1 AND ta.skill IS NOT NULL AND ta.status = 'active' AND c.status = 'active'
        AND (ta.effective_to IS NULL OR ta.effective_to >= ?2)
      ORDER BY ta.skill`,
  ).all(userId, homNay) as { code: string; programme_code: string | null; skill: string }[];
  mon.sort((a, b) => soSanhLop(a, b));   // PR-UXF-a U1 (sort ổn định giữ thứ tự môn trong lớp)
  /* Gộp theo môn — một GV Speaking dạy 4 lớp là MỘT dòng "Lớp A, B, C, D sẽ thiếu GV môn Speaking.", không phải bốn. */
  const theoMon = new Map<string, string[]>();
  /* Gộp theo TÊN MÔN hiện ra (MH2): ô `writing` là "Writing" ở BE nhưng "Grammar + Vocabulary" ở FOU. */
  for (const m of mon) { const ten = tenMon(m.programme_code, m.skill); theoMon.set(ten, [...(theoMon.get(ten) ?? []), m.code]); }
  for (const [ten, lop] of theoMon) canhBao.push(`Lớp ${lop.join(', ')} sẽ thiếu GV môn ${ten}.`);
  /* Q12: việc đang giao cho người này. */
  const viec = (conn.prepare(
    `SELECT (SELECT COUNT(*) FROM sos_cases WHERE owner_user_id = ?1 AND status != 'done')
          + (SELECT COUNT(*) FROM case_signals WHERE owner_user_id = ?1 AND status = 'pending')
          + (SELECT COUNT(*) FROM discipline_measures WHERE owner_user_id = ?1 AND status = 'preparing')
          + (SELECT COUNT(*) FROM tasks WHERE assignee_user_id = ?1 AND completed_at IS NULL) AS n`,
  ).get(userId) as { n: number }).n;
  if (viec > 0) canhBao.push(`Còn ${viec} Case/việc đang giao cho người này — đổi người phụ trách sau khi xoá.`);
  /* OV-11b (QT-10e): TVV đang phụ trách học viên (chưa lưu trữ) — xoá thì các em không còn TVV. */
  const soHv = (conn.prepare('SELECT COUNT(*) n FROM students WHERE consultant_user_id = ?1 AND archived_at IS NULL').get(userId) as { n: number }).n;
  if (soHv > 0) canhBao.push(`${soHv} học viên sẽ không còn TVV.`);
  return {
    id: u.id, ten: u.full_name, email: u.email,
    vai: u.vai ? u.vai.split(',') : [], chiNhanh: u.chi_nhanh ? u.chi_nhanh.split(',') : [],
    soDauVet: dv.tong,
    chiTiet: [...gop].map(([nhan, so]) => ({ nhan, so })).sort((a, b) => b.so - a.so),
    cach: dv.tong > 0 ? 'mem' : 'han', chan: lyDoChan(p, u), canhBao,
  };
}

/** POST /admin/accounts/:id/xoa { emailXacNhan } — xoá hẳn hoặc xoá mềm, trong MỘT giao dịch. */
export function xoaTaiKhoan(p: Principal, userId: number, input: { emailXacNhan?: unknown }): { ok: true; cach: 'han' | 'mem' } {
  require_(p, PERMISSIONS.ADMIN_CONFIG, { anyScope: true }, CHI_ADMIN);
  const homNay = demoToday();
  const u = docNguoi(userId, homNay);
  if (u.status === 'deleted') throw badRequest(DA_XOA);
  if (String(input.emailXacNhan ?? '').trim().toLowerCase() !== (u.email ?? '').toLowerCase() || !u.email) {
    throw badRequest('Gõ lại đúng email để xác nhận xoá.');
  }
  const chan = lyDoChan(p, u);
  if (chan) throw badRequest(chan);
  return tx(() => {
    const conn = db();
    /* Tính lại TRONG giao dịch: hai Quản trị bấm cùng lúc, hoặc người này vừa ghi gì đó. */
    const soDauVet = demDauVet(userId).tong;
    const cach: 'han' | 'mem' = soDauVet > 0 ? 'mem' : 'han';
    if (cach === 'han') {
      for (const x of COT_THIET_LAP) conn.prepare(`DELETE FROM ${x.bang} WHERE ${x.cot} = ?1`).run(userId);
      conn.prepare('DELETE FROM users WHERE id = ?1').run(userId);
    } else {
      conn.prepare(
        `UPDATE users SET status = 'deleted', deleted_at = ?2, full_name = full_name || ' (đã xoá)',
                          email = 'da-xoa-' || id || '@invalid', password_hash = NULL, password_salt = NULL
          WHERE id = ?1`,
      ).run(userId, nowIso());
      for (const bang of ['demo_sessions', 'user_emails', 'user_permissions', 'user_prefs', 'task_followers', 'notifications']) {
        conn.prepare(`DELETE FROM ${bang} WHERE user_id = ?1`).run(userId);
      }
      /* `user_roles` không có effective_to — đóng như setRoles (Q11). */
      conn.prepare(`UPDATE user_roles SET status = 'ended' WHERE user_id = ?1 AND status = 'active'`).run(userId);
      conn.prepare(`UPDATE teacher_assignments SET status = 'ended', effective_to = ?2 WHERE user_id = ?1 AND status = 'active'`)
        .run(userId, homNay);
    }
    writeAudit({
      actorUserId: p.userId, action: 'user.delete', entityType: 'users', entityId: userId, entityLabel: u.full_name,
      before: { email: u.email, vai: u.vai ? u.vai.split(',') : [] }, after: { cach, soDauVet },
    });
    return { ok: true as const, cach };
  });
}
