/**
 * PHÉP KIỂM V5 · UI-CONG-VIEC (`08` mục 6 dòng UI-CONG-VIEC; T01, T14) — luật thuần của danh sách Công việc:
 *  · T01 + CONG-VIEC-2: mọi em (kể cả một việc) → một khối tên em + từng việc; dòng gộp lớp chỉ một em ("1 em · 2 việc") tách ra; dòng nhiều em / làm cả dòng giữ;
 *  · T14: vạch hạn Chấm điểm — quá hạn · đến hết Chủ nhật tuần này · sau đó.
 */
import type { YThucTestKit } from './yThuc.tests.ts';

export async function runPrUiCongViecTests(t: YThucTestKit) {
  const { check, assert } = t;
  const d: any = await import('../../../shared/domain/index.ts');
  console.log('\nV5 · UI-CONG-VIEC — dòng theo em, vạch hạn');
  const v = (key: string, studentId: number | null, con?: any[]) => ({ key, studentId, studentName: studentId ? `Em ${studentId}` : 'Lớp A', classCode: 'A', con });

  check('UI-CONG-VIEC T01 · em có Case R + Case W1 (gộp lớp một em) → một khối em hai việc, đứng ở chỗ việc đầu', () => {
    const ds = [v('x', 1), v('gop:1', null, [v('r', 2), v('w', 2)]), v('y', 3)];
    const ra = d.xepTheoEm(ds, () => false);
    assert(ra.map((m: any) => m.kieu).join(',') === 'em,em,em', `kiểu: ${ra.map((m: any) => m.kieu)}`);
    assert(ra[1].viec.map((x: any) => x.key).join(',') === 'r,w' && ra[1].ten === 'Em 2', 'khối em = hai việc của em 2');
    assert(ra[0].viec.length === 1 && ra[0].ten === 'Em 1', 'CONG-VIEC-2: em một việc cũng là khối em (một dáng)');
  });
  check('UI-CONG-VIEC T01 · hai việc lẻ cùng em ở xa nhau → gom về chỗ việc đầu; dòng gộp nhiều em và dòng làm cả dòng giữ nguyên', () => {
    const nhieu = v('gop:2', null, [v('a', 5), v('b', 6)]);
    const caDong = v('gop:3', null, [v('c', 7), v('e', 7)]);
    const ra = d.xepTheoEm([v('p', 4), nhieu, caDong, v('q', 4)], (x: any) => x.key === 'gop:3');
    assert(ra.length === 3 && ra[0].kieu === 'em' && ra[0].viec.map((x: any) => x.key).join(',') === 'p,q', 'khối em 4 = p, q');
    assert(ra[1].it === nhieu && ra[2].it === caDong, 'gộp nhiều em / làm cả dòng giữ');
  });
  check('CONG-VIEC-2 · việc tiếp đi hết nhóm: sau việc đang mở rồi vòng lên đầu nhóm; hết nhóm → null', () => {
    const ds = [{ key: 'a', nhom: 'cham', mine: true }, { key: 'b', nhom: 'case', mine: true }, { key: 'c', nhom: 'cham', mine: true }, { key: 'd', nhom: 'cham', mine: true }];
    const ke = (hien: string, xong: string[] = []) => d.viecKeTiepVong(ds, hien, (x: any) => !xong.includes(x.key))?.key ?? null;
    assert(ke('c') === 'd', 'sau việc đang mở trước');
    assert(ke('d') === 'a', 'việc cuối nhóm → vòng lên đầu nhóm (bỏ nhóm khác b)');
    assert(ke('d', ['a', 'c']) === null, 'cả nhóm xong → null (thẻ Hết việc)');
    assert(ke('zz') === null, 'việc đang mở không còn → null');
  });
  check('UI-CONG-VIEC T14 · vạch hạn: quá hạn · đến hết CN tuần này · sau (hôm nay T2 14/09 → CN 20/09)', () => {
    const ds = [{ urgency: 'overdue', due: '2026-09-09' }, { urgency: 'normal', due: '2026-09-20' }, { urgency: 'normal', due: '2026-09-23' }];
    const r = d.chiaVachHan(ds, '2026-09-14');
    assert(r.quaHan.length === 1 && r.denHetTuan.length === 1 && r.sau.length === 1 && r.cuoiTuan === '2026-09-20', JSON.stringify(r));
  });
}
