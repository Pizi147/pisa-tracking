/**
 * PHÉP KIỂM P6 KHOA-LICH (chủ SP 24–25/10, N15 — đặc tả cải tiến 24/10 mục 3.5):
 *  T6 → CN (giờ VN) không thêm / huỷ / dời lịch MT (MT0, S Ex; không lớp thường) có tuần gốc / đích thuộc tuần trước / này / sau,
 *  trừ Quản trị hệ thống (vai gốc); ngoại lệ nhập điểm, "-" và vắng, duyệt thẻ dời, khôi phục; đường gián tiếp cho chạy.
 */
export async function runPrKhoaLichTests(t: any) {
  const { check, assert } = t;
  const d: any = await import('../../../shared/domain/index.ts');
  console.log('\nP6 KHOA-LICH — khoá đổi lịch MT thứ Sáu → Chủ nhật');

  check('KL-1 · khoaCuoiTuan: T5 được; T6–CN khoá 3 tuần; tuần ngoài được; Quản trị miễn; T2 mở lại', () => {
    const k = (tuan: (string | null)[], homNay: string, quanTri = false) => d.khoaCuoiTuan({ tuan, homNay, quanTri });
    assert(k(['2026-09-14'], '2026-09-17') === null, 'T5 tuần này được');
    assert(k(['2026-09-14'], '2026-09-18') === d.LOI_KHOA_CUOI_TUAN, 'T6 tuần này khoá');
    assert(k(['2026-09-07'], '2026-09-18') && k(['2026-09-21'], '2026-09-18'), 'T6 tuần trước / sau khoá');
    assert(k(['2026-10-05'], '2026-09-18') === null, 'tuần +3 được');
    assert(k(['2026-10-05', '2026-09-21'], '2026-09-18') !== null, '+3 → tuần sau khoá');
    assert(k([null, '2026-10-05'], '2026-09-18') === null, 'null bỏ qua');
    assert(k(['2026-09-14'], '2026-09-18', true) === null, 'Quản trị miễn');
    assert(k(['2026-09-14'], '2026-09-20') !== null, 'CN khoá');
    assert(k(['2026-09-14', '2026-09-21'], '2026-09-21') === null, 'T2 mở lại');
  });
}
