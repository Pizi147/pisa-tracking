import { useState, type ReactNode } from 'react';
import { Empty, ErrorState, NhanTrangThai, Outcome, SCORE_CHIP, SCORE_TEXT, Skeleton, type ScoreTone } from '../../ui/ui.tsx';
import { Han } from '../../ui/Han.tsx';
import { fmtBand } from '../../lib/format.ts';
import { HangCon, HangNhom } from '../../ui/HangNhom.tsx';
import { Nhan, QuaHan } from '../../ui/Nhan.tsx';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import { type BanDieuChinh } from './CapNhatTuan.tsx';
import { KhongTheoDoiForm } from '../yThuc/CaseSosControls.tsx';
import {
  ATTEMPT_KIND_SHORT, OUTCOME_MARK, OUTCOME_TONE, dangChay, deadlineView, tienDoCase, viecTiepPhuongAn,
  type AttemptKind, type DeadlineKind, type DeadlineView, type TrangThai, type TrangThaiCaseV4,
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
  /** PA theo quy chế SOS (§3.2): dấu khoá `theo quy chế` cạnh tên — không thay, không kết thúc sớm. */
  preset: boolean; confirmedAt: string | null;
  /** PR-SOS: bắt buộc · chờ xác nhận (Q28-3) · chữ mốc (`đến MT2 · W2 OCT`) · lần ghi tới là "Ghi kết quả cuối" (T22). */
  batBuoc: boolean; choXacNhan: boolean; mocChu: string | null; lanCuoi: boolean;
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
  /** Case tự tạo từ SOS: chờ xác nhận nguyên nhân, hạn xác nhận, thẻ Không cần theo dõi, lý do huỷ (§3.2, §7.5, PR-SOS). */
  sos: {
    fromSos: boolean; hasCause: boolean;
    awaitingCause: boolean; dueOn: string | null;
    dismissed: { code: string; label: string; text: string | null } | null;
    choDuyetKhongTheoDoi: { hanDuyet: string | null } | null; coPaChoXacNhan: boolean;
  };
  /** PR-SOS (T21): `[MT1]` + phần giữa + `[SOS 3]` — null với Case tay / lớp thường. */
  tenSos: { mt: number | null; giua: string; sos: number | null } | null;
  /** PR-SOS (§7.3, K3-07): MỘT nhãn trạng thái + MỘT việc tiếp (máy chủ tính bằng `sosV4.ts`). */
  trangThaiV4: { k: TrangThaiCaseV4; t: TrangThai; chu: string; han: string | null };
  viecTiep: { chu: string; loaiHan: DeadlineKind | null; han: string | null; paId?: number } | null;
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
  /** PR-S3F #5: lộ trình KCK (không cam kết) — `missed` null vì không có kỳ vọng, KHÔNG phải "đạt". */
  kck?: boolean;
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

/** Việc mở ngăn Case từ bảng này (Q3): không còn form trải trong trang. `viec` không có = mở view Case. PR-SOS: + Xác nhận Case / PA. */
export type MoCase = { viec?: 'ghi-ket-qua' | 'them-pa' | 'xac-nhan' | 'xac-nhan-pa'; paId?: number };

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
          <HangCase key={c.id} c={c} ngan={ngan} onChanged={onChanged} onMoCase={onMoCase} />
        ))
      )}
    </>
  );
}

/**
 * Cột Case của hàng lớn: tên Case + MỘT nhãn trạng thái (§7.3, K3-06). Kỹ năng dưới kỳ vọng mà không mở Case nói rõ "không mở Case";
 * Case huỷ vì không cần theo dõi nói ai duyệt, ngày nào.
 */
