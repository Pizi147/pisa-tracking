import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { t } from '@shared/i18n/index.ts';
import { useBamNgoai } from '../../ui/useBamNgoai.ts';
import { NoiTren } from '../../ui/NoiTren.tsx';
import { useDienThoai } from '../../ui/TheDong.tsx';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import { VUNG_BAM_SO, LOP_OSO } from '../../ui/SoLieu.tsx';

/** `/my-work` vai GV, khoá `sapToi` (LG-13 H7): đợt Báo cáo PH sắp mở trong 7 ngày (chưa thành việc) — không có thì máy chủ không trả khoá. */
export type SapToiGv = {
  baoCaoPh: { classId: number; code: string; dot: string; nhanDot: string; mo: string }[];
};

/**
 * BAO-PH-SAP-MO (chủ SP 24/11, sau #2001 bỏ dải "Sắp tới"): MỘT dòng chữ nhỏ dưới "Lớp của tôi" — "Báo cáo PH · mở dd/mm/yyyy · [n] lớp"; ô số mở
 * hộp danh sách cũ của dải (đợt từng lớp, link sang tab Báo cáo PH của lớp) tại chỗ — dữ liệu `sapToi` đã có trong `/my-work`, 0 request.
 * Không vào số việc / badge; không có đợt nào thì không vẽ. 1440 hộp nổi neo ô số (`NoiTren`), 375 hộp nằm ngay dưới dòng.
 */
export function BaoCaoPhSapMo({ sapToi }: { sapToi?: SapToiGv }) {
  const { homNay, ngan } = useNgayNghiepVu();
  const [mo, setMo] = useState(false);
  const goc = useRef<HTMLDivElement>(null);
  const nutMo = useRef<HTMLButtonElement>(null);
  const hopEl = useRef<HTMLDivElement>(null);
  const dt = useDienThoai();
  useBamNgoai(mo, () => setMo(false), goc);
  useEffect(() => {
    if (!mo) return undefined;
    hopEl.current?.querySelector<HTMLElement>('a, button')?.focus();   // XM-8: tiêu điểm vào hộp
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') { setMo(false); nutMo.current?.focus(); } };
    document.addEventListener('keydown', esc);
    return () => document.removeEventListener('keydown', esc);
  }, [mo]);
  const ds = sapToi?.baoCaoPh ?? [];
  if (!homNay || !ds.length) return null;
  const ngay = ngan(ds.reduce((m, d) => (d.mo < m ? d.mo : m), ds[0].mo));
  const soLop = new Set(ds.map((d) => d.classId)).size;
  const tieuDe = t('Báo cáo PH · mở {ngay}', { ngay });
  return (
    <div ref={goc} className="relative mt-2 px-1 text-[13px] text-dim max-sm:px-0">
      <div className="flex min-h-[32px] flex-wrap items-center gap-x-1 max-sm:min-h-[44px]">
        <span>{tieuDe} ·</span>
        {/* PTA rà #2017: số + đơn vị MỘT khối trong ô số ("2 lớp"), không tách. */}
        <button ref={nutMo} type="button" aria-expanded={mo} aria-label={t('{n} lớp mở Báo cáo PH', { n: soLop })} onClick={() => setMo(!mo)}
          className={`${VUNG_BAM_SO} ${LOP_OSO} whitespace-nowrap px-1 !text-[13px]`}>{t('{n} lớp', { n: soLop })}</button>
      </div>
      {mo && (
        <NoiTren ref={hopEl} neo={nutMo} taiCho={dt} role="dialog" aria-label={tieuDe}
          className="w-[min(22rem,calc(100vw-2rem))] rounded-lg border p-3 shadow-lg max-sm:w-auto max-sm:shadow-none"
          style={{ background: 'var(--surface)', borderColor: 'var(--line-strong)' }}>
          <div className="mb-1.5 flex items-center justify-between gap-2">
            <h3 className="m-0 text-[14px] font-bold text-[color:var(--text)]">{tieuDe}</h3>
            <button type="button" aria-label={t('Đóng')} onClick={() => { setMo(false); nutMo.current?.focus(); }}
              className="inline-flex h-9 w-9 appearance-none items-center justify-center rounded-md border-0 bg-transparent text-[color:var(--text-dim)] hover:bg-[color:var(--accent-soft)]">✕</button>
          </div>
          <ul className="m-0 flex list-none flex-col gap-1.5 p-0 text-[14px]">
            {ds.map((d) => (
              <li key={`${d.classId}|${d.dot}`}>
                <Link className="font-semibold" to={`/hoc-vien/lop/${d.classId}?tab=bao-cao-ph&dot=${encodeURIComponent(d.dot)}`}>{d.code}</Link>{' '}
                <span className="text-dim">{d.nhanDot} · {t('mở {ngay}', { ngay: ngan(d.mo) })}</span>
              </li>
            ))}
          </ul>
        </NoiTren>
      )}
    </div>
  );
}
