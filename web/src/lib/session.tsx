import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, invalidateAll } from './api.ts';
import { datNguoiDungKhung } from '../ui/CongTacKhung.tsx';
import type { NavQuyen } from '@shared/domain/index.ts';

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
};

type Ctx = {
  session: Session | null;
  loading: boolean;
  reload: () => Promise<void>;
  switchAccount: (userId: number) => Promise<void>;
  signOut: () => Promise<void>;
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
      const loi = e instanceof Error ? e.message : 'Không gọi được máy chủ.';
      setSession((cu) => cu?.authenticated ? { ...cu, loiKetNoi: loi } : { authenticated: false, demoDate: '', scenario: 'normal', loiKetNoi: loi });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void reload(); }, [reload]);
  /* Q7: khung đã nhớ (CongTacKhung) theo người — đặt trước khi trang con đọc. */
  datNguoiDungKhung(session?.user?.id ?? null);

  const switchAccount = useCallback(async (userId: number) => {
    await api.post('/demo/session', { userId });
    invalidateAll();          // dữ liệu của tài khoản cũ không được dùng lại cho phạm vi mới
    setSession(null);
    setLoading(true);
    const s = await api.get<Session>('/demo/session');
    setSession(s);
    setLoading(false);
    navigate(s.landing ?? '/', { replace: true });
  }, [navigate]);

  const signOut = useCallback(async () => {
    await api.del('/demo/session');
    invalidateAll();
    setSession(null);
    await reload();
    navigate('/', { replace: true });
  }, [navigate, reload]);

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
    () => ({ session, loading, reload, switchAccount, signOut, can, branchCount }),
    [session, loading, reload, switchAccount, signOut, can, branchCount],
  );
  return <SessionCtx.Provider value={value}>{children}</SessionCtx.Provider>;
}
