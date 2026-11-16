import { createContext, useContext, useState } from 'react';
import { useApi } from '../../lib/useApi.ts';
import { ChipHan, Nhan } from '../../ui/Nhan.tsx';
import { lazyHop } from '../../ui/lazyHop.tsx';
import { KHOI_VANG } from './chuyenLopChung.tsx';
import type { DuLieu } from './PanelXetLai.tsx';
import { t } from '@shared/i18n/index.ts';

/* TD-NGUOI-2: phần Xét lại hồ sơ lớp / HV dùng thẳng (đường dẫn, chip, dải) — tách khỏi `PanelXetLai.tsx` để panel tải khi mở. */
const PanelXetLai = lazyHop(() => import('./PanelXetLai.tsx').then((x) => x.PanelXetLai));

export const duongXetLai = (classId: number, studentId?: number | null) => `/classes/${classId}/xet-lai${studentId ? `?studentId=${studentId}` : ''}`;

/** Chip vàng "Xét lại" (mockup `.chip-xl`) — chip nhà `Nhan`. */
export function ChipXetLai({ onClick }: { onClick?: () => void }) {
  return <Nhan tone="soon" onClick={onClick}>{t('Xét lại')}</Nhan>;
}

/** Hồ sơ lớp: em nào đang có dòng Xét lại (chip trên dòng em) — cùng dữ liệu panel; bấm chip mở panel một em. */
export const XetLaiCtx = createContext<{ co: ReadonlySet<number>; mo: (sid: number) => void } | null>(null);
export function ChipXetLaiDong({ sid }: { sid: number }) {
  const c = useContext(XetLaiCtx);
  if (!c?.co.has(sid)) return null;
  return <ChipXetLai onClick={() => c.mo(sid)} />;
}

/** Hồ sơ HV (mockup khung 1c): dải vàng "Xét lại lộ trình · {lý do} · hạn …  Xét lại ›" — bấm mở panel đúng em đó tại trang. */
export function DaiXetLai({ classId, studentId }: { classId: number; studentId: number }) {
  const { data, reload } = useApi<DuLieu>(duongXetLai(classId, studentId), [classId, studentId]);
  const [mo, setMo] = useState(false);
  const e = data?.em.find((x) => x.studentId === studentId && !x.quyetDinh);
  if (!e) return null;
  return (
    <>
      <div role="status" className="flex flex-wrap items-center gap-x-3 gap-y-1.5 rounded-lg border px-3 py-2 text-sm" style={KHOI_VANG}>
        <b className="shrink-0 text-slate-100">{t('Xét lại lộ trình')}</b>
        <span className="min-w-0 text-slate-300 max-sm:basis-full">{e.lyDo.chu}{e.daChot.chu ? ` · ${e.daChot.chu}` : ''}</span>
        <ChipHan loai="viec-van-hanh" han={e.han} />
        <button type="button" className="btn btn-sm ml-auto min-h-[44px] sm:min-h-0" onClick={() => setMo(true)}>{data!.chiXem ? t('Xem') : t('Xét lại')}</button>
      </div>
      {mo && <PanelXetLai classId={classId} studentId={studentId} onClose={() => { setMo(false); reload(); }} />}
    </>
  );
}
