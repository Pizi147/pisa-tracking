import { Fragment, Suspense, useEffect, useId, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { OTuanDay, type KnHop } from './TuanDayGv.tsx';
import { Link } from 'react-router-dom';
import { INTERVENTION_KIND_LABEL, METRIC_UNIT_LABEL, caseTiep, chuDiem, dauDiem, mucDiem, deadlineView, duongHoSoHocVien, maView, metricById, nhanDocDiem, nhanQuaHan, tenMonNgan, thamSoCt, tuanLich, BUOC_CASE, NHAN_BUOC_CASE, buocCuaDong, type BuocCase, type ChiSo, type ChuongTrinh, type DeadlineKind, type DiemHv, type NhomCaseChuaChot } from '@shared/domain/index.ts';
import { useApi } from '../lib/useApi.ts';
import { XemCha, useThamSoUrl, useXem } from '../lib/quayLai.ts';
import { api, invalidate, type ApiError } from '../lib/api.ts';
import { useSession } from '../lib/session.tsx';
import { KhungPanel } from './KhungPanel.tsx';
import { HangTab } from './HangTab.tsx';
import { CanLam, DiemKq, NutChu, NutHoanTac } from './KhuonViec.tsx';
import { lopKq } from './BieuTuong.tsx';
import { BadgeHan, CHIP_SOS, CHIP_VUONG, ChipHan, ChipSoQuaHan, lopSos } from './Nhan.tsx';
import { XemThem, useXemThem } from './PhanTrang.tsx';
import { Bang, OBang, type CotBang } from './Bang.tsx';
import { Empty, ErrorState, Skeleton } from './ui.tsx';
import { useNgayNghiepVu } from './ngayNghiepVu.ts';
import { NutLuat } from './NutLuat.tsx';
import { dich, dichDu, t } from '@shared/i18n/index.ts';
import { lazyTai } from '../lib/taiLaiManh.ts';
import { fmtBand } from '../lib/format.ts';

/**
 * KHUNG-LOI (B-02): vùng bấm của số ≥ 24 × 24 px máy tính, 44 × 44 px điện thoại — `after:` canh giữa chữ số (hình chữ không đổi; trước đây
 * chỉ đúng chữ số, 8 × 12 px). Mẫu chip của `MenuDong`.
 */
/** NEN-V5 → SO-GON (DESIGN G6, 05/11) — dáng số bấm được (`OSo`, ô chỉ số): màu nhấn, đậm; gạch chân liền 1 px chỉ khi rê / focus (lớp `so-bam`,
 *  luật ở `index.css`: số giữa câu `.text-xs` giữ gạch; trong ô bảng chữ 500); rê chuột nền nhấn nhạt. */
export const LOP_OSO = 'so-bam appearance-none rounded border-0 bg-transparent p-0 cursor-pointer tabular-nums font-bold text-[color:var(--accent)] underline decoration-1 underline-offset-[3px] hover:bg-[color:var(--accent-soft)]';
/** Màu chữ của nơi gọi: màu nghĩa (quá hạn, chưa đạt) giữ; màu chữ thường (`text-slate-*`, dáng cũ) bỏ để số bấm được cùng một màu nhấn. */
export const mauOSo = (lop: string) => (/\btext-(bad|late|soon|kq-duoi|kq-vuot|kq-bang)\b/.test(lop) ? `${LOP_OSO.replace('text-[color:var(--accent)] ', '')} ${lop}` : `${LOP_OSO} ${lop.replace(/\btext-slate-\d+\b/g, '')}`);
export const VUNG_BAM_SO = "relative after:absolute after:left-1/2 after:top-1/2 after:h-6 after:w-6 after:min-w-full after:-translate-x-1/2 after:-translate-y-1/2 after:content-[''] max-sm:after:h-11 max-sm:after:w-11";

const THOI_GIAN_NHAN: Record<ChiSo['thoiGian'], string> = {
  'hien-trang': t('Hiện trạng — tính tại ngày dữ liệu'),
  'phat-sinh-trong-ky': t('Phát sinh trong kỳ'),
  'ket-qua-trong-ky': t('Kết quả trong kỳ'),
};

export type PhamViSoLieu = { branchId?: number | null; chuongTrinh?: ChuongTrinh | null };
/** OV-12e (P12): việc của một dòng — máy chủ `ViecDong` (`server/src/worklist/metrics.ts`). `lam` = người xem làm được; máy chủ vẫn kiểm quyền khi lưu. */
export type ViecDongSoLieu = {
  chu: string;
  loai: 'xac-nhan' | 'ghi-nhan-xet' | 'xac-nhan-pa' | 'ghi-ket-qua' | 'them-pa' | 'hoan-thanh' | 'nhap-diem' | 'van-hanh';
  loaiHan: DeadlineKind | null; han: string | null; lam: boolean;
  caseId?: number; paId?: number;
  pa?: { kind: string; description: string | null; performer: string | null; performerUserId: number | null; soBuoi: number | null; mocChu: string | null };
  classId?: number; luot?: string; kn?: string; studentId?: number;
};
/** PR-VAI-a (Q26): dòng Case/PA có người phụ trách + hạn — panel ghi "người · quá hạn n ngày". OV-12e: đầu dòng v3 + việc của dòng. */
export type DongSoLieu = {
  id: number; title: string; sub: string; href: string; nguoi?: string | null; han?: string | null;
  em?: { id: number; ten: string } | null; lop?: string | null; ngCanh?: string | null; nguoiId?: number | null; ngayThiThat?: string;
  /** TQ-SOS-CN: mức SOS của em (panel SOS 2–3) — badge cạnh tên, cùng dáng chip SOS mọi nơi. */
  sos?: { muc: number; tam: boolean } | null;
  viec?: ViecDongSoLieu | null; tinhTrang?: string | null;
  /** PANEL-RIENG (XM-2): bài không có người chấm (môn chưa phân công) — "chưa phân công" + "Phân công ›" (QL). */
  chuaPhanCong?: true;
  /** M6 6b-2 (Q3): dòng "Case chưa chốt PA" — nhóm phân rã máy chủ; có nhóm thì panel vẽ dải nhóm và dòng mở view Case trong cùng panel. */
  nhom?: NhomCaseChuaChot | null;
  /** GD-21 (LG-13): bước của Case — dải bước của panel Case. */
  buoc?: BuocCase | null;
  /** GD-21: kỹ năng của Case (cột Case chỉ ghi kỹ năng). */
  kyNang?: string | null;
  luot?: string | null;
  moTa?: string | null;
  deMuc?: string | null;
  /** 6c-2 (#632 XM-1): dòng Case — điểm kỹ năng ở lượt mở Case (máy chủ `rowsFor('case')`). */
  diemCase?: { so: number; kyVong: number | null; luot: string | null; nhan?: string | null } | null;
  /** UI-HO-SO-GV: dòng kết quả — mốc so, kết luận (tab Chưa đạt · Đạt · Vượt). Điểm từng kỹ năng nay ở `diemHv` (PANEL-MC). */
  soVoi?: { nhan: string; v: number } | null; ketQua?: 'dat' | 'chua'; vuot?: boolean;
  /** PANEL-V10 (N30): điểm ĐÚNG lượt làm em vào con số — `null` = em chưa có lượt có điểm; vắng = dòng không phải HV. */
  diemHv?: DiemHv | null;
  /** PANEL-V10: Tiến bộ kỹ năng / PA cải thiện — chip đầu dòng + điểm hai lượt. */
  xuHuong?: { huong: 'tang' | 'giam' | 'giu' | 'cai-thien' | 'chua-cai-thien'; truoc?: { luot: string; v: number }; sau?: { luot: string; v: number } } | null;
};

/**
 * DÒNG ĐIỂM MỘT MẪU (PANEL-V10, mockup `.dd`; chủ SP 30/10): lượt · tuần · "tạm" │ từng kỹ năng ✓ / ✗ TRƯỚC số (đạt / không đạt của CHÍNH lượt — không ▲ ▼)
 * │ Overall ✓ / ✗ + mốc so. Đạt và hụt cùng màu ô Overall (`DiemKq`: `text-kq-bang` / `text-kq-duoi`); chưa đủ căn cứ: không ký hiệu.
 * `knNhan` = kỹ năng của chỉ số đang xem (nền nhấn) · `cua` (hồ sơ GV) = kỹ năng GV phụ trách (viền nhấn, XM-2) · `kck` = hụt không tô đỏ (như `ODiem`).
 */
export function DongDiem({ d, knNhan, kck, rongLuot }: { d: DiemHv; knNhan?: string | null; kck?: boolean;
  /** Cột lượt hẹp hơn 132 px khi mọi dòng cùng nơi chỉ một nhãn ngắn ("Final" ở thẻ Xét lại) — chừa chỗ cho 4 môn % + Tổng trong thẻ hẹp. */
  rongLuot?: number }) {
  const pt = d.donVi === '%';
  const so = (v: number) => chuDiem(v, pt);
  /* Ba màu kết quả như `ODiem` (chủ SP 04/11): vượt / bằng / dưới so mốc của dòng; KCK hụt không tô. */
  const mau = (dat: boolean | null, v: number | null) => (dat === false && kck ? '' : lopKq(mucDiem(dat, v, d.soVoi?.v)));
  const ovDat = d.overall != null && d.soVoi ? d.overall >= d.soVoi.v : null;
  return (
    <span className={`dd mt-1${pt ? ' pt' : ''}`} style={{ ...(d.kn.length !== 4 ? { '--so-kn': d.kn.length } : {}), ...(rongLuot ? { '--rong-lu': `${rongLuot}px` } : {}), ...(d.thiThat ? { '--rong-kn': '80px' } : {}) } as CSSProperties}>
      <span className="lu">
        <span>{[d.luot, d.tuan && tuanLich(d.tuan)].filter(Boolean).join(' · ')}</span>
        {d.tam && <span className="tam-chu" title={t('Lượt chưa chốt điểm')}>{t('tạm')}</span>}
      </span>
      {d.kn.map((k) => (
        <span key={k.k} role="img" aria-label={nhanDocDiem(k, d.soVoi)} title={k.dat === false ? nhanDocDiem(k, d.soVoi) : undefined}
          className={`k${k.v === null ? ' thieu' : k.dat === false && !kck ? ' h' : ''}${k.cua ? ' cua' : knNhan === k.k ? ' nhan' : ''}`}>
          <i aria-hidden>{k.k}</i>{d.thiThat && k.v !== null && /^[LRWS]$/.test(k.k)
            /* TL-GV (v20): dòng thi thật — ô điểm hộp → hộp Tuần dạy. */
            ? <OTuanDay kn={k.k.toLowerCase() as KnHop} cycleId={d.thiThat.cycleId} ten={d.thiThat.ten} target={d.soVoi?.v ?? null} nhan={`${k.k} ${so(k.v)}`}>
              <b aria-hidden className={mau(k.dat, k.v)}>{`${dauDiem(k.dat) ? `${dauDiem(k.dat)} ` : ''}${so(k.v)}`}</b></OTuanDay>
            : <b aria-hidden className={mau(k.dat, k.v)}>{k.v === null ? '—' : `${dauDiem(k.dat) ? `${dauDiem(k.dat)} ` : ''}${so(k.v)}`}</b>}
        </span>
      ))}
      <span className="ov">
        {pt ? t('Tổng') : 'Overall'}
        {d.overall == null ? <b className="font-medium text-faint">—</b> : <b className={mau(ovDat, d.overall)}>{ovDat === null ? '' : ovDat ? '✓ ' : '✗ '}{so(d.overall)}</b>}
        {d.soVoi && <span>/ {pt ? t('ngưỡng') : d.soVoi.nhan} {so(d.soVoi.v)}</span>}
      </span>
    </span>
  );
}

/** PANEL-V10: chữ chip xu hướng — ▲ ▼ CHỈ cho tiến độ (so lượt trước), ký hiệu đi trước chữ: "▲ Tăng 1.0" · "▼ Giảm 0.5" · "= Không đổi" · "Cải thiện". */
export function chuXuHuong(x: NonNullable<DongSoLieu['xuHuong']>): { lop: string; chu: string } {
  const lech = x.truoc && x.sau ? fmtBand(Math.abs(x.sau.v - x.truoc.v)) : null;
  if (x.huong === 'tang') return { lop: 'tang', chu: [`▲ ${t('Tăng')}`, lech].filter(Boolean).join(' ') };
  if (x.huong === 'giam') return { lop: 'giam', chu: [`▼ ${t('Giảm')}`, lech].filter(Boolean).join(' ') };
  if (x.huong === 'giu') return { lop: '', chu: `= ${t('Không đổi')}` };
  return x.huong === 'cai-thien' ? { lop: 'ct', chu: t('Cải thiện') } : { lop: '', chu: t('Chưa cải thiện') };
}

/** PANEL-V10: lớp chỉ hiện khi tiêu đề panel chưa ghi lớp đó ("SOS 2 · MB FT 101" thì dòng không lặp "MB FT 101"). */
export const hienLop = (tieuDe: string, lop: string | null | undefined): boolean => !!lop && !tieuDe.includes(lop);

type Drill = {
  id: string; unit: ChiSo['donVi']; n: number; numerator: number | null;
  empty: boolean; note: string | null; today: string;
  rows?: DongSoLieu[];
};

/** Tham số truy vấn của một lần mở danh sách — Y HỆT tham số đã dùng để tính con số. */
export function qsSoLieu(phamVi?: PhamViSoLieu, extra?: Record<string, string>): string {
  const b = phamVi?.branchId ?? null;
  const ex = extra ? Object.entries(extra).map(([k, v]) => `&${k}=${encodeURIComponent(v)}`).join('') : '';
  return `rows=1${b ? `&branchId=${b}` : ''}${thamSoCt(phamVi?.chuongTrinh ?? null)}${ex}`;
}

/** Hộp "Cách tính" — chữ đọc thẳng từ sổ; nhãn theo THUAT_NGU g12-021/022. */
function CachTinh({ cs }: { cs: ChiSo }) {
  const { homNay, ngan } = useNgayNghiepVu();
  return (
    <div className="text-xs text-slate-400 leading-relaxed space-y-1">
      <div><strong className="text-slate-300">{t('Chỉ số:')}</strong> {cs.cauHoi}</div>
      <div><strong className="text-slate-300">{t('Đối tượng tính:')}</strong> {cs.tapDuDieuKien}</div>
      <div><strong className="text-slate-300">{t('Không đếm trùng:')}</strong> {cs.khuTrung}</div>
      <div><strong className="text-slate-300">{t('Thời gian:')}</strong> {THOI_GIAN_NHAN[cs.thoiGian]}</div>
      <div><strong className="text-slate-300">{t('Dữ liệu đến:')}</strong> {ngan(homNay)}</div>
    </div>
  );
}

/** Hạn trong câu tình trạng của dòng: quá hạn badge đỏ "quá hạn n ngày" · còn ≤ 3 ngày badge vàng · xa hơn thường — ngưỡng từ `deadlineView` (một chỗ). */
function HanDong({ han, loai }: { han: string; loai?: DeadlineKind | null }) {
  const { homNay, ngan } = useNgayNghiepVu();
  const v = deadlineView({ kind: loai ?? 'viec-van-hanh', due: han, today: homNay });
  return v.tone === 'overdue' ? <BadgeHan muc="qua">{nhanQuaHan(v.daysOverdue)}</BadgeHan>
    : v.ganHan ? <BadgeHan muc="gan">{t('hạn {ngay}', { ngay: ngan(han) })}</BadgeHan> : <span className="tabular-nums">{t('hạn {ngay}', { ngay: ngan(han) })}</span>;
}

/**
 * GD-21 (mockup ⑬ B1): DẢI BƯỚC của panel Case — bốn bước (tên trên, số dưới, màu thường — chủ SP 15/11: không tô số) + ngoặc "Chưa có PA" trùm hai bước đầu.
 * Bấm bước để bật / tắt lọc (nhiều bước cùng lúc); "Bỏ lọc bước" trả về bộ lọc của nguồn mở. Số = số Case còn chờ ở bước đó, tính trên dữ liệu đã nạp (0 request).
 */
function DaiBuoc({ hien, loc, soLoc, datLoc }: {
  hien: (DongSoLieu & { xong?: string })[]; loc: BuocCase[]; soLoc: number; datLoc: (b: BuocCase[] | null) => void;
}) {
  const so = (b: BuocCase) => hien.filter((r) => !r.xong && buocCuaDong(r) === b).length;
  const bat = (b: BuocCase) => loc.includes(b);
  const bam = (b: BuocCase) => datLoc(bat(b) ? loc.filter((x) => x !== b) : [...loc, b]);
  const dauHai = BUOC_CASE.slice(0, 2);
  const chuaPa = dauHai.every(bat) && loc.length === 2;
  const tong = so(dauHai[0]) + so(dauHai[1]);
  return (
    <div className="mb-3">
      {/* Ngoặc "Chưa có PA" trùm hai bước đầu (⑬ B1): viền mảnh, chữ giữa đường viền trên; "Bỏ lọc bước" ở hàng ngoặc, chỉ khi đang lọc. */}
      {/* Ngoặc "Chưa có PA" (⑬ B1): trùm đúng hai ô đầu — mép trái ô 1 tới mép phải ô 2 (cùng lưới 4 cột + 1 px viền của dải), viền màu nhấn, chữ đậm, số nổi. */}
      <div className="grid grid-cols-4 px-px max-sm:grid-cols-2">
        <div className="relative col-span-2 mt-3 h-[18px] rounded-t-md border-x border-t-2" style={{ borderColor: 'var(--accent)' }}>
          <button type="button" aria-pressed={chuaPa} onClick={() => datLoc(chuaPa ? [] : [...dauHai])}
            className="absolute left-1/2 top-0 inline-flex min-h-[28px] -translate-x-1/2 -translate-y-1/2 appearance-none items-center gap-1.5 whitespace-nowrap rounded-md border-0 bg-[color:var(--surface)] px-2.5 text-[14px] font-bold text-[color:var(--accent)] max-sm:min-h-[44px]"
            style={chuaPa ? { background: 'var(--accent-soft)' } : undefined}>
            {t('Chưa có PA')} · <span className="text-[17px] tabular-nums">{tong}</span>
          </button>
        </div>
        {loc.length > 0 && <button type="button" className="link col-span-2 mt-3 self-start justify-self-end appearance-none whitespace-nowrap border-0 bg-transparent p-0 text-[13px] max-sm:min-h-[44px]" onClick={() => datLoc(null)}>{t('Bỏ lọc bước')}</button>}
      </div>
      <div role="group" aria-label={t('Lọc theo bước')} className="grid grid-cols-2 overflow-hidden rounded-lg border sm:grid-cols-4" style={{ borderColor: 'var(--line-strong)' }}>
        {BUOC_CASE.map((b, i) => (
          <button key={b} type="button" aria-pressed={bat(b)} disabled={!so(b)} onClick={() => bam(b)}
            className={`flex min-h-[44px] min-w-0 appearance-none flex-col items-start justify-center gap-0.5 border-0 px-3 py-1.5 text-left disabled:opacity-50 sm:min-h-[52px] ${i % 2 ? 'max-sm:border-l' : ''} ${i > 0 ? 'sm:border-l' : ''} ${i > 1 ? 'max-sm:border-t' : ''}`}
            style={{ borderColor: 'var(--line-strong)', background: bat(b) ? 'var(--accent-soft)' : 'transparent', boxShadow: bat(b) ? 'inset 0 -2px 0 var(--accent)' : undefined }}>
            <span className="text-[13px] font-medium leading-tight text-slate-300">{NHAN_BUOC_CASE[b]}</span>
            <span className="text-[15px] font-bold tabular-nums text-slate-100">{so(b)}</span>
          </button>
        ))}
      </div>
      {loc.length > 0 && (
        <p className="m-0 mt-1.5 text-[13px] text-slate-400" role="status">{t('Đang lọc: {buoc} · {n}', { buoc: loc.map((b) => NHAN_BUOC_CASE[b]).join(' · '), n: soLoc })}</p>
      )}
    </div>
  );
}

/** 6c-2 (critique 375): các đoạn ngăn "·", mỗi đoạn không ngắt giữa — xuống dòng chỉ ở giữa hai đoạn (không tách "MB / FT 101", "Chưa / đạt"). */
function Doan({ ds }: { ds: ReactNode[] }) {
  /* `<wbr />` sau "·": chỗ ngắt dòng duy nhất (đoạn nowrap sát nhau không tự ngắt) — "·" ở cuối dòng trên, không mồ côi đầu dòng. */
  return <>{ds.filter((x) => x || x === 0).map((x, i) => (
    <Fragment key={i}>{i > 0 && <><span aria-hidden className="mx-1.5 text-slate-500">·</span><span className="sr-only">, </span><wbr /></>}<span className="whitespace-nowrap">{x}</span></Fragment>
  ))}</>;
}
/** MAU-THONG-NHAT (chủ SP 05/11): đoạn kết luận trong `sub` theo màu kết quả — Đạt xanh dương (dòng `vuot`: xanh lá), Chưa đạt đỏ. */
const toKetLuan = (x: string, vuot?: boolean): ReactNode => (x === 'Đạt' || x === 'Chưa đạt'
  ? <span className={`font-semibold ${lopKq(x === 'Chưa đạt' ? 'duoi' : vuot ? 'vuot' : 'dat')}`}>{t(x)}</span> : x);
/** 6c-2 (critique vòng 3): MỘT cách ghi "điểm so kỳ vọng" cho mọi dòng panel số — "[nhãn] ✗ 5.5 · kỳ vọng 6.5 · thiếu 1.0" (✓ / ✗ + màu `DiemKq`). */
const doanDiem = (d: NonNullable<DongSoLieu['diemCase']>): ReactNode[] => [
  <>{d.nhan && <>{d.nhan} </>}<DiemKq diem={d.so} kyVong={d.kyVong} /></>,
  d.kyVong != null && t('kỳ vọng {kv}', { kv: fmtBand(d.kyVong) }),
  d.kyVong != null && d.so < d.kyVong && t('thiếu {n}', { n: fmtBand(d.kyVong - d.so) }),
];


/* Việc dài của dòng (Ngăn Case, Nhập điểm, Vận hành) chỉ tải khi bấm — trang có ô số không kéo cả cây panel làm việc vào lần tải đầu. */
const LamDongSoLieu = lazyTai(() => import('../modules/worklist/LamDongSoLieu.tsx').then((m) => ({ default: m.LamDongSoLieu })));


/** GD-21 (chủ SP 15/11): mô tả Case cắt THEO CÂU — lấy câu đầu (nguyên), thêm câu sau chừng nào còn vừa ~170 ký tự; không "…" giữa chữ. */
function catCau(s: string, toiDa = 170): string {
  const cau = s.replace(/[ \t\r\n]+/g, ' ').trim().match(/[^.!?;]+[.!?;]?/g) ?? [s];
  let out = '';
  for (const c of cau) { if (out && (out + c).length > toiDa) break; out += c; }
  return out.trim();
}
/** GD-21: hàng của bảng Case theo bước — dải nhóm (bước) hoặc một Case. */
type HangCase = { k: string; ten: string; conCho: number; tre: number } | { k: string; r: DongSoLieu & { xong?: string } } | { k: string; them: number; nhom: string };
const COT_CASE: readonly CotBang[] = [
  { key: 'hv', nhan: t('Học viên'), kieu: 'ten', rong: 200 }, { key: 'case', nhan: t('Case'), kieu: 'chu', linhHoat: true },
  { key: 'gv', nhan: t('Phụ trách'), kieu: 'chu', rong: 180 }, { key: 'han', nhan: t('Hạn'), kieu: 'chip', rong: 150 },
];

/**
 * PANEL DANH SÁCH CỦA MỘT CON SỐ — hệ panel v3 (OV-12e, P12, mockup v3 §10). Đầu: tên số liệu + "n quá hạn" / "n Case · quá hạn lên đầu".
 * Mỗi dòng = đầu thu gọn (việc + chip hạn / em · lớp · ngữ cảnh · người làm nếu không phải bạn). Bấm dòng → MỞ RỘNG TẠI CHỖ: người làm được thấy
 * khối Cần làm (Xác nhận PA làm ngay trong dòng; việc dài → THAY nội dung panel bằng panel làm việc sẵn có, "← Danh sách" về đúng dòng);
 * người khác thấy câu tình trạng. Link "Hồ sơ" cuối dòng tách khỏi nút làm. Số ở đầu = số dòng (cùng tập máy chủ trả; dòng vừa xong mà máy chủ không còn
 * trả vẫn giữ chỗ cũ với "✓", không đếm). "Cách tính" ở cuối danh sách.
 */
export function NganDanhSach({ nguon, tieuDe, dv, data, loading, error, reload, onDong, cachTinh, trong, knNhan }: {
  tieuDe: string; dv?: string | null;
  /** GD-21: đường nguồn — `cot=caseChuaChot` / `case-chua-pa` = mở từ ô "Case chưa có PA" (hai bước đầu bật sẵn). */ nguon?: string;
  /** PANEL-V10: kỹ năng của chỉ số ("R" ở Dưới kỳ vọng · R) — cột đó trong dòng điểm có nền nhấn (cột lý do). */
  knNhan?: string | null;
  data: { n: number; rows: DongSoLieu[] } | null; loading: boolean; error: ApiError | null; reload: () => void; onDong: () => void;
  cachTinh?: ReactNode; trong?: string;
}) {
  const { homNay } = useNgayNghiepVu();
  const phien = useSession().session;
  const toi = phien?.user?.id ?? null;
  const laQl = !!phien?.nav?.workOps;
  /* OV-13b: dòng đang mở rộng ghi lên URL (`?dong=`) — về từ hồ sơ (‹ Tổng quan) mở lại đúng dòng. */
  const [moChu, datMo] = useThamSoUrl('dong', '');
  const mo = moChu ? Number(moChu) : null;
  const setMo = (v: number | null) => datMo(v === null ? '' : String(v));
  /* M6 6b-1: việc dài của dòng `?dong=` là view kế trên `?panel=` (push — ‹ / Back trình duyệt về danh sách, F5 dựng lại). */
  const xem = useXem({ url: true });
  const moViec = (r: DongSoLieu) => { const v = r.viec!; xem.vao(v.loai === 'nhap-diem' || v.loai === 'van-hanh' ? v.loai : maView({ loai: v.loai, paId: v.paId }), true); };
  const [giu, setGiu] = useState<Map<number, { dong: DongSoLieu; i: number; chu: string }>>(() => new Map());
  const [busy, setBusy] = useState<number | null>(null);
  const [loiDong, setLoiDong] = useState<{ id: number; loi: string } | null>(null);
  /* HOAN-TAC-XN: `hoanTac` — Xác nhận PA bấm thẳng có đường đảo (10 s); `lan` đổi = dòng mới, đếm lại. */
  const [vuaXong, setVuaXong] = useState<{ chu: string; hoanTac?: () => Promise<void>; lan: number } | null>(null);
  const ds = useRef<HTMLDivElement>(null);
  const idPanel = `${useId()}-ds`;

  const hanCua = (r: DongSoLieu) => r.viec ? r.viec.han : r.han ?? null;
  const tre = (r: DongSoLieu) => { const h = hanCua(r); return !!h && deadlineView({ kind: r.viec?.loaiHan ?? 'viec-van-hanh', due: h, today: homNay }).tone === 'overdue'; };
  const goc = data?.rows ?? [];
  /* M6 6b-2: dòng có nhóm (ô "Case chưa chốt PA") → danh sách theo nhóm, bấm dòng mở view Case; dòng vừa xử lý GIỮ nhóm gốc (không nhảy mắt). */
  const nhomCase = goc.some((r) => r.nhom || r.buoc);
  /* GD-21 (⑬ H8, PTA Plan chốt): panel mở từ ô nào thì ĐÚNG tập Case của ô đó; dải bước chỉ lọc thêm, không bật sẵn bước nào. */
  const [locChon, datLoc] = useState<BuocCase[] | null>(null);
  const loc = locChon ?? [];
  const [moRong, datMoRong] = useState<string[]>([]);   // nhóm bước đã bấm "+ n Case"
  const xep = [...goc.filter(tre), ...goc.filter((r) => !tre(r))];   // quá hạn lên đầu, giữ thứ tự máy chủ trong từng nhóm
  const hien: (DongSoLieu & { xong?: string })[] = nhomCase
    ? xep.map((r) => { const g = giu.get(r.id); return g ? { ...r, nhom: g.dong.nhom, xong: g.chu } : r; })
    : [...xep];
  for (const [id, g] of giu) if (!xep.some((r) => r.id === id)) hien.splice(Math.min(g.i, hien.length), 0, { ...g.dong, xong: g.chu });
  const hienLoc = loc.length ? hien.filter((r) => loc.includes(buocCuaDong(r))) : hien;
  const nhom = nhomCase ? BUOC_CASE.map((b) => { const cua = hienLoc.filter((r) => buocCuaDong(r) === b); return { buoc: b, ten: NHAN_BUOC_CASE[b], dong: [...cua.filter((r) => !r.xong && tre(r)), ...cua.filter((r) => r.xong || !tre(r))] }; }).filter((g) => g.dong.length > 0) : null;
  const thuTu = nhom ? nhom.flatMap((g) => g.dong) : hien;
  /* Việc của dòng `?dong=` khi chuỗi có view. Đang làm thì giữ dòng đã mở (`giuLam`): lưu xong máy chủ trả dòng không còn việc / bỏ dòng → panel làm việc
     không tắt giữa "✓ Đã lưu". Mở lại từ URL (F5, Forward) chỉ với dòng còn việc, chưa xong. 6b-2: dòng Case có nhóm mở được cả khi chỉ xem / đã xử lý. */
  const giuLam = useRef<DongSoLieu | null>(null);
  const lam = xem.ds.length && mo !== null
    ? hien.find((r) => r.id === mo && (nhomCase || (r.viec && !r.xong))) ?? (giuLam.current?.id === mo ? giuLam.current : null) : null;
  giuLam.current = lam;
  /* Q7: "Case tiếp ›" = Case kế bạn làm được, chưa xử lý, theo thứ tự danh sách — thay view (‹ vẫn về danh sách). */
  const tiepId = nhomCase && mo !== null ? caseTiep(thuTu.map((r) => ({ id: r.id, lam: !!r.viec?.lam, xong: r.xong })), mo) : null;
  /* `dong` ghi CẢ lên mục danh sách (replace) rồi mới push view Case — ‹ / Back về danh sách còn tô + cuộn tới dòng vừa mở. */
  const moCase = (r: DongSoLieu) => { setMo(r.id); xem.vao('case', true, { dong: String(r.id) }); };
  /* Về từ việc dài: cuộn tới đúng dòng vừa làm. */
  useEffect(() => {
    if (lam || mo === null) return;
    ds.current?.querySelector(`[data-dong="${mo}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [lam, mo]);
  const soTre = xep.filter(tre).length;
  /* UI-HO-SO-GV (chủ SP 23/10): dòng có kết luận → hai tab Chưa đạt · Đạt (mặc định Chưa đạt nếu có); chỉ một loại thì không tab. */
  const soChua = hien.filter((r) => r.ketQua === 'chua').length, soDat = hien.filter((r) => r.ketQua === 'dat').length;
  const soVuot = hien.filter((r) => r.vuot).length;
  const laThi = hien.length > 0 && hien.every((r) => r.soVoi?.nhan === 'Target');
  /* Thi thật: tab thứ ba "Vượt" (Overall / kỹ năng cao hơn Target — tập con của Đạt). */
  const coTab = (soChua > 0 && soDat > 0) || (soVuot > 0 && soVuot < hien.length);
  /* PANEL-CHUNG: chưa bấm tab thì theo dữ liệu (Chưa đạt nếu có) — state khởi tạo lúc dữ liệu chưa về từng mở nhầm tab Đạt. */
  const [tabChon, setTab] = useState<'chua' | 'dat' | 'vuot' | null>(null);
  const tab = tabChon ?? (soChua > 0 ? 'chua' : 'dat');
  const hienTab = coTab ? hien.filter((r) => (tab === 'vuot' ? r.vuot : r.ketQua === tab)) : thuTu;
  /* B13 (audit-ui 08/11, thay phân trang OV-15e): 20 dòng đầu + "Xem thêm" cuối danh sách — cắt trên dữ liệu đã nạp, không gọi thêm máy chủ. */
  const xt = useXemThem(hienTab.length, `${tieuDe}|${tab}`);
  /* Dòng đang mở (về từ hồ sơ) nằm sau 20 dòng đầu → hiện tới dòng đó. */
  const viTriMo = mo === null ? -1 : hienTab.findIndex((r) => r.id === mo);
  useEffect(() => { if (viTriMo >= 0) xt.hienToi(viTriMo); }, [viTriMo]); // eslint-disable-line react-hooks/exhaustive-deps

  const daLam = (r: DongSoLieu, chu: string) => {
    const i = hien.findIndex((x) => x.id === r.id);
    setGiu((m) => new Map(m).set(r.id, { dong: r, i, chu }));
    invalidate('/metrics'); invalidate('/tong-quan'); invalidate('/my-work'); invalidate('/cases');
    reload();
  };
  const xacNhanPa = async (r: DongSoLieu) => {
    const v = r.viec!;
    setBusy(r.id); setLoiDong(null);
    try {
      /* Cùng đường "Xác nhận PA" bấm thẳng của Ngăn Case: gửi nội dung quy chế nguyên văn, người / số buổi giữ như máy gán. */
      await api.post(`/interventions/${v.paId}/xac-nhan-pa`, { description: v.pa?.description ?? '' });
      daLam(r, t('Đã xác nhận'));
      setVuaXong((x) => ({
        chu: t('Đã xác nhận PA · {ten}', { ten: r.em?.ten ?? r.title }), lan: (x?.lan ?? 0) + 1,
        /* Dòng hết "đã xử lý", việc "Xác nhận PA" của em về lại danh sách (cùng hạn). */
        hoanTac: async () => {
          await api.post(`/interventions/${v.paId}/hoan-tac-xac-nhan`);
          setGiu((m) => { const n = new Map(m); n.delete(r.id); return n; });
          invalidate('/metrics'); invalidate('/tong-quan'); invalidate('/my-work'); invalidate('/cases');
          reload();
        },
      }));
      const i = hien.findIndex((x) => x.id === r.id);
      setMo(hien.slice(i + 1).find((x) => x.viec?.lam && !x.xong)?.id ?? null);   // dòng kế của bạn tự mở
    } catch (e: any) { setLoiDong({ id: r.id, loi: e?.message ?? t('Không lưu được') }); } finally { setBusy(null); }
  };

  if (lam) {
    /* Hoàn tác ở view Case (6b-2): dòng hết "đã xử lý" — Case tiếp / chip đếm tính lại như trước khi lưu. */
    const boXong = () => {
      setGiu((m) => { const n = new Map(m); n.delete(lam.id); return n; });
      invalidate('/metrics'); invalidate('/tong-quan'); invalidate('/my-work'); invalidate('/cases');
      reload();
    };
    return (
      <XemCha.Provider value={nhomCase
        ? { ten: tieuDe, rong: 'rong', caseTiep: { xong: !!hien.find((r) => r.id === lam.id)?.xong, di: tiepId ? () => xem.thay('case', { dong: String(tiepId) }) : null, boXong } }
        : { ten: tieuDe }}>
        <Suspense fallback={<KhungPanel tieuDe={tieuDe} onDong={onDong}><div className="pt-3"><Skeleton rows={6} /></div></KhungPanel>}>
          <LamDongSoLieu dong={lam} onDong={onDong}
            onDaLam={() => { daLam(lam, t('Đã lưu')); setVuaXong((x) => ({ chu: [lam.viec && !nhomCase ? dich(lam.viec.chu) : t('Đã lưu'), lam.em?.ten ?? lam.title].join(' · '), lan: (x?.lan ?? 0) + 1 })); }} />
        </Suspense>
      </XemCha.Provider>
    );
  }

  /* 6c-2 (PTA 28/10, "một danh sách một kiểu mở" + tách nút làm việc / link xem hồ sơ): MỌI dòng có link "Hồ sơ" CÙNG một chỗ — cuối dòng 1 — là link đổi trang
     tới hồ sơ (BO-MUI-TEN 28/10: chữ thay ký hiệu mũi tên — tên em nằm trong nút mở nên không làm link được); thân dòng chỉ bấm được khi có việc mở tại chỗ; dòng chỉ đọc thì thân không bấm. Không còn dòng mà cả dòng là link. */
  const nutHoSo = (r: DongSoLieu) => (
    <Link to={r.href} aria-label={t('Mở hồ sơ {ten}', { ten: r.em?.ten ?? r.title })} title={t('Mở hồ sơ {ten}', { ten: r.em?.ten ?? r.title })}
      className="flex min-h-[44px] shrink-0 pl-2 pr-4 pt-2.5 text-[13px] font-semibold leading-6 text-[color:var(--accent)] no-underline hover:underline">
      {t('Hồ sơ')}
    </Link>
  );

  /* GD-21 (⑬ B1, PTA Plan): bảng chuẩn `Bang` — Học viên (link, lớp ở dòng phụ) · Case (lượt · kỹ năng · SOS + điểm so kỳ vọng) · Phụ trách · Hạn; dải nhóm theo bước
     (nền surface-2, chữ "Chờ mô tả · n · m quá hạn", vạch trung tính). Bấm dòng → view Case trong cùng panel. 375: thẻ. */
  const veNhom = (dong: (DongSoLieu & { xong?: string })[]) => {
    /* ⑬ B1: mỗi nhóm hiện vài dòng đầu rồi nút "+ n Case" (mở hết nhóm đó) — chọn một bước: 5 dòng, nhiều bước: 4, không chọn: 2. Dòng đang mở luôn hiện. */
    const toiDa = loc.length === 1 ? 5 : loc.length ? 4 : 2;
    const hang: HangCase[] = (nhom ?? []).map((g0) => ({ ...g0, dong: g0.dong.filter((r) => dong.includes(r)) })).filter((g) => g.dong.length > 0)
      .flatMap((g) => {
        const du = moRong.includes(g.buoc), hien = du ? g.dong : g.dong.filter((r, i) => i < toiDa || r.id === mo);
        return [{ k: `b:${g.buoc}`, ten: g.ten, conCho: g.dong.filter((r) => !r.xong).length, tre: g.dong.filter((r) => !r.xong && tre(r)).length } as HangCase,
          ...hien.map((r) => ({ k: `c:${r.id}`, r }) as HangCase),
          ...(g.dong.length > hien.length ? [{ k: `m:${g.buoc}`, them: g.dong.length - hien.length, nhom: g.buoc } as HangCase] : [])];
      });
    const thuChon = (r: DongSoLieu) => (e: React.KeyboardEvent) => { if (e.key === 'Enter' && e.target === e.currentTarget) moCase(r); };
    return (
      <Bang<HangCase> ten={t('Case theo bước')} cot={COT_CASE} hang={hang} khoa={(h) => h.k} khung={false} dangMo={(h) => 'r' in h && h.r.id === mo}
        onHang={(h) => { if ('r' in h) moCase(h.r); }}
        hangRieng={(h) => ('them' in h ? (
          <tr className="them"><td colSpan={COT_CASE.length} className="px-4 py-2"><button type="button" className="btn btn-sm min-h-[44px] sm:min-h-0" onClick={() => datMoRong((m) => [...m, h.nhom])}>+ {h.them} Case</button></td></tr>
        ) : 'r' in h ? (
          <tr data-dong={h.r.id} className={`bam ${h.r.id === mo ? 'dang-mo' : ''}`} tabIndex={0} onClick={(e) => { if (!(e.target as Element).closest('a')) moCase(h.r); }} onKeyDown={thuChon(h.r)}>
            {COT_CASE.map((c) => <OBang key={c.key} c={c}>{oCase(h.r, c.key)}</OBang>)}
          </tr>
        ) : (
          <tr className="nhom-b"><td colSpan={COT_CASE.length} className="px-4 py-2 text-[15px] font-bold text-slate-100" style={{ background: 'var(--surface-2)', boxShadow: 'inset 3px 0 0 var(--line-strong)' }}>
            {h.ten}<span className="ml-2 inline-flex items-center gap-2 align-middle"><span className={`${CHIP_VUONG} ${h.conCho ? 'text-slate-200' : 'text-ok'}`} style={{ borderColor: 'var(--line-strong)' }} title={h.conCho ? t('{n} Case còn chờ', { n: h.conCho }) : t('Đã xử lý hết')}>{h.conCho || '✓'}</span>
              {h.tre > 0 && <span className="text-[13px] font-medium text-late">{t('{n} quá hạn', { n: h.tre })}</span>}</span>
          </td></tr>
        ))}
        theRieng={(h) => ('them' in h ? (
          <button type="button" className="btn btn-sm min-h-[44px]" onClick={() => datMoRong((m) => [...m, h.nhom])}>+ {h.them} Case</button>
        ) : 'r' in h ? (
          <div className="grid gap-1" data-dong={h.r.id}>
            <div className="flex items-baseline justify-between gap-2"><span className="min-w-0 text-[15px] font-medium">{oCase(h.r, 'hv')}</span>{oCase(h.r, 'han')}</div>
            <div className="text-[13px] text-slate-400">{oCase(h.r, 'case')}</div>
            <div className="text-[13px] text-slate-300">{oCase(h.r, 'gv')}</div>
          </div>
        ) : <div className="-mx-3 -my-2.5 px-3 py-2 text-[15px] font-bold" style={{ background: 'var(--surface-2)' }}>{h.ten} · {h.conCho}{h.tre > 0 && <span className="ml-2 text-[13px] font-medium text-late">{t('{n} quá hạn', { n: h.tre })}</span>}</div>)}
        lopHang={(h) => ('r' in h ? '' : 'them' in h ? 'them' : 'nhom-b')} />
    );
  };
  const oCase = (r: DongSoLieu & { xong?: string }, k: string): ReactNode => {
    const v = r.viec ?? null;
    if (k === 'hv') return (
      <span className="flex min-w-0 flex-col">
        <Link to={r.href} className="min-w-0 truncate font-medium text-slate-100 no-underline hover:underline" title={t('Mở hồ sơ {ten}', { ten: r.em?.ten ?? r.title })}>{r.em?.ten ?? r.title}</Link>
        {r.lop && <span className="text-[13px] text-slate-400">{r.lop}</span>}
      </span>
    );
    if (k === 'case') return (
      <span className="flex min-w-0 flex-col items-start gap-0.5">
        {r.deMuc && <span className="text-[15px] font-bold leading-snug text-slate-100">{r.deMuc}</span>}
        <span className="flex min-w-0 max-w-full flex-nowrap items-center gap-x-2">
          {(r.diemCase?.luot ?? r.luot) && <span className={`${CHIP_VUONG} shrink-0`} style={{ borderColor: 'var(--line-strong)' }}>{r.diemCase?.luot ?? r.luot}</span>}
          <span className="min-w-0" title={r.title}>{r.kyNang ?? r.title}</span>
          {r.sos && r.sos.muc > 0 && <span className={`${CHIP_SOS} ${lopSos(r.sos.muc, r.sos.tam)}`}>SOS {r.sos.muc}{r.sos.tam ? ` ${t('tạm')}` : ''}</span>}
          {(r.nhom === 'choDuyetPa' || r.nhom === 'khongTheoDoi') && <span className={CHIP_VUONG} style={{ borderColor: 'var(--line-strong)' }} title={t('Đề xuất đổi PA chờ Head duyệt')}>{t('chờ Head')}</span>}
        </span>
        <span className="whitespace-nowrap text-[13px] text-slate-400">{r.xong ? <b className="font-semibold text-ok">✓ {r.xong}</b> : r.diemCase && <Doan ds={[fmtBand(r.diemCase.so), r.diemCase.kyVong != null && t('kỳ vọng {kv}', { kv: fmtBand(r.diemCase.kyVong) })]} />}</span>
        {r.moTa ? <span className="max-w-[68ch] text-[13px] leading-snug text-slate-300 [text-wrap:pretty]">{catCau(r.moTa)}</span> : <span className="text-[13px] italic text-slate-500">{t('Chưa có mô tả')}</span>}
      </span>
    );
    if (k === 'gv') return <span className="text-[13px]">{r.nguoiId != null && r.nguoiId === toi ? <b className="font-semibold">{t('Bạn')}</b> : r.nguoi ?? t('Chưa có người phụ trách')}</span>;
    return !r.xong && v?.loaiHan && v.han ? <ChipHan vien loai={v.loaiHan} han={v.han} /> : null;
  };

  /* Khối làm tại chỗ của dòng đang mở (Xác nhận PA bấm thẳng · việc khác mở panel làm việc) — dùng chung cho dòng HV và dòng cũ. */
  const veMoRong = (r: DongSoLieu & { xong?: string }) => {
    const v = r.viec ?? null;
    return (
          <div className="flex flex-col gap-3 px-4 pb-4 pt-1">
            {/* 6c-2: chỉ dòng làm được mới mở rộng (dòng chỉ đọc trả sớm ở trên). */}
            {v?.lam && (
              <CanLam trongDong>
                {v.loai === 'xac-nhan-pa' && v.pa ? (
                  <div className="flex flex-col gap-1">
                    <span className="text-[15px] font-bold text-slate-100">{dich(INTERVENTION_KIND_LABEL[v.pa.kind as keyof typeof INTERVENTION_KIND_LABEL] ?? v.pa.kind)}</span>
                    {v.pa.description && <span className="text-sm text-slate-200">{dichDu(v.pa.description)}</span>}
                    <span className="text-[13px] text-slate-400">{[v.pa.performer, v.pa.mocChu].filter(Boolean).join(' · ')}</span>
                  </div>
                ) : r.title && r.title !== r.ngCanh ? <span className="text-sm text-slate-200">{r.title}</span> : null}
                <div className="flex flex-wrap items-center gap-1.5">
                  {v.loai === 'xac-nhan-pa' && v.pa ? (
                    <>
                      <button type="button" className="btn btn-primary min-h-[44px] px-4 font-bold max-sm:w-full sm:min-h-[40px]" disabled={busy === r.id} onClick={() => void xacNhanPa(r)}>
                        {busy === r.id ? t('Đang lưu…') : t('Xác nhận PA')}
                      </button>
                      <NutChu onClick={() => moViec(r)}>{t('Sửa PA')}</NutChu>
                    </>
                  ) : (
                    <button type="button" className="btn btn-primary min-h-[44px] px-4 font-bold max-sm:w-full sm:min-h-[40px]" onClick={() => moViec(r)}>{dich(v.chu)}</button>
                  )}
                </div>
                {loiDong?.id === r.id && <p role="alert" className="m-0 text-xs font-semibold text-bad">⚠ {loiDong.loi}</p>}
              </CanLam>
            )}
          </div>
    );
  };

  /*
   * PANEL-V10 (N30, mockup `.dg`): dòng HV — hàng 1 tên (link hồ sơ HV) · lớp (chỉ khi tiêu đề chưa ghi) · lý do bên phải (chip xu hướng / chip hạn /
   * nút việc riêng / "✓ đã làm"); hàng 2 dòng điểm đúng lượt; hàng 3 ngữ cảnh (link trang của dòng) · dòng phụ (GIỮ `sub`) · tình trạng · hạn · người.
   * Tên là link nên không còn link "Hồ sơ" riêng; việc làm được là NÚT riêng (tách nút làm với link xem). Xác nhận PA giữ mở rộng tại chỗ.
   */
  const veDongHv = (r: DongSoLieu & { xong?: string }) => {
    const v = r.viec ?? null;
    const moRong = mo === r.id && !r.xong;
    const ten = r.em?.ten ?? r.title;
    const lop = r.lop ?? (r.em ? null : r.sub.split(' · ')[0] || null);
    const tuan = r.diemHv?.tuan ? tuanLich(r.diemHv.tuan) : null;
    const ngCanh = r.ngayThiThat ? t('Thi thật {ngay}', { ngay: r.ngayThiThat }) : r.ngCanh ?? (r.em && r.title !== ten ? r.title : null);
    /* Đoạn của `sub` đã hiện chỗ khác (tên, lớp, lượt · tuần của dòng điểm, chữ xu hướng của chip) không lặp ở hàng 3. */
    const daCo = new Set([ten, lop, ngCanh, r.title, r.diemHv?.luot, tuan,
      ...(r.xuHuong ? [t('Tăng'), t('Giữ nguyên'), t('Giảm'), t('Cải thiện'), t('Chưa cải thiện')] : [])]);
    const chipHan = !r.xong && v?.loaiHan && v.han ? <ChipHan loai={v.loaiHan} han={v.han} /> : null;
    const han = !chipHan && !r.xong ? hanCua(r) : null;
    const xh = r.xuHuong ? chuXuHuong(r.xuHuong) : null;
    const phu: ReactNode[] = [
      ngCanh && (r.em ? <Link to={r.href} className="text-[color:var(--accent)] no-underline hover:underline">{ngCanh}</Link> : ngCanh),
      ...r.sub.split(' · ').filter((x) => x && !daCo.has(x)).map((x) => toKetLuan(x, r.vuot)),
      v && !v.lam && dich(v.chu), r.tinhTrang && dich(r.tinhTrang),
      han && <HanDong han={han} loai={r.viec?.loaiHan} />,
      r.nguoi && r.nguoiId !== toi && r.nguoi,
      r.chuaPhanCong && !r.xong && t('chưa phân công'),
    ];
    /* PANEL-RIENG (XM-2): QL / Quản trị gán người chấm ở phần Phân công của hồ sơ lớp (đổi trang — "›"; trang đó kiểm quyền lần nữa). */
    const phanCong = r.chuaPhanCong && !r.xong && laQl && r.viec?.classId
      ? <Link to={`/hoc-vien/lop/${r.viec.classId}?viec=phan-cong`} className="btn btn-sm min-h-[32px] no-underline max-sm:min-h-[44px]">{t('Phân công')} ›</Link> : null;
    return (
      <li key={r.id} data-dong={r.id} className="border-t px-4 pb-[11px] pt-2.5 first:border-t-0" style={{ borderColor: 'var(--line)', ...(r.xong ? { background: 'rgb(var(--ok-bg-rgb))' } : moRong ? { background: 'var(--accent-soft)' } : {}) }}>
        <div className="flex min-h-6 flex-wrap items-center gap-x-2 gap-y-1.5">
          {xh && <span className={`xh ${xh.lop}`}>{xh.chu}</span>}
          <Link to={r.em ? duongHoSoHocVien(r.em.id) : r.href} className="text-[15px] font-semibold text-slate-100 no-underline hover:text-[color:var(--accent)] hover:underline max-sm:-my-[11px] max-sm:py-[11px]">{ten}</Link>
          {hienLop(tieuDe, lop) && <span className="whitespace-nowrap text-[13px] text-slate-400">{lop}</span>}
          {r.sos && r.sos.muc > 0 && <span className={`${CHIP_SOS} ${lopSos(r.sos.muc, r.sos.tam)}`}>SOS {r.sos.muc}{r.sos.tam ? ` ${t('tạm')}` : ''}</span>}
          <span className="ml-auto inline-flex items-center gap-2">
            {r.xuHuong?.truoc && r.xuHuong.sau && <span className="doi">{r.xuHuong.truoc.luot} <b>{fmtBand(r.xuHuong.truoc.v)}</b> → {r.xuHuong.sau.luot} <b>{fmtBand(r.xuHuong.sau.v)}</b></span>}
            {chipHan}
            {phanCong}
            {r.xong ? <span className="text-[13px] font-bold text-ok">✓ {r.xong}</span>
              : v?.lam && (
                <button type="button" className="btn btn-sm min-h-[32px] max-sm:min-h-[44px]" aria-expanded={v.loai === 'xac-nhan-pa' && v.pa ? moRong : undefined}
                  onClick={() => (v.loai === 'xac-nhan-pa' && v.pa ? setMo(moRong ? null : r.id) : moViec(r))}>{dich(v.chu)}</button>
              )}
          </span>
        </div>
        {r.diemHv ? <DongDiem d={r.diemHv} knNhan={knNhan} />
          : r.diemCase && <div className="mt-1 text-[13px] leading-snug text-slate-400"><Doan ds={doanDiem(r.diemCase)} /></div>}
        {phu.some(Boolean) && <div className="mt-1 text-[13px] leading-snug text-slate-400"><Doan ds={phu} /></div>}
        {moRong && <div className="-mx-4">{veMoRong(r)}</div>}
      </li>
    );
  };

  const veDong = (r: DongSoLieu & { xong?: string }) => {
    /* Dòng có em / có điểm HV → mẫu dòng HV (PANEL-V10); dòng khác (lớp, vận hành, bài không em) giữ dáng cũ + link "Hồ sơ". */
    if (r.em || r.diemHv !== undefined) return veDongHv(r);
    const v = r.viec ?? null;
    const moRong = mo === r.id && !r.xong;
    /* UI-HO-SO-GV: dòng chỉ có `lop` (không ngữ cảnh) trước đây mất cả câu `sub` — nay chỉ dùng đầu dòng v3 khi có ngữ cảnh. */
    const dong2 = r.ngCanh
      ? [r.lop, r.ngayThiThat ? t('Thi thật {ngay}', { ngay: r.ngayThiThat }) : r.ngCanh, r.nguoi && r.nguoiId !== toi && !v?.lam ? r.nguoi : null]
      : [r.sub];
    const dong2Chu = dong2.some(Boolean) && (
      <span className="text-[13px] leading-snug text-slate-400">
        {dong2.filter(Boolean).map((x, i) => <span key={i}>{i > 0 && <span aria-hidden className="mx-1.5 text-slate-500">·</span>}{x}</span>)}
      </span>
    );
    /* 6c-2 (bảng kê mục 1 [RỖNG], mockup M6 khu K ②): dòng người xem KHÔNG làm được thì không mở rộng (trước: mở ra chỉ lặp chữ + "Mở trang") —
       thân dòng chỉ đọc (không bấm), dòng tự đủ việc · tình trạng · người · hạn; hồ sơ qua link "Hồ sơ" cuối dòng như mọi dòng.
       Dòng có việc làm được giữ mở rộng (Xác nhận PA tại chỗ / mở việc). */
    if (!v?.lam && !r.xong) {
      const chipHan = v?.loaiHan && v.han ? <ChipHan loai={v.loaiHan} han={v.han} /> : null;
      const hanRieng = !chipHan && hanCua(r);
      const conNguoi = !!r.nguoi && r.nguoiId !== toi && !r.ngCanh;   // dòng chỉ `sub`: `dong2` chưa có người phụ trách
      return (
        <li key={r.id} data-dong={r.id} className="flex border-t first:border-t-0" style={{ borderColor: 'var(--line)' }}>
          <div className="flex min-w-0 flex-1 flex-col gap-0.5 py-2.5 pl-4 pr-1">
          <span className="flex w-full items-center gap-2.5">
            <span className="min-w-0 flex-1 text-[15px] font-medium leading-snug text-slate-100">
              {r.title}
            </span>
            {chipHan}
          </span>
          {r.diemCase && <span className="text-[13px] leading-snug text-slate-400"><Doan ds={doanDiem(r.diemCase)} /></span>}
          {r.ngCanh
            ? <span className="text-[13px] leading-snug text-slate-400"><Doan ds={dong2.filter((x) => x !== r.title)} /></span>
            : r.sub && <span className="text-[13px] leading-snug text-slate-400"><Doan ds={r.sub.split(' · ').map((x) => toKetLuan(x, r.vuot))} /></span>}
          {(v || r.tinhTrang || conNguoi || hanRieng) && (
            <span className="text-[13px] leading-snug text-slate-300">
              <Doan ds={[v && dich(v.chu), r.tinhTrang && dich(r.tinhTrang), conNguoi && r.nguoi, hanRieng && <HanDong han={hanRieng} loai={r.viec?.loaiHan} />]} />
            </span>
          )}
          </div>
          {nutHoSo(r)}
        </li>
      );
    }
    const nen = moRong ? { background: 'var(--accent-soft)' } : undefined;
    return (
      <li key={r.id} data-dong={r.id} className="border-t first:border-t-0" style={{ borderColor: 'var(--line)', ...nen }}>
        <div className="flex">
        <button type="button" aria-expanded={r.xong ? undefined : moRong} disabled={!!r.xong} onClick={() => setMo(moRong ? null : r.id)}
          className="flex min-h-[44px] min-w-0 flex-1 appearance-none flex-col gap-0.5 border-0 bg-transparent py-2.5 pl-4 pr-1 text-left hover:bg-[color:var(--accent-soft)] disabled:cursor-default disabled:hover:bg-transparent">
          <span className="flex w-full items-center gap-2.5">
            <span className={`min-w-0 flex-1 text-sm font-bold ${r.xong ? 'text-slate-300' : 'text-slate-100'}`}>{v ? dich(v.chu) : r.title}</span>
            {r.xong ? <span className="text-[13px] font-bold text-ok">✓ {r.xong}</span>
              : v?.loaiHan && v.han ? <ChipHan loai={v.loaiHan} han={v.han} /> : null}
          </span>
          {dong2Chu}
        </button>
        {nutHoSo(r)}
        </div>
        {moRong && veMoRong(r)}
      </li>
    );
  };

  return (
    <KhungPanel tieuDe={tieuDe} onDong={onDong} rong={nhomCase ? 'bang' : goc.some((r) => r.diemHv || r.xuHuong) ? 'rong' : 'hep'}
      /* NEN-PANEL: không dòng nào làm được ở đây = panel báo cáo (07 mục 3). */
      loai={nhomCase ? t('Số liệu · Tổng quan') : hien.some((r) => r.viec?.lam) ? t('Việc') : t('Báo cáo · chỉ đọc')}
      dau={{
        han: soTre ? <ChipSoQuaHan n={soTre} /> : null,
        /* PANEL-RIENG (XM-1, mockup v10 `.pn-tieu`): số + đơn vị ngay sau tên số liệu ("SOS 2 · MB FT 101 4 HV"), "Cách tính" là ⓘ cuối dòng tiêu đề. */
        tieu: (
          <>
            <span className="min-w-0">{tieuDe}{nhomCase && data ? <> · <span className="tabular-nums">{data.n}</span></> : null}</span>
            {cachTinh ? <NutLuat label={t('Cách tính')}>{cachTinh}</NutLuat> : nhomCase ? <NutLuat label={t('Cách tính')}>{t('Case theo bước xử lý — số = số Case ở bước đó. Chưa có PA = Chờ mô tả + Chờ chọn PA. Bấm bước để lọc, bấm lại để bỏ.')}</NutLuat> : null}
          </>
        ),
        /* 6b-2: dòng vừa xử lý giữ chỗ nhưng không còn trong tập — đầu panel nói rõ để số khớp số dòng ("6 Case · 1 vừa xử lý"). */
        /* B13: dòng đếm đầu danh sách ("26 Case · quá hạn lên đầu"). */
        dong2: nhomCase ? [/[?&]ct=thuong\b/.test(nguon ?? '') ? t('Lớp thường') : /[?&]ct=ft\b/.test(nguon ?? '') ? 'Fast Track' : null, t('hiện tại'),
          data && hien.length > data.n ? t('{n} vừa xử lý', { n: hien.length - data.n }) : null]
          : [data ? <span key="dem" className="tabular-nums">{data.n} {dv ?? t('mục')}</span> : null, soTre ? t('quá hạn lên đầu') : null],
      }}
      chan={vuaXong && !nhomCase ? { v3: true, dongTren: <span className="flex flex-wrap items-center gap-x-3"><span className="font-semibold text-ok">✓ {vuaXong.chu}</span><NutHoanTac key={vuaXong.lan} hoanTac={vuaXong.hoanTac} onHoanTac={() => setVuaXong(null)} /></span> } : undefined}>
      {error ? <div className="pt-3"><ErrorState message={error.message} hint={error.hint} status={error.status} onRetry={reload} /></div>
        : loading || !data ? <div className="pt-3"><Skeleton rows={5} /></div>
        : !hien.length ? <Empty title={trong ?? t('Không có mục nào')} />
        : (
          <>
            {nhomCase && <DaiBuoc hien={hien} loc={loc} soLoc={hienLoc.length} datLoc={datLoc} />}
            {coTab && (
              /* Thi thật (mốc so = Target): Fail · Pass · Exceed; Test: Chưa đạt · Đạt (chủ SP 23/10 — thi thật khác phạm trù Test). PANEL-V10: tab không ▲ ▼ (▲ ▼ chỉ cho tiến độ). */
              <HangTab<'chua' | 'dat' | 'vuot'> ariaLabel={t('Kết quả')} panelId={idPanel} value={tab} onChange={setTab} className="mb-1"
                tabs={[{ key: 'chua', label: t('Chưa đạt'), so: soChua }, { key: 'dat', label: laThi ? t('Đạt Target') : t('Đạt'), so: soDat },
                  ...(soVuot ? [{ key: 'vuot' as const, label: `★ ${t('Vượt')}`, so: soVuot }] : [])]} />
            )}
            <div ref={ds} id={coTab ? idPanel : undefined} role={coTab ? 'tabpanel' : undefined} aria-label={coTab ? t('Kết quả') : undefined}>{nhomCase ? veNhom(hienTab) : <ul className="-mx-4 m-0 list-none p-0">{xt.cat(hienTab).map(veDong)}</ul>}</div>
            {!nhomCase && <XemThem {...xt} donVi={dv ?? t('mục')} />}
          </>
        )}
    </KhungPanel>
  );
}

/** Panel "{tên}" · "{n} {đơn vị}": đúng tập ID sinh ra con số (cùng hàm, cùng quyền, cùng bộ lọc) — OV-12e: dòng mở rộng tại chỗ (`NganDanhSach`). */
export function DanhSachSoLieu({ id, giaTri, phamVi, extra, open, onClose, ten }: {
  id: string; giaTri: number; phamVi?: PhamViSoLieu; extra?: Record<string, string>; open: boolean; onClose: () => void;
  /** OV-11f (TQ-11): tên ở ô / dòng vừa bấm — panel nói đúng chữ người dùng vừa đọc (một khái niệm một tên). Không có → tên trong sổ. */
  ten?: string;
}) {
  const cs = metricById(id);
  const qs = qsSoLieu(phamVi, extra);
  const { data, loading, error, reload } = useApi<Drill>(open && cs ? `/metrics/${id}?${qs}` : null, [id, open, qs]);
  if (!cs || !open) return null;
  const dv = METRIC_UNIT_LABEL[cs.donVi];
  return (
    <NganDanhSach tieuDe={ten ?? cs.ten} dv={dv} onDong={onClose} cachTinh={<CachTinh cs={cs} />} knNhan={extra?.skill ? tenMonNgan(null, extra.skill) : null}
      data={data ? { n: data.n, rows: data.rows ?? [] } : null} loading={loading} error={error} reload={reload}
      trong={data?.empty ? t('Không có dữ liệu trong phạm vi') : t('Không có {dv} nào trong tập này', { dv })} />
  );
}

