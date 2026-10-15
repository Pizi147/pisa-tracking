import { db, theoLo } from '../db.ts';
import { CASE_THAT, NOT_UNCONFIRMED_PRESET } from './sosState.ts';
import { NGUONG_MINI_TEST } from '../../../shared/domain/cuoiKhoa.ts';
import {
  CASE_CATEGORY_SHORT, INTERVENTION_KIND_LABEL,
  caseCategoryLabel, categoryOf, isNoPlanCase, issueBoardCategoriesFor, issueLabel,
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

/**
 * MỘT ĐƠN VỊ để gán kết quả lịch sử vào (F03): lớp, chi nhánh, hoặc loại chương trình. Rỗng hết
 * nghĩa là không lọc theo đơn vị nào.
 */
type Attribution = {
  classId?: number | null;
  branchIds?: number[] | null;
  ratio?: boolean | null;
  /** Phạm vi RỖNG có chủ ý (danh sách chi nhánh được phép là `[]`) — không có gì để đếm. */
  none?: boolean;
};

type Scope = {
  /** Giới hạn theo lớp; bỏ trống thì lấy theo danh sách học viên. */
  classId?: number | null;
  studentIds?: number[];
  /**
   * PHẠM VI RỘNG HƠN MỘT LỚP — trang Thực trạng (mục 15).
   *
   * `branchIds` là danh sách chi nhánh ĐƯỢC PHÉP XEM, đã tính quyền ở tầng route; `ratio`
   * chia hai tab Normal / Fast Track. Số tổng, bộ lọc và mọi lần bấm số đi sâu đều đi qua
   * đúng bộ lọc này, nên ba nơi không thể ra ba con số khác nhau (mục 15.2).
   */
  branchIds?: number[] | null;
  ratio?: boolean | null;
  /** Khoảng báo cáo cho phần HIỆU QUẢ. Hiện trạng vấn đề luôn là hiện tại (mục 15.2). */
  fromDate?: string | null;
  toDate?: string | null;
  /**
   * GÁN KẾT QUẢ THEO ĐƠN VỊ TẠI THỜI ĐIỂM HỖ TRỢ (F03). Truyền cùng `studentIds` khi danh sách em
   * là "em đang thuộc phạm vi" nhưng kết quả phải được gán theo nơi em học LÚC PHƯƠNG ÁN XẢY RA.
   */
  attribution?: Attribution | null;
};

function studentsOf(scope: Scope): number[] {
  if (scope.studentIds?.length) return scope.studentIds;
  const conn = db();
  if (scope.classId) {
    return (conn
      .prepare(`SELECT student_id FROM enrollments WHERE class_id = ? AND status = 'active'`)
      .all(scope.classId) as any[]).map((r) => r.student_id);
  }
  /*
   * PHẠM VI RỖNG TRẢ RỖNG (hợp đồng số liệu, luật 3). `branchIds` là `[]` nghĩa là người xem không
   * được phép chi nhánh nào (hoặc hỏi một chi nhánh ngoài quyền) — KHÔNG phải "không lọc". Trước đây
   * mảng rỗng bị coi như không có bộ lọc và trả về MỌI học viên của hệ thống.
   */
  if (Array.isArray(scope.branchIds) && scope.branchIds.length === 0) return [];
  /*
   * HIỆN TRẠNG LẤY NƠI ĐANG CHỊU TRÁCH NHIỆM (mục 15.2): em thuộc về lớp em đang học, nên
   * phạm vi chi nhánh tính theo lớp hiện tại chứ không theo lớp cũ em từng học.
   */
  const where: string[] = [`e.status = 'active'`];
  const params: unknown[] = [];
  if (scope.branchIds && scope.branchIds.length) {
    where.push(`c.branch_id IN (${scope.branchIds.map(() => '?').join(',')})`);
    params.push(...scope.branchIds);
  }
  if (scope.ratio !== null && scope.ratio !== undefined) {
    where.push(`pg.scoring_mode ${scope.ratio ? '=' : '!='} 'ratio'`);
  }
  return (conn
    .prepare(
      `SELECT DISTINCT e.student_id FROM enrollments e
         JOIN classes c ON c.id = e.class_id
         JOIN programmes pg ON pg.code = c.programme_code
        WHERE ${where.join(' AND ')}`,
    )
    .all(...params) as any[]).map((r) => r.student_id);
}

// ---------------------------------------------------------------- F03: đơn vị TẠI THỜI ĐIỂM hỗ trợ

/**
 * KẾT QUẢ LỊCH SỬ ĐI THEO NƠI EM HỌC LÚC PHƯƠNG ÁN XẢY RA, KHÔNG THEO LỚP HIỆN TẠI (F03).
 *
 * Trước đây `planOutcomes` lấy học viên từ lần ghi danh ĐANG HOẠT ĐỘNG rồi đọc mọi phương án
 * cũ của họ. Em chuyển chi nhánh vì thế làm MẤT mẫu ở nơi cũ và MỌC mẫu ở nơi mới: cái tutor
 * đã chạy ở Cẩm Phả bỗng thành thành tích của Monbay. Rule book §11: "hiện trạng theo nơi đang
 * chăm sóc, lịch sử theo đơn vị tại thời điểm hỗ trợ; chuyển lớp không chuyển ngược thành tích".
 *
 * Dữ liệu quá khứ không đủ để biết em học ở đâu lúc đó (chưa có lần ghi danh nào bao phủ ngày ấy)
 * thì phương án nằm ở nhóm "chưa xác định nguồn" — KHÔNG quy cho nơi hiện tại cho tiện.
 */
type Unit = { classId: number; branchId: number; ratio: boolean };

/** Ngày phương án xảy ra — dùng để tra em thuộc đơn vị nào LÚC ĐÓ. */
const SUPPORT_DAY = `substr(COALESCE(iv.completed_date, iv.started_date, iv.planned_date, iv.created_at), 1, 10)`;

function attributionOf(scope: Scope): Attribution | null {
  const a: Attribution | null = scope.attribution
    ?? (scope.studentIds?.length ? null : { classId: scope.classId, branchIds: scope.branchIds, ratio: scope.ratio });
  if (!a) return null;
  if (Array.isArray(a.branchIds) && a.branchIds.length === 0 && !a.classId) return { ...a, none: true };
  const has = !!a.classId || !!a.branchIds?.length || (a.ratio !== null && a.ratio !== undefined);
  return has ? a : null;
}

/** Mọi em TỪNG thuộc đơn vị này vào bất kỳ lúc nào — ứng viên cho kết quả lịch sử của nó. */
function historicStudentsOf(att: Attribution): number[] {
  const where: string[] = ['1=1'];
  const params: unknown[] = [];
  if (att.classId) { where.push('e.class_id = ?'); params.push(att.classId); }
  if (att.branchIds?.length) {
    where.push(`c.branch_id IN (${att.branchIds.map(() => '?').join(',')})`);
    params.push(...att.branchIds);
  }
  if (att.ratio !== null && att.ratio !== undefined) {
    where.push(`pg.scoring_mode ${att.ratio ? '=' : '!='} 'ratio'`);
  }
  return (db()
    .prepare(
      `SELECT DISTINCT e.student_id FROM enrollments e
         JOIN classes c ON c.id = e.class_id
         JOIN programmes pg ON pg.code = c.programme_code
        WHERE ${where.join(' AND ')}`,
    )
    .all(...params) as any[]).map((r) => r.student_id);
}

/** Tra đơn vị của một em TẠI MỘT NGÀY từ lịch sử ghi danh. Không có lần ghi danh nào bao phủ → null. */
function unitResolver(studentIds: number[]): (studentId: number, day: string) => Unit | null {
  const spans = new Map<number, { unit: Unit; from: string; to: string | null }[]>();
  for (let i = 0; i < studentIds.length; i += 400) {
    const chunk = studentIds.slice(i, i + 400);
    for (const r of db()
      .prepare(
        `SELECT e.student_id, e.class_id, c.branch_id, pg.scoring_mode,
                substr(e.started_at, 1, 10) AS from_d, substr(e.ended_at, 1, 10) AS to_d
           FROM enrollments e
           JOIN classes c ON c.id = e.class_id
           JOIN programmes pg ON pg.code = c.programme_code
          WHERE e.student_id IN (${chunk.map(() => '?').join(',')})`,
      )
      .all(...chunk) as any[]) {
      if (!spans.has(r.student_id)) spans.set(r.student_id, []);
      spans.get(r.student_id)!.push({
        unit: { classId: r.class_id, branchId: r.branch_id, ratio: r.scoring_mode === 'ratio' },
        from: r.from_d, to: r.to_d ?? null,
      });
    }
  }
  return (studentId, day) => {
    let best: { unit: Unit; from: string } | null = null;
    for (const s of spans.get(studentId) ?? []) {
      if (s.from <= day && (s.to === null || s.to >= day) && (!best || s.from > best.from)) best = s;
    }
    return best ? best.unit : null;
  };
}

function inAttribution(u: Unit | null, att: Attribution): boolean {
  if (!u) return false;
  if (att.classId && u.classId !== att.classId) return false;
  if (att.branchIds?.length && !att.branchIds.includes(u.branchId)) return false;
  if (att.ratio !== null && att.ratio !== undefined && u.ratio !== att.ratio) return false;
  return true;
}

/** Truy vấn phương án đã kết thúc của một tập học viên — CHƯA gán đơn vị. */
function queryPlans(sids: number[], scope: Scope) {
  const params: unknown[] = [];
  let range = '';
  if (scope.fromDate) { range += ' AND COALESCE(iv.completed_date, iv.updated_at, iv.created_at) >= ?'; params.push(scope.fromDate); }
  /* PR-Pb2-a: so theo NGÀY (10 ký tự) — `toDate` là ngày trơn, mốc có giờ của chính ngày đó vẫn phải lọt. */
  if (scope.toDate) { range += ' AND substr(COALESCE(iv.completed_date, iv.updated_at, iv.created_at), 1, 10) <= ?'; params.push(scope.toDate); }
  /* PR-S6F-a: chia lô 400 em (≤ 900 tham số Turso) — chi nhánh lớn hơn 900 em không còn vỡ câu. */
  const out: any[] = [];
  theoLo(sids, (lo, ph) => { out.push(...(db()
    .prepare(
      /*
       * CHỐT 5 (PR-C mục 10.4): Case NHẬP BÙ không vào mẫu số hiệu quả hỗ trợ — nó ghi lại
       * trí nhớ, không phải một phương án đang được theo dõi hôm nay. Vẫn hiện đủ trên hồ sơ
       * và hành trình theo tuần; chỉ loại khỏi phép tính tỷ lệ ở đây.
       * S16/S17 (PR-S1): Case HỆ THỐNG tự đóng không có kết quả và PA bị huỷ vì việc đóng (`closed_reason = 'system_closed'`) không
       * phải `completed` — nên tự nằm ngoài. PA đã xong có kết quả thật trước khi đóng VẪN tính (planning review 22/09, Q7).
       */
      `SELECT iv.id, iv.kind, iv.status, iv.closed_reason, iv.completed_date,
              ${SUPPORT_DAY} AS day,
              COALESCE(iv.started_date, iv.planned_date) AS started_on,
              sc.id AS case_id, sc.student_id, sc.category, sc.topic,
              iv.preset, iv.nhom_bo_tro, iv.moc_quy_che, sc.owner_user_id, sc.sos_level, mt.ty_le AS mini_ty_le, mt.ngay_lam AS mini_ngay,
              (SELECT fu.outcome FROM case_followups fu
                WHERE fu.intervention_id = iv.id AND fu.outcome IS NOT NULL
                ORDER BY fu.observed_on DESC, fu.id DESC LIMIT 1) AS final_outcome,
              (SELECT fu.observed_on FROM case_followups fu
                WHERE fu.intervention_id = iv.id AND fu.outcome IS NOT NULL
                ORDER BY fu.observed_on DESC, fu.id DESC LIMIT 1) AS outcome_on
         FROM case_interventions iv
         JOIN sos_cases sc ON sc.id = iv.case_id
         LEFT JOIN mini_test mt ON mt.nhom_bo_tro = iv.nhom_bo_tro AND mt.student_id = sc.student_id   -- PR-Pb2-a (Q9): ≤ 1 dòng (UNIQUE student + bài gốc)
        WHERE sc.student_id IN (${ph})
          AND iv.status = 'completed'
          AND COALESCE(iv.approval_state, '') != 'pending'
          AND ${NOT_UNCONFIRMED_PRESET('iv')}
          AND sc.origin_kind != 'backfill'${range}`,
    )
    .all(...lo, ...params) as any[])); }, 400);
  return out;
}

type PlanRow = ReturnType<typeof shapePlan>;
/**
 * PR-Pb2-a (Q9, T61, K1-24): Mini Test là KẾT QUẢ CUỐI của PA bổ trợ sau Cuối khoá (nhóm `mt:`) — chưa có kết quả tuần mà Mini Test đã ghi
 * thì ≥ 70 % là Tiến bộ, dưới là Không tiến bộ. Một chỗ duy nhất; chưa ghi Mini Test thì vẫn `undetermined` (chưa ghi kết quả).
 */
function ketQuaCuoi(r: any): { outcome: string | null; on: string | null } {
  if (r.final_outcome) return { outcome: r.final_outcome, on: r.outcome_on ?? null };
  if (typeof r.nhom_bo_tro === 'string' && r.nhom_bo_tro.startsWith('mt:') && r.mini_ty_le !== null && r.mini_ty_le !== undefined) {
    return { outcome: r.mini_ty_le >= NGUONG_MINI_TEST ? 'improved' : 'unchanged', on: r.mini_ngay ?? null };
  }
  return { outcome: null, on: r.outcome_on ?? null };
}
function shapePlan(r: any) {
  const kq = ketQuaCuoi(r);
  return {
    id: r.id as number,
    caseId: r.case_id as number,
    studentId: r.student_id as number,
    kind: r.kind as string,
    category: (r.category ?? categoryOf(r.topic)) as string | null,
    /* Bị thay thế VẪN TÍNH nếu có kết quả cuối — lý do dừng là chuyện khác. */
    supersededBy: r.closed_reason === 'superseded' || r.closed_reason === 'doi_pa',   // OV-13b: Đổi PA — khép không kết luận
    outcome: kq.outcome,
    group: outcomeGroup(kq.outcome),
    /** Ngày phương án xảy ra — căn cứ để gán đơn vị (F03). */
    day: r.day as string,
    /** Ngày bắt đầu (hoặc dự kiến) và ngày ghi kết quả cuối — cho "Thời gian trung bình" của Hiệu quả PA (PR-UX4, Q10). */
    startedOn: (r.started_on ?? null) as string | null,
    outcomeOn: kq.on as string | null,
    /* PR-Pb2-a (Q8): `preset = 1` ⇔ PA theo quy chế (gồm Bổ trợ); người phụ trách Case, mức SOS, nhóm bổ trợ — cho Hiệu quả PA. */
    quyChe: r.preset === 1,
    chuCase: (r.owner_user_id ?? null) as number | null,
    sos: (r.sos_level ?? null) as number | null,
    nhomBoTro: (r.nhom_bo_tro ?? null) as string | null,
  };
}

/**
 * KẾT QUẢ CUỐI CỦA MỖI PHƯƠNG ÁN ĐÃ KẾT THÚC, đúng một dòng cho một phương án.
 *
 * "Đã kết thúc" nghĩa là đã khép lại vì làm xong hoặc vì bị thay — không phải mọi dòng có
 * `status = 'completed'`: một phương án trao đổi được đánh dấu xong mà chưa ai ghi kết quả
 * thì không nói gì về hiệu quả, và nó thuộc nhóm "chưa xác định".
 *
 * Phạm vi lớp / chi nhánh / loại chương trình gán theo ĐƠN VỊ TẠI THỜI ĐIỂM hỗ trợ (F03). Truyền
 * thẳng `studentIds` (không kèm `attribution`) thì lấy đúng những em đó, không gán đơn vị.
 */
export function planOutcomes(scope: Scope) {
  const att = attributionOf(scope);
  if (att?.none) return [];
  const sids = scope.studentIds?.length
    ? scope.studentIds
    : att ? historicStudentsOf(att) : studentsOf(scope);
  if (!sids.length) return [];
  const rows = queryPlans(sids, scope);
  if (!att) return rows.map(shapePlan);
  const unitAt = unitResolver([...new Set(rows.map((r) => r.student_id as number))]);
  return rows.filter((r) => inAttribution(unitAt(r.student_id, r.day), att)).map(shapePlan);
}

/**
 * PHƯƠNG ÁN "CHƯA XÁC ĐỊNH NGUỒN" (F03): dữ liệu quá khứ không đủ để biết em học ở đâu lúc đó.
 * Chúng KHÔNG nằm ở nơi nào cả — không quy cho nơi hiện tại — nhưng cũng không được biến mất.
 */
export function planOutcomesUnattributed(scope: Scope) {
  const sids = studentsOf(scope);
  if (!sids.length) return [];
  const rows = queryPlans(sids, scope);
  const unitAt = unitResolver([...new Set(rows.map((r) => r.student_id as number))]);
  return rows.filter((r) => unitAt(r.student_id, r.day) === null).map(shapePlan);
}

/**
 * PHƯƠNG ÁN CẦN BỔ SUNG ĐÁNH GIÁ (F05) — đã kết thúc nhưng chưa ai ghi kết quả xác định.
 *
 * Chúng KHÔNG nằm trong bảng hiệu quả và không vào mẫu số (D03), nhưng cũng không được biến mất:
 * đây là một việc cần người làm. Hiện thành một liên kết ngoài bảng, có danh sách ID riêng.
 */
export function plansNeedingEvaluation(scope: Scope & { category?: string | null }) {
  return canBoSungDanhGiaCua(planOutcomes(scope), scope.category ?? null);
}
function canBoSungDanhGiaCua(tatCa: PlanRow[], category: string | null) {
  /*
   * PR-S2 (Q2, planning review 22/09): PA ĐÃ BỊ THAY với kết quả "Chưa đủ dữ liệu" không ai bổ sung đánh giá được nữa — nó đã khép
   * để nhường cho PA mới. Không đưa vào danh sách cần bổ sung; nó vẫn ngoài bảng và ngoài mẫu số như mọi kết quả không xác định (D03).
   */
  const all = tatCa.filter((r) => r.group === 'undetermined' && !r.supersededBy);
  const rows = category ? all.filter((r) => r.category === category) : all;
  return { count: rows.length, ids: rows.map((r) => r.id) };
}

/**
 * TỶ LỆ CÓ CẢI THIỆN — `(có tiến bộ + một phần) / (bốn mức xác định)`, trả về CẢ HAI TẬP ID.
 *
 * "Chưa đủ dữ liệu" và Case nhập bù KHÔNG vào mẫu số. Ba phương án đủ kết quả (tiến bộ, một
 * phần, không tiến bộ) cộng một phương án chưa xác định cho ra 2/3, KHÔNG phải 2/4. Số là độ dài
 * của tập, danh sách khi bấm vào là chính tập đó.
 */
export function improvementRate(scope: Scope & { category?: string | null }) {
  const rows = planOutcomes(scope)
    .filter((r) => !scope.category || r.category === scope.category);
  const decided = rows.filter((r) => r.group !== 'undetermined');
  const improved = decided.filter((r) => r.group === 'success');
  return {
    n: improved.length, N: decided.length,
    numeratorIds: improved.map((r) => r.id), denominatorIds: decided.map((r) => r.id),
  };
}

/**
 * TỶ LỆ THEO LOẠI PHƯƠNG ÁN — n/N trước %, và luôn kèm CỠ MẪU.
 *
 * Mẫu số là số phương án CÙNG LOẠI đã kết thúc VÀ có kết quả xác định. Không chia số phương
 * án thành công cho số CASE: một Case có ba phương án, và đem chia chéo hai đơn vị khác nhau
 * thì con số ra không trả lời được câu hỏi nào.
 *
 * KHÔNG XẾP HẠNG khi mẫu quá nhỏ. 1/1 = 100% không có nghĩa là loại đó tốt nhất, và gọi tên
 * nó là "hiệu quả nhất" sẽ khiến người ta xếp tutor cho cả trăm em dựa trên một trường hợp.
 *
 * KHÔNG CÓ HÀNG/CỘT "CHƯA XÁC ĐỊNH" (F05): mẫu số đã loại chúng thì bảng cũng không được bày
 * chúng ra như thể chúng thuộc mẫu. Loại nào chỉ toàn phương án chưa xác định thì không có hàng —
 * chúng nằm ở `plansNeedingEvaluation`, ngoài bảng. Hai mức thành công vẫn hiện riêng (D03):
 * `improved` (có tiến bộ) và `partial` (tiến bộ một phần), tổng gọi là "Có cải thiện".
 */
export function planEffectiveness(scope: Scope & { category?: string | null }) {
  return hieuQuaTheoLoaiCua(planOutcomes(scope), scope.category ?? null);
}
function hieuQuaTheoLoaiCua(all: PlanRow[], category: string | null) {
  const rows = category ? all.filter((r) => r.category === category) : all;
  const byKind = new Map<string, { improved: number; partial: number; failure: number }>();
  for (const r of rows) {
    if (r.group === 'undetermined') continue;
    const cur = byKind.get(r.kind) ?? { improved: 0, partial: 0, failure: 0 };
    if (r.group === 'failure') cur.failure += 1;
    else if (r.outcome === 'partial') cur.partial += 1;
    else cur.improved += 1;
    byKind.set(r.kind, cur);
  }
  return [...byKind.entries()]
    .map(([kind, c]) => {
      const success = c.improved + c.partial;
      /* MẪU SỐ chỉ gồm phương án có kết quả XÁC ĐỊNH (mục 15.3). */
      const decided = success + c.failure;
      return {
        kind,
        label: INTERVENTION_KIND_LABEL[kind as InterventionKind] ?? kind,
        success, failure: c.failure,
        improved: c.improved, partial: c.partial,
        decided,
        rate: decided > 0 ? Math.round((success / decided) * 100) : null,
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
 *   Case                    số Case mang phân loại này
 *   Phương án               số phương án của các Case đó
 *   PA đang theo dõi        phương án chưa khép lại
 *   PA thành công / không   chỉ tính phương án ĐÃ KẾT THÚC có kết quả xác định
 *
 * HỌC VIÊN ĐẾM DUY NHẤT trong từng hàng. Một em có hai Case cùng phân loại vẫn là một em;
 * còn tổng các hàng lớn hơn số em duy nhất của cả bảng là chuyện bình thường, vì một em có
 * thể gặp nhiều phân loại — và bảng phải NÓI RA điều đó thay vì để người đọc tự cộng.
 */
export function classIssueBoard(classId: number, category: string, opts: { fromDate?: string | null } = {}) {
  return issueBoard({ classId, fromDate: opts.fromDate ?? null }, category);
}

/**
 * CÙNG MỘT BẢNG, CHẠY TRÊN PHẠM VI BẤT KỲ — một lớp (mục 13.4) hay cả chi nhánh (mục 15).
 *
 * Hai màn hỏi cùng những câu và chỉ khác phạm vi, nên chúng dùng chung đúng một hàm. Viết
 * hai bản là cách chắc chắn để một hôm nào đó bảng của lớp và trang Thực trạng cãi nhau về
 * cùng một Case, và lúc đó không ai biết bên nào đúng.
 */
export function issueBoard(scope: Scope, category: string) {
  const conn = db();
  const sids = studentsOf(scope);
  if (!sids.length) {
    return {
      category, label: caseCategoryLabel(category),
      short: (CASE_CATEGORY_SHORT as Record<string, string>)[category] ?? category,
      rows: [], plans: [], studentCount: 0, note: null,
      tong: { hvGapVanDe: [] as number[], caseTatCa: [] as number[], dangTheoDoi: [] as number[], daCoPa: [] as number[], daXong: [] as number[], thanhCong: [] as number[] },
      needsEvaluation: { count: 0, ids: [] as number[] },
    };
  }
  /* PR-Dọn (quét #17): chia lô — phạm vi chi nhánh có thể vượt 900 em. */
  const cases: any[] = [];
  theoLo(sids, (lo, ph) => {
    cases.push(...conn
      .prepare(
        `SELECT sc.id, sc.student_id, sc.status, sc.category, sc.topic, sc.disposition, sc.outcome,
                (SELECT COUNT(*) FROM case_interventions i WHERE i.case_id = sc.id) AS iv_all
           FROM sos_cases sc
          WHERE sc.student_id IN (${ph}) AND ${CASE_THAT('sc')}`,
      )
      .all(...lo) as any[]);
  });
  const mine = cases.filter((c) => (c.category ?? categoryOf(c.topic)) === category);
  const caseIds = mine.map((c) => c.id);

  const issues: any[] = [];
  const ivs: any[] = [];
  theoLo(caseIds, (lo, ph) => {
    issues.push(...conn.prepare(`SELECT case_id, taxonomy_code FROM case_issues WHERE role = 'primary' AND case_id IN (${ph})`).all(...lo) as any[]);
    ivs.push(...conn
      .prepare(
        `SELECT iv.*, sc.id AS case_id FROM case_interventions iv
           JOIN sos_cases sc ON sc.id = iv.case_id
          WHERE iv.case_id IN (${ph}) AND iv.status != 'cancelled'
            AND ${NOT_UNCONFIRMED_PRESET('iv')}`,
      )
      .all(...lo) as any[]);
  });
  const codeOf = new Map<number, string>(issues.map((i) => [i.case_id, i.taxonomy_code]));
  /*
   * KẾT QUẢ THEO ĐƠN VỊ TẠI THỜI ĐIỂM HỖ TRỢ (F03). Danh sách CASE ở trên là hiện trạng (em đang học
   * ở đây), còn kết quả hỗ trợ là lịch sử: gán theo nơi em học lúc phương án xảy ra. Phạm vi không
   * có đơn vị nào (toàn hệ thống) thì không cần gán — lấy đúng những em đang xét.
   */
  const att = attributionOf(scope);
  const outcomeScope: Scope = att
    ? { attribution: att, fromDate: scope.fromDate, toDate: scope.toDate }
    : { studentIds: sids, fromDate: scope.fromDate, toDate: scope.toDate };
  /* MỘT lần `planOutcomes` cho cả bảng: hàng vấn đề, hiệu quả theo loại PA và "cần bổ sung đánh giá" cùng đọc tập này (số câu SQL, và không thể lệch nhau). */
  const outcomeRows = planOutcomes(outcomeScope);
  const outcomes = new Map(outcomeRows.map((r) => [r.id, r]));

  /*
   * MỘT HÀNG CHO MỖI PHÂN LOẠI ĐANG CÓ MẶT, cộng một hàng riêng cho Case CHƯA PHÂN LOẠI.
   * Gộp Case chưa phân loại vào "Khác" là giấu mất một tập cần người xử lý (mục 15.1).
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
      label: code === '__unclassified__' ? 'Chưa chọn nhóm nguyên nhân' : issueLabel(code),
      cases: ids.length,
      openCases: mine.filter((c) => ids.includes(c.id) && c.status !== 'done').length,
      /*
       * HV ĐANG GẶP là HIỆN TRẠNG: chỉ em có Case CHƯA KẾT LUẬN (F02). Trước đây cột này đếm từ MỌI
       * Case của phân loại trong khi `openCases` bên cạnh đã lọc chưa đóng — hai cột cạnh nhau nói về
       * hai tập khác nhau. Em chỉ có Case đã đóng không còn "đang gặp" vấn đề nữa.
       */
      students: new Set(mine.filter((c) => ids.includes(c.id) && c.status !== 'done').map((c) => c.student_id)).size,
      /* Chỉ số LỊCH SỬ riêng: mọi em TỪNG có Case ở phân loại này, kể cả Case đã đóng. */
      studentsEver: new Set(mine.filter((c) => ids.includes(c.id)).map((c) => c.student_id)).size,
      /* Case đang mở mà chưa ai đề ra phương án — đây là việc chặn, nên tách riêng. Cùng `isNoPlanCase` với chỉ số. */
      noPlan: mine.filter((c) => ids.includes(c.id)
        && isNoPlanCase({ status: c.status, disposition: c.disposition, interventionCount: c.iv_all })).length,
      plans: myIvs.length,
      running: myIvs.filter((i) => i.status === 'planned' || i.status === 'started').length,
      success: ended.filter((e) => e.group === 'success').length,
      failure: ended.filter((e) => e.group === 'failure').length,
    };
  }).sort((a, b) => b.openCases - a.openCases || b.cases - a.cases);

  const uniqueStudents = new Set(mine.filter((c) => c.status !== 'done').map((c) => c.student_id)).size;
  const rowSum = rows.reduce((n, r) => n + r.students, 0);

  /*
   * HAI BẢNG NHỎ CỦA PHÂN TÍCH LỚP (PR-HVL, M5, YC-11.3.3). MỖI SỐ LÀ ĐỘ DÀI CỦA MỘT TẬP ID (hợp đồng số liệu luật 1): danh sách khi bấm số
   * (`GET /classes/:id/issue-board/o`) là chính tập này. Một Case chỉ đếm MỘT lần ở mỗi cột.
   *   "Vấn đề ở kỹ năng": HV gặp vấn đề · Case · Đang theo dõi · Đã có PA · Đã xong → Thành công.
   *   "Hiệu quả PA ở kỹ năng": mỗi loại PA — Đang thực hiện · Đã thực hiện (`decided`) · Thành công (`success`) — cùng `planOutcomes` với Phân tích › Hiệu quả PA.
   */
  const dangTheoDoi = mine.filter((c) => c.status !== 'done');
  const daXong = mine.filter((c) => c.status === 'done');
  const coPa = new Set(ivs.map((i) => i.case_id as number));
  const tong = {
    hvGapVanDe: [...new Set(dangTheoDoi.map((c) => c.student_id as number))],
    caseTatCa: mine.map((c) => c.id as number),
    dangTheoDoi: dangTheoDoi.map((c) => c.id as number),
    /* PA quy chế chưa xác nhận không tính (`ivs` đã loại bằng NOT_UNCONFIRMED_PRESET) — Case chỉ có PA đó vẫn là "chưa có PA". */
    daCoPa: mine.filter((c) => coPa.has(c.id)).map((c) => c.id as number),
    daXong: daXong.map((c) => c.id as number),
    thanhCong: daXong.filter((c) => c.outcome === 'much_better' || c.outcome === 'improved').map((c) => c.id as number),
  };
  const hieuQua = hieuQuaTheoLoaiCua(outcomeRows, category);
  const kindIds = (kinds: string[], loc: (r: PlanRow) => boolean) => outcomeRows.filter((r) => r.category === category && kinds.includes(r.kind) && loc(r)).map((r) => r.id);
  const dangTheoKind = new Map<string, number[]>();
  for (const i of ivs) if (i.status === 'planned' || i.status === 'started') dangTheoKind.set(i.kind, [...(dangTheoKind.get(i.kind) ?? []), i.id as number]);
  const plans = [...new Set([...hieuQua.map((p) => p.kind), ...dangTheoKind.keys()])].map((kind) => {
    const p = hieuQua.find((x) => x.kind === kind);
    const daIds = kindIds([kind], (r) => r.group !== 'undetermined');
    const thanhCongIds = kindIds([kind], (r) => r.group === 'success');
    return {
      kind, label: p?.label ?? INTERVENTION_KIND_LABEL[kind as InterventionKind] ?? kind,
      success: p?.success ?? 0, failure: p?.failure ?? 0, improved: p?.improved ?? 0, partial: p?.partial ?? 0,
      decided: p?.decided ?? 0, rate: p?.rate ?? null, smallSample: p?.smallSample ?? false,
      /** PA `planned`/`started` của Case đang xét (trừ PA quy chế chưa xác nhận). */
      dangThucHien: (dangTheoKind.get(kind) ?? []).length,
      ids: { dangThucHien: dangTheoKind.get(kind) ?? [], daThucHien: daIds, thanhCong: thanhCongIds },
    };
  }).sort((a, b) => b.decided - a.decided || b.dangThucHien - a.dangThucHien);

  return {
    category,
    label: caseCategoryLabel(category),
    short: (CASE_CATEGORY_SHORT as Record<string, string>)[category] ?? category,
    rows,
    /* Hiệu quả theo LOẠI phương án của chính kỹ năng này. */
    plans,
    tong,
    /* F05: phương án chưa xác định KHÔNG nằm trong bảng — chúng là một việc cần bổ sung đánh giá. */
    needsEvaluation: canBoSungDanhGiaCua(outcomeRows, category),
    studentCount: uniqueStudents,
    /* Nói thẳng vì sao cộng các hàng lại ra số lớn hơn (mục 15.2). */
    note: rowSum > uniqueStudents
      ? `${uniqueStudents} học viên, nhưng cộng các hàng ra ${rowSum} vì một em có thể gặp nhiều phân loại.`
      : null,
  };
}

/**
 * Bộ tab của bảng phân tích: Normal L/R/W/S, Fast Track L/R/W1/W2/S (mục 13.4).
 *
 * Ý THỨC NẰM NGOÀI BẢNG NÀY, và không có đường nào đưa nó vào (đặc tả Ý thức §8, hợp đồng số liệu §5.3): bảng báo cáo hiệu
 * quả phương án bằng tỷ lệ thành công, mà gia đình đã nhận report không chứng minh em tiến bộ. Ý thức có góc nhìn riêng,
 * đếm SỐ VI PHẠM và SỐ BIỆN PHÁP ĐÃ LÀM — xem `server/src/yThuc/thongKe.ts`.
 */
export function issueBoardCategories(ratio: boolean) {
  return issueBoardCategoriesFor(ratio ? 'ratio' : 'ielts_band').map((c) => ({
    code: c, label: caseCategoryLabel(c), short: CASE_CATEGORY_SHORT[c] ?? c,
  }));
}

