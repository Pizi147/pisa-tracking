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
    assertThrows(() => sc.listChiNhanh(P.mbManager), /Quản trị/, 'QL xem được danh sách chi nhánh');
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
}
