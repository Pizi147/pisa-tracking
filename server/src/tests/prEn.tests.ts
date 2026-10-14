/**
 * PHÉP KIỂM PR-EN (bản tiếng Anh cho GV nước ngoài, kế hoạch docs/superpowers/plans/2026-10-07-pr-en-tieng-anh.md):
 *   E-KHOA  mọi khoá VI có EN, không rỗng, cùng tập {biến}; EN ≠ VI trừ chữ giữ nguyên (mã, tên riêng).
 *   E-NN    ngôn ngữ lưu theo tài khoản: PATCH /me/profile { ngonNgu } → GET /demo/session; giá trị lạ → 400; chỉ sửa chính mình;
 *           migrate prEn chạy lặp được.
 *   E-LOI   lỗi có khoá: `loi()` → JSON { error: <vi>, khoa, bien }; 500 có khoá chung.coLoi + bien.ma; mọi khoá dùng trong server có trong từ điển.
 *   E-NGUON file đã dịch của đợt không còn chữ Việt hiện ra ngoài từ điển (AST, dùng lại scripts/quet-chu.mjs).
 *   E-MAU   (đợt b) chữ máy chủ ghép sẵn dịch theo MẪU của từ điển (`dichMau` / `dich`): đúng câu, đúng từng đoạn " · ", không khớp nhầm cả câu ghép.
 *   E-VIEC  (đợt b) dòng việc `/my-work` + Lớp tôi dạy của GVCN / GVBM dịch hết — chỉ còn tên, mã lớp, chữ người gõ (giá trị có trong DB).
 *   E-TB    (đợt b) thông báo `/notifications` của GV dịch hết theo cùng luật (thông báo đã lưu cũng dịch — không cần cột khoá).
 */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';

const require_ts = () => createRequire(import.meta.url)('typescript');

