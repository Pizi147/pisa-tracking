import { useState } from 'react';
import { useApi } from '../../lib/useApi.ts';
import { api } from '../../lib/api.ts';
import { useSession } from '../../lib/session.tsx';
import { Field, Pill, SectionNote } from '../../ui/ui.tsx';
import { skillLabel } from '../../lib/format.ts';

import { ROLES, ROLE_LABEL, type Role } from '@shared/domain/index.ts';

type Account = {
  id: number; code: string; fullName: string; title: string | null;
  grants: { role: string; roleName: string; scope: string }[];
  assignmentCount: number;
};
type AuthInfo = {
  emailSuffix: string;
  demoAdmin: { email: string; password: string };
  skills: string[];
};

/** Hướng dẫn tại chỗ khi bản demo chưa có dữ liệu — viết cho người không rành kỹ thuật. */
function SetupHelp({ serverDown, onRetry }: { serverDown: boolean; onRetry: () => void }) {
  return (
    <div className="card p-5 border-amber-300/40">
      <h2 className="text-base font-semibold text-amber-200">
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
          <pre className="surface-2 mt-1.5 px-3 py-2 rounded text-sky-200 text-xs">npm run seed</pre>
          <div className="text-slate-400 text-xs mt-1">
            Đợi tới khi thấy dòng <span className="text-sky-200">Hoàn tất</span> kèm bảng liệt kê số lượng
            (khoảng 62 học viên, 9 lớp). Nếu hiện chữ đỏ, hãy chụp màn hình lại.
          </div>
        </li>
        <li>
          <span className="text-slate-100 font-medium">4. Chạy lại ứng dụng</span>
          <pre className="surface-2 mt-1.5 px-3 py-2 rounded text-sky-200 text-xs">npm run dev</pre>
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

/**
 * MÀN VÀO HỆ THỐNG — ba đường, và chúng khác nhau thật chứ không phải ba cái tên.
 *
 *   ĐĂNG NHẬP     email + mật khẩu, đường thật của mọi người dùng (mục 7.1).
 *   ĐĂNG KÝ       giáo viên tự khai chi nhánh, vào hàng đợi chờ Quản trị hệ thống duyệt.
 *   TÀI KHOẢN DEMO  bấm một cái là vào — GIỮ LẠI vì owner mở cùng một màn hình bằng bốn con
 *                 mắt khác nhau liên tục, và bắt gõ mật khẩu mỗi lần đổi vai là bắt làm một
 *                 việc vô nghĩa hai mươi lần một buổi.
 *
 * Cả ba đường cùng tạo một phiên như nhau, nên không có hai cơ chế đăng nhập song song.
 */
export default function WelcomePage() {
  const accounts = useApi<Account[]>('/demo/accounts');
  const info = useApi<AuthInfo>('/auth/info');
  const [mode, setMode] = useState<'login' | 'register' | 'demo'>('login');

  const serverDown = accounts.error?.status === 500 || accounts.error?.status === 502;
  const noData = !accounts.loading && (accounts.error || (accounts.data && accounts.data.length === 0));

  return (
    <div className="min-h-full flex items-start justify-center p-6">
      <div className="w-full max-w-3xl">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-9 h-9 rounded-lg bg-sky-300/12 border border-sky-300/40 grid place-items-center text-sky-200 font-bold">P</div>
          <div>
            <h1 className="text-xl font-semibold text-slate-100">PISA Progress</h1>
            <div className="text-xs text-slate-500">Hệ thống quản lý học vụ và vận hành — bản demo chạy local</div>
          </div>
          <div className="ml-auto"><Pill tone="warn">Dữ liệu demo</Pill></div>
        </div>

        {noData ? (
          <div className="mt-4"><SetupHelp serverDown={!!serverDown} onRetry={accounts.reload} /></div>
        ) : (
          <>
            <div className="flex flex-wrap gap-1 mt-5 mb-4 border-b pb-2" style={{ borderColor: 'var(--line)' }}>
              <Tab active={mode === 'login'} onClick={() => setMode('login')}>Đăng nhập</Tab>
              <Tab active={mode === 'register'} onClick={() => setMode('register')}>Giáo viên đăng ký</Tab>
              <Tab active={mode === 'demo'} onClick={() => setMode('demo')}>Vào nhanh bằng tài khoản demo</Tab>
            </div>

            {mode === 'login' && <LoginForm info={info.data ?? null} />}
            {mode === 'register' && <RegisterForm info={info.data ?? null} onDone={() => setMode('login')} />}
            {mode === 'demo' && <DemoAccounts accounts={accounts.data ?? []} loading={accounts.loading} />}
          </>
        )}
      </div>
    </div>
  );
}

function Tab({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick}
      className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
        active
          ? 'bg-[color:var(--accent-soft)] text-[color:var(--accent-strong)] border-[color:var(--accent-line)]'
          : 'text-slate-300 border-transparent hover:bg-white/5'
      }`}>
      {children}
    </button>
  );
}

function LoginForm({ info }: { info: AuthInfo | null }) {
  const { reload } = useSession();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setErr(null);
    try {
      await api.post('/auth/login', { email, password });
      await reload();
    } catch (x: any) { setErr(x.message); } finally { setBusy(false); }
  };

  return (
    <form className="card p-5 space-y-4" onSubmit={submit}>
      <Field label="Email của trung tâm" required
        hint={info ? `Phải có đuôi "${info.emailSuffix}", ví dụ dung${info.emailSuffix}.` : undefined}>
        <input className="field w-full" type="email" autoComplete="username" value={email}
          onChange={(e) => setEmail(e.target.value)} placeholder={info ? `ten${info.emailSuffix}` : 'email'} />
      </Field>
      <Field label="Mật khẩu" required>
        <input className="field w-full" type="password" autoComplete="current-password" value={password}
          onChange={(e) => setPassword(e.target.value)} />
      </Field>

      {err && <p className="text-sm text-rose-200 m-0">{err}</p>}

      <button className="btn btn-primary w-full" disabled={busy || !email || !password}>
        {busy ? 'Đang vào…' : 'Đăng nhập'}
      </button>

      {/*
        MẬT KHẨU DEMO HIỆN RÕ. Đây là bản demo nội bộ chạy trên máy của chính owner; giấu nó
        đi chỉ tạo ra một câu hỏi phải nhắn tin mới trả lời được.
      */}
      {info && (
        <SectionNote>
          Tài khoản <strong>Quản trị hệ thống</strong> mặc định: <code className="text-sky-200">{info.demoAdmin.email}</code>{' '}
          · mật khẩu <code className="text-sky-200">{info.demoAdmin.password}</code>. Mọi tài khoản mẫu khác
          dùng chung mật khẩu đó, email theo mẫu <code className="text-slate-300">ten.ho{info.emailSuffix}</code>.
          Bản demo không gửi email thật và không có luồng quên mật khẩu — quên thì Quản trị hệ thống đặt lại hộ.
        </SectionNote>
      )}
    </form>
  );
}

function RegisterForm({ info, onDone }: { info: AuthInfo | null; onDone: () => void }) {
  const branches = useApi<{ code: string; name: string }[]>('/auth/branches');
  const [form, setForm] = useState({ fullName: '', email: '', password: '', phone: '', note: '' });
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [skills, setSkills] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const toggle = (set: Set<string>, k: string, fn: (s: Set<string>) => void) => {
    const next = new Set(set);
    if (next.has(k)) next.delete(k); else next.add(k);
    fn(next);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setErr(null);
    try {
      await api.post('/auth/register', {
        ...form, branches: [...picked], skills: [...skills],
      });
      setDone(true);
    } catch (x: any) { setErr(x.message); } finally { setBusy(false); }
  };

  if (done) {
    return (
      <div className="card p-5">
        <h2 className="text-base font-semibold text-slate-100 m-0">Đã gửi đăng ký</h2>
        <p className="text-sm text-slate-300 mt-2 leading-relaxed">
          Tài khoản của bạn đang <strong>chờ Quản trị hệ thống duyệt</strong>. Sau khi được duyệt bạn đăng nhập
          bằng chính email và mật khẩu vừa đặt. Trước đó, đăng nhập sẽ báo là đang chờ duyệt — đó là trạng thái
          bình thường, không phải lỗi.
        </p>
        <button className="btn mt-4" onClick={onDone}>Về màn đăng nhập</button>
      </div>
    );
  }

  return (
    <form className="card p-5 space-y-4" onSubmit={submit}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Họ và tên" required>
          <input className="field w-full" value={form.fullName}
            onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
        </Field>
        <Field label="Số điện thoại">
          <input className="field w-full" value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        </Field>
        <Field label="Email của trung tâm" required
          hint={info ? `Chỉ email đuôi "${info.emailSuffix}" mới hợp lệ.` : undefined}>
          <input className="field w-full" type="email" value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder={info ? `ten${info.emailSuffix}` : 'email'} />
        </Field>
        <Field label="Mật khẩu" required hint="Ít nhất 6 ký tự.">
          <input className="field w-full" type="password" autoComplete="new-password" value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })} />
        </Field>
      </div>

      {/*
        CHI NHÁNH LÀ ĐỀ NGHỊ, KHÔNG PHẢI QUYẾT ĐỊNH. Nói thẳng điều đó ngay ở đây để không ai
        tưởng mình vừa tự cấp cho mình quyền vào năm chi nhánh.
      */}
      <Field label="Chi nhánh bạn đang hoạt động" required
        hint="Đây là đề nghị của bạn — người duyệt sửa lại được trước khi đồng ý.">
        <div className="flex flex-wrap gap-1.5">
          {(branches.data ?? []).map((b) => (
            <button key={b.code} type="button"
              className={`btn btn-sm ${picked.has(b.code) ? 'btn-primary' : ''}`}
              onClick={() => toggle(picked, b.code, setPicked)}>
              {b.name}
            </button>
          ))}
        </div>
      </Field>

      <Field label="Kỹ năng bạn phụ trách được" hint="Dùng để gợi ý khi phân công lớp. Bỏ trống cũng được.">
        <div className="flex flex-wrap gap-1.5">
          {(info?.skills ?? []).map((s) => (
            <button key={s} type="button"
              className={`btn btn-sm ${skills.has(s) ? 'btn-primary' : ''}`}
              onClick={() => toggle(skills, s, setSkills)}>
              {skillLabel(s)}
            </button>
          ))}
        </div>
      </Field>

      <Field label="Ghi chú cho người duyệt">
        <input className="field w-full" value={form.note} placeholder="Ví dụ: dạy ca tối thứ 3, 5, 7"
          onChange={(e) => setForm({ ...form, note: e.target.value })} />
      </Field>

      {err && <p className="text-sm text-rose-200 m-0">{err}</p>}

      <button className="btn btn-primary w-full" disabled={busy || !form.fullName || !form.email || !form.password}>
        {busy ? 'Đang gửi…' : 'Gửi đăng ký'}
      </button>
    </form>
  );
}

function DemoAccounts({ accounts, loading }: { accounts: Account[]; loading: boolean }) {
  const { switchAccount } = useSession();
  const [busy, setBusy] = useState<number | null>(null);

  return (
    <div>
      <p className="text-sm text-slate-400 mb-4 leading-relaxed">
        Bấm một tài khoản để vào ngay, không cần mật khẩu. Bốn nhóm: <strong>Quản trị hệ thống</strong> (quản
        phần mềm), <strong>Admin chi nhánh</strong> (nhân sự văn phòng), <strong>Quản lý</strong> (điều hành
        chuyên môn) và <strong>Giáo viên</strong>. Mỗi tài khoản có phạm vi khác nhau, để thử cùng một màn hình
        dưới nhiều góc nhìn. Toàn bộ dữ liệu trong bản demo là dữ liệu giả.
      </p>
      {loading && <div className="text-slate-400">Đang tải danh sách tài khoản…</div>}

      {ROLES.map((role) => {
        const group = accounts.filter((a) => a.grants.some((g) => g.role === role));
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
                  className="text-left card p-3 hover:border-sky-300/40 disabled:opacity-50"
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
  );
}
