/**
 * PHÉP KIỂM LOI-4 (chủ SP 28/11 — trả lời 7 [Hỏi] của đợt rà lỗi tuyến công việc, `plan.md` mục 4): GĐCN theo dõi Báo PH như Head · Head từ chối đề xuất → việc về
 * người gửi · Bảo lưu / Dừng học không "Báo lại · Huỷ chuyển lớp" · GVCN lớp nguồn khác chi nhánh theo dõi việc BPXL · ghi chú GVCN gửi Meeting theo xem Ý thức em ·
 * Trao đổi gia đình thêm sau Meeting → MỘT Báo PH (C8) · cờ "+ Việc con" theo đúng quyền máy chủ. Mỗi ca cuộn lại; qua đường nghiệp vụ thật.
 */
export async function runPrLoi4Tests(t: any) {
  const { check, assert, conn, TODAY, P, addDays } = t;
  const d: any = await import('../../../shared/domain/index.ts');
  const { loadPrincipal } = await import('../permissions.ts');
  const { xoaNho } = await import('../platform/nguCanhRequest.ts');
  const lenh: any = await import('../classes/lenhChuyen.ts');
  const lpb: any = await import('../classes/lienPhongBan.ts');
  const intake: any = await import('../classes/intake.ts');
  const week: any = await import('../platform/week.ts');
  const gv: any = await import('../worklist/giaoViec.ts');
  const bp: any = await import('../yThuc/baoPhTvv.ts');
  const ph: any = await import('../yThuc/phoiHop.ts');
  const xu: any = await import('../yThuc/xuLy.ts');
  const viol: any = await import('../yThuc/violations.ts');
  const yc: any = await import('../duyet/yeuCau.ts');
  const mg: any = await import('../worklist/mgmttasks.ts');
  const tuyen: any = await import('../yThuc/tuyen.ts');
  const accounts: any = await import('../platform/accounts.ts');
  const att: any = await import('../platform/attachments.ts');
  const { migratePrLoi4 } = await import('../migrate/prLoi4.ts');
  const { myWork } = await import('../worklist/mywork.ts');
  console.log('\nLOI-4 · trả lời 7 [Hỏi] của đợt rà lỗi tuyến (chủ SP 28/11)');

  const thu = (fn: () => void) => { conn.exec('BEGIN IMMEDIATE'); try { xoaNho(); fn(); } finally { conn.exec('ROLLBACK'); xoaNho(); } };
  const get = (sql: string, ...a: unknown[]) => conn.prepare(sql).get(...a) as any;
  const all = (sql: string, ...a: unknown[]) => conn.prepare(sql).all(...a) as any[];
  const ma = (fn: () => unknown): number | null => { try { fn(); return null; } catch (e: any) { return e?.status ?? -1; } };
  const cn = (code: string) => get('SELECT id FROM branches WHERE code = ?', code).id as number;
  const MB = cn('MB'), CP = cn('CP');
  const TUAN = d.tuanChonDuoc(TODAY) as string[];
  let seq = 0;
  const tao = (roles: { role: string; branches: string[] }[]) => {
    seq += 1;
    return accounts.createAccount(P.admin, { email: `loi4.${seq}${accounts.EMAIL_SUFFIX}`, password: 'matkhau-loi4', fullName: `Thu LOI4 ${seq}`, roles }).userId as number;
  };
  const gvCua = (branch: number, n: number) => all(`SELECT DISTINCT ur.user_id FROM user_roles ur JOIN roles r ON r.id = ur.role_id
     WHERE r.key = 'teacher' AND ur.status = 'active' AND ur.branch_id = ? ORDER BY ur.user_id LIMIT ?`, branch, n).map((r) => r.user_id as number);
  const TVV = get(`SELECT ur.user_id u FROM user_roles ur JOIN roles r ON r.id = ur.role_id WHERE r.key = 'consultant' AND ur.status = 'active' AND ur.branch_id = ? ORDER BY ur.user_id LIMIT 1`, MB).u as number;
  const lop = (branch: number, kind: string, tuanHienTai: number) => {
    seq += 1;
    const bat = d.mondayOfDate(addDays(TODAY, -7 * (tuanHienTai - 1)));
    return intake.createClass(P.admin, { code: `${branch === MB ? 'MB' : 'CP'} L4-${seq}`, branchId: branch, kind, isFastTrack: false, route: null, startDate: bat, startPeriodId: week.ensurePeriod(bat).id }).id as number;
  };
  const gan = (l: number, u: number) => conn.prepare(`INSERT INTO teacher_assignments (user_id, class_id, skill, is_core, effective_from, status, created_at) VALUES (?,?,NULL,1, '2026-01-01', 'active', ?)`)
    .run(u, l, new Date().toISOString());
  const em = (lopId: number, branch: number, tvv: number | null = TVV) => {
    seq += 1;
    const now = new Date().toISOString();
    const sid = Number(conn.prepare(`INSERT INTO students (student_code, full_name, normalized_name, branch_id, status, created_at, consultant_user_id) VALUES (?,?,?,?, 'active', ?, ?)`)
      .run(`PISA-L4-${seq}`, `Hoc vien L4 ${seq}`, `hoc vien l4 ${seq}`, branch, now, tvv).lastInsertRowid);
    conn.prepare(`INSERT INTO enrollments (student_id, class_id, status, started_at, created_at) VALUES (?,?, 'active', ?, ?)`).run(sid, lopId, TODAY, now);
    conn.prepare(`INSERT INTO learning_cycles (student_id, seq, route, programme_code, started_at, status, created_at) VALUES (?, 1, NULL, 'FOU', ?, 'active', ?)`).run(sid, TODAY, now);
    return sid;
  };
  const ra = (nguon: number, dich: number | null, sids: number[], o: { huong?: string; tuan?: string } = {}) => {
    const r = lenh.raLenh(P.admin, { lopNguonId: nguon, boiCanh: 'cuoi-khoa', tuanChung: null,
      dongs: sids.map((studentId) => ({ studentId, huong: o.huong ?? 'len_lop', toClassId: dich, tuan: o.tuan ?? TUAN[0],
        ...(o.huong === 'bao_luu' ? { ngayXemLai: addDays(TODAY, 30), lyDo: 'Gia đình xin bảo lưu' } : o.huong === 'dung_hoc' ? { lyDo: 'Gia đình xin dừng' } : {}) })) });
    assert(r.ok.length === sids.length, JSON.stringify(r.failed));
    xoaNho();
    return sids.map((s) => get('SELECT id FROM lenh_chuyen_lop WHERE student_id = ? ORDER BY id DESC LIMIT 1', s).id as number);
  };
  const tvvCua = (lenhId: number) => all('SELECT * FROM viec_bao_ph WHERE lenh_chuyen_id = ? ORDER BY id', lenhId);
  /** Mã chi nhánh HIỆN TẠI của em (lớp đang học → hồ sơ). */
  const cnCode = (sid: number) => get(`SELECT b.code FROM branches b WHERE b.id = COALESCE((SELECT c.branch_id FROM enrollments e JOIN classes c ON c.id = e.class_id
      WHERE e.student_id = ?1 AND e.status = 'active' ORDER BY e.id DESC LIMIT 1), (SELECT branch_id FROM students WHERE id = ?1))`, sid).code as string;
  const theoDoi = (loai: string, id: number, u: number) => !!get(`SELECT 1 AS c FROM viec_theo_doi WHERE loai = ? AND ref_id = ? AND user_id = ?`, loai, id, u);

  // ------------------------------------------------------------------ (1) GĐCN theo dõi mặc định Báo PH như Head
  check('LOI4-1 · GĐCN chi nhánh em tự vào người theo dõi mặc định của việc Báo PH (như Head) — cả khi Head giữ việc; GĐCN chi nhánh khác không; thôi vai → bỏ', () => thu(() => {
    const gd = tao([{ role: 'branch_director', branches: ['MB'] }]);
    const gdCp = tao([{ role: 'branch_director', branches: ['CP'] }]);
    const nguon = lop(MB, 'FOU', 8), dich = lop(MB, 'BE', 1);
    gan(nguon, gvCua(MB, 1)[0]);
    const [a, b] = [em(nguon, MB), em(nguon, MB, null)];
    const [la, lb] = ra(nguon, dich, [a, b]);
    const va = tvvCua(la)[0], vb = tvvCua(lb)[0];
    assert(va && vb, 'có việc Báo PH');
    assert(theoDoi('bao_ph', va.id, gd), 'GĐCN MB không theo dõi việc TVV giữ');
    assert(theoDoi('bao_ph', vb.id, gd), 'GĐCN MB không theo dõi việc Head giữ (em chưa TVV)');
    assert(!theoDoi('bao_ph', va.id, gdCp), 'GĐCN CP theo dõi việc em MB');
    assert(get(`SELECT nguon FROM viec_theo_doi WHERE loai = 'bao_ph' AND ref_id = ? AND user_id = ?`, va.id, gd).nguon === 'head', 'nguồn dòng theo dõi = head');
    xoaNho();
    const chip = gv.xemGiaoViec(P.admin, 'bao_ph', va.id).theoDoi.find((x: any) => x.id === gd);
    assert(chip?.vai === 'gdcn', `nhãn chip GĐCN: ${JSON.stringify(chip)}`);   // PTA rà #2300 P2-6
    /* Thôi vai GĐCN → dòng mặc định bỏ (cùng đường đổi vai của Head). */
    conn.prepare(`UPDATE user_roles SET status = 'inactive' WHERE user_id = ?`).run(gd);
    gv.theoDoiVaiBaoPh({ userId: gd });
    assert(!theoDoi('bao_ph', va.id, gd), 'thôi vai GĐCN mà còn theo dõi');
  }));

  // ------------------------------------------------------------------ (2) Head từ chối đề xuất Xử lý vi phạm → việc về người gửi
  /* Em đang có việc Xử lý vi phạm của GVCN (luật Ý thức) trong seed. */
  const xl: any = (() => {
    xoaNho();
    const it = (myWork(P.admin, { nguoi: 'tat-ca' } as any).items as any[]).find((i: any) => i.group === 'yt_xu_ly' && i.ownerId);
    return it ? { sid: it.studentId as number, gvcn: it.ownerId as number } : null;
  })();
  const guiVaTuChoi = (nguoiGui: any, skill?: string) => {
    const vids = [1, 2, 3].map((i) => viol.recordViolation(nguoiGui, { studentId: xl.sid, category: 'homework', ten: `LOI4 vi phạm ${i}`, occurredOn: addDays(TODAY, -i), ...(skill ? { skill } : {}) }).violation.id);
    const nhap = xu.deXuat(nguoiGui, xl.sid, { kind: 'wl_3', violationIds: vids, note: 'Em vi phạm nhiều lần, cần Head quyết' });
    att.addLink(nguoiGui, { ownerType: 'discipline_measure', ownerId: nhap.id, url: 'https://example.com/bang-chung', displayName: 'Biên bản' });
    xu.guiDeXuat(nguoiGui, nhap.id);
    xoaNho();
    assert(!gv.docViec('xu_ly', xl.sid).mo, 'đang chờ Head: việc Xử lý vi phạm còn mở');
    const id = get(`SELECT id FROM yeu_cau_duyet WHERE loai = 'y_thuc' AND doi_tuong_id = ? AND trang_thai = 'cho'`, nhap.id).id;
    yc.tuChoiYeuCau(P.admin, id, 'Chưa đủ căn cứ, xử lý theo thang');
    xoaNho();
    return id;
  };
  check('LOI4-2 · Head từ chối đề xuất Xử lý vi phạm → việc làm lại về NGƯỜI ĐÃ GỬI (người được giao); Huỷ quyết định → như trước', () => thu(() => {
    assert(xl, 'seed: cần em có việc Xử lý vi phạm');
    const pG = loadPrincipal(xl.gvcn);
    const gvbm = get(`SELECT u.id FROM users u JOIN user_roles ur ON ur.user_id = u.id JOIN roles r ON r.id = ur.role_id WHERE r.key = 'teacher' AND u.status = 'active'
        AND ur.branch_id = (SELECT branch_id FROM students WHERE id = ?) AND u.id != ? ORDER BY u.id LIMIT 1`, xl.sid, xl.gvcn).id as number;
    gv.doiPhuTrach(pG, 'xu_ly', xl.sid, { userId: gvbm, phuTrachCu: null });
    xoaNho();
    const ycId = guiVaTuChoi(loadPrincipal(gvbm));
    const v = gv.docViec('xu_ly', xl.sid);
    assert(v.mo && v.phuTrach.length === 1 && v.phuTrach[0] === gvbm, `sau từ chối: ${JSON.stringify({ mo: v.mo, pt: v.phuTrach })}`);
    const g = get('SELECT giao_luc, giao_boi FROM viec_xu_ly WHERE id = ?', xl.sid);
    assert(g.giao_luc && g.giao_boi === null, `LOI-4b: dòng vừa gán cần giao_luc, giao_boi NULL: ${JSON.stringify(g)}`);
    assert((myWork(loadPrincipal(gvbm), {} as any).items as any[]).some((i: any) => i.key === `yt_xu_ly:${xl.sid}`), 'người gửi không thấy việc làm lại');
    /* Huỷ quyết định từ chối → đề xuất chờ lại, khối giao việc về như lúc chờ. */
    yc.huyQuyetDinh(P.admin, ycId);
    xoaNho();
    assert(!gv.docViec('xu_ly', xl.sid).mo, 'huỷ từ chối: việc còn mở');
    assert(get('SELECT trang_thai AS t FROM viec_xu_ly WHERE id = ?', xl.sid).t === 'xong', 'huỷ từ chối: dòng giao việc không về xong');
  }));
  check('LOI4-2b · không ai được giao (GVCN tự gửi) → từ chối: việc về GVCN', () => thu(() => {
    assert(xl, 'seed');
    guiVaTuChoi(loadPrincipal(xl.gvcn), 'speaking');
    const v = gv.docViec('xu_ly', xl.sid);
    assert(v.mo && v.phuTrach[0] === xl.gvcn && !v.pt, `sau từ chối: ${JSON.stringify({ mo: v.mo, pt: v.phuTrach, giao: v.pt })}`);
  }));
  check('LOI4-2d · (LOI-4b) GVCN tự gửi rồi lớp ĐỔI GVCN trước khi Head từ chối → việc về GVCN hiện tại, không gán GVCN cũ', () => thu(() => {
    assert(xl, 'seed');
    const lopId = get(`SELECT class_id AS c FROM enrollments WHERE student_id = ? AND status = 'active' ORDER BY id DESC LIMIT 1`, xl.sid).c as number;
    const moi = get(`SELECT u.id FROM users u JOIN user_roles ur ON ur.user_id = u.id JOIN roles r ON r.id = ur.role_id WHERE r.key = 'teacher' AND u.status = 'active'
        AND ur.branch_id = (SELECT branch_id FROM students WHERE id = ?) AND u.id != ? ORDER BY u.id LIMIT 1`, xl.sid, xl.gvcn).id as number;
    const pCu = loadPrincipal(xl.gvcn);
    const vids = [1, 2, 3].map((i) => viol.recordViolation(pCu, { studentId: xl.sid, category: 'homework', ten: `LOI4d ${i}`, occurredOn: addDays(TODAY, -i), skill: 'speaking' }).violation.id);
    const nhap = xu.deXuat(pCu, xl.sid, { kind: 'wl_3', violationIds: vids, note: 'Em vi phạm nhiều lần, cần Head quyết' });
    att.addLink(pCu, { ownerType: 'discipline_measure', ownerId: nhap.id, url: 'https://example.com/bang-chung', displayName: 'Biên bản' });
    xu.guiDeXuat(pCu, nhap.id);
    /* Đợt mới đã có dòng "mo" chưa giao (vi phạm mới sau khi gửi) — trước LOI-4b dòng này bị gán GVCN cũ. */
    conn.prepare(`INSERT INTO viec_xu_ly (id, student_id, trang_thai, tao_luc) VALUES (?1, ?1, 'mo', ?2)
        ON CONFLICT(id) DO UPDATE SET trang_thai = 'mo', phu_trach_id = NULL, giao_boi = NULL, giao_luc = NULL`).run(xl.sid, TODAY);
    /* Đổi GVCN: phân công chủ nhiệm cũ kết thúc hôm qua, GV khác nhận từ hôm nay. */
    conn.prepare(`UPDATE teacher_assignments SET effective_to = ? WHERE class_id = ? AND is_core = 1 AND status = 'active'`).run(addDays(TODAY, -1), lopId);
    conn.prepare(`INSERT INTO teacher_assignments (user_id, class_id, skill, is_core, effective_from, status, created_at) VALUES (?,?,NULL,1,?, 'active', ?)`)
      .run(moi, lopId, TODAY, new Date().toISOString());
    const id = get(`SELECT id FROM yeu_cau_duyet WHERE loai = 'y_thuc' AND doi_tuong_id = ? AND trang_thai = 'cho'`, nhap.id).id;
    yc.tuChoiYeuCau(P.admin, id, 'Chưa đủ căn cứ');
    xoaNho();
    const r = get('SELECT phu_trach_id FROM viec_xu_ly WHERE id = ?', xl.sid);
    assert(r.phu_trach_id === null, `việc gán GVCN cũ: ${JSON.stringify(r)}`);
    const v = gv.docViec('xu_ly', xl.sid);
    assert(v.mo && v.phuTrach[0] === moi, `sau từ chối: ${JSON.stringify({ mo: v.mo, pt: v.phuTrach })}`);
  }));
  /** P2 rà #2320: người được giao (GV khác) gửi đề xuất; `truocQuyet` chạy giữa lúc gửi và lúc Head từ chối. Trả dòng `viec_xu_ly` + docViec sau từ chối. */
  const giaoGuiTuChoi = (truocQuyet: (ycId: number, gvbm: number) => void) => {
    const gvbm = get(`SELECT u.id FROM users u JOIN user_roles ur ON ur.user_id = u.id JOIN roles r ON r.id = ur.role_id WHERE r.key = 'teacher' AND u.status = 'active'
        AND ur.branch_id = (SELECT branch_id FROM students WHERE id = ?) AND u.id != ? ORDER BY u.id LIMIT 1`, xl.sid, xl.gvcn).id as number;
    gv.doiPhuTrach(loadPrincipal(xl.gvcn), 'xu_ly', xl.sid, { userId: gvbm, phuTrachCu: null });
    xoaNho();
    const pB = loadPrincipal(gvbm);
    const vids = [1, 2, 3].map((i) => viol.recordViolation(pB, { studentId: xl.sid, category: 'homework', ten: `LOI4e ${i}`, occurredOn: addDays(TODAY, -i) }).violation.id);
    const nhap = xu.deXuat(pB, xl.sid, { kind: 'wl_3', violationIds: vids, note: 'Em vi phạm nhiều lần, cần Head quyết' });
    att.addLink(pB, { ownerType: 'discipline_measure', ownerId: nhap.id, url: 'https://example.com/bang-chung', displayName: 'Biên bản' });
    xu.guiDeXuat(pB, nhap.id);
    const id = get(`SELECT id FROM yeu_cau_duyet WHERE loai = 'y_thuc' AND doi_tuong_id = ? AND trang_thai = 'cho'`, nhap.id).id;
    assert(JSON.parse(get('SELECT du_lieu FROM yeu_cau_duyet WHERE id = ?', id).du_lieu).giao === gvbm, 'du_lieu.giao phải là người được giao lúc gửi');
    truocQuyet(id, gvbm);
    xoaNho();
    yc.tuChoiYeuCau(P.admin, id, 'Chưa đủ căn cứ');
    xoaNho();
    return { gvbm, r: get('SELECT trang_thai, phu_trach_id FROM viec_xu_ly WHERE id = ?', xl.sid), v: gv.docViec('xu_ly', xl.sid) };
  };
  check('LOI4-2e · thẻ gửi trước LOI-4b (không có du_lieu.giao) → như cũ: người gửi không phải GVCN hiện tại = người được giao → việc về họ', () => thu(() => {
    assert(xl, 'seed');
    const { gvbm, v } = giaoGuiTuChoi((ycId) => {
      const d = JSON.parse(get('SELECT du_lieu FROM yeu_cau_duyet WHERE id = ?', ycId).du_lieu);
      delete d.giao;
      conn.prepare('UPDATE yeu_cau_duyet SET du_lieu = ? WHERE id = ?').run(JSON.stringify(d), ycId);
    });
    assert(v.mo && v.phuTrach[0] === gvbm, `thẻ cũ: ${JSON.stringify({ mo: v.mo, pt: v.phuTrach })}`);
  }));
  check('LOI4-2f · người được giao hết vai trước khi Head từ chối → không gán lại cho họ; việc về GVCN', () => thu(() => {
    assert(xl, 'seed');
    const { gvbm, r, v } = giaoGuiTuChoi((_id, u) => { conn.prepare(`UPDATE user_roles SET status = 'ended' WHERE user_id = ?`).run(u); });
    assert(r?.phu_trach_id !== gvbm || r?.trang_thai !== 'mo', `dòng gán người hết vai: ${JSON.stringify(r)}`);
    assert(!v.mo || v.phuTrach[0] === xl.gvcn, `sau từ chối: ${JSON.stringify({ mo: v.mo, pt: v.phuTrach })}`);
  }));
  check('LOI4-2c · (PTA rà #2300 P2-4) người được giao gửi; trước khi Head quyết, dòng đợt là "mo" chưa giao (vi phạm mới) → từ chối: việc về người gửi; hạn chọn đã quá bỏ', () => thu(() => {
    assert(xl, 'seed');
    const gvbm = get(`SELECT u.id FROM users u JOIN user_roles ur ON ur.user_id = u.id JOIN roles r ON r.id = ur.role_id WHERE r.key = 'teacher' AND u.status = 'active'
        AND ur.branch_id = (SELECT branch_id FROM students WHERE id = ?) AND u.id != ? ORDER BY u.id LIMIT 1`, xl.sid, xl.gvcn).id as number;
    gv.doiPhuTrach(loadPrincipal(xl.gvcn), 'xu_ly', xl.sid, { userId: gvbm, phuTrachCu: null });
    xoaNho();
    const pB = loadPrincipal(gvbm);
    const vids = [1, 2, 3].map((i) => viol.recordViolation(pB, { studentId: xl.sid, category: 'homework', ten: `LOI4c ${i}`, occurredOn: addDays(TODAY, -i) }).violation.id);
    const nhap = xu.deXuat(pB, xl.sid, { kind: 'wl_3', violationIds: vids, note: 'Em vi phạm nhiều lần, cần Head quyết' });
    att.addLink(pB, { ownerType: 'discipline_measure', ownerId: nhap.id, url: 'https://example.com/bang-chung', displayName: 'Biên bản' });
    xu.guiDeXuat(pB, nhap.id);
    /* Đợt mới đã có dòng "mo" chưa giao ai, mang hạn chọn đã quá. */
    conn.prepare(`UPDATE viec_xu_ly SET trang_thai = 'mo', phu_trach_id = NULL, giao_boi = NULL, han_chon = ? WHERE id = ?`).run(addDays(TODAY, -3), xl.sid);
    const id = get(`SELECT id FROM yeu_cau_duyet WHERE loai = 'y_thuc' AND doi_tuong_id = ? AND trang_thai = 'cho'`, nhap.id).id;
    yc.tuChoiYeuCau(P.admin, id, 'Chưa đủ căn cứ');
    xoaNho();
    const r = get('SELECT trang_thai, phu_trach_id, han_chon FROM viec_xu_ly WHERE id = ?', xl.sid);
    assert(r.trang_thai === 'mo' && r.phu_trach_id === gvbm && r.han_chon === null, `dòng sau từ chối: ${JSON.stringify(r)}`);
  }));
  check('LOI4-1b · (PTA rà #2300 P2-1) Head duyệt đề xuất → Báo PH vi phạm sinh: GĐCN chi nhánh em theo dõi nguồn "head" ngay lúc sinh', () => thu(() => {
    assert(xl, 'seed');
    const gd = tao([{ role: 'branch_director', branches: [cnCode(xl.sid)] }]);
    const pG = loadPrincipal(xl.gvcn);
    const vids = [1, 2, 3].map((i) => viol.recordViolation(pG, { studentId: xl.sid, category: 'homework', ten: `LOI4b ${i}`, occurredOn: addDays(TODAY, -i), skill: 'speaking' }).violation.id);
    const nhap = xu.deXuat(pG, xl.sid, { kind: 'wl_3', violationIds: vids, note: 'Em vi phạm nhiều lần, cần Head quyết' });
    att.addLink(pG, { ownerType: 'discipline_measure', ownerId: nhap.id, url: 'https://example.com/bang-chung', displayName: 'Biên bản' });
    xu.guiDeXuat(pG, nhap.id);
    yc.duyetYeuCau(P.admin, get(`SELECT id FROM yeu_cau_duyet WHERE loai = 'y_thuc' AND doi_tuong_id = ? AND trang_thai = 'cho'`, nhap.id).id);
    const v = get('SELECT id FROM viec_bao_ph WHERE measure_id = ?', nhap.id);
    assert(v, 'duyệt sinh Báo PH');
    assert(get(`SELECT nguon FROM viec_theo_doi WHERE loai = 'bao_ph' AND ref_id = ? AND user_id = ?`, v.id, gd)?.nguon === 'head', 'GĐCN không theo dõi nguồn head lúc sinh');
  }));

  // ------------------------------------------------------------------ (3) Bảo lưu / Dừng học sau khi đã báo PH → KHÔNG "Báo lại · Huỷ chuyển lớp"
  check('LOI4-3 · lệnh đã báo PH sửa sang Bảo lưu / Dừng học → KHÔNG sinh "Báo lại · Huỷ chuyển lớp"; Huỷ lệnh vẫn báo lại (giữ); migrate đóng việc cũ còn mở', () => thu(() => {
    const nguon = lop(MB, 'FOU', 8), dich = lop(MB, 'BE', 1);
    gan(nguon, gvCua(MB, 1)[0]);
    const [a, b, c] = [em(nguon, MB), em(nguon, MB), em(nguon, MB)];
    const ls = ra(nguon, dich, [a, b, c]);
    for (const l of ls) bp.ghiKetQuaBaoPh(loadPrincipal(TVV), { viecIds: [tvvCua(l)[0].id], ketQua: 'da_bao', ghiChu: 'Đã báo PH lớp mới' });
    ra(nguon, null, [a], { huong: 'bao_luu' });
    ra(nguon, null, [b], { huong: 'dung_hoc' });
    assert(tvvCua(ls[0]).length === 1 && tvvCua(ls[1]).length === 1, `Bảo lưu / Dừng học sinh việc: ${JSON.stringify([...tvvCua(ls[0]), ...tvvCua(ls[1])].map((v) => v.nhan))}`);
    lenh.huyLenh(P.admin, ls[2], 'thử');
    xoaNho();
    assert(tvvCua(ls[2]).at(-1)?.nhan === 'Báo lại · Huỷ chuyển lớp', 'Huỷ lệnh không còn báo lại');
    /* Dữ liệu cũ: việc "Báo lại · Huỷ chuyển lớp" đang mở, lệnh nay là Bảo lưu → migrate đóng; việc của lệnh huỷ giữ. */
    const cu = Number(conn.prepare(`INSERT INTO viec_bao_ph (student_id, nhan, han, trang_thai, tao_luc, lenh_chuyen_id, lenh_mau) VALUES (?, 'Báo lại · Huỷ chuyển lớp', ?, 'mo', ?, ?, 'huy')`)
      .run(a, TODAY, new Date().toISOString(), ls[0]).lastInsertRowid);
    /* PTA rà #2300 P2-5: lệnh Bảo lưu rồi bị huỷ (không lớp đích) — code không báo lại → migrate cũng đóng. */
    const cu2 = Number(conn.prepare(`INSERT INTO viec_bao_ph (student_id, nhan, han, trang_thai, tao_luc, lenh_chuyen_id, lenh_mau) VALUES (?, 'Báo lại · Huỷ chuyển lớp', ?, 'mo', ?, ?, 'huy')`)
      .run(b, TODAY, new Date().toISOString(), ls[1]).lastInsertRowid);
    conn.prepare(`UPDATE lenh_chuyen_lop SET trang_thai = 'huy' WHERE id = ?`).run(ls[1]);
    const lan: string[] = [];
    migratePrLoi4(conn, lan);
    assert(get('SELECT trang_thai, bo_ly_do FROM viec_bao_ph WHERE id = ?', cu).trang_thai === 'bo' && lan.some((x) => /Báo lại/.test(x)), `migrate: ${JSON.stringify(get('SELECT * FROM viec_bao_ph WHERE id = ?', cu))} ${lan}`);
    assert(get('SELECT trang_thai FROM viec_bao_ph WHERE id = ?', cu2).trang_thai === 'bo', 'migrate bỏ sót lệnh Bảo lưu đã huỷ');
    assert(tvvCua(ls[2]).at(-1).trang_thai === 'mo', 'migrate đóng nhầm việc của lệnh huỷ');
    const lan2: string[] = [];
    migratePrLoi4(conn, lan2);
    assert(!lan2.length, `chạy lại còn đổi: ${lan2}`);
  }));

  // ------------------------------------------------------------------ (4) GVCN lớp nguồn khác chi nhánh theo dõi việc BPXL
  check('LOI4-4 · chuyển lớp khác chi nhánh: GVCN lớp nguồn theo dõi + mở được việc BPXL "Nhận thông tin" (chỉ thấy em lớp mình); Head lớp nguồn (lớp không GVCN) không', () => thu(() => {
    const [gvCp] = gvCua(CP, 1);
    assert(gvCp && !get(`SELECT 1 AS c FROM user_roles WHERE user_id = ? AND status = 'active' AND (branch_id IS NULL OR branch_id = ?)`, gvCp, MB), 'seed: GV CP không có vai MB');
    const nguon = lop(CP, 'FOU', 8), nguon2 = lop(CP, 'FOU', 8), dich = lop(MB, 'BE', 1);
    gan(nguon, gvCp);
    const a = em(nguon, CP), b = em(nguon2, CP);
    ra(nguon, dich, [a]);
    ra(nguon2, dich, [b]);
    const nt = get(`SELECT id FROM viec_nhan_tin WHERE class_id = ? AND loai = 'chuyen_lop'`, dich);
    assert(nt, 'có việc Nhận thông tin');
    assert(theoDoi('nhan_tin', nt.id, gvCp), 'GVCN lớp nguồn CP không theo dõi việc BPXL lớp MB');
    const pGv = loadPrincipal(gvCp);
    const k = lpb.xemNhanTin(pGv, nt.id);
    assert(k.em.length === 1 && k.em[0].studentId === a, `GVCN thấy em: ${JSON.stringify(k.em.map((x: any) => x.studentId))}`);
    assert(ma(() => gv.xemGiaoViec(pGv, 'nhan_tin', nt.id)) === null, 'GVCN lớp nguồn mở việc 403');
    xoaNho();
    assert(gv.viecTheoDoi(pGv).nhom.some((g: any) => g.mo.some((x: any) => x.loai === 'nhan_tin' && x.refId === nt.id)), 'Đang theo dõi không có việc');
    assert(!theoDoi('nhan_tin', nt.id, P.cpManager.userId), 'Head lớp nguồn CP theo dõi việc BPXL');
    /* Phân công GVCN hết hiệu lực (effective_to đã qua — PTA rà #2300 P2-6) → không còn đọc qua đường theo dõi. */
    conn.prepare(`UPDATE teacher_assignments SET effective_to = ? WHERE user_id = ? AND class_id = ?`).run(addDays(TODAY, -1), gvCp, nguon);
    xoaNho();
    assert(ma(() => gv.xemGiaoViec(pGv, 'nhan_tin', nt.id)) === 403, 'thôi GVCN vẫn mở được việc');
  }));

  // ------------------------------------------------------------------ (5) ghi chú GVCN gửi Meeting: ai xem được Ý thức em thì xem
  const tf = get(`SELECT x.id, x.attempt_id, x.student_id, s.consultant_user_id AS tvv,
      (SELECT ta.user_id FROM enrollments e JOIN teacher_assignments ta ON ta.class_id = e.class_id AND ta.is_core = 1 AND ta.status = 'active' WHERE e.student_id = s.id AND e.status = 'active' LIMIT 1) AS gvcn
    FROM sos_coordination_actions x JOIN students s ON s.id = x.student_id AND s.archived_at IS NULL
    WHERE x.kind = 'talk_family' AND x.status = 'pending' AND s.consultant_user_id IS NOT NULL ORDER BY x.id LIMIT 1`);
  const xongBuocDau = (attemptId: number) => {
    for (const x of all(`SELECT id FROM sos_coordination_actions WHERE attempt_id = ? AND status = 'pending' AND kind NOT IN ('talk_family', 'bao_ph_tvv')`, attemptId)) {
      ph.confirmCoordination(P.admin, x.id, { performedOn: TODAY, note: 'GVCN đã làm việc này với em.' });
    }
    xoaNho();
  };
  const GHI = 'Em hay bỏ buổi, nhờ CX nói rõ hậu quả';
  check('LOI4-5 · ghi chú GVCN gửi Meeting: MỘT luật xem Ý thức em (`xemYThucHv`) cho panel Meeting · Tuyến · hồ sơ HV; SĐT PH vẫn theo `xemLienHePh`', () => thu(() => {
    assert(tf?.gvcn, 'seed: cần lượt có GVCN');
    xongBuocDau(tf.attempt_id);
    const pG = loadPrincipal(tf.gvcn);
    const m = ph.addCoordination(pG, tf.attempt_id, { kind: 'cx_meeting_family' });
    ph.confirmCoordination(pG, m.id, { performedOn: TODAY, note: GHI });
    xoaNho();
    const xep = get(`SELECT id, nguoi_luat FROM meeting_phan WHERE phoi_hop_id = ? AND phan = 'xep_lich'`, m.id);
    /* BPXL đang giữ Xếp lịch họp: thấy PH (xemLienHePh), KHÔNG thấy ghi chú GVCN (không xem Ý thức). */
    const bpxl = tao([{ role: 'scheduler', branches: ['MB'] }]);
    conn.prepare(`UPDATE meeting_phan SET nguoi_luat = ? WHERE id = ?`).run(bpxl, xep.id);
    xoaNho();
    const pB = loadPrincipal(bpxl);
    const mb = gv.xemMeeting(pB, m.id);
    assert(mb.boiCanh.phuHuynh && mb.boiCanh.ghiChu === null, `panel Meeting BPXL: ${JSON.stringify(mb.boiCanh)}`);
    const mg0 = gv.xemMeeting(pG, m.id);
    assert(mg0.boiCanh.ghiChu === GHI && mg0.boiCanh.phuHuynh, 'GVCN không thấy ghi chú ở panel Meeting');
    /* Tuyến: bước GVCN xác nhận Meeting. */
    const buoc = (p: any) => {
      xoaNho();
      const k = tuyen.khoaCuaViec('phoi_hop', m.id);
      assert(k, 'không có khoá tuyến của Meeting');
      return (tuyen.dungTuyen(p, k).buoc as any[]).find((b: any) => (b.noiDung ?? '').includes(GHI) || (b.khongQuyen && /Meeting/.test(b.ten ?? '')));
    };
    const bG = buoc(pG);
    assert(bG?.noiDung?.includes(GHI), `Tuyến GVCN: ${JSON.stringify(bG)}`);
    const bB = buoc(pB);
    assert(!bB?.noiDung?.includes(GHI), `Tuyến BPXL thấy ghi chú: ${JSON.stringify(bB)}`);
    /* Hồ sơ HV · Phối hợp: người xem không xem được Ý thức (BPXL) → ghi chú Meeting ẩn; GVCN thấy. */
    const note = (p: any) => (ph.coordinationOfStudent(p, tf.student_id).rows as any[]).flatMap((r) => r.actions).find((x: any) => x.id === m.id)?.note;
    assert(note(pG) === GHI, `hồ sơ GVCN: ${note(pG)}`);
    assert(ma(() => ph.coordinationOfStudent(pB, tf.student_id)) === null, 'BPXL không mở được Phối hợp của em');
    assert(!note(pB), `hồ sơ BPXL thấy ghi chú: ${note(pB)}`);
    assert(!bB || bB.khongQuyen, `Tuyến BPXL: bước Meeting không báo "không quyền": ${JSON.stringify(bB)}`);
  }));

  // ------------------------------------------------------------------ (6) C8: Trao đổi gia đình thêm sau Meeting → một Báo PH
  check('LOI4-6 · C8: Meeting đã có Báo PH (TVV đã ghi "chưa liên hệ được") rồi GVCN thêm Trao đổi gia đình → TVV có MỘT việc Báo PH mở của lượt', () => thu(() => {
    assert(tf?.gvcn, 'seed');
    /* Lượt chưa có Trao đổi gia đình. */
    conn.prepare('DELETE FROM viec_bao_ph WHERE phoi_hop_id = ?').run(tf.id);
    conn.prepare('DELETE FROM sos_coordination_actions WHERE id = ?').run(tf.id);
    xongBuocDau(tf.attempt_id);
    const pG = loadPrincipal(tf.gvcn), pT = loadPrincipal(tf.tvv);
    const m = ph.addCoordination(pG, tf.attempt_id, { kind: 'cx_meeting_family' });
    ph.confirmCoordination(pG, m.id, { performedOn: TODAY, note: GHI });
    const bm = get('SELECT id FROM viec_bao_ph WHERE phoi_hop_id = ? AND trang_thai = ?', m.id, 'mo');
    assert(bm, 'Meeting không sinh Báo PH');
    bp.ghiKetQuaBaoPh(pT, { viecIds: [bm.id], ketQua: 'chua_lien_he', ngay: TODAY, ghiChu: 'Gọi chưa được, sẽ gọi lại.' });
    ph.addCoordination(pG, tf.attempt_id, { kind: 'talk_family' });
    xoaNho();
    const mo = all(`SELECT v.id, v.nhan FROM viec_bao_ph v JOIN sos_coordination_actions x ON x.id = v.phoi_hop_id WHERE x.attempt_id = ? AND v.trang_thai = 'mo'`, tf.attempt_id);
    assert(mo.length === 1, `việc Báo PH mở của lượt: ${JSON.stringify(mo)}`);
    /* PTA rà #2300 P2-3: Báo PH Meeting đã gộp nhưng có lần ghi → Tuyến giữ bước, nhãn "Gộp vào Trao đổi gia đình". */
    xoaNho();
    const bs = tuyen.dungTuyen(pG, tuyen.khoaCuaViec('phoi_hop', m.id)).buoc as any[];
    assert(bs.some((b) => b.viec?.loai === 'bao_ph' && b.viec.id === bm.id && b.chiTiet === 'Gộp vào Trao đổi gia đình')
      && bs.some((b) => b.viec?.id === bm.id && /Chưa liên hệ được/.test(b.chiTiet ?? '')), `Tuyến: ${JSON.stringify(bs.map((b) => [b.ten, b.chiTiet]))}`);
    /* Dữ liệu cũ bị đôi (luật cũ không gộp việc đã ghi) → migrate gộp; chạy lại không đổi. */
    conn.prepare(`UPDATE viec_bao_ph SET trang_thai = 'mo', bo_ly_do = NULL, bo_luc = NULL WHERE id = ?`).run(bm.id);
    const lan: string[] = [];
    migratePrLoi4(conn, lan);
    assert(get('SELECT bo_ly_do AS l FROM viec_bao_ph WHERE id = ?', bm.id).l === 'system_gop_trao_doi' && lan.some((x) => /C8/.test(x)), `migrate gộp: ${lan}`);
    const lan2: string[] = [];
    migratePrLoi4(conn, lan2);
    assert(!lan2.length, `chạy lại còn đổi: ${lan2}`);
  }));
  check('LOI4-5b · (PTA rà #2300 P2-2) panel Báo PH Meeting: ghi chú GVCN chỉ người xem được Ý thức em — BPXL theo dõi tay không thấy; TVV / GVCN thấy', () => thu(() => {
    assert(tf?.gvcn, 'seed');
    conn.prepare('DELETE FROM viec_bao_ph WHERE phoi_hop_id = ?').run(tf.id);
    conn.prepare('DELETE FROM sos_coordination_actions WHERE id = ?').run(tf.id);
    xongBuocDau(tf.attempt_id);
    const pG = loadPrincipal(tf.gvcn), pT = loadPrincipal(tf.tvv);
    const m = ph.addCoordination(pG, tf.attempt_id, { kind: 'cx_meeting_family' });
    ph.confirmCoordination(pG, m.id, { performedOn: TODAY, note: GHI });
    const bm = get('SELECT id FROM viec_bao_ph WHERE phoi_hop_id = ?', m.id);
    assert(bm, 'Meeting không sinh Báo PH');
    const bpxl = tao([{ role: 'scheduler', branches: [cnCode(tf.student_id)] }]);
    gv.themTheoDoi(P.admin, 'bao_ph', bm.id, { userIds: [bpxl] });
    xoaNho();
    const xB = bp.xemViecBaoPh(loadPrincipal(bpxl), bm.id);
    assert(xB.boiCanh.ghiChu === null && xB.boiCanh.noiDung === null, `BPXL theo dõi: ${JSON.stringify(xB.boiCanh)}`);
    xoaNho();
    assert(bp.xemViecBaoPh(pT, bm.id).boiCanh.ghiChu === GHI, 'TVV không thấy ghi chú');
    xoaNho();
    assert(bp.xemViecBaoPh(pG, bm.id).boiCanh.ghiChu === GHI, 'GVCN không thấy ghi chú');
  }));
  check('LOI4-6b · C8: Meeting Báo PH chưa ai ghi → thêm Trao đổi gia đình gộp (một việc mở); Trao đổi gia đình xong trước Meeting → Meeting không sinh Báo PH (giữ)', () => thu(() => {
    assert(tf?.gvcn, 'seed');
    conn.prepare('DELETE FROM viec_bao_ph WHERE phoi_hop_id = ?').run(tf.id);
    conn.prepare('DELETE FROM sos_coordination_actions WHERE id = ?').run(tf.id);
    xongBuocDau(tf.attempt_id);
    const pG = loadPrincipal(tf.gvcn), pT = loadPrincipal(tf.tvv);
    const m = ph.addCoordination(pG, tf.attempt_id, { kind: 'cx_meeting_family' });
    ph.confirmCoordination(pG, m.id, { performedOn: TODAY, note: GHI });
    const t2 = ph.addCoordination(pG, tf.attempt_id, { kind: 'talk_family' });
    const mo = all(`SELECT v.id FROM viec_bao_ph v JOIN sos_coordination_actions x ON x.id = v.phoi_hop_id WHERE x.attempt_id = ? AND v.trang_thai = 'mo'`, tf.attempt_id);
    assert(mo.length === 1, `việc Báo PH mở: ${JSON.stringify(mo)}`);
    /* Trao đổi gia đình xong → Meeting thứ hai không sinh Báo PH. */
    const v = get('SELECT id FROM viec_bao_ph WHERE phoi_hop_id = ?', t2.id);
    bp.ghiKetQuaBaoPh(pT, { viecIds: [v.id], ketQua: 'da_bao', ngay: TODAY, ghiChu: 'Đã báo gia đình kết quả và lịch họp.' });
    const m2 = ph.addCoordination(pG, tf.attempt_id, { kind: 'cx_meeting_student' });
    ph.confirmCoordination(pG, m2.id, { performedOn: TODAY, note: GHI });
    assert(!get('SELECT 1 AS c FROM viec_bao_ph WHERE phoi_hop_id = ?', m2.id), 'Meeting sau Trao đổi gia đình xong vẫn sinh Báo PH');
  }));

  // ------------------------------------------------------------------ (7) cờ "+ Việc con" theo quyền máy chủ
  check('LOI4-7 · khối giao việc trả `quanViecCon` = đúng điều máy chủ cho tạo việc con: Head chi nhánh khác (đọc được qua vai GV + theo dõi) → false + 403; người giữ / Quản trị → true', () => thu(() => {
    const v = get(`SELECT v.id, v.student_id FROM viec_bao_ph v JOIN students s ON s.id = v.student_id WHERE v.trang_thai = 'mo' AND s.archived_at IS NULL
        AND (SELECT COALESCE((SELECT c.branch_id FROM enrollments e JOIN classes c ON c.id = e.class_id WHERE e.student_id = s.id AND e.status = 'active' ORDER BY e.id DESC LIMIT 1), s.branch_id)) = ?
      ORDER BY v.id LIMIT 1`, MB);
    assert(v, 'seed: cần việc Báo PH mở của em MB');
    const u = tao([{ role: 'manager', branches: ['CP'] }, { role: 'teacher', branches: ['MB'] }]);
    gv.themTheoDoi(P.admin, 'bao_ph', v.id, { userIds: [u] });
    xoaNho();
    const pU = loadPrincipal(u);
    const k = gv.xemGiaoViec(pU, 'bao_ph', v.id);
    assert(k.quanViecCon === false, `Head CP + GV MB: quanViecCon = ${k.quanViecCon}`);
    assert(ma(() => mg.createMgmtTask(pU, { title: 'Việc lạ', chaLoai: 'bao_ph', chaId: v.id })) === 403, 'máy chủ cho tạo');
    xoaNho();
    assert(gv.xemGiaoViec(P.admin, 'bao_ph', v.id).quanViecCon === true, 'Quản trị: quanViecCon false');
    const giu = gv.docViec('bao_ph', v.id).phuTrach[0];
    xoaNho();
    assert(gv.xemGiaoViec(loadPrincipal(giu), 'bao_ph', v.id).quanViecCon === true, 'người giữ: quanViecCon false');
  }));
}
