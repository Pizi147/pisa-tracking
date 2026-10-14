/**
 * PR-EN — NHỚ NGÔN NGỮ: máy (`localStorage`, đọc trước khi vẽ ở `index.html`) + tài khoản (`users.ngon_ngu`, máy chủ).
 * Đổi tiếng = lưu + tải lại trang (hằng nhãn tính lúc nạp mô-đun — tải lại là đúng và đơn giản nhất, E1 kế hoạch).
 */
import { NGON_NGU, NGON_NGU_KHOA, laNgonNgu, t, type NgonNgu } from '@shared/i18n/index.ts';
import { api } from './api.ts';
import { coPanelDangSua } from '../ui/KhungPanel.tsx';

/** Đã bấm chọn tiếng khi CHƯA đăng nhập (màn đăng nhập): lần đăng nhập kế, tài khoản theo lựa chọn này thay vì kéo máy về tiếng cũ của tài khoản. */
const VUA_CHON = 'pisa-ngon-ngu-vua-chon';

function luuMay(nn: NgonNgu): boolean {
  try { localStorage.setItem(NGON_NGU_KHOA, nn); return localStorage.getItem(NGON_NGU_KHOA) === nn; } catch { return false; }
}
const docMay = (): NgonNgu | null => { try { const v = localStorage.getItem(NGON_NGU_KHOA); return laNgonNgu(v) ? v : null; } catch { return null; } };

/** Bấm VI | EN. Panel đang sửa dở → hỏi trước (tải lại trang mất chữ đang gõ). Lưu máy không được (chặn lưu trữ) → không tải lại. */
export async function doiNgonNgu(nn: NgonNgu, daDangNhap: boolean): Promise<void> {
  if (nn === NGON_NGU) return;
  if (coPanelDangSua() && !window.confirm(t('Đang sửa dở — đổi ngôn ngữ sẽ tải lại trang và mất phần chưa lưu. Vẫn đổi?'))) return;
  if (!luuMay(nn)) return;
  if (daDangNhap) await api.patch('/me/profile', { ngonNgu: nn }).catch(() => { /* tài khoản lưu lần sau (đồng bộ lúc tải phiên) */ });
  else try { sessionStorage.setItem(VUA_CHON, '1'); } catch { /* không sao: tài khoản giữ tiếng cũ */ }
  location.reload();
}

/**
 * Sau khi tải phiên đã đăng nhập: vừa chọn ở màn đăng nhập hoặc tài khoản chưa chọn → gửi lựa chọn của máy lên tài khoản;
 * tài khoản đã chọn khác máy → máy theo tài khoản, tải lại MỘT lần (lưu máy không được thì thôi — không lặp tải lại).
 */
export function dongBoNgonNgu(cuaTaiKhoan: string | null | undefined): void {
  let vuaChon = false;
  try { vuaChon = sessionStorage.getItem(VUA_CHON) === '1'; sessionStorage.removeItem(VUA_CHON); } catch { /* bỏ qua */ }
  const may = docMay();
  if ((vuaChon || !laNgonNgu(cuaTaiKhoan)) && may) {
    if (may !== cuaTaiKhoan) void api.patch('/me/profile', { ngonNgu: may }).catch(() => {});
    return;
  }
  if (laNgonNgu(cuaTaiKhoan) && cuaTaiKhoan !== NGON_NGU && luuMay(cuaTaiKhoan)) location.reload();
}
