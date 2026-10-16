import type { LoaiNhanLop, PhamViLichTest } from '@shared/domain/index.ts';
import type { ToneNhan } from '../../../ui/Nhan.tsx';

/** Trả lời của `GET /cham/lich-test` (`lichTest` ở server/src/cham/canCham.ts). */
export type LuiLich = {
  kyNang: string; hv: string[];
  tuTuan: string | null; sangTuan: string | null; tuTuanStart: string | null; sangTuanStart: string | null;
  /** Dời do vắng lần mấy (PR-MT) — `null` khi lùi lịch không vì vắng. */
  lanVang: number | null;
};
export type DongNo = {
  key: string; classId: number; classCode: string; mode: 'ielts_band' | 'ratio';
  chuongTrinh: string | null;
  kind: string; attemptNo: number | null; dotLabel: string;
  periodId: number | null; weekStart: string | null;
  kyNang: string[]; kyNangLabel: string;
  conBai: number; soHv: number; attemptIds: number[];
  han: string | null; quaHan: boolean; luiLich: LuiLich | null;
  cuaToi: boolean; duocCham: boolean; coDayLop: boolean; hrefDayDu: string;
  /** PR-VAI-a (UX-B5): tên GV đang nợ, sắp theo tên; rồi `GV chấm chéo` (Speaking Mock, T18); môn chưa phân công → "chưa phân công". */
  gvNo: string[];
  /** OV-11e (TE-7): phần của người có phân công như khối 2; `null` với Quản lý / Quản trị. `quaHan` khi có `phan` = ô của chính họ. */
  phan: PhanCuaBan | null;
};
/** OV-1b (3.5) "Phần của bạn" (kỹ năng L R W S; W1 + W2 cùng người gộp "W"). */
export type PhanCuaBan = {
  toi: { kyNang: string[]; con: number } | null;
  khac: { kyNang: string[]; con: number; quaHanNgay: number | null } | null;
};
export type LopLichTest = {
  key: string; classId: number; classCode: string; mode: 'ielts_band' | 'ratio'; branchName: string;
  /** Mã chương trình lớp + bộ môn (máy chủ, MH2) — thay danh sách 4 môn cố định. */
  chuongTrinh: string | null; boMon: string[];
  kind: string | null; dotLabel: string; kyNangTuan: string[];
  tong: number; daCham: number; conBai: number; conBaiCuaToi: number;
  /** OV-11e: số bài của người xem trong hàng (có `phan`) — dải số cộng phần này thay `tong`. */
  tongCuaToi: number;
  /** OV-1b (3.5): GV — chỉ ô của chính họ quá hạn; Quản lý / Quản trị — mọi ô. */
  han: string | null; quaHan: boolean;
  /** OV-1b (3.5) "Phần của bạn" (kỹ năng L R W S); `null` với Quản lý / Quản trị — họ thấy toàn bộ qua `nhan`. */
  phan: PhanCuaBan | null;
  nhan: { loai: LoaiNhanLop; chu: string };
  moSan: boolean; hrefDayDu: string;
  /** Số bài vắng tuần này đang chờ Quản lý duyệt dời (PR-MT). */
  choDuyetDoi: number;
  /** PR-LT3: tuần thi của hàng — lưới mở tại chỗ đúng tuần này (khối 2 có hàng của nhiều tuần). */
  periodId: number; weekStart: string;
};
/** Dải số (PR-LT3 Q1): đã chấm / còn phải chấm (khối 2 + 3 ở tuần hiện tại; tuần khác: khối 3) · quá hạn chấm = khối 1. */
/** OV-11e (TE-7): người có phân công — số của CHÍNH họ; `khac` = bài của GV khác (ghi nhạt). */
export type TongQuanLich = { daCham: number; tong: number; conPhaiCham: number; no: { bai: number; lop: number }; khac: { con: number; no: number } };
export type LichTest = {
  scopeEmpty: boolean;
  tuan: { id: number; weekStart: string; weekEnd: string } | null;
  /** Tuần đang xem = tuần của hôm nay (chỉ khi đó có khối 2). */
  laTuanNay: boolean;
  phamVi: PhamViLichTest; coPhamViRong: boolean; coPhanCong: boolean;
  lopDangLoc: { id: number; code: string } | null;
  tongQuan: TongQuanLich;
  /** Cùng dải số tách theo khung (MH4) — công tắc Fast Track · Lớp thường. */
  tongQuanKhung: Record<'ft' | 'thuong', TongQuanLich>;
  /** UX-2 (1): ô "Quá hạn chấm" của dải số = Tổng quan "Bài quá hạn" (mọi ô có cờ quá hạn, cả hai khung); `khac` = ô GV khác. */
  quaHanCham: { bai: number; lop: number; khac: number };
  /** Khối 1 "Test quá hạn chấm" — theo hôm nay, không theo tuần đang xem. */
  no: DongNo[];
  /** Khối 2 "Test chấm tuần này" — `null` khi không xem tuần hiện tại. */
  chamTuanNay: LopLichTest[] | null;
  /** Khối 3 "Lịch Test" — tuần đang xem. */
  lop: LopLichTest[];
  /** PR-MT (K2-32): MT lịch sử chưa nhập theo lớp — dòng nhắc mờ cuối trang. */
  nhacLichSu: { classId: number; classCode: string; soEm: number; href: string; luot: { so: number; soEm: number; href: string }[] }[];
};

/** Màu badge theo loại nhãn (N-3): chờ mình = vàng · chờ người khác = chờ · xong = đã xong · chưa tới = xám. */
export const TONE_NHAN_LOP: Record<LoaiNhanLop, ToneNhan> = {
  'da-cham': 'done', 'chua-toi-han': 'muted', 'cho-ban': 'soon', 'cho-gv-khac': 'wait', 'cho-cham': 'wait',
};

/** Khoá một hàng lớp trên màn (nhớ mở/thu, React key): khối 2 có thể có hai hàng cùng lớp ở hai tuần thi khác nhau. */
export const khoaHang = (l: { key: string; periodId: number }) => `${l.periodId}:${l.key}`;
