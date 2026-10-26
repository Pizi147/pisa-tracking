/**
 * PHÉP KIỂM OV-15i1 — việc lẻ sau rà OV-15g / h1 (Lịch sử thay đổi + chuông), gọi QUA HTTP như bản chính (`GET /lich-su`).
 *  · gop-y đi chỉ mục (entity_type, action, entity_id) — không đọc mọi dòng nhật ký của em; mã lớp có `_` / `%` không khớp lớp khác.
 *  · o phân trang theo con trỏ thời điểm: lưu thêm giữa hai lần "Xem thêm" không lặp mục.
 *  · thi-that cùng cổng với hv (GVBM 403); dòng hệ thống không ghi "Nguồn: Hệ thống"; chữ máy chủ ghép động có bản EN.
 *  · lô 0 em không ghi mục; HV đã xoá; đổi chương trình kết thúc phân công → mục phân công trước → sau.
 *  · Sửa cả lớp / Dán Excel = MỘT mục ở lịch sử lớp; `batDau` cho hv, thi-that, gop-y, o.
 */
import type { YThucTestKit } from './yThuc.tests.ts';

type Truong = { ten: string; cu: string | null; moi: string | null; doiTuong?: string | null };
type Muc = { id: number | string; luc: string; nguoi: string; nguon: string | null; lyDo: string | null; truong: Truong[] };
type Trang = { dong: Muc[]; tiep: number | null; nhom: { key: string; nhan: string }[]; batDau: string | null };

