/**
 * FIX-CHOT-LEN-FT (07/10): việc QL "Chốt lên FT · {lớp}" phải tự xong khi lớp đã ghi Lộ trình tiếp theo cả lớp
 * (ra lệnh chuyển lớp — `lenh_chuyen_lop`, bàn giao mở) dù `lo_trinh_tiep_theo` chưa có dòng (chỉ ghi lúc thi hành).
 */
import type { YThucTestKit } from './yThuc.tests.ts';

export async function runFixChotLenFtTests(t: YThucTestKit) {
  const { check, assert, conn, P, TODAY, addDays } = t;
  const week: any = await import('../platform/week.ts');
  const intake: any = await import('../classes/intake.ts');
  const regular: any = await import('../normal/regular.ts');
  const mywork: any = await import('../worklist/mywork.ts');
  const mt0: any = await import('../fasttrack/mt0.ts');
  console.log('\nFIX-CHOT-LEN-FT · Chốt lên FT tự xong khi lớp đã có lộ trình / đã bàn giao');
  const QL = P.mbManager;
  const MB = (conn.prepare(`SELECT id FROM branches WHERE code = 'MB'`).get() as any).id as number;
  const thu2 = (n: number) => addDays(week.mondayOf(TODAY), -7 * (n - 1));
  let seq = 0;
  const taoLop = (soEm: number) => {
    seq += 1;
    const lop = intake.createClass(P.admin, { code: `MB FCF-${seq}`, branchId: MB, kind: 'FOU', isFastTrack: false, startDate: thu2(8), startPeriodId: week.ensurePeriod(thu2(8)).id });
    const now = new Date().toISOString();
    const sids: number[] = [];
    for (let i = 0; i < soEm; i++) {
      const tag = `FCF-${seq}-${i}`;
      const sid = Number(conn.prepare(`INSERT INTO students (student_code, full_name, normalized_name, branch_id, status, created_at) VALUES (?,?,?,?, 'active', ?)`)
        .run(`PISA-${tag}`, `Học viên ${tag}`, `hoc vien ${tag.toLowerCase()}`, MB, now).lastInsertRowid);
      conn.prepare(`INSERT INTO enrollments (student_id, class_id, status, started_at, created_at) VALUES (?,?, 'active', ?, ?)`).run(sid, lop.id, thu2(8), now);
      conn.prepare(`INSERT INTO learning_cycles (student_id, seq, route, programme_code, target_score, started_at, status, created_at) VALUES (?, 1, NULL, 'FOU', 6, ?, 'active', ?)`)
        .run(sid, thu2(8), now);
      sids.push(sid);
    }
    regular.planRegularTests(P.admin, lop.id);
    return { classId: lop.id as number, sids };
  };
  const lenh = (sid: number, lop: number, huong: string, trangThai = 'cho') => conn.prepare(
    `INSERT INTO lenh_chuyen_lop (student_id, lop_nguon_id, huong, boi_canh, tuan_bat_dau, nguoi_ra_lenh, ngay_ra_lenh, trang_thai, tao_luc)
     VALUES (?, ?, ?, 'cuoi-khoa', ?, ?, ?, ?, ?)`).run(sid, lop, huong, addDays(week.mondayOf(TODAY), 7), QL.userId, TODAY, trangThai, new Date().toISOString());
  const coViec = (lop: number) => mywork.myWork(QL, { branchId: MB }).groups.flatMap((g: any) => g.items).some((i: any) => i.group === 'chot_len_ft' && i.classId === lop);
  /* Tổng quan (chỉ số + dòng Cần xử lý) và badge đọc cùng `lopChoChotLenFt`. */
  const tqCo = (lop: number) => mt0.lopChoChotLenFt(QL, MB, TODAY).some((x: any) => x.classId === lop);

  check('FCF 1 · FOU W8: chưa có hướng → còn việc (Công việc + Tổng quan)', () => {
    const l = taoLop(1);
    assert(coViec(l.classId) && tqCo(l.classId), 'phải có việc');
  });
  check('FCF 2 · lộ trình cả lớp đã ghi (lệnh chuyển lớp, gồm em không lên FT) → việc tự xong', () => {
    const l = taoLop(2);
    lenh(l.sids[0], l.classId, 'len_lop');
    lenh(l.sids[1], l.classId, 'bao_luu');
    assert(!coViec(l.classId), 'Công việc còn việc Chốt lên FT');
    assert(!tqCo(l.classId), 'Tổng quan còn lớp');
  });
  check('FCF 3 · một phần em có lệnh (kể cả Dừng học) → việc còn, đếm đúng số em chưa có hướng; đủ em → xong; lệnh huỷ không tính', () => {
    const l = taoLop(3);
    const soEm = () => mt0.lopChoChotLenFt(QL, MB, TODAY).find((x: any) => x.classId === l.classId)?.soEm ?? 0;
    lenh(l.sids[0], l.classId, 'len_lop', 'huy');
    assert(soEm() === 3, `lệnh huỷ không tính: ${soEm()}`);
    lenh(l.sids[0], l.classId, 'dung_hoc');
    assert(coViec(l.classId) && soEm() === 2, `một em Dừng học, hai em chưa có hướng → còn việc: ${soEm()}`);
    lenh(l.sids[1], l.classId, 'len_lop');
    lenh(l.sids[2], l.classId, 'fast_track');
    assert(!coViec(l.classId), 'đủ em có hướng → xong');
  });
  check('FCF 4 · lo_trinh_tiep_theo "Chưa quyết" nhưng lệnh chưa huỷ có hướng khác → đã có hướng', () => {
    const l = taoLop(1);
    const now = new Date().toISOString();
    conn.prepare(`INSERT INTO lo_trinh_tiep_theo (student_id, class_id, huong, created_at, updated_at) VALUES (?, ?, 'chua_quyet', ?, ?)`).run(l.sids[0], l.classId, now, now);
    assert(coViec(l.classId), 'Chưa quyết, chưa lệnh → còn việc');
    conn.prepare(`INSERT INTO lenh_chuyen_lop (student_id, lop_nguon_id, huong, boi_canh, tuan_bat_dau, nguoi_ra_lenh, ngay_ra_lenh, trang_thai, tao_luc)
      VALUES (?, ?, 'fast_track', 'giua-khoa', ?, ?, ?, 'cho', ?)`).run(l.sids[0], l.classId, addDays(week.mondayOf(TODAY), 7), QL.userId, TODAY, now);
    assert(!coViec(l.classId), 'lệnh có hướng thắng Chưa quyết');
  });
  check('FCF 5 · seed: MB FOU 23 (mọi em có lệnh) hết việc; MB FOU 22 còn việc chỉ vì em chưa có lệnh (em GVCN đề xuất)', () => {
    const con = new Map(mt0.lopChoChotLenFt(QL, MB, TODAY).map((x: any) => [x.classId, x.soEm]));
    assert(!con.has(t.classId('MB FOU 23')), 'MB FOU 23 còn việc');
    const l22 = t.classId('MB FOU 22');
    const chuaLenh = (conn.prepare(`SELECT COUNT(*) n FROM enrollments e WHERE e.class_id = ? AND e.status = 'active'
      AND NOT EXISTS (SELECT 1 FROM lenh_chuyen_lop l WHERE l.student_id = e.student_id AND l.lop_nguon_id = e.class_id AND l.trang_thai != 'huy' AND l.huong != 'chua_quyet')
      AND NOT EXISTS (SELECT 1 FROM lo_trinh_tiep_theo lt WHERE lt.student_id = e.student_id AND lt.class_id = e.class_id AND lt.huong != 'chua_quyet')`).get(l22) as any).n;
    assert((con.get(l22) ?? 0) === chuaLenh, `MB FOU 22: việc đếm ${con.get(l22)}, em chưa có hướng ${chuaLenh}`);
  });
}