export async function runPrEnTests(t: any) {
  const { check, checkAsync, assert, conn, P } = t;
  const i18n: any = await import('../../../shared/i18n/index.ts');
  const { EN } = await import('../../../shared/i18n/en.ts');
  const { migratePrEn } = await import('../migrate/prEn.ts');
  const { createApp } = await import('../app.ts');
  const util: any = await import('../util.ts');
  const { studentProfile } = await import('../students/profile.ts');
  console.log('\nPR-EN · từ điển hai tiếng · nhớ ngôn ngữ theo tài khoản · mã lỗi · quét nguồn');

  const bienCua = (s: string) => [...new Set([...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]))].sort().join();
  /* Chữ giữ nguyên ở EN (THUAT_NGU_EN luật 3): mã, tên riêng — chữ Việt mà bản Anh trùng y nguyên phải nằm đây. */
  const GIU = new Set<string>([]);

  check('EN-KHOA · mọi chữ có bản Anh không rỗng, cùng {biến}, không còn "{" sau khi thay; không chép nguyên chữ Việt', () => {
    const loi: string[] = [];
    for (const [k, e] of Object.entries(EN as Record<string, unknown>)) {
      if (e === '' || (typeof e !== 'string' && typeof e !== 'function')) { loi.push(`"${k}": bản Anh rỗng`); continue; }
      const mau = Object.fromEntries(bienCua(k).split(',').filter(Boolean).map((b, i) => [b, i + 2]));
      const ra = i18n.dichSang('en', k, mau) as string;
      if (/\{\w+\}/.test(ra)) loi.push(`"${k}": còn biến sau khi thay "${ra}"`);
      if (typeof e === 'string' && bienCua(k) !== bienCua(e)) loi.push(`"${k}": biến khác nhau ("${e}")`);
      if (ra === i18n.dichSang('vi', k, mau) && !GIU.has(k)) loi.push(`"${k}": bản Anh trùng chữ Việt`);
      if (/[àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]/i.test(ra.replace(/\d+/g, ''))) loi.push(`"${k}": bản Anh còn dấu Việt "${ra}"`);
    }
    assert(loi.length === 0, loi.slice(0, 10).join(' · '));
    assert(i18n.dichSang('vi', 'Lưu') === 'Lưu' && i18n.dichSang('en', 'Lưu') === 'Save', 'mẫu Lưu');
    assert(i18n.t('Lưu') === 'Lưu', 'máy chủ (không có document) luôn ra chữ Việt');
    assert(i18n.dichSang('en', 'Chữ chưa có bản Anh {x}', { x: 1 }) === 'Chữ chưa có bản Anh 1', 'chưa có bản Anh → chữ Việt, vẫn thay biến');
  });

  check('EN-KHOA · số ít / số nhiều ở EN ("1 day overdue" / "3 days overdue"), VI giữ chữ cũ; biến là chữ Việt có trong từ điển cũng dịch', () => {
    assert(i18n.dichSang('en', 'quá hạn {n} ngày', { n: 1 }) === '1 day overdue', String(i18n.dichSang('en', 'quá hạn {n} ngày', { n: 1 })));
    assert(i18n.dichSang('en', 'quá hạn {n} ngày', { n: 3 }) === '3 days overdue', String(i18n.dichSang('en', 'quá hạn {n} ngày', { n: 3 })));
    assert(i18n.dichSang('vi', 'quá hạn {n} ngày', { n: 3 }) === 'quá hạn 3 ngày', 'VI');
    const k = '{ten}: Tối đa {toiDa} ký tự (đang có {n}).';
    assert(i18n.dichSang('en', k, { ten: 'Họ tên', toiDa: 100, n: 120 }) === 'Full name: max 100 characters (now 120).', String(i18n.dichSang('en', k, { ten: 'Họ tên', toiDa: 100, n: 120 })));
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
        assert(sai.status === 400 && jSai.error === 'Ngôn ngữ không hợp lệ.' && i18n.dichSang('en', jSai.error) === 'Invalid language.', `"fr" → ${sai.status} ${JSON.stringify(jSai)}`);
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
  check('EN-LOI · loi(status, khoa, bien) → HttpError: câu Việt (khoá thay biến) + khoa + bien', () => {
    const k = '{ten}: Tối đa {toiDa} ký tự (đang có {n}).';
    const e = util.loi(400, k, { ten: 'Họ tên', toiDa: 100, n: 120 });
    assert(e instanceof util.HttpError && e.status === 400 && e.khoa === k, 'kiểu, status, khoa');
    assert(e.message === 'Họ tên: Tối đa 100 ký tự (đang có 120).', `câu Việt: ${e.message}`);
  });

  await checkAsync('EN-LOI · JSON lỗi trả { error, khoa, bien }; 404 endpoint, JSON hỏng, 500 có khoá chung', async () => {
    await voiMay(async (goi) => {
      const r404 = await goi(GV, '/khong-co-duong-nay');
      const j404: any = await r404.json();
      assert(r404.status === 404 && j404.error === 'Không tìm thấy endpoint.' && i18n.dichSang('en', j404.error) === 'Endpoint not found.', `404: ${JSON.stringify(j404)}`);
      const hong = await goi(GV, '/me/profile', { method: 'PATCH', body: '{hỏng' });
      const jHong: any = await hong.json();
      assert(hong.status === 400 && i18n.dichSang('en', jHong.error) !== jHong.error, `JSON hỏng có bản Anh: ${JSON.stringify(jHong)}`);
    });
    /* 500: gọi thẳng bộ xử lý lỗi cuối với một lỗi lạ. */
    const { traLoiLoi } = await import('../app.ts');
    let ra: any = null; let st = 0;
    const res: any = { status(s: number) { st = s; return this; }, json(b: unknown) { ra = b; return this; } };
    const goc = console.error; console.error = () => {};
    try { traLoiLoi(new Error('nổ'), { method: 'GET', path: '/x' } as any, res, () => {}); } finally { console.error = goc; }
    assert(st === 500 && ra.khoa in EN && ra.bien?.ma === ra.details?.ma && /^[0-9a-f]{8}$/.test(ra.bien.ma)
      && ra.error === i18n.dichSang('vi', ra.khoa, ra.bien) && i18n.dichSang('en', ra.khoa, ra.bien).startsWith(`Error · code ${ra.bien.ma}.`), `500: ${JSON.stringify(ra)}`);
  });

  check('EN-LOI · mọi khoá lỗi dùng trong server/src (loi(…, \'…\')) có bản Anh', () => {
    const goc = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../../server/src');
    const thieu: string[] = [];
    for (const f of fs.readdirSync(goc, { recursive: true }) as string[]) {
      if (!/\.ts$/.test(f) || /tests[\\/]/.test(f)) continue;
      const src = fs.readFileSync(path.join(goc, f), 'utf8');
      for (const m of src.matchAll(/\bloi\(\s*\d{3}\s*,\s*'([^']+)'/g)) if (!(m[1] in EN)) thieu.push(`${f}: ${m[1]}`);
    }
    assert(thieu.length === 0, thieu.join(' · '));
  });

  /* ---------------------------------------------------------------- E-MAU, E-VIEC, E-TB (đợt b) */
  check('EN-MAU · chữ máy chủ dịch theo mẫu: đúng câu, từng đoạn " · ", biến dịch đệ quy; chưa có mẫu → giữ chữ Việt; không khớp nhầm cả câu', () => {
    const d = (s: string) => i18n.dichMau('en', s) as string;
    const mau: [string, string][] = [
      ['Nhập điểm Listening, Reading', 'Enter scores Listening, Reading'],
      ['Ghi nhận vi phạm mới · MB FT 101 · 3 em', 'Review new incidents · MB FT 101 · 3 students'],
      ['Ghi Mini Test · Vương Bảo Ngọc', 'Record Mini Test · Vương Bảo Ngọc'],
      ['Case mới sau MT2: [MT2] Reading không đạt [SOS 1] · hạn 18/09', 'New case after MT2: [MT2] Reading not passed [SOS 1] · due 18/09'],
      ['Số câu đúng (35) không thể lớn hơn tổng (30).', 'Correct answers (35) cannot exceed the total (30).'],
      ['Đề xuất sửa lộ trình · Nguyễn Minh An', 'Change request pathway · Nguyễn Minh An'],
      ['Chữ chưa có bản Anh · Nguyễn Minh An', 'Chữ chưa có bản Anh · Nguyễn Minh An'],
      ['Nguyễn Minh An', 'Nguyễn Minh An'],
      /* "{size} lớp" (phần chữ ngắn) chỉ nhận số / mã — chữ người gõ kết thúc bằng "của lớp" không bị dịch bừa. */
      ['Bị từ chối: Tuần sau trùng lịch Final của lớp', 'Declined: Tuần sau trùng lịch Final của lớp'],
      ['3 em', '3 students'],
      ['Em ốm, gia đình báo sáng cùng ngày', 'Em ốm, gia đình báo sáng cùng ngày'],
      ['Ghi nhận từ buổi học tuần trước', 'Ghi nhận từ buổi học tuần trước'],
      ['Ghi nhận 14/10 09:30', 'Recorded 14/10 09:30'],
      ['Bỏ bước duyệt kế hoạch', 'Bỏ bước duyệt kế hoạch'],
      ['Thêm PA học thuật Tổng hợp', 'Add PA Integrated'],
    ];
    const sai = mau.filter(([v, e]) => d(v) !== e).map(([v, e]) => `"${v}" → "${d(v)}" (cần "${e}")`);
    assert(sai.length === 0, sai.join(' · '));
  });

  /**
   * Chữ còn dấu Việt sau khi dịch, bỏ đoạn là DỮ LIỆU: tên người / lớp / chi nhánh, chữ người gõ (tiêu đề Case, mô tả, ghi chú, lý do…) — giá trị
   * của các cột tên / chữ tự do trong DB. Không lấy bảng `notifications` (chính chữ cần kiểm) và cột nhãn hệ thống (không che chữ chưa dịch).
   */
  const duLieu = (() => {
    const ra = new Set<string>();
    const COT = /full_name|^name$|^code$|title|description|note|ly_do|lyDo|reason|summary|ghi_chu|nhan_xet|mo_ta|tra_loi|noi_dung|performer|^ten/;
    for (const { name } of conn.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name <> 'notifications'").all() as any[]) {
      const cot = (conn.prepare('SELECT name FROM pragma_table_info(?)').all(name) as any[]).map((c) => c.name as string).filter((c) => COT.test(c));
      if (!cot.length) continue;
      for (const r of conn.prepare(`SELECT ${cot.map((c) => `"${c}"`).join(',')} FROM "${name}"`).all() as any[]) {
        for (const v of Object.values(r)) if (typeof v === 'string' && /[^\x00-\x7f]/.test(v)) ra.add(v.trim());
      }
    }
    return ra;
  })();
  const VIET = /[àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]/i;
  const conViet = (s: string) => {
    let x = i18n.dichMau('en', s) as string;
    for (const v of [...duLieu].filter((v) => x.includes(v)).sort((a, b) => b.length - a.length)) x = x.split(v).join('');
    return VIET.test(x) ? x : null;
  };
  const gom = (o: unknown, khoa: Set<string>, ra: string[]) => {
    if (Array.isArray(o)) o.forEach((x) => gom(x, khoa, ra));
    else if (o && typeof o === 'object') for (const [k, v] of Object.entries(o)) { if (typeof v === 'string' && khoa.has(k)) ra.push(v); else gom(v, khoa, ra); }
  };
  const TRUONG_VIEC = new Set(['toiDay', 'tuanHoc', 'tieuDe', 'actionLabel', 'reason', 'statusLabel', 'contextLabel', 'conTen', 'conPhu', 'phu', 'label', 'hint', 'text', 'chu', 'nhan']);

  await checkAsync('EN-VIEC · /my-work + Lớp tôi dạy của GVCN và GVBM: mọi chữ dịch hết (trừ dữ liệu)', async () => {
    await voiMay(async (goi) => {
      const sot: string[] = [];
      for (const ai of [GV, GV2]) {
        for (const url of ['/my-work', '/tong-quan/lop-toi-day?ct=ft', '/tong-quan/lop-toi-day?ct=thuong']) {
          const r = await goi(ai, url);
          assert(r.status === 200, `${url} → ${r.status}`);
          const chu: string[] = []; gom(await r.json(), TRUONG_VIEC, chu);
          for (const c of chu) { const x = conViet(c); if (x) sot.push(`${ai} ${url}: "${c}" → "${x}"`); }
        }
      }
      assert(sot.length === 0, `${sot.length} chữ chưa dịch: ` + [...new Set(sot)].slice(0, 12).join(' · '));
    });
  });

  await checkAsync('EN-TB · /notifications của GVCN và GVBM: tiêu đề + nội dung dịch hết (trừ dữ liệu), kể cả thông báo đã lưu', async () => {
    await voiMay(async (goi) => {
      const sot: string[] = [];
      let n = 0;
      for (const ai of [GV, GV2]) {
        const r = await goi(ai, '/notifications');
        assert(r.status === 200, `/notifications → ${r.status}`);
        const chu: string[] = []; gom(await r.json(), new Set(['title', 'body']), chu);
        n += chu.length;
        for (const c of chu) { const x = conViet(c); if (x) sot.push(`"${c}" → "${x}"`); }
      }
      assert(n > 0, 'GV có thông báo để kiểm');
      assert(sot.length === 0, `${sot.length} chữ chưa dịch: ` + [...new Set(sot)].slice(0, 12).join(' · '));
    });
  });

  /* ---------------------------------------------------------------- E-NGUON */
  await checkAsync('EN-NGUON · file đã dịch (đợt a, b, c) không còn chữ Việt hiện ra ngoài từ điển', async () => {
    const goc = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..');
    const { quetFile } = await import(pathToFileURL(path.join(goc, 'scripts/quet-chu.mjs')).href);
    const ra: any[] = [];
    for (const f of FILE_DA_DICH) quetFile(path.join(goc, f), f, 'en', ra);
    const viet = (x: string) => /[àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]/i.test(x.replace(/\{[^}]*\}/g, ''));
    const con = ra.filter((r) => viet(r.text) && !CHO_PHEP.some((c) => c.file === r.file && c.text.test(r.text)));
    assert(con.length === 0, `${con.length} chữ Việt còn sót: ` + con.slice(0, 8).map((r) => `${r.file}:${r.line} "${r.text}"`).join(' · '));
  });

  /* ---------------------------------------------------------------- Đợt d: Case – PA, Ghi vi phạm, Ý thức phần GV */
  await checkAsync('EN-NGUON · file đã dịch (đợt d — Case, Ý thức) không còn chữ Việt hiện ra ngoài từ điển', async () => {
    const { quetFile } = await import(pathToFileURL(path.join(GOC_REPO, 'scripts/quet-chu.mjs')).href);
    const ra: any[] = [];
    for (const f of FILE_DA_DICH_D) quetFile(path.join(GOC_REPO, f), f, 'en', ra);
    const viet = (x: string) => /[àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]/i.test(x.replace(/\{[^}]*\}/g, ''));
    const con = ra.filter((r) => viet(r.text) && !CHO_PHEP_D.some((c) => c.file === r.file && c.text.test(r.text)));
    assert(con.length === 0, `${con.length} chữ Việt còn sót: ` + con.slice(0, 8).map((r) => `${r.file}:${r.line} "${r.text}"`).join(' · '));
  });

  check('EN-LOI · đợt d: câu lỗi máy chủ của Case / SOS / vi phạm / phối hợp / tệp đều có bản Anh; câu có biến đi qua loi()', () => {
    const ts = require_ts();
    const thieu: string[] = [];
    for (const f of LOI_D) {
      const src = fs.readFileSync(path.join(GOC_REPO, f), 'utf8');
      const sf = ts.createSourceFile(f, src, ts.ScriptTarget.Latest, true);
      (function duyet(n: any) {
        if ((ts.isCallExpression(n) || ts.isNewExpression(n)) && /^(badRequest|forbidden|notFound|conflict|HttpError)$/.test(n.expression.getText())) {
          const m = n.arguments?.[n.expression.getText() === 'HttpError' ? 1 : 0];
          const dong = sf.getLineAndCharacterOfPosition(n.getStart()).line + 1;
          if (m && ts.isTemplateExpression(m)) thieu.push(`${f}:${dong} câu có biến chưa qua loi(): ${m.getText().slice(0, 60)}`);
          else if (m && (ts.isStringLiteral(m) || ts.isNoSubstitutionTemplateLiteral(m)) && !(m.text in EN)) thieu.push(`${f}:${dong} "${m.text}"`);
        }
        ts.forEachChild(n, duyet);
      })(sf);
    }
    assert(thieu.length === 0, `${thieu.length} câu: ` + thieu.slice(0, 8).join(' · '));
  });

  /* ---------------------------------------------------------------- E-HOSO (đợt c) */
  /*
   * Chữ máy chủ dựng cho đầu hồ sơ học viên (`dauHoSo`: việc của em theo người, câu tóm tắt, bốn ô) — chữ có biến mang `khoa` (+ `bien`, lồng được);
   * mọi khoá có bản Anh; dịch sang EN (theo khoá, hoặc theo mẫu khi máy chủ không gửi khoá) không còn chữ Việt ngoài DỮ LIỆU (tên người, tên PA, mã).
   * `standingLine` không hiện trên web (chỉ có trong kiểu `RosterRow`) nên không cần khoá.
   */
  check('EN-HOSO · chữ đầu hồ sơ HV máy chủ gửi có khoá / dịch được sang EN (vai GVCN, các em đang học)', () => {
    const VIET = /[àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]/i;
    const thieu = new Set<string>();
    const sot = new Set<string>();
    let soKhoa = 0;
    let soEm = 0;
    /* Biến là chữ dữ liệu (tên PA, tên người) được thay bằng "X" trước khi soi dấu Việt — chỉ chữ GIAO DIỆN phải sang tiếng Anh. */
    const xet = (x: { chu: string; khoa?: string; bien?: Record<string, unknown> } | null | undefined, noi: string): void => {
      if (!x?.chu) return;
      if (x.khoa) {
        soKhoa++;
        if (!(x.khoa in EN) && /\p{L}{2}/u.test(x.khoa.replace(/\{\w+\}/g, ''))) thieu.add(`${noi}: ${x.khoa}`);
        const b = Object.fromEntries(Object.entries(x.bien ?? {}).map(([k, v]) => {
          if (v && typeof v === 'object') { xet(v as any, noi); return [k, v]; }
          return [k, typeof v === 'string' && VIET.test(v) && !(v in EN) ? 'X' : v];
        }));
        const ra = i18n.dichSang('en', x.khoa, b);
        if (VIET.test(ra)) sot.add(`${noi}: ${ra}`);
      } else if (VIET.test(i18n.dichMau('en', x.chu))) sot.add(`${noi}: ${x.chu}`);
    };
    const chu = (s: string | null | undefined, noi: string) => xet(s ? { chu: s } : null, noi);
    const ids = (conn.prepare("SELECT DISTINCT student_id AS id FROM enrollments WHERE status = 'active' ORDER BY student_id LIMIT 80").all() as any[]).map((r) => r.id as number);
    for (const sid of ids) {
      let hs: any;
      try { hs = studentProfile(P.coreTeacher, sid); } catch { continue; }   // ngoài phạm vi GVCN
      soEm++;
      const d = hs.dauHoSo;
      for (const m of d.tomTat ?? []) xet(m, `tomTat#${sid}`);
      for (const v of [...(d.viec?.cuaBan ?? []), ...(d.viec?.nguoiKhac ?? [])]) {
        xet(v, `viec#${sid}`);
        chu(v.nut, `nut#${sid}`);
        chu(v.nguoi.vai, `vai#${sid}`);
        if (!v.nguoi.id) chu(v.nguoi.ten, `nguoi#${sid}`);
      }
      const o = d.o;
      if (o) {
        for (const r of o.hocThuat.dong) { xet(r.nhanK ?? { chu: r.nhan }, `hocThuat#${sid}`); chu(r.viec, `hocThuat#${sid}`); }
        chu(o.hocThuat.phu, `hocThuat#${sid}`);
        chu(o.yThuc.tren, `yThuc#${sid}`);
        xet(o.yThuc.phuK ?? (o.yThuc.phu ? { chu: o.yThuc.phu } : null), `yThuc#${sid}`);
        chu(o.sapToi.tren, `sapToi#${sid}`);
        xet(o.sapToi.gtK ?? { chu: o.sapToi.gt }, `sapToi#${sid}`);
        xet(o.sapToi.phuK ?? (o.sapToi.phu ? { chu: o.sapToi.phu } : null), `sapToi#${sid}`);
      }
      chu(d.thongTin?.thiDuKien?.nhan, `thongTin#${sid}`);
    }
    assert(soEm > 0 && soKhoa > 0, `không có em / không có chữ mang khoá (em ${soEm}, khoá ${soKhoa})`);
    assert(thieu.size === 0, `khoá chưa có bản Anh: ${[...thieu].slice(0, 6).join(' · ')}`);
    assert(sot.size === 0, `${sot.size} chữ còn tiếng Việt ở EN: ${[...sot].slice(0, 6).join(' · ')}`);
  });

  check('EN-HOSO · kem / ghepChu: câu Việt giữ nguyên chữ, khoá lồng dịch đủ; chữ máy chủ không khoá dịch theo mẫu, tên người giữ nguyên', () => {
    const k = i18n.kem('Xác nhận PA {pa} · {kn}', { pa: 'Ôn bài', kn: 'Writing' });
    assert(k.chu === 'Xác nhận PA Ôn bài · Writing', `câu Việt: ${k.chu}`);
    assert(i18n.dichSang('en', k.khoa!, k.bien) === 'Confirm PA Ôn bài · Writing', String(i18n.dichSang('en', k.khoa!, k.bien)));
    const ds = i18n.kem('{dau} và {cuoi}', { dau: 'Writing', cuoi: 'Speaking' });
    const ht = i18n.kem('đang hỗ trợ {ds}', { ds });
    const ghep = i18n.ghepChu('{dau}: {hoTro}', { dau: i18n.kem('{dau} SOS {sos} tạm thời', { dau: 'MT1', sos: 2 }), hoTro: ht });
    assert(ghep.chu === 'MT1 SOS 2 tạm thời: đang hỗ trợ Writing và Speaking', ghep.chu);
    assert(i18n.dichSang('en', ghep.khoa!, ghep.bien) === 'MT1 SOS 2 provisional: supporting Writing and Speaking', String(i18n.dichSang('en', ghep.khoa!, ghep.bien)));
    const m = i18n.dichMau('en', 'Xử lý vi phạm · hạn 16/09 · quá hạn 3 ngày');
    assert(m === 'Handle incident · due 16/09 · 3 days overdue', m);
    assert(i18n.dichMau('en', 'Nguyễn Văn A') === 'Nguyễn Văn A', 'tên người không dịch');
    assert(i18n.dichMau('vi', 'quá hạn 3 ngày') === 'quá hạn 3 ngày', 'VI giữ nguyên');
  });
}

