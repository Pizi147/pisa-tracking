import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useSession } from '../lib/session.tsx';
import { useApi } from '../lib/useApi.ts';
import { api } from '../lib/api.ts';
import { Pill } from './ui.tsx';
import { ROLE_LABEL, SCOPE_LABEL } from '@shared/domain.ts';
import { fmtDateTime } from '../lib/format.ts';

const CRUMB: Record<string, string> = {
  '': 'Tổng quan', 'hoc-vien': 'Học viên', 'lop-hoc': 'Lớp học', 'van-de': 'Vấn đề',
  'cong-viec': 'Công việc', 'bao-cao': 'Báo cáo', 'cuoc-hop': 'Cuộc họp', 'quan-tri': 'Quản trị',
};

type SearchHit = { id: number; studentCode: string; fullName: string; enrollments: { classCode: string }[] };

export function Header() {
  const { session, signOut, viewRole, setViewRole } = useSession();
  const location = useLocation();
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const [openMenu, setOpenMenu] = useState<null | 'account' | 'notif'>(null);
  const [hits, setHits] = useState<SearchHit[]>([]);
  const boxRef = useRef<HTMLDivElement>(null);
  const notifications = useApi<any[]>('/notifications');

  const segments = location.pathname.split('/').filter(Boolean);
  const crumb = CRUMB[segments[0] ?? ''] ?? 'Tổng quan';

  useEffect(() => {
    if (q.trim().length < 2) { setHits([]); return; }
    const t = setTimeout(() => {
      api.get<{ rows: SearchHit[] }>(`/students?q=${encodeURIComponent(q)}&limit=8`)
        .then((d) => setHits(d.rows ?? []))
        .catch(() => setHits([]));
    }, 250);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) { setHits([]); setOpenMenu(null); }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const unread = useMemo(() => (notifications.data ?? []).filter((n) => !n.read_at).length, [notifications.data]);
  const roles = session?.roles ?? [];
  const coreClasses = (session?.teacherAssignments ?? []).filter((a) => a.isCore);

  return (
    <header className="h-14 shrink-0 border-b bg-[#0b141d] flex items-center gap-3 px-4" style={{ borderColor: 'var(--line)' }}>
      <nav aria-label="Đường dẫn" className="text-sm text-slate-400 hidden md:block">
        <Link to="/" className="link">PISA</Link>
        <span className="mx-1.5 text-slate-600">/</span>
        <span className="text-slate-200">{crumb}</span>
      </nav>

      <div className="flex-1 max-w-md relative" ref={boxRef}>
        <input
          className="field"
          placeholder="Tìm học viên theo tên (có/không dấu) hoặc mã HV…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          aria-label="Tìm kiếm trong phạm vi được cấp quyền"
        />
        {hits.length > 0 && (
          <ul className="absolute z-40 mt-1 w-full card overflow-hidden shadow-2xl">
            {hits.map((h) => (
              <li key={h.id}>
                <button
                  className="w-full text-left px-3 py-2 hover:bg-white/5 text-sm"
                  onClick={() => { navigate(`/hoc-vien/${h.id}`); setQ(''); setHits([]); }}
                >
                  <span className="text-slate-100">{h.fullName}</span>
                  <span className="text-slate-500 text-xs ml-2">{h.studentCode}</span>
                  <span className="text-slate-500 text-xs ml-2">{h.enrollments.map((e) => e.classCode).join(', ')}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <button className="btn btn-sm relative" onClick={() => setOpenMenu(openMenu === 'notif' ? null : 'notif')} aria-label="Thông báo">
        Thông báo
        {unread > 0 && <span className="ml-1 rounded bg-teal-500/25 text-teal-200 px-1.5 text-[10px]">{unread}</span>}
      </button>

      <div className="relative">
        <button className="btn btn-sm" onClick={() => setOpenMenu(openMenu === 'account' ? null : 'account')}>
          <span className="text-slate-200">{session?.user?.fullName}</span>
        </button>
        {openMenu === 'account' && (
          <div className="absolute right-0 mt-1 w-80 card p-3 z-40 shadow-2xl">
            <div className="text-sm font-medium text-slate-100">{session?.user?.fullName}</div>
            <div className="text-xs text-slate-500 mb-3">{session?.user?.title}</div>

            <div className="label">Góc nhìn</div>
            <p className="text-[11px] text-slate-500 mb-2">Chỉ đổi menu và trang mở đầu. Quyền thực tế không thay đổi.</p>
            <div className="flex flex-wrap gap-1 mb-3">
              {roles.map((r) => (
                <button key={r} className={`btn btn-sm ${viewRole === r ? 'btn-primary' : ''}`} onClick={() => setViewRole(r)}>
                  {ROLE_LABEL[r] ?? r}
                </button>
              ))}
              {roles.length === 0 && <span className="text-xs text-slate-500">Chưa có vai trò nào.</span>}
            </div>

            <div className="label">Phạm vi được cấp</div>
            <ul className="space-y-1 mb-3">
              {(session?.grants ?? []).map((g) => (
                <li key={g.id} className="text-xs text-slate-300">
                  <Pill tone="neutral">{ROLE_LABEL[g.role] ?? g.role}</Pill>
                  <span className="text-slate-500 ml-1">{g.scopeLabel ?? SCOPE_LABEL[g.scopeType as keyof typeof SCOPE_LABEL]}</span>
                </li>
              ))}
            </ul>

            {coreClasses.length > 0 && (
              <>
                <div className="label">Chủ nhiệm (GVCN)</div>
                <div className="flex flex-wrap gap-1 mb-3">
                  {coreClasses.map((c) => <Pill key={c.classId} tone="info">GVCN {c.classCode}</Pill>)}
                </div>
              </>
            )}

            <button className="btn btn-sm w-full justify-center" onClick={signOut}>Thoát tài khoản demo</button>
          </div>
        )}
      </div>

      {openMenu === 'notif' && (
        <div className="absolute right-4 top-[6.2rem] w-96 card z-40 shadow-2xl max-h-96 overflow-y-auto">
          <div className="px-3 py-2 border-b text-xs text-slate-400" style={{ borderColor: 'var(--line)' }}>
            Chỉ hiển thị việc cần hành động
          </div>
          {(notifications.data ?? []).length === 0 && <div className="p-4 text-sm text-slate-500">Không có thông báo nào.</div>}
          {(notifications.data ?? []).map((n) => (
            <button
              key={n.id}
              className="block w-full text-left px-3 py-2 border-b hover:bg-white/5"
              style={{ borderColor: 'var(--line)' }}
              onClick={async () => {
                await api.post(`/notifications/${n.id}/read`);
                notifications.reload();
                if (n.entity_type === 'task') navigate(`/cong-viec?open=${n.entity_id}`);
                if (n.entity_type === 'issue') navigate(`/van-de?open=${n.entity_id}`);
                setOpenMenu(null);
              }}
            >
              <div className="text-sm text-slate-200 flex items-center gap-2">
                {!n.read_at && <span className="w-1.5 h-1.5 rounded-full bg-teal-400 shrink-0" />}
                {n.title}
              </div>
              <div className="text-xs text-slate-500 truncate">{n.body}</div>
              <div className="text-[10px] text-slate-600 mt-0.5">{fmtDateTime(n.created_at)}</div>
            </button>
          ))}
        </div>
      )}
    </header>
  );
}
