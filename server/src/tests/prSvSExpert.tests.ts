/**
 * PHÉP KIỂM SV-S-EXPERT — lượt Speaking với chuyên gia (S Ex; 08-ke-hoach-trien-khai mục 5, 10 mục 2, XM-1 còn mở):
 *   (1) QL thêm → bảng riêng, hiện ở Lịch Test tuần + Kế hoạch Test (FT, lớp thường) đánh dấu `loai: 's-ex'`, không thêm lượt / điểm MT;
 *   (2) quyền THÊM: chỉ QL / Admin / QT (`plan.week`, máy chủ kiểm) — GV, TVV, QL chi nhánh khác → 403;
 *   (3) chấm: GV Speaking cùng chi nhánh (phân công hoặc hồ sơ `user_skills`) như S MT, QL nhập hộ; GV khác / chi nhánh khác 403; band 0..9 bậc 0.5;
 *   (4) KHÔNG vào Overall / SOS / Case / KPI / nợ chấm / đếm việc: các bảng điểm, việc, Case, chuông + Lịch Test, Công việc, nợ điểm không đổi;
 *   (5) sửa / xoá có lịch sử (`/lich-su?loai=s-ex`), lưu y nguyên không ghi; (6) xoá HV xoá lượt; migrate chạy lặp được. Mỗi ca cuộn lại.
 */
