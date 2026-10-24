/**
 * PHÉP KIỂM BANG-0 — một `Bang` + 13 kiểu cột, `ODiem` (04 mục 6, 7, 19 hàng 1–5).
 * Phần hành vi: luật thuần `shared/domain/bang.ts` (căn, rộng px, một cột linh hoạt, nhóm 2 tầng, thẻ 375).
 * Phần tĩnh BANG-1…5: quét `web/src` (danh sách miễn = bảng chưa chuyển — CHỈ ĐƯỢC GIẢM; BANG-1 và PR màn gỡ dần).
 * Kế hoạch: docs/superpowers/plans/2026-10-21-pr-bang-0.md.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { YThucTestKit } from './yThuc.tests.ts';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..');
const boChuThich = (src: string) => src.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, '')).replace(/(^|[^:\\])\/\/.*$/gm, '$1');
const taiTsx = (dir: string, out: string[] = []): string[] => {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) taiTsx(p, out); else if (e.name.endsWith('.tsx')) out.push(p);
  }
  return out;
};

/** BANG-3: tệp còn tự viết `<table>` (chưa vào `Bang`). Chỉ được GIẢM. */
const MIEN_TABLE: string[] = [
  'web/src/modules/cases/SkillBoard.tsx',
  'web/src/modules/cham/DanExcel.tsx',
  'web/src/modules/classes/BangDiemLopThuong.tsx',
  'web/src/modules/classes/BangKqdrLopFt.tsx',
  'web/src/modules/classes/BangLoTrinhTiep.tsx',
  'web/src/modules/classes/ClassIssueBoard.tsx',
  'web/src/modules/classes/PhanTichLopTab.tsx',
  'web/src/modules/classes/TabTongKetLop.tsx',
  'web/src/modules/dev/SanMauNen.tsx',
  'web/src/modules/dev/ThanhPhanDemo.tsx',
  'web/src/modules/giaoVien/BangGiaoVienChiNhanh.tsx',
  'web/src/modules/phanTich/HieuQuaPa.tsx',
  'web/src/modules/phanTich/KetQuaThi.tsx',
  'web/src/modules/phanTich/PhanTichGiaoVien.tsx',
  'web/src/modules/phanTich/TongHopTestSos.tsx',
  'web/src/modules/phanTich/YThucPhoiHop.tsx',
  'web/src/modules/platform/AccountsAdmin.tsx',
  'web/src/modules/platform/AdminPage.tsx',
  'web/src/modules/platform/CatalogAdmin.tsx',
  'web/src/modules/platform/XoaTaiKhoanPanel.tsx',
  'web/src/modules/students/BangCanLam.tsx',
  'web/src/modules/students/BangSos.tsx',
  'web/src/modules/students/CacLoTrinh.tsx',
  'web/src/modules/students/HocVienTheoVai.tsx',
  'web/src/modules/students/IntakePanel.tsx',
  'web/src/modules/students/NganTongKet.tsx',
  'web/src/modules/students/StudentDetailPage.tsx',
  'web/src/modules/students/StudentPlanPanel.tsx',
  'web/src/modules/students/SuaCaLopPanel.tsx',
  'web/src/modules/students/XoaHocVienPanel.tsx',
  'web/src/modules/test/keHoach/LopKeHoach.tsx',
  'web/src/modules/test/keHoach/LuoiKeHoach.tsx',
  'web/src/modules/test/keHoach/NganXepHangLoat.tsx',
  'web/src/modules/test/keHoach/NganXepLichMt.tsx',
  'web/src/modules/test/keHoach/NganXuatKeHoach.tsx',
  'web/src/modules/test/keHoach/XepTheoHocVien.tsx',
  'web/src/modules/test/lichTest/HangLop.tsx',
  'web/src/modules/test/lichTest/KhoiNo.tsx',
  'web/src/modules/tutor/PanelTutor.tsx',
  'web/src/modules/tutor/TaiDanhSach.tsx',
  'web/src/modules/tutor/TutorPage.tsx',
  'web/src/modules/worklist/LopToiDay.tsx',
  'web/src/modules/worklist/MeetingPage.tsx',
  'web/src/modules/worklist/MgmtTasksPage.tsx',
];
/** BANG-2: tệp còn lớp căn (`text-left|center|right`) trên `<td>` / `<th>`. Chỉ được GIẢM. */
const MIEN_CAN: string[] = [
  'web/src/modules/cases/SkillBoard.tsx',
  'web/src/modules/classes/BangDiemLopThuong.tsx',
  'web/src/modules/classes/ClassIssueBoard.tsx',
  'web/src/modules/classes/PhanTichLopTab.tsx',
  'web/src/modules/classes/TabTongKetLop.tsx',
  'web/src/modules/dev/ThanhPhanDemo.tsx',
  'web/src/modules/giaoVien/BangGiaoVienChiNhanh.tsx',
  'web/src/modules/phanTich/HieuQuaPa.tsx',
  'web/src/modules/phanTich/KetQuaThi.tsx',
  'web/src/modules/phanTich/PhanTichGiaoVien.tsx',
  'web/src/modules/phanTich/TongHopTestSos.tsx',
  'web/src/modules/phanTich/YThucPhoiHop.tsx',
  'web/src/modules/platform/AdminPage.tsx',
  'web/src/modules/platform/CatalogAdmin.tsx',
  'web/src/modules/platform/XoaTaiKhoanPanel.tsx',
  'web/src/modules/students/BangCanLam.tsx',
  'web/src/modules/students/BangSos.tsx',
  'web/src/modules/students/CacLoTrinh.tsx',
  'web/src/modules/students/HocVienTheoVai.tsx',
  'web/src/modules/students/NganTongKet.tsx',
  'web/src/modules/students/XoaHocVienPanel.tsx',
  'web/src/modules/test/keHoach/LopKeHoach.tsx',
  'web/src/modules/test/keHoach/LuoiKeHoach.tsx',
  'web/src/modules/test/keHoach/NganXuatKeHoach.tsx',
  'web/src/modules/test/lichTest/HangLop.tsx',
  'web/src/modules/test/lichTest/KhoiNo.tsx',
  'web/src/modules/tutor/TutorPage.tsx',
  'web/src/modules/worklist/LopToiDay.tsx',
];
/** BANG-2: tệp còn ô nhập / nút trong `<th>` (trừ `ui/ui.tsx` — nút sắp xếp của `Th`). Chỉ được GIẢM. */
const MIEN_TH_DIEU_KHIEN: string[] = [
  'web/src/modules/platform/AccountsAdmin.tsx',
  'web/src/modules/platform/CatalogAdmin.tsx',
  'web/src/modules/test/keHoach/NganXepLichMt.tsx',
];

