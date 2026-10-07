/**
 * PHÉP KIỂM PR-QT-TK — Quản trị hệ thống sửa thông tin mọi tài khoản (chủ sản phẩm 07/10):
 * họ tên, email đăng nhập, điện thoại, chức danh, email khác. CHỈ Quản trị; email theo luật `checkEmail`; trùng → 409;
 * nhật ký cũ → mới; đổi email không đăng xuất (phiên theo user id) — đăng nhập bằng email mới được, email cũ không.
 */
import type { YThucTestKit } from './yThuc.tests.ts';

export async function runPrQtTkTests(t: YThucTestKit) {
  const { check, checkAsync, assert, assertThrows, conn, P } = t;
  const accounts: any = await import('../platform/accounts.ts');
  console.log('\nPR-QT-TK · Quản trị sửa thông tin tài khoản');

  const MK = 'matkhau-qttk';
  accounts.createAccount(P.admin, {
    email: `qttk.goc${accounts.EMAIL_SUFFIX}`, password: MK, fullName: 'Thử QT TK',
    roles: [{ role: 'teacher', branches: ['MB'] }],
  });
  const id = (conn.prepare('SELECT id FROM users WHERE email = ?').get(`qttk.goc${accounts.EMAIL_SUFFIX}`) as any).id as number;
  const emailMoi = `qttk.moi${accounts.EMAIL_SUFFIX}`;
  const doc = () => conn.prepare('SELECT * FROM users WHERE id = ?').get(id) as any;
  const status = (fn: () => unknown) => { try { fn(); return 200; } catch (e: any) { return e.status ?? 500; } };

  check('QTTK-1 · Quản trị sửa họ tên, email, điện thoại, chức danh, email khác', () => {
    const r = accounts.adminUpdateAccount(P.admin, id, {
      fullName: '  Thử QT TK Mới ', email: ` QTTK.MOI${accounts.EMAIL_SUFFIX.toUpperCase()} `, phone: '0901 234 567',
      title: 'Giáo viên', extraEmails: ['canhan@gmail.com', emailMoi],
    });
    const u = doc();
    assert(u.full_name === 'Thử QT TK Mới', `họ tên: ${u.full_name}`);
    assert(u.email === emailMoi, `email: ${u.email}`);
    assert(u.phone === '0901 234 567' && u.title === 'Giáo viên', `phone/title: ${u.phone}/${u.title}`);
    const phu = (conn.prepare('SELECT email FROM user_emails WHERE user_id = ? ORDER BY id').all(id) as any[]).map((x) => x.email);
    assert(phu.join() === 'canhan@gmail.com', `email khác (bỏ trùng email đăng nhập): ${phu.join()}`);
    assert(r.email === emailMoi && r.fullName === 'Thử QT TK Mới', `trả về: ${JSON.stringify(r)}`);
  });

  check('QTTK-2 · QL và GVCN gọi hàm → 403, không đổi gì', () => {
    for (const p of [P.mbManager, P.coreTeacher]) {
      assert(status(() => accounts.adminUpdateAccount(p, id, { fullName: 'Hack' })) === 403, `vai ${p.userId} phải 403`);
    }
    assert(doc().full_name === 'Thử QT TK Mới', 'không đổi tên');
  });

  check('QTTK-3 · email sai đuôi → 400; họ tên trống → 400; họ tên > 100 → 400', () => {
    assertThrows(() => accounts.adminUpdateAccount(P.admin, id, { email: 'ai@gmail.com' }), /đuôi/, 'sai đuôi');
    assert(status(() => accounts.adminUpdateAccount(P.admin, id, { email: 'ai@gmail.com' })) === 400, '400');
    assert(status(() => accounts.adminUpdateAccount(P.admin, id, { fullName: '   ' })) === 400, 'tên trống 400');
    assert(status(() => accounts.adminUpdateAccount(P.admin, id, { fullName: 'a'.repeat(101) })) === 400, 'tên dài 400');
    assert(status(() => accounts.adminUpdateAccount(P.admin, id, { extraEmails: ['khong-phai-email'] })) === 400, 'email khác sai 400');
    assert(doc().email === emailMoi, 'không đổi email');
  });

  check('QTTK-4 · email trùng người khác → 409 câu rõ; tài khoản không có → 404', () => {
    const khac = (conn.prepare('SELECT email FROM users WHERE id <> ? AND email IS NOT NULL LIMIT 1').get(id) as any).email;
    let loi: any = null;
    try { accounts.adminUpdateAccount(P.admin, id, { email: khac }); } catch (e) { loi = e; }
    assert(loi?.status === 409 && /đã có tài khoản/.test(loi.message), `409: ${loi?.status} ${loi?.message}`);
    assert(status(() => accounts.adminUpdateAccount(P.admin, 9_999_999, { fullName: 'X' })) === 404, '404');
  });

  check('QTTK-5 · nhật ký quản trị có dòng cũ → mới', () => {
    const r = conn.prepare("SELECT * FROM audit_logs WHERE action = 'user_info_set' AND entity_id = ? ORDER BY id DESC LIMIT 1").get(id) as any;
    assert(r && r.actor_user_id === P.admin.userId, 'thiếu dòng nhật ký');
    const truoc = JSON.parse(r.before_json), sau = JSON.parse(r.after_json);
    assert(truoc.email === `qttk.goc${accounts.EMAIL_SUFFIX}` && sau.email === emailMoi, `email cũ → mới: ${r.before_json} → ${r.after_json}`);
    assert(truoc.fullName === 'Thử QT TK' && sau.fullName === 'Thử QT TK Mới', 'họ tên cũ → mới');
    const n = (conn.prepare("SELECT COUNT(*) n FROM audit_logs WHERE action = 'user_info_set' AND entity_id = ?").get(id) as any).n;
    accounts.adminUpdateAccount(P.admin, id, { fullName: 'Thử QT TK Mới' });
    const n2 = (conn.prepare("SELECT COUNT(*) n FROM audit_logs WHERE action = 'user_info_set' AND entity_id = ?").get(id) as any).n;
    assert(n2 === n, 'không đổi gì thì không ghi nhật ký');
  });

  // ------------------------------------------------------------------ HTTP
  const { createApp } = await import('../app.ts');
  const may = createApp().listen(0);
  const cong = (may.address() as any).port as number;
  const goi = async (method: string, url: string, o: { body?: unknown; cookie?: string } = {}) => {
    const headers: Record<string, string> = { 'content-type': 'application/json' };
    if (o.cookie) headers.cookie = o.cookie;
    const res = await fetch(`http://127.0.0.1:${cong}/api${url}`, { method, headers, body: o.body === undefined ? undefined : JSON.stringify(o.body) });
    let json: any = null;
    try { json = await res.json(); } catch { /* không có thân JSON */ }
    return { status: res.status, json, cookie: (res.headers.get('set-cookie') ?? '').split(';')[0] };
  };
  const vao = async (userId: number) => (await goi('POST', '/demo/session', { body: { userId } })).cookie;

  try {
    await checkAsync('QTTK-6 · PATCH /admin/accounts/:id: QL, GVCN → 403; Quản trị → 200', async () => {
      for (const p of [P.mbManager, P.coreTeacher]) {
        const r = await goi('PATCH', `/admin/accounts/${id}`, { cookie: await vao(p.userId), body: { fullName: 'Hack' } });
        assert(r.status === 403, `vai ${p.userId}: ${r.status}`);
      }
      const r = await goi('PATCH', `/admin/accounts/${id}`, { cookie: await vao(P.admin.userId), body: { phone: '0900' } });
      assert(r.status === 200 && r.json.phone === '0900', `QT: ${r.status} ${JSON.stringify(r.json)}`);
      assert(doc().full_name === 'Thử QT TK Mới', 'không bị đổi tên');
    });

    await checkAsync('QTTK-7 · đổi email: phiên đang mở vẫn dùng được; đăng nhập email mới được, email cũ không', async () => {
      const dn = await goi('POST', '/auth/login', { body: { email: emailMoi, password: MK } });
      assert(dn.status === 200 && dn.cookie, `đăng nhập email mới: ${dn.status} ${JSON.stringify(dn.json)}`);
      const email3 = `qttk.ba${accounts.EMAIL_SUFFIX}`;
      const r = await goi('PATCH', `/admin/accounts/${id}`, { cookie: await vao(P.admin.userId), body: { email: email3 } });
      assert(r.status === 200, `QT đổi email lần 2: ${r.status}`);
      const me = await goi('GET', '/me/profile', { cookie: dn.cookie });
      assert(me.status === 200 && me.json.email === email3, `phiên cũ vẫn vào, thấy email mới: ${me.status} ${me.json?.email}`);
      const cu = await goi('POST', '/auth/login', { body: { email: emailMoi, password: MK } });
      assert(cu.status === 400, `email cũ không vào được: ${cu.status}`);
      const moi = await goi('POST', '/auth/login', { body: { email: email3, password: MK } });
      assert(moi.status === 200, `email mới vào được: ${moi.status}`);
    });
  } finally {
    may.close();
  }
}
