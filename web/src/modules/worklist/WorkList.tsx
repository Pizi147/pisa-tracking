export type WorkItem = {
  key: string; group: string; urgency: 'overdue' | 'today' | 'normal';
  studentId: number | null; studentName: string;
  classId: number | null; classCode: string | null;
  /** MH4: khung của lớp; `null` = việc không gắn lớp (hiện ở mọi khung). */
  khung?: 'ft' | 'thuong' | null;
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
  /** OV-15b: mọi kỹ năng của việc Nhập điểm — panel chỉ hiện các cột này. */
  kns?: string[];
  /** OV-13b: Kết quả PA ghi nhanh được (máy chủ `ghiNhanhDuoc`) — CV-LOI: form gọn trong khung phải. */
  ghiNhanh?: boolean;
  /** CV-LOI (A13): Case chưa có người phụ trách vì lớp thiếu GV môn (`mon`) / GVCN (`mon` null) — panel Phân công đúng ô đó. */
  thieuNguoi?: { mon: string | null };
  /** OV-11c: id em của việc cả lớp (Nhập điểm theo bài…) — panel Nhập điểm đưa em của việc lên đầu. */
  emIds?: number[];
  /** OV-13c: tuần thi (thứ Hai) · mức SOS · Nhập điểm: tuần + loại bài (lưới Lịch Test) · Xác nhận PA: PA đang chờ. */
  tuanThi?: string | null; sos?: number | null; periodId?: number | null; kind?: string | null; phu?: string | null;
  pa?: { kind: string; moTa: string | null; nguoiId: number | null; nguoi: string | null; soBuoi?: number | null };
  /** OV-13q: Cập nhật kết quả thi thật · Chọn bước tiếp — lộ trình (nút Gia hạn) + hạn đã gia hạn. */
  cycleId?: number; daGiaHan?: boolean;
  /** UI-CV-TVV: Báo PH — id việc (`viec_bao_ph`) · số lần "Chưa liên hệ được". */
  viecId?: number; soLanThu?: number;
};
export type WorkGroup = { key: string; label: string; hint: string; items: WorkItem[]; overdue: number; today: number };

/** OV-13d: loại việc Ý thức mà dòng gộp theo lớp mở panel lô (`LoYThucPanel`) — `PanelViec` đọc cùng tập này. */
export const VIEC_LO_Y_THUC: ReadonlySet<string> = new Set(['yt_xu_ly', 'yt_xem']);
