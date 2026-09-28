import { useState } from 'react';
import { useApi } from '../../lib/useApi.ts';
import { api, invalidate } from '../../lib/api.ts';
import { useToast } from '../../ui/Toast.tsx';
import { BoLocDoan, Card, Empty, Field, Forbidden, Info, NutChon, SectionNote, Skeleton, Th} from '../../ui/ui.tsx';
import { KhungPanel } from '../../ui/KhungPanel.tsx';
import { fmtDate, skillLabel } from '../../lib/format.ts';
import { PERMISSION_LABEL, ROLES, ROLE_LABEL, ngay, roleLabel, type Role } from '@shared/domain/index.ts';
import { MenuDong } from '../../ui/MenuDong.tsx';
import { XoaTaiKhoanPanel } from './XoaTaiKhoanPanel.tsx';

type Branch = { id: number; code: string; name: string };
type RoleGrant = { role: string; roleName: string; branchCode: string | null; branchName: string | null };
type Account = {
  id: number; code: string; fullName: string; email: string | null; phone: string | null;
  title: string | null; status: string; approvalState: string; hasPassword: boolean;
  /** PR-XOA: tài khoản xoá mềm (`status = 'deleted'`). */
  deletedAt: string | null;
  roles: RoleGrant[]; skills: string[];
  extra: { permission: string; name: string; branchCode: string | null }[];
};
type Pending = {
  id: number; code: string; fullName: string; email: string; phone: string | null;
  branches: string[]; note: string | null; createdAt: string; skills: string[];
};

/**
 * TÀI KHOẢN — hàng đợi duyệt, danh sách tài khoản, vai trò và quyền cấp riêng (mục 7.1, 7.3).
 *
 * HÀNG ĐỢI ĐỨNG TRƯỚC danh sách: một người đang chờ được vào làm việc là thứ có hạn, còn
 * danh sách tài khoản thì lúc nào mở ra cũng đọc được. Đặt hàng đợi dưới cùng nghĩa là ngày
 * nào cũng phải cuộn qua hai mươi dòng mới biết có ai đang chờ hay không.
 */
