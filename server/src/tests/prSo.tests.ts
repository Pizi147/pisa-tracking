/** PHÉP KIỂM PR-SO — số liệu một nguồn & dọn mã máy chủ (kế hoạch 2026-10-04-pr-so-so-lieu-don-ma, SO-1 → SO-4). */
import type { YThucTestKit } from './yThuc.tests.ts';

export async function runPrSoTests(t: YThucTestKit) {
  const { check, assert, conn, P, TODAY, classId, addDays } = t;
  const d: any = await import('../../../shared/domain/index.ts');
  const get = (sql: string, ...a: unknown[]) => conn.prepare(sql).get(...a) as any;
  const intake: any = await import('../classes/intake.ts');
  const cases: any = await import('../cases/cases.ts');
  const metrics: any = await import('../worklist/metrics.ts');
  const mw: any = await import('../worklist/mywork.ts');
  const studentsSvc: any = await import('../students/students.ts');
  const loTrinh: any = await import('../classes/loTrinhTiep.ts');
  const lenh: any = await import('../classes/lenhChuyen.ts');
  const itemsCua = (p: any, f: any = {}) => (mw.myWork(p, f).groups as any[]).flatMap((x) => x.items);
  let seq = 0;
  const emMoi = (lop: string) => {
    const ten = `PRSO HV ${++seq}`;
    intake.commitIntake(P.admin, { classId: classId(lop), rows: [{ fullName: ten, target: 6.5, email: 'hv@demo.test' }], idempotencyKey: `prso-${seq}` });
    return get('SELECT id FROM students WHERE full_name = ?', ten).id as number;
  };

  // ------------------------------------------------------------------ SO-1 · D2 một hàm chọn PA đại diện nhóm Bổ trợ
  console.log('\nPR-SO · (1) D2: PA đại diện nhóm Bổ trợ — Tổng quan và Công việc cùng một hàm');
  check('SO-1a · daiDienNhomBoTro: hạn sớm nhất (null cuối), hoà → id nhỏ; dòng không nhóm giữ nguyên, giữ thứ tự', () => {
    const r = (id: number, nhom: string | null, han: string | null, kind = 'bo_tro') => ({ id, kind, nhom_bo_tro: nhom, action_due: han });
    const ra = d.daiDienNhomBoTro([r(5, 'g1', '2026-09-20'), r(6, 'g1', '2026-09-10'), r(7, 'g1', null), r(8, null, '2026-09-01', 'tutor')]);
    assert(ra.map((x: any) => x.id).join() === '6,8', ra.map((x: any) => x.id).join());
    const hoa = d.daiDienNhomBoTro([r(9, 'g2', '2026-09-10'), r(3, 'g2', '2026-09-10'), r(4, 'g3', null), r(2, 'g3', null)]);
    assert(hoa.map((x: any) => x.id).join() === '3,2', hoa.map((x: any) => x.id).join());
  });

  check('SO-1b · nhóm Bổ trợ: PA id nhỏ hạn ngày mai, PA id lớn quá hạn 3 ngày → chỉ số QL có id lớn, Công việc QL có đúng dòng đó (quá hạn); số khớp', () => {
    const sid = emMoi('MB FOU 12');
    const moCase = (topic: string, parallel: boolean) => cases.reportIssue(P.normalCoreTeacher, { studentId: sid, topic, title: `Case bổ trợ SO-1b ${topic}`,
      summary: 'Case dùng cho phép kiểm PA đại diện nhóm.', primaryCode: d.issuesForTopic(topic)[0].code, idempotencyKey: `prso-1b-${topic}-${sid}`, parallel });
    const nhom = `prso-nhom-${sid}`;
    const pa = (caseId: number, han: string) => Number(conn.prepare(
      `INSERT INTO case_interventions (case_id, kind, description, performer_user_id, recorded_by, status, started_date, action_due, cycle_no, nhom_bo_tro, created_at)
       VALUES (?, 'bo_tro', 'Bổ trợ chung SO-1b', NULL, ?, 'started', ?, ?, 1, ?, ?)`).run(caseId, P.normalCoreTeacher.userId, addDays(TODAY, -21), han, nhom, new Date().toISOString()).lastInsertRowid);
    const nho = pa(moCase('reading', false).id, addDays(TODAY, 1));
    const lon = pa(moCase('listening', true).id, addDays(TODAY, -3));
    assert(nho < lon, 'dựng dữ liệu: id nhỏ trước');
    const ql = P.mbManager;
    const cs = (metrics.metricSet(ql, 'pa-can-cap-nhat', {}).ids as number[]).filter((id) => id === nho || id === lon);
    const v = itemsCua(ql, { nguoi: 'tat-ca' }).filter((i: any) => i.group === 'ghi_ket_qua_pa' && (i.key === `action:${nho}` || i.key === `action:${lon}`));
    assert(cs.join() === String(lon), `chỉ số: ${cs.join()} (mong ${lon})`);
    assert(v.length === 1 && v[0].key === `action:${lon}` && v[0].urgency === 'overdue', `Công việc: ${JSON.stringify(v.map((i: any) => [i.key, i.urgency]))}`);
  });

  // ------------------------------------------------------------------ SO-2 · cấm cấp riêng plan.week cho người chỉ có vai GV; D5 cờ hồ sơ
  console.log('\nPR-SO · (2) Quyền: plan.week không cấp riêng cho người chỉ có vai GV; cờ hồ sơ khớp quyền route (D5)');
  const accounts: any = await import('../platform/accounts.ts');
  const { loadPrincipal } = await import('../permissions.ts');
  const { tx } = await import('../db.ts');
  check('SO-2a · lyDoCamCapRieng: chỉ GV → lý do SCH-01; GV + Quản lý → null; không vai → null; quyền khác → null', () => {
    assert(/SCH-01/.test(d.lyDoCamCapRieng(['teacher'], 'plan.week') ?? ''), 'chỉ GV phải bị cấm');
    assert(d.lyDoCamCapRieng(['teacher', 'teacher'], 'plan.week'), 'hai dòng vai GV vẫn chỉ là GV');
    assert(d.lyDoCamCapRieng(['teacher', 'manager'], 'plan.week') === null, 'GV + QL');
    assert(d.lyDoCamCapRieng([], 'plan.week') === null, 'không vai');
    assert(d.lyDoCamCapRieng(['teacher'], 'student.view') === null, 'quyền khác');
  });

  check('SO-2b · Quản trị cấp riêng plan.week: tài khoản chỉ có vai GV → 400, user_permissions không đổi; tài khoản Quản lý → lưu được', () => {
    const gv = get(`SELECT u.id FROM users u WHERE u.deleted_at IS NULL
      AND EXISTS (SELECT 1 FROM user_roles ur JOIN roles r ON r.id = ur.role_id WHERE ur.user_id = u.id AND ur.status = 'active' AND r.key = 'teacher')
      AND NOT EXISTS (SELECT 1 FROM user_roles ur JOIN roles r ON r.id = ur.role_id WHERE ur.user_id = u.id AND ur.status = 'active' AND r.key != 'teacher') LIMIT 1`).id;
    const quyenCua = (uid: number) => JSON.stringify(conn.prepare('SELECT permission_id, branch_id FROM user_permissions WHERE user_id = ? ORDER BY 1, 2').all(uid));
    const truoc = quyenCua(gv);
    let loi: any = null;
    try { accounts.setUserPermissions(P.admin, gv, [{ permission: 'plan.week', branchCode: 'MB' }], 'Thử SO-2b'); } catch (e) { loi = e; }
    assert(loi?.status === 400 && /SCH-01/.test(loi.message), `GV: ${loi?.status} ${loi?.message}`);
    assert(quyenCua(gv) === truoc, 'user_permissions của GV bị đổi');
    const ql = P.mbManager.userId;
    const truocQl = conn.prepare('SELECT * FROM user_permissions WHERE user_id = ?').all(ql) as any[];
    accounts.setUserPermissions(P.admin, ql, [{ permission: 'plan.week', branchCode: 'CP' }], 'Thử SO-2b');
    assert(get(`SELECT 1 x FROM user_permissions up JOIN permissions p ON p.id = up.permission_id WHERE up.user_id = ? AND p.key = 'plan.week'`, ql), 'QL không lưu được');
    conn.prepare('DELETE FROM user_permissions WHERE user_id = ?').run(ql);
    for (const r of truocQl) conn.prepare('INSERT INTO user_permissions (user_id, permission_id, branch_id, note, granted_by, created_at) VALUES (?,?,?,?,?,?)')
      .run(r.user_id, r.permission_id, r.branch_id, r.note, r.granted_by, r.created_at);
  });

  check('SO-2c (D5) · cờ ⋮ hồ sơ (chuyenLop, tamDung, ketThuc, luuTru, ghiLoTrinhTiep) = hàm ghi không ném lỗi quyền — QT, QL, GVCN, GVBM × em đang học / đã kết thúc (đã bỏ lưu trữ)', () => {
    const { lopHocCua } = loTrinh;
    const lop = classId('MB FOU 12');
    const dangHoc = emMoi('MB FOU 12');
    const daXong = emMoi('MB FOU 12');
    studentsSvc.setStudentStatus(P.admin, daXong, 'finished', TODAY, 'Kết thúc thử SO-2c');
    /* Kết thúc học tự vào Lưu trữ → hồ sơ chỉ xem, mọi cờ tắt theo thiết kế (PR-XOA §2). Bỏ lưu trữ để soi cờ theo QUYỀN. */
    assert(Object.entries(loTrinh.lopHocCua(P.admin, daXong, null).quyen).every(([k, v]) => k === 'boLuuTru' || v === false), 'em trong Lưu trữ còn cờ ghi');
    studentsSvc.unarchiveStudent(P.admin, daXong);
    /* Gọi trong giao dịch rồi cuộn lại: chỉ cần biết hàm ghi có ném lỗi QUYỀN (403) không. */
    const CUON = new Error('cuộn lại');
    const thu = (fn: () => unknown): any => { try { tx(() => { fn(); throw CUON; }); } catch (e: any) { return e === CUON ? null : e; } return null; };
    const lech: string[] = [];
    for (const [ten, p] of [['QT', P.admin], ['QL', P.mbManager], ['GVCN', P.normalCoreTeacher], ['GVBM', P.normalSubjectTeacher]] as const) {
      for (const [loai, sid] of [['đang học', dangHoc], ['đã kết thúc', daXong]] as const) {
        const cur = loai === 'đang học' ? { class_id: lop } : null;
        const q = lopHocCua(p, sid, cur).quyen;
        const khongQuyen = (fn: () => unknown) => thu(fn)?.status === 403;
        const hanh: [string, boolean, boolean][] = [
          ['tamDung', q.tamDung, !khongQuyen(() => studentsSvc.setStudentStatus(p, sid, 'inactive', TODAY, 'thử'))],
          ['ketThuc', q.ketThuc, !khongQuyen(() => studentsSvc.setStudentStatus(p, sid, 'finished', TODAY, 'thử'))],
          ['luuTru', q.luuTru, thu(() => studentsSvc.archiveStudent(p, sid)) === null],
        ];
        if (cur) hanh.push(
          ['chuyenLop', q.chuyenLop, !khongQuyen(() => lenh.raLenh(p, { lopNguonId: lop, boiCanh: 'giua-khoa', tuanChung: null, dongs: [] }))],
          ['ghiLoTrinhTiep', q.ghiLoTrinhTiep, !khongQuyen(() => loTrinh.ghiLoTrinhTiep(p, sid, { huong: 'chua_ro' }))],
        );
        for (const [co, flag, duoc] of hanh) if (flag !== duoc) lech.push(`${ten}/${loai}/${co}: cờ ${flag} · hàm ${duoc}`);
      }
    }
    assert(lech.length === 0, lech.join('; '));
  });
}
