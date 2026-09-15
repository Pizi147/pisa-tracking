import { db } from '../db.ts';
import {
  ASSESSED_SKILLS, PROGRAMME_TEMPLATES, REGULAR_SKILLS, SOS_LABEL,
} from '../../../shared/domain/index.ts';
import { entryBandsOf, loadBundle } from '../fasttrack/attempts.ts';
import { evaluateAttempt } from '../fasttrack/scoring.ts';
import { evaluateRegular } from '../normal/regular.ts';

/**
 * TÌNH TRẠNG HỌC THUẬT HIỆN TẠI CỦA MỘT HỌC VIÊN — MỘT định nghĩa cho cả hệ thống.
 *
 * ĐÂY LÀ CHỖ SỬA LỖI LỚN NHẤT CỦA VÒNG NÀY.
 *
 * Trước đây "SOS hiện tại" được suy ra từ CASE CÒN MỞ: lấy case có số MT lớn nhất rồi đọc mức
 * SOS đã đóng băng trong case đó. Cách ấy sai ở ba chỗ, và cả ba đều nói dối người đọc:
 *
 *   1. Em thi MT3 đạt hết nhưng case Reading từ MT2 chưa đóng → màn hình vẫn gọi em là SOS 1.
 *      Mức SOS là KẾT LUẬN CỦA MỘT BÀI THI, không phải "còn việc đang làm dở".
 *   2. Em sang lộ trình mới, chưa thi lượt nào → vẫn mang mức SOS của lộ trình cũ.
 *   3. Đóng case là đổi mức SOS, và thi đạt thì không đổi gì cả. Ngược hoàn toàn.
 *
 * Nay tách hẳn BA THÔNG TIN khác nhau, và không cái nào được suy ra từ cái kia:
 *
 *   · KẾT QUẢ HỌC THUẬT GẦN NHẤT  — mức SOS, lấy từ lượt đánh giá mới nhất có điểm
 *   · CASE ĐANG THEO DÕI          — đếm case, không sinh ra mức nào
 *   · KẾT QUẢ SAU HỖ TRỢ          — nằm trong từng case, cũng không sinh ra mức nào
 *
 * Nhờ vậy màn hình nói được những câu đúng mà trước đây không nói được:
 *
 *   "MT2 đạt kỳ vọng · còn 2 case đang theo dõi"
 *   "MT3: SOS 1 tạm thời · mới có điểm 2/4 kỹ năng"
 *   "Chưa có kết quả trong lộ trình này · có 1 case bàn giao"
 */
export type Standing = {
  studentId: number;
  cycleId: number | null;
  /** `ielts_band` với Fast Track, `ratio` với lớp Normal. */
  mode: 'ielts_band' | 'ratio' | null;

  /** Lượt đánh giá MỚI NHẤT ĐÃ CÓ ĐIỂM trong lộ trình hiện tại. Chưa thi lượt nào thì NULL. */
  attemptId: number | null;
  attemptNo: number | null;
  attemptKind: string | null;
  /** "MT2", "Cuối khoá" — tên người đọc, để câu tóm tắt nói rõ mức này của bài nào. */
  attemptLabel: string | null;
  periodCode: string | null;

  /**
   * Mức SOS của CHÍNH lượt đó. NULL nghĩa là chưa kết luận được — chưa thi, hoặc thi rồi mà
   * chưa nhập ô điểm nào. KHÔNG dùng 0 để nói "chưa biết": 0 là một kết luận thật, nghĩa là
   * đạt kỳ vọng ở mọi kỹ năng.
   */
  sosLevel: number | null;
  /** Mới có một phần điểm: kết luận ở trên còn đổi được khi các kỹ năng còn lại vào điểm. */
  provisional: boolean;
  scored: number;
  required: number;

  /** Lượt kế tiếp đã lên kế hoạch mà chưa có điểm — để nói "đang chờ kết quả MT3". */
  nextAttemptNo: number | null;
  nextAttemptLabel: string | null;
  nextPeriodCode: string | null;

  /** Case đang theo dõi — ĐẾM CASE, không phải một mức độ. */
  openCases: number;
  /** Trong số đó, bao nhiêu case mang từ lộ trình trước sang (việc bàn giao). */
  handoverCases: number;
};

