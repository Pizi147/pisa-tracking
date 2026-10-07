/**
 * PHÉP KIỂM PR-HK2 — Badge & chữ (kế hoạch 2026-10-07-pr-hk2-badge-chu). Quét nguồn (bỏ chú thích) như prUxG / prKhung:
 * khoá lớp CSS đúng ở GỐC CHUNG. Đo trên trang thật: `scripts/do-khung.mjs` (chạy tay).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { YThucTestKit } from './yThuc.tests.ts';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '..');
const boChuThich = (src: string) => src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\{\/\*[\s\S]*?\*\/\}/g, '').replace(/(^|[^:\\])\/\/.*$/gm, '$1');
const doc = (rel: string) => boChuThich(fs.readFileSync(path.join(ROOT, rel), 'utf8'));
/** Thân một hàm `export function ten(` tới export kế tiếp. */
const than = (src: string, ten: string) => {
  const i = src.indexOf(`export function ${ten}`);
  if (i < 0) throw new Error(`không thấy ${ten}`);
  const j = src.indexOf('\nexport ', i + 1);
  return src.slice(i, j < 0 ? undefined : j);
};
const tsx = (dir: string): string[] => fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true }).flatMap((e) =>
  e.isDirectory() ? tsx(`${dir}/${e.name}`) : e.name.endsWith('.tsx') ? [`${dir}/${e.name}`] : []);

