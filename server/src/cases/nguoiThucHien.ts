import { badRequest } from '../util.ts';
import { laNguoiHopLe } from '../platform/timNguoi.ts';
import type { Principal } from '../permissions.ts';
import type { NhomNguoi } from '../../../shared/domain/index.ts';

/**
 * NGƯỜI THỰC HIỆN — KIỂM Ở MỘT CHỖ (PR-Form F-2, Q2, Q5).
 *
 * Trước PR-Form mỗi nơi ghi (`recordIntervention`, `backfillCase`, `updateResult`, `chuanHoaDieuChinh`, `confirmMeasure`…)
 * tự kiểm `performerUserId`/`performerName` theo cách riêng. Nay MỘT hàm — cùng luật, cùng câu báo lỗi, ở mọi nơi.
 */

export type NguoiThucHienKetQua = { userId: number; name: null } | { userId: null; name: string };

const NHOM_MESSAGE: Record<NhomNguoi, string> = {
  giao_vien: 'Người thực hiện phải là giáo viên đang làm việc. Người ngoài thì chọn "Người ngoài" và gõ tên.',
  nhan_vien: 'Người thực hiện phải là nhân viên đang làm việc. Người ngoài thì chọn "Người ngoài" và gõ tên.',
};

/**
 * Chuẩn hoá `{ performerSelf, performerUserId, performerName }` thành MỘT trong hai dạng — tài khoản, hoặc tên người
 * ngoài — không bao giờ cả hai. Trả `null` khi không gửi gì (không bắt buộc → giữ nguyên người cũ, tuỳ nơi gọi).
 *
 * Thứ tự ưu tiên khi body gửi nhiều trường cùng lúc: `performerUserId` → `performerName` → `performerSelf`.
 */
export function chuanHoaNguoiThucHien(
  p: Principal,
  input: { performerSelf?: boolean; performerUserId?: number | null; performerName?: string | null },
  /** `branchId`: tài khoản được chọn phải có vai ở đúng chi nhánh này (PR-S5F-b — người dạy bổ trợ cùng chi nhánh của lớp). */
  opts: { nhom: NhomNguoi; batBuoc: boolean; branchId?: number | null },
): NguoiThucHienKetQua | null {
  if (input.performerUserId) {
    if (!laNguoiHopLe(input.performerUserId, opts.nhom)) throw badRequest(NHOM_MESSAGE[opts.nhom]);
    if (opts.branchId && !laNguoiHopLe(input.performerUserId, opts.nhom, opts.branchId)) {
      throw badRequest('Người dạy phải là giáo viên cùng chi nhánh với lớp. Người ngoài thì chọn "Người ngoài" và gõ tên.');
    }
    return { userId: input.performerUserId, name: null };
  }
  const ten = (input.performerName ?? '').trim();
  if (ten) {
    if (ten.length < 2 || ten.length > 100) throw badRequest('Tên người thực hiện phải từ 2 đến 100 ký tự.');
    return { userId: null, name: ten };
  }
  if (input.performerSelf) return { userId: p.userId, name: null };
  if (opts.batBuoc) throw badRequest('Cần ghi ai là người thực hiện — người nhập không mặc định là người làm.');
  return null;
}
