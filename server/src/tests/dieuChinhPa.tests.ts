/**
 * PHÉP KIỂM PR-S2: điều chỉnh PA học thuật (S2) và cập nhật tuần rút gọn (S4).
 * Đặc tả: docs/superpowers/specs/2026-09-22-ux-toan-web-truoc-deploy-design.md §2, §7 dòng S2; kiểm kê §1.5 (S2, S4).
 * Kế hoạch: docs/superpowers/plans/2026-09-22-pr-s2-dieu-chinh-pa.md (Q1–Q18).
 *
 * Harness do `run.ts` sở hữu và truyền vào, file này không tự mở database. Học viên và Case dùng ở đây do CHÍNH file này tạo
 * (`taoCase`), không đụng học viên của bộ demo.
 */
import type { YThucTestKit } from './yThuc.tests.ts';

export async function runDieuChinhPaTests(t: YThucTestKit) {
  const { check, assert, assertThrows, conn, TODAY, P, classId, addDays } = t;
  const domain: any = await import('../../../shared/domain/index.ts');
  const cases: any = await import('../cases/cases.ts');
  const sosAuto: any = await import('../cases/sosAuto.ts');
  const effectiveness: any = await import('../cases/effectiveness.ts');
  const fsMod = await import('node:fs');
  const pathMod = await import('node:path');
  const { fileURLToPath } = await import('node:url');
  const { default: SqliteDb } = await import('libsql');
  const migrateMod: any = await import('../migrate.ts');
  const REPO = pathMod.resolve(fileURLToPath(new URL('../../../../', import.meta.url)));
  const NOW = new Date().toISOString();
  const mbBranch = (conn.prepare(`SELECT id FROM branches WHERE code = 'MB'`).get() as any).id as number;
  let soThuTu = 0;

  /**
   * MỘT học viên mới ở MB-FT 101, MỘT Case Listening do GV Listening (`P.lrTeacher`) mở, MỘT PA tự học đang chạy từ hôm nay,
   * người thực hiện là chính GV đó. Mô tả gốc: "Tự học Listening — nghe chép 15 phút mỗi ngày".
   */
  function taoCase(): { sid: number; caseId: number; ivId: number } {
    soThuTu += 1;
    const tag = `S2-${soThuTu}`;
    const cid = classId('MB-FT 101');
    const sid = Number(conn.prepare(
      `INSERT INTO students (student_code, full_name, normalized_name, branch_id, status, created_at) VALUES (?,?,?,?, 'active', ?)`,
    ).run(`PISA-${tag}`, `Học viên ${tag}`, `hoc vien ${tag.toLowerCase()}`, mbBranch, NOW).lastInsertRowid);
    conn.prepare(`INSERT INTO enrollments (student_id, class_id, status, started_at, created_at) VALUES (?,?, 'active', '2026-07-27', ?)`)
      .run(sid, cid, NOW);
    conn.prepare(
      `INSERT INTO learning_cycles (student_id, seq, route, started_at, status, created_at) VALUES (?, 1, 'LT1', '2026-07-27', 'active', ?)`,
    ).run(sid, NOW);
    const c = cases.reportIssue(P.lrTeacher, {
      studentId: sid, topic: 'listening', title: `Nghe chi tiết còn yếu (${tag})`,
      summary: 'Em bỏ sót số và tên riêng ở Section 2, sai nhiều câu điền từ.',
      primaryCode: domain.issuesForTopic('listening')[0].code, idempotencyKey: `pr-s2-${tag}`,
    }) as any;
    const d = cases.recordIntervention(P.lrTeacher, c.id, {
      kind: 'self_study', description: 'Tự học Listening — nghe chép 15 phút mỗi ngày',
      performerSelf: true, status: 'started', startedDate: TODAY,
    }) as any;
    const ivId = d.interventions.find((i: any) => i.kind === 'self_study').id as number;
    return { sid, caseId: c.id as number, ivId };
  }
  const ivRow = (id: number) => conn.prepare('SELECT * FROM case_interventions WHERE id = ?').get(id) as any;
  const revRows = (id: number) =>
    conn.prepare('SELECT * FROM case_intervention_revisions WHERE intervention_id = ? ORDER BY id').all(id) as any[];
  const lastFollow = (id: number) =>
    conn.prepare('SELECT * FROM case_followups WHERE intervention_id = ? ORDER BY id DESC LIMIT 1').get(id) as any;
  void sosAuto; void effectiveness; void assertThrows; void addDays; void ivRow; void revRows; void lastFollow; void taoCase;

  // ================================================================== 1. Nâng cấp database

  console.log('\nPR-S2 · 1. Bảng lịch sử điều chỉnh + hai cột cập nhật tuần: schema.sql và migrate.ts khớp nhau, chạy lặp không làm gì');

  const SCHEMA = fsMod.readFileSync(pathMod.join(REPO, 'server/src/schema.sql'), 'utf8');
  const colsOf = (db: any, table: string): string[] =>
    (db.prepare(`PRAGMA table_info(${table})`).all() as any[]).map((c) => `${c.name}:${c.type}:${c.notnull}`);
  const idxOf = (db: any, table: string): string[] =>
    (db.prepare(`PRAGMA index_list(${table})`).all() as any[]).map((i) => i.name).sort();
  /** Database THỜI TRƯỚC PR-S2: schema hiện tại, gỡ đúng bảng và hai cột PR-S2 thêm. */
  const preS2 = () => {
    const m = new SqliteDb(':memory:');
    m.exec(SCHEMA);
    m.exec(`DROP TABLE case_intervention_revisions;
            ALTER TABLE case_followups DROP COLUMN remaining_issue;
            ALTER TABLE case_followups DROP COLUMN decision_note;`);
    return m;
  };

  check('PR-S2 · Migrate: database dựng từ schema.sql có bảng lịch sử điều chỉnh và hai cột mới của cập nhật tuần', () => {
    const rev = colsOf(conn, 'case_intervention_revisions').map((c) => c.split(':')[0]);
    for (const c of ['intervention_id', 'case_id', 'followup_id', 'source', 'old_description', 'new_description',
      'old_performer_user_id', 'old_performer_name', 'new_performer_user_id', 'new_performer_name',
      'old_followup_due', 'new_followup_due', 'reason', 'effective_on', 'actor_user_id', 'created_at']) {
      assert(rev.includes(c), `case_intervention_revisions thiếu cột ${c}`);
    }
    const fu = colsOf(conn, 'case_followups').map((c) => c.split(':')[0]);
    assert(fu.includes('remaining_issue') && fu.includes('decision_note'), `case_followups thiếu cột mới: ${fu.join(',')}`);
  });

  check('PR-S2 · Migrate: database cũ được thêm đúng bảng và cột như schema.sql (cùng tên, kiểu, chỉ mục)', () => {
    const m = preS2();
    const applied: string[] = [];
    migrateMod.migrateDieuChinhPa(m, applied);
    assert(applied.length === 1 && /PR-S2/.test(applied[0]), `Phải báo đúng một dòng PR-S2: ${applied.join(' | ')}`);
    const fresh = new SqliteDb(':memory:');
    fresh.exec(SCHEMA);
    for (const tb of ['case_intervention_revisions', 'case_followups']) {
      assert(JSON.stringify(colsOf(m, tb)) === JSON.stringify(colsOf(fresh, tb)),
        `${tb} sau nâng cấp khác schema.sql:\n  ${colsOf(m, tb).join(',')}\n  ${colsOf(fresh, tb).join(',')}`);
    }
    assert(JSON.stringify(idxOf(m, 'case_intervention_revisions')) === JSON.stringify(idxOf(fresh, 'case_intervention_revisions')),
      'Chỉ mục của bảng lịch sử khác schema.sql');
  });

  check('PR-S2 · Migrate: chạy lần hai không làm gì; database mới từ schema.sql không có gì để nâng cấp', () => {
    const m = preS2();
    migrateMod.migrateDieuChinhPa(m, []);
    const again: string[] = [];
    migrateMod.migrateDieuChinhPa(m, again);
    assert(again.length === 0, `Lần hai phải không làm gì: ${again.join(' | ')}`);
    const fresh = new SqliteDb(':memory:');
    fresh.exec(SCHEMA);
    const none: string[] = [];
    migrateMod.migrateDieuChinhPa(fresh, none);
    assert(none.length === 0, `Database mới không được có gì để nâng cấp: ${none.join(' | ')}`);
  });

  check('PR-S2 · Migrate: `migrate()` trọn chuỗi chạy hai lần trên database đang dùng, lần hai không áp lại bước PR-S2', () => {
    migrateMod.migrate();
    const second = migrateMod.migrate();
    assert(!second.applied.some((x: string) => /PR-S2/.test(x)), `Lần hai áp lại PR-S2: ${second.applied.join(' | ')}`);
  });

  // ---- các task sau thêm phép kiểm NGAY TRÊN dòng này ----
}
