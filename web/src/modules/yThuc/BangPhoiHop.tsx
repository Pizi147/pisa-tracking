import { useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, invalidate } from '../../lib/api.ts';
import { useApi } from '../../lib/useApi.ts';
import { useToast } from '../../ui/Toast.tsx';
import { ChipSos } from '../../ui/ChipSos.tsx';
import { NutChon } from '../../ui/ui.tsx';
import { ONgay } from '../../ui/ONgay.tsx';
import { ChonNguoi } from '../../ui/PeoplePicker.tsx';
import { BangChung } from '../../ui/BangChung.tsx';
import { OKhac } from '../../ui/OKhac.tsx';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import { fmtDate } from '../../lib/format.ts';
import {
  COORDINATION_REMOVE_REASON_LABEL, COORDINATION_USER_REMOVE_REASONS, GHI_CHU_MEETING_TOI_THIEU, chuDiem, chuTruotSos, kiemGhiRoKhac, laMeetingCx, nhanHan,
  reasonNeedsText, daysBetween, shortDate, type NguoiChon,
} from '@shared/domain/index.ts';
import { t } from '@shared/i18n/index.ts';
import type { CoordAction, CoordTurn } from './PhoiHopSosSection.tsx';

/**
 * PHOI-HOP-V2 (chủ SP 11/11, mockup `thiet-ke/2026-11-11-phoi-hop-sos-v2` K1–K3): BẢNG ① Học viên cần làm → ② Đã làm → ③ Kết quả, mỗi em một dòng.
 * `gvcn` (khoa = một loại việc): nút Xác nhận ở chính ô ② (ngày sẽ hiện ở đó), form tại dòng — Ngày + MỘT ô Nội dung (+ Tệp, Người thực hiện); Hoàn tác 10 s.
 * `tvv`: việc sau Meeting CX — ② GVCN đã xác nhận (ngày, nội dung gửi TVV), ③ Kết quả · Ngày · Nội dung như Báo PH ý thức (`/y-thuc/bao-ph/ghi`).
 * Dữ liệu: MỘT request khi mở panel (`/classes/:id/phoi-hop-sos`, việc TVV đã nạp theo lô ở máy chủ); SĐT phụ huynh chỉ đọc khi mở form TVV.
 */
export const HOAN_TAC_PHOI_HOP_MS = 10_000;
type Dong = { luot: CoordTurn; a: CoordAction };

/** Một dòng điểm gọn, chữ phụ ("MT4 · ✗ 5.0 / 6.5 · trượt L, R") — Phối hợp SOS là SOS học thuật; không màu đậm. */
export function DiemMotDong({ th }: { th: CoordTurn['the'] }) {
  const pt = !!th.pt;
  const dat = th.ovr == null || th.moc == null ? null : th.ovr >= th.moc;
  const truot = chuTruotSos(th);
  return (
    <span className="mt-0.5 block text-[13px] leading-snug text-dim">
      {th.luot}
      {th.ovr != null && <> · <span className="font-semibold tabular-nums">{dat === false ? '✗ ' : dat ? '✓ ' : ''}{chuDiem(th.ovr, pt)}</span>{th.moc != null && <span className="tabular-nums"> / {chuDiem(th.moc, pt)}</span>}</>}
      {truot && <> · {truot}</>}
    </span>
  );
}

