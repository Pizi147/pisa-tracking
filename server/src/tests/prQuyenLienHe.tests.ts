/**
 * PHÉP KIỂM QUYEN-LIEN-HE (luật chủ SP 13/10 "GV không sửa ô Liên hệ" — backlog plan.md mục 4, nguồn rà sâu #729): luật nay ở MÁY CHỦ.
 * Ô Liên hệ (`TRUONG_LIEN_HE`: SĐT em, tên / quan hệ / SĐT phụ huynh) chỉ QL, Quản trị, TVV, CX, Admin đổi được (`coONhapLienHe`) — GV (GVCN, GVBM)
 * gửi thẳng API đổi giá trị → 403, ở mọi đường ghi: PATCH hồ sơ (`updateStudent`) · Sửa cả lớp (xem trước + lưu). Gửi lại nguyên giá trị không chặn.
 */
import type { YThucTestKit } from './yThuc.tests.ts';

export async function runPrQuyenLienHeTests(t: YThucTestKit) {
  const { check, assert, conn, P } = t;
  console.log('\nQUYEN-LIEN-HE · ô Liên hệ chỉ QL / Quản trị / TVV / CX / Admin (máy chủ)');
  const st: any = await import('../students/students.ts');
  const scl: any = await import('../classes/suaCaLop.ts');
  const { loadPrincipal } = await import('../permissions.ts');
  const { xoaNho } = await import('../platform/nguCanhRequest.ts');
  const { apGocNhin } = await import('../auth.ts');
  const await_accounts: any = await import('../platform/accounts.ts');
  const one = (sql: string, ...a: unknown[]) => conn.prepare(sql).get(...a) as any;
  const thu = <T>(fn: () => T): T => { conn.exec('BEGIN IMMEDIATE'); try { return fn(); } finally { conn.exec('ROLLBACK'); xoaNho(); } };
  const maLoi = (fn: () => unknown): any => { try { fn(); return null; } catch (e: any) { return e; } };

  /* Em đang học MB FT 101 (GVCN = P.coreTeacher). */
  const lop = one(`SELECT id FROM classes WHERE code = 'MB FT 101'`).id as number;
  const em = one(`SELECT s.id FROM enrollments e JOIN students s ON s.id = e.student_id AND s.status = 'active' AND s.archived_at IS NULL
                   WHERE e.class_id = ? AND e.status = 'active' ORDER BY s.id LIMIT 1`, lop).id as number;
  const tvv = one(`SELECT ur.user_id AS id FROM user_roles ur JOIN roles r ON r.id = ur.role_id JOIN branches b ON b.id = ur.branch_id AND b.code = 'MB'
                    WHERE r.key = 'consultant' AND ur.status = 'active' ORDER BY ur.id LIMIT 1`)?.id;

  check('QLH · PATCH hồ sơ: GVCN / GVBM đổi SĐT phụ huynh (hoặc SĐT em, tên / quan hệ PH) → 403; dữ liệu không đổi', () => thu(() => {
    const truoc = one('SELECT phone, parent_name, parent_relation, parent_phone FROM students WHERE id = ?', em);
    for (const [ten, p] of [['GVCN', P.coreTeacher], ['GVBM', P.subjectTeacher]] as const) {
      for (const patch of [{ parentPhone: '0912 345 678' }, { phone: '0987 654 321' }, { parentName: 'Nguyễn Văn A' }, { parentRelation: 'Bố' }]) {
        const e = maLoi(() => st.updateStudent(p, em, patch));
        assert(e?.status === 403, `${ten} ${JSON.stringify(patch)} → ${e?.status} ${e?.message ?? ''}`);
      }
    }
    assert(JSON.stringify(one('SELECT phone, parent_name, parent_relation, parent_phone FROM students WHERE id = ?', em)) === JSON.stringify(truoc), 'không ghi');
  }));
  check('QLH · PATCH hồ sơ: GVCN sửa ô khác (họ tên) vẫn được; gửi lại NGUYÊN giá trị liên hệ không chặn', () => thu(() => {
    const s = one('SELECT full_name, parent_phone FROM students WHERE id = ?', em);
    st.updateStudent(P.coreTeacher, em, { fullName: `${s.full_name} ` });
    st.updateStudent(P.coreTeacher, em, { parentPhone: s.parent_phone });
  }));
  check('QLH · PATCH hồ sơ: QL, Quản trị, TVV đổi liên hệ được (như cũ)', () => thu(() => {
    st.updateStudent(P.mbManager, em, { parentPhone: '0912 000 111' });
    st.updateStudent(P.admin, em, { parentName: 'Trần Thị B' });
    if (tvv) st.updateStudent(loadPrincipal(tvv), em, { parentRelation: 'Mẹ' });
    const s = one('SELECT parent_name, parent_relation, parent_phone FROM students WHERE id = ?', em);
    assert(s.parent_name === 'Trần Thị B' && /0912/.test(s.parent_phone) && (!tvv || s.parent_relation === 'Mẹ'), JSON.stringify(s));
  }));
  check('QLH · GV gửi liên hệ SAI định dạng → 403 (không 400 định dạng — không lộ đường khác)', () => thu(() => {
    for (const patch of [{ parentPhone: 'abc' }, { phone: '12' }, { parentName: 'x'.repeat(500) }]) {
      const e = maLoi(() => st.updateStudent(P.coreTeacher, em, patch));
      assert(e?.status === 403, `${JSON.stringify(patch).slice(0, 30)} → ${e?.status} ${e?.message ?? ''}`);
    }
  }));
  /* Vai kiêm: quyền theo VAI ĐANG LÀM (`roleKeys` sau góc nhìn) — cùng `coONhapLienHe` web dùng ẩn ô. Góc nhìn chỉ có ở tài khoản có vai QL / Quản trị
     (`coTheDoiGocNhin`); tài khoản GV + TVV không đổi góc nhìn — vai GV thắng (web cũng ẩn ô Liên hệ) → 403. */
  const taoKiem = (ten: string, roles: any[]) => {
    const u = await_accounts.createAccount(P.admin, { email: `qlh.${ten}${await_accounts.EMAIL_SUFFIX}`, password: 'matkhau-qlh', fullName: `Thử QLH ${ten}`, roles }).userId as number;
    conn.prepare(`INSERT INTO teacher_assignments (user_id, class_id, skill, is_core, effective_from, status, created_at) VALUES (?,?,'reading',0,'2026-01-01','active',?)`)
      .run(u, lop, new Date().toISOString());
    xoaNho();
    return loadPrincipal(u);
  };
  check('QLH · tài khoản kiêm QL + GV: vai QL lưu được; góc nhìn GV → 403', () => thu(() => {
    const ql = taoKiem('qlgv', [{ role: 'manager', branches: ['MB'] }, { role: 'teacher', branches: ['MB'] }]);
    st.updateStudent(ql, em, { parentPhone: '0913 111 222' });
    assert(/0913/.test(one('SELECT parent_phone FROM students WHERE id = ?', em).parent_phone), 'vai QL lưu được');
    const gv = apGocNhin(ql, 'teacher');
    assert(gv.roleKeys.join() === 'teacher', `góc nhìn: ${gv.roleKeys}`);
    assert(maLoi(() => st.updateStudent(gv, em, { parentPhone: '0913 999 888' }))?.status === 403, 'góc nhìn GV 403');
  }));
  check('QLH · tài khoản kiêm GV + TVV (không có góc nhìn): vai GV thắng → 403, như web ẩn ô', () => thu(() => {
    const p = taoKiem('gvtvv', [{ role: 'teacher', branches: ['MB'] }, { role: 'consultant', branches: ['MB'] }]);
    assert(maLoi(() => st.updateStudent(p, em, { parentPhone: '0913 111 222' }))?.status === 403, 'GV + TVV 403');
  }));
  check('QLH · Sửa cả lớp: GVCN gửi cột liên hệ đổi giá trị → 403 ở xem trước và lưu (cả lô không ghi); cột khác vẫn lưu; QL đổi được', () => thu(() => {
    const truoc = one('SELECT parent_phone FROM students WHERE id = ?', em).parent_phone;
    const lo = { rows: [{ studentId: em, parentPhone: '0911 222 333' }] };
    assert(maLoi(() => scl.xemTruocSuaCaLop(P.coreTeacher, lop, lo))?.status === 403, 'xem trước 403');
    assert(maLoi(() => scl.luuSuaCaLop(P.coreTeacher, lop, lo))?.status === 403, 'lưu 403');
    assert(one('SELECT parent_phone FROM students WHERE id = ?', em).parent_phone === truoc, 'không ghi');
    scl.luuSuaCaLop(P.mbManager, lop, lo);
    assert(/0911/.test(one('SELECT parent_phone FROM students WHERE id = ?', em).parent_phone), 'QL lưu được');
  }));
}
