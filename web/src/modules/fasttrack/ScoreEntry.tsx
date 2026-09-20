import { useEffect, useRef, useState } from 'react';
import { api, invalidate } from '../../lib/api.ts';
import { useToast } from '../../ui/Toast.tsx';
import { Modal } from '../../ui/Drawer.tsx';
import { Info, SectionNote, Status } from '../../ui/ui.tsx';
import type { SaveStatus } from '../../ui/SaveState.tsx';
import { Han } from '../../ui/Han.tsx';
import { fmtBand, skillLabel } from '../../lib/format.ts';
import { CRITERIA, CRITERIA_SHORT, NO_SHOW_HINT, criteriaSetFor, type EntrySkill } from '@shared/domain/index.ts';

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
  /**
   * DẤU '-' "KHÔNG CÓ BÀI" (rule book §17.1). `null` = không có dấu nào còn hiệu lực. `text` là câu đã dựng sẵn
   * ở máy chủ: "Không có bài · Có thể sửa đến hết Chủ nhật 20/09", "Không dự thi · Tuần W3 SEP 2026", …
   */
  noShow?: {
    state: 'khong-co-bai' | 'khong-du-thi' | 'cho-ql-hieu-chinh';
    text: string; effectiveOn: string | null; editableUntil: string | null;
  } | null;
};

export type SavePatch = {
  rawScore?: number | null;
  criteria?: (number | null)[]; resultDate?: string | null;
  /** `true` = báo "-" (không có bài), `false` = gỡ dấu. Không phải điểm 0. */
  noShow?: boolean;
};

/** Ô đã chốt "không dự thi" hoặc đang chờ Quản lý: người nhập điểm không sửa được nữa (phải qua Quản lý). */
export const lockedByNoShow = (cell: Cell) =>
  cell.noShow?.state === 'khong-du-thi' || cell.noShow?.state === 'cho-ql-hieu-chinh';

/**
 * Chữ người dùng gõ ở ô SỐ CÂU ĐÚNG → lệnh gửi máy chủ. '-' LÀ MỘT LỆNH, KHÔNG PHẢI MỘT SỐ (rule book §17.1): "học
 * viên có lịch mà không làm bài". Ô trống vẫn chỉ là chưa nhập; xoá ô đang có dấu '-' là gỡ dấu, không phải chấm điểm.
 * MỘT hàm cho mọi nơi nhập (bảng cả lớp, hồ sơ Test) — không có luật thứ hai.
 */
export function rawPatchFrom(text: string, cell: Cell): SavePatch {
  const t = text.trim();
  return t === '-' ? { noShow: true }
    : t === '' && cell.noShow ? { noShow: false }
    : { rawScore: t === '' ? null : Number(t) };
}

/**
 * Bốn ô tiêu chí → lệnh gửi máy chủ + band xem trước. MỘT DẤU '-' TRONG BỐN Ô LÀ ĐỦ báo chưa có bài cho ĐÚNG BÀI NÀY:
 * không ghi các tiêu chí thành 0, không xoá bài khác. Xoá sạch bốn ô của bài đang có dấu '-' là GỠ dấu; xoá bốn ô
 * của bài có điểm là xoá điểm như cũ.
 */
export function criteriaPatchFrom(vals: string[], cell: Cell): { dash: boolean; preview: number | null; patch: SavePatch } {
  const dash = vals.some((v) => v.trim() === '-');
  const nums = vals.map((v) => (v.trim() === '' || v.trim() === '-' ? null : Number(v)));
  const filled = nums.filter((v) => v !== null) as number[];
  const preview = !dash && filled.length === 4 ? Math.round((filled.reduce((a, b) => a + b, 0) / 4) * 2 + 1e-9) / 2 : null;
  const allEmpty = vals.every((v) => v.trim() === '');
  const patch: SavePatch = dash ? { noShow: true }
    : allEmpty && cell.noShow ? { noShow: false }
    : { criteria: nums };
  return { dash, preview, patch };
}

/**
 * Lưu điểm một kỹ năng. Khi lỗi, giữ nguyên giá trị người dùng vừa gõ để họ bấm lại,
 * không âm thầm quay về giá trị cũ.
 */
