import { db } from '../db.ts';
import { CASE_DISMISS_REASON_LABEL, type CaseDismissReason } from '../../../shared/domain/index.ts';

/**
 * TRẠNG THÁI CỦA CASE TỪ SOS — chỉ ĐỌC, không import mô-đun nghiệp vụ nào (rulebook v3, đặc tả §3.2 và §8).
 *
 * Tách riêng để `cases.ts`, `effectiveness.ts` và các truy vấn việc cần làm dùng CHUNG một định nghĩa mà không tạo vòng import với
 * `sosAuto.ts` (nơi ghi).
 */

/**
 * Điều kiện SQL "phương án điền sẵn mà chưa ai xác nhận" (Q-V3-3). `alias` là bí danh của `case_interventions` trong truy vấn.
 *
 * MỘT nơi định nghĩa cho hai lời hứa: phương án đó KHÔNG vào hiệu quả (`cases/effectiveness.ts`) và KHÔNG sinh nghĩa vụ cập nhật tuần
 * hay xem lại kết quả (`worklist/*`). Mỗi truy vấn tự viết một kiểu là cách một trong hai lời hứa bị vỡ âm thầm.
 */
export const UNCONFIRMED_PRESET = (alias = 'iv') => `(${alias}.preset = 1 AND ${alias}.confirmed_at IS NULL)`;
export const NOT_UNCONFIRMED_PRESET = (alias = 'iv') => `NOT ${UNCONFIRMED_PRESET(alias)}`;

/**
 * PA THEO QUY CHẾ DO MÁY GÁN mà CHƯA có kết quả tuần nào (S4-1, S08 bản 28/09). Máy gán ⇔ `preset = 1 AND confirmed_by IS NULL`.
 * Dùng cho: đồng bộ theo mức SOS mới nhất, huỷ khi "Không cần theo dõi", huỷ khi sửa điểm thành đạt. Có kết quả tuần rồi = việc thật.
 */
export const PA_QUY_CHE_CHUA_GHI = (a = 'iv') => `(${a}.preset = 1 AND ${a}.confirmed_by IS NULL AND ${a}.status IN ('planned', 'started')
  AND NOT EXISTS (SELECT 1 FROM case_followups f_qc WHERE f_qc.intervention_id = ${a}.id))`;

/**
 * Q28-5 (chủ sản phẩm 28/09): Case SINH TỪ SOS (có PA quy chế) chỉ "Đang xử lý" khi ĐÃ xác nhận nguyên nhân VÀ có một PA do
 * NGƯỜI xác nhận (PA quy chế đã bấm Xác nhận — `confirmed_by` có người — hoặc PA GV tự thêm), chưa huỷ. PA máy gán chưa ai xác
 * nhận không tính. `sc` là bí danh `sos_cases`. MỘT điều kiện cho hàm đồng bộ dưới đây và migrate PR-N1.
 */
export const LA_CASE_SOS = (sc = 'sc') =>
  `EXISTS (SELECT 1 FROM case_interventions p_s WHERE p_s.case_id = ${sc}.id AND p_s.preset = 1)`;
export const CASE_SOS_DANG_XU_LY = (sc = 'sc') => `(EXISTS (SELECT 1 FROM case_issues ci_s WHERE ci_s.case_id = ${sc}.id AND ci_s.role = 'primary')
  AND EXISTS (SELECT 1 FROM case_interventions p_x WHERE p_x.case_id = ${sc}.id AND p_x.status != 'cancelled'
               AND (COALESCE(p_x.preset, 0) = 0 OR p_x.confirmed_by IS NOT NULL)))`;

/**
 * Đặt lại "Chưa xử lý" / "Đang xử lý" của một Case chưa đóng sau mỗi việc có thể đổi trạng thái (thêm PA, ghi kết quả, xác nhận
 * PA quy chế, xác định nguyên nhân). Case GV tự báo: như cũ — có việc là Đang xử lý. Case từ SOS: theo `CASE_SOS_DANG_XU_LY`.
 * Đây là câu GHI duy nhất của mô-đun này.
 */
