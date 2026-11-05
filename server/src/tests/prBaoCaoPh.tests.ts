/**
 * PHÉP KIỂM BAO-CAO-PH (đặc tả `docs/superpowers/specs/2026-11-05-bao-cao-ph/de-xuat.md` mục 4, 10–12): đợt tính từ lịch, em trong đợt,
 * quyền đọc / viết theo vai + phân công, "em đủ", điểm sửa tay không bị ghi đè, sửa sau hạn được.
 */
export async function runPrBaoCaoPhTests(t: { check: any; assert: any; assertThrows: any; conn: any; P: any; TODAY: string; classId: (c: string) => number }) {
  const { check, assert, assertThrows, conn, P, TODAY, classId } = t;
  const d: any = await import('../../../shared/domain/index.ts');
  const bc: any = await import('../classes/baoCaoPh.ts');
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

  check('BC-2 · đợt lớp thường: mở thứ Hai tuần thi, hạn Chủ nhật; chưa tới tuần thi → "Đợt đầu"', () => {
    const a = d.dsDotLop({ ft: false, batDau: null, progress: '2026-11-16', final: '2026-12-07' }, '2026-11-24');
    assert(a.ds.length === 1 && a.ds[0].ma === 'progress:2026-11-16' && a.ds[0].han === '2026-11-22', JSON.stringify(a));
    const b = d.dsDotLop({ ft: false, batDau: null, progress: '2026-11-16', final: '2026-12-07' }, '2026-11-10');
    assert(!b.ds.length && b.dau.ma === 'progress:2026-11-16', JSON.stringify(b));
    assert(d.soNgayQuaHan(a.ds[0], '2026-11-24') === 2, 'quá hạn 2 ngày');
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
}