function CotCase({ row }: { row: Row }) {
  const { ngan } = useNgayNghiepVu();
  if (row.signal) return <span className="text-xs font-normal text-slate-500">chưa mở Case</span>;
  const c = row.cases.find((x) => x.id === row.caseId) ?? row.cases.find((x) => x.status !== 'done') ?? row.cases[0];
  if (c) {
    const tt = c.trangThaiV4;
    return (
      <span className="block min-w-0 font-normal">
        <span className="block truncate text-xs text-slate-200" title={c.title}><TenCase c={c} /></span>
        <span className="mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs text-slate-400">
          <NhanTrangThai t={tt.t} />
          <span>{tt.k === 'huy-khong-theo-doi' ? `Không theo dõi (Quản lý duyệt ${ngan(c.closedOn)})`
            : tt.k === 'dang-lam' ? tienDoCase(c.plans, c).text : tt.k === 'xong' ? (c.outcomeLabel ?? '') : tt.chu}</span>
          {row.parallelCount > 1 && <span>· {row.parallelCount} Case song song</span>}
        </span>
      </span>
    );
  }
  return (
    <span className="block font-normal">
      {row.band !== null && row.missed
        ? <span className="block text-xs text-slate-400">Chưa đạt · không mở Case</span>
        : <span className="block text-xs text-slate-500">Không có Case mở</span>}
      {row.band !== null && row.missed === false && (
        <span className="mt-1 inline-flex"><Nhan tone="ok">{row.ratio ? 'Đạt' : 'Đạt kỳ vọng'}</Nhan></span>
      )}
      {row.band !== null && row.missed === null && (
        <span className="mt-1 block text-xs text-slate-500">{row.kck ? 'KCK' : '—'}</span>
      )}
    </span>
  );
}

/** Chip nhỏ, viền mảnh — `[MT1]`, `[SOS 3]` trong tên Case (T21). SOS chỉ hiện Ở ĐÂY, một lần (K3-08). */
const CHIP_SOS: Record<number, string> = { 1: 'bg-sos1-bg text-sos1', 2: 'bg-sos2-bg text-sos2', 3: 'bg-sos3-bg text-sos3' };
export function TenCase({ c }: { c: Pick<CaseCard, 'title' | 'tenSos'> }) {
  if (!c.tenSos) return <>{c.title}</>;
  const { mt, giua, sos } = c.tenSos;
  return (
    <span className="inline-flex min-w-0 max-w-full items-center gap-1.5">
      {mt && <span className="shrink-0 rounded border border-[color:var(--line-strong)] px-1 text-[11px] font-semibold leading-4 text-slate-300 tabular-nums">MT{mt}</span>}
      <span className="min-w-0 truncate">{giua}</span>
      {sos ? <span className={`shrink-0 rounded px-1 text-xs font-bold leading-4 tabular-nums ${CHIP_SOS[sos] ?? ''}`}>SOS {sos}</span> : null}
    </span>
  );
}

