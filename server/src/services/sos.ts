import { db, tx } from '../db.ts';
import {
  CONTACT_KINDS, ENTRY_SKILL_LABEL, INTERVENTION_KIND_LABEL, PERMISSIONS, SOS_LABEL,
  autoSupportKind, type EntrySkill, type SosLevel,
} from '../../../shared/domain.ts';
import { demoToday } from '../demoConfig.ts';
import { addDays, badRequest, isIsoDate, notFound, nowIso } from '../util.ts';
import { require_, type Principal } from '../permissions.ts';
import { addJourney, notify, writeAudit } from './audit.ts';
import { failingEntrySkills, type AttemptResult, type EntryBands } from './scoring.ts';
import { mondayOf } from './week.ts';

/**
 * Hành động phối hợp theo Lần MT × mức SOS, lấy nguyên từ 'Quy trinh SOS' của trung tâm.
 *
 * Đây là CHECKLIST cần phối hợp, không phải thứ hệ thống tự làm: SOS không tự cấp buổi học,
 * không tự lùi lịch thi, không tự đóng case và không tự xác nhận Head.
 */
export type SosStep = {
  key: 'talk_student' | 'talk_parent' | 'academic' | 'ops' | 'meeting';
  label: string;
  detail: string;
  required: boolean;
};

export function stepsFor(attemptNo: number, level: SosLevel): SosStep[] {
  if (level === 0) return [];
  const steps: SosStep[] = [];

  // Ai trao đổi với học sinh: SOS 2 từ MT2 trở đi là GVBM, còn lại GVCN + GVBM.
  const byGvbmOnly = level === 2 && attemptNo >= 2;
  steps.push({
    key: 'talk_student', label: 'Trao đổi với học sinh',
    detail: byGvbmOnly ? 'GVBM trao đổi ngắn với HS' : 'GVCN + GVBM trao đổi ngắn với HS',
    required: true,
  });

  // Bảng DOCX bỏ sót bước này ở MT2 SOS3, nhưng sheet 'Quy trinh SOS' đang vận hành thì có.
  steps.push({
    key: 'talk_parent', label: 'Trao đổi với phụ huynh',
    detail: 'CS trao đổi ngắn với PH (thực hiện ngoài hệ thống, ghi lại người và ngày)',
    required: true,
  });

  let academic: string;
  if (attemptNo === 1) academic = level === 3 ? 'Học tutor cho đến lần mock 2' : 'Xếp tự học trong 1 tháng tiếp theo';
  else if (attemptNo === 2)
    academic = level === 3
      ? 'Học tutor cho đến lần mock 3 (ưu tiên) HOẶC đề xuất lùi lịch thi kèm phương án — chọn một'
      : 'Xếp tự học trong 1 tháng tiếp theo';
  else if (attemptNo === 5) academic = 'Bổ sung hành động chuyên môn (nguồn chưa quy định hình thức/thời lượng)';
  else academic = level === 3 ? 'Học tutor cho đến lúc thi (ưu tiên lịch này)' : 'Học tutor cho đến lúc thi';
  steps.push({ key: 'academic', label: 'Hỗ trợ học thuật', detail: academic, required: true });

  if (attemptNo >= 3 && level >= 2) {
    steps.push({
      key: 'ops', label: 'Chính sách vận hành',
      detail: 'P. Vận hành đưa chính sách hỗ trợ (buổi bổ trợ với tutor / GV fulltime) — quyết định theo từng case',
      required: false,
    });
  }

  let meeting: string | null = null;
  if (attemptNo === 1 && level === 3) meeting = 'GVCN meeting HS';
  else if (attemptNo >= 2 && level === 3) meeting = 'CX / GĐCN meeting HS';
  else if (attemptNo >= 2 && level === 2) meeting = 'GVCN meeting HS';
  if (meeting) {
    steps.push({ key: 'meeting', label: 'Meeting bổ sung', detail: `${meeting}: động viên, tìm hiểu nguyên nhân`, required: true });
  }
  return steps;
}

/*
 * NĂM CỘT HỖ TRỢ CŨ (trao đổi HS / trao đổi PH / hỗ trợ học thuật / chính sách / meeting)
 * KHÔNG CÒN ĐƯỜNG GHI NÀO.
 *
 * Chúng chỉ còn tồn tại trong bảng để dữ liệu cũ của trung tâm không mất, và bước nâng cấp
 * đọc chúng một lần để dựng lại thành các bản ghi tác động. Mọi việc đã làm từ nay ghi qua
 * `cases.recordIntervention` — có người thực hiện, ngày thật, trạng thái và lần xem lại,
 * là những thứ năm cột kia không tả được.
 */

