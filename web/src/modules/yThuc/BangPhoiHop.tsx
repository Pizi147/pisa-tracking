import { createContext, useContext, useMemo, useRef, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { api, invalidate } from '../../lib/api.ts';
import { useApi } from '../../lib/useApi.ts';
import { useToast } from '../../ui/Toast.tsx';
import { ChipSos } from '../../ui/ChipSos.tsx';
import { NutChon } from '../../ui/ui.tsx';
import { MenuDong } from '../../ui/MenuDong.tsx';
import { DauQuaHan, LOP_MUC_HAN, Nhan } from '../../ui/Nhan.tsx';
import { DongHan } from '../../ui/DongHan.tsx';
import { AddCoordinationForm } from './PhoiHopSosSection.tsx';
import { ODiem } from '../../ui/ODiem.tsx';
import { ONgay } from '../../ui/ONgay.tsx';
import { ChonNguoi } from '../../ui/PeoplePicker.tsx';
import { BangChung } from '../../ui/BangChung.tsx';
import { OKhac } from '../../ui/OKhac.tsx';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import {
  COORDINATION_REMOVE_REASON_LABEL, COORDINATION_USER_REMOVE_REASONS, GHI_CHU_MEETING_TOI_THIEU, chuDiem, kiemGhiRoKhac, laMeetingCx,
  reasonNeedsText, mucHan, ngay as ngayHien, hoanTacXacNhanDuoc, datTheSos, mucDiem, nhanDocTheSos, type NguoiChon,
} from '@shared/domain/index.ts';
import { t } from '@shared/i18n/index.ts';
import type { CoordAction, CoordTurn, PhanMeetingTom } from './PhoiHopSosSection.tsx';
import { ThanhBuoc, type ONut } from './ThangYThuc.tsx';

/**
 * PHOI-HOP-V2 (chủ SP 11/11, mockup `thiet-ke/2026-11-11-phoi-hop-sos-v2` K1–K3): BẢNG ① Học viên → ② Đã làm → ③ Kết quả, mỗi em một dòng.
 * `gvcn` (khoa = một loại việc): nút Xác nhận ở chính ô ② (ngày sẽ hiện ở đó), form tại dòng — Ngày + MỘT ô Nội dung (+ Tệp, Người thực hiện); Hoàn tác 10 s.
 * `tvv`: việc sau Meeting CX — ② GVCN đã xác nhận (ngày, nội dung gửi TVV), ③ Kết quả · Ngày · Nội dung như Báo PH ý thức (`/y-thuc/bao-ph/ghi`).
 * Dữ liệu: MỘT request khi mở panel (`/classes/:id/phoi-hop-sos`, việc TVV đã nạp theo lô ở máy chủ); SĐT phụ huynh chỉ đọc khi mở form TVV.
 */
export const HOAN_TAC_PHOI_HOP_MS = 10_000;
type Dong = { luot: CoordTurn; a: CoordAction };

/**
 * Rà chủ SP 12/11 ("các trường thông tin dưới tên HV… chưa phân loại rõ"): dòng phụ dưới tên em CHIA LOẠI, một thành phần cho panel Công việc,
 * tab hồ sơ lớp, hồ sơ HV — thẻ LƯỢT (nền nhạt) · "Overall" mờ + số ✓ / ✗ ba màu (`ODiem`) + "/ kỳ vọng" · "Trượt" mờ + chip kỹ năng. Mỗi khối không ngắt
 * dòng bên trong; thiếu chỗ thì xuống dòng GIỮA các khối — không cắt "…". `anLuot`: ô đã ghi lượt (hồ sơ HV).
 */
export function DiemMotDong({ th, anLuot = false }: { th: CoordTurn['the']; anLuot?: boolean }) {
  const pt = !!th.pt;
  return (
    <span role="img" aria-label={nhanDocTheSos(th)} className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] leading-snug">
      {!anLuot && <span aria-hidden className="inline-flex h-5 items-center whitespace-nowrap rounded-md px-1.5 text-xs font-semibold text-dim" style={{ background: 'var(--surface-2)' }}>{th.luot}</span>}
      {th.ovr != null && (
        <span aria-hidden className="inline-flex items-baseline gap-1 whitespace-nowrap">
          <span className="text-xs font-medium text-faint">{pt ? t('Tổng') : t('Overall')}</span>
          <ODiem so={chuDiem(th.ovr, pt)} kq={mucDiem(datTheSos(th), th.ovr, th.moc)} />
          {th.moc != null && <span className="tabular-nums text-dim">/ {chuDiem(th.moc, pt)}</span>}
          {th.tam && <span className="text-xs text-faint">{t('tạm')}</span>}
        </span>
      )}
      {th.truot.length > 0 && (
        <span aria-hidden className="inline-flex flex-wrap items-center gap-1">
          <span className="mr-0.5 text-xs font-medium text-faint">{t('Trượt')}</span>
          {th.truot.map((k) => (
            <span key={k} className="inline-flex h-5 min-w-5 items-center justify-center whitespace-nowrap rounded border px-1 text-xs font-semibold text-late" style={{ borderColor: 'var(--line-strong)' }}>{k}</span>
          ))}
        </span>
      )}
    </span>
  );
}

