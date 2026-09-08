import { useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { useApi } from '../lib/useApi.ts';
import { api, invalidate } from '../lib/api.ts';
import { useToast } from '../components/Toast.tsx';
import { Card, Empty, ErrorState, Field, Forbidden, Pill, SectionNote, Skeleton } from '../components/ui.tsx';
import { WeeklyGrid } from '../components/WeeklyGrid.tsx';
import { Modal } from '../components/Drawer.tsx';
import { addDaysStr, fmtDate, fmtRatePct, mondayOf, skillLabel, weekRangeLabel } from '../lib/format.ts';
import { TEACHING_SKILLS } from '@shared/domain.ts';
import { useSession } from '../lib/session.tsx';

const TABS = [
  { key: 'tong-quan', label: 'Tổng quan' },
  { key: 'tuan', label: 'Cập nhật tuần' },
  { key: 'chuong-trinh', label: 'Tiến độ chương trình' },
  { key: 'phan-cong', label: 'Phân công' },
];

export default function ClassDetailPage() {
  const { id } = useParams();
  const { session } = useSession();
  const [params, setParams] = useSearchParams();
  const detail = useApi<any>(`/classes/${id}`);

  const isTeacherOnly = !!session?.capabilities?.isTeacher && !session?.capabilities?.manageIssues;
  const tab = params.get('tab') ?? (isTeacherOnly ? 'tuan' : 'tong-quan');

  const setTab = (t: string) => {
    const next = new URLSearchParams(params);
    next.set('tab', t);
    setParams(next, { replace: true });
  };

  if (detail.loading) return <Skeleton rows={8} />;
  if (detail.error) {
    return detail.error.status === 403
      ? <Forbidden message={detail.error.message} hint={detail.error.hint} />
      : <ErrorState message={detail.error.message} onRetry={detail.reload} />;
  }
  const c = detail.data!;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Link to="/lop-hoc" className="link text-xs">← Lớp học</Link>
          </div>
          <h1 className="text-xl font-semibold text-slate-100 mt-1">{c.code} <span className="text-slate-400 font-normal text-base">· {c.name}</span></h1>
          <div className="flex flex-wrap items-center gap-1.5 mt-2">
            <Pill tone="neutral">{c.category === 'FT' ? 'Lớp FT' : 'Lớp Normal'}</Pill>
            <Pill tone="neutral">{c.classTypeName}</Pill>
            <Pill tone="neutral">{c.branchName}</Pill>
            {c.template && <Pill tone="info">{c.template.name} · v{c.template.versionNo}</Pill>}
            <Pill tone="neutral">Khai giảng {fmtDate(c.startDate)}</Pill>
            {c.viewer.isCoreTeacher && <Pill tone="ok">Bạn là GVCN lớp này</Pill>}
          </div>
        </div>
        <div className="text-right text-xs text-slate-400">
          <div>{c.roster.length} học viên đang học / tạm dừng</div>
          <div className="mt-1">
            Bạn được sửa: {c.viewer.editableSkills.length ? c.viewer.editableSkills.map(skillLabel).join(', ') : 'không skill nào'}
          </div>
        </div>
      </div>

      <div className="flex gap-1 card p-1 w-fit overflow-x-auto">
        {TABS.map((t) => (
          <button key={t.key} className={`btn btn-sm ${tab === t.key ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setTab(t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'tong-quan' && <OverviewTab c={c} />}
      {tab === 'tuan' && <WeeklyTab classId={Number(id)} c={c} params={params} setParams={setParams} />}
      {tab === 'chuong-trinh' && <ProgressTab classId={Number(id)} c={c} />}
      {tab === 'phan-cong' && <AssignmentsTab c={c} />}
    </div>
  );
}

function OverviewTab({ c }: { c: any }) {
  return (
    <div className="grid xl:grid-cols-2 gap-4">
      <Card title={`Tổng hợp tuần hiện tại — ${weekRangeLabel(c.currentWeek)}`} bodyClass="p-0">
        <table className="w-full text-sm">
          <thead><tr>
            <th className="th">Skill</th><th className="th">Chuyên cần</th><th className="th">Bài tập</th>
            <th className="th">Bổ trợ</th><th className="th">Chưa nhập</th>
          </tr></thead>
          <tbody>
            {c.weekSummary.map((s: any) => (
              <tr key={s.skill} className="row-hover">
                <td className="td text-slate-200">{skillLabel(s.skill)}</td>
                <td className="td">{s.applicableRows === 0 ? <span className="text-slate-600 text-xs italic">Không áp dụng</span> : fmtRatePct(s.attendanceRate)}</td>
                <td className="td">{s.applicableRows === 0 ? '—' : fmtRatePct(s.homeworkRate)}</td>
                <td className="td tabular-nums text-slate-300">{s.supplemental}</td>
                <td className="td">{s.missingRows > 0 ? <Pill tone="warn">{s.missingRows} dòng</Pill> : <Pill tone="ok">Đủ</Pill>}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="p-3 border-t" style={{ borderColor: 'var(--line)' }}>
          <SectionNote>Skill không có trong cấu hình lớp hiển thị "Không áp dụng", không tính là thiếu dữ liệu.</SectionNote>
        </div>
      </Card>

      <Card title="Cấu hình số buổi kỳ vọng" bodyClass="p-0">
        <table className="w-full text-sm">
          <thead><tr><th className="th">Skill</th><th className="th">Buổi chính / tuần</th></tr></thead>
          <tbody>
            {c.skillConfig.map((s: any) => (
              <tr key={s.skill} className="row-hover">
                <td className="td text-slate-200">{skillLabel(s.skill)}</td>
                <td className="td">{s.expectedPerWeek == null ? <span className="text-slate-600 text-xs italic">Không áp dụng cho lớp này</span> : <span className="tabular-nums">{s.expectedPerWeek}</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="p-3 border-t" style={{ borderColor: 'var(--line)' }}>
          <SectionNote>Số buổi lấy từ cấu hình lớp, có thể override theo từng học viên hoặc từng tuần. Không suy ra từ tên lớp.</SectionNote>
        </div>
      </Card>

      <Card title="Danh sách học viên" bodyClass="p-0" className="xl:col-span-2">
        {c.roster.length === 0 ? <Empty title="Lớp chưa có học viên" /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr><th className="th">Học viên</th><th className="th">Mã HV</th><th className="th">Target</th><th className="th">Tình trạng</th></tr></thead>
              <tbody>
                {c.roster.map((r: any) => (
                  <tr key={r.enrollmentId} className="row-hover">
                    <td className="td"><Link to={`/hoc-vien/${r.studentId}`} className="link">{r.fullName}</Link></td>
                    <td className="td text-slate-400">{r.studentCode}</td>
                    <td className="td tabular-nums">{r.targetBand ?? '—'}</td>
                    <td className="td">
                      <Pill tone={r.status === 'active' ? 'ok' : 'warn'}>{r.status === 'active' ? 'Đang học' : 'Tạm dừng'}</Pill>
                      {r.attemptNo > 1 && <Pill tone="info">Lần học {r.attemptNo}</Pill>}
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

function WeeklyTab({ classId, c, params, setParams }: { classId: number; c: any; params: URLSearchParams; setParams: any }) {
  const defaultSkill = c.viewer.editableSkills[0] ?? c.skillConfig.find((s: any) => s.expectedPerWeek != null)?.skill ?? TEACHING_SKILLS[0];
  const skill = params.get('skill') ?? defaultSkill;
  const week = mondayOf(params.get('week') ?? c.currentWeek);

  const table = useApi<any>(`/classes/${classId}/weekly?skill=${skill}&week=${week}`);

  const update = (patch: Record<string, string>) => {
    const next = new URLSearchParams(params);
    next.set('tab', 'tuan');
    for (const [k, v] of Object.entries(patch)) next.set(k, v);
    setParams(next, { replace: true });
  };

  const availableSkills = c.skillConfig.filter((s: any) => s.expectedPerWeek != null).map((s: any) => s.skill);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end gap-2">
        <div>
          <span className="label">Tuần (bắt đầu thứ Hai)</span>
          <div className="flex items-center gap-1">
            <button className="btn btn-sm" onClick={() => update({ week: addDaysStr(week, -7) })} aria-label="Tuần trước">←</button>
            <input type="date" className="field w-40" value={week} onChange={(e) => e.target.value && update({ week: mondayOf(e.target.value) })} />
            <button className="btn btn-sm" onClick={() => update({ week: addDaysStr(week, 7) })} aria-label="Tuần sau">→</button>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">{weekRangeLabel(week)}</div>
        </div>
        <div>
          <span className="label">Skill</span>
          <div className="flex gap-1 flex-wrap">
            {availableSkills.map((s: string) => {
              const canEdit = c.viewer.editableSkills.includes(s);
              return (
                <button key={s} className={`btn btn-sm ${skill === s ? 'btn-primary' : ''}`} onClick={() => update({ skill: s })}>
                  {skillLabel(s)}
                  {!canEdit && <span className="text-[10px] opacity-70">(chỉ xem)</span>}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {table.loading && <Skeleton rows={8} />}
      {table.error && <ErrorState message={table.error.message} onRetry={table.reload} />}
      {table.data && <WeeklyGrid table={table.data} onReload={table.reload} />}
    </div>
  );
}

function ProgressTab({ classId, c }: { classId: number; c: any }) {
  const prog = useApi<any>(`/classes/${classId}/progress`);
  const toast = useToast();
  const [editing, setEditing] = useState<any>(null);
  const [overrideStage, setOverrideStage] = useState<any>(null);

  if (prog.loading) return <Skeleton rows={6} />;
  if (prog.error) return <ErrorState message={prog.error.message} onRetry={prog.reload} />;
  const p = prog.data!;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Pill tone="neutral">{c.category === 'FT' ? 'Hiển thị theo stage / milestone' : 'Hiển thị theo tuần / checkpoint'}</Pill>
        <Pill tone="neutral">{p.summary.done}/{p.summary.total} mốc đã hoàn thành</Pill>
        {p.summary.hasDeadlines
          ? (p.summary.delayed ? <Pill tone="danger">Chậm {p.summary.lateCount} mốc</Pill> : <Pill tone="ok">Đúng tiến độ</Pill>)
          : <Pill tone="muted">Chương trình không cấu hình hạn — không đánh giá chậm</Pill>}
      </div>

      <Card bodyClass="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr>
              <th className="th sticky-col">Mốc chương trình</th><th className="th">Loại</th><th className="th">Hạn dự kiến</th>
              <th className="th">Trạng thái thực tế</th><th className="th">Ngày thực tế</th><th className="th">Đánh giá</th><th className="th"></th>
            </tr></thead>
            <tbody>
              {p.stages.map((s: any) => (
                <tr key={s.stageKey} className="row-hover">
                  <td className="td sticky-col">
                    <div className="text-slate-100">{s.name}</div>
                    {s.overridden && <Pill tone="info">{s.addedByOverride ? 'Thêm riêng cho lớp' : 'Đã điều chỉnh riêng cho lớp'}</Pill>}
                  </td>
                  <td className="td text-xs text-slate-400">
                    {{ stage: 'Giai đoạn', milestone: 'Mốc', checkpoint: 'Checkpoint', week: 'Tuần' }[s.kind as string] ?? s.kind}
                  </td>
                  <td className="td">{s.dueDate ? fmtDate(s.dueDate) : <span className="text-slate-600 text-xs italic">Không đặt hạn</span>}</td>
                  <td className="td">
                    <Pill tone={s.status === 'done' ? 'ok' : s.status === 'in_progress' ? 'info' : 'neutral'}>
                      {{ done: 'Đã xong', in_progress: 'Đang học', not_started: 'Chưa bắt đầu' }[s.status as string]}
                    </Pill>
                  </td>
                  <td className="td text-slate-400">{s.actualDate ? fmtDate(s.actualDate) : '—'}</td>
                  <td className="td">
                    {s.scheduleState === 'late' ? <Pill tone="danger">Chậm {s.daysLate} ngày</Pill>
                      : s.scheduleState === 'done' ? <Pill tone="ok">Hoàn thành</Pill>
                        : s.scheduleState === 'no_deadline' ? <Pill tone="muted">Không có hạn</Pill>
                          : <Pill tone="ok">Trong hạn</Pill>}
                  </td>
                  <td className="td text-right whitespace-nowrap">
                    {c.viewer.canEditProgress && <button className="btn btn-sm" onClick={() => setEditing(s)}>Cập nhật</button>}
                    {c.viewer.canEditOverride && <button className="btn btn-sm btn-ghost ml-1" onClick={() => setOverrideStage(s)}>Điều chỉnh</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-3 border-t" style={{ borderColor: 'var(--line)' }}>
          <SectionNote>
            Tiến độ thực tế do người nhập và có ghi nhật ký thay đổi. Lớp chỉ bị đánh giá chậm khi mốc thực sự được cấu hình hạn.
            Điều chỉnh riêng cho lớp không làm thay đổi phiên bản chương trình gốc hay các lớp khác.
          </SectionNote>
        </div>
      </Card>

      {editing && (
        <Modal open onClose={() => setEditing(null)} title={`Cập nhật tiến độ: ${editing.name}`}
          footer={<button className="btn" onClick={() => setEditing(null)}>Đóng</button>}>
          <StageForm
            stage={editing}
            onSave={async (patch) => {
              try {
                await api.patch(`/classes/${classId}/progress/${editing.stageKey}`, patch);
                invalidate('/classes'); invalidate('/dashboard');
                prog.reload(); setEditing(null);
                toast.push('ok', 'Đã cập nhật tiến độ thực tế');
              } catch (e: any) { toast.push('error', e.hint ? `${e.message} ${e.hint}` : e.message); }
            }}
          />
        </Modal>
      )}

      {overrideStage && (
        <Modal open onClose={() => setOverrideStage(null)} title={`Điều chỉnh riêng cho lớp: ${overrideStage.name}`}
          footer={<button className="btn" onClick={() => setOverrideStage(null)}>Đóng</button>}>
          <OverrideForm
            stage={overrideStage}
            onSave={async (body) => {
              try {
                await api.post(`/classes/${classId}/overrides`, body);
                invalidate('/classes'); prog.reload(); setOverrideStage(null);
                toast.push('ok', 'Đã lưu điều chỉnh riêng cho lớp này');
              } catch (e: any) { toast.push('error', e.message); }
            }}
          />
        </Modal>
      )}
    </div>
  );
}

function StageForm({ stage, onSave }: { stage: any; onSave: (p: any) => void }) {
  const [status, setStatus] = useState(stage.status);
  const [actualDate, setActualDate] = useState(stage.actualDate ?? '');
  const [note, setNote] = useState(stage.note ?? '');
  return (
    <div className="space-y-3">
      <Field label="Trạng thái thực tế">
        <select className="field" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="not_started">Chưa bắt đầu</option>
          <option value="in_progress">Đang học</option>
          <option value="done">Đã xong</option>
        </select>
      </Field>
      <Field label="Ngày thực tế"><input type="date" className="field" value={actualDate} onChange={(e) => setActualDate(e.target.value)} /></Field>
      <Field label="Ghi chú"><textarea className="field" rows={3} value={note} onChange={(e) => setNote(e.target.value)} /></Field>
      <button className="btn btn-primary w-full justify-center" onClick={() => onSave({ status, actualDate: actualDate || null, note: note || null })}>
        Lưu thay đổi
      </button>
      <p className="text-[11px] text-slate-500">Thay đổi này được ghi vào nhật ký kèm giá trị trước và sau.</p>
    </div>
  );
}

function OverrideForm({ stage, onSave }: { stage: any; onSave: (p: any) => void }) {
  const [name, setName] = useState(stage.name);
  const [clearDue, setClearDue] = useState(stage.dueOffsetDays == null);
  const [dueOffsetDays, setDueOffsetDays] = useState(stage.dueOffsetDays ?? '');
  const [reason, setReason] = useState('');
  return (
    <div className="space-y-3">
      <Field label="Tên mốc trong lớp này"><input className="field" value={name} onChange={(e) => setName(e.target.value)} /></Field>
      <label className="flex items-center gap-2 text-sm text-slate-300">
        <input type="checkbox" checked={clearDue} onChange={(e) => setClearDue(e.target.checked)} />
        Bỏ hạn cho mốc này (không đánh giá chậm)
      </label>
      {!clearDue && (
        <Field label="Hạn tính từ ngày khai giảng (số ngày)">
          <input className="field" inputMode="numeric" value={dueOffsetDays} onChange={(e) => setDueOffsetDays(e.target.value)} />
        </Field>
      )}
      <Field label="Lý do điều chỉnh" required><textarea className="field" rows={2} value={reason} onChange={(e) => setReason(e.target.value)} /></Field>
      <button className="btn btn-primary w-full justify-center" disabled={!reason.trim()}
        onClick={() => onSave({ stageKey: stage.stageKey, action: 'modify', name, clearDue, dueOffsetDays: clearDue ? null : Number(dueOffsetDays), reason })}>
        Lưu điều chỉnh cho lớp này
      </button>
      <p className="text-[11px] text-slate-500">Chỉ ảnh hưởng lớp hiện tại. Phiên bản chương trình gốc và các lớp khác giữ nguyên.</p>
    </div>
  );
}

function AssignmentsTab({ c }: { c: any }) {
  return (
    <Card title="Phân công giáo viên" bodyClass="p-0">
      {c.assignments.length === 0 ? <Empty title="Lớp chưa có phân công nào" /> : (
        <table className="w-full text-sm">
          <thead><tr>
            <th className="th">Giáo viên</th><th className="th">Vai trò tại lớp</th><th className="th">Hiệu lực</th><th className="th">Trạng thái</th>
          </tr></thead>
          <tbody>
            {c.assignments.map((a: any) => {
              const expired = a.effectiveTo && a.effectiveTo < new Date().toISOString().slice(0, 10);
              return (
                <tr key={a.id} className="row-hover">
                  <td className="td text-slate-200">{a.name}</td>
                  <td className="td">
                    {a.isCore && <Pill tone="ok">GVCN</Pill>}
                    {a.skill && <Pill tone="neutral">GVBM {skillLabel(a.skill)}</Pill>}
                  </td>
                  <td className="td text-xs text-slate-400">
                    {fmtDate(a.effectiveFrom)} → {a.effectiveTo ? fmtDate(a.effectiveTo) : 'không giới hạn'}
                  </td>
                  <td className="td">
                    {a.status !== 'active' ? <Pill tone="muted">Đã lưu trữ</Pill>
                      : expired ? <Pill tone="warn">Hết hiệu lực</Pill> : <Pill tone="ok">Đang hiệu lực</Pill>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
      <div className="p-3 border-t" style={{ borderColor: 'var(--line)' }}>
        <SectionNote>
          GVCN là phân công theo lớp, không phải vai trò hệ thống. Giáo viên dạy thay chỉ có quyền khi phân công còn hiệu lực —
          việc được ghi tên trong buổi bổ trợ không cấp quyền sửa dữ liệu. Thêm/sửa phân công thực hiện ở mục Quản trị.
        </SectionNote>
      </div>
    </Card>
  );
}
