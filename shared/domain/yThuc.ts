/**
 * Ý THỨC — VI PHẠM VÀ BIỆN PHÁP XỬ LÝ (module thứ chín, chốt 21/09/2026).
 *
 * Đặc tả: `thiet-ke/Y_THUC_VI_PHAM_VA_BIEN_PHAP.md`. Luật: rule book mục 18. Nguồn của chủ sản phẩm:
 * `thiet-ke/NGUON-Rule-Y-thuc-2026-09-21.md`.
 *
 * HAI HỆ HOÀN TOÀN KHÁC NHAU. Học thuật theo dõi một VẤN ĐỀ qua nhiều tuần bằng Case; Ý thức ghi từng SỰ VIỆC bằng một
 * Vi phạm độc lập rồi GVCN chọn Biện pháp xử lý. Không ép hai hệ dùng chung một vòng đời — không có đợt, không có hạn
 * 3/5/7 ngày, không đo cải thiện, chỉ một cảnh báo mềm 5 ngày.
 *
 * File này chỉ có TỪ VỰNG và LUẬT THUẦN (không đụng database) để máy chủ và giao diện đọc cùng một nơi.
 */

import { ENTRY_SKILLS } from './skills.ts';
import { CHUONG_TRINH_KHONG_CHIA_MON, boMonLich, programmeOf } from './normal.ts';

// ---------------------------------------------------------------- lời chốt Y01–Y04

/**
 * Y01 — ĐÃ CHỐT 21/09/2026. Ai xác nhận biện pháp nặng (Thư cảnh cáo 1/2/3, Đình chỉ học, CX/GĐCN meeting)?
 *   'gvcn-tu-lam'  : GVCN tự làm hết, kể cả biện pháp nặng. KHÔNG có bước Quản lý duyệt cho bất kỳ loại nào. Quản lý
 *                    nhận THÔNG BÁO khi một Thư cảnh cáo hoặc Đình chỉ học được xác nhận — để biết, không phải cửa duyệt.  ← đã chốt
 *   'ql-duyet-nang': biện pháp nặng phải chờ Quản lý duyệt — KHÔNG dùng.
 */
export const Y01_AI_XAC_NHAN_BIEN_PHAP_NANG = 'gvcn-tu-lam' as const;

/**
 * Y02 — ĐÃ CHỐT 21/09/2026. Chuỗi Thư cảnh cáo 1 → 2 → 3 đếm trong phạm vi nào?
 *   'theo-lo-trinh': theo LỘ TRÌNH HỌC (`learning_cycles.id`). Em học lại hoặc lên lộ trình mới thì chuỗi reset về lần 1.  ← đã chốt
 *   'theo-hoc-vien': cả đời học viên — KHÔNG dùng.
 */
export const Y02_PHAM_VI_CHUOI_THU_CANH_CAO = 'theo-lo-trinh' as const;

/**
 * Y03 — ĐÃ CHỐT 21/09/2026, là quyết định giao diện nên không cần hằng số: ba khu vực Ý thức của GVCN nằm ở tab `Ý thức`
 * của hồ sơ LỚP, cộng một tab `Ý thức` gọn ở hồ sơ học viên. KHÔNG thêm khu vực cấp chính thứ năm.
 *
 * Y04 — ĐÃ CHỐT 21/09/2026: năm nhóm vi phạm (`VIOLATION_CATEGORIES`), bỏ `Tham gia trên lớp`.
 */

/**
 * CẢNH BÁO MỀM: học viên còn vi phạm chưa gắn vào biện pháp nào mà cái cũ nhất đã QUÁ ngần này ngày (nguồn mục 30).
 * Chỉ để nhắc — không tự tạo case, không tự tạo biện pháp, không đặt hạn, không tính là quá hạn của ai.
 */
export const CANH_BAO_NGAY = 5;

// ---------------------------------------------------------------- vi phạm

