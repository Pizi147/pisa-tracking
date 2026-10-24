/**
 * BẢNG PHÂN TÍCH GIÁO VIÊN (PR-Pb2-b, Q30-5, Q31-2, Q31-9, mockup 25) — luật thuần. Máy chủ `server/src/phanTich/giaoVien.ts` dựng số, mỗi cột
 * MỘT hàm tập; ở đây chỉ khoảng tuần và chữ ô. Không KPI, không xếp hạng, không hàng tổng, không màu ngưỡng (V5 C08).
 */
import { addDaysIso } from './sos.ts';
import { mondayOfDate, owningMonthOf } from './week.ts';

/** Kiểu riêng của Pb2-b (Hợp đồng a↔b): gán được cho `ChuongTrinh` trước và sau Pb2-a. Vắng / lạ → Fast Track. */
export type KhungPtGv = 'ft' | 'thuong';
export const khungPtGvTuThamSo = (s: string | null | undefined): KhungPtGv => (s === 'thuong' ? 'thuong' : 'ft');

export type OPtGv = { k: 'na' } | { k: 'rong' } | { k: 'so'; dung: number; tong: number };
export type HangPtGv = {
  id: number; ten: string;
  /** "R · W1 · W2 · GVCN MB FT 103" (mockup 25). */
  phu: string;
  /** UI-TONG-QUAN (chủ SP 23/10): hai phần của `phu` tách riêng để Tổng quan hiện khác kiểu — môn ("R · W1") · lớp chủ nhiệm. */
  mon: string; lopCn: string[];
  dangDay: { lop: number; hv: number };
  /** `chamDiem` = "Điểm đúng hạn" (đơn vị BÀI). */
  chamDiem: OPtGv; ghiKetQuaPa: OPtGv;
  /** V5 (05 #8): "Việc đúng hạn" — gộp các việc có hạn (Ghi kết quả PA; + Báo PH ở SV-TVV), đơn vị VIỆC (Σ tử / Σ mẫu). "Xử lý vi phạm" bỏ khỏi bảng (10, 22/10). */
  viecDungHan: OPtGv;
  /** Chỉ Fast Track. */
  paHieuQua?: OPtGv;
  /** UI-PHAN-TICH (FT): `datMt` = Đạt kỳ vọng Test (chỉ lượt Test, đơn vị lượt Test, panel `cot=dat-mt`) · `thiThat` = Pass Target theo LẦN THI (cùng hồ sơ GV `thiThatCuaGv`, panel hồ sơ GV `cot=thi-that`). */
  datMt?: OPtGv; thiThat?: OPtGv;
  /** HV đang SOS (hiện tại) ở lớp GV đang dạy; panel `cot=hv-chu-y`. */
  hvChuY: number;
  /** Case có PA theo người phụ trách (hiện tại) — cùng `caseCoPaTheoGv` của Tổng quan; panel hồ sơ GV `cot=case-mo`. */
  casePa: OPtGv;
  /** FT: listening reading writing1 writing2 speaking · thường: listening reading writing speaking. `lop` = lớp có mục (bấm số). */
  ketQua: Record<string, OPtGv & { lop?: number[] }>;
  /** Chỉ Fast Track. */
  tienBo?: OPtGv & { lop?: number[] };
};
/**
 * V5 SV-SO2 — HỒ SƠ GV THEO KỲ (`GET /giao-vien/:id/chi-so?tu=&den=`): số của MỘT GV, Σ tử / Σ mẫu qua các chi nhánh × khung GV dạy trong kỳ, cùng hàm tập
 * với bảng Phân tích GV. Đơn vị: `diemDungHan` bài · `viecDungHan` việc · `ketQua`, `tienBo` lượt kỹ năng (K5) · `paHieuQua` PA.
 * Mốc "phản hồi vấn đề HV" không có ở đây (R3c — web ghi cố định "Chưa có dữ liệu").
 */
