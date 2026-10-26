/**
 * PHÉP KIỂM R1-NO-NHO (kế hoạch docs/superpowers/plans/2026-10-27-r1-no-nho.md, D14):
 *  GOPY-KHOA · góp ý tuần chỉ đọc — PUT mọi vai 403, GET 200 dữ liệu cũ y nguyên, bảng không đổi.
 */
import type { YThucTestKit } from './yThuc.tests.ts';

export async function runR1NoNhoTests(t: YThucTestKit) {
  const { checkAsync, assert, conn, P, TODAY } = t;
  const { createApp } = await import('../app.ts');
  const { xoaNho } = await import('../platform/nguCanhRequest.ts');
  const week: any = await import('../platform/week.ts');
  const one = (sql: string, ...a: unknown[]) => conn.prepare(sql).get(...a) as any;
  const lop = one(`SELECT id FROM classes WHERE code = 'MB FT 101'`).id as number;
  const em = one(`SELECT student_id FROM enrollments WHERE class_id = ? AND status = 'active' ORDER BY student_id LIMIT 1`, lop).student_id as number;

  const may = createApp().listen(0);
  const cong = (may.address() as any).port as number;
  const phien = new Map<number, string>();
  const goi = async (userId: number, url: string, method = 'GET', body?: unknown) => {
    if (!phien.has(userId)) {
      const s = await fetch(`http://127.0.0.1:${cong}/api/demo/session`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ userId }) });
      phien.set(userId, (s.headers.get('set-cookie') ?? '').split(';')[0]);
    }
    xoaNho();
    const r = await fetch(`http://127.0.0.1:${cong}/api${url}`, { method, headers: { 'content-type': 'application/json', cookie: phien.get(userId)! },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
    return { status: r.status, json: await r.json().catch(() => null) as any };
  };

  try {
    await checkAsync('R1-NO-NHO · GOPY-KHOA: PUT góp ý tuần — QL, GVCN, GV dạy kỹ năng, Quản trị → 403 "chỉ đọc"; GET 200 dữ liệu cũ y nguyên; bảng không đổi', async () => {
      /* Giao dịch cuộn lại: không đụng góp ý sẵn có của em (UNIQUE em × lớp × tuần × kỹ năng). */
      conn.exec('BEGIN IMMEDIATE');
      try {
        conn.prepare(`INSERT INTO gop_y_tuan (student_id, class_id, period_id, skill, noi_dung, ghi_boi, ghi_luc) VALUES (?,?,?, 'listening', 'Góp ý cũ R1', ?, ?)
          ON CONFLICT(student_id, class_id, period_id, skill) DO UPDATE SET noi_dung = excluded.noi_dung, ghi_boi = excluded.ghi_boi`)
          .run(em, lop, week.ensurePeriod(TODAY).id, P.coreTeacher.userId, '2026-10-01T00:00:00Z');
        const dem = () => one('SELECT COUNT(*) n FROM gop_y_tuan').n as number;
        const truoc = dem();
        for (const [ten, p, skill] of [['QL', P.mbManager, 'listening'], ['GVCN', P.coreTeacher, 'listening'], ['GV W1', P.w1Teacher, 'writing'], ['Quản trị', P.admin, 'reading']] as const) {
          const r = await goi(p.userId, `/classes/${lop}/gop-y`, 'PUT', { studentId: em, tuan: TODAY, skill, noiDung: `${ten} thử ghi` });
          assert(r.status === 403 && JSON.stringify(r.json).includes('Góp ý tuần đã chuyển sang chỉ đọc.'), `${ten}: ${r.status} ${JSON.stringify(r.json)}`);
        }
        assert(dem() === truoc, `số dòng gop_y_tuan đổi: ${truoc} → ${dem()}`);
        const g = await goi(P.mbManager.userId, `/classes/${lop}/gop-y?tuan=${TODAY}`);
        const o = (g.json?.o ?? []).find((x: any) => x.studentId === em && x.skill === 'listening');
        assert(g.status === 200 && o?.noiDung === 'Góp ý cũ R1' && o.ghiBoi === P.coreTeacher.fullName, `GET: ${g.status} ${JSON.stringify(o)}`);
      } finally { conn.exec('ROLLBACK'); xoaNho(); }
    });
  } finally { may.close(); }
}
