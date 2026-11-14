import { MuiChev } from '../../ui/HangNhom.tsx';
import { useState, type ReactNode } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { rateView, tuanLich, type ChuongTrinh, type HangPtGv, type KhoangNgay, type KhungPtGv, type OPtGv, type PhanTichGvKq } from '@shared/domain/index.ts';
import { t } from '@shared/i18n/index.ts';
import { useApi } from '../../lib/useApi.ts';
import { OSo } from '../../ui/OSo.tsx';
import { Bang, OBang, type CotBang } from '../../ui/Bang.tsx';
import { useDienThoai } from '../../ui/TheDong.tsx';
import { PhanTrang, usePhanTrang } from '../../ui/PhanTrang.tsx';
import { ErrorState, Skeleton } from '../../ui/ui.tsx';
import { gopKq, phuGv, tyLeGv } from '../worklist/TongQuanV5.tsx';
import { DaiChiSo, DauThe, NutXuat, VaoHangLoc } from './dungChung.tsx';
import { PanelChuaLam, type TabChuaLam } from './PanelChuaLam.tsx';
import { ChonLoc } from '../../ui/PeoplePicker.tsx';
import { LOP_OSO } from '../../ui/SoLieu.tsx';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import { napDanhSach, ptX, sheetDanhSachHoacLoi, soX, xuatBaoCao } from './xuatV2.ts';
import type { OXlsx } from '../../lib/xlsxDep.ts';

