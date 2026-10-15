import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ChuDam, Empty } from '../../ui/ui.tsx';
import { HUONG_DAN, TEN_VAI_HD, VAI_CO_NOI_DUNG, coXemVaiKhac, locHd, type HuongDan, type PhanHd, type VaiHd } from '@shared/huongDan/index.ts';
import { t } from '@shared/i18n/index.ts';
import { chiChoToi } from './chiChoToi.tsx';
import { MucHuongDan, useDaXemHd, useVaiHd } from './MucHuongDan.tsx';

const PHAN: PhanHd[] = ['viec', 'man', 'luat', 'tu'];
const TEN_PHAN: Record<PhanHd, string> = { viec: t('Việc hằng tuần'), man: t('Theo màn'), luat: t('Luật và hạn'), tu: t('Thuật ngữ') };
const demPhan = (h: HuongDan): Record<PhanHd, number> => ({ viec: h.viec.length, man: h.man.reduce((n, m) => n + m.muc.length, 0), luat: h.luat.length, tu: h.tu.length });

/**
 * HD-a — TRANG HƯỚNG DẪN (mockup OV-13 §5a): 4 phần theo vai đang đăng nhập, ô tìm lọc cả 4 phần, QL / Quản trị "Xem vai".
 * Phần + vai trên URL (`?phan=`, `?vai=`) — Quay lại về đúng chỗ. In: mọi phần, mọi mục mở (`print:`), không thanh trên.
 */
