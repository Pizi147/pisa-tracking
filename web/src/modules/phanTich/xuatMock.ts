import { api } from '../../lib/api.ts';
import { fmtBand } from '../../lib/format.ts';
import { dich, t } from '@shared/i18n/index.ts';
import { KN_THI, NHAN_KET_QUA_MOCK, ngay, nhanKhoang, tuanLich, type KetQuaMockKq } from '@shared/domain/index.ts';
import { thamSoLoc, type PhamViPhanTich } from './dungChung.tsx';

/**
 * PR-4 THI-THAT (XM-3): Excel Mock Test của tab "Kết quả Test" cũ — nay ở ⋯ Test + SOS ("Xuất kết quả từng lượt") cho vai KHÔNG có `xuatMt`
 * (vai có `xuatMt` giữ hộp xuất đầy đủ). Cùng dữ liệu, cùng cột nút cũ. Chỉ gọi khi bấm.
 */
export async function xuatExcelMock(pv: PhamViPhanTich, homNay: string): Promise<void> {
  const data = await api.get<KetQuaMockKq>(`/phan-tich/ket-qua-thi?${thamSoLoc({ ...pv, ct: 'ft' }, { loai: 'mock', xep: 'lop' })}`);
  const XLSX = await import('xlsx');
  const aoa: (string | number)[][] = [
    [[t('Mock Test'), nhanKhoang(pv.khoang).chinh, t('dữ liệu đến {ngay}', { ngay: ngay(homNay) })].join(' · ')], [],
    [t('Học viên'), t('Lớp'), 'MT', t('Tuần'), 'OVR', 'L', 'R', 'W', 'S', t('Kỳ vọng'), t('Kết quả'), 'SOS', 'Case / PA', t('Việc tiếp')],
    ...data.rows.map((r) => [r.ten, r.lop, `MT${r.mt}`, tuanLich(r.tuan, homNay), fmtBand(r.ovr), ...KN_THI.map((k) => fmtBand(r.kn[k].band)), fmtBand(r.kyVong),
      NHAN_KET_QUA_MOCK[r.ketQua], r.sos ? `SOS ${r.sos}${r.sosTam ? ` ${t('tạm')}` : ''}` : '', r.casePa ?? '', r.viecTiep ? dich(r.viecTiep) : '']),
  ];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(aoa), 'Mock Test');
  XLSX.writeFile(wb, `ket-qua-thi-mock-${ngay(homNay).split('/').join('-')}.xlsx`);
}
