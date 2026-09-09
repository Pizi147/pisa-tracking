import { db, tx } from '../db.ts';
import { PERMISSIONS, SOS_LABEL, type SosLevel } from '../../../shared/domain.ts';
import { demoToday } from '../demoConfig.ts';
import { badRequest, isIsoDate, notFound, nowIso } from '../util.ts';
import { require_, type Principal } from '../permissions.ts';
import { addJourney, notify, writeAudit } from './audit.ts';
import type { AttemptResult } from './scoring.ts';

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

export function upsertCaseForResult(p: Principal, attempt: any, result: AttemptResult) {
  /*
   * Mở/cập nhật case NGAY khi đã kết luận được trên phần điểm đang có — không chờ đủ mọi
   * kỹ năng. Chờ đủ nghĩa là một giáo viên nhập muộn thì việc hỗ trợ học viên dừng theo.
   *
   * Mức SOS có thể tăng khi các kỹ năng còn lại vào; case giữ nguyên và ghi lịch sử đổi mức,
   * không mở case thứ hai.
   */
  if (result.sosLevel === null) return null;
  const conn = db();
  const existing = conn.prepare('SELECT * FROM sos_cases WHERE attempt_id = ?').get(attempt.id) as any;

  if (result.sosLevel === 0) {
    if (existing) {
      conn.prepare('UPDATE sos_cases SET sos_level = 0, updated_at = ? WHERE id = ?').run(nowIso(), existing.id);
      recordChange(existing.id, 'sos_level', String(existing.sos_level), '0', p.userId);
    }
    return existing ?? null;
  }

  if (!existing) {
    const info = conn
      .prepare(
        /*
         * GHI THẲNG học viên và lộ trình, không chỉ dựa vào bài đánh giá.
         *
         * Case do giáo viên báo không có bài nào, nên hai cột này là đường duy nhất chung
         * cho cả hai nguồn. Bỏ trống ở đây thì hồ sơ học viên — vốn tra theo `student_id` —
         * sẽ không thấy chính những vấn đề vừa sinh ra từ điểm của em đó.
         *
         * NGÀY PHÁT HIỆN là ngày làm bài, không phải ngày nhập điểm: nhập bù một tuần sau
         * thì vấn đề vẫn đã tồn tại từ hôm làm bài.
         */
        `INSERT INTO sos_cases (attempt_id, student_id, cycle_id, origin_kind, detected_at,
                                sos_level, status, created_at)
         VALUES (?,?,?, 'mock', ?,?, 'open', ?)`,
      )
      .run(attempt.id, attempt.student_id, attempt.cycle_id,
           (attempt.lrw_scheduled_at ?? '').slice(0, 10) || demoToday(),
           result.sosLevel, nowIso());
    const id = Number(info.lastInsertRowid);
    addJourney({
      studentId: attempt.student_id, cycleId: attempt.cycle_id,
      eventType: 'mock_result', eventDate: demoToday(),
      title: `MT${attempt.attempt_no}: ${SOS_LABEL[result.sosLevel]}`,
      detail: [
        result.overall !== null ? `Overall ${result.overall}` : null,
        `kỳ vọng ${result.expectation ?? '—'}`,
        // Kết luận tạm thời phải nói rõ ngay trong hành trình, không để đọc lại tưởng đã chốt.
        result.provisional ? `mới có ${result.scoredRequired}/${result.required.length} kỹ năng` : null,
        result.scopeNote,
      ].filter(Boolean).join(' · '),
      refTable: 'assessment_attempts', refId: attempt.id, createdBy: p.userId,
      // Lưu lại nhiều lần vẫn chỉ MỘT sự kiện: mỗi bài chỉ mở case một lần.
      dedupKey: `mock_result:${attempt.id}`,
    });
    notifyTeachers(attempt, result.sosLevel);
    writeAudit({ actorUserId: p.userId, action: 'sos.open', entityType: 'sos_case', entityId: id,
      entityLabel: `MT${attempt.attempt_no} SOS ${result.sosLevel}`, after: { level: result.sosLevel } });
    return conn.prepare('SELECT * FROM sos_cases WHERE id = ?').get(id);
  }

  if (existing.sos_level !== result.sosLevel) {
    conn.prepare('UPDATE sos_cases SET sos_level = ?, updated_at = ? WHERE id = ?')
      .run(result.sosLevel, nowIso(), existing.id);
    recordChange(existing.id, 'sos_level', String(existing.sos_level), String(result.sosLevel), p.userId);
  }
  return conn.prepare('SELECT * FROM sos_cases WHERE id = ?').get(existing.id);
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
