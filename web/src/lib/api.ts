/** Lớp gọi API + cache theo tài khoản. Đổi tài khoản là xoá sạch cache cũ. */
import { dich, t } from '../../../shared/i18n/index.ts';

export class ApiError extends Error {
  constructor(public status: number, message: string, public details?: any) {
    super(message);
  }
  get hint(): string | undefined {
    return typeof this.details?.hint === 'string' ? dich(this.details.hint) : this.details?.hint;
  }
}

/*
 * OV-11i (HL-15 · PT-11 · TQ-16): câu lỗi của các lần 403 — khung lỗi (`ErrorState`) chỉ nhận chữ, nhờ đây biết "thử lại vẫn 403" để thay
 * "Thử lại" bằng nút về, không sửa ~80 nơi gọi. ponytail: nhận theo câu chữ — có câu trùng giữa 403 và lỗi khác thì truyền `status` tới ErrorState.
 */
const cauLoi403 = new Set<string>();
export const laCauLoi403 = (cau: string) => cauLoi403.has(cau);

const cache = new Map<string, unknown>();
/*
 * PR-CACHE (F01, F04): số lần xoá theo tiền tố ('' = đổi tài khoản, trúng mọi đường). Lời gọi ghi nhớ `theHe(path)` lúc BẮT ĐẦU;
 * phản hồi về mà thế hệ đã đổi thì là dữ liệu trước lần xoá (tài khoản cũ / trước khi ghi) — không được lưu lại.
 */
const lanXoa = new Map<string, number>();
const demXoa = (prefix: string) => lanXoa.set(prefix, (lanXoa.get(prefix) ?? 0) + 1);
export function theHe(path: string): number {
  let n = 0;
  for (const [p, c] of lanXoa) if (path.startsWith(p)) n += c;
  return n;
}
/** `null` = vô hiệu toàn bộ; chuỗi = chỉ vô hiệu các đường dẫn bắt đầu bằng tiền tố đó. */
type InvalidateListener = (prefix: string | null) => void;
const listeners = new Set<InvalidateListener>();

/** Gọi khi đổi tài khoản: mọi dữ liệu của tài khoản cũ bị vô hiệu. */
export function invalidateAll() {
  demXoa('');
  cache.clear();
  listeners.forEach((l) => l(null));
}

/**
 * Vô hiệu hoá theo tiền tố đường dẫn, dùng sau khi ghi dữ liệu.
 * Chỉ các truy vấn khớp tiền tố mới tải lại — nếu đánh thức tất cả, một lần lưu ô này
 * sẽ khiến bảng đang nhập tải lại và làm mất bản nháp người dùng đang gõ ở ô khác.
 */
export function invalidate(prefix: string) {
  demXoa(prefix);
  for (const key of [...cache.keys()]) {
    if (key.startsWith(prefix)) cache.delete(key);
  }
  listeners.forEach((l) => l(prefix));
}

/** OV-14a (F03): như `invalidate` nhưng KHÔNG gọi tải lại — chỉ để lời gọi đang bay của tiền tố này về sau bị bỏ (đã tự cập nhật tại chỗ). */
export function boLoiGoiDangBay(prefix: string) { demXoa(prefix); }

export function onInvalidate(fn: InvalidateListener) {
  listeners.add(fn);
  return () => { listeners.delete(fn); };
}

async function request<T>(method: string, path: string, body?: unknown, isForm = false): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`/api${path}`, {
      method,
      credentials: 'same-origin',
      headers: isForm ? undefined : body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
      body: isForm ? (body as FormData) : body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch (e) {
    /* Mất mạng / máy chủ không trả lời: trình duyệt ném TypeError "Failed to fetch" — người dùng cần câu tiếng Việt, không phải câu của trình duyệt. */
    if (e instanceof TypeError) throw new ApiError(0, t('Mất kết nối máy chủ — kiểm tra mạng rồi thử lại.'));
    throw e;
  }
  const text = await res.text();
  let payload: any = null;
  if (text) {
    /* HOTFIX-3: lỗi mà thân không phải JSON (vd 504 HTML của Netlify) → câu "Lỗi {status} — thử lại", không in nguyên HTML. */
    try { payload = JSON.parse(text); } catch {
      /* OV-14a (F10): 2xx mà thân không phải JSON (trang HTML của Netlify / Vite) KHÔNG phải dữ liệu — báo lỗi, không đưa HTML ra màn. */
      if (res.ok) throw new ApiError(res.status, t('Máy chủ trả dữ liệu lạ — thử lại.'));
    }
  }
  if (!res.ok) {
    /* PR-EN: câu lỗi dịch theo khoá (câu có biến) hoặc theo chính câu Việt; chưa có bản Anh → câu Việt máy chủ gửi (không vỡ).
       Mọi chỗ in `e.message` tự đúng tiếng, không phải sửa từng nơi gọi. */
    const cau = typeof payload?.khoa === 'string' ? dich(payload.khoa, payload.bien) : typeof payload?.error === 'string' ? dich(payload.error) : t('Lỗi {status} — thử lại', { status: res.status });
    const loi = new ApiError(res.status, cau, payload?.details);
    if (loi.status === 403) cauLoi403.add(loi.message);
    throw loi;
  }
  return payload as T;
}

export const api = {
  get: <T,>(path: string) => request<T>('GET', path),
  post: <T,>(path: string, body?: unknown) => request<T>('POST', path, body),
  put: <T,>(path: string, body?: unknown) => request<T>('PUT', path, body),
  patch: <T,>(path: string, body?: unknown) => request<T>('PATCH', path, body),
  del: <T,>(path: string) => request<T>('DELETE', path),
  upload: <T,>(path: string, form: FormData) => request<T>('POST', path, form, true),
};

export async function cachedGet<T>(path: string): Promise<T> {
  if (cache.has(path)) return cache.get(path) as T;
  /* Đổi tài khoản / ghi trúng tiền tố lúc đang chờ → không lưu bản cũ (rà #254, PR-CACHE). */
  const g = theHe(path);
  const data = await api.get<T>(path);
  if (theHe(path) === g) cache.set(path, data);
  return data;
}
