/**
 * PHÉP KIỂM LOP-1-LOP — hồ sơ lớp đọc một lớp (kế hoạch `docs/superpowers/plans/2026-10-30-toc-do.md`).
 * L1 `/classes/:id/viec-theo-em` chỉ đọc lượt của lớp (giống hệt đường đủ) + `?chi=toi` · L2 badge "n việc quá hạn" = `soQuaHanLop` (công thức web cũ).
 */
import fs from 'node:fs';
import path from 'node:path';

export async function runPrLop1LopTests(t: any) {
  const { check, assert, assertThrows, conn, P, TODAY } = t;
  console.log('\nLOP-1-LOP · hồ sơ lớp đọc một lớp');
  const vt: any = await import('../classes/viecTheoEm.ts');
  const { myWork } = await import('../worklist/mywork.ts');
  const { loadPrincipal } = await import('../permissions.ts');
  const attempts: any = await import('../fasttrack/attempts.ts');
  const { demViec, laVaiQuanLy, vaiXemHocVien } = await import('../../../shared/domain/index.ts');
  const { soDongSql, chayTrongRequest, xoaNho, demHienTai } = await import('../platform/nguCanhRequest.ts');
  const all = (sql: string, ...a: unknown[]) => conn.prepare(sql).all(...a) as any[];
  const nguoiVai = (role: string) => loadPrincipal((conn.prepare(
    `SELECT ur.user_id AS id FROM user_roles ur JOIN roles r ON r.id = ur.role_id WHERE r.key = ? ORDER BY ur.user_id LIMIT 1`).get(role) as any).id);
  const VAI: [string, any][] = [['QL', P.mbManager], ['QT', P.admin], ['GVCN', P.coreTeacher], ['GVBM', P.subjectTeacher],
    ['GVCN_THUONG', P.normalCoreTeacher], ['TVV', nguoiVai('consultant')], ['CX', nguoiVai('cx')]];
  const lopActive = all(`SELECT id, branch_id FROM classes WHERE status = 'active' ORDER BY id`) as { id: number; branch_id: number | null }[];

  /** Kết quả + dòng đọc (cả request / riêng câu đọc lượt + điểm) của `viecTheoEmCuaLop` — đường mới / đường đủ (`viecLopDayDuKhiKiem`). Lỗi (403) trả `{ loi }`. */
  const chay = (p: any, lop: number, du: boolean, o?: { chiToi?: boolean }) => {
    vt.viecLopDayDuKhiKiem.bat = du;
    xoaNho();
    try {
      const d0 = soDongSql();
      let luot = 0;
      const r = chayTrongRequest('GET', () => {
        const x = vt.viecTheoEmCuaLop(p, lop, o);
        for (const [cau, n] of demHienTai()?.theoCau ?? []) if (/assessment_(attempts|scores)|^WITH ids/.test(cau)) luot += n;
        return x;
      });
      return { r, dong: soDongSql() - d0, luot };
    } catch (e: any) {
      if (e?.status !== 403) throw e;   // chỉ 403 (ngoài phạm vi) là kết quả hợp lệ — lỗi khác phải làm phép kiểm đỏ
      return { loi: '403', dong: 0 } as any;
    }
    finally { vt.viecLopDayDuKhiKiem.bat = false; }
  };

  check('L1 · cuaToi + theoEm giống hệt đường đủ — mọi lớp active × QL, QT, GVCN, GVBM, GVCN_THUONG, TVV; RF1 việc classId null giữ nguyên', () => {
    let soNull = 0, soSo = 0;
    for (const [ten, p] of VAI.filter(([v]) => v !== 'CX')) for (const { id } of lopActive) {
      const moi = chay(p, id, false), du = chay(p, id, true);
      assert((moi.loi ?? null) === (du.loi ?? null), `${ten} lớp ${id}: lỗi ${moi.loi} ≠ ${du.loi}`);
      if (du.loi) continue;
      const { soQuaHanLop: _a, ...m } = moi.r, { soQuaHanLop: _b, ...d } = du.r;
      assert(JSON.stringify(m) === JSON.stringify(d), `${ten} lớp ${id}: ${JSON.stringify(m).slice(0, 300)} ≠ ${JSON.stringify(d).slice(0, 300)}`);
      const khoaNull = (r: any) => JSON.stringify(Object.values(r.theoEm).flat().filter((it: any) => it.classId === null).map((it: any) => it.key).sort());
      assert(khoaNull(moi.r) === khoaNull(du.r), `${ten} lớp ${id}: việc classId null lệch`);
      soNull += Object.values(du.r.theoEm).flat().filter((it: any) => it.classId === null).length;
      soSo++;
    }
    assert(soSo > 20, `phép so quá ít (${soSo})`);
    console.log(`    (RF1: ${soNull} việc classId null trong các lần so)`);
  });

  check('L1 · RF5 GVBM mở lớp không dạy → 403; mọi việc trong cuaToi của GV có mine', () => {
    const day = new Set(P.subjectTeacher.assignments.map((a: any) => a.classId));
    const ngoai = lopActive.find((l) => !day.has(l.id) && l.branch_id !== null);
    assert(ngoai, 'dữ liệu demo: phải có lớp GVBM không dạy');
    assertThrows(() => vt.viecTheoEmCuaLop(P.subjectTeacher, ngoai!.id), /phạm vi/, 'GVBM mở lớp không dạy');
    for (const p of [P.coreTeacher, P.subjectTeacher, P.normalCoreTeacher]) for (const l of lopActive) {
      const r = chay(p, l.id, false).r;
      if (r) assert(r.cuaToi.every((it: any) => it.mine === true), `GV ${p.userId} lớp ${l.id}: cuaToi có việc không phải của mình`);
    }
  });

  /* Kế hoạch ghi "dòng QL lớp 3 < đường đủ ÷ 3": demo MB ít lớp, lớp 3 giữ phần lớn lượt còn ô chờ, và phần lớn dòng của request là khối khác của `myWork`
     (HV, phân công, Case — chưa đổi, chờ TRANG-LON) → kiểm câu đọc lượt + điểm: lớp 3 giảm, lớp MB nhỏ nhất < đủ ÷ 3; tổng dòng không tăng. */
  check('L1 · chi=toi: theoEm rỗng, cuaToi như đường đủ; QL đọc lượt ít hơn (lớp 3 giảm, lớp MB ít lượt nhất < ÷ 3)', () => {
    const moi = chay(P.mbManager, 3, false, { chiToi: true }), du = chay(P.mbManager, 3, true);
    assert(JSON.stringify(moi.r.theoEm) === '{}', 'theoEm phải rỗng');
    assert(JSON.stringify(moi.r.cuaToi) === JSON.stringify(du.r.cuaToi), 'cuaToi lệch');
    assert(moi.luot < du.luot && moi.dong < du.dong, `lớp 3: lượt ${moi.luot} / ${du.luot}, dòng ${moi.dong} / ${du.dong}`);
    const mb = lopActive.filter((l) => l.branch_id === lopActive.find((x) => x.id === 3)!.branch_id);
    const nho = mb.map((l) => ({ l, m: chay(P.mbManager, l.id, false, { chiToi: true }), d: chay(P.mbManager, l.id, true) }))
      .filter((x) => x.m.r).sort((a, b) => a.m.luot - b.m.luot)[0];
    assert(nho.m.luot < nho.d.luot / 3, `lớp ${nho.l.id}: lượt ${nho.m.luot} / ${nho.d.luot}`);
    console.log(`    (QL lớp 3: lượt ${moi.luot} ← ${du.luot}, dòng ${moi.dong} ← ${du.dong}; lớp ${nho.l.id}: lượt ${nho.m.luot} ← ${nho.d.luot})`);
  });

  /** Công thức badge web cũ (`DauTrangLop.tsx` trước PR): QL `/my-work?nguoi=tat-ca&branchId`; GV `/my-work` + `mine`. */
  const badgeCu = (p: any, lop: { id: number; branch_id: number | null }) => {
    const ql = laVaiQuanLy(p.roleKeys), chiCuaToi = !ql && vaiXemHocVien(p.roleKeys) === null;
    xoaNho();
    const w: any = chayTrongRequest('GET', () => ql ? myWork(p, { branchId: lop.branch_id, nguoi: 'tat-ca' }) : myWork(p, {}));
    return demViec((w.dong ?? []).flatMap((x: any) => (x.con?.length ? x.con : [x]))
      .filter((it: any) => (!chiCuaToi || it.mine) && it.urgency === 'overdue' && it.classId === lop.id)).viec;
  };

  check('L2 · soQuaHanLop = số badge cũ — mọi lớp active × QL, QT, GVCN, GVBM, GVCN_THUONG; có lớp > 0', () => {
    let coSo = 0;
    for (const [ten, p] of VAI.filter(([v]) => v !== 'TVV' && v !== 'CX')) for (const l of lopActive) {
      const r = chay(p, l.id, false, { chiToi: true }).r;
      if (!r) continue;
      const cu = badgeCu(p, l);
      assert(r.soQuaHanLop === cu, `${ten} lớp ${l.id}: soQuaHanLop ${r.soQuaHanLop} ≠ badge cũ ${cu}`);
      if (cu > 0) coSo++;
    }
    assert(coSo > 0, 'dữ liệu demo: phải có lớp có việc quá hạn (phép so không rỗng)');
  });

  check('L2 · RF3 sau lưu điểm: soQuaHanLop (GV và QL) = công thức cũ, giảm ≥ 1; việc rời cuaToi', () => {
    const lop = lopActive.find((l) => l.id === 3)!;
    const gv = [P.coreTeacher, P.subjectTeacher, P.w1Teacher, P.w2Teacher, P.lrTeacher, P.sTeacher]
      .find((p) => chay(p, 3, false, { chiToi: true }).r?.cuaToi.some((it: any) => it.group === 'score' && it.urgency === 'overdue' && it.attemptId && it.studentId !== null));
    assert(gv, 'dữ liệu demo: lớp 3 phải có GV có việc Nhập điểm quá hạn');
    const viec = chay(gv, 3, false, { chiToi: true }).r.cuaToi.find((it: any) => it.group === 'score' && it.urgency === 'overdue' && it.attemptId && it.studentId !== null);
    const truocGv = chay(gv, 3, false, { chiToi: true }).r.soQuaHanLop, truocQl = chay(P.mbManager, 3, false, { chiToi: true }).r.soQuaHanLop;
    conn.exec('BEGIN IMMEDIATE');
    try {
      for (const kn of viec.knsQuaHan ?? viec.kns ?? []) attempts.saveScore(gv, viec.attemptId, kn, { band: 6 }, TODAY);
      const sauGv = chay(gv, 3, false, { chiToi: true }).r, sauQl = chay(P.mbManager, 3, false, { chiToi: true }).r;
      assert(sauGv.soQuaHanLop === badgeCu(gv, lop) && sauQl.soQuaHanLop === badgeCu(P.mbManager, lop), 'sau lưu: lệch công thức cũ');
      assert(sauGv.soQuaHanLop <= truocGv - 1 && sauQl.soQuaHanLop <= truocQl - 1, `không giảm: GV ${truocGv}→${sauGv.soQuaHanLop}, QL ${truocQl}→${sauQl.soQuaHanLop}`);
      assert(!sauGv.cuaToi.some((it: any) => it.key === viec.key), 'việc vừa nhập vẫn còn trong cuaToi');
    } finally { conn.exec('ROLLBACK'); xoaNho(); }
  });

  check('L2 · TVV, CX → soQuaHanLop null', () => {
    for (const [ten, p] of VAI.filter(([v]) => v === 'TVV' || v === 'CX')) for (const l of lopActive) {
      const r = chay(p, l.id, false, { chiToi: true }).r;
      if (r) assert(r.soQuaHanLop === null, `${ten} lớp ${l.id}: ${r.soQuaHanLop}`);
    }
  });

  check('L2 · web DauTrangLop không còn gọi /my-work; đọc soQuaHanLop từ duongViecLop', () => {
    const src = fs.readFileSync(path.resolve(process.cwd(), 'web/src/modules/classes/DauTrangLop.tsx'), 'utf8');
    assert(!/useApi[^;]*\/my-work/.test(src), 'DauTrangLop còn gọi /my-work');
    assert(/duongViecLop\(/.test(src) && /soQuaHanLop/.test(src), 'DauTrangLop chưa đọc soQuaHanLop từ duongViecLop');
  });
}
