/**
 * KIỂU DỮ LIỆU Ý THỨC v4 phía giao diện (PR-YT4) — khớp JSON của `server/src/yThuc/xuLy.ts` (`yThucHocVien`, `xemXuLy`) và
 * `board.ts` (`bangYThucLop`). Một chỗ khai, mọi thành phần trong `modules/yThuc/` đọc từ đây.
 */
import { invalidate, invalidateDung } from '../../lib/api.ts';
/* Đường tương đối (không `@shared`): phép kiểm máy chủ nạp tệp này (R3-T5, `prCache.tests.ts`). */
import type { NhomEm, TheYeuCauDto, TrangThaiVp } from '../../../../shared/domain/index.ts';
import type { ChuKhoa } from '../../../../shared/i18n/index.ts';

export type ViPhamV4 = {
  id: number; studentId: number; studentName: string; classCode: string | null; cycleId: number | null;
  category: string; categoryLabel: string; skill: string | null; skillLabel: string | null;
  occurredOn: string; reportedOn: string; reportedBy: number; reportedByName: string | null;
  /** PR-LUI-a1: `ten` = Vi phạm (dòng chính), `moTa` = Mô tả (có thể rỗng). */
  ten: string; moTa: string; description: string;
  trangThai: TrangThaiVp; nhanTrangThai: string; han: string | null; quaHanNgay: number | null; lyDoQuaHan: 'xu-ly' | 'xem' | null;
  ghiNhanLuc: string | null; ghiNhanBoiName: string | null;
  /** LG-12 / GD-19: người ghi yêu cầu GVCN xử lý · GVCN "Không xử lý" (null = chưa / đã Hoàn tác). Máy chủ cũ không trả → undefined. */
  yeuCauXuLy?: boolean; khongXuLy?: { luc: string; lyDo: string; boiName: string | null } | null;
  /** UI-3: số tệp bằng chứng (chỉ tab HV — `yThucHocVien`). */
  soTep?: number;
};

/**
 * Sau mọi thay đổi vi phạm / lần xử lý: làm mới các danh sách đọc dữ liệu Ý thức (`pham`: xem `lamMoiYThucTheo`). S5 [NGHI] 2: + `/my-work` — ghi vi phạm
 * đổi dòng việc "Xử lý Ý thức" của lớp (số em, quá hạn); trước đây Công việc giữ dòng cũ tới 5 phút.
 */
export const lamMoiYThuc = (pham: PhamViYThuc = null) => lamMoiYThucTheo(['/violations', '/measures', '/classes', '/students', '/y-thuc', '/my-work'], pham);

/**
 * S5 (chỗ 2): đường của MỘT lớp có thể đọc Ý thức — mọi `GET /classes/:id/…` TRỪ phần điểm / người dạy (`diem-theo-luot`, `cham`, `chu-da-ghi`,
 * `ky-vong`, `teachers`: không đọc bảng Ý thức). `xet-lai` đọc trạng thái Ý thức (`trangThaiYThuc`) — giữ. Đường lớp mới đọc Ý thức → thêm vào đây.
 */
const LOP_DOC_Y_THUC = ['roster', 'overview', 'ho-so', 'y-thuc', 'violations', 'xet-lai', 'phoi-hop-sos', 'viec-theo-em', 'bao-cao-ph', 'issue-board',
  'danh-gia-dau-ra', 'can-ho-tro', 'phan-tich-lop', 'ket-qua-dau-ra', 'gop-y', 'progress', 'tong-ket', 'transition', 'xoa-ket-thuc', 'sua-ca-lop'] as const;
/** Ý thức đổi ở đâu: `classId` = một lớp; `studentIds` = các em. Thiếu (lô nhiều lớp, không rõ lớp) → làm mới rộng như cũ. */
export type PhamViYThuc = { classId?: number | null; studentIds?: readonly (number | null | undefined)[] } | null;
/**
 * Làm mới `duong` sau một thao tác Ý thức, thu hẹp `/classes` → phần đọc Ý thức của đúng lớp (+ danh sách lớp, HV & Lớp) và `/students` → hồ sơ đúng em
 * (cả đường con của em). Không có phạm vi → đúng như cũ.
 */
