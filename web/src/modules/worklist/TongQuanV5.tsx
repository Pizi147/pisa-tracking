import { useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useApi } from '../../lib/useApi.ts';
import { invalidate } from '../../lib/api.ts';
import { useSession } from '../../lib/session.tsx';
import { useDemYeuCau, useSoViecCuaToi } from '../../lib/viecCuaToi.ts';
import { useThamSoUrl } from '../../lib/quayLai.ts';
import { Card, ErrorState, OChiSo, Skeleton } from '../../ui/ui.tsx';
import { OSo } from '../../ui/OSo.tsx';
import { DaiChiSo as DaiChiSoMong, ODai, SoDen as SoDenDai, SoTinh } from '../../ui/DaiChiSo.tsx';
import { LOP_OSO, VUNG_BAM_SO } from '../../ui/SoLieu.tsx';
import { Bang, type CotBang } from '../../ui/Bang.tsx';
import { ChipHan, CHIP_SOS, lopSos } from '../../ui/Nhan.tsx';
import { NutLuat } from '../../ui/NutLuat.tsx';
import { useDienThoai } from '../../ui/TheDong.tsx';
import { KhungPanel } from '../../ui/KhungPanel.tsx';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import { TheYeuCau } from '../duyet/TheYeuCau.tsx';
import { rateView, thamSoCt, tuanLich, type ChuongTrinh, type PhanTichGvKq, type OPtGv, type TheYeuCauDto } from '@shared/domain/index.ts';
import { dich, t } from '@shared/i18n/index.ts';

/**
 * TỔNG QUAN V5 (UI-TONG-QUAN, `thiet-ke/v5/tong-quan.html` phương án B "Tình hình trái · Điều hướng phải"). Không ô nhập trên trang (C04): số gạch chân
 * = panel chỉ đọc (cùng hàm Phân tích), "›" = đổi trang, "?" = giải thích. Mỗi vai một hàm vẽ; dữ liệu QL / QT / CX từ MỘT GET `/tong-quan/v5`.
 */
/** `pt` (thi thật GV, 2F): % theo tuần dạy — thay `dat / mau` khi có. */
export type TyLeV5 = { dat: number; mau: number; pt?: number };
type DongLop = { id: number; khoa: string; ma: string; hv: number; gvcn: string | null; datMt: TyLeV5 | null; sos: [number, number, number]; caseChuaPa: number; thiThangNay: number };
type DongCn = { id: number; khoa: string; ten: string; datMt: TyLeV5 | null; casePa: { coPa: number; mo: number }; thiThat: TyLeV5 | null; thiThangNay: number; sos23: number; sos23Ids: number[]; caseChuaPa: number };
type GvTre = { khoa: number; ten: string; bai: number };
export type TongQuanV5Data = {
  homNay: string; ky: { tu: string; den: string }; ct: ChuongTrinh; branchId: number | null; tenChiNhanh: string | null;
  datMt: (TyLeV5 & { chuaDu: number }) | null; casePa: { coPa: number; mo: number; chuaPa: number }; thiThangNay: number; thiThat: TyLeV5 | null;
  lop: DongLop[] | null; chiNhanh: DongCn[] | null; tre: GvTre[]; caseGv: Record<number, { coPa: number; mo: number }>;
};

/** Tham số chung của mọi đường trên trang (chi nhánh + khung). */
/** M6 6b-4 (Q5, Q8): ô "n" Quá hạn của GV → panel GV chấm quá hạn (lớp · lượt · kỹ năng → em còn trống → Nhập hộ), cùng tập Trễ chấm. */
const GV_TRE_QL = {
  loai: t('Số liệu · Tổng quan'), trong: t('Giáo viên này không còn bài trễ chấm'),
  cachTinh: t('Bài = ô kỹ năng còn trống của em đã thi (W1, W2 tính riêng), đã qua hạn chấm. Cùng tập với cột "Quá hạn" của bảng GV cần chú ý; Speaking chấm chéo chưa ai nhận vẫn tính quá hạn.'),
};
export const thamSoTq = (branchId: number | null, ct: ChuongTrinh) => `${branchId ? `branchId=${branchId}` : ''}${thamSoCt(ct)}`.replace(/^&/, '');

/* ───────────── khung chung ───────────── */

/** Đầu trang một hàng: "Tổng quan" · phạm vi · mã tuần (· kỳ số liệu — SUA-CHAM-LAI L6: ghi MỘT lần cho cả trang) — bộ chọn (chi nhánh, khung) bên phải. */
/** AUDIT-UI B1 (chủ SP 08/11): link không có chỗ khác (ô số, menu) đứng cạnh tiêu đề — thay thẻ "Điều hướng". */
export type LienKetTq = { to: string; nhan: string; goiY?: string };
export function DauTrangTq({ phamVi, ben, ky, lienKet }: { phamVi: ReactNode; ben?: ReactNode; ky?: { tu: string; den: string } | null; lienKet?: LienKetTq[] }) {
  const { homNay } = useNgayNghiepVu();
  return (
    <header className="flex min-h-10 flex-wrap items-center gap-x-3 gap-y-2">
      <h1 className="m-0 text-[22px] font-bold leading-[1.3] text-slate-100">{t('Tổng quan')}</h1>
      {/* AUDIT-UI TQ1: GV không có phạm vi (tên chính mình đã ở nút tài khoản) → bắt đầu bằng mã tuần, không "·" thừa. */}
      <span className="text-sm text-slate-400 max-sm:basis-full">{phamVi}{homNay && <>{phamVi ? ' · ' : ''}<b className="font-bold text-[color:var(--accent)]">{tuanLich(homNay)}</b></>}
        {ky && <> · {t('kỳ {ky}', { ky: kyChu(ky) })}</>}</span>
      {(ben || !!lienKet?.length) && (
        <span className="flex flex-wrap items-center gap-x-3.5 gap-y-2 max-sm:w-full sm:ml-auto">
          {!!lienKet?.length && <span className="flex flex-wrap items-center gap-x-4">{lienKet.map((l) => (
            <Link key={l.to} to={l.to} title={l.goiY} className="inline-flex items-center whitespace-nowrap text-sm font-semibold text-[color:var(--accent)] no-underline hover:underline max-sm:min-h-[44px]">{l.nhan} ›</Link>
          ))}</span>}
          {ben && <span className="flex flex-wrap items-center gap-2 max-sm:w-full">{ben}</span>}
        </span>
      )}
    </header>
  );
}

/**
 * Ô chỉ số V5: tên (+ ⓘ) · giá trị · MỘT dòng phụ (đơn vị / mẫu số). TQ-GON (M3, M4): kỳ xem ("trong kỳ" · "hiện tại" · khoảng tuần) không thành dòng —
 * đầu trang đã ghi kỳ một lần; rê chuột tên ô thấy (`title`).
 */
export function ChiSo({ ten, tenNgan, giaTri, mau, ky, luat }: { ten: string; /** Tên ngắn ở < 640 (mockup B2 "Chưa chốt LT tiếp"); tên đủ khi rê. */ tenNgan?: string; giaTri: ReactNode; mau?: ReactNode; ky?: string; luat?: ReactNode }) {
  const chu = tenNgan ? <><span className="max-sm:hidden">{ten}</span><span className="sm:hidden" title={ten}>{tenNgan}</span></> : ten;
  return (
    <OChiSo className="ca-o max-sm:p-3" ten={<span className="inline-flex items-center gap-1.5" title={ky}>{chu}{luat && <NutLuat label={ten}>{luat}</NutLuat>}</span>} giaTri={giaTri} mau={mau} />
  );
}
/** `nam`: 5 ô một hàng ở ≥ 1024 (CX — AUDIT-UI B2 đồng bộ: mỗi ô một số). */
/** GD-14 (⑧ T3): `sau` — 6 ô một hàng (Quản trị: Việc · Chờ duyệt · Đạt MT · Đạt Target · Case chưa có PA · Thi tháng này). */
export const DaiChiSo = ({ children, nam, sau }: { children: ReactNode; nam?: boolean; sau?: boolean }) => <div data-hd="tq-tom-tat" className={`grid grid-cols-2 gap-2 sm:gap-3 ${sau ? 'lg:grid-cols-6' : nam ? 'lg:grid-cols-5' : 'lg:grid-cols-4'} max-lg:[&>*:last-child:nth-child(odd)]:col-span-2`}>{children}</div>;

