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
    nv.ghiSoTheoLop(a.class_id, '2000-01-01');
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
    const gv = get(`SELECT id FROM users WHERE id != ? ORDER BY id LIMIT 1`, P.admin.userId).id;
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
}
