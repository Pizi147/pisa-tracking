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

  // ================================================================== 2. Luật quyết định (shared/domain)

  console.log('\nPR-S2 · 2. Quyết định của lần Ghi kết quả: Giữ nguyên · Điều chỉnh · Thay phương án · Kết thúc phương án');

  check('PR-S2 · S4: Chưa đủ dữ liệu được Giữ nguyên / Điều chỉnh / Thay nhưng không Kết thúc suông; kết quả tốt đủ năm lựa chọn; kết quả chưa tốt không Kết thúc suông', () => {
    const f = (o: string) => domain.decisionsFor(o).join(',');
    assert(f('insufficient') === 'keep,adjust,replace', `insufficient: ${f('insufficient')}`);
    assert(domain.endStepsFor('insufficient').join(',') === 'propose', 'Chưa đủ dữ liệu ở tab kết thúc chỉ được Thay');
    assert(!domain.canEndWithOutcome('insufficient'), 'canEndWithOutcome vẫn nghĩa là "kết thúc suông được không" — Chưa đủ dữ liệu thì không');
    assert(f('improved') === 'keep,adjust,replace,end,ask_manager', `improved: ${f('improved')}`);
    assert(f('partial') === 'keep,adjust,replace,end,ask_manager', `partial: ${f('partial')}`);
    assert(f('unchanged') === 'keep,adjust,replace,ask_manager', `unchanged: ${f('unchanged')}`);
    assert(f('worse') === 'keep,adjust,replace,ask_manager', `worse: ${f('worse')}`);
    assert(domain.decisionBlockedReason('worse', 'end') && domain.decisionBlockedReason('worse', 'replace') === null,
      'Kém hơn: Kết thúc phải bị chặn kèm lý do, Thay thì được');
    assert(domain.decisionBlockedReason('insufficient', 'replace') === null, 'Chưa đủ dữ liệu: Thay phải được chọn (Q2)');
    assert(/Chưa đủ dữ liệu/.test(domain.decisionBlockedReason('insufficient', 'end') ?? ''),
      'Chưa đủ dữ liệu: câu chặn Kết thúc phải nói rõ vì sao');
  });

  check('PR-S2 · S4: mỗi quyết định dịch về đúng một bước cũ; nhãn đủ, không mở đầu bằng "Hãy"; nhãn lịch sử theo chữ mới', () => {
    const m = (d: string) => { const r = domain.decisionToStep(d); return `${r.mode}/${r.nextStep}`; };
    assert(m('keep') === 'monitor/continue' && m('adjust') === 'monitor/adjust' && m('replace') === 'end/propose'
      && m('end') === 'end/complete' && m('ask_manager') === 'end/ask_manager', 'Bảng dịch quyết định → bước sai');
    for (const d of domain.PLAN_DECISIONS) {
      assert(domain.PLAN_DECISION_LABEL[d] && domain.PLAN_DECISION_HINT[d], `Quyết định ${d} thiếu nhãn hoặc lời giải thích`);
      assert(!/^Hãy/.test(domain.PLAN_DECISION_HINT[d]), `Lời giải thích ${d} mở đầu bằng "Hãy"`);
    }
    assert(domain.PLAN_DECISION_CHIPS.join(',') === 'keep,adjust,replace,end', 'Bốn nút chính phải đúng thứ tự nguồn §8');
    assert(domain.NEXT_STEP_LABEL.adjust === 'Điều chỉnh' && domain.NEXT_STEP_LABEL.continue === 'Giữ nguyên'
      && domain.NEXT_STEP_LABEL.propose === 'Thay phương án', `Nhãn bước: ${JSON.stringify(domain.NEXT_STEP_LABEL)}`);
    assert(domain.stepsForMode('monitor', 'unchanged').join(',') === 'continue,adjust', 'Theo dõi tiếp phải cho Giữ nguyên và Điều chỉnh');
    assert(domain.decisionNeedsReason('adjust') && domain.decisionNeedsReason('replace') && !domain.decisionNeedsReason('keep')
      && !domain.decisionNeedsReason('end'), 'Chỉ Điều chỉnh và Thay bắt lý do');
  });

  // ================================================================== 3. Ghi kết quả với quyết định

  console.log('\nPR-S2 · 3. Ghi kết quả: Giữ nguyên · Điều chỉnh (có lịch sử) · Thay (có lý do) · vấn đề còn tồn');

  const ADJ_OK = { decision: 'adjust', outcome: 'insufficient', note: 'Tuần này chưa có bài nghe mới để nhìn',
    decisionNote: 'Em đi học thêm buổi tối nên đổi giờ', adjust: { description: 'Tự học Listening — nghe chép 15 phút buổi sáng' } };

  check('PR-S2 · S4: Giữ nguyên lưu kết quả · tiến triển · vấn đề còn tồn · ghi chú; PA chạy tiếp sang đợt 2, không sinh lịch sử điều chỉnh', () => {
    const { ivId } = taoCase();
    cases.updateResult(P.lrTeacher, ivId, {
      decision: 'keep', outcome: 'partial', note: 'Nghe số đã khá hơn, tên riêng còn sai',
      remainingIssue: 'Còn sai chính tả tên riêng', decisionNote: 'Tuần sau thêm bài Section 2',
    });
    const f = lastFollow(ivId);
    const iv = ivRow(ivId);
    assert(f.next_step === 'continue' && f.outcome === 'partial', `Lần cập nhật sai: ${JSON.stringify(f)}`);
    assert(f.remaining_issue === 'Còn sai chính tả tên riêng' && f.decision_note === 'Tuần sau thêm bài Section 2',
      `Vấn đề còn tồn / ghi chú không lưu: ${JSON.stringify(f)}`);
    assert(iv.status === 'started' && iv.cycle_no === 2, `PA phải chạy tiếp ở đợt 2: ${iv.status} / ${iv.cycle_no}`);
    assert(revRows(ivId).length === 0, 'Giữ nguyên không được sinh dòng lịch sử điều chỉnh');
  });

  check('PR-S2 · S4: vấn đề còn tồn tối đa 300 ký tự; bỏ trống thì lưu NULL', () => {
    const { ivId } = taoCase();
    assertThrows(() => cases.updateResult(P.lrTeacher, ivId, {
      decision: 'keep', outcome: 'partial', note: 'Nghe số đã khá hơn nhiều', remainingIssue: 'x'.repeat(301),
    }), /300 ký tự/, 'Vấn đề còn tồn dài hơn 300 ký tự');
    cases.updateResult(P.lrTeacher, ivId, { decision: 'keep', outcome: 'partial', note: 'Nghe số đã khá hơn nhiều', remainingIssue: '   ' });
    assert(lastFollow(ivId).remaining_issue === null, 'Vấn đề còn tồn chỉ có khoảng trắng phải lưu NULL');
  });

  check('PR-S2 · S2: Điều chỉnh bắt buộc lý do, phải đổi ít nhất một thứ; mô tả ngắn hoặc ngày lùi về trước bị từ chối; từ chối thì không để lại gì', () => {
    const { ivId } = taoCase();
    assertThrows(() => cases.updateResult(P.lrTeacher, ivId, { ...ADJ_OK, decisionNote: '' }), /Lý do/, 'Điều chỉnh không có lý do');
    assertThrows(() => cases.updateResult(P.lrTeacher, ivId, { ...ADJ_OK, adjust: {} }), /ít nhất một thứ/, 'Điều chỉnh mà không đổi gì');
    assertThrows(() => cases.updateResult(P.lrTeacher, ivId, { ...ADJ_OK, adjust: { description: 'ngắn' } }), /ít nhất 8 ký tự/, 'Mô tả mới quá ngắn');
    assertThrows(() => cases.updateResult(P.lrTeacher, ivId, { ...ADJ_OK, adjust: { followupDue: addDays(TODAY, -1) } }),
      /sớm hơn ngày cập nhật/, 'Ngày dự kiến kết thúc lùi về trước ngày cập nhật');
    assert(ivRow(ivId).cycle_no === 1 && !lastFollow(ivId) && revRows(ivId).length === 0, 'Lần bị từ chối không được để lại gì');
  });

  check('PR-S2 · S2: Điều chỉnh hai lần: đọc lại được cả hai bản cũ, ngày, người, lý do; PA vẫn là MỘT, loại không đổi', () => {
    const { ivId, caseId } = taoCase();
    cases.updateResult(P.lrTeacher, ivId, {
      ...ADJ_OK, outcome: 'unchanged', note: 'Nghe chép chưa đều, em bỏ hai buổi',
      adjust: { kind: 'tutor', description: 'Tự học Listening — nghe chép 15 phút buổi sáng' },
    });
    cases.updateResult(P.mbManager, ivId, {
      decision: 'adjust', outcome: 'partial', note: 'Buổi sáng em làm đều hơn hẳn', decisionNote: 'Tăng thời lượng vì em theo kịp',
      adjust: { description: 'Tự học Listening — nghe chép 25 phút buổi sáng', followupDue: addDays(TODAY, 21), performerName: 'Trợ giảng Mai' },
    });
    const iv = ivRow(ivId);
    const revs = revRows(ivId);
    assert(iv.kind === 'self_study', `Điều chỉnh không được đổi loại PA: ${iv.kind}`);
    assert(iv.description === 'Tự học Listening — nghe chép 25 phút buổi sáng' && iv.performer_name === 'Trợ giảng Mai'
      && iv.performer_user_id === null && iv.followup_due === addDays(TODAY, 21), `Bản hiện tại sai: ${JSON.stringify(iv)}`);
    assert(revs.length === 2, `Phải có 2 dòng lịch sử, có ${revs.length}`);
    assert(revs[0].old_description === 'Tự học Listening — nghe chép 15 phút mỗi ngày'
      && revs[0].new_description === 'Tự học Listening — nghe chép 15 phút buổi sáng', `Bản 1 sai: ${JSON.stringify(revs[0])}`);
    assert(revs[1].old_description === revs[0].new_description && revs[1].old_performer_user_id === P.lrTeacher.userId
      && revs[1].new_performer_name === 'Trợ giảng Mai' && revs[1].new_performer_user_id === null, `Bản 2 sai: ${JSON.stringify(revs[1])}`);
    assert(revs[0].reason === 'Em đi học thêm buổi tối nên đổi giờ' && revs[0].actor_user_id === P.lrTeacher.userId
      && revs[1].actor_user_id === P.mbManager.userId, 'Lý do / người điều chỉnh sai');
    assert(revs.every((r) => r.source === 'adjust' && r.effective_on === TODAY && r.followup_id && r.case_id === caseId),
      `Nguồn / ngày / lần cập nhật / Case sai: ${JSON.stringify(revs)}`);
    assert(iv.cycle_no === 3 && iv.status === 'started', `Mỗi lần điều chỉnh mở một đợt mới: ${iv.cycle_no} / ${iv.status}`);
    const n = (conn.prepare('SELECT COUNT(*) n FROM case_interventions WHERE case_id = ?').get(caseId) as any).n;
    assert(n === 1, `Điều chỉnh không được sinh PA mới: ${n}`);
    assert(lastFollow(ivId).next_step === 'adjust', 'Lần cập nhật phải ghi bước "adjust"');
  });

  check('PR-S2 · S2: PA đã kết thúc hoặc đang chờ Quản lý duyệt thì không điều chỉnh được', () => {
    const a = taoCase();
    cases.updateResult(P.lrTeacher, a.ivId, { decision: 'end', outcome: 'improved', note: 'Em nghe số và tên riêng đúng hết' });
    assertThrows(() => cases.updateResult(P.lrTeacher, a.ivId, ADJ_OK), /đã kết thúc/, 'Điều chỉnh PA đã kết thúc');
    const b = taoCase();
    cases.updateResult(P.lrTeacher, b.ivId, { decision: 'ask_manager', outcome: 'unchanged', note: 'Tự học không đủ, cần Quản lý xếp tutor' });
    assertThrows(() => cases.updateResult(P.lrTeacher, b.ivId, ADJ_OK), /chờ Quản lý duyệt/, 'Điều chỉnh PA đang chờ duyệt');
    assert(revRows(a.ivId).length === 0 && revRows(b.ivId).length === 0, 'Bị từ chối mà vẫn có dòng lịch sử');
  });

  check('PR-S2 · S2: GV khác môn không điều chỉnh được PA Listening (C02), cùng quyền với Ghi kết quả', () => {
    const { ivId } = taoCase();
    assertThrows(() => cases.updateResult(P.sTeacher, ivId, ADJ_OK), /không có quyền/, 'GV Speaking điều chỉnh PA Listening');
    assert(revRows(ivId).length === 0, 'Bị từ chối mà vẫn có dòng lịch sử');
  });

  check('PR-S2 · S4: Chưa đủ dữ liệu không Kết thúc suông và không Xin hỗ trợ từ Quản lý được (Thay thì được, xem phép kiểm Task 7)', () => {
    const { ivId } = taoCase();
    assertThrows(() => cases.updateResult(P.lrTeacher, ivId, {
      decision: 'end', outcome: 'insufficient', note: 'Chưa có bài nghe mới để nhìn',
    }), /Giữ nguyên, Điều chỉnh hoặc Thay/, 'Kết thúc suông khi Chưa đủ dữ liệu');
    assertThrows(() => cases.updateResult(P.lrTeacher, ivId, {
      decision: 'ask_manager', outcome: 'insufficient', note: 'Chưa có bài nghe mới để nhìn',
    }), /Giữ nguyên, Điều chỉnh hoặc Thay/, 'Xin hỗ trợ từ Quản lý khi Chưa đủ dữ liệu');
    assert(ivRow(ivId).status === 'started' && !lastFollow(ivId), 'Bị từ chối mà PA đổi trạng thái hoặc có lần cập nhật');
  });

  check('PR-S2 · S4: Thay bắt lý do; thay xong PA cũ Được thay thế, nối sang PA mới, người thực hiện khai rõ', () => {
    const { ivId, caseId } = taoCase();
    const newPlan = { kind: 'tutor', description: 'Tutor Listening hai buổi mỗi tuần đến MT2', performerSelf: true };
    assertThrows(() => cases.updateResult(P.lrTeacher, ivId, {
      decision: 'replace', outcome: 'worse', note: 'Em sai nhiều hơn tuần trước', newPlan,
    }), /Lý do/, 'Thay không có lý do');
    cases.updateResult(P.lrTeacher, ivId, {
      decision: 'replace', outcome: 'worse', note: 'Em sai nhiều hơn tuần trước',
      decisionNote: 'Tự học không hiệu quả, chuyển sang tutor', newPlan,
    });
    const old = ivRow(ivId);
    const moi = conn.prepare('SELECT * FROM case_interventions WHERE case_id = ? AND id != ?').get(caseId, ivId) as any;
    assert(moi, 'Không có PA mới');
    assert(old.status === 'completed' && old.closed_reason === 'superseded' && old.superseded_by === moi.id && old.completed_date === TODAY,
      `PA cũ phải Được thay thế và nối sang PA mới: ${JSON.stringify(old)}`);
    assert(moi.kind === 'tutor' && moi.performer_user_id === P.lrTeacher.userId && moi.status === 'started',
      `PA mới sai (người thực hiện khai bằng performerSelf): ${JSON.stringify(moi)}`);
    const f = lastFollow(ivId);
    assert(f.next_step === 'propose' && f.outcome === 'worse' && f.decision_note === 'Tự học không hiệu quả, chuyển sang tutor',
      `Lý do thay phải nằm ở lần cập nhật: ${JSON.stringify(f)}`);
    assert(revRows(ivId).length === 0, 'Thay không ghi vào lịch sử điều chỉnh, nó là chuỗi Được thay thế');
  });

  // ================================================================== 4. Đọc lịch sử

  console.log('\nPR-S2 · 4. Đọc lịch sử: chi tiết Case và bảng kỹ năng (nguồn của Hành trình)');

  check('PR-S2 · Đọc: chi tiết Case trả lịch sử điều chỉnh từng PA, và vấn đề còn tồn / lý do từng lần cập nhật', () => {
    const { ivId, caseId } = taoCase();
    cases.updateResult(P.lrTeacher, ivId, {
      decision: 'adjust', outcome: 'partial', note: 'Đã khá hơn ở phần nghe số', remainingIssue: 'Tên riêng',
      decisionNote: 'Chuyển sang nghe buổi sáng', adjust: { description: 'Tự học Listening — nghe chép buổi sáng 20 phút' },
    });
    const d = cases.caseDetail(P.lrTeacher, caseId) as any;
    const iv = d.interventions.find((x: any) => x.id === ivId);
    assert(iv.revisions?.length === 1, `Phải có 1 bản điều chỉnh: ${JSON.stringify(iv.revisions)}`);
    const r = iv.revisions[0];
    assert(r.on === TODAY && r.reason === 'Chuyển sang nghe buổi sáng' && r.source === 'adjust' && r.by, `Bản điều chỉnh sai: ${JSON.stringify(r)}`);
    assert(r.before.description === 'Tự học Listening — nghe chép 15 phút mỗi ngày'
      && r.after.description === 'Tự học Listening — nghe chép buổi sáng 20 phút', 'Bản cũ / bản mới sai');
    assert(r.before.performer && r.before.performer === r.after.performer, 'Người thực hiện không đổi phải đọc ra cùng một tên');
    const f = d.followups.find((x: any) => x.interventionId === ivId);
    assert(f.remainingIssue === 'Tên riêng' && f.decisionNote === 'Chuyển sang nghe buổi sáng' && f.nextStep === 'adjust',
      `Lần cập nhật sai: ${JSON.stringify(f)}`);
  });

  check('PR-S2 · Đọc: bảng kỹ năng trả lịch sử điều chỉnh, chuỗi Được thay thế và quyết định từng lần cập nhật (đủ cho PR-Qb vẽ khối PA nối nhau)', () => {
    const { sid, ivId, caseId } = taoCase();
    cases.updateResult(P.lrTeacher, ivId, {
      decision: 'adjust', outcome: 'insufficient', note: 'Chưa có bài nghe mới để nhìn', decisionNote: 'Em đổi lịch nên học buổi sáng',
      adjust: { description: 'Tự học Listening — nghe chép buổi sáng' },
    });
    cases.updateResult(P.lrTeacher, ivId, {
      decision: 'replace', outcome: 'unchanged', note: 'Hai tuần vẫn sai như cũ', decisionNote: 'Tự học không đủ, chuyển sang tutor',
      newPlan: { kind: 'tutor', description: 'Tutor Listening hai buổi mỗi tuần', performerSelf: true },
    });
    const board = cases.skillSupportBoard(P.lrTeacher, sid) as any;
    const card = board.rows.flatMap((r: any) => r.cases).find((c: any) => c.id === caseId);
    assert(card, 'Không thấy thẻ Case trên bảng kỹ năng');
    const old = card.plans.find((p: any) => p.id === ivId);
    const moi = card.plans.find((p: any) => p.id !== ivId);
    assert(old && moi, 'Bảng kỹ năng phải có cả PA cũ (đã thay) và PA mới');
    assert(old.closedReason === 'superseded' && old.supersededBy === moi.id, `Chuỗi thay sai: ${old.closedReason} / ${old.supersededBy}`);
    assert(old.revisions.length === 1 && old.revisions[0].after.description === 'Tự học Listening — nghe chép buổi sáng', 'Lịch sử điều chỉnh sai');
    assert(old.updates.map((u: any) => u.decision).join(',') === 'adjust,propose', `Quyết định từng lần: ${JSON.stringify(old.updates)}`);
    assert(old.updates[1].decisionNote === 'Tự học không đủ, chuyển sang tutor', 'Lý do thay phải đọc được từ bảng kỹ năng');
    assert(moi.revisions.length === 0 && moi.closedReason === null && moi.supersededBy === null, 'PA mới không được mang lịch sử của PA cũ');
  });

  // ================================================================== 5. Gợi ý tự động và "Ghi đã làm"

  console.log('\nPR-S2 · 5. Sửa gợi ý lúc xác nhận có lịch sử; "Ghi đã làm" không ghi đè mô tả');

  check('PR-S2 · S2: Sửa gợi ý tự động lúc xác nhận ghi MỘT dòng lịch sử (bản gợi ý → bản đã sửa); xác nhận nguyên văn thì không', () => {
    const goiY = (caseId: number) => Number(conn.prepare(
      `INSERT INTO case_interventions (case_id, kind, description, status, preset, followup_due, created_at)
       VALUES (?, 'self_study', 'Tự học 1 tháng', 'planned', 1, ?, ?)`,
    ).run(caseId, addDays(TODAY, 30), NOW).lastInsertRowid);
    const a = goiY(taoCase().caseId);
    const b = goiY(taoCase().caseId);
    const c = goiY(taoCase().caseId);
    sosAuto.confirmPresetPlan(P.lrTeacher, a, { description: 'Tự học 1 tháng — nghe chép Section 2 mỗi ngày' });
    sosAuto.confirmPresetPlan(P.lrTeacher, b);
    sosAuto.confirmPresetPlan(P.lrTeacher, c, { followupDue: addDays(TODAY, 40), reason: 'Em thi muộn hơn nên kéo dài' });
    const ra = revRows(a);
    assert(ra.length === 1 && ra[0].source === 'confirm_edit' && ra[0].followup_id === null
      && ra[0].old_description === 'Tự học 1 tháng' && ra[0].new_description === 'Tự học 1 tháng — nghe chép Section 2 mỗi ngày'
      && ra[0].reason === domain.CONFIRM_EDIT_REASON, `Sửa lúc xác nhận ghi sai: ${JSON.stringify(ra)}`);
    assert(revRows(b).length === 0, 'Xác nhận nguyên văn không được sinh lịch sử');
    const rc = revRows(c);
    assert(rc.length === 1 && rc[0].old_followup_due === addDays(TODAY, 30) && rc[0].new_followup_due === addDays(TODAY, 40)
      && rc[0].reason === 'Em thi muộn hơn nên kéo dài', `Đổi ngày lúc xác nhận ghi sai: ${JSON.stringify(rc)}`);
  });

  check('PR-S2 · S2: "Ghi đã làm" kèm ghi chú không còn ghi đè mô tả phương án (cases.ts completeIntervention)', () => {
    const { ivId } = taoCase();
    cases.completeIntervention(P.lrTeacher, ivId, { doneOn: TODAY, note: 'Đã làm đủ bảy buổi', performerSelf: true });
    assert(ivRow(ivId).description === 'Tự học Listening — nghe chép 15 phút mỗi ngày', `Mô tả bị ghi đè: ${ivRow(ivId).description}`);
  });

  // ================================================================== 6. Thống kê hiệu quả

  console.log('\nPR-S2 · 6. Thống kê hiệu quả: PA có kết quả thật thì tính, một PA một kết quả cuối');

  check('PR-S2 · Thống kê: Giữ nguyên + Điều chỉnh + Kết thúc là MỘT PA với MỘT kết quả cuối, đúng loại ban đầu', () => {
    const { sid, ivId } = taoCase();
    cases.updateResult(P.lrTeacher, ivId, { decision: 'keep', outcome: 'unchanged', note: 'Tuần đầu em chưa quen cách nghe chép' });
    cases.updateResult(P.lrTeacher, ivId, {
      decision: 'adjust', outcome: 'partial', note: 'Buổi sáng em làm đều hơn', decisionNote: 'Đổi sang buổi sáng cho hợp lịch',
      adjust: { description: 'Tự học Listening — nghe chép buổi sáng 20 phút' },
    });
    cases.updateResult(P.lrTeacher, ivId, { decision: 'end', outcome: 'improved', note: 'Em nghe số và tên riêng đúng hết' });
    const rows = effectiveness.planOutcomes({ studentIds: [sid] }) as any[];
    assert(rows.length === 1 && rows[0].id === ivId && rows[0].kind === 'self_study' && rows[0].outcome === 'improved'
      && rows[0].group === 'success', `Phải là đúng MỘT PA tự học, Tiến bộ rõ: ${JSON.stringify(rows)}`);
  });

  check('PR-S2 · Thống kê: Thay thì PA cũ tính với kết quả của lần thay (PA bị thay vẫn tính); PA mới chưa kết thúc thì chưa tính', () => {
    const { sid, ivId } = taoCase();
    cases.updateResult(P.lrTeacher, ivId, {
      decision: 'replace', outcome: 'worse', note: 'Em sai nhiều hơn tuần trước', decisionNote: 'Tự học không hiệu quả, chuyển sang tutor',
      newPlan: { kind: 'tutor', description: 'Tutor Listening hai buổi mỗi tuần', performerSelf: true },
    });
    const rows = effectiveness.planOutcomes({ studentIds: [sid] }) as any[];
    assert(rows.length === 1 && rows[0].id === ivId && rows[0].group === 'failure' && rows[0].supersededBy === true,
      `Chỉ PA cũ được tính, là Không cải thiện, cờ Được thay thế: ${JSON.stringify(rows)}`);
  });

  check('PR-S2 · Thống kê: Thay khi chưa đủ dữ liệu — PA cũ không vào thống kê hiệu quả (không vào mẫu số) và không vào "PA cần bổ sung đánh giá" (F05)', () => {
    const { sid, ivId, caseId } = taoCase();
    cases.updateResult(P.lrTeacher, ivId, {
      decision: 'replace', outcome: 'insufficient', note: 'Tuần đầu em không làm bài nào',
      decisionNote: 'Em không tự học được, chuyển ngay sang tutor',
      newPlan: { kind: 'tutor', description: 'Tutor Listening hai buổi mỗi tuần', performerSelf: true },
    });
    const old = ivRow(ivId);
    const moi = conn.prepare('SELECT id FROM case_interventions WHERE case_id = ? AND id != ?').get(caseId, ivId) as any;
    assert(old.status === 'completed' && old.closed_reason === 'superseded' && old.superseded_by === moi?.id,
      `PA cũ phải Được thay thế: ${JSON.stringify(old)}`);
    assert(lastFollow(ivId).outcome === 'insufficient' && lastFollow(ivId).decision_note === 'Em không tự học được, chuyển ngay sang tutor',
      'Kết quả cuối phải là Chưa đủ dữ liệu, lý do lưu ở lần cập nhật');
    const rate = effectiveness.improvementRate({ studentIds: [sid] });
    assert(rate.N === 0 && rate.n === 0, `PA chưa đủ dữ liệu không được vào mẫu số: ${JSON.stringify(rate)}`);
    const need = effectiveness.plansNeedingEvaluation({ studentIds: [sid] });
    assert(need.count === 0 && !need.ids.includes(ivId), `PA đã bị thay không được nằm trong F05: ${JSON.stringify(need)}`);
  });

  // ================================================================== 7. Sau rà cuối

  console.log('\nPR-S2 · 7. Sau rà cuối: lịch sử điều chỉnh theo thứ tự ghi');

  check('PR-S2 · Đọc: lịch sử điều chỉnh theo thứ tự GHI (cũ trước mới sau), kể cả khi lần sau ghi ngày cập nhật sớm hơn lần trước', () => {
    const { ivId, caseId } = taoCase();
    /* PA chạy từ 7 ngày trước, để ngày cập nhật lùi về trước vẫn nằm trong đời PA. */
    conn.prepare('UPDATE case_interventions SET started_date = ?, cycle_started_on = ? WHERE id = ?')
      .run(addDays(TODAY, -7), addDays(TODAY, -7), ivId);
    cases.updateResult(P.lrTeacher, ivId, {
      decision: 'adjust', outcome: 'partial', note: 'Buổi sáng em nghe đều hơn', observedOn: TODAY,
      decisionNote: 'Đổi sang buổi sáng cho hợp lịch', adjust: { description: 'Tự học Listening — nghe chép buổi sáng 20 phút' },
    });
    cases.updateResult(P.lrTeacher, ivId, {
      decision: 'adjust', outcome: 'partial', note: 'Ghi bù buổi xem lại hai hôm trước', observedOn: addDays(TODAY, -2),
      decisionNote: 'Tăng thời lượng vì em theo kịp', adjust: { description: 'Tự học Listening — nghe chép buổi sáng 30 phút' },
    });
    const revs = (cases.caseDetail(P.lrTeacher, caseId) as any).interventions.find((x: any) => x.id === ivId).revisions as any[];
    assert(revs.length === 2, `Phải có 2 bản điều chỉnh: ${JSON.stringify(revs)}`);
    assert(revs[0].on === TODAY && revs[1].on === addDays(TODAY, -2),
      `Phải theo thứ tự ghi, không theo ngày cập nhật: ${revs.map((r) => r.on).join(', ')}`);
    assert(revs[1].before.description === revs[0].after.description,
      `Chuỗi bản cũ → bản mới bị đứt: ${JSON.stringify(revs.map((r) => [r.before.description, r.after.description]))}`);
  });

  // ---- các task sau thêm phép kiểm NGAY TRÊN dòng này ----
}