/** % to gạch chân bấm mở panel đúng tập; mẫu 0 → "Chưa có dữ liệu" (T19), không "0 %". */
export function PhanTram({ x, nguon, tieuDe, gon, vung, className }: { x: TyLeV5 | null; nguon: string; tieuDe: string; /** Ô bảng: mẫu 0 → "—" (chữ đầy đủ cho trình đọc màn). */ gon?: boolean; vung?: string;
  /** O-TQ-BAM: `so-chinh` = số chính của ô chỉ số — cả ô bấm mở panel này. */ className?: string }) {
  if (!x) return <span className="text-slate-500">—</span>;
  const v = rateView(x.dat, x.mau);
  if (v.kind !== 'value') return gon ? <span className="text-slate-500" title={t('Chưa có dữ liệu')} aria-label={t('Chưa có dữ liệu')}>—</span>
    : <ChuaCoDl />;
  return <OSo giaTri={x.mau} nhan={`${x.pt ?? v.percent} %`} nguon={nguon} tieuDe={tieuDe} vung={vung} className={className} />;
}
/** V8-TQ (mockup `.chua-dl`): "– Chưa có dữ liệu" là viên viền đứt — cùng dáng "Chưa đủ dữ liệu", không chữ đậm trơn. */
export const ChuaCoDl = () => (
  <span className="chua-dl my-1 inline-flex h-[26px] items-center self-start rounded border border-dashed px-2 text-[13px] font-semibold text-slate-500" style={{ borderColor: 'var(--thieu-vien)' }}>– {t('Chưa có dữ liệu')}</span>
);
/** Ô số dẫn sang trang khác (TVV / CX): cùng dáng ô số (gạch chân nhấn); 0 mờ, không bấm. `so-chinh` (O-TQ-BAM): cả ô chỉ số đổi trang tới `to`. */
const SoDen = ({ n, to, className = '' }: { n: number; to: string; className?: string }) => (n > 0 ? <Link to={to} className={`${VUNG_BAM_SO} ${LOP_OSO} ${className}`}>{n}</Link> : <span className="font-normal text-faint">{n}</span>);   // AUDIT-UI C2: số 0 mờ (text-faint 400) để số thật nổi
/** O-TQ-BAM: ô đổi trang → tên thêm "›" khi số chính bấm được (> 0). */
const tenDen = (ten: string, n: number) => (n > 0 ? `${ten} ›` : ten);   // không ngắt: 375 xuống dòng thì "›" đi cùng chữ cuối

/**
 * SOS MỘT KIỂU (mockup v8: Lớp cần chú ý, Lớp tôi chủ nhiệm, đầu Hồ sơ lớp): chip mức (MAU-MUC) + ô số HV ngoài chip + "HV" chữ phụ, mỗi mức một cụm
 * không xuống dòng; mức 0 không vẽ. 1440 một dòng, 375 xuống dòng giữa các cụm.
 */
export function SosDem({ muc, o }: { muc: readonly number[]; o: (i: number, n: number) => ReactNode }) {
  return (
    <span className="inline-flex flex-wrap items-center gap-x-3.5 gap-y-1.5 sm:flex-nowrap">
      {muc.map((n, i) => n > 0 && (
        <span key={i} className="inline-flex items-center gap-1.5 whitespace-nowrap">
          {/* AUDIT-UI B1: đơn vị "HV" ở tiêu đề cột ("SOS hiện tại · HV"), ô chỉ còn chip + số. */}
          <span className={`${CHIP_SOS} ${lopSos(i + 1)}`}>SOS {i + 1}</span>{o(i, n)}
        </span>
      ))}
    </span>
  );
}
/** `donVi` bỏ trống khi đơn vị đã ở tiêu đề cột (AUDIT-UI B1) — ô bảng chỉ "11/14". */
export const tuMau = (x: TyLeV5 | null, donVi?: string) => (x && x.mau ? `${x.dat}/${x.mau}${donVi ? ` ${donVi}` : ''}` : null);
/**
 * SỔ NGHĨA VỤ (PR-2): dòng phụ của ô Chấm Test / Việc — 3 số RIÊNG "n đúng hạn · n làm muộn · n chưa làm" (số 0 của muộn / chưa làm không ghi; chưa làm đậm đỏ,
 * có chữ — không chỉ màu) + dòng nhỏ "+ n S chéo chung" (bài S chéo chưa ai nhận của chi nhánh, không vào tỉ lệ). Ô không có 3 số → `tuMau` như cũ.
 */
export function PhuSo3({ o }: { o: OPtGv | undefined }) {
  if (!o || o.k === 'na') return null;
  const s = o.k === 'so' && o.muon != null ? o : null;
  const chung = o.sChung ?? 0;
  if (!s) return chung ? <span className="block text-[12px] text-dim">{t('+ {n} S chéo chung', { n: chung })}</span> : o.k === 'so' ? <>{tuMau(tyLeGv(o))}</> : null;
  const phan = [t('{n} đúng hạn', { n: s.dung }), s.muon ? t('{n} làm muộn', { n: s.muon }) : null].filter(Boolean) as string[];
  return (
    <>
      <span className="inline-flex flex-wrap justify-[inherit] gap-x-1 tabular-nums">
        {phan.map((x, i) => <span key={i} className="whitespace-nowrap">{x}{i < phan.length - 1 || (s.chua ?? 0) > 0 ? ' ·' : ''}</span>)}
        {(s.chua ?? 0) > 0 && <span className="whitespace-nowrap font-semibold text-bad">{t('{n} chưa làm', { n: s.chua })}</span>}
      </span>
      {chung > 0 && <span className="block text-[12px] text-dim">{t('+ {n} S chéo chung', { n: chung })}</span>}
    </>
  );
}
/** U09 #5 (B01, mockup v11): Đạt MT "26/36 HV · 8 chưa đủ dữ liệu" — không giấu em ngoài mẫu. */
/* GD-14 (lời 37, ⑧ mục 10): dòng phụ ô số tối đa một ý, chỉ khi cần — "8 HV chưa đủ dữ liệu"; mẫu "2/3 HV" xem ở panel của ô. */
export const mauDatMt = (x: (TyLeV5 & { chuaDu: number }) | null) => (!x || !x.chuaDu ? null : t('{n} HV chưa đủ dữ liệu', { n: x.chuaDu }));

/**
 * Bố cục B: trái (tình hình) · phải 400 (Chờ bạn duyệt — AUDIT-UI B1: bỏ thẻ "Điều hướng", mockup B1 cột phải 400); < 1280 một cột, cột phải lên trước.
 * Không có gì cho cột phải → bảng rộng hết trang.
 */
export function BoCuc({ trai, phai }: { trai: ReactNode; phai?: ReactNode }) {
  if (phai === undefined) return <div className="flex min-w-0 flex-col gap-4">{trai}</div>;
  return (
    <div className="grid items-start gap-4 min-[1280px]:grid-cols-[minmax(0,1fr)_400px]">
      <div className="flex min-w-0 flex-col gap-4 max-[1279px]:order-2">{trai}</div>
      <div className="flex min-w-0 flex-col gap-4">{phai}</div>
    </div>
  );
}

/** Công tắc hai nút ngoài tiêu đề bảng (đầu thẻ). */
/** `v8` (mockup v8 `.doan.nho`): khối liền cao 30 (375: 44 full bề rộng, chia đều), mục chọn đậm chữ chính + gạch đáy 2 px nhấn. */
export function CongTac<K extends string>({ value, onChange, muc, v8 }: { value: K; onChange: (k: K) => void; muc: [K, string][]; v8?: boolean }) {
  return (
    <span role="group" aria-label={t('Lọc')} className={`inline-flex overflow-hidden rounded-lg border ${v8 ? 'max-sm:w-full' : ''}`} style={{ borderColor: 'var(--line-strong)' }}>
      {muc.map(([k, nhan], i) => (
        <button key={k} type="button" aria-pressed={value === k} onClick={() => onChange(k)} style={v8 ? { borderColor: 'var(--line-strong)' } : undefined}
          className={v8 ? `min-h-[44px] whitespace-nowrap px-2.5 text-[13px] max-sm:flex-1 max-sm:text-sm sm:min-h-[28px] ${i ? 'border-l' : ''} ${value === k
            ? 'bg-[color:var(--accent-soft)] font-bold text-slate-100 shadow-[inset_0_-2px_0_var(--accent)]' : 'font-medium text-slate-400 hover:text-slate-200'}`
            : `min-h-[44px] px-3 text-[13px] sm:min-h-[30px] ${value === k ? 'bg-[color:var(--accent-soft)] font-semibold text-[color:var(--accent)]' : 'text-slate-400'}`}>{nhan}</button>
      ))}
    </span>
  );
}

