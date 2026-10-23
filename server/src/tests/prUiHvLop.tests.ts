/**
 * PHÉP KIỂM V5 · UI-HV-LOP (08 mục 6 dòng 6; dieu-chinh-cuoi khu d; 10 mục 5, 8):
 *  · hàng HV của `/hoc-vien-lop` có TVV + lịch thi thật (`trangThaiLichThi`, cùng hàm góc Lịch thi) — cột Học viên / Lịch thi, chip "Thi tháng này";
 *  · góc Lịch thi: chi tiết dưới hàng (5 ô MT gần nhất, Test sắp tới, Case đang mở, lịch sử lịch thi mới trước ≤ 3);
 *  · khoảng tháng [từ → đến] của góc Lịch thi (`thangTrongKhoang`).
 */
type Kit = { check: (n: string, f: () => void) => void; assert: (c: unknown, m: string) => void; conn: any; P: any; TODAY: string; addDays: (d: string, n: number) => string };

export async function runPrUiHvLopTests(t: Kit) {
  const { check, assert, conn, P, TODAY, addDays } = t;
  const d: any = await import('../../../shared/domain/index.ts');
  const hvl: any = await import('../classes/hocVienLop.ts');
  const lt: any = await import('../classes/lichThi.ts');
  const sos: any = await import('../classes/hocVienSos.ts');
  const standing: any = await import('../students/standing.ts');
  const dhv: any = await import('../classes/dongHocVien.ts');
  console.log('\nV5 · UI-HV-LOP — danh sách gọn: TVV + lịch thi trên hàng, chi tiết dưới hàng Lịch thi');

  check('UHL-1 · thangTrongKhoang: gồm hai đầu, qua năm, ngược → rỗng, trần 12', () => {
    assert(d.thangTrongKhoang('2026-11', '2027-02').join() === '2026-11,2026-12,2027-01,2027-02', 'qua năm');
    assert(d.thangTrongKhoang('2026-09', '2026-09').join() === '2026-09', 'một tháng');
    assert(d.thangTrongKhoang('2026-10', '2026-09').length === 0, 'ngược');
    assert(d.thangTrongKhoang('2026-01', '2028-01').length === 12, 'trần 12');
  });

  check('UHL-2 · hàng HV: tvv = tên TVV của em (null khi chưa có), lich = trangThaiLichThi của lộ trình đang chạy', () => {
    const r = hvl.danhSachHocVienLop(P.mbManager, { phamVi: 'tat-ca' });
    const hang = r.hocVien.filter((h: any) => !h.ketThuc);
    assert(hang.length > 0 && hang.every((h: any) => h.lich && typeof h.lich.trangThai === 'string' && 'tvv' in h), 'thiếu trường');
    const mau = hang.slice(0, 40);
    for (const h of mau) {
      const s = conn.prepare(`SELECT u.full_name AS tvv FROM students s LEFT JOIN users u ON u.id = s.consultant_user_id WHERE s.id = ?`).get(h.id) as any;
      assert((s?.tvv ?? null) === h.tvv, `${h.ten}: tvv ${h.tvv} ≠ ${s?.tvv}`);
    }
    const coTvv = hang.filter((h: any) => h.tvv).length;
    assert(coTvv > 0 && coTvv < hang.length, 'seed: phải có cả em có TVV và em chưa có TVV');
  });

  check('UHL-3 · Lịch thi: chốt ngày rồi ghi chú → hàng HV ra "da-chot-ngay" (cùng ngày); chi tiết dưới hàng có lịch sử mới trước', () => {
    const r0 = lt.danhSachLichThi(P.mbManager, { thang: '2026-09', phamVi: 'tat-ca' });
    const em = r0.rows.find((x: any) => x.cycleId && x.coTheSua && x.lichThi.trangThai === 'chua-co');
    assert(em, 'seed: cần một em chưa có tháng thi');
    conn.exec('SAVEPOINT uhl3');
    try {
      lt.luuLichThi(P.mbManager, em.cycleId, { ketLuan: 'chot-ngay', ngay: addDays(TODAY, 10) });
      lt.luuLichThi(P.mbManager, em.cycleId, { ghiChu: 'Đã đăng ký IDP' });
      const h = hvl.danhSachHocVienLop(P.mbManager, { phamVi: 'tat-ca' }).hocVien.find((x: any) => x.id === em.studentId);
      assert(h.lich.trangThai === 'da-chot-ngay', `lich ${JSON.stringify(h.lich)}`);
      const r1 = lt.danhSachLichThi(P.mbManager, { thang: h.lich.ngay.slice(0, 7), phamVi: 'tat-ca' });
      const x = r1.rows.find((y: any) => y.studentId === em.studentId);
      assert(x && x.lichThi.ngay === h.lich.ngay, 'góc Lịch thi cùng ngày với hàng HV');
      const ls = x.chiTiet.lichSu;
      assert(ls.length >= 2 && ls.length <= 3 && ls[0].ghiChu === 'Đã đăng ký IDP', `lịch sử mới trước: ${JSON.stringify(ls)}`);
      assert(Array.isArray(x.chiTiet.caseMo) && (x.chiTiet.kn === null || 'W1' in x.chiTiet.kn), 'caseMo / kn');
    } finally {
      conn.exec('ROLLBACK TO uhl3'); conn.exec('RELEASE uhl3');
    }
  });

  check('UHL-4 · hàng HV: nhapDiem chỉ khi người xem còn ô chờ nhập (lượt sớm nhất của nhapDiemTheoEm); ke = lượt kế + kỳ vọng của standingFor', () => {
    const dh: any = dhv;
    const r = hvl.danhSachHocVienLop(P.coreTeacher, {});
    const co = r.hocVien.filter((h: any) => h.nhapDiem);
    assert(co.length > 0, 'seed: GVCN MB FT 101 phải có em còn ô chờ nhập');
    /* Cùng đầu vào máy chủ: mọi lớp của trang, lớp của em = dòng ghi danh SAU (Map — em còn hai lớp đang học). */
    const lopCua = new Map(r.hocVien.filter((h: any) => !h.ketThuc).map((h: any) => [h.id, h.classId]));
    const nd = dh.nhapDiemTheoEm(P.coreTeacher, r.rows.map((c: any) => c.id), TODAY, (sid: number) => lopCua.get(sid));
    for (const h of r.hocVien.filter((x: any) => !x.ketThuc)) {
      const x = nd.get(h.id);
      assert(!!h.nhapDiem === !!x?.thuTu, `${h.ten}: nhapDiem ${JSON.stringify(h.nhapDiem)} ≠ ${JSON.stringify(x)}`);
      if (h.nhapDiem) assert(h.nhapDiem.kind === x.thuTu.kind && h.nhapDiem.attemptNo === x.thuTu.attempt_no, `${h.ten}: lượt`);
    }
    const st: any = standing.standingFor(r.hocVien.filter((h: any) => h.hang).map((h: any) => h.id));
    let coKe = 0;
    for (const h of r.hocVien.filter((x: any) => x.hang)) {
      const s0 = st.get(h.id);
      assert((h.hang.ke?.luot ?? null) === (s0?.nextAttemptLabel ?? null) && (h.hang.ke?.kyVong ?? null) === (s0?.nextAttemptLabel ? s0.nextKyVong ?? null : null), `${h.ten}: ke`);
      if (h.hang.ke) coKe += 1;
    }
    assert(coKe > 0, 'seed: phải có em có lượt kế');
  });

  check('UHL-5 · Đang SOS: việc tiếp mang người làm (PA của việc đó, không thì người giữ Case)', () => {
    const r = sos.dangSos(P.mbManager, { phamVi: 'tat-ca' });
    const vt = r.rows.flatMap((x: any) => x.cases).filter((c: any) => c.viecTiep);
    assert(vt.length > 0 && vt.every((c: any) => 'nguoi' in c.viecTiep), 'thiếu trường nguoi');
    assert(vt.some((c: any) => c.viecTiep.nguoi), 'seed: phải có việc tiếp có người làm');
  });
}
