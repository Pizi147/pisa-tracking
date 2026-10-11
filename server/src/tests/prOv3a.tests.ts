/** PHÉP KIỂM PR-OV3a — ⋯ hồ sơ lớp cùng thứ tự hai loại lớp; Tổng hợp lớp thường chỉ hướng QL đã chốt; dòng "Đầu vào" FT chỉ để nhìn. */
import type { YThucTestKit } from './yThuc.tests.ts';

export async function runPrOv3aTests(t: YThucTestKit) {
  const { check, assert, conn, P } = t;
  const classes: any = await import('../classes/classes.ts');
  const phanTichLop: any = await import('../classes/phanTichLop.ts');
  const d: any = await import('../../../shared/domain/index.ts');
  const { xoaNho } = await import('../platform/nguCanhRequest.ts');
  console.log('\nPR-OV3a · hồ sơ lớp: ⋯, Tổng hợp, Đầu vào FT');

  const thu = <T>(fn: () => T): T => {
    conn.exec('BEGIN IMMEDIATE');
    try { return fn(); } finally { conn.exec('ROLLBACK'); xoaNho(); }
  };
  const all = (sql: string, ...a: unknown[]) => conn.prepare(sql).all(...a) as any[];
  const run = (sql: string, ...a: unknown[]) => conn.prepare(sql).run(...a);
  const QL = P.admin;
  const now = new Date().toISOString();

  check('OV3a-1 · menu ⋯: lớp thường và FT cùng thứ tự nhóm Lớp → Lộ trình → Công cụ → kết thúc; mục theo quyền', () => {
    const du = {
      soHocVien: 5, canEditProgress: true, canAssign: true, canAssignSubject: true, canAddStudents: true, coTheChuyenTiep: true,
      coTheChuyenNhieuEm: true, coTheXuatExcel: true, coTheMoLaiLop: false, coTheXoa: false, coTheKetThuc: true,
    };
    const thuong = d.menuHoSoLop({ ...du, thuong: true, chuongTrinh: 'BE' });
    const ft = d.menuHoSoLop({ ...du, thuong: false, chuongTrinh: 'FT' });
    const nhom = (m: any[]) => m.map((x) => x.nhom ?? '—').filter((x, i, a) => x !== a[i - 1]);
    assert(JSON.stringify(nhom(thuong)) === JSON.stringify(['Lớp', 'Lộ trình', 'Công cụ', '—']), `thường ${nhom(thuong)}`);
    assert(JSON.stringify(nhom(ft)) === JSON.stringify(nhom(thuong)), `FT ${nhom(ft)}`);
    assert(JSON.stringify(thuong.map((x: any) => x.nhan)) === JSON.stringify(
      ['Thông tin lớp', 'Sửa thông tin học viên', '+ Học viên', 'Lộ trình tiếp theo', 'Kỳ vọng đầu ra', 'Xuất Excel', 'Kết thúc lớp']), `thường ${thuong.map((x: any) => x.nhan)}`);
    assert(JSON.stringify(ft.map((x: any) => x.nhan)) === JSON.stringify(
      ['Thông tin lớp', 'Sửa thông tin học viên', '+ Học viên', 'Chuyển tiếp lớp', 'Xuất Excel', 'Kết thúc lớp']), `FT ${ft.map((x: any) => x.nhan)}`);
    const bo = ['Điểm Test cả lớp', 'Điểm MT cả lớp', 'Sửa phân công', 'Lịch Test của lớp', 'Tuần khai giảng', 'Sửa thông tin lớp'];
    assert(![...thuong, ...ft].some((x: any) => bo.includes(x.nhan) || x.nhan.endsWith('…')), 'mục cũ / dấu … còn sót');
    /* GVBM: không quyền gì của lớp → không mục nào; GVCN (chỉ đổi GV bộ môn) → chỉ Thông tin lớp. */
    const khong = { ...du, canEditProgress: false, canAssign: false, canAssignSubject: false, canAddStudents: false, coTheChuyenTiep: false, coTheChuyenNhieuEm: false, coTheXuatExcel: false, coTheKetThuc: false };
    assert(d.menuHoSoLop({ ...khong, thuong: true, chuongTrinh: 'BE' }).length === 0, 'GVBM không mục');
    assert(d.menuHoSoLop({ ...khong, canAssignSubject: true, thuong: false, chuongTrinh: 'FT' }).map((x: any) => x.key).join() === 'thong-tin', 'GVCN chỉ Thông tin lớp');
  });

  /* Lớp thường đang học có ≥ 3 em + một lớp FT cùng chi nhánh làm lớp đích. */
  const lop = all(`SELECT c.id, c.branch_id FROM classes c WHERE c.is_fast_track = 0 AND c.status = 'active' AND c.programme_code IN ('FOU', 'BE')
      AND (SELECT COUNT(*) FROM enrollments e WHERE e.class_id = c.id AND e.status = 'active') >= 3 ORDER BY c.id LIMIT 1`)[0];
  check('OV3a-2 · roster lớp thường: Lộ trình tiếp theo = hướng QL đã chốt (lệnh / quyết); hướng GVCN, lệnh huỷ, gợi ý tự tính không lọt', () => {
    assert(lop, 'cần một lớp thường FOU/BE ≥ 3 em');
    const ftDich = all(`SELECT id, code FROM classes WHERE is_fast_track = 1 AND branch_id = ? ORDER BY id LIMIT 1`, lop.branch_id)[0]
      ?? all(`SELECT id, code FROM classes WHERE is_fast_track = 1 ORDER BY id LIMIT 1`)[0];
    thu(() => {
      const [a, b, c] = all(`SELECT student_id AS id FROM enrollments WHERE class_id = ? AND status = 'active' ORDER BY student_id LIMIT 3`, lop.id).map((r) => r.id);
      run(`DELETE FROM lenh_chuyen_lop WHERE lop_nguon_id = ?`, lop.id);
      run(`DELETE FROM lo_trinh_tiep_theo WHERE class_id = ?`, lop.id);
      const ltt = `INSERT INTO lo_trinh_tiep_theo (student_id, class_id, huong, huong_gvcn, quyet_boi, quyet_luc, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
      run(ltt, a, lop.id, 'len_lop', 'len_lop', null, null, now, now);   // GVCN ghi, QL chưa chốt
      const lenh = `INSERT INTO lenh_chuyen_lop (student_id, lop_nguon_id, lop_dich_id, huong, boi_canh, tuan_bat_dau, nguoi_ra_lenh, ngay_ra_lenh, trang_thai, tao_luc)
        VALUES (?, ?, ?, ?, 'cuoi-khoa', '2026-11-16', ?, '2026-09-14', ?, ?)`;
      run(lenh, b, lop.id, ftDich.id, 'fast_track', QL.userId, 'cho', now);
      run(lenh, c, lop.id, ftDich.id, 'fast_track', QL.userId, 'huy', now);   // lệnh đã huỷ không phải "đã chốt"
      /* Chuyển lớp GIỮA khoá (hướng `chuyen_lop`) không phải lộ trình tiếp theo. */
      run(lenh.replace("'cuoi-khoa'", "'giua-khoa'"), a, lop.id, ftDich.id, 'chuyen_lop', QL.userId, 'cho', now);
      const r1 = classes.classRoster(QL, lop.id) as any[];
      const em = (id: number) => r1.find((r) => r.id === id);
      assert(em(a).loTrinhChot === null, `hướng GVCN / lệnh giữa khoá lọt: ${JSON.stringify(em(a).loTrinhChot)}`);
      assert(em(b).loTrinhChot?.nhan === 'Lên FT' && em(b).loTrinhChot.lopDich === ftDich.code && em(b).loTrinhChot.tuan === '2026-11-16',
        `lệnh chờ: ${JSON.stringify(em(b).loTrinhChot)}`);
      assert(em(c).loTrinhChot === null, `lệnh huỷ lọt: ${JSON.stringify(em(c).loTrinhChot)}`);
      assert(r1.every((r) => !r.cuoiKhoa || !('goiY' in r.cuoiKhoa)), 'gợi ý tự tính còn trong payload');
      /* Quyết khi chuyển tiếp (`quyet_*`), không lệnh → vẫn là đã chốt. */
      run(ltt, c, lop.id, 'hoc_lai', null, QL.userId, now, now, now);
      const ma = all(`SELECT programme_code AS ma FROM classes WHERE id = ?`, lop.id)[0].ma;
      const r2 = (classes.classRoster(QL, lop.id) as any[]).find((r) => r.id === c);
      assert(r2.loTrinhChot?.nhan === `Học lại ${d.kyHieuLop(ma, null)}` && r2.loTrinhChot.lopDich === null, `quyet_*: ${JSON.stringify(r2.loTrinhChot)}`);
    });
  });

  /* Em FT đang học, lộ trình chưa có MT0, có ít nhất một lượt (để so Overall / SOS trước–sau). */
  const ft = all(`SELECT e.student_id AS sid, e.class_id AS classId, cy.id AS cycleId FROM enrollments e JOIN classes c ON c.id = e.class_id AND c.is_fast_track = 1
      JOIN learning_cycles cy ON cy.student_id = e.student_id AND cy.status = 'active'
     WHERE e.status = 'active' AND NOT EXISTS (SELECT 1 FROM assessment_attempts a WHERE a.cycle_id = cy.id AND a.kind = 'mt0')
       AND EXISTS (SELECT 1 FROM assessment_attempts a WHERE a.cycle_id = cy.id AND a.status != 'cancelled') ORDER BY e.student_id LIMIT 1`)[0];
  check('OV3a-3 · FT: dòng "Đầu vào" khi chưa MT0 (chỉ Overall / từng kỹ năng), không có khi đã có MT0, không vào Overall / SOS / Phân tích', () => {
    assert(ft, 'cần một em FT chưa có MT0');
    thu(() => {
      const em = () => (classes.classRoster(QL, ft.classId) as any[]).find((r) => r.id === ft.sid);
      const tinh = (r: any) => JSON.stringify({ s: r.standing, sos: r.sosLevel, sc: r.scores, h: r.history, l: r.latest });
      run(`UPDATE learning_cycles SET baseline_attempt_id = NULL, baseline_score = NULL, baseline_listening = NULL, baseline_reading = NULL,
             baseline_writing = NULL, baseline_speaking = NULL WHERE id = ?`, ft.cycleId);
      const goc = em();
      const ptGoc = JSON.stringify(phanTichLop.phanTichLop(QL, ft.classId));
      assert(goc.dauVao === null, `chưa có điểm đầu vào thì không có dòng: ${JSON.stringify(goc.dauVao)}`);
      run(`UPDATE learning_cycles SET baseline_score = 4.5 WHERE id = ?`, ft.cycleId);
      const chiOvr = em();
      assert(JSON.stringify(chiOvr.dauVao) === JSON.stringify({ overall: 4.5, listening: null, reading: null, writing: null, speaking: null }), `chỉ Overall: ${JSON.stringify(chiOvr.dauVao)}`);
      run(`UPDATE learning_cycles SET baseline_score = 5, baseline_listening = 5, baseline_reading = 5.5, baseline_writing = 4.5, baseline_speaking = 5 WHERE id = ?`, ft.cycleId);
      const du = em();
      assert(du.dauVao?.reading === 5.5 && du.dauVao.writing === 4.5 && du.dauVao.overall === 5, `từng kỹ năng: ${JSON.stringify(du.dauVao)}`);
      assert(tinh(du) === tinh(goc), 'điểm đầu vào làm đổi Overall / SOS / lịch sử mốc');
      assert(JSON.stringify(phanTichLop.phanTichLop(QL, ft.classId)) === ptGoc, 'điểm đầu vào lọt vào Phân tích lớp');
      /* Đã có MT0 (từ lớp thường lên) → giữ dòng MT0, không dòng "Đầu vào". */
      const a = all(`SELECT id FROM assessment_attempts WHERE cycle_id = ? AND status != 'cancelled' ORDER BY attempt_no LIMIT 1`, ft.cycleId)[0];
      run(`UPDATE assessment_attempts SET kind = 'mt0' WHERE id = ?`, a.id);
      assert(em().dauVao === null, 'đã có MT0 mà vẫn có dòng Đầu vào');
    });
  });
}
