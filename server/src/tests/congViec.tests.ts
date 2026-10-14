/**
 * PHÉP KIỂM PR-Ra: Công việc (Hỗ trợ học viên · Vận hành · Báo cáo đơn vị).
 * Đặc tả: docs/superpowers/specs/2026-09-22-ux-toan-web-truoc-deploy-design.md §1, §2, §3.4, §3.13, §4, §7 dòng Ra.
 * Kế hoạch: docs/superpowers/plans/2026-09-23-pr-ra-cong-viec.md (Q1–Q18).
 *
 * Harness do `run.ts` sở hữu và truyền vào, file này không tự mở database.
 */
import type { YThucTestKit } from './yThuc.tests.ts';

export async function runCongViecTests(t: YThucTestKit) {
  const { check, checkAsync, assert, assertThrows, conn, TODAY, P, seedMax } = t;
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
    /* PR-DUYET thêm `tasks.assignee_name`, PR-GVa thêm `tasks.idempotency_key` ở bước migrate của mình (sau PR-Ra) — so PR-Ra trên phần schema của đúng bước này. */
    const sauPrRa = (db: any, tb: string) => colsOf(db, tb).filter((c) => !(tb === 'tasks' && (c.startsWith('assignee_name:') || c.startsWith('idempotency_key:'))));
    for (const tb of ['tasks', 'task_history', 'unit_reports', 'unit_report_history', 'unit_report_task_links']) {
      assert(JSON.stringify(colsOf(m, tb)) === JSON.stringify(sauPrRa(fresh, tb)),
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

  check('PR-Ra · Migrate: submitted_by điền theo submitted_at IS NOT NULL, không phải status IS NOT NULL — dòng nháp (status có, chưa nộp) không bị gán oan người nộp', () => {
    /*
     * Dựng đúng ca lệch nhau giữa hai đợt nâng cấp: `submitted_at` đã có SẴN từ một lần chạy
     * TRƯỚC (đúng giá trị — chỉ dòng đã nộp mới có), còn `submitted_by` thì CHƯA — rồi một dòng
     * NHÁP mới (status có nội dung nhưng chưa nộp, submitted_at NULL) được tạo ở giữa. Nếu điền
     * submitted_by theo `status IS NOT NULL` (sai) thì dòng nháp này bị gán oan "đã nộp bởi X".
     */
    const m = preRaDatabase();
    m.exec(`ALTER TABLE unit_reports ADD COLUMN submitted_at TEXT`);
    m.exec(`UPDATE unit_reports SET submitted_at = updated_at WHERE status IS NOT NULL`);
    m.prepare(`INSERT INTO unit_reports (reporting_unit_id, period_id, category_key, category_label, status, note, reporter_user_id, updated_at, submitted_at)
               VALUES (1,1,'curriculum','Giáo trình','watch','Đang theo dõi, chưa nộp.',1,'2026-09-11T09:00:00.000Z',NULL)`).run();
    const applied: string[] = [];
    migrateMod.migrateCongViec(m, applied);
    const rows = m.prepare('SELECT category_key, status, submitted_at, submitted_by FROM unit_reports').all() as any[];
    const draft = rows.find((r) => r.category_key === 'curriculum');
    assert(draft.submitted_by === null, `Dòng nháp (submitted_at NULL) không được có submitted_by: ${JSON.stringify(draft)}`);
    const teachers = rows.find((r) => r.category_key === 'teachers');
    assert(teachers.submitted_by === 1, `Dòng đã nộp thật (submitted_at có) phải điền submitted_by: ${JSON.stringify(teachers)}`);
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

  // ================================================================== 3. Luật thuần shared/domain/congViec.ts

  console.log('\nPR-Ra · 3. Luật thuần Công việc — lọc nhanh, facet, hàng số Vận hành, trạng thái báo cáo');

  const domain: any = await import('../../../shared/domain/index.ts');
  const homNay = '2026-09-14'; // thứ Hai, W3 SEP (DEMO_DATE)

  check('PR-Ra · Q4: "Tuần này" gồm hôm nay và Chủ nhật (14→20/09), không gồm thứ Hai tuần sau (21/09), không gồm quá hạn', () => {
    const mk = (due: string | null, urgency: 'overdue' | 'today' | 'normal' = 'normal') => ({ due, urgency });
    assert(domain.khopLocNhanh(mk(homNay), 'tuan-nay', homNay) === true, 'Hôm nay phải vào Tuần này');
    assert(domain.khopLocNhanh(mk('2026-09-20'), 'tuan-nay', homNay) === true, 'Chủ nhật 20/09 phải vào Tuần này');
    assert(domain.khopLocNhanh(mk('2026-09-21'), 'tuan-nay', homNay) === false, 'Thứ Hai tuần sau (21/09) không được vào Tuần này');
    assert(domain.khopLocNhanh(mk('2026-09-10', 'overdue'), 'tuan-nay', homNay) === false, 'Việc quá hạn không được vào Tuần này (hai ô không chồng nhau)');
    assert(domain.khopLocNhanh(mk(null), 'tuan-nay', homNay) === false, 'Việc không có hạn không vào Tuần này');
  });

  check('PR-Ra · demLocNhanh: bốn ô không đổi khi đổi Loại việc đang xem (chỉ phụ thuộc chính tham số loai truyền vào)', () => {
    const items = [
      { group: 'score', urgency: 'overdue', due: '2026-09-10' },
      { group: 'score', urgency: 'normal', due: '2026-09-16' },
      { group: 'result', urgency: 'today', due: homNay },
    ];
    const a = domain.demLocNhanh(items, 'score', homNay);
    const b = domain.demLocNhanh(items, 'score', homNay);
    assert(JSON.stringify(a) === JSON.stringify(b), 'Gọi lại với cùng loai phải ra cùng số — không có trạng thái ẩn nào chen vào');
    assert(a['qua-han'] === 1 && a['tuan-nay'] === 1, `Số theo Loại việc "score" sai: ${JSON.stringify(a)}`);
  });

  check('PR-Ra · demLoaiViec: số theo Loại việc không đổi khi đổi lọc nhanh khác — mỗi lần gọi chỉ áp đúng MỘT lọc nhanh truyền vào', () => {
    const items = [
      { group: 'score', urgency: 'overdue', due: '2026-09-10' },
      { group: 'result', urgency: 'overdue', due: '2026-09-11' },
      { group: 'score', urgency: 'today', due: homNay },
    ];
    const quaHan = domain.demLoaiViec(items, 'qua-han', homNay);
    assert(quaHan.score === 1 && quaHan.result === 1, `Số theo lọc nhanh "qua-han" sai: ${JSON.stringify(quaHan)}`);
    const tatCa = domain.demLoaiViec(items, 'tat-ca', homNay);
    assert(tatCa.score === 2 && tatCa.result === 1, `Số theo lọc nhanh "tat-ca" sai: ${JSON.stringify(tatCa)}`);
  });

  check('PR-Ra · thamSoNguoi: "toi"/"tat-ca" giữ nguyên, số hợp lệ → number, chuỗi lạ/rỗng/thiếu → null', () => {
    assert(domain.thamSoNguoi('toi') === 'toi' && domain.thamSoNguoi('tat-ca') === 'tat-ca', 'toi/tat-ca phải giữ nguyên');
    assert(domain.thamSoNguoi('12') === 12, 'Chuỗi số phải đổi ra number');
    assert(domain.thamSoNguoi('abc') === null && domain.thamSoNguoi('') === null && domain.thamSoNguoi(undefined) === null && domain.thamSoNguoi('0') === null,
      'Chuỗi lạ (kể cả 0, rỗng, thiếu) phải ra null');
  });

  const dvh = (o: Partial<{ progress: string; due: string | null; reviewOn: string | null; completedAt: string | null; subOpen: number; subTotal: number; group: string; assigneeUserId: number | null }>) => ({
    progress: 'doing', due: null, reviewOn: null, completedAt: null, subOpen: 0, subTotal: 0, group: 'teacher', assigneeUserId: null, ...o,
  });

  check('PR-Ra · Q8 hàng số: Tạm ngưng TRƯỚC ngày xem lại → chờ người khác; ĐÚNG/SAU ngày xem lại → cần quyết định; hai ô không chồng nhau', () => {
    const truoc = dvh({ progress: 'paused', reviewOn: '2026-09-20' });
    const dung = dvh({ progress: 'paused', reviewOn: homNay });
    const sau = dvh({ progress: 'paused', reviewOn: '2026-09-01' });
    const hs = domain.hangSoVanHanh([truoc, dung, sau], homNay);
    assert(hs['cho-nguoi-khac'] === 1, `Chỉ "trước" là chờ người khác: ${JSON.stringify(hs)}`);
    assert(hs['can-quyet-dinh'] === 2, `"đúng" và "sau" ngày xem lại phải là cần quyết định: ${JSON.stringify(hs)}`);
    assert(domain.khopHang(truoc, 'cho-nguoi-khac', homNay) && !domain.khopHang(truoc, 'can-quyet-dinh', homNay), 'Một dòng không được vào cả hai ô giữa');
  });

  check('PR-Ra · Q8 hàng số: việc CHA đã khép hết việc con (còn cha chưa xong) → cần quyết định', () => {
    const chaHetCon = dvh({ progress: 'doing', subTotal: 3, subOpen: 0 });
    const chaConMo = dvh({ progress: 'doing', subTotal: 3, subOpen: 1 });
    assert(domain.khopHang(chaHetCon, 'can-quyet-dinh', homNay) === true, 'Cha đã khép hết con phải vào cần quyết định');
    assert(domain.khopHang(chaConMo, 'can-quyet-dinh', homNay) === false, 'Cha còn con mở thì chưa vào cần quyết định');
  });

  check('PR-Ra · Q8 hàng số: vừa hoàn thành đúng 7 ngày (ngày thứ 7 vào, thứ 8 không)', () => {
    const ngay7 = dvh({ progress: 'done', completedAt: addDaysStr(homNay, -6) });
    const ngay8 = dvh({ progress: 'done', completedAt: addDaysStr(homNay, -7) });
    assert(domain.khopHang(ngay7, 'vua-xong', homNay) === true, 'Hoàn thành 6 ngày trước (ngày thứ 7 tính cả hôm nay) phải tính');
    assert(domain.khopHang(ngay8, 'vua-xong', homNay) === false, 'Hoàn thành 7 ngày trước (ngày thứ 8) không được tính');
  });

  check('PR-Ra · facetVanHanh: số trạng thái KHÔNG đổi khi đổi trạng thái đang chọn (chỉ áp nhóm + hàng)', () => {
    const rows = [dvh({ progress: 'doing', group: 'teacher' }), dvh({ progress: 'paused', group: 'teacher', reviewOn: '2026-09-01' }),
      dvh({ progress: 'done', group: 'curriculum', completedAt: homNay })];
    const a = domain.facetVanHanh(rows, { progress: 'doing' }, homNay);
    const b = domain.facetVanHanh(rows, { progress: 'paused' }, homNay);
    assert(JSON.stringify(a.progress) === JSON.stringify(b.progress), `Facet trạng thái phải giữ nguyên khi đổi trạng thái đang chọn: ${JSON.stringify(a.progress)} vs ${JSON.stringify(b.progress)}`);
    assert(a.progress.doing === 1 && a.progress.paused === 1, `Facet trạng thái sai: ${JSON.stringify(a.progress)}`);
  });

  check('PR-Ra · dongHanDaDoi: ≤ 60 ký tự, không hiện ISO, không hạn gốc → null', () => {
    const s = domain.dongHanDaDoi({ hanGoc: '2026-09-05', lyDo: 'Chờ duyệt ngân sách nhà cung cấp, hẹn lại đầu tháng sau vì kế toán đang bận quyết toán quý' }, homNay);
    assert(typeof s === 'string' && s.length <= 60, `Dòng phụ dời hạn phải ≤ 60 ký tự: "${s}" (${s?.length})`);
    assert(!/\d{4}-\d{2}-\d{2}/.test(s ?? ''), `Không được hiện ngày ISO: "${s}"`);
    assert(/^đã dời từ 05\/09/.test(s ?? ''), `Phải bắt đầu bằng "đã dời từ 05/09": "${s}"`);
    assert(domain.dongHanDaDoi({ hanGoc: null, lyDo: null }, homNay) === null, 'Không có hạn gốc thì không có dòng phụ');
  });

  check('PR-Ra · trangThaiDonVi (Q12): Đã nộp · Nháp kèm "đã nộp n/m" · Chưa báo cáo', () => {
    const o = (status: string | null, submittedAt: string | null, note: string | null = null) => ({ status, note, submittedAt });
    const daNop = domain.trangThaiDonVi([o('ok', homNay), o('watch', homNay)]);
    assert(daNop.ma === 'da-nop' && daNop.nhan === 'Đã nộp' && daNop.phu === null, `Ba ô đều đã nộp phải là Đã nộp: ${JSON.stringify(daNop)}`);
    const nhap = domain.trangThaiDonVi([o('ok', homNay), o('watch', null), o('problem', null)]);
    assert(nhap.ma === 'nhap' && nhap.phu === 'đã nộp 1/3', `Trộn nộp/nháp phải là Nháp · chưa nộp kèm "đã nộp 1/3": ${JSON.stringify(nhap)}`);
    const chua = domain.trangThaiDonVi([o(null, null), o(null, null)]);
    assert(chua.ma === 'chua' && chua.nhan === 'Chưa báo cáo', `Không ô nào có gì phải là Chưa báo cáo: ${JSON.stringify(chua)}`);
  });

  check('PR-Ra Q5 · duongThongBao: thông báo Nhắc (entity_type="nhac_viec") mở /cong-viec', () => {
    const duong = domain.duongThongBao({ entity_type: 'nhac_viec', entity_id: 0, kind: null, student_id: null, attempt_id: null });
    assert(duong === '/cong-viec', `Thông báo Nhắc phải mở /cong-viec: ${duong}`);
  });

  // ================================================================== 4. Máy chủ: Hỗ trợ học viên — nguoi, Nhắc, Duyệt

  console.log('\nPR-Ra · 4. Máy chủ Hỗ trợ học viên — người phụ trách lọc ở máy chủ, Nhắc, Duyệt trên dòng');

  const mywork: any = await import('../worklist/mywork.ts');
  const permMod: any = await import('../permissions.ts');
  const casesSvc: any = await import('../cases/cases.ts');
  const yeuCauSvc: any = await import('../duyet/yeuCau.ts');
  const { createApp } = await import('../app.ts');
  const { createSession } = await import('../auth.ts');

  const mbBranchId = (conn.prepare(`SELECT id FROM branches WHERE code = 'MB'`).get() as any).id as number;
  const mbClassId3 = (conn.prepare(`SELECT id FROM classes WHERE code = 'MB FT 101'`).get() as any).id as number;

  const owingTeacherAt = (branchId: number) => {
    const row = conn.prepare(
      `SELECT ta.user_id AS id FROM teacher_assignments ta
         JOIN classes cl ON cl.id = ta.class_id
         JOIN assessment_attempts a ON a.class_id = ta.class_id
         JOIN report_periods rp ON rp.id = a.planned_period_id
         LEFT JOIN assessment_scores sc ON sc.attempt_id = a.id AND sc.skill = ta.skill
        WHERE ta.status = 'active' AND ta.skill IS NOT NULL AND cl.branch_id = ?
          AND a.status != 'cancelled' AND rp.week_start <= ?
          AND sc.band IS NULL AND sc.raw_score IS NULL
        LIMIT 1`,
    ).get(branchId, TODAY) as any;
    assert(row, `Không còn giáo viên nào đang nợ điểm ở chi nhánh ${branchId} để đối chứng`);
    return permMod.loadPrincipal(row.id);
  };
  const gvMB = owingTeacherAt(mbBranchId);

  /*
   * Giáo viên dạy CẢ Monbay lẫn Bãi Cháy, đang nợ điểm một lớp ở BÃI CHÁY — dựng riêng vì
   * `owingTeacherAt` không đủ (không đòi multi-branch). Dùng để thử: kiểm phạm vi Nhắc theo
   * chi nhánh của NGƯỜI được nhắc (cũ, chỉ nhìn `user_roles`) sẽ ĐẬU sai vì người này CÓ dạy ở
   * Monbay — phải kiểm đúng chi nhánh của DÒNG việc cụ thể mới bắt được.
   */
  const bcBranchId = (conn.prepare(`SELECT id FROM branches WHERE code = 'BC'`).get() as any).id as number;
  const gvMbBc = (() => {
    const row = conn.prepare(
      `SELECT ta.user_id AS id, cl.id AS classId FROM teacher_assignments ta
         JOIN classes cl ON cl.id = ta.class_id
         JOIN assessment_attempts a ON a.class_id = ta.class_id
         JOIN report_periods rp ON rp.id = a.planned_period_id
         LEFT JOIN assessment_scores sc ON sc.attempt_id = a.id AND sc.skill = ta.skill
        WHERE ta.status = 'active' AND ta.skill IS NOT NULL AND cl.branch_id = ?
          AND a.status != 'cancelled' AND rp.week_start <= ?
          AND sc.band IS NULL AND sc.raw_score IS NULL
          AND EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = ta.user_id AND ur.status = 'active' AND ur.branch_id = ?)
        LIMIT 1`,
    ).get(bcBranchId, TODAY, mbBranchId) as any;
    assert(row, 'Không tìm được giáo viên dạy cả Monbay lẫn Bãi Cháy, đang nợ điểm ở Bãi Cháy, để thử kiểm phạm vi Nhắc theo dòng');
    return { principal: permMod.loadPrincipal(row.id), classId: row.classId as number };
  })();

  check('PR-Ra · myWork mặc định (không nguoi): dòng chấm điểm của GV chỉ khác khoá cũ ở đuôi "|u…"; QL không được phân công thì vẫn không có dòng chấm điểm', () => {
    const scoreOf = (p: any) => (mywork.myWork(p, {}).items ?? []).filter((i: any) => i.group === 'score');
    const gvItems = scoreOf(gvMB);
    assert(gvItems.length > 0, 'GV đang nợ điểm phải thấy dòng chấm điểm của chính mình');
    for (const it of gvItems) {
      assert(new RegExp(`\\|u${gvMB.userId}$`).test(it.key), `Khoá dòng chấm điểm phải kết thúc bằng |u${gvMB.userId}: ${it.key}`);
      assert(it.ownerId === gvMB.userId && it.mine === true, `Dòng của GV phải là ownerId=${gvMB.userId}, mine=true: ${JSON.stringify(it)}`);
    }
    assert(scoreOf(P.mbManager).length === 0, 'Quản lý không được phân công dạy thì mặc định không có dòng chấm điểm (giữ luật cũ)');
  });

  await checkAsync('PR-UX1 · Việc cần làm › Chấm điểm mở Lịch Test đúng lớp + môn', async () => {
    const { duongMoi } = await import('../../../shared/domain/index.ts');
    for (const p of [P.subjectTeacher, gvMB]) {
      const items = (mywork.myWork(p, {}).items ?? []).filter((i: any) => i.group === 'score' && i.classId);
      assert(items.length > 0, `GV ${p.userId} phải có dòng chấm điểm có lớp`);
      for (const it of items) {
        assert(it.href.startsWith('/test/lich?'), `Chấm điểm phải mở Lịch Test: ${it.href}`);
        const q = new URLSearchParams(it.href.split('?')[1]);
        assert(q.get('classId') === String(it.classId), `Đúng lớp: ${it.href} (lớp ${it.classId})`);
        assert(!!q.get('kn'), `Có môn để đặt con trỏ: ${it.href}`);
        assert(duongMoi('/test/lich', it.href.split('?')[1]) === null, `Không bị chuyển tiếp: ${it.href}`);
      }
    }
  });

  check('PR-Ra · myWork(QT) mặc định: vẫn không có dòng chấm điểm dù có quyền sửa điểm mọi nơi (giữ luật cũ run.ts:5474-5482)', () => {
    const adminScore = (mywork.myWork(P.admin, {}).items ?? []).filter((i: any) => i.group === 'score');
    assert(adminScore.length === 0, `Quản trị hệ thống không được là người nợ điểm: ${adminScore.length} dòng`);
  });

  check('PR-Ra Q1 · myWork(QL, {nguoi:"tat-ca"}) chứa dòng chấm điểm của GV khác trong phạm vi, đúng ownerId', () => {
    const w = mywork.myWork(P.mbManager, { nguoi: 'tat-ca' });
    assert(w.xemNguoiKhac === true, 'QL phải xemNguoiKhac = true');
    const scoreItems = w.items.filter((i: any) => i.group === 'score');
    const ofGv = scoreItems.filter((i: any) => i.ownerId === gvMB.userId);
    assert(ofGv.length > 0, `"Tất cả trong phạm vi" phải chứa dòng chấm điểm của GV ${gvMB.userId}: ${JSON.stringify(scoreItems.map((i: any) => i.key))}`);
    for (const it of ofGv) assert(it.mine === false, 'Dòng của người khác không được đánh dấu mine=true');
  });

  // ---- Q6: Duyệt trên dòng — dựng riêng một case "đề xuất" và một case "xin ý kiến" ----
  let seq3 = 0;
  const taoCaseRa = (): { sid: number; caseId: number } => {
    seq3 += 1;
    const tag = `Ra3-${seq3}`;
    const now = new Date().toISOString();
    const sid = Number(conn.prepare(
      `INSERT INTO students (student_code, full_name, normalized_name, branch_id, status, created_at) VALUES (?,?,?,?, 'active', ?)`,
    ).run(`PISA-${tag}`, `Học viên ${tag}`, `hoc vien ${tag.toLowerCase()}`, mbBranchId, now).lastInsertRowid);
    conn.prepare(`INSERT INTO enrollments (student_id, class_id, status, started_at, created_at) VALUES (?,?, 'active', '2026-07-27', ?)`)
      .run(sid, mbClassId3, now);
    conn.prepare(
      `INSERT INTO learning_cycles (student_id, seq, route, started_at, status, created_at) VALUES (?, 1, 'LT1', '2026-07-27', 'active', ?)`,
    ).run(sid, now);
    const c = casesSvc.reportIssue(P.lrTeacher, {
      studentId: sid, topic: 'listening', title: `Việc thử PR-Ra (${tag})`,
      summary: 'Case dựng riêng cho phép kiểm Duyệt trên dòng.',
      primaryCode: domain.issuesForTopic('listening')[0].code, idempotencyKey: `pr-ra3-${tag}`,
    }) as any;
    return { sid, caseId: c.id as number };
  };

  const propose = taoCaseRa();
  const proposeDetail = casesSvc.recordIntervention(P.lrTeacher, propose.caseId, {
    kind: 'extra_support', description: 'Học thêm 30 phút mỗi buổi để bắt kịp bài giảng.', status: 'planned',
  }) as any;
  const proposeIvId = proposeDetail.interventions.find((i: any) => i.kind === 'extra_support').id as number;

  const ask = taoCaseRa();
  const askDetail = casesSvc.recordIntervention(P.lrTeacher, ask.caseId, {
    kind: 'self_study', description: 'Tự học nghe chép 15 phút mỗi ngày.', performerSelf: true, status: 'started', startedDate: TODAY,
  }) as any;
  const askIvId = askDetail.interventions.find((i: any) => i.kind === 'self_study').id as number;
  casesSvc.updateResult(P.lrTeacher, askIvId, {
    outcome: 'unchanged', decision: 'ask_manager', observedOn: TODAY,
    note: 'Đã thử tự học một tuần nhưng em vẫn chưa tiến bộ rõ, cần Quản lý cho ý kiến hướng tiếp theo.',
    decisionNote: 'Có nên chuyển sang tutor không?',
  });

  check('PR-DUYET (thay PR-Ra Q6) · đề xuất PA học thuật là thẻ Đề xuất PA ở hộp QL MB (Duyệt/Từ chối), không còn dòng việc "decide"', () => {
    assert(!mywork.myWork(P.mbManager, {}).items.some((i: any) => i.group === 'decide'), 'Còn dòng việc "decide"');
    const the = yeuCauSvc.hopChoDuyet(P.mbManager).the.find((x: any) => x.loai === 'de_xuat_pa' && x.hocVienId === propose.sid);
    assert(the && the.kieuNut === 'duyet-tu-choi' && the.lyDo.includes('Học thêm 30 phút'), `Không thấy thẻ Đề xuất PA (ivId=${proposeIvId})`);
    void ask; void askIvId;
  });

  check('PR-Ra · Dòng "mgmt" (việc quản lý được giao) có href /cong-viec?mo-viec=', () => {
    const anyAssignee = conn.prepare(
      `SELECT assignee_user_id AS id FROM tasks WHERE assignee_user_id IS NOT NULL AND progress NOT IN ('done','stopped') LIMIT 1`,
    ).get() as any;
    assert(anyAssignee, 'Không còn việc quản lý nào đang giao cho ai để đối chứng');
    const pr = permMod.loadPrincipal(anyAssignee.id);
    const mgmtItem = mywork.myWork(pr, {}).items.find((i: any) => i.group === 'mgmt');
    assert(mgmtItem, `Người được giao việc (uid=${anyAssignee.id}) phải thấy dòng "mgmt"`);
    assert(mgmtItem.href.startsWith('/cong-viec?mo-viec='), `href dòng mgmt sai: ${mgmtItem.href}`);
  });

  // ---- Phần qua HTTP thật: /my-work?nguoi=…, /ref/nguoi?trongPhamVi=1 ----
  const httpApp = createApp().listen(0);
  const httpPort = (httpApp.address() as any).port as number;
  const goiHttp = async (userId: number, method: string, url: string, body?: unknown) => {
    const headers: Record<string, string> = { 'content-type': 'application/json', cookie: `pisa_demo_session=${createSession(userId)}` };
    const res = await fetch(`http://127.0.0.1:${httpPort}/api${url}`, {
      method, headers, body: body === undefined ? undefined : JSON.stringify(body),
    });
    let json: any = null;
    try { json = await res.json(); } catch { /* không có thân JSON */ }
    return { status: res.status, json };
  };
  /* PR-VN3 (GOP): route không còn trả `items` — từng việc = dòng lẻ của `dong` + các em (`con`) của dòng gộp (cùng khoá, cùng `nhac`). */
  const viecLe = (json: any): any[] => ((json?.dong ?? []) as any[]).flatMap((d) => d.con ?? [d]);

  await checkAsync('PR-Ra Q2 · /my-work?nguoi={X} (qua HTTP, QL): mọi khoá score/cause của X nằm trong khoá của "tat-ca"', async () => {
    const tatCaRes = await goiHttp(P.mbManager.userId, 'GET', '/my-work?nguoi=tat-ca');
    assert(tatCaRes.status === 200, `tat-ca: ${tatCaRes.status}`);
    const tatCaKeys = new Set(viecLe(tatCaRes.json).filter((i: any) => i.group === 'score' || i.group === 'cause').map((i: any) => i.key));
    const xRes = await goiHttp(P.mbManager.userId, 'GET', `/my-work?nguoi=${gvMB.userId}`);
    assert(xRes.status === 200, `nguoi=X: ${xRes.status}`);
    const xItems = viecLe(xRes.json).filter((i: any) => i.group === 'score' || i.group === 'cause');
    assert(xItems.length > 0, 'GV X phải có ít nhất một dòng score/cause');
    for (const it of xItems) assert(tatCaKeys.has(it.key), `Khoá ${it.key} của X không nằm trong "tat-ca"`);
  });

  await checkAsync('PR-Ra Q2 · nguoi=X ở chi nhánh khác QL → 403; GV gọi nguoi=tat-ca → 403', async () => {
    const cross = await goiHttp(P.cpManager.userId, 'GET', `/my-work?nguoi=${gvMB.userId}`);
    assert(cross.status === 403, `QL CP hỏi GV MB phải 403: ${cross.status}`);
    const gvTatCa = await goiHttp(gvMB.userId, 'GET', '/my-work?nguoi=tat-ca');
    assert(gvTatCa.status === 403, `GV gọi tat-ca phải 403: ${gvTatCa.status}`);
  });

  await checkAsync('PR-Ra · /ref/nguoi?trongPhamVi=1 của QL MB không trả GV chỉ thuộc CP', async () => {
    const cpOnlyGv = conn.prepare(
      `SELECT u.id, u.full_name FROM users u
         JOIN user_roles ur ON ur.user_id = u.id AND ur.status = 'active'
         JOIN roles r ON r.id = ur.role_id AND r.key = 'teacher'
         JOIN branches b ON b.id = ur.branch_id AND b.code = 'CP'
        WHERE u.status = 'active'
          AND NOT EXISTS (SELECT 1 FROM user_roles ur2 JOIN branches b2 ON b2.id = ur2.branch_id
                            WHERE ur2.user_id = u.id AND ur2.status = 'active' AND b2.code != 'CP')
        LIMIT 1`,
    ).get() as any;
    assert(cpOnlyGv, 'Cần một GV chỉ thuộc CP để đối chứng');
    const r = await goiHttp(P.mbManager.userId, 'GET', `/ref/nguoi?nhom=giao_vien&trongPhamVi=1&q=${encodeURIComponent(cpOnlyGv.full_name)}`);
    assert(r.status === 200, `status: ${r.status}`);
    assert(!r.json.some((x: any) => x.id === cpOnlyGv.id), `QL MB không được thấy GV chỉ thuộc CP (${cpOnlyGv.full_name}) khi trongPhamVi=1`);
  });

  // ================================================================== 5. Máy chủ: Vận hành

  console.log('\nPR-Ra · 5. Máy chủ Vận hành — hàng số, facet đúng, Tạm ngưng đủ ba ý, dời hạn giữ hạn cũ');

  const mgmt: any = await import('../worklist/mgmttasks.ts');

  const khoaUser = Number(conn.prepare(
    `INSERT INTO users (code, full_name, email, title, password_hash, password_salt, status, created_at)
     VALUES ('PR-RA-KHOA','Tài khoản đã khoá','pr-ra-khoa@pisa.test','GV','h','s','inactive',?)`,
  ).run(new Date().toISOString()).lastInsertRowid);
  const motHocVien = (conn.prepare(`SELECT id FROM students LIMIT 1`).get() as any).id as number;

  const taoViecRa = (over: Partial<{
    title: string; group: string; assigneeUserId: number | null; due: string | null; branchId: number | null; parentTaskId: number | null;
  }> = {}) => mgmt.createMgmtTask(P.mbManager, {
    title: over.title ?? `Việc thử PR-Ra ${Math.random().toString(36).slice(2, 8)}`,
    group: over.group ?? 'teacher', branchId: over.branchId ?? mbBranchId,
    assigneeUserId: over.assigneeUserId ?? gvMB.userId, due: over.due ?? null,
    parentTaskId: over.parentTaskId ?? null,
  });

  check('PR-Ra · LỖ CŨ trên main đã sửa: canSeeBoard chỉ hỏi VAI TRÒ (Quản lý ở BẤT KỲ chi nhánh) chứ không hỏi ĐÚNG chi nhánh của việc — Quản lý Monbay không xem/cập nhật được việc của chi nhánh khác', () => {
    const cpBranchId = (conn.prepare(`SELECT id FROM branches WHERE code = 'CP'`).get() as any).id as number;
    const cpTask = mgmt.createMgmtTask(P.admin, { title: 'Việc Cẩm Phả thử phạm vi', group: 'teacher', branchId: cpBranchId });
    assertThrows(() => mgmt.mgmtTaskDetail(P.mbManager, cpTask.id), /không được giao cho bạn/,
      'QL Monbay xem chi tiết việc chi nhánh Cẩm Phả phải bị chặn');
    assertThrows(() => mgmt.updateMgmtTask(P.mbManager, cpTask.id, { progress: 'doing', on: '2026-09-14' }),
      /Chỉ người được giao hoặc Quản lý/, 'QL Monbay cập nhật tiến độ việc chi nhánh Cẩm Phả phải bị chặn');
    assertThrows(() => mgmt.editMgmtTask(P.mbManager, cpTask.id, { note: 'thử' }), /Chỉ Quản lý mới sửa được/,
      'QL Monbay sửa (PATCH) việc chi nhánh Cẩm Phả phải bị chặn — lỗ này chưa có, kiểm để giữ nguyên');
    // Đúng chi nhánh thì làm được bình thường — không phải khoá hết mọi Quản lý.
    const d = mgmt.mgmtTaskDetail(P.cpManager, cpTask.id);
    assert(d.id === cpTask.id, 'QL Cẩm Phả phải xem được việc của đúng chi nhánh mình');
    mgmt.updateMgmtTask(P.cpManager, cpTask.id, { progress: 'doing', on: '2026-09-14' });
    assert(mgmt.mgmtTaskDetail(P.cpManager, cpTask.id).progress === 'doing', 'QL Cẩm Phả phải cập nhật được việc của đúng chi nhánh mình');
  });

  check('PR-Ra Q10 · Tạm ngưng thiếu người cần hỗ trợ / thiếu ngày xem lại / ngày xem lại trước ngày cập nhật → 400', () => {
    const v = taoViecRa();
    assertThrows(() => mgmt.updateMgmtTask(P.mbManager, v.id, { progress: 'paused', reason: 'Chờ duyệt ngân sách.', reviewOn: '2026-10-01' }),
      /cần ai hỗ trợ/i, 'Thiếu người cần hỗ trợ phải 400');
    assertThrows(() => mgmt.updateMgmtTask(P.mbManager, v.id, { progress: 'paused', reason: 'Chờ duyệt ngân sách.', helpUserId: gvMB.userId }),
      /ngày xem lại/i, 'Thiếu ngày xem lại phải 400');
    assertThrows(() => mgmt.updateMgmtTask(P.mbManager, v.id, {
      progress: 'paused', reason: 'Chờ duyệt ngân sách.', helpUserId: gvMB.userId, on: '2026-09-14', reviewOn: '2026-09-10',
    }), /ngày xem lại/i, 'Ngày xem lại trước ngày cập nhật phải 400');
  });

  check('PR-Ra Q10 · Tạm ngưng đủ ba ý → lưu help_user_id/help_name; rời Tạm ngưng thì cả hai về NULL; helpUserId là HV/tài khoản khoá → 400', () => {
    const v = taoViecRa();
    mgmt.updateMgmtTask(P.mbManager, v.id, {
      progress: 'paused', reason: 'Chờ duyệt ngân sách.', helpUserId: gvMB.userId, on: '2026-09-14', reviewOn: '2026-09-20',
    });
    const d1 = mgmt.mgmtTaskDetail(P.mbManager, v.id);
    assert(d1.helpUserId === gvMB.userId && d1.reviewOn === '2026-09-20', `Chưa lưu đúng người/ngày xem lại: ${JSON.stringify({ helpUserId: d1.helpUserId, reviewOn: d1.reviewOn })}`);

    assertThrows(() => mgmt.updateMgmtTask(P.mbManager, v.id, {
      progress: 'paused', reason: 'Thử lại.', helpUserId: motHocVien, on: '2026-09-14', reviewOn: '2026-09-20',
    }), /không hợp lệ/i, 'helpUserId là học viên phải 400');
    assertThrows(() => mgmt.updateMgmtTask(P.mbManager, v.id, {
      progress: 'paused', reason: 'Thử lại.', helpUserId: khoaUser, on: '2026-09-14', reviewOn: '2026-09-20',
    }), /không hợp lệ/i, 'helpUserId là tài khoản đã khoá phải 400');

    mgmt.updateMgmtTask(P.mbManager, v.id, { progress: 'doing', on: '2026-09-14', note: 'Tiếp tục làm.' });
    const d2 = mgmt.mgmtTaskDetail(P.mbManager, v.id);
    assert(d2.helpUserId === null && d2.helpName === null, `Rời Tạm ngưng phải xoá cả hai: ${JSON.stringify({ helpUserId: d2.helpUserId, helpName: d2.helpName })}`);
  });

  check('PR-Ra Q9 · Dời hạn không lý do → 400; có lý do → task_history đúng old/new/reason và hanGoc = hạn đầu tiên; quá hạn tính theo hạn hiện tại', () => {
    const v = taoViecRa({ due: '2026-09-01' });   // đã quá hạn so với TODAY = 2026-09-14
    assertThrows(() => mgmt.editMgmtTask(P.mbManager, v.id, { due: '2026-09-20' }), /lý do/i, 'Dời hạn không lý do phải 400');
    mgmt.editMgmtTask(P.mbManager, v.id, { due: '2026-09-08', lyDoDoiHan: 'Chờ duyệt ngân sách nhà cung cấp.' });
    let row = mgmt.listMgmtTasks(P.mbManager, {}).rows.find((r: any) => r.id === v.id);
    assert(row.hanGoc === '2026-09-01' && row.lyDoDoiHan === 'Chờ duyệt ngân sách nhà cung cấp.',
      `hanGoc/lyDoDoiHan sai sau lần dời đầu: ${JSON.stringify({ hanGoc: row.hanGoc, lyDoDoiHan: row.lyDoDoiHan })}`);
    assert(row.overdue === true, 'Hạn 08/09 vẫn quá hạn so với TODAY 14/09');
    const hist = (conn.prepare(`SELECT * FROM task_history WHERE task_id = ? AND field = 'due_date' ORDER BY id`).all(v.id) as any[]);
    assert(hist.length === 1 && hist[0].old_value === '2026-09-01' && hist[0].new_value === '2026-09-08' && hist[0].reason === 'Chờ duyệt ngân sách nhà cung cấp.',
      `task_history dời hạn sai: ${JSON.stringify(hist)}`);

    /* Dời hạn LẦN HAI, sang tương lai — hanGoc vẫn là hạn ĐẦU TIÊN (01/09), quá hạn hết vì hạn hiện tại ở tương lai. */
    mgmt.editMgmtTask(P.mbManager, v.id, { due: '2026-10-05', lyDoDoiHan: 'Chờ nhà cung cấp báo giá lại.' });
    row = mgmt.listMgmtTasks(P.mbManager, {}).rows.find((r: any) => r.id === v.id);
    assert(row.hanGoc === '2026-09-01' && row.soLanDoiHan === 2, `Sau hai lần dời, hanGoc phải vẫn là hạn đầu tiên: ${JSON.stringify(row)}`);
    assert(row.overdue === false, 'Dời hạn sang tương lai phải hết quá hạn (tính theo hạn hiện tại, Q9)');
  });

  check('PR-Ra Q11 · Dừng hẳn việc cha còn việc con mở → 400, câu báo nêu tên việc con', () => {
    const parent = taoViecRa({ title: 'Cha PR-Ra còn con mở' });
    const child = taoViecRa({ title: 'Con PR-Ra chưa xong', parentTaskId: parent.id });
    void child;
    assertThrows(() => mgmt.updateMgmtTask(P.mbManager, parent.id, { progress: 'stopped', reason: 'Không làm nữa.' }),
      /Con PR-Ra chưa xong/, 'Dừng hẳn việc cha còn con mở phải 400 kèm tên việc con');
  });

  check('PR-Ra · facetVanHanh qua listMgmtTasks: facet nhóm KHÔNG đổi khi chọn nhóm, CÓ áp lọc trạng thái khi chọn trạng thái', () => {
    /* Dựng thêm hai việc CÙNG nhóm, KHÁC trạng thái — đảm bảo có dữ liệu để phân biệt hai lượt lọc. */
    const a = taoViecRa({ title: 'Facet A — doing', group: 'curriculum' });
    mgmt.updateMgmtTask(P.mbManager, a.id, { progress: 'doing', on: '2026-09-14', note: 'Đang làm.' });
    taoViecRa({ title: 'Facet B — not_started', group: 'curriculum' });

    const all = mgmt.listMgmtTasks(P.mbManager, {}) as any;
    const byGroup = mgmt.listMgmtTasks(P.mbManager, { group: 'curriculum' }) as any;
    for (const g of Object.keys(all.facets.group)) {
      assert(byGroup.facets.group[g] === all.facets.group[g],
        `Chọn nhóm "curriculum" làm facet nhóm "${g}" đổi từ ${all.facets.group[g]} thành ${byGroup.facets.group[g]}`);
    }

    const byProgress = mgmt.listMgmtTasks(P.mbManager, { progress: 'doing' }) as any;
    assert(byProgress.facets.group.curriculum <= all.facets.group.curriculum,
      'Facet nhóm khi lọc trạng thái "doing" phải KHÔNG lớn hơn khi không lọc gì (facet nhóm vẫn áp trạng thái đang chọn)');
    assert(byProgress.facets.group.curriculum < all.facets.group.curriculum,
      'Facet nhóm phải giảm khi lọc "doing" — có việc "not_started" cùng nhóm bị loại ra');
  });

  check('PR-Ra · progress mặc định "mo": không có việc đã khép; hangSo.vuaXong vẫn đếm việc hoàn thành dù đang lọc "mo"', () => {
    const done = taoViecRa({ title: 'Việc vừa xong PR-Ra' });
    mgmt.updateMgmtTask(P.mbManager, done.id, { progress: 'done', on: '2026-09-14', note: 'Xong rồi.' });
    const mo = mgmt.listMgmtTasks(P.mbManager, { progress: 'mo' }) as any;
    assert(!mo.rows.some((r: any) => r.progress === 'done' || r.progress === 'stopped'), 'progress="mo" không được có việc đã khép trong danh sách');
    assert(mo.hangSo['vua-xong'] >= 1, `hangSo (áp CHỈ nhóm, bỏ qua "mo") vẫn phải đếm việc vừa hoàn thành: ${JSON.stringify(mo.hangSo)}`);
  });

  check('PR-Ra G-10 · bấm hàng số "vừa hoàn thành" (progress=tat-ca kèm theo, đúng như giao diện gửi) — số dòng bảng phải bằng đúng hàng số', () => {
    const done = taoViecRa({ title: 'Việc vừa xong PR-Ra G-10' });
    mgmt.updateMgmtTask(P.mbManager, done.id, { progress: 'done', on: '2026-09-14', note: 'Xong rồi.' });
    const vuaXong = mgmt.listMgmtTasks(P.mbManager, { hang: 'vua-xong', progress: 'tat-ca' }) as any;
    assert(vuaXong.rows.length === vuaXong.hangSo['vua-xong'],
      `Bảng phải có đúng ${vuaXong.hangSo['vua-xong']} dòng "vừa hoàn thành", có ${vuaXong.rows.length}`);
    assert(vuaXong.rows.some((r: any) => r.id === done.id), 'Việc vừa đánh dấu hoàn thành phải có trong bảng khi lọc hàng "vừa hoàn thành"');
    /*
     * `listMgmtTasks(p, {hang:'vua-xong'})` KHÔNG lặp lại được lỗi — hàm dịch vụ mặc định
     * `progress` thiếu thành 'tat-ca' (dòng ~187, "giữ nghĩa cũ"), CHỈ tuyến `GET /mgmt-tasks`
     * mới tự điền 'mo' khi không gửi progress. Phải truyền progress:'mo' TƯỜNG MINH mới đúng
     * mô phỏng hành vi cũ của giao diện (trước khi sửa) — vẫn còn cho ai gọi hàm này mà thiếu
     * progress=tat-ca sau này biết ngay bảng sẽ rỗng.
     */
    const vuaXongProgressMo = mgmt.listMgmtTasks(P.mbManager, { hang: 'vua-xong', progress: 'mo' }) as any;
    assert(vuaXongProgressMo.rows.length === 0,
      'progress="mo" tường minh (như tuyến GET /mgmt-tasks tự điền khi thiếu) kèm hang="vua-xong" thì bảng rỗng — đúng là lỗi G-10 đã sửa ở giao diện (luôn gửi trangThai=tat-ca khi bấm hàng số), không phải hàm dịch vụ tự bỏ qua progress');
  });

  check('PR-Ra · subOverdueTitles có đúng tên việc con quá hạn (tối đa 2)', () => {
    const parent = taoViecRa({ title: 'Cha PR-Ra có con quá hạn', due: '2026-12-01' });
    taoViecRa({ title: 'Con quá hạn A', parentTaskId: parent.id, due: '2026-09-01' });
    taoViecRa({ title: 'Con quá hạn B', parentTaskId: parent.id, due: '2026-09-02' });
    const row = mgmt.listMgmtTasks(P.mbManager, {}).rows.find((r: any) => r.id === parent.id);
    assert(row.subOverdueCount === 2, `subOverdueCount sai: ${row.subOverdueCount}`);
    assert(row.subOverdueTitles.includes('Con quá hạn A') && row.subOverdueTitles.includes('Con quá hạn B'),
      `subOverdueTitles thiếu tên: ${JSON.stringify(row.subOverdueTitles)}`);
  });

  check('PR-Ra R6 · createMgmtTask với unitReportId khác chi nhánh đơn vị → 400; đúng chi nhánh → có dòng unit_report_task_links', () => {
    /* Đơn vị MB cố tình để TRỐNG ở kỳ hiện tại trong bộ demo (Q12 "Chưa báo cáo") — dùng CP để có ô báo cáo thật. */
    const cpUnit = (conn.prepare(`SELECT id FROM reporting_units WHERE code = 'CP'`).get() as any).id as number;
    const cpBranchId = (conn.prepare(`SELECT id FROM branches WHERE code = 'CP'`).get() as any).id as number;
    const cur = week.ensurePeriod(TODAY).id;
    const cpReport = (conn.prepare(
      `SELECT id FROM unit_reports WHERE reporting_unit_id = ? AND period_id = ? ORDER BY id LIMIT 1`,
    ).get(cpUnit, cur) as any)?.id as number | undefined;
    assert(cpReport, 'Cần một ô báo cáo của CP ở kỳ hiện tại để đối chứng');
    assertThrows(() => mgmt.createMgmtTask(P.mbManager, {
      title: 'Việc từ báo cáo khác chi nhánh', group: 'teacher', branchId: mbBranchId, unitReportId: cpReport,
    }), /chi nhánh/i, 'Việc khác chi nhánh với báo cáo phải 400');

    const created = mgmt.createMgmtTask(P.admin, {
      title: 'Việc từ báo cáo CP', group: 'teacher', branchId: cpBranchId, unitReportId: cpReport,
    });
    const link = conn.prepare(`SELECT * FROM unit_report_task_links WHERE unit_report_id = ? AND task_id = ?`).get(cpReport, created.id);
    assert(link, 'createMgmtTask với unitReportId đúng chi nhánh phải tạo dòng nối');
  });

  check('PR-Ra · createMgmtTask/editMgmtTask: assigneeUserId không hợp lệ (học viên) → 400', () => {
    assertThrows(() => mgmt.createMgmtTask(P.mbManager, {
      title: 'Việc gán sai người', group: 'teacher', branchId: mbBranchId, assigneeUserId: motHocVien,
    }), /không hợp lệ/i, 'Tạo việc với assigneeUserId là học viên phải 400');
    const v = taoViecRa();
    assertThrows(() => mgmt.editMgmtTask(P.mbManager, v.id, { assigneeUserId: motHocVien }),
      /không hợp lệ/i, 'Sửa việc với assigneeUserId là học viên phải 400');
  });

  // ================================================================== 6. Máy chủ: Báo cáo đơn vị

  console.log('\nPR-Ra · 6. Máy chủ Báo cáo đơn vị — nháp/nộp theo D04, nối việc thật, bằng chứng, gộp truy vấn');

  const meetingSvc: any = await import('../worklist/meeting.ts');
  const attachmentSvc: any = await import('../platform/attachments.ts');
  const signalsSvc: any = await import('../worklist/signals.ts');

  const curPeriodId = week.ensurePeriod(TODAY).id;   // W3 SEP — chưa tới cửa sổ (mở từ 19/09), nhưng ĐÃ bắt đầu (14/09).
  const prevPeriodId = (conn.prepare(`SELECT id FROM report_periods WHERE week_start < ? ORDER BY week_start DESC LIMIT 1`).get(TODAY) as any).id as number;
  const mbUnit = (conn.prepare(`SELECT * FROM reporting_units WHERE code = 'MB'`).get() as any);
  const bcUnit = (conn.prepare(`SELECT * FROM reporting_units WHERE code = 'BC'`).get() as any);

  const demTruyVan = (fn: () => void): number => {
    let n = 0;
    const orig = conn.prepare.bind(conn);
    (conn as any).prepare = (sql: string) => { n += 1; return orig(sql); };
    try { fn(); } finally { (conn as any).prepare = orig; }
    return n;
  };

  /*
   * ĐẶT TRƯỚC MỌI PHÉP KIỂM KHÁC trong mục này: các phép kiểm dưới đây NỘP/SỬA báo cáo của
   * MB và BC ở đúng hai kỳ này, nên phải soi ĐÚNG dữ liệu bộ demo trước khi bất kỳ ai đụng vào.
   */
  check('PR-Ra Q12 · meetingBoard: đơn vị đủ 3 ô nộp → Đã nộp; có nháp/thiếu → Nháp · chưa nộp kèm "đã nộp n/3"; trống → Chưa báo cáo', () => {
    const prevBoard = meetingSvc.meetingBoard(P.admin, prevPeriodId) as any;
    const mbPrevRow = prevBoard.units.find((u: any) => u.unitId === mbUnit.id);
    assert(mbPrevRow.trangThai.ma === 'da-nop', `Kỳ trước (mọi ô đã nộp theo bộ demo) phải là Đã nộp: ${JSON.stringify(mbPrevRow.trangThai)}`);

    const curBoard = meetingSvc.meetingBoard(P.admin, curPeriodId) as any;
    const mbCurRow = curBoard.units.find((u: any) => u.unitId === mbUnit.id);
    assert(mbCurRow.trangThai.ma === 'chua', `MB cố tình bỏ trống ở kỳ hiện tại (bộ demo Q12) phải là Chưa báo cáo: ${JSON.stringify(mbCurRow.trangThai)}`);

    const bcCurRow = curBoard.units.find((u: any) => u.unitId === bcUnit.id);
    assert(bcCurRow.trangThai.ma === 'nhap' && bcCurRow.trangThai.phu === 'đã nộp 2/3',
      `BC kỳ hiện tại (bộ demo: hai ô đã nộp, một ô chưa báo) phải là Nháp kèm "đã nộp 2/3": ${JSON.stringify(bcCurRow.trangThai)}`);
  });

  check('PR-Ra Q13 · Nháp khi cửa sổ đóng vẫn lưu được (tuần đã bắt đầu) — submitted_at NULL', () => {
    const saved = meetingSvc.saveUnitReport(P.mbManager, mbUnit.id, curPeriodId, 'curriculum', { status: 'watch', note: 'Đang theo dõi tiến độ giáo trình mới.' });
    assert(saved.submitted_at === null, `Lưu nháp không được tự thành đã nộp: ${JSON.stringify(saved)}`);
  });

  check('PR-Ra Q13 · Nộp ngoài cửa sổ → 400; nộp không mức → 400; nộp trong cửa sổ → đã nộp, history kind="nop"', () => {
    assertThrows(() => meetingSvc.saveUnitReport(P.mbManager, mbUnit.id, curPeriodId, 'curriculum', { status: 'watch', nop: true }),
      /mở từ|quá hạn|Quản trị hệ thống/, 'Nộp ngoài cửa sổ (tuần chưa tới cửa sổ) phải 400');

    /* Kỳ TRƯỚC (W2 SEP) đang trong hai ngày bù, cửa sổ đang MỞ. */
    const emptyCat = 'students';
    conn.prepare(`DELETE FROM unit_reports WHERE reporting_unit_id = ? AND period_id = ? AND category_key = ?`).run(mbUnit.id, prevPeriodId, emptyCat);
    assertThrows(() => meetingSvc.saveUnitReport(P.mbManager, mbUnit.id, prevPeriodId, emptyCat, { nop: true }),
      /Chọn mức/i, 'Nộp không mức phải 400');

    const submitted = meetingSvc.saveUnitReport(P.mbManager, mbUnit.id, prevPeriodId, emptyCat, { status: 'ok', nop: true });
    assert(submitted.submitted_at, 'Nộp trong cửa sổ phải ghi submitted_at');
    const hist = conn.prepare(
      `SELECT * FROM unit_report_history WHERE reporting_unit_id = ? AND period_id = ? AND category_key = ? ORDER BY id DESC LIMIT 1`,
    ).get(mbUnit.id, prevPeriodId, emptyCat) as any;
    assert(hist.kind === 'nop', `Lịch sử của lần nộp phải ghi kind='nop': ${JSON.stringify(hist)}`);
  });

  check('PR-Ra Q13 · Sửa ô đã nộp: trong cửa sổ → thành nháp; ngoài cửa sổ → 400 (không được "rút" báo cáo)', () => {
    const cat = 'teachers';
    meetingSvc.saveUnitReport(P.mbManager, mbUnit.id, prevPeriodId, cat, { status: 'ok', nop: true });   // đảm bảo đã nộp
    const back = meetingSvc.saveUnitReport(P.mbManager, mbUnit.id, prevPeriodId, cat, { status: 'watch' });   // sửa, không nộp lại
    assert(back.submitted_at === null, 'Sửa ô đã nộp trong cửa sổ phải thành nháp (submitted_at NULL)');

    /* Một tuần đã khoá hẳn: unlock tạm để nộp, khoá lại, rồi thử sửa (không nộp lại) → 400. */
    const old = conn.prepare(`SELECT * FROM report_periods WHERE week_end < ? ORDER BY week_end DESC LIMIT 1`).get(addDaysStr(TODAY, -10)) as any;
    assert(old, 'Cần một tuần đã khoá hẳn để đối chứng');
    week.setPeriodUnlocked(old.id, true, P.admin.userId);
    meetingSvc.saveUnitReport(P.admin, mbUnit.id, old.id, 'curriculum', { status: 'ok', nop: true });
    week.setPeriodUnlocked(old.id, false, P.admin.userId);
    assertThrows(() => meetingSvc.saveUnitReport(P.admin, mbUnit.id, old.id, 'curriculum', { status: 'watch' }),
      /đã nộp và tuần đã khoá/i, 'Sửa ô đã nộp ngoài cửa sổ phải 400');
  });

  check('PR-Ra · Tuần tương lai vẫn từ chối cả nháp lẫn nộp (giữ luật cũ)', () => {
    const future = conn.prepare(`SELECT * FROM report_periods WHERE week_start > ? ORDER BY week_start DESC LIMIT 1`).get(TODAY) as any;
    if (future) {
      assertThrows(() => meetingSvc.saveUnitReport(P.mbManager, mbUnit.id, future.id, 'teachers', { status: 'ok' }),
        /chưa bắt đầu|chưa có gì/, 'Tuần tương lai (nháp) phải bị chặn');
    }
  });

  check('PR-Ra R6 · meetingBoard: nối việc khác chi nhánh → 400; đúng chi nhánh → hiện ở linkedTasks', () => {
    const cpUnit = (conn.prepare(`SELECT id FROM reporting_units WHERE code = 'CP'`).get() as any).id as number;
    const cpBranchId = (conn.prepare(`SELECT id FROM branches WHERE code = 'CP'`).get() as any).id as number;
    const cpReport = (conn.prepare(
      `SELECT id FROM unit_reports WHERE reporting_unit_id = ? AND period_id = ? ORDER BY id LIMIT 1`,
    ).get(cpUnit, curPeriodId) as any)?.id as number | undefined;
    assert(cpReport, 'Cần một ô báo cáo của CP ở kỳ hiện tại để đối chứng');

    const mbTask = mgmt.createMgmtTask(P.mbManager, { title: 'Việc thử nối báo cáo (MB)', group: 'teacher', branchId: mbBranchId });
    /* Dùng P.admin (mọi phạm vi) để phép thử này chạm đúng luật "khác chi nhánh" — không lẫn với luật quyền của QL từng chi nhánh. */
    assertThrows(() => meetingSvc.linkReportTask(P.admin, cpReport, mbTask.id), /chi nhánh/i, 'Nối việc khác chi nhánh với báo cáo phải 400');

    const cpTask = mgmt.createMgmtTask(P.admin, { title: 'Việc thử nối báo cáo (CP)', group: 'teacher', branchId: cpBranchId });
    meetingSvc.linkReportTask(P.admin, cpReport, cpTask.id);
    const board = meetingSvc.meetingBoard(P.admin, curPeriodId) as any;
    const cpRow = board.units.find((u: any) => u.unitId === cpUnit);
    const cell = cpRow.cells.find((c: any) => c.reportId === cpReport);
    assert(cell.linkedTasks.some((t: any) => t.id === cpTask.id), `Việc vừa nối phải hiện ở linkedTasks: ${JSON.stringify(cell.linkedTasks)}`);

    meetingSvc.unlinkReportTask(P.admin, cpReport, cpTask.id);
    const board2 = meetingSvc.meetingBoard(P.admin, curPeriodId) as any;
    const cell2 = board2.units.find((u: any) => u.unitId === cpUnit).cells.find((c: any) => c.reportId === cpReport);
    assert(!cell2.linkedTasks.some((t: any) => t.id === cpTask.id), 'Gỡ nối rồi vẫn còn trong linkedTasks');
  });

  check('PR-Ra Q15 · Đính kèm bằng chứng owner_type="unit_report": Quản lý sửa được, GV bị 403', () => {
    const reportId = (conn.prepare(`SELECT id FROM unit_reports WHERE reporting_unit_id = ? AND period_id = ? LIMIT 1`).get(mbUnit.id, prevPeriodId) as any).id as number;
    const ok = attachmentSvc.addLink(P.mbManager, { ownerType: 'unit_report', ownerId: reportId, url: 'https://example.com/bang-chung-pr-ra' });
    assert(ok.ownerType === 'unit_report' && ok.ownerId === reportId, 'Quản lý phải đính kèm được bằng chứng cho báo cáo đơn vị');
    assertThrows(() => attachmentSvc.addLink(gvMB, { ownerType: 'unit_report', ownerId: reportId, url: 'https://example.com/khac' }),
      /quyền/i, 'Giáo viên đính kèm bằng chứng báo cáo đơn vị phải 403');
  });

  check('PR-Ra Q13 · Tín hiệu report_due KHÔNG đếm ô nháp là "đã báo cáo"', () => {
    /*
     * `report_due` đếm ĐƠN VỊ không còn ô nào đã nộp (không phải đếm từng ô) — sửa CẢ BA hạng
     * mục của MB về nháp (mọi ô của bộ demo đã nộp sẵn ở kỳ trước) để đơn vị này không còn ô
     * đã nộp nào, rồi kiểm tín hiệu vẫn phải thấy MB còn thiếu — dù cả ba ô đều CÓ mức (nháp),
     * không phải trống trơn.
     */
    for (const cat of ['teachers', 'students', 'curriculum']) {
      meetingSvc.saveUnitReport(P.admin, mbUnit.id, prevPeriodId, cat, { status: 'watch' });   // không nop → thành nháp
    }
    const rows = signalsSvc.signalsFor(P.admin, { periodId: prevPeriodId }) as any[];
    const due = rows.find((r: any) => r.kind === 'report_due' && r.branchId === mbBranchId);
    assert(due && due.count >= 1, `MB không còn ô nào đã nộp (chỉ còn nháp) — report_due phải vẫn đếm thiếu: ${JSON.stringify(rows.filter((r) => r.kind === 'report_due'))}`);
  });

  check('PR-Ra · meetingBoard: số câu SQL không tăng theo số đơn vị (N+1)', () => {
    const truoc = demTruyVan(() => { meetingSvc.meetingBoard(P.admin, curPeriodId); });
    conn.prepare(`INSERT INTO reporting_units (code, name, kind, branch_id, seq, status) VALUES ('PR-RA-TMP','Đơn vị tạm PR-Ra','branch',?,99,'active')`).run(mbBranchId);
    const sau = demTruyVan(() => { meetingSvc.meetingBoard(P.admin, curPeriodId); });
    assert(sau <= truoc + 1, `Thêm một đơn vị khiến meetingBoard tăng từ ${truoc} lên ${sau} câu lệnh — nghi vấn N+1`);
  });
}

function addDaysStr(iso: string, n: number): string {
  const DAY_MS = 86_400_000;
  return new Date(Date.parse(`${iso}T00:00:00Z`) + n * DAY_MS).toISOString().slice(0, 10);
}
