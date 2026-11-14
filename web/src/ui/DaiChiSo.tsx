import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { NutLuat } from './NutLuat.tsx';
import { LOP_OSO, VUNG_BAM_SO } from './SoLieu.tsx';

/**
 * DẢI CHỈ SỐ MỘT KIỂU (GD-4 e — mockup v21 `bang-mau.html` H3 `.dai-cs`; luật M): MỘT hàng mỏng cao 44, viền line, bo 10; mỗi ô "nhãn + số".
 * Số bấm được dùng `OSo` (gạch chân màu nhấn → panel chỉ đọc) hoặc `SoDen` (đổi trang, "›"); số 0 không bấm, mờ; số xấu (`text-bad`) có ⚠ (CSS `.dai-cs`).
 * ⓘ là nút (`NutLuat`). 375: lưới 2 cột, ô cao ≥ 44. Dải chỉ vẽ dữ liệu đã nạp — không request riêng.
 */
export function DaiChiSo({ nhan, children, className = '' }: { /** Tên nhóm cho trình đọc màn ("Chỉ số của tôi"). */ nhan: string; children: ReactNode; className?: string }) {
  return <div role="group" aria-label={nhan} className={`dai-cs ${className}`}>{children}</div>;
}

/** Một ô: nhãn (+ ⓘ) · số · chữ phụ nhỏ (khi cần). `nhom`: nhãn nhóm đậm đứng đầu dải ("Của bạn"), không số. Luật lời 40: ô không nghĩa → nơi gọi không vẽ. */
export function ODai({ nhan, luat, children, phu, title, nhom }: {
  nhan: ReactNode; luat?: ReactNode; children?: ReactNode; phu?: ReactNode; title?: string; nhom?: boolean;
}) {
  return (
    <span className={nhom ? 'dai-cs-o dai-cs-nhom' : 'dai-cs-o'} title={title}>
      <span>{nhan}</span>
      {luat && <NutLuat label={typeof nhan === 'string' ? nhan : undefined}>{luat}</NutLuat>}
      {children}
      {phu && <span className="dai-cs-phu">{phu}</span>}
    </span>
  );
}

/** Số dẫn sang trang khác: cùng dáng ô số + "›" (đổi trang); 0 mờ, không bấm. */
export function SoDen({ n, to }: { n: number; to: string }) {
  return n > 0
    ? <Link to={to} className={`${VUNG_BAM_SO} ${LOP_OSO} whitespace-nowrap`}>{n} <span aria-hidden>›</span></Link>
    : <SoTinh n={n} />;
}

/** Số không bấm (0, đang tải "…", hay ô chỉ đếm như "Việc" ở trang đang là Công việc). */
export const SoTinh = ({ n }: { n: ReactNode }) => <span className={n === 0 || n === '—' ? 'dai-cs-0' : 'dai-cs-so'}>{n}</span>;
