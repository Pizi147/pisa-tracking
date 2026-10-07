/**
 * PHÉP KIỂM PR-Rc1 + PR-UX1: Lịch Test (gộp Cần chấm) · lưới chấm chung (spec 2026-09-22-ux-toan-web-truoc-deploy-design §3.5, §6;
 * kiểm kê §1.4 R8/R13/R15/R16, §1.7 RB-5, §6 DS02). Kế hoạch: docs/superpowers/plans/2026-09-22-pr-rc1-cham-diem.md.
 *
 * Harness do `run.ts` sở hữu và truyền vào; file này không tự mở database. Học viên/lượt dùng ở đây do CHÍNH file này
 * tạo, không đụng dữ liệu của bộ demo (trừ nơi ghi rõ là đọc lớp demo MB FOU 12 / MB FT 101).
 */
import type { YThucTestKit } from './yThuc.tests.ts';

export async function runChamDiemTests(t: YThucTestKit) {
  const { check, assert, assertThrows, conn, TODAY, P, classId } = t;
  const d: any = await import('../../../shared/domain/index.ts');
  console.log('\nPR-Rc1/PR-UX1 · Lịch Test + lưới chấm');

  check('PR-UX1 · Nhãn hàng lớp Lịch Test: một trạng thái, nói của ai', () => {
    const n = (conBai: number, conBaiCuaToi: number, chuaToiHan: boolean, coDayLop: boolean) =>
      d.nhanLopLichTest({ conBai, conBaiCuaToi, chuaToiHan, coDayLop });
    const eq = (got: any, want: string, m: string) => assert(`${got.loai}|${got.chu}` === want, `${m}: ${got.loai}|${got.chu} ≠ ${want}`);
    eq(n(0, 0, true, true), 'da-cham|Đã chấm', 'Hết bài thì "Đã chấm" dù tuần chưa tới');
    eq(n(3, 3, true, true), 'chua-toi-han|Chưa đến lịch', 'Tuần sau: chưa ai nợ gì');
    eq(n(3, 1, false, true), 'cho-ban|Chờ bạn chấm', 'Còn bài của tôi');
    eq(n(3, 0, false, true), 'cho-gv-khac|Chờ GV khác', 'Tôi dạy lớp nhưng bài còn lại của người khác');
    eq(n(3, 0, false, false), 'cho-cham|Chờ chấm', 'Quản lý (không dạy lớp) không thấy chữ "GV khác"');
    for (const x of [n(0, 0, false, false), n(2, 0, true, false), n(2, 2, false, true), n(2, 0, false, true), n(2, 0, false, false)]) {
      assert(x.chu.split(' ').length <= 3, `Badge dài hơn 3 từ: ${x.chu}`);
      assert(!/quá hạn/i.test(x.chu), `Quá hạn nói ở cột Hạn, không ở badge: ${x.chu}`);
    }
  });

  check('PR-UX1 · Lớp tự mở: GV theo bài của mình, QL theo bài còn lại', () => {
    assert(d.lopTuMo({ conBai: 5, conBaiCuaToi: 2, coPhanCong: true }) === true, 'GV còn bài của mình → mở');
    assert(d.lopTuMo({ conBai: 5, conBaiCuaToi: 0, coPhanCong: true }) === false, 'GV: bài còn lại của người khác → thu');
    assert(d.lopTuMo({ conBai: 5, conBaiCuaToi: 0, coPhanCong: false }) === true, 'QL: lớp còn bài → mở');
    assert(d.lopTuMo({ conBai: 0, conBaiCuaToi: 0, coPhanCong: false }) === false, 'QL: lớp xong → thu');
  });

  check('PR-UX1 · duongLichTest giữ thứ tự tham số, bỏ tham số rỗng', () => {
    const eq = (got: string, want: string) => assert(got === want, `${got} ≠ ${want}`);
    eq(d.duongLichTest(), '/test/lich');
    eq(d.duongLichTest({ classId: null, kn: '' }), '/test/lich');
    eq(d.duongLichTest({ kn: 'reading', classId: 7, periodId: 40, branchId: 2 }), '/test/lich?cn=2&periodId=40&classId=7&kn=reading');
    eq(d.duongLichTest({ classId: 7 }), '/test/lich?classId=7');
    for (const x of [d.duongLichTest(), d.duongLichTest({ classId: 7, kn: 'listening' })]) {
      const [p, q = ''] = x.split('?');
      assert(d.duongMoi(p, q) === null, `Đích Lịch Test không được bị chuyển tiếp: ${x}`);
    }
  });

  check('PR-UX1 · Lưu theo từng ô: ô hỏng (503) không bị ô lưu sau che thành "Đã lưu" (lỗi bản chính 24/09)', () => {
    const eq = (got: any, want: string, m: string) => assert(`${got.tt}|${got.soLoi}` === want, `${m}: ${got.tt}|${got.soLoi} ≠ ${want}`);
    let o = {};
    o = d.capNhatLuuO(o, 'listening', 'bat-dau');
    eq(d.tomTatLuuDong(Object.values(o)), 'dang-luu|0', 'Đang gửi L');
    o = d.capNhatLuuO(o, 'listening', 'loi');                 // L: 503
    o = d.capNhatLuuO(o, 'reading', 'bat-dau');
    o = d.capNhatLuuO(o, 'reading', 'thanh-cong');            // R lưu được SAU L
    eq(d.tomTatLuuDong(Object.values(o)), 'loi|1', 'L hỏng rồi R lưu được: dòng vẫn "1 ô chưa lưu", KHÔNG "đã lưu"');
    o = d.capNhatLuuO(o, 'speaking', 'bat-dau');
    eq(d.tomTatLuuDong(Object.values(o)), 'loi|1', 'Đang gửi ô khác không che ô lỗi');
    o = d.capNhatLuuO(o, 'speaking', 'loi');
    eq(d.tomTatLuuDong(Object.values(o)), 'loi|2', 'Hai ô hỏng → 2');
    o = d.capNhatLuuO(o, 'listening', 'bat-dau');
    o = d.capNhatLuuO(o, 'listening', 'thanh-cong');          // Lưu lại L thành công
    eq(d.tomTatLuuDong(Object.values(o)), 'loi|1', 'Lưu lại L được, S còn hỏng → 1');
    o = d.capNhatLuuO(o, 'speaking', 'bo');                   // máy chủ từ chối có chủ ý (4xx lệnh "-") → không phải "chưa lưu"
    eq(d.tomTatLuuDong(Object.values(o)), 'da-luu|0', 'Hết ô lỗi mới là "đã lưu"');
    eq(d.tomTatLuuDong([]), 'null|0', 'Chưa gửi gì');
    assert(d.chuOChuaLuu(3) === '3 ô chưa lưu', 'Chữ');
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
    eq(d.ketQuaThuong({ dat: 2, daCham: 2, tong: 4, thieu: ['W', 'S'] }).chinh, '2/2 môn đạt', 'Mới chấm hai môn');
    eq(d.ketQuaThuong({ dat: 2, daCham: 2, tong: 4, thieu: ['W', 'S'] }).phu, 'còn W, S chưa chấm', 'Dòng phụ gọi tên môn');
    eq(d.ketQuaThuong({ dat: 3, daCham: 4, tong: 4, thieu: [] }).chinh, '3/4 môn đạt', 'Đủ điểm thì bỏ chữ "đã chấm"');
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

  // PR-MTa T7 thay RB-5 (LY_DO_TOI_THIEU, kiemLyDo): sửa điểm — lý do tuỳ chọn; huỷ điểm — bắt buộc, không tối thiểu ký tự.
  /* Rà #212 (chủ sản phẩm 06/10) thay "lý do huỷ điểm bắt buộc": huỷ điểm tuỳ chọn; huỷ lượt vẫn bắt, không tối thiểu ký tự. */
  check('PR-Rc1 · RB-5 lý do: huỷ điểm tuỳ chọn; huỷ lượt bắt buộc, không nhận khoảng trắng, không tối thiểu ký tự (PR-MTa T7, rà #212)', () => {
    assert(d.kiemLyDoThaoTac('huy-diem', null) === null && d.kiemLyDoThaoTac('sua-diem', null) === null, 'Huỷ điểm, sửa điểm tuỳ chọn');
    assert(d.kiemLyDoThaoTac('huy-luot', null) !== null && d.kiemLyDoThaoTac('huy-luot', '   ') !== null, 'Huỷ lượt trống thì phải báo lỗi');
    assert(d.kiemLyDoThaoTac('huy-luot', 'sai') === null, 'Ngắn vẫn hợp lệ');
    assert(!/Hãy/.test(String(d.kiemLyDoThaoTac('huy-luot', null))), 'Câu lỗi không mở đầu bằng "Hãy"');
  });

  check('PR-Rc1 · Câu trạng thái chấm dùng chung cho Lịch Test', () => {
    const eq = (got: string, want: string, m: string) => assert(got === want, `${m}: "${got}" ≠ "${want}"`);
    eq(d.trangThaiChamLabel({ conBai: 0, tong: 8, quaHan: false, chuaToiHan: false }), 'Đã chấm xong', 'Xong');
    eq(d.trangThaiChamLabel({ conBai: 3, tong: 8, quaHan: false, chuaToiHan: false }), 'Còn 3 bài', 'Còn bài');
    eq(d.trangThaiChamLabel({ conBai: 3, tong: 8, quaHan: true, chuaToiHan: false }), 'Quá hạn · còn 3 bài', 'Quá hạn');
    eq(d.trangThaiChamLabel({ conBai: 8, tong: 8, quaHan: false, chuaToiHan: true }), 'Chưa đến lịch', 'Chưa tới tuần thi');
  });

  // ---------------------------------------------------------------- C08: dấu "-" của lớp thường
  const regular: any = await import('../normal/regular.ts');
  const skillSched: any = await import('../fasttrack/skillSchedule.ts');
  const attempts: any = await import('../fasttrack/attempts.ts');
  const cham: any = await import('../cham/canCham.ts');
  const casesSvc: any = await import('../cases/cases.ts');
  const NOW = new Date().toISOString();
  const LOP = classId('MB FOU 12');
  const BON_MON = ['listening', 'reading', 'writing', 'speaking'];

  /** Những môn GVBM (không kiêm GVCN) thật sự được phân công ở MB FOU 12 — không gõ cứng tên môn. */
  const monCuaGv = (conn.prepare(
    `SELECT skill FROM teacher_assignments WHERE class_id = ? AND user_id = ? AND status = 'active' AND skill IS NOT NULL`,
  ).all(LOP, P.normalSubjectTeacher.userId) as any[]).map((x) => x.skill as string).filter((k) => BON_MON.includes(k));

  /** Một học viên mới ở MB FOU 12 (lớp thường) + một bài Giữa khoá đã xếp tuần, bốn môn cùng tuần. */
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
    assert(monCuaGv.length > 0, 'Seed: GVBM của MB FOU 12 phải được phân công ít nhất một môn');
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
    /* PR-MTa T19 thay "sửa được ngay": ô chưa tới tuần thi khoá — nhưng ô đang mang dấu "-" vẫn mở để gỡ dấu (rà #212). */
    assert(o.canEdit === true, 'Ô mang dấu "-" (đã dời sang 21/09) vẫn mở để gỡ dấu');
    const oTuanThi = regular.regularSheet(P.normalSubjectTeacher, LOP, undefined, '2026-09-21').rows
      .find((x: any) => x.attemptId === attemptId).skillSchedule.find((x: any) => x.skill === k);
    assert(oTuanThi.canEdit === true, 'GVBM sửa được ô môn mình từ tuần thi');
    const oKhac = dong.skillSchedule.find((x: any) => x.skill === khac);
    assert(oKhac.noShow === false && oKhac.movedFrom === null, 'Môn không ghi dấu thì không có noShow/movedFrom');
    const khongDay = BON_MON.find((x) => !monCuaGv.includes(x));
    assert(khongDay, 'Seed: cần một môn GVBM không dạy để đối chứng canEdit');
    assert(dong.skillSchedule.find((x: any) => x.skill === khongDay).canEdit === false, 'Môn không dạy thì canEdit = false');
  });

  check('PR-Rc1 · Q3 Gỡ dấu "-" trả môn về đúng tuần cũ; Q5 ô đã có điểm thì không nhận dấu', () => {
    assert(monCuaGv.length > 0, 'Seed: GVBM của MB FOU 12 phải được phân công ít nhất một môn');
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
    assert(monCuaGv.length > 0, 'Seed: GVBM của MB FOU 12 phải được phân công ít nhất một môn');
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
    assert(monCuaGv.length > 0, 'Seed: GVBM của MB FOU 12 phải được phân công ít nhất một môn');
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
    assert(monCuaGv.length > 0, 'Seed: GVBM của MB FOU 12 phải được phân công ít nhất một môn');
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
    assert(monCuaGv.length > 0, 'Seed: GVBM của MB FOU 12 phải được phân công ít nhất một môn');
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
    assert(monCuaGv.length > 0, 'Seed: GVBM của MB FOU 12 phải được phân công ít nhất một môn');
    const k = monCuaGv[0];
    const { sid, cycleId, attemptId } = taoBaiThuong('2026-09-14');
    /* Đợt 2 của cùng khoá cũng ở tuần 14/09: dời đợt 1 sang 21/09 là vượt qua đợt kế tiếp → setSkillWeek chặn. */
    taoLuot(cycleId, sid, 2, 'final', '2026-09-14');
    assertThrows(() => regular.reportRegularNoShow(P.normalSubjectTeacher, attemptId, k, true, '2026-09-16'),
      /vượt qua lượt kế tiếp/, 'Dời lịch bị chặn thì cả lần ghi dấu phải thất bại');
    const sc = dauCua(attemptId, k);
    assert(!sc || !sc.no_show_period_id, 'Không còn dòng dấu "-" mồ côi sau khi dời thất bại');
    assert(tuanCuaMon(skillSched.loadSkillRows([attemptId]).get(attemptId), k) === '2026-09-14', 'Lịch giữ nguyên');
  });

  check('PR-Rc1 · C08 Quyền: GVBM môn khác không ghi được "-"; Quản trị hệ thống ghi được; Quản lý ghi được (PR-XLMT: chủ sản phẩm chốt 29/09)', () => {
    const { attemptId } = taoBaiThuong('2026-09-14');
    const khong = BON_MON.find((k) => !monCuaGv.includes(k));
    assert(khong, `Seed: GVBM của MB FOU 12 dạy cả bốn môn (${monCuaGv.join(', ')}) — không còn môn nào để đối chứng`);
    assertThrows(() => regular.reportRegularNoShow(P.normalSubjectTeacher, attemptId, khong, true, '2026-09-16'),
      /phân công|quyền/, 'Môn không dạy thì không ghi được');
    assert(!dauCua(attemptId, khong!)?.no_show_period_id, 'Bị chặn thì không có dấu nào được ghi');
    assert(regular.reportRegularNoShow(P.mbManager, attemptId, 'speaking', true, '2026-09-16').moved,
      'Quản lý sửa điểm được ở mọi lúc (đường override) nên ghi được "-"');
    const r = regular.reportRegularNoShow(P.admin, attemptId, khong!, true, '2026-09-16');
    assert(r.moved, 'Quản trị hệ thống ghi được (đường nhập bù score.override) và dời được lịch');
  });

  check('PR-Rc1 · §6 Máy chủ KHÔNG còn câu "Lớp Normal không dùng dấu"', () => {
    assert(!/không dùng dấu/.test(String(attempts.saveScore)), 'Câu chặn cũ phải biến mất khỏi saveScore');
  });

  check('PR-Rc1 · §6 Lưới FT KHÔNG mở được cho lớp thường; endpoint chung trả đúng loại lưới', () => {
    const lopThuong = classId('MB FOU 12');
    const lopFT = classId('MB FT 101');
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
    /* Giữa khoá: trượt Listening → TỰ TẠO Case Listening (PR-LT2a). Quản lý không nhập điểm — dùng đường nhập bù của Quản trị. */
    for (const [k, s] of [['listening', 10], ['reading', 35], ['writing', 16], ['speaking', 8]] as const) {
      regular.saveRegularScore(P.admin, attemptId, k, { score: s, total: k === 'writing' ? 20 : k === 'speaking' ? 10 : 40 });
    }
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
    const sheet = regular.regularSheet(P.mbManager, classId('MB FOU 12'));
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
    const baoCase = (extra: Record<string, unknown>) => casesSvc.reportIssue(P.normalCoreTeacher, {
      studentId: a.student_id, topic: 'listening', title: 'Listening dưới ngưỡng (PR-Rc1)',
      summary: 'Đã xem lại bài, em vướng đúng phần nghe này của môn.',
      primaryCode: d.issuesForTopic('listening')[0].code, ...extra,
    }) as any;
    /* Case CŨ của môn này đã xong (như Case nhập bù — đóng ngay lúc tạo), rồi một Case MỚI đang mở cùng môn, cùng khoá. */
    const cu = conn.prepare(`SELECT id FROM sos_cases WHERE student_id = ? AND topic = 'listening' AND status != 'done' ORDER BY id DESC LIMIT 1`).get(a.student_id) as any;   // Case Progress Test tự tạo
    assert(cu, 'Progress Test trượt Listening phải tự tạo Case');
    conn.prepare(`UPDATE sos_cases SET status = 'done' WHERE id = ?`).run(cu.id);
    const moi = baoCase({ cycleId });
    assert(moi.id > cu.id, 'Case mới có id lớn hơn');
    const moiRow: any = conn.prepare('SELECT status FROM sos_cases WHERE id = ?').get(moi.id);
    assert(moiRow.status !== 'done', 'Case mới đang mở');
    const dong = regular.regularSheet(P.mbManager, classId('MB FOU 12')).rows.find((r: any) => r.attemptId === attemptId);
    assert(dong.cases.length === 2, `Dòng thấy cả hai Case của môn: ${dong.cases.length}`);
    assert(dong.cases[0].id === moi.id && dong.cases[0].status !== 'done',
      `Case đầu tiên phải là Case đang mở: #${dong.cases[0].id} (${dong.cases[0].status})`);
    assert(dong.caseId === moi.id && dong.caseStatus === moiRow.status, `Trường cũ lấy Case đang mở: ${dong.caseStatus}`);
  });

  /*
   * RB-5 dùng một lượt Mock của lớp demo MB FT 101 — chọn lượt GHI ĐƯỢC (chưa huỷ, L và R đều trong phạm vi, chưa bị
   * ghi vắng/huỷ phần thi), không lấy "lượt đầu tiên" theo thứ tự seed. Mỗi phép kiểm tự xoá ô của mình trước khi ghi,
   * nên không phụ thuộc điểm mà bộ demo đã có.
   */
  function luotFtGhiDuoc(boQua: number[] = []): number {
    const ds = conn.prepare(
      `SELECT id FROM assessment_attempts WHERE kind = 'mock' AND class_id = ? AND status != 'cancelled' ORDER BY id`,
    ).all(classId('MB FT 101')) as any[];
    for (const { id } of ds) {
      if (boQua.includes(id)) continue;
      const rows = skillSched.ensureSkillRows(id) as any[];
      const ok = ['listening', 'reading'].every((k) => {
        const r = rows.find((x: any) => x.skill === k);
        return r && r.required && r.sit_status !== 'cancelled' && r.sit_status !== 'absent';
      });
      if (ok) return id;
    }
    throw new Error('Seed: MB FT 101 không còn lượt Mock nào ghi được L và R');
  }
  const xoaO = (attemptId: number, k: string) =>
    conn.prepare('DELETE FROM assessment_scores WHERE attempt_id = ? AND skill = ?').run(attemptId, k);

  // PR-MTa T7 thay RB-5: sửa ô đã có điểm — lý do TUỲ CHỌN; có lý do thì vẫn vào nhật ký / lịch sử điểm.
  check('PR-Rc1 · RB-5 Sửa ô đã có điểm: lý do tuỳ chọn (PR-MTa T7); lý do ghi thì vào lịch sử điểm', () => {
    const { attemptId } = taoBaiThuong('2026-09-14');
    /* Quản lý không nhập điểm (Ruling 1) — đường nhập bù của Quản trị hệ thống. */
    regular.saveRegularScore(P.admin, attemptId, 'listening', { score: 30, total: 40 });
    regular.saveRegularScore(P.admin, attemptId, 'listening', { score: 32, total: 40 });
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
    attempts.saveScore(P.admin, ft, 'listening', { rawScore: 32 });   // PR-MTa T7: sửa không lý do được
    attempts.saveScore(P.admin, ft, 'listening', { rawScore: 31, lyDo: 'Chấm lại phần 3' });
    const h = attempts.scoreHistoryOf(ft);
    assert(h.some((x: any) => x.lyDo === 'Chấm lại phần 3'), 'Lịch sử điểm hiện lý do');
  });

  /* PR-MTa T22 thay "xoá điểm cũng phải có lý do": xoá trắng ô đã có điểm = xoá, lý do tuỳ chọn. */
  check('PR-Rc1 · RB-5 Không đòi lý do khi ô đang trống; xoá điểm đã có cũng không đòi (T22)', () => {
    const ft = luotFtGhiDuoc();
    xoaO(ft, 'reading');
    attempts.saveScore(P.admin, ft, 'reading', { rawScore: 28 });   // lần đầu: không cần lý do
    attempts.saveScore(P.admin, ft, 'reading', { rawScore: null });
    const { attemptId } = taoBaiThuong('2026-09-14');
    regular.saveRegularScore(P.admin, attemptId, 'reading', { score: 20, total: 40 });
    regular.saveRegularScore(P.admin, attemptId, 'reading', { score: null });
    assert(dauCua(attemptId, 'reading')?.raw_score == null, 'Lớp thường: xoá không lý do');
  });

  check('PR-Rc1 · RB-5 Ghi lại đúng con số cũ (tự lưu) hay chỉ sửa ghi chú thì không đòi lý do', () => {
    const { attemptId } = taoBaiThuong('2026-09-14');
    regular.saveRegularScore(P.admin, attemptId, 'writing', { score: 15, total: 20 });
    const lai = regular.saveRegularScore(P.admin, attemptId, 'writing', { score: 15, total: 20 });
    assert((lai.score as any).raw_score === 15, 'Lớp thường: lưu lại cùng điểm không bị chặn');
    /* PR-MTa T7 thay RB-5: đổi tổng câu (sửa điểm) — lý do tuỳ chọn. */
    assert((regular.saveRegularScore(P.admin, attemptId, 'writing', { score: 15, total: 25 }).score as any).raw_total === 25, 'Lớp thường: đổi tổng câu');

    const ft = luotFtGhiDuoc();
    xoaO(ft, 'listening');
    attempts.saveScore(P.admin, ft, 'listening', { rawScore: 25 });
    attempts.saveScore(P.admin, ft, 'listening', { rawScore: 25 });
    attempts.saveScore(P.admin, ft, 'listening', { note: 'Em làm bài đủ giờ' });
    const o: any = dauCua(ft, 'listening');
    assert(o.raw_score === 25 && o.note === 'Em làm bài đủ giờ', 'Fast Track: lưu lại cùng điểm và sửa ghi chú không bị chặn');
  });

  // ---------------------------------------------------------------- Lịch Test (PR-UX1: gộp Cần chấm vào đây)
  const TRANG_THAI = /^(Đã chấm xong|Chưa đến lịch|Còn \d+ bài|Quá hạn · còn \d+ bài)$/;
  const { ensurePeriod } = await import('../platform/week.ts');
  const tuanId = (weekStart: string): number => ensurePeriod(weekStart).id;
  const TUAN_NAY = d.mondayOfDate(TODAY);
  const TUAN_TRUOC = t.addDays(TUAN_NAY, -7);
  /* PR-LT3: khối 1 "Test quá hạn chấm" chỉ nhận ô thi TỪ HAI TUẦN TRƯỚC và đã quá hạn (theo hôm nay, không theo tuần xem) —
     phép kiểm dòng Nợ dựng bài ở HAI_TRUOC / BA_TRUOC (lớp thường hạn thứ Tư tuần sau tuần thi: cả hai đã quá hạn). */
  const HAI_TRUOC = t.addDays(TUAN_NAY, -14);
  const BA_TRUOC = t.addDays(TUAN_NAY, -21);
  /** Các dòng kỹ năng của một lớp — lớp thường có thể nhiều hàng (một hàng mỗi bài, Q9). */
  const dongCuaLop = (r: any, code: string) => r.lop.filter((l: any) => l.classCode === code).flatMap((l: any) => l.dong);

  check('PR-UX1 · Nợ tuần trước: một dòng = lớp + đợt + tuần, chỉ tuần trước tuần đang xem', () => {
    taoBaiThuong(TUAN_TRUOC);   // chắc chắn có ít nhất một dòng lớp thường nợ tuần trước
    const r = cham.lichTest(P.mbManager, tuanId(TUAN_NAY), null, TODAY, { phamVi: 'tat-ca' });
    assert(r.tuan && r.tuan.weekStart === TUAN_NAY, `Tuần đang xem: ${JSON.stringify(r.tuan)}`);
    const no = r.no;
    assert(no.length > 0, 'Seed: phải có bài nợ tuần trước');
    assert(no.every((x: any) => x.weekStart && x.weekStart < TUAN_NAY), 'Chỉ ô có tuần thi trước tuần đang xem');
    assert(no.every((x: any) => x.conBai > 0), 'Không có dòng nào "còn 0 bài"');
    assert(new Set(no.map((x: any) => x.key)).size === no.length, 'Khoá dòng không trùng');
    for (const x of no) {
      assert(x.key === `${x.classId}:${x.kind}:${x.attemptNo ?? 0}:${x.periodId ?? 0}`, `Khoá = lớp + đợt + tuần: ${x.key}`);
      assert(x.attemptIds.length >= x.soHv && x.soHv > 0, `Dòng ${x.key}: có em, có lượt`);
      assert(x.hrefDayDu.startsWith(`/nhap-diem/${x.classId}`), `Mở lưới đầy đủ: ${x.hrefDayDu}`);
      assert(x.quaHan === (!!x.han && x.han < TODAY), `Quá hạn theo hạn sớm nhất: ${x.key}`);
    }
    const thuong = no.filter((x: any) => x.mode === 'ratio');
    assert(thuong.length > 0, 'Phải có ít nhất một dòng lớp thường để kiểm tên đợt');
    for (const x of thuong) {
      assert(!/MT/.test(x.dotLabel), `Lớp thường không gọi đợt là MT: ${x.dotLabel}`);
      assert(['Progress Test', 'Final Test'].includes(x.dotLabel), x.dotLabel);
    }
    /* PR-UXF-a (UX-F7): nhóm theo LỚP; trong mỗi lớp, quá hạn xếp trước. */
    for (const cid of new Set(no.map((x: any) => x.classId))) {
      const cuaLop = no.filter((x: any) => x.classId === cid);
      const dauChuaQua = cuaLop.findIndex((x: any) => !x.quaHan);
      assert(dauChuaQua === -1 || cuaLop.slice(dauChuaQua).every((x: any) => !x.quaHan), 'Trong lớp: dòng quá hạn đứng trước');
      const dau = no.findIndex((x: any) => x.classId === cid);
      assert(no.slice(dau, dau + cuaLop.length).every((x: any) => x.classId === cid), 'Dòng của một lớp đứng liền nhau');
    }
    assert(r.tongQuan.no.bai === no.reduce((n: number, x: any) => n + x.conBai, 0), 'Số nợ = cộng các dòng');
    assert(r.tongQuan.no.lop === new Set(no.map((x: any) => x.classId)).size, 'Số lớp nợ = số lớp khác nhau');
    /* Quản lý không dạy lớp nào: không có dòng "của tôi". */
    assert(no.every((x: any) => !x.cuaToi && !x.coDayLop), 'Quản lý không có bài "của mình"');
  });

  check('PR-UX1 · Lịch Test lọc theo lớp thì nói rõ đang lọc lớp nào (cả Nợ lẫn danh sách)', () => {
    const cid = classId('MB FT 101');
    const r = cham.lichTest(P.mbManager, tuanId(TUAN_NAY), null, TODAY, { classId: cid });
    assert(r.lopDangLoc && r.lopDangLoc.id === cid && r.lopDangLoc.code === 'MB FT 101', 'Trả về lớp đang lọc để hiện chip');
    assert(r.lop.every((l: any) => l.classId === cid), 'Danh sách chỉ còn lớp đó');
    assert(r.no.every((x: any) => x.classId === cid), 'Khối Nợ chỉ còn lớp đó');
    assert(cham.lichTest(P.mbManager, tuanId(TUAN_NAY), null, TODAY).lopDangLoc === null, 'Không lọc thì không có chip');
    /* Lớp ngoài phạm vi (chi nhánh CP, người xem là Quản lý MB): không lộ mã lớp qua chip. */
    const ngoai = cham.lichTest(P.mbManager, tuanId(TUAN_NAY), null, TODAY, { classId: classId('CP FT 110') });
    assert(ngoai.lopDangLoc === null, `Lớp ngoài phạm vi phải trả null: ${JSON.stringify(ngoai.lopDangLoc)}`);
    assert(ngoai.lop.length === 0 && ngoai.no.length === 0, 'Lớp ngoài phạm vi thì không có dòng nào');
  });

  check('PR-Rc1 · Q14 Lịch Test nhóm theo lớp và lọc theo tuần của CHÍNH môn', () => {
    const { attemptId } = taoBaiThuong('2026-09-14');
    const tuan: any = conn.prepare('SELECT id FROM report_periods WHERE week_start = ?').get('2026-09-14');
    const r = cham.lichTest(P.mbManager, tuan.id, null, TODAY);
    const dong = dongCuaLop(r, 'MB FOU 12');
    assert(dong.length, 'Lớp có bài trong tuần phải xuất hiện');
    assert(dong.every((x: any) => x.soHv > 0), 'Mỗi dòng có số học viên');
    const tatCa = r.lop.flatMap((l: any) => l.dong);
    assert(tatCa.every((x: any) => TRANG_THAI.test(x.trangThai)), `Câu trạng thái lạ: ${tatCa.map((x: any) => x.trangThai).join(' | ')}`);
    for (const l of r.lop.filter((x: any) => x.mode === 'ielts_band')) {
      assert(l.dong.every((x: any) => x.href.includes(`periodId=${tuan.id}`)), 'Lớp FT mở lưới đúng tuần đang xem');
      assert(l.hrefDayDu === `/nhap-diem/${l.classId}?periodId=${tuan.id}`, `Lưới đầy đủ FT: ${l.hrefDayDu}`);
    }
    /* Lớp thường: link kèm `kn` = môn của dòng, không kèm periodId. */
    for (const x of dong) {
      const q = new URLSearchParams(x.href.split('?')[1] ?? '');
      assert(q.get('kn') === x.kyNang[0] && !q.has('periodId'), `Dòng lớp thường phải mang kn=${x.kyNang[0]}: ${x.href}`);
    }
    /* Dời Listening sang tuần sau rồi thì tuần 14/09 không còn Listening của em này, tuần 21/09 thì có. Ghi "-" dùng
       Quản trị hệ thống (Ruling 1: Quản lý không ghi điểm). */
    regular.reportRegularNoShow(P.admin, attemptId, 'listening', true, '2026-09-16');
    const sau: any = conn.prepare('SELECT id FROM report_periods WHERE week_start = ?').get('2026-09-21');
    const r2 = cham.lichTest(P.mbManager, sau.id, null, TODAY);
    assert(dongCuaLop(r2, 'MB FOU 12').some((x: any) => x.kyNang.includes('listening')), 'Môn đã dời hiện ở tuần mới');
    const r3 = cham.lichTest(P.mbManager, tuan.id, null, TODAY);
    const nghe = (x: any) => dongCuaLop(x, 'MB FOU 12')
      .filter((y: any) => y.kyNang.includes('listening')).reduce((n: number, y: any) => n + y.soHv, 0);
    assert(nghe(r3) === nghe(r) - 1, `Tuần cũ bớt đúng một em Listening: ${nghe(r)} → ${nghe(r3)}`);
  });

  /* PR-LT3: khối 1 (quá hạn) — ô của BA_TRUOC và HAI_TRUOC đều ở đây, mỗi tuần một dòng; nhìn từ tuần nào cũng như nhau. */
  const dongNo = (p: any, key: string) =>
    cham.lichTest(p, tuanId(TUAN_NAY), null, TODAY, { classId: LOP, phamVi: 'tat-ca' }).no.find((x: any) => x.key === key);

  check('PR-UX1 · Nợ: môn lùi lịch nói rõ lùi của ai, từ tuần nào sang tuần nào; chấm một ô thì bớt đúng một bài', () => {
    /* Đợt ở BA_TRUOC: môn dời sang tuần sau rơi vào HAI_TRUOC — cả hai tuần đã quá hạn nên cùng ở khối 1 (PR-LT3). */
    const { sid, cycleId } = taoBaiThuong(BA_TRUOC);
    /* Đợt riêng (số 7) cho em này để dòng của lớp + đợt chỉ có đúng một em — kết quả xác định. */
    const aid = taoLuot(cycleId, sid, 7, 'progress', BA_TRUOC);
    const ten = (conn.prepare('SELECT full_name FROM students WHERE id = ?').get(sid) as any).full_name;
    const kTruoc = `${LOP}:progress:7:${tuanId(BA_TRUOC)}`;
    const kNay = `${LOP}:progress:7:${tuanId(HAI_TRUOC)}`;
    const truoc = dongNo(P.admin, kTruoc);
    assert(truoc && truoc.luiLich === null, 'Chưa dời gì thì không có dòng "lùi lịch"');
    assert(truoc.attemptIds.join() === String(aid), 'Dòng chỉ có lượt của em này');
    regular.reportRegularNoShow(P.admin, aid, 'listening', true, TODAY);
    const d1 = dongNo(P.admin, kNay);
    assert(d1 && d1.luiLich, 'Môn đã dời sang tuần này phải có "lùi lịch"');
    assert(d1.luiLich.kyNang === 'listening', `Đúng môn: ${d1.luiLich.kyNang}`);
    assert(d1.luiLich.hv.length === 1 && d1.luiLich.hv[0] === ten, `Đúng tên em: ${d1.luiLich.hv.join(', ')}`);
    assert(d1.luiLich.tuTuanStart === BA_TRUOC && d1.luiLich.sangTuanStart === HAI_TRUOC,
      `Từ ${BA_TRUOC} sang ${HAI_TRUOC}: ${d1.luiLich.tuTuanStart} → ${d1.luiLich.sangTuanStart}`);
    assert(d1.kyNang.includes('listening'), 'Môn lùi vẫn là việc phải chấm');
    assert(d1.luiLich.tuTuan && d1.luiLich.sangTuan && d1.luiLich.tuTuan !== d1.luiLich.sangTuan, 'Có mã hai tuần');
    /* PR-LT3 (thay "ô của tuần đang xem không nằm trong khối Nợ"): khối 1 không theo tuần đang xem — xem tuần của ô vẫn thấy dòng đó. */
    const tuO = cham.lichTest(P.admin, tuanId(HAI_TRUOC), null, TODAY, { classId: LOP, phamVi: 'tat-ca' });
    assert(tuO.no.some((x: any) => x.key === kNay), 'Khối 1 giữ nguyên khi xem tuần khác');
    const c1 = dongNo(P.admin, kTruoc).conBai;
    regular.saveRegularScore(P.admin, aid, 'reading', { score: 30, total: 40 });
    const c2 = dongNo(P.admin, kTruoc).conBai;
    assert(c2 === c1 - 1, `Bớt đúng một bài: ${c1} → ${c2}`);
  });

  check('PR-Rc1 · Q15 Lịch tách tuần theo KẾ HOẠCH không phải "lùi lịch"; chỉ dấu "-" (hay dời do vắng) mới là lùi', () => {
    const { sid, cycleId } = taoBaiThuong(BA_TRUOC);
    const aid = taoLuot(cycleId, sid, 8, 'progress', BA_TRUOC);
    /* Xếp riêng Speaking sang tuần sau bằng đường xếp lịch thường — đúng như một kế hoạch tách tuần (PR-LT3: hai tuần đều ở khối 1). */
    skillSched.setSkillWeek(P.admin, aid, 'speaking', tuanId(HAI_TRUOC), { reason: 'Kế hoạch tách tuần', force: true });
    const kNay = `${LOP}:progress:8:${tuanId(HAI_TRUOC)}`;
    const a1 = dongNo(P.admin, kNay);
    assert(a1 && a1.kyNang.includes('speaking'), 'Speaking ở tuần này vẫn là việc phải chấm');
    assert(a1.luiLich === null, `Tách tuần theo kế hoạch KHÔNG phải lùi lịch: ${JSON.stringify(a1.luiLich)}`);
    regular.reportRegularNoShow(P.admin, aid, 'listening', true, TODAY);
    const a2 = dongNo(P.admin, kNay);
    assert(a2.luiLich && a2.luiLich.kyNang === 'listening', `Dấu "-" thì là lùi lịch: ${JSON.stringify(a2.luiLich)}`);
    assert(a2.luiLich.tuTuanStart === BA_TRUOC && a2.luiLich.sangTuanStart === HAI_TRUOC, 'Tuần cũ = tuần ghi dấu "-"');
  });

  check('PR-UX1 · Nợ của GVBM gồm cả môn người khác; "Chờ bạn chấm" chỉ khi còn môn của mình (Q3)', () => {
    const khac = BON_MON.filter((k) => !monCuaGv.includes(k));
    assert(monCuaGv.length > 0 && khac.length > 0, `Seed: GVBM dạy một phần môn (${monCuaGv.join(', ')})`);
    /* Bài 9: chấm hết môn của GVBM → chỉ còn môn người khác. Bài 10: chấm hết môn người khác → chỉ còn môn GVBM. */
    const { sid, cycleId } = taoBaiThuong(HAI_TRUOC);   // PR-LT3: khối 1 (quá hạn)
    const a9 = taoLuot(cycleId, sid, 9, 'progress', HAI_TRUOC);
    const a10 = taoLuot(cycleId, sid, 10, 'progress', HAI_TRUOC);
    for (const k of monCuaGv) regular.saveRegularScore(P.admin, a9, k, { score: 30, total: 40 });
    for (const k of khac) regular.saveRegularScore(P.admin, a10, k, { score: 30, total: 40 });
    const r = cham.lichTest(P.normalSubjectTeacher, tuanId(TUAN_NAY), null, TODAY, { classId: LOP });
    const d9 = r.no.find((x: any) => x.key === `${LOP}:progress:9:${tuanId(HAI_TRUOC)}`);
    const d10 = r.no.find((x: any) => x.key === `${LOP}:progress:10:${tuanId(HAI_TRUOC)}`);
    assert(d9 && d9.kyNang.every((k: string) => khac.includes(k)), `GVBM vẫn thấy dòng môn người khác: ${d9?.kyNang}`);
    assert(d9.cuaToi === false && d9.duocCham === false && d9.coDayLop === true, 'Dòng môn người khác → "Xem", "Chờ GV khác"');
    assert(d10 && d10.cuaToi === true && d10.duocCham === true, 'Dòng toàn môn của GVBM → "Chấm", "Chờ bạn chấm"');
    for (const x of r.no) {
      assert(x.cuaToi === x.kyNang.some((k: string) => monCuaGv.includes(k)), `cuaToi theo môn được phân công: ${x.key}`);
    }
  });

  check('PR-UX1 · Dải số Lịch Test = cộng các hàng, không tự tính riêng', () => {
    for (const [ten, p] of [['QL', P.mbManager], ['GVCN', P.coreTeacher], ['GVBM', P.normalSubjectTeacher]] as const) {
      const r = cham.lichTest(p, tuanId(TUAN_NAY), null, TODAY);
      const q = r.tongQuan;
      /* PR-LT3 Q1: tuần hiện tại — đã chấm / còn phải chấm cộng khối 2 + khối 3; ô "Quá hạn" cũ bỏ (khối 1 toàn quá hạn). */
      const hang = [...(r.chamTuanNay ?? []), ...r.lop];
      assert(q.tong === hang.reduce((n: number, l: any) => n + l.tong, 0), `${ten}: tổng = cộng các hàng`);
      assert(q.daCham + q.conPhaiCham === q.tong, `${ten}: đã chấm + còn phải chấm = tổng`);
      assert(q.conPhaiCham === hang.reduce((n: number, l: any) => n + l.conBai, 0), `${ten}: còn phải chấm = cộng các hàng`);
      assert(r.no.every((x: any) => x.quaHan), `${ten}: khối 1 chỉ có dòng quá hạn`);
      for (const l of hang) {
        assert(l.daCham === l.tong - l.conBai, `${ten} ${l.key}: đã chấm = tổng − còn`);
        assert(l.conBaiCuaToi <= l.conBai, `${ten} ${l.key}: bài của tôi ≤ bài còn lại`);
        /* PR-MON: môn tuần thuộc bộ môn của lớp (FT 4 kỹ năng đánh giá; Pre FOU `tong_hop`). */
        assert(l.kyNangTuan.every((k: string) => l.boMon.includes(k)), `${ten} ${l.key}: kỹ năng tuần là môn đánh giá`);
      }
    }
  });

  const classSvc: any = await import('../classes/classes.ts');
  check('PR-UX1 (rà #92) · Lớp FT: Writing = W1 + W2 (tổng ba khối = badge: PR-LT3 (d))', () => {
    const tom = classSvc.listClassSummaries(P.mbManager, { scope: 'managed' });
    const ds = (Array.isArray(tom) ? tom : tom.classes ?? tom.rows ?? []) as any[];
    const ft = ds.filter((c: any) => c.scoringMode !== 'ratio' && c.needScores !== undefined);
    assert(ft.length > 0, `Seed: phải có lớp FT trong phạm vi QL MB (${Object.keys(tom)})`);
    let coViet = false;
    for (const c of ft) {
      const r = cham.lichTest(P.mbManager, tuanId(TUAN_NAY), null, TODAY, { classId: c.id, phamVi: 'tat-ca' });
      for (const l of r.lop) {
        const w = l.dong.filter((x: any) => x.kyNang.includes('writing'));
        if (w.length) coViet = true;
        /* Writing FT: mỗi em hai bài (W1, W2) — dòng kỹ năng đếm bài, không đếm em. */
        for (const x of w) assert(x.conBai <= 2 * x.soHv, `${c.code} ${x.key}: ${x.conBai} bài > 2 × ${x.soHv} em`);
      }
    }
    assert(coViet, 'Seed: phải có lớp FT thi Writing tuần này để kiểm W1 + W2');
    /* Tổng số bài của tuần: Writing FT tính hai bài mỗi em. */
    const r = cham.lichTest(P.mbManager, tuanId(TUAN_NAY), null, TODAY, { classId: classId('MB FT 101'), phamVi: 'tat-ca' });
    const l = r.lop[0];
    const soO = l.dong.reduce((n: number, x: any) => n + x.soHv * (x.kyNang.includes('writing') ? 2 : 1), 0);
    assert(l.tong === soO, `MB FT 101: tổng ${l.tong} ≠ số ô nhập ${soO}`);
  });

  check('PR-UX1 · Lớp tôi dạy: GV chỉ lớp có phân công, không có nút khi hai tập như nhau; QL mặc định Tất cả', () => {
    const gv = cham.lichTest(P.coreTeacher, tuanId(TUAN_NAY), null, TODAY);
    const lopGv = new Set(P.coreTeacher.assignments.map((a: any) => a.classId));
    assert(gv.coPhanCong === true && gv.phamVi === 'cua-toi', `GVCN mặc định Lớp tôi dạy: ${gv.phamVi}`);
    assert(gv.coPhamViRong === false, 'GV thuần: hai lựa chọn như nhau → không có nút');
    assert(gv.lop.every((l: any) => lopGv.has(l.classId)) && gv.no.every((x: any) => lopGv.has(x.classId)), 'Chỉ lớp được phân công');
    const ql = cham.lichTest(P.mbManager, tuanId(TUAN_NAY), null, TODAY, { phamVi: 'cua-toi' });
    assert(ql.coPhanCong === false && ql.phamVi === 'tat-ca', `QL không dạy lớp nào → luôn Tất cả: ${ql.phamVi}`);
    assert(ql.lop.length > 0, 'QL thấy lớp');
    assert(ql.lop.every((l: any) => !['cho-ban', 'cho-gv-khac'].includes(l.nhan.loai)), 'QL không có nhãn "của ai"');
  });

  check('PR-UX1 · Nhãn + tự mở theo người xem; lớp thường hai bài cùng tuần → hai hàng', () => {
    const pid = tuanId(TUAN_TRUOC);
    const hang = (p: any) => cham.lichTest(p, pid, null, TODAY, { classId: LOP }).lop.find((l: any) => l.key === `${LOP}:progress`);
    const gv = hang(P.normalSubjectTeacher);
    const ql = hang(P.mbManager);
    assert(gv && ql, 'Lớp thường có bài Progress Test tuần trước');
    assert(gv.conBaiCuaToi > 0, 'Seed của phép trên: GVBM còn bài của mình');
    assert(gv.nhan.loai === 'cho-ban' && gv.nhan.chu === 'Chờ bạn chấm' && gv.moSan, `GVBM: ${gv.nhan.chu}, moSan ${gv.moSan}`);
    assert(ql.nhan.loai === 'cho-cham' && ql.moSan, `QL: ${ql.nhan.chu}, moSan ${ql.moSan}`);
    assert(ql.conBai === gv.conBai, 'Cùng một hàng thì cùng số bài còn lại, chỉ khác nhãn');
    /* Hai bài (Giữa khoá + Cuối khoá) của lớp thường cùng một tuần → hai hàng `classId:kind`. */
    const { sid, cycleId } = taoBaiThuong(TUAN_TRUOC);
    taoLuot(cycleId, sid, 11, 'final', TUAN_TRUOC);
    const r = cham.lichTest(P.mbManager, pid, null, TODAY, { classId: LOP });
    const keys = r.lop.map((l: any) => l.key);
    assert(keys.includes(`${LOP}:progress`) && keys.includes(`${LOP}:final`), `Hai hàng: ${keys.join(', ')}`);
    assert(r.lop.find((l: any) => l.key === `${LOP}:final`).hrefDayDu === `/nhap-diem/${LOP}?kind=final`, 'Lưới đầy đủ đúng bài');
    assert(r.lop.find((l: any) => l.key === `${LOP}:final`).dotLabel === 'Final Test', 'Tên đợt lớp thường');
  });

  check('PR-Rc1 · Q14 Lịch Test: tuần chưa tới là "Chưa đến lịch"; em vắng không được đếm vào dòng', () => {
    const tuanXa = t.addDays(d.mondayOfDate(TODAY), 9 * 7);
    const { attemptId } = taoBaiThuong(tuanXa);
    const pid = (conn.prepare('SELECT id FROM report_periods WHERE week_start = ?').get(tuanXa) as any).id;
    const lopOf = () => cham.lichTest(P.mbManager, pid, null, TODAY).lop.find((l: any) => l.key === `${LOP}:progress`);
    const l1 = lopOf();
    assert(l1 && l1.dong.length > 0, 'Bài ở tuần sau phải hiện ở Lịch Test của tuần đó');
    assert(l1.dong.every((x: any) => x.trangThai === 'Chưa đến lịch'), l1.dong.map((x: any) => x.trangThai).join(' | '));
    assert(l1.nhan.loai === 'chua-toi-han' && !l1.moSan, 'Tuần chưa tới: nhãn "Chưa đến lịch", không tự mở');
    const truoc = l1.dong.find((x: any) => x.kyNang.includes('reading')).soHv;
    conn.prepare(`UPDATE attempt_skills SET sit_status = 'absent' WHERE attempt_id = ? AND skill = 'reading'`).run(attemptId);
    const sau = lopOf()?.dong.find((x: any) => x.kyNang.includes('reading'))?.soHv ?? 0;
    assert(sau === truoc - 1, `Em vắng Reading rời khỏi số em của dòng: ${truoc} → ${sau}`);
  });
}
