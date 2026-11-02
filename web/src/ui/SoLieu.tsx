import { Fragment, Suspense, useEffect, useId, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { INTERVENTION_KIND_LABEL, METRIC_UNIT_LABEL, caseTiep, chuDiem, dauDiem, deadlineView, duongHoSoHocVien, maView, metricById, nhanDocDiem, nhanQuaHan, tenMonNgan, thamSoCt, tuanLich, xepNhomCase, type ChiSo, type ChuongTrinh, type DeadlineKind, type DiemHv, type NhomCaseChuaChot } from '@shared/domain/index.ts';
import { useApi } from '../lib/useApi.ts';
import { XemCha, useThamSoUrl, useXem } from '../lib/quayLai.ts';
import { api, invalidate, type ApiError } from '../lib/api.ts';
import { useSession } from '../lib/session.tsx';
import { KhungPanel } from './KhungPanel.tsx';
import { phimHangTab } from './HangTab.tsx';
import { CanLam, DiemKq, NutChu, NutHoanTac } from './KhuonViec.tsx';
import { CHIP_VUONG, ChipHan, ChipSoQuaHan } from './Nhan.tsx';
import { PhanTrang, usePhanTrang } from './PhanTrang.tsx';
import { Empty, ErrorState, OChiSo, Skeleton } from './ui.tsx';
import { useNgayNghiepVu } from './ngayNghiepVu.ts';
import { NutLuat } from './NutLuat.tsx';
import { dich, t } from '@shared/i18n/index.ts';
import { lazyTai } from '../lib/taiLaiManh.ts';

/**
 * KHUNG-LOI (B-02): vùng bấm của số ≥ 24 × 24 px máy tính, 44 × 44 px điện thoại — `after:` canh giữa chữ số (hình chữ không đổi; trước đây
 * chỉ đúng chữ số, 8 × 12 px). Mẫu chip của `MenuDong`.
 */
/** NEN-V5 — dáng số bấm được (`OSo`, ô chỉ số): màu nhấn, đậm, gạch chân liền 1 px; rê chuột nền nhấn nhạt. */
export const LOP_OSO = 'appearance-none rounded border-0 bg-transparent p-0 cursor-pointer tabular-nums font-bold text-[color:var(--accent)] underline decoration-1 underline-offset-[3px] hover:bg-[color:var(--accent-soft)]';
/** Màu chữ của nơi gọi: màu nghĩa (quá hạn, chưa đạt) giữ; màu chữ thường (`text-slate-*`, dáng cũ) bỏ để số bấm được cùng một màu nhấn. */
export const mauOSo = (lop: string) => (/\btext-(bad|late|soon)\b/.test(lop) ? `${LOP_OSO.replace('text-[color:var(--accent)] ', '')} ${lop}` : `${LOP_OSO} ${lop.replace(/\btext-slate-\d+\b/g, '')}`);
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
  viec?: ViecDongSoLieu | null; tinhTrang?: string | null;
  /** PANEL-RIENG (XM-2): bài không có người chấm (môn chưa phân công) — "chưa phân công" + "Phân công ›" (QL). */
  chuaPhanCong?: true;
  /** M6 6b-2 (Q3): dòng "Case chưa chốt PA" — nhóm phân rã máy chủ; có nhóm thì panel vẽ dải nhóm và dòng mở view Case trong cùng panel. */
  nhom?: NhomCaseChuaChot | null;
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
  const mau = (dat: boolean | null) => (dat === null ? '' : dat ? 'text-kq-bang' : kck ? '' : 'text-kq-duoi');
  const ovDat = d.overall != null && d.soVoi ? d.overall >= d.soVoi.v : null;
  return (
    <span className={`dd mt-1${pt ? ' pt' : ''}`} style={{ ...(d.kn.length !== 4 ? { '--so-kn': d.kn.length } : {}), ...(rongLuot ? { '--rong-lu': `${rongLuot}px` } : {}) } as CSSProperties}>
      <span className="lu">
        <span>{[d.luot, d.tuan && tuanLich(d.tuan)].filter(Boolean).join(' · ')}</span>
        {d.tam && <span className="tam-chu" title={t('Lượt chưa chốt điểm')}>{t('tạm')}</span>}
      </span>
      {d.kn.map((k) => (
        <span key={k.k} role="img" aria-label={nhanDocDiem(k, d.soVoi)} title={k.dat === false ? nhanDocDiem(k, d.soVoi) : undefined}
          className={`k${k.v === null ? ' thieu' : k.dat === false && !kck ? ' h' : ''}${k.cua ? ' cua' : knNhan === k.k ? ' nhan' : ''}`}>
          <i aria-hidden>{k.k}</i><b aria-hidden className={mau(k.dat)}>{k.v === null ? '—' : `${dauDiem(k.dat) ? `${dauDiem(k.dat)} ` : ''}${so(k.v)}`}</b>
        </span>
      ))}
      <span className="ov">
        {pt ? t('Tổng') : 'Overall'}
        {d.overall == null ? <b className="font-medium text-faint">—</b> : <b className={mau(ovDat)}>{ovDat === null ? '' : ovDat ? '✓ ' : '✗ '}{so(d.overall)}</b>}
        {d.soVoi && <span>/ {pt ? t('ngưỡng') : d.soVoi.nhan} {so(d.soVoi.v)}</span>}
      </span>
    </span>
  );
}

