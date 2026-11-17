import { createContext, useContext } from 'react';
import { useSession } from './session.tsx';
import { useChiNhanhMacDinh } from '../ui/Filters.tsx';

/**
 * DEM-VIEC (chủ SP 18/11 "thấy ghi có việc quá hạn nhưng vào xem không thấy gì"): MỘT đường `/my-work` "Của tôi" mặc định — badge, chuông, ô Tổng quan
 * "Việc của tôi", cột "Việc của tôi" HV & Lớp và Công việc "Của tôi" (chưa chọn chi nhánh khác) đọc CÙNG đường → cùng danh sách, cùng số, một GET.
 * GV thuần: không chi nhánh (Công việc lọc chi nhánh tại máy). Vai khác (QL · Quản trị · Admin · TVV): chi nhánh mặc định như ô Chi nhánh Công việc.
 */
export function useDuongViecCuaToi(): string | null {
  const { session } = useSession();
  const cn = useChiNhanhMacDinh({ boQuaDich: true });
  const nav = session?.nav;
  if (!session?.authenticated || !nav?.workSupport) return null;
  const gvThuong = !nav.workOps && !nav.workChamDiem && !nav.hvCuaToi;
  return gvThuong || !cn ? '/my-work' : `/my-work?branchId=${cn}`;
}

/**
 * Số "Việc của tôi" của người đang đăng nhập — `summary` của `/my-work` mà khung App đã tải cho badge Công việc (một GET, `demDongViec`).
 * Ô "Việc của tôi ›" ở Tổng quan đọc từ đây (XM 3, rà 11/11) — không tự gọi `/my-work` lần nữa. `null` = chưa tải / vai không có Công việc.
 */
export type SoViecCuaToi = { viec: number; viecQuaHan: number; canLamNgay: number };
export const ViecCuaToiCtx = createContext<SoViecCuaToi | null>(null);
export const useSoViecCuaToi = () => useContext(ViecCuaToiCtx);
/** GD-14: số thẻ chờ bạn duyệt (`/yeu-cau/dem` khung App đã tải cho badge / chuông) — ô "Chờ duyệt ›" Tổng quan Quản trị đọc từ đây, không GET lần nữa. */
export const DemYeuCauCtx = createContext<{ cho: number; quaHan: number } | null>(null);
export const useDemYeuCau = () => useContext(DemYeuCauCtx);
