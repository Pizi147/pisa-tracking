import crypto from 'node:crypto';
import { db, tx } from '../db.ts';
import { ENTRY_SKILLS, PERMISSIONS, REGULAR_SKILLS } from '../../../shared/domain/index.ts';
import { badRequest, forbidden, notFound, nowIso, padCode } from '../util.ts';
import { can, require_, type Principal } from '../permissions.ts';
import { writeAudit } from './audit.ts';

/**
 * TÀI KHOẢN VÀ ĐĂNG NHẬP — mục 7.1 đến 7.3.
 *
 * Owner chọn "phương án đăng nhập thật" (Q7): email + mật khẩu, mật khẩu lưu dạng băm. Bản
 * demo KHÔNG gửi email thật và KHÔNG có luồng quên mật khẩu — quên thì Quản trị hệ thống đặt
 * lại hộ. Làm luồng quên mật khẩu mà không có email thật thì chỉ là một cái nút không dẫn
 * tới đâu, và người thử demo sẽ tưởng nó chạy.
 */

/** Tài khoản Quản trị hệ thống mặc định, owner chỉ định đích danh. */
export const DEFAULT_ADMIN_EMAIL = 'dovutuanphong95.pisa@gmail.com';
/**
 * Mật khẩu ban đầu — CỐ TÌNH hiện rõ trong README và trên màn đăng nhập demo.
 *
 * Giấu nó đi trong một bản demo nội bộ chỉ tạo ra một câu hỏi phải nhắn tin mới trả lời
 * được. Đây không phải hệ thống thật, và owner đổi mật khẩu ngay sau lần đăng nhập đầu.
 */
export const DEFAULT_ADMIN_PASSWORD = 'pisa2026';

/**
 * ĐUÔI EMAIL BẮT BUỘC (mục 7.1), áp cho MỌI vai chứ không riêng giáo viên tự đăng ký.
 *
 * Một địa chỉ hợp lệ trông như `dung.pisa@gmail.com`: phần trước dấu chấm là tên, rồi `.pisa`
 * rồi `@gmail.com`. Kiểm ở cả máy chủ chứ không chỉ ở ô nhập: ô nhập là gợi ý cho người gõ,
 * máy chủ mới là chỗ luật có hiệu lực.
 */
export const EMAIL_SUFFIX = '.pisa@gmail.com';

export function normalizeEmail(raw: string): string {
  return String(raw ?? '').trim().toLowerCase();
}

export function checkEmail(raw: string): string {
  const email = normalizeEmail(raw);
  if (!email) throw badRequest('Nhập email.');
  if (!email.endsWith(EMAIL_SUFFIX)) {
    throw badRequest(`Email của trung tâm phải có đuôi "${EMAIL_SUFFIX}", ví dụ dung${EMAIL_SUFFIX}.`);
  }
  const local = email.slice(0, -EMAIL_SUFFIX.length);
  if (!local || !/^[a-z0-9._-]+$/.test(local)) {
    throw badRequest(`Phần tên trước "${EMAIL_SUFFIX}" chỉ dùng chữ thường, số, dấu chấm, gạch ngang.`);
  }
  return email;
}

/* ------------------------------------------------------------------ mật khẩu */

/**
 * Băm scrypt, muối riêng từng người.
 *
 * Không dùng một hàm băm nhanh (sha256) dù bản demo không có dữ liệu thật: cách lưu mật khẩu
 * là thứ người ta sao chép sang bản thật mà không đọc lại, nên nó phải đúng ngay từ đây.
 */
export function hashPassword(password: string, salt?: string): { hash: string; salt: string } {
  const s = salt ?? crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, s, 64).toString('hex');
  return { hash, salt: s };
}

export function checkPassword(raw: string): string {
  const pw = String(raw ?? '');
  if (pw.length < 6) throw badRequest('Mật khẩu cần ít nhất 6 ký tự.');
  return pw;
}

