/**
 * PHÉP KIỂM SOS-TAM-PA (chủ SP 11/11, spec `docs/superpowers/specs/2026-11-11-sos-tam-pa-design.md`; PTA chốt Q1–Q8 theo khuyến nghị):
 *  · SOS tạm: Case tạm cho mọi kỹ năng dưới kỳ vọng có điểm (kể cả chưa nhận xét) · GV ghi mô tả + thêm PA, không hạn ghi kết quả, không việc.
 *  · Lượt chốt: PA GV cùng loại PA quy chế → mang dấu quy chế, không PA mới, không việc · khác loại → "Chọn PA" (Theo PA quy chế / Giữ PA của tôi → QL 3 ngày).
 *  · Mất SOS khi tạm: có PA → Case thường + mốc · chỉ mô tả riêng → đóng · còn lại xoá. Mức SOS đổi → PA quy chế trùng PA GV → hết Chọn PA. Migrate prSosTamPa.
 * Mỗi ca dựng trong một giao dịch rồi cuộn lại (`thu`) — cùng cách dựng lượt sạch như prOv13a.
 */
import type { YThucTestKit } from './yThuc.tests.ts';
import { tieuChiThu } from '../seed/tieuChiThu.ts';
import { duXacNhan } from './luotThu.ts';
import { emailThu } from '../seed/emailThu.ts';

