/**
 * PHÉP KIỂM PR-O — khung 4 khu vực + hàm chung ngày/tuần G-6 (spec 2026-09-22-ux-toan-web-truoc-deploy-design §1, §3.1).
 * Harness do `run.ts` sở hữu và truyền vào — file này không tự mở database.
 */
import type { YThucTestKit } from './yThuc.tests.ts';

export async function runKhungTests(t: YThucTestKit) {
  const { check, assert } = t;
  const d = await import('../../../shared/domain/index.ts');
  console.log('\nPR-O · Khung 4 khu vực');

  check('PR-O · G-6 ngày: dd/mm cùng năm, dd/mm/yyyy khác năm, không bao giờ ISO', () => {
    const eq = (got: string, want: string, m: string) => assert(got === want, `${m}: "${got}" ≠ "${want}"`);
    eq(d.ngay('2026-09-22', '2026-09-22'), '22/09', 'Cùng năm');
    eq(d.ngay('2026-09-22T18:30:00Z', '2026-01-01'), '23/09', 'Có giờ (UTC) đổi sang giờ Việt Nam rồi mới lấy ngày');
    eq(d.ngay('2027-01-04', '2026-09-22'), '04/01/2027', 'Khác năm phải có năm');
    eq(d.ngay('2026-09-22'), '22/09/2026', 'Không biết hôm nay thì ghi đủ năm');
    eq(d.ngay(null, '2026-09-22'), '—', 'Trống');
    eq(d.ngay('abc', '2026-09-22'), '—', 'Chuỗi lạ');
    for (const s of ['2026-09-22', '2027-01-04', '2026-12-31T23:00:00Z']) {
      assert(!/\d{4}-\d{2}/.test(d.ngay(s, '2026-09-22')), `Lộ ISO: ${d.ngay(s, '2026-09-22')}`);
    }
  });

  check('PR-O · G-6 tuần lịch: "W3 SEP" (tháng chứa thứ Năm), năm chỉ khi khác năm hiện tại', () => {
    const eq = (got: string, want: string, m: string) => assert(got === want, `${m}: "${got}" ≠ "${want}"`);
    eq(d.tuanLich('2026-09-16', '2026-09-22'), 'W3 SEP', 'Thứ Tư 16/09/2026');
    eq(d.tuanLich('2026-09-14', '2026-09-22'), 'W3 SEP', 'Thứ Hai cùng tuần');
    eq(d.tuanLich('2026-09-28', '2026-09-22'), 'W1 OCT', '28/09 thuộc tháng 10 (thứ Năm 01/10)');
    eq(d.tuanLich('2027-01-01', '2026-09-22'), 'W5 DEC', '01/01/2027 vẫn thuộc W5 DEC 2026 — cùng năm với hôm nay');
    eq(d.tuanLich('2027-01-06', '2026-09-22'), 'W1 JAN 2027', 'Sang năm mới phải ghi năm');
    eq(d.tuanLich('2026-09-16'), 'W3 SEP', 'Không truyền hôm nay thì không ghi năm');
    eq(d.tuanLich(undefined, '2026-09-22'), '—', 'Trống');
    assert(!/Tuần|T\d/.test(d.tuanLich('2026-09-16', '2026-09-22')), 'Không dùng "Tuần 36" hay "T5"');
  });

  check('PR-O · G-6 tuần học trong khoá: "W8/8"', () => {
    assert(d.tuanKhoa(8, 8) === 'W8/8', d.tuanKhoa(8, 8));
    assert(d.tuanKhoa(3, 10) === 'W3/10', d.tuanKhoa(3, 10));
    assert(d.tuanKhoa(0, 8) === '—' && d.tuanKhoa(3, 0) === '—' && d.tuanKhoa(2.5, 8) === '—', 'Số không hợp lệ phải ra "—"');
  });

  const nav = (over: Partial<import('../../../shared/domain/index.ts').NavQuyen>) => ({ ...d.NAV_RONG, ...over });
  const QL = nav({ overview: true, students: true, analysis: true, test: true, testGrade: true, testSchedule: true,
    testPlan: true, work: true, workSupport: true, workOps: true, workReports: true, workApprove: true, workRequests: true });
  const GV = nav({ overview: true, students: true, test: true, testGrade: true, testSchedule: true, work: true, workSupport: true, workRequests: true });

  check('PR-O · O1/O6 Bốn khu vực đúng thứ tự, khu không có quyền thì bỏ hẳn', () => {
    const keys = (n: any) => d.khuVucHienThi(n).map((k) => k.key).join(',');
    assert(keys(QL) === 'tong-quan,hoc-vien,test,cong-viec,phan-tich', `QL: ${keys(QL)}`);   // OV-15e: Phân tích lên thanh trên; thứ tự chốt 20/10 (KHUNG-LOI)
    assert(keys(GV) === 'tong-quan,hoc-vien,test,cong-viec', `GV thấy cả Test và Công việc (spec §3.1): ${keys(GV)}`);
    assert(keys(nav({ overview: true, students: true })) === 'tong-quan,hoc-vien', 'Không có Test/Công việc thì không hiện');
    const labels = d.KHU_VUC.map((k) => `${k.label}|${k.labelNgan}`).join(',');
    assert(labels === 'Tổng quan|Tổng quan,Học viên & Lớp|Học viên,Test|Test,Công việc|Công việc,Phân tích|Phân tích', `Chữ: ${labels}`);
  });

  check('PR-O · Khu vực của một đường dẫn (tô sáng đúng mục trên thanh)', () => {
    const cases: Array<[string, string | null]> = [
      ['/', 'tong-quan'], ['/phan-tich', 'phan-tich'], ['/hoc-thuat/case/3', 'tong-quan'],
      ['/hoc-vien', 'hoc-vien'], ['/hoc-vien/12', 'hoc-vien'], ['/hoc-vien/lop/3', 'hoc-vien'],
      ['/test', 'test'], ['/test/lich', 'test'], ['/nhap-diem/4', 'test'], ['/bang-diem-thuong/4', 'test'], ['/mock-test/9', 'test'],
      ['/cong-viec', 'cong-viec'], ['/cong-viec/bao-cao', 'cong-viec'],
      ['/quan-tri', null], ['/ho-so-ca-nhan', null], ['/hoc-vienx', null], ['/testing', null],
    ];
    for (const [p, want] of cases) assert(d.khuVucCuaDuong(p) === want, `${p} → ${d.khuVucCuaDuong(p)}, cần ${want}`);
  });

  check('PR-O · O2/O2b Tab Test theo quyền: GV Chấm Test + Lịch Test, mở vào Chấm Test (UI-CHAM-TEST); QL mở Lịch Test (OV-15b bỏ tab Điểm theo lớp → panel lớp)', () => {
    assert(d.tabTestHienThi(QL).join(',') === 'lich,ke-hoach', `QL: ${d.tabTestHienThi(QL)}`);
    assert(d.tabTestHienThi(GV).join(',') === 'cham,lich', `GV: ${d.tabTestHienThi(GV)}`);
    assert(d.tabTestMacDinh(GV) === 'cham', `GV mặc định: ${d.tabTestMacDinh(GV)}`);
    assert(d.tabTestMacDinh(QL) === 'lich', `QL mặc định: ${d.tabTestMacDinh(QL)}`);
    assert(d.tabTestMacDinh(d.NAV_RONG) === null, 'Không có tab nào thì không có mặc định');
    assert(d.tabTestTuDuong('ke-hoach') === 'ke-hoach' && d.tabTestTuDuong(undefined) === null && d.tabTestTuDuong('x') === null, 'Đọc tab từ đường dẫn');
    assert(Object.values(d.TAB_TEST_LABEL).join(',') === 'Chấm Test,Lịch Test tuần,Điểm theo lớp,Kế hoạch Test', 'Chữ tab Test');
    assert(d.DUONG_TAB_TEST.lich === '/test/lich', 'Đường dẫn tab Test');
  });

  check('PR-O · R1 Tab Công việc theo quyền (PR-DUYET): QL tab đầu Chờ duyệt; GV Việc học viên + Yêu cầu của tôi', () => {
    assert(d.tabCongViecHienThi(QL).join(',') === 'cho-duyet,ho-tro,van-hanh,bao-cao', `QL: ${d.tabCongViecHienThi(QL)}`);
    assert(d.tabCongViecHienThi(GV).join(',') === 'ho-tro,yeu-cau', `GV: ${d.tabCongViecHienThi(GV)}`);
    assert(d.tabCongViecTuDuong(undefined) === 'ho-tro' && d.tabCongViecTuDuong('bao-cao') === 'bao-cao' && d.tabCongViecTuDuong('cho-duyet') === 'cho-duyet'
      && d.tabCongViecTuDuong('yeu-cau') === 'yeu-cau' && d.tabCongViecTuDuong('x') === null && d.tabCongViecTuDuong('ho-tro') === null,
    'Đọc tab từ đường dẫn (không có đoạn = Việc học viên)');
    assert(Object.values(d.TAB_CONG_VIEC_LABEL).join(',') === 'Chờ duyệt,Hỗ trợ học viên,Yêu cầu của tôi,Vận hành,Họp đơn vị', 'Chữ tab Công việc');
    assert(d.DUONG_TAB_CONG_VIEC['ho-tro'] === '/cong-viec' && d.DUONG_TAB_CONG_VIEC['van-hanh'] === '/cong-viec/van-hanh'
      && d.DUONG_TAB_CONG_VIEC['cho-duyet'] === '/cong-viec/cho-duyet', 'Đường dẫn tab');
    /* OV-15d (thay UX-2 (3)): Công việc một danh sách — "Chờ bạn duyệt" là nhóm đầu, mục menu luôn `/cong-viec`. */
    assert(d.khuVucHienThi(QL, 2).find((k: any) => k.key === 'cong-viec')?.to === '/cong-viec'
      && d.khuVucHienThi(QL, 0).find((k: any) => k.key === 'cong-viec')?.to === '/cong-viec'
      && d.khuVucHienThi(GV, 2).find((k: any) => k.key === 'cong-viec')?.to === '/cong-viec', 'Mục Công việc: QL vào Chờ duyệt khi có thẻ');
    assert(Object.values(d.TAB_TONG_QUAN_LABEL).join(',') === 'Tổng quan,Phân tích', 'Chữ tab Tổng quan (O3; KHUNG-LOI A1-07: tiêu đề = tên menu)');
  });

  check('PR-O · O5/O7 Mọi đường dẫn cũ về đúng chỗ, giữ bộ lọc, không vòng lặp', () => {
    const cases: Array<[string, string, string | null]> = [
      ['/tong-quan', '?cn=4', '/?cn=4'],
      ['/', '?tab=tinh-hinh&cn=2&hang-doi=no_plan', '/phan-tich?goc=van-de&cn=2'],   // PR-Pb2-a: một bước tới Vấn đề HV
      ['/', '?tab=bao-cao', '/'],
      ['/', '?cn=2', null], ['/', '', null],
      ['/hoc-thuat', '', '/phan-tich'], ['/hoc-thuat/', '?goc=y-thuc&cn=2', '/phan-tich?goc=y-thuc&cn=2'],
      ['/hoc-thuat/case/5', '', null],
      ['/tong-hop-tuan', '?branchId=3', '/phan-tich?xem=tuan&cn=3'], ['/tong-hop-tuan', '', '/phan-tich?xem=tuan'],
      ['/tien-trinh', '?periodId=9', '/cong-viec/bao-cao?periodId=9'], ['/hop-tuan', '', '/cong-viec/bao-cao'],
      ['/tien-do-cong-viec', '', '/cong-viec/van-hanh'],
      ['/tien-do-cong-viec', '?viec=12', '/cong-viec/van-hanh?open=12'],
      ['/tien-do-cong-viec', '?open=7&tao=1&nhom=tutor', '/cong-viec/van-hanh?open=7&tao=1&nhom=tutor'],
      ['/tien-do-cong-viec', '?tab=don-vi&cn=2', '/cong-viec/bao-cao?cn=2'],
      ['/hoc-vien', '?view=my_scores&classId=7&scope=mine', '/test/lich?classId=7'],
      /* PR-UX1 Q12: Cần chấm gộp vào Lịch Test — giữ lớp, môn, chi nhánh; bỏ `scope`. */
      ['/test/can-cham', '?classId=7&kn=reading&scope=mine&branchId=2', '/test/lich?classId=7&kn=reading&branchId=2'],
      ['/test/can-cham', '', '/test/lich'], ['/test/lich', '?classId=7', null],
      ['/hoc-vien', 'view=no_plan', '/test/ke-hoach'],
      ['/hoc-vien', '?view=sos', null], ['/hoc-vien', '', null], ['/hoc-vien/12', '?view=my_scores', null],
      ['/mock-test', '?x=1', '/hoc-vien'], ['/mock-test/lop/12', '?a=1', '/nhap-diem/12?a=1'], ['/mock-test/33', '', null],
      ['/test', '', null], ['/cong-viec/bao-cao', '?periodId=9', null], ['/phan-tich', '?xem=tuan', null],
    ];
    for (const [p, s, want] of cases) {
      const got = d.duongMoi(p, s);
      assert(got === want, `${p}${s} → ${got}, cần ${want}`);
      if (got) {
        const [gp, gs = ''] = got.split('?');
        assert(d.duongMoi(gp, gs) === null, `Vòng lặp: ${got} lại bị chuyển tiếp`);
        assert(d.khuVucCuaDuong(gp) !== null, `Đích ${gp} không thuộc khu vực nào`);
      }
    }
  });

  const { navOf } = await import('../platform/nav.ts');
  const tabs = (n: any) => `${d.khuVucHienThi(n).map((k) => k.key)}|${d.tabTestHienThi(n)}|${d.tabCongViecHienThi(n)}|${n.analysis}|${n.admin}`;

  check('PR-O · O6 Quản trị và QL chi nhánh: đủ 4 khu, đủ tab, có Phân tích', () => {
    for (const [ten, p] of [['Quản trị', t.P.admin], ['QL MB', t.P.mbManager]] as const) {
      const n = navOf(p);
      assert(d.khuVucHienThi(n).length === 5, `${ten}: ${tabs(n)}`);   // OV-15e: + Phân tích; AN-TUTOR: bỏ Tutor
      assert(d.tabTestHienThi(n).join(',') === 'lich,ke-hoach', `${ten} tab Test: ${tabs(n)}`);   // OV-15b: bỏ tab Điểm theo lớp
      assert(d.tabCongViecHienThi(n).join(',') === 'cho-duyet,ho-tro,van-hanh,bao-cao', `${ten} tab Công việc: ${tabs(n)}`);
      assert(n.analysis, `${ten} phải thấy Phân tích`);
    }
    assert(navOf(t.P.admin).admin && !navOf(t.P.mbManager).admin, 'Chỉ Quản trị thấy màn Quản trị');
  });

  check('PR-O · O6/R1 GV (GVCN, GVBM): 4 khu; Test: Chấm Test + Lịch Test (UI-CHAM-TEST; OV-15b bỏ Điểm theo lớp); Công việc: Việc học viên + Yêu cầu của tôi (PR-DUYET); không Phân tích', () => {
    for (const [ten, p] of [['GVCN', t.P.coreTeacher], ['GVBM', t.P.subjectTeacher], ['GVCN lớp thường', t.P.normalCoreTeacher]] as const) {
      const n = navOf(p);
      /* NEN-V5 (08 K10): GV có lại Tổng quan (thay OV-15d). OV-15b: bỏ tab Điểm theo lớp. */
      assert(tabs(n) === 'tong-quan,hoc-vien,test,cong-viec|cham,lich,ke-hoach|ho-tro,yeu-cau|false|false', `${ten}: ${tabs(n)}`);   // OV-15b + NEN-V5 + UI-CHAM-TEST + chủ SP 28/10 (Kế hoạch Test chỉ xem)
      assert(d.tabTestMacDinh(n) === 'cham', `${ten} mở Test vào ${d.tabTestMacDinh(n)}`);
      assert(!n.workOps && !n.workReports, `${ten} không được thấy Vận hành / Báo cáo đơn vị`);
    }
  });

}
