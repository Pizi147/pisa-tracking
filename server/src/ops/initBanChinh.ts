/**
 * KHỞI TẠO BẢN CHÍNH (PR-Z2) — dựng trong một database RỖNG: các bảng, dữ liệu nền dùng chung với bộ demo (quyền, vai
 * trò, lộ trình, chương trình học — `seed/duLieuNen.ts`), chi nhánh thật, bộ đếm mã học viên, và MỘT tài khoản Quản trị
 * hệ thống. KHÔNG tạo dữ liệu demo, KHÔNG đặt ngày demo hay bất kỳ cấu hình demo nào.
 *
 * AN TOÀN DỮ LIỆU — ba luật, theo đúng thứ tự:
 *   1. Database đã có BẤT KỲ dòng nào, ở BẤT KỲ bảng nào → từ chối TRƯỚC khi ghi bất cứ gì. Không có đường nào ghi đè.
 *   2. Kiểm email, mật khẩu, danh sách chi nhánh → sai thì từ chối, vẫn chưa ghi gì.
 *   3. Mọi thứ ghi trong MỘT giao dịch → hỏng giữa chừng thì cuộn lại hết, kể cả các lệnh tạo bảng.
 *
 * Các hàm ở đây là hàm thuần: nhận `conn`, không đọc biến môi trường. Điểm chạy lệnh: `runInit.ts`, `themChiNhanh.ts`.
 */
import { DEFAULT_ADMIN_PASSWORD, checkEmail, checkPassword, hashPassword } from '../platform/accounts.ts';
import { napDuLieuNen } from '../seed/duLieuNen.ts';
import { KHONG_NOI_BO } from './saoLuu.ts';

export type ChiNhanh = { code: string; name: string };

/**
 * BẢNG ĐƯỢC CÓ DÒNG ngay sau `init-ban-chinh` (dữ liệu nền + chi nhánh + MỘT tài khoản + dấu `demo_config`). MỘT danh sách cho phép kiểm
 * (`banChinh.tests.ts`) và lệnh chỉ đọc `kiem-sau-init` (PR-DEPLOY Q5). Mọi bảng khác của database vừa init phải rỗng.
 */
export const BANG_NEN_INIT: readonly string[] = ['permissions', 'roles', 'role_permissions', 'routes', 'programmes', 'programme_skills',
  'programme_checkpoints', 'branches', 'reporting_units', 'users', 'user_roles', 'student_code_seq', 'demo_config'];

/** Mã của đơn vị báo cáo "Tutor part-time" (như `seed.ts`). `reporting_units.code` là UNIQUE nên chi nhánh không được dùng mã này. */
const MA_TUTOR = 'TUTOR';

