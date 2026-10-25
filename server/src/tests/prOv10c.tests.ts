/**
 * PHÉP KIỂM PR-OV10c — Tổng quan theo vai (chủ SP 13/10, mockup vai mục 4–6): Admin "Mock Test" (4 ô + GV chấm quá hạn + Nhắc), TVV "Học viên của tôi"
 * và CX "Số liệu" (ô đếm bấm được, cùng nguồn chip Học viên & Lớp). Số ở Tổng quan = số ở màn nó mở. QL không đổi.
 */
import type { YThucTestKit } from './yThuc.tests.ts';

export async function runPrOv10cTests(t: YThucTestKit) {
  const { check, assert, conn, P } = t;
  const { loadPrincipal } = await import('../permissions.ts');
  const accounts: any = await import('../platform/accounts.ts');
  const { soHocVien, chipHocVien } = await import('../worklist/hvCuaToi.ts');
  const { danhSachHocVienLop } = await import('../classes/hocVienLop.ts');
  const { choBuocTiep } = await import('../loTrinh/buocTiep.ts');
  const { bangGvChiNhanh } = await import('../giaoVien/hoSo.ts');
  const { demoToday } = await import('../demoConfig.ts');
  const { tongQuanMt } = await import('../worklist/tongQuanMt.ts');
  const { myWork } = await import('../worklist/mywork.ts');
  const { highlights } = await import('../worklist/highlights.ts');
  const { danhSachLop } = await import('../keHoach/keHoachTest.ts');
  const { demPhamVi, khopLocNhanh } = await import('../../../shared/domain/index.ts');
  const { xoaNho } = await import('../platform/nguCanhRequest.ts');
  console.log('\nPR-OV10c · Tổng quan theo vai: Admin Mock Test · TVV Học viên của tôi · CX Số liệu');

  const all = (sql: string, ...a: unknown[]) => conn.prepare(sql).all(...a) as any[];
  const one = (sql: string, ...a: unknown[]) => conn.prepare(sql).get(...a) as any;
  const loi = (fn: () => unknown): any => { try { fn(); } catch (e) { return e; } return null; };
  const thu = <T>(fn: () => T): T => {
    conn.exec('BEGIN IMMEDIATE');
    try { xoaNho(); return fn(); } finally { conn.exec('ROLLBACK'); xoaNho(); }
  };

  let seq = 0;
  const tao = (roles: { role: string; branches: string[] }[]) => {
    seq += 1;
    return accounts.createAccount(P.admin, { email: `ov10c.${seq}${accounts.EMAIL_SUFFIX}`, password: 'matkhau-ov10c', fullName: `Thử OV10c ${seq}`, roles }).userId as number;
  };
  const idTvv = tao([{ role: 'consultant', branches: ['CP'] }]);
  const idCx = tao([{ role: 'cx', branches: [] }]);
  const cp = one(`SELECT id FROM branches WHERE code = 'CP'`).id as number;
  /* Năm em FT Cẩm Phả đang học, giao cho TVV thử. */
  const em = all(`SELECT DISTINCT s.id FROM students s JOIN enrollments e ON e.student_id = s.id AND e.status = 'active' JOIN classes c ON c.id = e.class_id
      WHERE c.branch_id = ? AND c.is_fast_track = 1 AND s.status = 'active' AND s.archived_at IS NULL ORDER BY s.id LIMIT 5`, cp).map((r) => r.id as number);
  const giao = () => { for (const id of em) conn.prepare('UPDATE students SET consultant_user_id = ? WHERE id = ?').run(idTvv, id); };

  check('OV10c-0 · dữ liệu thử đủ (5 em FT Cẩm Phả)', () => { assert(em.length === 5, `em: ${em.length}`); });

  check('OV10c-1 · TVV: phạm vi "HV của tôi"; Tạm dừng, Thiếu thông tin, Cần chú ý đúng em; Thiếu thông tin = chip của Học viên & Lớp', () => {
    thu(() => {
      giao();
      const tvv = loadPrincipal(idTvv);
      const truoc = soHocVien(tvv);
      assert(truoc.phamVi === 'cua-toi' && truoc.tong === 5, `phạm vi: ${JSON.stringify(truoc)}`);
      /* Một em Tạm dừng; một em có Ý thức hôm nay; một em FT mất Target. */
      conn.prepare(`UPDATE students SET status = 'inactive' WHERE id = ?`).run(em[0]);
      conn.prepare(`UPDATE enrollments SET status = 'paused' WHERE student_id = ? AND status = 'active'`).run(em[0]);
      const lop = one(`SELECT class_id FROM enrollments WHERE student_id = ? AND status = 'active'`, em[1]).class_id;
      conn.prepare(`INSERT INTO violations (student_id, class_id, category, occurred_on, reported_on, reported_by, description, created_at)
        VALUES (?, ?, 'conduct', ?, ?, ?, 'Thử OV10c', datetime('now'))`).run(em[1], lop, demoToday(), demoToday(), P.admin.userId);
      conn.prepare(`UPDATE learning_cycles SET target_score = NULL, khong_cam_ket = 0 WHERE student_id = ? AND status = 'active'`).run(em[2]);
      xoaNho();
      const sau = chipHocVien(tvv);
      assert(sau.ids['tam-dung'].length === 1 && sau.ids['tam-dung'][0] === em[0], `tạm dừng: ${sau.ids['tam-dung']}`);
      assert(sau.ids['can-chu-y'].includes(em[1]), 'em có Ý thức hôm nay phải vào Cần chú ý');
      assert(!sau.ids['can-chu-y'].includes(em[0]) && !sau.ids['sap-thi'].includes(em[0]), 'em Tạm dừng không vào Cần chú ý / Sắp thi');
      const ds = danhSachHocVienLop(tvv, { phamVi: 'cua-toi' });
      assert(sau.ids.thieu_tt.includes(em[2]), 'em FT mất Target phải Thiếu thông tin');
      assert(soHocVien(tvv).dem.thieu_tt === ds.dem.thieu_tt, `Thiếu thông tin ${soHocVien(tvv).dem.thieu_tt} ≠ chip ${ds.dem.thieu_tt}`);
    });
  });

  check('OV10c-2 · Chờ QL chọn bước tiếp = cùng tập việc QL (`choBuocTiep`), chỉ em trong phạm vi', () => {
    const cx = loadPrincipal(idCx);
    const r = chipHocVien(cx);
    const tap = new Set(choBuocTiep().map((c: any) => c.student_id));
    assert(r.ids['cho-buoc-tiep'].every((id) => tap.has(id)), 'em ngoài tập việc QL');
    assert(r.ids['cho-buoc-tiep'].every((id) => r.ids['can-chu-y'].includes(id)), 'Chờ bước tiếp cũng là Cần chú ý');
    assert(r.ids['cho-buoc-tiep'].length === tap.size, `CX mọi chi nhánh phải thấy đủ ${tap.size}: ${r.ids['cho-buoc-tiep'].length}`);
  });

  check('OV10c-3 · CX: mọi chi nhánh; chọn chi nhánh thì chỉ chi nhánh đó; Thiếu thông tin = chip Học viên & Lớp cùng phạm vi', () => {
    const cx = loadPrincipal(idCx);
    const tatCa = soHocVien(cx);
    assert(tatCa.phamVi === 'tat-ca', `phạm vi: ${tatCa.phamVi}`);
    const soEm = one(`SELECT COUNT(*) n FROM students WHERE archived_at IS NULL`).n;
    assert(tatCa.tong === soEm, `CX phải thấy mọi em chưa lưu trữ: ${tatCa.tong} / ${soEm}`);
    assert(tatCa.dem.thieu_tt === danhSachHocVienLop(cx, { phamVi: 'tat-ca' }).dem.thieu_tt, 'Thiếu thông tin ≠ chip (tất cả)');
    const motCn = soHocVien(cx, { branchId: cp });
    assert(motCn.phamVi === 'chi-nhanh' && motCn.tong > 0 && motCn.tong < tatCa.tong, `một chi nhánh: ${JSON.stringify(motCn)}`);
    assert(motCn.dem.thieu_tt === danhSachHocVienLop(cx, { phamVi: 'chi-nhanh', branchId: cp }).dem.thieu_tt, 'Thiếu thông tin ≠ chip (CP)');
  });

  check('OV10c-4 · CX không nhận số theo giáo viên: bảng "Theo giáo viên" vẫn 403', () => {
    const e = loi(() => bangGvChiNhanh(loadPrincipal(idCx), { cn: cp, ct: null }));
    assert(e?.status === 403, `CX /giao-vien: ${e?.status ?? 'không lỗi'}`);
  });

  // ------------------------------------------------------------------ Admin "Mock Test" (Móng Bình: demo có MT tuần này, ô quá hạn, đề nghị dời)
  const idAdmin = tao([{ role: 'office_admin', branches: ['MB'] }]);
  const mb = one(`SELECT id FROM branches WHERE code = 'MB'`).id as number;
  const KHOA_MT = ['tuan', 'luotTuanNay', 'oChuaNhap', 'chuaXepLich', 'gvQuaHan'].sort().join();

  check('OV10c-5 · Admin: ba số bằng số ở màn ô đó mở (Kế hoạch Test tuần này · Công việc Chấm điểm · Kế hoạch Test; UI-TONG-QUAN bỏ Đề nghị dời); không khối Case / PA', () => {
    const ad = loadPrincipal(idAdmin);
    const r = tongQuanMt(ad, { branchId: mb });
    assert(Object.keys(r).sort().join() === KHOA_MT, `khoá lạ: ${Object.keys(r)}`);
    const today = demoToday();
    const tuan = highlights(ad, { branchId: mb, program: 'ft' }).weeks[0];
    assert(r.tuan === tuan.weekStart && r.luotTuanNay.so === tuan.ft.mockStudents && r.luotTuanNay.soLop === tuan.ft.mockClasses.length, 'Lượt MT ≠ Kế hoạch Test');
    const w = myWork(ad, { branchId: mb, nguoi: 'tat-ca' }) as any;
    assert(w.dong.every((d: any) => d.group === 'score'), 'Admin chỉ có Chấm điểm');
    assert(r.oChuaNhap.so === demPhamVi(w.dong, true).so, `Ô chưa nhập ${r.oChuaNhap.so} ≠ Công việc`);
    /* OV-11c (TE-4): lọc Quá hạn chỉ đếm bài quá hạn (việc con khớp lọc). */
    assert(r.oChuaNhap.quaHan === demPhamVi(w.dong.filter((d: any) => khopLocNhanh(d, 'qua-han', today)), true, { loc: 'qua-han', homNay: today }).so, 'Quá hạn ≠ Công việc lọc Quá hạn');
    const kh = danhSachLop(ad, { branchId: mb });
    assert(r.chuaXepLich === kh.lop.filter((l: any) => l.loai === 'ft').reduce((n: number, l: any) => n + l.chuaCoLichTiep, 0), 'Chưa xếp lịch ≠ Kế hoạch Test');
  });

  check('OV10c-6 · GV chấm quá hạn: đúng dòng Chấm điểm quá hạn có người của Công việc + MỘT dòng "Chưa có GV"; Σ bài = số quá hạn (SUA-CHAM-LAI L9)', () => {
    const ad = loadPrincipal(idAdmin);
    for (const cn of [mb, null]) {
      const r = tongQuanMt(ad, { branchId: cn });
      const w = myWork(ad, { branchId: cn, nguoi: 'tat-ca' }) as any;
      const qh = w.items.filter((it: any) => it.group === 'score' && it.urgency === 'overdue');
      const mong = qh.filter((it: any) => it.ownerId !== null);
      const khong = qh.filter((it: any) => it.ownerId === null).reduce((n: number, it: any) => n + it.soBai, 0);
      const coGv = r.gvQuaHan.filter((g) => g.ownerId > 0);
      assert(coGv.length === mong.length, `số dòng ${coGv.length} ≠ ${mong.length}`);
      for (const g of coGv) {
        const it = mong.find((x: any) => x.key === g.key && x.ownerId === g.ownerId);
        assert(it && g.gv && g.soBai === it.soBai && g.han === it.due && g.kyNang === it.reason, `dòng lệch: ${JSON.stringify(g)}`);
      }
      /* P12 Q12: dòng S chấm chéo "chờ chấm" (`choCham`) nằm ngoài Σ quá hạn — PBC-6. */
      const qh2 = r.gvQuaHan.filter((g) => !g.choCham);
      const cg = qh2.filter((g) => g.ownerId === 0);
      assert(khong ? cg.length === 1 && cg[0].soBai === khong && cg[0] === qh2.at(-1) : cg.length === 0, `dòng Chưa có GV: ${JSON.stringify(cg)} ≠ ${khong} bài`);
      const tong = qh2.reduce((n, g) => n + g.soBai, 0);
      assert(tong === r.oChuaNhap.quaHan, `cn ${cn}: Σ bảng ${tong} ≠ ô "${r.oChuaNhap.quaHan} quá hạn"`);
    }
  });

  check('OV10c-8 · Khối Mock Test chỉ Admin: QL, TVV, CX gọi → 403 (QL giữ Tổng quan cũ)', () => {
    for (const p of [P.cpManager, loadPrincipal(idTvv), loadPrincipal(idCx)]) {
      assert(loi(() => tongQuanMt(p, {}))?.status === 403, `vai ${p.roleKeys} không được nhận khối Mock Test`);
    }
  });
}
