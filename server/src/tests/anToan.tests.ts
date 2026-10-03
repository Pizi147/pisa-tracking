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

  await checkAsync('AN-1 · Đăng ký: 30 lần/giờ/IP (PR-Z2c, trước là 10; tính cả lần hỏng) → lần 31 bị 429 dù thân hợp lệ, không tạo tài khoản; IP khác vẫn đăng ký được', async () => {
    for (let i = 0; i < 30; i++) {
      const r = await goi('POST', '/auth/register', { ip: '203.0.113.31', body: { email: 'thieu' } });
      assert(r.status === 400, `Đăng ký hỏng lần ${i + 1}: ${r.status}`);
    }
    const hopLe = { email: `an1.dangky${accounts.EMAIL_SUFFIX}`, password: 'matkhau123', fullName: 'AN1 Đăng Ký', branches: ['MB'] };
    const r31 = await goi('POST', '/auth/register', { ip: '203.0.113.31', body: hopLe });
    assert(r31.status === 429 && /quá nhiều đăng ký/.test(r31.json?.error ?? ''), `Lần 31: ${r31.status} ${JSON.stringify(r31.json)}`);
    assert(!conn.prepare('SELECT 1 FROM users WHERE email = ?').get(hopLe.email), 'Bị khoá mà vẫn tạo tài khoản');
    const khac = await goi('POST', '/auth/register', { ip: '203.0.113.32', body: hopLe });
    assert(khac.status === 200 && khac.json?.pending === true, `IP khác: ${khac.status}`);
  });

  check('PR-Z2c · Câu khoá theo IP: "Có quá nhiều lần đăng nhập sai từ mạng này. Thử lại sau N phút." — N tính như câu khoá theo email', () => {
    const t0 = Date.now();
    const ip = '198.51.100.20';
    for (let i = 0; i < 30; i++) gh.ghiLanThu('dang_nhap_ip', ip, t0 - 60_000);
    assertThrows(() => gh.chanNeuBiKhoa('dang_nhap_ip', ip, gh.cauKhoaDangNhapIp, t0),
      /^Có quá nhiều lần đăng nhập sai từ mạng này\. Thử lại sau 14 phút\.$/, 'Câu khoá theo IP sai');
    assert(gh.cauKhoaDangNhap(14) === 'Đăng nhập sai quá nhiều lần. Thử lại sau 14 phút.', `Câu khoá theo email bị đổi: ${gh.cauKhoaDangNhap(14)}`);
  });

  await checkAsync('PR-Z2c · Đăng nhập qua HTTP bị khoá theo IP → 429 với câu "…từ mạng này…"; bị khoá theo email thì vẫn câu cũ', async () => {
    const tk = taoTaiKhoan('z2c.ip');
    for (let i = 0; i < 30; i++) gh.ghiLanThu('dang_nhap_ip', '203.0.113.24');
    const r = await dangNhap(tk, '203.0.113.24');
    assert(r.status === 429 && /^Có quá nhiều lần đăng nhập sai từ mạng này\. Thử lại sau \d+ phút\.$/.test(r.json?.error ?? ''), `Nhận ${r.status} ${JSON.stringify(r.json)}`);
    const la = { email: `z2c.email${accounts.EMAIL_SUFFIX}`, password: 'x' };
    for (let i = 0; i < 5; i++) await dangNhap(la, '203.0.113.25', true);
    const e = await dangNhap(la, '203.0.113.25');
    assert(e.status === 429 && /^Đăng nhập sai quá nhiều lần\. Thử lại sau \d+ phút\.$/.test(e.json?.error ?? ''), `Khoá theo email: ${e.status} ${JSON.stringify(e.json)}`);
  });

  check('PR-Z2c · ipCua: bản chính dùng x-nf-client-connection-ip, thiếu thì client-ip; không ra IP thì "khong-ro" + cảnh báo MỘT lần mỗi yêu cầu (chỉ method + đường dẫn)', () => {
    const gia = (headers: Record<string, string>, remoteAddress?: string) =>
      ({ headers, socket: { remoteAddress }, method: 'POST', path: '/api/auth/login', originalUrl: '/api/auth/login' }) as any;
    process.env.BAN_CHINH = '1';
    try {
      assert(gh.ipCua(gia({ 'x-nf-client-connection-ip': '198.51.100.30', 'client-ip': '198.51.100.31' })) === '198.51.100.30', 'x-nf phải được ưu tiên');
      assert(gh.ipCua(gia({ 'client-ip': ' 198.51.100.31 ' })) === '198.51.100.31', 'Thiếu x-nf thì phải dùng client-ip');
      assert(gh.ipCua(gia({ 'client-ip': '198.51.100.31' }, '10.0.0.1')) === '198.51.100.31', 'client-ip phải đứng trước địa chỉ socket ở bản chính');
    } finally { delete process.env.BAN_CHINH; }
    assert(gh.ipCua(gia({ 'client-ip': '198.51.100.31' }, '127.0.0.1')) === '127.0.0.1', 'Máy dev không tin header');
    const goc = console.warn;
    const canhBao: string[] = [];
    console.warn = (...a: unknown[]) => { canhBao.push(a.map(String).join(' ')); };
    try {
      const req = gia({ cookie: 'pisa_demo_session=bi-mat-123' });
      assert(gh.ipCua(req) === 'khong-ro' && gh.ipCua(req) === 'khong-ro', 'Không có IP thì phải là khong-ro');
      assert(canhBao.length === 1, `Cảnh báo ${canhBao.length} lần cho một yêu cầu`);
      assert(/POST/.test(canhBao[0]) && /\/api\/auth\/login/.test(canhBao[0]) && !/bi-mat-123|cookie/.test(canhBao[0]), `Câu cảnh báo: ${canhBao[0]}`);
      gh.ipCua(gia({}));
      assert(canhBao.length === 2, 'Yêu cầu khác phải cảnh báo lại');
    } finally { console.warn = goc; }
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

  // ================================================================== 6. AN-4 — /api/health

  console.log('\nPR-AN · 6. /api/health công khai nhưng rẻ và không lộ gì');

  await checkAsync('AN-4 · /api/health trả đúng {ok, seeded} + no-store; 5 lần gọi liền chỉ hỏi database tối đa 1 lần', async () => {
    const may2 = createApp().listen(0);
    const cong2 = (may2.address() as any).port as number;
    try {
      const traLoi: any[] = [];
      const n = await demCauHoi(/sqlite_master/, async () => {
        for (let i = 0; i < 5; i++) {
          const r = await fetch(`http://127.0.0.1:${cong2}/api/health`);
          traLoi.push({ status: r.status, cc: r.headers.get('cache-control'), json: await r.json() });
        }
      });
      assert(traLoi.every((x) => x.status === 200 && JSON.stringify(x.json) === '{"ok":true,"seeded":true}'), JSON.stringify(traLoi[0]));
      assert(traLoi.every((x) => /no-store/.test(x.cc ?? '')), `Cache-Control: ${traLoi[0].cc}`);
      assert(n <= 1, `Hỏi database ${n} lần cho 5 lần gọi`);
    } finally { may2.close(); }
  });


  /* Hàm `taoSuKhoe` nhận `hoi`/`bayGio` giả nên phép dưới không cần database thật. */
  const suKhoeMod = await load('../platform/suKhoe.ts');
  check('AN-4 · Database lỗi → 503 {ok:false, seeded:false}, không kèm lỗi; chưa khởi tạo thì hỏi lại sau 30 giây, không phải mỗi lần', () => {
    const hong = suKhoeMod.taoSuKhoe(() => { throw new Error('libsql: mất kết nối tới pisatracking-xxx.turso.io'); }, () => 0);
    const r1 = giaRes();
    const gocLoi = console.error; console.error = () => {};   // nuốt dòng log [health] của phép này
    try { hong({} as any, r1); } finally { console.error = gocLoi; }
    assert(r1.code === 503 && JSON.stringify(r1.body) === '{"ok":false,"seeded":false}', `Nhận ${r1.code} ${JSON.stringify(r1.body)}`);
    let gio = 0; let soLanHoi = 0;
    const chuaCo = suKhoeMod.taoSuKhoe(() => { soLanHoi += 1; return false; }, () => gio);
    for (const g of [0, 1_000, 29_999]) { gio = g; chuaCo({} as any, giaRes()); }
    assert(soLanHoi === 1, `Trong 30 giây hỏi ${soLanHoi} lần`);
    gio = 30_000; const r2 = giaRes(); chuaCo({} as any, r2);
    assert(soLanHoi === 2 && r2.body?.seeded === false, `Sau 30 giây: hỏi ${soLanHoi} lần, ${JSON.stringify(r2.body)}`);
  });

  check('PR-Z2c · Database lỗi cũng giữ nhịp 30 giây: trong 30 giây trả lại 503 mà KHÔNG hỏi lại database; qua 30 giây mới hỏi lại', () => {
    let gio = 0; let soLanHoi = 0; let hong = true;
    const sk = suKhoeMod.taoSuKhoe(() => { soLanHoi += 1; if (hong) throw new Error('libsql: mất kết nối'); return true; }, () => gio);
    const gocLoi = console.error; console.error = () => {};
    try {
      const kq: any[] = [];
      for (const g of [0, 1_000, 29_999]) { gio = g; const r = giaRes(); sk({} as any, r); kq.push(r); }
      assert(soLanHoi === 1, `Database lỗi mà trong 30 giây hỏi ${soLanHoi} lần`);
      assert(kq.every((r) => r.code === 503 && JSON.stringify(r.body) === '{"ok":false,"seeded":false}'), `Trong 30 giây phải trả 503: ${kq.map((r) => r.code).join(',')}`);
      hong = false; gio = 30_000;
      const r2 = giaRes(); sk({} as any, r2);
      assert(soLanHoi === 2 && r2.code === 200 && JSON.stringify(r2.body) === '{"ok":true,"seeded":true}', `Sau 30 giây: hỏi ${soLanHoi} lần, ${r2.code} ${JSON.stringify(r2.body)}`);
    } finally { console.error = gocLoi; }
  });

  // ================================================================== 7. AN-5 — hạn 10 giây

  console.log('\nPR-AN · 7. Không mở giao dịch Turso khi hàm Netlify sắp hết 10 giây');
  const hg = await load('../platform/hanGio.ts');
  const dbMod: any = await import('../db.ts');
  const coKhoa = (k: string) => !!conn.prepare('SELECT 1 FROM demo_config WHERE key = ?').get(k);
  const ghiThu = (k: string) => conn.prepare('INSERT INTO demo_config (key, value, updated_at) VALUES (?,?,?)').run(k, 'x', new Date().toISOString());

  check('AN-5 · Còn < 2,5 giây: tx() từ chối mở giao dịch (503 "chưa lưu gì"), không ghi gì; còn nhiều giờ thì chạy bình thường', () => {
    assertThrows(() => hg.chayVoiHan(Date.now() + 1_000, () => dbMod.tx(() => ghiThu('an5_sap_het'))), /bận.*chưa lưu gì/, 'Sắp hết giờ mà vẫn mở giao dịch');
    assert(!coKhoa('an5_sap_het'), 'Bị từ chối mà vẫn ghi');
    hg.chayVoiHan(Date.now() + 60_000, () => dbMod.tx(() => ghiThu('an5_con_gio')));
    assert(coKhoa('an5_con_gio'), 'Còn giờ mà không ghi được');
    conn.prepare("DELETE FROM demo_config WHERE key LIKE 'an5_%'").run();
  });

  check('AN-5 · Ngoài một lời gọi có hạn (máy dev, lệnh, phép kiểm): không chặn gì; giao dịch LỒNG không bị hỏi lại', () => {
    assert(hg.conLaiMs() === null, 'Ngoài lời gọi mà có hạn');
    dbMod.tx(() => ghiThu('an5_ngoai'));
    assert(coKhoa('an5_ngoai'), 'Máy dev bị chặn');
    /* Giao dịch ngoài mở lúc còn giờ; giao dịch trong (savepoint) chạy dù đồng hồ đã qua ngưỡng — cắt giữa chừng mới là điều cần tránh. */
    hg.chayVoiHan(Date.now() + 3_000, () => dbMod.tx(() => {
      const cho = Date.now() + 600; while (Date.now() < cho) { /* đẩy đồng hồ qua ngưỡng 2,5 giây trong lúc giao dịch ngoài đang mở */ }
      dbMod.tx(() => ghiThu('an5_long'));
    }));
    assert(coKhoa('an5_long'), 'Savepoint trong giao dịch đã mở bị chặn');
    conn.prepare("DELETE FROM demo_config WHERE key LIKE 'an5_%'").run();
  });

  check('AN-5 · donGiaoDichTreo(): còn giao dịch bỏ dở trên kết nối thì cuộn lại, trả true; không có thì trả false', () => {
    conn.exec('BEGIN');
    try {
      ghiThu('an5_treo');
      assert(dbMod.donGiaoDichTreo() === true && !conn.inTransaction, 'Không dọn được giao dịch treo');
      assert(!coKhoa('an5_treo'), 'Dòng của giao dịch treo vẫn còn');
      assert(dbMod.donGiaoDichTreo() === false, 'Không có gì mà vẫn báo dọn');
    } finally { if (conn.inTransaction) conn.exec('ROLLBACK'); /* hàm hỏng thì không để giao dịch treo đầu độc các phép sau */ }
  });

  check('AN-5 · demGio: bản chính gắn hạn 10 giây cho cả lời gọi; máy dev không gắn', () => {
    let trongHan: number | null = null;
    process.env.BAN_CHINH = '1';
    try { appMod.demGio({ method: 'GET', path: '/api/x' } as any, giaRes(), () => { trongHan = hg.conLaiMs(); }); }
    finally { delete process.env.BAN_CHINH; }
    assert(trongHan !== null && trongHan > 9_000 && trongHan <= 10_000, `Bản chính: còn ${trongHan} ms`);
    let dev: number | null = 0;
    appMod.demGio({ method: 'GET', path: '/api/x' } as any, giaRes(), () => { dev = hg.conLaiMs(); });
    assert(dev === null, `Máy dev có hạn: ${dev}`);
  });

  // ================================================================== 8. AN-8 — N+1 đếm bằng chứng

  console.log('\nPR-AN · 8. Bảng kỹ năng đếm bằng chứng một lần cho mọi thẻ Case');
  const casesMod: any = await import('../cases/cases.ts');

  await checkAsync('AN-8 · skillSupportBoard của một em có ≥ 2 Case: đúng MỘT câu hỏi bảng attachments; số trên từng thẻ vẫn đúng', async () => {
    const cap = conn.prepare(
      `SELECT student_id, cycle_id FROM sos_cases GROUP BY student_id, cycle_id HAVING COUNT(*) >= 2 ORDER BY student_id LIMIT 1`,
    ).get() as any;
    assert(cap, 'Bộ demo phải có một em có ít nhất hai Case');
    let bang: any = null;
    const n = await demCauHoi(/FROM attachments/, () => { bang = casesMod.skillSupportBoard(P.admin, cap.student_id, cap.cycle_id); });
    const the = bang.rows.flatMap((r: any) => r.cases) as any[];
    assert(the.length >= 2, `Bảng chỉ có ${the.length} thẻ`);
    assert(n === 1, `Đếm bằng chứng ${n} câu cho ${the.length} thẻ`);
    const dem = (id: number) => (conn.prepare("SELECT COUNT(*) n FROM attachments WHERE owner_type = 'sos_case' AND owner_id = ?").get(id) as any).n;
    for (const c of the) assert(c.attachmentCount === dem(c.id), `Case ${c.id}: ${c.attachmentCount} ≠ ${dem(c.id)}`);
    assert(casesMod.demBangChungCase([]).size === 0, 'Danh sách rỗng phải trả bản đếm rỗng, không hỏi database');
  });

  // ================================================================== 9. RB-1 — chốt "-" định kỳ

  console.log('\nPR-AN · 9. Chốt "-" tự chạy đầu thứ Hai kể cả khi không ai mở web (4.6)');
  const cv = await load('../ops/chotVangDinhKy.ts');
  const utilMod: any = await import('../util.ts');
  const weekMod: any = await import('../platform/week.ts');
  const skillScheduleMod: any = await import('../fasttrack/skillSchedule.ts');
  const attemptsMod: any = await import('../fasttrack/attempts.ts');

  check('RB-1 · chotVangDinhKy gọi đúng settleNoShows(ngày); không truyền ngày thì dùng NGÀY THẬT giờ Việt Nam; database chưa khởi tạo thì bỏ qua, không gọi', () => {
    let nhan: string | null = null;
    const a = cv.chotVangDinhKy({ ngay: '2026-09-21', chot: (d: string) => { nhan = d; return 3; }, daKhoiTao: () => true });
    assert(nhan === '2026-09-21' && a.daChot === 3 && a.boQua === null && a.ngay === '2026-09-21', JSON.stringify(a));
    nhan = null;
    cv.chotVangDinhKy({ chot: (d: string) => { nhan = d; return 0; }, daKhoiTao: () => true });
    assert(nhan === utilMod.todayInBusinessTz(), `Ngày mặc định ${nhan}, ngày thật ${utilMod.todayInBusinessTz()}`);
    let goi = 0;
    const b = cv.chotVangDinhKy({ chot: () => { goi += 1; return 0; }, daKhoiTao: () => false });
    assert(goi === 0 && b.boQua === 'chua-khoi-tao' && b.daChot === 0, JSON.stringify(b));
  });

  check('RB-1 · Chạy thật trên database: lần hai cùng ngày không chốt thêm gì (lịch chạy 2 lần mỗi sáng thứ Hai là vô hại)', () => {
    const lan1 = cv.chotVangDinhKy({ ngay: TODAY });
    const lan2 = cv.chotVangDinhKy({ ngay: TODAY });
    assert(lan1.boQua === null && typeof lan1.daChot === 'number', JSON.stringify(lan1));
    assert(lan2.daChot === 0, `Lần hai chốt thêm ${lan2.daChot}`);
  });

  check('PR-Z2c · RB-1 chạy thật với MỘT buổi "-" có thật: chotVangDinhKy trả daChot === 1, buổi thành vắng; lần hai 0 (cả phép chạy trong giao dịch rồi cuộn lại)', () => {
    const now = new Date().toISOString();
    conn.exec('BEGIN');
    try {
      const cid = (conn.prepare(`SELECT id FROM classes WHERE code = 'MB FT 101'`).get() as any).id as number;
      const mb = (conn.prepare(`SELECT id FROM branches WHERE code = 'MB'`).get() as any).id as number;
      const sid = Number(conn.prepare(
        `INSERT INTO students (student_code, full_name, normalized_name, branch_id, status, created_at) VALUES (?,?,?,?, 'active', ?)`,
      ).run('PISA-Z2C-1', 'Học viên Z2c', 'hoc vien z2c', mb, now).lastInsertRowid);
      conn.prepare(`INSERT INTO enrollments (student_id, class_id, status, started_at, created_at) VALUES (?,?, 'active', '2026-07-27', ?)`).run(sid, cid, now);
      const cycleId = Number(conn.prepare(
        `INSERT INTO learning_cycles (student_id, seq, route, programme_code, started_at, status, created_at) VALUES (?, 1, 'LT1', NULL, '2026-07-27', 'active', ?)`,
      ).run(sid, now).lastInsertRowid);
      /* Tuần 07–13/09 (đã hết trước TODAY = 14/09): phép kiểm ngay trên đã chốt mọi "-" có week_end < TODAY, nên chỉ còn buổi này. */
      const periodId = weekMod.ensurePeriod('2026-09-07').id;
      const attemptId = Number(conn.prepare(
        `INSERT INTO assessment_attempts (cycle_id, student_id, attempt_no, kind, class_id, planned_period_id, status, created_at)
         VALUES (?,?,1,'mock',?,?, 'planned', ?)`,
      ).run(cycleId, sid, cid, periodId, now).lastInsertRowid);
      skillScheduleMod.ensureSkillRows(attemptId);
      attemptsMod.saveScore(P.lrTeacher, attemptId, 'listening', { noShow: true }, '2026-09-09');
      const kq = cv.chotVangDinhKy({ ngay: TODAY });
      assert(kq.boQua === null && kq.daChot === 1, `Phải chốt đúng 1 buổi: ${JSON.stringify(kq)}`);
      /* PR-MT (Q-A, chủ sản phẩm chọn 29/09): chốt xong máy tự dời lần 1 TRONG CÙNG giao dịch cron — bài sang tuần 14/09, đếm vắng = 1. */
      const s = conn.prepare(`SELECT sit_status, absent_from_no_show AS co, absence_move_count AS lan FROM attempt_skills WHERE attempt_id = ? AND skill = 'listening'`).get(attemptId) as any;
      assert(s.sit_status === 'scheduled' && s.co === 0 && s.lan === 1, `Buổi Listening: ${JSON.stringify(s)}`);
      assert(cv.chotVangDinhKy({ ngay: TODAY }).daChot === 0, 'Lần hai lại chốt thêm');
    } finally { if (conn.inTransaction) conn.exec('ROLLBACK'); }
  });

  check('RB-1 · netlify.toml hẹn hàm chot-vang đúng lịch 00:05 và 06:05 sáng thứ Hai giờ VN; hàm tự bật chế độ bản chính và chỉ gọi chotVangDinhKy', () => {
    const toml = fsMod.readFileSync(pathMod.join(REPO, 'netlify.toml'), 'utf8');
    const khoi = /\[functions\."chot-vang"\][^[]*schedule\s*=\s*"([^"]+)"/.exec(toml);
    assert(khoi && khoi[1] === cv.LICH_CHOT_VANG && cv.LICH_CHOT_VANG === '5 17,23 * * 0', `Lịch trong toml: ${khoi?.[1]}`);
    const ham = fsMod.readFileSync(pathMod.join(REPO, 'netlify/functions/chot-vang.ts'), 'utf8');
    assert(/process\.env\.BAN_CHINH\s*=\s*'1'/.test(ham) && /chotVangDinhKy\(\)/.test(ham), 'Hàm chot-vang phải đặt BAN_CHINH=1 và gọi chotVangDinhKy()');
    assert(!/settleNoShows/.test(ham), 'Hàm Netlify không gọi thẳng settleNoShows — đi qua chotVangDinhKy');
  });

  // ================================================================== PR-Z2c-b · Mất luồng Turso ("stream not found")

  console.log('\nPR-Z2c-b · Mất luồng Turso: GET mở lại kết nối và thử lại đúng một lần; ghi thì không');
  /* `dbMod`, `appMod` đã import ở phần AN-4/AN-5 phía trên. */
  /** Đúng dạng lỗi đã gặp trên bản nháp 23/09 (log `mã 17476fd8`). */
  const LOI_LUONG = 'Hrana(Api("status=404 Not Found, body={\\"error\\":\\"stream not found: 196a113c:65993a\\"}"))';
  /**
   * Gài lỗi vào `prepare` của kết nối đang dùng: câu SQL khớp `khop` ném `loi` ở lần khớp thứ nhất, các lần sau chạy thật.
   * Sau fn: gỡ chỗ gài, đóng kết nối mới (nếu máy chủ đã mở lại) và đặt lại kết nối cũ — các phép sau dùng `conn` của harness.
   */
  const giaLoi = async <T>(khop: RegExp, loi: string, fn: (cu: any) => Promise<T>): Promise<{ kq: T; log: string; moLai: boolean }> => {
    const cu = dbMod.db();
    const goc = cu.prepare;
    let daNem = false;
    cu.prepare = function (this: unknown, ...a: unknown[]) {
      if (!daNem && khop.test(String(a[0]))) { daNem = true; throw new Error(loi); }
      return goc.apply(this, a);
    };
    try {
      const { kq, log } = await batLog(() => fn(cu));
      return { kq, log, moLai: dbMod.db() !== cu };
    } finally {
      delete cu.prepare;
      const moi = dbMod.db();
      if (moi !== cu) { try { moi.close(); } catch { /* đã đóng */ } }
      dbMod.datKetNoiChoPhepKiem(cu);
    }
  };
  const tkLuong = taoTaiKhoan('anz2b.luong');
  const cookieLuong = String((await dangNhap(tkLuong, '203.0.113.61')).setCookie).split(';')[0];

  await checkAsync('Z2c-b · GET mất luồng ở bước kiểm phiên (attachPrincipal) → mở lại kết nối, thử lại một lần → 200 vẫn đăng nhập; log đúng một dòng [turso]', async () => {
    const { kq: r, log, moLai } = await giaLoi(/FROM demo_sessions/, LOI_LUONG, () => goi('GET', '/demo/session', { cookie: cookieLuong }));
    assert(r.status === 200 && r.json?.authenticated === true && r.json?.user?.fullName === 'Thử anz2b.luong',
      `Phải vẫn đăng nhập (không coi là đã đăng xuất): ${r.status} ${JSON.stringify(r.json).slice(0, 160)}`);
    assert(moLai, 'Phải bỏ kết nối cũ và mở kết nối mới');
    assert((log.match(/\[turso\]/g) ?? []).length === 1 && /GET \/api\/demo\/session/.test(log), `Log: ${log}`);
  });

  await checkAsync('Z2c-b · GET mất luồng ở câu SQL của chính trang (/ref/branches) → thử lại một lần → 200 đúng danh sách chi nhánh', async () => {
    const mau = await goi('GET', '/ref/branches', { cookie: cookieLuong });
    const { kq: r, log, moLai } = await giaLoi(/FROM branches WHERE status='active'/, LOI_LUONG, () => goi('GET', '/ref/branches', { cookie: cookieLuong }));
    assert(mau.status === 200 && r.status === 200 && JSON.stringify(r.json) === JSON.stringify(mau.json), `${r.status} ${JSON.stringify(r.json).slice(0, 160)}`);
    assert(moLai && (log.match(/\[turso\]/g) ?? []).length === 1, `moLai=${moLai} log: ${log}`);
  });

  await checkAsync('Z2c-b · GET gặp lỗi KHÁC (không phải mất luồng) → vẫn 500 "Có lỗi · mã …", không thử lại, không mở lại kết nối', async () => {
    const { kq: r, log, moLai } = await giaLoi(/FROM branches WHERE status='active'/, 'SQLITE_IOERR: hỏng đĩa giả', () => goi('GET', '/ref/branches', { cookie: cookieLuong }));
    assert(r.status === 500 && /Có lỗi · mã/.test(r.json?.error ?? ''), `${r.status} ${JSON.stringify(r.json)}`);
    assert(!moLai && !/\[turso\]/.test(log) && /hỏng đĩa giả/.test(log), `moLai=${moLai} log: ${log}`);
  });

  await checkAsync('PR-PH · lỗi Turso KHÁC "stream not found" ở bước kiểm phiên → 500 có mã, KHÔNG phải 401 "đăng nhập lại", KHÔNG phải authenticated:false', async () => {
    for (const loi of ['Hrana(Http("error sending request for url"))', 'SQLITE_IOERR: hỏng đĩa giả', 'fetch failed: ECONNRESET']) {
      const { kq: s } = await giaLoi(/FROM demo_sessions/, loi, () => goi('GET', '/demo/session', { cookie: cookieLuong }));
      assert(s.status === 500 && /Có lỗi · mã/.test(s.json?.error ?? ''), `/demo/session với "${loi}": ${s.status} ${JSON.stringify(s.json)}`);
      const { kq: r } = await giaLoi(/FROM demo_sessions/, loi, () => goi('GET', '/ref/branches', { cookie: cookieLuong }));
      assert(r.status === 500 && !/đăng nhập/i.test(r.json?.error ?? ''), `/ref/branches với "${loi}": ${r.status} ${JSON.stringify(r.json)}`);
    }
  });

  await checkAsync('PR-PH · không có cookie / cookie sai vẫn là 401 (không đổi hành vi đúng)', async () => {
    const r = await goi('GET', '/ref/branches', { cookie: 'pisa_demo_session=khong-ton-tai' });
    assert(r.status === 401 && /đăng nhập/i.test(r.json?.error ?? ''), `${r.status} ${JSON.stringify(r.json)}`);
    const s = await goi('GET', '/demo/session', { cookie: 'pisa_demo_session=khong-ton-tai' });
    assert(s.status === 200 && s.json?.authenticated === false, `${s.status} ${JSON.stringify(s.json)}`);
  });

  await checkAsync('PR-PH · mọi phản hồi /api có Cache-Control: no-store (phiên không bị cache ở trình duyệt/CDN)', async () => {
    const r = await goi('GET', '/demo/session', { cookie: cookieLuong });
    assert(/no-store/.test(String(r.cacheControl ?? '')), `cache-control: ${r.cacheControl}`);
  });

  await checkAsync('Z2c-b/c · POST mất luồng → KHÔNG thử lại (tránh ghi hai lần): 500 có mã, không ghi dòng nào — nhưng VẪN bỏ kết nối chết (A2), log một dòng [turso] "KHÔNG thử lại"', async () => {
    const tk = taoTaiKhoan('anz2b.post');
    const dem = () => JSON.stringify([
      (conn.prepare('SELECT COUNT(*) n FROM auth_attempts').get() as any).n,
      (conn.prepare('SELECT COUNT(*) n FROM demo_sessions').get() as any).n,
    ]);
    const truoc = dem();
    const { kq: r, log, moLai } = await giaLoi(/auth_attempts/, LOI_LUONG, () => dangNhap(tk, '203.0.113.62'));
    assert(r.status === 500 && /Có lỗi · mã/.test(r.json?.error ?? '') && !r.setCookie, `${r.status} ${JSON.stringify(r.json)}`);
    assert(moLai, 'POST mất luồng phải bỏ kết nối chết — giữ lại thì lời gọi sau cũng hỏng');
    assert((log.match(/\[turso\]/g) ?? []).length === 1 && /KHÔNG thử lại POST \/api\/auth\/login/.test(log), `Log: ${log}`);
    assert(dem() === truoc, `Đã ghi: ${truoc} → ${dem()}`);
  });

  check('Z2c-b/c · Lỗi mất luồng xảy ra TRONG giao dịch (tx) được đánh dấu → bộ thử lại bỏ qua kể cả với GET, nhưng vẫn bỏ kết nối chết (A2); lỗi thường không bị nhận nhầm', () => {
    let trong: unknown = null;
    try { dbMod.tx(() => { throw new Error(LOI_LUONG); }); } catch (e) { trong = e; }
    assert(dbMod.laLoiMatLuongTurso(trong) && dbMod.loiTrongGiaoDich(trong), 'Lỗi ném trong tx phải được nhận là mất luồng VÀ trong giao dịch');
    const ngoai = new Error(LOI_LUONG);
    assert(dbMod.laLoiMatLuongTurso(ngoai) && !dbMod.loiTrongGiaoDich(ngoai), 'Lỗi ngoài tx không mang dấu giao dịch');
    assert(!dbMod.laLoiMatLuongTurso(new Error('SQLITE_BUSY: database is locked')) && !dbMod.laLoiMatLuongTurso(null), 'Lỗi khác không phải mất luồng');
    let goiLai = 0;
    let chuyenTiep: unknown = null;
    const thuLai = appMod.thuLaiKhiMatLuong(() => { goiLai++; });
    const cu = dbMod.db();
    let moLai = false;
    try {
      thuLai(trong, { method: 'GET', path: '/x' }, { headersSent: false }, (e: unknown) => { chuyenTiep = e; });
      moLai = dbMod.db() !== cu;
    } finally {
      const moi = dbMod.db();
      if (moi !== cu) { try { moi.close(); } catch { /* đã đóng */ } }
      dbMod.datKetNoiChoPhepKiem(cu);
    }
    assert(goiLai === 0 && chuyenTiep === trong, `GET nhưng lỗi trong giao dịch: không được chạy lại (goiLai=${goiLai})`);
    assert(moLai, 'Lỗi mất luồng trong tx: không thử lại nhưng phải bỏ kết nối chết');
  });

  check('Z2c-c · Lỗi KHÁC ở POST / trong tx → không đụng kết nối (chỉ lỗi mất luồng mới bỏ kết nối)', () => {
    const cu = dbMod.db();
    let trong: unknown = null;
    try { dbMod.tx(() => { throw new Error('SQLITE_IOERR: hỏng đĩa giả'); }); } catch (e) { trong = e; }
    const thuLai = appMod.thuLaiKhiMatLuong(() => { throw new Error('không được gọi'); });
    let chuyenTiep: unknown = null;
    thuLai(trong, { method: 'POST', path: '/x' }, { headersSent: false }, (e: unknown) => { chuyenTiep = e; });
    const moLai = dbMod.db() !== cu;
    if (moLai) dbMod.datKetNoiChoPhepKiem(cu);
    assert(chuyenTiep === trong && !moLai, `chuyenTiep đúng=${chuyenTiep === trong} moLai=${moLai}`);
  });

  // ================================================================== PR-Z2c-d · Ghi đồng thời ("database is locked")

  console.log('\nPR-Z2c-d · Ghi đồng thời: người khác đang ghi thì CHỜ khoá, không báo "database is locked"');
  /*
   * Bản chính 24/09 (log `mã 77e7df8f`): gõ L rồi Tab sang R → hai lần lưu gần như cùng lúc, hai bản hàm Netlify, hai giao dịch
   * Turso. Giao dịch mở bằng BEGIN thường chỉ xin khoá ghi ở câu ghi đầu tiên — lúc đó bên kia đang giữ khoá nên SQLite trả
   * SQLITE_BUSY NGAY (không chờ được khi nâng từ đọc lên ghi). Tái hiện bằng một tiến trình con giữ khoá ghi trên CÙNG file.
   */
  const cp = await import('node:child_process');
  conn.exec('CREATE TABLE IF NOT EXISTS _thu_khoa (ai TEXT)');
  const demKhoa = (ai: string) => (conn.prepare('SELECT COUNT(*) n FROM _thu_khoa WHERE ai = ?').get(ai) as any).n as number;
  /** Tiến trình con mở cùng file database, giữ khoá ghi `giuMs` ms rồi chốt. Trả khi nó ĐÃ giữ khoá. */
  const giuKhoa = async (giuMs: number) => {
    const con = cp.spawn(process.execPath, ['-e', `
      const D = require('libsql'); const d = new D(process.argv[1]);
      d.exec('BEGIN IMMEDIATE'); d.prepare('INSERT INTO _thu_khoa (ai) VALUES (?)').run('con');
      process.stdout.write('giu\\n');
      setTimeout(() => { d.exec('COMMIT'); d.close(); }, Number(process.argv[2]));
    `, dbMod.DB_PATH, String(giuMs)], { stdio: ['ignore', 'pipe', 'inherit'] });
    await new Promise<void>((ok, loi) => {
      con.stdout!.once('data', () => ok());
      con.once('exit', (c) => loi(new Error(`tiến trình giữ khoá thoát sớm (${c})`)));
    });
    const xong = new Promise<void>((ok) => { if (con.exitCode !== null) ok(); else con.once('exit', () => ok()); });
    return { xong };
  };

  await checkAsync('Z2c-d · tx() khi tiến trình khác đang giữ khoá ghi: CHỜ tới khi được rồi ghi — không ném SQLITE_BUSY (đọc trước, ghi sau)', async () => {
    const { xong } = await giuKhoa(800);
    const truoc = demKhoa('cha');
    let loi: unknown = null;
    const { log } = await batLog(async () => {
      try {
        dbMod.tx(() => {
          conn.prepare('SELECT COUNT(*) n FROM _thu_khoa').get();          // đọc trước — đúng khuôn saveScore
          conn.prepare('INSERT INTO _thu_khoa (ai) VALUES (?)').run('cha');
        });
      } catch (e) { loi = e; }
    });
    await xong;
    assert(!loi, `tx phải chờ khoá rồi ghi được, đang ném: ${(loi as Error)?.message}`);
    assert(demKhoa('cha') === truoc + 1 && demKhoa('con') >= 1, 'Cả hai lần ghi phải còn');
    assert(/\[turso\] chờ khoá ghi/.test(log), `Phải có một dòng log [turso] chờ khoá ghi: ${log}`);
  });

  await checkAsync('Z2c-d · Ghi lẻ một câu (ngoài tx, ví dụ mốc dùng phiên) khi tiến trình khác đang giữ khoá: chờ rồi ghi', async () => {
    const { xong } = await giuKhoa(600);
    const truoc = demKhoa('le');
    let loi: unknown = null;
    try { conn.prepare('INSERT INTO _thu_khoa (ai) VALUES (?)').run('le'); } catch (e) { loi = e; }
    await xong;
    assert(!loi && demKhoa('le') === truoc + 1, `Ghi lẻ phải chờ khoá, đang ném: ${(loi as Error)?.message}`);
  });

  await checkAsync('Z2c-d · Bận quá lâu → 503 "Máy chủ đang bận, chưa lưu gì" (không treo, không ghi dở)', async () => {
    const { xong } = await giuKhoa(dbMod.CHO_KHOA_GHI_MS + 1500);
    const truoc = demKhoa('lau');
    const batDau = Date.now();
    let loi: any = null;
    try { dbMod.tx(() => { conn.prepare('INSERT INTO _thu_khoa (ai) VALUES (?)').run('lau'); }); } catch (e) { loi = e; }
    const ms = Date.now() - batDau;
    await xong;
    assert(loi?.status === 503 && /đang bận, chưa lưu gì/.test(loi.message), `Phải 503 câu "đang bận": ${loi?.status} ${loi?.message}`);
    assert(ms >= dbMod.CHO_KHOA_GHI_MS - 200 && ms < dbMod.CHO_KHOA_GHI_MS + 1200, `Phải bỏ cuộc đúng hạn chờ, mất ${ms} ms`);
    assert(demKhoa('lau') === truoc && !conn.inTransaction, 'Không được ghi dở, không để giao dịch treo');
  });

  await checkAsync('Z2c-d · Mốc "dùng phiên cuối" chỉ ghi lại khi đã cũ hơn 10 phút — mở trang không ghi database mỗi lần', async () => {
    const tk = taoTaiKhoan('anz2d.phien');
    const ck = String((await dangNhap(tk, '203.0.113.71')).setCookie).split(';')[0];
    const token = decodeURIComponent(ck.split('=')[1]);
    const moc = (phut: number) => new Date(Date.now() - phut * 60_000).toISOString();
    const docMoc = () => (conn.prepare('SELECT last_seen_at FROM demo_sessions WHERE token = ?').get(token) as any)?.last_seen_at as string;
    conn.prepare('UPDATE demo_sessions SET last_seen_at = ? WHERE token = ?').run(moc(3), token);
    const giu = docMoc();
    const r1 = await goi('GET', '/demo/session', { cookie: ck });
    assert(r1.status === 200 && r1.json?.authenticated === true && docMoc() === giu, `3 phút: không ghi lại (${giu} → ${docMoc()})`);
    conn.prepare('UPDATE demo_sessions SET last_seen_at = ? WHERE token = ?').run(moc(11), token);
    const r2 = await goi('GET', '/demo/session', { cookie: ck });
    assert(r2.status === 200 && Date.now() - Date.parse(docMoc()) < 60_000, `11 phút: phải ghi lại mốc mới (${docMoc()})`);
  });

  // ------------------------------------------------------------------ PR-Z2c-e (góp ý rà #91)

  const hanGioMod: any = await import('../platform/hanGio.ts');

  await checkAsync('Z2c-e · Kiểm phiên gặp 503 "đang bận" (chờ khoá quá hạn) → trả 503, KHÔNG coi là chưa đăng nhập', async () => {
    const tk = taoTaiKhoan('anz2e.ban');
    const ck = String((await dangNhap(tk, '203.0.113.72')).setCookie).split(';')[0];
    const token = decodeURIComponent(ck.split('=')[1]);
    /* Mốc cũ hơn 10 phút → kiểm phiên phải ghi lại — đúng câu có thể phải chờ khoá. */
    conn.prepare('UPDATE demo_sessions SET last_seen_at = ? WHERE token = ?').run(new Date(Date.now() - 11 * 60_000).toISOString(), token);
    const goc = conn.prepare;
    conn.prepare = function (this: unknown, sql: string, ...r: unknown[]) {
      if (/UPDATE demo_sessions SET last_seen_at/.test(String(sql))) throw new LoiHttp(503, 'Máy chủ đang bận, chưa lưu gì. Thử lại sau ít phút.');
      return goc.call(this, sql, ...r);
    };
    let r: any;
    try { r = await goi('GET', '/demo/session', { cookie: ck }); } finally { delete (conn as any).prepare; }
    assert(r.status === 503 && /đang bận/.test(r.json?.error ?? ''), `Phải 503 "đang bận", đang ra ${r.status} ${JSON.stringify(r.json).slice(0, 120)}`);
  });

  check('Z2c-e · Có khoá ghi rồi mà lời gọi chỉ còn < 1,5 s (Turso chờ khoá ngay ở BEGIN IMMEDIATE) → ROLLBACK + 503, fn không chạy', () => {
    const ngu = (ms: number) => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
    const goc = conn.exec;
    conn.exec = function (this: unknown, sql: string) {
      if (/BEGIN IMMEDIATE/.test(String(sql))) ngu(1200);   // giả Turso giữ câu BEGIN IMMEDIATE 1,2 s chờ khoá
      return goc.call(this, sql);
    };
    const truoc = demKhoa('sat-han');
    let chay = false;
    let loi: any = null;
    try {
      hanGioMod.chayVoiHan(Date.now() + 2_600, () => dbMod.tx(() => {
        chay = true;
        conn.prepare('INSERT INTO _thu_khoa (ai) VALUES (?)').run('sat-han');
      }));
    } catch (e) { loi = e; } finally { delete (conn as any).exec; }
    assert(loi?.status === 503 && /đang bận, chưa lưu gì/.test(loi.message ?? ''), `Phải 503: ${loi?.status} ${loi?.message}`);
    assert(!chay && demKhoa('sat-han') === truoc && !conn.inTransaction, `fn không được chạy (chay=${chay}), không ghi, không để giao dịch treo`);
  });

  conn.exec('DROP TABLE IF EXISTS _thu_khoa');

  // ================================================================== PR-XOA-b · Tham số đặt tên ("@s") — Turso không nhận

  check('XOA-b · Truyền tham số ĐẶT TÊN ({ s: 1 } cho @s/:s/$s) → ném lỗi ngay ở máy dev (Turso qua mạng lặng lẽ bỏ qua → câu chạy như NULL)', () => {
    /* Bản nháp 24/09: libsql nối Turso bỏ qua MỌI tham số đặt tên — `WHERE id = @s` + `{ s: 3 }` ra không dòng nào, nên "Xoá học viên"
       luôn báo "Không tìm thấy". File cục bộ thì nhận, nên phép kiểm không bao giờ đỏ. Chặn ở lớp kết nối: dùng `?`/`?1`. */
    for (const [sql, goi] of [
      ['SELECT 1 AS x WHERE @s = 1', (st: any) => st.get({ s: 1 })],
      ['SELECT 1 AS x WHERE :s = 1', (st: any) => st.all({ s: 1 })],
      ['SELECT 1 AS x WHERE $s = 1', (st: any) => st.run({ s: 1 })],
    ] as const) {
      assertThrows(() => goi(conn.prepare(sql)), /tham số đặt tên/, `Phải chặn tham số đặt tên: ${sql}`);
    }
    const r = conn.prepare('SELECT ?1 AS a, ?1 AS b, ?2 AS c').get(7, 'x') as any;
    assert(r.a === 7 && r.b === 7 && r.c === 'x', `Tham số đánh số vẫn chạy: ${JSON.stringify(r)}`);
  });

  const xtkMod: any = await import('../platform/xoaTaiKhoan.ts');
  check('XOA-b · Câu đếm dấu vết tài khoản chia nhóm ≤ 20 vế UNION ALL (Turso từ chối câu gộp quá ~50 vế) và vẫn phủ đủ mọi cột', () => {
    const ve = xtkMod.CAU_DAU_VET.map((c: string) => c.split('UNION ALL').length);
    assert(ve.every((n: number) => n <= xtkMod.VE_TOI_DA_MOT_CAU), `Có câu quá ${xtkMod.VE_TOI_DA_MOT_CAU} vế: ${ve.join(', ')}`);
    assert(ve.length >= 2 && ve.reduce((a: number, b: number) => a + b, 0) >= 40, `Số vế lạ (${ve.join('+')}) — mất cột dấu vết?`);
  });

  // ---- các task sau thêm phép kiểm NGAY TRÊN dòng này ----

  may.close();
  /* Dọn: không để lại lần thử nào cho file khác (bảng chưa có thì bỏ qua — chỉ xảy ra ở bước đỏ của Task 1). */
  try { conn.prepare('DELETE FROM auth_attempts').run(); } catch { /* bảng chưa có */ }
}