/**
 * MỞ / CẬP NHẬT VẤN ĐỀ TỪ KẾT QUẢ MỘT LƯỢT ĐÁNH GIÁ.
 *
 * Từ 10/09/2026 một lượt sinh ra NHIỀU vấn đề — mỗi kỹ năng dưới kỳ vọng một cái. Lý do:
 * một kỹ năng có nhiều vấn đề khác nhau theo thời gian, và phương án chữa Listening thì
 * không chữa được Reading. Gộp cả lượt vào một bản ghi thì không biết việc nào chữa gì.
 *
 * Kèm theo, mỗi lượt có SOS sinh đúng MỘT bộ hai việc trao đổi (không phải mỗi kỹ năng một
 * bộ — trao đổi là với em và với phụ huynh, không phải với từng kỹ năng).
 *
 * Kết luận sinh NGAY trên phần điểm đang có, không chờ đủ mọi kỹ năng: chờ đủ nghĩa là một
 * giáo viên nhập muộn thì việc hỗ trợ học viên dừng theo. Kỹ năng nhập sau mà trượt thì mở
 * thêm vấn đề của chính kỹ năng đó, không mở lại cái đã có.
 */
export function upsertCaseForResult(p: Principal, attempt: any, result: AttemptResult) {
  if (result.sosLevel === null) return null;
  const conn = db();
  const rows = conn
    .prepare('SELECT skill, band FROM assessment_scores WHERE attempt_id = ?')
    .all(attempt.id) as any[];
  const entry: EntryBands = {};
  for (const r of rows) entry[r.skill as EntrySkill] = r.band;
  const failing = failingEntrySkills(result.expectation, entry, result.skipped);

  const detectedAt = (attempt.lrw_scheduled_at ?? '').slice(0, 10) || demoToday();
  const open = conn
    .prepare(`SELECT * FROM sos_cases WHERE attempt_id = ? ORDER BY id`)
    .all(attempt.id) as any[];

  /*
   * Điểm sửa lên thành đạt: KHÔNG xoá vấn đề, chỉ hạ mức và để người có thẩm quyền đóng.
   * Xoá đi là mất luôn những việc đã làm cho em vì vấn đề đó.
   */
  for (const c of open) {
    if (c.topic && !failing.includes(c.topic)) {
      if (c.sos_level !== 0) {
        conn.prepare('UPDATE sos_cases SET sos_level = 0, updated_at = ? WHERE id = ?').run(nowIso(), c.id);
        recordChange(c.id, 'sos_level', String(c.sos_level), '0', p.userId);
      }
    } else if (c.sos_level !== result.sosLevel) {
      conn.prepare('UPDATE sos_cases SET sos_level = ?, updated_at = ? WHERE id = ?')
        .run(result.sosLevel, nowIso(), c.id);
      recordChange(c.id, 'sos_level', String(c.sos_level), String(result.sosLevel), p.userId);
    }
  }
  if (result.sosLevel === 0 || !failing.length) return open[0] ?? null;

  const made: any[] = [];
  for (const skill of failing) {
    if (open.some((c) => c.topic === skill)) continue;
    /*
     * NGÀY PHÁT HIỆN là ngày làm bài, không phải ngày nhập điểm: nhập bù một tuần sau thì
     * vấn đề vẫn đã tồn tại từ hôm làm bài.
     */
    const info = conn
      .prepare(
        `INSERT INTO sos_cases (attempt_id, student_id, cycle_id, track, topic, origin_kind,
                                detected_at, sos_level, status, created_at)
         VALUES (?,?,?, 'academic', ?, 'mock', ?,?, 'open', ?)`,
      )
      .run(attempt.id, attempt.student_id, attempt.cycle_id, skill, detectedAt, result.sosLevel, nowIso());
    const id = Number(info.lastInsertRowid);
    made.push(conn.prepare('SELECT * FROM sos_cases WHERE id = ?').get(id));
    autoSupportPlan(id, attempt, result.sosLevel, skill);
  }

  if (made.length) {
    addJourney({
      studentId: attempt.student_id, cycleId: attempt.cycle_id,
      eventType: 'mock_result', eventDate: demoToday(),
      title: `MT${attempt.attempt_no}: ${SOS_LABEL[result.sosLevel]}`,
      detail: [
        result.overall !== null ? `Overall ${result.overall}` : null,
        `kỳ vọng ${result.expectation ?? '—'}`,
        failing.map((s) => ENTRY_SKILL_LABEL[s]).join(', '),
        // Kết luận tạm thời phải nói rõ ngay trong hành trình, không để đọc lại tưởng đã chốt.
        result.provisional ? `mới có ${result.scoredRequired}/${result.required.length} kỹ năng` : null,
      ].filter(Boolean).join(' · '),
      refTable: 'assessment_attempts', refId: attempt.id, createdBy: p.userId,
      // Lưu lại nhiều lần vẫn chỉ MỘT sự kiện dù sinh ra nhiều vấn đề.
      dedupKey: `mock_result:${attempt.id}`,
    });
    notifyTeachers(attempt, result.sosLevel);
    writeAudit({ actorUserId: p.userId, action: 'sos.open', entityType: 'sos_case',
      entityId: made[0].id, entityLabel: `MT${attempt.attempt_no} SOS ${result.sosLevel}`,
      after: { level: result.sosLevel, skills: failing } });
  }

  ensureSosContacts(attempt, result.sosLevel);
  return made[0] ?? open[0] ?? null;
}

