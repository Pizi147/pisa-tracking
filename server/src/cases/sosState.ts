import { THAM_SO_TOI_DA, db, theoLo } from '../db.ts';
import { CASE_DISMISS_REASON_LABEL, cotXuLy, hanThemPa, trangThaiCaseV4, type CaseDismissReason, type CotXuLy } from '../../../shared/domain/index.ts';

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
/**
 * OV-13a (rà #406): CASE THẬT = không phải Case tạm (`tam = 0`). Case tạm (lượt Mock FT chưa chốt) chỉ hiện ở hồ sơ HV / Ngăn Case / panel một em —
 * KHÔNG vào bất kỳ số đếm nào (Case mở, Đang làm, Thiếu PA, Tổng hợp, Tổng quan, Học viên & Lớp, hồ sơ lớp / GV, Danh sách Case). MỘT điều kiện cho mọi câu đếm.
 */
export const CASE_THAT = (sc = 'sc') => `${sc}.tam = 0`;

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
/* OV-9: Case nhẹ của em KCK (`kck = 1`) là Case từ SOS dù không có PA quy chế — vẫn chờ xác nhận nguyên nhân (không hạn); có nguyên nhân là đang xử lý. */
export const LA_CASE_SOS = (sc = 'sc') =>
  `((EXISTS (SELECT 1 FROM case_interventions p_s WHERE p_s.case_id = ${sc}.id AND p_s.preset = 1) OR ${sc}.kck = 1) AND COALESCE(${sc}.origin_kind, '') != 'chuyen_cap')`;   // PR-LT2b: Case Final Test không chờ nguyên nhân
/** OV-12c: Case theo lượt MOCK TEST (`sc.attempt_id` là lượt `mock`) — nguyên nhân lấy từ nhận xét + nhóm của ô, không có bước Xác nhận Case. */
export const LA_CASE_MT = (sc = 'sc') => `EXISTS (SELECT 1 FROM assessment_attempts a_mt WHERE a_mt.id = ${sc}.attempt_id AND a_mt.kind = 'mock')`;
export const CASE_SOS_DANG_XU_LY = (sc = 'sc') => `(EXISTS (SELECT 1 FROM case_issues ci_s WHERE ci_s.case_id = ${sc}.id AND ci_s.role = 'primary')
  AND (${sc}.kck = 1 OR EXISTS (SELECT 1 FROM case_interventions p_x WHERE p_x.case_id = ${sc}.id AND p_x.status != 'cancelled'
               AND (COALESCE(p_x.preset, 0) = 0 OR p_x.confirmed_by IS NOT NULL))))`;

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

/** `dongBoTrangThaiCase` cho NHIỀU Case theo lô (PR-CT2, Turso): một câu đọc + tối đa hai câu ghi mỗi lô, không theo số Case. Cùng điều kiện. */
export function dongBoTrangThaiCaseLo(caseIds: readonly number[]): void {
  const conn = db(), luc = new Date().toISOString();
  theoLo([...new Set(caseIds)], (lo, ph) => {
    const doi = conn.prepare(`SELECT sc.id, CASE WHEN NOT ${LA_CASE_SOS()} OR ${CASE_SOS_DANG_XU_LY()} THEN 'in_progress' ELSE 'open' END AS moi
      FROM sos_cases sc WHERE sc.id IN (${ph}) AND sc.status != 'done'`).all(...lo) as { id: number; moi: string }[];
    for (const st of ['in_progress', 'open']) {
      const ids = doi.filter((r) => r.moi === st).map((r) => r.id);
      if (ids.length) conn.prepare(`UPDATE sos_cases SET status = ?, updated_at = ? WHERE status NOT IN ('done', ?) AND id IN (${ids.map(() => '?').join(',')})`).run(st, luc, st, ...ids);
    }
  }, THAM_SO_TOI_DA - 3);
}

export type SosCaseState = {
  /** Case do SOS tự tạo: có (hoặc từng có) phương án điền sẵn. Case tạo tay và Case Normal thì không. */
  fromSos: boolean;
  /** Đã có nhóm nguyên nhân (vấn đề chính). */
  hasCause: boolean;
  /** OV-12c: Case theo lượt Mock Test (`LA_CASE_MT`). */
  laMt: boolean;
  /** OV-12c: Case MT cũ (trước luật nhận xét bắt buộc) mà ô chưa có nhận xét — việc "Ghi nhận xét", không Báo QL, không chỉ số "chờ nguyên nhân". */
  choNhanXet: boolean;
  /**
   * `Chờ xác nhận Case` (S04, S4-2): Case từ SOS đang mở mà chưa có nguyên nhân — OV-12c: CHỈ Case không phải MT (Progress Test lớp thường,
   * Case nhẹ KCK lớp thường). PR-SOS: không tính khi đang có thẻ "Không cần theo dõi" chờ Quản lý duyệt (T23 — việc đã chuyển sang Quản lý).
   * Báo QL (`awaitingCauseCaseIds`) đếm đúng tập này; ô Tổng quan "Case chờ duyệt" nay theo `xuLyCaseMany` (OV-12d).
   */
  awaitingCause: boolean;
  /** Hạn Xác nhận nguyên nhân / Xác nhận PA — `sos_cases.han_xac_nhan` (`hanXacNhan`: 5 ngày, Gấp / SOS 3: 3). Chỉ có với Case từ SOS. */
  dueOn: string | null;
  /** Đóng vì `Không cần theo dõi` (S05). */
  dismissed: { code: string; label: string; text: string | null } | null;
  /** Thẻ "Không cần theo dõi" đang chờ Quản lý duyệt (S4-5) — `hanDuyet` là hạn của thẻ. */
  choDuyetKhongTheoDoi: { hanDuyet: string | null } | null;
  /** Còn PA quy chế chờ xác nhận (Q28-3). PR-LT2a: PA Bổ trợ KHÔNG tính (nó chạy khi Xác nhận Case, không có "Xác nhận PA"). */
  coPaChoXacNhan: boolean;
  /** OV-13a (Q2): Case tạm của lượt Mock FT chưa chốt ("Chờ chốt SOS") — không hạn / việc. */
  tam: boolean;
};

