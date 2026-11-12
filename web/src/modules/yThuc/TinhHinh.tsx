import { useRef, useState, type ReactNode, type RefObject } from 'react';
import { api } from '../../lib/api.ts';
import { HopNeo } from '../../ui/HopNeo.tsx';
import { useToast } from '../../ui/Toast.tsx';
import { addDaysIso, hanBaoPh, ngay } from '@shared/domain/index.ts';
import { t } from '@shared/i18n/index.ts';
import { BadgeViec } from './khoiYThuc.tsx';
import { TheLoai } from './BangLan.tsx';
import { DUONG_LAM_MOI_Y_THUC, type TinhHinhView } from './kieu.ts';
import { invalidate } from '../../lib/api.ts';

/**
 * TÌNH HÌNH HỌC TẬP (chủ SP 12/11, mockup `thiet-ke/v20/tinh-hinh.html` A1 · C · F) — dòng trong khối em + hộp nhỏ neo nút.
 *   `gv_tvv`: GV báo tình hình cho TVV, nội dung tự do (KHÔNG phân loại); TVV ghi "Đã báo PH" qua panel Báo PH sẵn có.
 *   `tvv_gvcn`: TVV hỏi GVCN, hạn 3 ngày tính cả hôm nay; GVCN ghi kết quả. Chữ ngắn: không "TVV {tên}" (tên TVV đã ở dưới tên em — chủ SP 12/11).
 */
const TOI_DA = 500, TOI_THIEU = 10;
const LINK = 'link min-h-[30px] appearance-none border-0 bg-transparent p-0 text-[13px] font-semibold max-sm:min-h-[44px]';
const lamMoi = () => DUONG_LAM_MOI_Y_THUC.forEach((x) => invalidate(x));

/** Dòng đầu ô Vấn đề: nhãn loại + người gửi (GV báo) · ngày. */
export function TheTinhHinh({ x, homNay }: { x: TinhHinhView; homNay: string }) {
  return (
    <>
      <TheLoai loai={x.chieu === 'gv_tvv' ? 'th' : 'hoi'} />
      <span className="text-[13px] text-slate-400">
        {x.chieu === 'gv_tvv' && x.nguoiGui && <b className="font-semibold text-slate-200">{x.nguoiGui} · </b>}
        <span className="tabular-nums">{ngay(x.taoLuc.slice(0, 10), homNay)}</span>
      </span>
    </>
  );
}

/** Nội dung gửi — 3 dòng, "Xem đủ ▾" mở tại chỗ. */
export function NoiDungTinhHinh({ chu }: { chu: string }) {
  const [du, setDu] = useState(false);
  const dai = chu.length > 160;
  return (
    <span className="flex flex-col items-start gap-1">
      <span className={`max-w-[72ch] whitespace-pre-line break-words text-sm leading-relaxed text-slate-100 ${du || !dai ? '' : 'line-clamp-3'}`}>{chu}</span>
      {dai && <button type="button" aria-expanded={du} className={LINK} onClick={() => setDu((v) => !v)}>{du ? `▴ ${t('Thu gọn')}` : `${t('Xem đủ')} ▾`}</button>}
    </span>
  );
}

/** Ô "Đã xử lý" của dòng tình hình: GV báo → kết quả TVV (nhãn TVV); TVV hỏi → kết quả GVCN (nhãn GVCN). */
export function daXuLyTinhHinh(x: TinhHinhView, homNay: string): { gv?: ReactNode; tvv?: ReactNode } {
  if (x.chieu === 'gv_tvv') {
    const l = x.baoPh?.lan;
    if (x.trangThai === 'rut') return { tvv: <BadgeViec tong="xam">{t('Đã rút')}</BadgeViec> };
    if (!l) return {};
    return {
      tvv: (
        <span className="flex flex-col items-start gap-[5px]">
          <BadgeViec tong={l.ketQua === 'da_bao' ? 'xong' : x.quaHan ? 'qua' : 'cho'}>
            {l.ketQua === 'da_bao' ? t('Đã báo PH · {ngay}', { ngay: ngay(l.ngay, homNay) }) : t('Chưa liên hệ được · {ngay}', { ngay: ngay(l.ngay, homNay) })}
          </BadgeViec>
          {l.noiDung && <span className="line-clamp-2 text-[13px] leading-snug text-slate-300">{l.noiDung}</span>}
        </span>
      ),
    };
  }
  if (x.trangThai === 'rut') return { gv: <BadgeViec tong="xam">{t('Đã rút')}</BadgeViec> };
  if (!x.traLoi) return {};
  return {
    gv: (
      <span className="flex flex-col items-start gap-[5px]">
        <BadgeViec tong="xong">{t('Đã trả lời · {ngay}', { ngay: ngay((x.traLoiLuc ?? '').slice(0, 10), homNay) })}</BadgeViec>
        <span className="whitespace-pre-line break-words text-[13px] leading-snug text-slate-300">{x.traLoi}</span>
        {x.traLoiBoi && <span className="text-xs text-slate-500">{x.traLoiBoi}</span>}
      </span>
    ),
  };
}

