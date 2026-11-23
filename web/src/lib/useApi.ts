import { useCallback, useEffect, useRef, useState } from 'react';
import { ApiError, api, boLoiGoiDangBay, cachedGet, khopTienTo, onInvalidate, theHe, xaGop } from './api.ts';

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
const daXem = new Map<string, { d: unknown; luc: number }>();
const DA_XEM_TOI_DA = 60;
/*
 * PR-TD2-c: `luc` = lúc lưu bản vừa xem. Hook MỚI GẮN gặp bản lưu chưa quá MOI_MS thì dùng luôn, không gọi lại máy chủ — bản tải trước
 * (`taiTruoc`), `/cases/:id` của trang chuyển tiếp Case, nhiều khối gắn nối nhau cùng đọc một đường. `reload`/`deps` vẫn luôn gọi lại;
 * ghi dữ liệu xong `invalidate` xoá bản lưu nên không dùng nhầm bản cũ. AUDIT-LOI F10: `luc` nằm CHUNG mục với dữ liệu — trước là Map riêng
 * không bao giờ xoá (mỗi URL tìm / lọc một mục suốt phiên).
 */
const MOI_MS = 10_000;
/** Gần như tĩnh — giữ tới khi `invalidate` (đổi tài khoản / ghi trúng tiền tố), không tải lại mỗi lần gắn (PR-TD2-c). */
/* GIAM-COMPUTE: + bảng quy đổi band — hộp nhập điểm L / R đọc ở MỖI lần mở (20 ô = 20 GET); Quản trị lưu bảng thì `invalidate('/ref/bang-quy-doi')`. */
const TINH = new Set(['/ref/branches', '/ref/periods', '/ref/bang-quy-doi']);
onInvalidate((prefix) => {
  for (const k of [...dangBay.keys()]) if (prefix === null || khopTienTo(k, prefix)) dangBay.delete(k);
  for (const k of [...daXem.keys()]) if (prefix === null || khopTienTo(k, prefix)) daXem.delete(k);
});
/**
 * AUDIT-1611 BADGE-NHE (PTA 17/11, phương án C): `/my-work` (badge, Công việc, HV & Lớp, trang đầu GV, hồ sơ lớp) — bản đã nạp dùng lại 5 phút ở mọi khối
 * mới gắn (trước 10 s: mỗi lần mở trang một lần dựng đủ việc; QL nhiều chi nhánh ~4–5 nghìn dòng / lần). Thao tác của chính mình vẫn vô hiệu NGAY (bản bị xoá,
 * khối đang mở tải lại); việc người khác vừa giao hiện chậm tối đa 5 phút (badge còn tải lại khi đổi trang / quay lại tab sau ≥ 5 phút — `henTaiLaiKhiCu`).
 */
export const MOI_MY_WORK_MS = 5 * 60_000;
const laMyWork = (path: string) => path === '/my-work' || path.startsWith('/my-work?');
const conMoi = (path: string) => { const x = daXem.get(path); return !!x && Date.now() - x.luc < (laMyWork(path) ? MOI_MY_WORK_MS : MOI_MS); };
/** GIAM-COMPUTE: hook `chiNghe` nhận mọi bản mới của đường mình — khối khác tải cùng đường thì hook này có luôn, không gọi thêm. */
const ngheBan = new Map<string, Set<(d: unknown) => void>>();
function nhoBanXem(path: string, d: unknown) {
  daXem.delete(path);
  daXem.set(path, { d, luc: Date.now() });
  if (daXem.size > DA_XEM_TOI_DA) daXem.delete(daXem.keys().next().value as string);
  ngheBan.get(path)?.forEach((f) => f(d));
}
/** Nghe mọi bản mới (đã nhớ, không bị vô hiệu giữa chừng) của `path`; trả hàm gỡ. */
export function ngheBanMoi(path: string, f: (d: unknown) => void): () => void {
  const ds = ngheBan.get(path) ?? new Set();
  ngheBan.set(path, ds.add(f));
  return () => { ds.delete(f); if (!ds.size && ngheBan.get(path) === ds) ngheBan.delete(path); };
}
/**
 * GIAM-COMPUTE (badge `/my-work`, chủ SP duyệt 11/11 #1320): `cu()` đánh dấu bản đang hiện đã cũ → `taiLai` MỘT lần khi `doiTrang()`, hoặc khi bản đã
 * ≥ `choMs` (tính từ `coBan()` gần nhất) VÀ tab đang hiện (tab ẩn → chờ tới lúc hiện). `coBan()`: bản mới đã về → hết cũ, bỏ hẹn. `ngay()`: tải lại ngay.
 */
