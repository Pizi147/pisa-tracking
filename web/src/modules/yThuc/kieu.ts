/**
 * KIỂU DỮ LIỆU Ý THỨC v4 phía giao diện (PR-YT4) — khớp JSON của `server/src/yThuc/xuLy.ts` (`yThucHocVien`, `xemXuLy`) và
 * `board.ts` (`bangYThucLop`). Một chỗ khai, mọi thành phần trong `modules/yThuc/` đọc từ đây.
 */
import type { NhomEm, TheYeuCauDto, TrangThaiVp } from '@shared/domain/index.ts';

export type ViPhamV4 = {
  id: number; studentId: number; studentName: string; classCode: string | null; cycleId: number | null;
  category: string; categoryLabel: string; skill: string | null; skillLabel: string | null;
  occurredOn: string; reportedOn: string; reportedBy: number; reportedByName: string | null; description: string;
  trangThai: TrangThaiVp; nhanTrangThai: string; han: string | null; quaHanNgay: number | null; lyDoQuaHan: 'xu-ly' | 'xem' | null;
  ghiNhanLuc: string | null; ghiNhanBoiName: string | null;
};

export type BacThangDong = { kind: string; nhan: string; trangThai: 'qua' | 'khai' | 'lan-nay' | 'sau'; canQl: boolean };

export type DongThoiGianYt =
  | { loai: 'vi-pham'; id: number; studentId: number; ten: string; ngay: string; nhom: string; category: string; mon: string | null;
      moTa: string; trangThai: TrangThaiVp; nhanTrangThai: string; han: string | null; nguoiGhi: string | null }
  | { loai: 'xu-ly'; id: number; studentId: number; ten: string; ngay: string; nhan: string; kind: string; status: string;
      statusLabel: string; soViPham: number; nguoi: string | null; soTep: number };

export type YThucHocVien = {
  studentId: number; ten: string; maHv: string; homNay: string;
  canManage: boolean; canRecord: boolean; canSuaKhai: boolean; coTheKhai: boolean;
  chuoi: { nhan: string; cycleIds: number[]; soXuLy: number };
  bac: number; bacNhan: string | null; keTiep: { kind: string; nhan: string; bac: number; canQl: boolean } | null;
  dongThang: BacThangDong[];
  khai: { bac: number; thang: string | null; ghiChu: string; boi: string | null; luc: string; coTheSua: boolean } | null;
  nhom: NhomEm | null; han: string | null; hanXem: string | null; soBatBuoc: number; soMoi: number; quaHanNgay: number | null;
  deXuat: { id: number; nhan: string; status: 'cho_duyet' | 'da_duyet'; han: string | null; quaHan: boolean } | null;
  daBaoQl: boolean;
  phamVi: 'chuoi' | 'tat-ca';
  viPham: ViPhamV4[];
  macDinh: { tick: number[]; cuHon: number[] };
  dongThoiGian: DongThoiGianYt[];
  demCuoi: { tong: number; theoNhom: { nhom: string; so: number }[] };
};

export type XuLyView = {
  id: number; studentId: number; ten: string; kind: string; nhan: string; customName: string | null;
  status: string; statusLabel: string; bac: number; note: string | null;
  performedOn: string | null; nguoi: string | null; quyetLuc: string | null; createdAt: string;
  viPham: ViPhamV4[]; soTep: number; canManage: boolean; the: TheYeuCauDto | null;
};

export type DongEm = {
  studentId: number; ten: string; maHv: string; bac: number; bacNhan: string | null;
  keTiep: { kind: string; nhan: string; canQl: boolean } | null;
  soMo: number; soBatBuoc: number; soMoi: number; han: string | null; hanXem: string | null; quaHanNgay: number | null;
  moiTuoi: number | null;
  deXuat: { nhan: string; status: 'cho_duyet' | 'da_duyet'; han: string | null } | null;
  xuLyGanNhat: { nhan: string; ngay: string } | null;
  tuChoi: { nhan: string } | null;
};

export type BangYThucLop = {
  classId: number; classCode: string; homNay: string; canManage: boolean; canRecord: boolean;
  nhom: Record<NhomEm, DongEm[]>;
  dongThoiGian: DongThoiGianYt[];
};

/** Làm mới mọi dữ liệu Ý thức sau một thao tác ghi (tab lớp, tab HV, việc, hộp, số liệu). */
export const DUONG_LAM_MOI_Y_THUC = ['/violations', '/classes', '/students', '/y-thuc', '/my-work', '/yeu-cau', '/tong-quan', '/metrics'] as const;
