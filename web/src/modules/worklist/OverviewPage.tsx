import { useState } from 'react';
import { Link, Navigate, useSearchParams } from 'react-router-dom';
import { LopToiDay } from './LopToiDay.tsx';
import { useSession } from '../../lib/session.tsx';
import { useApi } from '../../lib/useApi.ts';
import { BranchFilter, useChiNhanhMacDinh } from '../../ui/Filters.tsx';
import { BranchPulse } from './BranchPulse.tsx';
import { LichSapToi } from './Highlights.tsx';
import { MetricTiles } from './MetricTiles.tsx';
import { DaiChoDuyet, DiemDangChuY, KhoiCanXuLy } from './KhoiCanXuLy.tsx';
import { DaiTomTat, KhoiCanQuyet } from './KhoiCanQuyet.tsx';
import { LopCanChuY, TreCham, thamSoTq, type QuanLyData, type TongQuanQlData } from './TongQuanQl.tsx';
import { ErrorState, Skeleton } from '../../ui/ui.tsx';
import { HocVienCuaToi } from './HocVienCuaToi.tsx';
import { DaiMoiDung } from '../huongDan/DaiMoiDung.tsx';
import { MockTestAdmin } from './MockTestAdmin.tsx';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import { CongTacKhung, khungDaNho } from '../../ui/CongTacKhung.tsx';
import { TAB_TONG_QUAN_LABEL, laVaiQuanLy, ngay } from '@shared/domain/index.ts';
import { t } from '@shared/i18n/index.ts';

/**
 * TỔNG QUAN THEO VAI (PR-VAI-a, mockup 23). Trang đầu trả lời một câu: hôm nay tôi phải làm gì.
 *
 * Quản lý: công tắc `Fast Track · Lớp thường` đầu trang áp MỌI số trên trang (SL2, 9.1-4) — dải, Cần bạn quyết (trừ Chờ duyệt: hộp dùng chung, ghi
 * "cả hai khung"), Lớp cần chú ý, Tuần này. CX giữ bố cục Số liệu cũ.
 * Tab "Việc hôm nay · Phân tích" nằm trên ĐƯỜNG DẪN (`/`, `/phan-tich`) nên Back giữ đúng chỗ; không lặp tiêu đề "Tổng quan" (K1-10).
 */
