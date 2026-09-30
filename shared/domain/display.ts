/**
 * LUẬT HIỂN THỊ DÙNG CHUNG — bốn lỗi lặp ở nhiều màn được đóng ở ĐÂY, không ở từng màn.
 *
 *   hạn không nói rõ là hạn gì            → `deadlineView`        (F11, rule book §9.2)
 *   badge "đạt" khi chưa đủ điểm          → `attemptProgressView` (MT-P01, MT-P02)
 *   phần trăm không có mẫu số             → `rateView`            (rule book §11)
 *   ngày nghiệp vụ lẫn ngày ghi nhận      → `businessDateText`    (MT-P10)
 *
 * TẠI SAO LÀ HÀM THUẦN Ở `shared/`: component React (`web/src/ui/Han.tsx`, `KetQuaDot.tsx`,
 * `TyLe.tsx`) chỉ là lớp vẽ mỏng phía trên các hàm này. Luật nằm ở một chỗ duy nhất, kiểm
 * được bằng bộ kiểm thử của máy chủ (không cần trình duyệt), và giao diện không có luật riêng
 * để sai khác đi. Ba component gọi cùng một hàm thì không thể có hai màn hai câu.
 *
 * Đặc tả: `thiet-ke/HE_GIAO_DIEN.md` §4–§7.
 */
import { MONTH_CODE, mondayOfDate, owningMonthOf, weekNumberInMonthOf } from './week.ts';

const DAY_MS = 86_400_000;
const dayNumber = (iso: string) => Date.parse(`${iso.slice(0, 10)}T00:00:00Z`) / DAY_MS;

/** Số ngày từ `from` đến `to` (dương nếu `to` muộn hơn). */
function daysBetween(from: string, to: string): number {
  return Math.round(dayNumber(to) - dayNumber(from));
}

/** Ngày theo lịch có thật không — `Date.parse` tự lăn 31/02 thành 03/03 nên không dùng được một mình. */
function ngayCoThat(y: number, m: number, d: number): boolean {
  const t = new Date(Date.UTC(y, m - 1, d));
  return t.getUTCFullYear() === y && t.getUTCMonth() === m - 1 && t.getUTCDate() === d;
}

/**
 * NGÀY THẬT CỦA MỘT CHUỖI, THEO GIỜ VIỆT NAM (G-6, nợ sau rà PR-O #58) — `YYYY-MM-DD` hoặc `null`.
 *
 *   ngày trần            giữ nguyên (sau khi kiểm ngày có thật)
 *   có giờ, có múi giờ    đổi về +7 rồi lấy ngày
 *   có giờ, không múi giờ coi là UTC — `nowIso()` và `datetime('now')` của SQLite đều ghi UTC
 *
 * 31/02, 29/02 năm thường, tháng 13, giờ 25 → `null`. Mọi hàm hiện ngày đi qua đây, nên 20:00 UTC ngày 22 hiện là 23/09.
 */
export function ngayTheoGioVN(s: string | null | undefined): string | null {
  if (!s) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2})(?:\.\d+)?)?(Z|[+-]\d{2}:?\d{2})?)?$/.exec(s.trim());
  if (!m) return null;
  const [, y, mo, d, hh, mi, ss, tz] = m;
  if (!ngayCoThat(Number(y), Number(mo), Number(d))) return null;
  if (hh === undefined) return `${y}-${mo}-${d}`;
  const muiGio = !tz || tz === 'Z' ? 'Z' : tz.includes(':') ? tz : `${tz.slice(0, 3)}:${tz.slice(3)}`;
  const t = Date.parse(`${y}-${mo}-${d}T${hh}:${mi}:${ss ?? '00'}${muiGio}`);
  if (Number.isNaN(t)) return null;
  return new Date(t + 7 * 3_600_000).toISOString().slice(0, 10);
}

const validIso = (s: string | null | undefined): s is string => ngayTheoGioVN(s) !== null;

