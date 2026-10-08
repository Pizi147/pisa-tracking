/**
 * PR-PA (§8): MỘT mẫu PA cho mọi đường (tay, quy chế SOS, bổ trợ, tutor kỳ vọng). Luật thuần — web và máy chủ cùng gọi.
 * Số buổi chỉ với Tutor, Tự học, Bổ trợ, Bổ trợ miễn phí; không bắt buộc; số nguyên 1–60. Tự học không có ô người.
 */
import { dsLoi, type LoiTruong } from './loiForm.ts';
import { nguoiThanhPayload, nguoiThieu, type NguoiChon } from './nguoiThucHien.ts';
import { KHAC_TOI_THIEU } from './khac.ts';

export const LOAI_CO_SO_BUOI = ['tutor', 'self_study', 'bo_tro', 'bo_tro_mien_phi'] as const;
const LOAI_NGUOI_DAY = new Set(['tutor', 'bo_tro', 'bo_tro_mien_phi']);
export const SO_BUOI_TOI_DA = 60;

export const coSoBuoi = (kind: string): boolean => (LOAI_CO_SO_BUOI as readonly string[]).includes(kind);
export const coNguoiDay = (kind: string): boolean => kind !== 'self_study';
export const nhanNguoiDay = (kind: string): 'Người dạy' | 'Người thực hiện' => (LOAI_NGUOI_DAY.has(kind) ? 'Người dạy' : 'Người thực hiện');

/** Ô trống (null, '', khoảng trắng) → null; còn lại → số (có thể NaN / không nguyên — hàm kiểm quyết). */
export function soBuoiTu(v: unknown): number | null {
  if (v === null || v === undefined || String(v).trim() === '') return null;
  return Number(String(v).trim());
}
const nguyenTrong = (n: number, tu: number) => Number.isInteger(n) && n >= tu && n <= SO_BUOI_TOI_DA;

/** Số buổi của PA: trống được; 1–60 nguyên; không nhỏ hơn số buổi đã dạy. → câu lỗi | null. */
export function kiemSoBuoiPa(v: unknown, daDay = 0): string | null {
  const n = soBuoiTu(v);
  if (n === null) return null;
  if (!nguyenTrong(n, 1)) return 'Từ 1 đến 60 buổi, hoặc để trống';
  if (n < daDay) return `Đã dạy ${daDay} buổi — Số buổi từ ${daDay} trở lên, hoặc để trống`;
  return null;
}

/** Số buổi tuần này (Kết quả của PA có Số buổi): bắt buộc, số nguyên 0–60 (0 = em nghỉ). → câu lỗi | null. */
export function kiemSoBuoiTuan(v: unknown): string | null {
  const n = soBuoiTu(v);
  return n !== null && nguyenTrong(n, 0) ? null : 'Từ 0 đến 60 buổi';
}

/** Đếm buổi: đã dạy / tổng · còn · chưa đủ | đủ | vượt (đủ / vượt chỉ gợi ý "Kết thúc PA"). */
export function demBuoi(daDay: number, tong: number): { da: number; tong: number; con: number; tt: 'chua' | 'du' | 'vuot' } {
  return { da: daDay, tong, con: Math.max(0, tong - daDay), tt: daDay < tong ? 'chua' : daDay === tong ? 'du' : 'vuot' };
}

// ------------------------------------------------------------------ form PA (web: FormPa — Thêm · Sửa · Thay · Xác nhận PA)

/** Giá trị form PA. Số buổi giữ dạng chữ người gõ; Tên đề xuất chỉ với PA "Khác". */
export type GiaTriPa = { kind: string; description: string; soBuoi: string; nguoi: NguoiChon | null; ghiRo: string };

/** Người mặc định theo Loại: Người dạy → trống; Người thực hiện → "Tôi". */
export const nguoiMacDinh = (kind: string): NguoiChon | null => (nhanNguoiDay(kind) === 'Người dạy' ? null : { kieu: 'toi' });
export const paMoi = (kind: string): GiaTriPa => ({ kind, description: '', soBuoi: '', nguoi: nguoiMacDinh(kind), ghiRo: '' });

