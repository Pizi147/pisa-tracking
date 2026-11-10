import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../../lib/api.ts';
import { useApi } from '../../lib/useApi.ts';
import { Card, ChonDangNut, ErrorState, Skeleton } from '../../ui/ui.tsx';
import { ONgay } from '../../ui/ONgay.tsx';
import { lucNgan } from '../../ui/LichSuThayDoi.tsx';
import { useToast } from '../../ui/Toast.tsx';
import { nhanDoiTuongNhatKy, nhanHanhDongNhatKy } from '@shared/domain/index.ts';
import { dich, t } from '@shared/i18n/index.ts';

type Muc = 'tai-khoan' | 'quyen' | 'mo-sua-lich' | 'chuong-trinh' | 'chi-nhanh' | 'band';
type Dong = { id: number; luc: string; nguoi: string; muc: Muc; viec: string; doiTuong: string | null; truong: { ten: string; cu: string | null; moi: string | null }[] };
type Trang = { dong: Dong[]; tiep: number | null; nguoi: { id: number; ten: string }[]; muc: Muc[] };

/** Giá trị dài (danh sách vai, lịch MT dạng JSON) — cắt gọn trên dòng nhật ký. */
const ngan = (v: string) => (v.length > 80 ? `${v.slice(0, 80)}…` : v);
const TEN_MUC: Record<Muc, string> = {
  'tai-khoan': t('Tài khoản'), quyen: t('Quyền theo vai trò'), 'mo-sua-lich': t('Mở sửa lịch Test'),
  'chuong-trinh': t('Chương trình'), 'chi-nhanh': t('Chi nhánh'), band: t('Bảng quy đổi'),
};

/**
 * NHẬT KÝ CHUNG (QTV2-QUYEN) — mọi lần đổi tài khoản, quyền, cấu hình (`GET /admin/nhat-ky`), lọc Mục · Người · Từ tuần → Đến tuần, 50 dòng một lần
 * + "Xem thêm". Mục trên URL (`?muc=`): link "Nhật ký ›" ở các tab mở đúng mục. Mỗi dòng: lúc · ai · mục · việc · đối tượng; trường đổi "cũ → mới".
 */
