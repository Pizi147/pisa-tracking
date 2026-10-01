import { db, tx } from '../db.ts';
import {
  SIGNAL_WITHDRAW_SCORE_FIXED, ngay, signalVerifyDue, tenMon,
  type CaseCategory, type SignalStatus,
} from '../../../shared/domain/index.ts';
import { demoToday } from '../demoConfig.ts';
import { nowIso } from '../util.ts';
import { type Principal } from '../permissions.ts';
import { notify, writeAudit } from '../platform/audit.ts';
import { suggestCaseOwner } from './owner.ts';
import { PA_QUY_CHE_CHUA_GHI } from './sosState.ts';

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
 * sẵn PA theo quy chế chạy ngay (PR-N1 S4-1) — xem `cases/sos.ts` (`raiseSignalsForResult`) và `cases/sosAuto.ts`. Tín hiệu ở đó nối NGAY vào case (`linked`,
 * hạn 3 ngày giữ nguyên) và là dây nối để thu hồi khi sửa điểm. PR-LT2a (N4) cũng bỏ mô hình mô tả dưới đây cho lớp thường: Giữa khoá tự tạo Case + PA Bổ trợ,
 * tín hiệu chỉ còn là dây nối (`silent`) — không còn hàng chờ "Xác minh", không "Tạo Case / Bỏ qua".
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
   * lúc đó chẳng còn gì để "xác minh", và người phụ trách nhận một thông báo riêng nói đúng việc (case mới, chờ xác định nguyên nhân).
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
      title: `Case chờ xác nhận nguyên nhân · ${labelOf(row)} · ${st?.full_name ?? ''}`,
      body: `Hạn ${ngay(row.verify_due, demoToday())}. Từ điểm vừa nhập, chưa thành Case.`,
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
export function labelOf(s: { skill: string | null; programme_code?: string | null }): string {
  if (!s.skill) return 'Chưa rõ kỹ năng';
  return tenMon(s.programme_code ?? null, s.skill);   // MH2: FOU W → Grammar + Vocabulary (có mã chương trình khi đọc qua SIGNAL_SELECT)
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
      /* PR-SOS: mốc Xác nhận Case / thẻ Không cần theo dõi không phải căn cứ (như nguyên nhân chọn tay trước đây). */
      `SELECT COUNT(*) n FROM case_milestones
        WHERE case_id = ? AND (attempt_id IS NULL OR attempt_id != ?)
          AND kind NOT IN ('xac_nhan_case', 'xin_khong_theo_doi', 'ql_duyet_khong_theo_doi', 'ql_tu_choi_khong_theo_doi')`,
    )
    .get(caseId, excludeAttemptId ?? -1) as any;
  if (otherMilestone.n > 0) return true;

  const work = conn
    .prepare(
      `SELECT COUNT(*) n FROM case_interventions
        WHERE case_id = ? AND status IN ('started', 'completed') AND NOT ${PA_QUY_CHE_CHUA_GHI('case_interventions')}`,
    )
    .get(caseId) as any;
  if (work.n > 0) return true;

  /*
   * PHƯƠNG ÁN ĐIỀN SẴN ĐÃ ĐƯỢC NGƯỜI XÁC NHẬN là quyết định của một người, dù nó còn ở trạng thái "đã lên kế hoạch" (rulebook v3, S08). PA theo
   * quy chế do MÁY gán (`confirmed_by IS NULL`, PR-N1 Q23) mà chưa có kết quả tuần thì không phải căn cứ — câu `work` ở trên đã loại nó.
   */
  const confirmed = conn
    .prepare(
      `SELECT COUNT(*) n FROM case_interventions
        WHERE case_id = ? AND preset = 1 AND confirmed_at IS NOT NULL AND confirmed_by IS NOT NULL AND status != 'cancelled'`,
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
export function retireCaseForCorrectedScore(p: Principal, caseId: number, label: string, passText = 'đạt kỳ vọng', huy = false) {
  const conn = db();
  const c = conn.prepare('SELECT * FROM sos_cases WHERE id = ?').get(caseId) as any;
  if (!c || c.status === 'done') return { ok: false };

  return tx(() => {
    /*
     * CHỈ HUỶ PHƯƠNG ÁN CÒN Ở TRẠNG THÁI "ĐÃ LÊN KẾ HOẠCH" — tức chưa ai bắt tay vào — và PA THEO QUY CHẾ MÁY GÁN chưa có kết quả tuần
     * (PR-N1 Q23: chạy từ lúc tạo nhưng chưa ghi gì thì cũng chưa có việc thật).
     * `closed_reason = 'score_fixed'` để báo cáo hiệu quả biết mà KHÔNG đếm nó vào mẫu số:
     * một phương án chưa từng chạy thì không thành công cũng không thất bại.
     */
    const cancelled = conn
      .prepare(
        `UPDATE case_interventions
            SET status = 'cancelled', closed_reason = 'score_fixed', updated_at = ?
          WHERE case_id = ? AND ((status = 'planned' AND NOT (preset = 1 AND confirmed_by IS NOT NULL))
                                 OR ${PA_QUY_CHE_CHUA_GHI('case_interventions')})`,
      )
      .run(nowIso(), caseId).changes;

    conn
      .prepare(
        `UPDATE sos_cases SET status = 'done', closed_at = ?, closed_by = ?,
                outcome_note = ?, dedup_key = NULL, updated_at = ? WHERE id = ?`,
      )
      .run(demoToday(), p.userId,
           `${SIGNAL_WITHDRAW_SCORE_FIXED} — ${huy ? `điểm ${label} đã bị huỷ` : `điểm ${label} đã được sửa lại thành ${passText}`}.`,
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

/**
 * ĐỐI SOÁT NGƯỢC SAU KHI SỬA ĐIỂM (mục 9.4, RB-8) — MỘT hàm cho cả Fast Track và lớp thường.
 *
 * Những ô vừa được sửa thành ĐẠT: tín hiệu còn chờ bị thu hồi; Case chỉ sống nhờ con số vừa sửa thì rút khỏi danh sách đang xử lý
 * (giữ lịch sử, huỷ phương án chưa ai làm); Case còn căn cứ độc lập thì GIỮ và nhắc người phụ trách. Không ghi mốc "đã tiến bộ":
 * sửa một con số nhập sai không phải một lần thi thứ hai. `passText`: "đạt kỳ vọng" (FT) · "đạt" (lớp thường).
 */
export function reconcileCorrectedSignals(p: Principal, input: { attemptId: number; passingSkills: string[]; passText: string; clearedSkills?: string[] }) {
  gomTinHieu(p, input.attemptId, input.passingSkills, input.passText, false);
  /* PR-S3F #1: ô có tín hiệu mà nay TRỐNG (Huỷ điểm / Thi lại) — cùng luật, lý do "điểm đã huỷ". Thi lại trượt sau đó mở lại tín hiệu → Case mới. */
  gomTinHieu(p, input.attemptId, input.clearedSkills ?? [], 'điểm đã huỷ', true);
}

function gomTinHieu(p: Principal, attemptId: number, skills: string[], passText: string, huy: boolean) {
  const conn = db();
  if (!skills.length) return;
  const { withdrawn, casesToReview } = withdrawSignalsNoLongerValid({
    actorUserId: p.userId, attemptId, passingSkills: skills,
  });
  for (const item of casesToReview) {
    if (caseHasIndependentBasis(item.caseId, attemptId)) {
      /* Giữ case, chỉ nhắc xem lại — người phụ trách quyết định có theo tiếp hay không. */
      const c = conn.prepare('SELECT owner_user_id, student_id, status FROM sos_cases WHERE id = ?').get(item.caseId) as any;
      /* Case đã ĐÓNG (không cần theo dõi / chốt kết quả) thì không còn gì để "xem lại" — không nhắc. */
      if (c?.owner_user_id && c.status !== 'done') {
        const st = conn.prepare('SELECT full_name FROM students WHERE id = ?').get(c.student_id) as any;
        notify({
          userId: c.owner_user_id, kind: 'sos',
          title: `Xem lại Case ${item.label} · ${st?.full_name ?? ''}`,
          body: `${huy ? 'Điểm nguồn đã bị huỷ' : `Điểm nguồn đã được sửa thành ${passText}`}. Case vẫn còn căn cứ khác; xem có cần theo tiếp không.`,
          entityType: 'sos_case', entityId: item.caseId,
          dedupKey: `case_review:${item.caseId}:${attemptId}`,
        });
      }
    } else {
      retireCaseForCorrectedScore(p, item.caseId, item.label, passText, huy);
      conn.prepare(`UPDATE case_signals SET status = 'withdrawn', withdrawn_reason = ?, updated_at = ? WHERE id = ?`)
        .run(SIGNAL_WITHDRAW_SCORE_FIXED, nowIso(), item.signalId);
    }
  }
  if (withdrawn.length) {
    writeAudit({
      actorUserId: p.userId, action: 'signal.withdrawn_batch', entityType: 'assessment_attempt',
      entityId: attemptId, entityLabel: `${withdrawn.length} Case chờ xác nhận nguyên nhân`,
      after: { reason: SIGNAL_WITHDRAW_SCORE_FIXED, skills: withdrawn.map((w) => w.skill) },
    });
  }
}
