import { useState } from 'react';
import { Empty, ErrorState, Level, SCORE_CHIP, SCORE_TEXT, Skeleton, Status, type ScoreTone } from '../../ui/ui.tsx';
import { fmtBand, fmtDate, sosLabel, sosTone } from '../../lib/format.ts';
import { api, invalidate } from '../../lib/api.ts';
import { useSession } from '../../lib/session.tsx';
import { useToast } from '../../ui/Toast.tsx';
import { Han } from '../../ui/Han.tsx';
import { BangChung } from '../../ui/BangChung.tsx';
import { ActionDialog, OutcomeDialog, ResultDialog } from './CasePanel.tsx';
import { CauseDeterminationPanel, DismissCaseForm, PresetPlanActions } from '../yThuc/CaseSosControls.tsx';
import {
  FOLLOWUP_OUTCOMES, OUTCOME_MARK, canEndWithOutcome, dangChay, outcomeLabelFor, tienDoCase, viecTiepPhuongAn,
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
  /** Phương án điền sẵn từ SOS (§3.2, PR-K) chưa ai xác nhận: hiện `Gợi ý tự động · chờ xác nhận` + Xác nhận/Sửa/Thay. */
  preset: boolean; confirmedAt: string | null;
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
  id: number; title: string; status: string;
  /** Chủ đề gốc của case (§7.5, PR-K) — để mở đúng danh mục phân loại khi "Xác định nguyên nhân". */
  topic: string | null;
  /** Case tự tạo từ SOS còn chờ xác định nguyên nhân / xác nhận phương án điền sẵn (§3.2, §7.5, PR-K). */
  sos: {
    fromSos: boolean; hasCause: boolean; unconfirmedPlanId: number | null;
    awaitingCause: boolean; dueOn: string | null;
    dismissed: { code: string; label: string; text: string | null } | null;
  };
  urgency: string | null; sosLevel: number | null;
  carriedOver: boolean; parallel: boolean;
  openedOn: string | null; touchedOn: string | null;
  issueCode: string | null; issueLabel: string | null;
  summary: string | null;
  canEdit: boolean;
  /** Người xem chốt được case không, và còn gì đang chặn — thẻ tự nói, không phải mở khối thứ hai. */
  canClose: boolean; closeBlockers: string[];
  plans: Plan[];
  attempts: { attemptNo: number; week: string | null }[];
  followUntil: string | null; followOverdue: boolean;
  outcomeLabel: string | null; outcomeNote: string | null; closedOn: string | null;
  /** NHẬP BÙ (PR-C Task 3, chốt 7) — ai ghi lại, ghi lúc nào. Null khi ghi tại chỗ như bình thường. */
  backfilledBy: string | null; backfilledOn: string | null;
  /** Số bằng chứng của case (PR-HV) — nhãn "Bằng chứng (n)" thu gọn. */
  attachmentCount: number;
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
            <TheCase key={c.id} c={c} row={row} onChanged={onChanged} />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * MỘT THẺ CASE — KIỂU THẺ SOS (PR-HV Q8, spec 2026-09-22 §4.2).
 *
 * Đầu thẻ 3 cột bấm mở/đóng: `{kỹ năng} · {tên}` + phân loại/ngày mở · `{k}/{n} PA có kết quả` + việc gần nhất có hạn ·
 * nhãn (SOS mức / Đang xử lý / Đã hoàn thành / Không cần theo dõi). Thân thẻ: khối chờ xác định nguyên nhân (nếu có),
 * mô tả, MỖI PHƯƠNG ÁN MỘT KHỐI BA PHẦN (`KhoiPhuongAn`) — PA đang chạy không bao giờ ẩn, PA đã xong thu gọn —, Bằng
 * chứng thu gọn, kết luận, dãy MT, và CHÂN THẺ gom mọi nút (lý do chưa hoàn thành nói cạnh nút mờ).
 *
 * Hai việc thật — thêm phương án, hoàn thành case — vẫn gọi đúng hộp thoại `CasePanel` dùng ở trang riêng, không viết
 * luồng thứ hai. Mở mặc định: case chưa xong; đóng mặc định: case đã xong.
 */
function TheCase({ c, row, onChanged }: {
  c: CaseCard; row: Row;
  onChanged?: () => void;
}) {
  const [open, setOpen] = useState(c.status !== 'done');
  const [adding, setAdding] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [causeOpen, setCauseOpen] = useState(false);
  const [dismissOpen, setDismissOpen] = useState(false);
  const [moXong, setMoXong] = useState(c.status === 'done');
  const [moBangChung, setMoBangChung] = useState(false);
  const blocked = c.closeBlockers.length > 0;
  const td = tienDoCase(c.plans, c);
  const chay = c.plans.filter(dangChay);
  const xong = c.plans.filter((p) => !dangChay(p));

  return (
    <div className="rounded-lg border" style={{ borderColor: 'var(--line)', background: 'var(--surface-2)' }}>
      <button type="button" onClick={() => setOpen(!open)} aria-expanded={open}
        className="w-full text-left appearance-none bg-transparent border-0 cursor-pointer">
        <span className="grid gap-x-3 gap-y-1 items-center px-3 py-2.5 grid-cols-2 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_auto]">
          <span className="col-span-2 md:col-span-1 min-w-0 flex items-start gap-2">
            <span className="text-slate-500 text-xs select-none mt-0.5" aria-hidden
              style={{ transform: open ? 'rotate(90deg)' : 'none', display: 'inline-block' }}>›</span>
            <span className="min-w-0">
              <span className="block text-sm text-slate-100 break-words">{row.label} · {c.title}</span>
              <span className="block text-[11px] text-slate-500">
                {c.issueLabel ?? 'Chưa phân loại vấn đề'}{c.openedOn ? ` · mở ${fmtDate(c.openedOn)}` : ''}
              </span>
            </span>
          </span>
          <span className="min-w-0">
            <span className={`block text-xs font-semibold ${td.tong === 0 ? 'text-amber-200' : 'text-slate-200'}`}>{td.text}</span>
            {td.tiep ? (
              <span className={`block text-[11px] ${td.tiep.overdue ? 'text-rose-300' : 'text-slate-500'}`}>
                {td.tiep.text}{td.tiep.due ? `: hạn ${fmtDate(td.tiep.due)}` : ''}{td.tiep.overdue ? ' · quá hạn' : ''}
              </span>
            ) : c.status === 'done' && c.outcomeLabel ? (
              <span className="block text-[11px] text-slate-500">Kết luận: {c.outcomeLabel}</span>
            ) : null}
          </span>
          <span className="justify-self-end flex flex-col items-end gap-1">
            {c.sos.dismissed
              ? <Status kind="done">Không cần theo dõi · {c.sos.dismissed.label}</Status>
              : c.status === 'done'
                ? <Status kind="done">Đã hoàn thành</Status>
                : (
                  <>
                    {c.sosLevel !== null && c.sosLevel > 0 && <Level tone={sosTone(c.sosLevel)}>{sosLabel(c.sosLevel)}</Level>}
                    <Status kind="doing">Đang xử lý</Status>
                  </>
                )}
          </span>
        </span>
      </button>

      {open && (
        <div className="px-3 pb-3 space-y-2.5">
          {/* CASE TỪ SOS CHỜ XÁC ĐỊNH NGUYÊN NHÂN (§7.5, S04, PR-K) — hạn 3 ngày, chỉ hiện khi còn chờ. */}
          {c.sos.awaitingCause && (
            <div className="rounded-lg border px-2.5 py-2 space-y-1.5" style={{ borderColor: 'var(--warn)', background: 'rgba(240, 201, 135, 0.08)' }}>
              <p className="text-xs text-amber-100 m-0">
                Chờ GVBM xác định nguyên nhân{c.sos.dueOn && ` · hạn ${fmtDate(c.sos.dueOn)}`}
              </p>
              {c.canEdit && !causeOpen && !c.sos.hasCause && (
                <button type="button" className="btn btn-sm btn-primary" onClick={() => setCauseOpen(true)}>
                  Xác định nguyên nhân
                </button>
              )}
              {causeOpen && (
                <CauseDeterminationPanel caseId={c.id} topic={c.topic} currentCode={c.issueCode}
                  onClose={() => setCauseOpen(false)} onDone={onChanged} />
              )}
            </div>
          )}
          {/* CASE ĐÓNG "KHÔNG CẦN THEO DÕI" (§3.2, S05, K2-4) — chữ tự gõ của lý do Khác chỉ hiện ở đây. */}
          {c.sos.dismissed && (
            <p className="text-xs text-slate-300 m-0">
              Không cần theo dõi · {c.sos.dismissed.text || c.sos.dismissed.label}
            </p>
          )}
          {(c.carriedOver || c.parallel || c.backfilledOn) && (
            <p className="text-[11px] text-slate-500 m-0 flex flex-wrap gap-x-1.5">
              {c.carriedOver && <span>từ lộ trình trước</span>}
              {c.parallel && <span>case song song</span>}
              {/* NHẬP BÙ (mục 10.3 Step 5) — ghi rõ ngay trên thẻ case, không giấu trong tooltip. */}
              {c.backfilledOn && (
                <span className="text-amber-200/80">
                  nhập bù{c.backfilledBy ? ` · ${c.backfilledBy}` : ''} ghi ngày {fmtDate(c.backfilledOn)}
                </span>
              )}
            </p>
          )}
          {c.summary && (
            <p className="text-sm text-slate-300 m-0 leading-relaxed break-words">
              <span className="text-slate-500">Mô tả: </span>{c.summary}
            </p>
          )}

          {/* MỖI PHƯƠNG ÁN MỘT KHỐI BA PHẦN — PA đang chạy luôn hiện; PA đã xong thu gọn sau một nút. */}
          {c.plans.length === 0 ? (
            <p className="text-xs text-amber-200/90 m-0">Chưa có phương án nào — case này đang chờ người quyết.</p>
          ) : (
            <div className="space-y-1.5">
              <div className="hidden md:grid md:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_minmax(0,1fr)] gap-x-3 px-2.5 text-[10px] uppercase tracking-wide text-slate-500">
                <span>Phương án</span><span>Kết quả gần nhất</span><span>Việc tiếp theo</span>
              </div>
              {chay.map((p) => (
                <KhoiPhuongAn key={p.id} p={p} canEdit={c.canEdit} onChanged={onChanged} />
              ))}
              {xong.length > 0 && (
                <>
                  <button type="button" className="btn btn-sm btn-ghost" aria-expanded={moXong} onClick={() => setMoXong(!moXong)}>
                    {moXong ? '▾' : '▸'} {xong.length} PA đã xong
                  </button>
                  {moXong && xong.map((p) => (
                    <KhoiPhuongAn key={p.id} p={p} canEdit={c.canEdit} onChanged={onChanged} />
                  ))}
                </>
              )}
            </div>
          )}

          {/*
            BẰNG CHỨNG CỦA CASE (CASE-04, PR-N) — thu gọn sau nhãn "Bằng chứng (n)"; số là số lúc tải bảng (J10). Khối có
            trạng thái riêng — lỗi tải tệp không đụng tới ô nào đang nhập ở thẻ này.
          */}
          <div>
            <button type="button" className="btn btn-sm btn-ghost" aria-expanded={moBangChung} onClick={() => setMoBangChung(!moBangChung)}>
              {moBangChung ? '▾' : '▸'} Bằng chứng ({c.attachmentCount})
            </button>
            {moBangChung && (
              <div className="mt-1.5">
                <BangChung ownerType="sos_case" ownerId={c.id} canEdit={c.canEdit} tieuDe="" />
              </div>
            )}
          </div>

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

          {/* CHÂN THẺ — mọi nút gom ở đây; lý do chưa hoàn thành nói NGAY CẠNH nút mờ. */}
          <div className="space-y-1.5">
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
                {/* `Không cần theo dõi` (S05, Q-V3-4) — chỉ case tự tạo từ SOS còn chờ xác định nguyên nhân. */}
                {c.sos.awaitingCause && !dismissOpen && (
                  <button type="button" className="btn btn-sm btn-ghost" onClick={() => setDismissOpen(true)}>
                    Không cần theo dõi
                  </button>
                )}
                {c.status !== 'done' && blocked && (
                  <span className="text-xs text-slate-400">Chưa hoàn thành: {c.closeBlockers.join(' · ')}</span>
                )}
              </div>
            )}
            {dismissOpen && (
              <DismissCaseForm caseId={c.id} onClose={() => setDismissOpen(false)} onDone={onChanged} />
            )}
            {c.canEdit && c.status !== 'done' && !c.canClose && (
              <p className="text-xs text-slate-500 m-0">
                Chỉ giáo viên chủ nhiệm của lớp và Quản lý mới hoàn thành case được. Bạn vẫn cập
                nhật được kết quả của từng phương án.
              </p>
            )}
          </div>

          <ActionDialog open={adding} onClose={() => setAdding(false)} caseId={c.id}
            onDone={() => onChanged?.()} />
          <OutcomeDialog open={completing} onClose={() => setCompleting(false)} caseId={c.id}
            category={row.category} categoryLabel={row.label}
            ratio={row.ratio} onDone={() => onChanged?.()} />
        </div>
      )}
    </div>
  );
}

