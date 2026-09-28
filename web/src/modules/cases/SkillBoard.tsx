import { useState, type ReactNode } from 'react';
import { Empty, ErrorState, Level, Outcome, SCORE_CHIP, SCORE_TEXT, Skeleton, type ScoreTone } from '../../ui/ui.tsx';
import { fmtBand, sosLabel, sosTone } from '../../lib/format.ts';
import { HangCon, HangNhom } from '../../ui/HangNhom.tsx';
import { Nhan, QuaHan } from '../../ui/Nhan.tsx';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import { type BanDieuChinh } from './CapNhatTuan.tsx';
import { CauseDeterminationPanel, DismissCaseForm } from '../yThuc/CaseSosControls.tsx';
import {
  ATTEMPT_KIND_SHORT, OUTCOME_MARK, OUTCOME_TONE, dangChay, deadlineView, tienDoCase, viecTiepPhuongAn,
  type AttemptKind, type DeadlineView,
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
  /** PA theo quy chế SOS do máy gán (§3.2, PR-N1 S4-1): chạy ngay từ lúc tạo, hiện dấu `🔒 theo quy chế` cạnh tên — không xoá, không thay. */
  preset: boolean; confirmedAt: string | null;
  performer: string | null; status: string; statusLabel: string;
  startedOn: string | null; completedOn: string | null;
  actionDue: string | null; actionOverdue: boolean;
  followupDue: string | null; followupOverdue: boolean;
  pendingApproval: boolean; approvalDue: string | null;
  lastOutcome: string | null; lastOutcomeLabel: string | null;
  lastOutcomeOn: string | null; lastNote: string | null;
  /** PR-S2: khép lại vì sao (`superseded` = Được thay thế) và PA nào thay nó. */
  closedReason: string | null; supersededBy: number | null;
  /** PR-S2 (S2): mỗi lần sửa nội dung PA, cũ trước mới sau. */
  revisions: BanDieuChinh[];
  /** Mọi lần có người nhìn lại và ghi kết quả — dòng thời gian vẽ thành mốc CÓ NGÀY. */
  updates: {
    on: string; outcome: string; label: string; by: string | null;
    /** Câu người dạy viết, chu kỳ nào, và có trễ hạn không — để mở lịch sử ngay tại dòng phương án. */
    note: string | null; cycleNo: number | null; late: boolean;
    decision: string | null; remainingIssue: string | null; decisionNote: string | null;
  }[];
};
type CaseCard = {
  id: number; title: string; status: string;
  /** Chủ đề gốc của case (§7.5, PR-K) — để mở đúng danh mục phân loại khi "Xác định nguyên nhân". */
  topic: string | null;
  /** Case tự tạo từ SOS còn chờ xác định nguyên nhân (§3.2, §7.5, PR-K; PR-N1 S4-1: PA quy chế đã tự chạy). */
  sos: {
    fromSos: boolean; hasCause: boolean;
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
  attempts: { attemptNo: number; week: string | null; attemptKind?: string | null }[];
  followUntil: string | null; followOverdue: boolean;
  outcomeLabel: string | null; outcomeNote: string | null; closedOn: string | null;
  /** NHẬP BÙ (PR-C Task 3, chốt 7) — ai ghi lại, ghi lúc nào. Null khi ghi tại chỗ như bình thường. */
  backfilledBy: string | null; backfilledOn: string | null;
  /** Số bằng chứng của case (PR-HV) — nhãn "Bằng chứng (n)" thu gọn. */
  attachmentCount: number;
};
export type Row = {
  category: string; label: string; short: string;
  /** Mã chương trình lộ trình — bộ nguyên nhân theo môn (T57: FOU G+V / P, Pre FOU Tổng hợp). */
  chuongTrinh?: string | null;
  band: number | null; bandAttemptNo: number | null; bandWeek: string | null;
  expectation: number | null; missed: boolean | null;
  /** Còn thiếu bao nhiêu để đạt kỳ vọng CỦA CHÍNH ĐỢT ĐÓ — đây là dấu ± hiện mặc định. */
  gap: number | null;
  /** Tăng giảm so với LƯỢT TRƯỚC — hiện bằng chữ trung tính, không phải mũi tên màu. */
  trend: number | null;
  trendFrom: number | null;
  state: 'none' | 'chua_xu_ly' | 'no_plan' | 'working' | 'done';
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
    attemptKind?: string | null;
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
  /* Q28-5: Case từ SOS chưa xác nhận đủ nguyên nhân + PA do người xác nhận. */
  chua_xu_ly: 'Chưa xử lý',
  no_plan: 'Chưa có phương án',
  working: 'Đang xử lý',
  done: 'Đã kết thúc',
};
const STATE_KIND: Record<Row['state'], 'doing' | 'waiting' | 'done' | 'idle'> = {
  none: 'idle', chua_xu_ly: 'waiting', no_plan: 'waiting', working: 'doing', done: 'done',
};

/** Việc mở ngăn Case từ bảng này (Q3): không còn form trải trong trang. `viec` không có = mở view Case. */
export type MoCase = { viec?: 'ghi-ket-qua' | 'them-pa'; paId?: number };

export function SkillBoard({ rows, loading, error, onRetry, selected, onPick, onReport, onChanged, onMoCase }: {
  rows: Row[] | null;
  loading?: boolean;
  error?: { message: string; hint?: string } | null;
  onRetry?: () => void;
  selected?: string | null;
  onPick: (category: string | null) => void;
  onReport?: (category: string) => void;
  onChanged?: () => void;
  /** Mở ngăn Case (một panel) — Ghi kết quả / Thêm PA / xem Case đều đi qua đây. */
  onMoCase: (caseId: number, o?: MoCase) => void;
}) {
  if (error) return <ErrorState message={error.message} hint={error.hint} onRetry={onRetry} />;
  if (loading || !rows) return <Skeleton rows={6} />;
  if (!rows.length) return <Empty title="Chưa có hạng mục nào để theo dõi" />;

  /* MỘT bảng, tiêu đề cột MỘT lần, mỗi kỹ năng một <tbody> (hàng lớn + hàng con khi mở) — cùng khuôn với Học viên & Lớp. */
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[680px] table-fixed text-sm">
        <colgroup><col className="w-[24%]" /><col className="w-[17%]" /><col className="w-[28%]" /><col className="w-[31%]" /></colgroup>
        <thead>
          <tr><th className="th">Kỹ năng</th><th className="th">Gần nhất</th><th className="th">Case</th><th className="th">Việc tiếp</th></tr>
        </thead>
        {rows.map((r) => (
          <tbody key={r.category}>
            <SkillRows row={r} open={selected === r.category}
              onToggle={() => onPick(selected === r.category ? null : r.category)}
              onReport={onReport} onChanged={onChanged} onMoCase={onMoCase} />
          </tbody>
        ))}
      </table>
    </div>
  );
}

