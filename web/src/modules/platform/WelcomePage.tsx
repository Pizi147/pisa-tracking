import { useState } from 'react';
import { useApi } from '../../lib/useApi.ts';
import { LA_BAN_CHINH } from '../../lib/banChinh.ts';
import { ApiError, api } from '../../lib/api.ts';
import { useSession } from '../../lib/session.tsx';
import { Alert, ChuDam, Field, Info, NutChon, SectionNote } from '../../ui/ui.tsx';
import { ChonKyNang } from './ProfilePage.tsx';
import { NutNgonNgu } from '../../ui/NutNgonNgu.tsx';

import { ROLES, ROLE_LABEL, VAI_DANG_KY, type Role } from '@shared/domain/index.ts';
import { dich, t } from '@shared/i18n/index.ts';

type Account = {
  id: number; code: string; fullName: string; title: string | null;
  grants: { role: string; roleName: string; scope: string }[];
  assignmentCount: number;
};
type AuthInfo = {
  emailSuffix: string;
  /** Bản chính không gửi khoá này (không lộ mật khẩu mặc định). */
  demoAdmin?: { email: string; password: string };
  skills: string[];
};

/** Hướng dẫn tại chỗ khi bản demo chưa có dữ liệu — viết cho người không rành kỹ thuật. */
function SetupHelp({ serverDown, onRetry }: { serverDown: boolean; onRetry: () => void }) {
  return (
    <div className="card p-5 border-amber-300/40">
      <h2 className="text-base font-semibold text-amber-200">
        {serverDown ? t('Chưa kết nối được máy chủ dữ liệu') : t('Chưa có dữ liệu mẫu trong máy')}
      </h2>
      <p className="text-sm text-slate-300 mt-2 leading-relaxed">
        {serverDown
          ? t('Giao diện đã chạy nhưng phần máy chủ dữ liệu thì chưa. Thường là do cửa sổ dòng lệnh đã bị đóng hoặc bị dừng.')
          : t('Ứng dụng đã chạy đúng, chỉ là chưa có tài khoản và dữ liệu mẫu nào để hiển thị. Bạn cần tạo dữ liệu mẫu một lần.')}
      </p>

      <ol className="mt-4 space-y-3 text-sm text-slate-300">
        <li>
          <span className="text-slate-100 font-medium">{t('1. Mở cửa sổ dòng lệnh đang chạy ứng dụng')}</span>
          <div className="text-slate-400 text-xs mt-0.5">
            {t('Đó là cửa sổ màu xanh đen bạn đã gõ lệnh lúc nãy. Nếu đã đóng, mở lại theo hướng dẫn ở tệp README.')}
          </div>
        </li>
        <li>
          <span className="text-slate-100 font-medium">{t('2. Dừng ứng dụng')}</span>
          <div className="text-slate-400 text-xs mt-0.5">
            {t('Bấm')} <kbd className="surface-2 px-1.5 py-0.5 rounded border">Ctrl</kbd> +{' '}
            <kbd className="surface-2 px-1.5 py-0.5 rounded border">C</kbd> {t('trong cửa sổ đó.')}
          </div>
        </li>
        <li>
          <span className="text-slate-100 font-medium">{t('3. Gõ lệnh tạo dữ liệu mẫu, rồi bấm Enter')}</span>
          <pre className="surface-2 mt-1.5 px-3 py-2 rounded text-sky-200 text-xs">npm run seed</pre>
          <div className="text-slate-400 text-xs mt-1">
            {t('Đợi tới khi thấy dòng')} <span className="text-sky-200">Hoàn tất</span> {t('kèm bảng liệt kê số lượng (khoảng 62 học viên, 9 lớp). Nếu hiện chữ đỏ, chụp màn hình lại.')}
          </div>
        </li>
        <li>
          <span className="text-slate-100 font-medium">{t('4. Chạy lại ứng dụng')}</span>
          <pre className="surface-2 mt-1.5 px-3 py-2 rounded text-sky-200 text-xs">npm run dev</pre>
        </li>
        <li>
          <span className="text-slate-100 font-medium">{t('5. Quay lại trang này và bấm nút bên dưới')}</span>
        </li>
      </ol>

      <button className="btn btn-primary mt-4" onClick={onRetry}>{t('Tải lại danh sách tài khoản')}</button>

      <p className="text-xs text-slate-500 mt-3 leading-relaxed">
        {t('Lưu ý: phải gõ lệnh trong thư mục có tệp')} <code className="text-slate-400">package.json</code>.{' '}
        {t('Nếu báo lỗi')} <code className="text-slate-400">ENOENT ... package.json</code> {t('nghĩa là bạn đang đứng sai thư mục.')}
      </p>
    </div>
  );
}

