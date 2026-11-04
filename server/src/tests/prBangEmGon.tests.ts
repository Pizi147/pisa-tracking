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
  const dm: any = await import('../../../shared/domain/index.ts');

  check('B1 · ô điểm đạt ✓ màu Overall đạt · hụt ✗ (cỡ gọn 15 px; ba màu kết quả từ 04/11); OKetQua chip SOS (U03: có kỹ năng vì bỏ cột Case · PA); Đạt / Chưa đủ là chữ; OLichThi không còn NhanLich', () => {
    assert(/<ODiem kieu="gon" /.test(bang), 'ô điểm bảng em chưa gon');
    assert(!odiem.includes("'font-medium' : 'font-bold'"), 'ODiem gon: mọi số đậm 700 (U03 mockup)');
    const kq = than(bang, 'function OKetQua');
    assert(/<ChipSos /.test(kq) && !/hienKyNang=\{false\}/.test(kq), `OKetQua: ${kq}`);   // U03: chip 22 như mockup `.sos`
    assert(!kq.includes('<NhanKq'), 'OKetQua còn chip NhanKq (Đạt / Chưa đủ phải là chữ)');
    assert(kq.includes("'✓ '") && kq.includes("'– '"), 'OKetQua thiếu ký hiệu ✓ / – trước chữ');
    assert(!than(bang, 'function OLichThi').includes('NhanLich'), 'OLichThi còn chip NhanLich');
    assert(/nho \? `\$\{CHIP\} !h-5 !min-w-0 !px-1\.5`/.test(chip), 'ChipSos thiếu cỡ nhỏ (cao 20, đệm 6)');
  });

  /* HSL-GON (05/11, M3): TVV chính ghi một lần ở đầu hồ sơ lớp; dòng em chỉ ghi TVV KHÁC TVV chính (`tvvRieng`). */
  check('B1 · TVV dưới tên chỉ khi khác TVV chính của lớp (.tvv 11 px mờ); TVV chính = TVV giữ nhiều em nhất; mới vào là chữ (không chip MoiVao)', () => {
    assert(/tvvRieng\(r\) && <span className="tvv">TVV \{r\.tvv\}<\/span>/.test(bang) && /const tvvChinh = tvvChinhCuaLop\(tatCa\)/.test(bang), 'thiếu TVV ngoại lệ dưới tên');
    assert(dm.tvvChinhCuaLop([{ tvv: 'Lê Thu' }, { tvv: 'Phan Mai' }, { tvv: 'Phan Mai' }, { tvv: null }]) === 'Phan Mai', 'TVV chính = nhiều em nhất');
    assert(dm.tvvChinhCuaLop([]) === null && dm.tvvChinhCuaLop([{ tvv: 'B' }, { tvv: 'A' }]) === 'A', 'TVV chính: rỗng → null, hoà → theo chữ cái');
    assert(doc('web/src/modules/classes/DauTrangLop.tsx').includes("nhan: 'TVV'"), 'đầu hồ sơ lớp thiếu ô TVV chính');
    assert(/\.tvv \{[^}]*font-size: 11px[^}]*color: var\(--text-faint\)/.test(css), 'CSS .tvv 11 px text-faint');
    assert(!bang.includes('<MoiVao'), 'bảng em còn chip MoiVao');
    assert(doc('web/src/modules/students/ClassRoster.tsx').includes('tvv?: string | null'), 'RosterRow thiếu tvv');
  });
}
