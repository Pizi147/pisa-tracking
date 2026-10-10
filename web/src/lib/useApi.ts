import { useCallback, useEffect, useRef, useState } from 'react';
import { ApiError, api, cachedGet, onInvalidate, theHe } from './api.ts';

/*
 * PR-S6F-b (D14): GET ĐANG BAY cùng đường dẫn dùng chung MỘT lời gọi — Tổng quan có nhiều khối cùng đọc `/my-work`, `/tong-quan/quan-ly`.
 * Xoá khỏi bảng ngay khi xong (không phải cache: lần tải sau vẫn gọi máy chủ) và khi `invalidate` trúng tiền tố (để lần tải lại sau khi ghi
 * không dùng lại một lời gọi bắt đầu TRƯỚC khi ghi).
 */
const dangBay = new Map<string, Promise<unknown>>();
/*
 * PR-TOCDO: BẢN VỪA XEM — vào lại một trang đã mở thì hiện ngay dữ liệu lần trước, rồi tải lại nền và thay bằng bản mới (máy chủ ở xa, mỗi lượt gọi
 * ~0,3 s; trước đây mỗi lần đổi trang đều hiện khung chờ). Bị xoá cùng lúc với `dangBay`: đổi tài khoản (prefix = null) là xoá sạch, nên không
 * lộ dữ liệu của tài khoản trước; ghi dữ liệu xong thì xoá đúng các đường dẫn bị ảnh hưởng.
 */
const daXem = new Map<string, unknown>();
const DA_XEM_TOI_DA = 60;
/*
 * PR-TD2-c: lúc lưu từng bản vừa xem. Hook MỚI GẮN gặp bản lưu chưa quá MOI_MS thì dùng luôn, không gọi lại máy chủ — bản tải trước
 * (`taiTruoc`), `/cases/:id` của trang chuyển tiếp Case, nhiều khối gắn nối nhau cùng đọc một đường. `reload`/`deps` vẫn luôn gọi lại;
 * ghi dữ liệu xong `invalidate` xoá bản lưu nên không dùng nhầm bản cũ.
 */
const luc = new Map<string, number>();
const MOI_MS = 10_000;
/** Gần như tĩnh — giữ tới khi `invalidate` (đổi tài khoản / ghi trúng tiền tố), không tải lại mỗi lần gắn (PR-TD2-c). */
const TINH = new Set(['/ref/branches', '/ref/periods']);
onInvalidate((prefix) => {
  for (const k of [...dangBay.keys()]) if (prefix === null || k.startsWith(prefix)) dangBay.delete(k);
  for (const k of [...daXem.keys()]) if (prefix === null || k.startsWith(prefix)) daXem.delete(k);
});
const conMoi = (path: string) => daXem.has(path) && Date.now() - (luc.get(path) ?? 0) < MOI_MS;
function nhoBanXem(path: string, d: unknown) {
  daXem.delete(path);
  daXem.set(path, d);
  luc.set(path, Date.now());
  if (daXem.size > DA_XEM_TOI_DA) daXem.delete(daXem.keys().next().value as string);
}
function getChung<T>(path: string): Promise<T> {
  const cu = dangBay.get(path) as Promise<T> | undefined;
  if (cu) return cu;
  const p = TINH.has(path) ? cachedGet<T>(path) : api.get<T>(path);
  dangBay.set(path, p);
  const bo = () => { if (dangBay.get(path) === p) dangBay.delete(path); };
  p.then(bo, bo);
  return p;
}

/** PR-TD2-c: bắt đầu tải một đường trước khi khối cần nó gắn (song song với đường khác); khối gắn sau dùng lại qua `dangBay`/bản vừa xem. */
export function taiTruoc(path: string): void {
  if (conMoi(path)) return;
  taiVaNho(path).catch(() => { /* lỗi để khối gắn sau tự gọi lại và báo */ });
}

