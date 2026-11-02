import { useApi } from '../../lib/useApi.ts';
import { Card, Empty, Skeleton, Task } from '../../ui/ui.tsx';
import { fmtDate } from '../../lib/format.ts';
import { khopChiNhanhBaoCao } from '@shared/domain/index.ts';
import { t } from '@shared/i18n/index.ts';

/**
 * VIỆC QUẢN LÝ GIAO — hai loại khác hẳn nhau (tạo ở MỘT cửa "+ Giao việc" của Vận hành, Câu 1 = A; đây chỉ còn danh sách).
 *
 *   VIỆC CHI NHÁNH   giáo trình, vận hành. Không gắn học viên nào.
 *   VIỆC GIAO GIÁO VIÊN  gắn lớp và kỹ năng, và TOẢ RA thành phương án của từng em.
 *
 * Chữ "toả ra" là chỗ quan trọng nhất: một việc giao cho lớp mười ba em vẫn là MỘT việc,
 * cập nhật MỘT LẦN. Nếu tạo mười ba bản sao thì giáo viên sẽ bỏ qua, và dữ liệu tiến độ
 * thành rác — tệ hơn là không có gì, vì nó trông như đã được theo dõi.
 */

type TaskRow = {
  id: number; code: string; title: string; kind?: string;
  className?: string | null; topicLabel?: string | null;
  assigneeName: string | null; dueDate: string | null; progress: string;
  studentCount?: number; branchId?: number | null;
};

/** Danh sách việc của tuần đang xem, tách khỏi nút tạo để đặt được ở chỗ khác trên trang. */
export function ManagerTaskList({ periodId, chiNhanh = 'tat-ca' }: { periodId: number | null; chiNhanh?: string }) {
  const { data, loading } = useApi<{ rows: TaskRow[] }>(
    periodId ? `/tasks?periodId=${periodId}` : null, [periodId],
  );
  if (loading) return <Card title={t('Việc được giao')}><Skeleton rows={3} /></Card>;
  /* PR-BC D9-b: lọc theo chi nhánh của VIỆC (giữ việc giao GV theo lớp); chỉ thu hẹp cái máy chủ đã trả. */
  const rows = (data?.rows ?? []).filter((r) => khopChiNhanhBaoCao(r.branchId ?? null, chiNhanh));
  return (
    <Card title={t('Việc được giao ({n})', { n: rows.length })} bodyClass="p-0">
      {rows.length === 0 ? (
        <div className="p-4">
          <Empty title={t('Chưa giao việc nào trong tuần này')}
            hint={t('Việc chi nhánh là chuyện giáo trình và vận hành. Việc giao giáo viên gắn với lớp và kỹ năng, và hiện luôn trong hồ sơ từng em.')} />
        </div>
      ) : (
        <ul className="divide-y list-none p-0 m-0" style={{ borderColor: 'var(--line)' }}>
          {rows.map((r) => (
            <li key={r.id} className="px-4 py-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm text-slate-100">{r.title}</span>
                {r.kind === 'teacher_task' && r.topicLabel && <Task>{r.topicLabel}</Task>}
                {r.className && <span className="text-xs text-slate-500">{r.className}</span>}
              </div>
              <p className="text-xs text-slate-500 mt-0.5 mb-0">
                {r.code}
                {r.assigneeName && ` · ${r.assigneeName}`}
                {r.dueDate && ` · ${t('hạn {ngay}', { ngay: fmtDate(r.dueDate) })}`}
                {r.studentCount ? ` · ${t('{n} em', { n: r.studentCount })}` : ''}
              </p>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
