import { attemptProgressView, type ProgressTone } from '@shared/domain/index.ts';
import { SCORE_CHIP, type ScoreTone } from './ui.tsx';

/**
 * Màu kết quả Test (N-1b) ↔ họ màu điểm ở `ui.tsx`. Một chỗ nối, không chép bảng màu:
 * Đạt xanh lá · SOS 1 vàng · SOS 2 cam · SOS 3 (hay Overall chưa đạt) đỏ · tạm thời / chưa đủ điểm xám viền đứt.
 */
function hoMau(tone: ProgressTone, overall: string, soMon: number | null): ScoreTone {
  /* PR-N1 A2: SOS tạm thời giữ màu của mức (viền đứt thêm ở dưới); chưa đủ điểm mà không có SOS thì xám viền đứt. */
  if (overall === 'incomplete') return tone === 'danger' && soMon ? (soMon === 1 ? 'sos1' : soMon === 2 ? 'sos2' : 'rose') : 'tam';
  if (tone === 'danger') return soMon === 1 ? 'sos1' : soMon === 2 ? 'sos2' : 'rose';
  if (tone === 'info' || tone === 'ok') return 'emerald';
  return 'slate';
}
/**
 * Mỗi trạng thái có biểu tượng riêng — màu không bao giờ đứng một mình. Số tạm thời (đợt còn thiếu điểm) dùng ◌ + viền đứt;
 * đợt đã đủ điểm mà có SOS thì màu theo mức SOS + dấu ● — ⚠ chỉ dành cho quá hạn (G-4).
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
export function KetQuaDot({ coDiem, yeuCau, dat, sos, phan = 'cau', cheDo, soMonChuaDat, duoiKyVong }: {
  /** Số KỸ NĂNG (L/R/W/S) đã có điểm. */
  coDiem: number;
  /** Số KỸ NĂNG bắt buộc của đợt. */
  yeuCau: number;
  /** Overall đạt kỳ vọng; `null` khi chưa đủ điểm hoặc chưa có kỳ vọng. */
  dat: boolean | null;
  /** Số kỹ năng dưới kỳ vọng ở các môn đã chấm; `null` khi chưa tính được. */
  sos: number | null;
  phan?: 'cau' | 'overall';
  /** `ratio` (lớp thường) nói "môn"/"đạt", không có "kỳ vọng"/"Overall" (Q17). Mặc định `ielts`. */
  cheDo?: 'ielts' | 'ratio';
  /** Chỉ `cheDo: 'ratio'` — số môn chưa đạt THẬT, `sos` bị chặn trần ở 3 nên sai khi trượt cả 4 môn. */
  soMonChuaDat?: number | null;
  /** PR-S4F #10: chip cạnh Overall — kỹ năng dưới kỳ vọng ("W", "L · S") thay cho "Chưa đạt kỳ vọng" chung chung. */
  duoiKyVong?: readonly string[];
}) {
  const v = attemptProgressView({ scored: coDiem, required: yeuCau, passed: dat, sos, cheDo, soMonChuaDat });
  const tone: ProgressTone = phan === 'overall' && v.overall === 'incomplete' ? 'muted' : v.tone;
  /* ⚠ chỉ nghĩa quá hạn (G-4): số tạm thời dùng ◌ (viền đứt), không dùng ⚠. */
  const mark = phan === 'overall' ? (v.passBadge ? '✓' : '·') : tone === 'danger' && v.overall === 'incomplete' ? '◌' : TONE_MARK[tone];
  const soMon = cheDo === 'ratio' ? (soMonChuaDat ?? sos) : sos;
  const mau = hoMau(tone, v.overall, soMon);
  return (
    <span
      data-overall={v.overall} data-pass-badge={v.passBadge} title={v.title}
      className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium ${SCORE_CHIP[mau]} ${v.overall === 'incomplete' ? 'border-dashed' : ''}`}>
      <span aria-hidden>{mark}</span>
      {phan === 'overall'
        ? (v.overall === 'not-passed' && duoiKyVong?.length ? `Dưới kỳ vọng: ${duoiKyVong.join(' · ')}` : v.overallText)
        : v.text}
    </span>
  );
}
