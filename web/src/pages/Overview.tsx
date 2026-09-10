import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApi } from '../lib/useApi.ts';
import { useSession } from '../lib/session.tsx';
import { Card, Empty, ErrorState, Info, Level, Skeleton, Task } from '../components/ui.tsx';
import { BranchFilter } from '../components/Filters.tsx';
import { fmtDate } from '../lib/format.ts';

type WorkItem = {
  key: string; group: string; urgency: 'overdue' | 'today' | 'normal';
  studentId: number | null; studentName: string;
  classId: number | null; classCode: string | null;
  attemptId: number | null; attemptNo: number | null; caseId: number | null;
  level: { tone: 'ok' | 'info' | 'warn' | 'danger'; text: string } | null;
  reason: string; actionLabel: string; href: string;
};
type Work = {
  summary: { total: number; overdue: number; today: number };
  groups: { key: string; label: string; items: WorkItem[] }[];
  scopeEmpty: boolean;
};

/**
 * TỔNG QUAN — việc của CHÍNH người đang xem.
 *
 * Màn cũ là bốn ô số theo tuần, và giáo viên với quản lý mở ra thấy y hệt nhau. Số tổng là
 * ngôn ngữ của báo cáo; người đi dạy cần biết "em nào đang cần mình", không cần biết cả chi
 * nhánh có bao nhiêu case.
 *
 * Nên ở đây mỗi dòng là MỘT HỌC VIÊN: tên em, một câu lý do, một nút bấm được. Việc nào
 * người xem không có quyền làm thì không xuất hiện — máy chủ lọc trước khi trả về.
 *
 * Chia nhóm theo loại việc để làm xong nhóm này rồi sang nhóm khác, nhưng việc GẤP tách
 * hẳn lên đầu bất kể thuộc nhóm nào.
 */
export default function OverviewPage() {
  const { session } = useSession();
  const navigate = useNavigate();
  const [branchId, setBranchId] = useState<number | null>(null);
  const { data, loading, error, reload } = useApi<Work>(
    `/my-work${branchId ? `?branchId=${branchId}` : ''}`, [branchId],
  );

  if (error) return <ErrorState message={error.message} hint={error.hint} onRetry={reload} />;

  return (
    <div className="space-y-4 max-w-[1000px]">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-slate-100 m-0">Tổng quan</h1>
          <p className="text-xs text-slate-500 mt-0.5 mb-0">
            Việc của bạn, tính đến {fmtDate(session?.demoDate)}.
          </p>
        </div>
        <BranchFilter branchId={branchId} onBranch={setBranchId} />
      </div>

      {loading && <Skeleton rows={8} />}

      {data && (data.scopeEmpty || data.summary.total === 0) && (
        <Card>
          <Empty
            title={data.scopeEmpty ? 'Bạn chưa được cấp phạm vi nào' : 'Không có việc nào đang chờ bạn'}
            hint={data.scopeEmpty ? undefined : 'Điểm đã nhập đủ, và những em đang theo dõi đều đã có người làm.'}
            action={<Link className="btn no-underline" to="/hoc-vien">Mở danh sách lớp</Link>}
          />
        </Card>
      )}

      {data && data.summary.total > 0 && (
        <>
          {/* Dải tóm tắt: một dòng chữ, không phải bốn ô số. */}
          <p className="text-sm text-slate-300 m-0">
            Bạn có <strong className="text-slate-100">{data.summary.total} việc</strong>
            {data.summary.overdue > 0 && <> · <span className="text-rose-200">{data.summary.overdue} quá hạn</span></>}
            {data.summary.today > 0 && <> · <span className="text-amber-200">{data.summary.today} tới hạn hôm nay</span></>}
          </p>

          {data.groups.map((g) => (
            <Card key={g.key}
              title={
                <span className="flex items-center gap-2">
                  {g.key === 'urgent' && <span className="text-rose-200" aria-hidden>⚠</span>}
                  {g.label}
                  <span className="text-slate-500 font-normal">({g.items.length})</span>
                </span>
              }
              bodyClass="p-0">
              <ul className="divide-y list-none p-0 m-0" style={{ borderColor: 'var(--line)' }}>
                {g.items.map((it) => (
                  <li key={it.key}>
                    <button
                      className="w-full text-left px-4 py-3 hover:bg-white/5 flex flex-wrap items-center gap-x-3 gap-y-1.5"
                      onClick={() => navigate(it.href)}>
                      <span className="min-w-0 flex-1">
                        <span className="flex flex-wrap items-center gap-2">
                          <span className="text-sm text-slate-100 font-medium">{it.studentName}</span>
                          {it.classCode && <Info>{it.classCode}</Info>}
                          {/* Nhãn MỨC ĐỘ: nền đặc, tách hẳn khỏi nhãn việc bên phải. */}
                          {it.level && <Level tone={it.level.tone}>{it.level.text}</Level>}
                        </span>
                        <span className="block text-xs text-slate-400 mt-0.5">{it.reason}</span>
                      </span>
                      {/* Nhãn VIỆC: viền vuông có gạch dọc, màu đổi theo mức gấp. */}
                      <Task tone={it.urgency === 'overdue' ? 'danger' : it.urgency === 'today' ? 'warn' : 'neutral'}>
                        {it.actionLabel}
                      </Task>
                    </button>
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </>
      )}
    </div>
  );
}
