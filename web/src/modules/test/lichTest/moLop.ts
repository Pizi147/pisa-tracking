/**
 * LỚP NÀO ĐANG MỞ ở Lịch Test (PR-UX1 Q8). Mặc định theo `moSan` của máy chủ (GV: lớp còn bài của mình; QL: lớp còn
 * bài). Người xem đã tự bấm mở/thu lớp nào thì trình duyệt nhớ theo TUẦN, lần sau theo đó. `epMo` = lớp mở vì một lối
 * vào cụ thể (đường dẫn `classId`, bấm ô của dải số) — bấm thu lại thì thôi ép. Khoá kèm người dùng: hai người dùng
 * chung một máy không lẫn lớp đã mở của nhau (rà #92). PR-LT3: khoá hàng = `khoaHang` (kèm tuần thi của hàng) — hàng khối 2 và
 * khối 3 cùng lớp không lẫn nhau.
 */
const khoa = (userId: number | null, periodId: number) => `lich-test-mo:${userId ?? 0}:${periodId}`;

export function docMo(userId: number | null, periodId: number): Record<string, boolean> {
  try { return JSON.parse(localStorage.getItem(khoa(userId, periodId)) ?? '{}') ?? {}; } catch { return {}; }
}

export function ghiMo(userId: number | null, periodId: number, v: Record<string, boolean>) {
  try { localStorage.setItem(khoa(userId, periodId), JSON.stringify(v)); } catch { /* chế độ riêng tư: bỏ qua */ }
}

export const dangMo = (lop: { key: string; moSan: boolean }, nho: Record<string, boolean>, epMo: ReadonlySet<string>) =>
  epMo.has(lop.key) || (lop.key in nho ? nho[lop.key] : lop.moSan);
