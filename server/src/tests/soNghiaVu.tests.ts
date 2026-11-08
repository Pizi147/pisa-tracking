/**
 * PHÉP KIỂM SỔ NGHĨA VỤ (spec `docs/superpowers/specs/2026-11-09-so-nghia-vu-design.md`, plan `docs/superpowers/plans/2026-11-09-so-nghia-vu.md`).
 * Mỗi ca một trường hợp của spec mục 4; ca đổi dữ liệu chạy trong giao dịch rồi ROLLBACK.
 */
import type { YThucTestKit } from './yThuc.tests.ts';

export async function runSoNghiaVuTests(t: YThucTestKit) {
  const { check, assert, assertThrows, conn } = t as any;
  const { migratePrNghiaVu } = await import('../migrate/prNghiaVu.ts');
  console.log('\nSỔ NGHĨA VỤ — bảng, tính dòng, ghi sổ, đếm');
  const thu = <T>(fn: () => T): T => { conn.exec('BEGIN IMMEDIATE'); try { return fn(); } finally { conn.exec('ROLLBACK'); } };

  check('NV-BANG · migrate tạo bảng nghia_vu + chỉ mục (chi_nhanh, han), (nguoi, han); chạy lặp không lỗi; khoa duy nhất', () => thu(() => {
    migratePrNghiaVu(conn, []);
    migratePrNghiaVu(conn, []);
    const cot = (conn.prepare(`SELECT name FROM pragma_table_info('nghia_vu')`).all() as any[]).map((c) => c.name);
    for (const c of ['id', 'loai', 'kieu', 'khoa', 'chi_nhanh', 'lop', 'hoc_vien', 'nguoi', 's_cheo', 'han_goc', 'han', 'tuan', 'xong_luc', 'nguoi_lam', 'khong_tinh', 'cap_nhat']) {
      assert(cot.includes(c), `thiếu cột ${c}`);
    }
    const cm = (conn.prepare(`SELECT name FROM sqlite_master WHERE type = 'index' AND tbl_name = 'nghia_vu'`).all() as any[]).map((r) => r.name);
    assert(cm.includes('idx_nghia_vu_cn_han') && cm.includes('idx_nghia_vu_nguoi_han'), `chỉ mục: ${cm.join(', ')}`);
    const chen = () => conn.prepare(`INSERT INTO nghia_vu (loai, kieu, khoa, chi_nhanh, han_goc, han, cap_nhat) VALUES ('bai', 'listening', 'bai:1:listening', 1, '2026-10-01', '2026-10-01', '2026-10-01')`).run();
    chen();
    assertThrows(chen, /UNIQUE/i, 'khoa trùng phải lỗi');
    assertThrows(() => conn.prepare(`INSERT INTO nghia_vu (loai, kieu, khoa, chi_nhanh, han_goc, han, cap_nhat) VALUES ('x', 'k', 'x:1', 1, '2026-10-01', '2026-10-01', '2026-10-01')`).run(), /CHECK/i, 'loai lạ phải lỗi');
  }));
}
