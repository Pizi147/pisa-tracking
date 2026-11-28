/**
 * PHÉP KIỂM LPB-1 (N73 ④ ⑤, chủ SP 26/11 — đặc tả `docs/superpowers/specs/2026-11-26-viec-lien-phong-ban/thiet-ke.md` 4.5): KHUNG việc chung cho việc TVV, Bàn giao,
 * việc Head. Quyền đi qua HTTP thật (`createApp` + phiên demo): người được giao làm được ĐÚNG việc đó; người ngoài / người theo dõi / người giao cũ 403; Chốt lộ trình
 * cho người không có quyền chốt 400. Ca HTTP ghi thật trên DB riêng của tệp (tệp độc lập); ca gọi hàm chạy trong giao dịch cuộn lại.
 */
export async function runPrLpb1Tests(t: any) {
  const { check, checkAsync, assert, conn, TODAY, P, addDays } = t;
  const d: any = await import('../../../shared/domain/index.ts');
  const { loadPrincipal } = await import('../permissions.ts');
  const { xoaNho, soCauSql, chayTrongRequest } = await import('../platform/nguCanhRequest.ts');
  const gv: any = await import('../worklist/giaoViec.ts');
  const kv: any = await import('../worklist/khungViec.ts');
  const tn: any = await import('../platform/timNguoi.ts');
  const lenh: any = await import('../classes/lenhChuyen.ts');
  const intake: any = await import('../classes/intake.ts');
  const week: any = await import('../platform/week.ts');
  const luu: any = await import('../students/dongLuuTru.ts');
  const xoaHv: any = await import('../students/xoaHocVien.ts');
  const { myWork } = await import('../worklist/mywork.ts');
  const vtMod: any = await import('../worklist/viecTvv.ts');
  const { migratePrLpb1 } = await import('../migrate/prLpb1.ts');
  const { catLpb1 } = await import('./catBaoPh0.ts');
  const { default: SqliteDb } = await import('libsql') as any;
  const fs: any = await import('node:fs');
  const path: any = await import('node:path');
  const { fileURLToPath } = await import('node:url');
  const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..');
  console.log('\nLPB-1 · Khung việc chung: việc TVV · Bàn giao · việc Head (N73 ⑤)');

  const get = (sql: string, ...a: unknown[]) => conn.prepare(sql).get(...a) as any;
  const all = (sql: string, ...a: unknown[]) => conn.prepare(sql).all(...a) as any[];
  const ma = (fn: () => unknown): number | null => { try { fn(); return null; } catch (e: any) { return e?.status ?? -1; } };
  const thu = (fn: () => void) => { conn.exec('BEGIN IMMEDIATE'); try { fn(); } finally { conn.exec('ROLLBACK'); xoaNho(); } };
  const thuHttp = async (fn: (h: { vao: (u: number) => Promise<string>; goi: (ck: string, m: string, u: string, b?: unknown) => Promise<{ status: number; json: any }> }) => Promise<void>) => {
    const { createApp } = await import('../app.ts');
    const may = createApp().listen(0);
    const cong = (may.address() as any).port as number;
    const vao = async (userId: number) => (await fetch(`http://127.0.0.1:${cong}/api/demo/session`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ userId }) }))
      .headers.get('set-cookie')?.split(';')[0] ?? '';
    const goi = async (cookie: string, method: string, url: string, body?: unknown) => {
      const res = await fetch(`http://127.0.0.1:${cong}/api${url}`, { method, headers: { 'content-type': 'application/json', cookie }, ...(body !== undefined ? { body: JSON.stringify(body) } : {}) });
      let json: any = null; try { json = await res.json(); } catch { /* không thân */ }
      xoaNho();
      return { status: res.status, json };
    };
    /* Không bọc giao dịch: máy chủ cuộn lại giao dịch bỏ dở khi nhận yêu cầu. Tệp chạy trên DB gốc riêng (độc lập) — dữ liệu thử ở lại tới hết tệp. */
    try { await fn({ vao, goi }); } finally { xoaNho(); may.close(); }
  };

  const MB = get(`SELECT id FROM branches WHERE code = 'MB'`).id as number;
  const nguoiVai = (key: string, n = 1, tru: number[] = []) => all(`SELECT DISTINCT ur.user_id AS id FROM user_roles ur JOIN roles r ON r.id = ur.role_id JOIN users u ON u.id = ur.user_id
      WHERE r.key = ? AND ur.status = 'active' AND u.status = 'active' AND ur.branch_id = ? ORDER BY ur.user_id`, key, MB).map((r) => r.id as number).filter((x) => !tru.includes(x)).slice(0, n);
  const [TVV, TVV2] = nguoiVai('consultant', 2);
  /* GV không dạy lớp nào của em thử (người được giao · người ngoài). */
  const gvRanh = (lop: number, n: number) => nguoiVai('teacher', 50).filter((u) => !get('SELECT 1 FROM teacher_assignments WHERE user_id = ? AND class_id = ? AND status = ?', u, lop, 'active')).slice(0, n);
  let seq = 0;
  /* Tài khoản thử theo vai ở MB (rà #2280: BPXL thuần · BPXL + TVV). */
  const taoNguoi = (...vai: string[]) => {
    seq += 1;
    const now = new Date().toISOString();
    const uid = Number(conn.prepare(`INSERT INTO users (code, full_name, status, created_at) VALUES (?, ?, 'active', ?)`).run(`LPB1-U${seq}`, `Nguoi thu LPB1 ${seq}`, now).lastInsertRowid);
    for (const k of vai) conn.prepare(`INSERT INTO user_roles (user_id, role_id, branch_id, status, created_at) SELECT ?, id, ?, 'active', ? FROM roles WHERE key = ?`).run(uid, MB, now, k);
    xoaNho();
    return uid;
  };
  const lopMoi = (kind: string, ft: boolean, tuanHienTai = 3) => {
    seq += 1;
    const bat = d.mondayOfDate(addDays(TODAY, -7 * (tuanHienTai - 1)));
    return intake.createClass(P.admin, { code: `MB-LPB1-${seq}`, branchId: MB, kind, isFastTrack: ft, route: ft ? 'RF' : null, startDate: bat, startPeriodId: week.ensurePeriod(bat).id }).id as number;
  };
  const gan = (l: number, u: number, skill: string | null, core: boolean) => conn.prepare(
    `INSERT INTO teacher_assignments (user_id, class_id, skill, is_core, effective_from, status, created_at) VALUES (?,?,?,?, '2026-01-01', 'active', ?)`,
  ).run(u, l, skill, core ? 1 : 0, new Date().toISOString());
  /* Em FT tới tháng thi mà chưa có ngày → việc "Chốt ngày thi" (+ thiếu ngày sinh → "Bổ sung hồ sơ thiếu") của TVV. */
  const emFt = (lop: number, o: { dob?: string | null } = {}) => {
    seq += 1;
    const now = new Date().toISOString();
    const sid = Number(conn.prepare(`INSERT INTO students (student_code, full_name, normalized_name, branch_id, status, created_at, consultant_user_id, dob, email) VALUES (?,?,?,?, 'active', ?, ?, ?, ?)`)
      .run(`PISA-LPB1-${seq}`, `Hoc vien LPB1 ${seq}`, `hoc vien lpb1 ${seq}`, MB, now, TVV, o.dob === undefined ? '2010-01-01' : o.dob, `lpb1-${seq}@vd.test`).lastInsertRowid);
    conn.prepare(`INSERT INTO enrollments (student_id, class_id, status, started_at, created_at) VALUES (?,?, 'active', ?, ?)`).run(sid, lop, TODAY, now);
    const cy = Number(conn.prepare(`INSERT INTO learning_cycles (student_id, seq, route, programme_code, started_at, status, created_at, start_period_id, target_score, exam_month)
        VALUES (?, 1, 'RF', 'FT', ?, 'active', ?, ?, 6.5, ?)`).run(sid, TODAY, now, week.ensurePeriod(d.mondayOfDate(TODAY)).id, TODAY.slice(0, 7)).lastInsertRowid);
    xoaNho();
    return { sid, cy };
  };
  const viec = (p: any, o: any = {}) => myWork(p, { ...o }).items as any[];
  const coViec = (p: any, key: string, o: any = {}) => viec(p, o).find((i) => i.key === key);

  check('LPB1-1 · migrate prLpb1 chạy lặp không đổi; DB trước LPB-1 → migrate → cột + chỉ mục như schema.sql', () => {
    const lan: string[] = [];
    migratePrLpb1(conn, lan);
    assert(!lan.length, `DB dựng từ schema.sql bị đổi: ${lan.join(' | ')}`);
    const SCHEMA = fs.readFileSync(path.join(REPO, 'server/src/schema.sql'), 'utf8').replace(/\r\n/g, '\n');
    const cu = new SqliteDb(':memory:'); cu.exec(catLpb1(SCHEMA));
    const a: string[] = []; migratePrLpb1(cu, a);
    const b: string[] = []; migratePrLpb1(cu, b);
    assert(a.length === 1 && /viec_chot_ngay_thi/.test(a[0]) && /ban_giao_gv\.phu_trach_id/.test(a[0]) && !b.length, `${a.join(' | ')} ‖ ${b.join(' | ')}`);
    const moi = new SqliteDb(':memory:'); moi.exec(SCHEMA);
    const cot = (x: any, bang: string) => JSON.stringify((x.prepare(`PRAGMA table_info(${bang})`).all() as any[]).map((c) => `${c.name}:${c.type}:${c.notnull}:${c.pk}`));
    for (const bang of [...kv.LOAI_KHUNG.map((l: string) => kv.BANG_KHUNG[l])]) assert(cot(cu, bang) === cot(moi, bang), `${bang}: ${cot(cu, bang)} ≠ ${cot(moi, bang)}`);
    const cm = (x: any) => JSON.stringify((x.prepare(`SELECT name, sql FROM sqlite_master WHERE type = 'index' AND (name LIKE 'idx_viec_%_giao' OR name IN ('idx_ban_giao_gv_giao', 'uq_viec_ban_giao_mon')) ORDER BY name`).all() as any[]))
      .replace(/\s+/g, ' ');
    assert(cm(cu) === cm(moi), `chỉ mục: ${cm(cu)} ≠ ${cm(moi)}`);
  });

  await checkAsync('LPB1-2 · HTTP Chốt ngày thi: TVV giao cho GV → việc rời dòng TVV, vào dòng GV ("{tên} giao"); GV chốt được (200); người ngoài 403; GV giao tiếp → GV (người giao cũ, chỉ theo dõi) 403, TVV đổi người 403', () => thuHttp(async ({ vao, goi }) => {
    const lop = lopMoi('FT', true);
    const [G, H] = gvRanh(lop, 2);
    assert(TVV && G && H, 'seed: cần TVV + 2 GV ở MB');
    const { cy } = emFt(lop);
    const { cy: cyKhac } = emFt(lop);
    const pT = loadPrincipal(TVV), pG = loadPrincipal(G);
    assert(coViec(pT, `chot-ngay-thi:${cy}`)?.mine, 'tiền đề: TVV giữ việc Chốt ngày thi');
    const [ckT, ckG, ckH] = [await vao(TVV), await vao(G), await vao(H)];
    const ngay = addDays(TODAY, 10);
    assert((await goi(ckG, 'PUT', `/hoc-vien-lop/lich-thi/${cy}`, { ketLuan: 'chot-ngay', ngay })).status === 403, 'GV chưa được giao mà chốt được ngày thi');
    const r = await goi(ckT, 'POST', `/giao-viec/chot_ngay_thi/${cy}/phu-trach`, { userId: G, phuTrachCu: null });
    assert(r.status === 200 && r.json?.phuTrach?.[0]?.id === G && r.json?.duocGiao, `giao: ${r.status} ${JSON.stringify(r.json).slice(0, 200)}`);
    assert(!coViec(pT, `chot-ngay-thi:${cy}`), 'việc đã giao còn ở dòng TVV');
    const it = coViec(pG, `chot-ngay-thi:${cy}`);
    assert(it?.mine && it.giaoBoi && it.khungViec?.loai === 'chot_ngay_thi' && it.khungViec.id === cy, `dòng GV: ${JSON.stringify(it)}`);
    assert(get(`SELECT 1 FROM viec_theo_doi WHERE loai = 'chot_ngay_thi' AND ref_id = ? AND user_id = ?`, cy, TVV), 'TVV (người giữ cũ) không tự theo dõi');
    assert((await goi(ckH, 'PUT', `/hoc-vien-lop/lich-thi/${cy}`, { ketLuan: 'chot-ngay', ngay })).status === 403, 'người ngoài chốt được ngày thi');
    /* N73 ④: người đã giao (người đổi gần nhất) đổi được người / hạn. */
    assert((await goi(ckT, 'GET', `/giao-viec/chot_ngay_thi/${cy}`)).json?.coTheDoiNguoi === true, 'người đã giao không đổi được người');
    /* GV giao tiếp cho H: H làm được, G (người giao cũ — đã chuyển đi) không ghi được việc. */
    const r2 = await goi(ckG, 'POST', `/giao-viec/chot_ngay_thi/${cy}/phu-trach`, { userId: H, phuTrachCu: G });
    assert(r2.status === 200, `G giao tiếp: ${r2.status} ${r2.json?.error}`);
    /* A → G → H: A chỉ còn theo dõi — không đổi người / hạn (N73 ④). */
    assert((await goi(ckT, 'GET', `/giao-viec/chot_ngay_thi/${cy}`)).json?.coTheDoiNguoi === false, 'người theo dõi thấy nút đổi người');
    assert((await goi(ckT, 'POST', `/giao-viec/chot_ngay_thi/${cy}/han`, { han: addDays(TODAY, 5), hanCu: null })).status === 403, 'người theo dõi sửa được hạn');
    assert((await goi(ckT, 'POST', `/giao-viec/chot_ngay_thi/${cy}/phu-trach`, { userId: TVV2 ?? TVV, phuTrachCu: H })).status === 403, 'A → G → H: A (theo dõi) đổi được người');
    assert((await goi(ckG, 'PUT', `/hoc-vien-lop/lich-thi/${cy}`, { ketLuan: 'chot-ngay', ngay })).status === 403, 'người giao cũ còn ghi được việc');
    const ok = await goi(ckH, 'PUT', `/hoc-vien-lop/lich-thi/${cy}`, { ketLuan: 'chot-ngay', ngay });
    assert(ok.status === 200, `người được giao chốt ngày thi: ${ok.status} ${ok.json?.error}`);
    assert(get('SELECT exam_date FROM learning_cycles WHERE id = ?', cy).exam_date === ngay, 'chưa lưu ngày thi');
    /* Rà PTA #2280: được giao lộ trình A không ghi được lộ trình B; việc xong là mất quyền NGAY (không chờ quét ngày). */
    assert((await goi(ckH, 'PUT', `/hoc-vien-lop/lich-thi/${cyKhac}`, { ketLuan: 'chot-ngay', ngay })).status === 403, 'người được giao lộ trình A chốt được lộ trình B');
    /* P1-A (luật "không khoá cứng"): người được giao ĐÃ LÀM giữ quyền sửa lại / Hoàn tác ngay sau khi lưu. */
    const lai = await goi(ckH, 'PUT', `/hoc-vien-lop/lich-thi/${cy}`, { ketLuan: 'chot-ngay', ngay: addDays(TODAY, 12) });
    assert(lai.status === 200, `người đã làm sửa lại ngay sau lưu: ${lai.status} ${lai.json?.error}`);
    /* Rà #2280 vòng 3: Hoàn tác NGẮN — sau lượt quét ngày (dòng 'xong') người đã làm không còn quyền. */
    gv.dongKhungHetViec(); xoaNho();
    assert((await goi(ckH, 'PUT', `/hoc-vien-lop/lich-thi/${cy}`, { ketLuan: 'chot-ngay', ngay: addDays(TODAY, 13) })).status === 403, 'sau lượt quét người đã làm còn sửa được');
    /* Việc giao cho G nhưng TVV (vai) làm → việc hết, G (chưa làm) mất quyền ngay. */
    const r3 = await goi(ckT, 'POST', `/giao-viec/chot_ngay_thi/${cyKhac}/phu-trach`, { userId: G, phuTrachCu: null });
    assert(r3.status === 200, `giao lộ trình B: ${r3.status}`);
    assert((await goi(ckT, 'PUT', `/hoc-vien-lop/lich-thi/${cyKhac}`, { ketLuan: 'chot-ngay', ngay })).status === 200, 'TVV chốt thay');
    assert((await goi(ckG, 'PUT', `/hoc-vien-lop/lich-thi/${cyKhac}`, { ketLuan: 'chot-ngay', ngay: addDays(TODAY, 12) })).status === 403, 'việc hết do người khác làm mà người được giao còn sửa được');
    /* Chỉ đúng việc đó: H không sửa được Target / ghi chú lộ trình. */
    assert((await goi(ckH, 'PATCH', `/cycles/${cy}`, { note: 'x' })).status === 403, 'người được giao sửa được ghi chú lộ trình');
    /* Việc hết → quét ngày đóng dòng khung; người theo dõi thấy "vừa xong". */
    gv.dongKhungHetViec();
    assert(get('SELECT trang_thai FROM viec_chot_ngay_thi WHERE id = ?', cy).trang_thai === 'xong', 'quét ngày không đóng việc hết');
    const td = (await goi(ckG, 'GET', '/my-work/theo-doi')).json;
    assert(td?.nhom?.some((n: any) => n.loai === 'chot_ngay_thi' && n.vuaXong.some((x: any) => x.refId === cy)), `Đang theo dõi: ${JSON.stringify(td).slice(0, 300)}`);
  }));

  await checkAsync('LPB1-3 · HTTP Bổ sung hồ sơ thiếu: em đã giao rời nhóm TVV; người được giao sửa ĐÚNG trường còn thiếu (Ngày sinh 200; SĐT / tên / Ngày sinh khi đã có 403); người ngoài 403', () => thuHttp(async ({ vao, goi }) => {
    const lop = lopMoi('FT', true);
    const [G, H] = gvRanh(lop, 2);
    const { sid } = emFt(lop, { dob: null });
    const pT = loadPrincipal(TVV), pG = loadPrincipal(G);
    const nhom = (p: any) => viec(p).find((i) => i.group === 'bo_sung_ho_so' && i.emIds?.includes(sid));
    assert(nhom(pT)?.mine, 'tiền đề: em ở nhóm Bổ sung hồ sơ của TVV');
    const [ckT, ckG, ckH] = [await vao(TVV), await vao(G), await vao(H)];
    assert((await goi(ckT, 'POST', `/giao-viec/bo_sung_ho_so/${sid}/phu-trach`, { userId: G, phuTrachCu: null })).status === 200, 'TVV giao');
    assert(!nhom(pT), 'em đã giao còn trong nhóm TVV');
    assert(nhom(pG)?.mine && nhom(pG).emIds.length === 1, `nhóm của người được giao: ${JSON.stringify(nhom(pG))}`);
    assert((await goi(ckH, 'PATCH', `/students/${sid}`, { dob: '2011-02-03' })).status === 403, 'người ngoài bổ sung được hồ sơ');
    assert((await goi(ckG, 'PATCH', `/students/${sid}`, { phone: '0900000000' })).status === 403, 'người được giao sửa được SĐT (không phải trường thiếu)');
    assert((await goi(ckG, 'PATCH', `/students/${sid}`, { fullName: 'Ten khac' })).status === 403, 'người được giao đổi được tên');
    const ok = await goi(ckG, 'PATCH', `/students/${sid}`, { dob: '2011-02-03' });
    assert(ok.status === 200 && get('SELECT dob FROM students WHERE id = ?', sid).dob === '2011-02-03', `bổ sung ngày sinh: ${ok.status} ${ok.json?.error}`);
    /* P1-A: người đã làm sửa lại được đúng trường của việc; người ngoài vẫn không. */
    assert((await goi(ckG, 'PATCH', `/students/${sid}`, { dob: '2011-02-04' })).status === 200, 'người đã bổ sung không sửa lại được ngày sinh');
    assert((await goi(ckH, 'PATCH', `/students/${sid}`, { dob: '2011-02-05' })).status === 403, 'người ngoài sửa được ngày sinh');
    /* Rà PTA #2280: em khác (cùng lớp, cũng thiếu) → 403; em lớp thường thiếu Target: không mở Target (Target chỉ thiếu ở FT — cùng hàm thieuHoSoEm). */
    const { sid: sidKhac } = emFt(lop, { dob: null });
    assert((await goi(ckG, 'PATCH', `/students/${sidKhac}`, { dob: '2011-02-03' })).status === 403, 'được giao em A sửa được em B');
    const thuong = lopMoi('FOU', false);
    const { sid: sidT, cy: cyT } = emFt(thuong, { dob: null });
    conn.prepare('UPDATE learning_cycles SET target_score = NULL, route = NULL WHERE id = ?').run(cyT);
    xoaNho();
    assert((await goi(ckT, 'POST', `/giao-viec/bo_sung_ho_so/${sidT}/phu-trach`, { userId: G, phuTrachCu: null })).status === 200, 'giao em lớp thường');
    assert((await goi(ckG, 'PATCH', `/cycles/${cyT}`, { targetScore: 6, lyDo: 'bổ sung' })).status === 403, 'em lớp thường: người được giao đặt được Target');
    const bpxl = taoNguoi('scheduler'), bpxlTvv = taoNguoi('scheduler', 'consultant');
    const r = await goi(ckT, 'POST', `/giao-viec/bo_sung_ho_so/${sidKhac}/phu-trach`, { userId: bpxl, phuTrachCu: null });
    assert(r.status === 400 && /BPXL/.test(r.json?.error ?? ''), `giao việc TVV cho BPXL: ${r.status} ${r.json?.error}`);
    const ok2 = await goi(ckT, 'POST', `/giao-viec/bo_sung_ho_so/${sidKhac}/phu-trach`, { userId: bpxlTvv, phuTrachCu: null });
    assert(ok2.status === 200, `người có cả BPXL + TVV nhận được: ${ok2.status} ${ok2.json?.error}`);
    const loc = tn.timNguoi(P.admin, { moiVai: true, chiNhanh: MB, quyen: 'khong_bpxl', q: 'Nguoi thu LPB1' });
    assert(!loc.some((x: any) => x.id === bpxl) && loc.some((x: any) => x.id === bpxlTvv), `ô chọn người: ${JSON.stringify(loc.map((x: any) => x.id))} (${bpxl} / ${bpxlTvv})`);
    /* Mất vai TVV (chỉ còn BPXL) → việc về TVV mặc định. */
    conn.prepare(`UPDATE user_roles SET status = 'inactive' WHERE user_id = ? AND role_id = (SELECT id FROM roles WHERE key = 'consultant')`).run(bpxlTvv);
    gv.donGiaoHetHieuLuc({ userId: bpxlTvv }, null);
    xoaNho();
    assert(!get('SELECT phu_trach_id FROM viec_bo_sung_ho_so WHERE id = ?', sidKhac).phu_trach_id, 'người chỉ còn BPXL vẫn giữ việc TVV');
  }));

  await checkAsync('LPB1-4 · HTTP Bàn giao chuyển lớp: GVCN lớp nguồn giao việc (lớp) cho GV khác → GV đó xác nhận được (200), người ngoài 403; Bàn giao môn (lớp × môn) → id khung, người được giao ghi đúng môn đó, môn khác 403', () => thuHttp(async ({ vao, goi }) => {
    const nguon = lopMoi('FOU', false, 8); const dich = lopMoi('BE', false, 1);
    const [GVCN, GVL, G, H] = gvRanh(nguon, 4);
    gan(nguon, GVCN, null, true); gan(nguon, GVL, 'listening', false); gan(dich, H, null, true);
    xoaNho();
    seq += 1;
    const now = new Date().toISOString();
    const sid = Number(conn.prepare(`INSERT INTO students (student_code, full_name, normalized_name, branch_id, status, created_at, consultant_user_id) VALUES (?,?,?,?, 'active', ?, ?)`)
      .run(`PISA-LPB1-${seq}`, `Hoc vien LPB1 ${seq}`, `hoc vien lpb1 ${seq}`, MB, now, TVV).lastInsertRowid);
    conn.prepare(`INSERT INTO enrollments (student_id, class_id, status, started_at, created_at) VALUES (?,?, 'active', ?, ?)`).run(sid, nguon, TODAY, now);
    conn.prepare(`INSERT INTO learning_cycles (student_id, seq, route, programme_code, started_at, status, created_at) VALUES (?, 1, NULL, 'FOU', ?, 'active', ?)`).run(sid, TODAY, now);
    xoaNho();
    const r0 = lenh.raLenh(P.mbManager, { lopNguonId: nguon, boiCanh: 'cuoi-khoa', tuanChung: null, dongs: [{ studentId: sid, huong: 'len_lop', toClassId: dich, tuan: d.tuanChonDuoc(TODAY)[0] }] });
    assert(r0.ok.length === 1, JSON.stringify(r0.failed));
    xoaNho();
    const lenhId = get('SELECT id FROM lenh_chuyen_lop WHERE student_id = ? ORDER BY id DESC LIMIT 1', sid).id as number;
    /* Em thứ hai: GVCN xác nhận TRƯỚC khi giao việc — không được tính cho người được giao (P1-B). */
    const emThem = () => {
      seq += 1;
      const t0 = new Date().toISOString();
      const x = Number(conn.prepare(`INSERT INTO students (student_code, full_name, normalized_name, branch_id, status, created_at, consultant_user_id) VALUES (?,?,?,?, 'active', ?, ?)`)
        .run(`PISA-LPB1-${seq}`, `Hoc vien LPB1 ${seq}`, `hoc vien lpb1 ${seq}`, MB, t0, TVV).lastInsertRowid);
      conn.prepare(`INSERT INTO enrollments (student_id, class_id, status, started_at, created_at) VALUES (?,?, 'active', ?, ?)`).run(x, nguon, TODAY, t0);
      conn.prepare(`INSERT INTO learning_cycles (student_id, seq, route, programme_code, started_at, status, created_at) VALUES (?, 1, NULL, 'FOU', ?, 'active', ?)`).run(x, TODAY, t0);
      xoaNho();
      const r = lenh.raLenh(P.mbManager, { lopNguonId: nguon, boiCanh: 'cuoi-khoa', tuanChung: null, dongs: [{ studentId: x, huong: 'len_lop', toClassId: dich, tuan: d.tuanChonDuoc(TODAY)[0] }] });
      assert(r.ok.length === 1, JSON.stringify(r.failed));
      xoaNho();
      return get('SELECT id FROM lenh_chuyen_lop WHERE student_id = ? ORDER BY id DESC LIMIT 1', x).id as number;
    };
    const lenhTruoc = emThem();
    const pC = loadPrincipal(GVCN), pG = loadPrincipal(G);
    assert(coViec(pC, `ban_giao:${nguon}`)?.mine, 'tiền đề: GVCN có việc Bàn giao');
    const [ckC, ckL, ckG, ckH] = [await vao(GVCN), await vao(GVL), await vao(G), await vao(H)];
    const nx = { nhanXetChung: 'Em học chăm, cần luyện thêm nghe.' };
    assert((await goi(ckC, 'POST', `/lenh-chuyen/${lenhTruoc}/xac-nhan`, nx)).status === 200, 'GVCN xác nhận em thứ hai');
    assert((await goi(ckG, 'POST', `/lenh-chuyen/${lenhId}/xac-nhan`, { nhanXetChung: 'Em học chăm, cần luyện thêm nghe.' })).status === 403, 'GV ngoài xác nhận được');
    assert((await goi(ckC, 'POST', `/giao-viec/ban_giao/${nguon}/phu-trach`, { userId: G, phuTrachCu: null })).status === 200, 'GVCN giao việc Bàn giao');
    assert(!coViec(pC, `ban_giao:${nguon}`) && coViec(pG, `ban_giao:${nguon}`)?.mine, 'việc chưa rời GVCN / chưa vào người được giao');
    assert((await goi(ckH, 'POST', `/lenh-chuyen/${lenhId}/xac-nhan`, { nhanXetChung: 'Em học chăm, cần luyện thêm nghe.' })).status === 403, 'người ngoài (GVCN lớp đích) xác nhận được');
    /* Rà #2334 P2-6 (LPB-3 [XM-2]): Tuyến của em trong panel Bàn giao — panel đọc `lenhId` từ GET bàn giao rồi gọi đường tuyến SẴN CÓ; GVCN lớp nguồn xem được,
       người ngoài (GV không dạy lớp nào của em) không (404 — đường tuyến không lộ việc có tồn tại). */
    const bg = await goi(ckC, 'GET', `/lenh-chuyen/ban-giao?lop=${nguon}`);
    assert(bg.status === 200 && (bg.json?.ds ?? []).some((e: any) => e.lenhId === lenhId), `GET bàn giao thiếu lenhId: ${bg.status}`);
    const tu = await goi(ckC, 'GET', `/tuyen/chuyen_lop/${lenhId}`);
    assert(tu.status === 200 && tu.json?.buoc?.some((b: any) => b.khoa === 'ban_giao'), `GVCN xem tuyến: ${tu.status} ${tu.json?.error}`);
    const [X] = gvRanh(nguon, 6).filter((u) => ![GVCN, GVL, G, H].includes(u));
    assert((await goi(await vao(X), 'GET', `/tuyen/chuyen_lop/${lenhId}`)).status === 404, 'người ngoài xem được tuyến Chuyển lớp của em');
    /* Bàn giao môn (Listening): id khung qua `mo`, giao cho H; H ghi đúng môn đó, môn khác 403. */
    assert((await goi(ckH, 'POST', '/giao-viec/ban_giao_mon/mo', { lopId: nguon, mon: 'listening' })).status === 403, 'người ngoài lớp nguồn mở được id khung môn');
    assert((await goi(ckL, 'POST', '/giao-viec/ban_giao_mon/mo', { lopId: nguon, mon: 'khong_co' })).status === 400, 'cặp (lớp, môn) không có việc vẫn mở được');
    const mo = await goi(ckL, 'POST', '/giao-viec/ban_giao_mon/mo', { lopId: nguon, mon: 'listening' });
    assert(mo.status === 200 && mo.json?.id, `mở id khung môn: ${mo.status} ${mo.json?.error}`);
    assert((await goi(ckL, 'POST', '/giao-viec/ban_giao_mon/mo', { lopId: nguon, mon: 'listening' })).json?.id === mo.json.id, 'mở lại không cùng id');
    assert((await goi(ckL, 'POST', `/giao-viec/ban_giao_mon/${mo.json.id}/phu-trach`, { userId: H, phuTrachCu: null })).status === 200, 'GVBM giao môn');
    assert((await goi(ckH, 'PUT', `/lenh-chuyen/${lenhId}/ban-giao-mon`, { mon: 'reading', noiDung: 'Đọc ổn.' })).status === 403, 'người được giao môn L ghi được môn R');
    const m = await goi(ckH, 'PUT', `/lenh-chuyen/${lenhId}/ban-giao-mon`, { mon: 'listening', noiDung: 'Nghe cần luyện thêm.' });
    assert(m.status === 200, `người được giao ghi môn được giao: ${m.status} ${m.json?.error}`);
    const ok = await goi(ckG, 'POST', `/lenh-chuyen/${lenhId}/xac-nhan`, { nhanXetChung: 'Em học chăm, cần luyện thêm nghe.' });
    assert(ok.status === 200 && get('SELECT xac_nhan_boi FROM lenh_chuyen_lop WHERE id = ?', lenhId).xac_nhan_boi === G, `người được giao xác nhận: ${ok.status} ${ok.json?.error}`);
    /* P1-B: Việc đã xong — lệnh xác nhận trước khi giao tính cho GVCN, lệnh sau khi giao tính cho người được giao. */
    const xong = (await import('../phanTich/viecDaXong.ts')).viecXongCn({ cns: [MB], khung: 'thuong', tu: addDays(TODAY, -60), cuoi: addDays(TODAY, 60), homNay: addDays(TODAY, 1) }).get(MB) ?? [];
    const cua = (lid: number) => xong.find((x: any) => x.key === `ban-giao-xong:gvcn:${lid}`)?.ownerId;
    assert(cua(lenhId) === G && cua(lenhTruoc) === GVCN, `Việc đã xong: lệnh sau giao ${cua(lenhId)} (≠ ${G}) · lệnh trước giao ${cua(lenhTruoc)} (≠ ${GVCN})`);
    /* Đợt mới cùng lớp: GV đợt trước (đã làm, dòng đã quét 'xong') không còn quyền. */
    gv.dongKhungHetViec(); xoaNho();
    const lenhSau = emThem();
    assert((await goi(ckG, 'POST', `/lenh-chuyen/${lenhSau}/xac-nhan`, nx)).status === 403, 'GV được giao đợt trước xác nhận được đợt mới');
  }));

  await checkAsync('LPB1-5 · HTTP Chốt lộ trình: chỉ giao cho người CÓ QUYỀN CHỐT (N63 ①) — GV / TVV 400; Quản trị 200 → việc rời Head, vào Quản trị; người ngoài đổi người 403', () => thuHttp(async ({ vao, goi }) => {
    const lop = lopMoi('FOU', false, 12);
    seq += 1;
    const now = new Date().toISOString();
    const sid = Number(conn.prepare(`INSERT INTO students (student_code, full_name, normalized_name, branch_id, status, created_at, consultant_user_id) VALUES (?,?,?,?, 'active', ?, ?)`)
      .run(`PISA-LPB1-${seq}`, `Hoc vien LPB1 ${seq}`, `hoc vien lpb1 ${seq}`, MB, now, TVV).lastInsertRowid);
    conn.prepare(`INSERT INTO enrollments (student_id, class_id, status, started_at, created_at) VALUES (?,?, 'active', ?, ?)`).run(sid, lop, TODAY, now);
    xoaNho();
    const head = P.mbManager;
    const it = coViec(head, `chotft:${lop}`);
    if (!it) { console.log('    (bỏ qua phần Công việc: lớp thử chưa tới tuần Chốt lộ trình trên seed này)'); }
    const [G] = gvRanh(lop, 1);
    const [ckHead, ckG, ckT] = [await vao(head.userId), await vao(G), await vao(TVV)];
    const giao = (ck: string, u: number) => goi(ck, 'POST', `/giao-viec/chot_lo_trinh/${lop}/phu-trach`, { userId: u, phuTrachCu: null });
    if (!it) return;
    const r1 = await giao(ckHead, G);
    assert(r1.status === 400 && /quyền chốt/.test(r1.json?.error ?? ''), `GV nhận Chốt lộ trình: ${r1.status} ${r1.json?.error}`);
    assert((await giao(ckHead, TVV)).status === 400, 'TVV nhận Chốt lộ trình');
    assert((await giao(ckG, P.admin.userId)).status === 403, 'GV ngoài đổi người');
    const r2 = await giao(ckHead, P.admin.userId);
    assert(r2.status === 200, `Quản trị nhận: ${r2.status} ${r2.json?.error}`);
    assert(!coViec(head, `chotft:${lop}`) && coViec(P.admin, `chotft:${lop}`)?.mine, 'việc chưa rời Head / chưa vào Quản trị');
    void ckT;
  }));

  await checkAsync('LPB1-10 · HTTP KQ thi thật → Bước tiếp: TVV giao "Cập nhật KQ thi thật" cho GV → GV nhập được (200), người ngoài 403; "Chọn bước tiếp" giao cho GV → GV mở panel + chọn được, người ngoài 403', () => thuHttp(async ({ vao, goi }) => {
    const lop = lopMoi('FT', true);
    const [G, H] = gvRanh(lop, 2);
    const { cy } = emFt(lop);
    const { cy: cyB } = emFt(lop);
    const thi = addDays(TODAY, -3);
    for (const c of [cy, cyB]) conn.prepare('UPDATE learning_cycles SET exam_date = ?, exam_month = ?, exam_period_id = ? WHERE id = ?').run(thi, thi.slice(0, 7), week.ensurePeriod(d.mondayOfDate(thi)).id, c);
    xoaNho();
    const pT = loadPrincipal(TVV), pG = loadPrincipal(G);
    assert(coViec(pT, `thi_that:${cy}`)?.mine, `tiền đề: TVV giữ "Cập nhật KQ thi thật": ${JSON.stringify(viec(pT).filter((i) => i.cycleId === cy).map((i) => i.key))}`);
    const [ckT, ckG, ckH] = [await vao(TVV), await vao(G), await vao(H)];
    assert((await goi(ckG, 'PUT', `/cycles/${cy}/outcome`, { khongThi: true })).status === 403, 'GV chưa được giao nhập được KQ thi thật');
    assert((await goi(ckT, 'POST', `/giao-viec/thi_that/${cy}/phu-trach`, { userId: G, phuTrachCu: null })).status === 200, 'TVV giao KQ thi thật');
    assert(!coViec(pT, `thi_that:${cy}`) && coViec(pG, `thi_that:${cy}`)?.mine, 'việc chưa rời TVV / chưa vào GV');
    assert((await goi(ckH, 'PUT', `/cycles/${cy}/outcome`, { khongThi: true })).status === 403, 'người ngoài nhập được KQ thi thật');
    assert((await goi(ckG, 'PUT', `/cycles/${cyB}/outcome`, { khongThi: true })).status === 403, 'được giao lộ trình A nhập được KQ lộ trình B');
    const kq = await goi(ckG, 'PUT', `/cycles/${cy}/outcome`, { khongThi: true });
    assert(kq.status === 200, `người được giao nhập KQ thi thật: ${kq.status} ${kq.json?.error}`);
    assert((await goi(ckG, 'PUT', `/cycles/${cy}/outcome`, { khongThi: true, ghiChu: 'sửa lại' })).status === 200, 'người đã nhập KQ không sửa lại được ngay sau lưu (P1-A)');
    xoaNho();
    const bt = coViec(pT, `buoc_tiep:${cy}`);
    if (!bt) { console.log('    (bỏ qua phần Bước tiếp: lộ trình "Không thi" chưa thành việc chờ chọn trên seed này)'); return; }
    assert((await goi(ckG, 'GET', `/cycles/${cy}/buoc-tiep`)).status === 403, 'GV chưa được giao mở được panel Bước tiếp');
    assert((await goi(ckT, 'POST', `/giao-viec/buoc_tiep/${cy}/phu-trach`, { userId: G, phuTrachCu: null })).status === 200, 'TVV giao Bước tiếp');
    const mo = await goi(ckG, 'GET', `/cycles/${cy}/buoc-tiep`);
    assert(mo.status === 200 && mo.json?.coTheChon === true, `người được giao mở panel: ${mo.status} ${JSON.stringify(mo.json).slice(0, 200)}`);
    assert((await goi(ckH, 'GET', `/cycles/${cy}/buoc-tiep`)).status === 403, 'người ngoài mở được panel Bước tiếp');
    assert((await goi(ckH, 'POST', `/cycles/${cy}/buoc-tiep`, { chon: 'ket_thuc' })).status === 403, 'người ngoài chọn được Bước tiếp');
    assert((await goi(ckG, 'GET', `/cycles/${cyB}/buoc-tiep`)).status === 403, 'được giao lộ trình A mở được Bước tiếp lộ trình B');
    /* P1-A: chọn rồi Hoàn tác ngay (người đã làm giữ quyền). */
    const chon = await goi(ckG, 'POST', `/cycles/${cy}/buoc-tiep`, { chon: 'tam_dung' });
    assert(chon.status === 200, `người được giao chọn Bước tiếp: ${chon.status} ${chon.json?.error}`);
    assert((await goi(ckG, 'GET', `/cycles/${cy}/buoc-tiep`)).status === 200, 'người đã làm mất panel ngay sau chọn');
    const ht = await goi(ckG, 'DELETE', `/cycles/${cy}/buoc-tiep`);
    assert(ht.status === 200, `người đã làm Hoàn tác Bước tiếp: ${ht.status} ${ht.json?.error}`);
    assert((await goi(ckH, 'DELETE', `/cycles/${cy}/buoc-tiep`)).status === 403, 'người ngoài Hoàn tác được');
  }));

  await checkAsync('LPB1-11 · HTTP Bàn giao đổi GV: giao cho GV khác → người viết mới ghi nhận xét được (200), GV cũ (người viết theo luật, đã giao đi) 403, người ngoài 403', () => thuHttp(async ({ vao, goi }) => {
    const lop = lopMoi('FT', true);
    const [CU, MOI, G, H] = gvRanh(lop, 4);
    const now = new Date().toISOString();
    const doi = Number(conn.prepare(`INSERT INTO doi_phan_cong (class_id, khoa, nguoi_cu, nguoi_moi, hieu_luc, trang_thai, tao_ban_giao, tao_boi, tao_luc) VALUES (?, 'listening', ?, ?, ?, 'da_ap', 1, ?, ?)`)
      .run(lop, CU, MOI, TODAY, P.mbManager.userId, now).lastInsertRowid);
    const bg = Number(conn.prepare(`INSERT INTO ban_giao_gv (class_id, nguoi_cu, nguoi_lam, hieu_luc, han, trang_thai, tao_luc, tao_boi) VALUES (?, ?, ?, ?, ?, 'mo', ?, ?)`)
      .run(lop, CU, CU, TODAY, addDays(TODAY, 7), now, P.mbManager.userId).lastInsertRowid);
    conn.prepare(`INSERT INTO ban_giao_gv_mon (ban_giao_id, mon, nguoi_moi, doi_id, trang_thai) VALUES (?, 'listening', ?, ?, 'mo')`).run(bg, MOI, doi);
    xoaNho();
    const [ckC, ckG, ckH] = [await vao(CU), await vao(G), await vao(H)];
    assert(coViec(loadPrincipal(CU), `ban_giao_gv:${bg}`)?.mine, 'tiền đề: GV cũ giữ việc bàn giao');
    assert((await goi(ckC, 'POST', `/giao-viec/ban_giao_gv/${bg}/phu-trach`, { userId: G, phuTrachCu: null })).status === 200, 'GV cũ giao');
    assert(!coViec(loadPrincipal(CU), `ban_giao_gv:${bg}`) && coViec(loadPrincipal(G), `ban_giao_gv:${bg}`)?.mine, 'việc chưa rời GV cũ / chưa vào người được giao');
    const nx = { nhanXetChung: 'Lớp nghe tốt, cần luyện thêm chép chính tả.' };
    assert((await goi(ckC, 'PUT', `/ban-giao-gv/${bg}/nhan-xet`, nx)).status === 403, 'GV cũ (đã giao đi) còn ghi được');
    assert((await goi(ckH, 'PUT', `/ban-giao-gv/${bg}/nhan-xet`, nx)).status === 403, 'người ngoài ghi được');
    const ok = await goi(ckG, 'PUT', `/ban-giao-gv/${bg}/nhan-xet`, nx);
    assert(ok.status === 200, `người được giao ghi nhận xét: ${ok.status} ${ok.json?.error}`);
  }));

  await checkAsync('LPB1-13 · HTTP (rà #2280 vòng 3): ghi người làm theo ĐÚNG việc + trường — chốt ngày thi không mở Target; bổ sung Ngày sinh sửa lại được Ngày sinh, không Email; hết sau lượt quét', () => thuHttp(async ({ vao, goi }) => {
    const lop = lopMoi('FT', true);
    const [H] = gvRanh(lop, 1);
    const { sid, cy } = emFt(lop, { dob: null });
    const [ckT, ckH] = [await vao(TVV), await vao(H)];
    for (const [l, id] of [['chot_ngay_thi', cy], ['bo_sung_ho_so', sid]] as const) assert((await goi(ckT, 'POST', `/giao-viec/${l}/${id}/phu-trach`, { userId: H, phuTrachCu: null })).status === 200, `giao ${l}`);
    assert((await goi(ckH, 'PUT', `/hoc-vien-lop/lich-thi/${cy}`, { ketLuan: 'chot-ngay', ngay: addDays(TODAY, 10) })).status === 200, 'chốt ngày thi');
    assert((await goi(ckH, 'PATCH', `/cycles/${cy}`, { targetScore: 7, lyDo: 'đổi' })).status === 403, 'chốt ngày thi mở được Target');
    assert((await goi(ckH, 'PATCH', `/students/${sid}`, { dob: '2011-03-03' })).status === 200, 'bổ sung Ngày sinh');
    assert((await goi(ckH, 'PATCH', `/students/${sid}`, { dob: '2011-03-04' })).status === 200, 'sửa lại Ngày sinh vừa bổ sung');
    assert((await goi(ckH, 'PATCH', `/students/${sid}`, { email: 'khac@vd.test' })).status === 403, 'sửa được Email (không phải trường đã bổ sung)');
    gv.dongKhungHetViec(); xoaNho();
    assert((await goi(ckH, 'PATCH', `/students/${sid}`, { dob: '2011-03-05' })).status === 403, 'sau lượt quét vẫn sửa được hồ sơ');
  }));

  check('LPB1-6 · Xét lại / Xếp lịch MT: người nhận hợp lệ theo quyền (khungNhanDuoc) — CX / GV / TVV không chốt được; Head / Quản trị được; Xếp lịch MT: GV không', () => {
    const lop = get(`SELECT id FROM classes WHERE branch_id = ? AND status = 'active' ORDER BY id LIMIT 1`, MB).id as number;
    const cx = get(`SELECT ur.user_id AS id FROM user_roles ur JOIN roles r ON r.id = ur.role_id WHERE r.key = 'cx' AND ur.status = 'active' ORDER BY ur.user_id LIMIT 1`)?.id;
    const [g] = nguoiVai('teacher', 1);
    for (const l of ['chot_lo_trinh', 'xet_lai']) {
      assert(gv.khungNhanDuoc(l, lop, P.mbManager.userId) && gv.khungNhanDuoc(l, lop, P.admin.userId), `${l}: Head / Quản trị không nhận được`);
      assert(!gv.khungNhanDuoc(l, lop, g) && !gv.khungNhanDuoc(l, lop, TVV), `${l}: GV / TVV nhận được`);
      if (cx) assert(!gv.khungNhanDuoc(l, lop, cx), `${l}: CX nhận được (N63 ①)`);
    }
    assert(gv.khungNhanDuoc('xep_lich_mt', lop, P.mbManager.userId) && !gv.khungNhanDuoc('xep_lich_mt', lop, g), 'Xếp lịch MT: Head không / GV có');
    assert(gv.khungNhanDuoc('chot_ngay_thi', lop, g, MB), 'việc TVV: ai có tài khoản ở chi nhánh cũng nhận được (N58)');
    /* Chi nhánh ngoài phạm vi người gọi → [] (cả khi lọc theo quyền). */
    for (const quyen of ['chot', 'xep_lich', 'khong_bpxl'] as const) assert(!tn.timNguoi(P.cpManager, { moiVai: true, chiNhanh: MB, quyen }).length, `${quyen}: Head CP thấy người MB`);
    /* Ô chọn người (`/ref/nguoi?nhom=giao_viec&quyen=…`) chỉ liệt kê người hợp lệ — cùng luật máy chủ kiểm khi lưu. */
    for (const [quyen, loai] of [['chot', 'chot_lo_trinh'], ['xep_lich', 'xep_lich_mt']] as const) {
      const ds = tn.timNguoi(P.admin, { moiVai: true, chiNhanh: MB, quyen });
      assert(ds.length > 0 && ds.every((r: any) => gv.khungNhanDuoc(loai, lop, r.id)), `${quyen}: ${ds.filter((r: any) => !gv.khungNhanDuoc(loai, lop, r.id)).map((r: any) => r.role).join(', ')}`);
      assert(tn.timNguoi(P.admin, { moiVai: true, chiNhanh: MB }).some((r: any) => !gv.khungNhanDuoc(loai, lop, r.id)), `tiền đề ${quyen}: danh sách không lọc có người không hợp lệ`);
    }
  });

  check('LPB1-7 · Lưu trữ: khung việc TVV của em → bo, Hoàn tác trả mo; xoá HV: dòng khung + người theo dõi đi theo', () => thu(() => {
    const lop = lopMoi('FT', true);
    const [G] = gvRanh(lop, 1);
    const { sid, cy } = emFt(lop, { dob: null });
    const pT = loadPrincipal(TVV);
    gv.doiPhuTrach(pT, 'chot_ngay_thi', cy, { userId: G, phuTrachCu: null });
    gv.doiPhuTrach(pT, 'bo_sung_ho_so', sid, { userId: G, phuTrachCu: null });
    const dl = luu.dongViecLuuTru(null, sid, TODAY, null);
    assert(dl.khung?.length === 2 && get('SELECT trang_thai t FROM viec_chot_ngay_thi WHERE id = ?', cy).t === 'bo' && get('SELECT trang_thai t FROM viec_bo_sung_ho_so WHERE id = ?', sid).t === 'bo',
      `Lưu trữ: ${JSON.stringify(dl.khung)}`);
    luu.moLaiViecLuuTru(null, sid, dl);
    assert(get('SELECT trang_thai t, phu_trach_id pt FROM viec_chot_ngay_thi WHERE id = ?', cy).t === 'mo', 'Hoàn tác không trả');
    assert(all(`SELECT 1 FROM viec_theo_doi WHERE loai IN ('chot_ngay_thi', 'bo_sung_ho_so') AND ref_id IN (?, ?)`, cy, sid).length >= 2, 'tiền đề: có người theo dõi');
    for (const q of xoaHv.CAU_XOA_HOC_VIEN) if (!q.sql.startsWith('SELECT')) conn.prepare(q.sql).run(sid);
    assert(!get('SELECT 1 FROM viec_chot_ngay_thi WHERE id = ?', cy) && !get('SELECT 1 FROM viec_bo_sung_ho_so WHERE id = ?', sid), 'xoá HV còn dòng khung');
    assert(!get(`SELECT 1 FROM viec_theo_doi WHERE (loai = 'chot_ngay_thi' AND ref_id = ?) OR (loai = 'bo_sung_ho_so' AND ref_id = ?)`, cy, sid), 'xoá HV còn người theo dõi việc khung');
  }));

  check('LPB1-8 · Hạn đặt tay thắng; người được giao hết vai ở chi nhánh → việc về TVV (người mặc định)', () => thu(() => {
    const lop = lopMoi('FT', true);
    const [G] = gvRanh(lop, 1);
    const { cy } = emFt(lop);
    const pT = loadPrincipal(TVV);
    const k = gv.suaHan(pT, 'chot_ngay_thi', cy, { han: addDays(TODAY, 3), hanCu: null });
    assert(k.han === addDays(TODAY, 3) && k.hanChon === addDays(TODAY, 3), JSON.stringify(k).slice(0, 200));
    xoaNho();
    assert(coViec(pT, `chot-ngay-thi:${cy}`)?.due === addDays(TODAY, 3), 'hạn đặt tay không lên Công việc');
    gv.doiPhuTrach(pT, 'chot_ngay_thi', cy, { userId: G, phuTrachCu: null });
    conn.prepare(`UPDATE user_roles SET status = 'inactive' WHERE user_id = ?`).run(G);
    gv.donGiaoHetHieuLuc({ userId: G }, null);
    xoaNho();
    assert(coViec(pT, `chot-ngay-thi:${cy}`)?.mine, 'người được giao hết vai mà việc không về TVV');
  }));

  check('LPB1-12 · Tốc độ (rà PTA #2280): Đang theo dõi + quét ngày đọc việc khung theo LOẠI — 20 dòng theo dõi (Chốt ngày thi · Bổ sung hồ sơ) không thêm câu theo dòng', () => thu(() => {
    const lop = lopMoi('FT', true);
    const [X] = gvRanh(lop, 1);
    const pT = loadPrincipal(TVV), pX = loadPrincipal(X);
    const em = Array.from({ length: 10 }, () => emFt(lop, { dob: null }));
    const dem = () => chayTrongRequest('GET', () => { const a = soCauSql(); gv.viecTheoDoi(pX); return soCauSql() - a; });
    gv.themTheoDoi(pT, 'chot_ngay_thi', em[0].cy, { userIds: [X] });
    xoaNho();
    const mot = dem();
    for (const e of em) { gv.themTheoDoi(pT, 'chot_ngay_thi', e.cy, { userIds: [X] }); gv.themTheoDoi(pT, 'bo_sung_ho_so', e.sid, { userIds: [X] }); }
    /* + 5 dòng Bàn giao môn (5 lớp) — câu theo loại, không theo lớp / dòng. */
    for (let i = 0; i < 5; i++) {
      const l = lopMoi('FOU', false, 8);
      const id = Number(conn.prepare(`INSERT INTO viec_ban_giao_mon (lop_id, mon, trang_thai, tao_luc) VALUES (?, 'listening', 'mo', ?)`).run(l, new Date().toISOString()).lastInsertRowid);
      conn.prepare(`INSERT INTO viec_theo_doi (loai, ref_id, user_id, nguon, them_boi, luc) VALUES ('ban_giao_mon', ?, ?, 'tay', ?, ?)`).run(id, X, TVV, new Date().toISOString());
    }
    xoaNho();
    const hai = dem();
    const td = gv.viecTheoDoi(pX);
    assert(td.nhom.find((n: any) => n.loai === 'chot_ngay_thi')?.mo.length === 10 && td.nhom.find((n: any) => n.loai === 'bo_sung_ho_so')?.mo.length === 10, JSON.stringify(td).slice(0, 300));
    assert(hai - mot <= 12, `Đang theo dõi: 1 dòng ${mot} câu → 25 dòng ${hai} câu (thêm câu theo dòng)`);   // + loại Bàn giao môn (câu theo loại)
    assert(hai <= 30, `Đang theo dõi 25 dòng khung ${hai} câu > 30`);
    let dong = 0;
    const q = chayTrongRequest('GET', () => { const a = soCauSql(); dong = gv.dongKhungHetViec(); return soCauSql() - a; });
    /* Đọc theo loại (≤ 25 câu) + mỗi dòng ĐÃ HẾT việc một lượt ghi (đóng + tin người theo dõi, ≤ 5 câu) — dòng còn mở không thêm câu. */
    assert(q <= 25 + 5 * dong, `quét ngày 25 dòng khung (${dong} dòng hết việc) ${q} câu > ${25 + 5 * dong}`);
    console.log(`      (đo: Đang theo dõi 1 dòng ${mot} câu · 25 dòng ${hai} câu · quét ngày ${q} câu, ${dong} dòng đóng)`);
  }));

  check('LPB1-9 · Tốc độ: /my-work của GV không có việc giao → +1 câu (đọc khung việc đã giao, một lần mỗi request)', () => {
    const p = P.subjectTeacher;
    const n = chayTrongRequest('GET', () => { const a = soCauSql(); myWork(p, {}); return soCauSql() - a; });
    const giao = chayTrongRequest('GET', () => { const a = soCauSql(); kv.giaoKhung(); kv.giaoKhung(); return soCauSql() - a; });
    assert(giao === 1, `đọc khung việc đã giao ${giao} câu (nhớ theo request)`);
    assert(n > 0, `số câu /my-work ${n}`);
  });

  /* PR máy chủ sau LPB-3 / VAI-1 XM-2 (PTA 28/11). */
  check('LPB1-16 · khongTvvDong (Chốt ngày thi · Bước tiếp · KQ thi thật · Bổ sung hồ sơ): người giữ theo luật không phải TVV của em → chua_co / da_nghi; TVV giữ / đã giao tay / chưa ai giữ → không; /my-work thật', () => {
    const vt = vtMod;
    assert(vt.khongTvvDong({ ownerId: 5 }, null) === 'chua_co', 'chưa có TVV');
    assert(vt.khongTvvDong({ ownerId: 5 }, 9) === 'da_nghi', 'TVV hết vai (người giữ khác TVV)');
    assert(vt.khongTvvDong({ ownerId: 9 }, 9) === null, 'TVV giữ');
    assert(vt.khongTvvDong({ ownerId: 5, giaoBoi: 'Head' }, null) === null, 'đã giao tay');
    assert(vt.khongTvvDong({ ownerId: null }, null) === null, 'chưa ai giữ');
    /* Đường thật (/my-work): Chốt ngày thi của em chưa có TVV → về Head, dòng `chua_co`; TVV không còn vai TVV ở chi nhánh em → `da_nghi`. */
    thu(() => {
      const lop = lopMoi('FT', true);
      const { sid, cy } = emFt(lop);
      const k = `chot-ngay-thi:${cy}`;
      conn.prepare('UPDATE students SET consultant_user_id = NULL WHERE id = ?').run(sid); xoaNho();
      assert(coViec(P.mbManager, k)?.khongTvv === 'chua_co', `chua_co: ${JSON.stringify(coViec(P.mbManager, k))?.slice(0, 160)}`);
      conn.prepare('UPDATE students SET consultant_user_id = ? WHERE id = ?').run(nguoiVai('teacher', 1)[0], sid); xoaNho();
      assert(coViec(P.mbManager, k)?.khongTvv === 'da_nghi', 'da_nghi');
      conn.prepare('UPDATE students SET consultant_user_id = ? WHERE id = ?').run(TVV, sid); xoaNho();
      assert(coViec(loadPrincipal(TVV), k) && !coViec(loadPrincipal(TVV), k).khongTvv, 'TVV giữ mà vẫn có cờ');
    });
  });
  check('LPB1-15 · [XM-3] Head + GĐCN theo dõi mặc định việc khung ĐÃ GIAO (tính khi đọc): khối + tab Đang theo dõi cùng hàm; chưa giao → không; bỏ theo dõi → hết ở cả hai, có lịch sử', () => thu(() => {
    const HEAD = nguoiVai('manager', 1)[0];
    const lop = lopMoi('FT', true);
    const [G] = gvRanh(lop, 1);
    const { cy } = emFt(lop);
    const pT = loadPrincipal(TVV), pH = loadPrincipal(HEAD);
    const cauTab = () => chayTrongRequest('GET', () => { const a = soCauSql(); gv.viecTheoDoi(pH); return soCauSql() - a; });
    xoaNho();
    const n0 = cauTab();
    const coHead = (k: any) => k.theoDoi.some((x: any) => x.id === HEAD && x.vai === 'head');
    const trongTab = () => { xoaNho(); return gv.viecTheoDoi(pH).nhom.some((n: any) => n.mo.some((x: any) => x.loai === 'chot_ngay_thi' && x.refId === cy)); };
    assert(!coHead(gv.xemGiaoViec(pT, 'chot_ngay_thi', cy)) && !trongTab(), 'việc ở người theo luật mà Head đã theo dõi');
    gv.doiPhuTrach(pT, 'chot_ngay_thi', cy, { userId: G, phuTrachCu: null });
    xoaNho();
    const k = gv.xemGiaoViec(pH, 'chot_ngay_thi', cy);
    assert(coHead(k) && k.toiTheoDoi, `khối thiếu Head: ${JSON.stringify(k.theoDoi)}`);
    assert(!all(`SELECT 1 FROM viec_theo_doi WHERE loai = 'chot_ngay_thi' AND ref_id = ? AND user_id = ?`, cy, HEAD).length, 'không chèn dòng theo dõi (tính khi đọc)');
    assert(trongTab(), 'tab Đang theo dõi của Head thiếu việc đã giao');
    xoaNho();
    /* Tốc độ (rà #2334 P2-1): dòng mặc định dựng gọn từ `giaoKhung` (không `docViecLo`) — +1 câu lịch sử "bỏ" khi có ứng viên (tập giao đã đọc ở n0). */
    const n1 = cauTab();
    console.log(`      (đo: Đang theo dõi của Head ${n0} → ${n1} câu khi có một việc khung đã giao)`);
    assert(n1 - n0 <= 1, `Đang theo dõi ${n0} → ${n1} câu`);
    xoaNho();
    const sau = gv.boTheoDoi(pH, 'chot_ngay_thi', cy, HEAD);
    assert(!coHead(sau) && !trongTab(), 'bỏ theo dõi mặc định mà vẫn còn');
    assert(all(`SELECT 1 FROM viec_giao_lan WHERE loai = 'chot_ngay_thi' AND ref_id = ? AND truong = 'theo_doi' AND cu = ? AND moi IS NULL`, cy, String(HEAD)).length === 1, 'thiếu lịch sử bỏ');
  }));
}
