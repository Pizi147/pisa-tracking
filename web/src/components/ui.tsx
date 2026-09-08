import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

export function Card({ title, action, children, className = '', bodyClass = 'p-4' }: {
  title?: ReactNode; action?: ReactNode; children: ReactNode; className?: string; bodyClass?: string;
}) {
  return (
    <section className={`card ${className}`}>
      {(title || action) && (
        <header className="flex items-center justify-between gap-3 px-4 py-3 border-b" style={{ borderColor: 'var(--line)' }}>
          <h2 className="text-sm font-semibold text-slate-200">{title}</h2>
          {action}
        </header>
      )}
      <div className={bodyClass}>{children}</div>
    </section>
  );
}

type Tone = 'ok' | 'warn' | 'danger' | 'info' | 'neutral' | 'muted';

const TONE_CLASS: Record<Tone, string> = {
  ok: 'bg-teal-500/12 text-teal-300 border-teal-500/35',
  warn: 'bg-amber-500/12 text-amber-300 border-amber-500/35',
  danger: 'bg-red-500/12 text-red-300 border-red-500/35',
  info: 'bg-sky-500/12 text-sky-300 border-sky-500/35',
  neutral: 'bg-slate-500/12 text-slate-300 border-slate-500/30',
  muted: 'bg-transparent text-slate-400 border-slate-600/40 border-dashed',
};

/** Trạng thái luôn đi kèm nhãn chữ — màu chỉ hỗ trợ, không mang thông tin một mình. */
export function Pill({ tone = 'neutral', children, title }: { tone?: Tone; children: ReactNode; title?: string }) {
  return (
    <span title={title} className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-medium whitespace-nowrap ${TONE_CLASS[tone]}`}>
      {children}
    </span>
  );
}

export function Empty({ title, hint, action }: { title: string; hint?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-10 px-6 text-center">
      <div className="text-slate-300 font-medium">{title}</div>
      {hint && <p className="text-slate-400 text-xs max-w-md leading-relaxed">{hint}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

export function ErrorState({ message, hint, onRetry }: { message: string; hint?: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-10 px-6 text-center">
      <div className="text-red-300 font-medium">{message}</div>
      {hint && <p className="text-slate-400 text-xs max-w-md">{hint}</p>}
      {onRetry && <button className="btn btn-sm mt-2" onClick={onRetry}>Thử lại</button>}
    </div>
  );
}

export function Forbidden({ message, hint }: { message?: string; hint?: string }) {
  return (
    <div className="card p-6 text-center">
      <div className="text-amber-300 font-medium">{message ?? 'Bạn không có quyền xem nội dung này'}</div>
      <p className="text-slate-400 text-xs mt-1 max-w-lg mx-auto">{hint ?? 'Quyền được xác định theo vai trò, phạm vi và phân công của tài khoản đang dùng.'}</p>
    </div>
  );
}

export function Skeleton({ rows = 5, className = '' }: { rows?: number; className?: string }) {
  return (
    <div className={`space-y-2 ${className}`} aria-busy="true" aria-label="Đang tải">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="skel h-8 w-full" style={{ opacity: 1 - i * 0.08 }} />
      ))}
    </div>
  );
}

export function KpiTile({ label, value, tone = 'neutral', to, sub }: {
  label: string; value: ReactNode; tone?: Tone; to?: string; sub?: string;
}) {
  const inner = (
    <div className={`card p-4 h-full transition-colors ${to ? 'hover:border-teal-500/40 cursor-pointer' : ''}`}>
      <div className="text-[11px] uppercase tracking-wide text-slate-400 font-semibold">{label}</div>
      <div className={`mt-2 text-2xl font-semibold tabular-nums ${
        tone === 'danger' ? 'text-red-300' : tone === 'warn' ? 'text-amber-300' : tone === 'ok' ? 'text-teal-300' : 'text-slate-100'
      }`}>{value}</div>
      {sub && <div className="text-[11px] text-slate-500 mt-1">{sub}</div>}
      {to && <div className="text-[11px] text-teal-400 mt-2">Xem danh sách →</div>}
    </div>
  );
  return to ? <Link to={to} className="block h-full no-underline">{inner}</Link> : inner;
}

export function Field({ label, children, hint, required }: { label: string; children: ReactNode; hint?: string; required?: boolean }) {
  return (
    <label className="block">
      <span className="label">{label}{required && <span className="text-red-400"> *</span>}</span>
      {children}
      {hint && <span className="block text-[11px] text-slate-500 mt-1">{hint}</span>}
    </label>
  );
}

export function SectionNote({ children }: { children: ReactNode }) {
  return (
    <p className="text-[11px] text-slate-500 leading-relaxed border-l-2 border-slate-700 pl-2">{children}</p>
  );
}

export function DataCell({ value, state, suffix }: { value: ReactNode; state?: string; suffix?: string }) {
  if (state === 'not_applicable') return <span className="text-slate-600 text-xs italic">Không áp dụng</span>;
  if (value === null || value === undefined) return <span className="text-slate-500 text-xs">Chưa có dữ liệu</span>;
  return <span className="tabular-nums">{value}{suffix}</span>;
}
