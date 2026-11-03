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
  const goc = doc('web/src/modules/students/GocLichThi.tsx');
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

  check('U04 · OViec: một việc trong ô có khung + "+{n} việc" mở dải dưới hàng (không panel), không còn "Xem thêm"', () => {
    const o = than(ds, 'export function OViec');
    assert(o.length > 200, 'thiếu OViec');
    assert(!o.includes("'Xem thêm {n}'") && !o.includes("'Thu gọn'"), 'còn Xem thêm / Thu gọn');
    assert(o.includes('<OMotViec x={v[0]}') && o.includes("t('+{n} việc'") && /onClick=\{onMoDai\}/.test(o), '"+n việc" phải mở dải (onMoDai)');
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

  check('H1 · MiniKn: bỏ nền đỏ ô; ký hiệu qua chuMiniKn, màu đạt = Overall đạt (kq-bang), hụt kq-duoi 700', () => {
    const mk = than(goc, 'export function MiniKn');
    assert(mk.length > 100, 'thiếu MiniKn');
    assert(!mk.includes('bg-bad-bg'), 'còn nền đỏ ô');
    assert(mk.includes('chuMiniKn') && mk.includes("lopKq('duoi')") && mk.includes("lopKq('bang')"), 'màu / ký hiệu');
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

  check('H1 · MiniKn ở chi tiết dưới hàng Lịch thi truyền kck (em KCK không ✗)', () => {
    assert(/<MiniKn kn=\{c\.kn\} kv=\{st\?\.expectation \?\? null\} kck=\{r\.kck\} \/>/.test(goc), 'ChiTietDuoiHang thiếu kck');
  });

  check('H1 · OMtGan: Overall ODiem', () => {
    assert(/<ODiem so=\{chuSo\(m\.ovr\)\}[^>]*nhan="Overall"/.test(ds), 'OMtGan Overall chưa ODiem');
  });
}
