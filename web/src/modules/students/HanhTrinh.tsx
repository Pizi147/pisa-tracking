import { Fragment, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useApi } from '../../lib/useApi.ts';
import { BoLocDoan, Empty, ErrorState, NhanTrangThai, SCORE_CHIP, Skeleton, type ScoreTone } from '../../ui/ui.tsx';
import { IconCanhBao, IconDangLam, IconDat, IconGap, IconKhong, IconMotPhan } from '../../ui/BieuTuong.tsx';
import { DiemKq } from '../../ui/KhuonViec.tsx';
import { useBamNgoai } from '../../ui/useBamNgoai.ts';
import { NhanLoai } from '../cases/SkillBoard.tsx';
import { ChuongLop, type ChuongWeb } from './ChuongLop.tsx';
import {
  CASE_CATEGORY_SHORT, KHOI_PA_CO_TEN, type CaseCategory,
  boCucHanhTrinh, chuSoPa, chuoiDiem, cotCua, denKhoiPa, dongPhuVanDe, duongDotTest, giaoKhoangXem, gomGhimTheoTuan,
  khoangTruc, khoiCho, nhanGhim, nhanKhoiPa, outcomeLabelFor, rongCotTuan, soTuanCot, trucTuan, tuanLich,
  xepHangLuoi, xepTang,
  type CheDoKhoang, type DiemMoc, type DotRef, type MauKetQua, type ToneKhoiPa, type TrangThaiHop,
} from '@shared/domain/index.ts';
import { dich, t } from '@shared/i18n/index.ts';
import { ChipSos } from '../../ui/ChipSos.tsx';
import { fmtBand } from '../../lib/format.ts';

/**
 * TAB HÀNH TRÌNH (PR-Qb, spec §3.8; PR-UX5; PR-VAI-b; U07 — mockup `thiet-ke/audit-0311/u07-hanh-trinh.html`). Đầu tab: CHƯƠNG THEO LỚP (`ChuongLop`).
 * Dưới: MỘT THẺ "Hành trình · Fast Track · lớp" — đầu thẻ chọn kỹ năng + khoảng; thân là TRỤC TUẦN — MỘT LƯỚI CSS cho trục lẫn mọi hộp kỹ năng:
 *   cột nhãn 330 px (nền phụ, kẻ phải) · tuần lịch "W2 OCT" dòng chính + tuần học nhỏ dưới · Lớp · Đợt Test · mỗi kỹ năng: hàng tên + xu hướng HAI MỐC CÓ TÊN
 *   ("MT1 5.0 → MT2 4.5 · giảm 0.5") · mỗi Case một hàng (nhãn + trạng thái của chính Case ở cột trái; khung rỗng viền SOS trên trục, huỷ = xám) + tầng PA.
 *   Bấm / Enter khung Case → hộp nổi (Mở Case · Hồ sơ MT); 375 khay đáy. Chân thẻ: chú giải. 375: mặc định DANH SÁCH sự kiện theo kỹ năng, "Biểu đồ" vẫn mở được.
 * Mọi nhãn/tầng/badge/bố cục tính ở `shared/domain/hanhTrinh.ts` — file này chỉ vẽ.
 */

type GiaiDoan = { loai: 'thuong' | 'ft'; tu: string; den: string | null };
type Ghim = {
  attemptId: number; classId: number | null; tuan: string; cheDo: 'ielts' | 'ratio'; attemptNo: number; kind: string; lichSu?: boolean;
  overall: number | null; sosLevel: number | null; soDat: number | null; soYeuCau: number; soCoDiem: number; chot?: boolean;
  maLop: string | null; kyVong: number | null; kyNangChuaDat: string[];
  khongChiaMon?: boolean; tyLe?: number | null;
  goiY?: { dai: string; nhan: string; nhanNgan: string } | null;
};
type Pa = {
  id: number; ten: string; tu: string; den: string | null; status: string;
  lastOutcome: string | null; followupOverdue: boolean; soNgayQuaHan: number | null;
  supersededBy: number | null; noiTiepTu: number | null; cho?: 'duyet' | null;
};
type VanDe = {
  caseId: number; ten: string; sos: number | null; attemptNo: number | null; mo: string; dong: string | null; soPa: number; pa: Pa[];
  cho?: 'nguyen-nhan' | 'nhan-xet' | null; nguoi?: string | null;
  /** U07: Case huỷ (không cần theo dõi / hệ thống đóng) · trạng thái của chính Case · người phụ trách · tên PA chờ xác nhận. */
  huy?: boolean; trangThai?: TrangThaiHop; phuTrach?: string | null; tenPaCho?: string | null;
};
type Hop = {
  kyNang: CaseCategory; nhan: string; cheDo: 'ielts' | 'ratio';
  /** Tên ngắn theo chương trình (máy chủ, MH2): FOU G+V/P. */
  nhanNgan?: string;
  diem: DiemMoc[]; conCho: boolean; dotCho: DotRef | null;
  caseMo: { mo: string; soPa: number }[]; coTungCase: boolean;
  diemCuoiChuaDat: boolean | null; xongGanNhat: string | null; huyGanNhat?: boolean; vanDe: VanDe[];
  /** LUAT-NX-MT: S Ex đã chấm (cũ trước) — chỉ hộp Speaking, hiện cạnh điểm S, không tính. */
  sEx?: { diem: number; tuan: string }[];
};
type TuanHocTruc = Parameters<typeof soTuanCot>[0];
type HanhTrinhData = {
  giaiDoan: 'thuong' | 'ft' | null; cacGiaiDoan: GiaiDoan[]; homNay: string;
  ghim: Ghim[]; hop: Hop[];
  /** PR-VAI-b: chương theo lớp (bản 2) + hàng Lớp / Tạm dừng / Tuần học của trục (bản 1). */
  chuong: ChuongWeb[]; lapLai: { kyNang: string; lop: string[] }[];
  lop: { code: string; ngan: string; gvcn: string | null; tu: string; den: string | null; chuyen: boolean }[];
  tamDung: { tu: string; den: string | null }[];
  tuanHoc: TuanHocTruc;
};
type Truc = ReturnType<typeof trucTuan>;
type BoCuc = ReturnType<typeof boCucHanhTrinh>;
/** Hộp nổi của một Case (bấm khung trên trục): phần tử neo + nội dung. */
type HopMo = { el: HTMLElement; v: VanDe; hop: Hop };

const CHIP_TAT_CA = 'tat-ca';