type SucKhoe = { ok: boolean; seeded: boolean };

/**
 * BẢN CHÍNH KHÔNG VÀO ĐƯỢC (AN-7). Bản chính tắt `/demo/accounts`, nên không suy "máy chủ chưa chạy" từ đó được như máy dev —
 * hỏi `/api/health`. Không có hướng dẫn gõ lệnh: người đọc là giáo viên, không phải người chạy máy.
 */
function BanChinhChuaVaoDuoc({ chuaKhoiTao, onRetry }: { chuaKhoiTao: boolean; onRetry: () => void }) {
  return (
    <div className="card p-5 border-amber-300/40">
      <h2 className="text-base font-semibold text-amber-200">
        {chuaKhoiTao ? t('Hệ thống chưa được khởi tạo') : t('Chưa kết nối được hệ thống dữ liệu')}
      </h2>
      <p className="text-sm text-slate-300 mt-2 leading-relaxed">
        {chuaKhoiTao
          ? t('Chưa có tài khoản nào để đăng nhập. Báo Quản trị hệ thống.')
          : t('Hệ thống tạm thời không phản hồi. Thử lại sau ít phút; nếu vẫn không vào được, báo Quản trị hệ thống.')}
      </p>
      <button className="btn btn-primary mt-4" onClick={onRetry}>{t('Thử lại')}</button>
    </div>
  );
}

/**
 * Câu lỗi đọc được khi bấm Đăng nhập / Gửi đăng ký. Lỗi mạng, ≥ 500, hoặc câu trả về là HTML ở bất kỳ mã nào (trang lỗi/404 của
 * Netlify — không in ra) → một câu chung; câu "Có lỗi · mã …" của máy chủ (AN-3) thì giữ để người dùng báo được mã.
 */
