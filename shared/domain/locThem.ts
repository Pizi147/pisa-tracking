/**
 * BỘ LỌC THÊM của Học viên & Lớp › Tất cả (OV-15h2 ý 3, C31, mockup 5 khung 2): Case / PA · kỹ năng · kết quả · thời gian. Trong một nhóm là "hoặc",
 * giữa các nhóm là "và". Máy chủ gắn nhãn từng em (`ThemEm`, chỉ khi web hỏi `them=1`) từ CÙNG nguồn của trang (Case: `chiTietCaseMo` / `trangThaiCaseV4`;
 * kết quả: `standingFor`); web lọc danh sách bằng `khopLocThem` và Xuất Excel lấy đúng các em còn lại — một truy vấn cho bảng và tệp.
 * Chỉ lọc trạng thái HIỆN TẠI (Case đang mở, kết quả gần nhất); "Thời gian" = tuần thi của kết quả gần nhất nằm trong khoảng (không phải ngày mở Case).
 */
import { addDaysIso } from './sos.ts';
import { ketQuaLuot } from './keHoachOv15c.ts';
import type { KetQuaVao } from './hocVienLop.ts';

export const LOC_CASE = ['co-case', 'khong-case', 'trong-pa', 'cho-nhan-xet', 'cho-pa', 'pa-chay', 'pa-xong'] as const;
export type LocCase = (typeof LOC_CASE)[number];
export const NHAN_LOC_CASE = {
  'co-case': 'Có Case mở', 'khong-case': 'Không Case', 'trong-pa': 'Case trống PA', 'cho-nhan-xet': 'Chờ nhận xét',
  'cho-pa': 'PA chờ xác nhận / duyệt', 'pa-chay': 'PA đang chạy', 'pa-xong': 'PA xong · chờ đóng',
} as const satisfies Record<LocCase, string>;
export const LOC_KY_NANG = ['listening', 'reading', 'writing', 'speaking'] as const;
export const LOC_KET_QUA = ['dat', 'chua-dat', 'chua-du'] as const;
export type LocKetQua = (typeof LOC_KET_QUA)[number];
export const NHAN_LOC_KET_QUA = { dat: 'Đạt', 'chua-dat': 'Chưa đạt', 'chua-du': 'Chưa đủ điểm' } as const satisfies Record<LocKetQua, string>;

/** Nhãn của một em (máy chủ gắn): nhóm Case / PA, kỹ năng dưới kỳ vọng / trượt, kết quả, tuần thi (thứ Hai) của kết quả gần nhất. */
export type ThemEm = { case: LocCase[]; kn: string[]; kq: LocKetQua | null; tuan: string | null };
export type BoLocThem = { case: LocCase[]; kn: string[]; kq: LocKetQua[]; tu: string | null; den: string | null };

/** Một Case đang mở → nhóm Case / PA (cùng trạng thái V4 mọi màn dùng). `pa` = PA chưa huỷ của Case. */
export function nhomCase(k: string, pa: readonly { xong: boolean }[]): LocCase | null {
  if (k === 'cho-nhan-xet' || k === 'cho-nguyen-nhan') return 'cho-nhan-xet';
  if (k === 'cho-xac-nhan-pa' || k === 'cho-duyet-doi-pa' || k === 'cho-duyet-khong-theo-doi') return 'cho-pa';
  if (k !== 'dang-lam') return null;   // Chờ chốt SOS (tạm): chỉ "Có Case mở"
  return !pa.length ? 'trong-pa' : pa.some((x) => !x.xong) ? 'pa-chay' : 'pa-xong';
}

/** Các Case đang mở của một em → nhãn nhóm (không Case → "Không Case"). */
export function nhomCaseEm(cacCase: readonly { k: string; pa: readonly { xong: boolean }[] }[]): LocCase[] {
  if (!cacCase.length) return ['khong-case'];
  return ['co-case', ...new Set(cacCase.map((c) => nhomCase(c.k, c.pa)).filter((x): x is LocCase => !!x))];
}

/** Kết quả gần nhất theo luật từng khung (C27): FT OVR ≥ kỳ vọng; lớp thường mọi môn đạt; chưa đủ ô → Chưa đủ điểm. Chưa có lượt → null. */
export function ketQuaLoc(st: KetQuaVao | null): LocKetQua | null {
  if (!st?.attemptLabel) return null;
  if (st.required > 0 && st.scored < st.required) return 'chua-du';
  if (st.mode === 'ratio') return st.failed === null ? 'chua-du' : st.failed === 0 ? 'dat' : 'chua-dat';
  const kq = ketQuaLuot({ ovr: st.overall, kyVong: st.expectation, danhGiaDuoc: true });
  return kq === 'Đạt' ? 'dat' : kq === 'Chưa đạt' ? 'chua-dat' : 'chua-du';
}

/** Kỹ năng cần xử lý của kết quả gần nhất: FT dưới kỳ vọng, lớp thường môn trượt (W1 / W2 gộp W). */
export function kyNangLoc(st: KetQuaVao | null): string[] {
  const ds = [...(st?.belowSkills ?? []).map((x) => x.skill), ...(st?.failedSkills ?? []).map((x) => x.skill)];
  return [...new Set(ds.map((k) => (k.startsWith('writing') ? 'writing' : k)))];
}

export const locThemBat = (f: BoLocThem) => !!(f.case.length || f.kn.length || f.kq.length || (f.tu && f.den));

/** Một em có khớp Bộ lọc thêm không — trong nhóm "hoặc", giữa nhóm "và"; nhóm trống = không lọc. Em không có nhãn (chưa tải) → không khớp khi đang lọc. */
export function khopLocThem(t: ThemEm | undefined, f: BoLocThem): boolean {
  if (!locThemBat(f)) return true;
  if (!t) return false;
  if (f.case.length && !f.case.some((c) => t.case.includes(c))) return false;
  if (f.kn.length && !f.kn.some((k) => t.kn.includes(k))) return false;
  if (f.kq.length && !(t.kq && f.kq.includes(t.kq))) return false;
  if (f.tu && f.den && !(t.tuan && t.tuan <= f.den && addDaysIso(t.tuan, 6) >= f.tu)) return false;
  return true;
}

const ISO = /^\d{4}-\d{2}-\d{2}$/;
/** Tham số URL (`lc` · `lk` · `lq` · `ltu` · `lden`) → bộ lọc; giá trị lạ bị bỏ. */
export function docLocThem(get: (k: string) => string | null): BoLocThem {
  const ds = <T extends string>(k: string, hop: readonly T[]) => (get(k) ?? '').split(',').filter((x): x is T => (hop as readonly string[]).includes(x));
  const tu = get('ltu'), den = get('lden');
  const coKhoang = !!tu && !!den && ISO.test(tu) && ISO.test(den) && tu <= den;
  return { case: ds('lc', LOC_CASE), kn: ds('lk', LOC_KY_NANG), kq: ds('lq', LOC_KET_QUA), tu: coKhoang ? tu : null, den: coKhoang ? den : null };
}
