import { db } from '../db.ts';
import {
  INTERVENTION_KIND_LABEL, PERMISSIONS,
  type InterventionKind,
} from '../../../shared/domain/index.ts';
import { scopeFor, type Principal } from '../permissions.ts';

/**
 * PHƯƠNG ÁN & KẾT QUẢ — chế độ xem thứ hai của "Theo chi nhánh" (mục 4.3).
 *
 * Chế độ "Vấn đề" trả lời *học viên đang yếu ở đâu*. Chế độ này trả lời một câu hoàn toàn
 * khác: **những gì trung tâm đã làm cho các em có ăn thua không?**
 *
 * SÁU QUY TẮC, và mỗi quy tắc sửa đúng một cách đọc sai rất dễ mắc:
 *
 *   1. MỘT PHƯƠNG ÁN LÀ MỘT PHƯƠNG ÁN, dù nó được cập nhật ba lần. Đếm theo lần cập nhật
 *      thì phương án nào theo dõi lâu nhất tự nhiên trông như hiệu quả nhất.
 *   2. BÁO CÁO DÙNG KẾT QUẢ GẦN NHẤT của phương án. Lịch sử vẫn còn, mở ở chi tiết case.
 *   3. PHƯƠNG ÁN BỊ THAY THẾ HOẶC HUỶ KHÔNG PHẢI THÀNH CÔNG. Nó đứng riêng ở cột "Đã dừng".
 *   4. CHƯA ĐÁNH GIÁ KHÁC VỚI KHÔNG HIỆU QUẢ. Phương án đang chạy chưa có kết quả nào thì
 *      nằm ở "Đang thực hiện", không được đẩy vào mẫu số của tỷ lệ tiến bộ.
 *   5. TỶ LỆ LUÔN CÓ MẪU SỐ, và số "chưa đủ căn cứ" hiện riêng. Một tỷ lệ 100% trên hai
 *      phương án không nói lên điều gì, mà nhìn thì rất thuyết phục.
 *   6. KHÔNG RÚT VỀ "THÀNH CÔNG / THẤT BẠI". Năm mức kết quả đã chốt vẫn còn đủ ở chi tiết;
 *      bảng này chỉ gộp hai mức tiến bộ lại và nói rõ nó gồm những gì.
 */

export type OutcomeRow = {
  /** Loại phương án — `self_study`, `tutor`, … Hàng cuối cùng là `total`. */
  kind: string;
  label: string;
  /** Đang chạy, chưa có lần cập nhật kết quả nào. KHÔNG nằm trong mẫu số tỷ lệ. */
  running: number;
  /** Đã có ít nhất một kết quả — đây là MẪU SỐ của mọi tỷ lệ bên dưới. */
  reviewed: number;
  /** Kết quả gần nhất là "Tiến bộ rõ rệt" hoặc "Tiến bộ một phần". */
  improved: number;
  improvedClear: number;
  improvedPartial: number;
  /** Kết quả gần nhất là "Chưa thay đổi" hoặc "Kém hơn". */
  noChange: number;
  worse: number;
  /** Kết quả gần nhất là "Không đủ căn cứ" — không tính là tốt, cũng không tính là xấu. */
  insufficient: number;
  /** Đã khép vì BỊ THAY THẾ hoặc bị huỷ — không phải thành công, nên đứng riêng. */
  stopped: number;
};

export type OutcomeReport = {
  rows: OutcomeRow[];
  total: OutcomeRow;
  scopeEmpty: boolean;
  /** Bộ lọc đang áp dụng, trả về để màn hình hiện lại đúng cái đang áp. */
  filters: { branchId: number | null; track: 'normal' | 'ft' | null; topic: string | null };
};

const empty = (kind: string, label: string): OutcomeRow => ({
  kind, label, running: 0, reviewed: 0, improved: 0, improvedClear: 0, improvedPartial: 0,
  noChange: 0, worse: 0, insufficient: 0, stopped: 0,
});

