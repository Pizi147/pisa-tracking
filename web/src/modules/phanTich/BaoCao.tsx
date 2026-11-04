import type { ReactNode } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useApi } from '../../lib/useApi.ts';
import { ErrorState, Skeleton } from '../../ui/ui.tsx';
import { OSo } from '../../ui/OSo.tsx';
import { Bang, type CotBang } from '../../ui/Bang.tsx';
import { NutLuat } from '../../ui/NutLuat.tsx';
import { PhanTram, TheoChiNhanh, mauDatMt, tuMau, type TongQuanV5Data } from '../worklist/TongQuanV5.tsx';
import { DaiChiSo, DauThe, NutXemToanBo, RongDau, thamSoLoc, type PhamViPhanTich } from './dungChung.tsx';
import { t } from '@shared/i18n/index.ts';
import { tuanLich } from '@shared/domain/index.ts';
import {
  COT_KQ_MT, NHAN_COT_KQ_MT, NHAN_LUOT_KQ_MT, rateView, tenMonNgan,
  type BaoCaoKq, type DongKqMt, type KetQuaMtKq,
} from '@shared/domain/index.ts';

/**
 * BÁO CÁO HV (UI-PHAN-TICH, `thiet-ke/v5/phan-tich.html`; `10` mục 5; chủ SP 23/10 vòng 2 — sắp lại cả trang) — chỉ kết quả + hỗ trợ của HỌC VIÊN (việc GV ở tab
 * Phân tích GV). KHÔNG đếm lại: dải số + Theo chi nhánh = CHÍNH `/tong-quan/v5` (cùng hàm Tổng quan, gửi kỳ đang chọn); Kết quả MT = `tapKqMt` (SV-SO3);
 * Tiến bộ theo kỹ năng + PA cải thiện = `/phan-tich/bao-cao` (kèm trong cùng GET `/tong-quan/v5?…&kemBaoCao=1`). Mọi số gạch chân mở panel CHỈ ĐỌC đúng tập (C22). "Thi đợt này" = ngày thi trong kỳ đang chọn.
 * Bố cục: một dải 5 số → hai bảng cạnh nhau cùng chiều cao (Kết quả MT · Tiến bộ theo kỹ năng); QT chưa chọn chi nhánh → Theo chi nhánh. "In" (V4) giữ.
 */
const COT_KQ: readonly CotBang[] = [
  { key: 'luot', nhan: t('Lượt'), kieu: 'ten', rong: 120 },
  ...COT_KQ_MT.map((c): CotBang => ({ key: c, nhan: NHAN_COT_KQ_MT[c], kieu: 'so', rong: 100 })),
  { key: 'truoc', nhan: t('So lượt trước · HV'), kieu: 'chu', rong: 160 },
];
const COT_TB: readonly CotBang[] = [
  { key: 'kn', nhan: t('Kỹ năng'), kieu: 'ten', rong: 64 },
  { key: 'tang', nhan: `↑ ${t('Tăng')}`, kieu: 'so', rong: 80 }, { key: 'giu', nhan: t('Giữ nguyên'), kieu: 'so', rong: 92 }, { key: 'giam', nhan: `↓ ${t('Giảm')}`, kieu: 'so', rong: 80 },
];
const pt = (n: number, mau: number) => (mau ? `${Math.round((100 * n) / mau)} %` : null);
/** U08-1 (mockup V11 `.m-dat / .m-05 / .m-10 / .m-15 / .m-cd`): màu số theo mức — tiêu đề cột vẫn ghi chữ; số 0 mờ (OSo tự xám). */
const MAU_KQ_MT: Record<string, string> = { dat: 'text-ok', 'thieu-0.5': 'text-soon', 'thieu-1.0': 'text-kq-thieu10', 'thieu-1.5': 'text-bad', 'chua-du': 'text-dim' };
/** Nhãn nhóm của dải chỉ số (mockup V11 B1): "Trong kỳ W1 SEP – W2 SEP" │ "Hiện tại". */
const NHOM = 'text-[13px] font-bold text-dim';

/** V8-PT: thẻ bảng (`.the`) — đầu thẻ `DauThe` (tên 15 / 700 · phụ 13 · ⓘ Cách tính bên phải). */
function Khoi({ tieuDe, phu, luat, children }: { tieuDe: string; phu?: ReactNode; luat?: ReactNode; children: ReactNode }) {
  return (
    <section className="card h-full overflow-clip">
      <DauThe ten={tieuDe} phu={phu} cachTinh={luat} />
      {children}
    </section>
  );
}

