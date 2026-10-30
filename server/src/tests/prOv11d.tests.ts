/**
 * PHÉP KIỂM PR-OV11d — hồ sơ học viên · Case: không kẹt sau Tạm dừng / Lưu trữ / Bước tiếp; nút hiện = máy chủ cho (đặc tả rà soát 14/10, kế hoạch OV-11d mục Kiểm):
 *   (1) HV-10: GVCN Tạm dừng em lớp mình → vẫn sửa hồ sơ, Quay lại học, xử lý Ý thức; GVCN lớp khác 403. HV-21: Hoàn tác Tạm dừng trả nguyên trạng, hạn không đổi;
 *   (2) HV-6: Bước tiếp Học lại / đổi Kết thúc → Học lại với em còn ghi danh → chạy được, một giao dịch, lỗi giữa chừng quay lui; Hoàn tác trả em về đang học;
 *   (3) HV-3 (Q4): hồ sơ Lưu trữ → sửa hồ sơ / lộ trình / thi thật / + Case / ghi bù 400; Bỏ lưu trữ rồi sửa được; menu không còn mục sửa;
 *   (4) HV-2: Đề xuất sửa — Admin / TVV / CX 403, GV của lớp 200; nút hồ sơ cùng hàm; (5) HV-17: KQĐR chỉ em Lên FT;
 *   (6) HV-13: hạn bàn giao panel = lệnh = thanh việc; (7) HV-4: ô Học thuật "chưa có điểm"; câu tóm tắt KCK không đẩy mất việc có hạn;
 *   (8) Q3: Sửa thông tin thiếu ngày sinh / email → lưu được, sai dạng 400; (9) Q8: đổi KCK — QL / TVV được, GVCN / CX / Admin 403.
 * Mỗi ca cuộn lại (`thu`).
 */
import type { YThucTestKit } from './yThuc.tests.ts';

