import { Fragment, useEffect, useState, type ReactNode } from 'react';

/**
 * ĐIỆN THOẠI < 640 px (D2, HE_GIAO_DIEN §10): bảng có nhiều cột thành THẺ. Theo dõi `change` của `matchMedia` nên xoay ngang / kéo hẹp cửa sổ
 * đổi chế độ ngay; chỉ MỘT biến thể được vẽ (không vẽ cả bảng lẫn thẻ rồi ẩn bằng CSS — tránh tải dữ liệu hai lần).
 */
const DIEN_THOAI = '(max-width: 639px)';
export function useDienThoai(): boolean {
  const [dt, setDt] = useState(() => typeof window !== 'undefined' && !!window.matchMedia?.(DIEN_THOAI).matches);
  useEffect(() => {
    if (!window.matchMedia) return undefined;
    const m = window.matchMedia(DIEN_THOAI);
    const doi = () => setDt(m.matches);
    doi();
    m.addEventListener('change', doi);
    return () => m.removeEventListener('change', doi);
  }, []);
  return dt;
}

/**
 * MỘT THẺ = MỘT DÒNG CỦA BẢNG trên điện thoại (PR-HVL D2, Q15): đầu thẻ (`dau`: tên đậm + mã + badge; `hanhDong`: nút ⋯ — ô bấm 44 px do
 * `MenuDong` tự nới) rồi các dòng `nhãn · giá trị` THEO ĐÚNG THỨ TỰ CỘT của bảng desktop. Số dùng `tabular-nums`. Mọi bảng dùng lại thành phần
 * này (PR-UXD D1 mở rộng, không dựng thứ hai). Nằm ở: Học viên & Lớp · Hồ sơ lớp → tab Học viên (Điểm FT, Điểm lớp thường, Cần hỗ trợ).
 */
export function TheDong({ dau, hanhDong, dong, className = '' }: {
  dau: ReactNode; hanhDong?: ReactNode;
  dong: readonly { nhan: string; noiDung: ReactNode }[];
  className?: string;
}) {
  return (
    <article className={`border-t px-3 py-2.5 first:border-t-0 [&_a.link]:inline-block [&_a.link]:py-3.5 [&_button.link]:py-3.5 ${className}`} style={{ borderColor: 'var(--line)' }}>
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">{dau}</div>
        {hanhDong && <div className="shrink-0">{hanhDong}</div>}
      </div>
      {/* PR-S4F #11: items-baseline — link trong ô giá trị có py-3.5 (vùng bấm 44 px) nên nhãn phải theo baseline, không theo mép trên. */}
      {dong.length > 0 && (
        <dl className="m-0 mt-1.5 grid grid-cols-[5.5rem_minmax(0,1fr)] items-baseline gap-x-3 gap-y-1 text-xs">
          {dong.map((d) => (
            <Fragment key={d.nhan}>
              <dt className="text-slate-500">{d.nhan}</dt>
              <dd className="m-0 min-w-0 tabular-nums text-slate-200 [&_.truncate]:overflow-visible [&_.truncate]:whitespace-normal">{d.noiDung}</dd>
            </Fragment>
          ))}
        </dl>
      )}
    </article>
  );
}
