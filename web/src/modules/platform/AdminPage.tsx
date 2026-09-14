import { useState } from 'react';
import { useApi } from '../../lib/useApi.ts';
import { Card, ErrorState, Info, SectionNote, Skeleton } from '../../ui/ui.tsx';
import { AccountsAdmin } from './AccountsAdmin.tsx';
import { CatalogAdmin } from './CatalogAdmin.tsx';
import { fmtDateTime, roleLabel } from '../../lib/format.ts';

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

/**
 * QUẢN TRỊ HỆ THỐNG — ba việc khác hẳn nhau, nên ba tab thay vì một trang dài.
 *
 *   TÀI KHOẢN  duyệt đăng ký, tạo tài khoản, cấp vai và quyền riêng (mục 7.1, 7.3).
 *   DANH MỤC   lộ trình và loại lớp — nay là dữ liệu, không còn là hằng số trong mã (7.3).
 *   CẤU HÌNH   bảng quyền theo vai, đơn vị báo cáo, nhật ký thay đổi.
 *
 * Đây là quản trị PHẦN MỀM — khác với Admin chi nhánh là nhân sự văn phòng.
 */
const TABS = [
  { key: 'accounts', label: 'Tài khoản' },
  { key: 'catalog', label: 'Lộ trình và loại lớp' },
  { key: 'config', label: 'Quyền và nhật ký' },
] as const;

export default function AdminPage() {
  const [tab, setTab] = useState<(typeof TABS)[number]['key']>('accounts');
  const { data, loading, error, reload } = useApi<AdminData>(tab === 'config' ? '/admin/overview' : null, [tab]);

  return (
    <div className="page space-y-4">
      <div>
        <h1 className="text-lg font-semibold text-slate-100">Quản trị hệ thống</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Tài khoản, danh mục và cấu hình quyền. Đây là quản trị <strong>phần mềm</strong> — khác với
          Admin chi nhánh là nhân sự văn phòng.
        </p>
      </div>

      <div className="flex flex-wrap gap-1 border-b pb-2" style={{ borderColor: 'var(--line)' }}>
        {TABS.map((t) => (
          <button key={t.key} type="button" onClick={() => setTab(t.key)}
            className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
              tab === t.key
                ? 'bg-[color:var(--accent-soft)] text-[color:var(--accent-strong)] border-[color:var(--accent-line)]'
                : 'text-slate-300 border-transparent hover:bg-white/5'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'accounts' && <AccountsAdmin />}
      {tab === 'catalog' && <CatalogAdmin />}
      {tab === 'config' && error && <ErrorState message={error.message} hint={error.hint} onRetry={reload} />}
      {tab === 'config' && (loading || !data) && !error && <Skeleton rows={8} />}
      {tab === 'config' && data && <ConfigTab data={data} />}
    </div>
  );
}

function ConfigTab({ data }: { data: AdminData }) {
  return (
    <div className="space-y-4">

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
                <Info>{u.kind === 'branch' ? 'Chi nhánh' : 'Đơn vị độc lập'}</Info>
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

    </div>
  );
}
