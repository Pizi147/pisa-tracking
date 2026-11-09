/**
 * Việc CÓ HẠN của Công việc + "người xem QL chi nhánh" — sổ nghĩa vụ (`soNghiaVu.ts` · `tinhViecChiNhanh`) đọc việc mở của chi nhánh qua đây.
 * Nhóm có thể ra dòng quá hạn có hạn + người giữ thật (RA-LOI-0711h, DEM-QUA-HAN): Nhập điểm (bài, sổ riêng), Kết quả PA (nghĩa vụ riêng), Ý thức trừ Xử lý vi phạm
 * bắt buộc, Thiếu dữ liệu (không hạn), việc chưa ai giữ — không vào.
 */
import { db } from '../db.ts';
import { nho } from '../platform/nguCanhRequest.ts';
import type { Principal } from '../permissions.ts';
import type { WorkGroupKey } from '../worklist/mywork.ts';

export const VIEC_CO_HAN: ReadonlySet<WorkGroupKey> = new Set<WorkGroupKey>([
  'cause', 'ghi_nhan_xet', 'xac_nhan_pa', 'xem_nx_s', 'phoi_hop_sos', 'mini_test', 'no_plan', 'bao_ph_yt', 'buoc_tiep', 'ban_giao', 'yt_xu_ly',
]);

/**
 * Người giữ việc theo Công việc "Tất cả" của QUẢN LÝ chi nhánh (vai `manager` ở `cn`, không là người cụ thể) — bảng, panel bảng và hồ sơ GV (GV tự xem,
 * QL, QT) cùng MỘT cách gán: việc "chưa ai giữ" mà nhiều người làm được (Bước tiếp, Báo PH dự phòng QL) không thành việc của từng QL / TVV kiêm GV.
 */
export const quanLyCn = (cn: number): Principal => nho(`pt-gv:ql-cn:${cn}`, () => {
  const perms = (db().prepare(`SELECT p.key AS k FROM role_permissions rp JOIN roles r ON r.id = rp.role_id JOIN permissions p ON p.id = rp.permission_id
    WHERE r.key = 'manager'`).all() as any[]).map((r) => r.k as string);
  return { userId: -cn, code: '', fullName: '', title: null, roleKeys: ['manager'], assignments: [],
    grants: [{ id: 0, roleKey: 'manager', roleName: '', branchId: cn, branchName: null, permissions: new Set(perms) }] };
});
