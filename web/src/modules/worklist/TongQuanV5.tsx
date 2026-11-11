import { useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useApi } from '../../lib/useApi.ts';
import { invalidate } from '../../lib/api.ts';
import { useSession } from '../../lib/session.tsx';
import { useSoViecCuaToi } from '../../lib/viecCuaToi.ts';
import { useThamSoUrl } from '../../lib/quayLai.ts';
import { Card, ErrorState, OChiSo, Skeleton } from '../../ui/ui.tsx';
import { OSo } from '../../ui/OSo.tsx';
import { LOP_OSO, VUNG_BAM_SO } from '../../ui/SoLieu.tsx';
import { Bang, type CotBang } from '../../ui/Bang.tsx';
import { ChipHan, CHIP_SOS, lopSos } from '../../ui/Nhan.tsx';
import { NutLuat } from '../../ui/NutLuat.tsx';
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
type DongCn = { id: number; khoa: string; ten: string; datMt: TyLeV5 | null; casePa: { coPa: number; mo: number }; thiThat: TyLeV5 | null; thiThangNay: number; sos23: number; caseChuaPa: number };
type GvTre = { khoa: number; ten: string; bai: number };
export type TongQuanV5Data = {
  homNay: string; ky: { tu: string; den: string }; ct: ChuongTrinh; branchId: number | null; tenChiNhanh: string | null;
  datMt: (TyLeV5 & { chuaDu: number }) | null; casePa: { coPa: number; mo: number; chuaPa: number }; thiThangNay: number; thiThat: TyLeV5 | null;
  lop: DongLop[] | null; chiNhanh: DongCn[] | null; tre: GvTre[]; caseGv: Record<number, { coPa: number; mo: number }>;
};

/** Tham số chung của mọi đường trên trang (chi nhánh + khung). */
/** M6 6b-4 (Q5, Q8): ô "⚠ n" Quá hạn của GV → panel GV chấm quá hạn (lớp · lượt · kỹ năng → em còn trống → Nhập hộ), cùng tập Trễ chấm. */
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
export const DaiChiSo = ({ children, nam }: { children: ReactNode; nam?: boolean }) => <div data-hd="tq-tom-tat" className={`grid grid-cols-2 gap-2 sm:gap-3 ${nam ? 'lg:grid-cols-5' : 'lg:grid-cols-4'} max-lg:[&>*:last-child:nth-child(odd)]:col-span-2`}>{children}</div>;

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
export const mauDatMt = (x: (TyLeV5 & { chuaDu: number }) | null) => (!x ? null : <>
  {x.mau ? `${x.dat}/${x.mau} ${t('HV')}` : null}{x.mau && x.chuaDu ? ' · ' : null}{x.chuaDu ? <>{x.chuaDu} {t('chưa đủ dữ liệu')}</> : null}
</>);

/**
 * Bố cục B: trái (tình hình) · phải 400 (Chờ bạn duyệt — AUDIT-UI B1: bỏ thẻ "Điều hướng", mockup B1 cột phải 400); < 1280 một cột, cột phải lên trước.
 * Không có gì cho cột phải → bảng rộng hết trang.
 */
function BoCuc({ trai, phai }: { trai: ReactNode; phai?: ReactNode }) {
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
  <ChiSo ten={t('Thi tháng này')} ky={t('hiện tại')} luat={LUAT_THI} giaTri={<OSo giaTri={d.thiThangNay} tieuDe={t('Thi tháng này')} nguon={qBc(d, '&o=thi-thang-nay')} className="so-chinh" />} mau={t('HV')} />
);
/** Dòng phụ "Case có PA" (QL, QT — O-TQ-BAM: QT thêm số chưa PA như QL): số chưa PA mở panel riêng, nổi trên lớp phủ cả ô. */
const MauCasePa = ({ d }: { d: TongQuanV5Data }) => (d.casePa.mo
  ? <>{d.casePa.coPa}/{d.casePa.mo} Case · <OSo giaTri={d.casePa.chuaPa} tieuDe={t('Case chưa chốt PA')} nguon={qCn(d, 'caseChuaChot', 'tong')} /> {t('chưa PA')}</> : null);
const qCn = (d: TongQuanV5Data, cot: string, khoa: string) => `/tong-quan/chi-nhanh/o?cot=${cot}&khoa=${khoa}&chuY=1&${thamSoTq(d.branchId, d.ct)}`;

/* ───────────── Chờ bạn duyệt (dòng gọn → panel duyệt, C04) ───────────── */

