/**
 * PHÉP KIỂM PR-OV13a (chủ SP 15/10, đặc tả OV-13 §0, §1 L6–L8, §2) — luật Case / PA mới:
 *  · Case tạm (Q2): lượt Mock FT chưa chốt, ô dưới kỳ vọng có điểm + nhận xét → Case "Chờ chốt SOS" (không hạn / PA / việc / chuông);
 *    ô đạt / xoá điểm trước chốt → xoá hẳn; lượt chốt dưới kỳ vọng → cùng Case thành "Chờ xác nhận PA" (hạn từ ngày chốt); Overall đạt → xoá hẳn.
 *  · A: kỹ năng đạt ở lượt MT sau / Overall đạt khi đã có PA → PA quy chế sang "Kết quả cuối" → ghi xong → Hoàn thành Case.
 *  · B: "đến lúc thi" chưa có ngày thi → mốc = MT cuối của lộ trình ("đến MT3 · W1 NOV"); có ngày thi → theo ngày thi.
 *  · C: GVCN / QL "Kết thúc PA" quy chế đang chạy, lý do ≥ 10 ký tự, mốc nhật ký ghi lý do + người; GV khác → 403.
 *  · migrate prOv13a (a)(b)(c)(e) chạy lặp không đổi, `kiemTruocOv13a` = số migrate đổi; (d) prOv1c không chạy nữa (chỉ ghi khoá).
 * Mỗi ca dựng trong một giao dịch rồi cuộn lại (`thu`) — cùng cách dựng lượt sạch như prOv12c.
 */
import type { YThucTestKit } from './yThuc.tests.ts';
import { duXacNhan } from './luotThu.ts';
import { emailThu } from '../seed/emailThu.ts';

