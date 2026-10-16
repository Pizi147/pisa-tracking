import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useApi } from '../../lib/useApi.ts';
import { Card, Empty, ErrorState, Skeleton } from '../../ui/ui.tsx';

/** Trả lời của `GET /tong-quan/hoc-vien` (server/src/worklist/hvCuaToi.ts). */
type Chip = 'can-chu-y' | 'tam-dung' | 'sap-thi' | 'thieu_tt' | 'cho-buoc-tiep';
type SoHocVien = { phamVi: 'cua-toi' | 'chi-nhanh' | 'tat-ca'; tong: number; dem: Record<Chip, number> };

/** Ô đếm bấm được của Tổng quan theo vai (OV-10c): cả ô là link mở đúng danh sách đã lọc sẵn. Số 0 vẫn bấm được (danh sách trống nói rõ). */
export function ODem({ to, so, nhan, phu }: { to: string; so: number; nhan: string; phu?: ReactNode }) {
  return (
    <Link to={to} className="card block h-full p-4 no-underline hover:brightness-125 focus-visible:outline focus-visible:outline-2"
      aria-label={`${so} — ${nhan}. Mở danh sách`}>
      <span className={`block text-2xl font-semibold tabular-nums ${so ? 'text-slate-100' : 'text-slate-500'}`}>{so}</span>
      <span className="mt-1 block text-sm font-medium text-slate-200">{nhan}</span>
      {phu && <span className="mt-0.5 block text-xs text-slate-500">{phu}</span>}
    </Link>
  );
}

/**
 * Ô ĐẾM HỌC VIÊN — Tổng quan TVV (tab "Học viên của tôi") và CX (tab "Số liệu"), OV-10c. Mỗi ô mở Học viên & Lớp với đúng chip (`view=`),
 * số cùng hàm với chip (`chipHocVien`). Chỉ đếm, không bảng thứ hai — danh sách chi tiết ở Học viên & Lớp.
 */
export function HocVienCuaToi({ branchId = null }: { branchId?: number | null }) {
  const { data, loading, error, reload } = useApi<SoHocVien>(branchId ? `/tong-quan/hoc-vien?branchId=${branchId}` : '/tong-quan/hoc-vien', [branchId]);
  if (error) return <ErrorState message={error.message} hint={error.hint} onRetry={reload} />;
  if (loading || !data) return <Skeleton rows={3} />;
  if (!data.tong && data.phamVi === 'cua-toi') {
    return (
      <Card>
        <Empty title="Chưa có học viên nào của bạn" hint="Học viên có TVV là bạn sẽ hiện ở đây."
          action={<Link to="/hoc-vien" className="btn btn-sm no-underline">Xem cả chi nhánh</Link>} />
      </Card>
    );
  }
  const den = (chip: Chip) => `/hoc-vien?phamVi=${data.phamVi}${data.phamVi === 'chi-nhanh' && branchId ? `&cn=${branchId}` : ''}&view=${chip}`;
  const d = data.dem;
  return (
    <div className="grid gap-3 grid-cols-2 lg:grid-cols-4" data-hd="tq-hv-so" aria-label={data.phamVi === 'cua-toi' ? 'Số liệu học viên của tôi' : 'Số liệu học viên'}>
      <ODem to={den('can-chu-y')} so={d['can-chu-y']} nhan="Cần chú ý" phu="SOS · Case mới · Ý thức" />
      <ODem to={den('tam-dung')} so={d['tam-dung']} nhan="Tạm dừng" phu="đang Tạm dừng học" />
      <ODem to={den('sap-thi')} so={d['sap-thi']} nhan="Sắp thi" phu="thi IELTS trong 6 tuần tới" />
      <ODem to={den('thieu_tt')} so={d.thieu_tt} nhan="Thiếu thông tin" phu="hồ sơ chưa đủ để theo dõi" />
      {d['cho-buoc-tiep'] > 0 && <ODem to={den('cho-buoc-tiep')} so={d['cho-buoc-tiep']} nhan="Chờ chọn bước tiếp" phu="đã có kết quả thi thật" />}
    </div>
  );
}