function cauLoiDeDoc(x: unknown): string {
  if (x instanceof ApiError && !/^\s*</.test(x.message) && (x.status < 500 || x.details?.ma)) return x.message;
  return t('Chưa kết nối được hệ thống dữ liệu. Thử lại sau ít phút.');
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
  const accounts = useApi<Account[]>(LA_BAN_CHINH ? null : '/demo/accounts');
  const info = useApi<AuthInfo>('/auth/info');
  /* AN-7: bản chính hỏi /api/health (máy dev vẫn suy từ /demo/accounts như cũ). */
  const suKhoe = useApi<SucKhoe>(LA_BAN_CHINH ? '/health' : null);
  /* Trả 200 mà không phải JSON sức khoẻ (trang index.html dự phòng) → thiếu ok → coi là chưa kết nối; đang tải thì vẫn hiện form. */
  const banChinhHong = LA_BAN_CHINH && (!!suKhoe.error || (!!suKhoe.data && (suKhoe.data.ok !== true || suKhoe.data.seeded === false)));
  const [mode, setMode] = useState<'login' | 'register' | 'demo'>('login');

  const serverDown = accounts.error?.status === 500 || accounts.error?.status === 502;
  const noData = !accounts.loading && (accounts.error || (accounts.data && accounts.data.length === 0));

  return (
    <div className="min-h-full flex items-start justify-center p-6">
      <div className="w-full max-w-3xl">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-9 h-9 rounded-lg bg-sky-300/12 border border-sky-300/40 grid place-items-center text-sky-200 font-bold">P</div>
          <div>
            <h1 className="text-xl font-semibold text-slate-100">PISA Tracking</h1>
            <div className="text-xs text-slate-500">{LA_BAN_CHINH ? t('Hệ thống quản lý học vụ và vận hành') : t('Hệ thống quản lý học vụ và vận hành — bản demo chạy local')}</div>
          </div>
          {!LA_BAN_CHINH && <div className="ml-auto"><Alert tone="warn">{t('Dữ liệu demo')}</Alert></div>}
        </div>
        {/* PR-EN (chủ SP 07/10): hai nút to ngay trên khung đăng nhập — người không đọc được tiếng Việt vẫn thấy "English". */}
        <div className="mt-4"><NutNgonNgu kieu="to" daDangNhap={false} /></div>

        {banChinhHong ? (
          <div className="mt-4">
            <BanChinhChuaVaoDuoc chuaKhoiTao={!suKhoe.error && suKhoe.data?.ok === true && suKhoe.data?.seeded === false} onRetry={suKhoe.reload} />
          </div>
        ) : noData ? (
          <div className="mt-4"><SetupHelp serverDown={!!serverDown} onRetry={accounts.reload} /></div>
        ) : (
          <>
            <div className="flex flex-wrap gap-1 mt-4 mb-4 border-b pb-2" style={{ borderColor: 'var(--line)' }}>
              <Tab active={mode === 'login'} onClick={() => setMode('login')}>{t('Đăng nhập')}</Tab>
              <Tab active={mode === 'register'} onClick={() => setMode('register')}>{t('Đăng ký')}</Tab>
              {!LA_BAN_CHINH && <Tab active={mode === 'demo'} onClick={() => setMode('demo')}>{t('Vào nhanh bằng tài khoản demo')}</Tab>}
            </div>

            {mode === 'login' && <LoginForm info={info.data ?? null} />}
            {mode === 'register' && <RegisterForm info={info.data ?? null} onDone={() => setMode('login')} />}
            {!LA_BAN_CHINH && mode === 'demo' && <DemoAccounts accounts={accounts.data ?? []} loading={accounts.loading} />}
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
    } catch (x: unknown) { setErr(cauLoiDeDoc(x)); } finally { setBusy(false); }
  };

  return (
    <form className="card p-5 space-y-4" onSubmit={submit}>
      <Field label={t('Email của trung tâm')} required
        hint={info ? t('Phải có đuôi "{duoi}", ví dụ dung{duoi}.', { duoi: info.emailSuffix }) : undefined}>
        <input className="field w-full" type="email" autoComplete="username" value={email}
          onChange={(e) => setEmail(e.target.value)} placeholder={info ? `ten${info.emailSuffix}` : 'email'} />
      </Field>
      <Field label={t('Mật khẩu')} required>
        <input className="field w-full" type="password" autoComplete="current-password" value={password}
          onChange={(e) => setPassword(e.target.value)} />
      </Field>

      {err && <p className="text-sm text-rose-200 m-0">{err}</p>}

      <button className="btn btn-primary w-full" disabled={busy || !email || !password}>
        {busy ? t('Đang vào…') : t('Đăng nhập')}
      </button>

      {/*
        MẬT KHẨU DEMO HIỆN RÕ. Đây là bản demo nội bộ chạy trên máy của chính owner; giấu nó
        đi chỉ tạo ra một câu hỏi phải nhắn tin mới trả lời được.
      */}
      {info?.demoAdmin && (
        <SectionNote>
          <ChuDam chu={t('Tài khoản <b>Quản trị hệ thống</b> mặc định:')} /> <code className="text-sky-200">{info.demoAdmin.email}</code>{' '}
          · {t('mật khẩu')} <code className="text-sky-200">{info.demoAdmin.password}</code>. {t('Mọi tài khoản mẫu khác dùng chung mật khẩu đó, email theo mẫu')}{' '}
          <code className="text-slate-300">ten.ho{info.emailSuffix}</code>.{' '}
          {t('Bản demo không gửi email thật và không có luồng quên mật khẩu — quên thì Quản trị hệ thống đặt lại hộ.')}
        </SectionNote>
      )}
    </form>
  );
}

function RegisterForm({ info, onDone }: { info: AuthInfo | null; onDone: () => void }) {
  const branches = useApi<{ code: string; name: string }[]>('/auth/branches');
  const [form, setForm] = useState({ fullName: '', email: '', password: '', phone: '', note: '' });
  const [role, setRole] = useState<Role>('teacher');
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
        ...form, role, branches: [...picked], skills: role === 'teacher' ? [...skills] : [],
      });
      setDone(true);
    } catch (x: unknown) { setErr(cauLoiDeDoc(x)); } finally { setBusy(false); }
  };

  if (done) {
    return (
      <div className="card p-5">
        <h2 className="text-base font-semibold text-slate-100 m-0">{t('Đã gửi đăng ký')}</h2>
        <p className="text-sm text-slate-300 mt-2 leading-relaxed">
          <ChuDam chu={t('Tài khoản của bạn đang <b>chờ Quản trị hệ thống duyệt</b>.')} /> {t('Sau khi được duyệt bạn đăng nhập bằng chính email và mật khẩu vừa đặt. Trước đó, đăng nhập sẽ báo là đang chờ duyệt — đó là trạng thái bình thường, không phải lỗi.')}
        </p>
        <button className="btn mt-4" onClick={onDone}>{t('Về màn đăng nhập')}</button>
      </div>
    );
  }

  return (
    <form className="card p-5 space-y-4" onSubmit={submit}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t('Họ và tên')} required>
          <input className="field w-full" value={form.fullName}
            onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
        </Field>
        <Field label={t('Số điện thoại')}>
          <input className="field w-full" value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        </Field>
        <Field label={t('Email của trung tâm')} required
          hint={info ? t('Chỉ email đuôi "{duoi}" mới hợp lệ.', { duoi: info.emailSuffix }) : undefined}>
          <input className="field w-full" type="email" value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder={info ? `ten${info.emailSuffix}` : 'email'} />
        </Field>
        <Field label={t('Mật khẩu')} required hint={t('Ít nhất 6 ký tự.')}>
          <input className="field w-full" type="password" autoComplete="new-password" value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })} />
        </Field>
      </div>

      {/* OV-13e: vai cũng chỉ là đề nghị — Quản trị duyệt (đổi được) mới cấp. Không có Quản trị hệ thống. */}
      <Field as="div" label={t('Vai trò')} required>
        <div className="flex flex-wrap gap-1.5">
          {VAI_DANG_KY.map((r) => (
            <NutChon key={r} nho chon={role === r} onClick={() => setRole(r)}>{ROLE_LABEL[r]}</NutChon>
          ))}
        </div>
      </Field>

      {/*
        CHI NHÁNH LÀ ĐỀ NGHỊ, KHÔNG PHẢI QUYẾT ĐỊNH. Nói thẳng điều đó ngay ở đây để không ai
        tưởng mình vừa tự cấp cho mình quyền vào năm chi nhánh.
      */}
      <Field as="div" label={t('Chi nhánh bạn đang hoạt động')} required={role !== 'cx'}
        hint={t('Đây là đề nghị của bạn — người duyệt sửa lại được trước khi đồng ý.')}>
        <div className="flex flex-wrap gap-1.5">
          {(branches.data ?? []).map((b) => (
            <NutChon key={b.code} nho chon={picked.has(b.code)} onClick={() => toggle(picked, b.code, setPicked)}>
              {b.name}
            </NutChon>
          ))}
        </div>
      </Field>

      {role === 'teacher' && (
        <Field label={t('Kỹ năng bạn phụ trách được')} hint={t('Dùng để gợi ý khi phân công lớp. Bỏ trống cũng được.')}>
          <ChonKyNang value={skills} onToggle={(s) => toggle(skills, s, setSkills)} />
        </Field>
      )}

      <Field label={t('Ghi chú cho người duyệt')}>
        <input className="field w-full" value={form.note} placeholder={t('Ví dụ: rảnh thứ 3, 5, 7')}
          onChange={(e) => setForm({ ...form, note: e.target.value })} />
      </Field>

      {err && <p className="text-sm text-rose-200 m-0">{err}</p>}

      <button className="btn btn-primary w-full" disabled={busy || !form.fullName || !form.email || !form.password}>
        {busy ? t('Đang gửi…') : t('Đăng ký')}
      </button>
    </form>
  );
}

