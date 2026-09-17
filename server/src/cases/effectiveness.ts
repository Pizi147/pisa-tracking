import { db } from '../db.ts';
import {
  BEHAVIOUR_TOPICS, CASE_CATEGORY_SHORT, INTERVENTION_KIND_LABEL,
  caseCategoriesFor, caseCategoryLabel, categoryOf, issueLabel,
  type InterventionKind,
} from '../../../shared/domain/index.ts';

/**
 * HIỆU QUẢ PHƯƠNG ÁN VÀ PHÂN TÍCH VẤN ĐỀ — nơi sở hữu DUY NHẤT của cách đếm ở mục 15.3.
 *
 * Bảng phân tích của một LỚP (mục 13.4) và trang Thực trạng của cả chi nhánh (mục 15) hỏi
 * cùng những câu, chỉ khác phạm vi. Để hai nơi tự đếm lấy là đúng cách để cùng một phương
 * án được tính thành công ở màn này và không thành công ở màn kia — và lúc đó không ai tin
 * được con số nào nữa.
 *
 * NĂM LUẬT ĐẾM, và cả năm đều có một câu chuyện thật đằng sau:
 *
 * 1. MỘT PHƯƠNG ÁN ĐÃ KẾT THÚC = MỘT KẾT QUẢ CUỐI. Bốn lần cập nhật hằng tuần không phải
 *    bốn phương án, và càng không phải bốn lần thành công.
 * 2. "CHƯA ĐỦ DỮ LIỆU" KHÔNG VÀO ĐÂU CẢ — không vào nhóm thành công, không vào nhóm không
 *    thành công, và không vào MẪU SỐ. Nó là một câu trung thực khi chưa có bài mới để nhìn;
 *    đẩy nó vào mẫu số là lấy sự trung thực của người dạy trừ điểm chính họ.
 * 3. PHƯƠNG ÁN BỊ THAY VẪN TÍNH, nếu nó có kết quả cuối. Lý do dừng là thông tin riêng;
 *    loại hết phương án bị thay là loại đúng những phương án kém, và tỷ lệ còn lại đẹp giả.
 * 4. PHƯƠNG ÁN HUỶ, CHƯA DUYỆT, CHƯA LÀM hoặc KHÔNG CÓ KẾT QUẢ XÁC ĐỊNH thì KHÔNG phải
 *    thất bại. Không suy hiệu quả từ mỗi cái `status = 'completed'`.
 * 5. Ý THỨC/KHÁC KHÔNG BỊ ÉP VÀO TỶ LỆ TIẾN BỘ HỌC THUẬT. Gia đình đã nhận report không
 *    chứng minh em tiến bộ; nhóm đó báo cáo HÀNH ĐỘNG ĐÃ LÀM và SỐ ĐỢT TÁI DIỄN.
 */

/** Hai nhóm kết quả, và nhóm thứ ba KHÔNG được xếp vào đâu (mục 15.3). */
const SUCCESS = new Set(['improved', 'partial']);
const FAILURE = new Set(['unchanged', 'worse']);
/** `insufficient` cố ý không nằm trong tập nào — đó là cả điểm của luật này. */

export type PlanOutcome = 'success' | 'failure' | 'undetermined';

export function outcomeGroup(outcome: string | null | undefined): PlanOutcome {
  if (!outcome) return 'undetermined';
  if (SUCCESS.has(outcome)) return 'success';
  if (FAILURE.has(outcome)) return 'failure';
  return 'undetermined';
}

type Scope = {
  /** Giới hạn theo lớp; bỏ trống thì lấy theo danh sách học viên. */
  classId?: number | null;
  studentIds?: number[];
  /** Khoảng báo cáo cho phần HIỆU QUẢ. Hiện trạng vấn đề luôn là hiện tại (mục 15.2). */
  fromDate?: string | null;
  toDate?: string | null;
};

function studentsOf(scope: Scope): number[] {
  if (scope.studentIds?.length) return scope.studentIds;
  if (!scope.classId) return [];
  return (db()
    .prepare(`SELECT student_id FROM enrollments WHERE class_id = ? AND status = 'active'`)
    .all(scope.classId) as any[]).map((r) => r.student_id);
}

/**
 * KẾT QUẢ CUỐI CỦA MỖI PHƯƠNG ÁN ĐÃ KẾT THÚC, đúng một dòng cho một phương án.
 *
 * "Đã kết thúc" nghĩa là đã khép lại vì làm xong hoặc vì bị thay — không phải mọi dòng có
 * `status = 'completed'`: một phương án trao đổi được đánh dấu xong mà chưa ai ghi kết quả
 * thì không nói gì về hiệu quả, và nó thuộc nhóm "chưa xác định".
 */
