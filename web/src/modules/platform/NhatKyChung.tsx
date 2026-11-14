import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../../lib/api.ts';
import { useApi } from '../../lib/useApi.ts';
import { Card, ErrorState, Skeleton } from '../../ui/ui.tsx';
import { OChonThuong } from '../../ui/OChonThuong.tsx';
import { BadgeMo } from '../../ui/Nhan.tsx';
import { KhungPanel } from '../../ui/KhungPanel.tsx';
import { ONgay } from '../../ui/ONgay.tsx';
import { ChonLoc } from '../../ui/PeoplePicker.tsx';
import { DsLichSu, lucNgan, type DongLs } from '../../ui/LichSuThayDoi.tsx';
import { useToast } from '../../ui/Toast.tsx';
import { nhanDoiTuongNhatKy, nhanHanhDongNhatKy } from '@shared/domain/index.ts';
import { dich, t } from '@shared/i18n/index.ts';

type Muc = 'tai-khoan' | 'quyen' | 'mo-sua-lich' | 'chuong-trinh' | 'chi-nhanh' | 'band' | 'han' | 'case-sos';
type Dong = { id: number; luc: string; nguoi: string; muc: Muc; viec: string; doiTuong: string | null; truong: { ten: string; cu: string | null; moi: string | null }[] };
type Trang = { dong: Dong[]; tiep: number | null; nguoi: { id: number; ten: string }[]; muc: Muc[] };

/** Giá trị dài (danh sách vai, lịch MT dạng JSON) — cắt gọn trên dòng nhật ký. */
const ngan = (v: string) => (v.length > 80 ? `${v.slice(0, 80)}…` : v);
const TEN_MUC: Record<Muc, string> = {
  'tai-khoan': t('Tài khoản'), quyen: t('Quyền theo vai trò'), 'mo-sua-lich': t('Mở sửa lịch Test'),
  'chuong-trinh': t('Chương trình'), 'chi-nhanh': t('Chi nhánh'), band: t('Band & ngưỡng'), han: t('Hạn mặc định'), 'case-sos': 'Case & SOS',
};

/**
 * GD-17a (mockup ⑩ K2–K8, R10.2): MỘT dáng nhật ký mọi tab — dòng kiểu ⑤ H4 (`DsLichSu`: giờ · NGƯỜI đậm · việc · cũ gạch → mới).
 * `NhatKyDs` = phần lọc + danh sách dùng chung cho tab Nhật ký chung (Quản trị) và panel "Xem tất cả" của Quản lý (K8, không thêm tab — XM-1).
 */
function NhatKyDs({ muc, datMuc, dayDu }: { muc: Muc | ''; datMuc: (m: string) => void; /** Trang Quản trị: thêm lọc Từ / Đến. */ dayDu: boolean }) {
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
  const dong = [...(r.data?.dong ?? []), ...(them.qs === qs ? them.dong : [])];

  return (
    <>
      <div className="flex flex-wrap items-center gap-2 border-b px-4 py-3" style={{ borderColor: 'var(--line)' }}>
        {/* ⑤ A6: "Mục" = 8 mục cố định (tên tab) → ô chọn thường; "Người" = ô chọn có tìm (mẫu A, người có trong nhật ký đang xem — máy chủ đã trả). */}
        <OChonThuong aria-label={t('Mục')} value={muc} onChange={(e) => datMuc(e.target.value)} dangLoc={!!muc} className="max-sm:w-full">
          <option value="">{t('Mục: Tất cả')}</option>
          {(r.data?.muc ?? []).map((m) => <option key={m} value={m}>{TEN_MUC[m]}</option>)}
        </OChonThuong>
        <ChonLoc className="w-[240px] max-sm:w-full" ariaLabel={t('Người')} tatCa={t('Người: Tất cả')} placeholder={t('Gõ tên…')} value={nguoi} onChange={setNguoi}
          ds={(r.data?.nguoi ?? []).map((n) => ({ gt: String(n.id), ten: n.ten, nhom: t('Có trong nhật ký') }))} />
        {dayDu && <>
          <span className="inline-flex items-center gap-1.5 text-[13px] text-slate-400">{t('Từ')}
            <ONgay kieu="tuan" moc="dau" value={tu} onChange={setTu} ariaLabel={t('Từ tuần')} nutTrong /></span>
          <span className="inline-flex items-center gap-1.5 text-[13px] text-slate-400">{t('Đến')}
            <ONgay kieu="tuan" moc="cuoi" value={den} onChange={setDen} ariaLabel={t('Đến tuần')} nutTrong /></span>
        </>}
        {(muc || nguoi || tu || den) && <button type="button" className="btn btn-sm max-sm:min-h-[44px]" onClick={() => { datMuc(''); setNguoi(''); setTu(null); setDen(null); }}>{t('Xoá lọc')}</button>}
      </div>
      {r.error ? <div className="p-4"><ErrorState message={r.error.message} hint={r.error.hint} status={r.error.status} onRetry={r.reload} /></div>
        : !r.data ? <div className="p-4"><Skeleton rows={6} /></div>
        : <DsLichSu dong={dong.map((d) => dongLs(d, true))} rong={t('Chưa có thay đổi nào khớp.')} />}
      {tiep && (
        <div className="border-t px-4 py-2.5" style={{ borderColor: 'var(--line)' }}>
          <button type="button" className="btn btn-sm max-sm:min-h-[44px]" disabled={busy} onClick={() => void xemThem()}>{busy ? t('Đang tải…') : t('Xem thêm')}</button>
        </div>
      )}
    </>
  );
}

