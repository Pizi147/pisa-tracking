import { Fragment, useState } from 'react';
import { t } from '@shared/i18n/index.ts';
import { HANG_FT, laMeetingCx, type HangFt, type MocSos, type MocThuong, type MucSos, type OMoc } from '@shared/domain/index.ts';
import type { DuLieuCauHinh, LuuDs } from '../CauHinhCaseSos.tsx';
import { DanhMucViec } from './BangDanhSach.tsx';
import { Bang, OBang, type CotBang } from '../../../ui/Bang.tsx';

/* Bảng chung (Bang) — tiêu đề chỉ chữ (G9); hàng tự vẽ (`hangRieng`) để mở khung sửa ngay dưới hàng. */
const COT_FT: CotBang[] = [
  { key: 'moc', nhan: t('Mốc'), kieu: 'chu', rong: 104 },
  { key: 's1', nhan: 'SOS 1', kieu: 'chu' }, { key: 's2', nhan: 'SOS 2', kieu: 'chu' }, { key: 's3', nhan: 'SOS 3', kieu: 'chu', linhHoat: true },
];
const COT_THUONG: CotBang[] = [
  { key: 'moc', nhan: t('Mốc'), kieu: 'chu', rong: 160 }, { key: 'case', nhan: 'Case', kieu: 'chu', rong: 150 },
  { key: 'pa', nhan: t('PA quy chế'), kieu: 'chu', linhHoat: true }, { key: 'viec', nhan: t('Việc phối hợp'), kieu: 'chu', rong: 190 },
];

/**
 * MỐC SOS (CAU-HINH-CASE-SOS, mockup K5–K7). FT: bảng MT1…MT5+, RF × SOS 1 · 2 · 3 — mỗi ô PA quy chế + việc; bấm ô → khung sửa ngay dưới hàng
 * (Loại PA + Đến khi, tick việc, "Cũng áp cho" hàng khác cùng mức) — "Lưu n ô". Lớp thường: 6 mốc, ô số sửa tại chỗ (Enter lưu), việc như FT.
 */
type ChungProps = { duLieu: DuLieuCauHinh; chiXem: boolean; luuDs: LuuDs };
const TEN_HANG: Record<HangFt, string> = { mt1: 'MT1', mt2: 'MT2', mt3: 'MT3', mt4: 'MT4', mt5: t('MT5 trở đi'), rf: 'RF' };
const DEN: Record<string, string> = { one_month: t('1 tháng'), until_next_mt: t('đến MT kế'), until_exam: t('đến lúc thi') };

function NoiDungO({ o, moc, tenPa }: { o: OMoc; moc: MocSos; tenPa: (ma: string) => string }) {
  return (
    <>
      <div className={`flex items-center gap-1.5 text-sm font-semibold ${o.pa ? 'text-slate-100' : 'font-medium text-slate-500'}`}>
        <span className="rounded border px-1 text-[12px] font-bold text-[color:var(--accent)]" style={{ borderColor: 'var(--accent)' }}>PA</span>
        {o.pa ? `${tenPa(o.pa.loai)} · ${DEN[o.pa.den] ?? o.pa.den}` : t('Không có PA quy chế')}
      </div>
      <ul className="m-0 mt-1.5 grid list-none gap-0.5 p-0 text-[13px] text-slate-300">
        {o.viec.length ? o.viec.map((ma) => <li key={ma}>· {moc.viec.find((v) => v.ma === ma)?.ten ?? ma}</li>) : <li className="text-slate-500">{t('Không có việc phối hợp')}</li>}
      </ul>
    </>
  );
}

