/**
 * TỔNG QUAN QUẢN LÝ — phương án A (OV-15d, mockup 3 mục 1; C23, Q5, Q6a). Kiểu dữ liệu chung máy chủ ↔ web + luật thuần "lớp có vấn đề".
 * Mọi số do `server/src/worklist/tongQuanQl.ts` đếm từ chỉ số trong sổ (`metricSet`) — bấm số mở panel cùng tập (C02).
 */

/** Một hàng "Lớp cần chú ý" (hoặc hàng tổng "Cả <chi nhánh>", `classId` null). `null` = cột không áp cho khung (Chưa lịch ở lớp thường). */
export type HangLopQl = {
  classId: number | null; lop: string; gvcn: string | null; hv: number;
  chuaLich: number | null; chuaDiem: number; sos1: number; sos2: number; sos3: number;
  /** Case chưa chốt PA — số HV và số Case (hai vùng bấm). */
  caseHv: number; caseN: number;
  daThiChoKq: number | null;
};
export const COT_LOP_QL = ['hv', 'chuaLich', 'chuaDiem', 'sos1', 'sos2', 'sos3', 'caseHv', 'caseN', 'daThiChoKq'] as const;
export type CotLopQl = (typeof COT_LOP_QL)[number];

/** "Chỉ lớp có vấn đề" (mockup 3): có ít nhất một số việc / tín hiệu khác 0 — HV không tính. */
export const lopCoVanDe = (h: Pick<HangLopQl, 'chuaLich' | 'chuaDiem' | 'sos1' | 'sos2' | 'sos3' | 'caseN' | 'daThiChoKq'>): boolean =>
  !!(h.chuaLich || h.chuaDiem || h.sos1 || h.sos2 || h.sos3 || h.caseN || h.daThiChoKq);

/** Một tuần ở khối "Tuần này": tuần đã / đang thi — chấm a/b + quá hạn; tuần tới — chỉ lịch. */
export type TuanQl = {
  weekStart: string; periodId: number | null; laTuanNay: boolean; tuongLai: boolean;
  lop: number; hv: number; daCham: number; tong: number; quaHan: number;
};
export type TestTuanNayQl = { classId: number; lop: string; dot: string; hv: number; daCham: number; tong: number; han: string | null; periodId: number | null };
/** Trễ chấm theo GV — `gvId` null: chưa phân công (0) / Speaking chấm chéo (-1 ở khoá panel). */
export type GvTreQl = { khoa: number; gvId: number | null; ten: string; kyNang: string[]; bai: number; lop: { code: string; n: number }[]; treNhat: number };

export type TongQuanQlA = {
  ct: 'ft' | 'thuong'; homNay: string;
  /** Số lớp đang mở mỗi khung (công tắc "Fast Track · 5 lớp"). */
  soLop: { ft: number; thuong: number };
  tomTat: { chuaLich: number | null; chuaDiemHv: number; caseChuaChotHv: number; caseChuaChot: number; caseQuaHan: number; baiTre: number; gvTre: number };
  lop: { hang: HangLopQl[]; tong: HangLopQl; tenChiNhanh: string | null };
  tuan: { truoc: number; tuan: TuanQl[]; testTuanNay: TestTuanNayQl[]; tre: GvTreQl[] };
};

/** "Cần bạn quyết" — gộp hai khung. Chờ duyệt đọc hộp duyệt (`/yeu-cau`), không lặp ở đây. */
export type CaseQuaHanQl = {
  caseId: number; em: { id: number; ten: string } | null; lop: string | null; nguoi: string | null; tinhTrang: string | null; soNgay: number; sos: number | null;
};
export type BuocTiepQl = { key: string; cycleId: number; em: { id: number; ten: string }; lop: string | null; ketQua: string; han: string; quaHan: boolean };
export type ChotLoTrinhQl = { classId: number; lop: string; chu: string; han: string | null; quaHan: boolean };
export type CanBanQuyet = { caseQuaHan: CaseQuaHanQl[]; buocTiep: BuocTiepQl[]; chotLoTrinh: ChotLoTrinhQl[] };
