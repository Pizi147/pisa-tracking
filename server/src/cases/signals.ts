import { db, tx } from '../db.ts';
import {
  ENTRY_SKILL_LABEL, PERMISSIONS, REGULAR_SKILL_LABEL, SIGNAL_DISMISS_NOTE, SIGNAL_STATUS_LABEL,
  SIGNAL_WITHDRAW_SCORE_FIXED, signalVerifyDue,
  type CaseCategory, type EntrySkill, type SignalStatus,
} from '../../../shared/domain/index.ts';
import { demoToday } from '../demoConfig.ts';
import { badRequest, forbidden, notFound, nowIso } from '../util.ts';
import { can, classScopeSql, require_, scopeFor, type Principal } from '../permissions.ts';
import { notify, writeAudit } from '../platform/audit.ts';
import { suggestCaseOwner } from './owner.ts';

/**
 * TÍN HIỆU TỪ ĐIỂM — nơi sở hữu duy nhất của mục 6.2.
 *
 * Luật cốt lõi, và nó là một sự ĐẢO NGƯỢC so với mọi vòng trước: **kết quả dưới kỳ vọng
 * không tự mở case và không tự sinh phương án hỗ trợ nào.** Nó chỉ sinh một tín hiệu, giao
 * cho đúng một người, kèm hạn ba ngày để người đó xác minh.
 *
 * Vì sao phải đảo: hệ thống cũ nhìn "band 5.5 < kỳ vọng 6.0" rồi tự viết ra một case có tên
 * và một phương án "xếp tự học". Hai thứ đó trông như đã có người chẩn đoán và đã có người
 * lo, trong khi chưa ai đụng vào. Bảng tổng hợp vì thế đếm được rất nhiều case và rất nhiều
 * phương án, mà không phản ánh một việc thật nào.
 *
 * RULEBOOK v3 (21/09/2026 tối) ĐỔI LUẬT NÀY CHO MOCK TEST FAST TRACK: điểm dưới kỳ vọng nay TỰ TẠO (hoặc tự gắn) case cho từng kỹ năng trượt và điền
 * sẵn phương án chờ GVBM xác nhận — xem `cases/sos.ts` (`raiseSignalsForResult`) và `cases/sosAuto.ts`. Tín hiệu ở đó nối NGAY vào case (`linked`,
 * hạn 3 ngày giữ nguyên) và là dây nối để thu hồi khi sửa điểm. Lớp NORMAL giữ nguyên mô hình mô tả dưới đây (Q-V3-1).
 *
 * Ba điều hàm trong file này KHÔNG bao giờ làm (với lớp Normal; với Mock FT thì việc tạo case nằm ở `sos.ts`, không ở đây):
 *
 *   · không đoán nguyên nhân — tên, mô tả và phân loại là việc của người dạy;
 *   · không tạo phương án — kể cả khi nhập từng môn, chấm lại hay chạy lại bộ demo;
 *   · không kết luận em thiếu ý thức từ một mức SOS. (Tín hiệu Ý thức/Khác cho GVCN đã bỏ 21/09/2026.)
 */

export type SignalRow = {
  id: number;
  student_id: number; cycle_id: number | null; attempt_id: number | null; class_id: number | null;
  skill: string | null; category: string | null;
  band: number | null; expectation: number | null; sos_level: number | null;
  detected_on: string; raised_on: string; verify_due: string;
  owner_user_id: number | null;
  status: SignalStatus; case_id: number | null;
  resolved_by: number | null; resolved_at: string | null; resolution_note: string | null;
  withdrawn_reason: string | null;
  dedup_key: string | null;
};

/** Khoá chống trùng: một đợt × một ô nhập điểm = ĐÚNG MỘT tín hiệu, mãi mãi. */
export function signalKey(attemptId: number, skill: string | null): string {
  return `mt:${attemptId}:${skill ?? ''}`;
}

// ---------------------------------------------------------------- sinh tín hiệu

/**
 * GHI NHẬN MỘT TÍN HIỆU, hoặc cập nhật tín hiệu đã có cho cùng nguồn.
 *
 * Gọi lại bao nhiêu lần cũng chỉ ra một dòng. Điều này không chỉ để dữ liệu sạch — nó giữ
 * lời hứa ở mục 6.2: **hạn ba ngày không được đặt lại chỉ vì ai đó bấm lưu thêm một lần.**
 * Nhập bổ sung môn khác trong cùng đợt, chấm lại, hay retry đều đi qua đây.
 *
 * Tín hiệu đã bị thu hồi mà nguồn lại có căn cứ trở lại (sửa điểm xuống dưới kỳ vọng lần
 * nữa) thì MỞ LẠI với hạn mới: lần này là một sự thật mới, không phải lần cũ lặp lại.
 */
