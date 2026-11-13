import { DS_JSON, db, theoLoJson } from '../db.ts';
import { phanCongDangHieuLuc } from '../worklist/scoreDebt.ts';
import { activeAt, phanCongDaNap } from '../permissions.ts';
import { nhomChung } from './boTro.ts';

/** Một PA đủ để tìm người giữ việc Kết quả. `classId` = lớp HIỆN TẠI của em trước, lớp của lượt sau (`LOP_CUA_CASE`). */
export type DongGiuKetQua = {
  id: number; topic: string | null; nhomBoTro: string | null; classId: number | null; ownerUserId: number | null;
  /** Người dạy của nhóm `mt:` đã đọc sẵn trong câu của nơi gọi (`NGUOI_DAY_NHOM`) — có thì không hỏi lại. */
  nguoiDay?: number | null;
};

/** Câu con: Người dạy của nhóm `cot` (cùng luật `nguoiDayNhom`) — cho câu đã đọc nhóm `mt:` (Mini Test), khỏi thêm câu. */
export const NGUOI_DAY_NHOM = (cot: string) => `(SELECT iv.performer_user_id FROM case_interventions iv WHERE iv.nhom_bo_tro = ${cot} AND iv.kind = 'bo_tro_mien_phi'
  AND iv.status IN ('planned', 'started') AND iv.performer_user_id IS NOT NULL ORDER BY iv.id LIMIT 1)`;

/**
 * GV-CU-BO-TRO (chủ SP 13/11, A): PA Bổ trợ miễn phí sau Final — Người dạy (GV cũ) giữ việc; GVCN lớp mới theo dõi, làm thay. Người dạy của mỗi nhóm `mt:`
 * = tài khoản trên PA ĐANG CHẠY đầu tiên (id nhỏ) của nhóm — MỘT người cho cả nhóm (FOU hai môn hai GV cũ: ghi một lần cho cả nhóm), PA đã khép / huỷ thì hết (về GVCN). Một câu mỗi lô nhóm (`idx_ci_nhom_bo_tro`); không có nhóm `mt:` thì không câu nào.
 */
export function nguoiDayNhom(nhom: readonly (string | null | undefined)[]): Map<string, number> {
  const ds = [...new Set(nhom.filter((x): x is string => !!x?.startsWith('mt:')))];
  const out = new Map<string, number>();
  theoLoJson(ds, (json) => {
    for (const r of db().prepare(`SELECT nhom_bo_tro, performer_user_id FROM case_interventions WHERE nhom_bo_tro IN (${DS_JSON}) AND kind = 'bo_tro_mien_phi'
        AND status IN ('planned', 'started') AND performer_user_id IS NOT NULL ORDER BY id`).all(json) as any[]) if (!out.has(r.nhom_bo_tro)) out.set(r.nhom_bo_tro, r.performer_user_id);
  });
  return out;
}

/**
 * PR-PA (§8): NGƯỜI GIỮ việc "Kết quả" của mỗi PA — một luật cho Công việc, chỉ số `pa-can-cap-nhat` và quyền ghi.
 * PA Bổ trợ miễn phí (`mt:{lượt}`) có Người dạy là tài khoản → Người dạy (GV-CU-BO-TRO, thay PR-CT2).
 * Case `tong_hop` / PA Bổ trợ nhóm chung (`gk:{lượt}`, miễn phí `mt:{lượt}` không Người dạy — như `quyenBoTro`, M-03) → GVCN lớp hiện tại; còn lại → GVBM đúng môn ở lớp hiện tại (phân công
 * đang hiệu lực, `writing1/2` → `writing` khi lớp không phân công riêng W1/W2); không có → chủ Case. Theo lô: tối đa hai câu mỗi lô lớp.
 */
export function nguoiGiuKetQua(rows: readonly DongGiuKetQua[], ngay: string): Map<number, number | null> {
  const chung = (r: DongGiuKetQua) => r.topic === 'tong_hop' || (!!r.nhomBoTro && nhomChung(r.nhomBoTro));
  const lop = (ds: readonly DongGiuKetQua[]) => [...new Set(ds.map((r) => r.classId).filter((x): x is number => x != null))];
  const gvbm = phanCongDangHieuLuc(lop(rows.filter((r) => !chung(r))), ngay);
  const gvcn = new Map<number, number>();
  const day = nguoiDayNhom(rows.filter((r) => r.nguoiDay === undefined).map((r) => r.nhomBoTro));
  const da = phanCongDaNap(), lopChung = new Set(lop(rows.filter(chung)));
  if (da) {
    for (const r of da) if (r.isCore && activeAt(r, ngay) && lopChung.has(r.classId) && !gvcn.has(r.classId)) gvcn.set(r.classId, r.userId);
  } else theoLoJson([...lopChung], (json) => {
    for (const r of db()
      .prepare(`SELECT class_id, user_id FROM teacher_assignments WHERE class_id IN (${DS_JSON}) AND is_core = 1 AND status = 'active'
                   AND effective_from <= ? AND (effective_to IS NULL OR effective_to >= ?) ORDER BY id`)
      .all(json, ngay, ngay) as any[]) if (!gvcn.has(r.class_id)) gvcn.set(r.class_id, r.user_id);
  });
  const mon = (r: DongGiuKetQua) => gvbm.get(`${r.classId}|${r.topic}`)?.userId
    ?? (r.topic === 'writing1' || r.topic === 'writing2' ? gvbm.get(`${r.classId}|writing`)?.userId : undefined);
  return new Map(rows.map((r) => [r.id, ((r.nguoiDay !== undefined ? r.nguoiDay ?? undefined : r.nhomBoTro ? day.get(r.nhomBoTro) : undefined)
    ?? (r.classId == null ? undefined : chung(r) ? gvcn.get(r.classId) : mon(r))) ?? r.ownerUserId ?? null]));
}
