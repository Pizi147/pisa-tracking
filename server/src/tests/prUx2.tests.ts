/**
 * PHÉP KIỂM UX-2 — tiếp đánh giá UX 16/10, phần không cần mockup (chủ SP). Mỗi ca cuộn lại (`thu`).
 *  1 Lịch Test "Quá hạn chấm" = Tổng quan "Bài quá hạn" (một hàm `oQuaHanCham` ← `overdueScoreBai`), gồm ô thi tuần trước đã quá hạn,
 *    cả hai khung; danh sách khi bấm số = đúng các ô đó.
 *  2 Tổng quan › Cần xử lý có lại dòng "Case chưa chốt PA quá hạn" (bấm mở danh sách).
 *  3 Menu Công việc: vào Chờ duyệt CHỈ khi có thẻ chờ duyệt.
 *  4 Hỗ trợ học viên (máy tính): tự mở việc đầu danh sách — một lần mỗi bộ lọc; điện thoại / 0 việc thì không.
 *  5 Công tắc Fast Track / Lớp thường theo lớp trong phạm vi người xem (`khungPhamVi`).
 */
import type { YThucTestKit } from './yThuc.tests.ts';

export async function runPrUx2Tests(t: YThucTestKit) {
  const { check, assert, conn, P, TODAY } = t;
  const d: any = await import('../../../shared/domain/index.ts');
  const cham: any = await import('../cham/canCham.ts');
  const metrics: any = await import('../worklist/metrics.ts');
  const tq: any = await import('../worklist/tongQuan.ts');
  const week: any = await import('../platform/week.ts');
  const nav: any = await import('../platform/nav.ts');
  const { xoaNho } = await import('../platform/nguCanhRequest.ts');
  console.log('\nUX-2 · tiếp đánh giá UX 16/10');

  const thu = <T>(fn: () => T): T => {
    conn.exec('BEGIN IMMEDIATE');
    try { xoaNho(); return fn(); } finally { conn.exec('ROLLBACK'); xoaNho(); }
  };
  const eq = (a: unknown, b: unknown, m: string) => assert(JSON.stringify(a) === JSON.stringify(b), `${m}: ${JSON.stringify(a)} ≠ ${JSON.stringify(b)}`);
  const MB = (conn.prepare(`SELECT id FROM branches WHERE code = 'MB'`).get() as any).id as number;
  const tuanNay = week.ensurePeriod(week.mondayOf(TODAY)).id as number;

  check('UX2-1 · Lịch Test "Quá hạn chấm" (Tất cả) = Tổng quan "Bài quá hạn", gồm ô tuần trước đã quá hạn; danh sách = đúng các ô', () => thu(() => {
    for (const [ten, p, cn] of [['QL MB', P.mbManager, MB], ['Quản trị', P.admin, null]] as const) {
      const m = metrics.metricSet(p, 'bai-qua-han-nhap-diem', { branchId: cn });
      const so = cham.dsQuaHanCham(p, { branchId: cn, phamVi: 'tat-ca' }, TODAY, false);
      assert(so && !('rows' in so), `${ten}: số không kèm dòng`);
      eq(so.n, m.n, `${ten}: số ô`);
      const ds = cham.dsQuaHanCham(p, { branchId: cn, phamVi: 'tat-ca' }, TODAY);
      eq(ds.rows.map((x: any) => x.id).sort((a: number, b: number) => a - b), m.ids, `${ten}: danh sách = tập chỉ số`);
    }
    /* Ô thi tuần trước đã quá hạn (khối 2) vẫn vào số "Quá hạn chấm". */
    const tuanTruoc = t.addDays(week.mondayOf(TODAY), -7);
    const o = cham.lichTest(P.mbManager, tuanNay, MB, TODAY, { phamVi: 'tat-ca' });
    const n = cham.dsQuaHanCham(P.mbManager, { branchId: MB, phamVi: 'tat-ca' }, TODAY, false).n;
    const k2QuaHan = (o.chamTuanNay ?? []).filter((h: any) => h.quaHan && h.weekStart === tuanTruoc).length;
    if (k2QuaHan) assert(n > o.tongQuan.no.bai, `khối 2 có ô quá hạn thì "Quá hạn chấm" (${n}) > khối 1 (${o.tongQuan.no.bai})`);
  }));

  check('UX2-2 · Cần xử lý: dòng "Case chưa chốt PA quá hạn" (chỉ số case-xac-dinh-nguyen-nhan-qua-han), bấm mở danh sách', () => thu(() => {
    const muc = d.CAN_XU_LY.find((x: any) => x.metricId === 'case-xac-dinh-nguyen-nhan-qua-han');
    assert(muc && muc.quaHan === true && muc.cuaNguoiXem === false, `CAN_XU_LY: ${JSON.stringify(muc)}`);
    eq(d.metricById('case-xac-dinh-nguyen-nhan-qua-han').ten, 'Case chưa chốt PA quá hạn', 'tên chỉ số');
    const n = metrics.metricSet(P.admin, 'case-xac-dinh-nguyen-nhan-qua-han', {}).n;
    const r = tq.tongQuanQuanLy(P.admin, {});
    if (n > 0) {
      const dong = r.canXuLy.find((x: any) => x.metricId === 'case-xac-dinh-nguyen-nhan-qua-han');
      assert(dong && dong.n === n && dong.den === null && dong.trangThai === 'qua-han', `dòng: ${JSON.stringify(dong)}`);
    }
  }));

  check('UX2-3 · Menu Công việc (OV-15d: một danh sách, Chờ bạn duyệt là nhóm đầu) — luôn mở /cong-viec', () => {
    const QL = { ...d.NAV_RONG, overview: true, work: true, workApprove: true };
    const den = (n: any, cho?: number) => d.khuVucHienThi(n, cho).find((k: any) => k.key === 'cong-viec')?.to;
    eq(den(QL, 3), '/cong-viec', 'có thẻ');
    eq(den(QL, 0), '/cong-viec', 'không thẻ');
    eq(den(QL), '/cong-viec', 'chưa đếm');
    eq(den({ ...QL, workApprove: false }, 3), '/cong-viec', 'không phải người duyệt');
  });

  check('UX2-4 · Hỗ trợ học viên: tự mở việc đầu (máy tính, chưa mở việc, chưa tự mở ở bộ lọc này); điện thoại / 0 việc thì không', () => {
    const ds = [{ key: 'a' }, { key: 'b' }];
    eq(d.viecTuMo(ds, { manHep: false, dangMo: false, daTuMo: false }), 'a', 'máy tính');
    eq(d.viecTuMo(ds, { manHep: true, dangMo: false, daTuMo: false }), null, 'điện thoại');
    eq(d.viecTuMo([], { manHep: false, dangMo: false, daTuMo: false }), null, '0 việc');
    eq(d.viecTuMo(ds, { manHep: false, dangMo: true, daTuMo: false }), null, 'đang mở');
    eq(d.viecTuMo(ds, { manHep: false, dangMo: false, daTuMo: true }), null, 'đã tự mở (đóng panel không bật lại)');
  });

  check('UX2-5 · khungPhamVi: theo lớp đang mở trong phạm vi người xem, không theo dữ liệu trang', () => {
    eq(nav.khungPhamVi(P.admin), { ft: true, thuong: true }, 'Quản trị');
    const gv = nav.khungPhamVi(P.sTeacher);
    const lop = conn.prepare(`SELECT DISTINCT COALESCE(pg.scoring_mode, '') m FROM teacher_assignments ta JOIN classes c ON c.id = ta.class_id
      LEFT JOIN programmes pg ON pg.code = c.programme_code WHERE ta.user_id = ? AND c.status = 'active'`).all(P.sTeacher.userId) as any[];
    eq(gv, { ft: lop.some((x) => x.m !== 'ratio'), thuong: lop.some((x) => x.m === 'ratio') }, 'GV Speaking');
  });
}
