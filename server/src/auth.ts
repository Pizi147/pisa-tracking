import type { NextFunction, Request, Response } from 'express';
import crypto from 'node:crypto';
import { db } from './db.ts';
import { COT_PRINCIPAL, principalTuDong, type Principal } from './permissions.ts';
import { coTheDoiGocNhin } from '../../shared/domain/index.ts';
import { HttpError, nowIso } from './util.ts';

/**
 * Auth của bản demo: session do SERVER cấp, gắn với một seeded user.
 * Không đọc role/permission từ request. KHÔNG phải cơ chế bảo mật production.
 */
export const SESSION_COOKIE = 'pisa_demo_session';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      principal?: Principal;
      sessionToken?: string;
    }
  }
}

export function createSession(userId: number): string {
  const token = crypto.randomBytes(24).toString('hex');
  db().prepare('INSERT INTO demo_sessions (token, user_id, created_at, last_seen_at) VALUES (?,?,?,?)')
    .run(token, userId, nowIso(), nowIso());
  return token;
}

export function destroySession(token: string) {
  db().prepare('DELETE FROM demo_sessions WHERE token = ?').run(token);
}

/**
 * PHIÊN ĐĂNG NHẬP HẾT HẠN sau từng này ngày KHÔNG DÙNG (session planning chốt 22/09/2026). Tính theo GIỜ THẬT
 * (`last_seen_at` do `nowIso()` ghi), KHÔNG theo ngày demo — ngày demo có thể bị đặt lùi. Mỗi lần dùng phiên, mốc dùng cuối
 * được dời về bây giờ, nên người dùng đều đặn không bao giờ bị đẩy ra.
 */
export const PHIEN_HET_HAN_SAU_NGAY = 30;
/**
 * Mốc dùng cuối chỉ GHI LẠI khi đã cũ hơn từng này phút (PR-Z2c-d). Trước đây mọi lời gọi API đều ghi một dòng — một trang mở
 * 5–10 lời gọi song song là 5–10 lần ghi tranh khoá với người đang lưu điểm. Hạn 30 ngày lệch tối đa 10 phút, không ai thấy.
 */
export const GHI_LAI_MOC_DUNG_SAU_PHUT = 10;

export function resolveSession(token: string | undefined): Principal | null {
  if (!token) return null;
  /*
   * AN-6 (PR-AN, quyết định 4.11): phiên chỉ có hiệu lực cho tài khoản ĐÃ DUYỆT và đang hoạt động. Hôm nay chỉ đường đăng nhập
   * phát phiên và nó đã từ chối tài khoản chờ duyệt — lớp này để một đường phát phiên thêm sau này không mở cửa cho họ.
   * PR-TD2-d: cùng câu JOIN đó đọc luôn principal (`COT_PRINCIPAL`) — cả bước kiểm phiên là MỘT lượt hỏi database. Phiên không
   * hợp lệ thì phần principal đọc thừa và bỏ đi; không nhớ gì giữa các request.
   */
  const row = db()
    .prepare(
      `SELECT s.created_at, s.last_seen_at, s.goc_nhin, u.approval_state, u.status AS user_status, ${COT_PRINCIPAL}
         FROM demo_sessions s JOIN users u ON u.id = s.user_id WHERE s.token = ?`,
    )
    .get(token) as any;
  if (!row) return null;
  const hetHan = !(Date.now() - Date.parse(row.last_seen_at ?? row.created_at) <= PHIEN_HET_HAN_SAU_NGAY * 86_400_000);
  /* Quá hạn, hoặc tài khoản không còn được vào → coi như chưa đăng nhập, và xoá luôn dòng phiên (mã đó không dùng lại được). */
  if (hetHan || row.approval_state !== 'approved' || row.user_status !== 'active') {
    db().prepare('DELETE FROM demo_sessions WHERE token = ?').run(token);
    return null;
  }
  if (Date.now() - Date.parse(row.last_seen_at ?? row.created_at) > GHI_LAI_MOC_DUNG_SAU_PHUT * 60_000) {
    db().prepare('UPDATE demo_sessions SET last_seen_at = ? WHERE token = ?').run(nowIso(), token);
  }
  return apGocNhin(principalTuDong(row), row.goc_nhin ?? null);
}