/** PANEL-V10: chữ chip xu hướng — ▲ ▼ CHỈ cho tiến độ (so lượt trước), ký hiệu đi trước chữ: "▲ Tăng 1.0" · "▼ Giảm 0.5" · "= Không đổi" · "Cải thiện". */
export function chuXuHuong(x: NonNullable<DongSoLieu['xuHuong']>): { lop: string; chu: string } {
  const lech = x.truoc && x.sau ? Math.abs(x.sau.v - x.truoc.v).toFixed(1) : null;
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

/** Hạn trong câu tình trạng của dòng: quá hạn "⚠ quá hạn n ngày" · còn ≤ 3 ngày vàng · xa hơn thường — ngưỡng từ `deadlineView` (một chỗ). */
function HanDong({ han, loai }: { han: string; loai?: DeadlineKind | null }) {
  const { homNay, ngan } = useNgayNghiepVu();
  const v = deadlineView({ kind: loai ?? 'viec-van-hanh', due: han, today: homNay });
  return v.tone === 'overdue' ? <span className="font-semibold tabular-nums text-late">⚠ {nhanQuaHan(v.daysOverdue)}</span>
    : <span className={`tabular-nums ${v.ganHan ? 'font-semibold text-soon' : ''}`}>{t('hạn {ngay}', { ngay: ngan(han) })}</span>;
}

/** 6c-2 (critique 375): các đoạn ngăn "·", mỗi đoạn không ngắt giữa — xuống dòng chỉ ở giữa hai đoạn (không tách "MB / FT 101", "Chưa / đạt"). */
function Doan({ ds }: { ds: ReactNode[] }) {
  /* `<wbr />` sau "·": chỗ ngắt dòng duy nhất (đoạn nowrap sát nhau không tự ngắt) — "·" ở cuối dòng trên, không mồ côi đầu dòng. */
  return <>{ds.filter((x) => x || x === 0).map((x, i) => (
    <Fragment key={i}>{i > 0 && <><span aria-hidden className="mx-1.5 text-slate-500">·</span><span className="sr-only">, </span><wbr /></>}<span className="whitespace-nowrap">{x}</span></Fragment>
  ))}</>;
}
/** 6c-2 (critique vòng 3): MỘT cách ghi "điểm so kỳ vọng" cho mọi dòng panel số — "[nhãn] ✗ 5.5 · kỳ vọng 6.5 · thiếu 1.0" (✓ / ✗ + màu `DiemKq`). */
const doanDiem = (d: NonNullable<DongSoLieu['diemCase']>): ReactNode[] => [
  <>{d.nhan && <>{d.nhan} </>}<DiemKq diem={d.so} kyVong={d.kyVong} /></>,
  d.kyVong != null && t('kỳ vọng {kv}', { kv: d.kyVong.toFixed(1) }),
  d.kyVong != null && d.so < d.kyVong && t('thiếu {n}', { n: (d.kyVong - d.so).toFixed(1) }),
];

/** M6 6b-2 (luật chữ đầu mục): vạch 3 px của dải nhóm theo BƯỚC — token sẵn có, màu luôn đi kèm tên nhóm (G14 sửa, chủ SP 27/10). */
const VACH_NHOM: Record<NhomCaseChuaChot, string> = {
  trongPa: 'rgb(var(--bad-rgb))', choNhanXet: 'rgb(var(--soon-rgb))', choXacNhanPa: 'rgb(var(--doing-rgb))', choDuyetPa: 'var(--hong)',
  paXong: 'rgb(var(--ok-rgb))', khongTheoDoi: 'rgb(var(--text-faint-rgb))',
};

/* Việc dài của dòng (Ngăn Case, Nhập điểm, Vận hành) chỉ tải khi bấm — trang có ô số không kéo cả cây panel làm việc vào lần tải đầu. */
const LamDongSoLieu = lazyTai(() => import('../modules/worklist/LamDongSoLieu.tsx').then((m) => ({ default: m.LamDongSoLieu })));


/**
 * PANEL DANH SÁCH CỦA MỘT CON SỐ — hệ panel v3 (OV-12e, P12, mockup v3 §10). Đầu: tên số liệu + "⚠ n quá hạn" / "n Case · quá hạn lên đầu".
 * Mỗi dòng = đầu thu gọn (việc + chip hạn / em · lớp · ngữ cảnh · người làm nếu không phải bạn). Bấm dòng → MỞ RỘNG TẠI CHỖ: người làm được thấy
 * khối Cần làm (Xác nhận PA làm ngay trong dòng; việc dài → THAY nội dung panel bằng panel làm việc sẵn có, "← Danh sách" về đúng dòng);
 * người khác thấy câu tình trạng. Link "Hồ sơ" cuối dòng tách khỏi nút làm. Số ở đầu = số dòng (cùng tập máy chủ trả; dòng vừa xong mà máy chủ không còn
 * trả vẫn giữ chỗ cũ với "✓", không đếm). "Cách tính" ở cuối danh sách.
 */
export function NganDanhSach({ tieuDe, dv, data, loading, error, reload, onDong, cachTinh, trong, knNhan }: {
  tieuDe: string; dv?: string | null;
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
  const nhomCase = goc.some((r) => r.nhom);
  const xep = [...goc.filter(tre), ...goc.filter((r) => !tre(r))];   // quá hạn lên đầu, giữ thứ tự máy chủ trong từng nhóm
  const hien: (DongSoLieu & { xong?: string })[] = nhomCase
    ? xep.map((r) => { const g = giu.get(r.id); return g ? { ...r, nhom: g.dong.nhom, xong: g.chu } : r; })
    : [...xep];
  for (const [id, g] of giu) if (!xep.some((r) => r.id === id)) hien.splice(Math.min(g.i, hien.length), 0, { ...g.dong, xong: g.chu });
  const nhom = nhomCase ? xepNhomCase(hien, (r) => !r.xong && tre(r)) : null;
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
  /* OV-15e: panel số liệu phân trang 10 / 20 / 50 (thanh đầu + cuối); dòng đang mở (`?dong=`) ở trang sau vẫn mở được khi lật tới. */
  const pt = usePhanTrang(hienTab.length, tieuDe, dv ?? t('mục'));
  /* Dòng đang mở (về từ hồ sơ) nằm ở trang sau → lật tới trang đó. */
  const viTriMo = mo === null ? -1 : hienTab.findIndex((r) => r.id === mo);
  useEffect(() => {
    if (viTriMo >= 0 && (viTriMo < pt.thanh.dau || viTriMo >= pt.thanh.cuoi)) pt.thanh.onTrang(Math.floor(viTriMo / pt.thanh.co) + 1);
  }, [viTriMo]); // eslint-disable-line react-hooks/exhaustive-deps

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

  /* M6 6b-2 (mockup ① view gốc): dòng Case = một nút — em 15 / 500 · tên Case; lớp · việc tiếp 13; cột phải người giữ việc ("Bạn") + hạn. Bấm → view Case. */
  const veDongCase = (r: DongSoLieu & { xong?: string }) => {
    const v = r.viec ?? null;
    const chon = mo === r.id;
    return (
      <li key={r.id} data-dong={r.id} className="flex scroll-mt-12 border-t first:border-t-0" style={{ borderColor: 'var(--line)', ...(chon ? { background: 'var(--accent-soft)', boxShadow: 'inset 3px 0 0 var(--accent)' } : {}) }}>
        <button type="button" aria-current={chon || undefined} onClick={() => moCase(r)}
          className="flex min-h-[44px] min-w-0 flex-1 appearance-none flex-col gap-0.5 border-0 bg-transparent py-2.5 pl-4 pr-1 text-left hover:bg-[color:var(--accent-soft)]">
          <span className="flex w-full items-baseline gap-3">
            <span className={`min-w-0 flex-1 text-[15px] font-medium leading-snug ${r.xong ? 'text-slate-300' : 'text-slate-100'}`}>
              {/* 6c-2 (mockup khu K ②): dòng 1 = em · Case · lớp · lượt; dòng 2 chỉ điểm. */}
              {r.em?.ten ?? r.title}
              {/* " · ": "·" dính chữ trước (không đứng đầu dòng ở 375); lớp, lượt không ngắt giữa ("MB FT 101"); tên Case dài được xuống dòng. */}
              <span className="text-[13px] font-normal text-slate-400">{[r.em && r.title, r.lop, r.diemCase?.luot].filter(Boolean).map((x, i) => (
                <Fragment key={i}><span aria-hidden>{' · '}</span><span className="sr-only">, </span><span className={x === r.title ? undefined : 'whitespace-nowrap'}>{x}</span></Fragment>
              ))}</span>
            </span>
            {/* Người giữ việc (khu K ③): "Bạn" khi chính người xem phụ trách; không thì tên người phụ trách. */}
            <span className="shrink-0 text-right text-[13px] text-slate-300">{r.nguoiId != null && r.nguoiId === toi ? <b className="font-semibold">{t('Bạn')}</b> : r.nguoi ?? t('Chưa có người phụ trách')}</span>
          </span>
          <span className="flex w-full flex-wrap items-center gap-x-3 gap-y-1">
            <span className="min-w-0 flex-1 text-[13px] leading-snug text-slate-400">
              {/* 6c-2 (#632 XM-1, mockup khu K ②): dòng 2 = "✗ 5.5 · kỳ vọng 6.5 · thiếu 1.0" (✓ / ✗ + chữ, không chỉ màu); mỗi đoạn không ngắt giữa (375).
                  Không tên việc / tình trạng — dải nhóm đã nói bước. */}
              {r.xong ? <b className="font-semibold text-ok">✓ {r.xong}</b>
                : r.diemCase && <Doan ds={doanDiem(r.diemCase)} />}
            </span>
            {!r.xong && v?.loaiHan && v.han ? <ChipHan loai={v.loaiHan} han={v.han} /> : null}
          </span>
        </button>
        {nutHoSo(r)}
      </li>
    );
  };
  /* Dải nhóm (luật chữ đầu mục): nền surface-2, vạch 3 px theo bước, 15 / 700, chip đếm Case còn chờ (hết → ✓), dính khi cuộn. */
  const veNhom = (dong: (DongSoLieu & { xong?: string })[]) => xepNhomCase(dong, () => false).map((g) => {
    const conCho = nhom?.find((x) => x.nhom === g.nhom)?.dong.filter((r) => !r.xong).length ?? 0;
    return (
      <section key={g.nhom}>
        <h3 className="sticky top-0 z-[1] -mx-4 m-0 flex min-h-[40px] items-center gap-2 px-4 py-2 text-[15px] font-bold leading-[1.35] text-slate-100"
          style={{ background: 'var(--surface-2)', boxShadow: `inset 3px 0 0 ${VACH_NHOM[g.nhom]}` }}>
          <span className="min-w-0">{dich(g.ten)}</span>
          <span className={`${CHIP_VUONG} ${conCho ? 'text-slate-200' : 'text-ok'}`} style={{ borderColor: 'var(--line-strong)' }}
            title={conCho ? t('{n} Case còn chờ', { n: conCho }) : t('Đã xử lý hết')}>{conCho || '✓'}</span>
        </h3>
        <ul className="-mx-4 m-0 list-none p-0">{g.dong.map(veDongCase)}</ul>
      </section>
    );
  });

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
                    {v.pa.description && <span className="text-sm text-slate-200">{v.pa.description}</span>}
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
      ...r.sub.split(' · ').filter((x) => x && !daCo.has(x)),
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
          <span className="ml-auto inline-flex items-center gap-2">
            {r.xuHuong?.truoc && r.xuHuong.sau && <span className="doi">{r.xuHuong.truoc.luot} <b>{r.xuHuong.truoc.v.toFixed(1)}</b> → {r.xuHuong.sau.luot} <b>{r.xuHuong.sau.v.toFixed(1)}</b></span>}
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
            : r.sub && <span className="text-[13px] leading-snug text-slate-400"><Doan ds={r.sub.split(' · ')} /></span>}
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
    <KhungPanel tieuDe={tieuDe} onDong={onDong} rong={nhomCase || goc.some((r) => r.diemHv || r.xuHuong) ? 'rong' : 'hep'}
      /* NEN-PANEL: không dòng nào làm được ở đây = panel báo cáo (07 mục 3). */
      loai={nhomCase ? t('SỐ LIỆU · TỔNG QUAN') : hien.some((r) => r.viec?.lam) ? t('VIỆC') : t('BÁO CÁO · CHỈ ĐỌC')}
      dau={{
        han: soTre ? <ChipSoQuaHan n={soTre} /> : null,
        /* PANEL-RIENG (XM-1, mockup v10 `.pn-tieu`): số + đơn vị ngay sau tên số liệu ("SOS 2 · MB FT 101 4 HV"), "Cách tính" là ⓘ cuối dòng tiêu đề. */
        tieu: (
          <>
            <span className="min-w-0">{tieuDe}</span>
            {data && (dv || nhomCase) && <span className="whitespace-nowrap"><span className="tabular-nums">{data.n}</span> <span className="text-sm font-medium text-slate-400">{dv ?? 'Case'}</span></span>}
            {cachTinh && <NutLuat label={t('Cách tính')}>{cachTinh}</NutLuat>}
          </>
        ),
        /* 6b-2: dòng vừa xử lý giữ chỗ nhưng không còn trong tập — đầu panel nói rõ để số khớp số dòng ("6 Case · 1 vừa xử lý"). */
        dong2: [nhomCase && hien.length > data!.n ? t('{n} vừa xử lý', { n: hien.length - data!.n }) : null,
          soTre ? t('quá hạn lên đầu') : null],
      }}
      chan={vuaXong && !nhomCase ? { v3: true, dongTren: <span className="flex flex-wrap items-center gap-x-3"><span className="font-semibold text-ok">✓ {vuaXong.chu}</span><NutHoanTac key={vuaXong.lan} hoanTac={vuaXong.hoanTac} onHoanTac={() => setVuaXong(null)} /></span> } : undefined}>
      {error ? <div className="pt-3"><ErrorState message={error.message} hint={error.hint} status={error.status} onRetry={reload} /></div>
        : loading || !data ? <div className="pt-3"><Skeleton rows={5} /></div>
        : !hien.length ? <Empty title={trong ?? t('Không có mục nào')} />
        : (
          <>
            {coTab && (
              <div role="tablist" aria-label={t('Kết quả')} onKeyDown={phimHangTab} className="-mx-4 mb-1 flex border-b px-4" style={{ borderColor: 'var(--line)' }}>
                {/* Thi thật (mốc so = Target): Fail · Pass · Exceed; Test: Chưa đạt · Đạt (chủ SP 23/10 — thi thật khác phạm trù Test). PANEL-V10: tab không ▲ ▼ (▲ ▼ chỉ cho tiến độ). */}
                {([['chua', laThi ? 'Fail' : t('Chưa đạt'), soChua, ''], ['dat', laThi ? 'Pass' : t('Đạt'), soDat, ''], ...(soVuot ? [['vuot', 'Exceed', soVuot, '★ '] as const] : [])] as const).map(([k, nhan, n, dau]) => (
                  <button key={k} type="button" role="tab" aria-selected={tab === k} aria-controls={idPanel} tabIndex={tab === k ? 0 : -1} onClick={() => setTab(k)}
                    className={`-mb-px min-h-[44px] border-b-2 px-3 text-sm ${tab === k ? 'border-[color:var(--accent)] font-semibold text-slate-100' : 'border-transparent font-medium text-slate-400 hover:text-slate-200'}`}>
                    {dau}{nhan} <span className="tabular-nums">{n}</span>
                  </button>
                ))}
              </div>
            )}
            <PhanTrang {...pt.thanh} />
            <div ref={ds} id={coTab ? idPanel : undefined} role={coTab ? 'tabpanel' : undefined} aria-label={coTab ? t('Kết quả') : undefined}>{nhomCase ? veNhom(pt.cat(hienTab)) : <ul className="-mx-4 m-0 list-none p-0">{pt.cat(hienTab).map(veDong)}</ul>}</div>
            <PhanTrang {...pt.thanh} duoi />
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

