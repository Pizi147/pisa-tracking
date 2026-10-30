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
  const GIU = new Set<string>(['Tutor', 'Final Test', 'Progress Test']);   // R1-EN-2: tên bài giữ (mẫu 'Final {ct}' khớp nhầm)   // EN-e: tên PA / nhãn ô — luật thuật ngữ 3 giữ nguyên

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

  /* R1-EN-1 (26/10): `en.ts` trải các mô-đun nối nhau — khoá trùng mà khác giá trị thì mô-đun sau đè ngầm (vd hàm `{n} HV` bị "{n} students" đè → "1 students"). */
  await checkAsync('EN-TRUNG · khoá có ở nhiều mô-đun shared/i18n/en/* phải cùng bản Anh (hàm so kết quả với n = 1 và n = 2)', async () => {
    const thuMuc = fileURLToPath(new URL('../../../shared/i18n/en/', import.meta.url));   // bản dựng (dist-server) cạnh phép kiểm
    const noi = new Map<string, { mod: string; v: unknown }[]>();
    for (const f of fs.readdirSync(thuMuc).filter((f) => /\.[jt]s$/.test(f) && !f.endsWith('.d.ts')).sort()) {
      const m = await import(pathToFileURL(path.join(thuMuc, f)).href);
      for (const o of Object.values(m)) {
        if (o && typeof o === 'object') for (const [k, v] of Object.entries(o)) noi.set(k, [...(noi.get(k) ?? []), { mod: f, v }]);
      }
    }
    const ra = (k: string, v: unknown) => {
      if (typeof v !== 'function') return String(v);
      const b = (n: number) => Object.fromEntries(bienCua(k).split(',').filter(Boolean).map((x) => [x, x === 'n' ? n : `‹${x}›`]));
      return `${v({ ...b(1), n: 1 })} | ${v({ ...b(2), n: 2 })}`;
    };
    const lech = [...noi].filter(([k, ds]) => new Set(ds.map((d) => ra(k, d.v))).size > 1)
      .map(([k, ds]) => `"${k}": ` + ds.map((d) => `${d.mod}=${JSON.stringify(ra(k, d.v))}`).join(' / '));
    assert(lech.length === 0, `${lech.length} khoá trùng khác giá trị: ` + lech.slice(0, 8).join(' · '));
    assert(i18n.dichSang('en', '{n} HV', { n: 1 }) === '1 student' && i18n.dichSang('en', '{n} HV', { n: 3 }) === '3 students', `{n} HV: ${i18n.dichSang('en', '{n} HV', { n: 1 })}`);
  });

  /* R1-EN-1 (D11: chỉ màn GV có tiếng Anh): chữ Việt chưa dịch ở màn GV / lỗi máy chủ trên đường GV chỉ được GIẢM so với nền `scripts/chu-viet-cung.json`. */
  const nen = JSON.parse(fs.readFileSync(path.join(GOC_REPO, 'scripts/chu-viet-cung.json'), 'utf8')) as { web: Record<string, number>; 'may-chu': string[] };
  await checkAsync('EN-GV · tệp màn GV không thêm chữ Việt cứng ngoài từ điển (nền chu-viet-cung.json, chỉ giảm); man-gv.json khớp route GV', async () => {
    const { tepManGv } = await import(pathToFileURL(path.join(GOC_REPO, 'scripts/man-gv.mjs')).href);
    const ds = JSON.parse(fs.readFileSync(path.join(GOC_REPO, 'scripts/man-gv.json'), 'utf8')) as string[];
    assert(JSON.stringify(ds) === JSON.stringify(tepManGv()), 'scripts/man-gv.json lệch route GV — chạy: node scripts/man-gv.mjs');
    const dem = await demChuVietGv(ds, EN);
    const tang = Object.entries(dem).filter(([f, n]) => n > (nen.web[f] ?? 0)).map(([f, n]) => `${f}: ${n} > nền ${nen.web[f] ?? 0}`);
    const giam = Object.entries(nen.web).filter(([f, n]) => (dem[f] ?? 0) < n).map(([f, n]) => `${f} ${n}→${dem[f] ?? 0}`);
    if (giam.length) console.log(`    ↳ EN-GV: hạ nền scripts/chu-viet-cung.json (web): ${giam.join(' · ')}`);
    assert(tang.length === 0, `${tang.length} tệp thêm chữ Việt chưa dịch (bọc t() / thêm khoá EN): ` + tang.slice(0, 8).join(' · '));
  });

  check('EN-LOI-GV · câu lỗi máy chủ trên đường GV dịch được sang EN (dichMau), trừ nền chu-viet-cung.json "may-chu"', () => {
    const con = loiMayChuGv((s) => i18n.dichMau('en', s));
    const moi = con.filter((x) => !nen['may-chu'].includes(x.chu)).map((x) => `${x.noi} "${x.chu}"`);
    const het = nen['may-chu'].filter((s) => !con.some((x) => x.chu === s));
    if (het.length) console.log(`    ↳ EN-LOI-GV: hạ nền scripts/chu-viet-cung.json (may-chu), ${het.length} câu đã dịch / bỏ: ${het.slice(0, 3).join(' · ')}`);
    assert(moi.length === 0, `${moi.length} câu lỗi mới chưa dịch (dùng loi() hoặc thêm khoá EN): ` + moi.slice(0, 8).join(' · '));
  });

  /* R1-EN-2 (Task 5): câu máy chủ có biến đi qua loi() (khoá + biến), câu ghép thi thật web ghép bằng t() từ số liệu. */
  check('EN-GHEP · lỗi máy chủ có biến và chữ thi thật ra tiếng Anh', () => {
    const e = util.loi(400, 'Chưa tới tuần Test {x} — chưa nhập điểm được.', { x: 'W2 OCT' });
    assert(e.message === 'Chưa tới tuần Test W2 OCT — chưa nhập điểm được.' && e.khoa, 'loi() giữ câu Việt + khoá');
    const en = i18n.dichSang('en', e.khoa, e.bien);
    assert(en === 'Test week W2 OCT has not started — scores cannot be entered yet.', en);
    assert(i18n.dichMau('en', 'Tối đa 500 em một lần lưu.') === 'Save at most 500 students at a time.', 'câu không biến');
    assert(i18n.dichSang('en', 'Thi thật {ngay}', { ngay: '12/10' }) === 'Real exam 12/10', 'Thi thật {ngay}');
    assert(i18n.dichSang('en', 'Thi thật {kq}', { kq: '7.5' }) === 'Real exam 7.5', 'Thi thật {kq}');
    assert(i18n.dichMau('en', 'tuần 5/5 · Final Test') === 'week 5/5 · Final Test', i18n.dichMau('en', 'tuần 5/5 · Final Test'));   // không "Tests Final"
  });

  /* PTA #599 (1): khoá R1-EN chỉ dùng qua t() không làm mẫu cho dich() — chữ tự do không bị dịch nửa câu. */
  check('EN-MAU · chữ tự do không bị khoá ngắn có biến dịch nửa câu; mẫu chữ máy chủ vẫn dịch', () => {
    for (const s of ['Đã lưu ý kiến phụ huynh', 'Lịch học bù cuối tuần', 'Đang học bổ trợ', 'Hoàn tác bước cuối']) {
      assert(i18n.dichMau('en', s) === s, `"${s}" → "${i18n.dichMau('en', s)}"`);
    }
    assert(i18n.dichSang('en', 'Hoàn tác {nhan}', { nhan: 'Target' }) === 'Undo Target', 't() vẫn dịch khoá đủ');
    assert(i18n.dichMau('en', 'Dời S · MT3 · lần 2 · Duyệt = S làm bài W4 SEP') === 'Move S · MT3 · time 2 · Approve = S sits W4 SEP', 'mẫu thẻ dời MT');
  });

  /* PTA #599 (5): lỗi máy chủ mở đầu bằng tên ô — bản Anh mở đầu bằng đúng nhãn ô (StudentManagePanel `oCuaLoi` gắn lỗi vào ô ở EN). */
  check('EN-O · câu lỗi mở đầu bằng tên ô: bản Anh mở đầu bằng nhãn ô tiếng Anh', () => {
    const mau: [string, string][] = [['Dự kiến thi', 'Dự kiến thi: {x}'], ['Dự kiến thi', 'Dự kiến thi không hợp lệ.'], ['Dự kiến thi', 'Dự kiến thi phải có dạng MM/YYYY.'],
      ['Điểm đầu vào', 'Điểm đầu vào phải nằm trong khoảng 0–9.'], ['Điểm đầu vào', 'Điểm đầu vào {ten}: band 0–9, bước 0.5.'], ['Họ tên', 'Họ tên không được trống.']];
    for (const [o, k] of mau) {
      const en = i18n.dichSang('en', k, { x: 'a', ten: 'L' });
      assert(en.startsWith(i18n.dichSang('en', o)), `"${en}" phải mở đầu bằng "${i18n.dichSang('en', o)}"`);
    }
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

  /*
   * CN-3a (rà #743): prEn chạy trên bản DB gốc — seed chỉ sinh 14 loại thông báo. Dựng mỗi loại thông báo GV còn thiếu MỘT lần bằng chính
   * hàm máy chủ sinh ra nó (chữ tiêu đề / nội dung là chữ thật của máy chủ), TRƯỚC `duLieu` (tên em / lớp / lý do mới là dữ liệu).
   * EN-TB soi thông báo của GVCN, GVBM + mỗi loại một người nhận; EN-TB-LOAI giữ tập loại không teo lại.
   */
  const LOAI_TB_GV = ['cham_qua_han', 'cham_cheo_qua_han', 'case_chua_chot_pa', 'doi_lich_thuong', 'huy_lenh', 'lam_lai_ban_giao', 'phan_cong_moi', 'discipline'];
  const loiDung: string[] = [];
  {
    const TODAY = t.TODAY;
    const QL = P.mbManager;
    const thu = (ten: string, fn: () => void) => { try { fn(); } catch (e: any) { loiDung.push(`${ten}: ${e?.message ?? e}`); } };
    const td: any = await import('../platform/thongBaoTuDong.ts');
    const mywork: any = await import('../worklist/mywork.ts');
    const { xuLyCaseMany } = await import('../cases/sosState.ts');
    const { loadPrincipal } = await import('../permissions.ts');
    const chamCheo: any = await import('../cham/chamCheo.ts');
    const att: any = await import('../fasttrack/attempts.ts');
    const { luotThu } = await import('./luotThu.ts');
    const week: any = await import('../platform/week.ts');
    const ss: any = await import('../fasttrack/skillSchedule.ts');
    const intake: any = await import('../classes/intake.ts');
    const lenh: any = await import('../classes/lenhChuyen.ts');
    const bg: any = await import('../classes/banGiao.ts');
    const pc: any = await import('../classes/phanCongGv.ts');
    const viPham: any = await import('../yThuc/violations.ts');
    const d: any = await import('../../../shared/domain/index.ts');
    const get = (sql: string, ...a: unknown[]) => conn.prepare(sql).get(...a) as any;
    const MB = get(`SELECT id FROM branches WHERE code = 'MB'`).id as number;
    const FT101 = get(`SELECT id FROM classes WHERE code = 'MB FT 101'`).id as number;
    const NOW = new Date().toISOString();
    let seq = 0;
    const emMoi = (lop: number, ma: string | null) => {
      seq += 1;
      const sid = Number(conn.prepare(`INSERT INTO students (student_code, full_name, normalized_name, branch_id, status, created_at) VALUES (?,?,?,?, 'active', ?)`)
        .run(`PISA-ENTB${seq}`, `Hoc vien ENTB ${seq}`, `hoc vien entb ${seq}`, MB, NOW).lastInsertRowid);
      conn.prepare(`INSERT INTO enrollments (student_id, class_id, status, started_at, created_at) VALUES (?,?, 'active', ?, ?)`).run(sid, lop, TODAY, NOW);
      const cy = Number(conn.prepare(`INSERT INTO learning_cycles (student_id, seq, route, programme_code, target_score, started_at, status, created_at) VALUES (?, 1, ?, ?, ?, ?, 'active', ?)`)
        .run(sid, ma ? null : 'LT1', ma ?? 'FT', ma ? null : 6.5, TODAY, NOW).lastInsertRowid);
      return { sid, cy };
    };
    /* cham_qua_han + case_chua_chot_pa: đồng bộ thông báo tự động (như mở chuông) cho GV có bài quá hạn / người phụ trách Case chưa chốt PA quá hạn. */
    thu('cham_qua_han', () => {
      const coQuaHan = (p: any) => (mywork.myWork(p, { chiNhom: new Set(['score']) }).items as any[]).some((x) => x.group === 'score' && x.mine && x.urgency === 'overdue');
      td.dongBoThongBaoTuDong([P.w1Teacher, P.w2Teacher, P.lrTeacher, P.coreTeacher, P.subjectTeacher, P.sTeacher].find(coQuaHan), TODAY);
    });
    thu('case_chua_chot_pa', () => {
      const mo = conn.prepare(`SELECT sc.id, sc.owner_user_id FROM sos_cases sc JOIN students s ON s.id = sc.student_id
        WHERE sc.status != 'done' AND sc.owner_user_id IS NOT NULL AND sc.tam = 0 AND s.archived_at IS NULL`).all() as any[];
      const xl = xuLyCaseMany(mo.map((c) => c.id), TODAY);
      const qh = mo.find((c) => xl.get(c.id)?.cot === 'choDuyet' && xl.get(c.id)?.quaHan);
      td.dongBoThongBaoTuDong(loadPrincipal(qh.owner_user_id), TODAY);
    });
    /* cham_cheo_qua_han: em mới MB FT 101, MT5 chỉ Speaking thi 2 tuần trước, chưa chấm → lượt quét thứ Hai. */
    thu('cham_cheo_qua_han', () => {
      const hai = week.ensurePeriod(t.addDays(d.mondayOfDate(TODAY), -14)).id;
      const e = emMoi(FT101, null);
      const a = luotThu(conn, att.createAttempt, P.admin, { studentId: e.sid, cycleId: e.cy, classId: FT101, no: 5, periodId: hai });
      conn.prepare('UPDATE attempt_skills SET planned_period_id = ? WHERE attempt_id = ?').run(hai, a.id);
      conn.prepare('UPDATE assessment_attempts SET lich_su = 0 WHERE id = ?').run(a.id);
      conn.prepare(`UPDATE attempt_skills SET required = 0 WHERE attempt_id = ? AND skill != 'speaking'`).run(a.id);
      chamCheo.baoChamCheoQuaHan(TODAY);
    });
    /* doi_lich_thuong: QL dời một bài Progress Test của lớp thường → GVCN; bản cả lớp. */
    thu('doi_lich_thuong', () => {
      const a = get(`SELECT a.id, a.class_id, a.student_id, a.kind, a.attempt_no FROM assessment_attempts a JOIN classes c ON c.id = a.class_id
        WHERE c.code = 'MB FOU 12' AND a.kind = 'progress' AND a.status != 'cancelled' ORDER BY a.id LIMIT 1`);
      ss.baoGvcnDoiLichThuong(QL, a, t.addDays(d.mondayOfDate(TODAY), 7), TODAY);
      ss.baoGvcnDoiLichThuongLop(QL, a.class_id, 'progress', 2, TODAY);
    });
    /* lam_lai_ban_giao + huy_lenh: lệnh lên lớp đã bàn giao → đổi lớp đích (làm lại) → huỷ (như OV3b-6). */
    thu('lam_lai_ban_giao, huy_lenh', () => {
      const lopMoi = (kind: string, ft: boolean, tuanHienTai: number) => {
        seq += 1;
        const bat = d.mondayOfDate(t.addDays(TODAY, -7 * (tuanHienTai - 1)));
        return (intake.createClass(P.admin, { code: `MB-ENTB${seq}`, branchId: MB, kind, isFastTrack: ft, route: ft ? 'LT1' : null, startDate: bat,
          startPeriodId: week.ensurePeriod(bat).id }) as any).id as number;
      };
      const be = lopMoi('BE', false, 8), ele1 = lopMoi('ELE', false, 1), ele2 = lopMoi('ELE', false, 1);
      const [g0, g1] = [P.coreTeacher.userId, P.subjectTeacher.userId];
      const gan = (lop: number, u: number, skill: string | null, core: number) => conn.prepare(`INSERT INTO teacher_assignments (user_id, class_id, skill, is_core,
        effective_from, status, created_at) VALUES (?,?,?,?, '2026-01-01', 'active', ?)`).run(u, lop, skill, core, NOW);
      gan(be, g0, null, 1); gan(be, g1, 'writing', 0);
      const B = emMoi(be, 'BE').sid;
      lenh.raLenh(QL, { lopNguonId: be, boiCanh: 'cuoi-khoa', tuanChung: null, dongs: [{ studentId: B, huong: 'len_lop', toClassId: ele1, tuan: (d.tuanChonDuoc(TODAY) as string[])[0] }] });
      const l = get(`SELECT id FROM lenh_chuyen_lop WHERE student_id = ? AND trang_thai = 'cho'`, B);
      bg.ghiMon(loadPrincipal(g1), l.id, 'writing', 'Viết ổn, cần thêm từ nối.');
      bg.xacNhanBanGiao(loadPrincipal(g0), l.id, 'Em chăm, theo kịp lớp.');
      lenh.suaLenh(QL, l.id, { toClassId: ele2 });
      lenh.huyLenh(QL, l.id, 'Em xin học lại');
    });
    /* phan_cong_moi: QL đổi GV Listening của MB FT 101 sang GV khác → người nhận mới. */
    thu('phan_cong_moi', () => {
      const slots = (conn.prepare(`SELECT user_id, skill, is_core FROM teacher_assignments WHERE class_id = ? AND status = 'active'`).all(FT101) as any[])
        .map((r) => ({ userId: r.user_id, skill: r.skill, isCore: r.is_core === 1 }));
      const cu = slots.find((x) => x.skill === 'listening')?.userId;
      const moi = get(`SELECT ur.user_id id FROM user_roles ur JOIN roles r ON r.id = ur.role_id WHERE r.key = 'teacher' AND ur.branch_id = ? AND ur.user_id != ?
        ORDER BY ur.user_id LIMIT 1`, MB, cu).id;
      pc.luuPhanCong(QL, { lop: [{ classId: FT101, slots: slots.filter((x) => x.skill !== 'listening').concat([{ userId: moi, skill: 'listening', isCore: false }]) }] });
    });
    /* discipline: QL ghi vi phạm cho em MB FT 101 → GVCN lớp. */
    thu('discipline', () => {
      const em = get(`SELECT e.student_id id FROM enrollments e JOIN students s ON s.id = e.student_id WHERE e.class_id = ? AND e.status = 'active'
        AND s.status = 'active' ORDER BY e.student_id LIMIT 1`, FT101).id;
      viPham.recordViolation(QL, { studentId: em, category: 'homework', description: 'Không làm bài tập về nhà', occurredOn: TODAY });
    });
  }
  check('EN-TB-LOAI · dựng đủ các loại thông báo GV (bằng hàm máy chủ thật) — tập loại trong DB ⊇ danh sách cố định', () => {
    const co = new Set((conn.prepare('SELECT DISTINCT kind FROM notifications').all() as any[]).map((r) => r.kind as string));
    const thieu = LOAI_TB_GV.filter((k) => !co.has(k));
    assert(!loiDung.length && !thieu.length, `thiếu ${thieu.join(', ')} · lỗi dựng: ${loiDung.join(' | ')}`);
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
      /* CN-3a: + mỗi loại thông báo GV đã dựng (LOAI_TB_GV) một người nhận. */
      const nguoiNhan = (conn.prepare(`SELECT MIN(user_id) u FROM notifications WHERE kind IN (${LOAI_TB_GV.map(() => '?').join(',')}) GROUP BY kind`)
        .all(...LOAI_TB_GV) as any[]).map((r) => r.u as number);
      for (const ai of [...new Set([GV, GV2, ...nguoiNhan])]) {
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
        for (const v of Object.values(x.bien ?? {})) if (v && typeof v === 'object') xet(v as any, noi);
        /* CN-1: thay chữ dữ liệu ở MỌI tầng biến — câu lồng ("{viec} quá hạn {n} ngày" chứa "PA {pa} chờ Quản lý duyệt") trước còn để tên PA
           của tầng trong nên đỏ khi PA đó còn chờ duyệt (check đầy đủ xanh chỉ vì tệp trước đã duyệt PA đó). */
        const an = (bien: Record<string, unknown>): Record<string, unknown> => Object.fromEntries(Object.entries(bien).map(([k, v]) =>
          [k, v && typeof v === 'object' ? { ...v, bien: an((v as any).bien ?? {}) } : typeof v === 'string' && VIET.test(v) && !(v in EN) ? 'X' : v]));
        const ra = i18n.dichSang('en', x.khoa, an(x.bien ?? {}));
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
  ...['OverviewPage', 'WorkList', 'LopToiDay'].map((f) => `web/src/modules/worklist/${f}.tsx`),
  ...['ChonPhuTrach', 'CongViecPage', 'HoTroHocVienTab', 'PanelViec', 'DanhSachViec'].map((f) => `web/src/modules/congViec/${f}.tsx`),
  ...['YeuCauCuaToi', 'TheYeuCau', 'DeXuatSuaPanel'].map((f) => `web/src/modules/duyet/${f}.tsx`),
  ...['TestPage', 'LichTestTab'].map((f) => `web/src/modules/test/${f}.tsx`),
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
    'TabTongKetLop', 'DaiChuyenLop', 'BangKqdrLopFt', 'thaoTacDongHocVien'].map((f) => `web/src/modules/classes/${f}.tsx`),
];

/** Chuỗi so khớp dữ liệu (không hiện ra) — giữ Việt có chủ đích. */
const CHO_PHEP: { file: string; text: RegExp }[] = [
  { file: 'web/src/modules/congViec/DanhSachViec.tsx', text: /^Lớp$/ },   // R1-EN-2: so với nhãn việc cả lớp máy chủ gửi, không hiện ra
  { file: 'web/src/modules/cases/CapNhatTuan.tsx', text: /^Buổi \{n\}: \{x\}$/ },   // R1-EN-2: ghi chú lưu máy chủ (dữ liệu), web hiện qua dich()
  { file: 'web/src/modules/platform/WelcomePage.tsx', text: /^(Hoàn tất|Nguyễn Khánh Vy|Trần Ngọc Hà)$/ },   // chữ in ra của lệnh seed; tên tài khoản demo (dữ liệu)
  { file: 'web/src/ui/NutNgonNgu.tsx', text: /^(Tiếng Việt|Ngôn ngữ \/ Language)$/ },                          // nút ghi bằng chính tiếng của nó
  { file: 'web/src/App.tsx', text: /^Thêm$/ },   // KHUNG-LOI: nút gom menu — EN "More" ngay cạnh (khoá 'Thêm' của từ điển là "Add")
  /* Đợt b: giá trị so khớp với chữ máy chủ gửi (không hiện ra; chỗ hiện bọc dich()). */
  { file: 'web/src/modules/fasttrack/DongThoiGianLuot.tsx', text: /^Trống$/ },
  { file: 'web/src/modules/fasttrack/MockDetailPage.tsx', text: /^(đã huỷ|đã có điểm|đã làm bài)$/ },
  { file: 'web/src/modules/fasttrack/MockDetailPage.tsx', text: /^(Xác nhận Case|Mô tả Case|Xác nhận PA)$/ },   // HSL-FT: so với viecTiep.chu máy chủ (như DongCase), chỗ hiện bọc dich()
  { file: 'shared/domain/paDongBo.ts', text: /^(Người dạy|Người thực hiện)$/ },
  { file: 'web/src/modules/congViec/DanhSachViec.tsx', text: /^Lớp \{/ },
  { file: 'web/src/modules/cases/CapNhatTuan.tsx', text: /^Buổi \{…\}: \{x\}$/ },   // ghi chú gửi máy chủ, lưu vào nhật ký (giữ Việt) — OV-12f
  /* Đợt c: so với chữ GỐC máy chủ gửi (tiếng Việt) — không hiện ra. */
  { file: 'web/src/modules/classes/BangCanHoTro.tsx', text: /^(Xác nhận Case|Mô tả Case|Xác nhận PA)$/ },
  { file: 'web/src/modules/students/CacLoTrinh.tsx', text: /^(Học lại|Kết thúc|Chuyển lớp)$/ },
  { file: 'web/src/modules/students/KetQuaThiThatPanel.tsx', text: /^(Đạt Target|Chưa đạt Target|Chờ kết quả thi thật)$/ },
  { file: 'web/src/modules/students/NganCase.tsx', text: /^(Xác nhận Case|Mô tả Case|Xác nhận PA|Kết quả cuối)$/ },
  { file: 'shared/domain/congViec.ts', text: /^Kỹ năng$/ },   // P11: so với nhãn máy chủ gửi khi Case chưa có môn (`monCuaViec`) — không hiện ra
];

/**
 * Đợt d (PR-EN-d, 14/10): Case – PA (ngăn Case, tạo Case, thao tác Case / PA, Xác nhận Case / PA, Ghi nhận xét — OV-12c), Ghi vi phạm, Ý thức phần GV.
 * Không vào: `cases/CapNhatTuan.tsx` (Ghi kết quả PA — đợt b dịch). `cases/TheKyNang.tsx`: phần còn sót sau EN-b dịch ở đợt d.
 */
const FILE_DA_DICH_D = [
  ...['CaseBoardPage', 'CasePanel', 'ChiTietKyNang', 'DongXinYKien', 'FormPa', 'MenuXoaPa', 'NeedsEvaluation', 'QuickReport', 'SkillBoard', 'ThaoTacCase', 'TheKyNang']
    .map((f) => `web/src/modules/cases/${f}.tsx`),
  ...fs.readdirSync(path.join(GOC_REPO, 'web/src/modules/yThuc')).filter((f) => /\.tsx?$/.test(f)).map((f) => `web/src/modules/yThuc/${f}`),
  'web/src/modules/students/NganCase.tsx',
  ...['cases', 'sosV4', 'sos', 'nguoiThucHien', 'yThuc', 'yThucGon'].map((f) => `shared/domain/${f}.ts`),
];
/** Chuỗi so khớp dữ liệu máy chủ / hằng ghi vào DB (không hiện ra) — giữ Việt có chủ đích. */
const CHO_PHEP_D: { file: string; text: RegExp }[] = [
  ...['cases/CasePanel', 'cases/FormPa', 'cases/SkillBoard'].map((f) => ({ file: `web/src/modules/${f}.tsx`, text: /^Người dạy$/ })),   // so với nhanNguoiDay()
  ...['KhaiBacPanel', 'StudentYThucSection', 'ThangYThuc', 'XacNhanXuLyPanel'].map((f) => ({ file: `web/src/modules/yThuc/${f}.tsx`, text: /^lớp thường$/ })),   // so với chuoi.nhan máy chủ gửi
  { file: 'web/src/modules/students/NganCase.tsx', text: /^(Xác nhận Case|Mô tả Case|Xác nhận PA|Kết quả cuối)$/ },
  { file: 'web/src/modules/cases/TheKyNang.tsx', text: /^(Xác nhận Case|Mô tả Case|Xác nhận PA|Kết quả cuối)$/ },   // so với viecTiep.chu máy chủ gửi   // so với viecTiep.chu máy chủ gửi
  { file: 'shared/domain/cases.ts', text: /^(Không còn hợp lệ do sửa điểm|Bỏ qua|Chỉnh khi xác nhận gợi ý tự động)$/ },   // hằng máy chủ ghi vào DB
  { file: 'web/src/modules/yThuc/ClassYThucCard.tsx', text: /^Chưa báo$/ },   // UI-Y-THUC-LOP: so với nhanTrangThai máy chủ gửi
];
/** Câu lỗi máy chủ GV gặp trên đường Case / Ý thức (đợt d). */
const LOI_D = ['cases/cases', 'cases/boTro', 'cases/nguoiThucHien', 'cases/sosAuto', 'yThuc/violations', 'yThuc/phoiHop', 'platform/attachments']
  .map((f) => `server/src/${f}.ts`);

const VIET_GV = /[àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]/i;
/** R1-EN-1 EN-GV: số chữ Việt cứng theo tệp màn GV — chữ hiện ra (luật quet-chu.mjs, đã bỏ chữ trong t / dich / loi / kem) không có khoá EN đúng chuỗi. */
export async function demChuVietGv(ds: string[], en: Record<string, unknown>): Promise<Record<string, number>> {
  const { quetFile } = await import(pathToFileURL(path.join(GOC_REPO, 'scripts/quet-chu.mjs')).href);
  const dem: Record<string, number> = {};
  for (const f of ds) {
    const ra: any[] = [];
    quetFile(path.join(GOC_REPO, f), f, 'web', ra);
    const n = ra.filter((r) => VIET_GV.test(r.text.replace(/\{[^}]*\}/g, '')) && !(r.text in en)).length;
    if (n) dem[f] = n;
  }
  return dem;
}

/** R1-EN-1 EN-LOI-GV: thư mục máy chủ của đường GV (spec 4.3 (c)); câu lỗi chữ Việt (literal / template → `{x}`) mà dichMau EN trả nguyên. */
const THU_MUC_LOI_GV = ['cham', 'fasttrack', 'normal', 'cases', 'students', 'worklist', 'congViec', 'dich', 'classes'];
const TEP_LOI_GV = ['server/src/routes/index.ts', 'server/src/phanTich/xuatMt.ts'];
export function loiMayChuGv(dichEn: (s: string) => string): { noi: string; chu: string }[] {
  const ts = require_ts();
  const con: { noi: string; chu: string }[] = [];
  /* PTA #599 (3): thêm tệp đường GV ngoài các thư mục trên — routes (tham số), Xuất kết quả Test (GVCN). */
  const tep = [...THU_MUC_LOI_GV.filter((d) => fs.existsSync(path.join(GOC_REPO, 'server/src', d)))
    .flatMap((d) => (fs.readdirSync(path.join(GOC_REPO, 'server/src', d), { recursive: true }) as string[]).filter((f) => /\.ts$/.test(f)).sort()
      .map((f) => `server/src/${d}/${f}`.replace(/\\/g, '/'))), ...TEP_LOI_GV];
  {
    for (const rel of tep) {
      const sf = ts.createSourceFile(rel, fs.readFileSync(path.join(GOC_REPO, rel), 'utf8'), ts.ScriptTarget.Latest, true);
      (function duyet(n: any) {
        if ((ts.isCallExpression(n) || ts.isNewExpression(n)) && /^(badRequest|forbidden|notFound|conflict|HttpError)$/.test(n.expression.getText())) {
          const m = n.arguments?.[n.expression.getText() === 'HttpError' ? 1 : 0];
          const chu = !m ? null : ts.isStringLiteral(m) || ts.isNoSubstitutionTemplateLiteral(m) ? m.text
            : ts.isTemplateExpression(m) ? m.head.text + m.templateSpans.map((s: any) => '{x}' + s.literal.text).join('') : null;
          if (chu && VIET_GV.test(chu) && (ts.isTemplateExpression(m) || dichEn(chu) === chu)) con.push({ noi: `${rel}:${sf.getLineAndCharacterOfPosition(n.getStart()).line + 1}`, chu });
        }
        ts.forEachChild(n, duyet);
      })(sf);
    }
  }
  return con;
}
