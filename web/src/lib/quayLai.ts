import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from 'react';
import { useLocation, useNavigate, useNavigationType, useSearchParams } from 'react-router-dom';
import { buocMoi, docChong, docXem, luiBangBack, soMucPanel, tenNguon, tieuDeTab, type BuocVe, type KieuDi, type TenTrang } from '@shared/domain/index.ts';
import { cuonVeViTri } from './cuonOnDinh.ts';
import { t } from '@shared/i18n/index.ts';

/**
 * QUAY LẠI ĐÚNG NƠI BẮT ĐẦU (PR-OV5b) — một cơ chế cho mọi trang. `useGhiNguon` (gọi một lần ở App) nghe mọi lần chuyển trang và
 * giữ chồng nguồn theo `buocMoi` (shared/domain/quayLai.ts); hồ sơ đọc chồng bằng `useChongVe`, về bằng `veBuoc`.
 * Vị trí cuộn là của `<main id="noi-dung">` (khung cuộn của app, không phải cửa sổ).
 */
const KHOA = 'pisa.quay-lai';
const ID_CUON = 'noi-dung';

/* Tải lại / mở link thẳng / tab mới: về trang cha (mockup §6) → chồng rỗng. Chỉ khi trình duyệt lùi về app từ trang ngoài
   (app nạp lại) mới đọc lại chồng đã lưu của tab này. */
const docLuc = (): BuocVe[] => {
  try {
    const kieu = (performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined)?.type;
    if (kieu === 'back_forward') return docChong(JSON.parse(sessionStorage.getItem(KHOA) ?? 'null'));
    sessionStorage.removeItem(KHOA);
  } catch { /* chế độ riêng tư chặn sessionStorage: chồng chỉ sống trong bộ nhớ */ }
  return [];
};
let chong: BuocVe[] = docLuc();
const nghe = new Set<() => void>();
const datChong = (c: BuocVe[]) => {
  chong = c;
  try { sessionStorage.setItem(KHOA, JSON.stringify(c)); } catch { /* như trên */ }
  nghe.forEach((f) => f());
};

/* Tên trang tự đặt (tuần đang xem, tên em…) theo đường dẫn; còn lại lấy từ URL (`tenNguon`). Giữ ít mục — chỉ cần trang vừa rời. */
const tenDaDat = new Map<string, Partial<TenTrang>>();
const tenCua = (url: string): TenTrang => {
  const dat = tenDaDat.get(url.split('?')[0]) ?? {};
  const goc = tenNguon(url);
  return { ten: dat.ten || goc.ten, ...(dat.chiTiet ?? goc.chiTiet ? { chiTiet: dat.chiTiet ?? goc.chiTiet } : {}) };
};

/**
 * Trang tự đặt tên hiện trên nút Quay lại khi người dùng đi từ trang này sang hồ sơ (vd Lịch Test: chi tiết "W2 OCT").
 * OV-11i (P1-3): có tên (hồ sơ) thì đặt luôn tiêu đề tab (`tieuDe`, mặc định `ten`) — sau tiêu đề chung của App (`useTieuDeTab`, layout effect).
 */
export function useTenTrang(ten?: string | null, chiTiet?: string | null, tieuDe?: string | null) {
  const { pathname } = useLocation();
  useEffect(() => {
    tenDaDat.delete(pathname);
    tenDaDat.set(pathname, { ten: ten || undefined, chiTiet: chiTiet || undefined });
    if (tenDaDat.size > 20) tenDaDat.delete(tenDaDat.keys().next().value!);
    if (tieuDe || ten) document.title = tieuDeTab(tieuDe || ten);
  }, [pathname, ten, chiTiet, tieuDe]);
}

/**
 * OV-11i (P1-3, Q14): tiêu đề tab chung theo trang (`tenNguon`) — gọi MỘT lần ở App. Layout effect chạy trước effect thường của mọi trang,
 * nên hồ sơ (tên em, mã lớp — `useTenTrang`) đặt đè sau. Chưa đăng nhập → "Đăng nhập".
 */
export function useTieuDeTab(daDangNhap: boolean) {
  const { pathname, search } = useLocation();
  useLayoutEffect(() => {
    document.title = tieuDeTab(daDangNhap ? tenNguon(pathname + search).ten : t('Đăng nhập'));
  }, [pathname, search, daDangNhap]);
}

