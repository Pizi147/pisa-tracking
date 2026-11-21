/**
 * PHÉP KIỂM GÓI 4 CX-BPXL (AUDIT-2111, luật N63 — chủ SP 21/11 "ok hết theo khuyến nghị"):
 *  · P1-06 hồ sơ HV của CX có việc Kết quả meeting của chính CX — cùng tập việc với /my-work (hai đường cùng số).
 *  · N63 ① CX không chốt lộ trình Cuối khoá / nháp / Lộ trình tiếp theo (403), panel Cuối khoá `coTheRaLenh` false; Head vẫn được; CX giữ quyền chuyển lớp lẻ.
 *  · N63 ② BPXL Khôi phục MT / kỹ năng: đã có điểm → 403, chưa có điểm → qua cổng quyền (khôi phục lượt đã huỷ: BX-10 ở prBpxl).
 *  · N63 ⑤ BPXL không xem Ý thức (vi phạm, tab Ý thức HV / lớp, khối Ý thức hồ sơ HV); Phối hợp của em vẫn xem được.
 *  · A3-06 CX "+ Task › Tình hình" ra mẫu Hỏi (coTheBao false, coTheHoi true).
 */
import { emailThu } from '../seed/emailThu.ts';

export async function runPrCxBpxlTests(t: any) {
  const { check, assert, conn, P, TODAY, classId, addDays } = t;
  console.log('\nGÓI 4 CX-BPXL · N63 ① ② ⑤ · P1-06 · A3-06');
  const thu = (fn: () => void) => { conn.exec('BEGIN IMMEDIATE'); try { fn(); } finally { conn.exec('ROLLBACK'); } };
  const accounts: any = await import('../platform/accounts.ts');
  const { loadPrincipal } = await import('../permissions.ts');
  const intake: any = await import('../classes/intake.ts');
  const { boLichTuTao } = await import('./luotThu.ts');
  const { LUOT_SAU_THI_SQL } = await import('../students/tamDung.ts');
  const ph: any = await import('../yThuc/phoiHop.ts');
  const { myWork } = await import('../worklist/mywork.ts');
  const { xoaNho } = await import('../platform/nguCanhRequest.ts');
  const profile: any = await import('../students/profile.ts');
  const ltt: any = await import('../classes/loTrinhTiep.ts');
  const htcn: any = await import('../classes/hoanTacChuyenNgay.ts');
  const tr: any = await import('../classes/transition.ts');
  const { coTheRaLenh } = await import('../classes/quyenChuyenLop.ts');
  const svc: any = await import('../fasttrack/attempts.ts');
  const ab: any = await import('../fasttrack/absence.ts');
  const xu: any = await import('../yThuc/xuLy.ts');
  const board: any = await import('../yThuc/board.ts');
  const viol: any = await import('../yThuc/violations.ts');
  const week: any = await import('../platform/week.ts');
  const one = (sql: string, ...a: unknown[]) => conn.prepare(sql).get(...a) as any;
  const ma = (fn: () => unknown): number | null => { try { fn(); return null; } catch (e: any) { return e?.status ?? -1; } };
  let seq = 0;
  const taiKhoan = (role: string, cn = 'MB') => loadPrincipal(accounts.createAccount(P.admin, {
    email: `goi4.${role}.${++seq}${accounts.EMAIL_SUFFIX}`, password: `matkhau-goi4-${role}`, fullName: `GOI4 ${role.toUpperCase()} ${seq}`, roles: [{ role, branches: [cn] }],
  }).userId as number);
  const cx = taiKhoan('cx'); const bpxl = taiKhoan('scheduler');
  const lop = classId('MB FT 101');
  const mbId = one('SELECT branch_id FROM classes WHERE id = ?', lop).branch_id as number;
  const lopThuong = one(`SELECT c.id FROM classes c JOIN programmes pg ON pg.code = c.programme_code
      WHERE c.branch_id = ? AND c.status = 'active' AND pg.scoring_mode = 'ratio' ORDER BY c.id LIMIT 1`, mbId)?.id as number;
  const moiEm = (l = lop) => {
    const ten = `GOI4 em ${++seq}`;
    intake.commitIntake(P.admin, { classId: l, rows: [{ fullName: ten, target: 7, email: emailThu(), dob: '2010-01-01' }], idempotencyKey: `goi4-${ten}` });
    const sid = one('SELECT id FROM students WHERE full_name = ?', ten).id as number;
    const cy = one("SELECT id FROM learning_cycles WHERE student_id = ? AND status = 'active'", sid).id as number;
    boLichTuTao(conn, cy);
    return { sid, cy };
  };

  check('P1-06 · hồ sơ HV của CX: Kết quả meeting của CX ở "của bạn" (không "Chưa có người phụ trách"), cùng khoá với /my-work', () => thu(() => {
    const { sid } = moiEm();
    const att = one(`SELECT a.id FROM assessment_attempts a WHERE a.status != 'cancelled' AND NOT ${LUOT_SAU_THI_SQL('a')}
        AND NOT EXISTS (SELECT 1 FROM sos_coordination_actions x WHERE x.attempt_id = a.id AND x.kind = 'cx_meeting_student') LIMIT 1`).id;
    const aid = Number(conn.prepare(`INSERT INTO sos_coordination_actions (attempt_id, student_id, kind, preset, status, created_at) VALUES (?, ?, 'cx_meeting_student', 1, 'pending', ?)`)
      .run(att, sid, new Date().toISOString()).lastInsertRowid);
    ph.confirmCoordination(P.coreTeacher, aid, { performedOn: TODAY, note: 'Cần họp CX với em' });
    const kq = one(`SELECT id FROM meeting_phan WHERE phoi_hop_id = ? AND phan = 'ket_qua'`, aid).id as number;
    xoaNho();
    const v = profile.studentProfile(cx, sid).dauHoSo.viec;
    const khoa = `meeting_ket_qua:${kq}`;
    assert(v.cuaBan.some((x: any) => x.key === khoa), `cuaBan: ${JSON.stringify(v.cuaBan.map((x: any) => x.key))} · nguoiKhac: ${JSON.stringify(v.nguoiKhac.map((x: any) => [x.key, x.nguoi?.ten]))}`);
    assert(!v.nguoiKhac.some((x: any) => x.key === khoa), 'không còn ở "người khác"');
    xoaNho();
    const mw = ((myWork(cx, {}) as any).items as any[]).filter((x) => x.mine && x.studentId === sid).map((x) => x.key).sort();
    const hs = v.cuaBan.map((x: any) => x.key).sort();
    assert(JSON.stringify(mw) === JSON.stringify(hs), `hai đường khác: /my-work ${JSON.stringify(mw)} ≠ hồ sơ ${JSON.stringify(hs)}`);
  }));

  check('N63 ① · CX không chốt lộ trình Cuối khoá / nháp / Lộ trình tiếp theo (403); Cuối khoá chỉ xem; Head được; CX vẫn ra lệnh chuyển lớp lẻ', () => thu(() => {
    assert(lopThuong, 'thiếu lớp thường MB');
    const { sid } = moiEm(lopThuong);
    const cam = [
      ['luuNhap', () => ltt.luuNhap(cx, lopThuong, { items: [] })],
      ['xoaNhap', () => ltt.xoaNhap(cx, lopThuong, sid)],
      ['ghiLoTrinhTiepCaLop', () => ltt.ghiLoTrinhTiepCaLop(cx, lopThuong, { items: [] })],
      ['ghiLoTrinhTiep', () => ltt.ghiLoTrinhTiep(cx, sid, { huong: 'len_lop' })],
      ['chotCaLop', () => htcn.chotCaLop(cx, lopThuong, { dongs: [] })],
      ['lopKhacChiNhanh', () => tr.lopKhacChiNhanh(cx, lopThuong)],
    ] as const;
    const sai = cam.filter(([, f]) => ma(f) !== 403).map(([k, f]) => `${k}: ${ma(f)}`);
    assert(!sai.length, `CX phải 403: ${sai.join(' | ')}`);
    assert(tr.transitionPlan(cx, lopThuong).coTheRaLenh === false, 'Cuối khoá của CX: coTheRaLenh false');
    assert(tr.transitionPlan(P.mbManager, lopThuong).coTheRaLenh === true, 'Head vẫn chốt');
    assert(ma(() => ltt.luuNhap(P.mbManager, lopThuong, { items: [] })) === 400, 'Head qua cổng quyền (400 chưa có em)');
    assert(coTheRaLenh(cx, lopThuong), 'CX giữ quyền ra lệnh chuyển lớp lẻ (N52)');
  }));

  check('N63 ② · BPXL Khôi phục MT / kỹ năng: lượt / kỹ năng đã có điểm 403; chưa có điểm qua cổng quyền (lỗi nghiệp vụ 400, không 403)', () => thu(() => {
    const pid = (w: string) => week.ensurePeriod(w).id as number;
    const a = moiEm();
    const m = svc.createAttempt(P.admin, { studentId: a.sid, cycleId: a.cy, attemptNo: 1, periodId: pid('2026-09-14') }).id as number;
    assert(ma(() => ab.restoreCancelledSkill(bpxl, m, 'listening', pid('2026-09-21'))) === 400, 'kỹ năng chưa điểm: qua quyền, 400 "chưa bị huỷ"');
    assert(ma(() => svc.duaLaiCaLuot(bpxl, m)) === 400, 'lượt chưa điểm: qua quyền, 400 "không có kỹ năng đã huỷ"');
    svc.saveScore(P.admin, m, 'listening', { rawScore: 30, rawTotal: 40 });
    assert(ma(() => ab.restoreCancelledSkill(bpxl, m, 'listening', pid('2026-09-21'))) === 403, 'kỹ năng đã có điểm: 403');
    assert(ma(() => ab.restoreCancelledSkill(bpxl, m, 'reading', pid('2026-09-21'))) === 400, 'kỹ năng khác chưa điểm: vẫn qua quyền');
    assert(ma(() => svc.duaLaiCaLuot(bpxl, m)) === 403, 'lượt đã có điểm: 403');
    assert(ma(() => svc.duaLaiCaLuot(P.mbManager, m)) === 400, 'Head không bị chặn theo điểm');
  }));

  check('N63 ⑤ · BPXL không xem Ý thức (vi phạm · tab HV · tab lớp · khối hồ sơ) — 403 / null; Phối hợp của em vẫn xem; GV lớp vẫn xem', () => thu(() => {
    const { sid } = moiEm();
    viol.recordViolation(P.w1Teacher, { studentId: sid, category: 'conduct', ten: 'Nói chuyện riêng trong giờ', occurredOn: addDays(TODAY, -1) });
    xoaNho();
    const sai = [
      ['yThucHocVien', () => xu.yThucHocVien(bpxl, sid, { phamVi: 'chuoi' })],
      ['bangYThucLop', () => board.bangYThucLop(bpxl, lop)],
      ['listViolations', () => viol.listViolations(bpxl, { studentId: sid })],
    ].filter(([, f]) => ma(f as () => unknown) !== 403).map(([k]) => String(k));
    assert(!sai.length, `BPXL phải 403: ${sai.join(', ')}`);
    assert(profile.studentProfile(bpxl, sid).dauHoSo.yThuc == null, 'khối Ý thức hồ sơ HV: null');
    assert(ma(() => ph.coordinationOfStudent(bpxl, sid)) === null, 'Phối hợp của em vẫn xem được (việc Xếp lịch họp)');
    assert(ma(() => xu.yThucHocVien(P.coreTeacher, sid, { phamVi: 'chuoi' })) === null, 'GVCN vẫn xem');
  }));

  check('A3-06 · CX "+ Task › Tình hình": mẫu Hỏi (coTheBao false · coTheHoi true) ở hồ sơ HV và tab lớp; GV vẫn mẫu Báo', () => thu(() => {
    const { sid } = moiEm();
    xoaNho();
    const hv = xu.yThucHocVien(cx, sid, { phamVi: 'chuoi' });
    assert(hv.coTheBao === false && hv.coTheHoi === true, `HV: ${JSON.stringify({ bao: hv.coTheBao, hoi: hv.coTheHoi })}`);
    const bl = board.bangYThucLop(cx, lop);
    assert(bl.coTheBao === false && bl.coTheHoi === true, `lớp: ${JSON.stringify({ bao: bl.coTheBao, hoi: bl.coTheHoi })}`);
    assert(xu.yThucHocVien(P.w1Teacher, sid, { phamVi: 'chuoi' }).coTheBao === true, 'GV lớp vẫn Báo');
  }));
}
