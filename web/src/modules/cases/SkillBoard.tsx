import { createContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { SCORE_CHIP, type ScoreTone } from '../../ui/ui.tsx';
import { fmtBand } from '../../lib/format.ts';
import { CHIP_VUONG } from '../../ui/Nhan.tsx';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import { type BanDieuChinh } from './CapNhatTuan.tsx';
import type { XinYKien } from './DongXinYKien.tsx';
import type { BoTro } from './CasePanel.tsx';
import {
  GIAI_THICH_KCK, chuTamDung, coNguoiDay, nhanNguoiDay, duongDotTest, tuanLich,
  type DeadlineKind, type TrangThai, type TrangThaiCaseV4,
} from '@shared/domain/index.ts';
import { t } from '@shared/i18n/index.ts';
import { ChipSos } from '../../ui/ChipSos.tsx';

/**
 * TIẾN ĐỘ VÀ HỖ TRỢ THEO KỸ NĂNG — khối chính của hồ sơ học viên (mục 4.2).
 *
 * Mỗi hàng trả lời bốn câu, đúng thứ tự người dạy hỏi:
 *
 *   kỹ năng · kết quả gần nhất · vấn đề đang theo dõi · việc tiếp theo
 *
 * BẤM MỘT HÀNG THÌ CASE MỞ RA NGAY BÊN DƯỚI hàng đó. Một kỹ năng có nhiều Case thì mỗi Case
 * là MỘT THẺ RIÊNG, đóng mở độc lập — mở cái này không đóng cái kia.
 *
 * THỨ TỰ: Case đang xử lý và mới cập nhật ở trên, Case đã hoàn thành ở dưới. Người mở hồ sơ
 * hỏi "giờ đang thế nào", không hỏi "ba tháng trước bắt đầu ra sao".
 */

type Plan = {
  id: number; kind: string; kindLabel: string; name: string;
  /** PA theo quy chế SOS (§3.2): dấu khoá `theo quy chế` cạnh tên — không thay, không kết thúc sớm. */
  preset: boolean; confirmedAt: string | null;
  /** PR-SOS: bắt buộc · chờ xác nhận (Q28-3) · chữ mốc (`đến MT2 · W2 OCT`) · lần ghi tới là "Ghi kết quả cuối" (T22). */
  batBuoc: boolean; choXacNhan: boolean; mocChu: string | null; lanCuoi: boolean;
  performer: string | null; status: string; statusLabel: string;
  /** PR-PA (§8): Số buổi (null = không đếm) và Đã dạy — dòng phụ "3/10 buổi". */
  soBuoi?: number | null; daDay?: number;
  /** PR-PA: người xem ghi được Kết quả PA này (người giữ việc hoặc quyền theo vai trò) — chặn nút Kết quả, như máy chủ. */
  ghiDuoc?: boolean;
  /** PR-LT2a: PA Bổ trợ chưa chạy — chờ kế hoạch được Quản lý duyệt (không phải "Chờ xác nhận"). */
  chuaChay?: boolean;
  startedOn: string | null; completedOn: string | null;
  actionDue: string | null; actionOverdue: boolean;
  followupDue: string | null; followupOverdue: boolean;
  pendingApproval: boolean; approvalDue: string | null;
  /** PR-UXF-b (O1): thẻ Xin ý kiến gần nhất của PA (máy chủ nạp một câu cho cả bảng). */
  xinYKien?: XinYKien;
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
  /** Chủ đề gốc của Case (§7.5, PR-K) — để mở đúng danh mục phân loại khi "Xác định nguyên nhân". */
  topic: string | null;
  /** Case tự tạo từ SOS: chờ xác nhận nguyên nhân, hạn xác nhận, thẻ Không cần theo dõi, lý do huỷ (§3.2, §7.5, PR-SOS). */
  sos: {
    fromSos: boolean; hasCause: boolean;
    awaitingCause: boolean; dueOn: string | null;
    dismissed: { code: string; label: string; text: string | null } | null;
    choDuyetKhongTheoDoi: { hanDuyet: string | null } | null; coPaChoXacNhan: boolean;
  };
  /** PR-SOS (T21): `[MT1]` + phần giữa + `[SOS 3]` — null với Case tay / lớp thường. */
  tenSos: { mt: number | null; giua: string; sos: number | null; kck?: boolean } | null;
  /** PR-LT2a: khối PA Bổ trợ Giữa khoá — người xem nộp được kế hoạch không, kế hoạch đang ở đâu. */
  boTro?: BoTro | null;
  /** PR-SOS (§7.3, K3-07): MỘT nhãn trạng thái + MỘT việc tiếp (máy chủ tính bằng `sosV4.ts`). */
  trangThaiV4: { k: TrangThaiCaseV4; t: TrangThai; chu: string; han: string | null };
  viecTiep: { chu: string; loaiHan: DeadlineKind | null; han: string | null; paId?: number } | null;
  /** PR-VAI-b (Q3): người làm việc tiếp — máy chủ tính một chỗ (`nguoiLamCua`); "Quản lý" khi chờ duyệt (vai, không tên). */
  nguoiLam?: { id: number | null; ten: string | null } | null;
  urgency: string | null; sosLevel: number | null;
  carriedOver: boolean; parallel: boolean;
  openedOn: string | null; touchedOn: string | null;
  issueCode: string | null; issueLabel: string | null;
  /** Hotfix 15/10: nhóm phụ + nhận xét (Case MT: nhận xét của bài) — dòng phụ. */
  nhomPhu?: string[]; nhanXet?: string | null;
  summary: string | null;
  canEdit: boolean;
  /** OV-12c: nút "Xác nhận Case" Progress — GVCN lớp đang học làm được dù không dạy môn (cùng luật máy chủ). */
  coTheXacNhanCase?: boolean;
  /** Người xem chốt được Case không, và còn gì đang chặn — thẻ tự nói, không phải mở khối thứ hai. */
  canClose: boolean; closeBlockers: string[];
  plans: Plan[];
  attempts: { attemptNo: number; week: string | null; attemptKind?: string | null }[];
  /** VIEW-CASE-LUOT: lượt của Case — chip lượt ở `TenCase` là link tới trang lượt. */
  luot?: LuotCase | null;
  followUntil: string | null; followOverdue: boolean;
  outcomeLabel: string | null; outcomeNote: string | null; closedOn: string | null;
  /** NHẬP BÙ (PR-C Task 3, chốt 7) — ai ghi lại, ghi lúc nào. Null khi ghi tại chỗ như bình thường. */
  backfilledBy: string | null; backfilledOn: string | null;
  /** Số bằng chứng của Case (PR-HV) — nhãn "Bằng chứng (n)" thu gọn. */
  attachmentCount: number;
};
export type Row = {
  category: string; label: string; short: string;
  /** PR-UXF-b (R5-5): nhóm "Case bàn giao" — mã lớp cũ của Case có tên môn khác chương trình đang xem (G+V ≠ Writing). Hàng chuẩn: null. */
  tuLopTruoc?: string | null;
  /** Mã chương trình lộ trình — bộ nguyên nhân theo môn (T57: FOU G+V / P, Pre FOU Tổng hợp). */
  chuongTrinh?: string | null;
  band: number | null; bandAttemptNo: number | null; bandWeek: string | null;
  /** PR-VAI-b (G5): id lượt của `bandAttemptNo` — liên kết hồ sơ Mock cuộn tới kỹ năng. */
  bandAttemptId?: number | null;
  expectation: number | null; missed: boolean | null;
  /** PR-S3F #5 + OV-9: lộ trình có dấu KCK — có Target thì có kỳ vọng (dưới kỳ vọng tô trung tính); chưa có Target thì `missed` null, KHÔNG phải "đạt". */
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
  openActions: number;
  overdueActionDue: string | null; pendingApproval: boolean;
  points: {
    attemptNo: number; band: number; expectation: number | null;
    score: number | null; total: number | null; passed: boolean | null;
    attemptKind?: string | null;
  }[];
  score: number | null; total: number | null; ratio: boolean;
  cases: CaseCard[];
};

/**
 * NHÃN TẠM DỪNG (T65, Q11) — em đang Tạm dừng thì mọi hạn dừng: nhãn vàng `Tạm dừng từ 21/09` thay "Quá hạn" và "⚠ quá hạn n ngày" ở bảng
 * kỹ năng, Ngăn Case. Chỉ đổi chữ (máy chủ đã lọc em Tạm dừng khỏi số liệu). Ngày dd/mm — ngày của sự việc.
 */
export function NhanTamDung({ tu }: { tu: string }) {
  return (
    <span className="inline-flex items-center whitespace-nowrap rounded-md bg-soon-bg px-1.5 py-0.5 text-[12px] font-semibold tabular-nums text-soon"
      title={t('Em đang Tạm dừng học — mọi hạn đang dừng; quay lại học thì hạn tính lại từ ngày quay lại')}>
      {chuTamDung(`${tu.slice(8, 10)}/${tu.slice(5, 7)}`, true)}
    </span>
  );
}
/** Ngày Tạm dừng của em (null = đang học) — đọc ở mọi hàng của bảng mà không truyền tay qua từng tầng. */
export const TamDungCtx = createContext<string | null>(null);

/** Việc mở ngăn Case từ bảng này (Q3): không còn form trải trong trang. `viec` không có = mở view Case. PR-SOS: + Xác nhận Case / PA. */
export type MoCase = { viec?: 'ghi-ket-qua' | 'them-pa' | 'xac-nhan' | 'xac-nhan-pa'; paId?: number };

/** Khoá hàng: nhóm "Case bàn giao" cùng `category` với hàng chuẩn của chương trình mới (G+V ↔ Writing) nên cần khoá riêng. */
export const khoaHang = (r: { category: string; tuLopTruoc?: string | null }) => (r.tuLopTruoc ? `${r.category}@truoc` : r.category);

/** Đang xử lý / mới cập nhật lên trước, đã hoàn thành xuống dưới, đã huỷ / hệ thống đóng cuối cùng. */
export function xepCase(cases: CaseCard[]): CaseCard[] {
  const done = (x: CaseCard) => (x.trangThaiV4.t === 'da-huy' ? 2 : x.status === 'done' ? 1 : 0);
  return [...cases].sort((a, b) => done(a) - done(b) || (b.touchedOn ?? '').localeCompare(a.touchedOn ?? '') || b.id - a.id);
}

/** Chip nhỏ, viền mảnh — `[MT1]`, `[SOS 3]` trong tên Case (T21). SOS chỉ hiện Ở ĐÂY, một lần (K3-08). */
/** VIEW-CASE-LUOT: lượt mà Case gắn (máy chủ `luotCuaCase`) — đủ để dựng đường bằng `duongDotTest`. */
export type LuotCase = { id: number; kind: string; classId: number | null; dot: string; tuan?: string | null };
const CHIP_LUOT = 'shrink-0 rounded border border-[color:var(--line-strong)] px-1 text-[12px] font-semibold leading-4 text-slate-300 tabular-nums';

/**
 * VIEW-CASE-LUOT: link tới trang lượt của Case (FT → mock-test, lớp thường → luot-test, ?kn= theo môn) qua `duongDotTest` — kiểu `.link-luot`
 * của mockup `panel-pilot.html` (đầu mục Case): chữ 600 13 px màu nhấn, gạch chân lệch 3 px, "MT3 · W2 SEP" (không ký hiệu mũi tên — chủ SP 28/10). Đang ở chính trang lượt đó → chip thường.
 * Vùng bấm 44 px ở điện thoại bằng `after` (như ⋯ `MenuDong`).
 */
export function LinkLuot({ luot, kn = null }: { luot: LuotCase; kn?: string | null }) {
  const { pathname } = useLocation();
  const den = duongDotTest({ id: luot.id, kind: luot.kind, classId: luot.classId }, kn);
  if (den.split('?')[0] === pathname) return <span className={CHIP_LUOT}>{luot.dot}</span>;
  return (
    <Link to={den} className="relative shrink-0 whitespace-nowrap text-[13px] font-semibold tabular-nums text-[color:var(--accent)] underline underline-offset-[3px] after:absolute after:-inset-x-1 after:-inset-y-[14px] after:content-[''] sm:after:hidden"
      title={t('Mở lượt {x}', { x: luot.dot })}>{[luot.dot, luot.tuan ? tuanLich(luot.tuan) : null].filter(Boolean).join(' · ')}</Link>
  );
}

/**
 * Tên Case: chip lượt + phần giữa + chip SOS. `luot` (chỉ nơi không nằm trong nút — khối Case hồ sơ HV) → chip lượt là `LinkLuot`; `anLuot` = bỏ chip lượt
 * (thân Case: link lượt đã ở đầu mục). Case lớp thường không có `tenSos` — tên "[Progress Test] …" bỏ tiền tố trùng lượt.
 */
export function TenCase({ c, luot = null, kn = null, anLuot = false }: { c: Pick<CaseCard, 'title' | 'tenSos'>; luot?: LuotCase | null; kn?: string | null; anLuot?: boolean }) {
  const chip = (nhan: string) => (anLuot ? null : luot ? <LinkLuot luot={luot} kn={kn} /> : <span className={CHIP_LUOT}>{nhan}</span>);
  /* Có link lượt: tên xuống dòng sau link, không cắt. Nơi khác giữ một dòng cắt "…". */
  const khung = luot ? 'inline-flex min-w-0 max-w-full flex-wrap items-center gap-x-1.5 gap-y-0.5' : 'inline-flex min-w-0 max-w-full items-center gap-1.5';
  const lopTen = luot || anLuot ? 'min-w-0' : 'min-w-0 truncate max-sm:whitespace-normal max-sm:overflow-visible max-sm:break-words';
  if (!c.tenSos) {
    if (!luot) return <>{c.title}</>;
    const tienTo = `[${luot.dot}] `;
    return (
      <span className={khung}>
        {chip(luot.dot)}
        <span className={lopTen}>{c.title.startsWith(tienTo) ? c.title.slice(tienTo.length) : c.title}</span>
      </span>
    );
  }
  const { mt, giua, sos, kck } = c.tenSos;
  return (
    <span className={khung}>
      {mt && chip(luot?.dot ?? `MT${mt}`)}
      <span className={lopTen}>{giua}</span>
      {/* OV-9: Case nhẹ của em KCK — chip trung tính, không SOS, không đỏ. */}
      {kck ? <span className="shrink-0 rounded border border-[color:var(--line-strong)] px-1 text-[12px] font-semibold leading-4 text-slate-300" title={GIAI_THICH_KCK}>KCK</span>
        : sos ? <ChipSos muc={sos} dot={mt ? `MT${mt}` : null} tinh /> : null}
    </span>
  );
}

/** Mũi tên gập/mở vẽ SVG 8px (ký tự ▸/▾ ở cỡ nhỏ của Inter chỉ còn như một dấu chấm). */
export function MuiTen({ mo }: { mo: boolean }) {
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

/**
 * NHÃN LOẠI (Q13, luật chung cả hồ sơ — mockup 24, 26): `Case` = khung RỖNG (viền chữ chính, không nền) · `PA` = khối ĐẶC (nền `line-strong`);
 * PA đang chờ (Hành trình: chờ Quản lý duyệt PA / khối chờ): nền tím nhạt.
 */
export function NhanLoai({ loai, cho }: { loai: 'Case' | 'PA'; cho?: boolean }) {
  const lop = loai === 'Case' ? 'border-current text-slate-100'
    : cho ? 'border-transparent bg-muted-bg text-muted' : 'border-transparent bg-[color:var(--line-strong)] text-slate-100';
  return <span className={`${CHIP_VUONG} shrink-0 ${lop}`}>{loai}</span>;
}

/** PR-PA (§8): "3/10 buổi" ở dòng phụ của PA có Số buổi (bảng kỹ năng, thẻ 375). */
export const chuBuoi = (p: { soBuoi?: number | null; daDay?: number }) => (p.soBuoi != null ? t('{x}/{soBuoi} buổi', { x: p.daDay ?? 0, soBuoi: p.soBuoi }) : null);
/** PR-PA (§8): người ở dòng phụ PA — theo Loại như panel Case: Tự học không có người; Tutor/Bổ trợ "chưa có người dạy". */
export const chuNguoi = (p: { kind: string; performer?: string | null }) =>
  coNguoiDay(p.kind) ? p.performer ?? (nhanNguoiDay(p.kind) === 'Người dạy' ? t('chưa có người dạy') : t('chưa có người thực hiện')) : null;

/** Dòng dưới ô điểm: `MT1 · kỳ vọng 5.5` · KCK: `MT1 · KCK` · lớp thường: `W4 SEP · đạt`. Bảng và thẻ điện thoại dùng chung. */
export function DongMt({ row }: { row: Row }) {
  const { homNay } = useNgayNghiepVu();
  return (
    <>
      {row.bandAttemptNo ? (row.ratio ? boNamCungNam(row.bandWeek, homNay) : row.bandAttemptId
        ? <Link to={duongDotTest({ id: row.bandAttemptId, kind: 'mock' }, row.category)} className="link tabular-nums max-sm:inline-block max-sm:py-3 max-sm:-my-3"
          title={t('Mở Hồ sơ Mock Test · MT{bandAttemptNo} · {label}', { bandAttemptNo: row.bandAttemptNo, label: row.label })} onClick={(e) => e.stopPropagation()}>MT{row.bandAttemptNo}</Link>
        : `MT${row.bandAttemptNo}`) : ''}
      {row.ratio
        ? (row.missed === false ? t(' · đạt') : row.missed === true ? t(' · chưa đạt') : '')
        : `${row.expectation !== null ? t(' · kỳ vọng {fmtBand}', { fmtBand: fmtBand(row.expectation) }) : ''}${row.kck ? ' · KCK' : ''}`}
    </>
  );
}

/** Mã tuần "W1 SEP 2026" → "W1 SEP" khi cùng năm với hôm nay (G-6: chỉ hiện năm khi khác năm). */
function boNamCungNam(code: string | null, homNay: string): string {
  if (!code) return '';
  const m = /^(.*\S)\s(\d{4})$/.exec(code);
  return m && m[2] === homNay.slice(0, 4) ? m[1] : code;
}

export function gapText(gap: number): string {
  if (gap === 0) return t('đạt kỳ vọng');
  return gap < 0 ? `-${Math.abs(gap)}` : `+${gap}`;
}

/* Bảng bốn màu điểm nằm ở MỘT chỗ duy nhất: `ui.tsx` (SCORE_CHIP / SCORE_TEXT). */
/** Chip điểm của một hàng — thẻ điện thoại dùng chung với ô điểm của bảng. */
export const SCORE_CHIP_ROW = (row: Row): string => SCORE_CHIP[scoreToneFamily(row)];
function scoreToneFamily(row: Row): ScoreTone {
  if (row.band === null) return 'slate';
  if (row.ratio) {
    if (row.missed === null) return 'slate';
    return row.missed ? 'rose' : 'emerald';
  }
  if (row.expectation === null) return 'slate';
  if (row.band < row.expectation) return row.kck ? 'slate' : 'rose';   // OV-9: em KCK dưới kỳ vọng — không đỏ
  if (row.band === row.expectation) return 'sky';
  return 'emerald';
}

export type { Row as SkillBoardRow, CaseCard, Plan };
