import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApi } from '../lib/useApi.ts';
import { useSession } from '../lib/session.tsx';
import { Card, Empty, ErrorState, Info, Level, Skeleton, Task } from '../components/ui.tsx';
import { BranchFilter } from '../components/Filters.tsx';
import { fmtDate, skillShort } from '../lib/format.ts';

type WorkItem = {
  key: string; group: string; urgency: 'overdue' | 'today' | 'normal';
  studentId: number | null; studentName: string;
  classId: number | null; classCode: string | null;
  attemptId: number | null; attemptNo: number | null; caseId: number | null;
  level: { tone: 'ok' | 'info' | 'warn' | 'danger'; text: string } | null;
  reason: string; actionLabel: string; href: string;
};
type WorkGroup = {
  key: string; label: string; hint: string;
  items: WorkItem[]; overdue: number; today: number;
};
type Work = {
  summary: { total: number; overdue: number; today: number };
  groups: WorkGroup[];
  scopeEmpty: boolean;
};
type ClassRow = {
  id: number; code: string; branchName: string; studentCount: number;
  needScores: number; needDates: number; openCases: number; mySkills: string[];
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
  const classes = useApi<{ rows: ClassRow[] }>(`/classes${branchId ? `?branchId=${branchId}` : ''}`, [branchId]);

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
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem] items-start">
          <div className="space-y-4 min-w-0">
            {/*
              Dải tóm tắt: đếm theo TỪNG LOẠI VIỆC chứ không chỉ một con số tổng.
              Bấm vào một ô là nhảy xuống đúng nhóm đó.
            */}
            <div className="flex flex-wrap gap-2">
              {data.groups.map((g) => (
                <button key={g.key}
                  className="rounded-lg border px-3 py-2 text-left hover:bg-white/5 transition-colors"
                  style={{ borderColor: g.overdue ? 'rgba(242,161,161,.35)' : 'var(--line)' }}
                  onClick={() => document.getElementById(`nhom-${g.key}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>
                  <div className="text-[11px] text-slate-500 whitespace-nowrap">{g.label}</div>
                  <div className="text-2xl tabular-nums text-slate-100 leading-none mt-1">{g.items.length}</div>
                  <div className="text-[11px] mt-1 h-4 whitespace-nowrap">
                    {g.overdue > 0 ? <span className="text-rose-200">{g.overdue} quá hạn</span>
                      : g.today > 0 ? <span className="text-amber-200">{g.today} tới hạn hôm nay</span>
                      : <span className="text-slate-600">chưa tới hạn</span>}
                  </div>
                </button>
              ))}
            </div>

            {data.groups.map((g) => (
              <Card key={g.key} className="scroll-mt-4"
                title={
                  <span className="flex flex-wrap items-baseline gap-2">
                    {g.label}
                    <span className="text-slate-500 font-normal">({g.items.length})</span>
                  </span>
                }
                bodyClass="p-0">
                <div id={`nhom-${g.key}`} />
                {/* Một dòng nói rõ nhóm này nghĩa là gì — không bắt người đọc tự đoán. */}
                <p className="px-4 pt-3 pb-1 text-xs text-slate-500 m-0">{g.hint}</p>
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
          </div>

          {/*
            Cột phải: LỚP CỦA BẠN. Không phải một bảng chỉ số — đây là lối vào thứ hai,
            vì nhiều việc làm theo cả lớp một lượt chứ không theo từng em.
          */}
          <Card title="Lớp của bạn" bodyClass="p-0" className="lg:sticky lg:top-4">
            {classes.loading && <div className="p-4"><Skeleton rows={3} /></div>}
            {classes.data && classes.data.rows.length === 0 && (
              <div className="p-4"><Empty title="Bạn chưa được phân công lớp nào" /></div>
            )}
            <ul className="divide-y list-none p-0 m-0" style={{ borderColor: 'var(--line)' }}>
              {(classes.data?.rows ?? []).map((c) => (
                <li key={c.id}>
                  <Link to={`/hoc-vien?open=${c.id}`}
                    className="block px-4 py-3 no-underline hover:bg-white/5">
                    <span className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                      <span className="text-sm text-slate-100 font-medium">{c.code}</span>
                      <span className="text-[11px] text-slate-500">{c.studentCount} em</span>
                    </span>
                    <span className="flex flex-wrap gap-1.5 mt-1.5">
                      {c.mySkills?.length > 0 && <Info title="Kỹ năng bạn dạy ở lớp này">{c.mySkills.map(skillShort).join(' ')}</Info>}
                      {c.openCases > 0 && <Level tone={c.openCases >= 5 ? 'warn' : 'info'}>{c.openCases} em cần hỗ trợ</Level>}
                      {c.needScores > 0 && <Task>Nhập điểm · {c.needScores}</Task>}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
            <div className="px-4 py-3">
              <Link className="link text-xs" to="/hoc-vien">Xem tất cả lớp →</Link>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