export function NhatKyChung() {
  const [params, setParams] = useSearchParams();
  const muc = (params.get('muc') ?? '') as Muc | '';
  const [nguoi, setNguoi] = useState('');
  const [tu, setTu] = useState<string | null>(null);
  const [den, setDen] = useState<string | null>(null);
  const qs = new URLSearchParams({ ...(muc && { muc }), ...(nguoi && { nguoi }), ...(tu && { tu }), ...(den && { den }) }).toString();
  const r = useApi<Trang>(`/admin/nhat-ky${qs ? `?${qs}` : ''}`, [qs]);
  /* Trang thêm gắn với bộ lọc lúc tải (`qs`) — đổi lọc thì bỏ, không lẫn vào kết quả lọc mới trong cùng lượt vẽ. */
  const [them, setThem] = useState<{ qs: string; dong: Dong[] }>({ qs: '', dong: [] });
  const toast = useToast();
  const [tiep, setTiep] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => { setThem({ qs, dong: [] }); setTiep(r.data?.tiep ?? null); }, [r.data]); // eslint-disable-line react-hooks/exhaustive-deps
  const xemThem = async () => {
    if (!tiep || busy) return;
    setBusy(true);
    try {
      const x = await api.get<Trang>(`/admin/nhat-ky?${new URLSearchParams({ ...(qs ? Object.fromEntries(new URLSearchParams(qs)) : {}), tiep: String(tiep) })}`);
      setThem((d) => ({ qs, dong: d.qs === qs ? [...d.dong, ...x.dong] : x.dong })); setTiep(x.tiep);
    } catch (e: any) { toast.push('error', e?.message ?? t('Không tải thêm được')); } finally { setBusy(false); }
  };
  const datMuc = (m: string) => { const n = new URLSearchParams(params); if (m) n.set('muc', m); else n.delete('muc'); setParams(n, { replace: true }); };
  const dong = [...(r.data?.dong ?? []), ...(them.qs === qs ? them.dong : [])];

  return (
    <Card title={t('Nhật ký chung')} bodyClass="p-0">
      <div className="flex flex-wrap items-center gap-2 border-b px-4 py-3" style={{ borderColor: 'var(--line)' }}>
        <ChonDangNut aria-label={t('Mục')} value={muc} onChange={(e) => datMuc(e.target.value)}>
          <option value="">{t('Mục: Tất cả')}</option>
          {(r.data?.muc ?? []).map((m) => <option key={m} value={m}>{TEN_MUC[m]}</option>)}
        </ChonDangNut>
        <ChonDangNut aria-label={t('Người')} value={nguoi} onChange={(e) => setNguoi(e.target.value)}>
          <option value="">{t('Người: Tất cả')}</option>
          {(r.data?.nguoi ?? []).map((n) => <option key={n.id} value={n.id}>{n.ten}</option>)}
        </ChonDangNut>
        <span className="inline-flex items-center gap-1.5 text-[13px] text-slate-400">{t('Từ')}
          <ONgay kieu="tuan" moc="dau" value={tu} onChange={setTu} ariaLabel={t('Từ tuần')} nutTrong /></span>
        <span className="inline-flex items-center gap-1.5 text-[13px] text-slate-400">{t('Đến')}
          <ONgay kieu="tuan" moc="cuoi" value={den} onChange={setDen} ariaLabel={t('Đến tuần')} nutTrong /></span>
        {(muc || nguoi || tu || den) && <button type="button" className="btn btn-sm btn-ghost max-sm:min-h-[44px]" onClick={() => { datMuc(''); setNguoi(''); setTu(null); setDen(null); }}>{t('Xoá lọc')}</button>}
      </div>
      {r.error ? <div className="p-4"><ErrorState message={r.error.message} hint={r.error.hint} status={r.error.status} onRetry={r.reload} /></div>
        : !r.data ? <div className="p-4"><Skeleton rows={6} /></div>
        : dong.length === 0 ? <p className="m-0 px-4 py-4 text-sm text-slate-400">{t('Chưa có thay đổi nào khớp.')}</p>
        : (
          <ul className="m-0 list-none p-0">
            {dong.map((d) => (
              <li key={d.id} className="grid gap-1 border-t px-4 py-2.5 sm:grid-cols-[8.5rem_11rem_10rem_minmax(0,1fr)] sm:gap-3" style={{ borderColor: 'var(--line)' }}>
                <span className="text-[13px] tabular-nums text-slate-400">{lucNgan(d.luc)}</span>
                <span className="text-sm text-slate-300">{d.nguoi}</span>
                <span className="text-sm text-slate-300">{TEN_MUC[d.muc]}</span>
                <span className="min-w-0 text-sm text-slate-100">
                  {dich(nhanHanhDongNhatKy(d.viec))}{d.doiTuong ? <span className="text-slate-400"> · {dich(nhanDoiTuongNhatKy(d.doiTuong))}</span> : null}
                  {d.truong.length > 0 && (
                    <span className="mt-0.5 block break-words text-[13px] text-slate-400">
                      {d.truong.slice(0, 4).map((x, i) => (
                        <span key={i}>{i > 0 && ' · '}{dich(x.ten)}: {x.cu !== null && <s className="text-slate-500">{ngan(x.cu)}</s>}{x.cu !== null && ' → '}{x.moi !== null ? ngan(x.moi) : <i>{t('trống')}</i>}</span>
                      ))}
                      {d.truong.length > 4 && ` · +${d.truong.length - 4}`}
                    </span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        )}
      {tiep && (
        <div className="border-t px-4 py-2.5" style={{ borderColor: 'var(--line)' }}>
          <button type="button" className="btn btn-sm max-sm:min-h-[44px]" disabled={busy} onClick={() => void xemThem()}>{busy ? t('Đang tải…') : t('Xem thêm')}</button>
        </div>
      )}
    </Card>
  );
}

/**
 * CỘT NHẬT KÝ của một tab cấu hình (mẫu chung QTV2, spec mục 5.0): 8 lần đổi gần nhất của mục đó (`/admin/nhat-ky?muc=`, cùng đường Nhật ký chung).
 * Quản trị: "Xem tất cả ›" mở Nhật ký chung lọc sẵn mục (tab Quyền & nhật ký). Quản lý: chỉ xem 8 dòng (tab Quyền & nhật ký là của Quản trị).
 */
export function NhatKyMuc({ muc, quanTri }: { muc: Muc; quanTri: boolean }) {
  const r = useApi<Trang>(`/admin/nhat-ky?muc=${muc}`);
  const dong = (r.data?.dong ?? []).slice(0, 8);
  return (
    <aside className="card min-w-0 self-start" aria-label={t('Nhật ký')}>
      <div className="flex items-center gap-2 border-b px-4 py-3" style={{ borderColor: 'var(--line)' }}>
        <h3 className="m-0 text-[15px] font-bold text-slate-100">{t('Nhật ký')}</h3>
        {quanTri && <Link className="ml-auto text-[13px] font-semibold" to={`/quan-tri?tab=config&muc=${muc}`}>{t('Xem tất cả')} ›</Link>}
      </div>
      {r.error ? <div className="p-3"><ErrorState message={r.error.message} hint={r.error.hint} status={r.error.status} onRetry={r.reload} /></div>
        : !r.data ? <div className="p-3"><Skeleton rows={3} /></div>
        : dong.length === 0 ? <p className="m-0 px-4 py-3 text-sm text-slate-400">{t('Chưa đổi lần nào.')}</p>
        : (
          <ul className="m-0 list-none p-0">
            {dong.map((d) => (
              <li key={d.id} className="grid gap-0.5 border-t px-4 py-2.5 first:border-t-0" style={{ borderColor: 'var(--line)' }}>
                <span className="text-xs font-semibold text-slate-400">{dich(nhanHanhDongNhatKy(d.viec))}{d.doiTuong ? ` · ${dich(nhanDoiTuongNhatKy(d.doiTuong))}` : ''}</span>
                {d.truong.slice(0, 2).map((x, i) => (
                  <span key={i} className="break-words text-sm text-slate-100">{dich(x.ten)}: {x.cu !== null && <s className="text-slate-500">{ngan(x.cu)}</s>}{x.cu !== null && ' → '}{x.moi !== null ? ngan(x.moi) : <i>{t('trống')}</i>}</span>
                ))}
                <span className="text-[13px] text-slate-400">{d.nguoi} · <span className="tabular-nums">{lucNgan(d.luc)}</span></span>
              </li>
            ))}
          </ul>
        )}
    </aside>
  );
}