/**
 * NGÀY VIẾT NGẮN: `14/09` khi cùng năm với `today`, `05/01/2027` khi sang năm khác — để một
 * cột ngày không bao giờ khiến người đọc phải đoán năm nào (HE_GIAO_DIEN §2). Cả hai tham số đi qua giờ Việt Nam.
 */
export function shortDate(iso: string | null | undefined, today: string): string {
  const s = ngayTheoGioVN(iso);
  if (!s) return '—';
  const dm = `${s.slice(8, 10)}/${s.slice(5, 7)}`;
  const nam = (ngayTheoGioVN(today) ?? today).slice(0, 4);
  return s.slice(0, 4) === nam ? dm : `${dm}/${s.slice(0, 4)}`;
}

// ====================================================================== <TyLe>

/**
 * Cỡ mẫu dưới ngưỡng này thì gắn nhãn "mẫu nhỏ" (rule book §11: mẫu nhỏ không được gọi là
 * "tốt nhất"). Một hằng số có tên — muốn đổi ngưỡng thì đổi đúng một dòng.
 */
export const SMALL_SAMPLE_BELOW = 5;

export type RateView =
  /** N = 0 — không có gì để chia. KHÔNG được vẽ thành 0%. */
  | { kind: 'no-data' }
  | { kind: 'value'; n: number; N: number; percent: number; smallSample: boolean }
  /** n > N, số âm, không nguyên, NaN — dữ liệu sai, phải lộ ra chứ không vẽ một con số nghe hợp lý. */
  | { kind: 'invalid' };

/**
 * PHẦN TRĂM KHÔNG BAO GIỜ ĐỨNG MỘT MÌNH: `n/N` trước, `%` trong ngoặc sau.
 *
 * Hàm này CỐ Ý không có tham số "xếp hạng" hay "tốt nhất": một tỷ lệ chỉ là một tỷ lệ, và xếp
 * hạng giáo viên hay đơn vị bằng nó (nhất là với mẫu nhỏ) là điều rule book §11 cấm.
 */
export function rateView(n: number, N: number): RateView {
  if (!Number.isInteger(n) || !Number.isInteger(N) || n < 0 || N < 0 || n > N) return { kind: 'invalid' };
  if (N === 0) return { kind: 'no-data' };
  return { kind: 'value', n, N, percent: Math.round((n / N) * 100), smallSample: N < SMALL_SAMPLE_BELOW };
}

export function rateText(n: number, N: number, label?: string): string {
  const v = rateView(n, N);
  if (v.kind === 'no-data') return 'Chưa có dữ liệu';
  if (v.kind === 'invalid') return 'Số liệu không hợp lệ';
  return `${v.n}/${v.N}${label ? ` ${label}` : ''} (${v.percent}%)${v.smallSample ? ' · mẫu nhỏ' : ''}`;
}

// ====================================================================== <KetQuaDot>

/** Tone chỉ có bốn — trùng bốn màu điểm ở `ui.tsx`: đỏ dưới kỳ vọng, xanh dương bằng, xanh lá vượt, xám thiếu dữ liệu. */
export type ProgressTone = 'muted' | 'danger' | 'info' | 'ok';

export type ProgressOverall =
  /** Chưa đủ điểm các kỹ năng bắt buộc — Overall là chữ "Chưa đủ điểm", cấm badge đạt. */
  | 'incomplete'
  | 'passed'
  | 'not-passed'
  /** Đủ điểm nhưng lộ trình chưa có kỳ vọng để so — không bịa ra đạt hay chưa đạt. */
  | 'no-expectation'
  /** Số liệu đầu vào vô lý (kể cả đếm nhầm W1/W2 thành hai kỹ năng) — lộ ra thay vì vẽ. */
  | 'invalid';

/** Đơn vị đếm là BỐN kỹ năng L/R/W/S. W1/W2 là hai bài nhập của Writing, không phải hai kỹ năng. */
export const ATTEMPT_SKILL_UNITS = 4;