/** GV-2: panel một việc có khối Phụ trách · Hạn · Theo dõi — "Sửa hạn" ở ⋯ của dòng ẩn (một chỗ sửa hạn). */
const AnHan = createContext(false);
export function BangPhoiHop({ turns, che, onChanged, chiEm, lop, anHan = false }: {
  /** GV-2: hạn sửa ở khối giao việc đầu panel — bỏ "Sửa hạn" của dòng. */
  anHan?: boolean;
  turns: CoordTurn[]; che: { loai: 'gvcn'; khoa: string } | { loai: 'tvv' };
  onChanged: () => void;
  /** Mã lớp — câu "Xong việc này ở {lớp}" khi hết em cần làm. */
  lop?: string;
  /** Bấm chip tên em ở Công việc: dòng em đó lên đầu, viền nhấn. */
  chiEm?: number | null;
}) {
  /* Dòng vừa lưu đứng nguyên chỗ (nền xanh nhạt, Hoàn tác) tới khi đóng panel. YT-b (mockup v19 B1–B2, chủ SP duyệt XM-1): panel Công việc CHỈ còn em
     cần làm — bỏ nhóm "Đã làm / Đã báo"; việc đã làm xem / sửa ở hồ sơ lớp › Phối hợp SOS (link chân panel). */
  const [vuaLuu, setVuaLuu] = useState<ReadonlySet<number>>(new Set());
  const khop = (a: CoordAction) => (a.kind === 'other' ? `other:${encodeURIComponent(a.customName ?? '')}` : a.kind);
  const can = useMemo(() => {
    const ds: Dong[] = turns.flatMap((luot) => luot.actions.map((a) => ({ luot, a })))
      .filter(({ a }) => (che.loai === 'tvv' ? !!a.tvv && a.tvv.trangThai !== 'bo' : khop(a) === che.khoa && a.status !== 'removed'));
    const cho = (d: Dong) => vuaLuu.has(d.a.id) || (che.loai === 'tvv' ? d.a.tvv!.trangThai === 'mo' : d.a.status === 'pending');
    const hanCua = (d: Dong) => (che.loai === 'tvv' ? d.a.tvv!.han : d.a.han) ?? '9999';
    const sap = (x: Dong, y: Dong) => Number(y.luot.studentId === chiEm) - Number(x.luot.studentId === chiEm) || hanCua(x).localeCompare(hanCua(y))
      || x.luot.studentName.localeCompare(y.luot.studentName, 'vi');
    return ds.filter(cho).sort(sap);
  }, [turns, che.loai, che.loai === 'gvcn' ? che.khoa : '', chiEm, vuaLuu]);   // eslint-disable-line react-hooks/exhaustive-deps
  const tvv = che.loai === 'tvv';
  if (!can.length) {
    return (
      <div role="status" className="grid justify-items-center gap-2.5 px-4 pb-6 pt-12 text-center">
        <span aria-hidden className="grid h-11 w-11 place-items-center rounded-full border text-xl font-bold text-ok bg-ok-bg border-ok-line">✓</span>
        <b className="text-[16px] font-bold text-[color:var(--text)]">{lop ? t('Xong việc này ở {lop}', { lop }) : t('Không còn em nào cần làm')}</b>
      </div>
    );
  }
  /* AUDIT-1611 B3-22: ≥ 2 em cùng việc chờ xác nhận → một lần "Xác nhận n em" (ngày hôm nay, MỘT nội dung chung); từng em vẫn Xác nhận / Sửa riêng ở dòng. */
  const choLo = tvv ? [] : can.filter((d) => d.a.status === 'pending' && !vuaLuu.has(d.a.id) && d.luot.canAct);
  const daLuuLo = (ids: number[]) => setVuaLuu((x) => new Set([...x, ...ids]));
  /* GVCN: hai cột Học viên · Cần làm (Nội dung ghi ngay trong form Xác nhận — mockup B1). TVV: Học viên · GVCN gửi · Báo PH (B2). */
  return (
    <AnHan.Provider value={anHan}>
    {choLo.length >= 2 && <LoXacNhan ds={choLo} onXong={(ids) => { daLuuLo(ids); invalidate('/classes'); invalidate('/students'); invalidate('/my-work'); onChanged(); }} />}
    <div role="table" className="text-sm" aria-label={tvv ? t('Báo PH · kết quả') : t('Cần làm')}>
      <div role="row" className={`${tvv ? HANG : HANG_GOP} h-10 items-center border-b text-[13px] font-semibold text-dim max-sm:hidden`} style={{ borderColor: 'var(--line)' }}>
        <span role="columnheader" className="pr-2.5">{t('Học viên')}</span>
        <span role="columnheader" className="px-2.5">{tvv ? t('GVCN gửi') : t('Cần làm')}</span>
        {tvv && <span role="columnheader" className="px-2.5">{t('Báo PH')}</span>}
        <span role="columnheader"><span className="sr-only">{t('Thao tác khác')}</span></span>
      </div>
      {can.map((d) => <DongPhoiHop key={d.a.id} d={d} tvv={tvv} gop={!tvv} noi={d.luot.studentId === chiEm} vua={vuaLuu.has(d.a.id)} onChanged={onChanged}
        onVua={(co) => setVuaLuu((x) => { const n = new Set(x); if (co) n.add(d.a.id); else n.delete(d.a.id); return n; })} />)}
    </div>
    </AnHan.Provider>
  );
}

/**
 * AUDIT-1611 B3-22: xác nhận nhiều em một lần — chọn em (mặc định tất cả), Ngày (hôm nay), Nội dung chung; gọi đường xác nhận sẵn có từng em.
 * Lô lỗi một phần: em lưu được rời danh sách, em lỗi giữ nguyên chọn + câu lỗi (chữ giữ).
 */
function LoXacNhan({ ds, onXong }: { ds: Dong[]; onXong: (ids: number[]) => void }) {
  const toast = useToast();
  const { homNay } = useNgayNghiepVu();
  const [mo, setMo] = useState(false);
  const [chon, setChon] = useState<ReadonlySet<number>>(() => new Set(ds.map((d) => d.a.id)));
  const [ngay, setNgay] = useState(homNay);
  const [nd, setNd] = useState('');
  const [busy, setBusy] = useState(false);
  const [loi, setLoi] = useState<string | null>(null);
  const dsChon = ds.filter((d) => chon.has(d.a.id));
  const toiThieu = Math.max(0, ...dsChon.map((d) => d.a.toiThieuGhiChu ?? (laMeetingCx(d.a.kind) ? 0 : 1)));
  const thieu = toiThieu > 0 && nd.trim().length < toiThieu;
  const luu = async () => {
    if (!dsChon.length || !ngay) return;
    if (thieu) { setLoi(toiThieu > 1 ? t('Nội dung ít nhất {n} ký tự.', { n: toiThieu }) : t('Ghi Nội dung: đã làm gì, em / gia đình phản hồi gì.')); return; }
    setBusy(true); setLoi(null);
    const xong: number[] = []; let hong = 0; let cau = '';
    for (const d of dsChon) {
      try { await api.post(`/phoi-hop-sos/${d.a.id}/confirm`, { performedOn: ngay, note: nd.trim() || undefined, updatedAt: d.a.updatedAt ?? null }); xong.push(d.a.id); }
      catch (e: any) { hong++; cau = e?.message ?? ''; }
    }
    setBusy(false);
    if (xong.length) { onXong(xong); toast.push('ok', t('Đã xác nhận {n} em', { n: xong.length })); }
    if (hong) setLoi(t('{n} em chưa lưu được — {cau}', { n: hong, cau })); else setMo(false);
    setChon(new Set([...chon].filter((id) => !xong.includes(id))));
  };
  if (!mo) {
    return (
      <div className="mb-2 flex justify-end">
        <button type="button" className="btn btn-sm min-h-[44px] sm:min-h-0" aria-expanded={false} onClick={() => setMo(true)}>{t('Xác nhận {n} em ▾', { n: ds.length })}</button>
      </div>
    );
  }
  return (
    <div className="mb-3 grid gap-2.5 rounded-[10px] border p-3 text-sm" style={{ borderColor: 'var(--line-strong)', background: 'var(--surface-2)' }}>
      <div className="flex flex-wrap gap-1.5" role="group" aria-label={t('Học viên')}>
        {ds.map((d) => (
          <NutChon key={d.a.id} nho chon={chon.has(d.a.id)} onClick={() => setChon((x) => { const n = new Set(x); if (n.has(d.a.id)) n.delete(d.a.id); else n.add(d.a.id); return n; })}>
            {d.luot.studentName}
          </NutChon>
        ))}
      </div>
      <span className="flex flex-wrap items-center gap-x-3 gap-y-2"><span className="font-bold">{t('Ngày')} <span className="text-late">*</span></span>
        <span className="block w-[11.5rem]"><ONgay kieu="ngay" value={ngay} onChange={setNgay} toiDa={homNay} ariaLabel={t('Ngày')} /></span></span>
      <label className="grid gap-1.5 font-bold">
        <span>{t('Nội dung chung')}{toiThieu > 0 && <span className="text-late"> *</span>}</span>
        <textarea className="field min-h-[60px] w-full font-normal" rows={2} value={nd} onChange={(e) => { setNd(e.target.value); setLoi(null); }} aria-invalid={!!loi} />
      </label>
      {loi && <p role="alert" className="m-0 text-[13px] text-bad">{loi}</p>}
      <span className="flex flex-wrap justify-end gap-2">
        <button type="button" className="btn btn-sm min-h-[44px] sm:min-h-0" disabled={busy} onClick={() => setMo(false)}>{t('Đóng')}</button>
        <button type="button" className="btn btn-primary btn-sm min-h-[44px] sm:min-h-0" disabled={busy || !dsChon.length} onClick={() => void luu()}>
          {busy ? t('Đang lưu…') : t('Xác nhận {n} em', { n: dsChon.length })}</button>
      </span>
    </div>
  );
}