/**
 * Đợt a: file dịch trọn (mỗi đợt thêm file của mình) — khung chung web (`ui/*`, `lib/*`, App, thanh trên, đăng nhập, Hồ sơ cá nhân) + shared của khung.
 * Không vào: `ui/chu.ts` (câu của hồ sơ / Case — đợt c, d; quet-chu tự kiểm dòng của nó), `shared/domain/people.ts` (nhãn quyền Quản trị giữ Việt).
 */
const GOC_REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..');
const FILE_DA_DICH = [
  'web/src/App.tsx',
  'web/src/modules/platform/Header.tsx',
  'web/src/modules/platform/WelcomePage.tsx',
  'web/src/modules/platform/ProfilePage.tsx',
  ...['web/src/ui', 'web/src/lib'].flatMap((d) => fs.readdirSync(path.join(GOC_REPO, d)).filter((f) => /\.tsx?$/.test(f) && f !== 'chu.ts').map((f) => `${d}/${f}`)),
  ...['oNgay', 'chonNgay', 'loiForm', 'hienThiNgay', 'trangThai', 'dieuHuong', 'khac', 'quayLai'].map((f) => `shared/domain/${f}.ts`),
  /* Đợt b — Tổng quan GV, Công việc, Yêu cầu của tôi, Lịch Test, Điểm theo lớp, nhập điểm, hộp chấm MT, hồ sơ Mock, Ghi kết quả PA. */
  ...['OverviewPage', 'ViecCuaToi', 'WorkList', 'NhomViec', 'LopToiDay'].map((f) => `web/src/modules/worklist/${f}.tsx`),
  ...['ChonPhuTrach', 'CongViecPage', 'HoTroHocVienTab', 'PanelViec'].map((f) => `web/src/modules/congViec/${f}.tsx`),
  ...['YeuCauCuaToi', 'TheYeuCau', 'DeXuatSuaPanel'].map((f) => `web/src/modules/duyet/${f}.tsx`),
  ...['TestPage', 'LichTestTab', 'TabDiemLop'].map((f) => `web/src/modules/test/${f}.tsx`),
  ...fs.readdirSync(path.join(GOC_REPO, 'web/src/modules/test/lichTest')).map((f) => `web/src/modules/test/lichTest/${f}`),
  ...fs.readdirSync(path.join(GOC_REPO, 'web/src/modules/cham')).map((f) => `web/src/modules/cham/${f}`),
  ...fs.readdirSync(path.join(GOC_REPO, 'web/src/modules/fasttrack')).map((f) => `web/src/modules/fasttrack/${f}`),
  'web/src/modules/cases/CapNhatTuan.tsx', 'shared/domain/gopYTuan.ts',
  ...['worklist', 'congViec', 'tongQuan', 'sapToi', 'yeuCauDuyet', 'chamDiem', 'fasttrack', 'lopThuong', 'oMt', 'lichMt', 'diemTheoLuot', 'normal',
    'thaoTacMt', 'mt0', 'nhanXet', 'vang', 'paDongBo'].map((f) => `shared/domain/${f}.ts`),
  /* Đợt c — Học viên & Lớp, hồ sơ lớp, hồ sơ HV (xem). Shared chạy ở máy chủ (`hoSoHocVien`, `hanhTrinh`, `cuoiKhoa`…) cố ý dựng câu Việt + khoá — kiểm ở E-HOSO. */
  ...['StudentsPage', 'StudentDetailPage', 'DauHoSo', 'HanhTrinh', 'ChuongLop', 'CacLoTrinh', 'NganCase', 'NganTongKet', 'KetLuanKhoa', 'KetQuaThiThatPanel',
    'ClassRoster', 'BangHocVienLop', 'MissingBadge'].map((f) => `web/src/modules/students/${f}.tsx`),
  ...['ClassOverviewPage', 'DauTrangLop', 'TabHocVienLop', 'BangDiemLopThuong', 'BangCanHoTro', 'ClassIssueBoard', 'CanhBaoYThuc', 'PhanTichLopTab',
    'TabTongKetLop', 'DaiChuyenLop', 'BangGopYTuan', 'BangKqdrLopFt', 'thaoTacDongHocVien'].map((f) => `web/src/modules/classes/${f}.tsx`),
];

