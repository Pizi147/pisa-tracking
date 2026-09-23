import type { NextFunction, Request, Response } from 'express';
import crypto from 'node:crypto';
import { db, laLoiMatLuongTurso } from './db.ts';
import { loadPrincipal, type Principal } from './permissions.ts';
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

export function resolveSession(token: string | undefined): Principal | null {
  if (!token) return null;
  /*
   * AN-6 (PR-AN, quyết định 4.11): phiên chỉ có hiệu lực cho tài khoản ĐÃ DUYỆT và đang hoạt động. Hôm nay chỉ đường đăng nhập
   * phát phiên và nó đã từ chối tài khoản chờ duyệt — lớp này để một đường phát phiên thêm sau này không mở cửa cho họ.
   * Một câu JOIN, không thêm lượt hỏi database.
   */
  const row = db()
    .prepare(
      `SELECT s.*, u.approval_state, u.status AS user_status FROM demo_sessions s
         JOIN users u ON u.id = s.user_id WHERE s.token = ?`,
    )
    .get(token) as any;
  if (!row) return null;
  const hetHan = !(Date.now() - Date.parse(row.last_seen_at ?? row.created_at) <= PHIEN_HET_HAN_SAU_NGAY * 86_400_000);
  /* Quá hạn, hoặc tài khoản không còn được vào → coi như chưa đăng nhập, và xoá luôn dòng phiên (mã đó không dùng lại được). */
  if (hetHan || row.approval_state !== 'approved' || row.user_status !== 'active') {
    db().prepare('DELETE FROM demo_sessions WHERE token = ?').run(token);
    return null;
  }
  db().prepare('UPDATE demo_sessions SET last_seen_at = ? WHERE token = ?').run(nowIso(), token);
  return loadPrincipal(row.user_id);
}

export function attachPrincipal(req: Request, _res: Response, next: NextFunction) {
  const token = req.cookies?.[SESSION_COOKIE] as string | undefined;
  try {
    const principal = resolveSession(token);
    if (principal) {
      req.principal = principal;
      req.sessionToken = token;
    }
  } catch (e) {
    /* PR-Z2c-b: mất luồng Turso KHÔNG phải "chưa đăng nhập" — nuốt đi là người dùng bị đẩy ra màn đăng nhập. Đưa sang bộ thử lại. */
    if (laLoiMatLuongTurso(e)) { next(e); return; }
    /* session trỏ tới user đã bị xoá sau khi reset seed */
  }
  next();
}

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  if (!req.principal) {
    next(new HttpError(401, 'Chưa chọn tài khoản demo. Chọn một tài khoản ở thanh Công cụ demo.'));
    return;
  }
  next();
}

export function principalOf(req: Request): Principal {
  if (!req.principal) throw new HttpError(401, 'Chưa đăng nhập.');
  return req.principal;
}