/**
 * MỘT PHƯƠNG ÁN — MỘT KHỐI BA PHẦN (PR-HV Q8): Phương án (tên · người · từ ngày; mũi tên mở lịch sử tại chỗ) · Kết quả
 * gần nhất (nhãn + ghi chú, KHÔNG cắt) · Việc tiếp theo (gợi ý chờ xác nhận / chờ Quản lý / Ghi kết quả + hạn / Đã kết
 * thúc). Trên 375px ba phần xếp dọc, phần 2–3 có nhãn nhỏ. Lịch sử và ô Ghi kết quả mở DƯỚI lưới, rộng hết khối.
 *
 * Hạn LÀM và hạn DỰ KIẾN XONG vẫn là hai mốc khác nhau và vẫn có nhãn riêng (`<PlanDue>`, F11). Dấu ✓ của PA đã xong
 * màu xám — xanh lá chỉ dành cho kết quả học tập (`<Outcome>`).
 */
function KhoiPhuongAn({ p, canEdit, onChanged }: {
  p: Plan; canEdit: boolean; onChanged?: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const running = dangChay(p);
  const historyId = `plan-${p.id}-history`;
  /* Mới nhất lên trên: người mở hỏi "giờ đang thế nào", không hỏi "tháng trước bắt đầu ra sao". */
  const updates = [...p.updates].reverse();
  const v = viecTiepPhuongAn(p);

  return (
    <div className="rounded-lg border px-2.5 py-2" style={{ borderColor: 'var(--line)' }}>
      <div className="grid gap-x-3 gap-y-2 md:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_minmax(0,1fr)]">
        {/* 1 · Phương án */}
        <div className="min-w-0 flex items-start gap-1.5">
          <button type="button" aria-expanded={showHistory} aria-controls={historyId}
            aria-label={showHistory ? 'Đóng lịch sử phương án' : 'Mở lịch sử phương án'}
            onClick={() => setShowHistory(!showHistory)}
            className="appearance-none bg-transparent border-0 p-0 cursor-pointer text-xs leading-5 text-slate-400 text-left shrink-0">
            {showHistory ? '▾' : '▸'}
          </button>
          <span className="min-w-0">
            <span className={`block text-sm leading-snug break-words ${running ? 'text-slate-100' : 'text-slate-300'}`}>
              <span aria-hidden className={`mr-1.5 text-xs ${running ? 'text-sky-300' : 'text-slate-400'}`}>
                {running ? '▶' : '✓'}
              </span>
              {p.name}
            </span>
            <span className="block text-[11px] text-slate-500 mt-0.5">
              {p.performer ?? 'chưa có người thực hiện'}
              {p.startedOn && <> · từ {fmtDate(p.startedOn)}</>}
              {p.completedOn && <> → {fmtDate(p.completedOn)}</>}
            </span>
          </span>
        </div>

        {/* 2 · Kết quả gần nhất */}
        <div className="min-w-0">
          <span className="md:hidden block text-[10px] uppercase tracking-wide text-slate-500">Kết quả gần nhất</span>
          {p.lastOutcomeLabel ? (
            <>
              <span className={`inline-block text-[11px] rounded px-1.5 py-0.5 border ${outcomeTone(p.lastOutcome)}`}
                style={{ borderColor: 'var(--line)' }}>
                {OUTCOME_MARK[p.lastOutcome ?? ''] ?? ''} {p.lastOutcomeLabel}
                <span className="text-slate-500"> · {fmtDate(p.lastOutcomeOn)}</span>
              </span>
              {p.lastNote && <span className="block text-xs text-slate-300 mt-1 leading-relaxed break-words">{p.lastNote}</span>}
            </>
          ) : <span className="text-xs text-slate-500">Chưa có kết quả</span>}
        </div>

        {/* 3 · Việc tiếp theo */}
        <div className="min-w-0 flex flex-col items-start gap-1">
          <span className="md:hidden block text-[10px] uppercase tracking-wide text-slate-500">Việc tiếp theo</span>
          {v.loai === 'goi-y' ? (
            <>
              <span className="text-[11px] text-amber-200/80">{v.text}</span>
              {canEdit && <PresetPlanActions interventionId={p.id} description={p.name} followupDue={p.followupDue} onDone={onChanged} />}
            </>
          ) : v.loai === 'cho-duyet' ? (
            <>
              <span className="text-[11px] text-sky-300">{v.text}</span>
              {v.due && <span className="text-[11px] text-slate-500">hạn {fmtDate(v.due)}</span>}
            </>
          ) : v.loai === 'ghi-ket-qua' ? (
            <>
              <PlanDue p={p} />
              {canEdit && !editing && (
                <button type="button" className="btn btn-sm" onClick={() => setEditing(true)}>Ghi kết quả</button>
              )}
            </>
          ) : (
            <span className="text-xs text-slate-500">{v.text} · {fmtDate(v.due)}</span>
          )}
        </div>
      </div>

      {showHistory && (
        <ol id={historyId} className="list-none m-0 mt-2 pl-3 space-y-2 border-l"
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
              {u.note && <span className="block text-xs text-slate-300 mt-0.5 leading-relaxed break-words">“{u.note}”</span>}
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
      {/* BẰNG CHỨNG CỦA PHƯƠNG ÁN (CASE-04): mở cùng lịch sử, chỉ tải danh sách khi người dùng mở khối này. */}
      {showHistory && (
        <div className="mt-2 pl-3">
          <BangChung ownerType="case_intervention" ownerId={p.id} canEdit={canEdit} tieuDe="Bằng chứng của phương án" />
        </div>
      )}

      {editing && (
        <InlineResult p={p}
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
 *   · Kết thúc phương án — thêm ngày kết thúc, phương án đóng lại.
 *
 * Luật của máy chủ giữ nguyên: chỉ kết quả TỐT (có tiến bộ / tiến bộ một phần) mới khép được
 * một phương án suông; "Chưa đủ dữ liệu" không khép được. Kết quả chưa tốt thì BẮT BUỘC đi
 * tiếp bằng phương án khác hoặc xin Quản lý — đường đó vẫn có, mở qua hộp thoại đầy đủ,
 * không bị mất chỉ vì khối nhúng cũ đã gỡ.
 *
 * KHÔNG CÓ Ô ĐIỂM TỰ CHẤM (CASE-05): bốn kỹ năng L/R/W/S cho một case Listening là vô lý. Điểm
 * tự chấm đã lưu từ trước vẫn đọc được.
 */
function InlineResult({ p, onClose, onDone }: {
  p: Plan;
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
  const outcomes = FOLLOWUP_OUTCOMES.filter((o) => !ending || canEndWithOutcome(o));
  /* Kết thúc suông chỉ dành cho kết quả tốt; kết quả chưa tốt phải nói đi tiếp thế nào. */
  const goodOutcome = outcome === 'improved' || outcome === 'partial';
  const mustContinue = ending && !!outcome && !goodOutcome;
  const noteOk = note.trim().length >= 8;
  const ready = !!outcome && noteOk && !mustContinue;

  const pickMode = (m: 'monitor' | 'end') => {
    setMode(m);
    /* "Chưa đủ dữ liệu" không kết thúc được phương án — bỏ chọn khi đổi sang kết thúc. */
    if (m === 'end' && outcome && !canEndWithOutcome(outcome)) setOutcome('');
  };

  const save = async () => {
    setBusy(true);
    try {
      if (ending) {
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
      toast.push('ok', ending ? 'Đã kết thúc phương án' : 'Đã ghi kết quả — phương án vẫn đang chạy');
      onDone(); onClose();
    } catch (e: any) {
      toast.push('error', e?.message ?? 'Không lưu được');
    } finally { setBusy(false); }
  };

  return (
    <div className="rounded-lg mt-2 p-2.5 space-y-2" style={{ background: 'var(--surface-1)' }}>
      <div className="flex flex-wrap gap-1.5" role="group" aria-label="Cách ghi">
        <button type="button" aria-pressed={!ending}
          className={`btn btn-sm ${!ending ? 'btn-primary' : ''}`} onClick={() => pickMode('monitor')}>
          Ghi kết quả, tiếp tục theo dõi
        </button>
        <button type="button" aria-pressed={ending}
          className={`btn btn-sm ${ending ? 'btn-primary' : ''}`} onClick={() => pickMode('end')}>
          Kết thúc phương án
        </button>
      </div>

      <span className="block text-[11px] text-slate-400">Chu kỳ vừa rồi em thế nào</span>
      <div className="flex flex-wrap gap-1.5">
        {outcomes.map((o) => (
          <button key={o} type="button"
            className={`btn btn-sm ${outcome === o ? 'btn-primary' : ''}`}
            onClick={() => setOutcome(o)}>
            {OUTCOME_MARK[o] ?? ''} {outcomeLabelFor(o)}
          </button>
        ))}
      </div>

      <textarea className="field w-full" rows={2} value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Tiến bộ ở đâu, còn kẹt chỗ nào, tuần tới làm gì" />
      {note.length > 0 && !noteOk && (
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
            Ngày ghi
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
            {busy ? 'Đang lưu…' : ending ? 'Kết thúc phương án' : 'Lưu, tiếp tục theo dõi'}
          </button>
        </span>
      </div>

      <p className="text-[11px] text-slate-500 m-0">
        {ending
          ? 'Phương án đóng lại. Case chỉ hoàn thành được khi mọi phương án đã khép.'
          : <>Lưu xong phương án <strong>vẫn đang chạy</strong>; lần cập nhật sau đến hạn vào Chủ nhật kế tiếp.</>}
      </p>

      <ResultDialog
        iv={full ? { id: p.id, kind: p.kind, description: p.name, actionDue: p.actionDue, followupDue: p.followupDue } : null}
        startMode="end"
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
        chưa có điểm
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
