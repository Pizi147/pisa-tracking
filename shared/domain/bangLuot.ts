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

/**
 * THI-THAT (PR-4, mockup v13 C2 / C3): một lần thi thật. Ô so Target overall (`soSanhDiem`); KCK → kq null. `layLai`: kỹ năng lấy KQ lần trước (thi lại
 * một kỹ năng) — ô mờ "↺". `tuan` (P-GV): tuần GV dạy kỹ năng đó cho em / tổng tuần em học kỹ năng đó.
 */
export type KnThiBang = 'l' | 'r' | 'w' | 's';
export type DongThiThatBang = {
  cycleId: number; studentId: number; ten: string; classId: number | null; lop: string; ngay: string | null;
  kn: Record<KnThiBang, ODiemLuot>; ovr: ODiemLuot; target: number | null; kck: boolean; layLai: KnThiBang[];
  tuan?: { day: number; tong: number };
};

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

/** PT-VP-PA (mockup v13 A4): một vi phạm — trạng thái = nhãn cửa trạng thái Ý thức (`TrangThaiViPhamKq.nhan`), `trangThaiT` để tô viên. */
export type DongViPham = {
  id: number; studentId: number; ten: string; classId: number | null; lop: string; ngay: string; nhom: string; moTa: string;
  nguoiGhi: string | null; trangThai: string; trangThaiT: string | null;
};
/** Ô đếm HV của Ý thức: một dòng một em (cùng cột bảng "Học viên cần chú ý"). `bac` = nhãn bậc hiện tại (dịch ở web). */
export type DongViPhamEm = { studentId: number; ten: string; lop: string | null; viPham: number; chuaXuLy: number; bac: string | null; lanXuLy: string | null };
/** Ô đếm lớp của Ý thức ("Lớp có vi phạm"). */
export type DongViPhamLop = { classId: number | null; lop: string; gvcn: string | null; hvViPham: number; siSo: number | null; viPham: number; chuaXuLy: number };
/**
 * PT-VP-PA: một PA (hoặc một nghĩa vụ ghi kết quả của PA — `dot`, `han`, `ngayGhi`, `dungHan`, `treNgay`). `ketQua` = mã kết quả cuối
 * (`improved` · `partial` · `unchanged` · `worse` · `insufficient`) hoặc null = chờ kết quả.
 */
export type DongPa = {
  id: number; studentId: number; ten: string; classId: number | null; lop: string; caseId: number; kyNang: string | null; loaiPa: string;
  batDau: string | null; ketQua: string | null; nguoiPhuTrach: string | null;
  /** Mô tả PA do GV ghi (dòng phụ dưới loại PA). */
  moTa?: string | null;
  dot?: number; han?: string | null; ngayGhi?: string | null; dungHan?: boolean; treNgay?: number | null;
};
