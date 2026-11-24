import type { ReactNode } from 'react';

/**
 * BẢNG TRONG PANEL SỐ 720 (SO-720, mockup v24 `phan-tich-panel-so.html` B0–B8; DESIGN NH9). Một bảng sát mép panel: cột 1 (Học viên) vừa chữ, mọi cột còn lại rộng
 * BẰNG NHAU và căn GIỮA; cột chữ / ngày căn trái; hạn ở cột cuối căn phải sát mép. Cột lý do (`nen`) nền nhấn nhạt. Dòng 48 px, không đường kẻ dọc.
 * Cố định bố cục (`table-layout: fixed`): chữ dài xuống dòng trong ô, không đè sang ô bên.
 */
export type CotSo = {
  key: string; nhan: ReactNode; can?: 'trai' | 'giua' | 'phai';
  /** Cột lý do của con số (nền nhấn). */ nen?: boolean;
  /** Bề rộng cố định (px) — mặc định: cột đầu 220, các cột khác chia đều phần còn lại. */ rong?: number;
  /** Chữ đầy đủ cho trình đọc màn khi `nhan` là chữ rút gọn. */ ten?: string;
};

const CAN = { trai: 'text-left', giua: 'text-center', phai: 'text-right' } as const;

export function BangSoPanel<T>({ ten, cot, hang, khoa, o }: {
  ten: string; cot: readonly CotSo[]; hang: readonly T[]; khoa: (h: T) => string | number; o: (h: T, c: CotSo) => ReactNode;
}) {
  const canCua = (c: CotSo, i: number) => c.can ?? (i === 0 ? 'trai' : 'giua');
  return (
    <div className="table-scroll">
      <table className="w-full" style={{ tableLayout: 'fixed' }} aria-label={ten}>
        <colgroup>{cot.map((c, i) => <col key={c.key} className={c.rong ? undefined : i === 0 ? 'w-[45%] sm:w-[220px]' : undefined} style={c.rong ? { width: c.rong } : undefined} />)}</colgroup>
        <thead>
          <tr>
            {cot.map((c, i) => (
              <th key={c.key} scope="col" aria-label={c.ten} style={c.nen ? { background: 'var(--accent-soft)' } : undefined}
                className={`whitespace-nowrap border-b py-2.5 text-[12px] font-medium text-[color:var(--text-faint)] ${CAN[canCua(c, i)]} ${i === 0 ? 'pl-5 max-sm:pl-4' : 'px-1'} ${i === cot.length - 1 && canCua(c, i) === 'phai' ? 'pr-5 max-sm:pr-4' : ''}`}
                data-so-cot={c.key}>{c.nhan}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {hang.map((h) => (
            <tr key={khoa(h)} className="[&>td]:h-12 [&>td]:border-t" style={{ borderColor: 'var(--line)' }}>
              {cot.map((c, i) => (
                <td key={c.key} style={{ ...(c.nen ? { background: 'var(--accent-soft)' } : null), borderColor: 'var(--line)' }}
                  className={`py-1 text-[14px] leading-snug tabular-nums ${CAN[canCua(c, i)]} ${i === 0 ? 'pl-5 max-sm:pl-4' : 'px-1'} ${i === cot.length - 1 && canCua(c, i) === 'phai' ? 'pr-5 max-sm:pr-4' : ''}`}>{o(h, c)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
