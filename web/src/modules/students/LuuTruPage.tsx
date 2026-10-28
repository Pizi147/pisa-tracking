import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useApi } from '../../lib/useApi.ts';
import { api, invalidate } from '../../lib/api.ts';
import { useToast } from '../../ui/Toast.tsx';
import { Card, Empty, ErrorState, Skeleton } from '../../ui/ui.tsx';
import { Nhan } from '../../ui/Nhan.tsx';
import { HangTab } from '../../ui/HangTab.tsx';
import { BranchFilter, useChiNhanhMacDinh } from '../../ui/Filters.tsx';
import { MoLaiLopPanel } from '../classes/XoaKetThucLopPanel.tsx';
import { OChon, ThanhChonNhieu, useChonNhieu } from './chonNhieuHocVien.tsx';
import { useQuayLaiHoc } from './QuayLaiHoc.tsx';
import { duongHoSoHocVien, ngay } from '@shared/domain/index.ts';
import { t } from '@shared/i18n/index.ts';

type LopLuuTru = {
  id: number; code: string; ma: string | null; tenChuongTrinh: string | null;
  chiNhanh: string; gvcn: string | null; soHvTungHoc: number; finishedAt: string | null;
  /** PR-LUI-b: nút "Mở lại" (Quản lý của lớp / Quản trị). */
  coTheMoLai: boolean;
};
type HocVienLuuTru = {
  id: number; studentCode: string; fullName: string; lopCuoi: string | null; chiNhanh: string | null;
  archivedAt: string; cycleIdCuoi: number | null;
  /** P7 (k5): em Tạm dừng (giữ chỗ lớp) hay Kết thúc học — cả hai ở Lưu trữ; một nút Quay lại học. */
  trangThai: 'tam-dung' | 'ket-thuc'; loTrinh: string | null; coTheQuayLai: boolean;
};
type DuLieuLuuTru = { lop: LopLuuTru[]; hocVien: HocVienLuuTru[]; phamVi: { chiNhanh: number | null } };

type TabLuuTru = 'lop' | 'hv';

/**
 * KHU LƯU TRỮ (PR-LT, Q16/Q22, chủ sản phẩm 23/09) — lớp đã kết thúc · học viên đã lưu trữ,
 * ẩn khỏi Học viên & Lớp mặc định nhưng vẫn tra cứu được ở đây. P7 (N11, mockup V6 `trang-thai-hv.html` k5): em Tạm dừng cũng ở đây (nhãn
 * "Tạm dừng · Có thể quay lại"), MỘT nút Quay lại học cho cả hai loại (thay Bỏ lưu trữ + Học lại); chọn nhiều → "Quay lại học · n em".
 */
