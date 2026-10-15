/** PHÉP KIỂM PR-S3F — sửa sau rà cuối đợt 3 (mỗi mục một phép kiểm tái hiện đúng tình huống rà). Harness do `run.ts` truyền vào. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { YThucTestKit } from './yThuc.tests.ts';
import { duXacNhan } from './luotThu.ts';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..');

export async function runPrS3fTests(t: YThucTestKit) {
  const { check, assert, assertThrows, conn, P, TODAY, addDays } = t;
  const d = await import('../../../shared/domain/index.ts');
  const attemptsSvc: any = await import('../fasttrack/attempts.ts');
  const weekSvc: any = await import('../platform/week.ts');
  const scoring: any = await import('../fasttrack/scoring.ts');
  const intake: any = await import('../classes/intake.ts');
  const sosAuto: any = await import('../cases/sosAuto.ts');
  const keHoach: any = await import('../keHoach/keHoachTest.ts');
  const { boLichTuTao, luotThu, nhanXetCaseThu } = await import('./luotThu.ts');
  console.log('\nPR-S3F · Sửa sau rà cuối đợt 3');

  const CLASS = t.classId('MB FT 101');
  const all = (sql: string, ...a: unknown[]) => conn.prepare(sql).all(...a) as any[];
  const get = (sql: string, ...a: unknown[]) => conn.prepare(sql).get(...a) as any;
  const makeStudent = (name: string, target = 7) => {
    intake.commitIntake(P.admin, { classId: CLASS, rows: [{ fullName: `S3F ${name}`, target, email: 'hv@demo.test', dob: '2010-01-01' }], idempotencyKey: `s3f-${name}` });
    const st = get('SELECT id FROM students WHERE full_name = ?', `S3F ${name}`);
    const cy = get("SELECT id FROM learning_cycles WHERE student_id = ? AND status = 'active'", st.id);
    boLichTuTao(conn, cy.id);
    return { id: st.id as number, cycleId: cy.id as number, name: `S3F ${name}` };
  };
  const PAST_WEEK = weekSvc.mondayOf(addDays(TODAY, -14));
  const mkAttempt = (st: { id: number; cycleId: number }, no: number): any => luotThu(conn, attemptsSvc.createAttempt, P.admin, { chot: true,
    studentId: st.id, cycleId: st.cycleId, classId: CLASS, no, periodId: weekSvc.ensurePeriod(PAST_WEEK).id });
  const enter = (a: any, skill: string, band: number) => attemptsSvc.saveScore(P.admin, a.id, skill, {
    ...(skill === 'listening' ? { rawScore: scoring.LISTENING_BY_RAW.indexOf(band) }
      : skill === 'reading' ? { rawScore: scoring.READING_BY_RAW.indexOf(band) }
      : { criteria: [band, band, band, band] }),
    lyDo: 'Phép kiểm: nhập điểm',
  });
  const caseOf = (sid: number, category: string) => get('SELECT * FROM sos_cases WHERE student_id = ? AND category = ? ORDER BY id DESC LIMIT 1', sid, category);
  const L_CODE = d.issuesForTopic('listening', null)[0].code;
  const XN = { primaryCode: L_CODE, urgency: 'attention', moTa: 'Em nghe sót số và tên riêng ở Part 1–2.' };

  // ------------------------------------------------------------------ 1 · Huỷ điểm / Thi lại rút Case SOS
  check('S3F (1) · Huỷ điểm L: Case chỉ dựng trên điểm đó → đóng "điểm đã huỷ", tín hiệu rút, PA chưa làm bị huỷ không tính thất bại', () => {
    const st = makeStudent('H1');
    const a = mkAttempt(st, 1);
    for (const k of ['listening', 'reading', 'speaking']) enter(a, k, 5);
    const c = caseOf(st.id, 'listening');
    assert(c.status === 'open', 'chưa có Case L');
    keHoach.huyDiem(P.admin, { attemptId: a.id, skill: 'listening', lyDo: 'Chấm nhầm bài, huỷ điểm' });
    const sau = get('SELECT * FROM sos_cases WHERE id = ?', c.id);
    /* PR-BV thay S3F (1) "đã bị huỷ": Huỷ điểm là xoá điểm — chữ "đã bị xoá" (thi lại giữ "đã bị huỷ"). */
    assert(sau.status === 'done' && /điểm Listening.* đã bị xoá/.test(sau.outcome_note ?? ''), JSON.stringify(sau));
    assert(get(`SELECT status FROM case_signals WHERE case_id = ? OR (attempt_id = ? AND skill = 'listening')`, c.id, a.id).status === 'withdrawn', 'tín hiệu chưa rút');
    /* PR-BV thay S3F (1) "closed_reason = score_fixed": xoá điểm ghi `score_cleared:<trạng thái cũ>` để nhập lại điểm mở lại PA đúng như cũ. */
    assert(all('SELECT closed_reason r, status s FROM case_interventions WHERE case_id = ?', c.id).every((x: any) => x.s === 'cancelled' && /^score_cleared:(planned|started)$/.test(x.r)), 'PA chưa huỷ đúng lý do');
    assert(caseOf(st.id, 'reading').status === 'open', 'Case R không được đụng');
  });
  check('S3F (1) · Thi lại L: Case cũ đóng; điểm mới vẫn trượt → Case MỚI theo điểm mới', () => {
    const st = makeStudent('H2');
    const a = mkAttempt(st, 1);
    conn.prepare('UPDATE assessment_attempts SET lich_su = 0 WHERE id = ?').run(a.id);   // MT lịch sử không thi lại được (T37)
    for (const k of ['listening', 'reading', 'speaking']) enter(a, k, 5);
    const cu = caseOf(st.id, 'listening');
    /* PR-MTa T19 thay "thi lại tuần sau rồi nhập ngay": nhập điểm chỉ từ tuần thi — thi lại ngay tuần này. */
    const tuanSau = weekSvc.ensurePeriod(weekSvc.mondayOf(TODAY)).id;
    keHoach.thiLai(P.admin, { attemptId: a.id, skills: ['listening'], periodId: tuanSau, lyDo: 'Đề lỗi, thi lại', force: true });
    assert(get('SELECT status FROM sos_cases WHERE id = ?', cu.id).status === 'done', 'Case cũ phải đóng khi ô L bị xoá để thi lại');
    enter(a, 'listening', 5);
    const moi = caseOf(st.id, 'listening');
    assert(moi.id !== cu.id && moi.status === 'open', `phải có Case mới: ${JSON.stringify(moi)}`);
  });
  check('S3F (1) · Huỷ điểm khi Case còn căn cứ khác (PA đã xác nhận) → GIỮ Case, báo người phụ trách xem lại', () => {
    const st = makeStudent('H3');
    const a = mkAttempt(st, 1);
    for (const k of ['listening', 'reading', 'speaking']) enter(a, k, 5);
    const c = caseOf(st.id, 'listening');
    nhanXetCaseThu(conn, attemptsSvc.saveScore, P.admin, c.id, XN);   // OV-12c: nguyên nhân Case MT = nhận xét của bài
    const iv = get('SELECT id FROM case_interventions WHERE case_id = ?', c.id);
    sosAuto.xacNhanPaQuyChe(P.admin, iv.id, duXacNhan(conn, iv.id, { description: 'Tutor Listening hai buổi mỗi tuần, cô Hà chữa bài nghe.' }));
    keHoach.huyDiem(P.admin, { attemptId: a.id, skill: 'listening', lyDo: 'Chấm nhầm bài, huỷ điểm' });
    assert(get('SELECT status FROM sos_cases WHERE id = ?', c.id).status !== 'done', 'Case có PA đã chạy không được đóng');
    assert(get('SELECT status FROM case_interventions WHERE id = ?', iv.id).status === 'started', 'PA đã chạy bị đụng');
    assert(get(`SELECT COUNT(*) n FROM notifications WHERE entity_type = 'sos_case' AND entity_id = ? AND title LIKE 'Xem lại Case%'`, c.id).n === 1, 'thiếu thông báo xem lại');
  });

  // ------------------------------------------------------------------ 2 · Không cần theo dõi: chặn thêm PA khi thẻ chờ, duyệt huỷ MỌI PA
  const yc: any = await import('../duyet/yeuCau.ts');
  const cases: any = await import('../cases/cases.ts');
  check('S3F (2) · Thẻ Không cần theo dõi đang chờ: GV thêm PA → 400; PA GV thêm trước đó bị huỷ khi QL duyệt (không tính thất bại)', () => {
    const st = makeStudent('K2');
    const a = mkAttempt(st, 1);
    for (const k of ['listening', 'reading', 'speaking']) enter(a, k, 5);
    const c = caseOf(st.id, 'listening');
    sosAuto.guiKhongTheoDoi(P.admin, c.id, { reasonCode: 'single_incident' });
    assertThrows(() => cases.recordIntervention(P.admin, c.id, { kind: 'tutor', description: 'Tutor thêm một buổi nữa', performerSelf: true, status: 'started', startedDate: TODAY }),
      /chờ Quản lý duyệt "Không cần theo dõi"/, 'thêm PA khi thẻ đang chờ');
    /* Trạng thái CŨ (trước khi chặn): PA GV tự thêm lúc thẻ đang chờ — Case 45 → PA 53 của lượt rà. Dựng thẳng bằng SQL. */
    const bayGio = new Date().toISOString();
    conn.prepare(`INSERT INTO case_interventions (case_id, kind, description, status, needs_approval, preset, started_date, created_at) VALUES (?, 'tutor', 'Tutor thêm hai buổi mỗi tuần', 'started', 0, 0, ?, ?)`).run(c.id, TODAY, bayGio);
    yc.duyetYeuCau(P.mbManager, get(`SELECT id FROM yeu_cau_duyet WHERE loai = 'khong_theo_doi' AND doi_tuong_id = ? ORDER BY id DESC LIMIT 1`, c.id).id);
    const ivs = all('SELECT status, closed_reason FROM case_interventions WHERE case_id = ?', c.id);
    assert(get('SELECT status FROM sos_cases WHERE id = ?', c.id).status === 'done', 'Case chưa đóng');
    assert(ivs.length >= 2 && ivs.every((x: any) => x.status === 'cancelled' && x.closed_reason === 'khong_theo_doi'), JSON.stringify(ivs));
  });

  // ------------------------------------------------------------------ 3 · em KCK, lượt đã có điểm một phần
  /* OV-9 (chủ SP 13/10): em KCK dưới kỳ vọng mở Case NHẸ (không SOS / PA quy chế / hạn) — đổi ý phép kiểm cũ "không sinh Case / tín hiệu".
     OV-11e (Q8 chủ SP 14/10): lượt thử CHỐT SẴN (`chotSan`) trước khi tích → giữ KCK lúc chốt (`kck_at_attempt` = 0): điểm nhập thêm mở Case
     THƯỜNG như kết luận lúc chốt. Lượt CHƯA chốt theo KCK hiện tại (Case nhẹ) — `prOv11e.tests` OV11e-6. */
  check('S3F (3) → OV-9 → OV-11e · Tích KCK sau khi lượt đã chốt: điểm nhập THÊM giữ kết luận lúc chốt (Case thường, không Case nhẹ); Case cũ giữ', () => {
    const st = makeStudent('KCK');
    const a = mkAttempt(st, 1);
    enter(a, 'listening', 5);
    const cL = caseOf(st.id, 'listening');
    assert(cL?.status === 'open', 'chưa có Case L trước khi đổi KCK');
    conn.prepare('UPDATE learning_cycles SET khong_cam_ket = 1, target_score = NULL WHERE id = ?').run(st.cycleId);   // lượt giữ target_at_attempt cũ (cycles.ts apTargetLuotChuaDiem)
    enter(a, 'reading', 5);
    enter(a, 'speaking', 5);
    assert(get('SELECT kck_at_attempt k FROM assessment_attempts WHERE id = ?', a.id).k === 0, 'lượt chốt phải chụp KCK = 0');
    for (const k of ['reading', 'speaking']) {
      const c = caseOf(st.id, k);
      assert(c && c.kck === 0 && c.sos_level !== null, `${k}: lượt đã chốt mà thành Case nhẹ — ${JSON.stringify(c)}`);
    }
    assert(get('SELECT status FROM sos_cases WHERE id = ?', cL.id).status === 'open', 'Case cũ (lịch sử) phải giữ');
  });

  // ------------------------------------------------------------------ 5 · em KCK không hiện "Đạt kỳ vọng"
  check('S3F (5) · Em KCK có điểm: hàng bảng kỹ năng missed = null + kck = true; giao diện chỉ hiện chip Đạt khi missed === false, câu tóm tắt không nói "đạt kỳ vọng"', () => {
    intake.commitIntake(P.admin, { classId: CLASS, rows: [{ fullName: 'S3F KCK5', target: 'KCK', email: 'hv@demo.test', dob: '2010-01-01' }], idempotencyKey: 's3f-kck5' });
    const st = get('SELECT id FROM students WHERE full_name = ?', 'S3F KCK5');
    const cy = get("SELECT id, khong_cam_ket k FROM learning_cycles WHERE student_id = ? AND status = 'active'", st.id);
    assert(cy.k === 1, 'em phải là KCK');
    boLichTuTao(conn, cy.id);
    const a = mkAttempt({ id: st.id, cycleId: cy.id }, 1);
    enter(a, 'listening', 5);
    const hang = (cases.skillSupportBoard(P.admin, st.id) as any).rows.find((r: any) => r.category === 'listening');
    assert(hang.band != null && hang.missed === null && hang.kck === true, JSON.stringify({ band: hang.band, missed: hang.missed, kck: hang.kck }));
    const web = (f: string) => fs.readFileSync(path.join(REPO, 'web/src/modules', f), 'utf8');
    assert(/row\.missed === false[\s\S]{0,160}Đạt kỳ vọng/.test(web('cases/SkillBoard.tsx')) && !/row\.band !== null && !row\.missed/.test(web('cases/SkillBoard.tsx')), 'SkillBoard vẫn dùng !row.missed');
    /* PR-VAI-b (Task 3): câu tóm tắt dựng ở máy chủ (`cauTomTat`) — em KCK có điểm không bao giờ "đạt kỳ vọng" (cùng ý câu cũ ở web). */
    const cau = d.cauTomTat({ dacBiet: { loai: 'kck' }, ketQua: { dau: 'MT1', ratio: false, sos: null, dat: null, overall: 5, kck: true, soDat: 0, soMon: 4, monTruot: [], phanTram: null },
      hoTro: [], viec: [], yThuc: null, homNay: '2026-09-14' });
    assert(!cau.some((m: any) => /đạt kỳ vọng/.test(m.chu)) && cau[0].chu.startsWith('KCK'), `câu tóm tắt hồ sơ chưa tách em không kỳ vọng: ${JSON.stringify(cau)}`);
  });

  // ------------------------------------------------------------------ 6–7 · Ý thức
  const viol: any = await import('../yThuc/violations.ts');
  const xuLy: any = await import('../yThuc/xuLy.ts');
  const tt: any = await import('../yThuc/trangThai.ts');
  const mywork: any = await import('../worklist/mywork.ts');
  const attachments: any = await import('../platform/attachments.ts');
  const { lyDoBaoLenYThuc } = await import('../duyet/loaiYeuCau.ts');
  let seqYt = 0;
  const hvYt = (): number => {
    const ten = `S3F YT ${++seqYt}`;
    intake.commitIntake(P.admin, { classId: CLASS, rows: [{ fullName: ten, target: 7, email: 'hv@demo.test', dob: '2010-01-01' }], idempotencyKey: `s3f-yt-${seqYt}` });
    const id = get('SELECT id FROM students WHERE full_name = ?', ten).id as number;
    boLichTuTao(conn, get("SELECT id FROM learning_cycles WHERE student_id = ? AND status = 'active'", id).id);
    conn.prepare("UPDATE enrollments SET started_at = '2026-08-03' WHERE student_id = ?").run(id);
    return id;
  };
  const gvcn = P.coreTeacher, gvbm = P.w1Teacher;
  const ghiVp = (who: any, sid: number, ngay: string, category = 'homework') =>
    (viol.recordViolation(who, { studentId: sid, category, description: 'Vi phạm ghi qua máy chủ cho PR-S3F', occurredOn: ngay }) as any).violation.id as number;
  const emYt = (sid: number) => tt.trangThaiYThuc([sid], TODAY).get(sid);

  check('S3F (6) · GVCN ghi vi phạm thứ 3 (Cần xử lý): vẫn được đặt "Đã ghi nhận"; xoá bớt một vi phạm của GVBM → vi phạm của GVCN không thành "Mới"', () => {
    const sid = hvYt();
    const a = ghiVp(gvbm, sid, addDays(TODAY, -2));
    const b = ghiVp(gvbm, sid, addDays(TODAY, -1));
    const c = ghiVp(gvcn, sid, TODAY);
    assert(emYt(sid).viPham.get(c).t === 'can_xu_ly', `vi phạm thứ 3 phải Cần xử lý: ${emYt(sid).viPham.get(c).t}`);
    assert(get('SELECT ghi_nhan_luc g FROM violations WHERE id = ?', c).g === TODAY, 'GVCN tự ghi nhưng chưa có dấu Đã ghi nhận');
    viol.deleteViolation(gvcn, a);
    assert(emYt(sid).viPham.get(c).t !== 'moi', `vi phạm của GVCN thành "Mới": ${emYt(sid).viPham.get(c).t}`);
    assert(emYt(sid).viPham.get(b).t === 'moi', 'vi phạm của GVBM (chưa ai xem) vẫn Mới');
  });

  const theCho = (loai: string, doiTuongId: number) => get('SELECT * FROM yeu_cau_duyet WHERE loai = ? AND doi_tuong_id = ? ORDER BY id DESC', loai, doiTuongId);
  const deXuatGui = (sid: number, kind: string, ids: number[]) => {
    const nhap = xuLy.deXuat(gvcn, sid, { kind, violationIds: ids, note: 'Em vi phạm nhiều lần, cần QL quyết' });
    attachments.addLink(gvcn, { ownerType: 'discipline_measure', ownerId: nhap.id, url: 'https://example.com/bang-chung', displayName: 'Biên bản' });
    return xuLy.guiDeXuat(gvcn, nhap.id);
  };
  check('S3F (7) · Meeting đã duyệt rồi gửi thêm Đình chỉ: việc "Ghi Đã thực hiện Meeting" KHÔNG mất; quá hạn tính trên đề xuất đã duyệt → Báo QL; mỗi lần xử lý một việc', () => {
    const sid = hvYt();
    const ids = [-3, -2, -1].map((n) => ghiVp(gvbm, sid, addDays(TODAY, n)));
    const m1 = deXuatGui(sid, 'meeting_cx', ids);
    yc.duyetYeuCau(P.mbManager, theCho('y_thuc', m1.id).id);
    const m2 = deXuatGui(sid, 'suspension', [ghiVp(gvbm, sid, TODAY)]);
    const e = emYt(sid);
    assert(e.deXuat.id === m1.id && e.deXuat.status === 'da_duyet' && e.coChoDuyet, JSON.stringify(e.deXuat));
    const keys = () => (mywork.myWork(gvcn, {}).items as any[]).map((i: any) => i.key as string);
    assert(keys().includes(`yt_thuc_hien:${m1.id}`), 'mất việc "Đã thực hiện" của Meeting đã duyệt');
    /* Duyệt cả Đình chỉ: hai việc, mỗi lần xử lý một khoá. */
    yc.duyetYeuCau(P.mbManager, theCho('y_thuc', m2.id).id);
    assert(keys().includes(`yt_thuc_hien:${m1.id}`) && keys().includes(`yt_thuc_hien:${m2.id}`), 'hai đề xuất đã duyệt phải là hai việc');
    /* Meeting duyệt từ 10 ngày trước → quá 5 ngày chưa thực hiện, dù Đình chỉ mới duyệt hôm nay. */
    conn.prepare('UPDATE discipline_measures SET quyet_luc = ? WHERE id = ?').run(addDays(TODAY, -10), m1.id);
    const l = lyDoBaoLenYThuc(emYt(sid));
    assert(l?.viec === 'yt_thuc_hien' && l.viecId === m1.id, JSON.stringify(l));
  });

  // ------------------------------------------------------------------ 8 · chặn đường vòng chỉ-API
  const mt1L = (name: string) => { const st = makeStudent(name); const a = mkAttempt(st, 1); enter(a, 'listening', 5); return { st, a, c: caseOf(st.id, 'listening') }; };
  /* PR-Dọn (Q14): `PUT /cases/:id/issues` + `setIssues` và route `/interventions/:id/complete` đã xoá (web không gọi) — giữ phần hàm còn sống. */
  check('S3F (8) · khép PA quy chế TRƯỚC mốc → 400 (T22) — PR-SO: qua `updateResult` (decision end), `completeIntervention` đã xoá', () => {
    const { c } = mt1L('D8');
    nhanXetCaseThu(conn, attemptsSvc.saveScore, P.admin, c.id, XN);   // OV-12c: nguyên nhân Case MT = nhận xét của bài
    const iv = get('SELECT id FROM case_interventions WHERE case_id = ?', c.id);
    sosAuto.xacNhanPaQuyChe(P.admin, iv.id, duXacNhan(conn, iv.id, { description: 'Tutor Listening hai buổi mỗi tuần, cô Hà chữa bài nghe.' }));
    assertThrows(() => cases.updateResult(P.admin, iv.id, { decision: 'end', outcome: 'improved', note: 'Em nghe tốt hơn hẳn sau hai tuần' }), /không kết thúc sớm/, 'khép PA quy chế sớm');
    assert(get('SELECT status FROM case_interventions WHERE id = ?', iv.id).status === 'started', 'PA bị khép');
  });

  // ------------------------------------------------------------------ 9–10 · giao diện (đọc mã nguồn — đúng chỗ đã sửa)
  const web = (f: string) => fs.readFileSync(path.join(REPO, 'web/src/modules', f), 'utf8');
  check('S3F (9) · (OV-13b) Panel Xác nhận PA luôn là form — Nội dung / hướng dẫn * bắt đầu trống (người xác nhận ghi), ≥ 15 ký tự, gửi kèm Bắt đầu; (10) đầu hồ sơ tách "chờ xác nhận" khỏi "đang theo dõi"', () => {
    const c = web('yThuc/CaseSosControls.tsx');
    /* OV-13b (chủ SP 15/10, mockup OV-13 §9): thay "bấm thẳng" của OV-12c — ô Nội dung trống (`paMoi`), không gửi mô tả máy gán. */
    const xn = c.slice(c.indexOf('export function XacNhanPaPanel'), c.indexOf('export function GhiNhanXetPanel'));
    assert(/\.\.\.paMoi\(pa\.kind\)/.test(xn) && !/description: pa\.description/.test(xn) && /startedDate: batDau/.test(xn), 'Xác nhận PA phải bắt đầu ô Nội dung trống và gửi Bắt đầu');
    assert(/toiThieu: 15/.test(xn) && /<FormPa/.test(xn) && /placeholder=\{GOI_Y_MO_TA_PA\}/.test(web('cases/FormPa.tsx')), 'mất ràng buộc 15 ký tự / gợi ý');
    /* PR-VAI-b (Task 3): ô "Case đang mở" cũ → ô Học thuật, mỗi Case một dòng — Case có PA chờ xác nhận nói "xác nhận PA", tách khỏi Case đang theo dõi. */
    const o = d.oHocThuat([{ short: 'L', label: 'Listening', category: 'listening', missed: true, cases: [
      { status: 'open', trangThaiV4: { t: 'can-lam' }, viecTiep: { chu: 'Xác nhận PA Tutor' } },
      { status: 'in_progress', trangThaiV4: { t: 'dang-lam' }, viecTiep: { chu: 'Kết quả PA Tutor' } },
    ] }]);
    assert(o.dong.map((x: any) => x.viec).join() === 'xác nhận PA,kết quả', `đầu hồ sơ chưa nói "chờ xác nhận": ${JSON.stringify(o.dong)}`);
  });

  // ------------------------------------------------------------------ 11 · ngày đổi trạng thái học viên
  const studentSvc: any = await import('../students/students.ts');
  check('S3F (11) · POST /students/:id/status: ngày tương lai → 400; Quay lại học trước ngày Tạm dừng → 400; đúng ngày → được', () => {
    const sid = hvYt();
    assertThrows(() => studentSvc.setStudentStatus(P.admin, sid, 'inactive', addDays(TODAY, 3), 'Nghỉ'), /không được sau hôm nay/, 'tương lai');
    studentSvc.setStudentStatus(P.admin, sid, 'inactive', addDays(TODAY, -3), 'Nghỉ bệnh');
    assertThrows(() => studentSvc.setStudentStatus(P.admin, sid, 'active', addDays(TODAY, -5)), /trước ngày tạm dừng/, 'quay lại trước ngày dừng');
    assert(get('SELECT status FROM students WHERE id = ?', sid).status === 'inactive', 'đã đổi trạng thái dù bị từ chối');
    studentSvc.setStudentStatus(P.admin, sid, 'active', TODAY);
    assert(get('SELECT status FROM students WHERE id = ?', sid).status === 'active', 'quay lại đúng ngày phải được');
  });

  // ------------------------------------------------------------------ 12 · Ý thức: các mục nhỏ
  const metricsSvc: any = await import('../worklist/metrics.ts');
  const thongKe: any = await import('../yThuc/thongKe.ts');
  const dongHv: any = await import('../classes/dongHocVien.ts');
  check('S3F (12) · "Biện pháp" ở chỉ số nói đúng trạng thái (không "đang chuẩn bị"); violationDetail không liệt kê nháp đề xuất; huy hiệu lớp = hv-can-xu-ly với em Tạm dừng; lớp chưa có GVCN vẫn Báo QL', () => {
    const sid = hvYt();
    const ids = [-3, -2, -1].map((n) => ghiVp(gvbm, sid, addDays(TODAY, n)));
    const nhap = xuLy.deXuat(gvcn, sid, { kind: 'suspension', violationIds: ids, note: 'Đình chỉ vì vi phạm nặng' });
    assert((viol.violationDetail(P.admin, ids[0]) as any).measures.length === 0, 'nháp đề xuất bị liệt kê ở chi tiết vi phạm');
    xuLy.xoaNhap(gvcn, nhap.id);
    const m = deXuatGui(sid, 'meeting_cx', ids);
    assert((viol.violationDetail(P.admin, ids[0]) as any).measures.length === 1, 'đề xuất đã gửi phải có ở chi tiết vi phạm');
    assert(/Chờ Quản lý duyệt/.test(metricsSvc.rowsFor('bien-phap', [m.id])[0].sub) && !/đang chuẩn bị/.test(metricsSvc.rowsFor('bien-phap', [m.id])[0].sub), 'nhãn biện pháp chờ duyệt');
    yc.duyetYeuCau(P.mbManager, theCho('y_thuc', m.id).id);
    assert(/Đã duyệt · chờ thực hiện/.test(metricsSvc.rowsFor('bien-phap', [m.id])[0].sub), 'nhãn biện pháp đã duyệt');

    const sid2 = hvYt();
    for (const n of [-3, -2, -1]) ghiVp(gvbm, sid2, addDays(TODAY, n));
    const tap = () => ({ huyHieu: dongHv.canhBaoTheoHocVien(P.admin, CLASS).has(sid2), chiSo: (thongKe.yThucMetric(P.admin, 'hv-can-xu-ly', { classId: CLASS }).ids as number[]).includes(sid2) });
    assert(tap().huyHieu && tap().chiSo, `em đang học phải có ở cả hai: ${JSON.stringify(tap())}`);
    studentSvc.setStudentStatus(P.admin, sid2, 'inactive', TODAY, 'Nghỉ bệnh');
    assert(!tap().huyHieu && !tap().chiSo, `em Tạm dừng phải vắng ở cả hai: ${JSON.stringify(tap())}`);

    const sid3 = hvYt();
    conn.prepare(`INSERT INTO violations (student_id, class_id, category, occurred_on, reported_on, reported_by, description, created_at) VALUES (?,?, 'homework', ?, ?, ?, 'Vi phạm cũ chưa ai xem', ?)`)
      .run(sid3, CLASS, addDays(TODAY, -9), addDays(TODAY, -9), gvbm.userId, new Date().toISOString());
    const em3 = emYt(sid3);
    assert(lyDoBaoLenYThuc({ ...em3, gvcnId: null }) !== null, 'lớp chưa có GVCN vẫn phải Báo QL');
  });
  check('S3F (12) · ClassYThucCard: lỗi tải hồ sơ Ý thức của em → ErrorState; chú thích yeuCauDuyet.ts nêu cả hai khoá y_thuc, bao_len_y_thuc', () => {
    assert(/hvY\.error \? [\s\S]{0,120}ErrorState/.test(web('yThuc/ClassYThucCard.tsx')), 'lỗi hvY chưa có ErrorState');
    assert(/'y_thuc' \+ 'bao_len_y_thuc'/.test(fs.readFileSync(path.join(REPO, 'shared/domain/yeuCauDuyet.ts'), 'utf8')), 'chú thích hai khoá');
  });
}