export type AttemptProgressInput = {
  /** Số KỸ NĂNG (L/R/W/S) đã có điểm. */
  scored: number;
  /** Số KỸ NĂNG bắt buộc của đợt. */
  required: number;
  /** Overall đạt kỳ vọng; null khi chưa đủ điểm hoặc chưa có kỳ vọng. */
  passed: boolean | null;
  /** Số kỹ năng dưới kỳ vọng ở các môn đã chấm; null khi chưa tính được. */
  sos: number | null;
  /**
   * CHẾ ĐỘ CHỮ (PR-Qb, Q17) — `ielts` (mặc định, mọi nơi gọi cũ không đổi) nói "kỹ năng"/"kỳ
   * vọng"/"Overall" như FT; `ratio` nói "môn"/"đạt" như lớp thường, KHÔNG có khái niệm Overall
   * hay "kỳ vọng" — lớp thường chỉ có ĐẠT hay CHƯA ĐẠT từng môn.
   */
  cheDo?: 'ielts' | 'ratio';
  /**
   * CHỈ `cheDo: 'ratio'` — số môn chưa đạt THẬT, đủ điểm cả 4 môn. `sos` (`sosLevel`) bị chặn
   * trần ở 3 nên KHÔNG dùng được để dựng "Đạt {k}/{n} môn" khi trượt cả 4 — thiếu trường này thì
   * tạm lấy `sos` (sai khi trượt ≥ 3 môn); luôn truyền khi biết được.
   */
  soMonChuaDat?: number | null;
};

export type AttemptProgressView = {
  /** MỘT câu duy nhất cho tiến độ một đợt Test — đầu hồ sơ, bảng lớp, bảng tuần, hành trình đều dùng chính câu này. */
  text: string;
  tone: ProgressTone;
  overall: ProgressOverall;
  /** Chữ hiện ở ô Overall khi chưa đạt được kết luận — không phải ô trống, không phải 0.0. */
  overallText: string;
  /** CHỈ true khi đủ điểm VÀ Overall đạt kỳ vọng. Chưa đủ điểm thì luôn false, bất kể `passed`. */
  passBadge: boolean;
  /** SOS mới chấm một phần (chưa đủ điểm): số còn đổi được — vẽ viền nét đứt + `title`, không ⚠ (PR-UX3 Q13, B-7). */
  tamThoi?: boolean;
  /** Câu giải thích cho tooltip khi `tamThoi`: "Tạm thời: 1/3 môn có điểm". */
  title?: string;
};

/**
 * MỘT CÂU DUY NHẤT cho tiến độ một đợt Test.
 *
 * Hai luật cứng (HE_GIAO_DIEN §5):
 *   (a) scored < required → Overall là "Chưa đủ điểm" và TUYỆT ĐỐI không có badge đạt, dù
 *       `passed` được truyền vào là true. Đây là lỗi MT-P01: Overall trống mà badge vẫn "Đạt".
 *   (b) đơn vị đếm là bốn kỹ năng. required > 4 hoặc scored > required nghĩa là ai đó đang
 *       đếm bài nhập (W1/W2) thay vì kỹ năng — báo lỗi, không vẽ "1/5 kỹ năng" (MT-P02).
 */