export function BangPhoiHop({ turns, che, onChanged, chiEm }: {
  turns: CoordTurn[]; che: { loai: 'gvcn'; khoa: string } | { loai: 'tvv' };
  onChanged: () => void;
  /** Bấm chip tên em ở Công việc: dòng em đó lên đầu, viền nhấn. */
  chiEm?: number | null;
}) {
  const khop = (a: CoordAction) => (a.kind === 'other' ? `other:${encodeURIComponent(a.customName ?? '')}` : a.kind);
  const { can, da } = useMemo(() => {
    const ds: Dong[] = turns.flatMap((luot) => luot.actions.map((a) => ({ luot, a })))
      .filter(({ a }) => (che.loai === 'tvv' ? !!a.tvv && a.tvv.trangThai !== 'bo' : khop(a) === che.khoa && a.status !== 'removed'));
    const cho = (d: Dong) => (che.loai === 'tvv' ? d.a.tvv!.trangThai === 'mo' : d.a.status === 'pending');
    const hanCua = (d: Dong) => (che.loai === 'tvv' ? d.a.tvv!.han : d.a.han) ?? '9999';
    const sap = (x: Dong, y: Dong) => Number(y.luot.studentId === chiEm) - Number(x.luot.studentId === chiEm) || hanCua(x).localeCompare(hanCua(y))
      || x.luot.studentName.localeCompare(y.luot.studentName, 'vi');
    return { can: ds.filter(cho).sort(sap), da: ds.filter((d) => !cho(d)).sort(sap) };
  }, [turns, che.loai, che.loai === 'gvcn' ? che.khoa : '', chiEm]);   // eslint-disable-line react-hooks/exhaustive-deps
  const tvv = che.loai === 'tvv';
  return (
    <div role="table" className="text-sm" aria-label={tvv ? t('Báo PH · kết quả') : t('Kết quả')}>
      <div role="row" className={`${HANG} h-10 items-center border-b text-[13px] font-semibold text-dim max-sm:hidden`} style={{ borderColor: 'var(--line)' }}>
        <span role="columnheader" className="pr-2.5">{'① '}{tvv ? t('Học viên cần báo') : t('Học viên cần làm')}</span>
        <span role="columnheader" className="px-2.5">{'② '}{tvv || laMeetingCx(che.loai === 'gvcn' ? che.khoa : '') ? t('GVCN xác nhận') : t('Đã làm')}</span>
        <span role="columnheader" className="px-2.5">{'③ '}{tvv ? t('Báo PH · kết quả') : t('Kết quả')}</span>
        <span role="columnheader"><span className="sr-only">{t('Thao tác khác')}</span></span>
      </div>
      {can.map((d) => <DongPhoiHop key={d.a.id} d={d} tvv={tvv} noi={d.luot.studentId === chiEm} onChanged={onChanged} />)}
      {da.length > 0 && (
        <>
          <div role="row" className="pb-1.5 pt-3.5 text-[13px] font-bold text-dim"><span role="cell">{tvv ? t('Đã báo') : t('Đã làm')}<span className="ml-1.5 text-xs font-semibold tabular-nums text-faint">{da.length}</span></span></div>
          {da.map((d) => <DongPhoiHop key={d.a.id} d={d} tvv={tvv} noi={false} onChanged={onChanged} />)}
        </>
      )}
    </div>
  );
}

/* Lưới 4 cột ① ② ③ ⋯ (mockup `.pht`) — div lưới (danh sách việc có form tại dòng, không phải bảng số liệu). 375: xếp dọc. */
const HANG = 'grid grid-cols-[32%_23%_minmax(0,1fr)_40px] max-sm:grid-cols-[minmax(0,1fr)_44px]';
const O = 'min-w-0 px-2.5 py-2.5 max-sm:col-span-2 max-sm:px-0 max-sm:py-1';

/** Hạn dưới tên em: quá hạn đỏ ⚠ + ngày; còn ≤ 3 ngày vàng; xa mờ. */
function HanEm({ han }: { han: string }) {
  const { homNay } = useNgayNghiepVu();
  if (!homNay) return null;
  const qua = han < homNay;
  const gan = !qua && daysBetween(homNay, han) <= 3;
  return (
    <span className={`mt-1 block whitespace-nowrap text-[13px] tabular-nums ${qua ? 'font-bold text-late' : gan ? 'font-semibold text-soon' : 'text-dim'}`}>
      {(qua || gan) && <span aria-hidden>⚠ </span>}
      {qua ? <><span className="sr-only">{t('quá hạn')}</span>{t('{n} ngày', { n: daysBetween(han, homNay) })} · {shortDate(han, homNay)}</> : nhanHan(han, homNay)}
    </span>
  );
}

