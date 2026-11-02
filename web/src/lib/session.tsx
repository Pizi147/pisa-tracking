import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, invalidateAll } from './api.ts';
import { datNguoiDungKhung } from '../ui/CongTacKhung.tsx';
import { quaRoiNhap } from '../ui/chanRoiNhap.tsx';
import { dongBoNgonNgu } from './ngonNgu.ts';
import { datChuNhap, type NavQuyen } from '@shared/domain/index.ts';
import { t } from '@shared/i18n/index.ts';

const khoPhien = () => { try { return window.sessionStorage; } catch { return null; } };

export type Grant = {
  id: number; role: string; roleName: string;
  branchId: number | null; branchName: string | null; permissions: string[];
};

export type Assignment = {
  classId: number; classCode: string | null; skill: string | null; isCore: boolean;
  /** K1-45: tên môn ngắn theo chương trình lớp, máy chủ dựng sẵn (FOU "G+V"). */
  nhanMon?: string | null;
};

export type Session = {
  authenticated: boolean;
  user?: { id: number; code: string; fullName: string; title: string | null };
  /** PR-EN: ngôn ngữ của tài khoản ('vi' | 'en'; null = chưa chọn). */
  ngonNgu?: string | null;
  /** HD-a: đã mở Hướng dẫn / bấm Ẩn dải "Mới dùng PISA TRACKING?" — nhớ theo tài khoản. */
  daXemHuongDan?: boolean;
  roles?: string[];
  roleLabels?: string[];
  grants?: Grant[];
  assignments?: Assignment[];
  demoDate: string;
  scenario: string;
  needsSeed?: boolean;
  /** Trang mở đầu theo vai trò — chỉ đổi điểm vào, không đổi quyền. */
  landing?: string;
  /** Bốn khu vực + tab con, do API quyết định theo quyền đã cấu hình (server/src/platform/nav.ts). */
  nav?: NavQuyen;
  /** Máy chủ đang chạy bản chính (`laBanChinh()`): ẩn nhãn "Bản demo nội bộ". */
  banChinh?: boolean;
  /** PR-NV (T9): chi nhánh mặc định khi chưa tự chọn — Quản lý/Quản trị theo vai, lớp mình dạy; null = Tất cả. */
  chiNhanhGoiY?: number | null;
  /** PR-PH: chỉ có ở web — lần tải lại phiên vừa lỗi mạng/máy chủ (phiên vẫn coi là còn). */
  loiKetNoi?: string;
  /** PR-OV2a: menu Góc nhìn (QL / Quản trị nắm ≥ 2 vai); null = không có. */
  gocNhin?: GocNhin | null;
  /** UX-2 (5): khung có lớp trong phạm vi người xem — công tắc Fast Track / Lớp thường. */
  khungPhamVi?: { ft: boolean; thuong: boolean };
  /** P14 DICH (N19): máy chủ có khoá dịch và không tắt — hiện nút "Dịch" cạnh chữ GV nhập. */
  dichBat?: boolean;
};

export type GocNhin = {
  /** Vai đang chọn; null = làm việc bằng mọi vai (vai gốc). */
  dangChon: string | null;
  vaiGoc: string;
  coThe: { role: string; nhan: string; phamVi: string }[];
};

type Ctx = {
  session: Session | null;
  loading: boolean;
  reload: () => Promise<void>;
  /** CHAN-ROI-NHAP-2: còn nháp chưa lưu thì hỏi trước (đổi chủ xoá mọi nháp) — `false` = người dùng Ở lại, không đổi gì. */
  switchAccount: (userId: number) => Promise<boolean>;
  signOut: () => Promise<boolean>;
  /** PR-OV2a: đổi góc nhìn (null = về vai gốc) — máy chủ lưu ở phiên, tải lại toàn bộ dữ liệu theo quyền mới. */
  doiGocNhin: (role: string | null) => Promise<boolean>;
  can: (permission: string) => boolean;
  /** Số chi nhánh người dùng được cấp — bộ lọc chi nhánh chỉ hiện khi > 1. */
  branchCount: number;
};

