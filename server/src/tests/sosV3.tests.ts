/**
 * PHÉP KIỂM PR-T — rulebook v3 (21/09/2026 tối): SOS tự tạo Case · Phối hợp SOS · xoá vi phạm.
 *
 * Đặc tả: `thiet-ke/SOS_VA_PHOI_HOP_V3.md`. Tên mỗi phép kiểm bắt đầu bằng MÃ LUẬT (S01–S09, P01–P10, V11′–V14′) để tìm bằng tay.
 * Harness (`check`, `assert`, bộ demo, tài khoản mẫu) do `run.ts` sở hữu và truyền vào — file này không tự mở database.
 *
 * Quy ước TDD của file này: mọi mô-đun mới được nạp bằng `load(...)` — thiếu mô-đun thì phép kiểm ĐỎ với câu nói rõ thiếu gì,
 * không làm sập cả bộ.
 */
import type { YThucTestKit } from './yThuc.tests.ts';

export async function runSosV3Tests(t: YThucTestKit) {
  const { check, assert } = t;
  const domain: any = await import('../../../shared/domain/index.ts');
  const cases: any = await import('../cases/cases.ts');
  const load = async (path: string): Promise<any> =>
    import(path).catch((e) => new Proxy({}, { get: (_x, k) => { throw new Error(`Chưa có mô-đun ${path} (${String(k)}) — ${e.message}`); } }));

  // ================================================================== T1 — bảng tra thuần

  console.log('\nPR-T · 1. Bảng tra thuần (shared/domain/sos.ts) — T1');

  const SOS_LEVELS = [1, 2, 3] as const;
  const MTS = [1, 2, 3, 4, 5] as const;

  check('PR-T · T1 DEFAULT_ACADEMIC_SUPPORT đủ 5 MT × 3 mức SOS, mỗi ô có loại phương án + nhãn thời hạn', () => {
    for (const mt of MTS) for (const lv of SOS_LEVELS) {
      const cell = domain.academicSupportFor(mt, lv);
      assert(cell && cell.kind && cell.span && cell.description, `Thiếu ô MT${mt} × SOS${lv}: ${JSON.stringify(cell)}`);
    }
  });

  check('PR-T · T1 Bảng phương án điền sẵn đúng §4: MT1/MT2 SOS1–2 Tự học 1 tháng · SOS3 Tutor đến MT kế · MT3/MT4 Tutor đến lúc thi · MT5+ Khác cần xác nhận', () => {
    const cell = (mt: number, lv: number) => domain.academicSupportFor(mt, lv);
    for (const mt of [1, 2]) {
      for (const lv of [1, 2]) assert(cell(mt, lv).kind === 'self_study' && cell(mt, lv).span === 'one_month' && cell(mt, lv).description === 'Tự học · 1 tháng', `MT${mt} SOS${lv}: ${JSON.stringify(cell(mt, lv))}`);
      assert(cell(mt, 3).kind === 'tutor' && cell(mt, 3).span === 'until_next_mt' && cell(mt, 3).description === `Tutor · đến MT${mt + 1}`, `MT${mt} SOS3: ${JSON.stringify(cell(mt, 3))}`);
    }
    for (const mt of [3, 4]) for (const lv of SOS_LEVELS) {
      assert(cell(mt, lv).kind === 'tutor' && cell(mt, lv).span === 'until_exam' && cell(mt, lv).description === 'Tutor · đến lúc thi', `MT${mt} SOS${lv}: ${JSON.stringify(cell(mt, lv))}`);
    }
    for (const mt of [5, 6, 9]) for (const lv of SOS_LEVELS) {
      assert(cell(mt, lv).kind === 'other_proposal' && cell(mt, lv).span === 'expert'
        && cell(mt, lv).description === 'Hỗ trợ chuyên môn — cần GVBM/P. Học thuật xác nhận', `MT${mt} SOS${lv}: ${JSON.stringify(cell(mt, lv))}`);
    }
  });

  check('PR-T · T1 Nhãn loại phương án điền sẵn trùng nhãn hệ thống đang dùng (Xếp tự học · Học tutor · Khác)', () => {
    assert(domain.INTERVENTION_KIND_LABEL[domain.academicSupportFor(1, 1).kind] === 'Xếp tự học', 'self_study');
    assert(domain.INTERVENTION_KIND_LABEL[domain.academicSupportFor(1, 3).kind] === 'Học tutor', 'tutor');
    assert(domain.INTERVENTION_KIND_LABEL[domain.academicSupportFor(5, 1).kind] === 'Khác', 'Khác');
  });

  check('PR-T · T1 Mức SOS 0 hoặc ngoài 1–3 không có phương án điền sẵn; số MT nhỏ hơn 1 bị từ chối', () => {
    assert(domain.academicSupportFor(1, 0) === null && domain.academicSupportFor(2, 4) === null, 'Ngoài 1–3 phải trả null');
    assert(domain.sosCoordinationFor(1, 0).length === 0, 'SOS 0 không có việc phối hợp');
    let threw = false;
    try { domain.academicSupportFor(0, 1); } catch { threw = true; }
    assert(threw, 'MT0 không tồn tại — phải từ chối');
  });

  check('PR-T · T1 DEFAULT_SOS_COORDINATION đủ 5 MT × 3 mức, đúng bảng §5.3 (dấu + là cộng thêm vào cột bên trái)', () => {
    const ks = (mt: number, lv: number) => domain.sosCoordinationFor(mt, lv).join(',');
    const HSGD = 'talk_student,talk_family';
    for (const mt of MTS) assert(ks(mt, 1) === HSGD, `MT${mt} SOS1: ${ks(mt, 1)}`);
    assert(ks(1, 2) === HSGD, `MT1 SOS2 vẫn chỉ HS + gia đình: ${ks(1, 2)}`);
    assert(ks(1, 3) === `${HSGD},gvcn_meeting`, `MT1 SOS3: ${ks(1, 3)}`);
    assert(ks(2, 2) === `${HSGD},gvcn_meeting` && ks(2, 3) === `${HSGD},gvcn_meeting,cx_meeting_student`, `MT2: ${ks(2, 2)} | ${ks(2, 3)}`);
    assert(ks(3, 2) === `${HSGD},gvcn_meeting` && ks(3, 3) === `${HSGD},gvcn_meeting,cx_meeting_family`, `MT3: ${ks(3, 2)} | ${ks(3, 3)}`);
    for (const mt of [4, 5, 6, 12]) {
      assert(ks(mt, 2) === `${HSGD},gvcn_meeting` && ks(mt, 3) === `${HSGD},gvcn_meeting,cx_meeting_student`, `MT${mt}: ${ks(mt, 2)} | ${ks(mt, 3)}`);
    }
  });

  check('PR-T · T1 MT3 SOS3 là dòng DUY NHẤT có cx_meeting_family (meeting có phụ huynh)', () => {
    const hits: string[] = [];
    for (const mt of [1, 2, 3, 4, 5, 6]) for (const lv of SOS_LEVELS) {
      if (domain.sosCoordinationFor(mt, lv).includes('cx_meeting_family')) hits.push(`MT${mt}·SOS${lv}`);
    }
    assert(hits.join() === 'MT3·SOS3', `cx_meeting_family xuất hiện ở: ${hits.join() || 'không đâu'}`);
  });

  check('PR-T · T1 Sáu loại việc phối hợp đúng thứ tự + nhãn §5.2; không có `Report cho gia đình` (đó là biện pháp Ý thức)', () => {
    assert(JSON.stringify(domain.COORDINATION_KINDS) === JSON.stringify(
      ['talk_student', 'talk_family', 'gvcn_meeting', 'cx_meeting_student', 'cx_meeting_family', 'other']), `Sáu loại sai: ${domain.COORDINATION_KINDS}`);
    assert(JSON.stringify(domain.COORDINATION_KINDS.map((k: string) => domain.COORDINATION_KIND_LABEL[k])) === JSON.stringify([
      'Trao đổi ngắn với HS', 'Trao đổi với gia đình', 'GVCN meeting với HS', 'CX / GĐCN meeting với HS', 'CX / GĐCN meeting với HS / PH', 'Khác']),
    'Nhãn sáu loại sai');
    assert(!domain.COORDINATION_KINDS.some((k: string) => /report|family_report/.test(k)), 'Không dùng Report cho gia đình');
  });

  check('PR-T · T1 Lý do bỏ việc: bốn lý do chọn nhanh + `system_sos_changed` (chỉ hệ thống dùng); ba lý do đóng case `Không cần theo dõi`', () => {
    assert(JSON.stringify(domain.COORDINATION_USER_REMOVE_REASONS) === JSON.stringify(['not_needed', 'handled_otherwise', 'duplicate_measure', 'other']),
      `Bốn lý do sai: ${domain.COORDINATION_USER_REMOVE_REASONS}`);
    assert(JSON.stringify(domain.COORDINATION_REMOVE_REASONS) === JSON.stringify(['not_needed', 'handled_otherwise', 'duplicate_measure', 'other', 'system_sos_changed']), 'Năm mã lý do');
    assert(domain.COORDINATION_REMOVE_REASON_LABEL.not_needed === 'Không cần trong trường hợp này'
      && domain.COORDINATION_REMOVE_REASON_LABEL.handled_otherwise === 'Đã xử lý theo cách khác'
      && domain.COORDINATION_REMOVE_REASON_LABEL.duplicate_measure === 'Trùng với Biện pháp khác'
      && domain.COORDINATION_REMOVE_REASON_LABEL.other === 'Khác', 'Nhãn bốn lý do sai');
    for (const c of domain.COORDINATION_REMOVE_REASONS) assert(domain.COORDINATION_REMOVE_REASON_LABEL[c], `Thiếu nhãn ${c}`);
    assert(JSON.stringify(domain.CASE_DISMISS_REASONS) === JSON.stringify(['special_circumstance', 'single_incident', 'other']), `Ba lý do đóng case sai: ${domain.CASE_DISMISS_REASONS}`);
    assert(domain.CASE_DISMISS_REASON_LABEL.special_circumstance === 'Học sinh có lý do đặc biệt'
      && domain.CASE_DISMISS_REASON_LABEL.single_incident === 'Tình huống đơn lẻ' && domain.CASE_DISMISS_REASON_LABEL.other === 'Khác', 'Nhãn ba lý do đóng case sai');
    assert(domain.reasonNeedsText('other') && !domain.reasonNeedsText('not_needed') && !domain.reasonNeedsText('single_incident'), 'Chỉ `Khác` mới cần ô chữ');
  });

  check('PR-T · T1 Ngày dự kiến kết thúc (§4): "1 tháng" = Chủ nhật đầu tiên SAU (ngày tạo + 30 ngày); "đến MT kế / lúc thi" chưa có lịch thì để trống', () => {
    /* 21/09/2026 là thứ Hai → +30 = 21/10 (thứ Tư) → Chủ nhật đầu tiên sau đó: 25/10. */
    assert(domain.sosPlanEndDate('one_month', { createdOn: '2026-09-21' }) === '2026-10-25', `Ra ${domain.sosPlanEndDate('one_month', { createdOn: '2026-09-21' })}`);
    /* Biên: +30 rơi đúng Chủ nhật (25/10 − 30 = 25/09) → "sau" nghĩa là Chủ nhật KẾ TIẾP, không phải chính ngày đó. */
    assert(domain.sosPlanEndDate('one_month', { createdOn: '2026-09-25' }) === '2026-11-01', `Ra ${domain.sosPlanEndDate('one_month', { createdOn: '2026-09-25' })}`);
    assert(domain.sosPlanEndDate('until_next_mt', { createdOn: '2026-09-21', nextMtSunday: '2026-11-08' }) === '2026-11-08', 'Có lịch MT kế thì lấy Chủ nhật đó');
    assert(domain.sosPlanEndDate('until_next_mt', { createdOn: '2026-09-21', nextMtSunday: null }) === null, 'Chưa có lịch MT kế thì để trống — không bịa');
    assert(domain.sosPlanEndDate('until_exam', { createdOn: '2026-09-21', examDate: '2027-02-14' }) === '2027-02-14', 'Có ngày thi thì lấy');
    assert(domain.sosPlanEndDate('until_exam', { createdOn: '2026-09-21', examDate: null }) === null, 'Chưa có ngày thi thì để trống');
    assert(domain.sosPlanEndDate('expert', { createdOn: '2026-09-21' }) === null, 'Hỗ trợ chuyên môn không có hạn tự tính');
  });

  check('PR-T · T1 Tóm tắt một lượt Phối hợp: `{done}/{chưa bị bỏ}`; Hoàn thành khi mọi việc done hoặc removed (SUY RA, không lưu)', () => {
    const s = (...st: string[]) => domain.coordinationSummary(st);
    assert(JSON.stringify(s('done', 'done', 'pending')) === JSON.stringify({ done: 2, active: 3, pending: 1, total: 3, complete: false, label: '2/3' }), JSON.stringify(s('done', 'done', 'pending')));
    /* Ví dụ nghiệm thu #7: bỏ một việc thì lượt tính 1/2 thay vì 1/3. */
    assert(s('done', 'removed', 'pending').label === '1/2', `Bỏ một việc: ${s('done', 'removed', 'pending').label}`);
    assert(s('done', 'removed').complete && s('done', 'done').complete, 'Mọi việc done/removed thì hoàn thành');
    assert(!s('pending').complete && !s().complete, 'Còn việc pending, hoặc không có việc nào, thì chưa "hoàn thành"');
  });

  check('PR-T · T1 Trạng thái việc phối hợp và nhãn: pending · done · removed', () => {
    assert(JSON.stringify(domain.COORDINATION_STATUSES) === JSON.stringify(['pending', 'done', 'removed']), 'Ba trạng thái');
    assert(domain.COORDINATION_STATUS_LABEL.pending === 'Cần xử lý' && domain.COORDINATION_STATUS_LABEL.done === 'Đã xong' && domain.COORDINATION_STATUS_LABEL.removed === 'Đã bỏ', 'Nhãn ba trạng thái');
  });

  // ================================================================== T2 — schema + migrate

  console.log('\nPR-T · 2. Schema và nâng cấp database (migrate) — T2');

  const { conn } = t;
  const fsMod = await import('node:fs');
  const pathMod = await import('node:path');
  const { fileURLToPath } = await import('node:url');
  const { default: SqliteDb } = await import('better-sqlite3');
  const migrateMod: any = await import('../migrate.ts');
  const REPO = pathMod.resolve(fileURLToPath(new URL('../../../../', import.meta.url)));
  const SCHEMA = fsMod.readFileSync(pathMod.join(REPO, 'server/src/schema.sql'), 'utf8');
  const colsOf = (db: any, table: string): string[] => (db.prepare(`PRAGMA table_info(${table})`).all() as any[]).map((c) => c.name);
  const indexesOf = (db: any, table: string): string[] => (db.prepare(`PRAGMA index_list(${table})`).all() as any[]).map((i) => i.name);

  check('PR-T · T2 Bảng `sos_coordination_actions` đúng cột §5.1 và có hai chỉ mục tra cứu', () => {
    assert(JSON.stringify(colsOf(conn, 'sos_coordination_actions')) === JSON.stringify([
      'id', 'attempt_id', 'student_id', 'kind', 'custom_name', 'preset', 'status', 'performed_on', 'performed_by', 'performer_name',
      'note', 'remove_reason_code', 'remove_reason_text', 'removed_by', 'removed_at', 'created_at', 'updated_at']),
    `Cột sai: ${colsOf(conn, 'sos_coordination_actions').join(', ')}`);
    const idx = indexesOf(conn, 'sos_coordination_actions');
    assert(idx.includes('idx_sca_attempt') && idx.includes('idx_sca_student'), `Thiếu chỉ mục: ${idx.join(', ')}`);
  });

  check('PR-T · T2 Khoá UNIQUE thật sự chặn trùng (attempt, kind) kể cả khi `custom_name` để trống — SQLite coi mỗi NULL là một giá trị riêng nên DDL gốc của đặc tả không đủ', () => {
    const at = conn.prepare('SELECT id, student_id FROM assessment_attempts ORDER BY id LIMIT 1').get() as any;
    const ins = (kind: string, name: string | null) => conn.prepare(
      `INSERT INTO sos_coordination_actions (attempt_id, student_id, kind, custom_name, created_at) VALUES (?,?,?,?, '2026-09-21T00:00:00.000Z')`).run(at.id, at.student_id, kind, name);
    try {
      ins('talk_student', null);
      let dup = false;
      try { ins('talk_student', null); } catch (e: any) { dup = /UNIQUE/i.test(e.message); }
      assert(dup, 'Hai việc cùng (lượt, loại) với custom_name trống phải bị chặn — không thì "chạy lặp" nhân đôi việc phối hợp (P01)');
      ins('other', 'Gặp riêng phụ huynh');
      let dupOther = false;
      try { ins('other', 'Gặp riêng phụ huynh'); } catch (e: any) { dupOther = /UNIQUE/i.test(e.message); }
      assert(dupOther, 'Hai việc `Khác` cùng tên phải bị chặn');
      ins('other', 'Việc khác nữa');   // tên khác thì được
    } finally {
      conn.prepare('DELETE FROM sos_coordination_actions WHERE attempt_id = ?').run(at.id);
    }
  });

  check('PR-T · T2 `case_interventions` thêm `preset` (mặc định 0) + `confirmed_by`/`confirmed_at`; `sos_cases` thêm `dismiss_reason_code`/`dismiss_reason_text`', () => {
    const ci = colsOf(conn, 'case_interventions'), sc = colsOf(conn, 'sos_cases');
    for (const c of ['preset', 'confirmed_by', 'confirmed_at']) assert(ci.includes(c), `case_interventions thiếu ${c}`);
    for (const c of ['dismiss_reason_code', 'dismiss_reason_text']) assert(sc.includes(c), `sos_cases thiếu ${c}`);
    const def = (conn.prepare('PRAGMA table_info(case_interventions)').all() as any[]).find((c) => c.name === 'preset');
    assert(def.notnull === 1 && String(def.dflt_value) === '0', `preset phải NOT NULL DEFAULT 0: ${JSON.stringify(def)}`);
    assert(!conn.prepare('SELECT 1 FROM case_interventions WHERE preset != 0 LIMIT 1').get(), 'Bộ demo cũ không được có phương án điền sẵn nào ngoài những cái do seed v3 cố ý tạo');
  });

  /** Database THỜI TRƯỚC PR-T: schema hiện tại rồi gỡ đúng những gì PR-T thêm, kèm vài dòng dữ liệu cũ. */
  const preTDatabase = () => {
    const m = new SqliteDb(':memory:');
    m.exec(SCHEMA);
    m.exec(`
      DROP TABLE sos_coordination_actions;
      ALTER TABLE case_interventions DROP COLUMN preset;
      ALTER TABLE case_interventions DROP COLUMN confirmed_by;
      ALTER TABLE case_interventions DROP COLUMN confirmed_at;
      ALTER TABLE sos_cases DROP COLUMN dismiss_reason_code;
      ALTER TABLE sos_cases DROP COLUMN dismiss_reason_text;
    `);
    const NOW = '2026-09-10T00:00:00.000Z';
    const q = (sql: string, ...a: unknown[]) => Number(m.prepare(sql).run(...a).lastInsertRowid);
    q(`INSERT INTO branches (code, name, created_at) VALUES ('MB', 'Monbay', ?)`, NOW);
    q(`INSERT INTO users (id, code, full_name, email, title, password_hash, password_salt, status, created_at) VALUES (1,'NV1','Quản trị','u1@x.vn','GV','h','s','active',?)`, NOW);
    q(`INSERT INTO students (id, student_code, full_name, normalized_name, branch_id, status, created_at) VALUES (1,'PISA1','Em 1','em 1',1,'active',?)`, NOW);
    const caseId = q(`INSERT INTO sos_cases (student_id, topic, category, origin_kind, detected_at, status, created_at) VALUES (1,'reading','reading','teacher_report','2026-09-01','open',?)`, NOW);
    q(`INSERT INTO case_interventions (case_id, kind, description, status, created_at) VALUES (?, 'tutor', 'Học tutor Reading', 'started', ?)`, caseId, NOW);
    return m;
  };

  check('PR-T · T2 `migrateSosV3` trên database cũ: thêm cột + bảng + chỉ mục; dữ liệu cũ giữ nguyên (phương án cũ `preset = 0`, không bị coi là điền sẵn)', () => {
    const m = preTDatabase();
    const applied: string[] = [];
    migrateMod.migrateSosV3(m, applied);
    assert(applied.length >= 1, 'Phải báo đã làm gì');
    assert(colsOf(m, 'case_interventions').includes('preset') && colsOf(m, 'sos_cases').includes('dismiss_reason_text'), 'Thiếu cột sau nâng cấp');
    assert(JSON.stringify(colsOf(m, 'sos_coordination_actions')) === JSON.stringify(colsOf(conn, 'sos_coordination_actions')), 'Bảng nâng cấp phải giống hệt schema.sql');
    assert(indexesOf(m, 'sos_coordination_actions').includes('idx_sca_attempt'), 'Thiếu chỉ mục');
    const iv = m.prepare('SELECT preset, confirmed_at, status FROM case_interventions').get() as any;
    assert(iv.preset === 0 && iv.confirmed_at === null && iv.status === 'started', `Phương án cũ bị đổi: ${JSON.stringify(iv)}`);
    assert((m.prepare('SELECT COUNT(*) n FROM sos_cases').get() as any).n === 1, 'Case cũ còn nguyên');
  });

  check('PR-T · T2 `migrateSosV3` chạy lặp không lỗi và không làm gì thêm; database dựng từ schema.sql không có gì để nâng cấp', () => {
    const m = preTDatabase();
    migrateMod.migrateSosV3(m, []);
    const again: string[] = [];
    migrateMod.migrateSosV3(m, again);
    assert(again.length === 0, `Lần hai phải không làm gì: ${again.join(' | ')}`);
    const fresh = new SqliteDb(':memory:');
    fresh.exec(SCHEMA);
    const none: string[] = [];
    migrateMod.migrateSosV3(fresh, none);
    assert(none.length === 0, `Database mới không được có gì để nâng cấp: ${none.join(' | ')}`);
  });

  check('PR-T · T2 `migrate()` chạy trọn trên database đang dùng rồi chạy lần hai: lần hai không áp lại bước PR-T', () => {
    migrateMod.migrate();
    const second = migrateMod.migrate();
    assert(!second.applied.some((x: string) => /Phối hợp SOS|điền sẵn|PR-T/.test(x)), `Lần hai áp lại bước PR-T: ${second.applied.join(' | ')}`);
  });

  // ================================================================== T7 — đổi tên mức `Cần chú ý` → `Bình thường`

  console.log('\nPR-T · 3. Đổi tên mức `Cần chú ý` → `Bình thường` (T7) — mã `attention` giữ nguyên');

  check('PR-T · T7 Mã mức `attention` giữ nguyên, nhãn hiển thị là `Bình thường`; `Gấp` không đổi; hai mức chọn được vẫn là attention · urgent', () => {
    assert(JSON.stringify(domain.URGENCY_LEVELS) === JSON.stringify(['attention', 'urgent']), 'Mã mức bị đổi');
    assert(domain.URGENCY_LABEL.attention === 'Bình thường' && domain.URGENCY_LABEL.urgent === 'Gấp', `Nhãn: ${JSON.stringify(domain.URGENCY_LABEL)}`);
    assert(domain.DEFAULT_URGENCY === 'attention', 'Mức mặc định vẫn là attention');
    assert(domain.URGENCY_LABEL.normal === 'Bình thường', 'Mức cũ `normal` (đã đổi sang attention khi nâng cấp) cũng đọc ra Bình thường, không ra mã thô');
  });

  check('PR-T · T7 Máy chủ báo lỗi mức độ bằng tên mới; mức mặc định của case tạo tay là Bình thường (S09: 5 ngày có phương án, Gấp 3 ngày)', () => {
    let msg = '';
    try { cases.reportIssue(t.P.admin, { studentId: 1, title: 'Kiểm tra tên mức độ', summary: 'Kiểm tra thông báo lỗi khi mức độ không hợp lệ', topic: 'reading', primaryCode: 'student.reading.logic', urgency: 'khong-co' }); }
    catch (e: any) { msg = e.message; }
    assert(/Bình thường hoặc Gấp/.test(msg) && !/Cần chú ý/.test(msg), `Thông báo lỗi: "${msg}"`);
    assert(domain.planDueDate('2026-09-21', 'attention') === '2026-09-25' && domain.planDueDate('2026-09-21', 'urgent') === '2026-09-23',
      'S09: Bình thường 5 ngày (tính cả ngày đầu → 25/09), Gấp 3 ngày (→ 23/09)');
  });

  check('PR-T · T7 Không còn chữ `Cần chú ý` trong mã máy chủ và shared (trừ ghi chú lịch sử của bước nâng cấp và một ghi chú về bộ lọc cũ đã bỏ)', () => {
    const offenders: string[] = [];
    const walk = (dir: string) => {
      for (const e of fsMod.readdirSync(dir, { withFileTypes: true })) {
        const p = pathMod.join(dir, e.name);
        if (e.isDirectory()) { if (e.name !== 'tests') walk(p); continue; }
        if (!/\.ts$/.test(e.name) || ['migrate.ts', 'summary.ts'].includes(e.name)) continue;
        fsMod.readFileSync(p, 'utf8').split('\n').forEach((line, i) => { if (/Cần chú ý/.test(line)) offenders.push(`${pathMod.relative(REPO, p)}:${i + 1}`); });
      }
    };
    walk(pathMod.join(REPO, 'server/src')); walk(pathMod.join(REPO, 'shared'));
    assert(offenders.length === 0, `Còn chữ "Cần chú ý" ở: ${offenders.join(' · ')}`);
  });

  void load;
  void t;
}
