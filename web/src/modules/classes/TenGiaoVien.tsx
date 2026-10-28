import { Link } from 'react-router-dom';
import { useSession } from '../../lib/session.tsx';
import { duongHoSoGiaoVien, laVaiQuanLy } from '@shared/domain/index.ts';

/**
 * TÊN GIÁO VIÊN Ở HỒ SƠ LỚP / DANH SÁCH LỚP (đặc tả §3.7, §4 "Hồ sơ GV"; Q2). Là link khi đã có trang hồ sơ GV (PR-GV bật
 * `CO_TRANG_HO_SO_GIAO_VIEN`) VÀ người xem được xem hồ sơ đó (QL trong phạm vi · GV chỉ chính mình). Ngược lại là chữ thường.
 */
export function TenGiaoVien({ id, ten }: { id: number | null; ten: string }) {
  const { session } = useSession();
  const den = duongHoSoGiaoVien(id, { userId: session?.user?.id ?? 0, laQuanLy: laVaiQuanLy(session?.roles) || !!session?.nav?.phanTichGv });   // OV-10a: Admin (`analysis.view_teacher`) mở được hồ sơ GV như QL
  return den
    ? <Link className="ten-ho-so max-sm:py-3 max-sm:-my-3" to={den}>{ten}</Link>   /* audit P2-3: 375 vùng chạm cao như mẫu K3 */
    : <span className="text-slate-200">{ten}</span>;
}