/** Câu tóm tắt một dòng, dựng ở máy chủ để mọi màn nói y hệt nhau. */
export function standingLine(s: Standing): string {
  const head = s.sosLevel === null
    ? (s.attemptId === null
      ? 'Chưa có kết quả trong lộ trình này'
      : `${s.attemptLabel}: chưa đủ điểm để kết luận`)
    : s.sosLevel === 0
      ? `${s.attemptLabel} đạt kỳ vọng`
      : `${s.attemptLabel}: ${SOS_LABEL[s.sosLevel as 1 | 2 | 3]}${s.provisional ? ' tạm thời' : ''}`;
  const parts = [head];
  if (s.provisional) parts.push(`mới có điểm ${s.scored}/${s.required} kỹ năng`);
  if (s.openCases > 0) {
    parts.push(s.handoverCases > 0 && s.handoverCases === s.openCases
      ? `${s.handoverCases} case bàn giao`
      : `còn ${s.openCases} case đang theo dõi`);
  }
  return parts.join(' · ');
}

const EMPTY = (studentId: number, cycleId: number | null): Standing => ({
  studentId, cycleId, mode: null,
  attemptId: null, attemptNo: null, attemptKind: null, attemptLabel: null, periodCode: null,
  sosLevel: null, provisional: false, scored: 0, required: 0,
  nextAttemptNo: null, nextAttemptLabel: null, nextPeriodCode: null,
  openCases: 0, handoverCases: 0,
});

const labelOf = (kind: string | null, no: number | null) =>
  kind === 'final' ? 'Cuối khoá' : kind === 'progress' ? 'Giữa khoá' : `MT${no ?? '?'}`;

/**
 * Tính tình trạng cho MỘT LOẠT học viên trong một lần.
 *
 * Cố ý nhận cả danh sách chứ không nhận từng em: bảng lớp, danh sách học viên và bảng tổng
 * hợp đều cần con số này cho hàng chục em cùng lúc. Hỏi từng em một thì mỗi màn sinh hàng
 * trăm câu truy vấn — chậm mà không chỗ nào báo lỗi.
 */
