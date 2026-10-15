/**
 * PHÉP KIỂM OV-13j — Lịch sử sửa thông tin học viên, gọi QUA HTTP như bản chính:
 *  · mỗi đường ghi (Thêm HV, sửa một em theo vai, liên hệ, TVV, điểm đầu vào, Target / Dự kiến thi, trạng thái, lưu trữ, Sửa cả lớp,
 *    tạm dừng cả lớp) sinh đúng MỘT khối có trường cũ → mới; gửi lại nguyên giá trị → không có khối.
 *  · quyền xem: QL / GVCN / TVV / CX 200 · GVBM / QL chi nhánh khác 403; lọc nhanh; phân trang không trùng không sót.
 */
import type { YThucTestKit } from './yThuc.tests.ts';

export async function runPrOv13jTests(t: YThucTestKit) {
  const { checkAsync, assert, conn, P } = t;
  const accounts: any = await import('../platform/accounts.ts');
  const luatLoTrinh: any = await import('../classes/luatLoTrinh.ts');
  const students: any = await import('../students/students.ts');
  const { createApp } = await import('../app.ts');
  const { xoaNho } = await import('../platform/nguCanhRequest.ts');
  console.log('\nOV-13j · Lịch sử sửa thông tin học viên');

  const one = (sql: string, ...a: unknown[]) => conn.prepare(sql).get(...a) as any;
  const tao = (role: string, branches: string[]) => accounts.createAccount(P.admin,
    { email: `ov13j.${role}.${Date.now() % 100000}${accounts.EMAIL_SUFFIX}`, password: 'matkhau-ov13j', fullName: `Thử OV13j ${role}`, roles: [{ role, branches }] }).userId as number;
  const idTvv = tao('consultant', ['MB']);
  const idCx = tao('cx', []);
  const lop = one(`SELECT id FROM classes WHERE code = 'MB FT 101'`).id as number;
  const gvcn = one(`SELECT user_id id FROM teacher_assignments WHERE class_id = ? AND is_core = 1 AND status = 'active' ORDER BY id LIMIT 1`, lop).id as number;
  const gvbm = one(`SELECT user_id id FROM teacher_assignments WHERE class_id = ? AND skill IS NOT NULL AND status = 'active'
      AND user_id NOT IN (SELECT user_id FROM teacher_assignments WHERE class_id = ? AND is_core = 1 AND status = 'active') ORDER BY id LIMIT 1`, lop, lop).id as number;
  const QL = P.mbManager.userId as number;

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
  const ls = async (sid: number, q = '', userId = QL) => {
    const r = await goi(userId, `/students/${sid}/lich-su-sua${q}`);
    assert(r.status === 200, `lịch sử ${q}: ${r.status} ${JSON.stringify(r.json)}`);
    return r.json as { dong: { id: number; nguoi: string; nguon: string | null; truong: { ten: string; cu: string | null; moi: string | null }[] }[]; tiep: number | null };
  };
  const moiNhat = async (sid: number) => (await ls(sid)).dong[0];
  const truong = (d: any, ten: string) => d.truong.find((x: any) => x.ten === ten);
  const soKhoi = async (sid: number) => (await ls(sid)).dong.length;

  try {
    const them = await goi(QL, '/intake/commit', 'POST', { classId: lop, idempotencyKey: `ov13j-${Date.now()}`, rows: [
      { fullName: 'OV13j Em A', email: 'a.ov13j@demo.test', dob: '2010-01-01', target: 7 },
      { fullName: 'OV13j Em B', email: 'b.ov13j@demo.test', dob: '2010-02-02', target: 6.5 },
      { fullName: 'OV13j Em C', email: 'c.ov13j@demo.test', dob: '2010-03-03', target: 6.5 },
    ] });
    assert(them.status === 200 && them.json.studentIds.length === 3, `intake ${them.status} ${JSON.stringify(them.json)}`);
    const [a, b, c] = them.json.studentIds as number[];
    const cyA = one(`SELECT id FROM learning_cycles WHERE student_id = ? AND status = 'active'`, a).id as number;

    await checkAsync('OV13j-1 · Thêm HV (nhập) → MỘT khối nguồn "Thêm học viên · MB FT 101", cũ trống → mới', async () => {
      const r = await ls(a);
      assert(r.dong.length === 1 && r.dong[0].nguon === 'Thêm học viên · MB FT 101', JSON.stringify(r.dong));
      const ht = truong(r.dong[0], 'Họ tên'); const tg = truong(r.dong[0], 'Target');
      assert(ht?.cu === null && ht.moi === 'OV13j Em A' && tg?.moi === '7.0', JSON.stringify(r.dong[0].truong));
    });

    await checkAsync('OV13j-2 · QL sửa email → một khối "Email: cũ → mới", người = QL; gửi lại nguyên → không thêm khối', async () => {
      const truoc = await soKhoi(a);
      assert((await goi(QL, `/students/${a}`, 'PATCH', { email: 'an.nguyen@demo.test' })).status === 200, 'patch');
      const d = await moiNhat(a);
      assert(await soKhoi(a) === truoc + 1, 'thêm đúng một khối');
      assert(d.nguoi === one('SELECT full_name n FROM users WHERE id = ?', QL).n && d.nguon === null, JSON.stringify(d));
      assert(d.truong.length === 1 && d.truong[0].ten === 'Email' && d.truong[0].cu === 'a.ov13j@demo.test' && d.truong[0].moi === 'an.nguyen@demo.test', JSON.stringify(d.truong));
      assert((await goi(QL, `/students/${a}`, 'PATCH', { email: 'an.nguyen@demo.test' })).status === 200, 'patch lại');
      assert(await soKhoi(a) === truoc + 1, 'gửi lại nguyên giá trị không thêm khối');
    });

    await checkAsync('OV13j-3 · TVV sửa liên hệ (2 trường) → MỘT khối 2 dòng; TVV gán TVV phụ trách → "TVV: — → tên"', async () => {
      assert((await goi(idTvv, `/students/${a}`, 'PATCH', { phone: '0901 234 567', parentName: 'Phạm Văn Long' })).status === 200, 'patch TVV');
      const d = await moiNhat(a);
      assert(d.truong.length === 2 && truong(d, 'SĐT')?.moi === '0901 234 567' && truong(d, 'Phụ huynh')?.moi === 'Phạm Văn Long', JSON.stringify(d.truong));
      const r = await goi(idTvv, `/students/${a}`, 'PATCH', { consultantUserId: idTvv });
      assert(r.status === 200, `gán TVV ${r.status} ${JSON.stringify(r.json)}`);
      const tv = truong(await moiNhat(a), 'TVV');
      assert(tv?.cu === null && tv.moi === 'Thử OV13j consultant', JSON.stringify(tv));
    });

    await checkAsync('OV13j-4 · CX sửa ngày sinh + điểm đầu vào (cùng lần) → gộp MỘT khối', async () => {
      const truoc = await soKhoi(a);
      assert((await goi(idCx, `/students/${a}`, 'PATCH', { dob: '2010-05-06', dauVao: { overall: 5.5 } })).status === 200, 'patch CX');
      const d = await moiNhat(a);
      assert(await soKhoi(a) === truoc + 1, 'một khối');
      assert(truong(d, 'Ngày sinh')?.cu === '01/01/2010' && truong(d, 'Ngày sinh')?.moi === '06/05/2010' && truong(d, 'Điểm đầu vào')?.moi === '5.5', JSON.stringify(d.truong));
    });

    await checkAsync('OV13j-5 · QL đổi Target (lý do) → "Target: 7.0 → 7.5" một dòng (không lặp do cycle.update + target.revise)', async () => {
      const r = await goi(QL, `/cycles/${cyA}`, 'PATCH', { targetScore: 7.5, lyDo: 'Phụ huynh muốn' });
      assert(r.status === 200, `${r.status} ${JSON.stringify(r.json)}`);
      const d = await moiNhat(a);
      assert(d.truong.length === 1 && d.truong[0].ten === 'Target' && d.truong[0].cu === '7.0' && d.truong[0].moi === '7.5', JSON.stringify(d.truong));
    });

    await checkAsync('OV13j-6 · Tạm dừng / Quay lại học → khối Trạng thái; lọc "trang-thai" chỉ còn khối trạng thái', async () => {
      assert((await goi(QL, `/students/${b}/status`, 'POST', { status: 'inactive', reason: 'Ốm' })).status === 200, 'tạm dừng');
      let d = await moiNhat(b);
      assert(truong(d, 'Trạng thái')?.cu === 'Đang học' && truong(d, 'Trạng thái')?.moi !== 'Đang học', JSON.stringify(d.truong));
      assert((await goi(QL, `/students/${b}/status`, 'POST', { status: 'active' })).status === 200, 'quay lại');
      d = await moiNhat(b);
      assert(truong(d, 'Trạng thái')?.moi === 'Đang học', JSON.stringify(d.truong));
      const loc = await ls(b, '?loai=trang-thai');
      assert(loc.dong.length === 2 && loc.dong.every((x) => x.truong.every((y) => y.ten === 'Trạng thái')), JSON.stringify(loc.dong));
      assert((await ls(b, '?loai=target')).dong.every((x) => x.truong.every((y) => y.ten !== 'Trạng thái')), 'lọc target không có trạng thái');
      assert((await goi(QL, `/students/${b}/lich-su-sua?loai=xyz`)).status === 400, 'loai lạ → 400');
    });

    await checkAsync('OV13j-7 · Sửa cả lớp → mỗi em MỘT khối có nguồn "Sửa cả lớp MB FT 101" (hồ sơ + lộ trình gộp)', async () => {
      const r = await goi(QL, `/classes/${lop}/sua-ca-lop`, 'POST', { rows: [
        { studentId: b, email: 'b2.ov13j@demo.test', target: 7, examDate: '2026-12' },
        { studentId: c, fullName: 'OV13j Em C Mới' },
      ], lyDoTarget: 'Sửa cả lớp', idempotencyKey: `ov13j-scl-${Date.now()}` });
      assert(r.status === 200 && r.json.daSua === 2, `${r.status} ${JSON.stringify(r.json)}`);
      const db_ = await moiNhat(b); const dc = await moiNhat(c);
      assert(db_.nguon === 'Sửa cả lớp MB FT 101' && dc.nguon === 'Sửa cả lớp MB FT 101', `${db_.nguon} / ${dc.nguon}`);
      assert(truong(db_, 'Email')?.moi === 'b2.ov13j@demo.test' && truong(db_, 'Target')?.moi === '7.0' && truong(db_, 'Dự kiến thi')?.moi, JSON.stringify(db_.truong));
      assert((await ls(b)).dong.filter((x) => x.nguon === 'Sửa cả lớp MB FT 101').length === 1, 'em B đúng một khối Sửa cả lớp');
      assert(truong(dc, 'Họ tên')?.cu === 'OV13j Em C' && truong(dc, 'Họ tên')?.moi === 'OV13j Em C Mới', JSON.stringify(dc.truong));
    });

    await checkAsync('OV13j-8 · Tạm dừng cả lớp (chuyển tiếp, bảo lưu) → mỗi em một khối Trạng thái', async () => {
      const p = { ...P.mbManager };
      conn.exec('BEGIN IMMEDIATE');
      try {
        luatLoTrinh.apDungBaoLuuCaLop(p, { fromClassId: lop, ngay: t.TODAY, dongs: [{ sid: c, lyDo: 'Bảo lưu' }] });
        conn.exec('COMMIT');
      } catch (e) { conn.exec('ROLLBACK'); throw e; }
      const d = await moiNhat(c);
      assert(truong(d, 'Trạng thái')?.cu === 'Đang học' && truong(d, 'Trạng thái')?.moi !== 'Đang học', JSON.stringify(d.truong));
      conn.prepare(`UPDATE students SET status = 'active' WHERE id = ?`).run(c);
      conn.prepare(`UPDATE enrollments SET status = 'active', end_kind = NULL, end_reason = NULL WHERE student_id = ? AND class_id = ?`).run(c, lop);
    });

    await checkAsync('OV13j-8c · chuyển lớp sang chi nhánh khác → MỘT khối nguồn "Chuyển lớp": Lớp + Chi nhánh cũ → mới', async () => {
      const den = one(`SELECT c.id, c.code, b.name cn FROM classes c JOIN branches b ON b.id = c.branch_id
        WHERE b.code = 'CP' AND c.status = 'active' AND c.is_fast_track = 1 ORDER BY c.id LIMIT 1`);
      /* Ghi thật (không bọc giao dịch: mỗi lần gọi API tự cuộn giao dịch dở) — em B không dùng ở phép kiểm sau. */
      students.transferStudent(P.admin, b, den.id, t.TODAY, 'Chuyển chi nhánh', { noNote: true });
      const d = (await ls(b, '', P.admin.userId)).dong[0];   // em đã sang CP — QL MB không còn xem được (403, đúng luật)
      assert(d.nguon === 'Chuyển lớp' && truong(d, 'Lớp')?.cu === 'MB FT 101' && truong(d, 'Lớp')?.moi === den.code
        && truong(d, 'Chi nhánh')?.moi === den.cn && truong(d, 'Chi nhánh')?.cu !== den.cn, JSON.stringify(d));
    });

    await checkAsync('OV13j-8b · Kết thúc học + Lưu trữ / Bỏ lưu trữ → mỗi việc một khối (Trạng thái, Lưu trữ cũ → mới)', async () => {
      const truoc = await soKhoi(c);
      assert((await goi(QL, `/students/${c}/status`, 'POST', { status: 'finished', reason: 'Nghỉ' })).status === 200, 'kết thúc');
      const r = await goi(QL, `/students/${c}/archive`, 'POST', {});
      assert(r.status === 200, `lưu trữ ${r.status} ${JSON.stringify(r.json)}`);
      const ds = (await ls(c, '?loai=trang-thai')).dong;
      assert(truong(ds[0], 'Lưu trữ')?.cu === null && truong(ds[0], 'Lưu trữ')?.moi, JSON.stringify(ds[0]));
      assert(ds.some((x) => truong(x, 'Trạng thái')?.moi === 'Đã kết thúc'), JSON.stringify(ds));
      assert((await goi(QL, `/students/${c}/unarchive`, 'POST', {})).status === 200, 'bỏ lưu trữ');
      assert(truong(await moiNhat(c), 'Lưu trữ')?.moi === null && await soKhoi(c) >= truoc + 3, 'bỏ lưu trữ một khối');
    });

    await checkAsync('OV13j-9 · quyền xem: QL / QT / GVCN / TVV / CX 200 · GVBM 403 · QL chi nhánh khác 403', async () => {
      for (const [ten, id] of [['QL', QL], ['QT', P.admin.userId], ['GVCN', gvcn], ['TVV', idTvv], ['CX', idCx]] as const) {
        const r = await goi(id, `/students/${a}/lich-su-sua`);
        assert(r.status === 200, `${ten}: ${r.status}`);
      }
      for (const [ten, id] of [['GVBM', gvbm], ['QL CP', P.cpManager.userId]] as const) {
        const r = await goi(id, `/students/${a}/lich-su-sua`);
        assert(r.status === 403, `${ten}: ${r.status}`);
      }
    });

    await checkAsync('OV13j-10 · phân trang: 24 lần sửa xen kẽ hai người → trang 1 = 20 khối + con trỏ; trang 2 phần còn lại, không trùng', async () => {
      for (let i = 0; i < 24; i += 1) {
        const r = await goi(i % 2 ? idTvv : QL, `/students/${a}`, 'PATCH', { parentRelation: `Quan hệ ${i}` });
        assert(r.status === 200, `sửa ${i}: ${r.status}`);
      }
      const p1 = await ls(a);
      assert(p1.dong.length === 20 && p1.tiep !== null, `trang 1: ${p1.dong.length} tiep ${p1.tiep}`);
      assert(truong(p1.dong[0], 'Quan hệ')?.moi === 'Quan hệ 23', 'mới nhất trước');
      const p2 = await ls(a, `?truoc=${p1.tiep}`);
      const ids = [...p1.dong, ...p2.dong].map((x) => x.id);
      assert(new Set(ids).size === ids.length, 'không trùng');
      const qh = [...p1.dong, ...p2.dong].flatMap((x) => x.truong.filter((y) => y.ten === 'Quan hệ').map((y) => y.moi));
      assert(qh.length === 24 && p2.tiep === null, `đủ 24 lần sửa Quan hệ (${qh.length}), hết trang (${p2.tiep})`);
      assert(p2.dong.at(-1)?.nguon === 'Thêm học viên · MB FT 101', 'khối cuối = Thêm học viên');
    });
  } finally { may.close(); xoaNho(); }
}
