/** PHÉP KIỂM PR-SL — Sửa thông tin cả lớp (Q-0310-3): xem trước + lưu MỘT giao dịch, quyền theo trường, chống gửi trùng. */
import type { YThucTestKit } from './yThuc.tests.ts';

export async function runPrSlTests(t: YThucTestKit) {
  const { checkAsync, assert, conn, P } = t;
  const d = await import('../../../shared/domain/index.ts');
  const { createApp } = await import('../app.ts');
  const { CHI_QL_SUA } = await import('../fasttrack/cycles.ts');
  console.log('\nPR-SL · Sửa thông tin cả lớp');

  const ft = t.classId('MB FT 101');
  const thuong = t.classId('MB FOU 12');
  const QL = P.mbManager.userId, GVCN = P.coreTeacher.userId;
  const get = (sql: string, ...a: unknown[]) => conn.prepare(sql).get(...a) as any;
  const all = (sql: string, ...a: unknown[]) => conn.prepare(sql).all(...a) as any[];
  const emCua = (lop: number) => all(
    `SELECT s.id AS sid, s.full_name, s.email, cy.id AS cid, cy.route, cy.target_score, rp.week_start AS tuan
       FROM enrollments e JOIN students s ON s.id = e.student_id
       JOIN learning_cycles cy ON cy.student_id = s.id AND cy.status = 'active'
       LEFT JOIN report_periods rp ON rp.id = cy.start_period_id
      WHERE e.class_id = ? AND e.status = 'active' ORDER BY s.id`, lop);
  const em = emCua(ft);
  assert(em.length >= 6, `seed: MB FT 101 cần ≥ 6 em, có ${em.length}`);
  const soAudit = (sid: number) => get(`SELECT COUNT(*) n FROM audit_logs WHERE action = 'student.update' AND entity_id = ?`, sid).n as number;
  const ten = (sid: number) => get('SELECT full_name FROM students WHERE id = ?', sid).full_name as string;

  /** Máy chủ thật + phiên demo theo người dùng (mẫu `prCt.tests.ts`). */
  const may = createApp().listen(0);
  const cong = (may.address() as any).port as number;
  const phien = new Map<number, string>();
  const goi = async (userId: number, url: string, body: unknown) => {
    if (!phien.has(userId)) {
      const s = await fetch(`http://127.0.0.1:${cong}/api/demo/session`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ userId }) });
      phien.set(userId, (s.headers.get('set-cookie') ?? '').split(';')[0]);
    }
    const r = await fetch(`http://127.0.0.1:${cong}/api${url}`, { method: 'POST', body: JSON.stringify(body), headers: { 'content-type': 'application/json', cookie: phien.get(userId)! } });
    return { status: r.status, json: await r.json().catch(() => null) as any };
  };
  const xemTruoc = (u: number, lop: number, body: unknown) => goi(u, `/classes/${lop}/sua-ca-lop/xem-truoc`, body);
  const luu = (u: number, lop: number, body: unknown) => goi(u, `/classes/${lop}/sua-ca-lop`, body);
  let k = 0;
  const khoa = () => `sl-test-${++k}`;

  try {
    await checkAsync('SL-1 (1) · sửa họ tên 2 em + email 1 em → daSua 2, DB đổi đúng, 2 dòng audit student.update', async () => {
      const [a, b] = em;
      const truoc = [soAudit(a.sid), soAudit(b.sid)];
      const r = await luu(QL, ft, { idempotencyKey: khoa(), rows: [
        { studentId: a.sid, fullName: 'SL Một Đổi', email: 'SL.Mot@Demo.test' },
        { studentId: b.sid, fullName: 'SL Hai Đổi' },
      ] });
      assert(r.status === 200 && r.json.daSua === 2, `${r.status} ${JSON.stringify(r.json)}`);
      const sa = get('SELECT full_name, email, normalized_name FROM students WHERE id = ?', a.sid);
      assert(sa.full_name === 'SL Một Đổi' && sa.email === 'sl.mot@demo.test', JSON.stringify(sa));
      assert(ten(b.sid) === 'SL Hai Đổi', ten(b.sid));
      assert(soAudit(a.sid) === truoc[0] + 1 && soAudit(b.sid) === truoc[1] + 1, 'mỗi em đúng một dòng audit student.update');
    });

    await checkAsync('SL-1 (2) · một email sai → xem trước báo lỗi đúng dòng; lưu → 400, không dòng nào được ghi', async () => {
      const [a, b] = [em[2], em[3]];
      const rows = [{ studentId: a.sid, fullName: 'SL Ba Không Ghi' }, { studentId: b.sid, email: 'sai-dang' }];
      const pv = await xemTruoc(QL, ft, { rows });
      assert(pv.status === 200, `${pv.status} ${JSON.stringify(pv.json)}`);
      const dongB = pv.json.rows.find((x: any) => x.studentId === b.sid);
      const dongA = pv.json.rows.find((x: any) => x.studentId === a.sid);
      assert(dongB?.issues.some((i: any) => i.field === 'email' && i.muc === 'loi'), JSON.stringify(pv.json.rows));
      assert(!dongA?.issues.length, 'dòng đúng không có lỗi: ' + JSON.stringify(dongA));
      const tenA = ten(a.sid);
      const r = await luu(QL, ft, { idempotencyKey: khoa(), rows });
      assert(r.status === 400, `${r.status} ${JSON.stringify(r.json)}`);
      assert(ten(a.sid) === tenA, 'dòng đúng KHÔNG được ghi khi lô có lỗi');
    });

    await checkAsync('SL-1 (3) · đổi Target thiếu lý do → 400 "Ghi lý do đổi Target."; có lý do → thêm dòng cycle_target_revisions hôm nay', async () => {
      const a = em[4];
      const moi = a.target_score === 7 ? 6.5 : 7;
      const r0 = await luu(QL, ft, { idempotencyKey: khoa(), rows: [{ studentId: a.sid, target: moi }] });
      assert(r0.status === 400 && r0.json.error === 'Ghi lý do đổi Target.', `${r0.status} ${JSON.stringify(r0.json)}`);
      const r1 = await luu(QL, ft, { idempotencyKey: khoa(), lyDoTarget: 'Em tiến bộ nhanh', rows: [{ studentId: a.sid, target: moi }] });
      assert(r1.status === 200 && r1.json.daSua === 1, `${r1.status} ${JSON.stringify(r1.json)}`);
      const rev = get('SELECT * FROM cycle_target_revisions WHERE cycle_id = ? ORDER BY id DESC LIMIT 1', a.cid);
      assert(rev?.new_target === moi && rev.reason === 'Em tiến bộ nhanh' && rev.effective_from === new Date().toISOString().slice(0, 10), JSON.stringify(rev));
      assert(get('SELECT target_score FROM learning_cycles WHERE id = ?', a.cid).target_score === moi, 'target lộ trình');
    });

    await checkAsync('SL-1 (4) · GVCN đổi Target → 403 (câu CHI_QL_SUA), không ghi gì; GVCN đổi họ tên → 200', async () => {
      const a = em[5];
      const tenA = ten(a.sid);
      const tg = get('SELECT target_score FROM learning_cycles WHERE id = ?', a.cid).target_score;
      const r = await luu(GVCN, ft, { idempotencyKey: khoa(), lyDoTarget: 'GVCN tự đổi', rows: [{ studentId: a.sid, fullName: 'SL GVCN Không Ghi', target: tg === 6 ? 6.5 : 6 }] });
      assert(r.status === 403 && r.json.error === CHI_QL_SUA, `${r.status} ${JSON.stringify(r.json)}`);
      assert(ten(a.sid) === tenA, 'lô bị từ chối quyền không ghi họ tên');
      const r2 = await luu(GVCN, ft, { idempotencyKey: khoa(), rows: [{ studentId: a.sid, fullName: 'SL GVCN Sửa Tên' }] });
      assert(r2.status === 200 && ten(a.sid) === 'SL GVCN Sửa Tên', `${r2.status} ${JSON.stringify(r2.json)}`);
    });

    await checkAsync('SL-1 (5) · học viên không thuộc lớp → 400 "Học viên … không thuộc lớp này"', async () => {
      const ngoai = emCua(thuong)[0];
      for (const f of [xemTruoc, luu]) {
        const r = await f(QL, ft, { idempotencyKey: khoa(), rows: [{ studentId: ngoai.sid, fullName: 'SL Ngoài Lớp' }] });
        assert(r.status === 400 && /^Học viên .* không thuộc lớp này/.test(r.json.error), `${r.status} ${JSON.stringify(r.json)}`);
      }
      assert(ten(ngoai.sid) !== 'SL Ngoài Lớp', 'không ghi');
    });

    await checkAsync('SL-1 (6) · đổi tuần bắt đầu → xem trước có canhBaoMt "MT… sẽ dời sang W…" (cùng hàm câu của panel Thông tin HV)', async () => {
      const a = get(`SELECT cy.student_id AS sid, rp.week_start AS tuan FROM learning_cycles cy
          JOIN enrollments e ON e.student_id = cy.student_id AND e.class_id = ? AND e.status = 'active'
          JOIN report_periods rp ON rp.id = cy.start_period_id
         WHERE cy.status = 'active' AND cy.route IS NOT NULL AND EXISTS (SELECT 1 FROM assessment_attempts a
           WHERE a.cycle_id = cy.id AND a.status = 'planned' AND a.plan_source = 'auto' AND NOT ${d.CO_DIEM_SQL('a')}) ORDER BY cy.id LIMIT 1`, ft);
      assert(a, 'seed: cần một em FT có lượt MT tự xếp chưa điểm');
      const moi = t.addDays(a.tuan, 7);
      const pv = await xemTruoc(QL, ft, { rows: [{ studentId: a.sid, startWeek: moi }] });
      assert(pv.status === 200, `${pv.status} ${JSON.stringify(pv.json)}`);
      const cb = pv.json.canhBaoMt.find((x: any) => x.studentId === a.sid);
      assert(cb && /^MT\d.* sẽ dời sang W\d/.test(cb.cau), JSON.stringify(pv.json.canhBaoMt));
      const pv2 = await xemTruoc(QL, ft, { rows: [{ studentId: a.sid, startWeek: a.tuan }] });
      assert(!pv2.json.canhBaoMt.length, 'không đổi tuần thì không cảnh báo');
    });

    await checkAsync('SL-1 (7) · gửi lại cùng idempotencyKey → không ghi lần hai', async () => {
      const a = em[0];
      const key = khoa();
      const r1 = await luu(QL, ft, { idempotencyKey: key, rows: [{ studentId: a.sid, fullName: 'SL Lần Một' }] });
      const n = soAudit(a.sid);
      const r2 = await luu(QL, ft, { idempotencyKey: key, rows: [{ studentId: a.sid, fullName: 'SL Lần Hai' }] });
      assert(r1.status === 200 && r2.status === 200 && r2.json.daSua === r1.json.daSua, `${JSON.stringify(r1.json)} ${JSON.stringify(r2.json)}`);
      assert(ten(a.sid) === 'SL Lần Một' && soAudit(a.sid) === n, 'lần hai không được ghi');
    });

    await checkAsync('SL-1 (8) · điểm đầu vào 9.5 → lỗi "0–9"; 6.5 → lưu nguồn nhập tay', async () => {
      const a = em[1];
      const pv = await xemTruoc(QL, ft, { rows: [{ studentId: a.sid, baseline: 9.5 }] });
      const is = pv.json.rows[0].issues;
      assert(is.some((i: any) => i.field === 'baseline' && i.muc === 'loi' && i.message.includes('0–9')), JSON.stringify(is));
      const r = await luu(QL, ft, { idempotencyKey: khoa(), rows: [{ studentId: a.sid, baseline: 6.5 }] });
      const cy = get('SELECT baseline_score, baseline_source FROM learning_cycles WHERE id = ?', a.cid);
      assert(r.status === 200 && cy.baseline_score === 6.5 && cy.baseline_source === 'manual', `${r.status} ${JSON.stringify(r.json)} ${JSON.stringify(cy)}`);
    });

    await checkAsync('SL-1 (9) · lớp thường theo cotLuoiNhap(true): Target/Dự kiến thi/Tuần bắt đầu nhận; điểm đầu vào → lỗi', async () => {
      const cot = d.cotLuoiNhap(true).map((c) => c.key);
      assert(cot.includes('target') && cot.includes('examDate') && cot.includes('startWeek') && !cot.includes('baselineScore'), cot.join(','));
      const a = emCua(thuong)[0];
      const tuan = t.addDays(a.tuan ?? d.mondayOfDate(t.TODAY), 7);
      const rows = [{ studentId: a.sid, target: 6.5, examDate: '05/2027', startWeek: tuan }];
      const pv = await xemTruoc(QL, thuong, { rows: [...rows, { studentId: emCua(thuong)[1].sid, baseline: 5 }] });
      assert(pv.status === 200 && !pv.json.rows[0].issues.length, JSON.stringify(pv.json));
      assert(pv.json.rows[1].issues.some((i: any) => i.field === 'baseline' && i.muc === 'loi' && i.message === 'Lớp thường không có điểm đầu vào.'), JSON.stringify(pv.json.rows[1]));
      const r = await luu(QL, thuong, { idempotencyKey: khoa(), lyDoTarget: 'Phụ huynh đặt mục tiêu', rows });
      const cy = get('SELECT target_score, exam_month, rp.week_start AS tuan FROM learning_cycles cy LEFT JOIN report_periods rp ON rp.id = cy.start_period_id WHERE cy.id = ?', a.cid);
      assert(r.status === 200 && cy.target_score === 6.5 && cy.exam_month === '2027-05' && cy.tuan === tuan, `${r.status} ${JSON.stringify(r.json)} ${JSON.stringify(cy)}`);
    });

    await checkAsync('SL-1 · quá 60 dòng → 400', async () => {
      const r = await xemTruoc(QL, ft, { rows: Array.from({ length: 61 }, () => ({ studentId: em[0].sid })) });
      assert(r.status === 400, `${r.status} ${JSON.stringify(r.json)}`);
    });
  } finally {
    may.close();
  }
}
