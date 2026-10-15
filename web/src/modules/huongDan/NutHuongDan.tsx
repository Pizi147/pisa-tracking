import { useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { KhungPanel } from '../../ui/KhungPanel.tsx';
import { HUONG_DAN, TEN_VAI_HD, locHd, manCuaDuong, moiMuc, type ChiChoToi, type HuongDan } from '@shared/huongDan/index.ts';
import { t } from '@shared/i18n/index.ts';
import { chiChoToi } from './chiChoToi.tsx';
import { MucHuongDan, useDaXemHd, useVaiHd } from './MucHuongDan.tsx';

/**
 * HD-a — NÚT "?" cạnh Thông báo (mockup OV-13 §5b): panel phải ở đúng mục "Theo màn › {màn đang đứng}" (theo đường dẫn), không chuyển trang.
 * Ô tìm lọc cả hướng dẫn của vai; cuối panel "Mở trang Hướng dẫn ↗". "Chỉ cho tôi" đóng panel rồi khoanh phần tử.
 */
export function NutHuongDan() {
  const [mo, setMo] = useState(false);
  const { pathname } = useLocation();
  const { macDinh } = useVaiHd();
  const { chuaXem, ghi } = useDaXemHd();
  const hd = HUONG_DAN[macDinh]!;
  return (
    <>
      <button type="button" data-hd="nut-hd" aria-label={t('Hướng dẫn màn này')} title={t('Hướng dẫn màn này')} aria-expanded={mo}
        onClick={() => { setMo(true); if (chuaXem) void ghi(); }}
        className={`btn btn-sm min-w-[32px] justify-center font-bold max-sm:min-h-[44px] max-sm:min-w-[44px] max-sm:border-0 max-sm:bg-transparent ${mo ? 'border-[color:var(--accent)] text-[color:var(--accent)]' : ''}`}>
        ?
      </button>
      {mo && <PanelHuongDan duong={pathname} vai={TEN_VAI_HD[macDinh]} hd={hd} onDong={() => setMo(false)}
        onChi={(c) => { setMo(false); chiChoToi(c); }} />}
    </>
  );
}

function PanelHuongDan({ duong, vai, hd, onDong, onChi }: { duong: string; vai: string; hd: HuongDan; onDong: () => void; onChi: (c: ChiChoToi) => void }) {
  const [q, setQ] = useState('');
  const man = manCuaDuong(hd, duong);
  const tim = !!q.trim();
  const ds = useMemo(() => (tim ? moiMuc(locHd(hd, q, t)) : man?.muc ?? hd.viec), [hd, q, tim, man]);
  return (
    <KhungPanel tieuDe={man ? t('Hướng dẫn · {man}', { man: t(man.ten) }) : t('Hướng dẫn')} dau={{ dong2: [t('Theo màn'), vai] }} onDong={onDong}>
      <div className="flex flex-col gap-3 pt-3">
        <input type="search" className="field" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('Tìm trong hướng dẫn')} aria-label={t('Tìm trong hướng dẫn')} />
        {!man && !tim && <p className="m-0 text-[13px] text-slate-400">{t('Màn này chưa có mục riêng — xem các màn khác bên dưới.')}</p>}
        {ds.map((m, i) => <MucHuongDan key={`${m.id}-${tim ? 'tim' : ''}`} muc={m} moSan={tim || i === 0} onChi={onChi} />)}
        {tim && ds.length === 0 && <p className="m-0 text-[13px] text-slate-400">{t('Không có mục nào khớp')}</p>}
        <Link to="/huong-dan" className="link inline-flex min-h-[44px] items-center text-[13px] font-semibold sm:min-h-0" onClick={onDong}>{t('Mở trang Hướng dẫn ↗')}</Link>
      </div>
    </KhungPanel>
  );
}