function verifyPassword(password: string, hash: string | null, salt: string | null): boolean {
  if (!hash || !salt) return false;
  const got = Buffer.from(hashPassword(password, salt).hash, 'hex');
  const want = Buffer.from(hash, 'hex');
  return got.length === want.length && crypto.timingSafeEqual(got, want);
}

/* ------------------------------------------------------------------ đăng nhập */

export type LoginResult = { userId: number; fullName: string };

/**
 * Đăng nhập. Sai email hay sai mật khẩu đều trả về CÙNG một câu.
 *
 * Nói "email này không tồn tại" là nói cho người ngoài biết địa chỉ nào có thật trong hệ
 * thống — một nửa công việc của người đang dò. Câu trả lời chung không giúp họ thu hẹp gì.
 *
 * Tài khoản CHỜ DUYỆT thì khác: người đó biết rõ mình vừa đăng ký, nên nói thẳng trạng thái
 * là giúp họ chứ không lộ gì thêm.
 */
export function login(email: string, password: string): LoginResult {
  const conn = db();
  const e = normalizeEmail(email);
  const user = conn.prepare('SELECT * FROM users WHERE email = ?').get(e) as any;
  const ok = user && verifyPassword(String(password ?? ''), user.password_hash, user.password_salt);
  if (!ok) throw badRequest('Email hoặc mật khẩu không đúng.');
  if (user.approval_state === 'pending') {
    throw forbidden('Tài khoản đang chờ Quản trị hệ thống duyệt. Bạn sẽ vào được ngay sau khi được duyệt.');
  }
  if (user.approval_state === 'declined') {
    throw forbidden(`Đăng ký không được duyệt${user.decline_reason ? `: ${user.decline_reason}` : '.'}`);
  }
  if (user.status !== 'active') throw forbidden('Tài khoản đã bị khoá.');
  return { userId: user.id, fullName: user.full_name };
}

/* ------------------------------------------------------------------ tự đăng ký */

function nextUserCode(conn: any): string {
  const row = conn.prepare('SELECT COUNT(*) AS n FROM users').get() as any;
  for (let i = row.n + 1; ; i += 1) {
    const code = padCode('NV', i, 3);
    if (!conn.prepare('SELECT 1 FROM users WHERE code = ?').get(code)) return code;
  }
}

/**
 * GIÁO VIÊN TỰ ĐĂNG KÝ (mục 7.1).
 *
 * Người đăng ký khai các chi nhánh mình hoạt động, rồi vào hàng đợi chờ duyệt. Hệ thống KHÔNG
 * cấp vai trò nào cho tới khi được duyệt — chi nhánh họ khai chỉ là ĐỀ NGHỊ, và người duyệt
 * sửa được trước khi bấm duyệt.
 */
export function register(input: {
  email: string; password: string; fullName: string; phone?: string | null;
  branches?: string[]; note?: string | null; skills?: string[];
}): { userId: number } {
  const conn = db();
  const email = checkEmail(input.email);
  const password = checkPassword(input.password);
  const fullName = String(input.fullName ?? '').trim();
  if (!fullName) throw badRequest('Nhập họ tên.');

  if (conn.prepare('SELECT 1 FROM users WHERE email = ?').get(email)) {
    throw badRequest('Email này đã có tài khoản. Đăng nhập, hoặc nhờ Quản trị hệ thống đặt lại mật khẩu.');
  }
  const codes = (input.branches ?? []).map((c) => String(c).trim().toUpperCase()).filter(Boolean);
  const known = new Set((conn.prepare('SELECT code FROM branches').all() as any[]).map((b) => b.code));
  for (const c of codes) if (!known.has(c)) throw badRequest(`Không có chi nhánh mã "${c}".`);
  if (!codes.length) throw badRequest('Chọn ít nhất một chi nhánh bạn đang hoạt động.');

  return tx(() => {
    const { hash, salt } = hashPassword(password);
    const info = conn
      .prepare(
        `INSERT INTO users (code, full_name, email, title, phone, password_hash, password_salt,
                            approval_state, requested_branches, requested_note, status, created_at)
         VALUES (?,?,?,?,?,?,?, 'pending', ?,?, 'active', ?)`,
      )
      .run(nextUserCode(conn), fullName, email, 'Giáo viên', input.phone ?? null, hash, salt,
           JSON.stringify(codes), input.note ?? null, nowIso());
    const userId = Number(info.lastInsertRowid);
    setSkills(conn, userId, input.skills ?? []);
    return { userId };
  });
}