export const kyChu = (k: { tu: string; den: string }) => `${tuanLich(k.tu)} – ${tuanLich(k.den)}`;
const kyQ = (d: TongQuanV5Data) => `&kieu=tuy-chon&tu=${d.ky.tu}&den=${d.ky.den}`;
const qBc = (d: TongQuanV5Data, them = '') => `/phan-tich/bao-cao/o?${thamSoTq(d.branchId, d.ct)}${kyQ(d)}${them}`;
/** Ô "Thi tháng này" (QL, QT): TQ-GON (M4) — định nghĩa "HV có ngày thi đã chốt" vào ⓘ, dòng phụ chỉ đơn vị. */
const LUAT_THI = t('HV có ngày thi thật đã chốt trong tháng này.');
const ChiSoThi = ({ d }: { d: TongQuanV5Data }) => (
  <ChiSo ten={t('Thi tháng này')} ky={t('hiện tại')} luat={LUAT_THI} giaTri={<OSo giaTri={d.thiThangNay} tieuDe={t('Thi tháng này')} nguon={qBc(d, '&o=thi-thang-nay')} className="so-chinh" />} />
);
/**
 * GD-14 (⑧ XM-2, XM-14): ô "Case chưa có PA" — số to = Case chưa có PA (panel `caseChuaChot`), dòng phụ "trong 45 Case đang mở" (số 45 → panel Case đang mở,
 * nổi trên lớp phủ cả ô). Một tên cho ô, cột bảng, tiêu đề panel. Thay ô "Case có PA %" (cùng hai số: chưa có = mở − có PA).
 */
function ChiSoCaseChuaPa({ d }: { d: TongQuanV5Data }) {
  /* PTA rà #1710 (mockup ⑧ T7a/b): số phụ là chữ số gạch chân (`.so-phu`), không hộp lẻ; 375 gọn "trong 58 đang mở" một dòng. */
  const dienThoai = useDienThoai();
  return (
    <ChiSo ten={t('Case chưa có PA')} ky={t('hiện tại')}
      giaTri={<OSo giaTri={d.casePa.chuaPa} tieuDe={t('Case chưa có PA')} nguon={qCn(d, 'caseChuaChot', 'tong')} className="so-chinh" />}
      mau={d.casePa.mo ? <span className="whitespace-nowrap">{t('trong')} <OSo giaTri={d.casePa.mo} tieuDe={t('Case đang mở')} nguon={qCn(d, 'caseMo', 'tong')} className="so-phu" /> {dienThoai ? t('đang mở') : t('Case đang mở')}</span> : null} />
  );
}
/** GD-14 (⑧ T1, T3): ô "Chờ duyệt ›" — số = thẻ chờ bạn duyệt; dòng phụ chỉ khi có quá hạn (lời 37). 0 → mờ, không "›", không bấm. */
const ChiSoChoDuyet = ({ n, quaHan }: { n: number; quaHan: number }) => (
  <ChiSo ten={tenDen(t('Chờ duyệt'), n)} ky={t('hiện tại')} giaTri={<SoDen n={n} to="/cong-viec?nhom=duyet" className="so-chinh" />}
    mau={quaHan > 0 ? <span className="font-semibold text-bad">{t('{n} quá hạn', { n: quaHan })}</span> : null} />
);
const qCn = (d: TongQuanV5Data, cot: string, khoa: string) => `/tong-quan/chi-nhanh/o?cot=${cot}&khoa=${khoa}&chuY=1&${thamSoTq(d.branchId, d.ct)}`;

/* ───────────── Chờ bạn duyệt (dòng gọn → panel duyệt, C04) ───────────── */

type Hop = { the: TheYeuCauDto[]; homNay: string };
/** Số đếm đầu khối (⑤ G2): khung viền nhỏ cạnh tên khối — "Chờ duyệt 10", "Lớp cần chú ý 4". */
export const DemDau = ({ n }: { n: number }) => (
  <span className="ml-2 inline-flex h-[22px] min-w-[22px] items-center justify-center rounded border px-[7px] align-middle text-xs font-semibold tabular-nums text-[color:var(--text)]"
    style={{ borderColor: 'var(--line-strong)', background: 'var(--surface)' }}>{n}</span>
);
function ChoDuyetGon({ hop, onXong }: { hop: Hop; onXong: () => void }) {
  const [mo, setMo] = useState<TheYeuCauDto | null>(null);
  /* GD-14 (⑧ XM-6): 5 dòng đầu + "+ n yêu cầu" mở thêm tại chỗ — bỏ "Hộp duyệt ›" (trùng đích ô "Chờ duyệt ›" cùng màn). */
  const [het, setHet] = useState(false);
  if (!hop.the.length) return null;
  const con = hop.the.length - 5;
  return (
    <Card title={<>{t('Chờ duyệt')}<DemDau n={hop.the.length} /></>} bodyClass="p-0">
      <ul data-hd="tq-can-xu-ly" className="m-0 list-none p-0">
        {(het ? hop.the : hop.the.slice(0, 5)).map((y) => (
          <li key={y.id} className="border-t" style={{ borderColor: 'var(--line)' }}>
            {/*
              * TQ-GON (M1, M4, M10 — cùng dáng Chờ bạn duyệt ở Công việc v12): MỘT dòng = loại (chip viền) · tên em (đậm duy nhất) · hạn (viên theo mức).
              * Lớp · lượt · người gửi không thành dòng thứ hai: rê chuột (`title`) hoặc bấm dòng → panel duyệt đủ chữ.
              */}
            <button type="button" onClick={() => setMo(y)} title={[y.lop, y.phu && dich(y.phu), y.nguoiXin && t('gửi bởi {ten}', { ten: y.vaiNguoiXin ? `${y.nguoiXin} (${t(y.vaiNguoiXin)})` : y.nguoiXin })].filter(Boolean).join(' · ') || undefined}
              className={`bam grid min-h-[44px] w-full grid-cols-[96px_minmax(0,1fr)_auto] items-center gap-x-2.5 gap-y-1 px-4 py-2 text-left leading-[1.45] max-sm:grid-cols-[auto_minmax(0,1fr)] ${mo?.id === y.id ? 'dang-mo' : ''}`}>
              {/* RA-GD-0711c: tên em giữ một dòng — thiếu chỗ thì chữ chip xuống dòng trong chip (không cắt "…"). NHAN-MOT-DONG (audit C5): tên loại
                * ngắn + chip rộng tối thiểu bằng tên loại thường gặp ("Xử lý Ý thức") → chip một dòng, tên em thẳng cột (khối hẹp 360 px ở 1440 cũng vậy). */}
              {/* AUDIT-UI B1 (chủ SP 08/11): cột loại cố định 96 px; "Không cần theo dõi" quá dài → nhãn ngắn, tên đủ khi rê. */}
              <span className="justify-self-start whitespace-nowrap rounded-md border px-1.5 py-px text-xs font-medium leading-4 text-dim" style={{ borderColor: 'var(--line-strong)' }}
                title={y.loai === 'khong_theo_doi' ? dich(y.nhanLoai) : undefined}>{y.loai === 'khong_theo_doi' ? <><span aria-hidden>{t('Không theo dõi')}</span><span className="sr-only">{dich(y.nhanLoai)}</span></> : dich(y.nhanLoai)}</span>
              {/* PTA rà #1710 (⑧ T7 "Chờ bạn duyệt 375 hai hàng"): tên em KHÔNG cắt "…" — xuống dòng; 375: hàng 1 loại · hạn, hàng 2 tên em đủ chữ. */}
              <span className="min-w-0 break-words text-sm font-semibold text-slate-100 max-sm:col-span-2 max-sm:row-start-2">{y.hocVien ?? y.lop ?? dich(y.tieuDe)}</span>
              {/* AUDIT-UI B1 (mockup `.td-han`): hạn chỉ chữ, không viên. */}
              {y.hanDuyet && <span className="max-sm:col-start-2 max-sm:row-start-1 max-sm:justify-self-end"><ChipHan vien loai="duyet" han={y.hanDuyet} /></span>}
            </button>
          </li>
        ))}
      </ul>
      {con > 0 && !het && (
        <div className="border-t px-4 py-2.5" style={{ borderColor: 'var(--line)' }}>
          <button type="button" className="btn btn-sm min-h-[44px] sm:min-h-[30px]" onClick={() => setHet(true)}>{t('+ {n} yêu cầu', { n: con })}</button>
        </div>
      )}
      {mo && (
        /* N37: thẻ về PA / Case có "Mở ›" sang hồ sơ em (Case mở sẵn) — như hộp Chờ duyệt. */
        /* TQ-GON: dòng chỉ còn tên em → đầu panel ghi em · lớp (lớp không còn ở dòng). */
        <KhungPanel hd="duyet" loai={t('Duyệt')} tieuDe={mo.tieuDe} hocVien={mo.hocVien} lop={mo.lop} onDong={() => setMo(null)}
          chan={mo.mo ? { phu: <Link to={mo.mo} className="btn min-h-[44px] sm:min-h-[36px]">{t('Mở ›')}</Link> } : undefined}>
          <TheYeuCau yc={mo} gon onXong={() => { setMo(null); onXong(); }} />
        </KhungPanel>
      )}
    </Card>
  );
}

/* ───────────── QL (một chi nhánh) ───────────── */

