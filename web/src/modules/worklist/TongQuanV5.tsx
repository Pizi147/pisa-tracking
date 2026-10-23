import { useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useApi } from '../../lib/useApi.ts';
import { invalidate } from '../../lib/api.ts';
import { useSession } from '../../lib/session.tsx';
import { useThamSoUrl } from '../../lib/quayLai.ts';
import { Card, DaiChiXem, ErrorState, OChiSo, Skeleton } from '../../ui/ui.tsx';
import { OSo } from '../../ui/OSo.tsx';
import { Bang, type CotBang } from '../../ui/Bang.tsx';
import { CHIP_SOS, lopSos } from '../../ui/Nhan.tsx';
import { NutLuat } from '../../ui/NutLuat.tsx';
import { KhungPanel } from '../../ui/KhungPanel.tsx';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import { TheYeuCau } from '../duyet/TheYeuCau.tsx';
import { addDaysIso, mondayOfDate, rateView, thamSoCt, tuanLich, type ChuongTrinh, type PhanTichGvKq, type OPtGv, type TheYeuCauDto } from '@shared/domain/index.ts';
import { t } from '@shared/i18n/index.ts';

/**
 * TỔNG QUAN V5 (UI-TONG-QUAN, `thiet-ke/v5/tong-quan.html` phương án B "Tình hình trái · Đi tiếp phải"). Không ô nhập trên trang (C04): số gạch chân
 * = panel chỉ đọc (cùng hàm Phân tích), "›" = đổi trang, "?" = giải thích. Mỗi vai một hàm vẽ; dữ liệu QL / QT / CX từ MỘT GET `/tong-quan/v5`.
 */
type TyLeV5 = { dat: number; mau: number };
type DongLop = { id: number; khoa: string; ma: string; hv: number; gvcn: string | null; datMt: TyLeV5 | null; sos: [number, number, number]; caseChuaPa: number; thiThangNay: number };
type DongCn = { id: number; khoa: string; ten: string; datMt: TyLeV5 | null; casePa: { coPa: number; mo: number }; thiThat: TyLeV5 | null; thiThangNay: number; sos23: number; caseChuaPa: number };
type GvTre = { khoa: number; ten: string; bai: number };
export type TongQuanV5Data = {
  homNay: string; ky: { tu: string; den: string }; ct: ChuongTrinh; branchId: number | null; tenChiNhanh: string | null;
  datMt: (TyLeV5 & { chuaDu: number }) | null; casePa: { coPa: number; mo: number; chuaPa: number }; thiThangNay: number; thiThat: TyLeV5 | null;
  lop: DongLop[] | null; chiNhanh: DongCn[] | null; tre: GvTre[];
};

/** Tham số chung của mọi đường trên trang (chi nhánh + khung). */
export const thamSoTq = (branchId: number | null, ct: ChuongTrinh) => `${branchId ? `branchId=${branchId}` : ''}${thamSoCt(ct)}`.replace(/^&/, '');

/* ───────────── khung chung ───────────── */

/** Đầu trang một hàng: "Tổng quan" · phạm vi · mã tuần — bộ chọn (chi nhánh, khung) bên phải. */
export function DauTrangTq({ phamVi, ben }: { phamVi: ReactNode; ben?: ReactNode }) {
  const { homNay } = useNgayNghiepVu();
  return (
    <header className="flex min-h-10 flex-wrap items-center gap-x-3 gap-y-2">
      <h1 className="m-0 text-xl font-bold text-slate-100">{t('Tổng quan')}</h1>
      <span className="text-sm text-slate-400">{phamVi}{homNay && <> · <b className="font-bold text-[color:var(--accent)]">{tuanLich(homNay)}</b></>}</span>
      {ben && <span className="flex flex-wrap items-center gap-2 max-sm:w-full sm:ml-auto">{ben}</span>}
    </header>
  );
}

/** Ô chỉ số V5: tên (+ "?") · giá trị · mẫu số · kỳ xem. */
function ChiSo({ ten, giaTri, mau, ky, luat }: { ten: string; giaTri: ReactNode; mau?: ReactNode; ky?: string; luat?: ReactNode }) {
  return (
    <OChiSo ten={<span className="inline-flex items-center gap-1.5">{ten}{luat && <NutLuat label={ten}>{luat}</NutLuat>}</span>} giaTri={giaTri} mau={mau}>
      {ky && <div className="text-xs text-slate-500">{ky}</div>}
    </OChiSo>
  );
}
const DaiChiSo = ({ children }: { children: ReactNode }) => <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4">{children}</div>;

