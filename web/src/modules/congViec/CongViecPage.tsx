import { Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useSession } from '../../lib/session.tsx';
import { HangTab } from '../../ui/HangTab.tsx';
import { TasksBoard } from '../worklist/MgmtTasksPage.tsx';
import { MeetingBoard } from '../worklist/MeetingPage.tsx';
import { HoTroHocVienTab } from './HoTroHocVienTab.tsx';
import {
  DUONG_TAB_CONG_VIEC, NAV_RONG, TAB_CONG_VIEC_LABEL, tabCongViecHienThi, tabCongViecTuDuong, type TabCongViec,
} from '@shared/domain/index.ts';

/**
 * CÔNG VIỆC — khung 3 tab (R1, spec §3.4). Mỗi tab có đường dẫn riêng; tab không có quyền thì bỏ hẳn.
 * Giáo viên chỉ có tab Hỗ trợ học viên nên không hiện hàng tab. Nội dung từng tab là màn cũ; PR-Ra làm lại.
 */
export default function CongViecPage() {
  const { session } = useSession();
  const { tab: seg } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const tabs = tabCongViecHienThi(session?.nav ?? NAV_RONG);
  const tab = tabCongViecTuDuong(seg);

  if (!tabs.length) return <Navigate to="/" replace />;
  if (!tab || !tabs.includes(tab)) return <Navigate to={DUONG_TAB_CONG_VIEC[tabs[0]]} replace />;

  const cn = params.get('cn');
  const go = (k: TabCongViec) => navigate(`${DUONG_TAB_CONG_VIEC[k]}${cn ? `?cn=${cn}` : ''}`);

  return (
    <div className="page space-y-4">
      <h1 className="text-lg font-semibold text-slate-100 m-0">Công việc</h1>
      {tabs.length > 1 && (
        <HangTab ariaLabel="Công việc" value={tab} onChange={go}
          tabs={tabs.map((k) => ({ key: k, label: TAB_CONG_VIEC_LABEL[k] }))} />
      )}
      {tab === 'ho-tro' && <HoTroHocVienTab />}
      {tab === 'van-hanh' && <TasksBoard />}
      {tab === 'bao-cao' && <MeetingBoard />}
    </div>
  );
}
