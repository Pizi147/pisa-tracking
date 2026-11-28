import type { LoaiKhung } from '../congViec/KhoiGiaoViec.tsx';

export type WorkItem = {
  key: string; group: string; urgency: 'overdue' | 'today' | 'normal';
  studentId: number | null; studentName: string;
  classId: number | null; classCode: string | null;
  /** MH4: khung của lớp; `null` = việc không gắn lớp (hiện ở mọi khung). */
  khung?: 'ft' | 'thuong' | null;
  /** CV-TAB b: chi nhánh của lớp (máy chủ `ganKhung`); `null` = việc không gắn lớp → hiện ở mọi chi nhánh. */
  cn?: number | null;
  attemptId: number | null; attemptNo: number | null; caseId: number | null;
  level: { tone: 'ok' | 'info' | 'warn' | 'danger'; text: string } | null;
  reason: string; actionLabel: string; href: string;
  /** Tiêu đề dòng: động từ + đối tượng (B-2). */
  tieuDe: string;
  ownerId: number | null; owner: string | null; mine: boolean;
  due: string | null; statusLabel: string;
  /** Bài/Case liên quan — ô thứ hai của dòng việc: "MT2", "Giữa khoá", "Case". */
  contextLabel: string | null;
  /** Số học viên trong một dòng việc gom. NULL khi dòng chỉ nói về một em. */
  count: number | null;
  /** PR-Ra Q5: chỉ dòng có người phụ trách là TÀI KHOẢN KHÁC người xem, và người xem là QL/QT. */
  /** PR-GOP (§5): dòng gộp "Loại việc · lớp · n em" — các việc thật bên trong (mỗi việc giữ nút, hạn riêng). */
  con?: (WorkItem & { conTen: string; conPhu: string })[];
  /** OV-5a: PA của việc (Kết quả PA, Xác nhận PA, Mini Test) · Nhập điểm: mã lượt (`mt:2`) + kỹ năng — panel Công việc mở đúng chỗ. */
  paId?: number | null; luot?: string; kn?: string; soBai?: number;
  /** GD-1: việc chung Chấm Speaking — số bài quá hạn của nhóm (đầu tab). */
  baiQuaHan?: number;
  /** OV-15b: mọi kỹ năng của việc Nhập điểm — panel chỉ hiện các cột này. */
  kns?: string[];
  /** NHẸ HƠN PR-2a: Nhập điểm, chỉ Admin — từng em còn thiếu kỹ năng nào (panel lớp). */
  emThieu?: { id: number; ten: string; kns: string[] }[];
  /** PTA rà #2001: dòng Điểm Admin gộp một lớp · đợt (web, `gopDiemAdmin`). */
  gopLop?: boolean;
  /** OV-13b: Kết quả PA ghi nhanh được (máy chủ `ghiNhanhDuoc`) — CV-LOI: form gọn trong khung phải. */
  ghiNhanh?: boolean;
  /** NHAP-KQ-PA: Kết quả PA có nháp lưu trên máy chủ (chưa chốt) — chip "Có nháp". */
  coNhap?: boolean;
  /** PHOI-HOP-V2 (mockup #1368): dòng Phối hợp SOS (lớp × việc) — loại + khoá việc (panel lọc đúng việc); `emTen` = tên ≤ 3 em đầu (chip ở ô việc). */
  phoiHop?: { kind: string; khoa: string };
  emTen?: string[];
  /** CV-LOI (A13): Case chưa có người phụ trách vì lớp thiếu GV môn (`mon`) / GVCN (`mon` null) — panel Phân công đúng ô đó. */
  thieuNguoi?: { mon: string | null };
  /** OV-11c: id em của việc cả lớp (Nhập điểm theo bài…) — panel Nhập điểm đưa em của việc lên đầu. */
  emIds?: number[];
  /** [XM7] SUA-GOP-2511: Bổ sung hồ sơ — lớp · tên · thiếu gì từng em (hiển thị; không phải việc con). */
  emBoSung?: { id: number; ten: string; lop: string | null; thieu: string }[];
  /** OV-13c: tuần thi (thứ Hai) · mức SOS · Nhập điểm: tuần + loại bài (lưới Lịch Test) · Xác nhận PA: PA đang chờ. */
  tuanThi?: string | null; sos?: number | null; periodId?: number | null; kind?: string | null; phu?: string | null;
  pa?: { kind: string; moTa: string | null; nguoiId: number | null; nguoi: string | null; soBuoi?: number | null };
  /** OV-13q: Cập nhật kết quả thi thật · Chọn bước tiếp — lộ trình (nút Gia hạn) + hạn đã gia hạn. */
  cycleId?: number; daGiaHan?: boolean;
  /** UI-CV-TVV: Báo PH — id việc (`viec_bao_ph`) · số lần "Chưa liên hệ được". */
  viecId?: number; soLanThu?: number;
  /** TUYEN-2: Báo PH theo nguồn × đợt — gộp "n em" theo lớp × nguồn. */ gopNguon?: string;
  /** LPB-1 (N73 ⑤): việc có khung (Phụ trách · Hạn · Theo dõi · Việc con) — panel bọc `KhungViecChung` (LPB-3). */
  khungViec?: { loai: LoaiKhung; id: number | null };
  /** LPB-0 / LPB-2b: Báo PH · Chuyển lớp — lớp NGUỒN của lệnh + mã tuần vào lớp mới (dòng "Chuyển lớp · vào W3 SEP"). */
  nhomChuyenLop?: { lopId: number; ma: string; vao?: string | null; chiTiet?: string | null } | null;
  /** VAI-1 XM-2: việc TVV về Lead TVV / Head vì em chưa có TVV (`chua_co`) / TVV đã nghỉ (`da_nghi`). */
  khongTvv?: 'chua_co' | 'da_nghi';
  /** SOS-TAM-PA: dòng Xác nhận PA là "Chọn PA" (HD3-2: thẻ Hướng dẫn riêng). */
  chonPa?: boolean;
  /** BO-QUA-XEP-MT: QL bỏ qua được ngay trên dòng (việc `moc:` Xếp lịch MT / Nhập dự kiến thi). */
  boQuaDuoc?: boolean;
  /** TL-1: Báo PH "Chờ GV sửa" — hạn tạm dừng (máy chủ đã để `urgency` normal); cột hạn không tô quá hạn. */
  choGvSua?: boolean;
  /** GV-2 (N58): việc người khác giao cho tôi — tên người giao (thẻ "{tên} giao"). */
  giaoBoi?: string | null;
  /** VH-1 / VH-1b: việc Vận hành được giao — nhóm tự đặt (vạch trong mục "Việc được giao", V5) · hạng mục chính thống (N62, mục chứa dòng). */
  nhomViec?: { id: number; ten: string; thuTu: number } | null;
  /** B3-12: việc Vận hành — tiến độ hiện tại (`TASK_PROGRESS`), cho nút "Hoàn thành" trên dòng + Hoàn tác về đúng tiến độ trước. */
  tienDo?: string;
  /** B2-06: việc Vận hành có HV liên quan — tên các em (dòng phụ). */
  hocVienLienQuan?: string;
  hangMuc?: string | null;
  /** TL-2 (mockup v22 T4a): việc "Vi phạm bị trả lại" — người trả (thẻ "{tên} trả"). */
  nguoiTra?: string | null;
  /** GV-2: dòng Xếp lịch họp · Kết quả meeting — id hành động Meeting (panel `/phoi-hop-sos/:id/meeting`). */
  phoiHopId?: number;
};

/** OV-13d: loại việc Ý thức mà dòng gộp theo lớp mở panel lô (`LoYThucPanel`) — `PanelViec` đọc cùng tập này. */
export const VIEC_LO_Y_THUC: ReadonlySet<string> = new Set(['yt_xu_ly', 'yt_xem']);
