/**
 * PHÉP KIỂM PR-OV12g — Góp ý hàng tuần ở hồ sơ lớp (đặc tả OV-12 mục 7 điểm 10, mockup 4 phương án A):
 *   (1) ghi / sửa / xoá trống (một ô = em × lớp × tuần × kỹ năng), ≤ 500 ký tự, nhật ký;
 *   (2) quyền: GV dạy kỹ năng ghi ô mình (W1 / W2 → ô W), ô khác 403; GVCN mọi ô; QL / QT mọi ô; TVV / CX / Admin đọc được, ghi 403;
 *   (3) đọc trả 4 tuần gần nhất (tuần đang xem + 3 tuần trước), không tuần tương lai; (4) xoá học viên xoá dòng của em;
 *   (5) migrate chạy lặp được. Mỗi ca cuộn lại (`thu`).
 */
export async function runPrOv12gTests(t: any) {
  const { check, assert, conn, P, classId } = t;
  const gopY: any = await import('../classes/gopYTuan.ts');
  const xoaHV: any = await import('../students/xoaHocVien.ts');
  const accounts: any = await import('../platform/accounts.ts');
  const { loadPrincipal, isCoreTeacherOf } = await import('../permissions.ts');
  const { migratePrOv12g } = await import('../migrate/prOv12g.ts');
  const { demoToday } = await import('../demoConfig.ts');
  const { mondayOf } = await import('../platform/week.ts');
  const { addDays } = await import('../util.ts');
  const { xoaNho } = await import('../platform/nguCanhRequest.ts');
  console.log('\nPR-OV12g · Góp ý hàng tuần: ghi / sửa / xoá · quyền · 4 tuần · xoá HV · migrate');

  const get = (sql: string, ...a: unknown[]) => conn.prepare(sql).get(...a) as any;
  const maLoi = (fn: () => unknown): number | string => { try { fn(); return 'không ném'; } catch (e: any) { return e?.status ?? String(e?.message ?? e); } };
  const thu = <T>(fn: () => T): T => {
    conn.exec('BEGIN IMMEDIATE');
    try { xoaNho(); return fn(); } finally { conn.exec('ROLLBACK'); xoaNho(); }
  };
  const LOP = classId('MB FT 101');
  const LOP_THUONG = classId('MB FOU 12');
  const tuan = mondayOf(demoToday());
  const em = (lop = LOP) => get(`SELECT student_id FROM enrollments WHERE class_id = ? AND status = 'active' ORDER BY student_id LIMIT 1`, lop).student_id as number;
  let seq = 0;
  const taoNguoi = (role: string, branches: string[]) => {
    seq += 1;
    return loadPrincipal(accounts.createAccount(P.admin, { email: `ov12g.${seq}${accounts.EMAIL_SUFFIX}`, password: 'matkhau-ov12g', fullName: `Thử OV12g ${seq}`, roles: [{ role, branches }] }).userId as number);
  };
  const ghi = (p: any, body: Record<string, unknown>, lop = LOP) => gopY.ghiGopYTuan(p, lop, { tuan, ...body });
  const o = (p: any, sid: number, skill: string, lop = LOP, w = tuan) =>
    (gopY.gopYTuan(p, lop, w).o as any[]).find((x) => x.studentId === sid && x.skill === skill && x.tuan === w) ?? null;

  check('OV12g-1 · ghi / sửa / xoá trống: một dòng mỗi ô, người ghi + lúc ghi, nhật ký; > 500 ký tự → 400', () => thu(() => {
    const sid = em();
    const r = ghi(P.coreTeacher, { studentId: sid, skill: 'listening', noiDung: '  Nghe sót đáp án khi người nói đổi ý.  ' });
    assert(r.noiDung === 'Nghe sót đáp án khi người nói đổi ý.' && r.ghiBoi === P.coreTeacher.fullName && r.ghiLuc, `trả về ${JSON.stringify(r)}`);
    ghi(P.coreTeacher, { studentId: sid, skill: 'listening', noiDung: 'Đã bắt được "actually".' });
    const dong = conn.prepare('SELECT * FROM gop_y_tuan WHERE student_id = ? AND class_id = ?').all(sid, LOP) as any[];
    assert(dong.length === 1 && dong[0].noi_dung === 'Đã bắt được "actually".' && dong[0].ghi_boi === P.coreTeacher.userId, `dòng ${JSON.stringify(dong)}`);
    assert(o(P.mbManager, sid, 'listening')?.noiDung === 'Đã bắt được "actually".', 'đọc lại thấy chữ mới');
    const nk = conn.prepare(`SELECT action FROM audit_logs WHERE action LIKE 'gop_y_tuan.%' AND entity_id = ? ORDER BY id`).all(sid) as any[];
    assert(nk.map((x) => x.action).join() === 'gop_y_tuan.ghi,gop_y_tuan.ghi', `nhật ký ${JSON.stringify(nk)}`);
    ghi(P.coreTeacher, { studentId: sid, skill: 'listening', noiDung: '   ' });
    assert(!get('SELECT 1 AS c FROM gop_y_tuan WHERE student_id = ? AND class_id = ?', sid, LOP), 'xoá hết chữ = xoá dòng');
    assert(get(`SELECT action FROM audit_logs WHERE action LIKE 'gop_y_tuan.%' ORDER BY id DESC LIMIT 1`).action === 'gop_y_tuan.xoa', 'nhật ký xoá');
    assert(maLoi(() => ghi(P.coreTeacher, { studentId: sid, skill: 'listening', noiDung: 'x'.repeat(501) })) === 400, '501 ký tự → 400');
    assert(maLoi(() => ghi(P.coreTeacher, { studentId: sid, skill: 'writing1', noiDung: 'a' })) === 400, 'kỹ năng không phải cột của lớp → 400');
    assert(maLoi(() => ghi(P.coreTeacher, { studentId: sid, skill: 'listening', noiDung: 'a', tuan: addDays(tuan, 7) })) === 400, 'tuần tương lai → 400');
    const ngoai = em(LOP_THUONG);
    assert(maLoi(() => ghi(P.mbManager, { studentId: ngoai, skill: 'listening', noiDung: 'a' })) === 400, 'em không học lớp này → 400');
  }));

  check('OV12g-2 · quyền: GVBM W1 chỉ ô W (L 403); GVCN mọi ô; QL / QT mọi ô; TVV / CX / Admin đọc được, ghi 403; QL chi nhánh khác 403', () => thu(() => {
    const sid = em();
    const w1 = P.w1Teacher;
    assert(!isCoreTeacherOf(w1, LOP), 'GV W1 của seed không phải GVCN');
    assert(ghi(w1, { studentId: sid, skill: 'writing', noiDung: 'Task 1 chưa có overview.' }).noiDung, 'GV W1 ghi ô W');
    assert(maLoi(() => ghi(w1, { studentId: sid, skill: 'listening', noiDung: 'a' })) === 403, 'GV W1 ghi ô L → 403');
    for (const k of ['listening', 'reading', 'writing', 'speaking']) ghi(P.coreTeacher, { studentId: sid, skill: k, noiDung: `GVCN ${k}` });
    ghi(P.mbManager, { studentId: sid, skill: 'speaking', noiDung: 'QL sửa' });
    ghi(P.admin, { studentId: sid, skill: 'reading', noiDung: 'QT sửa' });
    const TVV = taoNguoi('consultant', ['MB']); const CX = taoNguoi('cx', []); const ADMIN = taoNguoi('office_admin', ['MB']);
    for (const [ten, p] of [['TVV', TVV], ['CX', CX], ['Admin', ADMIN]] as const) {
      assert(o(p, sid, 'speaking')?.noiDung === 'QL sửa', `${ten} đọc được`);
      const r = gopY.gopYTuan(p, LOP, tuan);
      assert(r.cot.every((c: any) => !c.ghiDuoc), `${ten}: mọi cột chỉ đọc`);
      assert(maLoi(() => ghi(p, { studentId: sid, skill: 'speaking', noiDung: 'a' })) === 403, `${ten} ghi → 403`);
    }
    assert(maLoi(() => ghi(P.cpManager, { studentId: sid, skill: 'speaking', noiDung: 'a' })) === 403, 'QL chi nhánh khác → 403');
    const cotW1 = gopY.gopYTuan(w1, LOP, tuan).cot as any[];
    assert(cotW1.map((c) => `${c.skill}:${c.ghiDuoc ? 1 : 0}`).join() === 'listening:0,reading:0,writing:1,speaking:0', `cột của GV W1 ${JSON.stringify(cotW1)}`);
    /* lớp thường: cột theo môn chương trình, GVCN ghi mọi ô */
    const cotThuong = gopY.gopYTuan(P.normalCoreTeacher, LOP_THUONG, tuan).cot as any[];
    assert(cotThuong.length >= 3 && cotThuong.every((c) => c.ghiDuoc) && cotThuong.some((c) => c.nhan === 'G+V'), `cột FOU ${JSON.stringify(cotThuong)}`);
  }));

  check('OV12g-3 · đọc 4 tuần gần nhất (tuần đang xem + 3 tuần trước), tuần 5 trước không trả; tuần sau = null ở tuần này; tuần gần nhất có góp ý', () => thu(() => {
    const sid = em();
    for (let i = 0; i <= 4; i++) ghi(P.mbManager, { studentId: sid, skill: 'reading', noiDung: `Tuần −${i}`, tuan: addDays(tuan, -7 * i) });
    const r = gopY.gopYTuan(P.mbManager, LOP, tuan);
    assert(r.tuan.length === 4 && r.tuan[0].weekStart === tuan && r.tuan[3].weekStart === addDays(tuan, -21), `tuần ${JSON.stringify(r.tuan)}`);
    const cua = (r.o as any[]).filter((x) => x.studentId === sid).map((x) => x.noiDung).sort();
    assert(cua.join() === 'Tuần −0,Tuần −1,Tuần −2,Tuần −3', `góp ý trả ${cua}`);
    assert(r.sau === null && r.truoc === addDays(tuan, -7), `điều hướng ${r.truoc} ${r.sau}`);
    const cu = gopY.gopYTuan(P.mbManager, LOP, addDays(tuan, -7));
    assert(cu.sau === tuan, 'tuần trước có › tới tuần này');
    assert(gopY.gopYTuan(P.mbManager, LOP, addDays(tuan, 14)).tuan[0].weekStart === tuan, 'tuần tương lai → kẹp về tuần này');
    conn.prepare('DELETE FROM gop_y_tuan WHERE period_id = (SELECT id FROM report_periods WHERE week_start = ?)').run(tuan);
    const rong = gopY.gopYTuan(P.mbManager, LOP, tuan);
    assert(rong.ganNhat?.weekStart === addDays(tuan, -7) && rong.ganNhat.soEm >= 1, `tuần gần nhất có góp ý ${JSON.stringify(rong.ganNhat)}`);
  }));

  check('OV12g-4 · xoá học viên xoá dòng góp ý của em (một giao dịch, bảng nằm trong danh sách xoá)', () => thu(() => {
    const sid = em();
    ghi(P.mbManager, { studentId: sid, skill: 'reading', noiDung: 'Sẽ mất cùng em' });
    assert(xoaHV.BANG_CUA_HOC_VIEN.includes('gop_y_tuan'), 'có trong BANG_CUA_HOC_VIEN');
    for (const q of xoaHV.CAU_XOA_HOC_VIEN) if (!q.sql.startsWith('SELECT')) conn.prepare(q.sql).run(sid);
    assert(!get('SELECT 1 AS c FROM gop_y_tuan WHERE student_id = ?', sid), 'dòng của em đã xoá');
  }));

  check('OV12g-5 · migrate prOv12g chạy lặp được: thiếu bảng thì tạo, lần hai không làm gì', () => thu(() => {
    conn.exec('DROP TABLE gop_y_tuan');
    const a: string[] = [];
    migratePrOv12g(conn, a);
    assert(a.length === 1 && get(`SELECT 1 AS c FROM sqlite_master WHERE name = 'gop_y_tuan'`), `lần một ${a}`);
    const b: string[] = [];
    migratePrOv12g(conn, b);
    assert(b.length === 0, `lần hai ${b}`);
  }));
}