export function raiseSignal(input: {
  actorUserId: number | null;
  studentId: number; cycleId: number | null; attemptId: number | null; classId: number | null;
  skill: string | null;
  category: CaseCategory | string | null;
  band?: number | null; expectation?: number | null; sosLevel?: number | null;
  detectedOn: string;
  /** Ngày ghi nhận. Mặc định là hôm nay — KHÔNG lùi về tuần thi đã qua. */
  raisedOn?: string;
  /**
   * Không gửi thông báo "Cần xác minh". Dùng khi tín hiệu sẽ được GẮN NGAY vào một case (rulebook v3: Mock Test FT tự tạo/gắn case) —
   * lúc đó chẳng còn gì để "xác minh", và người phụ trách nhận một thông báo riêng nói đúng việc (case mới, chờ xác nhận phương án).
   */
  silent?: boolean;
}): SignalRow {
  const conn = db();
  const key = input.attemptId ? signalKey(input.attemptId, input.skill) : null;
  const existing = key ? (conn.prepare('SELECT * FROM case_signals WHERE dedup_key = ?').get(key) as SignalRow | undefined) : undefined;

  if (existing) {
    if (existing.status === 'withdrawn') {
      const raisedOn = input.raisedOn ?? demoToday();
      conn
        .prepare(
          /*
           * Mở lại thì phải XOÁ SẠCH dấu vết của lần xử lý trước, kể cả `case_id`. Giữ lại
           * case cũ trên một tín hiệu đang chờ là một mâu thuẫn: chờ nghĩa là chưa thành gì.
           */
          `UPDATE case_signals SET status = 'pending', band = ?, expectation = ?, sos_level = ?,
                  raised_on = ?, verify_due = ?, withdrawn_reason = NULL, case_id = NULL,
                  resolved_by = NULL, resolved_at = NULL, resolution_note = NULL, updated_at = ?
            WHERE id = ?`,
        )
        .run(input.band ?? null, input.expectation ?? null, input.sosLevel ?? null,
             raisedOn, signalVerifyDue(raisedOn), nowIso(), existing.id);
    } else {
      /*
       * Cập nhật con số, GIỮ NGUYÊN `raised_on` và `verify_due`. Đây chính là chỗ mục 6.2
       * nói "giữ thời điểm/hạn ban đầu của tín hiệu còn hợp lệ, không reset hạn do lưu lại".
       */
      conn
        .prepare('UPDATE case_signals SET band = ?, expectation = ?, sos_level = ?, updated_at = ? WHERE id = ?')
        .run(input.band ?? null, input.expectation ?? null, input.sosLevel ?? null, nowIso(), existing.id);
    }
    return conn.prepare('SELECT * FROM case_signals WHERE id = ?').get(existing.id) as SignalRow;
  }

  const raisedOn = input.raisedOn ?? demoToday();
  const owner = suggestCaseOwner({
    classId: input.classId, category: (input.category as string) ?? null,
  });
  const info = conn
    .prepare(
      `INSERT INTO case_signals (student_id, cycle_id, attempt_id, class_id, skill, category,
                                 band, expectation, sos_level, detected_on, raised_on, verify_due,
                                 owner_user_id, status, dedup_key, created_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?, 'pending', ?,?)`,
    )
    .run(input.studentId, input.cycleId, input.attemptId, input.classId,
         input.skill, input.category ?? null,
         input.band ?? null, input.expectation ?? null, input.sosLevel ?? null,
         input.detectedOn, raisedOn, signalVerifyDue(raisedOn), owner, key, nowIso());
  const row = conn.prepare('SELECT * FROM case_signals WHERE id = ?').get(Number(info.lastInsertRowid)) as SignalRow;

  /*
   * BÁO ĐÚNG NGƯỜI PHẢI XÁC MINH, không báo cả lớp. Không có người phù hợp thì không báo
   * ai — và tín hiệu vẫn nằm trong hàng "chưa có người xác minh" để Quản lý phân công.
   */
  if (owner && !input.silent) {
    const st = conn.prepare('SELECT full_name, student_code FROM students WHERE id = ?').get(input.studentId) as any;
    notify({
      userId: owner, kind: 'sos',
      title: `Cần xác minh: ${labelOf(row)} — ${st?.full_name ?? ''}`,
      body: `Hạn ${row.verify_due}. Tín hiệu từ điểm, chưa phải case.`,
      entityType: 'case_signal', entityId: row.id,
      dedupKey: `signal:${row.id}`,
    });
  }
  return row;
}

/**
 * Tên ngắn của tín hiệu: môn nào.
 *
 * Hai bộ mã cùng tồn tại và đều đúng: Fast Track nhập theo năm ô (W1/W2 riêng), lớp Normal
 * chấm theo bốn môn (W là một). Tra cả hai bảng nhãn, không thì màn hình hiện ra mã thô.
 */
