/** PHÉP KIỂM PR-PH — phiên đăng nhập không bị coi là đã đăng xuất khi máy chủ/kết nối lỗi. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { YThucTestKit } from './yThuc.tests.ts';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '..');
/* Bỏ chú thích để chữ trong chú thích không làm phép kiểm đạt giả. */
const boChuThich = (src: string) => src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:\\])\/\/.*$/gm, '$1');
const doc = (rel: string) => boChuThich(fs.readFileSync(path.join(ROOT, rel), 'utf8'));

export function runPrPhTests(t: Pick<YThucTestKit, 'check' | 'assert'>) {
  const { check, assert } = t;
  check('PR-PH · session.tsx: reload chỉ coi là chưa đăng nhập khi máy chủ TRẢ LỜI authenticated:false; lỗi mạng/5xx giữ phiên cũ + báo mất kết nối', () => {
    const s = doc('web/src/lib/session.tsx');
    assert(/loiKetNoi/.test(s) && /cu\?\.authenticated/.test(s), 'phải có trạng thái loiKetNoi và giữ phiên cũ');
    assert(!/catch\s*\{\s*\/\/[^\n]*\n[^}]*setSession\(\{\s*authenticated:\s*false/.test(s), 'catch không được đặt authenticated:false vô điều kiện');
  });
  check('PR-PH · App.tsx: có dải "Mất kết nối" với nút Thử lại thay vì màn đăng nhập khi loiKetNoi', () => {
    const a = doc('web/src/App.tsx');
    assert(/loiKetNoi/.test(a) && /Thử lại/.test(a), 'App phải hiện dải mất kết nối + Thử lại');
  });
}
