import { Navigate, useParams } from 'react-router-dom';
import { useApi } from '../../lib/useApi.ts';
import { ErrorState, Skeleton } from '../../ui/ui.tsx';
import { duongHoSoHocVien } from '@shared/domain/index.ts';

/**
 * `/hoc-thuat/case/:id` — link sâu cũ (thông báo, email, link đã lưu). PR-Pb2-a (Q5) → PR-Dọn: mọi Case đều có học viên, nên chỉ còn
 * chuyển về hồ sơ HV mở sẵn Ngăn Case. Route giữ ở `App.tsx` để link cũ vẫn mở được.
 */
export function CaseRoutePage() {
  const { id } = useParams();
  const ca = useApi<{ student: { id: number } | null }>(id ? `/cases/${id}` : null);
  if (ca.data?.student) return <Navigate replace to={duongHoSoHocVien(ca.data.student.id, { caseId: Number(id) })} />;
  if (ca.error) return <ErrorState message={ca.error.message} onRetry={ca.reload} />;
  if (ca.data) return <ErrorState message="Case này không gắn học viên nào." />;
  return <div className="max-w-[900px]"><Skeleton rows={4} /></div>;
}
