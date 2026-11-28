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
  const xm: any = await import('../phanTich/xuatMt.ts');
  const sd: any = await import('../../../shared/domain/xuatMt.ts');

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

  check('LOC-TVV-6 · Xuất Excel điểm (Head) theo TVV đang lọc: chỉ em của TVV đó, ít hơn / bằng không lọc; GV gửi tvv → bỏ qua; TVV vẫn 403; tvv sai → lỗi nhập', () => {
    const boLoc = (khung: 'ft' | 'thuong', tvv?: unknown) => sd.docBoLocXuatMt({ khung, tg: 'dot', dot: (khung === 'ft' ? sd.DOT_XUAT_FT : sd.DOT_XUAT_THUONG).join(','), ...(tvv === undefined ? {} : { tvv }) });
    const mailA = new Set((conn.prepare(`SELECT email FROM students WHERE consultant_user_id = ?`).all(A.id) as any[]).map((r) => r.email));
    let soDongA = 0;
    for (const khung of ['ft', 'thuong'] as const) {
      const moi = xm.duLieuXuatMt(ql, boLoc(khung));
      const loc = xm.duLieuXuatMt(ql, boLoc(khung, String(A.id)));
      assert(loc.dem.luot <= moi.dem.luot, `${khung}: lọc ${loc.dem.luot} > không lọc ${moi.dem.luot}`);
      for (const s of loc.sheets.filter((x: any) => x.ten !== 'Bộ lọc đã dùng')) {
        const iMail = (s.aoa[0] as string[]).indexOf('Email');
        for (const r of s.aoa.slice(1)) { assert(mailA.has(r[iMail]), `${khung}: dòng em ngoài TVV A`); soDongA++; }
      }
      assert(loc.moTa.some((r: string[]) => r[0] === 'TVV'), 'Bộ lọc đã dùng phải ghi TVV');
      const gvMoi = xm.duLieuXuatMt(gv, boLoc(khung)), gvLoc = xm.duLieuXuatMt(gv, boLoc(khung, String(A.id)));
      assert(gvMoi.dem.luot === gvLoc.dem.luot, `${khung}: GV gửi tvv mà tệp đổi`);
    }
    assert(soDongA > 0, 'em của TVV A không có lượt nào để xuất');
    let ma = 0;
    try { xm.duLieuXuatMt(pA, boLoc('ft', String(A.id))); } catch (e: any) { ma = e.status; }
    assert(ma === 403, `TVV xuất: ${ma}`);
    assert(typeof boLoc('ft', 'abc') === 'string', 'tvv sai phải báo lỗi');
  });

  check('LOC-TVV-7 · (P2 rà #2320) tvv chỉ nhận TVV trong phạm vi người xem: TVV chi nhánh khác / người không phải TVV → bỏ qua ở Lịch Test và Xuất (tệp, "Bộ lọc đã dùng" không có tên họ); tên tệp ghi TVV', () => {
    const cnQl = [...new Set(ql.grants.map((g: any) => g.branchId))];
    const ngoai = one(`SELECT ur.user_id AS id FROM user_roles ur JOIN roles r ON r.id = ur.role_id AND r.key = 'consultant' JOIN users u ON u.id = ur.user_id AND u.status = 'active'
        WHERE ur.status = 'active' AND ur.branch_id IS NOT NULL AND ur.branch_id NOT IN (SELECT value FROM json_each(?))
          AND ur.user_id NOT IN (SELECT user_id FROM user_roles x JOIN roles y ON y.id = x.role_id AND y.key = 'consultant' WHERE x.status = 'active' AND (x.branch_id IS NULL OR x.branch_id IN (SELECT value FROM json_each(?))))
        ORDER BY ur.user_id LIMIT 1`, JSON.stringify(cnQl), JSON.stringify(cnQl))?.id as number | undefined;
    assert(ngoai, 'seed: cần một TVV chỉ ở chi nhánh ngoài phạm vi QL');
    assert(cham.tvvLoc(ql, String(ngoai)) === null, 'Lịch Test nhận TVV ngoài phạm vi');
    assert(cham.tvvLoc(ql, String(gv.userId)) === null, 'Lịch Test nhận người không phải TVV');
    assert(cham.tvvLoc(P.admin, String(ngoai)) === ngoai, 'Quản trị (toàn hệ thống) phải chọn được mọi TVV');
    /* Ô chọn TVV (không chọn chi nhánh) cùng phạm vi: không liệt kê TVV chọn vào sẽ bị bỏ qua. */
    const dsQl = cham.dsTvvTrongPhamVi(ql) as { id: number }[];
    assert(dsQl.length && !dsQl.some((x) => x.id === ngoai) && dsQl.every((x) => cham.tvvLoc(ql, String(x.id)) === x.id), 'ô chọn TVV của QL lệch luật nhận tham số');
    assert((cham.dsTvvTrongPhamVi(P.admin) as { id: number }[]).some((x) => x.id === ngoai), 'Quản trị thấy mọi TVV');
    const boLoc = (tvv?: number) => sd.docBoLocXuatMt({ khung: 'ft', tg: 'dot', dot: sd.DOT_XUAT_FT.join(','), ...(tvv ? { tvv: String(tvv) } : {}) });
    const moi = xm.duLieuXuatMt(ql, boLoc()), la = xm.duLieuXuatMt(ql, boLoc(ngoai));
    assert(la.dem.luot === moi.dem.luot && !la.moTa.some((r: string[]) => r[0] === 'TVV') && la.tenTep === moi.tenTep, 'Xuất: TVV ngoài phạm vi vẫn lọc / ghi tên');
    const coA = xm.duLieuXuatMt(ql, boLoc(A.id));
    assert(coA.tenTep.includes('_TVV-') && coA.tenTep !== moi.tenTep, `tên tệp thiếu TVV: ${coA.tenTep}`);
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
      assert(!('gvLop' in moi), 'Lịch Test không còn gửi gvLop (web bỏ dòng GV dưới mã lớp từ #2312)');
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
