import { tuanLich } from './hienThiNgay.ts';
import { nhanLichThi, type LichThi } from './lichThiOv15f.ts';
import { t } from '../i18n/index.ts';

/** Ô "Sắp tới" của bảng Học viên & Lớp (chủ sản phẩm 03/10, mục 5): ngắn, chỉ thêm con số kỳ vọng. */
export function chuSapToi(o: {
  nhanLuot: string | null; tuanBatDau: string | null; kyVong: number | null; conLuotChuaXep: string | null;
  /** LT-SV: trạng thái lịch thi thật (`trangThaiLichThi`) — chữ bằng MỘT hàm nhãn. */
  lichThi: LichThi | null; homNay: string; khung: 'ft' | 'thuong';
}): string | null {
  if (o.nhanLuot) {
    const tuan = o.tuanBatDau ? ` · ${tuanLich(o.tuanBatDau, o.homNay)}` : '';
    const so = o.kyVong !== null && o.khung === 'ft' ? ` · ${o.kyVong.toFixed(1)}` : '';
    return `${o.nhanLuot}${tuan}${so}`;
  }
  if (o.conLuotChuaXep) return t('{conLuotChuaXep} · chưa xếp', { conLuotChuaXep: o.conLuotChuaXep });
  if (o.khung !== 'ft') return null;
  return o.lichThi ? nhanLichThi(o.lichThi, o.homNay) : null;
}
