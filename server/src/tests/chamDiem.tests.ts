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
    /* RB-5: "-" của lớp thường là dời lịch, KHÔNG phải một lần dời do vắng — bộ đếm dời vắng giữ nguyên 0. */
    const demDoi = (conn.prepare('SELECT absence_move_count AS n FROM attempt_skills WHERE attempt_id = ? AND skill = ?')
      .get(attemptId, k) as any)?.n;
    assert(demDoi === 0, `absence_move_count của ${k} phải giữ 0 sau "-": ${demDoi}`);

    /* Bảng điểm lớp thường mang sẵn dữ liệu cho ô lưới (Task 7): dấu "-", tuần đã dời khỏi, quyền sửa của người xem. */
    const sheet = regular.regularSheet(P.normalSubjectTeacher, LOP);
    const dong = sheet.rows.find((x: any) => x.attemptId === attemptId);
    const o = dong.skillSchedule.find((x: any) => x.skill === k);
    assert(o.noShow === true && o.movedFrom === maTuanCu, `Ô ${k}: noShow=${o.noShow}, movedFrom=${o.movedFrom} ≠ ${maTuanCu}`);
    /* Task 7: lưới viết tuần bằng `tuanLich`, nên ô mang thứ Hai của tuần thi hiện tại và của tuần đã dời khỏi. */
    assert(o.weekStart === '2026-09-21' && o.movedFromStart === '2026-09-14',
      `Ô ${k}: weekStart=${o.weekStart}, movedFromStart=${o.movedFromStart}`);
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

  check('PR-Rc1 · Q4 Vắng hai tuần liên tiếp → 28/09; tuần mới chưa tới thì ghi lại không dời', () => {
    assert(monCuaGv.length > 0, 'Seed: GVBM của MB-FOU 12 phải được phân công ít nhất một môn');
    const k = monCuaGv[0];
    const { attemptId } = taoBaiThuong('2026-09-14');
    const tuanId = (ws: string) => (conn.prepare('SELECT id FROM report_periods WHERE week_start = ?').get(ws) as any)?.id;
    const tuanMon = () => tuanCuaMon(skillSched.loadSkillRows([attemptId]).get(attemptId), k);
    assert(regular.reportRegularNoShow(P.normalSubjectTeacher, attemptId, k, true, '2026-09-16').moved, 'Lần một phải dời');
    assert(tuanMon() === '2026-09-21', `Lần một sang 21/09: ${tuanMon()}`);
    /* Tuần 21/09 chưa tới (hôm nay 18/09): em chưa có dịp vắng tuần đó — ghi lại là vô hại. */
    const som = regular.reportRegularNoShow(P.normalSubjectTeacher, attemptId, k, true, '2026-09-18');
    assert(!som.moved && tuanMon() === '2026-09-21', `Tuần mới chưa tới thì không dời: ${tuanMon()}`);
    /* Tuần 21/09 đã tới (hôm nay 22/09) và em lại không làm bài → dời tiếp. */
    const lan2 = regular.reportRegularNoShow(P.normalSubjectTeacher, attemptId, k, true, '2026-09-22');
    assert(lan2.moved, 'Lần hai phải dời tiếp');
    assert(tuanMon() === '2026-09-28', `Lần hai sang 28/09: ${tuanMon()}`);
    assert(dauCua(attemptId, k).no_show_period_id === tuanId('2026-09-21'),
      'Dấu giữ tuần của LẦN GHI GẦN NHẤT (21/09), không phải 14/09');
    /* Cùng tuần 28/09 gọi lại (vẫn hôm nay 22/09) thì không dời lần ba. */
    assert(!regular.reportRegularNoShow(P.normalSubjectTeacher, attemptId, k, true, '2026-09-22').moved, 'Gọi lại là vô hại');
    assert(tuanMon() === '2026-09-28', 'Không dời lần ba');
    const nk = (conn.prepare(
      `SELECT COUNT(*) AS n FROM audit_logs WHERE action = 'regular.no_show' AND entity_type = 'assessment_attempt' AND entity_id = ?`,
    ).get(attemptId) as any).n;
    assert(nk === 2, `Mỗi lần dời một dòng nhật ký: ${nk}`);
    const demDoi = (conn.prepare('SELECT absence_move_count AS n FROM attempt_skills WHERE attempt_id = ? AND skill = ?')
      .get(attemptId, k) as any)?.n;
    assert(demDoi === 0, `absence_move_count giữ 0 sau hai lần "-": ${demDoi}`);
  });

  check('PR-Rc1 · Q4 Ghi "-" bù (tuần mới đã qua): ghi lại cùng ngày thì dời tiếp — em vắng cả tuần đó', () => {
    assert(monCuaGv.length > 0, 'Seed: GVBM của MB-FOU 12 phải được phân công ít nhất một môn');
    const k = monCuaGv[0];
    const { attemptId } = taoBaiThuong('2026-09-14');
    const tuanMon = () => tuanCuaMon(skillSched.loadSkillRows([attemptId]).get(attemptId), k);
    /* Hôm nay 05/10: cả 14/09 lẫn 21/09 đều đã qua — giáo viên ghi bù hai tuần vắng liền nhau. */
    assert(regular.reportRegularNoShow(P.normalSubjectTeacher, attemptId, k, true, '2026-10-05').moved, 'Lần ghi bù đầu vẫn dời');
    assert(tuanMon() === '2026-09-21', `Dời sang tuần kế của tuần thi: ${tuanMon()}`);
    assert(regular.reportRegularNoShow(P.normalSubjectTeacher, attemptId, k, true, '2026-10-05').moved,
      'Tuần 21/09 đã tới → ghi lại là một lần vắng mới');
    assert(tuanMon() === '2026-09-28', `Ghi bù lần hai sang 28/09: ${tuanMon()}`);
    const nk = (conn.prepare(
      `SELECT COUNT(*) AS n FROM audit_logs WHERE action = 'regular.no_show' AND entity_type = 'assessment_attempt' AND entity_id = ?`,
    ).get(attemptId) as any).n;
    assert(nk === 2, `Hai lần dời, hai dòng nhật ký: ${nk}`);
    const demDoi = (conn.prepare('SELECT absence_move_count AS n FROM attempt_skills WHERE attempt_id = ? AND skill = ?')
      .get(attemptId, k) as any)?.n;
    assert(demDoi === 0, `absence_move_count giữ 0: ${demDoi}`);
  });

  check('PR-Rc1 · "-" lần đầu trước tuần thi: bị chặn, không ghi gì, lịch giữ nguyên', () => {
    assert(monCuaGv.length > 0, 'Seed: GVBM của MB-FOU 12 phải được phân công ít nhất một môn');
    const k = monCuaGv[0];
    const { attemptId } = taoBaiThuong('2026-09-28');
    const nk = () => (conn.prepare(
      `SELECT COUNT(*) AS n FROM audit_logs WHERE action = 'regular.no_show' AND entity_type = 'assessment_attempt' AND entity_id = ?`,
    ).get(attemptId) as any).n;
    assertThrows(() => regular.reportRegularNoShow(P.normalSubjectTeacher, attemptId, k, true, '2026-09-22'),
      /Chưa tới tuần thi W\d [A-Z]{3} — chưa ghi "-" được/, 'Tuần thi 28/09 chưa tới (hôm nay 22/09) thì không ghi "-"');
    const sc = dauCua(attemptId, k);
    assert(!sc || !sc.no_show_period_id, 'Không có dòng dấu "-" nào được ghi');
    assert(tuanCuaMon(skillSched.loadSkillRows([attemptId]).get(attemptId), k) === '2026-09-28', 'Lịch giữ nguyên');
    assert(nk() === 0, 'Không có dòng nhật ký nào');
    /* Tới tuần thi thì ghi được như thường. */
    assert(regular.reportRegularNoShow(P.normalSubjectTeacher, attemptId, k, true, '2026-09-28').moved, 'Đúng tuần thi thì ghi được');
  });

  check('PR-Rc1 · Q3+Q4 Gỡ dấu sau lần dời thứ hai chỉ lùi về 21/09 (tuần vừa dời khỏi), không về 14/09', () => {
    assert(monCuaGv.length > 0, 'Seed: GVBM của MB-FOU 12 phải được phân công ít nhất một môn');
    const k = monCuaGv[0];
    const { attemptId } = taoBaiThuong('2026-09-14');
    const tuanMon = () => tuanCuaMon(skillSched.loadSkillRows([attemptId]).get(attemptId), k);
    regular.reportRegularNoShow(P.normalSubjectTeacher, attemptId, k, true, '2026-09-16');
    regular.reportRegularNoShow(P.normalSubjectTeacher, attemptId, k, true, '2026-09-22');
    assert(tuanMon() === '2026-09-28', `Đã dời hai lần: ${tuanMon()}`);
    const g = regular.reportRegularNoShow(P.normalSubjectTeacher, attemptId, k, false, '2026-09-22');
    assert(g.moved, 'Gỡ dấu là một lần đổi lịch');
    assert(tuanMon() === '2026-09-21', `Gỡ dấu lần hai về 21/09: ${tuanMon()}`);
    const sc = dauCua(attemptId, k);
    assert(!sc || !sc.no_show_period_id, 'Dấu đã được xoá');
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

  check('PR-Rc1 · §6 Nhiều Case cùng môn: dòng hiện Case ĐANG MỞ trước, không phải Case cũ đã xong (mục 4.3)', () => {
    const { cycleId, attemptId } = taoBaiThuong('2026-09-14');
    const a: any = conn.prepare('SELECT * FROM assessment_attempts WHERE id = ?').get(attemptId);
    for (const [k, s] of [['listening', 10], ['reading', 35], ['writing', 16], ['speaking', 8]] as const) {
      regular.saveRegularScore(P.admin, attemptId, k, { score: s, total: k === 'writing' ? 20 : k === 'speaking' ? 10 : 40 });
    }
    const sg: any = conn.prepare(`SELECT * FROM case_signals WHERE attempt_id = ? AND skill = 'listening'`).get(attemptId);
    assert(sg && sg.status === 'pending', 'Môn trượt phải sinh tín hiệu đang chờ');
    const baoCase = (extra: Record<string, unknown>) => casesSvc.reportIssue(P.normalCoreTeacher, {
      studentId: a.student_id, topic: 'listening', title: 'Listening dưới ngưỡng (PR-Rc1)',
      summary: 'Đã xem lại bài, em vướng đúng phần nghe này của môn.',
      primaryCode: d.issuesForTopic('listening')[0].code, ...extra,
    }) as any;
    /* Case CŨ của môn này đã xong (như Case nhập bù — đóng ngay lúc tạo), rồi một Case MỚI đang mở cùng môn, cùng khoá. */
    const cu = baoCase({ fromSignalId: sg.id });
    conn.prepare(`UPDATE sos_cases SET status = 'done' WHERE id = ?`).run(cu.id);
    const moi = baoCase({ cycleId });
    assert(moi.id > cu.id, 'Case mới có id lớn hơn');
    const moiRow: any = conn.prepare('SELECT status FROM sos_cases WHERE id = ?').get(moi.id);
    assert(moiRow.status !== 'done', 'Case mới đang mở');
    const dong = regular.regularSheet(P.mbManager, classId('MB-FOU 12')).rows.find((r: any) => r.attemptId === attemptId);
    assert(dong.cases.length === 2, `Dòng thấy cả hai Case của môn: ${dong.cases.length}`);
    assert(dong.cases[0].id === moi.id && dong.cases[0].status !== 'done',
      `Case đầu tiên phải là Case đang mở: #${dong.cases[0].id} (${dong.cases[0].status})`);
    assert(dong.caseId === moi.id && dong.caseStatus === moiRow.status, `Trường cũ lấy Case đang mở: ${dong.caseStatus}`);
  });

  /*
   * RB-5 dùng một lượt Mock của lớp demo MB-FT 101 — chọn lượt GHI ĐƯỢC (chưa huỷ, L và R đều trong phạm vi, chưa bị
   * ghi vắng/huỷ phần thi), không lấy "lượt đầu tiên" theo thứ tự seed. Mỗi phép kiểm tự xoá ô của mình trước khi ghi,
   * nên không phụ thuộc điểm mà bộ demo đã có.
   */
  function luotFtGhiDuoc(boQua: number[] = []): number {
    const ds = conn.prepare(
      `SELECT id FROM assessment_attempts WHERE kind = 'mock' AND class_id = ? AND status != 'cancelled' ORDER BY id`,
    ).all(classId('MB-FT 101')) as any[];
    for (const { id } of ds) {
      if (boQua.includes(id)) continue;
      const rows = skillSched.ensureSkillRows(id) as any[];
      const ok = ['listening', 'reading'].every((k) => {
        const r = rows.find((x: any) => x.skill === k);
        return r && r.required && r.sit_status !== 'cancelled' && r.sit_status !== 'absent';
      });
      if (ok) return id;
    }
    throw new Error('Seed: MB-FT 101 không còn lượt Mock nào ghi được L và R');
  }
  const xoaO = (attemptId: number, k: string) =>
    conn.prepare('DELETE FROM assessment_scores WHERE attempt_id = ? AND skill = ?').run(attemptId, k);

  check('PR-Rc1 · RB-5 Sửa ô đã có điểm phải ghi lý do; lý do vào lịch sử điểm', () => {
    const { attemptId } = taoBaiThuong('2026-09-14');
    /* Quản lý không nhập điểm (Ruling 1) — đường nhập bù của Quản trị hệ thống. */
    regular.saveRegularScore(P.admin, attemptId, 'listening', { score: 30, total: 40 });
    assertThrows(() => regular.saveRegularScore(P.admin, attemptId, 'listening', { score: 31, total: 40 }),
      /lý do/, 'Sửa điểm đã có mà không ghi lý do thì bị chặn');
    const ok = regular.saveRegularScore(P.admin, attemptId, 'listening',
      { score: 31, total: 40, lyDo: 'Cộng nhầm một câu' });
    assert((ok.score as any).raw_score === 31, 'Có lý do thì lưu được');
    const lich = conn.prepare(
      `SELECT after_json FROM audit_logs WHERE entity_type = 'assessment_score' AND action LIKE 'regular.score%' ORDER BY id DESC LIMIT 1`,
    ).get() as any;
    assert(String(lich.after_json).includes('Cộng nhầm'), 'Lý do phải nằm trong nhật ký');

    /* Fast Track: cùng luật, và lịch sử điểm của hồ sơ đợt đọc được lý do. */
    const ft = luotFtGhiDuoc();
    xoaO(ft, 'listening');
    attempts.saveScore(P.admin, ft, 'listening', { rawScore: 30 });
    assertThrows(() => attempts.saveScore(P.admin, ft, 'listening', { rawScore: 31 }), /lý do/,
      'Fast Track cũng đòi lý do khi sửa điểm đã có');
    attempts.saveScore(P.admin, ft, 'listening', { rawScore: 31, lyDo: 'Chấm lại phần 3' });
    const h = attempts.scoreHistoryOf(ft);
    assert(h.some((x: any) => x.lyDo === 'Chấm lại phần 3'), 'Lịch sử điểm hiện lý do');
  });

  check('PR-Rc1 · RB-5 Không đòi lý do khi ô đang trống, và xoá điểm cũng phải có lý do', () => {
    const ft = luotFtGhiDuoc();
    xoaO(ft, 'reading');
    attempts.saveScore(P.admin, ft, 'reading', { rawScore: 28 });   // lần đầu: không cần lý do
    assertThrows(() => attempts.saveScore(P.admin, ft, 'reading', { rawScore: null }), /lý do/,
      'Xoá một điểm đã có cũng là hiệu chỉnh');
    const { attemptId } = taoBaiThuong('2026-09-14');
    regular.saveRegularScore(P.admin, attemptId, 'reading', { score: 20, total: 40 });
    assertThrows(() => regular.saveRegularScore(P.admin, attemptId, 'reading', { score: null }), /lý do/,
      'Lớp thường: xoá điểm đã có cũng phải có lý do');
  });

  check('PR-Rc1 · RB-5 Ghi lại đúng con số cũ (tự lưu) hay chỉ sửa ghi chú thì không đòi lý do', () => {
    const { attemptId } = taoBaiThuong('2026-09-14');
    regular.saveRegularScore(P.admin, attemptId, 'writing', { score: 15, total: 20 });
    const lai = regular.saveRegularScore(P.admin, attemptId, 'writing', { score: 15, total: 20 });
    assert((lai.score as any).raw_score === 15, 'Lớp thường: lưu lại cùng điểm không bị chặn');
    assertThrows(() => regular.saveRegularScore(P.admin, attemptId, 'writing', { score: 15, total: 25 }), /lý do/,
      'Lớp thường: đổi tổng câu là đổi kết quả nên cũng phải có lý do');

    const ft = luotFtGhiDuoc();
    xoaO(ft, 'listening');
    attempts.saveScore(P.admin, ft, 'listening', { rawScore: 25 });
    attempts.saveScore(P.admin, ft, 'listening', { rawScore: 25 });
    attempts.saveScore(P.admin, ft, 'listening', { note: 'Em làm bài đủ giờ' });
    const o: any = dauCua(ft, 'listening');
    assert(o.raw_score === 25 && o.note === 'Em làm bài đủ giờ', 'Fast Track: lưu lại cùng điểm và sửa ghi chú không bị chặn');
  });

  // ---------------------------------------------------------------- Task 6: Cần chấm + Lịch Test (dữ liệu)
  const TRANG_THAI = /^(Đã chấm xong|Chưa tới hạn|Còn \d+ bài|Quá hạn · còn \d+ bài)$/;

  check('PR-Rc1 · Q11 Cần chấm: một dòng = một lớp + một đợt, đếm đúng số ô còn phải chấm', () => {
    const r = cham.canChamList(P.mbManager, {}, TODAY);
    assert(Array.isArray(r.nhom) && r.nhom.length === 3, 'Luôn đủ ba mục');
    assert(r.nhom.map((x: any) => x.muc).join(',') === 'qua-han,tuan-nay,sap-toi', 'Đúng thứ tự');
    const dong = r.nhom.flatMap((x: any) => x.dong);
    assert(dong.every((d: any) => d.conBai > 0), 'Không có dòng nào "còn 0 bài"');
    assert(new Set(dong.map((d: any) => d.key)).size === dong.length, 'Khoá dòng không trùng');
    assert(dong.every((d: any) => d.href.startsWith('/nhap-diem/')), 'Bấm Chấm mở thẳng lưới');
    const thuong = dong.filter((d: any) => d.mode === 'ratio');
    assert(thuong.length > 0, 'Seed: phải có ít nhất một dòng lớp thường để kiểm tên đợt');
    for (const x of thuong) {
      assert(!/MT/.test(x.dotLabel), `Lớp thường không gọi đợt là MT: ${x.dotLabel}`);
      assert(['Giữa khoá', 'Cuối khoá'].includes(x.dotLabel), x.dotLabel);
    }
    /* Ruling 3: tiêu đề mục kèm hạn sớm nhất của mục. */
    for (const n of r.nhom) {
      const som = n.dong.map((d: any) => d.han).filter(Boolean).sort()[0] ?? null;
      assert(n.han === som, `Mục ${n.muc}: hạn ${n.han} ≠ hạn sớm nhất ${som}`);
    }
    /* Q12: dòng FT mở lưới đúng tuần của đợt. */
    for (const d of dong.filter((x: any) => x.mode === 'ielts_band')) {
      assert(/[?&]periodId=\d+/.test(d.href), `Dòng FT phải mang periodId: ${d.href}`);
    }
    /* Bấm thử A2: dòng nào cũng mang `kn` = môn còn nợ đầu tiên theo thứ tự L · R · W · S — kể cả dòng nhiều môn. */
    for (const d of dong) {
      const kn = new URLSearchParams(d.href.split('?')[1] ?? '').get('kn');
      assert(kn === d.kyNang[0], `Dòng ${d.key} phải mang kn=${d.kyNang[0]}: ${d.href}`);
    }
    assert(dong.some((d: any) => d.kyNang.length > 1), 'Seed: phải có dòng nhiều môn để kiểm kn');
    assert(r.tong === dong.reduce((n: number, d: any) => n + d.conBai, 0), 'Tổng = cộng các dòng');
  });

  check('PR-Rc1 · Q13 Cần chấm lọc theo lớp thì nói rõ đang lọc lớp nào', () => {
    const cid = classId('MB-FT 101');
    const r = cham.canChamList(P.mbManager, { classId: cid }, TODAY);
    assert(r.lop && r.lop.id === cid && r.lop.code === 'MB-FT 101', 'Trả về lớp đang lọc để giao diện hiện chip');
    assert(r.nhom.flatMap((x: any) => x.dong).every((d: any) => d.classId === cid), 'Chỉ còn lớp đó');
    assert(cham.canChamList(P.mbManager, {}, TODAY).lop === null, 'Không lọc thì không có chip');
    /* Lớp ngoài phạm vi (chi nhánh CP, người xem là Quản lý MB): không lộ mã lớp qua chip. */
    const ngoai = cham.canChamList(P.mbManager, { classId: classId('CP-FT 110') }, TODAY);
    assert(ngoai.lop === null, `Lớp ngoài phạm vi phải trả lop = null: ${JSON.stringify(ngoai.lop)}`);
    assert(ngoai.nhom.flatMap((x: any) => x.dong).length === 0, 'Lớp ngoài phạm vi thì không có dòng nào');
  });

  check('PR-Rc1 · Q14 Lịch Test nhóm theo lớp và lọc theo tuần của CHÍNH môn', () => {
    const { attemptId } = taoBaiThuong('2026-09-14');
    const tuan: any = conn.prepare('SELECT id FROM report_periods WHERE week_start = ?').get('2026-09-14');
    const r = cham.lichTest(P.mbManager, tuan.id, null, TODAY);
    const lop = r.lop.find((l: any) => l.classCode === 'MB-FOU 12');
    assert(lop, 'Lớp có bài trong tuần phải xuất hiện');
    assert(lop.dong.every((d: any) => d.soHv > 0), 'Mỗi dòng có số học viên');
    const tatCa = r.lop.flatMap((l: any) => l.dong);
    assert(tatCa.every((d: any) => TRANG_THAI.test(d.trangThai)), `Câu trạng thái lạ: ${tatCa.map((d: any) => d.trangThai).join(' | ')}`);
    for (const l of r.lop.filter((x: any) => x.mode === 'ielts_band')) {
      assert(l.dong.every((d: any) => d.href.includes(`periodId=${tuan.id}`)), 'Lớp FT mở lưới đúng tuần đang xem');
    }
    /* Lớp thường: link kèm `kn` = môn của dòng (như Cần chấm), không kèm periodId. */
    for (const d of lop.dong) {
      const q = new URLSearchParams(d.href.split('?')[1] ?? '');
      assert(q.get('kn') === d.kyNang[0] && !q.has('periodId'), `Dòng lớp thường phải mang kn=${d.kyNang[0]}: ${d.href}`);
    }
    /* Dời Listening sang tuần sau rồi thì tuần 14/09 không còn Listening của em này, tuần 21/09 thì có. Ghi "-" dùng
       Quản trị hệ thống (Ruling 1: Quản lý không ghi điểm). */
    regular.reportRegularNoShow(P.admin, attemptId, 'listening', true, '2026-09-16');
    const sau: any = conn.prepare('SELECT id FROM report_periods WHERE week_start = ?').get('2026-09-21');
    const r2 = cham.lichTest(P.mbManager, sau.id, null, TODAY);
    const lop2 = r2.lop.find((l: any) => l.classCode === 'MB-FOU 12');
    assert(lop2 && lop2.dong.some((d: any) => d.kyNang.includes('listening')), 'Môn đã dời hiện ở tuần mới');
    const r3 = cham.lichTest(P.mbManager, tuan.id, null, TODAY);
    const nghe = (x: any) => x.lop.find((l: any) => l.classCode === 'MB-FOU 12')?.dong
      .filter((d: any) => d.kyNang.includes('listening')).reduce((n: number, d: any) => n + d.soHv, 0) ?? 0;
    assert(nghe(r3) === nghe(r) - 1, `Tuần cũ bớt đúng một em Listening: ${nghe(r)} → ${nghe(r3)}`);
  });

  check('PR-Rc1 · Q15 Cần chấm: môn lùi lịch nói rõ lùi của ai, từ tuần nào sang tuần nào; "Chấm tiếp" khi đã có ô chấm', () => {
    /* Đợt ở TUẦN TRƯỚC của hôm nay: môn dời sang tuần sau rơi đúng vào tuần này, tức là đã tới lúc phải chấm. */
    const tuanNay = d.mondayOfDate(TODAY);
    const tuanTruoc = t.addDays(tuanNay, -7);
    const { sid, cycleId } = taoBaiThuong(tuanTruoc);
    /* Đợt riêng (số 7) cho em này để dòng Cần chấm của lớp + đợt chỉ có đúng một em — kết quả xác định. */
    const aid = taoLuot(cycleId, sid, 7, 'progress', tuanTruoc);
    const ten = (conn.prepare('SELECT full_name FROM students WHERE id = ?').get(sid) as any).full_name;
    const dongCua = () => cham.canChamList(P.admin, { classId: LOP, scope: 'managed' }, TODAY)
      .nhom.flatMap((x: any) => x.dong).find((d: any) => d.key === `${LOP}:progress:7`);
    const truoc = dongCua();
    assert(truoc && truoc.luiLich === null, 'Chưa dời gì thì không có dòng "lùi lịch"');
    assert(truoc.daBatDau === false, 'Chưa ô nào có điểm thì là "Chấm", chưa phải "Chấm tiếp"');
    regular.reportRegularNoShow(P.admin, aid, 'listening', true, TODAY);
    const d1 = dongCua();
    assert(d1 && d1.luiLich, 'Môn còn nợ ở tuần khác tuần của đợt thì phải có "lùi lịch"');
    assert(d1.luiLich.kyNang === 'listening', `Đúng môn: ${d1.luiLich.kyNang}`);
    assert(d1.luiLich.hv.length === 1 && d1.luiLich.hv[0] === ten, `Đúng tên em: ${d1.luiLich.hv.join(', ')}`);
    assert(d1.luiLich.tuTuanStart === tuanTruoc && d1.luiLich.sangTuanStart === tuanNay,
      `Từ ${tuanTruoc} sang ${tuanNay}: ${d1.luiLich.tuTuanStart} → ${d1.luiLich.sangTuanStart}`);
    assert(d1.kyNang.includes('listening'), 'Môn lùi vẫn là việc phải chấm của dòng');
    assert(d1.luiLich.tuTuan && d1.luiLich.sangTuan && d1.luiLich.tuTuan !== d1.luiLich.sangTuan, 'Có mã hai tuần');
    regular.saveRegularScore(P.admin, aid, 'reading', { score: 30, total: 40 });
    const d2 = dongCua();
    assert(d2.daBatDau === true, 'Đã có một ô chấm thì là "Chấm tiếp"');
    assert(d2.conBai === d1.conBai - 1, `Bớt đúng một bài: ${d1.conBai} → ${d2.conBai}`);
  });

  check('PR-Rc1 · Q15 Lịch tách tuần theo KẾ HOẠCH không phải "lùi lịch"; chỉ dấu "-" (hay dời do vắng) mới là lùi', () => {
    const tuanNay = d.mondayOfDate(TODAY);
    const tuanTruoc = t.addDays(tuanNay, -7);
    const { sid, cycleId } = taoBaiThuong(tuanTruoc);
    const aid = taoLuot(cycleId, sid, 8, 'progress', tuanTruoc);
    const tuanNayId = (conn.prepare('SELECT id FROM report_periods WHERE week_start = ?').get(tuanNay) as any)?.id;
    assert(tuanNayId, 'Tuần hiện tại phải có trong bảng tuần');
    /* Xếp riêng Speaking sang tuần này bằng đường xếp lịch thường — đúng như một kế hoạch tách tuần. */
    skillSched.setSkillWeek(P.admin, aid, 'speaking', tuanNayId, { reason: 'Kế hoạch tách tuần', force: true });
    const dongCua = () => cham.canChamList(P.admin, { classId: LOP, scope: 'managed' }, TODAY)
      .nhom.flatMap((x: any) => x.dong).find((x: any) => x.key === `${LOP}:progress:8`);
    const a1 = dongCua();
    assert(a1 && a1.kyNang.includes('speaking'), 'Speaking ở tuần này vẫn là việc phải chấm');
    assert(a1.luiLich === null, `Tách tuần theo kế hoạch KHÔNG phải lùi lịch: ${JSON.stringify(a1.luiLich)}`);
    regular.reportRegularNoShow(P.admin, aid, 'listening', true, TODAY);
    const a2 = dongCua();
    assert(a2.luiLich && a2.luiLich.kyNang === 'listening', `Dấu "-" thì là lùi lịch: ${JSON.stringify(a2.luiLich)}`);
    assert(a2.luiLich.tuTuanStart === tuanTruoc && a2.luiLich.sangTuanStart === tuanNay, 'Tuần cũ = tuần ghi dấu "-"');
  });

  check('PR-Rc1 · Q11 Cần chấm của GVBM (phạm vi mặc định) chỉ có môn của chính mình', () => {
    const r = cham.canChamList(P.normalSubjectTeacher, { classId: LOP }, TODAY);
    const dong = r.nhom.flatMap((x: any) => x.dong);
    assert(dong.length > 0, 'GVBM còn bài phải chấm ở MB-FOU 12');
    const la = dong.flatMap((x: any) => x.kyNang).filter((k: string) => !monCuaGv.includes(k));
    assert(la.length === 0, `Có môn không phải của GVBM (${monCuaGv.join(', ')}): ${la.join(', ')}`);
  });

  check('PR-Rc1 · Q14 Lịch Test: tuần chưa tới là "Chưa tới hạn"; em vắng không được đếm vào dòng', () => {
    const tuanXa = t.addDays(d.mondayOfDate(TODAY), 9 * 7);
    const { attemptId } = taoBaiThuong(tuanXa);
    const pid = (conn.prepare('SELECT id FROM report_periods WHERE week_start = ?').get(tuanXa) as any).id;
    const lopOf = () => cham.lichTest(P.mbManager, pid, null, TODAY).lop.find((l: any) => l.classCode === 'MB-FOU 12');
    const l1 = lopOf();
    assert(l1 && l1.dong.length > 0, 'Bài ở tuần sau phải hiện ở Lịch Test của tuần đó');
    assert(l1.dong.every((x: any) => x.trangThai === 'Chưa tới hạn'), l1.dong.map((x: any) => x.trangThai).join(' | '));
    const truoc = l1.dong.find((x: any) => x.kyNang.includes('reading')).soHv;
    conn.prepare(`UPDATE attempt_skills SET sit_status = 'absent' WHERE attempt_id = ? AND skill = 'reading'`).run(attemptId);
    const sau = lopOf()?.dong.find((x: any) => x.kyNang.includes('reading'))?.soHv ?? 0;
    assert(sau === truoc - 1, `Em vắng Reading rời khỏi số em của dòng: ${truoc} → ${sau}`);
  });
}
