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

  const hanhTrinhSvc = await import('../students/hanhTrinh.ts');
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
    /* PR-VAI-b: hồ sơ HV không còn "Mốc học tập" (episodes) — kiểm cả hồ sơ lẫn Hành trình không còn link Case cũ. */
    const { hanhTrinhHocVien } = hanhTrinhSvc;
    assert(!JSON.stringify(tap).includes('/hoc-thuat/case/') && !JSON.stringify(hanhTrinhHocVien(P.admin, c.sid, null)).includes('/hoc-thuat/case/'), 'hồ sơ HV còn link cũ /hoc-thuat/case/');
  });

  check('Pb2-a (2) · quét nguồn: không còn goc=danh-sach, DanhSachCase, DanhSachBoQuen ở web/src, shared; file DanhSachBoQuen.tsx đã xoá', () => {
    const lo: string[] = [];
    for (const { file, dong } of [...quetNguon('shared'), ...quetNguon('web/src')]) {
      dong.forEach((l, i) => { if (/goc=danh-sach|DanhSachCase|DanhSachBoQuen/.test(l)) lo.push(`${file}:${i + 1}`); });
    }
    assert(!lo.length, `còn: ${lo.join(', ')}`);
    assert(!fsMod.existsSync(pathMod.join(REPO, 'web/src/modules/phanTich/DanhSachBoQuen.tsx')), 'DanhSachBoQuen.tsx còn');
    /* OV-15e: Phân tích là trang riêng (`PhanTichPage`) — import PhanTich thẳng, không qua CaseBoard. */
    const ov = fsMod.readFileSync(pathMod.join(REPO, 'web/src/modules/phanTich/PhanTichPage.tsx'), 'utf8');
    assert(/import \{ PhanTich \} from '\.\/PhanTich\.tsx'/.test(ov) && !/CaseBoard/.test(ov), 'PhanTichPage import PhanTich thẳng');
    const rt = fsMod.readFileSync(pathMod.join(REPO, 'web/src/modules/cases/CaseBoardPage.tsx'), 'utf8');
    assert(/<Navigate replace to=\{duongHoSoHocVien\(/.test(rt), 'CaseRoutePage chuyển hướng về hồ sơ HV');
  });

  // ================================================================== khối 3 · Hiệu quả PA (T61, K1-23, P9, P9b, P12)
  const hq: any = await import('../phanTich/hieuQuaPa.ts');
  const eff: any = await import('../cases/effectiveness.ts');
  const boi = (fn: () => unknown): number => { try { fn(); return 200; } catch (e: any) { return e?.status ?? 500; } };
  const lopFt = classId('MB FT 101'), lopTh = classId('MB FOU 12');
  const gvX = get(`SELECT user_id AS id FROM teacher_assignments WHERE class_id = ? AND is_core = 1 LIMIT 1`, lopFt).id as number;
  const gvCp = get(`SELECT ta.user_id AS id FROM teacher_assignments ta JOIN classes c ON c.id = ta.class_id JOIN branches b ON b.id = c.branch_id
    WHERE b.code = 'CP' AND ta.status = 'active' AND ta.user_id NOT IN (SELECT ta2.user_id FROM teacher_assignments ta2 JOIN classes c2 ON c2.id = ta2.class_id WHERE c2.branch_id = ?) LIMIT 1`, mbId)?.id as number | undefined;
  const now = new Date().toISOString();
  const XONG = addDays(TODAY, -3), BD = addDays(TODAY, -24);
  const F = (o: Record<string, unknown> = {}) => ({ branchId: null, ct: 'ft', classId: null, soTuan: 8, ...o });
  const L = (o: Record<string, unknown> = {}) => ({ branchIds: null, ct: 'ft', classId: null, tu: d.tuDauKhoang(TODAY, 8), den: null, ...o });
  const tao = { hv: [] as number[], ca: [] as number[], pa: [] as number[], cyc: [] as number[], luot: [] as number[] };
  const hv = (cid: number) => {
    const b = get('SELECT branch_id FROM classes WHERE id = ?', cid).branch_id;
    const ma = `PB2A-${Date.now()}-${tao.hv.length}`;
    const sid = Number(conn.prepare(`INSERT INTO students (student_code, full_name, normalized_name, branch_id, status, created_at) VALUES (?,?,?,?, 'active', ?)`)
      .run(ma, `Học viên ${ma}`, `hoc vien ${ma.toLowerCase()}`, b, now).lastInsertRowid);
    conn.prepare(`INSERT INTO enrollments (student_id, class_id, status, started_at, created_at) VALUES (?,?, 'active', '2026-07-27', ?)`).run(sid, cid, now);
    tao.hv.push(sid); return sid;
  };
  const ca = (sid: number, cat: string, o: { owner?: number | null; sos?: number | null; loi?: string } = {}) => {
    const id = Number(conn.prepare(`INSERT INTO sos_cases (student_id, category, status, sos_level, owner_user_id, closed_at, created_at) VALUES (?,?, 'done', ?, ?, ?, ?)`)
      .run(sid, cat, o.sos ?? null, o.owner ?? null, XONG, now).lastInsertRowid);
    if (o.loi) conn.prepare(`INSERT INTO case_issues (case_id, role, taxonomy_code, created_at) VALUES (?, 'primary', ?, ?)`).run(id, o.loi, now);
    tao.ca.push(id); return id;
  };
  const pa = (caseId: number, o: { kind: string; preset?: 0 | 1; kq?: string | null; nhom?: string | null; status?: string; closedReason?: string | null }) => {
    const id = Number(conn.prepare(
      `INSERT INTO case_interventions (case_id, kind, status, started_date, completed_date, preset, confirmed_at, nhom_bo_tro, closed_reason, created_at)
       VALUES (?,?,?,?,?,?,?,?,?,?)`).run(caseId, o.kind, o.status ?? 'completed', BD, XONG, o.preset ?? 0, o.preset ? now : null, o.nhom ?? null, o.closedReason ?? null, now).lastInsertRowid);
    if (o.kq) conn.prepare(`INSERT INTO case_followups (case_id, intervention_id, observed_on, outcome, created_at) VALUES (?,?,?,?,?)`).run(caseId, id, XONG, o.kq, now);
    tao.pa.push(id); return id;
  };
  /** Bài Cuối khoá gốc + dòng Mini Test (`ty_le` 0–1, null = chưa ghi) → trả khoá nhóm `mt:{bài}`. */
  const miniTest = (sid: number, tyLe: number | null) => {
    const cyc = Number(conn.prepare(`INSERT INTO learning_cycles (student_id, seq, route, programme_code, started_at, status, created_at) VALUES (?, 1, 'LT1', 'FOU', '2026-07-27', 'active', ?)`).run(sid, now).lastInsertRowid);
    const luot = Number(conn.prepare(`INSERT INTO assessment_attempts (cycle_id, student_id, attempt_no, kind, class_id, status, created_at) VALUES (?, ?, 1, 'final', ?, 'planned', ?)`)
      .run(cyc, sid, lopTh, now).lastInsertRowid);
    tao.cyc.push(cyc); tao.luot.push(luot);
    conn.prepare(`INSERT INTO mini_test (student_id, cycle_id, tu_attempt_id, nhom_bo_tro, so_buoi, ngay_du_kien, han, ty_le, ngay_lam) VALUES (?,?,?,?, 4, ?, ?, ?, ?)`)
      .run(sid, cyc, luot, `mt:${luot}`, XONG, XONG, tyLe, tyLe === null ? null : XONG);
    return `mt:${luot}`;
  };
  const don = () => {
    for (const id of tao.pa) { conn.prepare('DELETE FROM case_followups WHERE intervention_id = ?').run(id); conn.prepare('DELETE FROM case_interventions WHERE id = ?').run(id); }
    for (const id of tao.ca) { conn.prepare('DELETE FROM case_issues WHERE case_id = ?').run(id); conn.prepare('DELETE FROM sos_cases WHERE id = ?').run(id); }
    for (const id of tao.luot) { conn.prepare('DELETE FROM mini_test WHERE tu_attempt_id = ?').run(id); conn.prepare('DELETE FROM assessment_attempts WHERE id = ?').run(id); }
    for (const id of tao.cyc) conn.prepare('DELETE FROM learning_cycles WHERE id = ?').run(id);
    for (const id of tao.hv) { conn.prepare('DELETE FROM enrollments WHERE student_id = ?').run(id); conn.prepare('DELETE FROM students WHERE id = ?').run(id); }
  };
  /** Mọi dòng (lớn + con) của một phần. */
  const moiDong = (hang: any[]): any[] => hang.flatMap((h) => [h, ...(h.con ?? [])]);
  const idsO = (p: any, f: any, dong: string, cot = 'pa') => (hq.oHieuQuaPa(p, { ...f, dong, cot }).rows as any[]).map((r) => r.id as number);

  try {
    const s1 = hv(lopFt);
    const c1 = ca(s1, 'speaking', { owner: gvX, sos: 2, loi: 'student.speaking.fluency' });
    const c2 = ca(s1, 'listening', { owner: gvX, sos: 1 });
    const A = pa(c1, { kind: 'tutor', kq: 'improved' });                       // GV thêm
    const B = pa(c1, { kind: 'self_study', preset: 1, kq: 'improved' });        // quy chế · SOS 2
    const C = pa(c2, { kind: 'teaching_adjust', preset: 1, kq: 'unchanged' });  // quy chế · SOS 1
    const D = pa(c1, { kind: 'extra_homework', status: 'cancelled', closedReason: 'khong_theo_doi' });   // huỷ "không cần theo dõi"
    const s2 = hv(lopTh), s3 = hv(lopTh), s4 = hv(lopTh);
    const c3 = ca(s2, 'writing'), c4 = ca(s3, 'writing'), c5 = ca(s4, 'writing');
    const E = pa(c3, { kind: 'bo_tro_mien_phi', preset: 1, nhom: miniTest(s2, 0.75) });   // Mini Test 75 % → Tiến bộ
    const Fp = pa(c3, { kind: 'bo_tro', preset: 1, nhom: `gk:${c3}`, kq: 'improved' });  // Bổ trợ Progress Test
    const G = pa(c4, { kind: 'bo_tro_mien_phi', preset: 1, nhom: miniTest(s3, 0.6) });    // 60 % → Không tiến bộ
    const H = pa(c5, { kind: 'bo_tro_mien_phi', preset: 1, nhom: miniTest(s4, null) });   // chưa ghi → chưa ghi kết quả

    check('Pb2-a (3) · hai phần tách đúng: preset=1 (gồm Bổ trợ) chỉ ở quy chế, preset=0 chỉ ở GV thêm; quy chế không "Nên dùng"; Σ khớp paCoKetQua', () => {
      const k = hq.hieuQuaPa(P.admin, F());
      const coKq = hq.paCoKetQua(L()) as any[];
      assert(coKq.find((x) => x.id === A)?.quyChe === false && coKq.find((x) => x.id === B)?.quyChe === true, 'cờ quyChe');
      assert(idsO(P.admin, F(), 'vd:student.speaking.fluency').includes(A) && !idsO(P.admin, F(), 'vd:student.speaking.fluency').includes(B), 'A ở GV thêm, B không');
      assert(idsO(P.admin, F(), 'qc:sos2').includes(B) && idsO(P.admin, F(), 'qc:sos1').includes(C) && !idsO(P.admin, F(), 'qc:sos2').includes(A), 'B ở SOS 2, C ở SOS 1');
      assert(moiDong(k.quyChe.hang).every((h) => !h.nenDung), 'quy chế không Nên dùng');
      assert(k.quyChe.hang.map((h: any) => h.khoa).join() === ['qc:sos1', 'qc:sos2', 'qc:sos3', 'qc:khac'].filter((x) => k.quyChe.hang.some((h: any) => h.khoa === x)).join(), 'thứ tự cố định SOS 1·2·3');
      assert(k.quyChe.tomTat.paCoKetQua === coKq.filter((x) => x.quyChe).length, `Σ quy chế ${k.quyChe.tomTat.paCoKetQua} ≠ ${coKq.filter((x) => x.quyChe).length}`);
      const coLoi = new Set((conn.prepare(`SELECT DISTINCT case_id FROM case_issues WHERE role = 'primary'`).all() as any[]).map((r) => r.case_id));
      const gvThem = coKq.filter((x) => !x.quyChe && coLoi.has(x.caseId) && x.category !== 'tong_hop').length;
      assert(k.gvThem.tomTat.paCoKetQua === gvThem, `Σ GV thêm ${k.gvThem.tomTat.paCoKetQua} ≠ ${gvThem}`);
      assert(k.quyChe.tomTat.paCoKetQua + gvThem + coKq.filter((x) => !x.quyChe && !(coLoi.has(x.caseId) && x.category !== 'tong_hop')).length === coKq.length, 'hai phần + chưa phân loại = mọi PA có kết quả');
    });

    check('Pb2-a (3) · PA huỷ "không cần theo dõi" không vào Số PA, không vào "chưa ghi kết quả"', () => {
      assert(!(hq.paCoKetQua(L()) as any[]).some((x) => x.id === D), 'D trong Số PA');
      assert(!idsO(P.admin, F(), 'chua-ghi-ket-qua').includes(D), 'D trong chưa ghi kết quả');
    });

    check('Pb2-a (3) · Mini Test (Q9): nhóm mt: 75 % → cải thiện, 60 % → không tiến bộ, chưa ghi → "chưa ghi kết quả"; lớp thường Bổ trợ Progress Test / sau Final Test, không chữ SOS', () => {
      const Ft = F({ ct: 'thuong' });
      const k = hq.hieuQuaPa(P.admin, Ft);
      assert(idsO(P.admin, Ft, 'qc:mt', 'cai-thien').includes(E) && !idsO(P.admin, Ft, 'qc:mt', 'cai-thien').includes(G), 'E cải thiện, G không');
      assert(idsO(P.admin, Ft, 'qc:mt').includes(G) && idsO(P.admin, Ft, 'qc:gk').includes(Fp), 'G vào Số PA; F ở Progress Test');
      assert(idsO(P.admin, Ft, 'chua-ghi-ket-qua').includes(H), 'H chưa ghi kết quả');
      assert(!JSON.stringify(k.quyChe).includes('SOS'), 'lớp thường không chữ SOS');
      assert(k.quyChe.hang.find((h: any) => h.khoa === 'qc:mt')?.nhan === 'Bổ trợ sau Final Test', 'nhãn');
    });

    check('Pb2-a (3) · tuanTrungVi([7, 14, 70]) = 2; ([]) = null; loiKhoangTuan', () => {
      assert(d.tuanTrungVi([7, 14, 70]) === 2 && d.tuanTrungVi([]) === null, 'trung vị');
      assert(d.loiKhoangTuan('2026-08-31', '2026-09-14') === null && d.loiKhoangTuan('2026-09-01', null) !== null
        && d.loiKhoangTuan('2026-09-14', '2026-08-31') !== null && d.loiKhoangTuan('2025-01-06', '2026-09-14') === null, 'loiKhoangTuan (P9: không trần)');
    });

    check('Pb2-a (3) · lọc gv: mọi PA thuộc Case do X phụ trách; GV thêm với gv=X = PA preset=0 (đã phân loại) của Case của X; tên GV từ máy chủ', () => {
      const k = hq.hieuQuaPa(P.admin, F({ gv: gvX }));
      const coKq = hq.paCoKetQua(L({ gv: gvX })) as any[];
      assert(coKq.length > 0 && coKq.every((x) => x.chuCase === gvX), 'paCoKetQua(gv) chỉ PA của Case X phụ trách');
      assert(coKq.some((x) => x.id === A) && coKq.some((x) => x.id === B), 'có A và B');
      const coLoi = new Set((conn.prepare(`SELECT DISTINCT case_id FROM case_issues WHERE role = 'primary'`).all() as any[]).map((r) => r.case_id));
      assert(k.gvThem.tomTat.paCoKetQua === coKq.filter((x) => !x.quyChe && coLoi.has(x.caseId) && x.category !== 'tong_hop').length, 'GV thêm với gv');
      assert(k.quyChe.tomTat.paCoKetQua === coKq.filter((x) => x.quyChe).length, 'quy chế với gv');
      assert(k.loc.gv?.id === gvX && typeof k.loc.gv?.ten === 'string' && k.loc.gv.ten.length > 0, 'tên GV từ API');
      assert(boi(() => hq.hieuQuaPa(P.admin, F({ gv: 'abc' }))) === 400 && boi(() => hq.hieuQuaPa(P.admin, F({ gv: '-1' }))) === 400, 'gv sai → 400');
    });

    check('Pb2-a (3) · PHỦ ĐỊNH: QL Monbay lọc gv là người chỉ dạy chi nhánh khác → rỗng, không lộ tên', () => {
      assert(gvCp, 'dữ liệu demo có GV chỉ dạy CP');
      const k = hq.hieuQuaPa(P.mbManager, F({ gv: gvCp }));
      assert(k.gvThem.tomTat.paCoKetQua === 0 && k.quyChe.tomTat.paCoKetQua === 0 && k.chuaGhiKetQua === 0 && k.loc.gv === null, JSON.stringify(k.loc));
    });

    check('Pb2-a (3) · tu/den → đúng tập planOutcomes({ fromDate, toDate = Chủ nhật tuần den }); tu > den, không phải Thứ Hai, thiếu tu → 400', () => {
      const tu = d.mondayOfDate(addDays(TODAY, -21)), den = d.mondayOfDate(TODAY);
      const a = (hq.paCoKetQua(L({ tu, den })) as any[]).map((x) => x.id);
      const b = (eff.planOutcomes({ branchIds: null, ratio: false, classId: null, fromDate: tu, toDate: addDays(den, 6) }) as any[])
        .filter((x) => x.group !== 'undetermined').map((x) => x.id);
      assert(sx(a) === sx(b) && a.includes(A), 'cùng tập planOutcomes');
      const k = hq.hieuQuaPa(P.admin, F({ tu, den, soTuan: 4 }));
      assert(k.loc.theoKhoang && k.loc.tu === tu && k.loc.den === den, 'tu/den thắng tg');
      for (const [x, y] of [[den, tu], ['2026-09-01', den]] as const) assert(boi(() => hq.hieuQuaPa(P.admin, F({ tu: x, den: y }))) === 400, `${x}…${y} → 400`);
      assert(boi(() => hq.hieuQuaPa(P.admin, F({ den }))) === 400, 'thiếu tu → 400');
    });

    check('Pb2-a (3) · hai đường: mỗi ô (Số PA, Học viên, Có cải thiện) của CẢ HAI phần = số dòng khi bấm; chân bảng cũng vậy', () => {
      let dem = 0;
      for (const f of [F(), F({ ct: 'thuong' }), F({ gv: gvX })]) {
        const k = hq.hieuQuaPa(P.admin, f);
        for (const h of [...moiDong(k.gvThem.hang), ...moiDong(k.gvThem.gom?.hang ?? []), ...moiDong(k.quyChe.hang)]) {
          for (const [cot, want] of [['pa', h.soPa], ['cai-thien', h.caiThien], ['hv', h.hocVien]] as const) {
            const o = hq.oHieuQuaPa(P.admin, { ...f, dong: h.khoa, cot });
            assert(o.n === want && o.rows.length === want, `${h.khoa} · ${cot}: ${o.n} ≠ ${want}`);
            dem++;
          }
        }
        for (const [dong, want] of [['chua-ghi-ket-qua', k.chuaGhiKetQua], ['case-chua-phan-loai', k.caseChuaPhanLoai], ['chua-ro-nguon', k.chuaRoNguon]] as const) {
          assert(hq.oHieuQuaPa(P.admin, { ...f, dong, cot: 'pa' }).n === want, `${dong}`);
        }
      }
      assert(dem > 10, 'phép kiểm không rỗng');
    });

    await checkAsync('Pb2-a (3) · qua HTTP: tên tham số gv/tu/den đúng Hợp đồng; GVCN 403; tu sai 400', async () => {
      await voiMay(async (goi) => {
        const tu = d.mondayOfDate(addDays(TODAY, -21)), den = d.mondayOfDate(TODAY);
        const r = await goi(P.mbManager.userId, `/phan-tich/hieu-qua-pa?branchId=${mbId}&ct=ft&gv=${gvX}&tu=${tu}&den=${den}`);
        assert(r.status === 200 && r.body.loc.gv?.id === gvX && r.body.loc.theoKhoang, `${r.status} ${JSON.stringify(r.body.loc)}`);
        const o = await goi(P.mbManager.userId, `/phan-tich/hieu-qua-pa/o?branchId=${mbId}&ct=ft&gv=${gvX}&tu=${tu}&den=${den}&dong=chua-ghi-ket-qua&cot=pa`);
        assert(o.status === 200, `ô ${o.status}`);
        assert((await goi(P.coreTeacher.userId, `/phan-tich/hieu-qua-pa?ct=ft&gv=${gvX}`)).status === 403, 'GVCN → 403');
        assert((await goi(P.mbManager.userId, `/phan-tich/hieu-qua-pa?ct=ft&tu=2026-09-02`)).status === 400, 'tu không phải Thứ Hai → 400');
      });
    });
  } finally { don(); }

  // ================================================================== khối 4 · Tổng hợp Test lớp thường (P4, K1-19)
  const th: any = await import('../phanTich/tongHop.ts');
  const T = (o: Record<string, unknown> = {}) => ({ branchId: null, ct: 'thuong', soTuan: 52, classId: null, theo: 'dot', ...o });
  const moiDongTh = (hang: any[]): any[] => hang.flatMap((h) => [h, ...(h.con ?? [])]);

  check('Pb2-a (4) · phanLoaiBaiThuong: Final Test 44/57/66/82 % → 4 dải (cùng daiCuoiKhoa); Progress Test 0/1/2 môn trượt; chưa đủ → chuaDu', () => {
    const ev = (tyLeTong: number | null, truot = 0, complete = true) => ({ complete, tyLeTong, skills: Object.fromEntries(['l', 'r', 'w', 's'].map((k, i) => [k, { under: i < truot }])) });
    const ck = [0.44, 0.57, 0.66, 0.82].map((x) => th.phanLoaiBaiThuong('final', ev(x)));
    assert(ck.join() === 'ck-duoi50,ck-50,ck-60,ck-dat', ck.join());
    assert(['duoi_50', '50_59', '60_69', 'dat'].join() === [0.44, 0.57, 0.66, 0.82].map((x) => d.daiCuoiKhoa(x)).join(), 'cùng daiCuoiKhoa');
    assert([0, 1, 2, 3].map((n) => th.phanLoaiBaiThuong('progress', ev(null, n))).join() === 'gk-dat,gk-1,gk-2,gk-2', 'Progress Test theo môn');
    assert(th.phanLoaiBaiThuong('progress', ev(null, 1, false)) === 'chuaDu' && th.phanLoaiBaiThuong('final', ev(null)) === 'chuaDu', 'chưa đủ');
  });

  check('Pb2-a (4) · MB BE 04 + MB FOU 21: mỗi bài rơi đúng một cột — Σ Giữa + Cuối + Chưa đủ = Bài ở mọi dòng và Tổng; cột không có bài → coDot', () => {
    let coBai = 0;
    for (const lop of ['MB BE 04', 'MB FOU 21']) for (const theo of ['dot', 'lop', 'tuan']) {
      const k = th.tongHop(P.admin, T({ classId: classId(lop), theo }));
      const cong = d.cotKetQuaCong('thuong') as string[];
      for (const r of [...moiDongTh(k.hang), { nhan: 'Tổng', o: k.tong }]) {
        const s = cong.reduce((n, c) => n + (r.o[c] ?? 0), 0);
        assert(s === r.o.luot, `${lop}/${theo} "${r.nhan}": ${s} ≠ ${r.o.luot}`);
      }
      coBai += k.tong.luot;
    }
    assert(coBai > 0, 'phép kiểm không rỗng');
    const k = th.tongHop(P.admin, T());
    const giua = k.hang.find((h: any) => h.khoa === 'dot:giua');
    assert(!giua || (giua.coDot?.giua === true && giua.coDot?.cuoi === false), `dòng chỉ Progress Test: ${JSON.stringify(giua?.coDot)}`);
    assert(k.tongCoDot && typeof k.tongCoDot.giua === 'boolean', 'tongCoDot');
    const kFt = th.tongHop(P.admin, T({ ct: 'ft' }));
    assert(kFt.hang.every((h: any) => h.coDot === undefined) && kFt.tongCoDot === undefined, 'FT không có coDot');
  });

  check('Pb2-a (4) · khung FT: cột KHÔNG đổi; lớp thường không chữ SOS, không cột kỹ năng', () => {
    const ft = d.cotTongHopFor('ft').map((c: any) => c.khoa).filter((k: string) => !k.startsWith('kn:'));
    assert(ft.join() === 'luot,dat,sos1,sos2,sos3,chuaDu,hvCase,choDuyet,dangLam', ft.join());
    const tc = d.cotTongHopFor('thuong');
    assert(tc.map((c: any) => c.khoa).join() === 'luot,gk-dat,gk-1,gk-2,ck-duoi50,ck-50,ck-60,ck-dat,cp-dat,cp-1,cp-2,chuaDu,mini-dat,mini-truot,hvCase,choDuyet,dangLam',
      tc.map((c: any) => c.khoa).join());
    assert(!tc.some((c: any) => /SOS/.test(c.nhan('thuong') + c.goiY)), 'không chữ SOS');
  });

  check('Pb2-a (4) · Mini Test 75 % → mini-dat ở dòng bài Final Test gốc; bấm ô ra đúng em (oTongHop = đường SQL thứ hai)', () => {
    const tu = d.tuDauKhoang(TODAY, 52), den = d.mondayOfDate(TODAY);
    const a = get(`SELECT a.id, a.student_id, a.cycle_id FROM assessment_attempts a JOIN classes c ON c.id = a.class_id JOIN report_periods rp ON rp.id = a.planned_period_id
      JOIN learning_cycles cy ON cy.id = a.cycle_id
      WHERE c.is_fast_track = 0 AND a.kind = 'final' AND a.status != 'cancelled' AND rp.week_start >= ? AND rp.week_start <= ?
        AND COALESCE(cy.khong_cam_ket, 0) = 0 AND EXISTS (SELECT 1 FROM assessment_scores s WHERE s.attempt_id = a.id AND (s.band IS NOT NULL OR s.raw_score IS NOT NULL))
        AND NOT EXISTS (SELECT 1 FROM mini_test m WHERE m.tu_attempt_id = a.id AND m.student_id = a.student_id) LIMIT 1`, tu, den);
    assert(a, 'bộ demo có bài Final Test lớp thường đã chấm trong 52 tuần');
    const id = Number(conn.prepare(`INSERT INTO mini_test (student_id, cycle_id, tu_attempt_id, nhom_bo_tro, so_buoi, ngay_du_kien, han, ty_le, ngay_lam) VALUES (?,?,?,?, 4, ?, ?, 0.75, ?)`)
      .run(a.student_id, a.cycle_id, a.id, `mt:${a.id}`, TODAY, TODAY, TODAY).lastInsertRowid);
    try {
      const k = th.tongHop(P.admin, T());
      const cuoi = k.hang.find((h: any) => h.khoa === 'dot:cuoi');
      assert(cuoi && cuoi.o['mini-dat'] >= 1, `dòng Final Test: ${JSON.stringify(cuoi?.o)}`);
      const o = th.oTongHop(P.admin, { ...T(), khoa: 'dot:cuoi', cot: 'mini-dat' });
      assert(o.n === cuoi.o['mini-dat'] && o.rows.some((r: any) => r.id === a.student_id), 'bấm ô ra đúng em');
      const sql = (conn.prepare(`SELECT DISTINCT m.student_id AS id FROM mini_test m JOIN assessment_attempts a ON a.id = m.tu_attempt_id JOIN classes c ON c.id = a.class_id
        JOIN report_periods rp ON rp.id = a.planned_period_id JOIN learning_cycles cy ON cy.id = a.cycle_id
        WHERE c.is_fast_track = 0 AND a.kind = 'final' AND a.status != 'cancelled' AND rp.week_start >= ? AND rp.week_start <= ? AND COALESCE(cy.khong_cam_ket, 0) = 0
          AND m.ty_le >= 0.7 AND EXISTS (SELECT 1 FROM assessment_scores s WHERE s.attempt_id = a.id AND (s.band IS NOT NULL OR s.raw_score IS NOT NULL))`).all(tu, den) as any[]).map((r) => r.id as number);
      assert(sx(o.rows.map((r: any) => r.id)) === sx(sql), `hai đường lệch: ${sx(o.rows.map((r: any) => r.id))} ≠ ${sx(sql)}`);
      const giua = k.hang.find((h: any) => h.khoa === 'dot:giua');
      assert(!giua || !giua.o['mini-dat'], 'Mini Test không rơi vào dòng Progress Test');
    } finally { conn.prepare('DELETE FROM mini_test WHERE id = ?').run(id); }
  });

  check('Pb2-a (4) · Excel cùng cột: đầu đề tầng trên Progress Test / Final Test / Mini Test; ô không áp dụng "—"; KCK vẫn ngoài mẫu số (cùng vòng luotKck)', () => {
    const k = th.tongHop(P.admin, T());
    const aoa = d.bangXuatTongHop(k, new Set(['ket-qua', 'xu-ly']), 'thử') as any[][];
    assert(aoa[2].includes('Progress Test (theo môn)') && aoa[2].includes('Final Test (% tổng)') && aoa[2].includes('Mini Test'), JSON.stringify(aoa[2]));
    assert(aoa[3].includes('Dưới 50%') && aoa[3].includes('Từ 70%') && !aoa[3].some((x: any) => /SOS/.test(String(x))), JSON.stringify(aoa[3]));
    const giua = k.hang.findIndex((h: any) => h.khoa === 'dot:giua');
    if (giua >= 0) {
      const dong = aoa[4 + giua + k.hang.slice(0, giua).reduce((n: number, h: any) => n + (h.con?.length ?? 0), 0)];
      assert(dong.includes('—'), `dòng Progress Test có ô "—": ${JSON.stringify(dong)}`);
    }
    const src = fsMod.readFileSync(pathMod.join(REPO, 'server/src/phanTich/tongHop.ts'), 'utf8');
    assert(src.indexOf('luotKck(a)) continue') < src.indexOf('phanLoaiBaiThuong(a.kind, ev)'), 'KCK bị loại trước khi phân loại');
  });
}