/** Mũi tên gập/mở vẽ SVG 8px (ký tự ▸/▾ ở cỡ nhỏ của Inter chỉ còn như một dấu chấm). */
function MuiTen({ mo }: { mo: boolean }) {
  return (
    <svg aria-hidden viewBox="0 0 8 8" width="8" height="8" className={`transition-transform ${mo ? 'rotate-90' : ''}`}>
      <path d="M2.5 1 6 4 2.5 7" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
/** Ổ khoá 12px nét 1.5 — PA theo quy chế. */
export function KhoaQuyChe() {
  return (
    <svg aria-hidden viewBox="0 0 12 12" width="12" height="12" className="shrink-0 text-slate-400">
      <rect x="2.25" y="5.25" width="7.5" height="5.5" rx="1" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path d="M4 5.25V3.75a2 2 0 0 1 4 0v1.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

/** Màu vạch trái 3px của hàng Case theo nhãn trạng thái (token có sẵn — không màu mới). */
const VACH_CASE: Record<TrangThai, string> = {
  'can-lam': 'var(--line-strong)', 'dang-lam': 'rgb(var(--doing-rgb))', 'cho-duyet': 'rgb(var(--wait-rgb))',
  'qua-han': 'rgb(var(--late-rgb))', xong: 'rgb(var(--done-line-rgb))', 'da-huy': 'rgb(var(--muted-line-rgb))',
};

/**
 * HÀNG CASE (M7, T20, YC-12.2): hàng đậm, vạch trái 3px theo trạng thái, nút gập; tên = chip MT + phần giữa + chip SOS; MỘT nhãn trạng
 * thái + hạn; gập vẫn giữ tiêu đề + tiến độ. Cột phải: `Xác nhận nguyên nhân` (chính) + `Không cần theo dõi…` (phụ) khi chờ nguyên nhân —
 * hai khối loại trừ (`khoiSos`, YC-12.1); còn lại `Mở Case`. Các PA là `HangPA` thụt vào bên dưới.
 */
function HangCase({ c, ngan, onChanged, onMoCase }: {
  c: CaseCard; ngan: (d: string | null | undefined) => string; onChanged?: () => void;
  onMoCase: (caseId: number, o?: MoCase) => void;
}) {
  const [khoiSos, setKhoiSos] = useState<null | 'khong-theo-doi'>(null);
  const daXong = c.status === 'done';
  const [mo, setMo] = useState(!daXong);
  const [moXong, setMoXong] = useState(false);
  const tt = c.trangThaiV4;
  const td = tienDoCase(c.plans, c);
  const chay = c.plans.filter(dangChay);
  const xong = c.plans.filter((p) => !dangChay(p));
  const choNguyenNhan = tt.k === 'cho-nguyen-nhan';
  const chanNut = tt.k === 'cho-nguyen-nhan' || tt.k === 'cho-duyet-khong-theo-doi';
  /* K3-08: Case chờ nguyên nhân chưa có gì để tóm tắt — dòng phụ trống. */
  const dongPhu = choNguyenNhan ? null : [
    c.issueLabel, td.text,
    c.carriedOver ? 'từ lộ trình trước' : null,
    c.backfilledOn ? `nhập bù${c.backfilledBy ? ` · ${c.backfilledBy}` : ''} ghi ngày ${ngan(c.backfilledOn)}` : null,
  ].filter(Boolean).join(' · ');

  return (
    <>
      <HangCon title={c.summary ?? undefined} className="hang-case">
        <td className="td" colSpan={2} style={{ boxShadow: `inset 3px 0 0 ${VACH_CASE[tt.t]}` }}>
          <span className="flex min-w-0 items-center gap-1.5">
            <button type="button" aria-expanded={mo} aria-label={`${mo ? 'Thu gọn' : 'Mở'} Case ${c.title}`} title={mo ? 'Thu gọn' : 'Mở'}
              onClick={() => setMo(!mo)}
              className="inline-flex h-5 w-5 shrink-0 appearance-none items-center justify-center rounded border-0 bg-transparent p-0 text-slate-400 hover:text-slate-100">
              <MuiTen mo={mo} />
            </button>
            <span className="min-w-0 truncate text-xs font-bold text-slate-100" title={c.title}><TenCase c={c} /></span>
          </span>
          {dongPhu && <span className="block truncate pl-[26px] text-[11px] text-slate-500" title={dongPhu}>{dongPhu}</span>}
        </td>
        <td className="td">
          <span className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
            <NhanTrangThai t={tt.t} title={tt.chu} />
            <span className="text-[11px] text-slate-300">
              {tt.k === 'dang-lam' ? td.text : tt.k === 'xong' ? null : tt.chu}
            </span>
          </span>
          {tt.han && !daXong && <span className="mt-0.5 block"><Han loai="xac-minh-sos" han={tt.han} /></span>}
          {daXong && c.outcomeLabel && <span className="mt-0.5 block text-[11px] text-slate-500">Kết luận: {c.outcomeLabel}</span>}
        </td>
        <td className="td">
          {choNguyenNhan && c.canEdit ? (
            khoiSos === null ? (
              <CotPhai nut={(
                <>
                  <button type="button" className="btn btn-sm btn-primary" onClick={() => onMoCase(c.id, { viec: 'xac-nhan' })}>Xác nhận nguyên nhân</button>
                  <button type="button" className="btn btn-sm btn-ghost" onClick={() => setKhoiSos('khong-theo-doi')}>Không cần theo dõi…</button>
                </>
              )} />
            ) : null
          ) : (
            <CotPhai nut={(
              <>
                <button type="button" className="btn btn-sm" onClick={() => onMoCase(c.id)}>Mở Case</button>
                {c.canEdit && !daXong && !chanNut && c.plans.length === 0 && (
                  <button type="button" className="btn btn-sm" onClick={() => onMoCase(c.id, { viec: 'them-pa' })}>+ Thêm PA</button>
                )}
              </>
            )} />
          )}
        </td>
      </HangCon>

      {/* YC-12.1: "Không cần theo dõi…" mở tại chỗ; nút Xác nhận nguyên nhân biến mất tới khi Huỷ. */}
      {khoiSos === 'khong-theo-doi' && (
        <HangCon>
          <td className="td" colSpan={4}>
            {/* Bảng cuộn ngang ở màn hẹp: khung bám mép trái vùng nhìn, rộng tối đa bằng màn — nút Gửi không bị cắt. */}
            <div className="sticky left-3 max-w-[calc(100vw-4rem)]">
              <KhongTheoDoiForm caseId={c.id} onClose={() => setKhoiSos(null)} onDone={() => { setKhoiSos(null); onChanged?.(); }} />
            </div>
          </td>
        </HangCon>
      )}

      {mo && chay.map((p) => <HangPA key={p.id} p={p} c={c} ngan={ngan} onMoCase={onMoCase} />)}
      {mo && xong.length > 0 && (
        <HangCon className="hang-pa">
          <td className="td" colSpan={4}>
            <button type="button" className="link inline-flex appearance-none items-center gap-1 border-0 bg-transparent p-0 text-[11px]" aria-expanded={moXong}
              onClick={() => setMoXong(!moXong)}>
              <MuiTen mo={moXong} /> {xong.length} PA đã xong
            </button>
          </td>
        </HangCon>
      )}
      {mo && moXong && xong.map((p) => <HangPA key={p.id} p={p} c={c} ngan={ngan} onMoCase={onMoCase} />)}
    </>
  );
}

/**
 * HÀNG PA (M7, T20): thụt vào, nền nhạt hơn một bậc, nhãn nhỏ `PA`, khoá + `theo quy chế` khi bắt buộc. Khoảng ngày CHỈ `từ dd/mm`
 * (xong: `từ dd/mm → dd/mm`, ngày xong thật) — không còn "dự kiến kết thúc" (Q28-4). PA quy chế có chữ mốc (`đến MT2 · W2 OCT`,
 * vàng khi chưa có lịch — K3-14). Cột phải (YC-12.5.4): nút ở trên, chữ phụ ở dưới.
 */
function HangPA({ p, c, ngan, onMoCase }: {
  p: Plan; c: CaseCard; ngan: (d: string | null | undefined) => string;
  onMoCase: (caseId: number, o?: MoCase) => void;
}) {
  const { homNay } = useNgayNghiepVu();
  const v = viecTiepPhuongAn(p);
  const han = p.actionDue ? deadlineView({ kind: 'cap-nhat-pa', due: p.actionDue, today: homNay }) : null;
  const khoang = p.startedOn ? `từ ${ngan(p.startedOn)}${p.completedOn ? ` → ${ngan(p.completedOn)}` : ''}` : null;
  const chuaLich = !!p.mocChu && /chưa có (lịch|ngày thi)/.test(p.mocChu);
  const dongPhu = [p.performer ?? 'chưa có người làm', khoang,
    p.closedReason === 'superseded' ? 'được thay' : p.revisions.length > 0 ? `điều chỉnh ${p.revisions.length} lần` : null].filter(Boolean).join(' · ');
  return (
    <HangCon className="hang-pa">
      <td className="td" colSpan={2}>
        <div className="flex min-w-0 items-center gap-1.5 pl-5">
          <span className="shrink-0 rounded border border-[color:var(--line-strong)] px-1 text-[11px] font-semibold leading-4 text-slate-400">PA</span>
          <button type="button" onClick={() => onMoCase(c.id, { paId: p.id })} title="Mở PA trong ngăn Case"
            className="min-w-0 appearance-none truncate border-0 bg-transparent p-0 text-left text-xs text-slate-100 hover:underline">
            {p.name}
          </button>
          {p.batBuoc && (
            <span className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap text-[11px] text-slate-400" title="PA theo quy chế SOS — không thay, không kết thúc sớm">
              <KhoaQuyChe />theo quy chế
            </span>
          )}
        </div>
        <span className="block truncate pl-5 text-[11px] text-slate-500" title={dongPhu}>
          {dongPhu}
          {p.mocChu && <span className={chuaLich ? 'text-soon' : ''}> · {p.mocChu}</span>}
        </span>
      </td>
      <td className="td">
        {p.lastOutcomeLabel ? (
          <Outcome tone={OUTCOME_TONE[p.lastOutcome ?? ''] ?? 'muted'} mark={OUTCOME_MARK[p.lastOutcome ?? '']} title={p.lastNote ?? undefined}>
            {p.lastOutcomeLabel}{p.lastOutcomeOn ? ` · ${ngan(p.lastOutcomeOn)}` : ''}
          </Outcome>
        ) : <span className="text-[11px] text-slate-500">{v.loai === 'cho-xac-nhan' ? 'Chưa bắt đầu' : 'Chưa có kết quả'}</span>}
      </td>
      <td className="td">
        {v.loai === 'cho-duyet' ? (
          <CotPhai phu={<><span className="text-wait">{v.text}</span>{v.due ? ` · hạn ${ngan(v.due)}` : null}</>} />
        ) : v.loai === 'cho-xac-nhan' ? (
          <CotPhai
            nut={c.canEdit && c.sos.hasCause ? (
              <button type="button" className="btn btn-sm btn-primary" onClick={() => onMoCase(c.id, { viec: 'xac-nhan-pa', paId: p.id })}>Xác nhận PA</button>
            ) : undefined}
            phu={<>Chờ xác nhận{c.sos.dueOn ? ` · hạn ${ngan(c.sos.dueOn)}` : ''}</>} />
        ) : v.loai === 'ghi-ket-qua' || v.loai === 'ghi-cuoi' ? (
          <CotPhai
            nut={c.canEdit ? (
              <button type="button" className="btn btn-sm" onClick={() => onMoCase(c.id, { viec: 'ghi-ket-qua', paId: p.id })}
                title={v.loai === 'ghi-cuoi' ? 'Tuần này chạm mốc quy chế — lưu là PA kết thúc' : 'Kết quả tuần, tiến triển, và quyết định cho PA'}>
                {v.loai === 'ghi-cuoi' ? 'Ghi kết quả cuối' : 'Ghi kết quả'}
              </button>
            ) : undefined}
            phu={han?.han} />
        ) : <CotPhai phu={<NhanTrangThai t={p.closedReason === 'khong_theo_doi' || p.status === 'cancelled' ? 'da-huy' : 'xong'} />} />}
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
        <span className="block text-xs text-slate-400 mt-0.5">chưa có dữ liệu</span>
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
      <span className="block text-xs text-slate-400 mt-0.5">
        {row.bandAttemptNo ? (row.ratio ? boNamCungNam(row.bandWeek, homNay) : `MT${row.bandAttemptNo}`) : ''}
        {row.ratio
          ? (row.missed === false ? ' · đạt' : row.missed === true ? ' · chưa đạt' : '')
          : row.expectation !== null ? ` · kỳ vọng ${fmtBand(row.expectation)}` : ''}
      </span>
      {!row.ratio && t !== null && row.trendFrom !== null && (
        <span className="block text-xs text-slate-400">
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

/**
 * Việc tiếp theo của cả hàng — MỘT việc (động từ + đối tượng) + hạn tách riêng (B-2/B-3). PR-SOS (K3-07): lấy `viecTiepCuaCase` của Case
 * đang mở gấp nhất (máy chủ tính sẵn); tín hiệu lớp thường chưa mở Case → "Tạo Case".
 */
function nextStepOf(row: Row, homNay: string): { viec: string; han: DeadlineView | null; title: string } | null {
  const dong = (viec: string, han: DeadlineView | null) => ({ viec, han, title: han && han.han !== 'chưa có hạn' ? han.text : viec });
  if (row.signal) {
    return dong('Tạo Case', deadlineView({ kind: 'xac-minh-sos', due: row.signal.verifyDue, today: homNay }));
  }
  const viec = row.cases.filter((c) => c.status !== 'done' && c.viecTiep).map((c) => c.viecTiep!)
    .sort((a, b) => (a.han ?? '9999').localeCompare(b.han ?? '9999'))[0];
  if (!viec) return null;
  return dong(viec.chu, viec.loaiHan && viec.han ? deadlineView({ kind: viec.loaiHan, due: viec.han, today: homNay }) : null);
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
      <span className="block text-xs text-slate-400">
        chưa có điểm
      </span>
    );
  }
  if (pts.length === 1) {
    return (
      <span className="block text-xs text-slate-400">
        {row.ratio ? 'mới có một bài' : `mới có MT${pts[0].attemptNo}`}
        {row.bandWeek ? ` · ${boNamCungNam(row.bandWeek, homNay)}` : ''}
      </span>
    );
  }
  return (
    <span className="flex flex-wrap items-center gap-x-1 text-xs text-slate-400 leading-tight">
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
