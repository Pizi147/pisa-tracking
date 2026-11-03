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
export function DaiSo({ tq, onBam, dangTaiNo = false, nhom }: {
  tq: TongQuanLich; onBam: (o: OSo) => void;
  /** B13 (U06 #1): MỘT nhãn nhóm đứng đầu dải — "Của bạn:" / "Cả chi nhánh:" (chữ "Bạn" không lặp trong ô). */
  nhom?: string;
  /** UX-2 (1): số "Quá hạn chấm" đến từ đường riêng — đang tải thì "…", không hiện tạm một số khác. */
  dangTaiNo?: boolean;
}) {
  return (
    /* U06 (PTA 04/11 "màn để XEM ĐIỂM, không số về GV khác"): bỏ dòng "n bài của GV khác" dưới ô; một thẻ riêng như mockup V11. */
    <div className={`card grid overflow-clip p-0 ${nhom ? 'grid-cols-[128px_repeat(3,minmax(0,1fr))] max-sm:grid-cols-3' : 'grid-cols-3'}`} role="group" aria-label={t('Tiến độ chấm điểm')}>
      {nhom && <span className="flex items-center border-r border-[color:var(--line)] px-4 text-[13px] font-semibold text-dim max-sm:col-span-3 max-sm:border-b max-sm:border-r-0 max-sm:px-3 max-sm:py-2">{nhom}</span>}
      <O onClick={() => onBam('da-cham')} nhan={t('bài đã chấm')} ngan={t('đã chấm')} mo={tq.tong === 0}
        so={<>{tq.daCham}<span className="text-slate-500">/{tq.tong}</span></>} />
      <O onClick={() => onBam('con-phai-cham')} nhan={t('bài còn chấm')} ngan={t('còn chấm')} mo={tq.conPhaiCham === 0} so={tq.conPhaiCham} />
      <O onClick={() => onBam('no')} nhan={t('bài quá hạn')} ngan={t('quá hạn')} mo={dangTaiNo || tq.no.bai === 0} mau={!dangTaiNo && tq.no.bai > 0 ? 'text-late' : undefined}
        so={dangTaiNo ? '…' : tq.no.bai} />
    </div>
  );
}

/** Một ô số: số to trước, chữ sau (điện thoại: số trên, chữ dưới). `mo` = số 0 → chữ phụ, vẫn bấm được. */
function O({ nhan, ngan, so, onClick, mo, mau }: {
  /** `ngan`: chữ 375 (mockup V11 khu C "đã chấm") — ô hẹp, nhãn nhóm đã nói "bài". */
  nhan: string; ngan: string; so: ReactNode; onClick: () => void; mo?: boolean; mau?: string;
}) {
  return (
    <button type="button" onClick={onClick}
      className="flex min-h-[52px] min-w-0 cursor-pointer appearance-none flex-wrap items-baseline gap-x-2 border-0 border-r border-[color:var(--line)] bg-transparent px-2.5 py-2 text-left last:border-r-0 do-hang max-sm:flex-col max-sm:gap-0 sm:px-4 sm:py-2.5">
      <span className={`text-lg font-bold tabular-nums leading-tight sm:text-[22px] ${mau ?? (mo ? 'text-slate-500' : 'text-slate-100')}`}>{so}</span>
      <span className="text-[15px] text-slate-300 max-sm:text-[13px]"><span className="max-sm:hidden">{nhan}</span><span className="sm:hidden">{ngan}</span></span>
    </button>
  );
}
