import { Link } from 'react-router-dom';
import { useApi } from '../../lib/useApi.ts';
import { Status } from '../../ui/ui.tsx';

type Line = { classId: number; className: string; text: string };

/**
 * HAI DÒNG NHẮC CỦA GVCN TRONG `VIỆC CẦN LÀM` (§7.10 · SOS_VA_PHOI_HOP_V3.md §5.4 · plan.md K6) —
 * vi phạm quá 5 ngày và Phối hợp SOS cần xử lý. CỐ Ý không phải `WorkItem`: không hạn, không tô như
 * quá hạn (W02, P10) — canhBao.ts/phoiHop.ts đã ghi rõ đây là nhắc mềm, không phải việc quá hạn.
 * (Dòng "case chờ xác định nguyên nhân" của GVBM đã là một `WorkItem` nhóm `cause` — hiện ra sẵn
 * trong danh sách Việc cần làm bên dưới, không cần vẽ riêng.)
 */
export function YThucReminders() {
  const warnings = useApi<{ rows: Line[] }>('/y-thuc/my-warnings');
  const coordination = useApi<{ rows: Line[] }>('/y-thuc/my-coordination');
  const lines = [...(warnings.data?.rows ?? []), ...(coordination.data?.rows ?? [])];
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