export function henTaiLaiKhiCu(taiLai: () => void, choMs = 60_000, hetMs = Number.POSITIVE_INFINITY) {
  let cu = false;
  let luc = Date.now();
  /* BADGE-NHE: bản đã ≥ `hetMs` thì đổi trang / quay lại tab (ẩn ≥ `hetMs`) cũng tải lại — người để máy lâu vẫn thấy việc mới người khác giao. */
  let anLuc: number | null = null;
  let hen: ReturnType<typeof setTimeout> | null = null;
  let choHien = false;
  /* Qua `globalThis`: tệp này còn được dựng cho phép kiểm máy chủ (không có kiểu DOM, không có `document`). */
  type Doc = { hidden: boolean; addEventListener(k: string, f: () => void): void; removeEventListener(k: string, f: () => void): void };
  const layDoc = () => (globalThis as { document?: Doc }).document;
  const an = () => Boolean(layDoc()?.hidden);
  const khiHien = () => { if (!an()) { boChoHien(); if (cu) chay(); } };
  const boChoHien = () => { if (choHien) { layDoc()?.removeEventListener('visibilitychange', khiHien); choHien = false; } };
  const bo = () => { if (hen) { clearTimeout(hen); hen = null; } boChoHien(); };
  const chay = () => { cu = false; bo(); taiLai(); };
  const doiHien = () => {
    if (an()) { anLuc = Date.now(); return; }
    if (anLuc !== null && Date.now() - anLuc >= hetMs) chay();
    anLuc = null;
  };
  if (Number.isFinite(hetMs)) layDoc()?.addEventListener('visibilitychange', doiHien);
  const toiHen = () => {
    hen = null;
    if (!cu) return;
    if (!an()) { chay(); return; }
    if (!choHien) { choHien = true; layDoc()?.addEventListener('visibilitychange', khiHien); }
  };
  return {
    cu() { cu = true; if (!hen && !choHien) hen = setTimeout(toiHen, Math.max(0, luc + choMs - Date.now())); },
    doiTrang() { if (cu || Date.now() - luc >= hetMs) chay(); },
    coBan() { cu = false; luc = Date.now(); bo(); },
    ngay: chay,
    /** BADGE-NHE: chuông mở — bản đã ≥ `ms` thì tải danh sách mới (số trên chuông vẫn là bản đang có tới khi bản mới về). */
    moiNeuCu(ms: number) { if (Date.now() - luc >= ms) chay(); },
    huy() { bo(); layDoc()?.removeEventListener('visibilitychange', doiHien); },
  };
}

/** GIAM-COMPUTE: lúc lời gọi mạng ĐANG BAY của mỗi đường bắt đầu (0 = bản nhớ `cachedGet`, không rõ lúc) — hook dùng chung lời gọi lấy đúng lúc này. */
const batDauGoi = new Map<string, number>();
function getChung<T>(path: string): Promise<T> {
  const cu = dangBay.get(path) as Promise<T> | undefined;
  if (cu) return cu;
  const p = TINH.has(path) ? cachedGet<T>(path) : api.get<T>(path);
  dangBay.set(path, p);
  batDauGoi.set(path, TINH.has(path) ? 0 : Date.now());
  const bo = () => { if (dangBay.get(path) === p) { dangBay.delete(path); batDauGoi.delete(path); } };
  p.then(bo, bo);
  return p;
}

/** PR-TD2-c: bắt đầu tải một đường trước khi khối cần nó gắn (song song với đường khác); khối gắn sau dùng lại qua `dangBay`/bản vừa xem. */
export function taiTruoc(path: string): void {
  if (conMoi(path)) return;
  taiVaNho(path).catch(() => { /* lỗi để khối gắn sau tự gọi lại và báo */ });
}

