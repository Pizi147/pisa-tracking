/**
 * HỒ SƠ GIÁO VIÊN (PR-GV). Không luật số mới: mọi số gọi hàm đang có — `myWork`/`viecCuaNguoi` (việc), `scoreDebtCells`
 * (ô điểm nợ), `listCases` + `chiTietCaseMo` (Case), `phanTichLop` (kết quả lớp), `yeuCauCuaToi` (yêu cầu).
 */
import { demViecTheoNhom } from '../../../shared/domain/index.ts';
import type { Principal } from '../permissions.ts';
import { myWork, viecCuaNguoi } from '../worklist/mywork.ts';

/**
 * Khối "Việc đang có": chính mình → `myWork(p)` (không `tatCa`: đúng "việc của tôi"); người khác → `viecCuaNguoi` (đã kiểm quyền xem).
 * Cùng nguồn với Công việc nên số ở ô = số dòng khi bấm.
 */
export function viecCuaGv(p: Principal, gvId: number) {
  const items = p.userId === gvId ? myWork(p).items : viecCuaNguoi(p, gvId).items;
  return demViecTheoNhom(items);
}