export function labelOf(s: { skill: string | null }): string {
  if (!s.skill) return 'Chưa rõ kỹ năng';
  return ENTRY_SKILL_LABEL[s.skill as EntrySkill]
    ?? REGULAR_SKILL_LABEL[s.skill as keyof typeof REGULAR_SKILL_LABEL]
    ?? s.skill;
}

// ---------------------------------------------------------------- đọc

export function signalsOfStudent(studentId: number, cycleId?: number | null): SignalRow[] {
  const conn = db();
  return cycleId
    ? (conn
        .prepare(`SELECT * FROM case_signals WHERE student_id = ? AND COALESCE(cycle_id, 0) = ? ORDER BY raised_on DESC, id DESC`)
        .all(studentId, cycleId) as SignalRow[])
    : (conn.prepare('SELECT * FROM case_signals WHERE student_id = ? ORDER BY raised_on DESC, id DESC')
        .all(studentId) as SignalRow[]);
}

export type SignalView = {
  id: number;
  studentId: number; studentName: string; studentCode: string;
  classId: number | null; classCode: string | null; branchId: number | null; branchName: string | null;
  attemptId: number | null; attemptNo: number | null; attemptKind: string | null;
  skill: string | null; label: string; category: string | null;
  band: number | null; expectation: number | null; sosLevel: number | null;
  detectedOn: string; raisedOn: string; verifyDue: string;
  ownerUserId: number | null; ownerName: string | null;
  status: SignalStatus; statusLabel: string;
  caseId: number | null;
  resolutionNote: string | null; withdrawnReason: string | null;
  /** Quá hạn xác minh: hết ngày hạn mới tính, giống mọi hạn khác trong hệ thống. */
  overdue: boolean;
  /** Người đang xem có phải người phải xác minh tín hiệu này không. */
  mine: boolean;
  canResolve: boolean;
  /** Lớp thường ('normal') giữ mô hình tín hiệu; Fast Track ('ft') tự tạo Case (Q-V3-1). */
  kind: 'normal' | 'ft';
  /** Lớp thường: số câu đúng / tổng số câu của ĐÚNG môn này — đọc thẳng từ ô điểm, sửa điểm thì số đổi theo. */
  score: number | null;
  total: number | null;
  /** Nút trên dòng việc (§3.10). Rỗng khi người xem không xử lý được hoặc tín hiệu không còn chờ. */
  actions: SignalAction[];
  /** Điền sẵn form "Tạo Case" đúng môn (§3.10). `null` khi tín hiệu không còn chờ. */
  caseDraft: { studentId: number; cycleId: number | null; topic: string | null; detectedAt: string; scoreText: string | null } | null;
};

/** Nút trên dòng việc tín hiệu (§3.10): "Tạo Case" · "Bỏ qua" (Bỏ qua chỉ lớp thường). */
export type SignalAction = 'create_case' | 'dismiss';

const SIGNAL_SELECT = `
  SELECT sg.*, s.full_name, s.student_code,
         c.code AS class_code, c.branch_id, b.name AS branch_name,
         a.attempt_no, a.kind AS attempt_kind,
         u.full_name AS owner_name,
         scr.raw_score AS score_value, scr.raw_total AS score_total,
         COALESCE(pg.scoring_mode, pgc.scoring_mode) AS scoring_mode
    FROM case_signals sg
    JOIN students s ON s.id = sg.student_id
    LEFT JOIN classes c ON c.id = sg.class_id
    LEFT JOIN branches b ON b.id = c.branch_id
    LEFT JOIN assessment_attempts a ON a.id = sg.attempt_id
    LEFT JOIN users u ON u.id = sg.owner_user_id
    LEFT JOIN assessment_scores scr ON scr.attempt_id = sg.attempt_id AND scr.skill = sg.skill
    LEFT JOIN programmes pg ON pg.code = c.programme_code
    LEFT JOIN learning_cycles cy ON cy.id = sg.cycle_id
    LEFT JOIN programmes pgc ON pgc.code = cy.programme_code`;

/**
 * AI XỬ LÝ ĐƯỢC MỘT TÍN HIỆU (Tạo Case · Bỏ qua).
 *
 * GV đúng môn hoặc Quản lý trong phạm vi (`SOS_EDIT` theo kỹ năng — C02). CỘNG người được giao tín hiệu: §3.10 nói không ai dạy
 * môn đó thì tín hiệu về GVCN — giao việc cho ai thì người đó phải làm được (quyết định Q1 của plan PR-S1). Chỉ mở cho tín hiệu,
 * KHÔNG mở cho Case: Case tạo ra vẫn theo C02.
 */