export function useSaveScore(attemptId: number, onSaved?: () => void) {
  const toast = useToast();
  const [saving, setSaving] = useState<string | null>(null);
  /*
   * TRẠNG THÁI LƯU CỦA TỪNG DÒNG (rule của bảng nhập điểm): mỗi dòng có một chỉ báo riêng — Đang lưu · Đã lưu ·
   * Lưu lỗi + Thử lại — thay vì lưu cả bảng rồi báo một lỗi chung không nói lỗi ở dòng nào.
   */
  const [status, setStatus] = useState<SaveStatus>('idle');
  const [lastError, setLastError] = useState<string | undefined>(undefined);
  const inflight = useRef(new Set<string>());
  const failed = useRef<{ skill: string; patch: SavePatch } | null>(null);

  const save = async (skill: string, patch: SavePatch): Promise<boolean> => {
    if (inflight.current.has(skill)) return false;   // chặn gửi lặp cùng một ô
    inflight.current.add(skill);
    setSaving(skill);
    setStatus('saving');
    try {
      await api.put(`/attempts/${attemptId}/scores/${skill}`, patch);
      invalidate('/attempts');
      invalidate('/overview');
      invalidate('/classes');
      invalidate('/students');
      failed.current = null;
      setStatus('saved'); setLastError(undefined);
      onSaved?.();
      return true;
    } catch (e: any) {
      failed.current = { skill, patch };
      setStatus('error'); setLastError(e.message);
      toast.push('error', `${skillLabel(skill)}: ${e.message}`);
      return false;
    } finally {
      inflight.current.delete(skill);
      setSaving(null);
    }
  };

  const retry = () => { if (failed.current) void save(failed.current.skill, failed.current.patch); };

  return { save, saving, status, lastError, retry };
}

/** Ô nhập số câu đúng 0–40. Trống KHÁC 0: xoá ô là xoá điểm, không phải chấm 0. */
export function RawScoreInput({ cell, onSave, inputRef, onKeyDown }: {
  cell: Cell;
  onSave: (patch: SavePatch) => Promise<boolean>;
  inputRef?: (el: HTMLInputElement | null) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}) {
  /* Bài đã báo "-" thì ô hiện đúng dấu '-' (không phải ô trống, không phải 0). */
  const shown = () => (cell.rawScore !== null ? String(cell.rawScore) : cell.noShow ? '-' : '');
  const [draft, setDraft] = useState(shown());
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!dirty) setDraft(shown());
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `shown` chỉ đọc hai trường đã có trong danh sách
  }, [cell.rawScore, cell.noShow?.state, dirty]);

  const commit = async () => {
    if (!dirty || busy) return;
    setBusy(true);
    const ok = await onSave(rawPatchFrom(draft, cell));
    setBusy(false);
    if (ok) setDirty(false);       // lỗi thì giữ nguyên bản nháp để người dùng sửa và thử lại
  };

  if (!cell.canEdit || lockedByNoShow(cell)) {
    return (
      <span className="inline-flex flex-col items-start gap-0.5">
        <span className="tabular-nums text-slate-300"
          title={lockedByNoShow(cell) ? 'Đã chốt — cần Quản lý hiệu chỉnh' : 'Bạn không được phân công kỹ năng này'}>
          {cell.rawScore === null ? (cell.noShow ? '-' : '—') : cell.rawScore}
          {!cell.noShow && <span className="text-slate-500 text-[11px] ml-1">({fmtBand(cell.band)})</span>}
        </span>
        {cell.noShow && <span className="text-[10px] text-slate-400 leading-tight">{cell.noShow.text}</span>}
      </span>
    );
  }

  return (
    <span className="inline-flex flex-col items-start gap-0.5">
      <span className="inline-flex items-center gap-1.5">
        <input
          ref={inputRef}
          className={`field w-16 text-center tabular-nums ${dirty ? 'border-amber-500/60' : ''}`}
          inputMode="numeric"
          value={draft}
          disabled={busy}
          title={NO_SHOW_HINT}
          aria-label={`${skillLabel(cell.skill)} — số câu đúng. ${NO_SHOW_HINT}`}
          onChange={(e) => { setDraft(e.target.value); setDirty(true); }}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') { void commit(); }
            /* Esc HUỶ ô đang sửa: trả về giá trị đã lưu, không gửi gì lên máy chủ. */
            if (e.key === 'Escape' && dirty) { e.preventDefault(); setDraft(shown()); setDirty(false); }
            onKeyDown?.(e);
          }}
        />
        <span className="tabular-nums text-slate-400 text-xs w-8">{cell.noShow ? '' : fmtBand(cell.band)}</span>
      </span>
      {cell.noShow && <span className="text-[10px] text-slate-400 leading-tight">{cell.noShow.text}</span>}
    </span>
  );
}

