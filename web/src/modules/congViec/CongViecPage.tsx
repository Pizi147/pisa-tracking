import { Link, Navigate, useParams, useSearchParams } from 'react-router-dom';
import { useSession } from '../../lib/session.tsx';
import { TasksBoard } from '../worklist/MgmtTasksPage.tsx';
import { MeetingBoard } from '../worklist/MeetingPage.tsx';
import { HoTroHocVienTab } from './HoTroHocVienTab.tsx';
import { HopChoDuyet } from '../duyet/HopChoDuyet.tsx';
import { YeuCauCuaToi } from '../duyet/YeuCauCuaToi.tsx';
import { DUONG_TAB_CONG_VIEC, NAV_RONG, nhanTabCongViec, tabCongViecHienThi, tabCongViecTuDuong } from '@shared/domain/index.ts';
import { t } from '@shared/i18n/index.ts';

/**
 * CÔNG VIỆC — MỘT DANH SÁCH (OV-15d, mockup OV-14 số 2 mục 2–3): bỏ hàng 4 tab. `/cong-viec` = Chờ bạn duyệt (khi có) · việc theo nhóm loại, xếp theo hạn ·
 * Việc quản lý (gập) — tất cả trong `HoTroHocVienTab`. Đường cũ `/cong-viec/cho-duyet|yeu-cau|van-hanh|bao-cao` vẫn mở đúng màn đầy đủ (hộp duyệt, yêu cầu
 * 60 ngày, bảng Vận hành, Báo cáo đơn vị) với lối "‹ Công việc" — lối vào là link trong danh sách, không còn tab.
 */
export default function CongViecPage() {
  const { session } = useSession();
  const { tab: seg } = useParams();
  const [params] = useSearchParams();
  const tabs = tabCongViecHienThi(session?.nav ?? NAV_RONG);
  const tab = tabCongViecTuDuong(seg);

  if (!tabs.length) return <Navigate to="/" replace />;
  if (!tab || !tabs.includes(tab)) {
    /* NỢ PR-O (#58): việc Vận hành giao cho GV mà GV không có quyền vào bảng Vận hành — giữ đúng việc đó bằng `mo-viec` (panel tại chỗ). */
    const open = params.get('open');
    if (open && tabs.includes('ho-tro')) return <Navigate to={`/cong-viec?mo-viec=${open}`} replace />;
    return <Navigate to={DUONG_TAB_CONG_VIEC[tabs.includes('ho-tro') ? 'ho-tro' : tabs[0]]} replace />;
  }
  if (tab === 'ho-tro') return <div className="page"><HoTroHocVienTab /></div>;

  const cn = params.get('cn');
  return (
    <div className="page space-y-4">
      <div className="flex flex-col gap-1">
        {tabs.includes('ho-tro') && <Link to={`/cong-viec${cn ? `?cn=${cn}` : ''}`} className="link w-fit text-[13px] max-sm:py-2">{t('‹ Công việc')}</Link>}
        <h1 className="m-0 text-xl font-bold text-slate-100">{nhanTabCongViec(tab, session?.nav ?? NAV_RONG)}</h1>
      </div>
      {tab === 'cho-duyet' && <HopChoDuyet />}
      {tab === 'yeu-cau' && <YeuCauCuaToi />}
      {tab === 'van-hanh' && <TasksBoard />}
      {tab === 'bao-cao' && <MeetingBoard />}
    </div>
  );
}