export function dongBoTrangThaiCase(caseId: number): void {
  const conn = db();
  const r = conn.prepare(`SELECT sc.status, CASE WHEN NOT ${LA_CASE_SOS()} OR ${CASE_SOS_DANG_XU_LY()} THEN 'in_progress' ELSE 'open' END AS moi
    FROM sos_cases sc WHERE sc.id = ?`).get(caseId) as any;
  if (!r || r.status === 'done' || r.status === r.moi) return;
  conn.prepare('UPDATE sos_cases SET status = ?, updated_at = ? WHERE id = ?').run(r.moi, new Date().toISOString(), caseId);
}

export type SosCaseState = {
  /** Case do SOS tự tạo: có (hoặc từng có) phương án điền sẵn. Case tạo tay và case Normal thì không. */
  fromSos: boolean;
  /** Đã có phân loại nguyên nhân (vấn đề chính). */
  hasCause: boolean;
  /**
   * `Chờ GVBM xác định nguyên nhân` (S04): case từ SOS đang mở mà chưa có nguyên nhân. PA theo quy chế tự chạy từ lúc tạo (PR-N1, S4-1)
   * nên không còn vế "PA chờ xác nhận". Chỉ số `case-cho-xac-dinh-nguyen-nhan` đếm đúng tập này.
   */
  awaitingCause: boolean;
  /** Hạn 3 ngày của S04 — chính là `verify_due` của tín hiệu nối case này. Chỉ có với case từ SOS. */
  dueOn: string | null;
  /** Đóng vì `Không cần theo dõi` (S05). */
  dismissed: { code: string; label: string; text: string | null } | null;
};

export function sosCaseState(caseId: number): SosCaseState {
  const conn = db();
  const c = conn.prepare('SELECT status, dismiss_reason_code, dismiss_reason_text FROM sos_cases WHERE id = ?').get(caseId) as any;
  const empty: SosCaseState = { fromSos: false, hasCause: false, awaitingCause: false, dueOn: null, dismissed: null };
  if (!c) return empty;
  const fromSos = !!conn.prepare('SELECT 1 FROM case_interventions WHERE case_id = ? AND preset = 1 LIMIT 1').get(caseId);
  const hasCause = !!conn.prepare("SELECT 1 FROM case_issues WHERE case_id = ? AND role = 'primary' LIMIT 1").get(caseId);
  const due = fromSos
    ? (conn.prepare(`SELECT MIN(verify_due) d FROM case_signals WHERE case_id = ? AND status = 'linked'`).get(caseId) as any)?.d ?? null
    : null;
  return {
    fromSos, hasCause,
    awaitingCause: fromSos && c.status !== 'done' && !hasCause,
    dueOn: due,
    dismissed: c.dismiss_reason_code
      ? { code: c.dismiss_reason_code, label: CASE_DISMISS_REASON_LABEL[c.dismiss_reason_code as CaseDismissReason] ?? c.dismiss_reason_code, text: c.dismiss_reason_text ?? null }
      : null,
  };
}

/** Trong tập case cho trước, những case đang `Chờ GVBM xác định nguyên nhân` (một truy vấn cho cả tập, không hỏi từng case). */
export function awaitingCauseCaseIds(caseIds: number[]): number[] {
  const out: number[] = [];
  for (let i = 0; i < caseIds.length; i += 400) {
    const chunk = caseIds.slice(i, i + 400);
    out.push(...(db()
      .prepare(
        `SELECT sc.id FROM sos_cases sc
          WHERE sc.id IN (${chunk.map(() => '?').join(',')}) AND sc.status != 'done'
            AND EXISTS (SELECT 1 FROM case_interventions p WHERE p.case_id = sc.id AND p.preset = 1)
            AND NOT EXISTS (SELECT 1 FROM case_issues ci WHERE ci.case_id = sc.id AND ci.role = 'primary')
          ORDER BY sc.id`,
      )
      .all(...chunk) as any[]).map((r) => r.id as number));
  }
  return out;
}
