import { Nhan } from '../../ui/Nhan.tsx';

/**
 * YT-8 (Y_THUC W05, nơi thứ 3): em có vi phạm chưa xử lý quá 5 ngày. Nhắc mềm, không phải quá hạn (G-4), nên badge vàng `n vi phạm`
 * KHÔNG có dấu cảnh báo (PR-UX3, Q14). Câu đầy đủ ở tooltip — cùng câu với tab Ý thức & Phối hợp và hồ sơ học viên (một hàm
 * `rosterWarnings` ở máy chủ).
 */
export function CanhBaoYThuc({ cb }: { cb: { count: number; oldestAgeDays: number; message: string } | null }) {
  if (!cb) return null;
  return <Nhan tone="soon" title={cb.message}>{cb.count} vi phạm</Nhan>;
}
