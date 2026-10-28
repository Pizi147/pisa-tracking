import { useCallback, useEffect, useRef, useState } from 'react';
import { ApiError, api, boLoiGoiDangBay, cachedGet, onInvalidate, theHe } from './api.ts';

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

/** HOTFIX-3: hook đã có dữ liệu mà tải lại nền lỗi — App hiện toast "Chưa tải lại được · Thử lại"; Thử lại gọi lại mọi khối đang lỗi. */
const loiNen = new Set<() => void>();
const ngheLoi = new Set<() => void>();
export function onLoiTaiLai(f: () => void): () => void { ngheLoi.add(f); return () => { ngheLoi.delete(f); }; }
export function thuLaiNen() { [...loiNen].forEach((f) => f()); }

/** Lỗi trang cần hiện: chỉ khi CHƯA có dữ liệu — có rồi thì giữ dữ liệu (toast nhỏ thay ErrorState). */
export const loiCanHien = <T,>(data: T | null, error: ApiError | null): ApiError | null => (data === null ? error : null);

/** OV-14a (F03): quên bản vừa xem theo tiền tố mà KHÔNG gọi tải lại hook đang gắn — sau khi ghi đã tự cập nhật dữ liệu tại chỗ (`setData`). */
export function quenBanXem(prefix: string) {
  boLoiGoiDangBay(prefix);   // GET bắt đầu trước lúc lưu xong về sau → bỏ, không ghi bản cũ
  for (const k of [...dangBay.keys()]) if (k.startsWith(prefix)) dangBay.delete(k);
  for (const k of [...daXem.keys()]) if (k.startsWith(prefix)) daXem.delete(k);
}

/** OV-14a (F09): tải gặp 401 = phiên đã hết — App tải lại phiên (màn đăng nhập nếu hết thật), không coi như lỗi mạng. */
const ngheHetPhien = new Set<() => void>();
export function onHetPhien(f: () => void): () => void { ngheHetPhien.add(f); return () => { ngheHetPhien.delete(f); }; }

type Ref<V> = { current: V };
/** Thân effect tải của `useApi` — tách ra để phép kiểm gọi không cần React (OV-14a F06, F09). */
export function batDauTai<T>(path: string | null, b: {
  latest: Ref<number>; currentPath: Ref<string | null>; coDuLieu: Ref<boolean>;
  setData: (d: T | null) => void; setFetching: (v: boolean) => void; setError: (e: ApiError | null) => void; reload: () => void;
  /** HV-LOC: đổi truy vấn mà chưa có bản vừa xem → giữ dữ liệu cũ tới khi bản mới về (`setCu(true)` trong lúc đó), không về null. */
  giuCu?: boolean; setCu?: (v: boolean) => void;
}): void {
  const { latest, currentPath, coDuLieu, reload } = b;
  if (!path) {
    latest.current += 1;   // F06: phản hồi của đường cũ còn bay không được đặt lại dữ liệu
    b.setData(null);
    b.setCu?.(false);
    b.setFetching(false);
    currentPath.current = null;
    return;
  }
  // Đổi sang truy vấn khác thì mới bỏ dữ liệu cũ đi.
  if (currentPath.current !== path) {
    const banXem = daXem.get(path) as T | undefined;
    /* HV-LOC: trang lọc / tìm theo truy vấn — gỡ dữ liệu làm trang cha hiện khung chờ, gỡ luôn ô đang gõ (mất focus, hỏng bộ gõ). */
    if (banXem === undefined && b.giuCu && coDuLieu.current) b.setCu?.(true);
    else { b.setData(banXem ?? null); b.setCu?.(false); }
    currentPath.current = path;
    /* Mới gắn / đổi đường, bản lưu còn mới → dùng luôn (PR-TD2-c). */
    if (conMoi(path)) { latest.current += 1; b.setFetching(false); b.setError(null); return; }
  }
  const seq = ++latest.current;
  b.setFetching(true);
  b.setError(null);
  taiVaNho<T>(path)
    .then((kq) => {
      if (seq !== latest.current) return;   // bỏ qua phản hồi cũ
      if (!kq) { b.setFetching(false); return; }   // bị xoá giữa chừng: giữ dữ liệu đang có (invalidate tự tải lại)
      loiNen.delete(reload);
      b.setData(kq.d);
      b.setCu?.(false);
      b.setFetching(false);
    })
    .catch((e) => {
      if (seq !== latest.current) return;
      const loi = e instanceof ApiError ? e : new ApiError(500, String(e));
      b.setError(loi);
      b.setFetching(false);
      if (loi.status === 401) ngheHetPhien.forEach((f) => f());
      else if (coDuLieu.current) {
        loiNen.add(reload);
        ngheLoi.forEach((f) => f());
      }
    });
}

export type ApiState<T> = {
  data: T | null;
  /** true chỉ khi CHƯA có dữ liệu để hiển thị — dùng để bật skeleton. */
  loading: boolean;
  /** true khi đang tải lại nền dù đã có dữ liệu cũ trên màn hình. */
  refreshing: boolean;
  /** `giuCu`: dữ liệu đang hiện là của truy vấn trước, bản mới đang tải (làm mờ nhẹ, không khung chờ). */
  cu: boolean;
  /** Chỉ khi CHƯA có dữ liệu (HOTFIX-3): đã có mà tải lại lỗi → giữ dữ liệu, toast nhỏ "Chưa tải lại được · Thử lại". */
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
export function useApi<T>(path: string | null, deps: unknown[] = [], opts: { giuCu?: boolean } = {}): ApiState<T> {
  const [data, setDataState] = useState<T | null>(() => (path ? (daXem.get(path) as T | undefined) ?? null : null));
  const [fetching, setFetching] = useState(!!path);
  const [error, setError] = useState<ApiError | null>(null);
  const [cu, setCu] = useState(false);
  const [tick, setTick] = useState(0);
  const latest = useRef(0);
  const currentPath = useRef<string | null>(null);

  const reload = useCallback(() => setTick((t) => t + 1), []);
  const coDuLieu = useRef(false);
  coDuLieu.current = data !== null;
  useEffect(() => () => { loiNen.delete(reload); }, [reload]);

  useEffect(
    () => onInvalidate((prefix) => {
      if (prefix === null || (path && path.startsWith(prefix))) reload();
    }),
    [reload, path],
  );

  useEffect(() => {
    batDauTai<T>(path, { latest, currentPath, coDuLieu, setData: setDataState, setFetching, setError, reload, giuCu: opts.giuCu, setCu });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, tick, ...deps]);

  const setData = useCallback((updater: any) => {
    setDataState((prev) => (typeof updater === 'function' ? updater(prev) : updater));
  }, []);

  return { data, loading: fetching && data === null, refreshing: fetching, cu: cu && data !== null, error: loiCanHien(data, error), reload, setData };
}
