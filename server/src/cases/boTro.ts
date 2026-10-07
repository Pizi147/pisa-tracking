import { db, tx } from '../db.ts';
import { addDays, badRequest, forbidden, notFound, nowIso } from '../util.ts';
import { PERMISSIONS, boTroGiuaKhoa, hanTheoNgay, moTaBoTro, ngay, nhomBoTro, tenMonNgan, weeklyUpdateDue } from '../../../shared/domain/index.ts';
import { classProgress } from '../classes/schedule.ts';
import { suggestCaseOwner } from './owner.ts';
import { can, isCoreTeacherOf, type Principal } from '../permissions.ts';
import { demoToday } from '../demoConfig.ts';
import { addJourney, notify, writeAudit } from '../platform/audit.ts';
import { taoYeuCau } from '../duyet/yeuCau.ts';
import { caseAccess, caseDetail } from './cases.ts';
import { chuanHoaNguoiThucHien } from './nguoiThucHien.ts';
import { chenPa } from './taoPa.ts';
import { dongBoTrangThaiCase } from './sosState.ts';
import { ghiMoc } from './sosAuto.ts';

/**
 * PA BỔ TRỢ GIỮA KHOÁ LỚP THƯỜNG (PR-LT2a, N1, M-03, M-05, Q-F) — phần ghi dữ liệu.
 *
 * PA Bổ trợ = `kind 'bo_tro'` + `preset = 1` + `moc_quy_che = 'den_cuoi_khoa'` — dùng lại trọn hạ tầng SOS v4 (chờ nguyên nhân, Xác nhận Case, Không cần
 * theo dõi, Báo QL, Ghi kết quả cuối). "Chưa chạy" = `UNCONFIRMED_PRESET` + `planned`: `confirmed_at`/`confirmed_by` chỉ được đặt bởi `chayPaBoTro`.
 * Trạng thái kế hoạch đọc từ thẻ `yeu_cau_duyet` loại `ke_hoach_bo_tro` — không dùng `approval_state`.
 */

/**
 * Hết Chủ nhật tuần Cuối khoá (mốc PA bổ trợ): lượt `final` cùng lộ trình (tuần đã xếp) → không có thì mốc của lớp (`classProgress`) → null
 * (không bịa hạn). `chưa có lịch` là chữ hiển thị của null.
 */
export function mocCuoiKhoa(cycleId: number | null, classId: number | null): string | null {
  if (cycleId) {
    const r = db().prepare(
      `SELECT rp.week_end FROM assessment_attempts a JOIN report_periods rp ON rp.id = a.planned_period_id
        WHERE a.cycle_id = ? AND a.kind = 'final' AND a.status != 'cancelled' ORDER BY a.id DESC LIMIT 1`,
    ).get(cycleId) as any;
    if (r?.week_end) return r.week_end;
  }
  const start = classId ? classProgress(classId).finalWeekStart : null;
  return start ? addDays(start, 6) : null;
}

/**
 * PA bổ trợ CHỜ (preset=1, planned, confirmed NULL) của một Case Giữa khoá. Người dạy: FOU = GVCN (Q-F) · BE/ELE = GVBM môn (suggestCaseOwner);
 * nhóm FOU đã có người dạy (dòng trước, hoặc GVCN đã đổi lúc nộp kế hoạch) thì dùng lại người đó. `han_ke_hoach` = `han_xac_nhan` của Case (M-05).
 */