/** Hạn của việc tiếp theo, một dòng dưới chữ việc: "⚠ quá hạn 15 ngày" (đỏ) · "hôm nay" (vàng) · "hạn hết T2 31/08" (mờ). Chỗ DUY NHẤT nói quá hạn của kỹ năng. */
function DongHan({ v }: { v: DeadlineView | null }) {
  if (!v || v.han === 'chưa có hạn') return null;
  return (
    <span className="block whitespace-nowrap text-[11px] font-normal">
      {v.tone === 'overdue' ? <QuaHan ngay={v.daysOverdue} />
        : v.homNay ? <span className="font-semibold text-soon">hôm nay</span>
        : <span className="text-slate-500">{v.han}</span>}
    </span>
  );
}

function SkillRows({ row, open, onToggle, onReport, onChanged, onMoCase }: {
  row: Row; open: boolean; onToggle: () => void;
  onReport?: (category: string) => void; onChanged?: () => void;
  onMoCase: (caseId: number, o?: MoCase) => void;
}) {
  const { homNay, ngan } = useNgayNghiepVu();
  const expandable = row.cases.length > 0 || row.band !== null || !!row.signal;
  /* Đang xử lý / mới cập nhật lên trước, đã hoàn thành xuống dưới. */
  const ordered = [...row.cases].sort((a, b) => {
    const done = (x: CaseCard) => (x.status === 'done' ? 1 : 0);
    if (done(a) !== done(b)) return done(a) - done(b);
    return (b.touchedOn ?? '').localeCompare(a.touchedOn ?? '') || b.id - a.id;
  });
  const buoc = nextStepOf(row, homNay);

  return (
    <>
      <HangNhom mo={open && expandable} onMo={() => { if (expandable) onToggle(); }} nhan={row.label}
        tieuDe={(
          <span className="block min-w-0 font-normal">
            <span className="text-sm font-extrabold text-slate-100">{row.label}</span>
            <Trend row={row} />
          </span>
        )}>
        <td className="px-3 font-normal"><ScoreCell row={row} /></td>
        <td className="px-3 font-normal"><CotCase row={row} /></td>
        <td className="px-3 font-normal">
          {buoc ? (
            <span className="block min-w-0 font-normal" title={buoc.title}>
              <span className="block truncate text-xs text-slate-100">{buoc.viec}</span>
              <DongHan v={buoc.han} />
            </span>
          ) : <span className="text-xs text-slate-600">—</span>}
        </td>
      </HangNhom>

      {open && expandable && (
        ordered.length === 0 ? (
          <HangCon>
            <td className="td text-xs font-normal text-slate-400" colSpan={4}>
              Không có vấn đề nào đang theo dõi ở {row.label}.
              {onReport && (
                <button type="button" className="btn btn-sm ml-2" onClick={() => onReport(row.category)}>+ Case cho {row.label}</button>
              )}
            </td>
          </HangCon>
        ) : ordered.map((c) => (
          <HangCaseVaPa key={c.id} c={c} ngan={ngan} onChanged={onChanged} onMoCase={onMoCase} ct={row.chuongTrinh ?? null} />
        ))
      )}
    </>
  );
}

