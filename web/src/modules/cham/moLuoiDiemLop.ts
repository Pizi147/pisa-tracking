/**
 * "NHẬP ĐIỂM" Ở HỒ SƠ LỚP = CUỘN TỚI LƯỚI ĐIỂM CỦA LỚP NGAY TRONG TRANG (chủ SP 26/11, thay panel Nhập điểm lớp ở hồ sơ lớp).
 * Nút đầu trang, chip "Nhập điểm · n", ⋯ dòng em đều gọi `moLuoiDiemLop`; `ClassOverviewPage` nghe, mở khối "Điểm … của lớp", chọn đúng lượt
 * và đặt con trỏ vào ô trống đầu. Không có hồ sơ lớp đó đang mở → trả `false` (nơi gọi tự mở panel như cũ, vd. trang Học viên & Lớp).
 */
export type YeuCauLuoiDiem = { classId: number; luot: string | null; loc?: 'trong' | 'cu'; daNhan: boolean };
const SU_KIEN = 'pisa:mo-luoi-diem';

export function moLuoiDiemLop(classId: number, o: { luot?: string | null; loc?: 'trong' | 'cu' } = {}): boolean {
  const d: YeuCauLuoiDiem = { classId, luot: o.luot ?? null, loc: o.loc, daNhan: false };
  window.dispatchEvent(new CustomEvent(SU_KIEN, { detail: d }));
  return d.daNhan;
}

/** Trả hàm gỡ. `nhan` trả `true` khi đã xử lý (nơi gọi không mở panel). */
export function ngheMoLuoiDiem(classId: number, nhan: (d: YeuCauLuoiDiem) => boolean): () => void {
  const f = (e: Event) => { const d = (e as CustomEvent<YeuCauLuoiDiem>).detail; if (d.classId === classId && nhan(d)) d.daNhan = true; };
  window.addEventListener(SU_KIEN, f);
  return () => window.removeEventListener(SU_KIEN, f);
}
