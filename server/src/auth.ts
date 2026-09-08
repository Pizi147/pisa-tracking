import type { NextFunction, Request, Response } from 'express';
import crypto from 'node:crypto';
import { db } from './db.ts';
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

export function resolveSession(token: string | undefined): Principal | null {
  if (!token) return null;
  const row = db().prepare('SELECT * FROM demo_sessions WHERE token = ?').get(token) as any;
  if (!row) return null;
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
  } catch {
    /* session trỏ tới user đã bị xoá sau khi reset seed */
  }
  next();
}

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  if (!req.principal) {
    next(new HttpError(401, 'Chưa chọn tài khoản demo. Hãy chọn một tài khoản ở thanh Công cụ demo.'));
    return;
  }
  next();
}

export function principalOf(req: Request): Principal {
  if (!req.principal) throw new HttpError(401, 'Chưa đăng nhập.');
  return req.principal;
}
