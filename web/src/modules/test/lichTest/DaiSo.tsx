import type { ReactNode } from 'react';
import type { TongQuanLich } from './kieu.ts';
import { t } from '@shared/i18n/index.ts';

export type OSo = 'da-cham' | 'no';

/**
 * DẢI SỐ của Lịch tuần — AUDIT-UI B8 (T1, chủ SP 08/11): HAI ô, số to trước, chữ sau: "117/177 bài đã chấm" · "3 bài quá hạn" (đỏ khi > 0).
 * Ô "còn chấm" bỏ (= tổng − đã chấm): số còn ở `title` ô đã chấm; bấm ô đã chấm mở nhóm Test tuần này và các hàng còn bài (thao tác cũ của ô bỏ).
 * Ô hai = Tổng quan "Bài quá hạn" của khung đang xem (UX-2, OV-14b) → mở DANH SÁCH các ô đó. Số đã cộng sẵn ở máy chủ.
 */
export function DaiSo({ tq, onBam, dangTaiNo = false, nhom }: {
  tq: TongQuanLich; onBam: (o: OSo) => void;
  /** B13 (U06 #1): MỘT nhãn nhóm đứng đầu dải — "Của bạn:" / "Cả chi nhánh:" (chữ "Bạn" không lặp trong ô). */
  nhom?: string;
  /** UX-2 (1): số "Quá hạn chấm" đến từ đường riêng — đang tải thì "…", không hiện tạm một số khác. */
  dangTaiNo?: boolean;
}) {
  return (
    /* B8 (mockup): ô rộng theo nội dung, không chia đều; 375 nhãn nhóm một hàng trên, hai ô dưới. */
    <div className="card flex flex-wrap items-stretch overflow-clip p-0" role="group" aria-label={t('Tiến độ chấm điểm')}>
      {nhom && <span className="flex items-center px-[18px] text-[13px] font-semibold text-dim max-sm:basis-full max-sm:border-b max-sm:border-[color:var(--line)] max-sm:px-3 max-sm:py-2">{nhom}</span>}
      <O onClick={() => onBam('da-cham')} nhan={t('bài đã chấm')} ngan={t('đã chấm')} mo={tq.tong === 0}
        title={tq.conPhaiCham > 0 ? t('Còn {conBai} bài', { conBai: tq.conPhaiCham }) : undefined}
        so={<>{tq.daCham}/{tq.tong}</>} />
      <O onClick={() => onBam('no')} nhan={t('bài quá hạn')} ngan={t('quá hạn')} mo={dangTaiNo || tq.no.bai === 0} mau={!dangTaiNo && tq.no.bai > 0 ? 'text-late' : undefined}
        so={dangTaiNo ? '…' : tq.no.bai} />
    </div>
  );
}

/** Một ô số: số to trước, chữ sau. `mo` = số 0 → chữ phụ, vẫn bấm được. */
function O({ nhan, ngan, so, onClick, mo, mau, title }: {
  /** `ngan`: chữ 375 (mockup V11 khu C "đã chấm") — ô hẹp, nhãn nhóm đã nói "bài". */
  nhan: string; ngan: string; so: ReactNode; onClick: () => void; mo?: boolean; mau?: string; title?: string;
}) {
  return (
    <button type="button" onClick={onClick} title={title}
      className="flex min-h-[52px] min-w-0 cursor-pointer appearance-none items-baseline gap-2 border-0 border-l border-[color:var(--line)] bg-transparent px-3 py-2 text-left do-hang first:border-l-0 max-sm:min-h-[44px] max-sm:[&:nth-child(2)]:border-l-0 sm:px-[18px] sm:py-3">
      <span className={`text-[22px] font-bold tabular-nums leading-tight ${mau ?? (mo ? 'text-faint' : 'text-[color:var(--accent)]')}`}>{so}</span>
      <span className="text-sm text-dim"><span className="max-sm:hidden">{nhan}</span><span className="sm:hidden">{ngan}</span></span>
    </button>
  );
}
