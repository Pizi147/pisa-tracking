import { useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { t } from '@shared/i18n/index.ts';
import { tuanLich } from '@shared/domain/index.ts';
import { useApi } from '../../lib/useApi.ts';
import { KhungPanel } from '../../ui/KhungPanel.tsx';
import { NutLuat } from '../../ui/NutLuat.tsx';
import { Bang, type CotBang } from '../../ui/Bang.tsx';
import { CHIP_SOS, lopSos } from '../../ui/Nhan.tsx';
import { LOP_OSO } from '../../ui/SoLieu.tsx';
import { ErrorState, Skeleton } from '../../ui/ui.tsx';

/**
 * Ô "SẮP THI · TỚI HẾT T{tháng sau} · CÒN SOS" + PANEL EM (GD-12b web, mockup ⑨ C1 / C4–C6 / E2, lời 37). Số từ `sapThi` của `GET /phan-tich/thi-that`
 * (đã nạp cùng tab — 0 request thêm khi mở tab); panel `GET /phan-tich/thi-that/o?o=sap-thi[:mức]` CHỈ khi bấm — cùng hàm máy chủ với số (#1674).
 * Chip SOS n mở panel lọc sẵn mức đó; 0 không bấm. Em đếm theo HIỆN TRẠNG (không theo kỳ) — không trùng số lượt SOS của tab SOS.
 */
export type SapThiSosSo = { n: number; sos: [number, number, number]; chot: number; duKien: number; den: string };
type DongSapThi = {
  id: number; em: { id: number; ten: string }; href: string; classId: number | null; lop: string | null;
  lichThi: { ngay: string | null; thang: string }; sos: { muc: 1 | 2 | 3; kyNang: string[]; luot: string }; tvv: string | null;
};

const thang = (ym: string) => `T${Number(ym.slice(5, 7))}`;

export function OSapThiSos({ so, nguon, ngCanh }: { so: SapThiSosSo; nguon: (o: string) => string; ngCanh: string }) {
  const [mo, setMo] = useState<string | null>(null);
  const ten = t('Sắp thi · tới hết {thang} · còn SOS', { thang: thang(so.den) });
  return (
    <div className="flex min-w-0 flex-col gap-1 rounded-xl border px-3 pb-3 pt-2.5 sm:px-4 sm:pb-3.5 sm:pt-3" style={{ background: 'var(--surface)', borderColor: 'var(--line)' }}>
      <span className="flex items-start gap-2 text-[13px] font-medium text-[color:var(--text-dim)]">
        <span className="min-w-0 flex-1">{ten}</span>
        <NutLuat phai label={ten}>{t('Em đang học có lịch thi trong tháng này hoặc tháng sau — ngày đã chốt hoặc tháng dự kiến chưa chốt ngày — và đang SOS ở lượt MT mới nhất (hiện tại, không theo kỳ đang chọn). Đếm em, không đếm lượt: khác số của tab SOS.')}</NutLuat>
      </span>
      <span className="chi-so-gt flex items-baseline gap-2 text-[28px] font-bold leading-tight tabular-nums text-[color:var(--text)] [font-family:var(--phong-so,inherit)]">
        {so.n ? <button type="button" className={`${LOP_OSO} so-chinh`} aria-haspopup="dialog" aria-label={t('{n} em — xem danh sách', { n: so.n })} onClick={() => setMo('sap-thi')}>{so.n}</button>
          : <span className="font-medium text-faint">0</span>}
        <small className="text-[13px] font-medium text-[color:var(--text-dim)]">{t('em')}</small>
      </span>
      {so.n > 0 && (
        <span className="flex flex-wrap gap-1.5">
          {so.sos.map((n, i) => n > 0 && (
            <button key={i} type="button" className={`${CHIP_SOS} ${lopSos(i + 1)} cursor-pointer gap-1 border-0`} aria-haspopup="dialog" onClick={() => setMo(`sap-thi:${i + 1}`)}>
              SOS {i + 1} · {n}
            </button>
          ))}
        </span>
      )}
      <span className="text-xs text-[color:var(--text-faint)]">{t('hiện tại')}</span>
      {mo && <PanelSapThi nguon={nguon(mo)} tieuDe={mo === 'sap-thi' ? ten : `${ten} · SOS ${mo.slice(-1)}`} ngCanh={ngCanh} so={so} onDong={() => setMo(null)} />}
    </div>
  );
}

function PanelSapThi({ nguon, tieuDe, ngCanh, so, onDong }: { nguon: string; tieuDe: string; ngCanh: string; so: SapThiSosSo; onDong: () => void }) {
  const { data, loading, error, reload } = useApi<{ n: number; rows: DongSapThi[]; dem: string }>(nguon, [nguon]);
  const cot: CotBang[] = [
    { key: 'em', nhan: t('Học viên'), kieu: 'ten', linhHoat: true },
    { key: 'lop', nhan: t('Lớp'), kieu: 'chu', rong: 110 },
    { key: 'lich', nhan: t('Lịch thi'), kieu: 'chu', rong: 112 },
    { key: 'sos', nhan: t('SOS · MT mới nhất'), kieu: 'chu', rong: 160 },
    { key: 'tvv', nhan: 'TVV', kieu: 'chu', rong: 128 },
  ];
  const oCua = (r: DongSapThi, c: CotBang): ReactNode => {
    switch (c.key) {
      case 'em': return <Link to={r.href} className="ten-ho-so font-semibold">{r.em.ten}</Link>;
      case 'lop': return r.classId ? <Link to={`/hoc-vien/lop/${r.classId}`} className="text-[color:var(--text)] no-underline hover:underline">{r.lop}</Link> : (r.lop ?? '—');
      case 'lich': return r.lichThi.ngay
        ? <span className="grid leading-tight"><b className="font-semibold">{t('thi {ngay}', { ngay: `${r.lichThi.ngay.slice(8, 10)}/${r.lichThi.ngay.slice(5, 7)}` })}</b><small className="text-xs text-[color:var(--text-faint)]">{tuanLich(r.lichThi.ngay)}</small></span>
        : <span className="grid leading-tight"><b className="font-semibold">{t('dự kiến {thang}', { thang: thang(r.lichThi.thang) })}</b><small className="text-xs text-[color:var(--text-faint)]">{t('chưa chốt ngày')}</small></span>;
      case 'sos': return <span className={`${CHIP_SOS} ${lopSos(r.sos.muc)}`}>{[`SOS ${r.sos.muc}`, ...r.sos.kyNang].join(' · ')}</span>;
      default: return r.tvv ?? <span className="text-faint">—</span>;
    }
  };
  const phuCua = (r: DongSapThi, c: CotBang) => (c.key === 'sos' && r.sos.luot ? r.sos.luot : null);
  return (
    <KhungPanel tieuDe={tieuDe} loai={t('Số · Thi thật')} rong="rong" onDong={onDong} ngCanh={ngCanh}
      chan={{ huy: { nhan: t('Đóng'), onClick: onDong }, huyPhai: true }}>
      {error ? <ErrorState message={error.message} hint={error.hint} status={error.status} onRetry={reload} />
        : loading || !data ? <Skeleton rows={6} />
        : (
          <div className="flex flex-col gap-3">
            <p className="m-0 flex flex-wrap items-center gap-x-3 gap-y-1 text-[15px] font-bold text-[color:var(--text)]">
              {t('{n} em', { n: data.n })}
              {/* ⑨ C5: dòng chip chia SOS (mức có em) + "đã chốt ngày n · dự kiến n" — chỉ đọc. */}
              {so.sos.map((n, i) => n > 0 && <span key={i} className="inline-flex h-7 items-center rounded-full border px-3 text-[13px] font-medium" style={{ borderColor: 'var(--line-strong)' }}>SOS {i + 1} <b className="ml-1.5 tabular-nums">{n}</b></span>)}
              <span className="inline-flex h-7 items-center rounded-full border px-3 text-[13px] font-medium" style={{ borderColor: 'var(--line-strong)' }}>{data.dem}</span>
            </p>
            <Bang ten={tieuDe} cot={cot} hang={data.rows} khoa={(r) => r.id} oCua={oCua} phuCua={phuCua} khung={false}
              theRieng={(r) => (
                <div className="grid gap-1">
                  <div className="flex items-baseline gap-2">{oCua(r, cot[0])}<span className="text-xs text-[color:var(--text-dim)]">{r.lop}</span><span className="ml-auto">{oCua(r, cot[3])}</span></div>
                  <div className="flex items-center gap-3 text-sm">{oCua(r, cot[2])}<span className="ml-auto text-[13px] text-[color:var(--text-dim)]">{r.tvv ?? ''}</span></div>
                </div>
              )}
              rong={{ tieuDe: t('Không em nào sắp thi còn SOS.') }} />
          </div>
        )}
    </KhungPanel>
  );
}