export function canResolveSignal(
  p: Principal, sg: { class_id: number | null; student_id: number; skill: string | null; owner_user_id: number | null },
): boolean {
  if (can(p, PERMISSIONS.SOS_EDIT, { classId: sg.class_id, studentId: sg.student_id, skill: sg.skill ?? undefined })) return true;
  return sg.owner_user_id === p.userId
    && can(p, PERMISSIONS.SOS_REPORT, { classId: sg.class_id, studentId: sg.student_id });
}

function viewOf(p: Principal, r: any, today: string): SignalView {
  const kind: 'normal' | 'ft' = r.scoring_mode === 'ratio' ? 'normal' : 'ft';
  const canResolve = canResolveSignal(p, r);
  const pending = r.status === 'pending';
  const score = r.score_value ?? null, total = r.score_total ?? null;
  return {
    id: r.id,
    studentId: r.student_id, studentName: r.full_name, studentCode: r.student_code,
    classId: r.class_id, classCode: r.class_code ?? null,
    branchId: r.branch_id ?? null, branchName: r.branch_name ?? null,
    attemptId: r.attempt_id, attemptNo: r.attempt_no ?? null, attemptKind: r.attempt_kind ?? null,
    skill: r.skill, label: labelOf(r), category: r.category,
    band: r.band, expectation: r.expectation, sosLevel: r.sos_level,
    detectedOn: r.detected_on, raisedOn: r.raised_on, verifyDue: r.verify_due,
    ownerUserId: r.owner_user_id, ownerName: r.owner_name ?? null,
    status: r.status, statusLabel: SIGNAL_STATUS_LABEL[r.status as SignalStatus] ?? r.status,
    caseId: r.case_id,
    resolutionNote: r.resolution_note, withdrawnReason: r.withdrawn_reason,
    overdue: r.status === 'pending' && r.verify_due < today,
    mine: r.owner_user_id === p.userId,
    /* AUTH-01 + C02: giáo viên đúng kỹ năng (hoặc Quản lý trong phạm vi) — cộng người được giao tín hiệu (Q1). */
    canResolve,
    kind, score, total,
    actions: canResolve && pending ? (kind === 'normal' ? ['create_case', 'dismiss'] : ['create_case']) : [],
    caseDraft: pending
      ? { studentId: r.student_id, cycleId: r.cycle_id ?? null, topic: r.skill ?? null, detectedAt: r.detected_on,
          scoreText: score !== null && total !== null ? `${score}/${total}` : null }
      : null,
  };
}

export type SignalFilters = {
  status?: SignalStatus | 'open';
  branchId?: number | null;
  classId?: number | null;
  studentId?: number | null;
  /** Chỉ tín hiệu người đang xem phải xác minh. */
  mine?: boolean;
  overdueOnly?: boolean;
  /** Ngày nghiệp vụ để tính quá hạn — mặc định hôm nay. */
  today?: string;
};

/**
 * HÀNG TÍN HIỆU CHỜ XÁC MINH — tổng hợp RIÊNG, không trộn vào danh sách case (mục 6.2).
 *
 * Đây là điều kiện để con số case còn nói đúng sự thật: một tín hiệu chưa ai xem không phải
 * một vấn đề đã được xác định, nên nó không được đếm chung.
 */
export function listSignals(p: Principal, f: SignalFilters = {}) {
  const scope = scopeFor(p, PERMISSIONS.ATTEMPT_VIEW);
  if (scope.none) return { rows: [], scopeEmpty: true, counts: { pending: 0, overdue: 0 } };
  const conn = db();
  const cs = classScopeSql(scope);
  const where: string[] = [cs.sql];
  const params: unknown[] = [...cs.params];

  if (f.status === 'open' || !f.status) where.push(`sg.status = 'pending'`);
  else { where.push('sg.status = ?'); params.push(f.status); }
  if (f.branchId) { where.push('c.branch_id = ?'); params.push(f.branchId); }
  if (f.classId) { where.push('sg.class_id = ?'); params.push(f.classId); }
  if (f.studentId) { where.push('sg.student_id = ?'); params.push(f.studentId); }
  if (f.mine) { where.push('sg.owner_user_id = ?'); params.push(p.userId); }

  const today = f.today ?? demoToday();
  let rows = (conn
    .prepare(`${SIGNAL_SELECT} WHERE ${where.join(' AND ')} ORDER BY sg.verify_due, sg.id`)
    .all(...params) as any[])
    .map((r) => viewOf(p, r, today));
  if (f.overdueOnly) rows = rows.filter((r) => r.overdue);

  return {
    rows,
    scopeEmpty: false,
    counts: {
      pending: rows.filter((r) => r.status === 'pending').length,
      overdue: rows.filter((r) => r.overdue).length,
    },
  };
}

