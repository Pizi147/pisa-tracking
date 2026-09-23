/**
 * YT-8 (Y_THUC W05, nơi thứ 3): em có vi phạm chưa xử lý quá 5 ngày. ⚠ đúng nghĩa G-4 (quá hạn xử lý). Câu đầy đủ ở tooltip — cùng
 * câu với tab Ý thức & Phối hợp và hồ sơ học viên (một hàm `rosterWarnings` ở máy chủ).
 */
export function CanhBaoYThuc({ cb }: { cb: { count: number; oldestAgeDays: number; message: string } | null }) {
  if (!cb) return null;
  return (
    <span title={cb.message}
      className="shrink-0 whitespace-nowrap rounded border px-1 text-[10px] font-semibold text-amber-200 border-amber-300/40 bg-amber-300/10">
      ⚠ {cb.count} vi phạm
    </span>
  );
}