export function attemptProgressView(i: AttemptProgressInput): AttemptProgressView {
  const { scored, required, passed, sos, cheDo = 'ielts', soMonChuaDat } = i;
  const ratio = cheDo === 'ratio';
  const donVi = ratio ? 'môn' : 'kỹ năng';
  const bad = (why: string): AttemptProgressView => ({
    text: `Số liệu tiến độ không hợp lệ (${why})`, tone: 'muted', overall: 'invalid',
    overallText: 'Chưa đủ điểm', passBadge: false,
  });
  if (!Number.isInteger(scored) || !Number.isInteger(required) || scored < 0 || required <= 0) {
    return bad(`đợt không có ${donVi} bắt buộc nào`);
  }
  if (!ratio && required > ATTEMPT_SKILL_UNITS) return bad('đơn vị đếm là bốn kỹ năng L/R/W/S, W1/W2 là hai bài nhập');
  if (scored > required) return bad(`số ${donVi} có điểm vượt số yêu cầu`);

  const incomplete = (text: string, tone: ProgressTone): AttemptProgressView => ({
    text, tone, overall: 'incomplete', overallText: 'Chưa đủ điểm', passBadge: false,
  });

  if (scored === 0) return incomplete(`Chưa có điểm · 0/${required} ${donVi}`, 'muted');

  if (scored < required) {
    if (sos !== null && sos > 0) {
      /* Số tạm KHÔNG được nói như số cuối: mới chấm một phần, mức SOS còn có thể đổi khi đủ điểm. PR-N1 A2: chữ "tạm thời"
         nằm NGAY trong câu (không chỉ tooltip) + màu của mức SOS với viền nét đứt ở `KetQuaDot`. */
      const tam = { tamThoi: true, title: `Tạm thời: ${scored}/${required} ${donVi} có điểm` };
      if (ratio) return { ...incomplete(`${scored - sos}/${scored} ${donVi} đạt · tạm thời`, 'danger'), ...tam };
      return { ...incomplete(`SOS ${sos} tạm thời · ${scored}/${required} ${donVi}`, 'danger'), ...tam };
    }
    if (sos === 0) {
      return incomplete(ratio
        ? `${scored}/${scored} ${donVi} đạt · còn ${required - scored} ${donVi}`
        : `Các ${donVi} đã chấm đều đạt · còn thiếu ${required - scored}`, 'muted');
    }
    return incomplete(ratio
      ? `${scored}/${scored} ${donVi} đạt · còn ${required - scored} ${donVi}`
      : `${scored}/${required} ${donVi} có điểm`, 'muted');
  }

  /* Đủ điểm. */
  if (sos !== null && sos > 0) {
    const soChuaDatThat = ratio ? (soMonChuaDat ?? sos) : sos;
    return {
      /* PR-N1 A4: "x/y môn đạt" — không nhãn đỏ nào mở đầu bằng "Đạt" ("0/4 môn đạt · SOS 3"). */
      /* PR-LT2a (T58): lớp thường không có chữ SOS — chỉ `x/y môn đạt`. */
      text: ratio ? `${required - soChuaDatThat}/${required} ${donVi} đạt` : `Đã đủ điểm · SOS ${sos}`,
      tone: 'danger', overall: 'not-passed', overallText: ratio ? 'Chưa đạt' : 'Chưa đạt kỳ vọng', passBadge: false,
    };
  }
  if (passed === true) {
    return {
      text: ratio ? `${required}/${required} ${donVi} đạt` : 'Đã đủ điểm · Đạt kỳ vọng',
      tone: 'info', overall: 'passed', overallText: ratio ? 'Đạt' : 'Đạt kỳ vọng', passBadge: true,
    };
  }
  if (passed === false) {
    return {
      text: ratio ? `Chưa đạt ${required}/${required} ${donVi}` : 'Đã đủ điểm · Overall chưa đạt kỳ vọng',
      tone: 'danger', overall: 'not-passed', overallText: ratio ? 'Chưa đạt' : 'Chưa đạt kỳ vọng', passBadge: false,
    };
  }
  return {
    text: ratio ? `${required}/${required} ${donVi} đã chấm` : 'Đã đủ điểm · chưa có kỳ vọng để so',
    tone: 'muted', overall: 'no-expectation',
    overallText: 'Chưa có kỳ vọng', passBadge: false,
  };
}

// ====================================================================== <Han>