/** Khung sửa ô: PA quy chế (FT) + tick việc + "Cũng áp cho". `luu` nhận ô mới + các khoá ô áp cùng. */
function KhungO({ tieuDe, o, moc, duLieu, coPa, cungAp, onThoi, onLuu, busy }: {
  tieuDe: string; o: OMoc; moc: MocSos; duLieu: DuLieuCauHinh; coPa: boolean;
  cungAp?: { key: string; ten: string }[]; onThoi: () => void; onLuu: (o: OMoc, cung: string[]) => void; busy: boolean;
}) {
  const [nhap, setNhap] = useState<OMoc>(o);
  const [cung, setCung] = useState<string[]>([]);
  const paGv = duLieu.phuong_an.du_lieu.muc.filter((m) => m.nhom === 'gv_tu_lam' && (!m.an || m.ma === o.pa?.loai));
  const viecChon = moc.viec.filter((v) => !v.an || o.viec.includes(v.ma));
  const doi = JSON.stringify(nhap) !== JSON.stringify(o) || cung.length > 0;
  return (
    <div className="grid gap-3.5 rounded-lg border bg-[color:var(--surface-2)] p-3.5" style={{ borderColor: 'var(--accent)' }}
      onKeyDown={(e) => { if (e.key === 'Escape') onThoi(); }}>
      <div className="text-[15px] font-bold text-slate-100">{tieuDe}</div>
      {coPa && (
        <div className="grid gap-2 sm:grid-cols-2">
          <label className="grid gap-1 text-[13px] font-medium text-slate-400">{t('Loại PA quy chế')}
            <select className="field" value={nhap.pa?.loai ?? ''} onChange={(e) => setNhap({ ...nhap, pa: e.target.value ? { loai: e.target.value, den: nhap.pa?.den ?? 'one_month' } : null })}>
              <option value="">{t('Không có PA quy chế')}</option>
              {paGv.map((m) => <option key={m.ma} value={m.ma}>{m.ten}</option>)}
            </select></label>
          <label className="grid gap-1 text-[13px] font-medium text-slate-400">{t('Đến khi')}
            <select className="field" value={nhap.pa?.den ?? 'one_month'} disabled={!nhap.pa} onChange={(e) => setNhap({ ...nhap, pa: nhap.pa && { ...nhap.pa, den: e.target.value as NonNullable<OMoc['pa']>['den'] } })}>
              {Object.entries(DEN).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select></label>
        </div>
      )}
      <fieldset className="m-0 grid gap-1.5 border-0 p-0">
        <legend className="mb-1 text-[13px] font-semibold text-slate-300">{t('Việc phối hợp')} · {nhap.viec.length}/{viecChon.length}</legend>
        {viecChon.map((v) => (
          <label key={v.ma} className="flex min-h-[44px] items-center gap-2.5 text-sm text-slate-100 sm:min-h-0">
            <input type="checkbox" checked={nhap.viec.includes(v.ma)}
              onChange={(e) => setNhap({ ...nhap, viec: e.target.checked ? moc.viec.map((x) => x.ma).filter((ma) => ma === v.ma || nhap.viec.includes(ma)) : nhap.viec.filter((x) => x !== v.ma) })} />
            <span>{v.ten}{v.an && <span className="text-slate-500"> · {t('đã ẩn')}</span>}</span>
            <span className="ml-auto text-[12px] text-slate-500">{v.hanNgay ? t('{n} ngày', { n: v.hanNgay }) : t('không hạn')}{v.buocTvv || laMeetingCx(v.ma) && v.buocTvv ? ` · ${t('→ TVV')}` : ''}</span>
          </label>
        ))}
      </fieldset>
      {!!cungAp?.length && (
        <div className="grid gap-1.5">
          <span className="text-[13px] font-semibold text-slate-300">{t('Cũng áp cho')}</span>
          <div className="flex flex-wrap gap-2">
            {cungAp.map((c) => (
              <label key={c.key} className="inline-flex min-h-[44px] items-center gap-2 rounded-lg border px-3 text-sm text-slate-100 sm:min-h-[34px]" style={{ borderColor: 'var(--line-strong)' }}>
                <input type="checkbox" checked={cung.includes(c.key)} onChange={(e) => setCung(e.target.checked ? [...cung, c.key] : cung.filter((x) => x !== c.key))} />{c.ten}
              </label>
            ))}
          </div>
        </div>
      )}
      <div className="flex flex-wrap items-center gap-2">
        {doi && <span className="text-[13px] font-semibold text-soon">● {t('Chưa lưu · {n} ô', { n: 1 + cung.length })}</span>}
        <span className="ml-auto flex gap-2">
          <button type="button" className="btn btn-ghost min-h-[44px] sm:min-h-0" onClick={onThoi}>{t('Thôi')}</button>
          <button type="button" className="btn btn-primary min-h-[44px] sm:min-h-0" disabled={!doi || busy} onClick={() => onLuu(nhap, cung)}>
            {busy ? t('Đang lưu…') : t('Lưu {n} ô', { n: 1 + cung.length })}</button>
        </span>
      </div>
    </div>
  );
}

export function MocSosFt({ duLieu, chiXem, luuDs }: ChungProps) {
  const moc = duLieu.moc_sos.du_lieu;
  const [chon, setChon] = useState<{ h: HangFt; s: MucSos } | null>(null);
  const [busy, setBusy] = useState(false);
  const tenPa = (ma: string) => duLieu.phuong_an.du_lieu.muc.find((m) => m.ma === ma)?.ten ?? ma;
  const luuO = async (o: OMoc, cung: string[]) => {
    if (!chon) return;
    const ft = { ...moc.ft };
    for (const h of [chon.h, ...(cung as HangFt[])]) ft[h] = { ...ft[h], [chon.s]: o };
    setBusy(true);
    const ok = await luuDs('moc_sos', { ...moc, ft }, t('Đã lưu {n} ô · SOS {s}', { n: 1 + cung.length, s: chon.s }));
    setBusy(false);
    if (ok) setChon(null);
  };
  return (
    <div className="grid gap-4">
      <Bang<HangFt> ten={t('Mốc SOS')} cot={COT_FT} hang={HANG_FT} khoa={(h) => h} the375={false} hangRieng={(h) => (
              <Fragment key={h}>
                <tr className="border-b" style={{ borderColor: 'var(--line)' }}>
                  <OBang c={COT_FT[0]} className="py-3 pl-4 align-top text-[15px] font-bold text-slate-100">{TEN_HANG[h]}{h === 'rf' && <span className="block text-[12px] font-normal text-slate-500">{t('mọi MT')}</span>}</OBang>
                  {(['1', '2', '3'] as MucSos[]).map((s, i) => {
                    const dang = chon?.h === h && chon.s === s;
                    const noi = <NoiDungO o={moc.ft[h][s]} moc={moc} tenPa={tenPa} />;
                    return (
                      <OBang key={s} c={COT_FT[i + 1]} className="!whitespace-normal border-l p-0 align-top" style={{ borderColor: 'var(--line)' }}>
                        {chiXem ? <div className="px-3 py-2.5">{noi}</div> : (
                          <button type="button" aria-pressed={dang} aria-label={`${TEN_HANG[h]} · SOS ${s}`} onClick={() => setChon(dang ? null : { h, s })}
                            className={`block min-h-[96px] w-full px-3 py-2.5 text-left hover:bg-[color:var(--accent-soft)] ${dang ? 'bg-[color:var(--accent-soft)] shadow-[inset_3px_0_0_var(--accent)]' : ''}`}>{noi}</button>
                        )}
                      </OBang>
                    );
                  })}
                </tr>
                {chon?.h === h && (
                  <tr className="border-b" style={{ borderColor: 'var(--line)' }}>
                    <OBang c={COT_FT[0]} colSpan={4} className="!whitespace-normal p-3">
                      <KhungO key={`${chon.h}-${chon.s}`} tieuDe={`${TEN_HANG[chon.h]} · SOS ${chon.s}`} o={moc.ft[chon.h][chon.s]} moc={moc} duLieu={duLieu} coPa busy={busy}
                        cungAp={HANG_FT.filter((x) => x !== chon.h).map((x) => ({ key: x, ten: TEN_HANG[x] }))} onThoi={() => setChon(null)} onLuu={luuO} />
                    </OBang>
                  </tr>
                )}
              </Fragment>
      )} />
      <DanhMucViec duLieu={duLieu} chiXem={chiXem} luuDs={luuDs} />
    </div>
  );
}

type KhoaThuong = keyof MocThuong;
const MOC_THUONG: { k: KhoaThuong; ten: string; phu: string; caseChu: string }[] = [
  { k: 'progress', ten: 'Progress Test', phu: t('môn trượt · FOU, BE, ELE'), caseChu: t('Case mỗi môn trượt · xác nhận 5 ngày') },
  { k: 'final6069', ten: 'Final 60–69 %', phu: t('lên'), caseChu: t('Case mỗi môn trượt') },
  { k: 'final5059Len', ten: 'Final 50–59 %', phu: t('QL cho lên'), caseChu: t('Case mỗi môn trượt') },
  { k: 'final5059HocLai', ten: 'Final 50–59 %', phu: t('học lại'), caseChu: '—' },
  { k: 'finalDuoi50', ten: 'Final < 50 %', phu: t('học lại / lên'), caseChu: '—' },
  { k: 'khongDatKyVong', ten: t('Lên FT'), phu: t('không đạt kỳ vọng · Trung tâm'), caseChu: t('Case mỗi kỹ năng') },
];

/** Ô số sửa tại chỗ: bấm → ô nhập, Enter / rời ô lưu, Esc thôi; 1–60. */
function OSoSua({ v, chiXem, onLuu, nhan }: { v: number; chiXem: boolean; onLuu: (n: number) => void; nhan: string }) {
  const [sua, setSua] = useState<string | null>(null);
  if (chiXem) return <b className="tabular-nums text-slate-100">{v}</b>;
  if (sua === null) return <button type="button" aria-label={nhan} className="inline-flex h-[26px] min-w-[30px] items-center justify-center rounded-md border px-1.5 text-sm font-bold tabular-nums text-[color:var(--accent)] hover:border-[color:var(--accent)]" style={{ borderColor: 'var(--line-strong)' }} onClick={() => setSua(String(v))}>{v}</button>;
  const n = Number(sua), sai = !Number.isInteger(n) || n < 1 || n > 60;
  const xong = () => { if (!sai && n !== v) onLuu(n); setSua(null); };
  return <input autoFocus aria-label={nhan} aria-invalid={sai} className={`field inline-block h-[28px] w-14 px-1 text-center ${sai ? 'border-[color:var(--bad)]' : ''}`} inputMode="numeric" value={sua}
    onChange={(e) => setSua(e.target.value)} onBlur={xong} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); xong(); } if (e.key === 'Escape') setSua(null); }} />;
}

