import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useApi } from '../../lib/useApi.ts';
import { Card, Empty, ErrorState, Skeleton } from '../../ui/ui.tsx';
import { Nhan, type ToneNhan } from '../../ui/Nhan.tsx';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import { tuanLich } from '@shared/domain/index.ts';

/** Trả lời của `GET /tong-quan/hv-cua-toi` (server/src/worklist/hvCuaToi.ts). */
type DongChuY = { loai: 'sos' | 'case' | 'y-thuc' | 'thi'; nhan: string; studentId: number; ten: string; chiTiet: string; tuan: string | null };
type HvCuaToi = { tong: number; duoiKyVong: number; caseMo: number; caseMoiTuan: number; sapThi: number; thieuTt: number; canChuY: DongChuY[] };

const TONE: Record<DongChuY['loai'], ToneNhan> = { sos: 'bad', case: 'wait', 'y-thuc': 'soon', thi: 'muted' };

function O({ nhan, so, donVi, phu }: { nhan: string; so: number; donVi: ReactNode; phu: string }) {
  return (
    <div className="card p-4 h-full">
      <div className="text-xs uppercase tracking-wide text-slate-400 font-semibold">{nhan}</div>
      <div className="mt-2 flex items-baseline gap-1.5">
        <span className={`text-2xl font-semibold tabular-nums ${so ? 'text-slate-100' : 'text-slate-500'}`}>{so}</span>
        <span className="text-xs text-slate-400">{donVi}</span>
      </div>
      <div className="text-xs text-slate-500 mt-1">{phu}</div>
    </div>
  );
}

/**
 * TỔNG QUAN TVV (PR-OV2a, mockup overhaul-3 §3): 4 số + "Cần chú ý" về học viên mình phụ trách tư vấn — chỉ đọc, bấm tên ra hồ sơ.
 * Chưa được gán em nào (trước OV-2b chưa có ô chọn TVV) → câu hướng dẫn thay cho bảng trống.
 */
export function HocVienCuaToi() {
  const { data, loading, error, reload } = useApi<HvCuaToi>('/tong-quan/hv-cua-toi');
  const { homNay } = useNgayNghiepVu();
  if (error) return <ErrorState message={error.message} hint={error.hint} onRetry={reload} />;
  if (loading || !data) return <Skeleton rows={6} />;
  if (!data.tong) {
    return (
      <Card>
        <Empty title="Chưa có học viên nào của bạn" hint="Học viên có TVV là bạn sẽ hiện ở đây."
          action={<Link to="/hoc-vien" className="btn btn-sm no-underline">Xem cả chi nhánh</Link>} />
      </Card>
    );
  }
  return (
    <div className="space-y-3">
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4" aria-label="Số liệu học viên của tôi">
        <O nhan="Dưới kỳ vọng" so={data.duoiKyVong} donVi={`/ ${data.tong} em`} phu="MT gần nhất" />
        <O nhan="Có Case đang mở" so={data.caseMo} donVi="em" phu={data.caseMoiTuan ? `${data.caseMoiTuan} Case mới tuần này` : 'Không có Case mới tuần này'} />
        <O nhan="Sắp thi IELTS" so={data.sapThi} donVi="em" phu="trong 6 tuần tới" />
        <O nhan="Thiếu thông tin" so={data.thieuTt} donVi="em" phu="ngày sinh" />
      </div>
      <section className="card" aria-labelledby="can-chu-y">
        <div className="flex flex-wrap items-baseline gap-x-2 px-4 pt-3 pb-2">
          <h2 id="can-chu-y" className="m-0 text-[15px] font-semibold text-slate-100">Cần chú ý</h2>
          <span className="text-xs text-slate-500">· học viên của tôi</span>
        </div>
        {data.canChuY.length === 0
          ? <p className="m-0 px-4 pb-4 text-sm text-slate-400">Không có em nào cần chú ý.</p>
          : (
            <ul className="list-none m-0 p-0">
              {data.canChuY.map((d) => (
                <li key={`${d.loai}-${d.studentId}`}
                  className="grid items-center gap-x-3 gap-y-0.5 border-t px-4 py-2.5 text-sm grid-cols-[auto_minmax(0,1fr)_auto] md:grid-cols-[110px_220px_minmax(0,1fr)_auto]"
                  style={{ borderColor: 'var(--line)' }}>
                  <span><Nhan tone={TONE[d.loai]}>{d.nhan}</Nhan></span>
                  <Link to={`/hoc-vien/${d.studentId}`} className="min-w-0 truncate font-medium max-sm:py-2.5 max-sm:-my-2.5">{d.ten}</Link>
                  <span className="min-w-0 text-slate-400 max-md:col-span-3 max-md:row-start-2 max-md:text-xs">{d.chiTiet}</span>
                  <span className="text-xs tabular-nums text-slate-500 max-md:col-start-3 max-md:row-start-1">{d.tuan ? tuanLich(d.tuan, homNay) : ''}</span>
                </li>
              ))}
            </ul>
          )}
      </section>
    </div>
  );
}
