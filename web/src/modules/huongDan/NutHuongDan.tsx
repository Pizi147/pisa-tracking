import { useEffect, useId, useMemo, useState, type ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { KhungPanel, panelHdTren } from '../../ui/KhungPanel.tsx';
import { phimHangTab } from '../../ui/HangTab.tsx';
import { ToKhop } from '../../ui/ToKhop.tsx';
import { ChuDam } from '../../ui/ui.tsx';
import { CHIP_TRON } from '../../ui/Nhan.tsx';
import { useSession } from '../../lib/session.tsx';
import {
  HUONG_DAN, TEN_VAI_HD, VAI_CO_NOI_DUNG, coXemVaiKhac, locVai, manCuaDuong, manCuaPanel, manTheoId, mucCuaViec, timHd, viecOManNay,
  type ChiChoToi, type DongHd, type HuongDan, type ManHd, type MucHd, type NhomHd, type VaiHd, type ViecHd, type ViecVaiKhac,
} from '@shared/huongDan/index.ts';
import { KHU_VUC } from '@shared/domain/dieuHuong.ts';
import { t, type Khoa } from '@shared/i18n/index.ts';
import { chiChoToi } from './chiChoToi.tsx';
import { useDaXemHd, useVaiHd } from './MucHuongDan.tsx';

/**
 * HD-V2 — PANEL HƯỚNG DẪN (đặc tả `2026-11-05-huong-dan-v2/de-xuat.md` mục 3, 8, 10; mockup `thiet-ke/v14/huong-dan.html`): mở từ nút "?" trên thanh trên.
 * Ba tab Màn này · Tôi muốn… · Tuần của tôi + ô tìm (lọc cả ba thành một danh sách). `longTrong`: KHÔNG đóng panel đang làm (Case, Nhập điểm) —
 * hướng dẫn mở chồng, Esc / ✕ chỉ đóng hướng dẫn, chữ đang gõ còn nguyên. Nội dung là dữ liệu tĩnh: mở panel không gọi API (trừ ghi "đã xem" lần đầu).
 */
type Tab = 'man' | 'lam' | 'tuan';
const TEN_TAB: Record<Tab, string> = { man: t('Màn này'), lam: t('Tôi muốn…'), tuan: t('Tuần của tôi') };
const TEN_NHOM: Record<NhomHd, string> = { diem: t('Điểm'), case: t('Case và PA'), hv: t('Học viên và lớp'), lich: t('Lịch Test'), duyet: t('Duyệt'), khac: t('Khác') };
const NHOM: NhomHd[] = ['diem', 'case', 'hv', 'lich', 'duyet', 'khac'];

/** Tên vùng trang khi màn chưa có mục riêng (khớp thanh điều hướng — "Phân tích"). */
const tenVung = (p: string) => KHU_VUC.filter((k) => k.to !== '/' && (p === k.to || p.startsWith(`${k.to}/`)))[0]?.label ?? null;

export function PanelHuongDanManNay({ onDong }: { onDong: () => void }) {
  const { pathname } = useLocation();
  const { session } = useSession();
  const { cuaToi, macDinh } = useVaiHd();
  const { chuaXem, ghi } = useDaXemHd();
  useEffect(() => { if (chuaXem) void ghi(); }, []);   // eslint-disable-line react-hooks/exhaustive-deps -- ghi "đã xem" một lần khi mở
  const [vai, setVai] = useState<VaiHd>(macDinh);
  /* Panel làm việc trên cùng LÚC BẤM "?" (Case / Nhập điểm) — đọc một lần. */
  const [panel] = useState(panelHdTren);
  /* Đặc tả 3.6: phần Chỉ GVCN / GV Speaking theo cờ phiên; xem vai khác (QL xem GV) thấy đủ, có nhãn. */
  const hd = useMemo(() => (vai === cuaToi ? locVai(HUONG_DAN[vai]!, { gvcn: !!session?.laGvcn, s: !!session?.coS }) : HUONG_DAN[vai]!), [vai, cuaToi, session?.laGvcn, session?.coS]);
  const manNen = manCuaDuong(hd, pathname);
  const manPanel = manCuaPanel(hd, panel);
  const [tab, setTab] = useState<Tab>(manNen || manPanel ? 'man' : 'lam');
  const [q, setQ] = useState('');
  const kq = useMemo(() => timHd(hd, q, t, manNen?.id), [hd, q, manNen]);
  const onChi = (c: ChiChoToi) => { onDong(); chiChoToi(c); };
  const idThan = useId();

  const dau = (
    <div className="flex flex-col gap-3 pt-3 max-sm:gap-2.5 max-sm:pt-1.5 sm:px-1">
      <div className="flex min-h-9 items-center gap-2.5">
        <h2 className="m-0 whitespace-nowrap text-[17px] font-bold text-slate-100">{t('Hướng dẫn')}</h2>
        {coXemVaiKhac(cuaToi) && VAI_CO_NOI_DUNG.length > 1 ? (
          /* Một ô vừa nói vai đang xem vừa đổi được (ghi chú v14 mục 4). */
          <select className="field o-chon-vai h-[30px] w-auto py-0 pl-2.5 pr-7 text-[13px] max-sm:h-11 max-sm:text-[15px]" aria-label={t('Xem vai khác')} title={t('Xem vai khác')}
            value={vai} onChange={(e) => { setVai(e.target.value as VaiHd); setQ(''); }}>
            {VAI_CO_NOI_DUNG.map((v) => <option key={v} value={v}>{t('Vai: {vai}', { vai: TEN_VAI_HD[v] })}</option>)}
          </select>
        ) : <span className={`${CHIP_TRON} px-2.5 text-slate-400`} style={{ background: 'var(--surface-2)' }}>{TEN_VAI_HD[vai]}</span>}
        <button type="button" className="btn btn-sm btn-ghost ml-auto min-h-[44px] min-w-[44px] justify-center sm:min-h-[32px] sm:min-w-[32px]" onClick={onDong} aria-label={t('Đóng')}>✕</button>
      </div>
      <label className="relative block">
        <svg aria-hidden viewBox="0 0 16 16" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" fill="none" stroke="var(--text-faint)" strokeWidth="1.5" strokeLinecap="round">
          <circle cx="7" cy="7" r="4.5" /><path d="m10.5 10.5 3 3" /></svg>
        <input type="search" autoComplete="off" className="field pl-[34px] pr-10 [&::-webkit-search-cancel-button]:hidden" value={q} onChange={(e) => setQ(e.target.value)}
          placeholder={t('Tìm trong hướng dẫn')} aria-label={t('Tìm trong hướng dẫn')} />
        {q && <button type="button" className="absolute right-0 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-md border-0 bg-transparent text-[15px] text-slate-400 sm:right-1 sm:h-8 sm:w-8"
          aria-label={t('Xoá chữ tìm')} onClick={() => setQ('')}>✕</button>}
      </label>
      {/* Hàng tab gạch chân (HangTab — cùng dáng, cùng phím ← →); đang tìm: không tab nào chọn, thân là một danh sách. */}
      <div role="tablist" aria-label={t('Phần hướng dẫn')} onKeyDown={phimHangTab} className="-mx-4 flex gap-0.5 px-2 sm:-mx-5 sm:px-3.5">
        {(Object.keys(TEN_TAB) as Tab[]).map((k) => {
          const chon = !kq && tab === k;
          return (
            <button key={k} type="button" role="tab" aria-selected={chon} aria-controls={idThan} tabIndex={chon || (kq && k === tab) ? 0 : -1}
              onClick={() => { setTab(k); setQ(''); }}
              className={`-mb-px min-h-[44px] cursor-pointer appearance-none whitespace-nowrap border-0 border-b-2 bg-transparent px-2.5 text-[15px] max-sm:flex-1 sm:min-h-0 sm:px-3 sm:py-2.5 sm:text-sm ${chon
                ? 'border-[color:var(--accent)] font-semibold text-slate-100' : 'border-transparent font-medium text-slate-400 hover:text-slate-100'}`}>{TEN_TAB[k]}</button>
          );
        })}
      </div>
    </div>
  );

  const ctx: Ctx = { hd, q: kq ? q : '', onChi, onDong };
  let than: ReactNode;
  if (kq) than = <KetQuaTim kq={kq} q={q} ctx={ctx} onXemHet={() => { setQ(''); setTab('lam'); }} />;
  else if (tab === 'man') than = <TabManNay hd={hd} manNen={manNen} manPanel={manPanel} pathname={pathname} ctx={ctx} />;
  else if (tab === 'lam') than = <TabToiMuon hd={hd} manNen={manNen} pathname={pathname} ctx={ctx} />;
  else than = <TabTuan hd={hd} ctx={ctx} />;

  return (
    <KhungPanel tieuDe={t('Hướng dẫn')} anDau longTrong tabs={dau} vungTab={{ id: idThan, nhan: kq ? t('Tìm trong hướng dẫn') : TEN_TAB[tab] }} onDong={onDong}
      chan={{ huy: null, trai: <Link to="/huong-dan" className="link inline-flex min-h-[44px] items-center text-[13px] font-semibold max-sm:text-sm sm:min-h-6" onClick={onDong}>{t('Mở trang Hướng dẫn ›')}</Link> }}>
      <div key={`${vai}-${tab}-${kq ? 'tim' : ''}`} className="flex flex-col gap-[18px] pb-1 pt-4 max-sm:gap-[22px] sm:px-1">{than}</div>
    </KhungPanel>
  );
}

/** `inDuoc`: trang Hướng dẫn — thân mỗi việc luôn có trong cây (ẩn khi gập), để in cả trang (`print:`). */
export type Ctx = { hd: HuongDan; q: string; onChi: (c: ChiChoToi) => void; onDong: () => void; inDuoc?: boolean };

/* ---------------------------------------------------------------- khối dùng chung */

const H3 = 'm-0 flex items-center gap-2 text-[15px] font-bold leading-tight text-slate-100 before:h-[18px] before:w-[3px] before:shrink-0 before:rounded-sm before:bg-[color:var(--accent)]';
export function KhoiHd({ ten, children }: { ten: string; children: ReactNode }) {
  return <section className="flex flex-col gap-2"><h3 className={H3}>{ten}</h3>{children}</section>;
}
export function Nhom({ ten, children }: { ten: string; children: ReactNode }) {
  return <div><h4 className="m-0 mb-1.5 ml-0.5 text-[13px] font-semibold text-slate-400">{ten}</h4>{children}</div>;
}
export const DsViec = ({ children }: { children: ReactNode }) => (
  <div className="overflow-hidden rounded-[10px] border [&>*+*]:border-t" style={{ borderColor: 'var(--line)' }}>{children}</div>
);

/** Khối 1 · Bạn đang ở: tên màn + một câu + Trước / Sau (bấm được, đổi trang). Panel đang mở: "trên {màn nền}", không Trước / Sau. */
export function BanDangO({ man, tenRieng, tren, trang = false, ctx }: { man: ManHd | null; tenRieng?: string | null; tren?: string; /** trang Hướng dẫn: chỉ tên màn, không chữ "Bạn đang ở" */ trang?: boolean; ctx: Ctx }) {
  const ten = man ? t(man.ten) : tenRieng;
  const d = man?.dangO;
  const luong = d && [d.truoc && { nhan: t('Trước'), ...d.truoc }, d.sau && { nhan: t('Sau'), ...d.sau }].filter(Boolean) as { nhan: string; chu: Khoa; duong: string }[] | undefined;
  return (
    <div className="flex flex-col gap-1">
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
        {!trang && <span className="text-[13px] font-medium text-slate-500">{t('Bạn đang ở')}</span>}
        {ten && <h3 className="m-0 text-[17px] font-bold text-slate-100">{ten}</h3>}
        {tren && <span className="text-[13px] font-medium text-slate-400">{t('trên {man}', { man: tren })}</span>}
      </div>
      {(d || !man) && <p className="m-0 text-sm text-slate-400">{d ? t(d.cau) : t('Màn này chưa có hướng dẫn riêng.')}</p>}
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

/** Khối 3 · Không làm ở đây: đích đúng chỗ (link) hoặc chữ nhạt "việc của QL". */
export function KhongLam({ man, ctx }: { man: ManHd; ctx: Ctx }) {
  if (!man.khongLam?.length) return null;
  return (
    <KhoiHd ten={t('Không làm ở đây')}>
      <div className="grid">
        {man.khongLam.map((k, i) => (
          <div key={k.ten} className={`grid gap-x-3 gap-y-1 text-sm sm:grid-cols-[minmax(0,1fr)_auto] sm:items-baseline ${i ? 'border-t py-2.5 sm:py-[9px]' : 'pb-2.5 pt-0.5 sm:pb-[9px]'}`} style={{ borderColor: 'var(--line)' }}>
            <span className="text-slate-200">{t(k.ten)}</span>
            {k.den ? <Link to={k.den.duong} onClick={ctx.onDong} className="link -my-2.5 inline-flex min-h-[44px] items-center text-[13px] font-semibold sm:my-0 sm:min-h-0 sm:justify-end">{t(k.den.chu)} ›</Link>
              : <span className="text-[13px] text-slate-500 sm:text-right">{k.cua && t(k.cua)}</span>}
          </div>
        ))}
      </div>
    </KhoiHd>
  );
}

const NUT_CHI = 'btn btn-sm min-h-[44px] gap-1.5 sm:min-h-[32px] print:hidden';
const tenLoiTat = (hd: HuongDan, v: ViecHd) => [
  ...(v.loiTat ?? []).map((id) => manTheoId(hd, id)).filter((m): m is ManHd => !!m && !m.panel).map((m) => t(m.ten)),
  ...(v.tatThem ?? []).map((x) => t(x)),
];

/**
 * Một dòng việc gập / mở — MỘT kiểu ở cả ba tab (G4). Gập: tên + dòng nhạt = đường lối chính (khi màn này không phải lối chính) + nhãn vai.
 * Mở: ô Lối chính (Đi tới ›) · bước · Lối tắt · Chỉ cho tôi. `kieu = 'man'`: ô Lối chính chỉ khi màn này là lối tắt, kèm "Ở đây mở cùng …".
 */
function DongViec({ muc, viec, kieu, tat = false, moSan = false, ctx }: { muc: MucHd; viec?: ViecHd; kieu: 'man' | 'lam'; tat?: boolean; moSan?: boolean; ctx: Ctx }) {
  const [mo, setMo] = useState(moSan);
  const id = useId();
  const coO = !!viec && (kieu === 'lam' || tat);
  const nho = viec && (kieu === 'lam' || tat) ? t(viec.loiChinh.chu) : null;
  const nhan = viec?.chiGvcn ? t('Chỉ GVCN') : viec?.chiS ? t('GV Speaking') : null;
  const tatDs = viec && kieu === 'lam' ? tenLoiTat(ctx.hd, viec) : [];
  return (
    <div className={mo ? 'bg-[color:var(--surface-2)]' : ''} data-muc={muc.id}>
      <button type="button" aria-expanded={mo} aria-controls={id} onClick={() => setMo(!mo)}
        className="grid min-h-[44px] w-full cursor-pointer appearance-none grid-cols-[16px_minmax(0,1fr)_auto] items-start gap-x-2 border-0 bg-transparent px-3 py-[9px] text-left text-slate-100 hover:bg-[color:var(--accent-soft)]">
        <svg aria-hidden viewBox="0 0 16 16" className={`mt-[3px] h-4 w-4 transition-transform duration-150 motion-reduce:transition-none ${mo ? '' : '-rotate-90'}`} fill="none" stroke="var(--text-faint)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M4 6l4 4 4-4" /></svg>
        <span className="grid min-w-0 gap-px">
          <b className="text-[15px] font-semibold leading-snug">{ctx.q ? <ToKhop chu={t(muc.ten)} q={ctx.q} /> : t(muc.ten)}</b>
          {nho && !mo && <small className="text-[13px] leading-snug text-slate-500">{nho}</small>}
        </span>
        {nhan ? <span className="mt-px whitespace-nowrap rounded-md border px-1.5 py-px text-xs font-semibold text-slate-400" style={{ borderColor: 'var(--line-strong)' }}>{nhan}</span> : <span />}
      </button>
      {(mo || ctx.inDuoc) && (
        <div id={id} className={`gap-2.5 pb-3 pl-9 pr-3.5 ${mo ? 'grid' : 'hidden print:grid'}`}>
          {coO && viec && (
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 rounded-lg border px-2.5 py-2" style={{ borderColor: 'var(--line-strong)', background: 'var(--surface)' }}>
              <span className="basis-full text-xs font-medium text-slate-500">{t('Lối chính')}</span>
              <b className="text-sm font-semibold text-slate-100">{t(viec.loiChinh.chu)}</b>
              {viec.loiChinh.duong && <Link to={viec.loiChinh.duong} onClick={ctx.onDong} className="link -my-2.5 ml-auto inline-flex min-h-[44px] items-center whitespace-nowrap px-1 text-[13px] font-semibold sm:my-0 sm:min-h-6 sm:px-0">{t('Đi tới ›')}</Link>}
              {kieu === 'man' && <span className="basis-full text-[13px] text-slate-400">{t('Ở đây {cung}', { cung: t(viec.cung ?? 'mở cùng chỗ.') })}</span>}
            </div>
          )}
          {/* Vòng số bước (như `Khoi` của KhungPanel) — không phải chip. */}
          <ol className="m-0 grid list-none gap-1.5 p-0 [counter-reset:b]">
            {muc.buoc.map((b) => (
              <li key={b} className="grid grid-cols-[20px_minmax(0,1fr)] gap-2 text-sm leading-normal text-slate-300 [counter-increment:b] before:mt-px before:h-5 before:w-5 before:rounded-[50%] before:bg-doing-bg before:text-center before:text-xs before:font-bold before:leading-5 before:text-doing before:content-[counter(b)] [&_strong]:font-semibold [&_strong]:text-slate-100">
                <span><ChuDam chu={t(b)} /></span>
              </li>
            ))}
          </ol>
          {tatDs.length > 0 && viec && <p className="m-0 text-[13px] leading-snug text-slate-500">{t('Lối tắt: {ds} — {cung}', { ds: tatDs.join(', '), cung: t(viec.cung ?? 'mở cùng chỗ.') })}</p>}
          {muc.chi && (
            <div><button type="button" className={NUT_CHI} onClick={() => ctx.onChi(muc.chi!)}>
              <svg aria-hidden viewBox="0 0 16 16" className="h-[15px] w-[15px]" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="8" cy="8" r="5.5" /><circle cx="8" cy="8" r="2" /><path d="M8 1v2M8 13v2M1 8h2M13 8h2" /></svg>
              {t('Chỉ cho tôi')}</button></div>
          )}
        </div>
      )}
    </div>
  );
}

const DongCuaDong = ({ d, i, ctx }: { d: DongHd; i: number; ctx: Ctx }) => <DongViec muc={d.muc} viec={d.viec} kieu="man" tat={d.tat} moSan={i === 0} ctx={ctx} />;

/* ---------------------------------------------------------------- tab */

/** Màn này: Bạn đang ở · Việc làm ở đây (việc đầu mở) · Không làm ở đây. Panel đang mở: mục panel lên trước, rồi màn nền (đặc tả 8, 10.1). */
function TabManNay({ hd, manNen, manPanel, pathname, ctx }: { hd: HuongDan; manNen: ManHd | null; manPanel: ManHd | null; pathname: string; ctx: Ctx }) {
  const dsNen = manNen ? viecOManNay(hd, manNen.id) : [];
  if (manPanel) {
    const dsPanel = viecOManNay(hd, manPanel.id);
    const coRoi = new Set(dsPanel.map((d) => d.viec?.id).filter(Boolean));
    const nen = dsNen.filter((d) => !d.viec || !coRoi.has(d.viec.id));   // việc đã có ở panel không lặp ở màn nền
    return (
      <>
        <BanDangO man={manPanel} tren={manNen ? t(manNen.ten) : undefined} ctx={ctx} />
        <KhoiHd ten={t('Việc làm ở đây')}>
          <div className="flex flex-col gap-3">
            {dsPanel.length > 0 && <Nhom ten={t(manPanel.ten)}><DsViec>{dsPanel.map((d, i) => <DongCuaDong key={d.muc.id} d={d} i={i} ctx={ctx} />)}</DsViec></Nhom>}
            {manNen && nen.length > 0 && <Nhom ten={t(manNen.ten)}><DsViec>{nen.map((d) => <DongCuaDong key={d.muc.id} d={d} i={1} ctx={ctx} />)}</DsViec></Nhom>}
          </div>
        </KhoiHd>
        <KhongLam man={manPanel} ctx={ctx} />
      </>
    );
  }
  if (!manNen) return <BanDangO man={null} tenRieng={tenVung(pathname)} ctx={ctx} />;
  return (
    <>
      <BanDangO man={manNen} ctx={ctx} />
      {dsNen.length > 0 && <KhoiHd ten={t('Việc làm ở đây')}><DsViec>{dsNen.map((d, i) => <DongCuaDong key={d.muc.id} d={d} i={i} ctx={ctx} />)}</DsViec></KhoiHd>}
      <KhongLam man={manNen} ctx={ctx} />
    </>
  );
}

/** Trang Hướng dẫn · Theo màn: mọi màn của vai (Bạn đang ở · Việc làm ở đây · Không làm ở đây), cùng khối với tab Màn này của panel. */
export function TheoMan({ hd, ctx }: { hd: HuongDan; ctx: Ctx }) {
  return (
    <div className="grid gap-7">
      {hd.man.filter((m) => !m.panel).map((m) => {
        const ds = viecOManNay(hd, m.id);
        return (
          <section key={m.id} aria-label={t(m.ten)} className="grid gap-[18px] break-inside-avoid-page">
            <BanDangO man={m} trang ctx={ctx} />
            {ds.length > 0 && <KhoiHd ten={t('Việc làm ở đây')}><DsViec>{ds.map((d) => <DongViec key={d.muc.id} muc={d.muc} viec={d.viec} kieu="man" tat={d.tat} ctx={ctx} />)}</DsViec></KhoiHd>}
            <KhongLam man={m} ctx={ctx} />
          </section>
        );
      })}
    </div>
  );
}

/** Tôi muốn…: việc theo nhóm cố định, nhóm trống ẩn. Màn chưa có mục riêng: dòng "Bạn đang ở" trên đầu (mockup E). Vai chưa chuyển: việc hằng tuần cũ. */
function TabToiMuon({ hd, manNen, pathname, ctx }: { hd: HuongDan; manNen: ManHd | null; pathname: string; ctx: Ctx }) {
  return (
    <>
      {!manNen && <BanDangO man={null} tenRieng={tenVung(pathname)} ctx={ctx} />}
      {hd.lam ? <DsNhom viec={hd.lam} ctx={ctx} /> : <DsViec>{hd.viec.map((m, i) => <DongViec key={m.id} muc={m} kieu="lam" moSan={i === 0} ctx={ctx} />)}</DsViec>}
    </>
  );
}
export function DsNhom({ viec, ctx, moDau = false }: { viec: ViecHd[]; ctx: Ctx; moDau?: boolean }) {
  return (
    <div className="grid gap-4">
      {NHOM.map((n) => {
        const ds = viec.filter((v) => v.nhom === n);
        return ds.length ? <Nhom key={n} ten={TEN_NHOM[n]}><DsViec>{ds.map((v) => <DongViec key={v.id} muc={mucCuaViec(v)} viec={v} kieu="lam" moSan={moDau && v === viec[0]} ctx={ctx} />)}</DsViec></Nhom> : null;
      })}
    </div>
  );
}

/** Tuần của tôi: nhóm theo nhịp, mỗi việc gập / mở TẠI CHỖ (Lối chính + bước — 10.3). Vai chưa chuyển: việc hằng tuần cũ, "khi" là nhịp. */
export function TabTuan({ hd, ctx }: { hd: HuongDan; ctx: Ctx }) {
  if (!hd.lam || !hd.tuan) return <DsViec>{hd.viec.map((m) => <DongViec key={m.id} muc={m} kieu="lam" ctx={ctx} />)}</DsViec>;
  return (
    <div className="grid gap-4">
      {hd.tuan.map((n) => (
        <Nhom key={n.nhip} ten={t(n.nhip)}>
          <DsViec>{n.viec.map((id) => hd.lam!.find((v) => v.id === id)).filter((v): v is ViecHd => !!v).map((v) => <DongViec key={v.id} muc={mucCuaViec(v)} viec={v} kieu="lam" ctx={ctx} />)}</DsViec>
        </Nhom>
      ))}
    </div>
  );
}

/** Đang gõ ô tìm: một danh sách (gộp ba tab, bỏ trùng), có nhóm; việc vai khác một dòng "… — việc của QL"; không có gì của mình → câu + Xem mọi việc. */
export function KetQuaTim({ kq, q, ctx, onXemHet }: { kq: { viec: ViecHd[]; muc: MucHd[]; vaiKhac: ViecVaiKhac[] }; q: string; ctx: Ctx; onXemHet: () => void }) {
  const n = kq.viec.length + kq.muc.length;
  return (
    <>
      {n > 0 ? <p className="m-0 text-[13px] font-medium text-slate-400" aria-live="polite">{t('{n} việc khớp', { n })}</p>
        : <p className="m-0 text-[15px] text-slate-400" aria-live="polite">{t('Không có việc của bạn khớp “{q}”.', { q: q.trim() })}</p>}
      {kq.viec.length > 0 && <DsNhom viec={kq.viec} ctx={ctx} moDau />}
      {kq.muc.length > 0 && <Nhom ten={t('Màn này')}><DsViec>{kq.muc.map((m, i) => <DongViec key={m.id} muc={m} kieu="man" moSan={!kq.viec.length && i === 0} ctx={ctx} />)}</DsViec></Nhom>}
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
