import { laViecChamCheo } from '@shared/domain/gopViec.ts';
import { bacNgan } from '@shared/domain/yThuc.ts';
import { useEffect, useId, useMemo, useState, type ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { KhungPanel, panelHdTren } from '../../ui/KhungPanel.tsx';
import { HangTab } from '../../ui/HangTab.tsx';
import { ToKhop } from '../../ui/ToKhop.tsx';
import { CHIP_TRON } from '../../ui/Nhan.tsx';
import { useSession } from '../../lib/session.tsx';
import { quyCheTren, viecMoTren, type QuyCheMo } from '../../lib/hdNgCanh.ts';
import {
  CO_GI_MOI, HUONG_DAN, PHIEN_BAN_HD, TEN_VAI_HD, THU_TAB_HD, VAI_CO_NOI_DUNG, chenHan, coXemVaiKhac, locVai, maViec, manCuaDuong, manCuaPanel, manTheoId,
  tabCuaThe, tenTabHd, theCuaViec, timHd, viecOManNay,
  type ChiChoToi, type DongHd, type HuongDan, type ManHd, type MucHd, type TinhHuongHd, type VaiHd, type ViecHd, type ViecVaiKhac,
} from '@shared/huongDan/index.ts';
import { KHU_VUC } from '@shared/domain/dieuHuong.ts';
import { nhomViecCua, nhomViecTvvCua } from '@shared/domain/tongQuan.ts';
import type { DongViecChuong } from '@shared/domain/chuong.ts';
import { dich, t, type Khoa } from '@shared/i18n/index.ts';
import { chiChoToi } from './chiChoToi.tsx';
import { useVaiHd } from './MucHuongDan.tsx';
import { useDaXemHd } from './daXemHd.ts';

/**
 * HD3-1 — PANEL HƯỚNG DẪN V3 (đặc tả `2026-11-13-overhaul-v6/15-huong-dan-v3.md` mục 4 + 8; mockup ⑭ `thiet-ke/v21/huong-dan.html`; tên tab theo lời 56):
 * ba tab **Trang này · Tôi muốn… · Trường hợp** + ô tìm + dải "Có gì mới". Trang này chọn TẦNG SÂU NHẤT lúc bấm "?": (1) việc đang mở → MỘT thẻ việc ·
 * (2) tab đang đứng → ≤ 5 việc của tab · (3) màn → Bạn đang ở / Việc làm ở đây / Không làm ở đây (V2). `longTrong`: KHÔNG đóng panel đang làm —
 * mở chồng, Esc / ✕ chỉ đóng hướng dẫn. Nội dung tĩnh: 0 câu đọc (số việc tầng 2 từ `/my-work` thanh trên đã nạp; hạn từ phiên).
 */
type Tab = 'man' | 'lam' | 'gap';
const TEN_TAB: Record<Tab, string> = { man: t('Trang này'), lam: t('Tôi muốn…'), gap: t('Trường hợp') };

/** Tên vùng trang khi màn chưa có mục riêng (khớp thanh điều hướng — "Phân tích"). */
const tenVung = (p: string) => KHU_VUC.filter((k) => k.to !== '/' && (p === k.to || p.startsWith(`${k.to}/`)))[0]?.label ?? null;

/** Chữ thẻ: `t()` → mã chèn hạn → `<b>` đậm, `<k>` phím (⋯ có khung, mockup `.phim`). */
function ChuThe({ chu }: { chu: Khoa }) {
  return <>{chenHan(t(chu)).split(/<(b|k)>(.*?)<\/\1>/).map((x, i, ds) => {
    if (i % 3 === 0) return x;
    if (i % 3 === 1) return null;
    return ds[i - 1] === 'k'
      ? <kbd key={i} className="mx-px inline-flex h-5 min-w-[22px] items-center justify-center rounded border px-1 align-[1px] font-sans text-[13px] font-bold leading-none text-[color:var(--text)]" style={{ borderColor: 'var(--line-strong)', background: 'var(--surface-2)' }}>{x}</kbd>
      : <strong key={i} className="font-semibold text-[color:var(--text)]">{x}</strong>;
  })}</>;
}

/** Tầng 2: tab đang đứng — Công việc `?nhom=` (thiếu khi có `?loai=` → suy từ loại). ponytail: tab hồ sơ lớp / HV / Phân tích thêm khi HD3-2 viết nội dung tab. */
function tabDangDung(man: ManHd | null, search: URLSearchParams, tvv: boolean, hdVai?: HuongDan): { k: string; ten: string; the: (hd: HuongDan) => ViecHd[] } | null {
  if (man?.id !== 'cong-viec') return null;
  const loai = search.get('loai');
  const k = search.get('nhom') ?? (loai ? (tvv ? nhomViecTvvCua : nhomViecCua)(loai) : null);
  return k ? { k, ten: tenTabHd(k, hdVai), the: (hd) => (hd.lam ?? []).filter((v) => tabCuaThe(v) === k) } : null;
}

export function PanelHuongDanManNay({ onDong, dong }: { onDong: () => void; /** Dòng việc `/my-work` thanh trên đã nạp — số việc ở tầng 2. */ dong?: readonly DongViecChuong[] }) {
  const { pathname, search } = useLocation();
  const { session } = useSession();
  const { cuaToi, macDinh } = useVaiHd();
  const { daXem, ghi } = useDaXemHd();
  /* Có gì mới (15 mục 4.8): tài khoản đã xem phiên bản cũ hơn → dải (giữ suốt lần mở này); người mới (0) chỉ có chấm, không dải. */
  const [coMoi] = useState(() => daXem > 0 && daXem < PHIEN_BAN_HD);
  useEffect(() => { if (daXem < PHIEN_BAN_HD) void ghi(); }, []);   // eslint-disable-line react-hooks/exhaustive-deps -- ghi "đã xem phiên bản" một lần khi mở
  const [vai, setVai] = useState<VaiHd>(macDinh);
  /* Ngữ cảnh LÚC BẤM "?" — đọc một lần: panel làm việc trên cùng, dòng việc đang mở, câu quy chế đang hiện. */
  const [panel] = useState(panelHdTren);
  const [viecMo] = useState(viecMoTren);
  const [qc] = useState(quyCheTren);
  const hd = useMemo(() => (vai === cuaToi ? locVai(HUONG_DAN[vai]!, { gvcn: !!session?.laGvcn, s: !!session?.coS }) : HUONG_DAN[vai]!), [vai, cuaToi, session?.laGvcn, session?.coS]);
  const manNen = manCuaDuong(hd, pathname);
  const manPanel = manCuaPanel(hd, panel);
  const tab2 = useMemo(() => tabDangDung(manNen, new URLSearchParams(search), vai === 'tvv', hd), [manNen, search, vai, hd]);
  /* Tầng 1: dòng việc đang mở → thẻ của loại việc (theo người giữ); không có dòng việc mà panel có thẻ (Case từ hồ sơ HV) → thẻ của panel. */
  const tang1 = useMemo(() => {
    if (viecMo) {
      const x = theCuaViec(vai, maViec(viecMo), viecMo.mine);
      return { ...x, viecMo };
    }
    const the = manPanel?.the ? hd.lam?.find((v) => v.id === manPanel.the) : undefined;
    return the ? { the, vai, viecMo: null } : null;
  }, [viecMo, manPanel, hd, vai]);
  const [tang, setTang] = useState<1 | 2 | 3>(tang1 ? 1 : tab2 ? 2 : 3);
  const [tab, setTab] = useState<Tab>(manNen || manPanel || tang1 || tab2 ? 'man' : 'lam');
  const [moThe, setMoThe] = useState<string | null>(null);
  const [q, setQ] = useState('');
  const kq = useMemo(() => timHd(hd, q, t, manNen?.id), [hd, q, manNen]);
  const onChi = (c: ChiChoToi) => { onDong(); chiChoToi(c); };
  const idThan = useId();
  const soViec = useMemo(() => {
    const m = new Map<string, number>();
    for (const d of dong ?? []) if (d.mine) { const k = maViec(d); m.set(k, (m.get(k) ?? 0) + 1); }
    return (v: ViecHd) => (v.viecWeb ?? []).reduce((n, k) => n + (m.get(k) ?? 0), 0);
  }, [dong]);
  const ctx: Ctx = { hd, q: kq ? q : '', onChi, onDong, pathname };
  const moTheViec = (id: string) => { setQ(''); setTab('lam'); setMoThe(id); };

  const dau = (
    <div className="flex flex-col gap-3 pt-3 max-sm:gap-2.5 max-sm:pt-1.5 sm:px-1">
      <div className="flex min-h-9 items-center gap-2.5">
        <h2 className="m-0 whitespace-nowrap text-[16px] font-bold text-slate-100">{t('Hướng dẫn')}</h2>
        {coXemVaiKhac(cuaToi) && VAI_CO_NOI_DUNG.length > 1 ? (
          <select className="field o-chon-vai h-[30px] w-auto py-0 pl-2.5 pr-7 text-[13px] max-sm:h-11 max-sm:text-[14px]" aria-label={t('Xem vai khác')} title={t('Xem vai khác')}
            value={vai} onChange={(e) => { setVai(e.target.value as VaiHd); setQ(''); setTang(tab2 ? 2 : 3); }}>
            {VAI_CO_NOI_DUNG.map((v) => <option key={v} value={v}>{t('Vai: {vai}', { vai: TEN_VAI_HD[v] })}</option>)}
          </select>
        ) : <span className={`${CHIP_TRON} px-2.5 text-slate-400`} style={{ background: 'var(--surface-2)' }}>{TEN_VAI_HD[vai]}</span>}
        <button type="button" className="btn btn-sm btn-ghost ml-auto min-h-[44px] min-w-[44px] justify-center sm:min-h-[32px] sm:min-w-[32px]" onClick={onDong} aria-label={t('Đóng')}>✕</button>
      </div>
      {coMoi && <CoGiMoi onThe={moTheViec} />}
      <label className="relative block">
        <svg aria-hidden viewBox="0 0 16 16" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" fill="none" stroke="var(--text-faint)" strokeWidth="1.5" strokeLinecap="round">
          <circle cx="7" cy="7" r="4.5" /><path d="m10.5 10.5 3 3" /></svg>
        <input type="search" autoComplete="off" className="field pl-[34px] pr-10 [&::-webkit-search-cancel-button]:hidden" value={q} onChange={(e) => setQ(e.target.value)}
          placeholder={t('Tìm trong hướng dẫn')} aria-label={t('Tìm trong hướng dẫn')} />
        {q && <button type="button" className="absolute right-0 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-md border-0 bg-transparent text-[14px] text-slate-400 sm:right-1 sm:h-8 sm:w-8"
          aria-label={t('Xoá chữ tìm')} onClick={() => setQ('')}>✕</button>}
      </label>
      <HangTab<Tab | ''> ariaLabel={t('Phần hướng dẫn')} panelId={idThan} value={kq ? '' : tab} onChange={(k) => { if (k) { setTab(k); setQ(''); setMoThe(null); } }}
        tabs={(Object.keys(TEN_TAB) as Tab[]).map((k) => ({ key: k, label: TEN_TAB[k] }))} />
    </div>
  );

  let than: ReactNode;
  if (kq) than = <KetQuaTim kq={kq} q={q} ctx={ctx} onXemHet={() => { setQ(''); setTab('lam'); }} onThe={moTheViec} />;
  else if (tab === 'lam') than = <TabToiMuon hd={hd} manNen={manNen} moThe={moThe} ctx={ctx} />;
  else if (tab === 'gap') than = <TabTruongHop hd={hd} ctx={ctx} onThe={moTheViec} />;
  else if (tang === 1 && tang1) {
    const lenTang = tab2 ? 2 : 3;
    const len = <button type="button" className={NUT_LEN} onClick={() => setTang(lenTang)}>{lenTang === 2 ? t('‹ Việc khác ở tab này') : t('‹ Việc khác ở màn này')}</button>;
    /* Tiêu đề dòng gộp đã có mã lớp ("MB FT 101 · Xử lý vi phạm · 3 em") — không thêm lần hai. */
    const tdMo = tang1.viecMo ? bacNgan(dich(tang1.viecMo.tieuDe)) : '';   // AUDIT-1611 A3-10: tên bậc viết như màn (REPORT 1)
    const tenMo = tang1.viecMo ? (tang1.viecMo.lop && !tdMo.includes(tang1.viecMo.lop) ? `${tang1.viecMo.lop} · ${tdMo}` : tdMo) : t(tang1.the!.ten);
    than = tang1.the ? (
      <>{len}<TheViec v={tang1.the} ctx={ctx} dangMo={tenMo} qc={qc} dangODung hdThe={HUONG_DAN[tang1.vai!]}
        dai={tang1.viecMo && !tang1.viecMo.mine ? { vai: tang1.vai!, xem: !['ql', 'qt', 'admin'].includes(cuaToi),
          kieu: maViec(tang1.viecMo) === 'cham_speaking' || laViecChamCheo(tang1.viecMo) ? 'chung' : tang1.viecMo.chuaGiu ? 'chua' : undefined } : undefined} /></>
    ) : (
      /* K11c: việc chưa có thẻ (lưới an toàn) — một câu, rồi việc khác ở tab / màn. */
      <>
        <p className="m-0 text-sm text-slate-400">{t('Việc <b>{viec}</b> chưa có thẻ riêng. Việc khác ở đây:', { viec: tenMo }).split(/<b>(.*?)<\/b>/).map((x, i) => (i % 2 ? <b key={i} className="font-semibold text-slate-100">{x}</b> : x))}</p>
        <TrangNay tang={lenTang} hd={hd} manNen={manNen} manPanel={manPanel} tab2={tab2} soViec={soViec} ctx={ctx} />
      </>
    );
  } else than = <TrangNay tang={tang === 1 ? 3 : tang} hd={hd} manNen={manNen} manPanel={manPanel} tab2={tab2} soViec={soViec} ctx={ctx} />;

  return (
    <KhungPanel tieuDe={t('Hướng dẫn')} anDau longTrong nutHd={false} tabs={dau} vungTab={{ id: idThan, nhan: kq ? t('Tìm trong hướng dẫn') : TEN_TAB[tab] }} onDong={onDong}
      chan={{ huy: null, trai: <Link to="/huong-dan" className="link inline-flex min-h-[44px] items-center text-[13px] font-semibold max-sm:text-sm sm:min-h-6" onClick={onDong}>{t('Mở trang Hướng dẫn ›')}</Link> }}>
      <div key={`${vai}-${tab}-${tang}-${kq ? 'tim' : ''}`} className="flex flex-col gap-[18px] pb-1 pt-4 max-sm:gap-[22px] sm:px-1">{than}</div>
    </KhungPanel>
  );
}

/** `inDuoc`: trang Hướng dẫn — thân mỗi việc luôn có trong cây (ẩn khi gập), để in cả trang (`print:`). `pathname`: "Đi tới ›" chỉ khi đang ở chỗ khác. */
export type Ctx = { hd: HuongDan; q: string; onChi: (c: ChiChoToi) => void; onDong: () => void; inDuoc?: boolean; pathname?: string };

/* ---------------------------------------------------------------- khối dùng chung */

const NUT_LEN = '-my-1 -ml-1.5 inline-flex min-h-7 items-center gap-1 self-start rounded-md border-0 bg-transparent px-1.5 text-[13px] font-semibold text-[color:var(--accent)] hover:bg-[color:var(--accent-soft)] max-sm:-my-2.5 max-sm:min-h-[44px]';
const H3 = 'm-0 flex items-center gap-2 text-[14px] font-bold leading-tight text-slate-100 before:h-[18px] before:w-[3px] before:shrink-0 before:rounded-sm before:bg-[color:var(--accent)]';
export function KhoiHd({ ten, children }: { ten: string; children: ReactNode }) {
  return <section className="flex flex-col gap-2"><h3 className={H3}>{ten}</h3>{children}</section>;
}
export function Nhom({ ten, children }: { ten: string; children: ReactNode }) {
  return <div><h4 className="m-0 mb-1.5 ml-0.5 text-[13px] font-semibold text-slate-400">{ten}</h4>{children}</div>;
}
export const DsViec = ({ children }: { children: ReactNode }) => (
  <div className="overflow-hidden rounded-[10px] border [&>*+*]:border-t" style={{ borderColor: 'var(--line)' }}>{children}</div>
);

/** Có gì mới (mockup ⑭ K8): dải mảnh gập sẵn, mở ra ≤ 5 dòng; dòng có thẻ thì bấm mở thẻ. */
function CoGiMoi({ onThe }: { onThe: (id: string) => void }) {
  const [mo, setMo] = useState(false);
  const id = useId();
  return (
    <div className="rounded-[10px] border" style={{ borderColor: 'var(--line)', background: 'var(--surface-2)' }}>
      <button type="button" aria-expanded={mo} aria-controls={id} onClick={() => setMo(!mo)}
        className="flex min-h-10 w-full cursor-pointer appearance-none items-center gap-2 border-0 bg-transparent py-0 pl-3 pr-2 text-left text-sm font-semibold text-slate-100 max-sm:min-h-[44px]">
        <span aria-hidden className="h-2 w-2 shrink-0 rounded-full bg-[color:var(--accent)]" />{t('Có gì mới')}
        <span className="text-[13px] font-normal text-slate-500">{t('· {n} thay đổi', { n: CO_GI_MOI.length })}</span>
        <svg aria-hidden viewBox="0 0 16 16" className={`ml-auto h-4 w-4 transition-transform duration-150 motion-reduce:transition-none ${mo ? 'rotate-180' : ''}`} fill="none" stroke="var(--text-dim)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M4 6l4 4 4-4" /></svg>
      </button>
      {mo && (
        <ul id={id} className="m-0 list-none border-t p-0 pb-1.5" style={{ borderColor: 'var(--line)' }}>
          {CO_GI_MOI.map((m) => (
            <li key={m.chu}>
              {m.the ? <button type="button" onClick={() => onThe(m.the!)} className="block min-h-9 w-full cursor-pointer border-0 bg-transparent px-3 py-[7px] text-left text-sm leading-[1.45] text-slate-200 hover:bg-[color:var(--accent-soft)] max-sm:min-h-[44px]"><ChuThe chu={m.chu} /></button>
                : <p className="m-0 px-3 py-[7px] text-sm leading-[1.45] text-slate-200"><ChuThe chu={m.chu} /></p>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Khối 1 · Bạn đang ở: tên màn (· tab) + một câu + Trước / Sau. Panel đang mở: "trên {màn nền}", không Trước / Sau. */
export function BanDangO({ man, tenRieng, tren, trang = false, cau, ctx }: { man: ManHd | null; tenRieng?: string | null; tren?: string; trang?: boolean; /** tầng 2: câu của tab thay câu của màn */ cau?: Khoa | null; ctx: Ctx }) {
  const ten = tenRieng ?? (man ? t(man.ten) : null);
  const d = cau === undefined ? man?.dangO : undefined;
  const luong = d && [d.truoc && { nhan: t('Trước'), ...d.truoc }, d.sau && { nhan: t('Sau'), ...d.sau }].filter(Boolean) as { nhan: string; chu: Khoa; duong: string }[] | undefined;
  return (
    <div className="flex flex-col gap-1">
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
        {!trang && <span className="text-[13px] font-medium text-slate-500">{t('Bạn đang ở')}</span>}
        {ten && <h3 className="m-0 text-[16px] font-bold text-slate-100">{ten}</h3>}
        {tren && <span className="text-[13px] font-medium text-slate-400">{t('trên {man}', { man: tren })}</span>}
      </div>
      {cau ? <p className="m-0 text-sm text-slate-400">{t(cau)}</p>
        : cau === undefined && (d || !man) && <p className="m-0 text-sm text-slate-400">{d ? t(d.cau) : t('Màn này chưa có hướng dẫn riêng.')}</p>}
      {!!luong?.length && (
        <div className={`mt-1.5 grid rounded-[10px] border ${luong.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`} style={{ borderColor: 'var(--line)' }}>
          {luong.map((x, i) => (
            <Link key={x.nhan} to={x.duong} onClick={ctx.onDong} className={`grid min-w-0 gap-px px-3 py-1.5 no-underline hover:bg-[color:var(--accent-soft)] max-sm:py-2.5 ${i ? 'border-l' : ''}`} style={{ borderColor: 'var(--line)' }}>
              <span className="text-xs font-medium text-slate-500">{x.nhan}</span>
              <b className="text-sm font-semibold leading-snug text-[color:var(--accent)]">{t(x.chu)} ›</b>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

/** Khối · Không làm ở đây: đích đúng chỗ (link) hoặc chữ nhạt "việc của QL". */
export function KhongLam({ man, ctx }: { man: ManHd; ctx: Ctx }) {
  if (!man.khongLam?.length) return null;
  return (
    <section className="flex flex-col gap-1.5">
      <h3 className="m-0 text-[14px] font-bold text-slate-100">{t('Không làm ở đây')}</h3>
      <div className="grid">
        {man.khongLam.map((k, i) => (
          <div key={k.ten} className={`grid gap-x-3 gap-y-1 text-sm sm:grid-cols-[minmax(0,1fr)_auto] sm:items-baseline ${i ? 'border-t py-2.5 sm:py-[9px]' : 'pb-2.5 pt-0.5 sm:pb-[9px]'}`} style={{ borderColor: 'var(--line)' }}>
            <span className="text-slate-200">{t(k.ten)}</span>
            {k.den ? <Link to={k.den.duong} onClick={ctx.onDong} className="link -my-2.5 inline-flex min-h-[44px] items-center text-[13px] font-semibold sm:my-0 sm:min-h-0 sm:justify-end">{t(k.den.chu)} ›</Link>
              : <span className="text-[13px] text-slate-500 sm:text-right">{k.cua && t(k.cua)}</span>}
          </div>
        ))}
      </div>
    </section>
  );
}

const NUT_CHI = 'btn btn-sm min-h-[44px] gap-1.5 sm:min-h-[32px] print:hidden';
const IcChi = () => <svg aria-hidden viewBox="0 0 16 16" className="h-[15px] w-[15px]" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="8" cy="8" r="5.5" /><circle cx="8" cy="8" r="2" /><path d="M8 1v2M8 13v2M1 8h2M13 8h2" /></svg>;
const tenLoiTat = (hd: HuongDan, v: ViecHd) => [
  ...(v.loiTat ?? []).map((id) => manTheoId(hd, id)).filter((m): m is ManHd => !!m && !m.panel).map((m) => t(m.ten)),
  ...(v.tatThem ?? []).map((x) => t(x)),
];
const nhanVai = (v: ViecHd) => (v.chiGvcn ? t('Chỉ GVCN') : v.chiS ? t('GV Speaking') : null);
const ChipVai = ({ chu }: { chu: string }) => <span className="mt-px whitespace-nowrap rounded-md border px-1.5 py-px text-xs font-semibold text-slate-400" style={{ borderColor: 'var(--line-strong)' }}>{chu}</span>;

/* ---------------------------------------------------------------- thẻ việc (một thành phần: tầng 1, dòng mở, tìm, trang) */

type DongThe = { k: string; nhan: string; nd: ReactNode };
/**
 * THẺ VIỆC (15 mục 4.4, mockup ⑭ K1 · K2): bảy dòng khuôn cố định, dòng không có thì không hiện. Cột nhãn 108, 375 nhãn trên.
 * `dai`: dòng việc của người khác — "Việc của {vai}. Bạn làm thay được." (ẩn Không làm được) / "Bạn chỉ xem." (ẩn Làm, Làm sai, Không làm được) — 4.5, 8.3.
 * `qc`: câu quy chế của panel đang mở — 375 luôn ở đầu thẻ (câu bị cắt ở chân panel); có chi tiết thì hiện mọi cỡ (ⓘ không còn hộp chữ riêng).
 * `dangODung`: đang ở đúng chỗ làm → không "Đi tới ›".
 */
function TheViec({ v, ctx, dangMo, dai, qc, dangODung = false, hdThe }: { v: ViecHd; ctx: Ctx; dangMo?: string; dai?: { vai: VaiHd; xem: boolean; kieu?: 'chua' | 'chung' }; qc?: QuyCheMo | null; dangODung?: boolean; /** thẻ của vai khác: lối tắt tra màn của vai đó */ hdThe?: HuongDan }) {
  const an = new Set(dai?.xem ? ['lam', 'sai', 'khong'] : dai ? ['khong'] : []);
  const ds = ([
    v.khiCo && { k: 'khi', nhan: t('Khi nào có'), nd: <ChuThe chu={v.khiCo} /> },
    v.buoc.length > 0 && { k: 'lam', nhan: t('Làm'), nd: (
      <ol className="m-0 grid list-none gap-1 p-0 [counter-reset:b]">
        {v.buoc.map((b) => (
          <li key={b} className="grid grid-cols-[20px_minmax(0,1fr)] gap-2 [counter-increment:b] before:mt-px before:h-5 before:w-5 before:rounded-[50%] before:bg-doing-bg before:text-center before:text-xs before:font-bold before:leading-5 before:text-doing before:content-[counter(b)]">
            <span><ChuThe chu={b} /></span>
          </li>
        ))}
      </ol>
    ) },
    v.xong && { k: 'xong', nhan: t('Xong khi'), nd: <ChuThe chu={v.xong} /> },
    v.han && { k: 'han', nhan: t('Hạn'), nd: <ChuThe chu={v.han} /> },
    v.sai && { k: 'sai', nhan: t('Làm sai'), nd: <ChuThe chu={v.sai} /> },
    v.khongDuoc?.length && { k: 'khong', nhan: t('Không làm được'), nd: <DsCham ds={v.khongDuoc} /> },
    v.sau && { k: 'sau', nhan: t('Sau đó'), nd: <ChuThe chu={v.sau} /> },
  ].filter(Boolean) as DongThe[]).filter((d) => !an.has(d.k));
  const tat = tenLoiTat(hdThe ?? ctx.hd, v);
  const coDi = !!v.loiChinh.duong && !dangODung && ctx.pathname !== v.loiChinh.duong;
  const chi = v.loiChinh.chi;
  const nhan = nhanVai(v);
  return (
    <article className="grid gap-3.5" aria-label={t('Thẻ việc {ten}', { ten: t(v.ten) })} data-the={v.id}>
      {dangMo && (
        <div className="grid gap-0.5">
          <span className="text-xs font-medium text-slate-500">{t('Bạn đang mở')}</span>
          <span className="flex flex-wrap items-center gap-x-2 gap-y-1 text-base font-bold leading-[1.35] text-slate-100">{dangMo}{nhan && <ChipVai chu={nhan} />}</span>
        </div>
      )}
      {dai && (
        <div className="flex items-center gap-2 rounded-lg border px-3 py-[7px] text-[13px] leading-[1.4] text-slate-400" style={{ borderColor: 'var(--line)', background: 'var(--surface-2)' }}>
          <svg aria-hidden viewBox="0 0 16 16" className="h-4 w-4 shrink-0" fill="none" stroke="var(--text-faint)" strokeWidth="1.5" strokeLinecap="round"><circle cx="8" cy="5.5" r="2.5" /><path d="M3 13.5c.6-2.4 2.6-3.5 5-3.5s4.4 1.1 5 3.5" /></svg>
          {/* Dòng chưa ai giữ / Chấm Speaking chung: dải trung tính (15 mục 8.1 — dải theo dòng đang mở); người chỉ xem vẫn "Việc của {vai}. Bạn chỉ xem.". */}
          {dai.kieu === 'chung' && !dai.xem ? <span><b className="font-semibold text-slate-100">{t('Việc chung của GV Speaking.')}</b> {t('Bạn nhập hộ được.')}</span>
            : dai.kieu === 'chua' && !dai.xem ? <span><b className="font-semibold text-slate-100">{t('Chưa có người giữ.')}</b> {t('Bạn làm được.')}</span>
            : <span><b className="font-semibold text-slate-100">{t('Việc của {vai}.', { vai: TEN_VAI_HD[dai.vai] })}</b> {dai.xem ? t('Bạn chỉ xem.') : t('Bạn làm thay được.')}</span>}
        </div>
      )}
      {qc && (
        <div className={`grid gap-0.5 rounded-lg border px-3 py-2 text-sm leading-snug text-slate-200 ${qc.chiTiet ? '' : 'sm:hidden'}`} style={{ borderColor: 'var(--line)', background: 'var(--surface-2)' }}>
          <span className="text-xs font-semibold text-slate-500">{t('Quy chế')}</span>
          <span>{qc.chu}</span>
          {qc.chiTiet && <span className="text-[13px] text-slate-400">{qc.chiTiet}</span>}
        </div>
      )}
      <dl className="m-0 grid gap-2.5 max-sm:gap-3">
        {ds.map((d) => (
          <div key={d.k} className={`grid gap-x-3 text-sm leading-normal max-sm:grid-cols-1 max-sm:gap-y-px max-sm:text-[14px] sm:grid-cols-[108px_minmax(0,1fr)]`}>
            <dt className="text-[13px] font-semibold leading-[1.6] text-slate-500">{d.nhan}</dt>
            <dd className="m-0 min-w-0 text-slate-100">{d.nd}</dd>
          </div>
        ))}
      </dl>
      {!dai?.xem ? (chi || coDi || tat.length > 0) && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t pt-3" style={{ borderColor: 'var(--line)' }}>
          {chi && <button type="button" className={NUT_CHI} onClick={() => ctx.onChi(chi)}><IcChi />{t('Chỉ cho tôi')}</button>}
          {coDi && <Link to={v.loiChinh.duong!} onClick={ctx.onDong} className="link inline-flex min-h-[44px] items-center text-[13px] font-semibold sm:min-h-[30px]">{t('Đi tới ›')}</Link>}
          {tat.length > 0 && <span className="basis-full text-[13px] text-slate-500">{t('Cũng mở được từ: {ds}', { ds: tat.join(', ') })}</span>}
        </div>
      ) : coDi && (
        <div className="border-t pt-3" style={{ borderColor: 'var(--line)' }}>
          <Link to={v.loiChinh.duong!} onClick={ctx.onDong} className="link inline-flex min-h-[44px] items-center text-[13px] font-semibold sm:min-h-[30px]">{t('Đi tới ›')}</Link>
        </div>
      )}
    </article>
  );
}

/** Dòng có hai lý do / hai lối: danh sách chấm (mockup `.nhanh-hd`); một mục thì là câu. */
function DsCham({ ds }: { ds: readonly Khoa[] }) {
  if (ds.length === 1) return <ChuThe chu={ds[0]} />;
  return (
    <ul className="m-0 grid list-none gap-1 p-0">
      {ds.map((x) => <li key={x} className="relative pl-3 before:absolute before:left-0 before:top-[.6em] before:h-[5px] before:w-[5px] before:rounded-full before:bg-doing"><ChuThe chu={x} /></li>)}
    </ul>
  );
}

/** Một dòng gập / mở — MỘT kiểu ở mọi tab (G4): gập = tên (+ nhãn vai, số việc); mở = thẻ việc (hoặc bước của mục riêng màn). */
function DongGap({ id, ten, phai, moSan = false, ctx, children }: { id: string; ten: string; phai?: ReactNode; moSan?: boolean; ctx: Ctx; children: ReactNode }) {
  const [mo, setMo] = useState(moSan);
  const idThan = useId();
  return (
    <div className={`scroll-mt-14 ${mo ? 'bg-[color:var(--surface-2)]' : ''}`} data-muc={id}>
      <button type="button" aria-expanded={mo} aria-controls={idThan} onClick={() => setMo(!mo)}
        className="grid min-h-[44px] w-full cursor-pointer appearance-none grid-cols-[16px_minmax(0,1fr)_auto] items-start gap-x-2 border-0 bg-transparent px-3 py-[9px] text-left text-slate-100 hover:bg-[color:var(--accent-soft)]">
        <svg aria-hidden viewBox="0 0 16 16" className={`mt-[3px] h-4 w-4 transition-transform duration-150 motion-reduce:transition-none ${mo ? '' : '-rotate-90'}`} fill="none" stroke="var(--text-faint)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M4 6l4 4 4-4" /></svg>
        <b className="min-w-0 text-[14px] font-semibold leading-snug">{ctx.q ? <ToKhop chu={ten} q={ctx.q} /> : ten}</b>
        <span className="flex items-center gap-2">{phai}</span>
      </button>
      {(mo || ctx.inDuoc) && <div id={idThan} className={`pb-3.5 pl-9 pr-3.5 ${mo ? 'block' : 'hidden print:block'}`}>{children}</div>}
    </div>
  );
}

const DongCuaThe = ({ v, ctx, n = 0, moSan }: { v: ViecHd; ctx: Ctx; n?: number; moSan?: boolean }) => {
  const nhan = nhanVai(v);
  return (
    <DongGap id={v.id} ten={t(v.ten)} moSan={moSan} ctx={ctx}
      phai={<>{nhan && <ChipVai chu={nhan} />}{n > 0 && <span className="whitespace-nowrap text-[13px] tabular-nums text-slate-400">{t('{n} việc', { n })}</span>}</>}>
      <TheViec v={v} ctx={ctx} />
    </DongGap>
  );
};
/** Mục riêng của màn (không phải việc): bước + Chỉ cho tôi (dáng V2). */
const DongMuc = ({ m, ctx, moSan }: { m: MucHd; ctx: Ctx; moSan?: boolean }) => (
  <DongGap id={m.id} ten={t(m.ten)} moSan={moSan} ctx={ctx}>
    <div className="grid gap-2.5">
      <TheViec v={{ id: m.id, ten: m.ten, nhom: 'khac', loiChinh: { chu: m.ten }, buoc: m.buoc }} ctx={ctx} />
      {m.chi && <div><button type="button" className={NUT_CHI} onClick={() => ctx.onChi(m.chi!)}><IcChi />{t('Chỉ cho tôi')}</button></div>}
    </div>
  </DongGap>
);
/** HD-CHI: việc có bước riêng của màn (`muc.viec`, `viecOManNay` đã gộp vào `d.muc`) — thẻ dùng bước + Chỉ cho tôi của màn này. */
const theCuaDong = (v: ViecHd, m: MucHd): ViecHd => ({ ...v, buoc: m.buoc, loiChinh: { ...v.loiChinh, chi: m.chi } });
const DongCuaDong = ({ d, ctx }: { d: DongHd; ctx: Ctx }) => (d.viec ? <DongCuaThe v={theCuaDong(d.viec, d.muc)} ctx={ctx} /> : <DongMuc m={d.muc} ctx={ctx} />);

/* ---------------------------------------------------------------- tab Trang này */

const TOI_DA_TANG_2 = 5;
/** Danh sách dòng tầng 2 / 3 (mockup ⑭ K3, K4): ≤ 5 dòng, còn lại "+ n việc khác" mở hết tại chỗ. */
function DsGioiHan({ ds }: { ds: ReactNode[] }) {
  const [het, setHet] = useState(false);
  const hien = het ? ds : ds.slice(0, TOI_DA_TANG_2);
  return (
    <DsViec>
      {hien}
      {ds.length > hien.length && (
        <button type="button" className="flex min-h-10 w-full cursor-pointer items-center border-0 bg-transparent px-3 text-left text-[13px] font-semibold text-[color:var(--accent)] hover:bg-[color:var(--accent-soft)] max-sm:min-h-[44px]" onClick={() => setHet(true)}>
          {t('+ {n} việc khác', { n: ds.length - hien.length })}
        </button>
      )}
    </DsViec>
  );
}
/**
 * Tầng 2 (mockup ⑭ K3): Bạn đang ở {màn} · {tab} + ≤ 5 việc của tab (việc đang có lên trước, số việc) + "+ n việc khác" + Không làm ở đây.
 * HD-CHI: việc có bước riêng của màn dùng bước đó; mục riêng của màn (Lọc việc, Lớp của tôi…) xếp cuối danh sách — tầng 2 không có lối lên tầng 3.
 */
function Tang2({ hd, manNen, tab2, soViec, ctx }: { hd: HuongDan; manNen: ManHd; tab2: NonNullable<ReturnType<typeof tabDangDung>>; soViec: (v: ViecHd) => number; ctx: Ctx }) {
  const dongMan = viecOManNay(hd, manNen.id);
  const rieng = new Map(dongMan.flatMap((d) => (d.viec ? [[d.viec.id, theCuaDong(d.viec, d.muc)] as const] : [])));
  const ds = tab2.the(hd).map((v) => ({ v: rieng.get(v.id) ?? v, n: soViec(v) })).sort((a, b) => Number(b.n > 0) - Number(a.n > 0));
  const muc = dongMan.filter((d) => !d.viec).map((d) => <DongMuc key={d.muc.id} m={d.muc} ctx={ctx} />);
  return (
    <>
      <BanDangO man={manNen} tenRieng={`${t(manNen.ten)} · ${tab2.ten}`} cau={null} ctx={ctx} />
      {ds.length === 0 && <p className="m-0 text-sm text-slate-400">{t('Tab này chưa có thẻ việc.')}</p>}
      {ds.length + muc.length > 0 && <DsGioiHan ds={[...ds.map(({ v, n }) => <DongCuaThe key={v.id} v={v} n={n} ctx={ctx} />), ...muc]} />}
      <KhongLam man={manNen} ctx={ctx} />
    </>
  );
}

/** Trang này ở tầng 2 / 3. Tầng 3 = màn (V2): Bạn đang ở · Việc làm ở đây · Không làm ở đây; panel đang mở chưa có thẻ: mục panel lên trước (V2 đặc tả 8, 10.1). */
function TrangNay({ tang, hd, manNen, manPanel, tab2, soViec, ctx }: { tang: 2 | 3; hd: HuongDan; manNen: ManHd | null; manPanel: ManHd | null; tab2: ReturnType<typeof tabDangDung>; soViec: (v: ViecHd) => number; ctx: Ctx }) {
  if (tang === 2 && tab2 && manNen) return <Tang2 hd={hd} manNen={manNen} tab2={tab2} soViec={soViec} ctx={ctx} />;
  const dsNen = manNen ? viecOManNay(hd, manNen.id) : [];
  if (manPanel && !manPanel.the) {
    const dsPanel = viecOManNay(hd, manPanel.id);
    const coRoi = new Set(dsPanel.map((d) => d.viec?.id).filter(Boolean));
    const nen = dsNen.filter((d) => !d.viec || !coRoi.has(d.viec.id));
    return (
      <>
        <BanDangO man={manPanel} tren={manNen ? t(manNen.ten) : undefined} ctx={ctx} />
        <KhoiHd ten={t('Việc làm ở đây')}>
          <div className="flex flex-col gap-3">
            {dsPanel.length > 0 && <Nhom ten={t(manPanel.ten)}><DsViec>{dsPanel.map((d) => <DongCuaDong key={d.muc.id} d={d} ctx={ctx} />)}</DsViec></Nhom>}
            {manNen && nen.length > 0 && <Nhom ten={t(manNen.ten)}><DsViec>{nen.map((d) => <DongCuaDong key={d.muc.id} d={d} ctx={ctx} />)}</DsViec></Nhom>}
          </div>
        </KhoiHd>
        <KhongLam man={manPanel} ctx={ctx} />
      </>
    );
  }
  if (!manNen) return <BanDangO man={null} tenRieng={tenVung(ctx.pathname ?? '')} ctx={ctx} />;
  return (
    <>
      <BanDangO man={manNen} ctx={ctx} />
      {dsNen.length > 0 && <KhoiHd ten={t('Việc làm ở đây')}><DsGioiHan ds={dsNen.map((d) => <DongCuaDong key={d.muc.id} d={d} ctx={ctx} />)} /></KhoiHd>}
      <KhongLam man={manNen} ctx={ctx} />
    </>
  );
}

/* ---------------------------------------------------------------- tab Tôi muốn… · Trường hợp */

/**
 * Tôi muốn… (15 mục 4.6, mockup ⑭ K5): bộ lọc nhịp dính đầu (Tất cả + nhịp của vai — thay tab "Tuần của tôi", lời 55) rồi việc theo nhóm = tên tab
 * Công việc + Học viên & lớp + Khác. `moThe`: mở sẵn một thẻ (từ Trường hợp / Có gì mới / tìm) và cuộn tới.
 */
function TabToiMuon({ hd, manNen, moThe, ctx }: { hd: HuongDan; manNen: ManHd | null; moThe: string | null; ctx: Ctx }) {
  const [nhip, setNhip] = useState<string | null>(null);
  useEffect(() => { if (moThe) document.querySelector(`[data-muc="${moThe}"]`)?.scrollIntoView({ block: 'nearest' }); }, [moThe]);
  const ids = nhip ? new Set(hd.tuan?.find((n) => n.nhip === nhip)?.viec) : null;
  const viec = (hd.lam ?? []).filter((v) => !ids || ids.has(v.id));
  return (
    <>
      {!manNen && <BanDangO man={null} tenRieng={tenVung(ctx.pathname ?? '')} ctx={ctx} />}
      {!!hd.tuan?.length && (
        /* Dính đầu thân khi cuộn (thấy đang lọc gì); 375 một hàng vuốt ngang (mockup `.loc-nhip`). */
        <div role="group" aria-label={t('Lọc theo nhịp')} className="loc-hvl sticky -top-4 z-[2] -mx-5 -mt-4 flex flex-wrap gap-1.5 border-b px-5 pb-2.5 pt-3 max-sm:-mx-4 max-sm:flex-nowrap max-sm:overflow-x-auto max-sm:px-4 max-sm:[scrollbar-width:none]"
          style={{ background: 'var(--surface)', borderColor: 'var(--line)' }}>
          {[null, ...hd.tuan.map((n) => n.nhip)].map((n) => (
            <button key={n ?? ''} type="button" aria-pressed={nhip === n} onClick={() => setNhip(n)}
              className="nut-loc h-7 shrink-0 text-[13px] max-sm:h-11">
              {n ? t(n as Khoa) : t('Tất cả')}
            </button>
          ))}
        </div>
      )}
      <DsNhom viec={viec} ctx={ctx} moId={moThe} />
    </>
  );
}
export function DsNhom({ viec, ctx, moDau = false, moId = null }: { viec: ViecHd[]; ctx: Ctx; moDau?: boolean; moId?: string | null }) {
  return (
    <div className="grid gap-4">
      {THU_TAB_HD.map((k) => {
        const ds = viec.filter((v) => tabCuaThe(v) === k);
        return ds.length ? <Nhom key={k} ten={tenTabHd(k, ctx.hd)}><DsViec>{ds.map((v) => <DongCuaThe key={v.id} v={v} ctx={ctx} moSan={v.id === moId || (moDau && v === viec[0])} />)}</DsViec></Nhom> : null;
      })}
    </div>
  );
}

/** Trang Hướng dẫn · Thẻ việc (mockup ⑭ K10b): thẻ MỞ SẴN theo nhóm tab, lưới hai cột ở màn rộng — in ra đủ dòng. */
export function LuoiThe({ viec, ctx }: { viec: ViecHd[]; ctx: Ctx }) {
  return (
    <div className="grid gap-5">
      {THU_TAB_HD.map((k) => {
        const ds = viec.filter((v) => tabCuaThe(v) === k);
        if (!ds.length) return null;
        return (
          <section key={k} className="grid gap-2.5 break-inside-avoid-page" aria-label={tenTabHd(k, ctx.hd)}>
            <h2 className="m-0 text-sm font-semibold text-slate-300">{tenTabHd(k, ctx.hd)}</h2>
            <div className="grid items-start gap-3 xl:grid-cols-2">
              {ds.map((v) => {
                const nhan = nhanVai(v);
                return (
                  <div key={v.id} className="card grid gap-3 px-4 py-3.5 break-inside-avoid" data-muc={v.id}>
                    <h3 className="m-0 flex flex-wrap items-center gap-2 text-[14px] font-bold text-slate-100">{t(v.ten)}{nhan && <ChipVai chu={nhan} />}</h3>
                    <TheViec v={v} ctx={ctx} />
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}

/** Thẻ trường hợp (15 mục 4.7, mockup ⑭ K6b): Máy làm gì · Bạn làm gì · Ai khác nhận việc + link sang thẻ việc (một nguồn chữ). */
function TheTinhHuong({ x, hd, onThe }: { x: TinhHuongHd; hd: HuongDan; onThe?: (id: string) => void }) {
  const the = x.the ? hd.lam?.find((v) => v.id === x.the) : undefined;
  const ds = [
    x.may?.length && { k: 'may', nhan: t('Máy làm gì'), nd: <DsCham ds={x.may} /> },
    x.ban && { k: 'ban', nhan: t('Bạn làm gì'), nd: <ChuThe chu={x.ban} /> },
    x.ai?.length && { k: 'ai', nhan: t('Ai khác nhận việc'), nd: <DsCham ds={x.ai} /> },
  ].filter(Boolean) as DongThe[];
  return (
    <article className="grid gap-3.5" aria-label={t('Trường hợp {ten}', { ten: t(x.ten) })}>
      <dl className="m-0 grid gap-2.5 max-sm:gap-3">
        {ds.map((d) => (
          <div key={d.k} className="grid gap-x-3 text-sm leading-normal max-sm:grid-cols-1 max-sm:gap-y-px max-sm:text-[14px] sm:grid-cols-[108px_minmax(0,1fr)]">
            <dt className="text-[13px] font-semibold leading-[1.6] text-slate-500">{d.nhan}</dt>
            <dd className="m-0 min-w-0 text-slate-100">{d.nd}</dd>
          </div>
        ))}
      </dl>
      {the && onThe && (
        <div className="border-t pt-3" style={{ borderColor: 'var(--line)' }}>
          <button type="button" className="link inline-flex min-h-[44px] cursor-pointer items-center border-0 bg-transparent p-0 text-[13px] font-semibold sm:min-h-[30px]" onClick={() => onThe(the.id)}>{t('Thẻ việc: {ten}', { ten: t(the.ten) })}</button>
        </div>
      )}
    </article>
  );
}
export function TabTruongHop({ hd, ctx, onThe, moDau = true }: { hd: HuongDan; ctx: Ctx; onThe?: (id: string) => void; moDau?: boolean }) {
  if (!hd.tinhHuong?.length) return <p className="m-0 text-sm text-slate-400">{t('Vai này chưa có trường hợp nào.')}</p>;
  return <DsViec>{hd.tinhHuong.map((x, i) => <DongGap key={x.id} id={x.id} ten={t(x.ten)} moSan={moDau && i === 0} ctx={ctx}><TheTinhHuong x={x} hd={hd} onThe={onThe} /></DongGap>)}</DsViec>;
}

/** Đang gõ ô tìm (mockup ⑭ K7): một danh sách — việc (theo nhóm) · Màn này · Trường hợp · việc của vai khác; không có gì → câu + Xem mọi việc. */
export function KetQuaTim({ kq, q, ctx, onXemHet, onThe }: { kq: { viec: ViecHd[]; muc: MucHd[]; tinhHuong: TinhHuongHd[]; vaiKhac: ViecVaiKhac[] }; q: string; ctx: Ctx; onXemHet: () => void; onThe?: (id: string) => void }) {
  const n = kq.viec.length + kq.muc.length + kq.tinhHuong.length;
  return (
    <>
      {n > 0 ? <p className="m-0 text-[13px] font-medium text-slate-400" aria-live="polite">{t('{n} mục khớp', { n })}</p>
        : <p className="m-0 text-[14px] text-slate-400" aria-live="polite">{t('Không có việc của bạn khớp “{q}”.', { q: q.trim() })}</p>}
      {kq.viec.length > 0 && <DsNhom viec={kq.viec} ctx={ctx} moDau />}
      {kq.muc.length > 0 && <Nhom ten={t('Màn này')}><DsViec>{kq.muc.map((m, i) => <DongMuc key={m.id} m={m} ctx={ctx} moSan={!kq.viec.length && i === 0} />)}</DsViec></Nhom>}
      {kq.tinhHuong.length > 0 && (
        <Nhom ten={t('Trường hợp')}>
          <DsViec>{kq.tinhHuong.map((x) => <DongGap key={x.id} id={x.id} ten={t(x.ten)} ctx={ctx}><TheTinhHuong x={x} hd={ctx.hd} onThe={onThe} /></DongGap>)}</DsViec>
        </Nhom>
      )}
      {kq.vaiKhac.length > 0 && (
        <Nhom ten={t('Việc của vai khác')}>
          <div className="rounded-[10px] border px-3" style={{ borderColor: 'var(--line)' }}>
            {kq.vaiKhac.map((v, i) => (
              <div key={v.ten} className={`grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-3 py-2.5 text-sm ${i ? 'border-t' : ''}`} style={{ borderColor: 'var(--line)' }}>
                <span className="text-slate-200">{t(v.ten)}</span><span className="text-right text-[13px] text-slate-500">{t(v.cua)}</span>
              </div>
            ))}
          </div>
        </Nhom>
      )}
      {n === 0 && <div><button type="button" className="btn btn-sm min-h-[44px] sm:min-h-[32px]" onClick={onXemHet}>{t('Xem mọi việc của bạn')}</button></div>}
    </>
  );
}
