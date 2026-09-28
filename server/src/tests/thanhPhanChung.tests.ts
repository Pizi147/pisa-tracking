/** PHÉP KIỂM PR-NEN — thành phần chung: ô ngày, "Khác", chọn người, trạng thái, đang chọn, panel, bàn phím (kế hoạch 2026-09-28). */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { YThucTestKit } from './yThuc.tests.ts';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const REPO = path.join(ROOT, '..');
const doc = (f: string) => fs.readFileSync(path.join(REPO, f), 'utf8');
/** Mọi .ts/.tsx dưới `dir` (đường dẫn tương đối, dấu /). Khối 5–9 dùng lại cho phép kiểm quét. */
function tepNguon(dir: string): string[] {
  const out: string[] = [];
  const di = (d: string) => { for (const e of fs.readdirSync(path.join(REPO, d), { withFileTypes: true })) {
    const p = `${d}/${e.name}`; if (e.isDirectory()) di(p); else if (/\.tsx?$/.test(e.name)) out.push(p); } };
  di(dir); return out;
}

export async function runThanhPhanChungTests(t: YThucTestKit) {
  const { check, assert } = t;
  const d = await import('../../../shared/domain/index.ts');
  console.log('\nPR-NEN · Thành phần chung');
  const H = '2026-09-28'; // Thứ Hai

  check('NEN (1) · docONgay kiểu ngày: dd/mm/yyyy, dd/mm (năm của hôm nay), d/m/yyyy, dấu . và -', () => {
    const ok = (s: string, k: any, iso: string, l?: any) => { const r = d.docONgay(s, k, H, l); assert(r.iso === iso, `${s} → ${JSON.stringify(r)}`); };
    ok('28/09/2026', 'ngay', '2026-09-28'); ok('28/9', 'ngay', '2026-09-28'); ok('1/10/2026', 'ngay', '2026-10-01');
    ok(' 05.10.2026 ', 'ngay', '2026-10-05'); ok('5-10-2026', 'ngay', '2026-10-05');
    const r0 = d.docONgay('   ', 'ngay', H); assert(r0.iso === null && r0.loi === null, 'ô trống không phải lỗi');
  });
  check('NEN (1) · docONgay báo lỗi bằng chữ, không nhận ngày không có thật', () => {
    const loi = (s: string, k: any, cau: string, l?: any) => { const r = d.docONgay(s, k, H, l); assert(r.iso === null && r.loi === cau, `${s} → ${JSON.stringify(r)}`); };
    loi('31/02/2026', 'ngay', 'Ngày không có thật'); loi('abc', 'ngay', 'Gõ dạng dd/mm/yyyy');
    loi('28/09/26', 'ngay', 'Năm cần đủ 4 số, ví dụ 28/09/2026');
    loi('29/09/2026', 'ngay', 'Không được sau hôm nay', { toiDa: H });
    loi('27/09/2026', 'ngay', 'Không được trước hôm nay', { toiThieu: H });
    loi('05/10/2026', 'ngay', 'Không được sau 04/10', { toiDa: '2026-10-04' });
    loi('13/2026', 'thang', 'Gõ dạng mm/yyyy');
  });
  check('NEN (1) · tuần nhảy về Thứ Hai; mốc cuối = Chủ nhật, cắt về hôm nay khi là tuần hiện tại', () => {
    assert(d.docONgay('30/09/2026', 'tuan', H).iso === '2026-09-28', 'T4 → T2');
    assert(d.docONgay('23/09/2026', 'tuan', H, { moc: 'cuoi' }).iso === '2026-09-27', 'cuối tuần trước');
    assert(d.docONgay('28/09/2026', 'tuan', '2026-09-30', { moc: 'cuoi' }).iso === '2026-09-30', 'cắt về hôm nay');
    assert(d.docONgay('28/09/2026', 'tuan', '2026-09-30', { moc: 'cuoi', catHomNay: false }).iso === '2026-10-04', 'hạn tương lai không cắt');
  });
  check('NEN (1) · tháng và ngày-hoặc-tháng: m/yyyy là tháng, dd/mm[/yyyy] là ngày', () => {
    assert(d.docONgay('9/2026', 'thang', H).iso === '2026-09', 'tháng');
    assert(d.docONgay('28/09/2026', 'thang', H).iso === '2026-09', 'gõ cả ngày vẫn lấy tháng');
    assert(d.docONgay('10/2026', 'ngay-hoac-thang', H).iso === '2026-10', 'chỉ tháng');
    assert(d.docONgay('15/10/2026', 'ngay-hoac-thang', H).iso === '2026-10-15', 'ngày');
    assert(d.docONgay('15/10', 'ngay-hoac-thang', H).iso === '2026-10-15', 'ngày thiếu năm');
    const r = d.docONgay('08/2026', 'thang', H, { toiThieu: H }); assert(r.loi === 'Không được trước tháng 09/2026', JSON.stringify(r));
  });
  check('NEN (1) · hiện: ngày dd/mm/yyyy · tháng mm/yyyy · phụ tuần "W4 SEP · 21/09 – 27/09"; không bao giờ ISO', () => {
    assert(d.hienONgay('2026-09-28', 'ngay') === '28/09/2026' && d.hienONgay('2026-10', 'thang') === '10/2026', 'hien');
    assert(d.hienONgay('2026-10', 'ngay-hoac-thang') === '10/2026' && d.hienONgay('', 'ngay') === '', 'hien 2');
    assert(d.phuONgay('2026-09-21', 'tuan', H) === 'W4 SEP · 21/09 – 27/09', d.phuONgay('2026-09-21', 'tuan', H));
    assert(d.phuONgay('2026-09-28', 'ngay', H) === '', 'ngày không có dòng phụ');
  });
  check('NEN (1) · Gần đây theo luật từng chỗ; lưới tháng tròn tuần', () => {
    const g = d.goiYGanDay('ngay', H, { toiDa: H });
    assert(g.length === 5 && g[0].nhan === 'Hôm nay, 28/09' && g[1].giaTri === '2026-09-27', JSON.stringify(g));
    const w = d.goiYGanDay('tuan', H, {});
    assert(w[0].nhan === 'Tuần này' && w[0].giaTri === H && w.length === 3, JSON.stringify(w));
    const tl = d.goiYGanDay('ngay', H, { toiThieu: H });
    assert(tl.length === 5 && tl.every((x: any) => x.giaTri >= H) && tl[0].nhan === 'Hôm nay, 28/09', JSON.stringify(tl));
    const m = d.goiYGanDay('thang', H, {}); assert(m[0].giaTri === '2026-09' && m[0].nhan === 'Tháng này', JSON.stringify(m));
    const l = d.luoiThang(2026, 9);
    assert(l.length === 5 && l[0][0] === '2026-08-31' && l[4][6] === '2026-10-04' && l.every((h: string[]) => h.length === 7), JSON.stringify(l));
  });
  check('NEN (1) · "Khác": ≥ 3 ký tự, nhận ra mọi mã Khác, ghép vào mô tả khi không có cột riêng', () => {
    assert(d.KHAC_TOI_THIEU === 3, 'hằng số');
    for (const m of ['other', 'khac', 'other_proposal', 'student.reading.other']) assert(d.laKhac(m), m);
    for (const m of ['tutor', 'homework', '', null]) assert(!d.laKhac(m as any), String(m));
    assert(d.kiemGhiRoKhac('') === 'Ghi rõ "Khác" là gì' && d.kiemGhiRoKhac(' ab ') === 'Cần ít nhất 3 ký tự (đang có 2)', 'kiem');
    assert(d.kiemGhiRoKhac('Đi muộn giờ ăn') === null, 'đủ');
    assert(d.ghepKhac('Mượn máy bạn', 'Dùng điện thoại trong giờ') === 'Mượn máy bạn — Dùng điện thoại trong giờ', 'ghép');
    assert(d.ghepKhac('Mượn máy', '') === 'Mượn máy' && d.ghepKhac('', 'x y z') === 'x y z', 'một bên trống');
    assert(d.ghepKhac('Mượn máy', 'Mượn máy — lần 2') === 'Mượn máy — lần 2', 'không ghép hai lần khi sửa');
  });
  check('NEN (1) · 6 nhãn trạng thái (brainstorm C.2); Quá hạn luôn kèm số ngày khi biết', () => {
    assert(d.TRANG_THAI.map((x: any) => d.NHAN_TRANG_THAI[x]).join(' · ') === 'Cần làm · Đang làm · Chờ duyệt · Quá hạn · Xong · Đã huỷ', 'nhãn');
    assert(d.chuTrangThai('qua-han', 2) === 'Quá hạn · 2 ngày' && d.chuTrangThai('qua-han') === 'Quá hạn' && d.chuTrangThai('xong', 3) === 'Xong', 'chữ');
    assert(d.trangThaiPhoiHop('pending') === 'can-lam' && d.trangThaiPhoiHop('done') === 'xong' && d.trangThaiPhoiHop('removed') === 'da-huy', 'phối hợp');
    assert(d.trangThaiCaseDong('done') === 'xong' && d.trangThaiCaseDong('no_plan') === 'can-lam' && d.trangThaiCaseDong('open') === 'can-lam'
      && d.trangThaiCaseDong('working') === 'dang-lam' && d.trangThaiCaseDong('dismissed') === 'da-huy', 'case');
  });
  check('NEN (1) · phím: danh sách vòng, Tab vòng trong panel, lịch đi theo ngày/tuần/tháng', () => {
    assert(d.buocDanhSach(3, -1, 'ArrowDown') === 0 && d.buocDanhSach(3, 2, 'ArrowDown') === 0 && d.buocDanhSach(3, 0, 'ArrowUp') === 2, 'vòng');
    assert(d.buocDanhSach(3, 1, 'Home') === 0 && d.buocDanhSach(3, 1, 'End') === 2 && d.buocDanhSach(3, 1, 'a') === null
      && d.buocDanhSach(0, -1, 'ArrowDown') === null, 'khác');
    assert(d.buocVongFocus(4, 3, false) === 0 && d.buocVongFocus(4, 0, true) === 3 && d.buocVongFocus(4, -1, false) === 0, 'tab');
    assert(d.buocLich(H, 'ArrowRight') === '2026-09-29' && d.buocLich(H, 'ArrowUp') === '2026-09-21' && d.buocLich(H, 'End') === '2026-10-04', 'lịch');
    assert(d.buocLich('2026-01-31', 'PageDown') === '2026-02-28' && d.buocLich(H, 'Enter') === null, 'tháng sau kẹp cuối tháng');
  });
}