/** Điều kiện SQL "case `sc` đang có thẻ Không cần theo dõi chờ duyệt" — MỘT chỗ cho `awaitingCauseCaseIds` và thẻ Báo QL. */
export const CO_THE_KHONG_THEO_DOI = (sc = 'sc') => `EXISTS (SELECT 1 FROM yeu_cau_duyet y_k WHERE y_k.loai = 'khong_theo_doi'
  AND y_k.doi_tuong_loai = 'sos_case' AND y_k.doi_tuong_id = ${sc}.id AND y_k.trang_thai = 'cho')`;

const SOS_STATE_RONG: SosCaseState = { fromSos: false, hasCause: false, laMt: false, choNhanXet: false, awaitingCause: false, dueOn: null, dismissed: null, choDuyetKhongTheoDoi: null, coPaChoXacNhan: false, tam: false };

/** Trạng thái SOS của NHIỀU Case một lượt (PR-HVL): một câu SELECT cho mỗi lô 400, không hỏi từng Case. Case không tồn tại → trạng thái rỗng. */
export function sosCaseStateMany(caseIds: readonly number[]): Map<number, SosCaseState> {
  const out = new Map<number, SosCaseState>();
  const conn = db();
  for (let i = 0; i < caseIds.length; i += 400) {
    const chunk = caseIds.slice(i, i + 400);
    const rows = conn.prepare(`SELECT sc.id, sc.status, sc.dismiss_reason_code, sc.dismiss_reason_text, sc.han_xac_nhan, sc.tam,
      ${LA_CASE_SOS('sc')} AS from_sos, ${LA_CASE_MT('sc')} AS la_mt,
      EXISTS (SELECT 1 FROM case_issues WHERE case_id = sc.id AND role = 'primary') AS has_cause,
      EXISTS (SELECT 1 FROM case_interventions iv WHERE iv.case_id = sc.id AND ${UNCONFIRMED_PRESET('iv')} AND iv.status = 'planned' AND iv.kind != 'bo_tro') AS pa_cho,
      (SELECT y.han_duyet FROM yeu_cau_duyet y WHERE y.loai = 'khong_theo_doi' AND y.doi_tuong_loai = 'sos_case' AND y.doi_tuong_id = sc.id
          AND y.trang_thai = 'cho' ORDER BY y.id DESC LIMIT 1) AS han_the,
      ${CO_THE_KHONG_THEO_DOI('sc')} AS co_the
    FROM sos_cases sc WHERE sc.id IN (${chunk.map(() => '?').join(',')})`).all(...chunk) as any[];
    for (const c of rows) {
      const fromSos = !!c.from_sos;
      const hasCause = !!c.has_cause;
      const coThe = !!c.co_the && c.status !== 'done';
      const laMt = !!c.la_mt;
      const cho = fromSos && c.status !== 'done' && !hasCause && !coThe;
      out.set(c.id as number, {
        fromSos, hasCause, laMt,
        choNhanXet: cho && laMt,
        awaitingCause: cho && !laMt,
        dueOn: fromSos ? c.han_xac_nhan ?? null : null,
        dismissed: c.dismiss_reason_code
          ? { code: c.dismiss_reason_code, label: CASE_DISMISS_REASON_LABEL[c.dismiss_reason_code as CaseDismissReason] ?? c.dismiss_reason_code, text: c.dismiss_reason_text ?? null }
          : null,
        choDuyetKhongTheoDoi: coThe ? { hanDuyet: c.han_the ?? null } : null,
        coPaChoXacNhan: !!c.pa_cho && c.status !== 'done',
        tam: !!c.tam && c.status !== 'done',
      });
    }
  }
  return out;
}

/** Một Case — MỘT định nghĩa với `sosCaseStateMany`. */
export function sosCaseState(caseId: number): SosCaseState {
  return sosCaseStateMany([caseId]).get(caseId) ?? { ...SOS_STATE_RONG };
}

