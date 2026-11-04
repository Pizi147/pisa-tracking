import { capNhatConOCho } from './conOCho.ts';
import { db, tx } from '../db.ts';
import {
  ASSESSED_SKILLS, ASSESSED_SKILL_LABEL, PERMISSIONS, duocHoanTacVang, kiemLyDoThaoTac, laMtCuKyNang, tenMon, tenMonNgan, tuanLich,
  type AssessedSkill,
} from '../../../shared/domain/index.ts';
import { assessedSkillOf, entrySkillsOf } from './scoring.ts';
import { addDays, badRequest, forbidden, notFound, nowIso, loi } from '../util.ts';
import { chanVangLopKetThuc } from './hoanTat.ts';
import { can, isCoreTeacherOf, scoreEditPath, teachesClass, type Principal } from '../permissions.ts';
import { demoToday } from '../demoConfig.ts';
import { writeAudit, notify } from '../platform/audit.ts';
import { nho } from '../platform/nguCanhRequest.ts';
import { chotYeuCau } from '../duyet/yeuCau.ts';
import { ensurePeriod, mondayOf, skillScoreDeadline } from '../platform/week.ts';
import {
  checkSkillWeekMove, ensureSkillRows, kiemVuot, logSchedule, recomputeCompletionWeek, scoringModeOf, tinhLaiMtCu, tuanCuoiSauKhiDoi,
} from './skillSchedule.ts';
import { refreshOutcome, resultOf, setSkillSkip } from './attempts.ts';

/**
 * VẮNG MOCK TEST — nơi sở hữu DUY NHẤT của luật "-" (N38, chủ SP 05/11 — đặc tả `2026-11-04-luat-mt-thong-nhat-design.md`).
 *
 * Người dùng đoán được web làm gì chỉ từ ba câu, và mã ở đây giữ đúng ba câu đó:
 *
 *   1. GÕ "-" LÀ DỜI SANG TUẦN SAU — tuần ngay sau TUẦN THI của kỹ năng đó (không theo tuần hiện tại: xử lý muộn không âm thầm cho thêm tuần).
 *      Vướng lượt khác / MT0 thì vẫn dời, chỉ cảnh báo như dời tay. "-" không bao giờ sinh thẻ chờ Quản lý (L1, L4).
 *   2. VẮNG 2 LẦN LÀ HUỶ — tính từ lần xếp tay gần nhất. Không chuông, không thẻ, không việc, không "Xin dời"; kỹ năng huỷ là ĐÃ XONG (thiếu),
 *      không chặn đợt (L2). MT cũ của kỹ năng (tuần thi cách ≥ 2 tuần) "-" = Không dự thi: không đếm, không dời (L3).
 *   3. CHỌN TUẦN LÀ XẾP LẠI TỪ ĐẦU — `setSkillWeek` đặt lần vắng về 0, xoá dấu "-" cũ, rút thẻ cũ (L5). Bỏ "-" đã chốt trừ một lần (L7, `goVangDaChot`).
 *
 * Bộ đếm `absence_move_count` là MỘT số: "-" +1 · chọn tuần = 0 · Bỏ vắng −1. Thẻ "Dời lịch Test" cũ còn trong DB (trước N38) vẫn duyệt / từ
 * chối / hết hạn như cũ (`decideAbsenceMove`, `sweepExpiredMoves`) — không tạo thẻ mới.
 */

export type MoveRequest = {
  id: number;
  /** TL-VIEC: mã tuần đích, đọc cùng câu đề nghị đang chờ (`indexOfPending`). */
  to_code?: string | null;
  attempt_id: number;
  skill: AssessedSkill;
  move_no: number;
  from_period_id: number | null;
  to_period_id: number;
  reason: string | null;
  requested_by: number | null;
  requested_on: string;
  decide_by: string;
  status: string;
  decided_by: number | null;
  decided_at: string | null;
  decision_note: string | null;
  cancelled_part: number;
};

const skillName = (s: string) => tenMon(null, s);   // gồm cả tong_hop (Pre FOU) — không hiện mã máy

/** Lớp thường huỷ LỊCH HẸN, Fast Track huỷ PHẦN THI. Hai hệ quả khác nhau (mục 10.6). */
function isRatio(attempt: any): boolean {
  return scoringModeOf(attempt) === 'ratio';
}

function loadAttempt(attemptId: number): any {
  const a = db().prepare('SELECT * FROM assessment_attempts WHERE id = ?').get(attemptId) as any;
  if (!a) throw notFound('Không tìm thấy lượt kiểm tra');
  return a;
}

/**
 * AI ĐƯỢC ĐỀ NGHỊ DỜI DO VẮNG: giáo viên chủ nhiệm của lớp, hoặc người có quyền xếp lịch.
 *
 * Giáo viên bộ môn báo "không thấy bài" là một việc khác — xác minh em vắng hay chưa thi là
 * việc của GVCN (mục 10.6), vì chỉ họ mới biết hôm đó em có đi học không.
 */
export function canRequest(p: Principal, attempt: any): boolean {
  if (can(p, PERMISSIONS.PLAN_WEEK, { classId: attempt.class_id, studentId: attempt.student_id })) return true;
  return !!attempt.class_id && isCoreTeacherOf(p, attempt.class_id);
}

/** Duyệt và khôi phục là việc của QUẢN LÝ — không phải một quyền GVCN có sẵn. */
function canDecide(p: Principal, attempt: any): boolean {
  return can(p, PERMISSIONS.PLAN_WEEK, { classId: attempt.class_id, studentId: attempt.student_id });
}

/*
 * SỔ TRA ĐỀ NGHỊ ĐANG CHỜ — nạp MỘT LẦN cho cả màn hình (bảng lớp vẽ vài trăm ô lịch; hỏi từng ô là N+1).
 * PR-DUYET (K5-28): nhớ THEO REQUEST (`nho`), không còn biến sống suốt tiến trình — trên Netlify nhiều tiến trình chạy song song,
 * sổ của tiến trình này không biết tiến trình kia vừa ghi. `nho` chỉ nhớ trong GET và tự xoá khi request ghi bất cứ gì.
 */
function indexOfPending(): Map<string, MoveRequest> {
  return nho('de-nghi-doi', () => {
    const rows = db()
      .prepare(`SELECT r.*, pr.code AS to_code FROM skill_move_requests r LEFT JOIN report_periods pr ON pr.id = r.to_period_id WHERE r.status = 'pending' ORDER BY r.id`)
      .all() as MoveRequest[];
    const m = new Map<string, MoveRequest>();
    for (const r of rows) m.set(`${r.attempt_id}:${r.skill}`, r);
    return m;
  });
}

/**
 * PR-MT: RÚT đề nghị dời đang chờ — một kỹ năng (Quản lý sửa trạng thái thi KHỎI "vắng") hoặc CẢ LƯỢT (`skill` bỏ trống: huỷ cả lượt,
 * tạo lại số đã huỷ). Không rút thì đề nghị hết hạn sẽ huỷ phần thi (C09) của một bài không còn vắng / của lượt vừa xếp lại.
 * Gọi trong tx của nơi gọi.
 */
