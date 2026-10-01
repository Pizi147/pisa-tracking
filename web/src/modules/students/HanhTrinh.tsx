import { Fragment, useLayoutEffect, useState, type ReactNode } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useApi } from '../../lib/useApi.ts';
import { BoLocDoan, Empty, ErrorState, SCORE_CHIP, Skeleton, type ScoreTone } from '../../ui/ui.tsx';
import { Nhan, toneNhanTuBadge } from '../../ui/Nhan.tsx';
import { IconCanhBao, IconChuyenLop, IconDangLam, IconDat, IconGap, IconKhong, IconMotPhan, IconTamDung } from '../../ui/BieuTuong.tsx';
import { NhanLoai } from '../cases/SkillBoard.tsx';
import { ChuongLop, type ChuongWeb } from './ChuongLop.tsx';
import {
  CASE_CATEGORY_SHORT, chuKhoangDung,KHOI_PA_CO_TEN, RONG_TEN_KY_NANG, type CaseCategory,
  boCucHanhTrinh, chuoiDiem, cotCua, denKhoiPa, dongPhuVanDe, duongDotTest, giaoKhoangXem, gomGhimTheoTuan,
  khoangTruc, khoiCho, nhanGhim, nhanKhoiPa, outcomeLabelFor, rongCotTuan, soTuanCot, trangThaiHop, trucTuan, tuanLich,
  uocRongChuoi, xepHangLuoi, xepTang,
  type CheDoKhoang, type DiemMoc, type DotRef, type MauKetQua, type ToneKhoiPa,
} from '@shared/domain/index.ts';

/**
 * TAB HÀNH TRÌNH (PR-Qb, spec §3.8; PR-UX5; PR-VAI-b — mockup 26 bản 2 + bản 1). Đầu tab: CHƯƠNG THEO LỚP (`ChuongLop`). Dưới: TRỤC TUẦN
 * — MỘT LƯỚI CSS cho trục lẫn mọi hộp kỹ năng:
 *   tháng (tên giữa, ngoặc trải đúng số tuần) · tuần · Tuần học (FT: tuần học thứ n của em, bỏ tuần Tạm dừng) / Tuần khoá (lớp thường) ·
 *   Lớp (đoạn mỗi lớp, biểu tượng chuyển lớp) · Đợt Test (mỗi đợt gọn một cột tuần, hai dòng `MT1 / 5.5`) · dải sọc vàng Tạm dừng ·
 *   mỗi kỹ năng một hộp: Case = KHUNG RỖNG viền theo SOS từ tuần mở tới tuần xong; PA = KHỐI ĐẶC ở hàng dưới (tầng `xepTang`); khối chờ viền đứt tím.
 * Mọi nhãn/tầng/badge/bố cục tính ở `shared/domain/hanhTrinh.ts` — file này chỉ vẽ.
 */

