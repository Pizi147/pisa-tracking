import { useEffect, useId, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { KhungPanel } from './KhungPanel.tsx';
import { Bang } from './Bang.tsx';
import { ODiem } from './ODiem.tsx';
import { phimHangTab } from './HangTab.tsx';
import { PhanTrang, usePhanTrang } from './PhanTrang.tsx';
import { ErrorState, Skeleton } from './ui.tsx';
import { useNgayNghiepVu } from './ngayNghiepVu.ts';
import { fmtBand } from '../lib/format.ts';
import type { ApiError } from '../lib/api.ts';
import {
  KN_LUOT_BANG, NHAN_KN_LUOT, dongTieuChi, duongDotTest, duongHoSoHocVien, ngay, tuanLich,
  type DinhNghiaCot, type DongLuotDiem, type DongTangGiam, type EntrySkill, type KieuBangLuot, type KnLuot, type ODiemLuot,
} from '@shared/domain/index.ts';
import { dich, t } from '@shared/i18n/index.ts';

export type { DongLuotDiem, DongTangGiam, ODiemLuot } from '@shared/domain/index.ts';
type DongBang = { id: number; luotDiem?: DongLuotDiem; tangGiam?: DongTangGiam; ketQua?: 'dat' | 'chua' };
export type DuLieuBangLuot = {
  n: number; rows: DongBang[]; bangLuot?: boolean; kieu?: KieuBangLuot; knNhan?: string | null; cachTinh?: string | null;
  /** Có khoá mà null = mọi chi nhánh; KHÔNG có khoá (hồ sơ GV, Tổng quan) = không ghi chi nhánh. */
  chiNhanh?: string | null;
};

const KN = Object.keys(NHAN_KN_LUOT) as KnLuot[];
/** Link chữ thường (U08-6): rê / focus mới báo. */
const LINK = 'rounded-sm text-[color:var(--text)] no-underline hover:text-[color:var(--accent)] hover:underline hover:underline-offset-[3px] focus-visible:text-[color:var(--accent)] focus-visible:underline';
/** Nền nhấn của ô kỹ năng GV phụ trách (dòng Đạt kỳ vọng Test của Phân tích GV — như viền `.dd .k.cua` của panel cũ). */
const CUA = 'inline-block rounded border-2 border-[color:var(--accent)] bg-[color:var(--accent-soft)] px-1';

/** Chữ hộp chi tiết của một ô: W / S "TA 5.5 · CC 5 · … → 5.5" (`dongTieuChi`, U03); L / R "17/40 câu". Không có → null (ô không bấm). */
function chuChiTiet(kn: KnLuot, o: ODiemLuot): string | null {
  if (!o) return null;
  const tc = dongTieuChi(KN_LUOT_BANG[kn] as EntrySkill, o.tc);
  if (tc) return `${tc.map(([k, v]) => `${k} ${v}`).join(' · ')} → ${fmtBand(o.v)}`;
  return o.raw ? t('{a}/{b} câu', { a: o.raw[0], b: o.raw[1] }) : null;
}

/**
 * Ô điểm bấm được (mockup v13 A1 — điện thoại: vùng bấm nới ra ≥ 44 px bằng `::after`, không đổi bố cục) `.o-d` / `.hop-tc`): ô có tiêu chí / số câu là `button aria-expanded`; bấm mở hộp nhỏ ngay dưới ô (portal, không bị khung cuộn
 * của bảng cắt). Esc / bấm ra ngoài / cuộn → đóng; Esc không đóng panel (`preventDefault`). Ô chỉ có band → chỉ số, không nút.
 */
function ODiemO({ kn, o, nhan }: { kn: KnLuot; o: ODiemLuot; nhan: string }) {
  const [cho, setCho] = useState<CSSProperties | null>(null);
  const nut = useRef<HTMLButtonElement>(null);
  const hop = useRef<HTMLSpanElement>(null);
  const idHop = useId();
  useEffect(() => {
    if (!cho) return;
    const ngoai = (e: Event) => { if (!nut.current?.contains(e.target as Node) && !hop.current?.contains(e.target as Node)) setCho(null); };
    const cuon = (e: Event) => { if (!hop.current?.contains(e.target as Node)) setCho(null); };
    document.addEventListener('pointerdown', ngoai);
    window.addEventListener('scroll', cuon, true);
    return () => { document.removeEventListener('pointerdown', ngoai); window.removeEventListener('scroll', cuon, true); };
  }, [cho]);
  const diem = <ODiem so={o ? fmtBand(o.v) : null} kq={o?.kq ?? null} nhan={nhan} />;
  const chu = chuChiTiet(kn, o);
  if (!chu) return diem;
  const mo = () => {
    if (cho) { setCho(null); return; }
    const r = nut.current!.getBoundingClientRect();
    setCho({ top: r.bottom + 8, left: Math.max(8, Math.min(r.left - 6, window.innerWidth - 328)) });
  };
  return (
    <>
      <button ref={nut} type="button" aria-expanded={!!cho} aria-controls={cho ? idHop : undefined} aria-label={`${nhan} ${fmtBand(o!.v)} · ${o!.raw && !o!.tc ? t('số câu') : t('điểm thành phần')}`}
        onClick={mo} onKeyDown={(e) => { if (e.key === 'Escape' && cho) { e.preventDefault(); setCho(null); } }}
        className="relative -mx-1.5 -my-0.5 cursor-pointer appearance-none after:absolute after:-inset-x-1 after:-inset-y-3 after:content-[''] sm:after:hidden rounded-md border border-transparent bg-transparent px-1.5 py-0.5 hover:border-[color:var(--line-strong)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--accent)] aria-expanded:border-[color:var(--accent)] aria-expanded:bg-[color:var(--surface)] aria-expanded:shadow-[0_0_0_1px_var(--accent)]">
        {diem}
      </button>
      {cho && createPortal(
        <span ref={hop} id={idHop} role="dialog" aria-label={nhan} style={cho}
          className="fixed z-[60] max-w-[320px] whitespace-nowrap rounded-lg border bg-[color:var(--surface)] px-3 py-2 text-left text-[13px] font-semibold tabular-nums text-[color:var(--text)] shadow-xl [border-color:var(--line-strong)]">
          {chu}
        </span>,
        document.body,
      )}
    </>
  );
}

/** Nhãn đầu panel theo nơi gọi (mockup v13: "SỐ · TEST + SOS", "SỐ · BÁO CÁO HV"). */
export function loaiBangLuot(nguon: string): string {
  if (nguon.startsWith('/phan-tich/tong-hop')) return t('SỐ · TEST + SOS');
  if (nguon.startsWith('/phan-tich/bao-cao')) return t('SỐ · BÁO CÁO HV');
  if (nguon.startsWith('/phan-tich/giao-vien')) return t('SỐ · PHÂN TÍCH GV');
  return t('BÁO CÁO · CHỈ ĐỌC');
}

/**
 * PANEL BẢNG CÓ ĐIỂM (U08-2 → PT-PANEL, mockup v13 A1 / A1m / A2). Chỉ đọc. Đầu: loại · tiêu đề ô · "chi nhánh · Fast Track · dữ liệu đến dd/mm" → "n lượt · m HV" →
 * (tab Chưa đạt · Đạt khi dòng có kết luận) → bảng → khối Cách tính.
 *   · `luot`: Học viên · Lớp · MT · L R W1 W2 S · OVR · Kỳ vọng — ô ✓ / ✗ (`ODiem`), ô có tiêu chí / số câu bấm mở hộp; cột `knNhan` nền nhấn.
 *   · `tang-giam`: Học viên · Lớp · (Kỹ năng) · Trước · Sau · Chênh · Kỳ vọng.
 * < 640 px: thẻ (A1m) — tên + "Kỳ vọng x" phải · lớp · MT · lưới 6 ô điểm.
 */
export function BangLuotPanel({ tieuDe, loai = t('SỐ · TEST + SOS'), data, loading, error, reload, onDong }: {
  tieuDe: string; loai?: string; data: DuLieuBangLuot | null; loading: boolean; error: ApiError | null; reload: () => void; onDong: () => void;
}) {
  const { homNay } = useNgayNghiepVu();
  const tg = data?.kieu === 'tang-giam';
  const knNhan = data?.knNhan ?? null;
  const goc = data?.rows ?? [];
  const soChua = goc.filter((r) => r.ketQua === 'chua').length, soDat = goc.filter((r) => r.ketQua === 'dat').length;
  const coTab = soChua > 0 && soDat > 0;
  const [tabChon, setTab] = useState<'chua' | 'dat' | null>(null);
  const tab = tabChon ?? 'chua';
  const loc = coTab ? goc.filter((r) => r.ketQua === tab) : goc;
  /* Giữ phân trang 10 / 20 / 50 của panel cũ (`NganDanhSach`) — số "n lượt · m HV" tính trên cả tab, bảng chỉ trang đang xem. */
  const pt = usePhanTrang(loc.length, `${tieuDe}|${tab}`, t('mục'));

  const lkHv = (id: number, ten: string) => <Link className={`font-semibold ${LINK}`} to={duongHoSoHocVien(id)}>{ten}</Link>;
  const lkLop = (classId: number | null, lop: string) => (classId ? <Link className={`${LINK} !text-dim`} to={`/hoc-vien/lop/${classId}`}>{lop}</Link> : <span className="text-dim">{lop}</span>);
  const lkMt = (attemptId: number, mt: number, dam = true) => <Link className={`${dam ? 'font-semibold' : ''} ${LINK}`} to={duongDotTest({ id: attemptId, kind: 'mock' })}>MT{mt}</Link>;
  const kv = (v: number | null) => <span className="tabular-nums text-dim">{v === null ? '—' : fmtBand(v)}</span>;

  /* ---------- kiểu 'luot' ---------- */
  const tatL = loc.flatMap((r) => (r.luotDiem ? [{ id: r.id, ...r.luotDiem }] : []));
  type HL = (typeof tatL)[number];
  const hangL = pt.cat(tatL);
  const cotL: DinhNghiaCot[] = [
    /* Rộng cột theo mockup v13 A1 (panel 820, ô 14 — `day`, thang lưới điểm G13). */
    { key: 'ten', nhan: t('Học viên'), kieu: 'ten', rong: 150 }, { key: 'lop', nhan: t('Lớp'), kieu: 'chu', rong: 100 }, { key: 'mt', nhan: 'MT', kieu: 'chu', rong: 104 },
    ...KN.map((k): DinhNghiaCot => (NHAN_KN_LUOT[k] === knNhan ? { key: k, nhan: NHAN_KN_LUOT[k], kieu: 'noi-bat', rong: 58, sang: true } : { key: k, nhan: NHAN_KN_LUOT[k], kieu: 'diem', rong: 58 })),
    { key: 'ovr', nhan: 'OVR', kieu: 'diem', rong: 62, tach: true }, { key: 'kv', nhan: t('Kỳ vọng'), kieu: 'so', rong: 72 },
  ];
  const oDiemL = (h: HL, k: KnLuot) => {
    const o = <ODiemO kn={k} o={h.kn[k]} nhan={NHAN_KN_LUOT[k]} />;
    return h.knCua?.includes(k) ? <span className={CUA}>{o}</span> : o;
  };
  const oL = (h: HL, c: DinhNghiaCot): ReactNode => {
    if (c.key === 'ten') return lkHv(h.studentId, h.ten);
    if (c.key === 'lop') return lkLop(h.classId, h.lop);
    if (c.key === 'mt') return lkMt(h.attemptId, h.mt);   // mã tuần ở dòng phụ dưới MTn (`phuL`) — đọc đủ "W4 AUG", không cắt "…" (PTA rà #976)
    if (c.key === 'ovr') return <ODiem so={h.ovr ? fmtBand(h.ovr.v) : null} kq={h.ovr?.kq ?? null} nhan="OVR" />;
    if (c.key === 'kv') return kv(h.kyVong);
    return oDiemL(h, c.key as KnLuot);
  };
  /* A1m: thẻ 375 — tên + Kỳ vọng phải; lớp · MT; lưới L R W1 W2 S OVR (cột đang xét nền nhấn). */
  const theL = (h: HL) => (
    <div className="grid gap-1.5">
      <div className="flex items-baseline gap-2 text-[15px]">{lkHv(h.studentId, h.ten)}
        <span className="ml-auto whitespace-nowrap text-[13px] text-dim">{t('Kỳ vọng')} <b className="text-[14px] font-semibold tabular-nums text-[color:var(--text)]">{h.kyVong === null ? '—' : fmtBand(h.kyVong)}</b></span>
      </div>
      <div className="flex flex-wrap gap-x-3 text-[14px]">{lkLop(h.classId, h.lop)}<span className="whitespace-nowrap">{lkMt(h.attemptId, h.mt)} <span className="text-[13px] text-faint">{tuanLich(h.tuan, homNay)}</span></span></div>
      <div className="mt-1 grid grid-cols-6 gap-x-1.5">
        {[...KN, 'ovr' as const].map((k) => (
          <span key={k} className={`grid gap-0.5 ${NHAN_KN_LUOT[k as KnLuot] === knNhan ? '-mx-1 -my-0.5 rounded-md bg-[color:var(--accent-soft)] px-1 py-0.5' : ''}`}>
            <span className="text-[13px] font-medium text-slate-400">{k === 'ovr' ? 'OVR' : NHAN_KN_LUOT[k]}</span>
            {k === 'ovr' ? oL(h, cotL[cotL.length - 2]) : oDiemL(h, k)}
          </span>
        ))}
      </div>
    </div>
  );

  /* ---------- kiểu 'tang-giam' ---------- */
  const tatT = loc.flatMap((r) => (r.tangGiam ? [{ id: r.id, ...r.tangGiam }] : []));
  type HT = (typeof tatT)[number];
  const hangT = pt.cat(tatT);
  const cotT: DinhNghiaCot[] = [
    { key: 'ten', nhan: t('Học viên'), kieu: 'ten', rong: 170 }, { key: 'lop', nhan: t('Lớp'), kieu: 'chu', rong: 100 },
    ...(knNhan ? [] : [{ key: 'kn', nhan: t('Kỹ năng'), kieu: 'chu', rong: 80 } as DinhNghiaCot]),
    { key: 'truoc', nhan: t('Trước'), kieu: 'chu', rong: 110 }, { key: 'sau', nhan: t('Sau'), kieu: 'chu', rong: 130 },
    { key: 'chenh', nhan: t('Chênh'), kieu: 'so', rong: 76 }, { key: 'kv', nhan: t('Kỳ vọng'), kieu: 'so', rong: 76 },
  ];
  const chenh = (v: number) => (
    <span className={`font-semibold tabular-nums ${v > 0 ? 'text-ok' : v < 0 ? 'text-bad' : 'text-dim'}`}>{v > 0 ? `+${fmtBand(v)}` : v < 0 ? `−${fmtBand(-v)}` : '0'}</span>
  );
  const oT = (h: HT, c: DinhNghiaCot): ReactNode => {
    if (c.key === 'ten') return lkHv(h.studentId, h.ten);
    if (c.key === 'lop') return lkLop(h.classId, h.lop);
    if (c.key === 'kn') return <b className="font-semibold">{h.kn}</b>;
    if (c.key === 'truoc') return <span className="whitespace-nowrap"><span className="text-dim">MT{h.truoc.mt}</span> <b className="ml-1 font-semibold tabular-nums">{fmtBand(h.truoc.v)}</b></span>;
    if (c.key === 'sau') return <span className="inline-flex items-baseline gap-2 whitespace-nowrap">{lkMt(h.attemptId, h.sau.mt, false)}<ODiem so={fmtBand(h.sau.v)} kq={h.sau.kq} nhan={h.kn} /></span>;
    if (c.key === 'chenh') return chenh(h.chenh);
    return kv(h.kyVong);
  };
  const theT = (h: HT) => (
    <div className="grid gap-1">
      <div className="flex items-baseline gap-2 text-[15px]">{lkHv(h.studentId, h.ten)}
        <span className="ml-auto whitespace-nowrap text-[13px] text-dim">{t('Kỳ vọng')} <b className="text-[14px] font-semibold tabular-nums text-[color:var(--text)]">{h.kyVong === null ? '—' : fmtBand(h.kyVong)}</b></span>
      </div>
      <div className="text-[14px]">{lkLop(h.classId, h.lop)}{!knNhan && <> · <b className="font-semibold">{h.kn}</b></>}</div>
      <div className="flex flex-wrap items-baseline gap-x-2 text-[15px]">{oT(h, { key: 'truoc', nhan: '', kieu: 'chu' })}<span aria-hidden className="text-faint">→</span>{oT(h, { key: 'sau', nhan: '', kieu: 'chu' })}<span className="ml-auto">{chenh(h.chenh)}</span></div>
    </div>
  );

  const soDong = tg ? tatT.length : tatL.length;
  const soHv = new Set((tg ? tatT : tatL).map((h) => h.studentId)).size;
  const dem = tg && soDong === soHv ? t('{n} HV', { n: soHv }) : `${t('{n} lượt', { n: soDong })} · ${t('{n} HV', { n: soHv })}`;
  const dong2 = [data && 'chiNhanh' in data ? data.chiNhanh ?? t('Tất cả chi nhánh') : null, 'Fast Track',
    tg ? t('so mốc MT trước') : t('dữ liệu đến {ngay}', { ngay: ngay(homNay).slice(0, 5) })].filter(Boolean).join(' · ');
  return (
    <KhungPanel tieuDe={tieuDe} rong="bang" onDong={onDong} loai={loai} dau={{ dong2: [dong2] }} chan={{ huy: { nhan: t('Đóng'), onClick: onDong } }}>
      {error ? <div className="pt-3"><ErrorState message={error.message} hint={error.hint} status={error.status} onRetry={reload} /></div>
        : loading || !data ? <div className="pt-3"><Skeleton rows={4} /></div>
          : (
            <div className="grid gap-3 pt-3">
              {coTab && (
                /* Giữ hai tab Chưa đạt · Đạt của panel cũ (chủ SP 05/11) — cùng dáng tab `NganDanhSach`. */
                <div role="tablist" aria-label={t('Kết quả')} onKeyDown={phimHangTab} className="-mx-4 -mt-3 flex border-b px-4" style={{ borderColor: 'var(--line)' }}>
                  {([['chua', t('Chưa đạt'), soChua], ['dat', t('Đạt'), soDat]] as const).map(([k, nhan, n]) => (
                    <button key={k} type="button" role="tab" aria-selected={tab === k} tabIndex={tab === k ? 0 : -1} onClick={() => setTab(k)}
                      className={`-mb-px min-h-[44px] border-b-2 px-3 text-sm ${tab === k ? 'border-[color:var(--accent)] font-semibold text-slate-100' : 'border-transparent font-medium text-slate-400 hover:text-slate-200'}`}>
                      {nhan} <span className="tabular-nums">{n}</span>
                    </button>
                  ))}
                </div>
              )}
              <span className="text-sm text-dim"><b className="tabular-nums text-[15px] text-slate-100">{soDong}</b> {dem.replace(/^\d+\s*/, '')}</span>
              <PhanTrang {...pt.thanh} />
              {tg
                ? <Bang deu ten={tieuDe} cot={cotT} hang={hangT} khoa={(h) => h.id} oCua={oT} khung={false} theRieng={theT} />
                : <Bang deu day ten={tieuDe} cot={cotL} hang={hangL} khoa={(h) => h.id} oCua={oL} phuCua={(h, c) => (c.key === 'mt' ? tuanLich(h.tuan, homNay) : null)} khung={false} theRieng={theL} />}
              <PhanTrang {...pt.thanh} duoi />
              {data.cachTinh && (
                <div className="grid gap-1 border-t pt-3 text-sm" style={{ borderColor: 'var(--line)' }}><b className="text-slate-100">{t('Cách tính')}</b><span className="text-dim">{dich(data.cachTinh)}</span></div>
              )}
            </div>
          )}
    </KhungPanel>
  );
}
