import { useEffect, useRef, useState } from 'react';
import { api, invalidate } from '../../lib/api.ts';
import { useToast } from '../../ui/Toast.tsx';
import { Modal } from '../../ui/Drawer.tsx';
import { Alert, Info, SectionNote, Status } from '../../ui/ui.tsx';
import { fmtBand, fmtDate, skillLabel } from '../../lib/format.ts';
import { CRITERIA, CRITERIA_SHORT, criteriaSetFor, type EntrySkill } from '@shared/domain/index.ts';

export type Cell = {
  skill: EntrySkill;
  assessedSkill: string;
  /** false khi Quản lý đã chốt trước là đợt này không yêu cầu kỹ năng đó. */
  required: boolean;
  rawScore: number | null;
  criteria: (number | null)[];
  band: number | null;
  resultDate: string | null;
  enteredByName: string | null;
  enteredAt: string | null;
  /** Hạn chấm CỦA CHÍNH MÔN NÀY, tính từ tuần thi của nó — không phải hạn của cả đợt. */
  deadline: string | null;
  deadlineSource: 'skill_override' | 'attempt_override' | 'default' | 'none';
  overdue: boolean;
  progress: string;
  canEdit: boolean;
  /** Tuần thi riêng của môn này. W1 và W2 dùng chung lịch của môn Writing. */
  periodId?: number | null;
  periodCode?: string | null;
  weekStart?: string | null;
  weekRange?: string | null;
  sitStatus?: string;
};

export type SavePatch = {
  rawScore?: number | null;
  criteria?: (number | null)[]; resultDate?: string | null;
};

/**
 * Lưu điểm một kỹ năng. Khi lỗi, giữ nguyên giá trị người dùng vừa gõ để họ bấm lại,
 * không âm thầm quay về giá trị cũ.
 */
export function useSaveScore(attemptId: number, onSaved?: () => void) {
  const toast = useToast();
  const [saving, setSaving] = useState<string | null>(null);
  const inflight = useRef(new Set<string>());

  const save = async (skill: string, patch: SavePatch): Promise<boolean> => {
    if (inflight.current.has(skill)) return false;   // chặn gửi lặp cùng một ô
    inflight.current.add(skill);
    setSaving(skill);
    try {
      await api.put(`/attempts/${attemptId}/scores/${skill}`, patch);
      invalidate('/attempts');
      invalidate('/overview');
      invalidate('/classes');
      invalidate('/students');
      onSaved?.();
      return true;
    } catch (e: any) {
      toast.push('error', `${skillLabel(skill)}: ${e.message}`);
      return false;
    } finally {
      inflight.current.delete(skill);
      setSaving(null);
    }
  };

  return { save, saving };
}

/** Ô nhập số câu đúng 0–40. Trống KHÁC 0: xoá ô là xoá điểm, không phải chấm 0. */
export function RawScoreInput({ cell, onSave, inputRef, onKeyDown }: {
  cell: Cell;
  onSave: (patch: SavePatch) => Promise<boolean>;
  inputRef?: (el: HTMLInputElement | null) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}) {
  const [draft, setDraft] = useState(cell.rawScore === null ? '' : String(cell.rawScore));
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!dirty) setDraft(cell.rawScore === null ? '' : String(cell.rawScore));
  }, [cell.rawScore, dirty]);

  const commit = async () => {
    if (!dirty || busy) return;
    setBusy(true);
    const value = draft.trim() === '' ? null : Number(draft);
    const ok = await onSave({ rawScore: value });
    setBusy(false);
    if (ok) setDirty(false);       // lỗi thì giữ nguyên bản nháp để người dùng sửa và thử lại
  };

  if (!cell.canEdit) {
    return (
      <span className="tabular-nums text-slate-300" title="Bạn không được phân công kỹ năng này">
        {cell.rawScore === null ? '—' : cell.rawScore}
        <span className="text-slate-500 text-[11px] ml-1">({fmtBand(cell.band)})</span>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5">
      <input
        ref={inputRef}
        className={`field w-16 text-center tabular-nums ${dirty ? 'border-amber-500/60' : ''}`}
        inputMode="numeric"
        value={draft}
        disabled={busy}
        aria-label={`${skillLabel(cell.skill)} — số câu đúng`}
        onChange={(e) => { setDraft(e.target.value); setDirty(true); }}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') { void commit(); }
          onKeyDown?.(e);
        }}
      />
      <span className="tabular-nums text-slate-400 text-xs w-8">{fmtBand(cell.band)}</span>
    </span>
  );
}

