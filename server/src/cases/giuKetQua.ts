import { DS_JSON, db, theoLoJson } from '../db.ts';
import { phanCongDangHieuLuc } from '../worklist/scoreDebt.ts';
import { activeAt, phanCongDaNap } from '../permissions.ts';
import { nhomChung } from './boTro.ts';

/** Một PA đủ để tìm người giữ việc Kết quả. `classId` = lớp HIỆN TẠI của em trước, lớp của lượt sau (`LOP_CUA_CASE`). */
export type DongGiuKetQua = { id: number; topic: string | null; nhomBoTro: string | null; classId: number | null; ownerUserId: number | null };

/**
 * PR-PA (§8): NGƯỜI GIỮ việc "Kết quả" của mỗi PA — một luật cho Công việc, chỉ số `pa-can-cap-nhat` và quyền ghi.
 * Case `tong_hop` / PA Bổ trợ nhóm chung (`gk:{lượt}`, miễn phí `mt:{lượt}` — như `quyenBoTro`, M-03) → GVCN lớp hiện tại; còn lại → GVBM đúng môn ở lớp hiện tại (phân công
 * đang hiệu lực, `writing1/2` → `writing` khi lớp không phân công riêng W1/W2); không có → chủ Case. Theo lô: tối đa hai câu mỗi lô lớp.
 */
export function nguoiGiuKetQua(rows: readonly DongGiuKetQua[], ngay: string): Map<number, number | null> {
  const chung = (r: DongGiuKetQua) => r.topic === 'tong_hop' || (!!r.nhomBoTro && nhomChung(r.nhomBoTro));
  const lop = (ds: readonly DongGiuKetQua[]) => [...new Set(ds.map((r) => r.classId).filter((x): x is number => x != null))];
  const gvbm = phanCongDangHieuLuc(lop(rows.filter((r) => !chung(r))), ngay);
  const gvcn = new Map<number, number>();
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
  return new Map(rows.map((r) => [r.id, (r.classId == null ? undefined : chung(r) ? gvcn.get(r.classId) : mon(r)) ?? r.ownerUserId ?? null]));
}
