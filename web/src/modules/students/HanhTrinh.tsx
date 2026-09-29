import { Fragment, useLayoutEffect, useState, type ReactNode } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useApi } from '../../lib/useApi.ts';
import { BoLocDoan, Empty, ErrorState, SCORE_CHIP, Skeleton, type ScoreTone } from '../../ui/ui.tsx';
import { Nhan, toneNhanTuBadge } from '../../ui/Nhan.tsx';
import { Episode } from './StudentDetailPage.tsx';
import {
  CASE_CATEGORY_SHORT, KHOI_PA_CO_TEN, RONG_TEN_KY_NANG, type CaseCategory,
  boCucHanhTrinh, chuoiDiem, cotCua, denKhoiPa, dongPhuVanDe, duongHoSoHocVien, giaoKhoangXem, gomGhimTheoTuan,
  khoangTruc, nhanGhim, nhanGiaiDoan, nhanKhoiPa, outcomeLabelFor, rongCotTuan, trangThaiHop, trucTuan, tuanLich,
  uocRongChuoi, xepHangLuoi, xepTang,
  type CheDoKhoang, type DiemMoc, type DotRef, type MauKetQua, type ToneKhoiPa,
} from '@shared/domain/index.ts';

/**
 * TAB HÀNH TRÌNH (PR-Qb, spec §3.8; PR-UX5, mockup `18-hanh-trinh-va-mau.html` phần (a)) — MỘT LƯỚI CSS duy nhất cho
 * trục tuần lẫn mọi hộp kỹ năng, trải hết chiều ngang (cột tuần giãn theo màn). Không vẽ đường điểm: chuỗi điểm
 * nằm trong cột tên, ngay sau tên kỹ năng, kèm ▲ xanh / ▼ đỏ / = xám. Mọi nhãn/tầng/badge/bố cục tính bằng
 * `shared/domain/hanhTrinh.ts` — file này chỉ vẽ theo đúng những gì các hàm đó trả về.
 */

type GiaiDoan = { loai: 'thuong' | 'ft'; tu: string; den: string | null };
type Doan = { loai: 'khoa' | 'lo-trinh'; nhan: string; tu: string; den: string };
type Ghim = {
  attemptId: number; tuan: string; cheDo: 'ielts' | 'ratio'; attemptNo: number; kind: string; lichSu?: boolean;
  overall: number | null; sosLevel: number | null; soDat: number | null; soYeuCau: number; soCoDiem: number;
  maLop: string | null; kyVong: number | null; kyNangChuaDat: string[];
  khongChiaMon?: boolean; tyLe?: number | null;
};
type Pa = {
  id: number; ten: string; tu: string; den: string | null; status: string;
  lastOutcome: string | null; followupOverdue: boolean; soNgayQuaHan: number | null;
  supersededBy: number | null; noiTiepTu: number | null;
};
type VanDe = { caseId: number; ten: string; mo: string; dong: string | null; soPa: number; pa: Pa[] };
type Hop = {
  kyNang: CaseCategory; nhan: string; cheDo: 'ielts' | 'ratio';
  /** Tên ngắn theo chương trình (máy chủ, MH2): FOU G+V/P. */
  nhanNgan?: string;
  diem: DiemMoc[]; conCho: boolean; dotCho: DotRef | null;
  caseMo: { mo: string; soPa: number }[]; coTungCase: boolean;
  diemCuoiChuaDat: boolean | null; xongGanNhat: string | null; huyGanNhat?: boolean; vanDe: VanDe[];
};
type HanhTrinhData = {
  giaiDoan: 'thuong' | 'ft' | null; cacGiaiDoan: GiaiDoan[]; homNay: string;
  doan: Doan[]; ghim: Ghim[]; hop: Hop[];
};
type Truc = ReturnType<typeof trucTuan>;
type BoCuc = ReturnType<typeof boCucHanhTrinh>;

const CHIP_TAT_CA = 'tat-ca';

