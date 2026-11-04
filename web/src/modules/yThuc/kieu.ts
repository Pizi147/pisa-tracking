/**
 * KIỂU DỮ LIỆU Ý THỨC v4 phía giao diện (PR-YT4) — khớp JSON của `server/src/yThuc/xuLy.ts` (`yThucHocVien`, `xemXuLy`) và
 * `board.ts` (`bangYThucLop`). Một chỗ khai, mọi thành phần trong `modules/yThuc/` đọc từ đây.
 */
import { invalidate } from '../../lib/api.ts';
import type { NhomEm, TheYeuCauDto, TrangThaiVp } from '@shared/domain/index.ts';
import type { ChuKhoa } from '@shared/i18n/index.ts';

export type ViPhamV4 = {
  id: number; studentId: number; studentName: string; classCode: string | null; cycleId: number | null;
  category: string; categoryLabel: string; skill: string | null; skillLabel: string | null;
  occurredOn: string; reportedOn: string; reportedBy: number; reportedByName: string | null;
  /** PR-LUI-a1: `ten` = Vi phạm (dòng chính), `moTa` = Mô tả (có thể rỗng). */
  ten: string; moTa: string; description: string;
  trangThai: TrangThaiVp; nhanTrangThai: string; han: string | null; quaHanNgay: number | null; lyDoQuaHan: 'xu-ly' | 'xem' | null;
  ghiNhanLuc: string | null; ghiNhanBoiName: string | null;
  /** UI-3: số tệp bằng chứng (chỉ tab HV — `yThucHocVien`). */
  soTep?: number;
};

/** Sau mọi thay đổi vi phạm / lần xử lý: làm mới các danh sách đọc dữ liệu Ý thức. */
export const lamMoiYThuc = () => { for (const p of ['/violations', '/measures', '/classes', '/students', '/y-thuc']) invalidate(p); };

export type BacThangDong = { kind: string; nhan: string; trangThai: 'qua' | 'khai' | 'lan-nay' | 'sau' };

export type DongThoiGianYt =
  | { loai: 'vi-pham'; id: number; studentId: number; ten: string; ngay: string; nhom: string; category: string; mon: string | null;
      viPham: string; trangThai: TrangThaiVp; nhanTrangThai: string; han: string | null; nguoiGhi: string | null;
      /** UI-2 (mockup K6): ai / lúc "Đã xem". */
      xemBoi: string | null; xemLuc: string | null }
  | { loai: 'xu-ly'; id: number; studentId: number; ten: string; ngay: string; nhan: string; kind: string; status: string;
      statusLabel: string; soViPham: number; nguoi: string | null; soTep: number;
      /** UI-3 (mockup K6): tên vi phạm của lần · Báo PH của lần (null = không có việc). */
      tenViPham: string[]; baoPh: { trangThai: string; ngay: string | null } | null; vpIds: number[] };

export type YThucHocVien = {
  studentId: number; ten: string; maHv: string; homNay: string;
  canManage: boolean; canRecord: boolean; canSuaKhai: boolean; coTheKhai: boolean;
  chuoi: { nhan: string; cycleIds: number[]; soXuLy: number };
  bac: number; bacNhan: string | null; keTiep: { kind: string; nhan: string; bac: number };
  dongThang: BacThangDong[];
  khai: { bac: number; thang: string | null; ghiChu: string; boi: string | null; luc: string; coTheSua: boolean } | null;
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
  viPhamCho: { id: number; ngay: string; ten: string; trangThai: TrangThaiVp }[];
  thuHoi: { id: number; nhan: string; cho: boolean } | null;
  baoPh: { id: number; nhan: string; han: string; trangThai: 'mo' | 'xong' | 'bo'; nhanTrangThai: string; quaHan: boolean; ngayXong: string | null; coTheGhi: boolean; daChinh: boolean } | null;
  /** UI-2: TVV của em (chỉ bảng lớp). */
  tvv: string | null;
};

export type BangYThucLop = {
  classId: number; classCode: string; homNay: string; canManage: boolean; canRecord: boolean;
  nhom: Record<NhomEm, DongEm[]>;
  dongThoiGian: DongThoiGianYt[];
  choBaoPh: DongEm[];
  /** UI-2 (K4): em chỉ còn lần xử lý đang xin thu hồi. */
  choThuHoi: DongEm[];
  coTheDuyet: boolean;
  phamVi: 'chuoi' | 'tat-ca';
  gvcn: string | null;
};

/** Làm mới mọi dữ liệu Ý thức sau một thao tác ghi (tab lớp, tab HV, việc, hộp, số liệu). */
export const DUONG_LAM_MOI_Y_THUC = ['/violations', '/classes', '/students', '/y-thuc', '/my-work', '/yeu-cau', '/tong-quan', '/metrics'] as const;

/** OV-13d: chọn nhiều ở tab Ý thức lớp (`GET /classes/:id/y-thuc/lo`) — khớp `BangLo` / `KqEm` ở `server/src/yThuc/lo.ts`. */
export type EmLo = {
  studentId: number; ten: string; nhom: NhomEm | null;
  bac: number; bacNhan: string | null; keTiep: { nhan: string; bac: number };
  xuLy: { duoc: boolean; lyDo: ChuKhoa | null; soViPham: number; tomTat: string };
  ghiNhan: { duoc: boolean; lyDo: ChuKhoa | null; soMoi: number };
  /** Bậc đã khai (0 = "Chưa có xử lý vi phạm"), null = chưa khai. */
  capBac: { duoc: boolean; lyDo: ChuKhoa | null; khai: number | null; luc: string | null };
};
export type BangLo = { classId: number; classCode: string; canManage: boolean; laQl: boolean; em: EmLo[] };
export type KqEm = { studentId: number; ten: string; ok: boolean; loi?: ChuKhoa; nhan?: string; ids?: number[];
  /** KHAI-BAC-LO: bậc khai trước khi lưu (null = chưa khai) + bậc vừa lưu — để Hoàn tác cả lô. */
  truoc?: { bac: number; thang: string | null; ghiChu: string } | null; bac?: number };
