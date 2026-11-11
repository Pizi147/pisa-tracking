import { useState, type ReactNode } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { rateView, type ChuongTrinh, type HangPtGv, type KhoangNgay, type KhungPtGv, type OPtGv, type PhanTichGvKq } from '@shared/domain/index.ts';
import { t } from '@shared/i18n/index.ts';
import { useApi } from '../../lib/useApi.ts';
import { OSo } from '../../ui/OSo.tsx';
import { Bang, OBang, type CotBang } from '../../ui/Bang.tsx';
import { useDienThoai } from '../../ui/TheDong.tsx';
import { PhanTrang, usePhanTrang } from '../../ui/PhanTrang.tsx';
import { ErrorState, Skeleton } from '../../ui/ui.tsx';
import { gopKq, phuGv, tyLeGv } from '../worklist/TongQuanV5.tsx';
import { DaiChiSo, DauThe, VaoHangLoc } from './dungChung.tsx';

/**
 * BÁO CÁO GIÁO VIÊN (Phân tích V2 — đặc tả `2026-11-12-phan-tich-v2-design.md` mục 6; mockup #1400 D1–D4): "Thầy cô làm việc có đúng hạn, học trò có theo kịp không?"
 * Sổ nghĩa vụ: Chấm Test (bài) và Việc — mỗi nhóm Đúng hạn · Làm muộn · Chưa làm (+ "S chéo chung"); Đạt kỳ vọng Test của học trò GV (lượt; lớp thường "Đạt Test").
 * Xếp theo tên, không xếp hạng, không màu ngưỡng (C08) — Chưa làm đỏ là trạng thái quá hạn (PTA chốt XM-8). Hàng "Chưa phân công" cuối bảng (ô gộp).
 * Tất cả chi nhánh: mỗi người một dòng, ▸ tách từng chi nhánh. GET `/phan-tich/giao-vien?v2=1` — chỉ phần cần (bỏ Tiến bộ / HV cần chú ý / Case / PA / Thi thật).
 * Bấm số → panel sổ nghĩa vụ 3 tab (Chưa làm · Làm muộn · Đúng hạn), cùng đường cũ. Bỏ Gọn / Đầy đủ (`?cot=day` cũ vẫn vào màn). Xuất Excel ẩn tới PR Excel.
 */
const ID_CHUA_PC = 0;
const boDau = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase();
type So3 = { dung: number; muon: number; chua: number; sChung: number } | null;
const so3 = (o: OPtGv | undefined): So3 => (o && o.k === 'so' ? { dung: o.dung, muon: o.muon ?? 0, chua: o.chua ?? 0, sChung: o.sChung ?? 0 }
  : o && o.k === 'rong' ? { dung: 0, muon: 0, chua: 0, sChung: o.sChung ?? 0 } : null);
/** Một dòng bảng: người (hoặc một chi nhánh của người ở chế độ Tất cả). */
type Dong = { khoa: string; h: HangPtGv; cn?: { id: number; ten: string }; con?: boolean };

