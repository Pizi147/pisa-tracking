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
  console.log('\nP11 VIEC-DUNG-VAI · cột Việc đúng vai (GV việc của mình, QL gộp theo môn)');

  check('VDV-1 · gopViecTheoMon: 7 việc / 3 môn + 1 không môn → 4 dòng, mặc định 3, tổng 7, dòng đầu = việc gấp nhất của môn', () => {
    const ds = [['a', 'L'], ['b', 'R'], ['c', null], ['d', 'L'], ['e', 'S'], ['f', 'R'], ['g', 'L']] as const;
    const dong = gopViecTheoMon(ds, (x) => x[1]);
    assert(dong.map((d) => d.mon).join() === 'L,R,,S', `thứ tự dòng ${dong.map((d) => d.mon).join()}`);
    assert(dong.map((d) => d.dau[0]).join('') === 'abce', 'dau không phải việc đầu của môn');
    assert(dong.slice(0, SO_DONG_VIEC_MAC_DINH).length === 3 && dong.length === 4, 'mặc định 3 / Xem thêm 4');
    assert(dong.reduce((s, d) => s + 1 + d.them, 0) === 7, 'mất việc khi gộp');
    assert(gopViecTheoMon([], () => null).length === 0, 'rỗng');
  });

  check('VDV-2 · monCuaViec: nhãn môn có sẵn (Nhập điểm nhiều môn → môn đầu; lớp thường giữ nhãn ô), nhóm không môn → null', () => {
    assert(monCuaViec({ group: 'score', phu: 'Listening, Reading' }) === 'Listening', 'score');
    assert(monCuaViec({ group: 'no_plan', phu: 'Reading' }) === 'Reading', 'no_plan');
    assert(monCuaViec({ group: 'cause', phu: 'Grammar + Vocabulary' }) === 'Grammar + Vocabulary', 'lớp thường');
    assert(monCuaViec({ group: 'yt_xu_ly', phu: '3 vi phạm' }) === null && monCuaViec({ group: 'chot_len_ft' }) === null && monCuaViec({ group: 'cause', phu: null }) === null, 'không môn');
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
