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
  const { xoaNho, voiXacNhan } = await import('../platform/nguCanhRequest.ts');
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
  const dongHv: any = await import('../classes/dongHocVien.ts');
  const ss: any = await import('../fasttrack/skillSchedule.ts');
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

  const lenh: any = await import('../classes/lenhChuyen.ts');
  const llt: any = await import('../classes/luatLoTrinh.ts');
  check('N63 ① (rà PTA #1950) · CX không Hoàn tác lần chốt cả lớp (403, ghi danh không đổi); Hoàn tác chuyển một em giữ; Head Hoàn tác được', () => thu(() => {
    const { sid } = moiEm(lopThuong);
    const ghi = (doi: { bang: 'students' | 'classes'; id: number }) => htcn.chuyenNgayCoHoanTac(P.mbManager, [sid], [lopThuong], () => {
      conn.prepare(`UPDATE enrollments SET status = 'transferred' WHERE student_id = ? AND class_id = ? AND status = 'active'`).run(sid, lopThuong);
      return { ok: true };
    }, () => true, doi).dao as number;
    const tt = () => one(`SELECT status FROM enrollments WHERE student_id = ? AND class_id = ? ORDER BY id DESC LIMIT 1`, sid, lopThuong).status;
    const dao = ghi({ bang: 'classes', id: lopThuong });
    assert(ma(() => htcn.hoanTacChuyenNgay(cx, lopThuong, dao, 'classes')) === 403 && tt() === 'transferred', `CX Hoàn tác chốt cả lớp: ${tt()}`);
    assert(ma(() => htcn.hoanTacChuyenNgay(P.mbManager, lopThuong, dao, 'classes')) === null && tt() === 'active', 'Head Hoàn tác được');
    const dao2 = ghi({ bang: 'students', id: sid });
    assert(ma(() => htcn.hoanTacChuyenNgay(cx, sid, dao2, 'students')) === null && tt() === 'active', 'CX Hoàn tác chuyển lớp một em (N52) giữ');
  }));

  check('N63 ① (rà PTA #1950) · CX ra lệnh chuyển lớp lẻ thật (giữa khoá) được; ghi đè / sửa / huỷ / huỷ nhiều / khôi phục lệnh Cuối khoá của Head 403, lệnh không đổi; lệnh CX tự ra sửa / huỷ / khôi phục được; Head huỷ được', () => thu(() => {
    const ft = lop;
    const a = moiEm(ft).sid;
    const tuan = llt.xemChuyenLop(P.mbManager, a).tuanChon[1];
    const dich = classId('MB FT 102');
    const r = lenh.raLenh(cx, { lopNguonId: ft, boiCanh: 'giua-khoa', tuanChung: tuan, dongs: [lenh.dongTuBody({ studentId: a, huong: 'chuyen_lop', toClassId: dich, lyDo: 'CX chuyển lẻ' })] });
    assert(r.ok.includes(a) && !r.failed.length, `CX ra lệnh lẻ: ${JSON.stringify(r.failed)}`);
    const { sid: b } = moiEm(lopThuong);
    const ck = Number(conn.prepare(`INSERT INTO lenh_chuyen_lop (student_id, lop_nguon_id, huong, boi_canh, tuan_bat_dau, nguoi_ra_lenh, ngay_ra_lenh, trang_thai, tao_luc)
        VALUES (?, ?, 'hoc_lai', 'cuoi-khoa', ?, ?, ?, 'cho', ?)`).run(b, lopThuong, tuan, P.mbManager.userId, TODAY, new Date().toISOString()).lastInsertRowid);
    const anh = () => JSON.stringify(one('SELECT huong, trang_thai, tuan_bat_dau FROM lenh_chuyen_lop WHERE id = ?', ck));
    const truoc = anh();
    assert(ma(() => lenh.suaLenh(cx, ck, { huong: 'len_lop' })) === 403, 'CX sửa lệnh Cuối khoá 403');
    assert(ma(() => lenh.huyLenh(cx, ck)) === 403, 'CX huỷ lệnh Cuối khoá 403');
    assert(ma(() => lenh.huyNhieuLenh(cx, [ck], null)) === 403, 'CX huỷ nhiều lệnh Cuối khoá 403');
    /* Vòng 2: ghi đè lệnh Cuối khoá của Head qua đường ra lệnh một em → 403, lệnh không đổi. */
    assert(ma(() => lenh.raLenh(cx, { lopNguonId: lopThuong, boiCanh: 'cuoi-khoa', tuanChung: tuan, dongs: [lenh.dongTuBody({ studentId: b, huong: 'bao_luu', lyDo: 'CX ghi đè' })] })) === 403, 'CX ghi đè lệnh Cuối khoá của Head 403');
    assert(anh() === truoc, `lệnh đổi: ${truoc} → ${anh()}`);
    /* Vòng 2: lệnh Cuối khoá CX TỰ ra (chuyển lẻ sát Final) — CX sửa / huỷ / khôi phục được (không khoá cứng lệnh của chính mình). */
    const { sid: c } = moiEm(lopThuong);
    const cua = Number(conn.prepare(`INSERT INTO lenh_chuyen_lop (student_id, lop_nguon_id, huong, boi_canh, tuan_bat_dau, ngay_xem_lai, nguoi_ra_lenh, ngay_ra_lenh, trang_thai, tao_luc)
        VALUES (?, ?, 'bao_luu', 'cuoi-khoa', ?, ?, ?, ?, 'cho', ?)`).run(c, lopThuong, tuan, addDays(TODAY, 60), cx.userId, TODAY, new Date().toISOString()).lastInsertRowid);
    const loiSua = (() => { try { lenh.suaLenh(cx, cua, { lyDo: 'CX sửa lý do' }); return null; } catch (e: any) { return `${e?.status} ${e?.message}`; } })();
    assert(loiSua === null, `CX sửa lệnh của mình: ${loiSua}`);
    assert(ma(() => lenh.huyLenh(cx, cua)) === null && one('SELECT trang_thai FROM lenh_chuyen_lop WHERE id = ?', cua).trang_thai === 'huy', 'CX huỷ lệnh của mình');
    const kp0 = lenh.khoiPhucLenh(cx, [cua]);
    assert(kp0.ok.includes(cua), `CX khôi phục lệnh của mình: ${JSON.stringify(kp0)}`);
    lenh.huyLenh(P.mbManager, ck);
    assert(ma(() => lenh.khoiPhucLenh(cx, [ck])) === 403 && one('SELECT trang_thai FROM lenh_chuyen_lop WHERE id = ?', ck).trang_thai === 'huy', 'CX khôi phục lệnh Cuối khoá 403');
  }));

  check('N63 ⑤ (rà PTA #1950) · bảng HV lớp: BPXL không có nhãn / số Ý thức (canhBaoTheoHocVien rỗng, soEmCanXuLyYThuc 0); GVCN vẫn có', () => thu(() => {
    const dhv: any = dongHv;
    const { sid } = moiEm();
    viol.recordViolation(P.w1Teacher, { studentId: sid, category: 'conduct', ten: 'Nói chuyện riêng trong giờ', occurredOn: addDays(TODAY, -1) });
    xoaNho();
    assert(dhv.canhBaoTheoHocVien(bpxl, lop).size === 0 && dhv.soEmCanXuLyYThuc(bpxl, lop) === 0, 'BPXL thấy nhãn Ý thức');
    assert(dhv.canhBaoTheoHocVien(P.coreTeacher, lop).size > 0, 'GVCN mất nhãn Ý thức');
  }));

  check('N63 ② · BPXL Xoá / Khôi phục MT / kỹ năng: có điểm (đang có hoặc đang cất) 403, DB không đổi; chưa điểm qua cổng; Xoá rồi Hoàn tác được; khôi phục môn chưa điểm không bị chặn vì môn khác có điểm', () => thu(() => {
    const pid = (w: string) => week.ensurePeriod(w).id as number;
    const a = moiEm();
    const m = svc.createAttempt(P.admin, { studentId: a.sid, cycleId: a.cy, attemptNo: 1, periodId: pid('2026-09-14') }).id as number;
    const trongDot = () => JSON.stringify(conn.prepare('SELECT skill, required FROM attempt_skills WHERE attempt_id = ? ORDER BY skill').all(m));
    /* Chưa điểm: BPXL Xoá MT rồi Hoàn tác (Khôi phục đúng các môn vừa xoá). */
    const x = svc.xoaLuot(bpxl, m);
    assert(ma(() => svc.duaLaiCaLuot(bpxl, m, x.kyNang)) === null, 'BPXL Xoá rồi Hoàn tác');
    assert(ma(() => ab.restoreCancelledSkill(bpxl, m, 'listening', pid('2026-09-21'))) === 400, 'kỹ năng chưa điểm: qua quyền, 400 "chưa bị huỷ"');
    /* Có điểm L: Xoá MT 403 (trước câu hỏi), không đổi gì. */
    svc.saveScore(P.admin, m, 'listening', { rawScore: 30, rawTotal: 40 });
    const t0 = trongDot();
    assert(ma(() => svc.xoaLuot(bpxl, m)) === 403 && trongDot() === t0, 'Xoá MT đã có điểm: 403, không đổi');
    assert(ma(() => ab.restoreCancelledSkill(bpxl, m, 'listening', pid('2026-09-21'))) === 403, 'khôi phục kỹ năng đã có điểm: 403');
    assert(ma(() => ab.restoreCancelledSkill(bpxl, m, 'reading', pid('2026-09-21'))) === 400, 'kỹ năng khác chưa điểm: vẫn qua quyền');
    /* Bỏ R (chưa điểm) khỏi đợt: BPXL đưa lại R được dù L có điểm (P2-a). */
    ss.setSkillScope(P.admin, m, 'reading', false, 'Thử');
    assert(ma(() => svc.duaLaiCaLuot(bpxl, m, ['reading'])) === null, 'đưa lại R chưa điểm bị chặn vì L có điểm');
    /* Huỷ điểm L (cất, chờ "Khôi phục điểm") rồi bỏ L: BPXL đưa lại L 403 (điểm đang cất), Head được. */
    voiXacNhan(() => svc.saveScore(P.admin, m, 'listening', { rawScore: null, criteria: [null, null, null, null], lyDo: 'Thử huỷ điểm' }));
    assert(one(`SELECT COUNT(*) n FROM ket_qua_huy WHERE attempt_id = ? AND khoi_phuc_luc IS NULL`, m).n > 0, 'chưa có bản cất điểm');
    ss.setSkillScope(P.admin, m, 'listening', false, 'Thử');
    const t1 = trongDot();
    assert(ma(() => svc.duaLaiCaLuot(bpxl, m, ['listening'])) === 403 && trongDot() === t1, 'đưa lại L có điểm cất: 403, không đổi');
    assert(ma(() => svc.duaLaiCaLuot(P.mbManager, m, ['listening'])) === null, 'Head không bị chặn theo điểm');
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
