import crypto from 'node:crypto';
import type { Request } from 'express';
import { db } from '../db.ts';
import { laBanChinh } from '../moiTruong.ts';
import { HttpError, loi } from '../util.ts';
import { dichSang, type Khoa } from '../../../shared/i18n/index.ts';

/**
 * GIỚI HẠN SỐ LẦN THỬ — AN-1 (quyết định 4.11, 22/09/2026: giữ `/auth/register`, tài khoản phải QTHT duyệt, thêm giới hạn).
 *
 * Đếm ở database (bảng `auth_attempts`), không đếm trong bộ nhớ: trên Netlify mỗi lần gọi có thể là một bản hàm khác, và bản hàm
 * nguội là mất sạch. Chỉ lưu MÃ BĂM của email/IP, dòng quá 24 giờ bị xoá mỗi khi ghi lần mới.
 *
 * Ngưỡng (plan PR-AN Q2): IP để rộng vì cả một chi nhánh dùng chung một wifi — ngày mở tài khoản cả nhóm giáo viên đăng ký cùng lúc.
 * PR-Z2c: đăng ký nâng 10 → 30 lần/giờ/IP (một chi nhánh đông giáo viên đăng ký cùng buổi vẫn đủ).
 */
export type LoaiThu = 'dang_nhap_email' | 'dang_nhap_ip' | 'dang_ky_ip';

export const GIOI_HAN: Record<LoaiThu, { soLan: number; phut: number }> = {
  dang_nhap_email: { soLan: 5, phut: 15 },
  dang_nhap_ip: { soLan: 30, phut: 15 },
  dang_ky_ip: { soLan: 30, phut: 60 },
};
export const GIU_DONG_GIO = 24;

/* PR-EN: câu có biến mang khoá (`khoa`) để web tiếng Anh dịch — `chanNeuBiKhoa` gửi kèm. */
const coKhoa = (khoa: Khoa) => Object.assign((phut: number) => dichSang('vi', khoa, { phut }), { khoa });
export const cauKhoaDangNhap = coKhoa('Đăng nhập sai quá nhiều lần. Thử lại sau {phut} phút.');
/** PR-Z2c: khoá theo IP nói rõ là cả MẠNG bị khoá — người gõ đúng mật khẩu biết không phải lỗi của mình. */
export const cauKhoaDangNhapIp = coKhoa('Có quá nhiều lần đăng nhập sai từ mạng này. Thử lại sau {phut} phút.');
export const cauKhoaDangKy = coKhoa('Đã gửi quá nhiều đăng ký trong một giờ. Thử lại sau {phut} phút.');

/** Mã băm cố định của một email (đã chuẩn hoá) hoặc một IP. Không đảo ngược được; cùng đầu vào cho cùng mã. */
export function bam(giaTri: string): string {
  return crypto.createHash('sha256').update('pisa-an1:' + giaTri).digest('hex');
}

/**
 * IP người gửi. Bản chính: header `x-nf-client-connection-ip` do Netlify ghi, thiếu thì `client-ip` (Netlify cũng ghi — PR-Z2c).
 * KHÔNG tin `x-forwarded-for` — người gửi tự đặt được. Máy dev: địa chỉ socket.
 * Không ra IP nào → 'khong-ro' (mọi yêu cầu như vậy dùng chung một ô đếm), cảnh báo vào log MỘT lần mỗi yêu cầu — chỉ method + đường dẫn.
 */
const daCanhBaoIp = new WeakSet<object>();
export function ipCua(req: Request): string {
  if (laBanChinh()) {
    for (const ten of ['x-nf-client-connection-ip', 'client-ip']) {
      const h = req.headers[ten];
      const v = Array.isArray(h) ? h[0] : h;
      if (v && v.trim()) return v.trim();
    }
  }
  const ip = req.socket?.remoteAddress;
  if (ip) return ip;
  if (!daCanhBaoIp.has(req)) {
    daCanhBaoIp.add(req);
    console.warn(`[gioi-han] Không xác định được IP người gửi (${req.method} ${req.originalUrl ?? req.path}) — dùng ô đếm chung "khong-ro".`);
  }
  return 'khong-ro';
}

/** Còn bị khoá bao nhiêu phút (làm tròn lên, ít nhất 1); `null` = không bị khoá. */
export function phutConKhoa(loai: LoaiThu, giaTri: string, bayGio: number = Date.now()): number | null {
  const { soLan, phut } = GIOI_HAN[loai];
  const tu = new Date(bayGio - phut * 60_000).toISOString();
  const r = db()
    .prepare('SELECT COUNT(*) AS n, MIN(at) AS dau FROM auth_attempts WHERE kind = ? AND key_hash = ? AND at > ?')
    .get(loai, bam(giaTri), tu) as any;
  if (!r || Number(r.n) < soLan) return null;
  const hetKhoa = Date.parse(r.dau) + phut * 60_000;
  return Math.max(1, Math.ceil((hetKhoa - bayGio) / 60_000));
}

/** Ghi một lần thử; tiện tay xoá mọi dòng quá GIU_DONG_GIO giờ. */
export function ghiLanThu(loai: LoaiThu, giaTri: string, bayGio: number = Date.now()): void {
  const conn = db();
  conn.prepare('DELETE FROM auth_attempts WHERE at < ?').run(new Date(bayGio - GIU_DONG_GIO * 3_600_000).toISOString());
  conn.prepare('INSERT INTO auth_attempts (kind, key_hash, at) VALUES (?,?,?)').run(loai, bam(giaTri), new Date(bayGio).toISOString());
}

export function xoaLanThu(loai: LoaiThu, giaTri: string): void {
  db().prepare('DELETE FROM auth_attempts WHERE kind = ? AND key_hash = ?').run(loai, bam(giaTri));
}

/** Đang bị khoá → ném 429 với câu `cau(số phút)`. Lần thử lúc đang khoá KHÔNG được ghi (khoá không tự kéo dài). */
export function chanNeuBiKhoa(loai: LoaiThu, giaTri: string, cau: ((phut: number) => string) & { khoa?: Khoa }, bayGio: number = Date.now()): void {
  const p = phutConKhoa(loai, giaTri, bayGio);
  if (p !== null) throw cau.khoa ? loi(429, cau.khoa, { phut: p }) : new HttpError(429, cau(p));
}
