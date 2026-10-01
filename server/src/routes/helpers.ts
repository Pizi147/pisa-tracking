import type { Request, Response, NextFunction } from 'express';
import { scenarioMode } from '../demoConfig.ts';
import { HttpError, toInt } from '../util.ts';

/** Bọc handler async để lỗi đi vào error middleware. */
export const wrap =
  (fn: (req: Request, res: Response) => unknown | Promise<unknown>) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await fn(req, res);
      if (result !== undefined && !res.headersSent) res.json(result);
    } catch (err) {
      next(err);
    }
  };

export const qInt = (req: Request, key: string): number | undefined => {
  const v = toInt(req.query[key]);
  return v === null ? undefined : v;
};
export const qStr = (req: Request, key: string): string | undefined => {
  const v = req.query[key];
  return typeof v === 'string' && v !== '' ? v : undefined;
};
export const pInt = (req: Request, key: string): number => {
  const v = toInt(req.params[key]);
  if (v === null) throw new HttpError(400, 'Tham số không hợp lệ.');
  return v;
};

/**
 * Kịch bản demo: chỉ áp dụng cho các thao tác GHI khi người dùng chủ động bật
 * 'save_failure' trong Công cụ demo. Không bao giờ tự bật lỗi ngẫu nhiên.
 */
export function maybeSimulateSaveFailure() {
  if (scenarioMode() === 'save_failure') {
    throw new HttpError(503, 'Không lưu được (kịch bản demo đang bật). Bản nháp của bạn vẫn được giữ — bấm Thử lại.');
  }
}

export function maybeSimulateReadError() {
  if (scenarioMode() === 'error') {
    throw new HttpError(500, 'Không tải được dữ liệu (kịch bản demo đang bật). Bấm Tải lại.');
  }
}