/** Tài khoản xem được kịch bản mới — PR-MT (Task 10): MT lịch sử, lớp RF, dời do vắng lần 2 · PR-YT4 (K1-55): Ý thức v4 · PR-XLMT: xếp lịch MT nhiều lớp. */
const XEM_DUOC: Record<string, string[]> = {
  'Nguyễn Khánh Vy': [t('Xem được: MT cũ, lớp RF, dời lần 2'), t('Chờ duyệt Ý thức + Báo QL'), t('Xếp lịch MT nhiều lớp, Cần xếp lại'), t('Progress Test lớp thường: thẻ kế hoạch bổ trợ chờ duyệt (MB FOU 15)')],
  'Trần Ngọc Hà': [t('Xem được: MT cũ, lớp RF, dời lần 2'), t('Ý thức: em quá hạn, em bắt buộc, xác nhận cấp bậc vi phạm, WL 2'), t('Progress Test lớp thường: nộp kế hoạch bổ trợ, Báo phụ huynh qua TVV (MB FOU 15)')],
};

function DemoAccounts({ accounts, loading }: { accounts: Account[]; loading: boolean }) {
  const { switchAccount } = useSession();
  const [busy, setBusy] = useState<number | null>(null);

  return (
    <div>
      <p className="text-sm text-slate-400 mb-4 leading-relaxed">
        {t('Bấm một tài khoản để vào ngay, không cần mật khẩu. Vai: Quản trị · Quản lý · GV · Admin · TVV · CX; QL / Quản trị nắm ≥ 2 vai đổi được góc nhìn. Dữ liệu demo là dữ liệu giả.')}
      </p>
      {loading && <div className="text-slate-400">{t('Đang tải danh sách tài khoản…')}</div>}

      {ROLES.map((role) => {
        const group = accounts.filter((a) => a.grants.some((g) => g.role === role));
        if (!group.length) return null;
        return (
          <section key={role} className="mb-4">
            <h2 className="text-xs uppercase tracking-wide text-slate-500 font-semibold mb-2">
              {ROLE_LABEL[role as Role]} <span className="text-slate-500">({group.length})</span>
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
                  <div className="text-xs text-slate-400 mb-2">{a.title && dich(a.title)}</div>
                  <div className="flex flex-wrap gap-1">
                    {a.grants.map((r, i) => <Info key={i}>{dich(r.roleName)} · {dich(r.scope)}</Info>)}
                    {a.assignmentCount > 0 && <Info>{t('{n} phân công', { n: a.assignmentCount })}</Info>}
                  </div>
                  {XEM_DUOC[a.fullName] && (
                    <div className="mt-2 space-y-0.5 text-xs text-slate-500">{XEM_DUOC[a.fullName].map((x) => <div key={x}>{x}</div>)}</div>
                  )}
                </button>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
