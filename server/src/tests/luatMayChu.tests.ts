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
  /** Mô-đun chưa có thì phép kiểm ĐỎ với câu nói rõ thiếu gì, không làm sập cả bộ. */
  const load = async (p: string): Promise<any> => import(p).catch((e) =>
    new Proxy({}, { get: (_x, k) => { throw new Error(`Chưa có mô-đun ${p} (${String(k)}) — ${e.message}`); } }));
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
   * MB-FOU 12 là lớp thường (GVCN T_HA dạy L, R · W: T_KHOA · S: T_TRANG). MB-FT 101 là FT (GVCN T_HA dạy L, R · W1 T_KHOA · W2 T_LINH · S T_TRANG).
   */
  function taoHocVien(o: { classCode: 'MB-FOU 12' | 'MB-FT 101'; weekStart: string; kind?: 'mock' | 'progress' | 'final' }): HocVien {
    soThuTu += 1;
    const tag = `S1-${soThuTu}`;
    const cid = classId(o.classCode);
    const ft = o.classCode === 'MB-FT 101';
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
  /** Nhập điểm lớp thường qua đúng đường nghiệp vụ (Quản trị nhập bù — đường `score.override`). */
  const diem = (attemptId: number, skill: string, score: number, total: number) =>
    regular.saveRegularScore(P.admin, attemptId, skill, { score, total });
  const tinHieu = (attemptId: number, skill: string) =>
    conn.prepare('SELECT * FROM case_signals WHERE attempt_id = ? AND skill = ?').get(attemptId, skill) as any;
  const pGvcnFou = P.normalCoreTeacher;                               // T_HA — GVCN MB-FOU 12, dạy L và R
  const pSpeakingFou = loadPrincipal(teacherOf('MB-FOU 12', 'speaking'));
  const pWritingFou = loadPrincipal(teacherOf('MB-FOU 12', 'writing'));
  /** "Tạo Case" từ một tín hiệu, đúng như form sẽ gửi. `topic` để thử gửi sai môn. */
  const caseTuTinHieu = (p: any, sg: any, topic?: string) => cases.reportIssue(p, {
    studentId: sg.student_id, topic: topic ?? sg.skill, fromSignalId: sg.id,
    title: `Case từ tín hiệu ${sg.skill} (PR-S1)`, summary: 'Đã xem lại bài, em vướng đúng phần này của môn.',
    primaryCode: domain.issuesForTopic(topic ?? sg.skill)[0].code,
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
    const a = taoHocVien({ classCode: 'MB-FOU 12', weekStart: '2026-09-07' });
    const b = taoHocVien({ classCode: 'MB-FT 101', weekStart: '2026-09-14' });
    for (const x of [a, b]) {
      const n = (conn.prepare('SELECT COUNT(*) n FROM attempt_skills WHERE attempt_id = ?').get(x.attemptId) as any).n;
      assert(n === 4, `Lượt ${x.attemptId} phải có 4 dòng lịch kỹ năng, có ${n}`);
    }
    assert(regular.isRatioClass(a.cid) && !regular.isRatioClass(b.cid), 'MB-FOU 12 phải là lớp thường, MB-FT 101 là FT');
  });

  // ================================================================== 2. S11

  console.log('\nPR-S1 · 2. S11 — "vắng do chốt dấu -" là CỘT RIÊNG, không phải chuỗi chữ');
  const attempts: any = await import('../fasttrack/attempts.ts');
  const absence: any = await import('../fasttrack/absence.ts');
  const sit = (attemptId: number, skill: string) => conn.prepare(
    'SELECT sit_status, sit_note, absent_from_no_show AS flag, absence_move_count FROM attempt_skills WHERE attempt_id = ? AND skill = ?',
  ).get(attemptId, skill) as any;

  check('S11 · Chốt dấu "-" đánh cờ; sửa chữ sit_note KHÔNG làm mất quyền dời lần đầu của GVCN (sáng thứ Ba sau khi chốt)', () => {
    const hv = taoHocVien({ classCode: 'MB-FT 101', weekStart: '2026-09-14' });
    attempts.saveScore(P.lrTeacher, hv.attemptId, 'listening', { noShow: true }, '2026-09-16');
    absence.settleNoShows('2026-09-21');
    assert(sit(hv.attemptId, 'listening').sit_status === 'absent' && sit(hv.attemptId, 'listening').flag === 1,
      `Chốt xong phải absent + cờ 1: ${JSON.stringify(sit(hv.attemptId, 'listening'))}`);
    /* Lượt biên tập chữ sau này đổi câu ghi chú — cờ không được phụ thuộc vào câu chữ. */
    conn.prepare(`UPDATE attempt_skills SET sit_note = 'Ghi chú đã biên tập lại' WHERE attempt_id = ? AND skill = 'listening'`).run(hv.attemptId);
    const r = absence.requestAbsenceMove(P.lrTeacher, hv.attemptId, ['listening'], { today: '2026-09-22' }) as any;
    assert(r.outcomes[0].result === 'moved', `GVCN phải dời lần đầu được ngay, đang ${JSON.stringify(r.outcomes[0])}`);
    assert(sit(hv.attemptId, 'listening').flag === 0, 'Dời xong thì cờ phải về 0');
  });

  check('S11 · Vắng do Quản lý/GVCN xác nhận bằng tay KHÔNG mang cờ chốt dấu "-"', () => {
    const hv = taoHocVien({ classCode: 'MB-FT 101', weekStart: '2026-09-14' });
    skillSchedule.setSitStatus(P.mbManager, hv.attemptId, 'speaking', 'absent', 'Quản lý xác nhận em vắng buổi Speaking');
    assert(sit(hv.attemptId, 'speaking').sit_status === 'absent' && sit(hv.attemptId, 'speaking').flag === 0,
      `Vắng tay phải cờ 0: ${JSON.stringify(sit(hv.attemptId, 'speaking'))}`);
  });

  check('S11 · Mã nguồn không còn dùng chuỗi sit_note làm cờ', () => {
    const src = fsMod.readFileSync(pathMod.join(REPO, 'server/src/fasttrack/absence.ts'), 'utf8');
    assert(!/sit_note[^\n]*startsWith/.test(src), 'absence.ts còn đọc sit_note.startsWith(...) làm cờ');
  });

  // ---- các task sau thêm phép kiểm NGAY TRÊN dòng này ----
}
