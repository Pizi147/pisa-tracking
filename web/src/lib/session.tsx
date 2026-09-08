import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, invalidateAll } from './api.ts';

export type Grant = {
  id: number; role: string; roleName: string; scopeType: string;
  scopeId: number | null; scopeLabel: string | null; permissions: string[];
};

export type Session = {
  authenticated: boolean;
  user?: { id: number; code: string; fullName: string; title: string | null; email: string | null };
  roles?: string[];
  grants?: Grant[];
  teacherAssignments?: { classId: number; classCode: string; className: string; skill: string | null; isCore: boolean }[];
  consultantStudentCount?: number;
  demoDate: string;
  scenario: string;
  signalPolicy?: any;
  capabilities?: Record<string, boolean>;
};

type Ctx = {
  session: Session | null;
  loading: boolean;
  reload: () => Promise<void>;
  switchAccount: (userId: number) => Promise<void>;
  signOut: () => Promise<void>;
  viewRole: string | null;
  setViewRole: (r: string | null) => void;
  can: (permission: string) => boolean;
};

const SessionCtx = createContext<Ctx>(null as unknown as Ctx);
export const useSession = () => useContext(SessionCtx);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewRole, setViewRoleState] = useState<string | null>(null);
  const navigate = useNavigate();

  const reload = useCallback(async () => {
    const s = await api.get<Session>('/demo/session');
    setSession(s);
    setLoading(false);
    setViewRoleState((prev) => (prev && s.roles?.includes(prev) ? prev : (s.roles?.[0] ?? null)));
  }, []);

  useEffect(() => { void reload(); }, [reload]);

  const switchAccount = useCallback(async (userId: number) => {
    await api.post('/demo/session', { userId });
    // Đổi tài khoản: xoá toàn bộ cache của tài khoản cũ trước khi tải scope mới.
    invalidateAll();
    setSession(null);
    setViewRoleState(null);
    setLoading(true);
    const s = await api.get<Session>('/demo/session');
    setSession(s);
    setViewRoleState(s.roles?.[0] ?? null);
    setLoading(false);
    navigate(landingPathFor(s), { replace: true });
  }, [navigate]);

  const signOut = useCallback(async () => {
    await api.del('/demo/session');
    invalidateAll();
    setSession(null);
    setViewRoleState(null);
    await reload();
    navigate('/', { replace: true });
  }, [navigate, reload]);

  /** Chỉ dùng để hiện/ẩn giao diện. Quyền thật luôn do API quyết định. */
  const can = useCallback(
    (permission: string) => !!session?.grants?.some((g) => g.permissions.includes(permission)),
    [session],
  );

  const value = useMemo<Ctx>(
    () => ({ session, loading, reload, switchAccount, signOut, viewRole, setViewRole: setViewRoleState, can }),
    [session, loading, reload, switchAccount, signOut, viewRole, can],
  );
  return <SessionCtx.Provider value={value}>{children}</SessionCtx.Provider>;
}

/** Trang mở đầu theo vai trò — chỉ đổi điểm vào, không đổi quyền. */
export function landingPathFor(s: Session | null): string {
  if (!s?.authenticated) return '/';
  const c = s.capabilities ?? {};
  if (c.isConsultantOnly) return '/hoc-vien';
  if (c.manageIssues || c.manageReports) return '/';
  if (c.isTeacher) return '/';
  return '/';
}
