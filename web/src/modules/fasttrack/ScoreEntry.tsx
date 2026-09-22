import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { api, invalidate } from '../../lib/api.ts';
import { useToast } from '../../ui/Toast.tsx';
import { Modal } from '../../ui/Drawer.tsx';
import { Info, SectionNote, Status } from '../../ui/ui.tsx';
import type { SaveStatus } from '../../ui/SaveState.tsx';
import { Han } from '../../ui/Han.tsx';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import { fmtBand, skillLabel } from '../../lib/format.ts';
import {
  CRITERIA, CRITERIA_SHORT, NO_SHOW_HINT, criteriaSetFor, demNguocSuaDau, kiemLyDo, oLuoiThuong,
  type EntrySkill,
} from '@shared/domain/index.ts';

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
  /** RB-5 — lý do khi sửa một ô ĐÃ CÓ điểm chính thức (máy chủ đòi khi giá trị đổi hoặc bị xoá). */
  lyDo?: string;
};

/** Tuỳ chọn của một lần lưu. `nem` = ném lỗi ra cho nơi gọi (hộp lý do hiện câu lỗi ngay tại ô) thay vì chỉ toast. */
export type SaveOpts = { nem?: boolean };

/** Ô đã có điểm chính thức — sửa nó là hiệu chỉnh, phải qua `SuaDiemCoLyDo`. */
export const coDiemChinhThuc = (cell: Cell) => cell.band !== null || cell.rawScore !== null;

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

  const save = async (skill: string, patch: SavePatch, opts: SaveOpts = {}): Promise<boolean> => {
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
      /*
       * Hộp lý do đang mở thì câu lỗi hiện ngay trong hộp — không toast, không bật "Lưu lỗi + Thử lại" ở dòng (người
       * dùng sửa ngay trong hộp; Huỷ là bỏ, không còn gì để thử lại).
       */
      if (opts.nem) { setStatus('idle'); throw e; }
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

/**
 * DÒNG NHỎ DƯỚI Ô FT ĐANG MANG DẤU "-" (DS02, Q17). Còn trong cửa sổ sửa thì đếm ngược bằng chữ xám — không tô đỏ;
 * câu đầy đủ của máy chủ ("Không có bài · Có thể sửa đến hết Chủ nhật 20/09") nằm ở tooltip và ở cột Hạn nhập, nên
 * ô chỉ giữ MỘT dòng phụ (G-3). Đã chốt "Không dự thi" thì không còn gì để đếm: hiện đúng câu đã chốt.
 */
function DongDau({ cell }: { cell: Cell }) {
  const { homNay } = useNgayNghiepVu();
  if (!cell.noShow) return null;
  const dem = cell.noShow.state === 'khong-co-bai' ? demNguocSuaDau(cell.noShow.editableUntil ?? null, homNay) : null;
  return (
    <span className="block max-w-[6rem] truncate text-[10px] text-slate-400 leading-tight" title={cell.noShow.text}>
      {dem ?? cell.noShow.text}
    </span>
  );
}

/**
 * Ô nhập số câu đúng 0–40. Trống KHÁC 0: xoá ô là xoá điểm, không phải chấm 0.
 * `lon` = cỡ điện thoại (ô rộng 60px, cao 44px — chấm một kỹ năng một lúc); luật lưu, "-" và lý do y hệt.
 */
export function RawScoreInput({ cell, onSave, inputRef, onKeyDown, lon = false }: {
  cell: Cell;
  onSave: (patch: SavePatch, opts?: SaveOpts) => Promise<boolean>;
  inputRef?: (el: HTMLInputElement | null) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  lon?: boolean;
}) {
  /* Bài đã báo "-" thì ô hiện đúng dấu '-' (không phải ô trống, không phải 0). */
  const shown = () => (cell.rawScore !== null ? String(cell.rawScore) : cell.noShow ? '-' : '');
  const [draft, setDraft] = useState(shown());
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  /* RB-5: ô ĐÃ CÓ điểm mà con số đổi (hoặc bị xoá) thì không lưu thẳng — mở hộp lý do ngay tại ô. */
  const [hoiLyDo, setHoiLyDo] = useState(false);

  useEffect(() => {
    if (!dirty) setDraft(shown());
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `shown` chỉ đọc hai trường đã có trong danh sách
  }, [cell.rawScore, cell.noShow?.state, dirty]);

  const commit = async () => {
    if (!dirty || busy || hoiLyDo) return;
    const patch = rawPatchFrom(draft, cell);
    if (coDiemChinhThuc(cell) && 'rawScore' in patch && patch.rawScore !== cell.rawScore) {
      setHoiLyDo(true);
      return;
    }
    setBusy(true);
    const ok = await onSave(patch);
    setBusy(false);
    if (ok) setDirty(false);       // lỗi thì giữ nguyên bản nháp để người dùng sửa và thử lại
  };
  const huy = () => { setDraft(shown()); setDirty(false); setHoiLyDo(false); };

  if (!cell.canEdit || lockedByNoShow(cell)) {
    return (
      <span className="inline-flex flex-col items-start gap-0.5">
        <span className="tabular-nums text-slate-300"
          title={lockedByNoShow(cell) ? 'Đã chốt — cần Quản lý hiệu chỉnh' : 'Bạn không được phân công kỹ năng này'}>
          {cell.rawScore === null ? (cell.noShow ? '-' : '—') : cell.rawScore}
          {!cell.noShow && <span className="text-slate-500 text-[11px] ml-1">({fmtBand(cell.band)})</span>}
        </span>
        <DongDau cell={cell} />
      </span>
    );
  }

  const moi = draft.trim();
  return (
    <span className="inline-flex flex-col items-start gap-0.5">
      <span className="inline-flex items-center gap-1.5">
        <input
          ref={inputRef}
          className={`field ${lon ? 'w-[60px] h-11 text-base font-semibold' : 'w-16'} text-center tabular-nums ${dirty ? 'border-amber-500/60' : ''}`}
          inputMode="numeric"
          value={draft}
          disabled={busy}
          title={coDiemChinhThuc(cell) ? `Đã có điểm — sửa thì phải ghi lý do. ${NO_SHOW_HINT}` : NO_SHOW_HINT}
          aria-label={`${skillLabel(cell.skill)} — số câu đúng. ${NO_SHOW_HINT}`}
          onChange={(e) => { setDraft(e.target.value); setDirty(true); }}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') { void commit(); }
            /* Esc HUỶ ô đang sửa: trả về giá trị đã lưu, không gửi gì lên máy chủ. */
            if (e.key === 'Escape' && dirty) { e.preventDefault(); huy(); }
            onKeyDown?.(e);
          }}
        />
        <span className="tabular-nums text-slate-400 text-xs w-8">{cell.noShow ? '' : fmtBand(cell.band)}</span>
      </span>
      <DongDau cell={cell} />
      {hoiLyDo && (
        <SuaDiemCoLyDo
          tieuDe={`Sửa ${skillLabel(cell.skill)}`}
          moTaCu={`Đang lưu: ${cell.rawScore} câu đúng (band ${fmtBand(cell.band)})`}
          loiGiaTri={moi === '' || /^\d+$/.test(moi) ? null : 'Số câu đúng là số nguyên từ 0 đến 40.'}
          onDong={huy}
          onLuu={async (lyDo) => {
            const ok = await onSave({ ...rawPatchFrom(draft, cell), lyDo }, { nem: true });
            if (ok) { setDirty(false); setHoiLyDo(false); }
            return ok;
          }}
        >
          <label className="flex items-center gap-2">
            <span className="text-[11px] text-slate-500 w-20">Giá trị mới</span>
            <input className="field w-20 text-center tabular-nums py-1" inputMode="numeric" value={draft}
              aria-label={`${skillLabel(cell.skill)} — số câu đúng mới`}
              onChange={(e) => setDraft(e.target.value)} />
            <span className="text-[11px] text-slate-500">{moi === '' ? 'xoá điểm' : ''}</span>
          </label>
        </SuaDiemCoLyDo>
      )}
    </span>
  );
}

