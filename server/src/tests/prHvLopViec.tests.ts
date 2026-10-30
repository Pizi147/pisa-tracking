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

  check('H1 · COT_HV: viec là cột cuối, rong 300; nut đứng ngay trước; Học viên giãn (không rong)', () => {
    const m = /const COT_HV: CotBang\[\] = \[([\s\S]*?)\n\];/.exec(ds);
    assert(m, 'thiếu COT_HV');
    const keys = [...m![1].matchAll(/key: '(\w+)'/g)].map((x) => x[1]);
    assert(keys.at(-1) === 'viec' && keys.at(-2) === 'nut', `thứ tự cột ${keys.join(',')}`);
    assert(/key: 'viec'[^}]*rong: 300/.test(m![1]), 'Việc phải rong 300');
    assert(!/key: 'ten'[^}]*rong:/.test(m![1]), 'Học viên phải giãn (không rong)');
  });

  check('H1 · OViec: tối đa SO_DONG_VIEC_MAC_DINH nút, không còn "Xem thêm" / "Thu gọn"; có nút "+{n} việc" mở panel một em', () => {
    const o = than(ds, 'export function OViec');
    assert(o.length > 200, 'thiếu OViec');
    assert(!o.includes("'Xem thêm {n}'") && !o.includes("'Thu gọn'"), 'còn Xem thêm / Thu gọn');
    assert(o.includes('SO_DONG_VIEC_MAC_DINH') && o.includes("t('+{n} việc'"), 'thiếu "+{n} việc"');
    assert(/onClick=\{onMoEm\}/.test(o), '"+n việc" phải mở panel một em (onMoEm)');
    assert(o.includes('viec-n') && o.includes("t('quá {n} ngày'"), 'nút một dòng có "⚠ quá n ngày"');
    assert(!/function HanViec/.test(ds), 'chip hạn gộp vào nút — bỏ HanViec');
  });

  check('H1 · onMoEm cho mọi vai có Công việc (không chỉ TVV / CX)', () => {
    assert(/onMoEm=\{moEm\}/.test(trang) && (trang.match(/onMoEm=\{moEm\}/g) ?? []).length >= 2, 'StudentsPage phải truyền onMoEm cho cả bảng và thẻ 375');
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

  check('H1 · OMtGan: Overall ODiem chiToHut', () => {
    assert(/<ODiem so=\{chuSo\(m\.ovr\)\}[^>]*chiToHut/.test(ds), 'OMtGan Overall chưa chiToHut');
  });
}