export async function runPrOv13aTests(t: YThucTestKit) {
  const { check, assert, conn, P, classId, TODAY } = t;
  const attempts: any = await import('../fasttrack/attempts.ts');
  const skillSchedule: any = await import('../fasttrack/skillSchedule.ts');
  const sosAuto: any = await import('../cases/sosAuto.ts');
  const cases: any = await import('../cases/cases.ts');
  const sosState: any = await import('../cases/sosState.ts');
  const mywork: any = await import('../worklist/mywork.ts');
  const metrics: any = await import('../worklist/metrics.ts');
  const intake: any = await import('../classes/intake.ts');
  const week: any = await import('../platform/week.ts');
  const dm: any = await import('../../../shared/domain/index.ts');
  const m13: any = await import('../migrate/prOv13a.ts');
  const ov1c: any = await import('../migrate/prOv1c.ts');
  const { xoaNho } = await import('../platform/nguCanhRequest.ts');
  const { getConfig, setConfig } = await import('../demoConfig.ts');
  const { createApp } = await import('../app.ts');
  const { checkAsync } = t as any;
  console.log('\nPR-OV13a · Case tạm · PA quy chế hết kẹt (A · B · C) · migrate prOv13a');

  const thu = <T>(fn: () => T): T => {
    conn.exec('BEGIN IMMEDIATE');
    try { xoaNho(); return fn(); } finally { conn.exec('ROLLBACK'); xoaNho(); }
  };
  const all = (sql: string, ...a: unknown[]) => conn.prepare(sql).all(...a) as any[];
  const one = (sql: string, ...a: unknown[]) => all(sql, ...a)[0];
  const loiCua = (fn: () => unknown): any => { try { fn(); return null; } catch (e) { return e; } };

  const lop = classId('MB FT 101');
  const QL = P.mbManager;
  const GVCN = P.coreTeacher;
  const gvKhac = [P.lrTeacher, P.sTeacher, P.w1Teacher, P.w2Teacher].find((x: any) => x.userId !== GVCN.userId);
  const WS = '2026-11-02', WS1 = '2026-11-09';
  const TRONG = '2026-11-04', BU = '2026-11-11';
  const W = week.ensurePeriod(WS).id as number, W1 = week.ensurePeriod(WS1).id as number;
  week.ensurePeriod('2026-11-16');

  const emMoi = (ten: string) => {
    const sid = (intake.commitIntake(P.admin, { classId: lop, rows: [{ fullName: ten, target: 7, email: emailThu(), dob: '2010-01-01' }],
      idempotencyKey: `ov13a-${ten}` }).studentIds[0]) as number;
    return all(`SELECT id FROM assessment_attempts WHERE student_id = ? AND kind = 'mock' ORDER BY attempt_no`, sid).map((r) => r.id as number);
  };
  const luotA = emMoi('OV13a Em A'), luotB = emMoi('OV13a Em B');
  const luot = luotA[luotA.length - 1], truoc = luotA[luotA.length - 2], luotEmB = luotB[luotB.length - 1];

  /** Lượt sạch ở tuần W (hoặc W1 khi `luotSau`), kỳ vọng 6.5; em không còn Case / tín hiệu / điểm khác (trừ `luotSau`) — như prOv12c; ngày thi trống. */
  const dung = (aid: number, luotSau = false) => {
    skillSchedule.ensureSkillRows(aid);
    const a = one('SELECT * FROM assessment_attempts WHERE id = ?', aid);
    for (const sql of ['DELETE FROM assessment_scores WHERE attempt_id = ?', 'DELETE FROM skill_move_requests WHERE attempt_id = ?',
      'DELETE FROM attempt_skill_skips WHERE attempt_id = ?', 'DELETE FROM sos_coordination_actions WHERE attempt_id = ?']) conn.prepare(sql).run(aid);
    if (!luotSau) {
      conn.prepare(`UPDATE sos_cases SET status = 'done', dedup_key = NULL WHERE student_id = ?`).run(a.student_id);
      conn.prepare('DELETE FROM assessment_scores WHERE attempt_id IN (SELECT id FROM assessment_attempts WHERE student_id = ? AND id != ?)').run(a.student_id, aid);
      conn.prepare('DELETE FROM case_signals WHERE student_id = ?').run(a.student_id);
    }
    conn.prepare('UPDATE learning_cycles SET exam_date = NULL, exam_period_id = NULL, exam_month = NULL WHERE id = ?').run(a.cycle_id);
    const tuan = luotSau ? W1 : W;
    conn.prepare(`UPDATE attempt_skills SET planned_period_id = ?, sit_status = 'scheduled', required = 1, absence_move_count = 0, huy_vang = 0,
      absent_from_no_show = 0, deadline_override = NULL WHERE attempt_id = ?`).run(tuan, aid);
    conn.prepare(`UPDATE assessment_attempts SET status = 'planned', lich_su = 0, planned_period_id = ?, deadline_override = NULL, target_at_attempt = ? WHERE id = ?`)
      .run(tuan, 6.5 + dm.expectationDelta(a.attempt_no, attempts.routeCuaLuot(a)), aid);
    conn.prepare(`UPDATE attempt_skills SET planned_period_id = NULL WHERE planned_period_id = ? AND attempt_id != ?`).run(tuan, aid);
    xoaNho();
  };
  const NX = (s: string) => `Nhận xét ${s}: làm chậm, sai dạng bài quen thuộc.`;
  const nhom = (s: string, n = 2) => dm.issuesForTopic(s).filter((i: any) => !dm.laKhac(i.code)).slice(0, n).map((i: any) => i.code) as string[];
  const diem = (aid: number, s: string, band: number | null, o: { nx?: string | null; today?: string } = {}) => {
    const so = band === null ? (s === 'listening' || s === 'reading' ? { band: null } : { criteria: [null, null, null, null] })
      : s === 'listening' || s === 'reading' ? { band } : { criteria: [band, band, band, band] };
    const nx = o.nx === undefined ? NX(s) : o.nx;
    return attempts.saveScore(QL, aid, s, { ...so, ...(nx !== null && band !== null ? { nhanXet: nx } : {}),
      ...(band !== null && band < 6.5 && nx !== null ? { nhomNguyenNhan: nhom(s) } : {}) }, o.today ?? TRONG);
  };
  const vang = (aid: number, s: string, today = TRONG) => attempts.saveScore(QL, aid, s, { noShow: true }, today);
  const caseEm = (aid: number) => all(`SELECT * FROM sos_cases WHERE student_id = (SELECT student_id FROM assessment_attempts WHERE id = ?) AND status != 'done' ORDER BY id`, aid);
  const caseKn = (aid: number, kn: string) => caseEm(aid).find((c) => c.topic === kn) ?? null;
  const paCua = (caseId: number) => all('SELECT * FROM case_interventions WHERE case_id = ? ORDER BY id', caseId);
  const viecCua = (p: any, caseId: number) => mywork.myWork(p, { nguoi: 'tat-ca' }).items.filter((it: any) => it.caseId === caseId);
  const chotSos2 = (aid: number, today = TRONG) => {
    diem(aid, 'listening', 5, { today }); diem(aid, 'reading', 7, { today }); diem(aid, 'writing1', 7, { today }); diem(aid, 'writing2', 7, { today });
    diem(aid, 'speaking', 5.5, { today });
  };
  const xacNhanPa = (caseId: number, who = QL) => {
    const pa = paCua(caseId).find((x) => x.preset === 1 && x.status === 'planned')!;
    sosAuto.xacNhanPaQuyChe(who, pa.id, duXacNhan(conn, pa.id, { description: 'Theo đề cương, GV kiểm tra hằng tuần và ghi chú tiến bộ.' }));
    xoaNho();
    return one('SELECT * FROM case_interventions WHERE id = ?', pa.id);
  };

  check('OV13a-0 · tiền đề: GVCN khác GVBM kỹ năng; lượt cuối + lượt trước của em mới', () => {
    assert(!!gvKhac && luotA.length >= 2 && luotB.length >= 1, `gvKhac ${!!gvKhac} · lượt ${luotA.length}/${luotB.length}`);
  });

  check('OV13a-1 · lượt chưa chốt, ô dưới kỳ vọng có điểm + nhận xét → Case tạm "Chờ chốt SOS": không hạn / PA / việc / chuông / đếm; sửa được', () => thu(() => {
    dung(luot);
    diem(luot, 'listening', 5);
    assert(!attempts.resultOf(one('SELECT * FROM assessment_attempts WHERE id = ?', luot)).chot, 'lượt phải chưa chốt');
    const c = caseKn(luot, 'listening');
    assert(!!c && c.tam === 1, `phải có Case tạm L: ${JSON.stringify(c)}`);
    assert(c.han_xac_nhan === null && !paCua(c.id).length, `không hạn / PA: ${c.han_xac_nhan} · ${paCua(c.id).length}`);
    const ct = cases.caseDetail(QL, c.id);
    assert(ct.trangThaiV4.k === 'tam' && /chờ chốt SOS/i.test(ct.trangThaiV4.chu) && ct.viecTiep === null, `trạng thái ${ct.trangThaiV4.k} · ${ct.trangThaiV4.chu} · ${ct.viecTiep?.chu}`);
    assert(ct.issues[0]?.observation === NX('listening'), 'nguyên nhân = nhận xét của ô');
    for (const who of [QL, P.lrTeacher, GVCN]) assert(!viecCua(who, c.id).length, `không việc: ${viecCua(who, c.id).map((x: any) => x.tieuDe)}`);
    assert(!one(`SELECT COUNT(*) n FROM notifications WHERE dedup_key LIKE ? OR dedup_key = ?`, `sos:${luot}:%`, `sos-case:${c.id}`).n, 'không chuông');
    const ids = metrics.metricSet(QL, 'case-cho-xac-dinh-nguyen-nhan', {}).ids as number[];
    assert(!ids.includes(c.id), 'Case chờ duyệt (Tổng quan / Tổng hợp) không đếm Case tạm');
    assert(sosState.xuLyCaseMany([c.id], TODAY).get(c.id).cot !== 'choDuyet', 'Tổng hợp: Case tạm không là việc Chờ duyệt');
    const sua = cases.suaCase(QL, c.id, { title: 'Listening Part 3 yếu', urgency: 'urgent' });
    assert(sua.title === 'Listening Part 3 yếu' || one('SELECT title FROM sos_cases WHERE id = ?', c.id).title === 'Listening Part 3 yếu', 'sửa tên Case tạm');
  }));

  check('OV13a-2 · trước chốt: ô thành đạt / xoá điểm / bỏ nhận xét → Case tạm xoá hẳn; nhập lại dưới → Case tạm mới', () => thu(() => {
    dung(luot);
    diem(luot, 'listening', 5);
    const c1 = caseKn(luot, 'listening');
    diem(luot, 'listening', 7);
    assert(!one('SELECT 1 x FROM sos_cases WHERE id = ?', c1.id), 'đạt → Case tạm phải xoá hẳn');
    diem(luot, 'listening', 5);
    const c2 = caseKn(luot, 'listening');
    assert(!!c2 && c2.tam === 1, 'nhập lại dưới → Case tạm mới');
    diem(luot, 'listening', null);
    assert(!one('SELECT 1 x FROM sos_cases WHERE id = ?', c2.id), 'xoá điểm → Case tạm xoá hẳn');
    assert(!caseEm(luot).length, `không còn Case: ${caseEm(luot).length}`);
    /* Case tạm có tệp: không xoá (giữ bằng chứng), đóng lại — không thành việc. */
    diem(luot, 'listening', 5);
    const c3 = caseKn(luot, 'listening');
    conn.prepare(`INSERT INTO attachments (owner_type, owner_id, kind, url, display_name, uploaded_by, created_at) VALUES ('sos_case', ?, 'link', 'https://vi-du.test/bai', 'Bài làm', ?, ?)`)
      .run(c3.id, QL.userId, new Date().toISOString());
    diem(luot, 'listening', 7);
    const giu = one('SELECT status, tam FROM sos_cases WHERE id = ?', c3.id);
    assert(giu?.status === 'done' && giu.tam === 0, `Case tạm có tệp → đóng, không xoá: ${JSON.stringify(giu)}`);
    assert(one(`SELECT COUNT(*) n FROM attachments WHERE owner_type = 'sos_case' AND owner_id = ?`, c3.id).n === 1, 'tệp còn');
  }));

  check('OV13a-3 · lượt chốt dưới kỳ vọng → CÙNG Case thành "Chờ xác nhận PA", hạn từ ngày chốt, PA quy chế, chuông SOS', () => thu(() => {
    dung(luot);
    diem(luot, 'listening', 5);
    const tam = caseKn(luot, 'listening');
    diem(luot, 'reading', 7); diem(luot, 'writing1', 7); diem(luot, 'writing2', 7);
    assert(caseKn(luot, 'listening')?.tam === 1, 'chưa chốt vẫn tạm');
    diem(luot, 'speaking', 5.5);
    const c = caseKn(luot, 'listening');
    assert(c.id === tam.id && c.tam === 0, `cùng Case, hết tạm: ${c.id}/${tam.id} · ${c.tam}`);
    assert(c.han_xac_nhan === dm.hanXacNhan(TODAY, { sosLevel: 2 }), `hạn từ ngày chốt: ${c.han_xac_nhan}`);
    assert(paCua(c.id).some((x) => x.preset === 1 && x.status === 'planned'), 'có PA quy chế chờ xác nhận');
    assert(cases.caseDetail(QL, c.id).trangThaiV4.k === 'cho-xac-nhan-pa', 'Chờ xác nhận PA');
    assert(viecCua(QL, c.id).some((x: any) => x.group === 'xac_nhan_pa'), 'có việc Xác nhận PA');
    assert(one(`SELECT COUNT(*) n FROM notifications WHERE dedup_key LIKE ?`, `sos:${luot}:%`).n > 0, 'có chuông SOS lúc chốt');
    assert(caseEm(luot).filter((x) => x.topic === 'listening').length === 1, 'không Case trùng');
  }));

  check('OV13a-4 · lượt chốt Overall ≥ kỳ vọng (L còn dưới) → Case tạm xoá hẳn', () => thu(() => {
    dung(luot);
    diem(luot, 'listening', 6);
    const tam = caseKn(luot, 'listening');
    assert(!!tam && tam.tam === 1, 'phải có Case tạm L');
    diem(luot, 'reading', 7); diem(luot, 'writing1', 7); diem(luot, 'writing2', 7); diem(luot, 'speaking', 7);
    assert(!one('SELECT 1 x FROM sos_cases WHERE id = ?', tam.id), 'Overall đạt → Case tạm xoá hẳn');
  }));

  check('OV13a-5 · A: kỹ năng đạt ở lượt MT sau → PA quy chế "Kết quả cuối" (hạn như kỳ thường) → ghi xong → Hoàn thành Case', () => thu(() => {
    dung(truoc);
    chotSos2(truoc);
    const cL = caseKn(truoc, 'listening');
    const pa = xacNhanPa(cL.id);
    const hanCu = pa.action_due;
    dung(luot, true);
    for (const s of ['listening', 'reading', 'writing1', 'writing2', 'speaking']) diem(luot, s, 7, { today: BU });
    const sau = one('SELECT * FROM case_interventions WHERE id = ?', pa.id);
    assert(sau.moc_quy_che === 'dat_ky_vong' && sau.status === 'started', `PA sang Kết quả cuối: ${sau.moc_quy_che} · ${sau.status}`);
    assert(sau.action_due === hanCu, `hạn như kỳ thường: ${sau.action_due} / ${hanCu}`);
    let ct = cases.caseDetail(QL, cL.id);
    assert(/^Kết quả cuối/.test(ct.viecTiep?.chu ?? ''), `việc tiếp: ${ct.viecTiep?.chu}`);
    assert(ct.interventions.find((x: any) => x.id === pa.id).lanCuoi, 'lần ghi tới là lần cuối');
    cases.updateResult(QL, pa.id, { outcome: 'improved', note: 'Em đã đạt kỳ vọng Listening ở MT sau.' });
    xoaNho();
    ct = cases.caseDetail(QL, cL.id);
    assert(one('SELECT status FROM case_interventions WHERE id = ?', pa.id).status === 'completed', 'PA kết thúc');
    assert(ct.viecTiep?.chu === 'Hoàn thành Case' && !ct.hoanThanh?.an, `Hoàn thành được: ${ct.viecTiep?.chu} · ${JSON.stringify(ct.hoanThanh)}`);
  }));

  check('OV13a-6 · A: Overall đạt khi Case đã có PA → PA "Kết quả cuối" → ghi xong → Hoàn thành được (không chỉ ghi mốc)', () => thu(() => {
    dung(luot);
    diem(luot, 'listening', 5); diem(luot, 'reading', 7); diem(luot, 'writing1', 7); diem(luot, 'writing2', 7);
    vang(luot, 'speaking');
    const cL = caseKn(luot, 'listening');
    assert(cL && cL.tam === 0, 'chốt nhờ dời → Case thật');
    const pa = xacNhanPa(cL.id);
    diem(luot, 'speaking', 7, { today: BU });   // (5 + 7 + 7 + 7) / 4 = 6.5 ≥ 6.5
    assert(one(`SELECT COUNT(*) n FROM case_milestones WHERE case_id = ? AND kind = 'overall_dat'`, cL.id).n === 1, 'mốc Overall đã đạt');
    assert(one('SELECT moc_quy_che m FROM case_interventions WHERE id = ?', pa.id).m === 'dat_ky_vong', 'PA sang Kết quả cuối');
    cases.updateResult(QL, pa.id, { outcome: 'improved', note: 'Overall đã đạt kỳ vọng sau khi thi bù Speaking.', soBuoi: 0 });
    xoaNho();
    const ct = cases.caseDetail(QL, cL.id);
    assert(ct.viecTiep?.chu === 'Hoàn thành Case' && !ct.hoanThanh?.an, `Hoàn thành được: ${ct.viecTiep?.chu}`);
  }));

  check('OV13a-7 · B: "đến lúc thi" chưa có ngày thi → mốc MT cuối của lộ trình ("đến MT{n} · W1 NOV"); có ngày thi → theo ngày thi', () => thu(() => {
    dung(luot);
    chotSos2(luot);
    const cL = caseKn(luot, 'listening');
    const a = one('SELECT attempt_no FROM assessment_attempts WHERE id = ?', luot);
    assert(paCua(cL.id).some((x) => x.moc_quy_che === 'until_exam'), `PA phải "đến lúc thi": ${paCua(cL.id).map((x) => x.moc_quy_che)}`);
    const pa = xacNhanPa(cL.id);
    assert(pa.followup_due === '2026-11-08', `mốc = hết CN tuần MT cuối: ${pa.followup_due}`);
    let chu = cases.caseDetail(QL, cL.id).interventions.find((x: any) => x.id === pa.id).mocChu as string;
    assert(chu === `đến MT${a.attempt_no} · ${dm.tuanLich('2026-11-08', TODAY)}`, `chữ mốc: ${chu}`);
    assert(!mywork.myWork(QL, { nguoi: 'tat-ca' }).items.some((it: any) => it.key === `moc:${pa.id}`), 'không còn việc "Nhập dự kiến thi"');
    /* Rà #406 (3): MT cuối sớm hơn ngày xác nhận + 4 tuần (PA sinh ngay ở MT cuối) → mốc = xác nhận + 4 tuần, không kết thúc ngay. */
    conn.prepare('UPDATE assessment_attempts SET planned_period_id = ? WHERE id = ?').run(week.ensurePeriod('2026-09-07').id, luot);
    xoaNho();
    cases.caseDetail(QL, cL.id);
    const sau4 = one('SELECT followup_due f FROM case_interventions WHERE id = ?', pa.id).f;
    assert(sau4 === t.addDays(pa.started_date, 28), `mốc ≥ xác nhận + 4 tuần: ${sau4} (xác nhận ${pa.started_date})`);
    assert(!cases.caseDetail(QL, cL.id).interventions.find((x: any) => x.id === pa.id).lanCuoi, 'chưa phải lần ghi cuối');
    conn.prepare('UPDATE learning_cycles SET exam_date = ? WHERE id = (SELECT cycle_id FROM sos_cases WHERE id = ?)').run('2026-12-20', cL.id);
    xoaNho();
    chu = cases.caseDetail(QL, cL.id).interventions.find((x: any) => x.id === pa.id).mocChu as string;
    assert(one('SELECT followup_due f FROM case_interventions WHERE id = ?', pa.id).f === '2026-12-20', 'có ngày thi → mốc theo ngày thi');
    assert(/^đến lúc thi/.test(chu), `chữ mốc theo ngày thi: ${chu}`);
  }));

  check('OV13a-8 · C: GVCN / QL "Kết thúc PA" quy chế đang chạy, lý do ≥ 10 ký tự, nhật ký lý do + người; GV khác 403; PA chờ xác nhận 400', () => thu(() => {
    dung(luot);
    chotSos2(luot);
    const cL = caseKn(luot, 'listening'), cS = caseKn(luot, 'speaking');
    const pa = xacNhanPa(cL.id);
    assert(cases.caseDetail(GVCN, cL.id).viewer.coTheKetThucPa === true, 'GVCN thấy Kết thúc PA');
    assert(cases.caseDetail(gvKhac, cL.id).viewer.coTheKetThucPa === false, 'GV khác không thấy Kết thúc PA');
    const e403 = loiCua(() => cases.ketThucPaQuyChe(gvKhac, pa.id, { lyDo: 'Em chuyển lịch học, ngừng Tutor.' }));
    assert(e403?.status === 403, `GV khác → 403: ${e403?.status} ${e403?.message}`);
    const e400 = loiCua(() => cases.ketThucPaQuyChe(GVCN, pa.id, { lyDo: 'ngắn quá' }));
    assert(e400?.status === 400, `lý do < 10 ký tự → 400: ${e400?.status}`);
    const paS = paCua(cS.id).find((x) => x.preset === 1);
    assert(loiCua(() => cases.ketThucPaQuyChe(QL, paS.id, { lyDo: 'Kết thúc PA chưa xác nhận.' }))?.status === 400, 'PA chờ xác nhận → 400');
    const LY = 'Em chuyển sang lịch học khác, ngừng Tutor.';
    cases.ketThucPaQuyChe(GVCN, pa.id, { lyDo: LY });
    xoaNho();
    const sau = one('SELECT * FROM case_interventions WHERE id = ?', pa.id);
    assert(sau.status === 'completed' && sau.closed_reason === 'ket_thuc_som', `PA kết thúc sớm: ${sau.status} · ${sau.closed_reason}`);
    const moc = one(`SELECT * FROM case_milestones WHERE case_id = ? AND kind = 'ket_thuc_pa'`, cL.id);
    assert(moc?.note?.includes(LY) && moc.created_by === GVCN.userId, `mốc nhật ký: ${JSON.stringify(moc)}`);
    assert(one(`SELECT COUNT(*) n FROM audit_logs WHERE action = 'case.intervention.complete' AND entity_id = ?`, pa.id).n === 1, 'nhật ký hệ thống');
    assert(cases.caseDetail(QL, cL.id).viecTiep?.chu === 'Hoàn thành Case', 'PA khép → Hoàn thành Case');
    const paS2 = xacNhanPa(cS.id);
    cases.ketThucPaQuyChe(QL, paS2.id, { lyDo: 'QL quyết định dừng PA theo đề nghị phụ huynh.' });
    assert(one('SELECT status FROM case_interventions WHERE id = ?', paS2.id).status === 'completed', 'QL kết thúc được');
  }));

  check('OV13a-9 · migrate prOv13a: (a) xoá Case "Chờ chốt SOS" chưa ai đụng · (b) mốc MT cuối · (c) Kết quả cuối · (e) Case tạm; lần 2 không đổi; kiểm trước = migrate', () => thu(() => {
    /* (a) + (e): lượt chưa chốt, L + S dưới có nhận xét → dựng lại hai Case theo luật cũ (đóng "Chờ chốt SOS"); S đã có PA GV thêm (đã đụng). */
    dung(luot);
    diem(luot, 'listening', 5); diem(luot, 'speaking', 5.5);
    const [cL, cS] = [caseKn(luot, 'listening'), caseKn(luot, 'speaking')];
    conn.prepare(`UPDATE sos_cases SET tam = 0, status = 'done', system_close_reason = 'cho_chot_sos', dedup_key = NULL WHERE id IN (?, ?)`).run(cL.id, cS.id);
    conn.prepare(`UPDATE case_signals SET status = 'withdrawn' WHERE attempt_id = ?`).run(luot);
    conn.prepare(`INSERT INTO case_interventions (case_id, kind, description, status, preset, created_at) VALUES (?, 'other', 'GV tự thêm trước khi đóng', 'cancelled', 0, ?)`)
      .run(cS.id, new Date().toISOString());
    /* (b) + (c): em B chốt SOS 2 ở MT cuối; PA L "đến lúc thi" đang chạy mất mốc (dữ liệu cũ); PA S đang chạy mà kỹ năng đã đạt ở lượt sau (mốc passed). */
    dung(luotEmB);
    chotSos2(luotEmB);
    const bL = caseKn(luotEmB, 'listening'), bS = caseKn(luotEmB, 'speaking');
    const paL = xacNhanPa(bL.id), paS = xacNhanPa(bS.id);
    conn.prepare('UPDATE case_interventions SET followup_due = NULL WHERE id = ?').run(paL.id);
    conn.prepare(`INSERT INTO case_milestones (case_id, kind, attempt_id, attempt_no, occurred_on, created_at, dedup_key) VALUES (?, 'passed', NULL, 9, ?, ?, ?)`)
      .run(bS.id, '2026-11-09', new Date(Date.now() + 1000).toISOString(), `t13a:${bS.id}`);
    xoaNho();
    const truocKhi = m13.kiemTruocOv13a(conn);
    const applied: string[] = [];
    const lan1 = m13.migratePrOv13a(conn, applied);
    xoaNho();
    const so = (x: any) => ({ a: x.xoaChoChot.length, b: x.mocMtCuoi.length, c: x.ketQuaCuoi.length, e: x.caseTam.length });
    assert(JSON.stringify(so(truocKhi)) === JSON.stringify(so(lan1)) && applied.length > 0, `kiểm trước = migrate: ${JSON.stringify(so(truocKhi))} / ${JSON.stringify(so(lan1))}`);
    assert(lan1.xoaChoChot.includes(cL.id) && !lan1.xoaChoChot.includes(cS.id), `(a) danh sách: ${lan1.xoaChoChot}`);
    assert(!one('SELECT 1 x FROM sos_cases WHERE id = ?', cL.id) && !!one('SELECT 1 x FROM sos_cases WHERE id = ?', cS.id), '(a) chỉ xoá Case chưa ai đụng');
    assert(lan1.caseTam.filter((k: string) => k.startsWith(`${luot}:`)).length === 2 && caseEm(luot).filter((c) => c.tam === 1).length === 2, `(e) Case tạm cho L + S: ${lan1.caseTam}`);
    assert(lan1.mocMtCuoi.includes(paL.id) && one('SELECT followup_due f FROM case_interventions WHERE id = ?', paL.id).f === '2026-11-08', '(b) mốc MT cuối');
    assert(lan1.ketQuaCuoi.includes(paS.id) && one('SELECT moc_quy_che m FROM case_interventions WHERE id = ?', paS.id).m === 'dat_ky_vong', '(c) Kết quả cuối');
    xoaNho();
    const lan2 = m13.migratePrOv13a(conn, []);
    assert(JSON.stringify(so(lan2)) === JSON.stringify({ a: 0, b: 0, c: 0, e: 0 }), `lần 2 không đổi: ${JSON.stringify(so(lan2))}`);
    assert(JSON.stringify(so(m13.kiemTruocOv13a(conn))) === JSON.stringify({ a: 0, b: 0, c: 0, e: 0 }), 'kiểm trước sau migrate = 0');
  }));

  check('OV13a-10 · (d) prOv1c không chạy nữa: bước migrate chỉ ghi khoá demo_config, không đóng Case nào (kể cả lần đầu)', () => thu(() => {
    const { kiemTruocOv1c } = ov1c;
    conn.prepare('DELETE FROM demo_config WHERE key = ?').run(m13.KHOA_PR_OV1C);
    m13.khoaPrOv1c(conn, []);
    assert(!!one('SELECT 1 x FROM demo_config WHERE key = ?', m13.KHOA_PR_OV1C), 'lần đầu ghi khoá');
    /* Case theo luật CŨ (sinh từ điểm đầu, chưa nguyên nhân, lượt chưa chốt) — đúng loại prOv1c đóng nếu còn chạy. */
    dung(luot);
    diem(luot, 'listening', 5);
    const c = caseKn(luot, 'listening');
    conn.prepare('UPDATE sos_cases SET tam = 0 WHERE id = ?').run(c.id);
    conn.prepare('DELETE FROM case_issues WHERE case_id = ?').run(c.id);
    xoaNho();
    assert(kiemTruocOv1c(conn).some((d: any) => d.caseId === c.id), 'Case dựng phải thuộc loại prOv1c đóng');
    conn.prepare('DELETE FROM demo_config WHERE key = ?').run(m13.KHOA_PR_OV1C);   // DB cũ chưa khoá: bước vẫn chỉ ghi khoá
    m13.khoaPrOv1c(conn, []);
    assert(one('SELECT status FROM sos_cases WHERE id = ?', c.id).status !== 'done', 'prOv1c không chạy — Case giữ');
  }));

  check('OV13a-12 · rà #406 (1): kiem-truoc-ov13a CHỈ ĐỌC chạy được trên DB CHƯA migrate (chưa có cột sos_cases.tam)', () => thu(() => {
    dung(luot);
    diem(luot, 'listening', 5);
    for (const c of caseEm(luot)) cases.xoaCaseHeThong(conn, c.id, null, 'phép kiểm');
    conn.prepare(`UPDATE case_signals SET status = 'withdrawn' WHERE attempt_id = ?`).run(luot);
    conn.exec('ALTER TABLE sos_cases DROP COLUMN tam');
    xoaNho();
    const r = loiCua(() => m13.kiemTruocOv13a(conn));
    assert(r === null, `kiem-truoc sập trên DB cũ: ${r?.message}`);
    assert(m13.kiemTruocOv13a(conn).caseTam.includes(`${luot}:listening`), '(e) vẫn đếm Case tạm sẽ sinh');
  }));

  /* Rà #406 (2): Case tạm KHÔNG vào bất kỳ số đếm nào — cùng DB, cùng điểm, có / không Case tạm → mọi trang số liệu trả JSON giống hệt.
     Qua HTTP như bản chính (không bọc giao dịch: mỗi request tự xong) — dựng rồi dọn ở cuối. */
  await checkAsync('OV13a-11 · Case tạm không vào số đếm: Tổng quan, metrics, Tổng hợp, Học viên & Lớp, hồ sơ lớp, Danh sách Case, hồ sơ GV, Công việc — có / không Case tạm như nhau', async () => {
    const cu = getConfig('demo_date');
    const may = createApp().listen(0);
    const cong = (may.address() as any).port as number;
    const phien = new Map<number, string>();
    const goi = async (userId: number, url: string) => {
      if (!phien.has(userId)) {
        const r = await fetch(`http://127.0.0.1:${cong}/api/demo/session`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ userId }) });
        phien.set(userId, (r.headers.get('set-cookie') ?? '').split(';')[0]);
      }
      const r = await fetch(`http://127.0.0.1:${cong}/api${url}`, { headers: { cookie: phien.get(userId)! } });
      return `${r.status} ${await r.text()}`;
    };
    const gv = GVCN.userId;
    const DS: [number, string][] = [
      ...['/metrics/case-mo', '/metrics/hv-co-case-mo', '/metrics/case-thieu-pa', '/metrics/case-cho-xac-dinh-nguyen-nhan', '/metrics/case-chua-co-nguoi-phu-trach',
        '/tong-quan/quan-ly', '/tong-quan/chi-nhanh', '/tong-quan/chi-nhanh/o?cot=caseMo&khoa=tong', '/phan-tich/tong-hop?ct=ft',
        '/hoc-vien-lop', '/hoc-vien-lop?goc=sos', `/classes/${lop}/overview`, `/classes/${lop}/can-ho-tro`, `/cases?classId=${lop}`, '/cases',
        `/giao-vien/${gv}`, `/giao-vien/${gv}/o?cot=case-mo`, '/giao-vien', '/my-work?nguoi=tat-ca'].map((u) => [QL.userId, u] as [number, string]),
      ...['/my-work', '/tong-quan/lop-toi-day?ct=ft', '/hoc-vien-lop', `/classes/${lop}/overview`].map((u) => [gv, u] as [number, string]),
    ];
    const chup = async () => { xoaNho(); const out: string[] = []; for (const [u, url] of DS) out.push(await goi(u, url)); return out; };
    try {
      setConfig('demo_date', TRONG); xoaNho();
      dung(luot);
      diem(luot, 'listening', 5); diem(luot, 'speaking', 5.5);
      const tam = caseEm(luot).filter((c) => c.tam === 1);
      assert(tam.length === 2, `phải có 2 Case tạm: ${tam.length}`);
      await chup();   // lần đọc đầu có thể quét / điền (thẻ Chờ duyệt, mốc) — so từ lần đọc thứ hai
      const co = await chup();
      /* Cùng điểm, bỏ Case tạm (như chưa từng sinh). */
      for (const c of tam) cases.xoaCaseHeThong(conn, c.id, null, 'phép kiểm');
      conn.prepare(`UPDATE case_signals SET status = 'withdrawn' WHERE attempt_id = ?`).run(luot);
      const khong = await chup();
      const lech = DS.filter((_, i) => co[i] !== khong[i]).map(([u, url]) => `${u === gv ? 'GVCN' : 'QL'} ${url}`);
      const khacDau = (x: string, y: string) => { let i = 0; while (i < x.length && x[i] === y[i]) i++; return `${x.slice(Math.max(0, i - 120), i + 80)} ⇒ ${y.slice(Math.max(0, i - 120), i + 80)}`; };
      assert(!lech.length, `số đổi khi có Case tạm: ${lech.join(' · ')} — ${DS.map((_, i) => i).filter((i) => co[i] !== khong[i]).map((i) => khacDau(co[i], khong[i])).join(' ‖ ')}`);
      assert(co.every((x) => x.startsWith('200 ')), `mọi trang 200: ${DS.filter((_, i) => !co[i].startsWith('200 ')).map(([, u]) => u).join(', ')}`);
    } finally {
      may.close(); dung(luot); setConfig('demo_date', cu); xoaNho();
    }
  });
}
