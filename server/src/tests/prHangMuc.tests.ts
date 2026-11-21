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