/**
 * Tải (dùng chung lời gọi đang bay) rồi nhớ bản vừa xem. `null` = có lần xoá trúng đường này sau khi bắt đầu (đổi tài khoản / ghi):
 * bỏ phản hồi, không ghi `daXem` — hook đang gắn đã được `onInvalidate` cho tải lại (PR-CACHE F01, F04).
 */
export function taiVaNho<T>(path: string): Promise<{ d: T } | null> {
  const g = theHe(path);
  return getChung<T>(path).then((d) => {
    if (theHe(path) !== g) return null;
    nhoBanXem(path, d);
    return { d };
  });
}

/** Gộp tải lại sau lần lưu cuối (PR-UX1 Q14) — tải lại sau mỗi ô làm nặng Turso. */
const GOP_TAI_LAI_MS = 1500;
/** Trả hàm gọi sau mỗi lần lưu: `reload` chạy MỘT lần, 1,5 s sau lần gọi cuối; gỡ trang thì huỷ hẹn. */
export function useGopTaiLai(reload: () => void): () => void {
  const hen = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (hen.current) clearTimeout(hen.current); }, []);
  return () => {
    if (hen.current) clearTimeout(hen.current);
    hen.current = setTimeout(() => { hen.current = null; reload(); }, GOP_TAI_LAI_MS);
  };
}

export type ApiState<T> = {
  data: T | null;
  /** true chỉ khi CHƯA có dữ liệu để hiển thị — dùng để bật skeleton. */
  loading: boolean;
  /** true khi đang tải lại nền dù đã có dữ liệu cũ trên màn hình. */
  refreshing: boolean;
  error: ApiError | null;
  reload: () => void;
  setData: (updater: T | ((prev: T | null) => T)) => void;
};

/**
 * Tải dữ liệu theo đường dẫn; tự tải lại khi cache bị vô hiệu.
 *
 * Quan trọng: tải lại nền KHÔNG xoá dữ liệu đang hiển thị. Nếu trả về `loading = true`
 * cho mọi lần tải lại, trang cha sẽ đổi sang skeleton và làm unmount bảng đang nhập,
 * khiến bản nháp của người dùng bị mất.
 */
export function useApi<T>(path: string | null, deps: unknown[] = []): ApiState<T> {
  const [data, setDataState] = useState<T | null>(() => (path ? (daXem.get(path) as T | undefined) ?? null : null));
  const [fetching, setFetching] = useState(!!path);
  const [error, setError] = useState<ApiError | null>(null);
  const [tick, setTick] = useState(0);
  const latest = useRef(0);
  const currentPath = useRef<string | null>(null);

  const reload = useCallback(() => setTick((t) => t + 1), []);

  useEffect(
    () => onInvalidate((prefix) => {
      if (prefix === null || (path && path.startsWith(prefix))) reload();
    }),
    [reload, path],
  );

  useEffect(() => {
    if (!path) {
      setDataState(null);
      setFetching(false);
      currentPath.current = null;
      return;
    }
    // Đổi sang truy vấn khác thì mới bỏ dữ liệu cũ đi.
    if (currentPath.current !== path) {
      setDataState((daXem.get(path) as T | undefined) ?? null);
      currentPath.current = path;
      /* Mới gắn / đổi đường, bản lưu còn mới → dùng luôn (PR-TD2-c). */
      if (conMoi(path)) { latest.current += 1; setFetching(false); setError(null); return; }
    }
    const seq = ++latest.current;
    setFetching(true);
    setError(null);
    taiVaNho<T>(path)
      .then((kq) => {
        if (seq !== latest.current || !kq) return;   // bỏ qua phản hồi cũ
        setDataState(kq.d);
        setFetching(false);
      })
      .catch((e) => {
        if (seq !== latest.current) return;
        setError(e instanceof ApiError ? e : new ApiError(500, String(e)));
        setFetching(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, tick, ...deps]);

  const setData = useCallback((updater: any) => {
    setDataState((prev) => (typeof updater === 'function' ? updater(prev) : updater));
  }, []);

  return { data, loading: fetching && data === null, refreshing: fetching, error, reload, setData };
}
