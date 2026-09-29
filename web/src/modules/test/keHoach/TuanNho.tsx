import { useState } from 'react';
import { api } from '../../../lib/api.ts';
import { addDaysStr } from '../../../lib/format.ts';
import { WeekPicker } from '../../../ui/Filters.tsx';
import { tuanLich } from '@shared/domain/index.ts';

export type Tuan = { periodId: number; weekStart: string };

/** `/ref/periods/resolve` trả cả `weekStart` (thứ Hai của tuần) cùng `id` thật. */
export const resolveTuan = (weekStart: string) => api.post<{ id: number; weekStart: string }>('/ref/periods/resolve', { weekStart })
  .then((r): Tuan => ({ periodId: r.id, weekStart: r.weekStart }));

/**
 * BỘ CHỌN TUẦN GỌN cho hộp nhỏ: `‹ 14/09 – 20/09 · W3 SEP ›` một hàng 32px (44px trên điện thoại) — đổi ±1 tuần là thao tác
 * hay gặp nhất. Bấm giữa để mở bộ chọn đầy đủ (`WeekPicker`: gõ ngày, lịch tháng) khi cần nhảy xa. Bộ chọn đầy đủ nhận đúng
 * tuần HIỆN CÓ làm giá trị ban đầu, nên không tự phát "tuần này".
 */
export function TuanNho({ d, goc, onTuan, nhanKhoa = null, toiThieu = null }: {
  d: { periodId: number | null; weekStart: string | null }; goc: string | null; onTuan: (t: Tuan) => void; nhanKhoa?: string | null;
  /** PR-XLMT (K2-33): thứ Hai sớm nhất được chọn — nút ‹ không lùi qua tuần này (dời lượt có sẵn không vào tuần đã qua). */
  toiThieu?: string | null;
}) {
  const [busy, setBusy] = useState(false);
  const [rong, setRong] = useState(false);
  const co = d.weekStart ?? goc;
  const buoc = (n: number) => {
    if (!co || busy) return;
    setBusy(true);
    resolveTuan(addDaysStr(co, 7 * n)).then(onTuan).catch(() => { /* giữ tuần cũ */ }).finally(() => setBusy(false));
  };
  const dm = (iso: string) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}`;
  const nut = 'btn flex-none min-h-[44px] min-w-[36px] justify-center px-2 sm:min-h-[32px]';
  return (
    <div className="min-w-0">
      <div className="flex items-stretch gap-1.5">
        <button type="button" className={nut} disabled={busy || !co || (!!toiThieu && co <= toiThieu)} onClick={() => buoc(-1)} aria-label="Tuần trước">‹</button>
        <button type="button" className="field flex min-h-[44px] min-w-0 flex-1 items-center justify-between gap-1 px-2 text-left text-xs sm:min-h-[32px]"
          aria-expanded={rong} onClick={() => setRong((v) => !v)}
          title={d.weekStart ? `${dm(d.weekStart)} – ${dm(addDaysStr(d.weekStart, 6))} · bấm để chọn tuần khác` : 'Chọn tuần khác'}>
          <span className="truncate text-slate-100">{d.weekStart ? tuanLich(d.weekStart) : 'Chọn tuần'}</span>
          <span className="shrink-0 text-[10.5px] text-slate-500 max-[430px]:hidden">{d.weekStart ? `${dm(d.weekStart)}–${dm(addDaysStr(d.weekStart, 6))}` : ''}</span>
        </button>
        <button type="button" className={nut} disabled={busy || !co} onClick={() => buoc(1)} aria-label="Tuần sau">›</button>
      </div>
      {nhanKhoa && <div className="mt-0.5 text-[11px] text-slate-500">{nhanKhoa}</div>}
      {rong && (
        <div className="mt-1.5">
          <WeekPicker periodId={d.periodId} label={null} scope="planning"
            onPeriod={(id) => {
              if (!id) return;
              void api.get<Array<{ isAnchor: boolean; weekStart: string }>>(`/ref/period-window?anchorId=${id}&scope=planning`)
                .then((w) => { const a = w.find((x) => x.isAnchor); if (a) { onTuan({ periodId: id, weekStart: a.weekStart }); setRong(false); } })
                .catch(() => { /* giữ tuần cũ */ });
            }} />
        </div>
      )}
    </div>
  );
}
