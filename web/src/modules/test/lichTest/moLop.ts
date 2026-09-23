/**
 * LỚP NÀO ĐANG MỞ ở Lịch Test (PR-UX1 Q8). Mặc định theo `moSan` của máy chủ (GV: lớp còn bài của mình; QL: lớp còn
 * bài). Người xem đã tự bấm mở/thu lớp nào thì trình duyệt nhớ theo TUẦN, lần sau theo đó. `epMo` = lớp mở vì một lối
 * vào cụ thể (đường dẫn `classId`, bấm ô của dải số) — bấm thu lại thì thôi ép.
 */
const khoa = (periodId: number) => `lich-test-mo:${periodId}`;

export function docMo(periodId: number): Record<string, boolean> {
  try { return JSON.parse(localStorage.getItem(khoa(periodId)) ?? '{}') ?? {}; } catch { return {}; }
}

export function ghiMo(periodId: number, v: Record<string, boolean>) {
  try { localStorage.setItem(khoa(periodId), JSON.stringify(v)); } catch { /* chế độ riêng tư: bỏ qua */ }
}

export const dangMo = (lop: { key: string; moSan: boolean }, nho: Record<string, boolean>, epMo: ReadonlySet<string>) =>
  epMo.has(lop.key) || (lop.key in nho ? nho[lop.key] : lop.moSan);