const ALL_SKILLS = [...new Set([...ENTRY_SKILLS, ...REGULAR_SKILLS])] as string[];

function setSkills(conn: any, userId: number, skills: string[]) {
  const wanted = [...new Set(skills.map((s) => String(s)))].filter((s) => ALL_SKILLS.includes(s));
  conn.prepare('DELETE FROM user_skills WHERE user_id = ?').run(userId);
  for (const s of wanted) {
    conn.prepare('INSERT INTO user_skills (user_id, skill) VALUES (?,?)').run(userId, s);
  }
}

/** Hàng đợi chờ duyệt. Chỉ Quản trị hệ thống mở được. */
export function pendingQueue(p: Principal) {
  require_(p, PERMISSIONS.ADMIN_CONFIG, { anyScope: true }, 'Chỉ Quản trị hệ thống xem được hàng đợi duyệt.');
  const conn = db();
  return (conn
    .prepare(
      `SELECT id, code, full_name, email, phone, requested_branches, requested_note, created_at
         FROM users WHERE approval_state = 'pending' ORDER BY created_at`,
    )
    .all() as any[]).map((u) => ({
      id: u.id, code: u.code, fullName: u.full_name, email: u.email, phone: u.phone,
      branches: JSON.parse(u.requested_branches ?? '[]') as string[],
      note: u.requested_note, createdAt: u.created_at,
      skills: (conn.prepare('SELECT skill FROM user_skills WHERE user_id = ?').all(u.id) as any[]).map((r) => r.skill),
    }));
}

/**
 * DUYỆT một đăng ký. Người duyệt sửa được danh sách chi nhánh trước khi bấm duyệt (mục 7.1)
 * — đó là cả lý do có bước duyệt: người đăng ký khai theo ý mình, trung tâm mới là nơi quyết.
 */
export function approve(p: Principal, userId: number, o: {
  role?: string; branches?: string[];
}) {
  require_(p, PERMISSIONS.ADMIN_CONFIG, { anyScope: true }, 'Chỉ Quản trị hệ thống duyệt được tài khoản.');
  const conn = db();
  const user = conn.prepare("SELECT * FROM users WHERE id = ? AND approval_state = 'pending'").get(userId) as any;
  if (!user) throw notFound('Không tìm thấy đăng ký nào đang chờ duyệt.');
  const role = o.role ?? 'teacher';
  const codes = (o.branches ?? JSON.parse(user.requested_branches ?? '[]')).map((c: string) => String(c).toUpperCase());
  if (!codes.length) throw badRequest('Chọn ít nhất một chi nhánh cho tài khoản này.');

  return tx(() => {
    grantRole(conn, userId, role, codes);
    conn
      .prepare(
        `UPDATE users SET approval_state = 'approved', approved_by = ?, approved_at = ?,
                          requested_branches = ? WHERE id = ?`,
      )
      .run(p.userId, nowIso(), JSON.stringify(codes), userId);
    writeAudit({
      actorUserId: p.userId, action: 'user_approved', entityType: 'users', entityId: userId,
      entityLabel: user.full_name, after: { note: `Vai ${role} · ${codes.join(', ')}` },
    });
    return { ok: true };
  });
}

