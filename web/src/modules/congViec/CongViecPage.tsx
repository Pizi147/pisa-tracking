import { Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useSession } from '../../lib/session.tsx';
import { HangTab } from '../../ui/HangTab.tsx';
import { TasksBoard } from '../worklist/MgmtTasksPage.tsx';
import { MeetingBoard } from '../worklist/MeetingPage.tsx';
import { HoTroHocVienTab } from './HoTroHocVienTab.tsx';
import { HopChoDuyet } from '../duyet/HopChoDuyet.tsx';
import { YeuCauCuaToi } from '../duyet/YeuCauCuaToi.tsx';
import {
  DUONG_TAB_CONG_VIEC, NAV_RONG, TAB_CONG_VIEC_LABEL, tabCongViecHienThi, tabCongViecTuDuong, type TabCongViec,
} from '@shared/domain/index.ts';

/**
 * CÔNG VIỆC — khung tab (R1, spec §3.4; PR-DUYET thêm Chờ duyệt cho người duyệt, Yêu cầu của tôi cho GV). Mỗi tab có đường dẫn riêng; tab không có quyền thì bỏ hẳn.
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
  if (!tab || !tabs.includes(tab)) {
    /*
     * NỢ PR-O (#58): tab "Vận hành" giao cho GV mà GV không có quyền vào cả tab — thay vì
     * đẩy về tab đầu tiên và MẤT hẳn việc đang mở, giữ đúng việc đó bằng tham số `mo-viec`
     * (tab Hỗ trợ học viên tự mở panel Vận hành tại chỗ khi thấy tham số này).
     */
    const open = params.get('open');
    if (open) return <Navigate to={`/cong-viec?mo-viec=${open}`} replace />;
    return <Navigate to={DUONG_TAB_CONG_VIEC[tabs[0]]} replace />;
  }

  const cn = params.get('cn');
  const go = (k: TabCongViec) => navigate(`${DUONG_TAB_CONG_VIEC[k]}${cn ? `?cn=${cn}` : ''}`);
  /* OV-5a (CV2): điện thoại đang mở một việc → màn đầy đủ của việc đó ("‹ Công việc" ở trên panel), đầu trang ẩn. */
  const anDau = tab === 'ho-tro' && params.has('viec') ? 'max-lg:hidden' : '';

  return (
    <div className="page space-y-4">
      <h1 className={`text-lg font-semibold text-slate-100 m-0 ${anDau}`}>Công việc</h1>
      {tabs.length > 1 && (
        <div className={anDau}>
          <HangTab ariaLabel="Công việc" value={tab} onChange={go}
            tabs={tabs.map((k) => ({ key: k, label: TAB_CONG_VIEC_LABEL[k] }))} />
        </div>
      )}
      {tab === 'cho-duyet' && <HopChoDuyet />}
      {tab === 'ho-tro' && <HoTroHocVienTab />}
      {tab === 'yeu-cau' && <YeuCauCuaToi />}
      {tab === 'van-hanh' && <TasksBoard />}
      {tab === 'bao-cao' && <MeetingBoard />}
    </div>
  );
}
