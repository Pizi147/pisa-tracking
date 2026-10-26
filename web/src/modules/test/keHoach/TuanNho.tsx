import { useRef, useState } from 'react';
import { api } from '../../../lib/api.ts';
import { addDaysStr } from '../../../lib/format.ts';
import { LichNho } from '../../../ui/LichNho.tsx';
import { ngay, tuanLich, tuanNamChu } from '@shared/domain/index.ts';
import { t } from '@shared/i18n/index.ts';
import { useNgayNghiepVu } from '../../../ui/ngayNghiepVu.ts';

export type Tuan = { periodId: number; weekStart: string };

/** `/ref/periods/resolve` trả cả `weekStart` (thứ Hai của tuần) cùng `id` thật. */
export const resolveTuan = (weekStart: string) => api.post<{ id: number; weekStart: string }>('/ref/periods/resolve', { weekStart })
  .then((r): Tuan => ({ periodId: r.id, weekStart: r.weekStart }));

/**
 * BỘ CHỌN TUẦN GỌN cho hộp nhỏ: MỘT thanh `‹ W3 SEP 14/09 – 20/09 ›` (44px trên điện thoại, 32px từ 640px) — đổi ±1 tuần là thao
 * tác hay gặp nhất. Bấm giữa mở POPOVER lịch tháng (`LichNho`: gõ tuần/ngày, lịch, "Tuần này" trong "Gần đây"); chọn xong popover
 * đóng (PR-LM, ảnh 4: bỏ thanh `WeekPicker` thứ hai chèn bên dưới). Mã tuần không bao giờ bị cắt; khoảng ngày xuống dòng khi chật.
 */
export function TuanNho({ d, goc, onTuan, nhanKhoa = null, toiThieu = null, gon = false, nam = false }: {
  /** OV-15c (C20): Kế hoạch Test / hộp lịch luôn ghi năm `W4 AUG/2026`. */
  nam?: boolean;
  d: { periodId: number | null; weekStart: string | null }; goc: string | null; onTuan: (t: Tuan) => void; nhanKhoa?: string | null;
  /** PR-XLMT (K2-33): thứ Hai sớm nhất được chọn — nút ‹ và ngày trong lịch trước tuần này bị khoá (MT đang chạy không dời vào tuần đã qua). */
  toiThieu?: string | null;
  /** PR-XTHV: ô trong bảng — chỉ mã tuần, khoảng ngày nằm ở `title`. */
  gon?: boolean;
}) {
  const { homNay } = useNgayNghiepVu();
  const [busy, setBusy] = useState(false);
  const [mo, setMo] = useState(false);
  const giua = useRef<HTMLButtonElement>(null);
  const co = d.weekStart ?? goc;
  const chon = (weekStart: string) => {
    if (busy) return;
    setBusy(true);
    resolveTuan(weekStart).then((t) => { onTuan(t); setMo(false); }).catch(() => { /* giữ tuần cũ */ }).finally(() => setBusy(false));
  };
  const khoang = (iso: string) => `${ngay(iso, homNay)} – ${ngay(addDaysStr(iso, 6), homNay)}`;
  const nut = 'btn flex-none min-h-[44px] min-w-[36px] justify-center px-2 sm:min-h-[32px]';
  return (
    <div className="min-w-0">
      <div className="flex items-stretch gap-1.5">
        <button type="button" className={nut} disabled={busy || !co || (!!toiThieu && co <= toiThieu)} onClick={() => co && chon(addDaysStr(co, -7))} aria-label={t('Tuần trước')}>‹</button>
        <button ref={giua} type="button"
          className="field flex min-h-[44px] min-w-0 flex-1 flex-wrap items-center justify-between gap-x-2 gap-y-0 px-2 py-1 text-left text-xs sm:min-h-[32px]"
          aria-haspopup="dialog" aria-expanded={mo} onClick={() => setMo((v) => !v)}
          title={d.weekStart ? t('{khoang} · bấm để chọn tuần khác', { khoang: khoang(d.weekStart) }) : t('Chọn tuần khác')}>
          <span className="whitespace-nowrap text-slate-100">{d.weekStart ? (nam ? tuanNamChu(d.weekStart) : tuanLich(d.weekStart, homNay)) : t('Chọn tuần')}</span>
          {d.weekStart && !gon && <span className="text-xs tabular-nums text-slate-500">{khoang(d.weekStart)}</span>}
        </button>
        <button type="button" className={nut} disabled={busy || !co} onClick={() => co && chon(addDaysStr(co, 7))} aria-label={t('Tuần sau')}>›</button>
      </div>
      {nhanKhoa && <div className="mt-0.5 text-xs text-slate-500">{nhanKhoa}</div>}
      {mo && homNay && (
        <LichNho kieu="tuan" goNgay value={d.weekStart ?? null} homNay={homNay} luat={toiThieu ? { toiThieu } : {}} neo={giua}
          onChon={chon} onDong={() => setMo(false)} />
      )}
    </div>
  );
}