/** NĂM NHÓM (Y04), xếp theo thứ tự bày ra. Không chỗ nào dựa vào vị trí trong mảng. */
export const VIOLATION_CATEGORIES = ['attendance', 'homework', 'conduct', 'classroom', 'other'] as const;
export type ViolationCategory = (typeof VIOLATION_CATEGORIES)[number];
export const VIOLATION_CATEGORY_LABEL: Record<ViolationCategory, string> = {
  attendance: 'Chuyên cần',
  homework: 'BTVN',
  conduct: 'Thái độ / hành vi',
  classroom: 'Kỷ luật lớp học',
  other: 'Khác',
};

/** Đổi nhóm của dữ liệu cũ: `Tham gia trên lớp` (participation) đã bỏ, đổi sang `Thái độ / hành vi` (Y04). */
export function legacyTopicToViolationCategory(topic: string | null | undefined): ViolationCategory {
  switch (topic) {
    case 'attendance': return 'attendance';
    case 'homework': return 'homework';
    case 'participation': return 'conduct';
    default: return 'other';
  }
}

/** V02: mô tả tối thiểu. V05 (bản T13): nhóm Khác cần ô Ghi rõ ≥ 3 ký tự (`kiemGhiRoKhac`, `./khac.ts`). */
export const VIOLATION_DESCRIPTION_MIN = 10;

/**
 * Môn của một vi phạm — TÙY CHỌN (V02/V04). Lớp Fast Track phân công Writing thành hai task, lớp Normal có một môn Writing
 * và Pronunciation, nên danh sách này là hợp của hai bộ.
 */
export const VIOLATION_SKILLS = ['listening', 'reading', 'writing1', 'writing2', 'writing', 'speaking', 'pronunciation'] as const;
export const VIOLATION_SKILL_LABEL: Record<string, string> = {
  listening: 'Listening', reading: 'Reading', writing1: 'Writing Task 1', writing2: 'Writing Task 2',
  writing: 'Writing', speaking: 'Speaking', pronunciation: 'Pronunciation',
};

/** K5-47: DANH SÁCH CHỌN môn vi phạm theo chương trình của lớp. FT/không rõ: 5 ô nhập · lớp thường: bộ môn · Pre FOU: không chọn môn.
 *  `VIOLATION_SKILLS` giữ nguyên để máy chủ vẫn nhận dữ liệu cũ. */
export function monViPham(ct: string | null | undefined): readonly string[] {
  const c = programmeOf(ct);
  if (!c || c === 'FT') return ENTRY_SKILLS;
  if (CHUONG_TRINH_KHONG_CHIA_MON.includes(c)) return [];
  return boMonLich(c);
}

/**
 * BA TRẠNG THÁI NGƯỜI DÙNG THẤY của một vi phạm — SUY RA từ bảng nối `measure_violations`, không lưu (đặc tả §4.1).
 *
 * Trước rulebook v3 (21/09/2026 tối) còn trạng thái thứ tư `Không còn hiệu lực` (đánh dấu không chính xác). Nay ghi sai thì sửa hoặc XOÁ thẳng
 * (V11′–V14′), nên chỉ còn ba. Lưu trạng thái xử lý ở chính vi phạm là cách chắc chắn nhất để nó lệch với bảng nối.
 */
export const VIOLATION_STATES = ['unhandled', 'preparing', 'handled'] as const;
export type ViolationState = (typeof VIOLATION_STATES)[number];
export const VIOLATION_STATE_LABEL: Record<ViolationState, string> = {
  unhandled: 'Chưa xử lý',
  preparing: 'Đang chuẩn bị xử lý',
  handled: 'Đã xử lý',
};

/**
 * Trạng thái hiển thị của một vi phạm. Thứ tự ưu tiên: đã xử lý (nằm ít nhất một biện pháp đã thực hiện) > đang chuẩn bị xử lý > chưa xử lý.
 * "Đã xử lý" KHÔNG có nghĩa là xoá hay ẩn khỏi lịch sử (nguồn mục 32).
 */
export function violationState(v: { inDone: boolean; inPreparing: boolean }): ViolationState {
  if (v.inDone) return 'handled';
  if (v.inPreparing) return 'preparing';
  return 'unhandled';
}

// ---------------------------------------------------------------- biện pháp xử lý

