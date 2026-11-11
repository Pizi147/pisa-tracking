/**
 * PHÉP KIỂM CHI-NHANH-LIEN-HE (chủ SP 07/11, plan.md mục 4 "BÁO CÁO PH XUẤT PDF"): địa chỉ + SĐT theo chi nhánh — đầu tệp Báo cáo PH.
 *  · migrate thêm `branches.dia_chi`, `so_dien_thoai`, điền mặc định theo mã khi còn NULL; chạy lần hai không đổi gì; không đè giá trị đã có;
 *  · Quản trị › Chi nhánh: chỉ Quản trị hệ thống xem / sửa; lưu ghi nhật ký (trước / sau) để Hoàn tác; kiểm ô.
 */
export async function runPrChiNhanhLienHeTests(t: { check: any; assert: any; assertThrows: any; conn: any; P: any }) {
  const { check, assert, assertThrows, conn, P } = t;
  const mg: any = await import('../migrate/prChiNhanhLienHe.ts');
  const sc: any = await import('../platform/sysconfig.ts');
  console.log('\nCHI-NHANH-LIEN-HE — địa chỉ + SĐT chi nhánh (đầu tệp Báo cáo PH)');
  const get = (sql: string, ...a: unknown[]) => conn.prepare(sql).get(...a) as any;
  const thu = <T>(fn: () => T): T => {
    conn.exec('BEGIN IMMEDIATE');
    try { return fn(); } finally { conn.exec('ROLLBACK'); }
  };
  const cp = () => get(`SELECT id, name, dia_chi, so_dien_thoai FROM branches WHERE code = 'CP'`);

  check('CNL-1 · seed có địa chỉ mặc định theo mã + SĐT CP; chi nhánh khác SĐT trống', () => {
    assert(cp().dia_chi === 'Số 48 Tô Hiệu, Cẩm Phả, Quảng Ninh' && cp().so_dien_thoai === '082.228.9288', JSON.stringify(cp()));
    const mb = get(`SELECT dia_chi, so_dien_thoai FROM branches WHERE code = 'MB'`);
    assert(mb.dia_chi === 'A2-16-17 KĐT Monbay, Hạ Long, Quảng Ninh' && mb.so_dien_thoai == null, JSON.stringify(mb));
  });

  check('CNL-2 · migrate trên DB cũ (chưa có cột): thêm cột + điền mặc định; lần hai không làm gì; không đè giá trị đã sửa', () => thu(() => {
    conn.exec('ALTER TABLE branches DROP COLUMN dia_chi');
    conn.exec('ALTER TABLE branches DROP COLUMN so_dien_thoai');
    const a1: string[] = [];
    mg.migratePrChiNhanhLienHe(conn, a1);
    assert(a1.length === 1, JSON.stringify(a1));
    assert(cp().dia_chi === 'Số 48 Tô Hiệu, Cẩm Phả, Quảng Ninh' && cp().so_dien_thoai === '082.228.9288', JSON.stringify(cp()));
    conn.prepare(`UPDATE branches SET dia_chi = 'Địa chỉ mới', so_dien_thoai = '' WHERE code = 'CP'`).run();
    const a2: string[] = [];
    mg.migratePrChiNhanhLienHe(conn, a2);
    assert(a2.length === 0, `lần hai: ${JSON.stringify(a2)}`);
    assert(cp().dia_chi === 'Địa chỉ mới' && cp().so_dien_thoai === '', `đè giá trị đã sửa: ${JSON.stringify(cp())}`);
  }));

  check('CNL-3 · Quản trị › Chi nhánh: QT xem + sửa (nhật ký trước / sau); QL bị chặn; tên trống / chữ quá dài báo lỗi', () => thu(() => {
    const ds = sc.listChiNhanh(P.admin);
    const dong = ds.find((b: any) => b.code === 'CP');
    assert(dong && dong.diaChi === cp().dia_chi && dong.soDienThoai === '082.228.9288', JSON.stringify(dong));
    /* QTV2-CAU-HINH (chủ SP 11/11 "QL xem"): Quản lý XEM được danh sách chi nhánh, vẫn không sửa được; GV bị chặn. */
    assert(sc.listChiNhanh(P.mbManager).some((b: any) => b.code === 'CP'), 'QL không xem được danh sách chi nhánh');
    assertThrows(() => sc.listChiNhanh(P.lrTeacher), /Quản trị/, 'GV xem được danh sách chi nhánh');
    assertThrows(() => sc.luuChiNhanh(P.mbManager, cp().id, { name: 'X', diaChi: '', soDienThoai: '' }), /Quản trị/, 'QL sửa được chi nhánh');
    const r = sc.luuChiNhanh(P.admin, cp().id, { name: ' Cẩm Phả 2 ', diaChi: ' Số 1 Tô Hiệu ', soDienThoai: '' });
    assert(r.truoc.diaChi === 'Số 48 Tô Hiệu, Cẩm Phả, Quảng Ninh' && r.truoc.soDienThoai === '082.228.9288', `trước: ${JSON.stringify(r)}`);
    assert(cp().name === 'Cẩm Phả 2' && cp().dia_chi === 'Số 1 Tô Hiệu' && cp().so_dien_thoai == null,JSON.stringify(cp()));
    const nk = get(`SELECT action, before_json, after_json FROM audit_logs WHERE entity_type = 'branch' ORDER BY id DESC LIMIT 1`);
    assert(nk?.action === 'chi_nhanh.sua' && JSON.parse(nk.before_json).soDienThoai === '082.228.9288' && JSON.parse(nk.after_json).diaChi === 'Số 1 Tô Hiệu',
      `nhật ký: ${JSON.stringify(nk)}`);
    assertThrows(() => sc.luuChiNhanh(P.admin, cp().id, { name: '  ', diaChi: '', soDienThoai: '' }), /tên/i, 'tên trống vẫn lưu');
    assertThrows(() => sc.luuChiNhanh(P.admin, cp().id, { name: 'CP', diaChi: 'x'.repeat(301), soDienThoai: '' }), /Tối đa/, 'địa chỉ quá dài vẫn lưu');
    assertThrows(() => sc.luuChiNhanh(P.admin, 99999, { name: 'CP', diaChi: '', soDienThoai: '' }), /Không tìm thấy/, 'chi nhánh không có vẫn lưu');
  }));
  /* N04 (SUA-RA-1311, đề bài 13/11): hai Quản trị sửa cùng lúc / Hoàn tác sau lần sửa mới hơn / gửi lại — không đè nhau, dữ liệu + nhật ký một giao dịch. */
  const nk = () => conn.prepare(`SELECT COUNT(*) n FROM audit_logs WHERE entity_type = 'branch' AND action = 'chi_nhanh.sua'`).get().n as number;
  const A = P.admin;
  /* B = Quản trị thứ hai nếu seed có (không thì cùng tài khoản ở tab khác — cùng luật). */
  const { loadPrincipal } = await import('../permissions.ts');
  const uB = conn.prepare(`SELECT ur.user_id u FROM user_roles ur JOIN roles r ON r.id = ur.role_id WHERE r.key = 'system_admin' AND ur.user_id != ? LIMIT 1`).get(A.userId)?.u;
  const B = uB ? loadPrincipal(uB) : A;
  check('CNL-4 (N04) · A sửa Địa chỉ, B sửa SĐT (cùng bản đã thấy) → cả hai giữ; mỗi lần chỉ ghi ô đổi', () => thu(() => {
    const g = cp();
    const n0 = nk();
    const ra = sc.luuChiNhanh(A, g.id, { diaChi: 'Địa chỉ A', cu: { diaChi: g.dia_chi } });
    sc.luuChiNhanh(B, g.id, { soDienThoai: '0900 000 001', cu: { soDienThoai: g.so_dien_thoai } });
    assert(cp().dia_chi === 'Địa chỉ A' && cp().so_dien_thoai === '0900 000 001' && cp().name === g.name, `đè ô của người kia: ${JSON.stringify(cp())}`);
    assert(JSON.stringify(ra.truoc) === JSON.stringify({ diaChi: g.dia_chi }) && JSON.stringify(ra.doi) === '["diaChi"]', `truoc / doi: ${JSON.stringify(ra)}`);
    const l = conn.prepare(`SELECT before_json, after_json FROM audit_logs WHERE entity_type = 'branch' ORDER BY id DESC LIMIT 1`).get();
    assert(nk() === n0 + 2 && l.before_json === JSON.stringify({ soDienThoai: g.so_dien_thoai }) && l.after_json === JSON.stringify({ soDienThoai: '0900 000 001' }),
      `nhật ký: ${nk() - n0} · ${JSON.stringify(l)}`);
  }));
  check('CNL-5 (N04) · cùng ô: B lưu từ bản cũ sau A → 409 nói A sửa thành gì, không ghi, không nhật ký; B lưu lại với bản mới → ghi', () => thu(() => {
    const g = cp();
    sc.luuChiNhanh(A, g.id, { diaChi: 'Địa chỉ A', cu: { diaChi: g.dia_chi } });
    const n0 = nk();
    const e = (() => { try { sc.luuChiNhanh(B, g.id, { diaChi: 'Địa chỉ B', cu: { diaChi: g.dia_chi } }); return null; } catch (x: any) { return x; } })();
    assert(e?.status === 409 && /Địa chỉ CP vừa được .* sửa thành “Địa chỉ A”/.test(e.message) && e.details?.hien === 'Địa chỉ A' && e.details?.truong === 'diaChi',
      `xung đột: ${e?.status} ${e?.message} ${JSON.stringify(e?.details)}`);
    assert(cp().dia_chi === 'Địa chỉ A' && nk() === n0, `đã đè / ghi nhật ký: ${cp().dia_chi} · ${nk() - n0}`);
    sc.luuChiNhanh(B, g.id, { diaChi: 'Địa chỉ B', cu: { diaChi: 'Địa chỉ A' } });
    assert(cp().dia_chi === 'Địa chỉ B', cp().dia_chi);
  }));
  check('CNL-6 (N04) · A Hoàn tác Địa chỉ sau khi B sửa Địa chỉ → 409, giữ bản B; Hoàn tác khi B sửa ô KHÁC → về như cũ, ô của B giữ', () => thu(() => {
    const g = cp();
    const r = sc.luuChiNhanh(A, g.id, { diaChi: 'Địa chỉ A', cu: { diaChi: g.dia_chi } });
    sc.luuChiNhanh(B, g.id, { diaChi: 'Địa chỉ B', cu: { diaChi: 'Địa chỉ A' } });
    let e: any = null;
    try { sc.luuChiNhanh(A, g.id, { diaChi: r.truoc.diaChi, cu: { diaChi: 'Địa chỉ A' } }); } catch (x) { e = x; }
    assert(e?.status === 409 && cp().dia_chi === 'Địa chỉ B', `Hoàn tác đè bản mới hơn: ${e?.status} · ${cp().dia_chi}`);
    const r2 = sc.luuChiNhanh(A, g.id, { diaChi: 'Địa chỉ A2', cu: { diaChi: 'Địa chỉ B' } });
    sc.luuChiNhanh(B, g.id, { soDienThoai: '0900 000 002', cu: { soDienThoai: g.so_dien_thoai } });
    sc.luuChiNhanh(A, g.id, { diaChi: r2.truoc.diaChi, cu: { diaChi: 'Địa chỉ A2' } });
    assert(cp().dia_chi === 'Địa chỉ B' && cp().so_dien_thoai === '0900 000 002', `Hoàn tác: ${JSON.stringify(cp())}`);
  }));
  check('CNL-7 (N04) · gửi lại y hệt (mất phản hồi) → không lỗi, không ghi, không nhật ký đôi; lỗi giữa chừng → không nửa ghi', () => thu(() => {
    const g = cp();
    const body = { diaChi: 'Địa chỉ C', cu: { diaChi: g.dia_chi } };
    sc.luuChiNhanh(A, g.id, body);
    const n0 = nk();
    const r = sc.luuChiNhanh(A, g.id, body);
    assert(cp().dia_chi === 'Địa chỉ C' && nk() === n0 && r.doi.length === 0, `gửi lại: ${nk() - n0} · ${JSON.stringify(r)}`);
    /* Tên trống + địa chỉ mới cùng lần: lỗi tên → địa chỉ không đổi (một giao dịch). */
    assertThrows(() => sc.luuChiNhanh(A, g.id, { diaChi: 'Địa chỉ D', name: ' ' }), /tên/i, 'tên trống vẫn lưu');
    assert(cp().dia_chi === 'Địa chỉ C' && nk() === n0, `nửa ghi: ${cp().dia_chi}`);
  }));
}