/**
 * BÁO CÁO GIÁO VIÊN (Phân tích V2 — đặc tả `2026-11-12-phan-tich-v2-design.md` mục 6; mockup #1400 D1–D4): "Thầy cô làm việc có đúng hạn, học trò có theo kịp không?"
 * Sổ nghĩa vụ: Chấm Test (bài) và Việc — mỗi nhóm Đúng hạn · Làm muộn · Chưa làm (+ "S chéo chung"); Đạt kỳ vọng Test của học trò GV (lượt; lớp thường "Đạt Test").
 * Xếp theo tên, không xếp hạng, không màu ngưỡng (C08) — Chưa làm đỏ là trạng thái quá hạn (PTA chốt XM-8). Hàng "Chưa phân công" cuối bảng (ô gộp).
 * Tất cả chi nhánh: mỗi người một dòng, ▸ tách từng chi nhánh. GET `/phan-tich/giao-vien?v2=1` — chỉ phần cần (bỏ Tiến bộ / HV cần chú ý / Case / PA / Thi thật).
 * Bấm số → panel sổ nghĩa vụ 3 tab (Chưa làm · Làm muộn · Đúng hạn), cùng đường cũ, mở sẵn tab của ô (`tt`). Bỏ Gọn / Đầy đủ (`?cot=day` cũ vẫn vào màn).
 * Xuất Excel (PR-5): sheet Giáo viên (mọi người, kèm dòng từng chi nhánh ở Tất cả) + Danh sách (mọi bài / việc, `/phan-tich/giao-vien/danh-sach`).
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
  /* GD-12a (⑨ L3): Tìm GV = ô chọn có tìm — gõ lọc bảng theo chữ, chọn một GV → còn một dòng, ✕ bỏ. */
  const [chonGv, setChonGv] = useState('');
  const [moChuaLam, setMoChuaLam] = useState<TabChuaLam | null>(null);
  const [mo, setMo] = useState<Set<number>>(new Set());
  const dienThoai = useDienThoai();
  const { homNay } = useNgayNghiepVu();
  const [dangXuat, setDangXuat] = useState(false);
  const q = new URLSearchParams({ ct: khung, ...(branchId ? { cn: String(branchId) } : {}), kieu: khoang.kieu, tu: khoang.tu, den: khoang.den });
  const { data, loading, error, reload } = useApi<PhanTichGvKq>(`/phan-tich/giao-vien?${q}&v2=1`, [q.toString()]);
  const tong = !!data && data.cn == null;
  const timCo = chonGv ? '' : tim.trim();
  const nguoi = (data?.hang ?? []).filter((h) => (chonGv ? String(h.id) === chonGv : !timCo || boDau(h.ten).includes(boDau(timCo))));
  const pt = usePhanTrang(nguoi.length, `${q}|${tim}|${chonGv}`, t('giáo viên'));
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

  /*
   * PT-a (mockup v19 khung 1a, chủ SP duyệt 12/11): S chéo chung MỘT hàng chân (XM-1) thay "+ n S chéo chung" ở mọi dòng. Số = của GV thấy nhiều nhất (mọi GV có S
   * cùng thấy cùng tập; GV có S cả kỳ thấy đủ) — bấm mở panel CHÍNH GV đó lọc dòng S chéo (`sc=1`): số trên bảng = số dòng panel, không đường máy chủ mới.
   * Tất cả chi nhánh: mỗi chi nhánh một tập → tổng = Σ chi nhánh, ▸ tách từng chi nhánh (như Chưa phân công).
   */
  const sChungCua = (o?: OPtGv) => so3(o)?.sChung ?? 0;
  const scCn = new Map<number, { id: number; ten: string; n: number; h: HangPtGv }>();
  let scMot: { n: number; h: HangPtGv } | null = null;
  for (const h of data?.hang ?? []) {
    if (tong) for (const c of h.chiNhanh ?? []) { const n = sChungCua(c.chamDiem); if (n > (scCn.get(c.id)?.n ?? 0)) scCn.set(c.id, { id: c.id, ten: c.ten, n, h }); }
    else { const n = sChungCua(h.chamDiem); if (n > (scMot?.n ?? 0)) scMot = { n, h }; }
  }
  const scDs = [...scCn.values()];
  const scTong = tong ? scDs.reduce((a, x) => a + x.n, 0) : scMot?.n ?? 0;
  const ID_S_CHUNG = -1;
  const nguonSc = (h: HangPtGv, cn?: number) => `${nguonO(h, 'cham-diem', cn)}&tt=chua&sc=1`;
  const soSc = (n: number, h: HangPtGv | null, cn?: { id: number; ten: string }) => (h
    ? <OSo giaTri={n} nguon={nguonSc(h, cn?.id)} tieuDe={cn ? `${t('S chéo chung')} · ${cn.ten}` : t('S chéo chung')} className="text-bad" />
    : <span className="font-semibold tabular-nums text-bad">{n}</span>);
  const scO = () => (tong ? (scDs.length === 1 ? soSc(scDs[0].n, scDs[0].h, scDs[0]) : soSc(scTong, null)) : soSc(scTong, scMot?.h ?? null));

  const NHOM_CT = t('Chấm Test · bài'), NHOM_V = t('Việc');
  /* PT-a (mockup v19): tên 280 · 8 cột số đều 112 (mỗi nhóm Đúng hạn · Làm muộn · Chưa làm · % đúng hạn — % cột riêng, chữ thường) · Đạt kỳ vọng 200. */
  const cot: CotBang[] = [
    { key: 'gv', nhan: t('Giáo viên'), kieu: 'ten', rong: 280 },
    { key: 'cd-dung', nhan: t('Đúng hạn'), kieu: 'so', nhom: NHOM_CT, tach: true, rong: 112 }, { key: 'cd-muon', nhan: t('Làm muộn'), kieu: 'so', nhom: NHOM_CT, rong: 112 },
    { key: 'cd-chua', nhan: t('Chưa làm'), kieu: 'so', nhom: NHOM_CT, rong: 112 }, { key: 'cd-pt', nhan: t('% đúng hạn'), kieu: 'phan-tram', nhom: NHOM_CT, rong: 112 },
    { key: 'v-dung', nhan: t('Đúng hạn'), kieu: 'so', nhom: NHOM_V, tach: true, rong: 112 }, { key: 'v-muon', nhan: t('Làm muộn'), kieu: 'so', nhom: NHOM_V, rong: 112 },
    { key: 'v-chua', nhan: t('Chưa làm'), kieu: 'so', nhom: NHOM_V, rong: 112 }, { key: 'v-pt', nhan: t('% đúng hạn'), kieu: 'phan-tram', nhom: NHOM_V, rong: 112 },
    { key: 'dat', nhan: ft ? t('Đạt kỳ vọng Test') : t('Đạt Test'), dv: ft ? t('lượt') : t('bài'), kieu: 'so', rong: 200, tach: true },
  ];
  const GACH = <span className="text-slate-500">—</span>;
  const oCua = (d: Dong, c: CotBang): ReactNode => {
    const { h } = d;
    if (c.key === 'gv') {
      if (d.con) return <span className="pl-5 text-[color:var(--text-dim)]">{d.cn!.ten}</span>;
      if (h.id === ID_CHUA_PC || h.id === ID_S_CHUNG) return <span className="font-semibold italic text-dim">{h.ten}</span>;
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
      const k = c.key.split('-')[1] as 'dung' | 'muon' | 'chua' | 'pt';
      /* Chưa phân công: số ở cột Chưa làm của Chấm Test (bài chưa có GV) — không cộng vào cột của người; cột % để trống. */
      if (h.id === ID_CHUA_PC) return k === 'pt' ? null : nhom !== 'chamDiem' || k !== 'chua' ? GACH : null;
      if (!x) return <span className="text-slate-500" title={t('Chưa có dữ liệu')}>—</span>;
      const m = x.dung + x.muon + x.chua;
      if (k === 'pt') return m ? <span className="font-semibold tabular-nums text-[color:var(--text)]">{Math.round((100 * x.dung) / m)} %</span> : GACH;
      /* PT-SO-LOI: `tt` = tab mở sẵn (Chưa làm · Làm muộn · Đúng hạn) — mỗi ô một khoá panel. PT-a: tiêu đề = người · nhóm (trạng thái ở tab). */
      const nguon = `${nguonO(h, nhom === 'chamDiem' ? 'cham-diem' : 'viec-dung-han', d.cn?.id)}&tt=${k}`;
      const tieuDe = `${d.cn ? `${h.ten} · ${d.cn.ten}` : h.ten} · ${nhom === 'chamDiem' ? t('Chấm Test') : t('Việc')}`;
      return <OSo giaTri={x[k]} nguon={nguon} tieuDe={tieuDe} className={k === 'chua' && x[k] ? 'text-bad' : ''} />;
    }
    if (c.key === 'dat') {
      if (h.id === ID_CHUA_PC) return GACH;
      const x = h.datMt ? tyLeGv(h.datMt) : gopKq(h.ketQua);
      /* Tất cả chi nhánh: panel đọc theo một chi nhánh — người một chi nhánh mở thẳng, nhiều chi nhánh thì ▸ rồi bấm từng dòng. */
      const cnMo = d.cn?.id ?? (tong ? (h.chiNhanh?.length === 1 ? h.chiNhanh[0].id : null) : undefined);
      const v = x ? rateView(x.dat, x.mau) : null;
      if (!x || !v || v.kind !== 'value') return <span className="text-slate-500" title={t('Chưa có dữ liệu')}>—</span>;
      /* PT-a: hộp % + phân số mờ cùng dòng (`.cap-so`: hộp căn phải, phân số căn trái — mọi dòng thẳng nhau). */
      return (
        <span className="cap-so">
          {cnMo === null ? <span className="font-semibold tabular-nums">{v.percent} %</span>
            : <OSo giaTri={x.mau} nhan={`${v.percent} %`} nguon={nguonO(h, ft ? 'dat-mt' : 'ket-qua', cnMo)} tieuDe={`${c.nhan} · ${d.cn ? `${h.ten} · ${d.cn.ten}` : h.ten}`} />}
          <span>{x.dat}/{x.mau}</span>
        </span>
      );
    }
    return null;
  };
  /* Tất cả chi nhánh (mockup D2): dòng phụ = môn · tên chi nhánh (một) hoặc "n chi nhánh". */
  const phuCua = (d: Dong, c: CotBang): ReactNode => {
    if (c.key !== 'gv' || d.con || d.h.id === ID_CHUA_PC || d.h.id === ID_S_CHUNG) return null;
    const ds = d.h.chiNhanh ?? [];
    if (!tong || !ds.length) return phuGv(d.h);
    return [d.h.mon, ds.length > 1 ? t('{n} chi nhánh', { n: ds.length }) : ds[0].ten].filter(Boolean).join(' · ');
  };
  const nutMo = (id: number, ten: string, n: number) => (
    <button type="button" aria-expanded={mo.has(id)} aria-label={t('{ten} — tách {n} chi nhánh', { ten, n })}
      onClick={() => setMo((s) => { const x = new Set(s); if (x.has(id)) x.delete(id); else x.add(id); return x; })}
      className="inline-flex h-6 w-5 cursor-pointer items-center justify-center border-0 bg-transparent p-0 text-[color:var(--text-dim)]"><MuiChev mo={mo.has(id)} /></button>
  );
  /* PT-a (mockup v19 khung 1a): hai hàng chân — "Chưa phân công" (bài chưa có GV) và "S chéo chung" (chưa ai nhận) — số ở đúng cột Chưa làm của Chấm Test,
     cột khác "—", cột % trống. Tất cả chi nhánh: ▸ tách từng chi nhánh. Màn 375 vẽ thẻ (`theRieng`). */
  const cnCpc = data?.chuaPhanCong?.chiNhanh ?? [];
  const hangChan = (khoa: string, ten: ReactNode, o: ReactNode, con = false) => (
    <tr key={khoa} className={con ? 'hang-con' : 'tong'}>
      <OBang c={cot[0]}>{ten}</OBang>
      {cot.slice(1).map((c) => <OBang key={c.key} c={c}>{c.key === 'cd-chua' ? o : c.key.endsWith('-pt') ? null : GACH}</OBang>)}
    </tr>
  );
  const tenChan = (id: number, ten: string, phu: string, nCn: number) => (
    <span className="inline-flex items-center gap-1.5">
      {tong && nCn > 1 && nutMo(id, ten, nCn)}
      <span className="grid leading-tight"><span className="font-semibold italic text-dim">{ten}</span>
        <span className="text-xs text-faint">{tong && nCn > 1 ? t('{n} chi nhánh', { n: nCn }) : phu}</span></span>
    </span>
  );
  const soCpc = (n: number, cn?: number) => (n ? <OSo giaTri={n} nguon={nguonO(chuaPc!.h, 'cham-diem', cn)} tieuDe={t('Chưa phân công')} className="text-bad" /> : <span>0</span>);
  const coSc = !timCo && scTong > 0;
  const hangCpc = !dienThoai ? (
    <>
      {chuaPc && hangChan('chua-pc', tenChan(ID_CHUA_PC, chuaPc.h.ten, t('bài chưa có GV'), cnCpc.length), soCpc(cpc))}
      {chuaPc && tong && mo.has(ID_CHUA_PC) && cnCpc.map((c) => hangChan(`chua-pc:${c.id}`, <span className="pl-5 text-[color:var(--text-dim)]">{c.ten}</span>, soCpc(so3(c.chamDiem)?.chua ?? 0, c.id), true))}
      {coSc && hangChan('s-chung', tenChan(ID_S_CHUNG, t('S chéo chung'), t('chưa ai nhận · GV có kỹ năng S cùng thấy'), scDs.length), scO())}
      {coSc && tong && mo.has(ID_S_CHUNG) && scDs.map((x) => hangChan(`s-chung:${x.id}`, <span className="pl-5 text-[color:var(--text-dim)]">{x.ten}</span>, soSc(x.n, x.h, x), true))}
    </>
  ) : null;
  const sChungDong: Dong | null = coSc ? { khoa: 's-chung', h: { id: ID_S_CHUNG, ten: t('S chéo chung'), phu: '', mon: '', lopCn: [], dangDay: { lop: 0, hv: 0 }, hvChuY: 0,
      casePa: { k: 'na' }, ghiKetQuaPa: { k: 'na' }, ketQua: {}, chamDiem: { k: 'na' }, viecDungHan: { k: 'na' } } } : null;
  /* 375 (mockup v19 khung 7a): thẻ = tên · môn, rồi Chấm Test · Việc (nhãn trên hộp, "% đúng hạn" cuối tiêu đề nhóm) · Đạt kỳ vọng; Chưa phân công, S chéo chung một dòng. */
  const theRieng = (d: Dong): ReactNode => {
    if (d.h.id === ID_CHUA_PC || d.h.id === ID_S_CHUNG) return (
      <div className="flex min-h-[44px] items-center justify-between gap-2">
        <span className="font-semibold italic text-dim">{d.h.ten}</span>
        <span className="text-[13px] text-[color:var(--text-dim)]">{d.h.id === ID_CHUA_PC ? soCpc(cpc) : scO()} {t('bài')}</span>
      </div>
    );
    const nhomThe = (ten: string, ds: CotBang[], ptO: CotBang) => (
      <div className="grid gap-1.5 border-t pt-2" style={{ borderColor: 'var(--line)' }}>
        <span className="flex items-baseline gap-2 text-[13px] font-semibold text-[color:var(--text)]">{ten}
          <span className="ml-auto text-[13px] font-medium text-[color:var(--text-faint)]">{oCua(d, ptO)} {t('đúng hạn')}</span></span>
        <div className="grid grid-cols-3 gap-2">
          {ds.map((c) => <div key={c.key} className="grid content-start justify-items-start gap-1"><span className="text-xs text-[color:var(--text-dim)]">{c.nhan}</span><span className="inline-flex h-9 items-center">{oCua(d, c)}</span></div>)}
        </div>
      </div>
    );
    return (
      <div className="grid gap-2">
        <div className="flex min-w-0 flex-wrap items-baseline gap-x-2 text-[15px]">{oCua(d, cot[0])}<span className="text-[13px] text-[color:var(--text-dim)]">{phuCua(d, cot[0])}</span></div>
        {nhomThe(NHOM_CT, cot.slice(1, 4), cot[4])}
        {nhomThe(NHOM_V, cot.slice(5, 8), cot[8])}
        <div className="grid justify-items-start gap-1 border-t pt-2" style={{ borderColor: 'var(--line)' }}>
          <span className="text-[13px] font-semibold text-[color:var(--text)]">{cot[9].nhan} · {cot[9].dv}</span><span className="inline-flex [&_.cap-so]:flex [&_.cap-so]:w-auto">{oCua(d, cot[9])}</span>
        </div>
      </div>
    );
  };
  async function xuatExcel() {
    if (!data) return;
    setDangXuat(true);
    try {
      const ba = (o: OPtGv | undefined): OXlsx[] => { const x = so3(o); return x ? [x.dung, x.muon, soX(x.chua, 'chua-dat'), ptX(x.dung, x.dung + x.muon + x.chua)] : ['—', '—', '—', '—']; };
      const dat = (h: HangPtGv): OXlsx[] => { const x = h.datMt ? tyLeGv(h.datMt) : gopKq(h.ketQua); return x && x.mau ? [x.dat, x.mau, ptX(x.dat, x.mau)] : ['—', '—', '—']; };
      /* 14 cột: tên · môn · Chấm Test (đúng, muộn, chưa, %) · S chéo chung · Việc (đúng, muộn, chưa, %) · Đạt (đạt, mẫu, %). */
      const dongCua = (ten: string, mon: string, h: HangPtGv): OXlsx[] => [ten, mon, ...ba(h.chamDiem), so3(h.chamDiem)?.sChung || '', ...ba(h.viecDungHan), ...dat(h)];
      const hang: OXlsx[][] = [];
      for (const h of data.hang) {
        hang.push(dongCua(h.ten, phuCua({ khoa: '', h }, cot[0]) as string ?? '', h));
        if (tong && (h.chiNhanh?.length ?? 0) > 1) for (const c of h.chiNhanh!) hang.push(dongCua(`    ${c.ten}`, '', { ...h, chamDiem: c.chamDiem, viecDungHan: c.viecDungHan, datMt: c.datMt, ketQua: c.ketQua ?? {} }));
      }
      if (data.chuaPhanCong) hang.push([t('Chưa phân công'), '', '', '', soX(cpc, 'chua-dat'), '', '', '', '', '', '', '', '', '']);
      const tongBai = bai.dung + bai.muon + bai.chua, tongViec = viec.dung + viec.muon + viec.chua;
      hang.push([t('Tổng'), '', bai.dung, bai.muon, bai.chua, ptX(bai.dung, tongBai), '', viec.dung, viec.muon, viec.chua, ptX(viec.dung, tongViec), '', '', '']);
      const ds = await napDanhSach(`/phan-tich/giao-vien/danh-sach?${q}`);
      const nhanDat = ft ? t('Đạt kỳ vọng Test') : t('Đạt Test');
      xuatBaoCao({ bao: t('Giáo viên'), cn: data.cn == null ? null : data.tenChiNhanh, ct: khung, khoang, homNay }, [
        { ten: t('Giáo viên'), tong: [hang.length - 1],
          dau: [[t('Giáo viên'), t('Môn'), NHOM_CT, null, null, null, null, NHOM_V, null, null, null, nhanDat, null, null],
            [null, null, t('Đúng hạn'), t('Làm muộn'), t('Chưa làm'), t('% đúng hạn'), t('S chéo chung'), t('Đúng hạn'), t('Làm muộn'), t('Chưa làm'), t('% đúng hạn'), t('Đạt'), ft ? t('Lượt') : t('Bài'), '%']],
          hang },
        sheetDanhSachHoacLoi(ds, (r) => r.gv ?? (r.dongViec?.sChung ? t('S chéo chung') : null)),
      ]);
    } finally { setDangXuat(false); }
  }
  const lienKet = `?${new URLSearchParams({ ...Object.fromEntries(params), goc: 'ket-qua-thi' })}`;
  /* Số Chưa làm của dải: 0 không bấm; > 0 = nút số đỏ (cùng dáng số bấm được) mở panel đúng tab. */
  const soChuaLam = (n: number, tab: TabChuaLam) => (n
    ? <button type="button" className={`${LOP_OSO} text-bad`} aria-haspopup="dialog" aria-expanded={moChuaLam === tab}
        aria-label={t('{n} {dv} chưa làm — xem theo GV', { n, dv: tab === 'cham' ? t('bài') : t('việc') })} onClick={() => setMoChuaLam(tab)}>{n}</button>
    : <span>0</span>);

  return (
    <div className="space-y-3">
      <VaoHangLoc o="phai">
        <NutXuat nhan={t('Xuất Excel')} tat={!data || dangXuat} onClick={xuatExcel} />
      </VaoHangLoc>
      <VaoHangLoc>
        <ChonLoc className="w-[220px] max-sm:w-[calc(100%-52px)]" ariaLabel={t('Tìm GV')} tatCa={t('Tìm GV')} placeholder={t('Tìm GV…')} value={chonGv} onChange={setChonGv} onGo={setTim}
          ds={(data?.hang ?? []).map((h) => ({ gt: String(h.id), ten: h.ten, phu: h.mon || undefined }))} />
      </VaoHangLoc>
      {moChuaLam && (
        <PanelChuaLam nguon={`/phan-tich/giao-vien/danh-sach?${q}`} tab={moChuaLam} onDong={() => setMoChuaLam(null)}
          tieuDe={`${t('Chưa làm')} · ${tuanLich(khoang.tu)} – ${tuanLich(khoang.den)}`}
          ngCanh={[data?.cn == null ? t('Tất cả chi nhánh') : data.tenChiNhanh, ft ? 'Fast Track' : t('Lớp thường'), t('đã qua hạn')].filter(Boolean).join(' · ')} />
      )}
      {error ? <ErrorState message={error.message} hint={error.hint} status={error.status} onRetry={reload} />
        : loading || !data ? <Skeleton rows={6} />
        : (
          <>
            <DaiChiSo cot={4} ds={[
              { ten: t('Chấm Test đúng hạn'), ky: t('trong kỳ'), gt: pct(bai), mau: t('{a}/{b} bài', { a: bai.dung, b: bai.dung + bai.muon + bai.chua }) },
              { ten: t('Việc đúng hạn'), ky: t('trong kỳ'), gt: pct(viec), mau: t('{a}/{b} việc', { a: viec.dung, b: viec.dung + viec.muon + viec.chua }) },
              /* GD-12a (⑨ D1, R9.1): hai số Chưa làm bấm được → panel Chưa làm nhóm theo GV (tab Chấm Test / Việc); "+ n bài S chéo chung" bấm → panel S chéo chung (như hàng bảng). */
              { ten: t('Chưa làm'), ky: t('trong kỳ'), gt: <span className="inline-flex flex-wrap items-baseline gap-x-1">
                  {soChuaLam(bai.chua, 'cham')}<small className="mr-1 text-[13px] font-medium text-[color:var(--text-dim)]">{t('bài')}</small>
                  {soChuaLam(viec.chua, 'viec')}<small className="text-[13px] font-medium text-[color:var(--text-dim)]">{t('việc')}</small></span>,
                mau: scTong ? <>{t('đã qua hạn')} · + {scO()} {t('bài S chéo chung')}</> : t('đã qua hạn') },
              { ten: t('Chưa phân công'), ky: t('trong kỳ'), gt: cpc ? <OSo giaTri={cpc} nguon={nguonO(chuaPc!.h, 'cham-diem')} tieuDe={t('Chưa phân công')} vung="chi-so" /> : 0, nho: t('bài'), mau: t('chưa có GV') },
            ]} />
            <section className="card overflow-clip">
              <div ref={pt.thanh.dauBang} />
              <DauThe ten={tong ? t('Giáo viên · tất cả chi nhánh') : t('Giáo viên')} dem={t('{n} GV', { n: nguoi.length })}
                phai={<Link to={lienKet} className="whitespace-nowrap text-sm font-semibold text-[color:var(--accent)] no-underline hover:underline">{t('Thi thật theo GV')} ›</Link>}
                cachTinh={t('Chấm Test và Việc theo sổ nghĩa vụ: tỉ lệ = đúng hạn / (đúng hạn + làm muộn + chưa làm). S chéo chung = bài Speaking chấm chéo chưa ai nhận, mọi GV có kỹ năng S cùng thấy, không vào tỉ lệ. Xếp theo tên, không xếp hạng.')} />
              <div className="[&_tbody_td]:h-[52px] [&_tfoot_td]:h-[52px] [&_thead_th]:whitespace-normal [&_thead_th]:align-bottom [&_th[data-co-nhom]]:border-l-2 [&_th[data-co-nhom]]:border-[color:var(--line-strong)] [&_th[data-co-nhom]]:text-[color:var(--text)] [&_th[data-co-nhom]]:shadow-none">
                <Bang ten={t('Giáo viên — Chấm Test và Việc')} cot={cot} hang={[...dong, ...(chuaPc && dienThoai ? [chuaPc] : []), ...(sChungDong && dienThoai ? [sChungDong] : [])]} cuoi={hangCpc} theRieng={theRieng} khoa={(d) => d.khoa} oCua={oCua} phuCua={phuCua} deu khung={false} theLuoi
                  lopHang={(d) => (d.con ? 'hang-con' : d.khoa === 'chua-pc' || d.khoa === 's-chung' ? 'tong' : '')}
                  rong={{ tieuDe: timCo ? t('Không GV nào khớp "{q}"', { q: timCo }) : t('Không có giáo viên nào có {khung} trong khoảng này.', { khung: ft ? t('lớp Fast Track') : t('lớp thường') }) }} />
              </div>
            </section>
            <PhanTrang {...pt.thanh} duoi />
          </>
        )}
    </div>
  );
}
