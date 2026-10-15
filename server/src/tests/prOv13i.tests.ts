/**
 * PHÉP KIỂM OV-13i (chủ SP 15/10) — TVV / CX dùng "Sửa thông tin cả lớp" ở hồ sơ lớp, gồm cả Target. Qua HTTP thật:
 * đúng phạm vi → 200 + nhật ký; đổi Target thiếu lý do → 400; trường ngoài CHI_SUA_THONG_TIN → 403; lớp ngoài phạm vi → 403; cờ nút đúng vai.
 */
import type { YThucTestKit } from './yThuc.tests.ts';

export async function runPrOv13iTests(t: YThucTestKit) {
  const { checkAsync, assert, conn, P } = t;
  const d = await import('../../../shared/domain/index.ts');
  const { createApp } = await import('../app.ts');
  const accounts: any = await import('../platform/accounts.ts');
  console.log('\nOV-13i · TVV / CX sửa thông tin cả lớp (kể cả Target)');

  const get = (sql: string, ...a: unknown[]) => conn.prepare(sql).get(...a) as any;
  const all = (sql: string, ...a: unknown[]) => conn.prepare(sql).all(...a) as any[];
  let seq = 0;
  const tao = (roles: { role: string; branches: string[] }[]) => {
    seq += 1;
    return accounts.createAccount(P.admin, { email: `ov13i.${seq}${accounts.EMAIL_SUFFIX}`, password: 'matkhau-ov13i', fullName: `Thử OV13i ${seq}`, roles }).userId as number;
  };
  const TVV = tao([{ role: 'consultant', branches: ['MB'] }]);
  const TVV_CP = tao([{ role: 'consultant', branches: ['CP'] }]);
  const CX = tao([{ role: 'cx', branches: [] }]);
  const ft = t.classId('MB FT 101');
  const em = [...new Map(all(
    `SELECT s.id AS sid, cy.id AS cid, cy.target_score, cy.khong_cam_ket FROM enrollments e JOIN students s ON s.id = e.student_id
       JOIN learning_cycles cy ON cy.student_id = s.id AND cy.status = 'active'
      WHERE e.class_id = ? AND e.status = 'active' ORDER BY s.id, cy.seq`, ft).map((r) => [r.sid, r] as const)).values()];
  const soAudit = (sid: number) => get(`SELECT COUNT(*) n FROM audit_logs WHERE action = 'student.update' AND entity_id = ?`, sid).n as number;
  const soRev = (cid: number) => get('SELECT COUNT(*) n FROM cycle_target_revisions WHERE cycle_id = ?', cid).n as number;
  const ten = (sid: number) => get('SELECT full_name FROM students WHERE id = ?', sid).full_name as string;

  const may = createApp().listen(0);
  const cong = (may.address() as any).port as number;
  const phien = new Map<number, string>();
  const goi = async (userId: number, url: string, body?: unknown) => {
    if (!phien.has(userId)) {
      const s = await fetch(`http://127.0.0.1:${cong}/api/demo/session`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ userId }) });
      phien.set(userId, (s.headers.get('set-cookie') ?? '').split(';')[0]);
    }
    const r = await fetch(`http://127.0.0.1:${cong}/api${url}`, body === undefined ? { headers: { cookie: phien.get(userId)! } }
      : { method: 'POST', body: JSON.stringify(body), headers: { 'content-type': 'application/json', cookie: phien.get(userId)! } });
    return { status: r.status, json: await r.json().catch(() => null) as any };
  };
  const luu = (u: number, body: unknown) => goi(u, `/classes/${ft}/sua-ca-lop`, body);
  let k = 0;
  const khoa = () => `ov13i-${++k}`;
  const tgMoi = (x: any) => (x.target_score === 7 ? 6.5 : 7);

  try {
    await checkAsync('OV13i-1 · cờ nút coTheSuaCaLop + dữ liệu panel: TVV MB, CX, QL có (coTheSuaTarget); GVBM, TVV CP không (GET panel 403)', async () => {
      assert(em.length >= 4, `seed: MB FT 101 cần ≥ 4 em có lộ trình, có ${em.length}`);
      for (const [vai, u, co] of [['TVV MB', TVV, true], ['CX', CX, true], ['QL', P.mbManager.userId, true], ['GVBM', P.w1Teacher.userId, false], ['TVV CP', TVV_CP, false]] as const) {
        const o = await goi(u, `/classes/${ft}/overview`);
        assert(o.status === 200 ? !!o.json.viewer.coTheSuaCaLop === co : !co, `${vai}: overview ${o.status} cờ ${o.json?.viewer?.coTheSuaCaLop}`);
        const pn = await goi(u, `/classes/${ft}/sua-ca-lop`);
        assert(co ? pn.status === 200 && pn.json.coTheSuaTarget === true : pn.status === 403, `${vai}: panel ${pn.status} ${JSON.stringify(pn.json)?.slice(0, 160)}`);
      }
      const gv = await goi(P.coreTeacher.userId, `/classes/${ft}/sua-ca-lop`);
      assert(gv.status === 200 && gv.json.coTheSuaTarget === false && gv.json.chiThongTin === false, 'GVCN như cũ: sửa được, Target khoá');
      const tv = await goi(TVV, `/classes/${ft}/sua-ca-lop`);
      assert(tv.json.chiThongTin === true, 'TVV: cột Tuần bắt đầu khoá (chiThongTin)');
    });

    await checkAsync('OV13i-2 · TVV MB sửa họ tên + dự kiến thi + Target (có lý do) → 200, audit student.update, dòng cycle_target_revisions', async () => {
      const [a, b] = em;
      const [au, rv] = [soAudit(a.sid), soRev(b.cid)];
      const pv = await goi(TVV, `/classes/${ft}/sua-ca-lop/xem-truoc`, { rows: [{ studentId: a.sid, fullName: 'OV13i TVV Đổi' }, { studentId: b.sid, target: tgMoi(b) }] });
      assert(pv.status === 200 && pv.json.rows.every((x: any) => !x.issues.length), `${pv.status} ${JSON.stringify(pv.json)}`);
      const r = await luu(TVV, { idempotencyKey: khoa(), lyDoTarget: 'Phụ huynh đổi kế hoạch', rows: [
        { studentId: a.sid, fullName: 'OV13i TVV Đổi', examDate: '06/2027' }, { studentId: b.sid, target: tgMoi(b) },
      ] });
      assert(r.status === 200 && r.json.daSua === 2, `${r.status} ${JSON.stringify(r.json)}`);
      assert(ten(a.sid) === 'OV13i TVV Đổi' && soAudit(a.sid) === au + 1, 'họ tên + nhật ký');
      const rev = get('SELECT * FROM cycle_target_revisions WHERE cycle_id = ? ORDER BY id DESC LIMIT 1', b.cid);
      assert(soRev(b.cid) === rv + 1 && rev.new_target === tgMoi(b) && rev.reason === 'Phụ huynh đổi kế hoạch' && rev.actor_user_id === TVV, JSON.stringify(rev));
    });

    await checkAsync('OV13i-3 · CX sửa Target (có lý do) → 200 + nhật ký; thiếu lý do → 400 "Ghi lý do đổi Target."', async () => {
      const c = em[2];
      const r0 = await luu(CX, { idempotencyKey: khoa(), rows: [{ studentId: c.sid, target: tgMoi(c) }] });
      assert(r0.status === 400 && r0.json.error === 'Ghi lý do đổi Target.', `${r0.status} ${JSON.stringify(r0.json)}`);
      const rv = soRev(c.cid);
      const r1 = await luu(CX, { idempotencyKey: khoa(), lyDoTarget: 'Em xin đổi mục tiêu', rows: [{ studentId: c.sid, target: tgMoi(c), email: 'ov13i.cx@demo.test' }] });
      assert(r1.status === 200 && r1.json.daSua === 1 && soRev(c.cid) === rv + 1, `${r1.status} ${JSON.stringify(r1.json)}`);
    });

    await checkAsync('OV13i-4 · TVV gửi Tuần bắt đầu (ngoài CHI_SUA_THONG_TIN) → 403 ở xem trước và lưu, không ghi gì', async () => {
      const a = em[3];
      const truoc = ten(a.sid);
      for (const url of [`/classes/${ft}/sua-ca-lop/xem-truoc`, `/classes/${ft}/sua-ca-lop`]) {
        const r = await goi(TVV, url, { idempotencyKey: khoa(), rows: [{ studentId: a.sid, fullName: 'OV13i Không Ghi', startWeek: '2026-10-05' }] });
        assert(r.status === 403 && r.json.error === d.CHI_SUA_THONG_TIN, `${url}: ${r.status} ${JSON.stringify(r.json)}`);
      }
      assert(ten(a.sid) === truoc, 'không ghi');
    });

    await checkAsync('OV13i-5 · TVV chi nhánh khác (CP) lưu ở lớp MB → 403, không ghi', async () => {
      const a = em[3];
      const truoc = ten(a.sid);
      const r = await luu(TVV_CP, { idempotencyKey: khoa(), rows: [{ studentId: a.sid, fullName: 'OV13i Ngoài Phạm Vi' }] });
      assert(r.status === 403 && ten(a.sid) === truoc, `${r.status} ${JSON.stringify(r.json)}`);
    });
  } finally {
    may.close();
  }
}