/* Lưới 4 cột ① ② ③ ⋯ (mockup `.pht`) — div lưới (danh sách việc có form tại dòng, không phải bảng số liệu). 375: xếp dọc. */
const HANG = 'grid grid-cols-[32%_23%_minmax(0,1fr)_92px] max-sm:grid-cols-[minmax(0,1fr)_auto]';
/** YT-b: panel Công việc vai GVCN — Học viên · Cần làm (Kết quả gộp vào ô Cần làm) · ⋯. */
const HANG_GOP = 'grid grid-cols-[minmax(0,1fr)_240px_92px] max-sm:grid-cols-[minmax(0,1fr)_auto]';
const O = 'min-w-0 px-2.5 py-2.5 max-sm:col-span-2 max-sm:px-0 max-sm:py-1';

/**
 * Hạn — luật hạn NHẸ HƠN (chủ SP 22/11): dd/mm/yyyy tô theo `mucHan` (chữ phụ · vàng còn ≤ 2 ngày · đỏ + nền đỏ nhạt quá hạn, không ⚠).
 * `soNgay`: dòng việc panel Công việc thêm "quá hạn n ngày"; hồ sơ HV / lớp chỉ tô màu ngày.
 */
function HanEm({ han, soNgay = true }: { han: string; soNgay?: boolean }) {
  const { homNay } = useNgayNghiepVu();
  if (!homNay) return null;
  const muc = mucHan(han, homNay);
  return (
    <span className={`mt-1 block whitespace-nowrap text-[13px] tabular-nums ${LOP_MUC_HAN[muc]}`}>
      {muc === 'qua' && <DauQuaHan />}{ngayHien(han)}
    </span>
  );
}

/** Trạng thái chung một việc (panel Công việc + hồ sơ): form đang mở, Hoàn tác, Đưa lại. */
function useViec(a: CoordAction, onVua: (co: boolean) => void, onChanged: () => void) {
  const toast = useToast();
  const [mo, setMo] = useState<null | 'xac-nhan' | 'ghi' | 'bo' | 'han'>(null);
  const [du, setDu] = useState(false);
  const doi = () => { invalidate('/classes'); invalidate('/students'); invalidate('/my-work'); onChanged(); };
  const moLai = async () => {
    try { await api.post(`/phoi-hop-sos/${a.id}/mo-lai`); onVua(false); doi(); } catch (e: any) { toast.push('error', e.message); }
  };
  /* Rà PTA (1–2): Hoàn tác (= Đưa lại) chỉ khi lần lưu chuyển Cần xử lý → Xong; Sửa việc đã xong / TVV ghi kết quả: chỉ báo Đã lưu. */
  const daLuu = (truoc: string, laGhiTvv: boolean) => {
    setMo(null); onVua(true); doi();
    if (hoanTacXacNhanDuoc(truoc, laGhiTvv)) toast.hoanTac(t('Đã lưu'), () => void moLai(), { key: `phoi-hop:${a.id}`, ms: HOAN_TAC_PHOI_HOP_MS });
    else toast.push('ok', t('Đã lưu'));
  };
  const luuHan = async (h: string | null, hanCu: string | null) => { await api.post(`/phoi-hop-sos/${a.id}/han`, { han: h, hanCu }); toast.push('ok', t('Đã lưu hạn')); setMo(null); doi(); };
  return { mo, setMo, du, setDu, doi, moLai, daLuu, luuHan };
}

