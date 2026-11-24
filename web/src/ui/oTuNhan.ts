import { Children, createContext, isValidElement, type ReactNode } from 'react';

/**
 * `Truong`/`Field` báo cho ô ngày biết nó nằm dưới một nhãn: ô báo lại `id` của ô gõ, nhãn đổi từ `<label>` BỌC (bọc luôn nút lịch,
 * dòng phụ, dòng lỗi — HTML sai, tên truy cập lẫn "Mở lịch") sang `<div>` + `<label htmlFor>`. Nơi gọi không phải sửa gì.
 */
export const BaoOTrongNhan = createContext<((id: string | null) => void) | null>(null);
/**
 * Ô tự vẽ nhãn riêng (ô ngày, ô chọn người — gắn `tuNhan = true`) nằm TRỰC TIẾP dưới `Truong`/`Field` → khung là `<div>` ngay từ lần
 * vẽ đầu. Thẻ khung quyết từ props, không từ id ô báo lên: đổi thẻ sau khi vẽ làm React dựng lại ô (hiệu ứng chạy hai lần).
 */
export const coOTuNhan = (children: ReactNode) =>
  Children.toArray(children).some((c) => isValidElement(c) && !!(c.type as { tuNhan?: boolean }).tuNhan);
