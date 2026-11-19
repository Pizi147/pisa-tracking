/**
 * PHÉP KIỂM TU2-1 LUAT-KQ-TUTOR (chủ SP 19/11 — `docs/superpowers/specs/2026-11-19-tutor/06-ke-hoach-pr.md` mục 2, 3; luật TU1–TU19 ở `02-luat.md`).
 *   (1)–(5) ghi Kết quả PA Tutor "a / b", dòng gộp, 3 nút tuỳ chọn, thân web cũ · (6) GV làm tutor · (7) nháp giữ phần Tutor · (8) Xác nhận PA không Số buổi
 *   (9) sửa lần ghi cũ · (10) ô chọn có GV · (11) migrate + CX `tutor.view` · (12) Tổng số buổi chỉ PA không quy chế · (Q) vai không được làm → 403.
 * Mỗi ca ghi dữ liệu cuộn lại (`thu`).
 */
import Database from 'libsql';

export async function runPrTutor2Tests(t: any) {
  const { check, checkAsync, assert, conn, P, TODAY } = t;
  const d: any = await import('../../../shared/domain/index.ts');
  const cases: any = await import('../cases/cases.ts');
  const sosAuto: any = await import('../cases/sosAuto.ts');
  const chonSvc: any = await import('../tutors/chon.ts');
  const mig: any = await import('../migrate/prTutor2.ts');
  const { xoaNho, soCauSql } = await import('../platform/nguCanhRequest.ts');
  const { createApp } = await import('../app.ts');
  const { createSession } = await import('../auth.ts');
  const { TRAN_GHI_LO } = await import('./tocDoDuong.ts');
  console.log('\nTU2-1 · Kết quả PA Tutor a / b · dòng gộp · GV làm tutor · nháp · Xác nhận PA không Số buổi');

  const get = (sql: string, ...a: unknown[]) => conn.prepare(sql).get(...a) as any;
  const all = (sql: string, ...a: unknown[]) => conn.prepare(sql).all(...a) as any[];
  const loiCua = (fn: () => unknown): any => { try { fn(); return null; } catch (e) { return e; } };
  const ma = (fn: () => unknown) => loiCua(fn)?.status ?? 200;
  const thu = <T>(fn: () => T): T => { conn.exec('BEGIN IMMEDIATE'); try { xoaNho(); return fn(); } finally { conn.exec('ROLLBACK'); xoaNho(); } };
  const GV = P.lrTeacher;
  const LOP = t.classId('MB FT 101');
  const tutorId = (ten: string) => get('SELECT id FROM tutors WHERE ten = ?', ten).id as number;
  let seq = 0;
  const em = (): number => {
    seq += 1;
    const now = new Date().toISOString();
    const sid = Number(conn.prepare(`INSERT INTO students (student_code, full_name, normalized_name, branch_id, status, created_at)
      VALUES (?,?,?, (SELECT branch_id FROM classes WHERE id = ?), 'active', ?)`).run(`PISA-TU2-${seq}`, `Hoc vien TU2 ${seq}`, `hoc vien tu2 ${seq}`, LOP, now).lastInsertRowid);
    conn.prepare(`INSERT INTO enrollments (student_id, class_id, status, started_at, created_at) VALUES (?,?, 'active', '2026-07-27', ?)`).run(sid, LOP, now);
    conn.prepare(`INSERT INTO learning_cycles (student_id, seq, route, started_at, status, created_at) VALUES (?, 1, 'LT1', '2026-07-27', 'active', ?)`).run(sid, now);
    return sid;
  };
  const paTutor = (soBuoi: number | null = null) => {
    const sid = em();
    const caseId = cases.reportIssue(GV, {
      studentId: sid, topic: 'listening', title: 'Nghe sót số liệu', summary: 'Section 1–2 sai 6/20 câu điền số, nhầm 15 và 50.',
      primaryCode: d.issuesForTopic('listening')[0].code, idempotencyKey: `tu2-case-${sid}`,
    }).id as number;
    const r = cases.recordIntervention(GV, caseId, { kind: 'tutor', description: 'Tutor Listening 1-1', soBuoi, status: 'started', startedDate: t.addDays(TODAY, -7) });
    return { caseId, ivId: Math.max(...r.interventions.map((i: any) => i.id)) as number };
  };
  const kq = (x: Record<string, unknown> = {}) => ({ decision: 'keep', outcome: 'partial', note: 'Hai buổi tutor, đúng thêm 3 câu', observedOn: TODAY, ...x });
  const dong = (followupId: number) => all('SELECT * FROM case_followup_buoi WHERE followup_id = ? ORDER BY buoi_so', followupId);
  const lanCuoi = (ivId: number) => get('SELECT * FROM case_followups WHERE intervention_id = ? ORDER BY id DESC LIMIT 1', ivId);
  const gop = (x: Record<string, unknown> = {}) => ({ tutorId: tutorId('Nguyễn Thu Lan'), tutor: 'Nguyễn Thu Lan', nhanXet: 'Chữa Section 3 điền bảng, đúng 9/13', soBuoi: 2, ...x });

  check('TU2-1 (1) · a = 2, một dòng gộp soBuoi 2, 3 nút trống → lưu; đọc lại a / b, số buổi dòng, 3 ô NULL', () => thu(() => {
    const { caseId, ivId } = paTutor();
    cases.updateResult(GV, ivId, kq({ soBuoi: 2, buoiDuKien: 2, buoi: [gop()] }));
    const f = lanCuoi(ivId);
    const r = dong(f.id);
    assert(f.so_buoi === 2 && f.buoi_du_kien === 2, `a / b: ${f.so_buoi} / ${f.buoi_du_kien}`);
    assert(r.length === 1 && r[0].so_buoi === 2 && r[0].chuan_bi === null && r[0].tai_lieu === null && r[0].feedback_gv === null && r[0].ghi_luc === null, JSON.stringify(r));
    const ls = cases.caseDetail(GV, caseId).followups.find((x: any) => x.id === f.id);
    assert(ls.soBuoi === 2 && ls.buoiDuKien === 2 && ls.buoi[0].soBuoi === 2 && ls.buoi[0].chuanBi === null, `caseDetail: ${JSON.stringify(ls)}`);
    assert(cases.moSuaKetQua(GV, f.id).giaTri.buoiDuKien === 2, 'form Sửa có b');
  }));

  check('TU2-1 (2) · thân web cũ (a = 2, hai dòng không soBuoi, đủ 3 ô, không b) → lưu, mỗi dòng 1 buổi', () => thu(() => {
    const { ivId } = paTutor();
    const cu = (nx: string) => ({ tutor: 'Ms Mai', nhanXet: nx, hinhThuc: 'online', chuanBi: true, taiLieu: false, feedbackGv: true });
    cases.updateResult(GV, ivId, kq({ soBuoi: 2, buoi: [cu('Buổi 1 nghe số'), cu('Buổi 2 nghe tên riêng')], nguoiDay: { performerName: 'Ms Mai' } }));
    const f = lanCuoi(ivId);
    const r = dong(f.id);
    assert(f.buoi_du_kien === null && r.length === 2 && r.every((x) => x.so_buoi === 1 && x.chuan_bi === 1 && x.tai_lieu === 0), JSON.stringify(r));
    assert(f.phu_trach_ten === 'Ms Mai', 'máy chủ vẫn nhận Người dạy kỳ này web cũ gửi');
  }));

  check('TU2-1 (3) · a = 2 mà tổng dòng = 3 → 400 nêu tổng; dòng thừa (3 dòng cho a = 2) → 400; b ngoài 1–60 → 400; không ghi gì', () => thu(() => {
    const { ivId } = paTutor();
    const e = loiCua(() => cases.updateResult(GV, ivId, kq({ soBuoi: 2, buoi: [gop(), gop({ soBuoi: 1, tutorId: null, tutor: 'Ms Mai' })] })));
    assert(e?.status === 400 && /tổng số buổi các dòng là 3/.test(e.message), `${e?.status} ${e?.message}`);
    assert(ma(() => cases.updateResult(GV, ivId, kq({ soBuoi: 2, buoi: [gop({ soBuoi: 1 }), gop({ soBuoi: 1 }), gop({ soBuoi: 1 })] }))) === 400, '3 dòng cho a = 2');
    for (const b of [0, 61, 1.5]) assert(ma(() => cases.updateResult(GV, ivId, kq({ soBuoi: 2, buoiDuKien: b, buoi: [gop()] }))) === 400, `b = ${b}`);
    assert(ma(() => cases.updateResult(GV, ivId, kq({ soBuoi: 2, buoi: [gop({ chuanBi: 'co' })] }))) === 400, '3 nút sai kiểu');
    assert(!lanCuoi(ivId), 'lỗi mà vẫn ghi');
  }));

  check('TU2-1 (4) · a = 0, không dòng, ghi chú trống → lưu ("0 / 2"); a = 0 kèm dòng → 400; a ≥ 1 ghi chú ngắn vẫn 400', () => thu(() => {
    const { ivId } = paTutor();
    assert(ma(() => cases.updateResult(GV, ivId, kq({ soBuoi: 0, buoiDuKien: 2, buoi: [gop({ soBuoi: 1 })], note: '' }))) === 400, 'a = 0 kèm dòng');
    assert(ma(() => cases.updateResult(GV, ivId, kq({ soBuoi: 1, buoi: [gop({ soBuoi: 1 })], note: 'ngắn' }))) === 400, 'a ≥ 1 ghi chú < 8');
    cases.updateResult(GV, ivId, kq({ soBuoi: 0, buoiDuKien: 2, note: '' }));
    const f = lanCuoi(ivId);
    assert(f.so_buoi === 0 && f.buoi_du_kien === 2 && f.note === '' && !dong(f.id).length, JSON.stringify(f));
  }));

  check('TU2-1 (5) · a = 1 thiếu tên tutor → 400; thiếu Nội dung → 400', () => thu(() => {
    const { ivId } = paTutor();
    assert(ma(() => cases.updateResult(GV, ivId, kq({ soBuoi: 1, buoi: [{ tutor: '', nhanXet: 'Chữa Section 3' }] }))) === 400, 'thiếu tutor');
    assert(ma(() => cases.updateResult(GV, ivId, kq({ soBuoi: 1, buoi: [{ tutor: 'Ms Mai', nhanXet: ' ' }] }))) === 400, 'thiếu Nội dung');
  }));

  check('TU2-1 (6) · gvId → tạo đúng MỘT dòng tutors.user_id (tên = họ tên tài khoản), lần hai dùng lại; tutorId âm (web cũ) = gvId; không phải GV → 400', () => thu(() => {
    const gv = P.w1Teacher;
    const ten = get('SELECT full_name FROM users WHERE id = ?', gv.userId).full_name;
    assert(!get('SELECT 1 FROM tutors WHERE user_id = ?', gv.userId), 'seed đã có dòng GV');
    const a = paTutor();
    cases.updateResult(GV, a.ivId, kq({ soBuoi: 1, buoi: [{ gvId: gv.userId, tutor: '', nhanXet: 'GV kèm Section 2' }] }));
    const ds = all('SELECT * FROM tutors WHERE user_id = ?', gv.userId);
    assert(ds.length === 1 && ds[0].ten === ten && ds[0].created_by === GV.userId, JSON.stringify(ds));
    const r = dong(lanCuoi(a.ivId).id);
    assert(r[0].tutor_id === ds[0].id && r[0].tutor_ten === ten, JSON.stringify(r));
    const b = paTutor();
    cases.updateResult(GV, b.ivId, kq({ soBuoi: 1, buoi: [{ tutorId: -gv.userId, tutor: ten, nhanXet: 'GV kèm Section 3' }] }));
    assert(all('SELECT id FROM tutors WHERE user_id = ?', gv.userId).length === 1 && dong(lanCuoi(b.ivId).id)[0].tutor_id === ds[0].id, 'lần hai dùng lại dòng cũ');
    const c = paTutor();
    assert(ma(() => cases.updateResult(GV, c.ivId, kq({ soBuoi: 1, buoi: [{ gvId: P.mbManager.userId, tutor: '', nhanXet: 'Head kèm' }] }))) === 400, 'Head (không vai GV) → 400');
    assert(ma(() => cases.updateResult(GV, c.ivId, kq({ soBuoi: 1, buoi: [{ gvId: 99999999, tutor: '', nhanXet: 'không có người này' }] }))) === 400, 'gvId lạ → 400');
  }));

  check('TU2-1 (7) · nháp giữ a, b, dòng Tutor (3 nút trống được) → đọc lại ở Case; sai kiểu → 400; chốt Lưu → nháp NULL', () => thu(() => {
    const { caseId, ivId } = paTutor();
    const buoi = [{ tutorId: tutorId('Nguyễn Thu Lan'), tutor: 'Nguyễn Thu Lan', nhanXet: 'Buổi 1 nghe số', soBuoi: 1, chuanBi: true }];
    const r = cases.luuNhapKetQua(GV, ivId, { note: '', outcome: '', soBuoi: 1, buoiDuKien: 2, buoi });
    assert(r.nhap?.soBuoi === 1 && r.nhap.buoiDuKien === 2 && r.nhap.buoi?.[0]?.chuanBi === true && r.nhap.buoi[0].taiLieu === null, JSON.stringify(r.nhap));
    const n = cases.caseDetail(GV, caseId).interventions.find((x: any) => x.id === ivId).nhapKetQua;
    assert(n?.buoi?.[0]?.nhanXet === 'Buổi 1 nghe số' && n.soBuoi === 1, `caseDetail: ${JSON.stringify(n)}`);
    const nk = get(`SELECT COUNT(*) n FROM audit_logs WHERE entity_id = ? AND action = 'case.result.draft'`, ivId).n;
    cases.luuNhapKetQua(GV, ivId, { note: '', outcome: '', soBuoi: 1, buoiDuKien: 2, buoi });   // gửi lại đúng bản đang có
    assert(get(`SELECT COUNT(*) n FROM audit_logs WHERE entity_id = ? AND action = 'case.result.draft'`, ivId).n === nk, 'gửi lại cùng nội dung: không ghi thêm');
    for (const x of [{ soBuoi: 61 }, { buoiDuKien: 0 }, { buoi: 'x' }, { buoi: [{ tutor: 'a'.repeat(101) }] }, { buoi: [{ chuanBi: 'co' }] }]) {
      assert(ma(() => cases.luuNhapKetQua(GV, ivId, { note: 'tạm', ...x })) === 400, `nháp sai: ${JSON.stringify(x).slice(0, 40)}`);
    }
    assert(ma(() => cases.luuNhapKetQua(P.cpManager, ivId, { soBuoi: 1 })) === 403, 'Head chi nhánh khác lưu nháp → 403');
    cases.updateResult(GV, ivId, kq({ soBuoi: 1, buoiDuKien: 2, buoi: [{ ...buoi[0], nhanXet: 'Buổi 1 nghe số, đúng 8/10' }] }));
    assert(get('SELECT nhap_ket_qua FROM case_interventions WHERE id = ?', ivId).nhap_ket_qua == null, 'chốt → nháp NULL');
    cases.luuNhapKetQua(GV, ivId, { soBuoi: 1 });
    assert(cases.luuNhapKetQua(GV, ivId, { soBuoi: null, outcome: '', note: '' }).nhap === null, 'mọi ô trống = bỏ nháp');
  }));

  check('TU2-1 (8) · Xác nhận PA Tutor quy chế SOS không Số buổi → PA chạy; Số buổi gửi kèm không nhận (giữ giá trị cũ)', () => thu(() => {
    const ds = all(`SELECT iv.id FROM case_interventions iv JOIN sos_cases sc ON sc.id = iv.case_id
      WHERE iv.preset = 1 AND iv.status = 'planned' AND iv.confirmed_at IS NULL AND iv.kind != 'bo_tro' AND iv.approval_state IS NOT 'pending' AND sc.status != 'done' ORDER BY iv.id`);
    let xong = false;
    for (const { id } of ds) {
      conn.prepare(`UPDATE case_interventions SET kind = 'tutor', moc_quy_che = 'until_next_mt', so_buoi = NULL, performer_user_id = NULL, performer_name = NULL WHERE id = ?`).run(id);
      xoaNho();
      const e = loiCua(() => sosAuto.xacNhanPaQuyChe(P.admin, id, { description: 'Tutor kèm Section 3, hai buổi một tuần.', soBuoi: 4 }));
      if (e && /mô tả|Xác nhận Case/.test(String(e.message))) continue;   // Case chưa có nguyên nhân — thử PA khác
      assert(!e, `xác nhận lỗi: ${e?.status} ${e?.message}`);
      const sau = get('SELECT * FROM case_interventions WHERE id = ?', id);
      assert(sau.status === 'started' && sau.so_buoi === null && !!sau.confirmed_at, JSON.stringify({ st: sau.status, sb: sau.so_buoi }));
      xong = true;
      break;
    }
    assert(xong, `không có PA quy chế chờ xác nhận để thử (${ds.length})`);
  }));

  check('TU2-1 (9) · sửa lần ghi CŨ (không phải gần nhất): đổi 3 nút + tutor → lưu, nhật ký có dòng Tutor trước → sau; lần ghi chưa có số buổi gửi a → sửa đủ', () => thu(() => {
    const { ivId } = paTutor();
    cases.updateResult(GV, ivId, kq({ soBuoi: 1, buoiDuKien: 2, buoi: [gop({ soBuoi: 1 })] }));
    const f1 = lanCuoi(ivId).id;
    cases.updateResult(GV, ivId, kq({ soBuoi: 2, buoiDuKien: 2, buoi: [gop()], observedOn: TODAY }));
    assert(lanCuoi(ivId).id !== f1, 'đã có lần ghi sau');
    cases.suaKetQua(GV, f1, kq({ soBuoi: 1, buoiDuKien: 2, buoi: [{ tutor: 'Ms Mai', nhanXet: 'Sửa: buổi do Ms Mai dạy', soBuoi: 1, chuanBi: false, taiLieu: true, feedbackGv: true }] }));
    const r = dong(f1);
    assert(r.length === 1 && r[0].tutor_ten === 'Ms Mai' && r[0].tutor_id === null && r[0].chuan_bi === 0 && r[0].tai_lieu === 1, JSON.stringify(r));
    const nk = get(`SELECT before_json, after_json FROM audit_logs WHERE entity_id = ? AND action = 'case.result.edit' ORDER BY id DESC LIMIT 1`, ivId);
    assert(nk && /Nguyễn Thu Lan/.test(nk.before_json) && /Ms Mai/.test(nk.after_json), `nhật ký: ${JSON.stringify(nk)?.slice(0, 200)}`);
    /* Lần ghi Tutor từ trước OV-12h (không số buổi): không gửi a → giữ như cũ; gửi a → thêm phần Tutor. */
    conn.prepare('UPDATE case_followups SET so_buoi = NULL, buoi_du_kien = NULL WHERE id = ?').run(f1);
    conn.prepare('DELETE FROM case_followup_buoi WHERE followup_id = ?').run(f1);
    cases.suaKetQua(GV, f1, kq({ note: 'Sửa chữ lần ghi cũ, giữ như trước' }));
    assert(get('SELECT so_buoi FROM case_followups WHERE id = ?', f1).so_buoi === null && !dong(f1).length, 'không gửi a: giữ');
    cases.suaKetQua(GV, f1, kq({ soBuoi: 1, buoiDuKien: 1, buoi: [gop({ soBuoi: 1 })] }));
    assert(get('SELECT so_buoi FROM case_followups WHERE id = ?', f1).so_buoi === 1 && dong(f1).length === 1, 'gửi a: sửa đủ phần Tutor');
  }));

  check('TU2-1 (9b) · web cũ sửa (không gửi b) → b giữ; đổi lựa chọn (đường đảo) → b giữ', () => thu(() => {
    const { ivId } = paTutor();
    cases.updateResult(GV, ivId, kq({ soBuoi: 2, buoiDuKien: 3, buoi: [gop()] }));
    const f = lanCuoi(ivId).id;
    cases.suaKetQua(GV, f, kq({ soBuoi: 2, buoi: [gop({ nhanXet: 'Sửa nội dung, đúng 10/13' })] }));
    assert(get('SELECT buoi_du_kien FROM case_followups WHERE id = ?', f).buoi_du_kien === 3, 'sửa chữ giữ b');
    cases.suaKetQua(GV, f, kq({ outcome: 'improved', soBuoi: 2, buoi: [gop()] }));
    assert(lanCuoi(ivId).buoi_du_kien === 3, 'đường đảo giữ b');
  }));

  const httpApp = createApp().listen(0);
  const port = (httpApp.address() as any).port as number;
  const goi = (userId: number, url: string, body?: unknown, method = body === undefined ? 'GET' : 'POST') => fetch(`http://127.0.0.1:${port}/api${url}`, {
    method, headers: { 'content-type': 'application/json', cookie: `pisa_demo_session=${createSession(userId)}` },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const cx = get(`SELECT ur.user_id id FROM user_roles ur JOIN roles r ON r.id = ur.role_id WHERE r.key = 'cx' AND ur.status = 'active' LIMIT 1`).id as number;
  try {
    const { ivId } = paTutor();
    await checkAsync('TU2-1 (10) · /tutors/chon: GV cùng chi nhánh (loai gv, gvId, không SĐT) trước tutor ngoài gợi ý; gõ tên tìm mọi GV; GV đã gắn chỉ một dòng', async () => {
      const x: any = await (await goi(GV.userId, `/tutors/chon?paId=${ivId}`)).json();
      const gv = x.ds.filter((r: any) => r.loai === 'gv');
      assert(gv.length > 0 && gv.every((r: any) => r.gvId > 0 && r.sdtDuoi === null && r.id === -r.gvId), `GV: ${JSON.stringify(gv.slice(0, 3))}`);
      assert(x.ds.every((r: any) => r.loai === 'gv' || r.loai === 'tutor') && !/"phone"|"sdt"/.test(JSON.stringify(x)), 'loai + không lộ SĐT');
      const thuTu = x.ds.map((r: any) => `${r.goiY ? 1 : 0}${r.loai}`);
      const dauTutorThuong = thuTu.indexOf('0tutor');
      assert(dauTutorThuong === -1 || thuTu.slice(dauTutorThuong).every((k: string) => k === '0tutor'), `thứ tự gợi ý → GV → tutor: ${thuTu.join(',')}`);
      const cp = get(`SELECT u.id, u.full_name FROM users u JOIN user_roles ur ON ur.user_id = u.id JOIN roles r ON r.id = ur.role_id JOIN branches b ON b.id = ur.branch_id
        WHERE r.key = 'teacher' AND ur.status = 'active' AND u.status = 'active' AND b.code = 'CP' LIMIT 1`);
      assert(!x.ds.some((r: any) => r.gvId === cp.id), 'chưa gõ: không có GV chi nhánh khác');
      const tim: any = await (await goi(GV.userId, `/tutors/chon?paId=${ivId}&q=${encodeURIComponent(cp.full_name)}`)).json();
      assert(tim.ds.some((r: any) => r.gvId === cp.id && r.goiY === false), `gõ tên GV CP: ${JSON.stringify(tim.ds.map((r: any) => r.ten))}`);
    });
    await checkAsync('TU2-1 (10b) · GV đã có dòng danh bạ → một dòng ở nhóm GV (id = dòng đó), không lặp ở nhóm tutor; điền sẵn = tutor lần ghi gần nhất', async () => {
      const w1 = P.w1Teacher.userId;
      cases.updateResult(GV, ivId, kq({ soBuoi: 1, buoi: [{ gvId: w1, tutor: '', nhanXet: 'GV kèm Section 2 điền số' }] }));
      try {
        const dongGv = get('SELECT id, ten FROM tutors WHERE user_id = ?', w1);
        const x: any = await (await goi(GV.userId, `/tutors/chon?paId=${ivId}&q=${encodeURIComponent(dongGv.ten)}`)).json();
        const cua = x.ds.filter((r: any) => r.id === dongGv.id || r.gvId === w1);
        assert(cua.length === 1 && cua[0].loai === 'gv' && cua[0].id === dongGv.id, JSON.stringify(cua));
        assert(x.dienSan?.tutorId === dongGv.id, `điền sẵn: ${JSON.stringify(x.dienSan)}`);
      } finally {
        const f = lanCuoi(ivId);
        cases.hoanTacKetQua(GV, f.id);
        conn.prepare('DELETE FROM tutors WHERE user_id = ?').run(w1);
        xoaNho();
      }
    });
    await checkAsync('TU2-1 (Q) · vai không được làm → 403: GV kỹ năng khác ghi / nháp; CX ghi kết quả, gọi /tutors/chon; Head chi nhánh khác ghi', async () => {
      const than = kq({ soBuoi: 1, buoi: [gop({ soBuoi: 1 })] });
      for (const [ai, id] of [['GV Writing', P.w1Teacher.userId], ['CX', cx], ['Head Cẩm Phả', P.cpManager.userId]] as const) {
        const s = (await goi(id, `/interventions/${ivId}/result`, than)).status;
        assert(s === 403, `${ai} ghi kết quả: ${s}`);
        const n = (await goi(id, `/interventions/${ivId}/nhap`, { soBuoi: 1 }, 'PUT')).status;
        assert(n === 403, `${ai} lưu nháp: ${n}`);
      }
      assert((await goi(cx, `/tutors/chon?paId=${ivId}`)).status === 403, 'CX /tutors/chon');
      assert(!lanCuoi(ivId), 'bị chặn mà vẫn ghi');
    });
  } finally { httpApp.close(); }

  check('TU2-1 (11) · migrate prTutor2 trên DB cũ: thêm 3 cột + chỉ mục + CX tutor.view, dữ liệu cũ giữ (so_buoi = 1); lần hai không đổi; khớp schema.sql', () => {
    const tam = new Database(':memory:');
    tam.exec(`CREATE TABLE branches (id INTEGER PRIMARY KEY); CREATE TABLE users (id INTEGER PRIMARY KEY); CREATE TABLE classes (id INTEGER PRIMARY KEY);
      CREATE TABLE case_followups (id INTEGER PRIMARY KEY, so_buoi INTEGER);
      CREATE TABLE case_followup_buoi (id INTEGER PRIMARY KEY, followup_id INTEGER NOT NULL, buoi_so INTEGER NOT NULL, tutor_ten TEXT NOT NULL, nhan_xet TEXT NOT NULL);
      CREATE TABLE tutors (id INTEGER PRIMARY KEY, ten TEXT NOT NULL);
      CREATE TABLE roles (id INTEGER PRIMARY KEY, key TEXT UNIQUE); CREATE TABLE permissions (id INTEGER PRIMARY KEY, key TEXT UNIQUE);
      CREATE TABLE role_permissions (role_id INTEGER, permission_id INTEGER); CREATE TABLE demo_config (key TEXT PRIMARY KEY, value TEXT, updated_at TEXT);
      INSERT INTO roles (key) VALUES ('cx'), ('teacher'); INSERT INTO permissions (key) VALUES ('tutor.view');
      INSERT INTO case_followups (id, so_buoi) VALUES (1, 2); INSERT INTO case_followup_buoi (followup_id, buoi_so, tutor_ten, nhan_xet) VALUES (1, 1, 'Ms Mai', 'a'), (1, 2, 'Ms Mai', 'b');`);
    const ap: string[] = [];
    mig.migratePrTutor2(tam, ap);
    const anh = () => JSON.stringify([tam.prepare('SELECT * FROM case_followup_buoi ORDER BY id').all(), tam.prepare('SELECT * FROM case_followups').all(),
      tam.prepare('SELECT * FROM role_permissions').all(), tam.prepare(`SELECT name FROM sqlite_master WHERE type = 'index' ORDER BY name`).all()]);
    const sau1 = anh();
    mig.migratePrTutor2(tam, ap);
    assert(ap.length === 1 && sau1 === anh(), `lần hai đổi: ${ap.join(' | ')}`);
    assert((tam.prepare('SELECT COUNT(*) n FROM case_followup_buoi WHERE so_buoi = 1').get() as any).n === 2, 'dòng cũ = 1 buổi');
    assert((tam.prepare(`SELECT COUNT(*) n FROM role_permissions rp JOIN roles r ON r.id = rp.role_id WHERE r.key = 'cx'`).get() as any).n === 1, 'CX tutor.view');
    const cot = (c: any, b: string, ten: string) => JSON.stringify(c.prepare('SELECT type, "notnull" nn, dflt_value dv FROM pragma_table_info(?) WHERE name = ?').get(b, ten));
    for (const [b, c] of [['case_followup_buoi', 'so_buoi'], ['case_followups', 'buoi_du_kien'], ['tutors', 'user_id']]) assert(cot(tam, b, c) === cot(conn, b, c), `${b}.${c}: ${cot(tam, b, c)} ≠ ${cot(conn, b, c)}`);
    const cm = (c: any) => c.prepare(`SELECT sql FROM sqlite_master WHERE name = 'idx_tutors_user'`).get()?.sql?.replace(/\s+/g, ' ');
    assert(cm(tam) && cm(tam) === cm(conn), `${cm(tam)} | ${cm(conn)}`);
    /* Quản trị gỡ ô sau migrate → deploy sau KHÔNG cấp lại (khoá demo_config). */
    tam.exec('DELETE FROM role_permissions');
    mig.migratePrTutor2(tam, ap);
    assert((tam.prepare('SELECT COUNT(*) n FROM role_permissions').get() as any).n === 0, 'cấp lại sau khi gỡ');
    tam.close();
    const q = get(`SELECT 1 x FROM role_permissions rp JOIN roles r ON r.id = rp.role_id JOIN permissions p ON p.id = rp.permission_id WHERE r.key = 'cx' AND p.key = 'tutor.view'`);
    assert(q, 'seed: CX có tutor.view');
  });

  check('TU2-1 (12) · Tổng số buổi: PA Kỳ vọng 10 buổi (không mốc) đếm "x / 10"; PA quy chế SOS có so_buoi cũ không đếm (không "vượt")', () => thu(() => {
    assert(d.coTongBuoi({ kind: 'tutor', soBuoi: 10, mocQuyChe: null }) && d.demBuoi(3, 10).tt === 'chua', 'Kỳ vọng 10 buổi');
    for (const moc of ['until_exam', 'until_next_mt']) assert(!d.coTongBuoi({ kind: 'tutor', soBuoi: 2, mocQuyChe: moc }), `quy chế ${moc}`);
    assert(!d.coTongBuoi({ kind: 'tutor', soBuoi: null }) && !d.coTongBuoi({ kind: 'teaching_adjust', soBuoi: 3 }), 'không số buổi / loại không đếm');
    const { caseId, ivId } = paTutor(10);
    cases.updateResult(GV, ivId, kq({ soBuoi: 3, buoiDuKien: 3, buoi: [gop({ soBuoi: 3 })] }));
    let iv = cases.caseDetail(GV, caseId).interventions.find((x: any) => x.id === ivId);
    assert(iv.coTongBuoi === true && iv.daDay === 3 && iv.soBuoi === 10, JSON.stringify({ c: iv.coTongBuoi, d: iv.daDay }));
    conn.prepare(`UPDATE case_interventions SET moc_quy_che = 'until_exam', so_buoi = 2 WHERE id = ?`).run(ivId);
    xoaNho();
    iv = cases.caseDetail(GV, caseId).interventions.find((x: any) => x.id === ivId);
    assert(iv.coTongBuoi === false, 'PA quy chế: không đếm tổng');
    assert(!d.coNguoiDay('tutor') && d.coNguoiDay('bo_tro') && !d.coNguoiDay('self_study') && d.coNguoiPa('tutor'), 'TU1: ô Người dạy ẩn với Tutor, máy chủ vẫn nhận');
    assert(d.kiemSoBuoiKy(2, 1) === null && d.kiemSoBuoiKy(0, '') === null && d.kiemSoBuoiKy(null, 2) !== null && d.kiemSoBuoiKy(1, 61) !== null, 'kiemSoBuoiKy (a ≤ b không ràng buộc)');
  }));

  check('TU2-1 · Turso: ghi kết quả Tutor chọn GV (tạo dòng danh bạ) ≤ trần ghi kết quả; lưu nháp có phần Tutor ≤ trần nháp', () => thu(() => {
    const { ivId } = paTutor();
    xoaNho(); let s0 = soCauSql();
    cases.updateResult(GV, ivId, kq({ soBuoi: 2, buoiDuKien: 2, buoi: [{ gvId: P.w1Teacher.userId, tutor: '', nhanXet: 'GV kèm Section 2', soBuoi: 2 }] }));
    const ghi = soCauSql() - s0;
    const b = paTutor();
    xoaNho(); s0 = soCauSql();
    cases.luuNhapKetQua(GV, b.ivId, { soBuoi: 1, buoiDuKien: 2, buoi: [gop({ soBuoi: 1 })] });
    const nhap = soCauSql() - s0;
    console.log(`    ghi kết quả Tutor (GV mới) ${ghi} câu · lưu nháp phần Tutor ${nhap} câu`);
    assert(ghi <= TRAN_GHI_LO.ghiKetQuaTutor, `ghi ${ghi} > ${TRAN_GHI_LO.ghiKetQuaTutor}`);
    assert(nhap <= TRAN_GHI_LO.luuNhapKetQua, `nháp ${nhap} > ${TRAN_GHI_LO.luuNhapKetQua}`);
  }));
}
