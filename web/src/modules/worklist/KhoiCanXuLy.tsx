import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApi } from '../../lib/useApi.ts';
import { Card, Skeleton, ErrorState } from '../../ui/ui.tsx';
import { SoLieuO } from '../../ui/SoLieuO.tsx';
import { DanhSachSoLieu } from '../../ui/SoLieu.tsx';
import { thamSoCt, type ChuongTrinh, type DemYeuCau, type DiemChuY, type DongCanXuLyGoc } from '@shared/domain/index.ts';

/**
 * CẦN XỬ LÝ cạnh ĐIỂM ĐÁNG CHÚ Ý (§3.2, mockup 02 phương án A). Một lần gọi `/tong-quan/quan-ly`. Mỗi dòng Cần xử lý là
 * MỘT chỉ số của sổ: bấm số hay bấm nút đều mở đúng tập đó. Điểm đáng chú ý: tối đa ba nhận định có số, link mở đúng tập.
 */
type Data = { canXuLy: (DongCanXuLyGoc & { phu: string })[]; diemDangChuY: DiemChuY[]; choDuyet?: DemYeuCau };
const CHAM: Record<'do' | 'vang' | 'xanh', string> = { do: 'bg-rose-300', vang: 'bg-amber-300', xanh: 'bg-sky-300' };

export function KhoiCanXuLy({ branchId, ct }: { branchId: number | null; ct: ChuongTrinh }) {
  const q = `${branchId ? `branchId=${branchId}` : ''}${thamSoCt(ct)}`.replace(/^&/, '');
  const url = q ? `/tong-quan/quan-ly?${q}` : '/tong-quan/quan-ly';
  const { data, loading, error, reload } = useApi<Data>(url, [branchId, ct]);
  const navigate = useNavigate();
  const [mo, setMo] = useState<{ id: string; n: number; extra?: Record<string, string> } | null>(null);
  const phamVi = { branchId, chuongTrinh: ct };
  if (error) return <ErrorState message={error.message} hint={error.hint} onRetry={reload} />;
  return (
    <div className="grid gap-3 lg:grid-cols-[1.25fr_1fr] items-start">
      <Card title={<span>Cần xử lý {data && <span className="text-slate-500 font-normal">· {data.canXuLy.length} việc, việc gấp nhất lên đầu</span>}</span>} bodyClass="p-0">
        {data?.choDuyet && <DaiChoDuyet d={data.choDuyet} />}
        {loading || !data ? <div className="p-4"><Skeleton rows={4} /></div> : !data.canXuLy.length ? (
          <p className="m-0 px-4 py-3 text-sm text-slate-400">Không có việc nào đang tồn trong phạm vi.</p>
        ) : (
          <ul className="list-none m-0 p-0 divide-y" style={{ borderColor: 'var(--line)' }}>
            {data.canXuLy.map((x) => (
              <li key={x.metricId} className="grid grid-cols-[10px_minmax(0,1fr)_auto] gap-3 items-center px-4 py-2.5">
                <span className={`w-2 h-2 rounded-full ${CHAM[x.mau]}`} aria-hidden />
                <span className="min-w-0">
                  <span className="block text-sm text-slate-100">
                    <SoLieuO id={x.metricId} giaTri={x.n} phamVi={phamVi} className="font-semibold" /> {x.nhan}
                  </span>
                  {x.phu && <span className="block text-[11px] text-slate-500 truncate">{x.phu}</span>}
                </span>
                <button type="button" className={`btn btn-sm ${x.nut === 'Xem' ? '' : 'btn-primary'}`}
                  onClick={() => (x.denLoc
                    /* PR-UX4: hai dòng "bỏ quên" → Danh sách Case có bộ lọc sẵn (số vẫn mở ngăn HV qua SoLieuO). */
                    ? navigate(`/phan-tich?goc=danh-sach&hang-doi=${x.denLoc}${branchId ? `&cn=${branchId}` : ''}${thamSoCt(ct)}`)
                    : setMo({ id: x.metricId, n: x.n }))}>{x.nut}</button>
              </li>
            ))}
          </ul>
        )}
        <div className="px-4 py-2.5 border-t text-xs" style={{ borderColor: 'var(--line)' }}>
          <Link to="/cong-viec" className="link">Tất cả việc →</Link>
        </div>
      </Card>

      <Card title={<span>Điểm đáng chú ý <span className="text-slate-500 font-normal">· tối đa 3</span></span>} bodyClass="p-0">
        {loading || !data ? <div className="p-4"><Skeleton rows={3} /></div> : !data.diemDangChuY.length ? (
          <p className="m-0 px-4 py-3 text-sm text-slate-400">Chưa có điểm nào đủ dữ liệu để nêu.</p>
        ) : (
          <ul className="list-none m-0 p-0 divide-y" style={{ borderColor: 'var(--line)' }}>
            {data.diemDangChuY.map((x) => (
              <li key={x.loai} className="px-4 py-2.5">
                <span className="block text-sm text-slate-100">{x.cau}</span>
                <button type="button" className="link text-[11px] appearance-none bg-transparent border-0 p-0 cursor-pointer"
                  onClick={() => setMo({ id: x.metricId, n: x.soDanhSach, extra: x.extra })}>{x.lienKet}</button>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {mo && <DanhSachSoLieu id={mo.id} giaTri={mo.n} phamVi={phamVi} extra={mo.extra} open onClose={() => setMo(null)} />}
    </div>
  );
}

/**
 * DẢI CHỜ DUYỆT (PR-DUYET, K1-01, M8) — đầu khối Cần xử lý: số là tầng 1, một nút mở hộp. Ẩn khi cả ba bằng 0.
 * Đề xuất PA / Case quá hạn xác định nguyên nhân không còn là dòng Cần xử lý riêng — chúng là thẻ trong hộp.
 */
function DaiChoDuyet({ d }: { d: DemYeuCau }) {
  if (!d.cho && !d.quaHan && !d.baoLen) return null;
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 border-b px-4 py-2.5" style={{ borderColor: 'var(--line)' }}>
      <span className="text-sm tabular-nums text-slate-300">
        Chờ duyệt <b className="text-base font-bold text-slate-100">{d.cho}</b>
        {d.quaHan > 0 && <> · <b className="text-base font-bold text-late">{d.quaHan}</b> quá hạn</>}
        {d.baoLen > 0 && <> · Báo lên <b className="text-base font-bold text-slate-100">{d.baoLen}</b></>}
      </span>
      <Link to="/cong-viec/cho-duyet" className="btn btn-sm ml-auto min-h-[44px] no-underline sm:min-h-0">Mở hộp duyệt</Link>
    </div>
  );
}
