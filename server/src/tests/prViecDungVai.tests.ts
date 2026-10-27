/**
 * PHÉP KIỂM P11 VIEC-DUNG-VAI (chủ SP 24/10 mục 6.1, spec R6.1):
 *   (1) hàm gộp `gopViecTheoMon` — mỗi môn một dòng, giữ thứ tự gấp, không mất việc; `monCuaViec` đọc nhãn có sẵn;
 *   (2) `/classes/:id/viec-theo-em`: GV chỉ nhận việc CỦA MÌNH (`mine`); QL nhận đủ việc của lớp, khớp `/my-work` "Tất cả".
 */
export async function runPrViecDungVaiTests(t: any) {
  const { check, assert, conn, P, classId } = t;
  const { gopViecTheoMon, monCuaViec, SO_DONG_VIEC_MAC_DINH } = await import('../../../shared/domain/index.ts');
  const { viecTheoEmCuaLop } = await import('../classes/viecTheoEm.ts');
  const { myWork }: any = await import('../worklist/mywork.ts');
  const shared: any = await import('../../../shared/domain/index.ts');
  const normal: any = await import('../normal/regular.ts');
  console.log('\nP11 VIEC-DUNG-VAI · cột Việc đúng vai (GV việc của mình, QL gộp theo môn)');

  check('VDV-1 · gopViecTheoMon: 7 việc / 3 môn + 1 không môn → 4 dòng, mặc định 2, tổng 7, dòng đầu = việc gấp nhất của môn', () => {
    const ds = [['a', 'L'], ['b', 'R'], ['c', null], ['d', 'L'], ['e', 'S'], ['f', 'R'], ['g', 'L']] as const;
    const dong = gopViecTheoMon(ds, (x) => x[1]);
    assert(dong.map((d) => d.mon).join() === 'L,R,,S', `thứ tự dòng ${dong.map((d) => d.mon).join()}`);
    assert(dong.map((d) => d.dau[0]).join('') === 'abce', 'dau không phải việc đầu của môn');
    assert(dong.slice(0, SO_DONG_VIEC_MAC_DINH).length === 2 && dong.length === 4, 'mặc định 2 / Xem thêm 4');
    assert(dong.reduce((s, d) => s + 1 + d.them, 0) === 7, 'mất việc khi gộp');
    assert(gopViecTheoMon([], () => null).length === 0, 'rỗng');
  });

  check('VDV-2 · monCuaViec: từng mẫu `phu` của mywork.ts ra đúng môn; mẫu lạ / rỗng → null ("Khác")', () => {
    const m = (group: string, phu?: string | null) => monCuaViec({ group, phu });
    assert(m('score', 'Listening, Reading') === 'Listening' && m('score', 'Writing Task 1') === 'Writing Task 1', 'Nhập điểm (skills)');
    assert(m('no_plan', 'Reading') === 'Reading', 'Thêm PA học thuật · môn (duoiKyNang)');
    assert(m('ghi_ket_qua_pa', 'Speaking') === 'Speaking' && m('ghi_ket_qua_pa', 'Kết quả cuối · PA học thuật') === null, 'Kết quả PA / Kết quả cuối');
    assert(m('xac_nhan_pa', 'Listening') === 'Listening' && m('ghi_nhan_xet', 'Writing Task 2') === 'Writing Task 2', 'Xác nhận PA · Ghi nhận xét');
    assert(m('cause', 'Grammar + Vocabulary') === 'Grammar + Vocabulary' && m('cause', 'Pronunciation') === 'Pronunciation', 'lớp thường (ô chuẩn)');
    assert(m('cause', 'Kỹ năng') === null, 'Case chưa có môn');
    assert(m('xem_nx_s', 'Speaking') === 'Speaking', 'Xác nhận Case Speaking (chấm chéo)');
    assert(m('yt_xu_ly', '3 vi phạm') === null && m('chot_len_ft') === null && m('cause', null) === null && m('cause', '') === null && m('la_moi', 'Reading') === null, 'không môn / lạ');
  });

  check('VDV-5 · trên seed (Admin, mọi chi nhánh): môn của Nhập điểm / Ghi nhận xét = tenMon(chương trình, kn); gộp theo em không mất việc kể cả phu rỗng / lạ', () => {
    const { tenMon } = shared;
    const { programmeOfClass } = normal;
    const items = myWork(P.admin, { nguoi: 'tat-ca' }).items as any[];
    let so = 0;
    for (const it of items.filter((x) => (x.group === 'score' || x.group === 'ghi_nhan_xet') && x.kn && x.studentId !== null)) {
      so += 1;
      const mong = tenMon(it.classId ? programmeOfClass(it.classId)?.code ?? null : null, it.kn);
      assert(monCuaViec(it) === mong, `${it.key}: ${monCuaViec(it)} ≠ ${mong}`);
    }
    assert(so > 0, 'seed cần việc Nhập điểm / Ghi nhận xét theo em');
    const theoEm = new Map<number, any[]>();
    for (const it of items) if (it.studentId !== null) theoEm.set(it.studentId, [...(theoEm.get(it.studentId) ?? []), it]);
    for (const [id, ds] of theoEm) {
      const lech = ds.map((x, i) => (i % 3 === 0 ? { ...x, phu: '' } : i % 3 === 1 ? { ...x, phu: 'chữ lạ · đổi' } : x));
      for (const d of [ds, lech]) assert(gopViecTheoMon(d, monCuaViec).reduce((s, r) => s + 1 + r.them, 0) === d.length, `em ${id}: mất việc khi gộp`);
    }
  });

  const LOP = classId('MB FT 101');
  const cn = conn.prepare('SELECT branch_id FROM classes WHERE id = ?').get(LOP).branch_id;
  const emLop = new Set((conn.prepare(`SELECT student_id FROM enrollments WHERE class_id = ? AND status = 'active'`).all(LOP) as any[]).map((r: any) => r.student_id));
  const cuaLop = (it: any) => it.studentId !== null && emLop.has(it.studentId) && (it.classId === null || it.classId === LOP);
  const khoa = (ds: any[]) => JSON.stringify(ds.map((x) => x.key).sort());

  check('VDV-3 · viec-theo-em: GV seed chỉ nhận việc của mình (mine) — đúng tập /my-work của GV đó ở lớp', () => {
    let co = 0;
    for (const p of [P.coreTeacher, P.w1Teacher, P.sTeacher, P.subjectTeacher]) {
      const ds = Object.values(viecTheoEmCuaLop(p, LOP).theoEm).flat() as any[];
      co += ds.length;
      assert(ds.every((v) => v.mine), `${p.fullName}: có việc không phải của mình`);
      assert(khoa(ds) === khoa(myWork(p, { branchId: cn }).items.filter((it: any) => it.mine && cuaLop(it))), `${p.fullName}: khác /my-work (mine)`);
    }
    assert(co > 0, 'seed: GV MB FT 101 cần có việc theo em');
  });

  check('VDV-4 · viec-theo-em: QL nhận đủ việc của em (cả việc của GV khác), số việc khớp /my-work "Tất cả" của lớp', () => {
    const ds = Object.values(viecTheoEmCuaLop(P.mbManager, LOP).theoEm).flat() as any[];
    const goc = myWork(P.mbManager, { branchId: cn, nguoi: 'tat-ca' }).items.filter(cuaLop);
    assert(ds.length === goc.length && khoa(ds) === khoa(goc), `QL: ${ds.length} ≠ ${goc.length}`);
    assert(ds.some((v) => !v.mine), 'seed: QL cần thấy việc của người khác ở lớp');
  });
}