export default function LuuTruPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const tab: TabLuuTru = params.get('tab') === 'hv' ? 'hv' : 'lop';
  const cnUrl = params.get('cn') ?? params.get('branchId');
  const macDinh = useChiNhanhMacDinh();
  const branchId = cnUrl ? Number(cnUrl) : macDinh;
  const q = params.get('q') ?? '';
  const [draftQ, setDraftQ] = useState(q);
  const loc = q.trim();
  const [moLai, setMoLai] = useState<LopLuuTru | null>(null);
  /* PR-LUI-b → P7: "Chọn nhiều học viên" — thanh dính đáy "Quay lại học · n em"; từng em đi đúng hướng máy chủ chọn (`useQuayLaiHoc`). */
  const chon = useChonNhieu();

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

  const quayLai = useQuayLaiHoc(reload);
  /* Chọn nhiều: em quay lại được một bấm (lớp cũ còn chạy) làm ngay; em cần chọn lớp / lộ trình báo "làm từng em" — không đoán thay người dùng. */
  const quayLaiNhieu = async (ids: number[]) => {
    const xong: number[] = []; const tungEm: string[] = [];
    for (const id of ids) {
      const ten = data?.hocVien.find((x) => x.id === id)?.fullName ?? `#${id}`;
      try {
        const tt = await api.get<{ huong: string }>(`/students/${id}/quay-lai`);
        if (tt.huong !== 'lop-cu') { tungEm.push(ten); continue; }
        await api.post(`/students/${id}/quay-lai`, {}); xong.push(id);
      } catch (e: any) { tungEm.push(`${ten} (${e.message})`); }
    }
    for (const k of ['/students', '/hoc-vien-lop', '/classes', '/my-work']) invalidate(k);
    chon.bo(); reload();
    if (xong.length) {
      toast.hoanTac(t('Đã cho {n} em quay lại học', { n: xong.length }), async () => {
        for (const id of xong) { try { await api.post(`/students/${id}/hoan-tac-quay-lai`, {}); } catch (e: any) { toast.push('error', e.message); } }
        for (const k of ['/students', '/hoc-vien-lop', '/classes']) invalidate(k);
        reload(); toast.push('ok', t('Đã hoàn tác'));
      }, { key: `quay-lai-nhieu:${xong.join(',')}` });
    }
    if (tungEm.length) toast.push('error', t('Làm từng em (cần chọn lớp / lộ trình): {ds}', { ds: tungEm.join(', ') }));
  };

  return (
    <div className="page space-y-3">
      <div>
        <button className="btn btn-sm btn-ghost" onClick={() => navigate('/hoc-vien')}>‹ {t('Học viên & Lớp')}</button>
      </div>
      <h1 className="text-xl font-bold text-slate-100 m-0">{t('Lưu trữ')}</h1>

      <div className="flex flex-wrap items-center gap-2">
        <input className="field w-full sm:w-72" aria-label={t('Tìm')} placeholder={t('Tìm tên, mã học viên hoặc mã lớp…')}
          value={draftQ} onChange={(e) => setDraftQ(e.target.value)} />
        <BranchFilter branchId={branchId} onBranch={(id) => setParam({ cn: id ? String(id) : null, branchId: null })} />
      </div>

      <HangTab ariaLabel={t('Lưu trữ')} value={tab} onChange={(k) => setParam({ tab: k === 'lop' ? null : k })}
        tabs={[
          { key: 'lop', label: t('Lớp đã kết thúc'), so: data?.lop.length },
          { key: 'hv', label: t('Học viên đã lưu trữ'), so: data?.hocVien.length },
        ]} />

      {error && <ErrorState message={error.message} hint={error.hint} onRetry={reload} />}
      {loading && !data && <Skeleton rows={6} />}
      {data && tab === 'lop' && (
        data.lop.length === 0
          ? <Card><Empty title={loc ? t('Không có lớp khớp "{loc}"', { loc }) : t('Chưa có lớp nào kết thúc')} /></Card>
          : <div className="space-y-1.5">
              {data.lop.map((l) => (
                <div key={l.id} className="card flex flex-wrap items-center gap-x-2 gap-y-1 p-3">
                  <Link to={`/hoc-vien/lop/${l.id}`} className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2 gap-y-1 no-underline">
                    <span className="font-semibold text-slate-200">{l.code}</span>
                    <span className="text-xs text-slate-500">
                      {l.tenChuongTrinh ?? l.ma ?? '—'} · {l.chiNhanh}
                      {l.gvcn && <> · {t('GVCN')} {l.gvcn}</>} · {t('{n} HV từng học', { n: l.soHvTungHoc })}
                    </span>
                    <span className="flex-1" />
                    <span className="text-xs text-slate-500 whitespace-nowrap">
                      {t('Đã kết thúc {ngay}', { ngay: l.finishedAt ? ngay(l.finishedAt) : '—' })}
                    </span>
                  </Link>
                  <Link to={`/hoc-vien/lop/${l.id}?tab=tong-ket`} className="btn btn-sm min-h-[44px] no-underline sm:min-h-0">{t('Tổng kết')}</Link>
                  {l.coTheMoLai && <button type="button" className="btn btn-sm min-h-[44px] sm:min-h-0" onClick={() => setMoLai(l)}>{t('Mở lại')}</button>}
                </div>
              ))}
            </div>
      )}
      {data && tab === 'hv' && (
        data.hocVien.length === 0
          ? <Card><Empty title={loc ? t('Không có học viên khớp "{loc}"', { loc }) : t('Chưa có học viên nào được lưu trữ')} /></Card>
          : <div className="space-y-1.5">
              {data.hocVien.some((s) => s.coTheQuayLai) && (
                <div className="flex justify-end">
                  <button type="button" aria-pressed={chon.bat} onClick={chon.batTat}
                    className={`btn btn-sm min-h-[44px] sm:min-h-0 ${chon.bat ? 'bg-[color:var(--accent-soft)] text-[color:var(--accent)]' : 'btn-ghost'}`}>{t('Chọn nhiều học viên')}</button>
                </div>
              )}
              {data.hocVien.map((s) => {
                const dung = s.trangThai === 'tam-dung';
                return (
                  <div key={s.id} className={`card flex flex-wrap items-center gap-x-2.5 gap-y-1.5 p-3 ${chon.chon.has(s.id) ? 'bg-[color:var(--accent-soft)]' : ''}`}>
                    {chon.bat && s.coTheQuayLai && <OChon chon={chon} id={s.id} ten={s.fullName} />}
                    <Link to={`/hoc-vien/${s.id}`} className="ten-ho-so khong-mui">{s.fullName}</Link>
                    <Nhan tone={dung ? 'doing' : 'soon'}>{dung ? t('Tạm dừng · Có thể quay lại') : t('Kết thúc học')}</Nhan>
                    <span className="min-w-0 flex-1 text-xs text-slate-500">
                      {[s.lopCuoi ?? t('chưa từng học lớp nào'), s.loTrinh ? `FT ${s.loTrinh}` : null, dung ? t('từ {ngay}', { ngay: ngay(s.archivedAt) }) : ngay(s.archivedAt), s.chiNhanh].filter(Boolean).join(' · ')}
                    </span>
                    {!chon.bat && s.cycleIdCuoi != null && (
                      <Link to={duongHoSoHocVien(s.id, { tab: 'hanh-trinh', tongKet: s.cycleIdCuoi })} className="btn btn-sm min-h-[44px] no-underline sm:min-h-0">{t('Tổng kết')}</Link>
                    )}
                    {!chon.bat && s.coTheQuayLai && (
                      <button type="button" className={dung ? 'btn btn-sm btn-primary min-h-[44px] sm:min-h-0' : 'btn btn-sm min-h-[44px] sm:min-h-0'} disabled={quayLai.dangMo === s.id}
                        onClick={() => void quayLai.mo({ id: s.id, ten: s.fullName, lop: s.lopCuoi })}>{t('Quay lại học')}</button>
                    )}
                  </div>
                );
              })}
            </div>
      )}
      {data && tab === 'hv' && (
        <ThanhChonNhieu chon={chon} viec={[{ key: 'quay-lai', nhan: t('Quay lại học') }]} onViec={() => void quayLaiNhieu([...chon.chon])} />
      )}
      {quayLai.panels}
      {moLai && (
        <MoLaiLopPanel classId={moLai.id} classCode={moLai.code} chiNhanh={moLai.chiNhanh} ketThuc={moLai.finishedAt ? ngay(moLai.finishedAt) : null}
          onClose={() => setMoLai(null)} onDone={reload} />
      )}
    </div>
  );
}