/** Bốn tiêu chí mở trong khung riêng — bảng mặc định không bày 16 cột tiêu chí. `lon` = nút cỡ điện thoại (cao 44px). */
export function CriteriaButton({ cell, onSave, buttonRef, lon = false }: {
  cell: Cell;
  onSave: (patch: SavePatch, opts?: SaveOpts) => Promise<boolean>;
  buttonRef?: (el: HTMLButtonElement | null) => void;
  lon?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const editable = cell.canEdit && !lockedByNoShow(cell);
  /* Ô đã có band: sửa là hiệu chỉnh → hộp lý do NGAY TẠI Ô (bốn tiêu chí nằm trong hộp), không mở khung lớn (G-8). */
  const hieuChinh = coDiemChinhThuc(cell);
  return (
    <span className="inline-flex flex-col items-start gap-0.5">
      <button
        ref={buttonRef}
        className={`btn ${lon ? 'min-h-[44px] min-w-[60px] justify-center text-base font-semibold' : 'btn-sm'} tabular-nums ${editable ? '' : 'opacity-70 cursor-default'}`}
        onClick={() => editable && setOpen(true)}
        title={editable ? (hieuChinh ? 'Sửa bốn tiêu chí — đã có điểm nên phải ghi lý do.' : `Mở bốn tiêu chí. ${NO_SHOW_HINT}`)
          : lockedByNoShow(cell) ? 'Đã chốt — cần Quản lý hiệu chỉnh' : 'Bạn không được phân công kỹ năng này'}
      >
        {cell.noShow ? '-' : fmtBand(cell.band)}
        {editable && <span className="text-slate-500 text-[10px]">sửa</span>}
      </button>
      <DongDau cell={cell} />
      {open && !hieuChinh && <CriteriaModal cell={cell} onSave={onSave} onClose={() => setOpen(false)} />}
      {open && hieuChinh && <SuaTieuChi cell={cell} onSave={onSave} onClose={() => setOpen(false)} />}
    </span>
  );
}

/** Hiệu chỉnh bốn tiêu chí của một ô đã có band: bốn ô số trong `SuaDiemCoLyDo`, band xem trước ngay dưới. */
function SuaTieuChi({ cell, onSave, onClose }: {
  cell: Cell; onSave: (patch: SavePatch, opts?: SaveOpts) => Promise<boolean>; onClose: () => void;
}) {
  const set = criteriaSetFor(cell.skill) ?? 'writing';
  const [vals, setVals] = useState<string[]>(cell.criteria.map((v) => (v === null ? '' : String(v))));
  const { dash, preview, patch } = criteriaPatchFrom(vals, cell);
  const doi = vals.some((v, i) => (v.trim() === '' ? null : Number(v)) !== cell.criteria[i]);
  return (
    <SuaDiemCoLyDo
      tieuDe={`Sửa ${skillLabel(cell.skill)}`}
      moTaCu={`Đang lưu: band ${fmtBand(cell.band)} (${cell.criteria.map((v) => v ?? '—').join(' · ')})`}
      loiGiaTri={dash ? 'Ô đã có điểm không nhận dấu "-".' : !doi ? 'Chưa đổi tiêu chí nào.' : null}
      onDong={onClose}
      onLuu={async (lyDo) => {
        const ok = await onSave({ ...patch, lyDo }, { nem: true });
        if (ok) onClose();
        return ok;
      }}
    >
      <div className="flex items-end gap-1.5">
        {CRITERIA[set].map((label, i) => (
          <label key={i} className="block" title={label}>
            <span className="block text-[10px] text-slate-500">{CRITERIA_SHORT[set][i]}</span>
            <input className="field w-12 text-center tabular-nums px-1 py-1" inputMode="decimal" value={vals[i] ?? ''}
              aria-label={`${skillLabel(cell.skill)} — ${label}`}
              onChange={(e) => setVals((v) => v.map((x, j) => (j === i ? e.target.value : x)))} />
          </label>
        ))}
        <span className="pb-1.5 text-xs tabular-nums text-slate-300" title="Band xem trước">→ {fmtBand(preview)}</span>
      </div>
    </SuaDiemCoLyDo>
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
  const [lyDo, setLyDo] = useState('');
  const built = isRaw
    ? { dash: vals[0].trim() === '-', preview: null as number | null, patch: rawPatchFrom(vals[0], cell) }
    : criteriaPatchFrom(vals, cell);
  /*
   * RB-5 — ô ĐÃ CÓ điểm mà giá trị đổi (hoặc bị xoá) thì phải ghi lý do; ô lý do hiện ngay trong dòng đang sửa (không
   * mở thêm khung). Lưu lại đúng số cũ không phải hiệu chỉnh nên không hỏi.
   */
  const canLyDo = coDiemChinhThuc(cell) && !built.dash && (isRaw
    ? (vals[0].trim() === '' ? null : Number(vals[0])) !== cell.rawScore
    : vals.some((v, i) => (v.trim() === '' ? null : Number(v)) !== cell.criteria[i]));
  const loiLyDo = canLyDo ? kiemLyDo(lyDo) : null;

  const submit = async () => {
    if (busy || loiLyDo) return;
    setBusy(true);
    const ok = await onSave(canLyDo ? { ...built.patch, lyDo: lyDo.trim() } : built.patch);
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
        {canLyDo && (
          <label className="block">
            <span className="block text-[11px] text-slate-500">Lý do sửa</span>
            <input className="field w-56" value={lyDo} placeholder="Ví dụ: chấm lại bài, nhập nhầm"
              aria-label="Lý do sửa điểm đã nhập" onChange={(e) => setLyDo(e.target.value)} />
          </label>
        )}
        <span title={loiLyDo ?? undefined}>
          <button type="button" className="btn btn-sm btn-primary" disabled={busy || !!loiLyDo}
            title={loiLyDo ?? undefined} onClick={() => void submit()}>
            {busy ? 'Đang lưu…' : 'Lưu'}
          </button>
        </span>
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


/**
 * RB-5 — SỬA MỘT Ô ĐÃ CÓ ĐIỂM. Hộp nhỏ ngay tại ô: giá trị mới + ô lý do bắt buộc. Nút Lưu mờ khi lý do chưa đủ, rê
 * chuột thấy đúng câu của `kiemLyDo` — không để người dùng bấm rồi mới biết mình thiếu gì.
 *
 * Hộp neo vào phần tử CHA của chỗ nó được đặt (chính là ô điểm) và vẽ qua portal với `position: fixed`, nên bảng cuộn
 * ngang trong thẻ (`overflow-x-auto`) không cắt được nó; hết chỗ bên dưới thì lật lên trên. Đây là một hộp nổi nhỏ,
 * không phải một khung chồng lên khung (G-8). Esc hoặc bấm ra ngoài = huỷ; Enter = Lưu khi đã hợp lệ.
 *
 * `loiGiaTri` (không bắt buộc): giá trị mới chưa hợp lệ thì Lưu cũng mờ, tooltip nói vì sao. Lỗi máy chủ trả về (ví dụ
 * 400 "Sửa điểm đã nhập thì phải ghi lý do.") hiện ngay dưới ô lý do — `onLuu` ném lỗi thì hộp bắt lấy câu đó.
 */
export function SuaDiemCoLyDo({ tieuDe, moTaCu, children, onLuu, onDong, loiGiaTri = null }: {
  tieuDe: string; moTaCu: string; children: ReactNode;
  onLuu: (lyDo: string) => Promise<boolean>; onDong: () => void;
  loiGiaTri?: string | null;
}) {
  const moc = useRef<HTMLSpanElement>(null);
  const pop = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const [lyDo, setLyDo] = useState('');
  const [busy, setBusy] = useState(false);
  const [loi, setLoi] = useState<string | null>(null);
  const dong = useRef(onDong);
  dong.current = onDong;
  const dangLuu = useRef(false);

  const loiLyDo = kiemLyDo(lyDo);
  /* Câu của `kiemLyDo` đứng trước: tooltip của nút Lưu mờ luôn nói đúng câu lý do còn thiếu (RB-5). */
  const chan = loiLyDo ?? loiGiaTri;

  const dat = useCallback(() => {
    const neo = moc.current?.parentElement;
    const hop = pop.current;
    if (!neo || !hop) return;
    const r = neo.getBoundingClientRect();
    const w = hop.offsetWidth;
    const h = hop.offsetHeight;
    const left = Math.max(8, Math.min(r.left, window.innerWidth - w - 8));
    const top = r.bottom + 4 + h > window.innerHeight - 8 ? Math.max(8, r.top - h - 4) : r.bottom + 4;
    setPos({ top, left });
  }, []);

  useLayoutEffect(() => { dat(); }, [dat]);

  useEffect(() => {
    const dau = pop.current?.querySelector<HTMLInputElement>('input');
    dau?.focus();
    dau?.select();
    const away = (e: MouseEvent) => {
      if (!dangLuu.current && pop.current && !pop.current.contains(e.target as Node)) dong.current();
    };
    const esc = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || dangLuu.current) return;
      e.stopPropagation(); e.preventDefault();
      dong.current();
    };
    document.addEventListener('mousedown', away);
    document.addEventListener('keydown', esc, true);
    window.addEventListener('resize', dat);
    window.addEventListener('scroll', dat, true);
    return () => {
      document.removeEventListener('mousedown', away);
      document.removeEventListener('keydown', esc, true);
      window.removeEventListener('resize', dat);
      window.removeEventListener('scroll', dat, true);
    };
  }, [dat]);

  const luu = async () => {
    if (chan || dangLuu.current) return;
    dangLuu.current = true;
    setBusy(true); setLoi(null);
    try {
      const ok = await onLuu(lyDo.trim());
      if (!ok) setLoi('Chưa lưu được — thử lại.');
    } catch (e: any) {
      setLoi(e?.message ?? 'Chưa lưu được — thử lại.');
    } finally {
      dangLuu.current = false;
      setBusy(false);
    }
  };

  return (
    <span ref={moc} className="hidden" aria-hidden>
      {createPortal(
        <div
          ref={pop} role="dialog" aria-label={tieuDe}
          className="fixed z-[70] surface-2 rounded-lg border shadow-xl p-3 w-72 text-left normal-case tracking-normal"
          style={{ borderColor: 'var(--line-strong)', top: pos?.top ?? 0, left: pos?.left ?? 0, visibility: pos ? 'visible' : 'hidden' }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.target as HTMLElement).tagName === 'INPUT') { e.preventDefault(); void luu(); }
          }}
        >
          <div className="text-sm font-medium text-slate-100">{tieuDe}</div>
          <div className="text-[11px] text-slate-500 mt-0.5 tabular-nums">{moTaCu}</div>
          <div className="mt-2">{children}</div>
          <label className="block mt-2">
            <span className="block text-[11px] text-slate-500 mb-0.5">Lý do sửa (bắt buộc)</span>
            <input className="field py-1 text-sm" value={lyDo} placeholder="Ví dụ: chấm lại bài, nhập nhầm cột"
              aria-label="Lý do sửa điểm đã nhập" onChange={(e) => setLyDo(e.target.value)} />
          </label>
          {loi && <p className="m-0 mt-1 text-[11px] text-rose-300">{loi}</p>}
          <div className="flex justify-end gap-2 mt-2">
            <button type="button" className="btn btn-sm" disabled={busy} onClick={() => dong.current()}>Huỷ</button>
            <span title={chan ?? undefined}>
              <button type="button" className="btn btn-sm btn-primary" disabled={busy || !!chan}
                title={chan ?? undefined} onClick={() => void luu()}>
                {busy ? 'Đang lưu…' : 'Lưu'}
              </button>
            </span>
          </div>
        </div>,
        document.body,
      )}
    </span>
  );
}