/**
 * TẬP ID CỦA Ô "CHỜ XÁC MINH QUÁ HẠN" (đặc tả §3.2, §3.10): tín hiệu LỚP THƯỜNG còn chờ mà hạn 3 ngày (tính cả ngày đầu) đã qua.
 * Fast Track tự tạo Case nên không có tín hiệu chờ. Phạm vi và quyền đi qua `listSignals` — cùng hàm với danh sách tín hiệu.
 */
export function overdueNormalSignalIds(p: Principal, f: { branchId?: number | null; today?: string } = {}): number[] {
  return listSignals(p, { branchId: f.branchId ?? null, status: 'open', today: f.today }).rows
    .filter((s) => s.kind === 'normal' && s.overdue)
    .map((s) => s.id)
    .sort((a, b) => a - b);
}

export function signalDetail(p: Principal, id: number): SignalView {
  const r = db().prepare(`${SIGNAL_SELECT} WHERE sg.id = ?`).get(id) as any;
  if (!r) throw notFound('Không tìm thấy tín hiệu');
  require_(p, PERMISSIONS.ATTEMPT_VIEW, { classId: r.class_id, studentId: r.student_id },
    'Tín hiệu này nằm ngoài phạm vi bạn được xem.');
  return viewOf(p, r, demoToday());
}

// ---------------------------------------------------------------- xác minh

export function loadSignal(id: number): SignalRow {
  const r = db().prepare('SELECT * FROM case_signals WHERE id = ?').get(id) as SignalRow | undefined;
  if (!r) throw notFound('Không tìm thấy tín hiệu');
  return r;
}

/**
 * GẮN TÍN HIỆU VÀO MỘT CASE đã được người dùng xác định.
 *
 * Gọi từ chính đường tạo case, để không có một "case sinh từ tín hiệu" nào ra đời mà không
 * đi qua form của người dùng.
 */
export function linkSignalToCase(p: Principal, signalId: number, caseId: number, note?: string | null) {
  const sg = loadSignal(signalId);
  if (!canResolveSignal(p, sg)) {
    throw forbidden('Bạn chỉ xác minh được tín hiệu giao cho mình hoặc của môn mình dạy, trong phạm vi mình phụ trách.');
  }
  if (sg.status === 'withdrawn') throw badRequest('Tín hiệu này đã được thu hồi vì không còn căn cứ.');

  const conn = db();
  conn
    .prepare(
      `UPDATE case_signals SET status = 'linked', case_id = ?, resolved_by = ?, resolved_at = ?,
              resolution_note = ?, updated_at = ? WHERE id = ?`,
    )
    .run(caseId, p.userId, nowIso(), note ?? null, nowIso(), signalId);

  /*
   * DÒNG THỜI GIAN CỦA CASE BẮT ĐẦU TỪ CHÍNH BẰNG CHỨNG ĐÃ SINH RA NÓ.
   *
   * Case mở từ một tín hiệu thì mốc đầu tiên phải là kết quả đợt đó, kèm band và kỳ vọng.
   * Thiếu mốc này, mở case ra chỉ thấy lần trượt thứ hai và người đọc tưởng vấn đề mới có.
   * Khoá chống trùng theo (đợt, case) nên gắn lại nhiều lần cũng chỉ một mốc.
   */
  if (sg.attempt_id) {
    const attemptNo = (conn
      .prepare('SELECT attempt_no FROM assessment_attempts WHERE id = ?')
      .get(sg.attempt_id) as any)?.attempt_no ?? null;
    /* Lớp thường: mốc mở mang số câu đúng / tổng của đúng môn đó (§3.10 "điền sẵn điểm"). FT không có raw_total → không thêm. */
    const sc = sg.skill
      ? conn.prepare('SELECT raw_score, raw_total FROM assessment_scores WHERE attempt_id = ? AND skill = ?').get(sg.attempt_id, sg.skill) as any
      : null;
    const scoreText = sc?.raw_score != null && sc?.raw_total != null ? ` (${labelOf(sg)} ${sc.raw_score}/${sc.raw_total})` : '';
    conn
      .prepare(
        `INSERT OR IGNORE INTO case_milestones
           (case_id, kind, attempt_id, attempt_no, band, expectation, sos_level,
            occurred_on, note, created_by, created_at, dedup_key)
         VALUES (?, 'opened', ?,?,?,?,?,?,?,?,?,?)`,
      )
      .run(caseId, sg.attempt_id, attemptNo, sg.band, sg.expectation, sg.sos_level,
           sg.detected_on, `Tín hiệu từ kết quả đợt này${scoreText} đã được xác minh và mở thành case`,
           p.userId, nowIso(), `mt:${sg.attempt_id}:${caseId}:opened`);
  }

  /*
   * CASE CŨ ĐÃ ĐÓNG MÀ VẤN ĐỀ TÁI DIỄN → NỐI CASE MỚI VÀO CASE CŨ (mục 6.2).
   *
   * Không mở lại case cũ, vì kết luận đã chốt của nó là một quyết định có thật của một người
   * có thật, ở một thời điểm mà lúc đó nó đúng. Đè lên là làm hồ sơ nói dối. Thay vào đó
   * case mới trỏ về case cũ, và case cũ nhận một mốc "tái diễn" để đọc hồ sơ ra một mạch.
   *
   * Việc nối này chỉ xảy ra khi NGƯỜI đã quyết định mở case — máy không tự làm.
   */
  if (sg.category) {
    const previous = conn
      .prepare(
        `SELECT id FROM sos_cases
          WHERE student_id = ? AND COALESCE(cycle_id, 0) = ? AND category = ?
            AND status = 'done' AND id != ?
          ORDER BY id DESC LIMIT 1`,
      )
      .get(sg.student_id, sg.cycle_id ?? 0, sg.category, caseId) as any;
    if (previous) {
      conn.prepare('UPDATE sos_cases SET previous_case_id = ?, updated_at = ? WHERE id = ? AND previous_case_id IS NULL')
        .run(previous.id, nowIso(), caseId);
      conn
        .prepare(
          `INSERT OR IGNORE INTO case_milestones
             (case_id, kind, attempt_id, sos_level, occurred_on, note, created_by, created_at, dedup_key)
           VALUES (?, 'recurrence', ?,?,?,?,?,?,?)`,
        )
        .run(previous.id, sg.attempt_id, sg.sos_level, sg.detected_on,
             'Tái diễn sau khi case này đã đóng — đã mở case mới nối tiếp',
             p.userId, nowIso(), `recur-link:${previous.id}:${caseId}`);
    }
  }

  writeAudit({
    actorUserId: p.userId, action: 'signal.linked', entityType: 'case_signal', entityId: signalId,
    entityLabel: labelOf(sg), before: { status: sg.status }, after: { status: 'linked', caseId },
  });
  return { ok: true };
}