export function planOutcomes(scope: Scope) {
  const sids = studentsOf(scope);
  if (!sids.length) return [];
  const ph = sids.map(() => '?').join(',');
  const params: unknown[] = [...sids];
  let range = '';
  if (scope.fromDate) { range += ' AND COALESCE(iv.completed_date, iv.updated_at, iv.created_at) >= ?'; params.push(scope.fromDate); }
  if (scope.toDate) { range += ' AND COALESCE(iv.completed_date, iv.updated_at, iv.created_at) <= ?'; params.push(scope.toDate); }

  return (db()
    .prepare(
      `SELECT iv.id, iv.kind, iv.status, iv.closed_reason, iv.completed_date,
              sc.id AS case_id, sc.student_id, sc.track, sc.category, sc.topic,
              (SELECT fu.outcome FROM case_followups fu
                WHERE fu.intervention_id = iv.id AND fu.outcome IS NOT NULL
                ORDER BY fu.observed_on DESC, fu.id DESC LIMIT 1) AS final_outcome
         FROM case_interventions iv
         JOIN sos_cases sc ON sc.id = iv.case_id
        WHERE sc.student_id IN (${ph})
          AND iv.status = 'completed'
          AND COALESCE(iv.approval_state, '') != 'pending'${range}`,
    )
    .all(...params) as any[])
    .map((r) => ({
      id: r.id as number,
      caseId: r.case_id as number,
      studentId: r.student_id as number,
      kind: r.kind as string,
      track: (r.track ?? 'academic') as string,
      category: (r.category ?? categoryOf(r.track ?? 'academic', r.topic)) as string | null,
      /* Bị thay thế VẪN TÍNH nếu có kết quả cuối — lý do dừng là chuyện khác. */
      supersededBy: r.closed_reason === 'superseded',
      outcome: r.final_outcome as string | null,
      group: outcomeGroup(r.final_outcome),
    }));
}

/**
 * TỶ LỆ THEO LOẠI PHƯƠNG ÁN — n/N trước %, và luôn kèm CỠ MẪU.
 *
 * Mẫu số là số phương án CÙNG LOẠI đã kết thúc VÀ có kết quả xác định. Không chia số phương
 * án thành công cho số CASE: một case có ba phương án, và đem chia chéo hai đơn vị khác nhau
 * thì con số ra không trả lời được câu hỏi nào.
 *
 * KHÔNG XẾP HẠNG khi mẫu quá nhỏ. 1/1 = 100% không có nghĩa là loại đó tốt nhất, và gọi tên
 * nó là "hiệu quả nhất" sẽ khiến người ta xếp tutor cho cả trăm em dựa trên một trường hợp.
 */
export function planEffectiveness(scope: Scope & { category?: string | null }) {
  const all = planOutcomes(scope).filter((r) => r.track !== 'behaviour');
  const rows = scope.category ? all.filter((r) => r.category === scope.category) : all;
  const byKind = new Map<string, { success: number; failure: number; undetermined: number }>();
  for (const r of rows) {
    const cur = byKind.get(r.kind) ?? { success: 0, failure: 0, undetermined: 0 };
    cur[r.group] += 1;
    byKind.set(r.kind, cur);
  }
  return [...byKind.entries()]
    .map(([kind, c]) => {
      /* MẪU SỐ chỉ gồm phương án có kết quả XÁC ĐỊNH (mục 15.3). */
      const decided = c.success + c.failure;
      return {
        kind,
        label: INTERVENTION_KIND_LABEL[kind as InterventionKind] ?? kind,
        success: c.success, failure: c.failure,
        /* Đã kết thúc nhưng chưa có kết quả xác định — vẫn hiện, để không ai tưởng nó biến mất. */
        undetermined: c.undetermined,
        decided,
        rate: decided > 0 ? Math.round((c.success / decided) * 100) : null,
        /* Mẫu dưới năm thì KHÔNG xếp hạng — chỉ bày con số và nói rõ là mẫu nhỏ. */
        smallSample: decided > 0 && decided < 5,
      };
    })
    .sort((a, b) => b.decided - a.decided);
}

/**
 * PHÂN TÍCH VẤN ĐỀ CỦA MỘT KỸ NĂNG — mục 13.4, hàng là PHÂN LOẠI vấn đề.
 *
 * Năm con số mỗi hàng, và mỗi con số là một đơn vị KHÁC NHAU (mục 15.2), nên tuyệt đối
 * không chia chéo chúng cho nhau:
 *
 *   Case                    số case mang phân loại này
 *   Phương án               số phương án của các case đó
 *   PA đang theo dõi        phương án chưa khép lại
 *   PA thành công / không   chỉ tính phương án ĐÃ KẾT THÚC có kết quả xác định
 *
 * HỌC VIÊN ĐẾM DUY NHẤT trong từng hàng. Một em có hai case cùng phân loại vẫn là một em;
 * còn tổng các hàng lớn hơn số em duy nhất của cả bảng là chuyện bình thường, vì một em có
 * thể gặp nhiều phân loại — và bảng phải NÓI RA điều đó thay vì để người đọc tự cộng.
 */
