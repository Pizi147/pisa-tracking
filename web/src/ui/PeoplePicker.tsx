import { Fragment, useContext, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { api } from '../lib/api.ts';
import { Info } from './ui.tsx';
import { BaoOTrongNhan } from './ONgay.tsx';
import { buocDanhSach, skillShort, type NguoiChon } from '@shared/domain/index.ts';
import { useSession } from '../lib/session.tsx';

export type Person = { id: number; name: string; title: string | null; role: string | null; branches: string[] };

/** `Nguyễn A · Admin CN · CP` — đủ để không chọn nhầm hai người trùng tên. */
function contextOf(p: Person): string {
  return [p.role, p.branches.join('/')].filter(Boolean).join(' · ');
}

function usePeopleSearch(term: string) {
  const [rows, setRows] = useState<Person[]>([]);
  const [loading, setLoading] = useState(false);
  const seq = useRef(0);
  useEffect(() => {
    const my = ++seq.current;
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const r = await api.get<Person[]>(`/ref/people${term.trim() ? `?q=${encodeURIComponent(term.trim())}` : ''}`);
        if (my === seq.current) setRows(r);          // bỏ qua kết quả của lần gõ cũ
      } catch { if (my === seq.current) setRows([]); } finally { if (my === seq.current) setLoading(false); }
    }, 250);
    return () => clearTimeout(t);
  }, [term]);
  return { rows, loading };
}

/**
 * Chọn MỘT người — gõ để tìm, không kéo một dropdown dài.
 *
 * Một trung tâm có hàng chục tài khoản và nhiều người trùng tên, nên mỗi dòng kèm vai trò
 * và chi nhánh; một danh sách chỉ có tên là một danh sách chọn nhầm người.
 */
