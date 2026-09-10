import { useApi } from '../lib/useApi.ts';
import { Card, ErrorState, Pill, SectionNote, Skeleton } from '../components/ui.tsx';
import { fmtDateTime, roleLabel } from '../lib/format.ts';

type AdminData = {
  roles: { id: number; key: string; name: string }[];
  permissions: { id: number; key: string; name: string }[];
  matrix: Record<string, string[]>;
  users: { id: number; code: string; fullName: string; title: string | null; grants: { role: string; roleName: string; scope: string }[]; assignments: number }[];
  branches: { id: number; code: string; name: string }[];
  units: { id: number; code: string; name: string; kind: string; branchId: number | null }[];
  counts: { students: number; classes: number; attempts: number; cases: number };
  audit: { id: number; action: string; entityType: string; entityLabel: string | null; createdAt: string; actorName: string | null }[];
};

/** Lối vào phụ, chỉ dành cho Quản trị hệ thống. Nơi xem cấu hình, không phải một mục nghiệp vụ. */
export default function AdminPage() {
  const { data, loading, error, reload } = useApi<AdminData>('/admin/overview');
  if (error) return <ErrorState message={error.message} hint={error.hint} onRetry={reload} />;
  if (loading || !data) return <Skeleton rows={8} />;

  return (
    <div className="page space-y-4">
      <div>
        <h1 className="text-lg font-semibold text-slate-100">Quản trị hệ thống</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Xem cấu hình vai trò, phạm vi và nhật ký thay đổi của bản demo.
          Đây là quản trị <strong>phần mềm</strong> — khác với Admin chi nhánh là nhân sự văn phòng.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-4">
        {[
          ['Học viên', data.counts.students], ['Lớp', data.counts.classes],
          ['Lượt Mock', data.counts.attempts], ['Case SOS', data.counts.cases],
        ].map(([label, value]) => (
          <div key={label as string} className="card p-4">
            <div className="text-[11px] uppercase tracking-wide text-slate-400 font-semibold">{label}</div>
            <div className="mt-1 text-2xl font-semibold tabular-nums text-slate-100">{value}</div>
          </div>
        ))}
      </div>

      <Card title="Quyền theo vai trò" bodyClass="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="th sticky-col">Quyền</th>
                {data.roles.map((r) => <th key={r.key} className="th text-center">{r.name}</th>)}
              </tr>
            </thead>
            <tbody>
              {data.permissions.map((p) => (
                <tr key={p.key} className="row-hover">
                  <td className="td sticky-col text-slate-200">{p.name} <span className="text-[11px] text-slate-500">{p.key}</span></td>
                  {data.roles.map((r) => (
                    <td key={r.key} className="td text-center">
                      {data.matrix[r.key]?.includes(p.key)
                        ? <span className="text-sky-200">có</span>
                        : <span className="text-slate-600">—</span>}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-3">
          <SectionNote>
            Quyền = quyền của vai trò × phạm vi chi nhánh của CHÍNH grant đó × phân công lớp/kỹ năng.
            Không vai trò nào mặc định thấy toàn hệ thống: chỉ grant không gắn chi nhánh mới phủ toàn bộ.
          </SectionNote>
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Đơn vị báo cáo">
          <ul className="text-sm space-y-1.5 list-none p-0 m-0">
            {data.units.map((u) => (
              <li key={u.id} className="flex items-center gap-2">
                <span className="text-slate-100">{u.name}</span>
                <Pill tone={u.kind === 'branch' ? 'neutral' : 'info'}>{u.kind === 'branch' ? 'Chi nhánh' : 'Đơn vị độc lập'}</Pill>
              </li>
            ))}
          </ul>
          <SectionNote>Tutor part-time là đơn vị báo cáo riêng, không phải chi nhánh thứ sáu.</SectionNote>
        </Card>

        <Card title="Nhật ký thay đổi gần nhất" bodyClass="p-0">
          <ul className="divide-y list-none p-0 m-0 max-h-96 overflow-y-auto" style={{ borderColor: 'var(--line)' }}>
            {data.audit.map((a) => (
              <li key={a.id} className="px-4 py-2 text-xs">
                <span className="text-slate-200">{a.action}</span>
                <span className="text-slate-500"> · {a.entityLabel ?? a.entityType}</span>
                <div className="text-slate-500">{a.actorName ?? '—'} · {fmtDateTime(a.createdAt)}</div>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <Card title="Tài khoản demo" bodyClass="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="th">Mã</th><th className="th">Họ tên</th><th className="th">Chức danh</th>
                <th className="th">Vai trò · phạm vi</th><th className="th">Phân công lớp</th>
              </tr>
            </thead>
            <tbody>
              {data.users.map((u) => (
                <tr key={u.id} className="row-hover">
                  <td className="td text-xs text-slate-500">{u.code}</td>
                  <td className="td text-slate-100">{u.fullName}</td>
                  <td className="td text-slate-400 text-xs">{u.title}</td>
                  <td className="td">
                    <span className="flex flex-wrap gap-1">
                      {u.grants.map((g, i) => <Pill key={i} tone="neutral">{roleLabel(g.role)} · {g.scope}</Pill>)}
                    </span>
                  </td>
                  <td className="td tabular-nums text-slate-300">{u.assignments || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
