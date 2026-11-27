/**
 * PHÉP KIỂM LOC-TVV (chủ SP 28/11 "lọc theo TVV ở Lịch Test tuần để TVV biết điểm của học sinh theo đợt"):
 * (1) quyền tham số `tvv` (`tvvLoc`) · (2) Lịch Test + lưới lớp + ô quá hạn chỉ em của TVV — máy chủ lọc · (3) TVV không xem em của TVV khác qua tham số ·
 * (4) dải số = cộng các hàng lớp đã lọc (cùng hàm `tq`).
 */
export async function runPrLocTvvTests(t: any) {
  const { checkAsync, check, assert, conn, P } = t;
  console.log('\nLOC-TVV · bộ lọc TVV ở Lịch Test tuần');
  const { createApp } = await import('../app.ts');
  const { loadPrincipal } = await import('../permissions.ts');
  const cham: any = await import('../cham/canCham.ts');

  const one = (sql: string, ...a: unknown[]) => conn.prepare(sql).get(...a) as any;
  /* Hai TVV cùng chi nhánh, đông em nhất (seed): A lọc, B là "TVV khác". */
  const hai = conn.prepare(`SELECT s.consultant_user_id AS id, s.branch_id AS cn, COUNT(*) AS n FROM students s
      JOIN user_roles ur ON ur.user_id = s.consultant_user_id JOIN roles r ON r.id = ur.role_id AND r.key = 'consultant'
      JOIN branches c ON c.id = s.branch_id
     GROUP BY s.consultant_user_id, s.branch_id ORDER BY n DESC`).all() as any[];
  const A = hai[0];
  const B = hai.find((x: any) => x.cn === A.cn && x.id !== A.id) ?? hai.find((x: any) => x.id !== A.id);
  assert(A && B, 'seed thiếu hai TVV có em');
  const ql = P.mbManager;
  const gv = P.coreTeacher;
  const pA = loadPrincipal(A.id);
  const emA = cham.emCuaTvv(A.id) as Set<number>;

  check('LOC-TVV-1 · tvvLoc: TVV mặc định chính mình, id khác → chính mình, all → bỏ; Head chọn bất kỳ, mặc định bỏ; GV không lọc', () => {
    assert(cham.tvvLoc(pA, null) === A.id && cham.tvvLoc(pA, String(B.id)) === A.id && cham.tvvLoc(pA, 'all') === null, 'TVV');
    assert(cham.tvvLoc(ql, null) === null && cham.tvvLoc(ql, String(B.id)) === B.id && cham.tvvLoc(ql, 'abc') === null, 'Head');
    assert(cham.tvvLoc(gv, String(A.id)) === null, 'GV không được lọc theo TVV');
  });

  const may = createApp().listen(0);
  const cong = (may.address() as any).port as number;
  const phien = new Map<number, string>();
  const goi = async (userId: number, url: string) => {
    if (!phien.has(userId)) {
      const s = await fetch(`http://127.0.0.1:${cong}/api/demo/session`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ userId }) });
      phien.set(userId, (s.headers.get('set-cookie') ?? '').split(';')[0]);
    }
    const r = await fetch(`http://127.0.0.1:${cong}/api${url}`, { headers: { cookie: phien.get(userId)! } });
    assert(r.ok, `${url}: ${r.status}`);
    return r.json() as Promise<any>;
  };
  try {
    /* Tuần có Test của em A: tuần thi gần hôm nay nhất trong các ô của em A. */
    const tuan = one(`SELECT ask.planned_period_id AS id, COUNT(*) n FROM attempt_skills ask JOIN assessment_attempts a ON a.id = ask.attempt_id
        JOIN students s ON s.id = a.student_id WHERE s.consultant_user_id = ? AND ask.planned_period_id IS NOT NULL
       GROUP BY ask.planned_period_id ORDER BY n DESC LIMIT 1`, A.id)?.id;
    assert(tuan, 'em của TVV A không có ô thi nào');
    const q = `/cham/lich-test?periodId=${tuan}&branchId=${A.cn}`;

    await checkAsync('LOC-TVV-2 · Head chọn TVV: chỉ lớp / em của TVV đó, dải số = cộng các hàng (cùng tập), có ô chọn TVV', async () => {
      const moi = await goi(ql.userId, q);
      const loc = await goi(ql.userId, `${q}&tvv=${A.id}`);
      assert(loc.tvv?.dang === A.id && Array.isArray(loc.tvv.ds) && loc.tvv.ds.some((x: any) => x.id === A.id), `tvv: ${JSON.stringify(loc.tvv)}`);
      assert(moi.tvv?.dang === null, 'Head mặc định không lọc');
      assert(loc.lop.length > 0, 'TVV A không có hàng lớp ở tuần thử');
      for (const l of loc.lop) {
        const soEmA = one(`SELECT COUNT(DISTINCT a.student_id) n FROM assessment_attempts a JOIN students s ON s.id = a.student_id
            WHERE a.class_id = ? AND s.consultant_user_id = ?`, l.classId, A.id).n;
        assert(l.soHv <= soEmA, `${l.classCode}: ${l.soHv} em > ${soEmA} em của TVV A`);
        const goc = moi.lop.find((x: any) => x.key === l.key);
        assert(goc && l.tong <= goc.tong, `${l.classCode}: hàng lọc nhiều bài hơn hàng gốc`);
      }
      assert(moi.lop.reduce((s: number, l: any) => s + l.soHv, 0) > loc.lop.reduce((s: number, l: any) => s + l.soHv, 0), 'lọc TVV không bớt em nào');
      const tong = loc.lop.reduce((s: number, l: any) => s + l.tong, 0);
      const con = loc.lop.reduce((s: number, l: any) => s + l.conBai, 0);
      assert(loc.tongQuan.tong === tong && loc.tongQuan.conPhaiCham === con, `dải số ${JSON.stringify(loc.tongQuan)} ≠ hàng ${tong}/${con}`);
      assert(loc.sEx.every((x: any) => emA.has(x.studentId)), 'S Ex lọt em ngoài TVV A');
    });

    await checkAsync('LOC-TVV-3 · lưới lớp (`/classes/:id/cham?tvv=`) chỉ em của TVV; không tham số → cả lớp như cũ', async () => {
      const loc = await goi(ql.userId, `${q}&tvv=${A.id}`);
      const l = loc.lop.find((x: any) => x.mode === 'ielts_band') ?? loc.lop[0];
      const duong = `/classes/${l.classId}/cham?${l.mode === 'ielts_band' ? `periodId=${l.periodId}` : `kind=${encodeURIComponent(l.kind)}`}`;
      const caLop = await goi(ql.userId, duong);
      const chiA = await goi(ql.userId, `${duong}&tvv=${A.id}`);
      const rows = (b: any) => (b.ft ?? b.thuong).rows as any[];
      assert(rows(chiA).length > 0 && rows(chiA).every((r) => emA.has(r.studentId)), 'lưới lọc lọt em ngoài TVV A');
      assert(rows(caLop).length >= rows(chiA).length && rows(caLop).some((r) => !emA.has(r.studentId)) === rows(caLop).length > rows(chiA).length, 'lưới không tham số phải đủ lớp');
    });

    await checkAsync('LOC-TVV-4 · TVV: mặc định em của mình; gửi id TVV khác (Lịch Test, lưới, ô quá hạn) vẫn chỉ em của mình; all = như trước', async () => {
      const macDinh = await goi(A.id, q);
      const khac = await goi(A.id, `${q}&tvv=${B.id}`);
      const bo = await goi(A.id, `${q}&tvv=all`);
      assert(macDinh.tvv?.dang === A.id && macDinh.tvv.ds === null, `TVV: ${JSON.stringify(macDinh.tvv)}`);
      assert(JSON.stringify(khac.lop) === JSON.stringify(macDinh.lop) && khac.tvv.dang === A.id, 'TVV xem được em của TVV khác qua tham số');
      assert(bo.tvv.dang === null && bo.lop.reduce((s: number, l: any) => s + l.soHv, 0) >= macDinh.lop.reduce((s: number, l: any) => s + l.soHv, 0), 'all phải bỏ lọc');
      const l = macDinh.lop[0];
      if (l) {
        const duong = `/classes/${l.classId}/cham?${l.mode === 'ielts_band' ? `periodId=${l.periodId}` : `kind=${encodeURIComponent(l.kind)}`}`;
        const g = await goi(A.id, `${duong}&tvv=${B.id}`);
        assert(((g.ft ?? g.thuong).rows as any[]).every((r) => emA.has(r.studentId)), 'lưới: TVV thấy em của TVV khác qua tham số');
      }
      const qhKhac = await goi(A.id, `/cham/lich-test/qua-han?tvv=${B.id}&rows=1`);
      const qhToi = await goi(A.id, '/cham/lich-test/qua-han?rows=1');
      assert(qhKhac.n === qhToi.n, `ô quá hạn: id TVV khác ${qhKhac.n} ≠ của tôi ${qhToi.n}`);
    });

    await checkAsync('LOC-TVV-5 · ô quá hạn (Head chọn TVV) ≤ không lọc và chỉ lượt của em TVV', async () => {
      const moi = await goi(ql.userId, `/cham/lich-test/qua-han?branchId=${A.cn}`);
      const loc = await goi(ql.userId, `/cham/lich-test/qua-han?branchId=${A.cn}&tvv=${A.id}`);
      assert(loc.n <= moi.n, `quá hạn lọc ${loc.n} > ${moi.n}`);
      const ids = cham.oQuaHanCham(ql, { branchId: A.cn, tvv: A.id }).ids as number[];
      for (const id of ids) {
        const em = one('SELECT student_id FROM assessment_attempts WHERE id = ?', Math.floor(id / 10)).student_id;
        assert(emA.has(em), `ô quá hạn ${id} của em ngoài TVV A`);
      }
    });
  } finally { may.close(); }
}
