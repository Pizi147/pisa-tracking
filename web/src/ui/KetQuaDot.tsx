import { attemptProgressView, type ProgressTone } from '@shared/domain/index.ts';
import { SCORE_CHIP, type ScoreTone } from './ui.tsx';

/** Bốn tone của luật ↔ bốn họ màu điểm ở `ui.tsx`. Một chỗ nối, không chép bảng màu. */
const TONE_FAMILY: Record<ProgressTone, ScoreTone> = {
  muted: 'slate', danger: 'rose', info: 'sky', ok: 'emerald',
};
/**
 * Mỗi trạng thái có biểu tượng riêng — màu không bao giờ đứng một mình. Dấu ⚠ CHỈ khi đợt còn thiếu điểm (tạm thời);
 * đợt đã đủ điểm mà có SOS thì màu đỏ + dấu ● — không dùng ⚠ đi với chữ "Đã đủ điểm" (chủ sản phẩm 22/09).
 */
const TONE_MARK: Record<ProgressTone, string> = { muted: '·', danger: '●', info: '✓', ok: '✓' };

/**
 * MỘT CÂU DUY NHẤT CHO TIẾN ĐỘ MỘT ĐỢT TEST (HE_GIAO_DIEN §5, đóng MT-P01 và MT-P02).
 *
 * Dùng ở: đầu hồ sơ Test, bảng lớp, bảng tuần, hành trình, thẻ học viên. BỐN CHỖ NÀY KHÔNG
 * ĐƯỢC TỰ VIẾT CÂU CỦA RIÊNG MÌNH — đó là cách MT-P02 sinh ra (header nói 1/4, nội dung nói 2/4).
 *
 *   <KetQuaDot coDiem={1} yeuCau={4} dat={true} sos={0} />
 *     → "Các kỹ năng đã chấm đều đạt · còn thiếu 3"  (xám — KHÔNG có badge đạt)
 *
 * Hai luật cứng nằm ở `attemptProgressView`:
 *   (a) chưa đủ điểm → Overall ghi `Chưa đủ điểm`, cấm badge đạt dù `dat` là true;
 *   (b) đơn vị đếm là BỐN kỹ năng L/R/W/S — W1/W2 là hai bài nhập, không phải hai kỹ năng.
 *
 * `phan="overall"` chỉ vẽ ô Overall (`Chưa đủ điểm` / `Đạt kỳ vọng` …) để bảng có một cột
 * Overall mà không phải tự dựng chữ.
 */
export function KetQuaDot({ coDiem, yeuCau, dat, sos, phan = 'cau' }: {
  /** Số KỸ NĂNG (L/R/W/S) đã có điểm. */
  coDiem: number;
  /** Số KỸ NĂNG bắt buộc của đợt. */
  yeuCau: number;
  /** Overall đạt kỳ vọng; `null` khi chưa đủ điểm hoặc chưa có kỳ vọng. */
  dat: boolean | null;
  /** Số kỹ năng dưới kỳ vọng ở các môn đã chấm; `null` khi chưa tính được. */
  sos: number | null;
  phan?: 'cau' | 'overall';
}) {
  const v = attemptProgressView({ scored: coDiem, required: yeuCau, passed: dat, sos });
  const tone: ProgressTone = phan === 'overall' && v.overall === 'incomplete' ? 'muted' : v.tone;
  const mark = phan === 'overall' ? (v.passBadge ? '✓' : '·') : tone === 'danger' && v.overall === 'incomplete' ? '⚠' : TONE_MARK[tone];
  return (
    <span
      data-overall={v.overall} data-pass-badge={v.passBadge}
      className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium ${SCORE_CHIP[TONE_FAMILY[tone]]}`}>
      <span aria-hidden>{mark}</span>
      {phan === 'overall' ? v.overallText : v.text}
    </span>
  );
}
