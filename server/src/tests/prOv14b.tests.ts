/**
 * PHÉP KIỂM OV-14b (rà UX 17/10) — phần logic của gói sửa nhỏ:
 *  1 · "Đã thi · chờ kết quả": bảng lớp (roster — Học viên & Lớp QL / GV, hồ sơ lớp FT) cùng giai đoạn + hạn với panel một em (`sauThiCuaEm`);
 *      lọc "Đã thi · chờ kết quả" của QL / GV = cùng tập với chip TVV / CX (`loTrinhChoKetQuaThi`)
 *  2 · Đang SOS mặc định Toàn bộ (vẫn chọn được một tuần; tuần gần nhất trả kèm cho nút ‹)
 *  3 · Lịch Test "Quá hạn chấm" theo khung: FT + Lớp thường = cả hai; số = số dòng danh sách
 */
import type { YThucTestKit } from './yThuc.tests.ts';

export async function runPrOv14bTests(t: YThucTestKit) {
  const { check, assert, conn, TODAY, P, addDays } = t;
  const intake: any = await import('../classes/intake.ts');
  const week: any = await import('../platform/week.ts');
  const classes: any = await import('../classes/classes.ts');
  const hvl: any = await import('../classes/hocVienLop.ts');
  const sos: any = await import('../classes/hocVienSos.ts');
  const thiThat: any = await import('../loTrinh/thiThat.ts');
  const cham: any = await import('../cham/canCham.ts');
  const { xoaNho } = await import('../platform/nguCanhRequest.ts');
  console.log('\nOV-14b · sửa nhỏ sau rà UX 17/10 (logic)');

  const one = (sql: string, ...a: unknown[]) => (conn.prepare(sql).all(...a) as any[])[0];
  const QL = P.mbManager;
  const MB = one(`SELECT id FROM branches WHERE code = 'MB'`).id as number;
  const NOW = new Date().toISOString();
  const T2 = week.mondayOf(TODAY) as string;
  const bd = addDays(T2, -70);
  const l = intake.createClass(P.admin, { code: 'MB Q14B-1', branchId: MB, kind: 'FT', isFastTrack: true, route: 'LT1', startDate: bd, startPeriodId: week.ensurePeriod(bd).id }).id as number;
  const em = (ten: string, cot: Record<string, unknown>) => {
    const sid = Number(conn.prepare(`INSERT INTO students (student_code, full_name, normalized_name, branch_id, status, created_at) VALUES (?,?,?,?, 'active', ?)`)
      .run(`PISA-Q14B-${ten}`, `Học viên Q14B ${ten}`, `hoc vien q14b ${ten}`, MB, NOW).lastInsertRowid);
    conn.prepare(`INSERT INTO enrollments (student_id, class_id, status, started_at, created_at) VALUES (?,?, 'active', ?, ?)`).run(sid, l, bd, NOW);
    const k = Object.keys(cot);
    conn.prepare(`INSERT INTO learning_cycles (student_id, seq, route, programme_code, target_score, start_period_id, started_at, status, created_at${k.map((x) => `, ${x}`).join('')})
      VALUES (?,1,'LT1','FT',6.5,?,?, 'active', ?${k.map(() => ', ?').join('')})`).run(sid, week.ensurePeriod(bd).id, bd, NOW, ...Object.values(cot));
    return sid;
  };
  const daThi = em('A', { exam_date: addDays(TODAY, -3), exam_month: addDays(TODAY, -3).slice(0, 7) });
  const coKq = em('B', { exam_date: addDays(TODAY, -3), exam_month: addDays(TODAY, -3).slice(0, 7), thi_that_l: 7, thi_that_r: 6.5, thi_that_w: 6, thi_that_s: 6.5 });
  const chuaThi = em('C', { exam_date: addDays(TODAY, 20), exam_month: addDays(TODAY, 20).slice(0, 7) });
  xoaNho();

  check('OV14b-1 · roster (Học viên & Lớp QL / GV, hồ sơ lớp FT) cùng giai đoạn + hạn với panel một em; lọc "Đã thi · chờ kết quả" = tập chip TVV / CX', () => {
    const ro = classes.classRoster(QL, l, undefined, true) as any[];
    const dong = (sid: number) => ro.find((r) => r.id === sid);
    for (const sid of [daThi, coKq]) {
      const a = dong(sid)?.sauThi, b = thiThat.sauThiCuaEm(QL, sid);
      assert(a && b && a.giaiDoan === b.giaiDoan && a.han === b.han && a.quaHan === b.quaHan, `em ${sid}: roster ${JSON.stringify(a)} ≠ panel ${JSON.stringify(b)}`);
    }
    assert(dong(daThi).sauThi.giaiDoan === 'da_thi_cho_kq' && dong(coKq).sauThi.giaiDoan === 'cho_buoc_tiep', 'giai đoạn sai');
    assert(dong(chuaThi) && dong(chuaThi).sauThi === null, 'em chưa thi không có nhãn');
    const tr = hvl.danhSachHocVienLop(QL, { phamVi: 'chi-nhanh', branchId: MB });
    const coLoc = new Set((tr.hocVien as any[]).filter((h) => h.loc.includes('da-thi')).map((h) => h.id));
    const chipTvv = new Set(thiThat.loTrinhChoKetQuaThi(TODAY).map((x: any) => x.c.student_id));
    assert(coLoc.has(daThi) && !coLoc.has(coKq) && !coLoc.has(chuaThi), `lọc QL: ${[...coLoc]}`);
    assert([...coLoc].every((id) => chipTvv.has(id)), 'lọc QL có em ngoài tập chip TVV / CX');
    assert(tr.dem['da-thi'] === coLoc.size, `số chip ${tr.dem['da-thi']} ≠ ${coLoc.size}`);
  });

  check('OV14b-2 · Đang SOS không lọc tuần (SL2, 9.1-4): link cũ `tuan` cho cùng danh sách với mặc định', () => {
    const md = sos.dangSos(QL, { phamVi: 'chi-nhanh', branchId: MB });
    const cu = sos.dangSos(QL, { tuan: '2026-09-07', phamVi: 'chi-nhanh', branchId: MB });
    assert(md.rows.length > 0 && md.rows.length === cu.rows.length, `${md.rows.length} ≠ ${cu.rows.length}`);
  });

  check('OV14b-3 · "Quá hạn chấm" theo khung: FT + Lớp thường = cả hai; số = số dòng; ô khung ⊇ khối "Test quá hạn chấm" cùng khung', () => {
    const ca = cham.dsQuaHanCham(QL, {}, TODAY, true);
    const ft = cham.dsQuaHanCham(QL, { khung: 'ft' }, TODAY, true);
    const th = cham.dsQuaHanCham(QL, { khung: 'thuong' }, TODAY, true);
    assert(ca.n > 0 && ft.n + th.n === ca.n, `ft ${ft.n} + thường ${th.n} ≠ ${ca.n}`);
    for (const x of [ca, ft, th]) assert(x.rows.length === x.n, `số ${x.n} ≠ ${x.rows.length} dòng`);
    assert(ft.lop + th.lop >= ca.lop, 'số lớp');
    /* Ô theo khung ⊇ khối 1 cùng khung (ô còn đếm ô quá hạn tuần trước nằm ở khối 2). Bộ demo sạch 14/09: bằng nhau (FT 53 · 2 lớp — đo tay). */
    const lt = cham.lichTest(QL, week.ensurePeriod(T2).id, null, TODAY, {});
    for (const [kh, o] of [['ft', ft], ['thuong', th]] as const) {
      const no = (lt.no as any[]).filter((x) => (x.kind === 'mt0' ? 'thuong' : x.mode === 'ielts_band' ? 'ft' : 'thuong') === kh);
      const khoi = no.reduce((s, x) => s + x.conBai, 0);
      assert(khoi <= o.n && new Set(no.map((x) => x.classId)).size <= o.lop, `${kh}: ô ${o.n} · ${o.lop} lớp < khối ${khoi}`);
    }
  });
}
