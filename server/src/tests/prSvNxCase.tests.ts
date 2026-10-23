/**
 * PHÉP KIỂM SV-NX-CASE (plan.md 1.6 N8, chủ SP 23/10) — BẢNG TÌNH HUỐNG, mỗi dòng một phép kiểm (gọi hàm dịch vụ, mỗi ca cuộn lại — `thu`):
 *  NX1  MT mới nhất của em: ô có điểm thiếu nhận xét → nhắc
 *  NX2  MT trước (đã có MT sau có band): không nhắc, chip nhóm vẫn có (`coNhom`)
 *  NX3  MT mới nhất ≥ 2 tuần (`lich_su`): vẫn nhắc
 *  NX4  Case chưa mô tả → nhận xét thành mô tả, nguồn = lượt của ô
 *  NX5  Case đã có mô tả (theo MT1) → nhận xét MT sau không đè
 *  NX6  sửa nhận xét TRƯỚC khi sửa mô tả → mô tả đi theo
 *  NX7  sửa mô tả riêng ở Case → sửa nhận xét SAU đó không đè; lịch sử `mo_ta_nguon`
 *  NX8  Case MT chưa mô tả, QUÁ HẠN SOS → vẫn việc "Ghi nhận xét"; GV ghi mô tả + nhóm ở Case → hết việc
 *  NX9  S chấm chéo, người lưu = GV phụ trách S → mô tả ngay, không việc
 *  NX10 S chấm chéo, người lưu khác → không mô tả; việc "Xác nhận Case" (hạn = hạn SOS, không trùng "Ghi nhận xét"); dùng nhận xét → mô tả, việc hết
 *  NX11 S chấm chéo khác người → viết mô tả khác (tách khỏi nhận xét); người chấm chéo 403; Nhận xét GV phụ trách không làm hết việc
 *  NX12 SOS tạm (lượt chưa chốt): Case tạm không hạn, không việc Xác nhận Case
 *  NX13 Overall đạt → Case chưa xử lý tự mất
 *  NX14 migrate: Case mô tả từ nhận xét gắn nguồn (nội dung giữ), cờ S đã hết việc hạ, lần hai không đổi; kiểm trước không ghi
 *  NX16 Sửa Case MT chưa mô tả chỉ đổi tên / mức độ → lưu (không đòi mô tả); `luc` cũ → 409, không ghi; mô tả > 1000 → 400; lượt nguồn mất → không "MT?"
 *  NX15 migrate: Case đã trượt sang MT2 mà mô tả là nhận xét MT1 → nguồn MT1 (nhận xét MT2 không đè); mô tả không trùng nhận xét nào → NULL, không bị đè
 */
import type { YThucTestKit } from './yThuc.tests.ts';
import { emailThu } from '../seed/emailThu.ts';