function DongPhoiHop({ d, tvv, noi, onChanged }: { d: Dong; tvv: boolean; noi: boolean; onChanged: () => void }) {
  const { luot, a } = d;
  const toast = useToast();
  const [mo, setMo] = useState<null | 'xac-nhan' | 'ghi' | 'bo' | 'menu'>(null);
  const [vua, setVua] = useState(false);
  const [du, setDu] = useState(false);
  const cho = tvv ? a.tvv!.trangThai === 'mo' : a.status === 'pending';
  const han = tvv ? (cho ? a.tvv!.han : null) : cho ? a.han : null;
  const doi = () => { invalidate('/classes'); invalidate('/students'); invalidate('/my-work'); onChanged(); };
  const moLai = async () => {
    try { await api.post(`/phoi-hop-sos/${a.id}/mo-lai`); doi(); } catch (e: any) { toast.push('error', e.message); }
  };
  const daLuu = () => {
    setMo(null); setVua(true); doi();
    if (!tvv) toast.hoanTac(t('Đã lưu'), () => void moLai(), { key: `phoi-hop:${a.id}`, ms: HOAN_TAC_PHOI_HOP_MS });
    else toast.push('ok', t('Đã lưu'));
  };
  const nen = vua ? 'bg-[rgb(var(--ok-bg-rgb)/0.7)]' : mo === 'xac-nhan' || mo === 'ghi' ? 'bg-[color:var(--accent-soft)]' : noi ? 'shadow-[inset_3px_0_0_var(--accent)]' : '';
  const ngoiLam = a.performerName ?? null;
  return (
    <div role="row" className={`${HANG} border-b ${nen}`} style={{ borderColor: 'var(--line)' }}>
      <span role="cell" className="min-w-0 py-2.5 pr-2.5 max-sm:pb-1">
        <span className="flex flex-wrap items-center gap-2">
          <Link to={`/hoc-vien/${luot.studentId}?tab=y-thuc&sub=phoi-hop`} className="text-[15px] font-semibold text-[color:var(--text)] no-underline hover:text-[color:var(--accent)] hover:underline max-sm:inline-flex max-sm:min-h-[44px] max-sm:items-center">{luot.studentName}</Link>
          {luot.sosLevel !== null && <ChipSos muc={luot.sosLevel} kyNang={luot.kyNangNgan} hienKyNang={false} dot={`MT${luot.attemptNo}`} ten={luot.studentName} tinh />}
        </span>
        <DiemMotDong th={luot.the} />
        {han && <HanEm han={han} />}
      </span>
      {mo === 'xac-nhan' ? (
        <span role="cell" className={`${O} col-span-3 max-sm:col-span-2`}><FormXacNhan a={a} onDong={() => setMo(null)} onLuu={daLuu} /></span>
      ) : (
        <>
          <span role="cell" className={`${O} max-sm:order-3`}>
            {tvv || a.status === 'done' ? (
              <span className="grid justify-items-start gap-0.5">
                <span className="whitespace-nowrap text-sm font-semibold tabular-nums text-ok">✓ {fmtDate(a.performedOn)}{vua && !tvv ? ` · ${t('Bạn')}` : ''}</span>
                {ngoiLam && <span className="text-[13px] text-dim">{ngoiLam}</span>}
                {tvv && a.note && <span className="line-clamp-2 text-[13px] text-dim">{a.note}</span>}
                {!tvv && luot.canAct && <button type="button" className="link min-h-[44px] appearance-none border-0 bg-transparent p-0 text-[13px] font-semibold sm:min-h-0" onClick={() => setMo('xac-nhan')}>{t('Sửa')}</button>}
              </span>
            ) : luot.canAct ? (
              <button type="button" className="btn btn-primary btn-sm min-h-[44px] max-sm:w-full sm:min-h-[30px]" onClick={() => setMo('xac-nhan')}>{t('Xác nhận')}</button>
            ) : <span className="text-[13px] text-dim">{t('Chờ GVCN')}</span>}
          </span>
          {mo === 'ghi' ? (
            <span role="cell" className={`${O} col-span-2 max-sm:order-4`}><FormTvv a={a} onDong={() => setMo(null)} onLuu={daLuu} /></span>
          ) : (
            <>
              <span role="cell" className={`${O} max-sm:order-4`}><OKetQua a={a} tvv={tvv} du={du} onDu={() => setDu((v) => !v)} onGhi={() => setMo('ghi')} /></span>
              <span role="cell" className="relative py-2.5 text-right max-sm:col-start-2 max-sm:row-start-1 max-sm:pb-1">
                <Menu3 a={a} tvv={tvv} canAct={luot.canAct} mo={mo === 'menu'} onMo={(v) => setMo(v ? 'menu' : null)} onBo={() => setMo('bo')} onMoLai={() => void moLai()} />
              </span>
            </>
          )}
        </>
      )}
      {mo === 'bo' && (
        <span role="cell" className="col-span-full pb-3">
          <FormBo id={a.id} tvv={tvv ? a.tvv!.viecId : null} onDong={() => setMo(null)} onXong={() => { setMo(null); doi(); }} />
        </span>
      )}
    </div>
  );
}

