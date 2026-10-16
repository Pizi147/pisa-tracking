import type { ReactNode } from 'react';
import type { TongQuanLich } from './kieu.ts';
import { t } from '@shared/i18n/index.ts';

export type OSo = 'da-cham' | 'con-phai-cham' | 'no';

/**
 * DẢI SỐ của Lịch Test (PR-UX1, G-10; PR-LT3 Q1 còn ba ô) — số nào cũng bấm được và mở đúng TẬP tạo ra số đó: hai ô đầu → khối 2
 * (tuần hiện tại) hoặc khối 3 (tuần khác); ô ba "Quá hạn chấm" (UX-2) = Tổng quan "Bài quá hạn" (gồm ô tuần trước nằm ở khối 2) → mở
 * DANH SÁCH các ô đó, không mở một khối. Ba ô một hàng cả trên điện thoại. Số đã cộng sẵn ở máy chủ.
 * OV-11e (TE-7): người có phân công — số là bài của CHÍNH họ; bài GV khác ghi nhạt dưới số ("n bài của GV khác").
 */
export function DaiSo({ tq, tenTuan, onBam }: {
  tq: TongQuanLich; tenTuan: string; onBam: (o: OSo) => void;
}) {
  return (
    <div className="grid grid-cols-3 gap-2" role="group" aria-label={t('Tiến độ chấm điểm')}>
      <O onClick={() => onBam('da-cham')} nhan={t('{tenTuan} đã chấm', { tenTuan })} mo={tq.tong === 0}>
        {tq.daCham}/{tq.tong} <Don>{t('bài')}</Don>
      </O>
      <O onClick={() => onBam('con-phai-cham')} nhan={t('Còn phải chấm')} mo={tq.conPhaiCham === 0}>
        {tq.conPhaiCham} <Don>{t('bài')}</Don>
        {tq.khac.con > 0 && <Khac n={tq.khac.con} />}
      </O>
      <O onClick={() => onBam('no')} nhan={t('Quá hạn chấm')} mo={tq.no.bai === 0} mau={tq.no.bai > 0 ? 'text-late' : undefined}>
        {tq.no.bai} <Don>{t('bài')}</Don>
        {tq.no.lop > 0 && <Don>{' '}{t('· {lop} lớp', { lop: tq.no.lop })}</Don>}
        {tq.khac.no > 0 && <Khac n={tq.khac.no} />}
      </O>
    </div>
  );
}

const Don = ({ children }: { children: ReactNode }) => <span className="text-xs font-normal text-slate-400">{children}</span>;
const Khac = ({ n }: { n: number }) => <span className="block text-xs font-normal leading-tight text-slate-500">{t('{n} bài của GV khác', { n })}</span>;

/** Một ô số: nhãn nhỏ trên, số to dưới (`tabular-nums`). `mo` = số 0 → chữ phụ, vẫn bấm được. */
function O({ nhan, children, onClick, mo, mau }: {
  nhan: string; children: ReactNode; onClick: () => void; mo?: boolean; mau?: string;
}) {
  return (
    <button type="button" onClick={onClick}
      className="card min-h-[44px] min-w-0 px-2 py-2 text-left appearance-none cursor-pointer hover:brightness-125 sm:px-3">
      <span className="block whitespace-nowrap text-[11px] tracking-[-0.015em] text-slate-400 leading-tight sm:tracking-normal">{nhan}</span>
      <span className={`block text-base font-bold tabular-nums leading-tight sm:text-lg ${mau ?? (mo ? 'text-slate-500' : 'text-slate-100')}`}>
        {children}
      </span>
    </button>
  );
}
