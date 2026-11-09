/**
 * PHÉP KIỂM KIEM-TAY-1011 (ghi chú 2–6 của `docs/anh/kiem-tay-1011/ket-qua.md`, mục "Ghi lại, KHÔNG sửa"):
 * ② mã lớp Kế hoạch Test là link chỉ khi người xem mở được hồ sơ lớp (`xemHoSo` = quyền `classOverview`) · ③ gỡ "-" ô Không dự thi trả `boKhongDuThi`
 * (web: "Đã bỏ vắng · Hoàn tác" + nút Bỏ vắng ở chân hộp) · ④ hàng sổ nghĩa vụ bấm cả dòng · ⑥ "Lọc" 375 không dùng `<details className="contents">`.
 */
import type { YThucTestKit } from './yThuc.tests.ts';
import { docSach } from './panelUx3.tests.ts';
import { LUOT_LO_TRINH_CUOI_SQL } from '../students/tamDung.ts';

export async function runPrKiemTay1011Tests(t: YThucTestKit) {
  const { check, assert, conn, P, classId } = t as any;
  const attempts: any = await import('../fasttrack/attempts.ts');
  const skillSchedule: any = await import('../fasttrack/skillSchedule.ts');
  const week: any = await import('../platform/week.ts');
  const perm: any = await import('../permissions.ts');
  const keHoach: any = await import('../keHoach/keHoachTest.ts');
  const lopSvc: any = await import('../classes/classes.ts');
  const { xoaNho } = await import('../platform/nguCanhRequest.ts');
  console.log('\nKIEM-TAY-1011 · mã lớp theo quyền · Bỏ vắng ô Không dự thi · hàng sổ nghĩa vụ · Lọc 375');

  const thu = <T>(fn: () => T): T => {
    conn.exec('BEGIN IMMEDIATE');
    try { return fn(); } finally { conn.exec('ROLLBACK'); xoaNho(); }
  };
  const one = (sql: string, ...a: unknown[]) => (conn.prepare(sql).all(...a) as any[])[0];

  check('KT1011-1 · Kế hoạch Test: `xemHoSo` khớp quyền mở hồ sơ lớp (QL: mọi lớp; GV: lớp không dạy → false và hồ sơ lớp 403)', () => {
    const ql = keHoach.danhSachLop(P.mbManager).lop as any[];
    assert(ql.length > 0 && ql.every((l) => l.xemHoSo === true), 'QL phải mở được mọi lớp trong danh sách');
    for (const gv of [P.sTeacher, P.subjectTeacher, P.coreTeacher]) {
      for (const l of keHoach.danhSachLop(gv).lop as any[]) {
        const mo = (() => { try { lopSvc.classOverview(gv, l.id); return true; } catch (e: any) { if (e?.status === 403) return false; throw e; } })();
        assert(l.xemHoSo === mo, `${gv.fullName} · ${l.code}: xemHoSo=${l.xemHoSo} nhưng hồ sơ lớp ${mo ? 'mở được' : '403'}`);
      }
    }
    assert(perm.can(P.mbManager, 'attempt.view', { classId: classId('MB FT 101') }), 'tiền đề quyền QL');
  });

  check('KT1011-2 · gỡ "-" ô Không dự thi (MT cũ) trả `boKhongDuThi`; ghi lại "-" (Hoàn tác) về Không dự thi', () => thu(() => {
    const lop = classId('MB FT 101');
    const a = one(
      `SELECT a.id FROM assessment_attempts a JOIN students s ON s.id = a.student_id AND s.status = 'active' AND s.archived_at IS NULL AND ${LUOT_LO_TRINH_CUOI_SQL('a')}
        JOIN enrollments e ON e.student_id = s.id AND e.class_id = a.class_id AND e.status = 'active'
       WHERE a.class_id = ? AND a.kind = 'mock' AND a.status != 'cancelled' AND a.lich_su = 0 ORDER BY a.id LIMIT 1`, lop)?.id as number;
    assert(!!a, 'tiền đề: lượt MT ở MB FT 101');
    const W = week.ensurePeriod('2026-11-02').id as number, CU = '2026-11-25';
    skillSchedule.ensureSkillRows(a);
    conn.prepare('DELETE FROM assessment_scores WHERE attempt_id = ?').run(a);
    conn.prepare(`UPDATE attempt_skills SET planned_period_id = ?, sit_status = 'scheduled', required = 1, absence_move_count = 0, huy_vang = 0 WHERE attempt_id = ?`).run(W, a);
    conn.prepare(`UPDATE assessment_attempts SET status = 'planned', planned_period_id = ? WHERE id = ?`).run(W, a);
    xoaNho();
    const ghi = attempts.saveScore(P.lrTeacher, a, 'listening', { noShow: true }, CU);
    assert(ghi.vang?.kq === 'khong-du-thi', `tiền đề Không dự thi: ${JSON.stringify(ghi.vang)}`);
    const go = attempts.saveScore(P.lrTeacher, a, 'listening', { noShow: false }, CU);
    assert(go.boKhongDuThi === true && !go.goVang, `gỡ Không dự thi: ${JSON.stringify({ bo: go.boKhongDuThi, goVang: go.goVang })}`);
    /* Ô đã hết dấu: gỡ lần nữa không phải "bỏ vắng" — không cờ. */
    assert(!attempts.saveScore(P.lrTeacher, a, 'listening', { noShow: false }, CU)?.boKhongDuThi, 'ô không có "-" không được báo bỏ vắng');
    const lai = attempts.saveScore(P.lrTeacher, a, 'listening', { noShow: true }, CU);
    assert(lai.vang?.kq === 'khong-du-thi', 'Hoàn tác = ghi lại "-" → Không dự thi');
  }));

  check('KT1011-3 · web: mã lớp chữ thường khi !xemHoSo · Bỏ vắng ô Không dự thi + toast Hoàn tác · hàng sổ nghĩa vụ bấm được · Lọc 375 không `details.contents`', () => {
    assert(/lop\.xemHoSo === false \? <span/.test(docSach('web/src/modules/test/keHoach/LopKeHoach.tsx')), 'mã lớp vẫn luôn là link');
    const hop = docSach('web/src/modules/fasttrack/HopNhapDiem.tsx');
    assert(/cell\.noShow\?\.state === 'khong-du-thi'/.test(hop) && /boKhongDuThi && !daLuu/.test(hop), 'hộp thiếu Bỏ vắng cho ô Không dự thi');
    assert(/r\?\.boKhongDuThi[\s\S]{0,400}Hoàn tác/.test(docSach('web/src/modules/fasttrack/ScoreEntry.tsx')), 'thiếu toast Đã bỏ vắng · Hoàn tác');
    assert(/onHang=\{\(h\) => navigate\(h\.href\)\}/.test(docSach('web/src/ui/BangLuotPanel.tsx')), 'hàng sổ nghĩa vụ không bấm được');
    assert(/tuConTuongTac/.test(docSach('web/src/ui/Bang.tsx')), 'Bang: bấm link trong hàng sẽ mở hàng lần nữa');
    assert(!/<details className="contents">/.test(docSach('web/src/modules/test/KeHoachTestTab.tsx')), 'Lọc 375 còn details.contents');
  });
}
