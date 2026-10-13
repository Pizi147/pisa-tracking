import { DUOI_KY_VONG_KCK, GIAI_THICH_KCK, attemptProgressView, type ProgressTone } from '@shared/domain/index.ts';
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
 * Xám (chưa có điểm, chưa đủ điểm) không có dấu: "·" đứng đầu đọc như dấu ngăn thừa (PR-HK1 H3); chữ đã nói đủ.
 */
const TONE_MARK: Record<ProgressTone, string> = { muted: '', danger: '●', info: '✓', ok: '✓' };

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
/** OV-9: chip TRUNG TÍNH "Dưới kỳ vọng · KCK" — em KCK dưới kỳ vọng: không SOS, không đỏ (chữ nói trạng thái, không chỉ màu). */
export function ChipDuoiKck() {
  return (
    <span title={GIAI_THICH_KCK}
      className="inline-flex items-center gap-1 whitespace-nowrap rounded-md border border-[color:var(--line-strong)] px-2 py-0.5 text-xs font-medium text-slate-300">
      {DUOI_KY_VONG_KCK}
    </span>
  );
}

export function KetQuaDot({ coDiem, yeuCau, dat, sos, phan = 'cau', cheDo, soMonChuaDat, duoiKyVong, chot, kckDuoi }: {
  /** Số KỸ NĂNG (L/R/W/S) đã có điểm. */
  coDiem: number;
  /** Số KỸ NĂNG bắt buộc của đợt. */
  yeuCau: number;
  /** Overall đạt kỳ vọng; `null` khi chưa đủ điểm hoặc chưa có kỳ vọng. */
  dat: boolean | null;
  /** Số kỹ năng dưới kỳ vọng ở các môn đã chấm; `null` khi chưa tính được. */
  sos: number | null;
  /** OV-1c: lượt đã chốt (máy chủ) — thiếu điểm mà đã chốt thì không "tạm thời". Bỏ trống = đủ điểm mới chốt. */
  chot?: boolean;
  phan?: 'cau' | 'overall';
  /** `ratio` (lớp thường) nói "môn"/"đạt", không có "kỳ vọng"/"Overall" (Q17). Mặc định `ielts`. */
  cheDo?: 'ielts' | 'ratio';
  /** Chỉ `cheDo: 'ratio'` — số môn chưa đạt THẬT, `sos` bị chặn trần ở 3 nên sai khi trượt cả 4 môn. */
  soMonChuaDat?: number | null;
  /** PR-S4F #10: chip cạnh Overall — kỹ năng dưới kỳ vọng ("W", "L · S") thay cho "Chưa đạt kỳ vọng" chung chung. */
  duoiKyVong?: readonly string[];
  /** OV-9: em KCK dưới kỳ vọng (máy chủ `kckDuoi`) — chip trung tính thay cho SOS / "chưa đạt". */
  kckDuoi?: boolean;
}) {
  if (kckDuoi) return <ChipDuoiKck />;
  const v = attemptProgressView({ scored: coDiem, required: yeuCau, passed: dat, sos, cheDo, soMonChuaDat, chot });
  const tone: ProgressTone = phan === 'overall' && v.overall === 'incomplete' ? 'muted' : v.tone;
  /* ⚠ chỉ nghĩa quá hạn (G-4): số tạm thời dùng ◌ (viền đứt), không dùng ⚠. */
  const mark = phan === 'overall' ? (v.passBadge ? '✓' : '') : v.tamThoi ? '◌' : TONE_MARK[tone];
  const soMon = cheDo === 'ratio' ? (soMonChuaDat ?? sos) : sos;
  const mau = hoMau(tone, v.overall, soMon);
  return (
    <span
      data-overall={v.overall} data-pass-badge={v.passBadge} title={v.title}
      className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium ${SCORE_CHIP[mau]} ${v.overall === 'incomplete' && (tone !== 'danger' || v.tamThoi) ? 'border-dashed' : ''}`}>
      {mark && <span aria-hidden>{mark}</span>}
      {phan === 'overall'
        ? (v.overall === 'not-passed' && duoiKyVong?.length ? `Dưới kỳ vọng: ${duoiKyVong.join(' · ')}` : v.overallText)
        : v.text}
    </span>
  );
}
