/**
 * PHÉP KIỂM PR-EN (bản tiếng Anh cho GV nước ngoài, kế hoạch docs/superpowers/plans/2026-10-07-pr-en-tieng-anh.md):
 *   E-KHOA  mọi khoá VI có EN, không rỗng, cùng tập {biến}; EN ≠ VI trừ chữ giữ nguyên (mã, tên riêng).
 *   E-NN    ngôn ngữ lưu theo tài khoản: PATCH /me/profile { ngonNgu } → GET /demo/session; giá trị lạ → 400; chỉ sửa chính mình;
 *           migrate prEn chạy lặp được.
 *   E-LOI   lỗi có khoá: `loi()` → JSON { error: <vi>, khoa, bien }; 500 có khoá chung.coLoi + bien.ma; mọi khoá dùng trong server có trong từ điển.
 *   E-NGUON file đã dịch của đợt không còn chữ Việt hiện ra ngoài từ điển (AST, dùng lại scripts/quet-chu.mjs).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

export async function runPrEnTests(t: any) {
  const { check, checkAsync, assert, conn, P } = t;
  const i18n: any = await import('../../../shared/i18n/index.ts');
  const { VI } = await import('../../../shared/i18n/vi.ts');
  const { EN } = await import('../../../shared/i18n/en.ts');
  const { migratePrEn } = await import('../migrate/prEn.ts');
  const { createApp } = await import('../app.ts');
  const util: any = await import('../util.ts');
  console.log('\nPR-EN · từ điển hai tiếng · nhớ ngôn ngữ theo tài khoản · mã lỗi · quét nguồn');

  const bienCua = (s: string) => new Set([...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]));
  /* Chữ giữ nguyên ở EN (THUAT_NGU_EN luật 3): mã, tên riêng, chữ đã là tiếng Anh ở bản Việt. */
  const GIU = new Set(['PISA Tracking', 'PISA', 'Progress Test', 'Final Test', 'Mock Test', 'Band', 'OVR', 'Target', 'Case', 'PA', 'Email', 'Fast Track', 'Admin', 'OK']);

  check('EN-KHOA · mọi khoá VI có EN không rỗng, cùng {biến}, không còn "{" sau khi thay; EN khác VI trừ chữ giữ nguyên', () => {
    const vi = VI as Record<string, string>;
    const en = EN as Record<string, string | ((b: Record<string, unknown>) => string)>;
    const loi: string[] = [];
    for (const k of Object.keys(vi)) {
      const e = en[k];
      if (e === undefined || e === '') { loi.push(`${k}: thiếu EN`); continue; }
      const bv = bienCua(vi[k]);
      const mau = Object.fromEntries([...bv].map((b, i) => [b, i + 2]));
      const ra = i18n.dichSang('en', k, mau) as string;
      if (/\{\w+\}/.test(ra)) loi.push(`${k}: còn biến sau khi thay "${ra}"`);
      if (typeof e === 'string') {
        const be = bienCua(e);
        if ([...bv].sort().join() !== [...be].sort().join()) loi.push(`${k}: biến VI {${[...bv]}} ≠ EN {${[...be]}}`);
      }
      if (typeof e === 'string' && e === vi[k] && !GIU.has(vi[k]) && /[^\x00-\x7F]/.test(vi[k])) loi.push(`${k}: EN chép nguyên chữ Việt`);
    }
    for (const k of Object.keys(en)) if (!(k in vi)) loi.push(`${k}: EN thừa khoá`);
    assert(loi.length === 0, loi.slice(0, 10).join(' · '));
    assert(i18n.dichSang('vi', 'chung.luu') === 'Lưu' && i18n.dichSang('en', 'chung.luu') === 'Save', 'khoá mẫu chung.luu');
    assert(i18n.t('chung.luu') === 'Lưu', 'máy chủ (không có document) luôn ra chữ Việt');
    assert(i18n.dichSang('en', 'khong.co.khoa' as any) === 'khong.co.khoa', 'khoá lạ → trả nguyên khoá, không ném');
  });

  check('EN-KHOA · số ít / số nhiều ở EN ("1 day overdue" / "3 days overdue"), VI giữ chữ cũ', () => {
    assert(i18n.dichSang('en', 'chung.quaHanNgay', { n: 1 }) === '1 day overdue', String(i18n.dichSang('en', 'chung.quaHanNgay', { n: 1 })));
    assert(i18n.dichSang('en', 'chung.quaHanNgay', { n: 3 }) === '3 days overdue', String(i18n.dichSang('en', 'chung.quaHanNgay', { n: 3 })));
    assert(i18n.dichSang('vi', 'chung.quaHanNgay', { n: 3 }) === 'quá hạn 3 ngày', String(i18n.dichSang('vi', 'chung.quaHanNgay', { n: 3 })));
  });

  /* ---------------------------------------------------------------- E-NN */
  async function voiMay(fn: (goi: (userId: number, url: string, init?: RequestInit) => Promise<Response>) => Promise<void>) {
    const may = createApp().listen(0);
    const cong = (may.address() as any).port as number;
    const phien = new Map<number, string>();
    const goi = async (userId: number, url: string, init: RequestInit = {}) => {
      if (!phien.has(userId)) {
        const s = await fetch(`http://127.0.0.1:${cong}/api/demo/session`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ userId }) });
        phien.set(userId, (s.headers.get('set-cookie') ?? '').split(';')[0]);
      }
      return fetch(`http://127.0.0.1:${cong}/api${url}`, { ...init, headers: { 'content-type': 'application/json', cookie: phien.get(userId)!, ...(init.headers ?? {}) } });
    };
    try { await fn(goi); } finally { may.close(); }
  }
  const GV = P.coreTeacher.userId as number;
  const GV2 = P.subjectTeacher.userId as number;
  const nnCua = (id: number) => (conn.prepare('SELECT ngon_ngu FROM users WHERE id = ?').get(id) as any).ngon_ngu as string | null;

  await checkAsync('EN-NN · PATCH /me/profile { ngonNgu } lưu theo tài khoản; /demo/session trả lại; "fr" → 400; người khác không đổi', async () => {
    const truoc = nnCua(GV2);
    try {
      await voiMay(async (goi) => {
        const s0 = (await (await goi(GV, '/demo/session')).json()) as any;
        assert(s0.ngonNgu === null, `chưa chọn → null (đang ${JSON.stringify(s0.ngonNgu)})`);
        const r = await goi(GV, '/me/profile', { method: 'PATCH', body: JSON.stringify({ ngonNgu: 'en' }) });
        assert(r.status === 200, `PATCH en → ${r.status}`);
        assert(nnCua(GV) === 'en', 'cột users.ngon_ngu = en');
        const s1 = (await (await goi(GV, '/demo/session')).json()) as any;
        assert(s1.ngonNgu === 'en', `session.ngonNgu = ${s1.ngonNgu}`);
        const sai = await goi(GV, '/me/profile', { method: 'PATCH', body: JSON.stringify({ ngonNgu: 'fr' }) });
        const jSai: any = await sai.json();
        assert(sai.status === 400 && jSai.khoa === 'loi.ngonNguKhongHopLe', `"fr" → ${sai.status} ${JSON.stringify(jSai)}`);
        assert(nnCua(GV) === 'en', '"fr" không ghi');
        assert(nnCua(GV2) === truoc, 'tài khoản khác không đổi');
        const ve = await goi(GV, '/me/profile', { method: 'PATCH', body: JSON.stringify({ ngonNgu: 'vi' }) });
        assert(ve.status === 200 && nnCua(GV) === 'vi', 'về vi');
      });
    } finally { conn.prepare('UPDATE users SET ngon_ngu = NULL WHERE id = ?').run(GV); }
  });

  check('EN-NN · migrate prEn chạy hai lần không lỗi, lần hai không làm gì', () => {
    const a: string[] = [];
    migratePrEn(conn, a);
    migratePrEn(conn, a);
    assert(a.length === 0, `DB test đã có cột → không thêm gì (${a.join(' · ')})`);
    const cot = new Set((conn.prepare("SELECT name FROM pragma_table_info('users')").all() as any[]).map((c) => c.name));
    assert(cot.has('ngon_ngu'), 'users.ngon_ngu');
  });

  /* ---------------------------------------------------------------- E-LOI */
  check('EN-LOI · loi(status, khoa, bien) → HttpError: câu Việt từ từ điển + khoa + bien', () => {
    const e = util.loi(400, 'loi.toiDaKyTu', { ten: 'Họ tên', toiDa: 100, n: 120 });
    assert(e instanceof util.HttpError && e.status === 400 && e.khoa === 'loi.toiDaKyTu', 'kiểu, status, khoa');
    assert(e.message === i18n.dichSang('vi', 'loi.toiDaKyTu', { ten: 'Họ tên', toiDa: 100, n: 120 }), `câu Việt: ${e.message}`);
    assert(!/\{/.test(e.message), 'không còn biến');
  });

  await checkAsync('EN-LOI · JSON lỗi trả { error, khoa, bien }; 404 endpoint, JSON hỏng, 500 có khoá chung', async () => {
    await voiMay(async (goi) => {
      const r404 = await goi(GV, '/khong-co-duong-nay');
      const j404: any = await r404.json();
      assert(r404.status === 404 && j404.khoa === 'loi.khongCoEndpoint' && typeof j404.error === 'string', `404: ${JSON.stringify(j404)}`);
      const hong = await goi(GV, '/me/profile', { method: 'PATCH', body: '{hỏng' });
      const jHong: any = await hong.json();
      assert(hong.status === 400 && jHong.khoa === 'loi.duLieuHong', `JSON hỏng: ${JSON.stringify(jHong)}`);
    });
    /* 500: gọi thẳng bộ xử lý lỗi cuối với một lỗi lạ. */
    const { traLoiLoi } = await import('../app.ts');
    let ra: any = null; let st = 0;
    const res: any = { status(s: number) { st = s; return this; }, json(b: unknown) { ra = b; return this; } };
    const goc = console.error; console.error = () => {};
    try { traLoiLoi(new Error('nổ'), { method: 'GET', path: '/x' } as any, res, () => {}); } finally { console.error = goc; }
    assert(st === 500 && ra.khoa === 'loi.coLoi' && ra.bien?.ma === ra.details?.ma && /^[0-9a-f]{8}$/.test(ra.bien.ma), `500: ${JSON.stringify(ra)}`);
  });

  check('EN-LOI · mọi khoá lỗi dùng trong server/src (loi(…, \'…\')) có trong từ điển', () => {
    const goc = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../../server/src');
    const thieu: string[] = [];
    for (const f of fs.readdirSync(goc, { recursive: true }) as string[]) {
      if (!/\.ts$/.test(f) || /tests[\\/]/.test(f)) continue;
      const src = fs.readFileSync(path.join(goc, f), 'utf8');
      for (const m of src.matchAll(/\bloi\(\s*\d{3}\s*,\s*'([\w.]+)'/g)) if (!(m[1] in VI)) thieu.push(`${f}: ${m[1]}`);
    }
    assert(thieu.length === 0, thieu.join(' · '));
  });

  /* ---------------------------------------------------------------- E-NGUON */
  await checkAsync('EN-NGUON · file đã dịch (đợt a) không còn chữ Việt hiện ra ngoài từ điển', async () => {
    const goc = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..');
    const { quetFile } = await import(pathToFileURL(path.join(goc, 'scripts/quet-chu.mjs')).href);
    const ra: any[] = [];
    for (const f of FILE_DA_DICH) quetFile(path.join(goc, f), f, 'en', ra);
    const con = ra.filter((r) => !CHO_PHEP.some((c) => c.file === r.file && c.text.test(r.text)));
    assert(con.length === 0, `${con.length} chữ Việt còn sót: ` + con.slice(0, 8).map((r) => `${r.file}:${r.line} "${r.text}"`).join(' · '));
  });
}

/** Đợt a: file dịch trọn (mỗi đợt thêm file của mình). File dịch một phần (vd `people.ts` — nhãn quyền Quản trị giữ Việt) không vào đây. */
const FILE_DA_DICH = [
  'web/src/App.tsx',
  'web/src/modules/platform/Header.tsx',
  'web/src/modules/platform/WelcomePage.tsx',
  'web/src/modules/platform/ProfilePage.tsx',
  'web/src/ui/CongTacGiaoDien.tsx',
  'web/src/ui/NutNgonNgu.tsx',
  'web/src/ui/KhungPanel.tsx',
  'web/src/ui/Toast.tsx',
  'web/src/ui/ONgay.tsx',
  'web/src/ui/LichNho.tsx',
  'web/src/ui/SaveState.tsx',
  'web/src/ui/Drawer.tsx',
  'web/src/lib/session.tsx',
  'shared/domain/oNgay.ts',
  'shared/domain/chonNgay.ts',
  'shared/domain/loiForm.ts',
  'shared/domain/hienThiNgay.ts',
  'shared/domain/trangThai.ts',
];

/** Chuỗi so khớp dữ liệu (không hiện ra) — giữ Việt có chủ đích. */
const CHO_PHEP: { file: string; text: RegExp }[] = [];