export function taoPaBoTro(conn: any, x: { caseId: number; attempt: any; skill: string; category: string; ct: string | null; han: string }): number {
  const b = boTroGiuaKhoa(x.ct);
  const nhom = nhomBoTro(x.ct, x.attempt.id, x.skill);
  const truoc = b?.chung
    ? (conn.prepare('SELECT performer_user_id p FROM case_interventions WHERE nhom_bo_tro = ? AND performer_user_id IS NOT NULL ORDER BY id LIMIT 1').get(nhom) as any)?.p ?? null
    : null;
  const gvcn = () => (conn.prepare(`SELECT user_id FROM teacher_assignments WHERE class_id = ? AND is_core = 1 AND status = 'active' LIMIT 1`)
    .get(x.attempt.class_id ?? 0) as any)?.user_id ?? null;
  const nguoiDay = truoc ?? (b?.chung ? gvcn() : suggestCaseOwner({ classId: x.attempt.class_id ?? null, category: x.category }));
  return chenPa(conn, [{
    caseId: x.caseId, kind: 'bo_tro', description: moTaBoTro(x.ct, x.skill), performerUserId: nguoiDay, status: 'planned', preset: true,
    mocQuyChe: 'den_cuoi_khoa', nhomBoTro: nhom, hanKeHoach: x.han, followupDue: mocCuoiKhoa(x.attempt.cycle_id ?? null, x.attempt.class_id ?? null),
  }])[0];
}

// ==================================================================== Xác nhận Case + Nộp kế hoạch + thẻ `ke_hoach_bo_tro`

const CO_NGUYEN_NHAN = `EXISTS (SELECT 1 FROM case_issues ci WHERE ci.case_id = sc.id AND ci.role = 'primary')`;
const nhomChung = (nhom: string) => nhom.split(':').length === 2;   // `gk:{lượt}` = FOU chung · `gk:{lượt}:{môn}` = BE/ELE

/** Các dòng PA bổ trợ CÒN SỐNG của một nhóm (kèm Case) — cũ trước mới sau. */
function dongNhom(conn: any, nhom: string): any[] {
  return conn.prepare(
    `SELECT iv.*, sc.status AS case_status, sc.topic, sc.student_id, sc.cycle_id, ${CO_NGUYEN_NHAN} AS co_nn
       FROM case_interventions iv JOIN sos_cases sc ON sc.id = iv.case_id
      WHERE iv.nhom_bo_tro = ? AND iv.kind = 'bo_tro' AND iv.status != 'cancelled' ORDER BY iv.id`,
  ).all(nhom) as any[];
}
/** Id PA nhỏ nhất của nhóm (kể cả PA đã huỷ) — khoá của thẻ kế hoạch (Q4). */
const minIdNhom = (conn: any, nhom: string): number => (conn.prepare('SELECT MIN(id) m FROM case_interventions WHERE nhom_bo_tro = ?').get(nhom) as any).m as number;
/** Thẻ kế hoạch mới nhất của nhóm đang `cho` / `duyet` (không có = chờ nộp). */
const theHienHanh = (conn: any, nhom: string) => conn.prepare(
  `SELECT * FROM yeu_cau_duyet WHERE loai = 'ke_hoach_bo_tro' AND doi_tuong_loai = 'nhom_bo_tro' AND doi_tuong_id = ? AND trang_thai IN ('cho', 'duyet') ORDER BY id DESC LIMIT 1`,
).get(minIdNhom(conn, nhom)) as any;

/**
 * Ghi kết quả PA bổ trợ được: người dạy (tài khoản) · GVCN lớp · Quản lý phạm vi · GVBM đúng môn (SOS_EDIT) CHỈ với nhóm một môn (BE/ELE).
 * Không sửa `permissions.ts` (Q9). `ctx` = cột lớp/học viên/môn đã JOIN sẵn (danh sách việc) → không đọc lại Case; thiếu thì đọc `caseAccess`.
 */