/** Cột Case của hàng lớn: tên Case + MỘT badge trạng thái (B-1). Tín hiệu SOS chưa mở Case thì để "chưa mở Case" (việc nói ở cột Việc tiếp). */
function CotCase({ row }: { row: Row }) {
  if (row.signal) return <span className="text-xs font-normal text-slate-500">chưa mở Case</span>;
  if (row.caseTitle) {
    return (
      <span className="block min-w-0 font-normal">
        <span className="block truncate text-xs text-slate-200" title={row.caseTitle}>{row.caseTitle}</span>
        <span className="mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[10px] text-slate-500">
          <Nhan tone={row.state === 'done' ? 'done' : row.state === 'no_plan' || row.state === 'chua_xu_ly' ? 'wait' : 'doing'}>{STATE_LABEL[row.state]}</Nhan>
          {row.parallelCount > 1 && <span>{row.parallelCount} Case song song</span>}
          {row.carriedOver && <span>từ lộ trình trước</span>}
        </span>
      </span>
    );
  }
  return (
    <span className="block font-normal">
      <span className="block text-xs text-slate-500">Không có Case mở</span>
      {row.band !== null && (
        <span className="mt-1 inline-flex">
          <Nhan tone={row.missed ? 'wait' : 'ok'}>{row.missed ? 'Đang theo dõi' : row.ratio ? 'Đạt' : 'Đạt kỳ vọng'}</Nhan>
        </span>
      )}
    </span>
  );
}

/**
 * MỘT CASE = MỘT HÀNG CON (không khung) + mỗi PA đang chạy một hàng con. PA đã xong thu gọn sau "▸ n PA đã xong". Khối SOS chờ
 * nguyên nhân / Không cần theo dõi / PA gợi ý (`CaseSosControls`) giữ TẠI CHỖ — đó không phải form panel. Thêm PA, Hoàn thành,
 * Ghi kết quả, lịch sử, Bằng chứng: ở ngăn Case (một panel).
 */
