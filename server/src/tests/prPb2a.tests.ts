/** PHÉP KIỂM PR-Pb2-a — bỏ "Cả hai", bỏ Danh sách Case, Hiệu quả PA tách quy chế / GV thêm, Tổng hợp Test lớp thường (kế hoạch 2026-10-01-pr-pb2 Phần A). */
import * as fsMod from 'node:fs';
import * as pathMod from 'node:path';
import { fileURLToPath } from 'node:url';
import type { YThucTestKit } from './yThuc.tests.ts';

const REPO = pathMod.resolve(fileURLToPath(new URL('../../../../', import.meta.url)));

/** Mọi file .ts/.tsx dưới `thuMuc` (bỏ `tests/`). */
function quetNguon(thuMuc: string): { file: string; dong: string[] }[] {
  const out: { file: string; dong: string[] }[] = [];
  const di = (p: string) => {
    for (const e of fsMod.readdirSync(p, { withFileTypes: true })) {
      const q = pathMod.join(p, e.name);
      if (e.isDirectory()) { if (e.name !== 'tests' && e.name !== 'node_modules') di(q); }
      else if (/\.tsx?$/.test(e.name)) out.push({ file: pathMod.relative(REPO, q), dong: fsMod.readFileSync(q, 'utf8').split('\n') });
    }
  };
  di(pathMod.join(REPO, thuMuc));
  return out;
}
const NGUON = () => [...quetNguon('shared'), ...quetNguon('server/src'), ...quetNguon('web/src')];

