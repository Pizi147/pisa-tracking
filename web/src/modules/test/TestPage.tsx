import { Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useSession } from '../../lib/session.tsx';
import { HangTab } from '../../ui/HangTab.tsx';
import { CanChamTab } from './CanChamTab.tsx';
import { LichTestTab } from './LichTestTab.tsx';
import { KeHoachTestTab } from './KeHoachTestTab.tsx';
import {
  DUONG_TAB_TEST, NAV_RONG, TAB_TEST_LABEL, tabTestHienThi, tabTestMacDinh, tabTestTuDuong, type TabTest,
} from '@shared/domain/index.ts';

/**
 * TEST — khu vực mới (O2, spec §3.5): Cần chấm · Lịch Test · Kế hoạch Test, mỗi tab một đường dẫn.
 * Mở `/test` thì vào tab mặc định theo quyền (O2b): giáo viên → Cần chấm, người xếp lịch → Lịch Test.
 */
export default function TestPage() {
  const { session } = useSession();
  const { tab: seg } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const nav = session?.nav ?? NAV_RONG;
  const tabs = tabTestHienThi(nav);
  const macDinh = tabTestMacDinh(nav);
  const tab = tabTestTuDuong(seg);

  if (!macDinh) return <Navigate to="/" replace />;
  if (!tab || !tabs.includes(tab)) {
    const qs = params.toString();
    return <Navigate to={`${DUONG_TAB_TEST[macDinh]}${qs ? `?${qs}` : ''}`} replace />;
  }

  const branchId = params.get('branchId');
  const go = (k: TabTest) => navigate(`${DUONG_TAB_TEST[k]}${branchId ? `?branchId=${branchId}` : ''}`);

  return (
    <div className="page space-y-4">
      <h1 className="text-lg font-semibold text-slate-100 m-0">Test</h1>
      <HangTab ariaLabel="Test" value={tab} onChange={go}
        tabs={tabs.map((k) => ({ key: k, label: TAB_TEST_LABEL[k] }))} />
      {tab === 'can-cham' && <CanChamTab />}
      {tab === 'lich' && <LichTestTab />}
      {tab === 'ke-hoach' && <KeHoachTestTab />}
    </div>
  );
}
