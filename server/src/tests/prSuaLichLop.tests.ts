/**
 * SUA-LICH-LOP (chủ SP 06/11) — GVCN lớp đó + Admin chi nhánh + QL sửa được LỊCH lớp thường (khai giảng, tuần Progress, tuần Final):
 *  SL-a  quyền hẹp: GVCN lớp mình · Admin cùng chi nhánh · QL → được; GV bộ môn, GVCN lớp KHÁC, Admin chi nhánh khác → 403; lớp FT vẫn chỉ `class.edit`;
 *        quyền này KHÔNG mở `class.edit`.
 *  SL-b  đổi tuần Final / Progress → đợt Báo cáo PH đã viết (`bao_cao_ph.dot`) theo mốc mới, không mồ côi.
 *  SL-c  đổi tuần Final → hạn bàn giao của lệnh Cuối khoá đang chờ tính lại; lệnh đã xác nhận giữ nguyên.
 *  SL-d  chuông "doi_lich_lop" cho GV đang dạy lớp, người sửa không tự nhận; không đổi gì → không chuông.
 */
import type { YThucTestKit } from './yThuc.tests.ts';

export async function runPrSuaLichLopTests(t: YThucTestKit) {
  const { check, assert, assertThrows, conn, P, classId } = t;
  const schedule: any = await import('../classes/schedule.ts');
  const perm: any = await import('../permissions.ts');
  const chuyenLop: any = await import('../../../shared/domain/chuyenLop.ts');
  const LOP = classId('MB FOU 12');
  const FT = classId('MB FT 101');
  const get = (sql: string, ...a: unknown[]) => conn.prepare(sql).get(...a) as any;
  const all = (sql: string, ...a: unknown[]) => conn.prepare(sql).all(...a) as any[];
  console.log('\nSUA-LICH-LOP · GVCN / Admin / QL sửa lịch lớp thường; mốc đổi thì việc gắn mốc dời theo');

  const adminCua = (maCn: string, khac = false) => get(
    `SELECT ur.user_id AS id FROM user_roles ur JOIN roles r ON r.id = ur.role_id JOIN branches b ON b.id = ur.branch_id
      WHERE r.key = 'office_admin' AND ur.status = 'active' AND b.code ${khac ? '!=' : '='} ? ORDER BY ur.user_id LIMIT 1`, maCn)?.id as number | undefined;
  /* GVCN của lớp KHÁC: P.coreTeacher (GVCN FT 101) cũng đứng lớp FOU 12 trong seed nên không dùng được. */
  const gvcnKhacId = get(`SELECT user_id AS id FROM teacher_assignments WHERE is_core = 1 AND status = 'active' AND class_id != ?
    AND user_id NOT IN (SELECT user_id FROM teacher_assignments WHERE class_id = ? AND status = 'active') LIMIT 1`, LOP, LOP)?.id as number;
  assert(gvcnKhacId, 'seed thiếu GVCN lớp khác');
  const gvcnKhac = perm.loadPrincipal(gvcnKhacId);
  const adminMb = adminCua('MB'), adminKhac = adminCua('MB', true);

  check('SL-a · quyền: GVCN lớp, Admin chi nhánh, QL sửa được; GVBM, GVCN lớp khác, Admin chi nhánh khác → 403; FT chỉ QL', () => {
    const cp = schedule.classProgress(LOP);
    assert(perm.duocSuaLichLop(P.normalCoreTeacher, LOP), 'GVCN của lớp phải sửa được');
    assert(perm.duocSuaLichLop(P.mbManager, LOP) && perm.duocSuaLichLop(P.admin, LOP), 'QL / Quản trị sửa được');
    assert(!perm.duocSuaLichLop(P.normalSubjectTeacher, LOP), 'GV bộ môn không sửa được');
    assert(!perm.duocSuaLichLop(gvcnKhac, LOP), 'GVCN lớp KHÁC không sửa được');
    assert(!perm.can(P.normalCoreTeacher, perm.PERMISSIONS?.CLASS_EDIT ?? 'class.edit', { classId: LOP }), 'quyền hẹp KHÔNG mở class.edit');
    if (adminMb) {
      assert(perm.duocSuaLichLop(perm.loadPrincipal(adminMb), LOP), 'Admin cùng chi nhánh sửa được');
      assert(!perm.duocSuaLichLop(perm.loadPrincipal(adminMb), FT), 'Admin không sửa được lớp FT');
    }
    if (adminKhac) assert(!perm.duocSuaLichLop(perm.loadPrincipal(adminKhac), LOP), 'Admin chi nhánh khác không sửa được');
    assert(!perm.duocSuaLichLop(P.coreTeacher, FT), 'GVCN lớp FT không sửa được lớp FT (chỉ class.edit)');

    /* GVCN lưu được; GVBM, GVCN lớp khác → 403; không ai đổi gì ngoài chính lớp. */
    schedule.setClassProgress(P.normalCoreTeacher, LOP, { finalWeek: cp.finalWeek });
    assertThrows(() => schedule.setClassProgress(P.normalSubjectTeacher, LOP, { finalWeek: cp.finalWeek }), /GVCN|Quản lý/, 'GVBM');
    assertThrows(() => schedule.setClassProgress(gvcnKhac, LOP, { finalWeek: cp.finalWeek }), /GVCN|Quản lý/, 'GVCN lớp khác');
    if (adminKhac) assertThrows(() => schedule.setClassProgress(perm.loadPrincipal(adminKhac), LOP, { finalWeek: cp.finalWeek }), /GVCN|Quản lý/, 'Admin chi nhánh khác');
    assertThrows(() => schedule.setClassProgress(P.coreTeacher, FT, { startPeriodId: null }), /GVCN|Quản lý/, 'GVCN sửa lớp FT');
    /* luật cũ vẫn chặn: tuần ngoài khoá. */
    assertThrows(() => schedule.setClassProgress(P.normalCoreTeacher, LOP, { finalWeek: cp.totalWeeks + 1 }), /vượt quá/, 'tuần ngoài khoá');
  });

  /** Em + một dòng Báo cáo PH ở đợt `dot` của lớp (đủ khoá cho UNIQUE). */
  const ghiBc = (dot: string, tag: string) => {
    const now = new Date().toISOString();
    const branch = get('SELECT branch_id AS b FROM classes WHERE id = ?', LOP).b;
    const sid = Number(conn.prepare(`INSERT INTO students (student_code, full_name, normalized_name, branch_id, status, created_at) VALUES (?,?,?,?, 'active', ?)`)
      .run(`PISA-SL${tag}`, `Học viên SL${tag}`, `hoc vien sl${tag}`, branch, now).lastInsertRowid);
    conn.prepare(`INSERT INTO enrollments (student_id, class_id, status, started_at, created_at) VALUES (?,?, 'active', ?, ?)`).run(sid, LOP, '2026-01-01', now);
    conn.prepare(`INSERT INTO bao_cao_ph (class_id, dot, student_id, phan, chu, du, sua_boi, sua_luc) VALUES (?,?,?,?,?,1,?,?)`).run(LOP, dot, sid, 'chung', 'GV đã viết', P.admin.userId, now);
    return sid;
  };

  check('SL-b · đổi tuần Final / Progress → đợt Báo cáo PH đã viết đi theo mốc mới (không mồ côi)', () => {
    schedule.setClassProgress(P.mbManager, LOP, { progressWeek: 3, finalWeek: 6 });
    const cp = schedule.classProgress(LOP);
    const sf = ghiBc(`final:${cp.finalWeekStart}`, 'F' + Math.random().toString(36).slice(2, 6));
    const sp = ghiBc(`progress:${cp.progressWeekStart}`, 'P' + Math.random().toString(36).slice(2, 6));
    schedule.setClassProgress(P.normalCoreTeacher, LOP, { finalWeek: 5, progressWeek: 2 });
    const moi = schedule.classProgress(LOP);
    assert(moi.finalWeekStart === t.addDays(cp.finalWeekStart, -7) && moi.progressWeekStart === t.addDays(cp.progressWeekStart, -7), 'tiền đề: mốc lùi một tuần');
    const dot = (sid: number) => get('SELECT dot FROM bao_cao_ph WHERE student_id = ? AND class_id = ?', sid, LOP)?.dot;
    assert(dot(sf) === `final:${moi.finalWeekStart}`, `Final: ${dot(sf)}`);
    assert(dot(sp) === `progress:${moi.progressWeekStart}`, `Progress: ${dot(sp)}`);
    assert(all(`SELECT 1 FROM bao_cao_ph WHERE class_id = ? AND (dot = ? OR dot = ?)`, LOP, `final:${cp.finalWeekStart}`, `progress:${cp.progressWeekStart}`).length === 0, 'không còn dòng ở mã đợt cũ');
  });

  check('SL-c · đổi tuần Final → hạn bàn giao lệnh Cuối khoá đang chờ tính lại; lệnh đã xác nhận giữ nguyên', () => {
    schedule.setClassProgress(P.mbManager, LOP, { progressWeek: 3, finalWeek: 6 });
    const cp = schedule.classProgress(LOP);
    const ngay = '2026-01-05';
    const lenh = (xacNhan: string | null, tag: string) => {
      const now = new Date().toISOString();
      const branch = get('SELECT branch_id AS b FROM classes WHERE id = ?', LOP).b;
      const sid = Number(conn.prepare(`INSERT INTO students (student_code, full_name, normalized_name, branch_id, status, created_at) VALUES (?,?,?,?, 'active', ?)`)
        .run(`PISA-SLC${tag}`, `Học viên SLC${tag}`, `hoc vien slc${tag}`, branch, now).lastInsertRowid);
      const cu = chuyenLop.hanBanGiaoLenh({ nguonFt: false, boiCanh: 'cuoi-khoa', tuanFinal: cp.finalWeekStart, ngay });
      return Number(conn.prepare(
        `INSERT INTO lenh_chuyen_lop (student_id, lop_nguon_id, huong, boi_canh, tuan_bat_dau, nguoi_ra_lenh, ngay_ra_lenh, trang_thai, han_gvbm, han_gvcn, xac_nhan_luc, tao_luc)
         VALUES (?,?, 'fast_track', 'cuoi-khoa', ?, ?, ?, 'cho', ?, ?, ?, ?)`).run(sid, LOP, cp.finalWeekStart, P.admin.userId, ngay, cu.gvbm, cu.gvcn, xacNhan, now).lastInsertRowid);
    };
    const cho = lenh(null, 'a' + Math.random().toString(36).slice(2, 5)), daXn = lenh(new Date().toISOString(), 'b' + Math.random().toString(36).slice(2, 5));
    const hanCu = get('SELECT han_gvcn h FROM lenh_chuyen_lop WHERE id = ?', cho).h;
    schedule.setClassProgress(P.normalCoreTeacher, LOP, { finalWeek: 8 });
    const moi = schedule.classProgress(LOP).finalWeekStart;
    const mong = chuyenLop.hanBanGiaoLenh({ nguonFt: false, boiCanh: 'cuoi-khoa', tuanFinal: moi, ngay });
    const r = get('SELECT han_gvbm b, han_gvcn c FROM lenh_chuyen_lop WHERE id = ?', cho);
    assert(r.c === mong.gvcn && r.b === mong.gvbm && r.c !== hanCu, `hạn phải dời theo Final mới: ${hanCu} → ${r.c} (mong ${mong.gvcn})`);
    assert(get('SELECT han_gvcn h FROM lenh_chuyen_lop WHERE id = ?', daXn).h === hanCu, 'lệnh đã xác nhận giữ hạn');
  });

  check('SL-d · chuông doi_lich_lop: GV đang dạy lớp nhận, người sửa không tự nhận; không đổi gì → không chuông', () => {
    schedule.setClassProgress(P.mbManager, LOP, { progressWeek: 3, finalWeek: 6 });
    const dem = (uid: number) => get(`SELECT COUNT(*) n FROM notifications WHERE kind = 'doi_lich_lop' AND user_id = ? AND entity_id = ?`, uid, LOP).n as number;
    const [bm0, cn0] = [dem(P.normalSubjectTeacher.userId), dem(P.normalCoreTeacher.userId)];
    schedule.setClassProgress(P.normalCoreTeacher, LOP, { finalWeek: 6 });   // không đổi
    assert(dem(P.normalSubjectTeacher.userId) === bm0, 'không đổi gì thì không báo');
    schedule.setClassProgress(P.normalCoreTeacher, LOP, { finalWeek: 7 });
    assert(dem(P.normalSubjectTeacher.userId) === bm0 + 1, 'GV bộ môn của lớp phải nhận chuông');
    assert(dem(P.normalCoreTeacher.userId) === cn0, 'người sửa không tự nhận');
    const th = get(`SELECT title FROM notifications WHERE kind = 'doi_lich_lop' AND user_id = ? ORDER BY id DESC LIMIT 1`, P.normalSubjectTeacher.userId).title as string;
    assert(/Final/.test(th) && /→/.test(th), `chuông phải nói mốc nào đổi: ${th}`);
    assert(get(`SELECT COUNT(*) n FROM audit_logs WHERE action = 'class.progress' AND entity_id = ? AND actor_user_id = ?`, LOP, P.normalCoreTeacher.userId).n >= 1, 'nhật ký ghi người sửa');
  });
}