/**
 * ĐỔI GÓC NHÌN (PR-OV2a, đặc tả OV mục 2): phiên đang chọn một vai → Principal CHỈ giữ grant của vai đó — mọi `can()` / `scopeFor()` phía
 * sau tự đúng quyền vai đó, không phải ẩn nút. Bỏ quyền cấp riêng; góc nhìn không phải Giáo viên thì bỏ cả phân công (QL kiêm GV xem như
 * QL thuần). Tài khoản không còn đủ điều kiện (bị gỡ vai đang chọn, còn một vai, không còn QL/Quản trị) → bỏ qua, về vai gốc.
 */
export function apGocNhin(p: Principal, gocNhin: string | null): Principal {
  const vaiGoc = p.roleKeys;
  /* Không ở góc nhìn nào → trả nguyên principal (không thêm trường): mọi chỗ đọc `p.vaiGoc ?? p.roleKeys`. */
  if (!gocNhin || !coTheDoiGocNhin(vaiGoc) || !vaiGoc.includes(gocNhin)) return p;
  return {
    ...p, gocNhin, vaiGoc, roleKeys: [gocNhin],
    grants: p.grants.filter((g) => g.roleKey === gocNhin),
    assignments: gocNhin === 'teacher' ? p.assignments : [],
    xemTam: gocNhin === 'teacher' ? p.xemTam : [],
  };
}

/** Ghi vai đang chọn vào phiên (null = về vai gốc). Kiểm điều kiện ở `PUT /session/goc-nhin`. */
export function datGocNhin(token: string, gocNhin: string | null) {
  db().prepare('UPDATE demo_sessions SET goc_nhin = ? WHERE token = ?').run(gocNhin, token);
}

/**
 * Cờ trên req: đã qua bước kiểm phiên, sắp vào đường API. Lỗi mất kết nối Turso TRƯỚC cờ này (trong resolveSession) thì chạy lại được
 * với mọi method — đường API chưa chạy; resolveSession chỉ có thể đã xoá phiên hết hạn / ghi mốc dùng, chạy lại vô hại (app.ts).
 */
export const DA_VAO_API = Symbol('daVaoDuongApi');

export function attachPrincipal(req: Request, _res: Response, next: NextFunction) {
  const token = req.cookies?.[SESSION_COOKIE] as string | undefined;
  try {
    const principal = resolveSession(token);
    if (principal) {
      req.principal = principal;
      req.sessionToken = token;
    }
  } catch (e) {
    /*
     * PR-PH (03/10): KHÔNG nuốt lỗi nào ở đây. Lỗi khi kiểm phiên là lỗi máy chủ/kết nối, không phải "chưa đăng nhập" —
     * nuốt đi thì requireAuth trả 401 "Đăng nhập lại" trong khi phiên vẫn tốt (tải lại trang là hết: lỗi chủ sản phẩm báo 03/10).
     * Mất luồng Turso → bộ thử lại (Z2c-b); 503 đang bận → đúng câu đó (Z2c-e); còn lại → 500 có mã (traLoiLoi).
     * User bị xoá đã được câu JOIN của resolveSession lọc, không cần nhánh nuốt.
     */
    next(e);
    return;
  }
  (req as Request & { [DA_VAO_API]?: true })[DA_VAO_API] = true;
  next();
}

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  if (!req.principal) {
    next(new HttpError(401, 'Chưa đăng nhập, hoặc phiên đăng nhập đã hết hạn. Đăng nhập lại.'));
    return;
  }
  next();
}

export function principalOf(req: Request): Principal {
  if (!req.principal) throw new HttpError(401, 'Chưa đăng nhập.');
  return req.principal;
}
