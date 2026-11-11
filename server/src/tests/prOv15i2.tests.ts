/**
 * PHÉP KIỂM OV-15i2 (kế hoạch 2026-10-20-ov15i-viec-le.md mục OV-15i2) — Dán Excel (thử lại không ghi trùng mục tổng, trần lệnh theo môn, lớp thường
 * khớp email, Hoàn tác "- → x" FT), bỏ `viewer.huyLuot`, Xuất điểm Test (cột Lớp trong phạm vi người xuất), ô chọn tutor theo lớp của nhóm PA.
 * Chạy cuối `run.ts` (trước TD7b). Phần gọi hàm thẳng chạy trong giao dịch cuộn lại; phần qua HTTP dựng lớp / em riêng.
 */
import type { YThucTestKit } from './yThuc.tests.ts';

export async function runPrOv15i2Tests(t: YThucTestKit) {
  const { check, checkAsync, assert, assertThrows, conn, TODAY, P, addDays } = t as any;
  const svc: any = await import('../fasttrack/attempts.ts');
  const regular: any = await import('../normal/regular.ts');
  const keHoach: any = await import('../keHoach/keHoachTest.ts');
  const chonSvc: any = await import('../tutors/chon.ts');
  const intake: any = await import('../classes/intake.ts');
  const week: any = await import('../platform/week.ts');
  const util: any = await import('../util.ts');
  const { getConfig, setConfig } = await import('../demoConfig.ts');
  const { createApp } = await import('../app.ts');
  const { xoaNho } = await import('../platform/nguCanhRequest.ts');
  console.log('\nOV-15i2 · Dán Excel, huyLuot, xuất điểm Test, ô chọn tutor theo lớp');

  const one = (sql: string, ...a: unknown[]) => conn.prepare(sql).get(...a) as any;
  const thu = <T>(fn: () => T): T => { conn.exec('BEGIN IMMEDIATE'); try { xoaNho(); return fn(); } finally { conn.exec('ROLLBACK'); xoaNho(); } };
  const maLoi = (fn: () => unknown): number | string => { try { fn(); return 'không ném'; } catch (e: any) { return e?.status ?? String(e?.message ?? e); } };
  const QL = P.mbManager;
  const LOP = t.classId('MB FT 101');
  const NX = 'Nghe tốt phần 1 và 2';
  /** Lượt MT của MB FT 101 có Listening đã tới tuần thi — xoá ô L để dán lại. */
  const luotL = (n: number) => {
    const ds = conn.prepare(`SELECT a.id FROM assessment_attempts a
      JOIN attempt_skills k ON k.attempt_id = a.id AND k.skill = 'listening' AND k.required = 1 AND k.sit_status NOT IN ('cancelled','absent')
      JOIN report_periods pr ON pr.id = k.planned_period_id AND pr.week_start <= ?
      WHERE a.class_id = ? AND a.kind = 'mock' AND a.status <> 'cancelled' AND COALESCE(a.lich_su, 0) = 0 ORDER BY a.id LIMIT ?`).all(TODAY, LOP, n) as any[];
    assert(ds.length === n, `dữ liệu demo: cần ${n} lượt MT có L tới tuần thi (${ds.length})`);
    for (const r of ds) conn.prepare(`DELETE FROM assessment_scores WHERE attempt_id = ? AND skill = 'listening'`).run(r.id);
    return ds.map((r) => r.id as number);
  };

  check('I2-3 · Lưới lớp thường gửi email em', () => thu(() => {
    const lop = one(`SELECT c.id FROM classes c JOIN programmes pg ON pg.code = c.programme_code
      WHERE pg.scoring_mode = 'ratio' AND EXISTS (SELECT 1 FROM assessment_attempts a WHERE a.class_id = c.id AND a.status <> 'cancelled') ORDER BY c.id LIMIT 1`);
    assert(lop, 'dữ liệu demo: cần lớp thường có bài');
    const r0 = regular.regularSheet(P.admin, lop.id).rows[0];
    conn.prepare('UPDATE students SET email = ? WHERE id = ?').run('em.i2@gmail.com', r0.studentId);
    const r = regular.regularSheet(P.admin, lop.id).rows.find((x: any) => x.studentId === r0.studentId);
    assert(r.studentEmail === 'em.i2@gmail.com', `studentEmail: ${JSON.stringify(r.studentEmail)}`);
  }));

  check('I2-4 · Hồ sơ lượt Test không còn `viewer.huyLuot` (web không đọc; Mock / MT0 luôn null)', () => {
    for (const kind of ['mock', 'progress']) {
      const a = one(`SELECT id FROM assessment_attempts WHERE kind = ? AND status <> 'cancelled' AND class_id IS NOT NULL ORDER BY id LIMIT 1`, kind);
      assert(a, `dữ liệu demo: cần lượt ${kind}`);
      const v = svc.attemptDetail(P.admin, a.id).viewer;
      assert(!('huyLuot' in v), `${kind}: viewer còn huyLuot`);
    }
  });

  check('I2-9 · /tutors/chon?classId: gợi ý theo chi nhánh LỚP của nhóm PA (không theo lớp em đang học); ngoài phạm vi lớp → 403', () => {
    const khac = one(`SELECT c.id, b.name FROM classes c JOIN branches b ON b.id = c.branch_id WHERE b.code <> 'MB' AND c.status = 'active' ORDER BY c.id LIMIT 1`);
    assert(khac, 'dữ liệu demo: cần lớp chi nhánh khác MB');
    const mb = chonSvc.chonTutor(QL, { classId: LOP });
    assert(mb.ds.some((r: any) => r.goiY && r.ten === 'Nguyễn Thu Lan') && mb.nhomGoiY?.startsWith(one(`SELECT b.name FROM branches b WHERE b.code = 'MB'`).name),
      `lớp MB: ${JSON.stringify(mb.ds.filter((r: any) => r.goiY))} · ${mb.nhomGoiY}`);
    const kh = chonSvc.chonTutor(P.admin, { classId: khac.id });
    assert(!kh.ds.some((r: any) => r.goiY && r.ten === 'Nguyễn Thu Lan') && kh.nhomGoiY?.startsWith(khac.name), `lớp ${khac.name}: ${kh.nhomGoiY}`);
    assert(maLoi(() => chonSvc.chonTutor(QL, { classId: khac.id })) === 403, 'QL MB · lớp chi nhánh khác → 403');
    assert(maLoi(() => chonSvc.chonTutor(P.lrTeacher, { classId: khac.id })) === 403, 'GV · lớp không dạy → 403');
  });

  // ------------------------------------------------------------------ ý 6 · Xuất điểm Test (qua HTTP: xếp lượt như web)
  const MB = one(`SELECT id FROM branches WHERE code = 'MB'`).id as number;
  const { id: KHAC, code: MA_KHAC } = one(`SELECT id, code FROM branches WHERE code <> 'MB' ORDER BY id LIMIT 1`) as { id: number; code: string };
  const NOW = new Date().toISOString();
  const T2 = week.mondayOf(TODAY) as string;
  const tuan = (thuHai: string) => week.ensurePeriod(thuHai).id as number;
  const lopFt = (code: string, branchId: number) => {
    const start = addDays(T2, -7 * 10);
    return intake.createClass(P.admin, { code, branchId, kind: 'FT', isFastTrack: true, route: 'LT1', startDate: start, startPeriodId: tuan(start) }).id as number;
  };
  async function voiMayChu(fn: (goi: (userId: number, url: string, init?: RequestInit) => Promise<Response>) => Promise<void>) {
    const cu = getConfig('demo_date');
    const may = createApp().listen(0);
    const cong = (may.address() as any).port as number;
    const phien = new Map<number, string>();
    const goi = async (userId: number, url: string, init: RequestInit = {}) => {
      if (!phien.has(userId)) {
        const s = await fetch(`http://127.0.0.1:${cong}/api/demo/session`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ userId }) });
        phien.set(userId, (s.headers.get('set-cookie') ?? '').split(';')[0]);
      }
      return fetch(`http://127.0.0.1:${cong}/api${url}`, { ...init, headers: { 'content-type': 'application/json', cookie: phien.get(userId)!, ...(init.headers ?? {}) } });
    };
    try { setConfig('demo_date', TODAY); xoaNho(); await fn(goi); } finally { may.close(); setConfig('demo_date', cu); xoaNho(); }
  }
  const json = async (r: Response): Promise<any> => { const x = await r.json().catch(() => null); if (!r.ok) throw new Error(`${r.status} ${JSON.stringify(x)}`); return x; };
  const post = (body: unknown): RequestInit => ({ method: 'POST', body: JSON.stringify(body) });

  await checkAsync('I2-6 · Xuất điểm Test: cột Lớp không in mã lớp ngoài phạm vi người xuất (em từng học lớp chi nhánh khác); QL chi nhánh kia vẫn thấy đủ', async () => {
    const mb = lopFt('MB I2 XD 01', MB), kh = lopFt(`${MA_KHAC} I2 XD 01`, KHAC);
    const ten = 'Lương Thị Thảo';
    const sid = Number(conn.prepare(`INSERT INTO students (student_code, full_name, normalized_name, email, branch_id, status, created_at) VALUES (?,?,?,?,?, 'active', ?)`)
      .run('PISA-I2-XD', ten, util.normalizeName(ten), 'thao.i2@gmail.com', MB, NOW).lastInsertRowid);
    const bd = addDays(T2, -7 * 10);
    conn.prepare(`INSERT INTO enrollments (student_id, class_id, status, started_at, created_at) VALUES (?,?, 'active', ?, ?)`).run(sid, mb, bd, NOW);
    conn.prepare(`INSERT INTO learning_cycles (student_id, seq, route, programme_code, target_score, start_period_id, started_at, status, created_at)
      VALUES (?,1,'LT1','FT',6.5,?,?, 'active', ?)`).run(sid, tuan(bd), bd, NOW);
    const KN = ['listening', 'reading', 'writing', 'speaking'];
    await voiMayChu(async (goi) => {
      const xep = async (n: number, thuHai: string) => (await json(await goi(P.admin.userId, '/ke-hoach-test/xep-moi', post({
        studentId: sid, attemptNo: n, tuan: Object.fromEntries(KN.map((k) => [k, tuan(thuHai)])), force: true }))));
      const m1 = (await xep(1, addDays(T2, 7))).id as number;
      await xep(2, addDays(T2, 14));
      conn.prepare('UPDATE assessment_attempts SET class_id = ? WHERE id = ?').run(kh, m1);   // MT1 thi ở lớp chi nhánh khác
      /* G1-08: Xuất điểm Test gộp vào /xuat-mt — cột Lớp (index 3) = lớp của lượt, chỉ lượt trong phạm vi người xuất (không lộ lớp chi nhánh khác). */
      const xuat = (u: number, b: number, l: number) => goi(u, '/xuat-mt', post({ chiNhanh: [b], lop: [l], tg: 'dot', dot: ['mt:1', 'mt:2'], cot: 'gon' }));
      const lopCua = (r: any) => r.sheets[0].aoa.filter((h: any[]) => h[0] === ten).map((h: any[]) => h[3]);
      const r = await json(await xuat(QL.userId, MB, mb));
      assert(lopCua(r).join('|') === 'MB I2 XD 01', `QL MB: cột Lớp = ${JSON.stringify(lopCua(r))}`);
      const ra = await json(await xuat(P.admin.userId, KHAC, kh));
      assert(lopCua(ra).join('|') === `${MA_KHAC} I2 XD 01`, `Admin: cột Lớp = lớp của lượt = ${JSON.stringify(lopCua(ra))}`);
    });
  });
}