type Hop = { the: TheYeuCauDto[]; homNay: string };
function ChoDuyetGon({ hop, onXong }: { hop: Hop; onXong: () => void }) {
  const [mo, setMo] = useState<TheYeuCauDto | null>(null);
  if (!hop.the.length) return null;
  return (
    <Card title={<>{t('Chờ bạn duyệt')} <span className="ml-1.5 font-normal text-slate-500">{t('{n} yêu cầu', { n: hop.the.length })}</span></>} bodyClass="p-0">
      <ul data-hd="tq-can-xu-ly" className="m-0 list-none p-0">
        {hop.the.slice(0, 5).map((y) => (
          <li key={y.id} className="border-t" style={{ borderColor: 'var(--line)' }}>
            {/*
              * TQ-GON (M1, M4, M10 — cùng dáng Chờ bạn duyệt ở Công việc v12): MỘT dòng = loại (chip viền) · tên em (đậm duy nhất) · hạn (viên theo mức).
              * Lớp · lượt · người gửi không thành dòng thứ hai: rê chuột (`title`) hoặc bấm dòng → panel duyệt đủ chữ.
              */}
            <button type="button" onClick={() => setMo(y)} title={[y.lop, y.phu && dich(y.phu), y.nguoiXin && t('gửi bởi {ten}', { ten: y.vaiNguoiXin ? `${y.nguoiXin} (${t(y.vaiNguoiXin)})` : y.nguoiXin })].filter(Boolean).join(' · ') || undefined}
              className={`bam grid min-h-[44px] w-full grid-cols-[96px_minmax(0,1fr)_auto] items-center gap-x-2.5 px-4 py-2 text-left leading-[1.45] ${mo?.id === y.id ? 'dang-mo' : ''}`}>
              {/* RA-GD-0711c: tên em giữ một dòng — thiếu chỗ thì chữ chip xuống dòng trong chip (không cắt "…"). NHAN-MOT-DONG (audit C5): tên loại
                * ngắn + chip rộng tối thiểu bằng tên loại thường gặp ("Xử lý Ý thức") → chip một dòng, tên em thẳng cột (khối hẹp 360 px ở 1440 cũng vậy). */}
              {/* AUDIT-UI B1 (chủ SP 08/11): cột loại cố định 96 px; "Không cần theo dõi" quá dài → nhãn ngắn, tên đủ khi rê. */}
              <span className="justify-self-start whitespace-nowrap rounded-md border px-1.5 py-px text-xs font-medium leading-4 text-dim" style={{ borderColor: 'var(--line-strong)' }}
                title={y.loai === 'khong_theo_doi' ? dich(y.nhanLoai) : undefined}>{y.loai === 'khong_theo_doi' ? <><span aria-hidden>{t('Không theo dõi')}</span><span className="sr-only">{dich(y.nhanLoai)}</span></> : dich(y.nhanLoai)}</span>
              <span className="min-w-0 truncate text-sm font-semibold text-slate-100" title={y.hocVien ?? y.lop ?? dich(y.tieuDe)}>{y.hocVien ?? y.lop ?? dich(y.tieuDe)}</span>
              {/* AUDIT-UI B1 (mockup `.td-han`): hạn chỉ chữ, không viên. */}
              {y.hanDuyet && <ChipHan loai="duyet" han={y.hanDuyet} />}
            </button>
          </li>
        ))}
      </ul>
      <Link to="/cong-viec?nhom=duyet" className="block border-t px-4 py-2.5 text-sm font-semibold text-[color:var(--accent)] no-underline" style={{ borderColor: 'var(--line)' }}>{t('Hộp duyệt ›')}</Link>
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
  { key: 'case', nhan: t('Case chưa PA'), kieu: 'so', rong: 130 }, { key: 'thi', nhan: t('Thi tháng này'), dv: t('HV'), kieu: 'so', rong: 150 },
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
    if (c.key === 'case') return <OSo giaTri={l.caseChuaPa} tieuDe={t('Case chưa chốt PA · {lop}', { lop: l.ma })} nguon={qCn(d, 'caseChuaChot', l.khoa)} />;
    return <OSo giaTri={l.thiThangNay} tieuDe={t('Thi tháng này · {lop}', { lop: l.ma })} nguon={qBc(d, `&o=thi-thang-nay&lop=${l.id}`)} />;
  };
  const phuCua = (l: DongLop, c: CotBang) => (c.key === 'lop' ? [t('{n} HV', { n: l.hv }), l.gvcn].filter(Boolean).join(' · ')
    /* AUDIT-UI B1 (V13): đơn vị ở tiêu đề cột — ô chỉ số + mẫu "2/3". */
    : c.key === 'dat' ? tuMau(l.datMt) : null);
  return (
    <Card bodyClass="p-0" title={t('Lớp cần chú ý')}>
      <div data-hd="tq-lop-chu-y">
        <Bang ten={t('Lớp cần chú ý')} cot={COT_LOP} hang={ds} khoa={(l) => l.id} oCua={oCua} phuCua={phuCua} khung={false} theLuoi
          rong={{ tieuDe: t('Không lớp nào cần chú ý'), goiY: t('Không SOS, không Case chưa PA, không HV thi tháng này.'), nut: <Link to="/hoc-vien" className="link">{t('Học viên & Lớp ›')}</Link> }} />
      </div>
    </Card>
  );
}

