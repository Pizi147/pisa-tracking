import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApi } from '../lib/useApi.ts';
import { useSession } from '../lib/session.tsx';
import { Card, Empty, ErrorState, KpiTile, Pill, SectionNote, Skeleton } from '../components/ui.tsx';
import { WeekBranchFilter, usePeriods } from '../components/Filters.tsx';
import { fmtBand, fmtDate, fmtNum } from '../lib/format.ts';

type Overview = {
  today: string;
  period: { id: number; code: string; weekStart: string; weekEnd: string; range: string };
  kpis: {
    week: { scheduled: number; done: number; cancelled: number; uniqueStudents: number; needsDate: number };
    scoring: { missing: number; overdue: number; complete: number };
    sos: { s0: number; s1: number; s2: number; s3: number };
    caseNew: number; caseHandling: number; caseDone: number;
  };
  meeting: { notReported: number; problem: number; watch: number; total: number } | null;
  tasks: { overdue: number; dueSoon: number; open: number };
  priority: any[];
  support: {
    talkedStudent: number; talkedParent: number; academicStarted: number;
    avgResultDays: number | null; avgInterventionDays: number | null;
  };
};

export default function OverviewPage() {
  const { session } = useSession();
  const periods = usePeriods();
  const [periodId, setPeriodId] = useState<number | null>(null);
  const [branchId, setBranchId] = useState<number | null>(null);
  const [showSupport, setShowSupport] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (periodId === null && periods.data?.length) {
      const cur = periods.data.find((p) => p.weekStart <= session!.demoDate && p.weekEnd >= session!.demoDate);
      setPeriodId(cur?.id ?? periods.data[0].id);
    }
  }, [periods.data, periodId, session]);

  const qs = periodId ? `/overview?periodId=${periodId}${branchId ? `&branchId=${branchId}` : ''}` : null;
  const { data, loading, error, reload } = useApi<Overview>(qs);

  if (error) return <ErrorState message={error.message} hint={error.hint} onRetry={reload} />;

  const week = periodId ? `?periodId=${periodId}` : '';
  const branch = branchId ? `&branchId=${branchId}` : '';

  return (
    <div className="space-y-4 max-w-[1500px]">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-slate-100">Tổng quan tuần</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Kết quả tính theo tuần đang xem. Việc còn tồn tính đến ngày {fmtDate(data?.today ?? session?.demoDate)}, có thể đến từ tuần trước.
          </p>
        </div>
        <WeekBranchFilter periodId={periodId} onPeriod={setPeriodId} branchId={branchId} onBranch={setBranchId} />
      </div>

      {loading && <Skeleton rows={6} />}

      {data && (
        <>
          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <KpiTile
              label={`Lịch MT ${data.period.code}`}
              value={data.kpis.week.scheduled}
              tone={data.kpis.week.needsDate > 0 ? 'warn' : 'neutral'}
              sub={`${data.kpis.week.done} lượt đã xong · ${data.kpis.week.uniqueStudents} học viên · ${data.kpis.week.needsDate} chưa có ngày`}
              to={data.kpis.week.needsDate > 0 ? '/hoc-vien?view=need_date' : '/hoc-vien'}
            />
            <KpiTile
              label="Chưa nhập đủ điểm"
              value={data.kpis.scoring.missing}
              tone={data.kpis.scoring.overdue > 0 ? 'danger' : data.kpis.scoring.missing > 0 ? 'warn' : 'neutral'}
              sub={`${data.kpis.scoring.overdue} lượt đã quá hạn · ${data.kpis.scoring.complete} lượt đủ điểm`}
              to="/hoc-vien?view=my_scores"
            />
            <KpiTile
              label="Case SOS chưa xử lý"
              value={data.kpis.caseNew}
              tone={data.kpis.caseNew > 0 ? 'danger' : 'ok'}
              sub="Chưa ai bắt đầu xử lý · tính đến hôm nay, không theo tuần"
              to="/hoc-vien?view=sos_open"
            />
            <KpiTile
              label="Case SOS đang xử lý"
              value={data.kpis.caseHandling}
              tone={data.kpis.caseHandling > 0 ? 'warn' : 'neutral'}
              sub={`${data.kpis.caseDone} case đã xong · SOS 1: ${data.kpis.sos.s1} · 2: ${data.kpis.sos.s2} · 3: ${data.kpis.sos.s3}`}
              to="/hoc-vien?view=sos_open"
            />
          </section>

          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2" title="Việc cần làm trước"
              action={<Link className="btn btn-sm no-underline" to="/hoc-vien">Mở danh sách lớp</Link>}>
              {data.priority.length === 0 ? (
                <Empty title="Không có việc nào đang chờ" hint="Điểm đã nhập đủ và các case SOS đã được xử lý xong." />
              ) : (
                <ul className="divide-y list-none p-0 m-0" style={{ borderColor: 'var(--line)' }}>
                  {data.priority.map((p, i) => (
                    <li key={i}>
                      <button
                        className="w-full text-left py-2.5 px-1 hover:bg-white/5 flex items-start gap-3"
                        onClick={() => {
                          if (p.attemptId) navigate(`/mock-test/${p.attemptId}`);
                          else navigate('/tien-trinh');
                        }}
                      >
                        <span className="mt-0.5">
                          {p.kind === 'sos_new' && <Pill tone="danger">SOS chưa xử lý</Pill>}
                          {p.kind === 'overdue_score' && <Pill tone="danger">Quá hạn điểm</Pill>}
                          {p.kind === 'needs_date' && <Pill tone="warn">Cần cập nhật ngày</Pill>}
                          {p.kind === 'overdue_task' && <Pill tone="danger">Việc quá hạn</Pill>}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm text-slate-100 truncate">
                            {p.studentName ?? p.title}
                            {p.classCode && <span className="text-slate-500 text-xs ml-2">{p.classCode}</span>}
                            {p.attemptNo && <span className="text-slate-500 text-xs ml-2">MT{p.attemptNo}</span>}
                          </span>
                          <span className="block text-xs text-slate-400">{p.reason}</span>
                        </span>
                        <span className="text-xs text-slate-500 hidden md:block shrink-0 max-w-[14rem] truncate">{p.action}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            <div className="space-y-4">
              {data.meeting && (
                <Card title="Họp tuần"
                  action={<Link className="btn btn-sm no-underline" to="/tien-trinh">Mở</Link>}>
                  <ul className="text-sm space-y-1.5 list-none p-0 m-0">
                    <li className="flex justify-between"><span className="text-slate-400">Chưa báo cáo</span>
                      <strong className="tabular-nums">{data.meeting.notReported}/{data.meeting.total}</strong></li>
                    <li className="flex justify-between"><span className="text-slate-400">Có vấn đề</span>
                      <strong className="tabular-nums text-rose-200">{data.meeting.problem}</strong></li>
                    <li className="flex justify-between"><span className="text-slate-400">Cần theo dõi</span>
                      <strong className="tabular-nums text-amber-200">{data.meeting.watch}</strong></li>
                  </ul>
                  <div className="border-t mt-3 pt-3" style={{ borderColor: 'var(--line)' }}>
                    <ul className="text-sm space-y-1.5 list-none p-0 m-0">
                      <li className="flex justify-between"><span className="text-slate-400">Việc quá hạn</span>
                        <strong className="tabular-nums text-rose-200">{data.tasks.overdue}</strong></li>
                      <li className="flex justify-between"><span className="text-slate-400">Sắp đến hạn</span>
                        <strong className="tabular-nums text-amber-200">{data.tasks.dueSoon}</strong></li>
                      <li className="flex justify-between"><span className="text-slate-400">Đang mở</span>
                        <strong className="tabular-nums">{data.tasks.open}</strong></li>
                    </ul>
                  </div>
                </Card>
              )}

              <Card title="Số liệu hỗ trợ"
                action={<button className="btn btn-sm" onClick={() => setShowSupport((s) => !s)}>{showSupport ? 'Thu gọn' : 'Mở'}</button>}>
                {!showSupport ? (
                  <SectionNote>Các số dùng khi cần rà soát sâu. Không hiển thị mặc định để tổng quan gọn.</SectionNote>
                ) : (
                  <ul className="text-sm space-y-1.5 list-none p-0 m-0">
                    <li className="flex justify-between"><span className="text-slate-400">Case đã trao đổi HS (có ngày)</span>
                      <strong className="tabular-nums">{data.support.talkedStudent}</strong></li>
                    <li className="flex justify-between"><span className="text-slate-400">Case đã trao đổi PH (có ngày)</span>
                      <strong className="tabular-nums">{data.support.talkedParent}</strong></li>
                    <li className="flex justify-between"><span className="text-slate-400">Hỗ trợ học thuật đã có ngày bắt đầu</span>
                      <strong className="tabular-nums">{data.support.academicStarted}</strong></li>
                    <li className="flex justify-between"><span className="text-slate-400">Thời gian trả kết quả trung bình</span>
                      <strong className="tabular-nums">{fmtNum(data.support.avgResultDays)} ngày</strong></li>
                    <li className="flex justify-between"><span className="text-slate-400">Thời gian bắt đầu can thiệp</span>
                      <strong className="tabular-nums">{fmtNum(data.support.avgInterventionDays)} ngày</strong></li>
                    <li className="pt-2"><SectionNote>
                      Thời gian trả kết quả là số ngày từ buổi mock tới lúc có điểm — không phải số ngày quá hạn.
                      Dấu “—” nghĩa là chưa đủ dữ liệu, không phải 0 ngày.
                    </SectionNote></li>
                  </ul>
                )}
              </Card>
            </div>
          </div>

          <SectionNote>
            Tuần {data.period.code} ({data.period.range}). Tuần kết quả là TUẦN KẾ HOẠCH của lượt MT, nên
            Speaking mock khác tuần cũng không làm lượt bị đếm hai lần. Số lượt khác số học viên duy nhất;
            lượt đã huỷ không tính vào “đã xong” hay “thiếu điểm”. Đổi tuần không làm mất case và việc còn tồn.
          </SectionNote>
        </>
      )}
    </div>
  );
}

export { fmtBand };
