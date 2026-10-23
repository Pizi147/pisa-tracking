/**
 * UI-HO-SO-LOP: `/classes/:id/roster` không còn `viecTiepTheo`. Phép kiểm cũ của luật `viecTiepCuaEm` đọc cùng luật qua `viecTiepTheoCuaLop`
 * (`viecHocVienTheoLop` — cách `classOverview` (badge) và Học viên & Lớp dựng việc của em).
 */
import type { Principal } from '../permissions.ts';
import { viecTiepTheoCuaLop } from '../classes/viecTheoEm.ts';

/** Việc tiếp theo của từng em đang học lớp `classId`, theo người xem `p`. */
export function viecTiepLop(p: Principal, classId: number): Map<number, any[]> {
  return new Map(Object.entries(viecTiepTheoCuaLop(p, classId).viecTiep).map(([id, v]) => [Number(id), v as any[]]));
}