export default function HuongDanPage() {
  const [params, setParams] = useSearchParams();
  const { cuaToi, macDinh } = useVaiHd();
  const xemKhac = coXemVaiKhac(cuaToi);
  const vaiUrl = params.get('vai') as VaiHd | null;
  const vai: VaiHd = xemKhac && vaiUrl && HUONG_DAN[vaiUrl] ? vaiUrl : macDinh;
  const phan: PhanHd = (PHAN as string[]).includes(params.get('phan') ?? '') ? params.get('phan') as PhanHd : 'viec';
  const [q, setQ] = useState('');
  const hd = HUONG_DAN[vai]!;
  const loc = useMemo(() => locHd(hd, q, t), [hd, q]);
  const dem = demPhan(loc);
  const { chuaXem, ghi } = useDaXemHd();
  useEffect(() => { if (chuaXem) void ghi(); }, [chuaXem]);   // eslint-disable-line react-hooks/exhaustive-deps

  const dat = (k: string, v: string | null) => {
    const next = new URLSearchParams(params);
    if (v) next.set(k, v); else next.delete(k);
    setParams(next, { replace: true });
  };
  const tim = !!q.trim();
  const khoa = (id: string) => `${vai}-${id}-${tim ? 'tim' : ''}`;

  const than: Record<PhanHd, ReactNode[]> = {
    viec: loc.viec.map((m, i) => <MucHuongDan key={khoa(m.id)} muc={m} moSan={tim || i === 0} onChi={chiChoToi} />),
    man: loc.man.map((man) => (
      <div key={man.id} className="flex flex-col gap-2">
        <h3 className="m-0 pt-1 text-xs font-bold uppercase tracking-wide text-slate-400">{t(man.ten)}</h3>
        {man.muc.map((m) => <MucHuongDan key={khoa(m.id)} muc={m} moSan={tim} onChi={chiChoToi} />)}
      </div>
    )),
    luat: loc.luat.map((m, i) => <MucHuongDan key={khoa(m.id)} muc={m} moSan={tim || i === 0} onChi={chiChoToi} />),
    tu: loc.tu.length ? [(
      <dl key="tu" className="card m-0 divide-y" style={{ borderColor: 'var(--line)' }}>
        {loc.tu.map((x) => (
          <div key={x.ten} className="grid gap-x-4 gap-y-0.5 px-4 py-2.5 break-inside-avoid sm:grid-cols-[180px_minmax(0,1fr)]" style={{ borderColor: 'var(--line)' }}>
            <dt className="text-[13.5px] font-semibold text-slate-100">{t(x.ten)}</dt>
            <dd className="m-0 text-[13.5px] text-slate-300 [&_strong]:font-semibold [&_strong]:text-slate-100"><ChuDam chu={t(x.nghia)} /></dd>
          </div>
        ))}
      </dl>
    )] : [],
  };

  return (
    <div className="page hd-in">
      <div className="grid items-start gap-7 md:grid-cols-[232px_minmax(0,1fr)] print:block">
        <nav aria-label={t('Phần hướng dẫn')} className="sticky top-0 flex flex-col gap-0.5 max-md:hidden print:hidden">
          {PHAN.map((p) => (
            <button key={p} type="button" aria-current={p === phan ? 'true' : undefined} onClick={() => dat('phan', p === 'viec' ? null : p)}
              className={`flex min-h-[36px] items-center rounded-lg border px-2.5 text-left text-[13.5px] ${p === phan
                ? 'border-[color:var(--accent-line)] bg-[color:var(--accent-soft)] font-bold text-slate-100' : 'border-transparent bg-transparent text-slate-400 hover:bg-white/5'}`}>
              {TEN_PHAN[p]}<span className="ml-auto text-xs tabular-nums text-slate-500">{dem[p]}</span>
            </button>
          ))}
        </nav>
        <div className="flex min-w-0 max-w-[760px] flex-col gap-4 print:max-w-none">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="m-0 flex-1 text-lg font-semibold text-slate-100">{t('Hướng dẫn')}</h1>
            {xemKhac && VAI_CO_NOI_DUNG.length > 1 && (
              <label className="flex items-center gap-2 text-[13px] text-slate-400 print:hidden">
                {t('Xem vai')}
                <select className="field w-auto" value={vai} onChange={(e) => dat('vai', e.target.value === macDinh ? null : e.target.value)}>
                  {VAI_CO_NOI_DUNG.map((v) => <option key={v} value={v}>{TEN_VAI_HD[v]}</option>)}
                </select>
              </label>
            )}
            <button type="button" className="btn btn-sm print:hidden" onClick={() => window.print()}>{t('In')}</button>
          </div>
          <input type="search" className="field print:hidden" value={q} onChange={(e) => setQ(e.target.value)}
            placeholder={t('Tìm: "kết quả PA", "SOS", "hạn"…')} aria-label={t('Tìm trong hướng dẫn')} />
          {/* 375: 4 phần thành hàng chip cuộn ngang (mockup `.hd-tab`). */}
          <div role="group" aria-label={t('Phần hướng dẫn')} className="flex gap-1.5 overflow-x-auto pr-8 [scrollbar-width:none] [mask-image:linear-gradient(to_right,#000_calc(100%-2rem),transparent)] md:hidden print:hidden">
            {PHAN.map((p) => (
              <button key={p} type="button" aria-pressed={p === phan} onClick={() => dat('phan', p === 'viec' ? null : p)}
                className={`btn min-h-[44px] shrink-0 whitespace-nowrap ${p === phan ? 'border-[color:var(--accent)] bg-[color:var(--accent-soft)] text-slate-100 font-semibold' : ''}`}>
                {TEN_PHAN[p]}{tim ? ` · ${dem[p]}` : ''}
              </button>
            ))}
          </div>
          <p className="m-0 text-[13px] text-slate-500 print:hidden" aria-live="polite">
            {tim ? t('"{q}" · {n} mục', { q: q.trim(), n: dem[phan] }) : t('Đang xem như {vai} · {n} việc', { vai: TEN_VAI_HD[vai], n: hd.viec.length })}
          </p>
          {PHAN.map((p) => (
            <section key={p} aria-label={TEN_PHAN[p]} className={`flex-col gap-3 ${p === phan ? 'flex' : 'hidden print:flex'}`}>
              <h2 className="m-0 hidden text-base font-semibold print:block">{TEN_PHAN[p]}</h2>
              {than[p]}
            </section>
          ))}
          {dem[phan] === 0 && (
            <div className="card print:hidden">
              <Empty title={t('Không có mục nào khớp')} action={<button type="button" className="btn btn-sm" onClick={() => setQ('')}>{t('Xoá tìm')}</button>} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