/**
 * TD-QUET (đề xuất 2): tải trước NHIỀU đường bằng MỘT lời gọi gộp (`goc?phan=k1,k2…` — vd `/classes/:id/ho-so`, máy chủ đọc chung trong một request). Mỗi đường
 * lẻ nhận phần `data` của nó như một lời gọi đang bay → khối gắn sau dùng lại / bản vừa xem như `taiTruoc`; tải lại sau thao tác vẫn gọi đường lẻ (chỉ phần đổi).
 * Phần lỗi (403 / 404…) hoặc lời gọi gộp lỗi → đường đó tự gọi lẻ, lỗi hiện tại khối như cũ. Đường đã có bản mới / đang bay: không vào bó.
 */
/** R3-T3: phần máy chủ bỏ (`tuy`, 204 — không áp dụng) mà không khối nào đang gắn → không gọi lẻ; bỏ im lặng (khối gắn sau tự gọi). */
const BO_PHAN = new Error('bo-phan');
export function taiTruocGop(goc: string, phan: Record<string, string>, tuy = false): void {
  const can = Object.entries(phan).filter(([, path]) => !conMoi(path) && !dangBay.has(path));
  if (!can.length) return;
  const bo = api.get<Record<string, { status: number; data?: unknown }>>(`${goc}${goc.includes('?') ? '&' : '?'}phan=${can.map(([k]) => k).join(',')}${tuy ? '&tuy=1' : ''}`);
  const luc = Date.now();
  for (const [k, path] of can) {
    const p = bo.then((r) => (r[k]?.status === 200 ? r[k].data : r[k]?.status === 204 && !dangGan.has(path) ? Promise.reject(BO_PHAN) : api.get(path)), () => api.get(path));
    dangBay.set(path, p);
    batDauGoi.set(path, luc);
    const xong = () => { if (dangBay.get(path) === p) { dangBay.delete(path); batDauGoi.delete(path); } };
    p.then(xong, xong);
    taiVaNho(path).catch(() => { /* lỗi để khối gắn sau tự gọi lại và báo */ });
  }
}

/** R3-T4: số hook ĐANG GẮN (không `chiNghe`) theo đường — `gopKhiVoHieu` chỉ gộp các đường có người đang xem. */
const dangGan = new Map<string, number>();
/** Đánh dấu một hook đang gắn đường `path`; trả hàm gỡ (effect của `useApi`, phép kiểm gọi thẳng). */
export function ganDuong(path: string): () => void {
  dangGan.set(path, (dangGan.get(path) ?? 0) + 1);
  return () => { const n = (dangGan.get(path) ?? 1) - 1; if (n > 0) dangGan.set(path, n); else dangGan.delete(path); };
}
/**
 * R3-T4 (rà 24/11): trang có GET gộp (`/classes/:id/ho-so`) — một lần ghi vô hiệu trúng các đường lẻ của nó (vd `invalidate('/classes')`) thì các đường
 * ĐANG GẮN tải lại bằng MỘT GET gộp thay vì mỗi đường một GET (máy chủ đọc chung lượt / điểm / Case một lần). Gom mọi `invalidate` cùng lượt chạy
 * (microtask, trước effect tải lại của hook) — hook tải lại dùng lại lời gọi đang bay. Vô hiệu gộp (`luc`, `xaGop`) bỏ qua: hook có thể không tải lại.
 * `bo` = các bó (mỗi bó một GET, chạy song song — giữ mỗi request ≤ trần 100 câu của `tocDo`). Trả hàm gỡ.
 */
export function gopKhiVoHieu(goc: string, bo: Record<string, string>[]): () => void {
  const phan = Object.assign({}, ...bo) as Record<string, string>;
  const trung = new Set<string>();   // đường của bó bị vô hiệu trong lượt chạy này
  return onInvalidate((prefix, luc) => {
    if (prefix === null || luc !== undefined) return;
    const moi = Object.values(phan).filter((p) => khopTienTo(p, prefix));
    if (!moi.length) return;
    if (!trung.size) queueMicrotask(() => {
      for (const b of bo) {
        const gan = Object.entries(b).filter(([, p]) => trung.has(p) && dangGan.has(p) && !dangBay.has(p));
        if (gan.length >= 2) taiTruocGop(goc, Object.fromEntries(gan));
      }
      trung.clear();
    });
    moi.forEach((p) => trung.add(p));
  });
}

