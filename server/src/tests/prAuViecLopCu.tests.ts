/**
 * AU-VIEC-3 (N48, audit A3-08): GV không dạy em vẫn bị chặn; NGOẠI LỆ — GV / GVCN lớp CŨ của em (phân công hiệu lực ngày em rời lớp: chuyển lớp, lên lớp sau
 * Cuối khoá) xem CHỈ ĐỌC hồ sơ em 30 ngày từ ngày rời. Không mở quyền ghi nào.
 */
export async function runPrAuViecLopCuTests(t: any) {
  const { check, assert, assertThrows, conn, P, TODAY } = t;
  console.log('\nAU-VIEC-3 · GV lớp cũ xem hồ sơ chỉ đọc 30 ngày (N48)');
  const { can, lopCuXem, NGAY_XEM_LOP_CU } = await import('../permissions.ts');
  const { PERMISSIONS } = await import('../../../shared/domain/index.ts');
  const { studentProfile } = await import('../students/profile.ts');
  const { skillSupportBoard } = await import('../cases/cases.ts');
  const { xoaNho } = await import('../platform/nguCanhRequest.ts');
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

  check('N48 · hết 30 ngày → chặn như GV không dạy em; chưa tới ngày rời → không có ngoại lệ', () => {
    assert(em, 'seed');
    const sau = ngayCong(em.roi, NGAY_XEM_LOP_CU + 1);
    xoaNho();
    assert(lopCuXem(P.coreTeacher, em.sid, ngayCong(em.roi, NGAY_XEM_LOP_CU)) !== null, 'ngày thứ 30 vẫn xem');
    assert(lopCuXem(P.coreTeacher, em.sid, sau) === null, 'ngày 31 hết');
    assert(!can(P.coreTeacher, PERMISSIONS.ATTEMPT_VIEW, { classId: em.lop_moi, studentId: em.sid, date: sau }), 'quá hạn: ATTEMPT_VIEW lớp mới phải chặn');
    assert(lopCuXem(P.coreTeacher, em.sid, ngayCong(em.roi, -1)) === null, 'trước ngày rời: không ngoại lệ');
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
}
