import {
  ATTEMPT_STATUS_LABEL, CASE_STATUS_LABEL,
  ROLE_LABEL, SKILL_PROGRESS_LABEL, SOS_LABEL, STUDENT_STATUS_LABEL,
  UNIT_STATUS_LABEL,
  duongDotTest, tenMon, tenMonNgan,
  type SkillProgress, type SosLevel, type StudentStatus,
} from '@shared/domain/index.ts';
import { t } from '@shared/i18n/index.ts';

/*
 * Tên kỹ năng KHÔNG theo chương trình (FT hoặc không rõ lớp) — lớp mỏng trên `tenMon(null, …)` (MH2: một nguồn). Chỗ nào biết
 * chương trình lớp thì gọi thẳng `tenMon(ct, …)` / `tenMonNgan(ct, …)` (FOU G+V/P, Pre FOU Tổng hợp).
 */
export const skillLabel = (s: string) => tenMon(null, s);
export const skillShort = (s: string) => tenMonNgan(null, s);
export const roleLabel = (s: string) => ROLE_LABEL[s as keyof typeof ROLE_LABEL] ?? s;
/** Không dùng từ "thi" cho Mock — "thi" chỉ dành cho kỳ IELTS chính thức. */
export const attemptStatusLabel = (s: string) => ATTEMPT_STATUS_LABEL[s as keyof typeof ATTEMPT_STATUS_LABEL] ?? s;
export const progressLabel = (s: string) => SKILL_PROGRESS_LABEL[s as SkillProgress] ?? s;
export const studentStatusLabel = (s: string) => STUDENT_STATUS_LABEL[s as StudentStatus] ?? s;
export const caseStatusLabel = (s: string) => CASE_STATUS_LABEL[s as keyof typeof CASE_STATUS_LABEL] ?? s;
export const unitStatusLabel = (s: string | null) => (s === null ? t('Chưa báo cáo') : UNIT_STATUS_LABEL[s as keyof typeof UNIT_STATUS_LABEL] ?? s);
export const sosLabel = (l: number | null) => (l === null ? t('Chưa đủ điểm') : SOS_LABEL[l as SosLevel] ?? `SOS ${l}`);

export function fmtDate(d?: string | null): string {
  if (!d) return '—';
  const s = d.slice(0, 10);
  return `${s.slice(8, 10)}/${s.slice(5, 7)}/${s.slice(0, 4)}`;
}

export function fmtDateTime(d?: string | null): string {
  if (!d) return '—';
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return fmtDate(d);
  return `${fmtDate(d)} ${String(dt.getHours()).padStart(2, '0')}:${String(dt.getMinutes()).padStart(2, '0')}`;
}

/** Band trống KHÁC điểm 0 — luôn hiện dấu gạch, không bao giờ hiện 0 thay cho ô trống. */
export function fmtBand(n: number | null | undefined): string {
  return n === null || n === undefined ? '—' : Number(n).toFixed(1);
}

export function addDaysStr(d: string, days: number): string {
  const dt = new Date(d + 'T00:00:00Z');
  dt.setUTCDate(dt.getUTCDate() + days);
  return dt.toISOString().slice(0, 10);
}

export type Tone = 'ok' | 'warn' | 'danger' | 'info' | 'neutral' | 'muted';

/** Mức SOS 0 (Đạt xanh lá) / chưa có (xám) cho `<Level>`. Mức 1–3 KHÔNG đi qua đây — dùng `<ChipSos>` (OV-15a). */
export function sosTone(level: number | null): 'ok' | 'muted' {
  return level === 0 ? 'ok' : 'muted';
}
/** Nhãn "SOS n" do máy chủ gửi kèm → mức để vẽ `<ChipSos>`; nhãn khác → null. */
export function mucSosTheoNhan(text: string): number | null {
  const m = /^SOS\s*([123])\b/.exec(text);
  return m ? Number(m[1]) : null;
}

/**
 * Ô họp tuần là một KẾT QUẢ (ổn · cần theo dõi · có vấn đề), nên chỉ nhận bốn tông của họ
 * nhãn kết quả — không có `info`, vì "đang thực hiện" không phải một kết luận về lớp.
 */
export function unitTone(status: string | null): 'ok' | 'warn' | 'danger' | 'muted' {
  return status === null ? 'muted' : status === 'problem' ? 'danger' : status === 'watch' ? 'warn' : 'ok';
}

/**
 * ĐƯỜNG DẪN TỚI ĐIỂM CỦA MỘT LƯỢT ĐÁNH GIÁ — chọn ĐÚNG MÀN theo loại bài.
 *
 * Đây là lỗi owner chỉ ra ở mục 6.3: hồ sơ một em lớp thường, bấm vào bài giữa khoá thì màn
 * Mock Test mở ra và hiện "MT1" cho một bài Progress Test. Hai loại bài có hai màn riêng vì
 * chúng chấm theo hai cách khác nhau; mở nhầm màn là đọc sai cả kết quả.
 *
 * Một chỗ quyết định duy nhất. Màn nào tự ghép đường dẫn lấy thì sớm muộn lại ghép sai.
 */
export function attemptHref(a: { id: number; kind?: string | null; classId?: number | null; studentId?: number | null }): string {
  return duongDotTest(a);   // PR-VAI-b (G5): một hàm đường dẫn ở shared — bản máy chủ (`fasttrack/attempts.ts`) chuyển ở PR-UXF-b
}
