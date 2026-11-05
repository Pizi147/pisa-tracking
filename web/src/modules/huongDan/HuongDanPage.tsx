import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ChuDam, Empty } from '../../ui/ui.tsx';
import { HUONG_DAN, TEN_VAI_HD, VAI_CO_NOI_DUNG, coXemVaiKhac, locHd, locVai, timHd, type HuongDan, type VaiHd } from '@shared/huongDan/index.ts';
import { useSession } from '../../lib/session.tsx';
import { t } from '@shared/i18n/index.ts';
import { chiChoToi } from './chiChoToi.tsx';
import { MucHuongDan, useDaXemHd, useVaiHd } from './MucHuongDan.tsx';
import { DsNhom, KetQuaTim, TabTuan, TheoMan, type Ctx } from './NutHuongDan.tsx';

/**
 * HD-V2 (c) — TRANG HƯỚNG DẪN (đặc tả 3.7): CÙNG nội dung và cùng khối với panel "?", ba phần như ba tab — Tôi muốn… · Tuần của tôi · Theo màn
 * (mọi màn: Bạn đang ở, Việc làm ở đây, Không làm ở đây) — thêm Luật và hạn, Thuật ngữ (đọc tra, panel không có). Không nội dung riêng của trang.
 * Phần + vai trên URL (`?phan=`, `?vai=`) — Quay lại về đúng chỗ. In: mọi phần, mọi việc mở (`print:`), không thanh trên. Đọc dữ liệu tĩnh: 0 câu Turso.
 */
const PHAN = ['lam', 'tuan', 'man', 'luat', 'tu'] as const;
type Phan = (typeof PHAN)[number];
const TEN_PHAN: Record<Phan, string> = { lam: t('Tôi muốn…'), tuan: t('Tuần của tôi'), man: t('Theo màn'), luat: t('Luật và hạn'), tu: t('Thuật ngữ') };
const demPhan = (h: HuongDan): Record<Phan, number> => ({
  lam: h.lam?.length ?? 0, tuan: h.tuan?.reduce((n, x) => n + x.viec.length, 0) ?? 0, man: h.man.filter((m) => !m.panel).length, luat: h.luat.length, tu: h.tu.length,
});

