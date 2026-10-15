/**
 * PHÉP KIỂM OV-13e — đăng ký có chọn vai (đặc tả OV-13 mục 3 dòng 6): người đăng ký chọn GV · QL · TVV · CX · Admin; máy chủ lưu
 * `users.requested_role` (danh sách trắng — system_admin / vai lạ → 400), chức danh theo vai, KHÔNG cấp vai nào trước khi duyệt;
 * duyệt mặc định = vai đề nghị, QT đổi được. Migrate prOv13e chỉ thêm cột, chạy lặp được. Mỗi ca cuộn lại (`thu`).
 */
export async function runPrOv13eTests(t: any) {
  const { check, assert, conn, P } = t;
  const accounts: any = await import('../platform/accounts.ts');
  const { migratePrOv13e } = await import('../migrate/prOv13e.ts');
  const { default: Database } = await import('libsql');
  console.log('\nPR-OV13e · đăng ký chọn vai · requested_role · duyệt điền sẵn');

  const thu = <T>(fn: () => T): T => {
    conn.exec('BEGIN IMMEDIATE');
    try { return fn(); } finally { conn.exec('ROLLBACK'); }
  };
  const maLoi = (fn: () => unknown): any => { try { fn(); } catch (e: any) { return e.status; } return 'không ném'; };
  let n = 0;
  const dk = (o: any) => accounts.register({
    email: `ov13e.${(n += 1)}${accounts.EMAIL_SUFFIX}`, password: 'matkhau123', fullName: `OV13e ${n}`, branches: ['MB'], ...o,
  }).userId as number;
  const user = (id: number) => conn.prepare('SELECT * FROM users WHERE id = ?').get(id) as any;
  const soVai = (id: number) => (conn.prepare("SELECT COUNT(*) n FROM user_roles WHERE user_id = ? AND status = 'active'").get(id) as any).n;

  check('OV13e-1 · đăng ký từng vai → requested_role + chức danh đúng, chưa có vai nào; CX không cần chi nhánh; kỹ năng chỉ khi GV', () => thu(() => {
    const ten: Record<string, string> = { teacher: 'Giáo viên', manager: 'Quản lý', consultant: 'Tư vấn viên', cx: 'CX', office_admin: 'Admin' };
    for (const role of Object.keys(ten)) {
      const id = dk({ role, skills: ['reading'] });
      const u = user(id);
      assert(u.requested_role === role && u.title === ten[role] && u.approval_state === 'pending', `${role}: ${u.requested_role} · ${u.title}`);
      assert(soVai(id) === 0, `${role}: chưa duyệt mà có ${soVai(id)} vai`);
      const kn = (conn.prepare('SELECT COUNT(*) n FROM user_skills WHERE user_id = ?').get(id) as any).n;
      assert(kn === (role === 'teacher' ? 1 : 0), `${role}: ${kn} kỹ năng`);
    }
    const cx = dk({ role: 'cx', branches: [] });
    assert(user(cx).requested_role === 'cx', 'CX không chi nhánh');
    assert(maLoi(() => dk({ role: 'manager', branches: [] })) === 400, 'QL thiếu chi nhánh → 400');
    assert(user(dk({})).requested_role === 'teacher', 'form cũ không gửi vai = Giáo viên');
  }));

  check('OV13e-2 · system_admin / vai lạ / vai đã bỏ / sai kiểu → 400, không tạo tài khoản', () => thu(() => {
    const truoc = (conn.prepare('SELECT COUNT(*) n FROM users').get() as any).n;
    for (const role of ['system_admin', 'branch_admin', 'hacker', ' teacher', 7, {}]) {
      assert(maLoi(() => dk({ role })) === 400, `vai ${JSON.stringify(role)} không bị chặn`);
    }
    assert((conn.prepare('SELECT COUNT(*) n FROM users').get() as any).n === truoc, 'đã tạo tài khoản');
  }));

  check('OV13e-3 · hàng đợi trả vai đề nghị; duyệt không gửi vai = vai đề nghị; QT đổi vai được', () => thu(() => {
    const a = dk({ role: 'consultant' });
    assert(accounts.pendingQueue(P.admin).find((u: any) => u.id === a)?.requestedRole === 'consultant', 'hàng đợi thiếu requestedRole');
    accounts.approve(P.admin, a, { branches: ['MB'] });
    const vai = (id: number) => (conn.prepare(
      "SELECT r.key FROM user_roles ur JOIN roles r ON r.id = ur.role_id WHERE ur.user_id = ? AND ur.status = 'active'").all(id) as any[]).map((r) => r.key);
    assert(vai(a).join() === 'consultant', `mặc định: ${vai(a)}`);
    const b = dk({ role: 'consultant' });
    accounts.approve(P.admin, b, { role: 'manager', branches: ['MB'] });
    assert(vai(b).join() === 'manager' && user(b).title === 'Quản lý', `đổi vai: ${vai(b)} · ${user(b).title}`);
    assert(user(a).title === 'Tư vấn viên', `giữ chức danh: ${user(a).title}`);
    const c = dk({ role: 'office_admin' });
    accounts.decline(P.admin, c, 'Thử');
    assert(accounts.listAccounts(P.admin).find((u: any) => u.id === c)?.requestedRole === 'office_admin', 'Duyệt lại thiếu requestedRole');
  }));

  check('OV13e-4 · migrate prOv13e: thêm cột một lần, chạy lại không đổi; DB demo đã có cột', () => {
    const m = new Database(':memory:');
    m.exec('CREATE TABLE users (id INTEGER PRIMARY KEY, title TEXT)');
    const a1: string[] = [], a2: string[] = [];
    migratePrOv13e(m, a1); migratePrOv13e(m, a2);
    const cot = (m.prepare('SELECT name FROM pragma_table_info(?)').all('users') as any[]).map((c) => c.name);
    assert(cot.includes('requested_role') && a1.length === 1 && a2.length === 0, `cột ${cot} · lần 1 ${a1.length} · lần 2 ${a2.length}`);
    m.close();
    const a3: string[] = [];
    migratePrOv13e(conn, a3);
    assert(a3.length === 0, 'DB demo (schema.sql) đã có cột');
  });
}