export function MocSosThuong({ duLieu, chiXem, luuDs }: ChungProps) {
  const moc = duLieu.moc_sos.du_lieu;
  const th = moc.thuong;
  const [chon, setChon] = useState<KhoaThuong | null>(null);
  const [busy, setBusy] = useState(false);
  const doi = (k: KhoaThuong, gt: Partial<MocThuong[KhoaThuong]>, chu: string) => luuDs('moc_sos', { ...moc, thuong: { ...th, [k]: { ...th[k], ...gt } } }, chu);
  const ten = (ma: string) => moc.viec.find((v) => v.ma === ma)?.ten ?? ma;
  const so = (k: KhoaThuong, truong: string, v: number, nhan: string) => <OSoSua v={v} chiXem={chiXem} nhan={nhan} onLuu={(n) => void doi(k, { [truong]: n } as any, t('Đã đổi {nhan}: {cu} → {moi}', { nhan, cu: v, moi: n }))} />;
  const pa = (k: KhoaThuong) => {
    if (k === 'progress') return <div className="grid gap-1">{t('Bổ trợ đến Cuối khoá')}
      <span className="text-[13px] text-slate-400">FOU {so(k, 'fou', th.progress.fou, t('Bổ trợ FOU, buổi / tuần'))} {t('buổi / tuần · chung các môn')}</span>
      <span className="text-[13px] text-slate-400">BE, ELE {so(k, 'beEle', th.progress.beEle, t('Bổ trợ BE, ELE, buổi / tuần'))} {t('buổi / tuần · mỗi môn')}</span></div>;
    if (k === 'final6069' || k === 'final5059Len') return <div className="grid gap-1">
      <span>{t('Bổ trợ miễn phí')} {so(k, 'tuan', th[k].tuan, t('Số tuần bổ trợ'))} {t('tuần × môn trượt → Mini Test')}</span>
      <span className="text-[13px] text-slate-400">Pre FOU {so(k, 'preFou', th[k].preFou, t('Bổ trợ Pre FOU, buổi'))} {t('buổi, chung')}</span></div>;
    if (k === 'khongDatKyVong') return <span>Tutor {so(k, 'tutor', th.khongDatKyVong.tutor, t('Số buổi Tutor'))} {t('buổi / kỹ năng · tính buổi Free')}</span>;
    return <span className="text-slate-500">—</span>;
  };
  return (
    <div className="grid gap-4">
      <Bang<(typeof MOC_THUONG)[number]> ten={t('Mốc SOS · Lớp thường')} cot={COT_THUONG} hang={MOC_THUONG} khoa={(m) => m.k} the375={false} hangRieng={(m) => (
              <Fragment key={m.k}>
                <tr className="border-b align-top" style={{ borderColor: 'var(--line)' }}>
                  <OBang c={COT_THUONG[0]} className="!whitespace-normal py-3 pl-4 text-[15px] font-bold text-slate-100">{m.ten}<span className="block text-[12px] font-normal text-slate-500">{m.phu}</span></OBang>
                  <OBang c={COT_THUONG[1]} className="!whitespace-normal py-3 text-sm text-slate-200">{m.caseChu}</OBang>
                  <OBang c={COT_THUONG[2]} className="!whitespace-normal py-3 pr-3 text-sm text-slate-100">{pa(m.k)}</OBang>
                  <OBang c={COT_THUONG[3]} className="border-l p-0" style={{ borderColor: 'var(--line)' }}>
                    {m.k === 'khongDatKyVong' || chiXem
                      ? <div className="px-3 py-3 text-[13px] text-slate-300">{th[m.k].viec.length ? th[m.k].viec.map(ten).join(' · ') : t('Không có việc')}</div>
                      : <button type="button" aria-pressed={chon === m.k} onClick={() => setChon(chon === m.k ? null : m.k)}
                          className={`block w-full px-3 py-3 text-left text-[13px] text-slate-300 hover:bg-[color:var(--accent-soft)] ${chon === m.k ? 'bg-[color:var(--accent-soft)] shadow-[inset_3px_0_0_var(--accent)]' : ''}`}>
                          {th[m.k].viec.length ? th[m.k].viec.map((x) => <span key={x} className="block">· {ten(x)}</span>) : t('Không có việc')} <span aria-hidden className="text-slate-500">›</span></button>}
                  </OBang>
                </tr>
                {chon === m.k && (
                  <tr className="border-b" style={{ borderColor: 'var(--line)' }}>
                    <OBang c={COT_THUONG[0]} colSpan={4} className="!whitespace-normal p-3">
                      <KhungO key={m.k} tieuDe={`${m.ten} · ${m.phu}`} o={{ pa: null, viec: th[m.k].viec }} moc={moc} duLieu={duLieu} coPa={false} busy={busy}
                        onThoi={() => setChon(null)} onLuu={async (o) => { setBusy(true); const ok = await doi(m.k, { viec: o.viec }, t('Đã lưu việc · {moc}', { moc: m.ten })); setBusy(false); if (ok) setChon(null); }} />
                    </OBang>
                  </tr>
                )}
              </Fragment>
      )} />
      <DanhMucViec duLieu={duLieu} chiXem={chiXem} luuDs={luuDs} />
    </div>
  );
}
