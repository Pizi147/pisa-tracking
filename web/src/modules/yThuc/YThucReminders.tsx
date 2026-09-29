import { Link } from 'react-router-dom';
import { useApi } from '../../lib/useApi.ts';
import { Status } from '../../ui/ui.tsx';

export type NhacYThuc = { classId: number; className: string; text: string };

/**
 * Dòng nhắc mềm của GVCN ở nhóm "Ý thức & Phối hợp" — PR-YT4: chỉ còn Phối hợp SOS (V4-13). Vi phạm nay là VIỆC có hạn (`yt_*` trong
 * /my-work), không còn dòng nhắc "vi phạm quá 5 ngày".
 */
export function useNhacYThuc(): NhacYThuc[] {
  const coordination = useApi<{ rows: NhacYThuc[] }>('/y-thuc/my-coordination');
  return coordination.data?.rows ?? [];
}

/**
 * DÒNG NHẮC PHỐI HỢP SOS CỦA GVCN TRONG `VIỆC CẦN LÀM` (§7.10 · SOS_VA_PHOI_HOP_V3.md §5.4 · plan.md K6). CỐ Ý không phải `WorkItem`:
 * không hạn, không tô như quá hạn (P10) — phoiHop.ts ghi rõ đây là nhắc mềm.
 * (Dòng "case chờ xác định nguyên nhân" của GVBM đã là một `WorkItem` nhóm `cause` — hiện ra sẵn
 * trong danh sách Việc cần làm bên dưới, không cần vẽ riêng.)
 */
export function YThucReminders() {
  const lines = useNhacYThuc();
  if (!lines.length) return null;
  return (
    <div className="space-y-1.5">
      {lines.map((l, i) => (
        <Link key={`${l.classId}-${i}`} to={`/hoc-vien/lop/${l.classId}`} className="block no-underline">
          <Status kind="idle">{l.text}</Status>
        </Link>
      ))}
    </div>
  );
}