const COT_LOP: readonly CotBang[] = [
  /* V8: SOS 340 căn trái một dòng (chip + số ngoài chip); 375 thẻ lưới — SOS (`chu`) hàng riêng dưới. */
  { key: 'lop', nhan: t('Lớp'), kieu: 'ten', linhHoat: true }, { key: 'dat', nhan: t('Đạt MT'), dv: t('HV'), kieu: 'phan-tram', rong: 120 }, { key: 'sos', nhan: t('SOS hiện tại'), dv: t('HV'), kieu: 'chu', rong: 340 },
  { key: 'case', nhan: t('Case chưa có PA'), kieu: 'so', rong: 150 }, { key: 'thi', nhan: t('Thi tháng này'), dv: t('HV'), kieu: 'so', rong: 150 },
];
const coVanDe = (l: DongLop) => l.sos.some((n) => n > 0) || l.caseChuaPa > 0 || l.thiThangNay > 0 || (!!l.datMt && l.datMt.dat < l.datMt.mau);

/** Chủ SP 23/10: không nút lọc — bảng chỉ 5 lớp cần chú ý nhất (SOS 3 → SOS 2 → Case chưa PA → SOS 1 → Thi tháng này), không xếp theo %. */
const mucChuY = (l: DongLop) => [l.sos[2], l.sos[1], l.caseChuaPa, l.sos[0], l.thiThangNay];
const soMuc = (a: DongLop, b: DongLop) => { const x = mucChuY(a), y = mucChuY(b); const i = x.findIndex((v, k) => v !== y[k]); return i < 0 ? 0 : y[i] - x[i]; };

function LopCanChuY({ d }: { d: TongQuanV5Data }) {
  const ds = (d.lop ?? []).filter(coVanDe).sort(soMuc).slice(0, 5);
  const oCua = (l: DongLop, c: CotBang): ReactNode => {
    if (c.key === 'lop') return <Link to={`/hoc-vien/lop/${l.id}`} className="ten-ho-so font-semibold">{l.ma}</Link>;
    if (c.key === 'dat') return <PhanTram gon x={l.datMt} nguon={qBc(d, `&o=dat-mt&lop=${l.id}`)} tieuDe={t('Đạt MT · {lop}', { lop: l.ma })} />;
    if (c.key === 'sos') {
      if (!l.sos.some((n) => n > 0)) return <span className="text-slate-500">—</span>;
      /* Chủ SP 23/10: chip chỉ ghi mức, số HV đứng ngoài chip — bấm số → panel danh sách em. */
      return <SosDem muc={l.sos} o={(i, n) => <OSo giaTri={n} tieuDe={`SOS ${i + 1} · ${l.ma}`} nguon={qCn(d, `sos${i + 1}`, l.khoa)} />} />;
    }
    if (c.key === 'case') return <OSo giaTri={l.caseChuaPa} tieuDe={t('Case chưa có PA · {lop}', { lop: l.ma })} nguon={qCn(d, 'caseChuaChot', l.khoa)} />;
    return <OSo giaTri={l.thiThangNay} tieuDe={t('Thi tháng này · {lop}', { lop: l.ma })} nguon={qBc(d, `&o=thi-thang-nay&lop=${l.id}`)} />;
  };
  /* GD-14 (lời 37): mỗi ô bảng một thành phần — mẫu "2/3" xem ở panel Đạt MT; chỉ ô Lớp còn dòng phụ (HV · GVCN). */
  const phuCua = (l: DongLop, c: CotBang) => (c.key === 'lop' ? [t('{n} HV', { n: l.hv }), l.gvcn].filter(Boolean).join(' · ') : null);
  return (
    <Card bodyClass="p-0" title={<>{t('Lớp cần chú ý')}{ds.length > 0 && <DemDau n={ds.length} />}</>}>
      <div data-hd="tq-lop-chu-y">
        <Bang ten={t('Lớp cần chú ý')} cot={COT_LOP} hang={ds} khoa={(l) => l.id} oCua={oCua} phuCua={phuCua} khung={false} theLuoi
          rong={{ tieuDe: t('Không lớp nào cần chú ý'), goiY: t('Không SOS, không Case chưa có PA, không HV thi tháng này.'), nut: <Link to="/hoc-vien" className="link">{t('Học viên & Lớp ›')}</Link> }} />
      </div>
    </Card>
  );
}

/*
 * GD-14 (lời 37, ⑧ mục 10 — phương án A, PTA chốt theo lời 39): mỗi ô bảng MỘT thành phần. Cột theo tên Phân tích GV:
 * Việc (% đúng hạn · Chưa làm) │ Chấm Test (% đúng hạn · Chưa làm) │ Tới hôm nay (Bài quá hạn — tập Trễ chấm, khác "Chưa làm" theo kỳ; ⓘ ở đầu khối).
 * "n đúng hạn · n làm muộn" xem ở panel sổ nghĩa vụ khi bấm hộp %; "+ n S chéo chung" thành MỘT hàng cuối "S chéo chung · chưa ai nhận".
 */
const NHOM_VIEC = t('Việc'), NHOM_CHAM = t('Chấm Test'), NHOM_TOI = t('Tới hôm nay');
const COT_GV_HC: readonly CotBang[] = [
  { key: 'gv', nhan: t('GV'), kieu: 'ten' },
  { key: 'v-pt', nhan: t('% đúng hạn'), kieu: 'so', nhom: NHOM_VIEC, tach: true, rong: 110 }, { key: 'v-chua', nhan: t('Chưa làm'), kieu: 'so', nhom: NHOM_VIEC, rong: 96 },
  { key: 'cd-pt', nhan: t('% đúng hạn'), kieu: 'so', nhom: NHOM_CHAM, tach: true, rong: 110 }, { key: 'cd-chua', nhan: t('Chưa làm'), kieu: 'so', nhom: NHOM_CHAM, rong: 96 },
  { key: 'tre', nhan: t('Bài quá hạn'), kieu: 'so', nhom: NHOM_TOI, tach: true, rong: 110 },
];
const COT_GV_HT: readonly CotBang[] = [
  { key: 'gv', nhan: t('GV'), kieu: 'ten' }, { key: 'kq', nhan: t('Đạt kỳ vọng Test'), dv: t('lượt'), kieu: 'phan-tram', rong: 200 },
  { key: 'tb', nhan: t('Tiến bộ'), dv: t('lượt'), kieu: 'phan-tram', rong: 140 }, { key: 'pa', nhan: t('Case chưa có PA'), kieu: 'so', rong: 160 },
];
const LUAT_GV = t('% đúng hạn · Chưa làm: việc / bài có hạn trong kỳ (bấm % xem Đúng hạn · Làm muộn · Chưa làm). Bài quá hạn: mọi ô kỹ năng còn trống đã qua hạn chấm, tính tới hôm nay — kể cả kỳ trước.');
/** Id giả của hàng "S chéo chung" (bài S chấm chéo chưa ai nhận của chi nhánh) — không phải GV. */
const ID_S_CHUNG = -1;
export const tyLeGv = (o: OPtGv | undefined): TyLeV5 | null => (!o || o.k === 'na' ? null : o.k === 'rong' ? { dat: 0, mau: 0 } : { dat: o.dung, mau: o.tong, ...(o.pt != null ? { pt: o.pt } : {}) });
export const gopKq = (kq: Record<string, OPtGv>): TyLeV5 | null => {
  const so = Object.values(kq).filter((o): o is Extract<OPtGv, { k: 'so' }> => o.k === 'so');
  if (!so.length) return Object.values(kq).some((o) => o.k === 'rong') ? { dat: 0, mau: 0 } : null;
  return so.reduce((a, o) => ({ dat: a.dat + o.dung, mau: a.mau + o.tong }), { dat: 0, mau: 0 });
};
type HangGv = PhanTichGvKq['hang'][number];
/** Dòng phụ tên GV = môn dạy ("L · R · W2"). Chủ SP 23/10 (vòng 2): bỏ hẳn dòng "GVCN + danh sách lớp" (xấu, dài) — Tổng quan + Phân tích GV dùng chung. */
export const phuGv = (h: Pick<HangGv, 'mon'>) => h.mon || null;

/**
 * GV cần chú ý — bảng Phân tích GV của chi nhánh, CÙNG kỳ với cả trang (`d.ky` = kỳ mặc định Tổng quan — SUA-CHAM-LAI L6, chủ SP 20/10 "một phạm vi số
 * cho cả trang"), nên số = Phân tích GV khi chọn cùng kỳ. Không xếp hạng, không ngưỡng màu (C08). Quá hạn = Trễ chấm V4.
 */