/** Màu kết quả Test (N-1b) → họ chip của `SCORE_CHIP`. */
const MAU_GHIM = { dat: 'emerald', sos1: 'sos1', sos2: 'sos2', sos3: 'sos3', tam: 'tam' } as const satisfies Record<MauKetQua, ScoreTone>;
/** Mũi tên ▲▼= của chuỗi điểm. */
const LECH = { len: 'text-ok', xuong: 'text-bad', bang: 'text-faint' } as const;
const LECH_TITLE = { len: 'Tăng', xuong: 'Giảm', bang: 'Giữ nguyên' } as const;
/** Khối PA: nền sẫm cùng họ, chữ màu, KHÔNG viền (mockup 18 (a) luật 5). */
const KHOI: Record<ToneKhoiPa, string> = {
  ok: 'bg-ok-bg text-ok', part: 'bg-soon-bg text-soon', bad: 'bg-bad-bg text-bad',
  run: 'bg-doing-bg text-doing', late: 'bg-late-bg text-late', done: 'bg-done-bg text-done',
};
const NEN_HOP = { background: 'var(--surface-2)' } as const;
/** Ngưỡng màn hẹp: dưới đây Xem gọn tự bật lúc mở tab (không lưu). */
const MAN_HEP = '(max-width: 639px)';

const soTangCua = (pa: Pa[]): number => (pa.length ? Math.max(...xepTang(pa.map((p) => ({ id: p.id, tu: p.tu, den: p.den, noiTiepTu: p.noiTiepTu }))).values()) + 1 : 1);

