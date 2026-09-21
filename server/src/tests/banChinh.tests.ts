/** PR-Z2 — bản chính trên Netlify + Turso. Plan: docs/superpowers/plans/2026-09-21-ban-chinh-netlify-turso.md */
export type BanChinhTestKit = {
  check: (name: string, fn: () => void) => void;
  checkAsync: (name: string, fn: () => Promise<void>) => Promise<void>;
  assert: (cond: unknown, msg: string) => void;
  assertThrows: (fn: () => unknown, match: RegExp, msg: string) => void;
};

export async function runBanChinhTests(t: BanChinhTestKit) {
  const { check, assert, assertThrows } = t;
  console.log('\nPR-Z2 · 1. Cấu hình kết nối theo môi trường');
  const { cauHinhDb } = await import('../moiTruong.ts');

  check('PR-Z2 · Không có biến Turso → dùng file cục bộ như máy dev hiện tại', () => {
    const c = cauHinhDb({ PISA_DB: '/tmp/x.sqlite' });
    assert(c.kieu === 'file' && c.duongDan === '/tmp/x.sqlite', `Kỳ vọng file /tmp/x.sqlite, nhận ${JSON.stringify(c)}`);
  });
  check('PR-Z2 · Có TURSO_DATABASE_URL + TURSO_AUTH_TOKEN → dùng Turso', () => {
    const c = cauHinhDb({ TURSO_DATABASE_URL: 'libsql://a.turso.io', TURSO_AUTH_TOKEN: 'tok' });
    assert(c.kieu === 'turso' && c.url === 'libsql://a.turso.io' && c.authToken === 'tok', JSON.stringify(c));
  });
  check('PR-Z2 · Có URL Turso mà thiếu token → từ chối rõ ràng, không lặng lẽ rơi về file', () => {
    assertThrows(() => cauHinhDb({ TURSO_DATABASE_URL: 'libsql://a.turso.io' }), /TURSO_AUTH_TOKEN/,
      'Thiếu token phải báo lỗi');
  });

  /* 🆕 22/09 — canh vá ở Task 1 Step 3b: libsql gắn `_metadata` vào dòng `.get()`. */
  const { db } = await import('../db.ts');
  check('PR-Z2 · Dòng .get() chỉ có đúng các cột đã chọn (không lọt _metadata của libsql ra API)', () => {
    const row = db().prepare('SELECT 1 AS a').get() as Record<string, unknown>;
    assert(JSON.stringify(Object.keys(row)) === '["a"]', `Nhận các khoá ${JSON.stringify(Object.keys(row))}`);
  });

  const cp = await import('node:child_process');
  const pathMod = await import('node:path');
  const { fileURLToPath } = await import('node:url');
  const REPO = pathMod.resolve(fileURLToPath(new URL('../../../../', import.meta.url)));
  check('PR-Z2 · `npm run seed` TỪ CHỐI khi đang trỏ tới Turso (lệnh này xoá sạch database — chỉ dành cho máy dev)', () => {
    /* URL không tồn tại: nếu lệnh KHÔNG từ chối thì nó cũng không xoá được gì của ai. */
    const r = cp.spawnSync(process.execPath, [pathMod.join(REPO, 'dist-server/server/src/seed/run.js')], {
      env: { ...process.env, TURSO_DATABASE_URL: 'libsql://khong-ton-tai.turso.io', TURSO_AUTH_TOKEN: 'x', PISA_CHO_PHEP_SEED_TURSO: '' },
      encoding: 'utf8', timeout: 60_000,
    });
    assert(r.status !== 0 && r.status !== null, `Mã thoát phải khác 0, nhận ${r.status}`);
    assert(/TỪ CHỐI/.test(r.stderr), `stderr phải có chữ TỪ CHỐI, nhận: ${String(r.stderr).slice(-300)}`);
  });
}
