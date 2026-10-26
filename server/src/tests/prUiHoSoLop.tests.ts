/**
 * PHÉP KIỂM UI-HO-SO-LOP (V5 `08` mục 6 + 6c, C17, C19, T12):
 *   (1) `/classes/:id/viec-theo-em` trả thêm `cuaToi` = việc CỦA NGƯỜI XEM ở lớp (thanh Việc cần làm) — cùng nguồn /my-work, gồm việc cấp lớp;
 *   (2) `/roster` không còn `viecTiepTheo` (gỡ `viecTiepCuaEm` khỏi bảng lớp — việc của em đọc viec-theo-em);
 *   (3) Đánh giá đầu ra (C17): GVCN / QL lớp thường ghi nhận xét + đề xuất bước tiếp, có lịch sử; người khác 403; dữ liệu sai 400; lớp FT 400;
 *   (4) migrate bảng `danh_gia_dau_ra` chạy lặp không đổi.
 */
export async function runPrUiHoSoLopTests(t: any) {
  const { check, assert, conn, P, classId } = t;
  const classes: any = await import('../classes/classes.ts');
  const { tuanVangCu } = await import('../fasttrack/attempts.ts');
  const { viecTheoEmCuaLop, viecTiepTheoCuaLop } = await import('../classes/viecTheoEm.ts');
  const { ghiDanhGiaDauRa, xemDanhGiaDauRa } = await import('../classes/danhGiaDauRa.ts');
  const { migratePrUiHoSoLop } = await import('../migrate/prUiHoSoLop.ts');
  const mywork: any = await import('../worklist/mywork.ts');
  const { phamViXemViec } = await import('../worklist/xemViec.ts');
  const { loadPrincipal } = await import('../permissions.ts');
  const { xoaNho } = await import('../platform/nguCanhRequest.ts');
  console.log('\nUI-HO-SO-LOP · Việc cần làm của người xem · roster bỏ viecTiepTheo · Đánh giá đầu ra (C17)');
  const maLoi = (fn: () => unknown): number | string => { try { fn(); return 'không ném'; } catch (e: any) { return e?.status ?? String(e?.message ?? e); } };
  const LOP = classId('MB FT 101');
  const cn = conn.prepare('SELECT branch_id FROM classes WHERE id = ?').get(LOP).branch_id;
  const emLop = new Set((conn.prepare(`SELECT student_id FROM enrollments WHERE class_id = ? AND status = 'active'`).all(LOP) as any[]).map((r) => r.student_id));

  check('HSL-1 (thanh Việc cần làm) · cuaToi = việc của chính người xem ở lớp (em của lớp + việc cấp lớp), đúng tập /my-work, không việc người khác', () => {
    for (const p of [P.coreTeacher, P.w1Teacher, P.mbManager]) {
      const { cuaToi, theoEm } = viecTheoEmCuaLop(p, LOP);
      const goc = mywork.myWork(p, phamViXemViec(p) ? { branchId: cn, nguoi: 'tat-ca' } : { branchId: cn }).items
        .filter((it: any) => it.mine && ((it.studentId !== null && emLop.has(it.studentId) && (it.classId === null || it.classId === LOP)) || (it.studentId === null && it.classId === LOP)));
      assert(JSON.stringify(cuaToi.map((v: any) => v.key).sort()) === JSON.stringify(goc.map((it: any) => it.key).sort()), `${p.fullName}: cuaToi khác /my-work`);
      assert(cuaToi.every((v: any) => v.mine && !('con' in v)), `${p.fullName}: có việc không phải của tôi`);
      const cuaEm = Object.values(theoEm).flat().filter((v: any) => v.mine).map((v: any) => v.key);
      assert(cuaEm.every((k) => cuaToi.some((v: any) => v.key === k)), `${p.fullName}: việc của tôi ở cột em thiếu trên thanh`);
    }
    assert(viecTheoEmCuaLop(P.coreTeacher, LOP).cuaToi.length > 0, 'seed: GVCN MB FT 101 cần có việc ở lớp');
  });

  check('HSL-2b · Học viên & Lớp: ?kieu=tiep = việc tiếp theo cùng hàm badge lớp — số em có việc đỏ = soEmQuaHan của hồ sơ lớp; ngoài phạm vi 403', () => {
    for (const p of [P.admin, P.coreTeacher, P.mbManager]) {
      const v = viecTiepTheoCuaLop(p, LOP).viecTiep;
      const doEm = Object.values(v).filter((ds: any) => ds.some((x: any) => x.tone === 'danger')).length;
      assert(doEm === classes.classOverview(p, LOP).soEmQuaHan, `${p.fullName}: ${doEm} ≠ soEmQuaHan`);
      assert(Object.keys(v).every((id) => emLop.has(Number(id))), 'em ngoài lớp');
    }
    assert(Object.values(viecTiepTheoCuaLop(P.admin, LOP).viecTiep).some((ds: any) => ds.length > 0), 'seed: phải có em có việc');
    assert(maLoi(() => viecTiepTheoCuaLop(P.cpManager, LOP)) === 403, 'QL CP → 403');
  });

  check('HSL-2c (LUAT-NX-MT) · /roster: mỗi mốc FT mang tuần cũ của kỹ năng dời do vắng (= tuanVangCu) — ô bảng lớp ghi "vắng W3 SEP"', () => {
    let co = 0;
    for (const code of ['MB FT 101']) {
      const lop = classId(code);
      for (const r of classes.classRoster(P.admin, lop) as any[]) for (const h of r.history) {
        const mong = Object.fromEntries([...tuanVangCu([h.id])].map(([k, v]) => [k.split(':')[1], v]));
        assert(JSON.stringify(h.vangCu ?? {}) === JSON.stringify(mong), `${r.fullName} · ${h.label}: ${JSON.stringify(h.vangCu)} ≠ ${JSON.stringify(mong)}`);
        if (h.vangCu) co++;
      }
    }
    assert(classes.classRoster(P.admin, classId('MB FOU 12')).every((r: any) => r.history.every((h: any) => !h.vangCu)), 'lớp thường không có');
    console.log(`    (${co} mốc có kỹ năng dời do vắng)`);
  });

  check('HSL-2 · /roster không còn viecTiepTheo (bảng lớp FT + lớp thường)', () => {
    for (const code of ['MB FT 101', 'MB FOU 12']) {
      const rows = classes.classRoster(P.admin, classId(code)) as any[];
      assert(rows.length > 0 && rows.every((r) => !('viecTiepTheo' in r)), `${code}: còn viecTiepTheo`);
    }
  });

  const FOU = classId('MB FOU 12');
  const gvcnFou = (conn.prepare(`SELECT user_id FROM teacher_assignments WHERE class_id = ? AND is_core = 1 AND status = 'active' LIMIT 1`).get(FOU) as any).user_id as number;
  const emFou = (conn.prepare(`SELECT student_id FROM enrollments WHERE class_id = ? AND status = 'active' ORDER BY student_id LIMIT 1`).get(FOU) as any).student_id as number;
  const gvbmFou = (conn.prepare(`SELECT user_id FROM teacher_assignments WHERE class_id = ? AND is_core = 0 AND status = 'active' AND user_id != ? LIMIT 1`).get(FOU, gvcnFou) as any)?.user_id as number | undefined;

  check('HSL-3 (C17, T12) · Đánh giá đầu ra: GVCN ghi nhận xét (P9b: không đề xuất), đọc lại đúng, lịch sử mỗi lần đổi (lưu nguyên giá trị không thêm mục)', () => {
    conn.exec('BEGIN IMMEDIATE');
    try {
      xoaNho();
      const gv = loadPrincipal(gvcnFou);
      assert(xemDanhGiaDauRa(gv, FOU).coTheGhi, 'GVCN phải ghi được');
      /* P9b N22 ①: GVCN chỉ ghi Nhận xét — gửi đề xuất hướng → 403; đề xuất cũ trong DB giữ để đọc. */
      assert(maLoi(() => ghiDanhGiaDauRa(gv, FOU, emFou, { nhanXet: 'x', deXuat: 'len_lop' })) === 403, 'GVCN không còn đề xuất hướng');
      conn.prepare(`INSERT INTO danh_gia_dau_ra (student_id, class_id, nhan_xet, de_xuat, sua_boi, sua_luc) VALUES (?,?,NULL,'len_lop',?,'2026-01-01T00:00:00.000Z')`).run(emFou, FOU, gvcnFou);
      const cu = xemDanhGiaDauRa(P.mbManager, FOU).rows.find((r: any) => r.studentId === emFou)!;
      ghiDanhGiaDauRa(gv, FOU, emFou, { nhanXet: '  Đọc hiểu tiến bộ rõ.  ', luc: cu.luc });
      ghiDanhGiaDauRa(gv, FOU, emFou, { nhanXet: 'Đọc hiểu tiến bộ rõ.' });   // không đổi
      ghiDanhGiaDauRa(gv, FOU, emFou, { nhanXet: 'Đọc hiểu tiến bộ rõ; cần luyện viết.' });
      const d = xemDanhGiaDauRa(P.mbManager, FOU).rows.find((r: any) => r.studentId === emFou)!;
      assert(d.nhanXet === 'Đọc hiểu tiến bộ rõ; cần luyện viết.' && d.deXuat === 'len_lop' && !!d.boi && !!d.luc, JSON.stringify(d));
      assert(d.lichSu.length === 2 && d.lichSu[0].nhanXet === 'Đọc hiểu tiến bộ rõ; cần luyện viết.' && d.lichSu[1].nhanXet === 'Đọc hiểu tiến bộ rõ.', `lịch sử: ${JSON.stringify(d.lichSu)}`);
      /* T15: hai người cùng mở bản d.luc — người sau gửi bản cũ → 409, không đè im lặng; gửi lại với bản mới → ghi đè có chủ ý. */
      const moi = ghiDanhGiaDauRa(P.mbManager, FOU, emFou, { nhanXet: 'QL sửa', luc: d.luc });
      assert(moi.luc && moi.luc !== d.luc, 'phải trả luc mới');
      let e409: any = null;
      try { ghiDanhGiaDauRa(gv, FOU, emFou, { nhanXet: 'GVCN đè', luc: d.luc }); } catch (e) { e409 = e; }
      assert(e409?.status === 409 && e409.details?.luc === moi.luc && /Đã có người sửa lúc/.test(e409.message), `409: ${e409?.status} ${e409?.message}`);
      assert(xemDanhGiaDauRa(P.mbManager, FOU).rows.find((r: any) => r.studentId === emFou)!.nhanXet === 'QL sửa', 'bản QL giữ nguyên sau 409');
      ghiDanhGiaDauRa(gv, FOU, emFou, { nhanXet: 'GVCN đè', luc: moi.luc });
      assert(xemDanhGiaDauRa(gv, FOU).rows.find((r: any) => r.studentId === emFou)!.nhanXet === 'GVCN đè', 'ghi đè có chủ ý');
      let e2: any = null;
      try { ghiDanhGiaDauRa(gv, FOU, (conn.prepare(`SELECT student_id FROM enrollments WHERE class_id = ? AND status = 'active' ORDER BY student_id LIMIT 1 OFFSET 1`).get(FOU) as any).student_id, { nhanXet: 'x', luc: '2026-01-01T00:00:00Z' }); } catch (e) { e2 = e; }
      assert(e2?.status === 409, 'em chưa có bản mà gửi luc → 409');
      ghiDanhGiaDauRa(P.mbManager, FOU, emFou, { nhanXet: null });   // QL của lớp cũng ghi được, xoá được
      assert(xemDanhGiaDauRa(P.mbManager, FOU).rows.find((r: any) => r.studentId === emFou)!.nhanXet === null, 'QL xoá nhận xét');
    } finally { conn.exec('ROLLBACK'); xoaNho(); }
  });

  check('HSL-4 (quyền, dữ liệu) · GVBM không GVCN → 403; QL chi nhánh khác → 403 (đọc + ghi); đề xuất → 403 / nhận xét > 2000 → 400; lớp FT → 400; em không học lớp → 400', () => {
    if (gvbmFou) assert(maLoi(() => ghiDanhGiaDauRa(loadPrincipal(gvbmFou), FOU, emFou, { nhanXet: 'x' })) === 403, 'GVBM ghi được');
    assert(maLoi(() => xemDanhGiaDauRa(P.cpManager, FOU)) === 403, 'QL CP đọc được');
    assert(maLoi(() => ghiDanhGiaDauRa(P.cpManager, FOU, emFou, { nhanXet: 'x' })) === 403, 'QL CP ghi được');
    const gv = loadPrincipal(gvcnFou);
    assert(maLoi(() => ghiDanhGiaDauRa(gv, FOU, emFou, { deXuat: 'len_troi' })) === 403, 'đề xuất (mọi giá trị) → 403');   // P9b N22
    assert(maLoi(() => ghiDanhGiaDauRa(gv, FOU, emFou, { nhanXet: 'a'.repeat(2001) })) === 400, 'nhận xét quá dài');
    assert(maLoi(() => ghiDanhGiaDauRa(gv, FOU, emFou, { nhanXet: 5 })) === 400, 'nhận xét không phải chữ');
    assert(maLoi(() => xemDanhGiaDauRa(P.admin, LOP)) === 400, 'lớp FT có Đánh giá đầu ra');
    const emKhac = [...emLop][0];
    assert(maLoi(() => ghiDanhGiaDauRa(P.admin, FOU, emKhac, { nhanXet: 'x' })) === 400, 'em lớp khác');
  });

  check('HSL-5 · migrate danh_gia_dau_ra chạy lặp không làm gì (DB đã có bảng)', () => {
    const a: string[] = []; migratePrUiHoSoLop(conn, a);
    assert(a.length === 0, JSON.stringify(a));
  });
}
