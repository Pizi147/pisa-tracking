// PR-KHUNG — đo khung trên trang thật (chạy tay, không vào `npm run check`): 1440/375 × tối/sáng.
// Lỗi: (a) html cuộn (chỉ <main> được cuộn) hoặc trang trượt ngang; (b) cuộn lồng trong trang (ngoài panel);
// (c) chữ truncate / line-clamp bị cắt; (d) chữ nút chọn / nút lọc / tab tràn khỏi viền; (e) <main id="noi-dung"> trượt ngang
// (bảng / chữ ẩn tràn khỏi khối cuộn — PR-HK2 I1, I2); (f) chữ bị cha overflow-hidden/clip che (ghim "Progress" cắt thành "rogres" — I3).
// Kịch bản không mở được cũng là lỗi. Phần tử thứ 5 của kịch bản = mảng chiều rộng chạy (mặc định 1440 và 375);
// KHUNG_RONG=1280,1366 thêm các chiều rộng đó cho MỌI kịch bản (dò trang nào tràn).
// Chạy: npm run dev (PORT/WEB_PORT riêng) rồi `KHUNG_BASE=http://localhost:5530 node scripts/do-khung.mjs [lọc]`.
// Playwright không nằm trong package.json: `npm i --no-save playwright` hoặc trỏ PW=<đường tới playwright>.
// PR-EN: KHUNG_NGON_NGU=en — chạy cả bộ ở tiếng Anh (tài khoản + máy) và thêm lỗi (v) CHỮ VIỆT CÒN SÓT trên màn có trong `GOC_V` (mọi vai — EN-e): bỏ khối [lang=vi] và chữ dữ liệu (mọi giá trị chữ có dấu trong DB demo — tên, mã, ghi chú, thông báo cũ). DB đọc từ
// PISA_DB (mặc định data/pisa-demo.sqlite). Kịch bản `ngon-ngu` bấm bốn bước nhớ ngôn ngữ (E-NHO).
// HD-a / HD-b: kịch bản `hd-chi` bấm mọi "Chỉ cho tôi" của 6 vai (khoanh hiện, phần tử bấm được, Esc tắt). HD_VAI=ql,tvv chỉ chạy các vai đó.
// CONG-CU: (g) đo bảng `do-bang.mjs` ở mọi kịch bản — 1440 tối, 1280 tối, 375 sáng; KHUNG_CHI=bang chỉ đo bảng. Kịch bản `lich`: mọi hộp có ô ngày —
// bấm ‹ và một ngày trong lịch (vẽ qua portal) không được đóng hộp cha. Lỗi đã biết: `scripts/mien-do.json` (MIEN=0 tắt miễn).
// KHUNG-LOI: (k) thanh trên cắt mục · (l) thanh dưới > 5 nút · (m) vùng bấm số < 24 px (< 44 px ở điện thoại) · (n) "—" / "/" tương phản < 4,5:1.
// Kịch bản `thanh`: thanh trên ở 1 100 / 1 280 / 1 366 / 1 440 (QL, QT, GV) + thanh dưới 375. `focus`: Tab ở 375 không bị thanh dưới che.
// `menu-phim`: ⋯ hồ sơ HV bằng phím (Enter → mục đầu, ↓, Esc → về nút).
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { doBang, mien, mienThua } from './do-bang.mjs';

const { chromium } = await import(process.env.PW ? pathToFileURL(process.env.PW).href : 'playwright');
const BASE = process.env.KHUNG_BASE ?? `http://localhost:${process.env.WEB_PORT ?? 5173}`;
const ANH = process.env.KHUNG_ANH ?? 'thiet-ke/anh/khung';
const LOC = process.argv[2] ?? '';
const NN = process.env.KHUNG_NGON_NGU === 'en' ? 'en' : 'vi';
/** (v) chỉ đo màn đã dịch: kịch bản → vùng đo. Mỗi đợt PR-EN thêm màn của mình (EN-a: đăng nhập, Hồ sơ cá nhân, thanh trên + menu Tài khoản;
 *  EN-b: màn GV Việc + Test; EN-c: Học viên & Lớp, hồ sơ lớp, hồ sơ HV; EN-d: Case – PA, Ghi vi phạm, Ý thức). */
const GOC_V = {
  'dang-nhap': 'body', 'ho-so-ca-nhan': 'body', 'menu-tk': 'header',
  /* EN-b: Tổng quan GV, Công việc, Yêu cầu của tôi, chuông, Lịch Test, Điểm theo lớp, nhập điểm, hộp chấm, hồ sơ Mock, Ghi kết quả PA. */
  'tong-quan-gv': '#noi-dung', 'cv-gv': '#noi-dung', 'gvbm': '#noi-dung', 'gvbm-test': '#noi-dung', 'gv-diem-lop': '#noi-dung', 'gv-nhap-diem': '#noi-dung',
  'gv-bang-diem-thuong': '#noi-dung', 'gv-mock': '#noi-dung', 'gv-yeu-cau': '#noi-dung', 'gv-hop-diem': '[role=dialog]', 'gv-ket-qua-pa': '[role=dialog]', 'gv-chuong': 'header',
  /* EN-c: Học viên & Lớp, hồ sơ lớp FT, hồ sơ HV (vai 7). */
  'hvl-gvcn': '#noi-dung', 'lop-ft': '#noi-dung', 'lop-ft-phan-tich': '#noi-dung', 'hv-hoc-thuat': '#noi-dung', 'hv-hanh-trinh': '#noi-dung', 'hvl-gvbm': '#noi-dung', 'hv-gvbm': '#noi-dung',
  /* EN-d: ngăn Case › Ghi kết quả PA, Tạo Case, Ghi vi phạm; tab Ý thức & Phối hợp của HV / lớp (chỉ khối Ý thức). */
  'panel-pa': '[role=dialog]', 'panel-tao-case': '[role=dialog]', 'panel-vi-pham': '[role=dialog]',
  'hv-y-thuc': 'div:has(> [role=tablist][aria-label="Student conduct & SOS"])',
  'lop-ft-y-thuc': '*:has(> * > [role=tablist][aria-label="Class conduct & SOS"])',
  /* OV-13o: Hồ sơ giáo viên (vai 7 xem chính mình) + menu ⋯ hồ sơ HV. */
  'gv-ho-so': '#noi-dung', 'hv-menu': '[role=menu]',
  /* EN-e: Đang SOS (QL · GV · TVV · CX), panel một em (QL · GV), Công việc của QL (chip hạn). */
  'sos-ql': '#noi-dung', 'sos-gv': '#noi-dung', 'sos-tvv': '#noi-dung', 'sos-cx': '#noi-dung', 'panel-mot-em-ql': '[role=dialog]', 'panel-mot-em-gv': '[role=dialog]',
  'cv-ho-tro': '#noi-dung',
};
/** (v) bỏ qua vùng của đợt khác: lưới Điểm theo lớp cuối hồ sơ lớp — đo ở kịch bản gv-diem-lop (EN-b). */
const BO_V = { 'lop-ft': '#khoi-diem-lop-bang', 'lop-ft-phan-tich': '#khoi-diem-lop-bang' };
/** Chữ dữ liệu (không phải chữ giao diện): mọi giá trị chữ có dấu tiếng Việt trong DB demo. Chỉ nạp khi chạy tiếng Anh. */
const DU_LIEU = NN === 'en' ? await (async () => {
  const RE = /[àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]/i;
  const { default: Database } = await import('libsql');
  const db = new Database(process.env.PISA_DB ?? 'data/pisa-demo.sqlite', { readonly: true });
  const ra = new Set();
  for (const { name } of db.prepare("SELECT name FROM sqlite_master WHERE type = 'table'").all()) {
    for (const r of db.prepare(`SELECT * FROM "${name}"`).raw().all()) for (const v of r) if (typeof v === 'string' && v.length < 400 && RE.test(v)) ra.add(v.trim().replace(/\s+/g, ' '));
  }
  db.close();
  return [...ra];
})() : [];
fs.mkdirSync(ANH, { recursive: true });