export function PersonPicker({ value, valueName, onChange, disabled, placeholder = 'Gõ tên để tìm…' }: {
  value: number | null; valueName?: string | null;
  onChange: (id: number | null, person: Person | null) => void;
  disabled?: boolean; placeholder?: string;
}) {
  const [term, setTerm] = useState('');
  const [open, setOpen] = useState(false);
  const { rows, loading } = usePeopleSearch(open ? term : '');
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const away = (e: MouseEvent) => { if (box.current && !box.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', away);
    return () => document.removeEventListener('mousedown', away);
  }, [open]);

  if (value && !open) {
    return (
      <div className="field flex items-center justify-between gap-2">
        <span className="text-slate-100 truncate">{valueName ?? `#${value}`}</span>
        {!disabled && (
          <span className="flex gap-1 shrink-0">
            <button className="btn btn-sm" onClick={() => { setTerm(''); setOpen(true); }}>Đổi</button>
            <button className="btn btn-sm" onClick={() => onChange(null, null)}>Bỏ</button>
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="relative" ref={box}>
      <input
        className="field" value={term} disabled={disabled} placeholder={placeholder}
        onFocus={() => setOpen(true)} onChange={(e) => { setTerm(e.target.value); setOpen(true); }}
      />
      {open && (
        <div
          className="absolute z-30 mt-1 w-[min(24rem,calc(100vw-2rem))] max-h-64 overflow-y-auto surface-2 rounded-lg border shadow-xl"
          style={{ borderColor: 'var(--line-strong)' }}
        >
          {loading && <div className="px-3 py-2 text-xs text-slate-500">Đang tìm…</div>}
          {!loading && rows.length === 0 && <div className="px-3 py-2 text-xs text-slate-500">Không tìm thấy ai khớp.</div>}
          {rows.map((p) => (
            <button
              key={p.id}
              className="w-full text-left px-3 py-2 hover:bg-white/5 appearance-none bg-transparent border-0"
              onClick={() => { onChange(p.id, p); setOpen(false); setTerm(''); }}
            >
              <div className="text-sm text-slate-100">{p.name}</div>
              <div className="text-[11px] text-slate-500">{contextOf(p) || p.title || '—'}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Chọn NHIỀU người theo dõi.
 *
 * Người theo dõi không phải người làm và không chịu trách nhiệm hoàn thành — họ chỉ cần
 * biết khi tiến độ đổi. Quản lý của chính chi nhánh được hệ thống thêm sẵn (chip "tự động"),
 * vì đó là câu trả lời hệ thống đã biết; người tạo chỉ thêm ai ngoài danh sách đó.
 */
export function FollowerPicker({ value, onChange, autoNames = [], disabled }: {
  value: Person[]; onChange: (people: Person[]) => void;
  autoNames?: string[]; disabled?: boolean;
}) {
  const chosen = useMemo(() => new Set(value.map((p) => p.id)), [value]);
  return (
    <div className="space-y-1.5">
      <div className="flex flex-wrap gap-1">
        {autoNames.map((n) => (
          <Info key={`auto-${n}`} title="Quản lý chi nhánh — hệ thống tự thêm">{n} · tự động</Info>
        ))}
        {value.map((p) => (
          <span key={p.id} className="inline-flex items-center gap-1">
            <Info>{p.name}</Info>
            {!disabled && (
              <button
                className="text-slate-500 hover:text-slate-200 text-xs"
                onClick={() => onChange(value.filter((x) => x.id !== p.id))}
                aria-label={`Bỏ ${p.name} khỏi người theo dõi`}
              >✕</button>
            )}
          </span>
        ))}
        {value.length === 0 && autoNames.length === 0 && (
          <span className="text-xs text-slate-500">Chưa có ai theo dõi thêm</span>
        )}
      </div>
      {!disabled && (
        <PersonPicker
          value={null}
          placeholder="Thêm người theo dõi…"
          onChange={(_, p) => { if (p && !chosen.has(p.id)) onChange([...value, p]); }}
        />
      )}
    </div>
  );
}

// =========================================================================== ChonNguoi (PR-Form F-2)

type NguoiKetQua = { id: number; name: string; role: string | null; branches: string[]; cungLop: boolean; monDay: string[] };

function useNguoiSearch(
  term: string, nhom: 'giao_vien' | 'nhan_vien', studentId: number | null | undefined, active: boolean,
  /** PR-Ra Q2: chỉ người trong phạm vi người xem (chi nhánh mình quản) — mặc định false (giữ hành vi cũ). */
  trongPhamVi = false,
  /** PR-S5F-b: chỉ GV ở chi nhánh lớp của em (`studentId`) — người dạy bổ trợ. */
  cungChiNhanh = false,
) {
  const [rows, setRows] = useState<NguoiKetQua[]>([]);
  const [loading, setLoading] = useState(false);
  const seq = useRef(0);
  useEffect(() => {
    if (!active) { setRows([]); return; }
    const my = ++seq.current;
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const qs = new URLSearchParams({ q: term.trim(), nhom });
        if (studentId) qs.set('studentId', String(studentId));
        if (trongPhamVi) qs.set('trongPhamVi', '1');
        if (cungChiNhanh) qs.set('cungChiNhanh', '1');
        const r = await api.get<NguoiKetQua[]>(`/ref/nguoi?${qs.toString()}`);
        if (my === seq.current) setRows(r);          // bỏ qua kết quả của lượt gõ cũ
      } catch { if (my === seq.current) setRows([]); } finally { if (my === seq.current) setLoading(false); }
    }, 250);
    return () => clearTimeout(t);
  }, [term, nhom, studentId, active, trongPhamVi, cungChiNhanh]);
  return { rows, loading };
}

/** `dạy L · R lớp này` · hoặc `vai · chi nhánh` cho một dòng kết quả tìm. */
function nguoiContextOf(r: NguoiKetQua): string {
  if (r.cungLop && r.monDay.length) return `dạy ${r.monDay.map(skillShort).join(' · ')} lớp này`;
  return [r.role, r.branches.join('/')].filter(Boolean).join(' · ') || (r.cungLop ? 'dạy lớp này' : '—');
}

type ChonNguoiOption =
  | { kind: 'toi' }
  | { kind: 'nguoi'; row: NguoiKetQua }
  | { kind: 'ngoai'; text: string };

/**
 * Ô chọn MỘT người thực hiện/phụ trách — dùng chung cho Case học thuật và Ý thức (PR-Form F-2, §22.5).
 *
 * Khác `PersonPicker` (gọi `/ref/people`, đòi `MEETING_VIEW`): đây gọi `/ref/nguoi` — mọi người đăng nhập gọi được,
 * vào ô là có danh sách (T14: chưa gõ → 20 người, GV cùng lớp đầu), tìm không dấu. `choNgoai` → LUÔN có dòng cuối
 * "Dùng tên ngoài hệ thống" (tên cần ≥ 2 ký tự, Q11). ↑/↓ đi vòng, Enter chốt, Esc đóng danh sách (không đóng panel).
 * Mở panel không tự nhảy vào ô gõ (Q18 — không bật bàn phím điện thoại; panel đang giữ focus ở khung): danh sách mở khi focus/bấm
 * vào ô, hoặc ngay khi bấm "Đổi". `tuMo`: nơi gọi vừa được bấm để chọn người (menu "Chọn giáo viên…") → focus + mở ngay.
 */
export function ChonNguoi({
  value, onChange, nhom, studentId, choToi = true, choNgoai = true, trongPhamVi = false, cungChiNhanh = false,
  khongDoi, macDinhTrong, ariaLabel, disabled, tuMo,
}: {
  value: NguoiChon | null;
  onChange: (v: NguoiChon | null) => void;
  nhom: 'giao_vien' | 'nhan_vien';
  studentId?: number | null;
  choToi?: boolean; choNgoai?: boolean;
  /** PR-Ra Q2: chỉ người trong phạm vi người xem — dùng cho "Chọn giáo viên…" của Quản lý. */
  trongPhamVi?: boolean;
  /** PR-S5F-b: chỉ GV cùng chi nhánh lớp của em — ô Người dạy bổ trợ. */
  cungChiNhanh?: boolean;
  /** Ô Điều chỉnh: khi `value = null` hiện "Không đổi · hiện: {khongDoi}". */
  khongDoi?: string;
  /** Ô Phụ trách: khi `value = null` hiện nguyên câu này (ví dụ "Mặc định: GVCN của lớp"). */
  macDinhTrong?: string;
  ariaLabel?: string;
  disabled?: boolean;
  tuMo?: boolean;
}) {
  const { session } = useSession();
  const [editing, setEditing] = useState(!value && khongDoi === undefined && macDinhTrong === undefined);
  const [term, setTerm] = useState('');
  const [open, setOpen] = useState(!!tuMo);
  const [activeIndex, setActiveIndex] = useState(-1);
  const box = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const uid = useId();
  const { rows, loading } = useNguoiSearch(term, nhom, studentId, editing, trongPhamVi, cungChiNhanh);
  /* Nằm dưới Truong/Field: nhãn trỏ vào ô gõ (label htmlFor), không bọc cả danh sách + nút "Đổi" (`BaoOTrongNhan`). */
  const bao = useContext(BaoOTrongNhan);
  /* Đang hiện tên (chưa sửa): nhãn trỏ vào nút "Đổi"; không có nút (disabled) thì không trỏ đâu. */
  const coO = editing || !disabled;
  useLayoutEffect(() => { bao?.(coO ? `${uid}-o` : null); return () => bao?.(null); }, [bao, uid, coO]);

  /* Chỉ khi VỪA chuyển sang sửa (bấm "Đổi") mới focus + mở; lúc vẽ đầu thì không, trừ `tuMo`. */
  const suaTruoc = useRef(tuMo ? false : editing);
  useEffect(() => {
    if (editing && !suaTruoc.current) {
      setOpen(true);
      setActiveIndex(-1);
      inputRef.current?.focus();
    }
    suaTruoc.current = editing;
  }, [editing]);

  useEffect(() => {
    if (!editing) return;
    const away = (e: MouseEvent) => {
      if (box.current && !box.current.contains(e.target as Node)) {
        setOpen(false);
        if (value || khongDoi !== undefined || macDinhTrong !== undefined) setEditing(false);
      }
    };
    document.addEventListener('mousedown', away);
    return () => document.removeEventListener('mousedown', away);
  }, [editing, value, khongDoi, macDinhTrong]);

  const options = useMemo<ChonNguoiOption[]>(() => {
    const out: ChonNguoiOption[] = [];
    if (choToi) out.push({ kind: 'toi' });
    for (const r of rows) out.push({ kind: 'nguoi', row: r });
    if (choNgoai) out.push({ kind: 'ngoai', text: term.trim() });
    return out;
  }, [choToi, rows, choNgoai, term]);
  /** Dòng "tên ngoài" chưa đủ 2 ký tự: hiện mờ, bấm không làm gì, mũi tên bỏ qua. */
  const tat = (opt: ChonNguoiOption) => opt.kind === 'ngoai' && opt.text.length < 2;
  const chonDuoc = options.flatMap((o, i) => (tat(o) ? [] : [i]));

  const chon = (opt: ChonNguoiOption) => {
    if (tat(opt)) return;
    if (opt.kind === 'toi') onChange({ kieu: 'toi' });
    else if (opt.kind === 'nguoi') onChange({ kieu: 'tai_khoan', id: opt.row.id, ten: opt.row.name, phu: nguoiContextOf(opt.row) });
    else onChange({ kieu: 'ngoai', ten: opt.text });
    setTerm('');
    setOpen(false);
    setEditing(false);
  };

  const nguoiLabel = nhom === 'giao_vien' ? 'giáo viên' : 'người';

  if (!editing) {
    let chinh: string; let phu: string;
    if (value?.kieu === 'toi') { chinh = 'Tôi'; phu = session?.user?.fullName ?? ''; }
    else if (value?.kieu === 'tai_khoan') { chinh = value.ten; phu = value.phu ?? ''; }
    else if (value?.kieu === 'ngoai') { chinh = value.ten; phu = 'ngoài hệ thống'; }
    else if (khongDoi !== undefined) { chinh = `Không đổi · hiện: ${khongDoi}`; phu = ''; }
    else { chinh = macDinhTrong ?? '—'; phu = ''; }

    return (
      <div className="field flex items-center justify-between gap-2">
        <span className="min-w-0 truncate">
          <span className="text-slate-100">{chinh}</span>
          {phu && <span className="text-slate-500 text-[11px]"> · {phu}</span>}
        </span>
        {!disabled && <button id={`${uid}-o`} type="button" className="btn btn-sm min-h-[44px] shrink-0 sm:min-h-0" onClick={() => setEditing(true)}>Đổi</button>}
      </div>
    );
  }

  const activeId = activeIndex >= 0 && activeIndex < options.length ? `${uid}-opt-${activeIndex}` : undefined;
  /* Dòng trạng thái nằm dưới danh sách người, TRÊN dòng "Dùng tên ngoài hệ thống" (mockup 22 §4). */
  const trangThai = loading
    ? <div className="px-3 py-2 text-[11px] text-slate-500">Đang tìm…</div>
    : term.trim() && rows.length === 0
      ? <div className="px-3 py-2 text-[11px] text-slate-500">Không tìm thấy {nguoiLabel} khớp «{term.trim()}»</div>
      : null;

  return (
    <div ref={box}>
      <input
        ref={inputRef}
        id={`${uid}-o`}
        className="field"
        role="combobox"
        aria-expanded={open}
        aria-controls={`${uid}-listbox`}
        aria-activedescendant={activeId}
        aria-label={ariaLabel ?? 'Chọn người'}
        autoComplete="off"
        value={term}
        disabled={disabled}
        placeholder={nhom === 'giao_vien' ? 'Gõ tên giáo viên…' : 'Gõ tên…'}
        onFocus={() => setOpen(true)}
        onChange={(e) => { setTerm(e.target.value); setOpen(true); setActiveIndex(-1); }}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {           // Home/End để nguyên cho con trỏ trong ô gõ
            e.preventDefault();
            setOpen(true);
            const k = buocDanhSach(chonDuoc.length, chonDuoc.indexOf(activeIndex), e.key);
            if (k !== null) {
              setActiveIndex(chonDuoc[k]);
              /* aria-activedescendant không tự cuộn: dòng đang chọn phải thấy được khi đi quá 56 (max-h) bằng mũi tên. */
              document.getElementById(`${uid}-opt-${chonDuoc[k]}`)?.scrollIntoView({ block: 'nearest' });
            }
          } else if (e.key === 'Enter') {
            if (activeIndex >= 0 && activeIndex < options.length) { e.preventDefault(); chon(options[activeIndex]); }
          } else if (e.key === 'Escape' && open) {
            e.stopPropagation();
            setOpen(false);
          }
        }}
      />
      {open && (
        <div id={`${uid}-listbox`} role="listbox" className="mt-1 max-h-56 overflow-y-auto surface-2 rounded-lg border" style={{ borderColor: 'var(--line-strong)' }}>
          {options.map((opt, i) => (
            <Fragment key={opt.kind === 'nguoi' ? `u${opt.row.id}` : opt.kind}>
              {opt.kind === 'ngoai' && trangThai}
              <button
                id={`${uid}-opt-${i}`}
                role="option"
                aria-selected={i === activeIndex}
                aria-disabled={tat(opt) || undefined}
                tabIndex={-1}
                type="button"
                className={`w-full text-left px-3 py-2 appearance-none bg-transparent border-0 ${
                  tat(opt) ? 'cursor-default' : i === activeIndex ? 'bg-white/5' : 'hover:bg-white/5'}`}
                onMouseEnter={() => { if (!tat(opt)) setActiveIndex(i); }}
                onClick={() => chon(opt)}
              >
                {opt.kind === 'toi' && (
                  <>
                    <div className="text-sm text-slate-100">Tôi</div>
                    {session?.user?.fullName && <div className="text-[11px] text-slate-500">{session.user.fullName}</div>}
                  </>
                )}
                {opt.kind === 'nguoi' && (
                  <>
                    <div className="text-sm text-slate-100">{opt.row.name}</div>
                    <div className="text-[11px] text-slate-500">{nguoiContextOf(opt.row)}</div>
                  </>
                )}
                {opt.kind === 'ngoai' && (tat(opt)
                  ? <div className="text-sm text-slate-500">Dùng tên ngoài hệ thống: gõ tên ở ô trên</div>
                  : <div className="text-sm text-slate-100">Dùng tên ngoài hệ thống: «{opt.text}»</div>)}
              </button>
            </Fragment>
          ))}
          {!choNgoai && trangThai}
        </div>
      )}
    </div>
  );
}
ChonNguoi.tuNhan = true;