export type ThaoTacTh = {
  /** TVV / QL ghi kết quả báo PH (panel Báo PH sẵn có). */ onGhiBaoPh: (x: TinhHinhView) => void;
  onSua: (x: TinhHinhView, neo: RefObject<HTMLElement | null>) => void;
  onRut: (x: TinhHinhView) => void;
  onTraLoi: (x: TinhHinhView, neo: RefObject<HTMLElement | null>) => void;
  onHoanTacTraLoi: (x: TinhHinhView) => void;
};

/** Ô "Bước đang làm" của dòng tình hình — chip + đúng nút của người xem; không phải việc của mình → "Chờ …". */
export function BuocTinhHinh({ x, homNay, tvv, gvcn, f }: { x: TinhHinhView; homNay: string; tvv: string | null; gvcn: string | null; f: ThaoTacTh }) {
  const neo = useRef<HTMLButtonElement>(null);
  const neoSua = useRef<HTMLButtonElement>(null);
  const cho = (vai: string, ten: string | null) => <span className="text-[13px] text-slate-500">{t('Chờ {vai}', { vai })}{ten && <> <b className="whitespace-nowrap font-semibold text-slate-300">{ten}</b></>}</span>;
  const han = x.han ? (
    <span className="flex flex-col items-start gap-1.5">
      <BadgeViec tong={x.quaHan ? 'qua' : x.han <= addDaysIso(homNay, 1) ? 'cho' : 'dang'}>
        {x.chieu === 'gv_tvv' ? t('TVV báo PH · hạn {ngay}', { ngay: ngay(x.han, homNay) })
          : x.coTheTraLoi ? t('Bạn trả lời · hạn {ngay}', { ngay: ngay(x.han, homNay) }) : t('GVCN trả lời · hạn {ngay}', { ngay: ngay(x.han, homNay) })}
      </BadgeViec>
    </span>
  ) : null;
  const sua = x.coTheSua && (
    <span className="flex gap-4">
      <button ref={neoSua} type="button" className={LINK} onClick={() => f.onSua(x, neoSua)}>{t('Sửa')}</button>
      <button type="button" className={LINK} onClick={() => f.onRut(x)}>{t('Rút')}</button>
    </span>
  );
  if (x.trangThai === 'mo') {
    if (x.chieu === 'gv_tvv') {
      return <>{han}{x.baoPh?.coTheGhi
        ? <button type="button" className="btn btn-primary w-full justify-center max-sm:h-11" onClick={() => f.onGhiBaoPh(x)}>{t('Ghi kết quả báo PH')}</button>
        : cho('TVV', x.baoPh?.tvv ?? tvv)}{sua}</>;
    }
    return <>{han}{x.coTheTraLoi
      ? <button ref={neo} type="button" className="btn btn-primary w-full justify-center max-sm:h-11" onClick={() => f.onTraLoi(x, neo)}>{t('Ghi kết quả')}</button>
      : cho('GVCN', gvcn)}{sua}</>;
  }
  if (x.trangThai === 'rut') return <span className="text-[13px] text-slate-500">—</span>;
  return (
    <span className="flex flex-col items-start gap-1.5">
      <span className="text-sm font-semibold text-ok">✓ {t('Xong')}</span>
      {x.chieu === 'tvv_gvcn' && x.hoanTacDuoc && <button type="button" className={LINK} onClick={() => f.onHoanTacTraLoi(x)}>{t('Hoàn tác')}</button>}
      {x.chieu === 'tvv_gvcn' && x.coTheTraLoi && !x.hoanTacDuoc && <button ref={neo} type="button" className={LINK} onClick={() => f.onTraLoi(x, neo)}>{t('Sửa kết quả')}</button>}
    </span>
  );
}

export type CheDoHop =
  | { loai: 'bao'; em: { id: number; ten: string; tvv: string | null }[]; chonThem?: { id: number; ten: string; tvv: string | null }[] }
  | { loai: 'hoi'; em: { id: number; ten: string } | null; ds?: { id: number; ten: string }[]; gvcn: string | null }
  | { loai: 'sua'; x: TinhHinhView }
  | { loai: 'tra-loi'; x: TinhHinhView };

