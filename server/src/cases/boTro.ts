import { db } from '../db.ts';
import { addDays, nowIso } from '../util.ts';
import { PERMISSIONS, boTroGiuaKhoa, hanKyGhiKetQua, moTaBoTro, nhomBoTro, tenMonNgan } from '../../../shared/domain/index.ts';
import { classProgress } from '../classes/schedule.ts';
import { suggestCaseOwner } from './owner.ts';
import { can, isCoreTeacherOf, type Principal } from '../permissions.ts';
import { addJourney } from '../platform/audit.ts';
import { caseAccess } from './cases.ts';
import { chenPa } from './taoPa.ts';
import { dongBoTrangThaiCase } from './sosState.ts';

/**
 * PA BỔ TRỢ GIỮA KHOÁ LỚP THƯỜNG (PR-LT2a, N1, M-03, Q-F) — phần ghi dữ liệu.
 *
 * PA Bổ trợ = `kind 'bo_tro'` + `preset = 1` + `moc_quy_che = 'den_cuoi_khoa'` — dùng lại trọn hạ tầng SOS v4 (chờ nguyên nhân, Xác nhận Case, Không cần
 * theo dõi, Báo QL, Ghi kết quả cuối). "Chưa chạy" = `UNCONFIRMED_PRESET` + `planned`: `confirmed_at`/`confirmed_by` chỉ được đặt bởi `chayPaBoTro`.
 * PR-CT2 (§8): BỎ nộp / duyệt kế hoạch bài giảng — PA chạy ngay khi Xác nhận Case (`xacNhanCase`). Thẻ `ke_hoach_bo_tro` cũ chỉ còn để đọc lịch sử.
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
 * PA bổ trợ CHỜ (preset=1, planned, confirmed NULL) của một Case Giữa khoá — chạy khi Case được xác nhận. Người dạy: FOU = GVCN (Q-F) ·
 * BE/ELE = GVBM môn (suggestCaseOwner); nhóm FOU đã có người dạy (dòng trước) thì dùng lại người đó.
 */
export function taoPaBoTro(conn: any, x: { caseId: number; attempt: any; skill: string; category: string; ct: string | null }): number {
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
    mocQuyChe: 'den_cuoi_khoa', nhomBoTro: nhom, followupDue: mocCuoiKhoa(x.attempt.cycle_id ?? null, x.attempt.class_id ?? null),
  }])[0];
}

const CO_NGUYEN_NHAN = `EXISTS (SELECT 1 FROM case_issues ci WHERE ci.case_id = sc.id AND ci.role = 'primary')`;
export const nhomChung = (nhom: string) => nhom.split(':').length === 2;   // `gk:{lượt}` = FOU chung · `gk:{lượt}:{môn}` = BE/ELE

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
 * Chạy PA bổ trợ của nhóm (PR-CT2: ngay khi Xác nhận Case; migrate B cho nhóm cũ còn chờ kế hoạch): dòng `planned` có Case chưa đóng ĐÃ có nguyên
 * nhân → started từ hôm nay, hạn ghi kết quả T2 tuần sau, mốc Cuối khoá, `confirmed_by` = người xác nhận. FOU nhóm chung: môn chưa có nguyên nhân
 * chờ tới khi được xác nhận. Chỉ hàm này đặt `confirmed_at`/`confirmed_by` cho PA bổ trợ. Trả số PA vừa chạy.
 */
export function chayPaBoTro(conn: any, nhom: string, nguoiNop: number | null, homNay: string): number {
  const dong = conn.prepare(
    `SELECT iv.id, iv.case_id, iv.followup_due, sc.student_id, sc.cycle_id, sc.attempt_id, a.class_id
       FROM case_interventions iv JOIN sos_cases sc ON sc.id = iv.case_id LEFT JOIN assessment_attempts a ON a.id = sc.attempt_id
      WHERE iv.nhom_bo_tro = ? AND iv.kind = 'bo_tro' AND iv.status = 'planned' AND sc.status != 'done' AND ${CO_NGUYEN_NHAN}`,
  ).all(nhom) as any[];
  /* Nhóm chung đã có dòng chạy (môn xác nhận trước) → môn sau nhận đúng người dạy hiện tại của nhóm (có thể đã đổi qua Sửa PA). */
  const anh = dong.length
    ? conn.prepare(`SELECT performer_user_id, performer_name FROM case_interventions WHERE nhom_bo_tro = ? AND kind = 'bo_tro' AND status = 'started' ORDER BY id LIMIT 1`).get(nhom) as any
    : null;
  for (const r of dong) {
    if (anh) conn.prepare('UPDATE case_interventions SET performer_user_id = ?, performer_name = ? WHERE id = ?').run(anh.performer_user_id ?? null, anh.performer_name ?? null, r.id);
    conn.prepare(
      `UPDATE case_interventions SET status = 'started', started_date = ?, cycle_no = 1, cycle_started_on = ?, action_due = ?, followup_due = ?,
              confirmed_by = ?, confirmed_at = ?, updated_at = ? WHERE id = ?`,
    ).run(homNay, homNay, hanKyGhiKetQua(homNay), r.followup_due ?? mocCuoiKhoa(r.cycle_id ?? null, r.class_id ?? null), nguoiNop, nowIso(), nowIso(), r.id);
    dongBoTrangThaiCase(r.case_id);
    addJourney({
      studentId: r.student_id, cycleId: r.cycle_id ?? null, eventType: 'intervention', eventDate: homNay,
      title: 'PA bổ trợ bắt đầu', detail: null, refTable: 'case_interventions', refId: r.id, createdBy: nguoiNop, dedupKey: `bo-tro-chay:${r.id}`,
    });
  }
  return dong.length;
}

