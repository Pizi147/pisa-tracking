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
    ...(nav.analysis ? ['/phan-tich'] : []), ...(nav.admin ? ['/quan-tri'] : []),
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
    const CHI_VAI: [string, string, string[]][] = [['/cong-viec', 'tq-lop-toi-day', ['gv']], ['/', 'tq-can-xu-ly', ['ql']], ['/', 'tq-lop-chu-y', ['ql']]];
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
