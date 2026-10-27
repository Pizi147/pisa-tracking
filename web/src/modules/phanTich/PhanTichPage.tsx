import { useSearchParams } from 'react-router-dom';
import { BranchFilter, useChiNhanhMacDinh } from '../../ui/Filters.tsx';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import { ngay } from '@shared/domain/index.ts';
import { t } from '@shared/i18n/index.ts';
import { PhanTich } from './PhanTich.tsx';

/**
 * TRANG PHÂN TÍCH (OV-15e, plan §7) — mục riêng trên thanh trên (trước là tab của Tổng quan). Đầu trang: "Phân tích" · Dữ liệu đến · ô chi nhánh;
 * dưới là sáu tab + một hàng lọc chung (`PhanTich`). Chi nhánh nằm trên URL (`cn`) như Tổng quan.
 */
export default function PhanTichPage() {
  const [params, setParams] = useSearchParams();
  const { homNay } = useNgayNghiepVu();
  const macDinh = useChiNhanhMacDinh();
  const branchId = params.get('cn') ? Number(params.get('cn')) : macDinh;
  const setBranchId = (id: number | null) => {
    const next = new URLSearchParams(params);
    if (id) next.set('cn', String(id)); else next.delete('cn');
    setParams(next);
  };
  return (
    <div className="page space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 print:hidden">
        <div className="flex flex-wrap items-baseline gap-x-3">
          <h1 className="m-0 text-xl font-bold text-slate-100">{t('Phân tích')}</h1>
          {homNay && <span className="text-xs text-slate-500">{t('Dữ liệu đến {ngay}', { ngay: ngay(homNay) })}</span>}
        </div>
        <BranchFilter branchId={branchId} onBranch={setBranchId} />
      </div>
      <PhanTich />
    </div>
  );
}
