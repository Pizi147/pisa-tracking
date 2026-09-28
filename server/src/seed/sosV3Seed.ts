import { loadPrincipal, type Principal } from '../permissions.ts';
import { addDays } from '../util.ts';
import { ensurePeriod, mondayOf } from '../platform/week.ts';
import { LISTENING_BY_RAW, READING_BY_RAW } from '../fasttrack/scoring.ts';
import { commitIntake } from '../classes/intake.ts';
import { createAttempt, saveScore } from '../fasttrack/attempts.ts';
import { setIssues } from '../cases/cases.ts';
import { dismissSosCase } from '../cases/sosAuto.ts';
import { confirmCoordination } from '../yThuc/phoiHop.ts';
import type { BuildCtx } from './build.ts';
import { DEMO_DATE } from './journeys.ts';

/**
 * BỘ DEMO RULEBOOK v3 — SOS TỰ TẠO CASE · PHỐI HỢP SOS (PR-T T8, thiet-ke/SOS_VA_PHOI_HOP_V3.md §9). Chỉ cho máy dev: bản chính dùng dữ liệu rỗng.
 *
 * KHÁC các bộ dựng khác (`build.ts`, `yThucSeed.ts` ghi thẳng xuống bảng): bộ này đi qua CHÍNH các hàm nghiệp vụ — nhập điểm Mock Test rồi để
 * engine tự tạo case, PA theo quy chế (chạy ngay — PR-N1 S4-1) và việc phối hợp; sau đó GVBM/GVCN thao tác bằng đúng hàm của họ. Nhờ vậy demo không thể lệch luật: nó
 * là kết quả của luật, không phải bản sao viết tay của luật.
 *
 * Ba học viên MỚI ở MB FT 101 (không đụng dữ liệu của kịch bản cũ):
 *   Đỗ Minh Khôi  MT2 · SOS2 (W2 + Speaking) — hai case; một đã có nguyên nhân, một còn CHỜ xác định nguyên nhân; Phối hợp xong 1/3; có 2 vi phạm Ý thức
 *   Vũ Ngọc Lan   MT1 · SOS3 (L + R + S)     — ba case Tutor · đến MT2; Speaking đóng `Không cần theo dõi`; Phối hợp xong 2/3
 *   Bùi Thảo Vy   MT3 · SOS1 (Speaking)      — một lượt Phối hợp HOÀN THÀNH 2/2
 */
