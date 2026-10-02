import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useApi } from '../../lib/useApi.ts';
import { api, invalidate } from '../../lib/api.ts';
import { useToast } from '../../ui/Toast.tsx';
import { Card, Empty, ErrorState, Skeleton } from '../../ui/ui.tsx';
import { HangTab } from '../../ui/HangTab.tsx';
import type { Branch } from '../../ui/Filters.tsx';
import { ngay } from '@shared/domain/index.ts';

type LopLuuTru = {
  id: number; code: string; ma: string | null; tenChuongTrinh: string | null;
  chiNhanh: string; gvcn: string | null; soHvTungHoc: number; finishedAt: string | null;
};
type HocVienLuuTru = {
  id: number; studentCode: string; fullName: string; lopCuoi: string | null; chiNhanh: string | null;
  archivedAt: string; coTheBoLuuTru: boolean;
};
type DuLieuLuuTru = { lop: LopLuuTru[]; hocVien: HocVienLuuTru[]; phamVi: { chiNhanh: number | null } };

type TabLuuTru = 'lop' | 'hv';

/**
 * KHU LƯU TRỮ (PR-LT, Q16/Q22, chủ sản phẩm 23/09) — lớp đã kết thúc · học viên đã lưu trữ,
 * ẩn khỏi Học viên & Lớp mặc định nhưng vẫn tra cứu được ở đây. Chỉ xem: không nút nào ở tab Lớp,
 * chỉ QL bỏ lưu trữ được HV.
 */
export default function LuuTruPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const tab: TabLuuTru = params.get('tab') === 'hv' ? 'hv' : 'lop';
  const cnUrl = params.get('cn') ?? params.get('branchId');
  const branchId = cnUrl ? Number(cnUrl) : null;
  const q = params.get('q') ?? '';
  const [draftQ, setDraftQ] = useState(q);

  const setParam = (patch: Record<string, string | null>) => {
    const next = new URLSearchParams(params);
    for (const [k, v] of Object.entries(patch)) { if (v === null || v === '') next.delete(k); else next.set(k, v); }
    setParams(next, { replace: true });
  };

  useEffect(() => {
    const t = setTimeout(() => { if (draftQ !== q) setParam({ q: draftQ || null }); }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftQ]);

  const qs = (() => {
    const s = new URLSearchParams();
    if (q.trim()) s.set('q', q.trim());
    if (branchId) s.set('branchId', String(branchId));
    return `/hoc-vien-lop/luu-tru?${s.toString()}`;
  })();
  const { data, loading, error, reload } = useApi<DuLieuLuuTru>(qs);
  const branches = useApi<Branch[]>('/ref/branches');

  const boLuuTru = async (id: number) => {
    try {
      await api.post(`/students/${id}/unarchive`, {});
      invalidate('/hoc-vien-lop'); invalidate(`/students/${id}`);
      /* UX-C8 (Q24): Hoàn tác = lưu trữ lại em. ponytail: ngày lưu trữ mới = hôm nay; ngày gốc vẫn ở nhật ký `student.unarchive` (before). */
      toast.hoanTac('Đã bỏ lưu trữ', async () => {
        try {
          await api.post(`/students/${id}/archive`, {});
          invalidate('/hoc-vien-lop'); invalidate(`/students/${id}`);
          toast.push('ok', 'Đã đưa lại vào Lưu trữ');
          reload();
        } catch (e: any) { toast.push('error', e.message); }
      }, { key: `bo-luu-tru:${id}` });
      reload();
    } catch (e: any) { toast.push('error', e.message); }
  };

  return (
    <div className="page space-y-3">
      <div>
        <button className="btn btn-sm btn-ghost" onClick={() => navigate('/hoc-vien')}>‹ Học viên &amp; Lớp</button>
      </div>
      <h1 className="text-lg font-semibold text-slate-100 m-0">Lưu trữ</h1>

      <div className="flex flex-wrap items-center gap-2">
        <input className="field w-full sm:w-72" aria-label="Tìm" placeholder="🔍 Tìm tên, mã học viên hoặc mã lớp…"
          value={draftQ} onChange={(e) => setDraftQ(e.target.value)} />
        {(branches.data?.length ?? 0) > 1 && (
          <select className="field w-auto" aria-label="Chi nhánh" value={branchId ?? ''}
            onChange={(e) => setParam({ cn: e.target.value || null, branchId: null })}>
            <option value="">Mọi chi nhánh</option>
            {(branches.data ?? []).map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        )}
      </div>

      <HangTab ariaLabel="Lưu trữ" value={tab} onChange={(k) => setParam({ tab: k === 'lop' ? null : k })}
        tabs={[
          { key: 'lop', label: 'Lớp đã kết thúc', so: data?.lop.length },
          { key: 'hv', label: 'Học viên đã lưu trữ', so: data?.hocVien.length },
        ]} />

      {error && <ErrorState message={error.message} hint={error.hint} onRetry={reload} />}
      {loading && !data && <Skeleton rows={6} />}
      {data && tab === 'lop' && (
        data.lop.length === 0
          ? <Card><Empty title="Chưa có lớp nào kết thúc" /></Card>
          : <div className="space-y-1.5">
              {data.lop.map((l) => (
                <Link key={l.id} to={`/hoc-vien/lop/${l.id}`}
                  className="card flex flex-wrap items-center gap-x-2 gap-y-1 p-3 no-underline">
                  <span className="font-semibold text-slate-200">{l.code}</span>
                  <span className="text-xs text-slate-500">
                    {l.tenChuongTrinh ?? l.ma ?? '—'} · {l.chiNhanh}
                    {l.gvcn && <> · GVCN {l.gvcn}</>} · {l.soHvTungHoc} HV từng học
                  </span>
                  <span className="flex-1" />
                  <span className="text-[11px] text-slate-500 whitespace-nowrap">
                    Đã kết thúc {l.finishedAt ? ngay(l.finishedAt) : '—'}
                  </span>
                </Link>
              ))}
            </div>
      )}
      {data && tab === 'hv' && (
        data.hocVien.length === 0
          ? <Card><Empty title="Chưa có học viên nào được lưu trữ" /></Card>
          : <div className="space-y-1.5">
              {data.hocVien.map((s) => (
                <div key={s.id} className="card flex flex-wrap items-center gap-x-2 gap-y-1 p-3">
                  <Link to={`/hoc-vien/${s.id}`} className="link font-semibold">{s.fullName}</Link>
                  <span className="text-[11px] tabular-nums text-slate-500">{s.studentCode}</span>
                  <span className="text-xs text-slate-500">
                    {s.lopCuoi ? <>lớp cuối {s.lopCuoi}</> : 'chưa từng học lớp nào'}{s.chiNhanh && <> · {s.chiNhanh}</>}
                  </span>
                  <span className="flex-1" />
                  <span className="text-[11px] text-slate-500 whitespace-nowrap">Lưu trữ {ngay(s.archivedAt)}</span>
                  {s.coTheBoLuuTru && (
                    <button type="button" className="btn btn-sm" onClick={() => boLuuTru(s.id)}>Bỏ lưu trữ</button>
                  )}
                </div>
              ))}
            </div>
      )}
    </div>
  );
}
