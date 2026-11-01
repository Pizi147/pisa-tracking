import type { ReactNode } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useApi } from '../../lib/useApi.ts';
import { ErrorState, Skeleton } from '../../ui/ui.tsx';
import { OSo } from '../../ui/OSo.tsx';
import { Bang, type CotBang } from '../../ui/Bang.tsx';
import { NutLuat } from '../../ui/NutLuat.tsx';
import { useDienThoai } from '../../ui/TheDong.tsx';
import { PhanTram, TheoChiNhanh, ptChu, tuMau, type TongQuanV5Data } from '../worklist/TongQuanV5.tsx';
import { DaiChiSo, DauThe, NutXemToanBo, thamSoLoc, type PhamViPhanTich } from './dungChung.tsx';
import { t } from '@shared/i18n/index.ts';
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
  { key: 'truoc', nhan: t('So lượt trước'), kieu: 'chu', rong: 160 },
];
const COT_TB: readonly CotBang[] = [
  { key: 'kn', nhan: t('Kỹ năng'), kieu: 'ten', rong: 64 },
  { key: 'tang', nhan: t('Tăng'), kieu: 'so', rong: 80 }, { key: 'giu', nhan: t('Giữ nguyên'), kieu: 'so', rong: 92 }, { key: 'giam', nhan: t('Giảm'), kieu: 'so', rong: 80 },
];
const pt = (n: number, mau: number) => (mau ? `${Math.round((100 * n) / mau)} %` : null);

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
  /* RA-UI-5: khoảng tuần đã ghi ở bộ lọc ngay trên — ô chỉ số ghi "trong kỳ" như Tổng quan, không lặp "W1 SEP – W2 SEP" ở 4 ô. */
  const ky = pv.khoang.kieu === 'toan-bo' ? t('Toàn bộ') : t('trong kỳ');
  const nguon = (o: string) => `/phan-tich/bao-cao/o?${q}&o=${encodeURIComponent(o)}`;
  const nguonCase = `/tong-quan/chi-nhanh/o?cot=caseMo&khoa=tong&chuY=1&${q}`;
  const chonCn = (id: number) => { const n = new URLSearchParams(params); n.set('cn', String(id)); setParams(n); };
  const chiFt = <span className="text-slate-500">—</span>;
  const pa = { dat: b.casePa.paCaiThien, mau: b.casePa.paKetQua };

  return (
    <div className="bao-cao space-y-3">
      <style>{'@media print { @page { size: A4 landscape; margin: 10mm; } .bao-cao .card { box-shadow: none; } }'}</style>
      {/* V8-PT (mockup B1): dải thẻ chỉ số chung — "tên · trong kỳ", không lặp khoảng tuần (đã ở hàng lọc); ⓘ luật giữ, đứng sau "trong kỳ". */}
      <div data-hd="tq-tom-tat">
        <DaiChiSo ds={[
          { ten: t('Đạt MT'), ky: <>{ky} <NutLuat label={t('Đạt MT')}>{t('HV có lượt MT chốt trong kỳ, Overall so với kỳ vọng của lượt. HV chưa đủ điểm không tính.')}</NutLuat></>,
            gt: ft ? <PhanTram x={d.datMt} nguon={nguon('dat-mt')} tieuDe={t('Đạt MT')} /> : chiFt, mau: ft ? tuMau(d.datMt, t('HV')) : t('chỉ Fast Track') },
          { ten: t('Đạt Target thi thật'), ky, gt: ft ? ptChu(d.thiThat) : chiFt,
            mau: ft ? (d.thiThat?.mau ? tuMau(d.thiThat, t('HV có KQ')) : t('chưa HV nào có KQ')) : t('chỉ Fast Track') },
          { ten: t('Thi trong kỳ'), gt: <OSo giaTri={d.thiThangNay} tieuDe={t('Thi trong kỳ')} nguon={nguon('thi-dot-nay')} />, mau: t('HV có ngày thi') },
          { ten: t('Case có PA'), ky: t('hiện tại'), gt: <PhanTram x={{ dat: d.casePa.coPa, mau: d.casePa.mo }} nguon={nguonCase} tieuDe={t('Case đang mở')} />,
            mau: d.casePa.mo ? `${d.casePa.coPa}/${d.casePa.mo} Case` : null },
          { ten: t('PA cải thiện'), ky: <>{ky} <NutLuat label={t('PA cải thiện')}>{t('PA có kết quả trong kỳ mà GV đánh giá cải thiện (gồm một phần).')}</NutLuat></>,
            gt: <PhanTram x={pa} nguon={nguon('pa-co-ket-qua')} tieuDe={t('PA có kết quả trong kỳ')} />, mau: tuMau(pa, t('PA có kết quả')), rong2: true },
        ]} />
      </div>

      {d.chiNhanh ? <TheoChiNhanh d={d} baoCao onChiNhanh={chonCn} /> : ft && (
        <div className="grid items-stretch gap-3 min-[1100px]:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] print:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
          <KetQuaMt api={kq} nguon={nguon} phamVi={`FT ${d.tenChiNhanh ?? ''}`.trim()} />
          {b.tienBo && <TienBo hang={b.tienBo} nguon={nguon} />}
        </div>
      )}
    </div>
  );
}