export function outcomeReport(p: Principal, f: {
  branchId?: number | null; track?: 'normal' | 'ft' | null; topic?: string | null;
} = {}): OutcomeReport {
  const scope = scopeFor(p, PERMISSIONS.MEETING_VIEW);
  const filters = {
    branchId: f.branchId ?? null,
    track: f.track ?? null,
    topic: f.topic ?? null,
  };
  if (scope.none) return { rows: [], total: empty('total', 'Tất cả'), scopeEmpty: true, filters };

  const conn = db();
  const where: string[] = ["iv.status != 'cancelled' OR iv.closed_reason IS NOT NULL"];
  const args: unknown[] = [];
  const and: string[] = [];

  if (!scope.all && scope.branchIds?.length) {
    and.push(`cl.branch_id IN (${scope.branchIds.map(() => '?').join(',')})`);
    args.push(...scope.branchIds);
  }
  if (filters.branchId) { and.push('cl.branch_id = ?'); args.push(filters.branchId); }
  /*
   * NORMAL / FAST TRACK lấy theo LỚP EM ĐANG HỌC, cùng quy ước với bảng "Vấn đề" ngay cạnh.
   * Lấy theo lớp lúc case phát sinh thì một em vừa chuyển từ Normal lên FT sẽ đếm vào Normal,
   * và hai bảng trên cùng một màn nói hai con số khác nhau.
   */
  if (filters.track === 'ft') and.push('cl.is_fast_track = 1');
  if (filters.track === 'normal') and.push('COALESCE(cl.is_fast_track, 0) = 0');
  if (filters.topic === 'behaviour') and.push("sc.track = 'behaviour'");
  else if (filters.topic) { and.push('sc.topic = ?'); args.push(filters.topic); }

  /*
   * MỘT DÒNG MỘT PHƯƠNG ÁN, kèm KẾT QUẢ GẦN NHẤT của chính nó.
   *
   * Lần cập nhật gần nhất lấy theo `observed_on` rồi tới `id` — hai lần cùng ngày thì lần
   * ghi sau là lần mới hơn. Không dùng MAX(outcome): chữ so theo bảng chữ cái, và "worse"
   * đứng sau "improved" nên một phương án tiến bộ rồi xấu đi sẽ đọc ra kết quả tuỳ chữ cái.
   */
  const rows = conn
    .prepare(
      `SELECT iv.id, iv.kind, iv.status, iv.closed_reason,
              (SELECT fu.outcome FROM case_followups fu
                WHERE fu.intervention_id = iv.id
                ORDER BY fu.observed_on DESC, fu.id DESC LIMIT 1) AS last_outcome
         FROM case_interventions iv
         JOIN sos_cases sc ON sc.id = iv.case_id
         LEFT JOIN assessment_attempts a ON a.id = sc.attempt_id
         LEFT JOIN enrollments e ON e.student_id = sc.student_id AND e.status = 'active'
         LEFT JOIN classes cl ON cl.id = COALESCE(e.class_id, a.class_id)
        WHERE (${where.join(' AND ')})${and.length ? ` AND ${and.join(' AND ')}` : ''}`,
    )
    .all(...args) as any[];

  const byKind = new Map<string, OutcomeRow>();
  const total = empty('total', 'Tất cả phương án');

  for (const r of rows) {
    const label = INTERVENTION_KIND_LABEL[r.kind as InterventionKind] ?? r.kind;
    let row = byKind.get(r.kind);
    if (!row) { row = empty(r.kind, label); byKind.set(r.kind, row); }

    const bump = (k: keyof OutcomeRow) => {
      (row as any)[k] += 1;
      (total as any)[k] += 1;
    };

    /*
     * BỊ THAY THẾ / BỊ HUỶ đứng riêng và KHÔNG vào mẫu số.
     *
     * Một phương án bị thay bằng phương án khác nghĩa là nó không ăn thua — nhưng cũng
     * không phải một kết quả đo được, nên xếp nó vào "kém hơn" là bịa ra một quan sát mà
     * không ai từng ghi. Nó chỉ là một phương án đã dừng.
     */
    if (r.closed_reason === 'superseded' || r.status === 'cancelled') { bump('stopped'); continue; }

    if (!r.last_outcome) { bump('running'); continue; }

    bump('reviewed');
    switch (r.last_outcome) {
      case 'improved': bump('improved'); bump('improvedClear'); break;
      case 'partial': bump('improved'); bump('improvedPartial'); break;
      case 'unchanged': bump('noChange'); break;
      case 'worse': bump('worse'); break;
      default: bump('insufficient'); break;
    }
  }

  const order = Object.keys(INTERVENTION_KIND_LABEL);
  const out = [...byKind.values()].sort(
    (a, b) => (order.indexOf(a.kind) + 1 || 99) - (order.indexOf(b.kind) + 1 || 99),
  );
  return { rows: out, total, scopeEmpty: false, filters };
}
