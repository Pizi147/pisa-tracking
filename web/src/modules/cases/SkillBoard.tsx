import { useState } from 'react';
import { Empty, ErrorState, Level, SCORE_CHIP, SCORE_TEXT, Skeleton, Status, type ScoreTone } from '../../ui/ui.tsx';
import { fmtBand, fmtDate, sosLabel, sosTone } from '../../lib/format.ts';
import { api, invalidate } from '../../lib/api.ts';
import { useSession } from '../../lib/session.tsx';
import { useToast } from '../../ui/Toast.tsx';
import { Han } from '../../ui/Han.tsx';
import { ActionDialog, OutcomeDialog, ResultDialog } from './CasePanel.tsx';
import {
  OUTCOME_MARK, canEndWithOutcome, isContactKind, outcomeLabelFor, outcomesFor,
} from '@shared/domain/index.ts';

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
  updates: {
    on: string; outcome: string; label: string; by: string | null;
    /** Câu người dạy viết, chu kỳ nào, và có trễ hạn không — để mở lịch sử ngay tại dòng phương án. */
    note: string | null; cycleNo: number | null; late: boolean;
  }[];
};
type CaseCard = {
  id: number; title: string; status: string; track: string;
  urgency: string | null; sosLevel: number | null;
  carriedOver: boolean; parallel: boolean;
  openedOn: string | null; touchedOn: string | null;
  issueCode: string | null; issueLabel: string | null;
  summary: string | null; behaviour: boolean;
  canEdit: boolean;
  /** Người xem chốt được case không, và còn gì đang chặn — thẻ tự nói, không phải mở khối thứ hai. */
  canClose: boolean; closeBlockers: string[];
  plans: Plan[];
  reports: { on: string; by: string | null; skill: string | null; summary: string }[];
  attempts: { attemptNo: number; week: string | null }[];
  followUntil: string | null; followOverdue: boolean;
  outcomeLabel: string | null; outcomeNote: string | null; closedOn: string | null;
  /** NHẬP BÙ (PR-C Task 3, chốt 7) — ai ghi lại, ghi lúc nào. Null khi ghi tại chỗ như bình thường. */
  backfilledBy: string | null; backfilledOn: string | null;
};
export type Row = {
  category: string; label: string; short: string;
  band: number | null; bandAttemptNo: number | null; bandWeek: string | null;
  expectation: number | null; missed: boolean | null;
  /** Còn thiếu bao nhiêu để đạt kỳ vọng CỦA CHÍNH ĐỢT ĐÓ — đây là dấu ± hiện mặc định. */
  gap: number | null;
  /** Tăng giảm so với LƯỢT TRƯỚC — hiện bằng chữ trung tính, không phải mũi tên màu. */
  trend: number | null;
  trendFrom: number | null;
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

export function SkillBoard({ rows, loading, error, onRetry, selected, onPick, onReport, onChanged }: {
  rows: Row[] | null;
  loading?: boolean;
  error?: { message: string; hint?: string } | null;
  onRetry?: () => void;
  selected?: string | null;
  onPick: (category: string | null) => void;
  onReport?: (category: string) => void;
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
          onChanged={onChanged} />
      ))}
    </div>
  );
}

