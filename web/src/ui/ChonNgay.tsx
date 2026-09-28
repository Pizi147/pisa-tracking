import { mondayOfDate } from '@shared/domain/index.ts';
import { useNgayNghiepVu } from './ngayNghiepVu.ts';
import { ONgay } from './ONgay.tsx';

/**
 * Lớp bọc cũ (PR-UX3) nay đi qua ô ngày thống nhất `ONgay` (T11). `soNgay/lui/toi/soThang` thành luật khoảng, không còn danh sách thả.
 * Chữ ký ba hàm giữ nguyên để nơi gọi không phải sửa; mỗi hàm giữ ĐÚNG khoảng được chọn như bản danh sách cũ (Q8).
 * Không đọc đồng hồ trình duyệt — "hôm nay" là ngày nghiệp vụ.
 */

const DAY_MS = 86_400_000;
/** Cộng `n` ngày vào ISO. */
function cong(iso: string, n: number): string {
  return new Date(Date.parse(`${iso}T00:00:00Z`) + n * DAY_MS).toISOString().slice(0, 10);
}
/** Tháng `yyyy-mm` cách tháng của `iso` `n` tháng. */
function thangCong(iso: string, n: number): string {
  const k = Number(iso.slice(0, 4)) * 12 + Number(iso.slice(5, 7)) - 1 + n;
  return `${Math.floor(k / 12)}-${String((k % 12) + 1).padStart(2, '0')}`;
}

/**
 * Ngày không quá hôm nay. Bản cũ: gợi ý `soNgay` ngày gần nhất + "Ngày khác…" gõ bất kỳ ngày nào ≤ hôm nay — nên luật chỉ là
 * `toiDa = hôm nay`; `soNgay` không còn giới hạn gì (giữ trong chữ ký cho nơi gọi cũ).
 */
export function ChonNgayGan({ value, onChange, disabled, ariaLabel, chuaChon }: {
  value: string; onChange: (v: string) => void; soNgay?: number; disabled?: boolean; ariaLabel?: string; chuaChon?: string;
}) {
  const { homNay } = useNgayNghiepVu();
  return <ONgay kieu="ngay" value={value} onChange={onChange} toiDa={homNay || null} disabled={disabled} ariaLabel={ariaLabel} goiY={chuaChon} />;
}

/**
 * Tuần. `moc="dau"` (mặc định): giá trị là thứ Hai, từ `lui` tuần trước tới `toi` tuần sau tuần này. `moc="cuoi"`: giá trị là
 * Chủ nhật của tuần đó, cắt về hôm nay khi là tuần hiện tại và `catHomNay` (máy chủ chặn ngày tương lai) — dùng cho ô "Đến".
 */
export function ChonTuan({ value, onChange, lui = 8, toi = 0, moc = 'dau', catHomNay = true, disabled, ariaLabel, chuaChon }: {
  value: string; onChange: (v: string) => void; lui?: number; toi?: number; moc?: 'dau' | 'cuoi';
  /** `moc="cuoi"`: cắt Chủ nhật về hôm nay cho tuần hiện tại (mặc định, cho việc ĐÃ xảy ra). `false` cho hạn tương lai. */
  catHomNay?: boolean;
  disabled?: boolean; ariaLabel?: string; chuaChon?: string;
}) {
  const { homNay } = useNgayNghiepVu();
  const t2 = homNay ? mondayOfDate(homNay) : null;
  const toiThieu = t2 ? cong(t2, -7 * lui) : null;
  const toiDa = !t2 ? null : moc === 'cuoi' ? (catHomNay && toi === 0 ? homNay : cong(t2, 7 * toi + 6)) : cong(t2, 7 * toi);
  return <ONgay kieu="tuan" value={value} onChange={onChange} moc={moc} catHomNay={catHomNay} disabled={disabled} ariaLabel={ariaLabel}
    goiY={chuaChon} toiThieu={toiThieu} toiDa={toiDa} />;
}

/** Tháng, `soThang` tháng từ tháng này. Giá trị `2026-11`. */
export function ChonThang({ value, onChange, soThang = 18, disabled, ariaLabel, chuaChon }: {
  value: string; onChange: (v: string) => void; soThang?: number; disabled?: boolean; ariaLabel?: string; chuaChon?: string;
}) {
  const { homNay } = useNgayNghiepVu();
  return <ONgay kieu="thang" value={value} onChange={onChange} toiThieu={homNay ? homNay.slice(0, 7) : null}
    toiDa={homNay ? thangCong(homNay, soThang - 1) : null} disabled={disabled} ariaLabel={ariaLabel} goiY={chuaChon} />;
}
