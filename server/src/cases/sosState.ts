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

export type SosCaseState = {
  /** Case do SOS tự tạo: có (hoặc từng có) phương án điền sẵn. Case tạo tay và case Normal thì không. */
  fromSos: boolean;
  /** Đã có phân loại nguyên nhân (vấn đề chính). */
  hasCause: boolean;
  /** Phương án điền sẵn còn chờ xác nhận (nếu có). */
  unconfirmedPlanId: number | null;
  /**
   * `Chờ GVBM xác định nguyên nhân` (S04): case từ SOS đang mở mà chưa có nguyên nhân HOẶC còn phương án điền sẵn chưa xác nhận.
   * Chỉ số `case-cho-xac-dinh-nguyen-nhan` đếm đúng tập này.
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
  const empty: SosCaseState = { fromSos: false, hasCause: false, unconfirmedPlanId: null, awaitingCause: false, dueOn: null, dismissed: null };
  if (!c) return empty;
  const fromSos = !!conn.prepare('SELECT 1 FROM case_interventions WHERE case_id = ? AND preset = 1 LIMIT 1').get(caseId);
  const hasCause = !!conn.prepare("SELECT 1 FROM case_issues WHERE case_id = ? AND role = 'primary' LIMIT 1").get(caseId);
  const unconfirmed = conn
    .prepare(`SELECT id FROM case_interventions iv WHERE iv.case_id = ? AND ${UNCONFIRMED_PRESET('iv')} AND iv.status = 'planned' ORDER BY id LIMIT 1`)
    .get(caseId) as any;
  const due = fromSos
    ? (conn.prepare(`SELECT MIN(verify_due) d FROM case_signals WHERE case_id = ? AND status = 'linked'`).get(caseId) as any)?.d ?? null
    : null;
  return {
    fromSos, hasCause,
    unconfirmedPlanId: unconfirmed?.id ?? null,
    awaitingCause: fromSos && c.status !== 'done' && (!hasCause || !!unconfirmed),
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
            AND (NOT EXISTS (SELECT 1 FROM case_issues ci WHERE ci.case_id = sc.id AND ci.role = 'primary')
                 OR EXISTS (SELECT 1 FROM case_interventions u WHERE u.case_id = sc.id AND ${UNCONFIRMED_PRESET('u')} AND u.status = 'planned'))
          ORDER BY sc.id`,
      )
      .all(...chunk) as any[]).map((r) => r.id as number));
  }
  return out;
}
