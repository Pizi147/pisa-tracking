/**
 * BẢNG — LUẬT THUẦN CỦA `web/src/ui/Bang.tsx` (BANG-0, 04 mục 6). Kiểu cột quyết định căn + rộng cho CẢ tiêu đề và ô (cùng `data-kieu`),
 * nên tiêu đề và ô không thể lệch nhau. Mười một kiểu ô + hai tính năng cột (`phu` chú thích tiêu đề, `nhom` nhóm 2 tầng) = 13 kiểu.
 */

export type KieuCot = 'ten' | 'chu' | 'so' | 'diem' | 'noi-bat' | 'chip' | 'tuan' | 'viec' | 'nut' | 'diem-ti-le' | 'phan-tram';

/** Căn + rộng px (null = có thể là cột linh hoạt; chỉ MỘT cột linh hoạt mỗi bảng — `cotLinhHoat`). */
export const KIEU_COT: Record<KieuCot, { can: 'trai' | 'giua' | 'phai'; rong: number | null }> = {
  ten: { can: 'trai', rong: null },          // khi không linh hoạt: 205 (tên dài 15 px + đệm)
  chu: { can: 'trai', rong: null },
  so: { can: 'giua', rong: 76 },
  diem: { can: 'giua', rong: 80 },
  'noi-bat': { can: 'giua', rong: 80 },
  chip: { can: 'trai', rong: 140 },
  tuan: { can: 'trai', rong: 96 },
  viec: { can: 'trai', rong: null },
  nut: { can: 'phai', rong: 48 },
  'diem-ti-le': { can: 'giua', rong: 88 },
  'phan-tram': { can: 'giua', rong: 72 },   // 64 ở 04 mục 6.2 không vừa đầu cột "% tổng" 13 px + đệm 12 × 2
};
const RONG_TEN = 205;
const RONG_CHU = 240;

/** Một cột. `nhan` / `phu` chỉ là CHỮ — cấm điều khiển trong tiêu đề (04 mục 6.3). */
export type DinhNghiaCot = {
  key: string; nhan: string; kieu: KieuCot;
  /** Chú thích cùng dòng tiêu đề, 12 px ("/25", "chấm chéo"). */
  phu?: string;
  /** Tên nhóm 2 tầng — cột liền nhau cùng nhóm gộp một ô tiêu đề. */
  nhom?: string;
  /** Rộng px riêng (chỉ khi kiểu mặc định không vừa — vd cột điểm có dòng phụ dài: 88). */
  rong?: number;
};

/** Key của MỘT cột linh hoạt: việc › chữ › tên; không có cột chữ → null. */
export function cotLinhHoat(cot: readonly DinhNghiaCot[]): string | null {
  for (const k of ['viec', 'chu', 'ten'] as const) {
    const c = cot.find((x) => x.kieu === k);
    if (c) return c.key;
  }
  return null;
}

/** Rộng px của cột; null = cột linh hoạt (nhận phần dư). Không bao giờ %. */
export function rongCot(c: DinhNghiaCot, cot: readonly DinhNghiaCot[]): number | null {
  if (c.key === cotLinhHoat(cot)) return null;
  return c.rong ?? KIEU_COT[c.kieu].rong ?? (c.kieu === 'ten' ? RONG_TEN : RONG_CHU);
}

/** Hàng tiêu đề nhóm (colSpan) hoặc null khi bảng không có nhóm. */
export function nhomTieuDe(cot: readonly DinhNghiaCot[]): Array<{ nhan: string | null; span: number }> | null {
  if (!cot.some((c) => c.nhom)) return null;
  const out: Array<{ nhan: string | null; span: number }> = [];
  for (const c of cot) {
    const n = c.nhom ?? null;
    const cuoi = out[out.length - 1];
    if (cuoi && n !== null && cuoi.nhan === n) cuoi.span++;
    else out.push({ nhan: n, span: 1 });
  }
  return out;
}

/** Thẻ 375 (04 mục 6.4): đầu = tên + chip · lưới điểm (không tách nhãn khỏi số) · còn lại theo thứ tự cột · dưới = việc + nút. */
export function chiaThe(cot: readonly DinhNghiaCot[]): { dau: string[]; diem: string[]; khac: string[]; duoi: string[] } {
  const r = { dau: [] as string[], diem: [] as string[], khac: [] as string[], duoi: [] as string[] };
  for (const c of cot) {
    if (c.kieu === 'ten' || c.kieu === 'chip') r.dau.push(c.key);
    else if (c.kieu === 'diem' || c.kieu === 'noi-bat' || c.kieu === 'diem-ti-le' || c.kieu === 'phan-tram') r.diem.push(c.key);
    else if (c.kieu === 'viec' || c.kieu === 'nut') r.duoi.push(c.key);
    else r.khac.push(c.key);
  }
  return r;
}