/** Kiểm và chuẩn hoá: mã viết hoa, chỉ chữ A–Z và số, không trùng nhau, không phải TUTOR; tên không rỗng. */
function kiemChiNhanh(ds: ChiNhanh[]): ChiNhanh[] {
  if (!ds.length) throw new Error('Cần ít nhất một chi nhánh.');
  const daCo = new Set<string>();
  return ds.map((cn) => {
    const code = String(cn.code ?? '').trim().toUpperCase();
    const name = String(cn.name ?? '').trim();
    if (!/^[A-Z0-9]+$/.test(code)) {
      throw new Error(`Mã chi nhánh "${String(cn.code ?? '').trim()}" không hợp lệ — mã viết liền, không dấu, chỉ chữ và số (ví dụ MB).`);
    }
    if (code === MA_TUTOR) throw new Error(`Mã ${MA_TUTOR} đã dành cho đơn vị "Tutor part-time" — chọn mã khác.`);
    if (!name) throw new Error(`Chi nhánh ${code} thiếu tên.`);
    /* Dấu ^ và " là dấu vết thoát ký tự của npm/cmd trên Windows (đã gặp 22/09: "Uông Bí" thành "^Uông^ Bí^") — từ chối,
       không bao giờ lưu một tên hỏng. */
    if (/[\^"]/.test(name)) throw new Error(`Tên chi nhánh ${code} có dấu ^ hoặc " — tên bị hỏng khi truyền qua dòng lệnh, chưa thêm gì.`);
    if (daCo.has(code)) throw new Error(`Mã chi nhánh ${code} bị trùng.`);
    daCo.add(code);
    return { code, name };
  });
}

/** Đọc biến `CHI_NHANH` dạng `MB=Monbay;BC=Bãi Cháy` (dấu `;` thừa ở cuối được bỏ qua). */
export function docDanhSachChiNhanh(s: string): ChiNhanh[] {
  const phan = String(s ?? '').split(';').map((x) => x.trim()).filter(Boolean);
  if (!phan.length) {
    throw new Error('CHI_NHANH đang rỗng — mỗi chi nhánh viết MÃ=Tên, cách nhau bằng dấu ; (ví dụ MB=Monbay;BC=Bãi Cháy).');
  }
  return kiemChiNhanh(phan.map((p) => {
    const i = p.indexOf('=');
    if (i < 0) throw new Error(`"${p}" thiếu dấu = — mỗi chi nhánh viết MÃ=Tên, ví dụ MB=Monbay.`);
    return { code: p.slice(0, i), name: p.slice(i + 1) };
  }));
}

/**
 * Bảng đầu tiên tìm thấy có ít nhất một dòng (rỗng = database trống). Hỏi `users` trước: database đang dùng thì dừng ngay ở
 * câu hỏi đầu — qua mạng Turso mỗi câu hỏi là một lượt đi về. Chỉ ĐỌC. Lệnh khôi phục (`khoiPhuc.ts`) dùng đúng chốt này.
 */
export function bangCoDuLieu(conn: any): string | null {
  const bang = (conn.prepare(`SELECT name FROM sqlite_master WHERE type = 'table' AND ${KHONG_NOI_BO}`).all() as { name: string }[])
    .map((b) => b.name)
    .sort((a, b) => Number(b === 'users') - Number(a === 'users'));
  for (const b of bang) {
    if (conn.prepare(`SELECT 1 FROM "${b.replace(/"/g, '""')}" LIMIT 1`).get()) return b;
  }
  return null;
}

export function initBanChinh(conn: any, o: {
  adminEmail: string; adminPassword: string; chiNhanh: ChiNhanh[]; now: string; schemaSql: string;
}): { userId: number; branchIds: number[] } {
  /* 1. Rỗng chưa — TRƯỚC mọi thứ, kể cả trước khi kiểm email/mật khẩu. */
  const bang = bangCoDuLieu(conn);
  if (bang) throw new Error(`Database đã có dữ liệu (bảng ${bang}) — init-ban-chinh chỉ chạy trên database rỗng. Không làm gì cả.`);

  /* 2. Dữ liệu vào — dùng đúng luật email/mật khẩu của accounts.ts. */
  const email = checkEmail(o.adminEmail);
  const matKhau = checkPassword(o.adminPassword);
  if (matKhau === DEFAULT_ADMIN_PASSWORD) {
    throw new Error('Không dùng mật khẩu mặc định của bản demo cho bản chính — ai đã xem bản demo đều biết nó. Chọn mật khẩu mới.');
  }
  const chiNhanh = kiemChiNhanh(o.chiNhanh);
  const chuaCoBang = !conn.prepare(`SELECT 1 FROM sqlite_master WHERE type = 'table' AND ${KHONG_NOI_BO}`).get();

  /* 3. Một giao dịch. Cột và giá trị giống hệt khối "tổ chức" của seed.ts. */
  return conn.transaction(() => {
    if (chuaCoBang) conn.exec(o.schemaSql);
    napDuLieuNen(conn, o.now);

    let seq = 0;
    const branchIds = chiNhanh.map((cn) => {
      const id = Number(conn.prepare('INSERT INTO branches (code, name, status, created_at) VALUES (?,?,?,?)')
        .run(cn.code, cn.name, 'active', o.now).lastInsertRowid);
      conn.prepare('INSERT INTO reporting_units (code, name, branch_id, kind, seq, status) VALUES (?,?,?,?,?,?)')
        .run(cn.code, cn.name, id, 'branch', seq++, 'active');
      return id;
    });
    conn.prepare('INSERT INTO reporting_units (code, name, branch_id, kind, seq, status) VALUES (?,?,?,?,?,?)')
      .run(MA_TUTOR, 'Tutor part-time', null, 'department', seq++, 'active');

    /* Bộ đếm mã học viên: thiếu dòng này thì `classes/intake.ts` cấp cùng một mã cho mọi học viên (mã là UNIQUE). */
    conn.prepare('INSERT INTO student_code_seq (id, next_value) VALUES (1, 1)').run();

    const { hash, salt } = hashPassword(matKhau);
    const userId = Number(conn
      .prepare(
        `INSERT INTO users (code, full_name, email, title, password_hash, password_salt, approval_state, status, created_at)
         VALUES (?,?,?,?,?,?, 'approved', 'active', ?)`,
      )
      .run('NV001', 'Quản trị hệ thống', email, 'Quản trị hệ thống', hash, salt, o.now).lastInsertRowid);
    const vai = conn.prepare("SELECT id FROM roles WHERE key = 'system_admin'").get() as { id: number } | undefined;
    if (!vai) throw new Error('Dữ liệu nền thiếu vai trò system_admin.');
    conn.prepare('INSERT INTO user_roles (user_id, role_id, branch_id, status, created_at) VALUES (?,?,?,?,?)')
      .run(userId, vai.id, null, 'active', o.now);

    return { userId, branchIds };
  })();
}

/** Thêm MỘT chi nhánh (hệ thống chưa có màn tạo chi nhánh). Mã đã có → từ chối, không thêm, không sửa gì. */
export function themChiNhanh(conn: any, cn: ChiNhanh, now: string): number {
  const [c] = kiemChiNhanh([cn]);
  const coBang = (ten: string) => !!conn.prepare("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = ?").get(ten);
  if (!coBang('branches') || !coBang('reporting_units')) {
    throw new Error('Database chưa được khởi tạo (chưa có bảng chi nhánh) — chạy npm run init-ban-chinh trước.');
  }
  if (conn.prepare('SELECT 1 FROM branches WHERE code = ?').get(c.code) || conn.prepare('SELECT 1 FROM reporting_units WHERE code = ?').get(c.code)) {
    throw new Error(`Chi nhánh mã ${c.code} đã có — không thêm, không sửa gì.`);
  }
  return conn.transaction(() => {
    const id = Number(conn.prepare('INSERT INTO branches (code, name, status, created_at) VALUES (?,?,?,?)')
      .run(c.code, c.name, 'active', now).lastInsertRowid);
    const seq = (conn.prepare('SELECT COALESCE(MAX(seq), -1) + 1 AS s FROM reporting_units').get() as { s: number }).s;
    conn.prepare('INSERT INTO reporting_units (code, name, branch_id, kind, seq, status) VALUES (?,?,?,?,?,?)')
      .run(c.code, c.name, id, 'branch', seq, 'active');
    return id;
  })();
}
