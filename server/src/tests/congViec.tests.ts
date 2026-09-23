/**
 * PHÉP KIỂM PR-Ra: Công việc (Hỗ trợ học viên · Vận hành · Báo cáo đơn vị).
 * Đặc tả: docs/superpowers/specs/2026-09-22-ux-toan-web-truoc-deploy-design.md §1, §2, §3.4, §3.13, §4, §7 dòng Ra.
 * Kế hoạch: docs/superpowers/plans/2026-09-23-pr-ra-cong-viec.md (Q1–Q18).
 *
 * Harness do `run.ts` sở hữu và truyền vào, file này không tự mở database.
 */
import type { YThucTestKit } from './yThuc.tests.ts';

export async function runCongViecTests(t: YThucTestKit) {
  const { check, assert, conn, TODAY, P, seedMax } = t;
  void TODAY; void P;
  const fsMod = await import('node:fs');
  const pathMod = await import('node:path');
  const { fileURLToPath } = await import('node:url');
  const { default: SqliteDb } = await import('libsql');
  const migrateMod: any = await import('../migrate.ts');
  const week: any = await import('../platform/week.ts');
  const REPO = pathMod.resolve(fileURLToPath(new URL('../../../../', import.meta.url)));

  // ================================================================== 1. Nâng cấp database

  console.log('\nPR-Ra · 1. Migrate Công việc: người cần hỗ trợ, lý do dời hạn, nháp/nộp báo cáo, nối báo cáo ↔ việc');

  const SCHEMA = fsMod.readFileSync(pathMod.join(REPO, 'server/src/schema.sql'), 'utf8');
  const colsOf = (db: any, table: string): string[] =>
    (db.prepare(`PRAGMA table_info(${table})`).all() as any[]).map((c) => `${c.name}:${c.type}:${c.notnull}`);
  const idxOf = (db: any, table: string): string[] =>
    (db.prepare(`PRAGMA index_list(${table})`).all() as any[]).map((i) => i.name).sort();

  /** Database THỜI TRƯỚC PR-Ra: schema hiện tại, gỡ đúng bảng và cột PR-Ra thêm, kèm vài dòng dữ liệu cũ. */
  const preRaDatabase = () => {
    const m = new SqliteDb(':memory:');
    m.exec(SCHEMA);
    m.exec(`
      DROP TABLE unit_report_task_links;
      ALTER TABLE task_history DROP COLUMN reason;
      ALTER TABLE unit_reports DROP COLUMN submitted_at;
      ALTER TABLE unit_reports DROP COLUMN submitted_by;
      ALTER TABLE unit_report_history DROP COLUMN kind;
    `);
    /*
     * `tasks` có nhiều chú thích khối/dòng ở đầu bảng — chạy DROP COLUMN hai lần liên tiếp trên
     * cùng bảng này khiến libsql lỗi "incomplete input" khi dựng lại SQL nội bộ (không phải lỗi
     * của migrateCongViec, chỉ là hạn chế của chính lệnh DROP COLUMN khi bảng có comment). Dựng
     * lại bảng bằng tay thay vì ALTER hai lần — bảng chưa có dữ liệu ở bước này nên an toàn.
     */
    m.exec(`
      DROP TABLE tasks;
      CREATE TABLE tasks (
        id INTEGER PRIMARY KEY,
        code TEXT NOT NULL UNIQUE,
        period_id INTEGER REFERENCES report_periods(id),
        task_type TEXT NOT NULL DEFAULT 'in_period',
        title TEXT NOT NULL,
        reporting_unit_id INTEGER REFERENCES reporting_units(id),
        branch_id INTEGER REFERENCES branches(id),
        assignee_user_id INTEGER REFERENCES users(id),
        due_date TEXT,
        progress TEXT NOT NULL DEFAULT 'not_started',
        note TEXT,
        group_key TEXT,
        parent_task_id INTEGER REFERENCES tasks(id),
        watcher_user_id INTEGER REFERENCES users(id),
        stop_reason TEXT,
        review_on TEXT,
        kind TEXT NOT NULL DEFAULT 'branch_ops',
        class_id INTEGER REFERENCES classes(id),
        topic TEXT,
        source_type TEXT,
        source_unit_report_id INTEGER REFERENCES unit_reports(id),
        source_sos_case_id INTEGER REFERENCES sos_cases(id),
        created_by INTEGER REFERENCES users(id),
        created_at TEXT NOT NULL,
        updated_at TEXT,
        completed_at TEXT
      );
      CREATE INDEX idx_task_period ON tasks(period_id);
      CREATE INDEX idx_task_assignee ON tasks(assignee_user_id);
    `);
    const NOW = '2026-09-10T00:00:00.000Z';
    const q = (sql: string, ...a: unknown[]) => Number(m.prepare(sql).run(...a).lastInsertRowid);
    q(`INSERT INTO branches (code, name, created_at) VALUES ('MB', 'Monbay', ?)`, NOW);
    q(`INSERT INTO users (id, code, full_name, email, title, password_hash, password_salt, status, created_at) VALUES (1,'NV1','Quản trị','u1@x.vn','GV','h','s','active',?)`, NOW);
    q(`INSERT INTO reporting_units (code, name, kind, branch_id, seq) VALUES ('MB','Monbay','branch',1,1)`);
    q(`INSERT INTO report_periods (week_start, week_end, year, month, week_no, code, created_at)
       VALUES ('2026-09-07','2026-09-13',2026,9,2,'W2 SEP 2026',?)`, NOW);
    /* Dòng ĐÃ CÓ NỘI DUNG (status NOT NULL) — thời trước PR-Ra coi như đã nộp. */
    q(`INSERT INTO unit_reports (reporting_unit_id, period_id, category_key, category_label, status, note, reporter_user_id, updated_at)
       VALUES (1,1,'teachers','Giáo viên','ok','Không có vấn đề.',1,'2026-09-10T09:00:00.000Z')`);
    /* Dòng CHỈ CÓ ghi chú thô, không status — không được tự bịa thành đã nộp. */
    q(`INSERT INTO unit_reports (reporting_unit_id, period_id, category_key, category_label, status, note, reporter_user_id, updated_at)
       VALUES (1,1,'students','Học viên / Phụ huynh',NULL,NULL,NULL,NULL)`);
    return m;
  };

  check('PR-Ra · Migrate: database dựng từ schema.sql có đủ cột/bảng mới', () => {
    const tasksCols = colsOf(conn, 'tasks').map((c) => c.split(':')[0]);
    for (const c of ['help_user_id', 'help_name']) assert(tasksCols.includes(c), `tasks thiếu ${c}`);
    const thCols = colsOf(conn, 'task_history').map((c) => c.split(':')[0]);
    assert(thCols.includes('reason'), 'task_history thiếu reason');
    const urCols = colsOf(conn, 'unit_reports').map((c) => c.split(':')[0]);
    for (const c of ['submitted_at', 'submitted_by']) assert(urCols.includes(c), `unit_reports thiếu ${c}`);
    const urhCols = colsOf(conn, 'unit_report_history').map((c) => c.split(':')[0]);
    assert(urhCols.includes('kind'), 'unit_report_history thiếu kind');
    const linkCols = colsOf(conn, 'unit_report_task_links').map((c) => c.split(':')[0]);
    for (const c of ['unit_report_id', 'task_id', 'created_by', 'created_at']) {
      assert(linkCols.includes(c), `unit_report_task_links thiếu ${c}`);
    }
  });

  check('PR-Ra · Migrate: database cũ được nâng cấp giống hệt schema.sql (cột, kiểu, thứ tự, chỉ mục); dòng có status được điền submitted_at, dòng chỉ có ghi chú giữ NULL', () => {
    const m = preRaDatabase();
    const applied: string[] = [];
    migrateMod.migrateCongViec(m, applied);
    assert(applied.length === 1 && /PR-Ra/.test(applied[0]), `Phải báo đúng một dòng PR-Ra: ${applied.join(' | ')}`);
    const fresh = new SqliteDb(':memory:');
    fresh.exec(SCHEMA);
    for (const tb of ['tasks', 'task_history', 'unit_reports', 'unit_report_history', 'unit_report_task_links']) {
      assert(JSON.stringify(colsOf(m, tb)) === JSON.stringify(colsOf(fresh, tb)),
        `${tb} sau nâng cấp khác schema.sql:\n  ${colsOf(m, tb).join(',')}\n  ${colsOf(fresh, tb).join(',')}`);
    }
    assert(JSON.stringify(idxOf(m, 'unit_report_task_links')) === JSON.stringify(idxOf(fresh, 'unit_report_task_links')),
      'Chỉ mục của bảng nối khác schema.sql');
    const rows = m.prepare('SELECT category_key, status, submitted_at FROM unit_reports ORDER BY category_key').all() as any[];
    const teachers = rows.find((r) => r.category_key === 'teachers');
    const students = rows.find((r) => r.category_key === 'students');
    assert(teachers.status === 'ok' && !!teachers.submitted_at, 'Dòng đã có nội dung phải được điền submitted_at');
    assert(students.status === null && students.submitted_at === null, 'Dòng chỉ có ghi chú thô phải giữ NULL, không bị bịa thành đã nộp');
  });

  check('PR-Ra · Migrate: chạy lần hai không làm gì; một dòng nháp tạo GIỮA hai lần chạy vẫn là nháp; database mới không có gì để nâng cấp', () => {
    const m = preRaDatabase();
    migrateMod.migrateCongViec(m, []);
    /* Dòng nháp mới tạo SAU lần chạy đầu — không được lần chạy thứ hai (nếu có) biến thành đã nộp. */
    m.prepare(`INSERT INTO unit_reports (reporting_unit_id, period_id, category_key, category_label, status, note, reporter_user_id, updated_at, submitted_at, submitted_by)
               VALUES (1,1,'curriculum','Giáo trình','watch','Đang theo dõi.',1,'2026-09-11T09:00:00.000Z',NULL,NULL)`).run();
    const again: string[] = [];
    migrateMod.migrateCongViec(m, again);
    assert(again.length === 0, `Lần hai phải không làm gì: ${again.join(' | ')}`);
    const draft = m.prepare(`SELECT submitted_at FROM unit_reports WHERE category_key = 'curriculum'`).get() as any;
    assert(draft.submitted_at === null, 'Dòng nháp tạo giữa hai lần chạy bị migrate biến thành đã nộp — sai luật');
    const fresh = new SqliteDb(':memory:');
    fresh.exec(SCHEMA);
    const none: string[] = [];
    migrateMod.migrateCongViec(fresh, none);
    assert(none.length === 0, `Database mới không được có gì để nâng cấp: ${none.join(' | ')}`);
  });

  check('PR-Ra · Migrate: `migrate()` trọn chuỗi chạy hai lần trên database đang dùng, lần hai không áp lại bước PR-Ra', () => {
    migrateMod.migrate();
    const second = migrateMod.migrate();
    assert(!second.applied.some((x: string) => /PR-Ra/.test(x)), `Lần hai áp lại PR-Ra: ${second.applied.join(' | ')}`);
  });

  // ================================================================== 2. Bộ demo (seed)

  console.log('\nPR-Ra · 2. Bộ demo có đủ các trạng thái mới của Công việc');

  check('PR-Ra · Seed: có việc Tạm ngưng ghi người cần hỗ trợ (tài khoản hoặc tên ngoài)', () => {
    const rows = conn.prepare(`SELECT * FROM tasks WHERE progress = 'paused'`).all() as any[];
    assert(rows.length > 0, 'Không có việc nào đang Tạm ngưng');
    assert(rows.some((r) => r.help_user_id || r.help_name), 'Không có việc Tạm ngưng nào ghi người cần hỗ trợ');
  });

  check('PR-Ra · Seed: có ít nhất một việc đã DỜI HẠN (task_history field=due_date kèm lý do)', () => {
    const rows = conn.prepare(`SELECT * FROM task_history WHERE field = 'due_date' AND reason IS NOT NULL AND reason != ''`).all() as any[];
    assert(rows.length > 0, 'Không có dòng lịch sử dời hạn nào có lý do');
  });

  check('PR-Ra · Seed: có việc CHA còn việc CON quá hạn', () => {
    const rows = conn.prepare(
      `SELECT p.id FROM tasks p
        WHERE EXISTS (SELECT 1 FROM tasks c WHERE c.parent_task_id = p.id
                        AND c.progress NOT IN ('done','stopped') AND c.due_date IS NOT NULL AND c.due_date < ?)`,
    ).all(TODAY) as any[];
    assert(rows.length > 0, 'Không có việc cha nào có việc con đang quá hạn');
  });

  check('PR-Ra · Seed: có việc Tạm ngưng đã TỚI/QUA ngày xem lại', () => {
    const rows = conn.prepare(`SELECT * FROM tasks WHERE progress = 'paused' AND review_on IS NOT NULL AND review_on <= ?`).all(TODAY) as any[];
    assert(rows.length > 0, 'Không có việc Tạm ngưng nào đã tới ngày xem lại');
  });

  check('PR-Ra · Seed: có việc HOÀN THÀNH trong 7 ngày gần nhất', () => {
    const rows = conn.prepare(`SELECT * FROM tasks WHERE progress = 'done' AND completed_at IS NOT NULL AND substr(completed_at,1,10) >= date(?, '-7 day')`).all(TODAY) as any[];
    assert(rows.length > 0, 'Không có việc hoàn thành nào trong 7 ngày gần nhất');
  });

  check('PR-Ra · Seed: báo cáo kỳ hiện tại có đủ đã nộp / nháp chưa nộp / đơn vị trống', () => {
    const cur = week.ensurePeriod(TODAY).id;
    const submitted = conn.prepare(`SELECT COUNT(*) n FROM unit_reports WHERE period_id = ? AND submitted_at IS NOT NULL`).get(cur) as any;
    assert(submitted.n > 0, 'Không có ô báo cáo nào đã nộp ở kỳ hiện tại');
    const draft = conn.prepare(`SELECT COUNT(*) n FROM unit_reports WHERE period_id = ? AND status IS NOT NULL AND submitted_at IS NULL`).get(cur) as any;
    assert(draft.n > 0, 'Không có ô nháp (có mức nhưng chưa nộp) nào ở kỳ hiện tại');
    const units = conn.prepare(`SELECT id FROM reporting_units`).all() as any[];
    const empty = units.filter((u) => !(conn.prepare(`SELECT 1 FROM unit_reports WHERE period_id = ? AND reporting_unit_id = ?`).get(cur, u.id)));
    assert(empty.length > 0, 'Không có đơn vị nào bỏ trống hẳn (Chưa báo cáo) ở kỳ hiện tại');
  });

  check('PR-Ra · Seed: có ít nhất một dòng nối báo cáo ↔ việc (unit_report_task_links)', () => {
    const rows = conn.prepare(`SELECT * FROM unit_report_task_links`).all() as any[];
    assert(rows.length > 0, 'Không có dòng nối báo cáo ↔ việc nào');
  });

  check('PR-Ra · Seed: không có việc nào ghi HOÀN THÀNH ở tương lai so với ngày demo (SEED_MAX)', () => {
    const today = TODAY;
    const late = conn.prepare(
      `SELECT id, completed_at FROM tasks WHERE id <= ? AND completed_at IS NOT NULL AND substr(completed_at,1,10) > ?`,
    ).all(seedMax.tasks, today) as any[];
    assert(late.length === 0, `Có việc hoàn thành ghi ở tương lai: ${JSON.stringify(late)}`);
  });
}
