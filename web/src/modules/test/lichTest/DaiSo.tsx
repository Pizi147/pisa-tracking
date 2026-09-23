import type { ReactNode } from 'react';
import type { LichTest } from './kieu.ts';

export type OSo = 'da-cham' | 'con-phai-cham' | 'no' | 'qua-han';

/**
 * DẢI SỐ của Lịch Test (PR-UX1, G-10) — bốn số, số nào cũng bấm được và mở đúng phần tạo ra số đó. Máy tính một
 * hàng; điện thoại lưới 2×2. Số đã cộng sẵn ở máy chủ từ chính các hàng bên dưới (không tự tính riêng).
 */
export function DaiSo({ tq, tenTuan, onBam }: {
  tq: LichTest['tongQuan']; tenTuan: string; onBam: (o: OSo) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-2 md:grid-cols-4" role="group" aria-label="Tổng quan chấm điểm">
      <O onClick={() => onBam('da-cham')} nhan={`${tenTuan} đã chấm`} title="Bấm để xem danh sách lớp">
        {tq.daCham}/{tq.tong} <Don>bài</Don>
      </O>
      <O onClick={() => onBam('con-phai-cham')} nhan="Còn phải chấm" title="Bấm để mở các lớp còn bài"
        mo={tq.conPhaiCham === 0}>
        {tq.conPhaiCham} <Don>bài</Don>
      </O>
      <O onClick={() => onBam('no')} nhan="Nợ tuần trước" title="Bấm để mở khối Nợ tuần trước" mo={tq.no.bai === 0}>
        {tq.no.bai} <Don>bài</Don>
        {tq.no.lop > 0 && <span className="text-xs font-normal text-slate-400"> · {tq.no.lop} lớp</span>}
      </O>
      <O onClick={() => onBam('qua-han')} nhan="Quá hạn" title="Bấm để chỉ xem bài quá hạn" mo={tq.quaHan === 0}
        mau={tq.quaHan > 0 ? 'text-late' : undefined}>
        {tq.quaHan} <Don>bài</Don>
      </O>
    </div>
  );
}

const Don = ({ children }: { children: ReactNode }) => <span className="text-xs font-normal text-slate-400">{children}</span>;

/** Một ô số: nhãn nhỏ trên, số to dưới (`tabular-nums`). `mo` = số 0 → chữ phụ, vẫn bấm được. */
function O({ nhan, children, onClick, title, mo, mau }: {
  nhan: string; children: ReactNode; onClick: () => void; title: string; mo?: boolean; mau?: string;
}) {
  return (
    <button type="button" onClick={onClick} title={title}
      className="card min-h-[44px] px-3 py-2 text-left appearance-none cursor-pointer hover:brightness-125">
      <span className="block text-[11px] text-slate-400 leading-tight">{nhan}</span>
      <span className={`block text-lg font-bold tabular-nums leading-tight ${mau ?? (mo ? 'text-slate-500' : 'text-slate-100')}`}>
        {children}
      </span>
    </button>
  );
}