/** Bốn tiêu chí mở trong khung riêng — bảng mặc định không bày 16 cột tiêu chí. */
export function CriteriaButton({ cell, onSave }: { cell: Cell; onSave: (patch: SavePatch) => Promise<boolean> }) {
  const [open, setOpen] = useState(false);
  const editable = cell.canEdit && !lockedByNoShow(cell);
  return (
    <span className="inline-flex flex-col items-start gap-0.5">
      <button
        className={`btn btn-sm tabular-nums ${editable ? '' : 'opacity-70 cursor-default'}`}
        onClick={() => editable && setOpen(true)}
        title={editable ? `Mở bốn tiêu chí. ${NO_SHOW_HINT}`
          : lockedByNoShow(cell) ? 'Đã chốt — cần Quản lý hiệu chỉnh' : 'Bạn không được phân công kỹ năng này'}
      >
        {cell.noShow ? '-' : fmtBand(cell.band)}
        {editable && <span className="text-slate-500 text-[10px]">sửa</span>}
      </button>
      {cell.noShow && <span className="text-[10px] text-slate-400 leading-tight">{cell.noShow.text}</span>}
      {open && <CriteriaModal cell={cell} onSave={onSave} onClose={() => setOpen(false)} />}
    </span>
  );
}

export function CriteriaModal({ cell, onSave, onClose }: {
  cell: Cell; onSave: (patch: SavePatch) => Promise<boolean>; onClose: () => void;
}) {
  const set = criteriaSetFor(cell.skill) ?? 'writing';
  /* Bài đã báo "-" thì mở ra thấy '-' ở ô đầu — không phải bốn ô trống dễ nhầm với chưa nhập. */
  const [vals, setVals] = useState<string[]>(
    cell.noShow && cell.criteria.every((v) => v === null)
      ? ['-', '', '', '']
      : cell.criteria.map((v) => (v === null ? '' : String(v))),
  );
  const [busy, setBusy] = useState(false);

  /* Có '-' thì bỏ qua các ô số còn lại (xem `criteriaPatchFrom`). */
  const { dash, preview, patch } = criteriaPatchFrom(vals, cell);

  const submit = async () => {
    setBusy(true);
    const ok = await onSave(patch);
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
              title={NO_SHOW_HINT}
              onChange={(e) => setVals((v) => v.map((x, j) => (j === i ? e.target.value : x)))}
            />
          </label>
        ))}
        <div className="flex items-center justify-between border-t pt-3" style={{ borderColor: 'var(--line)' }}>
          <span className="text-sm text-slate-400">Band kỹ năng</span>
          <strong className="tabular-nums text-lg">{dash ? '-' : fmtBand(preview)}</strong>
        </div>
        {dash && (
          <p className="text-xs text-slate-300 m-0">
            Sẽ lưu là <strong>Không có bài</strong> cho đúng bài này. Sửa lại được đến hết Chủ nhật của tuần thi;
            còn nguyên khi hết Chủ nhật thì thành <strong>Không dự thi</strong>.
          </p>
        )}
        <SectionNote>
          {NO_SHOW_HINT}. Đủ bốn tiêu chí mới ra band. Để trống là chưa chấm, không phải điểm 0.
          {(cell.skill === 'writing1' || cell.skill === 'writing2') &&
            ' Band Writing của học viên = (Task 1 + Task 2 × 2) / 3, tính khi có cả hai task.'}
        </SectionNote>
      </div>
    </Modal>
  );
}

/**
 * SỬA ĐIỂM NGAY TẠI DÒNG (PR-I Step 4): L/R một ô, W1/W2/S bốn ô tiêu chí, cùng `Lưu`/`Huỷ` ở đúng dòng đó — không mở
 * khung riêng. `Enter` lưu, `Esc` huỷ. '-' là lệnh "không có bài" như ở bảng cả lớp; dựng lệnh bằng CÙNG hàm
 * (`rawPatchFrom` · `criteriaPatchFrom`) nên hai nơi nhập không thể lệch luật.
 */
