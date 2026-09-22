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

  console.log('\nPR-Z2 · 1b. Chốt seed so NGUYÊN tên máy chủ (tên bản chính nằm trong tên bản thử)');
  const { choPhepSeedTurso } = await import('../moiTruong.ts');
  const THU = 'libsql://pisatracking-demo-abc.turso.io';
  const CHINH = 'libsql://pisatracking-abc.turso.io';
  check('PR-Z2 · Seed được vào DB thử khi biến cho phép là NGUYÊN tên máy chủ của nó', () => {
    assert(choPhepSeedTurso(THU, 'pisatracking-demo-abc.turso.io') === true, 'phải cho phép');
  });
  check('PR-Z2 · Biến cho phép là một PHẦN tên ("pisatracking") → KHÔNG khớp DB nào, kể cả bản chính', () => {
    assert(choPhepSeedTurso(CHINH, 'pisatracking') === false, 'bản chính không được seed');
    assert(choPhepSeedTurso(THU, 'pisatracking') === false, 'một phần tên không đủ');
  });
  check('PR-Z2 · Biến cho phép là tên DB thử nhưng URL là bản chính → từ chối', () => {
    assert(choPhepSeedTurso(CHINH, 'pisatracking-demo-abc.turso.io') === false, 'phải từ chối');
  });
  check('PR-Z2 · Không có biến cho phép → từ chối', () => {
    assert(choPhepSeedTurso(THU, undefined) === false && choPhepSeedTurso(THU, '') === false, 'phải từ chối');
  });
  check('PR-Z2 · Tên máy chủ kiểu BẢN CHÍNH (pisatracking-… không có -demo-) bị chặn cứng, kể cả khi biến cho phép dán đúng nguyên tên đó', () => {
    assert(choPhepSeedTurso(CHINH, 'pisatracking-abc.turso.io') === false, 'dán nhầm tên bản chính vẫn không được xoá bản chính');
  });
  check('PR-Z2 · `npm run seed` vào tên máy chủ kiểu bản chính TỪ CHỐI dù biến cho phép khớp nguyên tên, và chỉ cách seed database THỬ', () => {
    /* Máy chủ không tồn tại + token giả: nếu chốt hỏng thì lệnh cũng không xoá được gì của ai. */
    const r = cp.spawnSync(process.execPath, [pathMod.join(REPO, 'dist-server/server/src/seed/run.js')], {
      env: { ...process.env, TURSO_DATABASE_URL: 'libsql://pisatracking-khong-ton-tai.turso.io', TURSO_AUTH_TOKEN: 'x',
        BAN_CHINH: '', PISA_CHO_PHEP_SEED_TURSO: 'pisatracking-khong-ton-tai.turso.io' },
      encoding: 'utf8', timeout: 60_000,
    });
    assert(r.status !== 0 && r.status !== null && /TỪ CHỐI/.test(r.stderr), `Mã thoát ${r.status}; stderr: ${String(r.stderr).slice(-300)}`);
    assert(/NGUYÊN tên máy chủ/.test(r.stderr) && /pisatracking-demo-/.test(r.stderr), `Thiếu dòng chỉ cách seed database THỬ: ${String(r.stderr).slice(-300)}`);
  });

  console.log('\nPR-Z2 · 1c. `npm run migrate` vào Turso: phải xác nhận, và không tạo tài khoản/mật khẩu mặc định của bản demo');
  const fs = await import('node:fs');
  const os = await import('node:os');
  const { default: Database } = await import('libsql');
  const { SCHEMA_PATH } = await import('../db.ts');
  const { DEFAULT_ADMIN_EMAIL } = await import('../platform/accounts.ts');
  const { choPhepMigrateTurso } = await import('../moiTruong.ts');
  /** Đường `file:` cho libsql: libsql mở nó như file cục bộ, còn mã của ta coi như ĐANG Ở TURSO (có TURSO_DATABASE_URL) — thử nhánh Turso mà không cần mạng. */
  const urlFile = (f: string) => 'file:' + f.replace(/\\/g, '/');
  check('PR-Z2 · migrate vào Turso chỉ khi biến xác nhận là NGUYÊN tên máy chủ (bản chính cũng được — sau deploy phải nâng cấp được schema)', () => {
    assert(choPhepMigrateTurso(CHINH, 'pisatracking-abc.turso.io') === true, 'đúng nguyên tên máy chủ bản chính → được');
    assert(choPhepMigrateTurso(CHINH, 'pisatracking') === false, 'một phần tên → không');
    assert(choPhepMigrateTurso(CHINH, undefined) === false && choPhepMigrateTurso(CHINH, '') === false, 'không có biến → không');
  });
  const migrateRunJs = pathMod.join(REPO, 'dist-server/server/src/migrate/run.js');
  check('PR-Z2 · `npm run migrate` TỪ CHỐI khi trỏ tới Turso mà chưa xác nhận đúng nguyên tên — dừng TRƯỚC khi kết nối, nhắc sao lưu', () => {
    for (const xacNhan of ['', 'pisatracking', 'turso.io']) {
      const r = cp.spawnSync(process.execPath, [migrateRunJs], {
        env: { ...process.env, TURSO_DATABASE_URL: 'libsql://khong-ton-tai.turso.io', TURSO_AUTH_TOKEN: 'x', PISA_CHO_PHEP_MIGRATE_TURSO: xacNhan },
        encoding: 'utf8', timeout: 60_000,
      });
      assert(r.status !== 0 && r.status !== null && /TỪ CHỐI/.test(r.stderr),
        `PISA_CHO_PHEP_MIGRATE_TURSO="${xacNhan}": mã thoát ${r.status}; stderr: ${String(r.stderr).slice(-300)}`);
      assert(!/Nâng cấp dữ liệu đang có tại/.test(r.stdout) && !/Hrana|Host not found/i.test(r.stderr),
        `Đã bắt đầu kết nối trước khi hỏi xác nhận: ${String(r.stdout).slice(-200)} ${String(r.stderr).slice(-200)}`);
      assert(/sao-luu/.test(r.stderr), 'Thông báo từ chối phải nhắc sao lưu trước (npm run sao-luu)');
    }
  });
  const migrateLibJs = (await import('node:url')).pathToFileURL(pathMod.join(REPO, 'dist-server/server/src/migrate.js')).href;
  check('PR-Z2 · migrate trên database ở Turso KHÔNG tạo tài khoản quản trị mặc định và KHÔNG gán mật khẩu mặc định cho ai; máy dev (file) giữ hành vi cũ', () => {
    const dir = fs.mkdtempSync(pathMod.join(os.tmpdir(), 'z2-migrate-'));
    try {
      const dung = (ten: string) => {
        const f = pathMod.join(dir, ten);
        const c = new Database(f);
        c.exec(fs.readFileSync(SCHEMA_PATH, 'utf8'));
        c.prepare(`INSERT INTO users (code, full_name, email, approval_state, status, created_at)
                   VALUES ('NV001', 'Người cũ', 'nguoi.cu.pisa@gmail.com', 'approved', 'active', '2026-09-01T00:00:00Z')`).run();
        c.close();
        return f;
      };
      const goiMigrate = (env: Record<string, string>) => cp.spawnSync(process.execPath,
        ['--input-type=module', '-e', `const m = await import(${JSON.stringify(migrateLibJs)}); m.migrate();`], {
          env: { ...process.env, TURSO_DATABASE_URL: '', TURSO_AUTH_TOKEN: '', BAN_CHINH: '', ...env }, encoding: 'utf8', timeout: 60_000,
        });
      const doc = (f: string) => {
        const c = new Database(f);
        try {
          return {
            admin: !!c.prepare('SELECT 1 FROM users WHERE email = ?').get(DEFAULT_ADMIN_EMAIL),
            matKhauCu: (c.prepare("SELECT password_hash FROM users WHERE code = 'NV001'").get() as any).password_hash as string | null,
            soNguoi: (c.prepare('SELECT COUNT(*) n FROM users').get() as any).n as number,
          };
        } finally { c.close(); }
      };

      const fTurso = dung('turso.sqlite');
      const r = goiMigrate({ TURSO_DATABASE_URL: urlFile(fTurso), TURSO_AUTH_TOKEN: 'x' });
      assert(r.status === 0, `migrate (nhánh Turso) lỗi: ${String(r.stderr).slice(-300)}`);
      const t = doc(fTurso);
      assert(!t.admin && t.soNguoi === 1, `Turso: không được tạo tài khoản quản trị mặc định (có admin: ${t.admin}, số người ${t.soNguoi})`);
      assert(!t.matKhauCu, 'Turso: không được gán mật khẩu mặc định cho tài khoản chưa có mật khẩu');
      assert(/Turso: bỏ qua tài khoản\/mật khẩu mặc định của bản demo/.test(r.stdout), `Phải in dòng báo đã bỏ qua, nhận: ${String(r.stdout).slice(-300)}`);

      /* Đối chứng: đúng database đó, chạy như máy dev → hành vi cũ. Chứng minh database thử ở trên THẬT SỰ đi qua bước tài khoản. */
      const fFile = dung('file.sqlite');
      const r2 = goiMigrate({ PISA_DB: fFile });
      assert(r2.status === 0, `migrate (máy dev) lỗi: ${String(r2.stderr).slice(-300)}`);
      const d = doc(fFile);
      assert(d.admin && !!d.matKhauCu, 'Máy dev: migrate vẫn tạo quản trị mặc định và đặt mật khẩu cho tài khoản cũ như trước');
    } finally { try { fs.rmSync(dir, { recursive: true, force: true }); } catch { /* Windows còn giữ file — bỏ qua dọn dẹp */ } }
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

  console.log('\nPR-Z2 · 4. Chốt an toàn sau rà soát Phần A');
  const { pathToFileURL } = await import('node:url');
  const chayCon = (maLenh: string, env: Record<string, string>) => cp.spawnSync(process.execPath, ['--input-type=module', '-e', maLenh], {
    env: { ...process.env, PISA_CHO_PHEP_SEED_TURSO: '', BAN_CHINH: '', ...env }, encoding: 'utf8', timeout: 60_000,
  });
  const TURSO_GIA = { TURSO_DATABASE_URL: 'libsql://khong-ton-tai.turso.io', TURSO_AUTH_TOKEN: 'x' };
  const dbJs = pathToFileURL(pathMod.join(REPO, 'dist-server/server/src/db.js')).href;
  const seedJs = pathMod.join(REPO, 'dist-server/server/src/seed/run.js');

  check('PR-Z2 · Bộ phép kiểm này KHÔNG BAO GIỜ chạy trên Turso: run.ts gỡ biến Turso trước khi mở database (npm run check trong cửa sổ đang có token sẽ không xoá database thật)', () => {
    assert(!process.env.TURSO_DATABASE_URL && !process.env.TURSO_AUTH_TOKEN, 'Biến Turso còn trong môi trường của bộ phép kiểm');
    assert(!/^libsql:|^https?:/.test(String((db() as any).name ?? '')), `Bộ phép kiểm đang mở database từ xa: ${(db() as any).name}`);
  });
  check('PR-Z2 · recreateSchema() — hàm XOÁ MỌI BẢNG — tự từ chối khi database ở Turso, dù gọi từ đâu (không chỉ từ lệnh seed)', () => {
    const r = chayCon(`const m = await import(${JSON.stringify(dbJs)}); m.recreateSchema();`, TURSO_GIA);
    assert(r.status !== 0 && r.status !== null && /TỪ CHỐI/.test(r.stderr), `Mã thoát ${r.status}; stderr: ${String(r.stderr).slice(-300)}`);
  });
  check('PR-Z2 · Ngoại lệ seed phải khớp ĐÚNG TÊN MÁY CHỦ: giá trị chung chung (`turso.io`, `libsql`, một ký tự) không mở được khoá', () => {
    for (const choPhep of ['turso.io', 'libsql', 'khong-ton-tai', 'o']) {
      const r = cp.spawnSync(process.execPath, [seedJs], { env: { ...process.env, ...TURSO_GIA, BAN_CHINH: '', PISA_CHO_PHEP_SEED_TURSO: choPhep }, encoding: 'utf8', timeout: 60_000 });
      assert(r.status !== 0 && r.status !== null && /TỪ CHỐI/.test(r.stderr), `PISA_CHO_PHEP_SEED_TURSO="${choPhep}" đã mở được khoá (mã thoát ${r.status})`);
    }
  });
  check('PR-Z2 · BAN_CHINH=1 thì seed LUÔN bị từ chối, kể cả khi ngoại lệ khớp đúng tên máy chủ', () => {
    const r = cp.spawnSync(process.execPath, [seedJs], { env: { ...process.env, ...TURSO_GIA, BAN_CHINH: '1', PISA_CHO_PHEP_SEED_TURSO: 'khong-ton-tai.turso.io' }, encoding: 'utf8', timeout: 60_000 });
    assert(r.status !== 0 && r.status !== null && /TỪ CHỐI/.test(r.stderr), `Mã thoát ${r.status}; stderr: ${String(r.stderr).slice(-300)}`);
  });
  check('PR-Z2 · Một tham số `null` duy nhất vẫn được hiểu là NULL như better-sqlite3 (libsql gốc ném "failed to downcast any to object")', () => {
    assert((db().prepare('SELECT ? AS x').get(null) as any).x === null, '.get(null)');
    assert((db().prepare('SELECT ? AS x').all(null) as any[]).length === 1, '.all(null)');
    assert([...db().prepare('SELECT ? AS x').iterate(null)].length === 1, '.iterate(null)');
    db().exec('CREATE TEMP TABLE IF NOT EXISTS _z2_null (a)');
    assert(db().prepare('INSERT INTO _z2_null (a) VALUES (?)').run(null).changes === 1, '.run(null)');
    db().exec('DROP TABLE _z2_null');
  });
  await checkAsync('PR-Z2 · Xoá tệp sau giao dịch chạy nền nhưng CHỜ ĐƯỢC: máy chủ Netlify chờ `choViecNenKhoTep()` trước khi trả lời, nên tệp không bị bỏ lại trong kho', async () => {
    const { choViecNenKhoTep } = await import('../platform/khoTep.ts');
    const kho = new Map<string, Buffer>([['violation/a.pdf', Buffer.from('a')], ['violation/b.pdf', Buffer.from('b')]]);
    datKhoTepChoKiemThu({
      async ghi(k, d) { kho.set(k, d); },
      async doc(k) { return kho.get(k) ?? null; },
      async xoa(k) { await new Promise((r) => setTimeout(r, 20)); kho.delete(k); },
    });
    try {
      attachmentsSvc.xoaTepSauGiaoDich(['violation/a.pdf', 'violation/b.pdf']);
      assert(kho.size === 2, 'Kho chậm (như Netlify Blobs): ngay sau lời gọi đồng bộ, tệp CHƯA kịp xoá');
      await choViecNenKhoTep();
      assert(kho.size === 0, `Sau khi chờ việc nền, kho phải trống — còn ${kho.size}`);
    } finally { datKhoTepChoKiemThu(null); }
  });
}