/** Kết quả MT (`10` mục 5): hàng MT0 → MT3+ + Thi thật, theo lượt của từng HV trong kỳ; Overall so Target đầu ra của em. Số bấm → panel em của ô. */
function KetQuaMt({ api, nguon, phamVi }: { api: { data: KetQuaMtKq | null; error: any; reload: () => void }; nguon: (o: string) => string; phamVi: string }) {
  const dienThoai = useDienThoai();
  const luat = t('So điểm Overall của lượt với Target đầu ra của chính em (không phải kỳ vọng MT). Mỗi HV tính ở lượt MT của mình trong kỳ. Bấm số để xem danh sách HV.');
  const oCua = (h: DongKqMt, c: CotBang): ReactNode => {
    if (c.key === 'luot') return <b className="text-slate-100">{NHAN_LUOT_KQ_MT[h.luot]}</b>;
    if (c.key === 'truoc') {
      const s = h.soTruoc;
      if (!s.tang && !s.bang && !s.giam) return <span className="text-slate-500">—</span>;
      return (
        <span className="whitespace-nowrap tabular-nums" aria-label={t('Tăng {a} · giữ {b} · giảm {c}', { a: s.tang, b: s.bang, c: s.giam })}>
          <span className="text-ok">↑ {s.tang}</span> · <span className="text-slate-300">= {s.bang}</span> · <span className="text-bad">↓ {s.giam}</span>
        </span>
      );
    }
    if (!h.hv || (c.key !== 'chua-du' && !h.mau)) return <span className="text-slate-500" title={t('Chưa có dữ liệu')}>—</span>;
    const n = h.dem[c.key as keyof DongKqMt['dem']];
    return <OSo giaTri={n} tieuDe={`${NHAN_LUOT_KQ_MT[h.luot]} · ${c.nhan}`} nguon={nguon(`kq-mt:${h.luot}:${c.key}`)} />;
  };
  const phuCua = (h: DongKqMt, c: CotBang) => (c.key === 'luot' ? (h.luot === 'thi' ? t('{n} HV có KQ', { n: h.hv }) : t('{n} HV', { n: h.hv }))
    : c.key === 'truoc' || c.key === 'chua-du' ? null : pt(h.dem[c.key as keyof DongKqMt['dem']], h.mau));
  return (
    /* V8-PT: "FT · chi nhánh" trùng hàng lọc / đầu trang → chỉ hiện khi in (hàng lọc ẩn trên giấy). */
    <Khoi tieuDe={t('Kết quả MT')} luat={luat} phu={<><span className="hidden print:inline">{phamVi} · </span>{t('lượt của từng HV trong kỳ')}</>}>
      {api.error ? <ErrorState message={api.error.message} hint={api.error.hint} status={api.error.status} onRetry={api.reload} />
        : !api.data ? <Skeleton rows={5} className="p-4" />
          : <Bang ten={t('Kết quả MT')} cot={COT_KQ} hang={!api.data.rows.some((h) => h.hv) ? [] : dienThoai ? api.data.rows.filter((h) => h.hv || h.luot === 'thi') : api.data.rows} khoa={(h) => h.luot} oCua={oCua} phuCua={phuCua} khung={false} deu
              rong={{ tieuDe: t('Chưa có lượt MT nào trong kỳ'), nut: <NutXemToanBo /> }} />}
    </Khoi>
  );
}

/** Tiến bộ theo kỹ năng: lượt có mốc MT trước của em, band kỹ năng tăng · giữ nguyên · giảm so mốc đó (cùng mục "HV tiến bộ" của Phân tích GV). */
function TienBo({ hang, nguon }: { hang: NonNullable<BaoCaoKq['tienBo']>; nguon: (o: string) => string }) {
  type H = (typeof hang)[number];
  const so = (h: H, k: string) => (k === 'tang' ? h.tang : k === 'giam' ? h.giam : h.tong - h.tang - h.giam);
  const oCua = (h: H, c: CotBang): ReactNode => {
    if (c.key === 'kn') return <span className="inline-block min-w-[32px] rounded border px-1.5 text-center text-xs font-bold text-slate-200" style={{ borderColor: 'var(--line-strong)' }}>{tenMonNgan(null, h.skill)}</span>;
    if (rateView(so(h, c.key), h.tong).kind !== 'value') return <span className="text-slate-500" title={t('Chưa có dữ liệu')}>—</span>;
    return <OSo giaTri={so(h, c.key)} nhan={String(so(h, c.key))} tieuDe={t('Tiến bộ {kn}', { kn: tenMonNgan(null, h.skill) })} nguon={nguon(`tien-bo:${h.skill}`)} vung={c.key}
      className={c.key === 'tang' ? 'text-ok' : c.key === 'giam' ? 'text-bad' : ''} />;
  };
  return (
    <Khoi tieuDe={t('Tiến bộ theo kỹ năng')} phu={t('so mốc MT trước')}>
      <Bang ten={t('Tiến bộ theo kỹ năng')} cot={COT_TB} hang={hang} khoa={(h) => h.skill} oCua={oCua} the375={false} deu
        phuCua={(h, c) => (c.key === 'kn' ? t('{n} lượt', { n: h.tong }) : h.tong ? pt(so(h, c.key), h.tong) : null)} khung={false}
        rong={{ tieuDe: t('Chưa có lượt nào có mốc MT trước trong kỳ'), nut: <NutXemToanBo /> }} />
    </Khoi>
  );
}