/** Quản lý giao tín hiệu cho người khác xác minh — khi chưa có ai được phân công đúng môn. */
export function assignSignal(p: Principal, signalId: number, userId: number | null) {
  const sg = loadSignal(signalId);
  require_(p, PERMISSIONS.SOS_EDIT, {
    classId: sg.class_id, studentId: sg.student_id,
    skill: sg.skill ?? undefined,
  }, 'Bạn không có quyền giao tín hiệu này cho người khác.');
  db().prepare('UPDATE case_signals SET owner_user_id = ?, updated_at = ? WHERE id = ?')
    .run(userId, nowIso(), signalId);
  writeAudit({
    actorUserId: p.userId, action: 'signal.assign', entityType: 'case_signal', entityId: signalId,
    before: { owner: sg.owner_user_id }, after: { owner: userId },
  });
  return { ok: true };
}

/** Tín hiệu này thuộc lớp thường không — theo lớp của tín hiệu, không có lớp thì theo khoá học. */
function isRatioSignal(signalId: number): boolean {
  const r = db()
    .prepare(
      `SELECT COALESCE(pg.scoring_mode, pgc.scoring_mode) AS m FROM case_signals sg
         LEFT JOIN classes c ON c.id = sg.class_id LEFT JOIN programmes pg ON pg.code = c.programme_code
         LEFT JOIN learning_cycles cy ON cy.id = sg.cycle_id LEFT JOIN programmes pgc ON pgc.code = cy.programme_code
        WHERE sg.id = ?`,
    )
    .get(signalId) as any;
  return r?.m === 'ratio';
}

/**
 * BỎ QUA MỘT TÍN HIỆU LỚP THƯỜNG — đóng mà không tạo Case (S1, đặc tả §3.10, quyết định 4.4 + "lý do không bắt buộc" 22/09/2026).
 *
 * Một bấm là xong; ô lý do nhỏ, không bắt buộc. Đã bỏ qua mà bấm lại thì không làm gì (không ghi audit thứ hai). Lưu lại điểm vẫn
 * trượt KHÔNG làm tín hiệu sống lại (`raiseSignal` chỉ mở lại tín hiệu `withdrawn`). Fast Track không đi đường này: FT đã tự tạo Case.
 */
