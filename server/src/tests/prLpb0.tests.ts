/**
 * PHÉP KIỂM LPB-0 (N73 + N74 / N76b / N77, chủ SP 26/11 — đặc tả `docs/superpowers/specs/2026-11-26-viec-lien-phong-ban/thiet-ke.md`, sửa bởi
 * `…/2026-11-26-vai-gdcn-lead-tvv-bpxl/thiet-ke.md`): việc liên phòng ban khi chuyển lớp / đổi GV. Mọi ca chạy trong giao dịch cuộn lại, qua đường nghiệp vụ thật
 * (`raLenh`, `huyLenh`, `khoiPhucLenh`, `luuPhanCong`, `huyCho`, `hoanTacLuu`, khối giao việc) — không ghi tay dòng việc.
 */
export async function runPrLpb0Tests(t: any) {
  const { check, assert, conn, TODAY, P, addDays } = t;
  const d: any = await import('../../../shared/domain/index.ts');
  const { loadPrincipal } = await import('../permissions.ts');
  const { xoaNho, soCauSql, chayTrongRequest } = await import('../platform/nguCanhRequest.ts');
  const lenh: any = await import('../classes/lenhChuyen.ts');
  const lpb: any = await import('../classes/lienPhongBan.ts');
  const pc: any = await import('../classes/phanCongGv.ts');
  const intake: any = await import('../classes/intake.ts');
  const week: any = await import('../platform/week.ts');
  const gv: any = await import('../worklist/giaoViec.ts');
  const nn: any = await import('../worklist/nguoiNhan.ts');
  const bp: any = await import('../yThuc/baoPhTvv.ts');
  const tuyen: any = await import('../yThuc/tuyen.ts');
  const accounts: any = await import('../platform/accounts.ts');
  const xoaHv: any = await import('../students/xoaHocVien.ts');
  const { migratePrLpb0 } = await import('../migrate/prLpb0.ts');
  const { myWork } = await import('../worklist/mywork.ts');
  const { TRAN_GHI_LO } = await import('./tocDoDuong.ts');
  console.log('\nLPB-0 · Việc liên phòng ban TVV / BPXL (N73, N74, N77)');

  const thu = (fn: () => void) => { conn.exec('BEGIN IMMEDIATE'); try { fn(); } finally { conn.exec('ROLLBACK'); xoaNho(); } };
  const get = (sql: string, ...a: unknown[]) => conn.prepare(sql).get(...a) as any;
  const all = (sql: string, ...a: unknown[]) => conn.prepare(sql).all(...a) as any[];
  const ma = (fn: () => unknown): number | null => { try { fn(); return null; } catch (e: any) { return e?.status ?? -1; } };

  check('LPB-1 · hanChuNhat: T2–T5 → Chủ nhật tuần đó; T6 → T2, T7 → T3, CN → T4 tuần sau', () => {
    /* 2026-11-23 là Thứ Hai. */
    const kq = ['2026-11-23', '2026-11-24', '2026-11-25', '2026-11-26', '2026-11-27', '2026-11-28', '2026-11-29'].map((x) => d.hanChuNhat(x)).join();
    assert(kq === '2026-11-29,2026-11-29,2026-11-29,2026-11-29,2026-11-30,2026-12-01,2026-12-02', kq);
    assert(d.hanChuNhat('2026-11-27T20:00:00Z') === '2026-12-01', 'giờ VN: 20:00Z Thứ Sáu = 03:00 Thứ Bảy VN → hạn Thứ Ba');
  });

  check('LPB-2 · migrate prLpb0 chạy lặp không đổi; cột + bảng có', () => thu(() => {
    const lan: string[] = [];
    migratePrLpb0(conn, lan);
    assert(!lan.length, lan.join(' | '));
    const cot = all('PRAGMA table_info(viec_bao_ph)').map((c) => c.name);
    assert(cot.includes('lenh_chuyen_id') && cot.includes('lenh_mau'), cot.join());
    assert(get(`SELECT COUNT(*) n FROM sqlite_master WHERE name IN ('viec_nhan_tin', 'viec_nhan_tin_dong')`).n === 2, 'bảng / chỉ mục');
  }));

  // ------------------------------------------------------------------ dựng: lớp nguồn FOU (tuần 8) + lớp đích BE, GVCN hai lớp, n em
  const MB = get(`SELECT id FROM branches WHERE code = 'MB'`).id as number;
  const TUAN = d.tuanChonDuoc(TODAY) as string[];
  const GV = all(`SELECT DISTINCT ur.user_id FROM user_roles ur JOIN roles r ON r.id = ur.role_id
     WHERE r.key = 'teacher' AND ur.status = 'active' AND ur.branch_id = ? ORDER BY ur.user_id LIMIT 3`, MB).map((r) => r.user_id as number);
  const TVV = get(`SELECT ur.user_id u FROM user_roles ur JOIN roles r ON r.id = ur.role_id WHERE r.key = 'consultant' AND ur.status = 'active' AND ur.branch_id = ? ORDER BY ur.user_id LIMIT 1`, MB).u as number;
  let seq = 0;
  const lop = (kind: string, tuanHienTai: number) => {
    seq += 1;
    const bat = d.mondayOfDate(addDays(TODAY, -7 * (tuanHienTai - 1)));
    return intake.createClass(P.admin, { code: `MB-LPB${seq}`, branchId: MB, kind, isFastTrack: false, route: null, startDate: bat, startPeriodId: week.ensurePeriod(bat).id }).id as number;
  };
  const gan = (l: number, u: number, skill: string | null, core: boolean) => conn.prepare(
    `INSERT INTO teacher_assignments (user_id, class_id, skill, is_core, effective_from, status, created_at) VALUES (?,?,?,?, '2026-01-01', 'active', ?)`,
  ).run(u, l, skill, core ? 1 : 0, new Date().toISOString());
  const em = (lopId: number, tvv: number | null = TVV) => {
    seq += 1;
    const now = new Date().toISOString();
    const sid = Number(conn.prepare(`INSERT INTO students (student_code, full_name, normalized_name, branch_id, status, created_at, consultant_user_id) VALUES (?,?,?,?, 'active', ?, ?)`)
      .run(`PISA-LPB${seq}`, `Hoc vien LPB${seq}`, `hoc vien lpb${seq}`, MB, now, tvv).lastInsertRowid);
    conn.prepare(`INSERT INTO enrollments (student_id, class_id, status, started_at, created_at) VALUES (?,?, 'active', ?, ?)`).run(sid, lopId, TODAY, now);
    conn.prepare(`INSERT INTO learning_cycles (student_id, seq, route, programme_code, started_at, status, created_at) VALUES (?, 1, NULL, 'FOU', ?, 'active', ?)`).run(sid, TODAY, now);
    return sid;
  };
  const dung = () => {
    const nguon = lop('FOU', 8); const dich = lop('BE', 1); const dich2 = lop('BE', 1);
    gan(nguon, GV[0], null, true); gan(dich, GV[1], null, true); gan(dich2, GV[2], null, true);
    xoaNho();
    return { nguon, dich, dich2 };
  };
  const ra = (nguon: number, dich: number | null, sids: number[], o: { tuan?: string; huong?: string } = {}) => {
    const r = lenh.raLenh(P.mbManager, { lopNguonId: nguon, boiCanh: 'cuoi-khoa', tuanChung: null,
      dongs: sids.map((studentId) => ({ studentId, huong: o.huong ?? 'len_lop', toClassId: dich, tuan: o.tuan ?? TUAN[0], ...(o.huong === 'bao_luu' ? { ngayXemLai: addDays(TODAY, 30), lyDo: 'Gia đình xin bảo lưu' } : {}) })) });
    assert(r.ok.length === sids.length, JSON.stringify(r.failed));
    xoaNho();
    return sids.map((s) => get('SELECT id FROM lenh_chuyen_lop WHERE student_id = ? ORDER BY id DESC LIMIT 1', s).id as number);
  };
  const tvvCua = (lenhId: number) => all('SELECT * FROM viec_bao_ph WHERE lenh_chuyen_id = ? ORDER BY id', lenhId);
  const ntCua = (lopId: number) => all(`SELECT v.*, (SELECT COUNT(*) FROM viec_nhan_tin_dong d WHERE d.viec_id = v.id AND COALESCE(d.mau, '') != 'x') AS so FROM viec_nhan_tin v WHERE v.class_id = ? ORDER BY v.id`, lopId);

  check('LPB-3 · ra lệnh "Từ tuần" 3 em → 3 việc TVV "Chuyển lớp" (hạn Chủ nhật, TVV của em, người ra lệnh theo dõi) + MỘT việc BPXL lớp đích (một người — N74); lệnh sau dồn vào; đã xác nhận → việc mới', () => thu(() => {
    const { nguon, dich } = dung();
    const ss = [em(nguon), em(nguon), em(nguon)];
    const nguoi = nn.nguoiNhanTuDong('scheduler', MB, { lopId: dich }) ?? nn.headCua(MB);
    const ls = ra(nguon, dich, ss);
    for (const l of ls) {
      const v = tvvCua(l);
      assert(v.length === 1 && v[0].nhan === 'Chuyển lớp' && v[0].trang_thai === 'mo' && v[0].han === d.hanChuNhat(TODAY), JSON.stringify(v));
      assert(bp.nguoiGiuBaoPh(v[0].student_id, v[0].nguoi_luat)[0] === TVV, 'TVV của em giữ');
      assert(get(`SELECT 1 FROM viec_theo_doi WHERE loai = 'bao_ph' AND ref_id = ? AND user_id = ?`, v[0].id, P.mbManager.userId), 'người ra lệnh theo dõi');
    }
    let nt = ntCua(dich);
    assert(nt.length === 1 && nt[0].loai === 'chuyen_lop' && nt[0].so === 3 && nt[0].nguoi_luat === nguoi && nt[0].han === d.hanChuNhat(TODAY), JSON.stringify(nt));
    assert(get(`SELECT 1 FROM viec_theo_doi WHERE loai = 'nhan_tin' AND ref_id = ? AND user_id = ?`, nt[0].id, P.mbManager.userId), 'người ra lệnh theo dõi việc BPXL');
    /* Sửa lại cùng lệnh (gửi lại) không thêm việc. */
    ra(nguon, dich, [ss[0]]);
    assert(tvvCua(ls[0]).length === 1 && ntCua(dich)[0].so === 3, 'gửi lại không nhân việc');
    /* Lệnh sau, khác ngày cũng được → dồn vào việc còn mở. */
    const s4 = em(nguon); ra(nguon, dich, [s4]);
    nt = ntCua(dich);
    assert(nt.length === 1 && nt[0].so === 4, `dồn vào: ${JSON.stringify(nt)}`);
    /* Xác nhận → em sau sang việc MỚI. */
    const bpxl = loadPrincipal(nt[0].nguoi_luat);
    const x = lpb.xacNhanNhanTin(bpxl, nt[0].id);
    assert(x.nhanTin.trangThai === 'xong' && x.nhanTin.em.length === 4, JSON.stringify(x.nhanTin).slice(0, 300));
    ra(nguon, dich, [em(nguon)]);
    nt = ntCua(dich);
    assert(nt.length === 2 && nt[1].so === 1 && nt[0].trang_thai === 'xong', JSON.stringify(nt));
    /* Mở lại (Hoàn tác) → về đang mở. */
    const m = lpb.moLaiNhanTin(bpxl, nt[0].id);
    assert(m.nhanTin.trangThai === 'mo', 'mở lại');
  }));

  check('LPB-4 · KHÔNG sinh việc: "Ngay hôm nay" · Bảo lưu (không lớp đích); sửa "Từ tuần" → "Ngay hôm nay": việc mở tự đóng', () => thu(() => {
    const { nguon, dich } = dung();
    const [a, b, c] = [em(nguon), em(nguon), em(nguon)];
    const [la] = ra(nguon, null, [a], { huong: 'bao_luu' });
    assert(!tvvCua(la).length && !ntCua(dich).length, 'bảo lưu không việc');
    const ngay = ra(nguon, dich, [b], { tuan: TODAY });
    assert(get('SELECT trang_thai FROM lenh_chuyen_lop WHERE id = ?', ngay[0]).trang_thai === 'da_chuyen', 'đã chuyển ngay');
    assert(!tvvCua(ngay[0]).length && !ntCua(dich).length, `ngay hôm nay không việc: ${JSON.stringify(ntCua(dich))}`);
    const [lc] = ra(nguon, dich, [c]);
    assert(tvvCua(lc)[0].trang_thai === 'mo', 'Từ tuần có việc');
    /* Mô phỏng sửa sang "Ngay hôm nay" (lệnh đã thi hành hôm nay) qua đúng hàm đồng bộ. */
    conn.prepare(`UPDATE lenh_chuyen_lop SET trang_thai = 'da_chuyen', tuan_bat_dau = ? WHERE id = ?`).run(TODAY, lc);
    lpb.dongBoLienPhongLenh([lc], P.mbManager.userId);
    const v = tvvCua(lc)[0];
    assert(v.trang_thai === 'bo' && v.bo_ly_do === 'system_chuyen_ngay', JSON.stringify(v));
    assert(ntCua(dich).every((x: any) => x.trang_thai === 'bo' && x.so === 0), `BPXL: em rời bảng, việc hết em tự đóng ${JSON.stringify(ntCua(dich))}`);
  }));

  check('LPB-5 · huỷ lệnh: việc mở tự đóng + rời bảng BPXL; khôi phục → mở lại; đã báo PH → "Báo lại · Huỷ chuyển lớp"; BPXL đã xác nhận → tin "Cập nhật", không việc mới', () => thu(() => {
    const { nguon, dich } = dung();
    const [a, b] = [em(nguon), em(nguon)];
    const [la, lb] = ra(nguon, dich, [a, b]);
    lenh.huyLenh(P.mbManager, la, 'thử');
    xoaNho();
    assert(tvvCua(la)[0].trang_thai === 'bo' && tvvCua(la)[0].bo_ly_do === 'system_lenh_huy', 'tự đóng');
    assert(ntCua(dich)[0].so === 1 && ntCua(dich)[0].trang_thai === 'mo', 'rời bảng, việc còn em kia');
    lenh.khoiPhucLenh(P.mbManager, [la]);
    xoaNho();
    assert(tvvCua(la).length === 1 && tvvCua(la)[0].trang_thai === 'mo', 'khôi phục mở lại');
    assert(ntCua(dich)[0].so === 2, 'về bảng');
    /* TVV báo PH em b xong, BPXL xác nhận → huỷ lệnh b. */
    const vb = tvvCua(lb)[0];
    bp.ghiKetQuaBaoPh(loadPrincipal(TVV), { viecIds: [vb.id], ketQua: 'da_bao', ghiChu: 'Đã báo PH lớp mới' });
    const nt = ntCua(dich)[0];
    lpb.xacNhanNhanTin(loadPrincipal(nt.nguoi_luat), nt.id);
    const tin0 = get(`SELECT COUNT(*) n FROM notifications WHERE user_id = ? AND dedup_key LIKE ?`, nt.nguoi_luat, `nt:${nt.id}:%`).n;
    lenh.huyLenh(P.mbManager, lb, null);
    xoaNho();
    const vs = tvvCua(lb);
    assert(vs.length === 2 && vs[1].nhan === 'Báo lại · Huỷ chuyển lớp' && vs[1].trang_thai === 'mo' && vs[1].han === d.hanChuNhat(TODAY), JSON.stringify(vs));
    const tin = get(`SELECT COUNT(*) n FROM notifications WHERE user_id = ? AND dedup_key LIKE ?`, nt.nguoi_luat, `nt:${nt.id}:%`).n;
    assert(nt.nguoi_luat === P.mbManager.userId || tin === tin0 + 1, `tin Cập nhật ${tin0} → ${tin}`);
    assert(ntCua(dich).length === 1 && ntCua(dich)[0].trang_thai === 'xong', 'không mở lại, không việc mới');
  }));

  check('LPB-6 · sửa lệnh: việc mở đổi nội dung theo lệnh (hạn giữ); đã báo PH mà đổi lớp đích → "Báo lại · Chuyển lớp"; em sang lớp đích khác → việc BPXL của lớp đó', () => thu(() => {
    const { nguon, dich, dich2 } = dung();
    const [a] = [em(nguon)];
    const [la] = ra(nguon, dich, [a]);
    const v0 = tvvCua(la)[0];
    bp.ghiKetQuaBaoPh(loadPrincipal(TVV), { viecIds: [v0.id], ketQua: 'da_bao', ghiChu: 'Đã báo' });
    lenh.suaLenh(P.mbManager, la, { toClassId: dich2 });
    xoaNho();
    const vs = tvvCua(la);
    assert(vs.length === 2 && vs[1].nhan === 'Báo lại · Chuyển lớp' && vs[1].trang_thai === 'mo', JSON.stringify(vs));
    const xem = bp.xemViecBaoPh(loadPrincipal(TVV), vs[1].id);
    assert(xem.chuyenLop?.lopMoi?.id === dich2 && xem.chuyenLop.loai === 'bao_lai' && xem.coTheGhi, JSON.stringify(xem.chuyenLop));
    assert(ntCua(dich).every((x: any) => x.so === 0) && ntCua(dich2).length === 1 && ntCua(dich2)[0].so === 1, 'lớp đích mới nhận việc');
  }));

  check('LPB-7 · gộp "Kết quả Final": em có việc Final đang mở → lệnh nhập vào việc đó (một việc, hạn muộn hơn); huỷ lệnh → bỏ phần chuyển lớp, việc Final còn', () => thu(() => {
    const { nguon, dich } = dung();
    const a = em(nguon);
    const cy = get('SELECT id FROM learning_cycles WHERE student_id = ?', a).id;
    const at = Number(conn.prepare(`INSERT INTO assessment_attempts (cycle_id, student_id, attempt_no, kind, class_id, status, created_at) VALUES (?, ?, 1, 'final', ?, 'done', ?)`)
      .run(cy, a, nguon, new Date().toISOString()).lastInsertRowid);
    const x = Number(conn.prepare(`INSERT INTO sos_coordination_actions (attempt_id, student_id, kind, status, created_at) VALUES (?, ?, 'bao_ph_tvv', 'pending', ?)`)
      .run(at, a, new Date().toISOString()).lastInsertRowid);
    bp.dongBoViecTvvLuot([at]);
    const f = get('SELECT * FROM viec_bao_ph WHERE phoi_hop_id = ?', x);
    assert(f && f.trang_thai === 'mo', 'việc Final');
    const [la] = ra(nguon, dich, [a]);
    const g = get('SELECT * FROM viec_bao_ph WHERE id = ?', f.id);
    assert(g.lenh_chuyen_id === la && g.nhan === `${f.nhan} · Chuyển lớp` && g.han === [f.han, d.hanChuNhat(TODAY)].sort().at(-1), JSON.stringify(g));
    assert(get(`SELECT COUNT(*) n FROM viec_bao_ph WHERE student_id = ? AND trang_thai = 'mo'`, a).n === 1, 'một việc mở');
    lenh.huyLenh(P.mbManager, la, null);
    const h = get('SELECT * FROM viec_bao_ph WHERE id = ?', f.id);
    assert(h.trang_thai === 'mo' && h.lenh_chuyen_id == null && h.nhan === f.nhan, JSON.stringify(h));
  }));

  check('LPB-8 · em chưa có TVV → Lead TVV chi nhánh (chốt lúc sinh) → Head', () => thu(() => {
    const { nguon, dich } = dung();
    const a = em(nguon, null);
    const lead = accounts.createAccount(P.admin, { email: `lpb0.lead${accounts.EMAIL_SUFFIX}`, password: 'matkhau-lpb0', fullName: 'Thử LPB0 Lead', roles: [{ role: 'lead_consultant', branches: ['MB'] }] }).userId;
    xoaNho();
    const [la] = ra(nguon, dich, [a]);
    const v = tvvCua(la)[0];
    assert(v.nguoi_luat === lead && bp.nguoiGiuBaoPh(a, v.nguoi_luat)[0] === lead, JSON.stringify(v));
  }));

  check('LPB-9 · quyền: GV ngoài lớp 403 xem / xác nhận; người theo dõi chỉ xem; N73 ④ người đã giao đổi được người / hạn; lead BPXL làm hộ', () => thu(() => {
    const { nguon, dich } = dung();
    ra(nguon, dich, [em(nguon)]);
    const nt = ntCua(dich)[0];
    const gvNgoai = loadPrincipal(get(`SELECT ur.user_id u FROM user_roles ur JOIN roles r ON r.id = ur.role_id WHERE r.key = 'teacher' AND ur.status = 'active' AND ur.branch_id != ? LIMIT 1`, MB).u);
    assert(ma(() => gv.xemGiaoViec(gvNgoai, 'nhan_tin', nt.id)) === 403, 'GV ngoài: 403 xem');
    assert(ma(() => lpb.xacNhanNhanTin(gvNgoai, nt.id)) === 403, 'GV ngoài: 403 xác nhận');
    assert(ma(() => gv.xemGiaoViec(P.mbManager, 'nhan_tin', 999999)) === 404, 'không có: 404');
    /* Head giao cho BPXL khác → người cũ theo dõi; người giao (Head) đổi tiếp được; người giữ cũ (theo dõi) chỉ xem. */
    const bpMoi = accounts.createAccount(P.admin, { email: `lpb0.bp${accounts.EMAIL_SUFFIX}`, password: 'matkhau-lpb0', fullName: 'Thử LPB0 BPXL', roles: [{ role: 'scheduler', branches: ['MB'] }] }).userId;
    const tp = accounts.createAccount(P.admin, { email: `lpb0.tp${accounts.EMAIL_SUFFIX}`, password: 'matkhau-lpb0', fullName: 'Thử LPB0 TVV', roles: [{ role: 'consultant', branches: ['MB'] }] }).userId;
    xoaNho();
    const cu = loadPrincipal(nt.nguoi_luat);
    gv.doiPhuTrach(cu, 'nhan_tin', nt.id, { userId: bpMoi, phuTrachCu: null });
    xoaNho();
    const sau = gv.xemGiaoViec(loadPrincipal(bpMoi), 'nhan_tin', nt.id);
    assert(sau.phuTrach[0].id === bpMoi && sau.coTheDoiNguoi, 'người mới giữ');
    const khoiCu = gv.xemGiaoViec(cu, 'nhan_tin', nt.id);
    assert(khoiCu.coTheDoiNguoi && khoiCu.toiTheoDoi, `người đã giao đổi tiếp được + theo dõi: ${JSON.stringify({ d: khoiCu.coTheDoiNguoi, t: khoiCu.toiTheoDoi })}`);
    gv.doiPhuTrach(loadPrincipal(bpMoi), 'nhan_tin', nt.id, { userId: tp, phuTrachCu: bpMoi });
    xoaNho();
    assert(!gv.xemGiaoViec(cu, 'nhan_tin', nt.id).coTheDoiNguoi, 'A → B → C: A chỉ còn theo dõi');
    assert(ma(() => lpb.xacNhanNhanTin(cu, nt.id)) === 403 || cu.roleKeys.includes('manager'), 'người theo dõi không xác nhận');
    const lead = accounts.createAccount(P.admin, { email: `lpb0.lbp${accounts.EMAIL_SUFFIX}`, password: 'matkhau-lpb0', fullName: 'Thử LPB0 Lead BPXL', roles: [{ role: 'scheduler', branches: [] }] }).userId;
    xoaNho();
    assert(lpb.xacNhanNhanTin(loadPrincipal(lead), nt.id).nhanTin.trangThai === 'xong', 'lead BPXL làm hộ');
  }));

  check('LPB-10 · đổi GV có tích "Tạo việc bàn giao" → MỘT việc BPXL Đổi GV của lớp; bỏ tích → không; Huỷ lịch đổi → tự đóng; Hoàn tác lưu → tự đóng', () => thu(() => {
    const { dich } = dung();
    gan(dich, GV[1], 'reading', false); gan(dich, GV[0], 'listening', false);
    xoaNho();
    const slots = () => all(`SELECT user_id, skill, is_core FROM teacher_assignments WHERE class_id = ? AND status = 'active'`, dich).map((r) => ({ userId: r.user_id, skill: r.skill, isCore: r.is_core === 1 }));
    const doiL = (u: number) => slots().filter((x) => x.skill !== 'listening').concat([{ userId: u, skill: 'listening', isCore: false }]);
    const r1 = pc.luuPhanCong(P.mbManager, { lop: [{ classId: dich, slots: doiL(GV[2]), banGiao: { listening: false } }], hieuLuc: { loai: 'tuan', tuanId: week.ensurePeriod(TUAN[0]).id } });
    xoaNho();
    assert(!ntCua(dich).length, `bỏ tích: ${JSON.stringify(ntCua(dich))} ${JSON.stringify(r1).slice(0, 100)}`);
    pc.hoanTacLuu(P.mbManager, { lo: r1.lo });
    xoaNho();
    const r2 = pc.luuPhanCong(P.mbManager, { lop: [{ classId: dich, slots: doiL(GV[2]) }], hieuLuc: { loai: 'tuan', tuanId: week.ensurePeriod(TUAN[0]).id } });
    xoaNho();
    let nt = ntCua(dich);
    assert(nt.length === 1 && nt[0].loai === 'doi_gv' && nt[0].so === 1 && nt[0].trang_thai === 'mo', JSON.stringify(nt));
    const view = lpb.xemNhanTin(P.mbManager, nt[0].id);
    assert(view.doi.length === 1 && view.doi[0].khoa === 'listening', JSON.stringify(view.doi));
    const tu = tuyen.dungTuyen(P.mbManager, { loai: 'doi_gv', khoa: String(nt[0].id) });
    assert(tu.buoc[0].khoa === 'luu' && tu.buoc.some((b: any) => b.khoa.startsWith('nhan_tin:')) && tu.phuTrachChinh, JSON.stringify(tu.buoc.map((b: any) => b.khoa)));
    const cho = all(`SELECT id FROM doi_phan_cong WHERE class_id = ? AND trang_thai = 'cho'`, dich).map((x) => x.id);
    const h = pc.huyCho(P.mbManager, cho);
    xoaNho();
    nt = ntCua(dich);
    assert(nt[0].trang_thai === 'bo' && nt[0].bo_ly_do === 'het_doi', `huỷ lịch đổi: ${JSON.stringify(nt)}`);
    pc.hoanTacLuu(P.mbManager, { dao: h.dao });
    xoaNho();
    assert(ntCua(dich)[0].trang_thai === 'mo', 'Hoàn tác huỷ → mở lại');
    pc.hoanTacLuu(P.mbManager, { lo: r2.lo });
    xoaNho();
    assert(ntCua(dich)[0].trang_thai === 'bo', 'Hoàn tác lưu → tự đóng');
  }));

  check('LPB-11 · /my-work: BPXL có nhóm "Nhận thông tin"; TVV có dòng Báo PH · Chuyển lớp (nhomChuyenLop = lớp nguồn); tuyến Chuyển lớp đủ bước, phụ trách chính = GVCN lớp cũ', () => thu(() => {
    const { nguon, dich } = dung();
    const [la] = ra(nguon, dich, [em(nguon), em(nguon)]);
    const nt = ntCua(dich)[0];
    const w = myWork(loadPrincipal(nt.nguoi_luat), {}) as any;
    const ds = (w.items ?? w.groups?.flatMap((g: any) => g.items) ?? []) as any[];
    assert(ds.some((i) => i.key === `nhan_tin:${nt.id}` && i.group === 'nhan_tin' && i.count === 2), `BPXL: ${JSON.stringify(ds.filter((i) => i.group === 'nhan_tin'))}`);
    xoaNho();
    const wt = myWork(loadPrincipal(TVV), {}) as any;
    const dt = (wt.items ?? wt.groups?.flatMap((g: any) => g.items) ?? []) as any[];
    const v = tvvCua(la)[0];
    assert(dt.some((i) => i.key === `bao-ph:${v.id}` && i.nhomChuyenLop?.lopId === nguon), 'TVV dòng chuyển lớp');
    const tu = tuyen.dungTuyen(P.mbManager, { loai: 'chuyen_lop', khoa: String(la) });
    const k = tu.buoc.map((b: any) => b.khoa);
    assert(k[0] === 'lenh' && k.includes('ban_giao') && k.some((x: string) => x.startsWith('bao_ph:')) && k.some((x: string) => x.startsWith('nhan_tin:')) && k.at(-1) === 'vao_lop', k.join());
    assert(tu.phuTrachChinh === get('SELECT full_name FROM users WHERE id = ?', GV[0]).full_name, `phụ trách chính ${tu.phuTrachChinh}`);
    assert(tuyen.tuyenNhanTin(loadPrincipal(nt.nguoi_luat), nt.id).length === 2, 'panel lô: chuỗi chấm từng em');
  }));

  check('LPB-12 · xoá học viên dọn dòng của em trong việc BPXL; việc hết em không hiện ở Công việc', () => thu(() => {
    const { nguon, dich } = dung();
    const a = em(nguon);
    ra(nguon, dich, [a]);
    const nt = ntCua(dich)[0];
    xoaHv.xoaHocVien(P.admin, a);
    xoaNho();
    assert(ntCua(dich)[0].so === 0 && !get('SELECT 1 FROM viec_bao_ph WHERE student_id = ?', a), 'dọn dòng + việc TVV');
    const w = myWork(loadPrincipal(nt.nguoi_luat), {}) as any;
    const ds = (w.items ?? w.groups?.flatMap((g: any) => g.items) ?? []) as any[];
    assert(!ds.some((i) => i.key === `nhan_tin:${nt.id}`), 'không hiện');
  }));

  check('LPB-13 · tốc độ: ra lệnh 1 em vs 8 em — số câu phần việc liên phòng ban KHÔNG tăng theo số em', () => thu(() => {
    const { nguon, dich } = dung();
    const ss = Array.from({ length: 9 }, () => em(nguon));
    xoaNho();
    const do1 = () => { const s0 = soCauSql(); ra(nguon, dich, [ss[0]]); return soCauSql() - s0; };
    const n1 = do1();
    const s0 = soCauSql(); ra(nguon, dich, ss.slice(1)); const n8 = soCauSql() - s0;
    console.log(`    (đo raLenh có việc liên phòng ban: 1 em ${n1} câu · 8 em ${n8} câu)`);
    assert(n8 <= n1 + 3, `số câu tăng theo số em: ${n1} → ${n8}`);
    /* Đường mới: GET /giao-viec/nhan_tin/:id (khối + bảng em + chuỗi chấm từng em) · POST …/xac-nhan — trần ở `TRAN_GHI_LO`. */
    const nt = ntCua(dich)[0];
    const bpxl = loadPrincipal(nt.nguoi_luat);
    xoaNho(); let c0 = soCauSql();
    chayTrongRequest('GET', () => { gv.xemGiaoViec(bpxl, 'nhan_tin', nt.id); lpb.xemNhanTin(bpxl, nt.id); tuyen.tuyenNhanTin(bpxl, nt.id); });   // như một request thật (nhớ trong request)
    const xem = soCauSql() - c0;
    xoaNho(); c0 = soCauSql();
    chayTrongRequest('POST', () => lpb.xacNhanNhanTin(bpxl, nt.id));
    const xn = soCauSql() - c0;
    /* Việc 1 em (lớp đích khác) — số câu panel không theo số em. */
    const { dich2 } = dung();
    ra(nguon, dich2, [em(nguon)]);
    const nt1 = ntCua(dich2)[0];
    const bp1 = loadPrincipal(nt1.nguoi_luat);
    xoaNho(); c0 = soCauSql();
    chayTrongRequest('GET', () => { gv.xemGiaoViec(bp1, 'nhan_tin', nt1.id); lpb.xemNhanTin(bp1, nt1.id); tuyen.tuyenNhanTin(bp1, nt1.id); });
    const xem1 = soCauSql() - c0;
    console.log(`    (đo GET /giao-viec/nhan_tin/:id 1 em ${xem1} câu · 9 em ${xem} câu · Xác nhận ${xn} câu)`);
    assert(xem <= xem1 + 3, `panel tăng theo số em: ${xem1} → ${xem}`);
    assert(xem <= TRAN_GHI_LO.xemNhanTin && xn <= TRAN_GHI_LO.xacNhanNhanTin, `${xem} / ${xn}`);
  }));
}