/**
 * MƯỜI MỘT LOẠI HẠN, mỗi loại một đồng hồ riêng + một thứ KHÔNG PHẢI HẠN (`du-kien-ket-thuc`).
 *
 * Rule book §9.2: hạn thực hiện PA, cập nhật PA, nhập điểm và duyệt lịch không dùng chung một
 * trường — nên cũng không được dùng chung một cách hiển thị. `du-kien-ket-thuc` là ngày DỰ
 * KIẾN, không ai "trễ" nó: nhầm nó thành hạn là lỗi F11.
 */
export const DEADLINE_KINDS = [
  /* PR-YT4 (K5-24): bỏ `thuc-hien-y-thuc`, `hoan-thanh-y-thuc` (mô hình Case Ý thức cũ) — Ý thức dùng `xu-ly-vi-pham`. */
  'xac-minh-sos', 'lap-pa', 'cap-nhat-pa', 'nhap-diem',
  'du-kien-ket-thuc', 'viec-van-hanh',
  /* PR-NEN Q16 (K1-56 + T66): bốn loại hạn mới — chưa chỗ nào gắn, PR sau gắn khi có hạn thật. */
  'duyet', 'xu-ly-vi-pham', 'ke-hoach-bo-tro', 'mini-test',
] as const;
export type DeadlineKind = (typeof DEADLINE_KINDS)[number];

/**
 * Việc + tiền tố hạn của từng loại — MỘT nơi duy nhất, khớp bảng ở HE_GIAO_DIEN §4.
 * PR-UX0 (B-2/B-3): "việc" là tiêu đề dòng ở chỗ hiện hạn, còn `<Han>` chỉ nói mốc ("hạn hết T2 28/09").
 * PR-N1 (R-PA1/R-PA3): hạn ghi kết quả tuần là HẾT THỨ HAI tuần kế tiếp; việc có hạn nói rõ tuần ("Ghi kết quả tuần W4 SEP").
 */
const DEADLINE_VIEC: Record<DeadlineKind, { viec: string; tien: 'hạn' | 'hạn hết T2' | 'dự kiến kết thúc' }> = {
  /* PR-NEN Q16: giữ khoá `xac-minh-sos`, chữ đổi theo thuật ngữ chốt (như N1 Q4). */
  'xac-minh-sos': { viec: 'Xác nhận nguyên nhân', tien: 'hạn' },
  'lap-pa': { viec: 'Đề ra PA', tien: 'hạn' },
  'cap-nhat-pa': { viec: 'Ghi kết quả PA', tien: 'hạn hết T2' },
  'nhap-diem': { viec: 'Nhập điểm', tien: 'hạn' },
  'du-kien-ket-thuc': { viec: 'Dự kiến kết thúc', tien: 'dự kiến kết thúc' },
  /* PR-Ra Q9: quá hạn tính theo hạn HIỆN TẠI — hạn gốc/lý do dời hiện ở dòng phụ riêng (`dongHanDaDoi`), không qua `originalDue` ở đây. */
  'viec-van-hanh': { viec: 'Việc', tien: 'hạn' },
  duyet: { viec: 'Duyệt', tien: 'hạn' },
  'xu-ly-vi-pham': { viec: 'Xử lý vi phạm', tien: 'hạn' },
  'ke-hoach-bo-tro': { viec: 'Nộp kế hoạch bổ trợ', tien: 'hạn' },
  'mini-test': { viec: 'Mini Test', tien: 'hạn' },
};

/** "quá hạn 15 ngày" · gọn: "15 ngày" · không biết số ngày: "quá hạn". */
export function nhanQuaHan(n: number | null, gon = false): string {
  if (n === null) return 'quá hạn';
  return gon ? `${n} ngày` : `quá hạn ${n} ngày`;
}

/** `neutral` = không phải hạn hoặc chưa đến hạn; `overdue` = quá hạn thật; `waiting` = hạn đang chạy. */
export type DeadlineTone = 'neutral' | 'waiting' | 'overdue';

