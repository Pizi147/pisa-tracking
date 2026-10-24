import { useState } from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';
import { HaiKhoiGv } from './LopToiDay.tsx';
import { useSession } from '../../lib/session.tsx';
import { useApi } from '../../lib/useApi.ts';
import { BranchFilter, useChiNhanhMacDinh } from '../../ui/Filters.tsx';
import { LichSapToi } from './Highlights.tsx';
import { ErrorState, Skeleton } from '../../ui/ui.tsx';
import { DaiMoiDung } from '../huongDan/DaiMoiDung.tsx';
import { MockTestAdmin } from './MockTestAdmin.tsx';
import { CongTacKhung, khungDaNho } from '../../ui/CongTacKhung.tsx';
import {
  DauTrangTq, thamSoTq, TongQuanAdminV5, TongQuanCxV5, TongQuanGvV5, TongQuanQlV5, TongQuanQtV5, TongQuanTvvV5, type TongQuanV5Data,
} from './TongQuanV5.tsx';
import { laVaiQuanLy } from '@shared/domain/index.ts';
import { t } from '@shared/i18n/index.ts';

/**
 * TỔNG QUAN THEO VAI V5 (UI-TONG-QUAN, `thiet-ke/v5/tong-quan.html` phương án B) — trang đầu mọi vai (K10: GV cũng vậy). Chia vai theo cờ điều hướng của
 * máy chủ (`nav.ts`), dữ liệu theo quyền máy chủ: QL / QT / CX một GET `/tong-quan/v5`; GV `/giao-vien/:id/chi-so` + Lớp tôi dạy; TVV `/tong-quan/tvv`;
 * Admin 3 ô Mock Test + Lịch sắp tới (V4, bỏ "Đề nghị dời chờ"); Head tutor tạm dùng góc nhìn GV (chủ SP 23/10 — chưa có bộ thông tin Tutor). Chi nhánh đang chọn ở URL (`cn`), khung nhớ theo máy.
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

  if (vai === 'khac') return <Navigate to="/hoc-vien" replace />;
  const congTac = <CongTacKhung trang="tong-quan" value={khung} onChange={(k) => setKhung(k === 'thuong' ? 'thuong' : 'ft')} />;
  const chiNhanh = <BranchFilter branchId={branchId} onBranch={setBranchId} />;
  const trang = (phamVi: string, than: React.ReactNode, ben?: React.ReactNode) => (
    <div className="page space-y-4">
      <DauTrangTq phamVi={phamVi} ben={ben} />
      <DaiMoiDung />
      {than}
    </div>
  );

  if (vai === 'tvv') return trang(t('HV của tôi'), <TongQuanTvvV5 />);
  if (vai === 'gv' || vai === 'ht') return trang(session?.user?.fullName ?? '', <TongQuanGvV5 lopToiDay={<HaiKhoiGv />} />);
  if (vai === 'admin') {
    return trang(t('Mock Test'), <TongQuanAdminV5 cn={branchId} mockTest={<MockTestAdmin branchId={branchId} />} lich={<LichSapToi branchId={branchId} ct={null} />} />, chiNhanh);
  }
  const d = v5.data;
  const phamVi = d?.tenChiNhanh ?? t('Tất cả chi nhánh');
  const than = v5.error ? <ErrorState message={v5.error.message} hint={v5.error.hint} onRetry={v5.reload} />
    : !d ? <Skeleton rows={8} />
      : vai === 'cx' ? <TongQuanCxV5 d={d} onChiNhanh={setBranchId} />
        : d.lop ? <TongQuanQlV5 d={d} />
          : <TongQuanQtV5 d={d} onChiNhanh={setBranchId} />;
  return trang(vai === 'cx' ? `${phamVi} · ${t('chỉ xem')}` : phamVi, than, <>{congTac}{chiNhanh}</>);
}
