/**
 * PHÉP KIỂM P4 CHON-LOP (chủ SP 24/10 — đặc tả `2026-10-24-cai-tien-da-chot-design.md` mục 3.8, R6.3b). Đọc nguồn.
 *   CL-1  component `ChonLop` dùng `ChonNguoi ds` (gõ → tìm không dấu → chọn); ChuyenLopPanel dùng nó, gỡ `OLopDich`
 *   CL-2  9 ô chọn lớp không còn `<select>` có option lớp; dùng `ChonLop`
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..');
const doc = (p: string) => fs.readFileSync(path.join(REPO, p), 'utf8').replace(/\r\n/g, '\n');
/** Một khối `<select …>…</select>` có chữ `.code` (mã lớp) trong option. */
const SELECT_LOP = /<select(?:(?!<\/select>)[\s\S])*?\.code\b(?:(?!<\/select>)[\s\S])*?<\/select>/;

const CHO_CHON_LOP = [
  'students/StudentManagePanel.tsx', 'students/XemTruocHangLoatPanel.tsx', 'students/PanelBuocTiep.tsx', 'congViec/PanelSauThi.tsx',
  'students/IntakePanel.tsx', 'test/keHoach/NganXepHangLoat.tsx', 'test/keHoach/NganXepLichMt.tsx', 'test/keHoach/XepTheoHocVien.tsx',
  'test/keHoach/NganXuatDiem.tsx', 'students/ChuyenLopPanel.tsx',
];

export async function runPrChonLopTests(t: any) {
  const { check, assert } = t;
  const { locNguoiChon } = await import('../../../shared/domain/index.ts');
  console.log('\nP4 CHON-LOP');
  check('CL-1 · ChonLop bọc ChonNguoi ds, tìm không dấu ("ft101" ra "MB FT 101"); ChuyenLopPanel dùng ChonLop, không còn OLopDich', () => {
    const c = doc('web/src/ui/ChonLop.tsx');
    assert(/export function ChonLop/.test(c) && /export type LopChon/.test(c) && /<ChonNguoi[\s\S]{0,200}ds=\{/.test(c), 'ChonLop chưa bọc ChonNguoi ds');
    assert(/ChonLop\.tuNhan = true/.test(c), 'thiếu tuNhan (nhãn Truong không bọc ô)');
    assert(/maCu/.test(c) && /khongKhop/.test(c), 'thiếu mã lớp cũ / câu danh sách rỗng');
    const ds = [{ id: 1, ten: 'MB FT 101' }, { id: 2, ten: 'MB IE 202' }, { id: 3, ten: 'ĐN FT 101' }];
    const ra = locNguoiChon(ds, 'ft101').map((x: any) => x.id);
    assert(ra.includes(1) && !ra.includes(2), `ft101 → ${ra}`);
    assert(locNguoiChon(ds, 'dn').map((x: any) => x.id).includes(3), 'đ = d');
    const s = doc('web/src/modules/students/ChuyenLopPanel.tsx');
    assert(!/OLopDich/.test(s) && /<ChonLop/.test(s) && !/<select/.test(s), 'ChuyenLopPanel còn OLopDich / select');
  });
  check('CL-2 · 9 ô chọn lớp (Sửa HV, Xem trước hàng loạt, Bước tiếp, Sau thi, Thêm HV, 4 ngăn Kế hoạch Test) dùng ChonLop, không <select> lớp', () => {
    for (const f of CHO_CHON_LOP) {
      const s = doc(`web/src/modules/${f}`);
      assert(!SELECT_LOP.test(s), `${f}: còn <select> lớp`);
      assert(/<ChonLop\b/.test(s), `${f}: chưa dùng ChonLop`);
    }
    /* P9 làm phần cuối khoá — P4 không chạm. */
    assert(SELECT_LOP.test(doc('web/src/modules/classes/BangLoTrinhTiep.tsx')), 'BangLoTrinhTiep thuộc P9');
  });
}
