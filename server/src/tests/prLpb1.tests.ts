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
    assert((await goi(ckH, 'PUT', `/hoc-vien-lop/lich-thi/${cy}`, { ketLuan: 'chot-ngay', ngay: addDays(TODAY, 12) })).status === 403, 'việc đã xong mà người được giao còn sửa được');
    /* Chỉ đúng việc đó: H không sửa được Target / ghi chú lộ trình. */
    assert((await goi(ckH, 'PATCH', `/cycles/${cy}`, { note: 'x' })).status === 403, 'người được giao sửa được ghi chú lộ trình');
    /* Việc hết → quét ngày đóng dòng khung; người theo dõi thấy "vừa xong". */
    assert(gv.dongKhungHetViec() >= 1 && get('SELECT trang_thai FROM viec_chot_ngay_thi WHERE id = ?', cy).trang_thai === 'xong', 'quét ngày không đóng việc hết');
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
    assert((await goi(ckG, 'PATCH', `/students/${sid}`, { dob: '2011-02-04' })).status === 403, 'đã đủ mà vẫn sửa được ngày sinh');
    /* Rà PTA #2280: em khác (cùng lớp, cũng thiếu) → 403; em lớp thường thiếu Target: không mở Target (Target chỉ thiếu ở FT — cùng hàm thieuHoSoEm). */
    const { sid: sidKhac } = emFt(lop, { dob: null });
    assert((await goi(ckG, 'PATCH', `/students/${sidKhac}`, { dob: '2011-02-03' })).status === 403, 'được giao em A sửa được em B');
    const thuong = lopMoi('FOU', false);
    const { sid: sidT, cy: cyT } = emFt(thuong, { dob: null });
    conn.prepare('UPDATE learning_cycles SET target_score = NULL, route = NULL WHERE id = ?').run(cyT);
    xoaNho();
    assert((await goi(ckT, 'POST', `/giao-viec/bo_sung_ho_so/${sidT}/phu-trach`, { userId: G, phuTrachCu: null })).status === 200, 'giao em lớp thường');
    assert((await goi(ckG, 'PATCH', `/cycles/${cyT}`, { targetScore: 6, lyDo: 'bổ sung' })).status === 403, 'em lớp thường: người được giao đặt được Target');
    const bpxl = nguoiVai('scheduler', 5).find((u) => !all(`SELECT 1 FROM user_roles ur JOIN roles r ON r.id = ur.role_id WHERE ur.user_id = ? AND ur.status = 'active' AND r.key != 'scheduler'`, u).length);
    if (bpxl) {
      const r = await goi(ckT, 'POST', `/giao-viec/bo_sung_ho_so/${sidKhac}/phu-trach`, { userId: bpxl, phuTrachCu: null });
      assert(r.status === 400 && /BPXL/.test(r.json?.error ?? ''), `giao việc TVV cho BPXL: ${r.status} ${r.json?.error}`);
      assert(!tn.timNguoi(P.admin, { moiVai: true, chiNhanh: MB, quyen: 'khong_bpxl' }).some((x: any) => x.id === bpxl), 'ô chọn người còn BPXL');
    } else console.log('    (bỏ qua phần BPXL: seed không có tài khoản chỉ vai BPXL ở MB)');
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
    const pC = loadPrincipal(GVCN), pG = loadPrincipal(G);
    assert(coViec(pC, `ban_giao:${nguon}`)?.mine, 'tiền đề: GVCN có việc Bàn giao');
    const [ckC, ckL, ckG, ckH] = [await vao(GVCN), await vao(GVL), await vao(G), await vao(H)];
    assert((await goi(ckG, 'POST', `/lenh-chuyen/${lenhId}/xac-nhan`, { nhanXetChung: 'Em học chăm, cần luyện thêm nghe.' })).status === 403, 'GV ngoài xác nhận được');
    assert((await goi(ckC, 'POST', `/giao-viec/ban_giao/${nguon}/phu-trach`, { userId: G, phuTrachCu: null })).status === 200, 'GVCN giao việc Bàn giao');
    assert(!coViec(pC, `ban_giao:${nguon}`) && coViec(pG, `ban_giao:${nguon}`)?.mine, 'việc chưa rời GVCN / chưa vào người được giao');
    assert((await goi(ckH, 'POST', `/lenh-chuyen/${lenhId}/xac-nhan`, { nhanXetChung: 'Em học chăm, cần luyện thêm nghe.' })).status === 403, 'người ngoài (GVCN lớp đích) xác nhận được');
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
    xoaNho();
    const hai = dem();
    const td = gv.viecTheoDoi(pX);
    assert(td.nhom.find((n: any) => n.loai === 'chot_ngay_thi')?.mo.length === 10 && td.nhom.find((n: any) => n.loai === 'bo_sung_ho_so')?.mo.length === 10, JSON.stringify(td).slice(0, 300));
    assert(hai - mot <= 4, `Đang theo dõi: 1 dòng ${mot} câu → 20 dòng ${hai} câu (thêm câu theo dòng)`);
    assert(hai <= 30, `Đang theo dõi 20 dòng khung ${hai} câu > 30`);
    const q = chayTrongRequest('GET', () => { const a = soCauSql(); gv.dongKhungHetViec(); return soCauSql() - a; });
    assert(q <= 30, `quét ngày 20 dòng khung ${q} câu > 30`);   // theo loại: câu đọc bảng phụ + mỗi loại vài câu (không theo dòng)
    console.log(`      (đo: Đang theo dõi 1 dòng ${mot} câu · 20 dòng ${hai} câu · quét ngày ${q} câu)`);
  }));

  check('LPB1-9 · Tốc độ: /my-work của GV không có việc giao → +1 câu (đọc khung việc đã giao, một lần mỗi request)', () => {
    const p = P.subjectTeacher;
    const n = chayTrongRequest('GET', () => { const a = soCauSql(); myWork(p, {}); return soCauSql() - a; });
    const giao = chayTrongRequest('GET', () => { const a = soCauSql(); kv.giaoKhung(); kv.giaoKhung(); return soCauSql() - a; });
    assert(giao === 1, `đọc khung việc đã giao ${giao} câu (nhớ theo request)`);
    assert(n > 0, `số câu /my-work ${n}`);
  });
}