/** Màu kết quả Test (N-1b) → họ chip của `SCORE_CHIP`. */
const MAU_GHIM = { dat: 'emerald', sos1: 'sos1', sos2: 'sos2', sos3: 'sos3', tam: 'tam' } as const satisfies Record<MauKetQua, ScoreTone>;
/** Xu hướng "tăng / giảm / không đổi" giữa HAI mốc (mockup `.xu`): giảm đỏ · tăng xanh · không đổi mờ. */
const LECH = { len: 'text-ok', xuong: 'text-bad', bang: 'text-faint' } as const;
/** PA = KHỐI ĐẶC: nền sẫm cùng họ, chữ màu, không viền (mockup 18 (a) luật 5; Q13). Dấu kết quả là SVG (không ký tự nhỏ). */
const KHOI: Record<ToneKhoiPa, string> = {
  ok: 'bg-ok-bg text-ok', part: 'bg-soon-bg text-soon', bad: 'bg-bad-bg text-bad',
  run: 'bg-doing-bg text-doing', late: 'bg-bad-bg text-bad', done: 'bg-done-bg text-done',
};
const DAU_KHOI: Record<ToneKhoiPa, ReactNode> = {
  ok: <IconDat size={11} />, part: <IconMotPhan size={11} />, bad: <IconKhong size={11} />, run: <IconDangLam size={11} />,
  late: <IconCanhBao size={11} />, done: <IconDat size={11} />,
};
/** Khối "chờ" (mockup `.thanh.pa.cho`): viền đứt 1.5 px mờ — chờ xác nhận PA / chờ duyệt / chờ nguyên nhân / chưa có PA. */
const KHOI_CHO = 'border-[1.5px] border-dashed border-[color:var(--text-faint)] text-dim';
/** Khung Case viền theo mức SOS; lớp thường viền trung tính (không SOS). */
const VIEN_CASE: Record<number, string> = { 1: 'rgb(var(--sos1-rgb))', 2: 'rgb(var(--sos2-rgb))', 3: 'rgb(var(--sos3-rgb))' };
const NEN_NHAN = 'var(--surface-2)';
const SOC_DUNG = 'repeating-linear-gradient(135deg, rgb(var(--soon-bg-rgb)) 0 5px, transparent 5px 10px)';
/** Ngưỡng màn hẹp: dưới đây mặc định Danh sách (U07 B1) và Xem gọn khi mở Biểu đồ (không lưu). */
const MAN_HEP = '(max-width: 639px)';
/** Cột nhãn mockup `.truc` (330 px); màn hẹp / Xem gọn rơi về dạng hẹp như cũ. */
const COT_NHAN = 330;
/** Một cột tuần đủ chỗ cho "W2 OCT" (13 / 600); hẹp hơn thì ghi "W2" và giữ hàng tháng. */
const TUAN_DU_CHU = 56;

const soTangCua = (pa: Pa[]): number => (pa.length ? Math.max(...xepTang(pa.map((p) => ({ id: p.id, tu: p.tu, den: p.den, noiTiepTu: p.noiTiepTu }))).values()) + 1 : 1);
/** "MT2 · Listening không đạt" — phần giữa của tên Case SOS (`[MT2] … [SOS 3]`). */
const giuaCase = (v: VanDe) => dich(/^\[MT\d+\] (.*?)(?: \[SOS \d\])?$/.exec(v.ten)?.[1] ?? v.ten);
const tenCaseNgan = (v: VanDe) => (v.sos != null ? [v.attemptNo != null ? `MT${v.attemptNo}` : null, giuaCase(v)].filter(Boolean).join(' · ') : dich(v.ten));
/** Case cần ai đó làm (không phải đang làm / xong / huỷ) — cột trái ghi thêm người phụ trách (mockup Speaking). */
const canNguoi = (v: VanDe) => !!v.trangThai && !['dang-lam', 'xong', 'da-huy'].includes(v.trangThai.t);
/** Chữ hàng PA (mockup): một PA → "Học Tutor · đang chạy" · nhiều → "2 PA" · chưa vẽ được → "1 PA chờ xác nhận" (`chuSoPa`, một nguồn). */
function chuHangPa(v: VanDe): string {
  if (v.pa.length !== 1) return chuSoPa(v);
  const p = v.pa[0];
  const tt = v.huy ? t('đã huỷ') : p.cho ? t('chờ duyệt') : p.status === 'completed' ? t('đã kết thúc') : t('đang chạy');
  return `${dich(p.ten)} · ${tt}`;
}

function useManHep(): boolean {
  const [hep, setHep] = useState(() => typeof window !== 'undefined' && !!window.matchMedia?.(MAN_HEP).matches);
  useEffect(() => {
    const m = window.matchMedia?.(MAN_HEP);
    if (!m) return undefined;
    const doi = () => setHep(m.matches);
    m.addEventListener?.('change', doi);
    return () => m.removeEventListener?.('change', doi);
  }, []);
  return hep;
}