/** Chỗ cắt chữ của PR khác: hồ sơ Mock (#13), nội dung panel Ghi kết quả PA (`CapNhatTuan.tsx` — PR-LUI-a2; nút chọn trong panel vẫn đo ở (d)).
 *  CONG-CU: lưới chấm (Lịch Test, Điểm theo lớp, nhập điểm, lớp thường) đo lại — lỗi đã biết ghi ở `mien-do.json`. */
const BO_QUA_CAT = ['mock', 'panel-pa'];
const CHI_BANG = process.env.KHUNG_CHI === 'bang';
/** Bảng đo ở 1440 tối, 1280 tối, 375 sáng (một lần mỗi bề rộng). */
const doBangO = (w, sang) => (w === 375 ? sang : !sang && (w === 1440 || w === 1280));

const RONG_MAY = [1440, 375, 1366, 1280];   // kịch bản có bảng dính đầu (bang-dinh): đo thêm ở 1366 và 1280, nơi bảng có thể rộng hơn khung
const RONG_THEM = (process.env.KHUNG_RONG ?? '').split(',').filter(Boolean).map(Number);
const nut = (ten) => async (p) => { await p.getByRole('button', { name: ten }).first().click(); await p.waitForTimeout(500); };
const KICH_BAN = [
  // [tên, vai, đường, thao tác thêm]
  ['hvl', 2, '/hoc-vien'], ['hvl-gvcn', 7, '/hoc-vien'],
  ['hvl-cuoi', 2, '/hoc-vien', async (p) => { await p.evaluate(() => { const m = document.getElementById('noi-dung'); m.scrollTop = m.scrollHeight; window.scrollTo(0, 1e6); }); await p.waitForTimeout(300); }],
  ['tong-quan', 2, '/'], ['tong-quan-gv', 7, '/'], ['phan-tich', 2, '/phan-tich', null, RONG_MAY], ['phan-tich-thuong', 2, '/phan-tich?ct=thuong', null, RONG_MAY],
  ['cv-ho-tro', 2, '/cong-viec'], ['cv-cho-duyet', 2, '/cong-viec/cho-duyet'], ['cv-van-hanh', 2, '/cong-viec/van-hanh'],
  ['cv-bao-cao', 2, '/cong-viec/bao-cao'], ['cv-gv', 7, '/cong-viec'],
  /* UI-CV-TVV: Công việc của TVV (23) — danh sách + panel Báo PH, panel Sau thi. */
  ['cv-tvv', 23, '/cong-viec'], ['cv-tvv-bao-ph', 23, '/cong-viec?viec=bao-ph%3A10'], ['cv-tvv-sau-thi', 23, '/cong-viec?viec=buoc_tiep%3A23'],
  ['lop-ft', 7, '/hoc-vien/lop/3?tab=hoc-vien'], ['lop-ft-phan-tich', 7, '/hoc-vien/lop/3?tab=phan-tich'],
  ['lop-ft-y-thuc', 7, '/hoc-vien/lop/3?tab=y-thuc'], ['lop-thuong', 2, '/hoc-vien/lop/6?tab=hoc-vien'],
  ['lop-thuong-phan-tich', 2, '/hoc-vien/lop/6?tab=phan-tich'],
  /* P9b: trang Cuối khoá lớp thường — QL (chọn nhóm + thanh Áp), GVCN (Nhận xét). */
  ['cuoi-khoa', 2, '/hoc-vien/lop/6?xem=cuoi-khoa', null, [1440, 1280, 375]],
  ['cuoi-khoa-ap', 2, '/hoc-vien/lop/6?xem=cuoi-khoa', async (p) => { await p.getByRole('button', { name: /^Chọn tất cả/ }).click(); await p.waitForTimeout(300); }, [1440, 1280, 375]],
  ['cuoi-khoa-gvcn', 7, '/hoc-vien/lop/6?xem=cuoi-khoa', null, [1440, 1280, 375]],
  ['hv-hoc-thuat', 7, '/hoc-vien/3'], ['hv-y-thuc', 7, '/hoc-vien/3?tab=y-thuc'], ['hv-hanh-trinh', 7, '/hoc-vien/3?tab=hanh-trinh'],
  ['hv-thuong', 2, '/hoc-vien/8'], ['hv-thuong-hanh-trinh', 2, '/hoc-vien/8?tab=hanh-trinh'], ['luu-tru', 2, '/hoc-vien/luu-tru'],
  ['test-lichTest', 2, '/test/lich'], ['test-diem-lop', 2, '/test/diem-lop'], ['test-ke-hoach', 2, '/test/ke-hoach'],
  /* UI-CHAM-TEST: Chấm Test (GV L R · GV S chấm chéo) + Kế hoạch Test mở một lớp FT (cột S Ex, Overall). */
  ['cham-test-gv', 7, '/test/cham'], ['cham-test-s', 9, '/test/cham'], ['cham-test-kh-lop', 2, '/test/ke-hoach?classId=3'],
  ['nhap-diem', 2, '/nhap-diem/3'], ['bang-diem-thuong', 2, '/bang-diem-thuong/6'], ['mock', 2, '/mock-test/5'],
  ['quan-tri', 1, '/quan-tri'], ['quan-tri-quyen', 1, '/quan-tri', async (p) => { await p.getByRole('tab', { name: /Quyền/ }).click(); await p.waitForTimeout(800); }], ['ho-so-ca-nhan', 7, '/ho-so-ca-nhan'],
  ['gvbm', 9, '/'], ['gvbm-test', 9, '/test/lich'], ['hvl-gvbm', 9, '/hoc-vien'], ['hv-gvbm', 9, '/hoc-vien/3'],
  // PR-EN đợt b: màn GV của Test (vai 7) — Điểm theo lớp, nhập điểm FT / lớp thường, hồ sơ Mock, Yêu cầu của tôi, hộp chấm MT, Ghi kết quả PA, chuông.
  ['gv-diem-lop', 7, '/test/diem-lop'], ['gv-nhap-diem', 7, '/nhap-diem/3'], ['gv-bang-diem-thuong', 7, '/bang-diem-thuong/6'], ['gv-mock', 7, '/mock-test/5'],
  ['gv-yeu-cau', 7, '/cong-viec/yeu-cau'],
  /* KHUNG-LOI: tab Điểm theo lớp đã bỏ (OV-15b) — hộp nhập điểm MT mở từ lưới lớp FT trên Lịch Test. */
  ['gv-hop-diem', 7, '/test/lich', async (p) => {
    const mo = p.getByRole('button', { name: /^(Mở lớp|Open class) MB FT 101$/ });
    if (await mo.count()) { await mo.click(); await p.waitForTimeout(600); }
    /* 375: lưới một môn (L) đã đủ điểm — mở ô đã có điểm (cùng hộp). */
    await p.locator('#noi-dung button[aria-label$=": Nhập"], #noi-dung button[aria-label$=": Enter"], #noi-dung button[aria-label*=" câu, band "]').first().click(); await p.waitForTimeout(500);
  }],
  ['gv-ket-qua-pa', 7, '/cong-viec', async (p) => { await p.getByRole('button', { name: /^(Kết quả PA|PA result)/ }).first().click(); await p.waitForTimeout(800); }],
  ['gv-ho-so', 7, '/giao-vien/7'],
  // UI-HO-SO-GV: QL xem GV nhiều lớp + GVCN; Quản trị xem GV có thi thật trong kỳ (bảng Theo kỹ năng, cột Thi thật).
  ['gv-ho-so-ql', 2, '/giao-vien/8'], ['gv-ho-so-thi', 1, '/giao-vien/16?tu=2026-08-10'],
  ['hv-menu', 7, '/hoc-vien/3', async (p) => { await p.locator('#noi-dung button[aria-haspopup]').first().click(); await p.waitForTimeout(400); }],
  // EN-e: Đang SOS bốn vai + panel một em (bấm Mở dòng đầu).
  ['sos-ql', 2, '/hoc-vien?view=sos'], ['sos-gv', 7, '/hoc-vien?view=sos'], ['sos-tvv', 23, '/hoc-vien?view=sos'], ['sos-cx', 24, '/hoc-vien?view=sos'],
  ['panel-mot-em-ql', 2, '/hoc-vien?view=sos', nut(/^(Mở|Open) /)], ['panel-mot-em-gv', 7, '/hoc-vien?view=sos', nut(/^(Mở|Open) /)],
  ['gv-chuong', 7, '/', async (p) => { await p.getByRole('button', { name: /^(Thông báo|Notifications)/ }).first().click(); await p.waitForTimeout(500); }],
  // PR-EN: màn chưa đăng nhập (vai 0) và menu Tài khoản mở (điện thoại: hàng Ngôn ngữ ngay trên Giao diện).
  ['dang-nhap', 0, '/'],
  ['menu-tk', 7, '/', async (p) => { await p.getByRole('button', { name: /^(Tài khoản|Account) / }).click(); await p.waitForTimeout(300); }],
  // Panel: chỉ đo nút tràn / chữ cắt — panel tự cuộn trong thân là đúng thiết kế.
  ['panel-pa', 7, '/hoc-thuat/case/5', async (p) => {
    // 375: Ngăn Case tự mở đè trang — bấm "Ghi kết quả" trong ngăn.
    const ngan = p.locator('[role=dialog]');
    await ((await ngan.count()) ? ngan : p).getByRole('button', { name: /^(Cập nhật trước hạn|Ghi kết quả|Update early|Log result)/ }).first().click(); await p.waitForTimeout(500); await p.getByRole('button', { name: /Tiến bộ một phần|Some progress/ }).first().click().catch(() => {}); }],
  ['panel-tao-case', 7, '/hoc-vien/3', nut(/^\+ Case$/)],
  ['panel-vi-pham', 7, '/hoc-vien/3?tab=y-thuc', async (p) => { await nut(/Ghi vi phạm|Log incident/)(p); await p.evaluate(() => { const t = document.querySelector('[role=dialog] .overflow-y-auto'); if (t) t.scrollTop = 120; }); await p.waitForTimeout(200); }],
  ['panel-sua-tt', 2, '/hoc-vien/lop/3?tab=hoc-vien', nut(/^Sửa thông tin$/)],
  /* KHUNG-LOI: "+ Học viên" nay trong ⋯ đầu hồ sơ lớp. */
  ['panel-them-hv', 2, '/hoc-vien/lop/3?tab=hoc-vien', async (p) => {
    await nut(/^Thao tác khác$/)(p);
    await p.getByRole('menuitem', { name: /^\+ Học viên$/ }).click(); await p.waitForTimeout(500);
  }],
  // Hộp kỹ năng MT (popover neo cạnh ô, Kế hoạch Test) và thanh dính đáy "Chọn nhiều học viên" (hồ sơ lớp).
  ['hop-ky-nang-mt', 2, '/test/ke-hoach', async (p) => {
    await p.locator('#noi-dung button[aria-label^="Mở lớp"]').first().click(); await p.waitForTimeout(600);
    await p.locator('#noi-dung td button[aria-label^="MT"]').first().click(); await p.waitForTimeout(500);
    if (!(await p.locator('[role=dialog][aria-label^="Lịch "]').count())) throw new Error('không thấy hộp kỹ năng');
  }],
  ['panel-xep-lich-mt', 2, '/test/ke-hoach', async (p) => {   // PR-OMT: panel toàn màn, bảng không cuộn ngang ở 1440
    await p.getByRole('button', { name: /Xếp nhiều MT/ }).first().click(); await p.waitForTimeout(1500);   // KHUNG-LOI: nút đổi tên
    if (!(await p.locator('[role=dialog]').count())) throw new Error('không thấy panel');
  }],
  ['chon-nhieu-hv', 2, '/hoc-vien/lop/3?tab=hoc-vien', async (p) => {
    await nut(/^Chọn nhiều học viên$/)(p);
    await p.locator('#noi-dung input[type=checkbox]').first().check();
    await p.getByRole('toolbar', { name: 'Việc cho học viên đã chọn' }).waitFor({ timeout: 3000 }).catch(() => {});   // KHUNG-LOI: chờ thanh, không đoán 300 ms
    if (!(await p.getByRole('toolbar', { name: 'Việc cho học viên đã chọn' }).count())) throw new Error('không thấy thanh chọn nhiều');
  }],
];

