import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { useApi } from '../../lib/useApi.ts';
import { ErrorState, Skeleton } from '../../ui/ui.tsx';
import { NganCase } from '../students/NganCase.tsx';
import { tenNganCase } from './CasePanel.tsx';
import { duongHoSoHocVien } from '@shared/domain/index.ts';

/**
 * `/hoc-thuat/case/:id` — link sâu cũ (thông báo, link đã lưu). PR-Pb2-a (Q5, K1 §4b): Case có học viên → thay trang bằng hồ sơ HV mở sẵn
 * Ngăn Case (một bước). Danh sách Case và Case board đã bỏ (T59) — Phân tích nay là `PhanTich.tsx`.
 * ponytail: Case không có học viên vẫn giữ trang cũ (breadcrumb + Ngăn Case); PR-Dọn xoá nếu sau reset không còn Case như vậy.
 */
export function CaseRoutePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const ca = useApi<{ student: { id: number; name: string } | null; categoryLabel: string | null; category: string | null; chuongTrinh?: string | null }>(
    id ? `/cases/${id}` : null);
  if (ca.data?.student) return <Navigate replace to={duongHoSoHocVien(ca.data.student.id, { caseId: Number(id) })} />;
  if (ca.loading) return <div className="max-w-[900px]"><Skeleton rows={4} /></div>;
  return (
    <div className="max-w-[900px] space-y-3">
      <nav aria-label="Đường dẫn" className="flex flex-wrap items-center gap-1.5 text-sm text-slate-400">
        <span>Học viên</span>
        <span aria-hidden>›</span>
        <span className="text-slate-200">Case {ca.data ? tenNganCase(ca.data) : ''}</span>
      </nav>
      {ca.error && <ErrorState message={ca.error.message} onRetry={ca.reload} />}
      <NganCase caseId={Number(id)} onClose={() => navigate('/')} />
    </div>
  );
}