export async function runPrSosTamPaTests(t: YThucTestKit) {
  const { check, assert, conn, P, classId, TODAY } = t;
  const attempts: any = await import('../fasttrack/attempts.ts');
  const skillSchedule: any = await import('../fasttrack/skillSchedule.ts');
  const sosAuto: any = await import('../cases/sosAuto.ts');
  const cases: any = await import('../cases/cases.ts');
  const mywork: any = await import('../worklist/mywork.ts');
  const intake: any = await import('../classes/intake.ts');
  const week: any = await import('../platform/week.ts');
  const yeuCau: any = await import('../duyet/yeuCau.ts');
  const dm: any = await import('../../../shared/domain/index.ts');
  const mig: any = await import('../migrate/prSosTamPa.ts');
  const { soCauSql, xoaNho } = await import('../platform/nguCanhRequest.ts');
  const { TRAN_GHI_LO } = await import('./tocDoDuong.ts');
  console.log('\nSOS-TAM-PA · SOS tạm ghi mô tả + PA · PA GV ↔ PA quy chế lúc chốt · Chọn PA · thẻ QL 3 ngày');

  const thu = <T>(fn: () => T): T => {
    conn.exec('BEGIN IMMEDIATE');
    try { xoaNho(); return fn(); } finally { conn.exec('ROLLBACK'); xoaNho(); }
  };
  const all = (sql: string, ...a: unknown[]) => conn.prepare(sql).all(...a) as any[];
  const one = (sql: string, ...a: unknown[]) => all(sql, ...a)[0];
  const loiCua = (fn: () => unknown): any => { try { fn(); return null; } catch (e) { return e; } };

  const lop = classId('MB FT 101');
  const QL = P.mbManager;
  const WS = '2026-11-02', WS1 = '2026-11-09';
  const TRONG = '2026-11-04', BU = '2026-11-11';
  const W = week.ensurePeriod(WS).id as number, W1 = week.ensurePeriod(WS1).id as number;
  week.ensurePeriod('2026-11-16');
  const sid = (intake.commitIntake(P.admin, { classId: lop, rows: [{ fullName: 'SOS tạm PA Em', target: 7, email: emailThu(), dob: '2010-01-01' }],
    idempotencyKey: 'sos-tam-pa-em' }).studentIds[0]) as number;
  const luotEm = all(`SELECT id FROM assessment_attempts WHERE student_id = ? AND kind = 'mock' ORDER BY attempt_no`, sid).map((r) => r.id as number);
  const luot = luotEm[luotEm.length - 1], truoc = luotEm[luotEm.length - 2];

  /** Lượt sạch ở tuần W (W1 khi `luotSau`), kỳ vọng 6.5; em không còn Case / tín hiệu / điểm khác — như prOv13a. */
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
      : s === 'listening' || s === 'reading' ? { band } : { criteria: tieuChiThu(band) };
    const nx = o.nx === undefined ? NX(s) : o.nx;
    return attempts.saveScore(QL, aid, s, { ...so, ...(nx !== null && band !== null ? { nhanXet: nx } : {}),
      ...(band !== null && band < 6.5 && nx !== null ? { nhomNguyenNhan: nhom(s) } : {}) }, o.today ?? TRONG);
  };
  /** Chốt lượt: R / W1 / W2 đạt, S (`s`) — với L = 3 (gọi trước): Overall 6.0 < 6.5, SOS 1 chỉ L. */
  const chot = (aid: number, s = 7, today = TRONG) => {
    diem(aid, 'reading', 7, { today }); diem(aid, 'writing1', 7, { today }); diem(aid, 'writing2', 7, { today }); diem(aid, 'speaking', s, { today });
  };
  const caseKn = (aid: number, kn: string) => all(`SELECT * FROM sos_cases WHERE student_id = (SELECT student_id FROM assessment_attempts WHERE id = ?)
      AND status != 'done' AND topic = ? ORDER BY id`, aid, kn)[0] ?? null;
  const paCua = (caseId: number) => all('SELECT * FROM case_interventions WHERE case_id = ? ORDER BY id', caseId);
  const viecCua = (p: any, caseId: number) => mywork.myWork(p, { nguoi: 'tat-ca' }).items.filter((it: any) => it.caseId === caseId);
  const quyChe = (aid: number, sos: number) => sosAuto.presetFor(one('SELECT * FROM assessment_attempts WHERE id = ?', aid), sos);
  const khacLoai = (kind: string) => (kind === 'tutor' ? 'self_study' : 'tutor');
  const themPa = (caseId: number, kind: string) => {
    cases.recordIntervention(QL, caseId, { kind, description: `PA của GV · ${kind} · theo dõi hằng tuần`, status: 'started', performerSelf: true,
      ...(kind === 'tutor' || kind === 'self_study' ? { soBuoi: 4 } : {}) });
    xoaNho();
    return paCua(caseId).filter((x) => x.preset === 0).at(-1);
  };
  const theCho = (qId: number) => one(`SELECT * FROM yeu_cau_duyet WHERE loai = 'giu_pa_gv' AND doi_tuong_id = ? ORDER BY id DESC`, qId);
  /** Lượt `luot` chốt SOS 1 (L) với PA GV loại `kind` ghi lúc SOS tạm. Trả Case, PA GV, PA quy chế chờ (nếu có). */
  const chotVoiPaGv = (kind: (pqc: string) => string) => {
    dung(luot);
    diem(luot, 'listening', 3);
    const c = caseKn(luot, 'listening');
    const g = themPa(c.id, kind(quyChe(luot, 1).kind));
    chot(luot);
    xoaNho();
    const q = paCua(c.id).find((x) => x.preset === 1 && !x.confirmed_at && x.status === 'planned') ?? null;
    return { c: one('SELECT * FROM sos_cases WHERE id = ?', c.id), g: one('SELECT * FROM case_interventions WHERE id = ?', g.id), q };
  };

  check('STP-1 · SOS tạm, ô dưới kỳ vọng CHƯA nhận xét → vẫn có Case tạm (chưa mô tả, không việc); GV ghi mô tả thẳng → mô tả riêng', () => thu(() => {
    dung(luot);
    diem(luot, 'listening', 5, { nx: null });
    const c = caseKn(luot, 'listening');
    assert(!!c && c.tam === 1, `phải có Case tạm L khi chưa nhận xét: ${JSON.stringify(c)}`);
    assert(!one(`SELECT 1 x FROM case_issues WHERE case_id = ? AND role = 'primary'`, c.id), 'chưa nhận xét → chưa mô tả');
    for (const who of [QL, P.lrTeacher, P.coreTeacher]) assert(!viecCua(who, c.id).length, `không việc: ${viecCua(who, c.id).map((x: any) => x.tieuDe)}`);
    cases.suaCase(QL, c.id, { observation: 'Nghe chậm, bỏ sót số liệu ở Part 2 và Part 3.', nhom: nhom('listening') });
    const ci = one(`SELECT * FROM case_issues WHERE case_id = ? AND role = 'primary'`, c.id);
    assert(ci?.observation?.startsWith('Nghe chậm') && ci.created_by === QL.userId, `mô tả GV ghi: ${JSON.stringify(ci)}`);
    assert(one('SELECT tam FROM sos_cases WHERE id = ?', c.id).tam === 1, 'vẫn tạm');
  }));

  check('STP-2 · Case tạm thêm PA được: không hạn ghi kết quả, không việc Ghi kết quả; caseDetail cho "+ Thêm PA"', () => thu(() => {
    dung(luot);
    diem(luot, 'listening', 5);
    const c = caseKn(luot, 'listening');
    const g = themPa(c.id, 'teaching_adjust');
    assert(!!g && g.status === 'started' && g.action_due === null, `PA chạy, không hạn: ${JSON.stringify(g && { st: g.status, han: g.action_due })}`);
    assert(!viecCua(QL, c.id).length, `không việc: ${viecCua(QL, c.id).map((x: any) => x.tieuDe)}`);
    cases.updateResult(QL, g.id, { outcome: 'partial', note: 'Em làm đủ bài nghe, còn sai Part 3.' });
    xoaNho();
    assert(one('SELECT action_due FROM case_interventions WHERE id = ?', g.id).action_due === null, 'ghi kết quả kỳ sau vẫn không hạn khi còn tạm');
    assert(one('SELECT tam FROM sos_cases WHERE id = ?', c.id).tam === 1, 'vẫn tạm');
  }));

  check('STP-3 · chốt: PA GV CÙNG loại PA quy chế → mang dấu quy chế, không PA mới, không việc Xác nhận / Chọn PA; hạn ghi kết quả từ ngày chốt', () => thu(() => {
    const { c, g, q } = chotVoiPaGv((k) => k);
    assert(c.tam === 0, 'hết tạm');
    assert(!q && paCua(c.id).filter((x) => x.preset === 1).length === 1, `không PA quy chế mới: ${paCua(c.id).map((x) => `${x.id}:${x.preset}:${x.status}`)}`);
    assert(g.preset === 1 && !!g.confirmed_at && g.moc_quy_che === quyChe(luot, 1).span, `PA GV mang dấu quy chế: ${g.preset} · ${g.confirmed_at} · ${g.moc_quy_che}`);
    assert(g.status === 'started' && !!g.action_due, `PA GV chạy, có hạn ghi kết quả: ${g.status} · ${g.action_due}`);
    assert(g.description.startsWith('PA của GV'), 'nội dung PA GV giữ');
    assert(!viecCua(QL, c.id).some((x: any) => x.group === 'xac_nhan_pa'), 'không việc Xác nhận PA / Chọn PA');
  }));

  check('STP-4 · chốt: PA GV KHÁC loại → PA quy chế chờ + việc "Chọn PA" (không gộp); "Theo PA quy chế" → PA GV "Được thay thế"; Hoàn tác trả cả hai', () => thu(() => {
    const { c, g, q } = chotVoiPaGv(khacLoai);
    assert(!!q, 'có PA quy chế chờ');
    const v = viecCua(QL, c.id).find((x: any) => x.group === 'xac_nhan_pa');
    assert(v?.actionLabel === 'Chọn PA' && /^Chọn PA/.test(v.tieuDe) && v.chonPa === true, `việc Chọn PA: ${v?.actionLabel} · ${v?.tieuDe}`);
    assert(dm.khoaGopCua({ ...v, khung: 'ft' }) === null, 'Chọn PA không gộp');
    const ct = cases.caseDetail(QL, c.id);
    assert(ct.interventions.find((x: any) => x.id === q.id).chonPa?.[0]?.id === g.id, 'caseDetail: PA quy chế có chonPa → PA GV');
    const lo = sosAuto.xacNhanPaNhieu(QL, { chung: { description: 'Theo đề cương, GV kiểm tra hằng tuần và ghi chú tiến bộ.' }, ds: [{ id: q.id }] });
    assert(!lo.ok.length && lo.loi[0]?.ma === 409, `lô không chọn thay GV: ${JSON.stringify(lo)}`);
    sosAuto.xacNhanPaQuyChe(QL, q.id, duXacNhan(conn, q.id, { description: 'Theo đề cương, GV kiểm tra hằng tuần và ghi chú tiến bộ.' }));
    xoaNho();
    let gg = one('SELECT * FROM case_interventions WHERE id = ?', g.id);
    assert(gg.status === 'completed' && gg.closed_reason === 'superseded' && gg.superseded_by === q.id, `PA GV được thay thế: ${gg.status} · ${gg.closed_reason} · ${gg.superseded_by}`);
    assert(one('SELECT status FROM case_interventions WHERE id = ?', q.id).status === 'started', 'PA quy chế chạy');
    sosAuto.hoanTacXacNhanPa(QL, q.id);
    xoaNho();
    gg = one('SELECT * FROM case_interventions WHERE id = ?', g.id);
    assert(gg.status === 'started' && gg.closed_reason === null && gg.superseded_by === null, `Hoàn tác trả PA GV: ${gg.status} · ${gg.closed_reason}`);
    assert(one('SELECT status FROM case_interventions WHERE id = ?', q.id).status === 'planned', 'PA quy chế về chờ');
  }));

  check('STP-5 · "Giữ PA của tôi" → thẻ QL hạn ngày gửi + 3, PA quy chế chờ duyệt (hết việc), PA GV chạy; Rút → về Chọn PA', () => thu(() => {
    const { c, g, q } = chotVoiPaGv(khacLoai);
    /* GD-3 (N35): lý do quá 300 ký tự → 400, không cắt lặng, không tạo thẻ. */
    assert(loiCua(() => sosAuto.giuPaGv(QL, q.id, { lyDo: 'x'.repeat(301) }))?.status === 400 && !theCho(q.id), 'lý do > 300 ký tự → 400, không thẻ');
    const ct = sosAuto.giuPaGv(QL, q.id, {});
    const y = theCho(q.id);
    assert(y?.trang_thai === 'cho' && y.han_duyet === t.addDays(TODAY, 3), `thẻ chờ, hạn +3: ${y?.trang_thai} · ${y?.han_duyet}`);
    assert(ct.interventions.find((x: any) => x.id === q.id).doiPa?.giuPaGv === true, 'PA quy chế hiện "Chờ duyệt đổi PA" (giữ PA GV)');
    assert(!viecCua(QL, c.id).some((x: any) => x.group === 'xac_nhan_pa'), 'hết việc Chọn PA khi chờ QL');
    assert(one('SELECT status FROM case_interventions WHERE id = ?', g.id).status === 'started', 'PA GV vẫn chạy');
    assert(loiCua(() => sosAuto.giuPaGv(QL, q.id, {}))?.status === 400, 'gửi lại khi đang chờ → 400');
    yeuCau.rutYeuCau(QL, y.id);
    xoaNho();
    assert(one('SELECT superseded_by FROM case_interventions WHERE id = ?', q.id).superseded_by === null, 'Rút → PA quy chế về chờ chọn');
    assert(viecCua(QL, c.id).some((x: any) => x.actionLabel === 'Chọn PA'), 'Rút → việc Chọn PA quay lại');
  }));

  check('STP-6 · QL Duyệt → PA quy chế "Đổi PA", PA GV giữ · QL Không duyệt → PA quy chế chạy ngay, PA GV dừng · Huỷ quyết định trả lại', () => thu(() => {
    const { g, q } = chotVoiPaGv(khacLoai);
    const GV = P.lrTeacher;
    sosAuto.giuPaGv(QL, q.id, { lyDo: 'Em hợp điều chỉnh dạy hơn Tutor.' });
    let y = theCho(q.id);
    assert(y.ly_do === 'Em hợp điều chỉnh dạy hơn Tutor.', `GD-3: thẻ lưu lý do: ${y.ly_do}`);
    const kq = yeuCau.duyetYeuCau(P.admin, y.id, {});
    xoaNho();
    let qq = one('SELECT * FROM case_interventions WHERE id = ?', q.id);
    assert(qq.status === 'completed' && qq.closed_reason === 'doi_pa', `Duyệt → PA quy chế Đổi PA: ${qq.status} · ${qq.closed_reason}`);
    assert(one('SELECT status FROM case_interventions WHERE id = ?', g.id).status === 'started', 'PA GV giữ');
    if (kq.coTheHuy) {
      yeuCau.huyQuyetDinh(P.admin, y.id);
      xoaNho();
      qq = one('SELECT * FROM case_interventions WHERE id = ?', q.id);
      assert(qq.status === 'planned' && qq.closed_reason === null, `Huỷ quyết định trả PA quy chế: ${qq.status} · ${qq.closed_reason}`);
    } else {
      conn.prepare(`UPDATE case_interventions SET status = 'planned', completed_date = NULL, closed_reason = NULL WHERE id = ?`).run(q.id);
      conn.prepare(`UPDATE yeu_cau_duyet SET trang_thai = 'cho' WHERE id = ?`).run(y.id);
    }
    y = theCho(q.id);
    assert(y.trang_thai === 'cho', 'thẻ chờ lại');
    yeuCau.tuChoiYeuCau(P.admin, y.id, 'Theo quy chế, SOS này cần Tutor.');
    xoaNho();
    qq = one('SELECT * FROM case_interventions WHERE id = ?', q.id);
    assert(qq.status === 'started' && !!qq.confirmed_at && qq.started_date === TODAY && !!qq.action_due, `Không duyệt → PA quy chế chạy: ${qq.status} · ${qq.started_date}`);
    const gg = one('SELECT * FROM case_interventions WHERE id = ?', g.id);
    assert(gg.status === 'completed' && gg.closed_reason === 'superseded' && gg.superseded_by === q.id, `PA GV dừng: ${gg.status} · ${gg.closed_reason}`);
    void GV;
  }));

  check('STP-7 · quá 3 ngày QL chưa trả lời → máy chốt theo PA GV (thẻ tự đóng, PA quy chế "Đổi PA"); trước hạn không đổi', () => thu(() => {
    const { g, q } = chotVoiPaGv(khacLoai);
    sosAuto.giuPaGv(QL, q.id, {});
    const y = theCho(q.id);
    sosAuto.quetGiuPaGv(conn, y.han_duyet);
    assert(theCho(q.id).trang_thai === 'cho', 'đúng ngày hạn: chưa chốt');
    const n = sosAuto.quetGiuPaGv(conn, t.addDays(y.han_duyet, 1));
    xoaNho();
    assert(n === 1 && theCho(q.id).trang_thai === 'tu_dong', `quá hạn → tự đóng: ${n} · ${theCho(q.id).trang_thai}`);
    const qq = one('SELECT * FROM case_interventions WHERE id = ?', q.id);
    assert(qq.status === 'completed' && qq.closed_reason === 'doi_pa', `PA quy chế Đổi PA: ${qq.status} · ${qq.closed_reason}`);
    assert(one('SELECT status FROM case_interventions WHERE id = ?', g.id).status === 'started', 'PA GV giữ');
  }));

  check('STP-8 · mất SOS khi tạm: Case tạm có PA → Case thường + mốc (không xoá) · chỉ mô tả riêng → đóng · theo nhận xét → xoá', () => thu(() => {
    dung(luot);
    diem(luot, 'listening', 5); diem(luot, 'reading', 5); diem(luot, 'speaking', 5.5);
    const cL = caseKn(luot, 'listening'), cR = caseKn(luot, 'reading'), cS = caseKn(luot, 'speaking');
    const g = themPa(cL.id, 'teaching_adjust');
    cases.suaCase(QL, cR.id, { observation: 'Đọc chậm, đoán nghĩa từ mới yếu ở Part 3.', nhom: nhom('reading') });
    diem(luot, 'listening', 7); diem(luot, 'reading', 7); diem(luot, 'speaking', 7);
    xoaNho();
    const l = one('SELECT * FROM sos_cases WHERE id = ?', cL.id);
    assert(l && l.tam === 0 && l.status !== 'done', `Case có PA giữ, thành Case thường: ${JSON.stringify(l && { tam: l.tam, st: l.status })}`);
    assert(one(`SELECT COUNT(*) n FROM case_milestones WHERE case_id = ? AND kind = 'overall_dat'`, cL.id).n === 1, 'mốc "Không còn SOS"');
    assert(!!one('SELECT action_due FROM case_interventions WHERE id = ?', g.id).action_due, 'PA GV có hạn ghi kết quả từ hôm nay');
    const r = one('SELECT * FROM sos_cases WHERE id = ?', cR.id);
    assert(r?.status === 'done' && r.tam === 0, `chỉ mô tả riêng → đóng: ${JSON.stringify(r && { st: r.status })}`);
    assert(!one('SELECT 1 x FROM sos_cases WHERE id = ?', cS.id), 'theo nhận xét, không PA → xoá');
  }));

  check('STP-9 · trượt lại (K3-16) vào Case thật: PA GV cùng loại PA quy chế mới → không PA mới, không việc', () => thu(() => {
    dung(truoc);
    diem(truoc, 'listening', 3); chot(truoc);
    const c = caseKn(truoc, 'listening');
    const q1 = paCua(c.id).find((x) => x.preset === 1);
    sosAuto.xacNhanPaQuyChe(QL, q1.id, duXacNhan(conn, q1.id, { description: 'Theo đề cương, GV kiểm tra hằng tuần và ghi chú tiến bộ.' }));
    xoaNho();
    const kMoi = quyChe(luot, 1).kind;
    const g = themPa(c.id, kMoi === q1.kind ? 'teaching_adjust' : kMoi);
    assert(kMoi !== q1.kind, `tiền đề: PA quy chế MT sau (${kMoi}) khác MT trước (${q1.kind}) — đổi lượt dựng nếu bảng quy chế đổi`);
    dung(luot, true);
    diem(luot, 'listening', 3, { today: BU }); chot(luot, 7, BU);
    xoaNho();
    const moi = paCua(c.id).filter((x) => x.preset === 1 && !x.confirmed_at && x.status === 'planned');
    assert(!moi.length, `không PA quy chế chờ mới: ${moi.map((x) => x.id)}`);
    const gg = one('SELECT * FROM case_interventions WHERE id = ?', g.id);
    assert(gg.preset === 1 && !!gg.confirmed_at, 'PA GV mang dấu quy chế');
  }));

  check('STP-10 · mức SOS đổi sau chốt: PA quy chế chờ đổi loại thành trùng PA GV → PA quy chế chờ huỷ, PA GV mang dấu, hết Chọn PA', () => thu(() => {
    dung(truoc);
    diem(truoc, 'listening', 3);
    const c = caseKn(truoc, 'listening');
    const k1 = quyChe(truoc, 1).kind, k3 = quyChe(truoc, 3).kind;
    assert(k1 !== k3, `tiền đề: PA quy chế SOS 1 (${k1}) khác SOS 3 (${k3}) — đổi lượt dựng nếu bảng quy chế đổi`);
    const g = themPa(c.id, k3);
    chot(truoc);
    xoaNho();
    const q = paCua(c.id).find((x) => x.preset === 1 && x.status === 'planned');
    assert(!!q && q.kind === k1, `SOS 1 → PA quy chế ${k1} chờ (Chọn PA)`);
    diem(truoc, 'reading', 5); diem(truoc, 'speaking', 5);   // ba kỹ năng dưới → SOS 3
    xoaNho();
    assert(one('SELECT status FROM case_interventions WHERE id = ?', q.id).status === 'cancelled', `PA quy chế chờ huỷ: ${JSON.stringify(paCua(c.id).map((x) => [x.id, x.kind, x.preset, x.status, x.confirmed_at]))} · SOS ${attempts.resultOf(one('SELECT * FROM assessment_attempts WHERE id = ?', truoc)).sosLevel} · G ${g.id}`);
    assert(one('SELECT preset FROM case_interventions WHERE id = ?', g.id).preset === 1, 'PA GV mang dấu quy chế');
    assert(!viecCua(QL, c.id).some((x: any) => x.group === 'xac_nhan_pa'), 'hết việc Chọn PA');
    mig.khoiPhucSosTamPa(conn);
    xoaNho();
    assert(one('SELECT status FROM case_interventions WHERE id = ?', q.id).status === 'planned' && one('SELECT preset FROM case_interventions WHERE id = ?', g.id).preset === 0,
      'khôi phục được (nhật ký pa_quy_che_trung_gv)');
  }));

  check('STP-11 · migrate prSosTamPa: Case cũ PA quy chế chờ + PA GV cùng loại → gắn dấu, huỷ PA chờ; khác loại chỉ đếm; lần 2 không đổi; khôi phục trả lại', () => thu(() => {
    dung(luot);
    diem(luot, 'listening', 5, { nx: null }); diem(luot, 'speaking', 5.5);
    chot(luot, 5.5);
    xoaNho();
    const cL = caseKn(luot, 'listening'), cS = caseKn(luot, 'speaking');
    const qL = paCua(cL.id).find((x) => x.preset === 1 && x.status === 'planned'), qS = paCua(cS.id).find((x) => x.preset === 1 && x.status === 'planned');
    /* Dựng như dữ liệu cũ: PA GV thêm SAU khi chốt (luật cũ) — L cùng loại, S khác loại. */
    const insG = (caseId: number, kind: string) => Number(conn.prepare(`INSERT INTO case_interventions (case_id, kind, description, status, preset, recorded_by, started_date, cycle_started_on, created_at)
        VALUES (?, ?, 'PA GV cũ · thêm sau chốt · theo dõi', 'started', 0, ?, ?, ?, ?)`).run(caseId, kind, QL.userId, TODAY, TODAY, new Date().toISOString()).lastInsertRowid);
    const gL = insG(cL.id, qL.kind), gS = insG(cS.id, khacLoai(qS.kind));
    void gS;
    const k = mig.keHoachSosTamPa(conn);
    assert(k.trung.some((r: any) => r.caseId === cL.id) && k.khac.includes(cS.id), `kế hoạch: ${JSON.stringify(k)}`);
    conn.prepare('DELETE FROM demo_config WHERE key = ?').run(mig.KHOA_PR_SOS_TAM_PA);
    const applied: string[] = [];
    mig.migratePrSosTamPa(conn, applied);
    xoaNho();
    assert(applied.length === 1, `có dòng nhật ký: ${applied}`);
    assert(one('SELECT status FROM case_interventions WHERE id = ?', qL.id).status === 'cancelled', 'PA quy chế chờ huỷ');
    assert(one('SELECT preset FROM case_interventions WHERE id = ?', gL).preset === 1, 'PA GV gắn dấu');
    assert(one('SELECT status FROM case_interventions WHERE id = ?', qS.id).status === 'planned', 'khác loại: không đổi');
    const lan2: string[] = [];
    mig.migratePrSosTamPa(conn, lan2);
    assert(!lan2.length, 'lần 2 không đổi (khoá)');
    mig.khoiPhucSosTamPa(conn);
    xoaNho();
    assert(one('SELECT status FROM case_interventions WHERE id = ?', qL.id).status === 'planned', 'khôi phục: PA quy chế về chờ');
    assert(one('SELECT preset FROM case_interventions WHERE id = ?', gL).preset === 0, 'khôi phục: PA GV bỏ dấu');
  }));

  check(`STP-12 · trần câu SQL: Giữ PA của tôi ≤ ${TRAN_GHI_LO.giuPaGv}`, () => thu(() => {
    const { q } = chotVoiPaGv(khacLoai);
    xoaNho();
    const s0 = soCauSql();
    sosAuto.giuPaGv(QL, q.id, {});
    const n = soCauSql() - s0;
    console.log(`    giữ PA của tôi ${n} câu`);
    assert(n <= TRAN_GHI_LO.giuPaGv, `${n} câu`);
  }));
}
