/**
 * PHÉP KIỂM VAI-0 (N74–N77, chủ SP 26/11 — đặc tả `docs/superpowers/specs/2026-11-26-vai-gdcn-lead-tvv-bpxl/thiet-ke.md`):
 *  VM-1 migrate prVaiMoi · VM-2 GĐCN = quyền Head, không giữ việc Head; Lead TVV như CX · VM-3 nguoiNhanTuDong (ít việc nhất, hoà, toàn hệ thống loại, CVXL lớp)
 *  · VM-4 phần Meeting một người (GĐCN → CX → Head; người lưu hết vai → người gán sớm nhất) · VM-5 em chưa có TVV → Lead TVV · VM-6 BPXL lịch mọi chi nhánh
 *  · VM-7 Nhận lớp / nhận lại / gán hộ / Hoàn tác.
 */
export async function runPrVaiMoiTests(t: any) {
  const { check, assert, conn, P, classId } = t;
  const accounts: any = await import('../platform/accounts.ts');
  const { migratePrVaiMoi } = await import('../migrate/prVaiMoi.ts');
  const { loadPrincipal, can, scopeFor, qlDiem, duocSuaLichLop, cnMacDinhBpxl, scopeXemLuotCham } = await import('../permissions.ts');
  const { myWork } = await import('../worklist/mywork.ts');
  const { PERMISSIONS } = await import('../../../shared/domain/index.ts');
  const { giuViecQl, leadTvvCua } = await import('../worklist/viecTvv.ts');
  const { quanLyCuaChiNhanh } = await import('../platform/audit.ts');
  const nn: any = await import('../worklist/nguoiNhan.ts');
  const gv: any = await import('../worklist/giaoViec.ts');
  const bp: any = await import('../yThuc/baoPhTvv.ts');
  const xl: any = await import('../classes/xepLichLop.ts');
  const { xoaNho } = await import('../platform/nguCanhRequest.ts');
  const { demoToday } = await import('../demoConfig.ts');
  console.log('\nVAI-0 · GĐCN · Lead TVV · BPXL theo lớp · một việc một người (N74–N77)');

  const one = (sql: string, ...a: unknown[]) => conn.prepare(sql).get(...a) as any;
  const all = (sql: string, ...a: unknown[]) => conn.prepare(sql).all(...a) as any[];
  const ma = (fn: () => unknown): number | null => { try { fn(); return null; } catch (e: any) { return e?.status ?? -1; } };
  const thu = <T>(fn: () => T): T => { conn.exec('BEGIN IMMEDIATE'); try { return fn(); } finally { conn.exec('ROLLBACK'); xoaNho(); } };
  let seq = 0;
  const tao = (role: string, branches: string[]) => {
    seq += 1;
    return accounts.createAccount(P.admin, { email: `vai0.${seq}${accounts.EMAIL_SUFFIX}`, password: 'matkhau-vai0', fullName: `Thử VAI0 ${seq}`, roles: [{ role, branches }] }).userId as number;
  };
  const cn = (code: string) => one('SELECT id FROM branches WHERE code = ?', code).id as number;
  const MB = cn('MB'); const CP = cn('CP');
  const MB_FT = classId('MB FT 101'); const CP_FT = classId('CP FT 110');
  const emCua = (lop: number) => one(`SELECT e.student_id id FROM enrollments e JOIN students s ON s.id = e.student_id
      WHERE e.class_id = ? AND e.status = 'active' AND s.status = 'active' AND s.archived_at IS NULL ORDER BY e.student_id LIMIT 1`, lop)?.id as number;
  const emMb = emCua(MB_FT);

  /* Người thử: tạo theo thứ tự (gán sớm → muộn). */
  const gdcnMb = tao('branch_director', ['MB']);
  const leadMb = tao('lead_consultant', ['MB']);
  /* Chi nhánh chưa có BPXL nào (seed có BPXL ở MB) — nhóm thử chỉ gồm A, B. */
  const X = one(`SELECT b.id, b.code FROM branches b WHERE NOT EXISTS (SELECT 1 FROM user_roles ur JOIN roles r ON r.id = ur.role_id WHERE r.key = 'scheduler' AND ur.branch_id = b.id)
      AND EXISTS (SELECT 1 FROM classes c WHERE c.branch_id = b.id AND c.status = 'active') AND b.id != ? ORDER BY b.id LIMIT 1`, cn('MB'));
  const bpA = tao('scheduler', [X.code]);
  const bpB = tao('scheduler', [X.code]);
  const bpLead = tao('scheduler', []);
  const bpCp = tao('scheduler', ['CP']);
  /* Các tài khoản tạo cùng mili-giây có thể trùng `created_at` — thứ tự hoà theo id (tạo trước = id nhỏ). */

  check('VM-1 · migrate prVaiMoi: DB chưa có vai → 2 vai, quyền = Head / CX trong DB; bảng lop_xep_lich; lần hai không đổi', () => thu(() => {
    conn.prepare(`DELETE FROM user_roles WHERE role_id IN (SELECT id FROM roles WHERE key IN ('branch_director', 'lead_consultant'))`).run();
    conn.prepare(`DELETE FROM role_permissions WHERE role_id IN (SELECT id FROM roles WHERE key IN ('branch_director', 'lead_consultant'))`).run();
    conn.prepare(`DELETE FROM roles WHERE key IN ('branch_director', 'lead_consultant')`).run();
    conn.exec('DROP TABLE lop_xep_lich');
    const lan1: string[] = [];
    migratePrVaiMoi(conn, lan1);
    const q = (k: string) => all(`SELECT p.key FROM role_permissions rp JOIN roles r ON r.id = rp.role_id JOIN permissions p ON p.id = rp.permission_id WHERE r.key = ? ORDER BY 1`, k).map((x) => x.key).join();
    assert(lan1.length === 1 && /GĐCN/.test(lan1[0]) && /Lead TVV/.test(lan1[0]) && /lop_xep_lich/.test(lan1[0]), lan1.join(' | '));
    assert(q('branch_director') === q('manager') && q('lead_consultant') === q('cx'), `${q('branch_director')} / ${q('lead_consultant')}`);
    const lan2: string[] = [];
    migratePrVaiMoi(conn, lan2);
    assert(!lan2.length, lan2.join(' | '));
  }));

  check('VM-2 · GĐCN mang quyền Head ở chi nhánh mình (không chi nhánh khác), KHÔNG giữ việc của Head; Lead TVV như CX', () => {
    xoaNho();
    const g = loadPrincipal(gdcnMb);
    assert(g.roleKeys.includes('manager') && g.grants.every((x: any) => x.roleKey !== 'manager' || x.vaiThat === 'branch_director'), JSON.stringify(g.grants.map((x: any) => [x.roleKey, x.vaiThat])));
    assert(can(g, PERMISSIONS.CLASS_ASSIGN, { classId: MB_FT }) && !can(g, PERMISSIONS.CLASS_ASSIGN, { classId: CP_FT }), 'quyền Head theo chi nhánh');
    assert(!giuViecQl(g)(MB), 'GĐCN không giữ việc Head');
    assert(giuViecQl(P.mbManager)(MB), 'Head vẫn giữ');
    assert(!quanLyCuaChiNhanh(MB).includes(gdcnMb), 'GĐCN không vào người nhận việc Head');
    const l = loadPrincipal(leadMb);
    assert(l.roleKeys.includes('cx') && can(l, PERMISSIONS.STUDENT_EDIT_MORE, { classId: MB_FT }) && !can(l, PERMISSIONS.SCORE_OVERRIDE, { classId: MB_FT }), 'Lead TVV như CX');
  });

  /* Một hành động Meeting CX mới cho em MB (lượt bất kỳ của em) → hai phần. */
  const taoMeeting = () => {
    const a = one(`SELECT id FROM assessment_attempts WHERE student_id = ? ORDER BY id LIMIT 1`, emMb);
    const id = Number(conn.prepare(`INSERT INTO sos_coordination_actions (attempt_id, student_id, kind, status, created_at, performed_on) VALUES (?, ?, 'cx_meeting_student', 'done', ?, ?)`)
      .run(a.id, emMb, new Date().toISOString(), demoToday()).lastInsertRowid);
    gv.moPhanMeeting(id, emMb, null);
    xoaNho();
    return { ket: one(`SELECT * FROM meeting_phan WHERE phoi_hop_id = ? AND phan = 'ket_qua'`, id), xep: one(`SELECT * FROM meeting_phan WHERE phoi_hop_id = ? AND phan = 'xep_lich'`, id) };
  };

  check('VM-3 · nguoiNhanTuDong: ít việc mở nhất; hoà → gán sớm; BPXL toàn hệ thống không nhận; CVXL đã nhận lớp thắng (kể cả chi nhánh khác)', () => thu(() => {
    assert(nn.nhomVaiCn('scheduler', X.id).join() === [bpA, bpB].join(), `nhóm ${nn.nhomVaiCn('scheduler', X.id)}`);
    assert(nn.nguoiNhanTuDong('scheduler', X.id) === bpA, 'hoà → gán sớm');
    const mp = taoMeeting().xep;
    conn.prepare(`UPDATE meeting_phan SET trang_thai = 'mo', phu_trach_id = NULL, nguoi_luat = ? WHERE id = ?`).run(bpA, mp.id);
    xoaNho();
    assert(nn.nguoiNhanTuDong('scheduler', X.id) === bpB, 'A có 1 việc → B');
    assert(nn.nguoiNhanTuDong('scheduler', null) === null && !nn.nhomVaiCn('scheduler', MB).includes(bpLead), 'toàn hệ thống không nhận');
    conn.prepare(`INSERT INTO lop_xep_lich (class_id, user_id, gan_luc) VALUES (?, ?, ?)`).run(MB_FT, bpCp, '2026-01-01');
    assert(nn.nguoiNhanTuDong('scheduler', MB, { lopId: MB_FT }) === bpCp, 'CVXL nhận lớp thắng');
  }));

  check('VM-4 · phần Meeting một người: Kết quả → GĐCN; Xếp lịch → BPXL ít việc; /my-work chỉ người đó; GĐCN gỡ vai → CX / Head gán sớm nhất', () => thu(() => {
    const { ket, xep } = taoMeeting();
    assert(ket.nguoi_luat === gdcnMb, `kết quả ${ket.nguoi_luat}`);
    const nhomMb = nn.nhomVaiCn('scheduler', MB);
    assert(nhomMb.includes(xep.nguoi_luat), `xếp lịch ${xep.nguoi_luat} / ${nhomMb}`);
    assert(gv.docViec('meeting', ket.id).macDinh.join() === String(gdcnMb), 'macDinh = GĐCN');
    const cua = (uid: number) => gv.viecGiaoChoToi(loadPrincipal(uid), { today: demoToday() }).filter((i: any) => i.mine && i.key.includes(String(ket.id)));
    assert(cua(gdcnMb).length === 1, 'GĐCN có việc');
    const cxMb = one(`SELECT ur.user_id u FROM user_roles ur JOIN roles r ON r.id = ur.role_id WHERE r.key = 'cx' AND ur.branch_id = ? AND ur.status = 'active' ORDER BY ur.created_at, ur.id LIMIT 1`, MB)?.u;
    if (cxMb) assert(!cua(cxMb).length, 'CX không còn thấy việc nhóm');
    for (const khac of [bpA, bpB, bpLead, ...nhomMb.filter((u: number) => u !== xep.nguoi_luat)]) {
      assert(!gv.viecGiaoChoToi(loadPrincipal(khac), { today: demoToday() }).some((i: any) => i.mine && i.key.includes(String(xep.id))), `BPXL ${khac} không có`);
    }
    assert(gv.viecGiaoChoToi(loadPrincipal(xep.nguoi_luat), { today: demoToday() }).some((i: any) => i.mine && i.key.includes(String(xep.id))), 'người nhận có');
    conn.prepare(`UPDATE user_roles SET status = 'inactive' WHERE user_id = ?`).run(gdcnMb);
    xoaNho();
    const sau = gv.docViec('meeting', ket.id).macDinh;
    assert(sau.length === 1 && sau[0] !== gdcnMb, `sau gỡ: ${sau}`);
  }));

  check('VM-5 · em chưa có TVV → Lead TVV chi nhánh giữ việc Báo PH (Head chỉ thấy ở Tất cả); Lead TVV theo dõi Báo PH em có TVV', () => thu(() => {
    const v = one(`SELECT v.id, v.student_id FROM viec_bao_ph v JOIN enrollments e ON e.student_id = v.student_id AND e.status = 'active' JOIN classes c ON c.id = e.class_id
        WHERE v.trang_thai = 'mo' AND v.phu_trach_id IS NULL AND c.branch_id = ? ORDER BY v.id LIMIT 1`, MB);
    assert(v, 'seed cần việc Báo PH mở ở MB');
    conn.prepare(`UPDATE students SET consultant_user_id = NULL WHERE id = ?`).run(v.student_id);
    xoaNho();
    assert(leadTvvCua(MB) === leadMb, 'Lead TVV MB');
    assert(gv.docViec('bao_ph', v.id).macDinh.join() === String(leadMb), 'macDinh Lead TVV');
    const cua = (pp: any, tatCa: boolean) => bp.viecBaoPhCuaToi(pp, { today: demoToday(), tatCa, branchId: null, studentId: v.student_id }).filter((i: any) => i.key.includes(String(v.id)));
    const l = cua(loadPrincipal(leadMb), false);
    assert(l.length === 1 && l[0].mine, `Lead TVV: ${JSON.stringify(l)}`);
    assert(!cua(P.mbManager, false).length, 'Head không còn ở Của tôi');
    const h = cua(P.mbManager, true);
    assert(h.length === 1 && h[0].ownerId === leadMb, `Head Tất cả: ${JSON.stringify(h)}`);
    /* em có TVV → Lead TVV vào người theo dõi (nguồn cx) khi đồng bộ */
    conn.prepare(`UPDATE students SET consultant_user_id = (SELECT ur.user_id FROM user_roles ur JOIN roles r ON r.id = ur.role_id WHERE r.key = 'consultant' AND ur.branch_id = ? LIMIT 1) WHERE id = ?`).run(MB, v.student_id);
    gv.theoDoiVaiBaoPh({ studentIds: [v.student_id] });
    assert(one(`SELECT nguon FROM viec_theo_doi WHERE loai = 'bao_ph' AND ref_id = ? AND user_id = ?`, v.id, leadMb)?.nguon === 'cx', 'Lead TVV theo dõi');
  }));

  check('VM-6 · BPXL gán chi nhánh X xem / xếp lịch lớp CP (không sửa điểm); phạm vi lịch mọi chi nhánh; màn mặc định = X; quyền khác theo chi nhánh', () => {
    xoaNho();
    const a = loadPrincipal(bpA);
    assert(can(a, PERMISSIONS.PLAN_WEEK, { classId: CP_FT }) && can(a, PERMISSIONS.SCHEDULE_MOVE, { classId: CP_FT }), 'lịch CP');
    assert(!qlDiem(a, { classId: CP_FT }) && !qlDiem(a, { classId: MB_FT }), 'không sửa điểm');
    assert(scopeFor(a, PERMISSIONS.PLAN_WEEK).all && !scopeFor(a, PERMISSIONS.STUDENT_VIEW).all, 'phạm vi');
    const lopX = one(`SELECT id FROM classes WHERE branch_id = ? AND status = 'active' LIMIT 1`, X.id).id;
    assert(!can(a, PERMISSIONS.STUDENT_VIEW, { classId: CP_FT }) && can(a, PERMISSIONS.STUDENT_VIEW, { classId: lopX }), 'HV & Lớp theo chi nhánh gán');
    assert(cnMacDinhBpxl(a) === X.id && cnMacDinhBpxl(loadPrincipal(bpLead)) === null && cnMacDinhBpxl(P.mbManager) === null, 'mặc định');
    const thuong = one(`SELECT c.id FROM classes c JOIN programmes pg ON pg.code = c.programme_code WHERE c.branch_id = ? AND c.status = 'active' AND pg.scoring_mode = 'ratio' LIMIT 1`, CP)?.id;
    if (thuong) assert(duocSuaLichLop(a, thuong), 'lịch lớp thường CP');
  });

  check('VM-7 · Nhận lớp: tự nhận chuyển Xếp lịch họp mở; nhận lại → tin người cũ; GV gán hộ 403; Head gán hộ được; Hoàn tác trả người cũ; bỏ nhận', () => thu(() => {
    const { xep } = taoMeeting();
    const a = loadPrincipal(bpA); const b = loadPrincipal(bpB);
    const r1 = xl.ganXepLich(a, MB_FT, { userId: bpA, cu: null });
    assert(r1.xepLich?.userId === bpA && r1.hoanTac, JSON.stringify(r1));
    assert(one('SELECT nguoi_luat FROM meeting_phan WHERE id = ?', xep.id).nguoi_luat === bpA, 'việc chuyển A');
    assert(ma(() => xl.ganXepLich(b, MB_FT, { userId: bpB, cu: null })) === 409, 'cu sai → 409');
    xl.ganXepLich(b, MB_FT, { userId: bpB, cu: bpA });
    assert(one('SELECT nguoi_luat FROM meeting_phan WHERE id = ?', xep.id).nguoi_luat === bpB, 'việc chuyển B');
    assert(one(`SELECT 1 x FROM notifications WHERE user_id = ? AND entity_type = 'classes' AND entity_id = ?`, bpA, MB_FT), 'tin cho A');
    assert(ma(() => xl.ganXepLich(P.coreTeacher, MB_FT, { userId: bpA, cu: bpB })) === 403, 'GV 403');
    assert(ma(() => xl.ganXepLich(a, MB_FT, { userId: bpCp, cu: bpB })) === 403, 'BPXL không gán hộ người khác');
    xl.hoanTacXepLich(b, MB_FT);
    assert(xl.xemXepLich(MB_FT)?.userId === bpA && one('SELECT nguoi_luat FROM meeting_phan WHERE id = ?', xep.id).nguoi_luat === bpA, 'Hoàn tác về A');
    xl.ganXepLich(P.mbManager, MB_FT, { userId: bpB, cu: bpA });
    assert(xl.xemXepLich(MB_FT)?.userId === bpB, 'Head gán hộ');
    xl.ganXepLich(b, MB_FT, { userId: null, cu: bpB });
    assert(xl.xemXepLich(MB_FT) === null, 'bỏ nhận');
    xl.hoanTacXepLich(b, MB_FT);
    assert(xl.xemXepLich(MB_FT)?.userId === bpB, 'Hoàn tác bỏ nhận');
    assert(ma(() => xl.ganXepLich(P.admin, MB_FT, { userId: P.coreTeacher.userId, cu: bpB })) === 400, 'người không BPXL → 400');
  }));

  check('VM-8 · (rà C1) Lead TVV thấy việc em chưa có TVV ở /my-work THẬT (Của tôi + Tất cả); Head "Của tôi" không còn', () => thu(() => {
    const v = one(`SELECT v.id, v.student_id FROM viec_bao_ph v JOIN enrollments e ON e.student_id = v.student_id AND e.status = 'active' JOIN classes c ON c.id = e.class_id
        WHERE v.trang_thai = 'mo' AND v.phu_trach_id IS NULL AND c.branch_id = ? ORDER BY v.id LIMIT 1`, MB);
    conn.prepare(`UPDATE students SET consultant_user_id = NULL WHERE id = ?`).run(v.student_id);
    xoaNho();
    const co = (pp: any, nguoi?: 'tat-ca') => ((myWork(pp, { nguoi }) as any).items as any[]).filter((i) => i.key.includes(`:${v.id}`) && i.mine);
    assert(co(loadPrincipal(leadMb)).length === 1, 'Lead Của tôi');
    assert(co(loadPrincipal(leadMb), 'tat-ca').length === 1, 'Lead Tất cả');
    assert(!co(P.mbManager).length, 'Head Của tôi không còn');
  }));

  check('VM-9 · (rà C2) CVXL chi nhánh X nhận lớp MB → phần Xếp lịch họp của em lớp đó ở /my-work của CVXL', () => thu(() => {
    xl.ganXepLich(loadPrincipal(bpA), MB_FT, { userId: bpA, cu: null });
    const { xep } = taoMeeting();
    assert(xep.nguoi_luat === bpA, `nguoi_luat ${xep.nguoi_luat}`);
    xoaNho();
    const it = ((myWork(loadPrincipal(bpA)) as any).items as any[]).filter((i) => i.key.includes(String(xep.id)) && i.mine);
    assert(it.length === 1, JSON.stringify(it));
  }));

  check('VM-10 · (rà I1) BPXL: Lịch Test tuần mọi chi nhánh, nhưng KHÔNG xem hồ sơ lượt / Học viên & Lớp chi nhánh khác', () => {
    xoaNho();
    const a = loadPrincipal(bpA);
    assert(scopeXemLuotCham(a).all, 'Lịch Test tuần mọi chi nhánh');
    assert(!scopeFor(a, PERMISSIONS.ATTEMPT_VIEW).all && !can(a, PERMISSIONS.ATTEMPT_VIEW, { classId: CP_FT }), 'không mở attempt.view');
  });
}