export function lamMoiYThucTheo(duong: readonly string[], pham: PhamViYThuc) {
  const ids = (pham?.studentIds ?? []).filter((x): x is number => !!x);
  for (const p of duong) {
    if (p === '/classes' && pham?.classId) {
      invalidateDung('/classes'); invalidate('/hoc-vien-lop');
      for (const x of LOP_DOC_Y_THUC) invalidate(`/classes/${pham.classId}/${x}`);
    } else if (p === '/students' && ids.length) {
      for (const s of ids) { invalidateDung(`/students/${s}`); invalidate(`/students/${s}/`); }
    } else invalidate(p);
  }
}

export type BacThangDong = { kind: string; nhan: string; trangThai: 'qua' | 'khai' | 'lan-nay' | 'sau' };

export type DongThoiGianYt =
  | { loai: 'vi-pham'; id: number; studentId: number; ten: string; ngay: string; nhom: string; category: string; mon: string | null;
      viPham: string; trangThai: TrangThaiVp; nhanTrangThai: string; han: string | null; nguoiGhi: string | null;
      /** UI-2 (mockup K6): ai / lúc "Đã xem". */
      xemBoi: string | null; xemLuc: string | null; trongChuoi?: boolean;
      /** LG-12 / GD-19: "Không xử lý" (ngày, lý do, người). */
      khongXuLy?: { luc: string; lyDo: string; boiName: string | null } | null;
      /** Y-THUC-V2: mã môn (chip) + mô tả cắt ngắn (hộp rê). */
      skill: string | null; moTa: string;
      /** TINH-HINH: "Chỉ nhắc nhở" (ngoài luật, không việc). */
      chiNhac?: boolean }
  | { loai: 'xu-ly'; id: number; studentId: number; ten: string; ngay: string; nhan: string; kind: string; status: string;
      statusLabel: string; soViPham: number; nguoi: string | null; soTep: number;
      /** UI-3 (mockup K6): tên vi phạm của lần · Báo PH của lần (null = không có việc). */
      tenViPham: string[]; baoPh: BaoPhLan | null; trongChuoi?: boolean;
      /** G3-14: lần đã thu hồi — việc "Báo lại PH" của TVV (`baoPh` giữ việc gốc). */
      baoLai?: BaoPhLan | null;
      /** Y-THUC-V2: vi phạm của lần (một lần = một khối dòng). */
      viPhamIds: number[] };

/** Y-THUC-V2 — việc Báo PH của ĐÚNG lần xử lý (khớp `BaoPhLan` ở `server/src/yThuc/board.ts`). `lan` = lần ghi mới nhất của TVV. */
export type BaoPhLan = {
  id: number; trangThai: 'mo' | 'xong' | 'bo'; ngay: string | null; han: string; quaHan: boolean; daChinh: boolean; coTheGhi: boolean; coTheSuaHan?: boolean;
  soLan: number; lan: { ketQua: string; ngay: string; noiDung: string | null } | null;
};

export type YThucHocVien = {
  studentId: number; ten: string; maHv: string; homNay: string;
  canManage: boolean; canRecord: boolean; canSuaKhai: boolean; coTheKhai: boolean;
  /** MA-QL-VIEC: QL / Quản trị áp thẳng cách khác Nâng 1 bậc (máy chủ `yThucHocVien`). */
  qlApThang?: boolean;
  /** N70: người xem sửa bậc đã khai thì gửi Head duyệt (GVCN) — Head / Quản trị áp ngay. */
  suaKhaiCanDuyet?: boolean;
  /** N70: người xem có hộp Chờ duyệt (Head / Quản trị) — hiện liên kết "Mở Chờ duyệt ›" ở dải yêu cầu chờ. */
  moHopDuyet?: boolean;
  chuoi: { nhan: string; cycleIds: number[]; soXuLy: number };
  bac: number; bacNhan: string | null; keTiep: { kind: string; nhan: string; bac: number };
  dongThang: BacThangDong[];
  /** `thang`: 'YYYY-MM' hoặc 'YYYY-MM-DD' (N70). `cho`: yêu cầu sửa bậc đang chờ Head — bậc ở đây vẫn là bậc cũ. */
  khai: { bac: number; thang: string | null; ghiChu: string; boi: string | null; luc: string; coTheSua: boolean;
    cho?: { id: number; bac: number; thang: string | null; ghiChu: string; han: string | null; nguoiXin: number | null } | null } | null;
  nhom: NhomEm | null; han: string | null; hanXem: string | null; soBatBuoc: number; soMoi: number; quaHanNgay: number | null;
  deXuat: { id: number; nhan: string; status: 'cho_duyet' | 'da_duyet'; han: string | null; quaHan: boolean } | null;
  daBaoQl: boolean;
  /** UI-3: GVCN lớp em đang học — "Người xử lý" cho người chỉ xem. */
  gvcn: string | null;
  phamVi: 'chuoi' | 'tat-ca';
  viPham: ViPhamV4[];
  macDinh: { tick: number[]; cuHon: number[] };
  dongThoiGian: DongThoiGianYt[];
  demCuoi: { tong: number; theoNhom: { nhom: string; so: number }[] };
  hang: Pick<DongEm, 'xuLyGanNhat' | 'tuChoi' | 'thuHoi' | 'baoPh'>;
  /** TINH-HINH: tình hình học tập GV ↔ TVV của em · nút Báo / Hỏi tình hình (máy chủ kiểm lại). */
  tinhHinh: TinhHinhView[]; coTheBao: boolean; coTheHoi: boolean; tvv: string | null;
};

