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
  const moiTruongModSom = await import('../moiTruong.ts');
  const { cauHinhDb } = moiTruongModSom;

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
  check('PR-Z2 · URL Turso dán thiếu "libsql://" → từ chối (libsql sẽ lặng lẽ tạo một FILE cục bộ mang tên máy chủ); các dạng hợp lệ vẫn nhận', () => {
    assertThrows(() => cauHinhDb({ TURSO_DATABASE_URL: 'pisatracking-xxx.aws-us-east-2.turso.io', TURSO_AUTH_TOKEN: 'x' }), /libsql:\/\//, 'Thiếu libsql:// phải báo lỗi');
    for (const u of ['libsql://a.turso.io', 'https://a.turso.io', 'wss://a.turso.io', 'file:C:/tam/x.sqlite']) {
      assert(cauHinhDb({ TURSO_DATABASE_URL: u, TURSO_AUTH_TOKEN: 'x' }).kieu === 'turso', `Phải nhận ${u}`);
    }
  });
  check('PR-Z2 · moTaDichDb nói rõ đích là database BẢN CHÍNH, THỬ hay KHÔNG RÕ — để thấy ngay khi dán nhầm URL', () => {
    const { moTaDichDb } = moiTruongModSom;
    assert(/BẢN CHÍNH/.test(moTaDichDb('libsql://pisatracking-pizi147.aws-us-east-2.turso.io')), 'bản chính');
    assert(/THỬ/.test(moTaDichDb('libsql://pisatracking-demo-pizi147.aws-us-east-2.turso.io')), 'bản thử');
    assert(/KHÔNG RÕ/.test(moTaDichDb('libsql://khac-pizi147.turso.io')) && /KHÔNG RÕ/.test(moTaDichDb('file:C:/tam/x.sqlite')), 'khác');
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
      env: { ...process.env, TURSO_DATABASE_URL: 'libsql://khong-ton-tai.invalid', TURSO_AUTH_TOKEN: 'x', PISA_CHO_PHEP_SEED_TURSO: '' },
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
      env: { ...process.env, TURSO_DATABASE_URL: 'libsql://pisatracking-khong-ton-tai.invalid', TURSO_AUTH_TOKEN: 'x',
        BAN_CHINH: '', PISA_CHO_PHEP_SEED_TURSO: 'pisatracking-khong-ton-tai.invalid' },
      encoding: 'utf8', timeout: 60_000,
    });
    assert(r.status !== 0 && r.status !== null && /TỪ CHỐI/.test(r.stderr), `Mã thoát ${r.status}; stderr: ${String(r.stderr).slice(-300)}`);
    assert(/NGUYÊN tên máy chủ/.test(r.stderr) && /pisatracking-demo-/.test(r.stderr), `Thiếu dòng chỉ cách seed database THỬ: ${String(r.stderr).slice(-300)}`);
  });

  const dbJsUrl = (await import('node:url')).pathToFileURL(pathMod.join(REPO, 'dist-server/server/src/db.js')).href;
  check('PR-Z2 · URL Turso dán kèm ?authToken=… (kiểu "chuỗi kết nối" của Turso): DB_PATH — thứ mọi lệnh in ra — KHÔNG chứa token', () => {
    /* Chỉ nạp db.ts và in DB_PATH — không mở kết nối nào. */
    const r = cp.spawnSync(process.execPath, ['--input-type=module', '-e', `const m = await import(${JSON.stringify(dbJsUrl)}); console.log(m.DB_PATH);`], {
      env: { ...process.env, TURSO_DATABASE_URL: 'libsql://khong-ton-tai.invalid?authToken=BI-MAT-KHONG-DUOC-IN', TURSO_AUTH_TOKEN: 'x' },
      encoding: 'utf8', timeout: 60_000,
    });
    assert(r.status === 0, `Lỗi: ${String(r.stderr).slice(-300)}`);
    assert(!String(r.stdout).includes('BI-MAT') && /^libsql:\/\/khong-ton-tai\.invalid\s*$/.test(String(r.stdout)), `DB_PATH in ra: ${String(r.stdout).trim()}`);
  });

  console.log('\nPR-Z2 · 1c. `npm run migrate` vào Turso: phải xác nhận, và không tạo tài khoản/mật khẩu mặc định của bản demo');
  const fs = await import('node:fs');
  const os = await import('node:os');
  /**
   * Xoá thư mục tạm của một phép kiểm. Trên Windows, tay cầm tệp (kết nối sqlite, cổng máy chủ Blobs cục bộ)
   * đôi khi chưa nhả ngay sau khi đóng — thử lại vài lần trước khi bỏ cuộc; bỏ cuộc thì để lần `npm run check`
   * sau quét dọn (xem đầu server/src/tests/run.ts), không lặng lẽ rơi mất như trước.
   */
  const xoaThuMucTam = (dir: string) => {
    for (let lan = 0; lan < 5; lan++) {
      try { fs.rmSync(dir, { recursive: true, force: true }); return; } catch { /* thử lại */ }
      const cho = new Int32Array(new SharedArrayBuffer(4));
      Atomics.wait(cho, 0, 0, 30 * (lan + 1));
    }
    try { fs.rmSync(dir, { recursive: true, force: true }); } catch { /* để lần chạy sau dọn */ }
  };
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
        env: { ...process.env, TURSO_DATABASE_URL: 'libsql://khong-ton-tai.invalid', TURSO_AUTH_TOKEN: 'x', PISA_CHO_PHEP_MIGRATE_TURSO: xacNhan },
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
    } finally { xoaThuMucTam(dir); }
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

  console.log('\nPR-Z2 · 2b. Bản nháp không bao giờ chạm dữ liệu thật: kho tệp theo database, xoá tệp sau giao dịch');
  const khoTepMod = await import('../platform/khoTep.ts');
  check('PR-Z2 · Kho tệp mang tên database: bản thử và bản chính dùng HAI kho khác nhau; máy dev dùng kho cục bộ', () => {
    const thu = khoTepMod.tenKhoTep('libsql://pisatracking-demo-pizi147.aws-us-east-2.turso.io');
    const chinh = khoTepMod.tenKhoTep('libsql://pisatracking-pizi147.aws-us-east-2.turso.io');
    assert(thu === 'bang-chung-pisatracking-demo-pizi147', `Kho của database thử: ${thu}`);
    assert(chinh === 'bang-chung-pisatracking-pizi147', `Kho của database chính: ${chinh}`);
    assert(thu !== chinh, 'Hai database phải có hai kho tệp khác nhau');
    assert(khoTepMod.tenKhoTep() === 'bang-chung-cuc-bo', `Không có Turso (bộ kiểm chạy file cục bộ) → kho cục bộ, nhận ${khoTepMod.tenKhoTep()}`);
  });
  await checkAsync('PR-Z2 · Netlify Blobs: tệp được ghi/đọc/xoá trong kho CỦA database đang nối (tenKhoTep), không vào kho chung "bang-chung" của cả site', async () => {
    /* Máy chủ Blobs cục bộ có sẵn trong @netlify/blobs — đúng giao thức Netlify dùng, không cần mạng. */
    const { BlobsServer } = await import('@netlify/blobs/server');
    const { getStore, setEnvironmentContext } = await import('@netlify/blobs');
    const dir = fs.mkdtempSync(pathMod.join(os.tmpdir(), 'z2-blobs-'));
    const mayBlobs = new BlobsServer({ directory: dir, token: 'tok' });
    const { port } = await mayBlobs.start();
    setEnvironmentContext({ edgeURL: `http://localhost:${port}`, siteID: 'site-thu', token: 'tok' });
    try {
      const kho = khoTepMod.khoTepNetlify();
      await kho.ghi('violation/z2.pdf', Buffer.from('xin chao'), 'application/pdf');
      const dung = await getStore(khoTepMod.tenKhoTep()).list();
      const chung = await getStore('bang-chung').list();
      assert(dung.blobs.some((b) => b.key === 'violation/z2.pdf'), `Tệp không nằm trong kho ${khoTepMod.tenKhoTep()}`);
      assert(chung.blobs.length === 0, 'Tệp lọt vào kho chung "bang-chung" (dùng chung mọi loại deploy)');
      assert((await kho.doc('violation/z2.pdf'))?.toString() === 'xin chao', 'Đọc lại phải ra đúng nội dung');
      await kho.xoa('violation/z2.pdf');
      assert((await getStore(khoTepMod.tenKhoTep()).list()).blobs.length === 0, 'Xoá phải xoá trong đúng kho đó');
    } finally {
      delete process.env.NETLIFY_BLOBS_CONTEXT;
      await mayBlobs.stop();
      xoaThuMucTam(dir);
    }
  });
  const xuLySvc = await import('../yThuc/xuLy.ts');
  await checkAsync('PR-Z2 · (PR-YT4) Xoá NHÁP đề xuất Ý thức: tệp trong kho chỉ bị xoá SAU KHI giao dịch đã chốt (giao dịch lui thì dòng còn mà tệp mất là không hoàn tác được)', async () => {
    const sv = t.conn.prepare(`SELECT v.student_id AS sid, v.id FROM violations v JOIN enrollments e ON e.student_id = v.student_id AND e.status = 'active'
      WHERE NOT EXISTS (SELECT 1 FROM measure_violations mv WHERE mv.violation_id = v.id) ORDER BY v.id LIMIT 1`).get() as { sid: number; id: number } | undefined;
    assert(sv, 'Bộ demo phải có ít nhất một vi phạm chưa xử lý của em đang học');
    const m = xuLySvc.deXuat(t.admin, sv!.sid, { kind: 'suspension', violationIds: [sv!.id], note: 'Đề xuất nháp dùng cho phép kiểm xoá tệp' });
    const kho = new Map<string, Buffer>();
    const trongGiaoDichLucXoa: boolean[] = [];
    datKhoTepChoKiemThu({
      async ghi(k, d) { kho.set(k, d); },
      async doc(k) { return kho.get(k) ?? null; },
      async xoa(k) { trongGiaoDichLucXoa.push(db().inTransaction); kho.delete(k); },
    });
    try {
      await attachmentsSvc.addFile(t.admin, { ownerType: 'discipline_measure', ownerId: m!.id, fileName: 'z2.pdf', data: Buffer.from('bien phap') });
      assert(kho.size === 1, 'Chuẩn bị: biện pháp phải có một tệp trong kho');
      xuLySvc.xoaNhap(t.admin, m.id);
      await khoTepMod.choViecNenKhoTep();
      assert(trongGiaoDichLucXoa.length === 1, `Phải xoá đúng một tệp, đã gọi xoá ${trongGiaoDichLucXoa.length} lần`);
      assert(trongGiaoDichLucXoa[0] === false, 'Tệp bị xoá khi giao dịch CHƯA chốt');
      assert(kho.size === 0, 'Xoá nháp thì tệp của nó cũng phải rời kho');
    } finally { datKhoTepChoKiemThu(null); }
  });
  check('PR-Z2 · `npm run thu-turso` (tạo/xoá bảng _thu) TỪ CHỐI database kiểu bản chính và khi BAN_CHINH=1 — dừng trước khi kết nối', () => {
    const thuJs = pathMod.join(REPO, 'dist-server/server/src/ops/thuTurso.js');
    for (const [url, banChinh] of [['libsql://pisatracking-khong-ton-tai.invalid', ''], ['libsql://pisatracking-demo-khong-ton-tai.invalid', '1']]) {
      const r = cp.spawnSync(process.execPath, [thuJs], {
        env: { ...process.env, TURSO_DATABASE_URL: url, TURSO_AUTH_TOKEN: 'x', BAN_CHINH: banChinh }, encoding: 'utf8', timeout: 60_000,
      });
      const ra = String(r.stdout) + String(r.stderr);
      assert(r.status !== 0 && r.status !== null && /TỪ CHỐI/.test(r.stderr), `${url} BAN_CHINH="${banChinh}": mã thoát ${r.status}; ${ra.slice(-300)}`);
      assert(!/Hrana|Host not found|HỎNG/i.test(ra), `Đã kết nối trước khi từ chối: ${ra.slice(-300)}`);
    }
  });
  const { tx } = await import('../db.ts');
  check('PR-Z2 · Giao dịch lồng: nếu chính lệnh ROLLBACK TO cũng hỏng thì vẫn ném LỖI GỐC (lỗi dọn dẹp không được che nguyên nhân)', () => {
    /* Vòng ngoài là giao dịch thật, vòng trong là SAVEPOINT sp_1. Tự RELEASE sp_1 trước khi ném → ROLLBACK TO sp_1 hỏng. */
    assertThrows(() => tx(() => tx(() => { db().exec('RELEASE sp_1'); throw new Error('lỗi gốc z2'); })), /lỗi gốc z2/, 'Phải thấy lỗi gốc');
    assert(!db().inTransaction, 'Giao dịch ngoài phải đã kết thúc (cuộn lại)');
  });

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

  console.log('\nPR-Z2 · 3b. Máy chủ nối Turso thì LUÔN ở chế độ bản chính (kể cả `npm run dev` trong cửa sổ còn biến Turso)');
  const moiTruongMod = await import('../moiTruong.ts');
  check('PR-Z2 · laBanChinh() đúng khi có BAN_CHINH=1 HOẶC có TURSO_DATABASE_URL; cờ tường minh coCoBanChinh() chỉ theo BAN_CHINH', () => {
    const { laBanChinh, coCoBanChinh } = moiTruongMod;
    assert(laBanChinh({ TURSO_DATABASE_URL: 'libsql://x.invalid' }) === true, 'Có URL Turso mà không coi là bản chính');
    assert(laBanChinh({ BAN_CHINH: '1' }) === true && laBanChinh({}) === false && laBanChinh({ TURSO_DATABASE_URL: '  ' }) === false, 'Máy dev phải giữ nguyên');
    assert(coCoBanChinh({ TURSO_DATABASE_URL: 'libsql://x.invalid' }) === false && coCoBanChinh({ BAN_CHINH: '1' }) === true, 'coCoBanChinh chỉ xem BAN_CHINH');
  });
  await checkAsync('PR-Z2 · `npm run dev` với biến Turso, KHÔNG có BAN_CHINH: POST /api/demo/session (đăng nhập không mật khẩu) → 404, /auth/info không lộ demoAdmin', async () => {
    const may = createApp().listen(0);
    const cong = (may.address() as any).port as number;
    process.env.TURSO_DATABASE_URL = 'libsql://khong-ton-tai.invalid';   // chỉ đổi CHẾ ĐỘ; kết nối của tiến trình đã mở sẵn tới file kiểm thử
    try {
      const s = await fetch(`http://127.0.0.1:${cong}/api/demo/session`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ userId: t.admin.userId }) });
      assert(s.status === 404 && !s.headers.get('set-cookie'), `Cửa sau còn mở khi có biến Turso: ${s.status}`);
      const info = await (await fetch(`http://127.0.0.1:${cong}/api/auth/info`)).json() as any;
      assert(!('demoAdmin' in info), 'Lộ mật khẩu mặc định khi có biến Turso');
    } finally { delete process.env.TURSO_DATABASE_URL; may.close(); }
  });
  check('PR-Z2 · Chốt seed vẫn cho seed database THỬ (đúng nguyên tên máy chủ, không có BAN_CHINH) — đổi nghĩa laBanChinh không được khoá luôn đường này', () => {
    /* Máy chủ .invalid không bao giờ tồn tại: chốt cho qua thì lệnh chỉ hỏng ở bước kết nối, không xoá được gì của ai. */
    const r = cp.spawnSync(process.execPath, [pathMod.join(REPO, 'dist-server/server/src/seed/run.js')], {
      env: { ...process.env, TURSO_DATABASE_URL: 'libsql://pisatracking-demo-khong-ton-tai.invalid', TURSO_AUTH_TOKEN: 'x',
        BAN_CHINH: '', PISA_CHO_PHEP_SEED_TURSO: 'pisatracking-demo-khong-ton-tai.invalid' },
      encoding: 'utf8', timeout: 60_000,
    });
    assert(!/TỪ CHỐI/.test(String(r.stderr)) && /Đang tạo lại dữ liệu demo/.test(String(r.stdout)), `Chốt đã chặn cả database thử: ${String(r.stderr).slice(-300)}`);
  });

  console.log('\nPR-Z2 · 4. Chốt an toàn sau rà soát Phần A');
  const { pathToFileURL } = await import('node:url');
  const { DB_PATH, laDbTuXa } = await import('../db.ts');
  const chayCon = (maLenh: string, env: Record<string, string>) => cp.spawnSync(process.execPath, ['--input-type=module', '-e', maLenh], {
    env: { ...process.env, PISA_CHO_PHEP_SEED_TURSO: '', BAN_CHINH: '', ...env }, encoding: 'utf8', timeout: 60_000,
  });
  /* AN-13: tên miền `.invalid` không bao giờ phân giải — một chốt hỏng cũng không ra mạng thật. */
  const TURSO_GIA = { TURSO_DATABASE_URL: 'libsql://khong-ton-tai.invalid', TURSO_AUTH_TOKEN: 'x' };
  const dbJs = pathToFileURL(pathMod.join(REPO, 'dist-server/server/src/db.js')).href;
  const seedJs = pathMod.join(REPO, 'dist-server/server/src/seed/run.js');

  check('PR-Z2 · Bộ phép kiểm này KHÔNG BAO GIỜ chạy trên Turso: run.ts gỡ biến Turso trước khi mở database (npm run check trong cửa sổ đang có token sẽ không xoá database thật)', () => {
    assert(!process.env.TURSO_DATABASE_URL && !process.env.TURSO_AUTH_TOKEN, 'Biến Turso còn trong môi trường của bộ phép kiểm');
    /* AN-13: `db().name` luôn "" ở libsql 0.5.29 nên câu cũ không bao giờ đỏ — đọc cấu hình kết nối thật. */
    assert(!laDbTuXa() && !/^libsql:|^https?:|^wss?:/.test(DB_PATH), `Bộ phép kiểm đang mở database từ xa: ${DB_PATH}`);
  });
  check('PR-Z2 · recreateSchema() — hàm XOÁ MỌI BẢNG — tự từ chối khi database ở Turso, dù gọi từ đâu (không chỉ từ lệnh seed)', () => {
    const r = chayCon(`const m = await import(${JSON.stringify(dbJs)}); m.recreateSchema();`, TURSO_GIA);
    assert(r.status !== 0 && r.status !== null && /TỪ CHỐI/.test(r.stderr), `Mã thoát ${r.status}; stderr: ${String(r.stderr).slice(-300)}`);
  });
  check('PR-Z2 · Ngoại lệ seed phải khớp ĐÚNG TÊN MÁY CHỦ: giá trị chung chung (đuôi tên miền `invalid`, `libsql`, một ký tự) không mở được khoá', () => {
    for (const choPhep of ['invalid', 'libsql', 'khong-ton-tai', 'o']) {
      const r = cp.spawnSync(process.execPath, [seedJs], { env: { ...process.env, ...TURSO_GIA, BAN_CHINH: '', PISA_CHO_PHEP_SEED_TURSO: choPhep }, encoding: 'utf8', timeout: 60_000 });
      assert(r.status !== 0 && r.status !== null && /TỪ CHỐI/.test(r.stderr), `PISA_CHO_PHEP_SEED_TURSO="${choPhep}" đã mở được khoá (mã thoát ${r.status})`);
    }
  });
  check('PR-Z2 · BAN_CHINH=1 thì seed LUÔN bị từ chối, kể cả khi ngoại lệ khớp đúng tên máy chủ', () => {
    const r = cp.spawnSync(process.execPath, [seedJs], { env: { ...process.env, ...TURSO_GIA, BAN_CHINH: '1', PISA_CHO_PHEP_SEED_TURSO: 'khong-ton-tai.invalid' }, encoding: 'utf8', timeout: 60_000 });
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

  console.log('\nPR-Z2 · 5. Khởi tạo bản chính (init-ban-chinh) và thêm chi nhánh (them-chi-nhanh) — chạy trên FILE TẠM riêng');
  const { BANG_NEN_INIT, initBanChinh, docDanhSachChiNhanh, themChiNhanh } = await import('../ops/initBanChinh.ts');
  const { napDuLieuNen } = await import('../seed/duLieuNen.ts');
  const cryptoMod = await import('node:crypto');
  const schemaSql = fs.readFileSync(SCHEMA_PATH, 'utf8');
  const moDbTam = () => {
    const dir = fs.mkdtempSync(pathMod.join(os.tmpdir(), 'z2-init-'));
    return { conn: new Database(pathMod.join(dir, 'x.sqlite')), dir };
  };
  const dongLai = (o: { conn: InstanceType<typeof Database>; dir: string }) => {
    try { o.conn.close(); } catch { /* đã đóng */ }
    xoaThuMucTam(o.dir);
  };
  const dem = (conn: InstanceType<typeof Database>, b: string) => (conn.prepare(`SELECT COUNT(*) n FROM "${b}"`).get() as any).n as number;
  const cacBang = (conn: InstanceType<typeof Database>) =>
    (conn.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all() as any[]).map((x) => x.name as string);
  /** Ảnh chụp TOÀN BỘ database: cấu trúc + mọi dòng của mọi bảng. Hai ảnh bằng nhau = không có gì bị ghi, xoá hay đổi. */
  const anhChup = (conn: InstanceType<typeof Database>) => JSON.stringify({
    cauTruc: conn.prepare("SELECT type, name, sql FROM sqlite_master ORDER BY type, name").all(),
    dong: cacBang(conn).map((b) => [b, conn.prepare(`SELECT * FROM "${b}" ORDER BY rowid`).all()]),
  });
  const soLanGhi = (conn: InstanceType<typeof Database>) => (conn.prepare('SELECT total_changes() AS n').get() as any).n as number;
  const MK = 'MatKhauManh2026';
  const O = { adminEmail: 'quantri.pisa@gmail.com', adminPassword: MK, chiNhanh: [{ code: 'MB', name: 'Monbay' }, { code: 'BC', name: 'Bãi Cháy' }], now: '2026-09-21T00:00:00Z', schemaSql };

  check('PR-Z2 · docDanhSachChiNhanh đọc "MB=Monbay; BC=Bãi Cháy" (mã viết hoa), từ chối chuỗi rỗng, mã trùng, thiếu tên, mã có dấu/khoảng trắng và mã TUTOR (đã là đơn vị Tutor)', () => {
    const ds = docDanhSachChiNhanh('mb=Monbay; BC=Bãi Cháy;');
    assert(ds.length === 2 && ds[0].code === 'MB' && ds[1].code === 'BC' && ds[1].name === 'Bãi Cháy', JSON.stringify(ds));
    assertThrows(() => docDanhSachChiNhanh(''), /CHI_NHANH/, 'Rỗng phải báo lỗi');
    assertThrows(() => docDanhSachChiNhanh('MB=A;MB=B'), /trùng/, 'Mã trùng phải báo lỗi');
    assertThrows(() => docDanhSachChiNhanh('MB='), /tên/i, 'Thiếu tên phải báo lỗi');
    assertThrows(() => docDanhSachChiNhanh('Monbay'), /MÃ=Tên/, 'Thiếu dấu = phải báo lỗi');
    assertThrows(() => docDanhSachChiNhanh('BÃI CHÁY=Bãi Cháy'), /mã/i, 'Mã có dấu/khoảng trắng phải báo lỗi');
    assertThrows(() => docDanhSachChiNhanh('TUTOR=Tutor'), /TUTOR/, 'Mã TUTOR đã dành cho đơn vị Tutor part-time');
  });

  check('PR-Z2 · init-ban-chinh trên database rỗng: đúng MỘT tài khoản (quản trị hệ thống, mật khẩu đã cho), đủ chi nhánh, dữ liệu nền GIỐNG HỆT bộ demo', () => {
    const o = moDbTam();
    try {
      const r = initBanChinh(o.conn, O);
      const c = o.conn;
      assert(dem(c, 'users') === 1 && r.branchIds.length === 2 && dem(c, 'branches') === 2, `users=${dem(c, 'users')} branches=${dem(c, 'branches')}`);
      const u = c.prepare('SELECT * FROM users WHERE id = ?').get(r.userId) as any;
      assert(u.email === 'quantri.pisa@gmail.com' && u.code === 'NV001' && u.approval_state === 'approved' && u.status === 'active', JSON.stringify(u));
      const bam = (mk: string) => cryptoMod.scryptSync(mk, u.password_salt, 64).toString('hex');
      assert(u.password_hash === bam(MK), 'Mật khẩu quản trị phải là mật khẩu đã cho (băm scrypt như accounts.ts)');
      assert(u.password_hash !== bam('pisa2026'), 'Không được là mật khẩu mặc định của bản demo');
      const vai = c.prepare('SELECT r.key, ur.branch_id FROM user_roles ur JOIN roles r ON r.id = ur.role_id WHERE ur.user_id = ?').all(r.userId) as any[];
      assert(vai.length === 1 && vai[0].key === 'system_admin' && vai[0].branch_id === null, JSON.stringify(vai));
      const dv = c.prepare('SELECT code, kind, branch_id FROM reporting_units ORDER BY seq').all() as any[];
      assert(JSON.stringify(dv.map((x) => `${x.code}:${x.kind}`)) === '["MB:branch","BC:branch","TUTOR:department"]', `Đơn vị báo cáo: ${JSON.stringify(dv)}`);
      /* Dữ liệu nền phải trùng bộ demo, từng dòng: so với napDuLieuNen (hàm seed.ts dùng) chạy trên một file tạm MỚI TINH.
         Không so với database kiểm thử đang chạy — các phép khác đã thêm vào đó (ví dụ lộ trình thử LT9). */
      const mau = moDbTam();
      try {
        mau.conn.exec(schemaSql);
        napDuLieuNen(mau.conn, 'mốc-khác');
        const khongGio = (conn: InstanceType<typeof Database>, b: string) => JSON.stringify(
          (conn.prepare(`SELECT * FROM "${b}" ORDER BY rowid`).all() as any[]).map(({ created_at: _bo, ...r }) => r));
        for (const b of ['permissions', 'roles', 'role_permissions', 'routes', 'programmes', 'programme_skills', 'programme_checkpoints']) {
          assert(dem(c, b) > 0 && khongGio(c, b) === khongGio(mau.conn, b), `Bảng nền ${b}: bản chính ${dem(c, b)} dòng, bộ demo ${dem(mau.conn, b)} dòng — nội dung phải giống hệt`);
        }
      } finally { dongLai(mau); }
      const seqHv = c.prepare('SELECT id, next_value FROM student_code_seq').all() as any[];
      assert(JSON.stringify(seqHv) === '[{"id":1,"next_value":1}]', `Bộ đếm mã học viên phải có sẵn (1, 1) — không có thì học viên thứ hai trùng mã: ${JSON.stringify(seqHv)}`);
    } finally { dongLai(o); }
  });

  check('PR-Z2 · init-ban-chinh KHÔNG tạo dữ liệu demo nào và KHÔNG đặt ngày demo: ngoài các bảng nền, MỌI bảng đều rỗng (kể cả demo_config)', () => {
    const o = moDbTam();
    try {
      initBanChinh(o.conn, O);
      const DUOC_CO_DONG = new Set(BANG_NEN_INIT);   // PR-DEPLOY (Q5): một danh sách với `kiem-sau-init`; demo_config kiểm CHÍNH XÁC ở dưới
      const sai = cacBang(o.conn).filter((b) => !DUOC_CO_DONG.has(b) && dem(o.conn, b) > 0).map((b) => `${b}=${dem(o.conn, b)}`);
      assert(sai.length === 0, `Bảng có dữ liệu không được phép: ${sai.join(', ')}`);
      /* PR-Z2c-b: demo_config chỉ được có đúng dòng dấu ngưỡng đạt lớp Normal (napDuLieuNen ghi — để migrate lần đầu không ghi
         audit "đổi luật" sai). Vẫn: không ngày demo, không kịch bản, không seeded_at. */
      /* PR-DEPLOY (DEP-1, DEP-2): thêm đúng hai khoá dấu — khoá backfill Lưu trữ + dấu DB mới (giá trị = giờ init). */
      const cauHinh = cacBang(o.conn).includes('demo_config') ? o.conn.prepare('SELECT key, value FROM demo_config ORDER BY key').all() as any[] : null;
      assert(JSON.stringify(cauHinh?.map((r) => r.key)) === '["khoi_tao_moi_at","normal_pass_threshold","xoa_du_lieu_backfill_at"]'
        && cauHinh!.find((r) => r.key === 'normal_pass_threshold').value === '0.7'
        && cauHinh!.filter((r) => r.key !== 'normal_pass_threshold').every((r) => r.value === O.now),
        `demo_config chỉ được có dấu ngưỡng 0.7 + hai khoá dấu: ${JSON.stringify(cauHinh)}`);
      assert(cacBang(o.conn).length === cacBang(t.conn).length, `Phải có đủ bảng như schema: ${cacBang(o.conn).length} / ${cacBang(t.conn).length}`);
    } finally { dongLai(o); }
  });

  check('Z2c-b · init-ban-chinh rồi `migrate` (nhánh Turso, như bản chính) → không bước "Ngưỡng đạt lớp Normal", không dòng audit đổi ngưỡng', () => {
    const o = moDbTam();
    try {
      initBanChinh(o.conn, O);
      o.conn.close();
      const f = pathMod.join(o.dir, 'x.sqlite');
      const r = cp.spawnSync(process.execPath,
        ['--input-type=module', '-e', `const m = await import(${JSON.stringify(migrateLibJs)}); console.log(JSON.stringify(m.migrate().applied));`], {
          env: { ...process.env, TURSO_DATABASE_URL: urlFile(f), TURSO_AUTH_TOKEN: 'x', BAN_CHINH: '', PISA_DB: '' }, encoding: 'utf8', timeout: 60_000,
        });
      assert(r.status === 0, `migrate lỗi: ${String(r.stderr).slice(-300)}`);
      assert(!/Ngưỡng đạt lớp Normal/.test(r.stdout), `migrate lần đầu vẫn chạy bước đổi ngưỡng: ${String(r.stdout).slice(-300)}`);
      o.conn = new Database(f);
      const audit = o.conn.prepare("SELECT COUNT(*) n FROM audit_logs WHERE action = 'rule.changed'").get() as any;
      assert(audit.n === 0, `Có ${audit.n} dòng audit "đổi luật" sai sự thật`);
    } finally { dongLai(o); }
  });

  check('PR-Z2 · init-ban-chinh TỪ CHỐI khi database đã có BẤT KỲ dữ liệu nào — và khi từ chối thì KHÔNG ghi gì (toàn bộ database giữ nguyên từng dòng, total_changes không đổi)', () => {
    const tinhHuong: [string, (c: InstanceType<typeof Database>) => void][] = [
      ['đã khởi tạo một lần (chạy nhầm lần hai)', (c) => initBanChinh(c, O)],
      ['chỉ có MỘT dòng ở một bảng không phải users (demo_config)', (c) => { c.exec(schemaSql); c.prepare("INSERT INTO demo_config (key, value) VALUES ('x', 'y')").run(); }],
      ['chỉ có một bảng lạ ngoài schema, có một dòng', (c) => { c.exec('CREATE TABLE ghi_chu (a TEXT); INSERT INTO ghi_chu VALUES (\'giữ tôi\')'); }],
      ['chỉ có một người dùng', (c) => { c.exec(schemaSql); c.prepare("INSERT INTO users (code, full_name, created_at) VALUES ('NV009', 'Người thật', '2026-09-01')").run(); }],
    ];
    for (const [ten, dung] of tinhHuong) {
      const o = moDbTam();
      try {
        dung(o.conn);
        const truoc = anhChup(o.conn);
        const ghiTruoc = soLanGhi(o.conn);
        assertThrows(() => initBanChinh(o.conn, { ...O, adminEmail: 'khac.pisa@gmail.com', chiNhanh: [{ code: 'UB', name: 'Uông Bí' }] }),
          /đã có dữ liệu/, `${ten}: phải từ chối`);
        assert(soLanGhi(o.conn) === ghiTruoc, `${ten}: đã có câu lệnh ghi (total_changes ${ghiTruoc} → ${soLanGhi(o.conn)})`);
        assert(anhChup(o.conn) === truoc, `${ten}: database đã bị thay đổi`);
        assert(!o.conn.inTransaction, `${ten}: còn treo giao dịch`);
      } finally { dongLai(o); }
    }
  });

  check('PR-Z2 · init-ban-chinh từ chối mật khẩu yếu, mật khẩu mặc định của bản demo, email sai đuôi, danh sách chi nhánh rỗng — database vẫn trống trơn', () => {
    const o = moDbTam();
    try {
      assertThrows(() => initBanChinh(o.conn, { ...O, adminPassword: '123' }), /ít nhất 6 ký tự/, 'Mật khẩu yếu (luật của accounts.ts)');
      assertThrows(() => initBanChinh(o.conn, { ...O, adminPassword: 'pisa2026' }), /mặc định/, 'Mật khẩu mặc định ai cũng biết');
      assertThrows(() => initBanChinh(o.conn, { ...O, adminEmail: 'quantri@gmail.com' }), /.pisa@gmail.com/, 'Email sai đuôi');
      assertThrows(() => initBanChinh(o.conn, { ...O, chiNhanh: [] }), /chi nhánh/i, 'Không có chi nhánh');
      assert(cacBang(o.conn).length === 0 && soLanGhi(o.conn) === 0, 'Từ chối thì không được tạo bảng hay ghi dòng nào');
    } finally { dongLai(o); }
  });

  check('PR-Z2 · init-ban-chinh là MỘT giao dịch: hỏng giữa chừng (schema lỗi ở câu cuối) thì không để lại bảng hay dòng nào', () => {
    const o = moDbTam();
    try {
      assertThrows(() => initBanChinh(o.conn, { ...O, schemaSql: schemaSql + '\nCREATE TABLE users (x);' }), /users/, 'Schema lỗi phải báo lỗi');
      assert(cacBang(o.conn).length === 0, `Còn sót bảng sau khi hỏng: ${cacBang(o.conn).slice(0, 5).join(', ')}`);
      assert(!o.conn.inTransaction, 'Còn treo giao dịch');
    } finally { dongLai(o); }
  });

  check('PR-Z2 · themChiNhanh thêm chi nhánh + đơn vị báo cáo; mã đã có thì TỪ CHỐI và không ghi gì; database chưa khởi tạo thì báo rõ', () => {
    const o = moDbTam();
    try {
      assertThrows(() => themChiNhanh(o.conn, { code: 'UB', name: 'Uông Bí' }, O.now), /init-ban-chinh/, 'Chưa khởi tạo phải chỉ đường');
      assert(cacBang(o.conn).length === 0, 'Chưa khởi tạo thì không được tạo gì');
      initBanChinh(o.conn, O);
      const id = themChiNhanh(o.conn, { code: 'ub', name: 'Uông Bí' }, O.now);
      const b = o.conn.prepare('SELECT * FROM branches WHERE id = ?').get(id) as any;
      assert(b.code === 'UB' && b.name === 'Uông Bí' && b.status === 'active', JSON.stringify(b));
      const u = o.conn.prepare("SELECT * FROM reporting_units WHERE code = 'UB'").get() as any;
      assert(u && u.branch_id === id && u.kind === 'branch', `Đơn vị báo cáo: ${JSON.stringify(u)}`);
      const truoc = anhChup(o.conn); const ghiTruoc = soLanGhi(o.conn);
      assertThrows(() => themChiNhanh(o.conn, { code: 'MB', name: 'Tên khác' }, O.now), /đã có/, 'Mã đã có phải từ chối');
      assertThrows(() => themChiNhanh(o.conn, { code: 'TUTOR', name: 'X' }, O.now), /TUTOR/, 'Mã TUTOR phải từ chối');
      assert(anhChup(o.conn) === truoc && soLanGhi(o.conn) === ghiTruoc, 'Từ chối thì không được đổi gì (tên chi nhánh MB giữ nguyên)');
    } finally { dongLai(o); }
  });

  /* LỆNH THẬT (`npm run init-ban-chinh`, `npm run them-chi-nhanh`) qua URL `file:` — đi đúng nhánh Turso của mã, không cần mạng. */
  const initJs = pathMod.join(REPO, 'dist-server/server/src/ops/runInit.js');
  const themJs = pathMod.join(REPO, 'dist-server/server/src/ops/themChiNhanh.js');
  const TOKEN_GIA = 'tok-bi-mat-khong-duoc-in-ra';
  const chayLenh = (js: string, env: Record<string, string>, args: string[] = []) => cp.spawnSync(process.execPath, [js, ...args], {
    env: { ...process.env, TURSO_DATABASE_URL: '', TURSO_AUTH_TOKEN: '', ADMIN_EMAIL: '', ADMIN_PASSWORD: '', CHI_NHANH: '', BAN_CHINH: '', ...env },
    encoding: 'utf8', timeout: 120_000,
  });
  const bamFile = (f: string) => cryptoMod.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
  check('PR-Z2 · Lệnh init-ban-chinh: thiếu biến nào thì in đúng tên biến đó và không tạo gì; chạy đúng thì in userId + chi nhánh, KHÔNG in token hay mật khẩu', () => {
    const dir = fs.mkdtempSync(pathMod.join(os.tmpdir(), 'z2-lenh-'));
    try {
      const f = pathMod.join(dir, 'chinh.sqlite');
      const thieu = chayLenh(initJs, { TURSO_DATABASE_URL: urlFile(f), TURSO_AUTH_TOKEN: TOKEN_GIA, ADMIN_PASSWORD: MK });
      assert(thieu.status === 1 && /ADMIN_EMAIL/.test(thieu.stderr) && /CHI_NHANH/.test(thieu.stderr), `Thiếu biến: mã ${thieu.status}; ${String(thieu.stderr).slice(-300)}`);
      assert(!fs.existsSync(f), 'Thiếu biến thì không được mở/tạo database');
      const r = chayLenh(initJs, { TURSO_DATABASE_URL: urlFile(f), TURSO_AUTH_TOKEN: TOKEN_GIA, ADMIN_EMAIL: 'quantri.pisa@gmail.com', ADMIN_PASSWORD: MK, CHI_NHANH: 'MB=Monbay;BC=Bãi Cháy' });
      const ra = String(r.stdout) + String(r.stderr);
      assert(r.status === 0, `Mã thoát ${r.status}: ${ra.slice(-400)}`);
      assert(/Sẽ khởi tạo database file:/.test(r.stdout) && /userId 1/.test(r.stdout) && /MB/.test(r.stdout) && /Bãi Cháy/.test(r.stdout), `Kết quả in ra: ${String(r.stdout).slice(-400)}`);
      assert(/Đích: .*KHÔNG RÕ/.test(r.stdout), `Phải in rõ đích là database loại nào trước khi chạy: ${String(r.stdout).slice(0, 400)}`);
      assert(!ra.includes(TOKEN_GIA) && !ra.includes(MK), 'Lệnh in lộ token hoặc mật khẩu');
      /* PowerShell trong ngoặc kép nuốt `$…` — "QuangNinh$2026abc" thành "QuangNinh" (đã thử 22/09). In độ dài để người gõ thấy ngay. */
      assert(new RegExp(`mật khẩu quản trị dài ${MK.length} ký tự`).test(r.stdout), `Phải in độ dài mật khẩu đã lưu: ${String(r.stdout).slice(-300)}`);
      const c = new Database(f);
      try { assert(dem(c, 'users') === 1 && dem(c, 'branches') === 2, 'Database sau lệnh init phải có 1 người dùng, 2 chi nhánh'); } finally { c.close(); }
    } finally { xoaThuMucTam(dir); }
  });
  check('PR-Z2 · Lệnh init-ban-chinh chạy nhầm lần hai: TỪ CHỐI, và file database giữ nguyên TỪNG BYTE', () => {
    const dir = fs.mkdtempSync(pathMod.join(os.tmpdir(), 'z2-lenh-'));
    try {
      const f = pathMod.join(dir, 'chinh.sqlite');
      const env = { TURSO_DATABASE_URL: urlFile(f), TURSO_AUTH_TOKEN: TOKEN_GIA, ADMIN_EMAIL: 'quantri.pisa@gmail.com', ADMIN_PASSWORD: MK, CHI_NHANH: 'MB=Monbay' };
      assert(chayLenh(initJs, env).status === 0, 'Lần một phải chạy được');
      const bam = bamFile(f);
      const r = chayLenh(initJs, { ...env, ADMIN_EMAIL: 'khac.pisa@gmail.com', CHI_NHANH: 'UB=Uông Bí' });
      assert(r.status === 1 && /TỪ CHỐI/.test(r.stderr) && /đã có dữ liệu/.test(r.stderr), `Lần hai: mã ${r.status}; ${String(r.stderr).slice(-300)}`);
      assert(bamFile(f) === bam, 'File database đã bị thay đổi dù lệnh từ chối');
    } finally { xoaThuMucTam(dir); }
  });
  check('PR-Z2 · Lệnh init-ban-chinh không có biến Turso (máy dev) → từ chối, không đụng database máy dev', () => {
    const r = chayLenh(initJs, { ADMIN_EMAIL: 'quantri.pisa@gmail.com', ADMIN_PASSWORD: MK, CHI_NHANH: 'MB=Monbay' });
    assert(r.status === 1 && /TURSO_DATABASE_URL/.test(r.stderr), `Mã ${r.status}; ${String(r.stderr).slice(-300)}`);
  });
  check('PR-Z2 · Lệnh them-chi-nhanh: `MÃ "Tên"` thêm được (tên có dấu, có khoảng trắng); mã đã có → TỪ CHỐI, file giữ nguyên từng byte', () => {
    const dir = fs.mkdtempSync(pathMod.join(os.tmpdir(), 'z2-lenh-'));
    try {
      const f = pathMod.join(dir, 'chinh.sqlite');
      const env = { TURSO_DATABASE_URL: urlFile(f), TURSO_AUTH_TOKEN: TOKEN_GIA };
      assert(chayLenh(initJs, { ...env, ADMIN_EMAIL: 'quantri.pisa@gmail.com', ADMIN_PASSWORD: MK, CHI_NHANH: 'MB=Monbay' }).status === 0, 'init phải chạy được');
      const r = chayLenh(themJs, env, ['UB', 'Uông Bí']);
      assert(r.status === 0 && /UB/.test(r.stdout), `Thêm UB: mã ${r.status}; ${String(r.stdout).slice(-200)} ${String(r.stderr).slice(-200)}`);
      assert(!(String(r.stdout) + String(r.stderr)).includes(TOKEN_GIA), 'Lệnh in lộ token');
      const c = new Database(f);
      try {
        const b = c.prepare("SELECT name FROM branches WHERE code = 'UB'").get() as any;
        assert(b?.name === 'Uông Bí', `Tên chi nhánh lưu sai: ${JSON.stringify(b)}`);
      } finally { c.close(); }
      const bam = bamFile(f);
      const r2 = chayLenh(themJs, env, ['MB', 'Tên khác']);
      assert(r2.status === 1 && /TỪ CHỐI/.test(r2.stderr), `Mã đã có: mã ${r2.status}; ${String(r2.stderr).slice(-200)}`);
      assert(bamFile(f) === bam, 'File database đã bị thay đổi dù lệnh từ chối');
      const r3 = chayLenh(themJs, env, []);
      assert(r3.status === 1 && /them-chi-nhanh/.test(r3.stderr), 'Thiếu tham số phải chỉ cách gõ');
    } finally { xoaThuMucTam(dir); }
  });
  check('PR-Z2 · Tên chi nhánh có dấu ^ hoặc " bị TỪ CHỐI (dấu vết thoát ký tự của npm/cmd trên Windows) — không bao giờ lưu tên hỏng', () => {
    assertThrows(() => docDanhSachChiNhanh('UB=^Uông^ Bí^'), /\^/, 'Tên có ^ phải báo lỗi');
    assertThrows(() => docDanhSachChiNhanh('UB="Uông Bí"'), /"/, 'Tên có " phải báo lỗi');
  });
  check('PR-Z2 · `npm run them-chi-nhanh -- UB "Uông Bí"` trên Windows: lệnh trong package.json phải BẮT ĐẦU bằng node — bắt đầu bằng npm (tệp .cmd) thì npm thoát kép tham số, tên thành "^Uông^ Bí^" (đã tái hiện 22/09)', () => {
    const lenh = String(JSON.parse(fs.readFileSync(pathMod.join(REPO, 'package.json'), 'utf8')).scripts['them-chi-nhanh'] ?? '');
    assert(/^node /.test(lenh) && /themChiNhanh\.js$/.test(lenh), `package.json "them-chi-nhanh" = ${lenh}`);
  });

  console.log('\nPR-Z2 · 6. Sao lưu (sao-luu) — nguồn chỉ được ĐỌC; bản sao mở lại được, đúng từng dòng');
  const { saoLuu, giuBanMoiNhat, tenBanSaoLuu, saoLuuRaFile, saoLuuTep } = await import('../ops/saoLuu.ts');
  const DEFAULT_ADMIN_PASSWORD_DEMO = (await import('../platform/accounts.ts')).DEFAULT_ADMIN_PASSWORD;
  /** Nội dung một bảng, không phụ thuộc thứ tự dòng; BLOB (libsql trả ArrayBuffer) đổi ra hex để so được. */
  const noiDungBang = (conn: InstanceType<typeof Database>, b: string) => JSON.stringify(
    (conn.prepare(`SELECT * FROM "${b}"`).all() as any[])
      .map((r) => JSON.stringify(Object.entries(r).filter(([k]) => k !== '_metadata')
        .map(([k, v]) => [k, v instanceof ArrayBuffer ? 'hex:' + Buffer.from(v).toString('hex') : v])))
      .sort());
  const cauTrucDb = (conn: InstanceType<typeof Database>) => JSON.stringify(
    conn.prepare("SELECT type, name, tbl_name, sql FROM sqlite_master WHERE name NOT LIKE 'sqlite_%' ORDER BY type, name").all());
  /** Mọi bảng của `a` có trong `b` với ĐÚNG số dòng và đúng nội dung; cấu trúc (bảng, chỉ mục) giống hệt. */
  /** Bảng phiên đăng nhập: bản sao lưu/khôi phục luôn RỖNG CÓ CHỦ ĐÍCH (chủ sản phẩm chốt 22/09 — không chép mã đăng nhập). */
  const BANG_PHIEN = 'demo_sessions';
  /**
   * TÍNH CHẤT (c), sửa 22/09: cấu trúc giống hệt; mọi bảng đúng số dòng và đúng từng dòng như nguồn, TRỪ bảng phiên đăng
   * nhập luôn rỗng có chủ đích.
   */
  const soHaiDb = (a: InstanceType<typeof Database>, b: InstanceType<typeof Database>, nhan: string) => {
    assert(cauTrucDb(a) === cauTrucDb(b), `${nhan}: cấu trúc (bảng/chỉ mục) khác nguồn`);
    for (const bg of cacBang(a)) {
      if (bg === BANG_PHIEN) { assert(dem(b, bg) === 0, `${nhan} · bảng ${bg} phải RỖNG (không chép mã đăng nhập), có ${dem(b, bg)} dòng`); continue; }
      assert(dem(a, bg) === dem(b, bg), `${nhan} · bảng ${bg}: nguồn ${dem(a, bg)} dòng, bản sao ${dem(b, bg)} dòng`);
      assert(noiDungBang(a, bg) === noiDungBang(b, bg), `${nhan} · bảng ${bg}: cùng số dòng nhưng nội dung khác`);
    }
  };
  const { createSession: taoPhien } = await import('../auth.ts');

  check('PR-Z2 · saoLuu chép database kiểm thử ra file mới: file ĐÓNG rồi MỞ LẠI được, toàn vẹn, mọi bảng đúng số dòng và đúng từng dòng (TRỪ bảng phiên đăng nhập, luôn rỗng có chủ đích); nguồn KHÔNG bị ghi câu nào', () => {
    const dir = fs.mkdtempSync(pathMod.join(os.tmpdir(), 'z2-bk-'));
    const f = pathMod.join(dir, 'bk.sqlite');
    try {
      const nguon = db();
      taoPhien(t.admin.userId);                       // nguồn chắc chắn có ít nhất một phiên đăng nhập
      assert(dem(nguon, BANG_PHIEN) >= 1, 'Nguồn phải có phiên đăng nhập để phép này có nghĩa');
      const ghiTruoc = soLanGhi(nguon);
      const dich = new Database(f);
      const r = saoLuu(nguon, dich);
      dich.close();
      assert(soLanGhi(nguon) === ghiTruoc, `saoLuu đã GHI vào nguồn (total_changes ${ghiTruoc} → ${soLanGhi(nguon)})`);
      assert(r.bang === cacBang(nguon).length, `Chép ${r.bang}/${cacBang(nguon).length} bảng`);
      assert(r.dong === cacBang(nguon).filter((b) => b !== BANG_PHIEN).reduce((s, b) => s + dem(nguon, b), 0), `Số dòng báo cáo ${r.dong} không khớp nguồn`);
      const moLai = new Database(f);
      try {
        assert((moLai.prepare('PRAGMA integrity_check').get() as any).integrity_check === 'ok', 'integrity_check của bản sao không ok');
        soHaiDb(nguon, moLai, 'Bản sao');
        assert(cacBang(moLai).includes(BANG_PHIEN) && dem(moLai, BANG_PHIEN) === 0, 'Bảng phiên phải CÓ trong bản sao (giữ cấu trúc) và rỗng');
        assert(dem(moLai, 'users') > 0 && dem(moLai, 'students') > 0, 'Bản sao của bộ demo phải có người dùng và học viên');
      } finally { moLai.close(); }
    } finally { xoaThuMucTam(dir); }
  });
  check('PR-Z2 · Bản sao lưu dùng được bằng CHÍNH mã hiện tại: tiến trình mở nó làm database (PISA_DB) thấy đủ học viên và đăng nhập được', () => {
    const dir = fs.mkdtempSync(pathMod.join(os.tmpdir(), 'z2-bk-'));
    const f = pathMod.join(dir, 'bk.sqlite');
    try {
      const dich = new Database(f);
      saoLuu(db(), dich);
      dich.close();
      /* Một tài khoản chắc chắn còn mật khẩu mặc định của bộ demo (phép khác có thể đã đổi mật khẩu vài người). */
      const tk = (db().prepare('SELECT email, password_hash h, password_salt s FROM users WHERE email IS NOT NULL ORDER BY id').all() as any[])
        .find((u) => u.h === cryptoMod.scryptSync(DEFAULT_ADMIN_PASSWORD_DEMO, u.s, 64).toString('hex'))?.email as string;
      assert(tk, 'Bộ demo phải còn một tài khoản dùng mật khẩu mặc định');
      const accJs = (pathToFileURL(pathMod.join(REPO, 'dist-server/server/src/platform/accounts.js'))).href;
      const r = chayCon(`const d = await import(${JSON.stringify(dbJs)}); const a = await import(${JSON.stringify(accJs)});`
        + ` console.log(JSON.stringify({ khoiTao: d.isInitialised(), hv: d.db().prepare('SELECT COUNT(*) n FROM students').get().n,`
        + ` dangNhap: a.login(${JSON.stringify(tk)}, ${JSON.stringify(DEFAULT_ADMIN_PASSWORD_DEMO)}).userId }));`,
      { PISA_DB: f, TURSO_DATABASE_URL: '', TURSO_AUTH_TOKEN: '' });
      assert(r.status === 0, `Mở bản sao bằng mã hiện tại lỗi: ${String(r.stderr).slice(-300)}`);
      const o = JSON.parse(String(r.stdout).trim().split('\n').pop()!);
      assert(o.khoiTao === true && o.hv === dem(db(), 'students') && o.dangNhap > 0, `Nhận ${JSON.stringify(o)}`);
    } finally { xoaThuMucTam(dir); }
  });
  check('PR-Z2 · saoLuu đọc nguồn TRONG MỘT GIAO DỊCH ĐỌC (mọi bảng cùng một thời điểm) và kết thúc giao dịch đó', () => {
    const o = moDbTam();
    try {
      o.conn.exec("CREATE TABLE users (id INTEGER PRIMARY KEY); INSERT INTO users VALUES (1); CREATE TABLE b (x); INSERT INTO b VALUES ('a')");
      const trongGiaoDich: boolean[] = [];
      const nguon = new Proxy(o.conn, {
        get(dich, khoa) {
          if (khoa === 'prepare') {
            return (sql: string) => { if (/^SELECT \* FROM/.test(sql)) trongGiaoDich.push(dich.inTransaction); return dich.prepare(sql); };
          }
          const v = (dich as any)[khoa];
          return typeof v === 'function' ? v.bind(dich) : v;
        },
      });
      const boNho = new Database(':memory:');
      try { saoLuu(nguon, boNho); } finally { boNho.close(); }
      assert(trongGiaoDich.length === 2 && trongGiaoDich.every(Boolean), `Đọc bảng ngoài giao dịch: ${JSON.stringify(trongGiaoDich)}`);
      assert(!o.conn.inTransaction, 'Giao dịch đọc của nguồn còn treo sau khi sao lưu');
    } finally { dongLai(o); }
  });
  check('PR-Z2 · saoLuu giữ nguyên số nguyên lớn (> 2^53, gần -2^63) và kiểu INTEGER ở cột không khai kiểu', () => {
    const o = moDbTam();
    const boNho = new Database(':memory:');
    try {
      o.conn.exec('CREATE TABLE so (id INTEGER PRIMARY KEY, a INTEGER, b); INSERT INTO so (a, b) VALUES (9007199254740993, 5), (-9223372036854775807, 9007199254740993)');
      saoLuu(o.conn, boNho);
      const doc = (c: InstanceType<typeof Database>) => JSON.stringify(c.prepare('SELECT CAST(a AS TEXT) a, typeof(a) ta, CAST(b AS TEXT) b, typeof(b) tb FROM so ORDER BY id').all()
        .map(({ _metadata: _bo, ...r }: any) => r));
      assert(doc(boNho) === doc(o.conn), `Nguồn ${doc(o.conn)} · bản sao ${doc(boNho)}`);
    } finally { boNho.close(); dongLai(o); }
  });
  check('PR-Z2 · Bảng tên bắt đầu bằng "sqlite" (không phải bảng nội bộ sqlite_…) vẫn được sao lưu và vẫn chặn init-ban-chinh', () => {
    const o = moDbTam();
    const boNho = new Database(':memory:');
    try {
      o.conn.exec("CREATE TABLE sqliteish (a TEXT); INSERT INTO sqliteish VALUES ('dữ liệu thật')");
      saoLuu(o.conn, boNho);
      assert(!!boNho.prepare("SELECT 1 FROM sqlite_master WHERE name = 'sqliteish'").get(), 'Bảng sqliteish bị bỏ sót khi sao lưu');
      assertThrows(() => initBanChinh(o.conn, O), /đã có dữ liệu/, 'init-ban-chinh bỏ qua dữ liệu trong bảng sqliteish');
    } finally { boNho.close(); dongLai(o); }
  });
  check('PR-Z2 · saoLuu TỪ CHỐI chép vào một database đích không rỗng — không bao giờ ghi đè', () => {
    const o = moDbTam();
    try {
      o.conn.exec("CREATE TABLE cu (a TEXT); INSERT INTO cu VALUES ('bản cũ')");
      const truoc = anhChup(o.conn);
      assertThrows(() => saoLuu(db(), o.conn), /không rỗng/, 'Đích có dữ liệu phải bị từ chối');
      assert(anhChup(o.conn) === truoc, 'Đích đã bị thay đổi');
    } finally { dongLai(o); }
  });
  check('PR-Z2 · saoLuuRaFile: file đích ĐÃ CÓ (cùng phút) → TỪ CHỐI, file cũ giữ nguyên từng byte; hỏng giữa chừng không để lại file dở', () => {
    const dir = fs.mkdtempSync(pathMod.join(os.tmpdir(), 'z2-bk-'));
    try {
      const f = pathMod.join(dir, 'pisa-2026-09-22-1000.sqlite');
      fs.writeFileSync(f, 'bản sao lưu cũ — không được ghi đè');
      const bam = bamFile(f);
      assertThrows(() => saoLuuRaFile(db(), f), /Đã có file/, 'Tên đã có phải từ chối');
      assert(bamFile(f) === bam, 'File sao lưu cũ đã bị ghi đè');
      const f2 = pathMod.join(dir, 'pisa-2026-09-22-1001.sqlite');
      const nguonHong = new Database(':memory:');
      nguonHong.exec("CREATE TABLE users (id INTEGER PRIMARY KEY)");        // không có người dùng → kiểm sau khi chép phải hỏng
      try { assertThrows(() => saoLuuRaFile(nguonHong, f2), /người dùng/, 'Bản sao không có người dùng phải bị coi là hỏng'); } finally { nguonHong.close(); }
      assert(JSON.stringify(fs.readdirSync(dir)) === JSON.stringify(['pisa-2026-09-22-1000.sqlite']), `Còn sót file dở: ${JSON.stringify(fs.readdirSync(dir))}`);
    } finally { xoaThuMucTam(dir); }
  });
  check('PR-Z2 · saoLuuRaFile ghi qua file TẠM (tên không bao giờ bị coi là bản sao lưu): xong thì chỉ còn file thật; file tạm của lần trước còn đó → TỪ CHỐI, không đụng nó', () => {
    const dir = fs.mkdtempSync(pathMod.join(os.tmpdir(), 'z2-bk-'));
    try {
      const f = pathMod.join(dir, 'pisa-cuc-bo-2026-09-22-1000.sqlite');
      saoLuuRaFile(db(), f);
      assert(JSON.stringify(fs.readdirSync(dir)) === JSON.stringify(['pisa-cuc-bo-2026-09-22-1000.sqlite']), `Còn file thừa: ${JSON.stringify(fs.readdirSync(dir))}`);
      const f2 = pathMod.join(dir, 'pisa-cuc-bo-2026-09-22-1001.sqlite');
      fs.writeFileSync(`${f2}.dang-ghi`, 'dở của lần trước');
      assertThrows(() => saoLuuRaFile(db(), f2), /dang-ghi/, 'File tạm còn đó phải từ chối');
      assert(!fs.existsSync(f2) && fs.readFileSync(`${f2}.dang-ghi`, 'utf8') === 'dở của lần trước', 'Không được tạo file thật hay đụng file tạm cũ');
    } finally { xoaThuMucTam(dir); }
  });
  check('PR-Z2 · Tên bản sao lưu theo GIỜ VIỆT NAM và ghi rõ CỦA DATABASE NÀO: pisa-<tên máy chủ>-NĂM-THÁNG-NGÀY-GIỜPHÚT', () => {
    const luc = new Date('2026-09-21T17:05:00Z');
    assert(tenBanSaoLuu(luc) === 'pisa-2026-09-22-0005', tenBanSaoLuu(luc));
    assert(tenBanSaoLuu(luc, 'pisatracking-pizi147') === 'pisa-pisatracking-pizi147-2026-09-22-0005', tenBanSaoLuu(luc, 'pisatracking-pizi147'));
  });
  check('PR-Z2 · Giữ 14 bản theo TỪNG database: bản của database khác (bản thử, máy dev) không đẩy bản của bản chính ra ngoài', () => {
    const dir = fs.mkdtempSync(pathMod.join(os.tmpdir(), 'z2-keep-'));
    try {
      for (let i = 1; i <= 16; i++) fs.writeFileSync(pathMod.join(dir, `pisa-pisatracking-pizi147-2026-09-${String(i).padStart(2, '0')}-0000.sqlite`), 'x');
      const khac = ['pisa-pisatracking-demo-pizi147-2026-09-30-0000.sqlite', 'pisa-cuc-bo-2026-09-30-0000.sqlite', 'pisa-2026-09-30-0000.sqlite'];
      for (const f of khac) fs.writeFileSync(pathMod.join(dir, f), 'bản của database khác — mới hơn');
      const xoa = giuBanMoiNhat(dir, 14, { tienTo: 'pisatracking-pizi147' });
      assert(JSON.stringify(xoa) === JSON.stringify(['pisa-pisatracking-pizi147-2026-09-02-0000.sqlite', 'pisa-pisatracking-pizi147-2026-09-01-0000.sqlite']),
        `Chỉ được xoá 2 bản cũ nhất CỦA bản chính: ${JSON.stringify(xoa)}`);
      assert(khac.every((f) => fs.existsSync(pathMod.join(dir, f))), 'Đã xoá bản của database khác');
    } finally { xoaThuMucTam(dir); }
  });
  check('PR-Z2 · Giữ đúng 14 bản mới nhất, xoá bản cũ hơn KÈM thư mục tệp của nó; không đụng file khác; không bao giờ xoá bản vừa tạo', () => {
    const dir = fs.mkdtempSync(pathMod.join(os.tmpdir(), 'z2-keep-'));
    try {
      for (let i = 1; i <= 16; i++) fs.writeFileSync(pathMod.join(dir, `pisa-2026-09-${String(i).padStart(2, '0')}-0000.sqlite`), 'x');
      fs.mkdirSync(pathMod.join(dir, 'pisa-2026-09-01-0000-tep', 'violation'), { recursive: true });
      fs.writeFileSync(pathMod.join(dir, 'pisa-2026-09-01-0000-tep', 'violation', 'a.pdf'), 'a');
      fs.mkdirSync(pathMod.join(dir, 'pisa-2026-09-16-0000-tep'));
      for (const khac of ['ghi-chu.txt', 'pisa-khac.sqlite', 'pisa-2026-08-01-0000.sqlite.bak']) fs.writeFileSync(pathMod.join(dir, khac), 'giữ');
      const xoa = giuBanMoiNhat(dir, 14);
      assert(xoa.length === 2 && xoa.every((f) => /09-0[12]-/.test(f)), JSON.stringify(xoa));
      const con = fs.readdirSync(dir);
      assert(con.filter((f) => /^pisa-\d{4}-\d{2}-\d{2}-\d{4}\.sqlite$/.test(f)).length === 14, 'Phải còn 14 bản');
      assert(!con.includes('pisa-2026-09-01-0000-tep') && con.includes('pisa-2026-09-16-0000-tep'), 'Thư mục tệp đi theo bản của nó');
      assert(['ghi-chu.txt', 'pisa-khac.sqlite', 'pisa-2026-08-01-0000.sqlite.bak'].every((f) => con.includes(f)), 'Đã xoá file không phải bản sao lưu');
      const giu = giuBanMoiNhat(dir, 1, { giuLai: 'pisa-2026-09-03-0000.sqlite' });
      assert(fs.existsSync(pathMod.join(dir, 'pisa-2026-09-03-0000.sqlite')) && !giu.includes('pisa-2026-09-03-0000.sqlite'), 'Xoá mất bản vừa tạo');
    } finally { xoaThuMucTam(dir); }
  });
  await checkAsync('PR-Z2 · saoLuuTep tải MỌI tệp của kho Blobs (kiểu siteID + token, như lệnh sao lưu) ra thư mục, đúng từng byte, giữ đường dẫn khoá', async () => {
    const { BlobsServer } = await import('@netlify/blobs/server');
    const { getStore } = await import('@netlify/blobs');
    const dir = fs.mkdtempSync(pathMod.join(os.tmpdir(), 'z2-bk-tep-'));
    const mayBlobs = new BlobsServer({ directory: pathMod.join(dir, 'may'), token: 'tok' });
    const { port } = await mayBlobs.start();
    try {
      const kho = getStore({ name: 'bang-chung-thu', siteID: 'site-thu', token: 'tok', apiURL: `http://localhost:${port}` });
      const tep: [string, Buffer][] = [['violation/a.pdf', Buffer.from([0, 1, 2, 255])], ['sos_case/b.png', Buffer.from('anh')], ['discipline_measure/c.mp4', Buffer.alloc(3000, 7)]];
      for (const [k, d] of tep) await kho.set(k, new Uint8Array(d).buffer);
      const r = await saoLuuTep(kho, pathMod.join(dir, 'ra'));
      assert(r.tep === 3 && r.byte === 4 + 3 + 3000, `Báo ${JSON.stringify(r)}`);
      for (const [k, d] of tep) assert(fs.readFileSync(pathMod.join(dir, 'ra', ...k.split('/'))).equals(d), `Tệp ${k} sai nội dung`);
    } finally {
      await mayBlobs.stop();
      xoaThuMucTam(dir);
    }
  });

  /* LỆNH THẬT `npm run sao-luu` (tiến trình con, URL file: = nhánh Turso, không mạng). Chạy KHÔNG đồng bộ để máy chủ Blobs cục bộ trong tiến trình này còn trả lời được. */
  const saoLuuJs = pathMod.join(REPO, 'dist-server/server/src/ops/runSaoLuu.js');
  const chayLenhNen = (env: Record<string, string>) => new Promise<{ status: number | null; stdout: string; stderr: string }>((xong) => {
    const con = cp.spawn(process.execPath, [saoLuuJs], {
      env: { ...process.env, TURSO_DATABASE_URL: '', TURSO_AUTH_TOKEN: '', BACKUP_DIR: '', NETLIFY_SITE_ID: '', NETLIFY_AUTH_TOKEN: '', NETLIFY_BLOBS_CONTEXT: '', BAN_CHINH: '', ...env },
    });
    let stdout = '', stderr = '';
    con.stdout.on('data', (d) => { stdout += d; }); con.stderr.on('data', (d) => { stderr += d; });
    con.on('close', (status) => xong({ status, stdout, stderr }));
  });
  const dungNguon = (dir: string) => {
    const f = pathMod.join(dir, 'nguon.sqlite');
    const c = new Database(f);
    try { initBanChinh(c, O); } finally { c.close(); }
    return f;
  };
  await checkAsync('PR-Z2 · Lệnh sao-luu từ "Turso": thiếu BACKUP_DIR → từ chối; có → đúng một file pisa-…sqlite mở lại được, đúng số dòng; nguồn giữ nguyên TỪNG BYTE; không in token', async () => {
    const dir = fs.mkdtempSync(pathMod.join(os.tmpdir(), 'z2-lenh-bk-'));
    try {
      const nguon = dungNguon(dir);
      const bamNguon = bamFile(nguon);
      const thieu = await chayLenhNen({ TURSO_DATABASE_URL: urlFile(nguon), TURSO_AUTH_TOKEN: TOKEN_GIA });
      assert(thieu.status === 1 && /BACKUP_DIR/.test(thieu.stderr), `Thiếu BACKUP_DIR: mã ${thieu.status}; ${thieu.stderr.slice(-200)}`);
      const bk = pathMod.join(dir, 'sao-luu');
      const r = await chayLenhNen({ TURSO_DATABASE_URL: urlFile(nguon), TURSO_AUTH_TOKEN: TOKEN_GIA, BACKUP_DIR: bk });
      assert(r.status === 0, `Mã ${r.status}: ${(r.stdout + r.stderr).slice(-400)}`);
      assert(!(r.stdout + r.stderr).includes(TOKEN_GIA), 'Lệnh in lộ token');
      assert(/Chưa sao lưu tệp bằng chứng/.test(r.stdout), 'Thiếu hai biến Netlify thì phải nhắc chưa sao lưu tệp');
      assert(/Xong\. Bản sao lưu của database file:/.test(r.stdout), `Dòng Xong phải nói bản sao lưu của database nào: ${r.stdout.slice(-300)}`);
      const ra = fs.readdirSync(bk);
      /* URL file: không có tên máy chủ → tiền tố "cuc-bo", như kho tệp. */
      assert(ra.length === 1 && /^pisa-cuc-bo-\d{4}-\d{2}-\d{2}-\d{4}\.sqlite$/.test(ra[0]), `Thư mục sao lưu: ${JSON.stringify(ra)}`);
      assert(bamFile(nguon) === bamNguon, 'Lệnh sao lưu đã làm thay đổi file nguồn');
      const a = new Database(nguon, { readonly: true }); const b = new Database(pathMod.join(bk, ra[0]), { readonly: true });
      try { soHaiDb(a, b, 'Lệnh sao-luu'); } finally { a.close(); b.close(); }
    } finally { xoaThuMucTam(dir); }
  });
  /*
   * KHÔNG đặt NETLIFY_SITE_ID/NETLIFY_AUTH_TOKEN cho lệnh thật trong phép kiểm: có hai biến đó thì @netlify/blobs luôn gọi API
   * THẬT của Netlify (bỏ qua mọi biến ngữ cảnh — đã thử 22/09), tức phép kiểm sẽ ra mạng. Đường tải tệp được kiểm ở
   * `saoLuuTep` phía trên (máy chủ Blobs cục bộ, đúng kiểu siteID + token).
   */
  await checkAsync('PR-Z2 · Lệnh sao-luu giữ đúng 14 bản mới nhất CỦA database đó: xoá bản cũ nhất của nó, giữ bản vừa tạo, không đụng bản của database khác hay file khác', async () => {
    const dir = fs.mkdtempSync(pathMod.join(os.tmpdir(), 'z2-lenh-bk-'));
    try {
      const nguon = dungNguon(dir);
      const bk = pathMod.join(dir, 'sao-luu');
      fs.mkdirSync(bk);
      for (let i = 1; i <= 14; i++) fs.writeFileSync(pathMod.join(bk, `pisa-cuc-bo-2026-01-${String(i).padStart(2, '0')}-0000.sqlite`), 'cũ');
      const giuNguyen = ['ghi-chu-cua-toi.txt', 'pisa-pisatracking-pizi147-2025-12-01-0000.sqlite', 'pisa-2025-12-01-0000.sqlite'];
      for (const f of giuNguyen) fs.writeFileSync(pathMod.join(bk, f), 'giữ');
      const r = await chayLenhNen({ TURSO_DATABASE_URL: urlFile(nguon), TURSO_AUTH_TOKEN: TOKEN_GIA, BACKUP_DIR: bk });
      assert(r.status === 0, `Mã ${r.status}; stdout: ${r.stdout.slice(-300)}; stderr: ${r.stderr.slice(-500)}`);
      const con = fs.readdirSync(bk);
      const cuaNo = con.filter((f) => /^pisa-cuc-bo-\d{4}-\d{2}-\d{2}-\d{4}\.sqlite$/.test(f));
      assert(cuaNo.filter((f) => !f.startsWith('pisa-cuc-bo-2026-01-')).length === 1, `Phải có đúng một bản mới: ${JSON.stringify(con)}`);
      assert(cuaNo.length === 14 && !con.includes('pisa-cuc-bo-2026-01-01-0000.sqlite') && con.includes('pisa-cuc-bo-2026-01-02-0000.sqlite'),
        `Phải giữ đúng 14 bản (chỉ xoá bản cũ nhất): ${JSON.stringify(con)}`);
      assert(giuNguyen.every((f) => con.includes(f)) && /pisa-cuc-bo-2026-01-01-0000\.sqlite/.test(r.stdout), 'Không được đụng file khác; phải báo đã xoá bản nào');
    } finally { xoaThuMucTam(dir); }
  });
  await checkAsync('PR-Z2 · Lệnh sao-luu: dọn bản cũ hỏng (file đang bị giữ, Drive đang đồng bộ) KHÔNG làm hỏng bản sao lưu vừa tạo — báo cảnh báo, vẫn "Xong"', async () => {
    const dir = fs.mkdtempSync(pathMod.join(os.tmpdir(), 'z2-lenh-bk-'));
    const nguon = dungNguon(dir);
    const bk = pathMod.join(dir, 'sao-luu');
    fs.mkdirSync(bk);
    for (let i = 1; i <= 14; i++) saoLuuRaFile(db(), pathMod.join(bk, `pisa-cuc-bo-2026-01-${String(i).padStart(2, '0')}-0000.sqlite`));
    /* Giữ bản cũ nhất: trên Windows, libsql đã prepare thì không nhả file → tiến trình khác xoá nó sẽ bị EPERM/EBUSY. */
    const giu = new Database(pathMod.join(bk, 'pisa-cuc-bo-2026-01-01-0000.sqlite'));
    giu.prepare('SELECT COUNT(*) n FROM users').get();
    try {
      const r = await chayLenhNen({ TURSO_DATABASE_URL: urlFile(nguon), TURSO_AUTH_TOKEN: TOKEN_GIA, BACKUP_DIR: bk });
      assert(r.status === 0 && /\[sao-luu\] Xong\./.test(r.stdout), `Mã ${r.status}; stdout: ${r.stdout.slice(-300)}; stderr: ${r.stderr.slice(-400)}`);
      const moi = fs.readdirSync(bk).filter((f) => /^pisa-cuc-bo-\d{4}/.test(f) && !f.startsWith('pisa-cuc-bo-2026-01-'));
      assert(moi.length === 1, `Bản mới phải còn nguyên: ${JSON.stringify(fs.readdirSync(bk))}`);
    } finally {
      giu.close();
      xoaThuMucTam(dir);
    }
  });
  await checkAsync('PR-Z2 · Lệnh sao-luu có BACKUP_DIR mà KHÔNG có biến Turso → TỪ CHỐI (không lặng lẽ sao lưu database máy dev vào thư mục bản chính)', async () => {
    const dir = fs.mkdtempSync(pathMod.join(os.tmpdir(), 'z2-lenh-bk-'));
    try {
      const bk = pathMod.join(dir, 'sao-luu');
      const r = await chayLenhNen({ BACKUP_DIR: bk });
      assert(r.status === 1 && /TURSO_DATABASE_URL/.test(r.stderr), `Mã ${r.status}; ${r.stderr.slice(-300)}`);
      assert(!fs.existsSync(bk), 'Từ chối thì không được tạo gì trong BACKUP_DIR');
    } finally { xoaThuMucTam(dir); }
  });

  console.log('\nPR-Z2 · 7. Khôi phục (khoi-phuc) — chỉ ghi vào database RỖNG; đúng từng dòng như bản sao lưu');
  const { khoiPhuc, thuTuKhoaNgoai } = await import('../ops/khoiPhuc.ts');
  const { docCauTruc } = await import('../ops/saoLuu.ts');
  /** Một bản sao lưu THẬT của database kiểm thử (bộ demo đầy đủ + mọi thứ các phép trên đã ghi), mở chỉ-đọc. */
  const dungBanSaoLuu = (dir: string) => {
    const f = pathMod.join(dir, 'pisa-cuc-bo-2026-09-22-1200.sqlite');
    saoLuuRaFile(db(), f);
    return f;
  };
  check('PR-Z2 · thuTuKhoaNgoai: bảng cha luôn đứng trước bảng con (users trước user_roles, students trước enrollments, classes trước teacher_assignments); đủ mọi bảng', () => {
    const { bang } = docCauTruc(db());
    const thuTu = thuTuKhoaNgoai(db(), bang.map((b) => b.name));
    const vt = (b: string) => thuTu.indexOf(b);
    assert(thuTu.length === bang.length && new Set(thuTu).size === thuTu.length, 'Thiếu hoặc lặp bảng');
    for (const [cha, con] of [['users', 'user_roles'], ['students', 'enrollments'], ['classes', 'teacher_assignments'], ['branches', 'classes']]) {
      assert(vt(cha) >= 0 && vt(con) >= 0 && vt(cha) < vt(con), `${cha} phải đứng trước ${con}: ${vt(cha)} / ${vt(con)}`);
    }
  });
  check('PR-Z2 · Sao lưu → khôi phục vào database RỖNG: mọi bảng đúng số dòng VÀ đúng từng dòng; chỉ mục đủ; không vi phạm khoá ngoại; file sao lưu không bị ghi', () => {
    const dir = fs.mkdtempSync(pathMod.join(os.tmpdir(), 'z2-kp-'));
    try {
      const f = dungBanSaoLuu(dir);
      const bamBk = bamFile(f);
      const bk = new Database(f, { readonly: true });
      const dich = new Database(pathMod.join(dir, 'dich.sqlite'));
      try {
        const r = khoiPhuc(bk, dich, { moiLan: 3 });   // lô nhỏ, lẻ — kiểm cả phần dư của mỗi bảng
        assert(r.bang === cacBang(bk).length && r.dong === cacBang(bk).reduce((s, b) => s + dem(bk, b), 0), `Báo ${JSON.stringify(r)}`);
        soHaiDb(bk, dich, 'Khôi phục');
        assert(dich.prepare('PRAGMA foreign_key_check').all().length === 0, 'Bản khôi phục có vi phạm khoá ngoại');
        assert(dem(dich, 'users') > 0 && dem(dich, 'students') > 0, 'Phải có người dùng và học viên');
      } finally { bk.close(); dich.close(); }
      assert(bamFile(f) === bamBk, 'Khôi phục đã ghi vào file sao lưu');
    } finally { xoaThuMucTam(dir); }
  });
  check('PR-Z2 · Khôi phục TỪ CHỐI khi đích đã có dữ liệu (một dòng bất kỳ) hoặc đã có bảng (kể cả rỗng) — và khi từ chối thì KHÔNG ghi gì', () => {
    const dir = fs.mkdtempSync(pathMod.join(os.tmpdir(), 'z2-kp-'));
    try {
      const bk = new Database(dungBanSaoLuu(dir), { readonly: true });
      try {
        for (const [ten, dung, loi] of [
          ['đích có một dòng dữ liệu', (c: InstanceType<typeof Database>) => c.exec("CREATE TABLE ghi_chu (a); INSERT INTO ghi_chu VALUES ('thật')"), /đã có dữ liệu/],
          ['đích có một bảng rỗng', (c: InstanceType<typeof Database>) => c.exec('CREATE TABLE users (id INTEGER PRIMARY KEY)'), /đã có bảng/],
        ] as const) {
          const o = moDbTam();
          try {
            dung(o.conn);
            const truoc = anhChup(o.conn); const ghiTruoc = soLanGhi(o.conn);
            assertThrows(() => khoiPhuc(bk, o.conn), loi, `${ten}: phải từ chối`);
            assert(anhChup(o.conn) === truoc && soLanGhi(o.conn) === ghiTruoc && !o.conn.inTransaction, `${ten}: đích đã bị thay đổi`);
          } finally { dongLai(o); }
        }
      } finally { bk.close(); }
    } finally { xoaThuMucTam(dir); }
  });
  check('PR-Z2 · Khôi phục TỪ CHỐI file không phải bản sao lưu dùng được (không có người dùng) — đích vẫn trống trơn', () => {
    const o = moDbTam();
    const hong = new Database(':memory:');
    try {
      hong.exec('CREATE TABLE users (id INTEGER PRIMARY KEY)');
      assertThrows(() => khoiPhuc(hong, o.conn), /người dùng/, 'Bản sao lưu rỗng phải bị từ chối');
      assert(cacBang(o.conn).length === 0 && soLanGhi(o.conn) === 0, 'Đích đã bị ghi');
    } finally { hong.close(); dongLai(o); }
  });
  check('PR-Z2 · Khôi phục là MỘT giao dịch: hỏng giữa chừng thì đích không còn bảng hay dòng nào', () => {
    const o = moDbTam();
    const nguon = new Database(':memory:');
    try {
      /* Chỉ mục được tạo SAU khi chép dữ liệu. Chen thêm một chỉ mục UNIQUE trên cột có giá trị trùng → khôi phục hỏng ở
         bước CUỐI, khi mọi bảng và mọi dòng đã được ghi — đích phải không còn gì. */
      nguon.exec("CREATE TABLE users (id INTEGER PRIMARY KEY, email TEXT); INSERT INTO users (email) VALUES ('a'), ('a'); CREATE TABLE khac (x); INSERT INTO khac VALUES (1)");
      const hongGiua = new Proxy(nguon, {
        get(dich, khoa) {
          if (khoa === 'prepare') return (sql: string) => (/sqlite_master/.test(sql)
            ? { all: () => [...dich.prepare(sql).all() as any[], { type: 'index', name: 'hong', sql: 'CREATE UNIQUE INDEX hong ON users (email)' }], get: (...a: any[]) => dich.prepare(sql).get(...a) }
            : dich.prepare(sql));
          const v = (dich as any)[khoa];
          return typeof v === 'function' ? v.bind(dich) : v;
        },
      });
      assertThrows(() => khoiPhuc(hongGiua, o.conn), /UNIQUE/i, 'Chỉ mục trùng ở bước cuối phải làm hỏng khôi phục');
      assert(cacBang(o.conn).length === 0 && !o.conn.inTransaction, `Còn sót trên đích: ${cacBang(o.conn).join(', ')}`);
    } finally { nguon.close(); dongLai(o); }
  });

  check('PR-Z2 · Khôi phục từ bản sao lưu (kể cả bản kiểu cũ còn chứa phiên): mã phiên cũ KHÔNG đăng nhập được; đăng nhập lại bằng mật khẩu thì được', () => {
    const dir = fs.mkdtempSync(pathMod.join(os.tmpdir(), 'z2-kp-phien-'));
    try {
      /* Một tài khoản còn mật khẩu mặc định của bộ demo, và một phiên đăng nhập đang sống của nó. */
      const u = (db().prepare('SELECT id, email, password_hash h, password_salt s FROM users WHERE email IS NOT NULL ORDER BY id').all() as any[])
        .find((x) => x.h === cryptoMod.scryptSync(DEFAULT_ADMIN_PASSWORD_DEMO, x.s, 64).toString('hex'));
      assert(u, 'Bộ demo phải còn một tài khoản dùng mật khẩu mặc định');
      const maCu = taoPhien(u.id);
      const banMoi = pathMod.join(dir, 'pisa-cuc-bo-2026-09-22-1300.sqlite');
      saoLuuRaFile(db(), banMoi);
      /* Bản sao lưu KIỂU CŨ (trước 22/09) còn nguyên bảng phiên: chép thẳng cả file bằng VACUUM INTO (chỉ đọc nguồn). */
      const banCu = pathMod.join(dir, 'ban-cu-con-phien.sqlite');
      db().exec(`VACUUM INTO '${banCu.replace(/'/g, "''")}'`);
      const authJs = pathToFileURL(pathMod.join(REPO, 'dist-server/server/src/auth.js')).href;
      const accJs2 = pathToFileURL(pathMod.join(REPO, 'dist-server/server/src/platform/accounts.js')).href;
      for (const [ten, bk] of [['bản sao lưu mới', banMoi], ['bản sao lưu kiểu cũ còn phiên', banCu]] as const) {
        const nguon = new Database(bk, { readonly: true });
        const f = pathMod.join(dir, `khoi-phuc-${ten.length}.sqlite`);
        const dich = new Database(f);
        try { khoiPhuc(nguon, dich); } finally { nguon.close(); dich.close(); }
        const r = chayCon(`const a = await import(${JSON.stringify(authJs)}); const acc = await import(${JSON.stringify(accJs2)});`
          + ` const cu = a.resolveSession(${JSON.stringify(maCu)});`
          + ` const dn = acc.login(${JSON.stringify(u.email)}, ${JSON.stringify(DEFAULT_ADMIN_PASSWORD_DEMO)});`
          + ` const moi = a.resolveSession(a.createSession(dn.userId));`
          + ` console.log(JSON.stringify({ cuVaoDuoc: !!cu, moiVaoDuoc: !!moi }));`,
        { PISA_DB: f, TURSO_DATABASE_URL: '', TURSO_AUTH_TOKEN: '' });
        assert(r.status === 0, `${ten}: ${String(r.stderr).slice(-300)}`);
        const o = JSON.parse(String(r.stdout).trim().split('\n').pop()!);
        assert(o.cuVaoDuoc === false, `${ten}: mã phiên cũ vẫn đăng nhập được sau khi khôi phục`);
        assert(o.moiVaoDuoc === true, `${ten}: đăng nhập lại bằng mật khẩu không được`);
      }
    } finally { xoaThuMucTam(dir); }
  });

  const khoiPhucJs = pathMod.join(REPO, 'dist-server/server/src/ops/runKhoiPhuc.js');
  check('PR-Z2 · Lệnh khoi-phuc: thiếu biến / xác nhận sai → TỪ CHỐI, không tạo gì; đúng → in Đích + số dòng, KHÔNG in token; chạy lần hai → TỪ CHỐI, file giữ nguyên từng byte', () => {
    const dir = fs.mkdtempSync(pathMod.join(os.tmpdir(), 'z2-kp-'));
    try {
      const bk = dungBanSaoLuu(dir);
      const dich = pathMod.join(dir, 'dich-moi.sqlite');
      const env = { TURSO_DATABASE_URL: urlFile(dich), TURSO_AUTH_TOKEN: TOKEN_GIA, FILE_SAO_LUU: bk };
      const chay = (e: Record<string, string>) => cp.spawnSync(process.execPath, [khoiPhucJs], {
        env: { ...process.env, TURSO_DATABASE_URL: '', TURSO_AUTH_TOKEN: '', FILE_SAO_LUU: '', PISA_CHO_PHEP_KHOI_PHUC: '', BAN_CHINH: '', ...e },
        encoding: 'utf8', timeout: 120_000,
      });
      const thieu = chay({ TURSO_DATABASE_URL: urlFile(dich), TURSO_AUTH_TOKEN: TOKEN_GIA });
      assert(thieu.status === 1 && /FILE_SAO_LUU/.test(thieu.stderr) && !fs.existsSync(dich), `Thiếu file: ${thieu.status} ${String(thieu.stderr).slice(-200)}`);
      for (const xacNhan of ['', 'dich', 'turso.io']) {
        const r = chay({ ...env, PISA_CHO_PHEP_KHOI_PHUC: xacNhan });
        assert(r.status === 1 && /TỪ CHỐI/.test(r.stderr) && /PISA_CHO_PHEP_KHOI_PHUC/.test(r.stderr), `Xác nhận "${xacNhan}": ${r.status} ${String(r.stderr).slice(-200)}`);
        assert(!fs.existsSync(dich), `Xác nhận "${xacNhan}" sai mà đã tạo database đích`);
      }
      const r = chay({ ...env, PISA_CHO_PHEP_KHOI_PHUC: 'dich-moi.sqlite' });
      const ra = String(r.stdout) + String(r.stderr);
      assert(r.status === 0 && /Đích: /.test(r.stdout) && /Xong\. Đã khôi phục \d+ bảng, \d+ dòng/.test(r.stdout), `Mã ${r.status}: ${ra.slice(-400)}`);
      assert(!ra.includes(TOKEN_GIA), 'Lệnh in lộ token');
      const a = new Database(bk, { readonly: true }); const b = new Database(dich, { readonly: true });
      try { soHaiDb(a, b, 'Lệnh khoi-phuc'); } finally { a.close(); b.close(); }
      const bam = bamFile(dich);
      const lai = chay({ ...env, PISA_CHO_PHEP_KHOI_PHUC: 'dich-moi.sqlite' });
      assert(lai.status === 1 && /TỪ CHỐI/.test(lai.stderr) && /đã có/.test(lai.stderr), `Lần hai: ${lai.status} ${String(lai.stderr).slice(-200)}`);
      assert(bamFile(dich) === bam, 'Chạy lần hai đã thay đổi database đích');
    } finally { xoaThuMucTam(dir); }
  });

  console.log('\nPR-Z2 · 8. Phiên đăng nhập hết hạn sau 30 ngày không dùng (tính theo GIỜ THẬT, không theo ngày demo)');
  await checkAsync('PR-Z2 · Phiên dùng lần cuối 31 ngày trước → 401 và dòng phiên bị xoá; 29 ngày trước → vẫn vào được và mốc dùng cuối được cập nhật', async () => {
    const authMod = await import('../auth.ts') as any;
    assert(authMod.PHIEN_HET_HAN_SAU_NGAY === 30, `Hằng số hết hạn phải là 30 ngày, đang là ${authMod.PHIEN_HET_HAN_SAU_NGAY}`);
    /* Bộ kiểm đặt ngày demo 14/09 (lệch ngày thật) — mã tính theo ngày demo sẽ cho phiên 31 ngày "thật" vẫn còn hạn. */
    const truocNgay = (n: number) => new Date(Date.now() - n * 86_400_000).toISOString();
    const taoPhienCu = (n: number) => {
      const ma = cryptoMod.randomBytes(24).toString('hex');
      t.conn.prepare('INSERT INTO demo_sessions (token, user_id, created_at, last_seen_at) VALUES (?,?,?,?)')
        .run(ma, t.admin.userId, truocNgay(n + 5), truocNgay(n));
      return ma;
    };
    const may = createApp().listen(0);
    const cong = (may.address() as any).port as number;
    /* PR-Dọn (Q14): `/overview` đã xoá — dùng một đường sống cần đăng nhập. */
    const goiVoi = (ma: string) => fetch(`http://127.0.0.1:${cong}/api/notifications`, { headers: { cookie: `pisa_demo_session=${ma}` } });
    try {
      const cu = taoPhienCu(31);
      const r31 = await goiVoi(cu);
      assert(r31.status === 401, `Phiên 31 ngày không dùng vẫn vào được: ${r31.status}`);
      assert(!t.conn.prepare('SELECT 1 FROM demo_sessions WHERE token = ?').get(cu), 'Phiên hết hạn phải bị xoá khỏi bảng');
      const moi = taoPhienCu(29);
      const r29 = await goiVoi(moi);
      assert(r29.status === 200, `Phiên 29 ngày phải còn vào được: ${r29.status}`);
      const lanCuoi = (t.conn.prepare('SELECT last_seen_at FROM demo_sessions WHERE token = ?').get(moi) as any)?.last_seen_at as string;
      assert(Math.abs(Date.now() - Date.parse(lanCuoi)) < 60_000, `Mốc dùng cuối phải được cập nhật về bây giờ, đang là ${lanCuoi}`);
    } finally { may.close(); }
  });
}