export function rutDeNghiDoi(attemptId: number, skill?: string): number {
  const conn = db();
  const ids = (conn.prepare(`SELECT id FROM skill_move_requests WHERE attempt_id = ? AND status = 'pending'${skill ? ' AND skill = ?' : ''}`)
    .all(attemptId, ...(skill ? [skill] : [])) as any[]).map((r) => r.id as number);
  for (const id of ids) {
    conn.prepare(`UPDATE skill_move_requests SET status = 'withdrawn', updated_at = ? WHERE id = ? AND status = 'pending'`).run(nowIso(), id);
    /* Thẻ Lịch thi của đề nghị này (PR-DUYET) đóng cùng lúc — không để thẻ chờ cho một đề nghị đã rút. */
    chotYeuCau(conn, { loai: 'lich_thi', doiTuongLoai: 'skill_move', doiTuongId: id }, 'tu_dong',
      { lyDo: skill ? 'Rút — bài không còn vắng' : 'Rút — lượt đã huỷ' });
  }
  return ids.length;
}

/** Đề nghị đang chờ của một kỹ năng, nếu có. */
export function pendingMove(attemptId: number, skill: string): MoveRequest | null {
  return indexOfPending().get(`${attemptId}:${skill}`) ?? null;
}

/** Đề nghị đang chờ của nhiều đợt cùng lúc — để màn hình không phải hỏi từng dòng. */
export function pendingMovesFor(attemptIds: number[]): Map<string, MoveRequest> {
  const all = indexOfPending();
  const want = new Set(attemptIds);
  const out = new Map<string, MoveRequest>();
  for (const [k, r] of all) if (want.has(r.attempt_id)) out.set(k, r);
  return out;
}

/**
 * TUẦN KẾ TIẾP CỦA LỊCH ĐANG CÓ — không phải tuần kế tiếp của HÔM NAY (mục 10.6).
 *
 * Đây là chỗ một dòng code tưởng vô hại đổi hẳn nghĩa của luật: lấy tuần sau của hôm nay
 * thì một GVCN xử lý muộn ba tuần vừa cho em thêm ba tuần, mà bộ đếm vẫn chỉ nhích một.
 */
function nextWeekOf(weekStart: string): { id: number; code: string; week_start: string } {
  const w = ensurePeriod(addDays(weekStart, 7));
  return { id: w.id, code: w.code, week_start: w.weekStart };
}

/**
 * TUẦN ĐÍCH MẶC ĐỊNH của đề nghị dời lần 2 (K4-04): tuần CHƯA BẮT ĐẦU gần nhất mà luật thứ tự đợt (T15) không chặn — thử tối đa 8
 * tuần; không có → null (Quản lý tự chọn). Xuất cho PR-DUYET (thẻ Lịch thi).
 */
export function tuanDichMacDinh(attemptId: number, skill: string, today: string): { id: number; code: string; week_start: string } | null {
  for (let i = 1; i <= 8; i += 1) {
    const w = ensurePeriod(addDays(mondayOf(today), 7 * i));   // thứ Hai tuần sau trở đi = tuần CHƯA bắt đầu
    if (!checkSkillWeekMove({ attemptId, skill: skill as AssessedSkill, newWeekStart: w.weekStart }).blockers.length) {
      return { id: w.id, code: w.code, week_start: w.weekStart };
    }
  }
  return null;
}

/** Chữ thẻ "Dời lịch MT lần 2" (tiêu đề thẻ Lịch thi ở hộp Chờ duyệt): `Dời S · MT3 · lần 2 · Duyệt = S thi W2 OCT`. Hàm thuần. */
export function chuTheDoiLan2(o: { skill: string; attemptNo: number | null; moveNo: number; tuanDich: string | null; homNay: string; ct?: string | null }): string {
  const k = tenMonNgan(o.ct ?? null, o.skill);   // MH2: tên môn theo chương trình lớp (FOU G+V/P)
  return `Dời ${k} · MT${o.attemptNo ?? '?'} · lần ${o.moveNo} · Duyệt = ${k} làm bài ${o.tuanDich ? tuanLich(o.tuanDich, o.homNay) : '—'}`;
}

export type MoveOutcome = {
  skill: AssessedSkill;
  /** `moved` đã dời tuần sau tuần thi (L1) · `huy-vang` vắng lần 2 → huỷ (L2). */
  result: 'moved' | 'huy-vang';
  toWeek: string | null;
  moveNo: number;
  /** L4: tuần đích vướng lượt khác / MT0 — vẫn dời, câu cảnh báo như dời tay. */
  canhBao: string | null;
  message: string;
};

/**
 * LÕI XỬ LÝ VẮNG MỘT KỸ NĂNG (N38 L1, L2, L4) — máy chạy ngay lúc chốt "-" / nút Vắng. Nơi gọi đã kiểm bài `absent`, có tuần, không phải MT cũ
 * của kỹ năng (L3 đi nhánh Không dự thi trước khi tới đây). Gọi trong tx của nơi gọi. `actor = null` = máy.
 */
function xuLyVangMotKyNang(conn: any, actor: number | null, attempt: any, row: any, o: { lyDo: string | null }): MoveOutcome {
  const skill = row.skill as AssessedSkill;
  const moveNo = row.absence_move_count + 1;
  if (moveNo >= 2) return huyVangNoi(conn, actor, attempt, row, moveNo);
  const target = nextWeekOf(row.week_start);
  /* L4: vướng thứ tự đợt (MT0 trước MT1) hay trùng / sát lượt khác → VẪN dời; câu chặn / cảnh báo của dời tay thành cảnh báo. */
  const check = checkSkillWeekMove({ attemptId: attempt.id, skill, newWeekStart: target.week_start });
  const vuot = kiemVuot(attempt.id, tuanCuoiSauKhiDoi(ensureSkillRows(attempt.id), new Map([[skill, target.week_start]]))!, target.week_start).chan;
  const canhBao = [vuot, ...check.blockers, ...check.warnings].filter(Boolean).join(' ') || null;
  applyMove(conn, actor, attempt, row, target, o.lyDo, moveNo, actor === null);
  return {
    skill, result: 'moved', toWeek: target.code, moveNo, canhBao,
    message: `${skillName(skill)} đã dời sang tuần ${target.code} (vắng lần 1).${canhBao ? ` ${canhBao}` : ''}`,
  };
}

/**
 * N38 L2: huỷ một kỹ năng vì vắng lần `moveNo` (≥ 2) — `sit_status = 'cancelled'` + `huy_vang = 1`, giữ tuần cũ để tra lại. Kỹ năng huỷ là
 * ĐÃ XONG (thiếu): không chuông, không thẻ, không việc. Muốn xếp lại thì chọn tuần (L5). Gọi trong tx của nơi gọi.
 */
function huyVangNoi(conn: any, actor: number | null, attempt: any, row: any, moveNo: number): MoveOutcome {
  const skill = row.skill as AssessedSkill;
  conn.prepare(`UPDATE attempt_skills SET sit_status = 'cancelled', huy_vang = 1, absent_from_no_show = 0, updated_at = ? WHERE id = ?`).run(nowIso(), row.id);
  logSchedule(attempt.id, { action: 'skill_cancelled_absence', field: skill, oldValue: row.period_code, newValue: null, reason: `Vắng lần ${moveNo}`, actor });
  recomputeCompletionWeek(attempt.id, actor);
  writeAudit({
    actorUserId: actor, action: 'attempt.huy_vang', entityType: 'assessment_attempt', entityId: attempt.id,
    entityLabel: `MT${attempt.attempt_no} · ${skill}`, before: { sitStatus: row.sit_status, week: row.period_code }, after: { sitStatus: 'cancelled', lan: moveNo },
  });
  return {
    skill, result: 'huy-vang', toWeek: null, moveNo, canhBao: null,
    message: `${skillName(skill)}: vắng ${moveNo} lần — đã huỷ. Muốn xếp lại thì chọn tuần (Dời).`,
  };
}

