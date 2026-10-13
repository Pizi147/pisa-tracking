/** PHÉP KIỂM PR-VN3 — việc nhỏ dồn lại (sau KV, GOP, CT2, HOP1). Task 1: Sửa PA tính là "đã đụng". */
import type { YThucTestKit } from './yThuc.tests.ts';

export async function runPrVn3Tests(t: YThucTestKit) {
  const { check, assert, conn, P, TODAY, classId } = t;
  const d: any = await import('../../../shared/domain/index.ts');
  const cases: any = await import('../cases/cases.ts');
  const intake: any = await import('../classes/intake.ts');
  const regular: any = await import('../normal/regular.ts');
  const lenh: any = await import('../classes/lenhChuyen.ts');
  const week: any = await import('../platform/week.ts');
  const { loadPrincipal } = await import('../permissions.ts');
  const { myWork } = await import('../worklist/mywork.ts');
  const { nhacViec } = await import('../worklist/nhacViec.ts');
  const { createApp } = await import('../app.ts');
  const { createSession } = await import('../auth.ts');
  const skillSch: any = await import('../fasttrack/skillSchedule.ts');
  const keHoach: any = await import('../keHoach/keHoachTest.ts');
  const fs = await import('node:fs');
  const path = await import('node:path');
  const { fileURLToPath } = await import('node:url');
  console.log('\nPR-VN3 · Việc nhỏ dồn lại');

  const get = (sql: string, ...a: unknown[]) => conn.prepare(sql).get(...a) as any;
  const all = (sql: string, ...a: unknown[]) => conn.prepare(sql).all(...a) as any[];
  const MB = get(`SELECT id FROM branches WHERE code = 'MB'`).id as number;
  const THU_HAI = d.tuanChonDuoc(TODAY)[0] as string;
  const GV = all(`SELECT DISTINCT ur.user_id u FROM user_roles ur JOIN roles r ON r.id = ur.role_id
     WHERE r.key = 'teacher' AND ur.status = 'active' AND ur.branch_id = ? ORDER BY ur.user_id LIMIT 4`, MB).map((r) => r.u as number);
  assert(GV.length === 4, `cần 4 giáo viên MB, có ${GV.length}`);
  let seq = 0;
  const lop = (kind: string, tuanHienTai = 1) => {
    seq += 1;
    const bat = d.mondayOfDate(t.addDays(TODAY, -7 * (tuanHienTai - 1)));
    return (intake.createClass(P.admin, {
      code: `MB-VN3${seq}`, branchId: MB, kind, isFastTrack: false, route: null, startDate: bat, startPeriodId: week.ensurePeriod(bat).id,
    }) as any).id as number;
  };
  const ganGv = (l: number, userId: number, skill: string | null) => conn.prepare(
    `INSERT INTO teacher_assignments (user_id, class_id, skill, is_core, effective_from, status, created_at) VALUES (?,?,?,?, '2026-01-01', 'active', ?)`,
  ).run(userId, l, skill, skill ? 0 : 1, new Date().toISOString());
  const hocVien = (l: number, ma: string) => {
    seq += 1;
    const now = new Date().toISOString();
    const sid = Number(conn.prepare(`INSERT INTO students (student_code, full_name, normalized_name, branch_id, status, created_at) VALUES (?,?,?,?, 'active', ?)`)
      .run(`PISA-VN3-${seq}`, `Hoc vien VN3 ${seq}`, `hoc vien vn3 ${seq}`, MB, now).lastInsertRowid);
    conn.prepare(`INSERT INTO enrollments (student_id, class_id, status, started_at, created_at) VALUES (?,?, 'active', ?, ?)`).run(sid, l, TODAY, now);
    conn.prepare(`INSERT INTO learning_cycles (student_id, seq, route, programme_code, target_score, started_at, status, created_at) VALUES (?, 1, NULL, ?, NULL, ?, 'active', ?)`)
      .run(sid, ma, TODAY, now);
    regular.planRegularTests(P.admin, l, { studentIds: [sid], kinds: ['final'] });
    const a = get(`SELECT id FROM assessment_attempts WHERE student_id = ? AND class_id = ? AND kind = 'final' ORDER BY id DESC LIMIT 1`, sid, l).id as number;
    return { sid, a };
  };
  const nhap = (a: number, diem: Record<string, number | null>) => {
    for (const [k, v] of Object.entries(diem)) regular.saveRegularScore(P.admin, a, k, { score: v, total: v === null ? null : 25, lyDo: 'Phép kiểm VN3' });
  };
  const ra = (nguon: number, sid: number, huong: string, dich: number) =>
    lenh.raLenh(P.mbManager, { lopNguonId: nguon, boiCanh: 'cuoi-khoa', tuanChung: null, dongs: [{ studentId: sid, huong, toClassId: dich, tuan: THU_HAI }] });
  const lenhCua = (sid: number) => get('SELECT * FROM lenh_chuyen_lop WHERE student_id = ? ORDER BY id DESC LIMIT 1', sid);
  const mts = (sid: number) => all('SELECT * FROM mini_test WHERE student_id = ?', sid);
  const paMt = (a: number) => all(`SELECT * FROM case_interventions WHERE nhom_bo_tro = ? AND status != 'cancelled'`, `mt:${a}`);
  /** FOU 9 tuần: đã sinh bộ bổ trợ Final (55% lên BE). */
  const daSinh = () => {
    const nguon = lop('FOU', 9), dich = lop('BE');
    ganGv(nguon, GV[0], null); ganGv(nguon, GV[1], 'writing'); ganGv(nguon, GV[2], 'speaking');
    ganGv(dich, GV[3], null); ganGv(dich, GV[0], 'writing'); ganGv(dich, GV[0], 'speaking');
    const e = hocVien(nguon, 'FOU');
    nhap(e.a, { listening: 18, reading: 18, writing: 10, speaking: 9 });
    ra(nguon, e.sid, 'len_lop', dich);
    assert(mts(e.sid).length === 1 && paMt(e.a).length === 2, `chưa sinh bộ: ${mts(e.sid).length} · ${paMt(e.a).length}`);
    return { nguon, e };
  };
  const doiHocLai = (_nguon: number, sid: number) => lenh.suaLenh(P.mbManager, lenhCua(sid).id, { huong: 'hoc_lai', toClassId: lop('FOU') });
  const dongLichSu = (nhom: string) => all(`SELECT * FROM sos_case_history WHERE field = 'giu_bo_tro' AND old_value = ?`, nhom);

  check('VN3-1a/c · QL Sửa PA (đổi người dạy) rồi đổi quyết định sang học lại → PA, Case, Mini Test còn nguyên; đúng MỘT dòng lịch sử "Giữ bổ trợ: PA đã được sửa" dù đồng bộ lặp', () => {
    const { nguon, e } = daSinh();
    const pa = paMt(e.a), caseIds = pa.map((x) => x.case_id);
    const nguoiMoi = GV.find((u) => u !== pa[0].performer_user_id)!;
    cases.suaPa(P.mbManager, pa[0].id, { performerUserId: nguoiMoi });
    doiHocLai(nguon, e.sid);
    assert(mts(e.sid).length === 1 && paMt(e.a).length === 2, `Sửa PA rồi đổi quyết định mà vẫn huỷ: ${mts(e.sid).length} · ${paMt(e.a).length}`);
    assert(caseIds.every((c) => get('SELECT status FROM sos_cases WHERE id = ?', c).status !== 'done'), 'Case bị đóng');
    require_ok(e.a);
    nhap(e.a, { speaking: 9 });   // đồng bộ lặp
    const ls = dongLichSu(`mt:${e.a}`);
    assert(ls.length === 1 && ls[0].new_value === 'Giữ bổ trợ: PA đã được sửa', JSON.stringify(ls));
    assert(all(`SELECT 1 FROM sos_case_history WHERE case_id IN (${caseIds.map(() => '?').join(',')}) AND field = 'giu_bo_tro'`, ...caseIds).length === 1, 'dòng lịch sử không đúng một');
  });
  function require_ok(a: number) { assert(paMt(a).every((x) => x.status === 'started'), 'PA không còn chạy'); }

  check('VN3-1b · không Sửa PA → đổi quyết định vẫn huỷ như cũ, không dòng lịch sử', () => {
    const { nguon, e } = daSinh();
    doiHocLai(nguon, e.sid);
    assert(mts(e.sid).length === 0 && paMt(e.a).length === 0, `vẫn còn: ${mts(e.sid).length} · ${paMt(e.a).length}`);
    assert(dongLichSu(`mt:${e.a}`).length === 0, 'không được ghi giữ bổ trợ');
  });

  check('VN3-2 · Case chưa có PA, lớp FT chưa phân công GVBM, chủ Case = GVCN dự phòng: việc "Thêm PA" tới người thêm được PA; Quản trị Nhắc → 200, thông báo tới người đó', () => {
    const ft = (intake.createClass(P.admin, {
      code: `MB-VN3F${++seq}`, branchId: MB, kind: 'FT', isFastTrack: true, route: 'LT1',
      startDate: d.mondayOfDate(TODAY), startPeriodId: week.ensurePeriod(d.mondayOfDate(TODAY)).id,
    }) as any).id as number;
    ganGv(ft, GV[3], null);   // chỉ GVCN, không GVBM kỹ năng
    const now = new Date().toISOString();
    const sid = Number(conn.prepare(`INSERT INTO students (student_code, full_name, normalized_name, branch_id, status, created_at) VALUES (?,?,?,?, 'active', ?)`)
      .run(`PISA-VN3-F${++seq}`, `Hoc vien VN3 FT ${seq}`, `hoc vien vn3 ft ${seq}`, MB, now).lastInsertRowid);
    conn.prepare(`INSERT INTO enrollments (student_id, class_id, status, started_at, created_at) VALUES (?,?, 'active', ?, ?)`).run(sid, ft, TODAY, now);
    const cyc = Number(conn.prepare(`INSERT INTO learning_cycles (student_id, seq, route, programme_code, target_score, started_at, status, created_at) VALUES (?, 1, 'LT1', NULL, NULL, ?, 'active', ?)`)
      .run(sid, TODAY, now).lastInsertRowid);
    const e = { sid };
    const caseId = Number(conn.prepare(
      `INSERT INTO sos_cases (student_id, cycle_id, topic, category, origin_kind, detected_at, status, owner_user_id, dedup_key, title, created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
    ).run(e.sid, cyc, 'writing', 'writing', 'chuyen_cap', TODAY, 'open', GV[3], d.caseDedupKey({ category: 'writing', studentId: e.sid, cycleId: cyc }), 'Case VN3', new Date().toISOString()).lastInsertRowid);
    const khoa = `support:${caseId}`;
    const thay = (pr: any, tatCa = false) => ((myWork(pr, { chiNhom: new Set(['no_plan']), ...(tatCa ? { nguoi: 'tat-ca' } : {}) } as any) as any).items as any[]).find((i) => i.key === khoa);
    assert(!thay(loadPrincipal(GV[3])), 'GVCN dự phòng không có quyền thêm PA kỹ năng này mà vẫn thấy việc');
    const viecQt = thay(P.admin, true);
    assert(viecQt && viecQt.ownerId !== GV[3] && viecQt.ownerId !== null, `người làm phải khác GVCN dự phòng: ${JSON.stringify(viecQt?.ownerId)}`);
    assert(thay(loadPrincipal(viecQt.ownerId)), 'người được giao không thấy việc của chính mình');
    const dem = () => (get(`SELECT COUNT(*) n FROM notifications WHERE kind = 'nhac_viec' AND user_id = ?`, viecQt.ownerId) as any).n as number;
    const truoc = dem();
    const r = nhacViec(P.admin, { key: khoa, ownerId: viecQt.ownerId });
    assert(!!r.daNhacLuc && dem() === truoc + 1, `Nhắc: ${JSON.stringify(r)} · thông báo ${truoc} → ${dem()}`);
  });

  await t.checkAsync('VN3-4 · /my-work không còn items, groups; dong + summary trùng byte với myWork()', async () => {
    const may = createApp().listen(0);
    may.keepAliveTimeout = 120_000;   // `myWork()` đồng bộ giữa hai lượt fetch có thể quá 5 s mặc định → ECONNRESET
    try {
      const cong = (may.address() as any).port as number;
      for (const [pr, q] of [[P.coreTeacher, ''], [P.mbManager, '?nguoi=tat-ca']] as const) {
        const goi = async () => {
          const r = await fetch(`http://127.0.0.1:${cong}/api/my-work${q}`, { headers: { cookie: `pisa_demo_session=${createSession(pr.userId)}` } });
          return { st: r.status, j: await r.json() as any };
        };
        await goi();   // lần đầu có thể ghi (quét lệnh / vắng / hết hạn) — so ở trạng thái đã ổn định
        const { st, j } = await goi();
        const w: any = JSON.parse(JSON.stringify(myWork(loadPrincipal(pr.userId), q ? { nguoi: 'tat-ca' } : {})));
        assert(st === 200 && !('items' in j) && !('groups' in j), `${st} · ${Object.keys(j)}`);
        const lech = (j.dong as any[]).findIndex((x, i) => JSON.stringify(x) !== JSON.stringify(w.dong[i]));
        assert(j.dong.length === w.dong.length && lech < 0 && JSON.stringify(j.summary) === JSON.stringify(w.summary),
          `dong / summary lệch: ${j.dong.length} vs ${w.dong.length}, dòng ${lech} ${lech >= 0 ? JSON.stringify(j.dong[lech]).slice(0, 300) + ' ≠ ' + JSON.stringify(w.dong[lech]).slice(0, 300) : ''}`);
      }
    } finally { may.close(); }
  });

  check('VN3-5 · dời lịch một kỹ năng ở hộp đợt: có Lý do → nhật ký lượt ghi lý do; không Lý do (null) vẫn lưu; web gửi reason đã trim, trống → null', () => {
    const LOP = classId('MB FT 101');
    const tuanNay = week.mondayOf(TODAY);
    const tuan = (n: number) => week.ensurePeriod(t.addDays(tuanNay, 7 * n));
    const r = intake.commitIntake(P.admin, { classId: LOP, rows: [{ fullName: `VN3 Em ${seq++}`, target: 6.5, startWeek: tuanNay, email: 'hv@demo.test', dob: '2010-01-01' }] });
    assert(r.added === 1, JSON.stringify(r.failed));
    const a = (all(`SELECT id FROM assessment_attempts WHERE student_id = ? AND status != 'cancelled' ORDER BY attempt_no`, r.studentIds[0])[1]).id as number;
    skillSch.ensureSkillRows(a);
    conn.prepare(`UPDATE attempt_skills SET planned_period_id = ?, plan_source = 'manual' WHERE attempt_id = ?`).run(tuan(4).id, a);
    const tuanCua = () => get(`SELECT p.week_start w FROM attempt_skills s JOIN report_periods p ON p.id = s.planned_period_id WHERE s.attempt_id = ? AND s.skill = 'listening'`, a).w as string;
    const lyDoCua = () => all(`SELECT reason FROM attempt_schedule_history WHERE attempt_id = ? AND action = 'skill_week_set' AND reason IS NOT NULL`, a).map((x) => x.reason);
    keHoach.luuDot(P.mbManager, { attemptId: a, kyNang: [{ skill: 'listening', periodId: tuan(6).id }], lyDoBo: null, reason: 'Trùng lịch phòng thi', force: true });
    assert(tuanCua() === t.addDays(tuanNay, 42) && lyDoCua().includes('Trùng lịch phòng thi'), `có lý do: ${tuanCua()} · ${lyDoCua()}`);
    keHoach.luuDot(P.mbManager, { attemptId: a, kyNang: [{ skill: 'listening', periodId: tuan(7).id }], lyDoBo: null, reason: null, force: true });
    assert(tuanCua() === t.addDays(tuanNay, 49) && lyDoCua().length === 1, `không lý do: ${tuanCua()} · ${lyDoCua()}`);
    const web = fs.readFileSync(path.join(path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..'), 'web/src/modules/test/keHoach/HopKyNang.tsx'), 'utf8');
    assert(/reason: lyDo\.trim\(\) \|\| null/.test(web) && /nhan="Lý do" tuyChon/.test(web), 'HopKyNang thiếu ô Lý do tuỳ chọn gửi reason');
  });
}
