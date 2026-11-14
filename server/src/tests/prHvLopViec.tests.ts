/**
 * PHÉP KIỂM HV-LOP-VIEC (PANEL-V10 khung `#hvl`): Học viên & Lớp — cột Việc 300 px mép phải, tối đa 2 nút việc một dòng + "+n việc" mở panel một em,
 * điểm mini ✓ / ✗ (đạt / không đạt, không nền đỏ ô). Thành phần web không chạy được ở đây → quét nguồn + hàm thuần `chuMiniKn`.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { YThucTestKit } from './yThuc.tests.ts';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..');
const doc = (f: string) => fs.readFileSync(path.join(REPO, f), 'utf8').replace(/\r\n/g, '\n');
const than = (src: string, mo: string) => {
  const i = src.indexOf(mo);
  if (i < 0) return '';
  const het = src.indexOf('\n}\n', i);
  return src.slice(i, het < 0 ? undefined : het);
};

export async function runPrHvLopViecTests(t: YThucTestKit) {
  const { check, assert } = t;
  console.log('\nHV-LOP-VIEC · Học viên & Lớp: cột Việc hẹp mép phải');
  const d: any = await import('../../../shared/domain/index.ts');
  const ds = doc('web/src/modules/students/DanhSachHvLop.tsx');
  const trang = doc('web/src/modules/students/StudentsPage.tsx');

  /* U04 (mockup V11 duyệt 03/11, chủ SP "vừa 1280"): ⋯ cột cuối, Việc của tôi giãn, các cột khác cố định — thay H1 cũ (Việc 300 mép phải). */
  check('U04 · COT_HV: Việc của tôi giãn ngay trước ⋯ (cột cuối); cột cố định cộng ≤ 960 (vừa 1280)', () => {
    const m = /const COT_HV: CotBang\[\] = \[([\s\S]*?)\n\];/.exec(ds);
    assert(m, 'thiếu COT_HV');
    const keys = [...m![1].matchAll(/key: '(\w+)'/g)].map((x) => x[1]);
    assert(keys.at(-1) === 'nut' && keys.at(-2) === 'viec', `thứ tự cột ${keys.join(',')}`);
    assert(!/key: 'viec'[^}]*rong:/.test(m![1]), 'Việc phải giãn');
    const tong = [...m![1].matchAll(/rong: (\d+)/g)].reduce((n, x) => n + Number(x[1]), 0);
    assert(tong <= 960, `cột cố định ${tong} px > 960`);
  });

  /* GD-13a (mockup v21 ⑥ R6.3): ô "+n việc" thay bằng nút-chip mỗi loại việc ("{loại} · {số}", chung Công việc / hồ sơ lớp); dải dưới hàng vẫn liệt kê từng việc. */
  check('GD-13a · OViecCan: nút-chip chuẩn mỗi loại (chipViecEm + NutChipViec), bấm = việc gấp nhất, panel đi hết loại; không còn "+n việc" / "Xem thêm"', () => {
    const o = than(ds, 'export function OViecCan');
    assert(o.length > 150, 'thiếu OViecCan');
    assert(o.includes('chipViecEm(') && o.includes('<NutChipViec') && /onMo\(c\.dau, c\.ds\)/.test(o), 'chip phải mở việc đầu + cả loại');
    assert(!o.includes("'+{n} việc'") && !o.includes("'Xem thêm {n}'"), 'còn "+n việc" / Xem thêm');
    assert(/key: 'viec', nhan: t\('Việc cần làm'\)/.test(ds) && !/t\('Việc tiếp'\), kieu/.test(ds), 'một tên cột "Việc cần làm" ở Tất cả + Đang SOS');
    assert(!/function HanViec/.test(ds), 'bỏ HanViec');
  });

  check('U04-5 · cột Việc chỉ việc của tôi (mọi vai) — cùng nguồn /my-work, không ?nguoi=tat-ca', () => {
    assert(/if \(!it\.mine\) continue;/.test(trang) && !/nguoi=tat-ca/.test(trang), 'chỉ việc mine');
  });

  check('H1 · chuMiniKn: ✗ khi dưới kỳ vọng, ✓ khi đạt, — khi chưa có; KCK dưới không ✗', () => {
    assert(d.chuMiniKn(5.0, 6.0) === '✗ 5.0', String(d.chuMiniKn(5.0, 6.0)));
    assert(d.chuMiniKn(6.5, 6.5) === '✓ 6.5', String(d.chuMiniKn(6.5, 6.5)));
    assert(d.chuMiniKn(7.0, 6.5) === '✓ 7.0', 'vượt = đạt');
    assert(d.chuMiniKn(null, 6.0) === '—', 'null');
    assert(d.chuMiniKn(6.0, null) === '6.0', 'không kỳ vọng → không ký hiệu');
    assert(d.chuMiniKn(5.0, 6.0, true) === '5.0', 'KCK dưới kỳ vọng không tô / không ✗');
  });

  check('H1 · "+n việc" không mất việc ngoài Case: PanelMotEm có khối "Việc khác" từ việc trang đã nạp, làm tại chỗ (PanelViec thay nội dung, ← tên em)', () => {
    const pm = doc('web/src/modules/students/PanelMotEm.tsx');
    assert(pm.includes("t('Việc khác')") && /viecTrang \?\?/.test(pm), 'thiếu khối Việc khác dùng viecTrang');
    assert(/!\(x\.caseId && VIEC_CUA_NHOM\[x\.group\]\)/.test(pm), 'Việc khác phải gồm mọi việc ngoài khối Case');
    assert(/<QuayLaiPanel\.Provider value=\{\{ nhan: ten/.test(pm) && pm.includes('<PanelViec it={viecKhacMo}'), 'PanelViec thay nội dung + ← tên em');
    assert(/lamTaiCho\(v\)[\s\S]{0,500}to=\{v\.href\}/.test(pm), 'việc không làm tại chỗ → link trang của việc');
    assert(/viecTrang=\{viecHien\.get\(panelEm\.id\)/.test(trang), 'StudentsPage truyền việc đã nạp (0 câu thêm)');
    const kp = doc('web/src/ui/KhungPanel.tsx');
    assert(/quayLaiRieng \?\? quayLaiNgoai/.test(kp) && /<QuayLaiPanel\.Provider value=\{null\}>/.test(kp), 'KhungPanel: ← từ nơi mở chỉ cho panel ngoài cùng');
  });

  check('H1 · dải mở hàng Lịch thi: ô kỹ năng ✓ / ✗ qua datKv, em KCK dưới kỳ vọng không ✗ (truyền kck)', () => {
    const hang = doc('web/src/modules/students/HangLichThi.tsx');
    const ok = than(hang, 'function OKn');
    assert(ok.includes('datKv(v, kv, kck)'), 'OKn phải dùng datKv(v, kv, kck)');
    assert((hang.match(/kck=\{r\.kck\}/g) ?? []).length >= 2, 'DaiMo thiếu kck={r.kck} ở ô Overall / kỹ năng');
    assert(!hang.includes('bg-bad-bg'), 'còn nền đỏ ô');
  });

  check('U04 [XM] PTA 04/11 · Fast Track / Lớp thường hai trạng thái: luôn một mục chọn, mặc định FT, URL khung + nhớ phiên', () => {
    const sp = doc('web/src/modules/students/StudentsPage.tsx');
    assert(/const khung = coHaiKhung \? khungMuon \?\? 'ft' : 'tat-ca';/.test(sp), 'mặc định Fast Track khi có cả hai loại lớp');
    assert(/aria-pressed=\{khung === k\} onClick=\{\(\) => \{ if \(khung !== k\)/.test(sp), 'bấm mục đang chọn không bỏ chọn (không còn "cả hai")');
    assert(/khungUrl === 'ft' \|\| khungUrl === 'thuong' \? khungUrl : docKhungDaNho\(\)/.test(sp) && sp.includes('sessionStorage.setItem(KHOA_KHUNG'), 'URL khung trước, rồi lần chọn trong phiên');
  });

  check('H1 · OMtGan: Overall ODiem', () => {
    assert(/<ODiem so=\{chuSo\(m\.ovr\)\}[^>]*nhan="Overall"/.test(ds), 'OMtGan Overall chưa ODiem');
  });
}