/** % to gạch chân bấm mở panel đúng tập; mẫu 0 → "Chưa có dữ liệu" (T19), không "0 %". */
function PhanTram({ x, nguon, tieuDe, gon }: { x: TyLeV5 | null; nguon: string; tieuDe: string; /** Ô bảng: mẫu 0 → "—" (chữ đầy đủ cho trình đọc màn). */ gon?: boolean }) {
  if (!x) return <span className="text-slate-500">—</span>;
  const v = rateView(x.dat, x.mau);
  if (v.kind !== 'value') return gon ? <span className="text-slate-500" title={t('Chưa có dữ liệu')} aria-label={t('Chưa có dữ liệu')}>—</span>
    : <span className="text-sm font-medium text-slate-500">– {t('Chưa có dữ liệu')}</span>;
  return <OSo giaTri={x.mau} nhan={`${v.percent} %`} nguon={nguon} tieuDe={tieuDe} />;
}
const tuMau = (x: TyLeV5 | null, donVi: string) => (x && x.mau ? `${x.dat}/${x.mau} ${donVi}` : null);

/** Bố cục B: trái (tình hình) · phải 360 (Chờ duyệt / Đi tiếp); < 1100 một cột, cột phải lên trước. */
function BoCuc({ trai, phai }: { trai: ReactNode; phai: ReactNode }) {
  return (
    <div className="grid items-start gap-4 min-[1100px]:grid-cols-[minmax(0,1fr)_360px]">
      <div className="flex min-w-0 flex-col gap-4 max-[1099px]:order-2">{trai}</div>
      <div className="flex min-w-0 flex-col gap-4">{phai}</div>
    </div>
  );
}

/** "Đi tiếp": mỗi dòng một link đổi trang (›) — số đậm ở đầu, dòng phụ nói đích. */
export function DiTiep({ dong, tieuDe = t('Đi tiếp') }: { dong: { to: string; t1: ReactNode; t2: ReactNode }[]; tieuDe?: string }) {
  return (
    <Card title={tieuDe} bodyClass="p-0">
      <ul className="m-0 list-none p-0">
        {dong.map((d, i) => (
          <li key={i} className="border-t first:border-t-0" style={{ borderColor: 'var(--line)' }}>
            <Link to={d.to} className="grid min-h-[44px] grid-cols-[minmax(0,1fr)_auto] gap-x-2 px-4 py-2.5 text-slate-100 no-underline hover:bg-white/5">
              <span className="text-sm font-medium">{d.t1}</span>
              <span aria-hidden className="row-span-2 self-center font-bold text-[color:var(--accent)]">›</span>
              <span className="text-xs text-slate-500">{d.t2}</span>
            </Link>
          </li>
        ))}
      </ul>
    </Card>
  );
}
const So = ({ n }: { n: number }) => <b className="tabular-nums">{n}</b>;

/** Công tắc hai nút ngoài tiêu đề bảng (đầu thẻ). */
function CongTac<K extends string>({ value, onChange, muc }: { value: K; onChange: (k: K) => void; muc: [K, string][] }) {
  return (
    <span role="group" aria-label={t('Lọc')} className="inline-flex overflow-hidden rounded-lg border" style={{ borderColor: 'var(--line-strong)' }}>
      {muc.map(([k, nhan]) => (
        <button key={k} type="button" aria-pressed={value === k} onClick={() => onChange(k)}
          className={`min-h-[44px] px-3 text-[13px] sm:min-h-[30px] ${value === k ? 'bg-[color:var(--accent-soft)] font-bold text-[color:var(--accent)]' : 'text-slate-400'}`}>{nhan}</button>
      ))}
    </span>
  );
}

const kyChu = (k: { tu: string; den: string }) => `${tuanLich(k.tu)} – ${tuanLich(k.den)}`;
const qBc = (d: TongQuanV5Data, them = '') => `/phan-tich/bao-cao/o?${thamSoTq(d.branchId, d.ct)}${them}`;
const qCn = (d: TongQuanV5Data, cot: string, khoa: string) => `/tong-quan/chi-nhanh/o?cot=${cot}&khoa=${khoa}&chuY=1&${thamSoTq(d.branchId, d.ct)}`;

/* ───────────── Chờ bạn duyệt (dòng gọn → panel duyệt, C04) ───────────── */

