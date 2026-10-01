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
  const hvl: any = await import('../classes/hocVienLop.ts');
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

  // ------------------------------------------------------------------ Task 3 · Toast không che chân panel (VN17) + viền ô nhập tối (U13)
  check('UXD (3) · toast: một quy tắc body:has([aria-modal="true"]) .vung-toast; Toast dùng vung-toast + IconDat, không còn ký tự ✓', () => {
    const css = doc('web/src/index.css');
    const toast = doc('web/src/ui/Toast.tsx');
    assert(/body:has\(\[aria-modal="true"\]\)\s*\.vung-toast/.test(css), 'index.css thiếu quy tắc :has([aria-modal]) .vung-toast');
    assert(/vung-toast/.test(toast) && /IconDat/.test(toast), 'Toast chưa dùng vung-toast / IconDat');
    assert(!toast.includes('✓'), 'Toast còn ký tự ✓');
  });

  check('UXD (3) · U13: viền ô nhập / ô sửa ở chế độ TỐI ≥ 3:1 (WCAG 1.4.11) trên surface và surface-2', () => {
    const { toi } = d.docMauHaiCheDo(doc('web/src/index.css'));
    const hong: string[] = [];
    for (const v of ['o-nhap-vien', 'o-sua-vien']) for (const n of ['surface', 'surface-2']) {
      if (!toi[v] || !toi[n]) { hong.push(`thiếu token ${!toi[v] ? v : n}`); continue; }
      const r = d.tuongPhan(toi[v], toi[n]);
      if (r < 3) hong.push(`${v} trên ${n} = ${r}`);
    }
    assert(hong.length === 0, hong.join(' · '));
  });

  // ------------------------------------------------------------------ Task 4 · Hồ sơ HV điện thoại: thẻ Mock Test / Kết quả kiểm tra, hàng tab vừa màn
  check('UXD (4) · hồ sơ HV: IeltsAttempts và RatioAttempts có nhánh điện thoại vẽ TheDong; HangTab px-2.5 sm:px-3 + scrollIntoView', () => {
    const sdp = doc('web/src/modules/students/StudentDetailPage.tsx');
    for (const ten of ['IeltsAttempts', 'RatioAttempts']) {
      const f = than(sdp, ten);
      assert(f.length > 0, `không thấy ${ten}`);
      assert(/useDienThoai\(\)/.test(f) && /<TheDong\b/.test(f), `${ten} thiếu nhánh điện thoại (useDienThoai + TheDong)`);
    }
    const ht = doc('web/src/ui/HangTab.tsx');
    assert(/px-2\.5 sm:px-3/.test(ht), 'HangTab chưa px-2.5 sm:px-3');
    assert(/scrollIntoView/.test(ht), 'HangTab chưa cuộn tab đang chọn vào tầm nhìn');
  });

  // ------------------------------------------------------------------ Task 5 · Lịch Test điện thoại: bộ lọc gọn "Lọc", dải số một hàng
  check('UXD (5) · Lịch Test: nhánh điện thoại (useDienThoai) với nút Lọc + IconGap, không ký tự ▾; Esc đóng khối Lọc', () => {
    const lt = doc('web/src/modules/test/LichTestTab.tsx');
    assert(/useDienThoai/.test(lt), 'LichTestTab chưa dùng useDienThoai');
    assert(/Lọc\{/.test(lt) && /<IconGap\b/.test(lt), 'thiếu nút Lọc + IconGap');
    assert(!lt.includes('▾'), 'LichTestTab còn ký tự ▾');
    /* Dải số giữ 2×2 trên điện thoại (Câu 2 = A: ô "Nợ tuần trước · n lớp" xuống dòng ở 375 nên về 2×2). */
    assert(/useEffect/.test(lt) && /Escape/.test(lt), 'khối Lọc chưa đóng bằng Esc');
  });

  // ------------------------------------------------------------------ Task 6 · Hàng lớp ghi lộ trình (U14)
  check('UXD (6) · /hoc-vien-lop: mỗi lớp Fast Track mang route ∈ LT1 / LT2 / RF (máy chủ đã có sẵn)', () => {
    const { P } = t;
    const r = hvl.danhSachHocVienLop(P.mbManager, {});
    /* Chỉ lớp FT của bộ demo — các phép kiểm chạy trước có thể tạo thêm lớp FT thử chưa có lộ trình. */
    const DEMO_FT = ['MB FT 101', 'MB FT 102', 'MB FT 103', 'MB FT 104', 'MB FT 105', 'MB FT RF 12'];
    const ft = r.rows.filter((x: any) => DEMO_FT.includes(x.code));
    assert(ft.length === DEMO_FT.length, `thiếu lớp FT demo: ${ft.map((x: any) => x.code).join(', ')}`);
    const hong = ft.filter((x: any) => !['LT1', 'LT2', 'RF'].includes(x.route)).map((x: any) => `${x.code}:${x.route}`);
    assert(hong.length === 0, `lớp FT thiếu route: ${hong.join(', ')}`);
  });

  check('UXD (6) · StudentsPage: kiểu LopTrenTrang có route; dòng phụ (thẻ điện thoại + bảng) đọc lop.route qua cùng một chuỗi', () => {
    const sp = doc('web/src/modules/students/StudentsPage.tsx');
    assert(/route: string \| null/.test(sp), 'LopTrenTrang chưa có route');
    assert((sp.match(/lop\.route/g) ?? []).length >= 1 && (sp.match(/\bchuLop\b/g) ?? []).length >= 3, 'dòng phụ chưa dùng chuLop (thẻ + bảng)');
  });

  // ------------------------------------------------------------------ Task 7 · Sót 375 ở màn GV hằng ngày
  check('UXD (7) · KetLuanKhoa: chip hướng gợi ý xuống dòng được (whitespace-normal), không đẩy hồ sơ HV tràn ngang ở 375 px', () => {
    const kl = doc('web/src/modules/students/KetLuanKhoa.tsx');
    assert(/\[&>span\]:max-w-full \[&>span\]:whitespace-normal/.test(kl), 'chip hướng gợi ý của KetLuanKhoa chưa cho xuống dòng');
  });
}
