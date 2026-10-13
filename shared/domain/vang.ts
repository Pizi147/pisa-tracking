/**
 * OV-11a (rà soát 14/10, TE-5, TE-6, CA3-1) — MỘT luật cho mọi cổng ghi vắng: gõ "-", nút Vắng / Không dự thi trong hộp, ⋯ "Vắng".
 * Thuần: không đọc DB, không tự đọc ngày.
 */
import { mondayOfDate } from './week.ts';
import { addDaysIso } from './sos.ts';
import { tuanKeTiep } from './chamDiem.ts';

/** Tuần thi (Thứ Hai `weekStart`) đã hết hẳn (qua Chủ nhật) — Mock: "-" lúc này là Không dự thi, không dời (OV-1b). */
export const sauTuanThi = (weekStart: string, homNay: string) => homNay.slice(0, 10) > addDaysIso(weekStart.slice(0, 10), 6);

/** Chữ nút trong hộp nhập điểm Mock: sau tuần thi / MT cũ → "Không dự thi" (không dời); trong tuần → "Vắng" (lần 1 dời, lần 2 huỷ). */
export function chuNutVang(o: { weekStart: string | null | undefined; lichSu: boolean; homNay: string }): 'Vắng' | 'Không dự thi' {
  return o.lichSu || (!!o.weekStart && sauTuanThi(o.weekStart, o.homNay)) ? 'Không dự thi' : 'Vắng';
}

/**
 * Kết quả một lần ghi vắng (máy chủ trả): `doi` lần 1 dời tuần · `huy` lần 2 huỷ phần thi · `khong-du-thi` sau tuần thi / MT cũ ·
 * `cho-ql` vắng chờ Quản lý xếp lại · `cho-o-kia` Writing mới một task "-".
 */
export type KetQuaVang = { kq: 'doi' | 'huy' | 'khong-du-thi' | 'cho-ql' | 'cho-o-kia'; tuanMoi?: string | null };

/** Thông báo sau khi ghi — nói đúng hậu quả (CA3-1). */
export function cauDaGhiVang(mon: string, tenHv: string | undefined, k: KetQuaVang | null | undefined): string {
  const em = tenHv ? ` · ${tenHv}` : '';
  if (k?.kq === 'khong-du-thi') return `Đã ghi Không dự thi · ${mon}${em}`;
  const sau = k?.kq === 'doi' && k.tuanMoi ? ` · dời ${k.tuanMoi}` : k?.kq === 'huy' ? ' · huỷ phần thi' : k?.kq === 'cho-ql' ? ' · chờ Quản lý' : '';
  return `Đã ghi vắng ${mon}${em}${sau}`;
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
