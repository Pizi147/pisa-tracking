/**
 * PHÉP KIỂM V5 · UI-LICH-TUAN (08 mục 6 dòng 5, mục 10; dieu-chinh-cuoi khu a; 10 mục 6):
 *  · hàng lớp ghi số em theo lượt CỦA TỪNG EM (`soHv`, `luot` "MT3 20 · MT2 1") — không giả định cả lớp cùng MT;
 *  · dải số = hàng của TUẦN ĐANG XEM (C13 một tuần), kể cả tuần hiện tại;
 *  · `/nhap-diem/*`, `/bang-diem-thuong/*` thành chuyển hướng (`duongNhapDiemCu`).
 */
type Kit = { check: (n: string, f: () => void) => void; assert: (c: unknown, m: string) => void; conn: any; P: any; TODAY: string };

export async function runPrUiLichTuanTests(t: Kit) {
  const { check, assert, conn, P, TODAY } = t;
  const d: any = await import('../../../shared/domain/index.ts');
  const cham: any = await import('../cham/canCham.ts');
  console.log('\nV5 · UI-LICH-TUAN — Lịch tuần: HV theo lượt, dải số một tuần, chuyển hướng lưới cũ');
  const tuan = conn.prepare('SELECT id FROM report_periods WHERE week_start = ?').get(d.mondayOfDate(TODAY)) as any;

  check('ULT-1 · hàng lớp: soHv = số em khác nhau làm bài trong tuần; luot tách theo lượt của từng em, đông em trước, khớp Đợt', () => {
    const r = cham.lichTest(P.mbManager, tuan.id, null, TODAY, { phamVi: 'tat-ca' });
    assert(r.lop.length > 0, 'seed: tuần hiện tại phải có hàng lớp');
    let nhieuLuot = 0;
    for (const l of r.lop) {
      const tong = l.luot.reduce((n: number, x: any) => n + x.soHv, 0);
      assert(l.soHv > 0 && tong >= l.soHv && Math.max(...l.luot.map((x: any) => x.soHv)) <= l.soHv, `${l.key}: soHv ${l.soHv}, luot ${JSON.stringify(l.luot)}`);
      assert(l.luot.every((x: any, i: number) => i === 0 || l.luot[i - 1].soHv >= x.soHv), `${l.key}: lượt đông em trước`);
      assert(l.luot.map((x: any) => x.dot).sort().join() === l.dotLabel.split(', ').sort().join(), `${l.key}: luot ≠ Đợt ${l.dotLabel}`);
      if (l.luot.length > 1) nhieuLuot += 1;
    }
    assert(nhieuLuot > 0, 'seed: phải có lớp FT có em ở lượt khác nhau trong cùng tuần (MT3 · MT2)');
  });

  check('ULT-2 · dải số tuần hiện tại = cộng hàng của tuần đang xem (không cộng tuần trước) — QL và GV', () => {
    for (const p of [P.mbManager, P.coreTeacher]) {
      const r = cham.lichTest(p, tuan.id, null, TODAY);
      const q = r.tongQuan;
      assert(q.tong === r.lop.reduce((n: number, l: any) => n + (l.phan ? l.tongCuaToi : l.tong), 0), `tổng ${q.tong}`);
      assert(q.conPhaiCham === r.lop.reduce((n: number, l: any) => n + (l.phan ? l.conBaiCuaToi : l.conBai), 0), `còn ${q.conPhaiCham}`);
    }
  });

  check('ULT-3 · /nhap-diem/* chuyển hướng: FT theo tuần → Lịch tuần (lớp, tuần, kn); lượt không theo tuần → panel Nhập điểm lớp; id hỏng → Lịch', () => {
    const q = (s: string) => new URLSearchParams(s);
    assert(d.duongNhapDiemCu('12', q('periodId=40&kn=reading'), true) === '/test/lich?classId=12&periodId=40&kn=reading', 'FT');
    assert(d.duongNhapDiemCu('12', q('kind=mt0&periodId=40'), true) === '/test/lich?classId=12&periodId=40', 'MT0 theo tuần');
    assert(d.duongNhapDiemCu('7', q('kind=final&kn=writing'), true) === '/test/diem-lop?lop=7&luot=thuong%3Afinal', 'lớp thường');
    assert(d.duongNhapDiemCu('7', q('kind=checkpoint:2'), true) === '/test/diem-lop?lop=7&luot=cp%3A2', 'Checkpoint');
    assert(d.duongNhapDiemCu('7', q('kind=final'), false) === '/test/lich?classId=7', 'không quyền Điểm theo lớp → Lịch tuần');
    assert(d.duongNhapDiemCu('abc', q(''), true) === '/test/lich' && d.duongNhapDiemCu('5', q(''), true) === '/test/lich?classId=5', 'id hỏng / không tham số');
  });
}
