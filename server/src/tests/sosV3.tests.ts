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

  // ================================================================== dữ liệu dùng chung cho các phép kiểm T3–T6

  const attemptsSvc: any = await import('../fasttrack/attempts.ts');
  const weekSvc: any = await import('../platform/week.ts');
  const scoring: any = await import('../fasttrack/scoring.ts');
  const intake: any = await import('../classes/intake.ts');
  const regularSvc: any = await import('../normal/regular.ts');
  const { loadPrincipal } = await import('../permissions.ts');
  const { assertThrows, P, TODAY, addDays } = t;
  const CLASS = t.classId('MB-FT 101');
  const all = (sql: string, ...a: unknown[]) => conn.prepare(sql).all(...a) as any[];
  const get = (sql: string, ...a: unknown[]) => conn.prepare(sql).get(...a) as any;
  const count = (sql: string, ...a: unknown[]) => (get(sql, ...a)?.n ?? 0) as number;

  /** Học viên MỚI, mục tiêu 7.0 (kỳ vọng MT1 6.0 · MT2 6.5 · MT3+ 7.0), riêng cho từng phép kiểm. */
  const makeStudent = (name: string): { id: number; cycleId: number } => {
    intake.commitIntake(P.admin, { classId: CLASS, rows: [{ fullName: `PT ${name}`, target: 7 }], dateFormat: 'iso', idempotencyKey: `pt-${name}` });
    const st = get('SELECT id FROM students WHERE full_name = ?', `PT ${name}`);
    const cy = get("SELECT id FROM learning_cycles WHERE student_id = ? AND status = 'active'", st.id);
    assert(st && cy, `Không dựng được học viên thử "${name}"`);
    return { id: st.id, cycleId: cy.id };
  };
  /** Tuần đã qua (không phải tương lai) — điểm nhập được ngay. */
  const PAST_WEEK = weekSvc.mondayOf(addDays(TODAY, -14));
  const mkAttempt = (st: { id: number; cycleId: number }, no: number, weekStart: string = PAST_WEEK): any => attemptsSvc.createAttempt(P.admin, {
    studentId: st.id, cycleId: st.cycleId, classId: CLASS, attemptNo: no, periodId: weekSvc.ensurePeriod(weekStart).id });
  const enter = (who: any, a: any, skill: string, band: number) => attemptsSvc.saveScore(who, a.id, skill,
    skill === 'listening' ? { rawScore: scoring.LISTENING_BY_RAW.indexOf(band) }
    : skill === 'reading' ? { rawScore: scoring.READING_BY_RAW.indexOf(band) }
    : { criteria: [band, band, band, band] });
  /** GVBM đang dạy đúng kỹ năng; chưa phân công ai thì GVCN (đúng luật `suggestCaseOwner`). */
  const teacherOf = (skill: string): number => (get("SELECT user_id AS n FROM teacher_assignments WHERE class_id = ? AND skill = ? AND status = 'active' LIMIT 1", CLASS, skill)
    ?? get("SELECT user_id AS n FROM teacher_assignments WHERE class_id = ? AND is_core = 1 AND status = 'active' LIMIT 1", CLASS)).n;
  const casesOf = (sid: number) => all('SELECT * FROM sos_cases WHERE student_id = ? ORDER BY id', sid);
  const caseOf = (sid: number, category: string) => casesOf(sid).find((c) => c.category === category);
  const plansOf = (caseId: number) => all('SELECT * FROM case_interventions WHERE case_id = ? ORDER BY id', caseId);
  const milestonesOf = (caseId: number) => all('SELECT * FROM case_milestones WHERE case_id = ? ORDER BY id', caseId);
  /** Điểm MT2 của §10 mục 1: Writing chỉ W2 dưới + Speaking dưới → SOS2. */
  const scoreMt2 = (a: any) => { enter(P.admin, a, 'writing1', 7); enter(P.admin, a, 'writing2', 5.5); enter(P.admin, a, 'speaking', 5); };

  // ================================================================== T3 — SOS (Mock Test FT) tự tạo / gắn Case

  console.log('\nPR-T · 4. SOS tự tạo hoặc tự gắn Case cho từng kỹ năng trượt (S01–S03, S08, S09) — T3');

  check('PR-T · S01+S02+S03 (§10#1) MT2: chỉ W2 dưới + Speaking dưới → SOS2, đúng HAI case (W2 và Speaking; KHÔNG case W1, KHÔNG case Writing tổng), mỗi case có sẵn phương án `Tự học · 1 tháng` chờ xác nhận', () => {
    const st = makeStudent('S01'); const a = mkAttempt(st, 2);
    scoreMt2(a);
    const cs = casesOf(st.id);
    assert(JSON.stringify(cs.map((c) => c.category).sort()) === JSON.stringify(['speaking', 'writing2']), `Case: ${cs.map((c) => c.category).join()}`);
    for (const c of cs) {
      assert(c.origin_kind === 'mock' && c.status === 'open' && c.attempt_id === a.id && c.sos_level === 2 && c.topic === c.category
        && c.dedup_key === `a:${st.id}:${st.cycleId}:${c.category}`, `Case ${c.category} sai: ${JSON.stringify(c)}`);
      const ivs = plansOf(c.id);
      assert(ivs.length === 1, `Case ${c.category} phải có đúng 1 phương án điền sẵn (S03), có ${ivs.length}`);
      const iv = ivs[0];
      assert(iv.preset === 1 && iv.kind === 'self_study' && iv.description === 'Tự học · 1 tháng' && iv.status === 'planned'
        && iv.confirmed_at === null && iv.confirmed_by === null, `Phương án điền sẵn sai: ${JSON.stringify(iv)}`);
      assert(iv.needs_approval === 0 && iv.approval_state === null, 'Phương án điền sẵn không cần Quản lý duyệt');
      assert(iv.followup_due === domain.sosPlanEndDate('one_month', { createdOn: TODAY }), `followup_due ${iv.followup_due}`);
      assert(iv.action_due === null && iv.cycle_started_on === null && iv.started_date === null,
        'Chưa xác nhận thì CHƯA chạy: không hạn cập nhật tuần, không ngày bắt đầu (Q-V3-3)');
      assert(iv.performer_user_id === teacherOf(c.category) && c.owner_user_id === teacherOf(c.category),
        `Người thực hiện/phụ trách phải là GVBM đúng kỹ năng ${c.category}`);
      assert(milestonesOf(c.id).map((m) => m.kind).join() === 'opened' && milestonesOf(c.id)[0].attempt_id === a.id, 'Case có đúng một mốc "Mở case" từ chính lượt này');
    }
    assert(!casesOf(st.id).some((c) => ['writing1', 'writing'].includes(c.category)), 'Không có case W1 hay Writing tổng');
    /* Dây nối: case_signals `linked`, hạn 3 ngày của S04. */
    const sg = all('SELECT * FROM case_signals WHERE attempt_id = ? ORDER BY skill', a.id);
    assert(sg.length === 2 && sg.every((s) => s.status === 'linked' && s.case_id === caseOf(st.id, s.skill)?.id
      && s.verify_due === domain.signalVerifyDue(TODAY) && s.raised_on === TODAY), `Dây nối sai: ${JSON.stringify(sg)}`);
  });

  check('PR-T · S03 MT1 SOS3 → phương án điền sẵn `Tutor · đến MT2`; chưa có lịch MT2 thì ngày dự kiến để TRỐNG (không bịa)', () => {
    const st = makeStudent('S03a'); const a = mkAttempt(st, 1);
    enter(P.admin, a, 'listening', 5); enter(P.admin, a, 'reading', 5); enter(P.admin, a, 'speaking', 5);
    const cs = casesOf(st.id);
    assert(cs.length === 3, `SOS3 (3 kỹ năng) phải ra 3 case, có ${cs.length}`);
    for (const c of cs) {
      const iv = plansOf(c.id)[0];
      assert(iv.kind === 'tutor' && iv.description === 'Tutor · đến MT2' && iv.preset === 1 && iv.followup_due === null, `${c.category}: ${JSON.stringify(iv)}`);
    }
  });

  check('PR-T · S03 MT1 SOS3 khi MT2 đã có lịch: ngày dự kiến = Chủ nhật của tuần MT2 (tuần kỹ năng muộn nhất)', () => {
    const st = makeStudent('S03b'); const mt2Week = weekSvc.mondayOf(addDays(TODAY, 28));
    const a = mkAttempt(st, 1); mkAttempt(st, 2, mt2Week);
    enter(P.admin, a, 'listening', 5); enter(P.admin, a, 'reading', 5); enter(P.admin, a, 'speaking', 5);
    for (const c of casesOf(st.id)) assert(plansOf(c.id)[0].followup_due === addDays(mt2Week, 6), `${c.category}: ${plansOf(c.id)[0].followup_due}`);
  });

  check('PR-T · S03 MT3 → `Tutor · đến lúc thi`; MT5 → `Khác` chờ GVBM/P. Học thuật xác nhận (loại `other_proposal`, không hạn tự tính)', () => {
    const s3 = makeStudent('S03c'); enter(P.admin, mkAttempt(s3, 3), 'speaking', 5);
    const iv3 = plansOf(caseOf(s3.id, 'speaking').id)[0];
    assert(iv3.kind === 'tutor' && iv3.description === 'Tutor · đến lúc thi' && iv3.preset === 1, JSON.stringify(iv3));
    const s5 = makeStudent('S03d'); enter(P.admin, mkAttempt(s5, 5), 'speaking', 5);
    const iv5 = plansOf(caseOf(s5.id, 'speaking').id)[0];
    assert(iv5.kind === 'other_proposal' && iv5.description === 'Hỗ trợ chuyên môn — cần GVBM/P. Học thuật xác nhận' && iv5.followup_due === null && iv5.preset === 1, JSON.stringify(iv5));
  });

  check('PR-T · S02 Luật Writing hai tầng giữ nguyên: cả hai task dưới → hai case W1 + W2; Writing tổng ĐẠT dù W1 dưới → KHÔNG case nào', () => {
    const both = makeStudent('S02a'); const a1 = mkAttempt(both, 1);
    enter(P.admin, a1, 'writing1', 5); enter(P.admin, a1, 'writing2', 5);
    assert(JSON.stringify(casesOf(both.id).map((c) => c.category).sort()) === JSON.stringify(['writing1', 'writing2']), `Cả hai task: ${casesOf(both.id).map((c) => c.category)}`);
    const pass = makeStudent('S02b'); const a2 = mkAttempt(pass, 1);
    enter(P.admin, a2, 'writing1', 5.5); enter(P.admin, a2, 'writing2', 7);     // Writing = (5.5 + 14) / 3 = 6.5 ≥ 6.0
    assert(casesOf(pass.id).length === 0, `Writing tổng đạt thì không case nào, đang có ${casesOf(pass.id).map((c) => c.category)}`);
  });

  check('PR-T · S01 (§10#2) Nhập lại cùng điểm, lưu thêm kỹ năng khác, chấm lại: KHÔNG nhân đôi case, phương án, mốc, tín hiệu', () => {
    const st = makeStudent('S01re'); const a = mkAttempt(st, 2);
    scoreMt2(a);
    const snap = () => JSON.stringify({
      cases: count('SELECT COUNT(*) n FROM sos_cases WHERE student_id = ?', st.id),
      plans: count('SELECT COUNT(*) n FROM case_interventions WHERE case_id IN (SELECT id FROM sos_cases WHERE student_id = ?)', st.id),
      milestones: count('SELECT COUNT(*) n FROM case_milestones WHERE case_id IN (SELECT id FROM sos_cases WHERE student_id = ?)', st.id),
      signals: count('SELECT COUNT(*) n FROM case_signals WHERE student_id = ?', st.id),
      due: all('SELECT verify_due FROM case_signals WHERE student_id = ? ORDER BY id', st.id).map((s) => s.verify_due),
    });
    const before = snap();
    scoreMt2(a); scoreMt2(a);                         // lưu lại y hệt, hai lần
    enter(P.admin, a, 'listening', 7); enter(P.admin, a, 'reading', 7);  // nhập thêm kỹ năng đạt
    assert(snap() === before, `Chạy lặp làm đổi dữ liệu:\n  trước ${before}\n  sau   ${snap()}`);
    assert(milestonesOf(caseOf(st.id, 'speaking').id).map((m) => m.kind).join() === 'opened', 'Không được có mốc "Trượt lại" cho chính lượt đã mở case');
  });

  check('PR-T · S01 (§10#3) HV đã có case Speaking đang mở, MT3 lại trượt Speaking → GẮN vào case cũ (thêm mốc), KHÔNG tạo case mới, KHÔNG thêm phương án điền sẵn', () => {
    const st = makeStudent('S01link'); const a2 = mkAttempt(st, 2); scoreMt2(a2);
    const old = caseOf(st.id, 'speaking'); const casesBefore = casesOf(st.id).length; const plansBefore = plansOf(old.id).length;
    const a3 = mkAttempt(st, 3, weekSvc.mondayOf(addDays(TODAY, -7)));
    enter(P.admin, a3, 'speaking', 5);
    assert(casesOf(st.id).length === casesBefore, `MT3 tạo thêm case: ${casesOf(st.id).map((c) => c.category)}`);
    assert(plansOf(old.id).length === plansBefore, 'Gắn vào case cũ thì không sinh phương án điền sẵn nữa');
    assert(milestonesOf(old.id).map((m) => `${m.kind}:${m.attempt_id}`).join() === `opened:${a2.id},repeat:${a3.id}`, `Mốc: ${milestonesOf(old.id).map((m) => m.kind + ':' + m.attempt_id)}`);
    const sg = get('SELECT * FROM case_signals WHERE attempt_id = ? AND skill = ?', a3.id, 'speaking');
    assert(sg.status === 'linked' && sg.case_id === old.id, `Tín hiệu MT3 phải nối vào case cũ: ${JSON.stringify(sg)}`);
    assert(get('SELECT attempt_id FROM sos_cases WHERE id = ?', old.id).attempt_id === a3.id, 'Case trỏ tới lượt mới nhất');
  });

  check('PR-T · Q-V3-1 (§10#8) Lớp NORMAL trượt hai môn ở Progress Test: KHÔNG tự tạo case, KHÔNG phương án điền sẵn, KHÔNG Phối hợp SOS — vẫn chỉ là tín hiệu chờ xác minh', () => {
    const regular: any = regularSvc;
    const fou = get("SELECT id FROM classes WHERE code = 'MB-FOU 12'");
    intake.commitIntake(P.admin, { classId: fou.id, rows: [{ fullName: 'PT Normal' }], dateFormat: 'iso', idempotencyKey: 'pt-normal' });
    regular.planRegularTests(P.admin, fou.id);                     // idempotent: chỉ tạo bài còn thiếu cho em mới
    const stu = get("SELECT id FROM students WHERE full_name = 'PT Normal'");
    const attempt = get("SELECT id FROM assessment_attempts WHERE student_id = ? AND kind = 'progress'", stu.id);
    assert(stu && attempt, 'Không dựng được học viên Normal + Progress Test để thử');
    const skills = regular.programmeOfClass(fou.id).skills as string[];
    const before = { cases: count('SELECT COUNT(*) n FROM sos_cases'), plans: count('SELECT COUNT(*) n FROM case_interventions'), coord: count('SELECT COUNT(*) n FROM sos_coordination_actions') };
    skills.forEach((skill, i) => regular.saveRegularScore(P.admin, attempt.id, skill, { score: i < 2 ? 4 : 36, total: 40 }));   // hai môn trượt, hai môn đạt
    assert(count('SELECT COUNT(*) n FROM sos_cases WHERE student_id = ?', stu.id) === 0, 'Lớp Normal đã tự tạo case');
    assert(count('SELECT COUNT(*) n FROM sos_cases') === before.cases && count('SELECT COUNT(*) n FROM case_interventions') === before.plans, 'Lớp Normal đã sinh case hoặc phương án');
    assert(count('SELECT COUNT(*) n FROM sos_coordination_actions') === before.coord && !count('SELECT COUNT(*) n FROM sos_coordination_actions WHERE attempt_id = ?', attempt.id), 'Lớp Normal đã có Phối hợp SOS');
    const sg = all('SELECT * FROM case_signals WHERE attempt_id = ?', attempt.id);
    assert(sg.length === 2 && sg.every((s) => s.status === 'pending' && s.case_id === null), `Mô hình tín hiệu cũ phải còn nguyên: ${JSON.stringify(sg.map((s) => [s.skill, s.status]))}`);
  });

  check('PR-T · S09 Case TẠO TAY giữ luật cũ: không có phương án điền sẵn, không preset; hạn có phương án `Bình thường` 5 ngày · `Gấp` 3 ngày tính cả ngày đầu, từ ngày tạo', () => {
    const st = makeStudent('S09');
    const mk = (urgency: string, topic: string, code: string) => cases.reportIssue(P.admin, {
      studentId: st.id, cycleId: st.cycleId, topic, primaryCode: code, urgency, title: `Case tay ${topic}`, summary: 'Em hay mất tập trung ở phần này của bài, cần theo dõi thêm.' });
    const c1 = mk('attention', 'reading', 'student.reading.logic') as any, c2 = mk('urgent', 'listening', 'student.listening.technique') as any;
    for (const c of [c1, c2]) {
      assert(plansOf(c.id).length === 0 && get('SELECT origin_kind FROM sos_cases WHERE id = ?', c.id).origin_kind === 'teacher_report', 'Case tạo tay không được có phương án điền sẵn');
    }
    assert(domain.PLAN_DUE_DAYS.attention === 5 && domain.PLAN_DUE_DAYS.urgent === 3, 'Hằng số hạn 5/3 ngày');
    assert(domain.planDueDate(TODAY, 'attention') === addDays(TODAY, 4) && domain.planDueDate(TODAY, 'urgent') === addDays(TODAY, 2), 'Tính cả ngày đầu');
  });

  check('PR-T · S08 (§10#4) Sửa điểm Speaking thành đạt: case Speaking CHƯA xác nhận tự huỷ (đóng, phương án điền sẵn huỷ, tín hiệu thu hồi); case W2 vẫn trượt nên còn nguyên', () => {
    const st = makeStudent('S08'); const a = mkAttempt(st, 2); scoreMt2(a);
    const sp = caseOf(st.id, 'speaking'), w2 = caseOf(st.id, 'writing2');
    enter(P.admin, a, 'speaking', 7);                       // sửa điểm: nay đạt
    const spAfter = get('SELECT * FROM sos_cases WHERE id = ?', sp.id);
    assert(spAfter.status === 'done', `Case Speaking phải tự huỷ (đóng), đang ${spAfter.status}`);
    const iv = plansOf(sp.id)[0];
    assert(iv.status === 'cancelled' && iv.closed_reason === 'score_fixed', `Phương án điền sẵn phải huỷ vì sửa điểm: ${JSON.stringify(iv)}`);
    assert(get('SELECT status FROM case_signals WHERE attempt_id = ? AND skill = ?', a.id, 'speaking').status === 'withdrawn', 'Tín hiệu Speaking phải thu hồi');
    assert(get('SELECT status FROM sos_cases WHERE id = ?', w2.id).status === 'open' && plansOf(w2.id)[0].status === 'planned', 'Case W2 còn trượt phải nguyên vẹn');
  });

  check('PR-T · S08 Case đã có căn cứ độc lập (mốc từ đợt khác) thì GIỮ dù điểm nguồn được sửa — không xoá việc đã diễn ra', () => {
    const st = makeStudent('S08b'); const a2 = mkAttempt(st, 2); scoreMt2(a2);
    const a3 = mkAttempt(st, 3, weekSvc.mondayOf(addDays(TODAY, -7)));
    enter(P.admin, a3, 'speaking', 5);                        // MT3 trượt lại → gắn vào case cũ (căn cứ độc lập)
    const sp = caseOf(st.id, 'speaking');
    enter(P.admin, a2, 'speaking', 7);                        // sửa điểm MT2 thành đạt
    assert(get('SELECT status FROM sos_cases WHERE id = ?', sp.id).status !== 'done', 'Case còn mốc MT3 thì không được tự huỷ');
    assert(plansOf(sp.id)[0].status === 'planned', 'Phương án không bị huỷ');
  });

  // ================================================================== T4 — xác nhận / thay / đóng case từ SOS (S04–S07)

  console.log('\nPR-T · 5. Xác nhận · thay · đóng `Không cần theo dõi` case từ SOS (S04–S07) — T4');

  const sosAuto: any = await load('../cases/sosAuto.ts');
  const effectivenessSvc: any = await import('../cases/effectiveness.ts');
  const myworkSvc: any = await import('../worklist/mywork.ts');
  const metricsSvc: any = await import('../worklist/metrics.ts');
  const w2T = P.w2Teacher;        // GVBM Writing 2 của lớp thử (đang phân công)
  const w1T = P.w1Teacher;        // GVBM Writing 1 — KHÁC kỹ năng với case W2

  /** Học viên mới + MT2 (W2 dưới, Speaking dưới) → hai case tự tạo. */
  const freshSos = (name: string) => {
    const st = makeStudent(name); const a = mkAttempt(st, 2); scoreMt2(a);
    const w2 = caseOf(st.id, 'writing2'), sp = caseOf(st.id, 'speaking');
    return { st, a, w2, sp, w2Plan: plansOf(w2.id)[0], spPlan: plansOf(sp.id)[0] };
  };
  const mywork = (who: any) => (myworkSvc.myWork(who, {}).groups as any[]).flatMap((g: any) => g.items ?? []) as any[];

  check('PR-T · S04+S07 GVBM đúng kỹ năng XÁC NHẬN phương án điền sẵn: phương án chạy (đang thực hiện), có hạn cập nhật Chủ nhật hằng tuần, case sang "Đang xử lý" và đi đúng workflow thường', () => {
    const f = freshSos('S04a');
    assert(f.w2Plan.action_due === null, 'Trước khi xác nhận: không nghĩa vụ cập nhật');
    const d = sosAuto.confirmPresetPlan(w2T, f.w2Plan.id) as any;
    const iv = get('SELECT * FROM case_interventions WHERE id = ?', f.w2Plan.id);
    assert(iv.preset === 1 && iv.confirmed_by === w2T.userId && iv.confirmed_at && iv.status === 'started'
      && iv.started_date === TODAY && iv.cycle_started_on === TODAY && iv.cycle_no === 1, `Sau xác nhận: ${JSON.stringify(iv)}`);
    assert(iv.action_due === domain.weeklyUpdateDue(TODAY), `Hạn cập nhật tuần ${iv.action_due}`);
    assert(iv.followup_due === f.w2Plan.followup_due && iv.needs_approval === 0 && iv.approval_state === null, 'Ngày dự kiến kết thúc giữ nguyên, không cần duyệt');
    assert(get('SELECT status FROM sos_cases WHERE id = ?', f.w2.id).status === 'in_progress', 'Case sang Đang xử lý');
    assert(d.interventions.some((i: any) => i.id === iv.id && i.status === 'started'), 'caseDetail trả phương án đã chạy');
    assertThrows(() => sosAuto.confirmPresetPlan(w2T, f.w2Plan.id), /đã được xác nhận/, 'Xác nhận hai lần');
    assert(count('SELECT COUNT(*) n FROM audit_logs WHERE action = ? AND entity_id = ?', 'case.preset.confirm', iv.id) === 1, 'Xác nhận phải có audit');
  });

  check('PR-T · S04 "Chỉnh": sửa mô tả rồi xác nhận trong một thao tác; mô tả ngắn hơn 8 ký tự bị từ chối và phương án vẫn CHƯA xác nhận', () => {
    const f = freshSos('S04b');
    assertThrows(() => sosAuto.confirmPresetPlan(w2T, f.w2Plan.id, { description: 'ngắn' }), /8 ký tự/, 'Mô tả quá ngắn');
    assert(get('SELECT confirmed_at FROM case_interventions WHERE id = ?', f.w2Plan.id).confirmed_at === null, 'Lỗi thì không được xác nhận nửa chừng');
    sosAuto.confirmPresetPlan(w2T, f.w2Plan.id, { description: 'Tự học · 1 tháng — viết 2 bài Task 2 mỗi tuần, GVBM chữa', followupDue: addDays(TODAY, 21) });
    const iv = get('SELECT * FROM case_interventions WHERE id = ?', f.w2Plan.id);
    assert(iv.description.includes('viết 2 bài Task 2') && iv.followup_due === addDays(TODAY, 21) && iv.confirmed_at, `Sau chỉnh: ${JSON.stringify(iv)}`);
  });

  check('PR-T · C02 (§10#6) GVBM kỹ năng KHÁC (Writing 1) cố xác nhận / thay / đóng case Writing 2 → máy chủ TỪ CHỐI; Quản lý trong phạm vi làm được; Quản lý chi nhánh khác thì không', () => {
    const f = freshSos('C02');
    assertThrows(() => sosAuto.confirmPresetPlan(w1T, f.w2Plan.id), /phân công/, 'GVBM W1 xác nhận case W2');
    assertThrows(() => sosAuto.replacePresetPlan(w1T, f.w2Plan.id, { kind: 'tutor', description: 'Tutor kèm Writing Task 2', performerSelf: true }), /phân công/, 'GVBM W1 thay phương án case W2');
    assertThrows(() => sosAuto.dismissSosCase(w1T, f.w2.id, { reasonCode: 'single_incident' }), /phân công/, 'GVBM W1 đóng case W2');
    assertThrows(() => sosAuto.confirmPresetPlan(P.cpManager, f.w2Plan.id), /phạm vi|phân công|quyền/, 'Quản lý chi nhánh khác');
    assert(get('SELECT confirmed_at FROM case_interventions WHERE id = ?', f.w2Plan.id).confirmed_at === null, 'Bị từ chối thì không đổi gì');
    sosAuto.confirmPresetPlan(P.mbManager, f.w2Plan.id);
    assert(get('SELECT confirmed_by FROM case_interventions WHERE id = ?', f.w2Plan.id).confirmed_by === P.mbManager.userId, 'Quản lý MB xác nhận được');
  });

  check('PR-T · S06 "Thay" = phương án cũ `superseded` + phương án mới đã xác nhận trong MỘT giao dịch; case luôn có ≥1 phương án đang hoạt động; lỗi giữa chừng thì phương án cũ NGUYÊN VẸN', () => {
    const f = freshSos('S06');
    const active = () => count(`SELECT COUNT(*) n FROM case_interventions WHERE case_id = ? AND status IN ('planned','started')`, f.w2.id);
    assert(active() === 1, 'Ban đầu có 1 phương án hoạt động');
    /* Lỗi: mô tả mới quá ngắn → cả thao tác lui, KHÔNG để lại case 0 phương án. */
    assertThrows(() => sosAuto.replacePresetPlan(w2T, f.w2Plan.id, { kind: 'tutor', description: 'x', performerSelf: true }), /8 ký tự/, 'Mô tả mới quá ngắn');
    assert(active() === 1 && get('SELECT status FROM case_interventions WHERE id = ?', f.w2Plan.id).status === 'planned'
      && count('SELECT COUNT(*) n FROM case_interventions WHERE case_id = ?', f.w2.id) === 1, 'Thay hỏng phải lui hết, phương án cũ nguyên vẹn');
    sosAuto.replacePresetPlan(w2T, f.w2Plan.id, { kind: 'tutor', description: 'Tutor kèm Writing Task 2 hai buổi mỗi tuần', performerSelf: true });
    const old = get('SELECT * FROM case_interventions WHERE id = ?', f.w2Plan.id);
    const now = plansOf(f.w2.id).filter((i) => i.id !== f.w2Plan.id);
    assert(now.length === 1 && old.status === 'cancelled' && old.closed_reason === 'superseded' && old.superseded_by === now[0].id, `Cũ: ${JSON.stringify(old)}`);
    assert(now[0].kind === 'tutor' && now[0].preset === 0 && now[0].confirmed_by === w2T.userId && now[0].confirmed_at && now[0].status === 'started' && now[0].action_due, `Mới: ${JSON.stringify(now[0])}`);
    assert(active() === 1, 'Sau khi thay vẫn đúng 1 phương án hoạt động');
    /* Phương án cũ chưa từng chạy: không vào hiệu quả. */
    assert(!effectivenessSvc.planOutcomes({ studentIds: [f.st.id] }).some((r: any) => r.id === old.id), 'Phương án điền sẵn bị thay không được vào hiệu quả');
    assertThrows(() => sosAuto.replacePresetPlan(w2T, now[0].id, { kind: 'tutor', description: 'Tutor kèm Writing Task 2 hai buổi mỗi tuần', performerSelf: true }), /điền sẵn|chưa xác nhận/, 'Chỉ thay được phương án điền sẵn CHƯA xác nhận');
  });

  check('PR-T · S05 (§10#5) GVBM bấm `Không cần theo dõi` · `Tình huống đơn lẻ`: case ĐÓNG, giữ lịch sử, phương án điền sẵn HUỶ (không tính thất bại), KHÔNG vào thống kê hiệu quả nào', () => {
    const f = freshSos('S05');
    const d = sosAuto.dismissSosCase(w2T, f.w2.id, { reasonCode: 'single_incident' }) as any;
    const c = get('SELECT * FROM sos_cases WHERE id = ?', f.w2.id);
    assert(c.status === 'done' && c.closed_at === TODAY && c.closed_by === w2T.userId && c.dismiss_reason_code === 'single_incident'
      && c.dismiss_reason_text === null && c.outcome === null, `Case đóng sai: ${JSON.stringify(c)}`);
    const iv = get('SELECT * FROM case_interventions WHERE id = ?', f.w2Plan.id);
    assert(iv.status === 'cancelled' && iv.closed_reason === 'dismissed' && iv.confirmed_at === null, `Phương án phải huỷ: ${JSON.stringify(iv)}`);
    assert(milestonesOf(f.w2.id).some((m) => m.kind === 'closed' && /Không cần theo dõi/.test(m.note ?? '') && /Tình huống đơn lẻ/.test(m.note ?? '')), 'Phải có mốc đóng nói rõ lý do');
    assert(d.sos.dismissed?.code === 'single_incident' && d.sos.dismissed?.label === 'Tình huống đơn lẻ', 'caseDetail phải trả lý do đóng');
    const eff = effectivenessSvc.planOutcomes({ studentIds: [f.st.id] });
    assert(!eff.some((r: any) => r.caseId === f.w2.id), 'Case đóng vì không cần theo dõi không được vào hiệu quả');
    assert(get('SELECT status FROM case_signals WHERE attempt_id = ? AND skill = ?', f.a.id, 'writing2').status === 'linked', 'Dây nối tín hiệu giữ nguyên (lịch sử)');
    assertThrows(() => sosAuto.dismissSosCase(w2T, f.w2.id, { reasonCode: 'single_incident' }), /đã đóng/, 'Đóng hai lần');
    /* Trượt lại ở MT sau: case mới NỐI vào case đã đóng (không mở lại). */
    const a3 = mkAttempt(f.st, 3, weekSvc.mondayOf(addDays(TODAY, -7))); enter(P.admin, a3, 'writing1', 5); enter(P.admin, a3, 'writing2', 5);
    const again = all("SELECT * FROM sos_cases WHERE student_id = ? AND category = 'writing2' ORDER BY id", f.st.id);
    assert(again.length === 2 && again[1].previous_case_id === f.w2.id && again[1].status === 'open', `Case mới phải nối vào case cũ: ${JSON.stringify(again.map((x) => [x.id, x.status, x.previous_case_id]))}`);
  });

  check('PR-T · S05 Lý do: chỉ `Khác` cần chữ; mã lạ bị từ chối; không đóng được case đã có phương án ĐANG CHẠY (dùng đường chốt kết quả thường) hay case tạo tay (không phải case từ SOS)', () => {
    const f = freshSos('S05b');
    assertThrows(() => sosAuto.dismissSosCase(w2T, f.w2.id, { reasonCode: 'other' }), /ghi rõ|chữ/, '`Khác` mà không có chữ');
    assertThrows(() => sosAuto.dismissSosCase(w2T, f.w2.id, { reasonCode: 'other', reasonText: '   ' }), /ghi rõ|chữ/, '`Khác` toàn khoảng trắng');
    assertThrows(() => sosAuto.dismissSosCase(w2T, f.w2.id, { reasonCode: 'bay-ba' }), /lý do/, 'Mã lạ');
    assert(get('SELECT status FROM sos_cases WHERE id = ?', f.w2.id).status !== 'done', 'Lỗi thì case không đóng');
    sosAuto.dismissSosCase(w2T, f.w2.id, { reasonCode: 'other', reasonText: 'Em ốm dài ngày, bài này không phản ánh năng lực' });
    assert(get('SELECT dismiss_reason_text FROM sos_cases WHERE id = ?', f.w2.id).dismiss_reason_text.includes('Em ốm'), 'Lưu chữ của `Khác`');
    /* Case đã có phương án được XÁC NHẬN (đang chạy) thì không "không cần theo dõi" được nữa — việc thật đã bắt đầu. */
    sosAuto.confirmPresetPlan(P.mbManager, f.spPlan.id);
    assertThrows(() => sosAuto.dismissSosCase(P.mbManager, f.sp.id, { reasonCode: 'single_incident' }), /đã xác nhận|đang chạy|chốt kết quả/, 'Đóng case đã có phương án chạy');
    /* Case tạo tay không phải case từ SOS. */
    const manual = cases.reportIssue(P.mbManager, { studentId: f.st.id, cycleId: f.st.cycleId, topic: 'reading', primaryCode: 'student.reading.logic',
      title: 'Case tay để thử', summary: 'Em hay mất tập trung ở phần này của bài, cần theo dõi thêm.' }) as any;
    assertThrows(() => sosAuto.dismissSosCase(P.mbManager, manual.id, { reasonCode: 'single_incident' }), /case tự tạo từ SOS|không phải/, 'Đóng case tạo tay');
  });

  check('PR-T · Q-V3-3 Phương án điền sẵn CHƯA xác nhận: không vào hiệu quả, KHÔNG sinh nghĩa vụ cập nhật tuần / xem lại kết quả, không thể ghi "đã xong" hay kết quả; xác nhận rồi thì hiện đúng như phương án thường', () => {
    const f = freshSos('Q3');
    const keysOf = (who: any) => mywork(who).map((i: any) => i.key as string);
    /* Ép hạn về QUÁ KHỨ để chứng minh chính việc "chưa xác nhận" mới là lý do nó không nổi lên — không phải vì hạn chưa tới. */
    conn.prepare('UPDATE case_interventions SET followup_due = ?, action_due = ? WHERE id = ?').run(addDays(TODAY, -3), addDays(TODAY, -3), f.w2Plan.id);
    assert(!keysOf(w2T).some((k) => k === `review:${f.w2Plan.id}` || k === `action:${f.w2Plan.id}`), `Phương án chưa xác nhận nổi lên việc cần làm: ${keysOf(w2T).filter((k) => k.includes(String(f.w2Plan.id)))}`);
    assert(!keysOf(w2T).some((k) => k === `support:${f.w2.id}`), 'Case có sẵn phương án điền sẵn không phải "chưa có phương án" (không có hạn 3/5 ngày lập phương án — S04)');
    const M = (id: string) => metricsSvc.metricSet(P.mbManager, id, { branchId: get("SELECT branch_id n FROM classes WHERE id = ?", CLASS).n }).ids as number[];
    assert(!M('pa-can-cap-nhat').includes(f.w2Plan.id), 'Chưa xác nhận mà vào "phương án cần cập nhật"');
    assert(!M('dung-han-cap-nhat').some((id: number) => Math.floor(id / 1000) === f.w2Plan.id), 'Chưa xác nhận mà sinh nghĩa vụ cập nhật tuần');
    assertThrows(() => cases.completeIntervention(w2T, f.w2Plan.id, { doneOn: TODAY, performerSelf: true }), /xác nhận/, 'Ghi "đã xong" cho phương án chưa xác nhận');
    assertThrows(() => cases.updateResult(w2T, f.w2Plan.id, { outcome: 'improved', note: 'Kết quả thử nghiệm ghi cho phương án chưa xác nhận' }), /xác nhận/, 'Ghi kết quả cho phương án chưa xác nhận');
    const board = effectivenessSvc.issueBoard({ studentIds: [f.st.id] }, 'writing2');
    assert(board.rows.every((r: any) => r.plans === 0 && r.running === 0), `Bảng vấn đề đếm phương án điền sẵn chưa xác nhận: ${JSON.stringify(board.rows)}`);
    /* Xác nhận rồi: nổi lên như phương án thường. */
    sosAuto.confirmPresetPlan(w2T, f.w2Plan.id);
    conn.prepare('UPDATE case_interventions SET action_due = ? WHERE id = ?').run(addDays(TODAY, -3), f.w2Plan.id);
    assert(keysOf(w2T).includes(`action:${f.w2Plan.id}`) && M('pa-can-cap-nhat').includes(f.w2Plan.id), 'Đã xác nhận thì phải vào việc cần làm và "cần cập nhật"');
    const board2 = effectivenessSvc.issueBoard({ studentIds: [f.st.id] }, 'writing2');
    assert(board2.rows.some((r: any) => r.plans === 1 && r.running === 1), 'Đã xác nhận thì bảng vấn đề đếm nó là phương án đang theo dõi');
  });

  check('PR-T · Chỉ số `case-cho-xac-dinh-nguyen-nhan`: case từ SOS chưa có nguyên nhân HOẶC còn phương án điền sẵn chưa xác nhận; hết khi cả hai đã xong; case tạo tay và case đã đóng không thuộc tập', () => {
    const f = freshSos('IND');
    const bid = get('SELECT branch_id n FROM classes WHERE id = ?', CLASS).n;
    const M = () => metricsSvc.metricSet(P.mbManager, 'case-cho-xac-dinh-nguyen-nhan', { branchId: bid }).ids as number[];
    assert(domain.metricById('case-cho-xac-dinh-nguyen-nhan')?.donVi === 'case', 'Chỉ số phải có trong sổ, đơn vị case');
    assert(M().includes(f.w2.id) && M().includes(f.sp.id), 'Case mới tự tạo phải nằm trong tập');
    sosAuto.confirmPresetPlan(w2T, f.w2Plan.id);
    assert(M().includes(f.w2.id), 'Đã xác nhận phương án nhưng CHƯA có nguyên nhân → vẫn chờ');
    cases.setIssues(w2T, f.w2.id, { primaryCode: 'student.writing.task' });
    assert(!M().includes(f.w2.id), 'Đủ nguyên nhân + phương án đã xác nhận thì thôi chờ');
    cases.setIssues(P.mbManager, f.sp.id, { primaryCode: 'student.speaking.fluency' });
    assert(M().includes(f.sp.id), 'Có nguyên nhân nhưng phương án còn điền sẵn chưa xác nhận → vẫn chờ');
    sosAuto.dismissSosCase(P.mbManager, f.sp.id, { reasonCode: 'single_incident' });
    assert(!M().includes(f.sp.id), 'Case đã đóng không thuộc tập');
    const manual = cases.reportIssue(P.mbManager, { studentId: f.st.id, cycleId: f.st.cycleId, topic: 'reading', primaryCode: 'student.reading.logic',
      title: 'Case tay cho chỉ số', summary: 'Em hay mất tập trung ở phần này của bài, cần theo dõi thêm.' }) as any;
    assert(!M().includes(manual.id), 'Case tạo tay không thuộc tập');
    assertThrows(() => metricsSvc.metricSet(P.cpManager, 'case-cho-xac-dinh-nguyen-nhan', { branchId: bid }), /phạm vi/, 'Quản lý chi nhánh khác hỏi chi nhánh này');
  });

  void load;
  void t;
}