function DongPhoiHop({ d, tvv, noi, vua, onVua, onChanged, gop = false }: {
  d: Dong; tvv: boolean; noi: boolean; vua: boolean; onVua: (co: boolean) => void; onChanged: () => void;
  /** YT-b: ô Kết quả nằm trong ô Cần làm (panel Công việc vai GVCN). */
  gop?: boolean;
}) {
  const { luot, a } = d;
  const anHan = useContext(AnHan);
  const lam = a.lamDuoc ?? luot.canAct;   // GV-2: cờ theo từng việc (người được giao)
  const { mo, setMo, du, setDu, doi, moLai, daLuu, luuHan } = useViec(a, onVua, onChanged);
  const { homNay } = useNgayNghiepVu();
  const cho = tvv ? a.tvv!.trangThai === 'mo' : a.status === 'pending';
  const han = tvv ? (cho ? a.tvv!.han : null) : cho ? a.han : null;
  const nen = vua ? 'bg-[rgb(var(--ok-bg-rgb)/0.7)]' : mo === 'xac-nhan' || mo === 'ghi' ? 'bg-[color:var(--accent-soft)]' : noi ? 'shadow-[inset_3px_0_0_var(--accent)]' : '';
  const ngoiLam = a.performerName ?? null;
  return (
    <div role="row" className={`${gop ? HANG_GOP : HANG} border-b ${nen}`} style={{ borderColor: 'var(--line)' }}>
      <span role="cell" className="min-w-0 py-2.5 pr-2.5 max-sm:pb-1">
        <span className="flex flex-wrap items-center gap-2">
          <Link to={`/hoc-vien/${luot.studentId}?tab=y-thuc&sub=phoi-hop`} className="text-[14px] font-semibold text-[color:var(--text)] no-underline hover:text-[color:var(--accent)] hover:underline max-sm:inline-flex max-sm:min-h-[44px] max-sm:items-center">{luot.studentName}</Link>
          {luot.sosLevel !== null && <ChipSos muc={luot.sosLevel} kyNang={luot.kyNangNgan} hienKyNang={false} dot={`MT${luot.attemptNo}`} ten={luot.studentName} tinh />}
        </span>
        <DiemMotDong th={luot.the} />
        {han && <HanEm han={han} />}
      </span>
      {mo === 'xac-nhan' ? (
        <span role="cell" className={`${O} ${gop ? 'col-span-2' : 'col-span-3'} max-sm:col-span-2`}><FormXacNhan a={a} onDong={() => setMo(null)} onLuu={() => daLuu(a.status, false)} onTaiLai={doi} /></span>
      ) : (
        <>
          <span role="cell" className={`${O} max-sm:order-3`}>
            {a.status === 'removed' && !tvv ? (
              <span className="grid justify-items-start gap-0.5 text-[13px] text-dim"><span className="font-semibold">{t('Đã bỏ')}</span>{a.removeReasonLabel && <span>{a.removeReasonLabel}</span>}</span>
            ) : tvv || a.status === 'done' ? (
              <span className="grid justify-items-start gap-0.5">
                <span className="whitespace-nowrap text-sm font-semibold tabular-nums text-ok">✓ {a.performedOn ? ngayHien(a.performedOn) : ''}{vua && !tvv ? ` · ${t('Bạn')}` : ''}</span>
                {ngoiLam && <span className="text-[13px] text-dim">{ngoiLam}</span>}
                {/* Rà 25/11 (việc 6): ghi chú ≤ 500 — 2 dòng, mở đủ theo "Xem đủ" của dòng; Meeting CX (ô kết quả hiện phần TVV, không hiện ghi chú này) có nút riêng. */}
                {tvv && a.note && <span className={`${du ? '' : 'line-clamp-2'} text-[13px] text-dim`}>{a.note}</span>}
                {tvv && a.note && a.note.length > 90 && laMeetingCx(a.kind) && a.tvv && (
                  <button type="button" className="link appearance-none border-0 bg-transparent p-0 text-[13px] font-semibold" aria-expanded={du} onClick={() => setDu((x) => !x)}>{du ? t('Thu gọn') : t('Xem đủ')}</button>
                )}
                {!tvv && lam && <button type="button" className="link min-h-[44px] appearance-none border-0 bg-transparent p-0 text-[13px] font-semibold sm:min-h-0" onClick={() => setMo('xac-nhan')}>{t('Sửa')}</button>}
              </span>
            ) : lam ? (
              <button type="button" className={`btn btn-primary btn-sm min-h-[44px] max-sm:w-full sm:min-h-[30px] ${gop ? 'w-full justify-center' : ''}`} onClick={() => setMo('xac-nhan')}>{t('Xác nhận')}</button>
            ) : <span className="text-[13px] text-dim">{t('Chờ GVCN')}</span>}
            {gop && <span className="mt-1.5 block empty:hidden"><OKetQua a={a} tvv={false} du={du} onDu={() => setDu((v) => !v)} onGhi={() => setMo('ghi')} /></span>}
          </span>
          {mo === 'ghi' ? (
            <span role="cell" className={`${O} col-span-2 max-sm:order-4`}><FormTvv a={a} onDong={() => setMo(null)} onLuu={() => daLuu(a.status, true)} /></span>
          ) : (
            <>
              {!gop && <span role="cell" className={`${O} max-sm:order-4`}><OKetQua a={a} tvv={tvv} du={du} onDu={() => setDu((v) => !v)} onGhi={() => setMo('ghi')} /></span>}
              <span role="cell" className="relative py-2.5 text-right max-sm:col-start-2 max-sm:row-start-1 max-sm:pb-1">
                <Menu3 a={a} tvv={tvv} canAct={lam} onBo={() => setMo('bo')} onMoLai={() => void moLai()}
                  onHan={a.status === 'pending' && a.hanMacDinh && lam && !anHan ? () => setMo('han') : undefined} />
              </span>
            </>
          )}
        </>
      )}
      {mo === 'han' && a.han && a.hanMacDinh && (
        <span role="cell" className="col-span-full pb-3">
          <DongHan gon han={a.han} hanMacDinh={a.hanMacDinh} hanChon={a.hanChon ?? null} suaDuoc onTaiLai={doi}
            onLuu={luuHan} />
        </span>
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
function OKetQua({ a, tvv, du, onDu, onGhi, anHan = false }: { a: CoordAction; tvv: boolean; du: boolean; onDu: () => void; onGhi: () => void;
  /** Hồ sơ: hạn Báo PH đã ở cột hạn, nút Ghi kết quả / Sửa ở cột nút của dòng. */ anHan?: boolean }) {
  const { homNay } = useNgayNghiepVu();
  const v = a.tvv;
  const chu = (s: string | null) => s ? (
    <>
      <p className={`m-0 text-sm leading-normal text-[color:var(--text)] ${du ? '' : 'line-clamp-2'}`}>{s}</p>
      {s.length > 90 && <button type="button" className="link mt-1 appearance-none border-0 bg-transparent p-0 text-[13px] font-semibold" aria-expanded={du} onClick={onDu}>{du ? t('Thu gọn') : t('Xem đủ')}</button>}
    </>
  ) : null;
  /* Rà PTA (3): Meeting xác nhận trước PR không có việc TVV — hiện ghi chú GVCN như việc khác. */
  if (laMeetingCx(a.kind) && (tvv || a.status === 'done') && v) {
    const ten = v.tvv ? t('TVV {ten}', { ten: v.tvv }) : t('GVCN');
    return (
      <span className="grid justify-items-start gap-1">
        {v.trangThai === 'xong' ? <Nhan tone="ok">{t('Đã báo PH')}{v.lan ? ` · ${ngayHien(v.lan.ngay)}` : ''}</Nhan>
          : v.lan ? <Nhan tone="soon">{t('Chưa liên hệ được · lần {n}', { n: v.soLan })}</Nhan>
          : <Nhan tone="doing">{v.coTheGhi ? t('Chờ bạn báo PH') : v.tvv ? t('Chờ {ten}', { ten }) : t('Chưa có TVV — GVCN báo')}</Nhan>}
        {v.trangThai === 'mo' && !anHan && <HanEm han={v.han} />}
        {chu(v.lan?.ghiChu ?? null)}
        {!anHan && v.coTheGhi && v.trangThai === 'mo' && <button type="button" className="btn btn-primary btn-sm mt-1 min-h-[44px] sm:min-h-[30px]" onClick={onGhi}>{t('Ghi kết quả')}</button>}
        {!anHan && v.coTheGhi && v.trangThai === 'xong' && <button type="button" className="link appearance-none border-0 bg-transparent p-0 text-[13px] font-semibold" onClick={onGhi}>{t('Sửa')}</button>}
      </span>
    );
  }
  if (a.status !== 'done') return null;
  if (!a.note) return <span className="text-[13px] text-faint">{t('Chưa ghi kết quả')}</span>;
  return <span className="block">{chu(a.note)}</span>;
}

/** ⋯ — việc ít dùng: Bỏ việc… · Đưa lại Cần xử lý (việc đã làm). TVV: Bỏ việc… của việc báo PH. */
function Menu3({ a, tvv, canAct, onBo, onMoLai, onHan }: {
  a: CoordAction; tvv: boolean; canAct: boolean; onBo: () => void; onMoLai: () => void; onHan?: () => void;
}) {
  /* Khôi phục: chỉ việc NGƯỜI DÙNG bỏ (việc hệ thống bỏ theo điểm không khôi phục tay). */
  const khoiPhuc = a.status === 'removed' && (COORDINATION_USER_REMOVE_REASONS as readonly string[]).includes(a.removeReasonCode ?? '');
  const muc: [string, () => void][] = tvv
    ? (a.tvv?.coTheGhi && a.tvv.trangThai === 'mo' ? [[t('Bỏ việc…'), onBo]] : [])
    : !canAct ? [] : a.status === 'done' ? [[t('Đưa lại Cần xử lý'), onMoLai], [t('Bỏ việc…'), onBo]]
    : a.status === 'removed' ? (khoiPhuc ? [[t('Khôi phục'), onMoLai]] : [])
    : [...(onHan ? [[t('Sửa hạn…'), onHan] as [string, () => void]] : []), [t('Bỏ việc…'), onBo]];
  /* GD-4c: một menu thả = MenuDong (trước: role="menu" tự viết, không phím ↑ ↓ / Esc). */
  return <MenuDong lopNut="btn btn-sm min-h-[44px] min-w-[44px] sm:min-h-[30px] sm:min-w-[30px]" muc={muc.map(([nhan, f]) => ({ key: nhan, nhan, onChon: f }))} />;
}

/** Xác nhận tại dòng (GVCN / QL): Ngày + MỘT ô Nội dung (bắt buộc; Meeting CX: "Nội dung gửi TVV" tuỳ chọn) · + Tệp · Người thực hiện. Sửa: điền sẵn. */
function FormXacNhan({ a, onDong, onLuu, onTaiLai }: { a: CoordAction; onDong: () => void; onLuu: () => void; onTaiLai: () => void }) {
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
  /* CAU-HINH-CASE-SOS: số ký tự tối thiểu máy chủ gửi theo bản chụp của việc (bản gốc: việc GVCN 1, Meeting CX 0 — gửi TVV tuỳ chọn). */
  const toiThieu = a.toiThieuGhiChu ?? (meeting ? 0 : 1);
  const loi = toiThieu > 0 && nd.trim().length < toiThieu
    ? (toiThieu > 1 ? t('Nội dung ít nhất {n} ký tự.', { n: toiThieu }) : t('Ghi Nội dung: đã làm gì, em / gia đình phản hồi gì.')) : null;
  const luu = async () => {
    setDaBam(true);
    if (loi || !ngay) return;
    setBusy(true);
    try {
      await api.post(`/phoi-hop-sos/${a.id}/confirm`, { performedOn: ngay, note: nd.trim() || undefined, updatedAt: a.updatedAt ?? null, performerName: !nguoi || nguoi.kieu === 'toi' ? undefined : nguoi.ten.trim() });
      onLuu();
    } catch (e: any) {
      toast.push('error', e.message);
      if (e?.status === 409) onTaiLai();   // L3-web: người khác vừa lưu — tải bản mới, form (chữ đang gõ) giữ nguyên, bấm lại là lưu trên bản mới
    } finally { setBusy(false); }
  };
  const idLoi = `xn-loi-${a.id}`;
  return (
    <div className="grid gap-2.5 text-left">
      <span className="flex flex-wrap items-center gap-x-3 gap-y-2"><span className="text-sm font-bold">{t('Ngày')} <span className="text-late">*</span></span>
        <span className="block w-[11.5rem]"><ONgay kieu="ngay" value={ngay} onChange={setNgay} toiDa={homNay} ariaLabel={t('Ngày')} /></span></span>
      <label className="grid gap-1.5 text-sm font-bold">
        <span>{toiThieu > 0 ? <>{t('Nội dung')} <span className="text-late">*</span></>
          : <>{meeting ? t('Nội dung gửi TVV') : t('Nội dung')} <span className="font-normal text-faint">{t('tuỳ chọn')}</span></>}</span>
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
  const toiThieu = v.toiThieu ?? GHI_CHU_MEETING_TOI_THIEU;   // CAU-HINH-CASE-SOS: bước TVV của bản chụp
  const loi = kq === 'da_bao' && nd.trim().length < toiThieu ? t('Nội dung ít nhất {n} ký tự.', { n: toiThieu }) : null;
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

/**
 * TAB PHỐI HỢP SOS hồ sơ lớp (`cot1="hocVien"`) / hồ sơ HV (`cot1="luot"`) — NHẸ HƠN PR-6 (v23 ⑧ Y1, Y3): mỗi lượt một dải đầu `.luot-dau` (em / lượt · SOS ·
 * một dòng điểm · x/y xong · + Thêm việc · Học thuật ›), dưới là các việc `.ph-dong`: tên + dòng phụ · THANH CHẤM (cùng thành phần thang) · hạn · một nút.
 * Meeting CX/GĐCN (N58): "GVCN xác nhận" rồi ba phần ĐỘC LẬP Xếp lịch (BPXL) · Kết quả (CX) · Báo PH (TVV); việc chỉ của GVCN một chấm.
 * Người có việc làm tại chỗ (GVCN / QL: Xác nhận; TVV: Ghi kết quả). Dữ liệu = request sẵn có của tab (ba phần Meeting nạp theo lô ở máy chủ).
 */
export function BangPhoiHopHoSo({ turns, cot1, onChanged, onGoAcademic, khongMo, phamVi, tieuDe }: {
  turns: CoordTurn[]; cot1: 'hocVien' | 'luot'; onChanged: () => void; onGoAcademic?: () => void;
  /** Chữ phạm vi ("mọi lượt") gắn vào dải đầu của lượt đầu tiên — không đứng riêng một hàng (PTA rà #2000). */
  phamVi?: string;
  /** GV-CU-BO-TRO [XM-2]: em người xem không mở được hồ sơ (người dạy bổ trợ chỉ xem lớp) — tên chữ thường. */
  khongMo?: ReadonlySet<number>;
  /** HV-YT-BO-TAB-CON (mockup v23 Y1): đầu khối "Phối hợp SOS · n việc" + "+ Thêm việc" (của lượt đầu) — thay tab con. */
  tieuDe?: string;
}) {
  const [vuaLuu, setVuaLuu] = useState<ReadonlySet<number>>(new Set());
  const [themDau, setThemDau] = useState(false);
  if (!turns.length) return <p className="m-0 px-4 py-8 text-center text-sm font-semibold text-[color:var(--text)]">{t('Không còn việc phối hợp nào')}</p>;
  /* Lượt chưa xong lên trước (lớp: rồi theo tên em; HV: máy chủ đã xếp mới nhất trước). */
  const ds = [...turns].sort((a, b) => Number(a.summary.complete) - Number(b.summary.complete));
  const vua = (id: number) => (co: boolean) => setVuaLuu((x) => { const n = new Set(x); if (co) n.add(id); else n.delete(id); return n; });
  const themDuoc = (l: CoordTurn) => l.canAct && !l.nhanDot;
  const dau = tieuDe !== undefined && themDuoc(ds[0]!);
  return (
    <div className="text-sm [container-type:inline-size]" aria-label={tieuDe ?? t('Phối hợp SOS')}>
      {tieuDe !== undefined && (
        <div className="flex min-h-12 flex-wrap items-center gap-x-2.5 gap-y-1 border-b py-1.5 pl-4 pr-2 max-sm:pl-3" style={{ borderColor: 'var(--line)' }}>
          <h3 className="m-0 text-[14px] font-bold text-[color:var(--text)]">{tieuDe}</h3>
          <span className="text-[13px] tabular-nums text-dim">{t('{n} việc', { n: ds.reduce((n, l) => n + l.summary.active, 0) })}</span>
          {dau && !themDau && <button type="button" className="btn btn-sm ml-auto min-h-[44px] sm:min-h-[32px]" onClick={() => setThemDau(true)}>{t('+ Thêm việc')}</button>}
        </div>
      )}
      {ds.map((luot, i) => <KhoiLuot key={luot.attemptId} luot={luot} cot1={cot1} vuaLuu={vuaLuu} vua={vua} onChanged={onChanged} onGoAcademic={onGoAcademic} khongMo={khongMo} phamVi={i === 0 ? phamVi : undefined}
        themNgoai={i === 0 && dau ? { mo: themDau, dat: setThemDau } : undefined} />)}
    </div>
  );
}

const LINK_NHO = 'link inline-flex min-h-[44px] appearance-none items-center border-0 bg-transparent p-0 text-[13px] font-semibold sm:min-h-0';

function KhoiLuot({ luot, cot1, vuaLuu, vua, onChanged, onGoAcademic, khongMo, phamVi, themNgoai }: {
  luot: CoordTurn; cot1: 'hocVien' | 'luot'; vuaLuu: ReadonlySet<number>; vua: (id: number) => (co: boolean) => void; onChanged: () => void; onGoAcademic?: () => void;
  khongMo?: ReadonlySet<number>; phamVi?: string;
  /** "+ Thêm việc" đặt ở đầu khối (không ở dải lượt) — trạng thái mở form do khối giữ. */
  themNgoai?: { mo: boolean; dat: (v: boolean) => void };
}) {
  /* Lượt đã xong (hồ sơ HV) gập một dòng, "Xem việc ▸" mở tại chỗ. */
  const [mo, setMo] = useState(!(cot1 === 'luot' && luot.summary.complete));
  const [themTrong, setThemTrong] = useState(false);
  const them = themNgoai ? themNgoai.mo : themTrong;
  const setThem = themNgoai ? themNgoai.dat : setThemTrong;
  const xong = luot.summary.complete;
  const TEN = 'text-sm font-bold text-[color:var(--text)] no-underline';
  return (
    <section className="border-b" style={{ borderColor: 'var(--line)' }} aria-label={cot1 === 'hocVien' ? luot.studentName : luot.nhanDot ?? `MT${luot.attemptNo}`}>
      <div className="flex min-h-11 flex-wrap items-center gap-x-2.5 gap-y-1 border-b px-4 py-1.5 max-sm:px-3" style={{ background: 'var(--surface-2)', borderColor: 'var(--line)' }}>
        {luot.sosLevel !== null && <ChipSos muc={luot.sosLevel} kyNang={luot.kyNangNgan} hienKyNang={false} dot={`MT${luot.attemptNo}`} ten={luot.studentName} tinh />}
        {cot1 === 'hocVien'
          ? khongMo?.has(luot.studentId) ? <span className={TEN}>{luot.studentName}</span> : <Link to={`/hoc-vien/${luot.studentId}?tab=y-thuc&sub=phoi-hop`} className={`${TEN} hover:text-[color:var(--accent)] hover:underline max-sm:inline-flex max-sm:min-h-[44px] max-sm:items-center`}>{luot.studentName}</Link>
          : <b className={`text-sm font-bold ${xong ? 'text-dim' : 'text-[color:var(--text)]'}`}>{luot.nhanDot ?? `MT${luot.attemptNo}`}</b>}
        <DiemMotDong th={luot.the} anLuot={cot1 === 'luot'} />
        <Nhan tone={xong ? 'ok' : 'doing'}>{t('{label} việc xong', { label: luot.summary.label })}</Nhan>
        <span className="ml-auto flex flex-wrap items-center gap-x-3 gap-y-1">
          {phamVi && <span className="text-[13px] text-dim">{phamVi}</span>}
          {!mo && <button type="button" className={LINK_NHO} aria-expanded={false} onClick={() => setMo(true)}>{t('Xem việc ▸')}</button>}
          {!themNgoai && luot.canAct && !luot.nhanDot && !them && <button type="button" className={LINK_NHO} onClick={() => setThem(true)}>{t('+ Thêm việc')}</button>}
          {onGoAcademic && <button type="button" className={LINK_NHO} onClick={onGoAcademic}>{t('Học thuật ›')}</button>}
        </span>
      </div>
      {mo && luot.actions.map((a) => (
        <DongViecHoSo key={a.id} luot={luot} a={a} vua={vuaLuu.has(a.id)} onVua={vua(a.id)} onChanged={onChanged} />
      ))}
      {them && <div className="px-4 py-2 max-sm:px-3"><AddCoordinationForm attemptId={luot.attemptId} existing={luot.actions.map((a) => a.kind)} onClose={() => setThem(false)} onChanged={onChanged} /></div>}
    </section>
  );
}

/** "2026-11-26 17:30" → "26/11/2026 17:30" (giờ tuỳ chọn, N58). */
const ngayGio = (s: string) => `${ngayHien(s.slice(0, 10))}${s.length > 10 ? ` ${s.slice(11, 16)}` : ''}`;
const DAM = 'font-semibold text-[color:var(--text)]';
const daBo = (a: CoordAction) => <>{t('Đã bỏ')}{a.removeReasonLabel ? ` · ${a.removeReasonLabel}` : ''}</>;

/** Thanh chấm + dòng phụ của một việc (N58). Thuần theo dữ liệu đã nạp — không câu thêm. */
function tienDoViec(a: CoordAction): { o: ONut[]; aria: string; doc: boolean; phu: ReactNode[]; phuNgan?: string } {
  const xn = a.status === 'done';
  const ngayXn = a.performedOn ? ngayHien(a.performedOn) : null;
  const gvcn: ONut = {
    key: 'gvcn', ten: t('GVCN xác nhận'), tenNgan: t('GVCN'), duoi: xn ? ngayXn : a.status === 'removed' ? t('Đã bỏ') : null,
    title: xn ? `${t('GVCN xác nhận')} · ${ngayXn ?? ''}${a.performerName ? ` · ${a.performerName}` : ''}` : t('GVCN xác nhận'),
    tt: xn ? 'qua' : a.status === 'removed' ? 'sau' : 'ke',
  };
  if (!laMeetingCx(a.kind)) {
    const phu: ReactNode[] = xn ? [<>{t('GVCN')} {a.performerName && <b className={DAM}>{a.performerName}</b>} · <b className={DAM}>{ngayXn}</b></>]
      : a.status === 'removed' ? [daBo(a)] : [t('GVCN · chưa xác nhận')];
    return { o: [{ ...gvcn, tenNgan: undefined }], aria: gvcn.title ?? '', doc: false, phu };   // một chấm: ô đủ rộng cho tên đủ
  }
  const m = a.meeting;
  const v = a.tvv;
  const phan = (key: string, ten: string, p: PhanMeetingTom | null | undefined, vaiMd: string): ONut => {
    const xong = p?.trangThai === 'xong';
    const vai = p?.vai ?? vaiMd;
    return {
      key, ten, duoi: vai, tt: !xn ? 'sau' : xong ? 'qua' : p?.trangThai === 'bo' ? 'sau' : 'cho',
      title: `${ten} · ${vai}${p?.nguoi ? ` ${p.nguoi}` : ''}${xong && p?.xongLuc ? ` · ${ngayHien(p.xongLuc.slice(0, 10))}` : ''}`,
    };
  };
  const baoPh: ONut = {
    key: 'bao-ph', ten: t('Báo PH'), duoi: v && !v.tvv ? t('GVCN') : t('TVV'),
    tt: !xn ? 'sau' : v?.trangThai === 'xong' ? 'qua' : v?.trangThai === 'bo' ? 'sau' : 'cho',
    title: `${t('Báo PH')} · ${v?.tvv ? `${t('TVV')} ${v.tvv}` : v ? t('GVCN') : t('TVV')}`,
  };
  const o = [gvcn, phan('xep', t('Xếp lịch'), m?.xepLich, t('BPXL')), phan('kq', t('Kết quả'), m?.ketQua, 'CX'), baoPh];
  const phu: ReactNode[] = [];
  if (!xn) phu.push(a.status === 'removed' ? daBo(a) : t('GVCN · chưa xác nhận'));
  else {
    const x = m?.xepLich;
    phu.push(<>{t('GVCN xác nhận')} <b className={DAM}>{ngayXn}</b>{x?.trangThai === 'xong' && <> · {x.vai} {x.nguoi && <b className={DAM}>{x.nguoi}</b>} {t('đã xếp lịch')}{x.ngayGio && <> <b className={DAM}>{ngayGio(x.ngayGio)}</b></>}</>}</>);
    const cho: ReactNode[] = [];
    for (const p of [m?.xepLich, m?.ketQua]) if (p && p.trangThai === 'mo') cho.push(<>{p.vai} {p.nguoi && <b className={DAM}>{p.nguoi}</b>}</>);
    if (v?.trangThai === 'mo') cho.push(v.tvv ? <>{t('TVV')} <b className={DAM}>{v.tvv}</b></> : t('GVCN'));
    if (cho.length) phu.push(<>{t('Chờ:')} {cho.map((c, i) => <span key={i}>{i > 0 && ' · '}{c}</span>)}</>);
  }
  const ten = (tt: ONut['tt']) => o.filter((x) => x.tt === tt).map((x) => x.ten).join(', ') || '—';
  /* 375 (Y3): một dòng gọn "BPXL đã xếp lịch · chờ CX, TVV" — tên người / giờ họp ở bản rộng và trong `title` từng chấm. */
  const vaiCho = o.filter((x) => x.tt === 'cho').map((x) => String(x.duoi));
  const phuNgan = xn ? [m?.xepLich?.trangThai === 'xong' ? `${m.xepLich.vai} ${t('đã xếp lịch')}` : null, vaiCho.length ? t('chờ {ds}', { ds: vaiCho.join(', ') }) : null].filter(Boolean).join(' · ') || undefined : undefined;
  return { o, doc: true, phu, phuNgan, aria: t('Tiến độ: đã xong {a}; chờ {b}', { a: ten('qua'), b: ten('cho') }) };
}

/** MỘT việc ở hồ sơ (v23 `.ph-dong`; khối < 760 px — 375 — xếp tên + hạn / thanh chấm / nút thành ba hàng, Y3): tên + dòng phụ + kết quả · thanh chấm · hạn · nút (Xác nhận / Sửa) + ⋯. Form mở tại dòng, cả hàng. */
function DongViecHoSo({ luot, a, vua, onVua, onChanged }: { luot: CoordTurn; a: CoordAction; vua: boolean; onVua: (co: boolean) => void; onChanged: () => void }) {
  const lam = a.lamDuoc ?? luot.canAct;   // GV-2: cờ theo từng việc (người được giao)
  const { mo, setMo, du, setDu, doi, moLai, daLuu, luuHan } = useViec(a, onVua, onChanged);
  /* Meeting đã xác nhận: hạn của phần Báo PH còn mở (phần TVV) ở cột hạn, như khung Y1. */
  const han = a.status === 'pending' ? a.han ?? null : a.tvv?.trangThai === 'mo' ? a.tvv.han : null;
  const td = tienDoViec(a);
  const boDi = a.status === 'removed';
  const ghiTvv = a.status === 'done' && !!a.tvv?.coTheGhi && (a.tvv.trangThai === 'mo' || a.tvv.trangThai === 'xong');
  const nen = vua ? 'bg-[rgb(var(--ok-bg-rgb)/0.7)]' : mo === 'xac-nhan' || mo === 'ghi' ? 'bg-[color:var(--accent-soft)]' : '';
  return (
    <div className={`grid min-h-16 grid-cols-[minmax(0,1fr)_minmax(0,1fr)_112px_auto] items-center gap-x-4 gap-y-2 border-t px-4 py-2.5 first:border-t-0 [@container(max-width:760px)]:grid-cols-[minmax(0,1fr)_auto] [@container(max-width:760px)]:px-3 ${nen}`}
      style={{ borderColor: 'var(--line)' }}>
      <span className={`min-w-0 ${boDi ? 'text-dim' : ''}`}>
        <span className={`block text-sm font-semibold ${boDi ? 'line-through' : 'text-[color:var(--text)]'}`}>{a.name}</span>
        {td.phu.map((p, i) => <span key={i} className={`block text-[13px] leading-snug text-dim ${td.phuNgan ? '[@container(max-width:760px)]:hidden' : ''}`}>{p}</span>)}
        {td.phuNgan && <span className="hidden text-[13px] leading-snug text-dim [@container(max-width:760px)]:block">{td.phuNgan}</span>}
        {a.noiDung && a.noiDung.length > 0 && (
          <details className="mt-1">
            <summary className="cursor-pointer text-[13px] text-dim">{a.status === 'done' ? t('Nội dung đã báo TVV') : t('Nội dung gửi TVV')} ({a.noiDung.length})</summary>
            <ol className="m-0 mt-1 space-y-1 pl-4 text-[13px] text-dim">{a.noiDung.map((x, i) => <li key={i}>{x}</li>)}</ol>
          </details>
        )}
        {a.status === 'done' && mo !== 'ghi' && <span className="mt-1 block empty:hidden"><OKetQua a={a} tvv={false} du={du} onDu={() => setDu((x) => !x)} onGhi={() => setMo('ghi')} anHan /></span>}
      </span>
      <ThanhBuoc o={td.o} aria={td.aria} doc={td.doc} className={`${td.o.length === 1 ? 'max-w-[100px]' : ''} [@container(max-width:760px)]:col-span-full [@container(max-width:760px)]:row-start-2`} />
      <span className={`[@container(max-width:760px)]:col-start-2 [@container(max-width:760px)]:row-start-1 [@container(max-width:760px)]:self-start [@container(max-width:760px)]:text-right`}>
        {han ? <HanEm han={han} soNgay={false} /> : a.status === 'pending' && <span className="text-[13px] text-faint">{t('không hạn')}</span>}
      </span>
      <span className={`flex flex-nowrap items-center justify-end gap-1.5 [@container(max-width:760px)]:col-span-full [@container(max-width:760px)]:row-start-3 [@container(max-width:760px)]:[&>.btn-primary]:flex-1 [@container(max-width:760px)]:[&>.btn-primary]:justify-center`}>
        {/* PTA rà #2000: nút TVV của Meeting đứng ở cột nút (nút chính trước), thẳng hàng "Xác nhận" các dòng trên. */}
        {ghiTvv && mo !== 'ghi' && <button type="button" className={`btn btn-sm min-h-[44px] sm:min-h-[32px] ${a.tvv!.trangThai === 'mo' ? 'btn-primary min-w-[96px]' : ''}`} onClick={() => setMo('ghi')}>{a.tvv!.trangThai === 'mo' ? t('Ghi kết quả') : t('Sửa kết quả')}</button>}
        {a.status === 'pending' && lam && mo !== 'xac-nhan' && <button type="button" className="btn btn-primary btn-sm min-h-[44px] min-w-[96px] sm:min-h-[32px]" onClick={() => setMo('xac-nhan')}>{t('Xác nhận')}</button>}
        {a.status === 'pending' && lam === false && <span className="text-[13px] text-dim">{t('Chờ GVCN')}</span>}
        {a.status === 'done' && lam && mo !== 'xac-nhan' && <button type="button" className="btn btn-sm min-h-[44px] sm:min-h-[32px]" onClick={() => setMo('xac-nhan')}>{t('Sửa')}</button>}
        <Menu3 a={a} tvv={false} canAct={lam} onBo={() => setMo('bo')} onMoLai={() => void moLai()}
          onHan={a.status === 'pending' && a.hanMacDinh && lam ? () => setMo('han') : undefined} />
      </span>
      {mo === 'xac-nhan' && <span className="col-span-full"><FormXacNhan a={a} onDong={() => setMo(null)} onLuu={() => daLuu(a.status, false)} onTaiLai={doi} /></span>}
      {mo === 'ghi' && <span className="col-span-full"><FormTvv a={a} onDong={() => setMo(null)} onLuu={() => daLuu(a.status, true)} /></span>}
      {mo === 'han' && a.han && a.hanMacDinh && (
        <span className="col-span-full pb-1"><DongHan gon han={a.han} hanMacDinh={a.hanMacDinh} hanChon={a.hanChon ?? null} suaDuoc onTaiLai={doi} onLuu={luuHan} /></span>
      )}
      {mo === 'bo' && <span className="col-span-full pb-1"><FormBo id={a.id} tvv={null} onDong={() => setMo(null)} onXong={() => { setMo(null); doi(); }} /></span>}
    </div>
  );
}