/** TINH-HINH — khớp `server/src/yThuc/tinhHinh.ts` `TinhHinhView`. `gv_tvv` = GV báo TVV · `tvv_gvcn` = TVV hỏi GVCN. */
export type TinhHinhView = {
  id: number; studentId: number; chieu: 'gv_tvv' | 'tvv_gvcn'; noiDung: string;
  nguoiGuiId: number; nguoiGui: string | null; taoLuc: string; suaLuc: string | null;
  han: string | null; quaHan: boolean; /** `bo`: TVV bỏ việc — đã khép, không phải xong. */ trangThai: 'mo' | 'xong' | 'rut' | 'bo';
  traLoi: string | null; traLoiBoi: string | null; traLoiLuc: string | null;
  baoPh: { id: number; trangThai: 'mo' | 'xong' | 'bo'; tvv: string | null; lan: { ketQua: string; ngay: string; noiDung: string | null } | null; coTheGhi: boolean } | null;
  coTheSua: boolean; coTheTraLoi: boolean; hoanTacDuoc: boolean;
};

export type XuLyView = {
  id: number; studentId: number; ten: string; kind: string; nhan: string; customName: string | null;
  status: string; statusLabel: string; bac: number; note: string | null;
  performedOn: string | null; nguoi: string | null; quyetLuc: string | null; createdAt: string;
  nguoiId: number | null; nguoiNgoai: string | null;
  viPham: ViPhamV4[]; soTep: number; canManage: boolean; the: TheYeuCauDto | null;
  /** PR-LUI-a1: Sửa vi phạm · LUAT-5: Thu hồi… (quyền do máy chủ tính). `lanSau` = tên lần sau (còn thì chưa thu hồi được); `bacVe` = bậc sau khi thu hồi. */
  coTheSua: boolean; coTheThuHoi: boolean; lanSau: string | null; bacVe: number | null; chuaXuLy: ViPhamV4[];
  /** LUAT-5: thẻ thu hồi mới nhất — chờ QL / QL từ chối (lý do) / đã thu hồi (ai · lúc · lý do). */
  thuHoi: TheYeuCauDto | null;
  /** LUAT-5: máy chủ tính — người xem thu hồi thẳng (QL trong phạm vi em) hay gửi QL. */
  thuHoiThang: boolean;
  /** YT-BAO-PH: TVV đã báo PH lần này — hộp Thu hồi (QL thẳng) hiện ô "Nhờ TVV báo lại PH". */
  daBaoPh?: boolean;
};

export type DongEm = {
  studentId: number; ten: string; maHv: string; bac: number; bacNhan: string | null;
  keTiep: { kind: string; nhan: string };
  soMo: number; soBatBuoc: number; soMoi: number; han: string | null; hanXem: string | null; quaHanNgay: number | null;
  moiTuoi: number | null;
  deXuat: { id: number; nhan: string; status: 'cho_duyet' | 'da_duyet'; han: string | null } | null;
  xuLyGanNhat: { id: number; nhan: string; ngay: string } | null;
  tuChoi: { id: number; nhan: string } | null;
  /** UI-Y-THUC-LOP — khớp `DongEm` ở `server/src/yThuc/board.ts`. */
  viPhamCho: { id: number; ngay: string; ten: string; trangThai: TrangThaiVp; /** GD-19: được yêu cầu xử lý (chưa "Không xử lý") — người ghi. */ yeuCau?: string | null }[];
  thuHoi: { id: number; nhan: string; cho: boolean } | null;
  baoPh: { id: number; nhan: string; han: string; trangThai: 'mo' | 'xong' | 'bo'; nhanTrangThai: string; quaHan: boolean; ngayXong: string | null; coTheGhi: boolean; daChinh: boolean } | null;
  /** UI-2: TVV của em (chỉ bảng lớp). */
  tvv: string | null;
  /** G3-14: người xem GIỮ việc Báo PH của em — chỉ bảng lớp. */
  giuBaoPh?: boolean;
};