/** Trong tập Case cho trước, những Case đang `Chờ xác nhận Case` (một truy vấn cho cả tập, không hỏi từng Case). MỘT định nghĩa. OV-12c: không Case MT. */
export function awaitingCauseCaseIds(caseIds: number[]): number[] {
  const out: number[] = [];
  for (let i = 0; i < caseIds.length; i += 400) {
    const chunk = caseIds.slice(i, i + 400);
    out.push(...(db()
      .prepare(
        `SELECT sc.id FROM sos_cases sc
          WHERE sc.id IN (${chunk.map(() => '?').join(',')}) AND sc.status != 'done'
            AND ${LA_CASE_SOS('sc')} AND NOT ${LA_CASE_MT('sc')}
            AND NOT EXISTS (SELECT 1 FROM case_issues ci WHERE ci.case_id = sc.id AND ci.role = 'primary')
            AND NOT ${CO_THE_KHONG_THEO_DOI('sc')}
          ORDER BY sc.id`,
      )
      .all(...chunk) as any[]).map((r) => r.id as number));
  }
  return out;
}

/**
 * OV-12d: nhóm Xử lý (Chờ duyệt · Đang xử lý · xong / huỷ) — MỘT luật cho cột Tổng hợp và ô Tổng quan "Case chờ duyệt" / "quá hạn". `XU_LY_COT_SQL` là
 * các cột cần (bí danh `sc` = `sos_cases`) để nơi đã có câu SELECT riêng (Tổng hợp) ghép vào câu của mình, không thêm câu; `xuLyCuaDong` tính từ một dòng.
 * Trạng thái theo `trangThaiCaseV4` (cùng đầu vào `sosCaseStateMany`) + PA đang theo dõi (`cotXuLy`). `quaHan` (chỉ khi Chờ duyệt) = việc tiếp có hạn đã
 * qua: hạn Xác nhận Case / Ghi nhận xét / Xác nhận PA (`han_xac_nhan`), hoặc hạn Thêm PA (`hanThemPa`) khi Case chưa có PA nào.
 */
export const XU_LY_COT_SQL = `sc.id, sc.status, sc.han_xac_nhan, sc.dismiss_reason_code, sc.system_close_reason, sc.detected_at, sc.created_at, sc.urgency, sc.sos_level, sc.kck, sc.tam,
  ${LA_CASE_SOS('sc')} AS from_sos, ${LA_CASE_MT('sc')} AS la_mt,
  EXISTS (SELECT 1 FROM case_issues ci WHERE ci.case_id = sc.id AND ci.role = 'primary') AS has_cause,
  EXISTS (SELECT 1 FROM case_interventions iv WHERE iv.case_id = sc.id AND ${UNCONFIRMED_PRESET('iv')} AND iv.status = 'planned' AND iv.kind != 'bo_tro') AS pa_cho,
  EXISTS (SELECT 1 FROM case_interventions iv WHERE iv.case_id = sc.id AND iv.status != 'cancelled') AS co_pa,
  EXISTS (SELECT 1 FROM case_interventions iv WHERE iv.case_id = sc.id AND iv.status IN ('planned', 'started') AND ${NOT_UNCONFIRMED_PRESET('iv')}
    AND COALESCE(iv.approval_state, 'approved') = 'approved') AS pa_theo_doi,
  ${CO_THE_KHONG_THEO_DOI('sc')} AS co_the`;

export function xuLyCuaDong(r: any, homNay: string): { cot: CotXuLy; quaHan: boolean } {
  const tt = trangThaiCaseV4({
    status: r.status, fromSos: !!r.from_sos, hasCause: !!r.has_cause, laMt: !!r.la_mt, dismissed: !!r.dismiss_reason_code, systemClosed: !!r.system_close_reason,
    choDuyetKhongTheoDoi: !!r.co_the && r.status !== 'done', coPaChoXacNhan: !!r.pa_cho, hanXacNhan: r.han_xac_nhan ?? null, tam: !!r.tam,
  }, homNay);
  const cot = cotXuLy(tt.k, !!r.pa_theo_doi);
  const hanPa = tt.k === 'dang-lam' && !r.co_pa ? hanThemPa(r) : null;
  return { cot, quaHan: cot === 'choDuyet' && (tt.t === 'qua-han' || (!!hanPa && hanPa < homNay)) };
}

/** `xuLyCuaDong` cho NHIỀU Case — một câu mỗi lô (`theoLo`). */
export function xuLyCaseMany(caseIds: readonly number[], homNay: string): Map<number, { cot: CotXuLy; quaHan: boolean }> {
  const out = new Map<number, { cot: CotXuLy; quaHan: boolean }>();
  theoLo(caseIds, (lo, ph) => {
    for (const r of db().prepare(`SELECT ${XU_LY_COT_SQL} FROM sos_cases sc WHERE sc.id IN (${ph})`).all(...lo) as any[]) out.set(r.id as number, xuLyCuaDong(r, homNay));
  });
  return out;
}
