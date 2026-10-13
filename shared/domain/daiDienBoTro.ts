/**
 * PR-SO (D2): PA bổ trợ chung gộp MỘT dòng mỗi nhóm `nhom_bo_tro`. Tổng quan (`pa-can-cap-nhat`) và Công việc ("Ghi kết quả PA")
 * cùng gọi hàm này SAU khi lọc phạm vi/quyền, nên cùng chọn một PA và cùng nói "quá hạn".
 * Đại diện = `action_due` sớm nhất (null xếp cuối), hoà thì `id` nhỏ nhất. Dòng không thuộc nhóm giữ nguyên; thứ tự giữ như đầu vào.
 * OV-11c (CV-4): nhóm bổ trợ MIỄN PHÍ (`bo_tro_mien_phi`) cũng là một nhóm; `boDaiDien(đại diện)` đúng → bỏ dòng Kết quả của nhóm (nhóm có Mini Test chờ
 * ở lần ghi cuối: việc là MỘT dòng "Ghi Mini Test", cùng form Kết quả cuối — `boKetQuaChoMiniTest`).
 */
export const laPaBoTro = (kind: string) => kind === 'bo_tro' || kind === 'bo_tro_mien_phi';
export function daiDienNhomBoTro<T extends { id: number; kind: string; nhom_bo_tro: string | null; action_due: string | null }>(
  rows: readonly T[], boDaiDien?: (daiDien: T) => boolean,
): T[] {
  const chon = new Map<string, T>();
  for (const r of rows) {
    if (!laPaBoTro(r.kind) || !r.nhom_bo_tro) continue;
    const c = chon.get(r.nhom_bo_tro);
    const han = r.action_due ?? '￿', hanC = c?.action_due ?? '￿';
    if (!c || han < hanC || (han === hanC && r.id < c.id)) chon.set(r.nhom_bo_tro, r);
  }
  return rows.filter((r) => !laPaBoTro(r.kind) || !r.nhom_bo_tro
    || (chon.get(r.nhom_bo_tro) === r && !boDaiDien?.(r)));
}