function doTrang() {
  const loi = [];
  let dau = null;
  const ghi = (el, l) => { loi.push(l); dau ??= el; };
  const ten = (el) => (el.innerText || el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 60);
  const an = (el) => el.closest('.sr-only') || getComputedStyle(el).position === 'absolute' && el.clientWidth <= 1;
  const thay = (el) => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== 'hidden'; };
  const se = document.scrollingElement;
  if (se.scrollHeight > se.clientHeight + 1) loi.push(`a html cuộn ${se.scrollHeight}/${se.clientHeight}`);
  if (se.scrollWidth > se.clientWidth + 1) loi.push(`a trang trượt ngang ${se.scrollWidth}/${se.clientWidth}`);
  // (e) vùng nội dung trượt ngang: bảng cuộn / chữ ẩn thoát khỏi khối cuộn của nó (không có trong khung cuộn ngang riêng).
  const nd = document.getElementById('noi-dung');
  if (nd && nd.scrollWidth > nd.clientWidth + 1) loi.push(`e vùng nội dung trượt ngang ${nd.scrollWidth}/${nd.clientWidth}`);
  // (f) chữ bị khối cha overflow-hidden/clip che. Bỏ: chữ sr-only, chữ truncate / line-clamp (đo ở (c)), khối cha cuộn được (auto/scroll).
  const tw0 = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let n = tw0.nextNode(); n; n = tw0.nextNode()) {
    if (!n.textContent.trim()) continue;
    const el = n.parentElement;
    if (!el || ['SCRIPT', 'STYLE'].includes(el.tagName) || !thay(el) || an(el)) continue;
    const rg = document.createRange(); rg.selectNodeContents(n);
    let tl = Infinity, tp = -Infinity;
    for (const q of rg.getClientRects()) if (q.width) { tl = Math.min(tl, q.left); tp = Math.max(tp, q.right); }
    if (tp < tl) continue;
    for (let a = el; a && a !== document.body; a = a.parentElement) {
      const ac = getComputedStyle(a);
      if (ac.textOverflow === 'ellipsis' || ac.webkitLineClamp !== 'none' && ac.webkitLineClamp !== '') break;
      if (ac.position === 'fixed' || /auto|scroll/.test(ac.overflowX)) break;
      if (ac.maskImage && ac.maskImage !== 'none' || ac.webkitMaskImage && ac.webkitMaskImage !== 'none') break;   // mép mờ báo "còn nữa" (hàng bước Ý thức…)
      if (a !== el && /hidden|clip/.test(ac.overflowX)) {
        const r = a.getBoundingClientRect();
        if (r.width > 0 && (tl < r.left - 1 || tp > r.right + 1)) { ghi(el, `f chữ bị cắt bởi khối overflow-hidden ${Math.round(r.width)}<${Math.round(tp - tl)} «${ten(el)}»`); break; }
      }
    }
  }
  const panel = document.querySelector('[role=dialog]');
  for (const el of document.querySelectorAll('body *')) {
    if (!thay(el) || an(el)) continue;
    const cs = getComputedStyle(el);
    const trongPanel = !!el.closest('[role=dialog]');
    // (b) cuộn lồng: khối tự cuộn dọc nằm trong trang (không phải <main>, không trong panel / menu nổi).
    if (!panel && el.id !== 'noi-dung' && /auto|scroll/.test(cs.overflowY) && el.scrollHeight > el.clientHeight + 1
      && !el.closest('[role=menu],[role=listbox],[role=dialog]') && cs.position !== 'fixed')
      ghi(el, `b cuộn lồng ${el.clientHeight}/${el.scrollHeight} «${ten(el).slice(0, 40)}»`);
    // (c) chữ bị cắt. Máy tính: truncate + `title` là mẫu đã duyệt (kế hoạch G4) — không tính.
    const cat = cs.textOverflow === 'ellipsis' || cs.webkitLineClamp !== 'none' && cs.webkitLineClamp !== '';
    if (cat && (el.scrollWidth > el.clientWidth + 1 || el.scrollHeight > el.clientHeight + 1) && ten(el)
      && !(trongPanel && el.closest('header')) && !(innerWidth >= 640 && el.closest('[title]'))
      && !el.parentElement.querySelector(':scope > button[aria-expanded]')) // cắt có nút "Xem thêm"
      ghi(el, `c chữ cắt ${el.clientWidth}x${el.clientHeight}<${el.scrollWidth}x${el.scrollHeight} «${ten(el)}»`);
    // (d) chữ tràn khỏi viền nút chọn / nút lọc / tab.
    if (el.matches('button, [role=tab], [role=radio], a.btn') && ten(el)) {
      const r = el.getBoundingClientRect();
      // Chữ THẤY được: bỏ chữ sr-only và chữ nằm trong khối con tự cắt (khối đó đã đo ở (c)) và dấu ✓ đè góc của NutChon (absolute, aria-hidden — cố ý nhô ra viền, PR-HK2 C36).
      let trai = Infinity, phai = -Infinity;
      const tw = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
      for (let n = tw.nextNode(); n; n = tw.nextNode()) {
        if (!n.textContent.trim()) continue;
        let a = n.parentElement, boQua = false;
        for (; a && a !== el.parentElement; a = a.parentElement) {
          const ac = getComputedStyle(a);
          if (an(a) || a !== el && (ac.overflowX !== 'visible' || ac.position === 'absolute' && a.hasAttribute('aria-hidden'))) { boQua = true; break; }
        }
        if (boQua) continue;
        const rg = document.createRange(); rg.selectNodeContents(n);
        for (const q of rg.getClientRects()) if (q.width) { trai = Math.min(trai, q.left); phai = Math.max(phai, q.right); }
      }
      if (phai > trai && (trai < r.left - 0.5 || phai > r.right + 0.5)) ghi(el, `d nút tràn ${Math.round(phai - trai)}>${Math.round(r.width)} «${ten(el)}»`);
      // Nút bị khung cha cắt (hàng tab / hàng lọc trượt ngang không mép mờ).
      let p = el.parentElement;
      while (p && p !== document.body) {
        const pc = getComputedStyle(p);
        if (pc.overflowX !== 'visible') {
          if (p.querySelector('table')) break; // bảng cuộn ngang trong khung riêng: cố ý (K2 / HK2).
          const pr = p.getBoundingClientRect();
          const mo = pc.maskImage && pc.maskImage !== 'none' || pc.webkitMaskImage && pc.webkitMaskImage !== 'none';
          if (!mo && r.left < pr.right - 1 && r.right > pr.right + 1) ghi(el, `d nút bị cắt ở mép (không mép mờ) «${ten(el)}»`);
          break;
        }
        p = p.parentElement;
      }
    }
  }
  // KHUNG-LOI (k) thanh trên: mục nào ra ngoài khung menu / khung cuộn ngang (A1-05).
  const navTren = [...document.querySelectorAll('header nav')].find(thay);
  if (navTren) {
    const nr = navTren.getBoundingClientRect();
    if (navTren.scrollWidth > navTren.clientWidth + 1) loi.push(`k thanh trên cuộn ngang ${navTren.scrollWidth}/${navTren.clientWidth}`);
    for (const m of navTren.querySelectorAll(':scope > a, :scope > button')) {
      const r = m.getBoundingClientRect();
      if (r.right > nr.right + 1 || r.left < nr.left - 1) ghi(m, `k thanh trên cắt mục «${ten(m)}»`);
    }
  }
  // (l) thanh dưới điện thoại ≤ 5 nút.
  const navDuoi = [...document.querySelectorAll('body > div nav, #root nav')].find((n) => thay(n) && getComputedStyle(n).position === 'fixed');
  if (navDuoi && navDuoi.querySelectorAll(':scope > a, :scope > button').length > 5) loi.push(`l thanh dưới ${navDuoi.querySelectorAll(':scope > a, :scope > button').length} nút`);
  // (m) số bấm được (B-02): hộp nút hoặc ::after ≥ 24 (máy tính) / 44 (< 640).
  const can = innerWidth < 640 ? 44 : 24;
  let nho = 0, vd = '';
  for (const b of document.querySelectorAll('button[aria-label*="Bấm để xem danh sách"]')) {
    if (!thay(b)) continue;
    const r = b.getBoundingClientRect(), af = getComputedStyle(b, '::after');
    const w = Math.max(r.width, parseFloat(af.width) || 0), h = Math.max(r.height, parseFloat(af.height) || 0);
    if (w < can - 0.5 || h < can - 0.5) { nho++; vd ||= `${Math.round(w)}×${Math.round(h)} «${ten(b)}»`; }
  }
  if (nho) loi.push(`m ${nho} số bấm được nhỏ hơn ${can}×${can} (vd ${vd})`);
  // (n) "—" / "/" mang nghĩa (B-08): tương phản với nền ≥ 4,5:1.
  const rgb = (s) => (s.match(/[\d.]+/g) ?? []).map(Number);
  const lum = ([r, g, b]) => { const f = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
  const nen = (el) => { for (let a = el; a; a = a.parentElement) { const c = rgb(getComputedStyle(a).backgroundColor); if (c.length >= 3 && (c[3] ?? 1) > 0.5) return c; } return rgb(getComputedStyle(document.body).backgroundColor); };
  let mo = 0, vdMo = '';
  const tw1 = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let n = tw1.nextNode(); n; n = tw1.nextNode()) {
    const s = n.textContent.trim();
    if (s !== '—' && s !== '/') continue;
    const el = n.parentElement;
    if (!el || !thay(el) || an(el) || el.closest('[aria-hidden=true]')) continue;
    const [l1, l2] = [lum(rgb(getComputedStyle(el).color)), lum(nen(el))];
    const tl = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
    if (tl < 4.5) { mo++; vdMo ||= `${tl.toFixed(1)}:1 «${s}» trong «${ten(el.parentElement).slice(0, 30)}»`; }
  }
  if (mo) loi.push(`n ${mo} dấu "—" / "/" mờ (vd ${vdMo})`);
  if (dau) { dau.scrollIntoView({ block: 'center', inline: 'nearest' }); dau.style.outline = '2px solid #f43f5e'; }
  return [...new Set(loi)];
}

