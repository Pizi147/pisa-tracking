import { type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useSession } from '../../lib/session.tsx';
import { useSoViecCuaToi } from '../../lib/viecCuaToi.ts';
import { OChiSo } from '../../ui/ui.tsx';
import { OSo } from '../../ui/OSo.tsx';
import { DaiChiSo as DaiChiSoMong, ODai, SoDen as SoDenDai, SoTinh } from '../../ui/DaiChiSo.tsx';
import { LOP_OSO, VUNG_BAM_SO } from '../../ui/SoLieu.tsx';
import { CHIP_SOS, lopSos } from '../../ui/Nhan.tsx';
import { NutLuat } from '../../ui/NutLuat.tsx';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import { rateView, thamSoCt, tuanLich, type ChuongTrinh, type PhanTichGvKq, type OPtGv } from '@shared/domain/index.ts';
import { t } from '@shared/i18n/index.ts';

/**
 * TỔNG QUAN V5 (UI-TONG-QUAN, `thiet-ke/v5/tong-quan.html` phương án B "Tình hình trái · Điều hướng phải"). Không ô nhập trên trang (C04): số gạch chân
 * = panel chỉ đọc (cùng hàm Phân tích), "›" = đổi trang, "?" = giải thích. Mỗi vai một hàm vẽ; dữ liệu QL / QT / CX từ MỘT GET `/tong-quan/v5`.
 */
