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
    const r = d.docONgay('12/10/2026', 'tuan', H, { moc: 'cuoi', toiDa: H }); assert(r.loi === 'Không được sau ' + d.tuanLich(H, H), JSON.stringify(r));   // ô tuần nói mã tuần (UXF-b), không nói "hôm nay"
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
  check('NEN (1) · hiện: ngày dd/mm/yyyy · tháng mm/yyyy · ô tuần hiện mã tuần, phụ "21/09 – 27/09"; không bao giờ ISO', () => {
    assert(d.hienONgay('2026-09-28', 'ngay') === '28/09/2026' && d.hienONgay('2026-10', 'thang') === '10/2026', 'hien');
    assert(d.hienONgay('2026-10', 'ngay-hoac-thang') === '10/2026' && d.hienONgay('', 'ngay') === '', 'hien 2');
    assert(d.phuONgay('2026-09-21', 'tuan', H) === '21/09 – 27/09', d.phuONgay('2026-09-21', 'tuan', H));
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
    for (const f of ['server/src/cases/cases.ts', 'server/src/yThuc/xuLy.ts',
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
    for (const x of ['export function NutChon', 'export function BoLocDoan', 'export function NhanTrangThai', 'aria-pressed', '!bg-[color:var(--accent-soft)]', '!border-[color:var(--accent)]'])   // OV-15a: đang chọn = nền nhấn nhạt + viền nhấn (bỏ teal)
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
    const ds = ['web/src/modules/cases/QuickReport.tsx', 'web/src/modules/yThuc/CaseSosControls.tsx', 'web/src/modules/cases/CasePanel.tsx' /* CASE-PA-UI: Nguyên nhân sửa tại chỗ */,
      'web/src/modules/cases/FormPa.tsx' /* PR-PA: Thêm / Thay PA dùng FormPa */, 'web/src/modules/yThuc/PhoiHopSosSection.tsx', /* PR-LUI-a1: Ghi vi phạm bỏ ô Ghi rõ */
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

  check('NEN (7) · K1-56: loại hạn mới có việc + tiền tố (PR-CT2 bỏ ke-hoach-bo-tro); Xác nhận (Case / PA — OV-12c) thay "Xác minh"', () => {
    for (const k of ['duyet', 'xu-ly-vi-pham', 'mini-test']) assert(d.DEADLINE_KINDS.includes(k as any), `thiếu loại ${k}`);
    assert(!d.DEADLINE_KINDS.includes('ke-hoach-bo-tro' as any), 'PR-CT2: không còn hạn Nộp kế hoạch bổ trợ');
    const v = d.deadlineView({ kind: 'duyet', due: '2026-10-02', today: '2026-09-28' });
    assert(/^Duyệt · hạn 02\/10/.test(v.text), v.text);
    assert(d.deadlineView({ kind: 'xac-minh-sos', due: '2026-09-30', today: '2026-09-28' }).text.startsWith('Xác nhận · '), 'xac-minh-sos');
  });

  check('NEN (7) · T14: ô chọn người mở danh sách ngay; trạng thái quy trình dùng NhanTrangThai', () => {
    assert(/<MenuDong /.test(doc('web/src/modules/congViec/ChonPhuTrach.tsx')), 'menu ChonPhuTrach chưa đi bằng mũi tên (GD-4c: qua MenuDong)');
    assert(/<ChonNguoi/.test(doc('web/src/modules/yThuc/PhoiHopSosSection.tsx')), 'Phối hợp SOS chưa có ô người thực hiện');
    /* PR-Dọn (Q14): StudentsPage dùng NhanTrangThai chỉ trong WorkQueue (đã xoá — web không gọi) → bỏ khỏi danh sách. */
    for (const f of ['web/src/modules/yThuc/PhoiHopSosSection.tsx', 'web/src/modules/students/CotCaseHv.tsx' /* CASE-PA-UI: trạng thái Case ở dòng tóm tắt; PA = viên `.tt-pa` (v16) */])   // PR-Pb2-a: CaseBoardPage không còn danh sách
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

  /* GD-4d (PTA Plan rà #1641): một chân panel việc chỉ MỘT nút "Đóng" — chân thường đã có "Đóng" mặc định (`huy`) thì `NutDongPanel` / `NutVaTiep`
     không vẽ thêm; panel đặt "Đóng" sát nút (⑤ D1a) dùng `huy: null`. */
  check('GD-4d · chân panel việc một nút "Đóng": KhungPanel chặn NutDongPanel khi chân đã có huy; Xác nhận xử lý huy: null', () => {
    const khung = doc('web/src/ui/KhungPanel.tsx');
    assert(/DongKhungPanel\.Provider value=\{trongCot \|\| \(chan && !chan\.v3 && huy\) \? null : dong\}/.test(khung), 'KhungPanel phải tắt DongKhungPanel khi chân đã có nút Đóng mặc định');
    assert(/useContext\(DongKhungPanel\)/.test(doc('web/src/ui/KhuonViec.tsx')), 'NutDongPanel phải đọc DongKhungPanel');
    assert(/huy: null, chinh: nutChinh/.test(doc('web/src/modules/yThuc/XacNhanXuLyPanel.tsx')), 'Xác nhận xử lý: huy: null (Đóng đi cùng NutVaTiep)');
  });

  check('NEN (9) · E1: không còn Drawer; E3: Esc/mũi tên ở đầu trang, "Không tìm thấy học viên", "Bỏ qua tới nội dung"', () => {
    const sai = tepNguon('web/src').filter((f) => /<Drawer\b/.test(doc(f)));
    assert(sai.length === 0, sai.join(', '));
    const h = doc('web/src/modules/platform/Header.tsx');
    assert(/Không thấy “\{q\}” trong phạm vi/.test(h) && /buocDanhSach\(/.test(h) && /'Escape'/.test(h) && /role="combobox"/.test(h), 'Header');
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
    for (const f of ['cases/QuickReport.tsx' /* CASE-PA-UI: Sửa Case (Ghi rõ) gỡ khỏi ThaoTacCase — Nguyên nhân dùng OKhac */, 'cases/FormPa.tsx',
      'yThuc/XacNhanXuLyPanel.tsx']) {
      /* PR-PA: luật của form PA (gồm Ghi rõ) ở shared/domain/paDongBo.ts (`loiFormPa`). */
      const s = doc(m + f) + (f === 'cases/FormPa.tsx' ? doc('shared/domain/paDongBo.ts') : '');
      /* PR-PA: FormPa đặt tiền tố khoá (`k('ghi-ro')`, `${tien}ghi-ro`) cho Thay PA trong Kết quả. */
      assert(/khoa: (?:'|`\$\{(?:t|tien)\})ghi-ro/.test(s) && /id=\{lf\.oId\((?:k\()?'ghi-ro'\)\)?\}/.test(s) && !/loiGhiRo/.test(s), `${f}: Ghi rõ chưa vào luật useLoiForm / còn cơ chế dự phòng`);
    }
    assert(/id=\{lf\.oId\('tu-tuan'\)\}/.test(doc(m + 'cases/QuickReport.tsx')) && /id=\{lf\.oId\('ngay-lam'\)\}/.test(doc(m + 'cases/ThaoTacCase.tsx'))
      && !/ChonTuan/.test(doc(m + 'cases/CapNhatTuan.tsx')), 'ô ngày bắt buộc chưa nhận id của useLoiForm (PR-SOS Q28-4: Điều chỉnh không còn ô hạn)');
    const khung = doc('web/src/ui/KhungPanel.tsx') + doc('web/src/ui/ui.tsx');
    assert(!/idO \? 'div'/.test(khung) && (khung.match(/coOTuNhan\(children\)/g) ?? []).length === 2, 'khung Truong/Field còn đổi thẻ theo id ô báo lên');
    assert(!/loi \? <div/.test(doc('web/src/ui/KhungPanel.tsx')), 'Truong còn bọc/bỏ bọc ô theo loi (ô dựng lại, mất focus)');
    assert(/<button id=\{oId\}/.test(doc('web/src/ui/PeoplePicker.tsx')) && /const oId = id \?\? `\$\{uid\}-o`/.test(doc('web/src/ui/PeoplePicker.tsx')), 'ChonNguoi đang hiện tên: nhãn không trỏ vào nút Đổi');
  });

  /* V22 (chủ SP 14/11, DESIGN.md): hạn / số quá hạn chỉ bằng MÀU (đỏ quá · vàng gần · thường chưa tới), KHÔNG ⚠ / biểu tượng. ⚠ chỉ còn cho lỗi, chặn,
     xác nhận. Chống tái phát: ⚠ (hay `<IconCanhBao`) đứng trong vài chục ký tự quanh chữ / khoá hạn trên CÙNG một dòng mã (bỏ chú thích) → lỗi;
     CSS: `content: '⚠'` ở bộ chọn hạn / số xấu → lỗi. */
  check('V22 · hạn chỉ bằng màu: không ⚠ / IconCanhBao cạnh chữ hạn (web .tsx, shared/domain) và không ::before ⚠ cho hạn / số xấu (index.css)', () => {
    const boChuThich = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' ')).replace(/(^|[^:'"`\\])\/\/.*$/gm, '$1');
    const HAN = /quá hạn|hạn hôm nay|hạn \{|hạn \$\{|còn \{n\} ngày|\{n\} ngày|quaHan|qua-han|'qua'|late:|overdue|treNgay|daysOverdue|ganHan|\bhan\b/i;
    /* Ngoại lệ có lý do: [tệp, mẩu chữ của dòng]. */
    const NGOAI_LE: [string, string][] = [
    ];
    const tep = [...tepNguon('web/src').filter((f) => f.endsWith('.tsx')), ...tepNguon('shared/domain')];
    const loi: string[] = [];
    for (const f of tep) {
      boChuThich(doc(f)).split('\n').forEach((dong, i) => {
        for (const m of dong.matchAll(/⚠|<IconCanhBao\b/g)) {
          const quanh = dong.slice(Math.max(0, m.index! - 60), m.index! + 40);
          if (HAN.test(quanh) && !NGOAI_LE.some(([nf, chu]) => nf === f && dong.includes(chu))) loi.push(`${f}:${i + 1}: ${quanh.trim()}`);
        }
      });
    }
    for (const m of boChuThich(doc('web/src/index.css')).matchAll(/([^{}]*)\{[^{}]*content:\s*["'][^"']*⚠/g)) {
      if (/qua|han|late|tre|so-bam|dai-cs/i.test(m[1])) loi.push(`index.css: ${m[1].trim()}`);
    }
    assert(loi.length === 0, `${loi.length} chỗ hạn còn ⚠ (V22: chỉ màu): ` + loi.slice(0, 6).join(' · '));
  });
  /* PTA Plan rà #1649: V22 "không ⚠ hay biểu tượng nào kèm" — cả chấm "●" ở chip / badge báo hạn, quá hạn, việc chờ. Chấm "có việc mới" trên tab giữ. */
  check('V22 · không chấm "●" ở chip hạn / quá hạn / việc chờ: Nhan late + soon, DongHan, BadgeViec qua + cho, .vh-qua, badge lớp; "●" chữ không đứng cạnh chữ hạn', () => {
    const nhan = doc('web/src/ui/Nhan.tsx');
    assert(/late: 'bg-late-bg text-late', soon: 'bg-soon-bg text-soon'/.test(nhan), 'Nhan: tông late / soon không được kèm CHAM');
    assert(!/cham\(/.test(doc('web/src/ui/DongHan.tsx')), 'DongHan: chip hạn không chấm');
    assert(/tong === 'qua' \|\| tong === 'cho' \? null/.test(doc('web/src/modules/yThuc/khoiYThuc.tsx')), "BadgeViec: 'qua' / 'cho' không chấm");
    assert(/\.vh-qua::before \{ content: none; \}/.test(doc('web/src/index.css')), '.vh-qua không chấm');
    /* GD-6: badge lớp qua MỘT thành phần `ChipBadgeLop` (Nhan cham={false}) ở hồ sơ lớp + Học viên & Lớp. */
    assert(/export function ChipBadgeLop[\s\S]{0,400}<Nhan tone=\{toneBadgeLop\(x\)\} cham=\{false\}/.test(doc('web/src/ui/Nhan.tsx')), 'ChipBadgeLop: badge lớp (đếm việc chờ / quá hạn) cham={false}');
    const HAN = /quá hạn|hạn hôm nay|hạn \{|chờ chấm|còn \{n\} ngày/i;   // "● … chưa chốt / chưa lưu" là trạng thái lưu nháp — không phải hạn
    const loi: string[] = [];
    for (const f of tepNguon('web/src').filter((x) => x.endsWith('.tsx'))) {
      doc(f).split('\n').forEach((dong, i) => {
        if (/^\s*(\/\/|\*|\/\*)/.test(dong)) return;
        for (const m of dong.matchAll(/●/g)) {
          const quanh = dong.slice(Math.max(0, m.index! - 60), m.index! + 60);
          if (HAN.test(quanh)) loi.push(`${f}:${i + 1}`);
        }
      });
    }
    assert(loi.length === 0, `${loi.length} chỗ "●" cạnh chữ hạn / việc chờ: ` + loi.slice(0, 6).join(' · '));
  });

  console.log('\nGD-6 · Hồ sơ lớp (mockup ②)');
  check('GD-6 · đầu trang: "+ Task" (lopId + em của lớp đã nạp, mục theo quyền) thay "+ Case"; bản nổi 375; lớp đã kết thúc không nút', () => {
    const s = doc('web/src/modules/classes/DauTrangLop.tsx');
    assert(!/>\+ Case<\/button>/.test(s), 'còn nút "+ Case" ở đầu hồ sơ lớp');
    assert(/<NutTask noi="dau" lopId=\{data\.id\} muc=\{loaiTask\} dsEm=\{tomTat\?\.emTask\} \/>/.test(s), 'thiếu "+ Task" đầu trang');
    assert(/<NutTask noi="noi" lopId=\{data\.id\}/.test(s), 'thiếu "+ Task" nút nổi 375');
    assert(/loaiTask\.length > 0 && data\.status !== 'finished'/.test(s), '[XM-9] lớp đã kết thúc vẫn có "+ Task"');
    assert(/canReportCase \? \['case'/.test(s) && /canRecordViolation \? \['vi-pham'/.test(s), 'mục "+ Task" không theo quyền');
    const n = doc('web/src/modules/congViec/NutTask.tsx');
    assert(/const timTaiCho: TimXa \| null = dsEm \?/.test(n) && /t\('Lớp này'\)/.test(n), '[XM-7] chọn em ở hồ sơ lớp phải lọc tại chỗ, nhóm "Lớp này"');
    assert(!/api\.get[^\n]*dsEm/.test(n), 'chọn em từ em đã nạp không được gọi máy chủ');
  });
  check('GD-6 · "Việc cần làm": chip theo loại dùng chung với "Lớp của tôi", mở thẳng panel "i / n" + "Việc tiếp ›"; bỏ "+n việc ở Công việc"', () => {
    const s = doc('web/src/modules/classes/ThanhViecLop.tsx');
    assert(/chipViecLop\(data\?\.cuaToi \?\? \[\], classId\)/.test(s), 'dải không dùng chipViecLop chung');
    assert(/<NutChipViec /.test(s) && /NutChipViec key=\{c\.tab\}/.test(doc('web/src/modules/congViec/LopCuaToi.tsx')), 'chip không dùng chung một nút');
    assert(/<DemViecPanel\.Provider value=\{\{ i: mo\.i \+ 1, n: mo\.ds\.length/.test(s), 'thiếu "i / n" ở đầu panel');
    assert(/c\.tab === 'cham-diem' \? setNhapDiem\(true\)/.test(s) && /<PanelNhapDiemLop /.test(s), 'chip Nhập điểm phải mở panel nhập điểm của lớp');
    assert(!/việc ở Công việc/.test(s) && !/TOI_DA/.test(s), 'còn lối tắt "+n việc ở Công việc ›"');
    const k = doc('web/src/ui/KhungPanel.tsx');
    assert(/export const DemViecPanel = createContext/.test(k) && /\{oDem\}\{nutDong\}/.test(k), 'KhungPanel thiếu ô "i / n" trước ✕');
  });
  check('GD-6 · phần mở rộng em: TVV chỉ ở "Điểm theo lượt"; thẻ kỹ năng / môn quá hạn chỉ màu (V22); lịch sử Case + Nhật ký PA = LichSuGap', () => {
    const b = doc('web/src/modules/classes/BangHoSoLop.tsx');
    assert(!/tvvChinhCuaLop|tvvRieng/.test(b), 'còn TVV dưới tên em');
    assert(/\{r\.tvv && <span className="ml-auto text-xs font-medium text-faint">TVV \{r\.tvv\}<\/span>\}/.test(b), 'thiếu TVV nhỏ ở đầu khối Điểm theo lượt');
    assert(/quaHan\.has\(k\) \? 'text-late' : 'text-slate-100'/.test(b), 'thẻ kỹ năng quá hạn phải tô màu');
    const lt = doc('web/src/modules/classes/BangDiemLopThuong.tsx');
    assert(/qua \? 'text-late' : 'text-slate-100'/.test(lt), 'thẻ môn quá hạn phải tô màu');
    assert(!/quaHan\.has\(k\)[^\n]*⚠/.test(b) && !/\{qua &&[^\n]*⚠/.test(lt), '⚠ cạnh quá hạn ở thẻ kỹ năng / môn (V22 chỉ màu)');
    const c = doc('web/src/modules/cases/CasePanel.tsx');
    /* Sau merge GD-7 (#1653): CasePanel đã gập lịch sử + nhật ký PA bằng `LichSuGap` — giữ bản GD-7. */
    assert(/<LichSuGap so=\{lichSu\.length\}/.test(c) && /<LichSuGap so=\{soNhatKy\}/.test(c) && !/<details className="group">/.test(c), 'lịch sử Case / nhật ký PA chưa dùng LichSuGap');
  });
  check('GD-6 · đầu trang: dải chỉ số chung + badge lớp cuối dải; không TVV; GV không badge "việc quá hạn của lớp"; tab Ý thức có thang vạch', () => {
    const s = doc('web/src/modules/classes/DauTrangLop.tsx');
    assert(/<DaiChiSo nhan=\{t\('Số của lớp'\)\}>/.test(s) && /\{bConLai\.hien\.map\(nutBadge\)\}(?:(?!<ODai|<\/DaiChiSo>)[\s\S])*<\/DaiChiSo>/.test(s), 'badge lớp phải ở cuối dải số');
    assert(!/tvvChinhCuaLop|tomTat\?\.tvv/.test(s), 'còn TVV ở đầu trang (lời 25)');
    assert(/soViecQuaHan: laVaiQuanLy\(session\?\.roles\) \? soViecQuaHan : 0/.test(s), '[XM-2] GV còn badge "việc quá hạn của lớp"');
    assert(/<ThangVach dong=\{hv\.dongThang\} \/>/.test(doc('web/src/modules/yThuc/ClassYThucCard.tsx')), 'tab Ý thức lớp thiếu thang vạch (lời 28, 36)');
  });
  check('GD-6 rà PTA · chip lớp "loại · số" MỘT thành phần (hồ sơ lớp + Học viên & Lớp); badge tab là số; tab Báo cáo PH chỉ nhãn; ⋯ thẻ em chung; TVV không dưới tên em tab Ý thức', () => {
    const b = d.badgeLop({ vai: 'gv', needsPlacement: false, canXepLop: 0, soChuaLoTrinhTiep: 7, missingSkills: [], soBaiChoCham: 21, needScoresTitle: null, phase: 'running', missingCount: 3, soChoDuyet: 8, soViecQuaHan: 2 });
    const nhan = Object.fromEntries([...b.hien, ...b.an].map((x: any) => [x.key, x.nhan]));
    assert(nhan.cham === 'Chờ chấm · 21' && nhan['cho-duyet'] === 'Chờ duyệt · 8' && nhan['qua-han'] === 'Quá hạn · 2' && nhan['xep-lop'] === 'Chưa chốt lộ trình · 7' && nhan['thieu-tt'] === 'Thiếu thông tin · 3', JSON.stringify(nhan));
    const dau = doc('web/src/modules/classes/DauTrangLop.tsx'), sp = doc('web/src/modules/students/StudentsPage.tsx');
    assert(/<ChipBadgeLop key=\{x\.key\} x=\{x\}/.test(dau) && /<ChipBadgeLop key=\{x\.key\} x=\{x\}/.test(sp) && !/toneBadgeLop\(x\)/.test(dau + sp), 'chip lớp chưa dùng một thành phần');
    const pg = doc('web/src/modules/classes/ClassOverviewPage.tsx');
    assert(/\.\.\.badgeTabLop\(k\)/.test(pg) && !/chip: k === 'bao-cao-ph'/.test(pg) && !/canhBao: k === 'y-thuc'/.test(pg), 'tab hồ sơ lớp: badge số, không chip / chấm trong nhãn');
    assert(/lopNut=\{NUT_BA_CHAM\}/.test(doc('web/src/modules/classes/BangHoSoLop.tsx')) && /menu\(s, NUT_BA_CHAM\)/.test(doc('web/src/modules/classes/BangDiemLopThuong.tsx')), '⋯ thẻ em chưa dùng NUT_BA_CHAM');
    const yt = doc('web/src/modules/yThuc/ClassYThucCard.tsx');
    assert(!/tvvChinh|t\('TVV \{ten\}', \{ ten: tvv \}\)/.test(yt) && /<NutLichSuGap /.test(yt), 'tab Ý thức: TVV dưới tên em / lịch sử chưa cùng dáng');
    assert(/demChotTheoLop\(\[classId\]\)/.test(doc('server/src/classes/daiChuyenLop.ts')), 'dải Chốt lộ trình cho mọi người xem lớp');
  });

  console.log('\nGD-16 · Lưu trữ (mockup ⑩)');
  check('GD-16 · Lưu trữ: 3 tab có số (Đã xoá đếm một câu khi mở trang, danh sách chỉ khi bấm tab); chia chi nhánh; học viên theo lớp cuối; câu 30 ngày vào ⓘ; thứ tự máy chủ giữ', () => {
    const s = doc('web/src/modules/students/LuuTruPage.tsx');
    assert(/key: 'xoa', label: t\('Đã xoá'\), so: demXoa\.data\?\.n/.test(s) && /useApi<\{ n: number \}>\('\/thung-rac\/dem\?loai=hoc_vien'\)/.test(s), 'tab Đã xoá có số từ /thung-rac/dem');
    assert(/\{tab === 'xoa' && <DaXoaAdmin loai="hoc_vien"/.test(s), 'danh sách Đã xoá chỉ gắn ở tab Đã xoá (nạp khi bấm)');
    assert(/theoChiNhanh\(data\?\.lop/.test(s) && /theoChiNhanh\(data\?\.hocVien/.test(s), 'chưa chia theo chi nhánh');
    assert(/s\.lopCuoiId != null \? String\(s\.lopCuoiId\) : 'chua'/.test(s) && /'hang-nhom-lop'/.test(s), 'học viên chưa nhóm theo lớp cuối (dải trong bảng)');
    assert(!/key: 'cn', nhan: t\('Chi nhánh'\)/.test(s), 'còn cột Chi nhánh ở hàng (đã ở dải)');
    assert(!/\.sort\(/.test(s), 'trang không tự xếp lại — giữ thứ tự máy chủ (`soSanhLopLuuTru`)');
    const dx = doc('web/src/modules/platform/DaXoaAdmin.tsx');
    assert(/<NutLuat label=\{t\('Đã xoá'\)\}>\{t\('Giữ 30 ngày, sau đó xoá hẳn\.'\)\}<\/NutLuat>/.test(dx), 'câu 30 ngày phải vào ⓘ ở Lưu trữ');
    assert(/useApi<MucRac\[\]>\(loai \? `\/thung-rac\?loai=\$\{loai\}` : '\/thung-rac'\)/.test(dx), 'một loại → máy chủ lọc loại');
    const kp = doc('server/src/platform/khoiPhucRac.ts');
    assert(/\$\{loai \? ' AND t\.loai = \?' : ''\}/.test(kp) && /export const demRac = \(p: Principal, loai: MucRac\['loai'\]\) => \(\{ n: danhSachRac\(p, loai\)\.length \}\)/.test(kp), 'đếm cùng tập danh sách (một câu, lọc loại trong SQL)');
    const lt = doc('server/src/classes/luuTru.ts');
    assert(/lopCuoiId: lopCuoiCua\.get\(s\.id\)\?\.id \?\? null/.test(lt) && /branchId: r\.branch_id/.test(lt), 'máy chủ trả branchId / lopCuoiId');
  });

  console.log('\nGD-17a · Quản trị — nhật ký một dáng, panel QL, dải chỉ xem');
  check('GD-17a · nhật ký một dáng (DsLichSu) ở cột phải + Nhật ký chung; QL "Xem tất cả" mở panel tại chỗ (không tab mới); lọc Mục ô chọn thường, Người ô có tìm; một dải chỉ-xem', () => {
    const nk = doc('web/src/modules/platform/NhatKyChung.tsx');
    assert(/<DsLichSu dong=\{dong\.map\(\(d\) => dongLs\(d, true\)\)\}/.test(nk) && /<DsLichSu dong=\{dong\.map\(\(d\) => dongLs\(d, false\)\)\}/.test(nk), 'Nhật ký chung và cột phải chưa cùng DsLichSu');
    assert(/<KhungPanel tieuDe=\{t\('Nhật ký cấu hình'\)\}/.test(nk) && /onClick=\{\(\) => \{ setMucPanel\(''\); setMoPanel\(true\); \}\}>\{t\('Xem tất cả'\)\}<\/button>/.test(nk), 'QL thiếu nút Xem tất cả mở panel');
    assert(/<OChonThuong aria-label=\{t\('Mục'\)\}/.test(nk) && /<ChonLoc [^\n]*ariaLabel=\{t\('Người'\)\}/.test(nk) && !/ChonDangNut/.test(nk), 'lọc Mục / Người chưa đúng mẫu ô chọn');
    const ad = doc('web/src/modules/platform/AdminPage.tsx');
    assert(/!quanTri && tab !== 'da-xoa' && \(\s*<DaiChiXem lon>/.test(ad) && !/Quản trị hệ thống sửa; Quản lý xem/.test(ad + doc('web/src/modules/platform/HanMacDinhAdmin.tsx')), 'câu chỉ-xem phải một chỗ (dải dưới hàng tab)');
    assert(!/🔒/.test(doc('web/src/modules/platform/CauHinhCaseSos.tsx')), 'Case & SOS còn nhãn chỉ-xem riêng');
    assert(/\.ls-hep \.ls-ds time \{ grid-column: 1 \/ -1; \}/.test(doc('web/src/index.css')), 'cột hẹp: giờ trên dòng');
  });

  console.log('\nGD-17b · Quản trị › Chương trình sửa tại ô');
  check('GD-17b · Chương trình: sửa tại ô (SuaTaiDong, một trường, cùng luật + thân PUT với panel), cột Môn · Đạt từ · Còn dùng (công tắc + Hoàn tác); + Chương trình giữ panel; bỏ nút Sửa', () => {
    const s = doc('web/src/modules/platform/CatalogAdmin.tsx');
    for (const o of ['ten', 'mon', 'nguong', 'so-tuan', 'moc']) assert(new RegExp(`<OCt d=\{d\} o="${o}"`).test(s), `thiếu ô sửa tại chỗ "${o}"`);
    assert(/function yeuCauLuu\(d: Dong, f: FormCt\)/.test(s) && (s.match(/yeuCauLuu\(/g) ?? []).length >= 4, 'panel, ô, công tắc, Hoàn tác phải cùng yeuCauLuu');
    assert(/role="switch" aria-checked=\{bat\}/.test(s) && /toast\.hoanTac\(gt \?/.test(s), 'Còn dùng: công tắc + Hoàn tác');
    assert(/<KhungPanel tieuDe=\{form\.f\.ma \?/.test(s) && !/>\{t\('Sửa'\)\}<\/button>/.test(s) && !/function SuaChuongTrinh/.test(s), '+ Chương trình giữ panel; sửa dòng không còn panel / nút Sửa');
    assert(/export function SuaTaiDong\(/.test(doc('web/src/modules/platform/SuaTaiDong.tsx')) && /vien = false/.test(doc('web/src/modules/platform/SuaTaiDong.tsx')), 'SuaTaiDong dùng chung (ô có viền)');
    assert(/closest\('\.card'\)/.test(doc('web/src/ui/HopNeo.tsx')) && /phai - rong/.test(doc('web/src/ui/HopNeo.tsx')), 'HopNeo phải nằm trong thẻ chứa ô (không đè cột Nhật ký)');
  });

  console.log('\nGD-17c · Quản trị — Tài khoản, Case & SOS, Mở sửa lịch Test, Đã xoá');
  check('GD-17c · Tài khoản ô chọn thường một dáng + badge mờ; Case & SOS "Ẩn" / "+ Thêm nhóm" là nút, tên nhóm ô có viền; Mở sửa lịch Test là công tắc + Hoàn tác; Đã xoá câu 30 ngày vào ⓘ', () => {
    const ac = doc('web/src/modules/platform/AccountsAdmin.tsx');
    assert(!/ChonDangNut|<select className="field w-36"/.test(ac) && (ac.match(/<OChonThuong /g) ?? []).length >= 4 && /<BadgeMo so=\{pending\.length\} \/>/.test(ac), 'Tài khoản: ô chọn / badge');
    assert(!/<select className="field w-44/.test(doc('web/src/modules/platform/SuaVaiChiNhanh.tsx')), 'hộp sửa vai còn select.field');
    const bd = doc('web/src/modules/platform/cauHinh/BangDanhSach.tsx');
    assert(!/btn-ghost[^"]*"[^>]*>\{t\('Ẩn'\)\}/.test(bd) && !/btn-ghost[^\n]*\+ \{n\.themChu\}/.test(bd) && !/aria-hidden className="text-slate-500">✎/.test(bd), 'Case & SOS: "Ẩn" / "+ Thêm nhóm" là nút, tên không ✎');
    const ms = doc('web/src/modules/platform/MoSuaLichTest.tsx');
    assert(/role="switch" aria-checked=\{data\.bat\}/.test(ms) && /toast\.hoanTac\(chu, \(\) => doi\(!bat, true\)/.test(ms) && !/t\('Bật'\)/.test(ms), 'Mở sửa lịch Test: công tắc + Hoàn tác');
    const dx = doc('web/src/modules/platform/DaXoaAdmin.tsx');
    assert(!/<p className="m-0 text-xs text-slate-500">\{t\('Giữ 30 ngày/.test(dx), 'Đã xoá: câu 30 ngày vào ⓘ');
    assert(/\{pending\.length > 0 && \(/.test(doc('web/src/modules/platform/AccountsAdmin.tsx')) && !/Đăng ký chờ duyệt'\)\} <span className="tabular-nums">0/.test(doc('web/src/modules/platform/AccountsAdmin.tsx')), 'lời 40: 0 đăng ký thì không hiện dòng');
    assert(/<OBang c=\{COT\[0\]\} className="!overflow-visible !px-0/.test(doc('web/src/modules/platform/cauHinh/BangDanhSach.tsx')), 'nút kéo ⠿ không bị cắt thành "⠿…"');
  });

  console.log('\nGD-11c · Trang lượt Test (FT + lớp thường)');
  check('GD-11c · Chỉnh lịch menu chuẩn (không dòng mô tả, mục tắt có lý do); Lớp lúc Test là link; MỘT khối "Lịch sử · n"; ⓘ Writing; ⋯ cao bằng nút chính', () => {
    const md = doc('web/src/modules/fasttrack/MockDetailPage.tsx'), lt = doc('web/src/modules/fasttrack/LuotThuongPage.tsx');
    const menu = md.slice(md.indexOf('const headerItems: MucMenu[] = ['), md.indexOf('const laRf ='));
    assert(!/\bgoi:/.test(menu), 'Chỉnh lịch: còn dòng mô tả dưới mục');
    assert(/tat: true, title: t\('Chưa có kết quả nào bị huỷ'\)/.test(menu) && /lyDoXoa \? \{ tat: true, title: lyDoXoa \}/.test(menu), 'Chỉnh lịch: mục tắt phải có lý do');
    assert(/<LopLucTest lop=/.test(md) && /<LopLucTest lop=\{d\.class\} nay=\{d\.lopHienTai\} \/>/.test(lt) && /to=\{`\/hoc-vien\/lop\/\$\{lop\.id\}`\}/.test(md), 'Lớp lúc Test phải là link hồ sơ lớp');
    for (const x of [md, lt]) {
      assert(!/tieuDe=\{t\('Lịch sử lượt'\)\}/.test(x) && (x.match(/<LichSuGon /g) ?? []).length === 1, 'một khối Lịch sử · n mỗi trang');
      assert(!/<VungMoKn [^>]*lichSu=/.test(x) && /lopNut=\{NUT_BA_CHAM_DONG\}/.test(x) && /<MuiMoDong mo=/.test(x), 'vùng mở không còn dải Lịch sử riêng; ⋯ + mũi mở dùng chung');
      assert(!/title=\{t\('Bạn không được phân công kỹ năng này'\)\}/.test(x), 'Chỉ xem: lý do qua lyDoChiDoc');
    }
    assert(/k === 'writing' && <NutLuat label=\{t\('Cách tính Writing'\)\}>/.test(md), 'ⓘ công thức Writing cạnh tên');
    const od = doc('web/src/modules/fasttrack/ODiemLon.tsx');
    assert(/const oTask = \(c: Cell, gon: boolean\)/.test(od) && /bai\.map\(\(c\) => oTask\(c, gon\)\)/.test(od) && !/t\('Nhập'\)\}/.test(od), 'Writing = hai ô W1 / W2 (chủ SP 15/11), không còn chữ "W1 Nhập · W2 Nhập"');
    const nk = doc('shared/domain/nhatKy.ts');
    assert(/'attempt\.huy_tay': 'Huỷ điểm'/.test(nk) && /'score\.khoi_phuc': 'Khôi phục'/.test(nk) && !/Huỷ môn|Khôi phục điểm/.test(nk), 'nhật ký: một tên Huỷ điểm / Khôi phục');
  });
}