export type DeadlineInput = {
  kind: DeadlineKind;
  /** Hạn đang hiệu lực (có thể đã dời có quyền). */
  due: string | null;
  /** Hạn GỐC, nếu `due` là hạn đã dời. Quá hạn luôn đếm từ đây (rule book §9.1: không ghi đè hạn gốc). */
  originalDue?: string | null;
  /** Hẹn xử lý mới — hiện CẠNH hạn, không thay hạn. */
  reschedule?: string | null;
  /** Ngày nghiệp vụ hiện tại (KHÔNG phải đồng hồ trình duyệt). */
  today: string;
};

export type DeadlineView = {
  /** Câu đầy đủ cho tooltip: "Ghi kết quả tuần W4 SEP · hạn hết T2 28/09 · quá hạn 2 ngày". */
  text: string;
  tone: DeadlineTone;
  /** Số ngày quá hạn tính từ hạn gốc; null khi không quá hạn hoặc không áp dụng (dự kiến). */
  daysOverdue: number | null;
  /** Ghi chú phụ cho tooltip — ví dụ hạn gốc khi hạn đã dời. */
  title: string | null;
  /** Việc: "Ghi kết quả tuần W4 SEP" (có hạn) · "Ghi kết quả PA" (chưa có hạn). */
  viec: string;
  /** Mốc: "hạn hết T2 28/09" · "hạn 09/09" · "dự kiến kết thúc 14/09" · "chưa có hạn". */
  han: string;
  /** Đúng ngày hạn, chưa quá (không bao giờ true với `du-kien-ket-thuc`). */
  homNay: boolean;
  /** "quá hạn 15 ngày" — nối ngay sau mốc, không nền, không khung. */
  quaHan: string | null;
  /** "hẹn xử lý 30/09". */
  hen: string | null;
  /** PR-DUYET (M8): chỉ loại `duyet`, chưa quá hạn — "còn 2 ngày", tính cả hôm nay (hạn hôm nay = "còn 1 ngày"). */
  con?: string | null;
};

const congNgay = (iso: string, n: number) => {
  const x = new Date(`${iso.slice(0, 10)}T00:00:00Z`); x.setUTCDate(x.getUTCDate() + n); return x.toISOString().slice(0, 10);
};
/** "W4 SEP" — cùng luật `tuanLich` (hienThiNgay.ts), chép lại để display.ts không import vòng; khác năm thì thêm năm. */
function maTuan(iso: string, homNay: string): string {
  const t2 = mondayOfDate(iso);
  const { year, month } = owningMonthOf(t2);
  const ma = `W${weekNumberInMonthOf(t2)} ${MONTH_CODE[month - 1]}`;
  return owningMonthOf(mondayOfDate(homNay)).year === year ? ma : `${ma} ${year}`;
}
/** Tiêu đề khối kết quả ở form Ghi kết quả (K3-17): tuần của hạn đang ghi; trễ ≥ 2 tuần thì nói khoảng + số tuần ghi bù. */
export function nhanTuanGhiKetQua(actionDue: string | null, homNay: string): { tieuDe: string; soTuan: number } {
  if (!validIso(actionDue)) return { tieuDe: 'Kết quả tuần này', soTuan: 1 };
  const dau = congNgay(mondayOfDate(actionDue), -7);
  const cuoi = congNgay(mondayOfDate(homNay), -7);
  const soTuan = cuoi > dau ? Math.round(daysBetween(dau, cuoi) / 7) + 1 : 1;
  if (soTuan === 1) return { tieuDe: `Kết quả tuần ${maTuan(dau, homNay)}`, soTuan };
  const a = maTuan(dau, homNay); const b = maTuan(cuoi, homNay);
  const cungThang = a.slice(a.indexOf(' ')) === b.slice(b.indexOf(' '));
  return { tieuDe: `Kết quả ${cungThang ? `${a.split(' ')[0]}–${b}` : `${a} – ${b}`} (ghi bù ${soTuan} tuần)`, soTuan };
}