export function decline(p: Principal, userId: number, reason: string) {
  require_(p, PERMISSIONS.ADMIN_CONFIG, { anyScope: true }, 'Chỉ Quản trị hệ thống từ chối được đăng ký.');
  const r = String(reason ?? '').trim();
  if (!r) throw badRequest('Ghi lý do không duyệt — người đăng ký cần biết vì sao.');
  const conn = db();
  const user = conn.prepare("SELECT * FROM users WHERE id = ? AND approval_state = 'pending'").get(userId) as any;
  if (!user) throw notFound('Không tìm thấy đăng ký nào đang chờ duyệt.');
  conn.prepare("UPDATE users SET approval_state = 'declined', decline_reason = ?, approved_by = ?, approved_at = ? WHERE id = ?")
    .run(r, p.userId, nowIso(), userId);
  writeAudit({
    actorUserId: p.userId, action: 'user_declined', entityType: 'users', entityId: userId,
    entityLabel: user.full_name, after: { note: r },
  });
  return { ok: true };
}

/* ------------------------------------------------------------------ tạo và cấp vai */

function grantRole(conn: any, userId: number, roleKey: string, branchCodes: string[]) {
  const role = conn.prepare('SELECT id FROM roles WHERE key = ?').get(roleKey) as any;
  if (!role) throw badRequest(`Không có vai trò "${roleKey}".`);
  /*
   * Vai TOÀN HỆ THỐNG mang `branch_id` để trống, đúng quy ước của `user_roles`. Quản trị hệ
   * thống là vai duy nhất như vậy: gắn nó vào một chi nhánh thì nó không còn là toàn quyền.
   */
  if (roleKey === 'system_admin') {
    if (!conn.prepare("SELECT 1 FROM user_roles WHERE user_id=? AND role_id=? AND branch_id IS NULL AND status='active'")
      .get(userId, role.id)) {
      conn.prepare("INSERT INTO user_roles (user_id, role_id, branch_id, status, created_at) VALUES (?,?,NULL,'active',?)")
        .run(userId, role.id, nowIso());
    }
    return;
  }
  for (const code of branchCodes) {
    const b = conn.prepare('SELECT id FROM branches WHERE code = ?').get(code) as any;
    if (!b) throw badRequest(`Không có chi nhánh mã "${code}".`);
    const had = conn
      .prepare("SELECT 1 FROM user_roles WHERE user_id=? AND role_id=? AND branch_id=? AND status='active'")
      .get(userId, role.id, b.id);
    if (!had) {
      conn.prepare("INSERT INTO user_roles (user_id, role_id, branch_id, status, created_at) VALUES (?,?,?,'active',?)")
        .run(userId, role.id, b.id, nowIso());
    }
  }
}

/**
 * TẠO TÀI KHOẢN (mục 7.1). Một người có thể mang NHIỀU VAI ở NHIỀU CHI NHÁNH:
 *
 *   Quản lý   nhiều chi nhánh, ĐƯỢC giảng dạy
 *   Admin CN  nhiều chi nhánh, KHÔNG giảng dạy
 *   GV        nhiều chi nhánh, có thể kiêm vai Quản lý
 *
 * Nên tham số là một DANH SÁCH vai kèm chi nhánh, không phải một ô chọn vai duy nhất.
 */