type Hop = { the: TheYeuCauDto[]; homNay: string };
function ChoDuyetGon({ hop, onXong }: { hop: Hop; onXong: () => void }) {
  const [mo, setMo] = useState<TheYeuCauDto | null>(null);
  if (!hop.the.length) return null;
  const cho = (y: TheYeuCauDto) => {
    if (y.hanDuyet && y.hanDuyet.slice(0, 10) < hop.homNay) return <span className="font-bold text-bad">⚠ {t('quá hạn')}</span>;
    const n = Math.round((Date.parse(hop.homNay) - Date.parse(y.taoLuc.slice(0, 10))) / 86_400_000);
    return n <= 0 ? t('hôm nay') : t('{n} ngày', { n });
  };
  return (
    <Card title={<>{t('Chờ bạn duyệt')} <span className="font-normal text-slate-500">· {hop.the.length}</span></>} bodyClass="p-0">
      <ul className="m-0 list-none p-0">
        {hop.the.slice(0, 5).map((y) => (
          <li key={y.id} className="border-t first:border-t-0" style={{ borderColor: 'var(--line)' }}>
            <button type="button" onClick={() => setMo(y)}
              className={`grid min-h-[44px] w-full grid-cols-[minmax(0,1fr)_auto] gap-x-2 px-4 py-2.5 text-left hover:bg-white/5 ${mo?.id === y.id ? 'dang-mo' : ''}`}>
              <span className="truncate text-sm font-semibold text-slate-100">{y.nhanLoai}{y.hocVien && ` · ${y.hocVien}`}</span>
              <span className="whitespace-nowrap text-xs text-slate-400">{cho(y)}</span>
              <span className="col-span-2 truncate text-xs text-slate-500">{[y.lop, y.phu, y.nguoiXin && t('gửi bởi {ten}', { ten: y.nguoiXin })].filter(Boolean).join(' · ')}</span>
            </button>
          </li>
        ))}
      </ul>
      <Link to="/cong-viec/cho-duyet" className="block border-t px-4 py-2.5 text-sm font-semibold no-underline" style={{ borderColor: 'var(--line)' }}>{t('Hộp duyệt ›')}</Link>
      {mo && (
        <KhungPanel loai={t('DUYỆT')} tieuDe={mo.tieuDe} onDong={() => setMo(null)}>
          <TheYeuCau yc={mo} gon onXong={() => { setMo(null); onXong(); }} />
        </KhungPanel>
      )}
    </Card>
  );
}

/* ───────────── QL (một chi nhánh) ───────────── */

const COT_LOP: readonly CotBang[] = [
  { key: 'lop', nhan: t('Lớp'), kieu: 'ten' }, { key: 'dat', nhan: t('Đạt MT'), kieu: 'phan-tram', rong: 110 }, { key: 'sos', nhan: t('SOS hiện tại'), kieu: 'chu', rong: 170 },
  { key: 'case', nhan: t('Case chưa PA'), kieu: 'so', rong: 120 }, { key: 'thi', nhan: t('Thi tháng này'), kieu: 'so', rong: 120 },
];
const coVanDe = (l: DongLop) => l.sos.some((n) => n > 0) || l.caseChuaPa > 0 || l.thiThangNay > 0 || (!!l.datMt && l.datMt.dat < l.datMt.mau);

function LopCanChuY({ d }: { d: TongQuanV5Data }) {
  const [chiVanDe, setChiVanDe] = useThamSoUrl('lop-vd', '1');
  const loc = chiVanDe === '1';
  const ds = (d.lop ?? []).filter((l) => !loc || coVanDe(l));
  const oCua = (l: DongLop, c: CotBang): ReactNode => {
    if (c.key === 'lop') return <Link to={`/hoc-vien/lop/${l.id}`} className="ten-ho-so font-semibold">{l.ma}</Link>;
    if (c.key === 'dat') return <PhanTram gon x={l.datMt} nguon={qBc(d, `&o=dat-mt&lop=${l.id}`)} tieuDe={t('Đạt MT · {lop}', { lop: l.ma })} />;
    if (c.key === 'sos') {
      if (!l.sos.some((n) => n > 0)) return <span className="text-slate-500">—</span>;
      return (
        <span className="inline-flex gap-1">
          {l.sos.map((n, i) => n > 0 && (
            <span key={i} className={`${CHIP_SOS} ${lopSos(i + 1)}`}>SOS {i + 1} · <OSo giaTri={n} className="no-underline" tieuDe={`SOS ${i + 1} · ${l.ma}`} nguon={qCn(d, `sos${i + 1}`, l.khoa)} /></span>
          ))}
        </span>
      );
    }
    if (c.key === 'case') return <OSo giaTri={l.caseChuaPa} tieuDe={t('Case chưa chốt PA · {lop}', { lop: l.ma })} nguon={qCn(d, 'caseChuaChot', l.khoa)} />;
    return <OSo giaTri={l.thiThangNay} tieuDe={t('Thi tháng này · {lop}', { lop: l.ma })} nguon={qBc(d, `&o=thi-thang-nay&lop=${l.id}`)} />;
  };
  const phuCua = (l: DongLop, c: CotBang) => (c.key === 'lop' ? [t('{n} HV', { n: l.hv }), l.gvcn].filter(Boolean).join(' · ')
    : c.key === 'dat' ? tuMau(l.datMt, t('HV')) : null);
  return (
    <Card bodyClass="p-0" title={<>{t('Lớp cần chú ý')} <span className="font-normal text-slate-500">· {kyChu(d.ky)}</span></>}
      action={<button type="button" aria-pressed={loc} onClick={() => setChiVanDe(loc ? '0' : '1')}
        className={`btn btn-sm min-h-[44px] sm:min-h-[28px] ${loc ? 'border-[color:var(--accent)] text-[color:var(--accent)]' : ''}`}>{t('Chỉ lớp có vấn đề')}</button>}>
      <div data-hd="tq-lop-chu-y">
        <Bang ten={t('Lớp cần chú ý')} cot={COT_LOP} hang={ds} khoa={(l) => l.id} oCua={oCua} phuCua={phuCua} khung={false}
          rong={{ tieuDe: t('Không lớp nào cần chú ý'), goiY: t('Không SOS, không Case chưa PA, không HV thi tháng này.'), nut: <Link to="/hoc-vien" className="link">{t('Học viên & Lớp ›')}</Link> }} />
      </div>
    </Card>
  );
}