const SessionCtx = createContext<Ctx>(null as unknown as Ctx);
export const useSession = () => useContext(SessionCtx);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const reload = useCallback(async () => {
    try {
      setSession(await api.get<Session>('/demo/session'));
    } catch (e) {
      /*
       * PR-PH (03/10): lỗi mạng / 5xx / 503 KHÔNG có nghĩa là đã đăng xuất (cookie vẫn đúng — tải lại là vào được).
       * Đã có phiên → giữ nguyên, chỉ báo mất kết nối. Chưa có phiên (lần tải đầu) → màn chào kèm lỗi để biết đường xử lý
       * (máy chủ chưa chạy / chưa seed), như trước.
       */
      const loi = e instanceof Error ? e.message : t('Không gọi được máy chủ.');
      setSession((cu) => cu?.authenticated ? { ...cu, loiKetNoi: loi } : { authenticated: false, demoDate: '', scenario: 'normal', loiKetNoi: loi });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void reload(); }, [reload]);
  /* PR-EN: mỗi lần vào một tài khoản — đồng bộ ngôn ngữ máy ↔ tài khoản (có thể tải lại trang một lần). */
  const uid = session?.authenticated ? session.user?.id : undefined;
  useEffect(() => { if (uid) dongBoNgonNgu(session?.ngonNgu); }, [uid]);   // eslint-disable-line react-hooks/exhaustive-deps
  /* Q7: khung đã nhớ (CongTacKhung) theo người — đặt trước khi trang con đọc. */
  datNguoiDungKhung(session?.user?.id ?? null, session?.gocNhin?.dangChon ?? null, session?.khungPhamVi ?? null);
  /* NEN-PANEL (rà #530): nháp panel thuộc một người + góc nhìn — phiên đã tải (không phải lỗi mạng) mà đổi chủ thì xoá hết nháp, trước khi trang con đọc. */
  if (session && !session.loiKetNoi) datChuNhap(khoPhien(), session.authenticated ? `${session.user?.id}|${session.gocNhin?.dangChon ?? ''}` : 'khach');

  const switchAccount = useCallback((userId: number) => quaRoiNhap(async () => {
    await api.post('/demo/session', { userId });
    invalidateAll();          // dữ liệu của tài khoản cũ không được dùng lại cho phạm vi mới
    setSession(null);
    setLoading(true);
    const s = await api.get<Session>('/demo/session');
    setSession(s);
    setLoading(false);
    navigate(s.landing ?? '/', { replace: true });
  }), [navigate]);

  const signOut = useCallback(() => quaRoiNhap(async () => {
    await api.del('/demo/session');
    invalidateAll();
    setSession(null);
    await reload();
    navigate('/', { replace: true });
  }), [navigate, reload]);

  const doiGocNhin = useCallback((role: string | null) => quaRoiNhap(async () => {
    await api.put('/session/goc-nhin', { role });
    /* Như đổi tài khoản: gỡ trang của góc nhìn cũ TRƯỚC khi bỏ dữ liệu nhớ — không thì trang cũ tải lại bằng quyền mới (403). */
    setSession(null);
    setLoading(true);
    invalidateAll();
    await reload();
    navigate('/', { replace: true });
  }), [navigate, reload]);

  /** Chỉ dùng để hiện/ẩn giao diện. Quyền thật luôn do API quyết định. */
  const can = useCallback(
    (permission: string) => !!session?.grants?.some((g) => g.permissions.includes(permission)),
    [session],
  );

  const branchCount = useMemo(() => {
    const g = session?.grants ?? [];
    if (g.some((x) => x.branchId === null)) return 99;   // toàn hệ thống
    return new Set(g.map((x) => x.branchId)).size;
  }, [session]);

  const value = useMemo<Ctx>(
    () => ({ session, loading, reload, switchAccount, signOut, doiGocNhin, can, branchCount }),
    [session, loading, reload, switchAccount, signOut, doiGocNhin, can, branchCount],
  );
  return <SessionCtx.Provider value={value}>{children}</SessionCtx.Provider>;
}
