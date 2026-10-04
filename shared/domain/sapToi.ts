import { tuanLich } from './hienThiNgay.ts';

/** Ô "Sắp tới" của bảng Học viên & Lớp (chủ sản phẩm 03/10, mục 5): ngắn, chỉ thêm con số kỳ vọng. */
export function chuSapToi(o: {
  nhanLuot: string | null; tuanBatDau: string | null; kyVong: number | null; conLuotChuaXep: string | null;
  duKienThi: { confidence: 'none' | 'month' | 'week'; label: string } | null; homNay: string; khung: 'ft' | 'thuong';
}): string | null {
  if (o.nhanLuot) {
    const tuan = o.tuanBatDau ? ` · ${tuanLich(o.tuanBatDau, o.homNay)}` : '';
    const so = o.kyVong !== null && o.khung === 'ft' ? ` · ${o.kyVong.toFixed(1)}` : '';
    return `${o.nhanLuot}${tuan}${so}`;
  }
  if (o.conLuotChuaXep) return `${o.conLuotChuaXep} · chưa xếp`;
  if (o.khung !== 'ft') return null;
  const nhan = o.duKienThi && o.duKienThi.confidence !== 'none' ? o.duKienThi.label : 'chưa có ngày';
  return `Thi thật · ${nhan}`;
}
