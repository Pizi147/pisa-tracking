/**
 * PHÉP KIỂM P3 UI-CHUNG (chủ SP 24/10 — đặc tả `2026-10-24-cai-tien-da-chot-design.md` R6.2, R6.3a, R6.4a, R6.4b). Đọc nguồn khi không kiểm được hành vi.
 *   UIC-1  "Mới dùng PISA TRACKING?" (bỏ "Mới dùng PISA?") + khoá EN
 *   UIC-2  bỏ Góp ý hàng tuần khỏi giao diện; route, bảng `gop_y_tuan`, Lịch sử góp ý giữ
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..');
const doc = (p: string) => fs.readFileSync(path.join(REPO, p), 'utf8').replace(/\r\n/g, '\n');

export async function runPrUiChungTests(t: any) {
  const { check, assert } = t;
  const hd: any = await import('../../../shared/huongDan/index.ts');
  console.log('\nP3 UI-CHUNG');
  check('UIC-1 · dải Tổng quan ghi "Mới dùng PISA TRACKING?", khoá EN "New to PISA TRACKING?"', () => {
    const dai = doc('web/src/modules/huongDan/DaiMoiDung.tsx');
    assert(!dai.includes("'Mới dùng PISA?'"), 'còn chữ cũ');
    assert(dai.includes("t('Mới dùng PISA TRACKING?')"), 'thiếu chữ mới');
    const en = doc('shared/i18n/en/hd.ts');
    assert(en.includes("'Mới dùng PISA TRACKING?': 'New to PISA TRACKING?'"), 'thiếu khoá EN');
    assert(!en.includes("'Mới dùng PISA?'"), 'khoá EN cũ còn');
  });

  check('UIC-2 · Góp ý hàng tuần gỡ khỏi giao diện (link cũ ?che-do=gop-y → Tổng hợp), dữ liệu + Lịch sử góp ý giữ', () => {
    const tab = doc('web/src/modules/classes/TabHocVienLop.tsx');
    assert(!/'gop-y'/.test(tab) && !tab.includes('BangGopYTuan'), 'tab Học viên còn cách xem Góp ý');
    const trang = doc('web/src/modules/classes/ClassOverviewPage.tsx');
    assert(!trang.includes("cheDoUrl === 'gop-y'"), "?che-do=gop-y phải rơi về cách xem mặc định");
    assert(!fs.existsSync(path.join(REPO, 'web/src/modules/classes/BangGopYTuan.tsx')), 'BangGopYTuan.tsx còn');
    /* Dữ liệu cũ vẫn xem được: ⋯ hồ sơ lớp › Lịch sử góp ý tuần mở panel Lịch sử loai="gop-y". */
    assert(/loai="gop-y"/.test(trang), 'mất đường xem Lịch sử góp ý');
    const gv = hd.HUONG_DAN.gv;
    const ids = hd.moiMuc(gv).map((m: any) => m.id);
    assert(!ids.includes('lop-gop-y') && !ids.includes('gop-y') && !ids.includes('vi-pham-gop-y'), `Hướng dẫn GV còn mục Góp ý: ${ids.filter((x: string) => x.includes('gop'))}`);
    const chu = JSON.stringify([hd.HUONG_DAN.gv, hd.HUONG_DAN.ql]);
    assert(!chu.includes('Cách xem <b>Góp ý hàng tuần</b>'), 'Hướng dẫn còn chỉ tới cách xem Góp ý');
    const route = doc('server/src/routes/index.ts');
    assert(route.includes("api.get('/classes/:id/gop-y'") && route.includes("api.put('/classes/:id/gop-y'"), 'route Góp ý phải giữ (Lịch sử, dữ liệu)');
  });
}