/** Ô ③: Nội dung GVCN ghi (2 dòng + Xem đủ); Meeting CX: TVV báo gì — chờ / chưa liên hệ được / đã báo; người có quyền thấy nút Ghi kết quả. */
function OKetQua({ a, tvv, du, onDu, onGhi }: { a: CoordAction; tvv: boolean; du: boolean; onDu: () => void; onGhi: () => void }) {
  const v = a.tvv;
  const chu = (s: string | null) => s ? (
    <>
      <p className={`m-0 text-sm leading-normal text-[color:var(--text)] ${du ? '' : 'line-clamp-2'}`}>{s}</p>
      {s.length > 90 && <button type="button" className="link mt-1 appearance-none border-0 bg-transparent p-0 text-[13px] font-semibold" aria-expanded={du} onClick={onDu}>{du ? t('Thu gọn') : t('Xem đủ')}</button>}
    </>
  ) : null;
  if (laMeetingCx(a.kind) && (tvv || a.status === 'done')) {
    if (!v) return null;
    const ten = v.tvv ? t('TVV {ten}', { ten: v.tvv }) : t('GVCN');
    return (
      <span className="grid justify-items-start gap-1">
        {v.trangThai === 'xong' ? <span className="bv xong">{t('Đã báo PH')}{v.lan ? ` · ${fmtDate(v.lan.ngay)}` : ''}</span>
          : v.lan ? <span className="bv cho">{t('Chưa liên hệ được · lần {n}', { n: v.soLan })}</span>
          : <span className="bv dang">{v.tvv ? t('Chờ {ten}', { ten }) : t('Chưa có TVV — GVCN báo')}</span>}
        {v.trangThai === 'mo' && <span className="text-[13px] text-dim">{t('hạn {ngay}', { ngay: fmtDate(v.han) })}</span>}
        {chu(v.lan?.ghiChu ?? null)}
        {v.coTheGhi && v.trangThai === 'mo' && <button type="button" className="btn btn-primary btn-sm mt-1 min-h-[44px] sm:min-h-[30px]" onClick={onGhi}>{t('Ghi kết quả')}</button>}
        {v.coTheGhi && v.trangThai === 'xong' && <button type="button" className="link appearance-none border-0 bg-transparent p-0 text-[13px] font-semibold" onClick={onGhi}>{t('Sửa')}</button>}
      </span>
    );
  }
  if (a.status !== 'done') return null;
  if (!a.note) return <span className="text-[13px] text-faint">{t('Chưa ghi kết quả')}</span>;
  return <span className="block">{chu(a.note)}</span>;
}

