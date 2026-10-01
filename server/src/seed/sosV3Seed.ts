import { loadPrincipal, type Principal } from '../permissions.ts';
import { addDays } from '../util.ts';
import { ensurePeriod, mondayOf } from '../platform/week.ts';
import { LISTENING_BY_RAW, READING_BY_RAW } from '../fasttrack/scoring.ts';
import { commitIntake } from '../classes/intake.ts';
import { saveScore } from '../fasttrack/attempts.ts';
import { issuesForTopic, tuanHocCuaMt, weeklyUpdateDue } from '../../../shared/domain/index.ts';
import { guiKhongTheoDoi, xacNhanCase, xacNhanPaQuyChe } from '../cases/sosAuto.ts';
import { duyetYeuCau, tuChoiYeuCau } from '../duyet/yeuCau.ts';
import { confirmCoordination } from '../yThuc/phoiHop.ts';
import type { BuildCtx } from './build.ts';
import { DEMO_DATE } from './journeys.ts';

/**
 * BỘ DEMO RULEBOOK v3 — SOS TỰ TẠO CASE · PHỐI HỢP SOS (PR-T T8, thiet-ke/SOS_VA_PHOI_HOP_V3.md §9). Chỉ cho máy dev: bản chính dùng dữ liệu rỗng.
 *
 * KHÁC các bộ dựng khác (`build.ts`, `yThucSeed.ts` ghi thẳng xuống bảng): bộ này đi qua CHÍNH các hàm nghiệp vụ — nhập điểm Mock Test rồi để
 * engine tự tạo case, PA theo quy chế (CHỜ XÁC NHẬN — PR-SOS Q28-3) và việc phối hợp; sau đó GVBM/GVCN/Quản lý thao tác bằng đúng hàm của họ.
 * Nhờ vậy demo không thể lệch luật: nó là kết quả của luật, không phải bản sao viết tay của luật. Chỉ lùi ngày bằng SQL khi cần mốc quá hạn.
 *
 * D7 (PR-SOS) — Case SOS ở MB FT 101 đủ các trạng thái v4:
 *   (1) chờ nguyên nhân, còn hạn       Vũ Ngọc Lan · Listening
 *   (2) chờ nguyên nhân QUÁ HẠN → Báo lên   Đỗ Minh Khôi · Writing Task 2 (hạn lùi ở `duyetSeed.ts`)
 *   (3) Chờ Quản lý duyệt · không theo dõi   Vũ Ngọc Lan · Reading
 *   (4) Quản lý TỪ CHỐI → hạn mới 3 ngày    Trịnh Gia Bảo · Listening
 *   (5) Đã huỷ · không cần theo dõi          Vũ Ngọc Lan · Speaking
 *   (6) đang chạy, PA quy chế đã xác nhận    Đỗ Minh Khôi · Speaking
 *   (7) đã xác nhận Case, PA còn chờ xác nhận   Bùi Thảo Vy · Speaking
 * D8 — hạn PA: Khôi · Speaking hạn hết T2 ĐÚNG ngày demo · Lý Minh Châu · Reading quá hạn 2 ngày · Hoàng Bảo Ngọc · Listening ở TUẦN MỐC
 * (Ghi kết quả cuối).
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

  /**
   * PR-MT (M1): Thêm HV tự tạo MT1–MT3 theo tuần bắt đầu học — nên chọn TUẦN BẮT ĐẦU sao cho MT{no} rơi đúng tuần demo (`weeksAgo` tuần
   * trước), rồi dùng chính lượt đó. Số MT liền mạch (T36): các MT trước là MT lịch sử của em (tuần thi đã qua trước ngày thêm).
   */
  const addStudent = (fullName: string, no: number, weeksAgo: number) => {
    const tuanThi = mondayOf(addDays(DEMO_DATE, -7 * weeksAgo));
    const startWeek = addDays(tuanThi, -7 * (tuanHocCuaMt('LT1', no) - 1));
    commitIntake(admin, { classId, rows: [{ fullName, target: 7, startWeek, email: 'hv@demo.test' }], idempotencyKey: `sosv3-demo-${fullName}` } as any);
    const st = conn.prepare('SELECT id FROM students WHERE full_name = ?').get(fullName) as any;
    const cy = conn.prepare(`SELECT id FROM learning_cycles WHERE student_id = ? AND status = 'active'`).get(st.id) as any;
    return { id: st.id as number, cycleId: cy.id as number, no, periodId: ensurePeriod(tuanThi).id };
  };
  /**
   * Lượt Mock ở một tuần ĐÃ QUA (tính từ ngày demo) — điểm nhập được ngay. Kịch bản coi lượt này được lên lịch TỪ ĐẦU KHOÁ (trước tuần
   * thi) nên là lượt thường, không phải MT lịch sử — ghi thẳng cờ, như các bộ dựng khác ghi thẳng mốc thời gian theo ngày demo.
   */
  const attempt = (st: { cycleId: number; no: number; periodId: number }) => {
    const a = conn.prepare('SELECT * FROM assessment_attempts WHERE cycle_id = ? AND attempt_no = ?').get(st.cycleId, st.no) as any;
    if (a.planned_period_id !== st.periodId) throw new Error(`sosV3 demo: MT${st.no} không rơi đúng tuần demo`);
    conn.prepare('UPDATE assessment_attempts SET lich_su = 0 WHERE id = ?').run(a.id);
    return a;
  };
  const score = (a: any, skill: string, band: number) => saveScore(admin, a.id, skill,
    skill === 'listening' ? { rawScore: LISTENING_BY_RAW.indexOf(band) }
    : skill === 'reading' ? { rawScore: READING_BY_RAW.indexOf(band) }
    : { criteria: [band, band, band, band] });
  const caseOf = (sid: number, category: string) => conn.prepare('SELECT * FROM sos_cases WHERE student_id = ? AND category = ? ORDER BY id DESC').get(sid, category) as any;
  const actionOf = (attemptId: number, kind: string) => conn.prepare('SELECT * FROM sos_coordination_actions WHERE attempt_id = ? AND kind = ?').get(attemptId, kind) as any;
  /* PR-SOS: Quản lý chi nhánh (duyệt / từ chối thẻ) — không có thì Quản trị. */
  const qlRow = conn.prepare(`SELECT u.id FROM users u JOIN user_roles ur ON ur.user_id = u.id JOIN roles r ON r.id = ur.role_id
    WHERE r.key = 'manager' AND u.full_name = 'Nguyễn Khánh Vy' LIMIT 1`).get() as any;
  const quanLy = qlRow ? loadPrincipal(qlRow.id) : admin;
  const theKtd = (caseId: number) => (conn.prepare(`SELECT id FROM yeu_cau_duyet WHERE loai = 'khong_theo_doi' AND doi_tuong_id = ? AND trang_thai = 'cho'`).get(caseId) as any).id as number;
  /** Xác nhận Case (nguyên nhân đầu danh mục của kỹ năng, mức Bình thường). */
  const xacNhan = (who: Principal, caseId: number, topic: string, moTa: string) =>
    xacNhanCase(who, caseId, { primaryCode: issuesForTopic(topic)[0].code, urgency: 'attention', moTa });
  /** Xác nhận PA theo quy chế đầu tiên còn chờ của Case. */
  const xacNhanPa = (who: Principal, caseId: number, moTa: string) => {
    const iv = conn.prepare(`SELECT id FROM case_interventions WHERE case_id = ? AND preset = 1 AND confirmed_at IS NULL AND status = 'planned' ORDER BY id LIMIT 1`).get(caseId) as any;
    xacNhanPaQuyChe(who, iv.id, { description: moTa });
  };
  /** Lùi ngày PA quy chế đang chạy (chỉ để có mốc quá hạn / tuần mốc đúng ngày demo). */
  const hanPa = (caseId: number, batDau: string, han: string, moc?: string) =>
    conn.prepare(`UPDATE case_interventions SET started_date = ?, cycle_started_on = ?, action_due = ?, followup_due = COALESCE(?, followup_due)
      WHERE case_id = ? AND preset = 1 AND status = 'started'`).run(batDau, batDau, han, moc ?? null, caseId);

  // ---------------------------------------------------------------- Đỗ Minh Khôi — MT2 · SOS2
  const khoi = addStudent('Đỗ Minh Khôi', 2, 2);
  const khoiA = attempt(khoi);
  score(khoiA, 'writing1', 7); score(khoiA, 'writing2', 5.5); score(khoiA, 'speaking', 5);        // kỳ vọng MT2 6.5: W2 và Speaking dưới
  const khoiSp = caseOf(khoi.id, 'speaking');
  xacNhan(activeTeacher('speaking'), khoiSp.id, 'speaking', 'Em nói ngắn, ngập ngừng ở Part 2, thiếu ý mở rộng.');   // D7 (6)
  xacNhanPa(activeTeacher('speaking'), khoiSp.id, 'Tự học Speaking: ghi âm Part 2 mỗi ngày, GVBM nghe và chữa thứ Sáu.');
  hanPa(khoiSp.id, addDays(DEMO_DATE, -7), DEMO_DATE);   // D8: hạn hết T2 ĐÚNG ngày demo
  confirmCoordination(gvcn, actionOf(khoiA.id, 'talk_student').id, { performedOn: addDays(DEMO_DATE, -1), note: 'Đã gặp em sau buổi học, em hứa luyện nói mỗi ngày.' });
  /*
   * Vi phạm Ý thức của cùng em: ghi thẳng xuống bảng với mốc thời gian theo NGÀY DEMO (như `yThucSeed.ts`) — `recordViolation` đóng dấu giờ thật của máy.
   * GVCN tự ghi → tự Đã ghi nhận (PR-YT4 Q5).
   */
  for (const [on, category, text] of [
    [addDays(DEMO_DATE, -3), 'homework', 'Không nộp bài Writing Task 2 tuần này'],
    [addDays(DEMO_DATE, -2), 'attendance', 'Đi muộn 20 phút buổi Speaking'],
  ] as const) {
    conn.prepare(
      `INSERT INTO violations (student_id, cycle_id, class_id, category, skill, occurred_on, reported_on, reported_by, description, created_at, ghi_nhan_luc, ghi_nhan_boi)
       VALUES (?,?,?,?,NULL,?,?,?,?,?,?,?)`,
    ).run(khoi.id, khoi.cycleId, classId, category, on, on, gvcn.userId, text, `${on}T08:00:00.000Z`, on, gvcn.userId);
  }

  // ---------------------------------------------------------------- Vũ Ngọc Lan — MT1 · SOS3
  const lan = addStudent('Vũ Ngọc Lan', 1, 3);
  const lanA = attempt(lan);
  score(lanA, 'listening', 5); score(lanA, 'reading', 5); score(lanA, 'speaking', 5);            // kỳ vọng MT1 6.0: ba kỹ năng dưới → SOS3
  /* D7 (5): GVBM gửi "Không cần theo dõi" → Quản lý duyệt → Case + PA quy chế huỷ. (3): Reading gửi, chưa ai duyệt. (1): Listening còn hạn. */
  const lanSp = caseOf(lan.id, 'speaking');
  guiKhongTheoDoi(activeTeacher('speaking'), lanSp.id, { reasonCode: 'single_incident' });
  duyetYeuCau(quanLy, theKtd(lanSp.id));
  guiKhongTheoDoi(activeTeacher('reading'), caseOf(lan.id, 'reading').id, { reasonCode: 'other', reasonText: 'Em ốm hai ngày trước buổi thi' });
  confirmCoordination(gvcn, actionOf(lanA.id, 'talk_student').id, { performedOn: addDays(DEMO_DATE, -4) });
  confirmCoordination(gvcn, actionOf(lanA.id, 'talk_family').id, { performedOn: addDays(DEMO_DATE, -3), note: 'CS gọi cho mẹ em, gia đình nắm tình hình.', performerName: 'CS Thu Hà' });

  // ---------------------------------------------------------------- Bùi Thảo Vy — MT3 · SOS1 (lượt hoàn thành)
  const vy = addStudent('Bùi Thảo Vy', 3, 1);
  const vyA = attempt(vy);
  score(vyA, 'speaking', 5);                                                                       // kỳ vọng MT3 7.0: chỉ Speaking dưới → SOS1
  const vySp = caseOf(vy.id, 'speaking');
  xacNhan(activeTeacher('speaking'), vySp.id, 'speaking', 'Em phát âm cuối từ chưa rõ, mất điểm Pronunciation.');   // D7 (7): PA còn chờ xác nhận
  for (const kind of ['talk_student', 'talk_family']) confirmCoordination(gvcn, actionOf(vyA.id, kind).id, { performedOn: addDays(DEMO_DATE, -1) });

  // ---------------------------------------------------------------- D7 (4): Trịnh Gia Bảo — MT1 · Listening, Quản lý từ chối "không theo dõi"
  const bao = addStudent('Trịnh Gia Bảo', 1, 3);
  score(attempt(bao), 'listening', 5);
  const baoL = caseOf(bao.id, 'listening');
  guiKhongTheoDoi(activeTeacher('listening'), baoL.id, { reasonCode: 'single_incident' });
  tuChoiYeuCau(quanLy, theKtd(baoL.id), 'Em trượt Listening hai lượt liền — cần theo dõi');

  // ---------------------------------------------------------------- D8: Lý Minh Châu — MT2 · Reading, PA quy chế quá hạn 2 ngày
  const chau = addStudent('Lý Minh Châu', 2, 2);
  score(attempt(chau), 'reading', 5.5);
  const chauR = caseOf(chau.id, 'reading');
  xacNhan(activeTeacher('reading'), chauR.id, 'reading', 'Em sai dạng Matching Headings ở cả ba passage.');
  xacNhanPa(activeTeacher('reading'), chauR.id, 'Tự học Reading: hai bài Matching Headings mỗi tuần, cô Hà chữa.');
  hanPa(chauR.id, addDays(DEMO_DATE, -16), addDays(DEMO_DATE, -7));   // quá hạn 1 tuần — PR-Dọn (10a): hạn rơi Thứ Hai (07/09)

  // ---------------------------------------------------------------- D8: Hoàng Bảo Ngọc — MT1 · Listening, PA quy chế ở TUẦN MỐC (Ghi kết quả cuối)
  const ngoc = addStudent('Hoàng Bảo Ngọc', 1, 5);
  score(attempt(ngoc), 'listening', 5.5);
  const ngocL = caseOf(ngoc.id, 'listening');
  xacNhan(activeTeacher('listening'), ngocL.id, 'listening', 'Em sót số và tên riêng ở Part 1–2.');
  xacNhanPa(activeTeacher('listening'), ngocL.id, 'Tự học Listening: nghe chép Part 1 mỗi ngày, gửi cô Hà thứ Năm.');
  /* Mốc quy chế Chủ nhật tuần này (20/09) < hạn hết T2 21/09 → lần ghi này là lần cuối. */
  hanPa(ngocL.id, addDays(DEMO_DATE, -28), weeklyUpdateDue(DEMO_DATE), addDays(DEMO_DATE, 6));

  const n = (sql: string, ...a: unknown[]) => (conn.prepare(sql).get(...a) as any).n as number;
  const ids = [khoi.id, lan.id, vy.id, bao.id, chau.id, ngoc.id];
  const inIds = ids.map(() => '?').join(',');
  return {
    students: 3,
    cases: n(`SELECT COUNT(*) n FROM sos_cases WHERE student_id IN (${inIds})`, ...ids),
    coordination: n(`SELECT COUNT(*) n FROM sos_coordination_actions WHERE student_id IN (${inIds})`, ...ids),
  };
}