/** Thẻ dời cũ (trước N38) của kỹ năng huỷ vắng 2 lần bị từ chối = bỏ khỏi đợt, như cũ. */
function khongMockLaiNoi(p: Principal, attemptId: number, skill: string, lyDo?: string | null) {
  rutDeNghiDoi(attemptId, skill);
  setSkillSkip(p, attemptId, skill, true, lyDo?.trim() || 'Không mock lại', { khongMockLai: true });
}

/** Đổi tuần và TĂNG bộ đếm — chỉ đường đi qua đây mới được tính là một lần dời do vắng. */
function applyMove(
  conn: any, actor: number | null, attempt: any, row: any,
  target: { id: number; code: string }, reason: string | null, moveNo: number, mayTuDoi = false,
) {
  conn
    .prepare(
      `UPDATE attempt_skills
          SET planned_period_id = ?, plan_source = 'manual', sit_status = 'scheduled',
              sit_note = NULL, absent_from_no_show = 0, huy_vang = 0, absence_move_count = ?, updated_at = ?
        WHERE id = ?`,
    )
    .run(target.id, moveNo, nowIso(), row.id);
  logSchedule(attempt.id, {
    action: 'skill_week_moved_absence', field: row.skill,
    oldValue: row.period_code, newValue: target.code,
    reason: reason ?? `Dời do vắng lần ${moveNo}`, actor,
  });
  recomputeCompletionWeek(attempt.id, actor);
  tinhLaiMtCu(attempt.id, demoToday());   // LUAT-34 (T27): mọi lần xếp / dời tính lại cờ MT cũ — cả dời do vắng
  writeAudit({
    actorUserId: actor, action: mayTuDoi ? 'attempt.absence_auto_move' : 'attempt.absence_move', entityType: 'assessment_attempt',
    entityId: attempt.id, entityLabel: `${attempt.kind === 'mock' ? `MT${attempt.attempt_no}` : attempt.kind} · ${row.skill}`,
    before: { week: row.period_code, moveCount: row.absence_move_count },
    after: { week: target.code, moveCount: moveNo },
  });
}

/**
 * QUẢN LÝ TRẢ LỜI MỘT ĐỀ NGHỊ DỜI.
 *
 * Đồng ý thì lịch đổi ngay và bộ đếm nhích lên — lần dời này là của em, không phải một lượt
 * miễn phí mới của GVCN. Từ chối thì HUỶ phần thi hoặc lịch hẹn, vì để nguyên nghĩa là em
 * còn một lịch mà chính người có quyền vừa nói là không.
 */
export function decideAbsenceMove(p: Principal, requestId: number, input: {
  approve: boolean; note?: string | null; periodId?: number | null;
}) {
  const conn = db();
  const req = conn.prepare('SELECT * FROM skill_move_requests WHERE id = ?').get(requestId) as MoveRequest;
  if (!req) throw notFound('Không tìm thấy đề nghị dời lịch.');
  const attempt = loadAttempt(req.attempt_id);
  if (!canDecide(p, attempt)) throw forbidden('Chỉ Quản lý mới trả lời được đề nghị dời lịch.');
  /* PR-Dọn (VN10): cùng chốt với đường xin dời / báo vắng — đề nghị cũ còn treo trên MT lịch sử cũng không được duyệt. */
  if (attempt.lich_su) throw badRequest('MT cũ không vào luồng vắng — nhập bù điểm, không dời lịch.');
  if (req.status !== 'pending') {
    throw badRequest('Đề nghị này đã được xử lý — không trả lời lại được.');
  }
  if (attempt.status === 'cancelled') throw badRequest('Lượt này đã huỷ — đề nghị dời không còn hiệu lực.');
  const note = (input.note ?? '').trim() || null;
  /* PR-DUYET (§5.5, M8/Q11): từ chối = huỷ phần thi của em — bắt buộc lý do để GVCN biết vì sao. */
  if (!input.approve) { const loi = kiemLyDoThaoTac('tu-choi', note); if (loi) throw badRequest(loi); }

  const today = demoToday();
  const rows = ensureSkillRows(req.attempt_id);
  const row = rows.find((r) => r.skill === req.skill)!;

  return tx(() => {
    if (!input.approve) {
      conn
        .prepare(
          `UPDATE skill_move_requests SET status = 'declined', decided_by = ?, decided_at = ?,
                  decision_note = ?, updated_at = ? WHERE id = ?`,
        )
        .run(p.userId, nowIso(), note, nowIso(), requestId);
      /* T3 (Q3): từ chối "Xin dời" của kỹ năng đã huỷ vì vắng 2 lần = không mock lại (bỏ khỏi đợt). */
      if (row.huy_vang) khongMockLaiNoi(p, req.attempt_id, req.skill, note);
      else cancelPart(conn, p.userId, attempt, row, requestId, 'Quản lý từ chối đề nghị dời lịch.');
      chotYeuCau(conn, { loai: 'lich_thi', doiTuongLoai: 'skill_move', doiTuongId: requestId }, 'tu_choi', { nguoiDuyet: p.userId, lyDo: note });
      refreshOutcome(p, req.attempt_id);   // OV-1c: huỷ phần thi = kỹ năng thiếu đã xong
      return { ok: true, status: 'declined', cancelled: true };
    }

    /*
     * DUYỆT MUỘN VẪN DUYỆT ĐƯỢC, nhưng KHÔNG xếp vào một tuần đã bắt đầu: lúc đó Quản lý
     * phải chọn tuần khác trong chính thao tác này. Đồng ý một lịch đã trôi qua là ghi vào
     * hệ thống một buổi thi không thể diễn ra.
     */
    let target = input.periodId
      ? (conn.prepare('SELECT * FROM report_periods WHERE id = ?').get(input.periodId) as any)
      : (conn.prepare('SELECT * FROM report_periods WHERE id = ?').get(req.to_period_id) as any);
    /* K4-04: không chọn tuần mà tuần đề nghị đã bắt đầu → tuần đích mặc định (tuần chưa bắt đầu gần nhất hợp T15). */
    if (!input.periodId && target && target.week_start <= today) {
      const dich = tuanDichMacDinh(req.attempt_id, req.skill, today);
      if (dich) target = conn.prepare('SELECT * FROM report_periods WHERE id = ?').get(dich.id) as any;
    }
    if (!target) throw notFound('Không tìm thấy tuần.');
    if (target.week_start <= today) {
      throw loi(400, 'Tuần {code} đã bắt đầu. Chọn một tuần chưa tới để lịch mới là một buổi Test có thật.', { code: target.code });
    }
    const check = checkSkillWeekMove({
      attemptId: req.attempt_id, skill: req.skill, newWeekStart: target.week_start,
    });
    if (check.blockers.length) throw badRequest(check.blockers.join(' '));

    applyMove(conn, p.userId, attempt, row, target, input.note ?? null, req.move_no);
    conn
      .prepare(
        `UPDATE skill_move_requests SET status = 'approved', decided_by = ?, decided_at = ?,
                decision_note = ?, to_period_id = ?, updated_at = ? WHERE id = ?`,
      )
      .run(p.userId, nowIso(), note, target.id, nowIso(), requestId);
    chotYeuCau(conn, { loai: 'lich_thi', doiTuongLoai: 'skill_move', doiTuongId: requestId }, 'duyet', { nguoiDuyet: p.userId, lyDo: note });
    refreshOutcome(p, req.attempt_id);   // OV-1c: dời tuần = kỹ năng thiếu đã xong
    return { ok: true, status: 'approved', week: target.code, warnings: check.warnings };
  });
}