/** ⋯ — việc ít dùng: Bỏ việc… · Đưa lại Cần xử lý (việc đã làm). TVV: Bỏ việc… của việc báo PH. */
function Menu3({ a, tvv, canAct, mo, onMo, onBo, onMoLai }: { a: CoordAction; tvv: boolean; canAct: boolean; mo: boolean; onMo: (v: boolean) => void; onBo: () => void; onMoLai: () => void }) {
  const muc: [string, () => void][] = tvv
    ? (a.tvv?.coTheGhi && a.tvv.trangThai === 'mo' ? [[t('Bỏ việc…'), onBo]] : [])
    : !canAct ? [] : a.status === 'done' ? [[t('Đưa lại Cần xử lý'), onMoLai], [t('Bỏ việc…'), onBo]] : [[t('Bỏ việc…'), onBo]];
  if (!muc.length) return null;
  return (
    <>
      <button type="button" className="btn btn-sm min-h-[44px] min-w-[44px] sm:min-h-[30px] sm:min-w-[30px]" aria-label={t('Thao tác khác')} aria-expanded={mo} onClick={() => onMo(!mo)}>⋯</button>
      {mo && (
        <span role="menu" className="absolute right-0 top-11 z-10 grid min-w-[200px] rounded-[10px] border p-1.5 text-left shadow-xl" style={{ background: 'var(--surface)', borderColor: 'var(--line-strong)' }}>
          {muc.map(([nhan, f]) => (
            <button key={nhan} type="button" role="menuitem" className="min-h-[40px] appearance-none rounded-md border-0 bg-transparent px-2.5 text-left text-sm hover:bg-[color:var(--accent-soft)]" onClick={() => { onMo(false); f(); }}>{nhan}</button>
          ))}
        </span>
      )}
    </>
  );
}

/** Xác nhận tại dòng (GVCN / QL): Ngày + MỘT ô Nội dung (bắt buộc; Meeting CX: "Nội dung gửi TVV" tuỳ chọn) · + Tệp · Người thực hiện. Sửa: điền sẵn. */
function FormXacNhan({ a, onDong, onLuu }: { a: CoordAction; onDong: () => void; onLuu: () => void }) {
  const toast = useToast();
  const { homNay } = useNgayNghiepVu();
  const meeting = laMeetingCx(a.kind);
  const [ngay, setNgay] = useState(a.performedOn ?? homNay);
  const [nd, setNd] = useState(a.note ?? '');
  const [nguoi, setNguoi] = useState<NguoiChon | null>(a.performerName ? { kieu: 'ngoai', ten: a.performerName } : { kieu: 'toi' });
  const [doiNguoi, setDoiNguoi] = useState(!!a.performerName);
  const [tep, setTep] = useState(false);
  const [busy, setBusy] = useState(false);
  const [daBam, setDaBam] = useState(false);
  const loi = !meeting && !nd.trim() ? t('Ghi Nội dung: đã làm gì, em / gia đình phản hồi gì.') : null;
  const luu = async () => {
    setDaBam(true);
    if (loi || !ngay) return;
    setBusy(true);
    try {
      await api.post(`/phoi-hop-sos/${a.id}/confirm`, { performedOn: ngay, note: nd.trim() || undefined, performerName: !nguoi || nguoi.kieu === 'toi' ? undefined : nguoi.ten.trim() });
      onLuu();
    } catch (e: any) { toast.push('error', e.message); } finally { setBusy(false); }
  };
  const idLoi = `xn-loi-${a.id}`;
  return (
    <div className="grid gap-2.5 text-left">
      <span className="flex flex-wrap items-center gap-x-3 gap-y-2"><span className="text-sm font-bold">{t('Ngày')} <span className="text-late">*</span></span>
        <span className="block w-[11.5rem]"><ONgay kieu="ngay" value={ngay} onChange={setNgay} toiDa={homNay} ariaLabel={t('Ngày')} /></span></span>
      <label className="grid gap-1.5 text-sm font-bold">
        <span>{meeting ? <>{t('Nội dung gửi TVV')} <span className="font-normal text-faint">{t('tuỳ chọn')}</span></> : <>{t('Nội dung')} <span className="text-late">*</span></>}</span>
        <textarea className="field min-h-[76px] w-full font-normal" rows={3} value={nd} onChange={(e) => setNd(e.target.value)} aria-invalid={daBam && !!loi} aria-describedby={daBam && loi ? idLoi : undefined}
          placeholder={meeting ? t('Cần báo gia đình gì, mời ai họp') : t('Đã trao đổi gì, em / gia đình phản hồi gì, hẹn gì')} />
      </label>
      {daBam && loi && <span id={idLoi} className="text-[13px] text-late">{loi}</span>}
      {tep && <BangChung ownerType="sos_coordination_action" ownerId={a.id} canEdit tieuDe="" />}
      {doiNguoi && <ChonNguoi nhom="nhan_vien" value={nguoi} onChange={setNguoi} />}
      <span className="flex flex-wrap items-center gap-x-3 gap-y-2">
        {!tep && <button type="button" className="link appearance-none border-0 bg-transparent p-0 text-[13px] font-semibold" onClick={() => setTep(true)}>{t('+ Tệp')}</button>}
        {!doiNguoi && <span className="text-[13px] text-dim">{t('Người thực hiện')} <b className="text-[color:var(--text)]">{t('Tôi')}</b> <button type="button" className="link appearance-none border-0 bg-transparent p-0 font-semibold" onClick={() => setDoiNguoi(true)}>{t('Đổi')}</button></span>}
        <span className="flex-1" />
        <button type="button" className="btn btn-sm min-h-[44px] sm:min-h-[30px]" disabled={busy} onClick={onDong}>{t('Đóng')}</button>
        <button type="button" className="btn btn-primary btn-sm min-h-[44px] sm:min-h-[30px]" disabled={busy || !ngay} onClick={() => void luu()}>{busy ? t('Đang lưu…') : t('Lưu')}</button>
      </span>
      {meeting && a.status !== 'done' && <span className="text-[13px] text-dim">{t('Lưu xong: việc cho TVV của em báo gia đình, sắp xếp họp (em chưa có TVV: bạn báo).')}</span>}
    </div>
  );
}