export function BaoCao(pv: PhamViPhanTich) {
  const [params, setParams] = useSearchParams();
  const ct = pv.ct ?? 'ft';
  const ft = ct === 'ft';
  const q = thamSoLoc({ ...pv, ct, classId: null });
  /* QUET-THEO-KY Q3: MỘT GET — Tổng quan + `baoCao` (= `/phan-tich/bao-cao`, cùng hàm) dưới `/tong-quan` để mọi `invalidate('/tong-quan')` vẫn trúng. */
  const tq = useApi<TongQuanV5Data & { baoCao: BaoCaoKq }>(`/tong-quan/v5?${q}&kemBaoCao=1`, [q]);
  const motCn = !!tq.data && !tq.data.chiNhanh;
  const kq = useApi<KetQuaMtKq>(ft && motCn ? `/phan-tich/bao-cao/ket-qua-mt?${q}` : null, [q, motCn]);

  if (tq.error) return <ErrorState message={tq.error.message} hint={tq.error.hint} status={tq.error.status} onRetry={tq.reload} />;
  if (!tq.data) return <Skeleton rows={8} />;
  const d = tq.data, b = tq.data.baoCao;
  /* U08 #1 (mockup V11 B1): hai nhóm có nhãn — "Trong kỳ …" (Đạt MT · Đạt Target thi thật · Thi trong kỳ · PA cải thiện) │ "Hiện tại" (Case có PA);
     bỏ chữ "· trong kỳ" / "· hiện tại" lặp ở từng ô. */
  const [tuK, denK] = [tuanLich(pv.khoang.tu), tuanLich(pv.khoang.den)];
  /* PT-GON (M3): khoảng tuần đã ở hàng lọc → màn chỉ ghi "Trong kỳ"; bản in (hàng lọc ẩn) vẫn ghi đủ khoảng. */
  const nhanKy = pv.khoang.kieu === 'toan-bo' ? t('Toàn bộ')
    : <><span className="print:hidden">{t('Trong kỳ')}</span><span className="hidden print:inline">{t('Trong kỳ {ky}', { ky: tuK === denK ? tuK : `${tuK} – ${denK}` })}</span></>;
  const nguon = (o: string) => `/phan-tich/bao-cao/o?${q}&o=${encodeURIComponent(o)}`;
  const nguonCase = `/tong-quan/chi-nhanh/o?cot=caseMo&khoa=tong&chuY=1&${q}`;
  const chonCn = (id: number) => { const n = new URLSearchParams(params); n.set('cn', String(id)); setParams(n); };
  const chiFt = <span className="text-slate-500">—</span>;
  const pa = { dat: b.casePa.paCaiThien, mau: b.casePa.paKetQua };

  return (
    <div className="bao-cao space-y-3">
      {/* U08 (mockup V11 `.bang td` 6px 10px · line-height 1.35): hàng hai bảng gọn như mockup. */}
      <style>{'@media print { @page { size: A4 landscape; margin: 10mm; } .bao-cao .card { box-shadow: none; } } .bao-cao .bang > tbody > tr > td, .bao-cao .bang > tbody > tr:has([data-phu-odiem]:not(:empty)) > td { height: 52px; padding: 6px 10px; line-height: 1.35; }'}</style>
      <div data-hd="tq-tom-tat" className="grid gap-3 min-[1100px]:grid-cols-[minmax(0,4fr)_minmax(0,1fr)] print:grid-cols-[minmax(0,4fr)_minmax(0,1fr)]">
        <div className="grid content-start gap-1.5">
          <span className={NHOM}>{nhanKy}</span>
          <DaiChiSo ds={[
            { ten: <>{t('Đạt MT')} <NutLuat label={t('Đạt MT')}>{t('HV có lượt MT chốt trong kỳ, Overall so với kỳ vọng của lượt. HV chưa đủ điểm không tính.')}</NutLuat></>,
              gt: ft ? <PhanTram x={d.datMt} nguon={nguon('dat-mt')} tieuDe={t('Đạt MT')} /> : chiFt, mau: ft ? mauDatMt(d.datMt) : t('chỉ Fast Track') },
            { ten: t('Đạt Target thi thật'),
              gt: !ft ? chiFt : d.thiThat?.mau ? <span className="tabular-nums">{Math.round((100 * d.thiThat.dat) / d.thiThat.mau)} %</span>
                : chiFt,   // PT-GON (M3): "chưa HV nào có KQ" ở dòng dưới đã nói
              mau: ft ? (d.thiThat?.mau ? tuMau(d.thiThat, t('HV có KQ')) : t('chưa HV nào có KQ')) : t('chỉ Fast Track') },
            { ten: t('Thi trong kỳ'), gt: <OSo giaTri={d.thiThangNay} tieuDe={t('Thi trong kỳ')} nguon={nguon('thi-dot-nay')} />, mau: t('HV có ngày thi') },
            { ten: <>{t('PA cải thiện')} <NutLuat label={t('PA cải thiện')}>{t('PA có kết quả trong kỳ mà GV đánh giá cải thiện (gồm một phần).')}</NutLuat></>,
              gt: <PhanTram x={pa} nguon={nguon('pa-co-ket-qua')} tieuDe={t('PA có kết quả trong kỳ')} />, mau: tuMau(pa, t('PA có kết quả')) },
          ]} />
        </div>
        <div className="grid content-start gap-1.5">
          <span className={NHOM}>{t('Hiện tại')}</span>
          <DaiChiSo ds={[
            { ten: t('Case có PA'), gt: <PhanTram x={{ dat: d.casePa.coPa, mau: d.casePa.mo }} nguon={nguonCase} tieuDe={t('Case đang mở')} />,
              mau: d.casePa.mo ? `${d.casePa.coPa}/${d.casePa.mo} Case` : null, rong2: true },
          ]} />
        </div>
      </div>

      {d.chiNhanh ? <TheoChiNhanh d={d} baoCao onChiNhanh={chonCn} /> : ft && (
        <div className="grid items-stretch gap-3 min-[1100px]:grid-cols-[minmax(0,1.75fr)_minmax(0,1fr)] print:grid-cols-[minmax(0,1.75fr)_minmax(0,1fr)]">
          <KetQuaMt api={kq} nguon={nguon} phamVi={`FT ${d.tenChiNhanh ?? ''}`.trim()} />
          {b.tienBo && <TienBo hang={b.tienBo} nguon={nguon} />}
        </div>
      )}
    </div>
  );
}