/** (v) PR-EN: chữ Việt còn sót trên màn tiếng Anh — bỏ [lang=vi], sr-only vẫn tính (đọc màn hình), chữ dữ liệu (`duLieu`) bỏ. */
function chuVietSot([duLieu, goc, bo]) {
  const RE = /[àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]/i;
  const data = new Set(duLieu);
  /* EN-c: tên Case SOS "[MT1] … [SOS 1]" bỏ hai thẻ mã; mảnh nằm TRONG một giá trị dữ liệu (tên Case có ":") cũng là dữ liệu.
     EN-b: đoạn ≥ 5 ký tự nằm trong một giá trị DB (chữ người gõ bị dấu phẩy cắt ra); tên gọi ("Hi Hà") — mọi chữ có dấu là chữ cuối của một giá trị DB. */
  const cuoi = new Set(duLieu.map((d) => d.split(' ').pop()));
  const boDuLieu = (s) => duLieu.reduce((x, d) => (d.length > 3 && x.includes(d) ? x.split(d).join(' · ') : x), s);   // chữ giao diện EN quanh tên PA / Case
  const laDuLieu = (s) => data.has(s) || boDuLieu(s).replace(/\[(MT\d+|SOS \d)\]/g, '').split(/\s*[·,—:|()«»“”"]\s*|\s+-\s+/).every((x) => !x.trim() || !RE.test(x) || data.has(x.trim())
    || duLieu.some((d) => (d.length > 3 && x.includes(d)) || (x.trim().length >= 5 && d.includes(x.trim())))
    || x.trim().split(/\s+/).every((w) => !RE.test(w) || cuoi.has(w)));
  const loi = [];
  const xem = (chu, el) => {
    const s = (chu ?? '').trim().replace(/\s+/g, ' ');
    if (!s || !RE.test(s) || el.closest('[lang=vi]') || (bo && el.closest(bo)) || laDuLieu(s)) return;
    loi.push(`v chữ Việt «${s.slice(0, 70)}»`);
  };
  const vung = document.querySelector(goc) ?? document.body;
  const tw = document.createTreeWalker(vung, NodeFilter.SHOW_TEXT);
  for (let n = tw.nextNode(); n; n = tw.nextNode()) {
    const el = n.parentElement;
    if (!el || ['SCRIPT', 'STYLE', 'TEXTAREA'].includes(el.tagName) || el.closest('[hidden]')) continue;
    xem(n.textContent, el);
  }
  for (const el of vung.querySelectorAll('[aria-label],[title],[placeholder]')) for (const a of ['aria-label', 'title', 'placeholder']) if (el.hasAttribute(a)) xem(el.getAttribute(a), el);
  return [...new Set(loi)];
}

const trinh = await chromium.launch({ channel: 'msedge' }).catch(() => chromium.launch({ channel: 'chrome' })).catch(() => chromium.launch());
let tongLoi = 0, tongMien = 0;
/** Bỏ lỗi đã biết (mien-do.json); in số đã miễn theo PR. */
const locMien = (congCu, nhan, ds) => {
  const pr = {};
  const con = ds.filter((l) => { const m = mien(congCu, `${nhan} ${l}`); if (m) pr[m.pr] = (pr[m.pr] ?? 0) + 1; return !m; });
  const n = ds.length - con.length;
  tongMien += n;
  return [con, n ? ` (miễn ${Object.entries(pr).map(([k, v]) => `${k} ×${v}`).join(', ')})` : ''];
};
for (const [w, h] of [[1440, 900], [375, 812], [1366, 768], [1280, 800]]) for (const sang of [false, true]) {
  if (CHI_BANG && !doBangO(w, sang)) continue;
  const ctx = await trinh.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
  await ctx.addInitScript(([s, nn]) => { try { localStorage.setItem('pisa-giao-dien', s ? 'light' : 'dark'); localStorage.setItem('pisa-ngon-ngu', nn); } catch {} }, [sang, NN]);
  const p = await ctx.newPage();
  p.setDefaultTimeout(8000);
  let vai = 0;
  for (const [tenKb, v, duong, them, rong = [1440, 375]] of KICH_BAN) {
    if (LOC && !tenKb.includes(LOC)) continue;
    const doKhung = !CHI_BANG && (rong.includes(w) || RONG_THEM.includes(w));
    if (!doKhung && !doBangO(w, sang)) continue;
    if (v !== vai) {
      if (v === 0) await p.request.delete(`${BASE}/api/demo/session`);
      else {
        const r = await p.request.post(`${BASE}/api/demo/session`, { data: { userId: v } });
        if (!r.ok()) throw new Error(`đăng nhập vai ${v}: ${r.status()}`);
        // Ngôn ngữ nhớ theo tài khoản: đặt đúng tiếng của lần chạy — chạy VI sau EN không bị kẹt EN.
        await p.request.patch(`${BASE}/api/me/profile`, { data: { ngonNgu: NN } });
      }
      vai = v;
    }
    const nhan = `${tenKb}-${w}-${sang ? 'sang' : 'toi'}`;
    try {
      await p.goto(BASE + duong, { waitUntil: 'networkidle' });
      await p.waitForTimeout(400);
      if (them) await them(p);
    } catch (e) { tongLoi++; console.log(`✗ ${nhan}: kịch bản không mở được (${e.message.split('\n')[0]})`); continue; }
    let loi = [], chuMien = '';
    if (doKhung) {
      loi = await p.evaluate(doTrang);
      if (BO_QUA_CAT.some((k) => tenKb.includes(k))) loi = loi.filter((l) => !l.startsWith('c '));
      // Panel tại chỗ của Công việc (máy tính) tự cuộn thân — thiết kế OV-5a, bản Việt cũng vậy; không phải cuộn lồng của trang.
      if (tenKb === 'gv-ket-qua-pa') loi = loi.filter((l) => !l.startsWith('b '));
      if (NN === 'en' && GOC_V[tenKb]) loi = [...loi, ...await p.evaluate(chuVietSot, [DU_LIEU, GOC_V[tenKb], BO_V[tenKb] ?? null])];
      [loi, chuMien] = locMien('do-khung', nhan, loi);
    }
    if (doBangO(w, sang)) {
      const [bang, m] = locMien('do-bang', nhan, await p.evaluate(doBang));
      loi = [...loi, ...bang.map((l) => `g ${l}`)];
      chuMien += m;
    }
    console.log(`${loi.length ? '✗' : '✓'} ${nhan}${chuMien}${loi.map((l) => `\n    ${l}`).join('')}`);
    tongLoi += loi.length;
    // Ảnh lỗi; KHUNG_CHUP=1 chụp mọi lần đo (ảnh nghiệm thu).
    if (loi.length || process.env.KHUNG_CHUP) await p.screenshot({ path: path.join(ANH, `${nhan}.png`) });
  }
  await ctx.close();
}
/*
 * KHUNG-LOI — `thanh` (A1-05): thanh trên không cắt mục ở 1 100 / 1 280 / 1 366 / 1 440 (QL 2, QT 1, GV 7, Head tutor 21 nếu có); mục bị gom vào
 * "Thêm" vẫn tới được (mở menu, mục có trong menu). Thanh dưới 375: ≤ 5 nút. `focus` (B-05): 375, Tab 40 lần trên Học viên & Lớp (vai 10) + Tổng
 * quan (vai 2) — phần tử đang focus không nằm dưới thanh dưới. `menu-phim` (V4C-03): ⋯ hồ sơ HV — Enter → focus mục đầu, ↓ → mục 2, Esc → về nút.
 */
const chayKhoi = async (ten, fn) => {
  if (CHI_BANG || (LOC && !ten.includes(LOC))) return;
  const loi = [];
  try { await fn(loi); } catch (e) { loi.push(`kịch bản dừng: ${e.message.split('\n')[0]}`); }
  console.log(`${loi.length ? '✗' : '✓'} ${ten}${loi.map((l) => `\n    ${l}`).join('')}`);
  tongLoi += loi.length;
};
const trangMoi = async (w, h, vai, sang = false) => {
  const ctx = await trinh.newContext({ viewport: { width: w, height: h } });
  await ctx.addInitScript((s) => { try { localStorage.setItem('pisa-giao-dien', s ? 'light' : 'dark'); localStorage.setItem('pisa-ngon-ngu', 'vi'); } catch {} }, sang);
  const p = await ctx.newPage();
  p.setDefaultTimeout(8000);
  await p.request.post(`${BASE}/api/demo/session`, { data: { userId: vai } });
  return [ctx, p];
};
await chayKhoi('thanh', async (loi) => {
  for (const [w, h] of [[1100, 800], [1280, 800], [1366, 768], [1440, 900]]) for (const vai of [2, 1, 7]) {
    const [ctx, p] = await trangMoi(w, h, vai);
    await p.goto(`${BASE}/`, { waitUntil: 'networkidle' }); await p.waitForTimeout(500);
    const kq = await p.evaluate(() => {
      const nav = document.querySelector('header nav');
      const nr = nav.getBoundingClientRect();
      const muc = [...nav.querySelectorAll(':scope > a, :scope > button')];
      return { cat: muc.filter((m) => { const r = m.getBoundingClientRect(); return r.right > nr.right + 1; }).map((m) => m.textContent.trim()),
        cuon: nav.scrollWidth > nav.clientWidth + 1, them: muc.some((m) => m.tagName === 'BUTTON'), chu: muc.map((m) => m.textContent.trim()).join(' · ') };
    });
    if (kq.cat.length || kq.cuon) loi.push(`${w}/v${vai}: thanh trên cắt «${kq.cat.join(', ')}»${kq.cuon ? ' (cuộn ngang)' : ''}`);
    if (kq.them) {
      await p.locator('header nav > button').click();
      if (!(await p.locator('[role=menu] [role=menuitem]').count())) loi.push(`${w}/v${vai}: "Thêm" không mở menu`);
    }
    console.log(`    ${w}/v${vai}: ${kq.chu}`);
    await ctx.close();
  }
  for (const vai of [2, 7]) {
    const [ctx, p] = await trangMoi(375, 812, vai, true);
    await p.goto(`${BASE}/`, { waitUntil: 'networkidle' }); await p.waitForTimeout(400);
    const n = await p.locator('nav.fixed > a, nav.fixed > button').count();
    if (n > 5) loi.push(`375/v${vai}: thanh dưới ${n} nút`);
    const nutThem = p.locator('nav.fixed > button');
    if (await nutThem.count()) {
      await nutThem.click();
      await p.locator('[role=menu] [role=menuitem]').first().click();
      await p.waitForLoadState('networkidle');
      if (!/\/(phan-tich|tutor)/.test(p.url())) loi.push(`375/v${vai}: mục trong "Thêm" không mở trang (${p.url()})`);
    }
    await ctx.close();
  }
});
await chayKhoi('focus', async (loi) => {
  for (const [vai, duong] of [[10, '/hoc-vien'], [2, '/']]) {
    const [ctx, p] = await trangMoi(375, 812, vai, true);
    await p.goto(BASE + duong, { waitUntil: 'networkidle' }); await p.waitForTimeout(400);
    for (let i = 0; i < 40; i++) {
      await p.keyboard.press('Tab');
      const che = await p.evaluate(() => {
        const el = document.activeElement;
        const nav = document.querySelector('nav.fixed');
        if (!el || el === document.body || !nav || nav.contains(el)) return null;
        const r = el.getBoundingClientRect(), nt = nav.getBoundingClientRect().top;
        return r.height && r.bottom > nt + 1 && r.top < innerHeight ? `${(el.getAttribute('aria-label') || el.textContent || '').trim().slice(0, 30)} (${Math.round(r.bottom)} > ${Math.round(nt)})` : null;
      });
      if (che) { loi.push(`375/v${vai} ${duong} Tab ${i + 1}: focus bị thanh dưới che «${che}»`); break; }
    }
    await ctx.close();
  }
});
await chayKhoi('menu-phim', async (loi) => {
  const [ctx, p] = await trangMoi(1440, 900, 2);
  await p.goto(`${BASE}/hoc-vien/3`, { waitUntil: 'networkidle' }); await p.waitForTimeout(400);
  const nut = p.locator('#noi-dung button.btn[aria-haspopup=menu]').first();
  await nut.focus(); await p.keyboard.press('Enter'); await p.waitForTimeout(150);
  const vai = () => p.evaluate(() => [document.activeElement?.getAttribute('role'), document.activeElement?.textContent?.trim().slice(0, 30)]);
  const [r1, c1] = await vai();
  if (r1 !== 'menuitem') loi.push(`Enter: focus ở «${c1}» (${r1}), cần mục đầu menu`);
  await p.keyboard.press('ArrowDown'); await p.waitForTimeout(100);
  const [r2, c2] = await vai();
  if (r2 !== 'menuitem' || c2 === c1) loi.push(`↓: focus «${c2}», cần mục kế`);
  await p.keyboard.press('Escape'); await p.waitForTimeout(100);
  if (!(await nut.evaluate((b) => b === document.activeElement))) loi.push('Esc: focus không về nút ⋯');
  await ctx.close();
});
/*
 * E-NHO (PR-EN, kịch bản `ngon-ngu`): (1) chưa đăng nhập bấm English → tải lại vẫn EN; (2) đăng nhập vai chưa chọn → tài khoản lưu `en`;
 * (3) máy mới (localStorage trống) đăng nhập cùng vai → tự EN; (4) bấm VI ở thanh trên → tài khoản `vi`. Vai 9; trả tài khoản về `vi`.
 */
if (!CHI_BANG && (!LOC || 'ngon-ngu'.includes(LOC))) {
  const buoc = [];
  const ktra = (dk, chu) => { if (!dk) buoc.push(chu); };
  const ctx = await trinh.newContext({ viewport: { width: 1440, height: 900 } });
  const p = await ctx.newPage();
  p.setDefaultTimeout(8000);
  const nnTk = async (pg) => (await (await pg.request.get(`${BASE}/api/demo/session`)).json()).ngonNgu ?? null;
  try {
    await p.request.post(`${BASE}/api/demo/session`, { data: { userId: 9 } });
    await p.request.patch(`${BASE}/api/me/profile`, { data: { ngonNgu: 'vi' } });
    await p.request.delete(`${BASE}/api/demo/session`);
    await p.goto(BASE + '/', { waitUntil: 'networkidle' });
    await p.getByRole('button', { name: 'English' }).click();
    await p.waitForLoadState('networkidle');
    await p.reload({ waitUntil: 'networkidle' });
    ktra(await p.getByRole('button', { name: 'Sign in', exact: false }).count() > 0 && (await p.evaluate(() => document.documentElement.lang)) === 'en', '(1) bấm English rồi tải lại không còn EN');
    await p.getByRole('button', { name: /Quick demo login/ }).click();
    await p.getByRole('button', { name: /Lê|Phạm|Nguyễn|Trần|Hoàng|Vũ|Đỗ/ }).first().waitFor();
    // Vào nhanh bằng giao diện (đúng đường người dùng): vai 9 = GVBM — gọi API cho chắc rồi tải lại.
    await p.request.post(`${BASE}/api/demo/session`, { data: { userId: 9 } });
    await p.reload({ waitUntil: 'networkidle' }); await p.waitForTimeout(800);
    ktra(await nnTk(p) === 'en', `(2) đăng nhập sau khi chọn English: tài khoản ${await nnTk(p)}, cần en`);
    const ctx2 = await trinh.newContext({ viewport: { width: 1440, height: 900 } });
    const p2 = await ctx2.newPage();
    await p2.request.post(`${BASE}/api/demo/session`, { data: { userId: 9 } });
    await p2.goto(BASE + '/', { waitUntil: 'networkidle' }); await p2.waitForTimeout(1500);
    ktra((await p2.evaluate(() => document.documentElement.lang)) === 'en', '(3) máy mới đăng nhập cùng vai không tự EN');
    await p2.getByRole('group', { name: 'Language' }).getByRole('button', { name: 'VI' }).click();
    await p2.waitForLoadState('networkidle'); await p2.waitForTimeout(800);
    ktra(await nnTk(p2) === 'vi' && (await p2.evaluate(() => document.documentElement.lang)) === 'vi', `(4) bấm VI: tài khoản ${await nnTk(p2)}`);
    await ctx2.close();
  } catch (e) { buoc.push(`kịch bản dừng: ${e.message.split('\n')[0]}`); }
  await p.request.patch(`${BASE}/api/me/profile`, { data: { ngonNgu: 'vi' } }).catch(() => {});
  await ctx.close();
  console.log(`${buoc.length ? '✗' : '✓'} ngon-ngu (E-NHO bốn bước)${buoc.map((l) => `\n    ${l}`).join('')}`);
  tongLoi += buoc.length;
}
/*
 * HD-a / HD-b (kịch bản `hd-chi`): bấm MỌI "Chỉ cho tôi" của mỗi vai bằng tài khoản demo của vai đó (GV 7, 9 · QL 2 · Quản trị 1 · TVV 23 · CX 24 ·
 * Admin 22; 1440 + 375). Việc hằng tuần / Luật và hạn bấm ở trang Hướng dẫn; Theo màn bấm
 * trong panel "?" của đúng màn. Đạt khi: khoanh hiện (không "Chưa có việc nào ở đây"), phần tử `data-hd` thấy được và bấm được (không bị che), Esc tắt.
 * Nội dung đọc từ bản dựng máy chủ (`npm run dev` đã `build:server`).
 */
if (!CHI_BANG && (!LOC || 'hd-chi'.includes(LOC))) {
  const { HUONG_DAN } = await import(pathToFileURL(path.resolve('dist-server/shared/huongDan/index.js')).href);
  const TAI_KHOAN = { gv: [7, 9], ql: [2], qt: [1], tvv: [23], cx: [24], admin: [22] };
  const chon = (process.env.HD_VAI ?? '').split(',').filter(Boolean);
  const loi = [];
  for (const [vaiHd, ids] of Object.entries(TAI_KHOAN)) for (const [w, h] of [[1440, 900], [375, 812]]) for (const vai of ids) {
    if (chon.length && !chon.includes(vaiHd)) continue;
    const hd = HUONG_DAN[vaiHd];
    const ctx = await trinh.newContext({ viewport: { width: w, height: h } });
    await ctx.addInitScript((nn) => { try { localStorage.setItem('pisa-ngon-ngu', nn); } catch {} }, NN);
    const p = await ctx.newPage();
    p.setDefaultTimeout(8000);
    await p.request.post(`${BASE}/api/demo/session`, { data: { userId: vai } });
    await p.request.patch(`${BASE}/api/me/profile`, { data: { ngonNgu: NN } });   // tài khoản cùng tiếng với máy (không tải lại giữa chừng)
    const thu = async (nhan, mo, vung, id, maHd) => {
      try {
        await mo();
        const muc = p.locator(`${vung} [data-muc="${id}"]`).first();
        const nut = muc.locator('[aria-expanded]').first();
        if ((await nut.getAttribute('aria-expanded')) === 'false') await nut.click();
        await muc.locator('button:not([aria-expanded])').last().click();
        const chu = p.locator('[data-chi-cho-toi] [role=status]');
        await chu.waitFor({ timeout: 10000 });
        const kq = await p.evaluate((x) => {
          const el = [...document.querySelectorAll([x].flat().map((h) => `[data-hd="${h}"]`).join(','))].find((e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0; });
          if (!el) return 'không thấy phần tử';
          const r = el.getBoundingClientRect();
          const phu = document.querySelector('[data-chi-cho-toi]');
          phu.style.display = 'none';
          const tren = document.elementFromPoint(r.left + Math.min(r.width / 2, 40), r.top + Math.min(r.height / 2, 20));
          phu.style.display = '';
          if (r.bottom < 0 || r.top > innerHeight) return 'phần tử ngoài màn';
          return tren && (el === tren || el.contains(tren)) ? '' : `bị che bởi «${(tren?.textContent ?? '').trim().slice(0, 40)}»`;
        }, maHd);
        if (/Chưa có việc nào ở đây|Nothing here yet/.test(await chu.innerText())) loi.push(`${nhan}: chú thích "Chưa có việc"`);
        else if (kq) loi.push(`${nhan}: ${kq}`);
        await p.keyboard.press('Escape');
        if (await p.locator('[data-chi-cho-toi]').count()) loi.push(`${nhan}: Esc không tắt`);
      } catch (e) { loi.push(`${nhan}: ${e.message.split('\n')[0]}`); }
    };
    for (const [phan, ds] of [['viec', hd.viec], ['luat', hd.luat]]) for (const m of ds) if (m.chi) {
      await thu(`${w}/v${vai} ${m.id}`, () => p.goto(`${BASE}/huong-dan?phan=${phan}`, { waitUntil: 'networkidle' }), '#noi-dung', m.id, m.chi.hd);
    }
    /* Theo màn bấm TỪ trang Hướng dẫn (rà #417): "Chỉ cho tôi" phải tự mở trang của màn. */
    for (const man of hd.man) for (const m of man.muc) if (m.chi) {
      await thu(`${w}/v${vai} trang-hd ${man.id}›${m.id}`, () => p.goto(`${BASE}/huong-dan?phan=man`, { waitUntil: 'networkidle' }), '#noi-dung', m.id, m.chi.hd);
    }
    for (const man of hd.man) for (const m of man.muc) if (m.chi) {
      await thu(`${w}/v${vai} ${man.id}›${m.id}`, async () => {
        await p.goto(BASE + man.duong[0], { waitUntil: 'networkidle' });
        /* OV-15a: Hướng dẫn của màn nằm trong menu Tài khoản (bỏ nút "?" trên thanh). */
        await p.locator('[data-hd="tai-khoan"]:visible').first().click();
        await p.getByRole('button', { name: /^(Hướng dẫn|Guide)$/ }).click();
      }, '[role=dialog]', m.id, m.chi.hd);
    }
    await ctx.close();
  }
  console.log(`${loi.length ? '✗' : '✓'} hd-chi (mọi "Chỉ cho tôi" của ${chon.length ? chon.join(', ') : '6 vai'})${loi.map((l) => `\n    ${l}`).join('')}`);
  tongLoi += loi.length;
}
/*
 * CONG-CU (kịch bản `lich`, tài liệu đánh giá 12.7 / V3B-09): lịch `LichNho` vẽ qua portal ra ngoài cây hộp — hộp tự đóng khi "bấm ngoài" theo cây
 * DOM sẽ đóng khi bấm trong lịch. Mỗi hộp có ô ngày, mỗi ô: mở lịch → bấm ‹ → hộp còn, lịch còn → bấm một ngày → hộp còn. 1440 tối + 375 sáng.
 */
if (!CHI_BANG && (!LOC || 'lich'.includes(LOC) || LOC.startsWith('lich-'))) {
  const theoTen = (ten) => KICH_BAN.find((k) => k[0] === ten);
  const hopThoiGian = async (p) => {   // BoChonThoiGian: mở hộp → "Theo tuần" (hiện ô Từ tuần / Đến tuần)
    await p.locator('[data-hd="pt-thoi-gian"] > button[aria-expanded]:visible').last().click();   // panel (vẽ sau) nằm cuối
    await p.getByRole('dialog', { name: 'Khoảng thời gian' }).getByRole('button', { name: 'Theo tuần' }).click();
    await p.waitForTimeout(200);
  };
  /** [tên, vai, đường, mở hộp]: mọi hộp / panel có ô ngày mà demo mở được. */
  const HOP_NGAY = [
    ['lich-phan-tich', 2, '/phan-tich', hopThoiGian],
    ['lich-tutor', 1, '/tutor', hopThoiGian],
    ['lich-panel-tutor', 1, '/tutor', async (p) => { await p.getByRole('button', { name: /^✓?Tất cả/ }).click(); await p.waitForTimeout(600); await p.locator('#noi-dung button.link').first().click(); await p.waitForTimeout(800); await hopThoiGian(p); }],
    ['lich-loc-them', 2, '/hoc-vien?lt=1&ltu=2026-08-03&lden=2026-09-13', hopThoiGian],
    ...['hop-ky-nang-mt', 'panel-tao-case', 'panel-vi-pham', 'panel-pa'].map((k) => { const [, v, d, mo] = theoTen(k); return [`lich-${k}`, v, d, mo]; }),
  ];
  /* ONgay (nút lịch) và TuanNho (nút giữa ‹ tuần ›) — hai cửa mở LichNho. */
  const NUT_LICH = 'button[aria-haspopup=dialog][aria-label^="Mở lịch"]:visible, button[aria-haspopup=dialog][title*="họn tuần"]:visible';
  const LICH = '[role=dialog]:has(button[aria-label="Tháng trước"], button[aria-label="Năm trước"])';
  const loi = [];
  for (const [w, h, sang] of [[1440, 900, false], [375, 812, true]]) {
    const ctx = await trinh.newContext({ viewport: { width: w, height: h } });
    await ctx.addInitScript((s) => { try { localStorage.setItem('pisa-giao-dien', s ? 'light' : 'dark'); localStorage.setItem('pisa-ngon-ngu', 'vi'); } catch {} }, sang);
    const p = await ctx.newPage();
    p.setDefaultTimeout(8000);
    for (const [ten, vai, duong, mo] of HOP_NGAY) {
      if (LOC && LOC !== 'lich' && !ten.includes(LOC)) continue;
      const nhan = `${ten}-${w}`;
      const moHop = async () => { await p.goto(BASE + duong, { waitUntil: 'networkidle' }); await p.waitForTimeout(400); await mo(p); };
      try {
        await p.request.post(`${BASE}/api/demo/session`, { data: { userId: vai } });
        await moHop();
        const n = await p.locator(NUT_LICH).count();
        if (!n) { loi.push(`${nhan}: không thấy ô ngày`); continue; }
        for (let i = 0; i < n; i++) {
          if (i) await moHop();
          const nut = await p.locator(NUT_LICH).nth(i).elementHandle();
          const o = await nut.evaluate((b) => b.parentElement?.querySelector('input')?.getAttribute('aria-label') ?? (b.textContent.trim() || '?'));
          await nut.click();
          const lich = p.locator(LICH).last();
          await lich.waitFor();
          await lich.locator('button[aria-label="Tháng trước"], button[aria-label="Năm trước"]').click();
          await p.waitForTimeout(250);
          if (!(await nut.isVisible())) { loi.push(`${nhan} «${o}»: bấm ‹ trong lịch đóng hộp cha`); continue; }
          if (!(await lich.isVisible())) { loi.push(`${nhan} «${o}»: bấm ‹ đóng lịch`); continue; }
          await lich.locator('[data-o]:not([aria-disabled=true]):not([disabled])').first().click();
          await p.waitForTimeout(250);
          if (!(await nut.isVisible())) loi.push(`${nhan} «${o}»: chọn ngày trong lịch đóng hộp cha`);
        }
      } catch (e) { loi.push(`${nhan}: kịch bản dừng: ${e.message.split('\n')[0]}`); }
    }
    await ctx.close();
  }
  const [con, chuMien] = locMien('lich', 'lich', loi);
  console.log(`${con.length ? '✗' : '✓'} lich (bấm trong lịch không đóng hộp cha)${chuMien}${con.map((l) => `\n    ${l}`).join('')}`);
  tongLoi += con.length;
}
await trinh.close();
/* Dòng miễn không khớp lỗi nào (chỉ biết khi chạy đủ, không lọc): lỗi đã sửa → PR sửa phải gỡ dòng đó. */
if (!LOC && process.env.MIEN !== '0') for (const m of ['do-bang', ...(CHI_BANG ? [] : ['do-khung', 'lich'])].flatMap(mienThua)) {
  tongLoi++;
  console.log(`✗ dòng miễn thừa (${m.cong_cu} · ${m.pr}): ${m.khop} — đã hết lỗi, gỡ khỏi scripts/mien-do.json`);
}
console.log(`${tongLoi ? `\n${tongLoi} lỗi` : '\nKhông lỗi'}${tongMien ? ` · ${tongMien} lỗi đã biết được miễn (scripts/mien-do.json)` : ''}`);
process.exit(tongLoi ? 1 : 0);
