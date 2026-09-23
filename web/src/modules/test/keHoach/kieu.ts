import {
  CHU_KY_NANG, KY_NANG_KE_HOACH, gomChip, tuanLich,
  type KyNangKH, type OKyNang,
} from '@shared/domain/index.ts';

/** Kiểu dữ liệu của Kế hoạch Test phía web — khớp `server/src/keHoach/keHoachTest.ts`. */

export type KnO = Partial<Record<KyNangKH, OKyNang>>;

export type LopKH = {
  id: number; code: string; loai: 'ft' | 'thuong'; chiNhanh: string; soHv: number;
  chuaCoLichTiep: number; hvChuaCoLich: number; tomTat: string;
};
export type DanhSachLop = { tieuDe: string; lop: LopKH[] };

export type DotFT = { attemptId: number | null; trangThaiDot: string | null; kn: KnO };
export type HangFT = { studentId: number; ten: string; ma: string; vaoMuon: boolean; dot: Record<number, DotFT> };
export type LuoiFTData = { classId: number; classCode: string; cot: number[]; hang: HangFT[] };

export type DotThuong = { attemptId: number | null; kn: KnO };
export type KindThuong = 'progress' | 'final';
export type CotThuong = { kind: KindThuong; nhan: 'Giữa khoá' | 'Cuối khoá'; deXuat: string | null; nhanDeXuat: string | null };
export type HangThuong = { studentId: number; ten: string; ma: string; dot: Record<KindThuong, DotThuong> };
export type LuoiThuongData = {
  classId: number; classCode: string; chuongTrinh: string | null; khaiGiang: string | null; tongTuan: number | null;
  tuanHienTai: string | null; hvChuaCoLich: number; cot: CotThuong[]; hang: HangThuong[];
};

/** Một đợt của lớp: FT = MT{n}, lớp thường = Giữa khoá / Cuối khoá. */
export type DotChon = { loai: 'ft'; attemptNo: number } | { loai: 'thuong'; kind: KindThuong };

export const NHAN_KIND: Record<KindThuong, 'Giữa khoá' | 'Cuối khoá'> = { progress: 'Giữa khoá', final: 'Cuối khoá' };
export const nhanDot = (d: DotChon): string => (d.loai === 'ft' ? `MT${d.attemptNo}` : NHAN_KIND[d.kind]);
export const khoaDot = (d: DotChon): string => (d.loai === 'ft' ? `mt${d.attemptNo}` : d.kind);
/** Phần định danh đợt trong body gửi máy chủ (`/xep-moi`, `/hang-loat`). */
export const thanDot = (d: DotChon) => (d.loai === 'ft' ? { attemptNo: d.attemptNo } : { kind: d.kind });

export const KY = KY_NANG_KE_HOACH;
export const chuKyNang = (k: KyNangKH) => CHU_KY_NANG[k];
export const TEN_KY_NANG: Record<KyNangKH, string> = {
  listening: 'Listening', reading: 'Reading', writing: 'Writing', speaking: 'Speaking',
};

/** Đợt của một em ở một cột. */
export function dotCuaEm(
  data: { loai: 'ft'; luoi: LuoiFTData; hang: HangFT } | { loai: 'thuong'; luoi: LuoiThuongData; hang: HangThuong },
  d: DotChon,
): { attemptId: number | null; kn: KnO } {
  if (data.loai === 'ft' && d.loai === 'ft') return data.hang.dot[d.attemptNo] ?? { attemptId: null, kn: {} };
  if (data.loai === 'thuong' && d.loai === 'thuong') return data.hang.dot[d.kind] ?? { attemptId: null, kn: {} };
  return { attemptId: null, kn: {} };
}

/** Em đã xong đợt này (đủ điểm mọi kỹ năng phải thi). */
export const emXongDot = (o: { attemptId: number | null; kn: KnO }): boolean => o.attemptId !== null && gomChip(o.kn).xong;

/** Tình trạng hiện có của một em bằng chữ: `L R W S · W4 OCT` (nhiều nhóm thì nối bằng " · "). */
export function chuTinhTrang(kn: KnO): string {
  const g = gomChip(kn);
  if (g.xong) return g.tuanXong ? `Xong · ${tuanLich(g.tuanXong)}` : 'Xong';
  return g.chip.map((c) => `${c.kyNang.map((k) => CHU_KY_NANG[k]).join(' ')} · ${c.tuan ? tuanLich(c.tuan) : 'chưa xếp'}`).join(' · ');
}
