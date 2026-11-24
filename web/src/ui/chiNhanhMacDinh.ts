import { useSearchParams } from 'react-router-dom';
import { useSession } from '../lib/session.tsx';
import { chiNhanhMacDinh, coDichLienKet } from '@shared/domain/index.ts';
import { hauToGocNhin } from './CongTacKhung.tsx';

/* PR-NV (T9): MỘT giá trị nhớ cho mọi ô chi nhánh — id hoặc 'tat-ca', mỗi tài khoản một khoá (máy dùng chung). localStorage hỏng /
   bị chặn thì chạy như chưa nhớ gì. */
const khoaChiNhanh = (uid: number | undefined) => `pisa.chiNhanh.${uid ?? 0}${hauToGocNhin()}`;
export function docChiNhanhDaNho(uid: number | undefined): number | 'tat-ca' | null {
  try {
    const v = localStorage.getItem(khoaChiNhanh(uid));
    if (v === 'tat-ca') return v;
    const n = Number(v);
    return v && Number.isInteger(n) && n > 0 ? n : null;
  } catch { return null; }
}
export function nhoChiNhanh(uid: number | undefined, id: number | null): void {
  try { localStorage.setItem(khoaChiNhanh(uid), id ? String(id) : 'tat-ca'); } catch { /* không nhớ được thì thôi */ }
}
/**
 * Chi nhánh mặc định khi URL không có `cn` (và không trỏ một thẻ / lớp — `coDichLienKet`): lần tự chọn trước (còn trong quyền) → gợi ý của máy chủ (Quản lý/Quản trị) → `cuoi` → Tất cả.
 * Ô chi nhánh ẩn (≤ 1 chi nhánh) → null như hôm nay. Không ghi URL, không ghi localStorage — chỉ lần người dùng tự chọn mới nhớ.
 */
export function useChiNhanhMacDinh(o?: { cuoi?: number | null; /** DEM-VIEC: khung App (badge) — không theo link trỏ thẻ / lớp của trang đang mở. */ boQuaDich?: boolean }): number | null {
  const { session, branchCount } = useSession();
  const [params] = useSearchParams();
  if (branchCount <= 1 || (!o?.boQuaDich && coDichLienKet(params))) return null;
  const nho = docChiNhanhDaNho(session?.user?.id);
  const g = session?.grants ?? [];
  /* ponytail: chi nhánh ngừng hoạt động vẫn qua kiểm này — người dùng chọn lại một lần; kiểm theo /ref/branches nếu gặp */
  const hopLe = nho === 'tat-ca' || (nho !== null && g.some((x) => x.branchId === null || x.branchId === nho));
  return chiNhanhMacDinh({ daChon: hopLe ? nho : null, quanLy: [], lopDay: [], cuoi: session?.chiNhanhGoiY ?? o?.cuoi ?? null });
}
