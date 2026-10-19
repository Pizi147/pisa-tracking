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
 * CÔNG VIỆC — MỘT DANH SÁCH (OV-15d, mockup 2 mục 3: bỏ 4 tab). `/cong-viec` là danh sách (Chờ bạn duyệt là nhóm đầu, Việc quản lý gập cuối).
 * Các đường con giữ cho link cũ / chuông / "Mở hộp duyệt ›", "Vận hành ›", "Yêu cầu chờ duyệt ›": hộp duyệt đầy đủ (Báo QL, Đã xử lý), Yêu cầu
 * của tôi, bảng Vận hành, Báo cáo đơn vị — trang riêng có "‹ Công việc", không còn hàng tab. Đường không có quyền thì bỏ hẳn.
 */
export default function CongViecPage() {
  const { session } = useSession();
  const { tab: seg } = useParams();
  const [params] = useSearchParams();
  const nav = session?.nav ?? NAV_RONG;
  const tabs = tabCongViecHienThi(nav);
  const tab = tabCongViecTuDuong(seg);

  if (!tabs.length) return <Navigate to="/" replace />;
  if (!tab || !tabs.includes(tab)) {
    /*
     * NỢ PR-O (#58): tab "Vận hành" giao cho GV mà GV không có quyền vào cả tab — giữ đúng việc đó bằng tham số `mo-viec`
     * (danh sách tự mở panel Vận hành tại chỗ khi thấy tham số này).
     */
    const open = params.get('open');
    if (open) return <Navigate to={`/cong-viec?mo-viec=${open}`} replace />;
    return <Navigate to={DUONG_TAB_CONG_VIEC[tabs[0]]} replace />;
  }
  if (tab === 'ho-tro') return <div className="page"><HoTroHocVienTab /></div>;

  return (
    <div className="page space-y-4">
      <div className="space-y-1">
        {tabs.includes('ho-tro') && <Link to="/cong-viec" className="link text-[13px]">{t('‹ Công việc')}</Link>}
        <h1 className="text-lg font-semibold text-slate-100 m-0">{nhanTabCongViec(tab, nav)}</h1>
      </div>
      {tab === 'cho-duyet' && <HopChoDuyet />}
      {tab === 'yeu-cau' && <YeuCauCuaToi />}
      {tab === 'van-hanh' && <TasksBoard />}
      {tab === 'bao-cao' && <MeetingBoard />}
    </div>
  );
}