const COT_GV_HC: readonly CotBang[] = [
  { key: 'gv', nhan: t('GV'), kieu: 'ten' }, { key: 'viec', nhan: t('Việc đúng hạn'), kieu: 'phan-tram', rong: 130 },
  { key: 'diem', nhan: t('Điểm đúng hạn'), kieu: 'phan-tram', rong: 130 }, { key: 'tre', nhan: t('Quá hạn nay'), kieu: 'so', rong: 120 },
];
const COT_GV_HT: readonly CotBang[] = [
  { key: 'gv', nhan: t('GV'), kieu: 'ten' }, { key: 'kq', nhan: t('Đạt MT'), kieu: 'phan-tram', rong: 120 },
  { key: 'tb', nhan: t('Tiến bộ'), kieu: 'phan-tram', rong: 120 }, { key: 'pa', nhan: t('PA hiệu quả'), kieu: 'phan-tram', rong: 120 },
];
const tyLeGv = (o: OPtGv | undefined): TyLeV5 | null => (!o || o.k === 'na' ? null : o.k === 'rong' ? { dat: 0, mau: 0 } : { dat: o.dung, mau: o.tong });
const gopKq = (kq: Record<string, OPtGv>): TyLeV5 | null => {
  const so = Object.values(kq).filter((o): o is Extract<OPtGv, { k: 'so' }> => o.k === 'so');
  if (!so.length) return Object.values(kq).some((o) => o.k === 'rong') ? { dat: 0, mau: 0 } : null;
  return so.reduce((a, o) => ({ dat: a.dat + o.dung, mau: a.mau + o.tong }), { dat: 0, mau: 0 });
};
type HangGv = PhanTichGvKq['hang'][number];

