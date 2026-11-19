import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { addDaysIso, duongLichTest, mondayOfDate, tuanLich } from '@shared/domain/index.ts';
import { t } from '@shared/i18n/index.ts';
import { NutLuat } from '../../ui/NutLuat.tsx';
import { useBamNgoai } from '../../ui/useBamNgoai.ts';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import { VUNG_BAM_SO, LOP_OSO } from '../../ui/SoLieu.tsx';
import type { TestSapToi } from './LopCuaToi.tsx';

/** `/my-work` vai GV, khoá `sapToi` (LG-13 H7): việc CHƯA sinh trong 7 ngày (đợt Báo cáo PH sắp mở; Test từ `testSapToi`) — không có gì thì máy chủ không trả khoá. TU2-4: PA chưa tới hạn ở khối "PA đang chạy" (`paDangChay`), không ở đây. */
export type SapToiGv = {
  baoCaoPh: { classId: number; code: string; dot: string; nhanDot: string; mo: string }[];
};
type Cum = { khoa: 'test' | 'ph'; ten: string; tom: string; so: number; nhan: string; hop: string; dong: ReactNode[]; chan?: ReactNode };

/**
 * GD-21 (mockup ⑬ H7): dòng "Sắp tới" 7 ngày trên "Lớp của tôi" — dáng dải chỉ số mỏng: nhãn · cụm "tên + ô số" · ⓘ. Bấm số → hộp nhỏ tại chỗ (đã nạp, 0 request).
 * Không vào số việc / badge; thiếu cụm nào bỏ cụm đó, không cụm nào thì không vẽ dòng. 375: MỘT hàng 44 "Sắp tới · Test · Kết quả PA ⌄", bấm mở mỗi cụm một hàng.
 */
