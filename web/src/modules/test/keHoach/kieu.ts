import {
  KY_NANG_KE_HOACH, gomChip, tenMonNgan, tuanLich,
  type KyNangKH, type OKyNang, nhanBai } from '@shared/domain/index.ts';

/** Kiểu dữ liệu của Kế hoạch Test phía web — khớp `server/src/keHoach/keHoachTest.ts`. */

export type KnO = Partial<Record<KyNangKH, OKyNang>>;

export type LopKH = {
  id: number; code: string; loai: 'ft' | 'thuong'; chiNhanh: string; chuongTrinh: string | null; soHv: number;
  chuaCoLichTiep: number; hvChuaCoLich: number; tomTat: string;
  /** PR-XLMT (Q7): số em lớp FT cần Quản lý xếp lại (vắng chưa có đề nghị + phần thi đã huỷ). */
  canXepLai: number;
};
export type DanhSachLop = { tieuDe: string; lop: LopKH[] };

/** `do`: có kỹ năng xong và còn kỹ năng phải thi (◐) · `huyPhan`: có phần thi đã huỷ (PR-XLMT). */
/** `huy` (PR-OV4a): số MT chỉ có lượt đã huỷ (id) — ô "MT2 · Đã huỷ"; `attemptId` vẫn null. */
export type DotFT = { attemptId: number | null; trangThaiDot: string | null; kn: KnO; lichSu?: boolean; do?: boolean; huyPhan?: boolean; huy?: number };
/** `soKeTiep` (PR-MT, K4-08): chỉ ô MT này có "+ xếp" — số MT liền mạch. */
export type HangFT = { studentId: number; ten: string; ma: string; cycleId?: number | null; vaoMuon: boolean; dot: Record<number, DotFT>; soKeTiep: number };
export type LuoiFTData = { classId: number; classCode: string; cot: number[]; hang: HangFT[] };

export type DotThuong = { attemptId: number | null; kn: KnO };
/** `progress` | `final`; OV-6b2 lớp liên tục: `cp{n}` = Checkpoint n. */
export type KindThuong = string;
export type CotThuong = { kind: KindThuong; nhan: string; deXuat: string | null; nhanDeXuat: string | null };
export type HangThuong = {
  studentId: number; ten: string; ma: string; dot: Partial<Record<KindThuong, DotThuong>>;
  /** PR-MT0 (mockup ④): MT0 của em — ô MT số 0 cạnh Final. */
  mt0?: { attemptId: number; kn: KnO; khongDung: boolean } | null;
};
export type LuoiThuongData = {
  classId: number; classCode: string; chuongTrinh: string | null; khaiGiang: string | null; tongTuan: number | null;
  tuanHienTai: string | null; hvChuaCoLich: number; cot: CotThuong[]; hang: HangThuong[];
  /** Bộ môn của chương trình lớp (K4-16): FOU/BE/ELE 4 môn, Pre FOU `tong_hop`. */
  boMon: KyNangKH[];
};

/** Một đợt của lớp: FT = MT{n}, lớp thường = Giữa khoá / Cuối khoá. */
export type DotChon = { loai: 'ft'; attemptNo: number } | { loai: 'thuong'; kind: KindThuong };

export const nhanDot = (d: DotChon): string => (d.loai === 'ft' ? `MT${d.attemptNo}` : nhanBai(khoaBaiThuong(d.kind)));
/** Khoá cột Kế hoạch (`cp2`) → khoá bài của máy chủ (`checkpoint:2`); Progress / Final giữ nguyên. */
export const khoaBaiThuong = (kind: string): string => kind.replace(/^cp(\d+)$/, 'checkpoint:$1');
export const khoaDot = (d: DotChon): string => (d.loai === 'ft' ? `mt${d.attemptNo}` : d.kind);
/** Phần định danh đợt trong body gửi máy chủ (`/xep-moi`, `/hang-loat`). */
export const thanDot = (d: DotChon) => (d.loai === 'ft' ? { attemptNo: d.attemptNo } : { kind: d.kind });

export const KY = KY_NANG_KE_HOACH;

/** Đợt của một em ở một cột. */
export function dotCuaEm(
  data: { loai: 'ft'; luoi: LuoiFTData; hang: HangFT } | { loai: 'thuong'; luoi: LuoiThuongData; hang: HangThuong },
  d: DotChon,
): { attemptId: number | null; kn: KnO; lichSu?: boolean; do?: boolean } {
  if (data.loai === 'ft' && d.loai === 'ft') return data.hang.dot[d.attemptNo] ?? { attemptId: null, kn: {} };
  if (data.loai === 'thuong' && d.loai === 'thuong') return data.hang.dot[d.kind] ?? { attemptId: null, kn: {} };
  return { attemptId: null, kn: {} };
}

/** Em đã xong đợt này (đủ điểm mọi kỹ năng phải thi). */
export const emXongDot = (o: { attemptId: number | null; kn: KnO }): boolean => o.attemptId !== null && gomChip(o.kn).xong;

/** Tình trạng hiện có của một em bằng chữ: `L R W S · W4 OCT` (nhiều nhóm thì nối bằng " · "). */
export function chuTinhTrang(kn: KnO, ct: string | null = null): string {
  const g = gomChip(kn);
  if (g.xong) return g.tuanXong ? `Xong · ${tuanLich(g.tuanXong)}` : 'Xong';
  return g.chip.map((c) => `${c.kyNang.map((k) => tenMonNgan(ct, k)).join(' ')} · ${c.tuan ? tuanLich(c.tuan) : 'chưa xếp'}`).join(' · ');
}