/** Kết quả MT (`10` mục 5): hàng MT0 → MT3+ + Thi thật, theo lượt của từng HV trong kỳ; Overall so Target đầu ra của em. Số bấm → panel em của ô. */
function KetQuaMt({ api, nguon, phamVi }: { api: { data: KetQuaMtKq | null; error: any; reload: () => void }; nguon: (o: string) => string; phamVi: string }) {
  const luat = t('So điểm Overall của lượt với Target đầu ra của chính em (không phải kỳ vọng MT). Mỗi HV tính ở lượt MT của mình trong kỳ. Bấm số để xem danh sách HV.');
  const oCua = (h: DongKqMt, c: CotBang): ReactNode => {
    if (c.key === 'luot') return <b className="text-slate-100">{NHAN_LUOT_KQ_MT[h.luot]}</b>;
    if (c.key === 'truoc') {
      const s = h.soTruoc;
      if (!s.tang && !s.bang && !s.giam) return <span className="text-slate-500">—</span>;
      return (
        <span className="whitespace-nowrap tabular-nums" aria-label={t('Tăng {a} · giữ {b} · giảm {c}', { a: s.tang, b: s.bang, c: s.giam })}>
          <span className={s.tang ? 'text-ok' : 'text-faint'}>↑ {s.tang}</span> · <span className="text-slate-300">= {s.bang}</span> · <span className={s.giam ? 'text-bad' : 'text-faint'}>↓ {s.giam}</span>
        </span>
      );
    }
    if (!h.hv || (c.key !== 'chua-du' && !h.mau)) return <span className="text-slate-500" title={t('Chưa có dữ liệu')}>—</span>;
    const n = h.dem[c.key as keyof DongKqMt['dem']];
    return <OSo giaTri={n} tieuDe={`${NHAN_LUOT_KQ_MT[h.luot]} · ${c.nhan}`} nguon={nguon(`kq-mt:${h.luot}:${c.key}`)} className={n ? MAU_KQ_MT[c.key] : ''} />;
  };
  /* B16 / B25: % tính trên HV đủ dữ liệu — ghi rõ ở dòng phụ của hàng ("8 HV · 3 đủ dữ liệu") và phụ đề thẻ. */
  const phuCua = (h: DongKqMt, c: CotBang) => (c.key === 'luot' ? (h.luot === 'thi' ? t('{n} HV có KQ', { n: h.hv }) : h.hv ? t('{n} HV · {m} đủ dữ liệu', { n: h.hv, m: h.mau }) : t('{n} HV', { n: h.hv }))
    : c.key === 'truoc' || c.key === 'chua-du' ? null : pt(h.dem[c.key as keyof DongKqMt['dem']], h.mau));
  return (
    /* V8-PT: "FT · chi nhánh" trùng hàng lọc / đầu trang → chỉ hiện khi in (hàng lọc ẩn trên giấy). */
    <Khoi tieuDe={t('Kết quả MT')} luat={luat} phu={<span className="hidden print:inline">{phamVi} · {t('lượt của từng HV trong kỳ · % trên HV đủ dữ liệu')}</span>}>   {/* PT-GON (M4): cách tính ở ⓘ + dòng "n HV · m đủ dữ liệu" của hàng; bản in giữ câu */}
      {api.error ? <ErrorState message={api.error.message} hint={api.error.hint} status={api.error.status} onRetry={api.reload} />
        : !api.data ? <Skeleton rows={5} className="p-4" />
          /* PT-GON (M7): rỗng → một câu ở đầu khung (không qua `Empty` căn giữa của `Bang`). */
          : !api.data.rows.some((h) => h.hv) ? <RongDau chu={t('Chưa có lượt MT nào trong kỳ')} nut={<NutXemToanBo />} />
          : <Bang ten={t('Kết quả MT')} cot={COT_KQ} hang={api.data.rows.filter((h) => h.hv || h.luot === 'thi')} khoa={(h) => h.luot} oCua={oCua} phuCua={phuCua} khung={false} deu />}
    </Khoi>
  );
}

