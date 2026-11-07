/**
 * PHÉP KIỂM SUA-LUU-TRU b (chủ SP 07/11, plan.md mục 4 việc 2 — LUẬT MỚI thay `CAU_LUU_TRU` một phần): em đã lưu trữ (Tạm dừng / Kết thúc học)
 * sửa được thông tin KHÔNG đụng lộ trình (`TRUONG_SUA_LUU_TRU`, một danh sách máy chủ + web); lớp / lộ trình / điểm đầu vào / trạng thái vẫn 400 `CAU_LUU_TRU`.
 * Nút "Sửa thông tin" ở Lưu trữ (cờ `coTheSuaThongTin`) cho cả em Kết thúc học, đúng cổng `updateStudent`.
 */
export async function runPrSuaLuuTruBTests(t: { check: any; assert: any; conn: any; P: any; TODAY: string }) {
  const { check, assert, conn, P, TODAY } = t;
  const students: any = await import('../students/students.ts');
  const { danhSachLuuTru } = await import('../classes/luuTru.ts');
  const d: any = await import('../../../shared/domain/index.ts');
  const { xoaNho } = await import('../platform/nguCanhRequest.ts');
  console.log('\nSUA-LUU-TRU b — hồ sơ em Kết thúc học: sửa thông tin không đụng lộ trình');
  const get = (sql: string, ...a: unknown[]) => conn.prepare(sql).get(...a) as any;
  const thu = <T>(fn: () => T): T => {
    conn.exec('BEGIN IMMEDIATE');
    try { xoaNho(); return fn(); } finally { conn.exec('ROLLBACK'); xoaNho(); }
  };
  const nem = (fn: () => unknown): any => { try { fn(); return null; } catch (e) { return e; } };
  const QL = P.mbManager;
  /** Em đang học ở MB → Kết thúc học (vào Lưu trữ). */
  const emKetThuc = () => {
    const sid = get(`SELECT s.id FROM students s JOIN enrollments e ON e.student_id = s.id AND e.status = 'active' JOIN classes c ON c.id = e.class_id
        JOIN branches b ON b.id = c.branch_id AND b.code = 'MB' WHERE s.status = 'active' AND s.archived_at IS NULL ORDER BY s.id LIMIT 1`).id as number;
    students.setStudentStatus(QL, sid, 'finished', TODAY, 'Thôi');
    assert(get('SELECT archived_at FROM students WHERE id = ?', sid).archived_at, 'tiền đề: em chưa vào Lưu trữ');
    xoaNho();
    return sid;
  };

  check('SLT-b1 · em Kết thúc học (Lưu trữ): QL sửa họ tên, ngày sinh, email, ghi chú, liên hệ → lưu + nhật ký student.update', () => thu(() => {
    const sid = emKetThuc();
    students.updateStudent(QL, sid, { fullName: 'Thử Sửa Lưu Trữ', dob: '2008-03-04', email: 'slt.b1@vidu.vn', note: 'Ghi chú sau Kết thúc', phone: '0912000222', parentName: 'Mẹ An' });
    const s = get('SELECT full_name, dob, email, note, phone, parent_name, status, archived_at FROM students WHERE id = ?', sid);
    assert(s.full_name === 'Thử Sửa Lưu Trữ' && s.dob === '2008-03-04' && s.email === 'slt.b1@vidu.vn' && s.note === 'Ghi chú sau Kết thúc' && s.phone === '0912000222' && s.parent_name === 'Mẹ An', JSON.stringify(s));
    assert(s.status === 'finished' && s.archived_at, 'trạng thái / Lưu trữ bị đổi');
    assert(get(`SELECT 1 FROM audit_logs WHERE action = 'student.update' AND entity_type = 'student' AND entity_id = ?`, sid), 'thiếu nhật ký (Hoàn tác / Lịch sử)');
  }));

  check('SLT-b2 · em Kết thúc học: điểm đầu vào / trạng thái / lộ trình vẫn 400 CAU_LUU_TRU (lối ra Quay lại học)', () => thu(() => {
    const sid = emKetThuc();
    const cy = get('SELECT id FROM learning_cycles WHERE student_id = ? ORDER BY seq DESC LIMIT 1', sid)?.id;
    assert(nem(() => students.updateStudent(QL, sid, { dauVao: null }))?.message === d.CAU_LUU_TRU, 'điểm đầu vào (lộ trình) không bị chặn');
    assert(nem(() => students.updateStudent(QL, sid, { email: 'x@vidu.vn', dauVao: null }))?.message === d.CAU_LUU_TRU, 'gửi kèm trường lộ trình không bị chặn');
    assert(nem(() => students.setStudentStatus(QL, sid, 'active', TODAY))?.message === d.CAU_LUU_TRU, 'trạng thái không bị chặn');
    if (cy) assert(nem(() => students.chanLuuTru(QL, cy))?.message === d.CAU_LUU_TRU, 'đường /cycles/:id… không bị chặn');
  }));

  check('SLT-b3 · một danh sách `TRUONG_SUA_LUU_TRU`: không có trường lộ trình; cờ Lưu trữ `coTheSuaThongTin` (em Kết thúc học) === PATCH được, QL có, QL chi nhánh khác không', () => thu(() => {
    assert(!d.TRUONG_SUA_LUU_TRU.includes('dauVao') && d.TRUONG_SUA_LUU_TRU.includes('fullName') && d.TRUONG_SUA_LUU_TRU.includes('phone'), JSON.stringify(d.TRUONG_SUA_LUU_TRU));
    const sid = emKetThuc();
    for (const [i, p] of [QL, P.cpManager, P.admin].entries()) {
      xoaNho();
      const co = !!danhSachLuuTru(p).hocVien.find((s: any) => s.id === sid)?.coTheSuaThongTin;
      xoaNho();
      const sua = !nem(() => students.updateStudent(p, sid, { email: `slt.b3.${i}@vidu.vn` }));
      assert(co === sua, `vai ${i}: cờ ${co} ≠ PATCH ${sua}`);
      if (p === QL) assert(co, 'QL không có nút');
      if (p === P.cpManager) assert(!co, 'QL chi nhánh khác có nút');
    }
  }));

  check('SLT-b4 · ⋯ hồ sơ em Kết thúc học (chỉ xem): có "Sửa thông tin"; không Lộ trình / Chuyển lớp', () => {
    const muc = d.mucQuanLyHocVien({ canEdit: true, lopHoc: { chiXem: true, quyen: { chuyenLop: true, hocLai: true } }, cycle: { ratio: false }, status: 'finished' }).map((m: any) => m.key);
    assert(muc.includes('info') && !muc.includes('lo-trinh') && !muc.includes('chuyen-lop') && muc.includes('quay-lai'), JSON.stringify(muc));
  });
}