export function HanhTrinh({ studentId, active, episodes, allEpisodes, onOpenCase }: {
  studentId: number; active: boolean; episodes: any[]; allEpisodes: any[];
  onOpenCase: (caseId: number, paId?: number) => void;
}) {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [allJourney, setAllJourney] = useState(false);
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

  if (!active) return null;
  if (error) return <ErrorState message={error.message} hint={error.hint} onRetry={reload} />;
  if (loading || !data) return <Skeleton rows={6} />;
  if (!data.cacGiaiDoan.length) return <Empty title="Chưa có Case nào để hiển thị trong hành trình" />;

  const homNay = data.homNay;
  const giaiDoanDangXem = data.giaiDoan ? data.cacGiaiDoan.find((g) => g.loai === data.giaiDoan)! : data.cacGiaiDoan[0];
  const khoang = khoangTruc(giaiDoanDangXem, homNay, cheDoKhoang);
  const truc = trucTuan(khoang.tu, khoang.den, homNay);
  const soTuan = truc.tuan.length;
  /* Ẩn hẳn đoạn khoá/lộ trình KHÔNG giao khoảng đang xem — cotCua kẹp mép sẽ vẽ dính mép giả nếu không lọc trước. */
  const doanHienThi = data.doan.filter((dg) => giaoKhoangXem(dg.tu, dg.den, khoang));

  const setGiaiDoan = (loai: 'thuong' | 'ft') => {
    const next = new URLSearchParams(params);
    next.set('giai-doan', loai);
    setParams(next, { replace: true });
  };

  const hopHienThi = chip === CHIP_TAT_CA ? data.hop : data.hop.filter((h) => h.kyNang === chip);
  const cheDo = data.hop[0]?.cheDo ?? (giaiDoanDangXem.loai === 'thuong' ? 'ratio' : 'ielts');
  /* Ước trên 5 mốc dù đang hiện 3 — cột tên không nhảy qua lại khi bật/tắt Xem gọn hay đổi chip kỹ năng. */
  const rongChuoi = Math.max(0, ...data.hop.map((h) => uocRongChuoi(chuoiDiem(h.diem, h.cheDo, h.conCho, { toiDa: 5, dotCho: h.dotCho }))));
  const boCuc = boCucHanhTrinh({ rong, soTuan, xemGon, rongChuoi, cheDo });
  const rongTuan = rongCotTuan(boCuc, rong, soTuan);

  const vanDeCua = (h: Hop) => h.vanDe.filter((v) => giaoKhoangXem(v.mo, v.dong, khoang));
  const hang = xepHangLuoi({
    coDoan: doanHienThi.length > 0,
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

  return (
    <div className="space-y-3">
      {/* Hàng điều khiển: nút giai đoạn · chip kỹ năng · khoảng đang xem · Xem gọn */}
      <div className="flex flex-wrap items-center gap-2">
        {data.cacGiaiDoan.length === 2 && (
          <BoLocDoan ariaLabel="Giai đoạn" value={giaiDoanDangXem.loai} onChange={setGiaiDoan}
            muc={data.cacGiaiDoan.map((g) => ({ key: g.loai, nhan: nhanGiaiDoan(g, homNay) }))} />
        )}
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
          title="Thu hẹp cột tuần về 40px — cuộn ngang trong thẻ"
          className={`btn btn-sm inline-flex items-center gap-1.5 ${xemGon ? 'bg-doing-bg text-doing border-doing-line' : ''}`}>
          <i aria-hidden className="relative inline-block h-3 w-[22px] rounded-full" style={{ background: xemGon ? 'rgb(var(--doing-line-rgb))' : 'var(--line-strong)' }}>
            <span className="absolute top-[2px] h-2 w-2 rounded-full" style={{ left: xemGon ? 12 : 2, background: xemGon ? '#dbe9ff' : 'var(--text-faint)' }} />
          </i>
          Xem gọn
        </button>
      </div>

      {/* MỘT thẻ, MỘT khung cuộn ngang, MỘT lưới — trục và mọi hộp kỹ năng là con trực tiếp của lưới này. */}
      <div className="rounded-lg border p-1.5" style={{ background: 'var(--surface)' }}>
        <div ref={setKhung} className="overflow-x-auto">
          <div className="grid relative isolate"
            style={{ gridTemplateColumns: `${boCuc.cotTen}px repeat(${soTuan}, ${boCuc.cotTuan})`, gridTemplateRows: hang.mau }}>
            {/* ---- lớp nền: khung hộp · vạch tuần · cả cột tuần này */}
            {hang.hop.map((h, i) => (
              <div key={`khung-${hopHienThi[i].kyNang}`} aria-hidden className="pointer-events-none z-0 rounded-lg"
                style={{ gridRow: `${h.khung[0]} / ${h.khung[1]}`, gridColumn: '1 / -1', ...NEN_HOP, boxShadow: '0 0 0 1px var(--line)' }} />
            ))}
            {/* Vạch tuần vẽ theo ĐOẠN (phần trục + từng khung hộp), bỏ hàng khe — khi cuộn ngang khe không có ô cột tên che. */}
            {truc.tuan.map((w, i) => doanLuoi.map(([a, b], k) => (
              <div key={`vach-${w.thuHai}-${k}`} aria-hidden className="pointer-events-none z-[1] border-l"
                style={{ gridRow: `${a} / ${b}`, gridColumn: i + 2, borderColor: w.dauThang ? 'var(--line-strong)' : 'var(--line)', opacity: w.dauThang ? 1 : 0.55 }} />
            )))}
            {cotHomNay >= 0 && (
              <div aria-hidden className="pointer-events-none z-[1] rounded-md"
                style={{ gridRow: `1 / ${hang.hangCuoi}`, gridColumn: cotHomNay + 2, background: 'rgb(var(--doing-rgb) / 0.08)' }} />
            )}

            {/* ---- trục: tháng (hàng 1) · tuần (hàng 2) */}
            <CotGhim hang={1} cotTen={boCuc.cotTen} nen="var(--surface)" />
            {truc.thang.map((th) => (
              <div key={`${th.tu}-${th.nhan}`} className="z-[2] px-1.5 pb-1 pt-0.5 text-[10px] font-extrabold uppercase tracking-[0.06em] text-dim whitespace-nowrap"
                style={{ gridRow: 1, gridColumn: `${th.tu + 2} / ${th.tu + th.so + 2}` }}>
                {th.nhan}
              </div>
            ))}
            <CotGhim hang={2} cotTen={boCuc.cotTen} nen="var(--surface)" className="items-center px-3 text-[10.5px] text-faint">Tuần</CotGhim>
            {truc.tuan.map((w, i) => (
              <div key={w.thuHai} title={`${tuanLich(w.thuHai, homNay)}${w.homNay ? ' · tuần này' : ''}`}
                className={`z-[2] pb-1.5 pt-1 text-center text-[10.5px] tabular-nums ${w.homNay ? 'font-extrabold text-doing' : 'text-faint'}`}
                style={{ gridRow: 2, gridColumn: i + 2 }}>
                {w.nhan}
              </div>
            ))}
            <div aria-hidden className="pointer-events-none z-[1] self-end border-b" style={{ gridRow: 2, gridColumn: '1 / -1', height: 0 }} />

            {/* ---- hàng Khoá / Lộ trình */}
            {hang.hangDoan && (
              <>
                <CotGhim hang={hang.hangDoan} cotTen={boCuc.cotTen} nen="var(--surface)" className="items-center px-3 py-1 text-[10.5px] text-faint">
                  {doanHienThi[0].loai === 'khoa' ? 'Khoá' : 'Lộ trình'}
                </CotGhim>
                {doanHienThi.map((dg, di) => {
                  const a = cotCua(dg.tu, truc);
                  const b = cotCua(dg.den, truc);
                  return (
                    <div key={di} title={dg.nhan}
                      className="z-[2] mx-[3px] mt-1.5 truncate rounded-md bg-muted-bg px-2 py-0.5 text-[10.5px] text-muted"
                      style={{ gridRow: hang.hangDoan!, gridColumn: `${a + 2} / ${b + 3}` }}>
                      {dg.nhan}
                    </div>
                  );
                })}
              </>
            )}

            {/* ---- hàng Đợt Test: mỗi tuần một ô, ghim cùng tuần xếp dọc */}
            {hang.hangGhim && (
              <>
                <CotGhim hang={hang.hangGhim} cotTen={boCuc.cotTen} nen="var(--surface)" className="items-center px-3 py-1 text-[10.5px] text-faint">
                  Đợt Test
                </CotGhim>
                {nhomGhim.map((nhom) => {
                  const cot = cotCua(nhom.tuan, truc);
                  return (
                    <div key={nhom.tuan} style={{ gridRow: hang.hangGhim!, gridColumn: cot + 2 }}
                      className={`z-[2] flex flex-col gap-1 overflow-visible py-1.5 ${cot === 0 ? 'items-start' : cot === soTuan - 1 ? 'items-end' : 'items-center'}`}>
                      {nhom.ghim.map((g) => {
                        const nh = nhanGhim({ ...g, homNay });
                        return (
                          <button key={g.attemptId} type="button" title={nh.day}
                            onClick={() => navigate(duongHoSoHocVien(studentId, { dot: g.attemptId }))}
                            className={`rounded-full border px-2 text-[10.5px] font-bold leading-4 whitespace-nowrap ${SCORE_CHIP[MAU_GHIM[nh.mau]]}`}>
                            {boCuc.xuongDong ? nh.gon : nh.chu}
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

      <ChuGiai cheDo={cheDo} />

      {/*
        MỐC HỌC TẬP (Q8): vào học, vào lớp, chuyển chương trình, đổi target hay kế hoạch thi, bàn
        giao case, kết quả thi thật, kết luận lộ trình. Mặc định chỉ mốc chính; mở toàn bộ khi cần
        tra lại. Ý thức (cảnh báo/danh sách theo dõi) không còn ở đây (Q8, đã chuyển hẳn sang tab
        Ý thức & Phối hợp).
      */}
      <div>
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
          <h3 className="text-sm font-semibold text-slate-200 m-0">
            {allJourney ? 'Toàn bộ ghi nhận' : 'Mốc học tập'}
          </h3>
          <button className="btn btn-sm btn-ghost" onClick={() => setAllJourney(!allJourney)}>
            {allJourney ? 'Chỉ xem mốc chính' : 'Mở toàn hành trình'}
          </button>
        </div>
        {(() => {
          const eps = allJourney ? (allEpisodes ?? episodes) : episodes;
          return eps.length === 0 ? <Empty title="Chưa có sự kiện nào" /> : (
            <ol className="space-y-3 list-none p-0 m-0">
              {eps.map((ep: any) => <Episode key={ep.key} ep={ep} onOpenCase={(id) => onOpenCase(id)} />)}
            </ol>
          );
        })()}
      </div>
    </div>
  );
}

/**
 * Một hộp kỹ năng, là các con trực tiếp của lưới chính (không tự tạo `display: grid` cho cột tuần):
 * hàng khe → hàng đầu (tên · chuỗi điểm ở cột tên, badge ngay đầu vùng trục) → mỗi vấn đề `so` hàng.
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
            <span className="truncate pl-3 text-[13px] font-bold" title={hop.nhan}>{hop.nhan}</span>
            <span data-chuoi className="inline-flex w-max items-baseline justify-self-start pr-3 text-[12.5px] tabular-nums"
              style={boCuc.xuongDong ? { paddingLeft: 12 } : undefined} title={chuoiDu}>
              {moc.length === 0
                ? <span className="text-faint">chưa có điểm</span>
                : moc.map((m, k) => (
                  <Fragment key={k}>
                    {m.lech && (
                      <i className={`mx-[5px] text-[10px] font-bold not-italic ${LECH[m.lech.dau]}`} title={LECH_TITLE[m.lech.dau]}>{m.lech.chu}</i>
                    )}
                    <b title={m.title}
                      className={m.cho ? 'ml-2 font-semibold text-faint' : m.xau ? 'font-bold text-bad' : 'font-bold text-[var(--text)]'}>
                      {m.chu}
                    </b>
                  </Fragment>
                ))}
            </span>
          </div>
          {badge ? (
            <span className="ml-1.5">
              <Nhan tone={badge.tone === 'ok' ? 'ok' : toneNhanTuBadge(badge.tone)} title={badge.chu}>
                {boCuc.xuongDong ? badge.ngan : badge.chu}
              </Nhan>
            </span>
          ) : (
            <span className="ml-1.5 text-[10.5px] text-faint">Không có Case</span>
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
            className="block w-full appearance-none truncate border-0 bg-transparent py-1.5 pl-3 pr-3 text-left text-[11px] text-faint hover:underline">
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
    <div className="pointer-events-none z-[3] flex" style={{ gridRow: hang, gridColumn: '1 / -1' }}>
      <div className={`pointer-events-auto sticky left-0 flex flex-none whitespace-nowrap ${className}`} style={{ width: cotTen, background: nen }}>
        {children}
      </div>
    </div>
  );
}

/** Một vấn đề: ô tên ghim trái (bấm mở Case, cao mọi tầng) + các khối phương án theo tầng `xepTang`. */
function VanDeHang({ v, vi, cuoi, truc, boCuc, rongTuan, homNay, onOpenCase }: {
  v: VanDe; vi: { tu: number; so: number }; cuoi: boolean; truc: Truc; boCuc: BoCuc; rongTuan: number; homNay: string;
  onOpenCase: (caseId: number, paId?: number) => void;
}) {
  const tang = xepTang(v.pa.map((p) => ({ id: p.id, tu: p.tu, den: p.den, noiTiepTu: p.noiTiepTu })));
  const phu = dongPhuVanDe(v, homNay);

  return (
    <>
      <div aria-hidden className="pointer-events-none z-[4] border-t" style={{ gridRow: vi.tu, gridColumn: '1 / -1', height: 0, alignSelf: 'start' }} />
      <CotGhim hang={`${vi.tu} / span ${vi.so}`} cotTen={boCuc.cotTen} nen="var(--surface-2)"
        className={`min-w-0 flex-col justify-center pr-3 ${boCuc.xuongDong ? 'pl-3' : 'pl-6'} ${cuoi ? 'rounded-bl-lg' : ''}`}>
        <button type="button" onClick={() => onOpenCase(v.caseId)} className="group min-w-0 appearance-none border-0 bg-transparent p-0 text-left">
          <span className="block truncate text-[11.5px] leading-[15px] text-[var(--text)] group-hover:underline" title={v.ten}>{v.ten}</span>
          <span className="block truncate text-[10.5px] leading-[14px] text-faint" title={phu}>{phu}</span>
        </button>
      </CotGhim>
      {v.pa.length === 0 ? (
        <ChuaCoPa tu={v.mo} homNay={homNay} truc={truc} hang={vi.tu} rongTuan={rongTuan} />
      ) : v.pa.map((p) => (
        <KhoiPa key={p.id} p={p} hang={vi.tu + tang.get(p.id)!} truc={truc} rongTuan={rongTuan} homNay={homNay}
          onOpenCase={() => onOpenCase(v.caseId, p.id)} />
      ))}
    </>
  );
}

function ChuaCoPa({ tu, homNay, truc, hang, rongTuan }: { tu: string; homNay: string; truc: Truc; hang: number; rongTuan: number }) {
  const a = cotCua(tu, truc);
  const b = Math.max(a, cotCua(homNay, truc));
  const rongKhoi = (b - a + 1) * rongTuan;
  return (
    <div title="Chưa có phương án nào — cần đề ra"
      className="z-[2] mx-[3px] flex h-6 min-w-0 items-center justify-center self-center overflow-hidden rounded-md border border-dashed border-soon-line text-[11px] font-semibold text-soon whitespace-nowrap"
      style={{ gridRow: hang, gridColumn: `${a + 2} / ${b + 3}` }}>
      {rongKhoi >= 72 ? 'Chưa có PA' : ''}
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
  return (
    <button type="button" data-pa-id={p.id} title={nh.day} onClick={onOpenCase}
      style={{ gridRow: hang, gridColumn: `${a + 2} / ${b + 3}` }}
      className={`z-[2] mx-[3px] flex h-6 min-w-0 appearance-none items-center gap-1.5 self-center overflow-hidden whitespace-nowrap rounded-md border-0 text-[11px] ${KHOI[nh.tone]} ${hienTen ? 'px-2' : 'justify-center px-0'}`}>
      <span className="flex-none font-extrabold">{nh.dau}</span>
      {hienTen && <span className="truncate font-semibold text-[var(--text)]">{nh.ten}</span>}
    </button>
  );
}

/** Chú giải theo nhóm: ĐIỂM · ĐỢT TEST · PHƯƠNG ÁN · ô màu tuần này. Dấu nào cũng có tooltip ở chỗ dùng (G-7). */
function ChuGiai({ cheDo }: { cheDo: 'ielts' | 'ratio' }) {
  const tieuDe = 'text-[10px] font-extrabold uppercase tracking-[0.05em] text-faint';
  const khoiMau = (tone: ToneKhoiPa, dau: string, chu: string) => (
    <span className="inline-flex items-center gap-1">
      <span className={`inline-block rounded px-[5px] text-[10px] font-extrabold leading-[15px] ${KHOI[tone]}`}>{dau}</span>{chu}
    </span>
  );
  const ghim: [MauKetQua, string][] = [['dat', 'Đạt'], ['sos1', 'SOS 1'], ['sos2', 'SOS 2'], ['sos3', 'SOS 3'], ['tam', 'Tạm thời']];
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[11px] text-dim">
      <span className={tieuDe}>Điểm</span>
      <span><i className="not-italic font-bold text-ok">▲+0.5</i> tăng</span>
      <span><i className="not-italic font-bold text-bad">▼{'−'}0.5</i> giảm</span>
      <span><i className="not-italic font-bold text-faint">=</i> giữ</span>
      {cheDo === 'ielts'
        ? <span><b className="text-bad">5.5</b> dưới kỳ vọng</span>
        : <span><b className="text-bad">65%</b> chưa đạt</span>}
      <span aria-hidden className="h-3 w-px" style={{ background: 'var(--line-strong)' }} />
      <span className={tieuDe}>Đợt Test</span>
      {ghim.map(([mau, chu]) => (
        <span key={mau} className={`rounded-full border px-2 text-[10.5px] font-bold leading-4 ${SCORE_CHIP[MAU_GHIM[mau]]}`}>{chu}</span>
      ))}
      <span aria-hidden className="h-3 w-px" style={{ background: 'var(--line-strong)' }} />
      <span className={tieuDe}>Phương án</span>
      {khoiMau('ok', '✓', outcomeLabelFor('improved'))}
      {khoiMau('part', '◐', outcomeLabelFor('partial'))}
      {khoiMau('bad', '✗', outcomeLabelFor('unchanged'))}
      {khoiMau('run', '▶', 'Đang làm')}
      {khoiMau('late', '⚠', 'Quá hạn cập nhật')}
      <span className="inline-flex items-center gap-1">
        <span className="inline-block rounded border border-dashed border-soon-line px-[5px] text-[10px] font-extrabold leading-[13px] text-soon">Chưa có PA</span>
      </span>
      <span aria-hidden className="h-3 w-px" style={{ background: 'var(--line-strong)' }} />
      <span className="inline-flex items-center gap-1">
        <span aria-hidden className="inline-block h-3 w-2.5 rounded-sm" style={{ background: 'rgb(var(--doing-rgb) / 0.2)' }} />tuần này
      </span>
    </div>
  );
}