export function dismissSignal(p: Principal, signalId: number, input: { reason?: string | null } = {}) {
  const sg = loadSignal(signalId);
  if (!canResolveSignal(p, sg)) {
    throw forbidden('Bạn chỉ bỏ qua được tín hiệu giao cho mình hoặc của môn mình dạy.');
  }
  if (sg.status === 'noted') return { ok: true as const, unchanged: true as const };
  if (sg.status === 'linked') throw badRequest('Tín hiệu này đã thành Case — không bỏ qua được nữa.');
  if (sg.status === 'withdrawn') throw badRequest('Tín hiệu này đã được thu hồi vì không còn căn cứ.');
  if (!isRatioSignal(signalId)) {
    throw badRequest('Tín hiệu Fast Track đã tự tạo Case — đóng bằng "Không cần theo dõi" ở Case đó.');
  }
  const reason = String(input.reason ?? '').trim().slice(0, 500);
  const note = reason ? `${SIGNAL_DISMISS_NOTE} — ${reason}` : SIGNAL_DISMISS_NOTE;
  db()
    .prepare(
      `UPDATE case_signals SET status = 'noted', resolved_by = ?, resolved_at = ?, resolution_note = ?, updated_at = ?
        WHERE id = ? AND status = 'pending'`,
    )
    .run(p.userId, nowIso(), note, nowIso(), signalId);
  writeAudit({
    actorUserId: p.userId, action: 'signal.dismissed', entityType: 'case_signal', entityId: signalId,
    entityLabel: labelOf(sg), before: { status: sg.status }, after: { status: 'noted', reason: reason || null },
  });
  return { ok: true as const };
}

// ---------------------------------------------------------------- thu hồi khi sửa điểm

/**
 * THU HỒI NHỮNG TÍN HIỆU KHÔNG CÒN CĂN CỨ SAU KHI ĐIỂM ĐƯỢC SỬA (mục 9.4).
 *
 * Bốn tình huống của mục 9.4 phân biệt nhau ở đúng một câu hỏi: **căn cứ của nó còn không?**
 *
 *   · Tín hiệu còn CHỜ XÁC MINH mà điểm đã sửa thành đạt → thu hồi. Chưa ai làm gì dựa trên
 *     nó, nên xoá nợ là đúng và không mất mát gì.
 *   · Tín hiệu ĐÃ thành case → KHÔNG tự đụng vào case. Case có thể đã có phương án thật, có
 *     người thật đã làm. Hàm chỉ đánh dấu tín hiệu mất căn cứ và trả tên case ra để nơi gọi
 *     báo cho người phụ trách xem lại. Xoá hộ là xoá mất việc đã diễn ra.
 *
 * Và tuyệt đối không ghi một mốc "đã tiến bộ": sửa một con số nhập sai KHÔNG phải một lần
 * thi thứ hai.
 */
export function withdrawSignalsNoLongerValid(input: {
  actorUserId: number | null;
  attemptId: number;
  /** Các ô nhập điểm nay đã ĐẠT kỳ vọng (hoặc không còn căn cứ trượt). */
  passingSkills: string[];
  reason?: string;
}): { withdrawn: SignalRow[]; casesToReview: { caseId: number; signalId: number; label: string }[] } {
  const conn = db();
  const withdrawn: SignalRow[] = [];
  const casesToReview: { caseId: number; signalId: number; label: string }[] = [];
  if (!input.passingSkills.length) return { withdrawn, casesToReview };

  const ph = input.passingSkills.map(() => '?').join(',');
  const rows = conn
    .prepare(`SELECT * FROM case_signals WHERE attempt_id = ? AND skill IN (${ph}) AND status != 'withdrawn'`)
    .all(input.attemptId, ...input.passingSkills) as SignalRow[];

  for (const sg of rows) {
    if (sg.status === 'pending') {
      conn
        .prepare(
          `UPDATE case_signals SET status = 'withdrawn', withdrawn_reason = ?, updated_at = ? WHERE id = ?`,
        )
        .run(input.reason ?? SIGNAL_WITHDRAW_SCORE_FIXED, nowIso(), sg.id);
      withdrawn.push(sg);
      writeAudit({
        actorUserId: input.actorUserId, action: 'signal.withdrawn', entityType: 'case_signal',
        entityId: sg.id, entityLabel: labelOf(sg),
        before: { status: sg.status }, after: { status: 'withdrawn', reason: input.reason ?? SIGNAL_WITHDRAW_SCORE_FIXED },
      });
    } else if (sg.status === 'linked' && sg.case_id) {
      casesToReview.push({ caseId: sg.case_id, signalId: sg.id, label: labelOf(sg) });
    }
  }
  return { withdrawn, casesToReview };
}

/**
 * CASE NÀY CÓ CÒN CĂN CỨ NÀO NGOÀI TÍN HIỆU ĐÃ MẤT KHÔNG (mục 9.4, tình huống 3 và 4).
 *
 * "Căn cứ độc lập" nghĩa là: một mốc từ đợt khác, một quan sát của giáo viên, một phương án
 * đã thực sự được làm, hoặc một lần cập nhật kết quả. Có bất kỳ thứ nào trong đó thì case
 * ĐƯỢC GIỮ và chỉ cần xem lại; không có gì cả thì nó chỉ sống nhờ con số vừa được sửa.
 */
