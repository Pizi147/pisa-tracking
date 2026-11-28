/**
 * PHÉP KIỂM HV-LOC-TVV (chủ SP 28/11, PTA chốt [XM]): Học viên & Lớp — ô "TVV ▾" thay "HV của tôi" của ô Xem + lọc TVV trên web.
 * (1) máy chủ lọc đúng tập em: một TVV · chưa có TVV · tất cả · "Tôi" (TVV mặc định = "HV của tôi" cũ) · tên TVV (link cũ) ·
 * (2) TVV chọn TVV khác chỉ thấy em trong phạm vi của mình hôm nay (lọc chỉ HẸP) · (3) Đang SOS, theo vai, Lịch thi cùng tập.
 */
export async function runPrHvLocTvvTests(t: any) {
  const { checkAsync, check, assert, conn, P } = t;
  console.log('\nHV-LOC-TVV · ô TVV ở Học viên & Lớp');
  const { createApp } = await import('../app.ts');
  const { loadPrincipal } = await import('../permissions.ts');
  const hvl: any = await import('../classes/hocVienLop.ts');
  const sosSvc: any = await import('../classes/hocVienSos.ts');

  /* Hai TVV cùng chi nhánh, đông em nhất (seed): A người xem, B "TVV khác". */
  const hai = conn.prepare(`SELECT s.consultant_user_id AS id, s.branch_id AS cn, u.full_name AS ten, COUNT(*) AS n FROM students s
      JOIN users u ON u.id = s.consultant_user_id JOIN user_roles ur ON ur.user_id = s.consultant_user_id JOIN roles r ON r.id = ur.role_id AND r.key = 'consultant'
     WHERE s.archived_at IS NULL GROUP BY s.consultant_user_id, s.branch_id ORDER BY n DESC`).all() as any[];
  const A = hai[0];
  const B = hai.find((x: any) => x.cn === A.cn && x.id !== A.id);
  assert(A && B, 'seed thiếu hai TVV có em cùng chi nhánh');
  const ql = P.mbManager;
  const pA = loadPrincipal(A.id);
  const tvvCua = (id: number) => (conn.prepare('SELECT consultant_user_id c FROM students WHERE id = ?').get(id) as any).c as number | null;
  const ids = (tr: any) => new Set<number>(tr.hocVien.map((h: any) => h.id));
  const cn = { phamVi: 'chi-nhanh', branchId: A.cn };

  check('HVLT-1 · Head chọn một TVV / Chưa có TVV / Tất cả — máy chủ chỉ gửi em khớp; Tất cả = như cũ; tập con của Tất cả', () => {
    const tat = hvl.danhSachHocVienLop(ql, cn);
    assert(tat.phamVi.tvv.dang === null && tat.phamVi.tvv.ds.some((x: any) => x.id === A.id), `Head mặc định Tất cả + có ds: ${JSON.stringify(tat.phamVi.tvv)}`);
    assert(JSON.stringify(hvl.danhSachHocVienLop(ql, { ...cn, tvv: 'tat-ca' }).hocVien) === JSON.stringify(tat.hocVien), 'tvv=tat-ca khác không tham số');
    const motTvv = hvl.danhSachHocVienLop(ql, { ...cn, tvv: String(B.id) });
    assert(motTvv.phamVi.tvv.dang === B.id && motTvv.hocVien.length > 0, 'TVV B không có em');
    assert(motTvv.hocVien.every((h: any) => tvvCua(h.id) === B.id), 'lọt em không phải của TVV B');
    const chua = hvl.danhSachHocVienLop(ql, { ...cn, tvv: '-' });
    assert(chua.phamVi.tvv.dang === 'chua' && chua.hocVien.every((h: any) => tvvCua(h.id) === null), 'Chưa có TVV lọt em có TVV');
    assert(JSON.stringify(hvl.danhSachHocVienLop(ql, { ...cn, tvv: 'chua' }).hocVien) === JSON.stringify(chua.hocVien), '`chua` (SV-TVV-VIEC) ≠ `-`');
    const tap = ids(tat);
    for (const x of [motTvv, chua]) assert([...ids(x)].every((id) => tap.has(id)), 'lọc TVV mở thêm em ngoài phạm vi');
    const dem = tat.hocVien.filter((h: any) => tvvCua(h.id) === B.id).length;
    assert(motTvv.hocVien.length === dem, `số dòng TVV B ${motTvv.hocVien.length} ≠ đếm trong Tất cả ${dem}`);
    /* Link cũ `tvv=<tên>` (lọc web trước PR) → cùng kết quả id. */
    assert(JSON.stringify(hvl.danhSachHocVienLop(ql, { ...cn, tvv: B.ten }).hocVien) === JSON.stringify(motTvv.hocVien), 'link cũ tvv=<tên> khác tvv=<id>');
  });

  check('HVLT-2 · TVV: mặc định "Tôi" = HV của tôi (như cũ); link cũ phamVi=cua-toi; chọn TVV khác / Tất cả chỉ trong phạm vi hôm nay', () => {
    const md = hvl.danhSachHocVienLop(pA, {});
    assert(md.phamVi.dangDung === 'cua-toi' && md.phamVi.tvv.dang === 'toi', `mặc định ${JSON.stringify(md.phamVi.dangDung)} ${md.phamVi.tvv.dang}`);
    assert(md.hocVien.length > 0 && md.hocVien.every((h: any) => tvvCua(h.id) === A.id), 'Tôi lọt em TVV khác');
    assert(JSON.stringify(hvl.danhSachHocVienLop(pA, { phamVi: 'cua-toi' }).hocVien) === JSON.stringify(md.hocVien), 'phamVi=cua-toi khác mặc định');
    assert(JSON.stringify(hvl.danhSachHocVienLop(pA, { tvv: 'toi' }).hocVien) === JSON.stringify(md.hocVien), 'tvv=toi khác mặc định');
    const tat = hvl.danhSachHocVienLop(pA, { tvv: 'tat-ca' });
    assert(tat.phamVi.dangDung !== 'cua-toi' && tat.phamVi.tvv.dang === null && tat.hocVien.length > md.hocVien.length, 'TVV Tất cả không rời HV của tôi');
    const homNay = hvl.danhSachHocVienLop(pA, { phamVi: 'chi-nhanh' });   // phạm vi rộng nhất TVV xem được trước PR
    const khac = hvl.danhSachHocVienLop(pA, { tvv: String(B.id) });
    assert(khac.phamVi.dangDung !== 'cua-toi' && khac.hocVien.length > 0 && khac.hocVien.every((h: any) => tvvCua(h.id) === B.id), 'TVV chọn TVV B sai tập');
    const tapHomNay = ids(homNay);
    assert([...ids(khac), ...ids(tat)].every((id) => tapHomNay.has(id)), 'TVV thấy em ngoài phạm vi trước PR');
    /* "Tôi" kèm phạm vi Chi nhánh = em của tôi trong chi nhánh. */
    const toiCn = hvl.danhSachHocVienLop(pA, { phamVi: 'chi-nhanh', tvv: 'toi' });
    assert(toiCn.phamVi.dangDung === 'chi-nhanh' && toiCn.phamVi.tvv.dang === 'toi' && toiCn.hocVien.every((h: any) => tvvCua(h.id) === A.id), 'Tôi + Chi nhánh sai');
  });

  check('HVLT-3 · Đang SOS (bảng + số trên tab) cùng lọc TVV', () => {
    const emB = hvl.emTheoTvv(B.id) as Set<number>;
    const loc = sosSvc.demSos(ql, { ...cn, tvv: String(B.id) }).rows;
    const tat = sosSvc.demSos(ql, cn).rows;
    assert(loc.every((r: any) => emB.has(r.studentId)), 'SOS lọt em ngoài TVV B');
    assert(loc.length === tat.filter((r: any) => emB.has(r.studentId)).length, 'SOS lọc thiếu em');
    assert(sosSvc.dangSos(ql, { ...cn, tvv: '-' }).rows.every((r: any) => tvvCua(r.studentId) === null), 'SOS Chưa có TVV lọt em');
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
    await checkAsync('HVLT-4 · theo vai (TVV, `theoTrang=1`) + Lịch thi cùng tập TVV đang chọn; không tham số = như cũ', async () => {
      const emB = hvl.emTheoTvv(B.id) as Set<number>;
      const vaiB = await goi(A.id, `/hoc-vien-lop/theo-vai?theoTrang=1&tvv=${B.id}`);
      assert(vaiB.rows.length > 0 && vaiB.rows.every((r: any) => emB.has(r.id)), 'theo vai lọt em ngoài TVV B');
      assert(Object.values(vaiB.ids).flat().every((id: any) => emB.has(id)), 'chip theo vai lọt em');
      const vaiToi = await goi(A.id, '/hoc-vien-lop/theo-vai?theoTrang=1');
      assert(JSON.stringify(vaiToi) === JSON.stringify(await goi(A.id, '/hoc-vien-lop/theo-vai')), 'theo vai mặc định đổi');
      const thang = '2026-01,2026-02,2026-03,2026-04,2026-05,2026-06,2026-07,2026-08,2026-09,2026-10,2026-11,2026-12';
      const lt = await goi(ql.userId, `/hoc-vien-lop/lich-thi?phamVi=chi-nhanh&branchId=${A.cn}&thang=${thang}&tvv=${B.id}`);
      assert(lt.rows.every((r: any) => emB.has(r.studentId)), 'Lịch thi lọt em ngoài TVV B');
      const ltTat = await goi(ql.userId, `/hoc-vien-lop/lich-thi?phamVi=chi-nhanh&branchId=${A.cn}&thang=${thang}`);
      assert(lt.rows.length === ltTat.rows.filter((r: any) => emB.has(r.studentId)).length, 'Lịch thi lọc thiếu em');
    });
  } finally {
    may.close();
  }
}