function SkillRow({ row, open, onToggle, onReport, onChanged }: {
  row: Row; open: boolean; onToggle: () => void;
  onReport?: (category: string) => void;
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
                <span className="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-[10px] text-slate-500">
                  <Han loai="xac-minh-sos" han={row.signal.verifyDue} />
                  {row.signal.ownerName && <span>{row.signal.ownerName}</span>}
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
            <CaseCardView key={c.id} c={c} row={row} onChanged={onChanged} />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * MỘT THẺ CASE — MỘT KHỐI DUY NHẤT cho một case (PR-D).
 *
 * Trước đây bấm "Lịch sử và kết thúc phương án" thì nhúng nguyên `CasePanel` xuống dưới thẻ:
 * hai khối, cùng một case, hai cách trình bày. Nay thẻ này là nơi DUY NHẤT: một dòng phân loại,
 * câu mô tả, rồi MỖI PHƯƠNG ÁN MỘT DÒNG có mũi tên mở lịch sử ngay tại dòng. Hai việc thật
 * — thêm phương án, hoàn thành case — là hai nút ở chân thẻ, gọi đúng hộp thoại `CasePanel`
 * vẫn dùng ở trang riêng, không viết luồng thứ hai.
 */
function CaseCardView({ c, row, onChanged }: {
  c: CaseCard; row: Row;
  onChanged?: () => void;
}) {
  const [open, setOpen] = useState(c.status !== 'done');
  const [adding, setAdding] = useState(false);
  const [completing, setCompleting] = useState(false);
  const skillLabel = row.label;
  const blocked = c.closeBlockers.length > 0;

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
          {/* NHẬP BÙ (mục 10.3 Step 5) — ghi rõ ngay trên thẻ case, không giấu trong tooltip. */}
          {c.backfilledOn && (
            <p className="text-[11px] text-amber-200/80 m-0">
              nhập bù{c.backfilledBy ? ` · ${c.backfilledBy}` : ''} ghi ngày {fmtDate(c.backfilledOn)}
            </p>
          )}
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

          {/* MỖI PHƯƠNG ÁN MỘT DÒNG — nhiều phương án song song thì nhiều dòng, mỗi dòng đóng/mở riêng. */}
          {c.plans.length === 0 ? (
            <p className="text-xs text-amber-200/90 m-0">Chưa có phương án nào — case này đang chờ người quyết.</p>
          ) : (
            <div className="rounded-lg border px-2.5 py-2" style={{ borderColor: 'var(--line)' }}>
              {c.plans.map((p) => (
                <PlanRow key={p.id} p={p} track={c.track} canEdit={c.canEdit} onChanged={onChanged} />
              ))}
            </div>
          )}

          {/* Kết luận của case đã hoàn thành — đọc lại được, không bị giấu. */}
          {c.status === 'done' && (c.outcomeLabel || c.outcomeNote) && (
            <p className="text-xs text-slate-300 m-0">
              Kết luận{c.outcomeLabel && <>: <strong>{c.outcomeLabel}</strong></>}
              {c.closedOn && <span className="text-slate-500"> · {fmtDate(c.closedOn)}</span>}
              {c.outcomeNote && <span className="block text-slate-400 mt-0.5">{c.outcomeNote}</span>}
            </p>
          )}

          {(c.attempts.length > 0 || (c.followUntil && c.status !== 'done')) && (
            <div className="flex flex-wrap items-center gap-1.5">
              {c.attempts.map((a) => (
                <Chip key={a.attemptNo}>MT{a.attemptNo}{a.week ? ` · ${fmtDate(a.week)}` : ''}</Chip>
              ))}
              {/* NGHĨA VỤ CẬP NHẬT KẾT QUẢ hằng tuần — một đồng hồ riêng, không lẫn với "dự kiến kết thúc" (F11). */}
              {c.followUntil && c.status !== 'done' && <Han loai="cap-nhat-pa" han={c.followUntil} />}
            </div>
          )}

          {/* CHÂN THẺ — trạng thái và hai việc thật, cùng một dòng (Step 3). */}
          <div className="space-y-1.5">
            {c.status !== 'done' && c.plans.length > 0 && (
              <p className="text-sm text-slate-400 m-0">Case đang xử lý, chưa kết luận.</p>
            )}
            {c.canEdit && (
              <div className="flex flex-wrap items-center gap-2">
                <button type="button" className="btn btn-sm" onClick={() => setAdding(true)}>
                  + Thêm phương án
                </button>
                {c.status !== 'done' && (
                  <button type="button" className="btn btn-sm btn-primary"
                    disabled={blocked || !c.canClose}
                    title={!c.canClose
                      ? 'Chỉ giáo viên chủ nhiệm của lớp và Quản lý mới hoàn thành được case.'
                      : undefined}
                    onClick={() => setCompleting(true)}>
                    Hoàn thành case
                  </button>
                )}
              </div>
            )}
            {/* NÓI RÕ CÒN THIẾU GÌ ngay tại chỗ — một nút mờ không giải thích là nút bị coi là hỏng. */}
            {c.canEdit && c.status !== 'done' && blocked && (
              <div className="text-xs text-slate-400">
                <strong className="text-slate-300">Chưa hoàn thành case được.</strong>
                <ul className="list-disc pl-5 mt-1 mb-0">
                  {c.closeBlockers.map((b) => <li key={b}>{b}</li>)}
                </ul>
              </div>
            )}
            {c.canEdit && c.status !== 'done' && !c.canClose && (
              <p className="text-xs text-slate-500 m-0">
                Chỉ giáo viên chủ nhiệm của lớp và Quản lý mới hoàn thành case được. Bạn vẫn cập
                nhật được kết quả của từng phương án.
              </p>
            )}
          </div>

          <ActionDialog open={adding} onClose={() => setAdding(false)} caseId={c.id}
            track={c.track ?? 'academic'} onDone={() => onChanged?.()} />
          <OutcomeDialog open={completing} onClose={() => setCompleting(false)} caseId={c.id}
            track={c.track ?? 'academic'} category={row.category} categoryLabel={row.label}
            ratio={row.ratio} onDone={() => onChanged?.()} />
        </div>
      )}
    </div>
  );
}