/**
 * HẾT HẠN MÀ CHƯA AI TRẢ LỜI → HUỶ (mục 10.6).
 *
 * Quét này chạy khi có người mở màn hình liên quan, vì bản demo không có tiến trình nền.
 * Không huỷ ngay lúc vừa gửi đề nghị: khoảng chờ là có thật, và nó là của Quản lý.
 */
/* OV-1c: không xét chốt ở đây — hết hạn đưa kỹ năng `absent` (đã là chốt, `kyNangXongThieu`) sang `cancelled` (vẫn chốt): Case đã sinh lúc vắng. */
export function sweepExpiredMoves(): number {
  const conn = db();
  const today = demoToday();
  const due = conn
    .prepare(`SELECT r.* FROM skill_move_requests r JOIN assessment_attempts a ON a.id = r.attempt_id
               WHERE r.status = 'pending' AND r.decide_by < ? AND a.status != 'cancelled'`)   /* lượt đã huỷ: không huỷ phần thi của nó */
    .all(today) as MoveRequest[];
  if (!due.length) return 0;

  return tx(() => {
    let n = 0;
    for (const req of due) {
      const attempt = db().prepare('SELECT * FROM assessment_attempts WHERE id = ?').get(req.attempt_id) as any;
      if (!attempt) continue;
      const row = ensureSkillRows(req.attempt_id).find((r) => r.skill === req.skill);
      if (!row) continue;
      conn
        .prepare(
          `UPDATE skill_move_requests SET status = 'expired', updated_at = ? WHERE id = ? AND status = 'pending'`,
        )
        .run(nowIso(), req.id);
      /* T3 (PR-MTa): thẻ "Xin dời" hết hạn → kỹ năng giữ "huỷ (vắng 2 lần)", không huỷ lần hai, không báo Quản lý. */
      if (!row.huy_vang) cancelPart(conn, null, attempt, row, req.id, 'Hết hạn duyệt mà chưa có quyết định.');
      chotYeuCau(conn, { loai: 'lich_thi', doiTuongLoai: 'skill_move', doiTuongId: req.id }, 'tu_dong',
        { lyDo: row.huy_vang ? 'Hết hạn duyệt — giữ huỷ (vắng 2 lần)' : 'Hết hạn duyệt — kỹ năng bị huỷ' });
      n += 1;
    }
    return n;
  });
}

/**
 * HUỶ PHẦN THI (Fast Track) HAY HUỶ LỊCH HẸN (Normal) — hai hệ quả khác nhau (mục 10.6).
 *
 *   · FAST TRACK huỷ phần chưa thi. Điểm các phần đã hoàn thành GIỮ NGUYÊN. Đợt này chưa đủ
 *     kết quả vì phần bị huỷ — KHÔNG tính môn đó 0 điểm, và cũng không coi như môn vốn không
 *     yêu cầu. Không dựng Overall từ những phần còn lại.
 *   · NORMAL huỷ LỊCH HẸN thôi. Nghĩa vụ thi đủ bốn môn vẫn còn, môn đó chuyển sang "chờ
 *     Quản lý xếp lại" — không làm biến mất một môn để đợt trông như đã hoàn tất.
 */
function cancelPart(
  conn: any, actor: number | null, attempt: any, row: any, requestId: number, why: string,
) {
  const ratio = isRatio(attempt);
  if (ratio) {
    /* Bỏ lịch hẹn, giữ phạm vi bắt buộc: môn vẫn phải thi, chỉ là chưa biết tuần nào. */
    conn
      .prepare(
        `UPDATE attempt_skills SET planned_period_id = NULL, plan_source = 'manual',
                sit_status = 'scheduled', absent_from_no_show = 0, updated_at = ? WHERE id = ?`,
      )
      .run(nowIso(), row.id);
  } else {
    conn
      .prepare(`UPDATE attempt_skills SET sit_status = 'cancelled', absent_from_no_show = 0, updated_at = ? WHERE id = ?`)
      .run(nowIso(), row.id);
  }
  conn
    .prepare('UPDATE skill_move_requests SET cancelled_part = 1, updated_at = ? WHERE id = ?')
    .run(nowIso(), requestId);
  logSchedule(attempt.id, {
    action: ratio ? 'skill_appointment_cancelled' : 'skill_part_cancelled',
    field: row.skill, oldValue: row.period_code, newValue: null, reason: why, actor,
  });
  recomputeCompletionWeek(attempt.id, actor);
  writeAudit({
    actorUserId: actor, action: ratio ? 'attempt.cancel_appointment' : 'attempt.cancel_part',
    entityType: 'assessment_attempt', entityId: attempt.id,
    entityLabel: `${attempt.kind === 'mock' ? `MT${attempt.attempt_no}` : attempt.kind} · ${row.skill}`,
    before: { week: row.period_code }, after: { reason: why, ratio },
  });
  notifyPlanners(
    attempt,
    ratio
      ? `Đã huỷ lịch hẹn ${skillName(row.skill)} — ${why} Môn này vẫn phải làm bài, chờ Quản lý xếp lại.`
      : `Đã huỷ ${skillName(row.skill)} — ${why} Đợt này chưa đủ kết quả cho tới khi được khôi phục.`,
    requestId, actor, {},
    ratio ? `Xếp lại lịch ${skillName(row.skill)}` : `Khôi phục kỹ năng ${skillName(row.skill)}`,
  );
}

/**
 * KHÔI PHỤC PHẦN ĐÃ HUỶ — chỉ Quản lý, và ĐẶT TUẦN MỚI TRONG CÙNG THAO TÁC (mục 10.6).
 *
 * Tách làm hai bước thì sẽ có những phần được khôi phục mà không có tuần, nằm im ở đúng
 * trạng thái mà cả mục này sinh ra để dọn.
 *
 * LUAT-34 (T14–15): Khôi phục ĐẶT LẠI chuỗi vắng (`absence_move_count = 0`). N38: web chỉ còn dùng ở LỚP THƯỜNG (dữ liệu "đã huỷ" cũ) —
 * Fast Track chọn tuần bằng Dời (`setSkillWeek`, L5) làm cùng việc.
 */
