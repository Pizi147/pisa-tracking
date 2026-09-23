import { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApi } from '../../lib/useApi.ts';
import { Card, Empty, ErrorState, Skeleton } from '../../ui/ui.tsx';
import { gomNhomViec } from '@shared/domain/index.ts';
import { type WorkGroup, type WorkItem } from './WorkList.tsx';
import { NhomViec } from './NhomViec.tsx';
import { useNhacYThuc } from '../yThuc/YThucReminders.tsx';

/**
 * VIỆC CẦN LÀM CỦA TÔI — Tổng quan giáo viên (§3.2). Bốn nhóm cố định: Chấm điểm · Case học thuật · Ý thức & Phối hợp ·
 * Vận hành; mỗi nhóm có số; nhóm có việc quá hạn tự mở, nhóm khác gập. Mỗi nhóm hiện 5 dòng + "Xem thêm" tại chỗ; đủ danh
 * sách ở Công việc. Tín hiệu SOS lớp thường nằm ở Case học thuật, có hai nút ngay trên dòng (§3.10).
 *
 * PR-Ra: phần khối nhóm tách ra `NhomViec.tsx` để dùng chung với Hỗ trợ học viên — hành vi ở
 * đây GIỮ NGUYÊN (`soHien = 5`, so ảnh trước/sau ở Task 9).
 */
/** `/my-work` khi GV chưa có phạm vi trả `{ summary, groups: [], scopeEmpty: true }` — KHÔNG có `items` (mywork.ts). */
type Work = { summary: { total: number }; items?: WorkItem[]; groups: WorkGroup[]; scopeEmpty: boolean };

export function ViecCuaToi() {
  const navigate = useNavigate();
  const { data, loading, error, reload } = useApi<Work>('/my-work');
  const nhac = useNhacYThuc();
  const nhom = useMemo(() => (data ? gomNhomViec(data.items ?? [], nhac.length) : []), [data, nhac.length]);
  if (error) return <ErrorState message={error.message} hint={error.hint} onRetry={reload} />;
  return (
    <Card title="Việc cần làm của tôi" bodyClass="p-0">
      {loading || !data ? <div className="p-4"><Skeleton rows={5} /></div> : data.scopeEmpty || (data.summary.total === 0 && !nhom.length) ? (
        <div className="p-4"><Empty title={data.scopeEmpty ? 'Bạn chưa được cấp phạm vi nào' : 'Không có việc nào đang chờ bạn'} /></div>
      ) : (
        <NhomViec nhom={nhom} nhac={nhac} soHien={5} onOpen={navigate} />
      )}
      <div className="px-4 py-2.5 border-t text-xs" style={{ borderColor: 'var(--line)' }}>
        <Link to="/cong-viec" className="link">Tất cả việc →</Link>
      </div>
    </Card>
  );
}