/**
 * MỘT PHƯƠNG ÁN — MỘT DÒNG, ghi kết quả NGAY TRONG DÒNG ĐÓ, và lịch sử mở TẠI DÒNG (PR-D).
 *
 * Một dòng nói đủ: phương án là gì · ai làm · hạn · kết quả gần nhất. Mũi tên ở đầu dòng mở
 * lịch sử cập nhật của CHÍNH phương án này — không phải của cả case. ĐÓNG MẶC ĐỊNH: một em
 * có năm case thì mở hết là một trang cuộn vô tận (sổ CASE-08: "không mở tất cả mặc định").
 *
 * Hạn LÀM và hạn DỰ KIẾN XONG vẫn là hai mốc khác nhau và vẫn có nhãn riêng — gộp thành
 * "hạn 30/08" thì người đọc không biết mình đang trễ việc gì.
 */
function PlanRow({ p, track, canEdit, onChanged }: {
  p: Plan; track: string; canEdit: boolean; onChanged?: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const running = p.status === 'planned' || p.status === 'started';
  /* Việc TRAO ĐỔI (gặp em, gọi phụ huynh) không có kết quả chuyên môn — chỉ xác nhận đã làm. */
  const contact = isContactKind(p.kind);
  const historyId = `plan-${p.id}-history`;
  /* Mới nhất lên trên: người mở hỏi "giờ đang thế nào", không hỏi "tháng trước bắt đầu ra sao". */
  const updates = [...p.updates].reverse();

  return (
    <div className="border-t first:border-t-0 py-2 first:pt-0 last:pb-0" style={{ borderColor: 'var(--line)' }}>
      <div className="grid gap-x-2 gap-y-1 items-start grid-cols-[1.25rem_minmax(0,1fr)_auto]">
        <button type="button" aria-expanded={showHistory} aria-controls={historyId}
          aria-label={showHistory ? 'Đóng lịch sử phương án' : 'Mở lịch sử phương án'}
          onClick={() => setShowHistory(!showHistory)}
          className="appearance-none bg-transparent border-0 p-0 cursor-pointer text-xs leading-5 text-slate-400 text-left">
          {showHistory ? '▾' : '▸'}
        </button>

        <div className="min-w-0">
          <span className={`block text-sm leading-snug ${running ? 'text-slate-100' : 'text-slate-300'}`}>
            <span aria-hidden className={`mr-1.5 text-xs ${running ? 'text-sky-300' : 'text-emerald-300'}`}>
              {running ? '▶' : '✓'}
            </span>
            {p.name}
          </span>
          <span className="block text-[11px] text-slate-500 mt-0.5">
            {p.performer ?? 'chưa có người thực hiện'}
            {p.startedOn && <> · từ {fmtDate(p.startedOn)}</>}
            {p.completedOn && <> → {fmtDate(p.completedOn)}</>}
            {running && !contact && !p.lastOutcomeLabel && <> · chưa có kết quả</>}
          </span>
        </div>

        <div className="flex flex-col items-end gap-1 text-right">
          {p.pendingApproval ? (
            <>
              <span className="text-[11px] text-sky-300">Chờ Quản lý trả lời</span>
              {p.approvalDue && (
                <span className="text-[11px] text-slate-500">hạn {fmtDate(p.approvalDue)}</span>
              )}
            </>
          ) : (
            <>
              {p.lastOutcomeLabel && (
                <span className={`text-[11px] rounded px-1.5 py-0.5 border whitespace-nowrap ${outcomeTone(p.lastOutcome)}`}
                  style={{ borderColor: 'var(--line)' }}>
                  {OUTCOME_MARK[p.lastOutcome ?? ''] ?? ''} {p.lastOutcomeLabel}
                  <span className="text-slate-500"> · {fmtDate(p.lastOutcomeOn)}</span>
                </span>
              )}
              {contact && !running && !p.lastOutcomeLabel && (
                <span className="text-[11px] text-slate-400">
                  {p.statusLabel}{p.completedOn ? ` · ${fmtDate(p.completedOn)}` : ''}
                </span>
              )}
              {running && <PlanDue p={p} />}
              {running && canEdit && !editing && (
                <button type="button" className="btn btn-sm" onClick={() => setEditing(true)}>
                  {contact ? 'Đánh dấu đã làm' : 'Ghi kết quả'}
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {showHistory && (
        <ol id={historyId} className="list-none m-0 mt-2 ml-[0.6rem] pl-3 space-y-2 border-l"
          style={{ borderColor: 'var(--line)' }}>
          {p.completedOn && !running && (
            <li className="text-[11px] text-slate-400 tabular-nums">
              {fmtDate(p.completedOn)} · kết thúc phương án
            </li>
          )}
          {updates.map((u, i) => (
            <li key={`${u.on}-${i}`}>
              <span className="block text-[11px] text-slate-500 tabular-nums">
                {fmtDate(u.on)}
                {u.cycleNo ? ` · chu kỳ ${u.cycleNo}` : ''}
                {' · '}
                <span className={outcomeTone(u.outcome)}>{OUTCOME_MARK[u.outcome] ?? ''} {u.label}</span>
                {u.late && <span className="text-amber-300"> · ⚠ cập nhật trễ</span>}
                {u.by && <span> · {u.by} ghi</span>}
              </span>
              {u.note && <span className="block text-xs text-slate-300 mt-0.5 leading-relaxed">“{u.note}”</span>}
            </li>
          ))}
          {p.startedOn && (
            <li className="text-[11px] text-slate-500 tabular-nums">{fmtDate(p.startedOn)} · bắt đầu thực hiện</li>
          )}
          {updates.length === 0 && !p.startedOn && (
            <li className="text-[11px] text-slate-500">Chưa có cập nhật nào cho phương án này.</li>
          )}
        </ol>
      )}

      {editing && (
        <InlineResult p={p} track={track} contact={contact}
          onClose={() => setEditing(false)} onDone={() => onChanged?.()} />
      )}
    </div>
  );
}

/**
 * HẠN LÀM và NGÀY DỰ KIẾN XONG — hai mốc, hai loại, không gộp (F11).
 *
 * "Dự kiến kết thúc" từng bị trình bày như một hạn phải làm — tô đỏ, đếm "quá hạn" — dù không ai trễ một ngày dự kiến.
 * Nay đi qua `<Han>`: hạn làm là hạn thật; ngày dự kiến xong LUÔN trung tính.
 */
function PlanDue({ p }: { p: Plan }) {
  if (!p.actionDue && !p.followupDue) {
    return <span className="text-[11px] text-slate-600">chưa đặt hạn</span>;
  }
  return (
    <span className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[11px]">
      {p.actionDue && <Han loai="thuc-hien-y-thuc" han={p.actionDue} />}
      {p.followupDue && <Han loai="du-kien-ket-thuc" han={p.followupDue} />}
    </span>
  );
}

/**
 * GHI KẾT QUẢ NGAY TRONG DÒNG PHƯƠNG ÁN — không ngăn kéo, không sang trang (PR-D Step 5).
 *
 * MỘT panel, HAI lựa chọn, MỘT nút chính đổi chữ theo lựa chọn — không phải hai nút cạnh nhau:
 *
 *   · Ghi kết quả, tiếp tục theo dõi — ghi một chu kỳ, phương án VẪN CHẠY.
 *   · Hoàn thành phương án — thêm ngày kết thúc, phương án đóng lại.
 *
 * Luật của máy chủ giữ nguyên: chỉ kết quả TỐT (có tiến bộ / tiến bộ một phần) mới khép được
 * một phương án suông; "Chưa đủ dữ liệu" không khép được. Kết quả chưa tốt thì BẮT BUỘC đi
 * tiếp bằng phương án khác hoặc xin Quản lý — đường đó vẫn có, mở qua hộp thoại đầy đủ,
 * không bị mất chỉ vì khối nhúng cũ đã gỡ.
 *
 * KHÔNG CÓ Ô ĐIỂM TỰ CHẤM (CASE-05): bốn kỹ năng L/R/W/S cho một case Listening là vô lý. Điểm
 * tự chấm đã lưu từ trước vẫn đọc được.
 */
function InlineResult({ p, track, contact, onClose, onDone }: {
  p: Plan; track: string; contact: boolean;
  onClose: () => void; onDone: () => void;
}) {
  const { session } = useSession();
  const toast = useToast();
  const today = session?.demoDate ?? '';
  const [mode, setMode] = useState<'monitor' | 'end'>('monitor');
  const [outcome, setOutcome] = useState('');
  const [note, setNote] = useState('');
  const [on, setOn] = useState(today);
  const [endOn, setEndOn] = useState(today);
  const [busy, setBusy] = useState(false);
  const [full, setFull] = useState(false);

  const ending = mode === 'end';
  const outcomes = outcomesFor(track).filter((o) => !ending || canEndWithOutcome(o));
  /* Kết thúc suông chỉ dành cho kết quả tốt; kết quả chưa tốt phải nói đi tiếp thế nào. */
  const goodOutcome = outcome === 'improved' || outcome === 'partial';
  const mustContinue = ending && !!outcome && !goodOutcome;
  const noteOk = note.trim().length >= 8;
  const ready = contact ? true : !!outcome && noteOk && !mustContinue;

  const pickMode = (m: 'monitor' | 'end') => {
    setMode(m);
    /* "Chưa đủ dữ liệu" không kết thúc được phương án — bỏ chọn khi đổi sang kết thúc. */
    if (m === 'end' && outcome && !canEndWithOutcome(outcome)) setOutcome('');
  };

  const save = async () => {
    setBusy(true);
    try {
      if (contact) {
        await api.post(`/interventions/${p.id}/complete`, {
          doneOn: on, note: note.trim() || null,
        });
      } else if (ending) {
        await api.post(`/interventions/${p.id}/result`, {
          mode: 'end', outcome, note, observedOn: on, completedOn: endOn, nextStep: 'complete',
        });
      } else {
        await api.post(`/interventions/${p.id}/result`, {
          mode: 'monitor', outcome, note, observedOn: on,
        });
      }
      invalidate('/cases'); invalidate('/my-work');
      invalidate('/students'); invalidate('/overview');
      toast.push('ok', contact ? 'Đã ghi nhận'
        : ending ? 'Đã hoàn thành phương án'
        : 'Đã ghi kết quả — phương án vẫn đang chạy');
      onDone(); onClose();
    } catch (e: any) {
      toast.push('error', e?.message ?? 'Không lưu được');
    } finally { setBusy(false); }
  };

  return (
    <div className="rounded-lg mt-2 ml-5 p-2.5 space-y-2" style={{ background: 'var(--surface-1)' }}>
      {!contact && (
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Cách ghi">
          <button type="button" aria-pressed={!ending}
            className={`btn btn-sm ${!ending ? 'btn-primary' : ''}`} onClick={() => pickMode('monitor')}>
            Ghi kết quả, tiếp tục theo dõi
          </button>
          <button type="button" aria-pressed={ending}
            className={`btn btn-sm ${ending ? 'btn-primary' : ''}`} onClick={() => pickMode('end')}>
            Hoàn thành phương án
          </button>
        </div>
      )}

      {!contact && (
        <>
          <span className="block text-[11px] text-slate-400">Chu kỳ vừa rồi em thế nào</span>
          <div className="flex flex-wrap gap-1.5">
            {outcomes.map((o) => (
              <button key={o} type="button"
                className={`btn btn-sm ${outcome === o ? 'btn-primary' : ''}`}
                onClick={() => setOutcome(o)}>
                {OUTCOME_MARK[o] ?? ''} {outcomeLabelFor(track, o)}
              </button>
            ))}
          </div>
        </>
      )}

      <textarea className="field w-full" rows={2} value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder={contact
          ? 'Đã trao đổi những gì (không bắt buộc)'
          : 'Tiến bộ ở đâu, còn kẹt chỗ nào, tuần tới làm gì'} />
      {!contact && note.length > 0 && !noteOk && (
        <span className="block text-[11px] text-rose-300">
          Ghi chú phải nói rõ quan sát được gì — ít nhất 8 ký tự.
        </span>
      )}

      {mustContinue && (
        <p className="text-[11px] text-amber-200/90 m-0">
          Kết quả chưa tốt thì không khép lại suông được — phải nói rõ đi tiếp thế nào.{' '}
          <button type="button" className="btn btn-sm ml-1" onClick={() => setFull(true)}>
            Thay bằng phương án khác hoặc nhờ Quản lý
          </button>
        </p>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
          <label className="flex items-center gap-1.5 text-[11px] text-slate-400">
            {contact ? 'Ngày làm' : 'Ngày ghi'}
            <input type="date" className="field" style={{ width: '9.5rem' }}
              value={on} max={today} onChange={(e) => setOn(e.target.value)} />
          </label>
          {ending && (
            <label className="flex items-center gap-1.5 text-[11px] text-slate-400">
              Ngày kết thúc
              <input type="date" className="field" style={{ width: '9.5rem' }}
                value={endOn} max={today} onChange={(e) => setEndOn(e.target.value)} />
            </label>
          )}
        </span>
        <span className="flex gap-1.5">
          <button type="button" className="btn btn-sm" onClick={onClose} disabled={busy}>Huỷ</button>
          <button type="button" className="btn btn-sm btn-primary"
            disabled={busy || !ready || (ending && !endOn)} onClick={save}>
            {busy ? 'Đang lưu…' : contact ? 'Lưu' : ending ? 'Hoàn thành phương án' : 'Lưu, tiếp tục theo dõi'}
          </button>
        </span>
      </div>

      {!contact && (
        <p className="text-[11px] text-slate-500 m-0">
          {ending
            ? 'Phương án đóng lại. Case chỉ hoàn thành được khi mọi phương án đã khép.'
            : <>Lưu xong phương án <strong>vẫn đang chạy</strong>; lần cập nhật sau đến hạn vào Chủ nhật kế tiếp.</>}
        </p>
      )}

      <ResultDialog
        iv={full ? { id: p.id, kind: p.kind, description: p.name, actionDue: p.actionDue, followupDue: p.followupDue } : null}
        track={track} startMode="end"
        onClose={() => setFull(false)}
        onDone={() => { onDone(); onClose(); }} />
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
/**
 * MỘT LƯỢT, HAI CÂU HỎI KHÁC NHAU (chốt 17/09, sửa lại 18/09 vì PR18 làm sai):
 *
 *   `gap`   khoảng cách tới KỲ VỌNG CỦA CHÍNH ĐỢT ĐÓ — dấu ± hiện mặc định, tô theo bốn màu.
 *   `trend` tăng giảm so với LƯỢT TRƯỚC — chỉ để biết xu hướng, nên chữ TRUNG TÍNH. Một điểm
 *           còn dưới kỳ vọng mà tô mũi tên xanh vì nó nhích lên là khen sớm.
 */
function ScoreCell({ row }: { row: Row }) {
  const chip = scoreTone(row);
  if (row.band === null) {
    return (
      <div className="whitespace-nowrap">
        <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-base font-bold ${chip}`}>—</span>
        <span className="block text-[10px] text-slate-600 mt-0.5">chưa có dữ liệu</span>
      </div>
    );
  }
  const value = row.ratio && row.total ? `${row.score}/${row.total}` : fmtBand(row.band);
  const g = row.gap;
  const t = row.trend;
  return (
    <div className="whitespace-nowrap">
      <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-base font-bold tabular-nums ${chip}`}>
        {value}
      </span>
      {!row.ratio && g !== null && (
        <span className={`text-[11px] ml-1.5 font-medium ${scoreToneText(row)}`}>{gapText(g)}</span>
      )}
      <span className="block text-[10px] text-slate-500 mt-0.5">
        {row.bandAttemptNo ? (row.ratio ? row.bandWeek ?? '' : `MT${row.bandAttemptNo}`) : ''}
        {row.ratio
          ? (row.missed === false ? ' · đạt' : row.missed === true ? ' · chưa đạt' : '')
          : row.expectation !== null ? ` · kỳ vọng ${fmtBand(row.expectation)}` : ''}
      </span>
      {!row.ratio && t !== null && row.trendFrom !== null && (
        <span className="block text-[10px] text-slate-500">
          {t > 0 ? `Tăng ${t}` : t < 0 ? `Giảm ${Math.abs(t)}` : 'Không đổi'} so với MT{row.trendFrom}
        </span>
      )}
    </div>
  );
}

function gapText(gap: number): string {
  if (gap === 0) return 'đạt kỳ vọng';
  return gap < 0 ? `thiếu ${Math.abs(gap)}` : `vượt ${gap}`;
}

/* Bảng bốn màu điểm nằm ở MỘT chỗ duy nhất: `ui.tsx` (SCORE_CHIP / SCORE_TEXT). */
function scoreToneFamily(row: Row): ScoreTone {
  if (row.band === null) return 'slate';
  if (row.ratio) {
    if (row.missed === null) return 'slate';
    return row.missed ? 'rose' : 'emerald';
  }
  if (row.expectation === null) return 'slate';
  if (row.band < row.expectation) return 'rose';
  if (row.band === row.expectation) return 'sky';
  return 'emerald';
}

/**
 * Dưới kỳ vọng đỏ · bằng xanh dương · vượt xanh lá · thiếu dữ liệu xám.
 *
 * CHIP CÓ NỀN thay vì chữ màu trơn — chữ màu trên nền tối (bản trước) tương phản yếu, theo
 * yêu cầu riêng của chủ sản phẩm. Cùng bốn màu, chỉ đổi cách tô — dùng đúng kiểu chip đã có
 * ở `Status`/`Alert` phía trên: viền + nền nhạt cùng họ màu + chữ đậm.
 */
function scoreTone(row: Row): string {
  return SCORE_CHIP[scoreToneFamily(row)];
}

/** Chữ trơn cùng họ màu — dùng cho dòng phụ ngắn cạnh số điểm (không phải chip). */
function scoreToneText(row: Row): string {
  return SCORE_TEXT[scoreToneFamily(row)];
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
