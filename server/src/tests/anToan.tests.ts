/**
 * PHÉP KIỂM PR-AN — an toàn trước người dùng thật (đặc tả `docs/superpowers/specs/2026-09-22-ux-toan-web-truoc-deploy-design.md`
 * §5 quyết định 4.6, 4.11, §7 dòng AN; kiểm kê §1.9 AN-1…AN-8, §1.7 RB-1). Tên mỗi phép kiểm bắt đầu bằng mã việc.
 *
 * Harness do `run.ts` sở hữu và truyền vào — file này không tự mở database. Tài khoản dùng ở đây do CHÍNH file này tạo (email
 * bắt đầu bằng "an"); mọi lần thử đăng nhập/đăng ký qua HTTP dùng một IP giả riêng (dải 203.0.113.x, dành cho tài liệu); cuối file
 * xoá sạch bảng `auth_attempts` — không ảnh hưởng file khác chạy trước hay sau.
 */
import type { Principal } from '../permissions.ts';

export type AnToanTestKit = {
  check: (name: string, fn: () => void) => void;
  checkAsync: (name: string, fn: () => Promise<void>) => Promise<void>;
  assert: (cond: unknown, msg: string) => void;
  assertThrows: (fn: () => unknown, match: RegExp, msg: string) => void;
  conn: any;
  TODAY: string;
  P: Record<string, Principal>;
};

export async function runAnToanTests(t: AnToanTestKit) {
  const { check, checkAsync, assert, assertThrows, conn, TODAY, P } = t;
  const fsMod = await import('node:fs');
  const pathMod = await import('node:path');
  const { fileURLToPath } = await import('node:url');
  const { default: SqliteDb } = await import('libsql');
  const migrateMod: any = await import('../migrate.ts');
  /** Mô-đun chưa có thì phép kiểm ĐỎ với câu nói rõ thiếu gì, không làm sập cả bộ (mẫu PR-S1). */
  const load = async (p: string): Promise<any> => import(p).catch((e) =>
    new Proxy({}, { get: (_x, k) => { throw new Error(`Chưa có mô-đun ${p} (${String(k)}) — ${e.message}`); } }));
  const REPO = pathMod.resolve(fileURLToPath(new URL('../../../../', import.meta.url)));

  /** Bắt console.error/warn trong lúc chạy fn — để kiểm log máy chủ mà không làm bẩn kết quả. */
  const batLog = async <T>(fn: () => T | Promise<T>): Promise<{ kq: T; log: string }> => {
    const goc = { e: console.error, w: console.warn };
    let log = '';
    const ghi = (...a: unknown[]) => { log += a.map((x) => (x instanceof Error ? `${x.name}: ${x.message}` : String(x))).join(' ') + '\n'; };
    console.error = ghi; console.warn = ghi;
    try { const kq = await fn(); return { kq, log }; } finally { console.error = goc.e; console.warn = goc.w; }
  };
  /** Đếm số câu SQL khớp `mau` được chuẩn bị trên kết nối chung (`db()` — cùng đối tượng với `conn`) trong lúc chạy fn. */
  const demCauHoi = async (mau: RegExp, fn: () => unknown): Promise<number> => {
    const coRieng = Object.prototype.hasOwnProperty.call(conn, 'prepare');
    const goc = conn.prepare;
    let n = 0;
    conn.prepare = function (this: unknown, sql: string, ...r: unknown[]) { if (mau.test(sql)) n += 1; return goc.call(this, sql, ...r); };
    try { await fn(); } finally { if (coRieng) conn.prepare = goc; else delete conn.prepare; }
    return n;
  };
  /** Đối tượng `res` giả cho middleware / bộ xử lý lỗi của Express. */
  const giaRes = () => {
    const o: any = { code: 200, body: undefined as unknown, headers: {} as Record<string, string> };
    o.status = (c: number) => { o.code = c; return o; };
    o.json = (b: unknown) => { o.body = b; return o; };
    o.set = (k: string, v: string) => { o.headers[k.toLowerCase()] = v; return o; };
    o.on = () => o;
    return o;
  };

  // ================================================================== 1. Bảng auth_attempts (AN-1)

  console.log('\nPR-AN · 1. Bảng đếm lần thử đăng nhập/đăng ký');

  check('AN-1 · Bảng auth_attempts có ở database dựng từ schema.sql, đủ cột và chỉ mục; migrate() trên database này không làm gì', () => {
    const cot = (conn.prepare('PRAGMA table_info(auth_attempts)').all() as any[]).map((c) => c.name).join(',');
    assert(cot === 'id,kind,key_hash,at', `Cột: "${cot}"`);
    const cm = (conn.prepare('PRAGMA index_list(auth_attempts)').all() as any[]).map((c) => c.name);
    assert(cm.includes('idx_auth_attempts_key'), `Chỉ mục: ${cm.join(',')}`);
    const r = migrateMod.migrate();
    assert(!r.applied.some((x: string) => /PR-AN/.test(x)), `Database mới mà migrate vẫn áp PR-AN: ${r.applied.join(' | ')}`);
  });

  check('AN-1 · migrateAuthAttempts trên database cũ (chưa có bảng): lần 1 tạo, lần 2 không làm gì; cấu trúc giống hệt schema.sql', () => {
    const mem = new SqliteDb(':memory:');
    try {
      const a1: string[] = []; migrateMod.migrateAuthAttempts(mem, a1);
      const a2: string[] = []; migrateMod.migrateAuthAttempts(mem, a2);
      assert(a1.length === 1 && /PR-AN/.test(a1[0]) && a2.length === 0, `Lần 1: ${a1.join('|')} · lần 2: ${a2.join('|')}`);
      const cot = (c: any) => JSON.stringify((c.prepare('PRAGMA table_info(auth_attempts)').all() as any[]).map((x) => [x.name, x.type, x.notnull, x.pk]));
      assert(cot(mem) === cot(conn), `Cột khác schema.sql: ${cot(mem)} ≠ ${cot(conn)}`);
      const cm = (c: any) => JSON.stringify((c.prepare('PRAGMA index_info(idx_auth_attempts_key)').all() as any[]).map((x) => x.name));
      assert(cm(mem) === cm(conn), `Chỉ mục khác schema.sql: ${cm(mem)} ≠ ${cm(conn)}`);
    } finally { mem.close(); }
  });

  // ---- các task sau thêm phép kiểm NGAY TRÊN dòng này ----

  /* Dọn: không để lại lần thử nào cho file khác (bảng chưa có thì bỏ qua — chỉ xảy ra ở bước đỏ của Task 1). */
  try { conn.prepare('DELETE FROM auth_attempts').run(); } catch { /* bảng chưa có */ }
}
