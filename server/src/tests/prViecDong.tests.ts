/**
 * PHÉP KIỂM XM-VIEC-DUNG-HAN a (chủ SP 07/11 "làm hết theo đề xuất", plan.md mục 4 "07/11 đêm" mục 5): "Việc đúng hạn" đếm theo DÒNG như Công việc —
 * cùng hàm gộp (`gopViecTheoLop` + `dongNhinThay` của `demDongViec`): lớp nhiều em cùng một việc quá hạn của một GV = MỘT dòng ở Công việc, bảng Phân tích GV,
 * panel số và hồ sơ GV. Tử, mẫu, % và số dòng panel cùng đơn vị.
 */
import type { YThucTestKit } from './yThuc.tests.ts';

export async function runPrViecDongTests(t: YThucTestKit) {
  const { check, assert, conn, P, TODAY, addDays } = t as any;
  const d: any = await import('../../../shared/domain/index.ts');
  const pt: any = await import('../phanTich/giaoVien.ts');
  const week: any = await import('../platform/week.ts');
  const wl: any = await import('../worklist/mywork.ts');
  const { xoaNho } = await import('../platform/nguCanhRequest.ts');
  console.log('\nXM-VIEC-DUNG-HAN a — Việc đúng hạn đếm DÒNG như Công việc (gộp lớp = 1)');
  const thu = <T>(fn: () => T): T => {
    conn.exec('BEGIN IMMEDIATE');
    try { xoaNho(); return fn(); } finally { conn.exec('ROLLBACK'); xoaNho(); }
  };
  const tuanNay = week.mondayOf(TODAY);
  /** Nhân bản Case quá hạn "Thêm PA" (`support:{id}`) của một em sang `n` em khác CÙNG lớp — cùng người phụ trách, cùng hạn → Công việc gộp MỘT dòng. */
  const nhanBanCase = (caseId: number, classIdLop: number, n: number) => {
    const cot = (conn.prepare('PRAGMA table_info(sos_cases)').all() as any[]).map((c) => c.name as string).filter((c) => c !== 'id');
    const goc = conn.prepare('SELECT student_id FROM sos_cases WHERE id = ?').get(caseId) as any;
    const em = (conn.prepare(`SELECT e.student_id FROM enrollments e WHERE e.class_id = ? AND e.status = 'active' AND e.student_id != ? ORDER BY e.student_id LIMIT ?`)
      .all(classIdLop, goc.student_id, n) as any[]).map((r) => r.student_id as number);
    for (const sid of em) {
      conn.prepare(`INSERT INTO sos_cases (${cot.join(', ')}) SELECT ${cot.map((c) => (c === 'student_id' ? '?' : c === 'dedup_key' ? "dedup_key || ':xm' || ?" : c)).join(', ')} FROM sos_cases WHERE id = ?`).run(sid, sid, caseId);
    }
    return em.length;
  };
  /** Việc "Thêm PA" quá hạn có thể gộp (khoá gộp lớp) đầu tiên của seed → nhân thêm 2 em. */
  const taoDongGop = () => {
    const mo: Map<number, any[]> = pt.viecQuaHanMo(pt.nguCanhPtGv(P.mbManager, ky));
    const it = [...mo.values()].flat().find((x: any) => x.group === 'no_plan' && d.khoaGopCua(x));
    assert(it, 'seed phải có việc Thêm PA quá hạn gộp được');
    assert(nhanBanCase(Number(it.key.split(':')[1]), it.classId, 2) === 2, 'lớp phải còn 2 em khác');
    xoaNho();
  };
  const ky = { ct: 'ft', tu: week.mondayOf(addDays(TODAY, -7 * 12)), den: tuanNay };

  check('XM-VIEC a · việc còn mở quá hạn của GV ở bảng / panel / hồ sơ = số DÒNG quá hạn Công việc (gộp lớp = 1), không phải số việc', () => thu(() => {
    taoDongGop();
    const nc = pt.nguCanhPtGv(P.mbManager, ky);
    const mo: Map<number, any[]> = pt.viecQuaHanMo(nc);
    const bang = pt.phanTichGiaoVien(P.mbManager, ky);
    let gop = 0;
    for (const [gv, ds] of mo) {
      const h = bang.hang.find((x: any) => x.id === gv);
      if (!h) continue;
      /* Dòng Công việc của chính các việc đó (cùng `gopViecTheoLop` + `demDongViec` của trang Công việc). */
      const dongCv = d.demDongViec(d.gopViecTheoLop(ds, wl.nhanNhomViec)).n;
      if (dongCv < ds.length) gop += 1;
      const p = pt.oChiSoGv(P.mbManager, { ...ky, gv, cot: 'viec-dung-han' });
      const moP = p.rows.filter((r: any) => r.dongViec.mo && !/^Kết quả PA/.test(r.dongViec.ten));   // Kết quả PA mở: tập nghĩa vụ riêng
      assert(moP.length === dongCv, `GV ${gv}: panel ${moP.length} dòng mở ≠ Công việc ${dongCv} dòng (${ds.length} việc)`);
      const dung = p.rows.filter((r: any) => r.dongViec.dung).length;
      assert(p.n === h.viecDungHan.tong && dung === h.viecDungHan.dung && p.tieuDe.endsWith(`${dung}/${p.n} việc`), `GV ${gv}: panel ≠ ô ${JSON.stringify(h.viecDungHan)} · ${p.tieuDe}`);
      const hs = pt.chiSoHoSoGv(P.mbManager, gv, { tu: ky.tu, den: ky.den }).viecDungHan;
      const hsP = pt.oChiSoHoSoGv(P.mbManager, gv, { tu: ky.tu, den: ky.den, cot: 'viec-dung-han' });
      assert(hsP.n === hs.tong && hsP.rows.filter((r: any) => r.dongViec.dung).length === hs.dung, `GV ${gv}: hồ sơ panel ≠ ô`);
    }
    assert(gop > 0, 'seed phải có GV có nhiều việc quá hạn cùng lớp × loại (dòng gộp)');
  }));

  check('XM-VIEC a · dòng gộp ở panel: một dòng lớp × loại việc, mở đúng việc gấp nhất; Kết quả PA một PA = một việc', () => thu(() => {
    taoDongGop();
    const nc = pt.nguCanhPtGv(P.mbManager, ky);
    const mo: Map<number, any[]> = pt.viecQuaHanMo(nc);
    const [gv, ds] = [...mo].find(([, x]) => d.demDongViec(d.gopViecTheoLop(x, wl.nhanNhomViec)).n < x.length)!;
    const p = pt.oChiSoGv(P.mbManager, { ...ky, gv, cot: 'viec-dung-han' });
    const gopRow = p.rows.find((r: any) => r.dongViec.mo && !r.dongViec.em && r.dongViec.lop);
    assert(gopRow, `phải có dòng gộp (không em, có lớp): ${JSON.stringify(p.rows.map((r: any) => r.dongViec).slice(0, 3))}`);
    assert(ds.some((it: any) => it.href === gopRow.dongViec.href), 'dòng gộp phải mở một việc của nó');
    /* Kết quả PA: không hai dòng cùng một PA. */
    const pa = p.rows.filter((r: any) => /^Kết quả PA/.test(r.dongViec.ten) && r.dongViec.em).map((r: any) => r.dongViec.href);
    assert(new Set(pa).size === pa.length, 'Kết quả PA lặp một PA nhiều dòng');
  }));
}
