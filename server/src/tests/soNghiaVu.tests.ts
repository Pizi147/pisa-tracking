/**
 * PHÉP KIỂM SỔ NGHĨA VỤ (spec `docs/superpowers/specs/2026-11-09-so-nghia-vu-design.md`, plan `docs/superpowers/plans/2026-11-09-so-nghia-vu.md`).
 * Mỗi ca một trường hợp của spec mục 4; ca đổi dữ liệu chạy trong giao dịch rồi ROLLBACK.
 */
import type { YThucTestKit } from './yThuc.tests.ts';

export async function runSoNghiaVuTests(t: YThucTestKit) {
  const { check, assert, assertThrows, conn } = t as any;
  const { migratePrNghiaVu } = await import('../migrate/prNghiaVu.ts');
  const nv: any = await import('../phanTich/soNghiaVu.ts');
  const week: any = await import('../platform/week.ts');
  /* Seed nằm trước W4 OCT 2026: tắt mốc bắt đầu tính trễ cho mọi ca; ca kiểm mốc bật lại riêng. */
  if (nv.MOC_TINH_TRE) nv.MOC_TINH_TRE.ngay = '';
  console.log('\nSỔ NGHĨA VỤ — bảng, tính dòng, ghi sổ, đếm');
  const thu = <T>(fn: () => T): T => { conn.exec('BEGIN IMMEDIATE'); try { return fn(); } finally { conn.exec('ROLLBACK'); } };

  check('NV-BANG · migrate tạo bảng nghia_vu + chỉ mục (chi_nhanh, han), (nguoi, han); chạy lặp không lỗi; khoa duy nhất', () => thu(() => {
    migratePrNghiaVu(conn, []);
    migratePrNghiaVu(conn, []);
    const cot = (conn.prepare(`SELECT name FROM pragma_table_info('nghia_vu')`).all() as any[]).map((c) => c.name);
    for (const c of ['id', 'loai', 'kieu', 'khoa', 'chi_nhanh', 'lop', 'hoc_vien', 'nguoi', 's_cheo', 'han_goc', 'han', 'tuan', 'pc_nhap_sau', 'xong_luc', 'nguoi_lam', 'khong_tinh', 'cap_nhat']) {
      assert(cot.includes(c), `thiếu cột ${c}`);
    }
    const cm = (conn.prepare(`SELECT name FROM sqlite_master WHERE type = 'index' AND tbl_name = 'nghia_vu'`).all() as any[]).map((r) => r.name);
    assert(cm.includes('idx_nghia_vu_cn_han') && cm.includes('idx_nghia_vu_nguoi_han'), `chỉ mục: ${cm.join(', ')}`);
    const chen = () => conn.prepare(`INSERT INTO nghia_vu (loai, kieu, khoa, chi_nhanh, han_goc, han, cap_nhat) VALUES ('bai', 'listening', 'bai:1:listening', 1, '2026-10-01', '2026-10-01', '2026-10-01')`).run();
    chen();
    assertThrows(chen, /UNIQUE/i, 'khoa trùng phải lỗi');
    assertThrows(() => conn.prepare(`INSERT INTO nghia_vu (loai, kieu, khoa, chi_nhanh, han_goc, han, cap_nhat) VALUES ('x', 'k', 'x:1', 1, '2026-10-01', '2026-10-01', '2026-10-01')`).run(), /CHECK/i, 'loai lạ phải lỗi');
  }));

  // ------------------------------------------------------------------ Task 2 · tinhBai (một lượt → mọi ô bắt buộc)
  const get = (sql: string, ...a: unknown[]) => conn.prepare(sql).get(...a) as any;
  /** Ô L của một lượt Mock FT, em chỉ một ghi danh, em đang học, ô có tuần thi + chưa vắng / huỷ. */
  const oL = () => get(`SELECT a.id, a.student_id, a.class_id, k.planned_period_id AS ky FROM assessment_attempts a
      JOIN attempt_skills k ON k.attempt_id = a.id AND k.skill = 'listening' AND k.required = 1 AND k.sit_status NOT IN ('absent', 'cancelled') AND k.planned_period_id IS NOT NULL
      JOIN classes c ON c.id = a.class_id JOIN students s ON s.id = a.student_id
     WHERE a.kind = 'mock' AND c.is_fast_track = 1 AND a.status != 'cancelled' AND COALESCE(a.lich_su, 0) = 0 AND s.status = 'active' AND s.archived_at IS NULL
       AND (SELECT COUNT(*) FROM enrollments e WHERE e.student_id = a.student_id) = 1
       AND EXISTS (SELECT 1 FROM teacher_assignments ta WHERE ta.class_id = a.class_id AND ta.skill = 'listening')
     ORDER BY a.id LIMIT 1`);
  const dongL = (aid: number) => (nv.tinhBai(aid) as any[]).find((d) => d.kieu === 'listening');
  const gvLuc = (lop: number, skill: string, d: string) => get(`SELECT user_id FROM teacher_assignments WHERE class_id = ? AND skill = ? AND status IN ('active', 'ended')
      AND effective_from <= ? AND (effective_to IS NULL OR effective_to >= ?) ORDER BY id DESC LIMIT 1`, lop, skill, d, d)?.user_id ?? null;

  check('NV-BAI-THUONG · ô MT có phân công L → nguoi = GV L ở ngày hạn; han = mốc trễ; tuan = Thứ Hai tuần thi; khoa bai:<lượt>:<kỹ năng>', () => {
    const a = oL();
    assert(a, 'seed phải có ô L Mock FT');
    const d = dongL(a.id);
    assert(d && d.loai === 'bai' && d.khoa === nv.khoaBai(a.id, 'listening') && d.khoa === `bai:${a.id}:listening`, `dòng: ${JSON.stringify(d)}`);
    const tuan = get('SELECT week_start FROM report_periods WHERE id = ?', a.ky).week_start;
    assert(d.tuan === tuan && d.han === week.mocTreNhapDiem(d.han, tuan) && d.lop === a.class_id, `tuần / hạn / lớp: ${JSON.stringify(d)}`);
    assert(d.nguoi === gvLuc(a.class_id, 'listening', d.han) && d.nguoi != null && !d.pcNhapSau && !d.sCheo && d.khongTinh === null, `người: ${JSON.stringify(d)}`);
    assert(d.chiNhanh === get('SELECT branch_id FROM classes WHERE id = ?', a.class_id).branch_id, 'chi nhánh = chi nhánh lớp lúc thi');
  });

  check('NV-BAI-CHUA-PC · phân công nhập SAU hạn → GV phân công kế tiếp + cờ pcNhapSau; lớp + kỹ năng không có phân công nào → nguoi null, vẫn đếm', () => thu(() => {
    const a = oL();
    const truoc = dongL(a.id);
    conn.prepare(`UPDATE teacher_assignments SET effective_from = date(?, '+3 day') WHERE class_id = ? AND skill = 'listening'`).run(truoc.han, a.class_id);
    const sau = dongL(a.id);
    assert(sau.nguoi === truoc.nguoi && sau.pcNhapSau === true && sau.khongTinh === null, `phân công nhập sau: ${JSON.stringify(sau)}`);
    conn.prepare(`DELETE FROM teacher_assignments WHERE class_id = ? AND skill = 'listening'`).run(a.class_id);
    const rong = dongL(a.id);
    assert(rong.nguoi === null && !rong.pcNhapSau && rong.khongTinh === null, `không phân công: ${JSON.stringify(rong)}`);
  }));

  check('NV-BAI-SCHEO · S Mock chưa nhập → sCheo, nguoi null; đã nhập kèm GV chấm → người đó; tên ngoài → khongTinh nguoi-ngoai', () => thu(() => {
    const a = oL();
    const s = () => (nv.tinhBai(a.id) as any[]).find((d) => d.kieu === 'speaking');
    conn.prepare(`DELETE FROM assessment_scores WHERE attempt_id = ? AND skill = 'speaking'`).run(a.id);
    const chua = s();
    assert(chua && chua.sCheo === true && chua.nguoi === null && chua.xongLuc === null && chua.khongTinh === null, `chưa nhập: ${JSON.stringify(chua)}`);
    const gv = get(`SELECT id FROM users ORDER BY id LIMIT 1`).id;
    conn.prepare(`INSERT INTO assessment_scores (attempt_id, skill, band, nhap_dau_ngay, examiner_user_id, entered_by) VALUES (?, 'speaking', 6, ?, ?, ?)`).run(a.id, chua.han, gv, gv);
    const co = s();
    assert(co.sCheo === true && co.nguoi === gv && co.xongLuc === chua.han && co.khongTinh === null, `có người chấm: ${JSON.stringify(co)}`);
    conn.prepare(`UPDATE assessment_scores SET examiner_user_id = NULL, examiner_name = 'Ngoài' WHERE attempt_id = ? AND skill = 'speaking'`).run(a.id);
    const ngoai = s();
    assert(ngoai.nguoi === null && ngoai.khongTinh === 'nguoi-ngoai', `người ngoài: ${JSON.stringify(ngoai)}`);
  }));

  check('NV-BAI-MT0S · S của MT0 lớp thường → sCheo (luật #1258)', () => thu(() => {
    const a = get(`SELECT a.id FROM assessment_attempts a JOIN classes c ON c.id = a.class_id WHERE c.is_fast_track = 0 AND a.status != 'cancelled' ORDER BY a.id LIMIT 1`);
    conn.prepare(`UPDATE assessment_attempts SET kind = 'mt0' WHERE id = ?`).run(a.id);
    const s = (nv.tinhBai(a.id) as any[]).find((d) => d.kieu === 'speaking');
    assert(s && s.sCheo === true, `MT0 S: ${JSON.stringify(nv.tinhBai(a.id))}`);
  }));

  check('NV-BAI-KHONG-TINH · vắng / chờ duyệt dời / "-" / huỷ / em Lưu trữ trước hạn → khongTinh có mã; em nghỉ SAU hạn vẫn tính', () => thu(() => {
    const a = oL();
    const goc = dongL(a.id);
    conn.prepare(`UPDATE students SET archived_at = date(?, '+1 day') WHERE id = ?`).run(goc.han, a.student_id);
    assert(dongL(a.id).khongTinh === null, 'nghỉ sau hạn phải vẫn tính');
    conn.prepare(`UPDATE students SET archived_at = date(?, '-30 day') WHERE id = ?`).run(goc.han, a.student_id);
    assert(dongL(a.id).khongTinh === 'nghi-truoc-han', `nghỉ trước hạn: ${dongL(a.id).khongTinh}`);
    conn.prepare(`UPDATE students SET archived_at = NULL WHERE id = ?`).run(a.student_id);
    conn.prepare(`DELETE FROM assessment_scores WHERE attempt_id = ? AND skill = 'listening'`).run(a.id);   // ô có điểm không thể vắng
    conn.prepare(`UPDATE attempt_skills SET sit_status = 'absent' WHERE attempt_id = ? AND skill = 'listening'`).run(a.id);
    assert(dongL(a.id)?.khongTinh === 'vang', `vắng: ${JSON.stringify(dongL(a.id))}`);
    conn.prepare(`UPDATE attempt_skills SET sit_status = 'scheduled' WHERE attempt_id = ? AND skill = 'listening'`).run(a.id);
    conn.prepare(`INSERT INTO skill_move_requests (attempt_id, skill, move_no, from_period_id, to_period_id, requested_on, decide_by, status, created_at)
      VALUES (?, 'listening', 1, ?, ?, ?, ?, 'pending', ?)`).run(a.id, a.ky, a.ky, goc.tuan, goc.han, goc.tuan);
    assert(dongL(a.id)?.khongTinh === 'cho-doi', `chờ duyệt dời: ${JSON.stringify(dongL(a.id))}`);
    conn.prepare(`DELETE FROM skill_move_requests WHERE attempt_id = ?`).run(a.id);
    conn.prepare(`DELETE FROM assessment_scores WHERE attempt_id = ? AND skill = 'listening'`).run(a.id);
    conn.prepare(`INSERT INTO assessment_scores (attempt_id, skill, no_show_period_id, no_show_at) VALUES (?, 'listening', ?, ?)`).run(a.id, a.ky, `${goc.tuan}T03:00:00.000Z`);
    assert(dongL(a.id)?.khongTinh === 'dau-tru', `dấu "-": ${JSON.stringify(dongL(a.id))}`);
    conn.prepare(`UPDATE assessment_attempts SET status = 'cancelled' WHERE id = ?`).run(a.id);
    assert(dongL(a.id)?.khongTinh === 'huy', `huỷ: ${JSON.stringify(dongL(a.id))}`);
  }));

  check('NV-CHUYEN · em chuyển lớp giữa kỳ (lượt dời sang lớp mới) → lop = lớp lúc thi, người = GV lớp cũ', () => thu(() => {
    const a = oL();
    const goc = dongL(a.id);
    const moi = get(`SELECT id FROM classes WHERE is_fast_track = 1 AND id != ? AND status = 'active' ORDER BY id LIMIT 1`, a.class_id).id;
    const ngay = get(`SELECT date(?, '+10 day') AS d`, goc.tuan).d;
    conn.prepare(`UPDATE enrollments SET ended_at = ? WHERE student_id = ?`).run(ngay, a.student_id);
    conn.prepare(`INSERT INTO enrollments (student_id, class_id, status, started_at, created_at) VALUES (?, ?, 'active', ?, ?)`).run(a.student_id, moi, ngay, ngay);
    conn.prepare(`UPDATE assessment_attempts SET class_id = ? WHERE id = ?`).run(moi, a.id);
    const d = dongL(a.id);
    assert(d.lop === a.class_id && d.nguoi === goc.nguoi, `sau chuyển: ${JSON.stringify(d)} (gốc ${JSON.stringify(goc)})`);
  }));

  // ------------------------------------------------------------------ Task 3 · ghiSo + gắn vào đường ghi BÀI
  const attempts: any = await import('../fasttrack/attempts.ts');
  const skillSch: any = await import('../fasttrack/skillSchedule.ts');
  const classesSvc: any = await import('../classes/classes.ts');
  const studentsSvc: any = await import('../students/students.ts');
  const { P } = t as any;
  const so = (khoa: string) => get('SELECT * FROM nghia_vu WHERE khoa = ?', khoa);
  /** Ô L chưa nhập của `oL()` + dòng sổ dựng sẵn. */
  const chuanBi = () => {
    const a = oL();
    conn.prepare(`DELETE FROM assessment_scores WHERE attempt_id = ? AND skill = 'listening'`).run(a.id);
    nv.ghiSoLuot([a.id]);
    return { a, khoa: nv.khoaBai(a.id, 'listening') };
  };

  check('NV-GHI · ghiSo upsert một dòng; chạy lặp không đổi; ô không còn (thôi bắt buộc / lượt xoá) → dòng giữ, khong_tinh da-xoa (không DELETE)', () => thu(() => {
    const { a, khoa } = chuanBi();
    const d = so(khoa);
    assert(d && d.loai === 'bai' && d.han && d.han_goc === d.han && d.xong_luc === null, `dòng: ${JSON.stringify(d)}`);
    nv.ghiSo(khoa);
    assert(so(khoa).cap_nhat === d.cap_nhat && (conn.prepare('SELECT COUNT(*) n FROM nghia_vu WHERE khoa = ?').get(khoa) as any).n === 1, 'chạy lặp phải không đổi');
    conn.prepare(`UPDATE attempt_skills SET required = 0 WHERE attempt_id = ? AND skill = 'listening'`).run(a.id);   // ô thôi bắt buộc = gốc không còn
    nv.ghiSo(khoa);
    assert(so(khoa)?.khong_tinh === 'da-xoa', `ô không còn: ${JSON.stringify(so(khoa))}`);
  }));

  check('NV-NHAP · nhập điểm (saveScore) → xong_luc = ngày nhập, nguoi_lam = người nhập; NV-XOA · xoá điểm → xong_luc NULL', () => thu(() => {
    const { a, khoa } = chuanBi();
    const han = so(khoa).han;
    attempts.saveScore(P.admin, a.id, 'listening', { rawScore: 30 }, han);
    const d = so(khoa);
    assert(d.xong_luc === han && d.nguoi_lam === P.admin.userId, `sau nhập: ${JSON.stringify(d)}`);
    attempts.saveScore(P.admin, a.id, 'listening', { rawScore: null, lyDo: 'nhập nhầm' }, han);
    assert(so(khoa).xong_luc === null, `sau xoá: ${JSON.stringify(so(khoa))}`);
  }));

  check('NV-PC · đổi phân công L từ ngày X (ghiPhanCong) → ô hạn < X giữ người cũ, ô hạn ≥ X sang người mới', () => thu(() => {
    const a = oL();
    nv.ghiSoTheoLop(a.class_id);
    const dong = conn.prepare(`SELECT * FROM nghia_vu WHERE lop = ? AND kieu = 'listening' AND han IS NOT NULL ORDER BY han`).all(a.class_id) as any[];
    const han = [...new Set(dong.map((d) => d.han))];
    assert(han.length >= 2, `lớp cần ≥ 2 hạn L khác nhau: ${han.join(', ')}`);
    const X = han[han.length - 1];
    const cu = dong[0].nguoi;
    const moi = get(`SELECT id FROM users WHERE id != ? ORDER BY id LIMIT 1`, cu).id;
    const slots = (conn.prepare(`SELECT user_id, skill, is_core FROM teacher_assignments WHERE class_id = ? AND status = 'active'`).all(a.class_id) as any[])
      .map((r) => ({ userId: r.skill === 'listening' && !r.is_core ? moi : r.user_id, skill: r.skill, isCore: !!r.is_core }));
    classesSvc.ghiPhanCong(P.admin, a.class_id, slots, X);
    const sau = conn.prepare(`SELECT * FROM nghia_vu WHERE lop = ? AND kieu = 'listening' AND han IS NOT NULL ORDER BY han`).all(a.class_id) as any[];
    assert(sau.filter((d) => d.han < X).every((d) => d.nguoi === cu), `trước X phải giữ người cũ: ${JSON.stringify(sau.map((d) => [d.han, d.nguoi]))}`);
    assert(sau.filter((d) => d.han >= X).every((d) => d.nguoi === moi), `từ X phải người mới: ${JSON.stringify(sau.map((d) => [d.han, d.nguoi]))}`);
  }));

  check('NV-HAN2 · đặt hạn ô hai lần (setSkillDeadline) → han_goc = hạn lần đầu, han = lần cuối; đặt hạn cả lượt (setDeadlineOverride) cũng ghi sổ', () => thu(() => {
    const { a, khoa } = chuanBi();
    const goc = so(khoa);
    const d1 = get(`SELECT date(?, '+20 day') d`, goc.han).d, d2 = get(`SELECT date(?, '+30 day') d`, goc.han).d;
    skillSch.setSkillDeadline(P.admin, a.id, 'listening', d1, null);
    skillSch.setSkillDeadline(P.admin, a.id, 'listening', d2, null);
    assert(so(khoa).han_goc === goc.han && so(khoa).han === d2, `hai lần: ${JSON.stringify(so(khoa))}`);
    skillSch.setSkillDeadline(P.admin, a.id, 'listening', null, null);
    const d3 = get(`SELECT date(?, '+40 day') d`, goc.han).d;
    attempts.setDeadlineOverride(P.admin, a.id, d3, 'thử');
    assert(so(khoa).han === d3 && so(khoa).han_goc === goc.han, `hạn cả lượt: ${JSON.stringify(so(khoa))}`);
  }));

  check('NV-DUONG · huỷ lượt → khong_tinh huy; ghi GV chấm Speaking → nguoi; em Lưu trữ trước hạn (setStudentStatus) → nghi-truoc-han', () => thu(() => {
    const { a, khoa } = chuanBi();
    const ks = nv.khoaBai(a.id, 'speaking');
    conn.prepare(`DELETE FROM assessment_scores WHERE attempt_id = ? AND skill = 'speaking'`).run(a.id);
    nv.ghiSoLuot([a.id]);
    /* Chủ SP 10/11: người chấm S chéo phải là GV có kỹ năng S. */
    const gv = get(`SELECT u.id FROM users u JOIN user_skills us ON us.user_id = u.id AND us.skill = 'speaking' JOIN user_roles ur ON ur.user_id = u.id AND ur.status = 'active'
      JOIN roles r ON r.id = ur.role_id AND r.key = 'teacher' WHERE u.status = 'active' ORDER BY u.id LIMIT 1`).id;
    attempts.saveScore(P.admin, a.id, 'speaking', { band: 6, gvCham: { performerUserId: gv } }, so(ks).han);
    assert(so(ks).nguoi === gv && so(ks).xong_luc, `GV chấm S: ${JSON.stringify(so(ks))}`);
    studentsSvc.setStudentStatus(P.admin, a.student_id, 'finished', get(`SELECT date(?, '-1 day') d`, so(khoa).han).d, 'thử');
    assert(so(khoa).khong_tinh === 'nghi-truoc-han', `nghỉ: ${JSON.stringify(so(khoa))}`);
    attempts.huyLuot(P.admin, a.id, { lyDo: 'thử huỷ' });
    assert(so(khoa).khong_tinh === 'huy', `huỷ: ${JSON.stringify(so(khoa))}`);
  }));

  // ------------------------------------------------------------------ Task 4 · VIỆC (Công việc mở · việc đã xong · Kết quả PA)
  const { myWork } = await import('../worklist/mywork.ts');
  const { viecXongCn } = await import('../phanTich/viecDaXong.ts');
  const { VIEC_CO_HAN, quanLyCn } = await import('../phanTich/viecCoHan.ts');
  const metrics: any = await import('../worklist/metrics.ts');
  const { TODAY } = t as any;
  const MB = get(`SELECT branch_id FROM classes WHERE code = 'MB FT 101'`).branch_id as number;
  const moViec = () => ((myWork(quanLyCn(MB), { branchId: MB, nguoi: 'tat-ca', chiNhom: VIEC_CO_HAN }) as any).items ?? []).filter((x: any) => x.due && VIEC_CO_HAN.has(x.group));
  const xongViec = () => viecXongCn({ cn: MB, khung: 'ft', tu: '2000-01-01', cuoi: '2100-12-31', homNay: TODAY });
  const mo0 = moViec(), xong0 = xongViec();
  /* Mỗi loại việc spec 1.1 một ca: việc mở (Công việc) → dòng cùng hạn + người, chưa xong; việc đã xong → dòng cùng ngày xong (đúng hạn / làm muộn theo ngày). */
  for (const g of [...VIEC_CO_HAN]) {
    const mo = mo0.filter((x: any) => x.group === g), xo = xong0.filter((x: any) => x.group === g);
    if (!mo.length && !xo.length) { console.log(`  · NV-VIEC-${g}: seed không có việc loại này (bỏ qua)`); continue; }
    check(`NV-VIEC-${g} · ${mo.length} việc mở (Công việc) + ${xo.length} việc đã xong → dòng sổ cùng hạn, người, ngày xong`, () => thu(() => {
      nv.ghiSoViecChiNhanh(MB);
      for (const it of mo) {
        const d = so(nv.khoaViec(it.key));
        assert(d && d.loai === 'viec' && d.han === it.due && d.nguoi === (it.ownerId > 0 ? it.ownerId : null) && d.xong_luc === null && d.khong_tinh === null,
          `việc mở ${it.key}: ${JSON.stringify(d)} ≠ hạn ${it.due} người ${it.ownerId}`);
      }
      for (const it of xo) {
        const d = so(nv.khoaViec(it.key));
        assert(d && d.han === it.due && d.nguoi === it.ownerId && d.xong_luc === it.xong, `việc xong ${it.key}: ${JSON.stringify(d)} ≠ ${it.due} / ${it.xong}`);
      }
    }));
  }

  check('NV-VIEC-ghi_ket_qua_pa · mỗi nghĩa vụ Kết quả PA (tập dung-han-cap-nhat) một dòng: đúng hạn có ngày ghi ≤ hạn; chưa ghi → xong NULL; người = chủ Case', () => thu(() => {
    const r = metrics.metricSet(quanLyCn(MB), 'dung-han-cap-nhat', { branchId: MB });
    assert(r.ids.length > 0, 'seed phải có nghĩa vụ Kết quả PA');
    nv.ghiSoViecChiNhanh(MB);
    const dung = new Set(r.numeratorIds);
    for (const id of r.ids) {
      const d = so(nv.khoaViec(`ket_qua_pa:${id}`));
      assert(d && d.kieu === 'ghi_ket_qua_pa', `thiếu nghĩa vụ ${id}`);
      if (dung.has(id)) assert(d.xong_luc && d.xong_luc <= d.han, `đúng hạn ${id}: ${JSON.stringify(d)}`);
      const chu = get(`SELECT sc.owner_user_id AS o FROM case_interventions iv JOIN sos_cases sc ON sc.id = iv.case_id WHERE iv.id = ?`, metrics.parseObligation(id).interventionId).o;
      assert(d.nguoi === (chu ?? null), `người ${id}: ${d.nguoi} ≠ ${chu}`);
    }
  }));

  check('NV-VIEC-RESET · đặt lại hạn (viec_han_lan) → han_goc = hạn cũ lần đầu, han = hạn hiện tại', () => thu(() => {
    const it = mo0.find((x: any) => /^baoph:\d+$/.test(x.key)) ?? mo0.find((x: any) => /^(cause|ghi_nhan_xet|support):\d+$/.test(x.key));
    assert(it, 'seed phải có việc Báo PH hoặc Case mở');
    const m = /^(\w+):(\d+)$/.exec(it.key)!;
    const loai = m[1] === 'baoph' ? 'bao_ph' : m[1] === 'support' ? 'reset_case:han_them_pa' : 'reset_case:han_xac_nhan';
    conn.prepare(`INSERT INTO viec_han_lan (loai, viec_id, han_cu, han_moi, luc) VALUES (?, ?, '2026-08-01', ?, ?)`).run(loai, Number(m[2]), it.due, `${TODAY}T03:00:00.000Z`);
    conn.prepare(`INSERT INTO viec_han_lan (loai, viec_id, han_cu, han_moi, luc) VALUES (?, ?, '2026-08-05', ?, ?)`).run(loai, Number(m[2]), it.due, `${TODAY}T04:00:00.000Z`);
    conn.prepare(`DELETE FROM nghia_vu WHERE khoa = ?`).run(nv.khoaViec(it.key));
    nv.ghiSoViecChiNhanh(MB);
    const d = so(nv.khoaViec(it.key));
    assert(d.han_goc === '2026-08-01' && d.han === it.due, `hạn gốc: ${JSON.stringify(d)}`);
  }));

  check('NV-VIEC-THIEU-NGAY · Case đã có mô tả mà không có ngày xong: hạn trước mốc → coi xong đúng hạn; hạn sau mốc → thieu-ngay-xong', () => thu(() => {
    const it = [...mo0, ...xong0].find((x: any) => /^(cause|ghi_nhan_xet):\d+$/.test(x.key));
    assert(it, 'seed phải có việc Xác nhận / Mô tả Case');
    const caseId = Number(it.key.split(':')[1]);
    conn.prepare(`DELETE FROM case_milestones WHERE case_id = ? AND kind = 'xac_nhan_case'`).run(caseId);
    conn.prepare(`INSERT INTO case_issues (case_id, role, taxonomy_code, observation, created_at) VALUES (?, 'primary', 'student.academic.listening.detail', 'thử', ?)`).run(caseId, `${TODAY}T03:00:00.000Z`);
    conn.prepare(`UPDATE sos_cases SET mo_ta_luc = NULL WHERE id = ?`).run(caseId);
    const han = get('SELECT han_xac_nhan h FROM sos_cases WHERE id = ?', caseId).h;
    try {
      nv.MOC_TINH_TRE.ngay = get(`SELECT date(?, '+1 day') d`, han).d;
      nv.ghiSoViecChiNhanh(MB);
      const truoc = so(nv.khoaViec(it.key));
      assert(truoc && truoc.xong_luc === han && truoc.khong_tinh === null, `trước mốc: ${JSON.stringify(truoc)}`);
      nv.MOC_TINH_TRE.ngay = han;
      nv.ghiSoViecChiNhanh(MB);
      assert(so(nv.khoaViec(it.key)).khong_tinh === 'thieu-ngay-xong', `sau mốc: ${JSON.stringify(so(nv.khoaViec(it.key)))}`);
    } finally { nv.MOC_TINH_TRE.ngay = ''; }
  }));

  // ------------------------------------------------------------------ Task 5 · đếm (đọc sổ)
  const dem: any = await import('../phanTich/demNghiaVu.ts');
  const ng: any = await import('../platform/nguCanhRequest.ts');
  const accounts: any = await import('../platform/accounts.ts');
  const { loadPrincipal } = await import('../permissions.ts');
  const timNguoi: any = await import('../platform/timNguoi.ts');
  /** Dòng sổ giả (chỉ cột đếm cần) — ca đếm cô lập khỏi luật tính dòng. */
  let soGia = 0;
  const chenSo = (o: { nguoi: number | null; cn?: number; han: string; xong?: string | null; hanGoc?: string; tuan?: string | null; sCheo?: boolean; khongTinh?: string | null; loai?: string }) =>
    conn.prepare(`INSERT INTO nghia_vu (loai, kieu, khoa, chi_nhanh, nguoi, s_cheo, han_goc, han, tuan, xong_luc, khong_tinh, cap_nhat)
      VALUES (?, 'listening', ?, ?, ?, ?, ?, ?, ?, ?, ?, '2026-09-01')`).run(o.loai ?? 'bai', `gia:${++soGia}`, o.cn ?? MB, o.nguoi, o.sCheo ? 1 : 0, o.hanGoc ?? o.han, o.han,
      o.tuan ?? null, o.xong ?? null, o.khongTinh ?? null);
  const KY = { tu: '2026-08-31', den: '2026-09-13', loai: 'bai', homNay: TODAY };
  const gvMb = (conn.prepare(`SELECT DISTINCT u.id FROM users u JOIN user_roles ur ON ur.user_id = u.id JOIN roles r ON r.id = ur.role_id
      WHERE r.key = 'teacher' AND ur.branch_id = ? AND ur.status = 'active' ORDER BY u.id`).all(MB) as any[]).map((r) => r.id as number);
  const so3 = (m: Map<number, any>, gv: number) => m.get(gv) ?? { dung: 0, muon: 0, chua: 0 };

  check('NV-DEM · 3 dòng (đúng hạn, làm muộn, chưa làm) → {1,1,1}; dòng chưa tới hạn / không tính / chưa phân công không đếm', () => thu(() => {
    conn.exec('DELETE FROM nghia_vu');
    const g = gvMb[0];
    chenSo({ nguoi: g, han: '2026-09-02', xong: '2026-09-01' });
    chenSo({ nguoi: g, han: '2026-09-02', xong: '2026-09-05' });
    chenSo({ nguoi: g, han: '2026-09-03' });
    chenSo({ nguoi: g, han: '2026-09-13' });                       // quá hạn 1 ngày (hôm nay 09-14) → chưa làm
    chenSo({ nguoi: g, han: '2026-09-04', khongTinh: 'vang' });
    chenSo({ nguoi: null, han: '2026-09-04' });
    const m = dem.demTheoNguoi({ chiNhanh: MB, ...KY });
    const x = so3(m, g);
    assert(x.dung === 1 && x.muon === 1 && x.chua === 2, `So3: ${JSON.stringify(x)}`);
    assert(dem.trangThai({ han: TODAY, hanGoc: TODAY, xongLuc: null }, TODAY) === 'chua-toi', 'hạn = hôm nay: chưa tới hạn');
    assert(dem.chuaPhanCong(MB, KY.tu, KY.den).length === 1, 'dòng Chưa phân công');
  }));

  check('NV-MOC · mốc W4 OCT: hạn gốc 2026-10-12 xong muộn → đúng; 2026-10-19 xong muộn → muộn; trước mốc chưa xong → chưa; bài xét theo tuần thi', () => {
    try {
      nv.MOC_TINH_TRE.ngay = '2026-10-19';
      const tt = (o: any) => dem.trangThai(o, '2026-11-09');
      assert(tt({ han: '2026-10-12', hanGoc: '2026-10-12', xongLuc: '2026-10-20' }) === 'dung', 'hạn gốc trước mốc, xong muộn → đúng');
      assert(tt({ han: '2026-10-19', hanGoc: '2026-10-19', xongLuc: '2026-10-25' }) === 'muon', 'hạn gốc = mốc, xong muộn → muộn');
      assert(tt({ han: '2026-10-12', hanGoc: '2026-10-12', xongLuc: null }) === 'chua', 'trước mốc, chưa xong → chưa làm');
      assert(tt({ han: '2026-10-21', hanGoc: '2026-10-21', tuan: '2026-10-12', xongLuc: '2026-10-30' }) === 'dung', 'bài tuần W3 OCT (hạn 21/10) xong muộn → đúng');
      assert(tt({ han: '2026-11-25', hanGoc: '2026-10-08', xongLuc: '2026-11-20' }) === 'dung', 'hạn gốc trước mốc (đã đặt lại hạn) → đúng');
    } finally { nv.MOC_TINH_TRE.ngay = ''; }
  });

  check('NV-SCHEO-CA-NHOM · S chéo chưa ai nhận, 3 GV có kỹ năng S → KHÔNG cộng vào 3 số riêng, đếm riêng "S chéo chung" + 1 mỗi người; panel có dòng sCheo', () => thu(() => {
    conn.exec('DELETE FROM nghia_vu');
    const ba = gvMb.slice(0, 3);
    assert(ba.length === 3, 'seed cần ≥ 3 GV chi nhánh');
    conn.prepare(`DELETE FROM user_skills WHERE skill = 'speaking'`).run();
    conn.prepare(`DELETE FROM user_skill_lich_su WHERE skill = 'speaking'`).run();
    for (const g of ba) accounts.ghiLichSuKyNang(conn, g, [], ['speaking'], '2026-08-01');
    chenSo({ nguoi: null, sCheo: true, han: '2026-09-03' });
    const m = dem.demTheoNguoi({ chiNhanh: MB, ...KY });
    for (const g of ba) assert(so3(m, g).chua === 0 && m.get(g)?.sChung === 1, `GV ${g}: ${JSON.stringify(m.get(g))}`);
    assert(gvMb.slice(3).every((g) => !m.get(g)?.sChung), 'GV không có S không bị tính');
    for (const g of ba) assert(dem.dongCuaNguoi({ nguoi: g, chiNhanh: MB, ...KY }).some((d: any) => d.sCheo && d.trangThai === 'chua'), `panel GV ${g}`);
    assert(dem.chuaPhanCong(MB, KY.tu, KY.den).every((d: any) => !d.sCheo), 'có người S → không phải Chưa phân công');
  }));

  check('NV-SCHEO-NGAY · kỹ năng S TẠI NGÀY HẠN: có S 01/08, bỏ S 05/09 → bài S chéo hạn 03/09 (quá hạn trước ngày bỏ) vẫn tính; hạn 10/09 không', () => thu(() => {
    conn.exec('DELETE FROM nghia_vu');
    const g = gvMb[0];
    conn.prepare(`DELETE FROM user_skills WHERE skill = 'speaking'`).run();
    conn.prepare(`DELETE FROM user_skill_lich_su WHERE skill = 'speaking'`).run();
    accounts.ghiLichSuKyNang(conn, g, [], ['speaking'], '2026-08-01');
    accounts.ghiLichSuKyNang(conn, g, ['speaking'], [], '2026-09-05');
    chenSo({ nguoi: null, sCheo: true, han: '2026-09-03' });
    chenSo({ nguoi: null, sCheo: true, han: '2026-09-10' });
    const x = dem.demTheoNguoi({ chiNhanh: MB, ...KY }).get(g);
    assert(x?.sChung === 1, `chỉ bài hạn trước ngày bỏ S: ${JSON.stringify(x)}`);
    const ds = dem.chuaPhanCong(MB, KY.tu, KY.den);
    assert(ds.some((d: any) => d.sCheo && d.han === '2026-09-10'), 'hạn 10/09 không còn ai có S → Chưa phân công');
  }));

  check('NV-SCHEO-HO-SO · sửa kỹ năng ở Hồ sơ cá nhân (updateProfile) ghi lịch sử: bỏ S → dòng đóng ngày hôm nay; thêm lại → dòng mới', () => thu(() => {
    const g = gvMb[0];
    conn.prepare(`DELETE FROM user_skill_lich_su WHERE user_id = ?`).run(g);
    conn.prepare(`DELETE FROM user_skills WHERE user_id = ?`).run(g);
    conn.prepare(`INSERT INTO user_skills (user_id, skill) VALUES (?, 'speaking'), (?, 'listening')`).run(g, g);
    const pg = loadPrincipal(g);
    accounts.updateProfile(pg, { skills: ['listening'] });
    const bo = conn.prepare(`SELECT * FROM user_skill_lich_su WHERE user_id = ? AND skill = 'speaking'`).all(g) as any[];
    assert(bo.length === 1 && bo[0].den === TODAY && bo[0].tu === '2000-01-01', `bỏ S: ${JSON.stringify(bo)}`);
    accounts.updateProfile(pg, { skills: ['listening', 'speaking'] });
    const lai = conn.prepare(`SELECT * FROM user_skill_lich_su WHERE user_id = ? AND skill = 'speaking' ORDER BY id`).all(g) as any[];
    assert(lai.length === 2 && lai[1].tu === TODAY && lai[1].den === null, `thêm lại S: ${JSON.stringify(lai)}`);
  }));

  check('NV-SCHEO-CHON · nhập điểm S chéo: người chấm phải có kỹ năng S (hoặc tên ngoài); người không có S → 400', () => thu(() => {
    const a = oL();
    const s = nv.tinhBai(a.id).find((d: any) => d.kieu === 'speaking');
    const coS = get(`SELECT u.id FROM users u JOIN user_skills us ON us.user_id = u.id AND us.skill = 'speaking' JOIN user_roles ur ON ur.user_id = u.id AND ur.status = 'active'
      JOIN roles r ON r.id = ur.role_id AND r.key = 'teacher' WHERE u.status = 'active' ORDER BY u.id LIMIT 1`).id;
    const khongS = get(`SELECT u.id FROM users u JOIN user_roles ur ON ur.user_id = u.id AND ur.status = 'active' JOIN roles r ON r.id = ur.role_id AND r.key = 'teacher'
      WHERE u.status = 'active' AND NOT EXISTS (SELECT 1 FROM user_skills us WHERE us.user_id = u.id AND us.skill = 'speaking') ORDER BY u.id LIMIT 1`).id;
    assertThrows(() => attempts.saveScore(P.admin, a.id, 'speaking', { band: 6, gvCham: { performerUserId: khongS } }, s.han), /kỹ năng S|Speaking/, 'người không có S phải bị chặn');
    attempts.saveScore(P.admin, a.id, 'speaking', { band: 6, gvCham: { performerUserId: coS } }, s.han);
    attempts.saveScore(P.admin, a.id, 'speaking', { gvCham: { performerName: 'Cô Lan ngoài' } }, s.han);
    const nguoiS = (conn.prepare(`SELECT u.id FROM users u JOIN user_skills us ON us.user_id = u.id AND us.skill = 'speaking' WHERE u.status = 'active'`).all() as any[]).map((r) => r.id);
    const tim = timNguoi.timNguoi(P.admin, { nhom: 'gv_speaking' }) as any[];
    assert(tim.length > 0 && tim.every((r) => nguoiS.includes(r.id)), `ô chọn chỉ GV có S: ${tim.map((r) => r.id)}`);
  }));

  check('NV-TONG · GV có dòng ở hai chi nhánh → chiNhanh = null ra MỘT dòng = tổng hai chi nhánh', () => thu(() => {
    conn.exec('DELETE FROM nghia_vu');
    const g = gvMb[0];
    const khac = get(`SELECT id FROM branches WHERE id != ? ORDER BY id LIMIT 1`, MB).id;
    chenSo({ nguoi: g, han: '2026-09-02', xong: '2026-09-01' });
    chenSo({ nguoi: g, cn: khac, han: '2026-09-03' });
    const tong = so3(dem.demTheoNguoi({ chiNhanh: null, ...KY }), g);
    assert(tong.dung === 1 && tong.chua === 1, `tổng: ${JSON.stringify(tong)}`);
    assert(so3(dem.demTheoNguoi({ chiNhanh: MB, ...KY }), g).chua === 0, 'một chi nhánh chỉ dòng của nó');
  }));

  check('NV-DEM-CAU · demTheoNguoi một chi nhánh ≤ 2 câu SQL (có S chéo)', () => thu(() => {
    conn.exec('DELETE FROM nghia_vu');
    chenSo({ nguoi: gvMb[0], han: '2026-09-02' });
    chenSo({ nguoi: null, sCheo: true, han: '2026-09-03' });
    const c0 = ng.soCauSql();
    ng.chayTrongRequest('GET', () => dem.demTheoNguoi({ chiNhanh: MB, ...KY }));
    const n = ng.soCauSql() - c0;
    assert(n <= 2, `${n} câu`);
  }));

  // ------------------------------------------------------------------ Task 6 · nạp cũ + đối chiếu đêm
  const { napSoNghiaVu } = await import('../migrate/prNghiaVuNap.ts');
  const { doiChieuSo } = await import('../ops/doiChieuSo.ts');
  const chup = () => new Map((conn.prepare(`SELECT * FROM nghia_vu ORDER BY khoa`).all() as any[]).map(({ id: _i, cap_nhat: _c, ...r }) => [r.khoa, JSON.stringify(r)]));

  check('NV-NAP · seed → nạp → sổ = ghi từng lượt + từng chi nhánh (so toàn bộ); nạp lần hai không nhân đôi, không đổi', () => thu(() => {
    conn.exec('DELETE FROM nghia_vu');
    const kq = napSoNghiaVu();
    const a = chup();
    assert(kq.bai > 0 && kq.viec > 0 && a.size === kq.bai + kq.viec, `nạp: ${JSON.stringify(kq)} · ${a.size} dòng`);
    napSoNghiaVu();
    const a2 = chup();
    assert(a2.size === a.size && [...a].every(([k, v]) => a2.get(k) === v), 'nạp lần hai đổi sổ');
    conn.exec('DELETE FROM nghia_vu');
    for (const r of conn.prepare(`SELECT id FROM assessment_attempts ORDER BY id`).all() as any[]) nv.ghiSoLuot([r.id]);
    for (const b of conn.prepare(`SELECT id FROM branches ORDER BY id`).all() as any[]) nv.ghiSoViecChiNhanh(b.id);
    const b = chup();
    const lech = [...new Set([...a.keys(), ...b.keys()])].filter((k) => a.get(k) !== b.get(k));
    assert(!lech.length, `${lech.length} khoá lệch: ${lech.slice(0, 3).map((k) => `${k} ${a.get(k)} ≠ ${b.get(k)}`).join(' ‖ ')}`);
  }));

  check('NV-DOI-CHIEU · dòng sổ bị sửa tay sai → doiChieuSo sửa lại + một dòng nghia_vu_lech (trước / sau)', () => thu(() => {
    conn.exec('DELETE FROM nghia_vu');
    napSoNghiaVu();
    const r = get(`SELECT khoa, nguoi FROM nghia_vu WHERE loai = 'bai' AND nguoi IS NOT NULL AND han >= date(?, '-50 day') ORDER BY han DESC LIMIT 1`, TODAY);
    assert(r, 'seed phải có bài hạn trong 8 tuần gần nhất');
    conn.prepare(`UPDATE nghia_vu SET nguoi = -12345 WHERE khoa = ?`).run(r.khoa);
    conn.exec('DELETE FROM nghia_vu_lech');
    const kq = doiChieuSo(TODAY);
    assert(so(r.khoa).nguoi === r.nguoi, `chưa sửa: ${JSON.stringify(so(r.khoa))}`);
    const l = conn.prepare(`SELECT * FROM nghia_vu_lech WHERE khoa = ?`).all(r.khoa) as any[];
    assert(l.length === 1 && /-12345/.test(l[0].truoc) && l[0].sau.includes(String(r.nguoi)) && kq.lechBai >= 1, `nhật ký lệch: ${JSON.stringify(l)} · ${JSON.stringify(kq)}`);
  }));

  // ------------------------------------------------------------------ Chủ SP 10/11 · em chuyển lớp (spec 1.2 b)
  const ownerMod: any = await import('../cases/owner.ts');
  const sosV4: any = await import('../../../shared/domain/sosV4.ts');
  /**
   * Một Case "Xác nhận Case" mở (Công việc) của MB: đặt hạn `han`, chuyển em sang lớp FT khác có GV môn khác chủ cũ (đường thật: ganChuCaseThieu theo em, K8).
   * Trả { caseId, cu, moi, hanMoi } — null khi seed không có lớp đích phù hợp.
   */
  const chuyenEm = (han: string) => {
    const it = mo0.find((x: any) => /^cause:\d+$/.test(x.key) && x.ownerId > 0 && x.studentId);
    assert(it, 'seed phải có việc Xác nhận Case mở có chủ');
    const caseId = Number(it.key.split(':')[1]);
    const c = get('SELECT owner_user_id, category, student_id FROM sos_cases WHERE id = ?', caseId);
    conn.prepare('UPDATE sos_cases SET han_xac_nhan = ? WHERE id = ?').run(han, caseId);
    nv.ghiSoViecChiNhanh(MB);   // sổ trước khi chuyển: dòng của chủ cũ
    const dich = get(`SELECT cl.id FROM classes cl JOIN teacher_assignments t ON t.class_id = cl.id AND t.status = 'active' AND t.skill = ?
        WHERE cl.branch_id = ? AND cl.is_fast_track = 1 AND cl.status = 'active' AND t.user_id != ?
          AND cl.id NOT IN (SELECT class_id FROM enrollments WHERE student_id = ?) ORDER BY cl.id LIMIT 1`, c.category, MB, c.owner_user_id, c.student_id);
    assert(dich, 'seed phải có lớp đích có GV môn khác');
    conn.prepare(`UPDATE enrollments SET status = 'completed', ended_at = ? WHERE student_id = ? AND status = 'active'`).run(TODAY, c.student_id);
    conn.prepare(`INSERT INTO enrollments (student_id, class_id, status, started_at, created_at) VALUES (?, ?, 'active', ?, ?)`).run(c.student_id, dich.id, TODAY, TODAY);
    ownerMod.ganChuCaseThieu({ studentIds: [c.student_id], actorId: P.admin.userId, luc: `${TODAY}T03:00:00.000Z` });
    const sau = get('SELECT owner_user_id, han_xac_nhan FROM sos_cases WHERE id = ?', caseId);
    assert(sau.owner_user_id !== c.owner_user_id, `chủ Case phải đổi theo lớp mới: ${sau.owner_user_id}`);
    nv.ghiSoViecChiNhanh(MB);
    return { caseId, cu: c.owner_user_id as number, moi: sau.owner_user_id as number, hanMoi: sau.han_xac_nhan as string };
  };

  check('NV-CHUYEN-QUA-HAN · em chuyển lớp khi việc GV cũ ĐÃ quá hạn chưa làm → GV cũ giữ Chưa làm; GV mới nhận việc mới, hạn tính lại từ ngày chuyển (khoá mới, hạn gốc mới)', () => thu(() => {
    const hanCu = get(`SELECT date(?, '-3 day') d`, TODAY).d;
    const x = chuyenEm(hanCu);
    const l = get(`SELECT * FROM viec_han_lan WHERE loai = 'chuyen_lop:han_xac_nhan' AND viec_id = ?`, x.caseId);
    assert(l && l.han_cu === hanCu && l.nguoi_cu === x.cu && l.ngay === TODAY && x.hanMoi === l.han_moi && x.hanMoi > TODAY, `hạn đặt lại + nhật ký: ${JSON.stringify(l)} · ${x.hanMoi}`);
    const cu = so(nv.khoaViec(`chuyen:${l.id}`));
    assert(cu && cu.nguoi === x.cu && cu.han === hanCu && cu.khong_tinh === null && cu.xong_luc === null, `dòng GV cũ: ${JSON.stringify(cu)}`);
    const moi = so(`${nv.khoaViec(`cause:${x.caseId}`)}~c1`);
    assert(moi && moi.nguoi === x.moi && moi.han === x.hanMoi && moi.han_goc === x.hanMoi && moi.khong_tinh === null, `dòng GV mới: ${JSON.stringify(moi)}`);
    assert(so(nv.khoaViec(`cause:${x.caseId}`))?.khong_tinh === 'da-xoa', 'khoá cũ của việc không còn tính');
    const m = dem.demTheoNguoi({ chiNhanh: MB, tu: '2026-08-01', den: '2026-12-31', loai: 'viec', homNay: TODAY });
    assert((m.get(x.cu)?.chua ?? 0) >= 1, `GV cũ phải có Chưa làm: ${JSON.stringify(m.get(x.cu))}`);
  }));

  check('NV-CHUYEN-CHUA-HAN · em chuyển lớp khi việc GV cũ CHƯA tới hạn → GV cũ không tính (chuyen-lop); GV mới việc mới, hạn tính lại', () => thu(() => {
    const hanCu = get(`SELECT date(?, '+3 day') d`, TODAY).d;
    const x = chuyenEm(hanCu);
    const l = get(`SELECT * FROM viec_han_lan WHERE loai = 'chuyen_lop:han_xac_nhan' AND viec_id = ?`, x.caseId);
    const cu = so(nv.khoaViec(`chuyen:${l.id}`));
    assert(cu && cu.nguoi === x.cu && cu.khong_tinh === 'chuyen-lop', `dòng GV cũ: ${JSON.stringify(cu)}`);
    const moi = so(`${nv.khoaViec(`cause:${x.caseId}`)}~c1`);
    assert(moi && moi.nguoi === x.moi && moi.han === x.hanMoi, `dòng GV mới: ${JSON.stringify(moi)}`);
    const sos = get('SELECT sos_level, urgency FROM sos_cases WHERE id = ?', x.caseId);
    assert(x.hanMoi === sosV4.hanXacNhan(TODAY, { sosLevel: sos.sos_level, urgency: sos.urgency, thuong: false }), `hạn theo luật từ ngày chuyển: ${x.hanMoi}`);
  }));
  if (nv.MOC_TINH_TRE) nv.MOC_TINH_TRE.ngay = '2026-10-19';
}
