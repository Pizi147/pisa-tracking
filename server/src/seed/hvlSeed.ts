import { loadPrincipal, type Principal } from '../permissions.ts';
import { addDays } from '../util.ts';
import { mondayOf } from '../platform/week.ts';
import { LISTENING_BY_RAW, READING_BY_RAW } from '../fasttrack/scoring.ts';
import { commitIntake } from '../classes/intake.ts';
import { saveScore } from '../fasttrack/attempts.ts';
import { planRegularTests, saveRegularScore } from '../normal/regular.ts';
import { reportIssue } from '../cases/cases.ts';
import { guiKhongTheoDoi } from '../cases/sosAuto.ts';
import { issuesForTopic } from '../../../shared/domain/index.ts';
import type { BuildCtx } from './build.ts';
import { DEMO_DATE } from './journeys.ts';

/**
 * BỘ DEMO PR-HVL (planning đặt H1–H4, Q18) — đi qua CHÍNH các hàm nghiệp vụ như `xlmtSeed.ts`, dựng sau ngày demo. Nằm ở: Học viên & Lớp ·
 * Hồ sơ lớp → tab Học viên (Cần hỗ trợ) · Phân tích lớp.
 *
 *  H1  MB FT 101 · Trịnh Bảo Ngọc — MT1 dưới kỳ vọng ở Reading và Writing: hai Case Reading cùng kỹ năng (Case SOS tự tạo + Case GV tạo tay),
 *      Case Writing "Không cần theo dõi" đang chờ Quản lý duyệt → hàng R hai Case, hàng W chờ duyệt. KHÔNG dựng Case "chung" (không kỹ năng): mọi Case phải có
 *      kỹ năng (`reportIssue` bắt buộc; các phép kiểm dữ liệu mẫu cũng đòi vậy) — hàng "Chung" chỉ xuất hiện với Case bàn giao / dữ liệu cũ, kiểm bằng phép kiểm thuần ở `prHvl.tests.ts`.
 *  H2  MB FOU 12 · Hồ Diệu Linh — Case G+V (writing) và Case P (speaking) → hàng G+V, P của lớp FOU; Nguyễn Thảo Vy — Cuối khoá đủ 4 môn 58/100 = "58%".
 *  H3  MB Pre FOU 03 · Cuối khoá ~64% — ĐÃ CÓ ở `students.ts` (PR-MON D12): không dựng lại.
 *  H4  Đoàn Khánh Chi (MB FT 101) — MT1–MT3 là MT lịch sử có điểm, chưa có lượt thường có điểm — ĐÃ CÓ ở `xlmtSeed.ts` (X3): không dựng lại.
 */
