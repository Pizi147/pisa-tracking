/**
 * PHÉP KIỂM LUU-TRU-THU-TU (chủ SP 12/11, đề bài `2026-11-12-tinh-hinh-hoc-tap/de-bai.md` mục 1):
 * lớp đã kết thúc: Fast Track → Lớp thường, trong nhóm số lớp lớn nhất đứng đầu; học viên lưu trữ: theo lớp học cuối (cùng thứ tự), trong lớp theo tên.
 */
export async function runPrLuuTruThuTuTests(t: { check: any; assert: any; conn: any; P: any }) {
  const { check, assert, conn, P } = t;
  const d: any = await import('../../../shared/domain/index.ts');
  const lt: any = await import('../classes/luuTru.ts');
  const { xoaNho } = await import('../platform/nguCanhRequest.ts');
  console.log('\nLUU-TRU-THU-TU — Lưu trữ: FT → Lớp thường, số lớp lớn trước; HV theo lớp cuối rồi tên');
  const thu = <T>(fn: () => T): T => {
    conn.exec('BEGIN IMMEDIATE');
    try { xoaNho(); return fn(); } finally { conn.exec('ROLLBACK'); xoaNho(); }
  };

  check('LTT-1 · soSanhLopLuuTru: FT trước thường; trong nhóm 101 > 12 > 9; chi nhánh / ký hiệu vẫn theo thứ tự thường', () => {
    const ds = [
      { code: 'MB FOU 3', branchId: 1, ft: false }, { code: 'MB FT 9', branchId: 1, ft: true }, { code: 'MB FOU 12', branchId: 1, ft: false },
      { code: 'MB FT 101', branchId: 1, ft: true }, { code: 'MB FT RF 2', branchId: 1, ft: true }, { code: 'MB FT 12', branchId: 1, ft: true },
    ];
    const ra = [...ds].sort(d.soSanhLopLuuTru).map((x) => x.code).join(' | ');
    assert(ra === 'MB FT 101 | MB FT 12 | MB FT 9 | MB FT RF 2 | MB FOU 12 | MB FOU 3', ra);
    assert(d.soSanhLop({ code: 'MB FT 9' }, { code: 'MB FT 12' }) < 0, 'soSanhLop mặc định vẫn tăng dần');
  });

  check('LTT-2 · danhSachLuuTru: bảng lớp + học viên theo đúng thứ tự (kết thúc khác ngày không làm lệch)', () => thu(() => {
    const lop = conn.prepare(`SELECT c.id, c.code, c.branch_id, c.is_fast_track FROM classes c JOIN branches b ON b.id = c.branch_id
      WHERE b.code = 'MB' AND c.status = 'active' ORDER BY c.id`).all() as any[];
    assert(lop.some((c) => c.is_fast_track) && lop.some((c) => !c.is_fast_track), 'seed cần lớp FT + lớp thường ở MB');
    /* Ngày kết thúc ngược thứ tự id — cách cũ (finished_at DESC) cho thứ tự khác. */
    lop.forEach((c, i) => conn.prepare(`UPDATE classes SET status = 'finished', finished_at = ? WHERE id = ?`).run(`2026-0${1 + (i % 9)}-15`, c.id));
    const em = conn.prepare(`SELECT DISTINCT e.student_id AS id FROM enrollments e JOIN classes c ON c.id = e.class_id JOIN branches b ON b.id = c.branch_id
      WHERE b.code = 'MB' ORDER BY e.student_id LIMIT 40`).all() as any[];
    for (const r of em) conn.prepare(`UPDATE students SET archived_at = '2026-10-01', status = 'finished' WHERE id = ?`).run(r.id);
    xoaNho();
    const kq = lt.danhSachLuuTru(P.admin, {});
    const ma = kq.lop.map((l: any) => l.code);
    const cn = new Map((conn.prepare('SELECT id, branch_id FROM classes').all() as any[]).map((r) => [r.id, r.branch_id]));
    const k = (l: any) => ({ code: l.code, branchId: cn.get(l.id), ft: l.ft });
    const kv = [...kq.lop].sort((a: any, b: any) => d.soSanhLopLuuTru(k(a), k(b))).map((l: any) => l.code);
    assert(ma.join('|') === kv.join('|'), `lớp: ${ma.join(' · ')}`);
    const dauThuong = kq.lop.findIndex((l: any) => !l.ft);
    assert(dauThuong > 0 && kq.lop.slice(dauThuong).every((l: any) => !l.ft), 'FT trước, lớp thường sau');
    /* Học viên: thứ tự lớp cuối theo đúng thứ tự bảng lớp; cùng lớp → tên tăng dần. */
    const viTri = new Map(kq.lop.map((l: any, i: number) => [l.code, i]));
    const hv = kq.hocVien.filter((s: any) => viTri.has(s.lopCuoi));
    assert(hv.length >= 10, `cần ≥ 10 em có lớp cuối đã kết thúc (${hv.length})`);
    for (let i = 1; i < hv.length; i++) {
      const a = hv[i - 1]; const b = hv[i];
      const sai = (viTri.get(a.lopCuoi) as number) > (viTri.get(b.lopCuoi) as number)
        || (a.lopCuoi === b.lopCuoi && a.fullName.localeCompare(b.fullName, 'vi') > 0);
      assert(!sai, `HV lệch: ${a.fullName} (${a.lopCuoi}) trước ${b.fullName} (${b.lopCuoi})`);
    }
  }));
}
