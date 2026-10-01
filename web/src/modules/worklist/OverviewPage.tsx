import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useSession } from '../../lib/session.tsx';
import { BranchFilter } from '../../ui/Filters.tsx';
import { CaseBoard } from '../cases/CaseBoardPage.tsx';
import { BranchPulse } from './BranchPulse.tsx';
import { LichSapToi } from './Highlights.tsx';
import { MetricTiles } from './MetricTiles.tsx';
import { DaiChoDuyet, DiemDangChuY, KhoiCanXuLy } from './KhoiCanXuLy.tsx';
import { ViecCuaToi, YeuCauCuaToi } from './ViecCuaToi.tsx';
import { LopToiDay } from './LopToiDay.tsx';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import { HangTab } from '../../ui/HangTab.tsx';
import { CongTacKhung, khungDaNho } from '../../ui/CongTacKhung.tsx';
import { TAB_TONG_QUAN_LABEL, ngay, tuanLich, type TabTongQuan } from '@shared/domain/index.ts';

/**
 * TỔNG QUAN THEO VAI (PR-VAI-a, mockup 23). Trang đầu trả lời một câu: hôm nay tôi phải làm gì.
 *
 * Quản lý (màn B) — BA TẦNG: tầng 1 là dải Chờ duyệt + Cần xử lý (luôn gộp hai khung); tầng 3 là Số liệu (4 ô, Điểm đáng chú ý, Lịch
 * sắp tới, bảng chi nhánh) theo công tắc `Fast Track · Lớp thường` đặt ĐẦU phần Số liệu — đặt đầu trang dễ hiểu nhầm là cả trang đổi.
 * Tab "Việc hôm nay · Phân tích" nằm trên ĐƯỜNG DẪN (`/`, `/phan-tich`) nên Back giữ đúng chỗ; không lặp tiêu đề "Tổng quan" (K1-10).
 */
export default function OverviewPage({ tab: tabProp = 'tong-quan' }: { tab?: TabTongQuan } = {}) {
  const { session } = useSession();
  const [params, setParams] = useSearchParams();
  const canSeeBoard = !!session?.nav?.analysis;
  const { homNay, ngan } = useNgayNghiepVu();
  const tab = canSeeBoard && tabProp === 'phan-tich' ? 'board' : 'work';
  const navigate = useNavigate();
  const goTab = (k: TabTongQuan) => {
    const cn = params.get('cn');
    navigate(`${k === 'phan-tich' ? '/phan-tich' : '/'}${cn ? `?cn=${cn}` : ''}`);
  };
  /* CHI NHÁNH ĐANG CHỌN NẰM TRÊN ĐỊA CHỈ TRANG (`cn`) — một nguồn cho cả trang, gửi đường dẫn vẫn ra đúng chi nhánh. */
  const branchId = params.get('cn') ? Number(params.get('cn')) : null;
  const setBranchId = (id: number | null) => {
    const next = new URLSearchParams(params);
    if (id) next.set('cn', String(id)); else next.delete('cn');
    setParams(next);
  };
  /* Q5, Q31-1: khung của phần Số liệu — mặc định Fast Track, không "Cả hai"; nhớ theo máy. */
  const [khung, setKhung] = useState<'ft' | 'thuong'>(() => (khungDaNho('tong-quan') === 'thuong' ? 'thuong' : 'ft'));
  // Chỉ hiện khi có mốc dữ liệu; không truyền "hôm nay" → dd/mm/yyyy (mockup)
  const duLieuDen = session?.demoDate ? `Dữ liệu đến ${ngay(session.demoDate)}` : null;

  if (!canSeeBoard) {
    /*
     * GIÁO VIÊN (mockup 23 màn A/C): tầng 1 = Việc của tôi · hôm nay (+ Yêu cầu của tôi bên cạnh); tầng 3 = Lớp tôi dạy. Lời chào nói
     * tuần bằng mã tuần, hôm nay bằng ngày (Q22).
     */
    const ten = (session?.user?.fullName ?? '').trim().split(/\s+/).pop() ?? '';
    return (
      <div className="page space-y-4">
        <div className="flex flex-col gap-0.5">
          <h1 className="m-0 text-lg font-semibold text-slate-100">{ten ? `Chào ${ten}` : 'Tổng quan'}</h1>
          <span className="text-xs text-slate-500">Tuần <b className="font-semibold tabular-nums text-slate-300">{tuanLich(homNay, homNay)}</b> · hôm nay {ngan(homNay)}</span>
        </div>
        <div className="grid items-start gap-3 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
          <ViecCuaToi />
          <YeuCauCuaToi />
        </div>
        <LopToiDay />
      </div>
    );
  }

  return (
    <div className="page space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-x-3 gap-y-2">
        <HangTab ariaLabel="Tổng quan" value={tabProp} onChange={goTab}
          tabs={(['tong-quan', 'phan-tich'] as const).map((k) => ({ key: k, label: TAB_TONG_QUAN_LABEL[k] }))} />
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
          {duLieuDen && <span className="text-xs text-slate-500">{duLieuDen}</span>}
          <BranchFilter branchId={branchId} onBranch={setBranchId} />
        </div>
      </div>
      {tab === 'board' && <CaseBoard embedded />}
      {tab === 'work' && (
        <>
          {/* ─────────────── tầng 1: việc chờ Quản lý quyết + việc đang trễ (gộp hai khung) */}
          <DaiChoDuyet branchId={branchId} />
          <KhoiCanXuLy branchId={branchId} />

          {/* ─────────────── tầng 3: số theo khung */}
          <section aria-labelledby="so-lieu" className="space-y-3 pt-3">
            <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
              <div className="flex flex-wrap items-center gap-3">
                <h2 id="so-lieu" className="m-0 text-base font-semibold text-slate-100">Số liệu</h2>
                <CongTacKhung trang="tong-quan" value={khung} onChange={(k) => setKhung(k === 'thuong' ? 'thuong' : 'ft')} />
              </div>
              <span className="text-xs text-slate-500">Chỉ phần số đổi theo khung · Chờ duyệt và Cần xử lý luôn gộp</span>
            </div>
            <MetricTiles branchId={branchId} ct={khung} />
            <div className="grid items-start gap-3 lg:grid-cols-2">
              <DiemDangChuY branchId={branchId} ct={khung} />
              <LichSapToi branchId={branchId} ct={khung} />
            </div>
            <BranchPulse branchId={branchId} ct={khung} />
          </section>
        </>
      )}
    </div>
  );
}