export async function runPrOv11dTests(t: YThucTestKit) {
  const { check, assert, conn, P, classId, TODAY } = t;
  const students: any = await import('../students/students.ts');
  const profile: any = await import('../students/profile.ts');
  const buocTiep: any = await import('../loTrinh/buocTiep.ts');
  const deXuat: any = await import('../duyet/deXuatSua.ts');
  const cuoiKhoa: any = await import('../normal/cuoiKhoa.ts');
  const cases: any = await import('../cases/cases.ts');
  const cycles: any = await import('../fasttrack/cycles.ts');
  const accounts: any = await import('../platform/accounts.ts');
  const lenh: any = await import('../classes/lenhChuyen.ts');
  const luat: any = await import('../classes/luatLoTrinh.ts');
  const yThuc: any = await import('../yThuc/access.ts');
  const { can, loadPrincipal } = await import('../permissions.ts');
  const d: any = await import('../../../shared/domain/index.ts');
  const { xoaNho } = await import('../platform/nguCanhRequest.ts');
  console.log('\nPR-OV11d · hồ sơ HV · Case — không kẹt (Tạm dừng / Lưu trữ / Bước tiếp), nút hiện = máy chủ cho');

  const all = (sql: string, ...a: unknown[]) => conn.prepare(sql).all(...a) as any[];
  const one = (sql: string, ...a: unknown[]) => all(sql, ...a)[0];
  const loi = (fn: () => unknown): any => { try { fn(); } catch (e) { return e; } return null; };
  const thu = <T>(fn: () => T): T => {
    conn.exec('BEGIN IMMEDIATE');
    try { xoaNho(); return fn(); } finally { conn.exec('ROLLBACK'); xoaNho(); }
  };
  const FT101 = classId('MB FT 101');
  const GVCN = P.coreTeacher, GVBM = P.subjectTeacher, QL = P.mbManager;
  /* GVCN một lớp KHÁC, không có phân công nào ở MB FT 101 (chi nhánh ít GV — một người có thể chủ nhiệm nhiều lớp). */
  const GVCN_KHAC = loadPrincipal(one(`SELECT user_id id FROM teacher_assignments WHERE is_core = 1 AND status = 'active'
    AND user_id NOT IN (SELECT user_id FROM teacher_assignments WHERE class_id = ?) ORDER BY id LIMIT 1`, FT101).id);
  let seq = 0;
  const tao = (roles: { role: string; branches: string[] }[]) => {
    seq += 1;
    return loadPrincipal(accounts.createAccount(P.admin, { email: `ov11d.${seq}${accounts.EMAIL_SUFFIX}`, password: 'matkhau-ov11d', fullName: `Thử OV11d ${seq}`, roles }).userId as number);
  };
  const TVV = tao([{ role: 'consultant', branches: ['MB'] }]);
  const CX = tao([{ role: 'cx', branches: [] }]);
  const ADMIN = tao([{ role: 'office_admin', branches: ['MB'] }]);
  /* Em đang học MB FT 101, có Case mở còn hạn xác nhận (để soi "hạn không đổi"). */
  const emFt = () => (one(`SELECT e.student_id id FROM enrollments e JOIN students s ON s.id = e.student_id
      WHERE e.class_id = ? AND e.status = 'active' AND s.status = 'active' AND s.archived_at IS NULL
      ORDER BY EXISTS (SELECT 1 FROM sos_cases sc WHERE sc.student_id = s.id AND sc.status != 'done' AND sc.han_xac_nhan IS NOT NULL) DESC, s.id LIMIT 1`, FT101)).id as number;
  const hanCua = (sid: number) => JSON.stringify({
    c: all('SELECT id, han_xac_nhan, follow_until FROM sos_cases WHERE student_id = ? ORDER BY id', sid),
    v: all('SELECT * FROM violations WHERE student_id = ? ORDER BY id', sid),
  });

  check('OV11d-1 → P7 · HV-10: GVCN Tạm dừng em lớp mình → em vào Lưu trữ: chỉ sửa thông tin liên hệ ([ĐX]), xử lý Ý thức, Quay lại học (GVCN lớp khác 403); ⋯ một mục "Tạm dừng/ Kết thúc học"', () => thu(() => {
    const sid = emFt();
    students.setStudentStatus(GVCN, sid, 'inactive', TODAY, 'Thử Tạm dừng OV11d');
    xoaNho();
    assert(one('SELECT status FROM students WHERE id = ?', sid).status === 'inactive', 'chưa Tạm dừng');
    assert(loi(() => students.updateStudent(GVCN, sid, { note: 'Ghi chú sau Tạm dừng' }))?.message === d.CAU_LUU_TRU, 'P7: hồ sơ em Tạm dừng (Lưu trữ) chỉ xem');
    /* QUYEN-LIEN-HE (luật 13/10 nay ở máy chủ): liên hệ em Tạm dừng — GVCN 403, QL / TVV sửa được (TVV gọi mời học lại). */
    assert(loi(() => students.updateStudent(GVCN, sid, { parentPhone: '0912345678' }))?.status === 403, 'GVCN không sửa liên hệ');
    students.updateStudent(P.mbManager, sid, { parentPhone: '0912345678' });
    assert(one('SELECT parent_phone FROM students WHERE id = ?', sid).parent_phone === '0912345678', 'P7 [ĐX]: sửa được thông tin liên hệ em Tạm dừng');
    assert(yThuc.canManageDiscipline(GVCN, sid), 'GVCN phải xử lý được Ý thức em Tạm dừng');
    const hs = profile.studentProfile(GVCN, sid);
    assert(hs.viewer.canEdit && hs.lopHoc.quyen.quayLai && hs.lopHoc.quyen.ketThuc, `cờ quyền: ${JSON.stringify({ e: hs.viewer.canEdit, q: hs.lopHoc.quyen })}`);
    const muc = d.mucQuanLyHocVien({ canEdit: true, lopHoc: hs.lopHoc, cycle: hs.cycle, status: hs.status });
    assert(muc.find((m: any) => m.key === 'tam-dung-ket-thuc')?.nhan === 'Tạm dừng/ Kết thúc học' && muc.some((m: any) => m.key === 'quay-lai'), JSON.stringify(muc.map((m: any) => m.nhan)));
    assert(loi(() => students.updateStudent(GVCN_KHAC, sid, { note: 'x' }))?.status === 403, 'GVCN lớp khác phải 403');
    assert(!yThuc.canManageDiscipline(GVCN_KHAC, sid), 'GVCN lớp khác không xử lý Ý thức');
    /* rà bảo mật: em Tạm dừng không đi nhánh "xếp lớp lần đầu" — GVCN gọi thẳng API chuyển em sang lớp khác mình chủ nhiệm → 403 */
    const lopKhac = one(`SELECT class_id id FROM teacher_assignments WHERE user_id = ? AND is_core = 1 AND status = 'active' AND class_id != ? LIMIT 1`, GVCN.userId, FT101)?.id ?? FT101;
    assert(loi(() => students.transferStudent(GVCN, sid, lopKhac, TODAY, 'Thử chuyển', { noNote: true, note: 'x' }))?.status === 403, 'GVCN chuyển em Tạm dừng phải 403');
    students.setStudentStatus(GVCN, sid, 'active', TODAY);
    assert(one('SELECT status FROM students WHERE id = ?', sid).status === 'active', 'GVCN phải Quay lại học được');
  }));

  check('OV11d-1b · HV-21: Hoàn tác Tạm dừng → em đang học, ghi danh active, bỏ mốc Tạm dừng, hạn Case / Ý thức không đổi; Hoàn tác lần hai 409', () => thu(() => {
    const sid = emFt();
    const truoc = hanCua(sid);
    const soMoc = one(`SELECT COUNT(*) n FROM journey_events WHERE student_id = ? AND event_type IN ('pause', 'resume')`, sid).n;
    students.setStudentStatus(GVCN, sid, 'inactive', TODAY, 'Bấm nhầm');
    xoaNho();
    students.hoanTacTamDung(GVCN, sid);
    xoaNho();
    assert(one('SELECT status FROM students WHERE id = ?', sid).status === 'active', 'em phải về đang học');
    assert(one(`SELECT status FROM enrollments WHERE student_id = ? AND class_id = ?`, sid, FT101).status === 'active', 'ghi danh phải về active');
    assert(one(`SELECT COUNT(*) n FROM journey_events WHERE student_id = ? AND event_type IN ('pause', 'resume')`, sid).n === soMoc, 'mốc Tạm dừng / Quay lại phải như cũ');
    assert(hanCua(sid) === truoc, 'hạn Case / vi phạm bị tính lại');
    assert(loi(() => students.hoanTacTamDung(GVCN, sid))?.status === 409, 'Hoàn tác lần hai phải 409');
    assert(loi(() => students.hoanTacTamDung(GVCN_KHAC, sid))?.status === 403, 'GVCN lớp khác không hoàn tác');
  }));

  check('OV11d-1c · rà planning: Tạm dừng → QL chuyển lớp → lớp giữ đóng, đúng MỘT ghi danh active, em đang học, hạn chạy lại; GVCN cũ hết quyền (403)', () => thu(() => {
    const sid = emFt();
    students.setStudentStatus(GVCN, sid, 'inactive', TODAY, 'Thử Tạm dừng rồi chuyển lớp');
    xoaNho();
    const dich = one(`SELECT id FROM classes WHERE is_fast_track = 1 AND status = 'active' AND id != ? AND branch_id = (SELECT branch_id FROM classes WHERE id = ?)
      AND id NOT IN (SELECT class_id FROM teacher_assignments WHERE user_id = ?) ORDER BY id LIMIT 1`, FT101, FT101, GVCN.userId).id;
    students.transferStudent(QL, sid, dich, TODAY, 'Thử chuyển em Tạm dừng', { note: 'Bàn giao thử OV11d' });
    xoaNho();
    const gd = all(`SELECT class_id, status FROM enrollments WHERE student_id = ? AND status IN ('active', 'paused')`, sid);
    assert(gd.length === 1 && gd[0].status === 'active' && gd[0].class_id === dich, `ghi danh: ${JSON.stringify(gd)}`);
    assert(one('SELECT status FROM students WHERE id = ?', sid).status === 'active', 'em phải đang học');
    assert(one(`SELECT event_type FROM journey_events WHERE student_id = ? AND event_type IN ('pause', 'resume') ORDER BY id DESC LIMIT 1`, sid).event_type === 'resume', 'khoảng Tạm dừng phải khép (hạn chạy lại)');
    assert(loi(() => students.updateStudent(GVCN, sid, { note: 'x' }))?.status === 403, 'GVCN lớp cũ PATCH phải 403');
    assert(!yThuc.canManageDiscipline(GVCN, sid), 'GVCN lớp cũ không còn xử lý Ý thức');
    assert(loi(() => students.setStudentStatus(GVCN, sid, 'inactive', TODAY))?.status === 403, 'GVCN lớp cũ không Tạm dừng được');
  }));

  /* Em lộ trình FT đã đóng mà còn ghi danh (demo UB FT 401). */
  const dongCon = buocTiep.emDongConGhiDanh(conn) as any[];
  check('OV11d-2 · HV-6: câu đếm chỉ đọc thấy em lộ trình FT đã đóng mà còn ghi danh', () => {
    assert(dongCon.length > 0 && dongCon.every((r) => ['completed', 'abandoned'].includes(r.cycle_status)), JSON.stringify(dongCon));
    assert(/^SELECT /.test(buocTiep.SQL_DONG_CON_GHI_DANH.trim()) && !/\b(UPDATE|INSERT|DELETE)\b/i.test(buocTiep.SQL_DONG_CON_GHI_DANH), 'câu kiểm phải chỉ đọc');
  });

  check('OV11d-2b · HV-6: Bước tiếp Học lại (em còn ghi danh) → 200 · Hoàn tác về đang học · Kết thúc → Học lại chạy được · lỗi giữa chừng quay lui', () => thu(() => {
    const r = dongCon[0];
    const sid = r.id as number, cid = r.cycle_id as number;
    const qlId = one(`SELECT ur.user_id id FROM user_roles ur JOIN roles ro ON ro.id = ur.role_id
      WHERE ro.key = 'manager' AND ur.branch_id = (SELECT c.branch_id FROM enrollments e JOIN classes c ON c.id = e.class_id WHERE e.student_id = ? AND e.status = 'active' LIMIT 1) LIMIT 1`, sid).id;
    const QLX = loadPrincipal(qlId);
    if (!buocTiep.trangThaiBuocTiep(QLX, cid)) conn.prepare('UPDATE learning_cycles SET thi_that_khong_thi = 1 WHERE id = ?').run(cid);
    const lop0 = one(`SELECT class_id FROM enrollments WHERE student_id = ? AND status = 'active'`, sid).class_id;
    const soLtActive = () => one(`SELECT COUNT(*) n FROM learning_cycles WHERE student_id = ? AND status = 'active'`, sid).n;
    const lt0 = soLtActive();
    /* panel Học lại (xem trước) thấy lớp đang giữ — không "Chưa có lớp để học lại" */
    const xt = students.lopChoHocLai(QLX, sid);
    assert(xt.conHoc && xt.lopCu?.id === lop0 && !xt.loTrinh.chayTiep, `xem trước Học lại: ${JSON.stringify(xt.lopCu)}`);
    /* lỗi giữa chừng (lớp mới không hợp lệ) → cả giao dịch quay lui: em vẫn đang học */
    const e1 = loi(() => buocTiep.chonBuocTiep(QLX, cid, { chon: 'hoc_tiep', lopMoiId: 999999 }));
    xoaNho();
    assert(e1?.status === 400 && one('SELECT status FROM students WHERE id = ?', sid).status !== 'finished'
      && one(`SELECT status FROM enrollments WHERE student_id = ? AND class_id = ?`, sid, lop0).status === 'active', `quay lui: ${e1?.message}`);
    const hl = buocTiep.chonBuocTiep(QLX, cid, { chon: 'hoc_lai' });
    xoaNho();
    assert(hl?.chon === 'hoc_lai' && one('SELECT status, archived_at FROM students WHERE id = ?', sid).status === 'active' && soLtActive() === 1, `Học lại: ${JSON.stringify(hl)}`);
    buocTiep.boChonBuocTiep(QLX, cid);
    xoaNho();
    const s = one('SELECT status, archived_at FROM students WHERE id = ?', sid);
    assert(s.status === 'active' && !s.archived_at && one(`SELECT status FROM enrollments WHERE student_id = ? AND class_id = ?`, sid, lop0).status === 'active' && soLtActive() === lt0,
      `Hoàn tác phải trả em về đang học như trước: ${JSON.stringify({ em: r, ...s })} · lộ trình chạy ${soLtActive()}`);
    buocTiep.chonBuocTiep(QLX, cid, { chon: 'ket_thuc' });
    xoaNho();
    assert(one('SELECT status FROM students WHERE id = ?', sid).status === 'finished', 'Kết thúc');
    const doi = buocTiep.chonBuocTiep(QLX, cid, { chon: 'hoc_lai' });
    xoaNho();
    assert(doi?.chon === 'hoc_lai' && one('SELECT status FROM students WHERE id = ?', sid).status === 'active', `đổi Kết thúc → Học lại: ${JSON.stringify(doi)}`);
  }));

  check('OV11d-3 · HV-3 (Q4): hồ sơ Lưu trữ → sửa hồ sơ / lộ trình / + Case / ghi bù 400 "Bỏ lưu trữ trước"; Bỏ lưu trữ rồi sửa → 200; menu không còn mục sửa', () => thu(() => {
    const sid = one('SELECT id FROM students WHERE archived_at IS NOT NULL ORDER BY id LIMIT 1').id as number;
    const cy = one('SELECT id FROM learning_cycles WHERE student_id = ? ORDER BY seq DESC LIMIT 1', sid)?.id as number | undefined;
    const ql = can(QL, d.PERMISSIONS.CYCLE_EDIT, { studentId: sid }) ? QL : P.admin;
    const la400 = (e: any) => e?.status === 400 && e.message === d.CAU_LUU_TRU;
    assert(la400(loi(() => students.updateStudent(ql, sid, { phone: '0912345678' }))), 'PATCH /students/:id phải 400');
    assert(la400(loi(() => students.updateStudent(CX, sid, { phone: '0912345678' }))), 'CX PATCH phải 400');
    if (cy) assert(la400(loi(() => students.chanLuuTru(ql, cy))), 'đường /cycles/:id… phải 400');
    assert(la400(loi(() => students.chanLuuTruHv(ql, sid))), 'POST /students/:id/cycles phải 400');
    assert(la400(loi(() => students.setStudentStatus(ql, sid, 'active', TODAY))), 'status → đang học phải 400 (chỉ qua Học lại / Bỏ lưu trữ)');
    const lopDich = one(`SELECT id FROM classes WHERE status = 'active' AND branch_id IN (SELECT branch_id FROM classes c JOIN enrollments e ON e.class_id = c.id WHERE e.student_id = ?) ORDER BY id LIMIT 1`, sid)?.id
      ?? one(`SELECT id FROM classes WHERE status = 'active' ORDER BY id LIMIT 1`).id;
    assert(la400(loi(() => students.transferStudent(ql, sid, lopDich, TODAY, 'Thử chuyển em lưu trữ', { noNote: true }))), 'chuyển / xếp lớp em Lưu trữ phải 400');
    assert(la400(loi(() => cases.reportIssue(ql, { studentId: sid, topic: 'listening', title: 'Thử Case hồ sơ lưu trữ', summary: 'Em nghe sót số và tên riêng ở Part 1.', urgency: 'attention' }))), '+ Case phải 400');
    assert(la400(loi(() => cases.backfillCase(ql, { studentId: sid, topic: 'listening', primaryCode: 'x', summary: 'Thử ghi bù hồ sơ lưu trữ', fromDate: '2026-08-03', toDate: '2026-08-10', actions: [] }))), 'ghi bù phải 400');
    const muc = d.mucQuanLyHocVien({ canEdit: true, suaThongTin: true, suaThem: true, lopHoc: { chiXem: true, quyen: { boLuuTru: true, hocLai: true } }, cycle: { ratio: false }, status: 'finished' }).map((m: any) => m.key);
    assert(!muc.some((k: string) => ['info', 'lo-trinh', 'outcome'].includes(k)) && muc.includes('quay-lai'), JSON.stringify(muc));   // P7: Quay lại học thay Bỏ lưu trữ + Học lại
    students.unarchiveStudent(ql, sid);
    students.updateStudent(ql, sid, { phone: '0912345678' });
    assert(one('SELECT phone FROM students WHERE id = ?', sid).phone === '0912345678', 'Bỏ lưu trữ rồi sửa phải lưu');
  }));

  check('OV11d-4 · HV-2: Đề xuất sửa — Admin / TVV / CX 403, GV của lớp em (GVCN, GVBM) 200; nút hồ sơ cùng hàm', () => thu(() => {
    const sid = emFt();
    const gui = (p: any, truong = 'khac') => loi(() => deXuat.guiDeXuatSua(p, sid, { truong, moi: 'Cập nhật thông tin thử OV11d', lyDo: 'Thử quyền' }));
    for (const [ten, p] of [['Admin', ADMIN], ['TVV', TVV], ['CX', CX]] as const) {
      assert(gui(p)?.status === 403, `${ten} gửi đề xuất phải 403`);
      assert(!profile.studentProfile(p, sid).viewer.coTheDeXuatSua, `${ten} không có nút Đề xuất sửa`);
    }
    assert(gui(GVBM) === null, 'GVBM của lớp gửi được');
    conn.prepare(`DELETE FROM yeu_cau_duyet WHERE hoc_vien_id = ? AND doi_tuong_loai = 'student:khac' AND trang_thai = 'cho'`).run(sid);   // một thẻ chờ mỗi trường
    assert(gui(GVCN) === null, 'GVCN của lớp gửi được');
    assert(profile.studentProfile(GVBM, sid).viewer.coTheDeXuatSua, 'GVBM có nút');
  }));

  check('OV11d-4b · HV-1: đề xuất Target đang chờ → hồ sơ trả "đang chờ duyệt" (người gửi sửa được), gửi trùng nói chỗ sửa; chữ "Target" viết hoa', () => thu(() => {
    const sid = emFt();
    const cy = one(`SELECT target_score, khong_cam_ket FROM learning_cycles WHERE student_id = ? AND status = 'active'`, sid);
    const moi = cy.target_score === 7 ? 7.5 : 7;
    deXuat.guiDeXuatSua(GVCN, sid, { truong: 'target', moi: cy.khong_cam_ket ? `${moi} KCK` : moi, lyDo: 'PH đăng ký thi' });
    const dx = profile.studentProfile(GVCN, sid).deXuatTarget;
    assert(dx && dx.cuaToi && Number(d.tachKck(dx.moi).so) === moi, JSON.stringify(dx));
    assert(!profile.studentProfile(QL, sid).deXuatTarget.cuaToi, 'QL thấy nhưng không phải của mình');
    const e = loi(() => deXuat.guiDeXuatSua(GVCN, sid, { truong: 'target', moi: cy.khong_cam_ket ? `${moi + 0.5} KCK` : moi + 0.5, lyDo: 'lần hai' }));
    assert(e?.status === 400 && /đề xuất sửa Target .*Yêu cầu của tôi/.test(e.message), e?.message);
  }));

  check('OV11d-5 · HV-17: Kết quả đầu ra chỉ em có lệnh / lộ trình Lên FT — em ELE không lên FT: không dòng, PUT 400 đúng lý do; có lệnh Lên FT: có dòng dù Final chưa điểm', () => thu(() => {
    const em = one(`SELECT s.id, e.class_id FROM enrollments e JOIN students s ON s.id = e.student_id JOIN classes c ON c.id = e.class_id
      WHERE e.status = 'active' AND c.programme_code IN ('BE', 'ELE') AND c.is_fast_track = 0
        AND NOT EXISTS (SELECT 1 FROM lenh_chuyen_lop l WHERE l.student_id = s.id) ORDER BY s.id LIMIT 1`);
    const ql = loadPrincipal(one(`SELECT ur.user_id id FROM user_roles ur JOIN roles r ON r.id = ur.role_id JOIN classes c ON c.branch_id = ur.branch_id WHERE r.key = 'manager' AND c.id = ? LIMIT 1`, em.class_id).id);
    const e = loi(() => cuoiKhoa.ghiKetLuanFt(ql, em.id, { dat: true }));
    assert(e?.status === 400 && /Chỉ em lên FT/.test(e.message), `phải 400 "Chỉ em lên FT…" (không "Chờ MT0"): ${e?.message}`);
    assert(!profile.studentProfile(ql, em.id).cuoiKhoa?.lenFt, 'em không lên FT không có dòng KQĐR');
    assert(d.chuHopKetLuan({ ct: 'ELE', tyLe: 0.8, scored: 4, required: 4, mon: [], goiY: null, quyetDinh: null, ketLuanFt: null }).kyVong === null, 'không lenFt → không kyVong');
    const dich = one(`SELECT id FROM classes WHERE is_fast_track = 1 AND status = 'active' LIMIT 1`).id;
    conn.prepare(`INSERT INTO lenh_chuyen_lop (student_id, lop_nguon_id, lop_dich_id, huong, boi_canh, tuan_bat_dau, nguoi_ra_lenh, ngay_ra_lenh, trang_thai, tao_luc)
      VALUES (?, ?, ?, 'fast_track', 'cuoi-khoa', ?, ?, ?, 'cho', ?)`).run(em.id, em.class_id, dich, TODAY, ql.userId, TODAY, TODAY);
    xoaNho();
    const ck = profile.studentProfile(ql, em.id).cuoiKhoa;
    assert(ck?.lenFt === true && d.chuHopKetLuan({ ct: ck.ct, ...ck }).kyVong, `em đã chốt Lên FT phải có dòng KQĐR: ${JSON.stringify(ck && { em: em.id, lop: ck.lop, daChuyen: ck.daChuyen, lenFt: ck.lenFt, scored: ck.scored })}`);
  }));

  check('OV11d-6 · HV-13: hạn bàn giao — panel Chuyển lớp (hanBanGiaoLenh từ dữ liệu xem trước) = hạn lưu trên lệnh = thanh "Việc của tôi"', () => thu(() => {
    const sid = emFt();
    const enr = luat.lopHienTaiCua(sid);
    const dich = one(`SELECT id FROM classes WHERE is_fast_track = 1 AND status = 'active' AND id != ? AND branch_id = (SELECT branch_id FROM classes WHERE id = ?) ORDER BY id LIMIT 1`, FT101, FT101).id;
    const xem = luat.xemChuyenLop(QL, sid, dich);
    const hanPanel = d.hanBanGiaoLenh({ nguonFt: xem.hienTai.ft, boiCanh: xem.boiCanh, tuanFinal: xem.tuanFinal ?? null, ngay: xem.today });
    const { boiCanh, huong } = luat.huongChuyenMotEm(enr, luat.lopDichHopLe(dich, enr.class_id));
    const r = lenh.raLenh(QL, { lopNguonId: enr.class_id, boiCanh, tuanChung: xem.tuanChon[0], dongs: [lenh.dongTuBody({ studentId: sid, huong, toClassId: dich, lyDo: 'Thử hạn bàn giao' })] });
    assert(!r.failed.length, JSON.stringify(r.failed));
    xoaNho();
    const l = one(`SELECT id, han_gvbm, han_gvcn FROM lenh_chuyen_lop WHERE student_id = ? AND trang_thai = 'cho'`, sid);
    assert(l.han_gvcn === hanPanel.gvcn && l.han_gvbm === hanPanel.gvbm, `panel ${JSON.stringify(hanPanel)} ≠ lệnh ${JSON.stringify(l)}`);
    assert(luat.xemChuyenLop(QL, sid, dich).lenh.hanGvcn === l.han_gvcn, 'panel mở lại đọc hạn đã lưu');
    const viecGvbm = profile.studentProfile(GVBM, sid).dauHoSo.viec.cuaBan.find((v: any) => v.loai === 'ban-giao-mon');
    const viecGvcn = profile.studentProfile(GVCN, sid).dauHoSo.viec.cuaBan.find((v: any) => v.loai === 'ban-giao');
    assert(!viecGvbm || viecGvbm.han === l.han_gvbm, `thanh việc GVBM ${viecGvbm?.han} ≠ ${l.han_gvbm}`);
    assert(viecGvcn?.han === l.han_gvcn, `thanh việc GVCN ${viecGvcn?.han} ≠ ${l.han_gvcn}`);
  }));

  check('OV11d-7 · HV-4: ô Học thuật — chưa có điểm → "chưa có điểm" (không "đạt"); câu tóm tắt: KCK không đẩy mất việc có hạn, Tạm dừng không lặp với dải', () => {
    assert(d.oHocThuat([{ short: 'L', label: 'L', category: 'listening', missed: null, cases: [] }]).phu === 'chưa có điểm', 'missed null');
    assert(d.oHocThuat([{ short: 'L', label: 'L', category: 'listening', missed: false, cases: [] }, { short: 'R', label: 'R', category: 'reading', missed: null, cases: [] }]).phu === 'Không có Case mở', 'thiếu một kỹ năng');
    const cau = d.cauTomTat({
      dacBiet: { loai: 'kck' }, ketQua: { dau: 'MT1', ratio: false, sos: null, dat: null, overall: 5, kck: true, kckDuoi: true, soDat: 0, soMon: 4, monTruot: [], phanTram: null },
      hoTro: ['Reading'], viec: [{ loai: 'ghi-ket-qua', chu: 'Kết quả', kyNangTen: 'Reading', quaHanNgay: 2 }],
      yThuc: { nhom: 'bat_buoc', keTiep: 'Report 1', han: '2026-09-18', quaHanNgay: null, deXuat: null }, homNay: TODAY,
    }).map((m: any) => m.chu);
    assert(cau.some((c: string) => c.startsWith('Ý thức')) && cau.some((c: string) => /quá hạn/.test(c)) && cau.some((c: string) => /KCK/.test(c)) && cau.length === 3, JSON.stringify(cau));
  });

  check('OV11d-8 · Q3: Sửa thông tin thiếu ngày sinh / email → lưu được (trống = NULL); ngày sinh sai dạng → 400', () => thu(() => {
    const sid = emFt();
    students.updateStudent(QL, sid, { dob: '', email: '', phone: '0901234567' });
    const s = one('SELECT dob, email, phone FROM students WHERE id = ?', sid);
    assert(s.dob === null && s.email === null && s.phone === '0901234567', JSON.stringify(s));
    students.updateStudent(TVV, sid, { parentPhone: '0912345678' });
    assert(loi(() => students.updateStudent(QL, sid, { dob: '31/02/2010' }))?.status === 400, 'ngày sinh không có thật phải 400');
  }));

  check('OV11d-9 · Q8: đổi dấu KCK — QL / TVV được; GVCN (đề xuất) / CX / Admin 403', () => thu(() => {
    const sid = emFt();
    const cy = one(`SELECT id, target_score, khong_cam_ket FROM learning_cycles WHERE student_id = ? AND status = 'active'`, sid);
    const lat = (kck: boolean) => d.chuTargetKck(cy.target_score ?? null, kck);
    const kckMoi = !cy.khong_cam_ket;
    for (const [ten, p] of [['CX', CX], ['Admin', ADMIN]] as const) {
      assert(loi(() => cycles.reviseTarget(p, cy.id, { newTarget: lat(kckMoi), reason: 'Thử KCK' }))?.status === 403, `${ten} đổi KCK phải 403`);
    }
    assert(loi(() => deXuat.guiDeXuatSua(GVCN, sid, { truong: 'target', moi: lat(kckMoi) || 'KCK', lyDo: 'Thử KCK' }))?.status === 403, 'GVCN đề xuất đổi KCK phải 403');
    cycles.reviseTarget(TVV, cy.id, { newTarget: lat(kckMoi), reason: 'TVV tích KCK' });
    assert(!!one('SELECT khong_cam_ket k FROM learning_cycles WHERE id = ?', cy.id).k === kckMoi, 'TVV đổi KCK');
    cycles.reviseTarget(QL, cy.id, { newTarget: lat(!kckMoi), reason: 'QL bỏ KCK' });
    assert(!!one('SELECT khong_cam_ket k FROM learning_cycles WHERE id = ?', cy.id).k === !kckMoi, 'QL đổi KCK');
  }));
}