/** Người hiện tại của PA thành giá trị ô chọn người: tài khoản nếu có, người ngoài nếu chỉ có tên, không có → `null`. */
export function nguoiCuaPa(pa: { performerUserId?: number | null; performer?: string | null }): NguoiChon | null {
  if (pa.performerUserId) return { kieu: 'tai_khoan', id: pa.performerUserId, ten: pa.performer ?? `#${pa.performerUserId}` };
  if (pa.performer) return { kieu: 'ngoai', ten: pa.performer };
  return null;
}
export function khacNguoi(a: NguoiChon | null, b: NguoiChon | null): boolean {
  if (!a || !b) return a !== b;
  if (a.kieu !== b.kieu) return true;
  return a.kieu === 'tai_khoan' ? a.id !== (b as typeof a).id : a.kieu === 'ngoai' ? a.ten.trim() !== (b as typeof a).ten.trim() : false;
}

/** Lỗi của form PA. `goc` (Sửa PA): ô KHÔNG đổi thì không kiểm — PA vượt buổi (Số buổi < đã dạy), mô tả cũ ngắn vẫn sửa được ô khác. */
export function loiFormPa(v: GiaTriPa, o: { toiThieu?: number; daDay?: number; goc?: GiaTriPa } = {}): LoiTruong[] {
  const { goc } = o;
  const doi = (k: 'description' | 'soBuoi') => !goc || v[k].trim() !== goc[k].trim();
  const loi = dsLoi([
    ...(v.kind === 'other_proposal' && !goc ? [{ khoa: 'ghi-ro', nhan: 'Tên đề xuất', toiThieu: KHAC_TOI_THIEU }] : []),
    ...(doi('description') ? [{ khoa: 'noi-dung', nhan: 'Nội dung', toiThieu: o.toiThieu ?? 8 }] : []),
  ], { 'ghi-ro': v.ghiRo, 'noi-dung': v.description });
  const sb = coSoBuoi(v.kind) && doi('soBuoi') ? kiemSoBuoiPa(v.soBuoi, o.daDay ?? 0) : null;
  if (sb) loi.push({ khoa: 'so-buoi', nhan: 'Số buổi', lyDo: sb });
  const ng = coNguoiDay(v.kind) ? nguoiThieu(v.nguoi, false) : null;
  if (ng) loi.push({ khoa: 'nguoi', nhan: nhanNguoiDay(v.kind), lyDo: ng });
  return loi;
}

/** Thân gửi máy chủ của PA mới (Thêm PA, Thay PA) — cũng dùng cho Xác nhận PA (máy chủ chỉ đọc Nội dung · Số buổi · người). */
export function paPayload(v: GiaTriPa) {
  return {
    kind: v.kind, description: v.description.trim(), soBuoi: coSoBuoi(v.kind) ? soBuoiTu(v.soBuoi) : null,
    ...(coNguoiDay(v.kind) ? nguoiThanhPayload(v.nguoi) : {}),
    ...(v.kind === 'other_proposal' ? { ghiRoKhac: v.ghiRo.trim() } : {}),
  };
}

/**
 * Thân `PATCH /interventions/:id` (Sửa PA): CHỈ ô đã đổi — ô không đổi không gửi, nên máy chủ không kiểm lại (người cũ đã nghỉ, PA vượt
 * buổi). Đổi người → gửi đủ ba khoá người (cả ba trống = xoá người). Số buổi xoá trắng → `null`. `{}` = chưa sửa gì.
 */
export function thanSuaPa(v: GiaTriPa, goc: GiaTriPa, ngay: { moi: string; cu: string | null }): Record<string, unknown> {
  const body: Record<string, unknown> = {};
  if (v.description.trim() !== goc.description.trim()) body.description = v.description.trim();
  if (v.soBuoi.trim() !== goc.soBuoi.trim()) body.soBuoi = soBuoiTu(v.soBuoi);
  if (khacNguoi(v.nguoi, goc.nguoi)) Object.assign(body, { performerSelf: false, performerUserId: null, performerName: null }, nguoiThanhPayload(v.nguoi));
  if (ngay.moi && ngay.moi !== (ngay.cu ?? '')) body.startedDate = ngay.moi;
  return body;
}
