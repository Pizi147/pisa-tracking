/**
 * KHOÁ GỬI (PR-GVa, F01 = D13): MỘT mã cho MỖI LẦN MỞ FORM. Bấm đúp hay thử lại sau lỗi mạng gửi lại đúng mã đó, nên máy chủ trả
 * bản đã có thay vì ghi dòng thứ hai. Mở form lần mới thì có mã mới — hai việc cùng tiêu đề là hai việc, không bị gộp lặng lẽ.
 * Máy chủ gắn khoá với NGƯỜI TẠO: cùng mã từ người khác là một dòng khác, không đọc ra được dòng của người kia.
 */
const KHOA_HOP_LE = /^[A-Za-z0-9:_-]{8,100}$/;

/** Khoá hợp lệ: 8–100 ký tự [A-Za-z0-9:_-]. Không hợp lệ hoặc trống → null (máy chủ coi như không có khoá; không tin chuỗi lạ). */
export function chuanKhoaGui(x: unknown): string | null {
  if (typeof x !== 'string') return null;
  const s = x.trim();
  return KHOA_HOP_LE.test(s) ? s : null;
}

/** Mã mới cho MỘT lần mở form. `tien` = tên form, ví dụ 'mgmt', 'task', 'pa', 'fu'. */
export function moiKhoaGui(tien: string): string {
  const ngauNhien = new Uint32Array(2);
  globalThis.crypto.getRandomValues(ngauNhien);
  const t = tien.replace(/[^A-Za-z0-9_-]/g, '').slice(0, 20) || 'form';
  return `${t}-${Date.now().toString(36)}-${[...ngauNhien].map((n) => n.toString(36)).join('')}`;
}
