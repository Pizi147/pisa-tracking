/** PHÉP KIỂM PR-DL — Điểm theo lớp: mã lượt, lượt mặc định, nhãn lượt (chủ sản phẩm 04/10, DL-0). */
import type { YThucTestKit } from './yThuc.tests.ts';

export async function runPrDlTests(t: YThucTestKit) {
  const { check, assert } = t;
  const d: any = await import('../../../shared/domain/index.ts');
  console.log('\nPR-DL · Điểm theo lớp');

  check('DL-1 mã lượt đọc/viết hai chiều; sai dạng → null (lớp thường không có số lượt)', () => {
    for (const s of ['mt:1', 'mt:12', 'thuong:progress', 'thuong:final']) {
      const m = d.docMaLuot(s);
      assert(m !== null && d.vietMaLuot(m) === s, `${s} → ${JSON.stringify(m)}`);
    }
    for (const s of ['', 'mt:0', 'mt:-1', 'mt:x', 'thuong:mid', 'thuong:final:1', 'mt:01', 'mt:2;drop', 'mt:1.5', 'MT:1', ' mt:1'])
      assert(d.docMaLuot(s) === null, `"${s}" phải là null`);
  });

  check('DL-1 lượt mặc định = gần nhất còn ô trống; hết ô trống → lượt cuối; rỗng → null', () => {
    const l = (ma: string, tuanStart: string | null, oTrong: number) =>
      ({ ma, nhan: ma, tuanStart, lichSu: false, duDiem: 0, coLich: 3, oTrong });
    const m = (ds: object[]) => d.luotMacDinh(ds);
    assert(m([l('mt:1', '2026-06-01', 2), l('mt:2', '2026-07-13', 3), l('mt:3', '2026-08-24', 0)]) === 'mt:2', 'gần nhất còn trống');
    assert(m([l('mt:1', '2026-06-01', 0), l('mt:2', '2026-07-13', 0)]) === 'mt:2', 'hết trống → cuối');
    assert(m([]) === null, 'rỗng');
    // lượt chưa xếp tuần (PR-LM, tuần NULL): lượt có tuần còn trống được ưu tiên; chỉ chọn lượt NULL khi không lượt có tuần nào còn trống
    assert(m([l('mt:3', null, 2), l('mt:1', '2026-06-01', 1)]) === 'mt:1', 'có tuần ưu tiên hơn NULL');
    assert(m([l('mt:3', null, 2), l('mt:1', '2026-06-01', 0)]) === 'mt:3', 'chỉ NULL còn trống');
    assert(m([l('mt:3', null, 0), l('mt:1', '2026-06-01', 0)]) === 'mt:3', 'hết trống → cuối (NULL xếp cuối)');
  });

  check('DL-1 nhãn lượt (nhanMaLuot; tên nhanLuot đã thuộc fasttrack.ts): MT{n}; lớp thường lấy ATTEMPT_KIND_SHORT', () => {
    assert(d.nhanMaLuot({ loai: 'mt', so: 2 }) === 'MT2', 'MT2');
    assert(d.nhanMaLuot({ loai: 'thuong', kind: 'final' }) === d.ATTEMPT_KIND_SHORT.final, 'final');
    assert(d.nhanMaLuot({ loai: 'thuong', kind: 'progress' }) === d.ATTEMPT_KIND_SHORT.progress, 'progress');
  });
}
