/**
 * PHÉP KIỂM TEN-CHI-SO (kế hoạch docs/superpowers/plans/2026-10-27-ten-chi-so.md; L3 + Đ5): một chỉ số một tên trên web.
 * Quét tĩnh `web/src` + `shared` (trừ `i18n/en`, `dev/` bảng mẫu, 4 tệp Lịch Test của session tiếng Anh): tên cũ không còn làm nhãn chỉ số.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..');
const BO_QUA = /(^shared\/i18n\/en|\/dev\/|LichTestTab|HangLop|NhomDau|LuoiNhung)/;

export async function runTenChiSoTests({ check, assert }: { check: (ten: string, fn: () => void) => void; assert: (c: unknown, m: string) => void }) {
  const quet = (thu: string): string[] => fs.readdirSync(path.join(REPO, thu), { withFileTypes: true })
    .flatMap((f) => (f.isDirectory() ? quet(`${thu}/${f.name}`) : /\.tsx?$/.test(f.name) ? [`${thu}/${f.name}`] : []));
  const tep = [...quet('web/src'), ...quet('shared')].filter((f) => !BO_QUA.test(f)).map((f) => ({ f, s: fs.readFileSync(path.join(REPO, f), 'utf8') }));
  const tim = (re: RegExp, tru: RegExp | null = null) => tep.filter((x) => re.test(x.s) && !(tru && tru.test(x.f))).map((x) => x.f);

  check('TEN-CHI-SO · mức GV "Đạt kỳ vọng Test", thi thật "Kết quả thi thật" (ô % Pass Target); "Thi trong kỳ"; không còn tên cũ làm nhãn', () => {
    const cu = [
      [/t\('Đạt MT · kỹ năng tôi dạy'\)/, 'Đạt MT · kỹ năng tôi dạy (mức GV → Đạt kỳ vọng Test)'],
      [/nhan: 'Pass Target'/, 'cột "Pass Target" (→ Kết quả thi thật)'],
      [/t\('Thi đợt này'\)/, 'Thi đợt này (→ Thi trong kỳ)'],
      [/t\('Lớp FT: Đạt kỳ vọng Test · lớp thường: Đạt Test'\)/, 'cột Tổng quan GV "Đạt Test" (→ Đạt kỳ vọng Test)'],
    ] as const;
    for (const [re, ten] of cu) { const o = tim(re); assert(!o.length, `${ten}: ${o.join(', ')}`); }
  });

  /* "Đạt kỳ vọng" đứng một mình chỉ còn là TRẠNG THÁI của một kết quả (nhãn lượt / em), không phải tên chỉ số mức HV. */
  check('TEN-CHI-SO · "Đạt kỳ vọng" một mình không làm tên chỉ số (chỉ nhãn trạng thái kết quả)', () => {
    const TRANG_THAI = /(cases\/SkillBoard|students\/ClassRoster|students\/BangHocVienLop|ui\/KetQuaDot|domain\/display|domain\/hanhTrinh|domain\/normal)\.tsx?$/;
    const o = tim(/t\('Đạt kỳ vọng'\)/, TRANG_THAI);
    assert(!o.length, `"Đạt kỳ vọng" làm tên chỉ số ở: ${o.join(', ')}`);
  });

  /* Đ5: đơn vị chấm = "bài" (không "ô điểm"); Chấm Test đếm "việc" như Công việc (cùng một tập). "Chú giải ô điểm" của lưới = ô trên lưới, giữ. */
  check('TEN-CHI-SO · đơn vị: "bài" thay "ô điểm" ở chữ hiển thị; Chấm Test đếm "việc" (không "nhóm")', () => {
    const o = tim(/(t\('[^']*ô điểm|aria-?[lL]abel="[^"]*ô điểm|ariaLabel="[^"]*ô điểm)(?!')/, /cham\/LuoiFT\.tsx$/);
    assert(!o.length, `"ô điểm" còn ở chữ hiển thị: ${o.join(', ')}`);
    const ct = fs.readFileSync(path.join(REPO, 'web/src/modules/test/ChamTestTab.tsx'), 'utf8');
    assert(!/t\('(nhóm|\{n\} nhóm[^']*|Chọn một nhóm[^']*)'\)/.test(ct), 'Chấm Test còn đếm "nhóm"');
  });
}
