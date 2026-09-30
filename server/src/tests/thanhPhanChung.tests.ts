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
  check('NEN (1) · tuần tương lai không bị cắt về hôm nay; Gần đây có tuần tới khi chỉ nhận từ tuần này', () => {
    const r = d.docONgay('12/10/2026', 'tuan', H, { moc: 'cuoi', toiDa: H }); assert(r.loi === 'Không được sau hôm nay', JSON.stringify(r));
    assert(d.docONgay('12/10/2026', 'tuan', H, { moc: 'cuoi' }).iso === '2026-10-18', 'tuần tương lai giữ Chủ nhật thật');
    const w = d.goiYGanDay('tuan', H, { toiThieu: H });
    assert(w.length === 3 && w[0].nhan === 'Tuần này' && w[0].giaTri === H && w.every((x: any) => x.giaTri >= H)
      && w.map((x: any) => x.nhan).join(' · ') === 'Tuần này · Tuần sau · 2 tuần sau', JSON.stringify(w));
    const c = d.goiYGanDay('tuan', '2026-09-30', { toiThieu: H, moc: 'cuoi' });
    assert(c.map((x: any) => x.giaTri).join(',') === '2026-09-30,2026-10-11,2026-10-18', JSON.stringify(c));
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
    assert(d.trangThaiCaseDong('done') === 'xong' && d.trangThaiCaseDong('no_plan') === 'can-lam' && d.trangThaiCaseDong('open') === 'can-lam' && d.trangThaiCaseDong('chua_xu_ly') === 'can-lam'
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

  check('NEN (2) · máy chủ: Khác cần ≥ 3 ký tự ghi rõ, bỏ luật 30 ký tự; tìm người không cần gõ 3 ký tự', () => {
    const src = doc('server/src/yThuc/violations.ts') + doc('server/src/cases/cases.ts') + doc('shared/domain/yThuc.ts');
    assert(!/VIOLATION_OTHER_DESCRIPTION_MIN|summary\.length < 30/.test(src), 'còn luật 30 ký tự');
    for (const f of ['server/src/yThuc/violations.ts', 'server/src/cases/cases.ts', 'server/src/yThuc/xuLy.ts',
      'server/src/yThuc/phoiHop.ts', 'server/src/cases/sosAuto.ts', 'server/src/routes/index.ts'])
      assert(/kiemGhiRoKhac\(/.test(doc(f)), `${f} chưa kiểm bằng kiemGhiRoKhac`);
    assert(!/term\.length < 3/.test(doc('server/src/platform/timNguoi.ts')), 'còn ngưỡng 3 ký tự');
  });

  check('NEN (3) · ONgay/LichNho: không ô lịch trình duyệt, không đồng hồ trình duyệt; ChonNgay là lớp bọc; WeekPicker dùng LichNho', () => {
    const ui = ['web/src/ui/ONgay.tsx', 'web/src/ui/LichNho.tsx', 'web/src/ui/ChonNgay.tsx', 'web/src/ui/Filters.tsx'].map(doc).join('\n');
    assert(!/type="date"|type="month"/.test(ui), 'còn ô lịch trình duyệt trong ui/');
    assert(!/new Date\(\)|Date\.now\(/.test(ui), 'đọc đồng hồ trình duyệt');
    const cn = doc('web/src/ui/ChonNgay.tsx');
    assert(!/<select/.test(cn) && /<ONgay/.test(cn) && !/· Đổi|>Đổi</.test(cn), 'ChonNgay chưa là lớp bọc ONgay / còn dòng "hôm nay · Đổi"');
    const f = doc('web/src/ui/Filters.tsx');
    assert(/<LichNho/.test(f) && !/function monthGrid/.test(f), 'WeekPicker chưa dùng LichNho');
    assert(/createPortal/.test(doc('web/src/ui/LichNho.tsx')) && /Gần đây/.test(doc('web/src/ui/LichNho.tsx')), 'lịch không qua portal / thiếu Gần đây');
  });

  check('NEN (4) · thành phần chung: OKhac ≥ 3, đang chọn ≠ nút chính, 6 nhãn, focus panel, menu mũi tên, ChonNguoi không bắt gõ', () => {
    const ok = doc('web/src/ui/OKhac.tsx');
    assert(/kiemGhiRoKhac\(/.test(ok) && /\.focus\(\)/.test(ok), 'OKhac chưa dùng kiemGhiRoKhac / không tự focus');
    const ui = doc('web/src/ui/ui.tsx');
    for (const x of ['export function NutChon', 'export function BoLocDoan', 'export function NhanTrangThai', 'aria-pressed', 'bg-ink-800', 'teal-600'])
      assert(ui.includes(x), `ui.tsx thiếu ${x}`);
    assert(!/doing: 'bg-doing-bg text-doing/.test(ui), 'Status doing còn mượn màu xanh của điểm (A8)');
    assert(/useGiuFocus\(/.test(doc('web/src/ui/KhungPanel.tsx')) && /useGiuFocus\(/.test(doc('web/src/ui/Drawer.tsx')), 'panel/modal chưa giữ focus');
    assert(/buocDanhSach\(/.test(doc('web/src/ui/MenuDong.tsx')), 'menu ⋯ chưa đi bằng mũi tên');
    const pp = doc('web/src/ui/PeoplePicker.tsx');
    assert(!/ít nhất 3 ký tự/.test(pp) && /Dùng tên ngoài hệ thống/.test(pp), 'ChonNguoi còn bắt gõ 3 ký tự / thiếu dòng tên ngoài');
  });

  check('NEN (4) · trả focus: đổi panel tại chỗ về nút mở ban đầu; lịch trong panel về nút lịch; khung chứa còn mở thì về khung', () => {
    /* Cây giả: P (nút trên trang) mở panel A; nút X trong A đổi sang panel B (A bị gỡ); nút Y trong B đổi lại sang A2 (B bị gỡ). */
    const tren = new Set(['P', 'A2', 'nutLich']);
    const khung: Record<string, string> = { X: 'A', Y: 'B', nutLich: 'A2', Z: 'A2' };
    const dich: Record<string, string | null> = { A: 'P', B: 'X', A2: 'Y' };
    const ve = (t: string | null) => d.traFocusVe(t, (x) => tren.has(x), (x) => khung[x] ?? null, (k) => dich[k] ?? null);
    assert(ve('X') === 'P', `B đóng → ${ve('X')}`);
    assert(ve('Y') === 'P', `A2 đóng (qua B rồi A) → ${ve('Y')}`);
    assert(ve('nutLich') === 'nutLich', 'lịch trong panel phải về nút lịch, không mượn chỗ trả của panel');
    assert(ve('Z') === 'A2', 'nút đã gỡ trong khung còn mở → về khung đó');
    assert(ve(null) === null && ve('Q') === null, 'không dấu → null');
    const vong = d.traFocusVe('m', () => false, () => 'k', () => 'm');
    assert(vong === null, 'vòng lặp phải dừng');
  });

  check('NEN (5) · YC-9: không còn ô ngày/tháng của trình duyệt (trừ thanh ngày bản demo — T12 e); không còn NgayDoiDuoc', () => {
    const sai = tepNguon('web/src').filter((f) => !/modules\/platform\/DemoBar\.tsx$/.test(f)
      && /type="date"|type="month"/.test(doc(f)));
    assert(sai.length === 0, sai.join(', '));
    const con = tepNguon('web/src').filter((f) => /NgayDoiDuoc/.test(doc(f)));
    assert(con.length === 0, `còn NgayDoiDuoc: ${con.join(', ')}`);
  });

  check('NEN (5) · chotONgay: chưa sửa không kiểm; xoá chữ báo "" rồi hiện lại value; gõ sai báo "" như ô cũ, giữ chữ + lỗi', () => {
    const toiDa = { toiDa: H };
    const j = (x: unknown) => JSON.stringify(x);
    // Chưa sửa: hạn cũ ngoài luật chỉ Tab qua → không báo, không lỗi.
    const a = d.chotONgay('01/09/2026', '2026-09-01', 'ngay', H, { toiThieu: H });
    assert(a.phat === null && a.loi === null, j(a));
    // Xoá chữ (Ngày thực hiện / Bắt đầu theo dõi = hôm nay) → báo '' rồi hiện lại hôm nay.
    const b = d.chotONgay('  ', H, 'ngay', H, toiDa);
    assert(b.phat === '' && b.text === '28/09/2026' && b.loi === null, j(b));
    // Gõ ngày không có thật / sau hôm nay → báo '' để form chặn Lưu, giữ chữ đã gõ và lỗi.
    const c = d.chotONgay('31/09/2026', H, 'ngay', H, toiDa);
    assert(c.phat === '' && c.text === '31/09/2026' && c.loi === 'Ngày không có thật', j(c));
    const e = d.chotONgay('29/09/2026', H, 'ngay', H, toiDa);
    assert(e.phat === '' && /Không được sau/.test(e.loi ?? ''), j(e));
    // Gõ sai khi giá trị đã rỗng → không báo lại; gõ đúng → báo ISO, chữ về dạng chuẩn.
    assert(d.chotONgay('31/09/2026', '', 'ngay', H, toiDa).phat === null, 'đã rỗng thì không báo lại');
    const g = d.chotONgay('1/9', H, 'ngay', H, toiDa);
    assert(g.phat === '2026-09-01' && g.text === '01/09/2026' && g.loi === null, j(g));
    // Đồng bộ: '' do chính ô báo khi gõ sai giữ nguyên chữ; value đổi thật thì viết lại.
    assert(!d.canDongBoONgay('31/09/2026', '', 'ngay', H, toiDa), 'gõ sai + value "" phải giữ chữ');
    assert(d.canDongBoONgay('28/09/2026', '', 'ngay', H, toiDa), 'nơi gọi xoá thật phải viết lại chữ');
    assert(d.canDongBoONgay('31/09/2026', '2026-09-20', 'ngay', H, toiDa), 'nơi gọi đặt ngày khác phải viết lại chữ');
    assert(!d.canDongBoONgay('28/09/2026', H, 'ngay', H, toiDa), 'chữ khớp value thì không viết lại');
  });

  check('NEN (6) · YC-8: mọi form có mục "Khác" đi qua OKhac; không còn luật "Khác ≥ 30 ký tự" trên web', () => {
    const ds = ['web/src/modules/cases/QuickReport.tsx', 'web/src/modules/yThuc/CaseSosControls.tsx', 'web/src/modules/cases/ThaoTacCase.tsx',
      'web/src/modules/cases/CapNhatTuan.tsx', 'web/src/modules/yThuc/PhoiHopSosSection.tsx', 'web/src/modules/yThuc/RecordViolationPanel.tsx',
      /* PR-YT4: "Khác" của Đề xuất QL duyệt */ 'web/src/modules/yThuc/XacNhanXuLyPanel.tsx'];   // PR-CT: ChuyenLopPanel không còn mục "Khác" — lý do là một ô chữ tự do
    for (const f of ds) assert(/<OKhac\b/.test(doc(f)), `${f} chưa dùng OKhac`);
    const web = tepNguon('web/src').map(doc).join('\n');
    assert(!/VIOLATION_OTHER_DESCRIPTION_MIN|endsWith\('\.other'\) \? 30|Mô tả rõ hơn \(chọn "Khác"\)/.test(web), 'còn luật 30 ký tự');
  });

  check('NEN (6) · tachKhac ngược ghepKhac: tách ở " — " đầu tiên, không có dấu thì Ghi rõ rỗng', () => {
    const j = (x: unknown) => JSON.stringify(x);
    const t = d.tachKhac(d.ghepKhac('Mượn máy bạn', 'Dùng điện thoại trong giờ'));
    assert(t.ghiRo === 'Mượn máy bạn' && t.moTa === 'Dùng điện thoại trong giờ', j(t));
    assert(d.ghepKhac(t.ghiRo, t.moTa) === 'Mượn máy bạn — Dùng điện thoại trong giờ', 'ghép lại ra chuỗi cũ');
    const abc = d.tachKhac('A — B — C');
    assert(abc.ghiRo === 'A' && abc.moTa === 'B — C', j(abc));
    const khong = d.tachKhac('Không nộp bài ba buổi liền');
    assert(khong.ghiRo === '' && khong.moTa === 'Không nộp bài ba buổi liền', j(khong));
  });

  check('NEN (7) · K1-56: 4 loại hạn mới có việc + tiền tố; Xác nhận nguyên nhân thay "Xác minh"', () => {
    for (const k of ['duyet', 'xu-ly-vi-pham', 'ke-hoach-bo-tro', 'mini-test']) assert(d.DEADLINE_KINDS.includes(k as any), `thiếu loại ${k}`);
    const v = d.deadlineView({ kind: 'duyet', due: '2026-10-02', today: '2026-09-28' });
    assert(/^Duyệt · hạn 02\/10/.test(v.text), v.text);
    assert(d.deadlineView({ kind: 'xac-minh-sos', due: '2026-09-30', today: '2026-09-28' }).text.startsWith('Xác nhận nguyên nhân'), 'xac-minh-sos');
  });

  check('NEN (7) · T14: ô chọn người mở danh sách ngay; trạng thái quy trình dùng NhanTrangThai', () => {
    assert(/buocDanhSach\(/.test(doc('web/src/modules/congViec/ChonPhuTrach.tsx')), 'menu ChonPhuTrach chưa đi bằng mũi tên');
    assert(/<ChonNguoi/.test(doc('web/src/modules/yThuc/PhoiHopSosSection.tsx')), 'Phối hợp SOS chưa có ô người thực hiện');
    for (const f of ['web/src/modules/yThuc/PhoiHopSosSection.tsx', 'web/src/modules/cases/CaseBoardPage.tsx', 'web/src/modules/students/StudentsPage.tsx'])
      assert(/<NhanTrangThai\b/.test(doc(f)) && !/<Status kind/.test(doc(f)), `${f} chưa dùng NhanTrangThai`);
  });

  check('NEN (8) · B3: không nút lựa chọn nào dùng btn-primary; E6: tab trang là HangTab, bộ lọc là BoLocDoan', () => {
    const sai = tepNguon('web/src').filter((f) => /\?\s*'btn-primary'\s*:\s*''/.test(doc(f)));
    assert(sai.length === 0, sai.join(', '));
    assert(/<HangTab\b/.test(doc('web/src/modules/platform/AdminPage.tsx')), 'Quản trị còn kiểu tab viên bo');
    /* PR-YT4 (M6): tab Ý thức của LỚP lọc trạng thái bằng khung trái, chỉ còn ô chọn "Nhóm vi phạm" — không còn thanh BoLocDoan. */
    for (const f of ['web/src/modules/yThuc/StudentYThucSection.tsx', 'web/src/modules/students/HanhTrinh.tsx'])
      assert(/<BoLocDoan\b/.test(doc(f)), `${f} chưa dùng BoLocDoan`);
  });

  check('NEN (9) · E1: không còn Drawer; E3: Esc/mũi tên ở đầu trang, "Không tìm thấy học viên", "Bỏ qua tới nội dung"', () => {
    const sai = tepNguon('web/src').filter((f) => /<Drawer\b/.test(doc(f)));
    assert(sai.length === 0, sai.join(', '));
    const h = doc('web/src/modules/platform/Header.tsx');
    assert(/Không tìm thấy học viên/.test(h) && /buocDanhSach\(/.test(h) && /'Escape'/.test(h) && /role="combobox"/.test(h), 'Header');
    const a = doc('web/src/App.tsx');
    assert(/Bỏ qua tới nội dung/.test(a) && /id="noi-dung"/.test(a) && /tabIndex=\{-1\}/.test(a), 'App');
  });

  check('NEN (11) · audit: chotTuan (dùng chung ô ngày + lịch); nhãn không bọc ô ngày; lịch/khung thấy focus, vừa màn; focus không rơi về body', () => {
    assert(d.chotTuan('2026-09-30', H, {}) === '2026-09-28', 'tuần mốc đầu → Thứ Hai');
    assert(d.chotTuan('2026-09-30', H, { moc: 'cuoi' }) === H, 'tuần chứa hôm nay, mốc cuối → cắt về hôm nay');
    assert(d.chotTuan('2026-09-30', H, { moc: 'cuoi', catHomNay: false }) === '2026-10-04', 'catHomNay false → Chủ nhật thật');
    assert(d.chotTuan('2026-10-07', H, { moc: 'cuoi' }) === '2026-10-11', 'tuần tương lai giữ Chủ nhật');
    const lich = doc('web/src/ui/LichNho.tsx');
    assert(!/focus:outline-none/.test(lich) && /maxHeight/.test(lich) && /chotTuan\(/.test(lich) && !/function giaTriTuan/.test(lich), 'LichNho');
    assert(/BaoOTrongNhan/.test(doc('web/src/ui/ONgay.tsx')) && /BaoOTrongNhan\.Provider/.test(doc('web/src/ui/KhungPanel.tsx'))
      && /BaoOTrongNhan\.Provider/.test(doc('web/src/ui/ui.tsx')) && /BaoOTrongNhan/.test(doc('web/src/ui/PeoplePicker.tsx')), 'nhãn còn bọc ô ngày/ô chọn người');
    assert(/document\.activeElement/.test(doc('web/src/ui/giuFocus.ts').split('useEffect(')[1] ?? ''), 'giuFocus thiếu dự phòng khi focus đã rơi về body');
    assert(/useState\(!!tuMo\)/.test(doc('web/src/ui/PeoplePicker.tsx')), 'ChonNguoi tự mở danh sách khi vừa vẽ (Q18)');
  });

  check('NEN (R2) · form có useLoiForm: Ghi rõ là một dòng luật, ô ngày bắt buộc nhận id/onBlur; khung Truong/Field không đổi thẻ; nhãn ChonNguoi có đích', () => {
    const m = 'web/src/modules/';
    for (const f of ['cases/QuickReport.tsx', 'cases/ThaoTacCase.tsx', 'cases/CapNhatTuan.tsx',
      'yThuc/XacNhanXuLyPanel.tsx', 'yThuc/RecordViolationPanel.tsx']) {
      const s = doc(m + f);
      assert(/khoa: 'ghi-ro'/.test(s) && /id=\{lf\.oId\('ghi-ro'\)\}/.test(s) && !/loiGhiRo/.test(s), `${f}: Ghi rõ chưa vào luật useLoiForm / còn cơ chế dự phòng`);
    }
    assert(/id=\{lf\.oId\('tu-tuan'\)\}/.test(doc(m + 'cases/QuickReport.tsx')) && /id=\{lf\.oId\('ngay-lam'\)\}/.test(doc(m + 'cases/ThaoTacCase.tsx'))
      && !/ChonTuan/.test(doc(m + 'cases/CapNhatTuan.tsx')), 'ô ngày bắt buộc chưa nhận id của useLoiForm (PR-SOS Q28-4: Điều chỉnh không còn ô hạn)');
    const khung = doc('web/src/ui/KhungPanel.tsx') + doc('web/src/ui/ui.tsx');
    assert(!/idO \? 'div'/.test(khung) && (khung.match(/coOTuNhan\(children\)/g) ?? []).length === 2, 'khung Truong/Field còn đổi thẻ theo id ô báo lên');
    assert(!/loi \? <div/.test(doc('web/src/ui/KhungPanel.tsx')), 'Truong còn bọc/bỏ bọc ô theo loi (ô dựng lại, mất focus)');
    assert(/<button id=\{`\$\{uid\}-o`\}/.test(doc('web/src/ui/PeoplePicker.tsx')), 'ChonNguoi đang hiện tên: nhãn không trỏ vào nút Đổi');
  });
}