export function HanhTrinh({ studentId, active, onOpenCase }: {
  studentId: number; active: boolean;
  onOpenCase: (caseId: number, paId?: number) => void;
}) {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const gdParam = params.get('giai-doan');
  const gd = gdParam === 'thuong' || gdParam === 'ft' ? gdParam : null;
  const url = active ? `/students/${studentId}/hanh-trinh${gd ? `?giai-doan=${gd}` : ''}` : null;
  const { data, loading, error, reload } = useApi<HanhTrinhData>(url, [studentId, gd, active]);
  const hep = useManHep();
  const [chip, setChip] = useState<string>(CHIP_TAT_CA);
  const [cheDoKhoang, setCheDoKhoang] = useState<CheDoKhoang>('3-thang');
  /* U07 B1: 375 mặc định Danh sách; Biểu đồ mở được (khi đó Xem gọn bật sẵn như cũ). */
  const [kieuXem, setKieuXem] = useState<'ds' | 'bd'>(() => (hep ? 'ds' : 'bd'));
  const [xemGon, setXemGon] = useState(hep);
  const danhSach = hep && kieuXem === 'ds';
  /* Bề rộng khung cuộn (px) — mọi bố cục cột tính từ đây (`boCucHanhTrinh`), không đo lại từng phần tử. */
  const [khung, setKhung] = useState<HTMLDivElement | null>(null);
  const [rong, setRong] = useState(0);
  const [hopMo, setHopMo] = useState<HopMo | null>(null);
  useLayoutEffect(() => {
    if (!khung) return undefined;
    const doDac = () => setRong(khung.clientWidth);
    doDac();
    if (typeof ResizeObserver === 'undefined') return undefined;
    const ro = new ResizeObserver(doDac);
    ro.observe(khung);
    return () => ro.disconnect();
  }, [khung]);
  /* PR-VAI-b (adapt 375 px): trục hẹp hơn số tuần thì mở ở mép phải — tuần này + tuần tới, không phải tuần cũ nhất. */
  useLayoutEffect(() => {
    if (khung) khung.scrollLeft = khung.scrollWidth;
  }, [khung, data, cheDoKhoang, rong]);

  if (!active) return null;
  /* U07 C2: lỗi chỉ trong thẻ Hành trình + Thử lại. */
  if (error) {
    return (
      <section className="card min-w-0 overflow-hidden" aria-label={t('Hành trình')}>
        <h2 className="m-0 border-b px-4 py-3 text-[17px] font-bold text-slate-100" style={{ borderColor: 'var(--line)' }}>{t('Hành trình')}</h2>
        <div className="p-4"><ErrorState message={error.message} hint={error.hint} status={error.status} onRetry={reload} /></div>
      </section>
    );
  }
  if (loading || !data) return <Skeleton rows={6} />;
  if (!data.cacGiaiDoan.length) {
    return data.chuong?.length
      ? <ChuongLop chuong={data.chuong} lapLai={data.lapLai ?? []} homNay={data.homNay} onChon={() => undefined} />
      : <Empty title={t('Chưa có lớp nào để hiển thị trong hành trình')} />;
  }

  const homNay = data.homNay;
  const giaiDoanDangXem = data.giaiDoan ? data.cacGiaiDoan.find((g) => g.loai === data.giaiDoan)! : data.cacGiaiDoan[0];
  const khoang = khoangTruc(giaiDoanDangXem, homNay, cheDoKhoang);
  const truc = trucTuan(khoang.tu, khoang.den, homNay);
  const soTuan = truc.tuan.length;
  /*
   * Q16 (PR-VAI-b): bỏ nút đổi giai đoạn — bấm một CHƯƠNG thì trục chuyển tới giai đoạn chứa chương đó (giữ tham số `?giai-doan=` để liên kết
   * cũ vẫn chạy); chương nằm ngoài "3 tháng gần nhất" thì tự chuyển "Cả giai đoạn"; cuộn tới trục.
   */
  const chonChuong = (c: ChuongWeb) => {
    const loai = c.ft ? 'ft' : 'thuong';
    const next = new URLSearchParams(params);
    next.set('giai-doan', loai);
    setParams(next, { replace: true });
    const gdc = data.cacGiaiDoan.find((g) => g.loai === loai);
    if (gdc && (c.den ?? homNay) < khoangTruc(gdc, homNay, '3-thang').tu) setCheDoKhoang('ca-giai-doan');
    if (hep) setKieuXem('bd');
    document.getElementById('truc-tuan')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const hopHienThi = chip === CHIP_TAT_CA ? data.hop : data.hop.filter((h) => h.kyNang === chip);
  const cheDo = data.hop[0]?.cheDo ?? (giaiDoanDangXem.loai === 'thuong' ? 'ratio' : 'ielts');
  const boCuc = boCucHanhTrinh({ rong, soTuan, xemGon, rongChuoi: 0, cheDo, cotTen: COT_NHAN });
  const rongTuan = rongCotTuan(boCuc, rong, soTuan);
  const coThang = rongTuan < TUAN_DU_CHU;

  const lopHienThi = (data.lop ?? []).filter((l) => giaoKhoangXem(l.tu, l.den, khoang));
  const dungHienThi = (data.tamDung ?? []).filter((t) => giaoKhoangXem(t.tu, t.den, khoang));
  const vanDeCua = (h: Hop) => h.vanDe.filter((v) => giaoKhoangXem(v.mo, v.dong, khoang));
  const hang = xepHangLuoi({
    coThang, khe: false,
    coTuanHoc: false,
    coLop: lopHienThi.length > 0,
    coGhim: data.ghim.length > 0,
    hop: hopHienThi.map((h) => ({
      soTangVanDe: vanDeCua(h).map((v) => soTangCua(v.pa)),
      coDongAn: h.vanDe.length - vanDeCua(h).length > 0,
    })),
  });
  const hangTuan = coThang ? 2 : 1;
  const nhomGhim = gomGhimTheoTuan(data.ghim);
  const cotHomNay = truc.tuan.findIndex((w) => w.homNay);
  const coPaKq = hopHienThi.some((h) => h.vanDe.some((v) => v.pa.some((p) => p.lastOutcome)));
  const tenLop = lopHienThi.map((l) => l.code).join(', ');

  return (
    <div className="space-y-3">
      {/* PR-VAI-b (mockup 26 bản 2): chương theo lớp ở đầu tab — thay bảng Lịch sử lớp. */}
      <ChuongLop chuong={data.chuong ?? []} lapLai={data.lapLai ?? []} homNay={homNay} onChon={chonChuong} />

      <section id="truc-tuan" className="card min-w-0 scroll-mt-4 overflow-hidden" aria-label={t('Hành trình')}>
        {/* U07 (mockup `.the-dau`): tiêu đề 17 / 700 "Hành trình · Fast Track · lớp" + chọn kỹ năng · khoảng ở phải; 375: Danh sách / Biểu đồ. */}
        <div className="flex flex-wrap items-center gap-2.5 border-b px-4 py-3" style={{ borderColor: 'var(--line)' }}>
          <h2 className="m-0 min-w-0 text-[17px] font-bold text-slate-100">
            {hep ? t('Hành trình') : [t('Hành trình'), giaiDoanDangXem.loai === 'ft' ? 'Fast Track' : t('Lớp thường'), tenLop || null].filter(Boolean).join(' · ')}
          </h2>
          <span className="ml-auto flex max-w-full flex-wrap items-center gap-2">
            {hep && (
              <BoLocDoan ariaLabel={t('Kiểu xem')} value={kieuXem} onChange={(k) => setKieuXem(k as 'ds' | 'bd')}
                muc={[{ key: 'ds', nhan: t('Danh sách') }, { key: 'bd', nhan: t('Biểu đồ') }]} />
            )}
            {/* Pre FOU một hộp "Tổng hợp" — không cần chip lọc (PF6). */}
            {data.hop.length > 1 && !danhSach && (
              <BoLocDoan ariaLabel={t('Kỹ năng')} value={chip} onChange={setChip}
                muc={[{ key: CHIP_TAT_CA, nhan: t('Tất cả kỹ năng') }, ...data.hop.map((h) => ({ key: h.kyNang as string, nhan: dich(h.nhanNgan ?? CASE_CATEGORY_SHORT[h.kyNang]), title: dich(h.nhan) }))]} />
            )}
            {!danhSach && (
              <select className="field w-auto" aria-label={t('Khoảng đang xem')} value={cheDoKhoang}
                onChange={(e) => setCheDoKhoang(e.target.value as CheDoKhoang)}>
                <option value="3-thang">{t('3 tháng gần nhất')}</option>
                <option value="ca-giai-doan">{t('Cả giai đoạn')}</option>
              </select>
            )}
            {/* Xem gọn chỉ khi cột tuần chật (Cả giai đoạn hoặc màn hẹp) — 3 tháng ở 1440 vừa khung, không cần nút. */}
            {!danhSach && (cheDoKhoang === 'ca-giai-doan' || hep) && (
              <button type="button" role="switch" aria-checked={xemGon} onClick={() => setXemGon(!xemGon)}
                title={t('Thu hẹp cột tuần — cuộn ngang trong thẻ')}
                className={`btn btn-sm inline-flex items-center gap-1.5 ${xemGon ? 'bg-doing-bg text-doing border-doing-line' : ''}`}>
                <i aria-hidden className="relative inline-block h-3 w-[22px] rounded-full" style={{ background: xemGon ? 'rgb(var(--doing-line-rgb))' : 'var(--line-strong)' }}>
                  <span className="absolute top-[2px] h-2 w-2 rounded-full" style={{ left: xemGon ? 12 : 2, background: xemGon ? 'var(--text)' : 'var(--text-faint)' }} />
                </i>
                {t('Xem gọn')}
              </button>
            )}
          </span>
        </div>

        {danhSach ? <DanhSachSuKien hop={data.hop} homNay={homNay} onOpenCase={onOpenCase} /> : (
          <>
            {/* MỘT khung cuộn ngang, MỘT lưới — trục và mọi hộp kỹ năng là con trực tiếp của lưới này. */}
            <div ref={setKhung} className="overflow-x-auto">
              <div className="grid relative isolate"
                style={{ gridTemplateColumns: `${boCuc.cotTen}px repeat(${soTuan}, ${boCuc.cotTuan})`, gridTemplateRows: hang.mau }}>
                {/* ---- lớp nền: vạch tuần (đầu tháng đậm) · kẻ ngang giữa các nhóm · dải Tạm dừng */}
                {truc.tuan.map((w, i) => (
                  <div key={`vach-${w.thuHai}`} aria-hidden className="pointer-events-none z-[1] border-l"
                    style={{ gridRow: `1 / ${hang.hangCuoi}`, gridColumn: i + 2, borderColor: w.dauThang ? 'var(--line-strong)' : 'var(--line)', opacity: w.dauThang ? 1 : 0.7 }} />
                ))}
                {[hangTuan + 1, ...hang.hop.map((h) => h.dau)].map((r) => (
                  <div key={`ke-${r}`} aria-hidden className="pointer-events-none z-[5] border-t" style={{ gridRow: r, gridColumn: '1 / -1', height: 0, alignSelf: 'start', borderColor: 'var(--line-strong)' }} />
                ))}
                {dungHienThi.map((t, k) => {
                  const a = cotCua(t.tu, truc);
                  /* Tuần Quay lại không tính dừng (Q1): dải tới tuần TRƯỚC tuần quay lại. */
                  const b = t.den ? Math.max(a, cotCua(t.den, truc) - 1) : soTuan - 1;
                  return (
                    <div key={`dung-${k}`} aria-hidden className="pointer-events-none z-[1]"
                      style={{ gridRow: `${hangTuan + 1} / ${hang.hangCuoi}`, gridColumn: `${a + 2} / ${b + 3}`, background: SOC_DUNG }} />
                  );
                })}

                {/* ---- trục: [tháng khi cột tuần hẹp] · tuần lịch "W2 OCT" chính + tuần học nhỏ dưới (mockup `.o-tuan`; tuần này nền nhấn) */}
                {coThang && (
                  <>
                    <CotGhim hang={1} cotTen={boCuc.cotTen} nen="var(--surface)" />
                    {truc.thang.map((th) => (
                      <div key={`${th.tu}-${th.nhan}`} title={t('{thang} · {n} tuần', { thang: th.nhan, n: th.so })}
                        className="relative z-[2] mx-[5px] mb-[3px] self-end border-b pb-[3px] pt-1.5 text-center text-[12px] font-bold leading-[15px] tracking-[0.06em] text-dim whitespace-nowrap"
                        style={{ gridRow: 1, gridColumn: `${th.tu + 2} / ${th.tu + th.so + 2}`, borderColor: 'var(--line-strong)' }}>
                        {th.nhan}
                      </div>
                    ))}
                  </>
                )}
                <CotGhim hang={hangTuan} cotTen={boCuc.cotTen} nen="var(--surface)" className="items-center px-3.5 text-[13px] font-semibold text-dim">
                  {data.tuanHoc ? t('Tuần lịch · tuần học') : t('Tuần lịch')}
                </CotGhim>
                {truc.tuan.map((w, i) => {
                  const n = data.tuanHoc ? soTuanCot(data.tuanHoc, data.tamDung ?? [], w.thuHai) : null;
                  const dangDung = dungHienThi.some((d) => cotCua(d.tu, truc) <= i && (!d.den || i < cotCua(d.den, truc)));
                  const so = n != null ? String(n) : dangDung && data.tuanHoc?.loai === 'ft' ? '–' : '';
                  return (
                    <div key={w.thuHai} title={`${tuanLich(w.thuHai, homNay)}${w.homNay ? ` · ${t('tuần này')}` : i > cotHomNay && cotHomNay >= 0 ? ` · ${t('tuần tới')}` : ''}`}
                      className="z-[2] min-w-0 py-1.5 text-center tabular-nums" style={{ gridRow: hangTuan, gridColumn: i + 2, ...(w.homNay ? { background: 'var(--accent-soft)' } : {}) }}>
                      <b className={`block truncate text-[13px] font-semibold ${w.homNay ? 'text-[color:var(--accent)]' : 'text-[var(--text)]'}`}>{coThang ? w.nhan : tuanLich(w.thuHai, homNay)}</b>
                      {(so || w.homNay) && <span className="block truncate text-[12px] leading-4 text-faint">{[so, w.homNay ? t('nay') : null].filter(Boolean).join(' · ')}</span>}
                    </div>
                  );
                })}

                {/* ---- hàng Lớp: đoạn mỗi lớp "CP FT 130 · GVCN …" (mockup `.thanh` nền phụ) */}
                {hang.hangLop && (
                  <>
                    <CotGhim hang={hang.hangLop} cotTen={boCuc.cotTen} className="items-center px-3.5 text-[13px] text-[var(--text)]">{t('Lớp')}</CotGhim>
                    {lopHienThi.map((l) => {
                      const a = cotCua(l.tu, truc);
                      const b = l.den ? Math.max(a, cotCua(l.den, truc) - 1) : soTuan - 1;
                      return (
                        <div key={l.code + l.tu} title={`${l.code}${l.gvcn ? ` · ${t('GVCN')} ${l.gvcn}` : ''} · ${tuanLich(l.tu, homNay)} → ${l.den ? tuanLich(l.den, homNay) : t('nay')}`}
                          className="z-[2] mx-1 flex h-5 min-w-0 items-center self-center overflow-clip whitespace-nowrap rounded-[5px] px-2 text-[12px] font-semibold text-[var(--text)]"
                          style={{ gridRow: hang.hangLop!, gridColumn: `${a + 2} / ${b + 3}`, background: 'var(--surface-2)' }}>
                          {/* Tên lớp bám mép phải cột tên khi trục cuộn ngang (375 px mở ở tuần này) — overflow-clip để sticky theo khung cuộn ngoài. */}
                          <span className="sticky" style={{ left: boCuc.cotTen + 8 }}>
                            {[boCuc.xuongDong ? l.ngan : l.code, !boCuc.xuongDong && l.gvcn ? `${t('GVCN')} ${l.gvcn}` : null].filter(Boolean).join(' · ')}
                          </span>
                        </div>
                      );
                    })}
                  </>
                )}

                {/* ---- hàng Đợt Test: mỗi đợt một chip một dòng giữa cột tuần (mockup `.diem-mt`: đạt viền xanh · SOS nền · chưa có điểm viền đứt) */}
                {hang.hangGhim && (
                  <>
                    <CotGhim hang={hang.hangGhim} cotTen={boCuc.cotTen} className="items-center px-3.5 text-[13px] text-[var(--text)]">{t('Đợt Test')}</CotGhim>
                    {nhomGhim.map((nhom) => {
                      if (!giaoKhoangXem(nhom.tuan, nhom.tuan, khoang)) return null;
                      const cot = cotCua(nhom.tuan, truc);
                      return (
                        <div key={nhom.tuan} style={{ gridRow: hang.hangGhim!, gridColumn: cot + 2 }} className="z-[6] flex min-w-0 flex-col items-center justify-center gap-1 py-1.5">
                          {nhom.ghim.map((g) => {
                            const nh = nhanGhim({ ...g, homNay });
                            const duKien = g.soCoDiem === 0 && g.tuan > homNay;
                            const chu = [nh.hai.filter(Boolean).join(' '), g.cheDo === 'ielts' && nh.mau.startsWith('sos') && g.sosLevel ? `SOS ${g.sosLevel}` : null].filter(Boolean).join(' · ');
                            return (
                              <button key={g.attemptId} type="button" title={nh.day}
                                /* G5: ghim mở hồ sơ Mock của đợt (không cuộn) — qua `duongDotTest`, không tự ghép đường. */
                                onClick={() => navigate(duongDotTest({ id: g.attemptId, kind: g.kind, classId: g.classId }))}
                                className={`whitespace-nowrap rounded-md border px-2 py-0.5 text-[12px] font-bold leading-4 tabular-nums ${SCORE_CHIP[MAU_GHIM[nh.mau]]} ${duKien ? 'border-dashed' : ''}`}>
                                {boCuc.xuongDong ? nh.hai[0] : chu}
                              </button>
                            );
                          })}
                        </div>
                      );
                    })}
                  </>
                )}

                {/* ---- hộp kỹ năng */}
                {hopHienThi.map((h, i) => (
                  <HopKyNang key={h.kyNang} hop={h} vi={hang.hop[i]} vanDe={vanDeCua(h)} soAn={h.vanDe.length - vanDeCua(h).length}
                    truc={truc} boCuc={boCuc} rongTuan={rongTuan} homNay={homNay} hopMo={hopMo?.v.caseId ?? null}
                    onOpenCase={onOpenCase} onMoHop={(el, v) => setHopMo(hopMo?.v.caseId === v.caseId ? null : { el, v, hop: h })}
                    onXemCaGiaiDoan={() => setCheDoKhoang('ca-giai-doan')} />
                ))}
              </div>
            </div>
            <ChuGiai cheDo={cheDo} coPaKq={coPaKq} coDung={dungHienThi.length > 0} />
          </>
        )}
      </section>
      {hopMo && <HopCase mo={hopMo} homNay={homNay} hep={hep} onDong={() => setHopMo(null)} onOpenCase={onOpenCase} />}
    </div>
  );
}

/** Xu hướng HAI MỐC CÓ TÊN (U07 #1, UA-16): "MT1 5.0 → MT2 4.5 · giảm 0.5" — mốc thật (không suy hiệu quả PA); một mốc: "MT1 5.0"; mốc mở hồ sơ Mock (G5). */
function XuHuong({ hop }: { hop: Hop }) {
  const moc = chuoiDiem(hop.diem, hop.cheDo, false, { toiDa: 2 });
  if (!moc.length) return <span className="text-[14px] text-faint">{t('chưa có điểm')}</span>;
  const chuoiDu = chuoiDiem(hop.diem, hop.cheDo, hop.conCho, { toiDa: 99, dotCho: hop.dotCho }).map((m) => `${m.nhan ? `${m.nhan} ` : ''}${m.chu}`).join(' → ');
  const sau = moc[moc.length - 1];
  const diem = (m: typeof moc[number]) => {
    const chu = [m.nhan, m.chu].filter(Boolean).join(' ');
    const href = m.attemptId ? duongDotTest({ id: m.attemptId, kind: m.kind ?? null, classId: m.classId ?? null }, hop.kyNang) : null;
    return href ? <Link to={href} title={`${m.title} · ${t('mở Hồ sơ Mock Test')}`} className="text-[var(--text)] no-underline hover:underline">{chu}</Link> : <span title={m.title}>{chu}</span>;
  };
  return (
    <span className="text-[14px] font-semibold tabular-nums text-[var(--text)]" title={chuoiDu}>
      {moc.length === 2 && <>{diem(moc[0])} → </>}{diem(sau)}
      {sau.lech && <> · <span className={LECH[sau.lech.dau]}>{dich(sau.lech.chu).toLocaleLowerCase()}</span></>}
      {hop.sEx?.map((x, k) => (
        <span key={`sex-${k}`} className="ml-2 text-[12px] font-normal text-faint" title={t('S Expert {tuan} — chỉ hiện, không tính điểm', { tuan: x.tuan })}>
          {t('S Ex')} {fmtBand(x.diem)}
        </span>
      ))}
    </span>
  );
}

/**
 * Một hộp kỹ năng, là các con trực tiếp của lưới chính (không tự tạo `display: grid` cho cột tuần):
 * hàng đầu (tên 15 / 700 + xu hướng hai mốc, "Không có Case mở" khi không Case mở — ở cột nhãn) → mỗi Case một hàng khung + các tầng PA.
 */
function HopKyNang({ hop, vi, vanDe, soAn, truc, boCuc, rongTuan, homNay, hopMo, onOpenCase, onMoHop, onXemCaGiaiDoan }: {
  hop: Hop; vi: ReturnType<typeof xepHangLuoi>['hop'][number]; vanDe: VanDe[]; soAn: number;
  truc: Truc; boCuc: BoCuc; rongTuan: number; homNay: string; hopMo: number | null;
  onOpenCase: (caseId: number, paId?: number) => void; onMoHop: (el: HTMLElement, v: VanDe) => void; onXemCaGiaiDoan: () => void;
}) {
  return (
    <>
      <CotGhim hang={vi.dau} cotTen={boCuc.cotTen} className="min-w-0 flex-col justify-center gap-0.5 px-3.5 py-2">
        <span className="truncate text-[15px] font-bold text-[var(--text)]" title={dich(hop.nhan)}>
          {/* Lớp thường: "Grammar + Vocabulary" / "Pronunciation" dài → tên ngắn G+V / P ở dạng hẹp (tên đủ ở tooltip). */}
          {boCuc.xuongDong ? dich(hop.nhanNgan ?? hop.nhan) : dich(hop.nhan)}
        </span>
        <span className="truncate"><XuHuong hop={hop} /></span>
        {hop.caseMo.length === 0 && <span className="truncate text-[12px] text-faint">{t('Không có Case mở')}</span>}
      </CotGhim>

      {vanDe.map((v, j) => (
        <VanDeHang key={v.caseId} v={v} vi={vi.vanDe[j]} truc={truc} boCuc={boCuc} rongTuan={rongTuan} homNay={homNay}
          mo={hopMo === v.caseId} onOpenCase={onOpenCase} onMoHop={onMoHop} />
      ))}

      {soAn > 0 && vi.dongAn && (
        <CotGhim hang={vi.dongAn} cotTen={boCuc.cotTen}>
          <button type="button" onClick={onXemCaGiaiDoan} title={t('Chọn "Cả giai đoạn" để thấy {n} vấn đề cũ hơn', { n: soAn })}
            className="block w-full appearance-none truncate border-0 bg-transparent py-1.5 px-3.5 text-left text-[12px] text-faint hover:underline">
            {t('+{n} vấn đề cũ hơn — chọn "Cả giai đoạn"', { n: soAn })}
          </button>
        </CotGhim>
      )}
    </>
  );
}

/**
 * Ô CỘT TÊN GHIM TRÁI (mockup `.o-nhan`: nền phụ, kẻ phải đậm). `position: sticky` chỉ chạy trong vùng lưới của chính phần tử, nên ô ở cột 1 một mình không
 * thể đứng yên khi cuộn ngang — ô ngoài trải `1 / -1` (không bắt chuột) rồi phần đứng yên bên trong rộng đúng `cotTen`.
 */
function CotGhim({ hang, cotTen, nen = NEN_NHAN, className = '', children }: {
  hang: number | string; cotTen: number; nen?: string; className?: string; children?: ReactNode;
}) {
  return (
    <div className="pointer-events-none z-[4] flex" style={{ gridRow: hang, gridColumn: '1 / -1' }}>
      <div className={`pointer-events-auto sticky left-0 flex flex-none whitespace-nowrap border-r ${className}`} style={{ width: cotTen, background: nen, borderColor: 'var(--line-strong)' }}>
        {children}
      </div>
    </div>
  );
}

/** Trạng thái của một Case ở cột nhãn (U07 #3): đang làm = chip · quá hạn = chữ đỏ ⚠ · huỷ = "– Huỷ W3 SEP" xám · xong = "✓ Xong W3 SEP". */
function TrangThaiCase({ s }: { s: NonNullable<TrangThaiHop> }) {
  if (s.t === 'qua-han') return <span className="inline-flex items-center gap-1 text-[13px] font-semibold text-bad"><IconCanhBao />{dich(s.chu)}</span>;
  if (s.t === 'da-huy') return <span className="text-[13px] font-semibold text-faint">– {dich(s.chu)}</span>;
  if (s.t === 'xong') return <span className="inline-flex items-center gap-1 text-[13px] font-semibold text-ok"><IconDat size={11} />{dich(s.chu)}</span>;
  /* Mockup `.trth .dang-lam`: viên 22 px nền trung tính, chấm xanh trước chữ. */
  if (s.t === 'dang-lam') return <span className="inline-flex h-[22px] items-center gap-[5px] whitespace-nowrap rounded-full px-[9px] text-[12px] font-semibold text-dim" style={{ background: 'rgb(var(--muted-bg-rgb))' }}><i aria-hidden className="h-1.5 w-1.5 rounded-full" style={{ background: 'rgb(var(--doing-rgb))' }} />{dich(s.chu)}</span>;
  return <NhanTrangThai t={s.t} chu={dich(s.chu)} />;
}

/**
 * Một Case: hàng KHUNG (Case = khung rỗng viền theo SOS, từ tuần mở tới tuần xong; còn mở thì mép phải đứt; huỷ viền xám, không ✓) + các hàng tầng PA.
 * Cột nhãn: "Case MT2 · Listening không đạt SOS 3" (bấm = mở Case) · trạng thái + "từ W2 OCT · 1 PA"; hàng PA: "PA Học Tutor · đang chạy" / "1 PA chờ xác nhận".
 */
function VanDeHang({ v, vi, truc, boCuc, rongTuan, homNay, mo, onOpenCase, onMoHop }: {
  v: VanDe; vi: { khung: number; tu: number; so: number }; truc: Truc; boCuc: BoCuc; rongTuan: number; homNay: string; mo: boolean;
  onOpenCase: (caseId: number, paId?: number) => void; onMoHop: (el: HTMLElement, v: VanDe) => void;
}) {
  const tang = xepTang(v.pa.map((p) => ({ id: p.id, tu: p.tu, den: p.den, noiTiepTu: p.noiTiepTu })));
  const phu = [dongPhuVanDe(v, homNay), canNguoi(v) ? v.phuTrach : null].filter(Boolean).join(' · ');
  const a = cotCua(v.mo, truc);
  const b = Math.max(a, cotCua(v.dong ?? homNay, truc));
  const cho = khoiCho(v);
  const coPaCho = v.pa.some((p) => p.cho);
  const vien = v.huy ? 'var(--line-strong)' : v.sos ? VIEN_CASE[v.sos] : 'var(--line-strong)';

  return (
    <>
      <CotGhim hang={vi.khung} cotTen={boCuc.cotTen} className="min-w-0 flex-col justify-center gap-[3px] px-3.5 py-2">
        <button type="button" onClick={() => onOpenCase(v.caseId)} title={dich(v.ten)} className="group min-w-0 appearance-none border-0 bg-transparent p-0 text-left">
          <span className="flex min-w-0 items-center gap-1.5 whitespace-nowrap text-[13px] text-[var(--text)]">
            <NhanLoai loai="Case" />
            {!boCuc.xuongDong ? <span className="min-w-0 truncate group-hover:underline">{tenCaseNgan(v)}</span>
              : v.attemptNo != null && <span className="tabular-nums">MT{v.attemptNo}</span>}
            {v.sos && !v.huy ? <ChipSos muc={v.sos} tinh /> : null}
          </span>
        </button>
        {!boCuc.xuongDong && (
          <span className="flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-0.5">
            {v.trangThai && <TrangThaiCase s={v.trangThai} />}
            <span className="min-w-0 truncate text-[12px] text-faint" title={phu}>{phu}</span>
          </span>
        )}
      </CotGhim>
      {/* Case = KHUNG RỖNG trên trục: viền theo SOS (lớp thường / huỷ: trung tính), từ tuần mở tới tuần xong; còn mở → mép phải đứt. Bấm / Enter → hộp nổi. */}
      <button type="button" aria-expanded={mo} onClick={(e) => onMoHop(e.currentTarget, v)}
        title={`${dich(v.ten)} · ${t('mở {tuan}', { tuan: tuanLich(v.mo, homNay) })} · ${v.dong ? (v.huy ? t('Huỷ {tuan}', { tuan: tuanLich(v.dong, homNay) }) : t('xong {tuan}', { tuan: tuanLich(v.dong, homNay) })) : t('đang mở')}`}
        className={`z-[3] mx-0.5 flex h-5 min-w-0 appearance-none items-center justify-between gap-1.5 self-center overflow-hidden whitespace-nowrap rounded-[5px] border-[1.5px] bg-transparent px-2 text-[12px] font-semibold ${v.huy ? 'text-faint' : 'text-[var(--text)]'} ${v.dong ? '' : 'rounded-r-none'}`}
        style={{ gridRow: vi.khung, gridColumn: `${a + 2} / ${b + 3}`, borderColor: vien, borderRightStyle: v.dong ? undefined : 'dashed', ...(mo ? { boxShadow: '0 0 0 2px var(--accent)' } : {}) }}>
        {!boCuc.xuongDong && (b - a + 1) * rongTuan >= 120 && (
          <>
            <span>{t('mở {tuan}', { tuan: tuanLich(v.mo, homNay) })}</span>
            {!v.dong ? <span>{t('đang mở')}</span>
              : v.huy ? <span>{t('Huỷ {tuan}', { tuan: tuanLich(v.dong, homNay) })}</span>
              : <span className="inline-flex items-center gap-[3px] text-ok"><IconDat size={10} />{t('Xong {tuan}', { tuan: tuanLich(v.dong, homNay) })}</span>}
          </>
        )}
      </button>

      <CotGhim hang={`${vi.tu} / span ${vi.so}`} cotTen={boCuc.cotTen} className="min-w-0 items-start px-3.5 pt-1.5">
        <span className="flex min-w-0 items-center gap-1.5 text-[13px] text-[var(--text)]">
          <NhanLoai loai="PA" cho={coPaCho || (!!cho && v.pa.length === 0)} />
          <span className="truncate">{boCuc.xuongDong ? (v.pa.length ? String(v.pa.length) : chuSoPa(v)) : chuHangPa(v)}</span>
        </span>
      </CotGhim>
      {/* Case đã đóng (xong / huỷ) không còn gì để chờ — không vẽ khối chờ. */}
      {cho && v.pa.length === 0 ? (v.dong ? null : (
        <KhoiCho chu={cho} tu={v.mo} den={homNay} truc={truc} hang={vi.tu} rongTuan={rongTuan} />
      )) : v.pa.map((p) => (
        <KhoiPa key={p.id} p={p} huy={!!v.huy} hang={vi.tu + tang.get(p.id)!} truc={truc} rongTuan={rongTuan} homNay={homNay}
          onOpenCase={() => onOpenCase(v.caseId, p.id)} />
      ))}
    </>
  );
}

/** Khối CHỜ (mockup `.thanh.pa.cho`): viền đứt — "1 PA chờ xác nhận · Học Tutor" · "Chờ xác nhận Case" · "Chưa có PA". */
function KhoiCho({ chu, tu, den, truc, hang, rongTuan }: { chu: string; tu: string; den: string; truc: Truc; hang: number; rongTuan: number }) {
  const a = cotCua(tu, truc);
  const b = Math.max(a, cotCua(den, truc));
  const rongKhoi = (b - a + 1) * rongTuan;
  return (
    <div title={chu}
      className={`z-[2] mx-0.5 flex h-5 min-w-0 items-center justify-center self-center overflow-hidden rounded-[5px] text-[12px] font-semibold whitespace-nowrap ${KHOI_CHO}`}
      style={{ gridRow: hang, gridColumn: `${a + 2} / ${b + 3}` }}>
      {rongKhoi >= 96 ? chu : ''}
    </div>
  );
}

function KhoiPa({ p, huy, hang, truc, rongTuan, homNay, onOpenCase }: {
  p: Pa; /** U07 #5: PA của Case huỷ — nền phụ, chữ mờ gạch, không dấu. */ huy: boolean; hang: number; truc: Truc; rongTuan: number; homNay: string; onOpenCase: () => void;
}) {
  const a = cotCua(p.tu, truc);
  /* PA đang chạy kết thúc ở tuần hôm nay (Q4), không kéo tới cột cuối trục. */
  const b = Math.max(a, cotCua(denKhoiPa(p, homNay), truc));
  const nh = nhanKhoiPa(p, homNay);
  const hienTen = (b - a + 1) * rongTuan >= KHOI_PA_CO_TEN;
  const cho = !!p.cho && p.status !== 'completed';
  const lop = huy ? 'border-0 text-faint line-through' : cho ? KHOI_CHO : `border-0 ${KHOI[nh.tone]}`;
  return (
    <button type="button" data-pa-id={p.id} title={cho ? t('{pa} · chờ Quản lý duyệt', { pa: nh.ten }) : nh.day} onClick={onOpenCase}
      style={{ gridRow: hang, gridColumn: `${a + 2} / ${b + 3}`, ...(huy ? { background: 'var(--surface-2)' } : {}) }}
      className={`z-[2] mx-0.5 flex h-5 min-w-0 appearance-none items-center gap-1.5 self-center overflow-hidden whitespace-nowrap rounded-[5px] text-[12px] font-semibold ${lop} ${hienTen ? 'px-2' : 'justify-center px-0'}`}>
      {!cho && !huy && <span className="flex-none">{DAU_KHOI[nh.tone]}</span>}
      {hienTen && <span className="truncate">{huy ? dich(p.ten) : nh.ten}</span>}
    </button>
  );
}

/**
 * HỘP NỔI CỦA MỘT CASE (U07 #6, F07): bấm / Enter khung Case trên trục → hộp portal `fixed` dưới khung (hết chỗ thì lật lên, dịch ngang khỏi tràn mép)
 * — tên · điểm so kỳ vọng · mở / phụ trách / PA / trạng thái · "Mở Case ›" · "Hồ sơ MTn ›". < 640 px: khay đáy. Esc / bấm ngoài → đóng.
 */
function HopCase({ mo, homNay, hep, onDong, onOpenCase }: { mo: HopMo; homNay: string; hep: boolean; onDong: () => void; onOpenCase: (caseId: number, paId?: number) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const neo = useRef<HTMLElement | null>(mo.el);
  neo.current = mo.el;
  const [cho, setCho] = useState<{ top: number; left: number } | null>(null);
  useBamNgoai(true, onDong, ref, neo);
  useLayoutEffect(() => {
    if (hep) return undefined;
    const dat = () => {
      const h = ref.current;
      if (!mo.el.isConnected || !h) { onDong(); return; }
      const r = mo.el.getBoundingClientRect();
      const cao = h.offsetHeight, rongH = h.offsetWidth;
      const len = r.bottom + 6 + cao > window.innerHeight - 8 && r.top - 6 - cao >= 8;
      setCho({ top: len ? r.top - 6 - cao : r.bottom + 6, left: Math.max(8, Math.min(r.left, window.innerWidth - rongH - 8)) });
    };
    dat();
    window.addEventListener('scroll', dat, true);
    window.addEventListener('resize', dat);
    return () => { window.removeEventListener('scroll', dat, true); window.removeEventListener('resize', dat); };
  }, [mo, hep]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') { onDong(); mo.el.focus(); } };
    document.addEventListener('keydown', esc);
    return () => document.removeEventListener('keydown', esc);
  }, [mo]); // eslint-disable-line react-hooks/exhaustive-deps

  const { v, hop } = mo;
  const d = v.attemptNo != null ? hop.diem.find((x) => x.attemptNo === v.attemptNo) : undefined;
  const mt = v.attemptNo != null ? `MT${v.attemptNo}` : null;
  const tieu = [`Case ${dich(hop.nhan)}`, mt, v.sos ? `SOS ${v.sos}` : null].filter(Boolean).join(' · ');
  const phu = [t('mở {tuan}', { tuan: tuanLich(v.mo, homNay) }), v.phuTrach ? t('phụ trách {ten}', { ten: v.phuTrach }) : null, chuSoPa(v),
    v.trangThai && v.trangThai.t !== 'dang-lam' ? dich(v.trangThai.chu) : null].filter(Boolean).join(' · ');
  const hoSo = d?.attemptId ? duongDotTest({ id: d.attemptId, kind: d.kind ?? null, classId: d.classId ?? null }, hop.kyNang) : null;
  return createPortal(
    <div ref={ref} role="dialog" aria-label={tieu}
      className={hep ? 'fixed inset-x-0 bottom-0 z-50 grid gap-2 rounded-t-[14px] border-t px-4 pb-[18px] pt-3.5 text-[14px] shadow-xl'
        : 'fixed z-50 grid w-[300px] gap-1 rounded-[10px] border px-3 py-2.5 text-[14px] shadow-xl'}
      style={{ background: 'var(--surface)', borderColor: 'var(--line-strong)', ...(hep ? {} : { left: cho?.left ?? 0, top: cho?.top ?? 0, visibility: cho ? undefined : 'hidden' }) }}>
      <b className="text-[15px] text-slate-100">{tieu}</b>
      <span className="text-slate-100">{giuaCase(v)}{d && d.kyVong != null && <> · <DiemKq diem={d.gt} kyVong={d.kyVong} /> / {t('kỳ vọng {kv}', { kv: fmtBand(d.kyVong) })}</>}</span>
      <span className="text-[13px] text-dim">{phu}</span>
      <span className="mt-1 flex flex-wrap gap-3.5 border-t pt-1.5" style={{ borderColor: 'var(--line)' }}>
        <button type="button" className="link appearance-none border-0 bg-transparent p-0 text-[14px] font-semibold max-sm:min-h-[44px]" onClick={() => { onDong(); onOpenCase(v.caseId); }}>{t('Mở Case ›')}</button>
        {hoSo && mt && <Link to={hoSo} className="link text-[14px] font-semibold max-sm:inline-flex max-sm:min-h-[44px] max-sm:items-center">{t('Hồ sơ {mt} ›', { mt })}</Link>}
      </span>
    </div>,
    document.body,
  );
}

/**
 * 375 · DANH SÁCH SỰ KIỆN THEO KỸ NĂNG (U07 B1): mỗi kỹ năng một dải (tên + xu hướng hai mốc) rồi sự kiện theo tuần lịch, mới nhất trên —
 * mở Case · PA bắt đầu · Huỷ / Xong · việc đang chờ (tuần này). Bấm sự kiện = mở Case (như khung trên trục).
 */
function DanhSachSuKien({ hop, homNay, onOpenCase }: { hop: Hop[]; homNay: string; onOpenCase: (caseId: number, paId?: number) => void }) {
  return (
    <div>
      {hop.map((h) => {
        const sk: { tuan: string; key: string; caseId: number; paId?: number; noi: ReactNode }[] = [];
        for (const v of h.vanDe) {
          const ten = <>{tenCaseNgan(v)}{v.sos && !v.huy ? <> <ChipSos muc={v.sos} tinh /></> : null}</>;
          sk.push({ tuan: v.mo, key: `m${v.caseId}`, caseId: v.caseId, noi: <>{t('Mở Case')} {ten}</> });
          for (const p of v.pa) sk.push({ tuan: p.tu, key: `p${p.id}`, caseId: v.caseId, paId: p.id, noi: <>{t('PA {ten} bắt đầu', { ten: dich(p.ten) })} · <span className="text-dim">{chuHangPa({ ...v, pa: [p] }).split(' · ').at(-1)}</span></> });
          if (v.dong) {
            sk.push({ tuan: v.dong, key: `d${v.caseId}`, caseId: v.caseId, noi: v.huy
              ? <span className="font-semibold text-faint">– {t('Huỷ Case {ten}', { ten: tenCaseNgan(v) })}</span>
              : <span className="inline-flex items-center gap-1 font-semibold text-ok"><IconDat size={11} />{t('Xong Case {ten}', { ten: tenCaseNgan(v) })}</span> });
          } else if (canNguoi(v) && v.trangThai) {
            sk.push({ tuan: homNay, key: `c${v.caseId}`, caseId: v.caseId, noi: <span className="grid justify-items-start gap-0.5"><TrangThaiCase s={v.trangThai} /><span className="text-[13px] text-dim">{[chuSoPa(v), v.phuTrach].filter(Boolean).join(' · ')}</span></span> });
          }
        }
        sk.sort((x, y) => y.tuan.localeCompare(x.tuan));
        /* Mockup B1: kỹ năng chưa có sự kiện không chiếm dải (xu hướng vẫn ở ô điểm đầu hồ sơ và Biểu đồ). */
        if (sk.length === 0) return null;
        return (
          <Fragment key={h.kyNang}>
            <div className="grid gap-0.5 border-t px-3.5 py-2.5 first:border-t-0" style={{ background: 'var(--surface-2)', borderColor: 'var(--line-strong)' }}>
              <span className="text-[15px] font-bold text-[var(--text)]">{dich(h.nhan)}</span>
              <XuHuong hop={h} />
            </div>
            {sk.map((x) => (
                <button key={x.key} type="button" onClick={() => onOpenCase(x.caseId, x.paId)}
                  className="grid min-h-[44px] w-full appearance-none grid-cols-[64px_minmax(0,1fr)] items-start gap-2.5 border-0 border-t bg-transparent px-3.5 py-2 text-left text-[14px] text-[var(--text)]"
                  style={{ borderColor: 'var(--line)' }}>
                  <span className="text-[13px] font-semibold tabular-nums text-dim">{tuanLich(x.tuan, homNay)}</span>
                  <span className="min-w-0">{x.noi}</span>
                </button>
            ))}
          </Fragment>
        );
      })}
    </div>
  );
}

/**
 * CHÚ GIẢI (U07, mockup `.chu-giai` — chân thẻ): Case viền SOS (mép phải đứt = đang mở) · PA đang chạy · PA chờ xác nhận · Huỷ (xám) · Xong ·
 * tăng / giảm = so hai MT ghi ngay cạnh; thêm kết quả PA / tạm dừng chỉ khi có trên trục. < 640 px thu gọn chỉ ký hiệu, nút "Ký hiệu" mở chữ.
 */
function ChuGiai({ cheDo, coPaKq, coDung }: { cheDo: 'ielts' | 'ratio'; coPaKq: boolean; coDung: boolean }) {
  const [moChu, setMoChu] = useState(false);
  const khoi = (lop: string, dau: ReactNode) => <span className={`inline-flex h-4 w-[18px] flex-none items-center justify-center rounded ${lop}`}>{dau}</span>;
  const muc: [ReactNode, string][] = [
    [<span key="c" className="inline-block h-3 w-[22px] rounded-l-[3px] border-[1.5px] border-[color:var(--text)]" style={{ borderRightStyle: 'dashed' }} />, cheDo === 'ielts' ? t('Case (viền theo SOS; mép phải đứt = đang mở)') : t('Case (mép phải đứt = đang mở)')],
    [khoi(KHOI.run, <IconDangLam size={10} />), t('PA đang chạy')],
    [<span key="ch" className={`inline-block h-3 w-[22px] rounded-[3px] ${KHOI_CHO}`} />, t('PA chờ xác nhận')],
    ...(coPaKq ? [[<span key="kq" className="inline-flex gap-0.5">{khoi(KHOI.ok, <IconDat size={10} />)}{khoi(KHOI.part, <IconMotPhan size={10} />)}{khoi(KHOI.bad, <IconKhong size={10} />)}</span>,
      t('kết quả PA ({a} · {b} · {c})', { a: dich(outcomeLabelFor('improved')).toLowerCase(), b: dich(outcomeLabelFor('partial')).toLowerCase(), c: dich(outcomeLabelFor('unchanged')).toLowerCase() })] as [ReactNode, string]] : []),
    [<span key="h" className="font-semibold text-faint">–</span>, t('Huỷ (xám)')],
    [<span key="x" className="text-ok"><IconDat size={11} /></span>, t('Xong')],
    ...(coDung ? [[<span key="t" className="inline-block h-3 w-4 rounded-sm" style={{ background: SOC_DUNG }} />, t('tạm dừng')] as [ReactNode, string]] : []),
    [<span key="l" />, cheDo === 'ielts' ? t('tăng / giảm = so hai MT ghi ngay cạnh') : t('tăng / giảm = so hai bài ghi ngay cạnh')],
  ];
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t px-4 py-2.5 text-[13px] text-dim" style={{ borderColor: 'var(--line)' }} aria-label={t('Chú giải')}>
      <button type="button" aria-expanded={moChu} onClick={() => setMoChu(!moChu)}
        className="inline-flex min-h-[44px] items-center gap-1 border-0 bg-transparent p-0 text-[13px] font-semibold text-[color:var(--accent)] sm:hidden">
        {t('Ký hiệu')} <IconGap mo={moChu} size={10} />
      </button>
      {muc.map(([ky, chu]) => (
        <span key={chu} className="inline-flex items-center gap-[5px] whitespace-nowrap" title={chu}>
          {ky}<span className={moChu ? '' : 'hidden sm:inline'}>{chu}</span>
        </span>
      ))}
    </div>
  );
}
