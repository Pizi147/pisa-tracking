import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useApi } from '../lib/useApi.ts';
import { api, invalidate } from '../lib/api.ts';
import { useToast } from '../components/Toast.tsx';
import { Card, Empty, ErrorState, Pill, SectionNote, Skeleton } from '../components/ui.tsx';
import { ConfirmDialog, Modal } from '../components/Drawer.tsx';
import { CriteriaButton, DeadlinePill, RawScoreInput, useSaveScore, type Cell } from '../components/ScoreEntry.tsx';
import {
  caseStatusLabel, caseTone, fmtBand, fmtDate, fmtDateTime, mockStatusLabel,
  skillLabel, sosLabel, sosTone,
} from '../lib/format.ts';
import {
  ACADEMIC_SUPPORTS, ASSESSED_SKILL_LABEL, CASE_STATUSES, MEETING_KINDS, OPS_POLICIES,
} from '@shared/domain.ts';

type Detail = {
  id: number;
  student: { id: number; name: string; code: string; committedScore: number | null; route: string | null; examDate: string | null };
  classId: number | null; classCode: string | null; classKind: string | null; branchName: string | null;
  attemptNo: number; committedScoreAtTest: number | null; ftWeek: number | null;
  plannedDate: string; week: { code: string; range: string };
  status: string; cancelReason: string | null;
  result: any; cells: Cell[];
  history: any[]; sosCase: any; caseSteps: any[]; caseHistory: any[]; tasks: any[];
  viewer: { canSchedule: boolean; canCancel: boolean; canEditSos: boolean; canConfirm: boolean; editableSkills: string[] };
};

