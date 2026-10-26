/**
 * PHÉP KIỂM PR-OV12g — Góp ý hàng tuần ở hồ sơ lớp (đặc tả OV-12 mục 7 điểm 10, mockup 4 phương án A):
 *   (1) ghi đã khoá từ 27/10 (R1-NO-NHO, D14 — phép kiểm GOPY-KHOA ở r1NoNho.tests.ts); dữ liệu cũ chèn thẳng bảng;
 *   (2) quyền đọc + cột `ghiDuoc` (dùng chung Tiến độ trên lớp): GV dạy kỹ năng ô mình (W1 / W2 → ô W); GVCN, QL / QT mọi ô; TVV / CX / Admin chỉ đọc;
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
  const { mondayOf, ensurePeriod } = await import('../platform/week.ts');
  const { addDays } = await import('../util.ts');
  const { xoaNho } = await import('../platform/nguCanhRequest.ts');
  console.log('\nPR-OV12g · Góp ý hàng tuần (chỉ đọc): quyền đọc · 4 tuần · xoá HV · migrate');

  const get = (sql: string, ...a: unknown[]) => conn.prepare(sql).get(...a) as any;
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
  /** Dữ liệu cũ (ghi đã khoá — R1-NO-NHO): chèn thẳng `gop_y_tuan`. */
  const ghi = (p: any, b: { studentId: number; skill: string; noiDung: string; tuan?: string }, lop = LOP) =>
    conn.prepare(`INSERT INTO gop_y_tuan (student_id, class_id, period_id, skill, noi_dung, ghi_boi, ghi_luc) VALUES (?,?,?,?,?,?,?)
      ON CONFLICT(student_id, class_id, period_id, skill) DO UPDATE SET noi_dung = excluded.noi_dung, ghi_boi = excluded.ghi_boi`)
      .run(b.studentId, lop, ensurePeriod(b.tuan ?? tuan).id, b.skill, b.noiDung, p.userId, new Date().toISOString());
  const o = (p: any, sid: number, skill: string, lop = LOP, w = tuan) =>
    (gopY.gopYTuan(p, lop, w).o as any[]).find((x) => x.studentId === sid && x.skill === skill && x.tuan === w) ?? null;

  check('OV12g-2 · quyền đọc + cột ghiDuoc: GVBM W1 chỉ ô W; GVCN mọi ô; TVV / CX / Admin đọc được, mọi cột chỉ đọc', () => thu(() => {
    const sid = em();
    const w1 = P.w1Teacher;
    assert(!isCoreTeacherOf(w1, LOP), 'GV W1 của seed không phải GVCN');
    ghi(P.mbManager, { studentId: sid, skill: 'speaking', noiDung: 'QL sửa' });
    const TVV = taoNguoi('consultant', ['MB']); const CX = taoNguoi('cx', []); const ADMIN = taoNguoi('office_admin', ['MB']);
    for (const [ten, p] of [['TVV', TVV], ['CX', CX], ['Admin', ADMIN]] as const) {
      assert(o(p, sid, 'speaking')?.noiDung === 'QL sửa', `${ten} đọc được`);
      const r = gopY.gopYTuan(p, LOP, tuan);
      assert(r.cot.every((c: any) => !c.ghiDuoc), `${ten}: mọi cột chỉ đọc`);
    }
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