function HangCaseVaPa({ c, ngan, onChanged, onMoCase, ct = null }: {
  c: CaseCard; ngan: (d: string | null | undefined) => string; onChanged?: () => void;
  onMoCase: (caseId: number, o?: MoCase) => void;
  ct?: string | null;
}) {
  /* YC-12.1: MỘT biến cho hai khối SOS — mở khối này thì nút của khối kia biến mất; Huỷ → về hai nút. */
  const [khoiSos, setKhoiSos] = useState<null | 'nguyen-nhan' | 'khong-theo-doi'>(null);
  const [moXong, setMoXong] = useState(false);
  const td = tienDoCase(c.plans, c);
  const chay = c.plans.filter(dangChay);
  const xong = c.plans.filter((p) => !dangChay(p));
  const daXong = c.status === 'done';
  const ghiChuDong = [
    c.issueLabel ?? 'Chưa phân loại vấn đề',
    c.openedOn ? `mở ${ngan(c.openedOn)}` : null,
    c.carriedOver ? 'từ lộ trình trước' : null,
    c.parallel ? 'Case song song' : null,
    c.backfilledOn ? `nhập bù${c.backfilledBy ? ` · ${c.backfilledBy}` : ''} ghi ngày ${ngan(c.backfilledOn)}` : null,
  ].filter(Boolean).join(' · ');

  return (
    <>
      <HangCon title={c.summary ?? undefined}>
        <td className="td" colSpan={2}>
          <span className="block truncate text-xs font-semibold text-slate-100" title={c.title}>Case · {c.title}</span>
          <span className="block truncate text-[11px] text-slate-500" title={ghiChuDong}>{ghiChuDong}</span>
        </td>
        <td className="td">
          <span className="block text-xs text-slate-200">{td.text}</span>
          <span className="mt-0.5 flex flex-wrap items-center gap-1">
            {c.sos.dismissed
              ? <Nhan tone="muted" title={c.sos.dismissed.text ?? undefined}>Không cần theo dõi</Nhan>
              : daXong ? <Nhan tone="done">Đã hoàn thành</Nhan>
              : (
                <>
                  {c.sosLevel !== null && c.sosLevel > 0 && <Level tone={sosTone(c.sosLevel)}>{sosLabel(c.sosLevel)}</Level>}
                  <Nhan tone={c.plans.length === 0 || c.status === 'open' ? 'wait' : 'doing'}>
                    {c.plans.length === 0 ? 'Chưa có PA' : c.status === 'open' ? 'Chưa xử lý' : 'Đang xử lý'}
                  </Nhan>
                </>
              )}
          </span>
        </td>
        <td className="td">
          <CotPhai
            nut={(
              <>
                <button type="button" className="btn btn-sm" onClick={() => onMoCase(c.id)}>Mở Case</button>
                {c.canEdit && !daXong && c.plans.length === 0 && (
                  <button type="button" className="btn btn-sm" onClick={() => onMoCase(c.id, { viec: 'them-pa' })}>+ Thêm PA</button>
                )}
              </>
            )}
            phu={daXong && c.outcomeLabel ? `Kết luận: ${c.outcomeLabel}` : undefined} />
        </td>
      </HangCon>

      {/* CASE TỪ SOS CHỜ XÁC ĐỊNH NGUYÊN NHÂN (§7.5, S04, PR-K) — hạn 3 ngày, chỉ hiện khi còn chờ. */}
      {(c.sos.awaitingCause || c.sos.dismissed) && (
        <HangCon>
          <td className="td" colSpan={4}>
            {c.sos.awaitingCause && (
              <div className="space-y-1.5">
                <p className="m-0 text-xs text-soon">
                  Chờ GVBM xác định nguyên nhân{c.sos.dueOn && ` · hạn ${ngan(c.sos.dueOn)}`}
                </p>
                {c.canEdit && khoiSos === null && !c.sos.hasCause && (
                  <span className="flex flex-wrap gap-2">
                    <button type="button" className="btn btn-sm btn-primary" onClick={() => setKhoiSos('nguyen-nhan')}>Xác định nguyên nhân</button>
                    <button type="button" className="btn btn-sm btn-ghost" onClick={() => setKhoiSos('khong-theo-doi')}>Không cần theo dõi</button>
                  </span>
                )}
                {khoiSos === 'nguyen-nhan' && (
                  <CauseDeterminationPanel caseId={c.id} topic={c.topic} ct={ct} currentCode={c.issueCode}
                    onClose={() => setKhoiSos(null)} onDone={onChanged} />
                )}
                {khoiSos === 'khong-theo-doi' && <DismissCaseForm caseId={c.id} onClose={() => setKhoiSos(null)} onDone={onChanged} />}
              </div>
            )}
            {/* CASE ĐÓNG "KHÔNG CẦN THEO DÕI" (§3.2, S05, K2-4) — chữ tự gõ của lý do Khác chỉ hiện ở đây. */}
            {c.sos.dismissed && <p className="m-0 text-xs text-slate-300">Không cần theo dõi · {c.sos.dismissed.text || c.sos.dismissed.label}</p>}
          </td>
        </HangCon>
      )}

      {chay.map((p) => <HangPa key={p.id} p={p} c={c} ngan={ngan} onMoCase={onMoCase} />)}
      {xong.length > 0 && (
        <HangCon>
          <td className="td" colSpan={4}>
            <button type="button" className="link appearance-none border-0 bg-transparent p-0 text-[11px]" aria-expanded={moXong}
              onClick={() => setMoXong(!moXong)}>
              {moXong ? '▾' : '▸'} {xong.length} PA đã xong
            </button>
          </td>
        </HangCon>
      )}
      {moXong && xong.map((p) => <HangPa key={p.id} p={p} c={c} ngan={ngan} onMoCase={onMoCase} />)}
    </>
  );
}

