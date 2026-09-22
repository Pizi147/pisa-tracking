/**
 * PHÉP KIỂM PR-Pa — Tổng quan (đặc tả 2026-09-22-ux-toan-web-truoc-deploy-design §3.2, §3.10, §7 dòng Pa).
 * Harness do `run.ts` sở hữu và truyền vào — file này không tự mở database. Học viên dùng ở đây do CHÍNH file này tạo
 * (`taoHocVien`), không sửa học viên của bộ demo. Ngày demo cố định: TODAY = 2026-09-14 (thứ Hai).
 */
import type { YThucTestKit } from './yThuc.tests.ts';

export async function runTongQuanTests(t: YThucTestKit) {
  const { check, assert, assertThrows, conn, TODAY, P, classId } = t;
  const d: any = await import('../../../shared/domain/index.ts');
  console.log('\nPR-Pa · Tổng quan');
  const eq = (got: unknown, want: unknown, m: string) =>
    assert(JSON.stringify(got) === JSON.stringify(want), `${m}: ${JSON.stringify(got)} ≠ ${JSON.stringify(want)}`);

  // ================================================================== 1. Luật thuần
  check('PR-Pa · Chương trình: đọc tham số ct; mặc định Cả hai; không có chữ "Normal" trên màn', () => {
    eq(d.chuongTrinhTuThamSo('thuong'), 'thuong', 'thuong');
    eq(d.chuongTrinhTuThamSo('ft'), 'ft', 'ft');
    eq(d.chuongTrinhTuThamSo(null), 'ca-hai', 'vắng');
    eq(d.chuongTrinhTuThamSo('normal'), 'ca-hai', 'giá trị lạ');
    eq(d.thamSoCt('ca-hai'), '', 'Cả hai không gắn tham số');
    eq(d.thamSoCt('ft', '?'), '?ct=ft', 'ft');
    eq(d.CHUONG_TRINH_LABEL, { thuong: 'Lớp thường', ft: 'Fast Track', 'ca-hai': 'Cả hai' }, 'Nhãn');
  });

  check('PR-Pa · Gom nhóm việc GV: 12 loại việc về đúng 4 nhóm, nhóm có việc quá hạn tự mở, Ý thức không bao giờ tự mở', () => {
    const cham = ['score', 'decide_move'];
    const kase = ['verify', 'cause', 'no_plan', 'result', 'decide', 'do_plan', 'no_owner'];
    const van = ['placement', 'mgmt', 'missing_data'];
    for (const g of cham) eq(d.nhomViecCua(g), 'cham-diem', g);
    for (const g of kase) eq(d.nhomViecCua(g), 'case-hoc-thuat', g);
    for (const g of van) eq(d.nhomViecCua(g), 'van-hanh', g);
    eq(d.nhomViecCua('loai-la'), 'van-hanh', 'Loại lạ');
    const v = (group: string, urgency: string, due: string | null) => ({ group, urgency, due });
    const nhom = d.gomNhomViec([
      v('result', 'normal', '2026-09-20'), v('verify', 'overdue', '2026-09-10'), v('score', 'normal', null), v('mgmt', 'today', '2026-09-14'),
    ], 2);
    eq(nhom.map((g: any) => g.key), ['cham-diem', 'case-hoc-thuat', 'y-thuc', 'van-hanh'], 'Thứ tự nhóm cố định');
    const kh = nhom.find((g: any) => g.key === 'case-hoc-thuat');
    eq([kh.n, kh.quaHan, kh.moSan], [2, 1, true], 'Case học thuật: 2 việc, 1 quá hạn, tự mở');
    eq(kh.items[0].group, 'verify', 'Việc quá hạn lên đầu nhóm');
    const yt = nhom.find((g: any) => g.key === 'y-thuc');
    eq([yt.n, yt.moSan], [2, false], 'Ý thức: đếm dòng nhắc, không tự mở');
    eq(nhom.find((g: any) => g.key === 'cham-diem').moSan, false, 'Nhóm không quá hạn thì gập');
    eq(d.gomNhomViec([], 0), [], 'Không việc thì không nhóm');
    eq(d.LOAI_HAN_CUA_VIEC.verify, 'xac-minh-sos', 'Hạn tín hiệu');
    eq(d.LOAI_HAN_CUA_VIEC.score, 'nhap-diem', 'Hạn nhập điểm');
  });

  check('PR-Pa · Cần xử lý: đúng thứ tự design §4.1, bỏ dòng 0, tối đa 8, "PA chờ Quản lý duyệt" chỉ khi duyệt được', () => {
    eq(d.CAN_XU_LY.map((x: any) => x.metricId), [
      'tin-hieu-qua-han', 'case-xac-dinh-nguyen-nhan-qua-han', 'pa-cho-duyet', 'case-chua-co-nguoi-phu-trach',
      'case-thieu-pa', 'pa-can-cap-nhat', 'bai-qua-han-nhap-diem', 'hv-can-xu-ly',
    ], 'Thứ tự');
    const dem = { 'pa-can-cap-nhat': 3, 'tin-hieu-qua-han': 2, 'pa-cho-duyet': 1, 'case-thieu-pa': 0 };
    const co = d.sapCanXuLy(dem, true);
    eq(co.map((x: any) => [x.metricId, x.n]), [['tin-hieu-qua-han', 2], ['pa-cho-duyet', 1], ['pa-can-cap-nhat', 3]], 'Có quyền duyệt');
    eq(d.sapCanXuLy(dem, false).map((x: any) => x.metricId), ['tin-hieu-qua-han', 'pa-can-cap-nhat'], 'Không quyền duyệt');
    eq(co[0].nhan, 'tín hiệu cần xác minh quá hạn', 'Chữ g11-041 + g8-070');
    eq(co[1].nut, 'Duyệt', 'Nút g3-020');
    const all = Object.fromEntries(d.CAN_XU_LY.map((x: any) => [x.metricId, 5]));
    assert(d.sapCanXuLy(all, true).length === d.CAN_XU_LY_TOI_DA && d.CAN_XU_LY_TOI_DA === 8, 'Tối đa 8 dòng');
  });

  check('PR-Pa · Điểm đáng chú ý: tối đa 3; dưới ngưỡng thì bỏ; lớp thường nói "chưa đạt"; link ghi đúng số dòng sẽ mở', () => {
    const mon = (nhanMon: string, skill: string, tu: number, mau: number) =>
      ({ loai: 'mon-duoi-ky-vong', metricId: 'hv-duoi-ky-vong-mon', extra: { skill }, tu, mau, nhanMon });
    const ds = [
      mon('Listening', 'listening', 7, 20), mon('Reading', 'reading', 2, 4), mon('Writing', 'writing', 5, 10),
      { loai: 'pa-cai-thien', metricId: 'ty-le-co-cai-thien', tu: 5, mau: 6 },
      { loai: 'dung-han', metricId: 'dung-han-cap-nhat', extra: { from: '2026-08-15' }, tu: 12, mau: 20 },
    ];
    const r = d.chonDiemDangChuY(ds, 'ca-hai');
    eq(r.length, 3, 'Ba điểm');
    eq(r[0].cau, 'Writing: 5/10 học viên dưới kỳ vọng', 'Môn tỷ lệ cao nhất, ≥ 3 em (Reading 2/4 dưới ngưỡng)');
    eq([r[0].lienKet, r[0].soDanhSach], ['xem 5 học viên', 5], 'Link môn');
    eq([r[1].cau, r[1].soDanhSach], ['5/6 PA học thuật đã kết thúc có cải thiện', 6], 'PA cải thiện — danh sách là mẫu số');
    eq(r[2].cau, '12/20 lần cập nhật PA đúng hạn (30 ngày qua)', 'Đúng hạn < 80%');
    eq(d.chonDiemDangChuY(ds, 'thuong')[0].cau, 'Writing: 5/10 học viên chưa đạt', 'Lớp thường');
    const it = d.chonDiemDangChuY([
      mon('Listening', 'listening', 2, 20), { loai: 'pa-cai-thien', metricId: 'ty-le-co-cai-thien', tu: 3, mau: 4 },
      { loai: 'dung-han', metricId: 'dung-han-cap-nhat', tu: 19, mau: 20 },
    ], 'ca-hai');
    eq(it, [], 'Không ứng viên nào đủ điều kiện');
  });
}
