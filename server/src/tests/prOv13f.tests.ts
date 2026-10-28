/**
 * PHÉP KIỂM OV-13f (chủ SP 15/10, Q8) — ẩn mã HV + Email là định danh, gọi QUA HTTP như bản chính.
 *  1 · email trùng bị chặn: thêm một em · nhập lô (trùng em đã có + trùng trong lô) · sửa một em · sửa cả lớp — câu lỗi có tên + lớp em đang dùng
 *  2 · email trống lưu được → "Thiếu thông tin" có Email · em cũ đang trùng email sửa ô khác vẫn được (chỉ lần ĐỔI email bị kiểm)
 *  3 · mọi file xuất: không cột "Mã", cột 2 là "Email" (header thật của `/xuat-mt`; sheet Ý thức dựng từ hằng dùng chung)
 *  4 · tìm theo mã vẫn ra em (và theo email) · cảnh báo trùng tên hiện email, không hiện mã.
 */
import type { YThucTestKit } from './yThuc.tests.ts';

export async function runPrOv13fTests(t: YThucTestKit) {
  const { checkAsync, check, assert, conn, TODAY, P, addDays } = t;
  const intake: any = await import('../classes/intake.ts');
  const week: any = await import('../platform/week.ts');
  const d: any = await import('../../../shared/domain/index.ts');
  const { createApp } = await import('../app.ts');
  const { xoaNho } = await import('../platform/nguCanhRequest.ts');
  console.log('\nOV-13f · Ẩn mã HV + Email là định danh (qua HTTP)');

  const one = (sql: string, ...a: unknown[]) => conn.prepare(sql).all(...a)[0] as any;
  const MB = one(`SELECT id FROM branches WHERE code = 'MB'`).id as number;
  const QL = P.mbManager.userId as number;
  const T2 = week.mondayOf(TODAY) as string;
  const start = addDays(T2, -7 * 2);
  const lopFt = intake.createClass(P.admin, { code: 'MB F13-1', branchId: MB, kind: 'FT', isFastTrack: true, route: 'LT1', startDate: start, startPeriodId: week.ensurePeriod(start).id }).id as number;
  const lopFt2 = intake.createClass(P.admin, { code: 'MB F13-2', branchId: MB, kind: 'FT', isFastTrack: true, route: 'LT1', startDate: start, startPeriodId: week.ensurePeriod(start).id }).id as number;

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
  const post = (url: string, body: unknown, uid = QL) => goi(uid, url, { method: 'POST', body: JSON.stringify(body) });
  const patch = (url: string, body: unknown, uid = QL) => goi(uid, url, { method: 'PATCH', body: JSON.stringify(body) });
  let k = 0;
  const them = async (classId: number, rows: any[]) => (await (await post('/intake/commit', { classId, rows, idempotencyKey: `ov13f-${++k}` })).json()) as any;
  const loiEmail = (issues: any[]) => issues.filter((i: any) => i.field === 'email' && i.muc === 'loi').map((i: any) => i.message as string);

  try {
    xoaNho();
    /* Em có sẵn ở lớp 2 — chủ email `co.san@ov13f.vn`. */
    const goc = await them(lopFt2, [{ fullName: 'Lê Có Sẵn', email: 'co.san@ov13f.vn', target: 6.5 }]);
    const idGoc = goc.studentIds?.[0] as number;

    await checkAsync('OV-13f 1a · thêm một em: email trùng (khác hoa thường, có khoảng trắng) → chặn, câu có tên + lớp em đang dùng', async () => {
      assert(idGoc, `chưa tạo được em gốc: ${JSON.stringify(goc)}`);
      const r = await them(lopFt, [{ fullName: 'Trần Trùng Một', email: '  CO.San@OV13F.vn ', target: 6.5 }]);
      assert(r.added === 0, `đáng lẽ chặn, đã thêm ${r.added}`);
      const m = loiEmail(r.failed);
      assert(m.some((x) => x === 'Email đã dùng cho Lê Có Sẵn · MB F13-2'), `câu lỗi: ${JSON.stringify(r.failed)}`);
    });

    await checkAsync('OV-13f 1b · nhập lô: dòng trùng em đã có + dòng trùng dòng khác trong lô báo lỗi ở xem trước; dòng khác vẫn lưu', async () => {
      const rows = [
        { fullName: 'Lô Một', email: 'lo.mot@ov13f.vn' },
        { fullName: 'Lô Hai', email: 'co.san@ov13f.vn' },
        { fullName: 'Lô Ba', email: 'LO.MOT@ov13f.vn' },
        { fullName: 'Lô Bốn', email: '' },
      ];
      const xt = (await (await post('/intake/preview', { classId: lopFt, rows })).json()) as any;
      const theoDong = (n: number) => loiEmail(xt.rows[n - 1].issues);
      assert(!theoDong(1).length, `dòng 1 không lỗi: ${theoDong(1)}`);
      assert(theoDong(2).some((x) => x.includes('Lê Có Sẵn')), `dòng 2: ${theoDong(2)}`);
      assert(theoDong(3).some((x) => x.includes('dòng 1') && x.includes('Lô Một')), `dòng 3 (trùng trong lô): ${theoDong(3)}`);
      assert(!theoDong(4).length, `dòng 4 trống email không lỗi: ${theoDong(4)}`);
      const r = await them(lopFt, rows);
      assert(r.added === 2 && r.hangDaThem.join() === '1,4', `lưu dòng 1 + 4: ${JSON.stringify(r)}`);
    });

    await checkAsync('OV-13f 2a · email trống lưu được → Học viên & Lớp: em có "Thiếu thông tin" gồm Email', async () => {
      const em = one(`SELECT id FROM students WHERE full_name = 'Lô Bốn'`);
      assert(em && one('SELECT email FROM students WHERE id = ?', em.id).email === null, 'Lô Bốn chưa lưu hoặc email không trống');
      const ds = (await (await goi(QL, `/hoc-vien-lop?q=${encodeURIComponent('Lô Bốn')}`)).json()) as any;
      const h = ds.hocVien.find((x: any) => x.id === em.id);
      assert(h?.loc.includes('thieu_tt') && h.thieu?.includes('Email'), `dòng em: ${JSON.stringify(h)}`);
    });

    const idMot = (one(`SELECT id FROM students WHERE full_name = 'Lô Một'`)?.id ?? 0) as number;
    await checkAsync('OV-13f 1c · sửa một em: đổi sang email em khác đang dùng → 400 có tên; email riêng → 200', async () => {
      const r = await patch(`/students/${idMot}`, { email: 'Co.San@ov13f.vn' });
      const b = (await r.json()) as any;
      assert(r.status === 400 && /Email đã dùng cho Lê Có Sẵn · MB F13-2/.test(b.error ?? b.message ?? ''), `${r.status} ${JSON.stringify(b)}`);
      const ok = await patch(`/students/${idMot}`, { email: 'lo.mot.moi@ov13f.vn' });
      assert(ok.status === 200, `email mới: ${ok.status}`);
    });

    await checkAsync('OV-13f 2b · em cũ đang trùng email (dữ liệu cũ) sửa ô khác được; gửi lại đúng email cũ (khác hoa thường) không bị kiểm', async () => {
      const cu = Number(conn.prepare(`INSERT INTO students (student_code, full_name, normalized_name, email, branch_id, status, created_at)
        VALUES ('PISA-F13-CU', 'Em Cũ Trùng', 'em cu trung', 'co.san@ov13f.vn', ?, 'active', ?)`).run(MB, new Date().toISOString()).lastInsertRowid);
      conn.prepare(`INSERT INTO enrollments (student_id, class_id, status, started_at, created_at) VALUES (?,?, 'active', ?, ?)`).run(cu, lopFt, start, new Date().toISOString());
      const r = await patch(`/students/${cu}`, { fullName: 'Em Cũ Trùng Sửa', email: 'CO.SAN@ov13f.vn' });
      assert(r.status === 200, `${r.status} ${await r.text()}`);
    });

    await checkAsync('OV-13f 1d · sửa cả lớp: email trùng em lớp khác + trùng dòng trong lô báo ở xem trước, lưu → 400 có tên', async () => {
      const idHai = (one(`SELECT id FROM students WHERE full_name = 'Lô Bốn'`)?.id ?? 0) as number;
      const rows = [{ studentId: idMot, email: 'co.san@ov13f.vn' }];
      const xt = (await (await post(`/classes/${lopFt}/sua-ca-lop/xem-truoc`, { rows })).json()) as any;
      assert(loiEmail(xt.rows[0].issues).some((x) => x === 'Email đã dùng cho Lê Có Sẵn · MB F13-2'), `xem trước: ${JSON.stringify(xt)}`);
      const lo = [{ studentId: idMot, email: 'chung@ov13f.vn' }, { studentId: idHai, email: 'Chung@ov13f.vn' }];
      const xt2 = (await (await post(`/classes/${lopFt}/sua-ca-lop/xem-truoc`, { rows: lo })).json()) as any;
      const dong2 = xt2.rows.find((x: any) => x.studentId === idHai);
      assert(loiEmail(dong2.issues).length === 1, `trùng trong lô: ${JSON.stringify(xt2)}`);
      const luu = await post(`/classes/${lopFt}/sua-ca-lop`, { rows, idempotencyKey: 'ov13f-scl' });
      const b = (await luu.json()) as any;
      assert(luu.status === 400 && /Lê Có Sẵn/.test(b.error ?? b.message ?? ''), `${luu.status} ${JSON.stringify(b)}`);
    });

    await checkAsync('OV-13f 3 · mọi file xuất: không cột "Mã", cột 2 là "Email" (FT gọn + đầy đủ, lớp thường, Ý thức)', async () => {
      for (const body of [
        { khung: 'ft', tg: 'dot', dot: ['mt:1', 'mt:2', 'mt:3'], cot: 'gon' }, { khung: 'ft', tg: 'dot', dot: ['mt:1', 'mt:2'], cot: 'day-du' },
        { khung: 'thuong', tg: 'dot', dot: ['giua', 'cuoi'], cot: 'day-du' },
      ]) {
        const r = (await (await post('/xuat-mt', body, P.admin.userId)).json()) as any;
        const dl = r.sheets.filter((s: any) => s.ten !== 'Bộ lọc đã dùng');
        assert(dl.length, `${body.khung}: không có sheet dữ liệu`);
        for (const s of dl) {
          const h = s.aoa[0];
          assert(!h.includes('Mã') && h[0] === 'Tên' && h[1] === 'Email', `${body.khung} · ${s.ten}: ${h.slice(0, 4).join(' | ')}`);
          const dong = s.aoa.slice(1).find((x: any[]) => x[1]);
          assert(!dong || /@/.test(dong[1]), `${s.ten}: cột 2 không phải email: ${dong?.[1]}`);
          assert(!s.aoa.slice(1).some((x: any[]) => x.some((o: unknown) => typeof o === 'string' && /^PISA-\d/.test(o))), `${s.ten}: còn mã PISA-…`);
        }
      }
      const yt = d.COT_XUAT_HV_CAN_CHU_Y as string[];
      assert(yt && !yt.includes('Mã') && yt[1] === 'Email', `Ý thức: ${yt}`);
    });

    await checkAsync('OV-13f 4 · tìm theo mã vẫn ra em (và theo email); kết quả có email để phân biệt', async () => {
      const ma = one('SELECT student_code FROM students WHERE id = ?', idGoc).student_code as string;
      const r = (await (await goi(QL, `/students?q=${encodeURIComponent(ma)}`)).json()) as any;
      assert(r.rows.some((x: any) => x.id === idGoc && x.email === 'co.san@ov13f.vn'), `theo mã ${ma}: ${JSON.stringify(r.rows.slice(0, 3))}`);
      const e = (await (await goi(QL, `/students?q=${encodeURIComponent('co.san@ov13f')}`)).json()) as any;
      assert(e.rows.some((x: any) => x.id === idGoc), 'theo email không ra em');
      const ds = (await (await goi(QL, `/hoc-vien-lop?q=${encodeURIComponent(ma)}`)).json()) as any;
      assert(ds.hocVien.some((x: any) => x.id === idGoc), 'Học viên & Lớp: tìm theo mã không ra em');
    });

    await checkAsync('OV-13f 4b · cảnh báo trùng tên ở xem trước hiện email, không hiện mã', async () => {
      const xt = (await (await post('/intake/preview', { classId: lopFt, rows: [{ fullName: 'Lê Có Sẵn', email: 'khac@ov13f.vn' }] })).json()) as any;
      const c = xt.rows[0].issues.find((i: any) => i.field === 'fullName')?.message ?? '';
      assert(c.includes('co.san@ov13f.vn') && !/PISA-/.test(c), `cảnh báo: ${c}`);
    });

  } finally {
    may.close();
    xoaNho();
  }
}