export function SapToi({ sapToi, testSapToi, tenLop }: { sapToi?: SapToiGv; testSapToi?: TestSapToi[]; tenLop: (classId: number) => string | undefined }) {
  const { homNay, ngan } = useNgayNghiepVu();
  const [mo, setMo] = useState<string | null>(null);
  const [gonMo, setGonMo] = useState(false);
  const goc = useRef<HTMLDivElement>(null);
  useBamNgoai(mo !== null, () => setMo(null), goc);
  const nutMo = useRef<HTMLElement | null>(null);
  useEffect(() => {
    if (mo === null) return undefined;
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') { setMo(null); nutMo.current?.focus(); } };
    document.addEventListener('keydown', esc);
    return () => document.removeEventListener('keydown', esc);
  }, [mo]);
  useEffect(() => { if (mo !== null) goc.current?.querySelector<HTMLElement>('[role=dialog] a, [role=dialog] button')?.focus(); }, [mo]);   // XM-8: tiêu điểm vào hộp
  if (!homNay) return null;
  const tuanToi = tuanLich(addDaysIso(mondayOfDate(homNay), 7), homNay), tuanNay = tuanLich(mondayOfDate(homNay), homNay);
  const lopTest = (testSapToi ?? []).filter((x) => x.testKeTiep && (x.testKeTiep.endsWith(tuanToi) || x.testKeTiep.endsWith(tuanNay)));
  const cum: Cum[] = [];
  if (lopTest.length) {
    cum.push({ khoa: 'test', ten: t('Test tuần tới'), tom: t('Test'), so: lopTest.length, nhan: t('{n} lớp có Test trong 7 ngày tới', { n: lopTest.length }),
      hop: t('Test trong 7 ngày tới'),
      dong: lopTest.map((x) => <span key={x.classId}><Link className="font-semibold" to={duongLichTest({ classId: x.classId })}>{tenLop(x.classId) ?? `#${x.classId}`}</Link> <span className="text-dim">{x.testKeTiep}</span></span>),
      chan: <Link className="link" to={duongLichTest()}>{t('Lịch Test ›')}</Link> });
  }
  if (sapToi?.baoCaoPh.length) {
    const ds = sapToi.baoCaoPh;
    cum.push({ khoa: 'ph', ten: t('Báo cáo PH · mở {ngay}', { ngay: ngan(ds[0].mo) }), tom: t('Báo cáo PH'), so: ds.length,
      nhan: t('{n} lớp mở Báo cáo PH', { n: ds.length }), hop: t('Báo cáo PH · mở {ngay}', { ngay: ngan(ds[0].mo) }),
      dong: ds.map((d) => <span key={`${d.classId}|${d.dot}`}><Link className="font-semibold" to={`/hoc-vien/lop/${d.classId}?tab=bao-cao-ph&dot=${encodeURIComponent(d.dot)}`}>{d.code}</Link> <span className="text-dim">{d.nhanDot} · {t('mở {ngay}', { ngay: ngan(d.mo) })}</span></span>) });
  }
  if (!cum.length) return null;
  const GIAI_THICH = t('Việc sẽ có trong 7 ngày tới, chưa thành việc — không tính vào số việc.');
  const hop = (c: Cum) => (
    <div role="dialog" aria-label={c.hop} className="absolute left-0 top-full z-20 mt-1 w-[min(22rem,calc(100vw-2rem))] rounded-lg border p-3 shadow-lg max-sm:static max-sm:mt-0 max-sm:w-auto max-sm:rounded-none max-sm:border-0 max-sm:border-t max-sm:shadow-none"
      style={{ background: 'var(--surface)', borderColor: 'var(--line-strong)' }}>
      <div className="mb-1.5 flex items-center justify-between gap-2 max-sm:hidden">
        <h3 className="m-0 text-[14px] font-bold text-[color:var(--text)]">{c.hop}</h3>
        <button type="button" aria-label={t('Đóng')} onClick={() => { setMo(null); nutMo.current?.focus(); }}
          className="inline-flex h-9 w-9 appearance-none items-center justify-center rounded-md border-0 bg-transparent text-[color:var(--text-dim)] hover:bg-[color:var(--accent-soft)]">✕</button>
      </div>
      <ul className="m-0 flex list-none flex-col gap-1.5 p-0 text-[14px]">{c.dong.map((d, i) => <li key={i}>{d}</li>)}</ul>
      {c.chan && <div className="mt-2 border-t pt-2 text-[13px]" style={{ borderColor: 'var(--line)' }}>{c.chan}</div>}
    </div>
  );
  const bam = (k: string, e: React.MouseEvent<HTMLElement>) => { nutMo.current = e.currentTarget; setMo(mo === k ? null : k); };
  return (
    <div ref={goc} role="group" aria-label={t('Sắp tới')} className="relative mb-3 rounded-[10px] border text-[14px]" style={{ borderColor: 'var(--line)', background: 'var(--surface)' }}>
      {/* 1440: một dải 44 px */}
      <div className="flex min-h-[44px] items-center pl-4 pr-1 max-sm:hidden">
        <span className="pr-4 text-[14px] font-semibold text-[color:var(--text)]">{t('Sắp tới')}</span>
        {cum.map((c) => (
          <span key={c.khoa} className="relative inline-flex items-baseline gap-1.5 whitespace-nowrap border-l px-3.5 text-dim" style={{ borderColor: 'var(--line)' }}>
            {c.ten}
            <button type="button" aria-expanded={mo === c.khoa} aria-label={c.nhan} onClick={(e) => bam(c.khoa, e)} className={`${VUNG_BAM_SO} ${LOP_OSO} px-1`}>{c.so}</button>
            {mo === c.khoa && hop(c)}
          </span>
        ))}
        <span className="ml-auto"><NutLuat label={t('Giải thích Sắp tới')} phai>{GIAI_THICH}</NutLuat></span>
      </div>
      {/* 375: MỘT hàng 44 "Sắp tới · tên các cụm ⌄"; bấm mở mỗi cụm một hàng 44, hộp ngay dưới hàng bấm */}
      <div className="sm:hidden">
        <div className="flex items-center pr-1">
          <button type="button" aria-expanded={gonMo} onClick={() => { setGonMo(!gonMo); setMo(null); }}
            className="flex min-h-[44px] min-w-0 flex-1 appearance-none items-center gap-2.5 border-0 bg-transparent pl-3 pr-1 text-left text-[color:var(--text)]">
            <span className="font-semibold">{t('Sắp tới')}</span>
            <span className="min-w-0 flex-1 truncate text-dim">{cum.map((c) => c.tom).join(' · ')}</span>
            <span aria-hidden className={`text-dim transition-transform ${gonMo ? 'rotate-180' : ''}`}>⌄</span>
          </button>
          <NutLuat label={t('Giải thích Sắp tới')} phai>{GIAI_THICH}</NutLuat>
        </div>
        {gonMo && cum.map((c) => (
          <div key={c.khoa}>
            <button type="button" aria-expanded={mo === c.khoa} aria-label={c.nhan} onClick={(e) => bam(c.khoa, e)}
              className="flex min-h-[44px] w-full appearance-none items-center justify-between border-0 border-t bg-transparent px-3 text-left text-[15px] text-[color:var(--text)]"
              style={{ borderColor: 'var(--line)', ...(mo === c.khoa ? { background: 'var(--accent-soft)' } : {}) }}>
              <span>{c.ten}</span><span className="font-bold tabular-nums text-[color:var(--accent)]">{c.so}</span>
            </button>
            {mo === c.khoa && hop(c)}
          </div>
        ))}
      </div>
    </div>
  );
}
