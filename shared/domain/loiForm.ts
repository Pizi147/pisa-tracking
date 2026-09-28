/**
 * LUẬT BÁO LỖI FORM (PR-N1, YC-12.5.2): rời ô → viền đỏ + câu lý do DƯỚI ô; sau khi bấm Lưu, chân form chỉ có một dòng
 * xám "n ô cần sửa ↑" (chủ sản phẩm 28/09: chữ vàng liệt kê luật ở chân quá gắt — lý do đã nằm dưới từng ô).
 */
export type LuatTruong = { khoa: string; nhan: string; toiThieu?: number; chon?: boolean };
export type LoiTruong = { khoa: string; nhan: string; lyDo: string };

/** 'Chưa chọn' | 'Chưa điền' | 'Cần ít nhất 15 ký tự (đang có 8)' | null (hợp lệ). */
export function kiemTruong(l: LuatTruong, giaTri: unknown): string | null {
  if (l.chon) return giaTri ? null : 'Chưa chọn';
  const n = typeof giaTri === 'string' ? giaTri.trim().length : 0;
  if (l.toiThieu && n < l.toiThieu) return l.toiThieu <= 1 ? 'Chưa điền' : `Cần ít nhất ${l.toiThieu} ký tự (đang có ${n})`;
  return null;
}

export function dsLoi(luat: readonly LuatTruong[], giaTri: Record<string, unknown>): LoiTruong[] {
  return luat.flatMap((l) => { const lyDo = kiemTruong(l, giaTri[l.khoa]); return lyDo ? [{ khoa: l.khoa, nhan: l.nhan, lyDo }] : []; });
}

/** Chân form: trung tính, không lặp luật. '' khi không còn ô lỗi. */
export function nhanCanSua(soO: number): string {
  return soO > 0 ? `${soO} ô cần sửa ↑` : '';
}
