/**
 * OV-11a (rà soát 14/10, TE-5, TE-6, CA3-1) — MỘT luật cho mọi cổng ghi vắng: gõ "-", nút Vắng trong hộp, ⋯ "Vắng".
 * Thuần: không đọc DB, không tự đọc ngày.
 */
import { mondayOfDate } from './week.ts';
import { addDaysIso } from './sos.ts';
import { tuanKeTiep } from './chamDiem.ts';
import { t } from '../i18n/index.ts';

/** Tuần thi (Thứ Hai `weekStart`) đã hết hẳn (qua Chủ nhật). */
export const sauTuanThi = (weekStart: string, homNay: string) => homNay.slice(0, 10) > addDaysIso(weekStart.slice(0, 10), 6);

/**
 * LUẬT 4 SỬA 21/10 (05 mục 4.4) — MỘT hàm cho mọi lối "-" Mock (gõ "-", nút Vắng, ⋯ Vắng / Báo vắng). `lan` = số lần vắng đã tính của chuỗi
 * (`absence_move_count`, đếm theo tuần — gõ lại trong cùng tuần không tới đây), `tuanThi` = thứ Hai tuần đang xếp, `mtCu` = cờ lượt MT cũ,
 * `vuong` = tuần kế vướng thứ tự đợt / hạn chót MT0 (máy chủ kiểm). MT cũ → huỷ ngay · lần ≥ 2 → huỷ · lần 1 → tuần kế CỦA LỊCH nếu tuần đó
 * chưa hết hẳn (ghi muộn vẫn dời), không thì thẻ "Dời lịch Test" gửi Quản lý.
 */
export function chuyenVang(o: { lan: number; tuanThi: string; homNay: string; mtCu: boolean; vuong: boolean }):
  { kq: 'doi' | 'the-ql' | 'huy'; tuanDich: string | null } {
  if (o.mtCu || o.lan >= 1) return { kq: 'huy', tuanDich: null };
  const ke = addDaysIso(mondayOfDate(o.tuanThi), 7);
  return !o.vuong && !sauTuanThi(ke, o.homNay) ? { kq: 'doi', tuanDich: ke } : { kq: 'the-ql', tuanDich: null };
}

/** Hoàn tác "-" (21/10): 10 giây trên web; máy chủ nhận thêm 5 giây cho mạng chậm. */
export const HOAN_TAC_VANG_MS = 10_000;
export function duocHoanTacVang(ghiLuc: string | null | undefined, bayGio: number): boolean {
  return !!ghiLuc && bayGio - Date.parse(ghiLuc) <= HOAN_TAC_VANG_MS + 5_000;
}

/**
 * Kết quả một lần ghi vắng (máy chủ trả): `doi` lần 1 dời tuần · `huy` lần 2 huỷ phần thi · `huy-cu` MT cũ huỷ ngay · `khong-du-thi` lớp thường ≥ 2 tuần ·
 * `cho-ql` vắng chờ Quản lý (thẻ) · `cho-o-kia` Writing mới một task "-".
 */
export type KetQuaVang = { kq: 'doi' | 'huy' | 'huy-cu' | 'khong-du-thi' | 'cho-ql' | 'cho-o-kia'; tuanMoi?: string | null };

/** Thông báo sau khi ghi — nói đúng hậu quả (CA3-1). */
export function cauDaGhiVang(mon: string, tenHv: string | undefined, k: KetQuaVang | null | undefined): string {
  const em = tenHv ? ` · ${tenHv}` : '';
  if (k?.kq === 'khong-du-thi') return t('Đã ghi Vắng · {mon}{em}', { mon, em });
  if (k?.kq === 'huy-cu') return t('Đã huỷ · vắng MT cũ · {mon}{em}', { mon, em });
  const sau = k?.kq === 'doi' && k.tuanMoi ? t(' · dời {tuanMoi}', { tuanMoi: k.tuanMoi }) : k?.kq === 'huy' ? t(' · huỷ kỹ năng') : k?.kq === 'cho-ql' ? t(' · chờ Quản lý') : '';
  return t('Đã ghi vắng {mon}{em}{sau}', { mon, em, sau });
}

/**
 * LỚP THƯỜNG "-" (Q1, chủ SP 14/10): tuần thi là tuần này hoặc tuần trước → dời sang TUẦN SAU CỦA TUẦN HIỆN TẠI (không dời vào tuần đã qua);
 * tuần thi cách tuần hiện tại ≥ 2 tuần → Không dự thi (không dời, không tính vắng, hết nợ — cùng mốc "MT cũ" T1).
 */
export function luatVangThuong(tuanThi: string, homNay: string): { khongDuThi: true } | { khongDuThi: false; tuanMoi: string } {
  const nay = mondayOfDate(homNay);
  if (addDaysIso(mondayOfDate(tuanThi), 14) <= nay) return { khongDuThi: true };
  return { khongDuThi: false, tuanMoi: tuanKeTiep(nay) };
}
