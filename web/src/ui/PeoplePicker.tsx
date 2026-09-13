import { useEffect, useMemo, useRef, useState } from 'react';
import { api } from '../lib/api.ts';
import { Pill } from './ui.tsx';

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
          <Pill key={`auto-${n}`} tone="neutral" title="Quản lý chi nhánh — hệ thống tự thêm">{n} · tự động</Pill>
        ))}
        {value.map((p) => (
          <span key={p.id} className="inline-flex items-center gap-1">
            <Pill tone="info">{p.name}</Pill>
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
