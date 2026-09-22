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
  /** Mô-đun chưa có thì phép kiểm ĐỎ với câu nói rõ thiếu gì, không làm sập cả bộ (mẫu PR-S1). `then` trả undefined để `await load(…)` không coi Proxy là promise. */
  const load = async (p: string): Promise<any> => import(p).catch((e) =>
    new Proxy({}, { get: (_x, k) => { if (k === 'then') return undefined; throw new Error(`Chưa có mô-đun ${p} (${String(k)}) — ${e.message}`); } }));
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

  // ================================================================== 2. Hàm giới hạn (AN-1)

  console.log('\nPR-AN · 2. Giới hạn số lần thử — hàm thuần theo database');
  const gh = await load('../platform/gioiHanThu.ts');

  check('AN-1 · Đếm theo cửa sổ: lần sai cũ hơn 15 phút không tính; đủ 5 lần trong 15 phút thì khoá, báo đúng số phút còn lại; hết cửa sổ thì mở', () => {
    const t0 = Date.now();
    const phut = 60_000;
    const e = 'an1-cua-so.pisa@gmail.com';
    for (let i = 0; i < 5; i++) gh.ghiLanThu('dang_nhap_email', e, t0 - 20 * phut);
    assert(gh.phutConKhoa('dang_nhap_email', e, t0) === null, 'Lần sai 20 phút trước vẫn bị tính');
    for (let i = 0; i < 4; i++) gh.ghiLanThu('dang_nhap_email', e, t0 - 1 * phut);
    assert(gh.phutConKhoa('dang_nhap_email', e, t0) === null, '4 lần sai đã bị khoá');
    gh.ghiLanThu('dang_nhap_email', e, t0 - 1 * phut);
    const con = gh.phutConKhoa('dang_nhap_email', e, t0);
    assert(con === 14, `Phải còn 14 phút, nhận ${con}`);
    assert(gh.phutConKhoa('dang_nhap_email', e, t0 + 15 * phut) === null, 'Hết 15 phút mà vẫn khoá');
    assert(gh.phutConKhoa('dang_nhap_ip', e, t0) === null, 'Khoá loại này lan sang loại khác');
    assertThrows(() => gh.chanNeuBiKhoa('dang_nhap_email', e, gh.cauKhoaDangNhap, t0), /quá nhiều lần.*14 phút/, 'Đang khoá mà không chặn');
  });

  check('AN-1 · Bảng chỉ giữ mã băm: không có email hay IP thô trong auth_attempts', () => {
    gh.ghiLanThu('dang_nhap_email', 'an1-bam.pisa@gmail.com');
    gh.ghiLanThu('dang_nhap_ip', '198.51.100.7');
    const rows = conn.prepare('SELECT kind, key_hash FROM auth_attempts').all() as any[];
    assert(rows.length > 0 && rows.every((r) => /^[0-9a-f]{64}$/.test(r.key_hash)), 'key_hash phải là sha256 dạng hex');
    const tho = JSON.stringify(rows);
    assert(!tho.includes('@') && !tho.includes('an1-bam') && !tho.includes('198.51.100.7'), 'Bảng có email/IP thô');
    assert(gh.bam('a') === gh.bam('a') && gh.bam('a') !== gh.bam('b'), 'bam phải ổn định và phân biệt');
  });

  check('AN-1 · Dòng cũ hơn 24 giờ bị xoá mỗi khi ghi lần thử mới — bảng không phình', () => {
    const cu = new Date(Date.now() - 25 * 3_600_000).toISOString();
    conn.prepare('INSERT INTO auth_attempts (kind, key_hash, at) VALUES (?,?,?)').run('dang_ky_ip', 'f'.repeat(64), cu);
    gh.ghiLanThu('dang_ky_ip', '198.51.100.8');
    assert(!conn.prepare('SELECT 1 FROM auth_attempts WHERE at = ?').get(cu), 'Dòng 25 giờ trước vẫn còn');
  });

  // ================================================================== 3. Đăng nhập / đăng ký qua HTTP (AN-1)

  console.log('\nPR-AN · 3. Giới hạn số lần thử trên đường HTTP thật');
  const accounts: any = await import('../platform/accounts.ts');
  const { createApp } = await import('../app.ts');
  const may = createApp().listen(0);
  const cong = (may.address() as any).port as number;
  /**
   * Gọi đường HTTP thật. Có `ip` → bật BAN_CHINH trong lúc gọi và gửi header IP của Netlify, để mỗi phép kiểm có IP riêng
   * (không khoá lẫn nhau). `tho` = thân gửi nguyên văn (kiểm JSON hỏng).
   */
  const goi = async (method: string, url: string, o: { body?: unknown; ip?: string; tho?: string; cookie?: string } = {}) => {
    const headers: Record<string, string> = { 'content-type': 'application/json' };
    if (o.ip) headers['x-nf-client-connection-ip'] = o.ip;
    if (o.cookie) headers.cookie = o.cookie;
    if (o.ip) process.env.BAN_CHINH = '1';
    try {
      const res = await fetch(`http://127.0.0.1:${cong}/api${url}`, {
        method, headers, body: o.tho ?? (o.body === undefined ? undefined : JSON.stringify(o.body)),
      });
      let json: any = null;
      try { json = await res.json(); } catch { /* không có thân JSON */ }
      return { status: res.status, json, setCookie: res.headers.get('set-cookie'), cacheControl: res.headers.get('cache-control') };
    } finally { if (o.ip) delete process.env.BAN_CHINH; }
  };
  const taoTaiKhoan = (ten: string) => {
    const email = `${ten}${accounts.EMAIL_SUFFIX}`;
    const password = 'matkhau-an1';
    accounts.createAccount(P.admin, { email, password, fullName: `Thử ${ten}`, roles: [{ role: 'teacher', branches: ['MB'] }] });
    return { email, password };
  };
  const dangNhap = (tk: { email: string; password: string }, ip: string, sai = false) =>
    goi('POST', '/auth/login', { ip, body: { email: tk.email, password: sai ? 'sai-mat-khau' : tk.password } });

  await checkAsync('AN-1 · 5 lần sai cùng email → lần 6 bị 429 KỂ CẢ mật khẩu đúng, không phát cookie; IP khác cũng bị (khoá theo email)', async () => {
    const tk = taoTaiKhoan('an1.khoa');
    for (let i = 0; i < 5; i++) {
      const r = await dangNhap(tk, '203.0.113.11', true);
      assert(r.status === 400, `Lần sai ${i + 1}: ${r.status}`);
    }
    const r6 = await dangNhap(tk, '203.0.113.11');
    assert(r6.status === 429 && /quá nhiều lần/.test(r6.json?.error ?? '') && /\d+ phút/.test(r6.json?.error ?? ''), `Lần 6: ${r6.status} ${JSON.stringify(r6.json)}`);
    assert(!r6.setCookie, 'Đang khoá mà vẫn phát cookie phiên');
    const r7 = await dangNhap(tk, '203.0.113.12');
    assert(r7.status === 429, `IP khác vẫn vào được: ${r7.status}`);
  });

  await checkAsync('AN-1 · Đăng nhập đúng xoá đếm của email: 4 sai → 1 đúng → 4 sai → vẫn vào được', async () => {
    const tk = taoTaiKhoan('an1.xoa');
    for (let i = 0; i < 4; i++) await dangNhap(tk, '203.0.113.13', true);
    assert((await dangNhap(tk, '203.0.113.13')).status === 200, 'Lần đúng phải vào được');
    for (let i = 0; i < 4; i++) await dangNhap(tk, '203.0.113.13', true);
    const r = await dangNhap(tk, '203.0.113.13');
    assert(r.status === 200 && r.setCookie, `Đếm cũ không được xoá: ${r.status}`);
  });

  await checkAsync('AN-1 · 30 lần sai từ một IP (mỗi lần một email) → IP đó bị khoá cả với tài khoản đúng; IP khác không bị', async () => {
    const tk = taoTaiKhoan('an1.ip');
    for (let i = 0; i < 30; i++) {
      await goi('POST', '/auth/login', { ip: '203.0.113.21', body: { email: `an1.do${i}${accounts.EMAIL_SUFFIX}`, password: 'x' } });
    }
    const bi = await dangNhap(tk, '203.0.113.21');
    assert(bi.status === 429, `IP đã dò 30 lần vẫn đăng nhập được: ${bi.status}`);
    const khac = await dangNhap(tk, '203.0.113.22');
    assert(khac.status === 200, `IP khác bị vạ lây: ${khac.status}`);
  });

  await checkAsync('AN-1 · Email KHÔNG tồn tại cũng bị khoá sau 5 lần, cùng câu báo như email có thật (không lộ email nào có thật)', async () => {
    const la = { email: `an1.khongco${accounts.EMAIL_SUFFIX}`, password: 'x' };
    for (let i = 0; i < 5; i++) await dangNhap(la, '203.0.113.23', true);
    const r = await dangNhap(la, '203.0.113.23');
    assert(r.status === 429, `Email lạ không bị khoá: ${r.status}`);
    const boSo = (s: string) => String(s).replace(/\d+/g, 'N');
    assert(boSo(r.json?.error) === boSo(gh.cauKhoaDangNhap(1)), `Câu khác câu của email có thật: ${r.json?.error}`);
  });

  await checkAsync('AN-1 · Đăng ký: 10 lần/giờ/IP (tính cả lần hỏng) → lần 11 bị 429 dù thân hợp lệ, không tạo tài khoản; IP khác vẫn đăng ký được', async () => {
    for (let i = 0; i < 10; i++) {
      const r = await goi('POST', '/auth/register', { ip: '203.0.113.31', body: { email: 'thieu' } });
      assert(r.status === 400, `Đăng ký hỏng lần ${i + 1}: ${r.status}`);
    }
    const hopLe = { email: `an1.dangky${accounts.EMAIL_SUFFIX}`, password: 'matkhau123', fullName: 'AN1 Đăng Ký', branches: ['MB'] };
    const r11 = await goi('POST', '/auth/register', { ip: '203.0.113.31', body: hopLe });
    assert(r11.status === 429 && /quá nhiều đăng ký/.test(r11.json?.error ?? ''), `Lần 11: ${r11.status} ${JSON.stringify(r11.json)}`);
    assert(!conn.prepare('SELECT 1 FROM users WHERE email = ?').get(hopLe.email), 'Bị khoá mà vẫn tạo tài khoản');
    const khac = await goi('POST', '/auth/register', { ip: '203.0.113.32', body: hopLe });
    assert(khac.status === 200 && khac.json?.pending === true, `IP khác: ${khac.status}`);
  });

  // ================================================================== 4. AN-6 — đăng ký phải QTHT duyệt

  console.log('\nPR-AN · 4. Đăng ký tự do nhưng phải Quản trị hệ thống duyệt (4.11)');
  const auth: any = await import('../auth.ts');

  await checkAsync('AN-6 · Đăng ký qua HTTP: tài khoản ở trạng thái chờ duyệt, KHÔNG có vai nào; trường lạ (role, approval_state, status) bị bỏ qua', async () => {
    const email = `an6.moi${accounts.EMAIL_SUFFIX}`;
    const r = await goi('POST', '/auth/register', { ip: '203.0.113.41', body: {
      email, password: 'matkhau123', fullName: 'AN6 Mới', branches: ['MB'],
      role: 'system_admin', roles: [{ role: 'system_admin', branches: [] }], approval_state: 'approved', approvalState: 'approved', status: 'active',
    } });
    assert(r.status === 200 && r.json?.pending === true, `Đăng ký: ${r.status} ${JSON.stringify(r.json)}`);
    const u = conn.prepare('SELECT id, approval_state FROM users WHERE email = ?').get(email) as any;
    assert(u && u.approval_state === 'pending', `Trạng thái: ${u?.approval_state}`);
    const vai = (conn.prepare("SELECT COUNT(*) n FROM user_roles WHERE user_id = ? AND status = 'active'").get(u.id) as any).n;
    assert(vai === 0, `Chưa duyệt mà đã có ${vai} vai`);
  });

  await checkAsync('AN-6 · Chờ duyệt → đăng nhập 403 "chờ", không cookie; bị từ chối → 403 kèm lý do; QTHT duyệt rồi mới vào được', async () => {
    const email = `an6.cho${accounts.EMAIL_SUFFIX}`;
    const { userId } = accounts.register({ email, password: 'matkhau123', fullName: 'AN6 Chờ', branches: ['MB'] });
    const cho = await goi('POST', '/auth/login', { ip: '203.0.113.42', body: { email, password: 'matkhau123' } });
    assert(cho.status === 403 && /chờ/.test(cho.json?.error ?? '') && !cho.setCookie, `Chờ duyệt: ${cho.status} ${cho.setCookie}`);
    const email2 = `an6.tuchoi${accounts.EMAIL_SUFFIX}`;
    const r2 = accounts.register({ email: email2, password: 'matkhau123', fullName: 'AN6 Từ Chối', branches: ['MB'] });
    accounts.decline(P.admin, r2.userId, 'Không phải giáo viên của trung tâm');
    const tc = await goi('POST', '/auth/login', { ip: '203.0.113.42', body: { email: email2, password: 'matkhau123' } });
    assert(tc.status === 403 && /Không phải giáo viên/.test(tc.json?.error ?? '') && !tc.setCookie, `Bị từ chối: ${tc.status}`);
    accounts.approve(P.admin, userId, { role: 'teacher', branches: ['MB'] });
    const vao = await goi('POST', '/auth/login', { ip: '203.0.113.42', body: { email, password: 'matkhau123' } });
    assert(vao.status === 200 && vao.setCookie, `Đã duyệt mà không vào được: ${vao.status}`);
  });

  check('AN-6 · Phiên của tài khoản chờ duyệt / bị từ chối / không hoạt động không dùng được (và bị xoá); tài khoản đã duyệt thì dùng được', () => {
    const mk = (ten: string) => accounts.register({ email: `${ten}${accounts.EMAIL_SUFFIX}`, password: 'matkhau123', fullName: ten, branches: ['MB'] }).userId as number;
    const cho = mk('an6.phien.cho');
    const tuChoi = mk('an6.phien.tuchoi');
    accounts.decline(P.admin, tuChoi, 'Thử phiên');
    const khoa = mk('an6.phien.khoa');
    accounts.approve(P.admin, khoa, { role: 'teacher', branches: ['MB'] });
    conn.prepare("UPDATE users SET status = 'locked' WHERE id = ?").run(khoa);
    for (const [ten, id] of [['chờ duyệt', cho], ['bị từ chối', tuChoi], ['không hoạt động', khoa]] as const) {
      const ma = auth.createSession(id);
      assert(auth.resolveSession(ma) === null, `Phiên của tài khoản ${ten} vẫn dùng được`);
      assert(!conn.prepare('SELECT 1 FROM demo_sessions WHERE token = ?').get(ma), `Phiên của tài khoản ${ten} không bị xoá`);
    }
    const ok = auth.resolveSession(auth.createSession(P.admin.userId));
    assert(ok && ok.userId === P.admin.userId, 'Tài khoản đã duyệt phải dùng được phiên');
  });

  // ================================================================== 5. AN-3 — câu lỗi không lộ nội bộ

  console.log('\nPR-AN · 5. Lỗi 409/500 không lộ câu SQL hay thông điệp nội bộ');
  const appMod: any = await import('../app.ts');
  const reqGia = { method: 'POST', path: '/api/thu-loi' } as any;

  await checkAsync('AN-3 · 409 (vi phạm ràng buộc): câu chung, KHÔNG có details.raw hay câu SQL; chi tiết chỉ ở log máy chủ', async () => {
    const loi = Object.assign(new Error('UNIQUE constraint failed: users.email (INSERT INTO users (code, email) VALUES …)'), { code: 'SQLITE_CONSTRAINT_UNIQUE' });
    const res = giaRes();
    const { log } = await batLog(() => appMod.traLoiLoi(loi, reqGia, res, () => {}));
    assert(res.code === 409 && res.body?.error === 'Dữ liệu bị trùng hoặc vi phạm ràng buộc.', `Nhận ${res.code} ${JSON.stringify(res.body)}`);
    const tho = JSON.stringify(res.body);
    assert(!/raw|UNIQUE|INSERT|users\.email/.test(tho), `Câu trả lời còn lộ: ${tho}`);
    assert(/UNIQUE constraint failed/.test(log), 'Log máy chủ phải giữ chi tiết để người sửa đọc');
  });

  await checkAsync('AN-3 · 500: câu "Có lỗi · mã …" không lộ thông điệp gốc; cùng mã đó có trong log máy chủ kèm chi tiết', async () => {
    const res = giaRes();
    const { log } = await batLog(() => appMod.traLoiLoi(new Error('no such table: bang_bi_mat (SELECT * FROM bang_bi_mat)'), reqGia, res, () => {}));
    const ma = res.body?.details?.ma as string;
    assert(res.code === 500 && /^[0-9a-f]{8}$/.test(ma ?? ''), `Nhận ${res.code} ${JSON.stringify(res.body)}`);
    assert(res.body.error.startsWith(`Có lỗi · mã ${ma}.`) && !/Hãy/.test(res.body.error), `Câu: ${res.body.error}`);
    assert(!/bang_bi_mat|SELECT|no such table/.test(JSON.stringify(res.body)), 'Câu trả lời lộ thông điệp gốc');
    assert(log.includes(ma) && /bang_bi_mat/.test(log), `Log phải có mã ${ma} và chi tiết: ${log}`);
  });

  await checkAsync('AN-3 · Thân JSON hỏng → 400 câu tiếng Việt (không phải 500 kèm câu tiếng Anh của thư viện)', async () => {
    const r = await goi('POST', '/auth/login', { tho: '{hong' });
    assert(r.status === 400 && /không đọc được/.test(r.json?.error ?? ''), `Nhận ${r.status} ${JSON.stringify(r.json)}`);
    assert(!/Unexpected|JSON|token/i.test(r.json?.error ?? ''), `Còn câu của thư viện: ${r.json?.error}`);
  });

  const { HttpError: LoiHttp } = await import('../util.ts');
  check('AN-3 · HttpError giữ nguyên câu và details như cũ (không đổi hành vi các lỗi có chủ đích)', () => {
    const res = giaRes();
    appMod.traLoiLoi(new LoiHttp(503, 'Chưa có dữ liệu demo trong máy.', { needsSeed: true }), reqGia, res, () => {});
    assert(res.code === 503 && res.body?.error === 'Chưa có dữ liệu demo trong máy.' && res.body?.details?.needsSeed === true, `Nhận ${res.code} ${JSON.stringify(res.body)}`);
  });

  // ---- các task sau thêm phép kiểm NGAY TRÊN dòng này ----

  may.close();
  /* Dọn: không để lại lần thử nào cho file khác (bảng chưa có thì bỏ qua — chỉ xảy ra ở bước đỏ của Task 1). */
  try { conn.prepare('DELETE FROM auth_attempts').run(); } catch { /* bảng chưa có */ }
}
