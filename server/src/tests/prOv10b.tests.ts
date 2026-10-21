/**
 * PHÉP KIỂM PR-OV10b — Liên hệ (SĐT em + phụ huynh; chủ SP 13/10: mọi vai xem, không bắt nhập, chỉ nhập ở hồ sơ HV + Sửa cả lớp, GV không thấy ô nhập)
 * và Học viên & Lớp / hồ sơ theo vai TVV · CX (chip = `chipHocVien` của OV-10c, một nguồn).
 */
import type { YThucTestKit } from './yThuc.tests.ts';

export async function runPrOv10bTests(t: YThucTestKit) {
  const { check, assert, conn, P } = t;
  const { loadPrincipal } = await import('../permissions.ts');
  const accounts: any = await import('../platform/accounts.ts');
  const students: any = await import('../students/students.ts');
  const profile: any = await import('../students/profile.ts');
  const intake: any = await import('../classes/intake.ts');
  const suaCaLop: any = await import('../classes/suaCaLop.ts');
  const theoVai: any = await import('../classes/hocVienTheoVai.ts');
  const { chipHocVien, CHIP_HOC_VIEN } = await import('../worklist/hvCuaToi.ts');
  const { migratePrOv10b } = await import('../migrate/prOv10b.ts');
  const dm: any = await import('../../../shared/domain/index.ts');
  const { xoaNho } = await import('../platform/nguCanhRequest.ts');
  console.log('\nPR-OV10b · Liên hệ (SĐT em, phụ huynh) + Học viên & Lớp / hồ sơ theo vai TVV · CX');

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
    return accounts.createAccount(P.admin, { email: `ov10b.${seq}${accounts.EMAIL_SUFFIX}`, password: 'matkhau-ov10b', fullName: `Thử OV10b ${seq}`, roles }).userId as number;
  };
  const idTvv = tao([{ role: 'consultant', branches: ['MB'] }]);
  const idCx = tao([{ role: 'cx', branches: [] }]);
  const idAdmin = tao([{ role: 'office_admin', branches: ['MB'] }]);
  const mb = one(`SELECT id FROM branches WHERE code = 'MB'`).id as number;
  const lop = one(`SELECT id FROM classes WHERE code = 'MB FT 101'`).id as number;
  /* Em chỉ một lớp đang học / giữ chỗ (các phép kiểm trước có thể để lại em nhiều dòng lớp). */
  const em = all(`SELECT s.id FROM students s JOIN enrollments e ON e.student_id = s.id AND e.status = 'active'
      WHERE e.class_id = ? AND s.status = 'active' AND s.archived_at IS NULL
        AND (SELECT COUNT(*) FROM enrollments x WHERE x.student_id = s.id AND x.status IN ('active', 'paused')) = 1 ORDER BY s.id LIMIT 4`, lop).map((r) => r.id as number);
  /* GVCN / GVBM HIỆN TẠI của lớp (phân công có thể đã đổi ở các phép kiểm trước — không dùng `P.coreTeacher` chụp lúc đầu). */
  const gvcn = one(`SELECT user_id id FROM teacher_assignments WHERE class_id = ? AND is_core = 1 AND status = 'active' ORDER BY id LIMIT 1`, lop)?.id;
  const gvbm = one(`SELECT user_id id FROM teacher_assignments WHERE class_id = ? AND skill IS NOT NULL AND status = 'active'
      AND user_id NOT IN (SELECT user_id FROM teacher_assignments WHERE class_id = ? AND is_core = 1 AND status = 'active') ORDER BY id LIMIT 1`, lop, lop)?.id;
  const vai = () => ({
    TVV: loadPrincipal(idTvv), CX: loadPrincipal(idCx), ADMIN: loadPrincipal(idAdmin), QL: P.mbManager, QT: P.admin,
    GVCN: loadPrincipal(gvcn), GVBM: loadPrincipal(gvbm),
  });
  const hs = (id: number) => one('SELECT * FROM students WHERE id = ?', id);
  const LH = { phone: '0901 234 567', parentName: 'Phạm Văn Long', parentRelation: 'Bố', parentPhone: '+84 912.345-678' };

  check('OV10b-0 · dữ liệu thử đủ (MB FT 101, 4 em, TVV / CX / Admin)', () => {
    assert(em.length === 4 && idTvv && idCx && idAdmin && gvcn && gvbm, `em ${em.length} gvcn ${gvcn} gvbm ${gvbm}`);
  });

  check('OV10b-1 · migrate prOv10b: đủ 4 cột ở students; chạy lại không làm gì', () => {
    const cot = all(`SELECT name FROM pragma_table_info('students')`).map((c) => c.name);
    for (const c of ['phone', 'parent_name', 'parent_relation', 'parent_phone']) assert(cot.includes(c), `thiếu cột ${c}`);
    const applied: string[] = [];
    migratePrOv10b(conn, applied);
    migratePrOv10b(conn, applied);
    assert(applied.length === 0, `chạy lại vẫn ghi: ${applied}`);
  });

  check('OV10b-2 · TVV / CX / QL / Admin lưu liên hệ ở hồ sơ HV → đọc lại đúng; nhật ký trước → sau', () => {
    for (const k of ['TVV', 'CX', 'QL', 'ADMIN'] as const) {
      thu(() => {
        const v = vai()[k];
        const phCu = one('SELECT parent_phone FROM students WHERE id = ?', em[0]).parent_phone;   // SEED-UX: seed đã có SĐT phụ huynh
        students.updateStudent(v, em[0], LH);
        const p = profile.studentProfile(v, em[0]);
        assert(JSON.stringify(p.lienHe) === JSON.stringify(LH), `${k} đọc lại: ${JSON.stringify(p.lienHe)}`);
        const nk = one(`SELECT before_json, after_json FROM audit_logs WHERE entity_type = 'student' AND entity_id = ? AND action = 'student.update' ORDER BY id DESC LIMIT 1`, em[0]);
        const truoc = JSON.parse(nk.before_json); const sau = JSON.parse(nk.after_json);
        assert(truoc.parent_phone === phCu && sau.parent_phone === LH.parentPhone && sau.phone === LH.phone, `${k} nhật ký: ${nk.after_json}`);
      });
    }
  });

  check('OV10b-3 · kiểm ở máy chủ: SĐT sai → 400 câu rõ (không lặp lại số); tên > 100 → 400; trống = xoá', () => {
    thu(() => {
      const v = vai().TVV;
      for (const sai of ['abc12345', '1234567', '12345678901234567', '0912 345 678 ext 9', '0912345678#', `0${'.'.repeat(40)}912345678`]) {
        const e = loi(() => students.updateStudent(v, em[0], { phone: sai }));
        assert(e?.status === 400 && /SĐT em/.test(e.message) && !e.message.includes(sai), `"${sai}": ${e?.status} ${e?.message}`);
      }
      const ePh = loi(() => students.updateStudent(v, em[0], { parentPhone: '09-12' }));
      assert(ePh?.status === 400 && /SĐT phụ huynh/.test(ePh.message), `PH: ${ePh?.message}`);
      assert(loi(() => students.updateStudent(v, em[0], { parentName: 'x'.repeat(101) }))?.status === 400, 'tên 101 ký tự phải 400');
      assert(loi(() => students.updateStudent(v, em[0], { parentRelation: { a: 1 } }))?.status === 400, 'quan hệ không phải chữ phải 400');
      students.updateStudent(v, em[0], LH);
      students.updateStudent(v, em[0], { phone: '', parentName: '  ', parentRelation: null, parentPhone: '' });
      const s = hs(em[0]);
      assert(s.phone === null && s.parent_name === null && s.parent_relation === null && s.parent_phone === null, `trống chưa xoá: ${JSON.stringify(s)}`);
    });
  });

  check('OV10b-4 · Sửa cả lớp (QL): đọc + lưu liên hệ; `nhapLienHe` QL có, GVCN không (GV không thấy ô)', () => {
    thu(() => {
      const v = vai();
      const d = suaCaLop.duLieuSuaCaLop(v.QL, lop);
      assert(d.nhapLienHe === true && 'parentPhone' in d.rows[0], `QL: ${d.nhapLienHe} ${Object.keys(d.rows[0])}`);
      assert(suaCaLop.duLieuSuaCaLop(v.GVCN, lop).nhapLienHe === false, 'GVCN không thấy cột liên hệ');
      const sai = suaCaLop.xemTruocSuaCaLop(v.QL, lop, { rows: [{ studentId: em[1], parentPhone: 'abc' }] });
      assert(sai.rows[0].issues.some((i: any) => i.field === 'parentPhone'), `xem trước: ${JSON.stringify(sai.rows)}`);
      suaCaLop.luuSuaCaLop(v.QL, lop, { rows: [{ studentId: em[1], ...LH }, { studentId: em[2], parentName: 'Lê Thị Hoa', parentRelation: 'Mẹ' }] });
      const a = hs(em[1]); const b = hs(em[2]);
      assert(a.phone === LH.phone && a.parent_phone === LH.parentPhone && b.parent_name === 'Lê Thị Hoa' && b.parent_relation === 'Mẹ', `lưu: ${JSON.stringify([a, b])}`);
      const lai = suaCaLop.duLieuSuaCaLop(v.QL, lop).rows.find((r: any) => r.studentId === em[1]);
      assert(lai.parentName === LH.parentName && lai.phone === LH.phone, `đọc lại: ${JSON.stringify(lai)}`);
    });
  });

  check('OV10b-5 · GVCN (có `student.edit_info`) lưu được qua API; ô nhập chỉ hiện cho QL / Quản trị / TVV / CX / Admin', () => {
    thu(() => {
      const v = vai();
      students.updateStudent(v.GVCN, em[0], { parentPhone: '0987 112 334' });
      assert(hs(em[0]).parent_phone === '0987 112 334', 'GVCN lưu qua API');
      for (const k of ['TVV', 'CX', 'QL', 'QT', 'ADMIN'] as const) assert(profile.studentProfile(v[k], em[0]).viewer.nhapLienHe === true, `${k} phải thấy ô nhập`);
      for (const k of ['GVCN', 'GVBM'] as const) assert(profile.studentProfile(v[k], em[0]).viewer.nhapLienHe === false, `${k} không thấy ô nhập`);
    });
  });

  check('OV10b-6 · Thêm HV / dán Excel không nhận trường liên hệ', () => {
    thu(() => {
      intake.commitIntake(P.mbManager, { classId: lop, rows: [{ fullName: 'OV10b Thêm Mới', dob: '2010-03-12', ...LH }] });
      const s = one(`SELECT * FROM students WHERE full_name = 'OV10b Thêm Mới'`);
      assert(s && s.phone === null && s.parent_name === null && s.parent_phone === null, `Thêm HV ghi liên hệ: ${JSON.stringify(s)}`);
      const dan = intake.parsePaste('Họ và tên\tNgày sinh\tSĐT phụ huynh\nOV10b Dán\t12/03/2010\t0912345678', { classId: lop });
      assert(!dan.rows.some((r: any) => 'parentPhone' in r || 'phone' in r), `dán Excel đọc cột liên hệ: ${JSON.stringify(dan.rows)}`);
    });
  });

  check('OV10b-7 · em thiếu liên hệ KHÔNG vào "Thiếu thông tin"', () => {
    thu(() => {
      const v = vai().QL;
      const truoc = profile.studentProfile(v, em[0]).missing.length;
      students.updateStudent(v, em[0], { phone: '', parentName: '', parentRelation: '', parentPhone: '' });
      assert(profile.studentProfile(v, em[0]).missing.length === truoc, 'liên hệ trống làm đổi Thiếu thông tin');
      assert(!JSON.stringify(profile.studentProfile(v, em[0]).missing).match(/SĐT|phụ huynh|liên hệ/i), 'Thiếu thông tin nhắc liên hệ');
    });
  });

  check('OV10b-8 · mọi vai đọc được liên hệ ở hồ sơ HV (chỉ đọc), cùng một giá trị', () => {
    thu(() => {
      const v = vai();
      students.updateStudent(v.QL, em[0], LH);
      for (const k of ['TVV', 'CX', 'QL', 'QT', 'ADMIN', 'GVCN', 'GVBM'] as const) {
        assert(JSON.stringify(profile.studentProfile(v[k], em[0]).lienHe) === JSON.stringify(LH), `${k} không đọc được liên hệ`);
      }
    });
  });

  check('OV10b-9 · TVV › Học viên & Lớp: "HV của tôi" mặc định; chip = `chipHocVien` (một nguồn); dòng đủ cột; em Tạm dừng vẫn có dòng', () => {
    thu(() => {
      for (const id of em) conn.prepare('UPDATE students SET consultant_user_id = ? WHERE id = ?').run(idTvv, id);
      students.updateStudent(P.mbManager, em[1], LH);
      conn.prepare(`UPDATE students SET status = 'inactive' WHERE id = ?`).run(em[3]);
      conn.prepare(`UPDATE enrollments SET status = 'paused' WHERE student_id = ? AND status = 'active'`).run(em[3]);
      xoaNho();
      const tvv = loadPrincipal(idTvv);
      const r = theoVai.hocVienTheoVai(tvv, {});
      assert(r.vai === 'tvv' && r.phamVi.dangDung === 'cua-toi' && r.phamVi.coThe.includes('chi-nhanh'), `phạm vi: ${JSON.stringify(r.phamVi)}`);
      const goc = chipHocVien(tvv);
      for (const k of CHIP_HOC_VIEN) assert(JSON.stringify([...r.ids[k]].sort()) === JSON.stringify([...goc.ids[k]].sort()), `chip ${k} ≠ chipHocVien`);
      assert(r.rows.length === goc.tong && r.rows.every((d: any) => em.includes(d.id)), `dòng: ${r.rows.map((d: any) => d.id)}`);
      const d1 = r.rows.find((d: any) => d.id === em[1]);
      assert(d1.lop?.id === lop && d1.lop.code === 'MB FT 101' && 'standing' in d1 && 'duKienThi' in d1 && 'target' in d1, `cột: ${JSON.stringify(d1)}`);
      assert(d1.lienHe.parentPhone === LH.parentPhone && d1.viewer.suaThongTin && d1.viewer.suaThem, `phụ huynh / quyền: ${JSON.stringify(d1)}`);
      const d3 = r.rows.find((d: any) => d.id === em[3]);
      assert(d3?.status === 'inactive' && d3.lop?.id === lop && r.ids['tam-dung'].includes(em[3]), `em Tạm dừng: ${JSON.stringify(d3)}`);
      /* Cả chi nhánh: chip của cả chi nhánh (cùng hàm, phạm vi chi nhánh). */
      const cn = theoVai.hocVienTheoVai(tvv, { phamVi: 'chi-nhanh' });
      const gocCn = chipHocVien(tvv, { phamVi: 'chi-nhanh', branchId: mb });
      assert(cn.phamVi.dangDung === 'chi-nhanh' && cn.phamVi.chiNhanh === mb && cn.rows.length === gocCn.tong && gocCn.tong > r.rows.length, `chi nhánh: ${cn.rows.length} / ${gocCn.tong}`);
      assert(JSON.stringify([...cn.ids['can-chu-y']].sort()) === JSON.stringify([...gocCn.ids['can-chu-y']].sort()), 'chip Cần chú ý chi nhánh ≠ chipHocVien');
      assert(chipHocVien(tvv).phamVi === 'cua-toi', 'Tổng quan TVV (không truyền phạm vi) đổi nghĩa');
    });
  });

  check('OV10b-10 · Cần chú ý có lý do đọc được (SOS · Case mới · Ý thức · Chờ QL) cho MỌI em trong chip; em khác không có', () => {
    const cx = loadPrincipal(idCx);
    const r = theoVai.hocVienTheoVai(cx, {});
    const chuY = new Set(r.ids['can-chu-y']);
    assert(chuY.size > 0, 'demo phải có em Cần chú ý');
    for (const d of r.rows) {
      const co = !!d.chuY && (!!d.chuY.sos || !!d.chuY.caseMoi?.length || !!d.chuY.yThuc || !!d.chuY.choBuocTiep);
      assert(co === chuY.has(d.id), `em ${d.id}: chip ${chuY.has(d.id)} lý do ${JSON.stringify(d.chuY)}`);
    }
  });

  check('OV10b-11 · CX: mọi chi nhánh, mặc định chip "Cần chú ý"; có Chi nhánh + TVV; chọn chi nhánh thì chỉ chi nhánh đó', () => {
    const cx = loadPrincipal(idCx);
    const r = theoVai.hocVienTheoVai(cx, {});
    assert(r.vai === 'cx' && r.phamVi.dangDung === 'tat-ca', `phạm vi: ${JSON.stringify(r.phamVi)}`);
    assert(dm.chipMacDinhVai('cx') === 'can-chu-y' && dm.chipMacDinhVai('tvv') === 'tat-ca', 'chip mặc định');
    assert(new Set(r.rows.map((d: any) => d.chiNhanh)).size > 1, 'CX phải thấy nhiều chi nhánh');
    assert(r.rows.length === chipHocVien(cx).tong && r.rows.every((d: any) => 'tvv' in d), 'CX: dòng / cột TVV');
    const motCn = theoVai.hocVienTheoVai(cx, { branchId: mb });
    assert(motCn.phamVi.dangDung === 'chi-nhanh' && motCn.rows.length === chipHocVien(cx, { branchId: mb }).tong, `một chi nhánh: ${motCn.rows.length}`);
  });

  check('OV10b-12 · QL / GV không dùng danh sách theo vai (bảng không đổi) — 403', () => {
    const v = vai();
    for (const k of ['QL', 'GVCN', 'GVBM', 'ADMIN'] as const) assert(loi(() => theoVai.hocVienTheoVai(v[k], {}))?.status === 403, `${k} phải 403`);
    assert(dm.vaiXemHocVien(['manager']) === null && dm.vaiXemHocVien(['teacher']) === null && dm.vaiXemHocVien(['consultant']) === 'tvv'
      && dm.vaiXemHocVien(['cx']) === 'cx' && dm.vaiXemHocVien(['office_admin']) === 'admin' && dm.vaiXemHocVien(['manager', 'consultant']) === null, 'vaiXemHocVien');
  });

  check('OV10b-14 · ⋯ dòng theo vai = mục ⋯ hồ sơ HV của vai (Sửa thông tin · Tạm dừng / Thôi học · Quay lại · Kết quả thi thật chỉ FT)', () => {
    const k = (i: any) => dm.mucDongTheoVai(i).map((m: any) => m.key).join();
    assert(k({ suaThongTin: true, suaThem: true, ft: true, status: 'active' }) === 'info,tam-dung-thoi-hoc,outcome', `TVV FT: ${k({ suaThongTin: true, suaThem: true, ft: true, status: 'active' })}`);
    assert(k({ suaThongTin: true, suaThem: true, ft: false, status: 'active' }) === 'info,tam-dung-thoi-hoc', 'TVV lớp thường: không Kết quả thi thật');
    assert(k({ suaThongTin: true, suaThem: true, ft: true, status: 'inactive' }) === 'info,tam-dung-thoi-hoc,outcome,quay-lai', 'em Tạm dừng: Thôi học + Quay lại');
    assert(k({ suaThongTin: true, suaThem: false, ft: true, status: 'active' }) === 'info', 'Admin: chỉ Sửa thông tin');
  });

  check('OV10b-13 · khối Đang xử lý (TVV): việc của người khác, không có việc của TVV; việc đã xong không hiện', () => {
    thu(() => {
      const c = one(`SELECT sc.id, sc.student_id FROM sos_cases sc JOIN students s ON s.id = sc.student_id JOIN enrollments e ON e.student_id = s.id AND e.status = 'active'
          JOIN classes cl ON cl.id = e.class_id WHERE sc.status != 'done' AND cl.branch_id = ? AND s.status = 'active' ORDER BY sc.id LIMIT 1`, mb);
      assert(c, 'demo MB cần một Case mở');
      const tvv = loadPrincipal(idTvv);
      const v = profile.studentProfile(tvv, c.student_id).dauHoSo.viec;
      assert(v.cuaBan.length === 0 && v.nguoiKhac.some((x: any) => x.caseId === c.id), `Đang xử lý: ${JSON.stringify(v.nguoiKhac.map((x: any) => x.key))}`);
      conn.prepare(`UPDATE sos_cases SET status = 'done' WHERE id = ?`).run(c.id);
      xoaNho();
      const sau = profile.studentProfile(tvv, c.student_id).dauHoSo.viec;
      assert(!sau.nguoiKhac.some((x: any) => x.caseId === c.id), 'Case đã xong vẫn hiện ở Đang xử lý');
    });
  });
}