export function PhanTichGiaoVien({ branchId, ct, khoang }: { branchId: number | null; ct: ChuongTrinh; khoang: KhoangNgay }) {
  const khung: KhungPtGv = ct;
  const [params] = useSearchParams();
  const [tim, setTim] = useState('');
  const [mo, setMo] = useState<Set<number>>(new Set());
  const dienThoai = useDienThoai();
  const q = new URLSearchParams({ ct: khung, ...(branchId ? { cn: String(branchId) } : {}), kieu: khoang.kieu, tu: khoang.tu, den: khoang.den });
  const { data, loading, error, reload } = useApi<PhanTichGvKq>(`/phan-tich/giao-vien?${q}&v2=1`, [q.toString()]);
  const tong = !!data && data.cn == null;
  const timCo = tim.trim();
  const nguoi = (data?.hang ?? []).filter((h) => !timCo || boDau(h.ten).includes(boDau(timCo)));
  const pt = usePhanTrang(nguoi.length, `${q}|${tim}`, t('giáo viên'));
  const ft = khung === 'ft';
  const nguonO = (h: HangPtGv, cot: string, cn?: number) => `/phan-tich/giao-vien/o?${cn ? new URLSearchParams({ ...Object.fromEntries(q), cn: String(cn) }) : q}&gv=${h.id}&cot=${cot}`;

  /* Dải số: Σ các người (một nghĩa vụ thuộc đúng một người — sổ 1.2; S chéo chung không cộng). */
  const cong = (k: 'chamDiem' | 'viecDungHan') => (data?.hang ?? []).reduce((a, h) => { const x = so3(h[k]); return x ? { dung: a.dung + x.dung, muon: a.muon + x.muon, chua: a.chua + x.chua } : a; }, { dung: 0, muon: 0, chua: 0 });
  const bai = cong('chamDiem'), viec = cong('viecDungHan');
  const cpc = so3(data?.chuaPhanCong?.chamDiem)?.chua ?? 0;
  const pct = (x: { dung: number; muon: number; chua: number }) => { const m = x.dung + x.muon + x.chua; return m ? `${Math.round((100 * x.dung) / m)} %` : '—'; };

  const dong: Dong[] = pt.cat(nguoi).flatMap((h): Dong[] => [
    { khoa: `gv:${h.id}`, h },
    ...(tong && mo.has(h.id) ? (h.chiNhanh ?? []).map((c): Dong => ({ khoa: `gv:${h.id}:cn:${c.id}`, h: { ...h, chamDiem: c.chamDiem, viecDungHan: c.viecDungHan, datMt: c.datMt, ketQua: c.ketQua ?? {} }, cn: c, con: true })) : []),
  ]);
  const chuaPc: Dong | null = !timCo && data?.chuaPhanCong ? { khoa: 'chua-pc', h: { id: ID_CHUA_PC, ten: t('Chưa phân công'), phu: '', mon: '', lopCn: [], dangDay: { lop: 0, hv: 0 }, hvChuY: 0,
    casePa: { k: 'na' }, ghiKetQuaPa: { k: 'na' }, ketQua: {}, chamDiem: data.chuaPhanCong.chamDiem, viecDungHan: data.chuaPhanCong.viecDungHan } } : null;

  const NHOM_CT = t('Chấm Test · bài'), NHOM_V = t('Việc');
  const cot: CotBang[] = [
    { key: 'gv', nhan: t('Giáo viên'), kieu: 'ten', rong: 230 },
    { key: 'cd-dung', nhan: t('Đúng hạn'), kieu: 'so', nhom: NHOM_CT, tach: true }, { key: 'cd-muon', nhan: t('Làm muộn'), kieu: 'so', nhom: NHOM_CT }, { key: 'cd-chua', nhan: t('Chưa làm'), kieu: 'so', nhom: NHOM_CT },
    { key: 'v-dung', nhan: t('Đúng hạn'), kieu: 'so', nhom: NHOM_V, tach: true }, { key: 'v-muon', nhan: t('Làm muộn'), kieu: 'so', nhom: NHOM_V }, { key: 'v-chua', nhan: t('Chưa làm'), kieu: 'so', nhom: NHOM_V },
    { key: 'dat', nhan: ft ? t('Đạt kỳ vọng Test') : t('Đạt Test'), dv: ft ? t('lượt') : t('bài'), kieu: 'so', rong: 150, tach: true },
  ];
  const oCua = (d: Dong, c: CotBang): ReactNode => {
    const { h } = d;
    if (c.key === 'gv') {
      if (d.con) return <span className="pl-5 text-[color:var(--text-dim)]">{d.cn!.ten}</span>;
      if (h.id === ID_CHUA_PC) return <span className="font-semibold italic text-dim">{h.ten}</span>;
      const nCn = h.chiNhanh?.length ?? 0;
      return (
        <span className="inline-flex items-center gap-1.5">
          {tong && nCn > 1 && nutMo(h.id, h.ten, nCn)}
          <Link to={`/giao-vien/${h.id}`} className="ten-ho-so font-semibold">{h.ten}</Link>
        </span>
      );
    }
    const nhom = c.key.startsWith('cd-') ? 'chamDiem' : c.key.startsWith('v-') ? 'viecDungHan' : null;
    if (nhom) {
      const x = so3(h[nhom]);
      const k = c.key.split('-')[1] as 'dung' | 'muon' | 'chua';
      /* Chưa phân công: một ô gộp ở cột Chưa làm của Chấm Test (bài chưa có GV) — không cộng vào cột của người. */
      if (h.id === ID_CHUA_PC && (nhom !== 'chamDiem' || k !== 'chua')) return <span className="text-slate-500">—</span>;
      if (!x) return <span className="text-slate-500" title={t('Chưa có dữ liệu')}>—</span>;
      const nguon = nguonO(h, nhom === 'chamDiem' ? 'cham-diem' : 'viec-dung-han', d.cn?.id);
      const tieuDe = `${nhom === 'chamDiem' ? t('Chấm Test') : t('Việc')} · ${c.nhan} · ${d.cn ? `${h.ten} · ${d.cn.ten}` : h.ten}`;
      return (
        <span className="inline-flex flex-col items-center leading-tight">
          <OSo giaTri={x[k]} nguon={nguon} tieuDe={tieuDe} className={k === 'chua' && x[k] ? 'text-bad' : ''} />
          {k === 'dung' && x.dung + x.muon + x.chua > 0 && <span className="text-xs tabular-nums text-faint">{Math.round((100 * x.dung) / (x.dung + x.muon + x.chua))} %</span>}
          {k === 'chua' && x.sChung > 0 && <span className="whitespace-nowrap text-xs text-faint">+ <OSo giaTri={x.sChung} nguon={nguon} tieuDe={`${t('S chéo chung')} · ${h.ten}`} /> {t('S chéo chung')}</span>}
          {h.id === ID_CHUA_PC && <span className="whitespace-nowrap text-xs text-faint">{t('bài chưa có GV')}</span>}
        </span>
      );
    }
    if (c.key === 'dat') {
      if (h.id === ID_CHUA_PC) return null;
      const x = h.datMt ? tyLeGv(h.datMt) : gopKq(h.ketQua);
      /* Tất cả chi nhánh: panel đọc theo một chi nhánh — người một chi nhánh mở thẳng, nhiều chi nhánh thì ▸ rồi bấm từng dòng. */
      const cnMo = d.cn?.id ?? (tong ? (h.chiNhanh?.length === 1 ? h.chiNhanh[0].id : null) : undefined);
      const v = x ? rateView(x.dat, x.mau) : null;
      if (!x || !v || v.kind !== 'value') return <span className="text-slate-500" title={t('Chưa có dữ liệu')}>—</span>;
      return (
        <span className="inline-flex flex-col items-center leading-tight">
          {cnMo === null ? <span className="font-semibold tabular-nums" title={t('Bấm ▸ xem từng chi nhánh')}>{v.percent} %</span>
            : <OSo giaTri={x.mau} nhan={`${v.percent} %`} nguon={nguonO(h, ft ? 'dat-mt' : 'ket-qua', cnMo)} tieuDe={`${c.nhan} · ${d.cn ? `${h.ten} · ${d.cn.ten}` : h.ten}`} />}
          <span className="text-xs tabular-nums text-faint">{x.dat}/{x.mau}</span>
        </span>
      );
    }
    return null;
  };
  /* Tất cả chi nhánh (mockup D2): dòng phụ = môn · tên chi nhánh (một) hoặc "n chi nhánh". */
  const phuCua = (d: Dong, c: CotBang): ReactNode => {
    if (c.key !== 'gv' || d.con || d.h.id === ID_CHUA_PC) return null;
    const ds = d.h.chiNhanh ?? [];
    if (!tong || !ds.length) return phuGv(d.h);
    return [d.h.mon, ds.length > 1 ? t('{n} chi nhánh', { n: ds.length }) : ds[0].ten].filter(Boolean).join(' · ');
  };
  const nutMo = (id: number, ten: string, n: number) => (
    <button type="button" aria-expanded={mo.has(id)} aria-label={t('{ten} — tách {n} chi nhánh', { ten, n })}
      onClick={() => setMo((s) => { const x = new Set(s); if (x.has(id)) x.delete(id); else x.add(id); return x; })}
      className="inline-flex h-6 w-5 cursor-pointer items-center justify-center border-0 bg-transparent p-0 text-[color:var(--text-dim)]">{mo.has(id) ? '▾' : '▸'}</button>
  );
  /* Hàng "Chưa phân công" (mockup D1): ô gộp 3 cột Chấm Test — "n bài chưa có GV"; Việc luôn có người nên "—". Màn 375 vẽ thẻ từ `oCua`. */
  const cnCpc = data?.chuaPhanCong?.chiNhanh ?? [];
  const hangGop = (khoa: string, ten: ReactNode, n: number, cn?: number) => (
    <tr key={khoa} className={cn ? 'hang-con' : 'tong'}>
      <OBang c={cot[0]}>{ten}</OBang>
      <OBang c={cot[1]} colSpan={3}>{n ? <OSo giaTri={n} nguon={nguonO(chuaPc!.h, 'cham-diem', cn)} tieuDe={t('Chưa phân công')} className="text-bad" /> : <span>0</span>} <span className="text-[13px] text-[color:var(--text-dim)]">{t('bài chưa có GV')}</span></OBang>
      {cot.slice(4).map((c) => <OBang key={c.key} c={c}><span className="text-slate-500">—</span></OBang>)}
    </tr>
  );
  const hangCpc = chuaPc && !dienThoai ? (
    <>
      {hangGop('chua-pc', (
        <span className="inline-flex items-center gap-1.5">
          {tong && cnCpc.length > 1 && nutMo(ID_CHUA_PC, chuaPc.h.ten, cnCpc.length)}
          <span className="grid leading-tight"><span className="font-semibold italic text-dim">{chuaPc.h.ten}</span>
            {tong && cnCpc.length > 1 && <span className="text-xs text-faint">{t('{n} chi nhánh', { n: cnCpc.length })}</span>}</span>
        </span>
      ), cpc)}
      {tong && mo.has(ID_CHUA_PC) && cnCpc.map((c) => hangGop(`chua-pc:${c.id}`, <span className="pl-5 text-[color:var(--text-dim)]">{c.ten}</span>, so3(c.chamDiem)?.chua ?? 0, c.id))}
    </>
  ) : null;
  /* 375 (mockup D4): thẻ = tên · môn, rồi ba nhóm Chấm Test · Việc · Đạt kỳ vọng, mỗi nhóm nhãn trên số; Chưa phân công một dòng. */
  const theRieng = (d: Dong): ReactNode => {
    if (d.h.id === ID_CHUA_PC) return (
      <div className="flex min-h-[44px] items-center justify-between gap-2">
        <span className="font-semibold italic text-dim">{d.h.ten}</span>
        <span className="text-[13px] text-[color:var(--text-dim)]">{cpc ? <OSo giaTri={cpc} nguon={nguonO(d.h, 'cham-diem')} tieuDe={t('Chưa phân công')} className="text-bad" /> : 0} {t('bài chưa có GV')}</span>
      </div>
    );
    const nhomThe = (ten: string, ds: CotBang[]) => (
      <div className="grid gap-1 border-t pt-2" style={{ borderColor: 'var(--line)' }}>
        <span className="text-[13px] font-semibold text-[color:var(--text)]">{ten}</span>
        <div className="grid grid-cols-3 gap-2">
          {ds.map((c) => <div key={c.key} className="grid content-start justify-items-start gap-0.5 [&>span]:items-start"><span className="text-[13px] text-[color:var(--text-dim)]">{c.nhan}</span>{oCua(d, c)}</div>)}
        </div>
      </div>
    );
    return (
      <div className="grid gap-2">
        <div className="flex min-w-0 flex-wrap items-baseline gap-x-2 text-[15px]">{oCua(d, cot[0])}<span className="text-[13px] text-[color:var(--text-dim)]">{phuCua(d, cot[0])}</span></div>
        {nhomThe(NHOM_CT, cot.slice(1, 4))}
        {nhomThe(NHOM_V, cot.slice(4, 7))}
        <div className="grid justify-items-start gap-0.5 border-t pt-2 [&>span]:flex-row [&>span]:items-baseline [&>span]:gap-1.5" style={{ borderColor: 'var(--line)' }}>
          <span className="text-[13px] font-semibold text-[color:var(--text)]">{cot[7].nhan}</span>{oCua(d, cot[7])}
        </div>
      </div>
    );
  };
  const lienKet = `?${new URLSearchParams({ ...Object.fromEntries(params), goc: 'ket-qua-thi' })}`;

  return (
    <div className="space-y-3">
      <VaoHangLoc>
        <input type="search" name="tim-gv" autoComplete="off" placeholder={t('Tìm GV…')} aria-label={t('Tìm GV')} value={tim} onChange={(e) => setTim(e.target.value)}
          className="h-9 w-[220px] rounded-lg border border-[color:var(--o-nhap-vien)] bg-[color:var(--o-nhap-nen)] px-3 text-sm text-[color:var(--text)] placeholder:text-[color:var(--text-faint)] max-sm:h-11 max-sm:w-full" />
      </VaoHangLoc>
      {error ? <ErrorState message={error.message} hint={error.hint} status={error.status} onRetry={reload} />
        : loading || !data ? <Skeleton rows={6} />
        : (
          <>
            <DaiChiSo cot={4} ds={[
              { ten: t('Chấm Test đúng hạn'), ky: t('trong kỳ'), gt: pct(bai), mau: t('{a}/{b} bài', { a: bai.dung, b: bai.dung + bai.muon + bai.chua }) },
              { ten: t('Việc đúng hạn'), ky: t('trong kỳ'), gt: pct(viec), mau: t('{a}/{b} việc', { a: viec.dung, b: viec.dung + viec.muon + viec.chua }) },
              { ten: t('Chưa làm'), ky: t('trong kỳ'), gt: <span>{bai.chua}<small className="mx-1 text-[13px] font-medium text-[color:var(--text-dim)]">{t('bài')}</small>{viec.chua}<small className="ml-1 text-[13px] font-medium text-[color:var(--text-dim)]">{t('việc')}</small></span>, mau: t('đã qua hạn') },
              { ten: t('Chưa phân công'), ky: t('trong kỳ'), gt: cpc ? <OSo giaTri={cpc} nguon={nguonO(chuaPc!.h, 'cham-diem')} tieuDe={t('Chưa phân công')} vung="chi-so" /> : 0, nho: t('bài'), mau: t('chưa có GV') },
            ]} />
            <section className="card overflow-clip">
              <div ref={pt.thanh.dauBang} />
              <DauThe ten={tong ? t('Giáo viên · tất cả chi nhánh') : t('Giáo viên')} dem={t('{n} GV', { n: nguoi.length })}
                phai={<Link to={lienKet} className="whitespace-nowrap text-sm font-semibold text-[color:var(--accent)] no-underline hover:underline">{t('Thi thật theo GV')} ›</Link>}
                cachTinh={t('Chấm Test và Việc theo sổ nghĩa vụ: tỉ lệ = đúng hạn / (đúng hạn + làm muộn + chưa làm). S chéo chung = bài Speaking chấm chéo chưa ai nhận, mọi GV có kỹ năng S cùng thấy, không vào tỉ lệ. Xếp theo tên, không xếp hạng.')} />
              <div className="[&_thead_th]:whitespace-normal [&_thead_th]:align-bottom [&_th[data-co-nhom]]:border-l-2 [&_th[data-co-nhom]]:border-[color:var(--line-strong)] [&_th[data-co-nhom]]:text-[color:var(--text)] [&_th[data-co-nhom]]:shadow-none">
                <Bang ten={t('Giáo viên — Chấm Test và Việc')} cot={cot} hang={[...dong, ...(chuaPc && dienThoai ? [chuaPc] : [])]} cuoi={hangCpc} theRieng={theRieng} khoa={(d) => d.khoa} oCua={oCua} phuCua={phuCua} deu khung={false} theLuoi
                  lopHang={(d) => (d.con ? 'hang-con' : d.khoa === 'chua-pc' ? 'tong' : '')}
                  rong={{ tieuDe: timCo ? t('Không GV nào khớp "{q}"', { q: timCo }) : t('Không có giáo viên nào có {khung} trong khoảng này.', { khung: ft ? t('lớp Fast Track') : t('lớp thường') }) }} />
              </div>
            </section>
            <PhanTrang {...pt.thanh} duoi />
          </>
        )}
    </div>
  );
}
