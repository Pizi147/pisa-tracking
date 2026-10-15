/**
 * PHÉP KIỂM OV-13b (chủ SP 15/10, mockup OV-13 §1, §8, §9) — Đề xuất PA khác cho PA mặc định: gửi lúc Xác nhận (PA gốc chờ, Case "Chờ duyệt đổi PA",
 * việc Xác nhận PA rời GV) / khi PA đang chạy (ghi kết quả kỳ + đề xuất một lần, PA gốc vẫn chạy); Rút · Từ chối (lý do quay về) · Duyệt (PA mới chạy từ
 * ngày duyệt, PA gốc "Đổi PA") · Huỷ quyết định; quyền 403; Xác nhận PA bắt Nội dung + Bắt đầu; ghi nhanh = ghi panel; Hoàn tác lần ghi; trần câu SQL.
 * Dựng như prOv12c (lượt sạch, chốt SOS 2: Case L + Case S); mỗi ca trong một giao dịch rồi cuộn lại (`thu`).
 */
import type { YThucTestKit } from './yThuc.tests.ts';

export async function runPrOv13bTests(t: YThucTestKit) {
  const { check, assert, conn, P, classId, TODAY } = t;
  const attempts: any = await import('../fasttrack/attempts.ts');
  const skillSchedule: any = await import('../fasttrack/skillSchedule.ts');
  const sosAuto: any = await import('../cases/sosAuto.ts');
  const cases: any = await import('../cases/cases.ts');
  const doiPa: any = await import('../cases/doiPa.ts');
  const mywork: any = await import('../worklist/mywork.ts');
  const yeuCau: any = await import('../duyet/yeuCau.ts');
  const intake: any = await import('../classes/intake.ts');
  const week: any = await import('../platform/week.ts');
  const dm: any = await import('../../../shared/domain/index.ts');
  const { TRAN_GHI_LO } = await import('./tocDoDuong.ts');
  const { soCauSql, xoaNho } = await import('../platform/nguCanhRequest.ts');
  console.log('\nOV-13b · Đề xuất PA khác · Xác nhận PA (Nội dung, Bắt đầu) · ghi nhanh · Hoàn tác');

  const thu = <T>(fn: () => T): T => {
    conn.exec('BEGIN IMMEDIATE');
    try { xoaNho(); return fn(); } finally { conn.exec('ROLLBACK'); xoaNho(); }
  };
  const all = (sql: string, ...a: unknown[]) => conn.prepare(sql).all(...a) as any[];
  const one = (sql: string, ...a: unknown[]) => all(sql, ...a)[0];
  const loi = (fn: () => unknown): { status?: number; message: string } | null => { try { fn(); return null; } catch (e: any) { return { status: e?.status, message: String(e?.message ?? e) }; } };

  const QL = P.mbManager;
  const GV = P.lrTeacher;
  const W = week.ensurePeriod('2026-11-02').id as number;
  week.ensurePeriod('2026-11-09');
  const TRONG = '2026-11-04';
  const sid = (intake.commitIntake(P.admin, { classId: classId('MB FT 101'), rows: [{ fullName: 'OV13b Em A', target: 7, email: 'ov13b@demo.test', dob: '2010-01-01' }],
    idempotencyKey: 'ov13b-a' }).studentIds[0]) as number;
  const luot = all(`SELECT id FROM assessment_attempts WHERE student_id = ? AND kind = 'mock' ORDER BY attempt_no`, sid).map((r) => r.id as number).pop()!;

  /** Lượt sạch ở tuần W, kỳ vọng 6.5 (như prOv12c `dung`). */
  const dung = () => {
    skillSchedule.ensureSkillRows(luot);
    const a = one('SELECT * FROM assessment_attempts WHERE id = ?', luot);
    for (const sql of ['DELETE FROM assessment_scores WHERE attempt_id = ?', 'DELETE FROM skill_move_requests WHERE attempt_id = ?',
      'DELETE FROM attempt_skill_skips WHERE attempt_id = ?', 'DELETE FROM sos_coordination_actions WHERE attempt_id = ?']) conn.prepare(sql).run(luot);
    conn.prepare(`UPDATE sos_cases SET status = 'done', dedup_key = NULL WHERE student_id = ?`).run(sid);
    conn.prepare('DELETE FROM case_signals WHERE student_id = ?').run(sid);
    conn.prepare(`UPDATE attempt_skills SET planned_period_id = ?, sit_status = 'scheduled', required = 1, absence_move_count = 0, huy_vang = 0,
      absent_from_no_show = 0, deadline_override = NULL WHERE attempt_id = ?`).run(W, luot);
    conn.prepare(`UPDATE assessment_attempts SET status = 'planned', lich_su = 0, planned_period_id = ?, deadline_override = NULL, target_at_attempt = ? WHERE id = ?`)
      .run(W, 6.5 + dm.expectationDelta(a.attempt_no, attempts.routeCuaLuot(a)), luot);
    conn.prepare('UPDATE attempt_skills SET planned_period_id = NULL WHERE planned_period_id = ? AND attempt_id != ?').run(W, luot);
    xoaNho();
  };
  const nhom = (s: string) => dm.issuesForTopic(s).filter((i: any) => !dm.laKhac(i.code)).slice(0, 2).map((i: any) => i.code) as string[];
  const diem = (s: string, band: number) => attempts.saveScore(QL, luot, s,
    { ...(s === 'listening' || s === 'reading' ? { band } : { criteria: [band, band, band, band] }), nhanXet: `Nhận xét ${s}: làm chậm, sai dạng bài quen thuộc.`,
      ...(band < 6.5 ? { nhomNguyenNhan: nhom(s) } : {}) }, TRONG, { tuNguoiDung: true });
  /** L 5 + S 5.5 → chốt SOS 2: Case L (GV = GV Listening) với PA quy chế chờ xác nhận. */
  const dungCase = () => {
    dung();
    diem('listening', 5); diem('reading', 7); diem('writing1', 7); diem('writing2', 7); diem('speaking', 5.5);
    const c = one(`SELECT DISTINCT c.* FROM sos_cases c JOIN case_signals g ON g.case_id = c.id WHERE g.attempt_id = ? AND c.topic = 'listening'`, luot);
    const goc = one(`SELECT * FROM case_interventions WHERE case_id = ? AND preset = 1 AND status = 'planned' AND kind != 'bo_tro'`, c.id);
    assert(goc, 'Case L phải có PA quy chế chờ xác nhận');
    return { caseId: c.id as number, goc };
  };
  const loaiKhac = (kind: string) => (['extra_homework', 'teaching_adjust'] as const).find((k) => k !== kind)!;
  const deXuat = (goc: any, o: Record<string, unknown> = {}) => ({
    kind: loaiKhac(goc.kind), description: '3 bài Listening / tuần trên lớp, GV kèm 15 phút cuối buổi.', performerSelf: true,
    lyDo: 'Em không tự học ở nhà được, cần GV kèm trên lớp.', ...o,
  });
  const theCho = (gocId: number) => one(`SELECT * FROM yeu_cau_duyet WHERE loai = 'de_xuat_pa' AND trang_thai = 'cho' AND json_extract(du_lieu, '$.thayPaId') = ?`, gocId);
  const viecXn = (p: any, caseId: number) => mywork.myWork(p, { nguoi: 'tat-ca' }).items.filter((it: any) => it.group === 'xac_nhan_pa' && it.caseId === caseId);
  const ivCua = (p: any, caseId: number, id: number) => cases.caseDetail(p, caseId).interventions.find((x: any) => x.id === id);

  check('OV13b-1 · gửi lúc Xác nhận PA: PA gốc CHỜ (chưa chạy), Case "Chờ duyệt đổi PA", việc Xác nhận PA rời GV; kiểm lý do / loại / quyền', () => thu(() => {
    const { caseId, goc } = dungCase();
    assert(viecXn(GV, caseId).length === 1, 'trước: GV có việc Xác nhận PA');
    assert(loi(() => doiPa.deXuatDoiPa(GV, goc.id, deXuat(goc, { lyDo: 'Em ở xa' })))?.status === 400, 'lý do < 10 ký tự → 400');
    assert(loi(() => doiPa.deXuatDoiPa(GV, goc.id, deXuat(goc, { kind: goc.kind })))?.status === 400, 'cùng loại → 400');
    assert(loi(() => doiPa.deXuatDoiPa(GV, goc.id, deXuat(goc, { kind: 'bo_tro' })))?.status === 400, 'loại ngoài danh sách → 400');
    assert(loi(() => doiPa.deXuatDoiPa(P.w1Teacher, goc.id, deXuat(goc)))?.status === 403, 'GV kỹ năng khác → 403');
    const ct = doiPa.deXuatDoiPa(GV, goc.id, deXuat(goc));
    const g = one('SELECT * FROM case_interventions WHERE id = ?', goc.id);
    const moi = one('SELECT * FROM case_interventions WHERE id = ?', g.superseded_by);
    assert(g.status === 'planned' && !g.confirmed_at && !g.closed_reason, `PA gốc chờ: ${g.status}`);
    assert(moi && moi.approval_state === 'pending' && moi.status === 'planned' && !moi.started_date, `PA mới chờ duyệt: ${JSON.stringify(moi)}`);
    const the = theCho(goc.id);
    assert(the && the.doi_tuong_id === moi.id && JSON.parse(the.du_lieu).goc.chay === false, 'thẻ Đề xuất PA trỏ PA mới, du_lieu.thayPaId');
    assert(ct.trangThaiV4.k === 'cho-duyet-doi-pa' && ct.trangThaiV4.chu === 'Chờ duyệt đổi PA', `trạng thái ${ct.trangThaiV4.k}`);
    const ivG = ct.interventions.find((x: any) => x.id === goc.id);
    assert(ivG.doiPa?.trangThai === 'cho' && ivG.doiPa.laNguoiGui && !ivG.awaitingConfirmation, `dòng PA gốc: ${JSON.stringify(ivG.doiPa)}`);
    assert(ct.interventions.find((x: any) => x.id === moi.id).laPaDoi, 'PA mới đánh dấu laPaDoi');
    assert(viecXn(GV, caseId).length === 0, 'việc Xác nhận PA rời GV');
    assert(loi(() => doiPa.deXuatDoiPa(GV, goc.id, deXuat(goc)))?.status === 400, 'gửi lần hai khi còn chờ → 400');
    assert(loi(() => yeuCau.duyetYeuCau(GV, the.id, {}))?.status === 403, 'GV duyệt → 403');
    const txt = JSON.stringify(yeuCau.hopChoDuyet(QL, {}).the.filter((y: any) => y.id === the.id));
    assert(/PA khác · Listening/.test(txt) && /Nếu duyệt|chạy từ ngày duyệt/.test(txt), 'thẻ QL: "PA khác · Listening" + "chạy từ ngày duyệt"');
  }));

  check('OV13b-2 · Rút: chỉ người gửi; PA mới huỷ, việc Xác nhận PA quay lại', () => thu(() => {
    const { caseId, goc } = dungCase();
    doiPa.deXuatDoiPa(GV, goc.id, deXuat(goc));
    const the = theCho(goc.id);
    assert(loi(() => yeuCau.rutYeuCau(QL, the.id))?.status === 403, 'người khác rút → 403');
    yeuCau.rutYeuCau(GV, the.id);
    assert(one('SELECT status FROM case_interventions WHERE id = ?', the.doi_tuong_id).status === 'cancelled', 'PA mới huỷ');
    assert(one('SELECT superseded_by FROM case_interventions WHERE id = ?', goc.id).superseded_by === null, 'PA gốc thôi trỏ');
    assert(viecXn(GV, caseId).length === 1 && cases.caseDetail(GV, caseId).trangThaiV4.k === 'cho-xac-nhan-pa', 'việc Xác nhận PA quay lại');
  }));

  check('OV13b-3 · Từ chối (lý do): việc Xác nhận PA gốc quay lại kèm lý do; GV đề xuất lại được', () => thu(() => {
    const { caseId, goc } = dungCase();
    doiPa.deXuatDoiPa(GV, goc.id, deXuat(goc));
    yeuCau.tuChoiYeuCau(QL, theCho(goc.id).id, 'Giữ Xếp tự học tới MT4, GV kiểm bài T6.');
    const iv = ivCua(GV, caseId, goc.id);
    assert(iv.awaitingConfirmation && iv.doiPa?.trangThai === 'tu_choi' && /Giữ Xếp tự học/.test(iv.doiPa.lyDoTuChoi), `lý do từ chối: ${JSON.stringify(iv.doiPa)}`);
    assert(viecXn(GV, caseId).length === 1, 'việc quay lại');
    doiPa.deXuatDoiPa(GV, goc.id, deXuat(goc, { lyDo: 'Đề xuất lại: em đã đổi lịch, cần GV kèm.' }));
    assert(theCho(goc.id), 'đề xuất lại được');
  }));

  check('OV13b-4 · Duyệt: PA mới chạy từ ngày duyệt, PA gốc "Đổi PA"; Huỷ quyết định đưa cả hai về chờ', () => thu(() => {
    const { caseId, goc } = dungCase();
    doiPa.deXuatDoiPa(GV, goc.id, deXuat(goc));
    const the = theCho(goc.id);
    yeuCau.duyetYeuCau(QL, the.id, {});
    const moi = one('SELECT * FROM case_interventions WHERE id = ?', the.doi_tuong_id);
    const g = one('SELECT * FROM case_interventions WHERE id = ?', goc.id);
    assert(moi.status === 'started' && moi.started_date === TODAY && moi.action_due, `PA mới chạy từ hôm duyệt: ${moi.status} ${moi.started_date}`);
    assert(g.status === 'completed' && g.closed_reason === 'doi_pa' && g.superseded_by === moi.id, `PA gốc khép Đổi PA: ${g.status} ${g.closed_reason}`);
    assert(cases.caseDetail(GV, caseId).trangThaiV4.k === 'dang-lam', 'Case Đang làm');
    yeuCau.huyQuyetDinh(QL, the.id);
    const g2 = one('SELECT * FROM case_interventions WHERE id = ?', goc.id);
    assert(g2.status === 'planned' && !g2.closed_reason && g2.superseded_by === moi.id && theCho(goc.id), 'Huỷ quyết định: PA gốc chờ lại, thẻ chờ lại');
  }));

  check('OV13b-5 · PA đang chạy: "Lưu kết quả · gửi QL duyệt" một lần — kết quả kỳ lưu, PA gốc vẫn chạy; Hoàn tác bỏ cả hai; duyệt → gốc Đổi PA', () => thu(() => {
    const { caseId, goc } = dungCase();
    sosAuto.xacNhanPaQuyChe(GV, goc.id, { description: 'Nghe Section 2–3 có số liệu, chép chính tả 10 câu mỗi buổi.' });
    const g = one('SELECT * FROM case_interventions WHERE id = ?', goc.id);
    const buoi = dm.coSoBuoiKy({ kind: g.kind, soBuoi: g.so_buoi }) ? { soBuoi: 0 } : {};
    const kq = { ...dm.ketQuaNhanh(dm.coSoBuoiKy({ kind: g.kind, soBuoi: g.so_buoi }) ? 'insufficient' : 'partial', 'TFNG đúng 9/13, tăng 2 câu so với kỳ trước.'), ...buoi };
    assert(loi(() => cases.updateResult(GV, goc.id, { ...kq, decision: 'adjust', decisionNote: 'đổi', deXuatPa: deXuat(g) }))?.status === 400, 'đề xuất chỉ đi với Giữ nguyên');
    cases.updateResult(GV, goc.id, { ...kq, deXuatPa: deXuat(g) });
    const fu = one('SELECT * FROM case_followups WHERE intervention_id = ? ORDER BY id DESC LIMIT 1', goc.id);
    const the = theCho(goc.id);
    assert(fu && fu.next_step === 'continue' && the && JSON.parse(the.du_lieu).followupId === fu.id && JSON.parse(the.du_lieu).goc.chay, 'kết quả + thẻ cùng lần');
    assert(one('SELECT status FROM case_interventions WHERE id = ?', goc.id).status === 'started', 'PA gốc vẫn chạy');
    assert(cases.caseDetail(GV, caseId).trangThaiV4.k === 'dang-lam', 'Case không "Chờ duyệt đổi PA" khi PA gốc đang chạy');
    assert(loi(() => cases.hoanTacKetQua(P.w1Teacher, fu.id))?.status === 403, 'người khác hoàn tác → 403');
    cases.hoanTacKetQua(GV, fu.id);
    assert(!one('SELECT 1 FROM case_followups WHERE id = ?', fu.id) && !theCho(goc.id), 'Hoàn tác: bỏ lần ghi + rút đề xuất');
    assert(one('SELECT status FROM case_interventions WHERE id = ?', the.doi_tuong_id).status === 'cancelled', 'PA mới của lần đó huỷ');
    cases.updateResult(GV, goc.id, { ...kq, deXuatPa: deXuat(g) });
    yeuCau.duyetYeuCau(QL, theCho(goc.id).id, {});
    const g2 = one('SELECT * FROM case_interventions WHERE id = ?', goc.id);
    assert(g2.status === 'completed' && g2.closed_reason === 'doi_pa', 'duyệt → PA gốc "Đổi PA"');
  }));

  check('OV13b-6 · Xác nhận PA bắt Nội dung; "Bắt đầu" — ngày tương lai đặt lịch kỳ từ ngày đó, ngoài khoảng → 400', () => thu(() => {
    const { goc } = dungCase();
    assert(loi(() => sosAuto.xacNhanPaQuyChe(GV, goc.id, { description: '' }))?.status === 400, 'thiếu Nội dung → 400');
    assert(loi(() => sosAuto.xacNhanPaQuyChe(GV, goc.id, { description: 'Mỗi tuần 2 đề TFNG + Matching headings.', startedDate: '19/10/2026' }))?.status === 400, 'ngày sai dạng → 400');
    assert(loi(() => sosAuto.xacNhanPaQuyChe(GV, goc.id, { description: 'Mỗi tuần 2 đề TFNG + Matching headings.', startedDate: t.addDays(TODAY, 60) }))?.status === 400, 'quá xa → 400');
    const bd = t.addDays(TODAY, 5);
    sosAuto.xacNhanPaQuyChe(GV, goc.id, { description: 'Mỗi tuần 2 đề TFNG + Matching headings.', startedDate: bd });
    const g = one('SELECT * FROM case_interventions WHERE id = ?', goc.id);
    assert(g.started_date === bd && g.cycle_started_on === bd && g.action_due === dm.hanKyGhiKetQua(bd), `lịch kỳ từ ${bd}: ${g.started_date} ${g.action_due}`);
  }));

  check('OV13b-7 · ghi nhanh trên dòng = ghi panel (cùng API, cùng kết quả Giữ nguyên)', () => thu(() => {
    const { goc } = dungCase();
    sosAuto.xacNhanPaQuyChe(GV, goc.id, { description: 'Nghe Section 2–3 có số liệu, chép chính tả 10 câu mỗi buổi.' });
    const g = one('SELECT * FROM case_interventions WHERE id = ?', goc.id);
    const buoi = dm.coSoBuoiKy({ kind: g.kind, soBuoi: g.so_buoi }) ? { soBuoi: 0 } : {};
    const oc = dm.coSoBuoiKy({ kind: g.kind, soBuoi: g.so_buoi }) ? 'insufficient' : 'partial';
    cases.updateResult(GV, goc.id, { ...dm.ketQuaNhanh(oc, '  Đúng 9/13 câu TFNG, nhanh hơn. '), ...buoi });
    const a = one('SELECT outcome, note, next_step, cycle_no FROM case_followups WHERE intervention_id = ? ORDER BY id DESC LIMIT 1', goc.id);
    const due1 = one('SELECT action_due FROM case_interventions WHERE id = ?', goc.id).action_due;
    cases.hoanTacKetQua(GV, one('SELECT id FROM case_followups WHERE intervention_id = ? ORDER BY id DESC LIMIT 1', goc.id).id);
    cases.updateResult(GV, goc.id, { decision: 'keep', outcome: oc, note: 'Đúng 9/13 câu TFNG, nhanh hơn.', ...buoi });
    const b = one('SELECT outcome, note, next_step, cycle_no FROM case_followups WHERE intervention_id = ? ORDER BY id DESC LIMIT 1', goc.id);
    assert(JSON.stringify(a) === JSON.stringify(b) && due1 === one('SELECT action_due FROM case_interventions WHERE id = ?', goc.id).action_due,
      `nhanh ${JSON.stringify(a)} ≠ panel ${JSON.stringify(b)}`);
  }));

  check('OV13b-9 · MỘT hàm đếm quá hạn: badge lớp = số dòng lọc Quá hạn của lớp = đầu nhóm Cần làm (cùng `/my-work`, "n việc")', () => {
    const ds = mywork.myWork(QL, { nguoi: 'tat-ca' }).dong.flatMap((x: any) => (x.con?.length ? x.con : [x]))
      .map((it: any) => ({ quaHan: it.urgency === 'overdue', studentId: it.studentId, classId: it.classId }));
    const lop = [...new Set(ds.filter((v: any) => v.quaHan && v.classId !== null).map((v: any) => v.classId))] as number[];
    assert(lop.length > 0, 'bộ demo phải có lớp có việc quá hạn');
    for (const id of lop) {
      const n = dm.demQuaHan(ds, id);
      const dong = ds.filter((v: any) => v.classId === id && v.quaHan).length;
      const badge = dm.badgeLop({ vai: 'ql', needsPlacement: false, canXepLop: 0, missingSkills: [], soBaiChoCham: 0, phase: 'running', missingCount: 0, soViecQuaHan: n.viec });
      const qh = [...badge.hien, ...badge.an].find((x: any) => x.key === 'qua-han');
      assert(n.viec === dong && qh?.nhan === `${dong} việc quá hạn`, `lớp ${id}: badge "${qh?.nhan}" ≠ ${dong} dòng`);
      assert(n.em <= n.viec && n.em === new Set(ds.filter((v: any) => v.classId === id && v.quaHan && v.studentId !== null).map((v: any) => v.studentId)).size, 'số em cùng nguồn');
    }
  });

  check(`OV13b-8 · trần câu SQL: đề xuất đổi PA ≤ ${TRAN_GHI_LO.deXuatDoiPa}; hoàn tác kết quả ≤ ${TRAN_GHI_LO.hoanTacKetQua}`, () => thu(() => {
    const { goc } = dungCase();
    const doCau = (fn: () => unknown) => { xoaNho(); const s0 = soCauSql(); fn(); return soCauSql() - s0; };
    const dx = doCau(() => doiPa.deXuatDoiPa(GV, goc.id, deXuat(goc)));
    yeuCau.rutYeuCau(GV, theCho(goc.id).id);
    sosAuto.xacNhanPaQuyChe(GV, goc.id, { description: 'Nghe Section 2–3 có số liệu, chép chính tả 10 câu mỗi buổi.' });
    const g = one('SELECT * FROM case_interventions WHERE id = ?', goc.id);
    cases.updateResult(GV, goc.id, { ...dm.ketQuaNhanh(dm.coSoBuoiKy({ kind: g.kind, soBuoi: g.so_buoi }) ? 'insufficient' : 'partial', 'Đúng 9/13 câu TFNG, nhanh hơn.'), ...(dm.coSoBuoiKy({ kind: g.kind, soBuoi: g.so_buoi }) ? { soBuoi: 0 } : {}) });
    const ht = doCau(() => cases.hoanTacKetQua(GV, one('SELECT id FROM case_followups WHERE intervention_id = ? ORDER BY id DESC LIMIT 1', goc.id).id));
    console.log(`    đề xuất ${dx} · hoàn tác ${ht} câu`);
    assert(dx <= TRAN_GHI_LO.deXuatDoiPa && ht <= TRAN_GHI_LO.hoanTacKetQua, `${dx} / ${ht}`);
  }));
}