export async function runPrSvSExpertTests(t: any) {
  const { check, assert, conn, P, classId } = t;
  const sex: any = await import('../cham/sExpert.ts');
  const kh: any = await import('../keHoach/keHoachTest.ts');
  const cham: any = await import('../cham/canCham.ts');
  const mywork: any = await import('../worklist/mywork.ts');
  const { scoreDebtCells } = await import('../worklist/scoreDebt.ts');
  const xoaHV: any = await import('../students/xoaHocVien.ts');
  const accounts: any = await import('../platform/accounts.ts');
  const { lichSu } = await import('../platform/lichSu.ts');
  const { loadPrincipal } = await import('../permissions.ts');
  const { migratePrSvSExpert } = await import('../migrate/prSvSExpert.ts');
  const { demoToday } = await import('../demoConfig.ts');
  const { mondayOf, ensurePeriod } = await import('../platform/week.ts');
  const { addDays } = await import('../util.ts');
  const { xoaNho } = await import('../platform/nguCanhRequest.ts');
  console.log('\nSV-S-EXPERT · lượt S Expert: thêm (QL / Admin) · chấm (GV S) · không vào tính toán · lịch sử · xoá HV · migrate');

  const get = (sql: string, ...a: unknown[]) => conn.prepare(sql).get(...a) as any;
  const maLoi = (fn: () => unknown): number | string => { try { fn(); return 'không ném'; } catch (e: any) { return e?.status ?? String(e?.message ?? e); } };
  const thu = <T>(fn: () => T): T => {
    conn.exec('BEGIN IMMEDIATE');
    try { xoaNho(); return fn(); } finally { conn.exec('ROLLBACK'); xoaNho(); }
  };
  const LOP = classId('MB FT 101');
  const LOP_THUONG = classId('MB FOU 12');
  const today = demoToday();
  const tuan = mondayOf(today);
  const em = (lop = LOP) => get(`SELECT student_id FROM enrollments WHERE class_id = ? AND status = 'active' ORDER BY student_id LIMIT 1`, lop).student_id as number;
  const dem = () => ['assessment_attempts', 'attempt_skills', 'assessment_scores', 'tasks', 'notifications', 'sos_cases', 'audit_logs WHERE action NOT LIKE \'s_expert.%\'']
    .map((b) => get(`SELECT COUNT(*) AS n FROM ${b}`).n).join();
  let seq = 0;
  const taoNguoi = (role: string, branches: string[], kyNang: string[] = []) => {
    seq += 1;
    const id = accounts.createAccount(P.admin, { email: `svsex.${seq}${accounts.EMAIL_SUFFIX}`, password: 'matkhau-svsex', fullName: `Thử SVSEX ${seq}`, roles: [{ role, branches }] }).userId as number;
    for (const k of kyNang) conn.prepare('INSERT INTO user_skills (user_id, skill) VALUES (?,?)').run(id, k);
    return loadPrincipal(id);
  };
  const ds = (p: any, w = tuan) => cham.lichTest(p, ensurePeriod(w).id, null, today).sEx as any[];

  check('SSEX-1 · QL thêm lượt → bảng riêng, hiện ở Lịch Test tuần + Kế hoạch Test (FT, lớp thường) với loai s-ex; không thêm lượt / điểm MT', () => thu(() => {
    const sid = em();
    const truoc = dem();
    const r = sex.themSEx(P.mbManager, { studentId: sid, ngay: addDays(tuan, 2) });
    assert(r.id, `trả về ${JSON.stringify(r)}`);
    assert(dem() === truoc, `lượt / điểm MT / việc đổi: ${truoc} → ${dem()}`);
    const d = ds(P.mbManager).find((x: any) => x.id === r.id);
    assert(d && d.loai === 's-ex' && d.studentId === sid && d.tuan === tuan && d.ngay === addDays(tuan, 2) && /^W\d [A-Z]{3}$/.test(d.tuanMa)
      && d.classCode === 'MB FT 101' && d.diem === null && d.themBoi === P.mbManager.fullName && d.sua && d.cham, `Lịch Test ${JSON.stringify(d)}`);
    assert(!ds(P.mbManager, addDays(tuan, 7)).some((x: any) => x.id === r.id), 'tuần khác không có');
    const h = kh.luoiFT(P.mbManager, LOP).hang.find((x: any) => x.studentId === sid);
    assert(h.sEx.length === 1 && h.sEx[0].id === r.id && h.sEx[0].loai === 's-ex', `Kế hoạch Test FT ${JSON.stringify(h.sEx)}`);
    const sidT = em(LOP_THUONG);
    const r2 = sex.themSEx(P.mbManager, { studentId: sidT, tuan });
    const hT = kh.luoiThuong(P.mbManager, LOP_THUONG).hang.find((x: any) => x.studentId === sidT);
    assert(hT.sEx.length === 1 && hT.sEx[0].id === r2.id && hT.sEx[0].ngay === null, `Kế hoạch Test lớp thường ${JSON.stringify(hT.sEx)}`);
    assert(get(`SELECT action FROM audit_logs WHERE entity_type = 'student' AND entity_id = ? ORDER BY id DESC LIMIT 1`, sid).action === 's_expert.them', 'nhật ký them');
  }));

  check('SSEX-2 · quyền THÊM: Admin, QT được; GV S, GVCN, TVV, QL chi nhánh khác → 403; dữ liệu sai → 400', () => thu(() => {
    const sid = em();
    assert(sex.themSEx(taoNguoi('office_admin', ['MB']), { studentId: sid, tuan }).id, 'Admin MB thêm');
    assert(sex.themSEx(P.admin, { studentId: sid, tuan }).id, 'QT thêm');
    for (const [ten, p] of [['GV S', P.sTeacher], ['GVCN', P.coreTeacher], ['TVV', taoNguoi('consultant', ['MB'])], ['QL CP', P.cpManager]] as const) {
      assert(maLoi(() => sex.themSEx(p, { studentId: sid, tuan })) === 403, `${ten} thêm → 403`);
    }
    const sai: [string, Record<string, unknown>][] = [
      ['thiếu ngày', {}], ['ngày sai', { tuan: '14/09' }], ['band 9.5', { tuan, diem: 9.5 }], ['band 6.3', { tuan, diem: 6.3 }],
      ['điểm tuần tới', { tuan: addDays(tuan, 7), diem: 6 }], ['nhận xét 1001', { tuan, nhanXet: 'x'.repeat(1001) }],
    ];
    for (const [ten, o] of sai) assert(maLoi(() => sex.themSEx(P.mbManager, { studentId: sid, ...o })) === 400, `${ten} → 400`);
    assert(maLoi(() => sex.themSEx(P.mbManager, { studentId: 987654, tuan })) === 404, 'không có HV → 404');
    assert(get('SELECT COUNT(*) AS n FROM s_expert WHERE student_id = ?', sid).n === 2, 'chỉ 2 lượt hợp lệ');
  }));

  check('SSEX-3 · chấm: GV S (phân công / hồ sơ) cùng chi nhánh chấm + ghi GV chấm; QL nhập hộ; GV W1, GV S CP → 403; GV S không đổi tuần', () => thu(() => {
    const sid = em();
    const { id } = sex.themSEx(P.mbManager, { studentId: sid, tuan });
    const d0 = ds(P.sTeacher).find((x: any) => x.id === id);
    assert(d0 && d0.cham && !d0.sua, `GV S thấy + chấm được, không sửa lịch ${JSON.stringify(d0)}`);
    sex.suaSEx(P.sTeacher, id, { diem: 6.5, nhanXet: 'Fluency ổn.' });
    const r = get('SELECT diem, nhan_xet, cham_boi FROM s_expert WHERE id = ?', id);
    assert(r.diem === 6.5 && r.nhan_xet === 'Fluency ổn.' && r.cham_boi === P.sTeacher.userId, `đã chấm ${JSON.stringify(r)}`);
    assert(ds(P.mbManager).find((x: any) => x.id === id).nguoiCham === P.sTeacher.fullName, 'GV chấm hiện tên');
    const gvHoSo = taoNguoi('teacher', ['MB'], ['speaking']);
    sex.suaSEx(gvHoSo, id, { diem: 7 });
    assert(get('SELECT cham_boi FROM s_expert WHERE id = ?', id).cham_boi === gvHoSo.userId, 'GV S chỉ khai ở hồ sơ (N7) chấm được');
    assert(maLoi(() => sex.suaSEx(P.w1Teacher, id, { diem: 5 })) === 403, 'GV W1 chấm → 403');
    assert(maLoi(() => sex.suaSEx(taoNguoi('teacher', ['CP'], ['speaking']), id, { diem: 5 })) === 403, 'GV S chi nhánh khác → 403');
    assert(maLoi(() => sex.suaSEx(P.sTeacher, id, { tuan: addDays(tuan, -7) })) === 403, 'GV S đổi tuần → 403');
    assert(maLoi(() => sex.suaSEx(P.sTeacher, id, { diem: 10 })) === 400, 'band 10 → 400');
    sex.suaSEx(P.mbManager, id, { diem: 7.5 });
    assert(get('SELECT diem, cham_boi FROM s_expert WHERE id = ?', id).cham_boi === P.mbManager.userId, 'QL nhập hộ');
  }));

  check('SSEX-4 · KHÔNG vào tính toán: bảng điểm / việc / Case / chuông, Lịch Test (dải số, nợ, lớp), Công việc GV S, nợ điểm không đổi', () => thu(() => {
    const sid = em();
    const tw = addDays(tuan, -7);
    const pid = ensurePeriod(tw).id;
    const anh = () => {
      const l = cham.lichTest(P.mbManager, pid, null, today);
      const ls = cham.lichTest(P.sTeacher, pid, null, today);
      return JSON.stringify([dem(), l.tongQuan, l.tongQuanKhung, l.no, l.lop, l.chamTuanNay, ls.tongQuan, ls.lop,
        mywork.myWork(P.sTeacher, {}).items?.length, mywork.myWork(P.mbManager, {}).items?.length, scoreDebtCells(P.admin, today, null).length]);
    };
    const truoc = anh();
    const { id } = sex.themSEx(P.mbManager, { studentId: sid, tuan: tw });
    const { id: id2 } = sex.themSEx(P.mbManager, { studentId: sid, tuan: tw, diem: 4, nhanXet: 'Thấp.' });
    sex.suaSEx(P.sTeacher, id, { diem: 3 });
    assert(anh() === truoc, 'số đếm đổi sau khi thêm + chấm S Ex (chưa chấm cũng không thành nợ)');
    assert(ds(P.mbManager, tw).filter((x: any) => x.id === id || x.id === id2).length === 2, 'vẫn hiện ở Lịch Test tuần');
  }));

  check('SSEX-5 · sửa / xoá: lịch sử cũ → mới; lưu y nguyên không ghi; GV S xoá → 403; 404; /lich-su?loai=s-ex mới trước, ngoài phạm vi 403', () => thu(() => {
    const sid = em();
    const { id } = sex.themSEx(P.mbManager, { studentId: sid, tuan });
    const nk = () => get(`SELECT COUNT(*) AS n FROM audit_logs WHERE action LIKE 's_expert.%' AND entity_id = ?`, sid).n;
    assert(sex.suaSEx(P.mbManager, id, { tuan }).doi === false && nk() === 1, 'lưu y nguyên không ghi nhật ký');
    assert(sex.suaSEx(P.mbManager, id, { ngay: addDays(tuan, -6) }).doi, 'đổi ngày');
    assert(get('SELECT tuan, sua_boi FROM s_expert WHERE id = ?', id).tuan === addDays(tuan, -7), 'ngày kéo tuần theo');
    sex.suaSEx(P.sTeacher, id, { diem: 6, nhanXet: 'Ổn.' });
    assert(maLoi(() => sex.xoaSEx(P.sTeacher, id)) === 403, 'GV S xoá → 403');
    assert(maLoi(() => sex.suaSEx(P.mbManager, 987654, { tuan })) === 404, 'không có lượt → 404');
    sex.xoaSEx(P.mbManager, id);
    assert(get('SELECT xoa_luc FROM s_expert WHERE id = ?', id)?.xoa_luc, 'xoá mềm: dòng còn, có xoa_luc (SV-LOP)');
    const ls = lichSu(P.mbManager, { loai: 's-ex', id: sid });
    const tom = ls.dong.map((d: any) => d.truong.map((x: any) => `${x.ten}:${x.cu ?? '∅'}>${x.moi ?? '∅'}`).join('|'));
    assert(ls.dong.length === 4, `4 mục (thêm, đổi ngày, chấm, xoá) ${JSON.stringify(tom)}`);
    assert(tom[0].includes('Điểm:6>∅') && tom[1].includes('Điểm:∅>6') && tom[1].includes('Nhận xét:∅>Ổn.'), `cũ → mới ${JSON.stringify(tom)}`);
    assert(ls.dong[1].nguoi === P.sTeacher.fullName, 'người chấm trong lịch sử');
    assert(maLoi(() => lichSu(P.cpManager, { loai: 's-ex', id: sid })) === 403, 'lịch sử ngoài phạm vi → 403');
  }));

  check('SSEX-6 · xoá học viên xoá lượt S Ex của em', () => thu(() => {
    const sid = em();
    sex.themSEx(P.mbManager, { studentId: sid, tuan });
    assert(xoaHV.BANG_CUA_HOC_VIEN.includes('s_expert'), 'có trong BANG_CUA_HOC_VIEN');
    for (const q of xoaHV.CAU_XOA_HOC_VIEN) if (!q.sql.startsWith('SELECT')) conn.prepare(q.sql).run(sid);
    assert(!get('SELECT 1 AS c FROM s_expert WHERE student_id = ?', sid), 'dòng của em đã xoá');
  }));
  const { default: Database } = await import('libsql');
  check('SSEX-7 · migrate prSvSExpert chạy lặp được: thiếu bảng thì tạo, lần hai không làm gì', () => {
    const moi = new Database(':memory:');
    try {
      const a: string[] = []; migratePrSvSExpert(moi, a);
      const b: string[] = []; migratePrSvSExpert(moi, b);
      assert(a.length === 1 && b.length === 0 && moi.prepare(`SELECT 1 AS c FROM sqlite_master WHERE name = 's_expert'`).get(), `migrate ${a} / ${b}`);
      assert(moi.prepare(`SELECT name FROM pragma_table_info('s_expert')`).all().some((c: any) => c.name === 'xoa_luc'), 'bảng mới có xoa_luc');
    } finally { moi.close(); }
    /* SV-LOP: bảng của #526 (chưa có xoa_luc) → thêm 2 cột một lần, dữ liệu giữ. */
    const cu = new Database(':memory:');
    try {
      cu.exec(`CREATE TABLE s_expert (id INTEGER PRIMARY KEY, student_id INTEGER, tuan TEXT, ngay TEXT, diem REAL, nhan_xet TEXT, cham_boi INTEGER, cham_luc TEXT,
        them_boi INTEGER, them_luc TEXT NOT NULL, sua_boi INTEGER, sua_luc TEXT); INSERT INTO s_expert (student_id, tuan, them_luc) VALUES (1, '2026-09-14', 'x')`);
      const a: string[] = []; migratePrSvSExpert(cu, a);
      const b: string[] = []; migratePrSvSExpert(cu, b);
      assert(a.length === 1 && b.length === 0 && (cu.prepare('SELECT xoa_luc, xoa_boi FROM s_expert').get() as any).xoa_luc === null, `migrate bảng cũ ${a} / ${b}`);
    } finally { cu.close(); }
  });

  /* ------------------------------------------------------------ SV-LOP: 5 điểm nợ rà #526 */
  check('SSEX-8 (nợ 1) · xoá MỀM + khôi phục: dòng xoá không hiện ở Lịch Test / Kế hoạch Test, không sửa được; khôi phục hiện lại y nguyên; chỉ QL / Admin; có lịch sử', () => thu(() => {
    const sid = em();
    const { id } = sex.themSEx(P.mbManager, { studentId: sid, tuan, nhanXet: 'Giữ.' });
    sex.xoaSEx(P.mbManager, id);
    assert(!ds(P.mbManager).some((x: any) => x.id === id), 'Lịch Test không còn');
    assert(!kh.luoiFT(P.mbManager, LOP).hang.find((x: any) => x.studentId === sid).sEx.some((x: any) => x.id === id), 'Kế hoạch Test không còn');
    assert(maLoi(() => sex.suaSEx(P.mbManager, id, { diem: 6 })) === 404, 'sửa dòng đã xoá → 404');
    assert(maLoi(() => sex.xoaSEx(P.mbManager, id)) === 404, 'xoá lần hai → 404');
    assert(maLoi(() => sex.khoiPhucSEx(P.sTeacher, id)) === 403, 'GV S khôi phục → 403');
    assert(maLoi(() => sex.khoiPhucSEx(P.cpManager, id)) === 403, 'QL chi nhánh khác khôi phục → 403');
    assert(sex.khoiPhucSEx(P.mbManager, id).khoiPhuc, 'QL khôi phục');
    const d = ds(P.mbManager).find((x: any) => x.id === id);
    assert(d && d.nhanXet === 'Giữ.', `hiện lại y nguyên ${JSON.stringify(d)}`);
    assert(maLoi(() => sex.khoiPhucSEx(P.mbManager, id)) === 404, 'khôi phục dòng chưa xoá → 404');
    const ls = lichSu(P.mbManager, { loai: 's-ex', id: sid });
    assert(ls.dong.length === 3, `3 mục (thêm, xoá, khôi phục) — ${ls.dong.length}`);
  }));

  check('SSEX-9 (nợ 2) · sửa / xoá đọc dòng TRONG tx: dòng vừa mất (changes = 0) → 404, không ghi nhật ký', () => thu(() => {
    const sid = em();
    const { id } = sex.themSEx(P.mbManager, { studentId: sid, tuan });
    const nk = () => get(`SELECT COUNT(*) AS n FROM audit_logs WHERE action LIKE 's_expert.%' AND entity_id = ?`, sid).n;
    const truoc = nk();
    /* Giả lập ghi song song: dòng bị xoá mềm ngay trước câu UPDATE (trigger), sau khi đã đọc. */
    conn.exec(`CREATE TEMP TRIGGER svlop_dua BEFORE UPDATE OF diem ON s_expert BEGIN UPDATE s_expert SET xoa_luc = 'x' WHERE id = OLD.id; END`);
    try {
      assert(maLoi(() => sex.suaSEx(P.mbManager, id, { diem: 6 })) === 404, 'đua → 404');
    } finally { conn.exec('DROP TRIGGER svlop_dua'); }
    assert(nk() === truoc, 'không ghi nhật ký khi không đổi dòng nào');
    assert(get('SELECT diem, xoa_luc FROM s_expert WHERE id = ?', id).xoa_luc === null, 'tx cuộn lại cả ghi của trigger');
  }));

  check('SSEX-10 (nợ 3) · kiểm quyền TRƯỚC 404: GV / TVV gửi HV / lượt không có → 403 (không lộ tồn tại); QL vẫn 404', () => thu(() => {
    const tvv = taoNguoi('consultant', ['MB']);
    for (const [ten, p] of [['GVCN', P.coreTeacher], ['TVV', tvv]] as const) {
      assert(maLoi(() => sex.themSEx(p, { studentId: 987654, tuan })) === 403, `${ten} thêm HV không có → 403`);
      assert(maLoi(() => sex.xoaSEx(p, 987654)) === 403, `${ten} xoá lượt không có → 403`);
      assert(maLoi(() => sex.khoiPhucSEx(p, 987654)) === 403, `${ten} khôi phục lượt không có → 403`);
    }
    assert(maLoi(() => sex.suaSEx(tvv, 987654, { diem: 6 })) === 403, 'TVV sửa lượt không có → 403');
    assert(maLoi(() => sex.themSEx(P.mbManager, { studentId: 987654, tuan })) === 404, 'QL HV không có → 404');
    assert(maLoi(() => sex.xoaSEx(P.mbManager, 987654)) === 404, 'QL lượt không có → 404');
  }));

  check('SSEX-11 (nợ 4) · HV không có lớp đang học → 400 kèm lý do, không thêm dòng', () => thu(() => {
    const sid = em();
    conn.prepare(`UPDATE enrollments SET status = 'completed' WHERE student_id = ? AND status = 'active'`).run(sid);
    xoaNho();
    let loi = '';
    try { sex.themSEx(P.mbManager, { studentId: sid, tuan }); } catch (e: any) { loi = `${e.status} ${e.message}`; }
    assert(/^400 .*lớp đang học/.test(loi), `400 + lý do: ${loi}`);
    assert(!get('SELECT 1 AS c FROM s_expert WHERE student_id = ?', sid), 'không thêm');
  }));

  check('SSEX-12 (nợ 5) · chấm theo chi nhánh ghi danh ACTIVE: em đã rời lớp MB, đang học lớp CP → GV S MB 403, GV S CP chấm; QL nhập hộ như S MT', () => thu(() => {
    const sid = em();
    const { id } = sex.themSEx(P.mbManager, { studentId: sid, tuan });
    const lopCp = get(`SELECT id FROM classes WHERE branch_id = (SELECT id FROM branches WHERE code = 'CP') AND status = 'active' ORDER BY id LIMIT 1`).id;
    conn.prepare(`UPDATE enrollments SET status = 'transferred' WHERE student_id = ? AND status = 'active'`).run(sid);
    conn.prepare(`INSERT INTO enrollments (student_id, class_id, status, started_at, created_at) VALUES (?, ?, 'active', ?, ?)`).run(sid, lopCp, today, today);
    xoaNho();
    const gvCp = taoNguoi('teacher', ['CP'], ['speaking']);
    assert(maLoi(() => sex.suaSEx(P.sTeacher, id, { diem: 5 })) === 403, 'GV S MB (chi nhánh ghi danh cũ) → 403');
    sex.suaSEx(gvCp, id, { diem: 5.5 });
    assert(get('SELECT cham_boi FROM s_expert WHERE id = ?', id).cham_boi === gvCp.userId, 'GV S CP chấm');
    assert(maLoi(() => sex.suaSEx(P.cpManager, id, { diem: 6 })) === 'không ném', 'QL CP nhập hộ (lớp đang học)');
    assert(maLoi(() => sex.suaSEx(P.mbManager, id, { diem: 6 })) === 403, 'QL MB (chi nhánh cũ) → 403');
  }));
}
