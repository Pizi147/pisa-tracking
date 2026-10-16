/**
 * PHÉP KIỂM OV-13p — TVV / CX tạo lớp + thêm học viên (chủ SP 16/10), qua HTTP thật. TVV theo chi nhánh của grant, CX mọi chi nhánh; KHÔNG phân công GV,
 * KHÔNG chuyển lớp / lưu trữ. GVBM / Admin không tạo lớp, không thêm HV; GVCN vẫn thêm HV lớp mình (student.add siết như student.edit); QL / QT như trước.
 * Migrate prOv13p: DB cũ → cấp đúng vai, chạy lần hai không đổi.
 */
import type { YThucTestKit } from './yThuc.tests.ts';
import { emailThu } from '../seed/emailThu.ts';

export async function runPrOv13pTests(t: YThucTestKit) {
  const { checkAsync, check, assert, conn, P } = t;
  const accounts: any = await import('../platform/accounts.ts');
  const { migratePrOv13p, KHOA_PR_OV13P } = await import('../migrate/prOv13p.ts');
  const { ROLE_PERMISSIONS } = await import('../seed/data.ts');
  const { createApp } = await import('../app.ts');
  const { xoaNho } = await import('../platform/nguCanhRequest.ts');
  console.log('\nOV-13p · TVV / CX tạo lớp + thêm học viên (student.add), không mở chuyển lớp / lưu trữ / phân công GV');

  const one = (sql: string, ...a: unknown[]) => conn.prepare(sql).get(...a) as any;
  const all = (sql: string, ...a: unknown[]) => conn.prepare(sql).all(...a) as any[];
  let seq = 0;
  const tao = (roles: { role: string; branches: string[] }[]) => {
    seq += 1;
    return accounts.createAccount(P.admin, { email: `ov13p.${seq}${accounts.EMAIL_SUFFIX}`, password: 'matkhau-ov13p', fullName: `Thử OV13p ${seq}`, roles }).userId as number;
  };
  const idTvv = tao([{ role: 'consultant', branches: ['CP'] }]);
  const idCx = tao([{ role: 'cx', branches: [] }]);
  const idAdmin = tao([{ role: 'office_admin', branches: ['CP'] }]);
  const cn = (code: string) => one('SELECT id FROM branches WHERE code = ?', code).id as number;
  const CP = cn('CP'); const MB = cn('MB');
  const lopMb = one(`SELECT id FROM classes WHERE code = 'MB FT 101'`).id as number;
  /* Em đang học ở Cẩm Phả (chuyển lớp / lưu trữ) + một lớp CP khác làm đích chuyển. */
  const em = one(`SELECT e.student_id id, e.class_id lop FROM enrollments e JOIN classes c ON c.id = e.class_id
      WHERE c.branch_id = ? AND c.status = 'active' AND e.status = 'active' ORDER BY e.student_id LIMIT 1`, CP);
  const lopCpKhac = one(`SELECT id FROM classes WHERE branch_id = ? AND status = 'active' AND id != ? ORDER BY id LIMIT 1`, CP, em?.lop)?.id;

  check('OV13p-0 · seed: TVV / CX có class.create + student.add, không class.assign / student.edit; vai có student.edit đều có student.add', () => {
    assert(em?.id && lopCpKhac, JSON.stringify({ em, lopCpKhac }));
    for (const k of ['consultant', 'cx']) {
      const q = ROLE_PERMISSIONS[k];
      assert(q.includes('class.create') && q.includes('student.add'), `${k} thiếu quyền`);
      assert(!q.includes('class.assign') && !q.includes('student.edit') && !q.includes('cycle.edit'), `${k} bị nới quá`);
    }
    for (const [k, q] of Object.entries(ROLE_PERMISSIONS)) if (q.includes('student.edit')) assert(q.includes('student.add'), `${k} có student.edit mà thiếu student.add`);
    assert(!ROLE_PERMISSIONS.office_admin.includes('student.add') && !ROLE_PERMISSIONS.office_admin.includes('class.create'), 'Admin không được có');
  });

  await checkAsync('OV13p-1 · migrate prOv13p: DB cũ → TVV, CX có class.create + student.add, vai có student.edit có student.add; lần hai không đổi', async () => {
    conn.exec('BEGIN IMMEDIATE');
    try {
      const pid = (k: string) => one('SELECT id FROM permissions WHERE key = ?', k).id as number;
      /* Giả DB cũ: chưa ai có student.add, TVV / CX chưa có class.create, chưa có khoá. */
      conn.prepare('DELETE FROM role_permissions WHERE permission_id = ?').run(pid('student.add'));
      conn.prepare(`DELETE FROM role_permissions WHERE permission_id = ? AND role_id IN (SELECT id FROM roles WHERE key IN ('consultant','cx'))`).run(pid('class.create'));
      conn.prepare('DELETE FROM demo_config WHERE key = ?').run(KHOA_PR_OV13P);
      const truoc = all('SELECT role_id, permission_id FROM role_permissions').length;
      const lan1: string[] = [];
      migratePrOv13p(conn, lan1);
      const vai = (k: string) => all(`SELECT r.key FROM role_permissions rp JOIN roles r ON r.id = rp.role_id JOIN permissions p ON p.id = rp.permission_id WHERE p.key = ?`, k)
        .map((x) => x.key).sort().join(',');
      assert(vai('student.add') === 'consultant,cx,manager,system_admin,teacher', `student.add: ${vai('student.add')}`);
      assert(vai('class.create') === 'consultant,cx,manager,system_admin', `class.create: ${vai('class.create')}`);
      const sau = all('SELECT role_id, permission_id FROM role_permissions').length;
      assert(lan1.length === 1 && sau - truoc === 7, `lần 1: ${lan1.join(' | ')} · thêm ${sau - truoc}`);
      const lan2: string[] = [];
      migratePrOv13p(conn, lan2);
      assert(!lan2.length && all('SELECT 1 FROM role_permissions').length === sau, `lần 2 vẫn đổi: ${lan2.join(' | ')}`);
    } finally { conn.exec('ROLLBACK'); xoaNho(); }
  });

  const may = createApp().listen(0);
  const cong = (may.address() as any).port as number;
  const goi = async (method: string, url: string, cookie: string, body?: unknown) => {
    const res = await fetch(`http://127.0.0.1:${cong}/api${url}`, {
      method, headers: { 'content-type': 'application/json', cookie }, body: body === undefined ? undefined : JSON.stringify(body),
    });
    let json: any = null;
    try { json = await res.json(); } catch { /* không thân */ }
    return { status: res.status, json };
  };
  const vao = async (userId: number) => {
    const res = await fetch(`http://127.0.0.1:${cong}/api/demo/session`, {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ userId }),
    });
    return (res.headers.get('set-cookie') ?? '').split(';')[0];
  };
  let so = 970;
  const lopMoi = (branchId: number) => ({ branchId, chuongTrinh: 'FT', loTrinh: 'LT1', so: String(++so) });
  const mot = (ten: string) => ({ rows: [{ fullName: ten, target: 7, email: emailThu(), dob: '2010-01-01' }] });

  try {
    const tv = await vao(idTvv); const cx = await vao(idCx); const ad = await vao(idAdmin);
    const gvbm = await vao(P.subjectTeacher.userId); const gvcn = await vao(P.coreTeacher.userId);
    const ql = await vao(P.cpManager.userId); const qt = await vao(P.admin.userId);
    let lopTvv = 0;

    await checkAsync('OV13p-2 · tạo lớp: TVV chi nhánh mình 200, chi nhánh khác 403; CX 200 (mọi chi nhánh); QL / QT 200; GVBM / Admin 403; TVV kèm phân công GV 403', async () => {
      let r = await goi('POST', '/classes', tv, lopMoi(CP));
      assert(r.status === 200 && r.json?.id, `TVV CP: ${r.status} ${r.json?.error}`);
      lopTvv = r.json.id;
      r = await goi('POST', '/classes', tv, lopMoi(MB));
      assert(r.status === 403, `TVV MB: ${r.status}`);
      r = await goi('POST', '/classes/bulk', tv, { rows: [lopMoi(CP), lopMoi(MB)] });
      assert(r.status === 403, `TVV lô có dòng MB: ${r.status}`);
      for (const [ten, ck, b] of [['CX MB', cx, MB], ['CX CP', cx, CP], ['QL CP', ql, CP], ['QT MB', qt, MB]] as const) {
        r = await goi('POST', '/classes', ck, lopMoi(b));
        assert(r.status === 200, `${ten}: ${r.status} ${r.json?.error}`);
      }
      for (const [ten, ck, b] of [['GVBM', gvbm, MB], ['Admin', ad, CP]] as const) {
        r = await goi('POST', '/classes', ck, lopMoi(b));
        assert(r.status === 403, `${ten}: ${r.status}`);
      }
      const gv = one(`SELECT user_id FROM teacher_assignments WHERE status = 'active' LIMIT 1`).user_id;
      r = await goi('POST', '/classes', tv, { ...lopMoi(CP), slots: [{ skill: 'listening', userId: gv }] });
      assert(r.status === 403, `TVV kèm phân công: ${r.status}`);
      const ref = await goi('GET', '/ref/branches?muc=tao-lop', tv);
      assert(ref.status === 200 && ref.json.map((b: any) => b.id).join() === String(CP), `chi nhánh tạo lớp của TVV: ${JSON.stringify(ref.json)}`);
      /* Cờ khối Phân công của form "+ Lớp mới": TVV / CX false ở mọi chi nhánh, QL true ở chi nhánh mình. */
      for (const [ten, ck, mong] of [['TVV', tv, false], ['CX', cx, false], ['QL', ql, true]] as const) {
        const b = await goi('GET', '/ref/branches?muc=tao-lop', ck);
        assert(b.status === 200 && b.json.length > 0 && b.json.every((x: any) => x.phanCong === mong), `${ten} phanCong: ${JSON.stringify(b.json)}`);
      }
    });

    await checkAsync('OV13p-3 · thêm HV: TVV / CX một em + lô (xem trước + lưu) vào lớp trong phạm vi 200; TVV lớp ngoài chi nhánh 403; GVBM / Admin 403; GVCN lớp mình, QL, QT vẫn 200', async () => {
      const dem = () => one(`SELECT COUNT(*) n FROM enrollments WHERE class_id = ? AND status = 'active'`, lopTvv).n as number;
      let r = await goi('POST', '/intake/preview', tv, { classId: lopTvv, ...mot('OV13p Một') });
      assert(r.status === 200 && !(r.json.issues ?? []).some((i: any) => i.muc === 'loi'), `TVV xem trước: ${r.status} ${JSON.stringify(r.json?.issues)}`);
      r = await goi('POST', '/intake/commit', tv, { classId: lopTvv, ...mot('OV13p Một'), idempotencyKey: 'ov13p-1' });
      assert(r.status === 200 && dem() === 1, `TVV thêm một em: ${r.status} ${r.json?.error} · ${dem()}`);
      const lo = { rows: ['OV13p Lô A', 'OV13p Lô B'].map((fullName) => ({ fullName, target: 6.5, email: emailThu(), dob: '2010-02-02' })) };
      r = await goi('POST', '/intake/commit', cx, { classId: lopTvv, ...lo, idempotencyKey: 'ov13p-2' });
      assert(r.status === 200 && dem() === 3, `CX nhập lô: ${r.status} ${r.json?.error} · ${dem()}`);
      r = await goi('POST', '/intake/preview', tv, { classId: lopMb, ...mot('OV13p Ngoài') });
      assert(r.status === 200 && r.json.issues?.[0]?.field === 'classId' && !r.json.rows.length, `TVV xem trước lớp MB: ${JSON.stringify(r.json)}`);
      for (const [ten, ck, lop] of [['TVV lớp MB', tv, lopMb], ['GVBM', gvbm, lopMb], ['Admin', ad, lopTvv]] as const) {
        r = await goi('POST', '/intake/commit', ck, { classId: lop, ...mot(`OV13p ${ten}`) });
        assert(r.status === 403, `${ten}: ${r.status}`);
      }
      for (const [ten, ck, lop] of [['GVCN', gvcn, lopMb], ['QL', ql, lopTvv], ['QT', qt, lopMb]] as const) {
        r = await goi('POST', '/intake/commit', ck, { classId: lop, ...mot(`OV13p ${ten}`), idempotencyKey: `ov13p-${ten}` });
        assert(r.status === 200, `${ten}: ${r.status} ${r.json?.error}`);
      }
    });

    await checkAsync('OV13p-4 · TVV / CX vẫn 403: chuyển lớp, lưu trữ, phân công GV', async () => {
      const sai: string[] = [];
      for (const [ten, ck] of [['TVV', tv], ['CX', cx]] as const) {
        for (const [viec, m, url, body] of [
          ['Chuyển lớp', 'POST', `/students/${em.id}/transfer`, { toClassId: lopCpKhac, lyDo: 'thử' }],
          ['Lưu trữ', 'POST', `/students/${em.id}/archive`, undefined],
          ['Phân công GV', 'PUT', `/classes/${lopTvv}/teachers`, { slots: [] }],
        ] as const) {
          const r = await goi(m, url, ck, body);
          if (r.status !== 403) sai.push(`${ten} ${viec}: ${r.status} ${r.json?.error ?? ''}`);
        }
      }
      assert(!sai.length, sai.join(' | '));
    });

    await checkAsync('OV13p-5 · nút theo quyền: trang TVV / CX có "+ Lớp mới" · "+ Học viên"; hồ sơ lớp TVV: + Học viên có, sửa HV (student.edit) không; Admin không', async () => {
      for (const [ten, ck] of [['TVV', tv], ['CX', cx]] as const) {
        const r = await goi('GET', '/hoc-vien-lop/theo-vai', ck);
        assert(r.status === 200 && r.json.coTheTaoLop === true && r.json.coTheThemHocVien === true, `${ten}: ${r.status} ${JSON.stringify({ a: r.json?.coTheTaoLop, b: r.json?.coTheThemHocVien })}`);
      }
      const h = await goi('GET', `/classes/${lopTvv}/overview`, tv);
      assert(h.status === 200 && h.json.viewer.canAddStudents === true && h.json.viewer.coTheSuaHocVien === false && h.json.viewer.canAssign === false,
        `hồ sơ lớp TVV: ${h.status} ${JSON.stringify(h.json?.viewer)}`);
      const a = await goi('GET', '/hoc-vien-lop', ad);
      assert(a.status === 200 && a.json.coTheTaoLop === false && a.json.coTheThemHocVien === false, `Admin: ${JSON.stringify({ a: a.json?.coTheTaoLop, b: a.json?.coTheThemHocVien })}`);
    });
  } finally {
    may.close();
    xoaNho();
  }
}
