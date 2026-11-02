import { Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useSession } from '../../lib/session.tsx';
import { HangTab } from '../../ui/HangTab.tsx';
import { LichTestTab } from './LichTestTab.tsx';
import { KeHoachTestTab } from './KeHoachTestTab.tsx';
import { ChamTestTab, viecChamCuaToi } from './ChamTestTab.tsx';
import { useApi } from '../../lib/useApi.ts';
import type { WorkItem } from '../worklist/WorkList.tsx';
import { PanelNhapDiemLop } from '../cham/PanelNhapDiemLop.tsx';
import {
  DUONG_TAB_TEST, NAV_RONG, TAB_TEST_LABEL, moDiemLopCu, tabTestHienThi, tabTestMacDinh, tabTestTuDuong, type TabTest,
} from '@shared/domain/index.ts';
import { t } from '@shared/i18n/index.ts';

/**
 * TEST — khu vực (O2; PR-UX1 bỏ Cần chấm): Lịch Test · Kế hoạch Test, mỗi tab một đường dẫn (OV-15b bỏ tab Điểm theo lớp: link cũ
 * `/test/diem-lop?lop=&luot=` mở Lịch Test + panel nhập điểm của đúng lớp đó; không `lop` thì về Lịch Test). Mở `/test`
 * thì vào Lịch Test. Chỉ một tab thì ẩn cả hàng tab, chỉ còn tiêu đề "Test" (Q15, mockup 13).
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
  /* UI-CHAM-TEST: số nhóm "Của tôi" trên tab Chấm Test — cùng GET `/my-work` với badge Công việc (gộp GET đang bay). */
  const viec = useApi<{ dong: WorkItem[] }>(tabs.includes('cham') ? '/my-work' : null, [tabs.includes('cham')]);

  if (!macDinh) return <Navigate to="/" replace />;
  const lopCu = tab === 'diem-lop' && moDiemLopCu(nav) ? Number(params.get('lop')) || null : null;
  if (!tab || (!tabs.includes(tab) && !lopCu)) {
    const qs = params.toString();
    return <Navigate to={`${DUONG_TAB_TEST[macDinh]}${qs ? `?${qs}` : ''}`} replace />;
  }

  const branchId = params.get('cn') ?? params.get('branchId');
  const dongLopCu = () => navigate(`${DUONG_TAB_TEST.lich}${branchId ? `?cn=${branchId}` : ''}`, { replace: true });
  const go = (k: TabTest) => navigate(`${DUONG_TAB_TEST[k]}${branchId ? `?cn=${branchId}` : ''}`);

  return (
    <div className="page space-y-4">
      <h1 className="text-xl font-bold text-slate-100 m-0">{t('Test')}</h1>
      {tabs.length > 1 && (
        <HangTab panelId="test-vung" ariaLabel={t('Test')} value={lopCu ? 'lich' : tab} onChange={go}
          tabs={tabs.map((k) => ({ key: k, label: TAB_TEST_LABEL[k], ...(k === 'cham' && viec.data ? { so: viecChamCuaToi(viec.data.dong).length, donVi: t('việc') } : {}) }))} />
      )}
      {/* DON-NHO-3 (TAB-A11Y): vùng tab cùng space-y-4 của trang → khoảng cách không đổi. */}
      <div id="test-vung" role="tabpanel" aria-label={TAB_TEST_LABEL[lopCu ? 'lich' : tab]} className="space-y-4">
        {(tab === 'lich' || lopCu) && <LichTestTab />}
        {lopCu && <PanelNhapDiemLop classId={lopCu} luot={params.get('luot')} onDong={dongLopCu} />}
        {tab === 'cham' && <ChamTestTab />}
        {tab === 'ke-hoach' && <KeHoachTestTab />}
      </div>
    </div>
  );
}