/** GV cần chú ý — bảng Phân tích GV của chi nhánh (4 tuần tới tuần này), không xếp hạng, không ngưỡng màu (C08). Quá hạn nay = Trễ chấm V4. */
function GvCanChuY({ d }: { d: TongQuanV5Data }) {
  const [loai, setLoai] = useThamSoUrl('gv', 'hc');
  const den = mondayOfDate(d.homNay), tu = addDaysIso(den, -21);
  const q = `cn=${d.branchId}${thamSoCt(d.ct)}&tu=${tu}&den=${den}`;
  const pt = useApi<PhanTichGvKq>(d.branchId ? `/phan-tich/giao-vien?${q}` : null, [q]);
  const tre = new Map(d.tre.map((x) => [x.khoa, x.bai]));
  const ht = loai === 'ht';
  const COT: Record<string, string> = { viec: 'viec-dung-han', diem: 'cham-diem', kq: 'ket-qua', tb: 'tien-bo', pa: 'pa-hieu-qua' };
  const DV: Record<string, string> = { viec: t('việc'), diem: t('bài'), kq: t('lượt'), tb: t('lượt'), pa: 'PA' };
  const giaTri = (h: HangGv, c: CotBang): TyLeV5 | null => (c.key === 'viec' ? tyLeGv(h.viecDungHan) : c.key === 'diem' ? tyLeGv(h.chamDiem)
    : c.key === 'kq' ? gopKq(h.ketQua) : c.key === 'tb' ? tyLeGv(h.tienBo) : c.key === 'pa' ? tyLeGv(h.paHieuQua) : null);
  const oCua = (h: HangGv, c: CotBang): ReactNode => {
    if (c.key === 'gv') return <Link to={`/giao-vien/${h.id}`} className="ten-ho-so font-semibold">{h.ten}</Link>;
    if (c.key === 'tre') {
      const n = tre.get(h.id) ?? 0;
      return n ? <span className="font-semibold text-bad">⚠ <OSo giaTri={n} className="text-bad" tieuDe={t('Bài trễ chấm · {ten}', { ten: h.ten })} nguon={`/tong-quan/ql/tre?gv=${h.id}&${thamSoTq(d.branchId, d.ct)}`} /></span>
        : <span className="tabular-nums text-slate-500">0</span>;
    }
    return <PhanTram gon x={giaTri(h, c)} nguon={`/phan-tich/giao-vien/o?gv=${h.id}&cot=${COT[c.key]}&${q}`} tieuDe={`${c.nhan} · ${h.ten}`} />;
  };
  const phuCua = (h: HangGv, c: CotBang) => (c.key === 'gv' ? h.phu : c.key === 'tre' ? ((tre.get(h.id) ?? 0) ? t('bài') : null) : tuMau(giaTri(h, c), DV[c.key]));
  return (
    <Card bodyClass="p-0" title={<>{t('GV cần chú ý')} <span className="font-normal text-slate-500">· {tuanLich(tu)} – {tuanLich(den)}</span></>}
      action={<CongTac value={ht ? 'ht' : 'hc'} onChange={(k) => setLoai(k)} muc={[['hc', t('Hành chính')], ['ht', t('Học thuật')]]} />}>
      {pt.error ? <ErrorState message={pt.error.message} hint={pt.error.hint} onRetry={pt.reload} />
        : !pt.data ? <Skeleton rows={3} className="p-4" />
          : <Bang ten={t('GV cần chú ý')} cot={ht ? COT_GV_HT.filter((c) => d.ct === 'ft' || (c.key !== 'tb' && c.key !== 'pa')) : COT_GV_HC}
            hang={pt.data.hang} khoa={(h) => h.id} oCua={oCua} phuCua={phuCua} khung={false} rong={{ tieuDe: t('Chi nhánh chưa có GV nào trong kỳ') }} />}
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
  const cn = d.branchId ? `&cn=${d.branchId}` : '';
  return (
    <>
      <DaiChiSo>
        <ChiSo ten={t('Đạt MT')} ky={kyChu(d.ky)} luat={t('HV có lượt MT chốt trong kỳ, Overall so với kỳ vọng của lượt. Ngoài mẫu: HV chưa đủ dữ liệu.')}
          giaTri={ft ? <PhanTram x={d.datMt} nguon={qBc(d, '&o=dat-mt')} tieuDe={t('Đạt MT')} /> : <span className="text-slate-500">—</span>}
          mau={ft ? tuMau(d.datMt, t('HV đủ dữ liệu')) : t('chỉ Fast Track')} />
        <ChiSo ten={t('Case có PA')} ky={t('hiện tại')}
          giaTri={<PhanTram x={{ dat: d.casePa.coPa, mau: d.casePa.mo }} nguon={qCn(d, 'caseMo', 'tong')} tieuDe={t('Case đang mở')} />}
          mau={d.casePa.mo ? <>{d.casePa.coPa}/{d.casePa.mo} Case · <OSo giaTri={d.casePa.chuaPa} tieuDe={t('Case chưa chốt PA')} nguon={qCn(d, 'caseChuaChot', 'tong')} /> {t('chưa PA')}</> : null} />
        {duyet && <ChiSo ten={t('Chờ duyệt')} ky={t('hiện tại')} giaTri={choN} mau={<>{t('đề xuất')}{choQuaHan > 0 && <span className="font-semibold text-bad"> · ⚠ {t('{n} quá hạn', { n: choQuaHan })}</span>}</>} />}
        <ChiSo ten={t('Thi tháng này')} ky={t('hiện tại')} giaTri={<OSo giaTri={d.thiThangNay} tieuDe={t('Thi tháng này')} nguon={qBc(d, '&o=thi-thang-nay')} />} mau={t('HV có ngày thi đã chốt')} />
      </DaiChiSo>
      <BoCuc
        trai={<><LopCanChuY d={d} />{session?.nav?.phanTichGv && d.branchId && <GvCanChuY d={d} />}</>}
        phai={<>
          {hop.data && <ChoDuyetGon hop={hop.data} onXong={() => { hop.reload(); invalidate('/yeu-cau/dem'); invalidate('/tong-quan'); }} />}
          <DiTiep dong={[
            { to: `/hoc-vien?thi=1${cn}`, t1: <><So n={d.thiThangNay} /> {t('HV thi tháng này')}</>, t2: t('Học viên & Lớp · lọc "Thi tháng này"') },
            ...(session?.nav?.work ? [{ to: '/cong-viec', t1: t('Việc của tôi'), t2: t('Công việc') }] : []),
            { to: `/phan-tich?goc=bao-cao${cn}`, t1: t('Báo cáo'), t2: kyChu(d.ky) },
          ]} />
        </>} />
    </>
  );
}

/* ───────────── QT / CX: theo chi nhánh ───────────── */

const COT_CN: readonly CotBang[] = [
  { key: 'cn', nhan: t('Chi nhánh'), kieu: 'ten' }, { key: 'dat', nhan: t('Đạt MT'), kieu: 'phan-tram', rong: 130 }, { key: 'case', nhan: t('Case có PA'), kieu: 'phan-tram', rong: 130 },
  { key: 'tt', nhan: t('Đạt Target thi thật'), kieu: 'phan-tram', rong: 170 }, { key: 'thi', nhan: t('Thi tháng này'), kieu: 'so', rong: 120 },
];
const COT_CN_CX: readonly CotBang[] = [{ key: 'cn', nhan: t('Chi nhánh'), kieu: 'ten' }, { key: 'sos', nhan: t('SOS 2–3'), kieu: 'so', rong: 120 }, { key: 'case', nhan: t('Case chưa PA'), kieu: 'so', rong: 130 }];
const ptChu = (x: TyLeV5 | null, gon = false) => (!x ? <span className="text-slate-500">—</span>
  : x.mau ? <span className="font-semibold tabular-nums">{Math.round((100 * x.dat) / x.mau)} %</span>
    : gon ? <span className="text-slate-500" title={t('Chưa có dữ liệu')}>—</span> : <span className="text-sm font-medium text-slate-500">– {t('Chưa có dữ liệu')}</span>);

function TheoChiNhanh({ d, cx, onChiNhanh }: { d: TongQuanV5Data; cx?: boolean; onChiNhanh: (id: number) => void }) {
  type H = DongCn & { tong?: boolean };
  const hang: H[] = [...(d.chiNhanh ?? []), ...(cx ? [] : [{
    id: 0, khoa: 'tong', ten: t('Toàn hệ thống'), datMt: d.datMt, casePa: d.casePa, thiThat: d.thiThat, thiThangNay: d.thiThangNay, sos23: 0, caseChuaPa: d.casePa.chuaPa, tong: true,
  }])];
  const bc = (h: H, o: string) => `/phan-tich/bao-cao/o?o=${o}${h.tong ? '' : `&branchId=${h.id}`}${thamSoCt(d.ct)}`;
  const oCua = (h: H, c: CotBang): ReactNode => {
    if (c.key === 'cn') return <b className="text-slate-100">{h.ten}</b>;
    if (c.key === 'dat') return <PhanTram gon x={h.datMt} nguon={bc(h, 'dat-mt')} tieuDe={`${t('Đạt MT')} · ${h.ten}`} />;
    if (c.key === 'case' && !cx) return <PhanTram gon x={{ dat: h.casePa.coPa, mau: h.casePa.mo }} nguon={qCn(d, 'caseMo', h.khoa)} tieuDe={`${t('Case đang mở')} · ${h.ten}`} />;
    if (c.key === 'tt') return ptChu(h.thiThat, true);
    if (c.key === 'thi') return <OSo giaTri={h.thiThangNay} tieuDe={`${t('Thi tháng này')} · ${h.ten}`} nguon={bc(h, 'thi-thang-nay')} />;
    if (c.key === 'sos') return <span className="tabular-nums">{h.sos23}</span>;
    return <OSo giaTri={h.caseChuaPa} tieuDe={`${t('Case chưa chốt PA')} · ${h.ten}`} nguon={qCn(d, 'caseChuaChot', h.khoa)} />;
  };
  const phuCua = (h: H, c: CotBang) => (c.key === 'dat' ? tuMau(h.datMt, t('HV')) : c.key === 'case' && !cx ? (h.casePa.mo ? `${h.casePa.coPa}/${h.casePa.mo} Case` : null)
    : c.key === 'tt' ? tuMau(h.thiThat, t('HV')) : null);
  return (
    <Card title={t('Theo chi nhánh')} bodyClass="p-0">
      <Bang ten={t('Theo chi nhánh')} cot={cx ? COT_CN_CX : COT_CN} hang={hang} khoa={(h) => h.khoa} oCua={oCua} phuCua={phuCua} khung={false}
        onHang={cx ? undefined : (h) => { if (!h.tong) onChiNhanh(h.id); }} rong={{ tieuDe: t('Chưa có lớp nào trong khung này') }} />
    </Card>
  );
}

export function TongQuanQtV5({ d, onChiNhanh }: { d: TongQuanV5Data; onChiNhanh: (id: number) => void }) {
  const ft = d.ct === 'ft';
  return (
    <>
      <DaiChiSo>
        <ChiSo ten={t('Đạt MT')} ky={kyChu(d.ky)} giaTri={ft ? <PhanTram x={d.datMt} nguon={qBc(d, '&o=dat-mt')} tieuDe={t('Đạt MT')} /> : <span className="text-slate-500">—</span>}
          mau={ft ? tuMau(d.datMt, t('HV')) : t('chỉ Fast Track')} />
        <ChiSo ten={t('Case có PA')} ky={t('hiện tại')} giaTri={<PhanTram x={{ dat: d.casePa.coPa, mau: d.casePa.mo }} nguon={qCn(d, 'caseMo', 'tong')} tieuDe={t('Case đang mở')} />}
          mau={d.casePa.mo ? `${d.casePa.coPa}/${d.casePa.mo} Case` : null} />
        <ChiSo ten={t('Đạt Target thi thật')} ky={kyChu(d.ky)} giaTri={ptChu(d.thiThat)} mau={tuMau(d.thiThat, t('HV'))} />
        <ChiSo ten={t('Thi tháng này')} ky={t('hiện tại')} giaTri={<OSo giaTri={d.thiThangNay} tieuDe={t('Thi tháng này')} nguon={qBc(d, '&o=thi-thang-nay')} />} mau={t('HV có ngày thi đã chốt')} />
      </DaiChiSo>
      <BoCuc trai={<TheoChiNhanh d={d} onChiNhanh={onChiNhanh} />}
        phai={<DiTiep dong={[
          { to: '/hoc-vien?thi=1', t1: <><So n={d.thiThangNay} /> {t('HV thi tháng này')}</>, t2: t('Học viên & Lớp · lọc "Thi tháng này"') },
          { to: '/phan-tich?goc=giao-vien', t1: t('Phân tích GV'), t2: t('Hành chính · Học thuật') },
          { to: '/phan-tich?goc=bao-cao', t1: t('Báo cáo'), t2: kyChu(d.ky) },
        ]} />} />
    </>
  );
}

type SoHv = { phamVi: 'cua-toi' | 'chi-nhanh' | 'tat-ca'; tong: number; dem: Record<'da-thi' | 'cho-buoc-tiep', number> };
export function TongQuanCxV5({ d, onChiNhanh }: { d: TongQuanV5Data; onChiNhanh: (id: number) => void }) {
  const hv = useApi<SoHv>(`/tong-quan/hoc-vien${d.branchId ? `?branchId=${d.branchId}` : ''}`, [d.branchId]);
  const chuaDat = d.datMt ? { dat: d.datMt.mau - d.datMt.dat, mau: d.datMt.mau } : null;
  const den = (chip: string) => `/hoc-vien?phamVi=${hv.data?.phamVi ?? 'tat-ca'}${d.branchId ? `&cn=${d.branchId}` : ''}&view=${chip}`;
  return (
    <>
      <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-3">
        <ChiSo ten={t('HV chưa đạt MT')} ky={kyChu(d.ky)} giaTri={d.ct === 'ft' ? <PhanTram x={chuaDat} nguon={qBc(d, '&o=dat-mt')} tieuDe={t('Đạt MT')} /> : <span className="text-slate-500">—</span>}
          mau={tuMau(chuaDat, t('HV đánh giá được'))} />
        <ChiSo ten={t('Case chưa có PA')} ky={t('hiện tại')} giaTri={<OSo giaTri={d.casePa.chuaPa} tieuDe={t('Case chưa chốt PA')} nguon={qCn(d, 'caseChuaChot', 'tong')} />}
          mau={t('trên {n} Case mở', { n: d.casePa.mo })} />
        <ChiSo ten={t('Chờ KQ · bước tiếp')} ky={t('hiện tại')}
          giaTri={hv.data ? <span className="inline-flex gap-1.5"><Link to={den('da-thi')} className="link">{hv.data.dem['da-thi']}</Link>·<Link to={den('cho-buoc-tiep')} className="link">{hv.data.dem['cho-buoc-tiep']}</Link></span> : '…'}
          mau={t('HV chờ KQ · chưa chốt bước tiếp')} />
      </div>
      <DaiChiXem>👁 {t('CX xem số liệu để phối hợp — không có việc trên trang này.')}</DaiChiXem>
      <BoCuc trai={d.chiNhanh ? <TheoChiNhanh d={d} cx onChiNhanh={onChiNhanh} /> : <LopCanChuY d={d} />}
        phai={<DiTiep dong={[
          { to: '/phan-tich?goc=bao-cao', t1: t('Báo cáo HV'), t2: t('kết quả + hỗ trợ') },
          { to: '/hoc-vien', t1: t('Học viên & Lớp'), t2: d.tenChiNhanh ?? t('Tất cả chi nhánh') },
        ]} />} />
    </>
  );
}

/* ───────────── GV ───────────── */

type ChiSoGv = { tu: string; den: string; viecDungHan: OPtGv; ketQua: OPtGv; tienBo: OPtGv };
export function TongQuanGvV5({ lopToiDay }: { lopToiDay: ReactNode }) {
  const { session } = useSession();
  const id = session?.user?.id;
  const cs = useApi<ChiSoGv>(id ? `/giao-vien/${id}/chi-so` : null, [id]);
  const viec = useApi<{ summary: { viec: number; viecQuaHan: number } }>(session?.nav?.workSupport ? '/my-work' : null, []).data?.summary;
  const o = (x: OPtGv | undefined, cot: string, nhan: string) => <PhanTram x={tyLeGv(x)} nguon={`/giao-vien/${id}/chi-so/o?cot=${cot}`} tieuDe={nhan} />;
  const ky = cs.data ? kyChu(cs.data) : undefined;
  return (
    <>
      <DaiChiSo>
        <ChiSo ten={t('Việc của tôi')} ky={t('hiện tại')} giaTri={viec?.viec ?? '…'}
          mau={viec?.viecQuaHan ? <span className="font-semibold text-bad">⚠ {t('{n} quá hạn', { n: viec.viecQuaHan })}</span> : t('không việc nào quá hạn')} />
        <ChiSo ten={t('Việc đúng hạn')} ky={ky} giaTri={o(cs.data?.viecDungHan, 'viec-dung-han', t('Việc đúng hạn'))} mau={tuMau(tyLeGv(cs.data?.viecDungHan), t('việc'))} />
        <ChiSo ten={t('Đạt MT · kỹ năng tôi dạy')} ky={ky} giaTri={o(cs.data?.ketQua, 'ket-qua', t('Kết quả'))} mau={tuMau(tyLeGv(cs.data?.ketQua), t('lượt'))} />
        <ChiSo ten={t('Tiến bộ')} ky={ky} giaTri={o(cs.data?.tienBo, 'tien-bo', t('HV tiến bộ'))} mau={tuMau(tyLeGv(cs.data?.tienBo), t('lượt'))} />
      </DaiChiSo>
      <BoCuc trai={lopToiDay}
        phai={<DiTiep dong={[
          ...(session?.nav?.work ? [{ to: '/cong-viec', t1: <><So n={viec?.viec ?? 0} /> {t('việc của tôi')}</>, t2: t('Công việc') }] : []),
          ...(id ? [{ to: `/giao-vien/${id}`, t1: t('Hồ sơ GV của tôi'), t2: t('Hành chính · Học thuật') }] : []),
        ]} />} />
    </>
  );
}

/* ───────────── TVV: 3 nhóm ───────────── */

type TqTvv = { ky: { tu: string; den: string }; baoPh: { dung: number; tong: number; treXong: number }; thiThangNay: number };
export function TongQuanTvvV5() {
  const tq = useApi<TqTvv>('/tong-quan/tvv', []);
  const hv = useApi<SoHv>('/tong-quan/hoc-vien', []);
  const viec = useApi<{ summary: { viec: number } }>('/my-work', []).data?.summary;
  if (tq.error) return <ErrorState message={tq.error.message} hint={tq.error.hint} onRetry={tq.reload} />;
  if (!tq.data) return <Skeleton rows={4} />;
  const d = tq.data;
  const den = (chip: string) => `/hoc-vien?phamVi=cua-toi&view=${chip}`;
  const choKq = hv.data?.dem['da-thi'] ?? 0, buoc = hv.data?.dem['cho-buoc-tiep'] ?? 0;
  return (
    <>
      <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-3">
        <ChiSo ten={t('Báo PH đúng hạn')} ky={kyChu(d.ky)} luat={t('Việc Báo PH đã báo trước hạn / việc Báo PH phát sinh trong kỳ.')}
          giaTri={<PhanTram x={{ dat: d.baoPh.dung, mau: d.baoPh.tong }} nguon="/tong-quan/tvv/o?o=bao-ph" tieuDe={t('Báo PH đúng hạn')} />}
          mau={d.baoPh.tong ? <>{d.baoPh.dung}/{d.baoPh.tong} {t('việc')}{d.baoPh.treXong > 0 && <> · {t('xong trễ {n}', { n: d.baoPh.treXong })}</>}</> : t('chưa việc nào phát sinh trong kỳ')} />
        <ChiSo ten={t('Thi tháng này')} ky={t('hiện tại')} giaTri={<Link to="/hoc-vien?phamVi=cua-toi&thi=1" className="link">{d.thiThangNay}</Link>} mau={t('HV có ngày thi đã chốt')} />
        <ChiSo ten={t('Chờ KQ · Lộ trình tiếp')} ky={t('hiện tại')}
          giaTri={<span className="inline-flex gap-1.5"><Link to={den('da-thi')} className="link">{choKq}</Link>·<Link to={den('cho-buoc-tiep')} className="link">{buoc}</Link></span>}
          mau={t('{a} chờ KQ · {b} chưa chốt bước tiếp', { a: choKq, b: buoc })} />
      </div>
      <BoCuc
        trai={<DiTiep tieuDe={t('Cần chú ý')} dong={[
          { to: '/hoc-vien?phamVi=cua-toi&thi=1', t1: <>{t('Thi tháng này')} · <So n={d.thiThangNay} /> HV</>, t2: t('HV của tôi · lọc "Thi tháng này"') },
          { to: den('da-thi'), t1: <>{t('Chờ KQ thi thật')} · <So n={choKq} /> HV</>, t2: t('HV của tôi · lọc "Đã thi · chờ kết quả"') },
          { to: den('cho-buoc-tiep'), t1: <>{t('Chưa chốt lộ trình tiếp')} · <So n={buoc} /> HV</>, t2: t('HV của tôi · lọc "Chờ chọn bước tiếp"') },
        ]} />}
        phai={<DiTiep dong={[
          { to: '/cong-viec', t1: <><So n={viec?.viec ?? 0} /> {t('việc của tôi')}</>, t2: t('Công việc') },
          { to: '/hoc-vien?phamVi=cua-toi', t1: t('HV của tôi'), t2: t('Học viên & Lớp') },
        ]} />} />
    </>
  );
}

/* ───────────── Admin · Head tutor ───────────── */

export function TongQuanAdminV5({ mockTest, lich, cn }: { mockTest: ReactNode; lich: ReactNode; cn: number | null }) {
  const q = cn ? `?cn=${cn}` : '';
  return <BoCuc trai={<>{mockTest}{lich}</>} phai={<DiTiep dong={[{ to: `/test/lich${q}`, t1: t('Lịch tuần'), t2: 'Test' }, { to: `/test/ke-hoach${q}`, t1: t('Kế hoạch Test'), t2: 'Test' }]} />} />;
}

export function TongQuanTutorAn() {
  return <Card><p className="m-0 text-sm text-slate-400">{t('Tutor tạm ẩn.')}</p></Card>;
}
