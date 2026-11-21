/**
 * PHÉP KIỂM VH-1b (N62, chủ SP 21/11 — giao việc tay vào hạng mục + Mô tả, máy chủ; `ke-hoach-pr.md` mục N62):
 *  · Head / CX tạo việc tay có hạng mục chính thống + lớp / HV liên quan; GV 403; hạng mục lạ / lớp / HV chi nhánh khác 400; web cũ (không hangMuc) như trước.
 *  · /my-work: việc tay có hạng mục nằm ĐÚNG mục / tab đó (`mucCuaViec`, `tabCuaViec`) kèm "{tên} giao"; việc con theo cha; không hạng mục → "Việc được giao".
 *  · Sửa hạng mục (Head / CX; người phụ trách 403) · chuyển chi nhánh bỏ lớp cũ · bản lặp chép hạng mục + lớp.
 *  · Mô tả việc N58: người phụ trách / người giao / Head / CX sửa, người theo dõi chỉ đọc, 409 so-và-đổi, ≤ 500, lịch sử, id dùng lại không thừa hưởng.
 *  · migrate prHangMuc hai lần + tự lành.
 */
import type { YThucTestKit } from './yThuc.tests.ts';
import { emailThu } from '../seed/emailThu.ts';

export async function runPrHangMucTests(t: YThucTestKit) {
  const { checkAsync, check, assert, conn, TODAY, P, classId, addDays } = t as any;
  console.log('\nVH-1b · việc tay vào hạng mục + Mô tả');

  const thu = async (fn: () => void | Promise<void>) => { conn.exec('BEGIN IMMEDIATE'); try { await fn(); } finally { conn.exec('ROLLBACK'); } };
  const accounts: any = await import('../platform/accounts.ts');
  const intake: any = await import('../classes/intake.ts');
  const { loadPrincipal } = await import('../permissions.ts');
  const { boLichTuTao } = await import('./luotThu.ts');
  const mg: any = await import('../worklist/mgmttasks.ts');
  const gv: any = await import('../worklist/giaoViec.ts');
  const viol: any = await import('../yThuc/violations.ts');
  const xu: any = await import('../yThuc/xuLy.ts');
  const d: any = await import('../../../shared/domain/index.ts');
  const { myWork } = await import('../worklist/mywork.ts');
  const { xoaNho } = await import('../platform/nguCanhRequest.ts');
  const hang = (sql: string, ...a: unknown[]) => conn.prepare(sql).all(...a) as any[];
  const mot = (sql: string, ...a: unknown[]) => conn.prepare(sql).get(...a) as any;
  const ma = async (fn: () => unknown) => { try { await fn(); return 200; } catch (e: any) { return e.status ?? 500; } };
  const MB = mot(`SELECT id FROM branches WHERE code = 'MB'`).id as number;
  const ql = P.mbManager; const gvcn = P.coreTeacher; const gvbm = P.w1Teacher;
  const lop = classId('MB FT 101');
  const lopCp = mot(`SELECT id FROM classes WHERE branch_id = (SELECT id FROM branches WHERE code = 'CP') ORDER BY id LIMIT 1`).id as number;
  let soTk = 0;
  const taiKhoan = (ten: string, role: string, cn = 'MB') => loadPrincipal(accounts.createAccount(P.admin, {
    email: `hangmuc.${ten}.${++soTk}${accounts.EMAIL_SUFFIX}`, password: `matkhau-hangmuc-${ten}`, fullName: `HANGMUC ${ten.toUpperCase()}`, roles: [{ role, branches: [cn] }],
  }).userId as number);
  const cx = taiKhoan('cx', 'cx'); const tvv = taiKhoan('tvv', 'consultant'); const tvv2 = taiKhoan('tvv2', 'consultant');
  const emLop = hang(`SELECT student_id AS id FROM enrollments WHERE class_id = ? AND status = 'active' ORDER BY student_id LIMIT 2`, lop).map((r) => r.id as number);
  const emCp = mot(`SELECT student_id AS id FROM enrollments WHERE class_id = ? AND status = 'active' LIMIT 1`, lopCp).id as number;
  const viecCua = (p: any, key: string) => { xoaNho(); return ((myWork(p) as any).items as any[]).find((x) => x.key === key); };
  const tao = (p: any, o: Record<string, unknown> = {}) => mg.createMgmtTask(p, { title: `Việc tay ${++soTk}`, branchId: MB, ...o });

  await checkAsync('VH1b-1 · Head / CX tạo việc tay có hạng mục + lớp / HV liên quan; GV 403; hạng mục lạ / lớp / HV chi nhánh khác 400; web cũ không gửi → như trước', () => thu(async () => {
    const v = tao(ql, { hangMuc: 'bao-ph', classId: lop, studentIds: emLop, assigneeUserId: gvcn.userId, note: 'Gọi phụ huynh hai em vắng nhiều' });
    assert(v.hangMuc === 'bao-ph' && v.classId === lop && v.hocVien.length === emLop.length && v.note === 'Gọi phụ huynh hai em vắng nhiều', `chi tiết: ${JSON.stringify([v.hangMuc, v.classId, v.hocVien])}`);
    assert(tao(cx, { hangMuc: 'sau-thi' }).hangMuc === 'sau-thi', 'CX tạo được');
    assert(await ma(() => tao(gvcn, { hangMuc: 'bao-ph' })) === 403, 'GV → 403');
    for (const hm of ['giao', 'khac', 'cham-cheo', 'abc']) assert(await ma(() => tao(ql, { hangMuc: hm })) === 400, `hạng mục ${hm} → 400`);
    assert(await ma(() => tao(ql, { classId: lopCp })) === 400, 'lớp chi nhánh khác → 400');
    assert(await ma(() => tao(ql, { studentIds: [emCp] })) === 400, 'HV chi nhánh khác → 400');
    assert(await ma(() => tao(ql, { classId: lop, studentIds: [emCp] })) === 400, 'HV không ở lớp → 400');
    const cu = tao(ql, {});
    assert(cu.hangMuc === null && cu.classId === null && cu.hocVien.length === 0, 'web cũ: không hạng mục');
    assert(!hang('SELECT 1 FROM sos_cases WHERE id IN (SELECT case_id FROM task_students WHERE task_id = ? AND case_id IS NOT NULL)', v.id).length, 'HV liên quan không sinh Case');
    assert(mg.listMgmtTasks(ql, {}).rows.find((r: any) => r.id === v.id).hangMuc === 'bao-ph', 'bảng trả hạng mục');
  }));

  await checkAsync('AUDIT-2111 A2-03 · A2-05: một hạng mục "Báo PH" (khoá cũ bao-ph-test ghi thành bao-ph) · việc giao TVV không hạng mục / hạng mục ngoài TVV → tab Vận hành', () => thu(async () => {
    assert(d.HANG_MUC_CV.filter(([, ten]: any) => ten === 'Báo PH').length === 1, 'ô Hạng mục chỉ một "Báo PH"');
    const v = tao(ql, { hangMuc: 'bao-ph-test', assigneeUserId: gvcn.userId });
    assert(mg.listMgmtTasks(ql, {}).rows.find((r: any) => r.id === v.id).hangMuc === 'bao-ph', 'web cũ gửi bao-ph-test → lưu bao-ph');
    for (const hangMuc of [null, 'mock']) assert(d.tabCuaViec({ group: 'mgmt', key: 'mgmt:1', hangMuc }, true) === 'van-hanh', `TVV: ${hangMuc} → tab Vận hành`);
    assert(d.NHOM_CV_TVV.includes('van-hanh') && d.tabCuaViec({ group: 'bo_sung_ho_so', key: 'x' }, true) === 'bo-sung', 'Bổ sung hồ sơ giữ chỗ cũ');
    /* A2-10: một trần Mô tả việc 500; chữ cũ dài (trần cũ 2000) gửi lại nguyên vẫn lưu. */
    assert(await ma(() => tao(ql, { note: 'x'.repeat(501) })) === 400, 'mô tả > 500 → 400');
    const dai = tao(ql, {});
    conn.prepare('UPDATE tasks SET note = ? WHERE id = ?').run('y'.repeat(1500), dai.id);
    assert(await ma(() => mg.editMgmtTask(ql, dai.id, { note: 'y'.repeat(1500), title: 'Đổi tên' })) === 200, 'mô tả cũ dài gửi lại nguyên → lưu được');
    assert(await ma(() => mg.editMgmtTask(ql, dai.id, { note: 'z'.repeat(600) })) === 400, 'sửa thành > 500 → 400');
    /* B2-06: việc tay có HV liên quan — dòng Công việc có tên em; thanh việc hồ sơ HV của em đó có việc cho người phụ trách (cùng câu UNION). */
    const { viecCuaHocVien } = await import('../students/viecHocVien.ts');
    const cases: any = await import('../cases/cases.ts');
    const coHv = tao(ql, { assigneeUserId: gvcn.userId, studentIds: [emLop[0]], due: addDays(TODAY, 3) });
    const tenEm = mot('SELECT full_name FROM students WHERE id = ?', emLop[0]).full_name;
    const dong = viecCua(gvcn, `mgmt:${coHv.id}`);
    assert(dong && dong.hocVienLienQuan === tenEm && dong.studentId === null, `dòng Công việc: ${JSON.stringify(dong && [dong.hocVienLienQuan, dong.studentId])}`);
    const hs = (sid: number) => { xoaNho(); return viecCuaHocVien(gvcn, sid, cases.skillSupportBoard(gvcn, sid), { trangThaiEm: 'active', lopId: lop, chuongTrinh: null, yThuc: null, miniTest: null, dai: null } as any); };
    const vEm = hs(emLop[0]).cuaBan.find((x: any) => x.key === `mgmt:${coHv.id}`);
    assert(vEm && vEm.loai === 'van-hanh' && (vEm.mo as any)?.loai === 'duong', `hồ sơ HV em liên quan: ${JSON.stringify(vEm)}`);
    assert(!hs(emLop[1]).cuaBan.some((x: any) => x.key === `mgmt:${coHv.id}`), 'em không liên quan: không có việc');
  }));

  await checkAsync('VH1b-2 · /my-work: việc tay có hạng mục vào ĐÚNG mục / tab (kèm "{tên} giao"), việc con theo cha; không hạng mục → Việc được giao', () => thu(async () => {
    const v = tao(ql, { hangMuc: 'bao-ph', classId: lop, assigneeUserId: gvcn.userId, due: addDays(TODAY, 2) });
    const con = tao(ql, { parentTaskId: v.id, title: 'Con hạng mục', assigneeUserId: gvbm.userId });
    const k = tao(ql, { assigneeUserId: gvcn.userId });
    const a = viecCua(gvcn, `mgmt:${v.id}`);
    assert(a && a.hangMuc === 'bao-ph' && a.giaoBoi && a.classId === lop, `dòng: ${JSON.stringify(a)}`);
    assert(d.mucCuaViec(a) === 'bao-ph-test' && d.tabCuaViec(a) === 'y-thuc', `mục / tab: ${d.mucCuaViec(a)} · ${d.tabCuaViec(a)}`);
    assert(d.mucCuaViec(a, true) === 'bao-ph' && d.tabCuaViec(a, true) === 'bao-ph', 'góc TVV: mục / tab Báo PH');
    const muc = d.chiaMucTab([a], false).map((m: any) => m.key);
    assert(JSON.stringify(muc) === '["bao-ph-test"]', `mục tự hiện: ${muc}`);
    const c = viecCua(gvbm, `mgmt:${con.id}`);
    assert(c && c.hangMuc === 'bao-ph', 'việc con theo hạng mục cha');
    const b = viecCua(gvcn, `mgmt:${k.id}`);
    assert(b && !b.hangMuc && d.mucCuaViec(b) === 'giao' && d.tabCuaViec(b) === 'van-hanh', 'không hạng mục → Việc được giao');
    for (const [hm, tab] of [['mock', 'cham-diem'], ['mo-ta', 'case-hoc-thuat'], ['sau-thi', 'van-hanh']] as const) {
      const x = viecCua(gvcn, `mgmt:${tao(ql, { hangMuc: hm, assigneeUserId: gvcn.userId }).id}`);
      assert(d.mucCuaViec(x) === hm && d.tabCuaViec(x) === d.nhomViecCua(hm === 'mock' ? 'score' : hm === 'mo-ta' ? 'cause' : 'thi_that') && d.tabCuaViec(x) === tab, `${hm}: ${d.tabCuaViec(x)}`);
    }
    assert(d.demDongViec((myWork(gvcn) as any).items).n >= 5, 'số đếm gồm việc tay');
  }));

  await checkAsync('VH1b-3 · sửa hạng mục (Head / CX), người phụ trách 403; chuyển chi nhánh bỏ lớp cũ; bản lặp chép hạng mục + lớp', () => thu(async () => {
    const v = tao(ql, { hangMuc: 'bao-ph', classId: lop, studentIds: [emLop[0]], assigneeUserId: gvcn.userId });
    assert(mg.editMgmtTask(cx, v.id, { hangMuc: 'tinh-hinh' }).hangMuc === 'tinh-hinh', 'CX đổi hạng mục');
    assert(mot(`SELECT COUNT(*) n FROM task_history WHERE task_id = ? AND field = 'hang_muc'`, v.id).n === 1, 'lịch sử hạng mục');
    assert(await ma(() => mg.editMgmtTask(gvcn, v.id, { hangMuc: null })) === 403, 'người phụ trách đổi hạng mục → 403');
    assert(mg.editMgmtTask(ql, v.id, { studentIds: emLop }).hocVien.length === emLop.length && mg.mgmtTaskDetail(ql, v.id).classId === lop, 'thay HV, giữ lớp');
    assert(mg.editMgmtTask(ql, v.id, { hangMuc: null }).hangMuc === null, 'bỏ hạng mục → Vận hành');
    const cp = mot(`SELECT id FROM branches WHERE code = 'CP'`).id;
    const dd = mg.editMgmtTask(P.admin, v.id, { branchId: cp });
    assert(dd.classId === null, 'chuyển chi nhánh: lớp cũ bỏ');
    const g = tao(ql, { hangMuc: 'sau-thi', classId: lop, lap: { kieu: 'tuan', ngay: [1, 2, 3, 4, 5, 6, 7] } });
    mg.taoViecLap(addDays(TODAY, 1));
    const b = mot('SELECT hang_muc, class_id FROM tasks WHERE lap_goc_id = ?', g.id);
    assert(b.hang_muc === 'sau-thi' && b.class_id === lop, 'bản lặp chép hạng mục + lớp');
  }));

  /* Việc N58 thật (Báo PH vi phạm) để kiểm Mô tả. */
  let dem = 0;
  const moiEm = (): number => {
    const ten = `HANGMUC em ${++dem}-${Math.random().toString(36).slice(2, 6)}`;
    intake.commitIntake(P.admin, { classId: lop, rows: [{ fullName: ten, target: 7, email: emailThu(), dob: '2010-01-01' }], idempotencyKey: `hangmuc-${ten}` } as any);
    const st = mot('SELECT id FROM students WHERE full_name = ?', ten);
    boLichTuTao(conn, mot("SELECT id FROM learning_cycles WHERE student_id = ? AND status = 'active'", st.id).id);
    conn.prepare('UPDATE students SET consultant_user_id = ? WHERE id = ?').run(tvv.userId, st.id);
    return st.id as number;
  };
  const baoPh = (sid: number): number => {
    const vid = viol.recordViolation(gvbm, { studentId: sid, category: 'conduct', ten: 'Nói chuyện riêng trong giờ', occurredOn: addDays(TODAY, -1) }).violation.id;
    const m = xu.xacNhanXuLy(gvcn, sid, { violationIds: [vid], performedOn: TODAY, performerName: null, note: 'Nhắc nhở em sau giờ học, em hứa sửa' });
    return mot('SELECT id FROM viec_bao_ph WHERE measure_id = ?', m.id).id as number;
  };

  await checkAsync('VH1b-4 · Mô tả việc N58: người phụ trách / người giao / Head / CX sửa; người theo dõi chỉ đọc; 409; ≤ 500; lịch sử; id dùng lại không thừa hưởng', () => thu(async () => {
    const id = baoPh(moiEm());
    let k = gv.xemGiaoViec(tvv, 'bao_ph', id);
    assert(k.moTa === null && k.coTheSuaMoTa === true, 'chưa có mô tả, TVV (người phụ trách) sửa được');
    k = gv.suaMoTa(tvv, 'bao_ph', id, { moTa: 'Mẹ em đi công tác, gọi bố', moTaCu: null });
    assert(k.moTa?.noiDung === 'Mẹ em đi công tác, gọi bố' && k.lichSu.some((l: any) => l.truong === 'mo_ta'), 'lưu + lịch sử');
    assert(await ma(() => gv.suaMoTa(ql, 'bao_ph', id, { moTa: 'Khác', moTaCu: null })) === 409, 'moTaCu lệch → 409');
    assert(gv.suaMoTa(ql, 'bao_ph', id, { moTa: 'Head sửa', moTaCu: 'Mẹ em đi công tác, gọi bố' }).moTa.noiDung === 'Head sửa', 'Head sửa');
    assert(gv.suaMoTa(cx, 'bao_ph', id, { moTa: 'CX sửa', moTaCu: 'Head sửa' }).moTa.noiDung === 'CX sửa', 'CX sửa');
    gv.themTheoDoi(ql, 'bao_ph', id, { userIds: [tvv2.userId] });
    assert(gv.xemGiaoViec(tvv2, 'bao_ph', id).moTa.noiDung === 'CX sửa' && gv.xemGiaoViec(tvv2, 'bao_ph', id).coTheSuaMoTa === false, 'người theo dõi đọc, không sửa');
    assert(await ma(() => gv.suaMoTa(tvv2, 'bao_ph', id, { moTa: 'x', moTaCu: 'CX sửa' })) === 403, 'người theo dõi sửa → 403');
    assert(await ma(() => gv.suaMoTa(tvv, 'bao_ph', id, { moTa: 'a'.repeat(501), moTaCu: 'CX sửa' })) === 400, '> 500 ký tự → 400');
    assert(await ma(() => gv.suaMoTa(tvv, 'bao_ph', id, { moTa: 'không moTaCu' })) === 400, 'thiếu moTaCu → 400');
    assert(gv.suaMoTa(tvv, 'bao_ph', id, { moTa: '', moTaCu: 'CX sửa' }).moTa === null, 'rỗng = bỏ');
    gv.suaMoTa(tvv, 'bao_ph', id, { moTa: 'Còn lại', moTaCu: null });
    gv.donViec('bao_ph', [id]);
    assert(!mot('SELECT 1 FROM viec_mo_ta WHERE loai = ? AND ref_id = ?', 'bao_ph', id), 'donViec dọn mô tả (id dùng lại không thừa hưởng)');
  }));

  // ---------------------------------------------------------------- rà sâu PTA #1936
  const xoaHV: any = await import('../students/xoaHocVien.ts');
  const ph: any = await import('../yThuc/phoiHop.ts');
  const th: any = await import('../yThuc/tinhHinh.ts');
  const tl: any = await import('../yThuc/traLai.ts');
  const bp: any = await import('../yThuc/baoPhTvv.ts');
  const { LUOT_SAU_THI_SQL } = await import('../students/tamDung.ts');
  const ghiMoTa = (p: any, loai: string, id: number, moTa: string) => gv.suaMoTa(p, loai, id, { moTa, moTaCu: gv.xemGiaoViec(P.admin, loai, id).moTa?.noiDung ?? null });

  await checkAsync('VH1b-6 (PTA 1) · xoá hẳn học viên (đường thật) → mô tả việc của em bị dọn; id dùng lại không thừa hưởng', () => thu(async () => {
    const sid = moiEm(); const id = baoPh(sid);
    ghiMoTa(tvv, 'bao_ph', id, 'Mô tả của em sắp xoá');
    xoaHV.xoaHocVien(P.admin, sid, { maXacNhan: mot('SELECT student_code FROM students WHERE id = ?', sid).student_code });
    assert(!mot('SELECT 1 FROM viec_mo_ta WHERE loai = ? AND ref_id = ?', 'bao_ph', id), 'mô tả dọn cùng xoá học viên');
    const moi = baoPh(moiEm());
    assert(moi !== id || gv.xemGiaoViec(P.admin, 'bao_ph', moi).moTa === null, 'việc mới (id dùng lại) không có mô tả cũ');
  }));

  await checkAsync('VH1b-7 (PTA 2, 5, 6) · lớp / HV ngoài phạm vi xem 400 kể cả việc Toàn hệ thống; đổi chi nhánh / lớp bỏ HV không hợp lệ; PATCH teacher_task 400', () => thu(async () => {
    const toan = tao(ql, {});
    mg.editMgmtTask(ql, toan.id, { branchId: null });
    assert(mot('SELECT branch_id FROM tasks WHERE id = ?', toan.id).branch_id === null, 'Head đưa việc về Toàn hệ thống');
    assert(await ma(() => mg.editMgmtTask(ql, toan.id, { classId: lopCp })) === 400, 'lớp CP (ngoài phạm vi xem) → 400');
    assert(await ma(() => mg.editMgmtTask(ql, toan.id, { studentIds: [emCp] })) === 400, 'HV CP → 400');
    assert(!mg.mgmtTaskDetail(ql, toan.id).hocVien.length && mg.mgmtTaskDetail(ql, toan.id).classCode === null, 'không lộ tên lớp / em chi nhánh khác');
    /* Đổi chi nhánh có HV → HV chi nhánh cũ bỏ. */
    const v = tao(ql, { classId: lop, studentIds: emLop });
    const cp = mot(`SELECT id FROM branches WHERE code = 'CP'`).id;
    const d1 = mg.editMgmtTask(P.admin, v.id, { branchId: cp });
    assert(d1.classId === null && d1.hocVien.length === 0, `đổi chi nhánh: lớp + HV cũ bỏ (${JSON.stringify(d1.hocVien)})`);
    assert(mg.editMgmtTask(P.admin, v.id, { branchId: MB, studentIds: [] }).branchId === MB, 'đổi chi nhánh + studentIds, không classId → không 400');
    /* Đổi lớp không gửi HV → bỏ em không học lớp mới. */
    const lop2 = mot(`SELECT id FROM classes WHERE branch_id = ? AND id != ? AND status = 'active' ORDER BY id LIMIT 1`, MB, lop).id;
    const w = tao(ql, { classId: lop, studentIds: emLop });
    assert(mg.editMgmtTask(ql, w.id, { classId: lop2 }).hocVien.length === 0, 'đổi lớp → HV không thuộc lớp mới bỏ');
    /* teacher_task: không nhận hạng mục / lớp / HV. */
    const tt = Number(conn.prepare(`INSERT INTO tasks (code, title, kind, branch_id, class_id, progress, created_by, created_at) VALUES (?, 'Giao GV VH1b-7', 'teacher_task', ?, ?, 'not_started', ?, ?)`)
      .run(mg.nextCode(conn), MB, lop, ql.userId, new Date().toISOString()).lastInsertRowid);
    for (const body of [{ classId: lop2 }, { studentIds: [emLop[0]] }, { hangMuc: 'bao-ph' }]) assert(await ma(() => mg.editMgmtTask(ql, tt, body)) === 400, `teacher_task ${JSON.stringify(body)} → 400`);
    assert(mot('SELECT class_id FROM tasks WHERE id = ?', tt).class_id === lop, 'lớp của teacher_task giữ');
  }));

  await checkAsync('VH1b-8 (PTA 3, 4, 8) · hai việc tay cùng lớp không gộp; Head nhận việc có hạng mục (không hạng mục: chỉ bảng); đếm nhóm một nguồn; TVV phoi-hop / tinh-hinh ở tab Báo PH', () => thu(async () => {
    const a = tao(ql, { hangMuc: 'bao-ph', classId: lop, assigneeUserId: gvcn.userId });
    const b = tao(ql, { hangMuc: 'tinh-hinh', classId: lop, assigneeUserId: gvcn.userId });
    xoaNho();
    const ds = ((myWork(gvcn) as any).items as any[]).filter((x) => x.key === `mgmt:${a.id}` || x.key === `mgmt:${b.id}`);
    const dong = d.gopViecTheoLop(ds, (g: string) => g);
    assert(dong.length === 2 && dong.every((x: any) => !x.key.startsWith('gop:')), `không gộp: ${JSON.stringify(dong.map((x: any) => x.key))}`);
    /* Head: có hạng mục → có dòng; không hạng mục → không. */
    const qlCo = tao(cx, { hangMuc: 'sau-thi', assigneeUserId: ql.userId });
    const qlKhong = tao(cx, { assigneeUserId: ql.userId });
    xoaNho();
    const cuaQl = (myWork(ql) as any).items as any[];
    assert(cuaQl.some((x) => x.key === `mgmt:${qlCo.id}`) && !cuaQl.some((x) => x.key === `mgmt:${qlKhong.id}`), 'Head: chỉ việc có hạng mục');
    /* Đếm nhóm (hồ sơ GV) = tab. */
    const x = ds.find((i) => i.key === `mgmt:${a.id}`);
    assert(d.demViecTheoNhom([x]).find((g: any) => g.n === 1)?.nhom === d.tabCuaViec(x), 'hồ sơ GV đếm cùng nhóm với tab');
    assert(d.gomNhomViec([x])[0].key === 'y-thuc', 'gomNhomViec theo hạng mục');
    for (const hm of ['phoi-hop', 'tinh-hinh']) assert(d.tabCuaViec({ group: 'mgmt', key: 'mgmt:1', hangMuc: hm }, true) === 'bao-ph', `TVV ${hm} → Báo PH`);
  }));

  await checkAsync('VH1b-9 (PTA 7, 9) · người giao sửa mô tả, mất vai thì 403; việc đã đóng 400; thiếu moTa 400; mô tả "12" không thành tên người; phoi_hop / tinh_hinh / meeting / tra_lai', () => thu(async () => {
    const sid = moiEm(); const id = baoPh(sid);
    gv.doiPhuTrach(tvv, 'bao_ph', id, { userId: tvv2.userId, phuTrachCu: null });
    assert(ghiMoTa(tvv, 'bao_ph', id, '12').moTa.noiDung === '12', 'người giao (không còn là người phụ trách) sửa được');
    const ls = gv.xemGiaoViec(P.admin, 'bao_ph', id).lichSu.filter((l: any) => l.truong === 'mo_ta');
    assert(ls.length === 1 && ls[0].moiTen === null, `mô tả "12" không thành tên người: ${JSON.stringify(ls)}`);
    assert(await ma(() => gv.suaMoTa(tvv, 'bao_ph', id, { moTaCu: '12' })) === 400, 'thiếu moTa → 400');
    accounts.setRoles(P.admin, tvv.userId, [{ role: 'consultant', branches: ['CP'] }]);
    assert(await ma(() => gv.suaMoTa(loadPrincipal(tvv.userId), 'bao_ph', id, { moTa: 'x', moTaCu: '12' })) === 403, 'người giao mất vai → 403');
    accounts.setRoles(P.admin, tvv.userId, [{ role: 'consultant', branches: ['MB'] }]);
    /* Việc đã đóng. */
    const sid2 = moiEm(); const id2 = baoPh(sid2);
    bp.ghiKetQuaBaoPh(tvv, { viecIds: [id2], ketQua: 'da_bao', ghiChu: 'Đã gọi phụ huynh, mẹ em nghe máy' });
    assert(await ma(() => gv.suaMoTa(tvv, 'bao_ph', id2, { moTa: 'x', moTaCu: null })) === 400, 'việc đã đóng → 400');
    /* phoi_hop (GVCN theo luật). */
    const att = mot(`SELECT a.id FROM assessment_attempts a WHERE a.status != 'cancelled' AND COALESCE(a.kind, 'mock') = 'mock' AND a.student_id IS NOT NULL
        AND NOT EXISTS (SELECT 1 FROM sos_coordination_actions x WHERE x.attempt_id = a.id AND x.kind = 'talk_family') AND NOT ${LUOT_SAU_THI_SQL('a')} LIMIT 1`).id;
    const phId = Number(conn.prepare(`INSERT INTO sos_coordination_actions (attempt_id, student_id, kind, preset, status, created_at) VALUES (?, ?, 'talk_family', 1, 'pending', ?)`)
      .run(att, sid2, new Date().toISOString()).lastInsertRowid);
    assert(ghiMoTa(ql, 'phoi_hop', phId, 'Phối hợp: hẹn thứ Sáu').moTa.noiDung === 'Phối hợp: hẹn thứ Sáu', 'phoi_hop');
    /* tinh_hinh (TVV gửi → GVCN trả lời). */
    const thId = th.guiTinhHinh(tvv, { chieu: 'tvv_gvcn', studentIds: [sid2], noiDung: 'Em dạo này học thế nào ạ?' }).ids[0];
    assert(ghiMoTa(gvcn, 'tinh_hinh', thId, 'Hỏi thêm về bài tập').moTa.noiDung === 'Hỏi thêm về bài tập', 'tinh_hinh: GVCN (người phụ trách) sửa');
    /* meeting (phần Kết quả). */
    const att2 = mot(`SELECT a.id FROM assessment_attempts a WHERE a.status != 'cancelled' AND NOT EXISTS (SELECT 1 FROM sos_coordination_actions x WHERE x.attempt_id = a.id AND x.kind = 'cx_meeting_student')
        AND NOT ${LUOT_SAU_THI_SQL('a')} LIMIT 1`).id;
    const aid = Number(conn.prepare(`INSERT INTO sos_coordination_actions (attempt_id, student_id, kind, preset, status, created_at) VALUES (?, ?, 'cx_meeting_student', 1, 'pending', ?)`)
      .run(att2, sid2, new Date().toISOString()).lastInsertRowid);
    ph.confirmCoordination(gvcn, aid, { performedOn: TODAY, note: 'Cần họp CX với em' });
    const kq = mot(`SELECT id FROM meeting_phan WHERE phoi_hop_id = ? AND phan = 'ket_qua'`, aid).id;
    assert(ghiMoTa(cx, 'meeting', kq, 'Họp cùng phụ huynh').moTa.noiDung === 'Họp cùng phụ huynh', 'meeting: CX sửa');
    /* tra_lai (TVV trả lại một vi phạm). */
    const sid3 = moiEm();
    const vid = viol.recordViolation(gvbm, { studentId: sid3, category: 'conduct', ten: 'Đi học muộn nhiều lần', occurredOn: addDays(TODAY, -1) }).violation.id;
    xu.xacNhanXuLy(gvcn, sid3, { violationIds: [vid], performedOn: TODAY, performerName: null, note: 'Nhắc nhở em sau giờ học, em hứa sửa' });
    const r = tl.traLai(tvv, { violationId: vid, lyDo: 'Ngày vi phạm chưa đúng, nhờ GV xem lại' });
    assert(ghiMoTa(ql, 'tra_lai', r.id, 'Phụ huynh báo em ốm hôm đó').moTa.noiDung === 'Phụ huynh báo em ốm hôm đó', 'tra_lai: Head sửa');
  }));

  check('VH1b-10 · so DÒNG /my-work của người không có việc tay: GVBM giữ nguyên tập khoá khi người khác nhận việc tay', () => {
    xoaNho();
    const truoc = JSON.stringify(((myWork(gvbm) as any).items as any[]).map((x) => x.key).sort());
    conn.exec('BEGIN IMMEDIATE');
    try {
      tao(ql, { hangMuc: 'bao-ph', classId: lop, assigneeUserId: gvcn.userId });
      xoaNho();
      const sau = JSON.stringify(((myWork(gvbm) as any).items as any[]).map((x) => x.key).sort());
      assert(truoc === sau, 'dòng của người không có việc tay không đổi');
    } finally { conn.exec('ROLLBACK'); }
  });

  await checkAsync('VH1b-11 (PTA 9) · việc con trả hạng mục / lớp của cha; bản lặp chép HV còn hợp lệ; việc tay không làm lớp "có dữ liệu", xoá lớp gỡ liên kết', () => thu(async () => {
    const cha = tao(ql, { hangMuc: 'sau-thi', classId: lop, studentIds: [emLop[0]], lap: { kieu: 'tuan', ngay: [1, 2, 3, 4, 5, 6, 7] } });
    const con = tao(ql, { parentTaskId: cha.id, title: 'Con VH1b-11' });
    const dc = mg.mgmtTaskDetail(ql, con.id);
    assert(dc.hangMuc === 'sau-thi' && dc.classId === lop, 'chi tiết việc con theo cha (cùng luật /my-work)');
    mg.taoViecLap(addDays(TODAY, 1));
    const ban = mot('SELECT id FROM tasks WHERE lap_goc_id = ? AND parent_task_id IS NULL', cha.id).id;
    assert(hang('SELECT student_id FROM task_students WHERE task_id = ?', ban).map((r) => r.student_id).join() === String(emLop[0]), 'bản lặp chép HV liên quan');
    const xkt: any = await import('../classes/xoaKetThucLop.ts');
    const lopTrong = Number(conn.prepare(`INSERT INTO classes (code, branch_id, kind, programme_code, status, created_at) SELECT 'VH1B-TRONG', ?, kind, programme_code, 'active', ? FROM classes WHERE id = ?`)
      .run(MB, new Date().toISOString(), lop).lastInsertRowid);
    const v = tao(ql, { classId: lopTrong });
    assert(!xkt.tinhTrangLop(lopTrong).coDuLieu, 'việc tay gắn lớp không làm lớp có dữ liệu');
    xkt.xoaLop(P.admin, lopTrong);
    assert(mot('SELECT class_id FROM tasks WHERE id = ?', v.id).class_id === null, 'xoá lớp → gỡ liên kết việc tay');
  }));

  await checkAsync('VH1b-12 (PTA rà lần 2) · đổi chi nhánh teacher_task giữ lớp + em; việc con theo cha bỏ lớp / HV chi nhánh cũ; gửi lại HV đang có không kiểm lại', () => thu(async () => {
    const cp = mot(`SELECT id FROM branches WHERE code = 'CP'`).id;
    /* (1) teacher_task: đổi chi nhánh chỉ đổi branch_id. */
    const tt = Number(conn.prepare(`INSERT INTO tasks (code, title, kind, branch_id, class_id, progress, created_by, created_at) VALUES (?, 'Giao GV VH1b-12', 'teacher_task', ?, ?, 'not_started', ?, ?)`)
      .run(mg.nextCode(conn), MB, lop, ql.userId, new Date().toISOString()).lastInsertRowid);
    conn.prepare('INSERT INTO task_students (task_id, student_id, created_at) VALUES (?,?,?)').run(tt, emLop[0], new Date().toISOString());
    mg.editMgmtTask(P.admin, tt, { branchId: cp });
    assert(mot('SELECT class_id FROM tasks WHERE id = ?', tt).class_id === lop && hang('SELECT 1 FROM task_students WHERE task_id = ?', tt).length === 1, 'teacher_task giữ lớp + em');
    /* (2) việc con có lớp / HV riêng → cha đổi chi nhánh → bỏ. */
    const cha = tao(ql, {});
    const con = tao(ql, { parentTaskId: cha.id, title: 'Con VH1b-12', classId: lop, studentIds: [emLop[0]] });
    mg.editMgmtTask(P.admin, cha.id, { branchId: cp });
    const c = mot('SELECT branch_id, class_id FROM tasks WHERE id = ?', con.id);
    assert(c.branch_id === cp && c.class_id === null && !hang('SELECT 1 FROM task_students WHERE task_id = ?', con.id).length, `việc con: ${JSON.stringify(c)}`);
    /* (3) HV đang có đã chuyển lớp — gửi lại danh sách cũ (vd chỉ sửa hạn) không 400; thêm em mới sai vẫn 400. */
    const v = tao(ql, { classId: lop, studentIds: [emLop[0]] });
    conn.prepare(`UPDATE enrollments SET status = 'ended' WHERE student_id = ? AND class_id = ?`).run(emLop[0], lop);
    assert(mg.editMgmtTask(ql, v.id, { due: addDays(TODAY, 3), classId: lop, studentIds: [emLop[0]] }).hocVien.length === 1, 'gửi lại em đang có → giữ, không 400');
    assert(await ma(() => mg.editMgmtTask(ql, v.id, { classId: lop, studentIds: [emLop[0], emCp] })) === 400, 'thêm em mới sai → 400');
  }));

  const fs = await import('node:fs');
  const path = await import('node:path');
  const { fileURLToPath } = await import('node:url');
  const { default: SqliteDb } = await import('libsql');
  const { migratePrHangMuc } = await import('../migrate/prHangMuc.ts');
  check('VH1b-5 · migrate prHangMuc: chạy hai lần không đổi; tự lành; khớp schema.sql; DB seed không đổi', () => {
    const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..');
    const SCHEMA = fs.readFileSync(path.join(REPO, 'server/src/schema.sql'), 'utf8').replace(/\r\n/g, '\n');
    const cat = SCHEMA.replace(/  lap_tu TEXT,\n  \/\* VH-1b[\s\S]*?hang_muc TEXT\n\);/, '  lap_tu TEXT\n);')
      .replace(/-- VH-1b \(N62\): MÔ TẢ[\s\S]*?PRIMARY KEY \(loai, ref_id\)\n\);\n/, '');
    if (/hang_muc|viec_mo_ta/.test(cat)) throw new Error('schema.sql đổi khuôn — sửa bộ cắt của phép kiểm VH1b-5');
    const cu = new SqliteDb(':memory:'); cu.exec(cat);
    const a: string[] = []; migratePrHangMuc(cu, a);
    const b: string[] = []; migratePrHangMuc(cu, b);
    assert(a.length === 2 && b.length === 0, `${a.join(' | ')} ‖ ${b.join(' | ')}`);
    cu.exec('DROP TABLE viec_mo_ta');
    const c2: string[] = []; migratePrHangMuc(cu, c2);
    assert(c2.length === 1 && /viec_mo_ta/.test(c2[0]), `tự lành: ${c2.join(' | ')}`);
    const moi = new SqliteDb(':memory:'); moi.exec(SCHEMA);
    const cot = (db: any, bang: string) => JSON.stringify((db.prepare(`PRAGMA table_info(${bang})`).all() as any[]).map((x) => `${x.name}:${x.type}:${x.notnull}:${x.pk}`));
    for (const bang of ['tasks', 'viec_mo_ta']) assert(cot(cu, bang) === cot(moi, bang), `${bang}: ${cot(cu, bang)} ≠ ${cot(moi, bang)}`);
    const c: string[] = []; migratePrHangMuc(conn, c);
    assert(!c.length, `DB seed bị đổi: ${c.join(' | ')}`);
  });
}
