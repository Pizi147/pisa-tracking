/**
 * PHÉP KIỂM Q-RL2c (Pa) — Hoàn tác / Mở lại "Kết thúc PA" (N24 ②): kết thúc → đảo → mọi bảng y hệt (PA, mốc, Hành trình, thẻ đổi PA, chuông, Case);
 * có thay đổi sau → 409 không đổi gì; GV không phải GVCN / QL 403; đảo lần hai 409; cờ `coTheHoanTacKetThuc` cho nút ⋯ "Mở lại PA".
 * Dựng như prOv13b (lượt sạch, L 5 + S 5.5 → Case L có PA quy chế); mỗi ca trong một giao dịch rồi cuộn lại (`thu`).
 */
import type { YThucTestKit } from './yThuc.tests.ts';
import { tieuChiThu } from '../seed/tieuChiThu.ts';

export async function runPrQrl2cPaTests(t: YThucTestKit) {
  const { check, assert, conn, P, classId } = t;
  const attempts: any = await import('../fasttrack/attempts.ts');
  const skillSchedule: any = await import('../fasttrack/skillSchedule.ts');
  const sosAuto: any = await import('../cases/sosAuto.ts');
  const cases: any = await import('../cases/cases.ts');
  const doiPa: any = await import('../cases/doiPa.ts');
  const intake: any = await import('../classes/intake.ts');
  const week: any = await import('../platform/week.ts');
  const dm: any = await import('../../../shared/domain/index.ts');
  const { xoaNho } = await import('../platform/nguCanhRequest.ts');
  console.log('\nQ-RL2c (Pa) · Kết thúc PA → Hoàn tác / Mở lại PA');

  const thu = <T>(fn: () => T): T => {
    conn.exec('BEGIN IMMEDIATE');
    try { xoaNho(); return fn(); } finally { conn.exec('ROLLBACK'); xoaNho(); }
  };
  const all = (sql: string, ...a: unknown[]) => conn.prepare(sql).all(...a) as any[];
  const one = (sql: string, ...a: unknown[]) => all(sql, ...a)[0];
  const maLoi = (fn: () => unknown): number | string => { try { fn(); return 'không ném'; } catch (e: any) { return e?.status ?? String(e?.message ?? e); } };

  const QL = P.mbManager;
  const GV = P.lrTeacher;            // GVBM Listening — làm PA, gửi đề xuất đổi PA
  const GVCN = P.coreTeacher;
  /* Người không quyền: GV không phải GVCN lớp (như prOv13a — demo có thể trùng GVCN với GV Listening). */
  const gvKhac = [P.lrTeacher, P.sTeacher, P.w1Teacher, P.w2Teacher].find((x: any) => x.userId !== GVCN.userId)!;
  const W = week.ensurePeriod('2026-11-02').id as number;
  week.ensurePeriod('2026-11-09');
  const TRONG = '2026-11-04';
  const sid = (intake.commitIntake(P.admin, { classId: classId('MB FT 101'), rows: [{ fullName: 'QRL2c PA Em', target: 7, email: 'qrl2cpa@demo.test', dob: '2010-01-01' }],
    idempotencyKey: 'qrl2c-pa' }).studentIds[0]) as number;
  const luot = all(`SELECT id FROM assessment_attempts WHERE student_id = ? AND kind = 'mock' ORDER BY attempt_no`, sid).map((r) => r.id as number).pop()!;

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
    { ...(s === 'listening' || s === 'reading' ? { band } : { criteria: tieuChiThu(band) }), nhanXet: `Nhận xét ${s}: làm chậm, sai dạng bài quen thuộc.`,
      ...(band < 6.5 ? { nhomNguyenNhan: nhom(s) } : {}) }, TRONG);
  /** Case L với PA quy chế ĐANG CHẠY (GV đã xác nhận). */
  const dungPa = () => {
    dung();
    diem('listening', 5); diem('reading', 7); diem('writing1', 7); diem('writing2', 7); diem('speaking', 5.5);
    const c = one(`SELECT DISTINCT c.* FROM sos_cases c JOIN case_signals g ON g.case_id = c.id WHERE g.attempt_id = ? AND c.topic = 'listening'`, luot);
    const goc = one(`SELECT * FROM case_interventions WHERE case_id = ? AND preset = 1 AND status = 'planned' AND kind != 'bo_tro'`, c.id);
    assert(goc, 'Case L phải có PA quy chế chờ xác nhận');
    sosAuto.xacNhanPaQuyChe(GV, goc.id, { description: 'Nghe Section 2–3 có số liệu, chép chính tả 10 câu mỗi buổi.',
      ...(dm.coNguoiDay(goc.kind) ? { performerSelf: true } : {}), ...(goc.kind === 'tutor' ? { soBuoi: 4 } : {}) });
    return { caseId: c.id as number, paId: goc.id as number };
  };
  const deXuat = (goc: any) => ({ kind: (['extra_homework', 'teaching_adjust'] as const).find((k) => k !== goc.kind)!,
    description: '3 bài Listening / tuần trên lớp, GV kèm 15 phút cuối buổi.', performerSelf: true, lyDo: 'Em không tự học ở nhà được, cần GV kèm trên lớp.' });
  const LY = 'Em chuyển sang lịch học khác, dừng PA theo quy chế.';
  const pa = (caseId: number, paId: number, p = QL) => cases.caseDetail(p, caseId).interventions.find((x: any) => x.id === paId);

  /** Ảnh mọi bảng nghiệp vụ (bỏ nhật ký / bản ghi đảo — chỉ ghi thêm). Chuông GIỮ (đảo gỡ chuông của lần kết thúc). */
  const BO = new Set(['audit_logs', 'ghi_dao', 'thung_rac', 'demo_config', 'sqlite_sequence']);
  const anh = () => Object.fromEntries((all(`SELECT name FROM sqlite_master WHERE type = 'table'`) as any[])
    .filter((x) => !BO.has(x.name)).map((x) => [x.name, JSON.stringify(all(`SELECT * FROM ${x.name}`).map((r) => JSON.stringify(r)).sort())]));
  const soAnh = (a: Record<string, string>, b: Record<string, string>) => Object.keys(a).filter((k) => a[k] !== b[k]);
  /** Đọc Case một lần trước khi chụp: đường đọc tự điền mốc (`dienMocQuyChe`) — không để lẫn vào phần so. */
  const chup = (caseId: number) => { xoaNho(); cases.caseDetail(QL, caseId); xoaNho(); return anh(); };

  check('RL2c-PA-1 · Kết thúc PA → Mở lại: mọi bảng y hệt (PA, mốc, Hành trình, Case); cờ nút đúng vai; nhật ký reopen; mở lại lần hai 409', () => thu(() => {
    const { caseId, paId } = dungPa();
    const truoc = chup(caseId);
    cases.ketThucPaQuyChe(QL, paId, { lyDo: LY });
    xoaNho();
    assert(one('SELECT closed_reason r FROM case_interventions WHERE id = ?', paId).r === 'ket_thuc_som', 'đã kết thúc sớm');
    assert(one(`SELECT COUNT(*) n FROM journey_events WHERE dedup_key = ?`, `pa-ket-thuc:${paId}`).n === 1, 'có Hành trình kết thúc');
    assert(pa(caseId, paId, QL).coTheHoanTacKetThuc === true, 'QL thấy Mở lại PA');
    assert(pa(caseId, paId, GVCN).coTheHoanTacKetThuc === true, 'GVCN thấy Mở lại PA');
    assert(pa(caseId, paId, gvKhac).coTheHoanTacKetThuc === false, 'GV không phải GVCN / QL không thấy Mở lại PA');
    const ct = cases.hoanTacKetThucPa(GVCN, paId);
    assert(ct.interventions.find((x: any) => x.id === paId).status === 'started', 'trả caseDetail, PA đang chạy lại');
    const lech = soAnh(truoc, anh());
    assert(!lech.length, `bảng lệch sau Mở lại: ${lech.join(', ')}`);
    assert(one(`SELECT COUNT(*) n FROM audit_logs WHERE action = 'case.intervention.reopen' AND entity_id = ?`, paId).n === 1, 'nhật ký case.intervention.reopen');
    assert(one(`SELECT dao_boi FROM ghi_dao WHERE loai = 'ket_thuc_pa' AND doi_tuong_id = ?`, paId).dao_boi === GVCN.userId, 'bản ghi đảo ghi người mở lại');
    xoaNho();
    assert(pa(caseId, paId).coTheHoanTacKetThuc === false, 'PA chạy lại → không còn nút Mở lại');
    assert(maLoi(() => cases.hoanTacKetThucPa(QL, paId)) === 409, 'mở lại lần hai 409');
    /* Kết thúc lại sau khi mở: được, và lại mở được (bản ghi đảo mới). */
    cases.ketThucPaQuyChe(QL, paId, { lyDo: LY });
    cases.hoanTacKetThucPa(QL, paId);
    assert(!soAnh(truoc, anh()).length, 'vòng thứ hai cũng y hệt');
  }));

  check('RL2c-PA-2 · Kết thúc PA khi đang chờ đổi PA → Mở lại: thẻ về Chờ duyệt, PA mới về chờ duyệt, PA gốc trỏ lại, chuông "Tự đóng" gỡ — bảng y hệt', () => thu(() => {
    const { caseId, paId } = dungPa();
    doiPa.deXuatDoiPa(GV, paId, deXuat(one('SELECT * FROM case_interventions WHERE id = ?', paId)));
    const the = one(`SELECT * FROM yeu_cau_duyet WHERE loai = 'de_xuat_pa' AND trang_thai = 'cho' AND json_extract(du_lieu, '$.thayPaId') = ?`, paId);
    assert(the, 'có thẻ đổi PA chờ');
    const truoc = chup(caseId);
    cases.ketThucPaQuyChe(QL, paId, { lyDo: LY });
    assert(one('SELECT trang_thai FROM yeu_cau_duyet WHERE id = ?', the.id).trang_thai === 'tu_dong', 'thẻ tự đóng');
    assert(one(`SELECT COUNT(*) n FROM notifications WHERE user_id = ? AND entity_type = 'yeu_cau_duyet' AND entity_id = ?`, GV.userId, the.id).n === 1, 'chuông báo người đề xuất');
    cases.hoanTacKetThucPa(QL, paId);
    const lech = soAnh(truoc, anh());
    assert(!lech.length, `bảng lệch sau Mở lại: ${lech.join(', ')}`);
    assert(one('SELECT trang_thai FROM yeu_cau_duyet WHERE id = ?', the.id).trang_thai === 'cho', 'thẻ chờ lại');
  }));

  check('RL2c-PA-3 · đã có thay đổi sau (sửa PA / Case hoàn thành) → 409, không đổi gì; cờ nút false', () => thu(() => {
    const { caseId, paId } = dungPa();
    cases.ketThucPaQuyChe(QL, paId, { lyDo: LY });
    conn.prepare(`UPDATE case_interventions SET description = 'Sửa sau khi kết thúc', updated_at = ? WHERE id = ?`).run(new Date().toISOString(), paId);
    xoaNho();
    assert(pa(caseId, paId).coTheHoanTacKetThuc === false, 'PA đổi sau → không hiện Mở lại');
    const truoc = anh();
    const e = maLoi(() => cases.hoanTacKetThucPa(QL, paId));
    assert(e === 409, `PA đổi sau → 409: ${e}`);
    assert(!soAnh(truoc, anh()).length, '409 không đổi bảng nào');
  }));

  check('RL2c-PA-4 · Case đã hoàn thành → 409; GV ngoài quyền 403; PA không có lần kết thúc → 409', () => thu(() => {
    const { caseId, paId } = dungPa();
    assert(maLoi(() => cases.hoanTacKetThucPa(QL, paId)) === 409, 'chưa kết thúc → 409');
    cases.ketThucPaQuyChe(QL, paId, { lyDo: LY });
    assert(maLoi(() => cases.hoanTacKetThucPa(gvKhac, paId)) === 403, 'GV không phải GVCN / QL → 403');
    assert(one('SELECT closed_reason r FROM case_interventions WHERE id = ?', paId).r === 'ket_thuc_som', '403 không đổi PA');
    conn.prepare(`UPDATE sos_cases SET status = 'done' WHERE id = ?`).run(caseId);
    assert(maLoi(() => cases.hoanTacKetThucPa(QL, paId)) === 409, 'Case hoàn thành → 409');
    xoaNho();
    assert(pa(caseId, paId).coTheHoanTacKetThuc === false, 'Case hoàn thành → không hiện Mở lại');
  }));
}