/**
 * BỘ DEMO PR-KCK (Q29-1): hai em Target KCK ở MB FT 101 — vẫn có lịch MT và nhập điểm, nhưng không kỳ vọng, không SOS, không việc
 * "Điền target". Qua chính `commitIntake` (ô Target gõ `KCK` / `-`) và `saveScore`, như bộ SOS v3 ở trên.
 *   Hồ Gia Hân   Target KCK · MT1 L R S 5.0 (dưới mọi band FT) → KHÔNG Case, KHÔNG PA quy chế, KHÔNG Phối hợp
 *   Lê Minh Đức  Target "-"  · chưa có điểm
 */
export function buildKckDemo(ctx: BuildCtx): number {
  const { conn } = ctx;
  const classId = ctx.classId.get('MB FT 101');
  if (!classId) return 0;
  const admin = loadPrincipal(ctx.adminId);
  const tuanThi = mondayOf(addDays(DEMO_DATE, -7 * 2));
  const startWeek = addDays(tuanThi, -7 * (tuanHocCuaMt('LT1', 1) - 1));
  for (const [fullName, target] of [['Hồ Gia Hân', 'KCK'], ['Lê Minh Đức', '-']]) {
    commitIntake(admin, { classId, rows: [{ fullName, target, startWeek, email: 'hv@demo.test' }], idempotencyKey: `kck-demo-${fullName}` } as any);
  }
  /* MT1 của cả hai là lượt thường (lên lịch từ đầu khoá), như bộ SOS v3. */
  conn.prepare(`UPDATE assessment_attempts SET lich_su = 0 WHERE attempt_no = 1 AND student_id IN
                  (SELECT id FROM students WHERE full_name IN ('Hồ Gia Hân', 'Lê Minh Đức'))`).run();
  const han = conn.prepare(`SELECT a.* FROM assessment_attempts a JOIN students s ON s.id = a.student_id
                             WHERE s.full_name = 'Hồ Gia Hân' AND a.attempt_no = 1`).get() as any;
  saveScore(admin, han.id, 'listening', { rawScore: LISTENING_BY_RAW.indexOf(5) });
  saveScore(admin, han.id, 'reading', { rawScore: READING_BY_RAW.indexOf(5) });
  saveScore(admin, han.id, 'speaking', { criteria: [5, 5, 5, 5] });
  return 2;
}