/** Các dòng KHÁC cùng nhóm bổ trợ đang chạy, Case chưa đóng — Kết quả / Điều chỉnh / Sửa PA (PR-PA) áp cả nhóm. */
export function anhEmNhom(conn: any, iv: { id: number; nhom_bo_tro: string | null }): any[] {
  if (!iv.nhom_bo_tro) return [];
  return conn.prepare(
    `SELECT iv.* FROM case_interventions iv JOIN sos_cases sc ON sc.id = iv.case_id
      WHERE iv.nhom_bo_tro = ? AND iv.kind IN ('bo_tro', 'bo_tro_mien_phi') AND iv.id != ? AND iv.status = 'started' AND sc.status != 'done' ORDER BY iv.id`,
  ).all(iv.nhom_bo_tro, iv.id) as any[];
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
  const anhEm = anhEmNhom(conn, iv);
  for (const s of anhEm) {
    const info = conn.prepare(
      `INSERT INTO case_followups (case_id, intervention_id, observed_on, observer_user_id, outcome, note, evidence_attempt_id, next_step, cycle_no, cycle_due,
                                   late, metrics, remaining_issue, decision_note, created_at, phu_trach_user_id, phu_trach_ten, so_buoi)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    ).run(s.case_id, s.id, f.observed_on, f.observer_user_id, f.outcome, f.note, f.evidence_attempt_id, f.next_step, f.cycle_no, f.cycle_due,
          f.late, f.metrics, f.remaining_issue, f.decision_note, nowIso(), f.phu_trach_user_id, f.phu_trach_ten, f.so_buoi);   // PR-PA: Số buổi + Người dạy tuần này
    if (x.nextStep === 'complete') {
      conn.prepare(`UPDATE case_interventions SET status = 'completed', completed_date = ?, closed_reason = ?, started_date = COALESCE(started_date, cycle_started_on, ?), updated_at = ? WHERE id = ?`)
        .run(x.completedOn, x.lanCuoi ? 'het_moc' : 'done', x.completedOn, nowIso(), s.id);
    } else {
      conn.prepare(`UPDATE case_interventions SET status = 'started', cycle_no = ?, cycle_started_on = ?, action_due = ?, started_date = COALESCE(started_date, cycle_started_on, ?), updated_at = ? WHERE id = ?`)
        .run((s.cycle_no ?? 1) + 1, x.observedOn, x.nextDue, x.observedOn, nowIso(), s.id);
      if (x.nextStep === 'adjust') x.apDungDieuChinh?.(s, Number(info.lastInsertRowid));
    }
    dongBoTrangThaiCase(s.case_id);
  }
  return anhEm.length;
}

export type BoTroDto = {
  nhom: string; buoiMoiTuan: 1 | 2; chung: boolean;
  /** Mỗi môn của nhóm: Case, tên môn ngắn (PR-CT2: bỏ nguyên nhân / Mô tả / người dạy / mốc — chỉ form kế hoạch đã xoá đọc). */
  mon: { caseId: number; mon: string; tenMon: string }[];
};

/** Khối `boTro` cho Ngăn Case và thẻ Case — đọc THEO TẬP (một câu), không hỏi từng Case. Case không có PA bổ trợ → không có khoá. */
export function boTroCuaCase(caseIds: number[]): Map<number, BoTroDto> {
  const out = new Map<number, BoTroDto>();
  if (!caseIds.length) return out;
  const conn = db();
  const ph = caseIds.map(() => '?').join(',');
  const dong = conn.prepare(
    `SELECT iv.case_id, iv.nhom_bo_tro, sc.topic, cy.programme_code AS ct
       FROM case_interventions iv JOIN sos_cases sc ON sc.id = iv.case_id LEFT JOIN learning_cycles cy ON cy.id = sc.cycle_id
      WHERE iv.kind = 'bo_tro' AND iv.status != 'cancelled'
        AND iv.nhom_bo_tro IN (SELECT nhom_bo_tro FROM case_interventions WHERE case_id IN (${ph}) AND kind = 'bo_tro' AND nhom_bo_tro IS NOT NULL)
      ORDER BY iv.id`,
  ).all(...caseIds) as any[];
  if (!dong.length) return out;
  const theoNhom = new Map<string, any[]>();
  for (const r of dong) theoNhom.set(r.nhom_bo_tro, [...(theoNhom.get(r.nhom_bo_tro) ?? []), r]);
  for (const cid of caseIds) {
    const r0 = dong.find((r) => r.case_id === cid);
    if (!r0) continue;
    const rows = theoNhom.get(r0.nhom_bo_tro)!;
    const b = boTroGiuaKhoa(r0.ct) ?? { buoiMoiTuan: 1 as const, chung: nhomChung(r0.nhom_bo_tro) };
    out.set(cid, {
      nhom: r0.nhom_bo_tro, buoiMoiTuan: b.buoiMoiTuan, chung: b.chung,
      mon: rows.map((r) => ({ caseId: r.case_id, mon: r.topic, tenMon: tenMonNgan(r.ct, r.topic) })),
    });
  }
  return out;
}