/**
 * LUẬT HIỆN HẠN (PR-UX0, B-3): việc · mốc · quá hạn/hôm nay · hẹn — mỗi thông tin nói MỘT lần.
 * Quá hạn đếm số ngày từ hạn GỐC cho mọi loại, kể cả `cap-nhat-pa` (mockup 17 #1, #21).
 */
export function deadlineView(i: DeadlineInput): DeadlineView {
  const { viec, tien } = DEADLINE_VIEC[i.kind];
  if (!validIso(i.due)) {
    return {
      text: `${viec} · chưa có hạn`, tone: 'neutral', daysOverdue: null, title: null,
      viec, han: 'chưa có hạn', homNay: false, quaHan: null, hen: null, con: null,
    };
  }
  const han = `${tien} ${shortDate(i.due, i.today)}`;
  /* PR-N1 (R-PA3): hạn Thứ Hai là hạn của kết quả TUẦN TRƯỚC nó — "Ghi kết quả tuần W4 SEP · hạn hết T2 28/09". */
  const viecHien = i.kind === 'cap-nhat-pa' ? `Ghi kết quả tuần ${maTuan(congNgay(i.due, -7), i.today)}` : viec;
  const base = validIso(i.originalDue) ? i.originalDue : i.due;
  const duKien = i.kind === 'du-kien-ket-thuc';
  let daysOverdue: number | null = null;
  let quaHan: string | null = null;
  let tone: DeadlineTone = duKien ? 'neutral' : 'waiting';

  /* "Dự kiến kết thúc" không bao giờ quá hạn — nó không phải một nghĩa vụ. */
  if (!duKien && i.today > base.slice(0, 10)) {
    tone = 'overdue';
    daysOverdue = daysBetween(base, i.today);
    quaHan = nhanQuaHan(daysOverdue);
  }
  const homNay = !duKien && i.today === base.slice(0, 10);
  const hen = validIso(i.reschedule) ? `hẹn xử lý ${shortDate(i.reschedule, i.today)}` : null;
  const con = i.kind === 'duyet' && !quaHan ? `còn ${daysBetween(i.today, base) + 1} ngày` : null;
  const text = duKien
    ? [han.charAt(0).toUpperCase() + han.slice(1), hen].filter(Boolean).join(' · ')
    : [viecHien, han, quaHan, con, homNay ? 'hôm nay' : null, hen].filter(Boolean).join(' · ');

  const moved = validIso(i.originalDue) && i.originalDue.slice(0, 10) !== i.due.slice(0, 10);
  return {
    text, tone, daysOverdue, quaHan, homNay, hen, con, viec: viecHien, han,
    title: moved ? `Hạn gốc ${shortDate(i.originalDue, i.today)}` : null,
  };
}

// ====================================================================== ngày nghiệp vụ

/** Ngày (theo giờ Việt Nam) của một mốc thời gian thật. Ngày trần thì giữ nguyên. */
export function vietnamDateOf(stamp: string): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(stamp)) return stamp;
  const t = Date.parse(stamp);
  if (Number.isNaN(t)) return stamp.slice(0, 10);
  return new Date(t + 7 * 3_600_000).toISOString().slice(0, 10);
}

/**
 * NGÀY NGHIỆP VỤ VÀ NGÀY GHI NHẬN THẬT LÀ HAI THỨ (MT-P10).
 *
 * Bộ demo chạy ở ngày 14/09 nhưng thao tác được gõ vào ngày 19/09. Không sửa timestamp thật cho
 * đẹp ảnh, cũng không giấu một trong hai: khác nhau thì hiện cả hai, giống nhau thì chỉ một.
 */
export function businessDateText(businessDate: string, recordedAt: string | null | undefined, today: string): string {
  const b = shortDate(businessDate, today);
  if (!recordedAt) return b;
  const r = vietnamDateOf(recordedAt);
  if (r === businessDate.slice(0, 10)) return b;
  return `Ngày nghiệp vụ ${b} · Ghi nhận ${shortDate(r, today)}`;
}