/**
 * HỘP NHỎ neo nút (việc ngắn → hộp, không panel): Báo tình hình (GV / QL → TVV, một hoặc nhiều em ≤ 8) · Hỏi tình hình (TVV / QL → GVCN) · Sửa · Ghi kết quả.
 * Một ô chữ 10–500 ký tự có bộ đếm; lỗi lưu → ở lại hộp, giữ chữ. Gửi xong: toast Hoàn tác (≤ 2 phút máy chủ còn cho xoá hẳn).
 */
export function HopTinhHinh({ neo, che, homNay, onDong, onXong }: {
  neo: RefObject<HTMLElement | null>; che: CheDoHop; homNay: string; onDong: () => void; onXong: () => void;
}) {
  const toast = useToast();
  const [chu, setChu] = useState(che.loai === 'sua' ? che.x.noiDung : che.loai === 'tra-loi' ? che.x.traLoi ?? '' : '');
  const [em, setEm] = useState<{ id: number; ten: string; tvv: string | null }[]>(che.loai === 'bao' ? che.em : che.loai === 'hoi' && che.em ? [{ ...che.em, tvv: null }] : []);
  /* Chọn em: Báo tình hình ≤ 8 em; Hỏi tình hình một em (từ hồ sơ lớp chưa có em). */
  const chonThem = che.loai === 'bao' ? che.chonThem : che.loai === 'hoi' && !che.em ? che.ds?.map((x) => ({ ...x, tvv: null })) : undefined;
  const toiDaEm = che.loai === 'hoi' ? 1 : 8;
  const canEm = che.loai === 'bao' || che.loai === 'hoi';
  const [luu, setLuu] = useState(false);
  const [loi, setLoi] = useState<string | null>(null);
  const daDoi = chu.trim() !== (che.loai === 'sua' ? che.x.noiDung : che.loai === 'tra-loi' ? che.x.traLoi ?? '' : '');
  const tieuDe = che.loai === 'bao' ? t('Báo tình hình học tập') : che.loai === 'hoi' ? t('Hỏi tình hình học tập')
    : che.loai === 'sua' ? (che.x.chieu === 'gv_tvv' ? t('Sửa tình hình học tập') : t('Sửa câu hỏi')) : t('Ghi kết quả tình hình học tập');
  const nhanO = che.loai === 'hoi' || (che.loai === 'sua' && che.x.chieu === 'tvv_gvcn') ? t('Câu hỏi') : che.loai === 'tra-loi' ? t('Kết quả') : t('Nội dung');
  const ngan = chu.trim().length < TOI_THIEU;
  const dai = chu.length > TOI_DA;
  const gui = async () => {
    if (ngan || dai || (canEm && !em.length)) return;
    setLuu(true); setLoi(null);
    try {
      if (che.loai === 'bao' || che.loai === 'hoi') {
        const r = await api.post<{ ids: number[] }>('/tinh-hinh', { chieu: che.loai === 'bao' ? 'gv_tvv' : 'tvv_gvcn', studentIds: em.map((e) => e.id), noiDung: chu.trim() });
        toast.hoanTac(che.loai === 'bao' ? t('Đã gửi TVV · {n} em', { n: r.ids.length }) : t('Đã gửi GVCN'), () => {
          void Promise.allSettled(r.ids.map((id) => api.post(`/tinh-hinh/${id}/rut`, { hoanTac: true }))).then(() => { lamMoi(); onXong(); });
        }, { key: 'tinh-hinh' });
      } else if (che.loai === 'sua') {
        await api.patch(`/tinh-hinh/${che.x.id}`, { noiDung: chu.trim() });
        toast.push('ok', t('Đã lưu'));
      } else {
        await api.post(`/tinh-hinh/${che.x.id}/tra-loi`, { traLoi: chu.trim() });
        toast.push('ok', t('Đã gửi kết quả cho TVV'));
      }
      lamMoi(); onXong(); onDong();
    } catch (e: any) { setLoi(e.message); } finally { setLuu(false); }
  };
  const ngoai = () => { if (!daDoi || window.confirm(t('Bỏ chữ đang gõ?'))) onDong(); };
  return (
    <HopNeo neo={neo} nhan={tieuDe} rong={460} onNgoai={ngoai}>
      <div className="grid gap-0.5 border-b pb-2.5" style={{ borderColor: 'var(--line)' }}>
        <b className="text-base font-bold text-slate-100">{tieuDe}</b>
        {(che.loai === 'tra-loi' || che.loai === 'sua') && <span className="text-[13px] text-slate-400">{che.x.chieu === 'tvv_gvcn' && che.loai === 'tra-loi' ? `“${che.x.noiDung}”` : null}</span>}
      </div>
      {canEm && (chonThem || che.loai === 'bao') && (
        <div className="grid gap-1.5">
          <span className="text-sm font-bold text-slate-100">{t('Học viên')}</span>
          <span className="flex flex-wrap items-center gap-1.5">
            {em.map((e) => (
              <span key={e.id} className="inline-flex h-7 items-center gap-1 rounded-full border pl-2.5 pr-1 text-[13px] font-medium surface-2" style={{ borderColor: 'var(--line-strong)' }}>
                {e.ten}
                {(em.length > 1 || chonThem) && <button type="button" aria-label={t('Bỏ {ten}', { ten: e.ten })} className="h-6 w-6 appearance-none rounded-full border-0 bg-transparent text-slate-500 max-sm:h-11 max-sm:w-11" onClick={() => setEm((c) => c.filter((x) => x.id !== e.id))}>✕</button>}
              </span>
            ))}
            {chonThem && em.length < toiDaEm && (
              <select className="field h-8 w-auto py-0 text-[13px] max-sm:h-11" aria-label={t('Chọn em')} value=""
                onChange={(ev) => { const x = chonThem.find((c) => c.id === Number(ev.target.value)); if (x) setEm((c) => [...c, x]); }}>
                <option value="">{t('+ Chọn em')}</option>
                {chonThem.filter((c) => !em.some((e) => e.id === c.id)).map((c) => <option key={c.id} value={c.id}>{c.ten}</option>)}
              </select>
            )}
          </span>
        </div>
      )}
      {(che.loai === 'bao' || che.loai === 'hoi') && (
        <dl className="m-0 grid grid-cols-[auto_minmax(0,1fr)] gap-x-2.5 gap-y-1 text-[13px] text-slate-400">
          <dt>{t('Gửi tới')}</dt>
          <dd className="m-0">{che.loai === 'hoi'
            ? <b className="font-semibold text-slate-100">{che.gvcn ? t('GVCN {ten}', { ten: che.gvcn }) : t('GVCN lớp em')}</b>
            : [...new Set(em.map((e) => e.tvv ?? ''))].map((tv) => (
              <span key={tv} className="block"><b className="font-semibold text-slate-100">{tv ? t('TVV {ten}', { ten: tv }) : t('Quản lý chi nhánh')}</b> · {em.filter((e) => (e.tvv ?? '') === tv).map((e) => e.ten).join(', ')}</span>
            ))}</dd>
          <dt>{t('Hạn')}</dt>
          <dd className="m-0"><b className="font-semibold text-slate-100">{che.loai === 'hoi' ? t('3 ngày') : t('5 ngày')}</b> · {t('tới {ngay}', { ngay: ngay(che.loai === 'hoi' ? addDaysIso(homNay, 2) : hanBaoPh(homNay), homNay) })}</dd>
        </dl>
      )}
      <label className="grid gap-1.5">
        <span className="text-sm font-bold text-slate-100">{nhanO} <span className="text-bad">*</span></span>
        <textarea className={`field min-h-[96px] py-2 text-[15px] ${dai ? 'border-late-line' : ''}`} value={chu} maxLength={TOI_DA + 50}
          aria-invalid={dai} onChange={(e) => setChu(e.target.value)} />
        <span className={`justify-self-end text-xs tabular-nums ${dai ? 'font-semibold text-bad' : 'text-slate-500'}`}>{chu.length} / {TOI_DA}</span>
      </label>
      {loi && <p role="alert" className="m-0 rounded-lg border border-late-line bg-late-bg px-3 py-2 text-[13px] text-late" >⚠ {loi} · {t('Chữ của bạn vẫn còn.')}</p>}
      <div className="flex justify-end gap-2 border-t pt-2.5" style={{ borderColor: 'var(--line)' }}>
        <button type="button" className="btn max-sm:h-11 max-sm:flex-1" onClick={ngoai}>{t('Đóng')}</button>
        <button type="button" className="btn btn-primary max-sm:h-11 max-sm:flex-1" disabled={luu || ngan || dai || (canEm && !em.length)} onClick={() => void gui()}>
          {luu ? t('Đang gửi…') : che.loai === 'bao' ? t('Gửi TVV') : che.loai === 'hoi' ? t('Gửi GVCN') : che.loai === 'tra-loi' ? t('Lưu · gửi TVV') : t('Lưu')}
        </button>
      </div>
    </HopNeo>
  );
}
