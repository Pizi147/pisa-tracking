import { useState } from 'react';
import { Empty, ErrorState, Level, Skeleton, Status } from '../../ui/ui.tsx';
import { fmtBand, fmtDate, sosLabel, sosTone } from '../../lib/format.ts';
import { CasePanel } from './CasePanel.tsx';

/**
 * TIẾN ĐỘ VÀ HỖ TRỢ THEO KỸ NĂNG — khối chính của hồ sơ học viên (mục 4.2).
 *
 * Mỗi hàng trả lời bốn câu, đúng thứ tự người dạy hỏi:
 *
 *   kỹ năng · kết quả gần nhất · vấn đề đang theo dõi · việc tiếp theo
 *
 * BẤM MỘT HÀNG THÌ CASE MỞ RA NGAY BÊN DƯỚI hàng đó. Một kỹ năng có nhiều case thì mỗi case
 * là MỘT THẺ RIÊNG, đóng mở độc lập — mở cái này không đóng cái kia.
 *
 * THỨ TỰ: case đang xử lý và mới cập nhật ở trên, case đã hoàn thành ở dưới. Người mở hồ sơ
 * hỏi "giờ đang thế nào", không hỏi "ba tháng trước bắt đầu ra sao".
 */

type Plan = {
  id: number; kind: string; kindLabel: string; name: string;
  performer: string | null; status: string; statusLabel: string;
  startedOn: string | null; completedOn: string | null;
  actionDue: string | null; actionOverdue: boolean;
  followupDue: string | null; followupOverdue: boolean;
  pendingApproval: boolean; approvalDue: string | null;
  lastOutcome: string | null; lastOutcomeLabel: string | null;
  lastOutcomeOn: string | null; lastNote: string | null;
  /** Mọi lần có người nhìn lại và ghi kết quả — dòng thời gian vẽ thành mốc CÓ NGÀY. */
  updates: { on: string; outcome: string; label: string; by: string | null }[];
};
type CaseCard = {
  id: number; title: string; status: string; track: string;
  urgency: string | null; sosLevel: number | null;
  carriedOver: boolean; parallel: boolean;
  openedOn: string | null; touchedOn: string | null;
  issueCode: string | null; issueLabel: string | null;
  summary: string | null; behaviour: boolean;
  plans: Plan[];
  reports: { on: string; by: string | null; skill: string | null; summary: string }[];
  attempts: { attemptNo: number; week: string | null }[];
  followUntil: string | null; followOverdue: boolean;
  outcomeLabel: string | null; outcomeNote: string | null; closedOn: string | null;
};
export type Row = {
  category: string; label: string; short: string;
  band: number | null; bandAttemptNo: number | null; bandWeek: string | null;
  expectation: number | null; delta: number | null; missed: boolean | null;
  state: 'none' | 'no_plan' | 'working' | 'done';
  caseId: number | null; caseTitle: string | null; caseStatus: string | null;
  carriedOver: boolean;
  sosLevel: number | null; attemptsSpanned: number; parallelCount: number;
  followUntil: string | null; followOverdue: boolean;
  outcome: string | null; outcomeLabel: string | null;
  supportLine: string | null; openActions: number;
  overdueActionDue: string | null; pendingApproval: boolean;
  points: {
    attemptNo: number; band: number; expectation: number | null;
    score: number | null; total: number | null; passed: boolean | null;
  }[];
  score: number | null; total: number | null; ratio: boolean;
  signal: {
    id: number; skill: string | null; band: number | null; expectation: number | null;
    verifyDue: string | null; overdue: boolean; ownerName: string | null;
  } | null;
  cases: CaseCard[];
};

const STATE_LABEL: Record<Row['state'], string> = {
  none: 'Không có case',
  no_plan: 'Chưa có phương án',
  working: 'Đang xử lý',
  done: 'Đã kết thúc',
};
const STATE_KIND: Record<Row['state'], 'doing' | 'waiting' | 'done' | 'idle'> = {
  none: 'idle', no_plan: 'waiting', working: 'doing', done: 'done',
};