export function caseHasIndependentBasis(caseId: number, excludeAttemptId: number | null): boolean {
  const conn = db();
  const otherMilestone = conn
    .prepare(
      `SELECT COUNT(*) n FROM case_milestones
        WHERE case_id = ? AND (attempt_id IS NULL OR attempt_id != ?)`,
    )
    .get(caseId, excludeAttemptId ?? -1) as any;
  if (otherMilestone.n > 0) return true;

  const work = conn
    .prepare(
      `SELECT COUNT(*) n FROM case_interventions
        WHERE case_id = ? AND status IN ('started', 'completed')`,
    )
    .get(caseId) as any;
  if (work.n > 0) return true;

  /*
   * PHƯƠNG ÁN ĐIỀN SẴN ĐÃ ĐƯỢC XÁC NHẬN là quyết định của một người, dù nó còn ở trạng thái "đã lên kế hoạch" (rulebook v3, S08). Chưa xác nhận
   * thì nó chỉ là gợi ý của máy — không phải căn cứ.
   */
  const confirmed = conn
    .prepare(
      `SELECT COUNT(*) n FROM case_interventions
        WHERE case_id = ? AND preset = 1 AND confirmed_at IS NOT NULL AND status != 'cancelled'`,
    )
    .get(caseId) as any;
  if (confirmed.n > 0) return true;

  const observed = conn
    .prepare('SELECT COUNT(*) n FROM case_followups WHERE case_id = ?')
    .get(caseId) as any;
  if (observed.n > 0) return true;

  const sources = conn
    .prepare('SELECT COUNT(*) n FROM case_sources WHERE case_id = ?')
    .get(caseId) as any;
  return sources.n > 0;
}

/**
 * ĐÁNH DẤU MỘT CASE MẤT CĂN CỨ VÌ ĐIỂM ĐƯỢC SỬA (mục 9.4, tình huống 3).
 *
 * "Rút khỏi danh sách đang xử lý" — không xoá. Case chuyển sang đã đóng với lý do ghi rõ,
 * mọi lịch sử giữ nguyên, và các phương án CHƯA ĐƯỢC LÀM bị huỷ với đúng lý do đó. Phương
 * án đã bắt đầu hoặc đã xong thì KHÔNG đụng: việc đã diễn ra thì đã diễn ra.
 *
 * Phương án bị huỷ ở đây không được tính là thành công hay thất bại — nó không có kết quả,
 * vì nó chưa từng chạy.
 */
export function retireCaseForCorrectedScore(p: Principal, caseId: number, label: string) {
  const conn = db();
  const c = conn.prepare('SELECT * FROM sos_cases WHERE id = ?').get(caseId) as any;
  if (!c || c.status === 'done') return { ok: false };

  return tx(() => {
    /*
     * CHỈ HUỶ PHƯƠNG ÁN CÒN Ở TRẠNG THÁI "ĐÃ LÊN KẾ HOẠCH" — tức chưa ai bắt tay vào.
     * `closed_reason = 'score_fixed'` để báo cáo hiệu quả biết mà KHÔNG đếm nó vào mẫu số:
     * một phương án chưa từng chạy thì không thành công cũng không thất bại.
     */
    const cancelled = conn
      .prepare(
        `UPDATE case_interventions
            SET status = 'cancelled', closed_reason = 'score_fixed', updated_at = ?
          WHERE case_id = ? AND status = 'planned' AND NOT (preset = 1 AND confirmed_at IS NOT NULL)`,
      )
      .run(nowIso(), caseId).changes;

    conn
      .prepare(
        `UPDATE sos_cases SET status = 'done', closed_at = ?, closed_by = ?,
                outcome_note = ?, dedup_key = NULL, updated_at = ? WHERE id = ?`,
      )
      .run(demoToday(), p.userId,
           `${SIGNAL_WITHDRAW_SCORE_FIXED} — điểm ${label} đã được sửa lại thành đạt kỳ vọng.`,
           nowIso(), caseId);
    conn
      .prepare(
        `INSERT INTO sos_case_history (case_id, field, old_value, new_value, actor_user_id, created_at)
         VALUES (?, 'status', ?, 'done', ?, ?)`,
      )
      .run(caseId, c.status, p.userId, nowIso());
    writeAudit({
      actorUserId: p.userId, action: 'case.retired_score_fixed', entityType: 'sos_case',
      entityId: caseId, entityLabel: label,
      before: { status: c.status }, after: { status: 'done', reason: SIGNAL_WITHDRAW_SCORE_FIXED, cancelledPlans: cancelled },
    });
    return { ok: true, cancelledPlans: cancelled };
  });
}
