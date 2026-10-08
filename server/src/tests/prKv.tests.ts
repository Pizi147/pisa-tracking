/**
 * PR-KV (đặc tả 08/10 §3, mockup cuối khoá 2 phần 3) — panel "Kỳ vọng đầu ra · lớp": MỘT việc QL mỗi lớp BE/ELE khi MT0 đủ điểm;
 * Đạt = Overall MT0 ≥ ngưỡng (BE 4.0, ELE 4.5); Không đạt → Trung tâm (mỗi kỹ năng một Case + PA Tutor 10 buổi, Người dạy GV cũ) hoặc Học viên
 * (lý do bắt buộc, Case không PA); Lưu một lần trong một tx, theo lô.
 */
import type { YThucTestKit } from './yThuc.tests.ts';

export async function runPrKvTests(t: YThucTestKit) {
  const { check, assert, conn, P, TODAY } = t;
  const d: any = await import('../../../shared/domain/index.ts');
  const intake: any = await import('../classes/intake.ts');
  const week: any = await import('../platform/week.ts');
  const lenh: any = await import('../classes/lenhChuyen.ts');
  const kv: any = await import('../normal/kyVong.ts');
  const ck: any = await import('../normal/cuoiKhoa.ts');
  const mywork: any = await import('../worklist/mywork.ts');
  const metrics: any = await import('../worklist/metrics.ts');
  const nguCanh: any = await import('../platform/nguCanhRequest.ts');
  const { getConfig, setConfig } = await import('../demoConfig.ts');
  console.log('\nPR-KV · Kỳ vọng đầu ra cả lớp');

  const get = (sql: string, ...a: unknown[]) => conn.prepare(sql).get(...a) as any;
  const all = (sql: string, ...a: unknown[]) => conn.prepare(sql).all(...a) as any[];
  const maLoi = (fn: () => unknown) => { try { fn(); return null; } catch (e: any) { return { status: e?.status, msg: String(e?.message) }; } };

  const MB = get(`SELECT id FROM branches WHERE code = 'MB'`).id as number;
  const THU_HAI = (d.tuanChonDuoc(TODAY) as string[])[0];
  let seq = 0;
  const lopMoi = (kind: string, ft: boolean, tuanHienTai: number) => {
    seq += 1;
    const bat = d.mondayOfDate(t.addDays(TODAY, -7 * (tuanHienTai - 1)));
    return (intake.createClass(P.admin, {
      code: `MB-KV${seq}`, branchId: MB, kind, isFastTrack: ft, route: ft ? 'LT1' : null, startDate: bat, startPeriodId: week.ensurePeriod(bat).id,
    }) as any).id as number;
  };
  const GV = (all(`SELECT DISTINCT ur.user_id FROM user_roles ur JOIN roles r ON r.id = ur.role_id
     WHERE r.key = 'teacher' AND ur.status = 'active' AND ur.branch_id = ? ORDER BY ur.user_id LIMIT 4`, MB)).map((r) => r.user_id as number);
  const ganGv = (lop: number, userId: number, skill: string, core = 0) => conn.prepare(
    `INSERT INTO teacher_assignments (user_id, class_id, skill, is_core, effective_from, status, created_at) VALUES (?,?,?,?, '2026-01-01', 'active', ?)`,
  ).run(userId, lop, skill, core, new Date().toISOString());
  const hocVien = (lop: number, ma: string) => {
    seq += 1;
    const now = new Date().toISOString();
    const sid = Number(conn.prepare(`INSERT INTO students (student_code, full_name, normalized_name, branch_id, status, created_at) VALUES (?,?,?,?, 'active', ?)`)
      .run(`PISA-KV${seq}`, `Hoc vien KV${seq}`, `hoc vien kv${seq}`, MB, now).lastInsertRowid);
    conn.prepare(`INSERT INTO enrollments (student_id, class_id, status, started_at, created_at) VALUES (?,?, 'active', ?, ?)`).run(sid, lop, TODAY, now);
    conn.prepare(`INSERT INTO learning_cycles (student_id, seq, route, programme_code, target_score, started_at, status, created_at) VALUES (?, 1, NULL, ?, NULL, ?, 'active', ?)`)
      .run(sid, ma, TODAY, now);
    return sid;
  };
  /** Ra lệnh Lên FT cho cả nhóm; `thiHanh` → thi hành ở thứ Hai. */
  const lenFt = (nguon: number, sids: number[], dich: number, thiHanh: boolean) => {
    conn.prepare(`UPDATE lenh_chuyen_lop SET trang_thai = 'huy' WHERE trang_thai = 'cho'`).run();
    const r = lenh.raLenh(P.mbManager, { lopNguonId: nguon, boiCanh: 'cuoi-khoa', tuanChung: null,
      dongs: sids.map((studentId) => ({ studentId, huong: 'fast_track', toClassId: dich, tuan: THU_HAI, mucTieu: 6 })) });
    assert(r.ok.length === sids.length, `raLenh: ${JSON.stringify(r.failed)}`);
    if (!thiHanh) return;
    const cu = getConfig('demo_date');
    setConfig('demo_date', THU_HAI);
    try { lenh.thiHanhLenhDenHan(THU_HAI); } finally { setConfig('demo_date', cu); }
  };
  /** Điểm MT0 band (W ghi W1 = W2). */
  const diemMt0 = (sid: number, b: { L: number; R: number; W: number; S: number }) => {
    const a = get(`SELECT id FROM assessment_attempts WHERE student_id = ? AND kind = 'mt0' AND status != 'cancelled'`, sid);
    assert(!!a, `em ${sid} chưa có MT0`);
    const now = new Date().toISOString();
    for (const [k, v] of [['listening', b.L], ['reading', b.R], ['writing1', b.W], ['writing2', b.W], ['speaking', b.S]] as const) {
      conn.prepare('INSERT INTO assessment_scores (attempt_id, skill, band, entered_at) VALUES (?,?,?,?)').run(a.id, k, v, now);
    }
  };
  const viecKv = (who: any) => (mywork.myWork(who, {}).items as any[]).filter((i) => i.group === 'ky_vong_dau_ra');
  const caseKv = (sid: number) => all(`SELECT * FROM sos_cases WHERE student_id = ? AND title LIKE 'Kỳ vọng đầu ra%' ORDER BY id`, sid);
  const paCua = (caseId: number) => all('SELECT * FROM case_interventions WHERE case_id = ?', caseId);

  check('KV1 · goiYKyVong: Overall = trung bình 4 kỹ năng làm tròn 0.5; ELE ≥ 4.5, BE ≥ 4.0; kỹ năng dưới ngưỡng; thiếu kỹ năng → null', () => {
    const a = d.goiYKyVong('ELE', { listening: 5, reading: 4.5, writing: 4.5, speaking: 5.5 });
    assert(a && a.overall === 5 && a.dat === true && a.monTruot.length === 0, JSON.stringify(a));
    const b = d.goiYKyVong('ELE', { listening: 4.5, reading: 4.5, writing: 3.5, speaking: 4 });
    assert(b && b.overall === 4 && b.dat === false && b.monTruot.join() === 'writing,speaking', JSON.stringify(b));
    const c = d.goiYKyVong('BE', { listening: 4, reading: 4, writing: 3.5, speaking: 4.5 });
    assert(c && c.overall === 4 && c.dat === true && c.monTruot.join() === 'writing', JSON.stringify(c));
    assert(d.goiYKyVong('ELE', { listening: 5, reading: 5, writing: null, speaking: 5 }) === null, 'thiếu W phải null');
    assert(d.goiYKyVong('FOU', { listening: 5, reading: 5, writing: 5, speaking: 5 }) === null, 'FOU không có kỳ vọng');
  });

  /* Lớp ELE + FT, 3 em Lên FT đã chuyển: A đạt, B trượt W S, C chưa có MT0. */
  const ele = lopMoi('ELE', false, 11), ft = lopMoi('FT', true, 1);
  ganGv(ele, GV[0], 'writing'); ganGv(ele, GV[1], 'speaking');
  ganGv(ft, GV[2], 'writing2'); ganGv(ft, GV[3], 'speaking');
  const [A, B, C] = [hocVien(ele, 'ELE'), hocVien(ele, 'ELE'), hocVien(ele, 'ELE')];
  const ma = get('SELECT code FROM classes WHERE id = ?', ele).code as string;

  check('KV2 · việc QL: chưa em nào đủ MT0 → không dòng; đủ MT0 → MỘT dòng mỗi lớp "Kỳ vọng đầu ra · lớp · n em", không dòng mỗi em; chỉ số = em chưa đánh dấu; GVCN không thấy', () => {
    lenFt(ele, [A, B, C], ft, true);
    assert(!viecKv(P.mbManager).some((i) => i.classId === ele), 'chưa có MT0 mà đã có việc');
    diemMt0(A, { L: 5, R: 4.5, W: 4.5, S: 5.5 });
    diemMt0(B, { L: 4.5, R: 4.5, W: 3.5, S: 4 });
    const v = viecKv(P.mbManager).filter((i) => i.classId === ele);
    assert(v.length === 1 && v[0].key === `kyvong:${ele}` && v[0].count === 3 && v[0].studentId === null, JSON.stringify(v));
    assert(v[0].tieuDe === `Kỳ vọng đầu ra · ${ma} · 3 em` && v[0].href === `/hoc-vien/lop/${ele}?viec=ky-vong` && v[0].reason === 'MT0 đủ 2/3', JSON.stringify(v[0]));
    assert(!viecKv(P.mbManager).some((i) => /^ky_vong:/.test(i.key)), 'còn dòng mỗi em cũ');
    const ids = metrics.metricSet(P.mbManager, 'hv-len-ft-chua-ky-vong', {}).ids as number[];
    assert([A, B, C].every((x) => ids.includes(x)), `chỉ số: ${ids}`);
    assert(!viecKv(P.cpManager).some((i) => i.classId === ele), 'QL CP thấy việc MB');
  });

  check('KV3 · GET panel: ngưỡng ELE 4.5, điền sẵn A Đạt · B Không đạt Trung tâm W S · C Chờ MT0; GV cũ theo kỹ năng; lớp FT', () => {
    const r = kv.panelKyVong(P.mbManager, ele);
    assert(r.lop.code === ma && r.nguong === 4.5 && r.lopFt.join() === get('SELECT code FROM classes WHERE id = ?', ft).code, JSON.stringify(r.lop) + r.nguong + r.lopFt);
    const em = (sid: number) => r.em.find((x: any) => x.id === sid);
    assert(em(A).mt0.overall === 5 && em(A).goiY.dat === true && em(A).ketLuan === null, JSON.stringify(em(A)));
    assert(em(B).mt0.overall === 4 && em(B).goiY.dat === false && em(B).goiY.monTruot.join() === 'writing,speaking', JSON.stringify(em(B)));
    assert(em(C).mt0 === null && em(C).goiY === null, JSON.stringify(em(C)));
    assert(r.gvCu.writing === get('SELECT full_name FROM users WHERE id = ?', GV[0]).full_name && r.gvCu.speaking, JSON.stringify(r.gvCu));
  });

  check('KV4 · Học viên thiếu lý do → 400, KHÔNG ghi gì (một tx); em chưa đủ MT0 → 400; GVCN / QL chi nhánh khác → 403', () => {
    const truoc = all('SELECT student_id FROM lo_trinh_tiep_theo WHERE class_id = ? AND ky_vong_dat IS NOT NULL', ele).length;
    const e1 = maLoi(() => kv.luuKyVong(P.mbManager, ele, { dong: [
      { sid: A, dat: true }, { sid: B, dat: false, nguyenNhan: 'hoc_sinh', mon: ['writing'], lyDo: '  ' }] }));
    assert(e1?.status === 400 && /lý do/i.test(e1.msg), JSON.stringify(e1));
    const e2 = maLoi(() => kv.luuKyVong(P.mbManager, ele, { dong: [{ sid: C, dat: true }] }));
    assert(e2?.status === 400 && /MT0/.test(e2.msg), JSON.stringify(e2));
    const e3 = maLoi(() => kv.luuKyVong(P.mbManager, ele, { dong: [{ sid: B, dat: false, nguyenNhan: 'trung_tam', mon: [] }] }));
    assert(e3?.status === 400, `Trung tâm không kỹ năng: ${JSON.stringify(e3)}`);
    assert(all('SELECT student_id FROM lo_trinh_tiep_theo WHERE class_id = ? AND ky_vong_dat IS NOT NULL', ele).length === truoc, 'lỗi mà vẫn ghi');
    assert(maLoi(() => kv.luuKyVong(P.cpManager, ele, { dong: [{ sid: A, dat: true }] }))?.status === 403, 'QL CP');
    assert(maLoi(() => kv.panelKyVong(P.normalCoreTeacher, ele))?.status === 403, 'GVCN đọc panel');
  });

  check('KV5 · Lưu: A Đạt không tạo gì; B Trung tâm W S → 2 Case + PA Tutor 10 buổi (Người dạy GV cũ, chủ Case GVBM lớp FT); dòng việc còn 1 em "Chờ MT0 1 em"; lưu lại không nhân đôi', () => {
    const r = kv.luuKyVong(P.mbManager, ele, { dong: [{ sid: A, dat: true }, { sid: B, dat: false, nguyenNhan: 'trung_tam', mon: ['writing', 'speaking'] }] });
    assert(r.luu === 2 && r.taoCase === 2, JSON.stringify(r));
    assert(caseKv(A).length === 0, 'A đạt mà có Case');
    const cs = caseKv(B);
    assert(cs.length === 2, JSON.stringify(cs));
    const w = cs.find((c) => c.category === 'writing2'), s = cs.find((c) => c.category === 'speaking');
    assert(w?.owner_user_id === GV[2] && s?.owner_user_id === GV[3], `chủ Case: ${w?.owner_user_id} ${s?.owner_user_id}`);
    const pw = paCua(w.id), ps = paCua(s.id);
    assert(pw.length === 1 && pw[0].kind === 'tutor' && pw[0].so_buoi === 10 && pw[0].performer_user_id === GV[0], JSON.stringify(pw));
    assert(ps.length === 1 && ps[0].performer_user_id === GV[1], JSON.stringify(ps));
    const lt = get('SELECT * FROM lo_trinh_tiep_theo WHERE student_id = ? AND class_id = ?', B, ele);
    assert(lt.ky_vong_dat === 0 && lt.ky_vong_nguyen_nhan === 'trung_tam' && lt.ky_vong_mon === '["writing","speaking"]', JSON.stringify(lt));
    const v = viecKv(P.mbManager).filter((i) => i.classId === ele);
    assert(v.length === 1 && v[0].count === 1 && v[0].reason === 'Chờ MT0 1 em', JSON.stringify(v));
    const r2 = kv.luuKyVong(P.mbManager, ele, { dong: [{ sid: B, dat: false, nguyenNhan: 'trung_tam', mon: ['writing', 'speaking'] }] });
    assert(r2.taoCase === 0 && caseKv(B).length === 2, `lưu lại: ${JSON.stringify(r2)}`);
  });

  check('KV6 · C có MT0 trượt → Học viên có lý do: một Case "Kỳ vọng đầu ra…" KHÔNG PA; hết em → dòng việc mất', () => {
    diemMt0(C, { L: 4, R: 4, W: 4, S: 4.5 });
    kv.luuKyVong(P.mbManager, ele, { dong: [{ sid: C, dat: false, nguyenNhan: 'hoc_sinh', mon: ['listening', 'reading'], lyDo: 'Nghỉ 5 buổi cuối khoá' }] });
    const cs = caseKv(C);
    assert(cs.length === 1 && paCua(cs[0].id).length === 0, JSON.stringify(cs));
    assert(get('SELECT ky_vong_ghi_chu FROM lo_trinh_tiep_theo WHERE student_id = ? AND class_id = ?', C, ele).ky_vong_ghi_chu === 'Nghỉ 5 buổi cuối khoá', 'lý do');
    assert(!viecKv(P.mbManager).some((i) => i.classId === ele), 'hết em mà còn việc');
  });

  check('KV7 · lệnh chưa thi hành: lưu chỉ ghi kết luận; thi hành → Case Trung tâm có PA + Case Học viên không PA', () => {
    const ele2 = lopMoi('ELE', false, 11), ft2 = lopMoi('FT', true, 1);
    ganGv(ele2, GV[0], 'reading');
    const [X, Y] = [hocVien(ele2, 'ELE'), hocVien(ele2, 'ELE')];
    lenFt(ele2, [X, Y], ft2, false);
    diemMt0(X, { L: 4.5, R: 3.5, W: 4.5, S: 4.5 });
    diemMt0(Y, { L: 4, R: 4, W: 4, S: 4 });
    const r = kv.luuKyVong(P.mbManager, ele2, { dong: [
      { sid: X, dat: false, nguyenNhan: 'trung_tam', mon: ['reading'] }, { sid: Y, dat: false, nguyenNhan: 'hoc_sinh', mon: [], lyDo: 'Gia đình chuyển nhà' }] });
    assert(r.taoCase === 0 && caseKv(X).length === 0 && caseKv(Y).length === 0, `chưa sang FT mà có Case: ${JSON.stringify(r)}`);
    const cu = getConfig('demo_date');
    setConfig('demo_date', THU_HAI);
    try { lenh.thiHanhLenhDenHan(THU_HAI); } finally { setConfig('demo_date', cu); }
    const cx = caseKv(X), cy = caseKv(Y);
    assert(cx.length === 1 && paCua(cx[0].id).length === 1 && paCua(cx[0].id)[0].performer_user_id === GV[0], JSON.stringify(cx));
    assert(cy.length === 1 && paCua(cy[0].id).length === 0, JSON.stringify(cy));
  });

  check('KV8 · lớp 40 em: Lưu một lần ≤ 200 câu SQL, mỗi em Trung tâm 2 Case có PA', () => {
    const be = lopMoi('BE', false, 11), ft3 = lopMoi('FT', true, 1);
    ganGv(be, GV[0], 'writing'); ganGv(be, GV[1], 'speaking');
    const ds = Array.from({ length: 40 }, () => hocVien(be, 'BE'));
    lenFt(be, ds, ft3, true);
    for (const sid of ds) diemMt0(sid, { L: 4, R: 4, W: 3, S: 3.5 });
    const truoc = nguCanh.soCauSql();
    const r = kv.luuKyVong(P.mbManager, be, { dong: ds.map((sid) => ({ sid, dat: false, nguyenNhan: 'trung_tam', mon: ['writing', 'speaking'] })) });
    const n = nguCanh.soCauSql() - truoc;
    assert(r.taoCase === 80 && n <= 200, `câu SQL ${n}, Case ${r.taoCase}`);
    assert(all(`SELECT iv.id FROM case_interventions iv JOIN sos_cases sc ON sc.id = iv.case_id WHERE sc.student_id IN (${ds.join(',')}) AND iv.kind = 'tutor' AND iv.so_buoi = 10`).length === 80, 'PA');
  });

  check('KV9 · panel · Học viên khi MT0 không có kỹ năng nào dưới ngưỡng: không gửi kỹ năng → 400 "chọn kỹ năng", không ghi gì; có kỹ năng → đúng 1 Case không PA', () => {
    const ele3 = lopMoi('ELE', false, 11), ft4 = lopMoi('FT', true, 1);
    const D = hocVien(ele3, 'ELE');
    lenFt(ele3, [D], ft4, true);
    diemMt0(D, { L: 5, R: 5, W: 5, S: 5 });
    const e = maLoi(() => kv.luuKyVong(P.mbManager, ele3, { dong: [{ sid: D, dat: false, nguyenNhan: 'hoc_sinh', lyDo: 'Phụ huynh xin học chậm' }] }));
    assert(e?.status === 400 && /kỹ năng/.test(e.msg), JSON.stringify(e));
    assert(!get('SELECT 1 FROM lo_trinh_tiep_theo WHERE student_id = ? AND ky_vong_dat IS NOT NULL', D) && caseKv(D).length === 0, 'lỗi mà vẫn ghi');
    kv.luuKyVong(P.mbManager, ele3, { dong: [{ sid: D, dat: false, nguyenNhan: 'hoc_sinh', mon: ['reading'], lyDo: 'Phụ huynh xin học chậm' }] });
    const cs = caseKv(D);
    assert(cs.length === 1 && paCua(cs[0].id).length === 0 && cs[0].category === 'reading', JSON.stringify(cs));
  });

  check('KV10 · hồ sơ HV (ghiKetLuanFt) xét theo MT0, không đòi bài Final: Học viên không gửi kỹ năng → kỹ năng MT0 dưới ngưỡng → 1 Case; MT0 không kỹ năng dưới ngưỡng → 400; chưa đủ MT0 → 400', () => {
    const ele4 = lopMoi('ELE', false, 11), ft5 = lopMoi('FT', true, 1);
    const [E, F, G] = [hocVien(ele4, 'ELE'), hocVien(ele4, 'ELE'), hocVien(ele4, 'ELE')];
    lenFt(ele4, [E, F, G], ft5, true);
    assert(!get(`SELECT 1 FROM assessment_attempts WHERE student_id = ? AND kind = 'final'`, E), 'tiền đề: em chưa có bài Final');
    diemMt0(E, { L: 4.5, R: 4.5, W: 3.5, S: 4.5 });
    diemMt0(F, { L: 5, R: 5, W: 5, S: 5 });
    const r = ck.ghiKetLuanFt(P.mbManager, E, { dat: false, nguyenNhan: 'hoc_sinh', ghiChu: 'Nghỉ nhiều buổi', mon: [] });
    const cs = caseKv(E);
    assert(r.taoCaseTutor === 1 && cs.length === 1 && cs[0].category === 'writing2' && paCua(cs[0].id).length === 0, `${JSON.stringify(r)} · ${JSON.stringify(cs)}`);
    const e1 = maLoi(() => ck.ghiKetLuanFt(P.mbManager, F, { dat: false, nguyenNhan: 'hoc_sinh', ghiChu: 'Nghỉ nhiều buổi' }));
    assert(e1?.status === 400 && /kỹ năng/.test(e1.msg) && caseKv(F).length === 0, JSON.stringify(e1));
    const e2 = maLoi(() => ck.ghiKetLuanFt(P.mbManager, G, { dat: true }));
    assert(e2?.status === 400 && /MT0/.test(e2.msg), JSON.stringify(e2));
  });
}
