/**
 * PHÉP KIỂM BANG-EM-GON (PANEL-V10 `#be`, chủ SP 30/10): bảng em hồ sơ lớp gọn — đạt ✓ màu Overall đạt · hụt ✗, chip SOS nhỏ không kỹ năng,
 * Đạt / ngày thi / mới vào là chữ, TVV 11 px dưới tên. Thành phần web không chạy được ở đây → quét nguồn (như prPanelChung).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { YThucTestKit } from './yThuc.tests.ts';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..');
const doc = (f: string) => fs.readFileSync(path.join(REPO, f), 'utf8').replace(/\r\n/g, '\n');   // Windows checkout CRLF
const than = (src: string, mo: string) => {
  const i = src.indexOf(mo);
  if (i < 0) return '';
  const het = src.indexOf('\n}\n', i);
  return src.slice(i, het < 0 ? undefined : het);
};

export async function runPrBangEmGonTests(t: YThucTestKit) {
  const { check, assert } = t;
  console.log('\nBANG-EM-GON · bảng em hồ sơ lớp gọn + TVV');
  const bang = doc('web/src/modules/classes/BangHoSoLop.tsx');
  const odiem = doc('web/src/ui/ODiem.tsx');
  const chip = doc('web/src/ui/ChipSos.tsx');
  const css = doc('web/src/index.css');

  check('B1 · ô điểm đạt ✓ màu Overall đạt · hụt ✗ (chiToHut, cỡ gọn 15 px); OKetQua chip SOS nhỏ (U03: có kỹ năng vì bỏ cột Case · PA); Đạt / Chưa đủ là chữ; OLichThi không còn NhanLich', () => {
    assert(/<ODiem kieu="gon"[^>]*chiToHut/.test(bang), 'ô điểm bảng em chưa chiToHut + gon');
    assert(odiem.includes("kieu === 'gon' && kqHien !== 'duoi' ? 'font-medium' : 'font-bold'"), 'ODiem thiếu kieu gon 15 px / 500 (hụt 700)');
    const kq = than(bang, 'function OKetQua');
    assert(/<ChipSos /.test(kq) && !/hienKyNang=\{false\}/.test(kq), `OKetQua: ${kq}`);   // U03: chip 22 như mockup `.sos`
    assert(!kq.includes('<NhanKq'), 'OKetQua còn chip NhanKq (Đạt / Chưa đủ phải là chữ)');
    assert(kq.includes("'✓ '") && kq.includes("'– '"), 'OKetQua thiếu ký hiệu ✓ / – trước chữ');
    assert(!than(bang, 'function OLichThi').includes('NhanLich'), 'OLichThi còn chip NhanLich');
    assert(/nho \? `\$\{CHIP\} !h-5 !min-w-0 !px-1\.5`/.test(chip), 'ChipSos thiếu cỡ nhỏ (cao 20, đệm 6)');
  });

  check('B1 · TVV dưới tên (r.tvv, lớp .tvv 11 px mờ); mới vào là chữ (không chip MoiVao)', () => {
    assert(/r\.tvv && <span className="tvv">TVV \{r\.tvv\}<\/span>/.test(bang), 'thiếu TVV dưới tên');
    assert(/\.tvv \{[^}]*font-size: 11px[^}]*color: var\(--text-faint\)/.test(css), 'CSS .tvv 11 px text-faint');
    assert(!bang.includes('<MoiVao'), 'bảng em còn chip MoiVao');
    assert(doc('web/src/modules/students/ClassRoster.tsx').includes('tvv?: string | null'), 'RosterRow thiếu tvv');
  });
}
