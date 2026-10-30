/**
 * BÀN GIAO ĐỔI GV (PR-B, đặc tả 2026-10-30-phan-cong-gv-design.md mục 2.7, 2b): luật thuần + kiểu phiếu. Máy chủ và web dùng chung.
 * Một việc = (lớp, GV cũ, hiệu lực); mỗi cột = một kỹ năng hoặc vai GVCN; mỗi em một góp ý mỗi cột (bắt buộc = không để trống).
 */
import type { TuDien } from './chuyenLop.ts';
import { tenMonNgan } from './normal.ts';

/** Nhãn ngắn của cột: 'gvcn' → "GVCN", kỹ năng → tên ngắn theo chương trình (L, W1, G+V…). */
export const nhanCotBg = (ct: string | null, mon: string) => (mon === 'gvcn' ? 'GVCN' : tenMonNgan(ct, mon));

export type GopYGv = { noiDung: string; nguoiGhi: string; ghiLuc: string; dienThay: boolean };
export type PhieuBanGiaoGvDto = {
  id: number; lop: { id: number; code: string; ct: string | null }; nguoiCu: { id: number; ten: string };
  cot: { mon: string; nhan: string; ten: string; nguoiMoi: { id: number; ten: string } }[];
  han: string; hieuLuc: string; trangThai: 'mo' | 'xong' | 'huy'; homNay: string;
  nhanXetChung: string | null; xacNhan: { boi: string; luc: string; thay: boolean } | null;
  em: { studentId: number; ten: string; tuDien: TuDien | null; gopY: Record<string, GopYGv | null> }[];
  /** `viet`: ghi góp ý / nhận xét chung · `xacNhan`: bấm Xác nhận · `thay`: QL điền thay (góp ý ghi `dien_thay`). */
  nguoiXem: { viet: boolean; xacNhan: boolean; thay: boolean };
};

/** Trạng thái một em trên phiếu: "Đủ" · "Thiếu {cột}" (một cột còn trống) · "Chưa có" (chưa cột nào / thiếu nhiều cột). */
export function trangThaiEmBg(cot: readonly string[], gopY: Record<string, unknown | null>, nhan: (mon: string) => string = (m) => (m === 'gvcn' ? 'GVCN' : m)): { khoa: 'du' | 'thieu' | 'chua'; nhan: string } {
  const thieu = cot.filter((m) => !gopY[m]);
  if (!thieu.length) return { khoa: 'du', nhan: 'Đủ' };
  if (thieu.length === cot.length) return { khoa: 'chua', nhan: 'Chưa có' };
  return { khoa: 'thieu', nhan: `Thiếu ${thieu.map(nhan).join(', ')}` };
}
