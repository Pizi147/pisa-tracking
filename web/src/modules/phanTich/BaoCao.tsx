import { useEffect, type ReactNode } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useApi } from '../../lib/useApi.ts';
import { Card, ErrorState, Skeleton } from '../../ui/ui.tsx';
import { OSo } from '../../ui/OSo.tsx';
import { Bang, type CotBang } from '../../ui/Bang.tsx';
import { NutLuat } from '../../ui/NutLuat.tsx';
import { useDienThoai } from '../../ui/TheDong.tsx';
import { ChiSo, DaiChiSo, PhanTram, TheoChiNhanh, kyChu, ptChu, tuMau, type TongQuanV5Data } from '../worklist/TongQuanV5.tsx';
import { thamSoLoc, type PhamViPhanTich } from './dungChung.tsx';
import { t } from '@shared/i18n/index.ts';
import {
  COT_KQ_MT, NHAN_COT_KQ_MT, NHAN_LUOT_KQ_MT, rateView, tenMonNgan,
  type BaoCaoKq, type DongKqMt, type KetQuaMtKq,
} from '@shared/domain/index.ts';

/**
 * BÁO CÁO HV (UI-PHAN-TICH, `thiet-ke/v5/phan-tich.html` tab "Báo cáo HV"; `10` mục 5) — KHÔNG đếm lại: 4 chỉ số + Theo chi nhánh = CHÍNH `/tong-quan/v5`
 * (cùng hàm Tổng quan, gửi kỳ đang chọn); Kết quả MT = `/phan-tich/bao-cao/ket-qua-mt` (SV-SO3, `tapKqMt`); Tiến bộ theo kỹ năng, Case / PA, chấm đúng hạn
 * = `/phan-tich/bao-cao`. Mọi số gạch chân mở panel CHỈ ĐỌC đúng tập (C22). QT chưa chọn chi nhánh: Theo chi nhánh (bấm hàng → mức chi nhánh).
 * "In" (V4) giữ: giấy sáng, A4 ngang.
 */
const COT_KQ: readonly CotBang[] = [
  { key: 'luot', nhan: t('Lượt'), kieu: 'ten' },
  ...COT_KQ_MT.map((c): CotBang => ({ key: c, nhan: NHAN_COT_KQ_MT[c], kieu: 'so', rong: c === 'thieu-1.5' ? 96 : 84 })),
  { key: 'truoc', nhan: t('So lượt trước'), kieu: 'chu', rong: 150 },
];
const COT_TB: readonly CotBang[] = [
  { key: 'kn', nhan: t('Kỹ năng'), kieu: 'ten' }, { key: 'tang', nhan: t('Tăng'), kieu: 'phan-tram', rong: 120 }, { key: 'ngoai', nhan: t('Ngoài mẫu'), kieu: 'so', rong: 96 },
];

function Khoi({ tieuDe, phu, luat, children }: { tieuDe: string; phu?: ReactNode; luat?: ReactNode; children: ReactNode }) {
  return (
    <Card bodyClass="p-0" title={<span className="inline-flex flex-wrap items-center gap-x-2">{tieuDe}{phu && <span className="text-xs font-normal text-slate-500">{phu}</span>}{luat && <NutLuat label={tieuDe}>{luat}</NutLuat>}</span>}>
      {children}
    </Card>
  );
}
const pt = (n: number, mau: number) => (mau ? `${Math.round((100 * n) / mau)} %` : null);

