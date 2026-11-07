/**
 * PHÉP KIỂM RKC-5 (chủ SP 07/11 "KHÔNG BAO GIỜ CHẶN CỨNG", PTA mở Q-B1 "hồ sơ Lưu trữ khoá"): em Lưu trữ (Kết thúc học) sửa được lộ trình (Target, dự kiến
 * thi) như em đang học — có nhật ký; em kết thúc CHƯA TỪNG có lớp Học lại sang lớp mới được (trước: "dùng Chuyển lớp" ↔ Chuyển lớp "Quay lại học trước").
 * Bảng: docs/ra-khoa-cung/bang.md.
 */
export async function runRkcHocVienTests(t: any) {
  const { check, assert } = t;
  if (!t.conn) return;
  const { conn, P, classId, TODAY } = t;
  const intake: any = await import('../classes/intake.ts');
  const students: any = await import('../students/students.ts');
  const cycles: any = await import('../fasttrack/cycles.ts');
  const { xoaNho } = await import('../platform/nguCanhRequest.ts');
  const { emailThu } = await import('../seed/emailThu.ts');
  const thv: any = await import('../students/trangThaiHv.ts');
  const hangLoat: any = await import('../students/hangLoat.ts');
  const lenhChuyen: any = await import('../classes/lenhChuyen.ts');
  const { mondayOf } = await import('../platform/week.ts');
  const get = (sql: string, ...a: unknown[]) => conn.prepare(sql).get(...a) as any;
  const thu = <T>(fn: () => T): T => { conn.exec('BEGIN IMMEDIATE'); try { return fn(); } finally { conn.exec('ROLLBACK'); xoaNho(); } };
  const loi = (fn: () => unknown): any => { try { fn(); return null; } catch (e) { return e; } };
  const MB_FT = classId('MB FT 101');
  const QL = P.mbManager;
  let seq = 0;
  /** Em mới ở MB FT 101 rồi Kết thúc học (Lưu trữ). */
  const emKetThuc = () => {
    const ten = `RKC5 HV ${++seq}`;
    intake.commitIntake(P.admin, { classId: MB_FT, rows: [{ fullName: ten, target: 6.5, email: emailThu(), dob: '2010-01-01' }], idempotencyKey: `rkc5-${seq}` });
    const sid = get('SELECT id FROM students WHERE full_name = ?', ten).id as number;
    students.setStudentStatus(QL, sid, 'finished', TODAY, 'Thử RKC-5');
    xoaNho();
    return sid;
  };

  console.log('\nRKC-5 — hồ sơ Lưu trữ sửa được, Học lại không vòng lặp');

  check('RKC5-1 · em Kết thúc học (Lưu trữ): đổi Target lộ trình → lưu + nhật ký (trước: 400 "Quay lại học trước")', () => thu(() => {
    const sid = emKetThuc();
    assert(!!get('SELECT archived_at FROM students WHERE id = ?', sid).archived_at, 'em phải ở Lưu trữ');
    const cy = get('SELECT id FROM learning_cycles WHERE student_id = ? ORDER BY seq DESC LIMIT 1', sid).id as number;
    const truoc = get(`SELECT COUNT(*) n FROM audit_logs WHERE entity_id = ? AND action LIKE '%target%'`, cy).n;
    cycles.reviseTarget(QL, cy, { newTarget: 7, reason: 'Em đăng ký thi lại mục tiêu cao hơn' });
    assert(get('SELECT target_score FROM learning_cycles WHERE id = ?', cy).target_score === 7, 'Target phải đổi');
    assert(get(`SELECT COUNT(*) n FROM cycle_target_revisions WHERE cycle_id = ?`, cy).n >= 1 || get(`SELECT COUNT(*) n FROM audit_logs WHERE entity_id = ? AND action LIKE '%target%'`, cy).n > truoc, 'thiếu lịch sử đổi Target');
  }));

  check('RKC5-2 · em Kết thúc học chưa từng có lớp: Học lại không lớp mới → câu chỉ đường; có lớp mới → đang học ở lớp đó + nhật ký', () => thu(() => {
    const sid = emKetThuc();
    conn.prepare('DELETE FROM enrollments WHERE student_id = ?').run(sid);
    xoaNho();
    const e = loi(() => students.hocLai(QL, sid, { date: TODAY }));
    assert(e?.status === 400 && /chọn lớp mới/.test(e.message), `không lớp mới: ${e?.status} ${e?.message}`);
    const dich = get(`SELECT id FROM classes WHERE status = 'active' AND is_fast_track = 1 AND branch_id = (SELECT branch_id FROM classes WHERE id = ?) AND id != ? ORDER BY id LIMIT 1`, MB_FT, MB_FT)?.id ?? MB_FT;
    students.hocLai(QL, sid, { date: TODAY, lopMoiId: dich, mucTieu: 6.5 });
    const s = get('SELECT status, archived_at FROM students WHERE id = ?', sid);
    assert(s.status === 'active' && !s.archived_at, `em phải đang học: ${JSON.stringify(s)}`);
    assert(!!get(`SELECT 1 FROM enrollments WHERE student_id = ? AND class_id = ? AND status = 'active'`, sid, dich), 'thiếu ghi danh lớp mới');
    assert(!!get(`SELECT 1 FROM learning_cycles WHERE student_id = ? AND status = 'active'`, sid), 'phải có lộ trình đang chạy ở lớp mới');
    assert(!!get(`SELECT 1 FROM audit_logs WHERE entity_type = 'student' AND entity_id = ? AND action = 'student.status'`, sid), 'thiếu nhật ký');
  }));

  /** Em đang học ở MB FT 101 + quyết định chuyển lớp chờ 2 tuần nữa. */
  const emCoLenh = () => {
    const ten = `RKC5b HV ${++seq}`;
    intake.commitIntake(P.admin, { classId: MB_FT, rows: [{ fullName: ten, target: 6.5, email: emailThu(), dob: '2010-01-01' }], idempotencyKey: `rkc5b-${seq}` });
    const sid = get('SELECT id FROM students WHERE full_name = ?', ten).id as number;
    conn.prepare(`INSERT INTO lenh_chuyen_lop (student_id, lop_nguon_id, huong, boi_canh, tuan_bat_dau, nguoi_ra_lenh, ngay_ra_lenh, tao_luc) VALUES (?,?,'bao_luu','giua-khoa',?,?,?,?)`)
      .run(sid, MB_FT, mondayOf(new Date(Date.parse(TODAY) + 21 * 864e5).toISOString().slice(0, 10)), QL.userId, TODAY, new Date().toISOString());
    xoaNho();
    return sid;
  };
  const lenhCua = (sid: number) => get(`SELECT trang_thai FROM lenh_chuyen_lop WHERE student_id = ? ORDER BY id DESC LIMIT 1`, sid).trang_thai;

  for (const [ten, status, hoanTac] of [
    ['Tạm dừng → Hoàn tác (đường một em)', 'inactive', (sid: number) => { students.hoanTacTamDung(QL, sid); thv.traLaiLenhDaHuy(QL, sid); }],
    ['Kết thúc học → Hoàn tác (hàng loạt)', 'finished', (sid: number) => hangLoat.chay(QL, { viec: 'hoan-tac-ket-thuc', studentIds: [sid] })],
  ] as const) {
    check(`RKC5b-1 · ${ten}: quyết định chuyển lớp huỷ cùng lúc được TRẢ LẠI`, () => thu(() => {
      const sid = emCoLenh();
      thv.doiTrangThai(QL, sid, { status, date: TODAY, huyLenh: true });
      assert(lenhCua(sid) === 'huy', 'quyết định phải huỷ');
      hoanTac(sid);
      assert(get('SELECT status FROM students WHERE id = ?', sid).status === 'active', 'em phải đang học lại');
      assert(lenhCua(sid) === 'cho', `quyết định phải chờ lại: ${lenhCua(sid)}`);
    }));
  }

  check('RKC5b-2 · quyết định huỷ tay (không cùng Tạm dừng) → Hoàn tác Tạm dừng KHÔNG tự khôi phục nó', () => thu(() => {
    const sid = emCoLenh();
    const lid = get(`SELECT id FROM lenh_chuyen_lop WHERE student_id = ?`, sid).id;
    lenhChuyen.huyLenh(QL, lid, 'Phụ huynh đổi ý');
    thv.doiTrangThai(QL, sid, { status: 'inactive', date: TODAY });
    students.hoanTacTamDung(QL, sid); thv.traLaiLenhDaHuy(QL, sid);
    assert(lenhCua(sid) === 'huy', 'quyết định huỷ tay phải giữ huỷ');
  }));

  check('RKC5b-3 · hàng loạt Học lại: em chưa từng có lớp — xem trước cờ chuaCoLop (không bỏ); "Về lớp cũ" → báo từng em; "Sang lớp mới" → học lại', () => thu(() => {
    const sid = emKetThuc();
    conn.prepare('DELETE FROM enrollments WHERE student_id = ?').run(sid);
    xoaNho();
    const xem = hangLoat.xemTruoc(QL, { viec: 'hoc-lai', studentIds: [sid] });
    assert(xem.rows[0].lyDoBo === null && xem.rows[0].chuaCoLop === true, JSON.stringify(xem.rows[0]));
    const cu = hangLoat.chay(QL, { viec: 'hoc-lai', studentIds: [sid], moLaiLop: true });
    assert(cu.failed.length === 1 && /Sang lớp mới/.test(cu.failed[0].message), JSON.stringify(cu));
    const dich = get(`SELECT id FROM classes WHERE status = 'active' AND is_fast_track = 0 AND branch_id = (SELECT branch_id FROM classes WHERE id = ?) ORDER BY id LIMIT 1`, MB_FT)?.id;
    assert(!!dich, 'cần một lớp thường đang chạy ở MB');
    const moi = hangLoat.chay(QL, { viec: 'hoc-lai', studentIds: [sid], lopMoiId: dich });
    assert(moi.ok.length === 1, JSON.stringify(moi));
    assert(!!get(`SELECT 1 FROM enrollments WHERE student_id = ? AND class_id = ? AND status = 'active'`, sid, dich), 'phải đang học lớp mới');
  }));
}