/** Tỉ lệ để HIỆN (tooltip). Làm tròn chỉ để hiện — xét đạt/chưa đạt đã làm ở máy chủ trên số chính xác. */
const phanTram = (r: number | null | undefined) => (r === null || r === undefined ? null : `${Math.round(r * 1000) / 10}%`);
const SO_NGUYEN = /^\d+$/;

/**
 * MỘT Ô CỦA LƯỚI LỚP THƯỜNG: số câu đúng / tổng số câu.
 *
 * Gõ "-" ở ô trái là một LỆNH, không phải một số: em không làm bài → môn này dời sang tuần sau (C08). Xoá dấu "-"
 * đang có là gỡ dấu và trả lịch về tuần cũ. Ô đã có điểm thì không nhận dấu "-" — muốn sửa phải qua hộp lý do.
 *
 * Lưu khi rời CẢ CẶP ô (hoặc Enter), không lưu khi chỉ nhảy từ ô trái sang ô tổng — nếu không, gõ xong số câu đúng rồi
 * Tab sang ô tổng là máy chủ đã báo "thiếu tổng". Ô tổng viền vàng khi khác tổng đầu cột (em làm đề khác — Q7).
 * `dienTong` là lệnh "↓" của đầu cột: mỗi lần `lan` đổi thì ô CÒN TRỐNG tổng lấy `gt`; ô đã có tổng giữ nguyên.
 *
 * Các trường thêm của `cell` (không bắt buộc): `dau` (ô đang mang dấu "-", mặc định suy từ `tuanDoiTu`), `chuaToiTuan`
 * (chưa tới tuần thi — ô chỉ đọc hiện tuần thi thay cho "—"), `tiLe`/`ketQua` (để tô và ghi tooltip đạt/chưa đạt).
 *
 * `lon` = cỡ điện thoại (hai ô cao 44px). `tongLaySan` = ô tổng CÒN TRỐNG hiện sẵn `tongCot` (chưa phải bản nháp: không
 * gõ gì thì không gửi gì; gõ số câu đúng thì lưu kèm tổng đó) — màn điện thoại không có ô tổng đầu cột + nút ↓.
 */
