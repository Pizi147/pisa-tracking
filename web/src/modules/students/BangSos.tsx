import { t } from '@shared/i18n/index.ts';
import { type DeadlineKind, type LienHe, type NhomXuLy } from '@shared/domain/index.ts';

/** `GET /hoc-vien-lop?goc=sos` (server/src/classes/hocVienSos.ts → CaseTomTat / DongSos / TrangSos). */
export type CaseTomTat = {
  id: number; topic: string | null; kyNang: string | null; nguyenNhan: string | null; nhanXet: string | null;
  pa: { id: number; ten: string; nguoi: string | null; choXacNhan: boolean; xong: boolean }[];
  ketQua: string | null; ketQuaNgay: string | null; nhom: NhomXuLy; trangThai: string;
  viecTiep: { chu: string; han: string | null; loaiHan: DeadlineKind | null; quaHan: boolean; nguoi: string | null } | null;
  attemptId: number | null; attemptNo: number | null; done: boolean;
};
export type DongSos = {
  attemptId: number; studentId: number; ten: string; ma: string; classId: number; classCode: string; branchName: string | null; ft: boolean;
  luot: string; tuan: string; sosLevel: number; kyNang: string[]; cases: CaseTomTat[]; tvv: string | null; lienHe: LienHe;
};
/** SL2: Đang SOS = SOS hiện tại — một em một dòng (lượt = đợt mới nhất hợp lệ), không lọc tuần. */
export type TrangSos = { rows: DongSos[] };

/** Case chưa có nguyên nhân: Case MT chưa mô tả → "Chờ mô tả Case" (máy chủ: `trangThaiCaseV4`), còn lại (Progress) "chưa xác nhận". */
export const chuChuaNguyenNhan = (c: CaseTomTat, dai = false) =>
  c.trangThai === 'Chờ mô tả Case' ? t('Chờ mô tả Case') : dai ? t('chưa xác nhận nguyên nhân') : t('chưa xác nhận');
