import type { ReactNode } from 'react';
import type { TongQuanLich } from './kieu.ts';
import { t } from '@shared/i18n/index.ts';

export type OSo = 'da-cham' | 'con-phai-cham' | 'no';

/**
 * DẢI SỐ của Lịch tuần (UI-LICH-TUAN, dieu-chinh-cuoi khu a) — ba ô một hàng trong thẻ, số to trước, chữ sau: "117/177 bài đã chấm" ·
 * "60 bài còn chấm" · "3 bài quá hạn" (đỏ khi > 0). Hai ô đầu = tuần đang xem; ô ba = Tổng quan "Bài quá hạn" của khung đang xem (UX-2,
 * OV-14b) → mở DANH SÁCH các ô đó. Số nào cũng bấm được và mở đúng tập tạo ra số đó. Số đã cộng sẵn ở máy chủ.
 * OV-11e (TE-7): người có phân công — số là bài của CHÍNH họ; bài GV khác ghi nhạt dưới số ("n bài của GV khác").
 */
export function DaiSo({ tq, onBam, dangTaiNo = false }: {
  tq: TongQuanLich; onBam: (o: OSo) => void;
  /** UX-2 (1): số "Quá hạn chấm" đến từ đường riêng — đang tải thì "…", không hiện tạm một số khác. */
  dangTaiNo?: boolean;
}) {
  return (
    <div className="grid grid-cols-3 border-b border-[color:var(--line)]" role="group" aria-label={t('Tiến độ chấm điểm')}>
      <O onClick={() => onBam('da-cham')} nhan={t('bài đã chấm')} mo={tq.tong === 0}
        so={<>{tq.daCham}<span className="text-[15px] text-slate-500">/{tq.tong}</span></>} />
      <O onClick={() => onBam('con-phai-cham')} nhan={t('bài còn chấm')} mo={tq.conPhaiCham === 0} so={tq.conPhaiCham}
        phu={tq.khac.con > 0 && <Khac n={tq.khac.con} />} />
      <O onClick={() => onBam('no')} nhan={t('bài quá hạn')} mo={dangTaiNo || tq.no.bai === 0} mau={!dangTaiNo && tq.no.bai > 0 ? 'text-late' : undefined}
        so={dangTaiNo ? '…' : tq.no.bai} phu={tq.khac.no > 0 && <Khac n={tq.khac.no} />} />
    </div>
  );
}

/** SUA-375: điện thoại ô chỉ ~93 px → chữ gọn "15 GV khác" một dòng (nhãn ô đã nói "bài"). */
const Khac = ({ n }: { n: number }) => (
  <span className="block w-full text-xs font-normal leading-tight text-slate-500">
    <span className="sm:hidden">{t('{n} GV khác', { n })}</span><span className="max-sm:hidden">{t('{n} bài của GV khác', { n })}</span>
  </span>
);

/** Một ô số: số to trước, chữ sau (điện thoại: số trên, chữ dưới). `mo` = số 0 → chữ phụ, vẫn bấm được. */
function O({ nhan, so, phu, onClick, mo, mau }: {
  nhan: string; so: ReactNode; phu?: ReactNode; onClick: () => void; mo?: boolean; mau?: string;
}) {
  return (
    <button type="button" onClick={onClick}
      className="flex min-h-[44px] min-w-0 cursor-pointer appearance-none flex-wrap items-baseline gap-x-2 border-0 border-r border-[color:var(--line)] bg-transparent px-2.5 py-2 text-left last:border-r-0 do-hang max-sm:flex-col max-sm:gap-0 sm:px-4 sm:py-2.5">
      <span className={`text-lg font-bold tabular-nums leading-tight sm:text-[22px] ${mau ?? (mo ? 'text-slate-500' : 'text-slate-100')}`}>{so}</span>
      <span className="text-[13px] text-slate-400">{nhan}</span>
      {phu}
    </button>
  );
}
