/**
 * PHÉP KIỂM PR-TD2-d — phiên + quyền đọc bằng MỘT câu SQL (trước: 6 câu nối tiếp mỗi request).
 * Luật bảo mật giữ y như cũ: phiên hết hạn / tài khoản khoá / chờ duyệt / bị xoá → không vào được; đổi vai, quyền cấp riêng,
 * phân công có hiệu lực NGAY request sau (không nhớ quyền giữa các request); đổi email không đăng xuất.
 */
import type { YThucTestKit } from './yThuc.tests.ts';
import type { Principal } from '../permissions.ts';

export async function runPrTd2dTests(t: YThucTestKit) {
  const { check, assert, conn, P } = t;
  const auth: any = await import('../auth.ts');
  const perms: any = await import('../permissions.ts');
  const accounts: any = await import('../platform/accounts.ts');
  const ngu: any = await import('../platform/nguCanhRequest.ts');
  console.log('\nPR-TD2-d · Phiên + quyền một câu SQL');

  /** Cách đọc CŨ (6 câu) — làm chuẩn so sánh: kết quả mới phải y hệt, kể cả thứ tự grant / phân công. */
  const principalCu = (userId: number) => {
    const user = conn.prepare('SELECT * FROM users WHERE id = ?').get(userId) as any;
    const permsByRole = new Map<string, string[]>();
    for (const r of conn.prepare(`SELECT r.key AS role_key, p.key AS perm_key FROM role_permissions rp
         JOIN roles r ON r.id = rp.role_id JOIN permissions p ON p.id = rp.permission_id`).all() as any[]) {
      permsByRole.set(r.role_key, [...(permsByRole.get(r.role_key) ?? []), r.perm_key]);
    }
    const grants = (conn.prepare(`SELECT ur.id, ur.branch_id, r.key AS role_key, r.name_vi AS role_name, b.name AS branch_name
         FROM user_roles ur JOIN roles r ON r.id = ur.role_id LEFT JOIN branches b ON b.id = ur.branch_id
        WHERE ur.user_id = ? AND ur.status = 'active' ORDER BY ur.id`).all(userId) as any[]).map((g) => ({
      id: g.id, roleKey: g.role_key, roleName: g.role_name, branchId: g.branch_id, branchName: g.branch_name,
      permissions: [...(permsByRole.get(g.role_key) ?? [])].sort(),
    }));
    for (const r of conn.prepare(`SELECT up.branch_id, p.key AS perm_key, b.name AS branch_name FROM user_permissions up
         JOIN permissions p ON p.id = up.permission_id LEFT JOIN branches b ON b.id = up.branch_id WHERE up.user_id = ?`).all(userId) as any[]) {
      grants.push({ id: -1, roleKey: 'granted', roleName: 'Quyền cấp riêng', branchId: r.branch_id, branchName: r.branch_name, permissions: [r.perm_key] });
    }
    const assignments = (conn.prepare(`SELECT id, class_id, skill, is_core, effective_from, effective_to
         FROM teacher_assignments WHERE user_id = ? AND status = 'active'`).all(userId) as any[]).map((a) => ({
      id: a.id, classId: a.class_id, skill: a.skill, isCore: a.is_core === 1, effectiveFrom: a.effective_from, effectiveTo: a.effective_to,
    }));
    return {
      userId: user.id, code: user.code, fullName: user.full_name, title: user.title, ngonNgu: user.ngon_ngu ?? null, grants,
      roleKeys: [...new Set(grants.map((g) => g.roleKey).filter((k) => k !== 'granted'))], assignments,
    };
  };
  const phang = (p: Principal) => JSON.stringify({ ...p, grants: p.grants.map((g) => ({ ...g, permissions: [...g.permissions].sort() })) });
  const giong = (p: Principal | null, userId: number) => !!p && phang(p) === JSON.stringify(principalCu(userId));
  const dem = (fn: () => unknown) => ngu.chayTrongRequest('GET', () => { fn(); return ngu.demHienTai().n as number; });
  const moc = (phut: number) => new Date(Date.now() - phut * 60_000).toISOString();

  // Tài khoản thử: có quyền cấp riêng + phân công, để mọi khối của câu gộp đều có dữ liệu.
  const email = `td2d.thu${accounts.EMAIL_SUFFIX}`;
  accounts.createAccount(P.admin, { email, password: 'matkhau-td2d', fullName: 'Thử TD2-d', roles: [{ role: 'teacher', branches: ['MB'] }] });
  const id = (conn.prepare('SELECT id FROM users WHERE email = ?').get(email) as any).id as number;
  const nowIso = new Date().toISOString();
  const permId = (conn.prepare('SELECT id FROM permissions ORDER BY id LIMIT 1').get() as any).id as number;
  const mb = (conn.prepare("SELECT id FROM branches WHERE code = 'MB'").get() as any)?.id ?? null;
  conn.prepare('INSERT INTO user_permissions (user_id, permission_id, branch_id, created_at) VALUES (?,?,?,?)')
    .run(id, permId, null, nowIso);
  conn.prepare('INSERT INTO teacher_assignments (user_id, class_id, skill, is_core, effective_from, status, created_at) VALUES (?,?,?,?,?,?,?)')
    .run(id, t.classId('MB FT 101'), 'R', 0, '2026-09-01', 'active', nowIso);

  check('TD2-d-1 · phiên còn hạn: resolveSession chạy đúng 1 câu SQL; loadPrincipal 1 câu', () => {
    const ma = auth.createSession(id);
    const n = dem(() => auth.resolveSession(ma));
    assert(n === 1, `resolveSession: ${n} câu (phải 1)`);
    const n2 = dem(() => perms.loadPrincipal(id));
    assert(n2 === 1, `loadPrincipal: ${n2} câu (phải 1)`);
  });

  check('TD2-d-2 · principal mới trùng cách đọc cũ (grant, quyền theo vai, quyền cấp riêng, phân công, thứ tự) ở MỌI tài khoản', () => {
    const sai: string[] = [];
    for (const u of conn.prepare('SELECT id FROM users').all() as any[]) {
      if (!giong(perms.loadPrincipal(u.id), u.id)) sai.push(`loadPrincipal(${u.id})`);
    }
    const p = auth.resolveSession(auth.createSession(id));
    if (!giong(p, id)) sai.push(`resolveSession(${id})`);
    assert(p?.grants.some((g: any) => g.roleKey === 'granted') && p?.assignments.length === 1, 'tài khoản thử thiếu quyền cấp riêng / phân công');
    assert(!sai.length, `Lệch: ${sai.slice(0, 10).join(', ')}`);
  });

  check('TD2-d-3 · tài khoản không tồn tại: loadPrincipal báo 403 như cũ', () => {
    let st = 0;
    try { perms.loadPrincipal(99_999_999); } catch (e: any) { st = e.status; }
    assert(st === 403, `status ${st}`);
  });

  check('TD2-d-4 · phiên hết hạn (> 30 ngày không dùng) → null và xoá dòng phiên', () => {
    const ma = auth.createSession(id);
    conn.prepare('UPDATE demo_sessions SET last_seen_at = ? WHERE token = ?').run(moc((auth.PHIEN_HET_HAN_SAU_NGAY * 24 + 1) * 60), ma);
    assert(auth.resolveSession(ma) === null, 'phiên hết hạn vẫn dùng được');
    assert(!conn.prepare('SELECT 1 FROM demo_sessions WHERE token = ?').get(ma), 'phiên hết hạn không bị xoá');
  });

  check('TD2-d-5 · mốc dùng cũ > 10 phút → ghi lại (2 câu); mới hơn → không ghi (1 câu)', () => {
    const ma = auth.createSession(id);
    conn.prepare('UPDATE demo_sessions SET last_seen_at = ? WHERE token = ?').run(moc(11), ma);
    const n = dem(() => auth.resolveSession(ma));
    const lan = (conn.prepare('SELECT last_seen_at FROM demo_sessions WHERE token = ?').get(ma) as any).last_seen_at as string;
    assert(n === 2 && Date.now() - Date.parse(lan) < 60_000, `ghi lại mốc: ${n} câu, mốc ${lan}`);
    assert(dem(() => auth.resolveSession(ma)) === 1, 'lần sau không được ghi lại mốc');
  });

  check('TD2-d-6 · tài khoản khoá / chờ duyệt → null và xoá phiên; mở lại thì phiên MỚI dùng được', () => {
    for (const [cot, gt, cu] of [['status', 'locked', 'active'], ['approval_state', 'pending', 'approved']] as const) {
      const ma = auth.createSession(id);
      conn.prepare(`UPDATE users SET ${cot} = ? WHERE id = ?`).run(gt, id);
      assert(auth.resolveSession(ma) === null, `${cot}=${gt} vẫn vào được`);
      assert(!conn.prepare('SELECT 1 FROM demo_sessions WHERE token = ?').get(ma), `${cot}=${gt}: phiên không bị xoá`);
      conn.prepare(`UPDATE users SET ${cot} = ? WHERE id = ?`).run(cu, id);
      assert(auth.resolveSession(auth.createSession(id))?.userId === id, `${cot} mở lại: phiên mới không vào được`);
    }
  });

  check('TD2-d-7 · phiên trỏ tới tài khoản đã bị xoá → null', () => {
    const ma = `td2d-mo-coi-${Date.now()}`;
    conn.exec('PRAGMA foreign_keys = OFF');
    try {
      conn.prepare('INSERT INTO demo_sessions (token, user_id, created_at, last_seen_at) VALUES (?,?,?,?)').run(ma, 99_999_999, nowIso, nowIso);
    } finally { conn.exec('PRAGMA foreign_keys = ON'); }
    assert(auth.resolveSession(ma) === null, 'phiên của tài khoản không còn vẫn vào được');
    conn.prepare('DELETE FROM demo_sessions WHERE token = ?').run(ma);
  });

  check('TD2-d-8 · đổi vai / thu quyền cấp riêng / gỡ phân công: request SAU thấy ngay (không nhớ quyền giữa request)', () => {
    const ma = auth.createSession(id);
    const doc = () => ngu.chayTrongRequest('GET', () => auth.resolveSession(ma)) as Principal;
    assert(doc().roleKeys.includes('teacher'), 'trước: phải có vai teacher');
    conn.prepare("UPDATE user_roles SET status = 'inactive' WHERE user_id = ?").run(id);
    conn.prepare('DELETE FROM user_permissions WHERE user_id = ?').run(id);
    conn.prepare("UPDATE teacher_assignments SET status = 'inactive' WHERE user_id = ?").run(id);
    const sau = doc();
    assert(sau.grants.length === 0 && sau.roleKeys.length === 0 && sau.assignments.length === 0,
      `sau khi thu: còn ${JSON.stringify({ grants: sau.grants.map((g) => g.roleKey), a: sau.assignments.length })}`);
    assert(giong(sau, id), 'principal sau khi thu lệch cách đọc cũ');
    // Đổi sang vai khác ở chi nhánh khác (khác vai cũ) — request sau thấy vai mới, đúng phạm vi.
    const ql = (conn.prepare("SELECT id FROM roles WHERE key = 'manager'").get() as any)?.id;
    if (ql) {
      conn.prepare("INSERT INTO user_roles (user_id, role_id, branch_id, status, created_at) VALUES (?,?,?,'active',?)").run(id, ql, mb, nowIso);
      const moi = doc();
      assert(moi.roleKeys.join() === 'manager' && moi.grants[0].branchId === mb && giong(moi, id), `vai mới: ${moi.roleKeys.join()}`);
    }
  });

  check('TD2-d-9 · đổi email đăng nhập không đăng xuất, principal không đổi', () => {
    const ma = auth.createSession(id);
    const truoc = phang(auth.resolveSession(ma));
    accounts.adminUpdateAccount(P.admin, id, { email: `td2d.moi${accounts.EMAIL_SUFFIX}` });
    const sau = auth.resolveSession(ma);
    assert(sau && phang(sau) === truoc, 'đổi email làm mất phiên / đổi principal');
  });
}
