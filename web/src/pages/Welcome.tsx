import { useState } from 'react';
import { useApi } from '../lib/useApi.ts';
import { useSession } from '../lib/session.tsx';
import { Pill } from '../components/ui.tsx';

type Account = {
  id: number; code: string; fullName: string; title: string | null;
  roles: { role: string; roleName: string; scopeType: string; scopeLabel: string | null }[];
  teacherAssignmentCount: number; consultantStudentCount: number;
};

export default function WelcomePage() {
  const accounts = useApi<Account[]>('/demo/accounts');
  const { switchAccount } = useSession();
  const [busy, setBusy] = useState<number | null>(null);

  return (
    <div className="min-h-full flex items-center justify-center p-6">
      <div className="w-full max-w-3xl">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-9 h-9 rounded-lg bg-teal-500/15 border border-teal-500/40 grid place-items-center text-teal-300 font-bold">P</div>
          <div>
            <h1 className="text-xl font-semibold text-slate-100">PISA Progress</h1>
            <div className="text-xs text-slate-500">Hệ thống quản lý học vụ và vận hành — bản demo chạy local</div>
          </div>
          <div className="ml-auto"><Pill tone="warn">Dữ liệu demo</Pill></div>
        </div>
        <p className="text-sm text-slate-400 mt-4 mb-4 leading-relaxed">
          Chọn một tài khoản mẫu để bắt đầu. Mỗi tài khoản có phạm vi quyền khác nhau, giúp bạn thử xem cùng một màn hình
          trông như thế nào với quản lý, giáo viên và tư vấn viên. Toàn bộ dữ liệu trong bản demo là dữ liệu giả.
        </p>
        {accounts.loading && <div className="text-slate-400">Đang tải danh sách tài khoản…</div>}
        {accounts.error && <div className="text-red-300">Không tải được danh sách. Hãy chạy <code>npm run seed</code> rồi tải lại trang.</div>}
        <div className="grid sm:grid-cols-2 gap-2">
          {(accounts.data ?? []).map((a) => (
            <button
              key={a.id}
              disabled={busy !== null}
              className="text-left card p-3 hover:border-teal-500/40 disabled:opacity-50"
              onClick={async () => { setBusy(a.id); await switchAccount(a.id); }}
            >
              <div className="font-medium text-slate-100">{a.fullName}</div>
              <div className="text-xs text-slate-400 mb-2">{a.title}</div>
              <div className="flex flex-wrap gap-1">
                {a.roles.map((r, i) => (
                  <Pill key={i} tone="neutral">{r.roleName}{r.scopeLabel ? ` · ${r.scopeLabel}` : ''}</Pill>
                ))}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