/** TVV (hoặc GVCN khi em chưa có TVV) ghi kết quả như Báo PH ý thức: Kết quả · Ngày · Nội dung (≥ 10 ký tự). SĐT phụ huynh đọc khi mở form. */
function FormTvv({ a, onDong, onLuu }: { a: CoordAction; onDong: () => void; onLuu: () => void }) {
  const toast = useToast();
  const { homNay } = useNgayNghiepVu();
  const v = a.tvv!;
  const { data } = useApi<{ lienHe: { ten: string | null; quanHe: string | null; sdt: string | null } }>(`/y-thuc/bao-ph/${v.viecId}`, [v.viecId]);
  const [kq, setKq] = useState<'da_bao' | 'chua_lien_he'>('da_bao');
  const [ngay, setNgay] = useState(homNay);
  const [nd, setNd] = useState('');
  const [busy, setBusy] = useState(false);
  const [daBam, setDaBam] = useState(false);
  const khoa = useRef(`${v.viecId}-${Date.now()}`);
  const loi = nd.trim().length < GHI_CHU_MEETING_TOI_THIEU ? t('Nội dung ít nhất {n} ký tự.', { n: GHI_CHU_MEETING_TOI_THIEU }) : null;
  const luu = async () => {
    setDaBam(true);
    if (loi) return;
    setBusy(true);
    try { await api.post('/y-thuc/bao-ph/ghi', { viecIds: [v.viecId], ketQua: kq, ngay, ghiChu: nd.trim(), khoa: khoa.current }); onLuu(); }
    catch (e: any) { toast.push('error', e.message); } finally { setBusy(false); }
  };
  const lh = data?.lienHe;
  return (
    <div className="grid gap-2.5 text-left">
      {lh?.sdt && <span className="flex flex-wrap items-center gap-2 text-[13px] text-dim">{t('PH')} <b className="text-[color:var(--text)]">{[lh.ten, lh.quanHe && `(${lh.quanHe})`].filter(Boolean).join(' ')}</b>
        <a className="btn btn-sm min-h-[44px] tabular-nums no-underline sm:min-h-[30px]" href={`tel:${lh.sdt}`}>{lh.sdt}</a></span>}
      <span className="flex flex-wrap items-center gap-2"><span className="text-sm font-bold">{t('Kết quả')}</span>
        <NutChon nho chon={kq === 'da_bao'} onClick={() => setKq('da_bao')}>{t('Đã báo PH')}</NutChon>
        <NutChon nho chon={kq === 'chua_lien_he'} onClick={() => setKq('chua_lien_he')}>{t('Chưa liên hệ được')}</NutChon></span>
      <span className="flex flex-wrap items-center gap-x-3 gap-y-2"><span className="text-sm font-bold">{t('Ngày')} <span className="text-late">*</span></span>
        <span className="block w-[11.5rem]"><ONgay kieu="ngay" value={ngay} onChange={setNgay} toiDa={homNay} ariaLabel={t('Ngày')} /></span></span>
      <label className="grid gap-1.5 text-sm font-bold"><span>{t('Nội dung')} <span className="text-late">*</span></span>
        <textarea className="field min-h-[76px] w-full font-normal" rows={3} value={nd} onChange={(e) => setNd(e.target.value)} aria-invalid={daBam && !!loi}
          placeholder={t('Đã báo PH gì, hẹn họp ngày nào, kết quả buổi họp')} /></label>
      {daBam && loi && <span className="text-[13px] text-late">{loi}</span>}
      <span className="flex items-center justify-end gap-2">
        <button type="button" className="btn btn-sm min-h-[44px] sm:min-h-[30px]" disabled={busy} onClick={onDong}>{t('Đóng')}</button>
        <button type="button" className="btn btn-primary btn-sm min-h-[44px] sm:min-h-[30px]" disabled={busy} onClick={() => void luu()}>{busy ? t('Đang lưu…') : t('Lưu')}</button>
      </span>
    </div>
  );
}