export function createAccount(p: Principal, input: {
  email: string; password: string; fullName: string; title?: string | null; phone?: string | null;
  roles: { role: string; branches: string[] }[];
  skills?: string[];
}) {
  require_(p, PERMISSIONS.ADMIN_CONFIG, { anyScope: true }, 'Chỉ Quản trị hệ thống tạo được tài khoản.');
  const conn = db();
  const email = checkEmail(input.email);
  const password = checkPassword(input.password);
  const fullName = String(input.fullName ?? '').trim();
  if (!fullName) throw badRequest('Nhập họ tên.');
  if (conn.prepare('SELECT 1 FROM users WHERE email = ?').get(email)) {
    throw badRequest('Email này đã có tài khoản.');
  }
  if (!input.roles?.length) throw badRequest('Cấp ít nhất một vai trò.');

  return tx(() => {
    const { hash, salt } = hashPassword(password);
    const info = conn
      .prepare(
        `INSERT INTO users (code, full_name, email, title, phone, password_hash, password_salt,
                            approval_state, status, created_at)
         VALUES (?,?,?,?,?,?,?, 'approved', 'active', ?)`,
      )
      .run(nextUserCode(conn), fullName, email, input.title ?? null, input.phone ?? null, hash, salt, nowIso());
    const userId = Number(info.lastInsertRowid);
    for (const r of input.roles) grantRole(conn, userId, r.role, r.branches ?? []);
    setSkills(conn, userId, input.skills ?? []);
    writeAudit({
      actorUserId: p.userId, action: 'user_created', entityType: 'users', entityId: userId, entityLabel: fullName,
      after: { note: input.roles.map((r) => `${r.role}:${(r.branches ?? []).join('/') || 'toàn hệ thống'}`).join(' · ') },
    });
    return { userId };
  });
}

/** Cấp thêm hoặc thu hồi vai của một tài khoản đã có. */
export function setRoles(p: Principal, userId: number, roles: { role: string; branches: string[] }[]) {
  require_(p, PERMISSIONS.ADMIN_CONFIG, { anyScope: true }, 'Chỉ Quản trị hệ thống đổi được vai trò.');
  const conn = db();
  const user = conn.prepare('SELECT * FROM users WHERE id = ?').get(userId) as any;
  if (!user) throw notFound('Không tìm thấy tài khoản.');
  if (user.status === 'deleted') throw badRequest('Tài khoản đã xoá.');   // PR-XOA: xoá mềm là khoá hẳn
  /*
   * KHÔNG XOÁ DÒNG CŨ, chỉ đóng lại. Điểm đã nhập và mọi bản ghi khác đều trỏ tới `user_id`;
   * xoá grant là xoá căn cứ để đọc lại "lúc đó ai được phép làm việc này".
   */
  return tx(() => {
    conn.prepare("UPDATE user_roles SET status = 'ended' WHERE user_id = ? AND status = 'active'").run(userId);
    for (const r of roles) grantRole(conn, userId, r.role, r.branches ?? []);
    writeAudit({
      actorUserId: p.userId, action: 'user_roles_set', entityType: 'users', entityId: userId,
      entityLabel: user.full_name,
      after: { note: roles.map((r) => `${r.role}:${(r.branches ?? []).join('/') || 'toàn hệ thống'}`).join(' · ') || 'gỡ hết vai' },
    });
    return { ok: true };
  });
}

/** Đặt lại mật khẩu hộ — thay cho luồng "quên mật khẩu" mà bản demo không có. */
export function resetPassword(p: Principal, userId: number, password: string) {
  require_(p, PERMISSIONS.ADMIN_CONFIG, { anyScope: true }, 'Chỉ Quản trị hệ thống đặt lại được mật khẩu.');
  const conn = db();
  const user = conn.prepare('SELECT * FROM users WHERE id = ?').get(userId) as any;
  if (!user) throw notFound('Không tìm thấy tài khoản.');
  if (user.status === 'deleted') throw badRequest('Tài khoản đã xoá.');   // PR-XOA: xoá mềm là khoá hẳn
  const { hash, salt } = hashPassword(checkPassword(password));
  conn.prepare('UPDATE users SET password_hash = ?, password_salt = ? WHERE id = ?').run(hash, salt, userId);
  writeAudit({
    actorUserId: p.userId, action: 'password_reset', entityType: 'users', entityId: userId, entityLabel: user.full_name,
  });
  return { ok: true };
}

/* ------------------------------------------------------------------ hồ sơ cá nhân */