export function AccountsAdmin() {
  const toast = useToast();
  const branches = useApi<Branch[]>('/ref/branches');
  const accounts = useApi<{ rows: Account[]; pending: Pending[] }>('/admin/accounts');
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Account | null>(null);
  /** PR-XOA: nút lọc trên bảng — mặc định "Đang dùng"; "Đã xoá" là tài khoản xoá mềm (còn dấu vết). */
  const [loc, setLoc] = useState<'dang-dung' | 'da-xoa'>('dang-dung');
  const [xoaId, setXoaId] = useState<number | null>(null);

  if (accounts.loading) return <Card title="Tài khoản"><Skeleton rows={5} /></Card>;
  /*
   * KHÔNG CÓ QUYỀN THÌ NÓI THẲNG, đừng để một khối trống.
   *
   * Máy chủ đã chặn đúng (403), nhưng nếu giao diện chỉ im lặng thì người dùng thấy một trang
   * rỗng và không biết là mình thiếu quyền hay phần mềm hỏng — và trên bảng điều khiển của
   * trình duyệt thì nó hiện thành một lỗi đỏ, đúng thứ làm người ta hết tin vào những lỗi khác.
   */
  if (accounts.error) {
    return (
      <Forbidden
        message="Phần này chỉ dành cho Quản trị hệ thống."
        hint="Tài khoản của bạn không có quyền quản trị phần mềm. Đây là quản trị PHẦN MỀM, khác với Admin chi nhánh là nhân sự văn phòng."
      />
    );
  }
  const tatCa = accounts.data?.rows ?? [];
  const dangDung = tatCa.filter((u) => u.status !== 'deleted');
  const daXoa = tatCa.filter((u) => u.status === 'deleted');
  const rows = loc === 'da-xoa' ? daXoa : dangDung;
  const pending = accounts.data?.pending ?? [];
  const reload = () => { accounts.reload(); invalidate('/demo/accounts'); };

  return (
    <div className="space-y-4">
      <Card
        title={<span>Chờ duyệt {pending.length > 0 && <span className="text-amber-200">({pending.length})</span>}</span>}
        bodyClass="p-0">
        {pending.length === 0 ? (
          <div className="p-4">
            <Empty title="Không có đăng ký nào đang chờ"
              hint="Giáo viên tự đăng ký ở màn đăng nhập sẽ xuất hiện tại đây." />
          </div>
        ) : (
          <ul className="divide-y list-none p-0 m-0" style={{ borderColor: 'var(--line)' }}>
            {pending.map((u) => (
              <PendingRow key={u.id} user={u} branches={branches.data ?? []}
                onDone={() => { reload(); toast.push('ok', 'Đã xử lý đăng ký'); }} />
            ))}
          </ul>
        )}
      </Card>

      <Card title={`Tài khoản (${rows.length})`} bodyClass="p-0"
        action={
          <span className="flex flex-wrap items-center gap-1.5">
            <BoLocDoan ariaLabel="Lọc tài khoản" value={loc} onChange={setLoc}
              muc={[{ key: 'dang-dung', nhan: 'Đang dùng', so: dangDung.length }, { key: 'da-xoa', nhan: 'Đã xoá', so: daXoa.length }]} />
            <button className="btn btn-sm btn-primary" onClick={() => setCreating(true)}>+ Tạo tài khoản</button>
          </span>
        }>
        <div className="table-scroll">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <Th className="sticky-col" hint="Tên hiện ở mọi nơi trong hệ thống. Chính người đó sửa được ở Hồ sơ cá nhân.">Họ tên</Th>
                <Th hint="Địa chỉ dùng để đăng nhập. KHÔNG sửa được sau khi tạo — đổi email là đổi danh tính.">Email đăng nhập</Th>
                <Th hint="Một người mang được nhiều vai ở nhiều chi nhánh. Quyền = vai × chi nhánh của chính lần cấp đó.">Vai trò · chi nhánh</Th>
                <Th hint="Quyền cấp thêm cho riêng người này, CỘNG vào quyền của vai chứ không thay thế.">Quyền cấp riêng</Th>
                <Th hint="Kỹ năng người này phụ trách được — dùng để gợi ý khi phân công, không tự cho quyền nhập điểm.">Kỹ năng</Th>
                <th className="th" />
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr><td className="td text-sm text-slate-500" colSpan={6}>{loc === 'da-xoa' ? 'Chưa xoá tài khoản nào.' : 'Chưa có tài khoản.'}</td></tr>
              )}
              {rows.map((u) => (
                <tr key={u.id} className={u.status === 'deleted' ? 'opacity-60' : 'row-hover'}>
                  <td className="td sticky-col whitespace-nowrap">
                    <span className="text-slate-100">{u.fullName}</span>
                    <span className="block text-[11px] text-slate-500">{u.code}{u.phone ? ` · ${u.phone}` : ''}</span>
                  </td>
                  <td className="td text-xs text-slate-300">{u.email ?? <span className="text-rose-200">chưa có</span>}</td>
                  <td className="td">
                    <span className="flex flex-wrap gap-1">
                      {u.roles.length === 0 && <span className="text-xs text-slate-600">chưa có vai</span>}
                      {u.roles.map((g, i) => (
                        <Info key={i}>
                          {roleLabel(g.role) || g.roleName} · {g.branchName ?? 'Toàn hệ thống'}
                        </Info>
                      ))}
                    </span>
                  </td>
                  <td className="td">
                    <span className="flex flex-wrap gap-1">
                      {u.extra.length === 0 && <span className="text-xs text-slate-600">—</span>}
                      {u.extra.map((x, i) => (
                        <Info key={i}>{x.name}{x.branchCode ? ` · ${x.branchCode}` : ' · toàn hệ thống'}</Info>
                      ))}
                    </span>
                  </td>
                  <td className="td text-xs text-slate-400">
                    {u.skills.length ? u.skills.map(skillLabel).join(', ') : '—'}
                  </td>
                  <td className="td whitespace-nowrap">
                    {u.status === 'deleted' ? (
                      <span className="text-xs text-slate-500">Đã xoá {ngay(u.deletedAt)}</span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5">
                        <button className="btn btn-sm" onClick={() => setEditing(u)}>Sửa</button>
                        <MenuDong nhan="Thêm thao tác" muc={[{ key: 'xoa', nhan: 'Xoá tài khoản', nguyHiem: true, onChon: () => setXoaId(u.id) }]} />
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-3">
          <SectionNote>
            Một người mang được <strong>nhiều vai ở nhiều chi nhánh</strong>: Quản lý được giảng dạy, Admin CN thì
            không, và Giáo viên có thể kiêm vai Quản lý. Gỡ vai <strong>không xoá</strong> dòng cũ mà đóng nó lại,
            nên báo cáo cũ đọc lại vẫn thấy đúng ai được phép làm gì lúc đó.
          </SectionNote>
        </div>
      </Card>

      {creating && (
        <AccountDialog branches={branches.data ?? []} onClose={() => setCreating(false)}
          onDone={() => { setCreating(false); reload(); }} />
      )}
      {editing && (
        <AccountDialog account={editing} branches={branches.data ?? []} onClose={() => setEditing(null)}
          onDone={() => { setEditing(null); reload(); }} />
      )}
      {xoaId !== null && (
        <XoaTaiKhoanPanel userId={xoaId} onClose={() => setXoaId(null)} onDone={() => { setXoaId(null); reload(); }} />
      )}
    </div>
  );
}

/** Một đăng ký đang chờ. Người duyệt SỬA ĐƯỢC chi nhánh trước khi bấm duyệt (mục 7.1). */
function PendingRow({ user, branches, onDone }: {
  user: Pending; branches: Branch[]; onDone: () => void;
}) {
  const toast = useToast();
  const [picked, setPicked] = useState<Set<string>>(new Set(user.branches));
  const [role, setRole] = useState('teacher');
  const [busy, setBusy] = useState(false);
  const [declining, setDeclining] = useState(false);
  const [reason, setReason] = useState('');

  const act = async (fn: () => Promise<unknown>) => {
    setBusy(true);
    try { await fn(); onDone(); } catch (e: any) { toast.push('error', e.message); } finally { setBusy(false); }
  };

  return (
    <li className="px-4 py-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm text-slate-100">{user.fullName}</div>
          <div className="text-[11px] text-slate-500">
            {user.email}{user.phone ? ` · ${user.phone}` : ''} · đăng ký {fmtDate(user.createdAt)}
          </div>
          {user.note && <div className="text-xs text-slate-400 mt-1">“{user.note}”</div>}
          {user.skills.length > 0 && (
            <div className="text-[11px] text-slate-500 mt-1">
              Tự khai dạy được: {user.skills.map(skillLabel).join(', ')}
            </div>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <select className="field w-36" value={role} onChange={(e) => setRole(e.target.value)}>
            {ROLES.filter((r) => r !== 'system_admin').map((r) => (
              <option key={r} value={r}>{ROLE_LABEL[r as Role]}</option>
            ))}
          </select>
          <button className="btn btn-sm btn-primary" disabled={busy || picked.size === 0}
            onClick={() => act(() => api.post(`/admin/accounts/${user.id}/approve`, { role, branches: [...picked] }))}>
            Duyệt
          </button>
          <button className="btn btn-sm" disabled={busy} onClick={() => setDeclining((v) => !v)}>Không duyệt</button>
        </div>
      </div>

      <div className="mt-2">
        <span className="text-[11px] text-slate-500 mr-2">Chi nhánh (người đăng ký tự khai, sửa được):</span>
        <span className="inline-flex flex-wrap gap-1 align-middle">
          {branches.map((b) => (
            <NutChon key={b.code} nho chon={picked.has(b.code)}
              onClick={() => setPicked((s) => {
                const next = new Set(s);
                if (next.has(b.code)) next.delete(b.code); else next.add(b.code);
                return next;
              })}>
              {b.code}
            </NutChon>
          ))}
        </span>
      </div>

      {declining && (
        <div className="mt-2 flex flex-wrap gap-2 items-end">
          <label className="block flex-1 min-w-[16rem]">
            <span className="label">Lý do không duyệt — người đăng ký sẽ đọc câu này</span>
            <input className="field w-full" value={reason} onChange={(e) => setReason(e.target.value)} />
          </label>
          <button className="btn btn-sm" disabled={busy || !reason.trim()}
            onClick={() => act(() => api.post(`/admin/accounts/${user.id}/decline`, { reason }))}>
            Gửi từ chối
          </button>
        </div>
      )}
    </li>
  );
}

/** Tạo tài khoản mới, hoặc sửa vai trò / quyền riêng / mật khẩu của một tài khoản đã có. */
function AccountDialog({ account, branches, onClose, onDone }: {
  account?: Account; branches: Branch[]; onClose: () => void; onDone: () => void;
}) {
  const toast = useToast();
  const editing = !!account;
  const [form, setForm] = useState({
    fullName: account?.fullName ?? '', email: account?.email ?? '', password: '',
    phone: account?.phone ?? '', title: account?.title ?? '',
  });
  const [grants, setGrants] = useState<{ role: string; branches: Set<string> }[]>(() => {
    if (!account) return [{ role: 'teacher', branches: new Set<string>() }];
    const m = new Map<string, Set<string>>();
    for (const g of account.roles) {
      if (!m.has(g.role)) m.set(g.role, new Set());
      if (g.branchCode) m.get(g.role)!.add(g.branchCode);
    }
    return [...m.entries()].map(([role, b]) => ({ role, branches: b }));
  });
  const [extra, setExtra] = useState<{ permission: string; branchCode: string | null }[]>(
    () => (account?.extra ?? []).map((x) => ({ permission: x.permission, branchCode: x.branchCode })),
  );
  const [newPassword, setNewPassword] = useState('');
  const [busy, setBusy] = useState(false);

  const run = async (fn: () => Promise<unknown>, msg: string) => {
    setBusy(true);
    try { await fn(); toast.push('ok', msg); onDone(); }
    catch (e: any) { toast.push('error', e.message); }
    finally { setBusy(false); }
  };

  const payloadRoles = () => grants
    .filter((g) => g.role)
    .map((g) => ({ role: g.role, branches: [...g.branches] }));

  const save = () => {
    if (editing) {
      return run(async () => {
        await api.put(`/admin/accounts/${account!.id}/roles`, { roles: payloadRoles() });
        await api.put(`/admin/accounts/${account!.id}/permissions`, { items: extra });
        if (newPassword) await api.post(`/admin/accounts/${account!.id}/password`, { password: newPassword });
      }, 'Đã lưu tài khoản');
    }
    return run(() => api.post('/admin/accounts', {
      ...form, roles: payloadRoles(),
    }), 'Đã tạo tài khoản');
  };

  return (
    <KhungPanel tieuDe={editing ? 'Sửa tài khoản' : 'Tạo tài khoản'} hocVien={editing ? account!.fullName : null} rong="rong" onDong={onClose}
      chan={{
        huy: { nhan: 'Đóng', onClick: onClose, disabled: busy },
        chinh: <button type="button" className="btn btn-primary min-h-[44px] sm:min-h-0" onClick={save} disabled={busy}>Lưu</button>,
      }}>
      <div className="space-y-4 pt-3">
        {!editing && (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Họ và tên" required>
                <input className="field w-full" value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
              </Field>
              <Field label="Chức danh" hint="Chỉ để hiển thị, không ảnh hưởng quyền.">
                <input className="field w-full" value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })} />
              </Field>
              <Field label="Email đăng nhập" required hint="Phải có đuôi .pisa@gmail.com.">
                <input className="field w-full" type="email" value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </Field>
              <Field label="Mật khẩu ban đầu" required hint="Người dùng đổi lại ở hồ sơ cá nhân.">
                <input className="field w-full" value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })} />
              </Field>
              <Field label="Số điện thoại">
                <input className="field w-full" value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </Field>
            </div>
          </>
        )}

        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="label m-0">Vai trò và chi nhánh</span>
            <button className="btn btn-sm" type="button"
              onClick={() => setGrants([...grants, { role: 'teacher', branches: new Set() }])}>
              + Thêm vai
            </button>
          </div>
          <div className="space-y-2">
            {grants.map((g, i) => (
              <div key={i} className="surface-2 rounded-lg p-2.5 flex flex-wrap items-center gap-2">
                <select className="field w-44" value={g.role}
                  onChange={(e) => setGrants(grants.map((x, j) => (j === i ? { ...x, role: e.target.value } : x)))}>
                  {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABEL[r as Role]}</option>)}
                </select>
                {g.role === 'system_admin' ? (
                  <span className="text-xs text-slate-400">Toàn hệ thống — không gắn chi nhánh</span>
                ) : (
                  branches.map((b) => (
                    <NutChon key={b.code} nho chon={g.branches.has(b.code)}
                      onClick={() => setGrants(grants.map((x, j) => {
                        if (j !== i) return x;
                        const next = new Set(x.branches);
                        if (next.has(b.code)) next.delete(b.code); else next.add(b.code);
                        return { ...x, branches: next };
                      }))}>
                      {b.code}
                    </NutChon>
                  ))
                )}
                <button className="btn btn-sm btn-ghost ml-auto" type="button"
                  onClick={() => setGrants(grants.filter((_, j) => j !== i))}>Gỡ</button>
              </div>
            ))}
          </div>
        </div>

        {editing && (
          <>
            {/*
              QUYỀN CẤP RIÊNG CHO CÁ NHÂN (mục 7.3) — ví dụ owner đưa ra là cấp cho một Quản lý
              CN Monbay quyền quan sát toàn hệ thống. Sửa vai "Quản lý" là sửa cho TẤT CẢ Quản
              lý, nên phải có đường cấp riêng cho một người.
            */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="label m-0">Quyền cấp riêng cho người này</span>
                <button className="btn btn-sm" type="button"
                  onClick={() => setExtra([...extra, { permission: 'attempt.view', branchCode: null }])}>
                  + Cấp thêm quyền
                </button>
              </div>
              <div className="space-y-2">
                {extra.length === 0 && (
                  <p className="text-xs text-slate-500 m-0">
                    Chưa cấp riêng quyền nào. Người này chỉ có quyền đến từ vai trò ở trên.
                  </p>
                )}
                {extra.map((x, i) => (
                  <div key={i} className="surface-2 rounded-lg p-2.5 flex flex-wrap items-center gap-2">
                    <select className="field flex-1 min-w-[14rem]" value={x.permission}
                      onChange={(e) => setExtra(extra.map((y, j) => (j === i ? { ...y, permission: e.target.value } : y)))}>
                      {Object.entries(PERMISSION_LABEL).map(([k, label]) => (
                        <option key={k} value={k}>{label}</option>
                      ))}
                    </select>
                    <select className="field w-40" value={x.branchCode ?? ''}
                      onChange={(e) => setExtra(extra.map((y, j) => (
                        j === i ? { ...y, branchCode: e.target.value || null } : y)))}>
                      <option value="">Toàn hệ thống</option>
                      {branches.map((b) => <option key={b.code} value={b.code}>{b.name}</option>)}
                    </select>
                    <button className="btn btn-sm btn-ghost" type="button"
                      onClick={() => setExtra(extra.filter((_, j) => j !== i))}>Gỡ</button>
                  </div>
                ))}
              </div>
              <SectionNote>
                Quyền ở đây <strong>cộng thêm</strong> vào quyền của vai trò, không thay thế. Chọn “Toàn hệ thống”
                là cho phép người này nhìn vượt ra ngoài chi nhánh của họ.
              </SectionNote>
            </div>

            <Field label="Đặt lại mật khẩu"
              hint="Hệ thống chưa có luồng quên mật khẩu — đặt lại mật khẩu ở đây. Bỏ trống nếu không đổi.">
              <input className="field w-full" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
            </Field>
          </>
        )}
      </div>
    </KhungPanel>
  );
}
