/**
 * PHÉP KIỂM TU-a — Tutor: nền dữ liệu + nhập liệu (đặc tả docs/superpowers/specs/2026-10-19-tutor-head-tutor-design.md mục 3–6, 9, 11).
 *   T1 migrate prTu (2 bảng, 9 cột buổi, vai head_tutor) chạy lặp được trên DB cũ, khớp schema.sql; quyền theo vai.
 *   T2 luật chung buổi tutor (`kiemBuoiTutor`, `hinhThucTuSuy`, `knTutorCuaTopic`).
 * Mỗi ca ghi dữ liệu cuộn lại (`thu`).
 */
import Database from 'libsql';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

export async function runPrTuTests(t: any) {
  const { check, assert, conn, P } = t;
  const d: any = await import('../../../shared/domain/index.ts');
  const mTu: any = await import('../migrate/prTu.ts');
  const mTub: any = await import('../migrate/prTub.ts');
  console.log('\nTU-a · Tutor: migrate · vai Head tutor · luật buổi tutor');

  const all = (sql: string, ...a: unknown[]) => conn.prepare(sql).all(...a) as any[];
  const quyenCua = (vai: string) => all(`SELECT p.key FROM role_permissions rp JOIN roles r ON r.id = rp.role_id JOIN permissions p ON p.id = rp.permission_id
    WHERE r.key = ? AND p.key LIKE 'tutor.%' ORDER BY p.key`, vai).map((x) => x.key).join(',');

  // ------------------------------------------------------------------ T1 · migrate + vai
  check('TU-1a · migrate prTu trên DB cũ (bảng buổi OV-12h, chưa có tutors): thêm 2 bảng + 9 cột + chỉ mục + vai head_tutor; lần hai không làm gì; khớp schema.sql', () => {
    const tam = new Database(':memory:');
    tam.exec(`CREATE TABLE branches (id INTEGER PRIMARY KEY); CREATE TABLE users (id INTEGER PRIMARY KEY); CREATE TABLE classes (id INTEGER PRIMARY KEY);
      CREATE TABLE case_followups (id INTEGER PRIMARY KEY);
      CREATE TABLE case_followup_buoi (id INTEGER PRIMARY KEY, followup_id INTEGER NOT NULL REFERENCES case_followups(id) ON DELETE CASCADE,
        buoi_so INTEGER NOT NULL, tutor_ten TEXT NOT NULL, nhan_xet TEXT NOT NULL, UNIQUE (followup_id, buoi_so));
      CREATE TABLE roles (id INTEGER PRIMARY KEY, key TEXT UNIQUE, name_vi TEXT, status TEXT);
      CREATE TABLE permissions (id INTEGER PRIMARY KEY, key TEXT UNIQUE, name_vi TEXT);
      CREATE TABLE role_permissions (role_id INTEGER, permission_id INTEGER);
      INSERT INTO permissions (key, name_vi) VALUES ('tutor.view', 'x'), ('tutor.manage', 'y');
      INSERT INTO case_followups (id) VALUES (1); INSERT INTO case_followup_buoi (followup_id, buoi_so, tutor_ten, nhan_xet) VALUES (1, 1, 'Ms Mai', 'Nghe số');`);
    const ap: string[] = [];
    mTu.migratePrTu(tam, ap);
    mTub.migratePrTub(tam, ap);   // TU-b: chỉ mục một phần nhóm chú ý (sau TU-a, như migrate.ts)
    mTu.migratePrTu(tam, ap);
    mTub.migratePrTub(tam, ap);
    assert(ap.length === 2, JSON.stringify(ap));
    const cot = (c: any, ten: string) => c.prepare('SELECT name, type, "notnull" AS nn, dflt_value AS dv FROM pragma_table_info(?)').all(ten)
      .map((x: any) => `${x.name}:${x.type}:${x.nn}:${x.dv}`).join(',');
    for (const b of ['tutors', 'tutor_nhan_xet', 'case_followup_buoi']) assert(cot(tam, b) === cot(conn, b), `${b}: ${cot(tam, b)} ≠ ${cot(conn, b)}`);
    const fk = (c: any, ten: string) => c.prepare('SELECT "table" AS t, "from" AS f FROM pragma_foreign_key_list(?) ORDER BY "from"').all(ten).map((x: any) => `${x.f}>${x.t}`).join(',');
    for (const b of ['tutors', 'tutor_nhan_xet', 'case_followup_buoi']) assert(fk(tam, b) === fk(conn, b), `FK ${b}: ${fk(tam, b)} ≠ ${fk(conn, b)}`);
    const cm = (c: any) => c.prepare(`SELECT name FROM sqlite_master WHERE type = 'index' AND name NOT LIKE 'sqlite_%' AND tbl_name IN ('tutors','tutor_nhan_xet','case_followup_buoi') ORDER BY name`)
      .all().map((x: any) => x.name).join(',');
    assert(cm(tam) === cm(conn) && cm(conn) === 'idx_followup_buoi_chu_y,idx_followup_buoi_tutor,idx_tutor_nhan_xet,idx_tutors_sdt', `${cm(tam)} | ${cm(conn)}`);
    const dong = tam.prepare('SELECT tutor_ten, chuan_bi, ghi_luc FROM case_followup_buoi').get() as any;
    assert(dong.tutor_ten === 'Ms Mai' && dong.chuan_bi === null && dong.ghi_luc === null, `dòng cũ giữ, cột mới NULL: ${JSON.stringify(dong)}`);
    const q = tam.prepare(`SELECT group_concat(p.key) k FROM role_permissions rp JOIN roles r ON r.id = rp.role_id JOIN permissions p ON p.id = rp.permission_id WHERE r.key = 'head_tutor'`).get() as any;
    assert(q.k?.split(',').sort().join(',') === 'tutor.manage,tutor.view', `quyền head_tutor: ${q.k}`);
    let loi = '';
    try { tam.prepare(`INSERT INTO case_followup_buoi (followup_id, buoi_so, tutor_ten, nhan_xet, danh_gia) VALUES (1, 2, 'a', 'b', 6)`).run(); } catch (e: any) { loi = String(e?.message); }
    assert(/CHECK/i.test(loi), `danh_gia 6 phải bị CHECK chặn: ${loi}`);
    tam.close();
  });

  check('TU-1b · quyền theo vai: head_tutor = tutor.view + tutor.manage; Quản trị cả hai; QL chỉ tutor.view; GV, CX, TVV, Admin không', () => {
    assert(quyenCua('head_tutor') === 'tutor.manage,tutor.view', quyenCua('head_tutor'));
    assert(quyenCua('system_admin') === 'tutor.manage,tutor.view', quyenCua('system_admin'));
    assert(quyenCua('manager') === 'tutor.view', quyenCua('manager'));
    for (const v of ['teacher', 'cx', 'consultant', 'office_admin']) assert(quyenCua(v) === '', `${v}: ${quyenCua(v)}`);
    const k = all(`SELECT p.key FROM role_permissions rp JOIN roles r ON r.id = rp.role_id JOIN permissions p ON p.id = rp.permission_id WHERE r.key = 'head_tutor'`);
    assert(k.length === 2, `head_tutor không có quyền nào khác: ${k.map((x) => x.key)}`);
    assert(d.ROLE_LABEL.head_tutor === 'Head tutor', d.ROLE_LABEL.head_tutor);
    assert(!(d.VAI_DANG_KY as string[]).includes('head_tutor'), 'không tự đăng ký');
  });

  // ------------------------------------------------------------------ T2 · luật chung buổi tutor
  const du = (x: Record<string, unknown> = {}) => ({ tutorId: 1, tutor: 'Nguyễn Thu Lan', nhanXet: 'Chữa Section 3', hinhThuc: 'offline', chuanBi: true, taiLieu: false, feedbackGv: true, ...x });
  check('TU-2a · kiemBuoiTutor: 3 ô bắt buộc Có / Không; đánh giá 1–5 hoặc trống; hình thức offline / online / trống; lần ghi cũ (cu3) không bắt 3 ô', () => {
    assert(d.kiemBuoiTutor(1, [du()]) === null, String(d.kiemBuoiTutor(1, [du()])));
    assert(d.kiemBuoiTutor(1, [du({ danhGia: null, nhanXetTutor: '', hinhThuc: null, tutorId: null })]) === null, 'tuỳ chọn trống được');
    for (const k of ['chuanBi', 'taiLieu', 'feedbackGv']) {
      assert(/Có hoặc Không/.test(d.kiemBuoiTutor(1, [du({ [k]: null })]) ?? ''), `thiếu ${k}: ${d.kiemBuoiTutor(1, [du({ [k]: null })])}`);
      assert(d.kiemBuoiTutor(1, [du({ [k]: 'co' })]) !== null, `${k} không phải boolean`);
    }
    assert(d.kiemBuoiTutor(2, [du(), du({ feedbackGv: undefined })])?.includes('2'), 'nói đúng buổi 2');
    for (const v of [0, 6, 2.5, '3']) assert(d.kiemBuoiTutor(1, [du({ danhGia: v })]) !== null, `danhGia ${v}`);
    assert(d.kiemBuoiTutor(1, [du({ danhGia: 5 })]) === null, 'danhGia 5');
    assert(d.kiemBuoiTutor(1, [du({ hinhThuc: 'x' })]) !== null, 'hình thức lạ');
    assert(d.kiemBuoiTutor(1, [du({ tutorId: -1 })]) !== null && d.kiemBuoiTutor(1, [du({ tutorId: 1.5 })]) !== null, 'tutorId không nguyên dương');
    assert(d.kiemBuoiTutor(1, [du({ nhanXetTutor: 'a'.repeat(1001) })]) !== null, 'nhận xét về tutor ≤ 1000');
    assert(d.kiemBuoiTutor(1, [{ tutor: 'Ms Mai', nhanXet: 'Nghe số' }], true) === null, 'lần ghi cũ: không bắt 3 ô');
    assert(d.kiemBuoiTutor(1, [{ tutor: 'Ms Mai', nhanXet: 'Nghe số' }]) !== null, 'lần ghi mới: bắt 3 ô');
    assert(d.kiemBuoiTutor(1, [du({ chuanBi: 'x' })], true) !== null, 'cũ mà gửi giá trị lạ vẫn lỗi');
    assert(d.kiemBuoiTutor(1, [du({ tutor: '' })]) !== null && d.kiemBuoiTutor(1, [du({ nhanXet: ' ' })]) !== null, 'tên + nhận xét buổi vẫn bắt buộc');
  });

  check('TU-2b · hinhThucTuSuy: cùng chi nhánh → Offline; khác / Chỉ online → Online; chưa có nơi dạy / Tutor khác → trống. knTutorCuaTopic: Writing khớp W1 hoặc W2', () => {
    assert(d.hinhThucTuSuy({ noiDayBranchId: 1, chiOnline: 0 }, 1) === 'offline');
    assert(d.hinhThucTuSuy({ noiDayBranchId: 2, chiOnline: 0 }, 1) === 'online');
    assert(d.hinhThucTuSuy({ noiDayBranchId: null, chiOnline: 1 }, 1) === 'online');
    assert(d.hinhThucTuSuy({ noiDayBranchId: null, chiOnline: 0 }, 1) === null);
    assert(d.hinhThucTuSuy(null, 1) === null);
    assert(d.knTutorCuaTopic('writing').join() === 'W1,W2' && d.knTutorCuaTopic('writing2').join() === 'W1,W2', d.knTutorCuaTopic('writing').join());
    assert(d.knTutorCuaTopic('listening').join() === 'L' && d.knTutorCuaTopic('pronunciation').join() === 'S' && d.knTutorCuaTopic('tong_hop').length === 0);
    assert(d.KN_TUTOR.join() === 'L,R,W1,W2,S');
  });

  // ------------------------------------------------------------------ T3 · máy chủ ghi / sửa / hoàn tác buổi tutor
  const cases: any = await import('../cases/cases.ts');
  const chonSvc: any = await import('../tutors/chon.ts');
  const { xoaNho } = await import('../platform/nguCanhRequest.ts');
  const { createApp } = await import('../app.ts');
  const { createSession } = await import('../auth.ts');
  const get = (sql: string, ...a: unknown[]) => conn.prepare(sql).get(...a) as any;
  const maLoi = (fn: () => unknown): number | string => { try { fn(); return 'không ném'; } catch (e: any) { return e?.status ?? String(e?.message ?? e); } };
  const thu = <T>(fn: () => T): T => { conn.exec('BEGIN IMMEDIATE'); try { xoaNho(); return fn(); } finally { conn.exec('ROLLBACK'); xoaNho(); } };
  const GV = P.lrTeacher;
  const LOP = t.classId('MB FT 101');
  const MB = get(`SELECT id FROM branches WHERE code = 'MB'`).id as number;
  const tutorId = (ten: string) => get('SELECT id FROM tutors WHERE ten = ?', ten).id as number;
  let seq = 0;
  const em = (): number => {
    seq += 1;
    const now = new Date().toISOString();
    const sid = Number(conn.prepare(`INSERT INTO students (student_code, full_name, normalized_name, branch_id, status, created_at)
      VALUES (?,?,?, (SELECT branch_id FROM classes WHERE id = ?), 'active', ?)`).run(`PISA-TU-${seq}`, `Hoc vien TU ${seq}`, `hoc vien tu ${seq}`, LOP, now).lastInsertRowid);
    conn.prepare(`INSERT INTO enrollments (student_id, class_id, status, started_at, created_at) VALUES (?,?, 'active', '2026-07-27', ?)`).run(sid, LOP, now);
    conn.prepare(`INSERT INTO learning_cycles (student_id, seq, route, started_at, status, created_at) VALUES (?, 1, 'LT1', '2026-07-27', 'active', ?)`).run(sid, now);
    return sid;
  };
  const paTutor = (sid = em(), topic = 'listening', performerName = 'Nguyễn Thu Lan') => {
    const caseId = cases.reportIssue(GV, {
      studentId: sid, topic, title: 'Nghe sót số liệu', summary: 'Section 1–2 sai 6/20 câu điền số, nhầm 15 và 50.',
      primaryCode: d.issuesForTopic(topic)[0].code, idempotencyKey: `tu-case-${sid}-${topic}`,
    }).id as number;
    const r = cases.recordIntervention(GV, caseId, { kind: 'tutor', description: 'Tutor Listening 1-1', soBuoi: 6, performerName, status: 'started', startedDate: t.addDays(t.TODAY, -7) });
    return { caseId, ivId: Math.max(...r.interventions.map((i: any) => i.id)) as number };
  };
  const kq = (x: Record<string, unknown> = {}) => ({ decision: 'keep', outcome: 'partial', note: 'Hai buổi tutor, đúng thêm 3 câu', observedOn: t.TODAY, soBuoi: 2, ...x });
  const hai = (b2: Record<string, unknown> = {}) => [
    { tutorId: tutorId('Nguyễn Thu Lan'), tutor: 'Nguyễn Thu Lan', nhanXet: 'Chữa Section 3 điền bảng', hinhThuc: 'offline', chuanBi: true, taiLieu: true, feedbackGv: true },
    { tutor: 'Ms Mai', nhanXet: 'Luyện Reading TFNG online', hinhThuc: 'online', chuanBi: true, taiLieu: false, feedbackGv: true, danhGia: 2, nhanXetTutor: 'Vào muộn 10 phút', ...b2 },
  ];
  const dong = (followupId: number) => conn.prepare('SELECT * FROM case_followup_buoi WHERE followup_id = ? ORDER BY buoi_so').all(followupId) as any[];
  const lanCuoi = (ivId: number) => get('SELECT id FROM case_followups WHERE intervention_id = ? ORDER BY id DESC LIMIT 1', ivId).id as number;

  check('TU-3a · Ghi kết quả PA Tutor 2 buổi: thiếu một ô → 400, không ghi; đủ (đánh giá trống được) → lưu đủ cột, lop_id = lớp em, ghi_luc; lịch sử + form Sửa trả đủ trường', () => thu(() => {
    const { caseId, ivId } = paTutor();
    for (const k of ['chuanBi', 'taiLieu', 'feedbackGv']) assert(maLoi(() => cases.updateResult(GV, ivId, kq({ buoi: hai({ [k]: null }) }))) === 400, `thiếu ${k} phải 400`);
    assert(maLoi(() => cases.updateResult(GV, ivId, kq({ buoi: hai({ tutorId: 999999 }) }))) === 400, 'tutor không có trong danh sách phải 400');
    assert(maLoi(() => cases.updateResult(GV, ivId, kq({ buoi: hai({ danhGia: 7 }) }))) === 400, 'đánh giá 7 phải 400');
    assert(maLoi(() => cases.updateResult(GV, ivId, kq({ buoi: hai({ tutor: 'M' }) }))) === 400, '"Tutor khác" 1 ký tự phải 400');
    assert(get('SELECT COUNT(*) n FROM case_followups WHERE intervention_id = ?', ivId).n === 0, 'lỗi mà vẫn ghi');
    const vao = hai({ danhGia: null, nhanXetTutor: '' });
    vao[0].tutor = 'Chữ web gửi sai';   // tutor danh sách: tên lưu lấy từ danh sách (bản chụp)
    cases.updateResult(GV, ivId, kq({ buoi: vao }));
    const r = dong(lanCuoi(ivId));
    assert(r[0].tutor_ten === 'Nguyễn Thu Lan', `tên chụp từ danh sách: ${r[0].tutor_ten}`);
    assert(r.length === 2 && r[0].tutor_id === tutorId('Nguyễn Thu Lan') && r[0].hinh_thuc === 'offline' && r[0].chuan_bi === 1, `buổi 1: ${JSON.stringify(r[0])}`);
    assert(r[1].tutor_id === null && r[1].tutor_ten === 'Ms Mai' && r[1].tai_lieu === 0 && r[1].danh_gia === null && r[1].nhan_xet_tutor === null, `buổi 2: ${JSON.stringify(r[1])}`);
    assert(r.every((x) => x.lop_id === LOP && typeof x.ghi_luc === 'string'), `lop_id / ghi_luc: ${JSON.stringify(r.map((x) => [x.lop_id, x.ghi_luc]))}`);
    const ls = cases.caseDetail(GV, caseId).followups.find((x: any) => x.interventionId === ivId);
    assert(ls.buoi[1].taiLieu === false && ls.buoi[1].hinhThuc === 'online' && ls.buoi[0].tutorId === tutorId('Nguyễn Thu Lan') && ls.buoi[0].chuanBi === true, `lịch sử: ${JSON.stringify(ls.buoi)}`);
    const sua = cases.moSuaKetQua(GV, lanCuoi(ivId));
    assert(sua.giaTri.buoi[1].taiLieu === false && sua.giaTri.buoi[0].hinhThuc === 'offline', `form Sửa: ${JSON.stringify(sua.giaTri.buoi)}`);
  }));

  check('TU-3b · Sửa: không đổi 3 ô + đánh giá → giữ ghi_luc; đổi một ô → ghi_luc mới, lop_id giữ; đổi lựa chọn (đường đảo) giữ đủ trường; Hoàn tác bỏ dòng buổi', () => thu(() => {
    const { ivId } = paTutor();
    cases.updateResult(GV, ivId, kq({ buoi: hai() }));
    const f = lanCuoi(ivId);
    conn.prepare(`UPDATE case_followup_buoi SET ghi_luc = '2026-01-01T00:00:00.000Z', lop_id = ? WHERE followup_id = ?`).run(get('SELECT id FROM classes WHERE id != ? ORDER BY id LIMIT 1', LOP).id, f);   // lớp chụp lúc ghi khác lớp hiện tại
    const lopCu = dong(f)[0].lop_id;
    cases.suaKetQua(GV, f, kq({ buoi: hai({ nhanXet: 'Sửa chữ nhận xét buổi 2, em đúng 9/13' }) }));
    let r = dong(f);
    assert(r[1].nhan_xet === 'Sửa chữ nhận xét buổi 2, em đúng 9/13' && r.every((x) => x.ghi_luc === '2026-01-01T00:00:00.000Z'), `giữ ghi_luc: ${JSON.stringify(r.map((x) => x.ghi_luc))}`);
    cases.suaKetQua(GV, f, kq({ buoi: hai({ feedbackGv: false }) }));
    r = dong(f);
    assert(r[0].ghi_luc === '2026-01-01T00:00:00.000Z' && r[1].ghi_luc !== '2026-01-01T00:00:00.000Z' && r[1].feedback_gv === 0, `đổi ô buổi 2: ${JSON.stringify(r.map((x) => x.ghi_luc))}`);
    assert(r.every((x) => x.lop_id === lopCu), 'lop_id giữ khi sửa');
    /* Đổi lựa chọn (Tiến triển) → đường đảo + ghi lại: dòng mới mang đủ trường, ghi_luc / lop_id giữ theo buổi. */
    cases.suaKetQua(GV, f, kq({ outcome: 'improved', buoi: hai({ feedbackGv: false }) }));
    const f2 = lanCuoi(ivId);
    r = dong(f2);
    assert(r.length === 2 && r[0].tutor_id === tutorId('Nguyễn Thu Lan') && r[1].danh_gia === 2 && r[1].nhan_xet_tutor === 'Vào muộn 10 phút', `đảo giữ trường: ${JSON.stringify(r)}`);
    assert(r[0].ghi_luc === '2026-01-01T00:00:00.000Z' && r.every((x) => x.lop_id === lopCu), `đảo giữ ghi_luc / lop_id: ${JSON.stringify(r.map((x) => [x.ghi_luc, x.lop_id]))}`);
    cases.hoanTacKetQua(GV, f2);
    assert(get('SELECT COUNT(*) n FROM case_followup_buoi WHERE followup_id = ?', f2).n === 0, 'Hoàn tác còn dòng buổi');
  }));

  check('TU-3c · Lần ghi cũ (dòng buổi từ trước TU-a, 3 ô trống): Sửa không gửi 3 ô → lưu được; lần ghi mới vẫn bắt', () => thu(() => {
    const { ivId } = paTutor();
    cases.updateResult(GV, ivId, kq({ buoi: hai() }));
    const f = lanCuoi(ivId);
    conn.prepare('UPDATE case_followup_buoi SET tutor_id = NULL, hinh_thuc = NULL, chuan_bi = NULL, tai_lieu = NULL, feedback_gv = NULL, danh_gia = NULL, ghi_luc = NULL WHERE followup_id = ?').run(f);
    cases.suaKetQua(GV, f, kq({ buoi: [{ tutor: 'Ms Lan', nhanXet: 'Sửa lần ghi cũ, buổi 1' }, { tutor: 'Ms Mai', nhanXet: 'Sửa lần ghi cũ, buổi 2' }] }));
    const r = dong(f);
    assert(r[0].nhan_xet === 'Sửa lần ghi cũ, buổi 1' && r.every((x) => x.chuan_bi === null && x.ghi_luc === null), `lần ghi cũ: ${JSON.stringify(r)}`);
  }));

  check('TU-3d · QL chi nhánh khác không đọc được Case (và buổi) của em MB qua API', () => thu(() => {
    const { caseId } = paTutor();
    assert(maLoi(() => cases.caseDetail(P.cpManager, caseId)) === 403, 'QL Cẩm Phả đọc Case MB');
  }));

  const httpApp = createApp().listen(0);
  const port = (httpApp.address() as any).port as number;
  const goi = (userId: number, url: string, body?: unknown) => fetch(`http://127.0.0.1:${port}/api${url}`, {
    method: body === undefined ? 'GET' : 'POST', headers: { 'content-type': 'application/json', cookie: `pisa_demo_session=${createSession(userId)}` },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  try {
    const { ivId } = paTutor();
    await t.checkAsync('TU-3e · HTTP: POST /interventions/:id/result thiếu 3 ô → 400 kèm câu "Có hoặc Không"', async () => {
      const res = await goi(GV.userId, `/interventions/${ivId}/result`, kq({ buoi: hai({ taiLieu: undefined }) }));
      const x: any = await res.json().catch(() => ({}));
      assert(res.status === 400 && /Có hoặc Không/.test(JSON.stringify(x)), `${res.status} ${JSON.stringify(x)}`);
    });

    // ---------------------------------------------------------------- T4 · GET /tutors/chon
    await t.checkAsync('TU-4a · GV ghi được PA gọi /tutors/chon?paId: 200, chỉ 3 số cuối SĐT (không có trường sdt), bỏ tutor "Ngừng hợp tác", ≤ 20 dòng, gợi ý MB + Listening đứng đầu', async () => {
      const res = await goi(GV.userId, `/tutors/chon?paId=${ivId}`);
      const x: any = await res.json();
      assert(res.status === 200, `${res.status} ${JSON.stringify(x)}`);
      assert(!JSON.stringify(x).includes('"sdt"') && x.ds.every((r: any) => r.sdtDuoi === null || /^\d{3}$/.test(r.sdtDuoi)), `SĐT lộ: ${JSON.stringify(x.ds)}`);
      assert(!x.ds.some((r: any) => r.ten === 'Đặng Thu Hà') && x.ds.length <= 20, `Ngừng hợp tác vẫn có / quá 20: ${x.ds.map((r: any) => r.ten)}`);
      const goiY = x.ds.filter((r: any) => r.goiY).map((r: any) => r.ten).sort().join();
      assert(goiY === 'Nguyễn Thu Lan,Phạm Đức Long' && x.ds[0].goiY && x.ds[0].hinhThuc === 'offline', `gợi ý: ${goiY} · đầu ${JSON.stringify(x.ds[0])}`);
      const hinh = Object.fromEntries(x.ds.map((r: any) => [r.ten, r.hinhThuc]));
      assert(hinh['Lê Lan Hương'] === 'online' && hinh['Hồ Ngọc Lan'] === 'online' && hinh['Bùi Quang Minh'] === null, `hình thức: ${JSON.stringify(hinh)}`);
      assert(x.dienSan?.tutorId === tutorId('Nguyễn Thu Lan') && x.dienSan.hinhThuc === 'offline', `điền sẵn theo Người dạy của PA: ${JSON.stringify(x.dienSan)}`);
      const tim: any = await (await goi(GV.userId, `/tutors/chon?paId=${ivId}&q=lan`)).json();
      assert(tim.ds.map((r: any) => r.ten).sort().join() === 'Hồ Ngọc Lan,Lê Lan Hương,Nguyễn Thu Lan', `tìm "lan": ${tim.ds.map((r: any) => r.ten)}`);
      const theoSo: any = await (await goi(GV.userId, `/tutors/chon?paId=${ivId}&q=442`)).json();
      assert(theoSo.ds.length === 1 && theoSo.ds[0].ten === 'Hồ Ngọc Lan', `tìm theo số cuối: ${theoSo.ds.map((r: any) => r.ten)}`);
      /* Rà #475: GV không dò được đủ SĐT — 6 số giữa / 4 số đầu không ra ai; Quản trị (`tutor.manage`) tìm được cả SĐT. */
      for (const q of ['234590', '0912', '45908']) {
        const x: any = await (await goi(GV.userId, `/tutors/chon?paId=${ivId}&q=${q}`)).json();
        assert(x.ds.length === 0, `GV gõ "${q}" ra: ${x.ds.map((r: any) => r.ten)}`);
      }
      const qt: any = await (await goi(P.admin.userId, `/tutors/chon?paId=${ivId}&q=234590`)).json();
      assert(qt.ds.length === 1 && qt.ds[0].ten === 'Nguyễn Thu Lan', `QT tìm đủ SĐT: ${qt.ds.map((r: any) => r.ten)}`);
    });

    await t.checkAsync('TU-4b · Head tutor, CX, QL chi nhánh khác → 403; ô Người dạy theo studentId: QL / GV 200, nhóm gợi ý = tutor MB', async () => {
      const ht = get(`SELECT ur.user_id id FROM user_roles ur JOIN roles r ON r.id = ur.role_id WHERE r.key = 'head_tutor' LIMIT 1`).id;
      const cx = get(`SELECT ur.user_id id FROM user_roles ur JOIN roles r ON r.id = ur.role_id WHERE r.key = 'cx' LIMIT 1`).id;
      for (const [ai, id] of [['Head tutor', ht], ['CX', cx], ['QL Cẩm Phả', P.cpManager.userId]] as const) {
        const s = (await goi(id, `/tutors/chon?paId=${ivId}`)).status;
        assert(s === 403, `${ai}: ${s}`);
      }
      const sid = get('SELECT student_id FROM case_interventions iv JOIN sos_cases sc ON sc.id = iv.case_id WHERE iv.id = ?', ivId).student_id;
      assert((await goi(ht, `/tutors/chon?studentId=${sid}`)).status === 403, 'Head tutor theo studentId');
      const ql = await goi(P.mbManager.userId, `/tutors/chon?studentId=${sid}`);
      const x: any = await ql.json();
      assert(ql.status === 200 && x.dienSan === null && x.ds.filter((r: any) => r.goiY).map((r: any) => r.ten).sort().join() === 'Nguyễn Thu Lan,Phạm Đức Long,Vũ Thanh Hằng', `QL: ${ql.status} ${JSON.stringify(x.ds.map((r: any) => [r.ten, r.goiY]))}`);
      assert((await goi(GV.userId, '/tutors/chon')).status === 403, 'thiếu paId / studentId');
    });
  } finally { httpApp.close(); }

  // ------------------------------------------------------------------ T5 · thanh trên, vai trên Tài khoản
  const { navOf } = await import('../platform/nav.ts');
  const { loadPrincipal } = await import('../permissions.ts');
  const dh: any = await import('../../../shared/domain/dieuHuong.ts');
  const accounts: any = await import('../platform/accounts.ts');
  check('AN-TUTOR · menu mọi vai không có Tutor; Head tutor trang đầu = Tổng quan; quyền tutor.view giữ', () => {
    const ht = loadPrincipal(get(`SELECT ur.user_id id FROM user_roles ur JOIN roles r ON r.id = ur.role_id WHERE r.key = 'head_tutor' LIMIT 1`).id);
    const nav = navOf(ht);
    const khu = dh.khuVucHienThi(nav).map((k: any) => k.key).join();
    assert(khu === 'tong-quan' && nav.overview && nav.tutor, `Head tutor: ${khu} · ${JSON.stringify({ o: nav.overview, t: nav.tutor })}`);
    for (const p of [ht, P.mbManager, P.admin, GV]) assert(!dh.khuVucHienThi(navOf(p)).some((k: any) => k.key === 'tutor'), 'menu có Tutor');
    assert(navOf(P.mbManager).tutor && navOf(P.admin).tutor && !navOf(GV).tutor, 'cờ quyền tutor giữ nguyên');
    const app = readFileSync(join(process.cwd(), 'web/src/App.tsx'), 'utf8');
    assert(/path="\/tutor\/\*" element=\{<Navigate to="\/" replace \/>\}/.test(app) && !/TutorPage/.test(app), '/tutor/* phải chuyển hướng về trang đầu');
  });
  check('TU-5b · Quản trị cấp vai Head tutor không chọn chi nhánh → một grant toàn hệ thống (branch_id NULL)', () => thu(() => {
    const r = accounts.createAccount(P.admin, { fullName: 'Thử Head Tutor', email: 'thu.headtutor.tu.pisa@gmail.com', password: 'Matkhau123!', roles: [{ role: 'head_tutor', branches: [] }] });
    const id = r?.id ?? get(`SELECT id FROM users WHERE email = 'thu.headtutor.tu.pisa@gmail.com'`).id;
    const g = conn.prepare(`SELECT ur.branch_id FROM user_roles ur JOIN roles r ON r.id = ur.role_id WHERE ur.user_id = ? AND r.key = 'head_tutor'`).all(id) as any[];
    assert(g.length === 1 && g[0].branch_id === null, JSON.stringify(g));
  }));

  check('TU-4c · điền sẵn buổi 1: Người dạy không khớp tutor nào → tutor buổi cuối của lần ghi trước (tên gõ tay giữ tên, không id)', () => thu(() => {
    const { ivId: iv2 } = paTutor(em(), 'listening', 'Một người ngoài');
    assert(chonSvc.chonTutor(GV, { paId: iv2 }).dienSan === null, 'chưa có lần ghi: không điền');
    cases.updateResult(GV, iv2, kq({ buoi: hai() }));
    const ds = chonSvc.chonTutor(GV, { paId: iv2 }).dienSan;
    assert(ds?.tutorId === null && ds.ten === 'Ms Mai', `buổi cuối lần trước: ${JSON.stringify(ds)}`);
  }));
}
