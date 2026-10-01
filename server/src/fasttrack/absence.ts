import { db, tx } from '../db.ts';
import {
  ASSESSED_SKILLS, ASSESSED_SKILL_LABEL, C10_NHAP_DAU_TRU_TUAN_QUA_KHU, PERMISSIONS, hanDuyetDoiLan2, kiemLyDoThaoTac, ngay, tenMon, tenMonNgan, tuanLich,
  type AssessedSkill,
} from '../../../shared/domain/index.ts';
import { assessedSkillOf, entrySkillsOf } from './scoring.ts';
import { addDays, badRequest, forbidden, notFound, nowIso } from '../util.ts';
import { can, isCoreTeacherOf, type Principal } from '../permissions.ts';
import { demoToday } from '../demoConfig.ts';
import { writeAudit, notify } from '../platform/audit.ts';
import { nho } from '../platform/nguCanhRequest.ts';
import { chotYeuCau, taoYeuCau } from '../duyet/yeuCau.ts';
import { ensurePeriod, mondayOf } from '../platform/week.ts';
import {
  boMonCuaLuot, checkSkillWeekMove, ensureSkillRows, logSchedule, recomputeCompletionWeek, scoringModeOf,
} from './skillSchedule.ts';

/**
 * VẮNG, DỜI CÓ GIỚI HẠN VÀ KHÔI PHỤC — nơi sở hữu DUY NHẤT của mục 10.6.
 *
 * Câu chuyện có thật mà mục này viết ra để chặn: em vắng buổi Speaking, GVCN dời sang tuần
 * sau; em vắng tiếp, GVCN lại dời; ba tuần sau không ai nhớ đã dời mấy lần, đợt MT vẫn treo,
 * và bảng kết quả thì đọc như thể đợt đó sắp xong.
 *
 * Nên có đúng bốn luật, và cả bốn nằm ở đây chứ không rải trên màn hình:
 *
 *   1. ĐẾM THEO KỸ NĂNG TRONG TỪNG ĐỢT. Vắng buổi R/L/W không tiêu mất lượt dời của
 *      Speaking — hai buổi khác nhau, hai câu chuyện khác nhau.
 *   2. LẦN ĐẦU GVCN TỰ DỜI, và dời đúng TUẦN KẾ TIẾP của lịch đang có. Không chọn tuỳ ý:
 *      xử lý muộn ba tuần mà nhảy thẳng sang tuần hiện tại là âm thầm cho thêm hai tuần.
 *   3. LẦN THỨ HAI TRỞ ĐI PHẢI CÓ QUẢN LÝ DUYỆT, và lịch KHÔNG đổi trước khi được duyệt.
 *   4. HẠN DUYỆT LÀ TRƯỚC KHI TUẦN MỚI BẮT ĐẦU. Hết hạn hoặc bị từ chối thì huỷ phần thi
 *      (Fast Track) hoặc huỷ lịch hẹn (Normal) — chứ không để một lịch không ai xác nhận.
 *
 * Và một luật ngầm quan trọng không kém: dời CHỦ ĐỘNG (Quản lý sắp lại lịch học) KHÔNG tiêu
 * lượt nào. Bộ đếm này đếm những lần em không có mặt, không phải những lần lịch thay đổi.
 */

