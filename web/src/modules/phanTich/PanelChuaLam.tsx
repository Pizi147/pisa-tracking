import { useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import type { DongViecHan } from '@shared/domain/index.ts';
import { t } from '@shared/i18n/index.ts';
import { useApi } from '../../lib/useApi.ts';
import { KhungPanel } from '../../ui/KhungPanel.tsx';
import { HangTab } from '../../ui/HangTab.tsx';
import { NutLuat } from '../../ui/NutLuat.tsx';
import { ErrorState, Skeleton } from '../../ui/ui.tsx';
import { CHIP_TRON } from '../../ui/Nhan.tsx';

/**
 * PANEL "CHƯA LÀM" — tab Giáo viên (GD-12a, mockup ⑨ D5 / D6 / D7, R9.1): bấm số bài / việc Chưa làm của dải → mọi bài / việc ĐÃ QUA HẠN chưa làm trong kỳ,
 * tab con Chấm Test · Việc, NHÓM THEO GV (tên là link hồ sơ GV, số), mỗi dòng = dòng việc chuẩn CHỈ ĐỌC ("Lớp · việc" · thẻ phụ em / tuần · viên quá hạn) —
 * nhóm cuối "S chéo chung · chưa ai nhận" không vào tỉ lệ (XM-6). Nguồn: `/phan-tich/giao-vien/danh-sach` (đường Excel đang có, chỉ khi mở panel) lọc `chua`.
 * Số đầu tab = số ô của dải (Σ Chưa làm của người, không gồm S chéo chung, không gồm Chưa phân công — ô riêng).
 */
type DongDs = { id: number; gv: string | null; gvId: number | null; dongViec?: DongViecHan };
export type TabChuaLam = 'cham' | 'viec';

const THE = 'h-5 min-w-0 shrink truncate rounded-md px-1.5 text-xs font-medium leading-5 text-dim';

/**
 * PTA rà #1681 (⑨ D5): bài Chấm Test gộp MỘT dòng mỗi lớp × lượt × kỹ năng ("MB FT 101 · W2" · thẻ MT1 · W1 SEP · 2 bài); một bài thì thẻ tên em (link).
 * Hạn quá = bài quá hạn lâu nhất của dòng. Việc giữ mỗi việc một dòng. Nguồn bài: `ten` = "đợt · môn".
 */
type Dong = { d: DongViecHan; n: number };
function gopBai(ds: readonly DongViecHan[]): Dong[] {
  const m = new Map<string, Dong>();
  for (const d of ds) {
    const k = d.tab === 'cham' ? `${d.lop?.ma}|${d.ten}|${d.phu ?? ''}|${d.chiNhanh ?? ''}` : `v:${m.size}`;
    const x = m.get(k);
    if (!x) m.set(k, { d, n: 1 });
    else { x.n += 1; if ((d.treNgay ?? 0) > (x.d.treNgay ?? 0)) x.d = { ...x.d, treNgay: d.treNgay }; }
  }
  return [...m.values()];
}

function DongChiDoc({ d, n }: Dong) {
  const bai = d.tab === 'cham';
  const cat = bai ? d.ten.indexOf(' · ') : -1;
  const dot = cat >= 0 ? d.ten.slice(0, cat) : null, mon = cat >= 0 ? d.ten.slice(cat + 3) : d.ten;
  const phu = [dot, d.phu, d.chiNhanh, bai && n > 1 ? t('{n} bài', { n }) : null].filter((x): x is string => !!x);
  const em = n === 1 ? d.em : null;
  return (
    <li className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 border-t px-4 py-2.5" style={{ borderColor: 'var(--line)' }}>
      <span className="min-w-0">
        <span className="block truncate text-[15px] font-medium text-[color:var(--text)]">{[d.lop?.ma, mon].filter(Boolean).join(' · ')}</span>
        {(em || phu.length > 0) && (
          <span className="mt-[3px] flex min-w-0 flex-wrap items-center gap-[3px]">
            {em && <Link to={`/hoc-vien/${em.id}`} className={`${THE} no-underline hover:underline`} style={{ background: 'var(--surface-2)' }}>{em.ten}</Link>}
            {phu.map((x) => <span key={x} className={THE} style={{ background: 'var(--surface-2)' }}>{x}</span>)}
          </span>
        )}
      </span>
      {/* V22: quá hạn chỉ bằng màu (không ⚠). */}
      {d.treNgay != null && d.treNgay > 0
        ? <span className={`${CHIP_TRON} bg-late-bg text-late`}>{t('quá hạn {n} ngày', { n: d.treNgay })}</span>
        : <span />}
    </li>
  );
}

export function PanelChuaLam({ nguon, tab: tabDau, tieuDe, ngCanh, onDong }: { nguon: string; tab: TabChuaLam; tieuDe: string; ngCanh: string; onDong: () => void }) {
  const { data, loading, error, reload } = useApi<{ rows: DongDs[] }>(nguon, [nguon]);
  const [tab, setTab] = useState<TabChuaLam>(tabDau);
  const chua = (data?.rows ?? []).filter((r): r is DongDs & { dongViec: DongViecHan } => r.dongViec?.trangThai === 'chua');
  const theoTab = (k: TabChuaLam) => chua.filter((r) => (r.dongViec.tab === 'cham') === (k === 'cham'));
  const rieng = (ds: typeof chua) => ds.filter((r) => r.gvId != null && !r.dongViec.sChung);
  const ds = theoTab(tab);
  const nhom = new Map<number, { ten: string; ds: DongViecHan[] }>();
  for (const r of rieng(ds)) (nhom.get(r.gvId!) ?? nhom.set(r.gvId!, { ten: r.gv ?? '', ds: [] }).get(r.gvId!)!).ds.push(r.dongViec);
  const nhomDs = [...nhom].sort((a, b) => a[1].ten.localeCompare(b[1].ten, 'vi'));
  const sc = ds.filter((r) => r.dongViec.sChung).map((r) => r.dongViec);
  const soTab = (k: TabChuaLam) => rieng(theoTab(k)).length;
  const donVi = tab === 'cham' ? t('bài') : t('việc');
  const khoi = (khoa: string, ten: ReactNode, n: number, dong: DongViecHan[], phu?: string) => (
    <section key={khoa} className="overflow-clip rounded-lg border" style={{ borderColor: 'var(--line-strong)' }}>
      <h3 className="m-0 flex min-h-11 items-center gap-2 px-4 py-2 text-[15px] font-bold text-[color:var(--text)] shadow-[inset_3px_0_0_var(--hang-lon-vach)]" style={{ background: 'var(--hang-lon-bg)' }}>
        {ten}
        <span className="inline-flex h-[22px] min-w-[22px] items-center justify-center rounded border px-[7px] text-xs font-semibold tabular-nums" style={{ borderColor: 'var(--line-strong)' }}>{n}</span>
        {phu && <span className="text-[13px] font-normal text-[color:var(--text-dim)]">{phu}</span>}
      </h3>
      <ul className="m-0 list-none p-0 [&>li:first-child]:border-t-0">{gopBai(dong).map((x, i) => <DongChiDoc key={i} {...x} />)}</ul>
    </section>
  );
  return (
    <KhungPanel tieuDe={tieuDe} loai={t('Số · Giáo viên')} rong="so" onDong={onDong} ngCanh={ngCanh}
      tabs={(
        <HangTab ariaLabel={t('Chưa làm')} panelId="pt-chua-lam" value={tab} onChange={setTab}
          tabs={[{ key: 'cham', label: t('Chấm Test'), so: data ? soTab('cham') : null }, { key: 'viec', label: t('Việc'), so: data ? soTab('viec') : null }]} />
      )}
      vungTab={{ id: 'pt-chua-lam', nhan: tab === 'cham' ? t('Chấm Test') : t('Việc') }}
      chan={{ huy: { nhan: t('Đóng'), onClick: onDong }, huyPhai: true }}>
      {error ? <ErrorState message={error.message} hint={error.hint} status={error.status} onRetry={reload} />
        : loading || !data ? <Skeleton rows={5} />
        : (
          <div className="flex flex-col gap-3">
            <p className="m-0 flex items-center gap-1.5 text-[15px] font-bold text-[color:var(--text)]">
              {t('{n} {dv} · {g} GV', { n: soTab(tab), dv: donVi, g: nhomDs.length })}
              <NutLuat label={t('Chưa làm')}>{t('Bài / việc có hạn trong kỳ đã qua hạn mà chưa làm, của từng người được phân công. S chéo chung (bài Speaking chấm chéo chưa ai nhận) để riêng cuối danh sách, không vào số và tỉ lệ của ai.')}</NutLuat>
            </p>
            {!nhomDs.length && !sc.length && <p className="m-0 text-sm text-[color:var(--text-dim)]">{tab === 'cham' ? t('Không còn bài nào quá hạn chưa chấm.') : t('Không còn việc nào quá hạn chưa làm.')}</p>}
            {nhomDs.map(([id, g]) => khoi(`gv:${id}`, <Link to={`/giao-vien/${id}`} className="ten-ho-so">{g.ten}</Link>, g.ds.length, g.ds))}
            {sc.length > 0 && khoi('s-chung', <i className="font-bold">{t('S chéo chung')}</i>, sc.length, sc, t('chưa ai nhận · không vào tỉ lệ'))}
          </div>
        )}
    </KhungPanel>
  );
}