function GvCanChuY({ d }: { d: TongQuanV5Data }) {
  const [loai, setLoai] = useThamSoUrl('gv', 'hc');
  const dienThoai = useDienThoai();
  const [moHetGv, setMoHetGv] = useState(false);
  const q = `cn=${d.branchId}${thamSoCt(d.ct)}${kyQ(d)}`;
  const ht = loai === 'ht';
  /* TURSO-1211: thẻ chỉ đọc Việc · Chấm · Đạt kỳ vọng (Case có PA lấy `d.caseGv`) → `v2=1` (cùng hàm, bỏ phần thẻ không đọc: 41–85 câu → ~15);
     Tiến bộ chỉ có ở bản đủ — tab Học thuật FT mới gọi bản đủ. */
  const pt = useApi<PhanTichGvKq>(d.branchId ? `/phan-tich/giao-vien?${q}${ht && d.ct === 'ft' ? '' : '&v2=1'}` : null, [q, ht]);
  const tre = new Map(d.tre.map((x) => [x.khoa, x.bai]));
  const nguonPt = (id: number, cot: string, tt?: string) => `/phan-tich/giao-vien/o?gv=${id}&cot=${cot}&${q}${tt ? `&tt=${tt}` : ''}`;
  const nguonTre = (id: number) => `/tong-quan/gv-tre?gv=${id}&${thamSoTq(d.branchId, d.ct)}`;
  const GACH = <span className="text-slate-500">—</span>;
  /* S chéo chung: số = của GV thấy nhiều nhất (mọi GV có S cùng thấy cùng tập) — bấm mở panel CHÍNH GV đó lọc dòng S chéo (`sc=1`), như Phân tích GV. */
  let sc: { n: number; id: number } | null = null;
  for (const h of pt.data?.hang ?? []) { const o = h.chamDiem; const n = o && o.k !== 'na' ? o.sChung ?? 0 : 0; if (n > (sc?.n ?? 0)) sc = { n, id: h.id }; }
  const treSc = tre.get(ID_S_CHUNG) ?? 0;
  const ba = (o: OPtGv | undefined) => (o && o.k === 'so' ? { dung: o.dung, muon: o.muon ?? 0, chua: o.chua ?? 0, tong: o.tong } : null);
  const oCua = (h: HangGv, c: CotBang): ReactNode => {
    if (h.id === ID_S_CHUNG) {
      if (c.key === 'gv') return <span className="font-semibold italic text-dim">{t('S chéo chung')}</span>;
      if (c.key === 'cd-chua') return sc ? <OSo giaTri={sc.n} className="text-bad" tieuDe={t('S chéo chung')} nguon={`${nguonPt(sc.id, 'cham-diem', 'chua')}&sc=1`} /> : GACH;
      if (c.key === 'tre') return treSc ? <OSo giaTri={treSc} className="text-bad" tieuDe={t('Chấm quá hạn · {ten}', { ten: t('S chéo chung') })} nguon={nguonTre(ID_S_CHUNG)} gvTre={GV_TRE_QL} /> : GACH;
      return GACH;
    }
    if (c.key === 'gv') return <Link to={`/giao-vien/${h.id}`} className="ten-ho-so font-semibold">{h.ten}</Link>;
    if (c.key === 'tre') {
      const n = tre.get(h.id) ?? 0;
      return n ? <OSo giaTri={n} className="text-bad" tieuDe={t('Chấm quá hạn · {ten}', { ten: h.ten })} nguon={nguonTre(h.id)} gvTre={GV_TRE_QL} /> : <span className="tabular-nums text-faint">0</span>;
    }
    if (c.key === 'v-pt' || c.key === 'v-chua' || c.key === 'cd-pt' || c.key === 'cd-chua') {
      const viec = c.key.startsWith('v-');
      const x = ba(viec ? h.viecDungHan : h.chamDiem);
      if (!x) return GACH;
      const cot = viec ? 'viec-dung-han' : 'cham-diem';
      const tieuDe = `${h.ten} · ${viec ? t('Việc') : t('Chấm Test')}`;
      /* PT-SO-LOI: hộp % → panel sổ nghĩa vụ mở thẳng tab Đúng hạn; Chưa làm → tab Chưa làm. 0 % có mẫu > 0 vẫn bấm (chủ SP 14/11). */
      if (c.key.endsWith('-pt')) { const m = x.dung + x.muon + x.chua; return m ? <OSo giaTri={m} nhan={`${Math.round((100 * x.dung) / m)} %`} nguon={nguonPt(h.id, cot, 'dung')} tieuDe={tieuDe} /> : GACH; }
      return <OSo giaTri={x.chua} className={x.chua ? 'text-bad' : ''} nguon={nguonPt(h.id, cot, 'chua')} tieuDe={tieuDe} />;
    }
    if (c.key === 'pa') {
      const x = d.caseGv[h.id];
      const chua = x ? x.mo - x.coPa : 0;
      return <OSo giaTri={chua} tieuDe={`${t('Case chưa có PA')} · ${h.ten}`} nguon={`/giao-vien/${h.id}/o?cot=case-chua-pa&cn=${d.branchId}&ct=${d.ct}`} />;
    }
    const x = c.key === 'kq' ? (h.datMt ? tyLeGv(h.datMt) : gopKq(h.ketQua)) : tyLeGv(h.tienBo);
    return <PhanTram gon x={x} nguon={nguonPt(h.id, c.key === 'kq' ? (d.ct === 'ft' ? 'dat-mt' : 'ket-qua') : 'tien-bo')} tieuDe={`${c.nhan} · ${h.ten}`} />;
  };
  const phuCua = (h: HangGv, c: CotBang) => (c.key !== 'gv' ? null : h.id === ID_S_CHUNG ? t('chưa ai nhận') : phuGv(h));
  /* G2 (N32 ②, U09 #1): đủ mọi GV, GV có bài chấm quá hạn lên đầu (nhiều trước); không ngưỡng, không nhãn người. Hàng "S chéo chung" cuối (chỉ Hành chính). */
  const ds = pt.data ? [...pt.data.hang].sort((a, b) => (tre.get(b.id) ?? 0) - (tre.get(a.id) ?? 0)) : [];
  const hangDu: HangGv[] = !ht && (sc || treSc) ? [...ds, { ...ds[0], id: ID_S_CHUNG, ten: t('S chéo chung'), mon: '' }] : ds;
  /* ⑧ T7a: 375 chỉ GV có bài quá hạn; còn lại (và hàng S chéo chung) sau nút "+ n GV · S chéo chung" mở tại chỗ. */
  const gonDt = dienThoai && !moHetGv && !ht;
  const hang = gonDt ? hangDu.filter((h) => h.id !== ID_S_CHUNG && (tre.get(h.id) ?? 0) > 0) : hangDu;
  const anGv = hangDu.filter((h) => h.id !== ID_S_CHUNG).length - hang.filter((h) => h.id !== ID_S_CHUNG).length;
  const anSc = gonDt && hangDu.some((h) => h.id === ID_S_CHUNG);
  /* 375: thẻ có nhãn đủ nhóm ("Việc · % đúng hạn", "Chấm Test · chưa làm") — nhãn cột trần "% đúng hạn" không nói của nhóm nào. */
  const COT_THE: [string, string][] = [['v-pt', t('Việc · % đúng hạn')], ['v-chua', t('Việc · chưa làm')], ['tre', t('Bài quá hạn')], ['cd-pt', t('Chấm Test · % đúng hạn')], ['cd-chua', t('Chấm Test · chưa làm')]];
  const theGv = (h: HangGv) => (
    <div className="grid gap-2">
      <div className="flex min-w-0 flex-wrap items-baseline gap-x-2 text-[15px]">{oCua(h, COT_GV_HC[0])}<span className="text-[13px] text-dim">{phuCua(h, COT_GV_HC[0])}</span></div>
      <div className="grid grid-cols-3 gap-x-2 gap-y-2.5">
        {COT_THE.map(([k, nhan]) => (
          <div key={k} className="grid content-start justify-items-start gap-1"><span className="text-xs leading-tight text-dim">{nhan}</span>
            <span className="inline-flex min-h-9 items-center">{oCua(h, COT_GV_HC.find((c) => c.key === k)!)}</span></div>
        ))}
      </div>
    </div>
  );
  return (
    <Card bodyClass="p-0"
      title={<span className="inline-flex items-center" title={kyChu(d.ky)}>{t('Giáo viên')}{ds.length > 0 && <DemDau n={ds.length} />}<span className="ml-2 inline-flex"><NutLuat label={t('Giáo viên')}>{LUAT_GV}</NutLuat></span></span>}
      action={<CongTac v8 value={ht ? 'ht' : 'hc'} onChange={(k) => setLoai(k)} muc={[['hc', t('Hành chính')], ['ht', t('Học thuật')]]} />}>
      {pt.error ? <ErrorState message={pt.error.message} hint={pt.error.hint} status={pt.error.status} onRetry={pt.reload} />
        : !pt.data ? <Skeleton rows={3} className="p-4" />
          : <div data-hd="tq-gv-tre"><Bang ten={t('Giáo viên')} cot={ht ? COT_GV_HT.filter((c) => d.ct === 'ft' || c.key !== 'tb') : COT_GV_HC}
            hang={hang} khoa={(h) => h.id} oCua={oCua} phuCua={phuCua} khung={false} theLuoi lopHang={(h) => (h.id === ID_S_CHUNG ? 'tong' : '')}
            theRieng={ht ? undefined : theGv} rong={{ tieuDe: t('Chi nhánh chưa có GV nào trong kỳ') }} />
            {(anGv > 0 || anSc) && (
              <div className="border-t px-4 py-3" style={{ borderColor: 'var(--line)' }}>
                <button type="button" className="btn w-full min-h-[44px] justify-center" onClick={() => setMoHetGv(true)}>
                  {[anGv > 0 ? t('+ {n} GV', { n: anGv }) : null, anSc ? t('S chéo chung') : null].filter(Boolean).join(' · ')}
                </button>
              </div>
            )}</div>}
    </Card>
  );
}