export function InlineScoreEditor({ cell, onSave, onClose }: {
  cell: Cell; onSave: (patch: SavePatch) => Promise<boolean>; onClose: () => void;
}) {
  const isRaw = cell.skill === 'listening' || cell.skill === 'reading';
  const set = criteriaSetFor(cell.skill) ?? 'writing';
  const [vals, setVals] = useState<string[]>(() => (isRaw
    ? [cell.rawScore !== null ? String(cell.rawScore) : cell.noShow ? '-' : '']
    : cell.noShow && cell.criteria.every((v) => v === null)
      ? ['-', '', '', '']
      : cell.criteria.map((v) => (v === null ? '' : String(v)))));
  const [busy, setBusy] = useState(false);
  const built = isRaw
    ? { dash: vals[0].trim() === '-', preview: null as number | null, patch: rawPatchFrom(vals[0], cell) }
    : criteriaPatchFrom(vals, cell);

  const submit = async () => {
    if (busy) return;
    setBusy(true);
    const ok = await onSave(built.patch);
    setBusy(false);
    if (ok) onClose();              // lỗi thì giữ nguyên bản nháp để sửa và thử lại
  };
  const setAt = (i: number, value: string) => setVals((v) => v.map((x, j) => (j === i ? value : x)));

  return (
    <div className="space-y-1.5"
      onKeyDown={(e) => {
        if (e.key === 'Enter') { e.preventDefault(); void submit(); }
        if (e.key === 'Escape') { e.preventDefault(); onClose(); }
      }}>
      <div className="flex flex-wrap items-end gap-2">
        {isRaw ? (
          <label className="block">
            <span className="block text-[11px] text-slate-500">Số câu đúng</span>
            <input autoFocus className="field w-20 text-center tabular-nums" inputMode="numeric" value={vals[0]}
              title={NO_SHOW_HINT} aria-label={`${skillLabel(cell.skill)} — số câu đúng. ${NO_SHOW_HINT}`}
              onChange={(e) => setAt(0, e.target.value)} />
          </label>
        ) : CRITERIA[set].map((label, i) => (
          <label key={i} className="block" title={label}>
            <span className="block text-[11px] text-slate-500">{CRITERIA_SHORT[set][i]}</span>
            <input autoFocus={i === 0} className="field w-14 text-center tabular-nums" inputMode="decimal"
              value={vals[i] ?? ''} aria-label={`${skillLabel(cell.skill)} — ${label}. ${NO_SHOW_HINT}`}
              onChange={(e) => setAt(i, e.target.value)} />
          </label>
        ))}
        {!isRaw && (
          <span className="pb-1.5 text-sm tabular-nums text-slate-300">Band {built.dash ? '-' : fmtBand(built.preview)}</span>
        )}
        <button type="button" className="btn btn-sm btn-primary" disabled={busy} onClick={() => void submit()}>
          {busy ? 'Đang lưu…' : 'Lưu'}
        </button>
        <button type="button" className="btn btn-sm" disabled={busy} onClick={onClose}>Huỷ</button>
      </div>
      <p className="m-0 text-[11px] text-slate-500">
        {built.dash
          ? 'Sẽ lưu là Không có bài cho đúng bài này; sửa lại được đến hết Chủ nhật của tuần thi.'
          : `${NO_SHOW_HINT}. Để trống là chưa chấm, không phải điểm 0.`} Enter để lưu · Esc để huỷ.
      </p>
    </div>
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
  /*
   * HAI MỐC KHÔNG THAY NHAU (rule book §17.1): "Hạn nhập điểm 23/09" là hạn cho bài CÓ thực hiện; còn bài GV đã
   * báo "-" thì không nợ điểm mà có mốc chốt Chủ nhật — hai cái tên khác nhau, không dùng chung một chỗ.
   */
  if (cell.noShow) return <Info>{cell.noShow.text}</Info>;
  /* "Đã nhập" là TRẠNG THÁI CÔNG VIỆC, không phải điểm tốt — nên không tô xanh lá. */
  if (cell.band !== null) return <Status kind="done">Đã nhập</Status>;
  if (cell.progress === 'absent') return <Info pending>Đã vắng — chờ xếp lại</Info>;
  if (!cell.deadline) return <Info pending>Chưa xếp tuần</Info>;
  /*
   * Giữ NGUYÊN NGHĨA, đổi ĐƯỜNG RENDER (PR-E Step 2): bốn nhánh chuỗi tự dựng ở đây ("Hạn
   * riêng môn này" / "Hạn riêng cả đợt" / "Hạn" / "Quá hạn") nay đi qua `<Han>` — nên hạn nhập
   * điểm nói rõ là hạn NHẬP ĐIỂM, quá hạn nói rõ bao nhiêu ngày, và cùng một câu ở mọi màn.
   * Nguồn hạn (riêng môn / riêng cả đợt) chuyển thành ghi chú đứng sau, không mất thông tin.
   */
  if (cell.progress === 'upcoming') {
    return <Han loai="nhap-diem" han={cell.deadline} tienTo={`Thi ${cell.weekRange ?? cell.periodCode ?? ''}`.trim()} />;
  }
  const ghiChu = cell.deadlineSource === 'skill_override' ? 'riêng môn này'
    : cell.deadlineSource === 'attempt_override' ? 'riêng cả đợt'
    : undefined;
  return <Han loai="nhap-diem" han={cell.deadline} ghiChu={ghiChu} />;
}

