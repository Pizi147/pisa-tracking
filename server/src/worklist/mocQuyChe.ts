/**
 * Việc `moc:` (PR-SOS K3-14, Q8): PA theo quy chế đang chạy mà CHƯA CÓ MỐC — "Xếp lịch MTn" / "Nhập dự kiến thi" của Head. Tách khỏi `mywork.ts` (LPB-1) để
 * khung việc "Xếp lịch MT" (panel, quyền, quét ngày) đọc CÙNG câu, cùng luật với Công việc.
 */
import { CASE_SAU_THI_SQL, HV_DANG_HOC_SQL } from '../students/tamDung.ts';
import { LUOT_HUY_HET_SQL, LUOT_MT_DA_CO_SQL, thieuMt } from '../../../shared/domain/index.ts';
import { lichMtCua } from '../classes/schedule.ts';

export const SQL_MOC = `SELECT iv.id, iv.case_id, iv.moc_quy_che, COALESCE(sc.student_id, a.student_id) AS sid, s.full_name,
              COALESCE(a.class_id, cur.class_id) AS class_id, COALESCE(ac.code, cc.code) AS class_code,
              COALESCE(ac.branch_id, cc.branch_id) AS branch_id, a.attempt_no, a.cycle_id, iv.bo_qua_moc, iv.bo_qua_luc, ub.full_name AS bo_qua_ten,
              cc.lich_mt AS lop_lich_mt, cc.route AS lop_route, lc.route,   -- XEP-MT-NHAC: thieuMt (lịch lớp đang học, như danhSachLop)
              (SELECT COUNT(*) FROM assessment_attempts x WHERE x.cycle_id = lc.id AND ${LUOT_MT_DA_CO_SQL('x')}) AS so_mt_co,
              ${CASE_SAU_THI_SQL('sc', 's.id')} AS sau_thi   -- N46: không thành việc; vẫn điền mốc (dienMocQuyChe đọc cùng câu)
         FROM case_interventions iv JOIN sos_cases sc ON sc.id = iv.case_id
         LEFT JOIN assessment_attempts a ON a.id = sc.attempt_id
         LEFT JOIN students s ON s.id = COALESCE(sc.student_id, a.student_id)
         LEFT JOIN enrollments cur ON cur.student_id = s.id AND cur.status = 'active'
         LEFT JOIN classes ac ON ac.id = a.class_id
         LEFT JOIN classes cc ON cc.id = cur.class_id
         LEFT JOIN users ub ON ub.id = iv.bo_qua_boi
         LEFT JOIN learning_cycles lc ON lc.id = a.cycle_id   -- cùng lộ trình với điều kiện MT sau (nx.cycle_id = a.cycle_id)
        WHERE iv.preset = 1 AND iv.status = 'started' AND iv.followup_due IS NULL AND iv.moc_quy_che IN ('until_next_mt', 'until_exam')
          AND sc.status != 'done' AND ${HV_DANG_HOC_SQL('s')}
          /* MT-HUY-XONG (chủ SP 05/11): MT sau đã huỷ hết (vắng / ngoài phạm vi) = đợt kết thúc — không nhắc Head xếp lại; Head vẫn tự xếp được.
             XEP-MT-NHAC (chủ SP 07/11): MT sau Head chủ động xoá cũng vậy — xoá rồi thì thôi (LUOT_HUY_HET_SQL gồm cả MT đã xoá). */
          AND NOT EXISTS (SELECT 1 FROM assessment_attempts nx WHERE nx.cycle_id = a.cycle_id AND nx.attempt_no > a.attempt_no
                            AND nx.status != 'cancelled' AND ${LUOT_HUY_HET_SQL('nx')})
`;

/** Chữ của việc `moc:` + `dau` = mốc đang thiếu (`mt{n}` | `thi`) — bỏ qua ghi mốc này; mốc khác thì việc hiện lại. */
export function viecMoc(r: { moc_quy_che: string; attempt_no: number | null; full_name: string | null }) {
  const thi = r.moc_quy_che === 'until_exam';
  const n = (r.attempt_no ?? 0) + 1;
  const ten = r.full_name ?? 'Học viên';
  return {
    thi, dau: thi ? 'thi' : `mt${n}`,
    reason: `PA theo quy chế ${thi ? 'đến lúc thi' : `đến MT${n}`} đang chạy nhưng chưa có ${thi ? 'ngày thi' : 'lịch'}`,
    tieuDe: thi ? `Nhập dự kiến thi · ${ten}` : `Xếp lịch MT${n} cho ${ten}`,
    phu: thi ? 'Nhập dự kiến thi' : `Xếp lịch MT${n}`,
  };
}

/** Dòng `SQL_MOC` còn là việc "Xếp lịch MT" (không "Nhập dự kiến thi"): chưa có KQ thi thật, lộ trình còn thiếu MT, Head chưa bỏ qua mốc này — cùng luật dòng Công việc. */
export const conXepLichMt = (r: any): boolean => {
  const v = viecMoc(r);
  return !r.sau_thi && !v.thi && thieuMt(r.so_mt_co, lichMtCua({ lich_mt: r.lop_lich_mt, route: r.lop_route }, r.route).length) && r.bo_qua_moc !== v.dau;
};