export function quyenBoTro(p: Principal, iv: {
  performer_user_id: number | null; case_id: number; nhom_bo_tro: string | null;
  ctx?: { classId: number | null; studentId: number | null; topic: string | null };
}): boolean {
  if (iv.performer_user_id === p.userId) return true;
  const a = iv.ctx ? null : caseAccess(iv.case_id);
  const ctx = iv.ctx ?? { classId: a!.ctx.classId ?? null, studentId: a!.ctx.studentId ?? null, topic: a!.topic };
  if (ctx.classId && isCoreTeacherOf(p, ctx.classId)) return true;
  /* M-03 (PR-S5F-b): PA CHUNG (FOU `gk:{lượt}`) ghi một lần cho cả nhóm — GVBM một môn KHÔNG ghi thay; chỉ người dạy, GVCN, Quản lý.
     PR-LT2b (Q14): Case `tong_hop` (Pre FOU → FOU) không có ô phân công ở lớp mới — cùng luật. */
  if ((iv.nhom_bo_tro && nhomChung(iv.nhom_bo_tro)) || ctx.topic === 'tong_hop') {
    return can(p, PERMISSIONS.CASE_APPROVE, { classId: ctx.classId, studentId: ctx.studentId });
  }
  return can(p, PERMISSIONS.SOS_EDIT, { classId: ctx.classId, studentId: ctx.studentId, skill: ctx.topic ?? undefined });
}

/**
 * Nộp KẾ HOẠCH cho cả nhóm: người dạy bổ trợ của nhóm · GVCN lớp · Quản lý; BE/ELE (nhóm một dòng) thêm GVBM đúng môn. FOU: GVBM một môn
 * KHÔNG nộp hộ — kế hoạch chung do người dạy (mặc định GVCN) nộp (Q-F, M2).
 */
function coQuyenNop(p: Principal, rows: any[]): boolean {
  if (rows.some((r) => r.performer_user_id === p.userId)) return true;
  const ctx = caseAccess(rows[0].case_id).ctx;
  if (ctx.classId && isCoreTeacherOf(p, ctx.classId)) return true;
  if (can(p, PERMISSIONS.CASE_APPROVE, { classId: ctx.classId, studentId: ctx.studentId })) return true;
  return !nhomChung(rows[0].nhom_bo_tro) && rows.some((r) => can(p, PERMISSIONS.SOS_EDIT, caseAccess(r.case_id).ctx));
}

/** Người xác nhận Case này có PHẢI gửi kèm kế hoạch không (N2, Q8): Case có PA bổ trợ chưa chạy, nhóm chưa có thẻ cho/duyệt, người xác nhận nộp được. */
export function phaiGuiKemKeHoach(p: Principal, caseId: number): boolean {
  const conn = db();
  const pa = conn.prepare(`SELECT nhom_bo_tro FROM case_interventions WHERE case_id = ? AND kind = 'bo_tro' AND status = 'planned' ORDER BY id LIMIT 1`).get(caseId) as any;
  if (!pa?.nhom_bo_tro || theHienHanh(conn, pa.nhom_bo_tro)) return false;
  return coQuyenNop(p, dongNhom(conn, pa.nhom_bo_tro));
}

export const CAU_THIEU_KE_HOACH = 'Gửi kèm kế hoạch bài giảng — ghi nội dung yếu và kế hoạch (mỗi ô ít nhất 15 ký tự).';
export function kiemKeHoach(input: { noiDungYeu?: unknown; keHoach?: unknown } | null | undefined): { noiDungYeu: string; keHoach: string } {
  if (!input) throw badRequest(CAU_THIEU_KE_HOACH);
  const noiDungYeu = String(input.noiDungYeu ?? '').trim(), keHoach = String(input.keHoach ?? '').trim();
  if (noiDungYeu.length < 15) throw badRequest('Nội dung yếu cần ít nhất 15 ký tự — kiến thức / kỹ năng em đang yếu.');
  if (keHoach.length < 15) throw badRequest('Kế hoạch bài giảng cần ít nhất 15 ký tự — buổi nào dạy gì, trọng tâm, bài tập.');
  if (noiDungYeu.length > 2000 || keHoach.length > 2000) throw badRequest('Mỗi ô tối đa 2000 ký tự.');
  return { noiDungYeu, keHoach };
}