export function myProfile(p: Principal) {
  const conn = db();
  const u = conn.prepare('SELECT * FROM users WHERE id = ?').get(p.userId) as any;
  return {
    id: u.id, code: u.code, fullName: u.full_name, email: u.email, phone: u.phone,
    title: u.title,
    skills: (conn.prepare('SELECT skill FROM user_skills WHERE user_id = ?').all(u.id) as any[]).map((r) => r.skill),
    extraEmails: (conn.prepare('SELECT email FROM user_emails WHERE user_id = ? ORDER BY id').all(u.id) as any[])
      .map((r) => r.email),
    /** Bộ kỹ năng chọn được — gồm cả kỹ năng riêng của lớp Normal. */
    allSkills: ALL_SKILLS,
    canSetPassword: !!u.password_hash,
  };
}

/**
 * CẬP NHẬT HỒ SƠ CỦA CHÍNH MÌNH (mục 7.2): họ tên, kỹ năng phụ trách được, điện thoại, email(s).
 *
 * KHÔNG cho tự đổi EMAIL ĐĂNG NHẬP ở đây. Đổi email đăng nhập là đổi danh tính tài khoản, và
 * nó cần người khác xác nhận — đó là việc của Quản trị hệ thống. Email phụ thì thoải mái.
 */
export function updateProfile(p: Principal, input: {
  fullName?: string; phone?: string | null; skills?: string[]; extraEmails?: string[];
  currentPassword?: string; newPassword?: string;
}) {
  const conn = db();
  const u = conn.prepare('SELECT * FROM users WHERE id = ?').get(p.userId) as any;
  return tx(() => {
    if (input.fullName !== undefined) {
      const name = String(input.fullName).trim();
      if (!name) throw badRequest('Họ tên không được để trống.');
      conn.prepare('UPDATE users SET full_name = ? WHERE id = ?').run(name, p.userId);
    }
    if (input.phone !== undefined) {
      conn.prepare('UPDATE users SET phone = ? WHERE id = ?').run(input.phone || null, p.userId);
    }
    if (input.skills !== undefined) setSkills(conn, p.userId, input.skills);
    if (input.extraEmails !== undefined) {
      /* Email phụ KHÔNG bắt đuôi `.pisa@gmail.com`: đó là email cá nhân để liên lạc, không phải để đăng nhập. */
      const list = [...new Set(input.extraEmails.map(normalizeEmail).filter(Boolean))]
        .filter((e) => e !== u.email);
      for (const e of list) {
        if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e)) throw badRequest(`"${e}" không giống một địa chỉ email.`);
      }
      conn.prepare('DELETE FROM user_emails WHERE user_id = ?').run(p.userId);
      for (const e of list) {
        conn.prepare('INSERT INTO user_emails (user_id, email, created_at) VALUES (?,?,?)')
          .run(p.userId, e, nowIso());
      }
    }
    if (input.newPassword) {
      /* Đổi mật khẩu phải nhập mật khẩu cũ — chặn người mượn máy đang mở sẵn của người khác. */
      if (!verifyPassword(String(input.currentPassword ?? ''), u.password_hash, u.password_salt)) {
        throw badRequest('Mật khẩu hiện tại không đúng.');
      }
      const { hash, salt } = hashPassword(checkPassword(input.newPassword));
      conn.prepare('UPDATE users SET password_hash = ?, password_salt = ? WHERE id = ?').run(hash, salt, p.userId);
    }
    return myProfile(p);
  });
}

/* ------------------------------------------------------------------ quyền cấp riêng */

/**
 * CẤP QUYỀN XEM CHO MỘT CÁ NHÂN (mục 7.3).
 *
 * Ví dụ owner đưa ra: cấp cho một Quản lý CN Monbay quyền quan sát toàn hệ thống. Sửa vai
 * "Quản lý" là sửa cho tất cả Quản lý, nên phải có đường cấp riêng cho một người.
 */