const LUAT_DAT_MT = t('HV có lượt MT chốt trong kỳ, Overall so với kỳ vọng của lượt. Ngoài mẫu: HV chưa đủ dữ liệu.');
const ChiSoDatMt = ({ d }: { d: TongQuanV5Data }) => (
  <ChiSo ten={t('Đạt MT')} ky={t('trong kỳ')} luat={LUAT_DAT_MT}
    giaTri={d.ct === 'ft' ? <PhanTram x={d.datMt} nguon={qBc(d, '&o=dat-mt')} tieuDe={t('Đạt MT')} className="so-chinh" /> : <span className="text-slate-500">—</span>}
    mau={d.ct === 'ft' ? mauDatMt(d.datMt) : t('chỉ Fast Track')} />
);
export function TongQuanQlV5({ d }: { d: TongQuanV5Data }) {
  const { session } = useSession();
  const duyet = !!session?.nav?.workApprove;
  const hop = useApi<Hop>(duyet ? `/yeu-cau?hop=cho-duyet${d.branchId ? `&branchId=${d.branchId}` : ''}` : null, [d.branchId, duyet]);
  const choN = hop.data?.the.length ?? 0;
  const choQuaHan = hop.data?.the.filter((y) => y.hanDuyet && y.hanDuyet.slice(0, 10) < hop.data!.homNay).length ?? 0;
  const ft = d.ct === 'ft';
  return (
    <>
      {/* XM 3 (chủ SP 11/11): "Việc của tôi ›" đầu dải — có Chờ duyệt thì 5 ô. */}
      <DaiChiSo nam={duyet && !!session?.nav?.workSupport}>
        {/* GD-14 (⑧ T1): thứ tự cố định Việc của tôi · Chờ duyệt · Đạt MT · Case chưa có PA · Thi tháng này. */}
        <OViecCuaToi />
        {duyet && <ChiSoChoDuyet n={choN} quaHan={choQuaHan} />}
        <ChiSoDatMt d={d} />
        <ChiSoCaseChuaPa d={d} />
        <ChiSoThi d={d} />
      </DaiChiSo>
      <BoCuc
        trai={<><LopCanChuY d={d} />{session?.nav?.phanTichGv && d.branchId && <GvCanChuY d={d} />}</>}
        /* Đang tải hộp duyệt → giữ chỗ cột phải (không nhảy bố cục); hộp rỗng → bảng rộng hết trang. */
        phai={duyet && !hop.data && !hop.error ? <Skeleton rows={3} /> : choN > 0 && hop.data ? <ChoDuyetGon hop={hop.data} onXong={() => { hop.reload(); invalidate('/yeu-cau/dem'); invalidate('/tong-quan'); }} /> : undefined} />
    </>
  );
}

/* ───────────── QT / CX: theo chi nhánh ───────────── */

/**
 * GD-14 (⑧ XM-3, PTA chốt): bảng "Theo chi nhánh" MỘT bộ cột cho Quản trị và CX — hợp cột hai bảng cũ (lời 35 "gom chung", mới hơn lời 23/10 cột riêng CX):
 * Đạt MT · Đạt Target thi thật · SOS 2–3 · Case chưa có PA · Thi tháng này; hàng Toàn hệ thống; cả hai vai bấm được dòng.
 */
const COT_CN: readonly CotBang[] = [
  { key: 'cn', nhan: t('Chi nhánh'), kieu: 'ten', rong: 200 }, { key: 'dat', nhan: t('Đạt MT'), dv: t('HV'), kieu: 'so', rong: 120 },
  { key: 'tt', nhan: t('Đạt Target thi thật'), dv: t('HV'), kieu: 'so', rong: 180 }, { key: 'sos', nhan: t('SOS 2–3'), dv: t('HV'), kieu: 'so', rong: 110 },
  { key: 'case', nhan: t('Case chưa có PA'), kieu: 'so', rong: 140 }, { key: 'thi', nhan: t('Thi tháng này'), dv: t('HV'), kieu: 'so', rong: 140 },
];
/** UI-PHAN-TICH · Báo cáo HV (QT): kết quả trước, hỗ trợ sau — "Thi trong kỳ" theo kỳ đang xem; cột tên cố định để các cột số trải đều cả bề rộng. */
const COT_CN_BC: readonly CotBang[] = [
  { key: 'cn', nhan: t('Chi nhánh'), kieu: 'ten', rong: 200 }, { key: 'dat', nhan: t('Đạt MT'), dv: t('HV'), kieu: 'phan-tram', rong: 150 },
  { key: 'tt', nhan: t('Đạt Target thi thật'), dv: t('HV'), kieu: 'phan-tram', rong: 200 }, { key: 'thi', nhan: t('Thi trong kỳ'), dv: t('HV'), kieu: 'so', rong: 150 },
  { key: 'case', nhan: t('Case có PA'), kieu: 'phan-tram', rong: 150 }, { key: 'sos', nhan: t('SOS 2–3'), dv: t('HV'), kieu: 'so', rong: 150 },
];
export const ptChu = (x: TyLeV5 | null, gon = false) => (!x ? <span className="text-slate-500">—</span>
  : x.mau ? <span className="font-semibold tabular-nums">{Math.round((100 * x.dat) / x.mau)} %</span>
    : gon ? <span className="text-slate-500" title={t('Chưa có dữ liệu')}>—</span> : <ChuaCoDl />);