export function restoreCancelledSkill(p: Principal, attemptId: number, skill: string, periodId: number, opts: {
  reason?: string | null;
} = {}) {
  const attempt = loadAttempt(attemptId);
  if (!canDecide(p, attempt)) {
    throw forbidden('Chỉ Quản lý mới khôi phục được kỹ năng đã huỷ và đặt tuần mới.');
  }
  const rows = ensureSkillRows(attemptId);
  const row = rows.find((r) => r.skill === skill);
  if (!row) throw badRequest('Kỹ năng không hợp lệ.');
  const ratio = isRatio(attempt);
  if (!ratio && row.sit_status !== 'cancelled') {
    throw loi(400, '{skill} chưa bị huỷ — không có gì để khôi phục.', { skill: skillName(skill) });
  }
  if (ratio && row.planned_period_id) {
    throw loi(400, '{skill} đang có lịch hẹn — dùng thao tác đổi lịch thường.', { skill: skillName(skill) });
  }

  const period = db().prepare('SELECT * FROM report_periods WHERE id = ?').get(periodId) as any;
  if (!period) throw notFound('Không tìm thấy tuần.');
  /* PR-MTa T21: Quản lý khôi phục vào tuần này / tuần đã qua được (em đã thi thật) — rồi nhập điểm ngay (T19). */
  const check = checkSkillWeekMove({ attemptId, skill: skill as AssessedSkill, newWeekStart: period.week_start });
  if (check.blockers.length) throw badRequest(check.blockers.join(' '));

  return tx(() => {
    const conn = db();
    conn
      .prepare(
        `UPDATE attempt_skills SET sit_status = 'scheduled', absent_from_no_show = 0, huy_vang = 0, planned_period_id = ?,
                plan_source = 'manual', absence_move_count = 0, updated_at = ? WHERE id = ?`,
      )
      .run(periodId, nowIso(), row.id);
    /* OV-11a (TE-3): khôi phục = lịch mới, chuỗi mới — mọi dấu "-" cũ (cả Không dự thi) hết nghĩa. */
    if (!ratio) {
      const o = entrySkillsOf(skill as AssessedSkill);
      conn.prepare(
        `UPDATE assessment_scores SET no_show_period_id = NULL, no_show_by = NULL, no_show_at = NULL, no_show_late = 0, no_show_settled_at = NULL, no_show_cu = 0
          WHERE attempt_id = ? AND skill IN (${o.map(() => '?').join(',')}) AND no_show_period_id IS NOT NULL`,
      ).run(attemptId, ...o);
    }
    /* PR-MTb sau rà (I1): đề nghị dời đang chờ của kỹ năng này rút cùng lúc — không rút thì hết hạn quét huỷ lại kỹ năng vừa khôi phục. */
    rutDeNghiDoi(attemptId, skill);
    logSchedule(attemptId, {
      action: 'skill_part_restored', field: skill,
      oldValue: row.period_code, newValue: period.code,
      reason: opts.reason ?? 'Quản lý khôi phục và đặt tuần mới', actor: p.userId,
    });
    const cw = recomputeCompletionWeek(attemptId, p.userId);
    tinhLaiMtCu(attemptId, demoToday());
    refreshOutcome(p, attemptId);   // OV-1c: khôi phục phần thi có thể làm lượt hết chốt (Case đã có giữ nguyên)
    writeAudit({
      actorUserId: p.userId, action: 'attempt.restore_part', entityType: 'assessment_attempt',
      entityId: attemptId, entityLabel: `${attemptId} · ${skill}`,
      before: { sitStatus: row.sit_status, week: row.period_code, moveCount: row.absence_move_count }, after: { week: period.code, moveCount: 0 },
    });
    return { ok: true, completionWeek: cw, warnings: check.warnings };
  });
}

/** Quản lý của CHÍNH chi nhánh của lớp, cộng người có phạm vi toàn hệ thống. */
function quanLyCuaLop(classId: number | null): number[] {
  const conn = db();
  const cls = classId ? (conn.prepare('SELECT branch_id FROM classes WHERE id = ?').get(classId) as any) : null;
  return (conn
    .prepare(
      `SELECT DISTINCT ur.user_id FROM user_roles ur
         JOIN roles r ON r.id = ur.role_id
        WHERE r.key IN ('manager', 'system_admin', 'office_admin')   -- PR-OV2a: Admin xếp / dời lịch MT nên cũng nhận đề nghị dời
          AND ur.status = 'active'
          AND (ur.branch_id IS NULL OR ur.branch_id = ?)`,
    )
    .all(cls?.branch_id ?? -1) as any[]).map((m) => m.user_id).filter(Boolean);
}

/** Báo cho những người xếp lịch của chi nhánh — không gửi cho cả trường. */
function notifyPlanners(
  attempt: any, message: string, refId: number, actor: number | null,
  opts: { entityType?: string; dedupBase?: string } = {},
  /** PR-VAI-a (K1-42, Q20): tiêu đề = việc + em + lớp — không còn một tiêu đề lịch thi chung chung cho mọi trường hợp. */
  viec = 'Xếp lại lịch Test',
) {
  const conn = db();
  const ai = conn.prepare('SELECT s.full_name AS hv, (SELECT code FROM classes WHERE id = ?) AS lop FROM students s WHERE s.id = ?')
    .get(attempt.class_id ?? null, attempt.student_id) as any;
  const tieuDe = [viec, [ai?.hv, ai?.lop].filter(Boolean).join(' · ')].filter(Boolean).join(' · ');
  const managers = quanLyCuaLop(attempt.class_id).map((user_id) => ({ user_id }));
  for (const m of managers) {
    if (!m.user_id || m.user_id === actor) continue;
    notify({
      userId: m.user_id, kind: 'schedule_move', title: tieuDe,
      body: message, entityType: opts.entityType ?? 'skill_move_requests', entityId: refId,
      dedupKey: `${opts.dedupBase ?? `move:${refId}`}:${m.user_id}`,
    });
  }
}

// ================================================================ dấu '-' và chốt không dự thi (PR-G)

/**
 * OV-1b (đặc tả 3.3, thay chốt cuối Chủ nhật `settleNoShows`): "-" TRONG TUẦN THI CHỐT NGAY. Buổi là vắng khi MỌI ô nhập của buổi đều
 * "-" của chính tuần đang xếp và chưa ô nào có điểm (Writing: W1 + W2) — chưa đủ thì ô "-" vẫn là "Không có bài", chờ ô kia. Đủ →
 * `settleGroup`: lần 1 máy dời tuần sau tuần thi, lần 2 huỷ (N38). Gọi trong tx của `saveScore`. Trả kết quả khi vừa chốt, `false` khi chưa.
 */
export function chotVangNgay(conn: any, p: Principal, attempt: any, row: any, today: string): MoveOutcome | false {
  const entry = entrySkillsOf(row.skill as AssessedSkill);
  const o = conn.prepare(
    `SELECT id, skill, band, raw_score, no_show_period_id, no_show_settled_at, no_show_cu FROM assessment_scores
      WHERE attempt_id = ? AND skill IN (${entry.map(() => '?').join(',')})`,
  ).all(attempt.id, ...entry) as any[];
  const coDiem = (d: any) => d.band !== null || d.raw_score !== null;
  const dau = o.filter((d) => !coDiem(d) && d.no_show_period_id === row.planned_period_id && d.no_show_settled_at === null && !d.no_show_cu);
  /* LUAT-34 (T07): Writing — task kia "-" HOẶC đã có điểm thì buổi là vắng (dời cả W, điểm task kia đi theo); task kia còn trống thì chờ. */
  if (!dau.length || !entry.every((k) => o.some((d) => d.skill === k && (coDiem(d) || dau.includes(d))))) return false;
  return settleGroup(conn, attempt.id, row.id, row.skill, row.week_end, row.period_code ?? '', dau.map((d) => d.id), p.userId,
    'Vắng — dấu "-"', today);
}