export async function runPrPb2aTests(t: YThucTestKit) {
  const { check, checkAsync, assert, conn, P, classId, TODAY, addDays } = t;
  const d: any = await import('../../../shared/domain/index.ts');
  const metrics: any = await import('../worklist/metrics.ts');
  const chuongTrinh: any = await import('../worklist/chuongTrinh.ts');
  const hoSo: any = await import('../giaoVien/hoSo.ts');
  const hoSoHv: any = await import('../students/profile.ts');
  const { createApp } = await import('../app.ts');
  const get = (sql: string, ...a: unknown[]) => conn.prepare(sql).get(...a) as any;
  const mbId = get(`SELECT id FROM branches WHERE code = 'MB'`).id as number;
  const sx = (xs: number[]) => [...xs].sort((a, b) => a - b).join();
  console.log('\nPR-Pb2-a · Bỏ "Cả hai" · Bỏ Danh sách Case · Hiệu quả PA · Tổng hợp lớp thường');

  /** Gọi API thật (cookie phiên demo) — đóng máy chủ trong `finally`. */
  const voiMay = async (fn: (goi: (userId: number, url: string) => Promise<{ status: number; body: any }>) => Promise<void>) => {
    const may = createApp().listen(0);
    const cong = (may.address() as any).port as number;
    const phien = new Map<number, string>();
    const goi = async (userId: number, url: string) => {
      if (!phien.has(userId)) {
        const r = await fetch(`http://127.0.0.1:${cong}/api/demo/session`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ userId }) });
        phien.set(userId, (r.headers.get('set-cookie') ?? '').split(';')[0]);
      }
      const r = await fetch(`http://127.0.0.1:${cong}/api${url}`, { headers: { cookie: phien.get(userId)! } });
      const text = await r.text();
      if (r.status >= 500) throw new Error(`${url} → ${r.status} ${text.slice(0, 300)}`);
      let body: any = null;
      try { body = JSON.parse(text); } catch { body = text; }
      return { status: r.status, body };
    };
    try { await fn(goi); } finally { may.close(); }
  };

  // ================================================================== khối 1 · bỏ "Cả hai" (T60, K1-07, K1-18, K5-43, Q31-1)
  check('Pb2-a (1) · chuongTrinhTuThamSo: vắng / ca-hai của link cũ / lạ → ft; thuong → thuong; macDinh đổi được; ctTuyChon vắng → null', () => {
    for (const s of [null, undefined, '', 'ca-hai', 'xyz']) assert(d.chuongTrinhTuThamSo(s) === 'ft', `${s} → ${d.chuongTrinhTuThamSo(s)}`);
    assert(d.chuongTrinhTuThamSo('thuong') === 'thuong' && d.chuongTrinhTuThamSo('ft') === 'ft', 'giá trị hợp lệ giữ nguyên');
    assert(d.chuongTrinhTuThamSo(null, 'thuong') === 'thuong', 'macDinh');
    assert(JSON.stringify(d.CHUONG_TRINH) === '["ft","thuong"]', 'FT trước, chỉ hai khung');
    assert(d.ctTuyChon(null) === null && d.ctTuyChon('ca-hai') === null && d.ctTuyChon('thuong') === 'thuong', 'ctTuyChon');
    assert(d.thamSoCt(null) === '' && d.thamSoCt('thuong', '?') === '?ct=thuong', 'thamSoCt');
  });

  check('Pb2-a (1) · metricSet (QL MB): chỉ số học thuật ft ⊂ không lọc; ft ∪ thuong = không lọc (phần tử có lớp)', () => {
    let coSo = 0;
    for (const id of ['case-mo', 'bai-qua-han-nhap-diem', 'hv-co-case-mo']) {
      const tat = metrics.metricSet(P.mbManager, id, { program: null });
      const ft = metrics.metricSet(P.mbManager, id, { program: 'ft' }).ids as number[];
      const th = metrics.metricSet(P.mbManager, id, { program: 'thuong' }).ids as number[];
      const all = tat.ids as number[];
      assert(ft.every((x) => all.includes(x)) && th.every((x) => all.includes(x)), `${id}: tập lọc lọt ngoài tập không lọc`);
      const lop = chuongTrinh.lopCuaTap(tat.unit, all);
      const coLop = all.filter((x) => { const l = lop.get(x); return l && l.isFt !== null; });
      assert(sx([...ft, ...th]) === sx(coLop), `${id}: ft ∪ thuong ≠ phần tử có lớp (${ft.length}+${th.length} vs ${coLop.length})`);
      coSo += all.length;
    }
    assert(coSo > 0, 'phép kiểm không rỗng');
  });

  check('Pb2-a (1) · metricSet: chỉ số Ý thức + Phối hợp SOS (CHI_SO_GOP) bằng nhau với ft, thuong, null — bỏ qua khung ở một chỗ', () => {
    for (const id of ['hv-can-xu-ly', 'vi-pham-tong', 'phoi-hop-luot-sos']) {
      assert(metrics.CHI_SO_GOP.has(id), `${id} phải thuộc CHI_SO_GOP`);
      const [a, b, c] = (['ft', 'thuong', null] as const).map((ct) => sx(metrics.metricSet(P.mbManager, id, { program: ct }).ids));
      assert(a === b && b === c, `${id}: ft/thuong/null khác nhau`);
    }
    assert(metrics.metricSet(P.admin, 'vi-pham-tong', {}).n > 0, 'vi-pham-tong có số (phép kiểm không rỗng)');
  });

  await checkAsync('Pb2-a (1) · qua HTTP: /phan-tich/y-thuc có ct=ft và không ct → cùng số; /metrics/hv-can-xu-ly cũng vậy', async () => {
    await voiMay(async (goi) => {
      const ql = P.mbManager.userId;
      const a = await goi(ql, `/phan-tich/y-thuc?branchId=${mbId}&ct=ft`);
      const b = await goi(ql, `/phan-tich/y-thuc?branchId=${mbId}`);
      assert(a.status === 200 && b.status === 200, `${a.status} ${b.status}`);
      assert(JSON.stringify(a.body) === JSON.stringify(b.body), 'Ý thức: ct=ft ≠ không ct');
      const m1 = await goi(ql, `/metrics/hv-can-xu-ly?ct=thuong`);
      const m2 = await goi(ql, `/metrics/hv-can-xu-ly`);
      assert(m1.body.n === m2.body.n, `hv-can-xu-ly: ${m1.body.n} ≠ ${m2.body.n}`);
    });
  });

  check('Pb2-a (1) · /giao-vien/{gv} không ct → có cả lớp FT lẫn lớp thường (hồ sơ GV là khối gộp)', () => {
    let gv = get(`SELECT ta.user_id AS id FROM teacher_assignments ta JOIN classes c ON c.id = ta.class_id
      WHERE ta.status = 'active' AND ta.effective_from <= ? AND (ta.effective_to IS NULL OR ta.effective_to >= ?) AND c.status = 'active' AND c.branch_id = ?
      GROUP BY ta.user_id HAVING COUNT(DISTINCT c.is_fast_track) = 2 LIMIT 1`, TODAY, TODAY, mbId)?.id as number | undefined;
    let tam: number | null = null;
    if (!gv) {
      gv = get(`SELECT user_id AS id FROM teacher_assignments WHERE class_id = ? AND is_core = 1 LIMIT 1`, classId('MB FT 101')).id as number;
      tam = Number(conn.prepare(`INSERT INTO teacher_assignments (user_id, class_id, skill, is_core, effective_from, effective_to, status, created_at)
        VALUES (?, ?, 'listening', 0, ?, NULL, 'active', ?)`).run(gv, classId('MB FOU 12'), addDays(TODAY, -30), TODAY).lastInsertRowid);
    }
    try {
      const ho = hoSo.hoSoGiaoVien(P.mbManager, gv);
      const khung = new Set(ho.lop.map((l: any) => l.khung));
      assert(khung.has('ft') && khung.has('thuong'), `hồ sơ GV ${gv}: khung ${[...khung]}`);
      const o = hoSo.oHoSoGv(P.mbManager, gv, { cot: 'lop' });
      assert(o.n === ho.lop.length, 'ô Lớp (không ct) = số lớp hồ sơ');
    } finally { if (tam) conn.prepare(`DELETE FROM teacher_assignments WHERE id = ?`).run(tam); }
  });

  check('Pb2-a (1) · quét nguồn: không còn ca-hai / "Cả hai" trong shared, server/src (trừ tests), web/src — trừ chú thích "đã bỏ"', () => {
    const lo: string[] = [];
    for (const { file, dong } of NGUON()) {
      dong.forEach((l, i) => {
        if (/đã bỏ/.test(l)) return;
        if (/ca-hai|["'`]Cả hai["'`]/.test(l)) lo.push(`${file}:${i + 1}`);
      });
    }
    assert(!lo.length, `còn: ${lo.join(', ')}`);
  });

  // ================================================================== khối 2 · bỏ Danh sách Case (T59, K1-27; P8b bỏ)
  check('Pb2-a (2) · duongMoi Q4: đường dẫn cũ của Danh sách Case đi thẳng tới đích mới, một bước; đích không chuyển lần nữa', () => {
    const ca: [string, string, string][] = [
      ['/phan-tich', '?goc=danh-sach&cn=2&ct=ft', '/phan-tich?goc=van-de&cn=2&ct=ft'],
      ['/phan-tich', '?ky-nang=reading', '/phan-tich?goc=van-de'],
      ['/phan-tich', '?tinh-hinh=no_plan&cn=3&tg=26', '/phan-tich?goc=van-de&cn=3'],
      ['/phan-tich', '?hang-doi=due&cn=2', '/cong-viec?nhom=case-hoc-thuat&loc=qua-han&nguoi=tat-ca&cn=2'],
      ['/phan-tich', '?goc=danh-sach&hang-doi=due&ct=ft', '/cong-viec?nhom=case-hoc-thuat&loc=qua-han&nguoi=tat-ca'],
      ['/phan-tich', '?hang-doi=can-ho-tro-2-lan&cn=2', '/?cn=2'],
      ['/phan-tich', '?goc=danh-sach&hang-doi=can-ho-tro-2-lan&ct=thuong', '/?ct=thuong'],
      ['/phan-tich', '?hang-doi=review', '/phan-tich?goc=van-de'],
      ['/', '?tab=tinh-hinh&ky-nang=listening', '/phan-tich?goc=van-de'],
      ['/', '?tab=tinh-hinh&hang-doi=due&cn=4', '/cong-viec?nhom=case-hoc-thuat&loc=qua-han&nguoi=tat-ca&cn=4'],
      ['/hoc-thuat', '?hang-doi=can-ho-tro-2-lan', '/'],
    ];
    for (const [p, s, want] of ca) {
      const got = d.duongMoi(p, s);
      assert(got === want, `${p}${s} → ${got}, cần ${want}`);
      const u = new URL(got, 'http://x');
      assert(d.duongMoi(u.pathname, u.search) === null, `đích ${got} còn chuyển tiếp`);
    }
    for (const [p, s] of [['/phan-tich', ''], ['/phan-tich', '?goc=van-de&cn=2'], ['/phan-tich', '?goc=hieu-qua-pa&gv=7'], ['/', '?cn=2']]) {
      assert(d.duongMoi(p, s) === null, `${p}${s} không phải đường cũ`);
    }
  });

  check('Pb2-a (2) · gocNhinTuThamSo không bao giờ trả danh-sach; GOC_NHIN không còn danh-sach', () => {
    for (const s of ['goc=danh-sach', 'hang-doi=due', 'tinh-hinh=no_plan', 'ky-nang=listening', 'goc=danh-sach&hang-doi=can-ho-tro-2-lan', '']) {
      assert(d.gocNhinTuThamSo(new URLSearchParams(s)).goc !== 'danh-sach', s);
    }
    assert(!(d.GOC_NHIN as string[]).includes('danh-sach') && !('danh-sach' in d.GOC_NHIN_LABEL), 'GOC_NHIN');
    assert(d.CAN_XU_LY.every((x: any) => !('denLoc' in x)), 'CAN_XU_LY không còn denLoc');
  });

  check('Pb2-a (2) · rowsFor Case / PA / nghĩa vụ và dòng Case của hồ sơ HV: Case có em → hồ sơ HV mở Ngăn Case, không /hoc-thuat/case/', () => {
    const c = get(`SELECT sc.id, sc.student_id AS sid, (SELECT iv.id FROM case_interventions iv WHERE iv.case_id = sc.id LIMIT 1) AS iv
      FROM sos_cases sc WHERE sc.student_id IS NOT NULL AND EXISTS (SELECT 1 FROM case_interventions iv WHERE iv.case_id = sc.id) ORDER BY sc.id LIMIT 1`);
    assert(c, 'dữ liệu demo có Case có PA');
    const dung = `/hoc-vien/${c.sid}?case=${c.id}`;
    assert(metrics.rowsFor('case', [c.id])[0]?.href === dung, `Case: ${metrics.rowsFor('case', [c.id])[0]?.href}`);
    assert(metrics.rowsFor('phuong-an', [c.iv])[0]?.href === dung, `PA: ${metrics.rowsFor('phuong-an', [c.iv])[0]?.href}`);
    assert(metrics.rowsFor('nghia-vu', [metrics.obligationId(c.iv, 1)])[0]?.href === dung, 'nghĩa vụ');
    const profile: any = hoSoHv;
    const tap = profile.studentProfile(P.admin, c.sid);
    const links = [...tap.episodes, ...tap.allEpisodes].map((e: any) => e.link).filter(Boolean);
    assert(!links.some((l: string) => l.startsWith('/hoc-thuat/case/')), `hồ sơ HV còn link cũ: ${links.filter((l: string) => l.startsWith('/hoc-thuat/case/'))}`);
  });

  check('Pb2-a (2) · quét nguồn: không còn goc=danh-sach, DanhSachCase, DanhSachBoQuen ở web/src, shared; file DanhSachBoQuen.tsx đã xoá', () => {
    const lo: string[] = [];
    for (const { file, dong } of [...quetNguon('shared'), ...quetNguon('web/src')]) {
      dong.forEach((l, i) => { if (/goc=danh-sach|DanhSachCase|DanhSachBoQuen/.test(l)) lo.push(`${file}:${i + 1}`); });
    }
    assert(!lo.length, `còn: ${lo.join(', ')}`);
    assert(!fsMod.existsSync(pathMod.join(REPO, 'web/src/modules/phanTich/DanhSachBoQuen.tsx')), 'DanhSachBoQuen.tsx còn');
    const ov = fsMod.readFileSync(pathMod.join(REPO, 'web/src/modules/worklist/OverviewPage.tsx'), 'utf8');
    assert(/import \{ PhanTich \} from '\.\.\/phanTich\/PhanTich\.tsx'/.test(ov) && !/CaseBoard/.test(ov), 'OverviewPage import PhanTich thẳng');
    const rt = fsMod.readFileSync(pathMod.join(REPO, 'web/src/modules/cases/CaseBoardPage.tsx'), 'utf8');
    assert(/<Navigate replace to=\{duongHoSoHocVien\(/.test(rt), 'CaseRoutePage chuyển hướng về hồ sơ HV');
  });
}
