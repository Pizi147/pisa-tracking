/**
 * PHÉP KIỂM PANEL-CHUNG (PANEL-V10, luật N30): MỘT mẫu dòng điểm (`DongDiem`) + dòng panel có lý do (`NganDanhSach.veDong`).
 * Thành phần web không chạy được ở đây → quét nguồn (như prNenTypoMau) + dựng lại hàm thuần nhỏ để so.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { YThucTestKit } from './yThuc.tests.ts';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..');
const doc = (f: string) => fs.readFileSync(path.join(REPO, f), 'utf8').replace(/\r\n/g, '\n');   // Windows checkout CRLF
/** Thân một hàm (`export function …` tới `}` đầu dòng) hoặc hằng trong component (`  const …` tới `  };`). */
const than = (src: string, mo: string) => {
  const i = src.indexOf(mo);
  if (i < 0) return '';
  const het = src.indexOf(mo.startsWith('  ') ? '\n  };\n' : '\n}\n', i);
  return src.slice(i, het < 0 ? undefined : het);
};

export async function runPrPanelChungTests(t: YThucTestKit) {
  const { check, assert } = t;
  console.log('\nPANEL-CHUNG · mẫu dòng điểm + dòng panel có lý do');
  const solieu = doc('web/src/ui/SoLieu.tsx');
  const odiem = doc('web/src/ui/ODiem.tsx');
  const css = doc('web/src/index.css');

  check('C1 · DongDiem thay DiemDong: không ▲ / ▼ ở điểm, ✓ / ✗ qua dauDiem, đọc màn hình qua nhanDocDiem', () => {
    const dd = than(solieu, 'export function DongDiem');
    assert(dd.length > 200, 'thiếu DongDiem');
    assert(!/function DiemDong\b/.test(solieu) && !/<DiemDong\b/.test(solieu), 'còn DiemDong cũ');
    assert(!/[▲▼]/.test(dd), 'DongDiem còn ▲ / ▼');
    assert(dd.includes('dauDiem(') && dd.includes('nhanDocDiem(') && dd.includes('text-kq-bang') && dd.includes('text-kq-duoi'), 'DongDiem thiếu ký hiệu / màu đạt / hụt như Overall');
  });

  check('C1 · ODiem chiToHut: vượt = bằng (✓ màu Overall đạt); không chiToHut giữ ba mức', () => {
    const f = than(odiem, 'export function lopODiem');
    assert(/chiToHut && kq === 'vuot' \? lopKq\('bang'\) : lopKq\(kq\)/.test(f), `lopODiem: ${f}`);
    assert(odiem.includes('lopODiem(kqHien, chiToHut)'), 'ODiem chưa dùng lopODiem');
  });

  check('C1 · index.css có khối PANEL-V10: lưới 132px repeat(4, 64px), 375 hai hàng, chip .xh', () => {
    assert(/\.dd \{[^}]*grid-template-columns: 132px repeat\(4, 64px\) minmax\(0, 1fr\)/.test(css), 'thiếu lưới .dd');
    assert(/@media \(max-width: 639px\) \{\s*\.dd \{ grid-template-columns: repeat\(4, minmax\(0, 1fr\)\)/.test(css), 'thiếu .dd 375');
    assert(/\.xh \{/.test(css) && /\.xh\.tang/.test(css) && /\.xh\.giam/.test(css), 'thiếu .xh');
  });

  check('C2 · dòng HV: tên là Link, giữ r.sub, ẩn lớp trùng tiêu đề, việc là nút riêng, không link "Hồ sơ" riêng', () => {
    const hv = than(solieu, '  const veDongHv');
    assert(hv.length > 500, 'thiếu veDongHv');
    assert(/<Link to=\{r\.em \? duongHoSoHocVien\(r\.em\.id\) : r\.href\}/.test(hv), 'tên chưa là link hồ sơ');
    assert(hv.includes("r.sub.split(' · ')"), 'dòng HV bỏ r.sub (lỗi mất "Tăng / Giảm")');
    assert(hv.includes('hienLop(tieuDe, lop)'), 'chưa ẩn lớp trùng tiêu đề');
    assert(!hv.includes('nutHoSo('), 'dòng HV còn link "Hồ sơ" riêng');
    assert(/className="btn btn-sm[^"]*"[\s\S]{0,200}moViec\(r\)/.test(hv), 'việc chưa là nút riêng');
    assert(/if \(r\.em \|\| r\.diemHv !== undefined\) return veDongHv\(r\);/.test(solieu), 'veDong chưa chuyển dòng HV sang mẫu mới');
  });

  check('C2 · RF5: dòng vừa làm giữ chỗ (setGiu trước reload)', () => {
    const f = than(solieu, '  const daLam');
    assert(/setGiu\([\s\S]*reload\(\)/.test(f), `daLam: ${f.slice(0, 200)}`);
  });

  check('C2 · hienLop: "SOS 2 · MB FT 101" không lặp lớp; "Dưới kỳ vọng · R" có lớp', () => {
    assert(/export const hienLop = \(tieuDe: string, lop: string \| null \| undefined\): boolean => !!lop && !tieuDe\.includes\(lop\);/.test(solieu), 'hienLop đổi dạng');
    const hienLop = (tieuDe: string, lop: string | null | undefined) => !!lop && !tieuDe.includes(lop);
    assert(hienLop('SOS 2 · MB FT 101', 'MB FT 101') === false && hienLop('Dưới kỳ vọng · R', 'MB FT 103') === true && hienLop('x', null) === false, 'luật hienLop');
  });

  check('C3 · chip xu hướng: ký hiệu trước chữ (▲ Tăng / ▼ Giảm / = Không đổi), Cải thiện không mũi tên', () => {
    const f = than(solieu, 'export function chuXuHuong');
    assert(f.includes("`▲ ${t('Tăng')}`") && f.includes("`▼ ${t('Giảm')}`") && f.includes("`= ${t('Không đổi')}`") && f.includes("t('Cải thiện')"), f);
    assert(solieu.includes('{xh && <span className={`xh ${xh.lop}`}>{xh.chu}</span>}'), 'dòng chưa vẽ chip .xh');
  });
}
