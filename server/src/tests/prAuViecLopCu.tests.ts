/**
 * AU-VIEC-3 (N48, audit A3-08): GV không dạy em vẫn bị chặn; NGOẠI LỆ — GV / GVCN lớp CŨ của em (phân công hiệu lực ngày em rời lớp: chuyển lớp, lên lớp sau
 * Cuối khoá) xem CHỈ ĐỌC hồ sơ em 30 ngày từ ngày rời. Không mở quyền ghi nào.
 */
export async function runPrAuViecLopCuTests(t: any) {
  const { check, assert, assertThrows, conn, P, TODAY } = t;
  console.log('\nAU-VIEC-3 · GV lớp cũ xem hồ sơ chỉ đọc 30 ngày (N48)');
  const { can, lopCuXem, loadPrincipal } = await import('../permissions.ts');
  const NGAY_XEM_LOP_CU = 30;   // N68: `xemCuDen` — gốc 30 ngày (Hạn mặc định › Bàn giao đổi GV (còn xem))
  const { PERMISSIONS } = await import('../../../shared/domain/index.ts');
  const { studentProfile } = await import('../students/profile.ts');
  const { skillSupportBoard } = await import('../cases/cases.ts');
  const { xoaNho } = await import('../platform/nguCanhRequest.ts');
  const casesSvc: any = await import('../cases/cases.ts');
  const att: any = await import('../platform/attachments.ts');
  const { chipHocVien } = await import('../worklist/hvCuaToi.ts');
  const { danhSachLuuTru } = await import('../classes/luuTru.ts');
  const ma = (fn: () => unknown) => { try { fn(); return 200; } catch (e: any) { return e?.status ?? 500; } };
  const ngayCong = (d: string, n: number) => new Date(Date.parse(d) + n * 86_400_000).toISOString().slice(0, 10);

  /* Em rời MB FT 101 (GVCN = P.coreTeacher) trong 30 ngày, đang học lớp khác mà GVCN 101 không dạy. */
  const em = conn.prepare(`SELECT e.student_id AS sid, substr(e.ended_at, 1, 10) AS roi, n.class_id AS lop_moi FROM enrollments e JOIN classes c ON c.id = e.class_id AND c.code = 'MB FT 101'
     JOIN enrollments n ON n.student_id = e.student_id AND n.status = 'active'
    WHERE e.status IN ('transferred', 'completed') AND e.ended_at IS NOT NULL
      AND NOT EXISTS (SELECT 1 FROM teacher_assignments ta WHERE ta.class_id = n.class_id AND ta.user_id = ? AND ta.status = 'active')
    ORDER BY e.ended_at DESC LIMIT 1`).get(P.coreTeacher.userId) as any;

  check('N48 · GVCN lớp cũ: mở hồ sơ (chỉ đọc) — nhãn lớp cũ, mọi cờ ghi tắt, quyền ghi máy chủ không mở', () => {
    assert(em, 'seed: cần em vừa rời MB FT 101 sang lớp GVCN 101 không dạy');
    assert(TODAY <= ngayCong(em.roi, NGAY_XEM_LOP_CU), `seed: em ${em.sid} rời ${em.roi} đã quá ${NGAY_XEM_LOP_CU} ngày`);
    xoaNho();
    const hs: any = studentProfile(P.coreTeacher, em.sid);
    assert(hs.viewer.lopCu?.lopCu === 'MB FT 101' && hs.viewer.lopCu.den === ngayCong(em.roi, NGAY_XEM_LOP_CU), `nhãn lớp cũ: ${JSON.stringify(hs.viewer.lopCu)}`);
    const ghi = Object.entries(hs.viewer).filter(([k, v]) => k !== 'lopCu' && v === true).map(([k]) => k);
    assert(!ghi.length, `cờ ghi bật: ${ghi.join(', ')}`);
    assert(!hs.dauHoSo.viec.cuaBan.length, 'không có việc của người xem');
    const board: any = skillSupportBoard(P.coreTeacher, em.sid);
    const bat = board.rows.flatMap((r: any) => r.cases).filter((c: any) => c.canEdit || c.canClose || c.coTheXacNhanCase);
    assert(!bat.length, `Case sửa được: ${bat.map((c: any) => c.id).join(', ')}`);
    const ctx = { classId: em.lop_moi, studentId: em.sid };
    assert(can(P.coreTeacher, PERMISSIONS.ATTEMPT_VIEW, ctx) && can(P.coreTeacher, PERMISSIONS.STUDENT_VIEW, ctx), 'xem được');
    for (const q of [PERMISSIONS.SOS_EDIT, PERMISSIONS.SOS_REPORT, PERMISSIONS.VIOLATION_RECORD, PERMISSIONS.DISCIPLINE_MANAGE, PERMISSIONS.STUDENT_EDIT, PERMISSIONS.SCORE_EDIT]) {
      assert(!can(P.coreTeacher, q, { ...ctx, skill: 'listening' }), `${q} không được mở`);
    }
  });

  check('N68 · phiếu bàn giao chuyển lớp còn chưa xác nhận → GV cũ xem tới khi xong (quá 30 ngày vẫn xem); xác nhận xong → về mốc 30 ngày', () => {
    assert(em, 'seed');
    const sau = ngayCong(em.roi, NGAY_XEM_LOP_CU + 5);
    conn.exec('SAVEPOINT n68');
    try {
      const lop101 = conn.prepare(`SELECT id FROM classes WHERE code = 'MB FT 101'`).get().id;
      const id = Number(conn.prepare(`INSERT INTO lenh_chuyen_lop (student_id, lop_nguon_id, lop_dich_id, huong, boi_canh, tuan_bat_dau, nguoi_ra_lenh, ngay_ra_lenh, trang_thai, tao_luc)
        VALUES (?, ?, ?, 'chuyen_lop', 'giua-khoa', ?, ?, ?, 'da_chuyen', ?)`).run(em.sid, lop101, em.lop_moi, em.roi, P.coreTeacher.userId, em.roi, new Date().toISOString()).lastInsertRowid);
      xoaNho();
      assert(lopCuXem(P.coreTeacher, em.sid, sau)?.den === '9999-12-31', 'bàn giao mở: xem tới khi xong');
      assert(can(P.coreTeacher, PERMISSIONS.STUDENT_VIEW, { studentId: em.sid, date: sau }), 'bàn giao mở: STUDENT_VIEW ngày 35');
      assert(!can(P.coreTeacher, PERMISSIONS.STUDENT_EDIT, { studentId: em.sid, date: sau }), 'vẫn chỉ đọc');
      conn.prepare('UPDATE lenh_chuyen_lop SET xac_nhan_luc = ? WHERE id = ?').run(new Date().toISOString(), id);
      xoaNho();
      assert(lopCuXem(P.coreTeacher, em.sid, sau) === null, 'bàn giao xong, quá 30 ngày → hết');
      assert(lopCuXem(P.coreTeacher, em.sid, ngayCong(em.roi, NGAY_XEM_LOP_CU))?.den === ngayCong(em.roi, NGAY_XEM_LOP_CU), 'bàn giao xong: mốc 30 ngày');
    } finally { conn.exec('ROLLBACK TO n68'); conn.exec('RELEASE n68'); xoaNho(); }
  });

  check('N48 · hết 30 ngày → chặn như GV không dạy em; chưa tới ngày rời → không có ngoại lệ', () => {
    assert(em, 'seed');
    const sau = ngayCong(em.roi, NGAY_XEM_LOP_CU + 1);
    xoaNho();
    assert(lopCuXem(P.coreTeacher, em.sid, ngayCong(em.roi, NGAY_XEM_LOP_CU)) !== null, 'ngày thứ 30 vẫn xem');
    assert(lopCuXem(P.coreTeacher, em.sid, sau) === null, 'ngày 31 hết');
    assert(!can(P.coreTeacher, PERMISSIONS.ATTEMPT_VIEW, { classId: em.lop_moi, studentId: em.sid, date: sau }), 'quá hạn: ATTEMPT_VIEW lớp mới phải chặn');
    assert(lopCuXem(P.coreTeacher, em.sid, ngayCong(em.roi, -1)) === null, 'trước ngày rời: không ngoại lệ');
    /* Rà bảo mật #1804 (điểm 2): ngữ cảnh CHỈ có em — trước đây GV cũ qua `hasAssignment` (mọi ghi danh từng có) xem vô hạn. */
    for (const q of [PERMISSIONS.STUDENT_VIEW, PERMISSIONS.ATTEMPT_VIEW]) {
      assert(!can(P.coreTeacher, q, { studentId: em.sid, date: sau }), `ngày 31, chỉ { studentId }: ${q} phải chặn`);
    }
    /* Lớp CUỐI của em Kết thúc học / lưu trữ vẫn xem không hạn (SUA-LUU-TRU). */
    const kt = conn.prepare(`SELECT e.student_id AS sid, ta.user_id AS gv FROM enrollments e JOIN students s ON s.id = e.student_id AND s.status = 'finished'
      JOIN teacher_assignments ta ON ta.class_id = e.class_id AND ta.status = 'active'
     WHERE e.id = (SELECT MAX(x.id) FROM enrollments x WHERE x.student_id = e.student_id) LIMIT 1`).get() as any;
    if (kt) {
      xoaNho();
      assert(can(loadPrincipal(kt.gv), PERMISSIONS.STUDENT_VIEW, { studentId: kt.sid }), `GV lớp cuối của em Kết thúc học ${kt.sid} phải còn xem`);
    }
  });

  check('N48 · GV không dạy em (chưa từng dạy lớp em) vẫn 403; người không phân công ở lớp cũ ngày rời không được', () => {
    const khac = conn.prepare(`SELECT e.student_id AS sid FROM enrollments e JOIN classes c ON c.id = e.class_id AND c.branch_id = (SELECT branch_id FROM classes WHERE code = 'MB FT 101')
      WHERE e.status = 'active' AND NOT EXISTS (SELECT 1 FROM enrollments x JOIN teacher_assignments ta ON ta.class_id = x.class_id AND ta.user_id = ? WHERE x.student_id = e.student_id)
      LIMIT 1`).get(P.coreTeacher.userId) as any;
    assert(khac, 'seed: em cùng chi nhánh GVCN 101 chưa từng dạy');
    xoaNho();
    assertThrows(() => studentProfile(P.coreTeacher, khac.sid), /phạm vi|quyền/, 'GV không dạy em phải bị chặn');
    /* Phân công bắt đầu SAU ngày em rời → không phải GV lớp cũ của em. */
    const p2 = { ...P.coreTeacher, assignments: P.coreTeacher.assignments.map((a: any) => ({ ...a, effectiveFrom: ngayCong(em.roi, 1) })) };
    xoaNho();
    assert(lopCuXem(p2, em.sid) === null, 'phân công sau ngày rời không mở');
  });

  check('N48 (rà bảo mật #1804) · GV lớp cũ ĐÃ BÁO Case của em: không sửa / xoá Case, không xoá PA, không thêm / gỡ tệp (quyền tạm chỉ xem)', () => {
    assert(em, 'seed');
    const now = new Date().toISOString();
    const cid = Number(conn.prepare(`INSERT INTO sos_cases (student_id, topic, category, origin_kind, status, reported_by, summary, created_at)
      VALUES (?, 'listening', 'listening', 'teacher_report', 'open', ?, 'Case thử N48', ?)`).run(em.sid, P.coreTeacher.userId, now).lastInsertRowid);
    const iv = Number(conn.prepare(`INSERT INTO case_interventions (case_id, kind, status, preset, created_at) VALUES (?, 'tutor', 'planned', 0, ?)`).run(cid, now).lastInsertRowid);
    try {
      xoaNho();
      assert(can(P.coreTeacher, PERMISSIONS.ATTEMPT_VIEW, { classId: em.lop_moi, studentId: em.sid }), 'tiền đề: còn xem tạm');
      assert(ma(() => casesSvc.suaCase(P.coreTeacher, cid, { summary: 'sửa lọt' })) === 403, 'sửa Case phải 403');
      assert(ma(() => casesSvc.xoaCase(P.coreTeacher, cid)) === 403, 'xoá Case phải 403');
      assert(ma(() => casesSvc.xoaPa(P.coreTeacher, iv)) === 403, 'xoá PA phải 403');
      assert(ma(() => att.addLink(P.coreTeacher, { ownerType: 'sos_case', ownerId: cid, url: 'https://vd.test/a', displayName: 'Tệp thử' })) === 403, 'thêm tệp phải 403');
      const board: any = casesSvc.skillSupportBoard(P.coreTeacher, em.sid);
      assert(!board.rows.flatMap((r: any) => r.cases).some((c: any) => c.id === cid && (c.canEdit || c.coTheSua || c.coTheXoa)), 'bảng: Case không sửa / xoá được');
    } finally {
      conn.prepare('DELETE FROM case_interventions WHERE case_id = ?').run(cid);
      conn.prepare('DELETE FROM sos_cases WHERE id = ?').run(cid);
      xoaNho();
    }
  });

  check('N48 (rà bảo mật #1804) · danh sách / số đếm KHÔNG gồm em lớp cũ (chỉ mở hồ sơ một em) · ended_at hỏng không lỗi', () => {
    assert(em, 'seed');
    xoaNho();
    assert(!chipHocVien(P.coreTeacher).tatCa.includes(em.sid), 'chip / số Học viên của GV không có em lớp cũ');
    assert(!danhSachLuuTru(P.coreTeacher).hocVien.some((x: any) => x.id === em.sid), 'Lưu trữ không có em lớp cũ');
    const goc = conn.prepare(`SELECT id, ended_at FROM enrollments WHERE student_id = ? AND status IN ('transferred', 'completed') AND class_id = (SELECT id FROM classes WHERE code = 'MB FT 101')`).get(em.sid) as any;
    try {
      conn.prepare('UPDATE enrollments SET ended_at = ? WHERE id = ?').run('hỏng', goc.id);
      xoaNho();
      assert(lopCuXem(P.coreTeacher, em.sid) === null, 'ended_at hỏng → không ngoại lệ, không ném');
    } finally {
      conn.prepare('UPDATE enrollments SET ended_at = ? WHERE id = ?').run(goc.ended_at, goc.id);
      xoaNho();
    }
  });
}