/**
 * MỘT PA = MỘT HÀNG CON: `PA · {loại} — mô tả` + `người · 24/08 → 14/09` · kết quả gần nhất · cột phải (`CotPhai`, YC-12.5.4): nút
 * `Ghi kết quả` ở trên, `hạn hết T2 31/08` ở dưới (hạn gốc của PA, KHÔNG lặp ⚠ — quá hạn đã nói ở hàng kỹ năng, B-5). Bấm tên PA → ngăn Case cuộn tới PA đó.
 */
function HangPa({ p, c, ngan, onMoCase }: {
  p: Plan; c: CaseCard; ngan: (d: string | null | undefined) => string;
  onMoCase: (caseId: number, o?: MoCase) => void;
}) {
  const { homNay } = useNgayNghiepVu();
  const running = dangChay(p);
  const v = viecTiepPhuongAn(p);
  const han = p.actionDue ? deadlineView({ kind: 'cap-nhat-pa', due: p.actionDue, today: homNay }) : null;
  const khoang = p.startedOn
    ? `${ngan(p.startedOn)}${p.completedOn ? ` → ${ngan(p.completedOn)}` : p.followupDue ? ` → ${ngan(p.followupDue)}` : ''}`
    : null;
  const dongPhu = [p.performer ?? 'chưa có người làm', khoang,
    p.closedReason === 'superseded' ? 'được thay' : p.revisions.length > 0 ? `điều chỉnh ${p.revisions.length} lần` : null].filter(Boolean).join(' · ');
  return (
    <HangCon>
      <td className="td" colSpan={2}>
        <div className="flex min-w-0 items-baseline">
          <button type="button" onClick={() => onMoCase(c.id, { paId: p.id })} title="Mở PA trong ngăn Case"
            className="min-w-0 appearance-none truncate border-0 bg-transparent p-0 text-left text-xs text-slate-100 hover:underline">
            <span aria-hidden className={`mr-1.5 ${running ? 'text-doing' : 'text-slate-500'}`}>{running ? '▶' : '✓'}</span>PA · {p.name}
          </button>
          {p.preset && <span className="ml-1.5 whitespace-nowrap text-[10.5px] text-slate-400" title="PA theo quy chế SOS — máy gán, không xoá, không thay">🔒 theo quy chế</span>}
        </div>
        <span className="block truncate text-[11px] text-slate-500" title={dongPhu}>{dongPhu}</span>
      </td>
      <td className="td">
        {p.lastOutcomeLabel ? (
          <Outcome tone={OUTCOME_TONE[p.lastOutcome ?? ''] ?? 'muted'} mark={OUTCOME_MARK[p.lastOutcome ?? '']} title={p.lastNote ?? undefined}>
            {p.lastOutcomeLabel}{p.lastOutcomeOn ? ` · ${ngan(p.lastOutcomeOn)}` : ''}
          </Outcome>
        ) : <span className="text-[11px] text-slate-500">Chưa có kết quả</span>}
      </td>
      <td className="td">
        {v.loai === 'cho-duyet' ? (
          <CotPhai phu={<><span className="text-wait">{v.text}</span>{v.due ? ` · hạn ${ngan(v.due)}` : null}</>} />
        ) : v.loai === 'ghi-ket-qua' ? (
          <CotPhai
            nut={c.canEdit ? (
              <button type="button" className="btn btn-sm" onClick={() => onMoCase(c.id, { viec: 'ghi-ket-qua', paId: p.id })}
                title={`${han?.viec ?? 'Ghi kết quả'}: kết quả, tiến triển, và quyết định Giữ nguyên / Điều chỉnh / Thay / Kết thúc`}>
                Ghi kết quả
              </button>
            ) : undefined}
            phu={han?.han} />
        ) : <CotPhai phu={v.text} />}
      </td>
    </HangCon>
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
  const { homNay } = useNgayNghiepVu();
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
        {row.bandAttemptNo ? (row.ratio ? boNamCungNam(row.bandWeek, homNay) : `MT${row.bandAttemptNo}`) : ''}
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

/** Mã tuần "W1 SEP 2026" → "W1 SEP" khi cùng năm với hôm nay (G-6: chỉ hiện năm khi khác năm). */
function boNamCungNam(code: string | null, homNay: string): string {
  if (!code) return '';
  const m = /^(.*\S)\s(\d{4})$/.exec(code);
  return m && m[2] === homNay.slice(0, 4) ? m[1] : code;
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

/** Việc tiếp theo của cả hàng — MỘT việc (động từ + đối tượng) + hạn tách riêng (B-2/B-3), lấy việc gấp nhất đang tồn. */
function nextStepOf(row: Row, homNay: string): { viec: string; han: DeadlineView | null; title: string } | null {
  const dong = (viec: string, han: DeadlineView | null) => ({ viec, han, title: han && han.han !== 'chưa có hạn' ? han.text : viec });
  if (row.signal) {
    return dong('Xác minh SOS', deadlineView({ kind: 'xac-minh-sos', due: row.signal.verifyDue, today: homNay }));
  }
  const open = row.cases.filter((c) => c.status !== 'done');
  if (!open.length) return null;
  const plans = open.flatMap((c) => c.plans).filter(dangChay);
  if (!plans.length) return dong('Đề ra PA', null);
  const pending = plans.find((p) => p.pendingApproval);
  if (pending) {
    return dong('Chờ QL trả lời', pending.approvalDue ? deadlineView({ kind: 'viec-van-hanh', due: pending.approvalDue, today: homNay }) : null);
  }
  /* Hạn ghi kết quả hằng tuần của PA (Q1) — `followupDue` là ngày DỰ KIẾN kết thúc, không phải hạn (F11). */
  const due = plans.map((p) => p.actionDue).filter((x): x is string => !!x).sort()[0] ?? null;
  return dong('Ghi kết quả PA', due ? deadlineView({ kind: 'cap-nhat-pa', due, today: homNay }) : null);
}

/**
 * ĐƯỜNG ĐI CỦA ĐIỂM qua các lượt, vẽ bằng chữ chứ không bằng đồ hoạ.
 *
 * MỖI MỐC SO VỚI KỲ VỌNG CỦA CHÍNH ĐỢT ĐÓ (mục 3), không so với target cuối lộ trình: kỳ
 * vọng MT1 thấp hơn kỳ vọng MT3, nên lấy một cái thước chung là kết luận sai cho quá khứ.
 */
function Trend({ row }: { row: Row }) {
  const { homNay } = useNgayNghiepVu();
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
        {row.bandWeek ? ` · ${boNamCungNam(row.bandWeek, homNay)}` : ''}
      </span>
    );
  }
  return (
    <span className="flex flex-wrap items-center gap-x-1 text-[10px] text-slate-500 leading-tight">
      {pts.map((pt, i) => (
        <span key={pt.attemptNo} className="inline-flex items-center gap-1">
          {i > 0 && <span className="text-slate-700">→</span>}
          <span className={`tabular-nums ${pointTone(pt, row.ratio)}`}
            title={row.ratio
              ? (pt.attemptKind ? ATTEMPT_KIND_SHORT[pt.attemptKind as AttemptKind] : '')
              : `MT${pt.attemptNo}${pt.expectation !== null ? ` · kỳ vọng ${fmtBand(pt.expectation)}` : ''}`}>
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

/** CỘT PHẢI của hàng Case/PA (YC-12.5.4): nút ở TRÊN, chữ phụ ở DƯỚI, cùng một mép trái — mọi hàng như nhau. */
function CotPhai({ nut, phu }: { nut?: ReactNode; phu?: ReactNode }) {
  return (
    <span className="flex flex-col items-start gap-1">
      {nut && <span className="flex flex-wrap items-center gap-1.5">{nut}</span>}
      {phu && <span className="text-[11px] tabular-nums text-slate-500">{phu}</span>}
    </span>
  );
}

export { STATE_LABEL as SKILL_STATE_LABEL };
export type { Row as SkillBoardRow, CaseCard, Plan };
