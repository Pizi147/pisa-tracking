import { useCallback, useEffect, useRef, useState } from 'react';
import { ApiError, api, onInvalidate } from './api.ts';

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
  const [data, setDataState] = useState<T | null>(null);
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
      setDataState(null);
      currentPath.current = path;
    }
    const seq = ++latest.current;
    setFetching(true);
    setError(null);
    api
      .get<T>(path)
      .then((d) => {
        if (seq !== latest.current) return;   // bỏ qua phản hồi cũ
        setDataState(d);
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
