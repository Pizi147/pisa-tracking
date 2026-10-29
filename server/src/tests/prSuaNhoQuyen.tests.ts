/**
 * PHÉP KIỂM SUA-NHO-QUYEN (kế hoạch `2026-10-30-sua-nho.md` PR-2):
 *  · Q1 "Chưa có kỹ năng" tính cả người đang được phân công dạy; `/admin/accounts` gom câu theo lô (dữ liệu trả về không đổi);
 *  · Q2 cờ `coTheSuaThongTin` ở Lưu trữ = đúng quyền `updateStudent` (em Tạm dừng), +0 câu.
 */
export async function runPrSuaNhoQuyenTests(t: { check: any; assert: any; conn: any; P: any; TODAY: string }) {
  const { check, assert, conn, P, TODAY } = t;
  const d: any = await import('../../../shared/domain/index.ts');
  const { listAccounts } = await import('../platform/accounts.ts');
  const { danhSachLuuTru } = await import('../classes/luuTru.ts');
  const students: any = await import('../students/students.ts');
  const { loadPrincipal } = await import('../permissions.ts');
  const { studentProfile } = await import('../students/profile.ts');
  const { xoaNho, soCauSql, chayTrongRequest } = await import('../platform/nguCanhRequest.ts');
  console.log('\nSUA-NHO-QUYEN — Chưa có kỹ năng tính người đang dạy · Sửa thông tin em tạm dừng ở Lưu trữ');
  const get = (sql: string, ...a: unknown[]) => conn.prepare(sql).get(...a) as any;
  const all = (sql: string, ...a: unknown[]) => conn.prepare(sql).all(...a) as any[];
  const thu = <T>(fn: () => T): T => {
    conn.exec('BEGIN IMMEDIATE');
    try { xoaNho(); return fn(); } finally { conn.exec('ROLLBACK'); xoaNho(); }
  };
  const nem = (fn: () => unknown) => { try { fn(); return null; } catch (e: any) { return e; } };

  check('SNQ-1 · "Chưa có kỹ năng": QL đang dạy không kỹ năng → có; không dạy → không; GV vai teacher → có (luật cũ); có kỹ năng → không', () => {
    const L = (rows: any[]) => d.locTaiKhoan(rows, { ...d.BO_LOC_TAI_KHOAN_TRONG, phanLoai: 'chua-ky-nang' }).map((u: any) => u.id).join();
    const u = (id: number, role: string, skills: string[], dangDay?: boolean) =>
      ({ id, code: `u${id}`, fullName: `u${id}`, email: null, extra: [], skills, roles: [{ role, branchCode: 'MB' }], dangDay });
    assert(L([u(1, 'manager', [], true)]) === '1', 'QL đang dạy, chưa kỹ năng');
    assert(L([u(1, 'manager', [], false)]) === '', 'QL không dạy');
    assert(L([u(1, 'teacher', [])]) === '1', 'GV vai teacher');
    assert(L([u(1, 'manager', ['L'], true)]) === '', 'QL đang dạy có kỹ năng');
    assert(d.phanLoaiTaiKhoan([u(1, 'manager', [], true), u(2, 'consultant', [], false)])['chua-ky-nang'] === 1, 'chip đếm = danh sách');
  });

  check('SNQ-2 · /admin/accounts: dangDay theo phân công active (ended / tài khoản không dạy → false); roles / skills / extraEmails / extra y như đọc từng người', () => thu(() => {
    const ql = P.mbManager.userId as number;
    const mau = get(`SELECT * FROM teacher_assignments ORDER BY id LIMIT 1`);
    conn.prepare(`DELETE FROM teacher_assignments WHERE user_id = ?`).run(ql);
    conn.prepare(`INSERT INTO teacher_assignments (user_id, class_id, skill, is_core, effective_from, status, created_at) VALUES (?,?,?,?,?,'active',?)`)
      .run(ql, mau.class_id, mau.skill, 0, TODAY, TODAY);
    const khong = P.admin.userId as number;
    conn.prepare(`DELETE FROM teacher_assignments WHERE user_id = ?`).run(khong);
    conn.prepare(`INSERT INTO teacher_assignments (user_id, class_id, skill, is_core, effective_from, status, created_at) VALUES (?,?,?,?,?,'ended',?)`)
      .run(khong, mau.class_id, mau.skill, 0, TODAY, TODAY);
    const rows = listAccounts(P.admin) as any[];
    assert(rows.find((r) => r.id === ql)?.dangDay === true, 'QL được phân công → dangDay');
    assert(rows.find((r) => r.id === khong)?.dangDay === false, 'phân công ended → không');
    /* Mốc: đọc từng người như mã cũ (trước khi gom lô). */
    for (const r of rows) {
      const cu = {
        roles: all(`SELECT r.key AS role, r.name_vi AS roleName, b.code AS branchCode, b.name AS branchName
           FROM user_roles ur JOIN roles r ON r.id = ur.role_id LEFT JOIN branches b ON b.id = ur.branch_id
          WHERE ur.user_id = ? AND ur.status = 'active' ORDER BY r.id, b.id`, r.id),
        skills: all('SELECT skill FROM user_skills WHERE user_id = ?', r.id).map((x) => x.skill),
        extraEmails: all('SELECT email FROM user_emails WHERE user_id = ? ORDER BY id', r.id).map((x) => x.email),
        extra: all(`SELECT p.key AS permission, p.name_vi AS name, b.code AS branchCode
           FROM user_permissions up JOIN permissions p ON p.id = up.permission_id LEFT JOIN branches b ON b.id = up.branch_id
          WHERE up.user_id = ? ORDER BY p.id`, r.id),
      };
      const moi = { roles: r.roles, skills: r.skills, extraEmails: r.extraEmails, extra: r.extra };
      assert(JSON.stringify(moi) === JSON.stringify(cu), `#${r.id}: ${JSON.stringify(moi)} ≠ ${JSON.stringify(cu)}`);
    }
  }));

  const tvvId = get(`SELECT ur.user_id AS id FROM user_roles ur JOIN roles r ON r.id = ur.role_id WHERE r.key = 'consultant' AND ur.status = 'active' ORDER BY ur.user_id LIMIT 1`)?.id;
  const vai = (): [string, any][] => [
    ['QT', P.admin], ['QL MB', P.mbManager], ['QL CP', P.cpManager], ['GVCN', P.coreTeacher], ['GVBM', P.subjectTeacher],
    ...(tvvId ? [['TVV', loadPrincipal(tvvId)] as [string, any]] : []),
  ];
  const emLop = () => get(`SELECT e.student_id AS id FROM enrollments e JOIN classes c ON c.id = e.class_id JOIN students s ON s.id = e.student_id
     WHERE c.code = 'MB FT 101' AND e.status = 'active' AND s.status = 'active' AND s.archived_at IS NULL ORDER BY e.student_id LIMIT 1`).id as number;

  check('SNQ-3 · Lưu trữ: cờ coTheSuaThongTin (em Tạm dừng) === updateStudent liên hệ không ném, mọi vai; có vai true và vai false', () => thu(() => {
    const sid = emLop();
    students.setStudentStatus(P.mbManager, sid, 'inactive', TODAY);
    const kq: string[] = [];
    for (const [ten, p] of vai()) {
      xoaNho();
      const co = !!danhSachLuuTru(p).hocVien.find((s) => s.id === sid)?.coTheSuaThongTin;
      xoaNho();
      const sua = !nem(() => students.updateStudent(p, sid, { parentPhone: '0912000111' }));
      assert(co === sua, `${ten}: cờ ${co} ≠ PATCH ${sua}`);
      kq.push(`${ten}=${co}`);
    }
    assert(kq.some((x) => x.endsWith('true')) && kq.some((x) => x.endsWith('false')), kq.join(' '));
  }));

  check('SNQ-4 · em Kết thúc học: cờ false mọi vai; PATCH liên hệ → CAU_LUU_TRU', () => thu(() => {
    const sid = emLop();
    students.setStudentStatus(P.mbManager, sid, 'inactive', TODAY);   // tạm dừng → kết thúc: vẫn ở Lưu trữ (SV-4)
    students.setStudentStatus(P.mbManager, sid, 'finished', TODAY, 'Thôi hẳn');
    for (const [ten, p] of vai()) {
      xoaNho();
      assert(danhSachLuuTru(p).hocVien.find((s) => s.id === sid)?.coTheSuaThongTin !== true, `${ten}: có nút`);
    }
    const e = nem(() => students.updateStudent(P.mbManager, sid, { phone: '0912000111' }));
    assert(e?.message === d.CAU_LUU_TRU, `máy chủ chặn: ${e?.message} · ${JSON.stringify(get('SELECT status, archived_at FROM students WHERE id = ?', sid))}`);
  }));

  check('SNQ-6 · em Tạm dừng: /students/:id vẫn trả lộ trình đang học (panel Sửa thông tin hiện nhãn lộ trình, không "Em chưa có lộ trình")', () => thu(() => {
    const sid = emLop();
    students.setStudentStatus(P.mbManager, sid, 'inactive', TODAY);
    const h = studentProfile(P.mbManager, sid) as any;
    assert(!!h.archivedAt && h.status === 'inactive' && !!h.cycle?.label, `cycle: ${JSON.stringify(h.cycle?.label)} · archived ${h.archivedAt}`);
  }));

  check('SNQ-5 · danhSachLuuTru (QL) không thêm câu vì cờ mới', () => thu(() => {
    students.setStudentStatus(P.mbManager, emLop(), 'inactive', TODAY);
    xoaNho();
    const truoc = soCauSql();
    chayTrongRequest('GET', () => danhSachLuuTru(P.mbManager));
    const n = soCauSql() - truoc;
    assert(n === SO_CAU_LUU_TRU_QL, `số câu ${n} ≠ ${SO_CAU_LUU_TRU_QL} (đo trên mã trước PR)`);
  }));
}

/** Đo trên mã TRƯỚC PR (Step 2 Q2) — cờ mới phải dùng phạm vi đã nạp, không thêm câu. */
const SO_CAU_LUU_TRU_QL = 7;
