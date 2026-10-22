import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useApi } from '../../lib/useApi.ts';
import { invalidate } from '../../lib/api.ts';
import { ChipHan } from '../../ui/Nhan.tsx';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import { PanelViec } from '../congViec/PanelViec.tsx';
import type { WorkItem } from '../worklist/WorkList.tsx';
import { LOAI_HAN_CUA_VIEC, shortDate } from '@shared/domain/index.ts';
import { dich, t } from '@shared/i18n/index.ts';

/** `GET /classes/:id/viec-theo-em` (SV-LOP + UI-HO-SO-LOP): việc theo em (cột Case + PA đọc lại) + `cuaToi` = việc của người xem ở lớp. */
export type ViecLop = { theoEm: Record<number, WorkItem[]>; cuaToi: WorkItem[] };
export const duongViecLop = (classId: number) => `/classes/${classId}/viec-theo-em`;
const TOI_DA = 6;

/**
 * THANH "VIỆC CẦN LÀM" ĐẦU HỒ SƠ LỚP (`dieu-chinh-cuoi.html` khu b, `.thanh-viec`): mỗi việc CỦA NGƯỜI XEM ở lớp một ô — tên việc (+ em) · trạng thái
 * hạn + hạn `dd/mm` (P7) · nút động từ. Vạch trái: quá hạn đỏ · hạn hôm nay vàng · còn lại xanh. Bấm nút = panel Công việc ngay tại trang (`PanelViec`,
 * không đổi trang). Không có việc → không vẽ thanh. Quá 6 việc → "Xem tất cả ở Công việc ›".
 */
export function ThanhViecLop({ classId, onDoi }: { classId: number; onDoi: () => void }) {
  const { data, reload } = useApi<ViecLop>(duongViecLop(classId), [classId]);
  const [mo, setMo] = useState<WorkItem | null>(null);
  const ds = data?.cuaToi ?? [];
  const daLam = () => { invalidate('/my-work'); reload(); onDoi(); };
  const keTiep = mo ? ds[ds.findIndex((x) => x.key === mo.key) + 1] ?? null : null;
  return (
    <>
      {ds.length > 0 && (
        <section aria-label={t('Việc cần làm')} className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
          {ds.slice(0, TOI_DA).map((it) => <OViec key={it.key} it={it} dangMo={mo?.key === it.key} onMo={() => setMo(it)} />)}
          {ds.length > TOI_DA && (
            <Link to={`/cong-viec?lop=${classId}`} className="link self-center text-[13px]">{t('Xem tất cả ở Công việc ›')}</Link>
          )}
        </section>
      )}
      {mo && <PanelViec key={mo.key} it={mo} onDong={() => setMo(null)} onDaLam={daLam} onTiep={keTiep ? () => setMo(keTiep) : null}
        tenTiep={keTiep?.studentId !== null ? keTiep?.studentName : null} />}
    </>
  );
}

/** Một ô việc (mockup `.viec`): tên đậm · dòng phụ (số bài, trạng thái hạn, hạn) · nút bên phải. */
function OViec({ it, dangMo, onMo }: { it: WorkItem; dangMo: boolean; onMo: () => void }) {
  const { homNay } = useNgayNghiepVu();
  const vach = it.urgency === 'overdue' ? 'rgb(var(--bad-rgb))' : it.urgency === 'today' ? 'rgb(var(--soon-line-rgb))' : 'var(--accent)';
  const ten = [dich(it.tieuDe), it.studentId !== null ? it.studentName : null].filter(Boolean).join(' · ');
  return (
    <div className={`grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-2.5 gap-y-1 rounded-[10px] border border-l-4 px-3 py-2.5 ${dangMo ? 'bg-[color:var(--accent-soft)]' : 'bg-[color:var(--surface)]'}`}
      style={{ borderColor: 'var(--line)', borderLeftColor: vach }}>
      <span className="min-w-0 truncate text-[14px] font-bold text-slate-100" title={ten}>{ten}</span>
      <button type="button" className={`btn btn-sm row-span-2 max-sm:min-h-[44px] ${it.group === 'score' ? 'btn-primary' : ''}`} onClick={onMo} aria-expanded={dangMo}>
        {dich(it.actionLabel)}
      </button>
      <span className="flex min-w-0 flex-wrap items-center gap-2 text-[13px] text-slate-400">
        {it.group === 'score' && it.soBai ? <span className="tabular-nums">{t('{soBai} bài', { soBai: it.soBai })}</span> : null}
        {it.due && (it.urgency === 'normal'
          ? <span>{t('hạn')} <b className="font-bold tabular-nums text-slate-200">{shortDate(it.due, homNay)}</b></span>
          : <>
              <ChipHan loai={LOAI_HAN_CUA_VIEC[it.group] ?? 'viec-van-hanh'} han={it.due} />
              <b className={`font-bold tabular-nums ${it.urgency === 'overdue' ? 'text-bad' : 'text-slate-200'}`}>{it.urgency === 'overdue' && <span aria-hidden className="text-xs">⚠ </span>}{shortDate(it.due, homNay)}</b>
            </>)}
      </span>
    </div>
  );
}