export async function runPrOv15i1Tests(t: YThucTestKit) {
  const { checkAsync, assert, conn, P, TODAY } = t;
  const { createApp } = await import('../app.ts');
  const { xoaNho } = await import('../platform/nguCanhRequest.ts');
  const lichSuMod: any = await import('../platform/lichSu.ts');
  const ttl: any = await import('../classes/thongTinLop.ts');
  const intake: any = await import('../classes/intake.ts');
  const xoaHv: any = await import('../students/xoaHocVien.ts');
  const { dichMau } = await import('../../../shared/i18n/index.ts');
  console.log('\nOV-15i1 · Lịch sử thay đổi + chuông (việc lẻ)');

  const one = (sql: string, ...a: unknown[]) => conn.prepare(sql).get(...a) as any;
  const QL = P.mbManager.userId as number;
  const lop = one(`SELECT id FROM classes WHERE code = 'MB FT 101'`).id as number;
  /** Nhật ký góp ý tuần cũ (ghi đã khoá — R1-NO-NHO, D14): cùng dạng `gop_y_tuan.ghi` đường ghi cũ để Lịch sử đọc. */
  const { writeAudit } = await import('../platform/audit.ts');
  const { tuanLich } = await import('../../../shared/domain/index.ts');
  const { mondayOf } = await import('../platform/week.ts');
  const gopYCu = (sid: number, nhan: string, cu: string | null, moi: string) => writeAudit({
    actorUserId: QL, action: 'gop_y_tuan.ghi', entityType: 'student', entityId: sid,
    entityLabel: `MB FT 101 · ${tuanLich(mondayOf(TODAY), TODAY)} · ${nhan}`, before: cu === null ? null : { noiDung: cu }, after: { noiDung: moi },
  });
  const maLop = 'MB FT 101';

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
  const ghi = async (userId: number, url: string, method: string, body: unknown) => {
    const r = await goi(userId, url, method, body);
    assert(r.status === 200, `${method} ${url}: ${r.status} ${JSON.stringify(r.json)?.slice(0, 300)}`);
    return r.json;
  };
  const ls = async (loai: string, id: number, q = '', userId = QL): Promise<Trang> => {
    const r = await goi(userId, `/lich-su?loai=${loai}&id=${id}${q}`);
    assert(r.status === 200, `lịch sử ${loai} ${id}${q}: ${r.status} ${JSON.stringify(r.json)?.slice(0, 300)}`);
    return r.json as Trang;
  };
  /** Trang cuối (đọc hết "Xem thêm"). */
  const cuoi = async (loai: string, id: number): Promise<Trang> => {
    let r = await ls(loai, id);
    for (let i = 0; r.tiep !== null && i < 50; i += 1) r = await ls(loai, id, `&tiep=${r.tiep}`);
    return r;
  };
  const soNk = (action: string, et: string, id: number) => one('SELECT COUNT(*) n FROM audit_logs WHERE action = ? AND entity_type = ? AND entity_id = ?', action, et, id).n as number;

  const them = await ghi(QL, '/intake/commit', 'POST', { classId: lop, idempotencyKey: `ov15i1-${Date.now()}`, rows: [
    { fullName: 'OV15i1 Em A', email: 'a.ov15i1@demo.test', dob: '2010-01-01', target: 7 },
    { fullName: 'OV15i1 Em B', email: 'b.ov15i1@demo.test', dob: '2010-02-02', target: 6.5 },
  ] });
  const [a, b] = them.studentIds as number[];
  const cy = one(`SELECT id FROM learning_cycles WHERE student_id = ? AND status = 'active'`, a).id as number;

  try {
    await checkAsync('OV15i1-2 · Góp ý: câu nhật ký đi chỉ mục (entity_type, action, entity_id) — không đọc dòng việc khác của em; mã lớp có "_" không khớp lớp khác', async () => {
      const plan = (conn.prepare(`EXPLAIN QUERY PLAN ${lichSuMod.sqlNhatKy(lichSuMod.DK_GOP_Y)}`).all(lop, maLop.length + 3, `${maLop} · `, 1e12, 60) as any[])
        .map((r) => r.detail).join(' | ');
      assert(/idx_audit_viec \(entity_type=\? AND action=\? AND entity_id=\?/.test(plan), `kế hoạch: ${plan}`);
      /* Mã lớp có "_" (LIKE coi là ký tự bất kỳ): nhật ký góp ý của lớp "MBxFT 101" không được hiện ở "MB_FT 101". */
      const id = Number(conn.prepare(`INSERT INTO audit_logs (actor_user_id, action, entity_type, entity_id, entity_label, before_json, after_json, created_at)
        VALUES (?, 'gop_y_tuan.ghi', 'student', ?, 'MBxFT 101 · W1 SEP · Listening', NULL, '{"noiDung":"lớp khác OV15i1"}', ?)`).run(QL, a, new Date().toISOString()).lastInsertRowid);
      conn.prepare('UPDATE classes SET code = ? WHERE id = ?').run('MB_FT 101', lop);
      try {
        const r = await ls('gop-y', lop);
        assert(!r.dong.some((m) => m.truong.some((x) => x.moi === 'lớp khác OV15i1')), 'LIKE "MB_FT 101 · %" khớp nhầm lớp "MBxFT 101"');
      } finally {
        conn.prepare('UPDATE classes SET code = ? WHERE id = ?').run(maLop, lop);
        conn.prepare('DELETE FROM audit_logs WHERE id = ?').run(id);
      }
    });

    await checkAsync('OV15i1-3 · Ô điểm phân trang theo con trỏ: 25 mục → trang 20 + tiep; lưu thêm giữa hai lần "Xem thêm" → trang 2 không lặp mục, đủ 5 mục cũ', async () => {
      const luot = one(`SELECT id FROM assessment_attempts WHERE student_id = ? AND status != 'cancelled' ORDER BY id LIMIT 1`, a).id as number;
      const chen = conn.prepare(`INSERT INTO attempt_schedule_history (attempt_id, action, field, old_value, new_value, reason, actor_user_id, created_at) VALUES (?, 'week_set', 'listening', ?, ?, NULL, ?, ?)`);
      for (let i = 0; i < 25; i += 1) chen.run(luot, `cu ${i}`, `moi ${i}`, QL, `2026-09-01T0${Math.floor(i / 10)}:${String((i % 10) * 5).padStart(2, '0')}:00.000Z`);
      const p1 = await ls('o', luot);
      assert(p1.dong.length === 20 && p1.tiep !== null, `trang 1: ${p1.dong.length} · tiep ${p1.tiep}`);
      chen.run(luot, 'cu moi', 'moi moi', P.admin.userId, new Date().toISOString());   // người khác lưu giữa hai lần bấm (mục mới riêng)
      const p2 = await ls('o', luot, `&tiep=${p1.tiep}`);
      const ids = [...p1.dong, ...p2.dong].map((x) => String(x.id));
      assert(new Set(ids).size === ids.length, `lặp mục: ${ids.join(',')}`);
      const chen25 = [...p1.dong, ...p2.dong].flatMap((m) => m.truong.map((x) => x.moi)).filter((v) => /^moi \d+$/.test(v ?? ''));
      assert(p2.tiep === null && new Set(chen25).size === 25 && chen25.length === 25, `đủ 25 dòng cũ, không sót không lặp: ${chen25.length}`);
    });

    await checkAsync('OV15i1-3b · Ô điểm: 24 mục CÙNG mili-giây (hai người xen kẽ) → đọc hết các trang không mất, không lặp mục', async () => {
      const luot = one(`SELECT id FROM assessment_attempts WHERE student_id = ? AND status != 'cancelled' ORDER BY id LIMIT 1`, b).id as number;
      const chen = conn.prepare(`INSERT INTO attempt_schedule_history (attempt_id, action, field, old_value, new_value, reason, actor_user_id, created_at) VALUES (?, 'week_set', 'reading', ?, ?, NULL, ?, '2026-08-01T00:00:00.000Z')`);
      for (let i = 0; i < 24; i += 1) chen.run(luot, `cu ${i}`, `cung ${i}`, i % 2 ? QL : P.admin.userId);
      const ds: Muc[] = [];
      let r = await ls('o', luot);
      ds.push(...r.dong);
      for (let k = 0; r.tiep !== null && k < 10; k += 1) { r = await ls('o', luot, `&tiep=${r.tiep}`); ds.push(...r.dong); }
      const ids = ds.map((x) => String(x.id));
      const cung = ds.flatMap((m) => m.truong.map((x) => x.moi)).filter((v) => /^cung \d+$/.test(v ?? ''));
      assert(new Set(ids).size === ids.length && new Set(cung).size === 24 && cung.length === 24, `đọc được ${cung.length}/24 · ${ids.length} mục`);
    });

    await checkAsync('OV15i1-4 · Quyền một mức: thi-that cùng cổng với hv — GVBM xem được hồ sơ em nhưng 403 lịch sử Bước tiếp / thi thật; QL 200', async () => {
      const gvbm = P.subjectTeacher.userId as number;
      assert((await goi(gvbm, `/students/${a}`)).status === 200, 'GVBM xem được hồ sơ em (điều kiện của phép kiểm)');
      assert((await goi(gvbm, `/lich-su?loai=hv&id=${a}`)).status === 403, 'hv 403');
      const r = await goi(gvbm, `/lich-su?loai=thi-that&id=${cy}`);
      assert(r.status === 403, `thi-that GVBM: ${r.status}`);
      assert((await goi(QL, `/lich-su?loai=thi-that&id=${cy}`)).status === 200, 'QL 200');
    });

    await checkAsync('OV15i1-5 · Dòng hệ thống (không người ghi): người = "Hệ thống", KHÔNG thêm "Nguồn: Hệ thống"', async () => {
      conn.prepare(`INSERT INTO audit_logs (actor_user_id, action, entity_type, entity_id, entity_label, before_json, after_json, created_at)
        VALUES (NULL, 'cycle.han_sau_thi', 'learning_cycle', ?, NULL, '{}', '{"hanSauThi":"2026-10-30"}', ?)`).run(cy, new Date().toISOString());
      const d = (await ls('thi-that', cy)).dong[0];
      assert(d?.nguoi === 'Hệ thống' && d.nguon === null && d.truong.some((x) => x.ten === 'Hạn sau thi'), JSON.stringify(d));
    });

    await checkAsync('OV15i1-7a · Lô nhập 0 em (trùng email) → KHÔNG ghi mục nhập HV', async () => {
      const n0 = soNk('student.bulk_add', 'class', lop);
      const r = await ghi(QL, '/intake/commit', 'POST', { classId: lop, idempotencyKey: `ov15i1-0-${Date.now()}`, rows: [{ fullName: 'OV15i1 Em A', email: 'a.ov15i1@demo.test', dob: '2010-01-01', target: 7 }] });
      assert(r.added === 0, `added ${r.added}`);
      assert(soNk('student.bulk_add', 'class', lop) === n0, `ghi thêm mục: ${n0} → ${soNk('student.bulk_add', 'class', lop)}`);
    });

    await checkAsync('OV15i1-7b · Nhập HV: em đã xoá hiện "Học viên đã xoá" thay tên; nguồn có bản EN', async () => {
      const r0 = await ghi(QL, '/intake/commit', 'POST', { classId: lop, idempotencyKey: `ov15i1-x-${Date.now()}`, rows: [{ fullName: 'OV15i1 Em Xoá', email: 'x.ov15i1@demo.test', dob: '2010-03-03', target: 6 }] });
      const x = r0.studentIds[0] as number;
      xoaHv.xoaHocVien(P.admin, x, { maXacNhan: one('SELECT student_code c FROM students WHERE id = ?', x).c });
      const d = (await ls('nhap-hv', lop)).dong[0];
      assert(d && d.truong.length === 1 && d.truong[0].doiTuong === 'Học viên đã xoá', JSON.stringify(d));
      assert(d.nguon && dichMau('en', d.nguon) !== d.nguon, `EN nguồn: ${d.nguon}`);
    });

    await checkAsync('OV15i1-7c · Đổi chương trình kết thúc phân công môn không còn → mục phân công "Writing 1: tên → trống"', async () => {
      const cid = (intake.createClass(P.admin, { code: 'MB FT 9915', branchId: one(`SELECT branch_id b FROM classes WHERE id = ?`, lop).b,
        kind: 'FT', isFastTrack: true, startDate: '2026-08-03' }) as any).id as number;
      conn.prepare(`INSERT INTO teacher_assignments (class_id, user_id, skill, is_core, status, effective_from, created_at) VALUES (?, ?, 'writing1', 0, 'active', '2026-08-03', ?)`)
        .run(cid, P.subjectTeacher.userId, new Date().toISOString());
      ttl.capNhatThongTinLop(P.admin, cid, { programmeCode: 'FOU' });
      const r = await ls('lop', cid, '&loc=phan-cong');
      const ten = one('SELECT full_name n FROM users WHERE id = ?', P.subjectTeacher.userId).n;
      const f = r.dong[0]?.truong.find((x) => x.cu === ten);
      assert(f && f.moi === null && r.dong[0].nguon === 'Đổi chương trình', JSON.stringify(r.dong[0]));
      assert(dichMau('en', 'Đổi chương trình') !== 'Đổi chương trình', 'EN "Đổi chương trình"');
    });

    await checkAsync('OV15i1-8a · Sửa cả lớp 2 em = MỘT mục ở lịch sử lớp, mở ra từng em (Họ tên cũ → mới)', async () => {
      await ghi(QL, `/classes/${lop}/sua-ca-lop`, 'POST', { idempotencyKey: `ov15i1-scl-${Date.now()}`,
        rows: [{ studentId: a, fullName: 'OV15i1 Em A2' }, { studentId: b, fullName: 'OV15i1 Em B2' }] });
      const d = (await ls('lop', lop)).dong[0];
      assert(d?.nguon === 'Sửa cả lớp', JSON.stringify(d));
      const ho = d.truong.filter((x) => x.ten === 'Họ tên');
      assert(ho.length === 2 && ho.some((x) => x.doiTuong === 'OV15i1 Em A2' && x.cu === 'OV15i1 Em A' && x.moi === 'OV15i1 Em A2'), JSON.stringify(d.truong));
    });

    await checkAsync('OV15i1-8c · Quyền: GVBM xem lịch sử lớp thấy mục Sửa cả lớp nhưng KHÔNG thấy trường của em ("Sửa cả lớp · 2 em"); QL thấy đủ; lọc "Thông tin" vẫn có mục', async () => {
      const gvbm = P.subjectTeacher.userId as number;
      const d = (await ls('lop', lop, '', gvbm)).dong.find((m) => m.nguon === 'Sửa cả lớp');
      assert(d && d.truong.length === 1 && !d.truong[0].doiTuong && d.truong[0].ten === 'Sửa cả lớp · 2 em' && d.truong[0].cu === null && d.truong[0].moi === null, JSON.stringify(d));
      assert(!JSON.stringify(d).includes('OV15i1 Em A'), 'lộ tên em cho GVBM');
      const q = (await ls('lop', lop, '&loc=thong-tin')).dong.find((m) => m.nguon === 'Sửa cả lớp');
      assert(q && q.truong.filter((x) => x.ten === 'Họ tên').length === 2, `lọc Thông tin: ${JSON.stringify(q)}`);
      assert(dichMau('en', 'Sửa cả lớp · 2 em') === 'Edit whole class · 2 students', dichMau('en', 'Sửa cả lớp · 2 em'));
    });

    await checkAsync('OV15i1-8d · Sửa cả lớp rồi xoá cả 2 em: Quản trị thấy mỗi em một khối riêng (không dồn chung "Học viên đã xoá")', async () => {
      const r0 = await ghi(QL, '/intake/commit', 'POST', { classId: lop, idempotencyKey: `ov15i1-d-${Date.now()}`, rows: [
        { fullName: 'OV15i1 Xoá 1', email: 'x1.ov15i1@demo.test', dob: '2010-04-04', target: 6 }, { fullName: 'OV15i1 Xoá 2', email: 'x2.ov15i1@demo.test', dob: '2010-05-05', target: 6 }] });
      const [x1, x2] = r0.studentIds as number[];
      await ghi(QL, `/classes/${lop}/sua-ca-lop`, 'POST', { idempotencyKey: `ov15i1-scl2-${Date.now()}`, rows: [{ studentId: x1, fullName: 'OV15i1 Xoá 1b' }, { studentId: x2, fullName: 'OV15i1 Xoá 2b' }] });
      for (const x of [x1, x2]) xoaHv.xoaHocVien(P.admin, x, { maXacNhan: one('SELECT student_code c FROM students WHERE id = ?', x).c });
      const d = (await ls('lop', lop, '', P.admin.userId)).dong.find((m) => m.nguon === 'Sửa cả lớp');
      const nhom = new Set(d?.truong.filter((x) => x.ten === 'Họ tên').map((x) => x.doiTuong));
      assert(d && nhom.size === 2, JSON.stringify(d));
    });

    await checkAsync('OV15i1-8b · Dán Excel (điểm) = MỘT mục ở lịch sử lớp (số dòng · ô)', async () => {
      const luot = one(`SELECT id, attempt_no n FROM assessment_attempts WHERE student_id = ? AND kind = 'mock' AND status != 'cancelled' ORDER BY attempt_no LIMIT 1`, b);
      await ghi(QL, '/attempts/scores/lo', 'POST', { classId: lop, luot: `mt:${luot.n}`, loId: `ov15i1-${Date.now()}`, cuoi: true,
        dong: [{ attemptId: luot.id, o: [{ skill: 'listening', band: 6 }] }] });
      const d = (await ls('lop', lop)).dong[0];
      assert(d?.nguon === 'Dán từ Excel' && d.truong.length === 1 && /1 dòng · 1 ô/.test(d.truong[0].moi ?? ''), JSON.stringify(d));
      assert(dichMau('en', d.truong[0].moi!) !== d.truong[0].moi, `EN: ${d.truong[0].moi}`);
    });

    await checkAsync('OV15i1-6 · Chữ máy chủ ghép động có bản EN: "Góp ý · {tuần} · {môn}", "Lịch · {môn}", "{môn} · Nhận xét"', async () => {
      gopYCu(a, 'Listening', null, 'OV15i1 góp ý');
      const g = (await ls('gop-y', lop)).dong[0].truong[0].ten;
      const luot = one(`SELECT id FROM assessment_attempts WHERE student_id = ? AND status != 'cancelled' ORDER BY id LIMIT 1`, a).id as number;
      const o = (await ls('o', luot)).dong[0].truong[0].ten;
      const VIET = /[àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]|\b(ô|dòng|thêm|của)\b|Schedule of/i;
      for (const s of [g, o, 'Lịch · Tuần thi', 'Speaking · Nhận xét', 'Listening · Điểm', 'Writing 1 · GV chấm', 'Thêm học viên hàng loạt · MB FT 101',
        'Sửa cả lớp', 'Đổi chương trình', 'Dán từ Excel', 'Hoàn tác dán Excel', '3 dòng · 12 ô', 'thêm 1 · kết thúc 2']) {
        assert(!VIET.test(dichMau('en', s)), `bản EN còn chữ Việt / sai: "${s}" → "${dichMau('en', s)}"`);
      }
    });

    await checkAsync('OV15i1-9 · "Lịch sử bắt đầu ghi từ" ở trang cuối cho hv, thi-that, gop-y, o (đối tượng có trước mốc ghi)', async () => {
      const moc = "(SELECT value FROM demo_config WHERE key = 'lich_su_thay_doi_tu')";
      const hv = one(`SELECT s.id FROM enrollments e JOIN students s ON s.id = e.student_id WHERE e.class_id = ? AND s.created_at < ${moc} ORDER BY s.id LIMIT 1`, lop).id as number;
      const c = one(`SELECT id FROM learning_cycles WHERE student_id = ? AND created_at < ${moc} ORDER BY id LIMIT 1`, hv).id as number;
      const l = one(`SELECT id FROM assessment_attempts WHERE class_id = ? AND created_at < ${moc} ORDER BY id LIMIT 1`, lop).id as number;
      for (const [loai, id] of [['hv', hv], ['thi-that', c], ['gop-y', lop], ['o', l]] as [string, number][]) {
        const r = await cuoi(loai, id);
        assert(/^\d{4}-\d{2}-\d{2}$/.test(r.batDau ?? ''), `${loai} ${id}: batDau ${r.batDau}`);
      }
      assert((await cuoi('thi-that', cy)).batDau === null, 'lộ trình tạo sau mốc → không báo');
    });
  } finally {
    may.close();
  }
}
