/**
 * PHÉP KIỂM PR-OV5b — Quay lại đúng nơi bắt đầu (đặc tả OV mục 4 "Quay lại", mockup M1 §6): hàm thuần của chồng nguồn
 * (`shared/domain/quayLai.ts`). Giao diện chỉ gọi các hàm này; bấm thử ghi trong mô tả PR.
 */
import type { YThucTestKit } from './yThuc.tests.ts';

export async function runPrOv5bTests(t: YThucTestKit) {
  const { check, assert } = t;
  const d: any = await import('../../../shared/domain/index.ts');
  console.log('\nPR-OV5b · Quay lại đúng nơi bắt đầu');
  const b = (url: string, ten = url, cuon = 0) => ({ url, ten, cuon });
  const di = (chong: any[], tu: any, den: string, kieu = 'PUSH') => d.buocMoi(chong, { tu, den, kieu });

  check('OV5b (1) · loại hồ sơ theo đường dẫn — trang danh sách / trang nguồn không phải hồ sơ', () => {
    const k = (p: string) => d.loaiHoSo(p);
    assert(k('/hoc-vien/12') === 'hoc-vien' && k('/hoc-vien/lop/3') === 'lop' && k('/mock-test/7') === 'mt', 'HV, lớp, MT');
    assert(k('/giao-vien/9') === 'gv' && k('/hoc-thuat/case/4') === 'case', 'GV, Case');
    assert(k('/nhap-diem/3') === 'nhap-diem' && k('/bang-diem-thuong/3') === 'nhap-diem', 'Nhập điểm');
    for (const p of ['/', '/hoc-vien', '/hoc-vien/luu-tru', '/cong-viec', '/cong-viec/van-hanh', '/test/lich', '/phan-tich', '/quan-tri']) {
      assert(k(p) === null, `${p} là trang nguồn`);
    }
  });

  check('OV5b (2) · nguồn → hồ sơ: ghi đúng URL đủ query + vị trí cuộn + tên; nút về nguồn → chồng rỗng, trả vị trí cuộn', () => {
    const nguon = b('/cong-viec?loc=qua-han&nhom=case-hoc-thuat', 'Công việc', 840);
    const r = di([], nguon, '/hoc-vien/12');
    assert(r.chong.length === 1 && r.chong[0].url === '/cong-viec?loc=qua-han&nhom=case-hoc-thuat' && r.chong[0].cuon === 840 && r.chong[0].ten === 'Công việc',
      JSON.stringify(r));
    assert(r.cuonVe === null, 'đi tới hồ sơ không cuộn');
    const ve = di(r.chong, b('/hoc-vien/12'), '/cong-viec?loc=qua-han&nhom=case-hoc-thuat');
    assert(ve.chong.length === 0 && ve.cuonVe === 840, JSON.stringify(ve));
    /* Đổi tab / query ngay trong hồ sơ không thêm bước. */
    assert(di(r.chong, b('/hoc-vien/12'), '/hoc-vien/12?tab=y-thuc').chong === r.chong, 'cùng hồ sơ');
  });

  check('OV5b (3) · hồ sơ → hồ sơ giữ nguồn đầu; bấm bước giữa → về bước đó, cắt phần sau', () => {
    let c = di([], b('/test/lich?periodId=5', 'Lịch Test', 300), '/mock-test/7').chong;
    c = di(c, b('/mock-test/7', 'MT2 · Minh'), '/hoc-vien/12').chong;
    c = di(c, b('/hoc-vien/12?tab=y-thuc', 'Hồ sơ Minh', 120), '/hoc-vien/lop/3').chong;
    assert(c.length === 3 && c[0].url === '/test/lich?periodId=5', JSON.stringify(c));
    const giua = di(c, b('/hoc-vien/lop/3'), '/hoc-vien/12?tab=y-thuc');
    assert(giua.chong.length === 2 && giua.chong[0].url === '/test/lich?periodId=5' && giua.cuonVe === 120, JSON.stringify(giua));
    /* Trước / Sau trong danh sách (điều hướng thay thế) không thêm bước. */
    assert(di(c, b('/hoc-vien/lop/3'), '/hoc-vien/lop/4', 'REPLACE').chong === c, 'Trước/Sau');
    /* Case chuyển thẳng (replace) sang hồ sơ HV: nguồn còn nguyên. */
    const cs = di(di([], b('/cong-viec'), '/hoc-thuat/case/4').chong, b('/hoc-thuat/case/4'), '/hoc-vien/12?case=4', 'REPLACE');
    assert(cs.chong.length === 1 && cs.chong[0].url === '/cong-viec', JSON.stringify(cs));
  });

  check('OV5b (4) · chồng tối đa 5: bỏ bước cũ nhất nhưng giữ nguồn đầu', () => {
    let c: any[] = di([], b('/', 'Tổng quan'), '/hoc-vien/1').chong;
    for (let i = 1; i <= 7; i++) c = di(c, b(`/hoc-vien/${i}`), `/hoc-vien/${i + 1}`).chong;
    assert(c.length === d.CHONG_TOI_DA && d.CHONG_TOI_DA === 5, `dài ${c.length}`);
    assert(c[0].url === '/' && c[1].url === '/hoc-vien/4' && c[4].url === '/hoc-vien/7', c.map((x: any) => x.url).join(' '));
  });

  check('OV5b (5) · lùi trình duyệt (POP) chỉ cắt khi về đúng một bước; sang trang nguồn khác không đụng chồng', () => {
    const c = di([], b('/phan-tich?goc=van-de', 'Phân tích', 50), '/hoc-vien/lop/3').chong;
    assert(di(c, b('/hoc-vien/lop/3'), '/phan-tich?goc=van-de', 'POP').chong.length === 0, 'POP về nguồn');
    assert(di(c, b('/hoc-vien/lop/3'), '/hoc-vien/12', 'POP').chong === c, 'POP sang hồ sơ khác');
    assert(di(c, b('/hoc-vien/lop/3'), '/cong-viec').chong === c, 'sang trang nguồn khác');
    assert(di(c, null, '/hoc-vien/12').chong === c, 'lần tải đầu không có trang trước');
  });

  check('OV5b (6) · không có nguồn → trang cha đúng từng loại hồ sơ', () => {
    const cha = (l: string, o: any = {}) => d.trangCha(l, o);
    assert(cha('hoc-vien').url === '/hoc-vien' && cha('hoc-vien').ten === 'Học viên & Lớp', 'HV');
    assert(cha('lop').url === '/hoc-vien', 'lớp');
    assert(cha('mt', { studentId: 12 }).url === '/hoc-vien/12' && cha('case', { studentId: 12 }).url === '/hoc-vien/12', 'MT, Case → hồ sơ HV');
    assert(cha('gv', { nav: { phanTichGv: true, admin: true } }).url === '/phan-tich?goc=giao-vien', 'GV · QL → Phân tích');
    assert(cha('gv', { nav: { phanTichGv: false, admin: true } }).url === '/quan-tri', 'GV · Quản trị');
    assert(cha('gv', { nav: { phanTichGv: false, admin: false } }).url === '/', 'GV tự xem → Tổng quan');
    assert(cha('nhap-diem').url === '/test', 'Nhập điểm → Test');
  });

  check('OV5b (7) · đọc chồng từ sessionStorage: URL ngoài app / lạ bị bỏ; quá 5 bị cắt', () => {
    assert(d.urlTrongApp('/cong-viec?loc=qua-han') && d.urlTrongApp('/'), 'URL trong app');
    for (const x of ['//evil.com/x', 'https://evil.com', 'javascript:alert(1)', '/\\evil.com', '', 'cong-viec', null, 5]) assert(!d.urlTrongApp(x), String(x));
    const doc = d.docChong([b('/test/lich', 'Lịch Test', 10), { url: '//evil.com', ten: 'x', cuon: 0 }, { url: '/a', ten: 1, cuon: 0 }, { url: '/b', ten: 'B', cuon: -3 }]);
    assert(doc.length === 2 && doc[0].url === '/test/lich' && doc[1].url === '/b' && doc[1].cuon === 0, JSON.stringify(doc));
    assert(d.docChong('rác').length === 0 && d.docChong(null).length === 0, 'không phải mảng');
    assert(d.docChong(Array.from({ length: 9 }, (_, i) => b(`/hoc-vien/${i + 1}`))).length === 5, 'cắt 5');
  });

  check('OV5b (8) · tên nguồn từ URL: trang + bộ lọc đang dùng', () => {
    const n = (u: string) => { const x = d.tenNguon(u); return x.chiTiet ? `${x.ten} | ${x.chiTiet}` : x.ten; };
    assert(n('/cong-viec?loc=qua-han&nhom=case-hoc-thuat') === 'Công việc | Quá hạn · Case học thuật', n('/cong-viec?loc=qua-han&nhom=case-hoc-thuat'));
    assert(n('/cong-viec/van-hanh') === 'Công việc | Vận hành', n('/cong-viec/van-hanh'));
    assert(n('/') === 'Tổng quan' && n('/test/lich?periodId=5') === 'Lịch Test' && n('/test/diem-lop') === 'Điểm theo lớp', 'Tổng quan, Test');
    assert(n('/phan-tich?goc=hieu-qua-pa') === 'Phân tích | Hiệu quả PA', n('/phan-tich?goc=hieu-qua-pa'));   // OV-15e: van-de đã bỏ
    assert(n('/hoc-vien?q=Minh') === 'Học viên & Lớp | “Minh”', n('/hoc-vien?q=Minh'));
    assert(n('/hoc-vien/12') === 'Hồ sơ học viên' && n('/trang-la') === 'Trang trước', 'mặc định');
  });
}
