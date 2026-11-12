/**
 * HỘP TUẦN DẠY (TL-GV, mockup v20 `thiet-ke/v20/ti-le-gv.html`) — GET /cycles/:id/tuan-day: GV dạy em từng kỹ năng theo tuần, từ tuần bắt đầu lộ trình
 * tới tuần thi (máy chủ `server/src/phanTich/tuanDay.ts`). Tuần dạy chung chia đều (1/k) → số tuần có thể lẻ ,5.
 */
import type { KnDay, KnThiThat } from './thiThatThongKe.ts';

export type GvTuanDay = { userId: number; ten: string; tuan: number; lop: string[]; /** Thứ Hai dạy chung với GV khác (tính 1/k). */ chung: string[] };
export type KnTuanDay = { gv: GvTuanDay[]; trong: { tuan: number; tu: string; lop: string[] } | null };
export type KhoangTuanDay = {
  cycleId: number; ngayThi: string; /** Thứ Hai tuần bắt đầu / tuần thi. */ tu: string; den: string; tong: number;
  lop: { id: number; ma: string; tu: string; den: string; tuan: number }[];
  kn: Record<KnDay, KnTuanDay>;
};
export type TuanDayKq = {
  /** Lần thi này. */ chinh: KhoangTuanDay;
  /** Kỹ năng lấy KQ lần thi trước ("↺") → khoảng của lần thi đó; null = thi đủ. */ truoc: KhoangTuanDay | null; layLai: KnThiThat[];
  /** Lớp người xem phân công được (link "Phân công ›" khi còn tuần trống — chỉ QL / QT). */ phanCong: number[];
  /** Điểm thi thật + Target lúc nhập — tiêu đề hộp ở nơi chỉ có OVR (hồ sơ lớp Tổng kết). */
  diem: { l: number | null; r: number | null; w: number | null; s: number | null; ovr: number | null }; target: number | null;
};

/** % làm tròn theo phần dư lớn nhất — các dòng cộng đúng 100 (XM-7). */
export function phanTramTron(so: readonly number[]): number[] {
  const tong = so.reduce((a, x) => a + x, 0);
  if (!tong) return so.map(() => 0);
  const tho = so.map((x) => (100 * x) / tong);
  const ra = tho.map(Math.floor);
  const thua = 100 - ra.reduce((a, x) => a + x, 0);
  [...tho.keys()].sort((a, b) => (tho[b] - ra[b]) - (tho[a] - ra[a]) || a - b).slice(0, thua).forEach((i) => { ra[i] += 1; });
  return ra;
}
/** Số tuần: "5,5" · "7" · "0,33". */
export const chuTuan = (x: number): string => String(Math.round(x * 100) / 100).replace('.', ',');