/** Tiến bộ theo kỹ năng: lượt có mốc MT trước của em, band kỹ năng tăng · giữ nguyên · giảm so mốc đó (cùng mục "HV tiến bộ" của Phân tích GV). */
function TienBo({ hang, nguon }: { hang: NonNullable<BaoCaoKq['tienBo']>; nguon: (o: string) => string }) {
  type H = (typeof hang)[number];
  const so = (h: H, k: string) => (k === 'tang' ? h.tang : k === 'giam' ? h.giam : h.tong - h.tang - h.giam);
  const oCua = (h: H, c: CotBang): ReactNode => {
    if (c.key === 'kn') return <span className="whitespace-nowrap"><b className="text-slate-100">{tenMonNgan(null, h.skill)}</b> <span className="text-[13px] font-normal text-faint">{t('{n} lượt', { n: h.tong })}</span></span>;
    if (rateView(so(h, c.key), h.tong).kind !== 'value') return <span className="text-slate-500" title={t('Chưa có dữ liệu')}>—</span>;
    /* Ô mở đúng các lượt của ô (`:tang|giu|giam`) — số = dòng panel. */
    return <OSo giaTri={so(h, c.key)} nhan={String(so(h, c.key))} tieuDe={`${t('Tiến bộ {kn}', { kn: tenMonNgan(null, h.skill) })} · ${c.nhan}`} nguon={nguon(`tien-bo:${h.skill}:${c.key}`)}
      className={!so(h, c.key) ? '' : c.key === 'tang' ? 'text-ok' : c.key === 'giam' ? 'text-bad' : ''} />;
  };
  return (
    <Khoi tieuDe={t('Tiến bộ theo kỹ năng')} phu={t('so mốc MT trước')}>
      {!hang.length ? <RongDau chu={t('Chưa có lượt nào có mốc MT trước trong kỳ')} nut={<NutXemToanBo />} /> : (   /* PT-GON (M7) */
        <Bang ten={t('Tiến bộ theo kỹ năng')} cot={COT_TB} hang={hang} khoa={(h) => h.skill} oCua={oCua} the375={false} deu
          phuCua={(h, c) => (c.key === 'kn' ? null : h.tong ? pt(so(h, c.key), h.tong) : null)} khung={false} />
      )}
    </Khoi>
  );
}
