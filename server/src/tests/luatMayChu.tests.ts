/**
 * PHÉP KIỂM PR-S1 — luật máy chủ (đặc tả `docs/superpowers/specs/2026-09-22-ux-toan-web-truoc-deploy-design.md` §3.10, §5, §6;
 * kiểm kê §1.5, §1.7, §1.9). Tên mỗi phép kiểm bắt đầu bằng mã việc (S1, S11…S17, RB-3, RB-6, RB-8, RB-9, AN-13, §6).
 *
 * Harness do `run.ts` sở hữu và truyền vào — file này không tự mở database. Học viên dùng ở đây do CHÍNH file này tạo
 * (`taoHocVien`), không đụng học viên của bộ demo — nên phép kiểm ở file khác chạy trước hay sau cũng không ảnh hưởng.
 * Ngày demo cố định: TODAY = 2026-09-14 (thứ Hai). Tuần 07–13/09 đã hết Chủ nhật; tuần 14–20/09 đang chạy.
 */
import type { YThucTestKit } from './yThuc.tests.ts';

export async function runLuatMayChuTests(t: YThucTestKit) {
  const { check, assert, assertThrows, conn, TODAY, P, classId } = t;
  const domain: any = await import('../../../shared/domain/index.ts');
  const { loadPrincipal } = await import('../permissions.ts');
  const week: any = await import('../platform/week.ts');
  const skillSchedule: any = await import('../fasttrack/skillSchedule.ts');
  const regular: any = await import('../normal/regular.ts');
  const cases: any = await import('../cases/cases.ts');
  const fsMod = await import('node:fs');
  const pathMod = await import('node:path');
  const { fileURLToPath } = await import('node:url');
  const { default: SqliteDb } = await import('libsql');
  const migrateMod: any = await import('../migrate.ts');
  /**
   * Mô-đun chưa có thì phép kiểm ĐỎ với câu nói rõ thiếu gì, không làm sập cả bộ. `then` trả `undefined`: `await` hỏi `then` để biết
   * có phải promise không — ném lỗi ở đó thì chính `await load(...)` làm sập cả bộ.
   */
  const load = async (p: string): Promise<any> => import(p).catch((e) =>
    new Proxy({}, { get: (_x, k) => {
      if (k === 'then') return undefined;
      throw new Error(`Chưa có mô-đun ${p} (${String(k)}) — ${e.message}`);
    } }));
  const REPO = pathMod.resolve(fileURLToPath(new URL('../../../../', import.meta.url)));
  const NOW = new Date().toISOString();
  let soThuTu = 0;

  const teacherOf = (classCode: string, skill: string): number => {
    const r = conn.prepare(
      `SELECT user_id FROM teacher_assignments WHERE class_id = ? AND skill = ? AND status = 'active' ORDER BY id LIMIT 1`,
    ).get(classId(classCode), skill) as any;
    assert(r, `Bộ demo thiếu GV ${skill} ở ${classCode}`);
    return r.user_id as number;
  };
  const mbBranch = (conn.prepare(`SELECT id FROM branches WHERE code = 'MB'`).get() as any).id as number;

  type HocVien = { sid: number; cid: number; cycleId: number; attemptId: number; periodId: number };
  /** Thêm một lượt Test cho học viên đã có — dùng khi cần lượt thứ hai (Cuối khoá, MT2). */
  function themLuot(o: { sid: number; cid: number; cycleId: number; weekStart: string; kind: string; no: number }): number {
    const periodId = week.ensurePeriod(o.weekStart).id;
    const id = Number(conn.prepare(
      `INSERT INTO assessment_attempts (cycle_id, student_id, attempt_no, kind, class_id, planned_period_id, status, created_at)
       VALUES (?,?,?,?,?,?, 'planned', ?)`,
    ).run(o.cycleId, o.sid, o.no, o.kind, o.cid, periodId, NOW).lastInsertRowid);
    skillSchedule.ensureSkillRows(id);
    return id;
  }
  /**
   * HỌC VIÊN MỚI trong một lớp có sẵn của bộ demo, kèm MỘT lộ trình đang chạy và MỘT lượt Test ở tuần `weekStart`.
   * MB FOU 12 là lớp thường (GVCN T_HA dạy L, R · W: T_KHOA · S: T_TRANG). MB FT 101 là FT (GVCN T_HA dạy L, R · W1 T_KHOA · W2 T_LINH · S T_TRANG).
   */
  function taoHocVien(o: { classCode: 'MB FOU 12' | 'MB FT 101'; weekStart: string; kind?: 'mock' | 'progress' | 'final' }): HocVien {
    soThuTu += 1;
    const tag = `S1-${soThuTu}`;
    const cid = classId(o.classCode);
    const ft = o.classCode === 'MB FT 101';
    const sid = Number(conn.prepare(
      `INSERT INTO students (student_code, full_name, normalized_name, branch_id, status, created_at) VALUES (?,?,?,?, 'active', ?)`,
    ).run(`PISA-${tag}`, `Học viên ${tag}`, `hoc vien ${tag.toLowerCase()}`, mbBranch, NOW).lastInsertRowid);
    conn.prepare(`INSERT INTO enrollments (student_id, class_id, status, started_at, created_at) VALUES (?,?, 'active', '2026-07-27', ?)`)
      .run(sid, cid, NOW);
    const cycleId = Number(conn.prepare(
      `INSERT INTO learning_cycles (student_id, seq, route, programme_code, started_at, status, created_at)
       VALUES (?, 1, ?, ?, '2026-07-27', 'active', ?)`,
    ).run(sid, ft ? 'LT1' : null, ft ? null : 'FOU', NOW).lastInsertRowid);
    const attemptId = themLuot({ sid, cid, cycleId, weekStart: o.weekStart, kind: o.kind ?? (ft ? 'mock' : 'progress'), no: 1 });
    return { sid, cid, cycleId, attemptId, periodId: week.ensurePeriod(o.weekStart).id };
  }
  /**
   * Nhập điểm lớp thường qua đúng đường nghiệp vụ (Quản trị nhập bù — đường `score.override`). RB-5 (PR-Rc1): hàm này
   * cũng dùng để SỬA điểm đã có, nên luôn kèm lý do — lần nhập đầu thì máy chủ bỏ qua nó (luật có phép kiểm riêng ở
   * chamDiem.tests.ts).
   */
  const diem = (attemptId: number, skill: string, score: number, total: number) =>
    regular.saveRegularScore(P.admin, attemptId, skill, { score, total, lyDo: 'Phép kiểm: sửa điểm nguồn' });
  const tinHieu = (attemptId: number, skill: string) =>
    conn.prepare('SELECT * FROM case_signals WHERE attempt_id = ? AND skill = ?').get(attemptId, skill) as any;
  const pGvcnFou = P.normalCoreTeacher;                               // T_HA — GVCN MB FOU 12, dạy L và R
  const pSpeakingFou = loadPrincipal(teacherOf('MB FOU 12', 'speaking'));
  const pWritingFou = loadPrincipal(teacherOf('MB FOU 12', 'writing'));
  /** "Tạo Case" từ một tín hiệu, đúng như form sẽ gửi. `topic` để thử gửi sai môn. */
  const caseTuTinHieu = (p: any, sg: any, topic?: string) => cases.reportIssue(p, {
    studentId: sg.student_id, topic: topic ?? sg.skill, fromSignalId: sg.id,
    title: `Case từ tín hiệu ${sg.skill} (PR-S1)`, summary: 'Đã xem lại bài, em vướng đúng phần này của môn.',
    /* PR-MON (T57): bộ nguyên nhân theo chương trình lớp của tín hiệu (FOU W → G+V). */
    primaryCode: domain.issuesForTopic(topic ?? sg.skill,
      (conn.prepare('SELECT programme_code FROM classes WHERE id = ?').get(sg.class_id) as any)?.programme_code)[0].code,
  }) as any;
  void load; void assertThrows; void TODAY; void pSpeakingFou; void pWritingFou; void caseTuTinHieu; void diem; void tinHieu;

  // ================================================================== 1. Nâng cấp database

  console.log('\nPR-S1 · 1. Hai cột mới — schema.sql và migrate.ts khớp nhau, chạy lặp không làm gì');

  const SCHEMA = fsMod.readFileSync(pathMod.join(REPO, 'server/src/schema.sql'), 'utf8');
  const colsOf = (db: any, table: string): string[] => (db.prepare(`PRAGMA table_info(${table})`).all() as any[]).map((c) => c.name);
  /** Database THỜI TRƯỚC PR-S1: schema hiện tại, gỡ đúng hai cột PR-S1 thêm, kèm hai buổi vắng cũ. */
  const preS1 = () => {
    const m = new SqliteDb(':memory:');
    m.exec(SCHEMA);
    m.exec(`ALTER TABLE sos_cases DROP COLUMN system_close_reason;
            ALTER TABLE attempt_skills DROP COLUMN absent_from_no_show;`);
    const q = (sql: string, ...a: unknown[]) => Number(m.prepare(sql).run(...a).lastInsertRowid);
    const N = '2026-09-10T00:00:00.000Z';
    q(`INSERT INTO branches (code, name, created_at) VALUES ('MB', 'Monbay', ?)`, N);
    q(`INSERT INTO students (id, student_code, full_name, normalized_name, branch_id, status, created_at) VALUES (1,'PISA1','Em 1','em 1',1,'active',?)`, N);
    q(`INSERT INTO learning_cycles (id, student_id, seq, started_at, status, created_at) VALUES (1, 1, 1, '2026-07-01', 'active', ?)`, N);
    q(`INSERT INTO assessment_attempts (id, cycle_id, student_id, attempt_no, kind, status, created_at) VALUES (1, 1, 1, 1, 'mock', 'planned', ?)`, N);
    q(`INSERT INTO attempt_skills (attempt_id, skill, sit_status, sit_note, created_at) VALUES (1, 'listening', 'absent', 'Không dự thi — dấu "-" còn nguyên đến hết Chủ nhật.', ?)`, N);
    q(`INSERT INTO attempt_skills (attempt_id, skill, sit_status, sit_note, created_at) VALUES (1, 'reading', 'absent', 'GVCN xác minh học viên không tới buổi thi', ?)`, N);
    return m;
  };

  check('PR-S1 · Migrate: database dựng từ schema.sql có đủ hai cột mới', () => {
    assert(colsOf(conn, 'sos_cases').includes('system_close_reason'), 'sos_cases thiếu system_close_reason');
    const col = (conn.prepare('PRAGMA table_info(attempt_skills)').all() as any[]).find((c) => c.name === 'absent_from_no_show');
    assert(col && col.notnull === 1 && String(col.dflt_value) === '0', `absent_from_no_show phải NOT NULL DEFAULT 0: ${JSON.stringify(col)}`);
  });

  check('PR-S1 · Migrate: database cũ được thêm cột; buổi vắng CHỐT DẤU "-" cũ được đánh cờ, buổi vắng do GVCN xác minh thì không', () => {
    const m = preS1();
    const applied: string[] = [];
    migrateMod.migrateLuatMayChu(m, applied);
    assert(applied.length === 1 && /PR-S1/.test(applied[0]), `Phải báo đúng một dòng PR-S1: ${applied.join(' | ')}`);
    assert(colsOf(m, 'sos_cases').includes('system_close_reason') && colsOf(m, 'attempt_skills').includes('absent_from_no_show'), 'Thiếu cột sau nâng cấp');
    const flags = (m.prepare('SELECT skill, absent_from_no_show AS f FROM attempt_skills ORDER BY skill').all() as any[]);
    assert(JSON.stringify(flags) === JSON.stringify([{ skill: 'listening', f: 1 }, { skill: 'reading', f: 0 }]), `Cờ sai: ${JSON.stringify(flags)}`);
  });

  check('PR-S1 · Migrate: chạy lần hai không làm gì; database mới từ schema.sql không có gì để nâng cấp', () => {
    const m = preS1();
    migrateMod.migrateLuatMayChu(m, []);
    const again: string[] = [];
    migrateMod.migrateLuatMayChu(m, again);
    assert(again.length === 0, `Lần hai phải không làm gì: ${again.join(' | ')}`);
    const fresh = new SqliteDb(':memory:');
    fresh.exec(SCHEMA);
    const none: string[] = [];
    migrateMod.migrateLuatMayChu(fresh, none);
    assert(none.length === 0, `Database mới không được có gì để nâng cấp: ${none.join(' | ')}`);
  });

  check('PR-S1 · Migrate: `migrate()` trọn chuỗi chạy hai lần trên database đang dùng — lần hai không áp lại bước PR-S1', () => {
    migrateMod.migrate();
    const second = migrateMod.migrate();
    assert(!second.applied.some((x: string) => /PR-S1/.test(x)), `Lần hai áp lại PR-S1: ${second.applied.join(' | ')}`);
  });

  check('PR-S1 · Tiền đề: dựng được học viên lớp thường và FT riêng cho phép kiểm, mỗi em một lượt có đủ bốn dòng lịch kỹ năng', () => {
    const a = taoHocVien({ classCode: 'MB FOU 12', weekStart: '2026-09-07' });
    const b = taoHocVien({ classCode: 'MB FT 101', weekStart: '2026-09-14' });
    for (const x of [a, b]) {
      const n = (conn.prepare('SELECT COUNT(*) n FROM attempt_skills WHERE attempt_id = ?').get(x.attemptId) as any).n;
      assert(n === 4, `Lượt ${x.attemptId} phải có 4 dòng lịch kỹ năng, có ${n}`);
    }
    assert(regular.isRatioClass(a.cid) && !regular.isRatioClass(b.cid), 'MB FOU 12 phải là lớp thường, MB FT 101 là FT');
  });

  // ================================================================== 2. S11

  console.log('\nPR-S1 · 2. S11 — "vắng do chốt dấu -" là CỘT RIÊNG, không phải chuỗi chữ');
  const attempts: any = await import('../fasttrack/attempts.ts');
  const absence: any = await import('../fasttrack/absence.ts');
  const sit = (attemptId: number, skill: string) => conn.prepare(
    'SELECT sit_status, sit_note, absent_from_no_show AS flag, absence_move_count FROM attempt_skills WHERE attempt_id = ? AND skill = ?',
  ).get(attemptId, skill) as any;

  check('S11 · Chốt dấu "-" đánh cờ cột riêng; máy tự dời lần đầu theo CỜ (sáng thứ Ba, tuần kế tiếp đã bắt đầu), dời xong cờ về 0', () => {
    const hv = taoHocVien({ classCode: 'MB FT 101', weekStart: '2026-09-14' });
    attempts.saveScore(P.lrTeacher, hv.attemptId, 'listening', { noShow: true }, '2026-09-16');
    /* PR-MT (Q-A): tuần W4 SEP đã bắt đầu từ thứ Hai — chỉ bài có cờ `absent_from_no_show` mới được dời lần đầu vào tuần đang chạy. */
    absence.settleNoShows('2026-09-22');
    const s = sit(hv.attemptId, 'listening');
    assert(s.sit_status === 'scheduled' && s.absence_move_count === 1 && s.flag === 0,
      `Chốt xong máy phải tự dời lần 1 và cờ về 0: ${JSON.stringify(s)}`);
  });

  check('S11 · Vắng do Quản lý/GVCN xác nhận bằng tay KHÔNG mang cờ chốt dấu "-"', () => {
    const hv = taoHocVien({ classCode: 'MB FT 101', weekStart: '2026-09-14' });
    skillSchedule.setSitStatus(P.mbManager, hv.attemptId, 'speaking', 'absent', 'Quản lý xác nhận em vắng buổi Speaking');
    assert(sit(hv.attemptId, 'speaking').sit_status === 'absent' && sit(hv.attemptId, 'speaking').flag === 0,
      `Vắng tay phải cờ 0: ${JSON.stringify(sit(hv.attemptId, 'speaking'))}`);
  });

  check('S11 · Mã nguồn không còn dùng chuỗi sit_note làm cờ', () => {
    const src = fsMod.readFileSync(pathMod.join(REPO, 'server/src/fasttrack/absence.ts'), 'utf8');
    assert(!/sit_note[^\n]*startsWith/.test(src), 'absence.ts còn đọc sit_note.startsWith(...) làm cờ');
  });

  // ================================================================== 3. S13 · S14

  console.log('\nPR-S1 · 3. S13 giữ quyết định Quản lý · S14 xác nhận "-" muộn của Writing');
  const cellOf = (hv: HocVien, skill: string, today: string) =>
    (attempts.classScoreSheet(P.admin, hv.cid, hv.periodId, today) as any).rows
      .find((r: any) => r.attemptId === hv.attemptId)?.cells.find((c: any) => c.skill === skill);
  const settledCount = (attemptId: number, assessed: string) => (conn.prepare(
    `SELECT COUNT(*) n FROM attempt_schedule_history WHERE attempt_id = ? AND action = 'skill_no_show_settled' AND field = ?`,
  ).get(attemptId, assessed) as any).n as number;

  check('S13 · GV báo lại "-" cùng tuần sau khi Quản lý đã đổi kết luận: không chốt lại, dấu không hiện lại, ô có MỘT dòng giải thích', () => {
    const hv = taoHocVien({ classCode: 'MB FT 101', weekStart: '2026-09-14' });
    attempts.saveScore(P.lrTeacher, hv.attemptId, 'listening', { noShow: true }, '2026-09-16');
    /* PR-MT (Q-A): chốt MUỘN (28/09, tuần kế tiếp W4 SEP đã hết) nên máy không tự dời mà chuyển Quản lý — bài còn "vắng" để Quản lý đổi kết luận. */
    absence.settleNoShows('2026-09-28');
    assert(settledCount(hv.attemptId, 'listening') === 1, 'Tiền đề: phải chốt đúng một lần');
    skillSchedule.setSitStatus(P.mbManager, hv.attemptId, 'listening', 'scheduled', 'Quản lý sửa: em có làm bài');
    assert(!conn.prepare(`SELECT 1 FROM skill_move_requests WHERE attempt_id = ? AND status = 'pending'`).get(hv.attemptId),
      'Quản lý đổi kết luận thì đề nghị dời máy đã gửi phải được rút');
    attempts.saveScore(P.lrTeacher, hv.attemptId, 'listening', { noShow: true }, '2026-09-29');
    absence.settleNoShows('2026-09-30');
    assert(sit(hv.attemptId, 'listening').sit_status === 'scheduled', 'Quyết định của Quản lý bị đè');
    assert(settledCount(hv.attemptId, 'listening') === 1, 'Không được chốt lần hai');
    const cell = cellOf(hv, 'listening', '2026-09-29');
    assert(cell && cell.noShow === null, `Dấu "-" cũ không được sống lại: ${JSON.stringify(cell?.noShow)}`);
    assert(cell.noShowNote === domain.NO_SHOW_OVERRIDDEN_NOTE, `Thiếu dòng giải thích: ${JSON.stringify(cell.noShowNote)}`);
    const other = cellOf(hv, 'reading', '2026-09-29');
    assert(other.noShowNote === null, 'Ô không có chuyện gì thì không có dòng giải thích');
  });

  check('S14 · resolveLateNoShow nhánh Writing: chỉ W1 "-" thì KHÔNG xác nhận được; từ chối thì gỡ dấu; giáo viên không tự hiệu chỉnh', () => {
    const hv = taoHocVien({ classCode: 'MB FT 101', weekStart: '2026-09-07' });       // tuần đã hết 13/09
    attempts.saveScore(P.w1Teacher, hv.attemptId, 'writing1', { noShow: true }, '2026-09-15');
    assert(sit(hv.attemptId, 'writing').sit_status === 'scheduled', 'W2 chưa "-" thì buổi Writing chưa phải vắng');
    assertThrows(() => absence.resolveLateNoShow(P.mbManager, hv.attemptId, 'writing1', 'confirm', '2026-09-15'),
      /mọi bài của buổi/, 'Xác nhận vắng Writing khi chỉ có W1 "-"');
    assertThrows(() => absence.resolveLateNoShow(P.w1Teacher, hv.attemptId, 'writing1', 'reject', '2026-09-15'),
      /Chỉ Quản lý/, 'GV tự hiệu chỉnh dấu "-" của tuần đã kết thúc');
    const r = absence.resolveLateNoShow(P.mbManager, hv.attemptId, 'writing1', 'reject', '2026-09-15') as any;
    assert(r.result === 'rejected', `Phải là rejected: ${JSON.stringify(r)}`);
    const w1 = conn.prepare(`SELECT no_show_period_id FROM assessment_scores WHERE attempt_id = ? AND skill = 'writing1'`).get(hv.attemptId) as any;
    assert(w1.no_show_period_id === null, 'Từ chối xong dấu "-" của W1 phải được gỡ');
  });

  // ================================================================== 4. S12 + §6 branchpulse

  console.log('\nPR-S1 · 4. Ô điểm còn nợ (bảng chi nhánh) — cùng luật với bảng chấm: lớp thường theo số câu đúng và Chủ nhật; W1/W2 theo cặp');
  const scoreDebt = await load('../worklist/scoreDebt.ts');
  const no = (today: string, attemptId: number) =>
    (scoreDebt.scoreDebtCells(P.admin, today, [mbBranch]) as any[]).filter((d) => d.attemptId === attemptId);

  check('§6 · Lớp thường: môn đã có số câu đúng không còn nợ; môn chưa có nợ và QUÁ HẠN từ thứ Hai sau tuần thi (không phải thứ Tư kiểu FT)', () => {
    const hv = taoHocVien({ classCode: 'MB FOU 12', weekStart: '2026-09-07' });
    diem(hv.attemptId, 'reading', 30, 40);
    const cells = no(TODAY, hv.attemptId);
    assert(!cells.some((d) => d.skill === 'reading'), `Reading đã có 30/40 mà vẫn bị tính nợ: ${JSON.stringify(cells)}`);
    const l = cells.find((d) => d.skill === 'listening');
    assert(l && l.userId === teacherOf('MB FOU 12', 'listening') && l.overdue === true,
      `Listening chưa nhập phải nợ, đúng GV, quá hạn hôm thứ Hai 14/09: ${JSON.stringify(l)}`);
    const sunday = no('2026-09-13', hv.attemptId).find((d) => d.skill === 'listening');
    assert(sunday && sunday.overdue === false, `Chủ nhật 13/09 vẫn trong hạn: ${JSON.stringify(sunday)}`);
    for (const k of ['listening', 'writing', 'speaking']) diem(hv.attemptId, k, 30, 40);
    assert(no(TODAY, hv.attemptId).length === 0, 'Đủ bốn môn mà vẫn còn ô nợ');
  });

  check('S12 · FT: chỉ W1 "-" thì W1 vẫn là nợ sau Chủ nhật (buổi Writing chưa phải vắng); trước Chủ nhật W1 "-" không nợ; W1 + W2 cùng "-" → chốt vắng, không ô nào nợ', () => {
    const hv = taoHocVien({ classCode: 'MB FT 101', weekStart: '2026-09-14' });
    attempts.saveScore(P.w1Teacher, hv.attemptId, 'writing1', { noShow: true }, '2026-09-16');
    const mid = no('2026-09-16', hv.attemptId);
    assert(!mid.some((d) => d.skill === 'writing1'), 'Trong tuần, W1 đã báo "không có bài" thì không nợ');
    assert(mid.some((d) => d.skill === 'writing2' && d.userId === teacherOf('MB FT 101', 'writing2')), 'W2 chưa nhập vẫn nợ, đúng GV W2');
    assert(no('2026-09-21', hv.attemptId).some((d) => d.skill === 'writing1'),
      'Sau Chủ nhật, W1 "-" mà W2 không "-" thì W1 vẫn là nợ — đúng như ô ở bảng chấm');
    attempts.saveScore(P.w2Teacher, hv.attemptId, 'writing2', { noShow: true }, '2026-09-18');
    const after = no('2026-09-21', hv.attemptId);
    /* PR-MT (Q-A): chốt vắng xong máy tự dời Writing sang W4 SEP — ô tuần cũ không còn nợ/quá hạn; buổi mới là việc của tuần này. */
    assert(!after.some((d) => (d.skill === 'writing1' || d.skill === 'writing2') && d.overdue), `W1 + W2 cùng "-" đã chốt mà vẫn quá hạn: ${JSON.stringify(after)}`);
    assert(sit(hv.attemptId, 'writing').absence_move_count === 1, 'Máy phải tự dời buổi Writing lần 1');
  });

  const pulse: any = await import('../worklist/branchpulse.ts');     // `check` không nhận hàm async — nạp ở ngoài
  check('§6 · Bảng chi nhánh vẫn dựng được và cột nợ điểm của GV đọc từ scoreDebtCells', () => {
    const r = pulse.branchPulse(P.mbManager, { branchId: mbBranch }) as any;
    assert(r && Array.isArray(r.people), 'branchPulse phải trả danh sách người');
    const src = fsMod.readFileSync(pathMod.join(REPO, 'server/src/worklist/branchpulse.ts'), 'utf8');
    assert(src.includes('scoreDebtCells') && !/s\.band IS NULL/.test(src), 'branchpulse.ts còn đếm nợ điểm bằng band IS NULL');
  });

  // ================================================================== 5. §6 worklist/signals.ts

  console.log('\nPR-S1 · 5. Việc sinh từ dữ liệu: lớp thường không bị đếm "chưa có tuần MT" và "còn thiếu điểm" oan');
  const wsignals: any = await import('../worklist/signals.ts');
  const countOf = (kind: string) =>
    ((wsignals.signalsFor(P.admin, { branchId: mbBranch }) as any[]).find((x) => x.kind === kind)?.count ?? 0) as number;

  check('§6 · Học viên lớp thường không có lượt "planned" KHÔNG bị đếm "chưa có tuần MT" (lớp thường xếp lịch theo lớp)', () => {
    const before = countOf('no_plan');
    const hv = taoHocVien({ classCode: 'MB FOU 12', weekStart: '2026-09-07' });
    conn.prepare(`UPDATE assessment_attempts SET status = 'done' WHERE id = ?`).run(hv.attemptId);
    assert(countOf('no_plan') === before, `Em lớp thường bị đếm vào "chưa có tuần MT": ${before} → ${countOf('no_plan')}`);
  });

  check('§6 · Lượt lớp thường đủ bốn môn (số câu đúng) KHÔNG còn "thiếu điểm"; thiếu một môn thì có', () => {
    const base = countOf('missing_scores');
    const hv = taoHocVien({ classCode: 'MB FOU 12', weekStart: '2026-09-07' });
    assert(countOf('missing_scores') === base + 1, 'Lượt chưa có điểm nào phải được đếm thiếu điểm');
    for (const k of ['listening', 'reading', 'writing', 'speaking']) diem(hv.attemptId, k, 30, 40);
    assert(countOf('missing_scores') === base, `Đủ bốn môn mà vẫn "thiếu điểm": ${base} → ${countOf('missing_scores')}`);
  });

  // ================================================================== 6. S1 (a) tín hiệu từng môn

  console.log('\nPR-S1 · 6. S1 — tín hiệu lớp thường: mỗi môn chưa đạt MỘT tín hiệu, về GV môn đó (không ai dạy thì GVCN)');
  const signals: any = await import('../cases/signals.ts');

  check('S1 · Hai môn chưa đạt → hai tín hiệu riêng, mỗi cái về đúng GV dạy môn đó; không tự tạo Case', () => {
    const hv = taoHocVien({ classCode: 'MB FOU 12', weekStart: '2026-09-07' });
    diem(hv.attemptId, 'listening', 10, 40);
    diem(hv.attemptId, 'speaking', 5, 25);
    const l = tinHieu(hv.attemptId, 'listening'), s = tinHieu(hv.attemptId, 'speaking');
    assert(l && s && l.id !== s.id, 'Phải có hai tín hiệu riêng');
    assert(l.owner_user_id === teacherOf('MB FOU 12', 'listening') && s.owner_user_id === teacherOf('MB FOU 12', 'speaking'),
      `Sai người: L→${l.owner_user_id}, S→${s.owner_user_id}`);
    assert(l.status === 'pending' && s.status === 'pending', 'Lớp thường không tự tạo Case (Q-V3-1)');
    const n = (conn.prepare('SELECT COUNT(*) n FROM sos_cases WHERE student_id = ?').get(hv.sid) as any).n;
    assert(n === 0, `Lớp thường không được tự tạo Case, đang có ${n}`);
  });

  check('S1 · Tín hiệu lớp thường mang đủ dữ liệu cho dòng việc: loại, môn, số câu đúng/tổng, hạn, hai nút cho đúng người', () => {
    const hv = taoHocVien({ classCode: 'MB FOU 12', weekStart: '2026-09-07' });
    diem(hv.attemptId, 'listening', 20, 40);
    const sg = tinHieu(hv.attemptId, 'listening');
    const v = signals.signalDetail(pGvcnFou, sg.id) as any;
    assert(v.kind === 'normal' && v.skill === 'listening' && v.score === 20 && v.total === 40 && v.verifyDue === sg.verify_due,
      `Thiếu dữ liệu: ${JSON.stringify({ kind: v.kind, skill: v.skill, score: v.score, total: v.total, due: v.verifyDue })}`);
    assert(JSON.stringify(v.actions) === JSON.stringify(['create_case', 'dismiss']), `GV môn đó phải có hai nút: ${JSON.stringify(v.actions)}`);
    assert(v.caseDraft && v.caseDraft.topic === 'listening' && v.caseDraft.cycleId === hv.cycleId && v.caseDraft.scoreText === '20/40',
      `Điền sẵn form Case sai: ${JSON.stringify(v.caseDraft)}`);
    const other = signals.signalDetail(pSpeakingFou, sg.id) as any;
    assert(other.actions.length === 0 && other.canResolve === false, 'GV môn khác không được có nút xử lý');
  });

  check('S1 · Không ai dạy môn đó → tín hiệu về GVCN, và GVCN xử lý được tín hiệu đó dù không dạy môn đó (Q1)', () => {
    const cid = classId('MB FOU 12');
    const ids = (conn.prepare(`SELECT id FROM teacher_assignments WHERE class_id = ? AND skill = 'speaking' AND status = 'active'`).all(cid) as any[]).map((r) => r.id);
    conn.prepare(`UPDATE teacher_assignments SET status = 'inactive' WHERE id IN (${ids.join(',')})`).run();
    try {
      const hv = taoHocVien({ classCode: 'MB FOU 12', weekStart: '2026-09-07' });
      diem(hv.attemptId, 'speaking', 5, 25);
      const sg = tinHieu(hv.attemptId, 'speaking');
      const core = (conn.prepare(`SELECT user_id FROM teacher_assignments WHERE class_id = ? AND is_core = 1 AND status = 'active' LIMIT 1`).get(cid) as any).user_id;
      assert(sg.owner_user_id === core, `Phải về GVCN (${core}), đang về ${sg.owner_user_id}`);
      const v = signals.signalDetail(pGvcnFou, sg.id) as any;
      assert(v.canResolve === true && v.actions.includes('create_case'), 'GVCN được giao mà không xử lý được');
    } finally {
      conn.prepare(`UPDATE teacher_assignments SET status = 'active' WHERE id IN (${ids.join(',')})`).run();
    }
  });

  // ================================================================== 7. S1 (b) Bỏ qua

  console.log('\nPR-S1 · 7. S1 — Bỏ qua tín hiệu lớp thường: một bấm, lý do không bắt buộc, có audit');
  const auditN = (action: string, id: number) =>
    (conn.prepare('SELECT COUNT(*) n FROM audit_logs WHERE action = ? AND entity_id = ?').get(action, id) as any).n as number;

  check('S1 · Bỏ qua không lý do: tín hiệu thành "Đã bỏ qua", không có Case, có audit; bấm lần hai không đổi gì', () => {
    const hv = taoHocVien({ classCode: 'MB FOU 12', weekStart: '2026-09-07' });
    diem(hv.attemptId, 'listening', 10, 40);
    const sg = tinHieu(hv.attemptId, 'listening');
    signals.dismissSignal(pGvcnFou, sg.id, {});
    const after = conn.prepare('SELECT * FROM case_signals WHERE id = ?').get(sg.id) as any;
    assert(after.status === 'noted' && after.resolution_note === domain.SIGNAL_DISMISS_NOTE && after.case_id === null && after.resolved_by === pGvcnFou.userId,
      `Sai: ${JSON.stringify(after)}`);
    assert(domain.SIGNAL_STATUS_LABEL.noted === 'Đã bỏ qua', `Nhãn: ${domain.SIGNAL_STATUS_LABEL.noted}`);
    assert(auditN('signal.dismissed', sg.id) === 1, 'Thiếu audit');
    const again = signals.dismissSignal(pGvcnFou, sg.id, {}) as any;
    assert(again.unchanged === true && auditN('signal.dismissed', sg.id) === 1, 'Bấm lần hai không được ghi thêm');
    diem(hv.attemptId, 'listening', 11, 40);                            // lưu lại điểm vẫn trượt
    assert((conn.prepare('SELECT status FROM case_signals WHERE id = ?').get(sg.id) as any).status === 'noted', 'Lưu lại điểm làm sống lại tín hiệu đã bỏ qua');
  });

  check('S1 · Bỏ qua có lý do: lý do được giữ; GV môn khác không bỏ qua được; tín hiệu đã thành Case thì không bỏ qua được', () => {
    const hv = taoHocVien({ classCode: 'MB FOU 12', weekStart: '2026-09-07' });
    diem(hv.attemptId, 'listening', 10, 40);
    diem(hv.attemptId, 'reading', 10, 40);
    const l = tinHieu(hv.attemptId, 'listening'), r = tinHieu(hv.attemptId, 'reading');
    assertThrows(() => signals.dismissSignal(pSpeakingFou, l.id, {}), /giao cho mình|môn mình dạy/, 'GV Speaking bỏ qua tín hiệu Listening');
    signals.dismissSignal(pGvcnFou, l.id, { reason: '  Em ốm hôm thi  ' });
    assert((conn.prepare('SELECT resolution_note FROM case_signals WHERE id = ?').get(l.id) as any).resolution_note === 'Bỏ qua — Em ốm hôm thi',
      'Lý do phải được giữ (đã cắt khoảng trắng)');
    caseTuTinHieu(pGvcnFou, r);
    assertThrows(() => signals.dismissSignal(pGvcnFou, r.id, {}), /đã thành Case/, 'Bỏ qua một tín hiệu đã thành Case');
  });

  check('S1 · Tín hiệu Fast Track không có nút Bỏ qua (FT tự tạo Case — đóng bằng "Không cần theo dõi")', () => {
    const hv = taoHocVien({ classCode: 'MB FT 101', weekStart: '2026-09-07' });
    const sg = signals.raiseSignal({
      actorUserId: P.admin.userId, studentId: hv.sid, cycleId: hv.cycleId, attemptId: hv.attemptId, classId: hv.cid,
      skill: 'reading', category: 'reading', detectedOn: '2026-09-07', silent: true,
    }) as any;
    assertThrows(() => signals.dismissSignal(P.mbManager, sg.id, {}), /Fast Track/, 'Bỏ qua tín hiệu FT');
    assert(!(signals.signalDetail(P.mbManager, sg.id) as any).actions.includes('dismiss'), 'Tín hiệu FT không được có nút Bỏ qua');
  });

  // ================================================================== 8. S1 (c) Tạo Case

  console.log('\nPR-S1 · 8. S1 — Tạo Case từ tín hiệu: đúng môn, đúng khoá, mốc mở mang điểm; Writing lớp thường');

  check('S1 · Tạo Case từ tín hiệu Listening: Case môn Listening của đúng khoá đó, tín hiệu "Đã thành Case", mốc mở ghi 10/40', () => {
    const hv = taoHocVien({ classCode: 'MB FOU 12', weekStart: '2026-09-07' });
    diem(hv.attemptId, 'listening', 10, 40);
    const sg = tinHieu(hv.attemptId, 'listening');
    const c = caseTuTinHieu(pGvcnFou, sg);
    const row = conn.prepare('SELECT category, cycle_id FROM sos_cases WHERE id = ?').get(c.id) as any;
    assert(row.category === 'listening' && row.cycle_id === hv.cycleId, `Case sai môn/khoá: ${JSON.stringify(row)}`);
    const after = conn.prepare('SELECT status, case_id FROM case_signals WHERE id = ?').get(sg.id) as any;
    assert(after.status === 'linked' && after.case_id === c.id, `Tín hiệu chưa gắn: ${JSON.stringify(after)}`);
    const m = conn.prepare(`SELECT note FROM case_milestones WHERE case_id = ? AND kind = 'opened'`).get(c.id) as any;
    assert(m && String(m.note).includes('10/40'), `Mốc mở phải mang điểm: ${m?.note}`);
  });

  check('S1 · Tạo Case sai môn với tín hiệu bị từ chối (tín hiệu Listening không mở Case Reading)', () => {
    const hv = taoHocVien({ classCode: 'MB FOU 12', weekStart: '2026-09-07' });
    diem(hv.attemptId, 'listening', 10, 40);
    assertThrows(() => caseTuTinHieu(pGvcnFou, tinHieu(hv.attemptId, 'listening'), 'reading'), /đúng môn/, 'Case Reading từ tín hiệu Listening');
  });

  check('S1 · Tín hiệu Writing lớp thường tạo được Case Writing (một môn W); học viên FT không có Case "writing"', () => {
    const hv = taoHocVien({ classCode: 'MB FOU 12', weekStart: '2026-09-07' });
    diem(hv.attemptId, 'writing', 5, 20);
    const sg = tinHieu(hv.attemptId, 'writing');
    assert(sg.owner_user_id === pWritingFou.userId, 'Tín hiệu Writing phải về GV Writing');
    const c = caseTuTinHieu(pWritingFou, sg);
    assert((conn.prepare('SELECT category FROM sos_cases WHERE id = ?').get(c.id) as any).category === 'writing', 'Case phải là môn W');
    const ft = taoHocVien({ classCode: 'MB FT 101', weekStart: '2026-09-07' });
    assertThrows(() => cases.reportIssue(P.mbManager, {
      studentId: ft.sid, topic: 'writing', title: 'Writing chung của FT', summary: 'FT phải tách W1 và W2, không có Writing chung.',
      primaryCode: domain.issuesForTopic('writing')[0].code,
    }), /Chủ đề không hợp lệ/, 'Học viên FT tạo Case Writing chung');
  });

  check('S1 · Tạo Case từ tín hiệu mà gửi kèm khoá KHÁC khoá của tín hiệu → từ chối (Case phải nằm đúng khoá của tín hiệu)', () => {
    const hv = taoHocVien({ classCode: 'MB FOU 12', weekStart: '2026-09-07' });
    diem(hv.attemptId, 'listening', 10, 40);
    const sg = tinHieu(hv.attemptId, 'listening');
    const other = Number(conn.prepare(`INSERT INTO learning_cycles (student_id, seq, route, programme_code, started_at, status, created_at)
      VALUES (?, 2, NULL, 'FOU', ?, 'completed', ?)`).run(hv.sid, '2026-05-04', NOW).lastInsertRowid);
    assertThrows(() => cases.reportIssue(pGvcnFou, {
      studentId: hv.sid, cycleId: other, topic: 'listening', fromSignalId: sg.id,
      title: 'Case gửi sai khoá (PR-S1)', summary: 'Đã xem lại bài, em vướng đúng phần này của môn.',
      primaryCode: domain.issuesForTopic('listening')[0].code,
    }), /đúng khoá/, 'Case từ tín hiệu mà nằm ở khoá khác');
    assert((conn.prepare('SELECT status FROM case_signals WHERE id = ?').get(sg.id) as any).status === 'pending', 'Tín hiệu phải còn chờ');
    const ok = cases.reportIssue(pGvcnFou, {
      studentId: hv.sid, cycleId: hv.cycleId, topic: 'listening', fromSignalId: sg.id,
      title: 'Case gửi đúng khoá (PR-S1)', summary: 'Đã xem lại bài, em vướng đúng phần này của môn.',
      primaryCode: domain.issuesForTopic('listening')[0].code,
    }) as any;
    assert((conn.prepare('SELECT cycle_id FROM sos_cases WHERE id = ?').get(ok.id) as any).cycle_id === hv.cycleId, 'Gửi đúng khoá thì vẫn tạo được');
  });

  check('S1 · Tín hiệu đã Bỏ qua không mở Case được nữa', () => {
    const hv = taoHocVien({ classCode: 'MB FOU 12', weekStart: '2026-09-07' });
    diem(hv.attemptId, 'reading', 10, 40);
    const sg = tinHieu(hv.attemptId, 'reading');
    signals.dismissSignal(pGvcnFou, sg.id, {});
    assertThrows(() => caseTuTinHieu(pGvcnFou, sg), /đã được xử lý/, 'Mở Case từ tín hiệu đã bỏ qua');
  });

  // ================================================================== 9. S1 (d) dòng việc + chỉ số

  console.log('\nPR-S1 · 9. S1 — dòng việc tín hiệu có đủ dữ liệu; ô "Chờ xác minh quá hạn" = tín hiệu lớp thường quá 3 ngày');
  const mywork: any = await import('../worklist/mywork.ts');
  const metricsSvc: any = await import('../worklist/metrics.ts');

  check('S1 · Việc cần làm của GV môn đó có MỘT dòng cho mỗi tín hiệu, kèm loại, môn, điểm, hạn, hai nút; GV khác không thấy', () => {
    const hv = taoHocVien({ classCode: 'MB FOU 12', weekStart: '2026-09-07' });
    diem(hv.attemptId, 'listening', 12, 40);
    diem(hv.attemptId, 'speaking', 6, 25);
    const l = tinHieu(hv.attemptId, 'listening'), s = tinHieu(hv.attemptId, 'speaking');
    const mine = (mywork.myWork(pGvcnFou) as any).items.find((i: any) => i.key === `verify:${l.id}`);
    assert(mine && mine.signal, 'Thiếu dòng tín hiệu Listening ở Việc cần làm của GV Listening');
    assert(mine.signal.kind === 'normal' && mine.signal.skill === 'listening' && mine.signal.score === 12 && mine.signal.total === 40
      && mine.signal.deadline === l.verify_due && JSON.stringify(mine.signal.actions) === JSON.stringify(['create_case', 'dismiss']),
      `Dữ liệu dòng: ${JSON.stringify(mine.signal)}`);
    assert(/chưa đạt/.test(mine.reason) && !/kỳ vọng/.test(mine.reason) && mine.actionLabel === 'Tạo Case', `Chữ dòng: ${mine.reason} · ${mine.actionLabel}`);
    assert(!(mywork.myWork(pGvcnFou) as any).items.some((i: any) => i.key === `verify:${s.id}`), 'GV Listening thấy tín hiệu Speaking');
    assert((mywork.myWork(pSpeakingFou) as any).items.some((i: any) => i.key === `verify:${s.id}`), 'GV Speaking không thấy tín hiệu của mình');
  });

  check('S1 · Chỉ số tin-hieu-qua-han: tín hiệu lớp thường chờ quá 3 ngày có; chưa quá hạn thì không; đã bỏ qua thì không', () => {
    const hv = taoHocVien({ classCode: 'MB FOU 12', weekStart: '2026-09-07' });
    diem(hv.attemptId, 'listening', 10, 40);
    diem(hv.attemptId, 'reading', 10, 40);
    diem(hv.attemptId, 'speaking', 5, 25);
    const oldL = tinHieu(hv.attemptId, 'listening'), fresh = tinHieu(hv.attemptId, 'reading'), gone = tinHieu(hv.attemptId, 'speaking');
    conn.prepare(`UPDATE case_signals SET raised_on = '2026-09-09', verify_due = '2026-09-11' WHERE id IN (?, ?)`).run(oldL.id, gone.id);
    signals.dismissSignal(pSpeakingFou, gone.id, {});
    const ids = (metricsSvc.metricSet(P.admin, 'tin-hieu-qua-han', {}) as any).ids as number[];
    assert(ids.includes(oldL.id), 'Tín hiệu quá hạn phải có trong ô');
    assert(!ids.includes(fresh.id), 'Tín hiệu còn trong hạn không được đếm');
    assert(!ids.includes(gone.id), 'Tín hiệu đã bỏ qua không được đếm');
    assert(domain.metricById('tin-hieu-qua-han')?.ten === 'Chờ xác minh quá hạn', 'Tên chỉ số phải đúng chữ ô Tổng quan (§3.2)');
  });

  // ================================================================== 10. RB-8

  console.log('\nPR-S1 · 10. RB-8 — sửa điểm nhập nhầm ở lớp thường: rút tín hiệu, rút Case không còn căn cứ, giữ Case có việc thật');

  check('RB-8 · Lớp thường: sửa 10/40 thành 30/40 → tín hiệu đang chờ bị thu hồi "Không còn hợp lệ do sửa điểm"', () => {
    const hv = taoHocVien({ classCode: 'MB FOU 12', weekStart: '2026-09-07' });
    diem(hv.attemptId, 'listening', 10, 40);
    diem(hv.attemptId, 'listening', 30, 40);
    const sg = tinHieu(hv.attemptId, 'listening');
    assert(sg.status === 'withdrawn' && sg.withdrawn_reason === domain.SIGNAL_WITHDRAW_SCORE_FIXED, `Tín hiệu: ${JSON.stringify(sg)}`);
  });

  check('RB-8 · Lớp thường: Case mở từ tín hiệu, chưa có việc gì → sửa điểm thành đạt thì Case được rút (đóng, có lý do), lịch sử giữ', () => {
    const hv = taoHocVien({ classCode: 'MB FOU 12', weekStart: '2026-09-07' });
    diem(hv.attemptId, 'listening', 10, 40);
    const c = caseTuTinHieu(pGvcnFou, tinHieu(hv.attemptId, 'listening'));
    diem(hv.attemptId, 'listening', 30, 40);
    const row = conn.prepare('SELECT status, outcome, outcome_note FROM sos_cases WHERE id = ?').get(c.id) as any;
    assert(row.status === 'done' && row.outcome === null && String(row.outcome_note).includes(domain.SIGNAL_WITHDRAW_SCORE_FIXED)
      && /thành đạt\./.test(String(row.outcome_note)) && !/kỳ vọng/.test(String(row.outcome_note)),
      `Case phải rút với chữ lớp thường: ${JSON.stringify(row)}`);
  });

  check('RB-8 · Lớp thường: Case đã có phương án đang chạy → sửa điểm KHÔNG đóng Case, chỉ nhắc người phụ trách xem lại', () => {
    const hv = taoHocVien({ classCode: 'MB FOU 12', weekStart: '2026-09-07' });
    diem(hv.attemptId, 'listening', 10, 40);
    const c = caseTuTinHieu(pGvcnFou, tinHieu(hv.attemptId, 'listening'));
    cases.recordIntervention(pGvcnFou, c.id, {
      kind: 'self_study', description: 'Nghe 30 phút mỗi ngày (PR-S1)', performerName: 'GVBM', status: 'started', startedDate: TODAY,
    });
    diem(hv.attemptId, 'listening', 30, 40);
    const row = conn.prepare('SELECT status, owner_user_id FROM sos_cases WHERE id = ?').get(c.id) as any;
    assert(row.status !== 'done', 'Case có việc thật không được tự đóng vì sửa điểm');
    const n = (conn.prepare('SELECT COUNT(*) n FROM notifications WHERE dedup_key = ?').get(`case_review:${c.id}:${hv.attemptId}`) as any).n;
    assert(n === 1, 'Người phụ trách phải được nhắc xem lại đúng một lần');
  });

  check('RB-8 · Không đóng Case vô cớ: Giữa khoá trượt → Case có việc; Cuối khoá đạt cả bốn môn → Case vẫn mở, hạ mức về 0, có mốc "đã đạt"', () => {
    const hv = taoHocVien({ classCode: 'MB FOU 12', weekStart: '2026-08-24' });
    diem(hv.attemptId, 'listening', 10, 40);
    const c = caseTuTinHieu(pGvcnFou, tinHieu(hv.attemptId, 'listening'));
    cases.recordIntervention(pGvcnFou, c.id, {
      kind: 'self_study', description: 'Nghe chép chính tả (PR-S1)', performerName: 'GVBM', status: 'started', startedDate: TODAY,
    });
    const fin = themLuot({ sid: hv.sid, cid: hv.cid, cycleId: hv.cycleId, weekStart: '2026-09-07', kind: 'final', no: 2 });
    for (const k of ['listening', 'reading', 'writing', 'speaking']) diem(fin, k, 35, 40);
    const row = conn.prepare('SELECT status, sos_level FROM sos_cases WHERE id = ?').get(c.id) as any;
    assert(row.status !== 'done' && row.sos_level === 0, `Case phải còn mở, mức 0: ${JSON.stringify(row)}`);
    const passed = (conn.prepare(`SELECT COUNT(*) n FROM case_milestones WHERE case_id = ? AND kind = 'passed' AND attempt_id = ?`).get(c.id, fin) as any).n;
    assert(passed === 1, 'Thiếu mốc "đã đạt" của Cuối khoá');
  });

  // ================================================================== 11. RB-6

  console.log('\nPR-S1 · 11. RB-6 — GVCN chỉ hoàn thành Case đúng môn mình dạy; Quản lý hoàn thành mọi Case trong phạm vi');

  check('RB-6 · GVCN MB FT 101 (dạy L, R): hoàn thành được Case Listening, KHÔNG được Case Speaking; Quản lý được cả hai; GVBM Speaking không (luật cũ giữ)', () => {
    const hv = taoHocVien({ classCode: 'MB FT 101', weekStart: '2026-09-07' });
    const mk = (topic: string) => cases.reportIssue(P.mbManager, {
      studentId: hv.sid, topic, title: `Case ${topic} (RB-6)`, summary: 'Case dựng riêng cho phép kiểm quyền hoàn thành Case.',
      primaryCode: domain.issuesForTopic(topic)[0].code, parallel: true,
    }) as any;
    const sp = mk('speaking'), li = mk('listening');
    const ctx = (topic: string) => ({ class_id: hv.cid, student_id: hv.sid, topic });
    assert(cases.canCloseCase(P.coreTeacher, ctx('listening')) === true, 'GVCN phải hoàn thành được Case môn mình dạy');
    assert(cases.canCloseCase(P.coreTeacher, ctx('speaking')) === false, 'GVCN hoàn thành được Case môn khác (4.15)');
    assert(cases.canCloseCase(P.mbManager, ctx('speaking')) === true, 'Quản lý phải hoàn thành được');
    assert(cases.canCloseCase(P.sTeacher, ctx('speaking')) === false, 'GVBM không kiêm GVCN vẫn không hoàn thành Case (luật cũ)');
    assertThrows(() => cases.closeCaseOutcome(P.coreTeacher, sp.id, { outcome: 'improved', note: 'Em đã tiến bộ rõ ở phần nói.' }),
      /Quản lý|GVCN/, 'GVCN hoàn thành Case Speaking qua đường chốt kết quả');
    const card = (cases.skillSupportBoard(P.coreTeacher, hv.sid) as any).rows.flatMap((r: any) => r.cases);
    assert(card.find((x: any) => x.id === sp.id)?.canClose === false && card.find((x: any) => x.id === li.id)?.canClose === true,
      'Thẻ Case phải nói đúng quyền theo môn');
  });

  // ================================================================== 12. S16 · S17

  console.log('\nPR-S1 · 12. S16 kết thúc khoá · S17 đổi chương trình — hệ thống tự đóng Case, có audit, xem lại được, PA đã xong vẫn tính hiệu quả');
  const systemClose = await load('../cases/systemClose.ts');
  const cycles: any = await import('../fasttrack/cycles.ts');
  const students: any = await import('../students/students.ts');
  const effectiveness: any = await import('../cases/effectiveness.ts');
  /** Case lớp thường có một PA đã xong (kết quả "Tiến bộ rõ") và một PA chưa làm. */
  const caseCoViec = (hv: HocVien) => {
    diem(hv.attemptId, 'listening', 10, 40);
    const c = caseTuTinHieu(pGvcnFou, tinHieu(hv.attemptId, 'listening'));
    const done = Number(conn.prepare(`INSERT INTO case_interventions (case_id, kind, description, status, completed_date, created_at)
      VALUES (?, 'self_study', 'Tự học nghe (PR-S1)', 'completed', ?, ?)`).run(c.id, TODAY, NOW).lastInsertRowid);
    conn.prepare(`INSERT INTO case_followups (case_id, intervention_id, observed_on, outcome, note, created_at) VALUES (?,?,?, 'improved', 'Tiến bộ rõ', ?)`)
      .run(c.id, done, TODAY, NOW);
    const open = Number(conn.prepare(`INSERT INTO case_interventions (case_id, kind, description, status, created_at)
      VALUES (?, 'tutor', 'Tutor nghe (PR-S1)', 'planned', ?)`).run(c.id, NOW).lastInsertRowid);
    return { caseId: c.id as number, done, open };
  };
  const auditSys = (caseId: number) => auditN('case.system_close', caseId);

  check('S16 · Hoàn tất lộ trình KHÔNG kèm cờ dongCaseKhiKetThuc (đường "Lên lớp thường tiếp" của PR-LT) → Case vẫn MỞ, đi theo em', () => {
    const hv = taoHocVien({ classCode: 'MB FOU 12', weekStart: '2026-09-07' });
    const x = caseCoViec(hv);
    cycles.updateCycle(P.mbManager, hv.cycleId, { status: 'completed' });
    const c = conn.prepare('SELECT status, system_close_reason AS r FROM sos_cases WHERE id = ?').get(x.caseId) as any;
    assert(c.status !== 'done' && c.r === null, `Hoàn tất lộ trình không cờ đã đóng Case: ${JSON.stringify(c)}`);
    assert(auditSys(x.caseId) === 0, 'Không được có audit đóng bởi hệ thống');
  });

  check('S16 · Kết thúc học (cờ dongCaseKhiKetThuc) còn Case mở → Case đóng "Học viên kết thúc khoá": không có kết quả, PA chưa làm huỷ và KHÔNG tính, PA đã xong giữ và VẪN tính hiệu quả, audit + mốc + hành trình, tín hiệu chờ thu hồi', () => {
    const hv = taoHocVien({ classCode: 'MB FOU 12', weekStart: '2026-09-07' });
    const x = caseCoViec(hv);
    diem(hv.attemptId, 'reading', 10, 40);                              // tín hiệu Reading còn chờ
    assert(effectiveness.planOutcomes({ studentIds: [hv.sid] }).some((r: any) => r.id === x.done), 'Tiền đề: PA đã xong phải vào thống kê trước');
    cycles.updateCycle(P.mbManager, hv.cycleId, { status: 'completed', dongCaseKhiKetThuc: true });
    const c = conn.prepare('SELECT * FROM sos_cases WHERE id = ?').get(x.caseId) as any;
    assert(c.status === 'done' && c.system_close_reason === 'course_ended' && c.outcome === null && c.closed_at,
      `Case: ${JSON.stringify({ status: c.status, reason: c.system_close_reason, outcome: c.outcome, closedAt: c.closed_at })}`);
    assert(String(c.outcome_note).includes('Học viên kết thúc khoá'), `Ghi chú: ${c.outcome_note}`);
    const iv = (id: number) => conn.prepare('SELECT status, closed_reason FROM case_interventions WHERE id = ?').get(id) as any;
    assert(iv(x.open).status === 'cancelled' && iv(x.open).closed_reason === 'system_closed', `PA chưa làm: ${JSON.stringify(iv(x.open))}`);
    assert(iv(x.done).status === 'completed', 'PA đã xong không được đụng');
    /* Q7 (planning review 22/09): PA đã xong có kết quả thật VẪN tính; chỉ việc đóng và PA bị huỷ vì việc đóng thì không. */
    const plans = effectiveness.planOutcomes({ studentIds: [hv.sid] }) as any[];
    assert(plans.some((r) => r.id === x.done), 'PA đã xong có kết quả thật phải VẪN nằm trong thống kê hiệu quả');
    assert(!plans.some((r) => r.id === x.open), 'PA bị huỷ vì hệ thống đóng Case không được tính');
    assert(auditSys(x.caseId) === 1, 'Thiếu audit case.system_close');
    assert((conn.prepare(`SELECT COUNT(*) n FROM case_milestones WHERE case_id = ? AND kind = 'closed'`).get(x.caseId) as any).n === 1, 'Thiếu mốc đóng');
    assert((conn.prepare(`SELECT COUNT(*) n FROM journey_events WHERE ref_table = 'sos_cases' AND ref_id = ? AND event_type = 'case_closed'`).get(x.caseId) as any).n === 1, 'Thiếu mốc hành trình');
    const r = tinHieu(hv.attemptId, 'reading');
    assert(r.status === 'withdrawn' && r.withdrawn_reason === 'Học viên kết thúc khoá', `Tín hiệu chờ: ${JSON.stringify(r)}`);
    const d = cases.caseDetail(P.mbManager, x.caseId) as any;
    assert(d.status === 'done' && d.systemCloseReason === 'course_ended', 'Case đóng bởi hệ thống vẫn phải mở xem lại được, nói rõ lý do');
    const again = systemClose.closeCasesBySystem({ actorUserId: P.admin.userId, studentId: hv.sid, reason: 'course_ended', on: TODAY, cycleIds: [hv.cycleId] });
    assert(again.closedCaseIds.length === 0 && auditSys(x.caseId) === 1, 'Chạy lại không được đóng/ghi thêm');
  });

  check('S16 · Học viên chuyển "Đã kết thúc" → Case mở đóng "Học viên kết thúc khoá"; "Tạm dừng" thì KHÔNG đóng', () => {
    const a = taoHocVien({ classCode: 'MB FOU 12', weekStart: '2026-09-07' });
    const b = taoHocVien({ classCode: 'MB FOU 12', weekStart: '2026-09-07' });
    const xa = caseCoViec(a), xb = caseCoViec(b);
    students.setStudentStatus(P.mbManager, a.sid, 'finished', TODAY, 'Nghỉ học');
    students.setStudentStatus(P.mbManager, b.sid, 'inactive', TODAY, 'Tạm nghỉ ốm');
    const st = (id: number) => conn.prepare('SELECT status, system_close_reason AS r FROM sos_cases WHERE id = ?').get(id) as any;
    assert(st(xa.caseId).status === 'done' && st(xa.caseId).r === 'course_ended', `Kết thúc: ${JSON.stringify(st(xa.caseId))}`);
    assert(st(xb.caseId).status !== 'done', 'Tạm dừng không được đóng Case');
  });

  check('S16 · FT "Kết luận lộ trình": kèm cờ dongCaseKhiKetThuc (em thôi học) → đóng Case; không cờ (học tiếp) → Case giữ', () => {
    const mk = () => {
      const hv = taoHocVien({ classCode: 'MB FT 101', weekStart: '2026-09-07' });
      const c = cases.reportIssue(P.mbManager, {
        studentId: hv.sid, cycleId: hv.cycleId, topic: 'reading', title: 'Reading (S16 FT)', summary: 'Case FT dựng cho phép kiểm kết luận lộ trình.',
        primaryCode: domain.issuesForTopic('reading')[0].code, parallel: true,
      }) as any;
      return { hv, caseId: c.id as number };
    };
    const st = (id: number) => conn.prepare('SELECT status, system_close_reason AS r FROM sos_cases WHERE id = ?').get(id) as any;
    const keep = mk();
    cycles.setOutcome(P.mbManager, keep.hv.cycleId, { outcome: 'reached', score: 6.5, note: 'Đạt mục tiêu, học tiếp LT2' });
    assert(st(keep.caseId).status !== 'done', 'Kết luận lộ trình không cờ đã đóng Case');
    const end = mk();
    cycles.setOutcome(P.mbManager, end.hv.cycleId, { outcome: 'reached', score: 6.5, note: 'Đạt mục tiêu, thôi học', dongCaseKhiKetThuc: true });
    assert(st(end.caseId).status === 'done' && st(end.caseId).r === 'course_ended', `Kết luận + thôi học: ${JSON.stringify(st(end.caseId))}`);
  });

  check('S17 · Đổi chương trình: sang lớp thường đóng Case FT "Chuyển sang lớp thường"; sang FT đóng Case lớp thường "Chuyển sang Fast Track"; Case chương trình kia giữ', () => {
    const hv = taoHocVien({ classCode: 'MB FT 101', weekStart: '2026-09-07' });
    const ftCase = cases.reportIssue(P.mbManager, {
      studentId: hv.sid, cycleId: hv.cycleId, topic: 'writing1', title: 'Writing Task 1 (S17)', summary: 'Case FT dựng cho phép kiểm đổi chương trình.',
      primaryCode: domain.issuesForTopic('writing1')[0].code, parallel: true,
    }) as any;
    const normalCycle = Number(conn.prepare(`INSERT INTO learning_cycles (student_id, seq, route, programme_code, started_at, status, created_at)
      VALUES (?, 2, NULL, 'FOU', ?, 'active', ?)`).run(hv.sid, TODAY, NOW).lastInsertRowid);
    const nCase = cases.reportIssue(P.mbManager, {
      studentId: hv.sid, cycleId: normalCycle, topic: 'writing', title: 'Writing lớp thường (S17)', summary: 'Case lớp thường dựng cho phép kiểm đổi chương trình.',
      primaryCode: domain.issuesForTopic('writing', 'FOU')[0].code, parallel: true,   // PR-MON: FOU W = G+V
    }) as any;
    assert(systemClose.programmeOfCase(conn.prepare('SELECT * FROM sos_cases WHERE id = ?').get(ftCase.id)) === 'band', 'Case W1 phải là FT');
    const r1 = systemClose.closeCasesOnProgrammeSwitch(P.mbManager.userId, hv.sid, 'normal', TODAY);
    const st = (id: number) => conn.prepare('SELECT status, system_close_reason AS r FROM sos_cases WHERE id = ?').get(id) as any;
    assert(r1.closedCaseIds.includes(ftCase.id) && st(ftCase.id).r === 'moved_to_normal', `FT → lớp thường: ${JSON.stringify(st(ftCase.id))}`);
    assert(st(nCase.id).status !== 'done', 'Case lớp thường không được đóng khi em SANG lớp thường');
    assert(domain.SYSTEM_CLOSE_REASON_LABEL.moved_to_normal === 'Chuyển sang lớp thường', 'Không viết "Normal" trên màn (đặc tả §2)');
    systemClose.closeCasesOnProgrammeSwitch(P.mbManager.userId, hv.sid, 'ft', TODAY);
    assert(st(nCase.id).status === 'done' && st(nCase.id).r === 'moved_to_ft', `Lớp thường → FT: ${JSON.stringify(st(nCase.id))}`);
  });

  // ================================================================== 13. Bộ demo

  console.log('\nPR-S1 · 13. Bộ demo theo luật mới');

  check('S16 · Bộ demo: em đã kết thúc học (Vũ Thu Uyên) không còn Case mở — Case của em đóng "Học viên kết thúc khoá"', () => {
    const rows = conn.prepare(
      `SELECT sc.id, sc.status, sc.system_close_reason AS r FROM sos_cases sc
         LEFT JOIN assessment_attempts a ON a.id = sc.attempt_id
         JOIN students s ON s.id = COALESCE(sc.student_id, a.student_id)
        WHERE s.status = 'finished' AND sc.id <= ?`,
    ).all(t.seedMax.sos_cases) as any[];
    assert(rows.length > 0, 'Bộ demo phải có em đã kết thúc học từng có Case');
    assert(rows.every((x) => x.status === 'done'), `Còn Case mở của em đã kết thúc: ${JSON.stringify(rows.filter((x) => x.status !== 'done'))}`);
    assert(rows.some((x) => x.r === 'course_ended'), 'Phải có Case đóng bởi hệ thống "Học viên kết thúc khoá"');
  });

  check('§6 · Bộ demo ghi ngưỡng lớp thường 70% (không còn 60%)', () => {
    const src = fsMod.readFileSync(pathMod.join(REPO, 'server/src/seed/students.ts'), 'utf8');
    assert(!/60\s*%/.test(src), 'seed/students.ts còn ghi 60%');
    assert(/≥ 70%/.test(src), 'Thiếu dòng ngưỡng "≥ 70%" ở đầu file');
  });

  // ================================================================== 14. RB-3

  console.log('\nPR-S1 · 14. RB-3 — chuyển lớp: lý do bắt buộc (chọn nhanh), lưu ý bàn giao bắt buộc hoặc "Không có lưu ý"');
  const studentsSvc: any = await import('../students/students.ts');
  const targetClass = classId('MB FT 102');

  check('RB-3 · transferReasonText: bốn lựa chọn đúng chữ; "Khác" phải ghi rõ; mã lạ bị từ chối', () => {
    assert(domain.transferReasonText('doi_lich_hoc') === 'Đổi lịch học', domain.transferReasonText('doi_lich_hoc'));
    assert(domain.transferReasonText('xep_lai_trinh_do', 'Lên lớp cao hơn') === 'Xếp lại trình độ — Lên lớp cao hơn', 'Kèm ghi chú');
    assert(domain.transferReasonText('khac') === null && domain.transferReasonText('khac', '  ') === null, '"Khác" không ghi gì phải bị từ chối');
    assert(domain.transferReasonText('khac', 'Gia đình chuyển nhà') === 'Khác — Gia đình chuyển nhà', 'Khác có ghi chú');
    assert(domain.transferReasonText('bua') === null && domain.transferReasonText(undefined) === null, 'Mã lạ');
    assert(domain.NO_HANDOVER_NOTE === 'Không có lưu ý', 'Chữ lựa chọn');
  });

  check('RB-3 · Không lý do → từ chối; không lưu ý và không chọn "Không có lưu ý" → từ chối; chọn "Không có lưu ý" → chuyển được, hành trình ghi rõ', () => {
    const hv = taoHocVien({ classCode: 'MB FOU 12', weekStart: '2026-09-07' });
    assertThrows(() => studentsSvc.transferStudent(P.mbManager, hv.sid, targetClass, TODAY, '  '), /lý do/, 'Chuyển lớp không lý do');
    assertThrows(() => studentsSvc.transferStudent(P.mbManager, hv.sid, targetClass, TODAY, 'Đổi lịch học', {}),
      /Không có lưu ý/, 'Chuyển lớp không lưu ý bàn giao');
    /* PR-LT, Q7: targetClass là lớp Fast Track — chuyển thật từ lớp thường bắt buộc Mục tiêu band. */
    studentsSvc.transferStudent(P.mbManager, hv.sid, targetClass, TODAY, 'Đổi lịch học', { noNote: true, mucTieu: 6.5 });
    const j = conn.prepare(`SELECT detail FROM journey_events WHERE student_id = ? AND event_type = 'transfer' ORDER BY id DESC LIMIT 1`).get(hv.sid) as any;
    assert(j && String(j.detail).includes('Đổi lịch học') && String(j.detail).includes('Không có lưu ý'), `Hành trình: ${j?.detail}`);
  });

  check('RB-3 · Em còn Case mở thì KHÔNG được chọn "Không có lưu ý" — phải ghi bàn giao (Q10)', () => {
    const hv = taoHocVien({ classCode: 'MB FOU 12', weekStart: '2026-09-07' });
    diem(hv.attemptId, 'listening', 10, 40);
    caseTuTinHieu(pGvcnFou, tinHieu(hv.attemptId, 'listening'));
    assertThrows(() => studentsSvc.transferStudent(P.mbManager, hv.sid, targetClass, TODAY, 'Đổi lịch học', { noNote: true }),
      /bàn giao/, 'Còn Case mở mà chọn "Không có lưu ý"');
  });

  // ================================================================== 15. RB-9

  console.log('\nPR-S1 · 15. RB-9 — lưu trữ học viên chỉ khi Quản lý bấm, không có tác vụ ngầm');

  check('RB-9 · Không còn hàm tự lưu trữ sau N ngày; Quản lý lưu trữ / bỏ lưu trữ được em đã kết thúc, có audit; GV không được; em đang học không lưu trữ được', () => {
    assert(!('archiveDueStudents' in studentsSvc) && domain.ARCHIVE_AFTER_DAYS === undefined, 'Còn đường tự lưu trữ sau N ngày');
    const hv = taoHocVien({ classCode: 'MB FOU 12', weekStart: '2026-09-07' });
    assertThrows(() => studentsSvc.archiveStudent(P.mbManager, hv.sid), /đã kết thúc/, 'Lưu trữ em đang học');
    studentsSvc.setStudentStatus(P.mbManager, hv.sid, 'finished', TODAY, 'Kết thúc');
    /* PR-XOA §2: Kết thúc học đã tự lưu trữ — bỏ lưu trữ trước để thử lại đúng nút Lưu trữ của Quản lý. */
    studentsSvc.unarchiveStudent(P.mbManager, hv.sid);
    assertThrows(() => studentsSvc.archiveStudent(pGvcnFou, hv.sid), /Quản lý/, 'GVCN lưu trữ học viên');
    studentsSvc.archiveStudent(P.mbManager, hv.sid);
    const s = conn.prepare('SELECT status, archived_at FROM students WHERE id = ?').get(hv.sid) as any;
    assert(s.archived_at && s.status === 'finished', `Lưu trữ phải chỉ ẩn, không đổi trạng thái: ${JSON.stringify(s)}`);
    assert(auditN('student.archive', hv.sid) === 1, 'Thiếu audit lưu trữ');
    studentsSvc.unarchiveStudent(P.mbManager, hv.sid);
    assert((conn.prepare('SELECT archived_at FROM students WHERE id = ?').get(hv.sid) as any).archived_at === null, 'Bỏ lưu trữ không có tác dụng');
  });

  // ================================================================== 16. §6 chữ lớp thường

  console.log('\nPR-S1 · 16. §6 — chữ lớp thường ở máy chủ: "Giữa khoá / Cuối khoá", "môn", "3/4 môn đạt"; FT giữ nguyên');
  const standing: any = await import('../students/standing.ts');

  check('§6 · caseHeadline lớp thường không ghi "MT{n}" và "kỳ vọng"; FT giữ nguyên', () => {
    const h = (x: any) => domain.caseHeadline({ originKind: 'mock', ...x });
    assert(h({ sosLevel: 2, attemptNo: 1, attemptKind: 'progress' }) === 'Giữa khoá: 2 môn chưa đạt', h({ sosLevel: 2, attemptNo: 1, attemptKind: 'progress' }));
    assert(h({ sosLevel: 0, attemptNo: 2, attemptKind: 'final' }) === 'Cuối khoá: đạt tất cả các môn', h({ sosLevel: 0, attemptNo: 2, attemptKind: 'final' }));
    assert(h({ sosLevel: 3, attemptNo: 2, attemptKind: 'final' }) === 'Cuối khoá: từ 3 môn chưa đạt', 'SOS 3 = từ 3 môn');
    assert(h({ sosLevel: 1, attemptNo: 2, attemptKind: 'mock' }) === 'MT2: 1 kỹ năng dưới kỳ vọng', 'FT phải giữ nguyên');
    assert(h({ sosLevel: 1, attemptNo: 2 }) === 'MT2: 1 kỹ năng dưới kỳ vọng', 'Không truyền attemptKind thì như FT (tương thích)');
  });

  check('§6 · standingLine lớp thường: "Đạt n/4 môn", "khoá này", "môn"; FT giữ "đạt kỳ vọng", "lộ trình này"', () => {
    const base = {
      studentId: 1, cycleId: 1, mode: 'ratio', attemptId: 5, attemptNo: 1, attemptKind: 'progress', attemptLabel: 'Giữa khoá',
      periodCode: null, sosLevel: 0, provisional: false, scored: 4, required: 4, failed: 0,
      nextAttemptNo: null, nextAttemptLabel: null, nextPeriodCode: null, openCases: 0, handoverCases: 0,
    };
    const line = (x: any) => standing.standingLine({ ...base, ...x });
    assert(line({}) === 'Giữa khoá: 4/4 môn đạt', line({}));
    assert(line({ sosLevel: 1, failed: 1 }) === 'Giữa khoá: 3/4 môn đạt · SOS 1', line({ sosLevel: 1, failed: 1 }));
    assert(line({ sosLevel: 2, failed: 2, provisional: true, scored: 3 }) === 'Giữa khoá: 1/4 môn đạt · SOS 2 tạm thời · mới có điểm 3/4 môn',
      line({ sosLevel: 2, failed: 2, provisional: true, scored: 3 }));
    assert(line({ attemptId: null, sosLevel: null, scored: 0 }) === 'Chưa có kết quả trong khoá này', line({ attemptId: null, sosLevel: null, scored: 0 }));
    const ft = { mode: 'ielts_band', attemptLabel: 'MT2', failed: null };
    assert(line({ ...ft }) === 'MT2 đạt kỳ vọng', line({ ...ft }));
    assert(line({ ...ft, attemptId: null, sosLevel: null }) === 'Chưa có kết quả trong lộ trình này', 'FT giữ "lộ trình này"');
  });

  // ================================================================== 17. S15

  console.log('\nPR-S1 · 17. S15 — trường workScope máy chủ trả về');
  const classesSvc: any = await import('../classes/classes.ts');

  check('S15 · listClassSummaries: GV có phân công → "mine"; Quản lý → "managed"; truyền phạm vi thì theo phạm vi truyền', () => {
    const gv = (classesSvc.listClassSummaries(P.lrTeacher) as any).rows as any[];
    assert(gv.length > 0 && gv.every((r) => r.workScope === 'mine'), `GV: ${JSON.stringify(gv.map((r) => r.workScope))}`);
    const ql = (classesSvc.listClassSummaries(P.mbManager) as any).rows as any[];
    assert(ql.length > 0 && ql.every((r) => r.workScope === 'managed'), `Quản lý: ${JSON.stringify(ql.map((r) => r.workScope))}`);
    const ep = (classesSvc.listClassSummaries(P.lrTeacher, { scope: 'managed' }) as any).rows as any[];
    assert(ep.every((r) => r.workScope === 'managed'), 'Truyền phạm vi "managed" mà máy chủ vẫn trả "mine"');
  });

  // ---- các task sau thêm phép kiểm NGAY TRÊN dòng này ----
}
