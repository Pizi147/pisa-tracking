/**
 * KẾT QUẢ THI (OV-15e, C27 + thiết kế OV-14 mục 6, mockup 6 khung 6) — tab Phân tích › Kết quả thi: Mock Test / Thi thật, đếm theo LƯỢT.
 * Máy chủ `server/src/phanTich/ketQuaThi.ts` dựng dòng; đây là luật thuần + kiểu chung.
 *   Mock: Đạt ⇔ OVR ≥ kỳ vọng của đợt (MT1 Target − 1 · MT2 − 0,5 · MT3+ = Target); chưa có OVR (thiếu kỹ năng) = Chưa đủ điểm — không vào tỷ lệ.
 *   Thi thật: Đạt Target ⇔ OVR ≥ Target (máy tính lúc nhập — `outcome`).
 */
import { t } from '../i18n/index.ts';

export const LOAI_THI = ['mock', 'thi-that'] as const;
export type LoaiThi = (typeof LOAI_THI)[number];
export const NHAN_LOAI_THI: Record<LoaiThi, string> = { mock: 'Mock Test', 'thi-that': t('Thi thật') };

export type KetQuaMock = 'dat' | 'chua-dat' | 'chua-du';
export const NHAN_KET_QUA_MOCK: Record<KetQuaMock, string> = { dat: t('Đạt'), 'chua-dat': t('Chưa đạt'), 'chua-du': t('Chưa đủ điểm') };
/** Mock "Xếp theo": Lớp · Mức SOS (nặng trước). */
export const XEP_MOCK = ['lop', 'sos'] as const;
export type XepMock = (typeof XEP_MOCK)[number];
export const NHAN_XEP_MOCK: Record<XepMock, string> = { lop: t('Lớp'), sos: t('Mức SOS') };

export function ketQuaMock(ovr: number | null, kyVong: number | null): KetQuaMock {
  if (ovr === null || kyVong === null) return 'chua-du';
  return ovr >= kyVong ? 'dat' : 'chua-dat';
}

export const KN_THI = ['listening', 'reading', 'writing', 'speaking'] as const;
export type KnThi = (typeof KN_THI)[number];
export const NHAN_KN_THI: Record<KnThi, string> = { listening: 'L', reading: 'R', writing: 'W', speaking: 'S' };

export type DongMock = {
  attemptId: number; studentId: number; ten: string; classId: number; lop: string; mt: number; tuan: string;
  ovr: number | null; kyVong: number | null; kn: Record<KnThi, { band: number | null; dat: boolean | null }>;
  ketQua: KetQuaMock;
  /** Mức SOS của lượt (null = không SOS / KCK); `sosTam` = lượt chưa chốt. */
  sos: number | null; sosTam: boolean;
  /** Trạng thái Case của lượt ("Case trống PA", "PA đang chạy") + việc tiếp ("Lập PA · Trần Ngọc Hà" / "Nhập điểm S"). */
  casePa: string | null; caseId: number | null; viecTiep: string | null;
};
/** `sos1..3` đếm LƯỢT (gồm tạm); `sosTam` (SL2) = số lượt SOS tạm trong đó. */
export type TongMock = { luot: number; hv: number; dat: number; chuaDat: number; chuaDu: number; sos1: number; sos2: number; sos3: number; sosTam: number };
export type KetQuaMockKq = { loai: 'mock'; tu: string; den: string; tong: TongMock; rows: DongMock[] };

export type DongThiThat = {
  cycleId: number; studentId: number; ten: string; classId: number | null; lop: string | null; ngayThi: string | null; khongThi: boolean;
  ovr: number | null; l: number | null; r: number | null; w: number | null; s: number | null; target: string;
  /** true Đạt Target · false Chưa đạt · null không thi / không có Target. */
  dat: boolean | null;
  buocTiep: string | null; buocTiepChu: string | null; buocTiepPhu: string | null; nguoiChon: string | null; ngayChon: string | null;
  coTheChon: boolean;
};
export type TongThiThat = { luot: number; hv: number; dat: number; chuaDat: number; chuaChon: number };
export type KetQuaThiThatKq = { loai: 'thi-that'; tu: string; den: string; tong: TongThiThat; rows: DongThiThat[] };

/** Thứ tự Mock: theo Mức SOS — SOS 3 → 2 → 1 → không, rồi lớp, tên; theo Lớp — lớp, tên, MT. */
export function xepDongMock(rows: readonly DongMock[], xep: XepMock): DongMock[] {
  const lop = (a: DongMock, b: DongMock) => a.lop.localeCompare(b.lop, 'vi', { numeric: true }) || a.ten.localeCompare(b.ten, 'vi') || a.mt - b.mt || a.attemptId - b.attemptId;
  return [...rows].sort(xep === 'sos' ? (a, b) => (b.sos ?? 0) - (a.sos ?? 0) || lop(a, b) : lop);
}