/** Gọi MỘT lần ở App (sau khi đăng nhập). */
export function useGhiNguon() {
  const loc = useLocation();
  const kieuDi = useNavigationType();
  const truoc = useRef<string | null>(null);
  const cuon = useRef(0);
  const dangCuon = useRef<(() => void) | null>(null);
  useEffect(() => {
    const f = (e: Event) => { if ((e.target as HTMLElement | null)?.id === ID_CUON) cuon.current = (e.target as HTMLElement).scrollTop; };
    document.addEventListener('scroll', f, true);
    return () => document.removeEventListener('scroll', f, true);
  }, []);
  /* Layout effect: chạy ngay sau khi trang mới vẽ vào DOM, trước sự kiện cuộn của trang mới → `cuon` còn là vị trí của trang vừa rời. */
  useLayoutEffect(() => {
    const den = loc.pathname + loc.search;
    const tu = truoc.current;
    if (tu === den) return;
    const kieu: KieuDi = (loc.state as { veCha?: boolean } | null)?.veCha ? 'POP' : kieuDi;
    const r = buocMoi(chong, { tu: tu ? { url: tu, cuon: Math.round(cuon.current), ...tenCua(tu) } : null, den, kieu });
    if (r.chong !== chong) datChong(r.chong);
    dangCuon.current?.();
    dangCuon.current = null;
    const main = document.getElementById(ID_CUON);
    if (main && r.cuonVe) dangCuon.current = cuonVeViTri(main, r.cuonVe);
    truoc.current = den;
    cuon.current = main?.scrollTop ?? 0;
  }, [loc, kieuDi]);
}

const dangKy = (f: () => void) => { nghe.add(f); return () => { nghe.delete(f); }; };
/** Chồng nguồn hiện tại: [0] = nguồn đầu, sau đó các hồ sơ đã qua (không gồm trang đang xem). */
export const useChongVe = () => useSyncExternalStore(dangKy, () => chong);

/** Về một bước (URL đầy đủ của nó — cắt chồng + khôi phục cuộn do `useGhiNguon` làm), hoặc về trang cha khi chưa có nguồn. */
export function useVe() {
  const navigate = useNavigate();
  return useCallback((url: string, laCha = false) => navigate(url, laCha ? { state: { veCha: true } } : undefined), [navigate]);
}

/**
 * Trạng thái của trang nguồn nằm trên URL (Đầu ra 5) — quay lại là đúng chỗ. Ghi bằng `replace` (đổi tab con / mở hàng không thêm
 * lịch sử). Mặc định thì xoá khỏi URL.
 */
export function useThamSoUrl(ten: string, macDinh: string): [string, (v: string | ((cu: string) => string)) => void] {
  const [sp, setSp] = useSearchParams();
  const { state } = useLocation();
  const dat = (v: string | ((cu: string) => string)) => setSp((q) => {
    const n = new URLSearchParams(q);
    const moi = typeof v === 'function' ? v(q.get(ten) ?? macDinh) : v;
    if (moi === macDinh) n.delete(ten); else n.set(ten, moi);
    return n;
  }, { replace: true, state: giuDau(state) });
  return [sp.get(ten) ?? macDinh, dat];
}

/**
 * OV-13b (đặc tả OV-13 §1): panel số liệu đang mở ghi lên URL (`?so-lieu=<khoá>`) — "Xem hồ sơ ↗" rồi "‹ Tổng quan" mở lại đúng panel (chồng nguồn
 * giữ URL). `khoa` = mã chỉ số (+ bộ lọc phụ) của nơi gọi. M6 6b-1: mở = PUSH (Back trình duyệt ở view gốc đóng panel, không rời trang); đóng = lùi
 * đúng số mục panel đã push (về URL trước khi mở); mở bằng link sâu thì bỏ tham số bằng replace.
 */
