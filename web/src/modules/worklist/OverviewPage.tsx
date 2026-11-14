import { useState } from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';
import { LopCuaToi } from '../congViec/LopCuaToi.tsx';
import { useSession } from '../../lib/session.tsx';
import { useApi } from '../../lib/useApi.ts';
import { BranchFilter, useChiNhanhMacDinh } from '../../ui/Filters.tsx';
import { LichSapToi } from './Highlights.tsx';
import { ErrorState, Skeleton } from '../../ui/ui.tsx';
import { MockTestAdmin } from './MockTestAdmin.tsx';
import { CongTacKhung, khungDaNho } from '../../ui/CongTacKhung.tsx';
import {
  DauTrangTq, lienKetTq, thamSoTq, TongQuanAdminV5, TongQuanCxV5, TongQuanQlV5, TongQuanQtV5, TongQuanTvvV5, type TongQuanV5Data,
} from './TongQuanV5.tsx';
import { laVaiQuanLy } from '@shared/domain/index.ts';
import { t } from '@shared/i18n/index.ts';

/**
 * TỔNG QUAN THEO VAI V5 (UI-TONG-QUAN, `thiet-ke/v5/tong-quan.html` phương án B) — trang đầu mọi vai (K10: GV cũng vậy). Chia vai theo cờ điều hướng của
 * máy chủ (`nav.ts`), dữ liệu theo quyền máy chủ: QL / QT / CX một GET `/tong-quan/v5`; GV `/giao-vien/:id/chi-so` + Lớp tôi dạy; TVV `/tong-quan/tvv`;
 * Admin 3 ô Mock Test + Lịch sắp tới (V4, bỏ "Đề nghị dời chờ"); LG-7: Head tutor (và GV chưa có lớp) — không có Công việc → trang đầu rỗng của GV ("Lớp của tôi"), 0 GET. Chi nhánh đang chọn ở URL (`cn`), khung nhớ theo máy.
 */
export default function OverviewPage() {
  const { session } = useSession();
  const [params, setParams] = useSearchParams();
  const nav = session?.nav;
  const macDinh = useChiNhanhMacDinh();
  const branchId = params.get('cn') ? Number(params.get('cn')) : macDinh;
  const setBranchId = (id: number | null) => {
    const next = new URLSearchParams(params);
    if (id) next.set('cn', String(id)); else next.delete('cn');
    setParams(next);
  };
  const [khung, setKhung] = useState<'ft' | 'thuong'>(() => (khungDaNho('tong-quan') === 'thuong' ? 'thuong' : 'ft'));
  const vai = nav?.hvCuaToi ? 'tvv'
    : !nav?.analysis ? (nav?.work ? 'gv' : nav?.students ? 'khac' : 'ht')
      : laVaiQuanLy(session?.roles) ? 'ql' : nav?.workChamDiem ? 'admin' : session?.roles?.includes('cx') ? 'cx' : 'ql';
  const v5 = useApi<TongQuanV5Data>(vai === 'ql' || vai === 'cx' ? `/tong-quan/v5?${thamSoTq(branchId, khung)}` : null, [branchId, khung, vai]);
  /* TQ-GON (M3): kỳ số liệu GV / TVV ghi MỘT lần ở đầu trang như QL (L6) — cùng GET khối bên dưới đang gọi (`useApi` gộp), không thêm request. */
  const kyTvv = useApi<{ ky: { tu: string; den: string } }>(vai === 'tvv' ? '/tong-quan/tvv' : null, [vai]).data?.ky;

  if (vai === 'khac') return <Navigate to="/hoc-vien" replace />;
  /* GD-1 (Overhaul V6, mockup v21 ①): trang đầu GV = Công việc (việc bên trái + "Lớp của tôi" bên phải); số liệu GV sang Hồ sơ GV. Giữ tham số (`cn`…). */
  if (vai === 'gv') return <Navigate to={`/cong-viec${params.toString() ? `?${params}` : ''}`} replace />;
  const congTac = <CongTacKhung v8 trang="tong-quan" value={khung} onChange={(k) => setKhung(k === 'thuong' ? 'thuong' : 'ft')} />;
  const chiNhanh = <BranchFilter branchId={branchId} onBranch={setBranchId} />;
  const trang = (phamVi: string, than: React.ReactNode, ben?: React.ReactNode, ky?: { tu: string; den: string } | null) => (
    <div className="page tq-v8 space-y-4">
      <DauTrangTq phamVi={phamVi} ben={ben} ky={ky}
        lienKet={lienKetTq(vai === 'ql' && v5.data && !v5.data.lop ? 'qt' : vai, { id: session?.user?.id, cn: branchId, ky: v5.data?.ky, motCn: !!v5.data?.lop })} />
      {than}
    </div>
  );

  if (vai === 'tvv') return trang(t('HV của tôi'), <TongQuanTvvV5 />, undefined, kyTvv);
  /* LG-7 (chủ SP 14/11 "Head tutor vẫn là GV là chính"): không quyền Công việc (Head tutor, GV chưa phân công) → khung "Lớp của tôi" của trang đầu GV,
     rỗng đúng chữ ("Chưa được phân công lớp nào"), không request. Head tutor dạy lớp = có thêm vai Giáo viên → vai 'gv' ở trên. */
  if (vai === 'ht') return trang('', <LopCuaToi dong={[]} dangTai={false} loi={null} onMo={() => {}} />);
  if (vai === 'admin') {
    return trang(t('Mock Test'), <TongQuanAdminV5 mockTest={<MockTestAdmin branchId={branchId} />} lich={<LichSapToi branchId={branchId} ct={null} />} />, chiNhanh);
  }
  const d = v5.data;
  const phamVi = d?.tenChiNhanh ?? t('Tất cả chi nhánh');
  const than = v5.error ? <ErrorState message={v5.error.message} hint={v5.error.hint} status={v5.error.status} onRetry={v5.reload} />
    : !d ? <Skeleton rows={8} />
      : vai === 'cx' ? <TongQuanCxV5 d={d} onChiNhanh={setBranchId} />
        : d.lop ? <TongQuanQlV5 d={d} />
          : <TongQuanQtV5 d={d} onChiNhanh={setBranchId} />;
  /* [XM 4] chủ SP 11/11: CX giữ quyền sửa (+ Thêm học viên, + Lớp, Sửa thông tin) → đầu trang không ghi "chỉ xem". */
  return trang(phamVi, than, <>{congTac}{chiNhanh}</>, d?.ky);
}