/**
 * Chốt MỘT buổi. Trả false khi buổi đã được chốt hoặc đã đổi — nên chạy lặp là vô hại; chốt được thì trả kết quả dời / huỷ.
 *
 * CHỐNG CHỐT HAI LẦN (rà #119 mục 4): máy tự dời trả bài về `scheduled` ở TUẦN MỚI, nên "còn scheduled" không đủ — tiến trình thứ hai
 * (Netlify nhiều instance) đọc danh sách trước khi tiến trình đầu ghi sẽ chốt lại và sinh đề nghị "lần 2" giả. Điều kiện thật: dấu "-"
 * đầu buổi CHƯA chốt và vẫn nằm ĐÚNG tuần đang xếp. Xuất ra để phép kiểm dựng lại cuộc đua bằng danh sách cũ.
 */
export function settleGroup(
  conn: any, attemptId: number, schedId: number, assessed: string, weekEnd: string, periodCode: string,
  scoreIds: number[], actor: number | null, reason: string, today: string = demoToday(),
): MoveOutcome | false {
  /* 23:59:59 giờ Việt Nam của Chủ nhật tuần thi = 16:59:59Z (ngày hiệu lực của lần vắng = tuần thi, không phải lúc ghi). */
  const effective = `${weekEnd.slice(0, 10)}T16:59:59.000Z`;
  const changed = conn
    .prepare(
      `UPDATE attempt_skills
          SET sit_status = 'absent', absent_from_no_show = 1, sit_by = ?, sit_at = ?, sit_note = ?, updated_at = ?
        WHERE id = ? AND sit_status IN ('scheduled', 'sat')
          AND EXISTS (SELECT 1 FROM assessment_scores sc WHERE sc.id = ? AND sc.no_show_settled_at IS NULL
                         AND sc.no_show_period_id = attempt_skills.planned_period_id)`,
    )
    .run(actor, effective, reason, nowIso(), schedId, scoreIds[0]).changes;
  if (!changed) return false;
  capNhatConOCho([attemptId]);   // TD7b: ô vừa thành `absent` — không còn chờ điểm (nếu sau đó dời tuần thì recomputeCompletionWeek tính lại)
  conn
    .prepare(`UPDATE assessment_scores SET no_show_settled_at = ? WHERE id IN (${scoreIds.map(() => '?').join(',')}) AND no_show_settled_at IS NULL`)
    .run(nowIso(), ...scoreIds);
  logSchedule(attemptId, {
    action: 'skill_no_show_settled', field: assessed, oldValue: 'scheduled', newValue: 'absent',
    reason: `${reason} (tuần ${periodCode})`, actor,
  });
  const attempt = conn.prepare('SELECT * FROM assessment_attempts WHERE id = ?').get(attemptId) as any;
  writeAudit({
    actorUserId: actor, action: 'attempt.no_show_settled', entityType: 'assessment_attempt', entityId: attemptId,
    entityLabel: `${attempt.kind === 'mock' ? `MT${attempt.attempt_no}` : attempt.kind} · ${assessed}`,
    before: { sitStatus: 'scheduled' }, after: { sitStatus: 'absent', week: periodCode },
  });
  /* Q-A, K4-03 · N38 — MÁY TỰ XỬ LÝ NGAY TRONG CÙNG GIAO DỊCH: lần 1 dời tuần sau tuần thi, lần 2 huỷ. Lớp thường không qua đây (chỉ Mock). */
  const row = ensureSkillRows(attemptId).find((r) => r.skill === assessed)!;
  const kq = xuLyVangMotKyNang(conn, null, attempt, row, { lyDo: 'Vắng — tự dời' });
  if (kq.result === 'moved') {
    /* Báo GVCN + GVBM đúng kỹ năng (W1, W2 là hai người). Trùng thông báo bị chặn bởi dedupKey. Câu nêu ĐÚNG em và MT — danh sách thông báo không có ngữ cảnh. */
    const tuanMoi = tuanLich(ensureSkillRows(attemptId).find((r) => r.skill === assessed)!.week_start, today);
    const em = (conn.prepare('SELECT full_name FROM students WHERE id = ?').get(attempt.student_id) as any)?.full_name ?? 'học viên';
    for (const t of conn
      .prepare(
        `SELECT DISTINCT user_id FROM teacher_assignments
          WHERE class_id = ? AND status = 'active' AND (is_core = 1 OR skill IN (${entrySkillsOf(assessed as AssessedSkill).map(() => '?').join(',')}))`,
      )
      .all(attempt.class_id, ...entrySkillsOf(assessed as AssessedSkill)) as any[]) {
      if (t.user_id === actor) continue;   // OV-1b: người vừa gõ "-" đã thấy kết quả ngay ở ô
      notify({
        userId: t.user_id, kind: 'tu_doi_lich', title: `Đã dời bài vắng · ${em}`,   // PR-VAI-a (Q19): tin để biết, tách khỏi schedule_move
        body: `Đã tự dời ${skillName(assessed)} của ${em} · MT${attempt.attempt_no} sang ${tuanMoi} (vắng lần 1).`,
        entityType: 'assessment_attempt', entityId: attemptId,
        dedupKey: `no_show:${attemptId}:${assessed}:${weekEnd.slice(0, 10)}:${t.user_id}`,
      });
    }
  }
  return kq;
}

// ================================================================ xoá "-" = hết vắng (PR-BV, chủ sản phẩm 06/10 bản 2)

/** Dòng lịch sử lịch là QUYẾT ĐỊNH của người về lịch / trạng thái thi (khi `actor_user_id` có người). */
const QUYET_DINH_LICH = [
  'skill_week_set', 'skill_week_moved_absence', 'skill_week_restored', 'skill_part_restored', 'skill_part_cancelled', 'skill_appointment_cancelled',
  'skill_skipped', 'skill_restored', 'skill_sit_status', 'skill_unscheduled',
];

/**
 * SAU LẦN CHỐT VẮNG GẦN NHẤT của (lượt, kỹ năng): `daCong` — lần chốt đó đã được cộng một lần dời do vắng; `giuLich` — đã có QUYẾT ĐỊNH
 * CỦA NGƯỜI về lịch / trạng thái (duyệt, từ chối, khôi phục, xếp lại…; đổi hạn chấm không tính). Dùng chung Bỏ vắng (`goVangDaChot`) và
 * migrate OV-1b (gỡ vắng do "-" nhập bù đã chốt theo luật cũ).
 */
export function sauLanChot(conn: any, attemptId: number, assessed: string): { daCong: boolean; giuLich: boolean } {
  const chot = conn.prepare(`SELECT id FROM attempt_schedule_history WHERE attempt_id = ? AND field = ? AND action = 'skill_no_show_settled' ORDER BY id DESC LIMIT 1`)
    .get(attemptId, assessed) as any;
  const sau = chot ? conn.prepare('SELECT action, actor_user_id FROM attempt_schedule_history WHERE attempt_id = ? AND field = ? AND id > ?')
    .all(attemptId, assessed, chot.id) as any[] : [];
  return {
    daCong: sau.some((h) => h.action === 'skill_week_moved_absence'),
    giuLich: sau.some((h) => h.actor_user_id !== null && QUYET_DINH_LICH.includes(h.action)),
  };
}

