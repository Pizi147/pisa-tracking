import Database from 'libsql';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { cauHinhDb, choPhepSeedTurso, laBanChinh } from './moiTruong.ts';

/*
 * libsql gắn thêm `_metadata: { duration }` vào MỖI dòng `.get()` trả về (better-sqlite3 thì không). Khoá này lọt
 * ra JSON của API và làm hỏng mọi phép so dòng. Vá một lần ở đây thay vì sửa 686 chỗ gọi.
 */
{
  const tam = new Database(':memory:');
  const proto = Object.getPrototypeOf(tam.prepare('SELECT 1')) as Record<'get' | 'all' | 'run' | 'iterate', (...a: unknown[]) => unknown>;
  tam.close();
  /*
   * Cùng chỗ vá: libsql hiểu ĐÚNG MỘT tham số `null` (`.get(null)`) là "đối tượng tham số có tên" và ném
   * "failed to downcast any to object"; better-sqlite3 thì gắn NULL. Mã có hàng trăm chỗ gọi một tham số, chỗ nào giá trị
   * lỡ là null sẽ thành lỗi 500 — đưa về đúng hành vi cũ bằng cách bọc thành mảng tham số `[null]`.
   */
  const motNull = (args: unknown[]) => (args.length === 1 && args[0] === null ? [[null]] : args);
  for (const ten of ['all', 'run', 'iterate'] as const) {
    const goc = proto[ten];
    proto[ten] = function (this: unknown, ...args: unknown[]) { return goc.apply(this, motNull(args)); };
  }
  const getGoc = proto.get;
  proto.get = function (this: unknown, ...args: unknown[]) {
    const row = getGoc.apply(this, motNull(args));
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

/*
 * Thư mục chứa file mã này. Trên Netlify, hàm được gói thành CommonJS nên `import.meta.url` RỖNG (đã tái hiện
 * 22/09: sập ngay lúc nạp). Khi đó rơi về thư mục đang chạy — trên Netlify đường API không đọc file nào theo ROOT.
 * KHÔNG đặt tên biến là `__dirname`: bản gói ESM của Netlify tự khai báo tên đó.
 */
const THU_MUC_MA = import.meta.url ? path.dirname(fileURLToPath(import.meta.url)) : process.cwd();

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

export const ROOT = findProjectRoot(THU_MUC_MA);
const CAU_HINH = cauHinhDb(process.env, path.join(ROOT, 'data', 'pisa-demo.sqlite'));
/** Đường dẫn file khi chạy cục bộ; khi chạy Turso là URL (chỉ để in log, KHÔNG in token). */
export const DB_PATH = CAU_HINH.kieu === 'file' ? CAU_HINH.duongDan : CAU_HINH.url;
export const SCHEMA_PATH = path.join(ROOT, 'server', 'src', 'schema.sql');
export function laDbTuXa(): boolean { return CAU_HINH.kieu === 'turso'; }

let instance: Database.Database | null = null;

export function db(): Database.Database {
  if (!instance) {
    if (CAU_HINH.kieu === 'turso') {
      /* Kiểu của libsql thiếu `authToken` (TS2353) dù thư viện có đọc nó lúc chạy — ép kiểu, đã thử 22/09. */
      instance = new Database(CAU_HINH.url, { authToken: CAU_HINH.authToken } as Database.Options);
    } else {
      fs.mkdirSync(path.dirname(CAU_HINH.duongDan), { recursive: true });
      instance = new Database(CAU_HINH.duongDan);
      instance.pragma('journal_mode = WAL');   // WAL chỉ có nghĩa với file cục bộ
    }
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
  if (!laDbTuXa() && !fs.existsSync(DB_PATH)) return false;
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
/**
 * CHỐT CHẶN XOÁ SẠCH DATABASE Ở TURSO — nằm ngay trong hàm xoá, nên che MỌI nơi gọi (lệnh seed, bộ phép kiểm, mã sau này).
 * Ngoại lệ duy nhất là database THỬ: `PISA_CHO_PHEP_SEED_TURSO` phải bằng ĐÚNG TÊN MÁY CHỦ trong URL (không phải một
 * đoạn chữ — `turso.io` hay một ký tự sẽ khớp mọi database), không bao giờ khi `BAN_CHINH=1`, và không bao giờ với tên
 * máy chủ kiểu bản chính (luật ở `choPhepSeedTurso`).
 */
export function tuChoiXoaSachNeuTuXa(): void {
  if (CAU_HINH.kieu !== 'turso') return;
  if (!laBanChinh() && choPhepSeedTurso(CAU_HINH.url, process.env.PISA_CHO_PHEP_SEED_TURSO)) return;
  throw new Error('TỪ CHỐI: đang trỏ tới Turso. Lệnh này XOÁ SẠCH database và chỉ dùng cho máy dev.\n'
    + 'Muốn seed database THỬ: đặt PISA_CHO_PHEP_SEED_TURSO bằng NGUYÊN tên máy chủ, ví dụ pisatracking-demo-xxx.turso.io');
}

export function recreateSchema() {
  tuChoiXoaSachNeuTuXa();
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
    /* Cuộn lại hỏng (mạng Turso đứt, savepoint đã mất…) thì vẫn ném LỖI GỐC — vòng ngoài sẽ cuộn lại cả giao dịch. */
    try { conn.exec(`ROLLBACK TO ${name}`); conn.exec(`RELEASE ${name}`); } catch { /* giữ lỗi gốc */ }
    throw e;
  } finally {
    savepointDepth--;
  }
}