export function standingFor(studentIds: number[]): Map<number, Standing> {
  const out = new Map<number, Standing>();
  if (!studentIds.length) return out;
  const conn = db();
  const ph = studentIds.map(() => '?').join(',');

  /*
   * LỘ TRÌNH ĐANG CHẠY của từng em; không có lộ trình đang chạy thì lấy LỘ TRÌNH GẦN NHẤT.
   *
   * Một em đã hoàn thành lộ trình và đi thi thật vẫn có kết quả để nói. Chỉ đọc lộ trình
   * `active` thì đầu hồ sơ em đó ghi "Chưa có kết quả trong lộ trình này" trong khi ngay bên
   * dưới là bốn lượt MT đã chấm xong — người đọc chỉ có thể kết luận là phần mềm hỏng.
   *
   * `ORDER BY status='active' DESC, seq` cho lộ trình đang chạy thắng; ghi sau đè lên ghi
   * trước nên phải xếp cái muốn giữ xuống CUỐI.
   */
  const cycleOf = new Map<number, any>();
  for (const r of conn
    .prepare(
      `SELECT * FROM learning_cycles
        WHERE student_id IN (${ph})
        ORDER BY (status = 'active') ASC, seq ASC`,
    )
    .all(...studentIds) as any[]) cycleOf.set(r.student_id, r);
  for (const id of studentIds) out.set(id, EMPTY(id, cycleOf.get(id)?.id ?? null));

  const cycleIds = [...cycleOf.values()].map((c) => c.id);
  if (!cycleIds.length) return out;

  /*
   * MỌI LƯỢT CỦA CÁC LỘ TRÌNH ĐANG CHẠY, một lần.
   *
   * Lấy cả lượt chưa có điểm, vì "đang chờ kết quả MT3" cũng là một thông tin phải nói ra —
   * im lặng thì người đọc tưởng em chưa được xếp lịch.
   */
  const cph = cycleIds.map(() => '?').join(',');
  const attempts = conn
    .prepare(
      `SELECT a.*, pr.code AS period_code FROM assessment_attempts a
         LEFT JOIN report_periods pr ON pr.id = a.planned_period_id
        WHERE a.cycle_id IN (${cph}) AND a.status != 'cancelled'
        ORDER BY a.attempt_no`,
    )
    .all(...cycleIds) as any[];
  const bundle = loadBundle(attempts.map((a) => a.id));

  const byStudent = new Map<number, any[]>();
  for (const a of attempts) {
    if (!byStudent.has(a.student_id)) byStudent.set(a.student_id, []);
    byStudent.get(a.student_id)!.push(a);
  }

  /* Case đang mở, đếm riêng phần mang từ lộ trình trước sang. */
  for (const r of conn
    .prepare(
      `SELECT student_id, cycle_id FROM sos_cases
        WHERE student_id IN (${ph}) AND status != 'done'`,
    )
    .all(...studentIds) as any[]) {
    const s = out.get(r.student_id);
    if (!s) continue;
    s.openCases += 1;
    if (s.cycleId !== null && r.cycle_id !== null && r.cycle_id !== s.cycleId) s.handoverCases += 1;
  }

  for (const [studentId, cycle] of cycleOf) {
    const s = out.get(studentId)!;
    const ratio = !!cycle.programme_code && PROGRAMME_TEMPLATES[
      cycle.programme_code as keyof typeof PROGRAMME_TEMPLATES
    ]?.scoringMode === 'ratio';
    s.mode = ratio ? 'ratio' : 'ielts_band';
    const list = byStudent.get(studentId) ?? [];

    /*
     * LƯỢT MỚI NHẤT CÓ ĐIỂM, duyệt từ cuối lên.
     *
     * "Có điểm" chứ không phải "đã chốt": một lượt mới nhập hai trong bốn kỹ năng vẫn nói
     * được điều gì đó, chỉ là nói kèm chữ TẠM THỜI. Bỏ qua nó để lấy lượt cũ đầy đủ hơn là
     * giấu mất tin mới nhất — và đó chính là tin người đọc đang cần.
     */
    for (let i = list.length - 1; i >= 0; i -= 1) {
      const a = list[i];
      const scores = bundle.scores.get(a.id) ?? [];
      if (!scores.length) {
        /* Chưa có điểm: ghi lại làm "lượt đang chờ" rồi đi tiếp xuống lượt cũ hơn. */
        if (s.nextAttemptNo === null) {
          s.nextAttemptNo = a.attempt_no;
          s.nextAttemptLabel = labelOf(a.kind, a.attempt_no);
          s.nextPeriodCode = a.period_code ?? null;
        }
        continue;
      }
      s.attemptId = a.id;
      s.attemptNo = a.attempt_no;
      s.attemptKind = a.kind ?? 'mock';
      s.attemptLabel = labelOf(a.kind, a.attempt_no);
      s.periodCode = a.period_code ?? null;

      if (ratio) {
        const tpl = PROGRAMME_TEMPLATES[cycle.programme_code as keyof typeof PROGRAMME_TEMPLATES];
        const r = evaluateRegular([...(tpl?.skills ?? REGULAR_SKILLS)], scores as any);
        s.sosLevel = r.sosLevel;
        s.provisional = r.provisional;
        s.scored = r.scored;
        s.required = r.required;
      } else {
        const skips = bundle.skips.get(a.id) ?? [];
        const r = evaluateAttempt(
          cycle.target_score ?? null, a.attempt_no,
          entryBandsOf(scores as any), skips.map((x: any) => x.skill ?? x),
        );
        s.sosLevel = r.sosLevel;
        s.provisional = r.provisional;
        s.scored = r.scoredRequired;
        s.required = r.required.length;
      }
      break;
    }
    if (s.attemptId === null && s.required === 0) {
      s.required = ratio ? REGULAR_SKILLS.length : ASSESSED_SKILLS.length;
    }
  }
  return out;
}