/**
 * Nộp kế hoạch bổ trợ cho CẢ NHÓM của PA `ivId` (N2, K3-28, M-05). Điều kiện: ≥ 1 Case của nhóm đã có nguyên nhân (Câu hỏi 1 = A — môn
 * xác nhận sau tự chạy theo kế hoạch đã duyệt); nhóm chưa có thẻ chờ / đã duyệt. Đổi người dạy (ChonNguoi) → mọi dòng chưa chạy của nhóm.
 * Tạo MỘT thẻ Chờ duyệt · Học thuật (3 ngày, tính cả ngày gửi) + mốc `nop_ke_hoach` ở mọi Case còn mở của nhóm.
 */
export function nopKeHoachBoTro(p: Principal, ivId: number, input: {
  noiDungYeu?: string; keHoach?: string; performerSelf?: boolean; performerUserId?: number | null; performerName?: string | null;
}) {
  const conn = db();
  const iv = conn.prepare(`SELECT * FROM case_interventions WHERE id = ? AND kind = 'bo_tro'`).get(ivId) as any;
  if (!iv?.nhom_bo_tro) throw notFound('Không tìm thấy PA bổ trợ.');
  const nhom = iv.nhom_bo_tro as string;
  const rows = dongNhom(conn, nhom).filter((r) => r.case_status !== 'done');
  if (!rows.length) throw badRequest('Các Case của nhóm đã đóng — không còn kế hoạch để nộp.');
  if (!coQuyenNop(p, rows)) throw forbidden('Chỉ người dạy bổ trợ, GVCN của lớp và Quản lý mới nộp được kế hoạch bổ trợ.');
  const the = theHienHanh(conn, nhom);
  if (the?.trang_thai === 'cho') throw badRequest('Kế hoạch bổ trợ của nhóm này đang chờ Quản lý duyệt.');
  if (the?.trang_thai === 'duyet') throw badRequest('Kế hoạch bổ trợ của nhóm này đã được duyệt.');
  if (!rows.some((r) => r.co_nn)) throw badRequest('Cần ít nhất một môn đã xác nhận nguyên nhân rồi mới nộp kế hoạch.');
  const { noiDungYeu, keHoach } = kiemKeHoach(input);
  const lop = caseAccess(rows[0].case_id).ctx.classId;
  const cn = lop ? (conn.prepare('SELECT branch_id FROM classes WHERE id = ?').get(lop) as any)?.branch_id ?? null : null;
  const nguoi = chuanHoaNguoiThucHien(p, input, { nhom: 'giao_vien', batBuoc: false, branchId: cn });
  const today = demoToday();
  return tx(() => {
    if (nguoi) {
      conn.prepare(`UPDATE case_interventions SET performer_user_id = ?, performer_name = ?, updated_at = ? WHERE nhom_bo_tro = ? AND kind = 'bo_tro' AND status = 'planned'`)
        .run(nguoi.userId, nguoi.name, nowIso(), nhom);
    }
    const id = taoYeuCau(conn, {
      loai: 'ke_hoach_bo_tro', doiTuongLoai: 'nhom_bo_tro', doiTuongId: minIdNhom(conn, nhom), hocVienId: rows[0].student_id,
      nguoiXin: p.userId, lyDo: keHoach.split('\n').slice(0, 2).join(' ').slice(0, 300), duLieu: { nhom, noiDungYeu, keHoach },
    });
    if (id === null) throw badRequest('Kế hoạch bổ trợ của nhóm này đang chờ Quản lý duyệt.');
    for (const r of rows) ghiMoc(r.case_id, 'nop_ke_hoach', today, keHoach.split('\n')[0].slice(0, 200), p.userId, `nop-ke-hoach:${id}:${r.case_id}`);
    addJourney({
      studentId: rows[0].student_id, cycleId: rows[0].cycle_id ?? null, eventType: 'intervention', eventDate: today,
      title: 'Nộp kế hoạch bổ trợ', detail: keHoach.slice(0, 300), refTable: 'yeu_cau_duyet', refId: id, createdBy: p.userId, dedupKey: `ke-hoach-bo-tro:${id}`,
    });
    writeAudit({
      actorUserId: p.userId, action: 'case.bo_tro.nop_ke_hoach', entityType: 'case_intervention', entityId: iv.id,
      entityLabel: `Nhóm ${nhom}`, after: { yeuCauId: id, soCase: rows.length },
    });
    return caseDetail(p, iv.case_id);
  });
}

