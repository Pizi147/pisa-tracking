/** PHÉP KIỂM PR-UXD — điện thoại 375 px (kế hoạch 2026-10-01-pr-uxd-dien-thoai). Chỉ khẳng định CẤU TRÚC có thật trong nguồn, không khẳng định chữ. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { YThucTestKit } from './yThuc.tests.ts';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..');
const doc = (rel: string) => fs.readFileSync(path.join(REPO, rel), 'utf8');
/** Thân một hàm cấp trên cùng (`function ten` … `\n}`) — hàm viết đúng kiểu repo: đóng bằng `}` ở đầu dòng. */
const than = (src: string, ten: string) => src.match(new RegExp(`function ${ten}\\b[\\s\\S]*?\\r?\\n}\\r?\\n`))?.[0] ?? '';

export async function runPrUxdTests(t: YThucTestKit) {
  const { check, assert } = t;
  const d: any = await import('../../../shared/domain/index.ts');
  console.log('\nPR-UXD · Điện thoại 375 px');

  // ------------------------------------------------------------------ Task 1 · Thanh dưới có biểu tượng (UX-D9)
  check('UXD (1) · thanh dưới: bốn biểu tượng SVG 20 px, cao 56 px, vạch 3 px ở mục đang mở, không còn chữ 11 px', () => {
    const app = doc('web/src/App.tsx');
    const nut = than(app, 'NutDay');
    assert(nut.length > 0, 'không thấy NutDay');
    assert(/<svg/.test(nut), 'NutDay không vẽ SVG');
    const bang = app.match(/const BIEU_TUONG[\s\S]*?\r?\n};\r?\n/)?.[0] ?? '';
    for (const k of ['tong-quan', 'hoc-vien', 'test', 'cong-viec']) assert(new RegExp(`['"]?${k}['"]?:\\s*<`).test(bang), `bảng BIEU_TUONG thiếu ${k}`);
    assert(nut.includes('min-h-[56px]'), 'NutDay chưa cao 56 px');
    assert(!nut.includes('text-[11px]'), 'NutDay còn text-[11px]');
    assert(/h-\[3px\]/.test(nut), 'thiếu vạch mục đang mở');
  });

  // ------------------------------------------------------------------ Task 2 · Thanh trên điện thoại (VN33)
  check('UXD (2) · thanh trên: nút tìm 44 px + chữ cái tài khoản trên điện thoại; bảng thông báo neo đáy header (không top-14); header relative', () => {
    const hd = doc('web/src/modules/platform/Header.tsx');
    assert(/useDienThoai/.test(hd), 'Header chưa dùng useDienThoai');
    assert(/aria-label="Tìm học viên, lớp"/.test(hd), 'thiếu nút tìm điện thoại');
    assert(!/\bw-28\b/.test(hd) && !hd.includes('max-w-[4.5rem]'), 'còn w-28 / max-w-[4.5rem]');
    assert(!/\btop-14\b/.test(hd) && /absolute inset-x-2 top-full/.test(hd), 'bảng thông báo chưa neo đáy header');
    assert(/aria-label=\{`Tài khoản \$\{/.test(hd), 'nút tài khoản thiếu aria-label');
    assert(/<header className="relative /.test(doc('web/src/App.tsx')), '<header> thiếu relative');
  });
}