/** Bốn tiêu chí mở trong khung riêng — bảng mặc định không bày 16 cột tiêu chí. */
export function CriteriaButton({ cell, onSave }: { cell: Cell; onSave: (patch: SavePatch) => Promise<boolean> }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        className={`btn btn-sm tabular-nums ${cell.canEdit ? '' : 'opacity-70 cursor-default'}`}
        onClick={() => cell.canEdit && setOpen(true)}
        title={cell.canEdit ? 'Mở bốn tiêu chí' : 'Bạn không được phân công kỹ năng này'}
      >
        {fmtBand(cell.band)}
        {cell.canEdit && <span className="text-slate-500 text-[10px]">sửa</span>}
      </button>
      {open && <CriteriaModal cell={cell} onSave={onSave} onClose={() => setOpen(false)} />}
    </>
  );
}

export function CriteriaModal({ cell, onSave, onClose }: {
  cell: Cell; onSave: (patch: SavePatch) => Promise<boolean>; onClose: () => void;
}) {
  const set = criteriaSetFor(cell.skill) ?? 'writing';
  const [vals, setVals] = useState<string[]>(cell.criteria.map((v) => (v === null ? '' : String(v))));
  const [busy, setBusy] = useState(false);

  const nums = vals.map((v) => (v.trim() === '' ? null : Number(v)));
  const filled = nums.filter((v) => v !== null) as number[];
  const preview = filled.length === 4 ? Math.round((filled.reduce((a, b) => a + b, 0) / 4) * 2 + 1e-9) / 2 : null;

  const submit = async () => {
    setBusy(true);
    const ok = await onSave({ criteria: nums });
    setBusy(false);
    if (ok) onClose();
  };

  return (
    <Modal open onClose={onClose} title={`${skillLabel(cell.skill)} — bốn tiêu chí`} width="max-w-md"
      footer={<>
        <button className="btn" onClick={onClose} disabled={busy}>Đóng</button>
        <button className="btn btn-primary" onClick={submit} disabled={busy}>{busy ? 'Đang lưu…' : 'Lưu'}</button>
      </>}>
      <div className="space-y-3">
        {CRITERIA[set].map((label, i) => (
          <label key={i} className="flex items-center gap-3">
            <span className="w-8 text-xs text-slate-500 shrink-0">{CRITERIA_SHORT[set][i]}</span>
            <span className="flex-1 text-sm text-slate-300">{label}</span>
            <input
              className="field w-20 text-center tabular-nums"
              inputMode="decimal"
              value={vals[i] ?? ''}
              onChange={(e) => setVals((v) => v.map((x, j) => (j === i ? e.target.value : x)))}
            />
          </label>
        ))}
        <div className="flex items-center justify-between border-t pt-3" style={{ borderColor: 'var(--line)' }}>
          <span className="text-sm text-slate-400">Band kỹ năng</span>
          <strong className="tabular-nums text-lg">{fmtBand(preview)}</strong>
        </div>
        <SectionNote>
          Đủ bốn tiêu chí mới ra band. Để trống là chưa chấm, không phải điểm 0.
          {(cell.skill === 'writing1' || cell.skill === 'writing2') &&
            ' Band Writing của học viên = (Task 1 + Task 2 × 2) / 3, tính khi có cả hai task.'}
        </SectionNote>
      </div>
    </Modal>
  );
}

/**
 * HẠN CHẤM CỦA CHÍNH MÔN NÀY — không phải hạn của cả đợt.
 *
 * Môn chưa tới tuần thi thì chưa nợ ai cái gì, nên nó hiện tuần thi chứ không hiện một
 * cái hạn trông như đang đếm ngược. Đây là chỗ dễ đọc nhầm nhất của lịch tách tuần.
 */
export function DeadlinePill({ cell }: { cell: Cell }) {
  if (!cell.required) return <Info pending>Ngoài phạm vi</Info>;
  if (cell.progress === 'cancelled') return <Info pending>Đã huỷ phần thi</Info>;
  /* "Đã nhập" là TRẠNG THÁI CÔNG VIỆC, không phải điểm tốt — nên không tô xanh lá. */
  if (cell.band !== null) return <Status kind="done">Đã nhập</Status>;
  if (cell.progress === 'absent') return <Info pending>Đã vắng — chờ xếp lại</Info>;
  if (!cell.deadline) return <Info pending>Chưa xếp tuần</Info>;
  if (cell.progress === 'upcoming') {
    return (
      <Status kind="waiting">
        Thi {cell.weekRange ?? cell.periodCode} · hạn {fmtDate(cell.deadline)}
      </Status>
    );
  }
  const label = cell.deadlineSource === 'skill_override' ? 'Hạn riêng môn này'
    : cell.deadlineSource === 'attempt_override' ? 'Hạn riêng cả đợt'
    : 'Hạn';
  return cell.overdue
    ? <Alert>Quá hạn {fmtDate(cell.deadline)}</Alert>
    : <Status kind="waiting">{label} {fmtDate(cell.deadline)}</Status>;
}