/**
 * Chạy PA bổ trợ của nhóm (khi Quản lý duyệt kế hoạch, hoặc khi một môn xác nhận nguyên nhân MUỘN sau khi kế hoạch đã duyệt): dòng `planned`
 * có Case chưa đóng ĐÃ có nguyên nhân → started từ hôm nay, hạn ghi kết quả T2 tuần sau, mốc Cuối khoá, `confirmed_by` = người nộp. Chỉ hàm này
 * đặt `confirmed_at`/`confirmed_by` cho PA bổ trợ. Trả số PA vừa chạy.
 */
export function chayPaBoTro(conn: any, nhom: string, nguoiNop: number, homNay: string): number {
  const dong = conn.prepare(
    `SELECT iv.id, iv.case_id, iv.followup_due, sc.student_id, sc.cycle_id, sc.attempt_id, a.class_id
       FROM case_interventions iv JOIN sos_cases sc ON sc.id = iv.case_id LEFT JOIN assessment_attempts a ON a.id = sc.attempt_id
      WHERE iv.nhom_bo_tro = ? AND iv.kind = 'bo_tro' AND iv.status = 'planned' AND sc.status != 'done' AND ${CO_NGUYEN_NHAN}`,
  ).all(nhom) as any[];
  for (const r of dong) {
    conn.prepare(
      `UPDATE case_interventions SET status = 'started', started_date = ?, cycle_no = 1, cycle_started_on = ?, action_due = ?, followup_due = ?,
              confirmed_by = ?, confirmed_at = ?, updated_at = ? WHERE id = ?`,
    ).run(homNay, homNay, weeklyUpdateDue(homNay), r.followup_due ?? mocCuoiKhoa(r.cycle_id ?? null, r.class_id ?? null), nguoiNop, nowIso(), nowIso(), r.id);
    dongBoTrangThaiCase(r.case_id);
    addJourney({
      studentId: r.student_id, cycleId: r.cycle_id ?? null, eventType: 'intervention', eventDate: homNay,
      title: 'PA bổ trợ bắt đầu', detail: null, refTable: 'case_interventions', refId: r.id, createdBy: nguoiNop, dedupKey: `bo-tro-chay:${r.id}`,
    });
  }
  return dong.length;
}

/** Môn xác nhận nguyên nhân MUỘN khi kế hoạch của nhóm ĐÃ duyệt → PA của Case đó chạy ngay theo kế hoạch đã duyệt (Câu hỏi 1 = A). Trả số PA chạy. */
export function chayNeuKeHoachDaDuyet(conn: any, caseId: number, homNay: string, nguoiLam: number): number {
  const pa = conn.prepare(`SELECT nhom_bo_tro FROM case_interventions WHERE case_id = ? AND kind = 'bo_tro' AND status = 'planned' ORDER BY id LIMIT 1`).get(caseId) as any;
  const the = pa?.nhom_bo_tro ? theHienHanh(conn, pa.nhom_bo_tro) : null;
  return the?.trang_thai === 'duyet' ? chayPaBoTro(conn, pa.nhom_bo_tro, the.nguoi_xin ?? nguoiLam, homNay) : 0;
}

/**
 * GHI KẾT QUẢ CHÉP CẢ NHÓM (M-03, Q10): PA chung (FOU) ghi MỘT lần — các dòng KHÁC cùng nhóm đang chạy, Case chưa đóng, nhận một bản
 * `case_followups` GIỐNG HỆT (đổi case_id / intervention_id) rồi áp CÙNG cập nhật trạng thái đã áp cho dòng chính (chu kỳ mới + hạn mới, hoặc
 * khép `het_moc`; Điều chỉnh đổi người dạy cho cả nhóm). Xin ý kiến chỉ tạo MỘT thẻ (dòng chính). Trả số dòng đã chép. Chạy trong tx của `updateResult`.
 */
