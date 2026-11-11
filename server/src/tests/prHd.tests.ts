/**
 * PHÉP KIỂM HD-a (Hướng dẫn trên web, đặc tả docs/superpowers/specs/2026-10-15-ov13-sua-loi-tinh-nang-design.md mục 4):
 *   HD-NAV  mỗi đường trong thanh điều hướng (khu vực + tab Test + tab Công việc + Hồ sơ cá nhân + Hướng dẫn) của vai có hướng dẫn đều có mục
 *           "Theo màn" — thêm màn / tab mà quên viết mục → đỏ.
 *   HD-VIEC mỗi vai đúng 5 việc hằng tuần (chủ SP 15/10).
 *   HD-CHI  mỗi "Chỉ cho tôi" trỏ `data-hd` có thật trong mã web (quét nguồn) và mở trang có mục — đổi / xoá phần tử → đỏ;
 *           không trỏ phần tử màn đó không dựng cho vai (bảng CHI_VAI).
 *   HD-NHO  "đã mở Hướng dẫn" nhớ theo tài khoản (chấm trên nút "?"): PATCH /me/profile { daXemHuongDan: true } → /demo/session; giá trị lạ → 400;
 *           migrate prHd chạy lặp được.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '..');

export async function runPrHdTests(t: any) {
  const { check, checkAsync, assert, conn, P, TODAY } = t;
  const hd: any = await import('../../../shared/huongDan/index.ts');
  const dh: any = await import('../../../shared/domain/dieuHuong.ts');
  const { navOf } = await import('../platform/nav.ts');
  const { migratePrHd } = await import('../migrate/prHd.ts');
  const { createApp } = await import('../app.ts');
  console.log('\nHD-a · Hướng dẫn trên web · mục theo màn · Chỉ cho tôi · nhớ đã mở (chấm "?")');

  /* Vai có hướng dẫn → tài khoản mẫu để dựng thanh điều hướng thật (`navOf`). Thêm vai thì thêm tài khoản ở đây. */
  const { loadPrincipal } = await import('../permissions.ts');
  const theoVai = (vai: string) => loadPrincipal((conn.prepare(
    'SELECT ur.user_id AS id FROM user_roles ur JOIN roles r ON r.id = ur.role_id WHERE r.key = ? ORDER BY ur.user_id LIMIT 1').get(vai) as any).id);
  const MAU: Record<string, any[]> = {
    gv: [P.coreTeacher, P.subjectTeacher], ql: [P.mbManager], qt: [P.admin],
    tvv: [theoVai('consultant')], cx: [theoVai('cx')], admin: [theoVai('office_admin')], ht: [theoVai('head_tutor')],
  };
  /* HD-b: thêm Phân tích (tab Tổng quan) và Quản trị (menu Tài khoản) khi vai có. */
  const duongNav = (nav: any): string[] => [
    ...(nav.analysis ? ['/phan-tich'] : []), ...(nav.admin || nav.bangQuyDoi ? ['/quan-tri'] : []),   // HD-V2b: QL vào /quan-tri bằng menu Tài khoản › Đã xoá (App.tsx: admin || bangQuyDoi)
    ...dh.khuVucHienThi(nav).map((k: any) => k.to),
    ...dh.tabTestHienThi(nav).map((k: string) => dh.DUONG_TAB_TEST[k]),
    ...dh.tabCongViecHienThi(nav).map((k: string) => dh.DUONG_TAB_CONG_VIEC[k]),
    '/ho-so-ca-nhan', '/huong-dan',
  ];

  check('HD-NAV · mỗi vai có hướng dẫn đều có tài khoản mẫu; mỗi đường trên thanh điều hướng của vai đó có mục Theo màn', () => {
    const loi: string[] = [];
    assert(Object.keys(hd.HUONG_DAN).length === 7, `đủ 7 vai (TU-b: Head tutor) (${Object.keys(hd.HUONG_DAN).join(', ')})`);
    for (const vai of Object.keys(hd.HUONG_DAN)) {
      if (!MAU[vai]) { loi.push(`vai ${vai} chưa có tài khoản mẫu trong phép kiểm`); continue; }
      for (const p of MAU[vai]) {
        for (const d of duongNav(navOf(p))) if (!hd.manCuaDuong(hd.HUONG_DAN[vai], d)) loi.push(`${vai}: ${d} chưa có mục`);
      }
    }
    assert(loi.length === 0, [...new Set(loi)].join(' · '));
  });

  check('HD-NAV · màn khớp theo đường dài nhất: /test/diem-lop ≠ /test/lich, /hoc-vien/lop/3 ≠ /hoc-vien, /nhap-diem/3 có mục, "/" chỉ Tổng quan', () => {
    const gv = hd.HUONG_DAN.gv;
    const id = (d: string) => hd.manCuaDuong(gv, d)?.id ?? null;
    assert(id('/test/diem-lop') !== id('/test/lich'), 'Điểm theo lớp phải có mục riêng');
    assert(id('/hoc-vien/lop/3') !== id('/hoc-vien'), 'hồ sơ lớp phải có mục riêng');
    assert(id('/hoc-vien/3') !== id('/hoc-vien'), 'hồ sơ HV phải có mục riêng');
    assert(!!id('/nhap-diem/3'), 'nhập điểm');
    assert(id('/') !== null && id('/quan-tri') === null, `"/" không được khớp mọi đường (${id('/quan-tri')})`);
  });

  check('HD-VIEC · mỗi vai đúng 5 việc hằng tuần, mỗi việc 2–4 bước; mỗi vai đủ 4 phần', () => {
    /* AN-TUTOR (chủ SP 22/10): Head tutor không còn việc trên web — chỉ Tổng quan, Hồ sơ cá nhân, Hướng dẫn. */
    for (const [vai, h] of Object.entries(hd.HUONG_DAN).filter(([v, x]: any) => v !== 'ht' && !x.lam) as [string, any][]) {
      assert(h.viec.length === 5, `${vai}: ${h.viec.length} việc`);
      for (const m of h.viec) assert(m.buoc.length >= 2, `${vai} ${m.id}: việc hằng tuần cần 2–4 bước (${m.buoc.length})`);
      for (const m of [...h.viec, ...h.man.flatMap((x: any) => x.muc), ...h.luat]) assert(m.buoc.length >= 1 && m.buoc.length <= 4, `${vai} ${m.id}: ${m.buoc.length} bước`);
      assert(h.man.length > 0 && h.luat.length > 0 && h.tu.length > 0, `${vai}: thiếu phần`);
      const ids = hd.moiMuc(h).map((m: any) => m.id);
      assert(new Set(ids).size === ids.length, `${vai}: id mục trùng (do-khung tìm theo id)`);
    }
  });

  check('HD-CHI · mỗi "Chỉ cho tôi" trỏ data-hd có thật trong web/src; trang mở (nếu có) thuộc màn có mục', () => {
    const co = new Set<string>();
    const KHU = dh.KHU_VUC.map((k: any) => k.key) as string[];
    const quet = (thuMuc: string) => {
      for (const f of fs.readdirSync(thuMuc, { withFileTypes: true })) {
        const p = path.join(thuMuc, f.name);
        if (f.isDirectory()) { quet(p); continue; }
        if (!/\.tsx?$/.test(f.name)) continue;
        const src = fs.readFileSync(p, 'utf8');
        /* `data-hd="x"` hoặc biểu thức có chuỗi (`data-hd={k === 'k2' ? 'x' : undefined}`). */
        for (const m of src.matchAll(/data-hd="([\w-]+)"/g)) co.add(m[1]);
        for (const m of src.matchAll(/data-hd=\{([^}`]*)\}/g)) for (const c of m[1].matchAll(/'([\w-]+)'/g)) co.add(c[1]);
        /* Thanh điều hướng: một thuộc tính cho cả 4 khu vực (`nav-${muc.key}`). */
        for (const m of src.matchAll(/data-hd=\{`([\w-]*)\$\{muc\.key\}`\}/g)) for (const k of KHU) co.add(m[1] + k);
      }
    };
    quet(path.join(ROOT, 'web/src'));
    /* (đường, data-hd, vai thấy): "Lớp tôi dạy" ở Công việc chỉ GV (`laGv`, HoTroHocVienTab); Tổng quan QT mặc định Tất cả chi nhánh (bảng Theo chi nhánh). */
    const CHI_VAI: [string, string, string[]][] = [['/cong-viec', 'tq-lop-toi-day', ['gv']], ['/', 'tq-can-xu-ly', ['ql']], ['/', 'tq-lop-chu-y', ['ql']], ['/', 'tq-gv-tre', ['ql']]];
    const loi: string[] = [];
    for (const [vai, h] of Object.entries(hd.HUONG_DAN) as [string, any][]) {
      for (const m of hd.moiMuc(h)) {
        if (!m.chi) continue;
        for (const x of [m.chi.hd].flat()) if (!co.has(x)) loi.push(`${vai} ${m.id}: data-hd="${x}" không có trong web/src`);
        if (m.chi.duong && !hd.manCuaDuong(h, m.chi.duong)) loi.push(`${vai} ${m.id}: trang ${m.chi.duong} không có mục`);
        /* Bấm từ trang /huong-dan: không có `duong` thì chỉ khoanh được phần tử có ở MỌI màn (thanh điều hướng, ô tìm, nút tài khoản, nút "?" — HD-V2). */
        const khapNoi = [m.chi.hd].flat().every((x: string) => x.startsWith('nav-') || x === 'tim-hv' || x === 'tai-khoan' || x === 'nut-hd');
        if (!m.chi.duong && !khapNoi) loi.push(`${vai} ${m.id}: thiếu duong — bấm từ trang Hướng dẫn sẽ "Chưa có việc nào ở đây"`);
        /* Phần tử chỉ dựng cho một số vai: vai khác bấm sẽ "Chưa có việc nào ở đây" (do-khung hd-chi 28/10). */
        for (const [duong, x, vaiCo] of CHI_VAI) if (m.chi.duong === duong && [m.chi.hd].flat().includes(x) && !vaiCo.includes(vai)) loi.push(`${vai} ${m.id}: ${x} ở ${duong} không dựng cho vai này`);
      }
    }
    assert(loi.length === 0, loi.join(' · '));
    for (const [vai, h] of Object.entries(hd.HUONG_DAN).filter(([v, x]: any) => v !== 'ht' && !x.lam) as [string, any][]) assert(h.viec.filter((m: any) => m.chi).length >= 3, `${vai}: việc hằng tuần thiếu Chỉ cho tôi`);
  });

  check('HD-TIM · tìm không dấu ("han") ra mục có chữ "hạn"; chữ lạ → rỗng', () => {
    const gv = hd.HUONG_DAN.gv;
    const chu = (k: string) => k;
    assert(hd.locHd(gv, 'han', chu).luat.length > 0, 'tìm "han"');
    assert(hd.timHd(gv, 'han', chu) !== null && hd.timHd(gv, '  ', chu) === null, 'timHd rỗng → null');
    const ten = (h: any) => hd.moiMuc(h).map((m: any) => m.id);
    assert(!ten(hd.locHd(gv, 'han', chu)).includes('nhan-xet'), '"han" không khớp giữa từ ("nhận xét")');
    assert(ten(hd.locHd(gv, 'hạn', chu)).includes('han-xac-nhan') && !ten(hd.locHd(gv, 'hạn', chu)).includes('lop-hoc-vien'), 'gõ có dấu so đúng dấu ("hạn" ≠ "hàng")');
    assert(ten(hd.locHd(gv, 'ket qua pa', chu)).includes('ket-qua-pa'), 'nhiều từ không dấu');
    assert(hd.locHd(gv, 'zzqq', chu).viec.length === 0, 'chữ lạ');
    assert(hd.locHd(gv, '', chu) === gv, 'rỗng = đủ');
  });

  /* ---------------------------------------------------------------- HD-V2 (đặc tả 2026-11-05 mục 5, 9, 10) */
  /* Đường của App.tsx: `<Route path="/test/:tab?" …>` → khớp `/test/lich`. Đường có điều kiện nav phải nằm trong thanh điều hướng của vai (vai vào được). */
  const ROUTE = [...fs.readFileSync(path.join(ROOT, 'web/src/App.tsx'), 'utf8').matchAll(/<Route path="([^"*]+)"/g)].map((m) => m[1]);
  const coRoute = (d: string) => ROUTE.some((r) => new RegExp(`^${r.replace(/\/:\w+\?/g, '(/[^/]+)?').replace(/:\w+/g, '[^/]+')}$`).test(d));
  const CAN_NAV = ['/test', '/cong-viec', '/phan-tich', '/quan-tri'];
  const vaoDuoc = (vai: string, d: string) => !CAN_NAV.some((x) => d === x || d.startsWith(`${x}/`)) || MAU[vai].some((p) => duongNav(navOf(p)).includes(d));
  const vaiMoi = () => Object.entries(hd.HUONG_DAN).filter(([, h]: any) => h.lam) as [string, any][];

  check('HD-LOI · lối chính / lối tắt trỏ màn có thật; "Đi tới", Trước / Sau, Không làm ở đây trỏ đường có trong App.tsx mà vai vào được', () => {
    const loi: string[] = [];
    assert(vaiMoi().some(([v]) => v === 'gv'), 'GV đã chuyển sang HD-V2');
    const xet = (vai: string, ai: string, d?: string) => {
      if (!d) return;
      const p = d.split('?')[0];
      if (!coRoute(p)) loi.push(`${vai} ${ai}: ${d} không có trong App.tsx`);
      else if (!vaoDuoc(vai, p)) loi.push(`${vai} ${ai}: ${d} vai không vào được`);
    };
    for (const [vai, h] of vaiMoi()) {
      for (const v of h.lam) {
        if (v.loiChinh.man && !hd.manTheoId(h, v.loiChinh.man)) loi.push(`${vai} ${v.id}: lối chính màn "${v.loiChinh.man}" không có`);
        for (const m of v.loiTat ?? []) if (!hd.manTheoId(h, m)) loi.push(`${vai} ${v.id}: lối tắt màn "${m}" không có`);
        xet(vai, v.id, v.loiChinh.duong);
        if (v.loiChinh.duong && v.loiChinh.man && !hd.manCuaDuong(h, v.loiChinh.duong.split('?')[0]))
          loi.push(`${vai} ${v.id}: "Đi tới" ${v.loiChinh.duong} không có mục`);
        if (v.buoc.length < 2 || v.buoc.length > 4) loi.push(`${vai} ${v.id}: ${v.buoc.length} bước (2–4)`);
      }
      for (const m of h.man) {
        xet(vai, `${m.id} Trước`, m.dangO?.truoc?.duong); xet(vai, `${m.id} Sau`, m.dangO?.sau?.duong);
        for (const k of m.khongLam ?? []) {
          xet(vai, `${m.id} không làm`, k.den?.duong);
          if (!!k.den === !!k.cua) loi.push(`${vai} ${m.id}: "${k.ten}" cần đúng một trong đích / "việc của …"`);
          /* 10.4: không lặp đích đã có ở Trước / Sau. */
          if (k.den && [m.dangO?.truoc?.duong, m.dangO?.sau?.duong].includes(k.den.duong)) loi.push(`${vai} ${m.id}: "${k.ten}" lặp đích Trước / Sau`);
        }
        if (!m.panel && !m.dangO) loi.push(`${vai} ${m.id}: thiếu "Bạn đang ở"`);
        if (m.panel && m.duong.length) loi.push(`${vai} ${m.id}: mục panel không khớp đường`);
        /* Bước riêng (`muc.viec`) chỉ cho việc có lối ở màn này — không thì mục bị bỏ âm thầm. */
        for (const x of m.muc) if (x.viec) {
          const v = h.lam.find((y: any) => y.id === x.viec);
          if (!v || (v.loiChinh.man !== m.id && !v.loiTat?.includes(m.id))) loi.push(`${vai} ${m.id}: bước riêng của "${x.viec}" mà việc không có lối ở màn này`);
        }
      }
    }
    assert(loi.length === 0, loi.join(' · '));
  });

  check('HD-MOT · mỗi việc đúng một lối chính (lối tắt không chứa màn lối chính, không trùng); id không trùng; mọi màn có "Việc làm ở đây"', () => {
    for (const [vai, h] of vaiMoi()) {
      const ids = h.lam.map((v: any) => v.id);
      assert(new Set(ids).size === ids.length, `${vai}: id việc trùng`);
      for (const v of h.lam) {
        assert(!(v.loiTat ?? []).includes(v.loiChinh.man), `${vai} ${v.id}: lối tắt chứa màn lối chính`);
        assert(new Set(v.loiTat ?? []).size === (v.loiTat ?? []).length, `${vai} ${v.id}: lối tắt trùng`);
      }
      for (const m of h.man) assert(hd.viecOManNay(h, m.id).length > 0, `${vai} ${m.id}: "Việc làm ở đây" rỗng`);
      /* Bảng lối chính đã đối chiếu (ghi chú v14 mục 1 + 3b) — đổi lối chính phải sửa cả bảng. */
      const LOI: Record<string, string> = { 'nhap-diem': 'cong-viec', 'cham-s': 'cong-viec', 'case-xac-nhan': 'cong-viec', 'xem-case': 'ho-so-hv', 'tao-case': 'ho-so-hv',
        'case-hoan-thanh': 'p-case', 'nhap-mt-cu': 'cong-viec', 'ghi-mini-test': 'cong-viec', 'doi-chu-case': 'p-case', 'de-xuat-chuyen-lop': 'ho-so-hv' };
      if (vai === 'gv') for (const [id, man] of Object.entries(LOI)) assert(h.lam.find((v: any) => v.id === id)?.loiChinh.man === man, `gv ${id}: lối chính phải là ${man}`);
    }
    const gv = hd.HUONG_DAN.gv;
    const lt = hd.viecOManNay(gv, 'lich-test');
    assert(lt[0]?.viec?.id === 'nhap-diem' && lt[0].tat && lt[0].muc.chi?.hd === 'lich-test-tuan', 'Lịch Test tuần: Nhập điểm đầu, là lối tắt, bước riêng của màn');
    assert(hd.viecOManNay(gv, 'cong-viec').find((d: any) => d.viec?.id === 'nhap-diem')?.tat === false, 'Công việc là lối chính — không ô Lối chính');
  });

  check('HD-TUAN · Tuần của tôi chỉ trỏ việc có thật, mỗi việc một lần; nhóm Tôi muốn… hợp lệ', () => {
    for (const [vai, h] of vaiMoi()) {
      const co = new Set(h.lam.map((v: any) => v.id));
      const ds = h.tuan.flatMap((n: any) => n.viec);
      for (const i of ds) assert(co.has(i), `${vai}: tuần trỏ "${i}" không có`);
      assert(new Set(ds).size === ds.length, `${vai}: việc lặp trong tuần`);
      for (const v of h.lam) assert(['diem', 'case', 'hv', 'lich', 'duyet', 'khac'].includes(v.nhom), `${vai} ${v.id}: nhóm ${v.nhom}`);
    }
  });

  check('HD-CO · GVBM không thấy việc Chỉ GVCN / GV Speaking; GVCN + S thấy đủ; tuần và Màn này bỏ theo', () => {
    const gv = hd.HUONG_DAN.gv;
    const bm = hd.locVai(gv, { gvcn: false, s: false });
    assert(bm.lam.every((v: any) => !v.chiGvcn && !v.chiS), 'GVBM còn việc GVCN / S');
    assert(gv.lam.some((v: any) => v.chiGvcn) && gv.lam.some((v: any) => v.chiS), 'có việc GVCN và S');
    assert(!bm.tuan.flatMap((n: any) => n.viec).includes('nhap-mt-cu'), 'tuần bỏ việc GVCN');
    assert(hd.locVai(gv, { gvcn: true, s: true }).lam.length === gv.lam.length, 'đủ cờ = đủ việc');
    assert(!hd.viecOManNay(bm, 'lich-test').some((d: any) => d.viec?.chiGvcn), 'Màn này cũng bỏ việc GVCN');
  });

  check('HD-TIM2 · từ đồng nghĩa không dấu ("doi lop") ra Đề xuất chuyển lớp + "việc của QL"; "nhập điểm" ra 2 việc Điểm; chữ lạ rỗng', () => {
    const gv = hd.HUONG_DAN.gv;
    const chu = (k: string) => k;
    const a = hd.timHd(gv, 'doi lop', chu, 'lich-test');
    assert(a.viec.some((v: any) => v.id === 'de-xuat-chuyen-lop'), `doi lop: ${a.viec.map((v: any) => v.id)}`);
    assert(a.vaiKhac.some((v: any) => v.cua === 'việc của QL'), 'việc vai khác');
    const b = hd.timHd(gv, 'nhập điểm', chu, 'lich-test');
    assert(['nhap-diem', 'nhap-mt-cu'].every((i) => b.viec.some((v: any) => v.id === i)), `nhập điểm: ${b.viec.map((v: any) => v.id)}`);
    const c = hd.timHd(gv, 'xoá tài khoản', chu);
    assert(c.viec.length === 0 && c.vaiKhac.some((v: any) => v.cua === 'việc của Quản trị'), 'xoá tài khoản → việc của Quản trị');
    const z = hd.timHd(gv, 'zzqq', chu);
    assert(z.viec.length + z.muc.length + z.vaiKhac.length === 0, 'chữ lạ');
  });

  check('HD-VAI-B · QL, QT, Admin đã chuyển sang `lam`; lối chính đúng bảng đã đối chiếu (ghi chú v14); QT = QL + Quản trị; tìm "duyệt", "đổi lớp", "xoá tài khoản"', () => {
    const { ql, qt, admin, gv } = hd.HUONG_DAN;
    for (const [vai, h] of [['ql', ql], ['qt', qt], ['admin', admin]] as [string, any][]) assert(h.lam?.length && h.viec.length === 0 && h.tuan?.length, `${vai} chưa chuyển sang HD-V2`);
    const LOI: Record<string, Record<string, string>> = {
      ql: { duyet: 'cong-viec', 'nhap-ho': 'tong-quan', 'case-lam-thay': 'cong-viec', 'xep-lich': 'ke-hoach', 'xem-lich-test': 'lich-test', 'khoi-phuc': 'quan-tri', 'chuyen-lop': 'ho-so-hv', 'xem-case': 'ho-so-hv', 'case-hoan-thanh': 'p-case', 'phan-tich': 'phan-tich' },
      admin: { 'nhap-ho': 'cong-viec', 'xep-lich': 'ke-hoach', 'xem-lich-test': 'lich-test' },
    };
    for (const [vai, bang] of Object.entries(LOI)) for (const [id, man] of Object.entries(bang)) {
      const v = hd.HUONG_DAN[vai].lam.find((x: any) => x.id === id);
      assert(v?.loiChinh.man === man, `${vai} ${id}: lối chính phải là ${man} (${v?.loiChinh.man})`);
    }
    /* QT = QL + Quản trị: đủ việc của QL, thêm việc hệ thống; không chép (cùng đối tượng việc). */
    const idQt = new Set(qt.lam.map((v: any) => v.id));
    for (const v of ql.lam) assert(idQt.has(v.id), `QT thiếu việc QL "${v.id}"`);
    for (const id of ['dang-ky', 'tai-khoan', 'quyen', 'chuong-trinh', 'xoa-lop', 'xoa-hv']) assert(idQt.has(id) && !ql.lam.some((v: any) => v.id === id), `việc Quản trị "${id}"`);
    assert(qt.lam.find((v: any) => v.id === 'duyet') === ql.lam.find((v: any) => v.id === 'duyet'), 'QT dùng lại việc của QL, không chép');
    /* Tổng quan QT mặc định "Tất cả chi nhánh": không "Chỉ cho tôi" tới khối chỉ hiện khi chọn một chi nhánh. */
    assert(!qt.lam.find((v: any) => v.id === 'nhap-ho').loiChinh.chi, 'QT: Nhập hộ ở Tổng quan không Chỉ cho tôi');
    /* Admin không có việc của QL / GV; GV không có việc Khôi phục. */
    for (const id of ['duyet', 'khoi-phuc', 'case-lam-thay']) assert(!admin.lam.some((v: any) => v.id === id), `Admin không có "${id}"`);
    assert(!admin.man.some((m: any) => m.panel === 'ngan-case') && !gv.lam.some((v: any) => v.id === 'khoi-phuc'), 'Admin không panel Case; GV không Khôi phục');
    const chu = (k: string) => k;
    assert(hd.timHd(ql, 'duyet', chu).viec.some((v: any) => v.id === 'duyet'), 'QL tìm "duyet"');
    assert(hd.timHd(ql, 'doi lop', chu).viec.some((v: any) => v.id === 'chuyen-lop'), 'QL tìm "doi lop" ra Chuyển lớp');
    const xoa = (h: any) => hd.timHd(h, 'xoa tai khoan', chu);
    assert(xoa(ql).vaiKhac.some((v: any) => v.cua === 'việc của Quản trị'), 'QL: xoá tài khoản là việc của Quản trị');
    assert(xoa(qt).viec.some((v: any) => v.id === 'tai-khoan'), 'QT: xoá tài khoản là việc của mình');
    /* Bước 2–4 mỗi việc, mọi màn của QT có "Việc làm ở đây" (HD-MOT) — QT có thêm màn Quản trị hệ thống đủ ba tab. */
    assert(hd.manTheoId(qt, 'quan-tri').ten === 'Quản trị hệ thống' && hd.manTheoId(ql, 'quan-tri').ten === 'Cấu hình hệ thống', 'màn /quan-tri: QL Cấu hình hệ thống (chỉ xem, QTV2), QT đủ tab');
  });

  check('HD-V2 · tiêu đề phần của trang luôn có h2 trên màn hình (sr-only, in vẫn thấy); ô "Vai: …" của panel là viên gọn `o-chon-vai`', () => {
    assert(/<h2 className="[^"]*sr-only print:not-sr-only/.test(fs.readFileSync(path.join(ROOT, 'web/src/modules/huongDan/HuongDanPage.tsx'), 'utf8')), 'h2 phần phải sr-only (không hidden)');
    assert(/<select className="field o-chon-vai /.test(fs.readFileSync(path.join(ROOT, 'web/src/modules/huongDan/NutHuongDan.tsx'), 'utf8')), 'select Vai phải dùng o-chon-vai');
    assert(/\.o-chon-vai \{[^}]*appearance: none/.test(fs.readFileSync(path.join(ROOT, 'web/src/index.css'), 'utf8')), 'thiếu .o-chon-vai trong index.css');
  });

  await checkAsync('HD-VAI-C · TVV, CX, Head tutor đã chuyển sang `lam`; lối chính khớp mã main (nhóm Công việc TVV, nút đầu Hồ sơ HV); CX không Công việc; gvCu.ts đã xoá; tìm "bao phu huynh", "doi lop"', async () => {
    const { tvv, cx, ht } = hd.HUONG_DAN;
    for (const [vai, h] of [['tvv', tvv], ['cx', cx], ['ht', ht]] as [string, any][]) assert(h.lam?.length && h.viec.length === 0 && h.tuan?.length, `${vai} chưa chuyển sang HD-V2`);
    assert(!fs.existsSync(path.join(ROOT, 'shared/huongDan/gvCu.ts')), 'gvCu.ts còn');
    /* Nhãn đúng mã main: nhóm Công việc của TVV (`NHOM_CV_TVV_LABEL`), nút đầu Hồ sơ HV của TVV / CX (`NHAN_VIEC_QUAN_LY`, không phải ⋯ — `vaiXemHocVien`). */
    const { NHOM_CV_TVV_LABEL } = await import('../../../shared/domain/tongQuan.ts');
    const { NHAN_VIEC_QUAN_LY } = await import('../../../shared/domain/quanLyHocVien.ts');
    const nhom = Object.values(NHOM_CV_TVV_LABEL) as string[];
    const nut = Object.values(NHAN_VIEC_QUAN_LY) as string[];
    const LOI: Record<string, Record<string, string>> = {
      tvv: { 'xem-viec': 'cong-viec', 'bao-ph': 'cong-viec', 'chot-ngay-thi': 'cong-viec', 'thi-that': 'cong-viec', 'buoc-tiep': 'cong-viec', 'bo-sung': 'cong-viec', 'sua-hv': 'ho-so-hv', 'tam-dung': 'ho-so-hv', 'xem-case': 'ho-so-hv', 'xem-thi-thang': 'tong-quan', 'loc-hv': 'hoc-vien', 'phan-tich': 'phan-tich' },
      cx: { 'thi-that': 'ho-so-hv', 'sua-hv': 'ho-so-hv', 'tam-dung': 'ho-so-hv', 'xem-so': 'tong-quan', 'loc-hv': 'hoc-vien' },
      ht: { 'xem-tong-quan': 'tong-quan', 'sua-ho-so': 'ho-so-ca-nhan' },
    };
    for (const [vai, bang] of Object.entries(LOI)) for (const [id, man] of Object.entries(bang)) {
      const v = hd.HUONG_DAN[vai].lam.find((x: any) => x.id === id);
      assert(v?.loiChinh.man === man, `${vai} ${id}: lối chính phải là ${man} (${v?.loiChinh.man})`);
    }
    for (const [vai, h] of [['tvv', tvv], ['cx', cx]] as [string, any][]) for (const v of h.lam) {
      const [dau, cuoi] = v.loiChinh.chu.split(' › ');
      if (dau === 'Công việc' && cuoi) assert(nhom.includes(cuoi), `${vai} ${v.id}: nhóm Công việc "${cuoi}" không có ở NHOM_CV_TVV_LABEL`);
      if (dau === 'Hồ sơ HV' && cuoi && !cuoi.includes('&')) assert(nut.includes(cuoi) || cuoi === 'Ý thức & Phối hợp', `${vai} ${v.id}: nút "${cuoi}" không có ở NHAN_VIEC_QUAN_LY`);
    }
    /* CX không có Công việc: không màn, không lối chính nào ở đó; chọn bước tiếp là việc của QL / TVV. */
    assert(!cx.man.some((m: any) => m.id === 'cong-viec') && cx.lam.every((v: any) => v.loiChinh.man !== 'cong-viec' && !(v.loiTat ?? []).includes('cong-viec')), 'CX có Công việc');
    assert(!cx.lam.some((v: any) => v.id === 'buoc-tiep') && cx.vaiKhac.some((v: any) => v.ten === 'Chọn bước tiếp sau thi'), 'CX không chọn Bước tiếp');
    /* Head tutor chỉ Tổng quan, Hồ sơ cá nhân, Hướng dẫn (AN-TUTOR). */
    assert(ht.man.map((m: any) => m.id).join() === 'tong-quan,ho-so-ca-nhan,huong-dan', `HT màn: ${ht.man.map((m: any) => m.id)}`);
    const chu = (k: string) => k;
    assert(hd.timHd(tvv, 'bao phu huynh', chu).viec.some((v: any) => v.id === 'bao-ph'), 'TVV tìm "bao phu huynh"');
    assert(hd.timHd(tvv, 'doi lop', chu).vaiKhac.some((v: any) => v.cua === 'việc của QL'), 'TVV: đổi lớp là việc của QL');
    assert(hd.timHd(cx, 'ket qua thi that', chu).viec.some((v: any) => v.id === 'thi-that'), 'CX tìm "ket qua thi that"');
    /* Trang /huong-dan dùng chung dữ liệu: mọi vai có màn Hướng dẫn riêng ("Xem vai khác" cho QL / QT đọc được cả 7 vai). */
    for (const [vai, h] of Object.entries(hd.HUONG_DAN) as [string, any][]) assert(hd.manCuaDuong(h, '/huong-dan')?.id === 'huong-dan', `${vai}: thiếu màn Hướng dẫn`);
  });

  /* ---------------------------------------------------------------- HD-V3 (đề bài 2026-11-13-huong-dan-v3 mục "Cách làm") */
  /*
   * Màn / panel còn chờ session B (QL + Admin; QT = QL + Quản trị nên theo QL) và C (TVV + CX + Head tutor). Không tính `qt` (chủ SP 13/11). Mỗi dòng "vai đường" hoặc
   * "vai panel:x" là một chỗ CHƯA có mục — B / C viết mục thì XOÁ dòng (dòng thừa cũng đỏ: không để phép kiểm xanh giả). GV không có dòng chờ.
   */
  const CHO_B: string[] = [
    'ql /giao-vien/1', 'admin /hoc-vien/luu-tru', 'admin /giao-vien/1',
    ...['ket-qua-pa', 'phoi-hop-sos', 'vi-pham', 'xu-ly-vi-pham', 'ban-giao', 'bao-cao-ph', 'chuyen-lop', 'xuat-excel', 'lo-trinh', 'duyet', 'sua-thong-tin',
      'sua-ca-lop', 'sau-thi', 'chot-ngay-thi', 'xep-lich-mt', 'them-hv', 'xuat-ds', 'bao-ph', 'xet-lai'].map((x) => `ql panel:${x}`),
    ...['xuat-excel', 'sua-thong-tin', 'xep-lich-mt', 'xuat-ds'].map((x) => `admin panel:${x}`),
  ];
  const CHO_C: string[] = [
    ...['tvv', 'cx'].flatMap((v) => ['/hoc-vien/luu-tru', '/mock-test/1', '/luot-test/1', '/giao-vien/1'].map((x) => `${v} ${x}`)),
    ...['ngan-case', 'phoi-hop-sos', 'lo-trinh', 'sua-thong-tin', 'sua-ca-lop', 'sau-thi', 'chot-ngay-thi', 'them-hv', 'xuat-ds', 'bao-ph'].map((x) => `tvv panel:${x}`),
    ...['ngan-case', 'sua-thong-tin', 'sua-ca-lop', 'sau-thi', 'them-hv', 'xuat-ds'].map((x) => `cx panel:${x}`),
  ];
  const CHO = new Set([...CHO_B, ...CHO_C]);
  const soCho = (loi: string[], ten: string) => {
    const thieu = loi.filter((x) => !CHO.has(x));
    const thua = [...CHO].filter((x) => x.includes(ten) && !loi.includes(x));
    assert(!thieu.length, `chưa có mục: ${thieu.join(' · ')}`);
    assert(!thua.length, `đã có mục — xoá khỏi CHO_B / CHO_C: ${thua.join(' · ')}`);
  };

  /*
   * HD-ROUTE: mỗi <Route> của App.tsx (trừ /quan-tri, /dev, /tutor) mà vai vào được khớp một màn CỦA ĐÚNG ĐƯỜNG đó — không tính khớp nhờ tiền tố
   * của màn khác (`/hoc-vien/` không che `/hoc-vien/luu-tru`; `/cong-viec` không che `/cong-viec/van-hanh`). Tab Test / Công việc lấy từ thanh
   * điều hướng thật (`tabTestHienThi`, `tabCongViecHienThi`). Đường có điều kiện `nav.x ?` đọc thẳng từ App.tsx; đường không điều kiện khai ở VAO.
   */
  const APP = fs.readFileSync(path.join(ROOT, 'web/src/App.tsx'), 'utf8');
  const ROUTE_V3 = [...APP.matchAll(/<Route path="([^"]+)"\s+element=\{([^\n]*)/g)]
    .map((m) => ({ path: m[1], gate: /^(nav\.\w+(?: \|\| nav\.\w+)*) \?/.exec(m[2])?.[1].split(' || ').map((x) => x.slice(4)) ?? null }))
    .filter((r) => r.path !== '*' && !['/quan-tri', '/dev', '/tutor'].some((x) => r.path === x || r.path.startsWith(`${x}/`)));
  const VAO: Record<string, (n: any, p: any) => boolean> = {
    '/': () => true, '/ho-so-ca-nhan': () => true, '/huong-dan': () => true,
    '/hoc-vien': (n) => n.students, '/hoc-vien/lop/:classId': (n) => n.students, '/hoc-vien/:id': (n) => n.students,
    '/hoc-vien/luu-tru': (n) => n.students,                 // ô tìm thanh trên: "Tìm trong HV lưu trữ ›" (Header.tsx) — mọi vai xem HV
    /* Link Case trong thông báo / Công việc: không phải màn — chuyển sang hồ sơ HV (màn ho-so-hv) hoặc mở riêng panel Case (mục panel, HD-PANEL). */
    '/hoc-thuat/case/:id': () => false,
    '/mock-test/:id': (n) => n.test || n.students, '/luot-test/:id': (n) => n.test || n.students,   // ô điểm hồ sơ HV mở hồ sơ lượt
    '/giao-vien/:id': (n, p) => p.roleKeys.includes('teacher') || n.analysis,   // menu Tài khoản (GV) · ô tìm GV (`timGv` = analysis)
  };
  const duongCua = (r: { path: string }, nav: any): string[] => {
    if (r.path === '/test/:tab?') return ['/test', ...dh.tabTestHienThi(nav).map((k: string) => dh.DUONG_TAB_TEST[k])];
    if (r.path === '/cong-viec/:tab?') return [...new Set(['/cong-viec', ...dh.tabCongViecHienThi(nav).map((k: string) => dh.DUONG_TAB_CONG_VIEC[k].split('?')[0])])];
    return [r.path.replace(/\/:\w+\?/g, '').replace(/:\w+/g, '1')];
  };
  const coManDung = (h: any, r: { path: string }, d: string) => {
    const man = hd.manCuaDuong(h, d);
    if (!man) return false;
    if (man.duong.includes(d)) return true;
    const tinh = r.path.split('/:')[0];
    if (r.path.includes('/:') && !r.path.endsWith('?') && man.duong.some((x: string) => x.replace(/\/$/, '') === tinh))
      return !(ROUTE_V3.some((y) => y.path === tinh) && hd.manCuaDuong(h, tinh) === man);   // trang con có tham số không mượn màn của trang cha
    return false;
  };

  check('HD-ROUTE · mỗi đường App.tsx vai vào được (trừ /quan-tri, /dev, /tutor) và mỗi tab Test / Công việc của vai có màn riêng; đường mới phải khai ở VAO', () => {
    assert(ROUTE_V3.length >= 15, `đọc được ${ROUTE_V3.length} đường từ App.tsx`);
    const chuaKhai = ROUTE_V3.filter((r) => !r.gate && !VAO[r.path]).map((r) => r.path);
    assert(!chuaKhai.length, `đường mới không điều kiện nav — khai vai vào được ở VAO: ${chuaKhai.join(', ')}`);
    const loi: string[] = [];
    /* Chủ SP 13/11 (PTA): vai Quản trị hệ thống giữ nội dung hiện có, không viết thêm → bỏ qua `qt` ở phép phủ mới (phép HD cũ của QT vẫn chạy). */
    for (const vai of Object.keys(hd.HUONG_DAN).filter((v) => v !== 'qt')) for (const p of MAU[vai]) {
      const nav: any = navOf(p);
      for (const r of ROUTE_V3) {
        if (!(r.gate ? r.gate.some((k) => nav[k]) : VAO[r.path](nav, p))) continue;
        for (const d of duongCua(r, nav)) if (!coManDung(hd.HUONG_DAN[vai], r, d)) loi.push(`${vai} ${d}`);
      }
    }
    soCho([...new Set(loi)], ' /');
  });

  /*
   * HD-PANEL: panel LÀM VIỆC có mục riêng (`KhungPanel hd=…`, `PANEL_HD`). VAI_PANEL = vai mở được panel đó (quyền máy chủ + nút web — lý do mỗi
   * dòng); mọi vai đó phải có mục (hoặc nằm ở CHO_B / CHO_C). Mỗi giá trị phải có `hd="…"` thật trong web/src và ngược lại.
   */
  const VAI_PANEL: Record<string, string[]> = {
    'ngan-case': ['gv', 'ql', 'tvv', 'cx'],                       // Case trong hồ sơ HV: TVV / CX xem (`laTvvCx`, NganCase)
    'nhap-diem': ['gv', 'ql', 'admin'],                           // `score.edit` theo phân công · QL nhập hộ · Admin nhóm Chấm điểm
    'ket-qua-pa': ['gv', 'ql'],                                   // `kiemQuyenPa`: người giữ kết quả hoặc `sos.edit` (cases.ts)
    'phoi-hop-sos': ['gv', 'ql', 'tvv'],                          // GVCN xác nhận (`requireManageDiscipline`), QL làm thẳng; TVV ghi KQ Meeting (`phoi_hop_tvv`)
    'vi-pham': ['gv', 'ql'],                                      // VIOLATION_RECORD: mọi GV có phân công lớp · anyScope
    'xu-ly-vi-pham': ['gv', 'ql'],                                // DISCIPLINE_MANAGE: GVCN lớp đang học · anyScope
    'ban-giao': ['gv', 'ql'],                                     // GVBM môn mình, GVCN gom + xác nhận; QL xác nhận thay
    'bao-cao-ph': ['gv', 'ql'],                                   // `quyenBc`: viết = GV đúng phần (GVCN phần Chung) · QL viết hộ (panel đọc không có hd)
    'chuyen-lop': ['gv', 'ql'],                                   // GVCN Đề xuất chuyển lớp; QL chuyển (một em, nhiều em)
    'xuat-excel': ['gv', 'ql', 'admin'],                          // `xuatMt` (phamViXuatMt): GVCN lớp mình · QL chi nhánh · Admin
    'lo-trinh': ['ql', 'tvv'],                                    // Lộ trình mới sau thi: TVV của em, QL (PanelBuocTiep: GVCN chỉ đọc)
    'duyet': ['ql'],                                              // REQUEST_APPROVE: hộp Chờ bạn duyệt, ô Tổng quan
    'sua-thong-tin': ['gv', 'ql', 'admin', 'tvv', 'cx'],          // ⋯ › Sửa thông tin (GVCN, TVV, CX, Admin, QL) · GVBM Đề xuất sửa thông tin…
    'sua-ca-lop': ['gv', 'ql', 'tvv', 'cx'],                      // Hồ sơ lớp ⋯ › Sửa thông tin học viên (`coTheSuaCaLop` = student.edit)
    'sau-thi': ['gv', 'ql', 'tvv', 'cx'],                         // Kết quả thi thật (GVCN, CX ghi), Sau thi / Bước tiếp (TVV, QL)
    'chot-ngay-thi': ['ql', 'tvv'],                               // việc TVV Chốt ngày thi; em không TVV → QL
    'xep-lich-mt': ['ql', 'admin'],                               // Xếp lịch Mock Test / Xếp lịch Test (testPlan)
    'them-hv': ['gv', 'ql', 'tvv', 'cx'],                         // + Học viên (student.add: GVCN lớp mình) — chỗ duy nhất còn Dán Excel
    'xuat-ds': ['gv', 'ql', 'admin', 'tvv', 'cx'],                // Học viên & Lớp › Xuất Excel (mọi vai xem HV)
    'bao-ph': ['ql', 'tvv'],                                      // việc TVV Báo PH vi phạm; QL làm thay
    'xet-lai': ['ql'],                                            // Xét lại lộ trình (QL chi nhánh lớp em đang học)
  };
  check('HD-PANEL · mỗi PANEL_HD có hd="…" trong web/src, có vai mở; mọi vai mở được panel có mục riêng của panel đó', () => {
    const dung = new Set<string>();
    const quet = (thuMuc: string) => {
      for (const f of fs.readdirSync(thuMuc, { withFileTypes: true })) {
        const p = path.join(thuMuc, f.name);
        if (f.isDirectory()) { quet(p); continue; }
        if (!/\.tsx$/.test(f.name)) continue;
        const src = fs.readFileSync(p, 'utf8');
        if (src.includes('<KhungPanel')) for (const m of src.matchAll(/(?<![\w-])hd="([\w-]+)"/g)) dung.add(m[1]);
      }
    };
    quet(path.join(ROOT, 'web/src'));
    const ds: string[] = [...hd.PANEL_HD];
    assert(ds.length >= 2 && new Set(ds).size === ds.length, `PANEL_HD: ${ds}`);
    for (const x of dung) assert(ds.includes(x), `KhungPanel hd="${x}" không có trong PANEL_HD`);
    const loi: string[] = [];
    for (const p of ds) {
      assert(dung.has(p), `PANEL_HD "${p}" không có KhungPanel hd="${p}" nào trong web/src`);
      assert(VAI_PANEL[p]?.length, `"${p}" chưa khai vai mở được ở VAI_PANEL`);
      for (const vai of VAI_PANEL[p]) if (!hd.manCuaPanel(hd.HUONG_DAN[vai], p)) loi.push(`${vai} panel:${p}`);
    }
    soCho(loi, ' panel:');
    for (const x of CHO) assert(CHO_B.includes(x) ? /^(ql|admin) / .test(x) : /^(tvv|cx|ht) /.test(x), `"${x}" sai danh sách (B: ql admin · C: tvv cx ht)`);
  });

  /*
   * HD-NHAN: chữ đậm `<b>…</b>` trong bước / Chỉ cho tôi là NHÃN NÚT — phải có trong chuỗi của web/src + shared + server/src (trừ huongDan, tests), bỏ "…", " ›" cuối.
   * Vai đã đối chiếu: B / C thêm vai của mình vào NHAN_VAI. MAU_CHU = chữ mẫu không phải nhãn (mã tuần, phím, số hạn).
   */
  const NHAN_VAI = ['gv'];
  const MAU_CHU = new Set(['-', '?', '/', 'Ctrl K', 'Enter', 'Esc', '‹ W3 SEP ›', 'W2 OCT', '2 tuần', '5 ngày', '3 ngày', '10', '8', 'Thứ Ba', 'Thứ Tư', '⋯']);
  check('HD-NHAN · chữ đậm trong hướng dẫn (vai đã đối chiếu) là nhãn có thật trong nguồn web', () => {
    let nguon = '';
    const doc = (thuMuc: string) => {
      for (const f of fs.readdirSync(thuMuc, { withFileTypes: true })) {
        const p = path.join(thuMuc, f.name);
        if (f.isDirectory()) { if (f.name !== 'huongDan' && f.name !== 'tests') doc(p); continue; }
        /* Chỉ chuỗi + chữ JSX (không chú thích): nhãn nằm trong t('…') hoặc giữa thẻ. */
        if (/\.tsx?$/.test(f.name)) for (const m of fs.readFileSync(p, 'utf8').matchAll(/'(?:[^'\\\n]|\\.)*'|"(?:[^"\\\n]|\\.)*"|`[^`]*`|>([^<>{}]+)</g)) nguon += `${m[0]}\n`;
      }
    };
    doc(path.join(ROOT, 'web/src')); doc(path.join(ROOT, 'shared')); doc(path.join(ROOT, 'server/src'));   // tên dòng việc do máy chủ dựng (mywork.ts)
    const loi: string[] = [];
    for (const vai of NHAN_VAI) {
      const h = hd.HUONG_DAN[vai];
      const chu = [...hd.moiMuc(h).flatMap((m: any) => [...m.buoc, m.chi?.chu]), ...(h.lam ?? []).map((v: any) => v.loiChinh.chi?.chu)].filter(Boolean).join('\n');
      for (const m of chu.matchAll(/<b>([^<]+)<\/b>/g)) {
        const x = m[1].trim();
        if (MAU_CHU.has(x)) continue;
        const goc = x.replace(/…$/, '').replace(/ ›$/, '').replace(/^⋯ › /, '').trim();
        const phan = goc.split(/ · | › /).map((s) => s.trim()).filter((s) => s && !MAU_CHU.has(s) && !/^n \S+$/.test(s));   // "· n bài" = số
        for (const s of phan) if (!nguon.includes(s)) loi.push(`${vai}: "${s}"`);
      }
    }
    assert(!loi.length, `nhãn không có trong web: ${[...new Set(loi)].join(' · ')}`);
  });

  await checkAsync('HD-CO · /demo/session có laGvcn / coS theo phân công còn hiệu lực (0 câu thêm — cùng principal)', async () => {
    const may = createApp().listen(0);
    const cong = (may.address() as any).port as number;
    try {
      const phien = async (userId: number) => {
        const s = await fetch(`http://127.0.0.1:${cong}/api/demo/session`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ userId }) });
        const cookie = (s.headers.get('set-cookie') ?? '').split(';')[0];
        return (await (await fetch(`http://127.0.0.1:${cong}/api/demo/session`, { headers: { cookie } })).json()) as any;
      };
      const cn = await phien(P.coreTeacher.userId);
      assert(cn.laGvcn === true, `GVCN mẫu: laGvcn ${cn.laGvcn}`);
      const bm = await phien(P.subjectTeacher.userId);
      const coCore = P.subjectTeacher.assignments.some((a: any) => a.isCore && (!a.effectiveTo || a.effectiveTo >= TODAY) && a.effectiveFrom <= TODAY);
      assert(bm.laGvcn === coCore, `GVBM mẫu: laGvcn ${bm.laGvcn}`);
      assert(typeof bm.coS === 'boolean' && typeof cn.coS === 'boolean', 'coS là boolean');
    } finally { may.close(); }
  });

  /* ---------------------------------------------------------------- HD-NHO */
  const GV = P.subjectTeacher.userId as number;
  const cot = () => (conn.prepare('SELECT da_xem_huong_dan FROM users WHERE id = ?').get(GV) as any).da_xem_huong_dan;
  check('HD-NHO · migrate prHd chạy lặp được (lần hai không làm gì)', () => {
    const a: string[] = [];
    migratePrHd(conn, a);
    migratePrHd(conn, a);
    assert(a.length === 0, `cột đã có từ schema, không được thêm lại: ${a.join(' · ')}`);
    assert(cot() === null, 'tài khoản demo chưa mở hướng dẫn');
  });

  await checkAsync('HD-NHO · PATCH /me/profile { daXemHuongDan: true } nhớ theo tài khoản; /demo/session trả lại; giá trị khác → 400', async () => {
    const may = createApp().listen(0);
    const cong = (may.address() as any).port as number;
    try {
      const s = await fetch(`http://127.0.0.1:${cong}/api/demo/session`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ userId: GV }) });
      const cookie = (s.headers.get('set-cookie') ?? '').split(';')[0];
      const goi = (url: string, init: RequestInit = {}) => fetch(`http://127.0.0.1:${cong}/api${url}`, { ...init, headers: { 'content-type': 'application/json', cookie } });
      assert(((await (await goi('/demo/session')).json()) as any).daXemHuongDan === false, 'chưa mở → false');
      const sai = await goi('/me/profile', { method: 'PATCH', body: JSON.stringify({ daXemHuongDan: 'co' }) });
      assert(sai.status === 400, `giá trị lạ phải 400 (${sai.status})`);
      const r = await goi('/me/profile', { method: 'PATCH', body: JSON.stringify({ daXemHuongDan: true }) });
      assert(r.ok, `PATCH ${r.status}`);
      assert(cot() === 1, `cột = ${cot()}`);
      assert(((await (await goi('/demo/session')).json()) as any).daXemHuongDan === true, 'đã mở → true');
    } finally {
      may.close();
      conn.prepare('UPDATE users SET da_xem_huong_dan = NULL WHERE id = ?').run(GV);
    }
  });
}
