import { useEffect, useMemo, useState } from 'react';
import { api, invalidate } from '../../lib/api.ts';
import { useApi } from '../../lib/useApi.ts';
import { useToast } from '../../ui/Toast.tsx';
import { Modal } from '../../ui/Drawer.tsx';
import { Field } from '../../ui/ui.tsx';
import {
  VIOLATION_CATEGORIES, VIOLATION_CATEGORY_LABEL, VIOLATION_DESCRIPTION_MIN, VIOLATION_OTHER_DESCRIPTION_MIN,
  VIOLATION_SKILLS, VIOLATION_SKILL_LABEL, type ViolationCategory,
} from '@shared/domain/index.ts';
import { fmtDate } from '../../lib/format.ts';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';

/**
 * PANEL `GHI VI PHẠM` (Y_THUC §7.2, giữ nguyên theo plan.md K1/§7.4) — GVBM/GVCN/QL ghi một sự việc, 15 giây.
 *
 * Cũng dùng để SỬA vi phạm (V09): truyền `violation` thì form nạp sẵn bốn trường sửa được và gọi PATCH thay vì POST.
 * Không hỏi mức độ, không hỏi hạn, không hỏi ai xử lý, không hỏi biện pháp (V08) — ghi vi phạm không sinh gì khác.
 */