export async function runPrBang0Tests(t: YThucTestKit) {
  const { check, assert } = t;
  const d = await import('../../../shared/domain/index.ts');
  console.log('\nBANG-0 · Bang + kiểu cột + ODiem');

  // ------------------------------------------------------------------ hành vi (luật thuần)
  check('BANG-0 · kiểu cột: số / điểm / nổi bật / tỉ lệ / phần trăm căn GIỮA, chữ căn TRÁI, nút căn PHẢI — tiêu đề và ô cùng một luật', () => {
    const K = d.KIEU_COT;
    for (const k of ['so', 'diem', 'noi-bat', 'diem-ti-le', 'phan-tram'] as const) assert(K[k].can === 'giua', `${k}: ${K[k].can}`);
    for (const k of ['ten', 'chu', 'chip', 'tuan', 'viec'] as const) assert(K[k].can === 'trai', `${k}: ${K[k].can}`);
    assert(K.nut.can === 'phai', `nut: ${K.nut.can}`);
    assert(Object.keys(K).length === 11, `11 kiểu ô (+ phu, nhom = 13), đang ${Object.keys(K).length}`);
  });

  check('BANG-5 · cột số / điểm / nổi bật / tỉ lệ / phần trăm có rộng px; tên ≥ 205 px', () => {
    const cot = [
      { key: 'ten', nhan: 'Học viên', kieu: 'ten' }, { key: 'l', nhan: 'L', kieu: 'diem' }, { key: 'kv', nhan: 'Kỳ vọng', kieu: 'noi-bat' },
      { key: 'p', nhan: 'Progress', kieu: 'diem-ti-le' }, { key: 'pt', nhan: '% tổng', kieu: 'phan-tram' }, { key: 'n', nhan: 'Số bài', kieu: 'so' },
      { key: 'v', nhan: 'Việc tiếp', kieu: 'viec' },
    ] as const;
    for (const c of cot) {
      const r = d.rongCot(c, cot);
      if (c.kieu === 'viec') assert(r === null, 'cột việc là cột linh hoạt (không px)');
      else assert(typeof r === 'number' && r > 0, `${c.key}: rộng ${r}`);
    }
    assert(d.rongCot(cot[0], cot) === 205, `tên khi không linh hoạt = 205 px, đang ${d.rongCot(cot[0], cot)}`);
  });

  check('BANG-0 · đúng MỘT cột linh hoạt: việc › chữ › tên', () => {
    const c = (kieu: string, key = kieu) => ({ key, nhan: key, kieu }) as any;
    assert(d.cotLinhHoat([c('ten'), c('diem'), c('chu'), c('viec')]) === 'viec', 'có việc → việc');
    assert(d.cotLinhHoat([c('ten'), c('chu', 'a'), c('chu', 'b')]) === 'a', 'không việc → chữ đầu tiên');
    assert(d.cotLinhHoat([c('ten'), c('diem')]) === 'ten', 'chỉ tên → tên');
    assert(d.cotLinhHoat([c('so'), c('diem')]) === null, 'không cột chữ → không cột linh hoạt');
    assert(d.rongCot(c('ten'), [c('ten'), c('diem')]) === null, 'tên linh hoạt → không px');
  });

  check('BANG-0 · nhóm 2 tầng: hàng tiêu đề nhóm gộp cột liền nhau cùng nhóm (colSpan), cột ngoài nhóm để trống', () => {
    const c = (key: string, nhom?: string) => ({ key, nhan: key, kieu: 'diem', nhom }) as any;
    assert(d.nhomTieuDe([c('a'), c('b')]) === null, 'không nhóm → không hàng nhóm');
    const n = d.nhomTieuDe([{ key: 't', nhan: 'Tên', kieu: 'ten' } as any, c('p1', 'Progress'), c('p2', 'Progress'), c('f1', 'Final'), c('x')]);
    assert(JSON.stringify(n) === JSON.stringify([{ nhan: null, span: 1 }, { nhan: 'Progress', span: 2 }, { nhan: 'Final', span: 1 }, { nhan: null, span: 1 }]), JSON.stringify(n));
  });

  check('BANG-0 · thẻ 375 từ cùng định nghĩa cột: đầu = tên + chip · lưới điểm · dưới = việc + nút · còn lại theo thứ tự cột', () => {
    const cot = ['ten', 'diem:l', 'diem:r', 'noi-bat:kv', 'chip', 'so', 'tuan', 'viec', 'nut'].map((x) => {
      const [kieu, key = kieu] = x.split(':'); return { key, nhan: key, kieu } as any;
    });
    const t375 = d.chiaThe(cot);
    assert(JSON.stringify(t375) === JSON.stringify({ dau: ['ten', 'chip'], diem: ['l', 'r', 'kv'], khac: ['so', 'tuan'], duoi: ['viec', 'nut'] }), JSON.stringify(t375));
  });

  // ------------------------------------------------------------------ tĩnh BANG-1…5
  const css = boChuThich(fs.readFileSync(path.join(REPO, 'web/src/index.css'), 'utf8'));
  const nguon = taiTsx(path.join(REPO, 'web/src')).map((p) => ({ f: path.relative(REPO, p).replace(/\\/g, '/'), text: boChuThich(fs.readFileSync(p, 'utf8')) }));
  const theo = (re: RegExp) => nguon.filter((x) => re.test(x.text)).map((x) => x.f).sort();
  const chiGiam = (ten: string, co: string[], mien: string[]) => {
    const moi = co.filter((f) => !mien.includes(f));
    const thua = mien.filter((f) => !co.includes(f));
    assert(moi.length === 0, `${ten}: tệp mới ngoài danh sách miễn — dùng Bang: ${moi.join(', ')}`);
    assert(thua.length === 0, `${ten}: tệp đã hết lỗi — gỡ khỏi danh sách miễn: ${thua.join(', ')}`);
  };

  check('BANG-1 · index.css: căn theo [data-kieu]; luật căn theo tên lớp chỉ còn đúng dòng cũ (bỏ ở BANG-1 khi lưới vào Bang)', () => {
    assert(/\[data-kieu/.test(css), 'thiếu luật căn theo [data-kieu]');
    /* Một nguồn: căn trong CSS của từng kiểu = KIEU_COT (đổi luật ở shared mà quên CSS → đỏ). */
    const CAN = { left: 'trai', center: 'giua', right: 'phai' } as const;
    for (const m of css.matchAll(/\.bang :is\(th, td\):is\(([^)]*)\)\s*\{[^}]*text-align:\s*(left|center|right)/g)) {
      for (const k of m[1].matchAll(/data-kieu="([a-z-]+)"/g)) {
        const luat = (d.KIEU_COT as any)[k[1]]?.can;
        assert(luat === CAN[m[2] as keyof typeof CAN], `CSS căn ${k[1]} = ${m[2]}, luật = ${luat}`);
      }
    }
    const coCss = new Set([...css.matchAll(/\.bang :is\(th, td\):is\(([^)]*)\)\s*\{[^}]*text-align/g)].flatMap((m) => [...m[1].matchAll(/data-kieu="([a-z-]+)"/g)].map((k) => k[1])));
    for (const k of Object.keys(d.KIEU_COT)) assert(coCss.has(k), `CSS thiếu luật căn cho kiểu ${k}`);
    const tenLop = css.split('\n').filter((s) => /(?:td|th)\.(?:td|th)\.(?:tabular-nums|text-(?:left|center|right))/.test(s));
    assert(tenLop.length <= 1, `luật căn theo tên lớp mới: ${tenLop.join(' | ')}`);
  });

  check('BANG-2 · lớp căn trên td / th và điều khiển trong th chỉ ở tệp chưa chuyển (danh sách chỉ giảm)', () => {
    chiGiam('lớp căn td/th', theo(/<t[dh]\b[^>]*\btext-(?:left|center|right)\b/), MIEN_CAN);
    chiGiam('điều khiển trong th', theo(/<th\b[^>]*>(?:(?!<\/th>)[\s\S])*?<(?:input|button|select)\b/).filter((f) => f !== 'web/src/ui/ui.tsx'), MIEN_TH_DIEU_KHIEN);
  });

  check('BANG-3 · <table> chỉ viết trong ui/Bang.tsx (tệp khác: danh sách miễn chỉ giảm)', () => {
    assert(nguon.some((x) => x.f === 'web/src/ui/Bang.tsx' && /<table\b/.test(x.text)), 'ui/Bang.tsx phải vẽ <table>');
    chiGiam('<table>', theo(/<table\b/).filter((f) => f !== 'web/src/ui/Bang.tsx'), MIEN_TABLE);
  });

  check('BANG-4 · Bang / ODiem: cỡ chữ trong ô ∈ {12, 13, 14, 15} (28 chỉ ODiem lon; 17 ODiem to — hồ sơ lớp V5 "điểm to", UI-HO-SO-LOP)', () => {
    for (const f of ['web/src/ui/Bang.tsx', 'web/src/ui/ODiem.tsx']) {
      const s = nguon.find((x) => x.f === f)?.text;
      assert(s, `thiếu ${f}`);
      const co = [...s!.matchAll(/text-\[(\d+)px\]/g)].map((m) => Number(m[1])).filter((n) => ![12, 13, 14, 15].includes(n) && !(f.endsWith('ODiem.tsx') && (n === 28 || n === 17)));
      assert(co.length === 0, `${f}: cỡ ngoài ô bảng ${co.join(', ')}`);
    }
  });

  check('BANG-0 · Bang: tiêu đề cột chỉ nhận chữ (nhan / phu kiểu string), th và td cùng data-kieu', () => {
    const s = nguon.find((x) => x.f === 'web/src/ui/Bang.tsx')?.text ?? '';
    const b = fs.readFileSync(path.join(REPO, 'shared/domain/bang.ts'), 'utf8');
    assert(/nhan:\s*string/.test(b) && /phu\?:\s*string/.test(b), 'DinhNghiaCot.nhan / phu phải là string (cấm điều khiển trong tiêu đề)');
    assert((s.match(/data-kieu=\{/g) ?? []).length >= 2, 'th và td phải cùng gắn data-kieu');
  });
}
