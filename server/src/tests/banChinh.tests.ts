/** PR-Z2 — bản chính trên Netlify + Turso. Plan: docs/superpowers/plans/2026-09-21-ban-chinh-netlify-turso.md */
export type BanChinhTestKit = {
  check: (name: string, fn: () => void) => void;
  checkAsync: (name: string, fn: () => Promise<void>) => Promise<void>;
  assert: (cond: unknown, msg: string) => void;
  assertThrows: (fn: () => unknown, match: RegExp, msg: string) => void;
  /** Kết nối database demo và principal Quản trị hệ thống — cho phép kiểm kho tệp (Task 4). */
  conn: import('libsql').Database;
  admin: import('../permissions.ts').Principal;
};

export async function runBanChinhTests(t: BanChinhTestKit) {
  const { check, checkAsync, assert, assertThrows } = t;
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

  console.log('\nPR-Z2 · 2. Kho tệp');
  const { datKhoTepChoKiemThu } = await import('../platform/khoTep.ts');
  const khoGia = new Map<string, Buffer>();
  datKhoTepChoKiemThu({
    async ghi(k, d) { khoGia.set(k, d); },
    async doc(k) { return khoGia.get(k) ?? null; },
    async xoa(k) { khoGia.delete(k); },
  });
  const { ATTACHMENT_MAX_BYTES } = await import('../../../shared/domain/attachments.ts');
  check('PR-Z2 · Giới hạn tệp là 4 MB (Netlify Functions nhận tối đa ~6 MB mỗi lần gọi)', () => {
    assert(ATTACHMENT_MAX_BYTES === 4 * 1024 * 1024, `Đang là ${ATTACHMENT_MAX_BYTES}`);
  });
  const attachmentsSvc = await import('../platform/attachments.ts');
  await checkAsync('PR-Z2 · Tệp đi qua KHO (không ghi thẳng ổ đĩa): thêm → nằm trong kho dưới khoá `<loại>/<tên ngẫu nhiên>`; mở → đúng nội dung; xoá → kho mất tệp', async () => {
    const c = t.conn.prepare('SELECT id FROM sos_cases ORDER BY id LIMIT 1').get() as { id: number } | undefined;
    assert(c, 'Bộ demo phải có ít nhất một case học thuật');
    const truoc = khoGia.size;
    const row = await attachmentsSvc.addFile(t.admin, { ownerType: 'sos_case', ownerId: c!.id, fileName: 'z2.pdf', data: Buffer.from('xin chao') });
    assert(khoGia.size === truoc + 1, 'Thêm tệp phải ghi đúng một mục vào kho');
    const khoa = [...khoGia.keys()].pop()!;
    assert(/^sos_case\/[0-9a-f-]{36}\.pdf$/.test(khoa), `Khoá trong kho sai dạng: ${khoa}`);
    const o = await attachmentsSvc.openAttachment(t.admin, row.id);
    assert(o.kind === 'file' && o.duLieu.toString() === 'xin chao', 'Mở tệp phải ra đúng nội dung đã lưu');
    await attachmentsSvc.removeAttachment(t.admin, row.id);
    assert(khoGia.size === truoc, 'Xoá dòng thì tệp trong kho cũng phải được xoá');
  });
  datKhoTepChoKiemThu(null);

  console.log('\nPR-Z2 · 3. Bản chính không có gì của bản demo');
  const demoConfigMod = await import('../demoConfig.ts');
  const { demoToday, scenarioMode } = demoConfigMod;
  check('PR-Z2 · Bản chính: demoToday() là ngày thật, bỏ qua demo_date đã đặt', () => {
    process.env.BAN_CHINH = '1';
    try {
      const homNay = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date());
      assert(demoToday() === homNay, `Kỳ vọng ${homNay}, nhận ${demoToday()}`);
    } finally { delete process.env.BAN_CHINH; }
  });
  check('PR-Z2 · Bản chính: chế độ kịch bản luôn là normal, kể cả khi cấu hình demo đang đặt khác', () => {
    const { setConfig, getConfig } = demoConfigMod;
    const cu = getConfig('scenario_mode');
    setConfig('scenario_mode', 'error');
    process.env.BAN_CHINH = '1';
    try {
      assert(scenarioMode() === 'normal', `Nhận ${scenarioMode()}`);
    } finally { delete process.env.BAN_CHINH; setConfig('scenario_mode', cu); }
  });

  /* Gọi thẳng đường HTTP của ĐÚNG ứng dụng đang chạy (cùng khuôn PR-J), bật/tắt BAN_CHINH quanh từng lời gọi. */
  const { createApp } = await import('../app.ts');
  const { createSession } = await import('../auth.ts');
  const server = createApp().listen(0);
  const port = (server.address() as any).port as number;
  const goi = async (banChinh: boolean, method: string, url: string, o: { dangNhap?: boolean; body?: unknown } = {}) => {
    const headers: Record<string, string> = { 'content-type': 'application/json' };
    if (o.dangNhap) headers.cookie = `pisa_demo_session=${createSession(t.admin.userId)}`;
    if (banChinh) process.env.BAN_CHINH = '1';
    try {
      const res = await fetch(`http://127.0.0.1:${port}/api${url}`, { method, headers, body: o.body === undefined ? undefined : JSON.stringify(o.body) });
      let json: any = null;
      try { json = await res.json(); } catch { /* không có thân */ }
      return { status: res.status, json, setCookie: res.headers.get('set-cookie') };
    } finally { delete process.env.BAN_CHINH; }
  };

  await checkAsync('PR-Z2 · Bản chính: GET /demo/accounts → 404 (không lộ danh sách tài khoản)', async () => {
    const r = await goi(true, 'GET', '/demo/accounts');
    assert(r.status === 404, `Nhận ${r.status}`);
  });
  await checkAsync('PR-Z2 · Bản chính: POST /demo/session ("Vào nhanh" — đăng nhập bằng id KHÔNG mật khẩu) → 404, không phát cookie', async () => {
    const r = await goi(true, 'POST', '/demo/session', { body: { userId: t.admin.userId } });
    assert(r.status === 404, `Cửa sau còn mở: nhận ${r.status}`);
    assert(!r.setCookie, `Không được phát cookie phiên, nhận: ${r.setCookie}`);
  });
  await checkAsync('PR-Z2 · Bản chính: PUT và GET /demo/config → 404 kể cả khi đã đăng nhập Quản trị (không đổi được ngày giả / kịch bản lỗi)', async () => {
    const cu = demoConfigMod.getConfig('scenario_mode');
    try {
      const put = await goi(true, 'PUT', '/demo/config', { dangNhap: true, body: { scenario: 'error' } });
      const get = await goi(true, 'GET', '/demo/config', { dangNhap: true });
      assert(put.status === 404 && get.status === 404, `PUT ${put.status} · GET ${get.status}`);
      assert(demoConfigMod.getConfig('scenario_mode') === cu, 'PUT bị chặn thì cấu hình không được đổi');
    } finally { demoConfigMod.setConfig('scenario_mode', cu); }
  });
  await checkAsync('PR-Z2 · Bản chính: GET /demo/session vẫn 200 (màn đăng nhập cần) với demoDate = ngày thật; DELETE /demo/session (đăng xuất) vẫn chạy', async () => {
    const homNay = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date());
    const g = await goi(true, 'GET', '/demo/session');
    assert(g.status === 200 && g.json?.authenticated === false && g.json?.demoDate === homNay, `Nhận ${g.status} ${JSON.stringify(g.json)}`);
    const macDinh = await goi(false, 'DELETE', '/demo/session', { dangNhap: true });
    const d = await goi(true, 'DELETE', '/demo/session', { dangNhap: true });
    assert(d.status === macDinh.status && d.status < 300, `Đăng xuất bản chính ${d.status}, máy dev ${macDinh.status}`);
  });
  await checkAsync('PR-Z2 · Bản chính: GET /auth/info không có khoá demoAdmin (không lộ mật khẩu mặc định); máy dev vẫn có', async () => {
    const bc = await goi(true, 'GET', '/auth/info');
    assert(bc.status === 200 && bc.json && !('demoAdmin' in bc.json) && !JSON.stringify(bc.json).includes('pisa2026'), `Bản chính lộ: ${JSON.stringify(bc.json).slice(0, 200)}`);
    assert(bc.json.emailSuffix && Array.isArray(bc.json.skills), 'Các khoá khác phải giữ nguyên');
    const dev = await goi(false, 'GET', '/auth/info');
    assert(dev.status === 200 && dev.json?.demoAdmin?.email, 'Máy dev phải giữ gợi ý tài khoản demo');
  });
  await checkAsync('PR-Z2 · Bản chính: cookie phiên khi đăng nhập thật có cờ Secure; máy dev thì không', async () => {
    const tk = (await goi(false, 'GET', '/auth/info')).json.demoAdmin;
    const bc = await goi(true, 'POST', '/auth/login', { body: { email: tk.email, password: tk.password } });
    assert(bc.status === 200 && /;\s*secure/i.test(bc.setCookie ?? ''), `Bản chính: ${bc.status} · ${bc.setCookie}`);
    const dev = await goi(false, 'POST', '/auth/login', { body: { email: tk.email, password: tk.password } });
    assert(dev.status === 200 && dev.setCookie && !/;\s*secure/i.test(dev.setCookie), `Máy dev: ${dev.status} · ${dev.setCookie}`);
  });
  await checkAsync('PR-Z2 · Máy dev (không có BAN_CHINH): "Vào nhanh" POST /demo/session và GET /demo/accounts vẫn chạy như cũ', async () => {
    const acc = await goi(false, 'GET', '/demo/accounts');
    assert(acc.status === 200 && Array.isArray(acc.json) && acc.json.length > 0, `accounts: ${acc.status}`);
    const s = await goi(false, 'POST', '/demo/session', { body: { userId: t.admin.userId } });
    assert(s.status === 200 && s.setCookie, `Vào nhanh: ${s.status}`);
  });
  server.close();
}