type GiaiDoan = { loai: 'thuong' | 'ft'; tu: string; den: string | null };
type Ghim = {
  attemptId: number; classId: number | null; tuan: string; cheDo: 'ielts' | 'ratio'; attemptNo: number; kind: string; lichSu?: boolean;
  overall: number | null; sosLevel: number | null; soDat: number | null; soYeuCau: number; soCoDiem: number;
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
  cho?: 'nguyen-nhan' | 'ke-hoach' | null; nguoi?: string | null;
};
type Hop = {
  kyNang: CaseCategory; nhan: string; cheDo: 'ielts' | 'ratio';
  /** Tên ngắn theo chương trình (máy chủ, MH2): FOU G+V/P. */
  nhanNgan?: string;
  diem: DiemMoc[]; conCho: boolean; dotCho: DotRef | null;
  caseMo: { mo: string; soPa: number }[]; coTungCase: boolean;
  diemCuoiChuaDat: boolean | null; xongGanNhat: string | null; huyGanNhat?: boolean; vanDe: VanDe[];
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

const CHIP_TAT_CA = 'tat-ca';

/** Màu kết quả Test (N-1b) → họ chip của `SCORE_CHIP`. */
const MAU_GHIM = { dat: 'emerald', sos1: 'sos1', sos2: 'sos2', sos3: 'sos3', tam: 'tam' } as const satisfies Record<MauKetQua, ScoreTone>;
/** Mũi tên ▲▼= của chuỗi điểm. */
const LECH = { len: 'text-ok', xuong: 'text-bad', bang: 'text-faint' } as const;
const LECH_TITLE = { len: 'Tăng', xuong: 'Giảm', bang: 'Giữ nguyên' } as const;
/** PA = KHỐI ĐẶC: nền sẫm cùng họ, chữ màu, không viền (mockup 18 (a) luật 5; Q13). Dấu kết quả là SVG (không ký tự nhỏ). */
const KHOI: Record<ToneKhoiPa, string> = {
  ok: 'bg-ok-bg text-ok', part: 'bg-soon-bg text-soon', bad: 'bg-bad-bg text-bad',
  run: 'bg-doing-bg text-doing', late: 'bg-bad-bg text-bad', done: 'bg-done-bg text-done',
};
const DAU_KHOI: Record<ToneKhoiPa, ReactNode> = {
  ok: <IconDat size={11} />, part: <IconMotPhan size={11} />, bad: <IconKhong size={11} />, run: <IconDangLam size={11} />,
  late: <IconCanhBao size={11} />, done: <IconDat size={11} />,
};
/** Khối "chờ" (Q18): viền đứt tím — chờ duyệt / chờ nguyên nhân / chưa có PA. */
const KHOI_CHO = 'border border-dashed border-wait text-wait';
/** Khung Case viền theo mức SOS; lớp thường viền trung tính (không SOS). */
const VIEN_CASE: Record<number, string> = { 1: 'rgb(var(--sos1-rgb))', 2: 'rgb(var(--sos2-rgb))', 3: 'rgb(var(--sos3-rgb))' };
const CHIP_SOS: Record<number, string> = { 1: 'bg-sos1-bg text-sos1', 2: 'bg-sos2-bg text-sos2', 3: 'bg-sos3-bg text-sos3' };
const NEN_HOP = { background: 'var(--surface-2)' } as const;
const SOC_DUNG = 'repeating-linear-gradient(135deg, rgb(var(--soon-bg-rgb)) 0 5px, transparent 5px 10px)';
/** Ngưỡng màn hẹp: dưới đây Xem gọn tự bật lúc mở tab (không lưu). */
const MAN_HEP = '(max-width: 639px)';

const soTangCua = (pa: Pa[]): number => (pa.length ? Math.max(...xepTang(pa.map((p) => ({ id: p.id, tu: p.tu, den: p.den, noiTiepTu: p.noiTiepTu }))).values()) + 1 : 1);

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
  const [chip, setChip] = useState<string>(CHIP_TAT_CA);
  const [cheDoKhoang, setCheDoKhoang] = useState<CheDoKhoang>('3-thang');
  const [xemGon, setXemGon] = useState(() => typeof window !== 'undefined' && !!window.matchMedia?.(MAN_HEP).matches);
  /* Bề rộng khung cuộn (px) — mọi bố cục cột tính từ đây (`boCucHanhTrinh`), không đo lại từng phần tử. */
  const [khung, setKhung] = useState<HTMLDivElement | null>(null);
  const [rong, setRong] = useState(0);
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
  if (error) return <ErrorState message={error.message} hint={error.hint} onRetry={reload} />;
  if (loading || !data) return <Skeleton rows={6} />;
  if (!data.cacGiaiDoan.length) {
    return data.chuong?.length
      ? <ChuongLop chuong={data.chuong} lapLai={data.lapLai ?? []} homNay={data.homNay} onChon={() => undefined} />
      : <Empty title="Chưa có lớp nào để hiển thị trong hành trình" />;
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
    document.getElementById('truc-tuan')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const hopHienThi = chip === CHIP_TAT_CA ? data.hop : data.hop.filter((h) => h.kyNang === chip);
  const cheDo = data.hop[0]?.cheDo ?? (giaiDoanDangXem.loai === 'thuong' ? 'ratio' : 'ielts');
  /* Ước trên 5 mốc dù đang hiện 3 — cột tên không nhảy qua lại khi bật/tắt Xem gọn hay đổi chip kỹ năng. */
  const rongChuoi = Math.max(0, ...data.hop.map((h) => uocRongChuoi(chuoiDiem(h.diem, h.cheDo, h.conCho, { toiDa: 5, dotCho: h.dotCho }))));
  const boCuc = boCucHanhTrinh({ rong, soTuan, xemGon, rongChuoi, cheDo });
  const rongTuan = rongCotTuan(boCuc, rong, soTuan);

  const lopHienThi = (data.lop ?? []).filter((l) => giaoKhoangXem(l.tu, l.den, khoang));
  const dungHienThi = (data.tamDung ?? []).filter((t) => giaoKhoangXem(t.tu, t.den, khoang));
  const vanDeCua = (h: Hop) => h.vanDe.filter((v) => giaoKhoangXem(v.mo, v.dong, khoang));
  const hang = xepHangLuoi({
    coTuanHoc: !!data.tuanHoc,
    coLop: lopHienThi.length > 0,
    coGhim: data.ghim.length > 0,
    hop: hopHienThi.map((h) => ({
      soTangVanDe: vanDeCua(h).map((v) => soTangCua(v.pa)),
      coDongAn: h.vanDe.length - vanDeCua(h).length > 0,
    })),
  });
  const nhomGhim = gomGhimTheoTuan(data.ghim);
  const cotHomNay = truc.tuan.findIndex((w) => w.homNay);
  /* Các đoạn hàng liền nhau (không có khe): phần trục rồi từng khung hộp — phần trục bắt đầu ở hàng 2 (dưới hàng tháng). */
  const doanLuoi: [number, number][] = [[2, hang.hop.length ? hang.hop[0].khung[0] - 1 : hang.hangCuoi], ...hang.hop.map((h) => h.khung)];
  const hangTruocHop = hang.hangTuanHoc ?? 3;
  const tuanHocNhan = data.tuanHoc?.loai === 'khoa' ? 'Tuần khoá' : 'Tuần học';

  return (
    <div className="space-y-3">
      {/* PR-VAI-b (mockup 26 bản 2): chương theo lớp ở đầu tab — thay bảng Lịch sử lớp. */}
      <ChuongLop chuong={data.chuong ?? []} lapLai={data.lapLai ?? []} homNay={homNay} onChon={chonChuong} />

      {/* Hàng điều khiển: giai đoạn đang xem · chip kỹ năng · khoảng đang xem · Xem gọn (giai đoạn đổi bằng cách bấm chương — Q16) */}
      <div id="truc-tuan" className="flex scroll-mt-4 flex-wrap items-center gap-2 border-t pt-3" style={{ borderColor: 'var(--line)' }}>
        <span className="text-[12.5px] text-slate-400">
          Đang xem <b className="font-semibold text-slate-100">{giaiDoanDangXem.loai === 'ft' ? 'Fast Track' : 'Lớp thường'}</b>
          {' · '}{giaiDoanDangXem.den ? `${tuanLich(giaiDoanDangXem.tu, homNay)} – ${tuanLich(giaiDoanDangXem.den, homNay)}` : `từ ${tuanLich(giaiDoanDangXem.tu, homNay)}`}
          {lopHienThi.length > 0 && <span className="text-slate-400"> ({lopHienThi.map((l) => l.code).join(', ')})</span>}
        </span>
        {/* Pre FOU một hộp "Tổng hợp" — không cần chip lọc (PF6). */}
        {data.hop.length > 1 && (
        <span className="ml-auto max-w-full">
          <BoLocDoan ariaLabel="Kỹ năng" value={chip} onChange={setChip}
            muc={[{ key: CHIP_TAT_CA, nhan: 'Tất cả kỹ năng' }, ...data.hop.map((h) => ({ key: h.kyNang as string, nhan: h.nhanNgan ?? CASE_CATEGORY_SHORT[h.kyNang], title: h.nhan }))]} />
        </span>
        )}
        <select className="field w-auto" aria-label="Khoảng đang xem" value={cheDoKhoang}
          onChange={(e) => setCheDoKhoang(e.target.value as CheDoKhoang)}>
          <option value="3-thang">3 tháng gần nhất</option>
          <option value="ca-giai-doan">Cả giai đoạn</option>
        </select>
        <button type="button" role="switch" aria-checked={xemGon} onClick={() => setXemGon(!xemGon)}
          title="Thu hẹp cột tuần — cuộn ngang trong thẻ"
          className={`btn btn-sm inline-flex items-center gap-1.5 ${xemGon ? 'bg-doing-bg text-doing border-doing-line' : ''}`}>
          <i aria-hidden className="relative inline-block h-3 w-[22px] rounded-full" style={{ background: xemGon ? 'rgb(var(--doing-line-rgb))' : 'var(--line-strong)' }}>
            <span className="absolute top-[2px] h-2 w-2 rounded-full" style={{ left: xemGon ? 12 : 2, background: xemGon ? 'var(--text)' : 'var(--text-faint)' }} />
          </i>
          Xem gọn
        </button>
      </div>

      <ChuGiai cheDo={cheDo} />

      {/* MỘT thẻ, MỘT khung cuộn ngang, MỘT lưới — trục và mọi hộp kỹ năng là con trực tiếp của lưới này. */}
      <div className="rounded-lg border p-1.5" style={{ background: 'var(--surface)' }}>
        <div ref={setKhung} className="overflow-x-auto">
          <div className="grid relative isolate"
            style={{ gridTemplateColumns: `${boCuc.cotTen}px repeat(${soTuan}, ${boCuc.cotTuan})`, gridTemplateRows: hang.mau }}>
            {/* ---- lớp nền: khung hộp · vạch tuần (đầu tháng đậm) · cả cột tuần này · dải Tạm dừng */}
            {hang.hop.map((h, i) => (
              <div key={`khung-${hopHienThi[i].kyNang}`} aria-hidden className="pointer-events-none z-0 rounded-lg"
                style={{ gridRow: `${h.khung[0]} / ${h.khung[1]}`, gridColumn: '1 / -1', ...NEN_HOP, boxShadow: '0 0 0 1px var(--line)' }} />
            ))}
            {truc.tuan.map((w, i) => doanLuoi.map(([a, b], k) => (
              <div key={`vach-${w.thuHai}-${k}`} aria-hidden className="pointer-events-none z-[1] border-l"
                style={{ gridRow: `${a} / ${b}`, gridColumn: i + 2, borderColor: w.dauThang ? 'var(--line-strong)' : 'var(--line)', opacity: w.dauThang ? 1 : 0.55 }} />
            )))}
            {cotHomNay >= 0 && (
              <div aria-hidden className="pointer-events-none z-[1] rounded-md"
                style={{ gridRow: `1 / ${hang.hangCuoi}`, gridColumn: cotHomNay + 2, background: 'rgb(var(--doing-rgb) / 0.08)' }} />
            )}
            {dungHienThi.map((t, k) => {
              const a = cotCua(t.tu, truc);
              /* Tuần Quay lại không tính dừng (Q1): dải tới tuần TRƯỚC tuần quay lại. */
              const b = t.den ? Math.max(a, cotCua(t.den, truc) - 1) : soTuan - 1;
              return (
                <div key={`dung-${k}`} aria-hidden className="pointer-events-none z-[1]"
                  style={{ gridRow: `${hangTruocHop} / ${hang.hangCuoi}`, gridColumn: `${a + 2} / ${b + 3}`, background: SOC_DUNG }} />
              );
            })}

            {/* ---- trục: tháng (tên giữa, ngoặc trải đúng số tuần) · tuần */}
            <CotGhim hang={1} cotTen={boCuc.cotTen} nen="var(--surface)" />
            {truc.thang.map((th) => (
              <div key={`${th.tu}-${th.nhan}`} title={`${th.nhan} · ${th.so} tuần`}
                className="relative z-[2] mx-[5px] mb-[3px] self-end border-b pb-[3px] text-center text-[11px] font-bold leading-[15px] tracking-[0.06em] text-dim whitespace-nowrap"
                style={{ gridRow: 1, gridColumn: `${th.tu + 2} / ${th.tu + th.so + 2}`, borderColor: 'var(--line-strong)' }}>
                {th.nhan}
                <span aria-hidden className="absolute -bottom-px left-0 h-1.5 w-px" style={{ background: 'var(--line-strong)' }} />
                <span aria-hidden className="absolute -bottom-px right-0 h-1.5 w-px" style={{ background: 'var(--line-strong)' }} />
              </div>
            ))}
            <CotGhim hang={2} cotTen={boCuc.cotTen} nen="var(--surface)" className="items-center px-3 text-[11px] text-faint">Tuần</CotGhim>
            {truc.tuan.map((w, i) => (
              <div key={w.thuHai} title={`${tuanLich(w.thuHai, homNay)}${w.homNay ? ' · tuần này' : i > cotHomNay && cotHomNay >= 0 ? ' · tuần tới' : ''}`}
                className={`z-[2] pb-1.5 pt-1 text-center text-[11px] tabular-nums ${w.homNay ? 'font-extrabold text-doing' : 'text-faint'} ${cotHomNay >= 0 && i > cotHomNay ? 'opacity-60' : ''}`}
                style={{ gridRow: 2, gridColumn: i + 2 }}>
                {w.nhan}
              </div>
            ))}
            <div aria-hidden className="pointer-events-none z-[1] self-end border-b" style={{ gridRow: 2, gridColumn: '1 / -1', height: 0 }} />

            {/* ---- hàng Tuần học (FT, tuần học thứ n của em — bỏ tuần Tạm dừng) / Tuần khoá (lớp thường) */}
            {hang.hangTuanHoc && (
              <>
                <CotGhim hang={hang.hangTuanHoc} cotTen={boCuc.cotTen} nen="var(--surface)" className="items-center px-3 text-[11px] text-faint">{tuanHocNhan}</CotGhim>
                {truc.tuan.map((w, i) => {
                  const n = soTuanCot(data.tuanHoc, data.tamDung ?? [], w.thuHai);
                  const dangDung = dungHienThi.some((t) => cotCua(t.tu, truc) <= i && (!t.den || i < cotCua(t.den, truc)));
                  return (
                    <div key={`th-${w.thuHai}`} className={`z-[2] py-1 text-center text-[11px] tabular-nums ${w.homNay ? 'font-bold text-doing' : 'text-faint'}`}
                      style={{ gridRow: hang.hangTuanHoc!, gridColumn: i + 2 }}>
                      {n ?? (dangDung && data.tuanHoc?.loai === 'ft' ? '–' : '')}
                    </div>
                  );
                })}
                {dungHienThi.map((t, k) => {
                  const a = cotCua(t.tu, truc);
                  const b = t.den ? Math.max(a, cotCua(t.den, truc) - 1) : soTuan - 1;
                  return (
                    <div key={`dchip-${k}`} title={`Tạm dừng ${chuKhoangDung(t, homNay)}`}
                      className="z-[3] mx-0.5 flex h-5 items-center justify-center gap-1 self-center overflow-hidden whitespace-nowrap rounded-[5px] bg-soon-bg text-[11px] font-semibold text-soon"
                      style={{ gridRow: hang.hangTuanHoc!, gridColumn: `${a + 2} / ${b + 3}` }}>
                      <IconTamDung size={10} />{boCuc.xuongDong ? '' : 'Tạm dừng'}
                    </div>
                  );
                })}
              </>
            )}

            {/* ---- hàng Lớp: đoạn mỗi lớp (chuyển lớp có biểu tượng) */}
            {hang.hangLop && (
              <>
                <CotGhim hang={hang.hangLop} cotTen={boCuc.cotTen} nen="var(--surface)" className="items-center px-3 text-[11px] text-faint">Lớp</CotGhim>
                {lopHienThi.map((l) => {
                  const a = cotCua(l.tu, truc);
                  const b = l.den ? Math.max(a, cotCua(l.den, truc) - 1) : soTuan - 1;
                  return (
                    <div key={l.code + l.tu} title={`${l.code}${l.gvcn ? ` · GVCN ${l.gvcn}` : ''} · ${tuanLich(l.tu, homNay)} → ${l.den ? tuanLich(l.den, homNay) : 'nay'}`}
                      className="z-[2] mx-0.5 flex h-6 min-w-0 items-center self-center overflow-clip whitespace-nowrap rounded-md border px-2 text-[12px]"
                      style={{ gridRow: hang.hangLop!, gridColumn: `${a + 2} / ${b + 3}`, background: 'var(--surface-2)', borderColor: 'var(--line)' }}>
                      {/* Tên lớp bám mép phải cột tên khi trục cuộn ngang (375 px mở ở tuần này) — overflow-clip để sticky theo khung cuộn ngoài. */}
                      <span className="sticky flex items-center gap-1.5" style={{ left: boCuc.cotTen + 8 }}>
                        {l.chuyen && <span className="text-[color:var(--accent)]"><IconChuyenLop /></span>}
                        <b className="font-semibold text-slate-100">{boCuc.xuongDong ? l.ngan : l.code}</b>
                        {!boCuc.xuongDong && l.gvcn && <span className="text-slate-400">GVCN {l.gvcn}</span>}
                      </span>
                    </div>
                  );
                })}
              </>
            )}

            {/* ---- hàng Đợt Test: mỗi đợt gọn trong MỘT cột tuần, hai dòng; đợt sắp tới chưa có điểm (cột tuần tới) viền đứt */}
            {hang.hangGhim && (
              <>
                <CotGhim hang={hang.hangGhim} cotTen={boCuc.cotTen} nen="var(--surface)" className="items-center px-3 py-1 text-[11px] text-faint">
                  Đợt Test
                </CotGhim>
                {nhomGhim.map((nhom) => {
                  if (!giaoKhoangXem(nhom.tuan, nhom.tuan, khoang)) return null;
                  const cot = cotCua(nhom.tuan, truc);
                  return (
                    <div key={nhom.tuan} style={{ gridRow: hang.hangGhim!, gridColumn: cot + 2 }} className="z-[3] flex min-w-0 flex-col gap-1 py-1">
                      {nhom.ghim.map((g) => {
                        const nh = nhanGhim({ ...g, homNay });
                        const duKien = g.soCoDiem === 0 && g.tuan > homNay;
                        return (
                          <button key={g.attemptId} type="button" title={nh.day}
                            /* G5: ghim mở hồ sơ Mock của đợt (không cuộn) — qua `duongDotTest`, không tự ghép đường. */
                            onClick={() => navigate(duongDotTest({ id: g.attemptId, kind: g.kind, classId: g.classId }))}
                            className={`mx-[3px] flex min-w-0 flex-col items-center justify-center overflow-hidden rounded-md border px-0.5 py-0.5 leading-[14px] ${SCORE_CHIP[MAU_GHIM[nh.mau]]} ${duKien ? 'border-dashed' : ''}`}>
                            <b className="whitespace-nowrap text-[11.5px] font-bold">{nh.hai[0]}</b>
                            {nh.hai[1] && <span className="whitespace-nowrap text-[11px] tabular-nums">{nh.hai[1]}</span>}
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
                truc={truc} boCuc={boCuc} rongTuan={rongTuan} homNay={homNay}
                onOpenCase={onOpenCase} onXemCaGiaiDoan={() => setCheDoKhoang('ca-giai-doan')} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Một hộp kỹ năng, là các con trực tiếp của lưới chính (không tự tạo `display: grid` cho cột tuần):
 * hàng khe → hàng đầu (tên · chuỗi điểm ở cột tên, badge ngay đầu vùng trục) → mỗi Case một hàng khung + các tầng PA.
 * Cột tên và hàng đầu ghim trái (`sticky`) để còn đọc được khi cuộn ngang ở màn hẹp.
 */
function HopKyNang({ hop, vi, vanDe, soAn, truc, boCuc, rongTuan, homNay, onOpenCase, onXemCaGiaiDoan }: {
  hop: Hop; vi: ReturnType<typeof xepHangLuoi>['hop'][number]; vanDe: VanDe[]; soAn: number;
  truc: Truc; boCuc: BoCuc; rongTuan: number; homNay: string;
  onOpenCase: (caseId: number, paId?: number) => void; onXemCaGiaiDoan: () => void;
}) {
  const moc = chuoiDiem(hop.diem, hop.cheDo, hop.conCho, { toiDa: boCuc.toiDaMoc, dotCho: hop.dotCho });
  const chuoiDu = chuoiDiem(hop.diem, hop.cheDo, hop.conCho, { toiDa: 99, dotCho: hop.dotCho })
    .map((m) => `${m.lech ? `${m.lech.chu} ` : ''}${m.chu}`).join(' ');
  const badge = trangThaiHop({ caseMo: hop.caseMo, coTungCase: hop.coTungCase, diemCuoiChuaDat: hop.diemCuoiChuaDat, xongGanNhat: hop.xongGanNhat, huyGanNhat: hop.huyGanNhat }, homNay);
  const rongTen = RONG_TEN_KY_NANG[hop.cheDo];
  const cuoiHop = vanDe.length === 0 && soAn === 0;
  /* G5: mốc điểm mở hồ sơ Mock của đúng lượt, cuộn tới kỹ năng này (lớp thường → bảng điểm lớp thường). */
  /* PR-S6F-b: mốc mang sẵn kind + classId từ máy chủ (lượt lớp thường chưa xếp tuần không có trong ghim). */
  const duongMoc = (m: { attemptId?: number | null; kind?: string | null; classId?: number | null }) =>
    (m.attemptId ? duongDotTest({ id: m.attemptId, kind: m.kind ?? null, classId: m.classId ?? null }, hop.kyNang) : null);


  return (
    <>
      <div className="z-[2] flex min-h-[42px] items-stretch" style={{ gridRow: vi.dau, gridColumn: '1 / -1' }}>
        <div className="sticky left-0 z-[3] flex items-center whitespace-nowrap">
          <div className={`flex-none ${cuoiHop ? 'rounded-l-lg' : 'rounded-tl-lg'}`}
            style={{
              width: boCuc.cotTen, ...NEN_HOP,
              ...(boCuc.xuongDong
                ? { display: 'grid', gridTemplateColumns: '1fr', rowGap: 2, padding: '6px 0' }
                : { display: 'grid', gridTemplateColumns: `${rongTen}px 1fr`, alignItems: 'center', minHeight: 42 }),
            }}>
            <span className="truncate pl-3 text-[13px] font-bold" title={hop.nhan}>
              {/* Lớp thường: "Grammar + Vocabulary" / "Pronunciation" không vừa 96 px → tên ngắn G+V / P như chip lọc (tên đủ ở tooltip). */}
              {boCuc.xuongDong || (hop.cheDo === 'ratio' && hop.nhan.length > 10) ? hop.nhanNgan ?? hop.nhan : hop.nhan}
            </span>
            <span data-chuoi className="inline-flex w-max items-baseline justify-self-start pr-3 text-[12.5px] tabular-nums"
              style={boCuc.xuongDong ? { paddingLeft: 12 } : undefined} title={chuoiDu}>
              {moc.length === 0
                ? <span className="text-faint">chưa có điểm</span>
                : moc.map((m, k) => {
                  const href = m.cho ? null : duongMoc(m);
                  const lop = m.cho ? 'ml-2 font-semibold text-faint' : m.xau ? 'font-bold text-bad' : 'font-bold text-[var(--text)]';
                  return (
                    <Fragment key={k}>
                      {m.lech && (
                        <i className={`mx-[5px] text-[11px] font-bold not-italic ${LECH[m.lech.dau]}`} title={LECH_TITLE[m.lech.dau]}>{m.lech.chu}</i>
                      )}
                      {href
                        ? <Link to={href} title={`${m.title} · mở hồ sơ Mock`} className={`${lop} no-underline hover:underline`}>{m.chu}</Link>
                        : <b title={m.title} className={lop}>{m.chu}</b>}
                    </Fragment>
                  );
                })}
            </span>
          </div>
          {badge ? (
            <span className="ml-1.5">
              <Nhan tone={badge.tone === 'ok' ? 'ok' : toneNhanTuBadge(badge.tone)} title={badge.chu}>
                {boCuc.xuongDong ? badge.ngan : badge.chu}
              </Nhan>
            </span>
          ) : (
            <span className="ml-1.5 text-[12px] text-faint">Không có Case</span>
          )}
        </div>
      </div>

      {vanDe.map((v, j) => (
        <VanDeHang key={v.caseId} v={v} vi={vi.vanDe[j]} cuoi={j === vanDe.length - 1 && soAn === 0}
          truc={truc} boCuc={boCuc} rongTuan={rongTuan} homNay={homNay} onOpenCase={onOpenCase} />
      ))}

      {soAn > 0 && vi.dongAn && (
        <CotGhim hang={vi.dongAn} cotTen={boCuc.cotTen} nen="var(--surface-2)" className="rounded-bl-lg">
          <button type="button" onClick={onXemCaGiaiDoan} title={`Chọn "Cả giai đoạn" để thấy ${soAn} vấn đề cũ hơn`}
            className="block w-full appearance-none truncate border-0 bg-transparent py-1.5 pl-3 pr-3 text-left text-[12px] text-faint hover:underline">
            +{soAn} vấn đề cũ hơn — chọn "Cả giai đoạn"
          </button>
        </CotGhim>
      )}
    </>
  );
}

/**
 * Ô CỘT TÊN GHIM TRÁI. `position: sticky` chỉ chạy trong vùng lưới của chính phần tử, nên ô ở cột 1 một mình không
 * thể đứng yên khi cuộn ngang — ô ngoài trải `1 / -1` (không bắt chuột) rồi phần đứng yên bên trong rộng đúng `cotTen`.
 */
function CotGhim({ hang, cotTen, nen, className = '', children }: {
  hang: number | string; cotTen: number; nen: string; className?: string; children?: ReactNode;
}) {
  return (
    <div className="pointer-events-none z-[4] flex" style={{ gridRow: hang, gridColumn: '1 / -1' }}>
      <div className={`pointer-events-auto sticky left-0 flex flex-none whitespace-nowrap ${className}`} style={{ width: cotTen, background: nen }}>
        {children}
      </div>
    </div>
  );
}

/**
 * Một Case: hàng KHUNG (Case = khung rỗng viền theo SOS, từ tuần mở tới tuần xong; còn mở thì mép phải đứt) + các hàng tầng PA (khối đặc).
 * Cột tên: nhãn `Case` viền + chip MT + chip SOS, dòng phụ mã tuần; hàng PA: nhãn `PA` nền đặc + "n phương án · người".
 */
function VanDeHang({ v, vi, cuoi, truc, boCuc, rongTuan, homNay, onOpenCase }: {
  v: VanDe; vi: { khung: number; tu: number; so: number }; cuoi: boolean; truc: Truc; boCuc: BoCuc; rongTuan: number; homNay: string;
  onOpenCase: (caseId: number, paId?: number) => void;
}) {
  const tang = xepTang(v.pa.map((p) => ({ id: p.id, tu: p.tu, den: p.den, noiTiepTu: p.noiTiepTu })));
  const phu = dongPhuVanDe(v, homNay);
  const a = cotCua(v.mo, truc);
  const b = Math.max(a, cotCua(v.dong ?? homNay, truc));
  const giua = /^\[MT\d+\] (.*?)(?: \[SOS \d\])?$/.exec(v.ten)?.[1] ?? v.ten;
  const cho = khoiCho(v);
  const coPaCho = v.pa.some((p) => p.cho);

  return (
    <>
      <div aria-hidden className="pointer-events-none z-[4] border-t" style={{ gridRow: vi.khung, gridColumn: '1 / -1', height: 0, alignSelf: 'start' }} />
      <CotGhim hang={vi.khung} cotTen={boCuc.cotTen} nen="var(--surface-2)" className={`min-w-0 flex-col justify-center pr-3 ${boCuc.xuongDong ? 'pl-3' : 'pl-6'}`}>
        <button type="button" onClick={() => onOpenCase(v.caseId)} title={v.ten} className="group min-w-0 appearance-none border-0 bg-transparent p-0 text-left">
          <span className="flex min-w-0 items-center gap-1.5 whitespace-nowrap text-[12px] text-[var(--text)]">
            <NhanLoai loai="Case" />
            {v.attemptNo != null && v.sos != null && <span className="rounded border border-[color:var(--line-strong)] px-1 text-[11px] font-semibold leading-4 tabular-nums text-slate-300">MT{v.attemptNo}</span>}
            {!boCuc.xuongDong && <span className="min-w-0 truncate group-hover:underline">{v.sos != null ? giua : v.ten}</span>}
            {v.sos ? <span className={`rounded px-1 text-[11.5px] font-bold leading-4 tabular-nums ${CHIP_SOS[v.sos] ?? ''}`}>SOS {v.sos}</span> : null}
          </span>
          {!boCuc.xuongDong && <span className="block truncate text-[12px] leading-4 text-faint" title={phu}>{phu}</span>}
        </button>
      </CotGhim>
      {/* Case = KHUNG RỖNG trên trục: viền theo SOS (lớp thường trung tính), từ tuần mở tới tuần xong; còn mở → mép phải đứt. */}
      <button type="button" onClick={() => onOpenCase(v.caseId)} title={`${v.ten} · mở ${tuanLich(v.mo, homNay)}${v.dong ? ` · xong ${tuanLich(v.dong, homNay)}` : ' · đang mở'}`}
        className={`z-[3] mx-0.5 flex h-5 min-w-0 appearance-none items-center justify-between gap-1.5 self-center overflow-hidden whitespace-nowrap rounded-[5px] border-[1.5px] bg-transparent px-1.5 text-[11px] text-slate-400 ${v.dong ? '' : 'rounded-r-none'}`}
        style={{ gridRow: vi.khung, gridColumn: `${a + 2} / ${b + 3}`, borderColor: v.sos ? VIEN_CASE[v.sos] : 'var(--line-strong)', borderRightStyle: v.dong ? undefined : 'dashed' }}>
        {!boCuc.xuongDong && (b - a + 1) * rongTuan >= 120 && (
          <>
            <span>mở {tuanLich(v.mo, homNay)}</span>
            {v.dong
              ? <span className="inline-flex items-center gap-[3px] font-semibold text-ok"><IconDat size={10} />Xong {tuanLich(v.dong, homNay)}</span>
              : <span>đang mở</span>}
          </>
        )}
      </button>

      <CotGhim hang={`${vi.tu} / span ${vi.so}`} cotTen={boCuc.cotTen} nen="var(--surface-2)"
        className={`min-w-0 items-start pr-3 pt-1.5 ${boCuc.xuongDong ? 'pl-3' : 'pl-6'} ${cuoi ? 'rounded-bl-lg' : ''}`}>
        <span className="flex min-w-0 items-center gap-1.5 text-[12px] text-faint">
          <NhanLoai loai="PA" cho={coPaCho || (!!cho && v.pa.length === 0)} />
          <span className="truncate">{boCuc.xuongDong
            ? (v.pa.length ? String(v.pa.length) : 'chưa có')
            : [v.pa.length ? `${v.pa.length} phương án` : 'chưa có PA', v.nguoi].filter(Boolean).join(' · ')}</span>
        </span>
      </CotGhim>
      {cho && v.pa.length === 0 ? (
        <KhoiCho chu={cho} tu={v.mo} homNay={homNay} truc={truc} hang={vi.tu} rongTuan={rongTuan} />
      ) : v.pa.map((p) => (
        <KhoiPa key={p.id} p={p} hang={vi.tu + tang.get(p.id)!} truc={truc} rongTuan={rongTuan} homNay={homNay}
          onOpenCase={() => onOpenCase(v.caseId, p.id)} />
      ))}
    </>
  );
}

/** Khối CHỜ (Q18): viền đứt tím — "Chờ nguyên nhân" · "Chờ duyệt kế hoạch" · "Chưa có PA" (một mục chú giải "chờ"). */
function KhoiCho({ chu, tu, homNay, truc, hang, rongTuan }: { chu: string; tu: string; homNay: string; truc: Truc; hang: number; rongTuan: number }) {
  const a = cotCua(tu, truc);
  const b = Math.max(a, cotCua(homNay, truc));
  const rongKhoi = (b - a + 1) * rongTuan;
  return (
    <div title={chu}
      className={`z-[2] mx-[3px] flex h-6 min-w-0 items-center justify-center self-center overflow-hidden rounded-md text-[11px] font-semibold whitespace-nowrap ${KHOI_CHO}`}
      style={{ gridRow: hang, gridColumn: `${a + 2} / ${b + 3}` }}>
      {rongKhoi >= 96 ? chu : ''}
    </div>
  );
}

function KhoiPa({ p, hang, truc, rongTuan, homNay, onOpenCase }: {
  p: Pa; hang: number; truc: Truc; rongTuan: number; homNay: string; onOpenCase: () => void;
}) {
  const a = cotCua(p.tu, truc);
  /* PA đang chạy kết thúc ở tuần hôm nay (Q4), không kéo tới cột cuối trục. */
  const b = Math.max(a, cotCua(denKhoiPa(p, homNay), truc));
  const nh = nhanKhoiPa(p, homNay);
  const hienTen = (b - a + 1) * rongTuan >= KHOI_PA_CO_TEN;
  const cho = !!p.cho && p.status !== 'completed';
  return (
    <button type="button" data-pa-id={p.id} title={cho ? `${nh.ten} · chờ Quản lý duyệt` : nh.day} onClick={onOpenCase}
      style={{ gridRow: hang, gridColumn: `${a + 2} / ${b + 3}` }}
      className={`z-[2] mx-[3px] flex h-6 min-w-0 appearance-none items-center gap-1.5 self-center overflow-hidden whitespace-nowrap rounded-md text-[11px] ${cho ? KHOI_CHO : `border-0 ${KHOI[nh.tone]}`} ${hienTen ? 'px-2' : 'justify-center px-0'}`}>
      {!cho && <span className="flex-none">{DAU_KHOI[nh.tone]}</span>}
      {hienTen && <span className={`truncate font-semibold ${cho ? '' : 'text-[var(--text)]'}`}>{nh.ten}</span>}
    </button>
  );
}

/**
 * CHÚ GIẢI GỌN (Q17, mockup 26): 9 mục một dòng, biểu tượng SVG — Case khung rỗng · PA khối đặc · đang làm · kết quả PA · quá hạn · chờ ·
 * so với lần trước · đợt Test dự kiến, chưa có điểm (viền đứt — chữ "dự kiến" như mockup 26) · tạm dừng. < 640 px thu gọn chỉ ký hiệu, nút "Ký hiệu" mở chữ.
 */
function ChuGiai({ cheDo }: { cheDo: 'ielts' | 'ratio' }) {
  const [moChu, setMoChu] = useState(false);
  const khoi = (lop: string, dau: ReactNode) => <span className={`inline-flex h-4 w-[18px] flex-none items-center justify-center rounded ${lop}`}>{dau}</span>;
  const muc: [ReactNode, string][] = [
    [<span key="c" className="inline-block h-3 w-[22px] rounded-[3px] border-[1.5px] border-[color:var(--text)]" />, 'Case (khung rỗng)'],
    [<span key="p" className="inline-block h-3 w-[22px] rounded-[3px]" style={{ background: 'var(--line-strong)' }} />, 'PA (khối đặc)'],
    [khoi(KHOI.run, <IconDangLam size={10} />), 'đang làm'],
    [<span key="kq" className="inline-flex gap-0.5">{khoi(KHOI.ok, <IconDat size={10} />)}{khoi(KHOI.part, <IconMotPhan size={10} />)}{khoi(KHOI.bad, <IconKhong size={10} />)}</span>,
      `kết quả PA (${outcomeLabelFor('improved').toLowerCase()} · ${outcomeLabelFor('partial').toLowerCase()} · ${outcomeLabelFor('unchanged').toLowerCase()})`],
    [khoi(KHOI.late, <IconCanhBao size={10} />), 'quá hạn'],
    [khoi(KHOI_CHO, null), 'chờ (duyệt / nguyên nhân)'],
    [<span key="l" className="inline-flex gap-0.5 text-[11px] font-bold"><i className="not-italic text-ok">▲</i><i className="not-italic text-bad">▼</i></span>, 'so với lần trước'],
    [<span key="d" className="inline-block h-3 w-[22px] rounded-md border border-dashed border-[color:var(--text)] opacity-70" />, cheDo === 'ratio' ? 'bài chưa chấm' : 'dự kiến'],
    [<span key="t" className="inline-block h-3 w-4 rounded-sm" style={{ background: SOC_DUNG }} />, 'tạm dừng'],
  ];
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[12px] text-dim" aria-label="Chú giải">
      <button type="button" aria-expanded={moChu} onClick={() => setMoChu(!moChu)}
        className="inline-flex min-h-[44px] items-center gap-1 border-0 bg-transparent p-0 text-[12px] font-semibold text-[color:var(--accent)] sm:hidden">
        Ký hiệu <IconGap mo={moChu} size={10} />
      </button>
      {muc.map(([ky, chu]) => (
        <span key={chu} className="inline-flex items-center gap-[5px] whitespace-nowrap" title={chu}>
          {ky}<span className={moChu ? '' : 'hidden sm:inline'}>{chu}</span>
        </span>
      ))}
    </div>
  );
}