export async function runPrHk2Tests(t: YThucTestKit) {
  const { check, checkAsync, assert, P } = t;
  const d: any = await import('../../../shared/domain/index.ts');
  const th: any = await import('../phanTich/tongHop.ts');
  console.log('\nPR-HK2 · Task 1 · hai họ chip, "+n", ⋯, nút lọc');

  check('C1 · Nhan.tsx export CHIP_TRON và CHIP_VUONG: cùng text-[11.5px], leading-[18px], border', () => {
    const s = doc('web/src/ui/Nhan.tsx');
    for (const ten of ['CHIP_TRON', 'CHIP_VUONG']) {
      const m = new RegExp(`export const ${ten} = '([^']*)'`).exec(s);
      assert(m, `${ten} chưa export`);
      for (const lop of ['text-[11.5px]', 'leading-[18px]', 'border']) assert(m![1].split(' ').includes(lop), `${ten} thiếu ${lop}`);
    }
  });

  check('C2 · Level, Task, Info, Status, Alert, Outcome, NhanTrangThai, MissingBadge, NhanViPham, NhanLoai lấy lớp từ CHIP_TRON / CHIP_VUONG (không text-[11px])', () => {
    const ui = doc('web/src/ui/ui.tsx');
    for (const [ten, hang] of [['Level', 'CHIP_TRON'], ['Task', 'CHIP_VUONG'], ['Info', 'CHIP_VUONG'], ['Status', 'CHIP_VUONG'], ['Alert', 'CHIP_VUONG'],
      ['Outcome', 'CHIP_VUONG'], ['NhanTrangThai', 'CHIP_VUONG']] as const) {
      const n = than(ui, ten);
      assert(n.includes(hang), `${ten} chưa dùng ${hang}`);
      assert(!/text-\[11px\]/.test(n), `${ten} còn text-[11px]`);
    }
    for (const [f, ten] of [['web/src/modules/students/MissingBadge.tsx', null], ['web/src/modules/yThuc/NhanViPham.tsx', null], ['web/src/modules/cases/SkillBoard.tsx', 'NhanLoai']] as const) {
      const s = ten ? than(doc(f), ten).split(/\r?\n\}\r?\n/)[0] : doc(f);   // đúng thân hàm, không lấn sang hàm kế
      assert(/CHIP_VUONG/.test(s) && !/text-\[11\.5px\]/.test(s) && !/rounded-md border px-/.test(s), `${f}: chưa dùng CHIP_VUONG hoặc còn chip tự dựng`);
    }
  });

  check('C3 · không chip rounded-full tự dựng ngoài ui/Nhan.tsx (trừ vòng số bước KhungPanel, nút điểm 44 px MotKyNang)', () => {
    const CHO_PHEP = ['web/src/ui/Nhan.tsx', 'web/src/ui/KhungPanel.tsx', 'web/src/modules/cham/MotKyNang.tsx'];
    const sai: string[] = [];
    for (const f of tsx('web/src')) {
      if (CHO_PHEP.includes(f)) continue;
      doc(f).split('\n').forEach((dong, i) => {
        if (/rounded-full/.test(dong) && /text-\[11|text-xs|px-1\.5|px-2|px-\[7/.test(dong)) sai.push(`${f}:${i + 1}`);
      });
    }
    assert(sai.length === 0, `chip rounded-full tự dựng: ${sai.join(', ')}`);
  });

  check('C4 · MissingBadge không còn màu amber cứng; nằm trong danh sách cấm màu của nenGiaoDien', () => {
    assert(!/amber-/.test(doc('web/src/modules/students/MissingBadge.tsx')), 'MissingBadge còn amber-');
    assert(doc('server/src/tests/nenGiaoDien.tests.ts').includes("'web/src/modules/students/MissingBadge.tsx'"), 'nenGiaoDien chưa kiểm MissingBadge');
  });

  check('C5 · một kiểu ⋯: không còn "⋮" trong mã web; "+n" dùng MenuDong kieu="chip" (HVL, hồ sơ lớp)', () => {
    const con = tsx('web/src').filter((f) => doc(f).includes('⋮'));
    assert(con.length === 0, `còn ⋮: ${con.join(', ')}`);
    assert(/kieu === 'chip'/.test(doc('web/src/ui/MenuDong.tsx')), 'MenuDong thiếu kieu="chip"');
    for (const f of ['web/src/modules/students/StudentsPage.tsx', 'web/src/modules/classes/DauTrangLop.tsx']) {
      assert(/<MenuDong kieu="chip" bieuTuong=\{`\+/.test(doc(f)), `${f}: "+n" chưa dùng kieu="chip"`);
    }
    assert(!/label="⋮"/.test(doc('web/src/modules/students/StudentDetailPage.tsx')), 'StudentDetailPage còn label="⋮"');
  });

  check('C6 · nút lọc viên thuốc: năm chỗ dùng `.nut-loc`, index.css có `.nut-loc`', () => {
    assert(/\.nut-loc\s*\{/.test(doc('web/src/index.css')), 'index.css thiếu .nut-loc');
    for (const f of ['web/src/modules/students/StudentsPage.tsx', 'web/src/modules/test/LichTestTab.tsx', 'web/src/modules/phanTich/HieuQuaPa.tsx',
      'web/src/modules/test/NganXuatMt.tsx', 'web/src/modules/test/keHoach/NganXepLichMt.tsx']) {
      assert(/\bnut-loc\b/.test(doc(f)), `${f}: chưa dùng nut-loc`);
    }
  });

  console.log('\nPR-HK2 · Task 2 · K6 chữ nội dung 12 px');

  check('C7 · Field (gợi ý/lỗi), SectionNote, KpiTile (ví dụ, dòng phụ) không còn text-[11px]; .hang-con > td / .khoi-nhom-con không còn 11.5px', () => {
    const ui = doc('web/src/ui/ui.tsx');
    for (const ten of ['Field', 'SectionNote']) assert(!/text-\[11px\]/.test(than(ui, ten)), `${ten} còn text-[11px]`);
    const kpi = than(ui, 'KpiTile').split('\n').filter((d) => !/uppercase/.test(d)).join('\n');   // nhãn in hoa của ô = đầu cột nhỏ, giữ 11 px
    assert(!/text-\[11px\]/.test(kpi), 'KpiTile còn text-[11px] ở dòng phụ / "Xem danh sách"');
    const css = doc('web/src/index.css');
    assert(!/\.hang-con > td \{[^}]*11\.5px/.test(css), '.hang-con > td còn 11.5px');
    assert(!/\.khoi-nhom-con \{[^}]*11\.5px/.test(css), '.khoi-nhom-con còn 11.5px');
  });

  check('C8 · chặn tăng lại: tổng text-[11px] trong web/src không vượt trần (chỉ được giảm)', () => {
    const TRAN = 87;   // số thật sau K6 (từ 349); chỉ được giảm
    const tong = tsx('web/src').reduce((n, f) => n + (doc(f).match(/text-\[11px\]/g)?.length ?? 0), 0);
    assert(tong <= TRAN, `text-[11px] = ${tong} > trần ${TRAN}`);
  });

  console.log('\nPR-HK2 · Task 3 · đầu cột dính ở bảng dài (≥ 1280 px)');

  check('C9 · index.css: .bang-dinh chỉ đè ở xl (≥ 1280; dưới đó bảng rộng hơn khung vẫn cuộn ngang): khối bọc overflow visible, đầu cột sticky top -1.25rem (= md:p-5 của <main>); .th lấy top từ --th-top', () => {
    const css = doc('web/src/index.css');
    const m = /@media \(min-width: 1280px\) \{([\s\S]*?)\r?\n  \}\r?\n/.exec(css.slice(css.indexOf('.table-scroll')));
    assert(m, 'thiếu khối @media (min-width: 1280px) sau .table-scroll');
    const kh = m![1];
    assert(/\.bang-dinh \{[^}]*overflow: visible/.test(kh), '.bang-dinh thiếu overflow: visible ở xl');
    assert(/\.bang-dinh \{[^}]*--th-top: calc\(-1 \* 1\.25rem\)/.test(kh), '.bang-dinh thiếu --th-top: calc(-1 * 1.25rem)');
    assert(/position: sticky; top: var\(--th-top\)/.test(kh), 'đầu cột chưa sticky theo --th-top');
    assert(/td \.bang-dinh \{[^}]*overflow-x: auto/.test(kh), 'bảng lồng trong ô (td .bang-dinh) phải giữ cuộn riêng');
    assert(/\.th \{[^}]*top: var\(--th-top, 0px\)/.test(css), '.th chưa lấy top từ --th-top');
    assert(!/\.bang-dinh[^{]*\{[^}]*overflow: visible[^}]*\}/.test(css.replace(kh, '')), '.bang-dinh đè overflow ngoài xl');
  });

  check('C10 · mỗi bảng vừa khung ở 1440 có bang-dinh (không cùng overflow-x-auto); khung bao (card / ô) không còn overflow-hidden', () => {
    const DS: Array<[string, number]> = [   // [tệp, số chỗ bang-dinh tối thiểu]
      ['web/src/modules/worklist/KhoiCanXuLy.tsx', 1], ['web/src/modules/worklist/LopToiDay.tsx', 1], ['web/src/modules/worklist/BranchPulse.tsx', 1],
      ['web/src/modules/students/ClassRoster.tsx', 1], ['web/src/modules/classes/BangDiemLopThuong.tsx', 1], ['web/src/modules/classes/TabTongKetLop.tsx', 1],
      ['web/src/modules/test/lichTest/HangLop.tsx', 1], ['web/src/modules/test/lichTest/KhoiNo.tsx', 1],
      ['web/src/modules/cham/LuoiFT.tsx', 1], ['web/src/modules/cham/LuoiThuong.tsx', 1],
      ['web/src/modules/platform/AdminPage.tsx', 1], ['web/src/modules/platform/AccountsAdmin.tsx', 1], ['web/src/modules/platform/CatalogAdmin.tsx', 2],
      ['web/src/modules/worklist/MgmtTasksPage.tsx', 1], ['web/src/modules/worklist/MeetingPage.tsx', 1],
    ];
    for (const [f, n] of DS) {
      const src = doc(f);
      assert((src.match(/\bbang-dinh\b/g)?.length ?? 0) >= n, `${f}: thiếu bang-dinh (cần ≥ ${n})`);
      assert(!/"[^"\n]*\boverflow-x-auto\b[^"\n]*\bbang-dinh\b|"[^"\n]*\bbang-dinh\b[^"\n]*\boverflow-x-auto\b/.test(src), `${f}: bang-dinh đi cùng overflow-x-auto (tiện ích thắng .bang-dinh)`);
    }
    // Khung bao của bảng dính không được là khung cuộn: overflow-hidden → overflow-clip (giữ bo góc, không thành khung cuộn).
    for (const [f, dau] of [['web/src/modules/test/LichTestTab.tsx', 'const khoiLop'], ['web/src/modules/test/lichTest/KhoiNo.tsx', 'id="lich-test-no" className'],
      ['web/src/modules/cham/DiemTheoLop.tsx', 'id={`bang-${classId}`}'], ['web/src/modules/classes/TabTongKetLop.tsx', '<section className="card']] as const) {
      const src = doc(f);
      const i = src.indexOf(dau);
      assert(i >= 0, `${f}: không thấy ${dau}`);
      const khung = src.slice(i, i + 700);
      assert(!/\bcard overflow-hidden\b|rounded-lg border overflow-hidden/.test(khung), `${f}: khung bao còn overflow-hidden`);
      assert(/overflow-clip/.test(khung), `${f}: khung bao chưa overflow-clip`);
    }
  });

  console.log('\nPR-HK2 · Task 4 · Phân tích › Tổng hợp (K2)');

  check('C11 · bỏ "Tạm thời": lượt chưa đủ điểm mà đã kết luận được rơi vào chuaDu; không còn cột tamThoi; năm cột Kết quả cộng đúng Lượt trên DB demo', () => {
    assert(th.phanLoaiLuot({ sosLevel: 1, complete: false }) === 'chuaDu', 'chưa đủ điểm + đã có mức SOS phải là chuaDu');
    assert(th.phanLoaiLuot({ sosLevel: 0, complete: false }) === 'chuaDu' && th.phanLoaiLuot({ sosLevel: null, complete: false }) === 'chuaDu', 'chưa đủ điểm → chuaDu');
    assert([0, 1, 2, 3].map((n) => th.phanLoaiLuot({ sosLevel: n, complete: true })).join() === 'dat,sos1,sos2,sos3', 'đủ điểm vẫn đạt/sos1-3');
    for (const ct of ['ft', 'thuong'] as const) {
      assert(!d.cotTongHopFor(ct).some((c: any) => c.khoa === 'tamThoi'), `${ct}: còn cột tamThoi`);
    }
    assert(d.cotKetQuaCong('ft').join() === 'dat,sos1,sos2,sos3,chuaDu', d.cotKetQuaCong('ft').join());
    for (const ct of ['ft', 'thuong'] as const) {
      const kq = th.tongHop(P.admin, { branchId: null, ct, soTuan: 52, classId: null, theo: 'tuan' });
      const cong = (o: Record<string, number>) => (d.cotKetQuaCong(ct) as string[]).reduce((s2, k) => s2 + (o[k] ?? 0), 0);
      assert(cong(kq.tong) === kq.tong.luot && kq.tong.luot > 0, `${ct}: Σ Kết quả ${cong(kq.tong)} ≠ Lượt ${kq.tong.luot}`);
      assert(!('tamThoi' in kq.tong), `${ct}: máy chủ còn trả tamThoi`);
    }
    assert(!/tamThoi/.test(doc('server/src/phanTich/tongHop.ts')), 'tongHop.ts còn tamThoi');
  });

  check('C12 · nhãn chuaDu = "Thiếu điểm" (FT và lớp thường); gợi ý FT ghi "kể cả lượt đã tạm có mức SOS"; choDuyet = "Chờ duyệt"', () => {
    for (const ct of ['ft', 'thuong'] as const) {
      const c = d.cotTongHopFor(ct).find((x: any) => x.khoa === 'chuaDu');
      assert(c && c.nhan(ct) === 'Thiếu điểm', `${ct}: nhãn ${c?.nhan(ct)}`);
      assert(!/Chưa đủ điểm|Tạm thời/.test(c.goiY + d.cotTongHopFor(ct)[0].goiY), `${ct}: gợi ý còn chữ cũ`);
    }
    assert(d.cotTongHopFor('ft').find((x: any) => x.khoa === 'chuaDu').goiY.includes('kể cả lượt đã tạm có mức SOS'), 'gợi ý FT');
    assert(d.cotTongHopFor('ft').find((x: any) => x.khoa === 'choDuyet').nhan('ft') === 'Chờ duyệt', 'choDuyet');
  });

  check('C13 · một cột hvCase "HV - Case" thay hvCoCase + case; máy chủ giữ hai nguồn; Excel giữ hai cột riêng; ô web có hai SoLieuO riêng', () => {
    for (const ct of ['ft', 'thuong'] as const) {
      const khoa = d.cotTongHopFor(ct).map((c: any) => c.khoa);
      assert(khoa.includes('hvCase') && !khoa.includes('hvCoCase') && !khoa.includes('case'), `${ct}: ${khoa.join()}`);
      assert(d.cotTongHopFor(ct).find((c: any) => c.khoa === 'hvCase').nhan(ct) === 'HV - Case', 'nhãn');
      assert(d.cotTongHopFor(ct).find((c: any) => c.khoa === 'hvCase').nhom === 'xu-ly', 'nhóm Xử lý');
      const so = d.cotSoLieu(ct).map((c: any) => c.khoa);
      assert(so.includes('hvCoCase') && so.includes('case') && !so.includes('hvCase'), `${ct}: cotSoLieu ${so.join()}`);
    }
    const kq = th.tongHop(P.admin, { branchId: null, ct: 'ft', soTuan: 52, classId: null, theo: 'tuan' });
    assert(typeof kq.tong.hvCoCase === 'number' && typeof kq.tong.case === 'number', 'o vẫn có hvCoCase và case');
    const aoa = d.bangXuatTongHop({ theo: 'tuan', ct: 'ft', cot: [], hang: [{ khoa: 'a', nhan: 'W1 OCT', o: { luot: 3, hvCoCase: 2, case: 5 } }],
      tong: { luot: 3, hvCoCase: 2, case: 5 }, scopeEmpty: false }, new Set(['ket-qua', 'xu-ly']), 'x') as any[][];
    assert(aoa[3].includes('HV có Case') && aoa[3].includes('Case') && !aoa[3].includes('HV - Case') && !aoa[3].includes('Tạm thời') && aoa[3].includes('Thiếu điểm'), JSON.stringify(aoa[3]));
    const dong = aoa.find((r) => r[0] === 'W1 OCT')!;
    assert(dong[aoa[3].indexOf('HV có Case')] === 2 && dong[aoa[3].indexOf('Case')] === 5, JSON.stringify(dong));
    const tsx = doc('web/src/modules/phanTich/TongHopTestSos.tsx');
    assert(/col\.gop/.test(tsx) && /cotSoLieu\(ct\)/.test(tsx) && (tsx.match(/soBam\(row, /g)?.length ?? 0) >= 3, 'ô hvCase cần hai nguồn riêng (hvCoCase, case) qua cotSoLieu, mỗi số một soBam');
  });

  check('C14a · số mỗi ô = số dòng khi bấm (oTongHop cùng khoá): mọi cột, gồm chuaDu và hai số của HV - Case, ở dòng Tổng, một dòng và một dòng con', () => {
    for (const ct of ['ft', 'thuong'] as const) {
      const bo = { branchId: null, ct, soTuan: 52, classId: null, theo: 'lop' as const };
      const kq = th.tongHop(P.admin, bo);
      const cotMo = (d.cotSoLieu(ct) as any[]).map((c) => c.khoa as string);
      const dongCoCon = kq.hang.find((h: any) => h.con?.length && h.o.luot > 0);
      const ds: Array<[string, Record<string, number>]> = [['tong', kq.tong], [kq.hang[0].khoa, kq.hang[0].o]];
      if (dongCoCon) ds.push([dongCoCon.con[0].khoa, dongCoCon.con[0].o]);
      for (const [khoa, o] of ds) for (const cot of cotMo) {
        const r = th.oTongHop(P.admin, { ...bo, khoa, cot });
        assert(r.n === (o[cot] ?? 0) && r.rows.length === r.n, `[${ct}] ${khoa} · ${cot}: bảng ${o[cot] ?? 0} ≠ n ${r.n} / dòng ${r.rows.length}`);
      }
      assert((kq.tong.choNguyenNhanQuaHan ?? 0) <= (kq.tong.choNguyenNhan ?? 0), `[${ct}] quá hạn > chờ nguyên nhân`);
    }
  });

  check('C15a · ô Đạt / SOS 1–3 dùng CHIP_VUONG + tông dat/sos1-3; chú giải bỏ "Tạm thời / Chưa đủ điểm"; "16 ⚠1"; ⋯ gom Cột hiện + hai nút xuất; đầu cột whitespace-normal; bang-dinh', () => {
    const s = doc('web/src/modules/phanTich/TongHopTestSos.tsx');
    assert(/CHIP_VUONG/.test(s) && /ui\/Nhan\.tsx/.test(s), 'chưa dùng CHIP_VUONG');
    const mau = /const MAU_O[^]*?\n\};/.exec(s)?.[0] ?? '';
    assert(/dat:/.test(mau) && /sos1:/.test(mau) && /sos2:/.test(mau) && /sos3:/.test(mau) && !/\btam:/.test(mau), `MAU_O thiếu tông hoặc còn tam: ${mau}`);
    assert(!/Tạm thời|Chưa đủ điểm|quá hạn\)/.test(s), 'còn "Tạm thời" / "Chưa đủ điểm" / "quá hạn)"');
    assert(/⚠/.test(s) && /text-late/.test(s) && /quá hạn/.test(s), 'chưa có ⚠ text-late + title "n quá hạn"');
    assert(/<MenuDong/.test(s) && /Cột hiện/.test(s) && /⤓ Xuất bảng này/.test(s) && /Xuất kết quả từng lượt/.test(s), 'chưa gom nút vào MenuDong');
    assert(!/Cột hiện ▾/.test(s) && !/className="btn btn-sm"/.test(s), 'còn nút ngoài');
    assert(/nav\?\.xuatMt/.test(s), 'mất điều kiện xuatMt');
    assert(/className=\{`th [^`]*whitespace-normal/.test(s) && /<Th key=\{c\.khoa\}[^>]*whitespace-normal/.test(s), 'đầu cột chưa whitespace-normal');
    assert(/table-scroll bang-dinh/.test(s) && !/overflow-x-auto[^"]*bang-dinh/.test(s), 'bảng chưa gắn bang-dinh');
    assert(/sticky-col/.test(s), 'mất cột đầu đứng yên (375)');
    const sh = doc('shared/domain/phanTich.ts');
    const i = sh.indexOf('export type MauOKetQua');
    assert(i >= 0 && !/'tam'/.test(sh.slice(i, i + 90)), 'MauOKetQua còn tam');
    assert(d.mauOKetQua('chuaDu', 3) === null && d.mauOKetQua('hvCase', 3) === null, 'chuaDu / hvCase không tô nền');
  });

  console.log('\nPR-HK2 · Task 5 · điện thoại: thanh trên 23C, demo bar một dòng, Học viên & Lớp');

  check('C16a · thanh trên: chữ PISA ở < 640 px (khối "Pisa Tracking" ẩn ở sm-); Tìm / Thông báo / Tài khoản không viền, biểu tượng 20, số chuông đè góc', () => {
    const app = doc('web/src/App.tsx');
    assert(/sm:hidden[^>]*>PISA</.test(app), 'App.tsx: thiếu chữ PISA (sm:hidden)');
    assert(/hidden sm:block/.test(app) && /Pisa Tracking/.test(app), 'App.tsx: khối tên đầy đủ phải ẩn ở < 640 px (tên web đổi ở Task 10)');
    assert(/max-sm:h-\[52px\]/.test(app), 'App.tsx: thanh trên điện thoại cao 52 px');
    const hd = doc('web/src/modules/platform/Header.tsx');
    const nut = (moc: string) => { const i = hd.indexOf(moc); assert(i >= 0, `Header.tsx: không thấy ${moc}`); return hd.slice(i, i + 900); };
    for (const moc of ['ref={nutTim}', 'ref={nutThongBao}', 'ref={nutTaiKhoan}']) {
      const n = nut(moc);
      assert(/border-0/.test(n) && /bg-transparent/.test(n), `${moc}: nút điện thoại phải không viền, nền trong`);
      assert(/min-h-\[44px\]/.test(n) && /min-w-\[44px\]/.test(n), `${moc}: nút < 44 px`);
    }
    assert(/width="20" height="20"/.test(nut('ref={nutTim}')) && /sm:hidden" aria-hidden width="20" height="20"/.test(nut('ref={nutThongBao}')), 'biểu tượng Tìm / chuông phải 20 px');
    assert(/max-sm:absolute/.test(nut('{unread > 0 &&')), 'số chưa đọc phải max-sm:absolute đè góc chuông');
  });

  check('C17a · Q2 = A: Sáng/Tối < 640 px nằm trong menu Tài khoản, không trên thanh', () => {
    const hd = doc('web/src/modules/platform/Header.tsx');
    const thanh = hd.indexOf('<CongTacGiaoDien />'), menu = hd.indexOf('<CongTacGiaoDien kieu="menu"'), tk = hd.indexOf('ref={nutTaiKhoan}');
    assert(thanh >= 0 && /!dienThoai && <CongTacGiaoDien \/>/.test(hd), 'nút Sáng/Tối trên thanh chỉ vẽ khi !dienThoai');
    assert(menu > tk && /dienThoai && <CongTacGiaoDien kieu="menu"/.test(hd), 'Sáng/Tối kiểu menu phải nằm trong menu Tài khoản, chỉ khi dienThoai');
    const cd = doc('web/src/ui/CongTacGiaoDien.tsx');
    assert(/kieu === 'menu'/.test(cd) && /Giao diện/.test(cd) && /'Sáng'/.test(cd) && /'Tối'/.test(cd) && /min-h-\[44px\]/.test(cd), 'CongTacGiaoDien kieu="menu": hàng "Giao diện" + Sáng / Tối cao ≥ 44 px');
  });

  check('C18a · DemoBar một dòng ở < 640 px: "Demo" · ngày · "Công cụ" · "Tài khoản" (chữ đầy đủ chỉ ở sm+), nút ≥ 44 px', () => {
    const s = doc('web/src/modules/platform/DemoBar.tsx');
    assert(/sm:hidden">Công cụ</.test(s) && /sm:hidden">Tài khoản</.test(s), 'thiếu chữ ngắn Công cụ / Tài khoản (sm:hidden)');
    assert(/max-sm:hidden">Công cụ demo</.test(s) && /max-sm:hidden">Đổi tài khoản demo</.test(s), 'chữ đầy đủ phải ẩn ở < 640 px');
    assert(/sm:hidden">Demo</.test(s) && /max-sm:hidden">Dữ liệu demo</.test(s), 'chip "Demo" ngắn ở điện thoại');
    assert(/max-sm:hidden">Ngày demo: </.test(s), 'nhãn "Ngày demo:" ẩn ở điện thoại');
    assert((s.match(/max-sm:min-h-\[44px\]/g)?.length ?? 0) >= 2, 'hai nút demo phải cao ≥ 44 px ở điện thoại');
    assert(/max-sm:py-1\b/.test(s), 'demo bar điện thoại py-1 (≤ 53 px)');
  });

  check('C19a · Học viên & Lớp: ô tìm "Lọc trong danh sách này…"; "+ Lớp mới" / "+ Học viên" max-sm:hidden và có trong MenuDong "Thao tác trang" (chỉ < 640 px)', () => {
    const s = doc('web/src/modules/students/StudentsPage.tsx');
    assert(/placeholder="🔍 Lọc trong danh sách này…"/.test(s) && !/Tìm tên, mã học viên hoặc mã lớp/.test(s), 'placeholder ô tìm');
    assert(/className="btn btn-sm max-sm:hidden"[^]*?>\+ Lớp mới</.test(s) && /className="btn btn-sm btn-primary max-sm:hidden"[^]*?>\+ Học viên</.test(s), 'hai nút ngoài phải max-sm:hidden');
    const mn = s.slice(s.indexOf('<MenuDong nhan="Thao tác trang"'), s.indexOf('<MenuDong nhan="Thao tác trang"') + 900);
    assert(/dienThoai && data\?\.coTheTaoLop/.test(mn) && /nhan: '\+ Lớp mới'/.test(mn), 'mục "+ Lớp mới" trong menu chỉ khi dienThoai');
    assert(/dienThoai && \(data\?\.rows[^)]*\)\.some\(\(r\) => r\.viewer\.coTheSuaHocVien\)/.test(mn) && /nhan: '\+ Học viên'/.test(mn), 'mục "+ Học viên" trong menu chỉ khi dienThoai');
    assert(/keTruoc/.test(mn), 'Lưu trữ cách một đường kẻ khi có mục thêm');
  });

  console.log('\nPR-HK2 · Task 6a · chữ: J1, J2, J3, J4, J7, J9, U12, "Khác", Lưu trữ rỗng');

  check('C18 · J1: gapText trả "-1.5" / "+0.5" / "đạt kỳ vọng" (không còn "thiếu" / "vượt"); chỗ in có title "dưới kỳ vọng"', () => {
    const sb = doc('web/src/modules/cases/SkillBoard.tsx');
    const g = /export function gapText\([^)]*\): string \{[^]*?\n\}/.exec(sb)?.[0] ?? '';
    assert(g.includes("'đạt kỳ vọng'") && /`-\$\{Math\.abs\(gap\)\}`/.test(g) && /`\+\$\{gap\}`/.test(g) && !/thiếu|vượt/.test(g), `gapText: ${g}`);
    assert(/title=\{[^\n]*dưới/.test(sb), 'SkillBoard: số lệch thiếu title "dưới kỳ vọng"');
  });

  check('C19 · J4: KhoiCanXuLy không còn "Gộp hai khung", OverviewPage không còn "Chỉ phần số đổi"', () => {
    assert(!/Gộp hai khung/.test(doc('web/src/modules/worklist/KhoiCanXuLy.tsx')), 'còn "Gộp hai khung"');
    assert(!/Chỉ phần số đổi/.test(doc('web/src/modules/worklist/OverviewPage.tsx')), 'còn "Chỉ phần số đổi"');
  });

  const tq: any = await import('../worklist/tongQuan.ts');
  check('C20 · J3 (DB): tongQuan không còn chuỗi "quá hạn từ"; mọi dòng Cần xử lý quá hạn ghi "quá hạn n ngày"; web in "⚠" trước', () => {
    assert(!/quá hạn từ/.test(doc('server/src/worklist/tongQuan.ts')), 'tongQuan.ts còn "quá hạn từ"');
    let soQuaHan = 0;
    for (const p of [P.mbManager, P.admin]) {
      for (const x of tq.tongQuanQuanLy(p, {}).canXuLy as any[]) {
        if (!('chu' in x.han) || !x.han.quaHan) continue;
        soQuaHan++;
        assert(/^quá hạn \d+(–\d+)? ngày$/.test(x.han.chu), `${x.metricId}: "${x.han.chu}"`);
      }
    }
    assert(soQuaHan > 0, 'bộ demo phải có dòng quá hạn dạng chữ');
    assert(/⚠ \{x\.han\.chu\}/.test(doc('web/src/modules/worklist/KhoiCanXuLy.tsx')), 'KhoiCanXuLy chưa in ⚠ trước chữ quá hạn');
  });

  const mywork: any = await import('../worklist/mywork.ts');
  check('C21 · J7 (DB): việc của chính người xem có owner = null (web không in "Bạn"); việc người khác (QL xem tất cả) vẫn ghi tên; cột Tổng quan QL giữ "Bạn"', () => {
    for (const p of [P.subjectTeacher, P.mbManager]) {
      const mine = (mywork.myWork(p, {}).items as any[]).filter((i) => i.ownerId === p.userId);
      for (const i of mine) assert(i.owner === null && i.mine === true, `${i.key}: owner=${i.owner} mine=${i.mine}`);
    }
    const ts = (mywork.myWork(P.subjectTeacher, {}).items as any[]).filter((i) => i.ownerId === P.subjectTeacher.userId);
    assert(ts.length > 0, 'GV bộ môn phải có việc của chính mình');
    const tatCa = mywork.myWork(P.mbManager, { nguoi: 'tat-ca' }).items as any[];
    const khac = tatCa.filter((i) => i.ownerId !== null && i.ownerId !== P.mbManager.userId);
    assert(khac.length > 0 && khac.every((i) => typeof i.owner === 'string' && i.owner !== 'Bạn'), 'việc người khác phải ghi tên thật');
    assert(!/'Bạn'/.test(doc('server/src/worklist/mywork.ts')), 'mywork.ts còn "Bạn"');
    assert(/Bạn/.test(doc('web/src/modules/worklist/KhoiCanXuLy.tsx')), 'cột "Người giữ việc" của Tổng quan QL phải giữ "Bạn"');
  });

  check('C22 · J9: "Xác nhận PA Tutor" không kèm mô tả máy gán (· đến lúc thi / đến MT n / 1 tháng); tên người dạy tự viết giữ nguyên, kể cả có " · "', () => {
    const c = { status: 'open' as const, fromSos: true, hasCause: true, dismissed: false, systemClosed: false, choDuyetKhongTheoDoi: false, coPaChoXacNhan: true, hanXacNhan: '2026-09-16' };
    const pa = (ten: string) => ({ id: 1, ten, batBuoc: true, choXacNhan: true, xong: false, actionDue: '2026-09-28', followupDue: '2026-10-18' });
    const chu = (ten: string) => d.viecTiepCuaCase(c, [pa(ten)], '2026-09-22')?.chu;
    assert(chu('Tutor · đến lúc thi') === 'Xác nhận PA Tutor', chu('Tutor · đến lúc thi'));
    assert(chu('Tutor · đến MT3') === 'Xác nhận PA Tutor' && chu('Tự học · 1 tháng') === 'Xác nhận PA Tự học', 'MT n / 1 tháng');
    assert(chu('Kèm 1-1 · Reading') === 'Xác nhận PA Kèm 1-1 · Reading', 'tên tự viết bị cắt');
  });

  check('C23 · J9: ô FT chưa có điểm ghi "Nhập" (không "— sửa"); ô có điểm giữ "6.5 sửa"; đầu cột S nhận chiTen + title có tên', () => {
    const s = doc('web/src/modules/fasttrack/ScoreEntry.tsx');
    const i = s.indexOf("title={hieuChinh ? 'Sửa bốn tiêu chí đã chấm.'");
    assert(i >= 0, 'không thấy nút bốn tiêu chí');
    const nut = s.slice(i, s.indexOf('</button>', i));
    assert(/'Nhập'/.test(nut) && /cell\.band === null/.test(nut), 'ô trống chưa ghi "Nhập"');
    assert(!/lon && cell\.band === null && nhanDau \? ''/.test(nut), 'ô trống còn chữ rỗng + "sửa"');
    assert(/>sửa</.test(nut) && /fmtBand\(cell\.band\)/.test(nut), 'ô có điểm phải giữ "6.5 sửa"');
    assert(/<NutGvCham chiTen/.test(doc('web/src/modules/cham/LuoiFT.tsx')) && /<NutGvCham lon chiTen/.test(doc('web/src/modules/cham/MotKyNang.tsx')), 'đầu cột S phải truyền chiTen');
    assert(/title=\{chiTen \? `GV chấm Speaking: \$\{ten/.test(doc('web/src/modules/cham/GvCham.tsx')), 'GvCham: chiTen phải có title ghi tên (tên dài bị cắt)');
  });

  check('C24 · J2 (Q3 = A): mọi chỗ in mã học viên ra màn đi qua maHocVienNgan; Excel giữ mã đầy đủ', () => {
    const CAC_FILE = ['web/src/modules/students/StudentDetailPage.tsx', 'web/src/modules/cham/LuoiFT.tsx', 'web/src/modules/cham/LuoiThuong.tsx', 'web/src/modules/cham/MotKyNang.tsx',
      'web/src/modules/cham/DiemTheoLop.tsx', 'web/src/modules/students/LuuTruPage.tsx', 'web/src/modules/classes/TransitionPanel.tsx', 'web/src/modules/platform/Header.tsx',
      'web/src/modules/students/ClassRoster.tsx', 'web/src/modules/students/BangHocVienLop.tsx', 'web/src/modules/classes/BangDiemLopThuong.tsx'];
    for (const f of CAC_FILE) {
      const s = doc(f).replace(/maHocVienNgan\([^()]*\)/g, '');
      const sai = s.split('\n').map((dong, i) => [dong, i + 1] as const).filter(([dong]) => /\.studentCode\b/.test(dong));
      assert(sai.length === 0, `${f}: in studentCode thẳng ra màn ở dòng ${sai.map((x) => x[1]).join(', ')}`);
    }
    assert(/maHocVienNgan\(st\.code\)/.test(doc('web/src/modules/cases/QuickReport.tsx')), 'QuickReport: mã trong ô chọn học viên phải qua maHocVienNgan');
    assert(d.maHocVienNgan('PISA-000048') === '000048', 'maHocVienNgan');
    assert(!/maHocVienNgan/.test(doc('server/src/phanTich/xuatMt.ts')), 'Excel phải giữ mã đầy đủ (không rút gọn)');
  });

  await checkAsync('C20b · J2 (DB): tìm học viên theo "000048" và "PISA-000048" (và chữ thường) cùng ra một em', async () => {
    const { listStudents } = await import('../students/students.ts');
    const hv = (listStudents(P.admin, {}) as any).rows[0];
    const ma: string = hv.studentCode;
    assert(/^PISA-\d{6}$/.test(ma), `mã demo: ${ma}`);
    for (const q of [ma, ma.replace(/\D/g, ''), ma.toLowerCase()]) {
      const r = (listStudents(P.admin, { q }) as any).rows as any[];
      assert(r.some((x) => x.id === hv.id), `q="${q}" không ra ${ma}`);
    }
  });

  check('C25 · U12: "(đã chấm)" bỏ khỏi lopThuong.ts và chamDiem.ts; "Không đạt: …" của bài chấm dở màu text-soon', () => {
    assert(!/\(đã chấm\)/.test(doc('shared/domain/lopThuong.ts')) && !/\(đã chấm\)/.test(doc('shared/domain/chamDiem.ts')), 'còn "(đã chấm)"');
    const kq = d.nhanKetQuaThuong({ kind: 'progress', ct: 'MB', scored: 2, required: 4, failedSkills: ['reading'], tyLeTong: null, khongChiaMon: false });
    assert(kq.chinh === '1/2 môn đạt' && /^Không đạt: /.test(kq.phu), JSON.stringify(kq));
    const chuaXong = /Chờ \{a\.required - a\.scored\} môn[^]*?<\/>/.exec(doc('web/src/modules/students/StudentDetailPage.tsx'))?.[0] ?? '';
    assert(/text-soon/.test(chuaXong) && !/text-slate-400/.test(chuaXong), 'dòng "Không đạt" của bài chấm dở chưa text-soon');
  });

  check('C26 · "Khác" (T12): nhóm quyền "Chưa xếp nhóm", ô Đề xuất sửa "Thông tin khác"; Lưu trữ rỗng khi tìm: "Không có … khớp"', () => {
    const ad = doc('web/src/modules/platform/AdminPage.tsx');
    assert(!/ten: 'Khác'/.test(ad) && /ten: 'Chưa xếp nhóm'/.test(ad), 'AdminPage');
    const dx = doc('web/src/modules/duyet/DeXuatSuaPanel.tsx');
    assert(/nhan: 'Thông tin khác'/.test(dx) && !/nhan: 'Khác'/.test(dx), 'DeXuatSuaPanel');
    const lt = doc('web/src/modules/students/LuuTruPage.tsx');
    assert(/Không có lớp khớp "\$\{/.test(lt) && /Không có học viên khớp "\$\{/.test(lt), 'LuuTruPage chưa có câu "Không có … khớp"');
    assert(/Chưa có lớp nào kết thúc/.test(lt) && /Chưa có học viên nào được lưu trữ/.test(lt), 'ô tìm trống phải giữ câu cũ');
  });

  console.log('\nPR-HK2 · Task 6b · J8, C33–C37');

  check('J8 · tên lớp / đợt có title; lưới chấm: tên break-words, chip "Đã hoàn tất" xuống dòng DƯỚI tên (không cùng hàng flex)', () => {
    assert(/<span className="min-w-0 truncate" title=\{l\.classCode\}>/.test(doc('web/src/modules/test/TabDiemLop.tsx')), 'TabDiemLop: tên lớp thiếu title');
    assert(/<span className="truncate" title=\{`?[^}]*classCode/.test(doc('web/src/modules/cham/ChamDiemPage.tsx')), 'ChamDiemPage: tiêu đề "lớp · đợt" thiếu title');
    for (const f of ['LuoiFT', 'LuoiThuong', 'MotKyNang']) {
      const m = /<div className="([^"]*)">\s*<Link className="([^"]*)" to=\{.*\} title=\{(?:row\.studentName|ten)\}>/.exec(doc(`web/src/modules/cham/${f}.tsx`));
      assert(m, `${f}: không thấy khối tên em`);
      assert(/break-words/.test(m![2]), `${f}: tên em chưa break-words (${m![2]})`);
      assert(!/(^|\s)flex(\s|$)/.test(m![1]), `${f}: chip còn cùng hàng flex với tên (${m![1]})`);
    }
  });

  check('C33 · LuoiThuong: tên em < 640 px xuống dòng (max-sm:break-words), máy tính giữ truncate + title', () => {
    const m = /<Link className="([^"]*)" to=\{`\/hoc-vien\/\$\{row\.studentId\}`\} title=\{row\.studentName\}>/.exec(doc('web/src/modules/cham/LuoiThuong.tsx'));
    assert(m, 'không thấy Link tên em');
    assert(/max-sm:break-words/.test(m![1]) && /(^|\s)sm:truncate(\s|$)/.test(m![1]) && !/(^|\s)truncate(\s|$)/.test(m![1]), m![1]);
  });

  check('C34 · CapNhatTuan: tên PA < 640 px xuống dòng, hạn + ⚠ xuống dòng dưới; KhungPanel ngCanh max-sm:whitespace-normal, giữ pb-2', () => {
    const s = doc('web/src/modules/cases/CapNhatTuan.tsx');
    const i = s.indexOf('title={tenPa}');
    assert(i >= 0, 'không thấy tên PA');
    const ten = s.slice(s.lastIndexOf('<span', i), i);
    assert(/max-sm:whitespace-normal/.test(ten) && /max-sm:break-words/.test(ten), `tên PA: ${ten}`);
    const ngoai = s.slice(s.lastIndexOf('<span', s.lastIndexOf('<span', i) - 1), s.lastIndexOf('<span', i));
    assert(/max-sm:flex-col/.test(ngoai), `khối ngữ cảnh < 640 px phải xếp cột (hạn xuống dòng dưới): ${ngoai}`);
    const kp = /\{ngCanh && <div className="([^"]*)"/.exec(doc('web/src/ui/KhungPanel.tsx'));
    assert(kp && /max-sm:whitespace-normal/.test(kp[1]) && /(^|\s)pb-2(\s|$)/.test(kp[1]), `KhungPanel ngCanh: ${kp?.[1]}`);
  });

  check('C35 · HangTab: không scrollIntoView (kéo cả <main>); chỉ đặt scrollLeft của hàng tab', () => {
    const s = doc('web/src/ui/HangTab.tsx');
    assert(!/scrollIntoView/.test(s), 'còn scrollIntoView');
    assert(/hang\.scrollLeft\s*=/.test(s) || /\.scrollLeft\s*=/.test(s), 'chưa đặt scrollLeft');
  });

  check('C36 · NutChon: ✓ đè góc (absolute), nút relative, không padding / chừa chỗ theo `chon`; giữ min-w-0 whitespace-normal leading-tight', () => {
    const n = than(doc('web/src/ui/ui.tsx'), 'NutChon');
    assert(/(^|[\s`'"])relative(\s|$)/.test(n.split('{chon &&')[0]), 'nút chưa relative');
    const v = /\{chon && <span([^>]*)>/.exec(n);
    assert(v && /(^|\s)absolute(\s|$)/.test(v[1]) && /-right-1\.5/.test(v[1]) && /-top-1\.5/.test(v[1]), `✓: ${v?.[1]}`);
    assert(!/shrink-0/.test(v![1]), '✓ còn nằm trong luồng chữ (shrink-0)');
    assert(!/\$\{chon \? '[^']*\bp[lrx]-/.test(n) && !/invisible/.test(n), 'chừa chỗ ✓ bằng padding / invisible');
    for (const lop of ['min-w-0', 'whitespace-normal', 'text-center', 'leading-tight']) assert(n.includes(lop), `mất ${lop}`);
  });

  check('C37 · ViecTiep: ≥ 640 px tối đa 2 dòng (sm:line-clamp-2 ở khối ngoài, title câu đủ); quá hạn → "⚠" đứng ĐẦU khối; < 640 px không cắt', () => {
    const v = than(doc('web/src/ui/ViecTiep.tsx'), 'ViecTiep');
    const ngoai = /<span className="([^"]*)" title=\{v\.title\}>/.exec(v);
    assert(ngoai && /(^|\s)sm:line-clamp-2(\s|$)/.test(ngoai[1]) && !/(^|\s)line-clamp-2(\s|$)/.test(ngoai[1]), `khối ngoài: ${ngoai?.[1]}`);
    const qh = v.indexOf('<QuaHan'), viec = v.indexOf('{v.viec}'), han = v.indexOf('{v.han}');
    assert(qh >= 0 && qh < viec, '⚠ quá hạn phải đứng trước chữ việc');
    assert(han > viec, 'hạn thường giữ sau chữ việc');
    assert(!/shrink-0/.test(v), 'cụm hạn còn shrink-0');
  });

  console.log('\nPR-HK2 · Task 7 · K4 "Vắng" một thông báo ngắn, không Hoàn tác (Q4 = B)');

  check('C27 · "Vắng": nút điện thoại, gõ "-" lưới lớp thường, gõ "-" lưới FT cùng MỘT hàm thongBaoVang; không Hoàn tác, không chuỗi "Đã dời ${" riêng', () => {
    const f = doc('web/src/modules/cham/thongBaoVang.ts');
    assert(/export function thongBaoVang\(/.test(f), 'chưa có cham/thongBaoVang.ts export thongBaoVang');
    assert(/Đã ghi vắng \$\{/.test(f) && /· dời \$\{/.test(f), 'chữ phải là "Đã ghi vắng R · Tên" (+ " · dời W3 OCT")');
    assert(/key: `vang:/.test(f), 'toast phải có khoá theo ô (vang:<id>)');
    assert(!/hoanTac|hanhDong|Hoàn tác/.test(f), 'thông báo vắng không có nút');
    const se = doc('web/src/modules/fasttrack/ScoreEntry.tsx');
    assert(!/useToastVang|toastVang|toast\.hoanTac/.test(se), 'ScoreEntry còn toast Hoàn tác / useToastVang cho vắng');
    assert(!/onDau\(true, true\)/.test(se), 'nút Vắng điện thoại không còn đường "im lặng" riêng — đi cùng onDau(true)');
    assert(/noShow === true[\s\S]{0,160}thongBaoVang\(/.test(than(se, 'useSaveScore')), 'FT: save() ghi "-" xong phải gọi thongBaoVang (gõ "-" và nút Vắng cùng đường)');
    const lt = doc('web/src/modules/cham/LuoiThuong.tsx');
    assert(/thongBaoVang\(/.test(lt) && /tuanMoi/.test(lt), 'lưới lớp thường chưa gọi thongBaoVang với r.tuanMoi');
    for (const rel of ['web/src/modules/cham/LuoiThuong.tsx', 'web/src/modules/cham/MotKyNang.tsx', 'web/src/modules/cham/LuoiFT.tsx', 'web/src/modules/fasttrack/ScoreEntry.tsx']) {
      const s = doc(rel);
      assert(!/Đã dời \$\{/.test(s) && !/Đã dời [^'`\r\n]*sang tuần sau/.test(s), `${rel}: còn chuỗi "Đã dời …" riêng`);
      assert(!/Đã ghi vắng/.test(s), `${rel}: chữ "Đã ghi vắng" phải nằm ở một nơi (thongBaoVang.ts)`);
    }
    assert(/Đã gỡ vắng/.test(lt) && /Đã gỡ vắng/.test(se), 'thông báo gỡ vắng (PR-BV) phải giữ');
  });

  console.log('\nPR-HK2 · Task 8 · DH "+n" hồ sơ lớp dẫn đúng chỗ');

  check('C28 · DauTrangLop: bamBadge có thieu-gv (→ phan-cong khi có quyền, không thì null) và thieu-tt (→ /hoc-vien?view=thieu_tt); chang không vào menu "+n"; mục không bấm được là chữ thường', () => {
    const s = doc('web/src/modules/classes/DauTrangLop.tsx');
    const i = s.indexOf('const bamBadge');
    const bam = s.slice(i, s.indexOf('const hoiXk', i));
    assert(/x\.key === 'thieu-gv'[^:]*\(data\.viewer\.canAssign \|\| data\.viewer\.canAssignSubject\)[^:]*onViec\('phan-cong'\)/.test(bam.replace(/\s+/g, ' ')), `thieu-gv chưa dẫn tới phan-cong (có quyền)`);
    assert(/x\.key === 'thieu-tt'[^:]*navigate\(`\/hoc-vien\?view=thieu_tt&classId=\$\{data\.id\}`\)/.test(bam.replace(/\s+/g, ' ')), 'thieu-tt chưa dẫn tới /hoc-vien?view=thieu_tt&classId=');
    const m = s.slice(s.indexOf('<MenuDong kieu="chip"'));
    assert(/'chang'/.test(s.slice(s.indexOf('const b = '), s.indexOf('const bamBadge'))), 'nhãn chặng (chang) phải được lọc khỏi mục "+n"');
    assert(/tieuDe:\s*!bamBadge\(x\)|tieuDe:\s*!bam\b/.test(m.slice(0, 600)), 'mục không bấm được phải là chữ thường (tieuDe), không phải nút');
  });

  console.log('\nPR-HK2 · Task 9 · chân panel theo daSua, Esc hộp tiêu chí, dải mất kết nối');

  check('C29 · ChuyenLopPanel, ClassProgressPanel, CatalogAdmin: không còn nhan: \'Đóng\' ghi cứng — chân truyền daSua (KhungPanel tự chọn Đóng / Huỷ thay đổi)', () => {
    for (const [rel, n] of [['web/src/modules/students/ChuyenLopPanel.tsx', 1], ['web/src/modules/classes/ClassProgressPanel.tsx', 1], ['web/src/modules/platform/CatalogAdmin.tsx', 2]] as const) {
      const s = doc(rel);
      assert(!/nhan: 'Đóng'/.test(s), `${rel}: còn nhan: 'Đóng'`);
      assert((s.match(/chan=\{\{\s*daSua/g) ?? []).length === n, `${rel}: chan phải truyền daSua (${n} chỗ)`);
    }
  });

  check('C30 · CriteriaModal (hộp bốn tiêu chí): đã gõ thì Esc / bấm nền / ✕ hỏi trước khi bỏ; nút "Huỷ thay đổi" ở chân bỏ thẳng', () => {
    const s = doc('web/src/modules/fasttrack/ScoreEntry.tsx');
    const m = s.slice(s.indexOf('export function CriteriaModal'));
    const kp = m.slice(m.indexOf('<KhungPanel'), m.indexOf('<KhungPanel') + 700);
    assert(/const daSua =/.test(m), 'CriteriaModal chưa tách daSua');
    assert(/onDong=\{\(\) => \{ if \(busy\) return; if \(daSua && !window\.confirm\(/.test(kp), `onDong chưa hỏi khi daSua: ${kp}`);
    assert(/chan=\{\{\s*daSua,/.test(kp) && /huy: \{ onClick: onClose,/.test(kp), 'chân phải truyền daSua và Huỷ thay đổi gọi onClose thẳng');
  });

  check('C31 · App: dải Mất kết nối role="status"; "Thử lại" khoá khi đang thử, chữ "Đang thử…"', () => {
    const s = doc('web/src/App.tsx');
    const i = s.indexOf('session.loiKetNoi &&');
    assert(i >= 0, 'không thấy dải mất kết nối');
    const khoi = s.slice(i, s.indexOf('</header>', i));
    const dai = khoi.slice(0, khoi.indexOf('Thử lại') + 20);
    assert(/role="status"/.test(dai) && !/role="alert"/.test(dai), 'dải phải role="status"');
    assert(/disabled=\{dangThu\}/.test(dai) && /Đang thử…/.test(dai), '"Thử lại" phải disabled khi đang thử và đổi chữ "Đang thử…"');
    assert(/const \[dangThu, setDangThu\] = useState\(false\)/.test(s), 'thiếu state dangThu');
  });
}