export default function MockDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { data, loading, error, reload } = useApi<Detail>(id ? `/mocks/${id}` : null);
  const { save } = useSaveScore(Number(id), reload);
  const [showHistory, setShowHistory] = useState(false);
  const [reschedOpen, setReschedOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);

  if (error) return <ErrorState message={error.message} hint={error.hint} onRetry={reload} />;
  if (loading || !data) return <Skeleton rows={10} />;

  const d = data;
  const raw = d.cells.filter((c) => c.skill === 'listening' || c.skill === 'reading');
  const crit = d.cells.filter((c) => c.skill !== 'listening' && c.skill !== 'reading');

  return (
    <div className="space-y-4 max-w-[1200px]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <button className="btn btn-sm btn-ghost mb-1" onClick={() => navigate(-1)}>← Quay lại</button>
          <h1 className="text-lg font-semibold text-slate-100">
            {d.student.name} <span className="text-slate-500 text-sm">· {d.student.code}</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            MT{d.attemptNo} · Lớp tại lần thi: {d.classCode ?? '—'} · {d.branchName ?? '—'}
            {d.student.route && ` · Lộ trình ${d.student.route}`}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link className="btn no-underline" to={`/hoc-vien/${d.student.id}`}>Hồ sơ học viên</Link>
          {d.classId && (
            <Link className="btn no-underline" to={`/mock-test/lop/${d.classId}`}>Nhập điểm cả lớp</Link>
          )}
          {d.viewer.canSchedule && d.status !== 'cancelled' && (
            <button className="btn" onClick={() => setReschedOpen(true)}>Dời lịch</button>
          )}
          {d.viewer.canCancel && d.status === 'planned' && (
            <button className="btn btn-danger" onClick={() => setCancelOpen(true)}>Huỷ lịch</button>
          )}
          {d.viewer.canCancel && d.status === 'cancelled' && (
            <button className="btn" onClick={async () => {
              await api.post(`/mocks/${d.id}/reopen`);
              invalidate('/mocks'); reload(); toast.push('ok', 'Đã mở lại lịch Mock');
            }}>Mở lại lịch</button>
          )}
        </div>
      </div>

      {/* 1. Nhận diện, lịch và hạn */}
      <Card title="Lịch thi và cam kết">
        <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-3 lg:grid-cols-5 m-0">
          <Info label="Trạng thái">
            <Pill tone={d.status === 'cancelled' ? 'muted' : d.status === 'completed' ? 'info' : 'neutral'}>
              {mockStatusLabel(d.status)}
            </Pill>
          </Info>
          <Info label="Tuần">{d.week.code} <span className="text-slate-500 text-xs">({d.week.range})</span></Info>
          <Info label="Ngày dự kiến">{fmtDate(d.plannedDate)}</Info>
          <Info label="Điểm cam kết tại lần thi">{fmtBand(d.committedScoreAtTest)}</Info>
          <Info label="Kỳ vọng MT này">{fmtBand(d.result.expectation)}</Info>
        </dl>
        {d.cancelReason && (
          <p className="text-xs text-red-300 mt-3">Đã huỷ: {d.cancelReason}</p>
        )}
        {d.ftWeek && (
          <SectionNote>
            Mốc gợi ý cho MT{d.attemptNo} là tuần học FT {d.ftWeek}. Tuần học FT và mã tuần lịch là hai khái niệm khác nhau.
          </SectionNote>
        )}
      </Card>

      {/* 2. Điểm từng kỹ năng */}
      <Card title="Điểm theo kỹ năng"
        action={<span className="text-xs text-slate-500">
          Đã nhập {d.result.completed}/4 kỹ năng đánh giá
        </span>}>
        {d.cells.length === 0 ? (
          <Empty title="Lớp này chưa cấu hình kỹ năng nào" />
        ) : (
          <div className="space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th className="th">Kỹ năng</th>
                    <th className="th">Ngày thi</th>
                    <th className="th">Số câu đúng / tiêu chí</th>
                    <th className="th">Band</th>
                    <th className="th">Hạn nhập</th>
                    <th className="th">Người nhập</th>
                  </tr>
                </thead>
                <tbody>
                  {[...raw, ...crit].map((c) => (
                    <tr key={c.skill}>
                      <td className="td text-slate-200 whitespace-nowrap">{skillLabel(c.skill)}</td>
                      <td className="td">
                        <TestDateInput cell={c} onSave={(p) => save(c.skill, p)} />
                      </td>
                      <td className="td">
                        {c.skill === 'listening' || c.skill === 'reading'
                          ? <RawScoreInput cell={c} onSave={(p) => save(c.skill, p)} />
                          : <CriteriaButton cell={c} onSave={(p) => save(c.skill, p)} />}
                      </td>
                      <td className="td tabular-nums text-slate-100">{fmtBand(c.band)}</td>
                      <td className="td"><DeadlinePill cell={c} /></td>
                      <td className="td text-xs text-slate-500">
                        {c.enteredByName ?? '—'}
                        {c.enteredAt && <div>{fmtDateTime(c.enteredAt)}</div>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5 border-t pt-4" style={{ borderColor: 'var(--line)' }}>
              {Object.entries(ASSESSED_SKILL_LABEL).map(([key, label]) => {
                const v = d.result.verdicts.find((x: any) => x.skill === key);
                return (
                  <div key={key} className="surface-2 rounded-lg p-3">
                    <div className="text-[11px] uppercase tracking-wide text-slate-500 font-semibold">{label}</div>
                    <div className="text-xl tabular-nums mt-1 text-slate-100">{fmtBand(v?.band)}</div>
                    <div className="mt-1">
                      {v?.passed === null
                        ? <Pill tone="muted">Chưa đủ điểm</Pill>
                        : v?.passed ? <Pill tone="ok">Đạt kỳ vọng</Pill> : <Pill tone="danger">Dưới kỳ vọng</Pill>}
                    </div>
                  </div>
                );
              })}
              <div className="surface-2 rounded-lg p-3 border border-teal-500/25">
                <div className="text-[11px] uppercase tracking-wide text-slate-500 font-semibold">Overall</div>
                <div className="text-xl tabular-nums mt-1 text-slate-100">{fmtBand(d.result.overall)}</div>
                <div className="mt-1"><Pill tone={sosTone(d.result.sosLevel)}>{sosLabel(d.result.sosLevel)}</Pill></div>
              </div>
            </div>

            {!d.result.complete && (
              <SectionNote>
                Chưa chốt kết quả vì còn thiếu kỹ năng. Học sinh có thể thi Speaking một tuần và ba kỹ năng còn lại
                tuần sau — mỗi kỹ năng có ngày thi và hạn nhập riêng. Ô trống là chưa nhập, không phải điểm 0.
              </SectionNote>
            )}
          </div>
        )}
      </Card>

      {/* 3–4. SOS và ghi nhận xử lý */}
      {d.result.complete && (d.result.sosLevel ?? 0) > 0 && (
        <CaseSection detail={d} onSaved={reload} />
      )}
      {d.result.complete && d.result.sosLevel === 0 && (
        <Card title="Kết quả"><Empty title="Đạt kỳ vọng ở cả bốn kỹ năng" hint="Không phát sinh case cần xử lý." /></Card>
      )}

      {/* 5. Lịch sử */}
      <Card title="Lịch sử thay đổi"
        action={<button className="btn btn-sm" onClick={() => setShowHistory((s) => !s)}>{showHistory ? 'Thu gọn' : 'Mở'}</button>}>
        {!showHistory ? (
          <SectionNote>{d.history.length} thay đổi lịch · {d.caseHistory.length} thay đổi xử lý.</SectionNote>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <div className="label">Lịch thi</div>
              <ul className="space-y-1.5 text-xs list-none p-0 m-0">
                {d.history.map((h) => (
                  <li key={h.id} className="text-slate-400">
                    <span className="text-slate-200">{actionLabel(h.action)}</span>
                    {h.oldDate && <> {fmtDate(h.oldDate)} →</>} {h.newDate && fmtDate(h.newDate)}
                    {h.reason && <> · {h.reason}</>}
                    <span className="text-slate-600"> · {h.actorName ?? '—'}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <div className="label">Xử lý sau Mock</div>
              {d.caseHistory.length === 0 ? <p className="text-xs text-slate-500">Chưa có thay đổi nào.</p> : (
                <ul className="space-y-1.5 text-xs list-none p-0 m-0">
                  {d.caseHistory.map((h) => (
                    <li key={h.id} className="text-slate-400">
                      <span className="text-slate-200">{fieldLabel(h.field)}</span>: {h.oldValue ?? '—'} → {h.newValue ?? '—'}
                      <span className="text-slate-600"> · {h.actorName ?? '—'}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </Card>

      <RescheduleModal open={reschedOpen} onClose={() => setReschedOpen(false)} attemptId={d.id}
        current={d.plannedDate} onDone={reload} />
      <CancelDialog open={cancelOpen} onClose={() => setCancelOpen(false)} attemptId={d.id} onDone={reload} />
    </div>
  );
}

function Info({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-[11px] uppercase tracking-wide text-slate-500 font-semibold">{label}</dt>
      <dd className="text-sm text-slate-100 mt-1 m-0">{children}</dd>
    </div>
  );
}

function TestDateInput({ cell, onSave }: { cell: Cell; onSave: (p: any) => Promise<boolean> }) {
  const [value, setValue] = useState(cell.testDate ?? '');
  if (!cell.canEdit) return <span className="text-slate-400 text-sm">{fmtDate(cell.testDate)}</span>;
  return (
    <input
      type="date"
      className="field w-36"
      value={value}
      aria-label={`Ngày thi ${skillLabel(cell.skill)}`}
      onChange={(e) => setValue(e.target.value)}
      onBlur={() => { if (value !== (cell.testDate ?? '')) void onSave({ testDate: value || null }); }}
    />
  );
}

// ---------------------------------------------------------------- SOS

const STEP_TONE: Record<string, any> = { done: 'ok', scheduled: 'info', named_only: 'warn', empty: 'muted' };
const STEP_STATE: Record<string, string> = {
  done: 'Đã thực hiện', scheduled: 'Đã xếp lịch', named_only: 'Có tên, chưa có ngày', empty: 'Chưa ghi nhận',
};

function CaseSection({ detail, onSaved }: { detail: Detail; onSaved: () => void }) {
  const toast = useToast();
  const c = detail.sosCase;
  const [busy, setBusy] = useState(false);
  const [draft, setDraft] = useState<Record<string, any>>({});
  const editable = detail.viewer.canEditSos;

  const value = (k: string) => (k in draft ? draft[k] : c?.[k] ?? '');
  const set = (k: string, v: any) => setDraft((d) => ({ ...d, [k]: v }));
  const dirty = Object.keys(draft).length > 0;

  const submit = async () => {
    if (!c || busy) return;
    setBusy(true);
    try {
      await api.patch(`/sos-cases/${c.id}`, draft);
      setDraft({});
      invalidate('/mocks'); invalidate('/overview');
      onSaved();
      toast.push('ok', 'Đã lưu ghi nhận xử lý');
    } catch (e: any) {
      toast.push('error', e.message);      // giữ nguyên bản nháp để thử lại
    } finally {
      setBusy(false);
    }
  };

  if (!c) return null;

  return (
    <Card
      title={<span className="flex items-center gap-2">
        Xử lý sau Mock <Pill tone={sosTone(detail.result.sosLevel)}>{sosLabel(detail.result.sosLevel)}</Pill>
        <Pill tone={caseTone(c.status)}>{caseStatusLabel(c.status)}</Pill>
      </span>}
      action={dirty && <button className="btn btn-primary btn-sm" onClick={submit} disabled={busy}>
        {busy ? 'Đang lưu…' : 'Lưu ghi nhận'}
      </button>}
    >
      <div className="space-y-4">
        <div className="grid gap-2">
          {detail.caseSteps.map((s: any) => (
            <div key={s.key} className="surface-2 rounded-lg p-3">
              <div className="flex flex-wrap items-center gap-2">
                <strong className="text-sm text-slate-100">{s.label}</strong>
                {!s.required && <Pill tone="neutral">Theo từng case</Pill>}
                <Pill tone={STEP_TONE[s.state]}>{STEP_STATE[s.state]}</Pill>
              </div>
              <p className="text-xs text-slate-400 mt-1 mb-2">{s.detail}</p>
              <StepFields stepKey={s.key} value={value} set={set} editable={editable} />
            </div>
          ))}
        </div>

        <div className="grid gap-3 sm:grid-cols-3 border-t pt-4" style={{ borderColor: 'var(--line)' }}>
          <label className="block">
            <span className="label">Trạng thái xử lý</span>
            <select className="field" value={value('status')} disabled={!editable}
              onChange={(e) => set('status', e.target.value)}>
              {CASE_STATUSES.map((s) => <option key={s} value={s}>{caseStatusLabel(s)}</option>)}
            </select>
          </label>
          <label className="block sm:col-span-2">
            <span className="label">Ghi chú</span>
            <input className="field" value={value('note') ?? ''} disabled={!editable}
              onChange={(e) => set('note', e.target.value)} placeholder="Thông tin cụ thể để người sau đọc hiểu" />
          </label>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4" style={{ borderColor: 'var(--line)' }}>
          <div className="text-sm">
            <span className="text-slate-400">Head xác nhận: </span>
            {c.head_confirmed_at
              ? <span className="text-teal-300">{c.head_name ?? 'Đã xác nhận'} · {fmtDate(c.head_confirmed_at)}</span>
              : <span className="text-slate-500">Chưa xác nhận</span>}
          </div>
          {detail.viewer.canConfirm && (
            <button className="btn btn-sm" disabled={busy} onClick={async () => {
              setBusy(true);
              try {
                await api.post(`/sos-cases/${c.id}/confirm`, { confirmed: !c.head_confirmed_at });
                onSaved();
                toast.push('ok', c.head_confirmed_at ? 'Đã bỏ xác nhận' : 'Đã xác nhận');
              } catch (e: any) { toast.push('error', e.message); } finally { setBusy(false); }
            }}>
              {c.head_confirmed_at ? 'Bỏ xác nhận' : 'Xác nhận (Head)'}
            </button>
          )}
        </div>

        {detail.tasks.length > 0 && (
          <div className="border-t pt-3" style={{ borderColor: 'var(--line)' }}>
            <div className="label">Công việc gắn với case này</div>
            <ul className="text-xs space-y-1 list-none p-0 m-0">
              {detail.tasks.map((t) => (
                <li key={t.id} className="text-slate-300">
                  <Link className="link" to="/hop-tuan">{t.code}</Link> · {t.title}
                  <span className="text-slate-500"> · {t.assignee_name ?? 'Chưa giao'} · hạn {fmtDate(t.due_date)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <SectionNote>
          Đây là checklist cần phối hợp. Hệ thống không tự cấp buổi học, không tự lùi lịch thi, không tự đóng case
          và không tự xác nhận Head. Trao đổi phụ huynh do CS thực hiện ngoài hệ thống — ghi lại tên người làm và ngày.
        </SectionNote>
      </div>
    </Card>
  );
}

function StepFields({ stepKey, value, set, editable }: {
  stepKey: string; value: (k: string) => any; set: (k: string, v: any) => void; editable: boolean;
}) {
  const pair = (personKey: string, dateKey: string, personLabel: string, options?: readonly string[]) => (
    <div className="grid gap-2 sm:grid-cols-2">
      <label className="block">
        <span className="label">{personLabel}</span>
        {options ? (
          <select className="field" value={value(personKey) ?? ''} disabled={!editable} onChange={(e) => set(personKey, e.target.value)}>
            <option value="">Chưa chọn</option>
            {options.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
        ) : (
          <input className="field" value={value(personKey) ?? ''} disabled={!editable}
            onChange={(e) => set(personKey, e.target.value)} placeholder="Tên người thực hiện" />
        )}
      </label>
      <label className="block">
        <span className="label">Ngày</span>
        <input type="date" className="field" value={(value(dateKey) ?? '').slice(0, 10)} disabled={!editable}
          onChange={(e) => set(dateKey, e.target.value)} />
      </label>
    </div>
  );

  if (stepKey === 'talk_student') return pair('talk_student_person', 'talk_student_date', 'Người trao đổi');
  if (stepKey === 'talk_parent') return pair('talk_parent_person', 'talk_parent_date', 'Người trao đổi (CS)');
  if (stepKey === 'academic') {
    return (
      <div className="grid gap-2 sm:grid-cols-3">
        <label className="block">
          <span className="label">Hình thức hỗ trợ</span>
          <select className="field" value={value('academic_support') ?? ''} disabled={!editable}
            onChange={(e) => set('academic_support', e.target.value)}>
            <option value="">Chưa chọn</option>
            {ACADEMIC_SUPPORTS.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
        </label>
        <label className="block">
          <span className="label">Người phụ trách</span>
          <input className="field" value={value('academic_person') ?? ''} disabled={!editable}
            onChange={(e) => set('academic_person', e.target.value)} />
        </label>
        <label className="block">
          <span className="label">Ngày bắt đầu</span>
          <input type="date" className="field" value={(value('academic_start_date') ?? '').slice(0, 10)} disabled={!editable}
            onChange={(e) => set('academic_start_date', e.target.value)} />
        </label>
      </div>
    );
  }
  if (stepKey === 'ops') return pair('ops_policy', 'ops_date', 'Chính sách áp dụng', OPS_POLICIES);
  if (stepKey === 'meeting') return pair('meeting_kind', 'meeting_date', 'Hình thức meeting', MEETING_KINDS);
  return null;
}

// ---------------------------------------------------------------- thao tác lịch

function RescheduleModal({ open, onClose, attemptId, current, onDone }: {
  open: boolean; onClose: () => void; attemptId: number; current: string; onDone: () => void;
}) {
  const toast = useToast();
  const [date, setDate] = useState(current);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);

  return (
    <Modal open={open} onClose={onClose} title="Dời lịch Mock" width="max-w-md"
      footer={<>
        <button className="btn" onClick={onClose} disabled={busy}>Huỷ</button>
        <button className="btn btn-primary" disabled={busy || !date} onClick={async () => {
          setBusy(true);
          try {
            await api.post(`/mocks/${attemptId}/reschedule`, { plannedDate: date, reason });
            invalidate('/mocks'); invalidate('/overview');
            onDone(); onClose(); toast.push('ok', 'Đã dời lịch');
          } catch (e: any) { toast.push('error', e.message); } finally { setBusy(false); }
        }}>{busy ? 'Đang lưu…' : 'Lưu'}</button>
      </>}>
      <div className="space-y-3">
        <label className="block">
          <span className="label">Ngày mới</span>
          <input type="date" className="field" value={date} onChange={(e) => setDate(e.target.value)} />
        </label>
        <label className="block">
          <span className="label">Lý do</span>
          <input className="field" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Ví dụ: trùng lịch phòng thi" />
        </label>
        <SectionNote>Dời lịch cập nhật chính lần Mock này. Không tạo lượt mới và không tăng số MT.</SectionNote>
      </div>
    </Modal>
  );
}

function CancelDialog({ open, onClose, attemptId, onDone }: {
  open: boolean; onClose: () => void; attemptId: number; onDone: () => void;
}) {
  const toast = useToast();
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  return (
    <ConfirmDialog
      open={open} onClose={onClose} danger busy={busy} title="Huỷ lịch Mock" confirmLabel="Huỷ lịch"
      body={
        <div className="space-y-2">
          <p>Huỷ vẫn giữ nguyên lịch sử. Lượt đã huỷ không tính vào “đã thi” hay “thiếu điểm”.</p>
          <input className="field" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Lý do huỷ (bắt buộc)" />
        </div>
      }
      onConfirm={async () => {
        setBusy(true);
        try {
          await api.post(`/mocks/${attemptId}/cancel`, { reason });
          invalidate('/mocks'); invalidate('/overview');
          onDone(); onClose(); toast.push('ok', 'Đã huỷ lịch');
        } catch (e: any) { toast.push('error', e.message); } finally { setBusy(false); }
      }}
    />
  );
}

const actionLabel = (a: string) =>
  ({ created: 'Tạo lịch', rescheduled: 'Dời lịch', cancelled: 'Huỷ lịch', reopened: 'Mở lại' }[a] ?? a);

const fieldLabel = (f: string) =>
  ({
    sos_level: 'Mức SOS', status: 'Trạng thái', talk_student_person: 'Người trao đổi HS',
    talk_student_date: 'Ngày trao đổi HS', talk_parent_person: 'Người trao đổi PH',
    talk_parent_date: 'Ngày trao đổi PH', academic_support: 'Hỗ trợ học thuật',
    academic_person: 'Người phụ trách học thuật', academic_start_date: 'Ngày bắt đầu hỗ trợ',
    ops_policy: 'Chính sách vận hành', ops_date: 'Ngày áp dụng', meeting_kind: 'Meeting',
    meeting_date: 'Ngày meeting', head_confirmed: 'Head xác nhận', note: 'Ghi chú',
  }[f] ?? f);
