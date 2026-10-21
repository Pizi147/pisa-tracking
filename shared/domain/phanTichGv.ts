/**
 * BẢNG PHÂN TÍCH GIÁO VIÊN (PR-Pb2-b, Q30-5, Q31-2, Q31-9, mockup 25) — luật thuần. Máy chủ `server/src/phanTich/giaoVien.ts` dựng số, mỗi cột
 * MỘT hàm tập; ở đây chỉ khoảng tuần và chữ ô. Không KPI, không xếp hạng, không hàng tổng, không màu ngưỡng (V5 C08).
 */
import { addDaysIso } from './sos.ts';
import { mondayOfDate, owningMonthOf } from './week.ts';

/** Kiểu riêng của Pb2-b (Hợp đồng a↔b): gán được cho `ChuongTrinh` trước và sau Pb2-a. Vắng / lạ → Fast Track. */
export type KhungPtGv = 'ft' | 'thuong';
export const khungPtGvTuThamSo = (s: string | null | undefined): KhungPtGv => (s === 'thuong' ? 'thuong' : 'ft');

/** Khoảng tối đa 13 tuần (một quý) để bảng mở nhanh (mockup 25 "Đã duyệt" 7). */
export const TOI_DA_TUAN_GV = 13;

export type OPtGv = { k: 'na' } | { k: 'rong' } | { k: 'so'; dung: number; tong: number };
export type HangPtGv = {
  id: number; ten: string;
  /** "R · W1 · W2 · GVCN MB FT 103" (mockup 25). */
  phu: string;
  dangDay: { lop: number; hv: number };
  chamDiem: OPtGv; ghiKetQuaPa: OPtGv;
  xuLyViPham: OPtGv & { lopGvcn?: number[] };
  /** Chỉ Fast Track. */
  paHieuQua?: OPtGv;
  /** FT: listening reading writing1 writing2 speaking · thường: listening reading writing speaking. `lop` = lớp có mục (bấm số). */
  ketQua: Record<string, OPtGv & { lop?: number[] }>;
  /** Chỉ Fast Track. */
  tienBo?: OPtGv & { lop?: number[] };
};
export type PhanTichGvKq = { cn: number; tenChiNhanh: string; khung: KhungPtGv; tu: string; den: string; thang: string | null; homNay: string; hang: HangPtGv[] };

/** Khoá cột kết quả theo khung (Q31-6: lớp thường bốn cột cố định L · R · W (G+V) · S (P); OV-11h: + L+S · R+W của PET / KET). */
export const COT_KET_QUA_GV: Record<KhungPtGv, readonly string[]> = {
  ft: ['listening', 'reading', 'writing1', 'writing2', 'speaking'],
  thuong: ['listening', 'reading', 'writing', 'speaking', 'listening_speaking', 'reading_writing'],
};
/** OV-11h (PT-1): cột L+S · R+W chỉ hiện khi có GV dạy môn đó trong bảng — chi nhánh không có PET / KET giữ bốn cột. */
export const cotKetQuaGv = (kq: { khung: KhungPtGv; hang: readonly { ketQua: Record<string, OPtGv> }[] }): readonly string[] =>
  COT_KET_QUA_GV[kq.khung].filter((k) => !k.includes('_') || kq.hang.some((h) => h.ketQua[k] && h.ketQua[k].k !== 'na'));

const THU_HAI = /^\d{4}-\d{2}-\d{2}$/;
const laThuHai = (s: string) => THU_HAI.test(s) && !Number.isNaN(Date.parse(`${s}T00:00:00Z`)) && mondayOfDate(s) === s;
const soTuan = (tu: string, den: string) => Math.round((Date.parse(`${den}T00:00:00Z`) - Date.parse(`${tu}T00:00:00Z`)) / (7 * 86_400_000)) + 1;

/**
 * Khoảng tuần (Q18): `thang=YYYY-MM` → các tuần có Thứ Năm thuộc tháng (`owningMonthOf`); `tu`,`den` (Thứ Hai, gồm cả tuần `den`) → ≤ 13 tuần;
 * vắng → 4 tuần tới tuần hiện tại. Trả `{ tu, den }` là Thứ Hai tuần đầu / tuần cuối.
 */
export function khoangPtGv(q: { tu?: string | null; den?: string | null; thang?: string | null }, homNay: string): { tu: string; den: string } | { loi: string } {
  if (q.thang) {
    const m = /^(\d{4})-(\d{2})$/.exec(q.thang);
    if (!m || Number(m[2]) < 1 || Number(m[2]) > 12) return { loi: 'Tháng không hợp lệ (YYYY-MM).' };
    const cua = (t: string) => { const o = owningMonthOf(t); return o.year === Number(m[1]) && o.month === Number(m[2]); };
    let tu = mondayOfDate(`${q.thang}-01`);
    if (!cua(tu)) tu = addDaysIso(tu, 7);
    let den = tu;
    while (cua(addDaysIso(den, 7))) den = addDaysIso(den, 7);
    return { tu, den };
  }
  if (q.tu || q.den) {
    if (!q.tu || !q.den || !laThuHai(q.tu) || !laThuHai(q.den)) return { loi: 'Từ tuần / đến tuần phải là ngày Thứ Hai (YYYY-MM-DD).' };
    if (q.tu > q.den) return { loi: 'Tuần đầu phải trước tuần cuối.' };
    if (soTuan(q.tu, q.den) > TOI_DA_TUAN_GV) return { loi: `Khoảng tối đa ${TOI_DA_TUAN_GV} tuần.` };
    return { tu: q.tu, den: q.den };
  }
  const den = mondayOfDate(homNay);
  return { tu: addDaysIso(den, -21), den };
}

/** % làm tròn (Q19). */
export const phanTramGv = (dung: number, tong: number) => Math.round((100 * dung) / tong);
/** Dưới 5 mục: "mẫu nhỏ" thay cho % (cùng ngưỡng "Ít dữ liệu" ở Hiệu quả PA). */
export const MAU_NHO_GV = 5;

/** Chữ một ô: "18/20" + "90%" · dưới 5 mục "mẫu nhỏ" · "—" không áp dụng · "Chưa có dữ liệu" áp dụng mà mẫu 0 (V5 T19 — không hiện 0 %). */
export function chuOPtGv(o: OPtGv): { so: string | null; phu: string } {
  if (o.k === 'na') return { so: null, phu: '—' };
  if (o.k === 'rong') return { so: null, phu: 'Chưa có dữ liệu' };
  return { so: `${o.dung}/${o.tong}`, phu: o.tong < MAU_NHO_GV ? 'mẫu nhỏ' : `${phanTramGv(o.dung, o.tong)}%` };
}

/** Ô từ tập (dung ⊆ tong) + có áp dụng không. */
export const oTuTap = (apDung: boolean, t: { dung: readonly unknown[]; tong: readonly unknown[] } | undefined): OPtGv =>
  !apDung ? { k: 'na' } : !t?.tong.length ? { k: 'rong' } : { k: 'so', dung: t.dung.length, tong: t.tong.length };
