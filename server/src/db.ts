import Database from 'libsql';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/*
 * libsql gắn thêm `_metadata: { duration }` vào MỖI dòng `.get()` trả về (better-sqlite3 thì không). Khoá này lọt
 * ra JSON của API và làm hỏng mọi phép so dòng. Vá một lần ở đây thay vì sửa 686 chỗ gọi.
 */
{
  const proto = Object.getPrototypeOf(new Database(':memory:').prepare('SELECT 1')) as { get: (...a: unknown[]) => unknown };
  const getGoc = proto.get;
  proto.get = function (this: unknown, ...args: unknown[]) {
    const row = getGoc.apply(this, args);
    if (row && typeof row === 'object' && '_metadata' in row) delete (row as Record<string, unknown>)._metadata;
    return row;
  };
}
/*
 * CẢNH BÁO cho mọi mã sau này — với libsql:
 *   - KHÔNG truyền MỘT `Buffer` làm tham số duy nhất (`.run(buf)`): tiến trình Node chết hẳn (Rust panic). Luôn bọc:
 *     `.run(buf, x)` hoặc tham số có tên.
 *   - `pluck().get()` và `pragma(x, { simple: true })` trả đối tượng thay vì giá trị — hiện mã không dùng, đừng bắt đầu dùng.
 */

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Tìm thư mục gốc dự án bằng cách đi ngược lên tới nơi có package.json.
 * Không neo theo đường dẫn tương đối cố định vì mã có thể chạy từ server/src (lúc phát
 * triển) hoặc từ dist-server (sau khi biên dịch); cũng không neo theo thư mục đang đứng
 * vì người dùng có thể gõ lệnh từ chỗ khác.
 */
function findProjectRoot(start: string): string {
  let dir = start;
  for (let i = 0; i < 10; i++) {
    if (fs.existsSync(path.join(dir, 'package.json'))) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return process.cwd();
}

export const ROOT = findProjectRoot(__dirname);
export const DB_PATH = process.env.PISA_DB ?? path.join(ROOT, 'data', 'pisa-demo.sqlite');
export const SCHEMA_PATH = path.join(ROOT, 'server', 'src', 'schema.sql');

let instance: Database.Database | null = null;

export function db(): Database.Database {
  if (!instance) {
    fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
    instance = new Database(DB_PATH);
    instance.pragma('journal_mode = WAL');
    instance.pragma('foreign_keys = ON');
  }
  return instance;
}

export function closeDb() {
  if (instance) {
    try { instance.close(); } catch { /* đã đóng */ }
    instance = null;
  }
}

export function isInitialised(): boolean {
  if (!fs.existsSync(DB_PATH)) return false;
  const row = db()
    .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='students'")
    .get();
  return !!row;
}

/**
 * Xoá và tạo lại toàn bộ schema NGAY TRONG file hiện tại.
 *
 * Cố tình không xoá file: nếu người dùng chạy `npm run seed` trong lúc `npm run dev`
 * đang chạy, tiến trình API vẫn giữ kết nối tới file cũ và sẽ phục vụ dữ liệu cũ.
 * Dựng lại tại chỗ giúp API thấy ngay dữ liệu mới mà không cần khởi động lại.
 */
export function recreateSchema() {
  const conn = db();
  conn.pragma('foreign_keys = OFF');
  const tables = conn
    .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'")
    .all() as { name: string }[];
  const indexes = conn
    .prepare("SELECT name FROM sqlite_master WHERE type = 'index' AND name NOT LIKE 'sqlite_%'")
    .all() as { name: string }[];
  conn.transaction(() => {
    for (const i of indexes) conn.exec(`DROP INDEX IF EXISTS "${i.name}"`);
    for (const t of tables) conn.exec(`DROP TABLE IF EXISTS "${t.name}"`);
  })();
  conn.exec(fs.readFileSync(SCHEMA_PATH, 'utf8'));
  conn.pragma('foreign_keys = ON');
}

/*
 * GIAO DỊCH LỒNG. `better-sqlite3` tự biến giao dịch lồng thành SAVEPOINT; `libsql` thì báo lỗi
 * "cannot start a transaction within a transaction". Làm lại đúng hành vi cũ: vòng ngoài là giao dịch
 * thật, vòng trong là savepoint — lỗi ở vòng trong chỉ cuộn lại phần của nó rồi ném tiếp lên.
 */
let savepointDepth = 0;
/** Chạy fn trong một transaction; mọi mutation nhiều bảng phải đi qua đây. */
export function tx<T>(fn: () => T): T {
  const conn = db();
  if (!conn.inTransaction) return conn.transaction(fn)();
  const name = `sp_${++savepointDepth}`;
  conn.exec(`SAVEPOINT ${name}`);
  try {
    const out = fn();
    conn.exec(`RELEASE ${name}`);
    return out;
  } catch (e) {
    conn.exec(`ROLLBACK TO ${name}`);
    conn.exec(`RELEASE ${name}`);
    throw e;
  } finally {
    savepointDepth--;
  }
}