export function RecordViolationPanel({
  open, onClose, studentId, studentName, onDone, students, onPickStudent, violation,
}: {
  open: boolean; onClose: () => void;
  studentId: number; studentName?: string;
  onDone?: () => void;
  /** Mở từ trang lớp: chọn học viên ngay ở đầu form (như QuickReport). */
  students?: { id: number; name: string; code?: string | null }[];
  onPickStudent?: (id: number) => void;
  /** Có giá trị = đang SỬA vi phạm này, không phải ghi mới. */
  violation?: {
    id: number; category: string; skill: string | null; occurredOn: string; description: string;
  } | null;
}) {
  const toast = useToast();
  const { homNay: today } = useNgayNghiepVu();
  const editing = !!violation;
  const [category, setCategory] = useState<string>('homework');
  const [skill, setSkill] = useState<string>('');
  const [occurredOn, setOccurredOn] = useState(today);
  const [description, setDescription] = useState('');
  const [busy, setBusy] = useState(false);

  const idempotencyKey = useMemo(
    () => `violation:${studentId}:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`,
    [studentId, open],
  );

  useEffect(() => {
    if (!open) return;
    if (violation) {
      setCategory(violation.category); setSkill(violation.skill ?? ''); setOccurredOn(violation.occurredOn);
      setDescription(violation.description);
    } else {
      setCategory('homework'); setSkill(''); setOccurredOn(today); setDescription('');
    }
  }, [open, violation?.id]);

  /* V06 — cảnh báo trùng mềm: cùng học viên, cùng nhóm, cùng ngày. Hỏi lại mỗi khi một trong ba đổi. */
  const similarQ = studentId && category && !editing
    ? `/violations/similar?studentId=${studentId}&category=${category}${occurredOn ? `&occurredOn=${occurredOn}` : ''}`
    : null;
  const similar = useApi<{ rows: any[] }>(similarQ, [studentId, category, occurredOn, editing]);
  const [forceNew, setForceNew] = useState(false);
  useEffect(() => { setForceNew(false); }, [category, occurredOn, studentId]);
  const dup = !editing && !forceNew ? (similar.data?.rows ?? [])[0] : null;

  const minLen = category === 'other' ? VIOLATION_OTHER_DESCRIPTION_MIN : VIOLATION_DESCRIPTION_MIN;
  /* K2-3: ràng buộc nói TRƯỚC khi bấm — nút mờ + câu thiếu gì, không báo lỗi đỏ sau khi bấm. */
  const missing = !studentId ? 'Hãy chọn học viên.'
    : description.trim().length < minLen ? `Mô tả cần ít nhất ${minLen} ký tự — nói rõ em đã làm gì, ở buổi nào.`
    : null;

  const submit = async () => {
    if (missing) return;
    setBusy(true);
    try {
      if (editing && violation) {
        await api.patch(`/violations/${violation.id}`, {
          category, skill: skill || null, occurredOn: occurredOn || undefined, description,
        });
        toast.push('ok', 'Đã lưu vi phạm');
      } else {
        await api.post('/violations', {
          studentId, category, skill: skill || null, occurredOn: occurredOn || undefined, description, idempotencyKey,
        });
        toast.push('ok', `Đã ghi vi phạm cho ${studentName ?? 'học viên'}`);
      }
      invalidate('/violations'); invalidate('/classes'); invalidate('/students'); invalidate('/y-thuc');
      onDone?.(); onClose();
    } catch (e: any) { toast.push('error', e.message); } finally { setBusy(false); }
  };

  return (
    <Modal open={open} onClose={onClose}
      title={editing ? 'Sửa vi phạm' : `Ghi vi phạm${studentName ? ` · ${studentName}` : ''}`}
      footer={
        <>
          <button className="btn" onClick={onClose}>Huỷ</button>
          <button className="btn btn-primary" disabled={busy || !!missing} title={missing ?? undefined} onClick={submit}>
            {editing ? 'Lưu' : 'Ghi vi phạm'}
          </button>
        </>
      }>
      <div className="space-y-3">
        {students && !editing && (
          <Field label="Học viên" required>
            <select className="field" value={studentId || ''}
              onChange={(e) => onPickStudent?.(Number(e.target.value) || 0)}>
              <option value="">Chọn học viên…</option>
              {students.map((st) => (
                <option key={st.id} value={st.id}>{st.name}{st.code ? ` · ${st.code}` : ''}</option>
              ))}
            </select>
          </Field>
        )}

        <Field label="Ngày xảy ra" required hint="Mặc định hôm nay. Chọn được ngày quá khứ, không chọn được ngày tương lai.">
          <input type="date" className="field" value={occurredOn}
            max={today}
            onChange={(e) => setOccurredOn(e.target.value)} />
        </Field>

        <Field label="Nhóm vi phạm" required>
          <div className="flex gap-1 flex-wrap">
            {VIOLATION_CATEGORIES.map((c) => (
              <button key={c} type="button" className={`btn btn-sm ${category === c ? 'btn-primary' : ''}`}
                onClick={() => setCategory(c)}>
                {VIOLATION_CATEGORY_LABEL[c as ViolationCategory]}
              </button>
            ))}
          </div>
        </Field>

        <Field label="Môn" hint="Tự điền theo môn bạn dạy lớp này; để trống được.">
          <select className="field" value={skill} onChange={(e) => setSkill(e.target.value)}>
            <option value="">— để trống —</option>
            {VIOLATION_SKILLS.map((s) => (
              <option key={s} value={s}>{VIOLATION_SKILL_LABEL[s] ?? s}</option>
            ))}
          </select>
        </Field>

        <Field label="Mô tả" required
          hint={category === 'other'
            ? `Chọn nhóm "Khác" thì mô tả phải từ ${VIOLATION_OTHER_DESCRIPTION_MIN} ký tự để nói rõ đó là việc gì.`
            : `Ít nhất ${VIOLATION_DESCRIPTION_MIN} ký tự.`}>
          <textarea className="field" rows={3} value={description} autoFocus
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Không nộp bài Writing Task 2 buổi 21/09" />
        </Field>

        {dup && (
          <div className="rounded-lg border p-3" style={{ borderColor: 'var(--warn)', background: 'rgba(240, 201, 135, 0.08)' }}>
            <p className="text-sm text-slate-100 m-0">
              Ngày {fmtDate(dup.occurredOn)} em này đã có 1 vi phạm nhóm {dup.categoryLabel} do {dup.reportedByName ?? 'một giáo viên'} ghi.
            </p>
            <div className="flex flex-wrap gap-2 mt-2">
              <button className="btn btn-sm" onClick={() => setForceNew(true)}>Vẫn ghi vi phạm mới</button>
            </div>
          </div>
        )}

        {missing && <p className="text-xs text-amber-200/90 m-0">{missing}</p>}
      </div>
    </Modal>
  );
}
