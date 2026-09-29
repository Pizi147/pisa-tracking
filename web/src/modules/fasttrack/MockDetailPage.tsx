import { useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { useApi } from '../../lib/useApi.ts';
import { api, invalidate } from '../../lib/api.ts';
import { useToast } from '../../ui/Toast.tsx';
import { Card, Empty, ErrorState, ExamPlanText, Info as Tag, Outcome, SectionNote, Skeleton, Status } from '../../ui/ui.tsx';
import { ChipLichSu } from '../../ui/Nhan.tsx';
import type { ExamPlan } from '../../../../shared/domain/index.ts';
import { ConfirmDialog, Modal } from '../../ui/Drawer.tsx';
import { KetQuaDot } from '../../ui/KetQuaDot.tsx';
import { Menu, type MenuItem } from '../../ui/Menu.tsx';
import {
  DeadlinePill, InlineScoreEditor, KHOA_HOAN_TAT_HINT, lockedByNoShow, useSaveScore, type Cell, type SavePatch,
} from './ScoreEntry.tsx';
import {
  attemptHref, attemptStatusLabel, fmtBand, fmtDate, fmtDateTime, progressLabel, skillLabel,
} from '../../lib/format.ts';
import { ASSESSED_SKILL_LABEL, ATTEMPT_KIND_SHORT, tuanLich, type AttemptKind } from '@shared/domain/index.ts';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import { ONgay } from '../../ui/ONgay.tsx';
import { KIEM_TRA_LAI_KY_NANG, KY_NANG_KHONG_KIEM_TRA, TOOLTIP_TUAN_HOAN_TAT } from '../../ui/chu.ts';
import { usePeriods } from '../../ui/Filters.tsx';

type Detail = {
  id: number;
  /** `mock` với Fast Track; `progress` / `final` là bài của lớp Normal — màn khác hẳn. */
  kind: string;
  student: { id: number; name: string; code: string };
  cycle: { id: number; seq: number; route: string | null; target: number | null; examPlan: ExamPlan };
  classId: number | null; classCode: string | null; branchName: string | null;
  attemptNo: number; targetAtAttempt: number | null; studyWeekHint: number | null;
  period: { id: number; code: string; weekStart: string; weekEnd: string; range: string } | null;
  /** Tuần kế hoạch hoàn tất đã đủ căn cứ chưa, và môn nào đang chặn. */
  completionWeek: { valid: boolean; blocking: string[]; blockingLabels: string[] };
  /** Lịch, phạm vi, trạng thái thi và hạn chấm của TỪNG kỹ năng. */
  skillSchedule: SkillRow[];
  splitWeeks: boolean;
  scoringMode: 'band' | 'ratio';
  deadlineOverride: { date: string; reason: string | null; at: string | null; by: string | null } | null;
  status: string; cancelReason: string | null; note: string | null;
  result: any; cells: Cell[]; skips: any[];
  /** Lịch và phạm vi. */
  history: any[];
  /** Điểm: ai sửa, trước → sau (PR-I). */
  scoreHistory: ScoreHistoryRow[];
  /** PR-MT (T34): MT lịch sử — nhập bù, không có hạn, không luồng vắng. */
  lichSu: boolean;
  viewer: {
    canPlanWeek: boolean; canCancel: boolean; canHandleAbsence: boolean;
    canSkipSkill: boolean; canOverrideDeadline: boolean;
    /** Kỹ năng dời lịch/xác nhận thi được — GVCN·GVBM Normal + Quản lý mọi kỹ năng (SCH-01). */
    moveableSkills: string[];
    canEditSos: boolean; editableSkills: string[];
    /** PR-MT (M-12): cách huỷ được phép + hệ quả thật — `null` khi không huỷ được. */
    huyLuot: HeQuaHuy | null;
  };
};

type ScoreHistoryRow = {
  id: number; kind: 'edit' | 'override' | 'no_show'; skill: string; skillLabel: string;
  before: string; after: string; actorName: string | null; createdAt: string;
  /** RB-5 — lý do sửa điểm đã nhập (lần nhập đầu không có). */
  lyDo: string | null;
};

type SkillRow = {
  skill: string; label: string;
  required: boolean; scopeReason: string | null;
  periodId: number | null; periodCode: string | null;
  weekStart: string | null; weekRange: string | null;
  planSource: string;
  sitStatus: string; sitNote: string | null;
  deadline: string | null; deadlineSource: string;
  overdue: boolean; scored: boolean; progress: string;
  absenceMoveCount: number;
  /** Đề nghị dời do vắng đang chờ Quản lý trả lời (mục 10.6), nếu có. */
  pendingMove: { id: number; decideBy: string; toWeek: string | null; moveNo: number } | null;
};

/** Một đợt của học viên trong `GET /attempts?studentId=` — đủ để dựng nhãn và đường dẫn của bộ chọn đợt (R15). */
type DotCuaHv = {
  id: number; kind: string; classId: number | null; attemptNo: number; status: string;
  period: { id: number; weekStart: string } | null;
};

/** Năm cột làm việc — một dòng mỗi bài nhập. Dưới `md` mỗi bài là một thẻ xếp dọc, không có cột. */
const ROW_GRID = 'md:grid md:grid-cols-[6.5rem_9.5rem_minmax(14rem,1.2fr)_minmax(13rem,1fr)_11rem] md:gap-x-3';

export default function MockDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { data, loading, error, reload } = useApi<Detail>(id ? `/attempts/${id}` : null);
  const { save } = useSaveScore(Number(id), reload);
  const { homNay } = useNgayNghiepVu();
  /* R15 — các đợt của CHÍNH học viên này, để chuyển đợt ngay trên trang (không phải quay lại hồ sơ). */
  const dsDot = useApi<{ rows: DotCuaHv[] }>(data ? `/attempts?studentId=${data.student.id}` : null);
  const [showHistory, setShowHistory] = useState(false);
  const [weekOpen, setWeekOpen] = useState(false);
  const [deadlineOpen, setDeadlineOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);

  if (error) return <ErrorState message={error.message} hint={error.hint} onRetry={reload} />;
  if (loading || !data) return <Skeleton rows={10} />;

  /*
   * CHẶN CỬA: bài của lớp Normal KHÔNG được dựng bằng màn này.
   *
   * Màn Mock Test gọi mọi lượt là "MT{n}", chấm theo band và so với kỳ vọng target — cả ba
   * thứ đó đều sai với một bài Progress Test. Mọi đường dẫn trong hệ thống đã trỏ đúng màn,
   * nhưng đường dẫn cũ, thông báo cũ và link người dùng lưu lại thì vẫn còn, nên chặn ngay
   * ở đây thay vì tin rằng không ai vào được.
   */
  if (data.kind && data.kind !== 'mock') {
    return <Navigate to={attemptHref({ id: data.id, kind: data.kind, classId: data.classId })} replace />;
  }

  const d = data;
  const cancelled = d.status === 'cancelled';
  /* Đủ điểm và có kỳ vọng thì mới kết luận đạt; còn lại là "chưa biết" — không phải "đạt". */
  const passed: boolean | null = d.result.evaluable ? d.result.sosLevel === 0 : null;

  const openHistory = () => {
    setShowHistory(true);
    requestAnimationFrame(() => document.getElementById('lich-su')?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  };

  /*
   * NGOẠI LỆ CỦA QUẢN LÝ nằm trong MỘT menu, không phải ba nút ngang hàng với việc nhập điểm. "Huỷ lượt" không còn
   * là nút đỏ ở đầu trang: nó nói rõ huỷ phần nào và phần đã có điểm thì giữ.
   */
  const headerItems: MenuItem[] = [
    ...(d.viewer.canPlanWeek && !cancelled ? [{
      label: 'Đổi lịch cả đợt', onClick: () => setWeekOpen(true),
      hint: 'Xếp mọi môn còn dời được vào một tuần',
    }] : []),
    ...(d.viewer.canOverrideDeadline && !cancelled && !d.lichSu ? [{
      label: d.deadlineOverride ? 'Sửa hẹp xử lý cả đợt' : 'Hẹn xử lý cả đợt', onClick: () => setDeadlineOpen(true),
      hint: 'Một hạn riêng cho cả đợt',
    }] : []),
    /* PR-MT (M-12, Q-B): MỘT mục theo cách huỷ được phép — "Huỷ cả lượt" chỉ với lượt lớn nhất chưa có điểm. */
    ...(d.viewer.huyLuot?.cachDuoc && d.status === 'planned' ? [{
      label: d.viewer.huyLuot.cachDuoc === 'ca-luot' ? `Huỷ cả lượt MT${d.attemptNo}` : 'Huỷ phần còn lại', danger: true,
      onClick: () => setCancelOpen(true),
      hint: d.viewer.huyLuot.cachDuoc === 'ca-luot' ? `Số MT${d.attemptNo} dùng lại được` : 'Kỹ năng đã có điểm giữ nguyên',
    }] : []),
    ...(d.viewer.canCancel && cancelled ? [{
      label: `Mở lại lượt MT${d.attemptNo}`,
      onClick: async () => {
        try {
          await api.post(`/attempts/${d.id}/reopen`);
          invalidate('/attempts'); reload(); toast.push('ok', 'Đã mở lại lượt MT');
        } catch (e: any) { toast.push('error', e.message); }
      },
    }] : []),
  ];

  return (
    <div className="page space-y-4">
      {/* A. ĐẦU TRANG — hiểu đúng đợt trong vài giây. Đây là NƠI DUY NHẤT nói "đã có điểm mấy kỹ năng". */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <button className="btn btn-sm btn-ghost mb-1" onClick={() => navigate(-1)}>← Quay lại</button>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <h1 className="text-lg font-semibold text-slate-100">
              {d.student.name} <span className="text-slate-500 text-sm">· {d.student.code}</span>
              <span className="text-slate-300 text-base font-medium whitespace-nowrap"> · MT{d.attemptNo}{d.lichSu && <> <ChipLichSu /></>}</span>
            </h1>
            <ChonDot hienTai={d.id} ds={dsDot.data?.rows ?? []} homNay={homNay} onChon={(r) => navigate(attemptHref(r))} />
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Lớp lúc đánh giá: {d.classCode ?? '—'} · {d.branchName ?? '—'}
            {d.cycle.route && ` · Lộ trình ${d.cycle.route}`}
            {d.lichSu && ' · Nhập bù, không có hạn'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link className="btn no-underline" to={`/hoc-vien/${d.student.id}`}>Hồ sơ học viên</Link>
          {d.classId && (
            /* R16 — mở lưới cả lớp đúng TUẦN của đợt đang xem, không phải tuần hôm nay. */
            <Link className="btn no-underline"
              to={`/nhap-diem/${d.classId}${d.period ? `?periodId=${d.period.id}` : ''}`}>
              Nhập điểm cả lớp
            </Link>
          )}
          <Menu label="Chỉnh lịch" items={headerItems} className="btn" />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <span className="text-sm text-slate-200 tabular-nums">
          Đã có điểm {d.result.scoredRequired}/{d.result.required.length} kỹ năng
        </span>
        <KetQuaDot coDiem={d.result.scoredRequired} yeuCau={d.result.required.length} dat={passed}
          sos={d.result.failedCount ?? null} />
        <span className="text-sm text-slate-400">Kỳ vọng {fmtBand(d.result.expectation)}</span>
        <span className="inline-flex items-center gap-1.5 text-sm text-slate-400">
          Overall{d.result.overall !== null && <strong className="tabular-nums text-slate-100">{fmtBand(d.result.overall)}</strong>}
          <KetQuaDot phan="overall" coDiem={d.result.scoredRequired} yeuCau={d.result.required.length} dat={passed}
            sos={d.result.failedCount ?? null} />
        </span>
        {d.deadlineOverride && (
          <Tag title={d.deadlineOverride.reason ?? undefined}>
            Hẹn xử lý cả đợt {fmtDate(d.deadlineOverride.date)}{d.deadlineOverride.by ? ` · ${d.deadlineOverride.by}` : ''}
          </Tag>
        )}
      </div>
      {d.cancelReason && cancelled && <p className="text-xs text-rose-200 m-0">Đã huỷ: {d.cancelReason}</p>}

      <details className="rounded-lg border px-3 py-2" style={{ borderColor: 'var(--line)' }}>
        <summary className="cursor-pointer text-sm text-slate-300">Thông tin đợt Mock Test</summary>
        <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2 lg:grid-cols-4 m-0 mt-3">
          <Info label="Trạng thái">
            <Status kind={d.status === 'done' ? 'done' : cancelled ? 'idle' : 'doing'}>
              {attemptStatusLabel(d.status)}
            </Status>
          </Info>
          <Info label="Tuần dự kiến hoàn tất"
            title={TOOLTIP_TUAN_HOAN_TAT}>
            {d.period
              ? <>{tuanLich(d.period.weekStart, homNay)} <span className="text-slate-500 text-xs">({d.period.range})</span></>
              : <Tag pending>Chưa chốt tuần</Tag>}
          </Info>
          <Info label="Thi thật dự kiến"><ExamPlanText plan={d.cycle.examPlan} /></Info>
          <Info label="Mục tiêu tại thời điểm đánh giá">{fmtBand(d.targetAtAttempt)}</Info>
          {d.studyWeekHint && (
            <Info label="Mốc gợi ý" title="Tuần học của chương trình và mã tuần lịch là hai khái niệm khác nhau.">
              Tuần học FT {d.studyWeekHint}
            </Info>
          )}
        </dl>
      </details>

      {/* B. ĐIỂM VÀ LỊCH KIỂM TRA — MỘT bảng làm việc; nơi duy nhất của lịch, hạn, điểm và thao tác từng môn. */}
      <SkillWorkTable d={d} save={save} onDone={reload} onOpenHistory={openHistory} />

      {/* D. LỊCH SỬ THAY ĐỔI — thu gọn cuối trang. Hồ sơ Test không còn khối case (rule book §17.5). */}
      <HistoryCard d={d} open={showHistory} onToggle={() => setShowHistory((s) => !s)} />

      <WeekModal open={weekOpen} onClose={() => setWeekOpen(false)} attemptId={d.id}
        currentPeriodId={d.period?.id ?? null} onDone={reload} />
      <DeadlineModal open={deadlineOpen} onClose={() => setDeadlineOpen(false)} detail={d} onDone={reload} />
      {d.viewer.huyLuot?.cachDuoc && (
        <CancelDialog open={cancelOpen} onClose={() => setCancelOpen(false)} attemptId={d.id}
          attemptNo={d.attemptNo} heQua={d.viewer.huyLuot} onDone={reload} />
      )}
    </div>
  );
}

/**
 * R15 — CHỌN ĐỢT KHÁC của cùng học viên, cạnh tiêu đề. Nhãn `MT{n} · W3 SEP` (Mock Test) hoặc `Giữa khoá · W3 SEP` /
 * `Cuối khoá · W3 SEP` (lớp thường); đi bằng `attemptHref` nên bài lớp thường mở đúng lưới lớp thường. Đợt đang xem chọn
 * sẵn; chỉ có một đợt thì không hiện.
 */
function ChonDot({ hienTai, ds, homNay, onChon }: {
  hienTai: number; ds: DotCuaHv[]; homNay: string; onChon: (r: DotCuaHv) => void;
}) {
  if (ds.length < 2 || !ds.some((r) => r.id === hienTai)) return null;
  const xep = [...ds].sort((a, b) =>
    (a.period?.weekStart ?? '9999').localeCompare(b.period?.weekStart ?? '9999') || a.attemptNo - b.attemptNo || a.id - b.id);
  const nhan = (r: DotCuaHv) => {
    const ten = r.kind === 'mock' || !r.kind ? `MT${r.attemptNo}` : ATTEMPT_KIND_SHORT[r.kind as AttemptKind] ?? r.kind;
    const tuan = r.period ? tuanLich(r.period.weekStart, homNay) : 'chưa chốt tuần';
    return `${ten} · ${tuan}${r.status === 'cancelled' ? ` · ${attemptStatusLabel(r.status)}` : ''}`;
  };
  return (
    <select className="field w-auto max-w-full min-w-44" value={hienTai} aria-label="Chọn đợt khác của học viên này"
      title="Mở đợt khác của cùng học viên"
      onChange={(e) => { const r = xep.find((x) => x.id === Number(e.target.value)); if (r && r.id !== hienTai) onChon(r); }}>
      {xep.map((r) => <option key={r.id} value={r.id}>{nhan(r)}</option>)}
    </select>
  );
}

function Info({ label, title, children }: { label: string; title?: string; children: React.ReactNode }) {
  return (
    <div title={title}>
      <dt className="text-[11px] uppercase tracking-wide text-slate-500 font-semibold">{label}</dt>
      <dd className="text-sm text-slate-100 mt-1 m-0">{children}</dd>
    </div>
  );
}

// ---------------------------------------------------------------- bảng làm việc

/** Cột "Điểm": số câu đúng / band, bốn tiêu chí, hoặc dấu "-". KHÔNG nói "Người nhập" khi ô trống (MT-P09). */
function ScoreValue({ c }: { c: Cell }) {
  if (!c.required) return <span className="text-slate-500 text-xs">—</span>;
  if (c.noShow) return <span className="tabular-nums text-slate-200" title="Không có bài">-</span>;
  const isRaw = c.skill === 'listening' || c.skill === 'reading';
  const filled = c.criteria.filter((v) => v !== null).length;
  if (isRaw) {
    return c.rawScore === null
      ? <span className="text-slate-500 text-xs">—</span>
      : <span className="tabular-nums text-slate-100">
        {c.rawScore} câu đúng <span className="text-slate-400 text-xs">· Band {fmtBand(c.band)}</span>
      </span>;
  }
  if (c.band !== null) {
    return (
      <span className="tabular-nums text-slate-100">
        Band {fmtBand(c.band)}
        <span className="text-slate-500 text-xs"> · {c.criteria.join(' · ')}</span>
      </span>
    );
  }
  return filled > 0
    ? <span className="text-amber-200 text-xs">Chưa đủ tiêu chí ({filled}/4)</span>
    : <span className="text-slate-500 text-xs">—</span>;
}

function Verdict({ v }: { v: any }) {
  if (!v || v.band === null) return null;
  return v.passed === null
    ? null
    : v.passed
      ? <Outcome tone="ok" mark="✓">Đạt kỳ vọng</Outcome>
      : <Outcome tone="danger" mark="↓">Dưới kỳ vọng</Outcome>;
}

/**
 * MỘT BẢNG THAY HAI (MT-P04): "Lịch theo kỹ năng" và "Điểm theo kỹ năng" từng lặp kỹ năng, hạn và trạng thái. Nay mỗi
 * bài nhập (L · R · W1 · W2 · S) là MỘT dòng, năm cột: Kỹ năng · Lịch kiểm tra · Điểm · Tình trạng và hạn · Thao tác.
 * Writing tổng là dòng phụ dưới W1/W2, chỉ để đọc — không có ô nhập Writing tổng thứ ba.
 *
 * Mỗi dòng MỘT hành động chính (MT-P05). Chọn theo việc đang chặn dòng đó, không phải theo thứ tự nút:
 * đề nghị dời đang chờ → `Trả lời đề nghị`; đã xác nhận vắng → `Xử lý vắng`; phần thi bị huỷ → `Khôi phục và đặt tuần`;
 * còn lại → `Nhập điểm` / `Sửa điểm`. Mọi thứ khác (đổi lịch, hẹn xử lý, ghi nhận vắng, phạm vi, lịch sử) vào menu.
 * Có lịch và đúng quyền thì nhập được — không có bước "Đã thi" (MT-P03): có điểm thì hệ thống tự suy ra đã thi.
 */
function SkillWorkTable({ d, save, onDone, onOpenHistory }: {
  d: Detail; save: (skill: string, patch: SavePatch) => Promise<boolean>; onDone: () => void; onOpenHistory: () => void;
}) {
  const [editing, setEditing] = useState<string | null>(null);
  const [weekFor, setWeekFor] = useState<SkillRow | null>(null);
  const [deadlineFor, setDeadlineFor] = useState<SkillRow | null>(null);
  const [moveFor, setMoveFor] = useState<SkillRow | null>(null);
  const [restoreFor, setRestoreFor] = useState<SkillRow | null>(null);
  const [decideFor, setDecideFor] = useState<SkillRow | null>(null);
  const toast = useToast();
  const { homNay } = useNgayNghiepVu();
  const cancelled = d.status === 'cancelled';

  const act = async (fn: () => Promise<unknown>, okMsg: string) => {
    try {
      await fn();
      invalidate('/attempts'); invalidate('/overview'); invalidate('/classes');
      onDone();
      toast.push('ok', okMsg);
    } catch (e: any) { toast.push('error', e.message); }
  };

  const verdictOf = (skill: string) => d.result.verdicts.find((x: any) => x.skill === skill);
  const order = ['listening', 'reading', 'writing1', 'writing2', 'speaking'];
  const cells = [...d.cells].sort((a, b) => order.indexOf(a.skill) - order.indexOf(b.skill));

  const renderRow = (c: Cell) => {
    const r = d.skillSchedule.find((x) => x.skill === c.assessedSkill)!;
    /* Writing có HAI dòng nhưng MỘT lịch: thao tác về lịch chỉ đặt ở dòng W1, dòng W2 chỉ nhập điểm. */
    const ownsSchedule = c.skill !== 'writing2';
    const moveable = d.viewer.moveableSkills.includes(r.skill);
    const open = !cancelled && r.required;

    const canScore = open && c.canEdit && !lockedByNoShow(c)
      && r.sitStatus !== 'absent' && r.sitStatus !== 'cancelled' && r.progress !== 'cancelled';
    const hasValue = c.rawScore !== null || c.band !== null || c.criteria.some((v) => v !== null) || !!c.noShow;

    const needDecide = ownsSchedule && d.viewer.canPlanWeek && open && !!r.pendingMove;
    const needAbsence = ownsSchedule && open && d.viewer.canHandleAbsence && !r.scored && r.sitStatus === 'absent' && !r.pendingMove;
    const needRestore = ownsSchedule && d.viewer.canPlanWeek && open
      && (r.progress === 'cancelled' || (!r.periodCode && !r.scored));

    let primary: { label: string; run: () => void } | null = null;
    if (needDecide) primary = { label: 'Trả lời đề nghị', run: () => setDecideFor(r) };
    else if (needAbsence) primary = { label: 'Xử lý vắng', run: () => setMoveFor(r) };
    else if (needRestore) primary = { label: 'Khôi phục và đặt tuần', run: () => setRestoreFor(r) };
    else if (canScore) primary = { label: hasValue ? 'Sửa điểm' : 'Nhập điểm', run: () => setEditing(c.skill) };

    const items: MenuItem[] = [];
    if (ownsSchedule) {
      const unscored = open && !r.scored && r.progress !== 'cancelled';
      if (moveable && unscored) items.push({ label: 'Đổi lịch', hint: 'Đổi tuần thi của riêng môn này', onClick: () => setWeekFor(r) });
      if (moveable && unscored && r.periodCode && r.sitStatus !== 'absent' && !d.lichSu) {
        items.push({
          label: 'Ghi nhận vắng', hint: 'Chỉ khi đã xác minh học viên không đi thi',
          onClick: () => void act(
            () => api.post(`/attempts/${d.id}/skills/${r.skill}/sit`, { status: 'absent', note: 'GVCN xác minh học viên vắng buổi này' }),
            `Đã ghi nhận ${r.label}: học viên vắng`,
          ),
        });
      }
      if (moveable && unscored && r.sitStatus === 'absent') {
        items.push({
          label: 'Bỏ ghi nhận vắng', hint: 'Xác nhận vắng là nhầm',
          onClick: () => void act(
            () => api.post(`/attempts/${d.id}/skills/${r.skill}/sit`, { status: 'scheduled' }),
            `Đã bỏ ghi nhận vắng cho ${r.label}`,
          ),
        });
      }
      if (d.viewer.canOverrideDeadline && open && !d.lichSu) {
        items.push({ label: 'Hẹn xử lý', hint: 'Lùi ngày chấm của riêng môn này', onClick: () => setDeadlineFor(r) });
      }
      if (d.viewer.canSkipSkill && !cancelled && d.scoringMode === 'band') {
        items.push({
          label: r.required ? KY_NANG_KHONG_KIEM_TRA : KIEM_TRA_LAI_KY_NANG, danger: r.required,
          hint: r.required ? 'Quyết định chốt TRƯỚC khi thi' : undefined,
          onClick: () => void act(
            () => api.post(`/attempts/${d.id}/skills/${r.skill}/skip`, {
              skipped: r.required,
              reason: r.required ? 'Quản lý chốt trước: đợt này không yêu cầu kỹ năng đó' : undefined,
            }),
            r.required ? `${r.label} không kiểm tra trong đợt này` : `${r.label} được kiểm tra lại trong đợt này`,
          ),
        });
      }
      items.push({ label: 'Lịch sử', onClick: onOpenHistory });
    }

    const prog = c.progress === 'scored' ? 'scored' : r.progress;
    const isEditing = editing === c.skill && canScore;

    return (
      <div key={c.skill}
        className={`${ROW_GRID} grid gap-y-2 border-t px-2 py-3 ${r.required ? '' : 'row-muted'}`}
        style={{ borderColor: 'var(--line)' }} role="row">
        <div role="cell" className="text-slate-200 whitespace-nowrap">
          <span className="font-medium">{skillLabel(c.skill)}</span>
          {ownsSchedule && r.planSource === 'manual' && (
            <span className="text-slate-500 text-[11px] block">đã xếp riêng</span>
          )}
        </div>

        <div role="cell">
          <Label>Lịch kiểm tra</Label>
          {!r.required ? <span className="text-slate-500 text-xs">—</span>
            : r.periodCode
              ? <>{tuanLich(r.weekStart, homNay)} <span className="text-slate-500 text-xs block sm:inline">({r.weekRange})</span></>
              : <Tag pending>Chưa xếp tuần</Tag>}
        </div>

        <div role="cell">
          <Label>Điểm</Label>
          {isEditing
            ? <InlineScoreEditor cell={c} onSave={(p) => save(c.skill, p)} onClose={() => setEditing(null)} />
            : (
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <ScoreValue c={c} />
                  {c.skill !== 'writing1' && c.skill !== 'writing2' && <Verdict v={verdictOf(c.assessedSkill)} />}
                </div>
                {/* Người NHẬP điểm — chỉ khi ô có giá trị. Ai cập nhật gì, lúc nào: xem Lịch sử thay đổi. */}
                {c.enteredByName && (
                  <div className="text-[11px] text-slate-500">
                    Nhập bởi {c.enteredByName}{c.enteredAt && ` · ${fmtDateTime(c.enteredAt)}`}
                  </div>
                )}
              </div>
            )}
        </div>

        <div role="cell" className="space-y-1">
          <Label>Tình trạng và hạn</Label>
          {r.required && (
            <Status kind={prog === 'scored' ? 'done'
              /* MT lịch sử: nhập bù, không hạn — xám như việc "không tính hạn", không màu chờ. */
              : prog === 'skipped' || prog === 'cancelled' || prog === 'not_scheduled' || prog === 'lich_su' ? 'idle'
              : prog === 'due' || prog === 'sat' ? 'doing' : 'waiting'}>
              {progressLabel(prog)}
            </Status>
          )}
          {/* Đã có điểm thì chip trạng thái đã nói đủ; hạn chỉ còn nghĩa khi bài còn nợ. */}
          {/* MT lịch sử không có hạn (T34) — chip tình trạng "Nhập bù, không có hạn" đã nói đủ. */}
          {prog !== 'scored' && !d.lichSu && <div><DeadlinePill cell={c} /></div>}
          {ownsSchedule && r.absenceMoveCount > 0 && (
            <div className="text-[11px] text-amber-200">Đã dời do vắng {r.absenceMoveCount} lần</div>
          )}
          {/* ĐANG CHỜ AI, ĐẾN NGÀY NÀO: không nói hạn thì người xem không biết còn bao lâu nữa phần thi bị huỷ. */}
          {ownsSchedule && r.pendingMove && (
            <div className="text-[11px] text-amber-200">
              Đề nghị dời sang {r.pendingMove.toWeek ?? 'tuần kế tiếp'} (lần {r.pendingMove.moveNo}) — Quản lý cần
              trả lời trước {fmtDate(r.pendingMove.decideBy)}, quá hạn thì huỷ phần thi.
            </div>
          )}
          {!r.required && r.scopeReason && <div className="text-[11px] text-slate-500">{r.scopeReason}</div>}
          {r.sitNote && !c.noShow && <div className="text-[11px] text-slate-500">{r.sitNote}</div>}
        </div>

        <div role="cell" className="flex flex-wrap items-start gap-1.5 md:justify-end">
          {primary && !isEditing && (
            <button type="button" className="btn btn-sm btn-primary" onClick={primary.run}>{primary.label}</button>
          )}
          {!primary && !ownsSchedule && r.required && !canScore && r.sitStatus === 'absent' && (
            <span className="text-[11px] text-slate-500">Xử lý ở dòng W1</span>
          )}
          {!primary && c.required && !c.canEdit && !cancelled && (
            <span className="text-[11px] text-slate-500" title={c.khoa ? KHOA_HOAN_TAT_HINT : 'Bạn không được phân công kỹ năng này'}>Chỉ xem</span>
          )}
          {ownsSchedule && <Menu label="Thêm" items={items} />}
        </div>
      </div>
    );
  };

  const writing = verdictOf('writing');
  const writingRow = (
    <div key="writing-total" role="row"
      className={`${ROW_GRID} grid gap-y-1 border-t border-dashed px-2 py-2 bg-white/[0.02]`}
      style={{ borderColor: 'var(--line)' }}>
      <div role="cell" className="text-xs text-slate-400 md:pl-3">Writing (tổng)</div>
      <div role="cell" className="hidden md:block" />
      <div role="cell" className="flex flex-wrap items-center gap-2 text-sm">
        {writing?.band != null
          ? <span className="tabular-nums text-slate-100">Band {fmtBand(writing.band)}</span>
          : <span className="text-slate-500 text-xs">Chưa đủ hai task</span>}
        <Verdict v={writing} />
        <span className="text-[11px] text-slate-500">Tính từ hai task: (Task 1 + Task 2 × 2) / 3</span>
      </div>
      <div role="cell" className="hidden md:block" /><div role="cell" className="hidden md:block" />
    </div>
  );

  return (
    <Card title="Điểm và lịch kiểm tra"
      action={d.splitWeeks ? <Tag>Đợt này thi ở nhiều tuần</Tag> : undefined}>
      {!d.completionWeek.valid && (
        <p className="text-xs text-amber-200 mt-0 mb-3">
          Chưa có kế hoạch hợp lệ cho tuần dự kiến hoàn tất: {d.completionWeek.blockingLabels.join(', ')} chưa có tuần thi
          hoặc đã bị huỷ phần thi. Đợt vẫn chưa đủ kết quả cho tới khi Quản lý xếp lại.
        </p>
      )}
      {d.cells.length === 0 ? (
        <Empty title="Lớp này chưa cấu hình kỹ năng nào" />
      ) : (
        <div role="table" aria-label="Điểm và lịch kiểm tra theo kỹ năng">
          <div role="row"
            className={`${ROW_GRID} hidden px-2 pb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500`}>
            <div role="columnheader">Kỹ năng</div>
            <div role="columnheader">Lịch kiểm tra</div>
            <div role="columnheader">Điểm</div>
            <div role="columnheader">Tình trạng và hạn</div>
            <div role="columnheader" className="text-right">Thao tác</div>
          </div>
          {cells.flatMap((c) => (c.skill === 'writing2' ? [renderRow(c), writingRow] : [renderRow(c)]))}
        </div>
      )}
      {d.result.scopeDetail && (
        <SectionNote>
          {d.result.scopeDetail}. Kỹ năng ngoài phạm vi không tính vào mẫu số SOS và không bị coi là thiếu điểm; vì
          không đủ bốn kỹ năng nên đợt này không có Overall.
        </SectionNote>
      )}
      {d.result.complete && !d.result.evaluable && (
        <SectionNote>Đã đủ điểm nhưng lộ trình chưa có mục tiêu, nên chưa tính được kỳ vọng và SOS.</SectionNote>
      )}

      <SkillWeekModal open={!!weekFor} row={weekFor} attemptId={d.id}
        onClose={() => setWeekFor(null)} onDone={onDone} />
      <SkillDeadlineModal open={!!deadlineFor} row={deadlineFor} attemptId={d.id}
        onClose={() => setDeadlineFor(null)} onDone={onDone} />
      <AbsenceMoveModal open={!!moveFor} row={moveFor} detail={d}
        onClose={() => setMoveFor(null)} onDone={onDone} />
      <RestoreModal open={!!restoreFor} row={restoreFor} detail={d}
        onClose={() => setRestoreFor(null)} onDone={onDone} />
      <DecideMoveModal open={!!decideFor} row={decideFor} detail={d}
        onClose={() => setDecideFor(null)} onDone={onDone} />
    </Card>
  );
}

/** Nhãn cột chỉ hiện ở dạng thẻ (điện thoại); từ `md` trở lên đã có hàng tiêu đề. */
function Label({ children }: { children: React.ReactNode }) {
  return <span className="mb-0.5 block text-[11px] font-semibold uppercase tracking-wide text-slate-500 md:hidden">{children}</span>;
}

// ---------------------------------------------------------------- lịch sử thay đổi

/**
 * LỊCH SỬ GỌN CUỐI TRANG (PR-I Step 9): lịch, phạm vi VÀ điểm trong MỘT dòng thời gian — ai, khi nào, trước → sau,
 * lý do. Thu gọn mặc định và chỉ đếm số thay đổi; không xếp log kỹ thuật ngang với kết quả học tập.
 */
function HistoryCard({ d, open, onToggle }: { d: Detail; open: boolean; onToggle: () => void }) {
  const items = [
    ...d.history.map((h) => ({
      key: `s${h.id}`, at: String(h.createdAt ?? ''), who: h.actorName as string | null,
      what: `${actionLabel(h.action)}${ASSESSED_SKILL_LABEL[h.field as keyof typeof ASSESSED_SKILL_LABEL] ? ` · ${ASSESSED_SKILL_LABEL[h.field as keyof typeof ASSESSED_SKILL_LABEL]}` : ''}`,
      change: [h.oldValue && `${historyValue(h.oldValue)} →`, h.newValue && historyValue(h.newValue)].filter(Boolean).join(' ') || null,
      reason: h.reason as string | null,
    })),
    ...d.scoreHistory.map((h) => ({
      key: `c${h.id}`, at: h.createdAt, who: h.actorName,
      what: `${h.kind === 'override' ? 'Hiệu chỉnh điểm' : h.kind === 'no_show' ? 'Dấu "-"' : 'Sửa điểm'} · ${h.skillLabel}`,
      change: `${h.before} → ${h.after}`, reason: h.lyDo ?? null,
    })),
  ].sort((a, b) => (a.at < b.at ? 1 : a.at > b.at ? -1 : 0));

  return (
    <div id="lich-su">
      <Card title="Lịch sử thay đổi"
        action={<button className="btn btn-sm" onClick={onToggle}>{open ? 'Thu gọn' : 'Mở'}</button>}>
        {!open ? (
          <SectionNote>{items.length} thay đổi về lịch, phạm vi và điểm.</SectionNote>
        ) : items.length === 0 ? (
          <p className="text-xs text-slate-500 m-0">Chưa có thay đổi nào.</p>
        ) : (
          <ul className="space-y-1.5 text-xs list-none p-0 m-0">
            {items.map((h) => (
              <li key={h.key} className="text-slate-400">
                <span className="text-slate-600">{h.at ? fmtDateTime(h.at) : '—'} · </span>
                <span className="text-slate-200">{h.what}</span>
                {h.change && <> · {h.change}</>}
                {/* Lý do trên MỘT dòng (G-3): dài thì cắt, rê chuột đọc đủ. */}
                {h.reason && (
                  <> · <span className="inline-block max-w-full sm:max-w-[24rem] truncate align-bottom" title={`Lý do: ${h.reason}`}>
                    Lý do: {h.reason}
                  </span></>
                )}
                <span className="text-slate-600"> · {h.who ?? '—'}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

/** Trạng thái thi máy ghi bằng mã; người đọc lịch sử cần chữ. Giá trị khác (ngày, mã tuần) giữ nguyên. */
const SIT_LABEL: Record<string, string> = { scheduled: 'Theo lịch', sat: 'Đã thi', absent: 'Vắng', cancelled: 'Đã huỷ phần thi' };
const historyValue = (v: string) => SIT_LABEL[v] ?? v;

const actionLabel = (a: string) =>
  ({
    created: 'Tạo kế hoạch', week_set: 'Đổi lịch', lrw_set: 'Chốt buổi chính',
    speaking_set: 'Chốt buổi Speaking', cancelled: 'Huỷ cả lượt', reopened: 'Mở lại', recreated: 'Tạo lại (số dùng lại)',
    skill_part_cancelled: 'Huỷ phần còn lại',
    skill_skipped: KY_NANG_KHONG_KIEM_TRA, skill_restored: KIEM_TRA_LAI_KY_NANG,
    deadline_set: 'Hẹn xử lý cả đợt', deadline_cleared: 'Bỏ hẹn xử lý cả đợt',
    skill_week_set: 'Đổi lịch', skill_week_moved_absence: 'Dời do vắng',
    skill_sit_status: 'Trạng thái thi', completion_week: 'Tuần dự kiến hoàn tất',
    skill_deadline_set: 'Hẹn xử lý', skill_deadline_cleared: 'Bỏ hẹn xử lý',
    skill_no_show_settled: 'Chốt không dự thi',
  }[a] ?? a);

/** Đổi TUẦN THI của đúng một kỹ năng. Cảnh báo về khoảng cách giữa các đợt cần xác nhận lại. */
function SkillWeekModal({ open, row, attemptId, onClose, onDone }: {
  open: boolean; row: SkillRow | null; attemptId: number; onClose: () => void; onDone: () => void;
}) {
  const toast = useToast();
  const periods = usePeriods();
  const { homNay } = useNgayNghiepVu();
  const [periodId, setPeriodId] = useState<number | null>(null);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  /* Cảnh báo cần người xác nhận lại; lần bấm thứ hai mới gửi kèm dấu đã xác nhận. */
  const [warning, setWarning] = useState<string | null>(null);

  const close = () => {
    setPeriodId(null); setReason(''); setWarning(null); onClose();
  };

  const submit = async (force: boolean) => {
    if (!row || !periodId) return;
    setBusy(true);
    try {
      await api.post(`/attempts/${attemptId}/skills/${row.skill}/week`, { periodId, reason, force });
      invalidate('/attempts'); invalidate('/overview'); invalidate('/classes');
      onDone(); close();
      toast.push('ok', `Đã đổi tuần thi ${row.label}`);
    } catch (e: any) {
      if (/Xác nhận lại/.test(e.message)) setWarning(e.message);
      else toast.push('error', e.message);
    } finally { setBusy(false); }
  };

  return (
    <Modal open={open} onClose={close} title={`Đổi lịch · ${row?.label ?? ''}`} width="max-w-md"
      footer={<>
        <button className="btn" onClick={close} disabled={busy}>Huỷ</button>
        <button className="btn btn-primary" disabled={busy || !periodId}
          onClick={() => submit(!!warning)}>
          {busy ? 'Đang lưu…' : warning ? 'Vẫn xếp vào tuần này' : 'Lưu'}
        </button>
      </>}>
      <div className="space-y-3">
        <p className="text-xs text-slate-400 m-0">
          Đang thi {row?.periodCode ? `${tuanLich(row.weekStart, homNay)} (${row.weekRange})` : 'chưa xếp tuần'}.
          Chỉ kỹ năng này đổi lịch; các kỹ năng khác của đợt giữ nguyên tuần và hạn chấm.
        </p>
        <label className="block">
          <span className="label">Tuần thi mới</span>
          <select className="field" value={periodId ?? ''}
            onChange={(e) => { setPeriodId(Number(e.target.value) || null); setWarning(null); }}>
            <option value="">Chọn tuần…</option>
            {(periods.data ?? []).map((p) => <option key={p.id} value={p.id}>{tuanLich(p.weekStart, homNay)} · {p.range}</option>)}
          </select>
        </label>
        {/* PREVIEW "tuần cũ → tuần mới" TRƯỚC KHI LƯU — sổ §D/T07: thấy rõ đang đổi gì, không đoán. */}
        {periodId && (() => {
          const next = (periods.data ?? []).find((p) => p.id === periodId);
          return next ? (
            <p className="text-sm text-slate-200 m-0">
              {row?.periodCode ? tuanLich(row.weekStart, homNay) : 'chưa có tuần'} <strong>→</strong> {tuanLich(next.weekStart, homNay)} · {next.range}
            </p>
          ) : null;
        })()}
        <label className="block">
          <span className="label">Lý do</span>
          <input className="field" value={reason} onChange={(e) => setReason(e.target.value)}
            placeholder="Ví dụ: trùng lịch phòng thi Speaking" />
        </label>
        {warning && <p className="text-xs text-amber-200 m-0">{warning}</p>}
        <SectionNote>
          Đây là <strong>dời chủ động</strong>: xếp lại phòng thi, tách R/L/W với Speaking, đổi theo
          lịch học. Nó KHÔNG tiêu lượt dời nào của em. Em vắng buổi thi thì dùng nút{' '}
          <strong>“Xử lý vắng”</strong> — ở đó mới có bộ đếm, người duyệt và hạn trả lời.
          Đổi tuần sửa chính đợt này, không tạo đợt mới và không đổi số MT. Phần thi đã có điểm
          thì không đổi lịch được — lịch sử thực tế sai là một hiệu chỉnh riêng, không phải một lần dời.
        </SectionNote>
      </div>
    </Modal>
  );
}

/** Hạn chấm riêng cho ĐÚNG một kỹ năng, đè lên hạn riêng của cả đợt và hạn mặc định. */
function SkillDeadlineModal({ open, row, attemptId, onClose, onDone }: {
  open: boolean; row: SkillRow | null; attemptId: number; onClose: () => void; onDone: () => void;
}) {
  const toast = useToast();
  const [date, setDate] = useState('');
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (value: string | null) => {
    if (!row) return;
    setBusy(true);
    try {
      await api.post(`/attempts/${attemptId}/skills/${row.skill}/deadline`, { deadline: value, reason });
      invalidate('/attempts'); invalidate('/overview');
      onDone(); onClose(); setDate(''); setReason('');
      toast.push('ok', value ? `Đã hẹn xử lý cho ${row.label}` : `${row.label} quay lại hạn mặc định`);
    } catch (e: any) { toast.push('error', e.message); } finally { setBusy(false); }
  };

  return (
    <Modal open={open} onClose={onClose} title={`Hẹn xử lý · ${row?.label ?? ''}`} width="max-w-md"
      footer={<>
        <button className="btn" onClick={onClose} disabled={busy}>Đóng</button>
        {row?.deadlineSource === 'skill_override' && (
          <button className="btn" disabled={busy} onClick={() => submit(null)}>Dùng lại hạn mặc định</button>
        )}
        <button className="btn btn-primary" disabled={busy || !date} onClick={() => submit(date)}>
          {busy ? 'Đang lưu…' : 'Lưu hẹn xử lý'}
        </button>
      </>}>
      <div className="space-y-3">
        <p className="text-xs text-slate-400 m-0">
          Hạn đang áp dụng: {row?.deadline ? fmtDate(row.deadline) : 'chưa có'}.
        </p>
        <label className="block">
          <span className="label">Hẹn xử lý cho kỹ năng này</span>
          <ONgay kieu="ngay" value={date} onChange={setDate} />
        </label>
        <label className="block">
          <span className="label">Lý do</span>
          <input className="field" value={reason} onChange={(e) => setReason(e.target.value)}
            placeholder="Ví dụ: giáo viên Writing nghỉ phép" />
        </label>
        <SectionNote>
          Hẹn xử lý đặt ở đây chỉ áp cho kỹ năng này, không đụng tới các kỹ năng khác của đợt.
          Hết ngày hạn mới tính quá hạn.
        </SectionNote>
      </div>
    </Modal>
  );
}

// ---------------------------------------------------------------- thao tác lịch

/** Đổi TUẦN kế hoạch — việc của Quản lý. Ngày cũ ngoài tuần mới sẽ bị bỏ để xếp lại. */
function WeekModal({ open, onClose, attemptId, currentPeriodId, onDone }: {
  open: boolean; onClose: () => void; attemptId: number; currentPeriodId: number | null; onDone: () => void;
}) {
  const toast = useToast();
  const periods = usePeriods();
  const { homNay } = useNgayNghiepVu();
  const [periodId, setPeriodId] = useState<number | null>(currentPeriodId);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);

  return (
    <Modal open={open} onClose={onClose} title="Đổi lịch cả đợt" width="max-w-md"
      footer={<>
        <button className="btn" onClick={onClose} disabled={busy}>Huỷ</button>
        <button className="btn btn-primary" disabled={busy || !periodId || periodId === currentPeriodId} onClick={async () => {
          setBusy(true);
          try {
            const r = await api.post<any>(`/attempts/${attemptId}/week`, { periodId, reason, force: true });
            invalidate('/attempts'); invalidate('/overview'); invalidate('/classes');
            onDone(); onClose();
            toast.push('ok', r?.keptInPlace?.length
              ? `Đã đổi tuần ${r.moved.length} kỹ năng. Giữ nguyên lịch của ${r.keptInPlace.length} kỹ năng đã thi hoặc đã có điểm.`
              : `Đã đổi tuần ${r?.moved?.length ?? ''} kỹ năng`);
          } catch (e: any) { toast.push('error', e.message); } finally { setBusy(false); }
        }}>{busy ? 'Đang lưu…' : 'Lưu'}</button>
      </>}>
      <div className="space-y-3">
        <label className="block">
          <span className="label">Tuần mới</span>
          <select className="field" value={periodId ?? ''} onChange={(e) => setPeriodId(Number(e.target.value) || null)}>
            <option value="">Chọn tuần…</option>
            {(periods.data ?? []).map((p) => <option key={p.id} value={p.id}>{tuanLich(p.weekStart, homNay)} · {p.range}</option>)}
          </select>
        </label>
        <label className="block">
          <span className="label">Lý do</span>
          <input className="field" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Ví dụ: trùng lịch phòng thi" />
        </label>
        <SectionNote>
          Đây là lối tắt: nó xếp <strong>mọi kỹ năng còn dời được</strong> vào cùng một tuần.
          Kỹ năng đã thi hoặc đã có điểm giữ nguyên lịch thật của nó. Muốn tách R/L/W với Speaking
          thì dùng "Đổi lịch" ở dòng của từng kỹ năng.
          Đổi tuần cập nhật chính lượt MT này, không tạo lượt mới và không tăng số MT.
        </SectionNote>
      </div>
    </Modal>
  );
}


/** Hạn nhập điểm riêng, thay hạn mặc định. Chỉ một hạn có hiệu lực tại một thời điểm. */
function DeadlineModal({ open, onClose, detail, onDone }: {
  open: boolean; onClose: () => void; detail: Detail; onDone: () => void;
}) {
  const toast = useToast();
  const [date, setDate] = useState(detail.deadlineOverride?.date ?? '');
  const [reason, setReason] = useState(detail.deadlineOverride?.reason ?? '');
  const [busy, setBusy] = useState(false);

  const submit = async (value: string | null) => {
    setBusy(true);
    try {
      await api.post(`/attempts/${detail.id}/deadline`, { deadline: value, reason });
      invalidate('/attempts'); invalidate('/overview');
      onDone(); onClose();
      toast.push('ok', value ? 'Đã hẹn xử lý cả đợt' : 'Đã quay lại hạn mặc định');
    } catch (e: any) { toast.push('error', e.message); } finally { setBusy(false); }
  };

  return (
    <Modal open={open} onClose={onClose} title="Hẹn xử lý cả đợt" width="max-w-md"
      footer={<>
        <button className="btn" onClick={onClose} disabled={busy}>Đóng</button>
        {detail.deadlineOverride && (
          <button className="btn" disabled={busy} onClick={() => submit(null)}>Dùng lại hạn mặc định</button>
        )}
        <button className="btn btn-primary" disabled={busy || !date} onClick={() => submit(date)}>
          {busy ? 'Đang lưu…' : 'Lưu hẹn xử lý'}
        </button>
      </>}>
      <div className="space-y-3">
        <label className="block">
          <span className="label">Hẹn xử lý</span>
          <ONgay kieu="ngay" value={date} onChange={setDate} />
        </label>
        <label className="block">
          <span className="label">Lý do</span>
          <input className="field" value={reason ?? ''} onChange={(e) => setReason(e.target.value)}
            placeholder="Ví dụ: giáo viên Writing nghỉ phép" />
        </label>
        <SectionNote>
          Hạn mặc định tính riêng cho từng môn: hết thứ Tư của tuần kế tiếp sau tuần thi môn đó
          (lớp Normal là hết Chủ nhật của chính tuần thi). Hạn đặt ở đây áp cho CẢ ĐỢT; muốn đặt
          cho một môn thôi thì dùng "Hẹn xử lý" ở dòng của môn đó. Hết ngày hạn mới tính quá hạn.
        </SectionNote>
      </div>
    </Modal>
  );
}

type HeQuaHuy = { cachDuoc: 'ca-luot' | 'phan-con-lai' | null; case: number; pa: number; phoiHop: number };

/** HỘP HUỶ LƯỢT (PR-MT, M-12, T67): nói trước đúng hệ quả của cách huỷ được phép — không bấm rồi mới biết. */
function CancelDialog({ open, onClose, attemptId, attemptNo, heQua, onDone }: {
  open: boolean; onClose: () => void; attemptId: number; attemptNo: number; heQua: HeQuaHuy; onDone: () => void;
}) {
  const toast = useToast();
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const caLuot = heQua.cachDuoc === 'ca-luot';
  const dong = [heQua.case ? `${heQua.case} Case` : null, heQua.phoiHop ? `${heQua.phoiHop} việc Phối hợp` : null].filter(Boolean);
  return (
    <ConfirmDialog
      open={open} onClose={onClose} danger busy={busy}
      title={caLuot ? `Huỷ cả lượt MT${attemptNo}` : `Huỷ phần còn lại của MT${attemptNo}`}
      confirmLabel={caLuot ? 'Huỷ cả lượt' : 'Huỷ phần còn lại'}
      body={
        <div className="space-y-2">
          <p>
            {caLuot
              ? <>Huỷ <strong>cả lượt</strong> MT{attemptNo}. Số MT{attemptNo} sẽ dùng lại được khi xếp lượt mới.</>
              : <>Huỷ các kỹ năng <strong>chưa có điểm và chưa thi</strong>. MT{attemptNo} giữ số; kỹ năng đã có điểm giữ nguyên.</>}
          </p>
          {dong.length > 0 && <p>Đóng {dong.join(', ')} sinh từ lượt này.</p>}
          <input className="field" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Lý do huỷ (bắt buộc)"
            aria-label="Lý do huỷ (bắt buộc)" />
        </div>
      }
      onConfirm={async () => {
        setBusy(true);
        try {
          await api.post(`/attempts/${attemptId}/cancel`, { reason, cach: heQua.cachDuoc });
          invalidate('/attempts'); invalidate('/overview');
          onDone(); onClose(); toast.push('ok', caLuot ? `Đã huỷ cả lượt MT${attemptNo}` : 'Đã huỷ phần còn lại');
        } catch (e: any) { toast.push('error', e.message); } finally { setBusy(false); }
      }}
    />
  );
}

/**
 * XỬ LÝ VẮNG MỘT BUỔI THI (mục 10.6).
 *
 * Form này cố tình KHÔNG cho chọn tuần. Luật nói rõ: lần đầu dời đúng TUẦN KẾ TIẾP của lịch
 * đang có. Bày một ô chọn tuần ra đây là mời người dùng làm đúng cái việc mà luật cấm — và
 * một GVCN xử lý muộn ba tuần sẽ chọn tuần hiện tại, âm thầm cho em thêm hai tuần.
 *
 * Buổi R/L/W là MỘT lần vắng của nhiều kỹ năng, nên tick được nhiều môn. Nhưng máy chủ vẫn
 * xét TỪNG MÔN riêng: môn đã dời một lần thì đi xin duyệt, môn chưa dời thì đổi được ngay.
 */
function AbsenceMoveModal({ open, row, detail, onClose, onDone }: {
  open: boolean; row: SkillRow | null; detail: Detail; onClose: () => void; onDone: () => void;
}) {
  const toast = useToast();
  const { homNay } = useNgayNghiepVu();
  const [picked, setPicked] = useState<string[]>([]);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<any[] | null>(null);

  /* Các môn khác cũng đang mang dấu vắng — nhiều khả năng là cùng một buổi. */
  const alsoAbsent = detail.skillSchedule.filter(
    (r) => r.required && !r.scored && r.sitStatus === 'absent' && !r.pendingMove && r.skill !== row?.skill,
  );
  const skills = [row?.skill, ...picked].filter(Boolean) as string[];

  const close = () => { setPicked([]); setReason(''); setResult(null); onClose(); };

  const submit = async () => {
    if (!row) return;
    setBusy(true);
    try {
      const res: any = await api.post(`/attempts/${detail.id}/absence-move`, {
        skills, reason,
        /* Bấm hai lần hay mạng chập không được thành hai lần dời. */
        idempotencyKey: `${detail.id}:${skills.join('+')}:${reason}`,
      });
      invalidate('/attempts'); invalidate('/overview'); invalidate('/classes'); invalidate('/my-work');
      onDone();
      setResult(res.outcomes ?? []);
      toast.push('ok', 'Đã xử lý việc vắng');
    } catch (e: any) { toast.push('error', e.message); }
    finally { setBusy(false); }
  };

  return (
    <Modal open={open} onClose={close} title={`Xử lý vắng · ${row?.label ?? ''}`} width="max-w-md"
      footer={result
        ? <button className="btn btn-primary" onClick={close}>Đóng</button>
        : <>
          <button className="btn" onClick={close} disabled={busy}>Huỷ</button>
          <button className="btn btn-primary" disabled={busy} onClick={submit}>
            {busy ? 'Đang xử lý…' : 'Xử lý việc vắng'}
          </button>
        </>}>
      {result ? (
        <div className="space-y-2">
          {result.map((o: any) => (
            <p key={o.skill} className={`text-sm m-0 ${o.result === 'moved' ? 'text-slate-200' : 'text-amber-200'}`}>
              {o.message}
            </p>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-xs text-slate-400 m-0">
            {row?.label} đang xếp {tuanLich(row?.weekStart, homNay)} ({row?.weekRange}), đã xác nhận vắng.
            {(row?.absenceMoveCount ?? 0) > 0 && ` Môn này đã dời do vắng ${row?.absenceMoveCount} lần.`}
          </p>

          {alsoAbsent.length > 0 && (
            <div>
              <span className="label">Cùng buổi thi này còn môn nào vắng?</span>
              <div className="space-y-1 mt-1">
                {alsoAbsent.map((r) => (
                  <label key={r.skill} className="flex items-center gap-2 text-sm text-slate-300">
                    <input type="checkbox" checked={picked.includes(r.skill)}
                      onChange={(e) => setPicked(
                        e.target.checked ? [...picked, r.skill] : picked.filter((x) => x !== r.skill),
                      )} />
                    <span>{r.label} <span className="text-slate-500 text-xs">({tuanLich(r.weekStart, homNay)})</span></span>
                  </label>
                ))}
              </div>
              <p className="text-[11px] text-slate-500 mt-1 mb-0">
                Tick các môn thi CÙNG buổi. Mỗi môn vẫn được xét riêng: môn đã dời một lần thì
                phải xin Quản lý duyệt, môn chưa dời lần nào thì đổi được ngay.
              </p>
            </div>
          )}

          <label className="block">
            <span className="label">Lý do</span>
            <input className="field" value={reason} onChange={(e) => setReason(e.target.value)}
              placeholder="Ví dụ: em ốm, gia đình đã báo trước" />
          </label>

          <SectionNote>
            {(row?.absenceMoveCount ?? 0) === 0 ? (
              <>
                Đây là <strong>lần dời thứ nhất</strong>: lịch chuyển sang đúng tuần kế tiếp của
                lịch đang có — không chọn tuỳ ý, và không lấy tuần hiện tại để nhảy nhiều tuần
                khi xử lý muộn.
              </>
            ) : (
              <>
                Môn này đã dời do vắng rồi, nên lần này là <strong>đề nghị cần Quản lý duyệt</strong>.
                Lịch giữ nguyên cho tới khi có quyết định. Quản lý phải trả lời TRƯỚC khi tuần mới bắt
                đầu; từ chối hoặc hết hạn thì phần thi bị huỷ và chỉ Quản lý mới khôi phục được.
              </>
            )}
          </SectionNote>
        </div>
      )}
    </Modal>
  );
}

/**
 * KHÔI PHỤC PHẦN THI ĐÃ HUỶ và ĐẶT TUẦN MỚI — trong CÙNG một thao tác (mục 10.6).
 *
 * Tách làm hai bước thì sẽ có những phần được khôi phục mà không có tuần, nằm im ở đúng
 * trạng thái mà cả mục này sinh ra để dọn. Nên form này không có nút "khôi phục thôi".
 */
function RestoreModal({ open, row, detail, onClose, onDone }: {
  open: boolean; row: SkillRow | null; detail: Detail; onClose: () => void; onDone: () => void;
}) {
  const toast = useToast();
  const periods = usePeriods();
  const { homNay } = useNgayNghiepVu();
  const [periodId, setPeriodId] = useState<number | null>(null);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);

  const close = () => { setPeriodId(null); setReason(''); onClose(); };

  const submit = async () => {
    if (!row || !periodId) return;
    setBusy(true);
    try {
      await api.post(`/attempts/${detail.id}/skills/${row.skill}/restore`, { periodId, reason });
      invalidate('/attempts'); invalidate('/overview'); invalidate('/classes');
      onDone(); close();
      toast.push('ok', `Đã khôi phục ${row.label} và đặt tuần mới`);
    } catch (e: any) { toast.push('error', e.message); }
    finally { setBusy(false); }
  };

  return (
    <Modal open={open} onClose={close} title={`Khôi phục · ${row?.label ?? ''}`} width="max-w-md"
      footer={<>
        <button className="btn" onClick={close} disabled={busy}>Huỷ</button>
        <button className="btn btn-primary" disabled={busy || !periodId} onClick={submit}>
          {busy ? 'Đang lưu…' : 'Khôi phục và đặt tuần'}
        </button>
      </>}>
      <div className="space-y-3">
        <p className="text-xs text-slate-400 m-0">
          {detail.scoringMode === 'ratio'
            ? 'Lớp Normal: lịch hẹn đã bị huỷ nhưng em vẫn phải thi đủ bốn môn. Xếp lại tuần cho môn này.'
            : 'Phần thi này đã bị huỷ. Đợt vẫn chưa đủ kết quả cho tới khi em thi bù xong.'}
        </p>
        <label className="block">
          <span className="label">Tuần thi mới</span>
          <select className="field" value={periodId ?? ''}
            onChange={(e) => setPeriodId(Number(e.target.value) || null)}>
            <option value="">Chọn tuần…</option>
            {(periods.data ?? []).map((p) => <option key={p.id} value={p.id}>{tuanLich(p.weekStart, homNay)} · {p.range}</option>)}
          </select>
        </label>
        <label className="block">
          <span className="label">Lý do</span>
          <input className="field" value={reason} onChange={(e) => setReason(e.target.value)}
            placeholder="Ví dụ: xếp cho em thi bù cùng lớp khác" />
        </label>
        <SectionNote>
          Khôi phục KHÔNG đặt lại bộ đếm dời do vắng — những lần em vắng trước đó vẫn đã xảy ra.
          Tuần mới phải là một tuần <strong>chưa tới</strong>: xếp vào một tuần đã bắt đầu là ghi vào
          hệ thống một buổi thi không thể diễn ra.
        </SectionNote>
      </div>
    </Modal>
  );
}

/**
 * QUẢN LÝ TRẢ LỜI MỘT ĐỀ NGHỊ DỜI DO VẮNG (mục 10.6).
 *
 * Hai nút, và cái thứ hai phải nói rõ hậu quả: TỪ CHỐI KHÔNG PHẢI LÀ "giữ nguyên lịch cũ",
 * mà là HUỶ phần thi (Fast Track) hoặc huỷ lịch hẹn (Normal). Một cái nút "Từ chối" trơ
 * trọi sẽ được bấm bởi người tưởng mình chỉ đang nói "không dời nữa".
 *
 * Ô chọn tuần chỉ dùng khi tuần được đề nghị đã trôi qua — đồng ý một lịch đã qua là ghi
 * vào hệ thống một buổi thi không thể diễn ra.
 */
function DecideMoveModal({ open, row, detail, onClose, onDone }: {
  open: boolean; row: SkillRow | null; detail: Detail; onClose: () => void; onDone: () => void;
}) {
  const toast = useToast();
  const periods = usePeriods();
  const { homNay } = useNgayNghiepVu();
  const [note, setNote] = useState('');
  const [periodId, setPeriodId] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);

  const close = () => { setNote(''); setPeriodId(null); onClose(); };

  const decide = async (approve: boolean) => {
    if (!row?.pendingMove) return;
    setBusy(true);
    try {
      await api.post(`/move-requests/${row.pendingMove.id}/decide`, {
        approve, note, periodId: approve ? periodId : null,
      });
      invalidate('/attempts'); invalidate('/overview'); invalidate('/classes'); invalidate('/my-work');
      onDone(); close();
      toast.push('ok', approve ? `Đã duyệt dời ${row.label}` : `Đã từ chối — phần thi ${row.label} bị huỷ`);
    } catch (e: any) { toast.push('error', e.message); }
    finally { setBusy(false); }
  };

  return (
    <Modal open={open} onClose={close} title={`Đề nghị dời · ${row?.label ?? ''}`} width="max-w-md"
      footer={<>
        <button className="btn" onClick={close} disabled={busy}>Để sau</button>
        <button className="btn btn-ghost" disabled={busy} onClick={() => decide(false)}>
          Từ chối và huỷ phần thi
        </button>
        <button className="btn btn-primary" disabled={busy} onClick={() => decide(true)}>
          {busy ? 'Đang lưu…' : 'Đồng ý dời'}
        </button>
      </>}>
      <div className="space-y-3">
        <p className="text-sm text-slate-200 m-0">
          GVCN đề nghị dời {row?.label} sang tuần <strong>{row?.pendingMove?.toWeek ?? '—'}</strong>.
          Đây là lần dời do vắng thứ {row?.pendingMove?.moveNo}.
        </p>
        <p className="text-xs text-amber-200 m-0">
          Bạn cần trả lời trước {fmtDate(row?.pendingMove?.decideBy ?? null)} — tức là trước khi tuần mới
          bắt đầu. Quá hạn mà chưa có quyết định thì hệ thống tự huỷ như một lần từ chối.
        </p>

        <label className="block">
          <span className="label">Đổi sang tuần khác (không bắt buộc)</span>
          <select className="field" value={periodId ?? ''}
            onChange={(e) => setPeriodId(Number(e.target.value) || null)}>
            <option value="">Giữ tuần GVCN đề nghị</option>
            {(periods.data ?? []).map((p) => <option key={p.id} value={p.id}>{tuanLich(p.weekStart, homNay)} · {p.range}</option>)}
          </select>
          <span className="block text-[11px] text-slate-500 mt-1">
            Chỉ cần khi tuần được đề nghị đã bắt đầu — lúc đó phải chọn một tuần chưa tới.
          </span>
        </label>

        <label className="block">
          <span className="label">Ghi chú quyết định</span>
          <input className="field" value={note} onChange={(e) => setNote(e.target.value)}
            placeholder="Ví dụ: đồng ý lần cuối, lần sau xếp thi cùng lớp khác" />
        </label>

        <SectionNote>
          <strong>Từ chối không phải là giữ nguyên lịch cũ.</strong>{' '}
          {detail.scoringMode === 'ratio'
            ? 'Lớp Normal: lịch hẹn bị huỷ, nhưng em vẫn phải thi đủ bốn môn — môn này chuyển sang chờ bạn xếp lại.'
            : 'Fast Track: phần thi chưa thi bị huỷ, điểm các phần đã xong giữ nguyên. Đợt này chưa đủ kết quả cho tới khi bạn khôi phục và đặt tuần mới.'}
        </SectionNote>
      </div>
    </Modal>
  );
}