export function buildSosV3Demo(ctx: BuildCtx): { students: number; cases: number; coordination: number } {
  const { conn } = ctx;
  const classId = ctx.classId.get('MB FT 101');
  if (!classId) return { students: 0, cases: 0, coordination: 0 };
  const admin = loadPrincipal(ctx.adminId);

  const activeTeacher = (skill: string | null): Principal => {
    const row = (skill
      ? conn.prepare(`SELECT user_id AS id FROM teacher_assignments WHERE class_id = ? AND skill = ? AND status = 'active' LIMIT 1`).get(classId, skill)
      : conn.prepare(`SELECT user_id AS id FROM teacher_assignments WHERE class_id = ? AND is_core = 1 AND status = 'active' LIMIT 1`).get(classId)) as any;
    return row ? loadPrincipal(row.id) : admin;
  };
  const gvcn = activeTeacher(null);

  const addStudent = (fullName: string) => {
    commitIntake(admin, { classId, rows: [{ fullName, target: 7, email: 'hv@demo.test' }], idempotencyKey: `sosv3-demo-${fullName}` } as any);
    const st = conn.prepare('SELECT id FROM students WHERE full_name = ?').get(fullName) as any;
    const cy = conn.prepare(`SELECT id FROM learning_cycles WHERE student_id = ? AND status = 'active'`).get(st.id) as any;
    return { id: st.id as number, cycleId: cy.id as number };
  };
  /** Lượt Mock ở một tuần ĐÃ QUA (tính từ ngày demo) — điểm nhập được ngay, không có gì nằm ở tương lai. */
  const attempt = (st: { id: number; cycleId: number }, no: number, weeksAgo: number) => createAttempt(admin, {
    studentId: st.id, cycleId: st.cycleId, classId, attemptNo: no, periodId: ensurePeriod(mondayOf(addDays(DEMO_DATE, -7 * weeksAgo))).id,
  }) as any;
  const score = (a: any, skill: string, band: number) => saveScore(admin, a.id, skill,
    skill === 'listening' ? { rawScore: LISTENING_BY_RAW.indexOf(band) }
    : skill === 'reading' ? { rawScore: READING_BY_RAW.indexOf(band) }
    : { criteria: [band, band, band, band] });
  const caseOf = (sid: number, category: string) => conn.prepare('SELECT * FROM sos_cases WHERE student_id = ? AND category = ? ORDER BY id DESC').get(sid, category) as any;
  const actionOf = (attemptId: number, kind: string) => conn.prepare('SELECT * FROM sos_coordination_actions WHERE attempt_id = ? AND kind = ?').get(attemptId, kind) as any;

  // ---------------------------------------------------------------- Đỗ Minh Khôi — MT2 · SOS2
  const khoi = addStudent('Đỗ Minh Khôi');
  const khoiA = attempt(khoi, 2, 2);
  score(khoiA, 'writing1', 7); score(khoiA, 'writing2', 5.5); score(khoiA, 'speaking', 5);        // kỳ vọng MT2 6.5: W2 và Speaking dưới
  const khoiSp = caseOf(khoi.id, 'speaking');
  setIssues(activeTeacher('speaking'), khoiSp.id, { primaryCode: 'student.speaking.fluency' });   // GVBM chọn nguyên nhân (PA quy chế đã tự chạy)
  confirmCoordination(gvcn, actionOf(khoiA.id, 'talk_student').id, { performedOn: addDays(DEMO_DATE, -1), note: 'Đã gặp em sau buổi học, em hứa luyện nói mỗi ngày.' });
  /* Vi phạm Ý thức của cùng em: ghi thẳng xuống bảng với mốc thời gian theo NGÀY DEMO (như `yThucSeed.ts`) — `recordViolation` đóng dấu giờ thật của máy. */
  for (const [on, category, text] of [
    [addDays(DEMO_DATE, -3), 'homework', 'Không nộp bài Writing Task 2 tuần này'],
    [addDays(DEMO_DATE, -2), 'attendance', 'Đi muộn 20 phút buổi Speaking'],
  ] as const) {
    conn.prepare(
      `INSERT INTO violations (student_id, cycle_id, class_id, category, skill, occurred_on, reported_on, reported_by, description, created_at)
       VALUES (?,?,?,?,NULL,?,?,?,?,?)`,
    ).run(khoi.id, khoi.cycleId, classId, category, on, on, gvcn.userId, text, `${on}T08:00:00.000Z`);
  }

  // ---------------------------------------------------------------- Vũ Ngọc Lan — MT1 · SOS3
  const lan = addStudent('Vũ Ngọc Lan');
  const lanA = attempt(lan, 1, 3);
  score(lanA, 'listening', 5); score(lanA, 'reading', 5); score(lanA, 'speaking', 5);            // kỳ vọng MT1 6.0: ba kỹ năng dưới → SOS3
  dismissSosCase(activeTeacher('speaking'), caseOf(lan.id, 'speaking').id, { reasonCode: 'single_incident' });
  confirmCoordination(gvcn, actionOf(lanA.id, 'talk_student').id, { performedOn: addDays(DEMO_DATE, -4) });
  confirmCoordination(gvcn, actionOf(lanA.id, 'talk_family').id, { performedOn: addDays(DEMO_DATE, -3), note: 'CS gọi cho mẹ em, gia đình nắm tình hình.', performerName: 'CS Thu Hà' });

  // ---------------------------------------------------------------- Bùi Thảo Vy — MT3 · SOS1 (lượt hoàn thành)
  const vy = addStudent('Bùi Thảo Vy');
  const vyA = attempt(vy, 3, 1);
  score(vyA, 'speaking', 5);                                                                       // kỳ vọng MT3 7.0: chỉ Speaking dưới → SOS1
  const vySp = caseOf(vy.id, 'speaking');
  setIssues(activeTeacher('speaking'), vySp.id, { primaryCode: 'student.speaking.fluency' });
  for (const kind of ['talk_student', 'talk_family']) confirmCoordination(gvcn, actionOf(vyA.id, kind).id, { performedOn: addDays(DEMO_DATE, -1) });

  const n = (sql: string, ...a: unknown[]) => (conn.prepare(sql).get(...a) as any).n as number;
  const ids = [khoi.id, lan.id, vy.id];
  const inIds = ids.map(() => '?').join(',');
  return {
    students: 3,
    cases: n(`SELECT COUNT(*) n FROM sos_cases WHERE student_id IN (${inIds})`, ...ids),
    coordination: n(`SELECT COUNT(*) n FROM sos_coordination_actions WHERE student_id IN (${inIds})`, ...ids),
  };
}