/**
 * AI GỠ ĐƯỢC DẤU "-" (Mock đã chốt + lớp thường). `null` = được; chuỗi = câu lỗi 403.
 * Quản lý / Quản trị (xếp lịch được lớp), người được nhập ô đó, GVCN lớp: MỌI LÚC (OV-13h, chủ SP 15/10 — bỏ hạn thứ Tư sau tuần gốc).
 * `daHuyPhan` — vắng lần 2 đã huỷ → chỉ Quản lý (người chọn lại tuần, L5).
 */
export function duocGoDau(p: Principal, o: {
  classId: number; skill: string; today: string;
  /** Quyền nhập ô đó đã tính sẵn ở nơi gọi (bảng nhiều ô) — bỏ trống thì hỏi `scoreEditPath`. */
  duocNhap?: boolean;
  daHuyPhan?: boolean;
  /** LUAT-34 (T09): Hoàn tác — chính người vừa gõ "-", trong cửa sổ `duocHoanTacVang` — gỡ được cả khi "-" vừa huỷ phần thi (vắng 2 lần). */
  hoanTac?: boolean;
}): string | null {
  if (can(p, PERMISSIONS.PLAN_WEEK, { classId: o.classId })) return null;
  if (!(o.duocNhap ?? scoreEditPath(p, o.classId, o.skill) !== null) && !isCoreTeacherOf(p, o.classId, o.today)) {
    return teachesClass(p, o.classId, o.today) ? 'Chỉ GV chấm kỹ năng này, GVCN hoặc Quản lý gỡ được dấu "-".' : 'Bạn không có quyền với lớp này.';
  }
  return o.daHuyPhan && !o.hoanTac ? 'Đã huỷ · vắng 2 lần — Quản lý chọn tuần mới (Dời) để xếp lại.' : null;
}

/** Dấu "-" ĐÃ CHỐT của một ô Mock (không phải MT cũ) — dòng điểm, hoặc null. */
export function dauDaChot(attemptId: number, skill: string): any | null {
  return db().prepare(
    `SELECT s.*, rp.week_start AS goc_start FROM assessment_scores s JOIN report_periods rp ON rp.id = s.no_show_period_id
      WHERE s.attempt_id = ? AND s.skill = ? AND s.no_show_settled_at IS NOT NULL AND s.no_show_cu = 0 AND s.band IS NULL AND s.raw_score IS NULL`,
  ).get(attemptId, skill) ?? null;
}

/**
 * XOÁ "-" ĐÃ CHỐT CỦA MOCK = TRẢ NHƯ TRƯỚC KHI GÕ (PR-BV). Gỡ dấu cả buổi (Writing: W1 + W2), rồi:
 *   · lần chốt đó chỉ có MÁY xử lý (tự dời / chờ duyệt / huỷ vắng 2 lần / hết hạn) → về tuần gốc, `scheduled`, `huy_vang = 0`;
 *   · đã có QUYẾT ĐỊNH CỦA NGƯỜI sau lần chốt (duyệt, từ chối, khôi phục, không mock lại, xếp lại…) → giữ lịch + trạng thái (G2).
 * Lần vắng −1 khi lần chốt đó đã được cộng (`skill_week_moved_absence` sau chốt). Đề nghị dời đang chờ rút; thẻ đã quyết ghi "vắng đã gỡ".
 * Không chuông (đã gửi giữ nguyên, không gửi mới), không `tinhLaiMtCu` (trả về lịch đã có, G7).
 */
export function goVangDaChot(p: Principal, attemptId: number, skill: string, dau: any, today: string) {
  const conn = db();
  const a = loadAttempt(attemptId);
  const assessed = assessedSkillOf(skill);
  const hien = ensureSkillRows(attemptId).find((r) => r.skill === assessed)!;
  const hoanTac = dau.no_show_by === p.userId && duocHoanTacVang(dau.no_show_at, Date.now());
  const loi = duocGoDau(p, { classId: a.class_id, skill, today, daHuyPhan: hien.sit_status === 'cancelled', hoanTac });
  if (loi) throw forbidden(loi);
  const entry = entrySkillsOf(assessed);
  return tx(() => {
    const row = ensureSkillRows(attemptId).find((r) => r.skill === assessed)!;
    const { daCong, giuLich: quyetDinh } = sauLanChot(conn, attemptId, assessed);
    /* OV-1b: ô khác của buổi (W1 khi gỡ W2) đã có điểm ở tuần mới → giữ lịch, không kéo điểm đó về tuần cũ. */
    /* LUAT-34 (T07): chỉ điểm ô kia nhập SAU lần chốt (đã thi ở tuần mới) mới giữ lịch — điểm có từ trước (W1 điểm + W2 "-" nhầm) thì trả về tuần cũ. */
    const giuLich = quyetDinh || (conn.prepare(
      `SELECT 1 FROM assessment_scores WHERE attempt_id = ? AND skill IN (${entry.map(() => '?').join(',')}) AND (band IS NOT NULL OR raw_score IS NOT NULL)
          AND entered_at > ?`,
    ).get(attemptId, ...entry, dau.no_show_settled_at) !== undefined);
    const lan = Math.max(0, row.absence_move_count - (daCong ? 1 : 0));
    if (giuLich) {
      conn.prepare('UPDATE attempt_skills SET absence_move_count = ?, absent_from_no_show = 0, updated_at = ? WHERE id = ?').run(lan, nowIso(), row.id);
    } else {
      conn.prepare(
        `UPDATE attempt_skills SET planned_period_id = ?, sit_status = 'scheduled', sit_note = NULL, absent_from_no_show = 0, huy_vang = 0,
                absence_move_count = ?, updated_at = ? WHERE id = ?`,
      ).run(dau.no_show_period_id, lan, nowIso(), row.id);
    }
    conn.prepare(
      `UPDATE assessment_scores SET no_show_period_id = NULL, no_show_by = NULL, no_show_at = NULL, no_show_late = 0, no_show_settled_at = NULL
        WHERE attempt_id = ? AND skill IN (${entry.map(() => '?').join(',')}) AND no_show_cu = 0`,
    ).run(attemptId, ...entry);
    rutDeNghiDoi(attemptId, assessed);
    /*
     * Gõ lại "-" sau khi gỡ là một lần chốt MỚI. Khoá chống trùng của đề nghị cũ không được nuốt đề nghị mới, và số lần dời của đề nghị
     * đã duyệt / từ chối / hết hạn của lần chốt này phải nhường chỗ (bảng có UNIQUE (attempt, skill, move_no); lần vắng vừa −1).
     * ponytail: "cất" move_no bằng cộng bội 100 (thẻ đọc `move_no % 100`) vì PR này không migrate; có migrate thì đổi UNIQUE thành chỉ mục một
     * phần `WHERE status = 'pending'` và bỏ phép cất này.
     */
    conn.prepare(`UPDATE skill_move_requests SET idempotency_key = NULL WHERE attempt_id = ? AND skill = ? AND status = 'withdrawn'`).run(attemptId, assessed);
    const tran = (conn.prepare('SELECT COALESCE(MAX(move_no), 0) m FROM skill_move_requests WHERE attempt_id = ? AND skill = ?').get(attemptId, assessed) as any).m as number;
    conn.prepare(
      `UPDATE skill_move_requests SET move_no = ? + (move_no % 100), idempotency_key = NULL, updated_at = ?
        WHERE attempt_id = ? AND skill = ? AND status IN ('approved', 'declined', 'expired') AND move_no < 100 AND created_at >= ?`,
    ).run((Math.floor(tran / 100) + 1) * 100, nowIso(), attemptId, assessed, dau.no_show_settled_at);
    conn.prepare(
      `UPDATE yeu_cau_duyet SET ly_do_dong = 'vắng đã gỡ' WHERE doi_tuong_loai = 'skill_move' AND trang_thai IN ('duyet', 'tu_choi')
          AND doi_tuong_id IN (SELECT id FROM skill_move_requests WHERE attempt_id = ? AND skill = ? AND created_at >= ?)`,
    ).run(attemptId, assessed, dau.no_show_settled_at);
    const moi = ensureSkillRows(attemptId).find((r) => r.skill === assessed)!;
    logSchedule(attemptId, {
      action: 'skill_absence_undone', field: assessed, oldValue: row.period_code, newValue: moi.period_code,
      reason: giuLich ? 'Gỡ vắng — giữ lịch (đã có quyết định)' : 'Gỡ vắng — trả lịch như trước khi gõ "-"', actor: p.userId,
    });
    recomputeCompletionWeek(attemptId, p.userId);
    writeAudit({
      actorUserId: p.userId, action: 'score.no_show_cleared', entityType: 'assessment_attempt', entityId: attemptId, entityLabel: skill,
      before: { week: row.period_code, moveCount: row.absence_move_count, sitStatus: row.sit_status, huyVang: !!row.huy_vang },
      after: { week: moi.period_code, moveCount: moi.absence_move_count, sitStatus: moi.sit_status, huyVang: !!moi.huy_vang, giuLich },
    });
    refreshOutcome(p, attemptId);
    const fresh = conn.prepare('SELECT * FROM assessment_attempts WHERE id = ?').get(attemptId) as any;
    return {
      score: conn.prepare('SELECT * FROM assessment_scores WHERE attempt_id = ? AND skill = ?').get(attemptId, skill),
      result: resultOf(fresh), attemptStatus: fresh.status,
      goVang: { tuanVe: moi.week_start ? tuanLich(moi.week_start, today) : null, giuLich, lanVang: moi.absence_move_count as number },
    };
  });
}

