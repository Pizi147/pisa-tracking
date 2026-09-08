import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useApi } from '../lib/useApi.ts';
import { api, invalidate } from '../lib/api.ts';
import { useToast } from '../components/Toast.tsx';
import { Card, Empty, ErrorState, Field, Forbidden, Pill, SectionNote, Skeleton } from '../components/ui.tsx';
import { ConfirmDialog, Modal } from '../components/Drawer.tsx';
import {
  enrollmentStatusLabel, fmtBand, fmtDate, fmtRatePct, fmtScore, scaleLabel, skillLabel, testTypeLabel, weekRangeLabel,
} from '../lib/format.ts';
import { ASSESSMENT_SKILLS, ASSESSMENT_SKILL_LABEL, JOURNEY_EVENT_LABEL, TEACHING_SKILLS } from '@shared/domain.ts';

const TABS = [
  { key: 'tong-quan', label: 'Tổng quan' },
  { key: 'hanh-trinh', label: 'Hành trình' },
  { key: 'hoc-tap', label: 'Học tập theo tuần' },
  { key: 'diem', label: 'Điểm & đánh giá' },
  { key: 'bao-cao', label: 'Báo cáo & ghi nhận' },
];

export default function StudentDetailPage() {
  const { id } = useParams();
  const detail = useApi<any>(`/students/${id}`);
  const [tab, setTab] = useState('tong-quan');

  if (detail.loading) return <Skeleton rows={8} />;
  if (detail.error) {
    return detail.error.status === 403
      ? <Forbidden message={detail.error.message} hint={detail.error.hint} />
      : <ErrorState message={detail.error.message} onRetry={detail.reload} />;
  }
  const s = detail.data!;

  return (
    <div className="space-y-4">
      <StudentHeader s={s} onChanged={detail.reload} />

      <div className="flex gap-1 card p-1 w-fit overflow-x-auto">
        {TABS.map((t) => (
          <button key={t.key} className={`btn btn-sm ${tab === t.key ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setTab(t.key)}>{t.label}</button>
        ))}
      </div>

      {tab === 'tong-quan' && <OverviewTab s={s} onChanged={detail.reload} />}
      {tab === 'hanh-trinh' && <JourneyTab studentId={Number(id)} />}
      {tab === 'hoc-tap' && <WeeklyTab studentId={Number(id)} />}
      {tab === 'diem' && <ScoresTab s={s} onChanged={detail.reload} />}
      {tab === 'bao-cao' && <ReportsTab s={s} onChanged={detail.reload} />}
    </div>
  );
}

function StudentHeader({ s, onChanged }: { s: any; onChanged: () => void }) {
  const [transferOpen, setTransferOpen] = useState(false);
  const active = s.enrollments.filter((e: any) => ['active', 'paused'].includes(e.status));
  const official = s.officialScore;

  return (
    <div className="card p-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <Link to="/hoc-vien" className="link text-xs">← Học viên</Link>
          <h1 className="text-xl font-semibold text-slate-100 mt-1">{s.fullName}</h1>
          <div className="text-xs text-slate-500">{s.studentCode} · Ngày sinh {fmtDate(s.dob)}</div>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {active.length === 0 && <Pill tone="muted">Hiện không thuộc lớp nào</Pill>}
            {active.map((e: any) => (
              <Pill key={e.id} tone={e.status === 'active' ? 'ok' : 'warn'}>
                {e.classCode} · {enrollmentStatusLabel(e.status)}{e.attemptNo > 1 ? ` · lần ${e.attemptNo}` : ''}
              </Pill>
            ))}
            {s.enrollments.length > active.length && <Pill tone="neutral">{s.enrollments.length} lần học trong lịch sử</Pill>}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
          <div>
            <div className="label">Mục tiêu</div>
            <div className="text-slate-100 tabular-nums">{s.targetBand ?? '—'}</div>
          </div>
          <div>
            <div className="label">Lịch thi</div>
            <div className="text-slate-100">{s.examDate ? fmtDate(s.examDate) : 'Chưa có'}</div>
          </div>
          <div>
            <div className="label">Điểm official gần nhất</div>
            {official ? (
              <>
                <div className="text-slate-100 tabular-nums">
                  {official.scores.overall != null ? fmtScore(official.scores.overall, official.scale) : 'Chưa có Overall'}
                </div>
                <div className="text-[11px] text-slate-500">{testTypeLabel(official.testType)} · {fmtDate(official.testDate)}</div>
              </>
            ) : <div className="text-slate-500 text-xs">Chưa có bài official</div>}
          </div>
          <div>
            <div className="label">Ước lượng GV</div>
            {s.estimates.length === 0 ? <div className="text-slate-500 text-xs">Chưa có</div> : (
              <div className="text-[11px] text-slate-300 space-y-0.5">
                {TEACHING_SKILLS.map((sk) => {
                  const e = s.estimates.find((x: any) => x.teachingSkill === sk);
                  return e ? <div key={sk}>{skillLabel(sk)}: <span className="tabular-nums text-sky-300">{fmtBand(e.band)}</span></div> : null;
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-3 pt-3 border-t flex flex-wrap items-center gap-2" style={{ borderColor: 'var(--line)' }}>
        <span className="text-xs text-slate-400">Điều cần chú ý:</span>
        {s.signal?.concern
          ? s.signal.reasons.map((r: string, i: number) => <Pill key={i} tone="warn">{r}</Pill>)
          : <Pill tone="ok">Không có tín hiệu vượt ngưỡng</Pill>}
        {s.warnings.filter((w: any) => w.status !== 'closed').length > 0 && <Pill tone="danger">Đang có ghi nhận cảnh báo</Pill>}
        {s.openIssues.map((i: any) => (
          <Link key={i.id} to={`/van-de?open=${i.id}`} className="no-underline"><Pill tone="danger">Vấn đề {i.code}</Pill></Link>
        ))}
        <div className="flex-1" />
        {s.viewer.canTransfer && <button className="btn btn-sm" onClick={() => setTransferOpen(true)}>Chuyển lớp</button>}
      </div>

      <div className="mt-2 text-xs">
        <span className="text-slate-400">Bước tiếp theo: </span>
        {s.nextTask ? (
          <Link to={`/cong-viec?open=${s.nextTask.id}`} className="link">
            {s.nextTask.title} — {s.nextTask.assigneeName ?? 'chưa giao'}{s.nextTask.deadline ? `, hạn ${fmtDate(s.nextTask.deadline)}` : ', chưa có hạn'}
          </Link>
        ) : <span className="text-slate-500">Chưa có công việc theo dõi</span>}
      </div>

      {!s.viewer.canSeeInternal && (
        <div className="mt-2">
          <SectionNote>
            Bạn đang xem bản dành cho tư vấn: ghi chú nội bộ của giáo viên, nội dung chi tiết của ghi nhận sự việc và nhật ký
            thay đổi không nằm trong phạm vi tài khoản này.
          </SectionNote>
        </div>
      )}

      {transferOpen && <TransferDialog student={s} onClose={() => setTransferOpen(false)} onDone={() => { setTransferOpen(false); onChanged(); }} />}
    </div>
  );
}

function TransferDialog({ student, onClose, onDone }: { student: any; onClose: () => void; onDone: () => void }) {
  const toast = useToast();
  const classes = useApi<any[]>('/ref/classes');
  const [toClassId, setToClassId] = useState('');
  const [effectiveDate, setEffectiveDate] = useState('');
  const [reason, setReason] = useState('');
  const [keepSkills, setKeepSkills] = useState(true);
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);

  const current = student.enrollments.find((e: any) => ['active', 'paused'].includes(e.status));
  const target = (classes.data ?? []).find((c) => String(c.id) === toClassId);

  const submit = async () => {
    setBusy(true);
    try {
      await api.post(`/students/${student.id}/transfer`, { toClassId: Number(toClassId), effectiveDate, reason, keepSkills });
      invalidate('/students'); invalidate('/classes'); invalidate('/dashboard');
      toast.push('ok', 'Đã chuyển lớp. Lần học cũ được giữ nguyên trong lịch sử.');
      onDone();
    } catch (e: any) {
      toast.push('error', e.hint ? `${e.message} ${e.hint}` : e.message);
    } finally { setBusy(false); setConfirm(false); }
  };

  return (
    <>
      <Modal open onClose={onClose} title={`Chuyển lớp — ${student.fullName}`}
        footer={<>
          <button className="btn" onClick={onClose}>Huỷ</button>
          <button className="btn btn-primary" disabled={!toClassId || !effectiveDate} onClick={() => setConfirm(true)}>Xem lại và xác nhận</button>
        </>}>
        <div className="space-y-3">
          <div className="card p-3 text-xs text-slate-400">
            Lần học hiện tại ở <strong className="text-slate-200">{current?.classCode ?? 'chưa có lớp'}</strong> sẽ được đóng lại
            với trạng thái "Đã chuyển lớp", không bị xoá. Toàn bộ dữ liệu tuần, điểm và ghi nhận cũ vẫn giữ nguyên.
          </div>
          <Field label="Lớp đích" required>
            <select className="field" value={toClassId} onChange={(e) => setToClassId(e.target.value)}>
              <option value="">— Chọn lớp —</option>
              {(classes.data ?? []).filter((c) => c.id !== current?.classId).map((c) => (
                <option key={c.id} value={c.id}>{c.code} · {c.branchName} · {c.category}</option>
              ))}
            </select>
          </Field>
          <Field label="Ngày hiệu lực" required><input type="date" className="field" value={effectiveDate} onChange={(e) => setEffectiveDate(e.target.value)} /></Field>
          <Field label="Lý do"><textarea className="field" rows={2} value={reason} onChange={(e) => setReason(e.target.value)} /></Field>
          <label className="flex items-center gap-2 text-sm text-slate-300">
            <input type="checkbox" checked={keepSkills} onChange={(e) => setKeepSkills(e.target.checked)} />
            Giữ nguyên các skill đã đăng ký (bỏ chọn để lấy theo cấu hình lớp mới)
          </label>
        </div>
      </Modal>

      <ConfirmDialog
        open={confirm} onClose={() => setConfirm(false)} onConfirm={submit} busy={busy}
        title="Xác nhận chuyển lớp" confirmLabel="Chuyển lớp"
        body={
          <div className="space-y-2">
            <p><strong>{student.fullName}</strong> ({student.studentCode})</p>
            <p>Từ <strong>{current?.classCode ?? '—'}</strong> sang <strong>{target?.code}</strong>, hiệu lực {fmtDate(effectiveDate)}.</p>
            <p className="text-xs text-slate-400">Thao tác này không dùng autosave và sẽ được ghi vào nhật ký thay đổi cùng hành trình học viên.</p>
          </div>
        }
      />
    </>
  );
}

function OverviewTab({ s, onChanged }: { s: any; onChanged: () => void }) {
  const toast = useToast();
  const [noteOpen, setNoteOpen] = useState(false);

  return (
    <div className="grid xl:grid-cols-2 gap-4">
      <Card title="Các lần học (Enrollment)" bodyClass="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr><th className="th">Lớp</th><th className="th">Lần</th><th className="th">Thời gian</th><th className="th">Trạng thái</th><th className="th">Skill đăng ký</th></tr></thead>
            <tbody>
              {s.enrollments.map((e: any) => (
                <tr key={e.id} className="row-hover">
                  <td className="td"><Link to={`/lop-hoc/${e.classId}`} className="link">{e.classCode}</Link>
                    <div className="text-[11px] text-slate-500">{e.branchName} · {e.category}</div></td>
                  <td className="td tabular-nums">{e.attemptNo}</td>
                  <td className="td text-xs text-slate-400">{fmtDate(e.enrolledAt)} → {e.endedAt ? fmtDate(e.endedAt) : 'nay'}</td>
                  <td className="td">
                    <Pill tone={e.status === 'active' ? 'ok' : e.status === 'paused' ? 'warn' : 'neutral'}>{enrollmentStatusLabel(e.status)}</Pill>
                    {e.endReason && <div className="text-[11px] text-slate-500 mt-0.5">{e.endReason}</div>}
                  </td>
                  <td className="td">
                    <div className="flex flex-wrap gap-1">
                      {e.skills.filter((k: any) => k.registered).map((k: any) => <Pill key={k.skill} tone="neutral">{skillLabel(k.skill)}</Pill>)}
                      {e.skills.filter((k: any) => !k.registered).map((k: any) => <Pill key={k.skill} tone="muted">{skillLabel(k.skill)}: không áp dụng</Pill>)}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-3 border-t" style={{ borderColor: 'var(--line)' }}>
          <SectionNote>Mỗi lần học là một bản ghi riêng. Chuyển lớp, học lại hay tạm dừng đều giữ lại lần học trước.</SectionNote>
        </div>
      </Card>

      <Card title="Tín hiệu học tập" >
        <div className="grid grid-cols-2 gap-3">
          <div className="card p-3">
            <div className="label">Chuyên cần buổi chính</div>
            <div className="text-2xl tabular-nums text-slate-100">
              {s.signal.attendance.expected > 0 ? fmtRatePct(Math.round(s.signal.attendance.rate * 1000) / 10) : '—'}
            </div>
            <div className="text-[11px] text-slate-500">
              {s.signal.attendance.expected > 0
                ? `${s.signal.attendance.attended}/${s.signal.attendance.expected} buổi · ${s.signal.periodLabel}`
                : 'Chưa đủ dữ liệu để tính'}
            </div>
          </div>
          <div className="card p-3">
            <div className="label">Bài tập hoàn thành</div>
            <div className="text-2xl tabular-nums text-slate-100">
              {s.signal.homework.assigned > 0 ? fmtRatePct(Math.round(s.signal.homework.rate * 1000) / 10) : '—'}
            </div>
            <div className="text-[11px] text-slate-500">
              {s.signal.homework.assigned > 0 ? `${s.signal.homework.completed}/${s.signal.homework.assigned} bài` : 'Chưa đủ dữ liệu để tính'}
            </div>
          </div>
        </div>
        {s.signal.missingUpdates > 0 && (
          <div className="mt-3"><Pill tone="info">{s.signal.missingUpdates} dòng tuần chưa được cập nhật</Pill></div>
        )}
        <div className="mt-3">
          <SectionNote>
            Ngưỡng thử nghiệm v{s.signal.policyVersion}. Dòng chưa nhập không bị tính là vắng học và không tạo tín hiệu cần chú ý.
          </SectionNote>
        </div>
      </Card>

      <Card title="Ghi chú của giáo viên" className="xl:col-span-2" bodyClass="p-0"
        action={s.viewer.canSeeInternal ? <button className="btn btn-sm" onClick={() => setNoteOpen(true)}>Thêm ghi chú</button> : undefined}>
        {s.notes.length === 0 ? <Empty title="Chưa có ghi chú nào bạn được xem" /> : (
          <ul className="divide-y" style={{ borderColor: 'var(--line)' }}>
            {s.notes.map((n: any) => (
              <li key={n.id} className="px-4 py-2.5">
                <div className="flex items-center gap-2">
                  <Pill tone={n.visibility === 'internal' ? 'danger' : 'ok'}>
                    {n.visibility === 'internal' ? 'Nội bộ' : 'Có thể chia sẻ'}
                  </Pill>
                  {n.skill && <Pill tone="neutral">{skillLabel(n.skill)}</Pill>}
                  <span className="text-xs text-slate-500">{n.authorName} · {fmtDate(n.createdAt)}</span>
                </div>
                <p className="text-sm text-slate-300 mt-1">{n.body}</p>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {noteOpen && (
        <NoteDialog studentId={s.id} onClose={() => setNoteOpen(false)}
          onDone={() => { setNoteOpen(false); onChanged(); toast.push('ok', 'Đã lưu ghi chú'); }} />
      )}
    </div>
  );
}

function NoteDialog({ studentId, onClose, onDone }: { studentId: number; onClose: () => void; onDone: () => void }) {
  const toast = useToast();
  const [body, setBody] = useState('');
  const [visibility, setVisibility] = useState('internal');
  const [skill, setSkill] = useState('');
  const [busy, setBusy] = useState(false);
  return (
    <Modal open onClose={onClose} title="Thêm ghi chú"
      footer={<>
        <button className="btn" onClick={onClose}>Huỷ</button>
        <button className="btn btn-primary" disabled={!body.trim() || busy} onClick={async () => {
          setBusy(true);
          try {
            await api.post(`/students/${studentId}/notes`, { body, visibility, skill: skill || null });
            onDone();
          } catch (e: any) { toast.push('error', e.hint ? `${e.message} ${e.hint}` : e.message); }
          finally { setBusy(false); }
        }}>Lưu ghi chú</button>
      </>}>
      <div className="space-y-3">
        <Field label="Nội dung" required><textarea className="field" rows={4} value={body} onChange={(e) => setBody(e.target.value)} /></Field>
        <Field label="Skill liên quan">
          <select className="field" value={skill} onChange={(e) => setSkill(e.target.value)}>
            <option value="">Không gắn skill</option>
            {TEACHING_SKILLS.map((s) => <option key={s} value={s}>{skillLabel(s)}</option>)}
          </select>
        </Field>
        <Field label="Phạm vi hiển thị" hint="Ghi chú nội bộ không hiển thị cho tư vấn viên, kể cả qua tìm kiếm.">
          <select className="field" value={visibility} onChange={(e) => setVisibility(e.target.value)}>
            <option value="internal">Nội bộ — chỉ giáo viên và quản lý</option>
            <option value="shared">Có thể chia sẻ với tư vấn viên</option>
          </select>
        </Field>
      </div>
    </Modal>
  );
}

function JourneyTab({ studentId }: { studentId: number }) {
  const [types, setTypes] = useState<string[]>([]);
  const qs = types.length ? `?types=${types.join(',')}` : '';
  const journey = useApi<any[]>(`/students/${studentId}/journey${qs}`);
  const allTypes = Object.keys(JOURNEY_EVENT_LABEL);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1">
        <button className={`btn btn-sm ${types.length === 0 ? 'btn-primary' : ''}`} onClick={() => setTypes([])}>Tất cả</button>
        {allTypes.map((t) => (
          <button key={t} className={`btn btn-sm ${types.includes(t) ? 'btn-primary' : ''}`}
            onClick={() => setTypes((s) => s.includes(t) ? s.filter((x) => x !== t) : [...s, t])}>
            {JOURNEY_EVENT_LABEL[t]}
          </button>
        ))}
      </div>
      {journey.loading && <Skeleton rows={6} />}
      {journey.data && (journey.data.length === 0
        ? <Empty title="Chưa có sự kiện nào khớp bộ lọc" />
        : (
          <Card bodyClass="p-0">
            <ol className="divide-y" style={{ borderColor: 'var(--line)' }}>
              {journey.data.map((e) => (
                <li key={e.id} className="px-4 py-3 flex gap-3">
                  <div className="w-24 shrink-0 text-xs text-slate-400 tabular-nums pt-0.5">{fmtDate(e.eventDate)}</div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Pill tone="neutral">{JOURNEY_EVENT_LABEL[e.eventType] ?? e.eventType}</Pill>
                      {e.classCode && <span className="text-xs text-slate-500">{e.classCode}</span>}
                      {e.visibility === 'internal' && <Pill tone="danger">Nội bộ</Pill>}
                    </div>
                    <div className="text-sm text-slate-200 mt-1">{e.title}</div>
                    {e.detail && <div className="text-xs text-slate-400 mt-0.5">{e.detail}</div>}
                    {e.actorName && <div className="text-[11px] text-slate-600 mt-0.5">Ghi bởi {e.actorName}</div>}
                  </div>
                </li>
              ))}
            </ol>
          </Card>
        ))}
    </div>
  );
}

function WeeklyTab({ studentId }: { studentId: number }) {
  const weekly = useApi<any[]>(`/students/${studentId}/weekly?weeks=10`);
  if (weekly.loading) return <Skeleton rows={6} />;
  if (!weekly.data?.length) return <Empty title="Chưa có dữ liệu tuần" />;

  const byWeek = new Map<string, any[]>();
  for (const r of weekly.data) {
    if (!byWeek.has(r.weekStart)) byWeek.set(r.weekStart, []);
    byWeek.get(r.weekStart)!.push(r);
  }

  return (
    <div className="space-y-3">
      {[...byWeek.entries()].map(([week, rows]) => (
        <Card key={week} title={`Tuần ${weekRangeLabel(week)}`} bodyClass="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr>
                <th className="th">Skill</th><th className="th">Lớp</th><th className="th">Buổi chính</th><th className="th">Bổ trợ</th>
                <th className="th">Tổng buổi</th><th className="th">Bài tập</th><th className="th">Tỷ lệ chuyên cần</th><th className="th">Ghi chú</th>
              </tr></thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className={`row-hover ${!r.applicable ? 'opacity-60' : ''}`}>
                    <td className="td text-slate-200">{skillLabel(r.skill)}</td>
                    <td className="td text-xs text-slate-400">{r.classCode}</td>
                    <td className="td">
                      {!r.applicable ? <span className="text-slate-600 text-xs italic">Không áp dụng</span>
                        : r.attended == null ? <span className="text-slate-500 text-xs">Chưa có dữ liệu</span>
                          : <span className="tabular-nums">{r.attended} / {r.expected ?? '—'}</span>}
                    </td>
                    <td className="td tabular-nums">{r.applicable ? (r.supplemental ?? '—') : '—'}</td>
                    <td className="td tabular-nums text-teal-300">{r.totalSessions ?? '—'}</td>
                    <td className="td">
                      {!r.applicable ? '—'
                        : r.homeworkCompleted == null ? <span className="text-slate-500 text-xs">Chưa có dữ liệu</span>
                          : <span className="tabular-nums">{r.homeworkCompleted} / {r.homeworkAssigned ?? '—'}</span>}
                    </td>
                    <td className="td">{fmtRatePct(r.attendanceRate)}</td>
                    <td className="td text-xs text-slate-400">{r.note ?? ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ))}
      <SectionNote>
        Tổng buổi đã học = buổi chính đã tham dự + buổi bổ trợ. Tỷ lệ chuyên cần chỉ tính trên buổi chính, nên số buổi bổ trợ
        nhiều không làm tỷ lệ vượt 100%.
      </SectionNote>
    </div>
  );
}

function ScoresTab({ s, onChanged }: { s: any; onChanged: () => void }) {
  const [assessOpen, setAssessOpen] = useState(false);
  const [estimateOpen, setEstimateOpen] = useState(false);

  return (
    <div className="space-y-4">
      <div className="grid xl:grid-cols-2 gap-4">
        <Card title="Điểm kiểm tra chính thức"
          action={s.viewer.canEditOfficial ? <button className="btn btn-sm" onClick={() => setAssessOpen(true)}>Nhập bài kiểm tra</button> : undefined}
          bodyClass="p-0">
          {s.assessments.length === 0 ? (
            <Empty title="Chưa có bài kiểm tra nào" hint="Học viên này mới chỉ có ước lượng của giáo viên (nếu có)." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr>
                  <th className="th">Bài kiểm tra</th><th className="th">Ngày</th><th className="th">Thang điểm</th>
                  {ASSESSMENT_SKILLS.map((k) => <th key={k} className="th">{ASSESSMENT_SKILL_LABEL[k]}</th>)}
                </tr></thead>
                <tbody>
                  {s.assessments.map((a: any) => {
                    const map: Record<string, number> = {};
                    for (const x of a.scores) map[x.skill] = x.score;
                    return (
                      <tr key={a.id} className="row-hover">
                        <td className="td text-slate-200">{testTypeLabel(a.testType)}
                          {a.title && <div className="text-[11px] text-slate-500">{a.title}</div>}</td>
                        <td className="td text-xs text-slate-400">{fmtDate(a.testDate)}</td>
                        <td className="td text-xs"><Pill tone="neutral">{scaleLabel(a.scale)}</Pill></td>
                        {ASSESSMENT_SKILLS.map((k) => (
                          <td key={k} className="td tabular-nums">
                            {map[k] != null ? fmtScore(map[k], a.scale) : <span className="text-slate-600 text-xs italic">Chưa có</span>}
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          <div className="p-3 border-t" style={{ borderColor: 'var(--line)' }}>
            <SectionNote>
              Mỗi bài là một bản ghi riêng, không ghi đè lịch sử. Bài Progress/Final của lớp Normal dùng thang điểm riêng và
              không được quy đổi sang band IELTS.
            </SectionNote>
          </div>
        </Card>

        <Card title="Ước lượng của giáo viên"
          action={s.viewer.canEditEstimateSkills.length > 0 ? <button className="btn btn-sm" onClick={() => setEstimateOpen(true)}>Nhập ước lượng</button> : undefined}
          bodyClass="p-0">
          {s.estimates.length === 0 ? <Empty title="Chưa có ước lượng nào" /> : (
            <table className="w-full text-sm">
              <thead><tr><th className="th">Skill giảng dạy</th><th className="th">Band ước lượng</th><th className="th">Ngày</th><th className="th">Giáo viên</th><th className="th">Ghi chú</th></tr></thead>
              <tbody>
                {s.estimates.map((e: any) => (
                  <tr key={e.id} className="row-hover">
                    <td className="td text-slate-200">{skillLabel(e.teachingSkill)}</td>
                    <td className="td tabular-nums text-sky-300">{fmtBand(e.band)}</td>
                    <td className="td text-xs text-slate-400">{fmtDate(e.estimateDate)}</td>
                    <td className="td text-xs text-slate-400">{e.teacherName ?? '—'}</td>
                    <td className="td text-xs text-slate-400">{e.note ?? ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <div className="p-3 border-t" style={{ borderColor: 'var(--line)' }}>
            <SectionNote>
              Đây là <strong>ước lượng</strong>, không phải điểm chính thức. Writing 1 và Writing 2 là hai skill giảng dạy riêng
              và không được lấy trung bình thành điểm Writing.
            </SectionNote>
          </div>
        </Card>
      </div>

      {assessOpen && <AssessmentDialog student={s} onClose={() => setAssessOpen(false)} onDone={() => { setAssessOpen(false); onChanged(); }} />}
      {estimateOpen && <EstimateDialog student={s} onClose={() => setEstimateOpen(false)} onDone={() => { setEstimateOpen(false); onChanged(); }} />}
    </div>
  );
}

function AssessmentDialog({ student, onClose, onDone }: { student: any; onClose: () => void; onDone: () => void }) {
  const toast = useToast();
  const [testType, setTestType] = useState('mock');
  const [scale, setScale] = useState('ielts');
  const [testDate, setTestDate] = useState('');
  const [title, setTitle] = useState('');
  const [scores, setScores] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  return (
    <Modal open onClose={onClose} title={`Nhập bài kiểm tra — ${student.fullName}`}
      footer={<>
        <button className="btn" onClick={onClose}>Huỷ</button>
        <button className="btn btn-primary" disabled={!testDate || busy} onClick={async () => {
          setBusy(true);
          try {
            await api.post(`/students/${student.id}/assessments`, { testType, scale, testDate, title, scores });
            invalidate('/students'); toast.push('ok', 'Đã lưu bài kiểm tra'); onDone();
          } catch (e: any) { toast.push('error', e.hint ? `${e.message} ${e.hint}` : e.message); }
          finally { setBusy(false); }
        }}>Lưu bài kiểm tra</button>
      </>}>
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Loại bài">
            <select className="field" value={testType} onChange={(e) => {
              setTestType(e.target.value);
              setScale(['entrance', 'mock'].includes(e.target.value) ? 'ielts' : 'score10');
            }}>
              <option value="entrance">Entrance Test</option>
              <option value="mock">Mock Test</option>
              <option value="progress">Progress Test (Normal)</option>
              <option value="final">Final Test (Normal)</option>
            </select>
          </Field>
          <Field label="Thang điểm">
            <select className="field" value={scale} onChange={(e) => setScale(e.target.value)}>
              <option value="ielts">Thang IELTS (0–9)</option>
              <option value="score10">Thang 10</option>
              <option value="score100">Thang 100</option>
            </select>
          </Field>
        </div>
        <Field label="Ngày kiểm tra" required><input type="date" className="field" value={testDate} onChange={(e) => setTestDate(e.target.value)} /></Field>
        <Field label="Ghi chú tên bài"><input className="field" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ví dụ: Mock Test tháng 9" /></Field>
        <div>
          <div className="label">Điểm theo skill (để trống nếu học viên không thi phần đó)</div>
          <div className="grid grid-cols-5 gap-2">
            {ASSESSMENT_SKILLS.map((k) => (
              <label key={k} className="block">
                <span className="text-[11px] text-slate-400">{ASSESSMENT_SKILL_LABEL[k]}</span>
                <input className="field text-center" inputMode="decimal" value={scores[k] ?? ''}
                  onChange={(e) => setScores((s) => ({ ...s, [k]: e.target.value }))} placeholder="—" />
              </label>
            ))}
          </div>
          <p className="text-[11px] text-slate-500 mt-2">
            Skill để trống sẽ hiển thị "Chưa có". Hệ thống không tự ghép điểm từ nhiều bài thành một bài giả.
          </p>
        </div>
      </div>
    </Modal>
  );
}

function EstimateDialog({ student, onClose, onDone }: { student: any; onClose: () => void; onDone: () => void }) {
  const toast = useToast();
  const active = student.enrollments.find((e: any) => e.status === 'active') ?? student.enrollments[0];
  const [enrollmentId, setEnrollmentId] = useState(String(active?.id ?? ''));
  const [teachingSkill, setTeachingSkill] = useState(student.viewer.canEditEstimateSkills[0] ?? 'listening');
  const [band, setBand] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  return (
    <Modal open onClose={onClose} title={`Nhập ước lượng — ${student.fullName}`}
      footer={<>
        <button className="btn" onClick={onClose}>Huỷ</button>
        <button className="btn btn-primary" disabled={!band || busy} onClick={async () => {
          setBusy(true);
          try {
            await api.post('/estimates', { enrollmentId: Number(enrollmentId), teachingSkill, band: Number(band), note });
            invalidate('/students'); toast.push('ok', 'Đã lưu ước lượng'); onDone();
          } catch (e: any) { toast.push('error', e.hint ? `${e.message} ${e.hint}` : e.message); }
          finally { setBusy(false); }
        }}>Lưu ước lượng</button>
      </>}>
      <div className="space-y-3">
        <Field label="Lần học">
          <select className="field" value={enrollmentId} onChange={(e) => setEnrollmentId(e.target.value)}>
            {student.enrollments.map((e: any) => (
              <option key={e.id} value={e.id}>{e.classCode} · lần {e.attemptNo} · {enrollmentStatusLabel(e.status)}</option>
            ))}
          </select>
        </Field>
        <Field label="Skill giảng dạy" hint="Bạn chỉ nhập được skill mình được phân công.">
          <select className="field" value={teachingSkill} onChange={(e) => setTeachingSkill(e.target.value)}>
            {student.viewer.canEditEstimateSkills.map((s: string) => <option key={s} value={s}>{skillLabel(s)}</option>)}
          </select>
        </Field>
        <Field label="Band ước lượng" required><input className="field" inputMode="decimal" value={band} onChange={(e) => setBand(e.target.value)} placeholder="Ví dụ: 6.0" /></Field>
        <Field label="Ghi chú"><textarea className="field" rows={2} value={note} onChange={(e) => setNote(e.target.value)} /></Field>
      </div>
    </Modal>
  );
}

function ReportsTab({ s, onChanged }: { s: any; onChanged: () => void }) {
  const [reportOpen, setReportOpen] = useState(false);
  const [warnOpen, setWarnOpen] = useState(false);

  return (
    <div className="space-y-4">
      <Card title="Báo cáo tiến độ học viên" bodyClass="p-0"
        action={s.viewer.canEditSummary ? <button className="btn btn-sm" onClick={() => setReportOpen(true)}>Viết báo cáo</button> : undefined}>
        {s.progressReports.length === 0 ? <Empty title="Chưa có báo cáo tiến độ nào" /> : (
          <ul className="divide-y" style={{ borderColor: 'var(--line)' }}>
            {s.progressReports.map((r: any) => (
              <li key={r.id} className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className="text-slate-100 font-medium">{r.periodLabel}</span>
                  <span className="text-xs text-slate-500">{fmtDate(r.reportDate)} · {r.authorName}</span>
                  {r.redacted && <Pill tone="info">Bản dành cho tư vấn</Pill>}
                </div>
                {r.progressSummary && <p className="text-sm text-slate-300 mt-1"><span className="text-slate-500 text-xs">Tiến độ: </span>{r.progressSummary}</p>}
                {r.attitudeSummary && <p className="text-sm text-slate-300 mt-1"><span className="text-slate-500 text-xs">Thái độ: </span>{r.attitudeSummary}</p>}
                {r.nextSteps && <p className="text-sm text-slate-300 mt-1"><span className="text-slate-500 text-xs">Bước tiếp: </span>{r.nextSteps}</p>}
                {r.sharedSummary && <p className="text-sm text-teal-200/90 mt-1"><span className="text-slate-500 text-xs">Tóm tắt chia sẻ: </span>{r.sharedSummary}</p>}
              </li>
            ))}
          </ul>
        )}
        <div className="p-3 border-t" style={{ borderColor: 'var(--line)' }}>
          <SectionNote>Báo cáo tiến độ học viên là đối tượng riêng, không phải báo cáo chi nhánh. Mỗi kỳ lưu một bản.</SectionNote>
        </div>
      </Card>

      <div className="grid xl:grid-cols-2 gap-4">
        <Card title="Ghi nhận cảnh báo" bodyClass="p-0"
          action={s.viewer.canEditSummary ? <button className="btn btn-sm" onClick={() => setWarnOpen(true)}>Ghi nhận cảnh báo</button> : undefined}>
          {s.warnings.length === 0 ? <Empty title="Chưa có ghi nhận cảnh báo nào" /> : (
            <ul className="divide-y" style={{ borderColor: 'var(--line)' }}>
              {s.warnings.map((w: any) => (
                <li key={w.id} className="px-4 py-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Pill tone={w.level === 'serious' ? 'danger' : w.level === 'warning' ? 'warn' : 'info'}>
                      {{ reminder: 'Nhắc nhở', warning: 'Cảnh báo', serious: 'Nghiêm trọng' }[w.level as string] ?? w.level}
                    </Pill>
                    <Pill tone={w.status === 'closed' ? 'neutral' : 'warn'}>
                      {{ open: 'Đang mở', monitoring: 'Đang theo dõi', closed: 'Đã đóng' }[w.status as string] ?? w.status}
                    </Pill>
                    <span className="text-xs text-slate-500">{fmtDate(w.issuedDate)}</span>
                  </div>
                  <p className="text-sm text-slate-200 mt-1">{w.reason}</p>
                  {w.description && <p className="text-xs text-slate-400 mt-1">{w.description}</p>}
                  {w.redacted && <p className="text-[11px] text-slate-600 mt-1 italic">Nội dung chi tiết không hiển thị với tài khoản này.</p>}
                  {w.followUp && <p className="text-xs text-teal-200/80 mt-1">Theo dõi: {w.followUp}</p>}
                </li>
              ))}
            </ul>
          )}
          <div className="p-3 border-t" style={{ borderColor: 'var(--line)' }}>
            <SectionNote>Hệ thống không tự tạo cảnh báo. Đây là ghi nhận do người có quyền nhập và không sinh văn bản chính thức.</SectionNote>
          </div>
        </Card>

        <Card title="Ghi nhận sự việc" bodyClass="p-0">
          {s.incidents.length === 0 ? <Empty title="Chưa có ghi nhận sự việc nào" /> : (
            <ul className="divide-y" style={{ borderColor: 'var(--line)' }}>
              {s.incidents.map((i: any) => (
                <li key={i.id} className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Pill tone="neutral">{i.type}</Pill>
                    <span className="text-xs text-slate-500">{fmtDate(i.incident_date)}</span>
                  </div>
                  <p className="text-sm text-slate-200 mt-1">{i.reason}</p>
                  {i.description && <p className="text-xs text-slate-400 mt-1">{i.description}</p>}
                  {i.redacted && <p className="text-[11px] text-slate-600 mt-1 italic">Nội dung chi tiết chỉ dành cho giáo viên và quản lý.</p>}
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {reportOpen && <ProgressReportDialog student={s} onClose={() => setReportOpen(false)} onDone={() => { setReportOpen(false); onChanged(); }} />}
      {warnOpen && <WarningDialog student={s} onClose={() => setWarnOpen(false)} onDone={() => { setWarnOpen(false); onChanged(); }} />}
    </div>
  );
}

function ProgressReportDialog({ student, onClose, onDone }: { student: any; onClose: () => void; onDone: () => void }) {
  const toast = useToast();
  const active = student.enrollments.find((e: any) => e.status === 'active') ?? student.enrollments[0];
  const [form, setForm] = useState({
    periodLabel: '', reportDate: '', progressSummary: '', attitudeSummary: '', nextSteps: '', sharedSummary: '',
  });
  const [busy, setBusy] = useState(false);
  const upd = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <Modal open onClose={onClose} title={`Báo cáo tiến độ — ${student.fullName}`} width="max-w-2xl"
      footer={<>
        <button className="btn" onClick={onClose}>Huỷ</button>
        <button className="btn btn-primary" disabled={!form.periodLabel.trim() || busy} onClick={async () => {
          setBusy(true);
          try {
            await api.post('/reports/student-progress', { ...form, studentId: student.id, enrollmentId: active?.id });
            invalidate('/reports'); toast.push('ok', 'Đã lưu báo cáo tiến độ'); onDone();
          } catch (e: any) { toast.push('error', e.hint ? `${e.message} ${e.hint}` : e.message); }
          finally { setBusy(false); }
        }}>Lưu báo cáo</button>
      </>}>
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Kỳ báo cáo" required><input className="field" value={form.periodLabel} onChange={(e) => upd('periodLabel', e.target.value)} placeholder="Ví dụ: Tháng 9/2026" /></Field>
          <Field label="Ngày báo cáo"><input type="date" className="field" value={form.reportDate} onChange={(e) => upd('reportDate', e.target.value)} /></Field>
        </div>
        <Field label="Tiến độ học tập"><textarea className="field" rows={3} value={form.progressSummary} onChange={(e) => upd('progressSummary', e.target.value)} /></Field>
        <Field label="Nhận xét tổng hợp về thái độ"><textarea className="field" rows={2} value={form.attitudeSummary} onChange={(e) => upd('attitudeSummary', e.target.value)} /></Field>
        <Field label="Đề xuất bước tiếp theo"><textarea className="field" rows={2} value={form.nextSteps} onChange={(e) => upd('nextSteps', e.target.value)} /></Field>
        <Field label="Tóm tắt chia sẻ với tư vấn viên"
          hint="Chỉ phần này hiển thị cho tư vấn viên. Ba mục ở trên là nội dung nội bộ.">
          <textarea className="field" rows={3} value={form.sharedSummary} onChange={(e) => upd('sharedSummary', e.target.value)} />
        </Field>
      </div>
    </Modal>
  );
}

function WarningDialog({ student, onClose, onDone }: { student: any; onClose: () => void; onDone: () => void }) {
  const toast = useToast();
  const [form, setForm] = useState({ level: 'warning', reason: '', description: '', followUp: '', issuedDate: '' });
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const upd = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async () => {
    setBusy(true);
    try {
      await api.post(`/students/${student.id}/warning-references`, form);
      invalidate('/students'); invalidate('/dashboard');
      toast.push('ok', 'Đã ghi nhận cảnh báo');
      onDone();
    } catch (e: any) { toast.push('error', e.hint ? `${e.message} ${e.hint}` : e.message); }
    finally { setBusy(false); setConfirm(false); }
  };

  return (
    <>
      <Modal open onClose={onClose} title={`Ghi nhận cảnh báo — ${student.fullName}`}
        footer={<>
          <button className="btn" onClick={onClose}>Huỷ</button>
          <button className="btn btn-primary" disabled={!form.reason.trim()} onClick={() => setConfirm(true)}>Xem lại và xác nhận</button>
        </>}>
        <div className="space-y-3">
          <div className="card p-3 text-xs text-slate-400">
            Đây là <strong className="text-slate-200">ghi nhận để theo dõi và đối chiếu</strong>, không phải văn bản cảnh báo chính thức.
            Hệ thống không tự sinh Warning Letter.
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Mức độ">
              <select className="field" value={form.level} onChange={(e) => upd('level', e.target.value)}>
                <option value="reminder">Nhắc nhở</option>
                <option value="warning">Cảnh báo</option>
                <option value="serious">Nghiêm trọng</option>
              </select>
            </Field>
            <Field label="Ngày ghi nhận"><input type="date" className="field" value={form.issuedDate} onChange={(e) => upd('issuedDate', e.target.value)} /></Field>
          </div>
          <Field label="Lý do" required><input className="field" value={form.reason} onChange={(e) => upd('reason', e.target.value)} /></Field>
          <Field label="Mô tả chi tiết (nội bộ)"><textarea className="field" rows={3} value={form.description} onChange={(e) => upd('description', e.target.value)} /></Field>
          <Field label="Kế hoạch theo dõi"><textarea className="field" rows={2} value={form.followUp} onChange={(e) => upd('followUp', e.target.value)} /></Field>
        </div>
      </Modal>
      <ConfirmDialog open={confirm} onClose={() => setConfirm(false)} onConfirm={submit} busy={busy}
        title="Xác nhận ghi nhận cảnh báo" confirmLabel="Ghi nhận"
        body={<div className="space-y-2">
          <p>Ghi nhận cảnh báo cho <strong>{student.fullName}</strong> ({student.studentCode}).</p>
          <p className="text-xs text-slate-400">Thao tác này không dùng autosave và sẽ được ghi vào nhật ký cùng hành trình học viên.</p>
        </div>} />
    </>
  );
}
