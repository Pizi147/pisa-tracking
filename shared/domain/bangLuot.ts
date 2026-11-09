/**
 * PANEL BẢNG CÓ ĐIỂM (PT-PANEL, kế hoạch 2026-11-05, mockup v13 A1 / A2) — kiểu dữ liệu chung máy chủ ↔ `web/src/ui/BangLuotPanel.tsx`.
 * Máy chủ trả `{ n, tieuDe, rows, bangLuot: true, kieu, knNhan?, cachTinh?, chiNhanh? }`; mỗi dòng mang `luotDiem` (kiểu 'luot') hoặc `tangGiam` (kiểu 'tang-giam').
 */
import { t } from '../i18n/index.ts';
import { nhomViecCua } from './tongQuan.ts';

export type KieuBangLuot = 'luot' | 'tang-giam' | 'bai-thuong' | 'vi-pham' | 'pa' | 'thi-that' | 'viec';
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

/**
 * DEM-QUA-HAN b (chủ SP 06/11): panel ô "Việc đúng hạn" / "Chấm Test đúng hạn" (Phân tích GV, hồ sơ GV) — một dòng một VIỆC (hoặc một bài) có hạn trong kỳ.
 * `mo` = còn mở, đã quá hạn (đứng đầu panel) · đã làm: `ngayXong` + `dung` (đúng / trễ `treNgay`). `href` mở đúng việc (như Công việc).
 * Tab theo loại / tuyến (`tabViecHanCua`) — không tab Chấm Test (cột riêng); panel Chấm Test mọi dòng `cham`.
 */
export const TAB_VIEC_HAN = ['case', 'ban-giao', 'y-thuc', 'bao-ph', 'khac', 'cham'] as const;
export type TabViecHan = (typeof TAB_VIEC_HAN)[number];
export const TAB_VIEC_HAN_LABEL: Record<TabViecHan, string> = {
  case: t('Case – PA – Kết quả'), 'ban-giao': t('Bàn giao'), 'y-thuc': t('Ý thức & Phối hợp'), 'bao-ph': t('Báo PH'), khac: t('Khác'), cham: t('Chấm Test'),
};
/** Loại việc Công việc (`WorkGroupKey`) → tab: Bàn giao · Xử lý vi phạm · Báo PH riêng (Báo PH sau vi phạm + Báo PH qua TVV — như mục "Báo PH" của
 *  Công việc, RA-LOI-0711i); nhóm Case học thuật (Case, PA, Phối hợp SOS) chung một tab; còn lại Khác. Nhãn tab theo chữ chủ SP chốt 06/11. */
export const tabViecHanCua = (group: string): TabViecHan =>
  group === 'ban_giao' ? 'ban-giao' : group.startsWith('yt_') ? 'y-thuc' : group === 'bao_ph_yt' || group === 'phoi_hop' ? 'bao-ph'
    : nhomViecCua(group) === 'case-hoc-thuat' ? 'case' : 'khac';
export type DongViecHan = {
  tab: TabViecHan; mo: boolean; ten: string; phu?: string | null;
  em: { id: number; ten: string } | null; lop: { id: number | null; ma: string } | null;
  han: string | null; ngayXong: string | null; dung: boolean; treNgay: number | null; href: string;
  /** SỔ NGHĨA VỤ (PR-2): 3 tab Chưa làm · Làm muộn · Đúng hạn. Vắng (panel cũ) = suy từ `mo` / `dung`. `treNgay` = số ngày muộn / quá hạn. */
  trangThai?: 'chua' | 'muon' | 'dung';
  /** Hạn gốc khi đã đặt lại hạn (khác `han`) · phân công nhập sau hạn · bài S chéo chung chưa ai nhận · tên chi nhánh (xem tổng mọi chi nhánh). */
  hanGoc?: string | null; pcNhapSau?: boolean; sChung?: boolean; chiNhanh?: string | null;
};