/**
 * CHÍN LOẠI, xếp nhẹ đến nặng để BÀY RA. Thứ tự KHÔNG phải workflow bắt buộc (nguồn mục 20): đi thẳng tới biện pháp nặng là
 * hợp lệ. Ngoại lệ cứng duy nhất là chuỗi Thư cảnh cáo (`WARNING_CHAIN`).
 */
export const MEASURE_KINDS = [
  'talk_short', 'meeting_student', 'family_report', 'warning_1', 'meeting_cx', 'warning_2', 'suspension', 'warning_3', 'other',
] as const;
export type MeasureKind = (typeof MEASURE_KINDS)[number];
export const MEASURE_KIND_LABEL: Record<MeasureKind, string> = {
  talk_short: 'GV trao đổi ngắn với HV',
  meeting_student: 'GV meeting với HV',
  family_report: 'Report cho gia đình',
  warning_1: 'Thư cảnh cáo lần 1',
  meeting_cx: 'CX / GĐCN meeting với HV / PH',
  warning_2: 'Thư cảnh cáo lần 2',
  suspension: 'Đình chỉ học',
  warning_3: 'Thư cảnh cáo lần 3',
  other: 'Khác',
};

/** HAI TRẠNG THÁI, KHÔNG BA. Không có `pending_approval`: Y01 chốt GVCN tự làm hết, không có cửa duyệt. */
export const MEASURE_STATUSES = ['preparing', 'done'] as const;
export type MeasureStatus = (typeof MEASURE_STATUSES)[number];
export const MEASURE_STATUS_LABEL: Record<MeasureStatus, string> = { preparing: 'Đang chuẩn bị', done: 'Đã thực hiện' };

/** Quản lý nhận thông báo khi những loại này được xác nhận (Y01) — để biết chuyện nặng đã xảy ra, không phải để duyệt. */
export function measureNotifiesManager(kind: MeasureKind): boolean {
  return kind === 'warning_1' || kind === 'warning_2' || kind === 'warning_3' || kind === 'suspension';
}

/**
 * NGOẠI LỆ CỨNG DUY NHẤT VỀ TRÌNH TỰ (nguồn mục 21): Thư cảnh cáo phải đúng 1 → 2 → 3. Trong CÙNG MỘT lộ trình (Y02) không tạo
 * và không xác nhận được lần 2 nếu chưa có lần 1 đã thực hiện; lần 3 cần lần 2. Kiểm ở MÁY CHỦ, không chỉ ẩn nút.
 */
export const WARNING_CHAIN = ['warning_1', 'warning_2', 'warning_3'] as const;
export type WarningKind = (typeof WARNING_CHAIN)[number];

/** Loại thư phải ở trạng thái `done` trước khi loại này được tạo hoặc xác nhận; `null` nghĩa là đi thẳng được. */
export function warningPrerequisite(kind: MeasureKind): WarningKind | null {
  const i = (WARNING_CHAIN as readonly string[]).indexOf(kind);
  return i > 0 ? WARNING_CHAIN[i - 1] : null;
}

export function isWarningKind(kind: string): kind is WarningKind {
  return (WARNING_CHAIN as readonly string[]).includes(kind);
}

/**
 * Ô BẮT BUỘC THEO TỪNG LOẠI (đặc tả §5.4, nguồn mục 28). MỘT form tự đổi ô bắt buộc — không dựng chín form.
 * Ngày thực hiện và nội dung luôn bắt buộc; khác nhau ở tệp/liên kết, người tham gia và tên biện pháp.
 */
export type MeasureFieldSpec = {
  date: 'required';
  content: 'required';
  attachment: 'required' | 'optional';
  participants?: 'optional';
  customName?: 'required';
};
export const MEASURE_REQUIRED_FIELDS: Record<MeasureKind, MeasureFieldSpec> = {
  talk_short: { date: 'required', content: 'required', attachment: 'optional' },
  meeting_student: { date: 'required', content: 'required', attachment: 'optional' },
  family_report: { date: 'required', content: 'required', attachment: 'optional' },
  warning_1: { date: 'required', content: 'required', attachment: 'required' },
  meeting_cx: { date: 'required', content: 'required', attachment: 'optional', participants: 'optional' },
  warning_2: { date: 'required', content: 'required', attachment: 'required' },
  suspension: { date: 'required', content: 'required', attachment: 'required' },
  warning_3: { date: 'required', content: 'required', attachment: 'required' },
  other: { date: 'required', content: 'required', attachment: 'optional', customName: 'required' },
};

