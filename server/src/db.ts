import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.resolve(__dirname, '../..');
export const DB_PATH = process.env.PISA_DB ?? path.join(ROOT, 'data', 'pisa-demo.sqlite');
export const SCHEMA_PATH = path.join(__dirname, 'schema.sql');

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
  if (instance) { instance.close(); instance = null; }
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

/** Chạy fn trong một transaction; mọi mutation nhiều bảng phải đi qua đây. */
export function tx<T>(fn: () => T): T {
  return db().transaction(fn)();
}