/**
 * HAI VIỆC TRAO ĐỔI BẮT BUỘC — một bộ cho mỗi LƯỢT, không phải mỗi kỹ năng.
 *
 * Hạn: hết CHỦ NHẬT của tuần kế tiếp tuần làm bài (owner chốt 10/09/2026, không co giãn).
 * Owner đã được báo trước hệ quả: nếu giáo viên chấm đúng hạn thứ Tư thì GVCN chỉ còn bốn
 * ngày, và chấm muộn thì việc sinh ra đã quá hạn — owner chấp nhận đánh đổi đó để quy tắc
 * dễ giải thích.
 *
 * Chỉ số câu `auto = 1` cùng chỉ mục duy nhất bảo đảm chấm lại hay sửa điểm không nhân đôi.
 */
export function ensureSosContacts(attempt: any, level: number) {
  if (!level || !attempt.student_id) return;
  const conn = db();
  const taken = (attempt.lrw_scheduled_at ?? '').slice(0, 10) || demoToday();
  const due = addDays(mondayOf(taken), 13);   // Chủ nhật của tuần kế tiếp
  for (const kind of CONTACT_KINDS) {
    conn
      .prepare(
        `INSERT INTO student_contacts (student_id, cycle_id, attempt_id, kind, due_date, auto, created_at)
         VALUES (?,?,?,?,?, 1, ?)
         ON CONFLICT(attempt_id, kind) WHERE auto = 1 DO NOTHING`,
      )
      .run(attempt.student_id, attempt.cycle_id, attempt.id, kind, due, nowIso());
  }
}

/**
 * PHƯƠNG ÁN TỰ SINH THEO QUY ĐỊNH CŨ — xếp tự học, hoặc tutor từ SOS 3 và từ MT3 trở đi.
 *
 * Sinh ở trạng thái ĐÃ LÊN KẾ HOẠCH, KHÔNG có người thực hiện và KHÔNG gửi duyệt. Máy không
 * đặt tutor thay người: nó chỉ nói "theo quy định em này phải có cái này", còn ai làm và có
 * đúng là cái đó không thì GVCN xác nhận hoặc đổi. Để máy tự gửi duyệt thì Quản lý mở lên
 * thấy một hàng đề xuất không ai nghĩ ra.
 */
function autoSupportPlan(caseId: number, attempt: any, level: number, skill: string) {
  const kind = autoSupportKind(level, attempt.attempt_no);
  db()
    .prepare(
      `INSERT INTO case_interventions (case_id, kind, description, status, created_at)
       VALUES (?,?,?, 'planned', ?)`,
    )
    .run(caseId, kind,
         `${INTERVENTION_KIND_LABEL[kind]} cho ${ENTRY_SKILL_LABEL[skill as EntrySkill] ?? skill}`
         + ` — theo quy định khi ${SOS_LABEL[level as SosLevel]}`,
         nowIso());
}

function recordChange(caseId: number, field: string, oldValue: string | null, newValue: string | null, actor: number | null) {
  db()
    .prepare(
      `INSERT INTO sos_case_history (case_id, field, old_value, new_value, actor_user_id, created_at)
       VALUES (?,?,?,?,?,?)`,
    )
    .run(caseId, field, oldValue, newValue, actor, nowIso());
}

/** Thông báo trong ứng dụng cho GVCN + GVBM của lớp. Không gửi email/Zalo ở bản demo. */
function notifyTeachers(attempt: any, level: SosLevel) {
  if (!attempt.class_id) return;
  const teachers = db()
    .prepare(`SELECT DISTINCT user_id FROM teacher_assignments WHERE class_id = ? AND status = 'active'`)
    .all(attempt.class_id) as any[];
  const student = db().prepare('SELECT full_name, student_code FROM students WHERE id = ?').get(attempt.student_id) as any;
  for (const t of teachers) {
    notify({
      userId: t.user_id, kind: 'sos', title: `${SOS_LABEL[level]} — ${student.full_name}`,
      body: `MT${attempt.attempt_no} · ${student.student_code}`,
      entityType: 'assessment_attempt', entityId: attempt.id, dedupKey: `sos:${attempt.id}:${level}`,
    });
  }
}


/*
 * "Head xác nhận" ĐÃ BỎ khỏi luồng xử lý case.
 *
 * Đối chiếu code cũ: `confirmCase` chỉ ghi tên và ngày; nó không khoá điểm, không là điều
 * kiện để đổi trạng thái case, không mở khoá bước nào và không gắn với một trách nhiệm
 * riêng nào. Tức là một bước duyệt không bảo vệ điều gì. Case kết thúc dựa trên chính
 * TRẠNG THÁI XỬ LÝ (chưa xử lý / đang xử lý / đã xử lý), không cần thêm một người bấm nút.
 *
 * Dữ liệu xác nhận cũ (`head_confirmed_by/at` và các dòng lịch sử) được GIỮ NGUYÊN để tra
 * lại, chỉ không còn thao tác tạo mới.
 */
