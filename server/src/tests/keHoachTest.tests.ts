/**
 * PHÉP KIỂM PR-Rc2: Kế hoạch Test (spec §3.5 "Kế hoạch Test"; kiểm kê §1.4 R9, R9b, R10, R11, R12, R14; §3 dòng 14).
 * Kế hoạch: docs/superpowers/plans/2026-09-23-pr-rc2-ke-hoach-test.md.
 *
 * Harness do `run.ts` sở hữu và truyền vào; file này không tự mở database.
 */
import type { YThucTestKit } from './yThuc.tests.ts';

export async function runKeHoachTestTests(t: YThucTestKit) {
  const { check, assert } = t;
  const d: any = await import('../../../shared/domain/index.ts');
  console.log('\nPR-Rc2 · Kế hoạch Test');

  check('PR-Rc2 · Q2 dotDaHoanTat — biên hoàn tất, dấu "-", Chủ nhật, kỹ năng huỷ', () => {
    const skillDiem = (coDiem: boolean, coDau = false, huy = false) => (
      { batBuoc: true, huy, coDiem, coDau }
    );
    assert(
      d.dotDaHoanTat({
        cheDo: 'ielts_band', kn: [skillDiem(false, true)], chuNhatCuoi: '2026-09-27', homNay: '2026-09-28',
      }) === true,
      'FT có dấu "-" (coDau) và đã qua Chủ nhật phải hoàn tất',
    );
    assert(
      d.dotDaHoanTat({
        cheDo: 'ratio', kn: [skillDiem(false, true)], chuNhatCuoi: '2026-09-27', homNay: '2026-09-28',
      }) === false,
      'Lớp thường không có khái niệm dấu "-" chốt vắng — coDau không tính, không hoàn tất',
    );
    assert(
      d.dotDaHoanTat({
        cheDo: 'ielts_band', kn: [skillDiem(true)], chuNhatCuoi: '2026-09-27', homNay: '2026-09-27',
      }) === false,
      'Đúng Chủ nhật của tuần cuối thì CHƯA hoàn tất (phải QUA Chủ nhật)',
    );
    assert(
      d.dotDaHoanTat({
        cheDo: 'ielts_band', kn: [skillDiem(true)], chuNhatCuoi: '2026-09-27', homNay: '2026-09-28',
      }) === true,
      'Thứ Hai sau Chủ nhật thì hoàn tất',
    );
    assert(
      d.dotDaHoanTat({
        cheDo: 'ielts_band', kn: [skillDiem(false, false, true)], chuNhatCuoi: '2026-09-27', homNay: '2026-09-28',
      }) === false,
      'Kỹ năng bắt buộc duy nhất đã huỷ phần thi → không còn kỹ năng bắt buộc nào → không bao giờ hoàn tất',
    );
  });

  check('PR-Rc2 · trangThaiNhom đủ 5 trạng thái', () => {
    const kn = (batBuoc: boolean, tuan: string | null, xong: boolean, daDoi: boolean) => (
      { batBuoc, tuan, xong, daDoi }
    );
    assert(d.trangThaiNhom([kn(false, null, false, false)]) === 'khong-yeu-cau', 'Không kỹ năng bắt buộc');
    assert(d.trangThaiNhom([kn(true, '2026-09-21', true, false)]) === 'xong', 'Mọi kỹ năng bắt buộc đã xong');
    assert(d.trangThaiNhom([kn(true, null, false, false)]) === 'chua-xep', 'Còn kỹ năng bắt buộc chưa có tuần');
    assert(d.trangThaiNhom([kn(true, '2026-09-21', false, true)]) === 'da-doi', 'Có kỹ năng đã dời vì vắng');
    assert(d.trangThaiNhom([kn(true, '2026-09-21', false, false)]) === 'da-xep', 'Đã xếp tuần, chưa xong, không dời');
  });

  check('PR-Rc2 · Q6 tuanDaSo — hoà chọn tuần sớm hơn', () => {
    const r = d.tuanDaSo(['2026-10-05', '2026-10-05', '2026-09-28', '2026-09-28']);
    assert(r.tuan === '2026-09-28', `Hoà 2-2 phải chọn tuần sớm hơn, ra "${r.tuan}"`);
    assert(r.khac.length === 1 && r.khac[0].tuan === '2026-10-05' && r.khac[0].n === 2, 'Tuần còn lại kèm đúng số em');
    const doc = d.tuanDaSo(['2026-09-21', '2026-09-21', '2026-09-21', '2026-09-28']);
    assert(doc.tuan === '2026-09-21' && doc.khac.length === 1 && doc.khac[0].n === 1, 'Không hoà thì chọn đa số thật');
    assert(d.tuanDaSo([null, null]).tuan === null, 'Toàn null thì không có tuần đa số');
  });

  check('PR-Rc2 · Q10 tieuDeKeHoach', () => {
    assert(d.tieuDeKeHoach(true, false) === 'Kế hoạch Mock Test', 'Chỉ có lớp FT');
    assert(d.tieuDeKeHoach(true, true) === 'Kế hoạch Test', 'Có cả lớp thường');
    assert(d.tieuDeKeHoach(false, true) === 'Kế hoạch Test', 'Chỉ có lớp thường');
  });

  check('PR-Rc2 · Q15 laVaoMuon — quá 14 ngày kể từ khai giảng', () => {
    assert(d.laVaoMuon('2026-09-25', '2026-09-10') === true, 'Muộn 15 ngày phải tính là vào muộn');
    assert(d.laVaoMuon('2026-09-24', '2026-09-10') === false, 'Đúng 14 ngày thì chưa tính là vào muộn');
    assert(d.laVaoMuon(null, '2026-09-10') === false, 'Thiếu ngày vào lớp thì không suy diễn');
  });

  check('PR-Rc2 · tomTatXemTruoc — gộp câu tạo/đổi/lỗi, không tự đọc ngày', () => {
    const tuanLich = (dt: string | null) => (dt === '2026-10-19' ? 'W3 OCT' : dt === '2026-10-26' ? 'W4 OCT' : dt === '2026-09-21' ? 'W1 SEP' : dt === '2026-09-28' ? 'W2 SEP' : '');
    const dong: any[] = [
      { hanhDong: 'tao', den: { rlw: '2026-10-19', s: '2026-10-26' } },
      { hanhDong: 'tao', den: { rlw: '2026-10-19', s: '2026-10-26' } },
      { hanhDong: 'doi', tu: { rlw: '2026-09-21' }, den: { rlw: '2026-09-28' } },
      { hanhDong: 'giu' },
      { hanhDong: 'loi' },
    ];
    const cau = d.tomTatXemTruoc(dong, tuanLich);
    assert(cau.some((c: string) => c === '2 em chưa có → W3/W4 OCT'), `Thiếu câu "tạo" gộp đúng tháng, ra ${JSON.stringify(cau)}`);
    assert(cau.some((c: string) => c === '1 em W1 SEP → W2 SEP (đổi)'), `Thiếu câu "đổi", ra ${JSON.stringify(cau)}`);
    assert(cau.some((c: string) => c === '1 em không xếp được'), `Thiếu câu "lỗi", ra ${JSON.stringify(cau)}`);
    assert(cau.length === 3, `Dòng "giu" không sinh câu nào, tổng phải đúng 3, ra ${cau.length}`);
  });
}
