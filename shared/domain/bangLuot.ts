/**
 * PANEL BẢNG CÓ ĐIỂM (PT-PANEL, kế hoạch 2026-11-05, mockup v13 A1 / A2) — kiểu dữ liệu chung máy chủ ↔ `web/src/ui/BangLuotPanel.tsx`.
 * Máy chủ trả `{ n, tieuDe, rows, bangLuot: true, kieu, knNhan?, cachTinh?, chiNhanh? }`; mỗi dòng mang `luotDiem` (kiểu 'luot') hoặc `tangGiam` (kiểu 'tang-giam').
 */
export type KieuBangLuot = 'luot' | 'tang-giam' | 'bai-thuong' | 'vi-pham' | 'pa' | 'thi-that';
export type KnLuot = 'l' | 'r' | 'w1' | 'w2' | 's';
export type KqDiem = 'vuot' | 'bang' | 'duoi' | null;

/** Một ô điểm: band + so kỳ vọng của lượt; `tc` tiêu chí c1–c4 (W / S), `raw` [câu đúng, tổng câu] (L / R) — hộp chi tiết tại chỗ. null = chưa có điểm ("—"). */
export type ODiemLuot = { v: number; kq: KqDiem; tc?: (number | null)[] | null; raw?: [number, number] | null } | null;

/** Một lượt FT. `knCua` (Phân tích GV): kỹ năng GV phụ trách ở dòng — tô nền như `knNhan` của cả panel. */
export type DongLuotDiem = {
  attemptId: number; studentId: number; ten: string; classId: number | null; lop: string; mt: number; tuan: string;
  kn: Record<KnLuot, ODiemLuot>; ovr: ODiemLuot; kyVong: number | null; knCua?: KnLuot[];
};

/** Ô Tăng / Giữ / Giảm: điểm MỘT kỹ năng lượt trước → lượt sau (cùng em), chênh, kỳ vọng của lượt sau. `kn` = nhãn ngắn ("W1"). */
export type DongTangGiam = {
  attemptId: number; studentId: number; ten: string; classId: number | null; lop: string; kn: string;
  truoc: { mt: number; v: number }; sau: { mt: number; v: number; kq: KqDiem }; chenh: number; kyVong: number | null;
};

export const KN_LUOT_BANG: Record<KnLuot, string> = { l: 'listening', r: 'reading', w1: 'writing1', w2: 'writing2', s: 'speaking' };
export const KN_LUOT_CUA: Record<string, KnLuot> = { listening: 'l', reading: 'r', writing1: 'w1', writing2: 'w2', speaking: 's' };
export const NHAN_KN_LUOT: Record<KnLuot, string> = { l: 'L', r: 'R', w1: 'W1', w2: 'W2', s: 'S' };
export const soSanhDiem = (v: number, kv: number | null): KqDiem => (kv === null ? null : v < kv ? 'duoi' : v > kv ? 'vuot' : 'bang');

/** PT-LOP-THUONG (mockup v13 A3): ô một môn của bài lớp thường — câu đúng / tổng, đạt theo ngưỡng của lớp (null = môn bỏ / chưa đủ căn cứ). null = chưa có điểm. */
export type ODiemMon = { dung: number; tong: number; dat: boolean | null } | null;
/**
 * Một bài lớp thường (Progress Test / Final Test). `mon` theo thứ tự môn của chương trình, khoá = tên ngắn ("L", "G+V"). `tong` = % tổng (chỉ Final Test).
 * `monCua` (Phân tích GV): môn GV phụ trách ở dòng — viền nhấn.
 */
export type DongBaiThuong = {
  attemptId: number; studentId: number; ten: string; classId: number | null; lop: string; chuongTrinh: string;
  bai: string; nhanBai: string; tuan: string; mon: Record<string, ODiemMon>; tong: number | null; datTong: boolean | null; monCua?: string[];
};
