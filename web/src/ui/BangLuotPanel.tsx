import { useEffect, useId, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { KhungPanel } from './KhungPanel.tsx';
import { NutLuat } from './NutLuat.tsx';
import { Bang } from './Bang.tsx';
import { ODiem } from './ODiem.tsx';
import { phimHangTab } from './HangTab.tsx';
import { XemThem, useXemThem } from './PhanTrang.tsx';
import { ErrorState, Skeleton } from './ui.tsx';
import { useNgayNghiepVu } from './ngayNghiepVu.ts';
import { fmtBand } from '../lib/format.ts';
import type { ApiError } from '../lib/api.ts';
import {
  KN_LUOT_BANG, NHAN_KN_LUOT, OUTCOME_MARK, TAB_VIEC_HAN, TAB_VIEC_HAN_LABEL, OUTCOME_TONE, dongTieuChi, duongDotTest, duongHoSoHocVien, ngay, outcomeLabelFor, tuanLich,
  type DinhNghiaCot, type DongBaiThuong, type DongPa, type DongViecHan, type TabViecHan, type DongViPham, type DongViPhamEm, type DongViPhamLop, type TrangThaiVp, type DongLuotDiem, type DongTangGiam, type DongThiThatBang, type KnThiBang, type EntrySkill, type KieuBangLuot, type KnLuot, type ODiemLuot,
} from '@shared/domain/index.ts';
import { dich, t } from '@shared/i18n/index.ts';
import { NhanViPham } from '../modules/yThuc/NhanViPham.tsx';

export type { DongLuotDiem, DongTangGiam, ODiemLuot } from '@shared/domain/index.ts';
type DongBang = {
  id: number; luotDiem?: DongLuotDiem; tangGiam?: DongTangGiam; baiThuong?: DongBaiThuong; thiThat?: DongThiThatBang; ketQua?: 'dat' | 'chua';
  viPham?: DongViPham; viPhamEm?: DongViPhamEm; viPhamLop?: DongViPhamLop; pa?: DongPa; dongViec?: DongViecHan;
};
export type DuLieuBangLuot = {
  n: number; rows: DongBang[]; bangLuot?: boolean; kieu?: KieuBangLuot; knNhan?: string | null; cachTinh?: string | null;
  /** `bai-thuong`: ngưỡng đạt chung (%) — đầu panel "đạt từ 70 % mỗi môn"; null = các lớp khác ngưỡng. */
  nguong?: number | null;
  /** Có khoá mà null = mọi chi nhánh; KHÔNG có khoá (hồ sơ GV, Tổng quan) = không ghi chi nhánh. */
  chiNhanh?: string | null;
  /** THI-THAT (C3): dòng đếm do máy chủ ghi ("6 / 11 HV Fail · 55 % theo tuần dạy") thay "n HV". */
  dem?: string | null;
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
  if (nguon.startsWith('/phan-tich/tong-hop')) return t('Số · Test + SOS');
  if (nguon.startsWith('/phan-tich/bao-cao')) return t('Số · Báo cáo HV');
  if (nguon.startsWith('/phan-tich/giao-vien')) return t('Số · Phân tích GV');
  if (nguon.startsWith('/phan-tich/y-thuc')) return t('Số · Ý thức');
  if (nguon.startsWith('/phan-tich/hieu-qua-pa')) return t('Số · Hiệu quả PA');
  if (nguon.startsWith('/phan-tich/thi-that')) return /[?&]o=gv:/.test(nguon) ? t('Số · Thi thật · theo GV') : t('Số · Thi thật');
  return t('Báo cáo · chỉ đọc');
}

/**
 * PANEL BẢNG CÓ ĐIỂM (U08-2 → PT-PANEL, mockup v13 A1 / A1m / A2). Chỉ đọc. Đầu: loại · tiêu đề ô · "chi nhánh · Fast Track · dữ liệu đến dd/mm" → "n lượt · m HV" →
 * (tab Chưa đạt · Đạt khi dòng có kết luận) → bảng; "Cách tính" = ⓘ ở dòng tiêu đề.
 *   · `luot`: Học viên · Lớp · MT · L R W1 W2 S · OVR · Kỳ vọng — ô ✓ / ✗ (`ODiem`), ô có tiêu chí / số câu bấm mở hộp; cột `knNhan` nền nhấn.
 *   · `tang-giam`: Học viên · Lớp · (Kỹ năng) · Trước · Sau · Chênh · Kỳ vọng.
 *   · `thi-that` (v13 C2 / C3): Học viên · Lớp · Ngày thi · L R W S · OVR · Target (+ Tuần dạy ở panel GV) — ô so Target overall, chỉ band (không hộp);
 *     kỹ năng lấy lại khi thi lại một kỹ năng: mờ "↺".
 * < 640 px: thẻ (A1m) — tên + "Kỳ vọng x" phải · lớp · MT · lưới 6 ô điểm.
 */
/** Sổ nghĩa vụ (PR-2): 3 trạng thái của dòng việc / bài — thứ tự tab (Chưa làm đầu). */
const TT_VIEC = ['chua', 'muon', 'dung'] as const;
type TrangThaiViec = (typeof TT_VIEC)[number];
const ttViec = (v: Pick<DongViecHan, 'trangThai' | 'mo' | 'dung'>): TrangThaiViec => v.trangThai ?? (v.mo ? 'chua' : v.dung ? 'dung' : 'muon');

export function BangLuotPanel({ tieuDe, loai = t('Số · Test + SOS'), data, loading, error, reload, onDong }: {
  tieuDe: string; loai?: string; data: DuLieuBangLuot | null; loading: boolean; error: ApiError | null; reload: () => void; onDong: () => void;
}) {
  const { homNay } = useNgayNghiepVu();
  const tg = data?.kieu === 'tang-giam';
  const tt = data?.kieu === 'thi-that';
  const bt = data?.kieu === 'bai-thuong';
  const vpk = data?.kieu === 'vi-pham', pak = data?.kieu === 'pa';
  const knNhan = data?.knNhan ?? null;
  const goc = data?.rows ?? [];
  const soChua = goc.filter((r) => r.ketQua === 'chua').length, soDat = goc.filter((r) => r.ketQua === 'dat').length;
  const coTab = soChua > 0 && soDat > 0;
  const [tabChon, setTab] = useState<'chua' | 'dat' | null>(null);
  const tab = tabChon ?? 'chua';
  /*
   * DEM-QUA-HAN b (chủ SP 06/11, chốt: "việc đang quá hạn ưu tiên hiện lên, còn việc đã làm rồi cho hẳn sang 1 tab"): tab loại / tuyến việc CHỈ chứa việc còn mở
   * đang quá hạn (số tab = số quá hạn, rỗng ẩn) + tab cuối "Đã làm n" (mọi việc đã làm trong kỳ). Mặc định: tab loại đầu tiên có việc quá hạn, không có thì "Đã làm".
   * Panel Chấm Test: "Quá hạn chưa chấm n" · "Đã nhập n".
   */
  /*
   * SỔ NGHĨA VỤ (PR-2, spec 1.7): 3 tab theo trạng thái — Chưa làm · Làm muộn · Đúng hạn (rỗng ẩn), mặc định tab đầu có dòng (Chưa làm trước). Thay tab loại việc +
   * "Đã làm" (DEM-QUA-HAN b): loại việc ghi ở dòng phụ. Dòng không có `trangThai` (panel cũ) suy từ `mo` / `dung`.
   */
  const vk = data?.kieu === 'viec';
  const tabsViec: TrangThaiViec[] = vk ? TT_VIEC.filter((k) => goc.some((r) => r.dongViec && ttViec(r.dongViec) === k)) : [];
  const [tabViecChon, setTabViec] = useState<TrangThaiViec | null>(null);
  const tabViec = tabViecChon && tabsViec.includes(tabViecChon) ? tabViecChon : tabsViec[0] ?? null;
  const loc = vk ? goc.filter((r) => r.dongViec && ttViec(r.dongViec) === tabViec)
    : coTab ? goc.filter((r) => r.ketQua === tab) : goc;
  /* B13 (audit-ui 08/11, thay phân trang 10 / 20 / 50): 20 dòng đầu + "Xem thêm" cuối bảng — cắt trên dữ liệu đã nạp, không gọi thêm máy chủ.
     Số "n lượt · m HV" tính trên cả tab. */
  const pt = useXemThem(loc.length, `${tieuDe}|${tab}|${tabViec ?? ''}`);

  /* DEM-QUA-HAN: dòng việc cả lớp (Bàn giao, Phối hợp SOS…) không có em — tên trơn. */
  const lkHv = (id: number, ten: string) => (id ? <Link className={`font-semibold ${LINK}`} to={duongHoSoHocVien(id)}>{ten}</Link> : <b className="font-semibold">{dich(ten)}</b>);
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

  /* ---------- kiểu 'thi-that' ---------- */
  const tatH = loc.flatMap((r) => (r.thiThat ? [{ id: r.id, ...r.thiThat }] : []));
  type HH = (typeof tatH)[number];
  const hangH = pt.cat(tatH);
  const coTuan = tatH.some((h) => h.tuan);
  const KN4 = ['l', 'r', 'w', 's'] as const;
  /* "W1" / "W2" (panel GV) tô cột W — thi thật chỉ có một band Writing. */
  const xetH = (k: KnThiBang) => knNhan?.[0]?.toLowerCase() === k;
  const cotH: DinhNghiaCot[] = [
    { key: 'ten', nhan: t('Học viên'), kieu: 'ten', rong: coTuan ? 140 : 170 }, { key: 'lop', nhan: t('Lớp'), kieu: 'chu', rong: 90 }, { key: 'ngay', nhan: t('Ngày thi'), kieu: 'chu', rong: 76 },
    ...KN4.map((k): DinhNghiaCot => (xetH(k) ? { key: k, nhan: k.toUpperCase(), kieu: 'noi-bat', rong: 58, sang: true } : { key: k, nhan: k.toUpperCase(), kieu: 'diem', rong: 58 })),
    { key: 'ovr', nhan: 'OVR', kieu: 'diem', rong: 62, tach: true }, { key: 'tg', nhan: 'Target', kieu: 'so', rong: 66 },
    ...(coTuan ? [{ key: 'tuan', nhan: t('Tuần dạy'), kieu: 'so', rong: 116 } as DinhNghiaCot] : []),
  ];
  const oDiemH = (h: HH, k: KnThiBang | 'ovr') => {
    const o = k === 'ovr' ? h.ovr : h.kn[k];
    if (k !== 'ovr' && h.layLai.includes(k) && o) return <span className="whitespace-nowrap tabular-nums text-faint" title={t('lấy từ lần thi trước')}><span aria-hidden>↺ </span><span className="sr-only">{t('lấy từ lần thi trước')} </span>{fmtBand(o.v)}</span>;
    return <ODiem so={o ? fmtBand(o.v) : null} kq={o?.kq ?? null} nhan={k === 'ovr' ? 'OVR' : k.toUpperCase()} />;
  };
  const tuanH = (h: HH) => (h.tuan ? <span className="whitespace-nowrap tabular-nums text-dim">{h.tuan.day}/{h.tuan.tong} · {h.tuan.tong ? Math.round((100 * h.tuan.day) / h.tuan.tong) : 0} %</span> : null);
  const oH = (h: HH, c: DinhNghiaCot): ReactNode => {
    if (c.key === 'ten') return lkHv(h.studentId, h.ten);
    if (c.key === 'lop') return lkLop(h.classId, h.lop);
    if (c.key === 'ngay') return <span className="tabular-nums text-dim">{h.ngay ? ngay(h.ngay, homNay).slice(0, 5) : '—'}</span>;
    if (c.key === 'tg') return <span className="tabular-nums text-dim">{h.kck ? 'KCK' : h.target === null ? '—' : fmtBand(h.target)}</span>;
    if (c.key === 'tuan') return tuanH(h);
    return oDiemH(h, c.key as KnThiBang | 'ovr');
  };
  const theH = (h: HH) => (
    <div className="grid gap-1.5">
      <div className="flex items-baseline gap-2 text-[15px]">{lkHv(h.studentId, h.ten)}
        <span className="ml-auto whitespace-nowrap text-[13px] text-dim">Target <b className="text-[14px] font-semibold tabular-nums text-[color:var(--text)]">{h.kck ? 'KCK' : h.target === null ? '—' : fmtBand(h.target)}</b></span>
      </div>
      <div className="flex flex-wrap gap-x-3 text-[14px]">{lkLop(h.classId, h.lop)}<span className="tabular-nums text-dim">{h.ngay ? ngay(h.ngay, homNay).slice(0, 5) : '—'}</span>{tuanH(h)}</div>
      <div className="mt-1 grid grid-cols-5 gap-x-1.5">
        {[...KN4, 'ovr' as const].map((k) => (
          <span key={k} className={`grid gap-0.5 ${k !== 'ovr' && xetH(k) ? '-mx-1 -my-0.5 rounded-md bg-[color:var(--accent-soft)] px-1 py-0.5' : ''}`}>
            <span className="text-[13px] font-medium text-slate-400">{k === 'ovr' ? 'OVR' : k.toUpperCase()}</span>{oDiemH(h, k)}
          </span>
        ))}
      </div>
    </div>
  );

  /* ---------- kiểu 'bai-thuong' (PT-LOP-THUONG, mockup v13 A3) ---------- */
  const tatB = loc.flatMap((r) => (r.baiThuong ? [{ id: r.id, ...r.baiThuong }] : []));
  type HB = (typeof tatB)[number];
  /* Mỗi chương trình một bảng (môn khác nhau: BE / ELE L R W S · FOU L R G+V P) — thứ tự xuất hiện. */
  const nhomB = [...new Set(pt.cat(tatB).map((h) => h.chuongTrinh))].map((ct) => ({ ct, hang: pt.cat(tatB).filter((h) => h.chuongTrinh === ct) }));
  const coBai = new Set(tatB.map((h) => `${h.nhanBai}|${h.tuan}`)).size > 1;   // bài / tuần khác nhau (ô Bài kiểm tra, ô Tổng) → cột Bài
  const cotB = (hang: HB[]): DinhNghiaCot[] => {
    const mon = [...new Set(hang.flatMap((h) => Object.keys(h.mon)))];
    return [
      /* Panel 820: tên 150 · lớp 96 · bài 124 · 4 môn × 76 · Tổng 80 = 754 (vừa thân 788, không cuộn ngang). */
      { key: 'ten', nhan: t('Học viên'), kieu: 'ten', rong: 150 }, { key: 'lop', nhan: t('Lớp'), kieu: 'chu', rong: 96 },
      ...(coBai ? [{ key: 'bai', nhan: t('Bài'), kieu: 'chu', rong: 124 } as DinhNghiaCot] : []),
      ...mon.map((m): DinhNghiaCot => ({ key: `mon:${m}`, nhan: m, kieu: 'diem-ti-le', rong: 76 })),
      ...(hang.some((h) => h.tong !== null) ? [{ key: 'tong', nhan: t('Tổng'), kieu: 'diem', rong: 80, tach: true } as DinhNghiaCot] : []),
    ];
  };
  /** Tổng phổ biến của cột môn — mẫu số khác = "đề khác" (vàng), như lưới điểm. */
  const tongCot = (hang: HB[], m: string) => {
    const dem = new Map<number, number>();
    for (const h of hang) { const o = h.mon[m]; if (o) dem.set(o.tong, (dem.get(o.tong) ?? 0) + 1); }
    return [...dem].sort((a, b) => b[1] - a[1])[0]?.[0];
  };
  const oB = (hang: HB[]) => (h: HB, c: DinhNghiaCot): ReactNode => {
    if (c.key === 'ten') return lkHv(h.studentId, h.ten);
    if (c.key === 'lop') return lkLop(h.classId, h.lop);
    if (c.key === 'bai') return <span className="whitespace-nowrap"><Link className={`font-semibold ${LINK}`} to={duongDotTest({ id: h.attemptId, kind: h.bai })}>{dich(h.nhanBai)}</Link></span>;
    if (c.key === 'tong') return h.tong === null ? <span className="text-faint">—</span> : <ODiem so={`${h.tong} %`} kq={h.datTong === null ? null : h.datTong ? 'bang' : 'duoi'} nhan={t('Tổng')} />;
    const m = c.key.slice(4), o = h.mon[m];
    const d = <ODiem kieu="ti-le" so={o ? String(o.dung) : null} tong={o?.tong} tongCot={tongCot(hang, m)} kq={!o || o.dat === null ? null : o.dat ? 'bang' : 'duoi'} nhan={m} />;
    return h.monCua?.includes(m) ? <span className={CUA}>{d}</span> : d;
  };
  const theB = (hang: HB[]) => (h: HB) => (
    <div className="grid gap-1.5">
      <div className="flex items-baseline gap-2 text-[15px]">{lkHv(h.studentId, h.ten)}
        {h.tong !== null && <span className="ml-auto whitespace-nowrap text-[13px] text-dim">{t('Tổng')} {oB(hang)(h, { key: 'tong', nhan: '', kieu: 'diem' })}</span>}
      </div>
      <div className="flex flex-wrap gap-x-3 text-[14px]">{lkLop(h.classId, h.lop)}<span className="whitespace-nowrap">{dich(h.nhanBai)} <span className="text-[13px] text-faint">{tuanLich(h.tuan, homNay)}</span></span></div>
      <div className="mt-1 grid grid-cols-4 gap-x-1.5">
        {Object.keys(h.mon).map((m) => (
          <span key={m} className="grid gap-0.5"><span className="text-[13px] font-medium text-slate-400">{m}</span>{oB(hang)(h, { key: `mon:${m}`, nhan: m, kieu: 'diem-ti-le' })}</span>
        ))}
      </div>
    </div>
  );

  /* ---------- kiểu 'vi-pham' (PT-VP-PA, mockup v13 A4 · P-VP): vi phạm · theo em · theo lớp ---------- */
  const ddmm = (iso: string | null | undefined) => (iso ? `${iso.slice(8, 10)}/${iso.slice(5, 7)}` : '—');
  const mo = (x: ReactNode) => <span className="text-faint">{x}</span>;
  const tatV = loc.flatMap((r) => (r.viPham ? [{ ...r.viPham, id: r.id }] : []));
  const tatVe = loc.flatMap((r) => (r.viPhamEm ? [{ ...r.viPhamEm, id: r.id }] : []));
  const tatVl = loc.flatMap((r) => (r.viPhamLop ? [{ ...r.viPhamLop, id: r.id }] : []));
  type HV = (typeof tatV)[number]; type HVe = (typeof tatVe)[number]; type HVl = (typeof tatVl)[number];
  const cotV: DinhNghiaCot[] = [
    /* Panel 820, ô 14 (`day`): 140 + 96 + 70 + Vi phạm (phần còn lại ≈ 192, mô tả cắt một dòng có title) + 150 + 140 — tên Người ghi đọc đủ (PTA rà #984). */
    { key: 'ten', nhan: t('Học viên'), kieu: 'ten', rong: 140 }, { key: 'lop', nhan: t('Lớp'), kieu: 'chu', rong: 96 }, { key: 'ngay', nhan: t('Ngày'), kieu: 'chu', rong: 70 },
    { key: 'vp', nhan: t('Vi phạm'), kieu: 'chu', linhHoat: true }, { key: 'nguoi', nhan: t('Người ghi'), kieu: 'chu', rong: 150 }, { key: 'tt', nhan: t('Trạng thái'), kieu: 'chip', rong: 140 },
  ];
  const oV = (h: HV, c: DinhNghiaCot): ReactNode => {
    if (c.key === 'ten') return lkHv(h.studentId, h.ten);
    if (c.key === 'lop') return lkLop(h.classId, h.lop);
    if (c.key === 'ngay') return <span className="tabular-nums">{ddmm(h.ngay)}</span>;
    if (c.key === 'vp') return <b className="font-semibold">{dich(h.nhom)}</b>;
    if (c.key === 'nguoi') return h.nguoiGhi ?? mo('—');
    return h.trangThaiT ? <NhanViPham t={h.trangThaiT as TrangThaiVp} nhan={dich(h.trangThai)} /> : mo(dich(h.trangThai));
  };
  const theV = (h: HV) => (
    <div className="grid gap-1">
      <div className="flex items-baseline gap-2 text-[15px]">{lkHv(h.studentId, h.ten)}<span className="ml-auto">{oV(h, cotV[5])}</span></div>
      <div className="text-[14px]">{lkLop(h.classId, h.lop)} · <span className="tabular-nums">{ddmm(h.ngay)}</span>{h.nguoiGhi && <> · {h.nguoiGhi}</>}</div>
      <div className="text-[14px]"><b className="font-semibold">{dich(h.nhom)}</b>{h.moTa && <span className="block text-[13px] text-dim">{h.moTa}</span>}</div>
    </div>
  );
  const cotVe: DinhNghiaCot[] = [
    { key: 'ten', nhan: t('Học viên'), kieu: 'ten', rong: 170 }, { key: 'lop', nhan: t('Lớp'), kieu: 'chu', rong: 100 },
    { key: 'vp', nhan: t('Vi phạm'), kieu: 'so', rong: 80 }, { key: 'chua', nhan: t('Chưa xử lý'), kieu: 'so', rong: 90 },
    { key: 'bac', nhan: t('Bậc hiện tại'), kieu: 'chu', rong: 130 }, { key: 'lan', nhan: t('Lần xử lý gần nhất'), kieu: 'chu', linhHoat: true },
  ];
  const oVe = (h: HVe, c: DinhNghiaCot): ReactNode => {
    if (c.key === 'ten') return lkHv(h.studentId, h.ten);
    if (c.key === 'lop') return h.lop ?? mo('—');
    if (c.key === 'vp') return <span className="tabular-nums">{h.viPham}</span>;
    if (c.key === 'chua') return <span className={`tabular-nums ${h.chuaXuLy ? 'font-semibold text-bad' : 'text-faint'}`}>{h.chuaXuLy}</span>;
    if (c.key === 'bac') return h.bac ? dich(h.bac) : mo(t('Chưa xử lý lần nào'));
    return h.lanXuLy ? dich(h.lanXuLy) : mo('—');
  };
  const cotVl: DinhNghiaCot[] = [
    { key: 'lop', nhan: t('Lớp'), kieu: 'ten', rong: 150 }, { key: 'gvcn', nhan: 'GVCN', kieu: 'chu', linhHoat: true },
    { key: 'hv', nhan: t('HV có vi phạm'), kieu: 'so', rong: 120 }, { key: 'vp', nhan: t('Vi phạm'), kieu: 'so', rong: 90 }, { key: 'chua', nhan: t('Chưa xử lý'), kieu: 'so', rong: 100 },
  ];
  const oVl = (h: HVl, c: DinhNghiaCot): ReactNode => {
    if (c.key === 'lop') return h.classId ? <Link className={`font-semibold ${LINK}`} to={`/hoc-vien/lop/${h.classId}`}>{h.lop}</Link> : <b className="font-semibold">{dich(h.lop)}</b>;
    if (c.key === 'gvcn') return h.gvcn ?? mo('—');
    if (c.key === 'hv') return <span className="tabular-nums">{h.hvViPham}{h.siSo != null && <span className="text-faint">/{h.siSo}</span>}</span>;
    if (c.key === 'vp') return <span className="tabular-nums">{h.viPham}</span>;
    return <span className={`tabular-nums ${h.chuaXuLy ? 'font-semibold text-bad' : 'text-faint'}`}>{h.chuaXuLy}</span>;
  };

  /* ---------- kiểu 'pa' (P-PA): PA · nghĩa vụ ghi kết quả (đợt, hạn, ngày ghi, đúng hạn) ---------- */
  const tatP = loc.flatMap((r) => (r.pa ? [{ ...r.pa, id: r.id }] : []));
  type HP = (typeof tatP)[number];
  const nghiaVu = tatP.some((h) => h.dot !== undefined);
  const MAU_KQ: Record<string, string> = { ok: 'text-ok', warn: 'text-soon', danger: 'text-bad', muted: 'text-faint' };
  const cotP: DinhNghiaCot[] = [
    /* Panel 820, ô 14 (`day`). Tuần bắt đầu PA = dòng phụ dưới Lớp ("từ W3 JUL"). Nghĩa vụ (Phân tích GV, một GV): bỏ cột Người phụ trách — luôn là chính GV đang xem. */
    { key: 'ten', nhan: t('Học viên'), kieu: 'ten', rong: 140 }, { key: 'lop', nhan: t('Lớp'), kieu: 'chu', rong: 96 }, { key: 'case', nhan: 'Case', kieu: 'chu', rong: 60 },
    { key: 'pa', nhan: 'PA', kieu: 'chu', linhHoat: true },
    ...(nghiaVu
      ? [{ key: 'han', nhan: t('Hạn'), kieu: 'chu', rong: 70 }, { key: 'ghi', nhan: t('Ngày ghi'), kieu: 'chu', rong: 86 }, { key: 'dung', nhan: t('Đúng hạn'), kieu: 'chu', rong: 124 }] as DinhNghiaCot[]
      : [{ key: 'kq', nhan: t('Kết quả'), kieu: 'chu', rong: 164 }, { key: 'nguoi', nhan: t('Người phụ trách'), kieu: 'chu', rong: 140 }] as DinhNghiaCot[]),
  ];
  const oP = (h: HP, c: DinhNghiaCot): ReactNode => {
    if (c.key === 'ten') return lkHv(h.studentId, h.ten);
    if (c.key === 'lop') return lkLop(h.classId, h.lop);
    if (c.key === 'case') return h.kyNang ? <b className="font-semibold">{dich(h.kyNang)}</b> : mo('—');
    if (c.key === 'pa') return <span>{dich(h.loaiPa)}{h.dot !== undefined && <span className="text-faint"> · {t('Đợt {n}', { n: h.dot })}</span>}</span>;
    if (c.key === 'bd') return h.batDau ? tuanLich(h.batDau, homNay) : mo('—');
    if (c.key === 'kq') return h.ketQua
      ? <span className={`font-semibold ${MAU_KQ[OUTCOME_TONE[h.ketQua] ?? 'muted']}`}><span aria-hidden>{OUTCOME_MARK[h.ketQua]} </span>{dich(outcomeLabelFor(h.ketQua))}</span>
      : mo(t('Chờ kết quả'));
    if (c.key === 'han') return <span className="tabular-nums">{ddmm(h.han)}</span>;
    if (c.key === 'ghi') return h.ngayGhi ? <span className="tabular-nums">{ddmm(h.ngayGhi)}</span> : mo(t('Chưa ghi'));
    if (c.key === 'dung') return h.dungHan ? <span className="font-semibold text-ok">✓ {t('Đúng hạn')}</span>
      : <span className="font-semibold text-late">⚠ {h.treNgay ? t('Trễ {n} ngày', { n: h.treNgay }) : t('Quá hạn')}</span>;
    return h.nguoiPhuTrach ?? mo('—');
  };
  const theP = (h: HP) => (
    <div className="grid gap-1">
      <div className="flex items-baseline gap-2 text-[15px]">{lkHv(h.studentId, h.ten)}<span className="ml-auto text-[14px]">{oP(h, { key: nghiaVu ? 'dung' : 'kq', nhan: '', kieu: 'chu' })}</span></div>
      <div className="text-[14px]">{lkLop(h.classId, h.lop)}{h.kyNang && <> · <b className="font-semibold">{dich(h.kyNang)}</b></>} · {oP(h, { key: 'pa', nhan: '', kieu: 'chu' })}</div>
      <div className="text-[13px] text-dim">{nghiaVu ? <>{t('Hạn')} {ddmm(h.han)}{h.ngayGhi && <> · {t('Ngày ghi')} {ddmm(h.ngayGhi)}</>}</> : h.batDau ? tuanLich(h.batDau, homNay) : null}{h.nguoiPhuTrach && <> · {h.nguoiPhuTrach}</>}</div>
    </div>
  );

  /* ---------- kiểu 'viec' (DEM-QUA-HAN b): việc / bài có hạn trong kỳ — đang quá hạn trước (máy chủ xếp), bấm tên việc mở đúng việc ---------- */
  const tatVc = loc.flatMap((r) => (r.dongViec ? [{ ...r.dongViec, id: r.id, studentId: r.dongViec.em?.id }] : []));
  type HVc = (typeof tatVc)[number];
  const laBai = vk && goc.every((r) => r.dongViec?.tab === 'cham');
  const nhanTabViec = (k: TrangThaiViec) => (k === 'chua' ? t('Chưa làm') : k === 'muon' ? t('Làm muộn') : t('Đúng hạn'));
  const cotVc: DinhNghiaCot[] = [
    { key: 'viec', nhan: laBai ? t('Bài') : t('Việc'), kieu: 'chu', linhHoat: true },
    /* RA-GD-0711: Lớp 100 → 120 — "MB FT RF 12", "MB Pre FOU 03" không còn "MB FT RF…" (cột Việc / Bài linh hoạt nhường chỗ). */
    { key: 'ten', nhan: t('Học viên'), kieu: 'ten', rong: 140 }, { key: 'lop', nhan: t('Lớp'), kieu: 'chu', rong: 120 },
    { key: 'han', nhan: t('Hạn'), kieu: 'chu', rong: 92 }, { key: 'tt', nhan: t('Trạng thái'), kieu: 'chu', rong: 176 },
  ];
  /* Chủ SP 06/11: MỘT chữ "Quá hạn" (bỏ "Trễ") — việc mở và việc làm sau hạn cùng nhãn; dòng phụ "đã làm / nhập dd/mm" phân biệt. */
  const ttVc = (h: HVc) => {
    const k = ttViec(h);
    return k === 'dung' ? <span className="font-semibold text-ok">✓ {t('Đúng hạn')}</span>
      : k === 'muon' ? <span className="font-semibold text-late">{t('Làm muộn {n} ngày', { n: h.treNgay ?? 0 })}</span>
      : <span className="font-semibold text-bad">⚠ {t('Chưa làm · quá {n} ngày', { n: h.treNgay ?? 0 })}</span>;
  };
  const ngayLam = (h: HVc) => (h.ngayXong ? (laBai ? t('nhập {ngay}', { ngay: ddmm(h.ngayXong) }) : t('đã làm {ngay}', { ngay: ddmm(h.ngayXong) })) : null);
  const oVc = (h: HVc, c: DinhNghiaCot): ReactNode => {
    if (c.key === 'viec') return <Link className={`font-semibold ${LINK}`} to={h.href}>{dich(h.ten)}</Link>;
    if (c.key === 'ten') return h.em ? lkHv(h.em.id, h.em.ten) : mo('—');
    if (c.key === 'lop') return h.lop ? lkLop(h.lop.id, h.lop.ma) : mo('—');
    if (c.key === 'han') return <span className="tabular-nums">{ddmm(h.han)}</span>;
    return ttVc(h);
  };
  /* Dòng phụ: kỹ năng / tuần Test dưới tên việc; ngày làm (nhập điểm / ghi kết quả) dưới tình trạng. */
  /* Tab "Đã làm": dòng phụ ghi loại việc (các loại chung một tab). */
  /* Chủ SP 09/11: tab Đã làm chỉ ghi loại việc khi có nhiều loại — một loại thì không lặp "Case – PA – Kết quả" trên mọi dòng. */
  const nhieuLoai = new Set(tatVc.map((h) => h.tab)).size > 1;
  /* Sổ nghĩa vụ: dòng phụ Việc — loại việc (nhiều loại) · tuần · chi nhánh (xem tổng) · "phân công nhập sau"; Hạn — "hạn gốc …" khi đã đặt lại hạn. */
  const phuVc = (h: HVc, c: DinhNghiaCot) => (c.key === 'viec'
    ? ([!laBai && nhieuLoai ? dich(TAB_VIEC_HAN_LABEL[h.tab]) : null, h.phu ? dich(h.phu) : null, h.chiNhanh ?? null, h.pcNhapSau ? t('phân công nhập sau') : null].filter(Boolean).join(' · ') || null)
    : c.key === 'han' ? (h.hanGoc ? t('hạn gốc {ngay}', { ngay: ddmm(h.hanGoc) }) : null) : c.key === 'tt' ? ngayLam(h) : null);
  const theVc = (h: HVc) => (
    <div className="grid gap-1">
      <div className="flex items-baseline gap-2 text-[15px]">{oVc(h, cotVc[0])}<span className="ml-auto whitespace-nowrap text-[14px]">{ttVc(h)}</span></div>
      {(h.em || h.lop) && <div className="text-[14px]">{h.em && lkHv(h.em.id, h.em.ten)}{h.em && h.lop && ' · '}{h.lop && lkLop(h.lop.id, h.lop.ma)}</div>}
      <div className="text-[13px] text-dim">{t('Hạn')} {ddmm(h.han)}{h.hanGoc && <> ({t('hạn gốc {ngay}', { ngay: ddmm(h.hanGoc) })})</>}{h.ngayXong && <> · {ngayLam(h)}</>}{phuVc(h, cotVc[0]) && <> · {phuVc(h, cotVc[0])}</>}</div>
    </div>
  );

  const tat = (vk ? tatVc : tt ? tatH : bt ? tatB : tg ? tatT : vpk ? [...tatV, ...tatVe, ...tatVl] : pak ? tatP : tatL) as { studentId?: number }[];
  const soDong = tat.length;
  const soHv = new Set(tat.map((h) => h.studentId).filter((x) => x !== undefined)).size;
  const dem = vk ? (laBai ? t('{n} bài', { n: soDong }) : t('{n} việc', { n: soDong }))
    : vpk ? (tatVl.length ? t('{n} lớp', { n: soDong }) : tatVe.length ? t('{n} HV', { n: soDong }) : `${t('{n} vi phạm', { n: soDong })} · ${t('{n} HV', { n: soHv })}`)
    : pak ? `${nghiaVu ? t('{n} việc', { n: soDong }) : t('{n} PA', { n: soDong })} · ${t('{n} HV', { n: soHv })}`
    : (tg || tt) && soDong === soHv ? t('{n} HV', { n: soHv })
    : `${bt ? t('{n} bài', { n: soDong }) : t('{n} lượt', { n: soDong })} · ${t('{n} HV', { n: soHv })}`;
  const dong2 = [data && 'chiNhanh' in data ? data.chiNhanh ?? t('Tất cả chi nhánh') : null, tt ? t('Thi thật') : bt ? t('Lớp thường') : vpk || pak || vk ? null : 'Fast Track',
    bt && data?.nguong != null ? t('đạt từ {n} % mỗi môn', { n: data.nguong }) : null, vpk && tatV.length ? t('mới nhất trước') : null,
    tg ? t('so mốc MT trước') : t('dữ liệu đến {ngay}', { ngay: ngay(homNay).slice(0, 5) }), tt && /^W[12]$/.test(knNhan ?? '') ? t('{kn} tính nửa W', { kn: knNhan! }) : null].filter(Boolean).join(' · ');
  return (
    <KhungPanel tieuDe={tieuDe} rong="bang" onDong={onDong} loai={loai} dau={{ dong2: [dong2],
      /* BO-CHU-THICH (chủ SP 07/11): "Cách tính" là ⓘ cuối dòng tiêu đề như `NganDanhSach` — không còn khối chữ cuối panel. */
      tieu: data?.cachTinh ? <><span className="min-w-0">{tieuDe}</span><NutLuat label={t('Cách tính')}>{dich(data.cachTinh)}</NutLuat></> : undefined }} chan={{ huy: { nhan: t('Đóng'), onClick: onDong } }}>
      {error ? <div className="pt-3"><ErrorState message={error.message} hint={error.hint} status={error.status} onRetry={reload} /></div>
        : loading || !data ? <div className="pt-3"><Skeleton rows={4} /></div>
          : (
            <div className="pn-bang grid gap-3 pt-3">
              {vk && tabsViec.length > 0 && (
                /* DEM-QUA-HAN b: tab loại việc (chỉ việc quá hạn, số đỏ) + "Đã làm" — cùng dáng tab Chưa đạt · Đạt. */
                <div role="tablist" aria-label={t('Trạng thái')} onKeyDown={phimHangTab} className="-mx-4 -mt-3 flex flex-wrap border-b px-4" style={{ borderColor: 'var(--line)' }}>
                  {tabsViec.map((k) => {
                    /* Sổ nghĩa vụ: số tab = 3 số riêng (như ô bảng); bài S chéo chung ghi "+n" mờ riêng. */
                    const n = goc.filter((r) => r.dongViec && ttViec(r.dongViec) === k && !r.dongViec.sChung).length;
                    const chung = goc.filter((r) => r.dongViec && ttViec(r.dongViec) === k && r.dongViec.sChung).length;
                    return (
                      <button key={k} type="button" role="tab" aria-selected={tabViec === k} tabIndex={tabViec === k ? 0 : -1} onClick={() => setTabViec(k)}
                        className={`-mb-px min-h-[44px] border-b-2 px-3 text-sm ${tabViec === k ? 'border-[color:var(--accent)] font-semibold text-slate-100' : 'border-transparent font-medium text-slate-400 hover:text-slate-200'}`}>
                        {nhanTabViec(k)} <span className={`tabular-nums ${k === 'chua' && n ? 'text-bad' : ''}`}>{n}</span>
                        {chung > 0 && <span className="tabular-nums font-normal text-dim" title={t('+ {n} S chéo chung', { n: chung })}> +{chung}<span className="sr-only"> {t('S chéo chung')}</span></span>}
                      </button>
                    );
                  })}
                </div>
              )}
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
              <span className="text-sm text-dim"><b className="tabular-nums text-[15px] text-slate-100">{soDong}</b> {(data.dem ?? dem).replace(/^\d+\s*/, '')}</span>
              {vk
                /* Sổ nghĩa vụ: tab Chưa làm có bài S chéo chung → hai nhóm "Bài của bạn" / "S chéo chung · chưa ai nhận" (máy chủ xếp nhóm riêng sau). */
                ? (tabViec === 'chua' && tatVc.some((h) => h.sChung) ? [[t('Bài của bạn'), false], [t('S chéo chung · chưa ai nhận'), true]] as const : [[null, null]] as const).map(([nhom, chung]) => {
                  const hang = pt.cat(tatVc).filter((h) => chung === null || !!h.sChung === chung);
                  if (!hang.length) return null;
                  return (
                    <section key={String(chung)} className="grid gap-1.5" aria-label={nhom ?? tieuDe}>
                      {nhom && <h3 className="m-0 text-[14px] font-semibold text-dim">{nhom} <span className="tabular-nums">{tatVc.filter((h) => !!h.sChung === chung).length}</span></h3>}
                      <Bang deu day ten={nhom ? `${tieuDe} · ${nhom}` : tieuDe} cot={cotVc} hang={hang} khoa={(h) => h.id} oCua={oVc} phuCua={phuVc} khung={false} theRieng={theVc} />
                    </section>
                  );
                })
              : tt
                ? <Bang deu day ten={tieuDe} cot={cotH} hang={hangH} khoa={(h) => h.id} oCua={oH} khung={false} theRieng={theH} />
              : vpk ? (tatVl.length ? <Bang deu day ten={tieuDe} cot={cotVl} hang={pt.cat(tatVl)} khoa={(h) => h.id} oCua={oVl} khung={false} />
                : tatVe.length ? <Bang deu day ten={tieuDe} cot={cotVe} hang={pt.cat(tatVe)} khoa={(h) => h.id} oCua={oVe} khung={false} />
                : <Bang deu day ten={tieuDe} cot={cotV} hang={pt.cat(tatV)} khoa={(h) => h.id} oCua={oV} phuCua={(h, c) => (c.key === 'vp' && h.moTa ? h.moTa : null)} khung={false} theRieng={theV} />)
              : pak ? <Bang deu day ten={tieuDe} cot={cotP} hang={pt.cat(tatP)} khoa={(h) => h.id} oCua={oP} phuCua={(h, c) => (c.key === 'pa' && h.moTa ? h.moTa : c.key === 'lop' && h.batDau && !nghiaVu ? t('từ {tuan}', { tuan: tuanLich(h.batDau, homNay) }) : null)} khung={false} theRieng={theP} />
              : bt ? nhomB.map((g) => (
                /* A3: tên chương trình (khi panel có hơn một) trên mỗi bảng. */
                <section key={g.ct} className="grid gap-1.5" aria-label={g.ct}>
                  {nhomB.length > 1 && <h3 className="m-0 text-[14px] font-semibold text-dim">{dich(g.ct)}</h3>}
                  <Bang deu day ten={`${tieuDe} · ${g.ct}`} cot={cotB(g.hang)} hang={g.hang} khoa={(h) => h.id} oCua={oB(g.hang)}
                    phuCua={(h, c) => (c.key === 'bai' ? tuanLich(h.tuan, homNay) : null)} khung={false} theRieng={theB(g.hang)} />
                </section>
              ))
              : tg
                ? <Bang deu ten={tieuDe} cot={cotT} hang={hangT} khoa={(h) => h.id} oCua={oT} khung={false} theRieng={theT} />
                : <Bang deu day ten={tieuDe} cot={cotL} hang={hangL} khoa={(h) => h.id} oCua={oL} phuCua={(h, c) => (c.key === 'mt' ? tuanLich(h.tuan, homNay) : null)} khung={false} theRieng={theL} />}
              <XemThem {...pt} donVi={t('mục')} />
            </div>
          )}
    </KhungPanel>
  );
}