export default function HuongDanPage() {
  const [params, setParams] = useSearchParams();
  const { cuaToi, macDinh } = useVaiHd();
  const xemKhac = coXemVaiKhac(cuaToi);
  const vaiUrl = params.get('vai') as VaiHd | null;
  const vai: VaiHd = xemKhac && vaiUrl && HUONG_DAN[vaiUrl] ? vaiUrl : macDinh;
  const phan: Phan = (PHAN as readonly string[]).includes(params.get('phan') ?? '') ? params.get('phan') as Phan : 'lam';
  const [q, setQ] = useState('');
  const { session } = useSession();
  /* Phần Chỉ GVCN / GV Speaking theo cờ phiên (đặc tả 3.6); xem vai khác (QL xem GV) thấy đủ, có nhãn. */
  const hd = useMemo(() => (vai === cuaToi ? locVai(HUONG_DAN[vai]!, { gvcn: !!session?.laGvcn, s: !!session?.coS }) : HUONG_DAN[vai]!), [vai, cuaToi, session?.laGvcn, session?.coS]);
  const tim = !!q.trim();
  const kq = useMemo(() => timHd(hd, q, t, null), [hd, q]);
  const loc = useMemo(() => locHd(hd, q, t), [hd, q]);
  const dem = demPhan(hd);
  const { chuaXem, ghi } = useDaXemHd();
  useEffect(() => { if (chuaXem) void ghi(); }, [chuaXem]);   // eslint-disable-line react-hooks/exhaustive-deps

  const dat = (k: string, v: string | null) => {
    const next = new URLSearchParams(params);
    if (v) next.set(k, v); else next.delete(k);
    setParams(next, { replace: true });
  };
  const ctx: Ctx = { hd, q: tim ? q : '', onChi: chiChoToi, onDong: () => {}, inDuoc: true };
  const khoa = (id: string) => `${vai}-${id}-${tim ? 'tim' : ''}`;

  const luat = (ds: HuongDan['luat'], moDau: boolean) => ds.map((m, i) => <MucHuongDan key={khoa(m.id)} muc={m} moSan={tim || (moDau && i === 0)} onChi={chiChoToi} />);
  const tu = (ds: HuongDan['tu']): ReactNode[] => (ds.length ? [(
    <dl key="tu" className="card m-0 divide-y" style={{ borderColor: 'var(--line)' }}>
      {ds.map((x) => (
        <div key={x.ten} className="grid gap-x-4 gap-y-0.5 px-4 py-2.5 break-inside-avoid sm:grid-cols-[180px_minmax(0,1fr)]" style={{ borderColor: 'var(--line)' }}>
          <dt className="text-[14px] font-semibold text-slate-100">{t(x.ten)}</dt>
          <dd className="m-0 text-[14px] text-slate-300 [&_strong]:font-semibold [&_strong]:text-slate-100"><ChuDam chu={t(x.nghia)} /></dd>
        </div>
      ))}
    </dl>
  )] : []);

  const than: Record<Phan, ReactNode> = {
    lam: <DsNhom viec={hd.lam ?? []} ctx={ctx} moDau />,
    tuan: <TabTuan hd={hd} ctx={ctx} />,
    man: <TheoMan hd={hd} ctx={ctx} />,
    luat: luat(hd.luat, true),
    tu: tu(hd.tu),
  };
  const nKq = kq ? kq.viec.length + kq.muc.length + kq.vaiKhac.length + loc.luat.length + loc.tu.length : 0;

  return (
    <div className="page hd-in">
      <div className="grid items-start gap-7 md:grid-cols-[232px_minmax(0,1fr)] print:block">
        <nav aria-label={t('Phần hướng dẫn')} className="sticky top-0 flex flex-col gap-0.5 max-md:hidden print:hidden">
          {PHAN.map((p) => (
            <button key={p} type="button" aria-current={!tim && p === phan ? 'true' : undefined} onClick={() => { setQ(''); dat('phan', p === 'lam' ? null : p); }}
              className={`flex min-h-[36px] items-center rounded-lg border px-2.5 text-left text-[14px] ${!tim && p === phan
                ? 'border-[color:var(--accent-line)] bg-[color:var(--accent-soft)] font-semibold text-slate-100' : 'border-transparent bg-transparent text-slate-400 bam'}`}>
              {TEN_PHAN[p]}<span className="ml-auto text-xs tabular-nums text-slate-500">{dem[p]}</span>
            </button>
          ))}
        </nav>
        <div className="flex min-w-0 max-w-[760px] flex-col gap-4 print:max-w-none">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="m-0 flex-1 text-xl font-bold text-slate-100">{t('Hướng dẫn')}</h1>
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
          <input type="search" name="tim-huong-dan" autoComplete="off" className="field print:hidden" value={q} onChange={(e) => setQ(e.target.value)}
            placeholder={t('Tìm: "kết quả PA", "SOS", "hạn"…')} aria-label={t('Tìm trong hướng dẫn')} />
          {/* 375: các phần thành hàng chip cuộn ngang (mockup `.hd-tab`). */}
          <div role="group" aria-label={t('Phần hướng dẫn')} className="flex gap-1.5 overflow-x-auto pr-8 [scrollbar-width:none] [mask-image:linear-gradient(to_right,#000_calc(100%-2rem),transparent)] md:hidden print:hidden">
            {PHAN.map((p) => (
              <button key={p} type="button" aria-pressed={!tim && p === phan} onClick={() => { setQ(''); dat('phan', p === 'lam' ? null : p); }}
                className={`btn min-h-[44px] shrink-0 whitespace-nowrap ${!tim && p === phan ? 'border-[color:var(--accent)] bg-[color:var(--accent-soft)] text-slate-100 font-semibold' : ''}`}>
                {TEN_PHAN[p]}
              </button>
            ))}
          </div>
          <p className="m-0 text-[13px] text-slate-500 print:hidden" aria-live="polite">
            {tim ? t('"{q}" · {n} mục', { q: q.trim(), n: nKq }) : t('Đang xem như {vai} · {n} việc', { vai: TEN_VAI_HD[vai], n: hd.lam?.length ?? 0 })}
          </p>
          {/* Đang tìm: một danh sách (như ô tìm của panel) + luật, thuật ngữ khớp. */}
          {tim && kq && (
            <div className="flex flex-col gap-3 print:hidden">
              {kq.viec.length + kq.muc.length + kq.vaiKhac.length > 0 && <KetQuaTim kq={kq} q={q} ctx={ctx} onXemHet={() => setQ('')} />}
              {loc.luat.length > 0 && <div className="flex flex-col gap-3"><h2 className="m-0 text-base font-semibold text-slate-100">{TEN_PHAN.luat}</h2>{luat(loc.luat, false)}</div>}
              {loc.tu.length > 0 && <div className="flex flex-col gap-3"><h2 className="m-0 text-base font-semibold text-slate-100">{TEN_PHAN.tu}</h2>{tu(loc.tu)}</div>}
              {nKq === 0 && <div className="card"><Empty title={t('Không có mục nào khớp')} action={<button type="button" className="btn btn-sm" onClick={() => setQ('')}>{t('Xoá tìm')}</button>} /></div>}
            </div>
          )}
          {PHAN.map((p) => (
            <section key={p} aria-label={TEN_PHAN[p]} className={`flex-col gap-3 ${!tim && p === phan ? 'flex' : 'hidden print:flex'}`}>
              <h2 className="m-0 hidden text-base font-semibold print:block">{TEN_PHAN[p]}</h2>
              {than[p]}
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
