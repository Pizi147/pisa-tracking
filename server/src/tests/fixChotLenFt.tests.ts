/**
 * FIX-CHOT-LEN-FT (07/10): việc QL "Chốt lên FT · {lớp}" phải tự xong khi lớp đã ghi Lộ trình tiếp theo cả lớp
 * (ra lệnh chuyển lớp — `lenh_chuyen_lop`, bàn giao mở) dù `lo_trinh_tiep_theo` chưa có dòng (chỉ ghi lúc thi hành).
 * PR-LCb: việc đổi thành "Chốt lộ trình" (`lopChoChotLoTrinh`) — vẫn xong khi mọi em có quyết định chuyển lớp đang chờ.
 */
import type { YThucTestKit } from './yThuc.tests.ts';

export async function runFixChotLenFtTests(t: YThucTestKit) {
  const { check, assert, conn, P, TODAY, addDays } = t;
  const week: any = await import('../platform/week.ts');
  const intake: any = await import('../classes/intake.ts');
  const regular: any = await import('../normal/regular.ts');
  const mywork: any = await import('../worklist/mywork.ts');
  const schedule: any = await import('../classes/schedule.ts');
  const lenhSvc: any = await import('../classes/lenhChuyen.ts');
  console.log('\nFIX-CHOT-LEN-FT · Chốt lên FT tự xong khi lớp đã có lộ trình / đã bàn giao');
  const QL = P.mbManager;
  const get = (sql: string, ...a: unknown[]) => conn.prepare(sql).get(...a) as any;
  const MB = (conn.prepare(`SELECT id FROM branches WHERE code = 'MB'`).get() as any).id as number;
  const thu2 = (n: number) => addDays(week.mondayOf(TODAY), -7 * (n - 1));
  let seq = 0;
  /* Lớp ở tuần 7 (FOU 8 tuần: hạn = CN tuần 7, trong cửa sổ). */
  const taoLop = (soEm: number) => {
    seq += 1;
    const lop = intake.createClass(P.admin, { code: `MB FCF-${seq}`, branchId: MB, kind: 'FOU', isFastTrack: false, startDate: thu2(7), startPeriodId: week.ensurePeriod(thu2(7)).id });
    const now = new Date().toISOString();
    const sids: number[] = [];
    for (let i = 0; i < soEm; i++) {
      const tag = `FCF-${seq}-${i}`;
      const sid = Number(conn.prepare(`INSERT INTO students (student_code, full_name, normalized_name, branch_id, status, created_at) VALUES (?,?,?,?, 'active', ?)`)
        .run(`PISA-${tag}`, `Học viên ${tag}`, `hoc vien ${tag.toLowerCase()}`, MB, now).lastInsertRowid);
      conn.prepare(`INSERT INTO enrollments (student_id, class_id, status, started_at, created_at) VALUES (?,?, 'active', ?, ?)`).run(sid, lop.id, thu2(7), now);
      conn.prepare(`INSERT INTO learning_cycles (student_id, seq, route, programme_code, target_score, started_at, status, created_at) VALUES (?, 1, NULL, 'FOU', 6, ?, 'active', ?)`)
        .run(sid, thu2(7), now);
      sids.push(sid);
    }
    regular.planRegularTests(P.admin, lop.id);
    return { classId: lop.id as number, sids };
  };
  const lenh = (sid: number, lop: number, huong: string, trangThai = 'cho') => conn.prepare(
    `INSERT INTO lenh_chuyen_lop (student_id, lop_nguon_id, huong, boi_canh, tuan_bat_dau, nguoi_ra_lenh, ngay_ra_lenh, trang_thai, tao_luc)
     VALUES (?, ?, ?, 'cuoi-khoa', ?, ?, ?, ?, ?)`).run(sid, lop, huong, addDays(week.mondayOf(TODAY), 7), QL.userId, TODAY, trangThai, new Date().toISOString());
  const coViec = (lop: number) => mywork.myWork(QL, { branchId: MB }).groups.flatMap((g: any) => g.items).some((i: any) => i.group === 'chot_len_ft' && i.classId === lop);
  /* Tổng quan (chỉ số + dòng Cần xử lý) đọc cùng `lopChoChotLoTrinh`. */
  const tqCo = (lop: number) => lenhSvc.lopChoChotLoTrinh(QL, MB, TODAY).some((x: any) => x.classId === lop);

  check('FCF 1 · FOU W7: chưa có hướng → còn việc (Công việc + Tổng quan)', () => {
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
    const soEm = () => lenhSvc.lopChoChotLoTrinh(QL, MB, TODAY).find((x: any) => x.classId === l.classId)?.chuaLenh ?? 0;
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
  check('FCF 5 · seed: MB FOU 22/23 ở tuần Final → PR-LCb: VẪN "Chốt lộ trình" (quá hạn) khi còn em chưa có lệnh; không còn "Chuyển tiếp lớp"', () => {
    const con = new Map(lenhSvc.lopChoChotLoTrinh(QL, MB, TODAY).map((x: any) => [x.classId, x.chuaLenh]));
    const l22 = t.classId('MB FOU 22');
    const l23 = t.classId('MB FOU 23');
    const tuanFinal = (id: number) => schedule.classProgress(id).finalWeekStart;
    assert(tuanFinal(l22) === week.mondayOf(TODAY) && tuanFinal(l23) === week.mondayOf(TODAY), `seed đổi tuần: ${tuanFinal(l22)} · ${tuanFinal(l23)}`);
    const ds = mywork.myWork(QL, { branchId: MB }).groups.flatMap((g: any) => g.items);
    assert(!ds.some((i: any) => i.group === 'placement'), 'còn việc Chuyển tiếp lớp');
    for (const id of [l22, l23]) {
      const v = ds.filter((i: any) => i.group === 'chot_len_ft' && i.classId === id);
      const chuaLenh = get(`SELECT COUNT(*) n FROM enrollments e JOIN students s ON s.id = e.student_id
        WHERE e.class_id = ? AND e.status = 'active' AND s.status = 'active' AND s.archived_at IS NULL AND NOT EXISTS (SELECT 1 FROM lenh_chuyen_lop l WHERE l.student_id = e.student_id AND l.trang_thai = 'cho')`, id).n as number;
      assert((con.get(id) ?? 0) === chuaLenh && v.length === (chuaLenh > 0 ? 1 : 0) && v.every((i: any) => i.urgency === 'overdue'),
        `lớp ${id}: Chốt lộ trình ${JSON.stringify(v.map((i: any) => [i.reason, i.urgency]))}, em chưa có lệnh ${chuaLenh}`);
    }
  });
}
