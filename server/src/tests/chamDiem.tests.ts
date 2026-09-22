/**
 * PHÉP KIỂM PR-Rc1: Cần chấm · Lịch Test · lưới chấm chung (spec 2026-09-22-ux-toan-web-truoc-deploy-design §3.5, §6;
 * kiểm kê §1.4 R8/R13/R15/R16, §1.7 RB-5, §6 DS02). Kế hoạch: docs/superpowers/plans/2026-09-22-pr-rc1-cham-diem.md.
 *
 * Harness do `run.ts` sở hữu và truyền vào; file này không tự mở database. Học viên/lượt dùng ở đây do CHÍNH file này
 * tạo, không đụng dữ liệu của bộ demo (trừ nơi ghi rõ là đọc lớp demo MB-FOU 12 / MB-FT 101).
 */
import type { YThucTestKit } from './yThuc.tests.ts';

export async function runChamDiemTests(t: YThucTestKit) {
  const { check, assert, assertThrows, conn, TODAY, P, classId } = t;
  const d: any = await import('../../../shared/domain/index.ts');
  console.log('\nPR-Rc1 · Cần chấm + Lịch Test + lưới chấm');

  check('PR-Rc1 · Q10 Nhóm Cần chấm: quá hạn / tuần này / sắp tới; chưa có hạn là "Sắp tới"', () => {
    const eq = (got: string, want: string, m: string) => assert(got === want, `${m}: "${got}" ≠ "${want}"`);
    // Hôm nay 22/09/2026 (thứ Ba), tuần lịch 21/09 – 27/09.
    const homNay = '2026-09-22'; const cuoi = '2026-09-27';
    eq(d.mucCanCham('2026-09-21', homNay, cuoi), 'qua-han', 'Hạn hôm qua');
    eq(d.mucCanCham('2026-09-22', homNay, cuoi), 'tuan-nay', 'Hạn đúng hôm nay vẫn còn kịp');
    eq(d.mucCanCham('2026-09-27', homNay, cuoi), 'tuan-nay', 'Hạn Chủ nhật cuối tuần này');
    eq(d.mucCanCham('2026-09-28', homNay, cuoi), 'sap-toi', 'Hạn tuần sau');
    eq(d.mucCanCham(null, homNay, cuoi), 'sap-toi', 'Chưa có hạn thì KHÔNG phải quá hạn');
    const nhom = d.nhomCanCham(
      [{ han: '2026-09-28' }, { han: null }, { han: '2026-09-21' }, { han: '2026-09-23' }],
      { homNay, cuoiTuanNay: cuoi },
    );
    eq(nhom.map((x: any) => `${x.muc}:${x.dong.length}`).join(','), 'qua-han:1,tuan-nay:1,sap-toi:2', 'Thứ tự và số dòng');
    eq(nhom[0].nhan, 'Quá hạn', 'Chữ mục 1');
    eq(nhom[1].nhan, 'Tuần này', 'Chữ mục 2');
    eq(nhom[2].nhan, 'Sắp tới', 'Chữ mục 3');
  });

  check('PR-Rc1 · Q7 Ô lưới lớp thường: hai số, viền vàng khi tổng khác tổng của cột', () => {
    const o = (diem: any, tong: any, tongCot: any) => d.oLuoiThuong({ diem, tong, tongCot });
    assert(o(33, 40, 40).hien === '33/40' && !o(33, 40, 40).vienVang, 'Cùng tổng cột thì không viền vàng');
    assert(o(27, 38, 40).vienVang, 'Khác tổng cột thì viền vàng');
    assert(!o(27, 38, null).vienVang, 'Cột chưa đặt tổng chung thì không có gì để khác');
    assert(o(null, null, 40).trong && o(null, null, 40).hien === '', 'Chưa nhập là ô trống, không phải 0');
    assert(o(null, 40, 40).trong, 'Có tổng mà chưa có điểm vẫn là chưa nhập');
  });

  check('PR-Rc1 · Q9 Kết quả lớp thường: thiếu điểm KHÁC chưa đạt', () => {
    const eq = (got: any, want: string, m: string) => assert(got === want, `${m}: "${got}" ≠ "${want}"`);
    eq(d.ketQuaThuong({ dat: 2, daCham: 2, tong: 4, thieu: ['W', 'S'] }).chinh, 'Đạt 2/2 môn đã chấm', 'Mới chấm hai môn');
    eq(d.ketQuaThuong({ dat: 2, daCham: 2, tong: 4, thieu: ['W', 'S'] }).phu, 'còn W, S chưa chấm', 'Dòng phụ gọi tên môn');
    eq(d.ketQuaThuong({ dat: 3, daCham: 4, tong: 4, thieu: [] }).chinh, 'Đạt 3/4 môn', 'Đủ điểm thì bỏ chữ "đã chấm"');
    eq(d.ketQuaThuong({ dat: 0, daCham: 0, tong: 4, thieu: ['L', 'R', 'W', 'S'] }).chinh, 'Chưa nhập điểm', 'Chưa có gì');
    assert(d.ketQuaThuong({ dat: 0, daCham: 0, tong: 4, thieu: ['L', 'R', 'W', 'S'] }).phu === null,
      'Chưa nhập môn nào thì không liệt kê cả bốn môn (G-3)');
  });

  check('PR-Rc1 · DS02 đếm ngược trong ô dấu "-" (chỉ chữ, không tô đỏ)', () => {
    const eq = (got: any, want: any, m: string) => assert(got === want, `${m}: "${got}" ≠ "${want}"`);
    eq(d.demNguocSuaDau('2026-09-27', '2026-09-25'), 'Còn 2 ngày để sửa', 'Hai ngày');
    eq(d.demNguocSuaDau('2026-09-27', '2026-09-26'), 'Còn 1 ngày để sửa', 'Một ngày');
    eq(d.demNguocSuaDau('2026-09-27', '2026-09-27'), 'Còn hôm nay để sửa', 'Đúng Chủ nhật');
    eq(d.demNguocSuaDau('2026-09-27', '2026-09-28'), null, 'Hết hạn thì không đếm nữa');
    eq(d.demNguocSuaDau(null, '2026-09-22'), null, 'Không có tuần thì không đếm');
  });

  check('PR-Rc1 · Q2 Tuần kế tiếp luôn là thứ Hai kế sau tuần thi', () => {
    assert(d.tuanKeTiep('2026-09-14') === '2026-09-21', d.tuanKeTiep('2026-09-14'));
    assert(d.tuanKeTiep('2026-09-28') === '2026-10-05', d.tuanKeTiep('2026-09-28'));
  });

  check('PR-Rc1 · RB-5 lý do hiệu chỉnh: bắt buộc, đủ dài, không nhận khoảng trắng', () => {
    assert(d.LY_DO_TOI_THIEU === 5, 'Ngưỡng là 5 ký tự');
    assert(d.kiemLyDo(null) !== null && d.kiemLyDo('   ') !== null, 'Trống thì phải báo lỗi');
    assert(d.kiemLyDo('sai') !== null, 'Quá ngắn thì phải báo lỗi');
    assert(d.kiemLyDo('Chấm nhầm đề B') === null, 'Lý do đủ dài thì hợp lệ');
    assert(!/Hãy/.test(String(d.kiemLyDo(null))), 'Câu lỗi không mở đầu bằng "Hãy"');
  });

  check('PR-Rc1 · Câu trạng thái chấm dùng chung cho Lịch Test', () => {
    const eq = (got: string, want: string, m: string) => assert(got === want, `${m}: "${got}" ≠ "${want}"`);
    eq(d.trangThaiChamLabel({ conBai: 0, tong: 8, quaHan: false, chuaToiHan: false }), 'Đã chấm xong', 'Xong');
    eq(d.trangThaiChamLabel({ conBai: 3, tong: 8, quaHan: false, chuaToiHan: false }), 'Còn 3 bài', 'Còn bài');
    eq(d.trangThaiChamLabel({ conBai: 3, tong: 8, quaHan: true, chuaToiHan: false }), 'Quá hạn · còn 3 bài', 'Quá hạn');
    eq(d.trangThaiChamLabel({ conBai: 8, tong: 8, quaHan: false, chuaToiHan: true }), 'Chưa tới hạn', 'Chưa tới tuần thi');
  });

  // ---------------------------------------------------------------- C08: dấu "-" của lớp thường
  const regular: any = await import('../normal/regular.ts');
  const skillSched: any = await import('../fasttrack/skillSchedule.ts');
  const attempts: any = await import('../fasttrack/attempts.ts');
  const cham: any = await import('../cham/canCham.ts');
  const casesSvc: any = await import('../cases/cases.ts');
  const NOW = new Date().toISOString();
  const LOP = classId('MB-FOU 12');
  const BON_MON = ['listening', 'reading', 'writing', 'speaking'];

  /** Những môn GVBM (không kiêm GVCN) thật sự được phân công ở MB-FOU 12 — không gõ cứng tên môn. */
  const monCuaGv = (conn.prepare(
    `SELECT skill FROM teacher_assignments WHERE class_id = ? AND user_id = ? AND status = 'active' AND skill IS NOT NULL`,
  ).all(LOP, P.normalSubjectTeacher.userId) as any[]).map((x) => x.skill as string).filter((k) => BON_MON.includes(k));

  /** Một học viên mới ở MB-FOU 12 (lớp thường) + một bài Giữa khoá đã xếp tuần, bốn môn cùng tuần. */
  let stt = 0;
  function taoBaiThuong(weekStart: string): { sid: number; cycleId: number; attemptId: number } {
    stt += 1;
    const tag = `RC1-${stt}`;
    const branch = (conn.prepare('SELECT branch_id AS b FROM classes WHERE id = ?').get(LOP) as any).b;
    const sid = Number(conn.prepare(
      `INSERT INTO students (student_code, full_name, normalized_name, branch_id, status, created_at) VALUES (?,?,?,?, 'active', ?)`,
    ).run(`PISA-${tag}`, `Học viên ${tag}`, `hoc vien ${tag.toLowerCase()}`, branch, NOW).lastInsertRowid);
    conn.prepare(`INSERT INTO enrollments (student_id, class_id, status, started_at, created_at) VALUES (?,?, 'active', '2026-07-27', ?)`)
      .run(sid, LOP, NOW);
    const cycleId = Number(conn.prepare(
      `INSERT INTO learning_cycles (student_id, seq, route, programme_code, started_at, status, created_at)
       VALUES (?, 1, NULL, 'FOU', '2026-07-27', 'active', ?)`,
    ).run(sid, NOW).lastInsertRowid);
    const attemptId = taoLuot(cycleId, sid, 1, 'progress', weekStart);
    return { sid, cycleId, attemptId };
  }
  /** Một lượt của khoá lớp thường ở tuần `weekStart`, đủ bốn dòng lịch môn. */
  function taoLuot(cycleId: number, sid: number, no: number, kind: string, weekStart: string): number {
    const week: any = conn.prepare('SELECT id FROM report_periods WHERE week_start = ?').get(weekStart)
      ?? { id: Number(conn.prepare(
        `INSERT INTO report_periods (code, week_start, week_end, created_at) VALUES (?,?,?,?)`,
      ).run(`T-${weekStart}`, weekStart, new Date(Date.parse(`${weekStart}T00:00:00Z`) + 6 * 86400000).toISOString().slice(0, 10), NOW).lastInsertRowid) };
    const attemptId = Number(conn.prepare(
      `INSERT INTO assessment_attempts (cycle_id, student_id, attempt_no, kind, class_id, planned_period_id, status, created_at)
       VALUES (?,?,?,?,?,?, 'planned', ?)`,
    ).run(cycleId, sid, no, kind, LOP, week.id, NOW).lastInsertRowid);
    skillSched.ensureSkillRows(attemptId);
    return attemptId;
  }
  const tuanCuaMon = (rows: any[], k: string) => rows.find((r: any) => r.skill === k)?.week_start ?? null;
  const dauCua = (attemptId: number, k: string): any =>
    conn.prepare('SELECT * FROM assessment_scores WHERE attempt_id = ? AND skill = ?').get(attemptId, k);

  check('PR-Rc1 · C08 Lớp thường ghi "-": môn đó tự dời sang tuần sau, các môn khác không đổi', () => {
    assert(monCuaGv.length > 0, 'Seed: GVBM của MB-FOU 12 phải được phân công ít nhất một môn');
    const k = monCuaGv[0];
    const khac = BON_MON.find((x) => x !== k)!;
    const { attemptId } = taoBaiThuong('2026-09-14');
    const truoc = skillSched.loadSkillRows([attemptId]).get(attemptId);
    assert(tuanCuaMon(truoc, k) === '2026-09-14', 'Bắt đầu ở tuần 14/09');
    const maTuanCu = truoc.find((r: any) => r.skill === k).period_code;

    const r = regular.reportRegularNoShow(P.normalSubjectTeacher, attemptId, k, true, '2026-09-16');
    assert(r.moved, 'Phải dời');
    const sau = skillSched.loadSkillRows([attemptId]).get(attemptId);
    assert(tuanCuaMon(sau, k) === '2026-09-21', `${k} sang tuần sau: ${tuanCuaMon(sau, k)}`);
    assert(tuanCuaMon(sau, khac) === '2026-09-14', `${khac} giữ nguyên tuần — "-" chỉ dời đúng môn đó`);
    const sc = dauCua(attemptId, k);
    assert(sc && sc.no_show_period_id, 'Có ghi dấu "-" kèm tuần cũ');
    assert(sc.raw_score === null, 'Dấu "-" KHÔNG phải điểm 0');
    /* Chạy lại không dời thêm lần nữa. */
    const lai = regular.reportRegularNoShow(P.normalSubjectTeacher, attemptId, k, true, '2026-09-16');
    assert(!lai.moved, 'Báo lại cùng một dấu là vô hại');
    assert(tuanCuaMon(skillSched.loadSkillRows([attemptId]).get(attemptId), k) === '2026-09-21', 'Không dời hai lần');

    /* Bảng điểm lớp thường mang sẵn dữ liệu cho ô lưới (Task 7): dấu "-", tuần đã dời khỏi, quyền sửa của người xem. */
    const sheet = regular.regularSheet(P.normalSubjectTeacher, LOP);
    const dong = sheet.rows.find((x: any) => x.attemptId === attemptId);
    const o = dong.skillSchedule.find((x: any) => x.skill === k);
    assert(o.noShow === true && o.movedFrom === maTuanCu, `Ô ${k}: noShow=${o.noShow}, movedFrom=${o.movedFrom} ≠ ${maTuanCu}`);
    assert(o.canEdit === true, 'GVBM sửa được ô môn mình');
    const oKhac = dong.skillSchedule.find((x: any) => x.skill === khac);
    assert(oKhac.noShow === false && oKhac.movedFrom === null, 'Môn không ghi dấu thì không có noShow/movedFrom');
    const khongDay = BON_MON.find((x) => !monCuaGv.includes(x));
    assert(khongDay, 'Seed: cần một môn GVBM không dạy để đối chứng canEdit');
    assert(dong.skillSchedule.find((x: any) => x.skill === khongDay).canEdit === false, 'Môn không dạy thì canEdit = false');
  });

  check('PR-Rc1 · Q3 Gỡ dấu "-" trả môn về đúng tuần cũ; Q5 ô đã có điểm thì không nhận dấu', () => {
    assert(monCuaGv.length > 0, 'Seed: GVBM của MB-FOU 12 phải được phân công ít nhất một môn');
    const k = monCuaGv[0];
    const { attemptId } = taoBaiThuong('2026-09-14');
    regular.reportRegularNoShow(P.normalSubjectTeacher, attemptId, k, true, '2026-09-16');
    const g = regular.reportRegularNoShow(P.normalSubjectTeacher, attemptId, k, false, '2026-09-16');
    assert(g.moved, 'Gỡ dấu cũng là một lần đổi lịch');
    const rows = skillSched.loadSkillRows([attemptId]).get(attemptId);
    assert(tuanCuaMon(rows, k) === '2026-09-14', 'Về đúng tuần cũ');
    const sc = dauCua(attemptId, k);
    assert(!sc || !sc.no_show_period_id, 'Dấu đã được xoá');

    regular.saveRegularScore(P.normalSubjectTeacher, attemptId, k, { score: 30, total: 40 });
    assertThrows(() => regular.reportRegularNoShow(P.normalSubjectTeacher, attemptId, k, true, '2026-09-16'),
      /đã có điểm|lý do/, 'Ô đã có điểm thì phải đi đường hiệu chỉnh có lý do');
  });

  check('PR-Rc1 · C08 Dời bị chặn (vượt đợt kế tiếp) thì KHÔNG để lại dấu "-" — ghi dấu và dời là một giao dịch', () => {
    assert(monCuaGv.length > 0, 'Seed: GVBM của MB-FOU 12 phải được phân công ít nhất một môn');
    const k = monCuaGv[0];
    const { sid, cycleId, attemptId } = taoBaiThuong('2026-09-14');
    /* Đợt 2 của cùng khoá cũng ở tuần 14/09: dời đợt 1 sang 21/09 là vượt qua đợt kế tiếp → setSkillWeek chặn. */
    taoLuot(cycleId, sid, 2, 'final', '2026-09-14');
    assertThrows(() => regular.reportRegularNoShow(P.normalSubjectTeacher, attemptId, k, true, '2026-09-16'),
      /vượt qua đợt kế tiếp/, 'Dời lịch bị chặn thì cả lần ghi dấu phải thất bại');
    const sc = dauCua(attemptId, k);
    assert(!sc || !sc.no_show_period_id, 'Không còn dòng dấu "-" mồ côi sau khi dời thất bại');
    assert(tuanCuaMon(skillSched.loadSkillRows([attemptId]).get(attemptId), k) === '2026-09-14', 'Lịch giữ nguyên');
  });

  check('PR-Rc1 · C08 Quyền: GVBM môn khác không ghi được "-"; Quản trị hệ thống ghi được; Quản lý bị chặn', () => {
    const { attemptId } = taoBaiThuong('2026-09-14');
    const khong = BON_MON.find((k) => !monCuaGv.includes(k));
    assert(khong, `Seed: GVBM của MB-FOU 12 dạy cả bốn môn (${monCuaGv.join(', ')}) — không còn môn nào để đối chứng`);
    assertThrows(() => regular.reportRegularNoShow(P.normalSubjectTeacher, attemptId, khong, true, '2026-09-16'),
      /phân công|quyền/, 'Môn không dạy thì không ghi được');
    assert(!dauCua(attemptId, khong!)?.no_show_period_id, 'Bị chặn thì không có dấu nào được ghi');
    assertThrows(() => regular.reportRegularNoShow(P.mbManager, attemptId, 'speaking', true, '2026-09-16'),
      /phân công|quyền/, 'Quản lý không có đường nhập bù điểm nên cũng không ghi được "-"');
    const r = regular.reportRegularNoShow(P.admin, attemptId, 'speaking', true, '2026-09-16');
    assert(r.moved, 'Quản trị hệ thống ghi được (đường nhập bù score.override) và dời được lịch');
  });

  check('PR-Rc1 · §6 Máy chủ KHÔNG còn câu "Lớp Normal không dùng dấu"', () => {
    assert(!/không dùng dấu/.test(String(attempts.saveScore)), 'Câu chặn cũ phải biến mất khỏi saveScore');
  });

  check('PR-Rc1 · §6 Lưới FT KHÔNG mở được cho lớp thường; endpoint chung trả đúng loại lưới', () => {
    const lopThuong = classId('MB-FOU 12');
    const lopFT = classId('MB-FT 101');
    assertThrows(() => attempts.classScoreSheet(P.mbManager, lopThuong, null), /lớp thường/i,
      'Bảng điểm Mock Test không nhận lớp thường');
    const a = cham.chamSheet(P.mbManager, lopThuong, {});
    assert(a.mode === 'ratio' && a.thuong && !a.ft, `Lớp thường phải ra lưới lớp thường: ${a.mode}`);
    assert(!JSON.stringify(a.thuong.rows).includes('"MT'), 'Không có chữ MT nào trong dữ liệu lớp thường');
    const b = cham.chamSheet(P.mbManager, lopFT, {});
    assert(b.mode === 'ielts_band' && b.ft && !b.thuong, `Lớp FT phải ra lưới Mock Test: ${b.mode}`);
  });

  check('PR-Rc1 · §6 Trạng thái Case không biến mất ở dòng bài cũ khi bài sau chạm vào cùng Case', () => {
    const { sid, cycleId, attemptId } = taoBaiThuong('2026-09-14');
    const a: any = conn.prepare('SELECT * FROM assessment_attempts WHERE id = ?').get(attemptId);
    /* Giữa khoá: trượt Listening → sinh tín hiệu cho môn đó. Quản lý không nhập điểm — dùng đường nhập bù của Quản trị. */
    for (const [k, s] of [['listening', 10], ['reading', 35], ['writing', 16], ['speaking', 8]] as const) {
      regular.saveRegularScore(P.admin, attemptId, k, { score: s, total: k === 'writing' ? 20 : k === 'speaking' ? 10 : 40 });
    }
    /*
     * Môn trượt chỉ sinh TÍN HIỆU, không tự sinh Case (mục 6.2). Case ra đời khi giáo viên bấm "Tạo Case" từ tín hiệu —
     * đi đúng đường đó (GVCN của lớp), để Case là Case Listening thật của chính dòng này.
     */
    const sg: any = conn.prepare(`SELECT * FROM case_signals WHERE attempt_id = ? AND skill = 'listening'`).get(attemptId);
    assert(sg && sg.status === 'pending', 'Môn trượt phải sinh tín hiệu đang chờ');
    casesSvc.reportIssue(P.normalCoreTeacher, {
      studentId: a.student_id, topic: 'listening', fromSignalId: sg.id,
      title: 'Listening dưới ngưỡng (PR-Rc1)', summary: 'Đã xem lại bài, em vướng đúng phần nghe này của môn.',
      primaryCode: d.issuesForTopic('listening')[0].code,
    });
    const caseRow: any = conn.prepare(
      `SELECT id, category, topic FROM sos_cases WHERE student_id = ? AND status != 'done' ORDER BY id DESC LIMIT 1`,
    ).get(a.student_id);
    const caseId = Number(caseRow?.id ?? 0);
    assert(caseId > 0, 'Phải có Case cho môn trượt');
    assert((caseRow.category ?? caseRow.topic) === 'listening', `Case phải là Case Listening: ${caseRow.category ?? caseRow.topic}`);
    /*
     * Bài Cuối khoá chạm vào cùng Case → cột attempt_id của Case trỏ sang lượt mới. Lượt mới là lượt THẬT của cùng khoá
     * (cột có khoá ngoại tới `assessment_attempts`, không trỏ được vào một số bịa).
     */
    const cuoiKhoa = taoLuot(cycleId, sid, 2, 'final', '2026-09-28');
    conn.prepare('UPDATE sos_cases SET attempt_id = ? WHERE id = ?').run(cuoiKhoa, caseId);
    const sheet = regular.regularSheet(P.mbManager, classId('MB-FOU 12'));
    const dong = sheet.rows.find((r: any) => r.attemptId === attemptId);
    assert(dong, 'Dòng vẫn còn trong bảng');
    assert(dong.cases.length > 0 && dong.cases[0].id === caseId,
      'Dòng cũ vẫn thấy Case của chính môn mình, dù attempt_id của Case đã trỏ chỗ khác');
    assert(dong.cases[0].category === 'listening' && dong.cases[0].skill === 'listening', 'Case gắn đúng môn trượt');
    assert(dong.caseStatus !== null, 'Trường cũ vẫn có giá trị để nơi gọi cũ không vỡ');
  });
}