/** Một dòng nhật ký → `DongLs` (⑤ H4): [nhãn mục] NGƯỜI việc · đối tượng · trường cũ → mới. `coMuc` = nhãn mục (Nhật ký chung, panel). */
function dongLs(d: Dong, coMuc: boolean): DongLs {
  return {
    key: d.id, gio: lucNgan(d.luc), ai: null,
    viec: (
      <span className="inline-flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5">
        {coMuc && <span className="rounded px-1.5 py-px text-xs font-medium text-dim surface-2">{TEN_MUC[d.muc]}</span>}
        <b className="ai">{d.nguoi}</b>
        <span>{dich(nhanHanhDongNhatKy(d.viec))}{d.doiTuong ? ` · ${dich(nhanDoiTuongNhatKy(d.doiTuong))}` : ''}</span>
        {d.truong.slice(0, 4).map((x, i) => (
          <span key={i} className="break-words">{dich(x.ten)}: {x.cu !== null && <><span className="cu">{ngan(x.cu)}</span> → </>}<span className="moi">{x.moi !== null ? ngan(x.moi) : t('trống')}</span></span>
        ))}
        {d.truong.length > 4 && <span>+{d.truong.length - 4}</span>}
      </span>
    ),
  };
}

/**
 * NHẬT KÝ CHUNG (QTV2-QUYEN) — mọi lần đổi tài khoản, quyền, cấu hình (`GET /admin/nhat-ky`), lọc Mục · Người · Từ tuần → Đến tuần, 50 dòng một lần
 * + "Xem thêm". Mục trên URL (`?muc=`): link "Xem tất cả ›" ở các tab mở đúng mục.
 */
export function NhatKyChung() {
  const [params, setParams] = useSearchParams();
  const muc = (params.get('muc') ?? '') as Muc | '';
  const datMuc = (m: string) => { const n = new URLSearchParams(params); if (m) n.set('muc', m); else n.delete('muc'); setParams(n, { replace: true }); };
  return (
    <Card title={t('Nhật ký chung')} bodyClass="p-0">
      <NhatKyDs muc={muc} datMuc={datMuc} dayDu />
    </Card>
  );
}

/**
 * CỘT NHẬT KÝ của một tab cấu hình (mẫu chung QTV2, spec mục 5.0): 8 lần đổi gần nhất của mục đó (`/admin/nhat-ky?muc=`, cùng đường Nhật ký chung).
 * GD-17a (K5, K8): đầu "Nhật ký · n"; Quản trị: "Xem tất cả ›" sang Nhật ký chung lọc sẵn mục; Quản lý: nút "Xem tất cả" mở PANEL nhật ký tại chỗ
 * (không đổi trang, không tab mới — XM-1; `/admin/nhat-ky` chỉ trả 6 mục QL được xem, chỉ nạp khi bấm). Dòng ⑤ H4, cột hẹp: giờ trên dòng ([XM-7]).
 */
export function NhatKyMuc({ muc, quanTri }: { muc: Muc; quanTri: boolean }) {
  const r = useApi<Trang>(`/admin/nhat-ky?muc=${muc}&gioi-han=8`);
  const dong = r.data?.dong ?? [];
  const [moPanel, setMoPanel] = useState(false);
  /* Mockup K8: panel mở "Mục: Tất cả" (mọi mục QL được xem); lọc lại tại panel. */
  const [mucPanel, setMucPanel] = useState<string>('');
  return (
    <aside className="card min-w-0 self-start" aria-label={t('Nhật ký')}>
      <div className="flex items-center gap-2 border-b px-4 py-3" style={{ borderColor: 'var(--line)' }}>
        <h3 className="m-0 text-[15px] font-bold text-slate-100">{t('Nhật ký')}</h3>
        {dong.length > 0 && <BadgeMo so={dong.length} />}
        {quanTri
          ? <Link className="ml-auto text-[13px] font-semibold" to={`/quan-tri?tab=config&muc=${muc}`}>{t('Xem tất cả')} ›</Link>
          : <button type="button" className="btn btn-sm ml-auto max-sm:min-h-[44px]" onClick={() => { setMucPanel(''); setMoPanel(true); }}>{t('Xem tất cả')}</button>}
      </div>
      {r.error ? <div className="p-3"><ErrorState message={r.error.message} hint={r.error.hint} status={r.error.status} onRetry={r.reload} /></div>
        : !r.data ? <div className="p-3"><Skeleton rows={3} /></div>
        : <div className="ls-hep"><DsLichSu dong={dong.map((d) => dongLs(d, false))} rong={t('Chưa đổi lần nào.')} /></div>}
      {moPanel && (
        <KhungPanel tieuDe={t('Nhật ký cấu hình')} rong="rong" onDong={() => setMoPanel(false)} chan={{ huy: { nhan: t('Đóng'), onClick: () => setMoPanel(false) } }}>
          <div className="-mx-4 sm:-mx-5"><NhatKyDs muc={mucPanel as Muc | ''} datMuc={setMucPanel} dayDu={false} /></div>
        </KhungPanel>
      )}
    </aside>
  );
}