export function BaoCao(pv: PhamViPhanTich) {
  const [params, setParams] = useSearchParams();
  const ct = pv.ct ?? 'ft';
  const ft = ct === 'ft';
  const q = thamSoLoc({ ...pv, ct, classId: null });
  const tq = useApi<TongQuanV5Data>(`/tong-quan/v5?${q}`, [q]);
  const bc = useApi<BaoCaoKq>(`/phan-tich/bao-cao?${q}`, [q]);
  const motCn = !!tq.data && !tq.data.chiNhanh;
  const kq = useApi<KetQuaMtKq>(ft && motCn ? `/phan-tich/bao-cao/ket-qua-mt?${q}` : null, [q, motCn]);

  /* In / chiếu: nền sáng (kể cả khi đang chế độ tối) — đổi giao diện lúc in rồi trả lại. */
  useEffect(() => {
    let cu: string | undefined;
    const truoc = () => { cu = document.documentElement.dataset.theme; document.documentElement.dataset.theme = 'light'; };
    const sau = () => { if (cu === undefined) delete document.documentElement.dataset.theme; else document.documentElement.dataset.theme = cu; };
    window.addEventListener('beforeprint', truoc);
    window.addEventListener('afterprint', sau);
    return () => { window.removeEventListener('beforeprint', truoc); window.removeEventListener('afterprint', sau); };
  }, []);

  const loi = tq.error ?? bc.error;
  if (loi) return <ErrorState message={loi.message} hint={loi.hint} onRetry={() => { tq.reload(); bc.reload(); }} />;
  if (!tq.data || !bc.data) return <Skeleton rows={8} />;
  const d = tq.data, b = bc.data;
  const ky = kyChu(d.ky);
  const nguon = (o: string) => `/phan-tich/bao-cao/o?${q}&o=${encodeURIComponent(o)}`;
  const chonCn = (id: number) => { const n = new URLSearchParams(params); n.set('cn', String(id)); setParams(n); };

  return (
    <div className="bao-cao space-y-4">
      <style>{'@media print { @page { size: A4 landscape; margin: 10mm; } .bao-cao .card { box-shadow: none; } }'}</style>
      <DaiChiSo>
        <ChiSo ten={t('Đạt MT')} ky={ky} luat={t('HV có lượt MT chốt trong kỳ, Overall so với kỳ vọng của lượt. Ngoài mẫu: HV chưa đủ dữ liệu.')}
          giaTri={ft ? <PhanTram x={d.datMt} nguon={nguon('dat-mt')} tieuDe={t('Đạt MT')} /> : <span className="text-slate-500">—</span>}
          mau={ft ? <>{tuMau(d.datMt, t('HV đủ dữ liệu'))}{d.datMt?.chuaDu ? <> · <OSo giaTri={d.datMt.chuaDu} tieuDe={t('Chưa đủ dữ liệu')} nguon={nguon('dat-mt-chua-du')} /> {t('ngoài mẫu')}</> : null}</> : t('chỉ Fast Track')} />
        <ChiSo ten={t('Case có PA')} ky={t('hiện tại')}
          giaTri={<PhanTram x={{ dat: d.casePa.coPa, mau: d.casePa.mo }} nguon={`/tong-quan/chi-nhanh/o?cot=caseMo&khoa=tong&chuY=1&${q}`} tieuDe={t('Case đang mở')} />}
          mau={d.casePa.mo ? t('{a}/{b} Case cần PA', { a: d.casePa.coPa, b: d.casePa.mo }) : null} />
        <ChiSo ten={t('Đạt Target thi thật')} ky={ky} giaTri={ft ? ptChu(d.thiThat) : <span className="text-slate-500">—</span>}
          mau={ft ? (d.thiThat?.mau ? tuMau(d.thiThat, t('HV có KQ')) : t('0 HV có KQ thi thật — không tính trượt')) : t('chỉ Fast Track')} />
        <ChiSo ten={t('Thi tháng này')} ky={t('hiện tại')} giaTri={<OSo giaTri={d.thiThangNay} tieuDe={t('Thi tháng này')} nguon={nguon('thi-thang-nay')} />} mau={t('HV có ngày thi đã chốt')} />
      </DaiChiSo>

      {d.chiNhanh ? <TheoChiNhanh d={d} onChiNhanh={chonCn} /> : (
        <div className="grid items-start gap-4 min-[1100px]:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)] print:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)]">
          {ft ? <KetQuaMt api={kq} nguon={nguon} phamVi={`FT ${d.tenChiNhanh ?? ''}`.trim()} /> : null}
          <div className={`flex min-w-0 flex-col gap-4 ${ft ? '' : 'min-[1100px]:col-span-2'}`}>
            {ft && b.tienBo && <TienBo hang={b.tienBo} nguon={nguon} />}
            <Khoi tieuDe={t('Hỗ trợ · Case / PA')}>
              <div className="grid grid-cols-3 gap-3 px-4 py-3">
                <OHoTro ten={t('Case có PA')} so={<OSo giaTri={d.casePa.mo} nhan={`${d.casePa.coPa}/${d.casePa.mo}`} tieuDe={t('Case đang mở')} nguon={`/tong-quan/chi-nhanh/o?cot=caseMo&khoa=tong&chuY=1&${q}`} />}
                  phu={d.casePa.mo ? `Case · ${pt(d.casePa.coPa, d.casePa.mo)}` : t('Chưa có dữ liệu')} />
                <OHoTro ten={t('PA có kết quả')} so={<OSo id="pa-co-ket-qua" giaTri={b.casePa.paKetQua} phamVi={{ branchId: pv.branchId, chuongTrinh: ct }} extra={{ from: pv.khoang.tu, to: pv.khoang.den }} ten={t('PA có kết quả trong kỳ')} />}
                  phu={t('PA · trong kỳ')} />
                <OHoTro ten={t('PA cải thiện')} so={b.casePa.paKetQua
                  ? <OSo id="pa-co-ket-qua" giaTri={b.casePa.paKetQua} nhan={`${b.casePa.paCaiThien}/${b.casePa.paKetQua}`} phamVi={{ branchId: pv.branchId, chuongTrinh: ct }} extra={{ from: pv.khoang.tu, to: pv.khoang.den }} ten={t('PA có kết quả trong kỳ')} />
                  : <span className="text-slate-500">—</span>}
                  phu={b.casePa.paKetQua ? `PA · ${pt(b.casePa.paCaiThien, b.casePa.paKetQua)}` : t('Chưa có dữ liệu')} />
              </div>
            </Khoi>
            <p className="m-0 text-xs text-slate-400">
              {t('Chấm đúng hạn trong kỳ')}{' '}
              <OSo giaTri={b.test.baiTong} nhan={`${b.test.baiDaCham}/${b.test.baiTong} ${t('bài')}`} tieuDe={t('Bài đã chấm')} nguon={nguon('bai-da-cham')} />
              {b.test.quaHan > 0 && <> · <span className="font-semibold text-late">⚠ <OSo giaTri={b.test.quaHan} tieuDe={t('Bài quá hạn')} nguon={nguon('bai-qua-han')} /> {t('quá hạn')}</span></>}
              {' — '}{t('chi tiết theo GV ở tab Phân tích GV.')}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function OHoTro({ ten, so, phu }: { ten: string; so: ReactNode; phu: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col">
      <span className="text-xs text-slate-400">{ten}</span>
      <span className="text-[22px] font-bold leading-tight tabular-nums text-slate-100">{so}</span>
      <span className="text-xs text-slate-500">{phu}</span>
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
        <span className="whitespace-nowrap tabular-nums">
          <span className="text-ok">↑ {s.tang}</span> · <span className="text-slate-300">= {s.bang}</span> · <span className="text-bad">↓ {s.giam}</span>
        </span>
      );
    }
    if (!h.hv || (c.key !== 'chua-du' && !h.mau)) return <span className="text-slate-500" title={t('Chưa có dữ liệu')}>—</span>;
    const n = h.dem[c.key as keyof DongKqMt['dem']];
    return <OSo giaTri={n} tieuDe={`${NHAN_LUOT_KQ_MT[h.luot]} · ${c.nhan}`} nguon={nguon(`kq-mt:${h.luot}:${c.key}`)} />;
  };
  const phuCua = (h: DongKqMt, c: CotBang) => (c.key === 'luot' ? (h.luot === 'thi' ? t('{n} HV có KQ', { n: h.hv }) : t('{n} HV', { n: h.hv }))
    : c.key === 'truoc' ? null : c.key === 'chua-du' ? null : pt(h.dem[c.key as keyof DongKqMt['dem']], h.mau));
  return (
    <Khoi tieuDe={t('Kết quả MT')} phu={t('{pv} · lượt của từng HV trong kỳ', { pv: phamVi })} luat={luat}>
      {api.error ? <ErrorState message={api.error.message} hint={api.error.hint} onRetry={api.reload} />
        : !api.data ? <Skeleton rows={5} className="p-4" />
          : <Bang ten={t('Kết quả MT')} cot={COT_KQ} hang={dienThoai ? api.data.rows.filter((h) => h.hv || h.luot === 'thi') : api.data.rows} khoa={(h) => h.luot} oCua={oCua} phuCua={phuCua} khung={false} />}
    </Khoi>
  );
}

/** Tiến bộ theo kỹ năng: mục "HV tiến bộ" của Phân tích GV gom theo kỹ năng (band cao hơn mốc MT trước); chưa có mốc trước → ngoài mẫu. */
function TienBo({ hang, nguon }: { hang: NonNullable<BaoCaoKq['tienBo']>; nguon: (o: string) => string }) {
  type H = (typeof hang)[number];
  const oCua = (h: H, c: CotBang): ReactNode => {
    if (c.key === 'kn') return <span className="inline-block min-w-[28px] rounded border px-1.5 text-center text-xs font-bold text-slate-200" style={{ borderColor: 'var(--line-strong)' }}>{tenMonNgan(null, h.skill)}</span>;
    if (c.key === 'ngoai') return <span className="tabular-nums text-slate-400">{h.ngoai}</span>;
    const v = rateView(h.dung, h.tong);
    if (v.kind !== 'value') return <span className="text-slate-500" title={t('Chưa có dữ liệu')}>—</span>;
    return <OSo giaTri={h.tong} nhan={`${v.percent} %`} tieuDe={t('Tiến bộ {kn}', { kn: tenMonNgan(null, h.skill) })} nguon={nguon(`tien-bo:${h.skill}`)} />;
  };
  return (
    <Khoi tieuDe={t('Tiến bộ theo kỹ năng')} phu={t('lượt có mốc MT trước')}>
      <Bang ten={t('Tiến bộ theo kỹ năng')} cot={COT_TB} hang={hang} khoa={(h) => h.skill} oCua={oCua} the375={false}
        phuCua={(h, c) => (c.key === 'tang' && h.tong ? `${h.dung}/${h.tong}` : null)} khung={false} rong={{ tieuDe: t('Chưa có lượt nào có mốc MT trước trong kỳ') }} />
    </Khoi>
  );
}
