import { Link } from 'react-router-dom';
import { useApi } from '../lib/useApi.ts';
import { Card, Pill, SectionNote, Skeleton } from './ui.tsx';

type Signal = {
  key: string; kind: string; label: string; count: number;
  owner: 'manager' | 'branch_admin' | 'teacher';
  tone: 'danger' | 'warn' | 'info';
  branchId: number | null; branchName: string | null; href: string;
};

const OWNER_LABEL: Record<Signal['owner'], string> = {
  manager: 'Quản lý', branch_admin: 'Admin chi nhánh', teacher: 'Giáo viên',
};

/**
 * VIỆC SINH RA TỪ DỮ LIỆU — không phải task.
 *
 * Không có người được giao, không có nút "Đã xong". Mỗi dòng là một câu hỏi đọc thẳng từ
 * dữ liệu và TỰ HẾT khi nguồn được xử lý: giáo viên nhập đủ điểm thì "thiếu điểm" biến mất.
 * Có nút đóng ở đây thì chỉ để che một con số vẫn đang đúng.
 *
 * Mỗi dòng ghi rõ VIỆC CỦA AI, vì đó chính là chỗ hay lẫn: xếp tuần MT là của Quản lý,
 * cập nhật ngày thực tế là của Admin chi nhánh.
 */
export function SignalList({ branchId, periodId }: { branchId?: number | null; periodId?: number | null }) {
  const qs = new URLSearchParams();
  if (branchId) qs.set('branchId', String(branchId));
  if (periodId) qs.set('periodId', String(periodId));
  const { data, loading } = useApi<Signal[]>(`/signals${qs.toString() ? `?${qs}` : ''}`);

  if (loading) return <Card title="Việc hệ thống nhìn ra"><Skeleton rows={3} /></Card>;
  if (!data?.length) {
    return (
      <Card title="Việc hệ thống nhìn ra" bodyClass="p-4">
        <p className="text-sm text-slate-400">
          Không còn việc nào hệ thống tự nhìn ra được trong phạm vi của bạn.
        </p>
      </Card>
    );
  }

  return (
    <Card title="Việc hệ thống nhìn ra" action={<Pill tone="neutral">{data.length} nhóm</Pill>} bodyClass="p-0">
      <ul className="divide-y list-none p-0 m-0" style={{ borderColor: 'var(--line)' }}>
        {data.map((s) => (
          <li key={s.key}>
            <Link to={s.href} className="no-underline flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-2.5 hover:bg-white/5">
              <Pill tone={s.tone}>{s.count}</Pill>
              <span className="text-sm text-slate-200 flex-1 min-w-0">{s.label}</span>
              {s.branchName && <span className="text-xs text-slate-500">{s.branchName}</span>}
              <Pill tone="muted">{OWNER_LABEL[s.owner]}</Pill>
            </Link>
          </li>
        ))}
      </ul>
      <div className="p-3">
        <SectionNote>
          Những việc này <strong>tự hết khi dữ liệu nguồn được xử lý</strong> — không có nút đánh dấu đã xong,
          vì đánh dấu chỉ che một con số vẫn đang đúng. Bấm một dòng để mở đúng những bản ghi tạo nên nó.
          Việc quản lý đặc thù (liên hệ phụ huynh, tổ chức bổ trợ…) mới cần nhập tay ở phần dưới.
        </SectionNote>
      </div>
    </Card>
  );
}
