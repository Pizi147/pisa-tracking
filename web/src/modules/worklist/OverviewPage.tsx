import { useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { useSession } from '../../lib/session.tsx';
import { useApi } from '../../lib/useApi.ts';
import { BranchFilter, useChiNhanhMacDinh } from '../../ui/Filters.tsx';
import { PhanTich } from '../phanTich/PhanTich.tsx';
import { BranchPulse } from './BranchPulse.tsx';
import { LichSapToi } from './Highlights.tsx';
import { MetricTiles } from './MetricTiles.tsx';
import { DaiChoDuyet, DiemDangChuY, KhoiCanXuLy } from './KhoiCanXuLy.tsx';
import { DaiTomTat, KhoiCanQuyet } from './KhoiCanQuyet.tsx';
import { BangGiaoVienChiNhanh } from '../giaoVien/BangGiaoVienChiNhanh.tsx';
import { HocVienCuaToi } from './HocVienCuaToi.tsx';
import { DaiMoiDung } from '../huongDan/DaiMoiDung.tsx';
import { MockTestAdmin } from './MockTestAdmin.tsx';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import { HangTab } from '../../ui/HangTab.tsx';
import { CongTacKhung, khungDaNho } from '../../ui/CongTacKhung.tsx';
import { TAB_TONG_QUAN_LABEL, laVaiQuanLy, ngay, tuanLich, type TabTongQuan } from '@shared/domain/index.ts';
import { t } from '@shared/i18n/index.ts';

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
    const giu = new URLSearchParams();
    for (const ten of ['cn', 'ct']) if (params.get(ten)) giu.set(ten, params.get(ten)!);
    navigate(`${k === 'phan-tich' ? '/phan-tich' : '/'}${giu.size ? `?${giu}` : ''}`);
  };
  /* CHI NHÁNH ĐANG CHỌN NẰM TRÊN ĐỊA CHỈ TRANG (`cn`) — một nguồn cho cả trang, gửi đường dẫn vẫn ra đúng chi nhánh. */
  const macDinh = useChiNhanhMacDinh();
  const soChiNhanh = useApi<unknown[]>('/ref/branches').data?.length ?? 0;
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

  /* PR-OV2a (mockup overhaul-3 §3): TVV — tab đầu là "Học viên của tôi", không có việc của Quản lý; Phân tích như vai có quyền xem. */
  if (session?.nav?.hvCuaToi) {
    return (
      <div className="page space-y-4">
        {canSeeBoard ? (
          <div className="flex flex-wrap items-end justify-between gap-x-3 gap-y-2">
            <h1 className="sr-only">{t('Học viên của tôi')}</h1>
            <HangTab ariaLabel={t('Tổng quan')} value={tabProp} onChange={goTab}
              tabs={(['tong-quan', 'phan-tich'] as const).map((k) => ({ key: k, label: k === 'tong-quan' ? t('Học viên của tôi') : TAB_TONG_QUAN_LABEL[k] }))} />
            {tab === 'board' && <BranchFilter branchId={branchId} onBranch={setBranchId} />}
          </div>
        ) : <h1 className="m-0 text-lg font-semibold text-slate-100">{t('Học viên của tôi')}</h1>}
        {tab === 'work' && <DaiMoiDung />}
        {tab === 'board' ? <PhanTich /> : <HocVienCuaToi />}
      </div>
    );
  }

  /* OV-15d: GIÁO VIÊN vào thẳng Công việc (hàng đợi) — Tổng quan GV trùng danh sách việc nên bỏ; Lớp tôi dạy + Yêu cầu của tôi ở cuối Công việc. */
  if (!canSeeBoard) return <Navigate to={session?.nav?.work ? '/cong-viec' : '/hoc-vien'} replace />;

  /*
   * OV-10c (mockup vai 13/10 mục 4–6): tab đầu theo việc của vai — Admin "Mock Test" (4 ô + GV chấm quá hạn + Lịch sắp tới, không khối Case / PA);
   * CX "Số liệu" (ô đếm học viên mọi chi nhánh + Số liệu, không "Việc hôm nay"). QL / Quản trị giữ nguyên.
   */
  const ql = laVaiQuanLy(session?.roles);
  const vai: 'ql' | 'admin' | 'cx' = ql ? 'ql' : session?.nav?.workChamDiem ? 'admin' : session?.roles?.includes('cx') ? 'cx' : 'ql';
  const nhanTabDau = vai === 'admin' ? 'Mock Test' : vai === 'cx' ? t('Số liệu') : TAB_TONG_QUAN_LABEL['tong-quan'];

  return (
    <div className="page space-y-4">
      <h1 className="sr-only">{t('Tổng quan')}</h1>{/* OV-11f (P2-5): mọi vai có h1 */}
      <div className="flex flex-wrap items-end justify-between gap-x-3 gap-y-2">
        <HangTab ariaLabel={t('Tổng quan')} value={tabProp} onChange={goTab}
          tabs={(['tong-quan', 'phan-tich'] as const).map((k) => ({ key: k, label: k === 'tong-quan' ? nhanTabDau : TAB_TONG_QUAN_LABEL[k] }))} />
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
          {duLieuDen && <span className="text-xs text-slate-500">{duLieuDen}</span>}
          <BranchFilter branchId={branchId} onBranch={setBranchId} />
        </div>
      </div>
      {tab === 'board' && <PhanTich />}
      {tab === 'work' && vai === 'admin' && (
        <>
          <MockTestAdmin branchId={branchId} />
          <LichSapToi branchId={branchId} ct={null} />
        </>
      )}
      {tab === 'work' && vai === 'ql' && (
        /* OV-15d — TỔNG QUAN QL A (mockup 3, C23): dải tóm tắt nhỏ dẫn tới việc · Cần bạn quyết · Lớp cần chú ý · Tuần này. Thống kê chi tiết ở Phân tích. */
        <>
          <DaiMoiDung />
          <div className="flex flex-wrap items-center gap-3">
            <CongTacKhung trang="tong-quan" value={khung} onChange={(k) => setKhung(k === 'thuong' ? 'thuong' : 'ft')} />
            <span className="flex-1" />
            {/* Báo cáo = tab đầu của Phân tích (kế hoạch OV-15 mục 7) — mở thẳng. */}
            <Link to={`/phan-tich?goc=bao-cao${branchId ? `&cn=${branchId}` : ''}`} className="btn btn-sm min-h-[44px] no-underline sm:min-h-[32px]">{t('Báo cáo ›')}</Link>
          </div>
          {/* Hai khối việc của QL đọc `/tong-quan/quan-ly` (quyền xem việc người khác) — như Cần xử lý cũ, chỉ khi có Công việc. */}
          {session?.nav?.work && <DaiTomTat branchId={branchId} ct={khung} />}
          {session?.nav?.work && <KhoiCanQuyet branchId={branchId} />}
          <BranchPulse branchId={branchId} ct={khung} chuY />
          <section aria-labelledby="tuan-nay" className="space-y-3">
            <h2 id="tuan-nay" className="m-0 text-base font-semibold text-slate-100">{t('Tuần này')}</h2>
            <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-3">
              <LichSapToi branchId={branchId} ct={khung} />
              {/* Trễ chấm theo GV — số bài bấm ra đúng bài của GV đó (QL nhập tại chỗ); GV đã nhận thông báo tự động, không có Nhắc. */}
              {/* Bảng GV cần MỘT chi nhánh (máy chủ báo "Chọn một chi nhánh." khi nhiều) — Quản trị chưa chọn chi nhánh thì ẩn. */}
              {session?.nav?.phanTichGv && (branchId !== null || soChiNhanh === 1) && (
                <div className="card p-0">
                  <h3 className="m-0 border-b px-4 py-2.5 text-sm font-semibold text-slate-200" style={{ borderColor: 'var(--line)' }}>{t('Trễ chấm')}</h3>
                  <BangGiaoVienChiNhanh branchId={branchId} ct={khung} />
                  <p className="m-0 border-t px-4 py-2 text-xs text-slate-500" style={{ borderColor: 'var(--line)' }}>{t('GV đã nhận thông báo tự động.')}</p>
                </div>
              )}
            </div>
          </section>
        </>
      )}
      {tab === 'work' && vai === 'cx' && (
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
