/**
 * PHÉP KIỂM PR-Rc1: Cần chấm · Lịch Test · lưới chấm chung (spec 2026-09-22-ux-toan-web-truoc-deploy-design §3.5, §6;
 * kiểm kê §1.4 R8/R13/R15/R16, §1.7 RB-5, §6 DS02). Kế hoạch: docs/superpowers/plans/2026-09-22-pr-rc1-cham-diem.md.
 *
 * Harness do `run.ts` sở hữu và truyền vào; file này không tự mở database. Học viên/lượt dùng ở đây do CHÍNH file này
 * tạo, không đụng dữ liệu của bộ demo (trừ nơi ghi rõ là đọc lớp demo MB-FOU 12 / MB-FT 101).
 */
import type { YThucTestKit } from './yThuc.tests.ts';

export async function runChamDiemTests(t: YThucTestKit) {
  const { check, assert, assertThrows, conn, TODAY, P, classId } = t;
  const d: any = await import('../../../shared/domain/index.ts');
  console.log('\nPR-Rc1 · Cần chấm + Lịch Test + lưới chấm');

  check('PR-Rc1 · Q10 Nhóm Cần chấm: quá hạn / tuần này / sắp tới; chưa có hạn là "Sắp tới"', () => {
    const eq = (got: string, want: string, m: string) => assert(got === want, `${m}: "${got}" ≠ "${want}"`);
    // Hôm nay 22/09/2026 (thứ Ba), tuần lịch 21/09 – 27/09.
    const homNay = '2026-09-22'; const cuoi = '2026-09-27';
    eq(d.mucCanCham('2026-09-21', homNay, cuoi), 'qua-han', 'Hạn hôm qua');
    eq(d.mucCanCham('2026-09-22', homNay, cuoi), 'tuan-nay', 'Hạn đúng hôm nay vẫn còn kịp');
    eq(d.mucCanCham('2026-09-27', homNay, cuoi), 'tuan-nay', 'Hạn Chủ nhật cuối tuần này');
    eq(d.mucCanCham('2026-09-28', homNay, cuoi), 'sap-toi', 'Hạn tuần sau');
    eq(d.mucCanCham(null, homNay, cuoi), 'sap-toi', 'Chưa có hạn thì KHÔNG phải quá hạn');
    const nhom = d.nhomCanCham(
      [{ han: '2026-09-28' }, { han: null }, { han: '2026-09-21' }, { han: '2026-09-23' }],
      { homNay, cuoiTuanNay: cuoi },
    );
    eq(nhom.map((x: any) => `${x.muc}:${x.dong.length}`).join(','), 'qua-han:1,tuan-nay:1,sap-toi:2', 'Thứ tự và số dòng');
    eq(nhom[0].nhan, 'Quá hạn', 'Chữ mục 1');
    eq(nhom[1].nhan, 'Tuần này', 'Chữ mục 2');
    eq(nhom[2].nhan, 'Sắp tới', 'Chữ mục 3');
  });

  check('PR-Rc1 · Q7 Ô lưới lớp thường: hai số, viền vàng khi tổng khác tổng của cột', () => {
    const o = (diem: any, tong: any, tongCot: any) => d.oLuoiThuong({ diem, tong, tongCot });
    assert(o(33, 40, 40).hien === '33/40' && !o(33, 40, 40).vienVang, 'Cùng tổng cột thì không viền vàng');
    assert(o(27, 38, 40).vienVang, 'Khác tổng cột thì viền vàng');
    assert(!o(27, 38, null).vienVang, 'Cột chưa đặt tổng chung thì không có gì để khác');
    assert(o(null, null, 40).trong && o(null, null, 40).hien === '', 'Chưa nhập là ô trống, không phải 0');
    assert(o(null, 40, 40).trong, 'Có tổng mà chưa có điểm vẫn là chưa nhập');
  });

  check('PR-Rc1 · Q9 Kết quả lớp thường: thiếu điểm KHÁC chưa đạt', () => {
    const eq = (got: any, want: string, m: string) => assert(got === want, `${m}: "${got}" ≠ "${want}"`);
    eq(d.ketQuaThuong({ dat: 2, daCham: 2, tong: 4, thieu: ['W', 'S'] }).chinh, 'Đạt 2/2 môn đã chấm', 'Mới chấm hai môn');
    eq(d.ketQuaThuong({ dat: 2, daCham: 2, tong: 4, thieu: ['W', 'S'] }).phu, 'còn W, S chưa chấm', 'Dòng phụ gọi tên môn');
    eq(d.ketQuaThuong({ dat: 3, daCham: 4, tong: 4, thieu: [] }).chinh, 'Đạt 3/4 môn', 'Đủ điểm thì bỏ chữ "đã chấm"');
    eq(d.ketQuaThuong({ dat: 0, daCham: 0, tong: 4, thieu: ['L', 'R', 'W', 'S'] }).chinh, 'Chưa nhập điểm', 'Chưa có gì');
    assert(d.ketQuaThuong({ dat: 0, daCham: 0, tong: 4, thieu: ['L', 'R', 'W', 'S'] }).phu === null,
      'Chưa nhập môn nào thì không liệt kê cả bốn môn (G-3)');
  });

  check('PR-Rc1 · DS02 đếm ngược trong ô dấu "-" (chỉ chữ, không tô đỏ)', () => {
    const eq = (got: any, want: any, m: string) => assert(got === want, `${m}: "${got}" ≠ "${want}"`);
    eq(d.demNguocSuaDau('2026-09-27', '2026-09-25'), 'Còn 2 ngày để sửa', 'Hai ngày');
    eq(d.demNguocSuaDau('2026-09-27', '2026-09-26'), 'Còn 1 ngày để sửa', 'Một ngày');
    eq(d.demNguocSuaDau('2026-09-27', '2026-09-27'), 'Còn hôm nay để sửa', 'Đúng Chủ nhật');
    eq(d.demNguocSuaDau('2026-09-27', '2026-09-28'), null, 'Hết hạn thì không đếm nữa');
    eq(d.demNguocSuaDau(null, '2026-09-22'), null, 'Không có tuần thì không đếm');
  });

  check('PR-Rc1 · Q2 Tuần kế tiếp luôn là thứ Hai kế sau tuần thi', () => {
    assert(d.tuanKeTiep('2026-09-14') === '2026-09-21', d.tuanKeTiep('2026-09-14'));
    assert(d.tuanKeTiep('2026-09-28') === '2026-10-05', d.tuanKeTiep('2026-09-28'));
  });

  check('PR-Rc1 · RB-5 lý do hiệu chỉnh: bắt buộc, đủ dài, không nhận khoảng trắng', () => {
    assert(d.LY_DO_TOI_THIEU === 5, 'Ngưỡng là 5 ký tự');
    assert(d.kiemLyDo(null) !== null && d.kiemLyDo('   ') !== null, 'Trống thì phải báo lỗi');
    assert(d.kiemLyDo('sai') !== null, 'Quá ngắn thì phải báo lỗi');
    assert(d.kiemLyDo('Chấm nhầm đề B') === null, 'Lý do đủ dài thì hợp lệ');
    assert(!/Hãy/.test(String(d.kiemLyDo(null))), 'Câu lỗi không mở đầu bằng "Hãy"');
  });

  check('PR-Rc1 · Câu trạng thái chấm dùng chung cho Lịch Test', () => {
    const eq = (got: string, want: string, m: string) => assert(got === want, `${m}: "${got}" ≠ "${want}"`);
    eq(d.trangThaiChamLabel({ conBai: 0, tong: 8, quaHan: false, chuaToiHan: false }), 'Đã chấm xong', 'Xong');
    eq(d.trangThaiChamLabel({ conBai: 3, tong: 8, quaHan: false, chuaToiHan: false }), 'Còn 3 bài', 'Còn bài');
    eq(d.trangThaiChamLabel({ conBai: 3, tong: 8, quaHan: true, chuaToiHan: false }), 'Quá hạn · còn 3 bài', 'Quá hạn');
    eq(d.trangThaiChamLabel({ conBai: 8, tong: 8, quaHan: false, chuaToiHan: true }), 'Chưa tới hạn', 'Chưa tới tuần thi');
  });
}