export function setUserPermissions(p: Principal, userId: number, items: {
  permission: string; branchCode?: string | null; note?: string | null;
}[]) {
  require_(p, PERMISSIONS.ADMIN_CONFIG, { anyScope: true }, 'Chỉ Quản trị hệ thống cấp được quyền riêng.');
  const conn = db();
  const user = conn.prepare('SELECT * FROM users WHERE id = ?').get(userId) as any;
  if (!user) throw notFound('Không tìm thấy tài khoản.');
  if (user.status === 'deleted') throw badRequest('Tài khoản đã xoá.');   // PR-XOA: xoá mềm là khoá hẳn
  return tx(() => {
    conn.prepare('DELETE FROM user_permissions WHERE user_id = ?').run(userId);
    for (const it of items ?? []) {
      const perm = conn.prepare('SELECT id FROM permissions WHERE key = ?').get(it.permission) as any;
      if (!perm) throw badRequest(`Không có quyền "${it.permission}".`);
      let branchId: number | null = null;
      if (it.branchCode) {
        const b = conn.prepare('SELECT id FROM branches WHERE code = ?').get(String(it.branchCode).toUpperCase()) as any;
        if (!b) throw badRequest(`Không có chi nhánh mã "${it.branchCode}".`);
        branchId = b.id;
      }
      conn
        .prepare(
          `INSERT INTO user_permissions (user_id, permission_id, branch_id, note, granted_by, created_at)
           VALUES (?,?,?,?,?,?) ON CONFLICT DO NOTHING`,
        )
        .run(userId, perm.id, branchId, it.note ?? null, p.userId, nowIso());
    }
    writeAudit({
      actorUserId: p.userId, action: 'user_permissions_set', entityType: 'users', entityId: userId,
      entityLabel: user.full_name,
      after: {
        note: (items ?? []).map((i) => `${i.permission}${i.branchCode ? `@${i.branchCode}` : ' (toàn hệ thống)'}`).join(' · ')
          || 'gỡ hết quyền riêng',
      },
    });
    return { ok: true };
  });
}

/** Danh sách tài khoản kèm vai, phạm vi và quyền cấp riêng — dữ liệu cho màn quản trị. */
export function listAccounts(p: Principal) {
  require_(p, PERMISSIONS.ADMIN_CONFIG, { anyScope: true }, 'Chỉ Quản trị hệ thống xem được danh sách tài khoản.');
  const conn = db();
  const users = conn
    .prepare("SELECT * FROM users WHERE approval_state != 'pending' ORDER BY full_name COLLATE NOCASE")
    .all() as any[];
  return users.map((u) => ({
    id: u.id, code: u.code, fullName: u.full_name, email: u.email, phone: u.phone,
    title: u.title, status: u.status, approvalState: u.approval_state,
    /** PR-XOA: tài khoản xoá mềm (`status = 'deleted'`) — màn quản trị để ở nút lọc "Đã xoá". */
    deletedAt: u.deleted_at ?? null,
    hasPassword: !!u.password_hash,
    roles: (conn
      .prepare(
        `SELECT r.key AS role, r.name_vi AS roleName, b.code AS branchCode, b.name AS branchName
           FROM user_roles ur JOIN roles r ON r.id = ur.role_id
           LEFT JOIN branches b ON b.id = ur.branch_id
          WHERE ur.user_id = ? AND ur.status = 'active' ORDER BY r.id, b.id`,
      )
      .all(u.id) as any[]),
    skills: (conn.prepare('SELECT skill FROM user_skills WHERE user_id = ?').all(u.id) as any[]).map((r) => r.skill),
    extra: (conn
      .prepare(
        `SELECT p.key AS permission, p.name_vi AS name, b.code AS branchCode
           FROM user_permissions up JOIN permissions p ON p.id = up.permission_id
           LEFT JOIN branches b ON b.id = up.branch_id
          WHERE up.user_id = ? ORDER BY p.id`,
      )
      .all(u.id) as any[]),
  }));
}

/** Người đang xem có phải Quản trị hệ thống không — dùng để bật/tắt màn quản trị. */
export function isSystemAdmin(p: Principal): boolean {
  return can(p, PERMISSIONS.ADMIN_CONFIG, { anyScope: true });
}