export function chepKetQuaNhom(conn: any, iv: any, followupId: number, x: {
  nextStep: string; observedOn: string; completedOn: string | null; lanCuoi: boolean; nextDue: string;
  apDungDieuChinh?: (sib: any, followupId: number) => void;
}): number {
  if (!iv.nhom_bo_tro) return 0;
  const f = conn.prepare('SELECT * FROM case_followups WHERE id = ?').get(followupId) as any;
  const anhEm = conn.prepare(
    `SELECT iv.* FROM case_interventions iv JOIN sos_cases sc ON sc.id = iv.case_id
      WHERE iv.nhom_bo_tro = ? AND iv.kind IN ('bo_tro', 'bo_tro_mien_phi') AND iv.id != ? AND iv.status = 'started' AND sc.status != 'done' ORDER BY iv.id`,
  ).all(iv.nhom_bo_tro, iv.id) as any[];
  for (const s of anhEm) {
    const info = conn.prepare(
      `INSERT INTO case_followups (case_id, intervention_id, observed_on, observer_user_id, outcome, note, evidence_attempt_id, next_step, cycle_no, cycle_due,
                                   late, metrics, remaining_issue, decision_note, created_at, phu_trach_user_id, phu_trach_ten)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    ).run(s.case_id, s.id, f.observed_on, f.observer_user_id, f.outcome, f.note, f.evidence_attempt_id, f.next_step, f.cycle_no, f.cycle_due,
          f.late, f.metrics, f.remaining_issue, f.decision_note, nowIso(), f.phu_trach_user_id, f.phu_trach_ten);
    if (x.nextStep === 'complete') {
      conn.prepare(`UPDATE case_interventions SET status = 'completed', completed_date = ?, closed_reason = ?, started_date = COALESCE(started_date, cycle_started_on, ?), updated_at = ? WHERE id = ?`)
        .run(x.completedOn, x.lanCuoi ? 'het_moc' : 'done', x.completedOn, nowIso(), s.id);
    } else {
      conn.prepare(`UPDATE case_interventions SET status = 'started', cycle_no = ?, cycle_started_on = ?, action_due = ?, started_date = COALESCE(started_date, ?), updated_at = ? WHERE id = ?`)
        .run((s.cycle_no ?? 1) + 1, x.observedOn, x.nextDue, x.observedOn, nowIso(), s.id);
      if (x.nextStep === 'adjust') x.apDungDieuChinh?.(s, Number(info.lastInsertRowid));
    }
    dongBoTrangThaiCase(s.case_id);
  }
  return anhEm.length;
}

/** Quản lý DUYỆT thẻ kế hoạch — chạy TRONG tx của hộp (không mở tx riêng, không nuốt lỗi — K5). */
export function khiDuyetKeHoach(p: Principal, yc: { du_lieu: string | null; nguoi_xin: number | null }) {
  const conn = db();
  const d = JSON.parse(yc.du_lieu ?? '{}') as { nhom: string };
  const today = demoToday();
  chayPaBoTro(conn, d.nhom, yc.nguoi_xin ?? p.userId, today);
  for (const r of dongNhom(conn, d.nhom)) if (r.case_status !== 'done') ghiMoc(r.case_id, 'ke_hoach_duyet', today, null, p.userId, `ke-hoach-duyet:${d.nhom}:${r.case_id}:${today}`);
}

/** Quản lý TỪ CHỐI (lý do bắt buộc ở hộp): giữ nguyên nhân, nộp lại kế hoạch với hạn mới 3 ngày (Q6); người dạy nhận thông báo. */
export function khiTuChoiKeHoach(p: Principal, yc: { id: number; du_lieu: string | null; nguoi_xin: number | null }, lyDo: string) {
  const conn = db();
  const d = JSON.parse(yc.du_lieu ?? '{}') as { nhom: string };
  const today = demoToday();
  const hanMoi = hanTheoNgay(today, 3);   // Q6: nộp lại kế hoạch trong 3 ngày — không phải hạn xác nhận (PR-HAN không đổi)
  const dong = dongNhom(conn, d.nhom).filter((r) => r.case_status !== 'done');
  conn.prepare(`UPDATE case_interventions SET han_ke_hoach = ?, updated_at = ? WHERE nhom_bo_tro = ? AND kind = 'bo_tro' AND status = 'planned'`)
    .run(hanMoi, nowIso(), d.nhom);
  for (const r of dong) ghiMoc(r.case_id, 'ke_hoach_tu_choi', today, lyDo, p.userId, `ke-hoach-tu-choi:${yc.id}:${r.case_id}`);
  const nguoiDay = dong.find((r) => r.performer_user_id)?.performer_user_id as number | undefined;
  for (const uid of new Set([nguoiDay, yc.nguoi_xin].filter((x): x is number => !!x && x !== p.userId))) {
    notify({
      userId: uid, kind: 'sos', title: 'Bị từ chối · Kế hoạch bổ trợ', body: `${lyDo.slice(0, 120)} — nộp lại trước ${ngay(hanMoi, today)}.`,
      entityType: 'sos_case', entityId: dong[0]?.case_id ?? null, dedupKey: `ke-hoach-tu-choi:${yc.id}:${uid}`,
    });
  }
}

export type BoTroDto = {
  nhom: string; buoiMoiTuan: 1 | 2; chung: boolean;
  /** Mỗi môn của nhóm: Case, tên môn ngắn, đã có nguyên nhân chưa, Mô tả Xác nhận Case (nguyên nhân) — cho khung Kế hoạch. */
  mon: { caseId: number; mon: string; tenMon: string; coNguyenNhan: boolean; moTa: string | null }[];
  nguoiDay: { userId: number | null; ten: string | null } | null;
  keHoach: { trangThai: 'cho' | 'duyet' | 'tu_choi'; noiDungYeu: string; keHoach: string; lyDoTuChoi: string | null; hanDuyet: string | null } | null;
  hanKeHoach: string | null; coTheNop: boolean;
  /** Người xem PHẢI gửi kèm kế hoạch khi Xác nhận Case này (như `phaiGuiKemKeHoach`) — form Xác nhận Case hiện khối Kế hoạch. */
  phaiGuiKem: boolean;
  /** Ngày mốc Cuối khoá của PA (`followup_due`) — web dựng chữ `đến Cuối khoá · W4 OCT` qua `mocChuBoTro`. */
  denKhi: string | null;
};

/** Khối `boTro` cho Ngăn Case và thẻ Case — đọc THEO TẬP (một câu mỗi bảng), không hỏi từng Case. Case không có PA bổ trợ → không có khoá. */
export function boTroCuaCase(p: Principal, caseIds: number[]): Map<number, BoTroDto> {
  const out = new Map<number, BoTroDto>();
  if (!caseIds.length) return out;
  const conn = db();
  const ph = caseIds.map(() => '?').join(',');
  const dong = conn.prepare(
    `SELECT iv.id, iv.case_id, iv.nhom_bo_tro, iv.status, iv.performer_user_id, iv.performer_name, iv.han_ke_hoach, iv.followup_due, u.full_name AS ten_gv,
            sc.topic, sc.summary, sc.status AS case_status, sc.student_id, cy.programme_code AS ct, ${CO_NGUYEN_NHAN} AS co_nn,
            (SELECT MIN(i2.id) FROM case_interventions i2 WHERE i2.nhom_bo_tro = iv.nhom_bo_tro) AS min_id
       FROM case_interventions iv JOIN sos_cases sc ON sc.id = iv.case_id LEFT JOIN users u ON u.id = iv.performer_user_id
       LEFT JOIN learning_cycles cy ON cy.id = sc.cycle_id
      WHERE iv.kind = 'bo_tro' AND iv.status != 'cancelled'
        AND iv.nhom_bo_tro IN (SELECT nhom_bo_tro FROM case_interventions WHERE case_id IN (${ph}) AND kind = 'bo_tro' AND nhom_bo_tro IS NOT NULL)
      ORDER BY iv.id`,
  ).all(...caseIds) as any[];
  if (!dong.length) return out;
  const theoNhom = new Map<string, any[]>();
  for (const r of dong) theoNhom.set(r.nhom_bo_tro, [...(theoNhom.get(r.nhom_bo_tro) ?? []), r]);
  const minIds = [...new Set(dong.map((r) => r.min_id as number))];
  const the = new Map<number, any>();
  for (const y of conn.prepare(
    `SELECT * FROM yeu_cau_duyet WHERE loai = 'ke_hoach_bo_tro' AND doi_tuong_loai = 'nhom_bo_tro' AND doi_tuong_id IN (${minIds.map(() => '?').join(',')}) ORDER BY id`,
  ).all(...minIds) as any[]) the.set(y.doi_tuong_id, y);   // thẻ mới nhất ghi đè
  const nopDuoc = new Map<string, boolean>(), guiKem = new Map<string, boolean>();
  for (const [nhom, rows] of theoNhom) {
    const y = the.get(rows[0].min_id);
    const mo = rows.filter((r) => r.case_status !== 'done');
    const khongThe = !(y?.trang_thai === 'cho' || y?.trang_thai === 'duyet');
    const quyen = khongThe && mo.length > 0 && coQuyenNop(p, mo);
    guiKem.set(nhom, quyen);
    nopDuoc.set(nhom, quyen && mo.some((r) => r.co_nn));
  }
  for (const cid of caseIds) {
    const r0 = dong.find((r) => r.case_id === cid);
    if (!r0) continue;
    const rows = theoNhom.get(r0.nhom_bo_tro)!;
    const b = boTroGiuaKhoa(r0.ct) ?? { buoiMoiTuan: 1 as const, chung: nhomChung(r0.nhom_bo_tro) };
    const y = the.get(r0.min_id);
    const d = y ? (JSON.parse(y.du_lieu ?? '{}') as { noiDungYeu?: string; keHoach?: string }) : null;
    const gv = rows.find((r) => r.performer_user_id || r.performer_name);
    out.set(cid, {
      nhom: r0.nhom_bo_tro, buoiMoiTuan: b.buoiMoiTuan, chung: b.chung,
      mon: rows.map((r) => ({ caseId: r.case_id, mon: r.topic, tenMon: tenMonNgan(r.ct, r.topic), coNguyenNhan: !!r.co_nn, moTa: r.co_nn ? r.summary ?? null : null })),
      nguoiDay: gv ? { userId: gv.performer_user_id ?? null, ten: gv.ten_gv ?? gv.performer_name ?? null } : null,
      keHoach: y && (y.trang_thai === 'cho' || y.trang_thai === 'duyet' || y.trang_thai === 'tu_choi')
        ? { trangThai: y.trang_thai, noiDungYeu: d?.noiDungYeu ?? '', keHoach: d?.keHoach ?? '', lyDoTuChoi: y.ly_do_tu_choi ?? null, hanDuyet: y.han_duyet ?? null } : null,
      hanKeHoach: rows.map((r) => r.han_ke_hoach as string | null).filter(Boolean).sort()[0] ?? null,
      coTheNop: nopDuoc.get(r0.nhom_bo_tro) ?? false,
      phaiGuiKem: (guiKem.get(r0.nhom_bo_tro) ?? false) && r0.status === 'planned',
      denKhi: rows.map((r) => r.followup_due as string | null).filter(Boolean).sort()[0] ?? null,
    });
  }
  return out;
}
