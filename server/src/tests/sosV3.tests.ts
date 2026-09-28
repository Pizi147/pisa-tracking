/**
 * PHÉP KIỂM PR-T — rulebook v3 (21/09/2026 tối): SOS tự tạo Case · Phối hợp SOS · xoá vi phạm.
 *
 * Đặc tả: `thiet-ke/SOS_VA_PHOI_HOP_V3.md`. Tên mỗi phép kiểm bắt đầu bằng MÃ LUẬT (S01–S09, P01–P10, V11′–V14′) để tìm bằng tay.
 * Harness (`check`, `assert`, bộ demo, tài khoản mẫu) do `run.ts` sở hữu và truyền vào — file này không tự mở database.
 *
 * Quy ước TDD của file này: mọi mô-đun mới được nạp bằng `load(...)` — thiếu mô-đun thì phép kiểm ĐỎ với câu nói rõ thiếu gì,
 * không làm sập cả bộ.
 */
import { boLichTuTao, luotThu } from './luotThu.ts';
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
      && domain.COORDINATION_REMOVE_REASON_LABEL.duplicate_measure === 'Trùng với phương án xử lý khác'
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
  const { default: SqliteDb } = await import('libsql');
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
  const CLASS = t.classId('MB FT 101');
  const all = (sql: string, ...a: unknown[]) => conn.prepare(sql).all(...a) as any[];
  const get = (sql: string, ...a: unknown[]) => conn.prepare(sql).get(...a) as any;
  const count = (sql: string, ...a: unknown[]) => (get(sql, ...a)?.n ?? 0) as number;

  /** Học viên MỚI, mục tiêu 7.0 (kỳ vọng MT1 6.0 · MT2 6.5 · MT3+ 7.0), riêng cho từng phép kiểm. */
  const makeStudent = (name: string): { id: number; cycleId: number } => {
    intake.commitIntake(P.admin, { classId: CLASS, rows: [{ fullName: `PT ${name}`, target: 7 }], dateFormat: 'iso', idempotencyKey: `pt-${name}` });
    const st = get('SELECT id FROM students WHERE full_name = ?', `PT ${name}`);
    const cy = get("SELECT id FROM learning_cycles WHERE student_id = ? AND status = 'active'", st.id);
    assert(st && cy, `Không dựng được học viên thử "${name}"`);
    boLichTuTao(conn, cy.id);   // PR-MT: em thử tự dựng lượt cần — xem luotThu.ts
    return { id: st.id, cycleId: cy.id };
  };
  /** Tuần đã qua (không phải tương lai) — điểm nhập được ngay. PR-MT (T36): MT trước còn thiếu tạo trước, là MT lịch sử. */
  const PAST_WEEK = weekSvc.mondayOf(addDays(TODAY, -14));
  const mkAttempt = (st: { id: number; cycleId: number }, no: number, weekStart: string = PAST_WEEK): any => luotThu(conn, attemptsSvc.createAttempt, P.admin, {
    studentId: st.id, cycleId: st.cycleId, classId: CLASS, no, periodId: weekSvc.ensurePeriod(weekStart).id });
  /*
   * RB-5 (PR-Rc1): sửa một ô đã có điểm nay phải kèm lý do. Hàm này vừa nhập lần đầu vừa sửa điểm nguồn, nên LUÔN gửi
   * một lý do — lần nhập đầu thì máy chủ bỏ qua nó. Luật "khi nào phải có lý do" có phép kiểm riêng ở chamDiem.tests.ts.
   */
  const enter = (who: any, a: any, skill: string, band: number) => attemptsSvc.saveScore(who, a.id, skill, {
    ...(skill === 'listening' ? { rawScore: scoring.LISTENING_BY_RAW.indexOf(band) }
      : skill === 'reading' ? { rawScore: scoring.READING_BY_RAW.indexOf(band) }
      : { criteria: [band, band, band, band] }),
    lyDo: 'Phép kiểm: sửa điểm nguồn',
  });
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

  check('PR-T · S01+S02+S03 (§10#1) MT2: chỉ W2 dưới + Speaking dưới → SOS2, đúng HAI case (W2 và Speaking; KHÔNG case W1, KHÔNG case Writing tổng), mỗi case có sẵn PA quy chế `Tự học · 1 tháng` ĐANG CHẠY (PR-N1 S4-1)', () => {
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
      assert(iv.preset === 1 && iv.kind === 'self_study' && iv.description === 'Tự học · 1 tháng' && iv.status === 'started'
        && !!iv.confirmed_at && iv.confirmed_by === null, `PA quy chế sai (phải chạy ngay, máy xác nhận): ${JSON.stringify(iv)}`);
      assert(iv.needs_approval === 0 && iv.approval_state === null, 'Phương án điền sẵn không cần Quản lý duyệt');
      assert(iv.followup_due === domain.sosPlanEndDate('one_month', { createdOn: TODAY }), `followup_due ${iv.followup_due}`);
      assert(iv.action_due === domain.weeklyUpdateDue(TODAY) && iv.cycle_started_on === TODAY && iv.started_date === TODAY && iv.cycle_no === 1,
        `PA quy chế chạy ngay: hạn ghi kết quả tuần Thứ Hai, bắt đầu hôm nay (S4-1): ${JSON.stringify(iv)}`);
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
    const fou = get("SELECT id FROM classes WHERE code = 'MB FOU 12'");
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
    assert(get('SELECT status FROM sos_cases WHERE id = ?', w2.id).status === 'open' && plansOf(w2.id)[0].status === 'started', 'Case W2 còn trượt phải nguyên vẹn');
  });

  check('PR-T · S08 Case đã có căn cứ độc lập (mốc từ đợt khác) thì GIỮ dù điểm nguồn được sửa — không xoá việc đã diễn ra', () => {
    const st = makeStudent('S08b'); const a2 = mkAttempt(st, 2); scoreMt2(a2);
    const a3 = mkAttempt(st, 3, weekSvc.mondayOf(addDays(TODAY, -7)));
    enter(P.admin, a3, 'speaking', 5);                        // MT3 trượt lại → gắn vào case cũ (căn cứ độc lập)
    const sp = caseOf(st.id, 'speaking');
    enter(P.admin, a2, 'speaking', 7);                        // sửa điểm MT2 thành đạt
    assert(get('SELECT status FROM sos_cases WHERE id = ?', sp.id).status !== 'done', 'Case còn mốc MT3 thì không được tự huỷ');
    assert(plansOf(sp.id)[0].status === 'started', 'Phương án không bị huỷ');
  });

  // ================================================================== T4 — xác nhận / thay / đóng case từ SOS (S04–S07)

  console.log('\nPR-T · 5. Xác nhận · thay · đóng `Không cần theo dõi` case từ SOS (S04–S07) — T4');

  const sosAuto: any = await load('../cases/sosAuto.ts');
  const migN1: any = await load('../migrate/prN1.ts');
  const phoiHop: any = await load('../yThuc/phoiHop.ts');
  const gvcn = P.coreTeacher;      // chủ nhiệm MB FT 101
  const coordOf = (attemptId: number) => all('SELECT * FROM sos_coordination_actions WHERE attempt_id = ? ORDER BY id', attemptId);
  const rowOf = (attemptId: number, kind: string) => coordOf(attemptId).find((r) => r.kind === kind);
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

  check('PR-T · S04+S07 (PR-N1 S4-1) PA quy chế tạo ra ĐÃ CHẠY: có hạn ghi kết quả tuần Thứ Hai, đi đúng workflow thường; gọi "xác nhận" trên nó → 400 "đã được xác nhận rồi", không đổi gì', () => {
    const f = freshSos('S04a');
    const iv = get('SELECT * FROM case_interventions WHERE id = ?', f.w2Plan.id);
    assert(iv.preset === 1 && iv.confirmed_by === null && iv.confirmed_at && iv.status === 'started'
      && iv.started_date === TODAY && iv.cycle_started_on === TODAY && iv.cycle_no === 1, `PA quy chế lúc tạo: ${JSON.stringify(iv)}`);
    assert(iv.action_due === domain.weeklyUpdateDue(TODAY), `Hạn ghi kết quả tuần ${iv.action_due}`);
    assert(iv.needs_approval === 0 && iv.approval_state === null, 'PA quy chế không cần Quản lý duyệt');
    const d = cases.caseDetail(w2T, f.w2.id) as any;
    assert(d.interventions.some((i: any) => i.id === iv.id && i.status === 'started' && i.preset), 'caseDetail trả PA quy chế đang chạy');
    assertThrows(() => sosAuto.confirmPresetPlan(w2T, f.w2Plan.id), /đã được xác nhận rồi/, 'Xác nhận PA quy chế');
    const sau = get('SELECT * FROM case_interventions WHERE id = ?', f.w2Plan.id);
    assert(sau.confirmed_by === null && sau.confirmed_at === iv.confirmed_at && sau.description === iv.description, 'Bị từ chối thì không đổi gì');
    assert(count('SELECT COUNT(*) n FROM audit_logs WHERE action = ? AND entity_id = ?', 'case.preset.confirm', iv.id) === 0, 'Không có audit xác nhận');
  });

  check('PR-T · S04 "Chỉnh" (PR-N1 S4-1): không còn bước xác nhận-kèm-chỉnh — gọi confirm kèm mô tả / ngày trên PA quy chế → 400 "đã được xác nhận rồi", mô tả và ngày dự kiến giữ nguyên', () => {
    const f = freshSos('S04b');
    assertThrows(() => sosAuto.confirmPresetPlan(w2T, f.w2Plan.id, { description: 'Tự học · 1 tháng — viết 2 bài Task 2 mỗi tuần, GVBM chữa', followupDue: addDays(TODAY, 21) }),
      /đã được xác nhận rồi/, 'Xác nhận kèm chỉnh PA quy chế');
    const iv = get('SELECT * FROM case_interventions WHERE id = ?', f.w2Plan.id);
    assert(iv.description === 'Tự học · 1 tháng' && iv.followup_due === f.w2Plan.followup_due && iv.confirmed_by === null, `Sau khi bị từ chối: ${JSON.stringify(iv)}`);
  });

  check('PR-T · C02 (§10#6) GVBM kỹ năng KHÁC (Writing 1) cố xác nhận / thay / đóng case Writing 2 → máy chủ TỪ CHỐI; Quản lý trong phạm vi làm được; Quản lý chi nhánh khác thì không', () => {
    const f = freshSos('C02');
    assertThrows(() => sosAuto.confirmPresetPlan(w1T, f.w2Plan.id), /phân công/, 'GVBM W1 xác nhận case W2');
    assertThrows(() => sosAuto.replacePresetPlan(w1T, f.w2Plan.id, { kind: 'tutor', description: 'Tutor kèm Writing Task 2', performerSelf: true }), /phân công/, 'GVBM W1 thay phương án case W2');
    assertThrows(() => sosAuto.dismissSosCase(w1T, f.w2.id, { reasonCode: 'single_incident' }), /phân công/, 'GVBM W1 đóng case W2');
    assertThrows(() => sosAuto.confirmPresetPlan(P.cpManager, f.w2Plan.id), /phạm vi|phân công|quyền/, 'Quản lý chi nhánh khác');
    assert(get('SELECT confirmed_by FROM case_interventions WHERE id = ?', f.w2Plan.id).confirmed_by === null, 'Bị từ chối thì không đổi gì');
    /* PR-N1 S4-1: Quản lý trong phạm vi qua được cửa quyền, rồi gặp luật "PA quy chế đã chạy" — không còn gì để xác nhận. */
    assertThrows(() => sosAuto.confirmPresetPlan(P.mbManager, f.w2Plan.id), /đã được xác nhận rồi/, 'Quản lý MB xác nhận PA quy chế');
    assert(get('SELECT confirmed_by FROM case_interventions WHERE id = ?', f.w2Plan.id).confirmed_by === null, 'PA quy chế giữ dấu máy gán');
  });

  check('PR-T · S06 "Thay" (PR-N1 S4-1, T22): PA quy chế KHÔNG thay được — gọi replace → 400 "đã được xác nhận rồi", không sinh PA mới, PA quy chế vẫn chạy; PA không phải điền sẵn thì báo "không phải phương án điền sẵn"', () => {
    const f = freshSos('S06');
    const active = () => count(`SELECT COUNT(*) n FROM case_interventions WHERE case_id = ? AND status IN ('planned','started')`, f.w2.id);
    assert(active() === 1, 'Ban đầu có 1 PA đang chạy');
    assertThrows(() => sosAuto.replacePresetPlan(w2T, f.w2Plan.id, { kind: 'tutor', description: 'Tutor kèm Writing Task 2 hai buổi mỗi tuần', performerSelf: true }),
      /đã được xác nhận rồi/, 'Thay PA quy chế');
    const old = get('SELECT * FROM case_interventions WHERE id = ?', f.w2Plan.id);
    assert(active() === 1 && old.status === 'started' && old.closed_reason === null && old.superseded_by === null
      && count('SELECT COUNT(*) n FROM case_interventions WHERE case_id = ?', f.w2.id) === 1, `Bị từ chối thì PA quy chế nguyên vẹn, không có PA mới: ${JSON.stringify(old)}`);
    /* PA đang chạy chưa có kết quả: chưa vào hiệu quả. */
    assert(!effectivenessSvc.planOutcomes({ studentIds: [f.st.id] }).some((r: any) => r.id === old.id), 'PA chưa xong không được vào hiệu quả');
    const tay = cases.recordIntervention(w2T, f.w2.id, { kind: 'tutor', description: 'Tutor kèm Writing Task 2 hai buổi mỗi tuần', status: 'started', performerSelf: true }) as any;
    const paTay = tay.interventions.find((i: any) => !i.preset);
    assertThrows(() => sosAuto.replacePresetPlan(w2T, paTay.id, { kind: 'tutor', description: 'Tutor kèm Writing Task 2 hai buổi mỗi tuần', performerSelf: true }), /điền sẵn/, 'Thay PA không phải điền sẵn');
  });

  check('PR-T · S05 (§10#5) GVBM bấm `Không cần theo dõi` · `Tình huống đơn lẻ`: case ĐÓNG, giữ lịch sử, phương án điền sẵn HUỶ (không tính thất bại), KHÔNG vào thống kê hiệu quả nào', () => {
    const f = freshSos('S05');
    const d = sosAuto.dismissSosCase(w2T, f.w2.id, { reasonCode: 'single_incident' }) as any;
    const c = get('SELECT * FROM sos_cases WHERE id = ?', f.w2.id);
    assert(c.status === 'done' && c.closed_at === TODAY && c.closed_by === w2T.userId && c.dismiss_reason_code === 'single_incident'
      && c.dismiss_reason_text === null && c.outcome === null, `Case đóng sai: ${JSON.stringify(c)}`);
    const iv = get('SELECT * FROM case_interventions WHERE id = ?', f.w2Plan.id);
    assert(iv.status === 'cancelled' && iv.closed_reason === 'dismissed' && iv.confirmed_by === null, `PA quy chế chưa có kết quả tuần phải huỷ (Q24): ${JSON.stringify(iv)}`);
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

  check('PR-T · S05+S01 (rà soát) Đã đóng `Không cần theo dõi` (hay đóng thường) thì lưu điểm kỹ năng KHÁC hoặc chấm lại CHÍNH lượt đó KHÔNG mở lại / tạo case mới — quyết định của GVBM không bị âm thầm đảo', () => {
    const f = freshSos('S05re');
    sosAuto.dismissSosCase(w2T, f.w2.id, { reasonCode: 'single_incident' });
    const snap = () => JSON.stringify({
      cases: casesOf(f.st.id).map((c) => [c.id, c.status]),
      plans: count('SELECT COUNT(*) n FROM case_interventions WHERE case_id IN (SELECT id FROM sos_cases WHERE student_id = ?)', f.st.id),
      sig: get('SELECT status, case_id FROM case_signals WHERE attempt_id = ? AND skill = ?', f.a.id, 'writing2'),
      notes: count("SELECT COUNT(*) n FROM notifications WHERE entity_type = 'sos_case' AND entity_id IN (SELECT id FROM sos_cases WHERE student_id = ?)", f.st.id),
    });
    const before = snap();
    enter(P.admin, f.a, 'listening', 7);                       // nhập thêm một kỹ năng ĐẠT của cùng lượt
    scoreMt2(f.a);                                             // lưu lại y hệt
    assert(snap() === before, `Case đã đóng bị mở lại / tạo mới:\n  trước ${before}\n  sau   ${snap()}`);
    assert(casesOf(f.st.id).filter((c) => c.category === 'writing2').length === 1, 'Vẫn đúng MỘT case W2');
    /* Đóng thường (Chốt kết quả) cũng vậy. */
    const g = freshSos('S05re2');
    const gp = g.w2Plan;                                       // PA quy chế đã chạy từ lúc tạo (PR-N1 S4-1)
    cases.completeIntervention(w2T, gp.id, { doneOn: TODAY, performerSelf: true });
    cases.closeCaseOutcome(P.mbManager, g.w2.id, { outcome: 'improved', note: 'Em đã tiến bộ rõ ở Writing Task 2', decision: 'end' });
    const before2 = JSON.stringify(casesOf(g.st.id).map((c) => [c.id, c.status]));
    scoreMt2(g.a); enter(P.admin, g.a, 'reading', 7);
    assert(JSON.stringify(casesOf(g.st.id).map((c) => [c.id, c.status])) === before2, 'Case đã chốt kết quả bị tạo lại khi chấm lại cùng lượt');
  });

  check('PR-T · (rà soát) Ngày dự kiến "1 tháng" của phương án điền sẵn KHÔNG trôi theo ngày bấm lưu: đồng bộ lại tính từ ngày case ra đời (ngày ghi nhận tín hiệu)', () => {
    const st = makeStudent('DRIFT'); const a = mkAttempt(st, 2);
    enter(P.admin, a, 'speaking', 5);                                   // SOS1 → Tự học · 1 tháng
    const sp = caseOf(st.id, 'speaking');
    const born = addDays(TODAY, -10);
    conn.prepare('UPDATE case_signals SET raised_on = ? WHERE case_id = ?').run(born, sp.id);   // case "ra đời" 10 ngày trước
    enter(P.admin, a, 'writing2', 5); enter(P.admin, a, 'writing1', 7);  // SOS2: cùng loại phương án → đồng bộ lại
    const want = domain.sosPlanEndDate('one_month', { createdOn: born });
    assert(plansOf(sp.id)[0].followup_due === want && want !== domain.sosPlanEndDate('one_month', { createdOn: TODAY }), `followup_due ${plansOf(sp.id)[0].followup_due} phải tính từ ${born} (${want})`);
  });

  check('PR-T · (rà soát) Phương án điền sẵn chưa xác nhận (dữ liệu CŨ trước PR-N1) cũng không ghi được "theo dõi" (recordFollowUp) và không hiện quá hạn xem lại trong thẻ / chi tiết case', () => {
    const f = freshSos('FOLLOW');
    /* PR-N1 S4-1: PA quy chế nay tạo ra đã chạy — dựng lại dạng "chờ xác nhận" của dữ liệu cũ để giữ phép kiểm các chặn còn trong mã. */
    conn.prepare("UPDATE case_interventions SET status = 'planned', confirmed_at = NULL, started_date = NULL, cycle_started_on = NULL, action_due = NULL WHERE id = ?").run(f.w2Plan.id);
    assertThrows(() => cases.recordFollowUp(w2T, f.w2.id, { interventionId: f.w2Plan.id, outcome: 'partial', note: 'Ghi thử cho phương án chưa xác nhận' }), /xác nhận/, 'Theo dõi phương án chưa xác nhận');
    conn.prepare('UPDATE case_interventions SET followup_due = ? WHERE id = ?').run(addDays(TODAY, -5), f.w2Plan.id);
    const d = cases.caseDetail(P.mbManager, f.w2.id) as any;
    assert(d.interventions.find((i: any) => i.id === f.w2Plan.id).overdue === false, 'Chi tiết case: gợi ý chưa xác nhận không được báo quá hạn xem lại');
    const board = (cases.skillSupportBoard(P.mbManager, f.st.id) as any);
    const flat = JSON.stringify(board);
    assert(!/"followupOverdue":true/.test(flat), 'Bảng kỹ năng: gợi ý chưa xác nhận không được báo quá hạn');
  });

  check('PR-T · (rà soát) Case đã ĐÓNG rồi sửa điểm nguồn: KHÔNG gửi thông báo "Xem lại case" (không còn gì để xem lại)', () => {
    const f = freshSos('NOTE');                                          // PA quy chế đã chạy từ lúc tạo (PR-N1 S4-1)
    cases.completeIntervention(w2T, f.w2Plan.id, { doneOn: TODAY, performerSelf: true });
    cases.closeCaseOutcome(P.mbManager, f.w2.id, { outcome: 'improved', note: 'Em đã tiến bộ rõ ở Writing Task 2', decision: 'end' });
    const reviews = () => count("SELECT COUNT(*) n FROM notifications WHERE dedup_key LIKE ?", `case_review:${f.w2.id}:%`);
    enter(P.admin, f.a, 'writing2', 7);                                  // sửa điểm nguồn thành đạt
    assert(reviews() === 0, 'Đã gửi thông báo xem lại cho một case đã đóng');
  });

  check('PR-T · (rà soát) Lượt Mock đã HUỶ: không thêm việc phối hợp; không hiện trong danh sách theo lớp / học viên (khớp chỉ số); chữ nhập vào quá dài bị từ chối', () => {
    const f = freshSos('CANCEL');
    assertThrows(() => phoiHop.confirmCoordination(gvcn, rowOf(f.a.id, 'talk_student').id, { performedOn: TODAY, note: 'x'.repeat(1001) }), /quá dài/, 'Ghi chú quá dài');
    assertThrows(() => phoiHop.removeCoordination(gvcn, rowOf(f.a.id, 'talk_family').id, { reasonCode: 'other', reasonText: 'y'.repeat(301) }), /quá dài/, 'Lý do quá dài');
    assertThrows(() => phoiHop.addCoordination(gvcn, f.a.id, { kind: 'other', customName: 'z'.repeat(101) }), /quá dài/, 'Tên việc quá dài');
    attemptsSvc.cancelAttempt(P.mbManager, f.a.id, 'Huỷ lượt để thử phép kiểm');
    assertThrows(() => phoiHop.addCoordination(gvcn, f.a.id, { kind: 'cx_meeting_student' }), /huỷ/, 'Thêm việc vào lượt đã huỷ');
    assert(!(phoiHop.coordinationOfStudent(gvcn, f.st.id) as any).rows.some((r: any) => r.attemptId === f.a.id), 'Lượt đã huỷ không hiện theo học viên');
    assert(!(phoiHop.coordinationOfClass(gvcn, CLASS, { includeDone: true }) as any).rows.some((r: any) => r.attemptId === f.a.id), 'Lượt đã huỷ không hiện theo lớp');
  });

  check('PR-T · S05 Lý do: chỉ `Khác` cần chữ; mã lạ bị từ chối; không đóng được case đã có phương án ĐANG CHẠY (dùng đường chốt kết quả thường) hay case tạo tay (không phải case từ SOS)', () => {
    const f = freshSos('S05b');
    assertThrows(() => sosAuto.dismissSosCase(w2T, f.w2.id, { reasonCode: 'other' }), /ghi rõ|chữ/i, '`Khác` mà không có chữ');
    assertThrows(() => sosAuto.dismissSosCase(w2T, f.w2.id, { reasonCode: 'other', reasonText: '   ' }), /ghi rõ|chữ/i, '`Khác` toàn khoảng trắng');
    assertThrows(() => sosAuto.dismissSosCase(w2T, f.w2.id, { reasonCode: 'bay-ba' }), /lý do/, 'Mã lạ');
    assert(get('SELECT status FROM sos_cases WHERE id = ?', f.w2.id).status !== 'done', 'Lỗi thì case không đóng');
    sosAuto.dismissSosCase(w2T, f.w2.id, { reasonCode: 'other', reasonText: 'Em ốm dài ngày, bài này không phản ánh năng lực' });
    assert(get('SELECT dismiss_reason_text FROM sos_cases WHERE id = ?', f.w2.id).dismiss_reason_text.includes('Em ốm'), 'Lưu chữ của `Khác`');
    /* PR-N1 Q23/Q24: PA quy chế CÓ KẾT QUẢ TUẦN là việc thật → không "không cần theo dõi" được nữa (PA quy chế chưa ghi gì thì vẫn đóng được — S05 ở trên). */
    cases.recordFollowUp(P.mbManager, f.sp.id, { interventionId: f.spPlan.id, outcome: 'partial', note: 'Tuần đầu em đã luyện nói đều hơn' });
    assertThrows(() => sosAuto.dismissSosCase(P.mbManager, f.sp.id, { reasonCode: 'single_incident' }), /đã xác nhận|đang chạy|chốt kết quả/, 'Đóng case đã có kết quả tuần');
    /* Case tạo tay không phải case từ SOS. */
    const manual = cases.reportIssue(P.mbManager, { studentId: f.st.id, cycleId: f.st.cycleId, topic: 'reading', primaryCode: 'student.reading.logic',
      title: 'Case tay để thử', summary: 'Em hay mất tập trung ở phần này của bài, cần theo dõi thêm.' }) as any;
    assertThrows(() => sosAuto.dismissSosCase(P.mbManager, manual.id, { reasonCode: 'single_incident' }), /case tự tạo từ SOS|không phải/, 'Đóng case tạo tay');
  });

  check('PR-T · Q-V3-3 Phương án điền sẵn CHƯA xác nhận (dữ liệu CŨ): không vào hiệu quả, KHÔNG sinh nghĩa vụ cập nhật tuần / xem lại kết quả, không thể ghi "đã xong" hay kết quả; migrate PR-N1 cho nó chạy thì hiện đúng như phương án thường', () => {
    const f = freshSos('Q3');
    const keysOf = (who: any) => mywork(who).map((i: any) => i.key as string);
    /* PR-N1 S4-1: PA quy chế nay tạo ra đã chạy — dựng lại dạng "chờ xác nhận" của dữ liệu cũ. */
    conn.prepare("UPDATE case_interventions SET status = 'planned', confirmed_at = NULL, started_date = NULL, cycle_started_on = NULL WHERE id = ?").run(f.w2Plan.id);
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
    /* Migrate PR-N1 (S4-1) cho nó chạy: nổi lên như phương án thường. */
    migN1.migratePaQuyChe(conn, [], TODAY);
    const sauMig = get('SELECT * FROM case_interventions WHERE id = ?', f.w2Plan.id);
    assert(sauMig.status === 'started' && sauMig.confirmed_at && sauMig.confirmed_by === null, `Sau migrate: ${JSON.stringify(sauMig)}`);
    conn.prepare('UPDATE case_interventions SET action_due = ? WHERE id = ?').run(addDays(TODAY, -3), f.w2Plan.id);
    assert(keysOf(w2T).includes(`action:${f.w2Plan.id}`) && M('pa-can-cap-nhat').includes(f.w2Plan.id), 'PA quy chế đang chạy thì phải vào việc cần làm và "cần cập nhật"');
    const board2 = effectivenessSvc.issueBoard({ studentIds: [f.st.id] }, 'writing2');
    assert(board2.rows.some((r: any) => r.plans === 1 && r.running === 1), 'PA quy chế đang chạy thì bảng vấn đề đếm nó là phương án đang theo dõi');
  });

  check('PR-T · S04 Hạn 3 ngày thành DÒNG VIỆC: GVBM phụ trách thấy `Xác định nguyên nhân` ngay khi case ra đời (hạn = hết ngày thứ ba); Quản lý CHỈ thấy khi đã quá hạn; quá hạn có nhãn riêng; có nguyên nhân (PR-N1: không còn vế xác nhận PA) hoặc đóng case thì dòng biến mất', () => {
    const f = freshSos('CAUSE');
    const key = (id: number) => `cause:${id}`;
    const item = (who: any, id: number) => mywork(who).find((i: any) => i.key === key(id));
    const due = domain.signalVerifyDue(TODAY);
    const mine = item(w2T, f.w2.id);
    assert(mine && mine.group === 'cause' && mine.urgency === 'normal' && mine.due === due && mine.mine === true && mine.caseId === f.w2.id
      && mine.actionLabel === 'Xác định nguyên nhân' && mine.statusLabel === 'Chờ xác định nguyên nhân' && !('overdueLabel' in mine) && mine.studentId === f.st.id,
    `Dòng của GVBM: ${JSON.stringify(mine)}`);
    assert(/chưa chọn nguyên nhân/.test(mine.reason) && !/PA học thuật|xác nhận/.test(mine.reason), `Lý do chỉ nói thiếu nguyên nhân (K5-07): ${mine.reason}`);
    assert(!item(P.mbManager, f.w2.id) && !item(w1T, f.w2.id), 'Chưa quá hạn thì Quản lý không thấy; GVBM kỹ năng khác không thấy');
    const groups = myworkSvc.myWork(w2T, {}).groups as any[];
    assert(groups.some((g: any) => g.key === 'cause' && g.label === 'Xác định nguyên nhân' && g.items.some((i: any) => i.key === key(f.w2.id))), 'Phải có nhóm `cause` trong danh sách nhóm');
    /* Quá hạn: hết ngày hạn mới tính (hạn = hôm qua). */
    conn.prepare('UPDATE case_signals SET verify_due = ? WHERE case_id = ?').run(addDays(TODAY, -1), f.w2.id);
    const late = item(w2T, f.w2.id), mgr = item(P.mbManager, f.w2.id);
    assert(late.urgency === 'overdue' && !/quá hạn/.test(late.reason) && late.tieuDe.startsWith('Xác định nguyên nhân'), `Quá hạn của GVBM: ${JSON.stringify(late)}`);
    assert(mgr && mgr.urgency === 'overdue' && mgr.mine === false && /chưa/.test(mgr.reason), `Quản lý thấy khi quá hạn: ${JSON.stringify(mgr)}`);
    assert(!item(P.cpManager, f.w2.id) && !item(w1T, f.w2.id), 'Quản lý chi nhánh khác và GVBM kỹ năng khác không thấy dù quá hạn');
    assert(myworkSvc.myWork(w2T, {}).summary.overdue >= 1, 'Tính vào tổng số việc quá hạn');
    /* PR-N1 S4-1: có nguyên nhân là đủ — PA quy chế đã tự chạy, không còn vế "xác nhận PA". */
    cases.setIssues(w2T, f.w2.id, { primaryCode: 'student.writing.task' });
    assert(!item(w2T, f.w2.id) && !item(P.mbManager, f.w2.id), 'Có nguyên nhân thì dòng biến mất, cả ở phía Quản lý');
    assertThrows(() => sosAuto.confirmPresetPlan(w2T, f.w2Plan.id), /đã được xác nhận rồi/, 'Xác nhận PA quy chế');
    /* Đóng `Không cần theo dõi` cũng làm dòng biến mất; case tạo tay không bao giờ có dòng này. */
    conn.prepare('UPDATE case_signals SET verify_due = ? WHERE case_id = ?').run(addDays(TODAY, -1), f.sp.id);
    assert(item(P.mbManager, f.sp.id), 'Case Speaking quá hạn thì Quản lý thấy trước khi đóng');
    sosAuto.dismissSosCase(P.mbManager, f.sp.id, { reasonCode: 'single_incident' });
    assert(!item(gvcn, f.sp.id) && !item(P.mbManager, f.sp.id), 'Case đã đóng không còn dòng');
    const manual = cases.reportIssue(P.mbManager, { studentId: f.st.id, cycleId: f.st.cycleId, topic: 'reading', primaryCode: 'student.reading.logic',
      title: 'Case tay cho việc cần làm', summary: 'Em hay mất tập trung ở phần này của bài, cần theo dõi thêm.' }) as any;
    assert(!mywork(P.mbManager).some((i: any) => i.key === key(manual.id)) && !mywork(P.admin).some((i: any) => i.key === key(manual.id)), 'Case tạo tay không thuộc nhóm này');
  });

  check('PR-T · Chỉ số `case-cho-xac-dinh-nguyen-nhan`: case từ SOS chưa có nguyên nhân (PR-N1: PA quy chế đã tự chạy, không còn vế xác nhận); có nguyên nhân thì thôi chờ; case tạo tay và case đã đóng không thuộc tập', () => {
    const f = freshSos('IND');
    const bid = get('SELECT branch_id n FROM classes WHERE id = ?', CLASS).n;
    const M = () => metricsSvc.metricSet(P.mbManager, 'case-cho-xac-dinh-nguyen-nhan', { branchId: bid }).ids as number[];
    assert(domain.metricById('case-cho-xac-dinh-nguyen-nhan')?.donVi === 'case', 'Chỉ số phải có trong sổ, đơn vị case');
    assert(M().includes(f.w2.id) && M().includes(f.sp.id), 'Case mới tự tạo phải nằm trong tập');
    assertThrows(() => sosAuto.confirmPresetPlan(w2T, f.w2Plan.id), /đã được xác nhận rồi/, 'Xác nhận PA quy chế');
    assert(M().includes(f.w2.id), 'PA quy chế đang chạy nhưng CHƯA có nguyên nhân → vẫn chờ');
    cases.setIssues(w2T, f.w2.id, { primaryCode: 'student.writing.task' });
    assert(!M().includes(f.w2.id), 'Có nguyên nhân thì thôi chờ');
    sosAuto.dismissSosCase(P.mbManager, f.sp.id, { reasonCode: 'single_incident' });
    assert(!M().includes(f.sp.id), 'Case đã đóng không thuộc tập');
    const manual = cases.reportIssue(P.mbManager, { studentId: f.st.id, cycleId: f.st.cycleId, topic: 'reading', primaryCode: 'student.reading.logic',
      title: 'Case tay cho chỉ số', summary: 'Em hay mất tập trung ở phần này của bài, cần theo dõi thêm.' }) as any;
    assert(!M().includes(manual.id), 'Case tạo tay không thuộc tập');
    assertThrows(() => metricsSvc.metricSet(P.cpManager, 'case-cho-xac-dinh-nguyen-nhan', { branchId: bid }), /phạm vi/, 'Quản lý chi nhánh khác hỏi chi nhánh này');
  });

  // ================================================================== T5 — Phối hợp SOS (P01–P10)

  console.log('\nPR-T · 6. Phối hợp SOS (P01–P10) — T5');

  const attachmentsSvc: any = await import('../platform/attachments.ts');
  const outsiderT = loadPrincipal((get(
    `SELECT ur.user_id AS id FROM user_roles ur JOIN roles r ON r.id = ur.role_id
      WHERE r.key = 'teacher' AND ur.user_id NOT IN (SELECT user_id FROM teacher_assignments WHERE class_id = ? AND status = 'active')
      ORDER BY ur.user_id LIMIT 1`, CLASS) as any).id);
  const KINDS_SOS2 = 'talk_student,talk_family,gvcn_meeting';

  check('PR-T · P01 (§10#1) Lượt Mock FT có SOS lần đầu → việc phối hợp `preset = 1` theo bảng §5.3: MT2 SOS2 = HS + gia đình + GVCN meeting HS, đều `pending`, đúng học viên', () => {
    const f = freshSos('P01');
    const rows = coordOf(f.a.id);
    assert(rows.map((r) => r.kind).join() === KINDS_SOS2, `Việc: ${rows.map((r) => r.kind)}`);
    assert(rows.every((r) => r.preset === 1 && r.status === 'pending' && r.student_id === f.st.id && r.custom_name === null
      && r.performed_on === null && r.removed_at === null), `Dòng sai: ${JSON.stringify(rows[0])}`);
  });

  check('PR-T · P01 (§10#2) Chạy lặp (lưu lại điểm, chấm lại, nhập thêm kỹ năng đạt) KHÔNG nhân đôi việc phối hợp; việc GVCN đã bỏ KHÔNG hồi sinh', () => {
    const f = freshSos('P01re');
    phoiHop.removeCoordination(gvcn, rowOf(f.a.id, 'talk_family').id, { reasonCode: 'handled_otherwise' });
    scoreMt2(f.a); scoreMt2(f.a); enter(P.admin, f.a, 'listening', 7);
    const rows = coordOf(f.a.id);
    assert(rows.length === 3, `Chạy lặp phải giữ 3 việc, đang ${rows.length}`);
    assert(rowOf(f.a.id, 'talk_family').status === 'removed' && rowOf(f.a.id, 'talk_family').remove_reason_code === 'handled_otherwise', 'Việc đã bỏ không được sống lại');
  });

  check('PR-T · P02 Mức SOS TĂNG khi nhập thêm điểm → THÊM việc còn thiếu (MT2 SOS3 thêm CX/GĐCN meeting HS); việc đã có — kể cả đã xong — giữ nguyên', () => {
    const f = freshSos('P02');
    const td = rowOf(f.a.id, 'talk_student');
    phoiHop.confirmCoordination(gvcn, td.id, { performedOn: addDays(TODAY, -1), note: 'Đã gặp em sau buổi học' });
    enter(P.admin, f.a, 'reading', 5);                                   // thêm một kỹ năng trượt → SOS3
    const rows = coordOf(f.a.id);
    assert(rows.map((r) => r.kind).join() === `${KINDS_SOS2},cx_meeting_student`, `Sau khi lên SOS3: ${rows.map((r) => r.kind)}`);
    const again = rowOf(f.a.id, 'talk_student');
    assert(again.id === td.id && again.status === 'done' && again.performed_on === addDays(TODAY, -1) && again.note === 'Đã gặp em sau buổi học', `Việc đã xong bị đổi: ${JSON.stringify(again)}`);
    assert(rowOf(f.a.id, 'cx_meeting_student').status === 'pending' && rowOf(f.a.id, 'cx_meeting_student').preset === 1, 'Việc mới thêm phải pending, điền sẵn');
  });

  check('PR-T · P03 (§10#4) Sửa điểm làm SOS2 → SOS1: việc `pending` không còn trong bảng (GVCN meeting) tự `removed · system_sos_changed`; việc `done` GIỮ NGUYÊN; việc còn trong bảng vẫn pending', () => {
    const f = freshSos('P03');
    phoiHop.confirmCoordination(gvcn, rowOf(f.a.id, 'talk_student').id, { performedOn: TODAY });
    enter(P.admin, f.a, 'speaking', 7);                                  // Speaking đạt → chỉ còn W2 trượt → SOS1
    assert(rowOf(f.a.id, 'gvcn_meeting').status === 'removed' && rowOf(f.a.id, 'gvcn_meeting').remove_reason_code === 'system_sos_changed'
      && rowOf(f.a.id, 'gvcn_meeting').removed_at && rowOf(f.a.id, 'gvcn_meeting').removed_by === null, `GVCN meeting: ${JSON.stringify(rowOf(f.a.id, 'gvcn_meeting'))}`);
    assert(rowOf(f.a.id, 'talk_student').status === 'done', 'Việc đã xong không bị xoá / đổi');
    assert(rowOf(f.a.id, 'talk_family').status === 'pending', 'Việc còn trong bảng SOS1 vẫn pending');
  });

  check('PR-T · P03 SOS hết hẳn: mọi việc điền sẵn `pending` tự bỏ, việc `done` giữ, việc GVCN tự thêm (không phải điền sẵn) KHÔNG bị máy đụng; SOS lên lại thì việc bị bỏ vì hệ thống được HỒI LẠI (việc bị người bỏ thì không)', () => {
    const f = freshSos('P03b');
    phoiHop.confirmCoordination(gvcn, rowOf(f.a.id, 'talk_family').id, { performedOn: TODAY });
    phoiHop.addCoordination(gvcn, f.a.id, { kind: 'cx_meeting_family' });
    phoiHop.removeCoordination(gvcn, rowOf(f.a.id, 'talk_student').id, { reasonCode: 'not_needed' });
    enter(P.admin, f.a, 'writing2', 7); enter(P.admin, f.a, 'speaking', 7);   // hết SOS
    assert(rowOf(f.a.id, 'gvcn_meeting').remove_reason_code === 'system_sos_changed', 'Việc điền sẵn pending phải tự bỏ');
    assert(rowOf(f.a.id, 'talk_family').status === 'done', 'Việc đã xong giữ nguyên');
    assert(rowOf(f.a.id, 'cx_meeting_family').status === 'pending' && rowOf(f.a.id, 'cx_meeting_family').preset === 0, 'Việc GVCN tự thêm không bị hệ thống bỏ');
    assert(rowOf(f.a.id, 'talk_student').remove_reason_code === 'not_needed', 'Việc người bỏ giữ lý do của người');
    enter(P.admin, f.a, 'speaking', 5);                                  // trượt lại → SOS1 → bảng: HS + gia đình
    assert(rowOf(f.a.id, 'gvcn_meeting').status === 'removed', 'SOS1 không có GVCN meeting — vẫn bỏ');
    enter(P.admin, f.a, 'writing2', 5);                                  // SOS2 → gvcn_meeting quay lại bảng
    assert(rowOf(f.a.id, 'gvcn_meeting').status === 'pending' && rowOf(f.a.id, 'gvcn_meeting').remove_reason_code === null && rowOf(f.a.id, 'gvcn_meeting').removed_at === null, 'Việc bị hệ thống bỏ phải hồi lại khi bảng cần nó');
    assert(rowOf(f.a.id, 'talk_student').status === 'removed', 'Việc bị người bỏ không được hồi');
    assert(coordOf(f.a.id).length === 4, `Không nhân đôi: ${coordOf(f.a.id).map((r) => r.kind)}`);
  });

  check('PR-T · P04 Người thao tác: GVCN của lớp em đang học và Quản lý trong phạm vi; GVBM CHỈ XEM (không thêm/xác nhận/bỏ); người ngoài lớp không xem được; Quản lý chi nhánh khác không', () => {
    const f = freshSos('P04');
    const id = rowOf(f.a.id, 'talk_student').id;
    for (const [who, name] of [[w1T, 'GVBM W1'], [w2T, 'GVBM W2']] as const) {
      assertThrows(() => phoiHop.confirmCoordination(who, id, { performedOn: TODAY }), /chủ nhiệm|Quản lý|quyền/, `${name} xác nhận`);
      assertThrows(() => phoiHop.removeCoordination(who, id, { reasonCode: 'not_needed' }), /chủ nhiệm|Quản lý|quyền/, `${name} bỏ`);
      assertThrows(() => phoiHop.addCoordination(who, f.a.id, { kind: 'cx_meeting_student' }), /chủ nhiệm|Quản lý|quyền/, `${name} thêm`);
      assert((phoiHop.coordinationOfClass(who, CLASS) as any).rows.some((r: any) => r.attemptId === f.a.id), `${name} phải XEM được`);
    }
    assertThrows(() => phoiHop.coordinationOfClass(outsiderT, CLASS), /phạm vi/, 'Người ngoài lớp xem lớp');
    assertThrows(() => phoiHop.coordinationOfStudent(outsiderT, f.st.id), /phạm vi/, 'Người ngoài lớp xem học viên');
    assertThrows(() => phoiHop.confirmCoordination(P.cpManager, id, { performedOn: TODAY }), /phạm vi|quyền|chủ nhiệm/, 'Quản lý chi nhánh khác');
    assert(rowOf(f.a.id, 'talk_student').status === 'pending', 'Bị từ chối thì không đổi gì');
    phoiHop.confirmCoordination(P.mbManager, id, { performedOn: TODAY });
    phoiHop.confirmCoordination(gvcn, rowOf(f.a.id, 'talk_family').id, { performedOn: TODAY });
    assert(rowOf(f.a.id, 'talk_student').status === 'done' && rowOf(f.a.id, 'talk_family').status === 'done', 'Quản lý và GVCN thao tác được');
    assert((phoiHop.coordinationOfStudent(w1T, f.st.id) as any).canAct === false && (phoiHop.coordinationOfStudent(gvcn, f.st.id) as any).canAct === true, 'Cờ canAct cho giao diện ẩn nút');
  });

  check('PR-T · P05 GVCN THÊM việc bất kỳ trong sáu loại (`Khác` bắt buộc có tên), không trùng (lượt, loại, tên); BỎ được việc `pending` bất kỳ, không bỏ được việc đã xong', () => {
    const f = freshSos('P05');
    const add = (kind: string, customName?: string) => phoiHop.addCoordination(gvcn, f.a.id, { kind, customName });
    add('cx_meeting_student'); add('cx_meeting_family');
    add('other', 'Gặp riêng phụ huynh'); add('other', 'Nhờ CS nhắc lịch học');
    assertThrows(() => add('other'), /tên|Ghi rõ/, '`Khác` không tên');
    assertThrows(() => add('other', 'Gặp riêng phụ huynh'), /đã có/, 'Trùng tên');
    assertThrows(() => add('talk_student'), /đã có/, 'Trùng loại đã điền sẵn');
    assertThrows(() => add('report_gia_dinh'), /loại/, 'Loại lạ (Report cho gia đình không phải việc SOS)');
    assert(coordOf(f.a.id).length === 7, `Ba điền sẵn + bốn thêm = 7, có ${coordOf(f.a.id).length}`);
    assert(coordOf(f.a.id).filter((r) => r.preset === 0).length === 4, 'Việc thêm tay phải `preset = 0`');
    const done = rowOf(f.a.id, 'talk_student');
    phoiHop.confirmCoordination(gvcn, done.id, { performedOn: TODAY });
    assertThrows(() => phoiHop.removeCoordination(gvcn, done.id, { reasonCode: 'not_needed' }), /cần xử lý|đã xong/, 'Bỏ việc đã xong');
  });

  check('PR-T · P06+§10#7 Bỏ việc: lý do chọn nhanh NGAY tại dòng (không hộp thoại) — chỉ `Khác` cần chữ; `system_sos_changed` người dùng không chọn được; có audit; lượt tính 1/2 thay vì 1/3', () => {
    const f = freshSos('P06');
    const fam = rowOf(f.a.id, 'talk_family').id;
    assertThrows(() => phoiHop.removeCoordination(gvcn, fam, {}), /lý do/, 'Không lý do');
    assertThrows(() => phoiHop.removeCoordination(gvcn, fam, { reasonCode: 'system_sos_changed' }), /lý do/, 'Lý do của hệ thống');
    assertThrows(() => phoiHop.removeCoordination(gvcn, fam, { reasonCode: 'other' }), /ghi rõ|chữ/i, '`Khác` không chữ');
    assertThrows(() => phoiHop.removeCoordination(gvcn, fam, { reasonCode: 'bay-ba' }), /lý do/, 'Mã lạ');
    phoiHop.confirmCoordination(gvcn, rowOf(f.a.id, 'talk_student').id, { performedOn: TODAY });
    assert((phoiHop.coordinationOfStudent(gvcn, f.st.id) as any).rows[0].summary.label === '1/3', 'Trước khi bỏ: 1/3');
    phoiHop.removeCoordination(gvcn, fam, { reasonCode: 'handled_otherwise' });
    const r = get('SELECT * FROM sos_coordination_actions WHERE id = ?', fam);
    assert(r.status === 'removed' && r.remove_reason_code === 'handled_otherwise' && r.remove_reason_text === null && r.removed_by === gvcn.userId && r.removed_at, `Dòng bỏ: ${JSON.stringify(r)}`);
    assert((phoiHop.coordinationOfStudent(gvcn, f.st.id) as any).rows[0].summary.label === '1/2', 'Lượt tính 1/2 sau khi bỏ một việc');
    assert(count("SELECT COUNT(*) n FROM audit_logs WHERE action = 'sos_coordination.remove' AND entity_id = ?", fam) === 1, 'Bỏ việc phải lưu vết');
    const other = rowOf(f.a.id, 'gvcn_meeting').id;
    phoiHop.removeCoordination(gvcn, other, { reasonCode: 'other', reasonText: 'Em đã chuyển sang lớp khác' });
    assert(get('SELECT remove_reason_text FROM sos_coordination_actions WHERE id = ?', other).remove_reason_text === 'Em đã chuyển sang lớp khác', 'Lưu chữ của `Khác`');
  });

  check('PR-T · P07 Xác nhận xong: BẮT BUỘC ngày thực hiện, không cho ngày tương lai; ghi chú và tệp tuỳ chọn; tệp đính kèm được (GVCN/QL), GVBM chỉ xem', () => {
    const f = freshSos('P07');
    const id = rowOf(f.a.id, 'talk_student').id;
    assertThrows(() => phoiHop.confirmCoordination(gvcn, id, {}), /ngày thực hiện/, 'Thiếu ngày');
    assertThrows(() => phoiHop.confirmCoordination(gvcn, id, { performedOn: addDays(TODAY, 1) }), /tương lai/, 'Ngày tương lai');
    assertThrows(() => phoiHop.confirmCoordination(gvcn, id, { performedOn: 'hôm qua' }), /không hợp lệ/, 'Ngày sai định dạng');
    assert(rowOf(f.a.id, 'talk_student').status === 'pending', 'Lỗi thì chưa xong');
    phoiHop.confirmCoordination(gvcn, id, { performedOn: addDays(TODAY, -2) });               // không ghi chú, không tệp
    const r = get('SELECT * FROM sos_coordination_actions WHERE id = ?', id);
    assert(r.status === 'done' && r.performed_on === addDays(TODAY, -2) && r.performed_by === gvcn.userId && r.note === null, `Sau xác nhận: ${JSON.stringify(r)}`);
    assertThrows(() => phoiHop.confirmCoordination(gvcn, id, { performedOn: TODAY }), /đã xong|cần xử lý/, 'Xác nhận hai lần');
    /* Tệp bằng chứng: chủ là `sos_coordination_action`; quyền thêm = GVCN/QL, quyền xem = quyền xem học viên. */
    const link = attachmentsSvc.addLink(gvcn, { ownerType: 'sos_coordination_action', ownerId: id, url: 'https://example.com/bien-ban', displayName: 'Biên bản trao đổi' });
    assert(link.ownerType === 'sos_coordination_action', 'Tệp gắn vào việc phối hợp');
    assert(attachmentsSvc.listAttachments(w1T, 'sos_coordination_action', id).length === 1, 'GVBM xem được tệp');
    assertThrows(() => attachmentsSvc.addLink(w1T, { ownerType: 'sos_coordination_action', ownerId: id, url: 'https://example.com/x' }), /quyền/, 'GVBM thêm tệp');
    assertThrows(() => attachmentsSvc.listAttachments(outsiderT, 'sos_coordination_action', id), /phạm vi/, 'Người ngoài lớp xem tệp');
    assertThrows(() => attachmentsSvc.listAttachments(P.admin, 'sos_coordination_action', 999999), /Không tìm thấy/, 'Việc không tồn tại');
    /* Việc có ghi chú riêng. */
    phoiHop.confirmCoordination(gvcn, rowOf(f.a.id, 'talk_family').id, { performedOn: TODAY, note: 'Mẹ em hứa nhắc em học thêm', performerName: 'CS Lan' });
    const g = rowOf(f.a.id, 'talk_family');
    assert(g.note === 'Mẹ em hứa nhắc em học thêm' && g.performer_name === 'CS Lan', `Ghi chú/người làm: ${JSON.stringify(g)}`);
  });

  check('PR-T · P08+P10 Phối hợp SOS ĐỘC LẬP với case học thuật (hoàn thành cái này không đóng cái kia, và ngược lại) và KHÔNG có hạn cứng: không cột hạn, không vào việc quá hạn, không vào hiệu quả', () => {
    const f = freshSos('P08');
    for (const r of coordOf(f.a.id)) phoiHop.confirmCoordination(gvcn, r.id, { performedOn: TODAY });
    assert(get('SELECT status FROM sos_cases WHERE id = ?', f.w2.id).status === 'open' && get('SELECT status FROM sos_cases WHERE id = ?', f.sp.id).status === 'open', 'Hoàn thành phối hợp không đóng case');
    sosAuto.dismissSosCase(P.mbManager, f.sp.id, { reasonCode: 'single_incident' });
    assert(coordOf(f.a.id).every((r) => r.status === 'done'), 'Đóng case không đụng phối hợp');
    const cols = (conn.prepare('PRAGMA table_info(sos_coordination_actions)').all() as any[]).map((c) => c.name);
    assert(!cols.some((c: string) => /due|deadline|hạn/.test(c)), `Bảng không được có cột hạn: ${cols}`);
    const g = freshSos('P10');
    conn.prepare('UPDATE sos_coordination_actions SET created_at = ? WHERE attempt_id = ?').run(addDays(TODAY, -60) + 'T00:00:00.000Z', g.a.id);
    const keys = mywork(gvcn).map((i: any) => String(i.key));
    assert(!keys.some((k) => /coord|phoi/i.test(k) && k.includes(String(g.a.id))), `Phối hợp SOS không được thành việc có hạn: ${keys.filter((k) => /coord|phoi/i.test(k))}`);
    assert(!effectivenessSvc.planOutcomes({ studentIds: [g.st.id] }).some(() => true), 'Không vào bảng hiệu quả');
  });

  check('PR-T · P09 Danh sách theo lớp / theo học viên: mặc định chỉ lượt CHƯA hoàn thành; `includeDone` hiện cả lượt đã xong; mỗi lượt kèm MT · mức SOS · kỹ năng trượt · tóm tắt `{done}/{chưa bỏ}`', () => {
    const f = freshSos('P09');
    const list = () => (phoiHop.coordinationOfClass(gvcn, CLASS) as any);
    const mine = () => list().rows.find((r: any) => r.attemptId === f.a.id);
    assert(mine() && mine().attemptNo === 2 && mine().sosLevel === 2 && mine().summary.label === '0/3' && mine().studentId === f.st.id, `Dòng: ${JSON.stringify(mine())}`);
    assert(/Speaking/.test(mine().skillLabels.join()) && /Writing/.test(mine().skillLabels.join()), `Kỹ năng trượt: ${mine().skillLabels}`);
    const before = list().pendingCount;
    for (const r of coordOf(f.a.id)) phoiHop.confirmCoordination(gvcn, r.id, { performedOn: TODAY });
    assert(!mine(), 'Lượt đã hoàn thành phải ẩn mặc định');
    assert(list().pendingCount === before - 1, `Số lượt chưa hoàn thành (nút sub-tab) phải giảm 1: ${before} → ${list().pendingCount}`);
    const withDone = (phoiHop.coordinationOfClass(gvcn, CLASS, { includeDone: true }) as any).rows.find((r: any) => r.attemptId === f.a.id);
    assert(withDone && withDone.summary.complete && withDone.summary.label === '3/3', `includeDone: ${JSON.stringify(withDone?.summary)}`);
    const sv = (phoiHop.coordinationOfStudent(gvcn, f.st.id) as any).rows;
    assert(sv.length === 1 && sv[0].actions.length === 3, 'Theo học viên hiện đủ lượt đã xong');
  });

  check('PR-K · Một dòng Phối hợp SOS trong Việc cần làm của GVCN (`myCoordinationLines`): số khớp `pendingCount` của `coordinationOfClass`, giảm đúng khi một lượt hoàn thành, giáo viên bộ môn không chủ nhiệm không có dòng của lớp đó', () => {
    const f = freshSos('MYWORK-PH');
    const code = get('SELECT code n FROM classes WHERE id = ?', CLASS).n;
    const live = () => (phoiHop.coordinationOfClass(gvcn, CLASS) as any).pendingCount as number;
    const mine = () => (phoiHop.myCoordinationLines(gvcn) as any[]).find((l: any) => l.classId === CLASS);
    const before = live();
    assert(mine()?.pendingCount === before && mine()?.text === `Lớp ${code} — ${before} lượt Phối hợp SOS cần xử lý`,
      `Dòng trước khi xử lý: ${JSON.stringify(mine())} vs live ${before}`);
    for (const r of coordOf(f.a.id)) phoiHop.confirmCoordination(gvcn, r.id, { performedOn: TODAY });
    const after = live();
    assert(after === before - 1, `Một lượt vừa xong hết việc: pendingCount phải giảm đúng 1: ${before} → ${after}`);
    assert(mine()?.pendingCount === after, `Dòng Việc cần làm phải khớp số mới: ${JSON.stringify(mine())} vs live ${after}`);
    assert(!(phoiHop.myCoordinationLines(w1T) as any[]).some((l: any) => l.classId === CLASS), 'Giáo viên bộ môn không chủ nhiệm lớp thì không có dòng nhắc của lớp đó');
  });

  check('PR-T · Chỉ số Phối hợp §8: `phoi-hop-luot-sos` · `phoi-hop-dang-xu-ly` · `phoi-hop-hoan-thanh` (đơn vị: lượt) — số là độ dài tập ID, đúng quyền, chi nhánh khác bị từ chối', () => {
    const f = freshSos('MET'); const bid = get('SELECT branch_id n FROM classes WHERE id = ?', CLASS).n;
    const M = (id: string, who: any = P.mbManager) => metricsSvc.metricSet(who, id, { branchId: bid }) as any;
    for (const id of ['phoi-hop-luot-sos', 'phoi-hop-dang-xu-ly', 'phoi-hop-hoan-thanh']) assert(domain.metricById(id)?.donVi === 'luot-sos', `${id}: đơn vị lượt`);
    assert(M('phoi-hop-luot-sos').ids.includes(f.a.id) && M('phoi-hop-dang-xu-ly').ids.includes(f.a.id) && !M('phoi-hop-hoan-thanh').ids.includes(f.a.id), 'Lượt mới: có SOS, đang xử lý, chưa hoàn thành');
    for (const r of coordOf(f.a.id)) phoiHop.confirmCoordination(gvcn, r.id, { performedOn: TODAY });
    assert(M('phoi-hop-hoan-thanh').ids.includes(f.a.id) && !M('phoi-hop-dang-xu-ly').ids.includes(f.a.id) && M('phoi-hop-luot-sos').ids.includes(f.a.id), 'Xong hết: hoàn thành, không còn đang xử lý');
    enter(P.admin, f.a, 'writing2', 7); enter(P.admin, f.a, 'speaking', 7);      // hết SOS → không còn là SOS Event
    assert(!M('phoi-hop-luot-sos').ids.includes(f.a.id), 'SOS hết thì lượt không còn là SOS Event');
    assert(M('phoi-hop-luot-sos').n === M('phoi-hop-luot-sos').ids.length, 'Số = độ dài tập');
    assertThrows(() => M('phoi-hop-luot-sos', P.cpManager), /phạm vi/, 'Quản lý chi nhánh khác');
    assert(M('phoi-hop-luot-sos', w1T).ids.length === 0 && M('phoi-hop-luot-sos', w1T).empty === true, 'GVBM không có thống kê chi nhánh → rỗng có nhãn');
    const rows = metricsSvc.metricResponse(M('phoi-hop-luot-sos'), true).rows as any[];
    assert(rows.length === M('phoi-hop-luot-sos').ids.length && rows.every((r) => r.title && r.href), 'Danh sách bấm số phải có dòng đủ tên + đường dẫn');
  });

  // ================================================================== T6 — xoá vi phạm (V11′–V14′)

  console.log('\nPR-T · 7. Xoá vi phạm thẳng — thay "đánh dấu không chính xác" (V11′–V14′) — T6');

  const violSvc: any = await import('../yThuc/violations.ts');
  const measSvc: any = await import('../yThuc/measures.ts');
  const warnSvc: any = await import('../yThuc/canhBao.ts');
  const thongKeSvc: any = await import('../yThuc/thongKe.ts');
  const auditRows = (action: string, id?: number) => all('SELECT * FROM audit_logs WHERE action = ?' + (id ? ' AND entity_id = ?' : ''), ...(id ? [action, id] : [action]));
  const recordV = (who: any, sid: number, extra: Record<string, unknown> = {}) => (violSvc.recordViolation(who, {
    studentId: sid, category: 'homework', description: 'Không nộp bài Writing Task 2 buổi này', ...extra }) as any).violation.id as number;
  /** Ghi `n` vi phạm khác ngày cho một học viên, trả về danh sách id. */
  const recordMany = (sid: number, n: number) => Array.from({ length: n }, (_, i) => recordV(gvcn, sid, { occurredOn: addDays(TODAY, -(i + 1)), description: `Vi phạm thứ ${i + 1} dùng cho phép kiểm xoá` }));
  const mkMeasure = (sid: number, kind: string, ids: number[]) => measSvc.createMeasure(gvcn, { studentId: sid, kind, violationIds: ids }) as any;
  const doneMeasure = (sid: number, ids: number[]) => {
    const m = mkMeasure(sid, 'family_report', ids);
    return measSvc.confirmMeasure(gvcn, m.id, { performedOn: addDays(TODAY, 0), performedBy: gvcn.userId, note: 'Đã gửi report cho gia đình' }) as any;
  };

  check('PR-T · V11′ Ghi sai thì XOÁ thẳng: không lý do, không "đánh dấu không chính xác" (không còn hàm/route/trạng thái đó); dòng, dòng nối, lịch sử sửa và tệp gắn với nó biến mất', () => {
    const st = makeStudent('V11p');
    const [v, keep] = recordMany(st.id, 2);
    violSvc.editViolation(gvcn, v, { description: 'Sửa một lần để có dòng lịch sử sửa' });
    attachmentsSvc.addLink(gvcn, { ownerType: 'violation', ownerId: v, url: 'https://example.com/anh', displayName: 'Ảnh bài nộp' });
    const m = mkMeasure(st.id, 'talk_short', [v, keep]);
    assert(count('SELECT COUNT(*) n FROM violation_history WHERE violation_id = ?', v) >= 2, 'Tiền đề: có lịch sử sửa + lịch sử thêm vào biện pháp');
    assert(typeof violSvc.deleteViolation === 'function' && !violSvc.invalidateViolation, 'Phải có deleteViolation và KHÔNG còn invalidateViolation');
    violSvc.deleteViolation(gvcn, v);
    assert(!get('SELECT id FROM violations WHERE id = ?', v), 'Dòng vi phạm còn đó');
    assert(count('SELECT COUNT(*) n FROM measure_violations WHERE violation_id = ?', v) === 0, 'Dòng nối còn đó');
    assert(count('SELECT COUNT(*) n FROM violation_history WHERE violation_id = ?', v) === 0, 'Lịch sử sửa còn đó');
    assert(count("SELECT COUNT(*) n FROM attachments WHERE owner_type = 'violation' AND owner_id = ?", v) === 0, 'Tệp gắn với vi phạm còn đó');
    assert(count('SELECT COUNT(*) n FROM measure_violations WHERE measure_id = ?', m.id) === 1, 'Biện pháp chỉ còn vi phạm kia');
    assertThrows(() => violSvc.violationDetail(gvcn, v), /Không tìm thấy/, 'Đọc lại vi phạm đã xoá');
    assertThrows(() => violSvc.deleteViolation(gvcn, v), /Không tìm thấy/, 'Xoá hai lần');
    assert((violSvc.listViolations(gvcn, { studentId: st.id }) as any).rows.map((r: any) => r.id).join() === String(keep), 'Danh sách chỉ còn vi phạm kia');
  });

  check('PR-T · V13′ Xoá ghi ĐÚNG MỘT dòng `audit_logs` (ai · lúc nào · nội dung đã xoá · biện pháp bị gỡ) — chỉ để truy vết; có audit cho từng tệp bị xoá theo', () => {
    const st = makeStudent('V13p'); const [v, other] = recordMany(st.id, 2);
    attachmentsSvc.addLink(gvcn, { ownerType: 'violation', ownerId: v, url: 'https://example.com/bang-chung', displayName: 'Bằng chứng' });
    const m = mkMeasure(st.id, 'talk_short', [v, other]);
    violSvc.deleteViolation(gvcn, v);
    const rows = auditRows('violation.delete', v);
    assert(rows.length === 1 && rows[0].actor_user_id === gvcn.userId && rows[0].entity_type === 'violation' && rows[0].created_at, `Audit: ${JSON.stringify(rows)}`);
    const before = JSON.parse(rows[0].before_json);
    assert(before.description.startsWith('Vi phạm thứ 1') && before.category === 'homework' && before.occurredOn === addDays(TODAY, -1)
      && before.reportedBy === gvcn.userId && JSON.stringify(before.measureIds) === JSON.stringify([m.id]) && before.studentId === st.id, `Nội dung đã xoá: ${rows[0].before_json}`);
    assert(count("SELECT COUNT(*) n FROM audit_logs WHERE action = 'attachment.delete' AND before_json LIKE ?", '%"ownerId":' + v + '%') === 1, 'Tệp bị xoá theo phải có audit riêng');
  });

  check('PR-T · V10+V12′ Người xoá được: người ghi (của mình) · GVCN của lớp · Quản lý trong phạm vi · Quản trị; GVBM đồng nghiệp, giáo viên ngoài lớp, Quản lý chi nhánh khác thì KHÔNG — vi phạm còn nguyên', () => {
    const st = makeStudent('V10p');
    const byW1 = recordV(w1T, st.id, { description: 'Vi phạm do GV Writing 1 ghi' });
    for (const [who, name] of [[w2T, 'GVBM đồng nghiệp'], [outsiderT, 'GV ngoài lớp'], [P.cpManager, 'Quản lý CP']] as const) {
      assertThrows(() => violSvc.deleteViolation(who, byW1), /quyền|phạm vi|người ghi|chủ nhiệm/, `${name} xoá vi phạm`);
    }
    assert(get('SELECT id FROM violations WHERE id = ?', byW1), 'Bị từ chối thì vi phạm còn nguyên');
    violSvc.deleteViolation(w1T, byW1);                                                    // người ghi xoá của mình
    for (const who of [gvcn, P.mbManager, P.admin]) {
      const v = recordV(w1T, st.id, { description: 'Vi phạm sẽ bị người có quyền xoá' });
      violSvc.deleteViolation(who, v);
      assert(!get('SELECT id FROM violations WHERE id = ?', v), 'GVCN / Quản lý / Quản trị xoá được');
    }
  });

  check('PR-T · V12′ Xoá được ở mọi nơi — kể cả vi phạm đang nằm trong biện pháp ĐANG CHUẨN BỊ hay ĐÃ THỰC HIỆN; thao tác đi qua danh sách lớp, hồ sơ học viên (cùng hàm); Q15 chặn xoá vi phạm DUY NHẤT còn lại của PA đang chuẩn bị', () => {
    const st = makeStudent('V12p'); const ids = recordMany(st.id, 4);
    const prep = mkMeasure(st.id, 'talk_short', [ids[0], ids[1]]);
    const done = doneMeasure(st.id, [ids[2], ids[3]]);
    violSvc.deleteViolation(gvcn, ids[0]); violSvc.deleteViolation(gvcn, ids[2]);
    assert(count('SELECT COUNT(*) n FROM measure_violations WHERE measure_id = ?', prep.id) === 1 && count('SELECT COUNT(*) n FROM measure_violations WHERE measure_id = ?', done.id) === 1, 'Đã gỡ khỏi cả hai biện pháp');
    assert(get('SELECT status FROM discipline_measures WHERE id = ?', done.id).status === 'done', 'Biện pháp đã thực hiện còn nguyên');
    /* Q15 (rulebook thay đổi 23/09/2026): PA ĐANG CHUẨN BỊ chỉ còn MỘT vi phạm — xoá nó bị CHẶN (B02: PA phải có ít nhất một vi phạm), không còn để PA nháp mất hết vi phạm ngầm như trước. */
    assertThrows(
      () => violSvc.deleteViolation(gvcn, ids[1]),
      /vi phạm duy nhất của phương án.*đang chuẩn bị/,
      'Xoá vi phạm duy nhất của PA đang chuẩn bị phải bị chặn (Q15)',
    );
    const stillThere = measSvc.measureDetail(gvcn, prep.id) as any;
    assert(stillThere.status === 'preparing' && stillThere.violationCount === 1, `Dữ liệu không đổi sau khi bị chặn: ${JSON.stringify({ s: stillThere.status, c: stillThere.violationCount })}`);
  });

  check('PR-T · V14′ (§10#9) Xoá vi phạm nằm trong Report gia đình ĐÃ THỰC HIỆN: Report còn (việc đã làm thật), số vi phạm của biện pháp là số ĐANG GẮN (giảm 1, không phải ảnh chụp), thống kê giảm 1, có dòng audit', () => {
    const st = makeStudent('V14p'); const ids = recordMany(st.id, 5);
    const report = doneMeasure(st.id, ids);
    assert(report.violationCount === 5 && report.violations.length === 5 && !('violationCountAtConfirm' in report) && !('invalidNote' in report) && !('invalidViolationCount' in report),
      `Trước khi xoá: ${JSON.stringify({ c: report.violationCount, keys: Object.keys(report).filter((k) => /invalid|AtConfirm/.test(k)) })}`);
    const total = () => (metricsSvc.metricSet(P.mbManager, 'vi-pham-tong', { branchId: get('SELECT branch_id n FROM classes WHERE id = ?', CLASS).n }).ids as number[]);
    assert(total().includes(ids[1]), 'Tiền đề: vi phạm nằm trong thống kê');
    const before = total().length;
    violSvc.deleteViolation(gvcn, ids[1]);
    const after = measSvc.measureDetail(gvcn, report.id) as any;
    assert(after.status === 'done' && after.performedOn === report.performedOn && after.violationCount === 4 && after.violations.length === 4, `Sau khi xoá: ${JSON.stringify({ s: after.status, c: after.violationCount })}`);
    assert(total().length === before - 1 && !total().includes(ids[1]), 'Thống kê phải giảm đúng 1');
    assert(auditRows('violation.delete', ids[1]).length === 1, 'Phải có dòng audit');
    /* Xoá hết vi phạm của biện pháp đã thực hiện: biện pháp VẪN giữ (việc đã làm thật), hiện 0 vi phạm. */
    for (const id of [ids[0], ids[2], ids[3], ids[4]]) violSvc.deleteViolation(gvcn, id);
    const empty = measSvc.measureDetail(gvcn, report.id) as any;
    assert(empty.status === 'done' && empty.violationCount === 0 && empty.violations.length === 0, `Report mất hết vi phạm phải còn với 0 vi phạm: ${JSON.stringify({ s: empty.status, c: empty.violationCount })}`);
    const measured = metricsSvc.metricSet(P.mbManager, 'bien-phap-da-thuc-hien', { branchId: get('SELECT branch_id n FROM classes WHERE id = ?', CLASS).n }).ids as number[];
    assert(measured.includes(report.id), 'Biện pháp đã thực hiện vẫn được thống kê');
  });

  check('PR-T · V13′ Mọi số liệu tự cập nhật sau khi xoá: cảnh báo 5 ngày đổi theo vi phạm cũ nhất còn lại; xoá hết thì hết cảnh báo; bảng ba khu vực của lớp không còn dòng đó', () => {
    const st = makeStudent('V13q');
    const old = recordV(gvcn, st.id, { occurredOn: addDays(TODAY, -10), description: 'Vi phạm cũ nhất, sẽ bị xoá đầu tiên' });
    const newer = recordV(gvcn, st.id, { occurredOn: addDays(TODAY, -7), description: 'Vi phạm mới hơn, xoá sau' });
    assert((warnSvc.studentWarning(gvcn, st.id) as any).oldestAgeDays === 10, 'Trước khi xoá');
    violSvc.deleteViolation(gvcn, old);
    const w = warnSvc.studentWarning(gvcn, st.id) as any;
    assert(w.oldestAgeDays === 7 && w.count === 1 && w.active, `Cảnh báo phải theo vi phạm còn lại: ${JSON.stringify(w)}`);
    violSvc.deleteViolation(gvcn, newer);
    assert((warnSvc.studentWarning(gvcn, st.id) as any).count === 0 && !(warnSvc.studentWarning(gvcn, st.id) as any).active, 'Xoá hết thì hết cảnh báo');
  });

  check('PR-T · Trạng thái hiển thị của vi phạm còn BA: Chưa xử lý · Đang chuẩn bị xử lý · Đã xử lý; không còn `Không còn hiệu lực`, không còn cột/trường hiệu lực trong dữ liệu trả ra', () => {
    assert(JSON.stringify(domain.VIOLATION_STATES) === JSON.stringify(['unhandled', 'preparing', 'handled']), `Trạng thái: ${domain.VIOLATION_STATES}`);
    assert(JSON.stringify(domain.VIOLATION_STATE_LABEL) === JSON.stringify({ unhandled: 'Chưa xử lý', preparing: 'Đang chuẩn bị xử lý', handled: 'Đã xử lý' }), 'Nhãn ba trạng thái');
    assert(domain.violationState({ inDone: true, inPreparing: true }) === 'handled' && domain.violationState({ inDone: false, inPreparing: true }) === 'preparing' && domain.violationState({ inDone: false, inPreparing: false }) === 'unhandled', 'Thứ tự ưu tiên');
    const st = makeStudent('V14s'); const v = recordV(gvcn, st.id);
    const view = (violSvc.listViolations(gvcn, { studentId: st.id }) as any).rows[0];
    for (const k of ['valid', 'invalidReason', 'invalidatedBy', 'invalidatedByName', 'invalidatedAt']) assert(!(k in view), `Vi phạm còn trường "${k}" của mô hình cũ`);
    assert(view.id === v && view.state === 'unhandled', 'Trạng thái suy ra');
    assert(!(violSvc as any).invalidateViolation, 'Không còn hàm hủy');
  });

  check('PR-T · Chỉ số `vi-pham-khong-hieu-luc` đã BỎ khỏi sổ chỉ số và khỏi hàm thống kê Ý thức (không còn trạng thái đó); tám chỉ số Ý thức còn lại (bảy của PR-J + `vi-pham-theo-nhom` của PR-YT2)', () => {
    assert(domain.metricById('vi-pham-khong-hieu-luc') === null && !domain.METRICS.some((m: any) => m.id === 'vi-pham-khong-hieu-luc'), 'Sổ chỉ số vẫn còn');
    const thongKe: any = thongKeSvc;
    assert(!thongKe.YTHUC_METRIC_IDS.includes('vi-pham-khong-hieu-luc') && thongKe.YTHUC_METRIC_IDS.length === 8, `Ý thức: ${thongKe.YTHUC_METRIC_IDS}`);
    assertThrows(() => metricsSvc.metricSet(P.mbManager, 'vi-pham-khong-hieu-luc', {}), /Không tìm thấy/, 'Hỏi chỉ số đã bỏ');
  });

  check('PR-T · V13′ Nâng cấp database cũ: dòng `valid = 0` được XOÁ (kèm dòng nối, lịch sử, tệp, và một dòng audit mỗi vi phạm); dòng hợp lệ và biện pháp giữ nguyên; chạy lặp không làm gì', () => {
    const m = preTDatabase();
    migrateMod.migrateSosV3(m, []);
    const NOW = '2026-09-10T00:00:00.000Z';
    const q = (sql: string, ...a: unknown[]) => Number(m.prepare(sql).run(...a).lastInsertRowid);
    q(`INSERT INTO classes (id, code, branch_id, kind, status, created_at) VALUES (1, 'MB FT 1', 1, 'FT', 'active', ?)`, NOW);
    const viol = (valid: number, desc: string) => q(
      `INSERT INTO violations (student_id, class_id, category, occurred_on, reported_on, reported_by, description, valid, invalid_reason, invalidated_by, invalidated_at, created_at)
       VALUES (1, 1, 'homework', '2026-09-01', '2026-09-02', 1, ?, ?, ?, ?, ?, ?)`, desc, valid, valid ? null : 'Em đã nộp, tôi bỏ sót', valid ? null : 1, valid ? null : NOW, NOW);
    const good = viol(1, 'Vi phạm còn hiệu lực giữ lại'), bad = viol(0, 'Vi phạm đã đánh dấu không chính xác');
    const measure = q(`INSERT INTO discipline_measures (student_id, class_id, kind, status, performed_on, violation_count_at_confirm, created_at, created_by) VALUES (1,1,'family_report','done','2026-09-05',2,?,1)`, NOW);
    for (const v of [good, bad]) q('INSERT INTO measure_violations (measure_id, violation_id, added_at) VALUES (?,?,?)', measure, v, NOW);
    q(`INSERT INTO violation_history (violation_id, field, old_value, new_value, reason, actor_user_id, created_at) VALUES (?, 'valid', '1', '0', 'Em đã nộp, tôi bỏ sót', 1, ?)`, bad, NOW);
    q(`INSERT INTO attachments (owner_type, owner_id, kind, url, display_name, uploaded_by, created_at) VALUES ('violation', ?, 'link', 'https://x.example', 'Bằng chứng cũ', 1, ?)`, bad, NOW);
    const applied: string[] = [];
    migrateMod.migrateDeleteInvalidViolations(m, applied);
    const n = (sql: string, ...a: unknown[]) => (m.prepare(sql).get(...a) as any).n as number;
    assert(n('SELECT COUNT(*) n FROM violations') === 1 && n('SELECT COUNT(*) n FROM violations WHERE id = ?', good) === 1, 'Chỉ còn vi phạm hợp lệ');
    assert(n('SELECT COUNT(*) n FROM measure_violations WHERE violation_id = ?', bad) === 0 && n('SELECT COUNT(*) n FROM measure_violations WHERE measure_id = ?', measure) === 1, 'Dòng nối bị gỡ, biện pháp còn với 1 vi phạm');
    assert(n('SELECT COUNT(*) n FROM violation_history WHERE violation_id = ?', bad) === 0 && n("SELECT COUNT(*) n FROM attachments WHERE owner_type = 'violation'") === 0, 'Lịch sử và tệp đi theo');
    const audit = m.prepare("SELECT * FROM audit_logs WHERE action = 'violation.delete'").all() as any[];
    assert(audit.length === 1 && audit[0].entity_id === bad && JSON.parse(audit[0].before_json).description.includes('không chính xác') && JSON.parse(audit[0].before_json).legacyInvalidReason === 'Em đã nộp, tôi bỏ sót', `Audit: ${JSON.stringify(audit)}`);
    assert(applied.length === 1 && /1 vi phạm/.test(applied[0]), `Báo cáo nâng cấp: ${applied.join(' | ')}`);
    const again: string[] = [];
    migrateMod.migrateDeleteInvalidViolations(m, again);
    assert(again.length === 0 && n("SELECT COUNT(*) n FROM audit_logs WHERE action = 'violation.delete'") === 1, 'Chạy lần hai không làm gì');
  });

  // ================================================================== Gọi thẳng đường HTTP — máy chủ từ chối, không chỉ ẩn nút

  const { createApp } = await import('../app.ts');
  const { createSession } = await import('../auth.ts');
  const server = createApp().listen(0);
  const port = (server.address() as any).port as number;
  const call = async (who: any | null, method: string, url: string, body?: unknown) => {
    const headers: Record<string, string> = { 'content-type': 'application/json' };
    if (who) headers.cookie = `pisa_demo_session=${createSession(who.userId)}`;
    const res = await fetch(`http://127.0.0.1:${port}/api${url}`, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
    let json: any = null;
    try { json = await res.json(); } catch { /* không có thân */ }
    return { status: res.status, json };
  };
  const hf = freshSos('HTTP');
  const hBranch = get('SELECT branch_id n FROM classes WHERE id = ?', CLASS).n;
  const hViol = recordV(w1T, hf.st.id, { description: 'Vi phạm để thử xoá qua đường HTTP' });
  const h = {
    noAuth: await call(null, 'GET', `/students/${hf.st.id}/phoi-hop-sos`),
    confirmOther: await call(w1T, 'POST', `/interventions/${hf.w2Plan.id}/confirm`, {}),
    confirmQuyChe: await call(w2T, 'POST', `/interventions/${hf.w2Plan.id}/confirm`, { description: 'Tự học · 1 tháng — viết 2 bài Task 2 mỗi tuần' }),
    replaceQuyChe: await call(w2T, 'POST', `/interventions/${hf.w2Plan.id}/replace`, { kind: 'tutor', description: 'Tutor kèm Writing Task 2 hai buổi mỗi tuần', performerSelf: true }),
    dismissBad: await call(P.mbManager, 'POST', `/cases/${hf.sp.id}/dismiss`, { reasonCode: 'bay-ba' }),
    dismissOk: await call(P.mbManager, 'POST', `/cases/${hf.sp.id}/dismiss`, { reasonCode: 'single_incident' }),
    listOutsider: await call(outsiderT, 'GET', `/students/${hf.st.id}/phoi-hop-sos`),
    listGvcn: await call(gvcn, 'GET', `/students/${hf.st.id}/phoi-hop-sos`),
    listClassGvbm: await call(w1T, 'GET', `/classes/${CLASS}/phoi-hop-sos`),
    confirmCoordGvbm: await call(w1T, 'POST', `/phoi-hop-sos/${rowOf(hf.a.id, 'talk_student').id}/confirm`, { performedOn: TODAY }),
    confirmCoordOk: await call(gvcn, 'POST', `/phoi-hop-sos/${rowOf(hf.a.id, 'talk_student').id}/confirm`, { performedOn: TODAY, note: 'Đã trao đổi' }),
    removeCoordNoReason: await call(gvcn, 'POST', `/phoi-hop-sos/${rowOf(hf.a.id, 'talk_family').id}/remove`, {}),
    removeCoordOk: await call(gvcn, 'POST', `/phoi-hop-sos/${rowOf(hf.a.id, 'talk_family').id}/remove`, { reasonCode: 'handled_otherwise' }),
    addCoord: await call(gvcn, 'POST', `/attempts/${hf.a.id}/phoi-hop-sos`, { kind: 'cx_meeting_student' }),
    addCoordGvbm: await call(w1T, 'POST', `/attempts/${hf.a.id}/phoi-hop-sos`, { kind: 'cx_meeting_family' }),
    delPeer: await call(w2T, 'DELETE', `/violations/${hViol}`),
    invalidate: await call(w1T, 'POST', `/violations/${hViol}/invalidate`, { reason: 'x' }),
    delOwn: await call(w1T, 'DELETE', `/violations/${hViol}`),
    metricMb: await call(P.mbManager, 'GET', `/metrics/phoi-hop-luot-sos?rows=1&branchId=${hBranch}`),
    metricCp: await call(P.cpManager, 'GET', `/metrics/phoi-hop-luot-sos?branchId=${hBranch}`),
    metricOld: await call(P.mbManager, 'GET', `/metrics/vi-pham-khong-hieu-luc?branchId=${hBranch}`),
    metricCase: await call(P.mbManager, 'GET', `/metrics/case-cho-xac-dinh-nguyen-nhan?rows=1&branchId=${hBranch}`),
  };
  server.close();

  check('PR-T · HTTP Case từ SOS: chưa đăng nhập → 401; GVBM kỹ năng khác xác nhận → 403; GVBM đúng kỹ năng xác nhận / thay PA quy chế → 400 "đã được xác nhận rồi" (PR-N1 S4-1); Quản lý đóng `Không cần theo dõi` (lý do lạ → 400, hợp lệ → 200)', () => {
    assert(h.noAuth.status === 401, `Chưa đăng nhập: ${h.noAuth.status}`);
    assert(h.confirmOther.status === 403, `GVBM W1 xác nhận case W2 qua HTTP phải bị 403, được ${h.confirmOther.status}`);
    assert(h.confirmQuyChe.status === 400 && /đã được xác nhận rồi/.test(h.confirmQuyChe.json?.error ?? ''), `Xác nhận PA quy chế: ${h.confirmQuyChe.status} ${JSON.stringify(h.confirmQuyChe.json?.error)}`);
    assert(h.replaceQuyChe.status === 400 && /đã được xác nhận rồi/.test(h.replaceQuyChe.json?.error ?? ''), `Thay PA quy chế: ${h.replaceQuyChe.status} ${JSON.stringify(h.replaceQuyChe.json?.error)}`);
    assert(get('SELECT status FROM case_interventions WHERE id = ?', hf.w2Plan.id).status === 'started', 'PA quy chế vẫn đang chạy');
    assert(h.dismissBad.status === 400 && /lý do/.test(h.dismissBad.json?.error ?? ''), `Lý do lạ: ${h.dismissBad.status} ${h.dismissBad.json?.error}`);
    assert(h.dismissOk.status === 200 && h.dismissOk.json?.status === 'done' && h.dismissOk.json?.sos?.dismissed?.code === 'single_incident', `Đóng không cần theo dõi: ${h.dismissOk.status}`);
  });

  check('PR-T · HTTP Phối hợp SOS: đọc theo học viên/lớp (GVBM xem được, người ngoài lớp 403); GVBM thêm/xác nhận 403; GVCN xác nhận · bỏ (thiếu lý do → 400) · thêm việc → 200', () => {
    assert(h.listOutsider.status === 403, `Người ngoài lớp: ${h.listOutsider.status}`);
    assert(h.listGvcn.status === 200 && h.listGvcn.json?.canAct === true && h.listGvcn.json?.rows?.[0]?.actions?.length >= 3, `GVCN đọc: ${h.listGvcn.status}`);
    assert(h.listClassGvbm.status === 200 && (h.listClassGvbm.json?.rows ?? []).some((r: any) => r.attemptId === hf.a.id), 'GVBM đọc được danh sách lớp');
    assert(h.confirmCoordGvbm.status === 403 && h.addCoordGvbm.status === 403, `GVBM xác nhận/thêm: ${h.confirmCoordGvbm.status}/${h.addCoordGvbm.status}`);
    assert(h.confirmCoordOk.status === 200 && h.confirmCoordOk.json?.status === 'done', `GVCN xác nhận: ${h.confirmCoordOk.status}`);
    assert(h.removeCoordNoReason.status === 400 && h.removeCoordOk.status === 200 && h.removeCoordOk.json?.removeReasonCode === 'handled_otherwise', `Bỏ việc: ${h.removeCoordNoReason.status}/${h.removeCoordOk.status}`);
    assert(h.addCoord.status === 200 && h.addCoord.json?.kind === 'cx_meeting_student' && h.addCoord.json?.preset === false, `Thêm việc: ${h.addCoord.status} ${h.addCoord.json?.error}`);
  });

  check('PR-T · HTTP Xoá vi phạm: đồng nghiệp xoá → 403; người ghi xoá → 200 `{ok, removedFromMeasures}`; đường `invalidate` cũ đã BỎ (404)', () => {
    assert(h.delPeer.status === 403, `Đồng nghiệp xoá: ${h.delPeer.status}`);
    assert(h.invalidate.status === 404, `Đường invalidate phải không còn: ${h.invalidate.status}`);
    assert(h.delOwn.status === 200 && h.delOwn.json?.ok === true && h.delOwn.json?.removedFromMeasures === 0, `Người ghi xoá: ${h.delOwn.status} ${JSON.stringify(h.delOwn.json)}`);
    assert(!get('SELECT id FROM violations WHERE id = ?', hViol), 'Vi phạm phải biến mất');
  });

  check('PR-T · HTTP Chỉ số mới: Quản lý MB xem `phoi-hop-luot-sos` (có dòng bấm được) và `case-cho-xac-dinh-nguyen-nhan`; Quản lý chi nhánh khác → 403; `vi-pham-khong-hieu-luc` → 404', () => {
    assert(h.metricMb.status === 200 && h.metricMb.json?.n === h.metricMb.json?.ids?.length && h.metricMb.json?.rows?.length === h.metricMb.json?.n && h.metricMb.json?.n > 0, `Quản lý MB: ${h.metricMb.status}`);
    assert(h.metricCp.status === 403, `Quản lý CP: ${h.metricCp.status}`);
    assert(h.metricOld.status === 404, `Chỉ số đã bỏ: ${h.metricOld.status}`);
    assert(h.metricCase.status === 200 && h.metricCase.json?.n === h.metricCase.json?.ids?.length, `case-cho-xac-dinh-nguyen-nhan: ${h.metricCase.status}`);
  });

  void load;
  void t;
}

/**
 * BỘ DEMO v3 (T8) — soi vào CHÍNH dữ liệu seed, nên phải chạy NGAY SAU KHI DỰNG, trước mọi phép kiểm khác (các phép kiểm khác chọn học viên "sạch case"
 * rồi ghi thêm dữ liệu vào đúng những em đó). `run.ts` gọi hàm này ở mục 0, cùng chỗ với các phép kiểm bộ demo khác.
 */
export async function runSosV3DemoTests(t: YThucTestKit) {
  const { check, assert } = t;
  const load = async (path: string): Promise<any> => import(path);
  console.log('\nPR-T · 0. Bộ demo v3 — các tình huống §9 (soi vào chính dữ liệu demo) — T8');
    const c0: any = t.conn;
    const rows0 = (sql: string, ...a: unknown[]) => c0.prepare(sql).all(...a) as any[];
    const demoStudent = (name: string): number => {
      const r = rows0('SELECT id FROM students WHERE full_name = ?', name);
      assert(r.length === 1, `Bộ demo phải có đúng một học viên tên "${name}", đang có ${r.length}`);
      return r[0].id;
    };
    const sosState: any = await load('../cases/sosState.ts');
    const KHOI = 'Đỗ Minh Khôi', LAN = 'Vũ Ngọc Lan', VY = 'Bùi Thảo Vy';
    const coord0 = (sid: number) => rows0('SELECT x.*, a.attempt_no FROM sos_coordination_actions x JOIN assessment_attempts a ON a.id = x.attempt_id WHERE x.student_id = ? ORDER BY x.id', sid);
    const cases0 = (sid: number) => rows0('SELECT * FROM sos_cases WHERE student_id = ? ORDER BY id', sid);

  check('PR-T · T8 DEMO Khôi: MT2 SOS2 (W2 + Speaking) → hai case từ SOS; Speaking đã có nguyên nhân (PA quy chế tự chạy), W2 còn CHỜ xác định nguyên nhân; Phối hợp 1/3 xong; cùng em có vi phạm Ý thức', () => {
      const sid = demoStudent(KHOI);
      const cs = cases0(sid);
      assert(cs.map((c) => c.category).sort().join() === 'speaking,writing2' && cs.every((c) => c.origin_kind === 'mock' && sosState.sosCaseState(c.id).fromSos), 'Hai case tự tạo từ SOS');
      const sp = cs.find((c) => c.category === 'speaking'), w2 = cs.find((c) => c.category === 'writing2');
      assert(!sosState.sosCaseState(sp.id).awaitingCause && sosState.sosCaseState(sp.id).hasCause, 'Speaking đã có nguyên nhân → thôi chờ');
      assert(sosState.sosCaseState(w2.id).awaitingCause && sosState.sosCaseState(w2.id).dueOn, 'W2 còn chờ xác định nguyên nhân, có hạn 3 ngày');
      const co = coord0(sid);
      assert(co.length === 3 && co.every((r) => r.attempt_no === 2) && co.filter((r) => r.status === 'done').length === 1 && co.filter((r) => r.status === 'pending').length === 2, `Phối hợp: ${co.map((r) => r.kind + ':' + r.status)}`);
      assert(rows0('SELECT COUNT(*) n FROM violations WHERE student_id = ?', sid)[0].n >= 2, 'Cùng em có vi phạm Ý thức');
    });

  check('PR-T · T8 DEMO Lan: MT1 SOS3 → ba case (Tutor · đến MT2); case Speaking đã đóng `Không cần theo dõi · Tình huống đơn lẻ`; Phối hợp SOS3 (HS + gia đình + GVCN meeting) xong 2/3', () => {
      const sid = demoStudent(LAN);
      const cs = cases0(sid);
      assert(cs.length === 3 && cs.every((c) => c.sos_level === 3), `Ba case SOS3: ${cs.map((c) => c.category + ':' + c.sos_level)}`);
      const sp = cs.find((c) => c.category === 'speaking');
      assert(sp.status === 'done' && sp.dismiss_reason_code === 'single_incident' && sp.outcome === null, 'Case Speaking đóng vì không cần theo dõi');
      assert(sosState.sosCaseState(cs.find((c) => c.category === 'listening').id).awaitingCause, 'Case còn lại chờ xác định nguyên nhân');
      assert(rows0("SELECT 1 FROM case_interventions WHERE case_id IN (SELECT id FROM sos_cases WHERE student_id = ?) AND preset = 1 AND description = 'Tutor · đến MT2'", sid).length === 3, 'Phương án điền sẵn Tutor · đến MT2 cho cả ba case');
      const co = coord0(sid);
      assert(co.map((r) => r.kind).join() === 'talk_student,talk_family,gvcn_meeting' && co.filter((r) => r.status === 'done').length === 2, `Phối hợp: ${co.map((r) => r.kind + ':' + r.status)}`);
    });

  check('PR-T · T8 DEMO Vy: MT3 SOS1 → một lượt Phối hợp ĐÃ HOÀN THÀNH (2/2); ba mức SOS khác nhau xuất hiện trong bộ demo; có cả lượt hoàn thành lẫn chưa hoàn thành', () => {
      const sid = demoStudent(VY);
      const co = coord0(sid);
      assert(co.length === 2 && co.every((r) => r.status === 'done' && r.attempt_no === 3), `Phối hợp Vy: ${co.map((r) => r.kind + ':' + r.status)}`);
      const levels = new Set<number>();
      for (const n of [KHOI, LAN, VY]) for (const c of cases0(demoStudent(n))) levels.add(c.sos_level);
      assert([1, 2, 3].every((l) => levels.has(l)), `Phải đủ ba mức SOS trong demo: ${[...levels]}`);
      const all0 = rows0(`SELECT attempt_id, MAX(status = 'pending') pend FROM sos_coordination_actions GROUP BY attempt_id`);
      assert(all0.some((r) => r.pend === 1) && all0.some((r) => r.pend === 0), 'Có lượt đang xử lý và lượt hoàn thành');
    });
}
