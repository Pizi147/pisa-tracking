import { useNavigate, useSearchParams } from 'react-router-dom';
import { useSession } from '../../lib/session.tsx';
import { BranchFilter } from '../../ui/Filters.tsx';
import { CaseBoard } from '../cases/CaseBoardPage.tsx';
import { BranchPulse } from './BranchPulse.tsx';
import { LichSapToi } from './Highlights.tsx';
import { MetricTiles } from './MetricTiles.tsx';
import { ChonChuongTrinh } from './ChonChuongTrinh.tsx';
import { KhoiCanXuLy } from './KhoiCanXuLy.tsx';
import { ViecCuaToi } from './ViecCuaToi.tsx';
import { HocVienCanHoTro } from './HocVienCanHoTro.tsx';
import { HangTab } from '../../ui/HangTab.tsx';
import { TAB_TONG_QUAN_LABEL, chuongTrinhTuThamSo, ngay, type ChuongTrinh, type TabTongQuan } from '@shared/domain/index.ts';

/**
 * TỔNG QUAN (§3.2): Quản lý — thanh ngữ cảnh, 4 ô, Cần xử lý cạnh Điểm đáng chú ý, Lịch sắp tới, bảng chi nhánh.
 * Giáo viên — Việc cần làm của tôi, Học viên cần hỗ trợ.
 *
 * Số tổng là ngôn ngữ của báo cáo; người đi dạy cần biết "em nào đang cần mình", không cần biết cả chi nhánh có bao
 * nhiêu Case. Nên hai vai thấy hai màn khác nhau, và mọi con số Quản lý thấy đều bấm ra đúng danh sách tạo nên nó.
 */
export default function OverviewPage({ tab: tabProp = 'tong-quan' }: { tab?: TabTongQuan } = {}) {
  const { session } = useSession();
  const [params, setParams] = useSearchParams();
  /*
   * HAI CÂU HỎI KHÁC NHAU, KHÔNG PHẢI HAI MÀN HÌNH KHÁC NHAU.
   *   Tổng quan — tôi phải làm gì bây giờ?
   *   Phân tích — cả chi nhánh đang thế nào?
   * Quản lý cần cả hai, nhưng không cần cùng lúc; nhét chung một trang là cách chắc chắn
   * nhất để việc của mình chìm trong số liệu của người khác. Tab nằm trên ĐƯỜNG DẪN
   * (`/` và `/phan-tich`), không phải tham số `?tab=`, nên Back giữ đúng chỗ và gửi đường
   * dẫn cho người khác vẫn ra đúng màn.
   */
  const canSeeBoard = !!session?.nav?.analysis;
  /*
   * TAB "BÁO CÁO TUẦN" ĐÃ BỎ (mục 12) — owner nói "chưa cần thiết ở giai đoạn này".
   *
   * Chức năng Quản lý giao việc cho giáo viên thì GIỮ, và chuyển sang tab Phân tích: nó là
   * việc làm hằng ngày, còn báo cáo tuần là một nghi thức họp. Địa chỉ cũ `?tab=tinh-hinh`
   * do `duongMoi` chuyển hướng sang `/phan-tich` — đường dẫn cũ ai đó đã gửi cho nhau vẫn mở
   * được.
   */
  const tab = canSeeBoard && tabProp === 'phan-tich' ? 'board' : 'work';
  const navigate = useNavigate();
  const goTab = (k: TabTongQuan) => {
    const cn = params.get('cn');
    navigate(`${k === 'phan-tich' ? '/phan-tich' : '/'}${cn ? `?cn=${cn}` : ''}`);
  };
  /*
   * CHI NHÁNH ĐANG CHỌN NẰM TRÊN ĐỊA CHỈ TRANG, KHÔNG NẰM TRONG BỘ NHỚ CỦA RIÊNG MÀN NÀY.
   *
   * Lỗi owner báo 12/09: chọn Hải Dương mà bảng không đổi. Nguyên nhân là màn này giữ chi
   * nhánh trong state riêng, còn bảng vấn đề bên dưới (`CaseBoard`) đọc tham số `cn` trên
   * địa chỉ — HAI bộ lọc chi nhánh độc lập trên cùng MỘT màn hình. Nay chỉ còn một nguồn:
   * tham số `cn`. Đổi ở đâu thì cả trang đổi theo, và gửi đường dẫn cho người khác vẫn ra
   * đúng chi nhánh đó.
   */
  const branchId = params.get('cn') ? Number(params.get('cn')) : null;
  const setBranchId = (id: number | null) => {
    const next = new URLSearchParams(params);
    if (id) next.set('cn', String(id)); else next.delete('cn');
    setParams(next);
  };
  /* CHƯƠNG TRÌNH ĐANG CHỌN (`ct`) cũng nằm trên địa chỉ, cùng chỗ với `cn`; vắng = Fast Track (Q31-1). */
  const ct = chuongTrinhTuThamSo(params.get('ct'));
  const setCt = (v: ChuongTrinh) => {
    const next = new URLSearchParams(params);
    next.set('ct', v);
    setParams(next, { replace: true });
  };
  // Chỉ hiện khi có mốc dữ liệu; không truyền "hôm nay" → dd/mm/yyyy (mockup)
  const duLieuDen = session?.demoDate ? `Dữ liệu đến ${ngay(session.demoDate)}` : null;

  if (!canSeeBoard) {
    /* GIÁO VIÊN (§3.2): Việc cần làm của tôi + Học viên cần hỗ trợ; lịch thu gọn ở cuối. */
    const ten = (session?.user?.fullName ?? '').trim().split(/\s+/).pop() ?? '';
    return (
      <div className="page space-y-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h1 className="text-lg font-semibold text-slate-100 m-0">{ten ? `Chào ${ten}` : 'Tổng quan'}</h1>
          {duLieuDen && <span className="text-xs text-slate-500">{duLieuDen}</span>}
        </div>
        <div className="grid gap-3 lg:grid-cols-[1.25fr_1fr] items-start">
          <ViecCuaToi />
          <HocVienCanHoTro />
        </div>
        <LichSapToi branchId={null} ct={null} />
      </div>
    );
  }

  return (
    <div className="page space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-lg font-semibold text-slate-100 m-0">Tổng quan</h1>
        <div className="flex flex-wrap items-center gap-2">
          {tab === 'work' && <ChonChuongTrinh value={ct} onChange={setCt} />}
          <BranchFilter branchId={branchId} onBranch={setBranchId} />
        </div>
      </div>
      <div className="flex flex-wrap items-end justify-between gap-2">
        <HangTab ariaLabel="Tổng quan" value={tabProp} onChange={goTab}
          tabs={(['tong-quan', 'phan-tich'] as const).map((k) => ({ key: k, label: TAB_TONG_QUAN_LABEL[k] }))} />
        {duLieuDen && <span className="text-xs text-slate-500 pb-1">{duLieuDen}</span>}
      </div>
      {tab === 'board' && <CaseBoard embedded />}
      {tab === 'work' && (
        <>
          <MetricTiles branchId={branchId} ct={ct} />
          <KhoiCanXuLy branchId={branchId} ct={ct} />
          <LichSapToi branchId={branchId} ct={ct} />
          <BranchPulse branchId={branchId} ct={ct} />
        </>
      )}
    </div>
  );
}