/** `pt` (thi thật GV, 2F): % theo tuần dạy — thay `dat / mau` khi có. */
export type TyLeV5 = { dat: number; mau: number; pt?: number };
type DongLop = { id: number; khoa: string; ma: string; hv: number; gvcn: string | null; datMt: TyLeV5 | null; sos: [number, number, number]; caseChuaPa: number; thiThangNay: number; sos23Ids: number[] };
type DongCn = { id: number; khoa: string; ten: string; datMt: TyLeV5 | null; casePa: { coPa: number; mo: number }; thiThat: TyLeV5 | null; thiThangNay: number; sos23: number; sos23Ids: number[]; caseChuaPa: number };
export type TongQuanV5Data = {
  homNay: string; ky: { tu: string; den: string }; ct: ChuongTrinh; branchId: number | null; tenChiNhanh: string | null;
  datMt: (TyLeV5 & { chuaDu: number }) | null; casePa: { coPa: number; mo: number; chuaPa: number }; thiThangNay: number; thiThat: TyLeV5 | null;
  lop: DongLop[] | null; chiNhanh: DongCn[] | null;
  /** NHẸ HƠN PR-3: lớp của mọi chi nhánh (chế độ chi nhánh) · SOS 1 / 2 / 3 cả phạm vi. */
  lopCn: { id: number; ma: string; cn: string; sos: [number, number, number]; sos23Ids: number[] }[] | null; sos: [number, number, number];
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
      <h1 className="m-0 text-[20px] font-bold leading-[1.3] text-slate-100">{t('Tổng quan')}</h1>
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
/** Ô "Thi tháng này": định nghĩa vào ⓘ. */
const LUAT_THI = t('HV có ngày thi thật đã chốt trong tháng này.');

/** Số đếm đầu khối (⑤ G2): khung viền nhỏ cạnh tên khối — "Chờ duyệt 10", "Lớp cần chú ý 4". */
export const DemDau = ({ n }: { n: number }) => (
  <span className="ml-2 inline-flex h-[22px] min-w-[22px] items-center justify-center rounded border px-[7px] align-middle text-xs font-semibold tabular-nums text-[color:var(--text)]"
    style={{ borderColor: 'var(--line-strong)', background: 'var(--surface)' }}>{n}</span>
);

export const tyLeGv = (o: OPtGv | undefined): TyLeV5 | null => (!o || o.k === 'na' ? null : o.k === 'rong' ? { dat: 0, mau: 0 } : { dat: o.dung, mau: o.tong, ...(o.pt != null ? { pt: o.pt } : {}) });
export const gopKq = (kq: Record<string, OPtGv>): TyLeV5 | null => {
  const so = Object.values(kq).filter((o): o is Extract<OPtGv, { k: 'so' }> => o.k === 'so');
  if (!so.length) return Object.values(kq).some((o) => o.k === 'rong') ? { dat: 0, mau: 0 } : null;
  return so.reduce((a, o) => ({ dat: a.dat + o.dung, mau: a.mau + o.tong }), { dat: 0, mau: 0 });
};
type HangGv = PhanTichGvKq['hang'][number];
/** Dòng phụ tên GV = môn dạy ("L · R · W2"). Chủ SP 23/10 (vòng 2): bỏ hẳn dòng "GVCN + danh sách lớp" (xấu, dài) — Tổng quan + Phân tích GV dùng chung. */
export const phuGv = (h: Pick<HangGv, 'mon'>) => h.mon || null;

/* ───────────── Việc của tôi (mọi vai có Công việc) ───────────── */

/**
 * Ô "Việc của tôi ›" — GV (chủ SP 23/10) + [XM 3] chủ SP 11/11: TVV · QL · Admin cũng có (CLAUDE.md "việc của tôi ở trang đầu vai"). Số = `summary.viec` của `/my-work`
 * (cùng `demDongViec` với badge / Công việc), đọc từ bản khung App đã tải cho badge (`useSoViecCuaToi`) — KHÔNG GET `/my-work` lần nữa (trước XM 3 Tổng quan GV
 * tự gọi nên thường thành hai lời gọi `/my-work` mỗi lần mở trang). Cả ô là link Công việc (MO-TAT-CA 05/11).
 * Head tutor chưa có Công việc (không `workSupport`) → không ô.
 */
/* `dai` — GD-4 e (⓪ dòng 22, trang-dau-tvv [XM-1]): ô của dải mỏng — số không bấm, giữ "m quá hạn"; nhãn "Việc ›" đổi trang Công việc. */
export function OViecCuaToi({ dai, khongBam, lienKet }: { dai?: boolean; /** GD-8: đang ở Công việc — nhãn "Việc" không link ([XM-1]). */ khongBam?: boolean;
  /** NHẸ HƠN PR-3 ([XM-P3-5]): Tổng quan v23 không còn dải ô — "Việc của tôi · n ›" thành link gọn ở đầu trang (giữ thao tác XM 3, cùng số badge). */ lienKet?: boolean } = {}) {
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
  /* GD-14 (lời 37, ⑧ C3): dòng phụ chỉ khi cần làm — "n quá hạn" đỏ; 0 việc → mờ, không "›", không bấm (như mọi ô số).
     DEM-VIEC (chủ SP 18/11): số = dòng Công việc "Của tôi" (cùng đường `/my-work`, cùng chi nhánh mặc định) — cả ô mở đúng danh sách đó; "n quá hạn" mở lọc Quá hạn. */
  const n = viec?.viec ?? null;
  const bam = !!session.nav.work && !!n;
  /* `khung=tat-ca`: không dùng khung đã nhớ ở Công việc — mở đúng tập đã đếm (mọi khung). */
  const den = session.nav.workOps || session.nav.workChamDiem ? '/cong-viec?nguoi=toi&khung=tat-ca' : '/cong-viec?khung=tat-ca';
  const qh = viec?.viecQuaHan ?? 0;
  if (lienKet) {
    if (!bam) return <span className="text-sm text-dim max-sm:min-h-[44px]">{t('Việc của tôi')} · <span className="tabular-nums">{n ?? '…'}</span></span>;
    return (
      <Link to={den} className="inline-flex items-center gap-1 whitespace-nowrap text-sm font-semibold text-[color:var(--accent)] no-underline hover:underline max-sm:min-h-[44px]">
        {t('Việc của tôi')} · <span className="tabular-nums">{n}</span>{qh > 0 && <span className="font-semibold text-bad">({t('{n} quá hạn', { n: qh })})</span>} ›
      </Link>
    );
  }
  return <ChiSo ten={bam ? `${t('Việc của tôi')} ›` : t('Việc của tôi')} ky={t('hiện tại')}
    giaTri={bam ? <SoDen n={n!} to={den} className="so-chinh" /> : n === 0 ? <span className="font-normal text-faint">0</span> : n ?? '…'}
    mau={qh ? (bam ? <Link to={`${den}${den.includes('?') ? '&' : '?'}loc=qua-han`} className="font-semibold text-bad underline underline-offset-[3px]">{t('{n} quá hạn', { n: qh })}</Link>
      : <span className="font-semibold text-bad">{t('{n} quá hạn', { n: qh })}</span>) : null} />;
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
      <ODai nhan={t('Chưa chốt bước tiếp')}>
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