export type ChiSoHoSoGv = {
  tu: string; den: string; homNay: string;
  diemDungHan: OPtGv; viecDungHan: OPtGv; ghiKetQuaPa: OPtGv;
  ketQua: OPtGv;
  /** Chỉ kỹ năng có mẫu (`k: 'so'`). */
  ketQuaTheoKyNang: { khung: KhungPtGv; skill: string; nhan: string; o: OPtGv }[];
  /** P8 (22/10): theo LỚP em học lúc thi × kỹ năng — lượt của từng HV có tuần thi trong kỳ (không "MT gần nhất của lớp"). Panel `cot=ket-qua:<khung>:<kỹ năng>:<lớp>`. */
  ketQuaTheoLop: { classId: number; ma: string; khung: KhungPtGv; skill: string; nhan: string; o: OPtGv }[];
  /** `na` khi GV không dạy lớp Fast Track trong kỳ. */
  tienBo: OPtGv; paHieuQua: OPtGv;
  /**
   * UI-HO-SO-GV (bảng Học thuật): một hàng một LỚP EM HỌC LÚC THI (P8). `luot` = lượt khác nhau (một MT / một lần thi thật của một HV) có mục ở kỹ năng GV dạy,
   * `theoBai` tách theo bài (MT3 10 · MT2 2). `ketQua` = Σ các kỹ năng (lượt kỹ năng, cùng `ketQuaTheoLop`) · `tienBo` chỉ FT. Panel `ket-qua-lop:<lớp>` · `tien-bo-lop:<lớp>`.
   */
  hocThuatTheoLop: { classId: number; ma: string; khung: KhungPtGv; khai: string | null; xong: boolean; kyNang: string[]; luot: number; theoBai: { bai: string; n: number }[]; ketQua: OPtGv; tienBo: OPtGv; thiThat: OPtGv }[];
  /** UI-HO-SO-GV: Đạt Target thi thật — HV (một lần thi) có ngày thi thật trong kỳ, GV dạy kỹ năng ở lớp cuối trước ngày thi; `na` khi không dạy FT. Panel `thi-that[-lop:<lớp>]`. */
  thiThat: OPtGv;
  /** Thi thật theo kỹ năng GV phụ trách (chỉ kỹ năng có lần thi). Panel `thi-that-ky:<kỹ năng>` (+ `loc=dat|chua`). */
  thiThatTheoKyNang: { skill: string; nhan: string; o: OPtGv; vuot: number }[];
  /** Số lần thi thật Overall CAO HƠN Target (tập con của Đạt) — panel `thi-that` + `loc=vuot`. */
  thiThatVuot: number;
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

/**
 * Khoảng tuần (Q18): `thang=YYYY-MM` → các tuần có Thứ Năm thuộc tháng (`owningMonthOf`); `tu`,`den` (Thứ Hai, gồm cả tuần `den`) → khoảng tự do (P9, 22/10 — không trần);
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
    return { tu: q.tu, den: q.den };
  }
  const den = mondayOfDate(homNay);
  return { tu: addDaysIso(den, -21), den };
}

/** % làm tròn (Q19). */
export const phanTramGv = (dung: number, tong: number) => Math.round((100 * dung) / tong);
/** Chữ một ô: "18/20" + "90%" · "—" không áp dụng · "Chưa có dữ liệu" áp dụng mà mẫu 0 (V5 T19 — không hiện 0 %). Không "mẫu nhỏ" (10, 22/10). */
export function chuOPtGv(o: OPtGv): { so: string | null; phu: string } {
  if (o.k === 'na') return { so: null, phu: '—' };
  if (o.k === 'rong') return { so: null, phu: 'Chưa có dữ liệu' };
  return { so: `${o.dung}/${o.tong}`, phu: `${phanTramGv(o.dung, o.tong)}%` };
}

/** Ô từ tập (dung ⊆ tong) + có áp dụng không. */
export const oTuTap = (apDung: boolean, t: { dung: readonly unknown[]; tong: readonly unknown[] } | undefined): OPtGv =>
  !apDung ? { k: 'na' } : !t?.tong.length ? { k: 'rong' } : { k: 'so', dung: t.dung.length, tong: t.tong.length };