export type BangYThucLop = {
  classId: number; classCode: string; homNay: string; canManage: boolean; canRecord: boolean;
  nhom: Record<NhomEm, DongEm[]>;
  dongThoiGian: DongThoiGianYt[];
  choBaoPh: DongEm[];
  /** UI-2 (K4): em chỉ còn lần xử lý đang xin thu hồi. */
  choThuHoi: DongEm[];
  coTheDuyet: boolean;
  gvcn: string | null;
  /** G3-14: người xem là GVCN của lớp. */
  laGvcn?: boolean;
  /** YT-a: mọi em của lớp theo tên (`soLs` = số dòng lịch sử mọi lộ trình) · `catLs`: `dongThoiGian` bị cắt 150 dòng. */
  emLop: { studentId: number; ten: string; bac: number; bacNhan: string | null; tvv: string | null; soLs: number }[];
  catLs: boolean;
  /** TINH-HINH: tình hình học tập các em (mới nhất trước) · nút Báo tình hình (GV / QL) · Hỏi tình hình (TVV / QL). */
  tinhHinh: TinhHinhView[]; coTheBao: boolean; coTheHoi: boolean;
};

/** Làm mới mọi dữ liệu Ý thức sau một thao tác ghi (tab lớp, tab HV, việc, hộp, số liệu). */
export const DUONG_LAM_MOI_Y_THUC = ['/violations', '/classes', '/students', '/y-thuc', '/my-work', '/yeu-cau', '/tong-quan', '/metrics'] as const;
/** R3-T5 (rà 24/11): như `DUONG_LAM_MOI_Y_THUC` nhưng `/classes` / `/students` thu về đúng lớp / em (`lamMoiYThucTheo`) — trước mỗi "Đã xem" tải lại cả hồ sơ lớp đang mở. */
export const lamMoiYThucCua = (pham: PhamViYThuc) => lamMoiYThucTheo(DUONG_LAM_MOI_Y_THUC, pham);

/** OV-13d: chọn nhiều ở tab Ý thức lớp (`GET /classes/:id/y-thuc/lo`) — khớp `BangLo` / `KqEm` ở `server/src/yThuc/lo.ts`. */
export type EmLo = {
  studentId: number; ten: string; nhom: NhomEm | null;
  bac: number; bacNhan: string | null; keTiep: { nhan: string; bac: number };
  xuLy: { duoc: boolean; lyDo: ChuKhoa | null; soViPham: number; tomTat: string };
  ghiNhan: { duoc: boolean; lyDo: ChuKhoa | null; soMoi: number };
  /** Bậc đã khai (0 = "Chưa có xử lý vi phạm"), null = chưa khai. */
  capBac: { duoc: boolean; lyDo: ChuKhoa | null; khai: number | null; luc: string | null;
    /** N70: yêu cầu sửa bậc đang chờ Head (bậc xin · hạn). */ cho?: { id: number; bac: number; han: string | null } | null };
};
export type BangLo = { classId: number; classCode: string; canManage: boolean; laQl: boolean; em: EmLo[] };
export type KqEm = { studentId: number; ten: string; ok: boolean; loi?: ChuKhoa; nhan?: string; ids?: number[];
  /** KHAI-BAC-LO: bậc khai trước khi lưu (null = chưa khai) + bậc vừa lưu — để Hoàn tác cả lô. */
  truoc?: { bac: number; thang: string | null; ghiChu: string } | null; bac?: number;
  /** N70: em đã khai, GVCN sửa → đã gửi Head duyệt (chưa áp); Hoàn tác = rút thẻ `ycId`. */
  guiDuyet?: true; ycId?: number;
  /** Lần gửi ghi đè thẻ đang chờ từ trước — Hoàn tác khôi phục nội dung thẻ cũ (máy chủ giữ). */ ghiDe?: true };
