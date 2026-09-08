import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useSession } from '../lib/session.tsx';
import { useApi } from '../lib/useApi.ts';
import { Card, Empty, ErrorState, KpiTile, Pill, SectionNote, Skeleton } from '../components/ui.tsx';
import { branchStatusLabel, deadlineLabel, fmtDate, fmtRatePct, skillLabel, weekRangeLabel } from '../lib/format.ts';

export default function DashboardPage() {
  const { session } = useSession();
  const caps = session?.capabilities ?? {};
  const [tab, setTab] = useState<'manager' | 'teacher'>(caps.manageIssues || caps.manageReports ? 'manager' : 'teacher');

  if (caps.isConsultantOnly) return <ConsultantDashboard />;

  const showBoth = (caps.manageIssues || caps.manageReports) && caps.isTeacher;

  return (
    <div className="space-y-4">
      {showBoth && (
        <div className="flex gap-1 card p-1 w-fit">
          <button className={`btn btn-sm ${tab === 'manager' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setTab('manager')}>Góc nhìn quản lý</button>
          <button className={`btn btn-sm ${tab === 'teacher' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setTab('teacher')}>Góc nhìn giáo viên</button>
        </div>
      )}
      {(caps.manageIssues || caps.manageReports) && (!showBoth || tab === 'manager') ? <ManagerDashboard /> : <TeacherDashboard />}
    </div>
  );
}

// ---------------------------------------------------------------- Manager

function ManagerDashboard() {
  const [branchId, setBranchId] = useState('');
  const [category, setCategory] = useState('');
  const [teacherId, setTeacherId] = useState('');
  const [showMore, setShowMore] = useState(false);

  const qs = new URLSearchParams();
  if (branchId) qs.set('branchId', branchId);
  if (category) qs.set('category', category);
  if (teacherId) qs.set('teacherId', teacherId);

  const dash = useApi<any>(`/dashboard/manager?${qs}`);
  const branches = useApi<any[]>('/ref/branches');
  const users = useApi<any[]>('/ref/users');

  if (dash.loading) return <Skeleton rows={8} />;
  if (dash.error) return <ErrorState message={dash.error.message} onRetry={dash.reload} />;
  const d = dash.data!;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-2">
        <div>
          <span className="label">Chi nhánh</span>
          <select className="field w-48" value={branchId} onChange={(e) => setBranchId(e.target.value)}>
            <option value="">Tất cả trong phạm vi</option>
            {(branches.data ?? []).map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </div>
        <div>
          <span className="label">Loại lớp</span>
          <select className="field w-36" value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">FT và Normal</option>
            <option value="FT">FT</option>
            <option value="NORMAL">Normal</option>
          </select>
        </div>
        <div>
          <span className="label">Giáo viên</span>
          <select className="field w-52" value={teacherId} onChange={(e) => setTeacherId(e.target.value)}>
            <option value="">Tất cả</option>
            {(users.data ?? []).map((u) => <option key={u.id} value={u.id}>{u.full_name}</option>)}
          </select>
        </div>
        <div className="flex-1" />
        <div className="text-xs text-slate-500">
          Kỳ báo cáo: <strong className="text-slate-300">{d.period?.label ?? 'Chưa có'}</strong>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        {d.primaryKpis.map((k: any) => (
          <KpiTile key={k.key} label={k.label} value={k.value} tone={k.tone} to={k.link} />
        ))}
      </div>

      <div>
        <button className="btn btn-sm" onClick={() => setShowMore((s) => !s)}>
          {showMore ? 'Ẩn số liệu mở rộng' : `Xem thêm ${d.secondaryKpis.length} số liệu`}
        </button>
        {showMore && (
          <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-2 mt-3">
            {d.secondaryKpis.map((k: any) => (
              <div key={k.key} className="card p-3">
                <div className="text-[11px] text-slate-400 leading-snug">{k.label}</div>
                <div className="text-lg font-semibold text-slate-100 tabular-nums mt-1">{k.value}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <BranchOverview data={d.branchOverview} period={d.period} />

      <div className="grid xl:grid-cols-2 gap-4">
        <Card title="Việc cần xử lý" bodyClass="p-0"
          action={<Link to="/cong-viec?view=overdue" className="link text-xs">Mở Công việc →</Link>}>
          {d.actionList.length === 0 ? (
            <Empty title="Không có việc quá hạn hay sắp đến hạn" hint="Các công việc trong phạm vi của bạn đều còn trong hạn." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr><th className="th">Công việc</th><th className="th">Người xử lý</th><th className="th">Hạn</th><th className="th">Nguồn</th></tr></thead>
                <tbody>
                  {d.actionList.map((t: any) => (
                    <tr key={t.id} className="row-hover">
                      <td className="td">
                        <Link to={`/cong-viec?open=${t.id}`} className="link">{t.title}</Link>
                        <div className="text-[11px] text-slate-500">{t.code} · {t.branchName}</div>
                      </td>
                      <td className="td text-slate-300">{t.assigneeName ?? 'Chưa giao'}</td>
                      <td className="td">
                        <Pill tone={t.state === 'overdue' ? 'danger' : 'warn'}>{deadlineLabel(t.state)}</Pill>
                        <div className="text-[11px] text-slate-500 mt-0.5">{fmtDate(t.deadline)}</div>
                      </td>
                      <td className="td text-xs text-slate-400">{t.source}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <Card title="Học viên cần chú ý" bodyClass="p-0"
          action={<Link to="/hoc-vien?concern=concern" className="link text-xs">Mở danh sách →</Link>}>
          {d.concernStudents.length === 0 ? (
            <Empty title="Không có học viên nào vượt ngưỡng" hint="Chỉ tính trên các dòng đã nhập dữ liệu và có mẫu số lớn hơn 0." />
          ) : (
            <ul className="divide-y" style={{ borderColor: 'var(--line)' }}>
              {d.concernStudents.map((s: any) => (
                <li key={s.studentId} className="px-4 py-2.5">
                  <Link to={`/hoc-vien/${s.studentId}`} className="link font-medium">{s.fullName}</Link>
                  <span className="text-xs text-slate-500 ml-2">{s.studentCode}</span>
                  <ul className="mt-1 space-y-0.5">
                    {s.reasons.map((r: string, i: number) => (
                      <li key={i} className="text-xs text-amber-300/90">• {r}</li>
                    ))}
                  </ul>
                  <div className="text-[11px] text-slate-600 mt-1">Kỳ tính: {s.periodLabel}</div>
                </li>
              ))}
            </ul>
          )}
          <div className="p-3 border-t" style={{ borderColor: 'var(--line)' }}>
            <SectionNote>
              Ngưỡng thử nghiệm v{d.policy.version}: chuyên cần dưới {Math.round(d.policy.attendanceMin * 100)}%, bài tập dưới{' '}
              {Math.round(d.policy.homeworkMin * 100)}%, tính trên {d.policy.lookbackWeeks} tuần gần nhất. Đây chỉ là tín hiệu cần chú ý,
              không phải kết luận về thái độ học tập và không tự tạo cảnh báo.
            </SectionNote>
          </div>
        </Card>
      </div>

      <Card title="Lớp chậm theo mốc chương trình">
        {d.delayedClasses.length === 0 ? (
          <Empty
            title="Không có lớp nào bị đánh giá chậm"
            hint="Chỉ những lớp có mốc kèm hạn mới được so sánh. Lớp FT không cấu hình hạn sẽ không bao giờ bị đánh dấu chậm tự động."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr><th className="th">Lớp</th><th className="th">Chi nhánh</th><th className="th">Giai đoạn hiện tại</th><th className="th">Mốc quá hạn</th></tr></thead>
              <tbody>
                {d.delayedClasses.map((c: any) => (
                  <tr key={c.classId} className="row-hover">
                    <td className="td"><Link to={`/lop-hoc/${c.classId}`} className="link">{c.code}</Link>
                      <div className="text-[11px] text-slate-500">{c.name}</div></td>
                    <td className="td text-slate-300">{c.branchName}</td>
                    <td className="td text-slate-300">{c.currentStage ?? 'Chưa cập nhật'}</td>
                    <td className="td">
                      {c.lateStages.map((s: any, i: number) => (
                        <div key={i} className="text-xs text-red-300">{s.name} — quá {s.daysLate} ngày (hạn {fmtDate(s.dueDate)})</div>
                      ))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

function BranchOverview({ data, period }: { data: any; period: any }) {
  const toneOf = (s: string) =>
    s === 'ok' ? 'ok' : s === 'watch' ? 'warn' : s === 'problem' ? 'danger' : 'muted';

  return (
    <Card
      title={`Tình hình chi nhánh — ${period?.label ?? 'chưa chọn kỳ'}`}
      bodyClass="p-0"
      action={<Link to="/bao-cao" className="link text-xs">Mở Báo cáo →</Link>}
    >
      {data.units.length === 0 ? (
        <Empty title="Chưa có đơn vị báo cáo nào trong phạm vi của bạn" />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="th sticky-col">Đơn vị</th>
                {data.categories.map((c: any) => <th key={c.key} className="th">{c.label}</th>)}
                <th className="th">Báo cáo</th>
              </tr>
            </thead>
            <tbody>
              {data.units.map((u: any) => (
                <tr key={u.unitId} className="row-hover">
                  <td className="td sticky-col">
                    <div className="text-slate-100">{u.unitName}</div>
                    <div className="text-[11px] text-slate-500">{u.kind === 'department' ? 'Đơn vị báo cáo riêng' : 'Chi nhánh'}</div>
                  </td>
                  {u.cells.map((c: any) => (
                    <td key={c.key} className="td">
                      <Pill tone={toneOf(c.status) as any} title={c.note ?? undefined}>{branchStatusLabel(c.status)}</Pill>
                      {c.note && <div className="text-[11px] text-slate-500 mt-1 max-w-[15rem]">{c.note}</div>}
                    </td>
                  ))}
                  <td className="td">
                    {!u.reportId
                      ? <Pill tone="danger">Chưa gửi báo cáo</Pill>
                      : u.reportStatus === 'draft'
                        ? <Pill tone="warn">Bản nháp</Pill>
                        : <Pill tone="ok">Đã gửi</Pill>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div className="p-3 border-t" style={{ borderColor: 'var(--line)' }}>
        <SectionNote>Trạng thái do người nhập. "Chưa báo cáo" không đồng nghĩa với "Ổn".</SectionNote>
      </div>
    </Card>
  );
}

// ---------------------------------------------------------------- Teacher

function TeacherDashboard() {
  const dash = useApi<any>('/dashboard/teacher');
  if (dash.loading) return <Skeleton rows={7} />;
  if (dash.error) return <ErrorState message={dash.error.message} onRetry={dash.reload} />;
  const d = dash.data!;

  if (d.myClasses.length === 0) {
    return <Empty title="Bạn chưa được phân công lớp nào" hint="Khi được phân công lớp và skill, các lớp sẽ hiện ở đây cùng tình trạng cập nhật tuần." />;
  }

  return (
    <div className="space-y-4">
      <Card title={`Lớp của tôi — tuần ${weekRangeLabel(d.currentWeek)}`} bodyClass="p-3">
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3">
          {d.myClasses.map((c: any) => (
            <div key={c.classId} className="card p-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <Link to={`/lop-hoc/${c.classId}`} className="link font-medium">{c.code}</Link>
                  <div className="text-[11px] text-slate-500">{c.name} · {c.branchName}</div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <Pill tone="neutral">{c.category}</Pill>
                  {c.isCore && <Pill tone="info">GVCN</Pill>}
                </div>
              </div>
              <div className="mt-2 text-xs text-slate-400">
                {c.activeStudents} học viên đang học · Giai đoạn: {c.currentStage ?? 'chưa cập nhật'}
              </div>
              <div className="mt-2 space-y-1">
                {c.skillStatus.length === 0 && <div className="text-xs text-slate-500">Bạn là GVCN nhưng không dạy skill nào ở lớp này.</div>}
                {c.skillStatus.map((s: any) => (
                  <Link
                    key={s.skill}
                    to={`/lop-hoc/${c.classId}?tab=tuan&skill=${s.skill}&week=${d.currentWeek}`}
                    className="flex items-center justify-between gap-2 px-2 py-1 rounded-md bg-white/[0.03] hover:bg-white/[0.07] no-underline"
                  >
                    <span className="text-slate-200 text-xs">{skillLabel(s.skill)}</span>
                    {s.missing === 0
                      ? <Pill tone="ok">Đã cập nhật</Pill>
                      : <Pill tone="warn">Còn {s.missing}/{s.total} chưa nhập</Pill>}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid xl:grid-cols-2 gap-4">
        <Card title="Học viên cần chú ý" bodyClass="p-0">
          {d.attentionStudents.length === 0 ? (
            <Empty title="Không có học viên nào vượt ngưỡng" />
          ) : (
            <ul className="divide-y max-h-96 overflow-y-auto" style={{ borderColor: 'var(--line)' }}>
              {d.attentionStudents.map((s: any) => (
                <li key={s.studentId} className="px-4 py-2.5">
                  <Link to={`/hoc-vien/${s.studentId}`} className="link font-medium">{s.fullName}</Link>
                  <span className="text-xs text-slate-500 ml-2">{s.studentCode} · {s.classCode}</span>
                  {s.reasons.map((r: string, i: number) => <div key={i} className="text-xs text-amber-300/90">• {r}</div>)}
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Dữ liệu cần cập nhật" bodyClass="p-0">
          {d.needsUpdate.length === 0 ? (
            <Empty title="Bạn đã cập nhật đủ dữ liệu 3 tuần gần nhất" />
          ) : (
            <ul className="divide-y max-h-96 overflow-y-auto" style={{ borderColor: 'var(--line)' }}>
              {d.needsUpdate.map((n: any, i: number) => (
                <li key={i} className="px-4 py-2 flex items-center justify-between gap-2">
                  <div>
                    <span className="text-slate-200">{n.classCode}</span>
                    <span className="text-slate-400 text-xs ml-2">{skillLabel(n.skill)} · tuần {weekRangeLabel(n.weekStart)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Pill tone="warn">{n.missing} dòng</Pill>
                    <Link to={`/lop-hoc/${n.classId}?tab=tuan&skill=${n.skill}&week=${n.weekStart}`} className="btn btn-sm">Nhập ngay</Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {d.myTasks.length > 0 && (
        <Card title="Công việc được giao cho tôi" bodyClass="p-0">
          <table className="w-full text-sm">
            <thead><tr><th className="th">Công việc</th><th className="th">Hạn</th></tr></thead>
            <tbody>
              {d.myTasks.map((t: any) => (
                <tr key={t.id} className="row-hover">
                  <td className="td"><Link to={`/cong-viec?open=${t.id}`} className="link">{t.title}</Link>
                    <span className="text-[11px] text-slate-500 ml-2">{t.code}</span></td>
                  <td className="td">
                    <Pill tone={t.deadlineState === 'overdue' ? 'danger' : t.deadlineState === 'due_soon' ? 'warn' : 'neutral'}>
                      {deadlineLabel(t.deadlineState)}
                    </Pill>
                    <span className="text-xs text-slate-500 ml-2">{t.deadline ? fmtDate(t.deadline) : ''}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}

// ---------------------------------------------------------------- Consultant

function ConsultantDashboard() {
  const dash = useApi<any>('/dashboard/consultant');
  if (dash.loading) return <Skeleton rows={6} />;
  if (dash.error) return <ErrorState message={dash.error.message} onRetry={dash.reload} />;
  const d = dash.data!;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiTile label="Học viên phụ trách" value={d.total} to="/hoc-vien" />
        <KpiTile label="Cần chú ý" value={d.concernCount} tone={d.concernCount ? 'warn' : 'ok'} to="/hoc-vien?concern=concern" />
      </div>
      <Card title="Học viên của tôi" bodyClass="p-0">
        {d.students.length === 0 ? (
          <Empty title="Chưa có học viên nào được phân công cho bạn" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr>
                <th className="th sticky-col">Học viên</th><th className="th">Lớp</th><th className="th">Target</th>
                <th className="th">Chuyên cần</th><th className="th">Bài tập</th><th className="th">Tình trạng</th>
              </tr></thead>
              <tbody>
                {d.students.map((s: any) => (
                  <tr key={s.id} className="row-hover">
                    <td className="td sticky-col"><Link to={`/hoc-vien/${s.id}`} className="link">{s.fullName}</Link>
                      <div className="text-[11px] text-slate-500">{s.studentCode}</div></td>
                    <td className="td text-slate-300">{s.classCode ?? '—'}</td>
                    <td className="td tabular-nums">{s.targetBand ?? '—'}</td>
                    <td className="td">{fmtRatePct(s.signal?.attendance?.rate != null ? Math.round(s.signal.attendance.rate * 1000) / 10 : null)}</td>
                    <td className="td">{fmtRatePct(s.signal?.homework?.rate != null ? Math.round(s.signal.homework.rate * 1000) / 10 : null)}</td>
                    <td className="td">
                      {s.warningOpen > 0 && <Pill tone="danger">Có ghi nhận cảnh báo</Pill>}
                      {s.warningOpen === 0 && s.signal?.concern && <Pill tone="warn">Cần chú ý</Pill>}
                      {s.warningOpen === 0 && !s.signal?.concern && <Pill tone="ok">Bình thường</Pill>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="p-3 border-t" style={{ borderColor: 'var(--line)' }}>
          <SectionNote>
            Bạn xem được thông tin học vụ ở mức tổng hợp. Ghi chú nội bộ của giáo viên và nội dung chi tiết của các ghi nhận
            sự việc không nằm trong phạm vi tài khoản tư vấn viên.
          </SectionNote>
        </div>
      </Card>
    </div>
  );
}