/**
 * TQ-QT-NHE A2 (PTA 24/11): Tổng quan Head / Quản trị / Admin — MỘT GET `goc` (`…&kemViec=1`) kèm `cuaToi` = CHÍNH `/my-work` "Của tôi" của badge (`phu`, máy chủ
 * cùng hàm `viecCuaToi`) khi bản badge đã cũ / chưa có. Hai đường nhận phần của mình như lời gọi đang bay (khối gắn sau dùng lại, `chiNghe` của badge nhận bản mới),
 * nên trang Tổng quan khỏi một GET `/my-work` riêng. Lỗi / thiếu phần kèm → `phu` tự gọi lẻ như cũ. Vô hiệu giữa chừng → `taiVaNho` bỏ phản hồi (theo thế hệ).
 */
export function taiTruocKem(goc: string, phu: string): void {
  if (conMoi(goc) || dangBay.has(goc)) return;
  const kem = !conMoi(phu) && !dangBay.has(phu);
  const cn = new URLSearchParams(phu.split('?')[1] ?? '').get('branchId') ?? '0';
  const bo = api.get<Record<string, unknown>>(kem ? `${goc}&cuaToi=${cn}` : goc);
  const luc = Date.now();
  const dat = (path: string, p: Promise<unknown>) => {
    dangBay.set(path, p);
    batDauGoi.set(path, luc);
    const xong = () => { if (dangBay.get(path) === p) { dangBay.delete(path); batDauGoi.delete(path); } };
    p.then(xong, xong);
    taiVaNho(path).catch(() => { /* lỗi để khối gắn sau tự gọi lại và báo */ });
  };
  dat(goc, bo.then(({ cuaToi: _bo, ...con }) => con));
  if (kem) dat(phu, bo.then((r) => ('cuaToi' in r ? r.cuaToi : api.get(phu)), () => api.get(phu)));
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
export function quenBanXem(prefix: string, boDangBay = true) {
  /* S5: `boDangBay = false` — chỉ quên bản vừa xem; GET đang bay (bắt đầu SAU lần ghi, vd tải lại vừa gọi) vẫn được nhận. */
  if (boDangBay) {
    boLoiGoiDangBay(prefix);   // GET bắt đầu trước lúc lưu xong về sau → bỏ, không ghi bản cũ
    for (const k of [...dangBay.keys()]) if (khopTienTo(k, prefix)) dangBay.delete(k);
  }
  for (const k of [...daXem.keys()]) if (khopTienTo(k, prefix)) daXem.delete(k);
}

/** OV-14a (F09): tải gặp 401 = phiên đã hết — App tải lại phiên (màn đăng nhập nếu hết thật), không coi như lỗi mạng. */
const ngheHetPhien = new Set<() => void>();
export function onHetPhien(f: () => void): () => void { ngheHetPhien.add(f); return () => { ngheHetPhien.delete(f); }; }

type Ref<V> = { current: V };
/** Thân effect tải của `useApi` — tách ra để phép kiểm gọi không cần React (OV-14a F06, F09). */
export function batDauTai<T>(path: string | null, b: {
  latest: Ref<number>; currentPath: Ref<string | null>; coDuLieu: Ref<boolean>;
  /** GIAM-COMPUTE: lúc BẮT ĐẦU lời gọi đã cho dữ liệu đang hiện (0 = chưa có / bản lưu không rõ lúc) — vô hiệu gộp cũ hơn thì khỏi tải lại. */
  banTu?: Ref<number>;
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
    xaGop(path);   // W1: còn vô hiệu đang gộp cho đường này → xả trước, không dùng bản lưu cũ
    if (b.banTu) b.banTu.current = 0;   // dữ liệu sắp hiện là bản lưu / null — không rõ lúc tải
    const banXem = daXem.get(path)?.d as T | undefined;
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
  const tai = taiVaNho<T>(path);
  const batDauLuc = batDauGoi.get(path) ?? 0;   // lời gọi mạng thật (có thể của khối khác, bắt đầu trước lần ghi)
  tai
    .then((kq) => {
      if (seq !== latest.current) return;   // bỏ qua phản hồi cũ
      if (!kq) { b.setFetching(false); return; }   // bị xoá giữa chừng: giữ dữ liệu đang có (invalidate tự tải lại)
      loiNen.delete(reload);
      b.setData(kq.d);
      if (b.banTu) b.banTu.current = batDauLuc;
      b.setCu?.(false);
      b.setFetching(false);
    })
    .catch((e) => {
      if (seq !== latest.current) return;
      const loi = e instanceof ApiError ? e : new ApiError(500, String(e));
      b.setError(loi);
      b.setFetching(false);
      if (loi.status === 401) ngheHetPhien.forEach((f) => f());
      /* N37: 404 khi tải lại nền = đối tượng vừa bị xoá (Case / PA…) — nơi cha tải lại sẽ gỡ khối; "Thử lại" chỉ 404 lần nữa nên không báo. */
      else if (coDuLieu.current && loi.status !== 404) {
        loiNen.add(reload);
        ngheLoi.forEach((f) => f());
      }
    });
}

/**
 * Hook đường `path` có phải tải lại khi vô hiệu `prefix` không. GIAM-COMPUTE: vô hiệu GỘP (`luc` = lần ghi cuối) mà bản đang hiện đã tải XONG từ lời gọi
 * bắt đầu từ lần ghi đó trở đi (`banTu` — lưới tự tải lại ngay sau khi lưu) → bản đó đã gồm lần ghi, tải lại chỉ ra đúng dữ liệu này. Đang bay thì `banTu` còn
 * là bản trước → vẫn tải lại (lời gọi đang bay bị vô hiệu bỏ).
 */
export function canTaiLaiKhiVoHieu(path: string | null, prefix: string | null, luc: number | undefined, banTu: number): boolean {
  if (prefix === null) return true;
  if (!path || !khopTienTo(path, prefix)) return false;
  return !(luc !== undefined && banTu >= luc);
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
export function useApi<T>(path: string | null, deps: unknown[] = [], opts: {
  giuCu?: boolean;
  /**
   * GIAM-COMPUTE (badge `/my-work` ở App): KHÔNG tự tải lại khi đường bị vô hiệu — nơi gọi tự quyết lúc tải lại (qua `deps`); khối khác tải cùng đường
   * thì nhận luôn bản mới đó (số không lệch với trang đang mở, không thêm lời gọi).
   */
  chiNghe?: boolean;
  /**
   * AUDIT-1611 gói 13: có bản đã nạp (bất kể cũ mới — vd `/my-work` của badge App) thì DÙNG LUÔN, không gọi máy chủ khi gắn; bản mới tới qua `chiNghe`
   * (App tải lại theo lịch của nó). `reload()` vẫn tải thật. Chưa có bản nào → tải như thường (GET đang bay được gộp).
   */
  dungBanLuu?: boolean;
} = {}): ApiState<T> {
  const [data, setDataState] = useState<T | null>(() => (path ? (daXem.get(path)?.d as T | undefined) ?? null : null));
  const [fetching, setFetching] = useState(!!path);
  const [error, setError] = useState<ApiError | null>(null);
  const [cu, setCu] = useState(false);
  const [tick, setTick] = useState(0);
  const latest = useRef(0);
  const banTu = useRef(0);
  const currentPath = useRef<string | null>(null);

  const reload = useCallback(() => setTick((t) => t + 1), []);
  const coDuLieu = useRef(false);
  coDuLieu.current = data !== null;
  useEffect(() => () => { loiNen.delete(reload); }, [reload]);

  useEffect(
    () => opts.chiNghe ? undefined : onInvalidate((prefix, luc) => {
      if (canTaiLaiKhiVoHieu(path, prefix, luc, banTu.current)) reload();
    }),
    [reload, path, opts.chiNghe],
  );
  useEffect(() => {
    if (opts.chiNghe || !path) return undefined;
    return ganDuong(path);
  }, [path, opts.chiNghe]);
  useEffect(() => {
    if (!opts.chiNghe || !path) return undefined;
    return ngheBanMoi(path, (d) => setDataState(d as T));
  }, [path, opts.chiNghe]);

  useEffect(() => {
    if (opts.dungBanLuu && path && tick === 0 && daXem.has(path)) {
      currentPath.current = path; setDataState(daXem.get(path)!.d as T); setFetching(false); setError(null);
      return;
    }
    batDauTai<T>(path, { latest, currentPath, coDuLieu, setData: setDataState, setFetching, setError, reload, giuCu: opts.giuCu, setCu, banTu });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, tick, ...deps]);

  const setData = useCallback((updater: any) => {
    setDataState((prev) => (typeof updater === 'function' ? updater(prev) : updater));
  }, []);

  return { data, loading: fetching && data === null, refreshing: fetching, cu: cu && data !== null, error: loiCanHien(data, error), reload, setData };
}