/**
 * T38 "Báo vắng" (PR-XLMT, K4-28, Q10): ghi "-" cho MỌI ô nhập của kỹ năng (W = W1 + W2) rồi CHỐT NGAY qua `settleGroup` — một luật với "-" ở
 * ô (N38): lần 1 dời tuần sau tuần thi, lần 2 huỷ; MT cũ của KỸ NĂNG (`laMtCuKyNang`) → Không dự thi (dấu `no_show_cu`), không chuông. GVCN / Quản lý.
 */
export function baoVang(p: Principal, attemptId: number, skill: string, lyDo: string | null | undefined, today: string = demoToday()) {
  const conn = db();
  const a = loadAttempt(attemptId);
  if (!canRequest(p, a)) throw forbidden('Chỉ giáo viên chủ nhiệm của lớp và Quản lý báo vắng được.');
  chanVangLopKetThuc(a.class_id);
  if (a.kind !== 'mock') throw badRequest('Bài lớp thường báo vắng ở bảng điểm lớp thường.');
  if (a.status === 'cancelled') throw badRequest('Đợt này đã huỷ.');
  const row = ensureSkillRows(attemptId).find((r) => r.skill === skill);
  if (!row?.required) throw loi(400, '{skill} không nằm trong lượt này.', { skill: skillName(skill) });
  if (row.sit_status !== 'scheduled' || !row.planned_period_id || !row.week_start || !row.week_end) {
    throw loi(400, '{skill} không còn chờ làm bài (đã làm bài, đang vắng hoặc đã huỷ) — không báo vắng được.', { skill: skillName(skill) });
  }
  if (row.week_start.slice(0, 10) > mondayOf(today)) {
    throw loi(400, '{skill} chưa tới tuần Test — muốn đổi tuần thì "Dời lịch".', { skill: skillName(skill) });
  }
  /* N38 L3: MT cũ xét theo tuần thi của KỸ NĂNG (cả lượt `lich_su`) → Không dự thi, không dời, không đếm. Ghi muộn tuần gần → chốt như trong tuần. */
  const khongDuThi = laMtCuKyNang(row.week_start, today);
  const late = today > row.week_end.slice(0, 10);
  return tx(() => {
    const ids: number[] = [];
    const now = nowIso();
    for (const e of entrySkillsOf(skill as AssessedSkill).filter((k) => k !== row.bo_task)) {   // P8: task Writing không học không ghi "-"
      const s = conn.prepare('SELECT * FROM assessment_scores WHERE attempt_id = ? AND skill = ?').get(attemptId, e) as any;
      if (s && ((s.band ?? null) !== null || (s.raw_score ?? null) !== null)) throw loi(400, '{skill} đã có điểm — không báo vắng.', { skill: skillName(skill) });
      if (s) {
        conn.prepare(`UPDATE assessment_scores SET no_show_period_id = ?, no_show_by = ?, no_show_at = ?, no_show_late = ?, no_show_settled_at = ?, no_show_cu = ? WHERE id = ?`)
          .run(row.planned_period_id, p.userId, now, late ? 1 : 0, khongDuThi ? now : null, khongDuThi ? 1 : 0, s.id);
        ids.push(s.id);
      } else {
        ids.push(Number(conn.prepare(`INSERT INTO assessment_scores (attempt_id, skill, no_show_period_id, no_show_by, no_show_at, no_show_late, no_show_settled_at, no_show_cu) VALUES (?,?,?,?,?,?,?,?)`)
          .run(attemptId, e, row.planned_period_id, p.userId, now, late ? 1 : 0, khongDuThi ? now : null, khongDuThi ? 1 : 0).lastInsertRowid));
      }
    }
    if (khongDuThi) {
      writeAudit({
        actorUserId: p.userId, action: 'score.no_show', entityType: 'assessment_attempt', entityId: attemptId, entityLabel: skill,
        before: null, after: { noShow: true, week: row.period_code, late, khongDuThi: true, lyDo: lyDo?.trim() || null },
      });
      refreshOutcome(p, attemptId);
      return { daDoi: false, tuanMoi: null, huyVang: false, khongDuThi: true, canhBao: null };
    }
    const kq = settleGroup(conn, attemptId, row.id, skill, row.week_end!, row.period_code ?? '', ids, p.userId, lyDo?.trim() ? `Báo vắng: ${lyDo.trim()}` : 'Báo vắng', today);
    refreshOutcome(p, attemptId);   // OV-1c: vắng = kỹ năng thiếu đã xong → lượt có thể chốt
    const sau = ensureSkillRows(attemptId).find((r) => r.skill === skill)!;
    return { daDoi: sau.sit_status === 'scheduled', tuanMoi: sau.week_start, huyVang: !!sau.huy_vang, khongDuThi: false, canhBao: kq ? kq.canhBao : null };
  });
}
