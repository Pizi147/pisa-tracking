/**
 * PHÉP KIỂM PR-KHUNG — một thanh cuộn, chữ không cắt, nút không tràn (kế hoạch 2026-10-06-pr-khung-cuon-chu-cat, G1–G7).
 * Quét nguồn (bỏ chú thích): khoá lớp CSS đúng ở GỐC CHUNG. Đo trên trang thật: `scripts/do-khung.mjs` (chạy tay).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { YThucTestKit } from './yThuc.tests.ts';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '..');
const boChuThich = (src: string) => src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\{\/\*[\s\S]*?\*\/\}/g, '').replace(/(^|[^:\\])\/\/.*$/gm, '$1');
const doc = (rel: string) => boChuThich(fs.readFileSync(path.join(ROOT, rel), 'utf8'));
/** Thân một hàm `export function ten(` tới hàm export kế tiếp. */
const than = (src: string, ten: string) => {
  const i = src.indexOf(`export function ${ten}`);
  if (i < 0) throw new Error(`không thấy ${ten}`);
  const j = src.indexOf('\nexport ', i + 1);
  return src.slice(i, j < 0 ? undefined : j);
};
const tsx = (dir: string): string[] => fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true }).flatMap((e) =>
  e.isDirectory() ? tsx(`${dir}/${e.name}`) : e.name.endsWith('.tsx') ? [`${dir}/${e.name}`] : []);

export async function runPrKhungTests(t: Pick<YThucTestKit, 'check' | 'assert'>) {
  const { check, assert } = t;
  console.log('\nPR-KHUNG · cuộn lồng · chữ cắt · nút tràn');
  const ui = doc('web/src/ui/ui.tsx');

  check('K1 · <main id="noi-dung"> có `relative`: phần tử absolute (sr-only, popover) bị <main> chứa — html không bao giờ cuộn', () => {
    const m = /<main id="noi-dung"[^>]*className="([^"]*)"/.exec(doc('web/src/App.tsx'));
    assert(m && /(^|\s)relative(\s|$)/.test(m[1]), m?.[1] ?? 'không thấy <main id="noi-dung">');
  });

  check('K2 · NutChon: chữ xuống dòng (whitespace-normal, min-w-0), ✓ chỉ vẽ khi đang chọn; không chỗ gọi nào ép whitespace-nowrap', () => {
    const n = than(ui, 'NutChon');
    assert(/whitespace-normal/.test(n) && /min-w-0/.test(n), 'NutChon thiếu whitespace-normal / min-w-0');
    assert(!/invisible/.test(n), 'NutChon còn ô ✓ ẩn chiếm chỗ (invisible)');
    const sai = tsx('web/src').filter((f) => /<NutChon\b[^>]*className=[^>]*whitespace-nowrap/.test(doc(f)));
    assert(sai.length === 0, `chỗ gọi ép nowrap: ${sai.join(', ')}`);
  });

  check('K3 · ViecTiep: chữ việc chạy liền, không line-clamp-2 trần (chỉ sm:line-clamp-2 của HK2 C37), cụm hạn không shrink-0', () => {
    const v = than(doc('web/src/ui/ViecTiep.tsx'), 'ViecTiep');
    assert(!/(^|[\s"'`])line-clamp-2/.test(v), 'còn line-clamp-2 trần (< 640 px phải đủ chữ)');
    assert(!/shrink-0/.test(v), 'cụm hạn còn shrink-0');
  });

  check('K4 · WorkList (tên việc + dòng phụ) và TheKyNang (Case, PA): truncate có max-sm:whitespace-normal', () => {
    for (const [f, can] of [['web/src/modules/cases/TheKyNang.tsx', 2]] as const) {
      const lop = [...doc(f).matchAll(/className="([^"]*\btruncate\b[^"]*)"/g)].map((m) => m[1]);
      const du = lop.filter((l) => /max-sm:whitespace-normal/.test(l)).length;
      assert(du >= can, `${f}: ${du}/${can} chỗ truncate có max-sm:whitespace-normal`);
    }
  });

  check('K5 · không khối max-h-* + overflow-y-auto tự cuộn trong trang (trừ menu / gợi ý / popover / panel)', () => {
    const CHO_PHEP = ['Header.tsx', 'PeoplePicker.tsx', 'TimLop.tsx', 'TimKeHoach.tsx', 'HopKyNang.tsx', 'MeetingPage.tsx', 'Drawer.tsx', 'RecordViolationPanel.tsx'];
    assert(!/max-h-96/.test(doc('web/src/modules/platform/AdminPage.tsx')), 'AdminPage còn max-h-96');
    const sai = tsx('web/src/modules').filter((f) => !CHO_PHEP.some((c) => f.endsWith(c)))
      .filter((f) => /className="[^"]*\bmax-h-[^"]*\boverflow-y-auto|className="[^"]*\boverflow-y-auto[^"]*\bmax-h-/.test(doc(f)));
    assert(sai.length === 0, `cuộn lồng: ${sai.join(', ')}`);
  });

  /* OV-14b (rà UX 17/10, chủ SP chọn gói sửa nhỏ): BoLocDoan điện thoại xuống dòng — nút cuối không còn bị cắt; HangTab giữ vuốt ngang. */
  check('K6 · điện thoại: BoLocDoan xuống dòng (OV-14b), HangTab một hàng vuốt ngang có mép mờ (chủ sản phẩm 06/10, Q2 = B)', () => {
    assert(/max-sm:flex-wrap/.test(than(ui, 'BoLocDoan')) && !/max-sm:\[mask-image:/.test(than(ui, 'BoLocDoan')), 'BoLocDoan điện thoại phải xuống dòng (OV-14b)');
    assert(/max-sm:\[mask-image:/.test(doc('web/src/ui/HangTab.tsx')), 'HangTab thiếu mép mờ max-sm');
  });

  check('K7 · Học viên & Lớp: đầu cột dính sát mép <main> (md:-top-5), hàng lớp mở dính ngay dưới (top trừ đệm)', () => {
    assert(/md:sticky md:-top-5/.test(doc('web/src/modules/students/StudentsPage.tsx')), 'đầu cột chưa md:-top-5');
    const css = doc('web/src/index.css');
    assert(!/\.hang-lon-dinh > td\s*\{[^}]*top:\s*40px;/.test(css), '.hang-lon-dinh còn top: 40px');
  });

  check('K9 · KhungPanel: dòng ngữ cảnh (ví dụ "* = bắt buộc") có đệm dưới — ô cuộn lên không bị cắt sát chữ (rà LUI-a1)', () => {
    const m = /\{ngCanh && <div className="([^"]*)"/.exec(doc('web/src/ui/KhungPanel.tsx'));
    assert(m && /(^|\s)pb-2(\s|$)/.test(m[1]), m?.[1] ?? 'không thấy dòng ngCanh');
  });

  check('K8 · bảng Phân tích lớp / Bảng điểm lớp thường: cuộn ngang không sinh cuộn dọc lồng (.table-scroll overflow-y hidden)', () => {
    for (const f of ['web/src/modules/classes/PhanTichLopTab.tsx', 'web/src/modules/classes/BangDiemLopThuong.tsx']) {
      const s = doc(f);
      assert(!/card overflow-x-auto/.test(s), `${f}: thẻ cuộn ngang tự đặt overflow-x-auto — dùng .table-scroll (overflow-y hidden)`);
    }
    assert(/\.table-scroll\s*\{[^}]*overflow-y:\s*hidden/.test(doc('web/src/index.css')), '.table-scroll thiếu overflow-y: hidden');
  });
}