export function TheoChiNhanh({ d, baoCao, onChiNhanh }: { d: TongQuanV5Data; /** Báo cáo HV (kỳ chọn tự do): cột "Thi trong kỳ" + SOS 2–3. */ baoCao?: boolean; onChiNhanh: (id: number) => void }) {
  const dienThoai = useDienThoai();
  const [hetCn, setHetCn] = useState(false);
  type H = DongCn & { tong?: boolean };
  const hang: H[] = [...(d.chiNhanh ?? []), ...([{
    id: 0, khoa: 'tong', ten: t('Toàn hệ thống'), datMt: d.datMt, casePa: d.casePa, thiThat: d.thiThat, thiThangNay: d.thiThangNay, sos23: (d.chiNhanh ?? []).reduce((n, h) => n + h.sos23, 0), sos23Ids: [...new Set((d.chiNhanh ?? []).flatMap((h) => h.sos23Ids))], caseChuaPa: d.casePa.chuaPa, tong: true,
  }])];
  const bc = (h: H, o: string) => `/phan-tich/bao-cao/o?o=${o}${h.tong ? '' : `&branchId=${h.id}`}${thamSoCt(d.ct)}${kyQ(d)}`;
  const oCua = (h: H, c: CotBang): ReactNode => {
    if (c.key === 'cn') return <b className="text-slate-100">{h.ten}</b>;
    // 6C-NHO (bảng kê lỗi 2): hàng "Toàn hệ thống" cùng nguồn với ô dải đầu trang → khoá panel riêng, không "nháy".
    const vung = h.tong ? 'tong' : undefined;
    if (c.key === 'dat') return <PhanTram gon x={h.datMt} nguon={bc(h, 'dat-mt')} tieuDe={`${t('Đạt MT')} · ${h.ten}`} vung={vung} />;
    if (c.key === 'case' && baoCao) return <PhanTram gon x={{ dat: h.casePa.coPa, mau: h.casePa.mo }} nguon={qCn(d, 'caseMo', h.khoa)} tieuDe={`${t('Case đang mở')} · ${h.ten}`} vung={vung} />;
    /* GD-14: Đạt Target thi thật bấm được (panel cùng ô dải đầu trang). Báo cáo HV giữ chữ thường như cũ. */
    if (c.key === 'tt') return baoCao ? ptChu(h.thiThat, true) : <PhanTram gon x={h.thiThat} nguon={bc(h, 'dat-target-thi')} tieuDe={`${t('Đạt Target thi thật')} · ${h.ten}`} vung={vung} />;
    if (c.key === 'thi') return <OSo giaTri={h.thiThangNay} tieuDe={`${c.nhan} · ${h.ten}`} nguon={bc(h, baoCao ? 'thi-dot-nay' : 'thi-thang-nay')} vung={vung} />;
    /* TQ-SOS-CN (⑧ T3): SOS 2–3 bấm được — panel em của ĐÚNG chi nhánh (hàng Toàn hệ thống: cả phạm vi), máy chủ chỉ đọc khi bấm. Báo cáo HV giữ chữ. */
    if (c.key === 'sos') return baoCao ? <span className="tabular-nums">{h.sos23}</span>
      : <OSo giaTri={h.sos23} tieuDe={`${t('SOS 2–3')} · ${h.ten}`} nguon={`/tong-quan/chi-nhanh/sos23?${thamSoTq(h.tong ? d.branchId : h.id, d.ct)}&ids=${h.sos23Ids.join(',')}`} vung={vung} />;
    return <OSo giaTri={h.caseChuaPa} tieuDe={`${t('Case chưa có PA')} · ${h.ten}`} nguon={qCn(d, 'caseChuaChot', h.khoa)} vung={vung} />;
  };
  /* GD-14 (lời 37): Tổng quan — mỗi ô một thành phần, mẫu "2/3" xem ở panel. Báo cáo HV (Phân tích) giữ mẫu như cũ. */
  const phuCua = (h: H, c: CotBang) => (!baoCao ? null : c.key === 'dat' ? tuMau(h.datMt) : c.key === 'case' ? (h.casePa.mo ? `${h.casePa.coPa}/${h.casePa.mo}` : null)
    : c.key === 'tt' ? tuMau(h.thiThat) : null);
  /* TQ-375-GAP (mockup ⑧ T7b): 375, Tổng quan — chi nhánh RỖNG (mọi ô 0 / "—": không HV đạt / thi, không SOS, không Case, không thi) gập sau MỘT nút
     "+ n chi nhánh" đặt trước thẻ Toàn hệ thống; bấm là hiện hết (không đổi trang). 1440 và Báo cáo HV không đổi. */
  const rongCn = (h: H) => !h.tong && !h.datMt?.mau && !h.thiThat?.mau && !h.sos23 && !h.caseChuaPa && !h.thiThangNay;
  const an = dienThoai && !baoCao && !hetCn ? hang.filter(rongCn) : [];
  const bang = (ds: H[]) => (
    <Bang ten={t('Theo chi nhánh')} cot={baoCao ? COT_CN_BC : COT_CN} hang={ds} khoa={(h) => h.khoa} oCua={oCua} phuCua={phuCua} khung={false} deu theLuoi
      onHang={(h) => { if (!h.tong) onChiNhanh(h.id); }} lopHang={(h) => (h.tong ? 'tong' : '')} rong={{ tieuDe: t('Chưa có lớp nào trong khung này') }} />
  );
  return (
    <Card title={<>{t('Theo chi nhánh')}{!baoCao && !!d.chiNhanh?.length && <DemDau n={d.chiNhanh.length} />}</>} bodyClass="p-0">
      {an.length ? (
        <>
          {bang(hang.filter((h) => !h.tong && !rongCn(h)))}
          <div className="border-t px-3.5 py-3" style={{ borderColor: 'var(--line)' }}>
            <button type="button" className="btn min-h-[44px] w-full justify-center" onClick={() => setHetCn(true)}
              title={an.map((h) => h.ten).join(', ')}>{t('+ {n} chi nhánh', { n: an.length })}</button>
          </div>
          <div className="border-t" style={{ borderColor: 'var(--line)' }}>{bang(hang.filter((h) => h.tong))}</div>
        </>
      ) : bang(hang)}
    </Card>
  );
}

/**
 * QUẢN TRỊ / QL nhiều chi nhánh (GD-14, ⑧ T3, R8.2): + "Việc của tôi ›" + "Chờ duyệt ›" (cùng nguồn badge / chuông — số chờ duyệt từ `/yeu-cau/dem` khung App
 * đã tải, `useDemYeuCau`: 0 request). Cột phải "Chờ duyệt" như QL — GET danh sách CHỈ khi số > 0 ([XM-4]).
 */
export function TongQuanQtV5({ d, onChiNhanh }: { d: TongQuanV5Data; onChiNhanh: (id: number) => void }) {
  const { session } = useSession();
  const duyet = !!session?.nav?.workApprove;
  const dem = useDemYeuCau();
  const choN = dem?.cho ?? 0;
  const hop = useApi<Hop>(choN > 0 ? `/yeu-cau?hop=cho-duyet${d.branchId ? `&branchId=${d.branchId}` : ''}` : null, [d.branchId, choN > 0]);
  return (
    <>
      <DaiChiSo sau={duyet && !!session?.nav?.workSupport} nam={duyet !== !!session?.nav?.workSupport}>
        <OViecCuaToi />
        {duyet && <ChiSoChoDuyet n={choN} quaHan={dem?.quaHan ?? 0} />}
        <ChiSoDatMt d={d} />
        <ChiSo ten={t('Đạt Target thi thật')} ky={t('trong kỳ')} giaTri={<PhanTram x={d.thiThat} nguon={qBc(d, '&o=dat-target-thi')} tieuDe={t('Đạt Target thi thật')} className="so-chinh" />} />
        <ChiSoCaseChuaPa d={d} />
        <ChiSoThi d={d} />
      </DaiChiSo>
      <BoCuc trai={<TheoChiNhanh d={d} onChiNhanh={onChiNhanh} />}
        phai={choN > 0 ? (hop.data ? <ChoDuyetGon hop={hop.data} onXong={() => { hop.reload(); invalidate('/yeu-cau/dem'); invalidate('/tong-quan'); }} /> : hop.error ? undefined : <Skeleton rows={3} />) : undefined} />
    </>
  );
}

type SoHv = { phamVi: 'cua-toi' | 'chi-nhanh' | 'tat-ca'; tong: number; dem: Record<'da-thi' | 'cho-buoc-tiep', number> };
export function TongQuanCxV5({ d, onChiNhanh }: { d: TongQuanV5Data; onChiNhanh: (id: number) => void }) {
  const hv = useApi<SoHv>(`/tong-quan/hoc-vien${d.branchId ? `?branchId=${d.branchId}` : ''}`, [d.branchId]);
  const ft = d.ct === 'ft';
  const cn = d.branchId ? `&cn=${d.branchId}` : '';
  const den = (chip: string) => `/hoc-vien?phamVi=${hv.data?.phamVi ?? 'tat-ca'}${cn}&view=${chip}`;
  /* SOS 2–3 hiện tại: cùng ô bảng (chi nhánh: `sos23`; một chi nhánh: SOS 2 + SOS 3 của lớp). */
  const sos23 = d.chiNhanh ? d.chiNhanh.reduce((n, h) => n + h.sos23, 0) : (d.lop ?? []).reduce((n, l) => n + l.sos[1] + l.sos[2], 0);
  return (
    <>
      {/* Chủ SP 23/10: CX xem điểm và tình trạng HV — kết quả trước, việc phối hợp sau. */}
      <DaiChiSo nam>
        {/* GD-14 (lời 37): dòng phụ tối đa một ý, chỉ khi cần — bỏ "HV", "2/3 HV" (đơn vị ở tên ô, mẫu ở panel). */}
        <ChiSoDatMt d={d} />
        <ChiSo ten={t('Đạt Target thi thật')} ky={t('trong kỳ')} giaTri={ft ? <PhanTram x={d.thiThat} nguon={qBc(d, '&o=dat-target-thi')} tieuDe={t('Đạt Target thi thật')} className="so-chinh" /> : <span className="text-slate-500">—</span>}
          mau={ft ? null : t('chỉ Fast Track')} />
        <ChiSo ten={tenDen(t('HV SOS 2–3'), sos23)} ky={t('hiện tại')} giaTri={<SoDen n={sos23} to={`/hoc-vien?view=sos&muc=23${cn}`} className="so-chinh" />} />
        {/* AUDIT-UI B2 đồng bộ (PTA 08/11): tách ô hai số "Chờ KQ · Lộ trình tiếp" thành hai ô như TVV — mỗi ô một số, cùng đích đổi trang cũ. */}
        <ChiSo ten={tenDen(t('Chờ KQ thi thật'), hv.data?.dem['da-thi'] ?? 0)} ky={t('hiện tại')} giaTri={hv.data ? <SoDen n={hv.data.dem['da-thi']} to={den('da-thi')} className="so-chinh" /> : '…'} />
        <ChiSo ten={tenDen(t('Chưa chốt lộ trình tiếp'), hv.data?.dem['cho-buoc-tiep'] ?? 0)} tenNgan={tenDen(t('Chưa chốt LT tiếp'), hv.data?.dem['cho-buoc-tiep'] ?? 0)} ky={t('hiện tại')}
          giaTri={hv.data ? <SoDen n={hv.data.dem['cho-buoc-tiep']} to={den('cho-buoc-tiep')} className="so-chinh" /> : '…'} />
      </DaiChiSo>
      {/* GD-14 (⑧ T4, XM-3): CÙNG bảng Theo chi nhánh với Quản trị — bấm dòng, có Toàn hệ thống. */}
      {d.chiNhanh ? <TheoChiNhanh d={d} onChiNhanh={onChiNhanh} /> : <LopCanChuY d={d} />}
    </>
  );
}