export function buildHvlDemo(ctx: BuildCtx): { students: number } {
  const { conn } = ctx;
  const ft101 = ctx.classId.get('MB FT 101');
  const fou12 = ctx.classId.get('MB FOU 12');
  if (!ft101 || !fou12) return { students: 0 };
  const admin = loadPrincipal(ctx.adminId);
  const nguoiDay = (classId: number, kyNang: string | null): Principal => {
    const r = kyNang
      ? conn.prepare(`SELECT user_id AS id FROM teacher_assignments WHERE class_id = ? AND skill = ? AND status = 'active' LIMIT 1`).get(classId, kyNang)
      : conn.prepare(`SELECT user_id AS id FROM teacher_assignments WHERE class_id = ? AND is_core = 1 AND status = 'active' LIMIT 1`).get(classId);
    return r ? loadPrincipal((r as any).id) : admin;
  };
  const them = (classId: number, ten: string, startWeek: string | null, target: number | string = 6.5) => {
    commitIntake(admin, { classId, rows: [{ fullName: ten, target, ...(startWeek ? { startWeek } : {}), email: 'hv@demo.test' }], idempotencyKey: `hvl-demo-${ten}` } as any);
    const st = conn.prepare('SELECT id FROM students WHERE full_name = ?').get(ten) as any;
    const cy = conn.prepare(`SELECT id FROM learning_cycles WHERE student_id = ? AND status = 'active'`).get(st.id) as any;
    return { id: st.id as number, cycleId: cy.id as number };
  };
  const primary = (topic: string, ct?: string) => issuesForTopic(topic, ct)[0].code;

  // ---------------------------------------------------------------- H1 · MB FT 101
  const ngoc = them(ft101, 'Trịnh Bảo Ngọc', mondayOf(addDays(DEMO_DATE, -7 * 8)));   // MT1 (tuần học 6) = 2 tuần trước → lượt thường
  conn.prepare('UPDATE assessment_attempts SET lich_su = 0 WHERE cycle_id = ?').run(ngoc.cycleId);
  const mt1 = conn.prepare('SELECT id FROM assessment_attempts WHERE cycle_id = ? AND attempt_no = 1').get(ngoc.cycleId) as any;
  saveScore(admin, mt1.id, 'listening', { rawScore: LISTENING_BY_RAW.indexOf(6.5) });
  saveScore(admin, mt1.id, 'reading', { rawScore: READING_BY_RAW.indexOf(5) });          // dưới kỳ vọng MT1 (target 6.5 − 1.0 = 5.5) → Case Reading
  for (const k of ['writing1', 'writing2']) saveScore(admin, mt1.id, k, { criteria: [4.5, 4.5, 4.5, 4.5] });   // Writing dưới kỳ vọng → Case Writing
  saveScore(admin, mt1.id, 'speaking', { criteria: [6.5, 6.5, 6.5, 6.5] });
  const caseCua = (topicLike: string) =>
    conn.prepare(`SELECT id FROM sos_cases WHERE student_id = ? AND topic LIKE ? AND status != 'done' ORDER BY id LIMIT 1`).get(ngoc.id, topicLike) as any;
  const caW = caseCua('writing%');
  if (caW) {
    /* Case Writing chờ Quản lý duyệt "không theo dõi" (người xử lý gửi — ở đây Quản lý Monbay, đúng phạm vi). */
    guiKhongTheoDoi(loadPrincipal(ctx.userId.get('MGR_MB')!), caW.id, { reasonCode: 'single_incident' });
  }
  /* Case Reading thứ hai do GV tạo tay — song song có chủ ý với Case SOS tự tạo cùng kỹ năng. */
  reportIssue(nguoiDay(ft101, 'reading'), {
    studentId: ngoc.id, cycleId: ngoc.cycleId, topic: 'reading', title: 'Đọc chậm, hết giờ ở Part 3',
    summary: 'Em làm Reading chậm, thường không kịp Part 3 dù hiểu bài.', primaryCode: primary('reading'), parallel: true,
  } as any);

  // ---------------------------------------------------------------- H2 · MB FOU 12
  const linh = them(fou12, 'Hồ Diệu Linh', null, '-');
  const gvcn12 = nguoiDay(fou12, null);
  reportIssue(gvcn12, {
    studentId: linh.id, cycleId: linh.cycleId, topic: 'writing', title: 'Chia thì sai ở câu phức',
    summary: 'Em hay chia sai thì trong câu phức và dùng sai mạo từ.', primaryCode: primary('writing', 'FOU'),
  } as any);
  reportIssue(gvcn12, {
    studentId: linh.id, cycleId: linh.cycleId, topic: 'speaking', title: 'Phát âm âm cuối',
    summary: 'Em bỏ âm cuối /s/ và /t/ khi đọc từ, cần luyện lại.', primaryCode: primary('speaking', 'FOU'),
  } as any);
  const vy = them(fou12, 'Nguyễn Thảo Vy', null, '-');
  planRegularTests(loadPrincipal(ctx.userId.get('MGR_MB')!), fou12, { studentIds: [vy.id], kinds: ['final'] });
  const cuoi = conn.prepare(`SELECT id FROM assessment_attempts WHERE student_id = ? AND kind = 'final' ORDER BY id DESC LIMIT 1`).get(vy.id) as any;
  if (cuoi) {
    for (const [k, dung] of [['listening', 15], ['reading', 14], ['writing', 14], ['speaking', 15]] as const) {
      saveRegularScore(admin, cuoi.id, k, { score: dung, total: 25 });   // 58/100 → hiện "58%"
    }
  }
  return { students: 3 };
}