export async function runPrSvNxCaseTests(t: YThucTestKit) {
  const { check, assert, conn, P, TODAY, classId, addDays } = t;
  const d: any = await import('../../../shared/domain/index.ts');
  const intake: any = await import('../classes/intake.ts');
  const week: any = await import('../platform/week.ts');
  const skillSch: any = await import('../fasttrack/skillSchedule.ts');
  const svc: any = await import('../fasttrack/attempts.ts');
  const cases: any = await import('../cases/cases.ts');
  const mywork: any = await import('../worklist/mywork.ts');
  const mig: any = await import('../migrate/prSvNxCase.ts');
  const { loadPrincipal, lopFtChoGvSpeaking } = await import('../permissions.ts');
  const { phanCongDangHieuLuc } = await import('../worklist/scoreDebt.ts');
  const { xoaNho } = await import('../platform/nguCanhRequest.ts');
  console.log('\nSV-NX-CASE · MT mới nhất nhắc nhận xét · mô tả Case theo nhận xét · Xác nhận Case S chấm chéo');

  const all = (sql: string, ...a: unknown[]) => conn.prepare(sql).all(...a) as any[];
  const one = (sql: string, ...a: unknown[]) => all(sql, ...a)[0];
  const run = (sql: string, ...a: unknown[]) => conn.prepare(sql).run(...a);
  const QL = P.mbManager;
  const LOP = classId('MB FT 101');
  const MB = one('SELECT branch_id FROM classes WHERE id = ?', LOP).branch_id as number;
  const tuanNay = week.mondayOf(TODAY);
  const thu = <T>(fn: () => T): T => {
    conn.exec('BEGIN IMMEDIATE');
    try { xoaNho(); return fn(); } finally { conn.exec('ROLLBACK'); xoaNho(); }
  };
  /** Trong ca: GV phụ trách S của lớp (phân công tạm nếu phép kiểm trước đã gỡ) + một người chấm chéo cùng chi nhánh. */
  const nguoiS = () => {
    let gvPT = phanCongDangHieuLuc([LOP], TODAY).get(`${LOP}|speaking`)?.userId as number | undefined;
    if (!gvPT) {
      gvPT = one(`SELECT ta.user_id FROM teacher_assignments ta JOIN classes c ON c.id = ta.class_id WHERE ta.skill = 'speaking' AND ta.status = 'active'
          AND c.branch_id = ? ORDER BY ta.id LIMIT 1`, MB).user_id as number;
      run(`INSERT INTO teacher_assignments (user_id, class_id, skill, is_core, effective_from, status, created_at) VALUES (?, ?, 'speaking', 0, '2000-01-01', 'active', ?)`,
        gvPT, LOP, new Date().toISOString());
      xoaNho();
    }
    const gvCheo = all(`SELECT DISTINCT ta.user_id FROM teacher_assignments ta JOIN classes c ON c.id = ta.class_id
        WHERE ta.skill = 'speaking' AND ta.status = 'active' AND c.branch_id = ? AND ta.user_id != ?
          AND ta.user_id NOT IN (SELECT user_id FROM teacher_assignments WHERE class_id = ? AND status = 'active') ORDER BY ta.user_id`, MB, gvPT, LOP)
      .map((r) => r.user_id as number).find((u) => lopFtChoGvSpeaking(loadPrincipal(u), TODAY).includes(LOP));
    assert(gvCheo, 'dữ liệu demo: phải có GV Speaking chi nhánh MB ngoài MB FT 101');
    return { gvPT: loadPrincipal(gvPT), gvCheo: loadPrincipal(gvCheo!) };
  };
  let dem = 0;
  /** Em mới ở MB FT 101 (kỳ vọng 6.5 mọi lượt): MT1 tuần trước, MT2 tuần này, MT3 + 4 tuần; chưa điểm. */
  const emMoi = () => {
    const r = intake.commitIntake(P.admin, { classId: LOP, rows: [{ fullName: `SNC Em ${++dem}`, target: 7, startWeek: tuanNay, email: emailThu(), dob: '2010-01-01' }] });
    assert(r.added === 1, `thêm em: ${JSON.stringify(r.failed)}`);
    const sid = r.studentIds[0] as number;
    const ds = all(`SELECT id, attempt_no FROM assessment_attempts WHERE student_id = ? AND kind = 'mock' AND status != 'cancelled' ORDER BY attempt_no`, sid);
    [-1, 0, 4].forEach((w, i) => {
      const pid = week.ensurePeriod(addDays(tuanNay, 7 * w)).id;
      skillSch.ensureSkillRows(ds[i].id);
      const a = one('SELECT * FROM assessment_attempts WHERE id = ?', ds[i].id);
      run(`UPDATE assessment_attempts SET planned_period_id = ?, plan_source = 'manual', lich_su = 0, target_at_attempt = ? WHERE id = ?`,
        pid, 6.5 + d.expectationDelta(a.attempt_no, svc.routeCuaLuot(a)), ds[i].id);
      run(`UPDATE attempt_skills SET planned_period_id = ?, plan_source = 'manual', sit_status = 'scheduled', required = 1 WHERE attempt_id = ?`, pid, ds[i].id);
    });
    xoaNho();
    return { sid, m1: ds[0].id as number, m2: ds[1].id as number, m3: ds[2].id as number };
  };
  const o = (attemptId: number, skill: string) => svc.attemptDetail(QL, attemptId).cells.find((c: any) => c.skill === skill);
  const NX = { listening: 'Nghe Part 3 còn chậm, sai chính tả tên riêng.', reading: 'Bỏ trống 6 câu cuối Passage 3, hết giờ.', writing1: 'Task 1 thiếu so sánh số liệu chính.',
    writing2: 'Task 2 lập luận chưa rõ, ví dụ chung chung.', speaking: 'Part 2 dừng sau 1 phút, ít từ nối, phát âm đuôi -ed chưa rõ.' } as Record<string, string>;
  const diem = (skill: string, band: number) => (skill === 'listening' || skill === 'reading' ? { band } : { criteria: [band, band, band, band] });
  /** Lượt chốt: L R W1 W2 đúng kỳ vọng (6.5) có nhận xét, S `bandS` (ai lưu S: `nguoiS`, có / không nhận xét). Trả Case S (nếu có). */
  const chot = (aid: number, o2: { bandS: number; nxS?: string | null; nguoiLuuS?: any; gvCham?: any }) => {
    for (const k of ['listening', 'reading', 'writing1', 'writing2']) svc.saveScore(QL, aid, k, { ...diem(k, 6.5), nhanXet: NX[k] }, TODAY);
    svc.saveScore(o2.nguoiLuuS ?? QL, aid, 'speaking', { ...diem('speaking', o2.bandS), ...(o2.nxS ? { nhanXet: o2.nxS } : {}), ...(o2.gvCham ? { gvCham: o2.gvCham } : {}) }, TODAY);
    xoaNho();
    return one(`SELECT * FROM sos_cases WHERE attempt_id = ? AND topic = 'speaking' AND status != 'done'`, aid);
  };
  const moTa = (caseId: number) => one(`SELECT observation, created_by FROM case_issues WHERE case_id = ? AND role = 'primary'`, caseId) ?? null;
  const viec = (p: any, nhom: string, caseId?: number) => (mywork.myWork(p).items as any[]).filter((x) => x.group === nhom && (caseId == null || x.caseId === caseId));

  // ---------------------------------------------------------------- ① MT mới nhất
  check('NX1 · MT mới nhất của em: ô có điểm thiếu nhận xét → nhắc "ghi-nhan-xet"', () => thu(() => {
    const a = emMoi();
    svc.saveScore(QL, a.m1, 'listening', { rawScore: 30 }, TODAY);
    xoaNho();
    const l = o(a.m1, 'listening');
    assert(l.thieuNhanXet === 'ghi-nhan-xet' && l.nenCoNhanXet === true && svc.laMtMoiNhatCuaEm([a.m1]).has(a.m1), JSON.stringify({ t: l.thieuNhanXet, b: l.nenCoNhanXet }));
  }));

  check('NX2 · MT trước (MT sau đã có band): không nhắc nhận xét / nhóm; chip nhóm vẫn có; MT sau nhắc', () => thu(() => {
    const a = emMoi();
    svc.saveScore(QL, a.m1, 'reading', { band: 3 }, TODAY);
    svc.saveScore(QL, a.m2, 'listening', { rawScore: 30 }, TODAY);
    xoaNho();
    const r = o(a.m1, 'reading');
    assert(r.thieuNhanXet === null && r.nenCoNhanXet === false && r.coNhom === true, JSON.stringify({ t: r.thieuNhanXet, b: r.nenCoNhanXet, n: r.coNhom }));
    assert(o(a.m2, 'listening').thieuNhanXet === 'ghi-nhan-xet', 'MT mới nhất phải nhắc');
    const moi = svc.laMtMoiNhatCuaEm([a.m1, a.m2, a.m3]);
    assert(!moi.has(a.m1) && moi.has(a.m2), 'MT1 không còn là mới nhất; MT2 là mới nhất (MT3 chưa band — không có ô để nhắc)');
  }));

  check('NX3 · MT mới nhất ≥ 2 tuần (`lich_su` = 1) vẫn nhắc nhận xét', () => thu(() => {
    const a = emMoi();
    run('UPDATE assessment_attempts SET lich_su = 1 WHERE id = ?', a.m1);
    svc.saveScore(QL, a.m1, 'listening', { rawScore: 30 }, TODAY);
    xoaNho();
    assert(o(a.m1, 'listening').thieuNhanXet === 'ghi-nhan-xet', JSON.stringify(o(a.m1, 'listening').thieuNhanXet));
  }));

  // ---------------------------------------------------------------- ② mô tả Case theo nhận xét
  check('NX4 · Case chưa mô tả ("Chờ ghi nhận xét") → nhận xét kỹ năng thành mô tả, nguồn = lượt của ô, Case sang Chờ xác nhận PA', () => thu(() => {
    const { gvPT } = nguoiS();
    const a = emMoi();
    const c = chot(a.m1, { bandS: 5, nguoiLuuS: gvPT });
    assert(c && !moTa(c.id) && cases.caseDetail(QL, c.id).trangThaiV4.k === 'cho-nhan-xet', `Case S chờ nhận xét: ${JSON.stringify(c && cases.caseDetail(QL, c.id).trangThaiV4)}`);
    svc.saveScore(gvPT, a.m1, 'speaking', { nhanXet: NX.speaking }, TODAY);
    const m = moTa(c.id);
    assert(m?.observation === NX.speaking && m.created_by === null, JSON.stringify(m));
    assert(one('SELECT mo_ta_attempt_id n FROM sos_cases WHERE id = ?', c.id).n === a.m1, 'nguồn mô tả = MT1');
    assert(cases.caseDetail(QL, c.id).issues[0].moTaTuMt === 'MT1', 'chi tiết Case phải nói mô tả theo nhận xét MT1');
  }));

  check('NX5 · Case đã có mô tả (theo nhận xét MT1) → trượt lại MT2, nhận xét MT2 KHÔNG đè mô tả', () => thu(() => {
    const { gvPT } = nguoiS();
    const a = emMoi();
    const c = chot(a.m1, { bandS: 5, nxS: NX.speaking, nguoiLuuS: gvPT });
    assert(moTa(c.id)?.observation === NX.speaking, 'MT1 phải thành mô tả');
    run('UPDATE sos_cases SET attempt_id = ? WHERE id = ?', a.m2, c.id);   // trượt lại: Case theo lượt MT2
    svc.saveScore(gvPT, a.m2, 'speaking', { ...diem('speaking', 5), nhanXet: 'MT2: Part 3 trả lời quá ngắn, chưa mở rộng ý.' }, TODAY);
    assert(moTa(c.id)?.observation === NX.speaking, `mô tả bị đè: ${moTa(c.id)?.observation}`);
  }));

  check('NX6 · sửa nhận xét TRƯỚC khi có người sửa mô tả → mô tả đi theo nhận xét', () => thu(() => {
    const { gvPT } = nguoiS();
    const a = emMoi();
    const c = chot(a.m1, { bandS: 5, nxS: NX.speaking, nguoiLuuS: gvPT });
    svc.saveScore(gvPT, a.m1, 'speaking', { nhanXet: 'Part 2 dừng sớm; cần luyện khung 4 ý.' }, TODAY);
    assert(moTa(c.id)?.observation === 'Part 2 dừng sớm; cần luyện khung 4 ý.', JSON.stringify(moTa(c.id)));
  }));

  check('NX7 · sửa mô tả riêng ở Case → tách hẳn; sửa nhận xét SAU đó không đè; lịch sử `mo_ta_nguon` nhan_xet → sua_rieng', () => thu(() => {
    const { gvPT } = nguoiS();
    const a = emMoi();
    const c = chot(a.m1, { bandS: 5, nxS: NX.speaking, nguoiLuuS: gvPT });
    const chinh = moTa(c.id);
    const code = one(`SELECT taxonomy_code FROM case_issues WHERE case_id = ? AND role = 'primary'`, c.id).taxonomy_code;
    cases.suaCase(gvPT, c.id, { primaryCode: code, observation: 'Em ngại nói, cần luyện Part 1 trước.' });
    assert(moTa(c.id)?.observation === 'Em ngại nói, cần luyện Part 1 trước.' && moTa(c.id)?.created_by === gvPT.userId, JSON.stringify({ truoc: chinh, sau: moTa(c.id) }));
    assert(one(`SELECT COUNT(*) n FROM sos_case_history WHERE case_id = ? AND field = 'mo_ta_nguon' AND new_value = 'sua_rieng'`, c.id).n === 1, 'thiếu lịch sử tách mô tả');
    svc.saveScore(gvPT, a.m1, 'speaking', { nhanXet: 'Nhận xét mới sau khi đã sửa mô tả riêng.' }, TODAY);
    assert(moTa(c.id)?.observation === 'Em ngại nói, cần luyện Part 1 trước.', `mô tả sửa riêng bị đè: ${moTa(c.id)?.observation}`);
    /* Đổi mức độ / tên ở Case MT không gửi mô tả → không tách (Case khác cùng em không có ở đây; kiểm 400 mô tả ngắn). */
    let loi: any = null;
    try { cases.suaCase(gvPT, c.id, { primaryCode: code, observation: 'ngắn' }); } catch (e) { loi = e; }
    assert(loi?.status === 400, `mô tả < 10 ký tự phải 400: ${loi?.status}`);
  }));

  check('NX8 · Case MT chưa mô tả QUÁ HẠN SOS → vẫn việc "Ghi nhận xét" (quá hạn); GV ghi mô tả + nhóm ở Case → hết việc, sang Xác nhận PA', () => thu(() => {
    const { gvPT } = nguoiS();
    const a = emMoi();
    const c = chot(a.m1, { bandS: 5, nguoiLuuS: gvPT });
    run('UPDATE sos_cases SET han_xac_nhan = ? WHERE id = ?', addDays(TODAY, -3), c.id);
    xoaNho();
    const chu = loadPrincipal(one('SELECT owner_user_id u FROM sos_cases WHERE id = ?', c.id).u);
    const v = viec(chu, 'ghi_nhan_xet', c.id);
    assert(v.length === 1 && v[0].urgency === 'overdue', JSON.stringify(v.map((x) => ({ u: x.urgency, due: x.due }))));
    cases.suaCase(chu, c.id, { primaryCode: d.issuesForTopic('speaking')[0].code, observation: 'Em ngại nói, Part 2 dừng sau 1 phút.' });
    xoaNho();
    assert(!viec(chu, 'ghi_nhan_xet', c.id).length && cases.caseDetail(QL, c.id).trangThaiV4.k === 'cho-xac-nhan-pa', JSON.stringify(cases.caseDetail(QL, c.id).trangThaiV4));
  }));

  // ---------------------------------------------------------------- ③ S chấm chéo
  check('NX9 · S chấm chéo, người lưu = GV phụ trách S → nhận xét thành mô tả ngay, không cờ, không việc Xác nhận Case', () => thu(() => {
    const { gvPT } = nguoiS();
    const a = emMoi();
    const c = chot(a.m1, { bandS: 5, nxS: NX.speaking, nguoiLuuS: gvPT });
    assert(moTa(c.id)?.observation === NX.speaking, 'phải thành mô tả ngay');
    assert(o(a.m1, 'speaking') && one(`SELECT cho_phu_trach_xem n FROM assessment_scores WHERE attempt_id = ? AND skill = 'speaking'`, a.m1).n === 0, 'không cờ');
    assert(!viec(gvPT, 'xem_nx_s', c.id).length, 'không việc Xác nhận Case');
  }));

  check('NX10 · S chấm chéo, người lưu khác → không mô tả; việc "Xác nhận Case" của GV phụ trách (hạn = hạn SOS, không trùng "Ghi nhận xét"); dùng nhận xét → mô tả, việc hết', () => thu(() => {
    const { gvPT, gvCheo } = nguoiS();
    const a = emMoi();
    const c = chot(a.m1, { bandS: 5, nxS: NX.speaking, nguoiLuuS: gvCheo });
    assert(!moTa(c.id), `chưa xác nhận mà đã có mô tả: ${JSON.stringify(moTa(c.id))}`);
    const v = viec(gvPT, 'xem_nx_s', c.id);
    const han = one('SELECT han_xac_nhan h FROM sos_cases WHERE id = ?', c.id).h;
    assert(v.length === 1 && v[0].due === han && han && v[0].tieuDe.startsWith('Xác nhận Case Speaking') && v[0].mine, JSON.stringify(v));
    assert(!(mywork.myWork(gvPT).items as any[]).some((x) => x.group === 'ghi_nhan_xet' && x.caseId === c.id), 'trùng việc Ghi nhận xét');
    const ct = cases.caseDetail(gvPT, c.id);
    assert(ct.choXacNhanS?.nhanXet === NX.speaking && ct.choXacNhanS.coTheXacNhan, JSON.stringify(ct.choXacNhanS));
    cases.xacNhanCaseS(gvPT, c.id, { cach: 'dung' });
    xoaNho();
    assert(moTa(c.id)?.observation === NX.speaking && moTa(c.id)?.created_by === null, JSON.stringify(moTa(c.id)));
    assert(!viec(gvPT, 'xem_nx_s', c.id).length && !cases.caseDetail(gvPT, c.id).choXacNhanS, 'việc phải hết');
    const nk = one(`SELECT before_json b, after_json a FROM audit_logs WHERE action = 'case.xac_nhan_s' AND entity_id = ? ORDER BY id DESC LIMIT 1`, c.id);
    assert(nk && Array.isArray(JSON.parse(nk.b).nhom) && JSON.parse(nk.a).nhom.length >= 1, `nhật ký phải ghi nhóm trước / sau: ${JSON.stringify(nk)}`);
    let lan2: any = null;
    try { cases.xacNhanCaseS(gvPT, c.id, { cach: 'viet', moTa: 'Bấm lần hai sau khi đã xác nhận.' }); } catch (e) { lan2 = e; }
    assert(lan2?.status === 400 && moTa(c.id)?.observation === NX.speaking, 'xác nhận lần hai phải 400, không đè');
  }));

  check('NX11 · S chấm chéo khác người → người chấm chéo 403; Nhận xét GV phụ trách KHÔNG làm hết việc; viết mô tả khác → tách khỏi nhận xét', () => thu(() => {
    const { gvPT, gvCheo } = nguoiS();
    const a = emMoi();
    const c = chot(a.m1, { bandS: 5, nxS: NX.speaking, nguoiLuuS: gvCheo });
    let loi: any = null;
    try { cases.xacNhanCaseS(gvCheo, c.id, { cach: 'dung' }); } catch (e) { loi = e; }
    assert(loi?.status === 403, `người chấm chéo phải 403: ${loi?.status}`);
    svc.luuNhanXetPhuTrach(gvPT, a.m1, { nhanXetPhuTrach: 'GV phụ trách: em cần thêm 2 buổi Part 2.' });
    xoaNho();
    assert(viec(gvPT, 'xem_nx_s', c.id).length === 1, 'Nhận xét GV phụ trách không thay Xác nhận Case');
    cases.xacNhanCaseS(gvPT, c.id, { cach: 'viet', moTa: 'Em ngại nói trước lớp, Part 2 dừng sớm.' });
    assert(moTa(c.id)?.observation === 'Em ngại nói trước lớp, Part 2 dừng sớm.' && moTa(c.id)?.created_by === gvPT.userId, JSON.stringify(moTa(c.id)));
    svc.saveScore(gvCheo, a.m1, 'speaking', { nhanXet: 'Người chấm sửa nhận xét sau khi đã xác nhận.' }, TODAY);
    assert(moTa(c.id)?.observation === 'Em ngại nói trước lớp, Part 2 dừng sớm.', 'mô tả viết riêng bị đè');
  }));

  // ---------------------------------------------------------------- ④ SOS tạm · Overall đạt
  check('NX12 · SOS tạm (lượt chưa chốt): Case tạm không hạn, không việc Xác nhận Case dù S chấm chéo có nhận xét', () => thu(() => {
    const { gvPT, gvCheo } = nguoiS();
    const a = emMoi();
    svc.saveScore(gvCheo, a.m1, 'speaking', { ...diem('speaking', 5), nhanXet: NX.speaking }, TODAY);
    xoaNho();
    const c = one(`SELECT * FROM sos_cases WHERE attempt_id = ? AND topic = 'speaking'`, a.m1);
    if (c) assert(c.tam === 1 && c.han_xac_nhan === null, `Case phải tạm, không hạn: ${JSON.stringify({ tam: c.tam, han: c.han_xac_nhan })}`);
    assert(!(mywork.myWork(gvPT).items as any[]).some((x) => x.group === 'xem_nx_s' && x.attemptId === a.m1), 'SOS tạm không có việc');
  }));

  check('NX13 · Overall đạt kỳ vọng → Case S chưa xử lý (chưa xác nhận PA) tự mất', () => thu(() => {
    const { gvPT } = nguoiS();
    const a = emMoi();
    const c = chot(a.m1, { bandS: 5, nxS: NX.speaking, nguoiLuuS: gvPT });   // Overall 6.0 < 6.5 → SOS, Case S thật
    assert(c && c.tam === 0, `phải có Case S thật: ${JSON.stringify(c)}`);
    svc.saveScore(QL, a.m1, 'listening', { band: 9 }, TODAY);   // Overall (9 + 6.5 + 6.5 + 5) / 4 → 7.0 ≥ 6.5
    xoaNho();
    const sau = one('SELECT id, status FROM sos_cases WHERE id = ?', c.id);
    assert(!sau || sau.status === 'done', `Case S phải mất / đóng khi Overall đạt: ${JSON.stringify(sau)}`);
  }));

  // ---------------------------------------------------------------- ⑤ migrate
  check('NX14 · migrate: Case mô tả từ nhận xét gắn nguồn (nội dung giữ) · ô S cờ mà PA đã xác nhận → hạ cờ · còn lại giữ cờ; lần hai không đổi; kiểm trước không ghi', () => thu(() => {
    const { gvPT } = nguoiS();
    const a = emMoi();
    const c = chot(a.m1, { bandS: 5, nxS: NX.speaking, nguoiLuuS: gvPT });
    run('UPDATE sos_cases SET mo_ta_attempt_id = NULL WHERE id = ?', c.id);   // dữ liệu trước PR
    run(`UPDATE assessment_scores SET cho_phu_trach_xem = 1 WHERE attempt_id = ? AND skill = 'speaking'`, a.m1);
    const truoc = moTa(c.id);
    const kt = mig.kiemTruocSvNxCase(conn);
    assert(kt.some((x: any) => x.phan === 'A' && x.id === c.id) && kt.some((x: any) => x.phan === 'B-xac-nhan-case'), JSON.stringify(kt.filter((x: any) => x.id === c.id)));
    assert(one('SELECT mo_ta_attempt_id n FROM sos_cases WHERE id = ?', c.id).n === null, 'kiểm trước không được ghi');
    const ap: string[] = [];
    mig.migratePrSvNxCase(conn, ap);
    assert(one('SELECT mo_ta_attempt_id n FROM sos_cases WHERE id = ?', c.id).n === a.m1 && JSON.stringify(moTa(c.id)) === JSON.stringify(truoc), 'phần A');
    assert(one(`SELECT cho_phu_trach_xem n FROM assessment_scores WHERE attempt_id = ? AND skill = 'speaking'`, a.m1).n === 1, 'chưa xác nhận PA → giữ cờ (Xác nhận Case)');
    /* PA đã xác nhận (việc OV-13k cũ đã hết) → hạ cờ. */
    run(`UPDATE case_interventions SET confirmed_at = ? WHERE case_id = ?`, '2999-01-01T00:00:00Z', c.id);
    const ap2: string[] = [];
    mig.migratePrSvNxCase(conn, ap2);
    assert(one(`SELECT cho_phu_trach_xem n FROM assessment_scores WHERE attempt_id = ? AND skill = 'speaking'`, a.m1).n === 0 && ap2.length === 1, JSON.stringify(ap2));
    const ap3: string[] = [];
    mig.migratePrSvNxCase(conn, ap3);
    assert(!ap3.length, `lần sau phải không đổi: ${JSON.stringify(ap3)}`);
  }));

  check('NX15 · migrate A: Case trượt sang MT2, mô tả = nhận xét MT1 → nguồn MT1, nhận xét MT2 sau đó không đè; mô tả không trùng nhận xét nào → nguồn NULL, giữ', () => thu(() => {
    const { gvPT } = nguoiS();
    const a = emMoi();
    const c = chot(a.m1, { bandS: 5, nxS: NX.speaking, nguoiLuuS: gvPT });
    /* Dữ liệu trước PR: Case đã trượt sang MT2 (lượt đang theo = MT2), ô S MT2 có nhận xét khác, mô tả vẫn là nhận xét MT1, chưa có nguồn. */
    run('UPDATE sos_cases SET attempt_id = ?, mo_ta_attempt_id = NULL WHERE id = ?', a.m2, c.id);
    run(`INSERT INTO case_milestones (case_id, kind, attempt_id, occurred_on, created_at) VALUES (?, 'repeat', ?, ?, ?)`, c.id, a.m2, TODAY, new Date().toISOString());
    run(`INSERT INTO assessment_scores (attempt_id, skill, band, comment) VALUES (?, 'speaking', 5, 'MT2: Part 3 trả lời quá ngắn.')`, a.m2);
    /* Case thứ hai cùng em (Listening): mô tả không trùng nhận xét nào. */
    const cL = Number(run(`INSERT INTO sos_cases (attempt_id, student_id, cycle_id, topic, category, origin_kind, status, created_at)
        SELECT id, student_id, cycle_id, 'listening', 'listening', 'mock', 'open', ? FROM assessment_attempts WHERE id = ?`, new Date().toISOString(), a.m1).lastInsertRowid);
    run(`INSERT INTO case_issues (case_id, role, taxonomy_code, skill, observation, created_by, created_at) VALUES (?, 'primary', ?, 'listening', 'Mô tả cũ không trùng nhận xét nào.', NULL, ?)`,
      cL, d.issuesForTopic('listening')[0].code, new Date().toISOString());
    const kt = mig.kiemTruocSvNxCase(conn);
    assert(kt.find((x: any) => x.id === c.id)?.nguon === a.m1 && kt.find((x: any) => x.id === cL)?.phan === 'A-khong-khop', JSON.stringify(kt.filter((x: any) => [c.id, cL].includes(x.id))));
    mig.migratePrSvNxCase(conn, []);
    assert(one('SELECT mo_ta_attempt_id n FROM sos_cases WHERE id = ?', c.id).n === a.m1 && one('SELECT mo_ta_attempt_id n FROM sos_cases WHERE id = ?', cL).n === null, 'nguồn sai');
    svc.saveScore(gvPT, a.m2, 'speaking', { nhanXet: 'MT2: nhận xét mới sau migrate, không được đè mô tả.' }, TODAY);
    assert(moTa(c.id)?.observation === NX.speaking, `mô tả MT1 bị đè: ${moTa(c.id)?.observation}`);
    svc.saveScore(QL, a.m1, 'listening', { band: 4, nhanXet: 'Nhận xét L mới — Case không nguồn không bị đè.' }, TODAY);
    assert(moTa(cL)?.observation === 'Mô tả cũ không trùng nhận xét nào.', `mô tả không nguồn bị đè: ${moTa(cL)?.observation}`);
  }));

  check('NX16 · Sửa Case MT chưa mô tả chỉ đổi tên / mức độ → lưu; `luc` cũ → 409 không ghi; mô tả > 1000 → 400; lượt nguồn mất → không "MT?"', () => thu(() => {
    const { gvPT } = nguoiS();
    const a = emMoi();
    const c = chot(a.m1, { bandS: 5, nguoiLuuS: gvPT });
    assert(!moTa(c.id), 'tiền đề: Case chưa mô tả');
    const luc0 = cases.caseDetail(gvPT, c.id).capNhatLuc;
    cases.suaCase(gvPT, c.id, { title: 'Speaking dưới kỳ vọng — đổi tên', urgency: 'urgent', luc: luc0 });
    assert(one('SELECT title FROM sos_cases WHERE id = ?', c.id).title === 'Speaking dưới kỳ vọng — đổi tên' && !moTa(c.id), 'đổi tên phải lưu, không sinh mô tả');
    let loi: any = null;
    try { cases.suaCase(gvPT, c.id, { title: 'Ghi đè im lặng', luc: luc0 }); } catch (e) { loi = e; }
    assert(loi?.status === 409 && one('SELECT title FROM sos_cases WHERE id = ?', c.id).title !== 'Ghi đè im lặng', `luc cũ phải 409: ${loi?.status}`);
    loi = null;
    try { cases.suaCase(gvPT, c.id, { primaryCode: d.issuesForTopic('speaking')[0].code, observation: 'x'.repeat(d.NHAN_XET_TOI_DA + 1) }); } catch (e) { loi = e; }
    assert(loi?.status === 400, `mô tả quá dài phải 400: ${loi?.status}`);
    svc.saveScore(gvPT, a.m1, 'speaking', { nhanXet: NX.speaking }, TODAY);
    run('UPDATE sos_cases SET mo_ta_attempt_id = ? WHERE id = ?', 99999999, c.id);   // lượt nguồn không còn
    const chinh = cases.caseDetail(QL, c.id).issues.find((x: any) => x.role === 'primary');
    assert(chinh && !chinh.moTaTuMt, `không được hiện MT?: ${JSON.stringify(chinh)}`);
  }));
}