/* OV-15e (plan §7): Phân tích thành mục thanh trên (`/phan-tich`, `PhanTichPage`) — Tổng quan không còn hàng tab "Việc hôm nay · Phân tích". */
export default function OverviewPage() {
  const { session } = useSession();
  const [params, setParams] = useSearchParams();
  const canSeeBoard = !!session?.nav?.analysis;
  const { homNay } = useNgayNghiepVu();
  /* CHI NHÁNH ĐANG CHỌN NẰM TRÊN ĐỊA CHỈ TRANG (`cn`) — một nguồn cho cả trang, gửi đường dẫn vẫn ra đúng chi nhánh. */
  const macDinh = useChiNhanhMacDinh();
  const branchId = params.get('cn') ? Number(params.get('cn')) : macDinh;
  const setBranchId = (id: number | null) => {
    const next = new URLSearchParams(params);
    if (id) next.set('cn', String(id)); else next.delete('cn');
    setParams(next);
  };
  /* Q5, Q31-1: khung của phần Số liệu — mặc định Fast Track (hai khung, PR-Pb2-a); nhớ theo máy. */
  const [khung, setKhung] = useState<'ft' | 'thuong'>(() => (khungDaNho('tong-quan') === 'thuong' ? 'thuong' : 'ft'));
  // Chỉ hiện khi có mốc dữ liệu; không truyền "hôm nay" → dd/mm/yyyy (mockup)
  const duLieuDen = homNay ? t('Dữ liệu đến {ngay}', { ngay: ngay(homNay) }) : null;

  /*
   * OV-10c (mockup vai 13/10 mục 4–6): tab đầu theo việc của vai — Admin "Mock Test" (4 ô + GV chấm quá hạn + Lịch sắp tới, không khối Case / PA);
   * CX "Số liệu" (ô đếm học viên mọi chi nhánh + Số liệu, không "Việc hôm nay"). QL / Quản trị giữ nguyên.
   */
  const vai: 'ql' | 'admin' | 'cx' = laVaiQuanLy(session?.roles) ? 'ql' : session?.nav?.workChamDiem ? 'admin' : session?.roles?.includes('cx') ? 'cx' : 'ql';
  /* KHUNG-LOI (A1-07): tiêu đề = tên menu ở mọi vai (trước: "Mock Test" Admin, "Số liệu" CX, "Việc hôm nay" QL / QT). */
  const nhanTabDau = TAB_TONG_QUAN_LABEL['tong-quan'];
  const laTqQl = vai === 'ql' && canSeeBoard && !session?.nav?.hvCuaToi;
  const tq = useApi<TongQuanQlData>(laTqQl ? `/tong-quan/ql?${thamSoTq(branchId, khung)}` : null, [branchId, khung]);
  /* Cần bạn quyết + dải tóm tắt: việc của QL (quyền xem việc người khác) — SL2 (9.1-4): cùng công tắc khung với cả trang. */
  const ql = useApi<QuanLyData>(laTqQl && session?.nav?.work ? `/tong-quan/quan-ly?${thamSoTq(branchId, khung)}` : null, [branchId, khung]);

  /* PR-OV2a (mockup overhaul-3 §3): TVV — tab đầu là "Học viên của tôi", không có việc của Quản lý; Phân tích như vai có quyền xem. */
  if (session?.nav?.hvCuaToi) {
    return (
      <div className="page space-y-4">
        <h1 className="m-0 text-lg font-semibold text-slate-100">{TAB_TONG_QUAN_LABEL['tong-quan']}</h1>
        <DaiMoiDung />
        <HocVienCuaToi />
      </div>
    );
  }

  /*
   * NEN-V5 (08 K10): GIÁO VIÊN có Tổng quan (trang đầu) — tạm dùng khối "Lớp tôi dạy" sẵn có (chỉ lớp / bài của chính GV, không thêm quyền) + lối vào
   * Công việc; bố cục Tổng quan GV V5 ("Kỹ năng tôi dạy" · "Lớp tôi chủ nhiệm") làm ở UI-TONG-QUAN. Vai không có Công việc giữ đường cũ.
   */
  if (!canSeeBoard && !session?.nav?.work) return <Navigate to="/hoc-vien" replace />;
  if (!canSeeBoard) {
    return (
      <div className="page space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-x-3 gap-y-2">
          <h1 className="m-0 text-xl font-bold text-slate-100">{nhanTabDau}</h1>
          <Link to="/cong-viec" className="btn btn-sm min-h-[44px] no-underline sm:min-h-[32px]">{t('Công việc ›')}</Link>
        </div>
        <DaiMoiDung />
        <LopToiDay />
      </div>
    );
  }

  return (
    <div className="page space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-x-3 gap-y-2">
        <h1 className="m-0 text-lg font-semibold text-slate-100">{nhanTabDau}</h1>{/* OV-11f (P2-5): mọi vai có h1 */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
          {duLieuDen && <span className="text-xs text-slate-500">{duLieuDen}</span>}
          <BranchFilter branchId={branchId} onBranch={setBranchId} />
        </div>
      </div>
      {vai === 'admin' && (
        <>
          <MockTestAdmin branchId={branchId} />
          <LichSapToi branchId={branchId} ct={null} />
        </>
      )}
      {vai === 'ql' && (
        /* OV-15d — TỔNG QUAN QL A (mockup 3, C23): dải tóm tắt nhỏ dẫn tới việc · Cần bạn quyết · Lớp cần chú ý · Tuần này. Thống kê chi tiết ở Phân tích.
           OV-15h1: hai GET `/tong-quan/quan-ly` + `/tong-quan/ql` (trước 4: quan-ly · chi-nhanh · highlights · giao-vien) — cùng hàm đếm, số không đổi. */
        <>
          <DaiMoiDung />
          <div className="flex flex-wrap items-center gap-3">
            <CongTacKhung trang="tong-quan" value={khung} onChange={(k) => setKhung(k === 'thuong' ? 'thuong' : 'ft')} />
            <span className="flex-1" />
            {/* Báo cáo = tab đầu của Phân tích (kế hoạch OV-15 mục 7, OV-15e) — mở thẳng. */}
            <Link to={`/phan-tich?goc=bao-cao${branchId ? `&cn=${branchId}` : ''}`} className="btn btn-sm min-h-[44px] no-underline sm:min-h-[32px]">{t('Báo cáo ›')}</Link>
          </div>
          {/* Hai khối việc của QL (quyền xem việc người khác, `/tong-quan/quan-ly`) — lỗi / đang tải riêng, không chờ phần theo khung. */}
          {ql.data && <DaiTomTat data={ql.data} bang={tq.data?.bang ?? null} branchId={branchId} ct={khung} />}
          {session?.nav?.work && <KhoiCanQuyet data={ql.data} loading={ql.loading} error={ql.error} reload={ql.reload} branchId={branchId} onKhung={setKhung} />}
          {/* Phần theo khung (`/tong-quan/ql`): lỗi / đang tải chỉ che Lớp cần chú ý + Tuần này. */}
          {tq.error ? <ErrorState message={tq.error.message} hint={tq.error.hint} onRetry={tq.reload} />
            : !tq.data ? <Skeleton rows={6} />
            : (
              <>
                <LopCanChuY data={tq.data.bang} branchId={branchId} ct={khung} />
                <section aria-labelledby="tuan-nay" className="space-y-3">
                  <h2 id="tuan-nay" className="m-0 text-base font-semibold text-slate-100">{t('Tuần này')}</h2>
                  <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-3">
                    <LichSapToi branchId={branchId} ct={khung} duLieu={tq.data.lich} />
                    {/* Trễ chấm theo GV (mockup 3) — số bài bấm ra đúng bài của GV đó (QL nhập tại chỗ); GV đã nhận thông báo tự động, không có Nhắc. */}
                    {session?.nav?.phanTichGv && <TreCham ds={tq.data.tre} branchId={branchId} ct={khung} />}
                  </div>
                </section>
              </>
            )}
        </>
      )}
      {vai === 'cx' && (
        <>
          <DaiMoiDung />
          {/* ─────────────── tầng 1: việc chờ Quản lý quyết + việc đang trễ (gộp hai khung) */}
          {session?.nav?.workApprove && <DaiChoDuyet branchId={branchId} />}
          {/* PR-OV2a: Cần xử lý là việc — CX (không có Công việc) chỉ xem Số liệu. */}
          {session?.nav?.work && <KhoiCanXuLy branchId={branchId} />}

          {/* OV-10c: CX — ô đếm học viên bấm được (mọi chi nhánh, hoặc chi nhánh đang chọn), như TVV. */}
          {vai === 'cx' && <HocVienCuaToi branchId={branchId} />}

          {/* ─────────────── tầng 3: số theo khung */}
          <section aria-labelledby="so-lieu" className={`space-y-3 ${vai === 'cx' ? '' : 'pt-3'}`}>
            <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
              <div className="flex flex-wrap items-center gap-3">
                {/* CX: tab đã tên "Số liệu" — không lặp tiêu đề, giữ tên cho trình đọc màn hình. */}
                <h2 id="so-lieu" className={vai === 'cx' ? 'sr-only' : 'm-0 text-base font-semibold text-slate-100'}>{t('Số liệu')}</h2>
                <CongTacKhung trang="tong-quan" value={khung} onChange={(k) => setKhung(k === 'thuong' ? 'thuong' : 'ft')} />
              </div>
            </div>
            <MetricTiles branchId={branchId} ct={khung} />
            {/* OV-11f (P1-1): dưới `lg` một cột co theo màn (không phình theo nội dung rộng nhất → trang không trượt ngang ở 375). */}
            <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-3 lg:grid-cols-2">
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