export function classIssueBoard(classId: number, category: string, opts: { fromDate?: string | null } = {}) {
  const conn = db();
  const sids = studentsOf({ classId });
  if (!sids.length) return { category, rows: [], plans: [], studentCount: 0, note: null };
  const ph = sids.map(() => '?').join(',');

  const cases = conn
    .prepare(
      `SELECT sc.id, sc.student_id, sc.status, sc.track, sc.category, sc.topic
         FROM sos_cases sc
        WHERE sc.student_id IN (${ph})`,
    )
    .all(...sids) as any[];
  const mine = cases.filter((c) => (c.category ?? categoryOf(c.track ?? 'academic', c.topic)) === category);
  const caseIds = mine.map((c) => c.id);

  const issues = caseIds.length
    ? (conn
        .prepare(
          `SELECT case_id, taxonomy_code FROM case_issues
            WHERE role = 'primary' AND case_id IN (${caseIds.map(() => '?').join(',')})`,
        )
        .all(...caseIds) as any[])
    : [];
  const codeOf = new Map<number, string>(issues.map((i) => [i.case_id, i.taxonomy_code]));

  const ivs = caseIds.length
    ? (conn
        .prepare(
          `SELECT iv.*, sc.id AS case_id FROM case_interventions iv
             JOIN sos_cases sc ON sc.id = iv.case_id
            WHERE iv.case_id IN (${caseIds.map(() => '?').join(',')}) AND iv.status != 'cancelled'`,
        )
        .all(...caseIds) as any[])
    : [];
  const outcomes = new Map(planOutcomes({ studentIds: sids, fromDate: opts.fromDate }).map((r) => [r.id, r]));

  /*
   * MỘT HÀNG CHO MỖI PHÂN LOẠI ĐANG CÓ MẶT, cộng một hàng riêng cho case CHƯA PHÂN LOẠI.
   * Gộp case chưa phân loại vào "Khác" là giấu mất một tập cần người xử lý (mục 15.1).
   */
  const groups = new Map<string, number[]>();
  for (const c of mine) {
    const key = codeOf.get(c.id) ?? '__unclassified__';
    groups.set(key, [...(groups.get(key) ?? []), c.id]);
  }

  const rows = [...groups.entries()].map(([code, ids]) => {
    const myIvs = ivs.filter((i) => ids.includes(i.case_id));
    const ended = myIvs.map((i) => outcomes.get(i.id)).filter(Boolean) as { group: PlanOutcome }[];
    return {
      code,
      label: code === '__unclassified__' ? 'Chưa phân loại vấn đề' : issueLabel(code),
      cases: ids.length,
      openCases: mine.filter((c) => ids.includes(c.id) && c.status !== 'done').length,
      /* HỌC VIÊN ĐẾM DUY NHẤT trong hàng này. */
      students: new Set(mine.filter((c) => ids.includes(c.id)).map((c) => c.student_id)).size,
      /* Case đang mở mà chưa ai đề ra phương án — đây là việc chặn, nên tách riêng. */
      noPlan: mine.filter((c) => ids.includes(c.id) && c.status !== 'done'
        && !ivs.some((i) => i.case_id === c.id)).length,
      plans: myIvs.length,
      running: myIvs.filter((i) => i.status === 'planned' || i.status === 'started').length,
      success: ended.filter((e) => e.group === 'success').length,
      failure: ended.filter((e) => e.group === 'failure').length,
      undetermined: ended.filter((e) => e.group === 'undetermined').length,
    };
  }).sort((a, b) => b.openCases - a.openCases || b.cases - a.cases);

  const uniqueStudents = new Set(mine.map((c) => c.student_id)).size;
  const rowSum = rows.reduce((n, r) => n + r.students, 0);
  return {
    category,
    label: caseCategoryLabel(category),
    short: (CASE_CATEGORY_SHORT as Record<string, string>)[category] ?? category,
    rows,
    /* Hiệu quả theo LOẠI phương án của chính kỹ năng này — mở ra khi người dùng cần. */
    plans: planEffectiveness({ classId, category, fromDate: opts.fromDate }),
    studentCount: uniqueStudents,
    /* Nói thẳng vì sao cộng các hàng lại ra số lớn hơn (mục 15.2). */
    note: rowSum > uniqueStudents
      ? `${uniqueStudents} học viên, nhưng cộng các hàng ra ${rowSum} vì một em có thể gặp nhiều phân loại.`
      : null,
  };
}

/** Bộ hạng mục của lớp, để giao diện bày đúng tab: Normal L/R/W/S, Fast Track thêm W1/W2. */
export function issueBoardCategories(ratio: boolean) {
  return caseCategoriesFor(ratio ? 'ratio' : 'ielts_band').map((c) => ({
    code: c, label: caseCategoryLabel(c), short: CASE_CATEGORY_SHORT[c] ?? c,
  }));
}

export { BEHAVIOUR_TOPICS };
