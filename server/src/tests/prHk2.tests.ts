/**
 * PHÉP KIỂM PR-HK2 — Badge & chữ (kế hoạch 2026-10-07-pr-hk2-badge-chu). Quét nguồn (bỏ chú thích) như prUxG / prKhung:
 * khoá lớp CSS đúng ở GỐC CHUNG. Đo trên trang thật: `scripts/do-khung.mjs` (chạy tay).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { YThucTestKit } from './yThuc.tests.ts';
import { emailThu } from '../seed/emailThu.ts';

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
      ['web/src/modules/worklist/KhoiCanXuLy.tsx', 1], ['web/src/modules/worklist/BranchPulse.tsx', 1],   // CV-LOI (CV-10): LopToiDay nằm trong thẻ 560 px — bỏ bang-dinh, cuộn trong thẻ
      ['web/src/modules/students/ClassRoster.tsx', 1], ['web/src/modules/classes/BangDiemLopThuong.tsx', 1], ['web/src/modules/classes/TabTongKetLop.tsx', 1],
      ['web/src/modules/test/lichTest/HangLop.tsx', 1], ['web/src/modules/test/lichTest/KhoiNo.tsx', 1],
      ['web/src/modules/cham/LuoiFT.tsx', 1], ['web/src/modules/cham/LuoiThuong.tsx', 1],
      ['web/src/modules/platform/AdminPage.tsx', 1], ['web/src/modules/platform/AccountsAdmin.tsx', 1], ['web/src/modules/platform/CatalogAdmin.tsx', 1],   // OV-6b1: một bảng Chương trình (gộp Lộ trình)
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

  check('C12 · nhãn chuaDu = "Thiếu điểm" (FT và lớp thường); gợi ý FT ghi "gồm SOS tạm (chưa chốt)" (OV-11h PT-9); choDuyet = "Chờ duyệt"', () => {
    for (const ct of ['ft', 'thuong'] as const) {
      const c = d.cotTongHopFor(ct).find((x: any) => x.khoa === 'chuaDu');
      assert(c && c.nhan(ct) === 'Thiếu điểm', `${ct}: nhãn ${c?.nhan(ct)}`);
      assert(!/Chưa đủ điểm|Tạm thời/.test(c.goiY + d.cotTongHopFor(ct)[0].goiY), `${ct}: gợi ý còn chữ cũ`);
    }
    assert(d.cotTongHopFor('ft').find((x: any) => x.khoa === 'chuaDu').goiY.includes('gồm SOS tạm (chưa chốt)'), 'gợi ý FT');
    assert(d.cotTongHopFor('ft').find((x: any) => x.khoa === 'choDuyet').nhan('ft') === 'Chưa chốt PA', 'choDuyet');
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
      assert((kq.tong.choDuyetQuaHan ?? 0) <= (kq.tong.choDuyet ?? 0), `[${ct}] quá hạn > chờ duyệt`);
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

  check('C16a · thanh trên: chữ PISA ở < 640 px (khối "PISA Tracking" ẩn ở sm-); Tìm / Thông báo / Tài khoản không viền, biểu tượng 20, số chuông đè góc', () => {
    const app = doc('web/src/App.tsx');
    assert(/sm:hidden[^>]*>PISA</.test(app), 'App.tsx: thiếu chữ PISA (sm:hidden)');
    assert(/hidden sm:block/.test(app) && /PISA Tracking/.test(app), 'App.tsx: khối tên đầy đủ phải ẩn ở < 640 px');
    assert(/max-sm:h-\[52px\]/.test(app), 'App.tsx: thanh trên điện thoại cao 52 px');
    const hd = doc('web/src/modules/platform/Header.tsx');
    const nut = (moc: string) => { const i = hd.indexOf(moc); assert(i >= 0, `Header.tsx: không thấy ${moc}`); return hd.slice(i, i + 900); };
    for (const moc of ['ref={nutTim}', 'ref={nutThongBao}', 'ref={nutTaiKhoan}']) {
      const n = nut(moc);
      assert(/border-0/.test(n) && /bg-transparent/.test(n), `${moc}: nút điện thoại phải không viền, nền trong`);
      assert(/min-h-\[44px\]/.test(n) && /min-w-\[44px\]/.test(n), `${moc}: nút < 44 px`);
    }
    assert(/width="20" height="20"/.test(nut('ref={nutTim}')) && /sm:hidden" aria-hidden width="20" height="20"/.test(nut('ref={nutThongBao}')), 'biểu tượng Tìm / chuông phải 20 px');
    assert(/max-sm:absolute/.test(nut('{chuong.soNut > 0 &&')), 'số trên chuông phải max-sm:absolute đè góc chuông');   // SL1: số = việc Cần làm còn mở
  });

  /* OV-15a (C11): mọi kích thước — Giao diện nằm trong menu Tài khoản (phép kiểm thanh trên ở prOv15a). */
  check('C17a · Sáng/Tối nằm trong menu Tài khoản, không trên thanh; hàng cao ≥ 44 px', () => {
    const hd = doc('web/src/modules/platform/Header.tsx');
    assert(hd.indexOf('<CongTacGiaoDien') > hd.indexOf('ref={nutTaiKhoan}'), 'Giao diện phải nằm trong menu Tài khoản');
    const cd = doc('web/src/ui/CongTacGiaoDien.tsx');
    assert(/Giao diện/.test(cd) && /'Theo máy'/.test(cd) && /'Sáng'/.test(cd) && /'Tối'/.test(cd) && /min-h-\[44px\]/.test(cd), 'CongTacGiaoDien: hàng "Giao diện" + Theo máy / Sáng / Tối cao ≥ 44 px');
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
    assert(/placeholder=\{t\('Lọc trong danh sách này…'\)\}/.test(s) && !/Tìm tên, mã học viên hoặc mã lớp/.test(s), 'placeholder ô tìm');
    assert(/className="btn btn-sm max-sm:hidden"[^]*?>\{t\('\+ Lớp mới'\)\}</.test(s) && /className="btn btn-sm btn-primary max-sm:hidden"[^]*?>\{t\('\+ Học viên'\)\}</.test(s), 'hai nút ngoài phải max-sm:hidden');
    const mn = s.slice(s.indexOf("<MenuDong nhan={t('Thao tác trang')}"), s.indexOf("<MenuDong nhan={t('Thao tác trang')}") + 900);
    assert(/dienThoai && data\?\.coTheTaoLop/.test(mn) && /nhan: t\('\+ Lớp mới'\)/.test(mn), 'mục "+ Lớp mới" trong menu chỉ khi dienThoai');
    assert(/dienThoai && data\?\.coTheThemHocVien/.test(mn) && /nhan: t\('\+ Học viên'\)/.test(mn), 'mục "+ Học viên" trong menu chỉ khi dienThoai');   // OV-11g HL-14: cờ trang
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

  /* OV-4b (mockup overhaul-1 §3): ô có điểm ghi band ("5.0"; L/R "14 · 4.5"), bỏ chữ "sửa". */
  check('C23 · J9 (OV-15b: ô cần nhập = khung rỗng, "Nhập" chỉ cho trình đọc màn hình); ô có điểm ghi band; đầu cột S ghi "GV chấm: tên thật" + title có tên', () => {
    const s = doc('web/src/modules/fasttrack/HopNhapDiem.tsx');
    /* OV-11a: chữ ô dựng ở `hienO` (chữ + câu đọc màn hình + kiểu ô). OV-15b (mockup 2 khung 1b): ô trống là khung rỗng. */
    assert(/return \{ chu: null, doc: t\('Nhập'\), kieu: 'trong' \};/.test(s), 'ô trống: khung rỗng + câu đọc "Nhập"');
    assert(/if \(c\.band !== null\) return \{ chu: fmtBand\(c\.band\),/.test(s), 'ô có điểm phải ghi band');
    assert(/<NutGvCham nhan=\{t\('GV chấm S'\)\} value=/.test(doc('web/src/modules/cham/LuoiFT.tsx')) && /<NutGvCham hang nhan=\{t\('GV chấm S'\)\} value=/.test(doc('web/src/modules/cham/MotKyNang.tsx')), 'đầu cột S dùng NutGvCham (luôn ghi "GV chấm: tên thật")');
    assert(/title=\{t\('GV chấm Speaking: \{x\} — \{goiY\}', \{ x: ten/.test(doc('web/src/modules/cham/GvCham.tsx')), 'GvCham: title phải ghi tên (phòng khi tên dài)');
  });

  check('C24 · OV-13f (Q8, thay J2): không màn nào in mã học viên (giữ ở DB, nhật ký, đường dẫn, tìm kiếm); Excel không cột Mã', () => {
    const CAC_FILE = ['web/src/modules/students/StudentDetailPage.tsx', 'web/src/modules/cham/LuoiFT.tsx', 'web/src/modules/cham/LuoiThuong.tsx', 'web/src/modules/cham/MotKyNang.tsx',
      'web/src/modules/cham/DiemTheoLop.tsx', 'web/src/modules/students/LuuTruPage.tsx', 'web/src/modules/classes/TransitionPanel.tsx', 'web/src/modules/platform/Header.tsx',
      'web/src/modules/students/ClassRoster.tsx', 'web/src/modules/students/BangHocVienLop.tsx', 'web/src/modules/classes/BangDiemLopThuong.tsx',
      'web/src/modules/cases/QuickReport.tsx', 'web/src/modules/fasttrack/MockDetailPage.tsx', 'web/src/modules/students/XoaHocVienPanel.tsx'];
    for (const f of CAC_FILE) {
      const sai = doc(f).split('\n').map((dong, i) => [dong, i + 1] as const).filter(([dong]) => /\.studentCode\b|student\.code\b|maHocVienNgan|\bd\.ma\b/.test(dong));
      assert(sai.length === 0, `${f}: còn in mã học viên ở dòng ${sai.map((x) => x[1]).join(', ')}`);
    }
    assert(!d.COT_FT_GON.includes('Mã') && d.COT_FT_GON[1] === 'Email', 'Excel: không cột Mã, cột 2 Email');
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
    const chuaXong = /Chờ \{n\} môn[^]*?<\/>/.exec(doc('web/src/modules/students/StudentDetailPage.tsx'))?.[0] ?? '';
    assert(/text-soon/.test(chuaXong) && !/text-slate-400/.test(chuaXong), 'dòng "Không đạt" của bài chấm dở chưa text-soon');
  });

  check('C26 · "Khác" (T12): nhóm quyền "Chưa xếp nhóm", ô Đề xuất sửa "Thông tin khác"; Lưu trữ rỗng khi tìm: "Không có … khớp"', () => {
    const ad = doc('web/src/modules/platform/AdminPage.tsx');
    assert(!/ten: 'Khác'/.test(ad) && /ten: 'Chưa xếp nhóm'/.test(ad), 'AdminPage');
    const dx = doc('web/src/modules/duyet/DeXuatSuaPanel.tsx');
    assert(/nhan: t\('Thông tin khác'\)/.test(dx) && !/nhan: (?:t\()?'Khác'/.test(dx), 'DeXuatSuaPanel');
    const lt = doc('web/src/modules/students/LuuTruPage.tsx');
    assert(/Không có lớp khớp "\$\{/.test(lt) && /Không có học viên khớp "\$\{/.test(lt), 'LuuTruPage chưa có câu "Không có … khớp"');
    assert(/Chưa có lớp nào kết thúc/.test(lt) && /Chưa có học viên nào được lưu trữ/.test(lt), 'ô tìm trống phải giữ câu cũ');
  });

  console.log('\nPR-HK2 · Task 6b · J8, C33–C37');

  check('J8 · tên lớp / đợt có title; lưới chấm: tên break-words, chip "Đã hoàn tất" xuống dòng DƯỚI tên (không cùng hàng flex)', () => {
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
    /* OV-12e (mockup panel v3 §5): tên PA ở dòng 2 đầu panel (`dauViec` ngữ cảnh), hạn là chip ở dòng 1 — dòng 2 xuống dòng tự nhiên (flex-wrap, không cắt). */
    /* CV-LOI (CV-14): chip hạn là hạn Mini Test khi PA còn chờ Mini Test, không thì hạn cập nhật PA. */
    assert(/dau=\{dauViec\(\{[\s\S]{0,240}ChipHan loai="cap-nhat-pa"[\s\S]{0,120}ngCanh: ngCanh \?\? tenPa/.test(s), 'không thấy tên PA ở đầu panel v3');
    const kpDau = doc('web/src/ui/KhungPanel.tsx');
    assert(/<p className="m-0 flex flex-wrap items-baseline/.test(kpDau) && !/dau\.dong2[\s\S]{0,200}truncate/.test(kpDau), 'dòng 2 đầu panel v3 phải xuống dòng, không cắt');
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
    const qh = v.indexOf('<QuaHan'), viec = v.indexOf('{giuMaTuan(v.viec)}'), han = v.indexOf('{v.han}');   // OV-11g CA2-8: mã tuần không ngắt
    assert(qh >= 0 && qh < viec, '⚠ quá hạn phải đứng trước chữ việc');
    assert(han > viec, 'hạn thường giữ sau chữ việc');
    assert(!/shrink-0/.test(v), 'cụm hạn còn shrink-0');
  });

  console.log('\nPR-HK2 · Task 7 · K4 "Vắng" một thông báo ngắn, không Hoàn tác (Q4 = B)');

  check('C27 · "Vắng": nút điện thoại, gõ "-" lưới lớp thường, gõ "-" lưới FT cùng MỘT hàm thongBaoVang; không Hoàn tác, không chuỗi "Đã dời ${" riêng', () => {
    const f = doc('web/src/modules/cham/thongBaoVang.ts');
    assert(/export function thongBaoVang\(/.test(f), 'chưa có cham/thongBaoVang.ts export thongBaoVang');
    /* OV-11a (CA3-1): câu dựng ở hàm thuần `cauDaGhiVang` (shared/domain/vang.ts, phép kiểm hành vi OV11a-5). */
    const vg = doc('shared/domain/vang.ts');
    assert(/cauDaGhiVang\(/.test(f) && /Đã ghi vắng (?:\$\{|\{)/.test(vg) && /· dời (?:\$\{|\{)/.test(vg), 'chữ phải là "Đã ghi vắng R · Tên" (+ " · dời W3 OCT")');
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
    assert(/Đã bỏ vắng/.test(lt) && /Đã bỏ vắng/.test(se), 'thông báo bỏ vắng (PR-BV, OV-1b đổi tên "Bỏ vắng") phải giữ');
    assert(/thongBaoVang\([^)]*tenMonNgan\(/.test(lt) && /thongBaoVang\([^)]*ENTRY_SKILL_SHORT\[/.test(se), 'mockup mục 6: thông báo ghi mã môn ngắn (R, W2), không tên đầy đủ');
    assert(!/Đã bỏ vắng \$\{(tenO|skillLabel)\(/.test(lt + se), 'thông báo bỏ vắng cũng ghi mã môn ngắn');
  });

  check('C41 · điện thoại: dòng "Còn n ngày để sửa" dưới ô "-" (DongDau) xuống dòng, không cắt "…" (máy tính giữ truncate + title)', () => {
    const se2 = doc('web/src/modules/fasttrack/HopNhapDiem.tsx'), i = se2.indexOf('function DongDau(');
    assert(i >= 0, 'không thấy DongDau');
    const dd = se2.slice(i, i + 700);   // thân hàm ngắn; không dò dấu } vì tệp có thể CRLF
    /* OV-11a (CA3-2): DongDau không cắt ở MỌI cỡ màn (bỏ `max-w-[6rem] truncate` máy tính), câu đầy đủ vẫn ở title. */
    assert(!/truncate|max-w-\[6rem\]/.test(dd) && /title=\{(?:dich\()?cell\.noShow\.text\)?\}/.test(dd), 'DongDau: không được cắt chữ, phải có title');
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

  /* PR-OV3a: ClassProgressPanel thành một phần của panel Thông tin lớp (nút Huỷ / Lưu riêng của phần) — không còn chân KhungPanel. */
  check('C29 · ChuyenLopPanel, CatalogAdmin: không còn nhan: \'Đóng\' ghi cứng — chân truyền daSua (KhungPanel tự chọn Đóng / Huỷ thay đổi)', () => {
    for (const [rel, n] of [['web/src/modules/students/ChuyenLopPanel.tsx', 2], ['web/src/modules/platform/CatalogAdmin.tsx', 1]] as const) {   // OV-6b1: một panel sửa chung
      const s = doc(rel);
      assert(!/nhan: 'Đóng'/.test(s), `${rel}: còn nhan: 'Đóng'`);
      assert((s.match(/chan=\{\{\s*daSua/g) ?? []).length === n, `${rel}: chan phải truyền daSua (${n} chỗ)`);
    }
  });

  /* OV-4b: hộp nhập điểm thay CriteriaModal — cùng luật không mất chữ đang gõ. */
  check('C30 · Hộp nhập điểm (thay CriteriaModal): đã gõ thì Esc hỏi trước khi bỏ; bấm ra ngoài giữ hộp', () => {
    const s = doc('web/src/modules/fasttrack/HopNhapDiem.tsx');
    /* OV-11a (CA3-8): hỏi ngay chân hộp (`KhungHop`: câu `cauBo` + Bỏ · Gõ tiếp), không còn hộp trình duyệt. */
    assert(!/window\.confirm/.test(s) && /else if \(moi\.current\.daGo\) setHoi\(true\);/.test(s) && /cauBo=\{t\('Bỏ điểm \{skillLabel\} · \{tenHv\}\?', \{ skillLabel: skillLabel\(cell\.skill\), tenHv: ctx\.tenHv \}\)\}/.test(s),
      'Esc khi đã gõ phải hỏi ở chân hộp');
    assert(/if \(!moi\.current\.daGo\) moi\.current\.onDong\(\);/.test(s), 'bấm ra ngoài khi đã gõ phải giữ hộp');
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

  console.log('\nPR-HK2 · Task 10 · tuần học khi không có lộ trình đang chạy');

  const intake: any = await import('../classes/intake.ts');
  const hanhTrinh: any = await import('../students/hanhTrinh.ts');
  const profileSvc: any = await import('../students/profile.ts');
  const transitionSvc: any = await import('../classes/transition.ts');
  check('C32 · em FT ghi danh active + lộ trình completed (không có active): Hành trình, đầu hồ sơ, Chuyển lớp cùng KHÔNG ghi "tuần học n"; chương đã rời giữ cách tính cũ', () => {
    const { conn, P, TODAY, classId } = t;
    const get = (sql: string, ...a: unknown[]) => conn.prepare(sql).get(...a) as any;
    const lop = classId('MB FT 101');
    const ten = 'HK2 HV C32';
    intake.commitIntake(P.admin, { classId: lop, rows: [{ fullName: ten, target: 6.5, email: emailThu(), dob: '2010-01-01' }], idempotencyKey: 'hk2-c32' });
    const sid = get('SELECT id FROM students WHERE full_name = ?', ten).id as number;
    conn.prepare(`UPDATE learning_cycles SET status = 'completed', ended_at = ? WHERE student_id = ? AND status = 'active'`).run(TODAY, sid);
    assert(!get(`SELECT 1 AS x FROM learning_cycles WHERE student_id = ? AND status = 'active'`, sid), 'dựng sai: còn lộ trình active');
    const chuongDangHoc = () => hanhTrinh.hanhTrinhHocVien(P.mbManager, sid, null).chuong.find((c: any) => c.classId === lop && c.dangHoc);
    const ct = chuongDangHoc();
    assert(ct, 'chương đang học phải có');
    assert(ct.tuanHoc == null, `Hành trình còn ghi tuần học: ${JSON.stringify(ct.tuanHoc)}`);
    const th = profileSvc.studentProfile(P.mbManager, sid).dauHoSo.thongTin;
    assert(th.tuanHoc == null, `đầu hồ sơ còn ghi tuần học: ${JSON.stringify(th.tuanHoc)}`);
    const ca = transitionSvc.transitionPlan(P.mbManager, lop).students.find((s: any) => s.id === sid);
    assert(!ca || ca.tuanHoc == null, `Chuyển lớp còn ghi tuần học: ${JSON.stringify(ca?.tuanHoc)}`);
    /* Chương đã rời: cách tính cũ (lộ trình gần nhất) vẫn cho tuần học. */
    conn.prepare(`UPDATE enrollments SET status = 'completed', ended_at = ? WHERE student_id = ? AND class_id = ?`).run(TODAY, sid, lop);
    const roi = hanhTrinh.hanhTrinhHocVien(P.mbManager, sid, null).chuong.find((c: any) => c.classId === lop);
    assert(roi && !roi.dangHoc && roi.tuanHoc != null, `chương đã rời mất tuần học: ${JSON.stringify(roi?.tuanHoc)}`);
  });

  console.log('\nPR-HK2 · Task 12 · đổi tên Giữa khoá / Cuối khoá → Progress Test / Final Test');

  const xm: any = await import('../phanTich/xuatMt.ts');
  const { caseTitleOf } = await import('../cases/cases.ts');
  /* Chữ cũ, mọi biến thể dấu (khoá/khóa). Chỉ tìm trong chữ hiện ra — bỏ chú thích. */
  const CHU_CU = /(giữa|cuối)\s+kh[oóô]?[aáàảãạ]/i;
  const nguonTs = (dir: string): string[] => fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? (e.name === 'tests' || e.name === 'node_modules' ? [] : nguonTs(`${dir}/${e.name}`)) : /\.tsx?$/.test(e.name) ? [`${dir}/${e.name}`] : []);
  const dongCu = (dirs: string[], choPhep: readonly string[]) => {
    const sai: string[] = [];
    for (const dir of dirs) for (const f of nguonTs(dir)) {
      doc(f).split('\n').forEach((dong, i) => {
        const dg = dong.normalize('NFC');
        if (CHU_CU.test(dg) && !choPhep.some((c) => dg.includes(c))) sai.push(`${f}:${i + 1}: ${dg.trim().slice(0, 100)}`);
      });
    }
    return sai;
  };

  check('C38 · ATTEMPT_KIND_LABEL / SHORT = Progress Test / Final Test; web/src (chữ hiện ra) không còn Giữa khoá / Cuối khoá', () => {
    assert(d.ATTEMPT_KIND_LABEL.progress === 'Progress Test' && d.ATTEMPT_KIND_LABEL.final === 'Final Test', JSON.stringify(d.ATTEMPT_KIND_LABEL));
    assert(d.ATTEMPT_KIND_SHORT.progress === 'Progress Test' && d.ATTEMPT_KIND_SHORT.final === 'Final Test', JSON.stringify(d.ATTEMPT_KIND_SHORT));
    assert(d.ATTEMPT_KIND_LABEL.mock === 'Mock Test' && d.ATTEMPT_KIND_SHORT.mock === 'MT' && d.ATTEMPT_KIND_SHORT.mt0 === 'MT0', 'mock / mt0 giữ nguyên');
    const CHO_PHEP_WEB: readonly string[] = ['đến Cuối khoá'];   // mốc PA bổ trợ (PR-TEN): chữ thời điểm khoá, không phải tên bài
    const sai = dongCu(['web/src'], CHO_PHEP_WEB);
    assert(sai.length === 0, `${sai.length} chỗ web còn chữ cũ:\n${sai.slice(0, 40).join('\n')}`);
  });

  const luotThuong = (kind: 'progress' | 'final') => ({
    cheDo: 'ratio', attemptNo: 1, kind, overall: null, sosLevel: 1, soCoDiem: 4, soYeuCau: 4, soDat: 3,
    khongChiaMon: false, tyLe: kind === 'final' ? 0.66 : null, goiY: null, maLop: null, kyNangChuaDat: [],
  });

  check('C39 · chữ sinh MỚI dùng tên mới: tên Case, tên bài, nhóm Phân tích, ghim Hành trình, đợt Excel, câu lỗi bộ lọc, Kết luận khoá', () => {
    const tc = d.tenCaseThuong({ dot: 'progress', giua: 'G+V không đạt' });
    assert(tc === '[Progress Test] G+V không đạt', tc);
    assert(d.tenCaseThuong({ dot: 'final', giua: 'P không đạt' }) === '[Final Test] P không đạt', 'tên Case Final Test');
    assert(d.tenBaiThuong([{ kind: 'progress', attemptNo: 1 }], { kind: 'progress', attemptNo: 1 }) === 'Progress Test', 'tên bài Progress Test');
    assert(d.tenBaiThuong([{ kind: 'final', attemptNo: 1 }, { kind: 'final', attemptNo: 2 }], { kind: 'final', attemptNo: 2 }) === 'Final Test 2', 'tên bài Final Test 2');
    assert(d.NHAN_NHOM_CON.giua === 'Progress Test (theo môn)' && d.NHAN_NHOM_CON.cuoi === 'Final Test (% tổng)', JSON.stringify(d.NHAN_NHOM_CON));
    assert(d.nhanKhoaDot('giua') === 'Progress Test' && d.nhanKhoaDot('cuoi') === 'Final Test', 'nhãn đợt');
    assert(d.tenSheetThuong('FOU') === 'FOU · Progress–Final Test', d.tenSheetThuong('FOU'));
    const pg = d.nhanGhim(luotThuong('progress')), fg = d.nhanGhim(luotThuong('final'));
    assert(pg.day.startsWith('Progress Test') && fg.day.startsWith('Final Test') && fg.chu.startsWith('Final') && pg.hai[0] === 'Progress' && fg.hai[0] === 'Final', JSON.stringify([pg, fg]));
    const sai = d.docBoLocXuatMt({ khung: 'thuong', tg: 'dot', dot: 'mt:1' });
    assert(typeof sai === 'string' && /Progress Test và Final Test/.test(sai) && !CHU_CU.test(sai), String(sai));
    const kl = d.chuHopKetLuan({ ct: 'FOU', tyLe: 0.66, scored: 4, required: 4, mon: [], goiY: { dai: 'dat', nhan: 'Pass', nhanNgan: 'Pass' } as any, quyetDinh: null, ketLuanFt: null });
    assert(kl.chinh === 'Final Test 66%', kl.chinh);
    assert(d.chuHopKetLuan({ ct: 'FOU', tyLe: null, scored: 2, required: 4, mon: [], goiY: null, quyetDinh: null, ketLuanFt: null }).chinh === 'Final Test · 2/4 môn có điểm', 'thiếu môn');
  });

  check('C39 · Excel xuất lớp thường (DB): sheet, cột Bài, tên tệp dùng Progress Test / Final Test', () => {
    const f = d.docBoLocXuatMt({ khung: 'thuong', tg: 'dot', dot: 'giua,cuoi', cot: 'day-du' });
    assert(typeof f !== 'string', String(f));
    const r = xm.duLieuXuatMt(P.normalCoreTeacher, f);
    const ten = r.sheets.map((s: any) => s.ten) as string[];
    assert(ten.includes('FOU · Progress–Final Test'), ten.join('|'));
    const dong = r.sheets.find((s: any) => s.ten === 'FOU · Progress–Final Test').aoa.slice(1);
    assert(dong.length > 0 && dong.every((x: any) => x[4] === 'Progress Test' || x[4] === 'Final Test'), 'cột Bài');
    assert(/Progress-Test-Final-Test\.xlsx$/.test(r.tenTep), r.tenTep);
    assert(!CHU_CU.test(JSON.stringify(r.sheets)), 'còn chữ cũ trong ô Excel');
  });

  check('C39 · shared + server/src (chữ hiện ra, trừ tests) không còn Giữa khoá / Cuối khoá', () => {
    const CHO_PHEP_MAY: readonly string[] = ['đến Cuối khoá'];   // như trên (PR-TEN)
    const sai = dongCu(['shared', 'server/src'], CHO_PHEP_MAY);
    assert(sai.length === 0, `${sai.length} chỗ còn chữ cũ:\n${sai.slice(0, 80).join('\n')}`);
  });

  check('C40 · dữ liệu không đổi: kind progress / final, khoá hành động nhật ký; tên Case cũ đọc nguyên chữ; không mã nào tách tên Case theo tiền tố', () => {
    const { conn } = t;
    assert(d.ATTEMPT_KINDS.join() === 'mock,progress,final,mt0,checkpoint', d.ATTEMPT_KINDS.join());   // OV-6b2: thêm Checkpoint (lớp liên tục), kind cũ giữ nguyên
    const kinds = (conn.prepare(`SELECT DISTINCT kind FROM assessment_attempts`).all() as any[]).map((r) => r.kind as string);
    assert(kinds.includes('progress') && kinds.includes('final') && kinds.every((k) => d.ATTEMPT_KINDS.includes(k)), kinds.join());
    assert(d.nhanHanhDongNhatKy('case.auto_from_giua_khoa') === 'Tạo Case từ Progress Test', d.nhanHanhDongNhatKy('case.auto_from_giua_khoa'));
    /* Tên đã lưu bằng tiền tố cũ (Case tạo tay có tên riêng) giữ nguyên chữ. */
    const cu = '[Giữa khoá] G+V không đạt';
    assert(caseTitleOf({ id: 0, origin_kind: 'manual', title: cu }) === cu, 'tên cũ bị đổi');
    /* Tên Case lớp thường suy lúc đọc, không ghi DB; không mã nào tách nó theo tiền tố (cũ hay mới). */
    const tachTienTo = [...nguonTs('web/src'), ...nguonTs('shared'), ...nguonTs('server/src')]
      .filter((f) => /startsWith\(\s*['"`]\[(Giữa|Cuối|Progress|Final)|\^\\\[(Giữa|Cuối|Progress|Final)|\\\[\((Giữa|Cuối|Progress|Final)/.test(doc(f).normalize('NFC')));
    assert(tachTienTo.length === 0, `đọc tên Case theo tiền tố: ${tachTienTo.join(', ')}`);
  });

  check('C41 · audit: không còn chữ ghép hỏng "Testng" (đổi tên làm hỏng "khoảng"); HangTab đo bằng getBoundingClientRect; "⚠n" của Chờ nguyên nhân có chữ cho trình đọc màn hình', () => {
    const hong = [...nguonTs('web/src'), ...nguonTs('shared'), ...nguonTs('server/src')].filter((f) => /(Final|Progress) Testng/.test(fs.readFileSync(path.join(ROOT, f), 'utf8')));
    assert(hong.length === 0, `chữ ghép hỏng: ${hong.join(', ')}`);
    const tab = doc('web/src/ui/HangTab.tsx');
    assert(/getBoundingClientRect/.test(tab) && !/offsetLeft/.test(tab), 'HangTab phải đo theo getBoundingClientRect');
    const th = doc('web/src/modules/phanTich/TongHopTestSos.tsx');
    assert(/⚠\{quaHan\}<span className="sr-only">/.test(th), '⚠n thiếu chữ sr-only');
  });

  console.log('\nPR-HK2 · rà độc lập (#235) · I1, I2, I3, J9, mục 7');
  const cssRaw = fs.readFileSync(path.join(ROOT, 'web/src/index.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');

  check('C42 · I1: .table-scroll là `position: relative` — chữ sr-only (absolute) trong bảng cuộn không thoát ra làm <main> trượt ngang', () => {
    const m = /\.table-scroll\s*\{([^}]*)\}/.exec(cssRaw);
    assert(m, 'không thấy .table-scroll');
    assert(/position:\s*relative/.test(m![1]), `.table-scroll thiếu position: relative: ${m![1].trim()}`);
  });

  check('C43 · I2: bảng Tổng hợp và lưới Điểm theo lớp (rộng hơn khung ở 1280) chỉ dính đầu từ 1440 px (bang-dinh-1440: 1280–1439 giữ khung cuộn riêng); các bảng khác giữ ngưỡng chung 1280', () => {
    const ngoai = /@media \(min-width:\s*1280px\) and \(max-width:\s*1439(?:\.98)?px\)\s*\{([^@]*?\})\s*\}/.exec(cssRaw);
    assert(ngoai, 'thiếu khối @media 1280–1439 cho .bang-dinh-1440');
    assert(/\.bang-dinh\.bang-dinh-1440\s*\{[^}]*overflow-x:\s*auto[^}]*overflow-y:\s*hidden/.test(ngoai![1]), '.bang-dinh.bang-dinh-1440 ở 1280–1439 phải là khung cuộn (overflow-x auto, overflow-y hidden)');
    assert(/@media \(min-width:\s*1280px\)\s*\{\s*\.bang-dinh\s*\{/.test(cssRaw), 'ngưỡng chung của .bang-dinh phải còn 1280');
    const th = doc('web/src/modules/phanTich/TongHopTestSos.tsx');
    assert(/className="table-scroll bang-dinh bang-dinh-1440"/.test(th), 'bảng Tổng hợp chưa gắn bang-dinh-1440');
    assert(/gon \? 'table-scroll bang-dinh bang-dinh-1440' : 'overflow-x-auto'/.test(doc('web/src/modules/cham/LuoiFT.tsx')), 'lưới Điểm theo lớp (gọn 1108 px, khung 950 px ở 1280) chưa gắn bang-dinh-1440');
    const khac = tsx('web/src').filter((f) => !['web/src/modules/phanTich/TongHopTestSos.tsx', 'web/src/modules/cham/LuoiFT.tsx'].includes(f) && /bang-dinh-1440/.test(doc(f)));
    assert(khac.length === 0, `bang-dinh-1440 chỉ cho bảng rộng hơn khung ở 1280 (Tổng hợp, lưới Điểm theo lớp): ${khac.join(', ')}`);
  });

  check('C44 · I3: Hành trình điện thoại (xem gọn) lớp thường — cột tuần ≥ 56 px để ghim "Progress" (46,6 px chữ + viền + lề) không bị cắt; FT giữ 40 px; rongCotTuan khớp', () => {
    const px = (s: string) => Number(/^(\d+)px$/.exec(s)?.[1] ?? NaN);
    const thuong = d.boCucHanhTrinh({ rong: 375, soTuan: 13, xemGon: true, rongChuoi: 100, cheDo: 'ratio' });
    const ft = d.boCucHanhTrinh({ rong: 375, soTuan: 13, xemGon: true, rongChuoi: 100, cheDo: 'ielts' });
    assert(px(thuong.cotTuan) >= 56, `lớp thường gọn: cột tuần ${thuong.cotTuan}`);
    assert(ft.cotTuan === '40px', `FT gọn phải giữ 40px: ${ft.cotTuan}`);
    assert(d.rongCotTuan(thuong, 375, 13) === px(thuong.cotTuan), `rongCotTuan lớp thường: ${d.rongCotTuan(thuong, 375, 13)}`);
    assert(d.rongCotTuan(ft, 375, 13) === 40, 'rongCotTuan FT');
  });

  check('C45 · J9: nút GV chấm luôn ghi "GV chấm: {tên thật}" (Tôi → tên tài khoản), xuống dòng không cắt; đầu cột S lưới FT, màn từng kỹ năng, hồ sơ Mock cùng một nút', () => {
    const g = doc('web/src/modules/cham/GvCham.tsx');
    const nut = than(g, 'NutGvCham');
    assert(!/chiTen/.test(nut), 'NutGvCham còn chế độ chiTen (chỉ tên, không chữ "GV chấm:")');
    assert(/session\?\.user\?\.fullName/.test(nut) && /kieu === 'toi'/.test(nut), '"Tôi" phải đổi thành tên tài khoản');
    assert(/nhan = t\('GV chấm'\)/.test(nut) && /\{`\$\{nhan\}: `\}/.test(nut) && /title=\{t\('GV chấm Speaking: \{x\}/.test(nut), 'nút phải ghi "GV chấm: tên" và title có tên');
    const nhan = /<span className="([^"]*)">\{`\$\{nhan\}: `\}/.exec(nut)?.[1];
    assert(nhan !== undefined && !/truncate/.test(nhan) && /break-words/.test(nhan), `nhãn tên không được cắt: ${nhan}`);
    for (const f of ['web/src/modules/cham/LuoiFT.tsx', 'web/src/modules/cham/MotKyNang.tsx'])
      assert(!/chiTen/.test(doc(f)) && /<NutGvCham /.test(doc(f)), `${f}: còn chiTen hoặc thiếu NutGvCham`);
    assert(/<NutGvCham value=/.test(doc('web/src/modules/fasttrack/MockDetailPage.tsx')), 'hồ sơ Mock dùng chung NutGvCham');
  });

  check('C46 · mục 7: DEMO.md không còn Giữa khoá / Cuối khoá; tên tệp Excel PISA-Tracking_… (không Pisa-Tracking_) ở shared/server/web', () => {
    const demo = fs.readFileSync(path.join(ROOT, 'DEMO.md'), 'utf8');
    const sai = demo.split('\n').map((s, i) => [i + 1, s] as const).filter(([, s]) => CHU_CU.test(s)).map(([i, s]) => `DEMO.md:${i} ${s.slice(0, 70)}`);
    assert(sai.length === 0, `DEMO.md còn chữ cũ:\n${sai.join('\n')}`);
    const f = d.tenTepXuatMt({ khung: 'ft', chiNhanhTen: [], lopMa: [], thoiGian: { kieu: 'dot', dot: ['mt:1'] } });
    assert(f.startsWith('PISA-Tracking_'), f);
    const cu = [...nguonTs('web/src'), ...nguonTs('shared'), ...nguonTs('server/src')].filter((x) => /Pisa-Tracking_/.test(fs.readFileSync(path.join(ROOT, x), 'utf8')));
    assert(cu.length === 0, `còn Pisa-Tracking_ ở: ${cu.join(', ')}`);
  });
}