export function ODiemThuong({
  cell, tongCot, canEdit, onSave, onDau, inputRef, onKeyDown, dienTong = null, tenMon = 'Môn', tenHv,
  lon = false, tongLaySan = false,
}: {
  cell: {
    diem: number | null; tong: number | null; tuanDoiTu: string | null; tuanHienTai: string | null;
    dau?: boolean; chuaToiTuan?: boolean; tiLe?: number | null; ketQua?: 'pass' | 'fail' | 'missing';
  };
  tongCot: number | null;
  canEdit: boolean;
  onSave: (patch: { score: number | null; total: number | null; lyDo?: string }, opts?: SaveOpts) => Promise<boolean>;
  onDau: (bat: boolean) => Promise<boolean>;
  inputRef?: (el: HTMLInputElement | null) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  dienTong?: { gt: number; lan: number } | null;
  tenMon?: string;
  tenHv?: string;
  lon?: boolean;
  tongLaySan?: boolean;
}) {
  const dau = cell.dau ?? cell.tuanDoiTu !== null;
  const coDiem = cell.diem !== null;
  const diemDaLuu = () => (coDiem ? String(cell.diem) : dau ? '-' : '');
  const tongDaLuu = () => (cell.tong !== null ? String(cell.tong)
    : tongLaySan && !coDiem && tongCot !== null ? String(tongCot) : '');
  const [diem, setDiem] = useState(diemDaLuu());
  const [tong, setTong] = useState(tongDaLuu());
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [canhBao, setCanhBao] = useState<{ o: 'diem' | 'tong'; cau: string } | null>(null);
  const [sua, setSua] = useState<{ diem: string; tong: string } | null>(null);
  const cap = useRef<HTMLSpanElement>(null);
  const dangGui = useRef(false);
  const lanDaDien = useRef(dienTong?.lan ?? 0);

  useEffect(() => {
    if (!dirty) { setDiem(diemDaLuu()); setTong(tongDaLuu()); }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- hai hàm chỉ đọc ba trường đã có trong danh sách
  }, [cell.diem, cell.tong, dau, dirty, tongLaySan ? tongCot : null]);

  /* Lệnh ↓ của đầu cột — KHÔNG đè ô đã có tổng (Q7), kể cả tổng đang gõ dở. */
  useEffect(() => {
    if (!dienTong || dienTong.lan === lanDaDien.current) return;
    lanDaDien.current = dienTong.lan;
    if (!canEdit || coDiem || cell.tong !== null || tong.trim() !== '') return;
    setTong(String(dienTong.gt));
    setDirty(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- chỉ chạy khi có lệnh ↓ mới
  }, [dienTong?.lan]);

  const soTong = SO_NGUYEN.test(tong.trim()) ? Number(tong.trim()) : null;
  const o = oLuoiThuong({ diem: cell.diem, tong: coDiem ? cell.tong : soTong, tongCot });
  const pt = phanTram(cell.tiLe);
  const ketQuaChu = cell.ketQua === 'pass' ? 'Đạt' : cell.ketQua === 'fail' ? 'Chưa đạt' : null;
  const lamBu = dau && coDiem && cell.tuanHienTai
    ? `Làm bù ở ${cell.tuanHienTai}${cell.tuanDoiTu ? ` (dời từ ${cell.tuanDoiTu})` : ''}.` : '';

  const gui = async (lam: () => Promise<boolean>) => {
    dangGui.current = true;
    setBusy(true);
    const ok = await lam();
    dangGui.current = false;
    setBusy(false);
    if (ok) setDirty(false);       // lỗi thì giữ nguyên bản nháp để sửa và thử lại
  };

  const commit = async () => {
    if (!dirty || dangGui.current || coDiem) return;
    const d = diem.trim();
    const t = tong.trim();
    if (d === '-') {
      if (dau) { setDirty(false); return; }
      setCanhBao(null);
      return gui(() => onDau(true));
    }
    if (d === '' && dau) { setCanhBao(null); return gui(() => onDau(false)); }
    if (d !== '' && !SO_NGUYEN.test(d)) {
      setCanhBao({ o: 'diem', cau: 'Số câu đúng là số nguyên, hoặc "-" nếu em không làm bài.' }); return;
    }
    if (t !== '' && (!SO_NGUYEN.test(t) || Number(t) <= 0)) {
      setCanhBao({ o: 'tong', cau: 'Tổng số câu là số nguyên lớn hơn 0.' }); return;
    }
    if (d !== '' && t === '') { setCanhBao({ o: 'tong', cau: 'Nhập cả tổng số câu.' }); return; }
    if (d !== '' && Number(d) > Number(t)) {
      setCanhBao({ o: 'diem', cau: `Số câu đúng (${d}) không thể lớn hơn tổng (${t}).` }); return;
    }
    const score = d === '' ? null : Number(d);
    const total = t === '' ? null : Number(t);
    setCanhBao(null);
    if (score === cell.diem && total === cell.tong) { setDirty(false); return; }
    return gui(() => onSave({ score, total }));
  };
  const huy = () => { setDiem(diemDaLuu()); setTong(tongDaLuu()); setDirty(false); setCanhBao(null); };

  const phim = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') void commit();
    /* Esc HUỶ ô đang sửa: trả về giá trị đã lưu, không gửi gì lên máy chủ. */
    if (e.key === 'Escape' && dirty) { e.preventDefault(); huy(); }
    onKeyDown?.(e);
  };

  const oSo = lon
    ? 'field w-[52px] h-11 px-1 text-center tabular-nums text-base'
    : 'field w-11 px-1 py-1 text-center tabular-nums text-[13px]';

  /* ---- Chỉ đọc: môn không được phân công. */
  if (!canEdit) {
    const khongDay = 'Bạn không được phân công kỹ năng này.';
    if (coDiem) {
      return (
        <span className="inline-flex items-center justify-center tabular-nums text-slate-400"
          title={[khongDay, pt && ketQuaChu ? `${pt} · ${ketQuaChu}.` : '', lamBu].filter(Boolean).join(' ')}>
          <span className={cell.ketQua === 'fail' ? 'text-rose-300' : ''}>{o.hien || `${cell.diem}/?`}</span>
        </span>
      );
    }
    const chu = dau ? '-' : cell.chuaToiTuan && cell.tuanHienTai ? cell.tuanHienTai : '—';
    const title = dau && cell.tuanHienTai ? `${khongDay} Đã dời sang ${cell.tuanHienTai}.`
      : cell.chuaToiTuan && cell.tuanHienTai ? `${khongDay} Thi ${cell.tuanHienTai}.` : khongDay;
    return <span className="text-[11px] text-slate-500 tabular-nums" title={title}>{chu}</span>;
  }

  /* ---- Ô đã có điểm: hai ô chỉ đọc; bấm (hoặc gõ số) mở hộp lý do ngay tại ô (RB-5). */
  if (coDiem) {
    const mo = (d: string) => setSua({ diem: d, tong: tongDaLuu() });
    const loiGiaTri = (() => {
      if (!sua) return null;
      const d = sua.diem.trim(); const t = sua.tong.trim();
      if (d === '-') return 'Ô đã có điểm không nhận dấu "-" — muốn đổi thì sửa số.';
      if (d !== '' && !SO_NGUYEN.test(d)) return 'Số câu đúng là số nguyên.';
      if (t !== '' && (!SO_NGUYEN.test(t) || Number(t) <= 0)) return 'Tổng số câu là số nguyên lớn hơn 0.';
      if (d !== '' && t === '') return 'Nhập cả tổng số câu.';
      if (d !== '' && Number(d) > Number(t)) return `Số câu đúng (${d}) không thể lớn hơn tổng (${t}).`;
      if ((d === '' ? null : Number(d)) === cell.diem && (t === '' ? null : Number(t)) === cell.tong) return 'Chưa đổi gì.';
      return null;
    })();
    const title = [pt && ketQuaChu ? `${pt} · ${ketQuaChu}.` : '', 'Đã có điểm — bấm để sửa, phải ghi lý do.', lamBu]
      .filter(Boolean).join(' ');
    return (
      <span className="inline-flex items-center justify-center gap-1" title={title}>
        <input ref={inputRef} readOnly className={`${oSo} cursor-pointer ${cell.ketQua === 'fail' ? 'text-rose-300' : ''}`}
          value={String(cell.diem)} aria-label={`${tenMon} — số câu đúng (đã có điểm, sửa phải ghi lý do)`}
          onClick={() => mo(String(cell.diem))}
          onKeyDown={(e) => {
            if (/^[0-9]$/.test(e.key)) { e.preventDefault(); mo(e.key); return; }
            if (e.key === 'Backspace' || e.key === 'Delete') { e.preventDefault(); mo(''); return; }
            if (e.key === 'F2') { e.preventDefault(); mo(String(cell.diem)); return; }
            onKeyDown?.(e);
          }} />
        <span className="text-slate-600">/</span>
        <input readOnly tabIndex={-1} className={`${oSo} cursor-pointer ${o.vienVang ? 'border-amber-400/80' : ''}`}
          value={tongDaLuu()} placeholder="?" aria-label={`${tenMon} — tổng số câu`}
          title={o.vienVang ? `Khác tổng của cột (${tongCot}) — em làm đề khác.` : undefined}
          onClick={() => mo(String(cell.diem))} />
        {sua && (
          <SuaDiemCoLyDo
            tieuDe={`Sửa ${tenMon}${tenHv ? ` · ${tenHv}` : ''}`}
            moTaCu={`Đang lưu: ${cell.diem}/${cell.tong ?? '?'}${pt ? ` (${pt})` : ''}`}
            loiGiaTri={loiGiaTri}
            onDong={() => setSua(null)}
            onLuu={async (lyDo) => {
              const d = sua.diem.trim(); const t = sua.tong.trim();
              const ok = await onSave({ score: d === '' ? null : Number(d), total: t === '' ? null : Number(t), lyDo }, { nem: true });
              if (ok) setSua(null);
              return ok;
            }}
          >
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-slate-500 w-20">Giá trị mới</span>
              <input className={oSo} inputMode="numeric" value={sua.diem} aria-label={`${tenMon} — số câu đúng mới`}
                onChange={(e) => setSua({ ...sua, diem: e.target.value })} />
              <span className="text-slate-600">/</span>
              <input className={oSo} inputMode="numeric" value={sua.tong} aria-label={`${tenMon} — tổng số câu mới`}
                onChange={(e) => setSua({ ...sua, tong: e.target.value })} />
              {sua.diem.trim() === '' && <span className="text-[11px] text-slate-500">xoá điểm</span>}
            </div>
          </SuaDiemCoLyDo>
        )}
      </span>
    );
  }

  /* ---- Ô chưa có điểm: hai ô nhập. Ô trái nhận số câu đúng hoặc "-". */
  const dangDau = diem.trim() === '-';
  const titleDiem = canhBao?.o === 'diem' ? canhBao.cau
    : dau ? `Đã dời sang ${cell.tuanHienTai ?? 'tuần sau'}. Xoá dấu "-" để trả lịch về ${cell.tuanDoiTu ?? 'tuần cũ'}; gõ số khi em đã làm bài.`
    : `Số câu đúng. Gõ "-" nếu em không làm bài: môn này dời sang tuần sau.${cell.chuaToiTuan && cell.tuanHienTai ? ` Thi ${cell.tuanHienTai}.` : ''}`;
  const titleTong = canhBao?.o === 'tong' ? canhBao.cau
    : o.vienVang ? `Khác tổng của cột (${tongCot}) — em làm đề khác.` : 'Tổng số câu của đề em làm.';
  return (
    <span ref={cap} className="inline-flex items-center justify-center gap-1"
      onBlur={(e) => { if (!cap.current?.contains(e.relatedTarget as Node)) void commit(); }}>
      <input ref={inputRef}
        className={`${oSo} ${canhBao?.o === 'diem' ? 'border-rose-400/70' : ''} ${dangDau ? 'text-slate-400' : ''}`}
        inputMode="numeric" value={diem} disabled={busy} title={titleDiem}
        aria-label={`${tenMon} — số câu đúng. Gõ "-" nếu em không làm bài`}
        onChange={(e) => { setDiem(e.target.value); setDirty(true); }} onKeyDown={phim} />
      <span className="text-slate-600">/</span>
      <input className={`${oSo} ${canhBao?.o === 'tong' ? 'border-rose-400/70' : o.vienVang ? 'border-amber-400/80' : ''}`}
        inputMode="numeric" value={dangDau ? '' : tong} disabled={busy || dangDau} placeholder={dangDau ? '' : 'tổng'}
        title={dangDau ? 'Ô mang dấu "-" chưa cần tổng.' : titleTong}
        aria-label={`${tenMon} — tổng số câu`}
        onChange={(e) => { setTong(e.target.value); setDirty(true); }} onKeyDown={phim} />
    </span>
  );
}
