import { useApi } from '../../lib/useApi.ts';
import { ErrorState, Skeleton } from '../../ui/ui.tsx';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import { fmtSize } from '../../ui/TepCho.tsx';
import { ngay } from '@shared/domain/index.ts';
import { dich, t } from '@shared/i18n/index.ts';
import { ChipMon } from './BangLan.tsx';
import type { XuLyView } from './kieu.ts';

type Tep = { id: number; kind: 'file' | 'link'; displayName: string; href: string; sizeBytes: number | null };
const LA_ANH = /\.(png|jpe?g|gif|webp)$/i;
const tenMien = (url: string) => { try { return new URL(url).host; } catch { return url; } };

/** Đầu mục trong panel (V21: 15 / 700, vạch 3 × 18 px nhấn, chip đếm vuông). */
function DauMuc({ chu, n }: { chu: string; n: number }) {
  return (
    <h3 className="m-0 mt-5 flex items-center gap-2 text-[14px] font-bold text-[color:var(--text)]">
      <span aria-hidden className="h-[18px] w-[3px] rounded-sm bg-[color:var(--accent)]" />{chu}
      <span className="rounded border px-1.5 text-xs font-semibold tabular-nums" style={{ borderColor: 'var(--line-strong)' }}>{n}</span>
    </h3>
  );
}

/**
 * #6 (rà 11/11 G3-5, mockup #1346 K3): panel duyệt của QL — vi phạm + bằng chứng của lần xử lý NGAY tại chỗ (không phải Mở › hồ sơ HV › quay lại).
 * MỘT request khi panel mở (`kemTep=1`); danh sách Chờ duyệt không đọc thêm. Ảnh xem ngay; tệp / liên kết mở tab mới.
 */
export function KhoiDuyetYThuc({ measureId, luoi = false }: {
  measureId: number;
  /** v24 H1: phần mở tại dòng — trả các CẶP nhãn · giá trị ("3 vi phạm" · "1 bằng chứng") để xếp vào lưới `.dyc-kv` của thẻ, cùng cột nhãn. */
  luoi?: boolean;
}) {
  const { homNay } = useNgayNghiepVu();
  const { data, error, reload } = useApi<XuLyView & { tep: Tep[] }>(`/y-thuc/xu-ly/${measureId}?kemTep=1`, [measureId]);
  if (luoi) {
    if (error) return <><span /><ErrorState message={error.message} hint={error.hint} status={error.status} onRetry={reload} /></>;
    if (!data) return <><span /><Skeleton rows={2} /></>;
    return (
      <>
        <span>{t('{n} vi phạm', { n: data.viPham.length })}</span>
        <ul className="m-0 grid list-none gap-2 p-0">
          {data.viPham.map((v) => (
            <li key={v.id} className="min-w-0">
              <span className="flex flex-wrap items-baseline gap-x-2">
                <b className="whitespace-nowrap font-semibold tabular-nums">{ngay(v.occurredOn, homNay)}</b>
                <span className="inline-flex items-baseline"><ChipMon skill={v.skill} /><span>{v.ten}</span></span>
              </span>
              <span className="block text-[13px] text-dim">
                {[dich(v.categoryLabel), v.reportedByName ? t('{ten} ghi', { ten: v.reportedByName }) : null, v.moTa ? `“${v.moTa}”` : null].filter(Boolean).join(' · ')}
              </span>
            </li>
          ))}
        </ul>
        <span>{t('{n} bằng chứng', { n: data.tep.length })}</span>
        {data.tep.length === 0 ? <span className="text-dim">{t('Không có tệp hoặc liên kết.')}</span> : (
          <ul className="m-0 grid list-none gap-1.5 p-0">
            {data.tep.map((f) => (
              <li key={f.id} className="min-w-0">
                <a className="link break-all font-semibold" href={f.href} target="_blank" rel="noopener noreferrer" aria-label={t('Mở {ten}', { ten: f.displayName })}>{f.displayName}</a>
                <span className="ml-2 text-xs text-dim">{f.kind === 'file' ? (f.sizeBytes != null ? fmtSize(f.sizeBytes) : '') : tenMien(f.href)}</span>
                {f.kind === 'file' && LA_ANH.test(f.displayName) && (
                  <img src={f.href} alt={f.displayName} loading="lazy" className="mt-1.5 block max-h-40 max-w-full rounded-md border object-contain" style={{ borderColor: 'var(--line)' }} />
                )}
              </li>
            ))}
          </ul>
        )}
      </>
    );
  }
  if (error) return <div className="mt-3"><ErrorState message={error.message} hint={error.hint} status={error.status} onRetry={reload} /></div>;
  if (!data) return <div className="mt-3"><Skeleton rows={2} /></div>;
  return (
    <div className="text-sm">
      <DauMuc chu={t('Vi phạm')} n={data.viPham.length} />
      <ul className="m-0 mt-1.5 list-none divide-y p-0" style={{ borderColor: 'var(--line)' }}>
        {data.viPham.map((v) => (
          <li key={v.id} className="grid grid-cols-[44px_minmax(0,1fr)] gap-x-2 py-2">
            <span className="pt-0.5 text-[13px] font-semibold tabular-nums text-dim">{ngay(v.occurredOn, homNay)}</span>
            <span className="min-w-0">
              <span className="flex items-start"><ChipMon skill={v.skill} /><b className="font-semibold text-[color:var(--text)]">{v.ten}</b></span>
              <span className="block text-[13px] text-slate-400">
                {[dich(v.categoryLabel), v.reportedByName ? t('{ten} ghi', { ten: v.reportedByName }) : null, v.moTa ? `“${v.moTa}”` : null].filter(Boolean).join(' · ')}
              </span>
            </span>
          </li>
        ))}
      </ul>
      <DauMuc chu={t('Bằng chứng')} n={data.tep.length} />
      {data.tep.length === 0 ? <p className="m-0 mt-1.5 text-[13px] text-slate-400">{t('Không có tệp hoặc liên kết.')}</p> : (
        <ul className="m-0 mt-1.5 list-none divide-y p-0" style={{ borderColor: 'var(--line)' }}>
          {data.tep.map((f) => (
            <li key={f.id} className="py-2">
              <span className="flex flex-wrap items-baseline gap-x-2">
                <span className="min-w-0 break-all text-[color:var(--text)]">{f.displayName}</span>
                <span className="text-xs text-slate-400">{f.kind === 'file' ? (f.sizeBytes != null ? fmtSize(f.sizeBytes) : '') : tenMien(f.href)}</span>
                <a className="link-nho ml-auto inline-flex min-h-[44px] items-center sm:min-h-0" href={f.href} target="_blank" rel="noopener noreferrer"
                  aria-label={t('Mở {ten}', { ten: f.displayName })}>{t('Mở')}</a>
              </span>
              {f.kind === 'file' && LA_ANH.test(f.displayName) && (
                <img src={f.href} alt={f.displayName} loading="lazy" className="mt-1.5 max-h-40 max-w-full rounded-md border object-contain" style={{ borderColor: 'var(--line)' }} />
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
