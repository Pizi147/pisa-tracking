import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useApi } from '../../lib/useApi.ts';
import { api, invalidate } from '../../lib/api.ts';
import { useToast } from '../../ui/Toast.tsx';
import { Card, Empty, ErrorState, Skeleton } from '../../ui/ui.tsx';
import { HangTab } from '../../ui/HangTab.tsx';
import { nhoChiNhanh, useChiNhanhMacDinh, type Branch } from '../../ui/Filters.tsx';
import { useSession } from '../../lib/session.tsx';
import { MoLaiLopPanel } from '../classes/XoaKetThucLopPanel.tsx';
import { OChon, ThanhChonNhieu, useChonNhieu } from './chonNhieuHocVien.tsx';
import { XemTruocHangLoatPanel } from './XemTruocHangLoatPanel.tsx';
import { StudentManagePanel } from './StudentManagePanel.tsx';
import { ngay, type ViecHangLoat } from '@shared/domain/index.ts';

type LopLuuTru = {
  id: number; code: string; ma: string | null; tenChuongTrinh: string | null;
  chiNhanh: string; gvcn: string | null; soHvTungHoc: number; finishedAt: string | null;
  /** PR-LUI-b: nút "Mở lại" (Quản lý của lớp / Quản trị). */
  coTheMoLai: boolean;
};
type HocVienLuuTru = {
  id: number; studentCode: string; fullName: string; lopCuoi: string | null; chiNhanh: string | null;
  archivedAt: string; coTheBoLuuTru: boolean; coTheHocLai: boolean;
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
  const uid = useSession().session?.user?.id;
  const tab: TabLuuTru = params.get('tab') === 'hv' ? 'hv' : 'lop';
  const cnUrl = params.get('cn') ?? params.get('branchId');
  const macDinh = useChiNhanhMacDinh();
  const branchId = cnUrl ? Number(cnUrl) : macDinh;
  const q = params.get('q') ?? '';
  const [draftQ, setDraftQ] = useState(q);
  const [moLai, setMoLai] = useState<LopLuuTru | null>(null);
  /* PR-LUI-b: "Chọn nhiều học viên" (cùng mẫu hồ sơ lớp) — thanh dính đáy Bỏ lưu trữ · Học lại; Học lại từng em mở panel Học lại có chọn đích. */
  const chon = useChonNhieu();
  const [lam, setLam] = useState<{ viec: ViecHangLoat; ids: number[] } | null>(null);
  const [hocLai, setHocLai] = useState<HocVienLuuTru | null>(null);

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
            onChange={(e) => { nhoChiNhanh(uid, e.target.value ? Number(e.target.value) : null); setParam({ cn: e.target.value || null, branchId: null }); }}>
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
                <div key={l.id} className="card flex flex-wrap items-center gap-x-2 gap-y-1 p-3">
                  <Link to={`/hoc-vien/lop/${l.id}`} className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2 gap-y-1 no-underline">
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
                  {l.coTheMoLai && <button type="button" className="btn btn-sm min-h-[44px] sm:min-h-0" onClick={() => setMoLai(l)}>Mở lại</button>}
                </div>
              ))}
            </div>
      )}
      {data && tab === 'hv' && (
        data.hocVien.length === 0
          ? <Card><Empty title="Chưa có học viên nào được lưu trữ" /></Card>
          : <div className="space-y-1.5">
              {data.hocVien.some((s) => s.coTheBoLuuTru) && (
                <div className="flex justify-end">
                  <button type="button" aria-pressed={chon.bat} onClick={chon.batTat}
                    className={`btn btn-sm min-h-[44px] sm:min-h-0 ${chon.bat ? 'bg-[color:var(--accent-soft)] text-[color:var(--accent)]' : 'btn-ghost'}`}>Chọn nhiều học viên</button>
                </div>
              )}
              {data.hocVien.map((s) => (
                <div key={s.id} className={`card flex flex-wrap items-center gap-x-2 gap-y-1 p-3 ${chon.chon.has(s.id) ? 'bg-[color:var(--accent-soft)]' : ''}`}>
                  {chon.bat && s.coTheBoLuuTru && <OChon chon={chon} id={s.id} ten={s.fullName} />}
                  <Link to={`/hoc-vien/${s.id}`} className="link font-semibold">{s.fullName}</Link>
                  <span className="text-[11px] tabular-nums text-slate-500">{s.studentCode}</span>
                  <span className="text-xs text-slate-500">
                    {s.lopCuoi ? <>lớp cuối {s.lopCuoi}</> : 'chưa từng học lớp nào'}{s.chiNhanh && <> · {s.chiNhanh}</>}
                  </span>
                  <span className="flex-1" />
                  <span className="text-[11px] text-slate-500 whitespace-nowrap">Lưu trữ {ngay(s.archivedAt)}</span>
                  {!chon.bat && s.coTheHocLai && (
                    <button type="button" className="btn btn-sm min-h-[44px] sm:min-h-0" onClick={() => setHocLai(s)}>Học lại</button>
                  )}
                  {!chon.bat && s.coTheBoLuuTru && (
                    <button type="button" className="btn btn-sm min-h-[44px] sm:min-h-0" onClick={() => boLuuTru(s.id)}>Bỏ lưu trữ</button>
                  )}
                </div>
              ))}
            </div>
      )}
      {data && tab === 'hv' && (
        <ThanhChonNhieu chon={chon} viec={[{ key: 'bo-luu-tru', nhan: 'Bỏ lưu trữ' }, { key: 'hoc-lai', nhan: 'Học lại' }]}
          onViec={(k) => setLam({ viec: k as ViecHangLoat, ids: [...chon.chon] })} />
      )}
      {lam && <XemTruocHangLoatPanel viec={lam.viec} ids={lam.ids} onClose={() => setLam(null)} onDone={() => { chon.bo(); setLam(null); reload(); }} />}
      {hocLai && (
        <StudentManagePanel viec="hoc-lai" onClose={() => setHocLai(null)} student={{ id: hocLai.id, name: hocLai.fullName, classId: null }}
          lop={hocLai.lopCuoi} cycle={null} attempts={[]} onDone={reload} />
      )}
      {moLai && (
        <MoLaiLopPanel classId={moLai.id} classCode={moLai.code} chiNhanh={moLai.chiNhanh} ketThuc={moLai.finishedAt ? ngay(moLai.finishedAt) : null}
          onClose={() => setMoLai(null)} onDone={reload} />
      )}
    </div>
  );
}
