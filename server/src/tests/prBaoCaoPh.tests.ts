/**
 * PHÉP KIỂM BAO-CAO-PH (đặc tả `docs/superpowers/specs/2026-11-05-bao-cao-ph/de-xuat.md` mục 4, 10–12): đợt tính từ lịch, em trong đợt,
 * quyền đọc / viết theo vai + phân công, "em đủ", điểm sửa tay không bị ghi đè, sửa sau hạn được.
 */
export async function runPrBaoCaoPhTests(t: { check: any; assert: any; assertThrows: any; conn: any; P: any; TODAY: string; classId: (c: string) => number }) {
  const { check, assert, assertThrows, conn, P, TODAY, classId } = t;
  const d: any = await import('../../../shared/domain/index.ts');
  const bc: any = await import('../classes/baoCaoPh.ts');
  const xbc: any = await import('../classes/xuatBaoCaoPh.ts');
  const mw: any = await import('../worklist/mywork.ts');
  const sch: any = await import('../classes/schedule.ts');
  const { loadPrincipal }: any = await import('../permissions.ts');
  const { xoaNho } = await import('../platform/nguCanhRequest.ts');
  console.log('\nBAO-CAO-PH — báo cáo gửi phụ huynh: đợt, quyền, em đủ, điểm sửa tay');
  const thu = <T>(fn: () => T): T => {
    conn.exec('BEGIN IMMEDIATE');
    try { xoaNho(); return fn(); } finally { conn.exec('ROLLBACK'); xoaNho(); }
  };
  const nguoi = (vai: string, cn: string) => {
    const r = conn.prepare(`SELECT ur.user_id AS id FROM user_roles ur JOIN roles r ON r.id = ur.role_id JOIN branches b ON b.id = ur.branch_id
      WHERE r.key = ? AND b.code = ? ORDER BY ur.user_id LIMIT 1`).get(vai, cn) as any;
    return r ? loadPrincipal(r.id) : null;
  };

  check('BC-1 · đợt FT: mở ngày 20, hạn 30, tháng 2 hạn 28; trước ngày 20 đợt mới nhất là tháng trước', () => {
    const f = d.dotThang(2026, 2);
    assert(f.mo === '2026-02-20' && f.han === '2026-02-28', JSON.stringify(f));
    const a = d.dsDotLop({ ft: true, batDau: '2026-09-01', progress: null, final: null }, '2026-11-24');
    assert(a.ds.map((x: any) => x.ma).join() === 'thang:2026-11,thang:2026-10,thang:2026-09', JSON.stringify(a.ds));
    const b = d.dsDotLop({ ft: true, batDau: '2026-09-01', progress: null, final: null }, '2026-11-19');
    assert(b.ds[0].ma === 'thang:2026-10', 'trước ngày 20 → tháng 10');
    const c = d.dsDotLop({ ft: true, batDau: '2026-12-05', progress: null, final: null }, '2026-11-26');
    assert(!c.ds.length && c.dau.ma === 'thang:2026-12', 'lớp chưa khai giảng → Đợt đầu tháng 12: ' + JSON.stringify(c));
  });

  check('BC-2 · đợt lớp thường: mở thứ Hai tuần thi, hạn thứ Ba tuần sau (LG-1); chưa tới tuần thi → "Đợt đầu"', () => {
    const a = d.dsDotLop({ ft: false, batDau: null, progress: '2026-11-16', final: '2026-12-07' }, '2026-11-24');
    assert(a.ds.length === 1 && a.ds[0].ma === 'progress:2026-11-16' && a.ds[0].han === '2026-11-24', JSON.stringify(a));
    const b = d.dsDotLop({ ft: false, batDau: null, progress: '2026-11-16', final: '2026-12-07' }, '2026-11-10');
    assert(!b.ds.length && b.dau.ma === 'progress:2026-11-16', JSON.stringify(b));
    assert(d.soNgayQuaHan(a.ds[0], '2026-11-24') === 0 && d.soNgayQuaHan(a.ds[0], '2026-11-26') === 2, 'hạn thứ Ba 24/11, quá hạn 2 ngày ngày 26');
  });

  check('BC-3 · bộ phần theo chương trình: FT 6 phần (W1 W2), FOU L R W P (P không tiêu chí), BE/ELE L R W S; PET chưa có mẫu', () => {
    assert(d.boPhanBc('FT').map((x: any) => x.ngan).join() === 'Chung,L,R,W1,W2,S', 'FT');
    const fou = d.boPhanBc('FOU');
    assert(fou.map((x: any) => x.ngan).join() === 'Chung,L,R,W,P' && d.tieuChiPhan(fou[4]).length === 0 && fou[4].coDiem, 'FOU');
    assert(d.tieuChiPhan(fou[3]).length === 5, 'FOU W = PREP 5 tiêu chí');
    assert(d.boPhanBc('ELE').map((x: any) => x.ngan).join() === 'Chung,L,R,W,S' && d.boPhanBc('PET') === null, 'ELE / PET');
  });

  check('BC-4 · em đủ = mọi tiêu chí có mức + ô chữ; P (không tiêu chí) đủ khi có chữ; điểm không bắt buộc', () => {
    const L = d.boPhanBc('FT')[1];
    const du = { muc: { c1: 'tot', c2: 'kha', c3: 'kha', c4: 'yeu' }, chu: 'Nghe tốt' };
    assert(d.phanDu(L, du) && !d.phanDu(L, { ...du, chu: '  ' }) && !d.phanDu(L, { ...du, muc: { c1: 'tot' } }), 'L');
    assert(d.phanDu(d.boPhanBc('FOU')[4], { muc: {}, chu: 'x' }), 'P');
    assert(d.loiDiemSua(6.5, null) === null && d.loiDiemSua(6.3, null) && d.loiDiemSua(9.5, null), 'band');
    assert(d.loiDiemSua(17, 25) === null && d.loiDiemSua(26, 25) && d.loiDiemSua(17.5, 25), 'điểm / tổng');
  });

  const lop = classId('MB FT 101');
  check('BC-5 · quyền: GV phần L viết L, không viết R; GVCN viết Chung; QL viết hộ; Admin / TVV đọc, không viết', () => thu(() => {
    const trang = bc.trangBaoCaoPh(P.lrTeacher, lop, null);
    assert(trang.dot && trang.em.length > 0, 'có đợt + em');
    const sid = trang.em[0].id;
    const muc = { c1: 'tot', c2: 'tot', c3: 'kha', c4: 'kha' };
    const r = bc.luuBaoCaoPh(P.lrTeacher, lop, { dot: trang.dot, phan: 'listening', studentId: sid, muc, chu: 'Nghe ổn' });
    assert(r.du === true, 'đủ');
    if (!P.lrTeacher.assignments.some((a: any) => a.classId === lop && a.skill === 'reading')) {
      assertThrows(() => bc.luuBaoCaoPh(P.lrTeacher, lop, { dot: trang.dot, phan: 'reading', studentId: sid, muc: {}, chu: 'x' }), /./, 'GV L không viết R');
    }
    bc.luuBaoCaoPh(P.coreTeacher, lop, { dot: trang.dot, phan: 'chung', studentId: sid, muc: { i1: 'tot' }, chu: '' });
    bc.luuBaoCaoPh(P.mbManager, lop, { dot: trang.dot, phan: 'speaking', studentId: sid, muc: {}, chu: 'viết hộ' });
    for (const vai of ['office_admin', 'consultant']) {
      const x = nguoi(vai, 'MB');
      if (!x) continue;
      assert(bc.trangBaoCaoPh(x, lop, trang.dot).em.length === trang.em.length, `${vai} đọc được`);
      assertThrows(() => bc.luuBaoCaoPh(x, lop, { dot: trang.dot, phan: 'listening', studentId: sid, muc, chu: 'x' }), /./, `${vai} không viết`);
    }
    assertThrows(() => bc.trangBaoCaoPh(P.cpManager, lop, null), /./, 'QL chi nhánh khác không xem');
    const o = bc.trangBaoCaoPh(P.mbManager, lop, trang.dot).em.find((e: any) => e.id === sid).o;
    assert(o.listening === 'du' && o.chung === 'nhap' && o.speaking === 'nhap' && o.reading === null, JSON.stringify(o));
    assertThrows(() => bc.luuBaoCaoPh(P.lrTeacher, lop, { dot: 'thang:2099-01', phan: 'listening', studentId: sid, muc, chu: 'x' }), /./, 'đợt chưa mở');
    assertThrows(() => bc.luuBaoCaoPh(P.lrTeacher, lop, { dot: trang.dot, phan: 'listening', studentId: sid, muc: { c1: 'tuyet' }, chu: 'x' }), /./, 'mức lạ');
  }));

  check('BC-6 · em nghỉ học / lưu trữ không có trong đợt; viết cho em đó bị chặn', () => thu(() => {
    const trang = bc.trangBaoCaoPh(P.mbManager, lop, null);
    const sid = trang.em[0].id;
    conn.prepare(`UPDATE students SET status = 'finished', archived_at = ? WHERE id = ?`).run(TODAY, sid);
    xoaNho();
    assert(!bc.trangBaoCaoPh(P.mbManager, lop, trang.dot).em.some((e: any) => e.id === sid), 'em lưu trữ ẩn');
    assertThrows(() => bc.luuBaoCaoPh(P.mbManager, lop, { dot: trang.dot, phan: 'chung', studentId: sid, muc: {}, chu: 'x' }), /./, 'không viết');
  }));

  check('BC-7 · điểm sửa tay lưu + giữ; panel trả mức đợt trước để đặt sẵn; sửa sau hạn vẫn lưu', () => thu(() => {
    const trang = bc.trangBaoCaoPh(P.mbManager, lop, null);
    const [moi, cu] = trang.dsDot;
    assert(cu, 'lớp có ≥ 2 đợt');
    const sid = trang.em[0].id;
    bc.luuBaoCaoPh(P.mbManager, lop, { dot: cu.ma, phan: 'listening', studentId: sid, muc: { c1: 'tot', c2: 'kha' }, chu: 'tháng trước' });
    bc.luuBaoCaoPh(P.mbManager, lop, { dot: moi.ma, phan: 'listening', studentId: sid, muc: {}, chu: '', diemSua: 6.5 });
    assertThrows(() => bc.luuBaoCaoPh(P.mbManager, lop, { dot: moi.ma, phan: 'listening', studentId: sid, muc: {}, chu: '', diemSua: 6.3 }), /./, 'band lẻ');
    const pn = bc.phanBaoCaoPh(P.mbManager, lop, moi.ma, 'listening').em.find((e: any) => e.id === sid);
    assert(pn.banGhi.diemSua === 6.5 && pn.mucTruoc?.c1 === 'tot' && pn.sua?.luc, JSON.stringify(pn));
  }));

  /* ------------------------------------------------------------ PR b: Excel 3 mức + việc Admin */
  const admin = nguoi('office_admin', 'MB');
  const viet = (lopId: number, dot: string, em: { id: number }[], phan: { khoa: string }[]) => {
    const TC: Record<string, number> = { chung: 7, writing: 5 };
    const ks = (k: string) => (k === 'chung' ? ['i1', 'i2', 'i3', 'ii1', 'ii2', 'ii3', 'ii4'] : Array.from({ length: TC[k] ?? 4 }, (_, i) => `c${i + 1}`));
    for (const e of em) for (const p of phan) {
      bc.luuBaoCaoPh(P.mbManager, lopId, { dot, phan: p.khoa, studentId: e.id, muc: Object.fromEntries(ks(p.khoa).map((k) => [k, 'kha'])), chu: 'Ổn' });
    }
  };

  check('BC-8 · Excel một lớp đúng mẫu CP FT 131 (hàng 1 tên em; GVCN → Nhận xét chung → 7 tiêu chí; mỗi kỹ năng GV → Điểm → Đề xuất → tiêu chí; "Khá (Sound)"); một em = một cột; GV không xuất', () => thu(() => {
    const tr = bc.trangBaoCaoPh(P.mbManager, lop, null);
    viet(lop, tr.dot, tr.em.slice(0, 1), tr.phan);
    const r = xbc.xuatLopBaoCaoPh(P.mbManager, lop, tr.dot, null);
    const a = r.sheets[0].aoa;
    assert(r.sheets.length === 1 && r.sheets[0].ten === 'MB FT 101' && a[0].length === tr.em.length + 1, `${r.sheets[0].ten} ${a[0].length}`);
    assert(a.length === 1 + 9 + 5 * 7, `số hàng ${a.length}`);
    assert(a[1][0] === 'Giáo viên chủ nhiệm (Core teacher):' && a[2][0] === 'Nhận xét chung (General comment):' && a[3][1] === 'Khá (Sound)', JSON.stringify(a.slice(1, 4)));
    assert(a[10][0] === 'Giáo viên nghe (Listening Teacher) :' && a[11][0] === 'Điểm:\nScore:' && a[12][0] === 'Đề xuất cải thiện (Suggestion):', JSON.stringify(a.slice(10, 13).map((x: any) => x[0])));
    const motEm = xbc.xuatLopBaoCaoPh(P.mbManager, lop, tr.dot, tr.em[0].id).sheets[0].aoa;
    assert(motEm[0].length === 2 && motEm[0][1] === tr.em[0].ten, 'một em một cột');
    assertThrows(() => xbc.xuatLopBaoCaoPh(P.lrTeacher, lop, tr.dot, null), /./, 'GV không xuất');
    if (admin) assert(xbc.xuatLopBaoCaoPh(admin, lop, tr.dot, null).sheets.length === 1, 'Admin xuất được');
  }));

  check('BC-9 · Xuất chi nhánh theo tháng: lớp FT đợt tháng đó, lớp không có đợt vào "khongDot"; xem trước chỉ đếm; tên sheet không trùng', () => thu(() => {
    const tr = bc.trangBaoCaoPh(P.mbManager, lop, null);
    const thang = tr.dot.slice(6);
    const ids = (conn.prepare(`SELECT DISTINCT e.student_id id FROM enrollments e JOIN classes c ON c.id = e.class_id JOIN branches b ON b.id = c.branch_id WHERE b.code = 'MB' AND e.status = 'active'`).all() as any[]).map((r) => r.id);
    const xem = xbc.xuatBaoCaoPhNhieu(P.mbManager, { ids, thang, xemTruoc: true });
    assert(xem.ft.lop >= 1 && xem.tong === xem.ft.hocVien + xem.thuong.hocVien && Array.isArray(xem.khongDot), JSON.stringify(xem));
    const r = xbc.xuatBaoCaoPhNhieu(P.mbManager, { ids, thang });
    const ten = r.sheets.map((x: any) => x.ten);
    assert(ten.includes('MB FT 101') && new Set(ten.map((x: string) => x.toLowerCase())).size === ten.length && ten.every((x: string) => x.length <= 31), ten.join('|'));
    assert(r.dem.lop === r.sheets.length && r.dem.hocVien === xem.tong, JSON.stringify(r.dem));
    assertThrows(() => xbc.xuatBaoCaoPhNhieu(P.mbManager, { ids, thang: '2026-13' }), /./, 'tháng sai');
  }));

  check('BC-10 · Việc Admin "Xuất báo cáo PH": lớp đủ mọi em mọi phần → một việc (đủ, không hạn); QL không nhận', () => thu(() => {
    if (!admin) return;
    const tr = bc.trangBaoCaoPh(P.mbManager, lop, null);
    const truoc = xbc.viecXuatBaoCaoPh(admin, null).filter((v: any) => v.classId === lop && v.dot === tr.dot);
    assert(!truoc.length || truoc[0].thieu > 0, 'chưa đủ thì không có việc đủ');
    viet(lop, tr.dot, tr.em, tr.phan);
    const v = xbc.viecXuatBaoCaoPh(admin, null).find((x: any) => x.classId === lop && x.dot === tr.dot);
    assert(v && v.thieu === 0 && v.duLuc && v.soEm === tr.em.length, JSON.stringify(v));
    xoaNho();
    const items = mw.myWork(admin, {}).dong ?? [];
    assert(items.some((x: any) => x.group === 'xuat_bc_ph' && x.classId === lop && !x.due), 'dòng ở Công việc Admin');
    assert(!xbc.viecXuatBaoCaoPh(P.mbManager, null).length, 'QL không nhận');
  }));

  check('BC-12 · RA-LOI-0611 (PTA 06/11): file tháng lấy em của lớp LÚC HẠN như tab — em chuyển lớp sau hạn vẫn ở sheet lớp cũ', () => thu(() => {
    const tr = bc.trangBaoCaoPh(P.mbManager, lop, null);
    const dot = d.docMaDot(tr.dot);
    assert(dot && dot.han < TODAY && tr.em.length, 'cần đợt đã qua hạn có em: ' + tr.dot);
    const em = tr.em[0];
    const sau = d.addDaysIso(dot.han, 3);
    const moi = classId('MB FT 102');
    conn.prepare(`UPDATE enrollments SET status = 'transferred', ended_at = ? WHERE student_id = ? AND class_id = ? AND status = 'active'`).run(sau, em.id, lop);
    conn.prepare(`INSERT INTO enrollments (student_id, class_id, status, started_at, created_at) VALUES (?,?, 'active', ?, ?)`).run(em.id, moi, sau, sau);
    xoaNho();
    assert(bc.trangBaoCaoPh(P.mbManager, lop, tr.dot).em.some((e: any) => e.id === em.id), 'tab lớp cũ vẫn có em ở đợt đã qua hạn');
    const r = xbc.xuatBaoCaoPhNhieu(P.mbManager, { ids: [em.id], thang: dot.mo.slice(0, 7) });
    const sh = r.sheets.find((x: any) => x.ten === tr.lop.ma);
    assert(sh && sh.aoa[0].includes(em.ten), 'file tháng: em nằm ở sheet lớp cũ — ' + r.sheets.map((x: any) => `${x.ten}:${x.aoa[0].slice(1).join('/')}`).join(' | '));
  }));

  const dq: any = await import('../classes/dotBaoCaoPh.ts');
  check('BC-13 · BC-DOT-QL: QL / Admin bỏ đợt → mất chip, việc Admin, Excel tháng; bài giữ nguyên; khôi phục hiện lại; GV / TVV 403; nhiều lớp', () => thu(() => {
    const tr = bc.trangBaoCaoPh(P.mbManager, lop, null);
    const dot0 = tr.dot;
    assert(tr.quyetDot === true && tr.dsBo.length === 0 && tr.lop.ft === true, JSON.stringify([tr.quyetDot, tr.dsBo]));
    viet(lop, dot0, tr.em, tr.phan);
    const soBai = () => (conn.prepare('SELECT COUNT(*) n FROM bao_cao_ph WHERE dot = ? AND class_id = ?').get(dot0, lop) as any).n;
    const truoc = soBai();
    assert(truoc > 0, 'đã có bài');
    const admin_ = nguoi('office_admin', 'MB');
    if (admin_) assert(xbc.viecXuatBaoCaoPh(admin_, null).some((v: any) => v.classId === lop && v.dot === dot0), 'trước khi bỏ: có việc Admin');
    const ids = tr.em.map((e: any) => e.id);
    const thang = dot0.slice(6);
    const sheetCoLop = () => xbc.xuatBaoCaoPhNhieu(P.mbManager, { ids, thang, xemTruoc: true }).khongDot.includes(tr.lop.ma);
    assert(!sheetCoLop(), 'trước khi bỏ: lớp có đợt trong Excel tháng');

    /* quyền: GV, TVV không bỏ / thêm; QL chi nhánh khác không */
    const tvv = nguoi('consultant', 'MB');
    for (const x of [P.lrTeacher, P.coreTeacher, tvv, P.cpManager]) {
      if (!x) continue;
      assertThrows(() => dq.doiDotBaoCaoPh(x, { viec: 'bo', classIds: [lop], ma: dot0 }), /./, 'không quyền bỏ đợt');
      assertThrows(() => dq.doiDotBaoCaoPh(x, { viec: 'them', classIds: [lop], mo: TODAY, han: TODAY }), /./, 'không quyền thêm đợt');
    }
    assert(bc.trangBaoCaoPh(P.lrTeacher, lop, null).quyetDot === false, 'GV không thấy nút');

    const r = dq.doiDotBaoCaoPh(P.mbManager, { viec: 'bo', classIds: [lop], ma: dot0 });
    assert(r.lopDoi.join() === String(lop), JSON.stringify(r));
    xoaNho();
    const sau = bc.trangBaoCaoPh(P.mbManager, lop, null);
    assert(!sau.dsDot.some((x: any) => x.ma === dot0) && sau.dsBo.some((x: any) => x.ma === dot0), 'đợt chuyển sang dsBo');
    const xemBo = bc.trangBaoCaoPh(P.mbManager, lop, dot0);
    assert(xemBo.dot === null && xemBo.daBo?.ma === dot0 && !xemBo.em.length, 'chọn đợt bỏ → thẻ Không báo cáo');
    assert(bc.trangBaoCaoPh(P.lrTeacher, lop, null).dsBo.length === 0, 'GV không thấy đợt bỏ');
    assertThrows(() => bc.trangBaoCaoPh(P.lrTeacher, lop, dot0), /./, 'GV chọn đợt bỏ → không có đợt');
    assertThrows(() => bc.luuBaoCaoPh(P.lrTeacher, lop, { dot: dot0, phan: 'listening', studentId: ids[0], muc: {}, chu: 'x' }), /./, 'không viết vào đợt đã bỏ');
    const chip = bc.chipBaoCaoPh(P.mbManager, lop);
    assert(!chip || chip.dot !== dot0, 'chip không còn đợt đã bỏ');
    if (admin_) assert(!xbc.viecXuatBaoCaoPh(admin_, null).some((v: any) => v.classId === lop && v.dot === dot0), 'sau khi bỏ: không việc Admin');
    assert(sheetCoLop(), 'sau khi bỏ: lớp vào khongDot, không vào Excel tháng');
    assert(soBai() === truoc, 'bài đã viết giữ nguyên');
    assertThrows(() => dq.doiDotBaoCaoPh(P.mbManager, { viec: 'bo', classIds: [lop], ma: 'them:1' }), /./, 'đợt thêm dùng Xoá, không dùng Bỏ');

    dq.doiDotBaoCaoPh(P.mbManager, { viec: 'khoi-phuc', classIds: [lop], ma: dot0 });
    xoaNho();
    assert(bc.trangBaoCaoPh(P.mbManager, lop, null).dsDot.some((x: any) => x.ma === dot0) && soBai() === truoc, 'khôi phục: đợt hiện lại, bài còn');
    if (admin_) assert(xbc.viecXuatBaoCaoPh(admin_, null).some((v: any) => v.classId === lop && v.dot === dot0), 'khôi phục: việc Admin trở lại');
    if (admin_) assert(dq.doiDotBaoCaoPh(admin_, { viec: 'bo', classIds: [lop], ma: dot0 }).lopDoi.length === 1, 'Admin bỏ được');
    dq.doiDotBaoCaoPh(P.mbManager, { viec: 'khoi-phuc', classIds: [lop], ma: dot0 });

    /* nhiều lớp: lớp FT thứ hai cùng chi nhánh; lớp khác chi nhánh bị chặn */
    const lop2 = classId('MB FT 102');
    const nhieu = dq.doiDotBaoCaoPh(P.mbManager, { viec: 'bo', classIds: [lop, lop2], ma: dot0 });
    assert(nhieu.lopDoi.includes(lop) && nhieu.lopDoi.length + nhieu.boQua === 2, JSON.stringify(nhieu));
    assertThrows(() => dq.doiDotBaoCaoPh(P.mbManager, { viec: 'bo', classIds: [lop, classId('CP FT 130')], ma: dot0 }), /./, 'khác chi nhánh');
  }));

  check('BC-14 · BC-DOT-QL: thêm đợt bất chợt — GV viết được, điểm gốc theo lượt gần nhất trước hạn, chip / Excel như đợt thường; xoá mềm + khôi phục; lớp thường cũng thêm / bỏ được', () => thu(() => {
    const r = dq.doiDotBaoCaoPh(P.mbManager, { viec: 'them', classIds: [lop], ten: 'Đợt thử', mo: TODAY, han: d.addDaysIso(TODAY, 6) });
    const ma = r.ma[0].ma;
    assert(/^them:\d+$/.test(ma) && r.dotIds.length === 1, JSON.stringify(r));
    xoaNho();
    const tr = bc.trangBaoCaoPh(P.mbManager, lop, ma);
    assert(tr.dot === ma && tr.dsDot.find((x: any) => x.ma === ma)?.nhan === 'Đợt thử' && tr.dsDot.find((x: any) => x.ma === ma)?.them === true && tr.em.length > 0, JSON.stringify(tr.dsDot));
    const sid = tr.em[0].id;
    const w = bc.luuBaoCaoPh(P.lrTeacher, lop, { dot: ma, phan: 'listening', studentId: sid, muc: { c1: 'tot', c2: 'tot', c3: 'kha', c4: 'kha' }, chu: 'Đợt bất chợt' });
    assert(w.du === true, 'GV viết được đợt thêm');
    const ph = bc.phanBaoCaoPh(P.lrTeacher, lop, ma, 'listening');
    assert(ph.ft === true && ph.dot.ma === ma, 'điểm gốc đợt thêm FT theo band');
    /* Điểm gốc: câu hợp lệ cho đợt thêm, FT (Mock) và lớp thường (Progress / Final của lớp), lượt có tuần ≤ hạn */
    const dotThem = { ma, loai: 'them', mo: TODAY, han: d.addDaysIso(TODAY, 6) };
    const c0 = conn.prepare('SELECT * FROM classes WHERE id = ?').get(lop);
    for (const [, g] of bc.diemGoc(c0, dotThem, 'listening', tr.em.map((e: any) => e.id))) assert(/^MT\d+$/.test(g.luot) && g.tong === null, 'FT: lượt Mock');
    const lt = conn.prepare("SELECT c.id FROM classes c JOIN branches b ON b.id = c.branch_id WHERE b.code = 'MB' AND c.status = 'active' AND c.programme_code IN ('BE','ELE') ORDER BY c.id").get() as any;
    if (lt) {
      const ct = conn.prepare('SELECT * FROM classes WHERE id = ?').get(lt.id);
      const ids = (conn.prepare("SELECT student_id id FROM enrollments WHERE class_id = ? AND status = 'active'").all(lt.id) as any[]).map((x) => x.id);
      for (const [, g] of bc.diemGoc(ct, { ...dotThem, ma: 'them:0' }, 'listening', ids)) assert(['Progress', 'Final'].includes(g.luot) && g.tong != null, 'lớp thường: Progress / Final có tổng');
      /* lớp thường: bỏ + thêm */
      const tt = bc.trangBaoCaoPh(P.mbManager, lt.id, null);
      if (tt.dot) {
        dq.doiDotBaoCaoPh(P.mbManager, { viec: 'bo', classIds: [lt.id], ma: tt.dot });
        xoaNho();
        assert(!bc.trangBaoCaoPh(P.mbManager, lt.id, null).dsDot.some((x: any) => x.ma === tt.dot), 'lớp thường: đợt Progress / Final bỏ được');
      }
      const them2 = dq.doiDotBaoCaoPh(P.mbManager, { viec: 'them', classIds: [lt.id], mo: TODAY, han: TODAY });
      xoaNho();
      assert(bc.trangBaoCaoPh(P.mbManager, lt.id, them2.ma[0].ma).dot === them2.ma[0].ma, 'lớp thường: đợt thêm có tab');
    }
    /* việc Admin + Excel nhận đợt thêm như đợt thường */
    const admin_ = nguoi('office_admin', 'MB');
    viet(lop, ma, tr.em, tr.phan);
    if (admin_) assert(xbc.viecXuatBaoCaoPh(admin_, null).some((v: any) => v.classId === lop && v.dot === ma), 'đợt thêm đủ → việc Admin');
    const x = xbc.xuatLopBaoCaoPh(P.mbManager, lop, ma, null);
    assert(x.sheets.length === 1 && x.sheets[0].aoa[0].length === tr.em.length + 1, 'Excel một lớp theo đợt thêm');
    /* kiểm dữ liệu vào */
    assertThrows(() => dq.doiDotBaoCaoPh(P.mbManager, { viec: 'them', classIds: [lop], mo: d.addDaysIso(TODAY, 3), han: d.addDaysIso(TODAY, 9) }), /./, 'mở trong tương lai');
    assertThrows(() => dq.doiDotBaoCaoPh(P.mbManager, { viec: 'them', classIds: [lop], mo: TODAY, han: d.addDaysIso(TODAY, -1) }), /./, 'hạn trước ngày mở');
    assertThrows(() => dq.doiDotBaoCaoPh(P.mbManager, { viec: 'them', classIds: [], mo: TODAY, han: TODAY }), /./, 'chưa chọn lớp');

    /* xoá mềm: đợt mất, bài còn; hoàn xoá: hiện lại */
    const soBai = () => (conn.prepare('SELECT COUNT(*) n FROM bao_cao_ph WHERE dot = ?').get(ma) as any).n;
    const truoc = soBai();
    dq.doiDotBaoCaoPh(P.mbManager, { viec: 'xoa', dotIds: r.dotIds });
    xoaNho();
    assert(!bc.trangBaoCaoPh(P.mbManager, lop, null).dsDot.some((e: any) => e.ma === ma) && soBai() === truoc && truoc > 0, 'xoá mềm: đợt mất, bài còn');
    assertThrows(() => dq.doiDotBaoCaoPh(P.lrTeacher, { viec: 'hoan-xoa', dotIds: r.dotIds }), /./, 'GV không khôi phục');
    dq.doiDotBaoCaoPh(P.mbManager, { viec: 'hoan-xoa', dotIds: r.dotIds });
    xoaNho();
    assert(bc.trangBaoCaoPh(P.mbManager, lop, null).dsDot.some((e: any) => e.ma === ma), 'hoàn xoá: đợt hiện lại');
    /* nhật ký */
    const acts = (conn.prepare("SELECT DISTINCT action FROM audit_logs WHERE action LIKE 'bao_cao_ph.dot_%'").all() as any[]).map((a) => a.action);
    assert(['bao_cao_ph.dot_them', 'bao_cao_ph.dot_xoa', 'bao_cao_ph.dot_hoan_xoa'].every((a) => acts.includes(a)), acts.join());
  }));

  check('BC-15 · BC-DOT-QL: dsDotLop gộp đợt tính + đợt thêm − đợt bỏ; đợt chưa tới ngày mở không hiện', () => {
    const l = { ft: true, batDau: '2026-09-01', progress: null, final: null };
    const them = { ma: 'them:9', loai: 'them', mo: '2026-11-05', han: '2026-11-12', ten: null };
    const a = d.dsDotLop(l, '2026-11-24', { bo: new Set(['thang:2026-10']), them: [them, { ...them, ma: 'them:10', mo: '2026-12-01', han: '2026-12-05' }] });
    assert(a.ds.map((x: any) => x.ma).join() === 'thang:2026-11,them:9,thang:2026-09', a.ds.map((x: any) => x.ma).join());
    assert(a.daBo.map((x: any) => x.ma).join() === 'thang:2026-10' && a.dau === null, 'daBo / dau');
    assert(d.nhanDotBc(them, '2026-11-24').startsWith('Đợt ') && d.nhanDotBc({ ...them, ten: 'Kiểm tra giữa kỳ' }, '2026-11-24') === 'Kiểm tra giữa kỳ', d.nhanDotBc(them, '2026-11-24'));
    const b = d.dsDotLop(l, '2026-11-24');
    assert(b.ds.length === 3 && b.daBo.length === 0, 'không tuỳ chỉnh = như cũ');
  });

  check('BC-16 · RA-LOI-0711e: thêm 2 đợt bất chợt (mở sau đợt tháng) không làm mất việc Admin "Xuất báo cáo PH" của đợt tháng còn trong 30 ngày', () => thu(() => {
    const admin_ = nguoi('office_admin', 'MB');
    assert(!!admin_, 'seed thiếu Admin MB');
    const tr = bc.trangBaoCaoPh(P.mbManager, lop, null), dot0 = tr.dot;
    viet(lop, dot0, tr.em, tr.phan);   // lớp đủ hôm nay → việc "đủ" (7 ngày)
    const co = () => { xoaNho(); return xbc.viecXuatBaoCaoPh(admin_, null).some((v: any) => v.classId === lop && v.dot === dot0); };
    assert(dot0 && !dot0.startsWith('them:') && co(), `tiền đề: đợt tháng ${dot0} có việc Admin`);
    for (const n of [2, 1]) dq.doiDotBaoCaoPh(P.mbManager, { viec: 'them', classIds: [lop], mo: d.addDaysIso(TODAY, -n), han: d.addDaysIso(TODAY, -n) });
    assert(co(), `đợt tháng ${dot0} (≤ 30 ngày sau hạn) phải còn việc Admin sau khi thêm 2 đợt`);
  }));

  check('BC-17 · RA-LOI-0711j: chip tab — đợt mới nhất đã đủ không che đợt trước còn thiếu (≤ 7 ngày sau hạn); đợt đang mở vẫn thắng', () => thu(() => {
    const them = (mo: number, han: number) => dq.doiDotBaoCaoPh(P.mbManager, { viec: 'them', classIds: [lop], mo: d.addDaysIso(TODAY, mo), han: d.addDaysIso(TODAY, han) }).ma[0].ma as string;
    const a = them(-5, -3), b = them(-1, -1);
    xoaNho();
    const trB = bc.trangBaoCaoPh(P.mbManager, lop, b);
    viet(lop, b, trB.em, trB.phan);   // đợt mới nhất (B) đủ — đợt A còn thiếu, quá hạn 3 ngày
    xoaNho();
    let chip = bc.chipBaoCaoPh(P.mbManager, lop);
    assert(chip?.dot === a && chip.quaHan === 3, `chip phải nhắc đợt ${a} quá hạn 3 ngày: ${JSON.stringify(chip)}`);
    const moi = them(-1, 2);   // một đợt đang mở → chip đợt đang mở như cũ
    xoaNho();
    chip = bc.chipBaoCaoPh(P.mbManager, lop);
    assert(chip?.dot === moi && chip.quaHan === 0, `đợt đang mở thắng: ${JSON.stringify(chip)}`);
  }));

  check('BC-18 · BC-PH-MOC: đợt FT theo tuần khai giảng (như đầu trang), không theo start_date lệch; sửa khai giảng → start_date theo', () => thu(() => {
    const ky = (ws: string) => (conn.prepare('SELECT id FROM report_periods WHERE week_start = ?').get(ws) as any)?.id as number;
    const qua = ky(d.addDaysIso(TODAY, -42 - ((new Date(TODAY).getUTCDay() + 6) % 7)));
    assert(qua, 'seed thiếu kỳ 6 tuần trước');
    /* Như CP FT 130 bản chính: start_date nhập nhầm năm sau, tuần khai giảng đã qua. */
    conn.prepare('UPDATE classes SET start_date = ?, start_period_id = ? WHERE id = ?').run('2027-03-08', qua, lop);
    xoaNho();
    const c = conn.prepare('SELECT * FROM classes WHERE id = ?').get(lop);
    const r = bc.dotCuaLop(c, TODAY);
    assert(r.ds.length > 0 && !r.dau, `khai giảng 6 tuần trước → có đợt tháng, không "Đợt đầu": ${JSON.stringify({ ds: r.ds.map((x: any) => x.ma), dau: r.dau })}`);
    conn.prepare('UPDATE classes SET start_date = ? WHERE id = ?').run('2027-03-08', lop);
    sch.setClassProgress(P.mbManager, lop, { startPeriodId: qua });
    const ws = (conn.prepare('SELECT week_start FROM report_periods WHERE id = ?').get(qua) as any).week_start;
    const sd = (conn.prepare('SELECT start_date FROM classes WHERE id = ?').get(lop) as any).start_date;
    assert(sd === ws, `sửa tuần khai giảng → start_date = ${ws}, đang ${sd}`);
  }));

  const fs = await import('node:fs');
  const path = await import('node:path');
  const { fileURLToPath } = await import('node:url');
  const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..');
  const doc = (f: string) => fs.readFileSync(path.join(repo, f), 'utf8').replace(/\r\n/g, '\n');
  check('BC-11 · RA-LOI-0611: lưu xong quên bản vừa xem; "Sửa" điểm theo loại đợt; hết em thiếu → thẻ Xong; chip quá hạn tại chỗ; ✕ không nuốt cú bấm; ?dot= cũ về mặc định; mẫu Xuất theo vai', () => {
    const tab = doc('web/src/modules/classes/TabBaoCaoPh.tsx');
    assert(/moi\.daLuu = f;[\s\S]{0,300}quenBanXem\(`\/classes\/\$\{lopId\}\/bao-cao-ph`\)/.test(tab), 'lưu xong phải quên bản vừa xem (mở lại panel dựng form từ bản cũ → ghi đè chữ)');
    assert(tab.includes('const coTheSua = thang || tong != null;') && tab.includes('thang={data.ft}'), 'lớp thường chưa có điểm gốc: không có nút Sửa');
    assert(tab.includes('if (keTiep) setChon(keTiep.id); else setXong(true);'), 'hết em thiếu khác → thẻ Xong (PTA 06/11: không đứng im)');
    const lop_ = doc('web/src/modules/classes/ClassOverviewPage.tsx');
    assert(tab.includes('onDuHet(data.dot,') && lop_.includes('!(bc.quaHan && bcDu === bc.dot)'), 'chip quá hạn tắt tại chỗ khi tab thấy đủ (không thêm request)');
    assert(tab.includes('const dongPanel = dongSauKhiLuu(hang, onDong, baoChuaLuu);'), '✕ / Esc (đã qua hộp Bỏ chữ) không dùng cờ nút');
    assert(/error\?\.status === 404 && dot\) onDot\(null\)/.test(tab), '?dot= không còn → đợt mặc định');
    const ngan = doc('web/src/modules/students/NganXuatDs.tsx');
    assert(ngan.includes('VAI_XUAT_BC.includes(r)') && ngan.includes('coBc && (') && /setDem\(null\); setLoi\(null\);/.test(ngan), 'mẫu Báo cáo PH theo vai + đếm lại xoá lỗi cũ');
    /* Cùng một nguồn vai với máy chủ: Admin / TVV xuất được, GV không. */
    assert(d.VAI_XUAT_BC.join() === 'manager,system_admin,office_admin,consultant' && !d.VAI_XUAT_BC.includes('teacher'), d.VAI_XUAT_BC.join());
    /* Máy chủ (đối chiếu web): lớp thường, em chưa có điểm bài → sửa tay bị chặn (web không còn nút). */
    let daKiem = false;
    thu(() => {
      const lt = conn.prepare(`SELECT c.id FROM classes c JOIN branches b ON b.id = c.branch_id WHERE b.code = 'MB' AND c.status = 'active' AND c.programme_code IN ('BE','ELE') ORDER BY c.id`).all() as any[];
      for (const { id } of lt) {
        const tr = bc.trangBaoCaoPh(P.mbManager, id, null);
        if (!tr.dot || !tr.em.length) continue;
        const ph = bc.phanBaoCaoPh(P.mbManager, id, tr.dot, 'listening');
        const e = ph.em.find((x: any) => !x.goc);
        if (!e) continue;
        assertThrows(() => bc.luuBaoCaoPh(P.mbManager, id, { dot: tr.dot, phan: 'listening', studentId: e.id, diemSua: 6 }), /Chưa có điểm bài/, 'lớp thường thiếu điểm gốc');
        daKiem = true;
        return;
      }
    });
    assert(daKiem, 'seed không còn lớp thường MB có đợt + em thiếu điểm L — đổi lớp mẫu của phép kiểm');
  });
}
