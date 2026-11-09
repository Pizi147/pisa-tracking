import { useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { rateView, type ChuongTrinh, type HangPtGv, type KhoangNgay, type KhungPtGv, type PhanTichGvKq } from '@shared/domain/index.ts';
import { t } from '@shared/i18n/index.ts';
import { useApi } from '../../lib/useApi.ts';
import { useThamSoUrl } from '../../lib/quayLai.ts';
import { OSo } from '../../ui/OSo.tsx';
import { Bang, type CotBang } from '../../ui/Bang.tsx';
import { PhanTrang, usePhanTrang } from '../../ui/PhanTrang.tsx';
import { ErrorState, Skeleton } from '../../ui/ui.tsx';
import { PhuSo3, gopKq, phuGv, tyLeGv } from '../worklist/TongQuanV5.tsx';
import { DOAN, DauThe, VaoHangLoc, doanNut } from './dungChung.tsx';

/**
 * PHÂN TÍCH GV (UI-PHAN-TICH, `thiet-ke/v5/phan-tich.html` tab "Phân tích GV"; `10` mục 1 + dòng UI-PHAN-TICH): MỘT bảng, hai nhóm cột Hành chính / Học thuật.
 * Bộ cột Gọn (mặc định, vừa 1280 không cuộn) / Đầy đủ (`?cot=day`). Không KPI, không xếp hạng, không màu ngưỡng (C08) — xếp theo tên. Mỗi số mở panel
 * CHỈ ĐỌC đúng tập (C22): `/phan-tich/giao-vien/o` (cùng hàm ô), Quá hạn = Trễ chấm Tổng quan, Case có PA = hồ sơ GV — cùng nguồn Tổng quan › GV cần chú ý.
 * DEM-QUA-HAN b (chủ SP 06/11): Việc đúng hạn + Chấm Test đúng hạn mở CÙNG panel dòng việc (`BangLuotPanel` kiểu `viec`: đang quá hạn trước, tab theo loại việc;
 * thay panel Chấm điểm V4 — lọc Trễ → bài quá hạn / trễ xếp đầu). < 640 px: thẻ (Bang).
 */
type TyLe = { dat: number; mau: number; pt?: number };
/* V8-PT (mockup B2): đầu nhóm chữ thường, như mọi đầu cột. */
const HC = t('Hành chính'), HT = t('Học thuật');
/*
 * Chủ SP 23/10 (vòng 2): cột tên cố định (các cột số trải đều cả bề rộng, không dồn phải); bỏ cột "Quá hạn" — bài trễ chấm hiếm, hiện "⚠ n quá hạn" ngay dưới
 * ô "Chấm Test đúng hạn"; Hành chính | Học thuật tách bằng vạch dọc + nền đầu nhóm. Đầy đủ không còn "Ghi KQ PA" (trùng hẳn "Việc đúng hạn" — một tập việc).
 */
const COT_GON: readonly CotBang[] = [
  { key: 'gv', nhan: t('Giáo viên'), kieu: 'ten', rong: 240 },
  { key: 'viec', nhan: t('Việc đúng hạn'), kieu: 'phan-tram', rong: 160, nhom: HC, tach: true },
  { key: 'diem', nhan: t('Chấm Test đúng hạn'), kieu: 'phan-tram', rong: 170, nhom: HC },
  { key: 'dat', nhan: t('Đạt kỳ vọng Test'), kieu: 'phan-tram', rong: 150, nhom: HT, tach: true },
  { key: 'tb', nhan: t('Tiến bộ'), kieu: 'phan-tram', rong: 150, nhom: HT },
  { key: 'chuY', nhan: t('HV cần chú ý'), kieu: 'so', rong: 150, nhom: HT },
];
const COT_DAY: readonly CotBang[] = [
  { ...COT_GON[0], rong: 220 }, ...COT_GON.slice(1, 3).map((c) => ({ ...c, rong: 124 })),
  ...COT_GON.slice(3).map((c) => ({ ...c, rong: 108 })),
  { key: 'casePa', nhan: t('Case có PA'), kieu: 'phan-tram', rong: 108, nhom: HT },
  { key: 'pa', nhan: t('PA cải thiện'), kieu: 'phan-tram', rong: 108, nhom: HT },
  { key: 'tt', nhan: t('Kết quả thi thật'), kieu: 'phan-tram', rong: 150, nhom: HT, goiY: '% Pass Target' },
];
/** Cột chỉ Fast Track (lớp thường không có MT / tiến bộ band / PA cải thiện / thi thật) — lớp thường: "Đạt Test" (≥ ngưỡng đạt của lớp; HSGV-1). */
const CHI_FT = new Set(['tb', 'pa', 'tt']);
/** Sổ nghĩa vụ (PR-2): tổng mọi chi nhánh — chỉ hai cột Hành chính (cột Học thuật đọc theo chi nhánh). */
const COT_TONG = new Set(['gv', 'viec', 'diem']);
/** Dòng "Chưa phân công" (spec 1.2 a, QL): id 0 — bấm số mở bài / việc không ai chịu (`gv=0`). */
const ID_CHUA_PC = 0;
const boDau = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase();

/** % to bấm được (`OSo`) + "n/m" dòng phụ (Bang `phuCua`); mẫu 0 → "—" (title "Chưa có dữ liệu"), không 0 % (T19). */
function OPt({ x, nguon, tieuDe }: { x: TyLe | null; nguon: string; tieuDe: string }) {
  if (!x) return <span className="text-slate-500">—</span>;
  const v = rateView(x.dat, x.mau);
  if (v.kind !== 'value') return <span className="text-slate-500" title={t('Chưa có dữ liệu')} aria-label={t('Chưa có dữ liệu')}>—</span>;
  /* Thi thật (2F): số to = % theo tuần dạy (`pt`); n/m dòng phụ = mục em × kỹ năng (= số dòng panel). */
  return <OSo giaTri={x.mau} nhan={`${x.pt ?? v.percent} %`} nguon={nguon} tieuDe={tieuDe} />;
}

export function PhanTichGiaoVien({ branchId, ct, khoang }: { branchId: number | null; ct: ChuongTrinh; khoang: KhoangNgay }) {
  const khung: KhungPtGv = ct;
  const [boCot, setBoCot] = useThamSoUrl('cot', 'gon');
  const [tim, setTim] = useState('');
  const q = new URLSearchParams({ ct: khung, ...(branchId ? { cn: String(branchId) } : {}), kieu: khoang.kieu, tu: khoang.tu, den: khoang.den });
  /* Sổ nghĩa vụ (PR-2): không chọn chi nhánh (QT / QL nhiều chi nhánh) → tổng mọi chi nhánh, mỗi người một dòng. */
  const { data, loading, error, reload } = useApi<PhanTichGvKq>(`/phan-tich/giao-vien?${q}`, [q.toString()]);
  /* Chế độ tổng theo câu trả lời (`cn = null`), không theo URL: QL một chi nhánh chưa gắn `cn` nhận số của chi nhánh mình. */
  const tong = !!data && data.cn == null;
  const timCo = tim.trim();
  const chuaPc: HangPtGv | null = !timCo && data?.chuaPhanCong ? {
    id: ID_CHUA_PC, ten: t('Chưa phân công'), phu: '', mon: '', lopCn: [], dangDay: { lop: 0, hv: 0 }, hvChuY: 0, casePa: { k: 'na' }, ghiKetQuaPa: { k: 'na' }, ketQua: {},
    chamDiem: data.chuaPhanCong.chamDiem, viecDungHan: data.chuaPhanCong.viecDungHan,
  } : null;
  const hang = [...(data?.hang ?? []).filter((h) => !timCo || boDau(h.ten).includes(boDau(timCo))), ...(chuaPc ? [chuaPc] : [])];
  const pt = usePhanTrang(hang.length, `${q}|${tim}`, t('giáo viên'));

  const ft = khung === 'ft';
  const day = boCot === 'day';
  const cot = (day ? COT_DAY : COT_GON).filter((c) => (ft || !CHI_FT.has(c.key)) && (!tong || COT_TONG.has(c.key)))
    .map((c) => (!ft && c.key === 'dat' ? { ...c, nhan: t('Đạt Test') } : c));
  const nguonO = (h: HangPtGv, c: string) => `/phan-tich/giao-vien/o?${q}&gv=${h.id}&cot=${encodeURIComponent(c)}`;
  const ctQ = `cn=${branchId ?? ''}&ct=${khung}`;
  /* Mỗi cột: tỷ lệ (`TyLe`) + nguồn panel — cùng nguồn với Tổng quan › GV cần chú ý. */
  const tyLe = (h: HangPtGv, k: string): TyLe | null => ({
    viec: tyLeGv(h.viecDungHan), diem: tyLeGv(h.chamDiem),
    dat: h.datMt ? tyLeGv(h.datMt) : gopKq(h.ketQua), tb: tyLeGv(h.tienBo), casePa: tyLeGv(h.casePa), pa: tyLeGv(h.paHieuQua), tt: tyLeGv(h.thiThat),
  } as Record<string, TyLe | null>)[k] ?? null;
  const NGUON: Record<string, (h: HangPtGv) => string> = {
    viec: (h) => nguonO(h, 'viec-dung-han'), diem: (h) => nguonO(h, 'cham-diem'), dat: (h) => nguonO(h, ft ? 'dat-mt' : 'ket-qua'), tb: (h) => nguonO(h, 'tien-bo'),
    casePa: (h) => `/giao-vien/${h.id}/o?cot=case-mo&${ctQ}`, pa: (h) => nguonO(h, 'pa-hieu-qua'),
    /* Pass Target (2F): panel của hồ sơ GV (cùng `mucThiTheoGv`, một dòng một mục em × kỹ năng) — 6C-NHO: chỉ chi nhánh đang chọn (`cn`), số dòng = ô. */
    tt: (h) => `/giao-vien/${h.id}/chi-so/o?cot=thi-that&cn=${branchId}&tu=${data?.tu ?? ''}&den=${data?.den ?? ''}`,
  };
  const oCua = (h: HangPtGv, c: CotBang): ReactNode => {
    if (h.id === ID_CHUA_PC) {
      if (c.key === 'gv') return <span className="font-semibold text-dim">{h.ten}</span>;
      if (c.key !== 'viec' && c.key !== 'diem') return null;
    }
    if (c.key === 'gv') return <Link to={`/giao-vien/${h.id}`} className="ten-ho-so font-semibold">{h.ten}</Link>;
    if (c.key === 'chuY') return <OSo giaTri={h.hvChuY} tieuDe={`${t('HV cần chú ý')} · ${h.ten}`} nguon={nguonO(h, 'hv-chu-y')} />;
    const tieuDe = `${c.nhan} · ${h.ten}`;
    return <OPt x={tyLe(h, c.key)} nguon={NGUON[c.key](h)} tieuDe={tieuDe} />;
  };
  const phuCua = (h: HangPtGv, c: CotBang): ReactNode => {
    if (c.key === 'gv') return phuGv(h);
    if (c.key === 'chuY') return null;
    if (h.id === ID_CHUA_PC && c.key !== 'viec' && c.key !== 'diem') return null;
    /* Sổ nghĩa vụ (PR-2): Việc · Chấm Test — 3 số riêng + "+ n S chéo chung". */
    if (c.key === 'viec' || c.key === 'diem') return <PhuSo3 o={c.key === 'viec' ? h.viecDungHan : h.chamDiem} />;
    const x = tyLe(h, c.key);
    /* V8-PT: chỉ "n/m" — đơn vị đã ở đầu cột / panel, không lặp dưới mỗi ô. */
    return x && x.mau ? `${x.dat}/${x.mau}` : null;
  };

  return (
    <div className="space-y-3">
      {/* V8-PT (mockup B2): Gọn | Đầy đủ + Tìm GV lên hàng lọc chung (khe giữa) — chi nhánh, khoảng đã ở đầu trang / hàng lọc. */}
      <VaoHangLoc>
        <span role="group" aria-label={t('Bộ cột')} className={DOAN}>
          {([['gon', t('Gọn')], ['day', t('Đầy đủ')]] as const).map(([k, nhan]) => (
            <button key={k} type="button" aria-pressed={boCot === k} onClick={() => setBoCot(k)} className={doanNut(boCot === k)}>{nhan}</button>
          ))}
        </span>
        <input type="search" name="tim-gv" autoComplete="off" placeholder={t('Tìm GV…')} aria-label={t('Tìm GV')} value={tim} onChange={(e) => setTim(e.target.value)}
          className="h-9 w-[200px] rounded-lg border border-[color:var(--o-nhap-vien)] bg-[color:var(--o-nhap-nen)] px-3 text-sm text-[color:var(--text)] placeholder:text-[color:var(--text-faint)] max-sm:h-11 max-sm:w-full" />
      </VaoHangLoc>
      {/* PT-GON (M3): bỏ "n GV · xếp theo tên" cuối hàng lọc — số GV ở chip đầu bảng, "xếp theo tên" ở ⓘ. */}
      {error ? <ErrorState message={error.message} hint={error.hint} status={error.status} onRetry={reload} />
        : loading || !data ? <Skeleton rows={6} />
        : (
          <>
            {/* V8-PT: thẻ bảng (`.the`) + đầu thẻ "Giáo viên · n GV · ⓘ Cách tính"; phân trang chỉ dưới (mốc cuộn giữ ở đầu thẻ). */}
            <section className="card overflow-clip">
              <div ref={pt.thanh.dauBang} />
              <DauThe ten={tong ? t('Giáo viên · tất cả chi nhánh') : t('Giáo viên')} dem={t('{n} GV', { n: hang.length - (chuaPc ? 1 : 0) })}
                cachTinh={t('Mỗi số mở danh sách đúng tập (chỉ đọc), cùng nguồn Tổng quan › GV cần chú ý. Không xếp hạng, không màu ngưỡng — xếp theo tên. "—" = chưa có dữ liệu. Việc · Chấm Test: tỉ lệ = đúng hạn / (đúng hạn + làm muộn + chưa làm); "S chéo chung" = bài Speaking chấm chéo chưa ai nhận của chi nhánh, mọi GV có kỹ năng S cùng thấy, không tính vào tỉ lệ.')} />
              {/* V8-PT (mockup B2): đầu nhóm phẳng như mockup (chữ chính, vạch trái) — bỏ dải màu xanh / hồng của `.bang-gv` (index.css), giữ đầu cột xuống dòng. */}
              <div className="[&_thead_th]:whitespace-normal [&_thead_th]:align-bottom [&_th[data-co-nhom]]:border-l-2 [&_th[data-co-nhom]]:border-[color:var(--line-strong)] [&_th[data-co-nhom]]:text-[color:var(--text)] [&_th[data-co-nhom]]:shadow-none">
              <Bang ten={t('Phân tích GV — Hành chính và Học thuật')} cot={cot} hang={pt.cat(hang)} khoa={(h) => h.id} oCua={oCua} phuCua={phuCua} deu khung={false} theLuoi
                rong={{ tieuDe: tim.trim() ? t('Không GV nào khớp "{q}"', { q: tim.trim() }) : t('Không có giáo viên nào có {khung} trong khoảng này.', { khung: ft ? t('lớp Fast Track') : t('lớp thường') }) }} />
              </div>
            </section>
            <PhanTrang {...pt.thanh} duoi />
          </>
        )}
    </div>
  );
}