/** Bỏ việc (lý do chọn nhanh, "Khác" bắt chữ) + Hoàn tác — việc GVCN (`/phoi-hop-sos/:id/remove`) hoặc việc TVV (`/y-thuc/bao-ph/:id/bo`). */
function FormBo({ id, tvv, onDong, onXong }: { id: number; tvv: number | null; onDong: () => void; onXong: () => void }) {
  const toast = useToast();
  const [ly, setLy] = useState('');
  const [chu, setChu] = useState('');
  const [busy, setBusy] = useState(false);
  const loiChu = reasonNeedsText(ly) ? kiemGhiRoKhac(chu) : null;
  const bo = async () => {
    if (!ly || loiChu) return;
    setBusy(true);
    try {
      if (tvv) await api.post(`/y-thuc/bao-ph/${tvv}/bo`, { lyDo: ly, lyDoKhac: reasonNeedsText(ly) ? chu.trim() : undefined });
      else await api.post(`/phoi-hop-sos/${id}/remove`, { reasonCode: ly, reasonText: reasonNeedsText(ly) ? chu.trim() : undefined });
      toast.hoanTac(t('Đã bỏ việc này'), () => {
        api.post(tvv ? `/y-thuc/bao-ph/${tvv}/khoi-phuc` : `/phoi-hop-sos/${id}/mo-lai`).then(() => { invalidate('/classes'); invalidate('/students'); invalidate('/my-work'); onXong(); },
          (e: any) => toast.push('error', e?.message ?? t('Không lưu được')));
      }, { key: `phoi-hop-bo:${tvv ? `t${tvv}` : id}` });
      onXong();
    } catch (e: any) { toast.push('error', e.message); } finally { setBusy(false); }
  };
  return (
    <div className="mt-1 grid gap-2 rounded-lg p-2.5" style={{ background: 'var(--surface-2)' }}>
      <span className="flex flex-wrap gap-1.5">{COORDINATION_USER_REMOVE_REASONS.map((r) => <NutChon key={r} nho chon={ly === r} onClick={() => setLy(r)}>{COORDINATION_REMOVE_REASON_LABEL[r]}</NutChon>)}</span>
      <OKhac hien={reasonNeedsText(ly)} value={chu} onChange={setChu} goiY={t('Ví dụ: Gia đình xin dời sang tuần sau')} loi={loiChu} />
      <span className="flex justify-end gap-1.5">
        <button type="button" className="btn btn-sm" onClick={onDong} disabled={busy}>{t('Đóng')}</button>
        <button type="button" className="btn btn-sm btn-primary" disabled={busy || !ly || !!loiChu} title={!ly ? t('Chọn một lý do.') : loiChu ?? undefined} onClick={() => void bo()}>{t('Bỏ việc này')}</button>
      </span>
    </div>
  );
}