export function useMoSoLieu(khoa: string): [boolean, (mo: boolean) => void] {
  const [sp, setSp] = useSearchParams();
  const { state } = useLocation();
  const navigate = useNavigate();
  return [sp.get('so-lieu') === khoa, (mo) => {
    if (mo) {
      setSp((q) => { const n = new URLSearchParams(q); n.set('so-lieu', khoa); n.delete('dong'); n.delete('xem'); return n; }, { state: { panelSau: 1 } });
      return;
    }
    if (sp.get('so-lieu') !== khoa) return;
    const lui = soMucPanel(state);
    if (lui) navigate(-lui);
    else setSp((q) => { const n = new URLSearchParams(q); n.delete('so-lieu'); n.delete('dong'); n.delete('xem'); return n; }, { replace: true });   // đóng = bỏ cả dòng, chuỗi view
  }];
}

/** Dấu ngăn xếp panel trên mục lịch sử (`xem`, `panelSau`) — giữ qua mọi replace của panel; dấu khác (`veCha`) không mang theo như trước. */
const giuDau = (st: unknown) => {
  const s = st as { xem?: unknown; panelSau?: unknown } | null;
  return s && (s.xem !== undefined || s.panelSau !== undefined) ? { xem: s.xem, panelSau: s.panelSau } : undefined;
};

/** Panel mở từ URL dựng chuỗi `?xem=` cho panel làm việc bên trong (Ngăn Case trong panel số): `ten` = tên view gốc (nhãn ‹ ở view đầu chuỗi). */
export const XemCha = createContext<{ ten: string } | null>(null);
export type NganXep = {
  ds: string[]; ten: string | null; /** Chuỗi nằm trên URL (`?xem=`). */ url: boolean;
  /** Vào view sâu hơn: push một mục lịch sử. `tuDau` = chuỗi bắt đầu lại từ view này (panel gốc mở việc của một dòng). */
  vao: (v: string, tuDau?: boolean) => void;
  /** Thay view trên cùng (lưu xong sang việc kế, "Xem Case"): replace, ‹ vẫn về view cha cũ. */
  thay: (v: string) => void;
  /** ‹ = lùi một view: history.back() khi mục này do app push từ view cha; không thì thay URL bằng view cha (link sâu, F5 sau replace). */
  lui: () => void;
};
/**
 * NGĂN XẾP VIEW CỦA PANEL (M6 6b-1, luật Quay lại): `url` (panel mở bằng URL) hoặc đang trong `XemCha` → chuỗi trên `?xem=` (Back trình duyệt lùi
 * một view, F5 dựng lại); ngoài ra chuỗi là mảng cục bộ, đầu = `dau` (nơi mở giữ view bằng state — PanelMotEm, PanelViec).
 */
export function useXem(o: { url?: boolean; dau?: string[] } = {}): NganXep {
  const cha = useContext(XemCha);
  const url = !!o.url || !!cha;
  const [sp] = useSearchParams();
  const { state } = useLocation();
  const navigate = useNavigate();
  const [cucBo, setCucBo] = useState<string[]>(o.dau ?? []);
  const ds = url ? docXem(sp.get('xem')) : cucBo;
  const ghi = (moi: string[], push: boolean) => {
    if (!url) { setCucBo(moi); return; }
    const n = new URLSearchParams(sp);
    if (moi.length) n.set('xem', moi.join('.')); else n.delete('xem');
    navigate(`?${n}`, push ? { state: { xem: moi.length, panelSau: soMucPanel(state) + 1 } } : { replace: true, state: giuDau(state) });
  };
  return {
    ds, ten: cha?.ten ?? null, url,
    vao: (v, tuDau = false) => ghi([...(tuDau ? [] : ds), v], true),
    thay: (v) => ghi([...ds.slice(0, -1), v], false),
    lui: () => (url && luiBangBack(state, ds.length) ? navigate(-1) : ghi(ds.slice(0, -1), false)),
  };
}

/** Tập hàng đang mở ghi lên URL (`?mo=a,b`); `setMo` nhận giá trị hoặc hàm như `useState`. */
export function useTapUrl(ten: string): [Set<string>, (v: Set<string> | ((s: Set<string>) => Set<string>)) => void] {
  const [chu, datChu] = useThamSoUrl(ten, '');
  const tach = (x: string) => new Set(x ? x.split(',') : []);
  return [tach(chu), (v) => datChu((cu) => [...(typeof v === 'function' ? v(tach(cu)) : v)].join(','))];
}
