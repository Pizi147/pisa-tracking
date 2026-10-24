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
  const classes: any = await import('../classes/classes.ts');
  const dbMod: any = await import('../db.ts');
  const { P } = t;
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

  check('UIC-2b · hồ sơ lớp `coGopY` = lớp có góp ý cũ (⋯ › Lịch sử góp ý tuần chỉ hiện khi có)', () => {
    const { db } = dbMod;
    const lop = (db().prepare('SELECT id FROM classes WHERE id NOT IN (SELECT class_id FROM gop_y_tuan) ORDER BY id LIMIT 1').get() as { id: number }).id;
    assert(classes.classOverview(P.admin, lop).coGopY === false, 'lớp chưa có góp ý → false');
    const hv = db().prepare('SELECT student_id FROM enrollments WHERE class_id = ? LIMIT 1').get(lop) as { student_id: number } | undefined;
    const ky = db().prepare('SELECT id FROM report_periods ORDER BY id LIMIT 1').get() as { id: number };
    const sid = hv?.student_id ?? (db().prepare('SELECT id FROM students LIMIT 1').get() as { id: number }).id;
    const r = db().prepare(`INSERT INTO gop_y_tuan (student_id, class_id, period_id, skill, noi_dung, ghi_luc) VALUES (?, ?, ?, 'listening', 'UIC-2b', '2026-09-01T00:00:00Z')`).run(sid, lop, ky.id);
    try {
      assert(classes.classOverview(P.admin, lop).coGopY === true, 'có góp ý → true');
      assert(/data\.coGopY \?/.test(doc('web/src/modules/classes/DauTrangLop.tsx')), 'menu ⋯ dựa cờ coGopY');
    } finally { db().prepare('DELETE FROM gop_y_tuan WHERE id = ?').run(r.lastInsertRowid); }
  });

  check('UIC-3 · menu ⋯ (Menu, MenuDong): nhãn nhóm không bấm được + vạch; mục ≥ 44 px ở 375; mục nguy hiểm có vạch đỏ (không chỉ màu chữ)', () => {
    const css = doc('web/src/index.css');
    const luat = (ten: string) => css.match(new RegExp(`\\.${ten}\\s*\\{([^}]*)\\}`))?.[1] ?? '';
    assert(/font-weight:\s*600/.test(luat('menu-nhom')) && /var\(--text-dim\)/.test(luat('menu-nhom')), '.menu-nhom 12 / 600 text-dim');
    assert(/\.menu-nhom:not\(:first-child\)\s*\{[^}]*border-top:\s*1px solid var\(--line\)/.test(css), 'vạch trên mỗi nhóm trừ nhóm đầu');
    assert(/min-height:\s*36px/.test(luat('menu-muc')) && /@media \(max-width: 639px\)\s*\{\s*\.menu-muc\s*\{\s*min-height:\s*44px/.test(css), 'mục ≥ 36 px, ≥ 44 px ở 375');
    assert(/\.menu-muc-nguy\s*\{[^}]*border-top:\s*1px solid rgb\(var\(--bad-rgb\)\)/.test(css), 'mục nguy hiểm có vạch đỏ');
    for (const f of ['web/src/ui/Menu.tsx', 'web/src/ui/MenuDong.tsx']) {
      const s = doc(f);
      assert(/role="presentation" className="menu-nhom/.test(s), `${f}: nhãn nhóm role=presentation + .menu-nhom`);
      assert(s.includes('menu-muc ') && s.includes('menu-muc-nguy'), `${f}: mục dùng .menu-muc + .menu-muc-nguy`);
    }
  });

  check('UIC-4 · bảng dài có đầu cột dính; không bảng `bang-dinh` nào rộng hơn khung 1280 (1238 px)', () => {
    assert(/khung=\{false\} dinh /.test(doc('web/src/modules/classes/BangHoSoLop.tsx')), 'hồ sơ lớp FT: bảng học viên `dinh`');
    assert((doc('web/src/modules/phanTich/KetQuaThi.tsx').match(/table-scroll bang-dinh"/g) ?? []).length === 2, 'Kết quả Test: Mock + Thi thật');
    assert(doc('web/src/modules/phanTich/YThucPhoiHop.tsx').includes('table-scroll bang-dinh"'), 'Ý thức: danh sách HV');
    /* `.bang-dinh` bỏ khung cuộn từ 1280 — bảng rộng hơn khung thì làm <main> trượt ngang (luật index.css). */
    const quet = (thu: string): string[] => fs.readdirSync(path.join(REPO, thu), { withFileTypes: true })
      .flatMap((f) => (f.isDirectory() ? quet(`${thu}/${f.name}`) : f.name.endsWith('.tsx') ? [`${thu}/${f.name}`] : []));
    for (const f of quet('web/src')) {
      const s = doc(f);
      for (const m of s.matchAll(/bang-dinh(?!-1440)[^>]*>\s*(?:\{\/\*[^]*?\*\/\}\s*)?<table[^>]*minWidth: '?(\d+)/g)) {
        assert(Number(m[1]) <= 1238, `${f}: bảng bang-dinh minWidth ${m[1]} > 1238`);
      }
    }
  });
}