export type MoveRequest = {
  id: number;
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

/** Lớp Normal huỷ LỊCH HẸN, Fast Track huỷ PHẦN THI. Hai hệ quả khác nhau (mục 10.6). */
function isRatio(attempt: any): boolean {
  return scoringModeOf(attempt) === 'ratio';
}

function loadAttempt(attemptId: number): any {
  const a = db().prepare('SELECT * FROM assessment_attempts WHERE id = ?').get(attemptId) as any;
  if (!a) throw notFound('Không tìm thấy đợt kiểm tra');
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
      .prepare(`SELECT * FROM skill_move_requests WHERE status = 'pending' ORDER BY id`)
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
 * HẠN QUẢN LÝ PHẢI TRẢ LỜI: ngày TRƯỚC khi tuần mới bắt đầu (mục 10.6).
 *
 * Duyệt sau khi tuần đó đã bắt đầu thì không còn là duyệt một kế hoạch, mà là hợp thức hoá
 * một chuyện đã rồi.
 */
export function decideByOf(newWeekStart: string): string {
  return addDays(newWeekStart, -1);
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
  return `Dời ${k} · MT${o.attemptNo ?? '?'} · lần ${o.moveNo} · Duyệt = ${k} thi ${o.tuanDich ? tuanLich(o.tuanDich, o.homNay) : '—'}`;
}

/** Như `chuTheDoiLan2`, đọc từ một đề nghị (giao kèo PR-MT → PR-DUYET). */
export function moTaDoiLan2(req: { attempt_id: number; skill: string; move_no: number; to_period_id: number }): string {
  const conn = db();
  const a = conn.prepare('SELECT a.attempt_no, c.programme_code FROM assessment_attempts a LEFT JOIN classes c ON c.id = a.class_id WHERE a.id = ?').get(req.attempt_id) as any;
  const w = conn.prepare('SELECT week_start FROM report_periods WHERE id = ?').get(req.to_period_id) as any;
  return chuTheDoiLan2({ skill: req.skill, attemptNo: a?.attempt_no ?? null, moveNo: req.move_no, tuanDich: w?.week_start ?? null, homNay: demoToday(), ct: a?.programme_code ?? null });
}

export type MoveOutcome = {
  skill: AssessedSkill;
  /** `moved` đã đổi lịch ngay · `pending` đang chờ duyệt · `escalated` phải chuyển Quản lý. */
  result: 'moved' | 'pending' | 'escalated';
  toWeek: string | null;
  moveNo: number;
  requestId: number | null;
  message: string;
};

/**
 * ĐỀ NGHỊ DỜI VÌ VẮNG — một thao tác cho một hoặc nhiều kỹ năng cùng buổi (mục 10.6).
 *
 * Vắng buổi R/L/W là MỘT lần vắng của ba bốn kỹ năng cùng lúc, nên giao diện gọi một lần
 * với danh sách kỹ năng. Nhưng mỗi kỹ năng vẫn được XỬ LÝ RIÊNG: nếu Listening đã dời một
 * lần còn Reading thì chưa, Listening phải đi xin duyệt trong khi Reading dời được ngay.
 * Gộp chúng lại thành một quyết định chung là dùng thao tác nhóm để vượt quyền.
 */
export function requestAbsenceMove(p: Principal, attemptId: number, skills: string[], opts: {
  reason?: string | null;
  idempotencyKey?: string | null;
  /** Ngày nghiệp vụ dùng để xét — mặc định là ngày demo. Chỉ để kiểm thử các mốc ngày. */
  today?: string;
} = {}): { outcomes: MoveOutcome[] } {
  const attempt = loadAttempt(attemptId);
  if (!canRequest(p, attempt)) {
    throw forbidden('Chỉ giáo viên chủ nhiệm của lớp và Quản lý mới xử lý được việc vắng thi.');
  }
  if (attempt.status === 'cancelled') throw badRequest('Đợt này đã huỷ.');
  const list = [...new Set(skills)];
  if (!list.length) throw badRequest('Chưa chọn kỹ năng nào.');
  const boMon = boMonCuaLuot(db(), attemptId);
  for (const s of list) {
    if (!boMon.includes(s)) throw badRequest(`Kỹ năng ${tenMon(null, s)} không có trong lượt này.`);
  }

  const today = opts.today ?? demoToday();
  const rows = ensureSkillRows(attemptId);

  return tx(() => {
    const conn = db();
    const outcomes: MoveOutcome[] = [];

    for (const skill of list) {
      const row = rows.find((r) => r.skill === skill)!;
      if (attempt.lich_su) throw badRequest('MT lịch sử không vào luồng vắng — nhập bù điểm, không dời lịch.');
      /*
       * ĐIỂM TRỐNG CHƯA ĐỦ ĐỂ XÁC NHẬN VẮNG (mục 10.6). Phải có người xác nhận trước, và đó
       * là một thao tác riêng có tên và có thời điểm.
       */
      if (row.sit_status !== 'absent') {
        throw badRequest(
          `${skillName(skill)} chưa được xác nhận là vắng. Xác nhận vắng trước rồi mới dời lịch — `
          + 'ô điểm trống chưa đủ để kết luận em không đi thi.',
        );
      }
      if (!row.planned_period_id || !row.week_start) {
        throw badRequest(`${skillName(skill)} chưa có tuần thi để dời.`);
      }
      if (pendingMove(attemptId, skill)) {
        throw badRequest(`${skillName(skill)} đã có một đề nghị dời đang chờ Quản lý trả lời.`);
      }
      outcomes.push(xuLyVangMotKyNang(conn, p.userId, attempt, row, {
        lyDo: opts.reason ?? null, today, idem: opts.idempotencyKey ? `${opts.idempotencyKey}:${skill}` : null,
      }));
    }

    return { outcomes };
  });
}

/**
 * LÕI XỬ LÝ VẮNG MỘT KỸ NĂNG (mục 10.6) — dùng chung GVCN bấm "Xử lý vắng" và MÁY TỰ DỜI lúc chốt "-" (Q-A, K4-03). Nơi gọi đã kiểm
 * bài đang `absent`, có tuần, chưa có đề nghị chờ. Gọi trong tx của nơi gọi. `actor = null` = máy.
 */
function xuLyVangMotKyNang(conn: any, actor: number | null, attempt: any, row: any, o: {
  lyDo: string | null; today: string; idem: string | null;
}): MoveOutcome {
  const skill = row.skill as AssessedSkill;
  const attemptId = attempt.id as number;
  const today = o.today;
  const target = nextWeekOf(row.week_start);
  const moveNo = row.absence_move_count + 1;
  const decideBy = decideByOf(target.week_start);
  /* T42, K4-04: đề nghị (lần 2+ hoặc chuyển Quản lý) hết hạn HẾT CHỦ NHẬT CỦA TUẦN GỬI; tuần đích = tuần chưa bắt đầu gần nhất hợp T15. */
  const hanDeNghi = hanDuyetDoiLan2(today);
  const check = checkSkillWeekMove({ attemptId, skill, newWeekStart: target.week_start });

  /*
   * BA ĐƯỜNG RẼ, và thứ tự kiểm chính là thứ tự luật:
   *
   *   · tuần đích đã qua, hoặc đụng đợt sau, hoặc hạn duyệt đã trôi → CHUYỂN QUẢN LÝ.
   *     Không giả một khoảng chờ đã hết, và cũng không tự coi như đã được duyệt.
   *   · lần đầu và mọi thứ sạch sẽ → DỜI NGAY (GVCN bấm, hoặc máy tự dời lúc chốt "-").
   *   · từ lần thứ hai → GỬI ĐỀ NGHỊ, lịch giữ nguyên cho tới khi có người duyệt.
   *
   * BÀI ĐÃ CHỐT "KHÔNG DỰ THI" (rule book §17.1): việc chốt xảy ra NGAY khi hết Chủ nhật, nên lúc xử lý thì tuần kế tiếp LUÔN đã
   * bắt đầu. Với lần dời ĐẦU của bài đã chốt, chỉ cần tuần đích CHƯA KẾT THÚC (còn thi được). Tuần đích đã qua hẳn thì vẫn chuyển
   * Quản lý, để xử lý muộn không âm thầm thành thêm tuần. Mọi trường hợp vắng khác giữ nguyên.
   */
  const fromNoShow = row.absent_from_no_show === 1;
  const tooLate = moveNo === 1 && fromNoShow
    ? addDays(target.week_start, 6) < today
    : target.week_start <= today || decideBy < today;

  if (moveNo === 1 && !tooLate && !check.blockers.length) {
    applyMove(conn, actor, attempt, row, target, o.lyDo, moveNo, actor === null);
    return {
      skill, result: 'moved', toWeek: target.code, moveNo, requestId: null,
      message: `${skillName(skill)} đã dời sang tuần ${target.code}. Đây là lần dời do vắng thứ nhất.`,
    };
  }

  const escalate = tooLate || check.blockers.length > 0;
  const dich = (moveNo > 1 || escalate ? tuanDichMacDinh(attemptId, skill, today) : null) ?? target;
  const id = insertRequest(conn, {
    attemptId, skill, moveNo, from: row.planned_period_id, to: dich.id,
    /* Máy gửi (lần 2 / chuyển Quản lý) thì lý do là dấu "-", không phải "máy tự dời" — thẻ Lịch thi đọc câu này. */
    reason: actor === null ? 'Không dự thi — dấu "-" còn nguyên đến hết Chủ nhật' : o.lyDo, by: actor, on: today, decideBy: hanDeNghi, idem: o.idem,
  });
  const han = `hết Chủ nhật ${ngay(hanDeNghi, today)}`;
  /* PR-DUYET: `insertRequest` đã tạo thẻ Lịch thi (hạn = `hanDuyetDoiLan2`, người xin null khi máy gửi) — không báo riêng người xếp lịch. */
  if (escalate) {
    const why = check.blockers.length
      ? check.blockers.join(' ')
      : `Tuần kế tiếp (${target.code}) đã bắt đầu hoặc đã qua hạn duyệt.`;
    return {
      skill, result: 'escalated', toWeek: dich.code, moveNo, requestId: id,
      message: `${skillName(skill)}: ${why} Việc đã chuyển cho Quản lý xếp lại.`,
    };
  }
  return {
    skill, result: 'pending', toWeek: dich.code, moveNo, requestId: id,
    message: `${skillName(skill)}: đây là lần dời thứ ${moveNo}, cần Quản lý duyệt trước ${han}. `
      + 'Lịch giữ nguyên cho tới khi có quyết định.',
  };
}

function insertRequest(conn: any, r: {
  attemptId: number; skill: string; moveNo: number;
  from: number | null; to: number; reason: string | null;
  by: number | null; on: string; decideBy: string; idem: string | null;
}): number {
  /*
   * GỬI HAI LẦN CÙNG MỘT ĐỀ NGHỊ KHÔNG THÀNH HAI LẦN DỜI (mục 10.6).
   *
   * Bấm hai lần, mạng chập, hoặc trình duyệt tự gửi lại — cả ba đều có thật, và cả ba đều
   * kết thúc bằng việc em được dời hai tuần mà không ai chủ ý.
   */
  if (r.idem) {
    const dup = conn.prepare('SELECT id FROM skill_move_requests WHERE idempotency_key = ?').get(r.idem) as any;
    if (dup) return dup.id;
  }
  const info = conn
    .prepare(
      `INSERT INTO skill_move_requests (attempt_id, skill, move_no, from_period_id, to_period_id,
                                        reason, requested_by, requested_on, decide_by, status,
                                        idempotency_key, created_at)
       VALUES (?,?,?,?,?,?,?,?,?, 'pending', ?, ?)`,
    )
    .run(r.attemptId, r.skill, r.moveNo, r.from, r.to, r.reason, r.by, r.on, r.decideBy, r.idem, nowIso());
  const id = Number(info.lastInsertRowid);
  /* PR-DUYET (K4-04 phần thẻ): mọi đề nghị chờ QL là MỘT thẻ Lịch thi; hạn thẻ CHÉP `decide_by` (luật hạn thuộc PR-MT). */
  const a = conn.prepare('SELECT student_id, class_id FROM assessment_attempts WHERE id = ?').get(r.attemptId) as any;
  taoYeuCau(conn, {
    loai: 'lich_thi', doiTuongLoai: 'skill_move', doiTuongId: id, hocVienId: a?.student_id ?? null, lopId: a?.class_id ?? null,
    nguoiXin: r.by, lyDo: r.reason, hanDuyet: r.decideBy,
  });
  return id;
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
              sit_note = NULL, absent_from_no_show = 0, absence_move_count = ?, updated_at = ?
        WHERE id = ?`,
    )
    .run(target.id, moveNo, nowIso(), row.id);
  logSchedule(attempt.id, {
    action: 'skill_week_moved_absence', field: row.skill,
    oldValue: row.period_code, newValue: target.code,
    reason: reason ?? `Dời do vắng lần ${moveNo}`, actor,
  });
  recomputeCompletionWeek(attempt.id, actor);
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
  if (attempt.lich_su) throw badRequest('MT lịch sử không vào luồng vắng — nhập bù điểm, không dời lịch.');
  if (req.status !== 'pending') {
    throw badRequest('Đề nghị này đã được xử lý — không trả lời lại được.');
  }
  if (attempt.status === 'cancelled') throw badRequest('Lượt này đã huỷ — đề nghị dời không còn hiệu lực.');
  const note = (input.note ?? '').trim() || null;
  /* PR-DUYET (§5.5, M8/Q11): từ chối = huỷ phần thi của em — bắt buộc lý do để GVCN biết vì sao. */
  if (!input.approve && (note ?? '').length < 3) throw badRequest('Từ chối thì ghi lý do (ít nhất 3 ký tự) để GVCN biết vì sao.');

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
      cancelPart(conn, p.userId, attempt, row, requestId, 'Quản lý từ chối đề nghị dời lịch.');
      chotYeuCau(conn, { loai: 'lich_thi', doiTuongLoai: 'skill_move', doiTuongId: requestId }, 'tu_choi', { nguoiDuyet: p.userId, lyDo: note });
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
      throw badRequest(
        `Tuần ${target.code} đã bắt đầu. Chọn một tuần chưa tới để lịch mới là một buổi thi có thật.`,
      );
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
    return { ok: true, status: 'approved', week: target.code, warnings: check.warnings };
  });
}

/**
 * HẾT HẠN MÀ CHƯA AI TRẢ LỜI → HUỶ (mục 10.6).
 *
 * Quét này chạy khi có người mở màn hình liên quan, vì bản demo không có tiến trình nền.
 * Không huỷ ngay lúc vừa gửi đề nghị: khoảng chờ là có thật, và nó là của Quản lý.
 */
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
      cancelPart(conn, null, attempt, row, req.id, 'Hết hạn duyệt mà chưa có quyết định.');
      chotYeuCau(conn, { loai: 'lich_thi', doiTuongLoai: 'skill_move', doiTuongId: req.id }, 'tu_dong', { lyDo: 'Hết hạn duyệt — phần thi bị huỷ' });
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
      ? `Đã huỷ lịch hẹn ${skillName(row.skill)} — ${why} Môn này vẫn phải thi, chờ Quản lý xếp lại.`
      : `Đã huỷ phần thi ${skillName(row.skill)} — ${why} Đợt này chưa đủ kết quả cho tới khi được khôi phục.`,
    requestId, actor, {},
    ratio ? `Xếp lại lịch ${skillName(row.skill)}` : `Khôi phục phần thi ${skillName(row.skill)}`,
  );
}

/**
 * KHÔI PHỤC PHẦN ĐÃ HUỶ — chỉ Quản lý, và ĐẶT TUẦN MỚI TRONG CÙNG THAO TÁC (mục 10.6).
 *
 * Tách làm hai bước thì sẽ có những phần được khôi phục mà không có tuần, nằm im ở đúng
 * trạng thái mà cả mục này sinh ra để dọn.
 *
 * Khôi phục KHÔNG đặt lại bộ đếm dời: những lần em vắng trước đó vẫn đã xảy ra.
 */
export function restoreCancelledSkill(p: Principal, attemptId: number, skill: string, periodId: number, opts: {
  reason?: string | null;
} = {}) {
  const attempt = loadAttempt(attemptId);
  if (!canDecide(p, attempt)) {
    throw forbidden('Chỉ Quản lý mới khôi phục được phần thi đã huỷ và đặt tuần mới.');
  }
  const rows = ensureSkillRows(attemptId);
  const row = rows.find((r) => r.skill === skill);
  if (!row) throw badRequest('Kỹ năng không hợp lệ.');
  const ratio = isRatio(attempt);
  if (!ratio && row.sit_status !== 'cancelled') {
    throw badRequest(`${skillName(skill)} chưa bị huỷ — không có gì để khôi phục.`);
  }
  if (ratio && row.planned_period_id) {
    throw badRequest(`${skillName(skill)} đang có lịch hẹn — dùng thao tác đổi lịch thường.`);
  }

  const period = db().prepare('SELECT * FROM report_periods WHERE id = ?').get(periodId) as any;
  if (!period) throw notFound('Không tìm thấy tuần.');
  if (period.week_start <= demoToday()) {
    throw badRequest(`Tuần ${period.code} đã bắt đầu. Chọn một tuần chưa tới.`);
  }
  const check = checkSkillWeekMove({ attemptId, skill: skill as AssessedSkill, newWeekStart: period.week_start });
  if (check.blockers.length) throw badRequest(check.blockers.join(' '));

  return tx(() => {
    const conn = db();
    conn
      .prepare(
        `UPDATE attempt_skills SET sit_status = 'scheduled', absent_from_no_show = 0, planned_period_id = ?,
                plan_source = 'manual', updated_at = ? WHERE id = ?`,
      )
      .run(periodId, nowIso(), row.id);
    logSchedule(attemptId, {
      action: 'skill_part_restored', field: skill,
      oldValue: row.period_code, newValue: period.code,
      reason: opts.reason ?? 'Quản lý khôi phục và đặt tuần mới', actor: p.userId,
    });
    const cw = recomputeCompletionWeek(attemptId, p.userId);
    writeAudit({
      actorUserId: p.userId, action: 'attempt.restore_part', entityType: 'assessment_attempt',
      entityId: attemptId, entityLabel: `${attemptId} · ${skill}`,
      before: { sitStatus: row.sit_status }, after: { week: period.code },
    });
    return { ok: true, completionWeek: cw, warnings: check.warnings };
  });
}

/** Báo cho những người xếp lịch của chi nhánh — không gửi cho cả trường. */
function notifyPlanners(
  attempt: any, message: string, refId: number, actor: number | null,
  opts: { entityType?: string; dedupBase?: string } = {},
  /** PR-VAI-a (K1-42, Q20): tiêu đề = việc + em + lớp — không còn một tiêu đề lịch thi chung chung cho mọi trường hợp. */
  viec = 'Xử lý lịch thi',
) {
  const conn = db();
  const ai = conn.prepare('SELECT s.full_name AS hv, (SELECT code FROM classes WHERE id = ?) AS lop FROM students s WHERE s.id = ?')
    .get(attempt.class_id ?? null, attempt.student_id) as any;
  const tieuDe = [viec, [ai?.hv, ai?.lop].filter(Boolean).join(' · ')].filter(Boolean).join(' — ');
  const cls = attempt.class_id
    ? (conn.prepare('SELECT branch_id FROM classes WHERE id = ?').get(attempt.class_id) as any)
    : null;
  /* Quản lý của CHÍNH chi nhánh đó, cộng người có phạm vi toàn hệ thống. */
  const managers = conn
    .prepare(
      `SELECT DISTINCT ur.user_id FROM user_roles ur
         JOIN roles r ON r.id = ur.role_id
        WHERE r.key IN ('manager', 'system_admin')
          AND ur.status = 'active'
          AND (ur.branch_id IS NULL OR ur.branch_id = ?)`,
    )
    .all(cls?.branch_id ?? -1) as any[];
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
 * CHỐT "KHÔNG DỰ THI" CUỐI CHỦ NHẬT — rule book §17.1.
 *
 * GV nhập '-' ở ô điểm để báo em có lịch nhưng không làm bài; còn nguyên khi hết Chủ nhật thì xác lập
 * KHÔNG DỰ THI, và từ đó đi tiếp vào luật vắng đã có (lần đầu GVCN dời, từ lần hai Quản lý duyệt). Không
 * còn bước GVCN xác minh thường lệ.
 *
 * DỰ ÁN KHÔNG CÓ CRON, nên "kể cả không ai mở web" được làm bằng cách khác: kết quả chốt là HÀM THUẦN
 * theo (dấu '-', TUẦN CỦA CHÍNH BÀI, ngày nghiệp vụ) — xem `noShowStateOf` — và hàm này được gọi ở
 * đường đọc, đúng khuôn mẫu của `sweepExpiredMoves`. Chạy lúc nào cũng ra cùng kết quả và cùng ngày hiệu
 * lực (cuối Chủ nhật của tuần thi), không phải ngày nó chạy.
 *
 * BA ĐIỀU ĐẢM BẢO:
 *   · IDEMPOTENT. Mỗi (lượt, kỹ năng) chỉ chốt MỘT lần: chỉ chuyển `scheduled` → `absent`, và đánh dấu
 *     `no_show_settled_at`. Gọi mười lần ra một lần chốt, bộ đếm vắng không tăng.
 *   · THEO ĐƠN VỊ LỊCH, KHÔNG THEO SỐ Ô. W1 và W2 cùng một buổi Writing chỉ được chốt khi CẢ HAI đều là
 *     '-' — và chỉ tăng bộ đếm MỘT lần. W1 '-' mà W2 có điểm (hay chưa nhập) thì buổi đó không phải vắng.
 *   · KHÔNG ĐỤNG BÀI KHÁC. Không xoá điểm nào, không suy ô trống thành vắng.
 *
 * Chỉ áp cho Mock (Fast Track). Normal vẫn phải đủ bốn môn, không có chốt vắng.
 * Dấu '-' nhập cho tuần ĐÃ KẾT THÚC từ trước (C10, chốt 20/09/2026 "chốt ngay") cũng được chốt ở đây, ngay lần gọi kế tiếp —
 * `saveScore` gọi hàm này tức thì sau khi ghi dấu muộn. Đường "chờ Quản lý hiệu chỉnh" còn mã nhưng không dùng.
 *
 * Trả về số buổi vừa được chốt (0 khi chạy lại).
 */
export function settleNoShows(today: string = demoToday()): number {
  const conn = db();
  const lateRule = C10_NHAP_DAU_TRU_TUAN_QUA_KHU as string;
  const rows = conn
    .prepare(
      `SELECT s.id AS score_id, s.attempt_id, s.skill AS entry_skill, s.no_show_late,
              k.id AS sched_id, k.skill AS assessed, rp.week_end, rp.code AS period_code
         FROM assessment_scores s
         JOIN assessment_attempts a ON a.id = s.attempt_id AND a.status != 'cancelled' AND a.kind = 'mock' AND a.lich_su = 0
         JOIN attempt_skills k ON k.attempt_id = s.attempt_id
              AND k.skill = CASE WHEN s.skill IN ('writing1', 'writing2') THEN 'writing' ELSE s.skill END
         JOIN report_periods rp ON rp.id = k.planned_period_id
        WHERE s.no_show_period_id IS NOT NULL AND s.no_show_settled_at IS NULL
          AND s.no_show_period_id = k.planned_period_id
          AND s.band IS NULL AND s.raw_score IS NULL
          AND k.required = 1 AND k.sit_status = 'scheduled'
          AND rp.week_end < ?
          AND (s.no_show_late = 0 OR ? = 'chot-ngay')
        ORDER BY s.attempt_id, k.id, s.id`,
    )
    .all(today, lateRule) as any[];
  if (!rows.length) return 0;

  /* Gom theo ĐƠN VỊ LỊCH: một buổi (lượt × kỹ năng đánh giá), không theo ô nhập. */
  const groups = new Map<number, any[]>();
  for (const r of rows) {
    if (!groups.has(r.sched_id)) groups.set(r.sched_id, []);
    groups.get(r.sched_id)!.push(r);
  }
  let settled = 0;
  tx(() => {
    for (const g of groups.values()) {
      const first = g[0];
      const needed = entrySkillsOf(first.assessed as AssessedSkill);
      /* Đủ mọi ô nhập của buổi đều '-'? Thiếu một ô (chưa nhập hay đã có điểm) thì buổi đó không phải vắng. */
      if (!needed.every((k) => g.some((r) => r.entry_skill === k))) continue;
      if (settleGroup(conn, first.attempt_id, first.sched_id, first.assessed, first.week_end,
        first.period_code, g.map((r) => r.score_id), null, 'Không dự thi — dấu "-" còn nguyên đến hết Chủ nhật.', today)) {
        settled += 1;
      }
    }
  });
  return settled;
}

/**
 * Chốt MỘT buổi. Trả false khi buổi đã được chốt hoặc đã đổi — nên chạy lặp là vô hại.
 *
 * CHỐNG CHỐT HAI LẦN (rà #119 mục 4): máy tự dời trả bài về `scheduled` ở TUẦN MỚI, nên "còn scheduled" không đủ — tiến trình thứ hai
 * (Netlify nhiều instance) đọc danh sách trước khi tiến trình đầu ghi sẽ chốt lại và sinh đề nghị "lần 2" giả. Điều kiện thật: dấu "-"
 * đầu buổi CHƯA chốt và vẫn nằm ĐÚNG tuần đang xếp. Xuất ra để phép kiểm dựng lại cuộc đua bằng danh sách cũ.
 */
export function settleGroup(
  conn: any, attemptId: number, schedId: number, assessed: string, weekEnd: string, periodCode: string,
  scoreIds: number[], actor: number | null, reason: string, today: string = demoToday(),
): boolean {
  /* 23:59:59 giờ Việt Nam của Chủ nhật = 16:59:59Z: ngày hiệu lực luôn là cuối Chủ nhật, không phải lúc chạy. */
  const effective = `${weekEnd.slice(0, 10)}T16:59:59.000Z`;
  const changed = conn
    .prepare(
      `UPDATE attempt_skills
          SET sit_status = 'absent', absent_from_no_show = 1, sit_by = ?, sit_at = ?, sit_note = ?, updated_at = ?
        WHERE id = ? AND sit_status = 'scheduled'
          AND EXISTS (SELECT 1 FROM assessment_scores sc WHERE sc.id = ? AND sc.no_show_settled_at IS NULL
                         AND sc.no_show_period_id = attempt_skills.planned_period_id)`,
    )
    .run(actor, effective, reason, nowIso(), schedId, scoreIds[0]).changes;
  if (!changed) return false;
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
  /*
   * Q-A, K4-03 — MÁY TỰ XỬ LÝ NGAY TRONG CÙNG GIAO DỊCH ("không ai quên"): lần 1 + tuần kế tiếp còn thi được + không chặn T15 → tự dời;
   * còn lại → đề nghị chờ Quản lý (hạn hết Chủ nhật tuần này). Lớp thường không qua đây (chỉ Mock).
   */
  const row = ensureSkillRows(attemptId).find((r) => r.skill === assessed)!;
  const kq = xuLyVangMotKyNang(conn, null, attempt, row, {
    lyDo: 'Không dự thi — máy tự dời', today, idem: `auto-vang:${schedId}:${weekEnd.slice(0, 10)}`,
  });
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
      notify({
        userId: t.user_id, kind: 'tu_doi_lich', title: 'Đã tự dời bài không dự thi',   // PR-VAI-a (Q19): tin để biết, tách khỏi schedule_move
        body: `Đã tự dời ${skillName(assessed)} của ${em} · MT${attempt.attempt_no} sang ${tuanMoi} (vắng lần 1).`,
        entityType: 'assessment_attempt', entityId: attemptId,
        dedupKey: `no_show:${attemptId}:${assessed}:${weekEnd.slice(0, 10)}:${t.user_id}`,
      });
    }
  }
  return true;
}

/**
 * BÁO QUẢN LÝ có một dấu '-' nhập cho tuần ĐÃ KẾT THÚC (C10). Không tự chốt, không âm thầm mở lại tuần đã
 * chốt: tạo một mục chờ Quản lý hiệu chỉnh.
 */
export function flagLateNoShow(attempt: any, assessed: string, weekCode: string, actor: number | null) {
  notifyPlanners(
    attempt,
    `Có dấu "-" nhập cho ${skillName(assessed)} tuần ${weekCode} — tuần đã kết thúc. `
      + 'Cần Quản lý xác nhận không dự thi hoặc từ chối.',
    attempt.id, actor,
    /* Trỏ về ĐÚNG lượt thi (không phải một đề nghị dời), và mỗi (lượt, môn, tuần) một thông báo riêng. */
    { entityType: 'assessment_attempt', dedupBase: `late_no_show:${attempt.id}:${assessed}:${weekCode}` },
    `Xác nhận không dự thi ${skillName(assessed)}`,
  );
}

/**
 * QUẢN LÝ HIỆU CHỈNH MỘT DẤU '-' NHẬP CHO TUẦN ĐÃ KẾT THÚC (C10).
 *
 * `confirm` → chốt không dự thi ngay, đúng một lần, rồi đi tiếp vào luật vắng đã có. `reject` → gỡ dấu '-'
 * (dữ liệu nhập sai). Chỉ Quản lý có quyền xếp lịch — GVCN không tự mở lại một tuần đã kết thúc.
 */
export function resolveLateNoShow(
  p: Principal, attemptId: number, skill: string, decision: 'confirm' | 'reject', today: string = demoToday(),
) {
  const attempt = loadAttempt(attemptId);
  if (!canDecide(p, attempt)) {
    throw forbidden('Chỉ Quản lý mới hiệu chỉnh được dấu "-" của một tuần đã kết thúc.');
  }
  if (decision !== 'confirm' && decision !== 'reject') throw badRequest('Quyết định không hợp lệ.');
  const assessed = assessedSkillOf(skill);
  const conn = db();
  void today;
  return tx(() => {
    const marks = conn
      .prepare(
        `SELECT s.id, s.skill FROM assessment_scores s
           JOIN attempt_skills k ON k.attempt_id = s.attempt_id AND k.skill = ?
          WHERE s.attempt_id = ? AND s.skill IN (${entrySkillsOf(assessed).map(() => '?').join(',')})
            AND s.no_show_period_id = k.planned_period_id AND s.no_show_late = 1 AND s.no_show_settled_at IS NULL
            AND s.band IS NULL AND s.raw_score IS NULL`,
      )
      .all(assessed, attemptId, ...entrySkillsOf(assessed)) as any[];
    if (!marks.length) throw badRequest('Không có dấu "-" nào đang chờ Quản lý hiệu chỉnh.');
    /* Cùng luật với chốt cuối Chủ nhật: buổi Writing chỉ là vắng khi CẢ HAI task đều "-". */
    const enough = entrySkillsOf(assessed).every((k) => marks.some((m: any) => m.skill === k));
    if (decision === 'confirm' && !enough) {
      throw badRequest('Buổi này chỉ được xác nhận không dự thi khi mọi bài của buổi đều là "-". Bài còn lại đã có điểm hoặc chưa báo.');
    }
    const sched = conn
      .prepare(
        `SELECT k.id, rp.week_end, rp.code FROM attempt_skills k JOIN report_periods rp ON rp.id = k.planned_period_id
          WHERE k.attempt_id = ? AND k.skill = ?`,
      )
      .get(attemptId, assessed) as any;
    if (decision === 'reject') {
      conn
        .prepare(
          `UPDATE assessment_scores SET no_show_period_id = NULL, no_show_by = NULL, no_show_at = NULL,
                  no_show_late = 0, no_show_settled_at = NULL WHERE id IN (${marks.map(() => '?').join(',')})`,
        )
        .run(...marks.map((m) => m.id));
      logSchedule(attemptId, {
        action: 'skill_no_show_rejected', field: assessed, oldValue: '-', newValue: null,
        reason: 'Quản lý từ chối dấu "-" nhập cho tuần đã kết thúc.', actor: p.userId,
      });
      return { ok: true, result: 'rejected' as const };
    }
    const done = settleGroup(conn, attemptId, sched.id, assessed, sched.week_end, sched.code,
      marks.map((m) => m.id), p.userId, 'Không dự thi — Quản lý xác nhận dấu "-" nhập cho tuần đã kết thúc.');
    return { ok: true, result: done ? ('confirmed' as const) : ('unchanged' as const) };
  });
}

/** Danh sách đề nghị đang chờ, cho hàng việc của Quản lý. */
export function openMoveRequests(p: Principal, limit = 50) {
  sweepExpiredMoves();
  const rows = db()
    .prepare(
      `SELECT r.*, a.attempt_no, a.kind, a.class_id, a.student_id,
              s.full_name AS student_name, s.code AS student_code,
              c.code AS class_code, pr.code AS to_week, pr.week_start AS to_week_start
         FROM skill_move_requests r
         JOIN assessment_attempts a ON a.id = r.attempt_id
         JOIN students s ON s.id = a.student_id
         LEFT JOIN classes c ON c.id = a.class_id
         LEFT JOIN report_periods pr ON pr.id = r.to_period_id
        WHERE r.status = 'pending'
        ORDER BY r.decide_by, r.id
        LIMIT ?`,
    )
    .all(limit) as any[];
  return rows.filter((r) => can(p, PERMISSIONS.PLAN_WEEK, { classId: r.class_id, studentId: r.student_id }));
}

/**
 * T38 "Báo vắng" (PR-XLMT, K4-28, Q10): ghi "-" cho MỌI ô nhập của kỹ năng (W = W1 + W2) rồi CHỐT NGAY qua `settleGroup` —
 * lần vắng đầu máy tự dời, từ lần 2 thành đề nghị chờ Quản lý (Q-A, nằm sẵn trong `settleGroup`). GVCN của lớp / Quản lý.
 */
export function baoVang(p: Principal, attemptId: number, skill: string, lyDo: string, today: string = demoToday()) {
  const conn = db();
  const a = loadAttempt(attemptId);
  if (!canRequest(p, a)) throw forbidden('Chỉ giáo viên chủ nhiệm của lớp và Quản lý báo vắng được.');
  if (a.kind !== 'mock') throw badRequest('Bài lớp thường báo vắng ở bảng điểm lớp thường.');
  if (a.status === 'cancelled') throw badRequest('Đợt này đã huỷ.');
  if (a.lich_su) throw badRequest('MT lịch sử không vào luồng vắng — nhập bù điểm, không dời lịch.');
  const loi = kiemLyDoThaoTac('Báo vắng', lyDo);
  if (loi) throw badRequest(loi);
  const row = ensureSkillRows(attemptId).find((r) => r.skill === skill);
  if (!row?.required) throw badRequest(`${skillName(skill)} không nằm trong đợt này.`);
  if (row.sit_status !== 'scheduled' || !row.planned_period_id || !row.week_start || !row.week_end) {
    throw badRequest(`${skillName(skill)} không còn chờ thi (đã thi, đang vắng hoặc đã huỷ) — không báo vắng được.`);
  }
  if (row.week_start.slice(0, 10) > mondayOf(today)) {
    throw badRequest(`${skillName(skill)} chưa tới tuần thi — muốn đổi tuần thì "Dời lịch thi".`);
  }
  return tx(() => {
    const ids: number[] = [];
    for (const e of entrySkillsOf(skill as AssessedSkill)) {
      const s = conn.prepare('SELECT * FROM assessment_scores WHERE attempt_id = ? AND skill = ?').get(attemptId, e) as any;
      if (s && ((s.band ?? null) !== null || (s.raw_score ?? null) !== null)) throw badRequest(`${skillName(skill)} đã có điểm — không báo vắng.`);
      if (s) {
        conn.prepare(`UPDATE assessment_scores SET no_show_period_id = ?, no_show_by = ?, no_show_at = ?, no_show_late = 0, no_show_settled_at = NULL WHERE id = ?`)
          .run(row.planned_period_id, p.userId, nowIso(), s.id);
        ids.push(s.id);
      } else {
        ids.push(Number(conn.prepare(`INSERT INTO assessment_scores (attempt_id, skill, no_show_period_id, no_show_by, no_show_at) VALUES (?,?,?,?,?)`)
          .run(attemptId, e, row.planned_period_id, p.userId, nowIso()).lastInsertRowid));
      }
    }
    settleGroup(conn, attemptId, row.id, skill, row.week_end!, row.period_code ?? '', ids, p.userId, `Báo vắng: ${lyDo.trim()}`, today);
    const sau = ensureSkillRows(attemptId).find((r) => r.skill === skill)!;
    return { daDoi: sau.sit_status === 'scheduled', tuanMoi: sau.week_start, choDuyet: !!pendingMove(attemptId, skill) };
  });
}