const COT_GV_HC: readonly CotBang[] = [
  /* U09 #2 (B04): "Quá hạn" là bài chấm Test. RA-GD-0711c: "Kết quả PA đúng hạn" → "Việc đúng hạn" — cùng `viecDungHan` + panel `viec-dung-han`
     với Phân tích GV (DEM-QUA-HAN #1114: Kết quả PA + việc Công việc còn mở đã quá hạn), một khái niệm một tên. */
  { key: 'gv', nhan: t('GV'), kieu: 'ten' }, { key: 'viec', nhan: t('Việc đúng hạn'), dv: t('việc'), kieu: 'phan-tram', rong: 180 },
  { key: 'diem', nhan: t('Chấm Test đúng hạn'), dv: t('bài'), kieu: 'phan-tram', rong: 200 }, { key: 'tre', nhan: t('Bài chấm quá hạn'), kieu: 'so', rong: 160 },
];
const COT_GV_HT: readonly CotBang[] = [
  { key: 'gv', nhan: t('GV'), kieu: 'ten' }, { key: 'kq', nhan: t('Đạt kỳ vọng Test'), dv: t('lượt'), kieu: 'phan-tram', rong: 200 },
  { key: 'tb', nhan: t('Tiến bộ'), dv: t('lượt'), kieu: 'phan-tram', rong: 140 }, { key: 'pa', nhan: t('Case có PA'), kieu: 'phan-tram', rong: 150 },
];
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
  const q = `cn=${d.branchId}${thamSoCt(d.ct)}${kyQ(d)}`;
  const ht = loai === 'ht';
  /* TURSO-1211: thẻ chỉ đọc Việc · Chấm · Đạt kỳ vọng (Case có PA lấy `d.caseGv`) → `v2=1` (cùng hàm, bỏ phần thẻ không đọc: 41–85 câu → ~15);
     Tiến bộ chỉ có ở bản đủ — tab Học thuật FT mới gọi bản đủ. */
  const pt = useApi<PhanTichGvKq>(d.branchId ? `/phan-tich/giao-vien?${q}${ht && d.ct === 'ft' ? '' : '&v2=1'}` : null, [q, ht]);
  const tre = new Map(d.tre.map((x) => [x.khoa, x.bai]));
  const COT: Record<string, string> = { viec: 'viec-dung-han', diem: 'cham-diem', kq: d.ct === 'ft' ? 'dat-mt' : 'ket-qua', tb: 'tien-bo' };
  /* XM-2: Case có PA theo người phụ trách — mẫu = Case đang mở của GV, panel = cùng danh sách ở hồ sơ GV (`case-mo`). */
  const casePa = (h: HangGv): TyLeV5 => { const x = d.caseGv[h.id]; return x ? { dat: x.coPa, mau: x.mo } : { dat: 0, mau: 0 }; };
  const giaTri = (h: HangGv, c: CotBang): TyLeV5 | null => (c.key === 'viec' ? tyLeGv(h.viecDungHan) : c.key === 'diem' ? tyLeGv(h.chamDiem)
    : c.key === 'kq' ? (h.datMt ? tyLeGv(h.datMt) : gopKq(h.ketQua)) : c.key === 'tb' ? tyLeGv(h.tienBo) : c.key === 'pa' ? casePa(h) : null);
  const oCua = (h: HangGv, c: CotBang): ReactNode => {
    if (c.key === 'gv') return <Link to={`/giao-vien/${h.id}`} className="ten-ho-so font-semibold">{h.ten}</Link>;
    if (c.key === 'tre') {
      const n = tre.get(h.id) ?? 0;
      return n ? <span className="font-semibold text-bad">⚠ <OSo giaTri={n} className="text-bad" tieuDe={t('Chấm quá hạn · {ten}', { ten: h.ten })} nguon={`/tong-quan/gv-tre?gv=${h.id}&${thamSoTq(d.branchId, d.ct)}`} gvTre={GV_TRE_QL} /></span>
        : <span className="tabular-nums text-faint">0</span>;
    }
    const nguon = c.key === 'pa' ? `/giao-vien/${h.id}/o?cot=case-mo&cn=${d.branchId}&ct=${d.ct}` : `/phan-tich/giao-vien/o?gv=${h.id}&cot=${COT[c.key]}&${q}`;
    return <PhanTram gon x={giaTri(h, c)} nguon={nguon} tieuDe={c.key === 'pa' ? `${t('Case đang mở')} · ${h.ten}` : `${c.nhan} · ${h.ten}`} />;
  };
  /* TQ-GON (M3): cột "Bài chấm quá hạn" tiêu đề đã có đơn vị → không lặp "bài" dưới mỗi số. */
  const phuCua = (h: HangGv, c: CotBang) => (c.key === 'gv' ? phuGv(h) : c.key === 'tre' ? null
    : c.key === 'viec' || c.key === 'diem' ? <PhuSo3 o={c.key === 'viec' ? h.viecDungHan : h.chamDiem} /> : tuMau(giaTri(h, c)));   // AUDIT-UI B1: đơn vị ở tiêu đề cột · sổ nghĩa vụ: 3 số
  /* G2 (N32 ②, U09 #1): đủ mọi GV, GV có bài chấm quá hạn lên đầu (nhiều trước); không ngưỡng, không nhãn người. TQ-GON (M3, M4): đầu thẻ chỉ "Giáo viên" —
     kỳ đã ở đầu trang, thứ tự tự thấy (rê chuột tên thẻ vẫn đọc được). */
  const hang = pt.data ? [...pt.data.hang].sort((a, b) => (tre.get(b.id) ?? 0) - (tre.get(a.id) ?? 0)) : [];
  return (
    <Card bodyClass="p-0"
      title={<span title={[kyChu(d.ky), ht ? null : t('bài chấm quá hạn lên đầu')].filter(Boolean).join(' · ')}>{t('Giáo viên')}</span>}
      action={<CongTac v8 value={ht ? 'ht' : 'hc'} onChange={(k) => setLoai(k)} muc={[['hc', t('Hành chính')], ['ht', t('Học thuật')]]} />}>
      {pt.error ? <ErrorState message={pt.error.message} hint={pt.error.hint} status={pt.error.status} onRetry={pt.reload} />
        : !pt.data ? <Skeleton rows={3} className="p-4" />
          : <div data-hd="tq-gv-tre"><Bang ten={t('Giáo viên')} cot={ht ? COT_GV_HT.filter((c) => d.ct === 'ft' || c.key !== 'tb') : COT_GV_HC}
            hang={hang} khoa={(h) => h.id} oCua={oCua} phuCua={phuCua} khung={false} theLuoi rong={{ tieuDe: t('Chi nhánh chưa có GV nào trong kỳ') }} /></div>}
    </Card>
  );
}

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
        <OViecCuaToi />
        <ChiSo ten={t('Đạt MT')} ky={t('trong kỳ')} luat={t('HV có lượt MT chốt trong kỳ, Overall so với kỳ vọng của lượt. Ngoài mẫu: HV chưa đủ dữ liệu.')}
          giaTri={ft ? <PhanTram x={d.datMt} nguon={qBc(d, '&o=dat-mt')} tieuDe={t('Đạt MT')} className="so-chinh" /> : <span className="text-slate-500">—</span>}
          mau={ft ? mauDatMt(d.datMt) : t('chỉ Fast Track')} />
        <ChiSo ten={t('Case có PA')} ky={t('hiện tại')}
          giaTri={<PhanTram x={{ dat: d.casePa.coPa, mau: d.casePa.mo }} nguon={qCn(d, 'caseMo', 'tong')} tieuDe={t('Case đang mở')} className="so-chinh" />}
          mau={<MauCasePa d={d} />} />
        {/* TQ-GON (M5): "yêu cầu" — cùng tên với Chờ bạn duyệt ở Công việc / Hộp duyệt. */}
        {duyet && <ChiSo ten={tenDen(t('Chờ duyệt'), choN)} ky={t('hiện tại')} giaTri={<SoDen n={choN} to="/cong-viec?nhom=duyet" className="so-chinh" />} mau={<>{t('yêu cầu')}{choQuaHan > 0 && <span className="font-semibold text-bad"> · ⚠ {t('{n} quá hạn', { n: choQuaHan })}</span>}</>} />}
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

