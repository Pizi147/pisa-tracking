import { useState } from 'react';
import { useApi } from '../lib/useApi.ts';
import { useSession } from '../lib/session.tsx';
import { Pill } from '../components/ui.tsx';

import { ROLES, ROLE_LABEL, type Role } from '@shared/domain.ts';

type Account = {
  id: number; code: string; fullName: string; title: string | null;
  grants: { role: string; roleName: string; scope: string }[];
  assignmentCount: number;
};

/** Hướng dẫn tại chỗ khi bản demo chưa có dữ liệu — viết cho người không rành kỹ thuật. */
function SetupHelp({ serverDown, onRetry }: { serverDown: boolean; onRetry: () => void }) {
  return (
    <div className="card p-5 border-amber-500/40">
      <h2 className="text-base font-semibold text-amber-300">
        {serverDown ? 'Chưa kết nối được máy chủ dữ liệu' : 'Chưa có dữ liệu mẫu trong máy'}
      </h2>
      <p className="text-sm text-slate-300 mt-2 leading-relaxed">
        {serverDown
          ? 'Giao diện đã chạy nhưng phần máy chủ dữ liệu thì chưa. Thường là do cửa sổ dòng lệnh đã bị đóng hoặc bị dừng.'
          : 'Ứng dụng đã chạy đúng, chỉ là chưa có tài khoản và dữ liệu mẫu nào để hiển thị. Bạn cần tạo dữ liệu mẫu một lần.'}
      </p>

      <ol className="mt-4 space-y-3 text-sm text-slate-300">
        <li>
          <span className="text-slate-100 font-medium">1. Mở cửa sổ dòng lệnh đang chạy ứng dụng</span>
          <div className="text-slate-400 text-xs mt-0.5">
            Đó là cửa sổ màu xanh đen bạn đã gõ lệnh lúc nãy. Nếu đã đóng, mở lại theo hướng dẫn ở tệp README.
          </div>
        </li>
        <li>
          <span className="text-slate-100 font-medium">2. Dừng ứng dụng</span>
          <div className="text-slate-400 text-xs mt-0.5">
            Bấm <kbd className="surface-2 px-1.5 py-0.5 rounded border">Ctrl</kbd> +{' '}
            <kbd className="surface-2 px-1.5 py-0.5 rounded border">C</kbd> trong cửa sổ đó.
          </div>
        </li>
        <li>
          <span className="text-slate-100 font-medium">3. Gõ lệnh tạo dữ liệu mẫu, rồi bấm Enter</span>
          <pre className="surface-2 mt-1.5 px-3 py-2 rounded text-teal-300 text-xs">npm run seed</pre>
          <div className="text-slate-400 text-xs mt-1">
            Đợi tới khi thấy dòng <span className="text-teal-300">Hoàn tất</span> kèm bảng liệt kê số lượng
            (khoảng 71 học viên, 10 lớp). Nếu hiện chữ đỏ, hãy chụp màn hình lại.
          </div>
        </li>
        <li>
          <span className="text-slate-100 font-medium">4. Chạy lại ứng dụng</span>
          <pre className="surface-2 mt-1.5 px-3 py-2 rounded text-teal-300 text-xs">npm run dev</pre>
        </li>
        <li>
          <span className="text-slate-100 font-medium">5. Quay lại trang này và bấm nút bên dưới</span>
        </li>
      </ol>

      <button className="btn btn-primary mt-4" onClick={onRetry}>Tải lại danh sách tài khoản</button>

      <p className="text-[11px] text-slate-500 mt-3 leading-relaxed">
        Lưu ý: phải gõ lệnh trong thư mục có tệp <code className="text-slate-400">package.json</code>.
        Nếu báo lỗi <code className="text-slate-400">ENOENT ... package.json</code> nghĩa là bạn đang đứng sai thư mục.
      </p>
    </div>
  );
}

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
          Chọn một tài khoản mẫu để bắt đầu. Bốn nhóm tài khoản: <strong>Quản trị hệ thống</strong> (quản phần mềm),{' '}
          <strong>Admin chi nhánh</strong> (nhân sự văn phòng), <strong>Quản lý</strong> (điều hành chuyên môn, cũng
          chính là Head khi xác nhận case SOS) và <strong>Giáo viên</strong>. Mỗi tài khoản có phạm vi khác nhau,
          giúp bạn thử cùng một màn hình dưới nhiều góc nhìn. Toàn bộ dữ liệu trong bản demo là dữ liệu giả.
        </p>
        {accounts.loading && <div className="text-slate-400">Đang tải danh sách tài khoản…</div>}

        {/* Chưa có tài khoản nào: có thể do chưa tạo dữ liệu mẫu, hoặc máy chủ dữ liệu chưa chạy.
            Trường hợp nào cũng phải nói rõ người dùng cần làm gì, không được để trang trắng. */}
        {!accounts.loading && (accounts.error || (accounts.data && accounts.data.length === 0)) && (
          <SetupHelp serverDown={accounts.error?.status === 500 || accounts.error?.status === 502} onRetry={accounts.reload} />
        )}

        {/* Nhóm theo bốn loại tài khoản để dễ tìm đúng góc nhìn muốn thử. */}
        {ROLES.map((role) => {
          const group = (accounts.data ?? []).filter((a) => a.grants.some((g) => g.role === role));
          if (!group.length) return null;
          return (
            <section key={role} className="mb-4">
              <h2 className="text-xs uppercase tracking-wide text-slate-500 font-semibold mb-2">
                {ROLE_LABEL[role as Role]} <span className="text-slate-600">({group.length})</span>
              </h2>
              <div className="grid sm:grid-cols-2 gap-2">
                {group.map((a) => (
                  <button
                    key={a.id}
                    disabled={busy !== null}
                    className="text-left card p-3 hover:border-teal-500/40 disabled:opacity-50"
                    onClick={async () => { setBusy(a.id); await switchAccount(a.id); }}
                  >
                    <div className="font-medium text-slate-100">{a.fullName}</div>
                    <div className="text-xs text-slate-400 mb-2">{a.title}</div>
                    <div className="flex flex-wrap gap-1">
                      {a.grants.map((r, i) => <Pill key={i} tone="neutral">{r.roleName} · {r.scope}</Pill>)}
                      {a.assignmentCount > 0 && <Pill tone="info">{a.assignmentCount} phân công</Pill>}
                    </div>
                  </button>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
