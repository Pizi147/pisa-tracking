/** PHÉP KIỂM PR-UXD — điện thoại 375 px (kế hoạch 2026-10-01-pr-uxd-dien-thoai). Chỉ khẳng định CẤU TRÚC có thật trong nguồn, không khẳng định chữ. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { YThucTestKit } from './yThuc.tests.ts';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..');
const doc = (rel: string) => fs.readFileSync(path.join(REPO, rel), 'utf8');
/** Thân một hàm cấp trên cùng (`function ten` … `\n}`) — hàm viết đúng kiểu repo: đóng bằng `}` ở đầu dòng. */
const than = (src: string, ten: string) => src.match(new RegExp(`function ${ten}\\b[\\s\\S]*?\\n}\\n`))?.[0] ?? '';

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
    const bang = app.match(/const BIEU_TUONG[\s\S]*?\n};\n/)?.[0] ?? '';
    for (const k of ['tong-quan', 'hoc-vien', 'test', 'cong-viec']) assert(new RegExp(`['"]?${k}['"]?:\\s*<`).test(bang), `bảng BIEU_TUONG thiếu ${k}`);
    assert(nut.includes('min-h-[56px]'), 'NutDay chưa cao 56 px');
    assert(!nut.includes('text-[11px]'), 'NutDay còn text-[11px]');
    assert(/h-\[3px\]/.test(nut), 'thiếu vạch mục đang mở');
  });
}
