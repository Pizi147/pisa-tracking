import type { ReactNode } from 'react';
import { fmtDate } from '../lib/format.ts';

/**
 * DÒNG THỜI GIAN DẠNG LƯỚI (PR-HV, spec 2026-09-22 §4.3, §4.5) — `ngày · cột 2 · nội dung · cuối`, mới nhất trước.
 *
 * Dùng ở tab Ý thức của hồ sơ học viên (cột 2 = nhãn `Vi phạm`/`Phương án`) và ở hồ sơ lớp: `Theo thời gian`
 * (cột 2 = tên học viên) và thẻ `Vi phạm gần đây` (biến thể `gon`: không có cột 2).
 *
 * Dưới `md` (768px) cột cuối xuống hàng mới, thẳng mép trái của cột nội dung (đúng prototype @media 750px);
 * ô tick (A4) là cột đầu, giữ chỗ cả ở dòng không tick được để các dòng thẳng cột.
 * Lớp Tailwind viết ĐỦ và TĨNH — không ghép chuỗi động.
 */
export type DongThoiGianMuc = {
  key: string;
  /** Ngày nghiệp vụ ISO — hiện `dd/mm`, `title` là ngày đủ. */
  ngay: string;
  /** Ô tick (A4). `null`/thiếu = dòng không tick được nhưng VẪN giữ chỗ để thẳng cột (khi `coCotChon`). */
  chon?: { checked: boolean; onChange: () => void; nhanDoc: string } | null;
  /** Cột 2: nhãn màu (hồ sơ HV) hoặc tên học viên (lớp · Theo thời gian). Bỏ qua ở biến thể 'gon'. */
  cot2?: ReactNode;
  tieuDe: ReactNode;
  dongPhu?: ReactNode;
  /** Cột cuối: nút `Sửa`/`Mở`/`Xem`, hoặc nhãn nhóm. */
  cuoi?: ReactNode;
  /** PR-YT2 YT-1/YT-13: dòng đang mở tại chỗ (có `chiTiet` vẽ ngay dưới). */
  mo?: boolean;
  /** Có hàm này thì `tieuDe` vẽ thành nút bấm mở/đóng tại chỗ thay vì chữ tĩnh. */
  onMo?: () => void;
  /** Khối vẽ ngay dưới dòng khi `mo` — thẳng mép cột nội dung (mockup `.exp`). */
  chiTiet?: ReactNode;
};

const LUOI = {
  'day-du': {
    khong: 'grid-cols-[3.25rem_5.5rem_minmax(0,1fr)] md:grid-cols-[4rem_8rem_minmax(0,1fr)_auto]',
    chon: 'grid-cols-[1.25rem_3.25rem_5.5rem_minmax(0,1fr)] md:grid-cols-[1.25rem_4rem_8rem_minmax(0,1fr)_auto]',
  },
  gon: {
    khong: 'grid-cols-[3.25rem_minmax(0,1fr)] md:grid-cols-[4rem_minmax(0,1fr)_auto]',
    chon: 'grid-cols-[1.25rem_3.25rem_minmax(0,1fr)] md:grid-cols-[1.25rem_4rem_minmax(0,1fr)_auto]',
  },
} as const;
/* Dưới md, cột cuối xuống hàng mới, thẳng mép trái của cột nội dung. */
const CUOI = {
  'day-du': { khong: 'col-start-3 md:col-start-auto', chon: 'col-start-4 md:col-start-auto' },
  gon: { khong: 'col-start-2 md:col-start-auto', chon: 'col-start-3 md:col-start-auto' },
} as const;
/** YT-1/YT-13: lề trái của khối mở tại chỗ — đúng mép cột nội dung ở cả hai bề rộng (cùng số đo với `LUOI` ở trên). */
const LE_CHI_TIET = {
  'day-du': { khong: 'pl-[3.25rem] md:pl-[12rem]', chon: 'pl-[4.5rem] md:pl-[13.25rem]' },
  gon: { khong: 'pl-[3.25rem] md:pl-[4rem]', chon: 'pl-[4.5rem] md:pl-[5.25rem]' },
} as const;

export function DongThoiGian({ muc, bien = 'day-du', coCotChon = false, rong }: {
  muc: DongThoiGianMuc[];
  /** 'day-du' = ngày · cột 2 · nội dung · cuối; 'gon' = ngày · nội dung · cuối (thẻ "Vi phạm gần đây" của lớp). */
  bien?: 'day-du' | 'gon';
  coCotChon?: boolean;
  /** Vẽ khi `muc` rỗng. */
  rong: ReactNode;
}) {
  if (muc.length === 0) return <>{rong}</>;
  const k = coCotChon ? 'chon' : 'khong';
  return (
    <ul className="list-none m-0 px-3 rounded-lg border" style={{ borderColor: 'var(--line)', background: 'var(--surface-2)' }}>
      {muc.map((m) => (
        <li key={m.key} className={`grid gap-x-2 gap-y-1 py-2.5 items-start border-t first:border-t-0 ${LUOI[bien][k]}`}
          style={{ borderColor: 'var(--line)' }}>
          {coCotChon && (m.chon
            ? <input type="checkbox" className="mt-0.5" aria-label={m.chon.nhanDoc} checked={m.chon.checked} onChange={m.chon.onChange} />
            : <span />)}
          <span className="text-[11px] text-slate-500 tabular-nums pt-0.5" title={fmtDate(m.ngay)}>{fmtDate(m.ngay).slice(0, 5)}</span>
          {bien === 'day-du' && <span className="min-w-0">{m.cot2}</span>}
          <span className="min-w-0 break-words">
            {m.onMo ? (
              <button
                type="button"
                className="block w-full text-left text-sm font-medium text-slate-100 hover:underline underline-offset-2"
                aria-expanded={!!m.mo}
                onClick={m.onMo}
              >
                {m.tieuDe}
              </button>
            ) : (
              <span className="block text-sm font-medium text-slate-100">{m.tieuDe}</span>
            )}
            {m.dongPhu && <span className="block text-[11px] text-slate-500 mt-0.5">{m.dongPhu}</span>}
          </span>
          <span className={`flex flex-wrap gap-1.5 md:justify-end ${CUOI[bien][k]}`}>{m.cuoi}</span>
          {m.mo && m.chiTiet && (
            <div className={`col-span-full ${LE_CHI_TIET[bien][k]}`}>
              <div className="min-w-0 border-t pt-2 mt-1" style={{ borderColor: 'var(--line)' }}>{m.chiTiet}</div>
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}
