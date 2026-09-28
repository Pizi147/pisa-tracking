import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useApi } from '../../lib/useApi.ts';
import { api, invalidate } from '../../lib/api.ts';
import { useToast } from '../../ui/Toast.tsx';
import { Modal } from '../../ui/Drawer.tsx';
import { ONgay } from '../../ui/ONgay.tsx';
import { Card, Empty, Field, SectionNote, Skeleton, Task } from '../../ui/ui.tsx';
import { fmtDate } from '../../lib/format.ts';
import {
  ENTRY_SKILLS, ENTRY_SKILL_LABEL,
} from '@shared/domain/index.ts';

/**
 * VIỆC QUẢN LÝ GIAO — hai loại khác hẳn nhau, nên hai lối tạo khác nhau.
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
  studentCount?: number;
};

export function ManagerTasks({ periodId }: { periodId: number | null }) {
  const [open, setOpen] = useState(false);
  const list = useApi<{ rows: TaskRow[] }>(periodId ? `/tasks?periodId=${periodId}` : null, [periodId, open]);

  return (
    <>
      <button className="btn btn-primary" onClick={() => setOpen(true)}>+ Giao việc</button>
      <TaskDialog open={open} onClose={() => setOpen(false)} periodId={periodId}
        onDone={() => { list.reload(); invalidate('/tasks'); }} />
      {list.data && list.data.rows.length > 0 && (
        <div className="hidden" aria-hidden>{list.data.rows.length}</div>
      )}
    </>
  );
}

/** Danh sách việc của tuần đang xem, tách khỏi nút tạo để đặt được ở chỗ khác trên trang. */
export function ManagerTaskList({ periodId }: { periodId: number | null }) {
  const { data, loading } = useApi<{ rows: TaskRow[] }>(
    periodId ? `/tasks?periodId=${periodId}` : null, [periodId],
  );
  if (loading) return <Card title="Việc đã giao"><Skeleton rows={3} /></Card>;
  const rows = data?.rows ?? [];
  return (
    <Card title={`Việc đã giao (${rows.length})`} bodyClass="p-0">
      {rows.length === 0 ? (
        <div className="p-4">
          <Empty title="Chưa giao việc nào trong tuần này"
            hint="Việc chi nhánh là chuyện giáo trình và vận hành. Việc giao giáo viên gắn với lớp và kỹ năng, và hiện luôn trong hồ sơ từng em." />
        </div>
      ) : (
        <ul className="divide-y list-none p-0 m-0" style={{ borderColor: 'var(--line)' }}>
          {rows.map((t) => (
            <li key={t.id} className="px-4 py-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm text-slate-100">{t.title}</span>
                {t.kind === 'teacher_task' && t.topicLabel && <Task>{t.topicLabel}</Task>}
                {t.className && <span className="text-[11px] text-slate-500">{t.className}</span>}
              </div>
              <p className="text-xs text-slate-500 mt-0.5 mb-0">
                {t.code}
                {t.assigneeName && ` · ${t.assigneeName}`}
                {t.dueDate && ` · hạn ${fmtDate(t.dueDate)}`}
                {t.studentCount ? ` · ${t.studentCount} em` : ''}
              </p>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

function TaskDialog({ open, onClose, periodId, onDone }: {
  open: boolean; onClose: () => void; periodId: number | null; onDone: () => void;
}) {
  const toast = useToast();
  const [kind, setKind] = useState<'branch_ops' | 'teacher_task'>('branch_ops');
  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [classId, setClassId] = useState('');
  const [topic, setTopic] = useState('');
  const [busy, setBusy] = useState(false);
  const classes = useApi<{ rows: { id: number; code: string; studentCount: number }[] }>(
    open ? '/classes' : null, [open],
  );

  const topics: readonly string[] = ENTRY_SKILLS;
  const topicLabel = (k: string) => ENTRY_SKILL_LABEL[k as keyof typeof ENTRY_SKILL_LABEL] ?? k;
  const cls = classes.data?.rows.find((c) => String(c.id) === classId);

  const submit = async () => {
    if (!title.trim()) { toast.push('error', 'Cần nội dung công việc.'); return; }
    if (kind === 'teacher_task' && (!classId || !topic)) {
      toast.push('error', 'Việc giao giáo viên phải chọn lớp và kỹ năng.'); return;
    }
    setBusy(true);
    try {
      await api.post('/tasks', {
        kind, title, note: note.trim() || undefined, periodId: periodId ?? undefined,
        dueDate: dueDate || undefined,
        classId: kind === 'teacher_task' ? Number(classId) : undefined,
        topic: kind === 'teacher_task' ? topic : undefined,
      });
      invalidate('/tasks'); invalidate('/cases'); invalidate('/students'); invalidate('/my-work');
      toast.push('ok', kind === 'teacher_task'
        ? `Đã giao việc cho ${cls?.studentCount ?? 0} em` : 'Đã tạo việc');
      onDone(); onClose();
      setTitle(''); setNote(''); setDueDate(''); setClassId(''); setTopic('');
    } catch (e: any) { toast.push('error', e.message); } finally { setBusy(false); }
  };

  return (
    <Modal open={open} onClose={onClose} title="Giao việc"
      footer={
        <>
          <button className="btn" onClick={onClose}>Huỷ</button>
          <button className="btn btn-primary" disabled={busy} onClick={submit}>Giao</button>
        </>
      }>
      <div className="space-y-3">
        <Field label="Loại việc">
          <div className="flex gap-1 flex-wrap">
            <button type="button" className={`btn btn-sm ${kind === 'branch_ops' ? 'btn-primary' : ''}`}
              onClick={() => setKind('branch_ops')}>Việc chi nhánh</button>
            <button type="button" className={`btn btn-sm ${kind === 'teacher_task' ? 'btn-primary' : ''}`}
              onClick={() => setKind('teacher_task')}>Giao giáo viên</button>
          </div>
        </Field>

        <Field label="Nội dung" required>
          <input className="field" value={title} onChange={(e) => setTitle(e.target.value)}
            placeholder={kind === 'branch_ops'
              ? 'Rà lại giáo trình Unit 5, phần bài luyện quá ít'
              : 'Tăng 15 phút luyện nghe chi tiết mỗi buổi'} />
        </Field>

        {kind === 'teacher_task' && (
          <>
            <Field label="Lớp" required>
              <select className="field" value={classId} onChange={(e) => setClassId(e.target.value)}>
                <option value="">Chọn lớp</option>
                {(classes.data?.rows ?? []).map((c) => (
                  <option key={c.id} value={c.id}>{c.code} · {c.studentCount} em</option>
                ))}
              </select>
            </Field>
            <Field label="Kỹ năng nào" required>
              <div className="flex gap-1 flex-wrap">
                {topics.map((k) => (
                  <button key={k} type="button" className={`btn btn-sm ${topic === k ? 'btn-primary' : ''}`}
                    onClick={() => setTopic(k)}>{topicLabel(k)}</button>
                ))}
              </div>
            </Field>
            <SectionNote>
              Việc này sẽ hiện trong hồ sơ của <strong>{cls ? `${cls.studentCount} em lớp ${cls.code}` : 'từng em trong lớp'}</strong>,
              ở đúng ô kỹ năng đã chọn — nhưng vẫn là <strong>một việc</strong>, cập nhật một lần.
              Em nào chưa có vấn đề ở kỹ năng đó thì hệ thống mở một vấn đề mới, ghi rõ là
              mở theo yêu cầu Quản lý, và đưa thẳng vào <em>đang xử lý</em> — nó đã có phương án rồi,
              chính là việc này.
            </SectionNote>
          </>
        )}

        <Field label="Hạn">
          <ONgay kieu="ngay" value={dueDate} onChange={setDueDate} />
        </Field>
        <Field label="Ghi chú">
          <input className="field" value={note} onChange={(e) => setNote(e.target.value)} />
        </Field>
      </div>
    </Modal>
  );
}

export { Link };
