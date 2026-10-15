/**
 * PHÉP KIỂM HD-a (Hướng dẫn trên web, đặc tả docs/superpowers/specs/2026-10-15-ov13-sua-loi-tinh-nang-design.md mục 4):
 *   HD-NAV  mỗi đường trong thanh điều hướng (khu vực + tab Test + tab Công việc + Hồ sơ cá nhân + Hướng dẫn) của vai có hướng dẫn đều có mục
 *           "Theo màn" — thêm màn / tab mà quên viết mục → đỏ.
 *   HD-VIEC mỗi vai đúng 5 việc hằng tuần (chủ SP 15/10).
 *   HD-CHI  mỗi "Chỉ cho tôi" trỏ `data-hd` có thật trong mã web (quét nguồn) và mở trang có mục — đổi / xoá phần tử → đỏ.
 *   HD-NHO  dải "Mới dùng PISA?" nhớ theo tài khoản: PATCH /me/profile { daXemHuongDan: true } → /demo/session; giá trị lạ → 400;
 *           migrate prHd chạy lặp được.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '..');

export async function runPrHdTests(t: any) {
  const { check, checkAsync, assert, conn, P } = t;
  const hd: any = await import('../../../shared/huongDan/index.ts');
  const dh: any = await import('../../../shared/domain/dieuHuong.ts');
  const { navOf } = await import('../platform/nav.ts');
  const { migratePrHd } = await import('../migrate/prHd.ts');
  const { createApp } = await import('../app.ts');
  console.log('\nHD-a · Hướng dẫn trên web · mục theo màn · Chỉ cho tôi · nhớ dải Mới dùng');

  /* Vai có hướng dẫn → tài khoản mẫu để dựng thanh điều hướng thật (`navOf`). HD-b thêm vai thì thêm tài khoản ở đây. */
  const MAU: Record<string, any[]> = { gv: [P.coreTeacher, P.subjectTeacher] };
  const duongNav = (nav: any): string[] => [
    ...dh.khuVucHienThi(nav).map((k: any) => k.to),
    ...dh.tabTestHienThi(nav).map((k: string) => dh.DUONG_TAB_TEST[k]),
    ...dh.tabCongViecHienThi(nav).map((k: string) => dh.DUONG_TAB_CONG_VIEC[k]),
    '/ho-so-ca-nhan', '/huong-dan',
  ];

  check('HD-NAV · mỗi vai có hướng dẫn đều có tài khoản mẫu; mỗi đường trên thanh điều hướng của vai đó có mục Theo màn', () => {
    const loi: string[] = [];
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

  check('HD-VIEC · mỗi vai đúng 5 việc hằng tuần, mỗi việc 2–4 bước; GV có đủ 4 phần', () => {
    for (const [vai, h] of Object.entries(hd.HUONG_DAN) as [string, any][]) {
      assert(h.viec.length === 5, `${vai}: ${h.viec.length} việc`);
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
    const loi: string[] = [];
    for (const [vai, h] of Object.entries(hd.HUONG_DAN) as [string, any][]) {
      for (const m of hd.moiMuc(h)) {
        if (!m.chi) continue;
        for (const x of [m.chi.hd].flat()) if (!co.has(x)) loi.push(`${vai} ${m.id}: data-hd="${x}" không có trong web/src`);
        if (m.chi.duong && !hd.manCuaDuong(h, m.chi.duong)) loi.push(`${vai} ${m.id}: trang ${m.chi.duong} không có mục`);
      }
    }
    assert(loi.length === 0, loi.join(' · '));
    assert(hd.moiMuc(hd.HUONG_DAN.gv).filter((m: any) => m.chi).length >= 5, 'GV: mỗi việc hằng tuần có Chỉ cho tôi');
  });

  check('HD-TIM · tìm không dấu ("han") ra mục có chữ "hạn"; chữ lạ → rỗng', () => {
    const gv = hd.HUONG_DAN.gv;
    const chu = (k: string) => k;
    assert(hd.locHd(gv, 'han', chu).luat.length > 0, 'tìm "han"');
    const ten = (h: any) => hd.moiMuc(h).map((m: any) => m.id);
    assert(!ten(hd.locHd(gv, 'han', chu)).includes('nhan-xet'), '"han" không khớp giữa từ ("nhận xét")');
    assert(ten(hd.locHd(gv, 'hạn', chu)).includes('han-xac-nhan') && !ten(hd.locHd(gv, 'hạn', chu)).includes('lop-gop-y'), 'gõ có dấu so đúng dấu ("hạn" ≠ "hàng")');
    assert(ten(hd.locHd(gv, 'ket qua pa', chu)).includes('ket-qua-pa'), 'nhiều từ không dấu');
    assert(hd.locHd(gv, 'zzqq', chu).viec.length === 0, 'chữ lạ');
    assert(hd.locHd(gv, '', chu).viec.length === 5, 'rỗng = đủ');
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