/**
 * CÂU NÓI THIẾU GÌ khi xác nhận — nút `Xác nhận đã thực hiện` mờ đi kèm đúng câu này, không bao giờ để bấm rồi báo lỗi đỏ.
 * Trả `null` khi đủ. Máy chủ dùng CHÍNH hàm này để từ chối, nên giao diện và máy chủ không thể nói hai điều khác nhau.
 */
export function measureMissing(kind: MeasureKind, f: {
  performedOn: string | null | undefined; content: string | null | undefined;
  attachments: number; customName?: string | null;
  /** Đã chọn tài khoản hoặc ghi tên người thực hiện chưa. Bỏ qua (không truyền) thì không kiểm. */
  performer?: boolean;
}): string | null {
  const spec = MEASURE_REQUIRED_FIELDS[kind];
  if (!spec) return 'Loại phương án xử lý không hợp lệ';
  if (spec.customName === 'required' && !(f.customName ?? '').trim()) return 'Cần ghi tên phương án xử lý';
  if (!f.performedOn) return 'Cần chọn ngày thực hiện';
  if (f.performer === false) return 'Cần chọn hoặc ghi tên người thực hiện';
  if (!(f.content ?? '').trim()) return 'Cần ghi nội dung hoặc ghi chú';
  if (spec.attachment === 'required' && f.attachments < 1) {
    return kind === 'suspension'
      ? 'Cần đính kèm tệp hoặc liên kết quyết định đình chỉ học'
      : 'Cần đính kèm tệp hoặc liên kết thư cảnh cáo';
  }
  return null;
}

// ---------------------------------------------------------------- cảnh báo 5 ngày

function daysBetween(from: string, to: string): number {
  const a = Date.parse(`${from.slice(0, 10)}T00:00:00Z`);
  const b = Date.parse(`${to.slice(0, 10)}T00:00:00Z`);
  return Math.round((b - a) / 86400000);
}

/** Số ngày từ ngày xảy ra tới ngày nghiệp vụ hôm nay. */
export function violationAgeDays(occurredOn: string, today: string): number {
  return daysBetween(occurredOn, today);
}

/**
 * CẢNH BÁO 5 NGÀY — ĐỊNH NGHĨA CHÍNH XÁC (đặc tả §5.5, W01–W04).
 *
 *   Tập cần xử lý của một học viên = vi phạm còn hiệu lực VÀ chưa nằm trong bất kỳ biện pháp nào.
 *   Cảnh báo bật khi tập KHÔNG rỗng và (hôm nay − ngày xảy ra cũ nhất) > 5 ngày.
 *
 * Hàm thuần nhận NGÀY XẢY RA của các vi phạm thuộc tập cần xử lý — việc lọc tập nằm ở máy chủ (`canhBao.ts`), là MỘT hàm
 * duy nhất cho cả ba nơi hiển thị (W05).
 */
export function violationWarning(unhandledDates: readonly string[], today: string) {
  const count = unhandledDates.length;
  if (count === 0) return { active: false, count: 0, oldestOn: null as string | null, oldestAgeDays: 0, message: '' };
  const oldestOn = [...unhandledDates].sort()[0].slice(0, 10);
  const oldestAgeDays = daysBetween(oldestOn, today);
  const active = oldestAgeDays > CANH_BAO_NGAY;
  return {
    active, count, oldestOn, oldestAgeDays,
    message: active ? `Chưa xử lý ${count} vi phạm · cũ nhất ${oldestAgeDays} ngày` : '',
  };
}

/** W06: tuổi `9 ngày` (không ⚠ — nhắc mềm, không phải quá hạn) cạnh TỪNG vi phạm chưa xử lý quá 5 ngày — để không ai phải tự trừ ngày. */
export function violationAgeLabel(ageDays: number): string {
  return ageDays > CANH_BAO_NGAY ? `${ageDays} ngày` : '';
}