/* ───────────── Việc của tôi (mọi vai có Công việc) ───────────── */

/**
 * Ô "Việc của tôi ›" — GV (chủ SP 23/10) + [XM 3] chủ SP 11/11: TVV · QL · Admin cũng có (CLAUDE.md "việc của tôi ở trang đầu vai"). Số = `summary.viec` của `/my-work`
 * (cùng `demDongViec` với badge / Công việc), đọc từ bản khung App đã tải cho badge (`useSoViecCuaToi`) — KHÔNG GET `/my-work` lần nữa (trước XM 3 Tổng quan GV
 * tự gọi nên thường thành hai lời gọi `/my-work` mỗi lần mở trang). Cả ô là link Công việc (MO-TAT-CA 05/11).
 * Head tutor chưa có Công việc (không `workSupport`) → không ô.
 */
/* `dai` — GD-4 e (⓪ dòng 22, trang-dau-tvv [XM-1]): ô của dải mỏng — số không bấm, giữ "m quá hạn"; nhãn "Việc ›" đổi trang Công việc. */
export function OViecCuaToi({ dai, khongBam }: { dai?: boolean; /** GD-8: đang ở Công việc — nhãn "Việc" không link ([XM-1]). */ khongBam?: boolean } = {}) {
  const { session } = useSession();
  const viec = useSoViecCuaToi();
  if (!session?.nav?.workSupport) return null;
  if (dai) {
    const nhan = session.nav.work && !khongBam ? <Link to="/cong-viec" className="font-semibold text-[color:var(--accent)] no-underline hover:underline">{t('Việc')} ›</Link> : t('Việc');
    return (
      <ODai nhan={nhan} phu={!!viec?.viecQuaHan && <span className="font-semibold text-bad">{t('{n} quá hạn', { n: viec.viecQuaHan })}</span>}>
        <SoTinh n={viec?.viec ?? '…'} />
      </ODai>
    );
  }
  /* GD-14 (lời 37, ⑧ C3): dòng phụ chỉ khi cần làm — "n quá hạn" đỏ; 0 việc → mờ, không "›", không bấm (như mọi ô số). */
  const n = viec?.viec ?? null;
  const bam = !!session.nav.work && !!n;
  const o = <ChiSo ten={bam ? `${t('Việc của tôi')} ›` : t('Việc của tôi')} ky={t('hiện tại')} giaTri={n === 0 ? <span className="font-normal text-faint">0</span> : n ?? '…'}
    mau={viec?.viecQuaHan ? <span className="font-semibold text-bad">{t('{n} quá hạn', { n: viec.viecQuaHan })}</span> : null} />;
  return bam
    ? <Link to="/cong-viec" className="block h-full rounded-xl no-underline hover:[&>.card]:border-[color:var(--accent)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--accent)]">{o}</Link>
    : o;
}

/* ───────────── TVV: 4 ô, mỗi ô một số (AUDIT-UI B2) ───────────── */

/**
 * GD-8 (mockup v21 ④ K1, R4.2): dải mỏng 5 chỉ số của TVV — đầu trang Công việc (trang đầu TVV). MỘT nguồn `/tong-quan/tvv/em` (em + chỉ số, GD-8a) — thay
 * `/tong-quan/tvv` + `/tong-quan/hoc-vien` của Tổng quan TVV cũ. Chờ KQ / Chưa chốt lộ trình tiếp = đếm cờ `choKq` / `choBuocTiep` của em (cùng hàm chip
 * `da-thi` / `cho-buoc-tiep` ở Học viên & Lớp). Ô Việc ([XM-1]) không bấm — trang đang là Công việc. Ba ô "›" giữ đích đổi trang cũ ([XM-2]); 0 không bấm.
 */
export type ChiSoTvv = { ky: { tu: string; den: string }; baoPh: { dung: number; tong: number; treXong: number }; thiThangNay: number };
export function DaiChiSoTvv({ chiSo, em }: { chiSo: ChiSoTvv | undefined; em: readonly { choKq?: true; choBuocTiep?: true }[] | undefined }) {
  const den = (chip: string) => `/hoc-vien?phamVi=cua-toi&view=${chip}`;
  const choKq = em?.filter((x) => x.choKq).length ?? 0, buoc = em?.filter((x) => x.choBuocTiep).length ?? 0;
  return (
    <DaiChiSoMong nhan={t('Chỉ số của tôi')}>
      <OViecCuaToi dai khongBam />
      <ODai nhan={t('Báo PH đúng hạn')} title={chiSo ? kyChu(chiSo.ky) : undefined} luat={t('Việc Báo PH đã báo trước hạn / việc Báo PH phát sinh trong kỳ.')}
        phu={chiSo && chiSo.baoPh.treXong > 0 ? t('xong trễ {n}', { n: chiSo.baoPh.treXong }) : undefined}>
        {!chiSo ? <SoTinh n="…" /> : chiSo.baoPh.tong ? <PhanTram x={{ dat: chiSo.baoPh.dung, mau: chiSo.baoPh.tong }} nguon="/tong-quan/tvv/o?o=bao-ph" tieuDe={t('Báo PH đúng hạn')} />
          : <span aria-label={t('Chưa có dữ liệu')}><SoTinh n="—" /></span>}
      </ODai>
      <ODai nhan={t('Thi tháng này')} luat={LUAT_THI}>{chiSo ? <SoDenDai n={chiSo.thiThangNay} to="/hoc-vien?phamVi=cua-toi&thi=1" /> : <SoTinh n="…" />}</ODai>
      <ODai nhan={t('Chờ KQ')} title={t('Chờ KQ thi thật')}>{em ? <SoDenDai n={choKq} to={den('da-thi')} /> : <SoTinh n="…" />}</ODai>
      <ODai nhan={<><span className="max-sm:hidden">{t('Chưa chốt lộ trình tiếp')}</span><span className="sm:hidden">{t('Chưa chốt')}</span></>} title={t('Chưa chốt lộ trình tiếp')}>
        {em ? <SoDenDai n={buoc} to={den('cho-buoc-tiep')} /> : <SoTinh n="…" />}
      </ODai>
    </DaiChiSoMong>
  );
}

/* ───────────── Admin · Head tutor ───────────── */


/**
 * AUDIT-UI B1 + B2 (chủ SP 08/11): link cạnh tiêu đề thay thẻ "Điều hướng" — chỉ đích KHÔNG có ở ô số hay menu.
 * Bỏ: "Việc của tôi" (ô số + menu Công việc), "Thi tháng này" / "Case chưa có PA" (ô số mở panel), "Học viên & Lớp" (menu), 3 link thẻ "Thi thật" TVV (nay là ô số).
 */
export function lienKetTq(vai: string, o: { id?: number; cn: number | null; ky?: { tu: string; den: string } | null; motCn?: boolean }): LienKetTq[] {
  const cn = o.cn ? `&cn=${o.cn}` : '';
  const baoCao = { to: `/phan-tich?goc=bao-cao${cn}`, nhan: t('Báo cáo'), goiY: o.ky ? kyChu(o.ky) : undefined };
  const lichThi = { to: `/hoc-vien?view=lich-thi${cn}`, nhan: t('Lịch thi') };
  /* LG-7: Head tutor / GV chưa có lớp — như trang đầu GV (Công việc), không link cạnh tiêu đề. GV có lớp không tới đây (chuyển sang Công việc). */
  if (vai === 'ht') return [];
  /* GD-14 (⑧ XM-7): bỏ "Kế hoạch Test ›" đầu trang — đã ở ô "Lượt MT tuần này ›" và đầu khối Lịch sắp tới. */
  if (vai === 'admin') { const q = o.cn ? `?cn=${o.cn}` : ''; return [{ to: `/test/lich${q}`, nhan: t('Lịch tuần') }]; }
  if (vai === 'cx') return [lichThi, baoCao];   // GD-14 (⑧ T4): một tên "Báo cáo ›
  return o.motCn ? [lichThi, baoCao] : [{ to: '/phan-tich?goc=giao-vien', nhan: t('Phân tích GV') }, baoCao];
}