const COT_CN: readonly CotBang[] = [
  { key: 'cn', nhan: t('Chi nhánh'), kieu: 'ten', rong: 200 }, { key: 'dat', nhan: t('Đạt MT'), dv: t('HV'), kieu: 'phan-tram', rong: 130 }, { key: 'case', nhan: t('Case có PA'), kieu: 'phan-tram', rong: 130 },
  { key: 'tt', nhan: t('Đạt Target thi thật'), dv: t('HV'), kieu: 'phan-tram', rong: 200 }, { key: 'thi', nhan: t('Thi tháng này'), dv: t('HV'), kieu: 'so', rong: 150 },
];
/** CX (chủ SP 23/10): thiên về điểm + tình trạng HV — Đạt MT · Đạt Target thi thật · SOS 2–3 · Case chưa PA. */
const COT_CN_CX: readonly CotBang[] = [
  { key: 'cn', nhan: t('Chi nhánh'), kieu: 'ten', rong: 200 }, { key: 'dat', nhan: t('Đạt MT'), dv: t('HV'), kieu: 'phan-tram', rong: 120 }, { key: 'tt', nhan: t('Đạt Target thi thật'), dv: t('HV'), kieu: 'phan-tram', rong: 200 },
  { key: 'sos', nhan: t('SOS 2–3'), dv: t('HV'), kieu: 'so', rong: 120 }, { key: 'case', nhan: t('Case chưa PA'), kieu: 'so', rong: 120 },
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

export function TheoChiNhanh({ d, cx, baoCao, onChiNhanh }: { d: TongQuanV5Data; cx?: boolean; /** Báo cáo HV (kỳ chọn tự do): cột "Thi trong kỳ" + SOS 2–3. */ baoCao?: boolean; onChiNhanh: (id: number) => void }) {
  type H = DongCn & { tong?: boolean };
  const hang: H[] = [...(d.chiNhanh ?? []), ...(cx ? [] : [{
    id: 0, khoa: 'tong', ten: t('Toàn hệ thống'), datMt: d.datMt, casePa: d.casePa, thiThat: d.thiThat, thiThangNay: d.thiThangNay, sos23: (d.chiNhanh ?? []).reduce((n, h) => n + h.sos23, 0), caseChuaPa: d.casePa.chuaPa, tong: true,
  }])];
  const bc = (h: H, o: string) => `/phan-tich/bao-cao/o?o=${o}${h.tong ? '' : `&branchId=${h.id}`}${thamSoCt(d.ct)}${kyQ(d)}`;
  const oCua = (h: H, c: CotBang): ReactNode => {
    if (c.key === 'cn') return <b className="text-slate-100">{h.ten}</b>;
    // 6C-NHO (bảng kê lỗi 2): hàng "Toàn hệ thống" cùng nguồn với ô dải đầu trang → khoá panel riêng, không "nháy".
    const vung = h.tong ? 'tong' : undefined;
    if (c.key === 'dat') return <PhanTram gon x={h.datMt} nguon={bc(h, 'dat-mt')} tieuDe={`${t('Đạt MT')} · ${h.ten}`} vung={vung} />;
    if (c.key === 'case' && !cx) return <PhanTram gon x={{ dat: h.casePa.coPa, mau: h.casePa.mo }} nguon={qCn(d, 'caseMo', h.khoa)} tieuDe={`${t('Case đang mở')} · ${h.ten}`} vung={vung} />;
    if (c.key === 'tt') return ptChu(h.thiThat, true);
    if (c.key === 'thi') return <OSo giaTri={h.thiThangNay} tieuDe={`${c.nhan} · ${h.ten}`} nguon={bc(h, baoCao ? 'thi-dot-nay' : 'thi-thang-nay')} vung={vung} />;
    if (c.key === 'sos') return <span className="tabular-nums">{h.sos23}</span>;
    return <OSo giaTri={h.caseChuaPa} tieuDe={`${t('Case chưa chốt PA')} · ${h.ten}`} nguon={qCn(d, 'caseChuaChot', h.khoa)} vung={vung} />;
  };
  /* AUDIT-UI B1: đơn vị ở tiêu đề cột ("Đạt MT · HV"); cột "Case có PA" tên đã là đơn vị. */
  const phuCua = (h: H, c: CotBang) => (c.key === 'dat' ? tuMau(h.datMt) : c.key === 'case' && !cx ? (h.casePa.mo ? `${h.casePa.coPa}/${h.casePa.mo}` : null)
    : c.key === 'tt' ? tuMau(h.thiThat) : null);
  return (
    <Card title={t('Theo chi nhánh')} bodyClass="p-0">
      <Bang ten={t('Theo chi nhánh')} cot={cx ? COT_CN_CX : baoCao ? COT_CN_BC : COT_CN} hang={hang} khoa={(h) => h.khoa} oCua={oCua} phuCua={phuCua} khung={false} deu theLuoi
        onHang={cx ? undefined : (h) => { if (!h.tong) onChiNhanh(h.id); }} rong={{ tieuDe: t('Chưa có lớp nào trong khung này') }} />
    </Card>
  );
}

export function TongQuanQtV5({ d, onChiNhanh }: { d: TongQuanV5Data; onChiNhanh: (id: number) => void }) {
  const ft = d.ct === 'ft';
  return (
    <>
      <DaiChiSo>
        <ChiSo ten={t('Đạt MT')} ky={t('trong kỳ')} giaTri={ft ? <PhanTram x={d.datMt} nguon={qBc(d, '&o=dat-mt')} tieuDe={t('Đạt MT')} className="so-chinh" /> : <span className="text-slate-500">—</span>}
          mau={ft ? mauDatMt(d.datMt) : t('chỉ Fast Track')} />
        <ChiSo ten={t('Case có PA')} ky={t('hiện tại')} giaTri={<PhanTram x={{ dat: d.casePa.coPa, mau: d.casePa.mo }} nguon={qCn(d, 'caseMo', 'tong')} tieuDe={t('Case đang mở')} className="so-chinh" />}
          mau={<MauCasePa d={d} />} />
        <ChiSo ten={t('Đạt Target thi thật')} ky={t('trong kỳ')} giaTri={<PhanTram x={d.thiThat} nguon={qBc(d, '&o=dat-target-thi')} tieuDe={t('Đạt Target thi thật')} className="so-chinh" />}
          mau={tuMau(d.thiThat, t('HV'))} />
        <ChiSoThi d={d} />
      </DaiChiSo>
      <TheoChiNhanh d={d} onChiNhanh={onChiNhanh} />
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
        <ChiSo ten={t('Đạt MT')} ky={t('trong kỳ')} giaTri={ft ? <PhanTram x={d.datMt} nguon={qBc(d, '&o=dat-mt')} tieuDe={t('Đạt MT')} className="so-chinh" /> : <span className="text-slate-500">—</span>}
          mau={ft ? mauDatMt(d.datMt) : t('chỉ Fast Track')} />
        <ChiSo ten={t('Đạt Target thi thật')} ky={t('trong kỳ')} giaTri={ft ? <PhanTram x={d.thiThat} nguon={qBc(d, '&o=dat-target-thi')} tieuDe={t('Đạt Target thi thật')} className="so-chinh" /> : <span className="text-slate-500">—</span>}
          mau={ft ? tuMau(d.thiThat, t('HV')) : t('chỉ Fast Track')} />
        <ChiSo ten={tenDen(t('HV SOS 2–3'), sos23)} ky={t('hiện tại')} giaTri={<SoDen n={sos23} to={`/hoc-vien?view=sos&muc=23${cn}`} className="so-chinh" />} mau={t('HV')} />
        {/* AUDIT-UI B2 đồng bộ (PTA 08/11): tách ô hai số "Chờ KQ · Lộ trình tiếp" thành hai ô như TVV — mỗi ô một số, cùng đích đổi trang cũ. */}
        <ChiSo ten={tenDen(t('Chờ KQ thi thật'), hv.data?.dem['da-thi'] ?? 0)} ky={t('hiện tại')} giaTri={hv.data ? <SoDen n={hv.data.dem['da-thi']} to={den('da-thi')} className="so-chinh" /> : '…'} mau={t('HV')} />
        <ChiSo ten={tenDen(t('Chưa chốt lộ trình tiếp'), hv.data?.dem['cho-buoc-tiep'] ?? 0)} tenNgan={tenDen(t('Chưa chốt LT tiếp'), hv.data?.dem['cho-buoc-tiep'] ?? 0)} ky={t('hiện tại')}
          giaTri={hv.data ? <SoDen n={hv.data.dem['cho-buoc-tiep']} to={den('cho-buoc-tiep')} className="so-chinh" /> : '…'} mau={t('HV')} />
      </DaiChiSo>
      {d.chiNhanh ? <TheoChiNhanh d={d} cx onChiNhanh={onChiNhanh} /> : <LopCanChuY d={d} />}
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
export function OViecCuaToi() {
  const { session } = useSession();
  const viec = useSoViecCuaToi();
  if (!session?.nav?.workSupport) return null;
  /* TQ-GON (M4, V13): dòng phụ = đơn vị (+ ⚠ quá hạn khi có). */
  const o = <ChiSo ten={session.nav.work ? `${t('Việc của tôi')} ›` : t('Việc của tôi')} ky={t('hiện tại')} giaTri={viec?.viec ?? '…'}
    mau={<>{t('việc')}{!!viec?.viecQuaHan && <span className="font-semibold text-bad"> · ⚠ {t('{n} quá hạn', { n: viec.viecQuaHan })}</span>}</>} />;
  return session.nav.work
    ? <Link to="/cong-viec" className="block h-full rounded-xl no-underline hover:[&>.card]:border-[color:var(--accent)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--accent)]">{o}</Link>
    : o;
}

/* ───────────── GV ───────────── */

type ChiSoGv = { tu: string; den: string; ketQua: OPtGv; tienBo: OPtGv };
/** GV (chủ SP 23/10; Head tutor tạm dùng chung): Việc của tôi (+ quá hạn) · Case đang xử lý · Đạt kỳ vọng Test (kỹ năng tôi dạy) · Tiến bộ. */
/** `lopToiDay`: kỹ năng tôi dạy + chủ nhiệm xếp chồng, rộng hết trang (AUDIT-UI B1: bỏ cột "Điều hướng"). */
export function TongQuanGvV5({ lopToiDay }: { lopToiDay: ReactNode }) {
  const { session } = useSession();
  const id = session?.user?.id;
  /* S1: chỉ số GV lấy từ CÙNG GET của khối hai bảng (`HaiKhoiGv` — `useApi` gộp một request), không GET thêm chỉ số hồ sơ GV (tính lại y hệt). */
  const cs = useApi<{ chiSo: ChiSoGv }>('/tong-quan/lop-toi-day/hai-khoi', []).data?.chiSo;
  const nguonCase = `/giao-vien/${id}/o?cot=case-mo`;
  const caseMo = useApi<{ n: number }>(id ? nguonCase : null, [id]).data?.n;
  const o = (x: OPtGv | undefined, cot: string, nhan: string) => <PhanTram x={tyLeGv(x)} nguon={`/giao-vien/${id}/chi-so/o?cot=${cot}`} tieuDe={nhan} className="so-chinh" />;
  const ky = cs ? kyChu(cs) : undefined;
  return (
    <>
      <DaiChiSo>
        <OViecCuaToi />
        <ChiSo ten={t('Case đang xử lý')} ky={t('hiện tại')} giaTri={caseMo === undefined ? '…' : <OSo giaTri={caseMo} tieuDe={t('Case đang xử lý')} nguon={nguonCase} className="so-chinh" />}
          mau="Case" />
        <ChiSo ten={t('Đạt kỳ vọng Test')} ky={ky} giaTri={o(cs?.ketQua, 'ket-qua', t('Đạt kỳ vọng Test'))} mau={tuMau(tyLeGv(cs?.ketQua), t('lượt Test'))} />
        <ChiSo ten={t('Tiến bộ')} ky={ky} giaTri={o(cs?.tienBo, 'tien-bo', t('HV tiến bộ'))} mau={tuMau(tyLeGv(cs?.tienBo), t('lượt'))} />
      </DaiChiSo>
      {lopToiDay}
    </>
  );
}

/* ───────────── TVV: 4 ô, mỗi ô một số (AUDIT-UI B2) ───────────── */

type TqTvv = { ky: { tu: string; den: string }; baoPh: { dung: number; tong: number; treXong: number }; thiThangNay: number };
export function TongQuanTvvV5() {
  const tq = useApi<TqTvv>('/tong-quan/tvv', []);
  const hv = useApi<SoHv>('/tong-quan/hoc-vien', []);
  if (tq.error) return <ErrorState message={tq.error.message} hint={tq.error.hint} status={tq.error.status} onRetry={tq.reload} />;
  if (!tq.data) return <Skeleton rows={4} />;
  const d = tq.data;
  const den = (chip: string) => `/hoc-vien?phamVi=cua-toi&view=${chip}`;
  const choKq = hv.data?.dem['da-thi'] ?? 0, buoc = hv.data?.dem['cho-buoc-tiep'] ?? 0;
  return (
    <>
      {/* AUDIT-UI B2 (chủ SP 08/11): mỗi ô một số — thay ô hai số "Chờ KQ · Lộ trình tiếp" + thẻ link "Thi thật". XM 3 (chủ SP 11/11): + "Việc của tôi ›" đầu dải → 5 ô. */}
      <DaiChiSo nam>
        <OViecCuaToi />
        <ChiSo ten={t('Báo PH đúng hạn')} ky={kyChu(d.ky)} luat={t('Việc Báo PH đã báo trước hạn / việc Báo PH phát sinh trong kỳ.')}
          /* AUDIT-UI B2 (mockup `.gt0`): chưa có việc Báo PH → "—" mờ + dòng phụ "chưa có dữ liệu" (cùng dáng ô 0 bên cạnh). */
          giaTri={d.baoPh.tong ? <PhanTram x={{ dat: d.baoPh.dung, mau: d.baoPh.tong }} nguon="/tong-quan/tvv/o?o=bao-ph" tieuDe={t('Báo PH đúng hạn')} className="so-chinh" />
            : <span className="font-normal text-faint" aria-label={t('Chưa có dữ liệu')}>—</span>}
          mau={d.baoPh.tong ? <>{d.baoPh.dung}/{d.baoPh.tong} {t('việc')}{d.baoPh.treXong > 0 && <> · {t('xong trễ {n}', { n: d.baoPh.treXong })}</>}</> : t('chưa có dữ liệu')} />
        {/* TQ-GON (M3, M4): định nghĩa vào ⓘ, dòng phụ chỉ đơn vị; không lặp lại hai số đã hiện ("0 chờ KQ · 1 chưa chốt…"). */}
        <ChiSo ten={tenDen(t('Thi tháng này'), d.thiThangNay)} ky={t('hiện tại')} luat={LUAT_THI} giaTri={<SoDen n={d.thiThangNay} to="/hoc-vien?phamVi=cua-toi&thi=1" className="so-chinh" />} mau={t('HV')} />
        <ChiSo ten={tenDen(t('Chờ KQ thi thật'), choKq)} ky={t('hiện tại')} giaTri={hv.data ? <SoDen n={choKq} to={den('da-thi')} className="so-chinh" /> : '…'} mau={t('HV')} />
        <ChiSo ten={tenDen(t('Chưa chốt lộ trình tiếp'), buoc)} tenNgan={tenDen(t('Chưa chốt LT tiếp'), buoc)} ky={t('hiện tại')}
          giaTri={hv.data ? <SoDen n={buoc} to={den('cho-buoc-tiep')} className="so-chinh" /> : '…'} mau={t('HV')} />
      </DaiChiSo>
    </>
  );
}

/* ───────────── Admin · Head tutor ───────────── */

/** XM 3 (chủ SP 11/11): ô "Việc của tôi ›" của Admin đứng đầu dải ô Mock Test (`MockTestAdmin`) — 4 ô một hàng. */
export function TongQuanAdminV5({ mockTest, lich }: { mockTest: ReactNode; lich: ReactNode }) {
  return <BoCuc trai={<>{mockTest}{lich}</>} />;
}

/**
 * AUDIT-UI B1 + B2 (chủ SP 08/11): link cạnh tiêu đề thay thẻ "Điều hướng" — chỉ đích KHÔNG có ở ô số hay menu.
 * Bỏ: "Việc của tôi" (ô số + menu Công việc), "Thi tháng này" / "Case chưa có PA" (ô số mở panel), "Học viên & Lớp" (menu), 3 link thẻ "Thi thật" TVV (nay là ô số).
 */
export function lienKetTq(vai: string, o: { id?: number; cn: number | null; ky?: { tu: string; den: string } | null; motCn?: boolean }): LienKetTq[] {
  const cn = o.cn ? `&cn=${o.cn}` : '';
  const baoCao = { to: `/phan-tich?goc=bao-cao${cn}`, nhan: t('Báo cáo'), goiY: o.ky ? kyChu(o.ky) : undefined };
  const lichThi = { to: `/hoc-vien?view=lich-thi${cn}`, nhan: t('Lịch thi') };
  if (vai === 'tvv') return [{ to: '/hoc-vien?phamVi=cua-toi', nhan: t('HV của tôi') }];
  if (vai === 'gv' || vai === 'ht') return o.id ? [{ to: `/giao-vien/${o.id}`, nhan: t('Hồ sơ GV của tôi') }] : [];
  if (vai === 'admin') { const q = o.cn ? `?cn=${o.cn}` : ''; return [{ to: `/test/lich${q}`, nhan: t('Lịch tuần') }, { to: `/test/ke-hoach${q}`, nhan: t('Kế hoạch Test') }]; }
  if (vai === 'cx') return [lichThi, { ...baoCao, nhan: t('Báo cáo HV') }];
  return o.motCn ? [lichThi, baoCao] : [{ to: '/phan-tich?goc=giao-vien', nhan: t('Phân tích GV') }, baoCao];
}