/** Chuỗi so khớp dữ liệu (không hiện ra) — giữ Việt có chủ đích. */
const CHO_PHEP: { file: string; text: RegExp }[] = [
  { file: 'web/src/modules/platform/WelcomePage.tsx', text: /^(Hoàn tất|Nguyễn Khánh Vy|Trần Ngọc Hà)$/ },   // chữ in ra của lệnh seed; tên tài khoản demo (dữ liệu)
  { file: 'web/src/ui/NutNgonNgu.tsx', text: /^(Tiếng Việt|Ngôn ngữ \/ Language)$/ },                          // nút ghi bằng chính tiếng của nó
  /* Đợt b: giá trị so khớp với chữ máy chủ gửi (không hiện ra; chỗ hiện bọc dich()). */
  { file: 'web/src/modules/fasttrack/DongThoiGianLuot.tsx', text: /^Trống$/ },
  { file: 'web/src/modules/fasttrack/MockDetailPage.tsx', text: /^(đã huỷ phần thi|đã có điểm|đã thi)$/ },
  { file: 'shared/domain/paDongBo.ts', text: /^(Người dạy|Người thực hiện)$/ },
  { file: 'web/src/modules/worklist/WorkList.tsx', text: /^Lớp \{/ },
  { file: 'web/src/modules/cases/CapNhatTuan.tsx', text: /^Buổi \{…\}: \{x\}$/ },   // ghi chú gửi máy chủ, lưu vào nhật ký (giữ Việt) — OV-12f
  /* Đợt c: so với chữ GỐC máy chủ gửi (tiếng Việt) — không hiện ra. */
  { file: 'web/src/modules/classes/BangCanHoTro.tsx', text: /^(Xác nhận Case|Ghi nhận xét|Xác nhận PA)$/ },
  { file: 'web/src/modules/students/CacLoTrinh.tsx', text: /^(Học lại|Kết thúc|Chuyển lớp)$/ },
  { file: 'web/src/modules/students/KetQuaThiThatPanel.tsx', text: /^(Đạt Target|Chưa đạt Target|Chờ kết quả thi thật)$/ },
  { file: 'web/src/modules/students/NganCase.tsx', text: /^(Xác nhận Case|Ghi nhận xét|Xác nhận PA|Kết quả cuối)$/ },
];

/**
 * Đợt d (PR-EN-d, 14/10): Case – PA (ngăn Case, tạo Case, thao tác Case / PA, Xác nhận Case / PA, Ghi nhận xét — OV-12c), Ghi vi phạm, Ý thức phần GV.
 * Không vào: `cases/CapNhatTuan.tsx`, `cases/TheKyNang.tsx` (Ghi kết quả PA, thẻ kỹ năng — đợt b dịch).
 */
const FILE_DA_DICH_D = [
  ...['CaseBoardPage', 'CasePanel', 'ChiTietKyNang', 'DongXinYKien', 'FormPa', 'MenuXoaPa', 'NeedsEvaluation', 'QuickReport', 'SkillBoard', 'ThaoTacCase']
    .map((f) => `web/src/modules/cases/${f}.tsx`),
  ...fs.readdirSync(path.join(GOC_REPO, 'web/src/modules/yThuc')).filter((f) => /\.tsx?$/.test(f)).map((f) => `web/src/modules/yThuc/${f}`),
  'web/src/modules/students/NganCase.tsx',
  ...['cases', 'sosV4', 'sos', 'nguoiThucHien', 'yThuc', 'yThucGon'].map((f) => `shared/domain/${f}.ts`),
];
/** Chuỗi so khớp dữ liệu máy chủ / hằng ghi vào DB (không hiện ra) — giữ Việt có chủ đích. */
const CHO_PHEP_D: { file: string; text: RegExp }[] = [
  ...['cases/CasePanel', 'cases/FormPa', 'cases/SkillBoard'].map((f) => ({ file: `web/src/modules/${f}.tsx`, text: /^Người dạy$/ })),   // so với nhanNguoiDay()
  ...['KhaiBacPanel', 'StudentYThucSection', 'ThangYThuc', 'XacNhanXuLyPanel'].map((f) => ({ file: `web/src/modules/yThuc/${f}.tsx`, text: /^lớp thường$/ })),   // so với chuoi.nhan máy chủ gửi
  { file: 'web/src/modules/students/NganCase.tsx', text: /^(Xác nhận Case|Ghi nhận xét|Xác nhận PA|Kết quả cuối)$/ },   // so với viecTiep.chu máy chủ gửi
  { file: 'shared/domain/cases.ts', text: /^(Không còn hợp lệ do sửa điểm|Bỏ qua|Chỉnh khi xác nhận gợi ý tự động)$/ },   // hằng máy chủ ghi vào DB
];
/** Câu lỗi máy chủ GV gặp trên đường Case / Ý thức (đợt d). */
const LOI_D = ['cases/cases', 'cases/boTro', 'cases/nguoiThucHien', 'cases/sosAuto', 'yThuc/violations', 'yThuc/phoiHop', 'platform/attachments']
  .map((f) => `server/src/${f}.ts`);
