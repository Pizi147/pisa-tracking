/**
 * PHÉP KIỂM KHUNG-LOI — khung không vỡ (kế hoạch docs/superpowers/plans/2026-10-21-pr-khung-loi.md):
 *  KL-1 thứ tự menu chốt 20/10 · KL-2 chia thanh trên ("Thêm ▾") / thanh dưới ≤ 5 · KL-8 chú giải màu ô MT một nguồn ·
 *  KL-9 tiêu đề = tên menu, thẻ Đề xuất PA ghi ngày hạn (không "T3").
 */
export async function runPrKhungLoiTests(t: any) {
  const { check, assert } = t;
  const d: any = await import('../../../shared/domain/index.ts');
  const { DINH_NGHIA_LOAI } = await import('../duyet/loaiYeuCau.ts');
  console.log('\nKHUNG-LOI · thứ tự menu · thanh trên / dưới · chú giải màu · tiêu đề · "Nếu duyệt" ghi ngày');

  const QL = { ...d.NAV_RONG, overview: true, students: true, analysis: true, test: true, testSchedule: true, work: true, workSupport: true, tutor: true };
  const keys = (ds: any[]) => ds.map((k) => k.key).join(',');

  check('KL-1 · thứ tự menu 20/10: Tổng quan → Học viên & Lớp → Test → Công việc → Phân tích → Tutor', () => {
    assert(keys(d.khuVucHienThi(QL)) === 'tong-quan,hoc-vien,test,cong-viec,phan-tich,tutor', keys(d.khuVucHienThi(QL)));
  });

  check('KL-2 · thanh trên: đủ chỗ không gom; thiếu chỗ dồn từ cuối vào Thêm, giữ thứ tự', () => {
    const muc = d.khuVucHienThi(QL);
    const rong = muc.map(() => 100);   // 6 mục × 100 px, nút Thêm 70 px
    const chia = (co: number) => { const r = d.chiaMucThanh(muc, rong, co, 70); return `${keys(r.hien)}|${keys(r.them)}`; };
    assert(chia(600) === 'tong-quan,hoc-vien,test,cong-viec,phan-tich,tutor|', `đủ chỗ: ${chia(600)}`);
    assert(chia(599) === 'tong-quan,hoc-vien,test,cong-viec,phan-tich|tutor', `thiếu 1 px → 5 + Thêm (570 ≤ 599): ${chia(599)}`);
    assert(chia(569) === 'tong-quan,hoc-vien,test,cong-viec|phan-tich,tutor', `thiếu thêm → Phân tích + Tutor: ${chia(569)}`);
    assert(chia(10) === '|tong-quan,hoc-vien,test,cong-viec,phan-tich,tutor', `không chỗ → mọi mục vào Thêm: ${chia(10)}`);
    assert(chia(0) === 'tong-quan,hoc-vien,test,cong-viec,phan-tich,tutor|', 'chưa đo (rộng 0) → vẽ đủ, không gom');
  });

  check('KL-2 · thanh dưới ≤ 5 nút: QL 4 + Thêm; Admin 5 giữ; GV 3 giữ; Head tutor 1 → ẩn', () => {
    const r6 = d.chiaThanhDuoi(d.khuVucHienThi(QL));
    assert(`${keys(r6.hien)}|${keys(r6.them)}` === 'tong-quan,hoc-vien,test,cong-viec|phan-tich,tutor', `QL: ${keys(r6.hien)}|${keys(r6.them)}`);
    const nam = d.chiaThanhDuoi(d.khuVucHienThi({ ...QL, tutor: false }));
    assert(nam.hien.length === 5 && !nam.them.length, 'Admin / QL không tutor: 5 nút, không Thêm');
    const gv = d.chiaThanhDuoi(d.khuVucHienThi({ ...d.NAV_RONG, overview: true, students: true, work: true }));
    assert(gv.hien.length === 3 && !gv.them.length, 'GV 3 nút');
    const ht = d.chiaThanhDuoi(d.khuVucHienThi({ ...d.NAV_RONG, overview: false, tutor: true }));
    assert(!ht.hien.length && !ht.them.length, 'Head tutor 1 mục → không thanh dưới');
  });

  check('KL-8 · chú giải màu ô MT: mọi kiểu có nhãn; "xong" = Đã thi (không "Xám = đã thi xong")', () => {
    const kieu = ['chua-lich', 'co-lich', 'dang-thi', 'cho-cham', 'cho-cham-cu', 'tre-cham', 'con-viec', 'xong'];
    for (const k of kieu) assert(typeof d.NHAN_KIEU_O_MT[k] === 'string' && d.NHAN_KIEU_O_MT[k].length > 0, `thiếu nhãn ${k}`);
    assert(d.NHAN_KIEU_O_MT.xong === 'Đã thi', d.NHAN_KIEU_O_MT.xong);
  });

  check('KL-9 · tiêu đề Tổng quan = tên menu; "Nếu duyệt" PA ghi ngày hạn kết quả đầu, không "T3"', () => {
    assert(d.TAB_TONG_QUAN_LABEL['tong-quan'] === d.KHU_VUC[0].label && d.KHU_VUC[0].label === 'Tổng quan', d.TAB_TONG_QUAN_LABEL['tong-quan']);
    const pa = DINH_NGHIA_LOAI.find((l: any) => l.loai === 'de_xuat_pa')!;
    const ngu = { homNay: '2026-09-14', hocVien: new Map(), lop: new Map(), nguoi: new Map(), them: new Map([[1, { id: 5, kind: 'tutor', case_id: 2, topic: null }]]) };
    const r = pa.moTa({ id: 1, doi_tuong_id: 5, nguoi_xin: null, tao_luc: '2026-09-14 08:00:00', ly_do: null, hoc_vien_id: 3, du_lieu: null } as any, ngu as any);
    const han = d.shortDate(d.hanKyGhiKetQua('2026-09-14'), '2026-09-14');
    assert(!/T3/.test(r.neuDuyet ?? '') && (r.neuDuyet ?? '').includes(han), `${r.neuDuyet} (cần ${han})`);
  });
}