export function SkillBoard({ rows, loading, error, onRetry, selected, onPick, onReport, onOpenCase, onChanged }: {
  rows: Row[] | null;
  loading?: boolean;
  error?: { message: string; hint?: string } | null;
  onRetry?: () => void;
  selected?: string | null;
  onPick: (category: string | null) => void;
  onReport?: (category: string) => void;
  onOpenCase?: (caseId: number) => void;
  onChanged?: () => void;
}) {
  if (error) return <ErrorState message={error.message} hint={error.hint} onRetry={onRetry} />;
  if (loading || !rows) return <Skeleton rows={6} />;
  if (!rows.length) return <Empty title="Chưa có hạng mục nào để theo dõi" />;

  return (
    <div>
      {rows.map((r) => (
        <SkillRow key={r.category} row={r}
          open={selected === r.category}
          onToggle={() => onPick(selected === r.category ? null : r.category)}
          onReport={onReport}
          onOpenCase={onOpenCase}
          onChanged={onChanged} />
      ))}
    </div>
  );
}

function SkillRow({ row, open, onToggle, onReport, onOpenCase, onChanged }: {
  row: Row; open: boolean; onToggle: () => void;
  onReport?: (category: string) => void;
  onOpenCase?: (caseId: number) => void;
  onChanged?: () => void;
}) {
  const bodyId = `skill-${row.category}`;
  const expandable = row.cases.length > 0 || row.band !== null || !!row.signal;
  /* Đang xử lý / mới cập nhật lên trước, đã hoàn thành xuống dưới. */
  const ordered = [...row.cases].sort((a, b) => {
    const done = (x: CaseCard) => (x.status === 'done' ? 1 : 0);
    if (done(a) !== done(b)) return done(a) - done(b);
    return (b.touchedOn ?? '').localeCompare(a.touchedOn ?? '') || b.id - a.id;
  });
  const next = nextStepOf(row);

  return (
    <div className="border-b last:border-b-0" style={{ borderColor: 'var(--line)' }}>
      <button
        type="button" id={`${bodyId}-btn`} aria-expanded={open} aria-controls={bodyId}
        disabled={!expandable} onClick={onToggle}
        className={`w-full text-left appearance-none border-0 bg-transparent p-0 ${
          expandable ? 'cursor-pointer row-hover' : 'cursor-default'}`}
      >
        <div className="grid gap-x-3 gap-y-1 px-3 py-3 items-center
                        grid-cols-[1fr_auto] md:grid-cols-[minmax(8rem,1fr)_7rem_minmax(10rem,1.4fr)_minmax(0,1fr)]">
          {/* 1 — hạng mục */}
          <div className="min-w-0">
            <span className="text-sm font-semibold text-slate-100">{row.label}</span>
            <Trend row={row} />
          </div>

          {/* 2 — ô điểm gọn: điểm/kỳ vọng và chênh lệch */}
          <ScoreCell row={row} />

          {/* 3 — vấn đề đang theo dõi */}
          <div className="min-w-0">
            {row.signal ? (
              <>
                <span className={`block text-xs font-medium truncate ${
                  row.signal.overdue ? 'text-rose-200' : 'text-amber-200'}`}>
                  Xác minh SOS
                </span>
                <span className="block text-[10px] text-slate-500">
                  {row.signal.overdue ? '⚠ quá hạn ' : 'hạn '}{fmtDate(row.signal.verifyDue)}
                  {row.signal.ownerName ? ` · ${row.signal.ownerName}` : ''}
                </span>
              </>
            ) : row.caseTitle ? (
              <>
                <span className="block text-xs text-slate-200 truncate" title={row.caseTitle}>
                  {row.caseTitle}
                </span>
                <span className="flex flex-wrap items-center gap-x-1.5 text-[10px] text-slate-500 mt-1">
                  <Status kind={STATE_KIND[row.state]}>{STATE_LABEL[row.state]}</Status>
                  {row.parallelCount > 1 && <span>{row.parallelCount} case song song</span>}
                  {row.carriedOver && <span>từ lộ trình trước</span>}
                </span>
              </>
            ) : (
              <>
                <span className="block text-xs text-slate-500">Không có case đang mở</span>
                {row.band !== null && (
                  <span className="inline-flex mt-1">
                    <Status kind={row.missed ? 'waiting' : 'done'}>
                      {row.missed ? 'Đang theo dõi' : 'Đạt kỳ vọng'}
                    </Status>
                  </span>
                )}
              </>
            )}
          </div>

          {/* 4 — việc tiếp theo */}
          <div className="min-w-0 col-span-2 md:col-span-1">
            {next ? (
              <span className={`block text-xs truncate ${next.overdue ? 'text-rose-300' : 'text-slate-300'}`}>
                {next.text}
                {next.due && <span className={next.overdue ? '' : 'text-slate-500'}> · {fmtDate(next.due)}</span>}
              </span>
            ) : <span className="text-xs text-slate-600">—</span>}
          </div>
        </div>
      </button>

      {open && (
        <div id={bodyId} className="px-3 pb-3 space-y-2">
          {ordered.length === 0 ? (
            <p className="text-xs text-slate-400 m-0 py-1">
              Không có vấn đề nào đang theo dõi ở {row.label}.
              {onReport && (
                <button type="button" className="btn btn-sm ml-2" onClick={() => onReport(row.category)}>
                  + Case cho {row.label}
                </button>
              )}
            </p>
          ) : ordered.map((c) => (
            <CaseCardView key={c.id} c={c} skillLabel={row.label}
              onOpenCase={onOpenCase} onChanged={onChanged} />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * MỘT THẺ CASE — đóng mở riêng, và mở sẵn khi case còn đang xử lý.
 *
 * Bên trong giữ đúng cách bày của bản thiết kế: một dòng phân loại, câu mô tả, rồi MỖI
 * PHƯƠNG ÁN MỘT KHỐI BA CỘT — phương án là gì · kết quả gần nhất · việc tiếp theo. Ba cột
 * vì đó là ba câu hỏi khác nhau, và nhồi chúng vào một dòng chữ thì phải đọc hết mới tách ra được.
 */
function CaseCardView({ c, skillLabel, onOpenCase, onChanged }: {
  c: CaseCard; skillLabel: string;
  onOpenCase?: (caseId: number) => void;
  onChanged?: () => void;
}) {
  const [open, setOpen] = useState(c.status !== 'done');
  const [history, setHistory] = useState(false);

  return (
    <div className="rounded-lg border" style={{ borderColor: 'var(--line)', background: 'var(--surface-2)' }}>
      <button type="button" onClick={() => setOpen(!open)} aria-expanded={open}
        className="w-full text-left appearance-none bg-transparent border-0 px-3 py-2.5 cursor-pointer">
        <span className="flex flex-wrap items-center justify-between gap-2">
          <span className="flex flex-wrap items-center gap-2 min-w-0">
            <span className="text-slate-500 text-xs select-none" aria-hidden
              style={{ transform: open ? 'rotate(90deg)' : 'none', display: 'inline-block' }}>›</span>
            <span className="text-sm text-slate-100">{skillLabel} · {c.title}</span>
          </span>
          <span className="flex flex-wrap items-center gap-1.5">
            {c.status === 'done'
              ? <Status kind="done">Đã hoàn thành</Status>
              : c.sosLevel !== null && c.sosLevel > 0
                ? <Level tone={sosTone(c.sosLevel)}>{sosLabel(c.sosLevel)}</Level>
                : <Status kind="doing">Đang xử lý</Status>}
          </span>
        </span>
      </button>

      {open && (
        <div className="px-3 pb-3 space-y-2.5">
          <p className="text-[11px] text-slate-500 m-0">
            {c.issueLabel ? <>Phân loại: {c.issueLabel}</> : <span className="text-amber-200/80">Chưa phân loại vấn đề</span>}
            {c.openedOn && <> · mở {fmtDate(c.openedOn)}</>}
            {c.carriedOver && <> · từ lộ trình trước</>}
            {c.parallel && <> · case song song</>}
          </p>
          {c.summary && <p className="text-sm text-slate-300 m-0 leading-relaxed">{c.summary}</p>}

          {/* NHÓM Ý THỨC/KHÁC: bằng chứng là BÁO CÁO NGUỒN, không phải một con điểm. */}
          {c.behaviour && c.reports.length > 0 && (
            <div className="rounded-lg border px-2.5 py-2" style={{ borderColor: 'var(--line)' }}>
              <span className="block text-[10px] uppercase tracking-wide text-slate-500 mb-1">
                Báo cáo nguồn · {c.reports.length} lần
              </span>
              <ul className="list-none p-0 m-0 space-y-1">
                {c.reports.map((r, i) => (
                  <li key={i} className="text-xs text-slate-300">
                    <span className="text-slate-500 tabular-nums">{fmtDate(r.on)}</span>
                    {r.by && <span className="text-slate-500"> · {r.by}</span>}
                    <span className="block text-slate-400">{r.summary}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* MỖI PHƯƠNG ÁN MỘT KHỐI — nhiều phương án song song thì nhiều khối. */}
          {c.plans.length === 0 ? (
            <p className="text-xs text-amber-200/90 m-0">Chưa có phương án nào — case này đang chờ người quyết.</p>
          ) : (
            <div className="space-y-2">
              {c.plans.map((p) => <PlanBlock key={p.id} p={p} behaviour={c.behaviour} />)}
            </div>
          )}

          {/* Kết luận của case đã hoàn thành — đọc lại được, không bị giấu. */}
          {c.status === 'done' && c.outcomeLabel && (
            <p className="text-xs text-slate-300 m-0">
              Kết luận: <strong>{c.outcomeLabel}</strong>
              {c.closedOn && <span className="text-slate-500"> · {fmtDate(c.closedOn)}</span>}
              {c.outcomeNote && <span className="block text-slate-400 mt-0.5">{c.outcomeNote}</span>}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-1.5">
            {c.attempts.map((a) => (
              <Chip key={a.attemptNo}>MT{a.attemptNo}{a.week ? ` · ${fmtDate(a.week)}` : ''}</Chip>
            ))}
            {c.followUntil && c.status !== 'done' && (
              <Chip tone={c.followOverdue ? 'danger' : undefined}>
                {c.followOverdue ? '⚠ quá hạn báo kết quả' : 'Báo kết quả trước'} {fmtDate(c.followUntil)}
              </Chip>
            )}
            <button type="button" className="btn btn-sm btn-ghost" onClick={() => setHistory(!history)}>
              {history ? 'Ẩn lịch sử hỗ trợ' : 'Mở lịch sử hỗ trợ'}
            </button>
            {onOpenCase && (
              <button type="button" className="btn btn-sm btn-ghost" onClick={() => onOpenCase(c.id)}>
                Mở trang riêng
              </button>
            )}
          </div>

          {history && (
            <div className="rounded-lg border p-2" style={{ borderColor: 'var(--line)' }}>
              <CasePanel caseId={c.id} compact hideHeader onChanged={onChanged} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * MỘT PHƯƠNG ÁN — ba cột, ba câu hỏi khác nhau.
 *
 * Hạn LÀM và hạn CẬP NHẬT là hai mốc khác nhau của cùng một phương án, nên chúng đứng tách
 * dòng. Gộp lại thành "hạn 30/08" thì người đọc không biết mình đang trễ việc gì.
 */
function PlanBlock({ p, behaviour }: { p: Plan; behaviour: boolean }) {
  const running = p.status === 'planned' || p.status === 'started';
  return (
    <div className="rounded-lg border grid gap-x-3 gap-y-2 p-2.5 sm:grid-cols-3"
         style={{ borderColor: 'var(--line)' }}>
      <div className="min-w-0">
        <span className="block text-[10px] uppercase tracking-wide text-slate-500">
          {running ? 'Phương án đang làm' : 'Phương án đã xong'}
        </span>
        <span className="block text-sm text-slate-100 leading-snug">{p.name}</span>
        <span className="block text-[11px] text-slate-500 mt-0.5">
          {p.performer ?? 'chưa có người thực hiện'}
          {p.startedOn && <> · bắt đầu {fmtDate(p.startedOn)}</>}
          {p.completedOn && <> · xong {fmtDate(p.completedOn)}</>}
        </span>
      </div>

      <div className="min-w-0">
        <span className="block text-[10px] uppercase tracking-wide text-slate-500">
          {behaviour ? 'Đã thực hiện' : 'Kết quả gần nhất'}
        </span>
        {behaviour ? (
          <>
            <span className="block text-sm text-slate-200 leading-snug">{p.statusLabel}</span>
            {p.completedOn && (
              <span className="block text-[11px] text-slate-500 mt-0.5">ngày {fmtDate(p.completedOn)}</span>
            )}
          </>
        ) : p.lastOutcomeLabel ? (
          <>
            <span className={`block text-sm leading-snug ${outcomeTone(p.lastOutcome)}`}>
              {p.lastOutcomeLabel}
            </span>
            <span className="block text-[11px] text-slate-500 mt-0.5">
              cập nhật {fmtDate(p.lastOutcomeOn)}
            </span>
          </>
        ) : (
          <>
            <span className="block text-sm text-slate-400 leading-snug">Chưa có kết quả</span>
            <span className="block text-[11px] text-slate-500 mt-0.5">cần thêm một lần đánh giá</span>
          </>
        )}
      </div>

      <div className="min-w-0">
        <span className="block text-[10px] uppercase tracking-wide text-slate-500">Việc tiếp theo</span>
        {p.pendingApproval ? (
          <>
            <span className="block text-sm text-sky-300 leading-snug">Chờ Quản lý trả lời</span>
            {p.approvalDue && (
              <span className="block text-[11px] text-slate-500 mt-0.5">hạn {fmtDate(p.approvalDue)}</span>
            )}
          </>
        ) : !running ? (
          <span className="block text-sm text-slate-500 leading-snug">Đã khép lại</span>
        ) : (
          <>
            <span className="block text-sm text-slate-200 leading-snug">
              {behaviour ? 'Đánh dấu đã làm' : 'Ghi cập nhật tuần'}
            </span>
            <span className="block text-[11px] mt-0.5">
              {p.actionDue && (
                <span className={p.actionOverdue ? 'text-rose-300' : 'text-slate-500'}>
                  {p.actionOverdue ? '⚠ quá hạn làm ' : 'hạn làm '}{fmtDate(p.actionDue)}
                </span>
              )}
              {p.actionDue && p.followupDue && <span className="text-slate-600"> · </span>}
              {p.followupDue && (
                <span className={p.followupOverdue ? 'text-rose-300' : 'text-slate-500'}>
                  dự kiến xong {fmtDate(p.followupDue)}
                </span>
              )}
              {!p.actionDue && !p.followupDue && <span className="text-slate-600">chưa đặt hạn</span>}
            </span>
          </>
        )}
      </div>
    </div>
  );
}

function Chip({ children, tone }: { children: React.ReactNode; tone?: 'danger' }) {
  return (
    <span className={`text-[11px] rounded px-1.5 py-0.5 border ${
      tone === 'danger' ? 'text-rose-200' : 'text-slate-400'}`}
      style={{ borderColor: tone === 'danger' ? 'var(--danger)' : 'var(--line)' }}>
      {children}
    </span>
  );
}

/**
 * Ô ĐIỂM GỌN — điểm, kỳ vọng và chênh lệch so với lượt trước (mục 3).
 *
 * BỐN MÀU, BỐN CÂU KHÁC NHAU:
 *   đỏ        dưới kỳ vọng
 *   xanh dương bằng đúng kỳ vọng
 *   xanh lá   vượt kỳ vọng
 *   xám       chưa có dữ liệu
 *
 * ĐIỂM TĂNG MÀ VẪN CHƯA ĐẠT THÌ VẪN ĐỎ. Mũi tên nói hướng đi, màu nói đã đạt hay chưa — hai
 * câu khác nhau, và tô xanh một điểm còn dưới kỳ vọng là khen sớm.
 */
function ScoreCell({ row }: { row: Row }) {
  if (row.band === null) {
    return (
      <div className="whitespace-nowrap">
        <span className="text-base font-semibold text-slate-600">—</span>
        <span className="block text-[10px] text-slate-600">chưa có dữ liệu</span>
      </div>
    );
  }
  const value = row.ratio && row.total ? `${row.score}/${row.total}` : fmtBand(row.band);
  const cls = scoreTone(row);
  const d = row.delta;
  return (
    <div className="whitespace-nowrap">
      <span className={`text-base font-semibold tabular-nums ${cls}`}>{value}</span>
      {!row.ratio && d !== null && d !== 0 && (
        <span className={`text-[11px] ml-1 tabular-nums ${d > 0 ? 'text-emerald-300' : 'text-rose-300'}`}
              title={`So với lượt trước: ${d > 0 ? '+' : ''}${d}`}>
          {d > 0 ? '↑' : '↓'} {Math.abs(d)}
        </span>
      )}
      {!row.ratio && d === 0 && <span className="text-[11px] ml-1 text-slate-500">→ 0.0</span>}
      <span className="block text-[10px] text-slate-500">
        {row.bandAttemptNo ? (row.ratio ? row.bandWeek ?? '' : `MT${row.bandAttemptNo}`) : ''}
        {row.ratio
          ? (row.missed === false ? ' · đạt' : row.missed === true ? ' · chưa đạt' : '')
          : row.expectation !== null ? ` · kỳ vọng ${fmtBand(row.expectation)}` : ''}
      </span>
    </div>
  );
}

/** Dưới kỳ vọng đỏ · bằng xanh dương · vượt xanh lá · thiếu dữ liệu xám. */
function scoreTone(row: Row): string {
  if (row.band === null) return 'text-slate-600';
  if (row.ratio) {
    if (row.missed === null) return 'text-slate-300';
    return row.missed ? 'text-rose-300' : 'text-emerald-300';
  }
  if (row.expectation === null) return 'text-slate-300';
  if (row.band < row.expectation) return 'text-rose-300';
  if (row.band === row.expectation) return 'text-sky-300';
  return 'text-emerald-300';
}

function outcomeTone(outcome: string | null): string {
  if (outcome === 'improved') return 'text-emerald-300';
  if (outcome === 'partial') return 'text-emerald-200/90';
  if (outcome === 'unchanged' || outcome === 'worse') return 'text-rose-300';
  return 'text-amber-200';
}

/** Việc tiếp theo của cả hàng — một câu, lấy việc gấp nhất đang tồn. */
function nextStepOf(row: Row): { text: string; due: string | null; overdue: boolean } | null {
  if (row.signal) {
    return { text: 'Xác minh SOS', due: row.signal.verifyDue, overdue: row.signal.overdue };
  }
  const open = row.cases.filter((c) => c.status !== 'done');
  const plans = open.flatMap((c) => c.plans).filter((p) => p.status === 'planned' || p.status === 'started');
  if (!open.length) return null;
  if (!plans.length) return { text: 'Đề ra phương án', due: null, overdue: false };
  const pending = plans.find((p) => p.pendingApproval);
  if (pending) return { text: 'Chờ Quản lý trả lời', due: pending.approvalDue, overdue: false };
  const due = plans
    .map((p) => ({ on: p.actionDue ?? p.followupDue, overdue: p.actionOverdue || p.followupOverdue }))
    .filter((x) => x.on)
    .sort((a, b) => (a.on ?? '').localeCompare(b.on ?? ''))[0];
  return { text: 'Cập nhật PA', due: due?.on ?? null, overdue: !!due?.overdue };
}

/**
 * ĐƯỜNG ĐI CỦA ĐIỂM qua các lượt, vẽ bằng chữ chứ không bằng đồ hoạ.
 *
 * MỖI MỐC SO VỚI KỲ VỌNG CỦA CHÍNH ĐỢT ĐÓ (mục 3), không so với target cuối lộ trình: kỳ
 * vọng MT1 thấp hơn kỳ vọng MT3, nên lấy một cái thước chung là kết luận sai cho quá khứ.
 */
function Trend({ row }: { row: Row }) {
  const pts = row.points ?? [];
  if (!pts.length) {
    return (
      <span className="block text-[10px] text-slate-600">
        {row.category === 'behaviour' ? 'không chấm điểm' : 'chưa có điểm'}
      </span>
    );
  }
  if (pts.length === 1) {
    return (
      <span className="block text-[10px] text-slate-500">
        {row.ratio ? 'mới có một bài' : `mới có MT${pts[0].attemptNo}`}
        {row.bandWeek ? ` · ${row.bandWeek}` : ''}
      </span>
    );
  }
  return (
    <span className="flex flex-wrap items-center gap-x-1 text-[10px] text-slate-500 leading-tight">
      {pts.map((pt, i) => (
        <span key={pt.attemptNo} className="inline-flex items-center gap-1">
          {i > 0 && <span className="text-slate-700">→</span>}
          <span className={`tabular-nums ${pointTone(pt, row.ratio)}`}
            title={`MT${pt.attemptNo}${pt.expectation !== null ? ` · kỳ vọng ${fmtBand(pt.expectation)}` : ''}`}>
            {row.ratio && pt.total ? `${pt.score}/${pt.total}` : fmtBand(pt.band)}
          </span>
        </span>
      ))}
    </span>
  );
}

/** Cùng bốn màu với ô điểm, nhưng so với kỳ vọng CỦA CHÍNH LƯỢT ĐÓ. */
function pointTone(pt: Row['points'][number], ratio: boolean): string {
  if (ratio) return pt.passed === false ? 'text-rose-300/80' : pt.passed === true ? 'text-emerald-300/80' : 'text-slate-400';
  if (pt.expectation === null) return 'text-slate-400';
  if (pt.band < pt.expectation) return 'text-rose-300/80';
  if (pt.band === pt.expectation) return 'text-sky-300/80';
  return 'text-emerald-300/80';
}

export { STATE_LABEL as SKILL_STATE_LABEL };
export type { Row as SkillBoardRow, CaseCard, Plan };
