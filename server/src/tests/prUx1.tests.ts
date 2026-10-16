/**
 * PHÉP KIỂM UX-1 — sửa gấp từ "Đánh giá UX – Toàn hệ thống" (chủ SP 16/10). Mỗi ca cuộn lại (`thu`).
 *  1 Bảng chi nhánh: Case của lớp đã kết thúc vào hàng "Lớp đã kết thúc" → Σ hàng = hàng tổng; bấm ô ra đúng danh sách.
 *  2 Bảng chi nhánh: lớp không em, không số → không có hàng.
 *  3 Học viên & Lớp: "Tất cả" đếm theo id em, em Kết thúc học không vào số.
 *  4 "Case chờ duyệt" của Tổng quan / cột Tổng hợp đổi tên "Case chưa có PA".
 *  8 Lịch Test: số lớp còn bài / lớp đã xong.
 */
import type { YThucTestKit } from './yThuc.tests.ts';

export async function runPrUx1Tests(t: YThucTestKit) {
  const { check, assert, conn, P } = t;
  const d: any = await import('../../../shared/domain/index.ts');
  const bang: any = await import('../worklist/bangChiNhanh.ts');
  const metrics: any = await import('../worklist/metrics.ts');
  const hvl: any = await import('../classes/hocVienLop.ts');
  const { xoaNho } = await import('../platform/nguCanhRequest.ts');
  console.log('\nUX-1 · sửa gấp đánh giá UX');

  const thu = <T>(fn: () => T): T => {
    conn.exec('BEGIN IMMEDIATE');
    try { xoaNho(); return fn(); } finally { conn.exec('ROLLBACK'); xoaNho(); }
  };
  const eq = (a: unknown, b: unknown, m: string) => assert(JSON.stringify(a) === JSON.stringify(b), `${m}: ${JSON.stringify(a)} ≠ ${JSON.stringify(b)}`);
  const tongHang = (b: any, cot: string) => b.hang.reduce((n: number, h: any) => n + h.o[cot].n, 0) + (b.conLai?.o[cot].n ?? 0);

  check('UX1-1 · Bảng chi nhánh: Case của lớp đã kết thúc ở hàng "Lớp đã kết thúc", Σ hàng Case = hàng tổng, bấm ô ra đúng số', () => thu(() => {
    const caseId = metrics.metricSet(P.admin, 'case-mo', { program: 'ft' }).ids[0];
    assert(caseId, 'bộ demo phải có Case mở FT');
    const lop = conn.prepare(`SELECT a.class_id FROM sos_cases sc JOIN assessment_attempts a ON a.id = sc.attempt_id WHERE sc.id = ?`).get(caseId) as any;
    assert(lop?.class_id, 'Case phải sinh từ lượt có lớp');
    conn.prepare(`UPDATE classes SET status = 'finished', finished_at = '2026-09-01' WHERE id = ?`).run(lop.class_id);
    xoaNho();
    for (const f of [{ ct: 'ft' }, { ct: 'ft', branchId: (conn.prepare('SELECT branch_id FROM classes WHERE id = ?').get(lop.class_id) as any).branch_id }]) {
      const b = bang.bangChiNhanh(P.admin, f);
      assert(b.conLai, `${JSON.stringify(f)}: phải có hàng "Lớp đã kết thúc"`);
      eq(b.conLai.nhan, 'Lớp đã kết thúc', 'nhãn');
      for (const cot of ['caseMo', 'thieuPa']) eq(tongHang(b, cot), b.tong[cot].n, `${JSON.stringify(f)}: Σ hàng ${cot} = tổng`);
      for (const cot of d.COT_BANG) eq(bang.oBangChiNhanh(P.admin, { ...f, cot, khoa: 'ket-thuc' }).rows.length, b.conLai.o[cot].n, `ô ket-thuc/${cot}`);
      assert(bang.oBangChiNhanh(P.admin, { ...f, cot: 'caseMo', khoa: 'ket-thuc' }).rows.some((r: any) => r.id === caseId), 'Case của lớp kết thúc nằm trong danh sách');
    }
  }));

  check('UX1-2 · Bảng chi nhánh: lớp không em và không số nào → không có hàng', () => thu(() => {
    const b0 = bang.bangChiNhanh(P.admin, { ct: 'ft' });
    const lopRong = b0.hang.flatMap((h: any) => h.lop ?? []).find((l: any) => l.o.caseMo.n === 0 && l.o.thieuPa.n === 0);
    assert(lopRong, 'cần một lớp FT không có Case');
    conn.prepare(`UPDATE enrollments SET status = 'completed' WHERE class_id = ? AND status = 'active'`).run(lopRong.id);
    xoaNho();
    const b = bang.bangChiNhanh(P.admin, { ct: 'ft' });
    assert(!b.hang.flatMap((h: any) => h.lop ?? []).some((l: any) => l.id === lopRong.id), `lớp ${lopRong.nhan} 0 em vẫn có hàng`);
    for (const l of b.hang.flatMap((h: any) => h.lop ?? [])) assert(d.COT_BANG.some((c: string) => l.o[c].n > 0 || (l.o[c].mau ?? 0) > 0), `hàng ${l.nhan} toàn 0`);
  }));

  check('UX1-3 · Học viên & Lớp "Tất cả": một em một lần, em Kết thúc học hiện nhưng không vào số', () => {
    eq(d.demLoc([
      { id: 1, loc: ['tat-ca', 'sos'], khung: 'ft' }, { id: 1, loc: ['tat-ca', 'sos'], khung: 'ft' },
      { id: 2, loc: ['tat-ca'], khung: 'ft', ketThuc: true },
    ], 'tat-ca'), { 'tat-ca': 1, 'can-lam': 0, 'qua-han': 0, 'cho-duyet': 0, sos: 1, thieu_tt: 0 }, 'demLoc');
    const r = hvl.danhSachHocVienLop(P.admin, {});
    const dangHoc = new Set(r.hocVien.filter((h: any) => !h.ketThuc).map((h: any) => h.id));
    eq(r.dem['tat-ca'], dangHoc.size, 'dem Tất cả = số em đang học khác nhau');
  });

  check('UX1-4 · Ô Tổng quan + cột Tổng hợp: "Case chưa có PA"; "Chờ duyệt" chỉ còn là hộp thẻ QL', () => {
    eq(d.metricById('case-cho-xac-dinh-nguyen-nhan').ten, 'Case chưa chốt PA', 'tên chỉ số');
    eq(d.metricById('case-xac-dinh-nguyen-nhan-qua-han').ten, 'Case chưa chốt PA quá hạn', 'tên chỉ số quá hạn');
    eq(d.cotTongHopFor('ft').find((x: any) => x.khoa === 'choDuyet').nhan('ft'), 'Chưa chốt PA', 'cột Tổng hợp');
    eq(d.NHAN_NHOM_XU_LY['cho-duyet'], 'Chưa chốt PA', 'nhóm của Case');
  });

  check('UX1-8 · Lịch Test: "n lớp" chỉ đếm lớp còn bài, lớp nhiều hàng còn bài ở một hàng là còn bài', () => {
    eq(d.demLopConBai([{ classId: 1, con: 0 }, { classId: 1, con: 2 }, { classId: 2, con: 0 }, { classId: 3, con: 0 }]), { con: 1, xong: 2 }, 'đếm');
    eq(d.demLopConBai([]), { con: 0, xong: 0 }, 'rỗng');
  });
}
