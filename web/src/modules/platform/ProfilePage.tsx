import { useState } from 'react';
import { useApi } from '../../lib/useApi.ts';
import { api } from '../../lib/api.ts';
import { useSession } from '../../lib/session.tsx';
import { useToast } from '../../ui/Toast.tsx';
import { Card, ErrorState, Field, Info, SectionNote, Skeleton } from '../../ui/ui.tsx';
import { skillLabel } from '../../lib/format.ts';

type Profile = {
  id: number; code: string; fullName: string; email: string | null; phone: string | null;
  title: string | null;
  skills: string[]; extraEmails: string[]; allSkills: string[];
  canSetPassword: boolean;
};

/**
 * HỒ SƠ CÁ NHÂN — mục 7.2: họ tên, kỹ năng phụ trách được, số điện thoại, email(s).
 *
 * Hai chỗ cố ý KHÔNG sửa được ở đây, và màn hình nói rõ lý do thay vì chỉ làm mờ ô nhập:
 *
 *   EMAIL ĐĂNG NHẬP — đổi nó là đổi danh tính tài khoản, cần người khác xác nhận.
 *   VAI TRÒ VÀ CHI NHÁNH — tự cấp cho mình thì bước duyệt thành vô nghĩa.
 *
 * "Kỹ năng phụ trách được" KHÁC "đang dạy kỹ năng nào ở lớp nào". Cái trước là năng lực, để
 * gợi ý khi phân công; cái sau là phân công thật, và mới là thứ quyết định quyền nhập điểm.
 * Nhầm hai thứ này là tưởng khai thêm một kỹ năng ở đây thì được nhập điểm kỹ năng đó.
 */
export default function ProfilePage() {
  const toast = useToast();
  const { session, reload: reloadSession } = useSession();
  const { data, loading, error, reload } = useApi<Profile>('/me/profile');

  const [draft, setDraft] = useState<null | {
    fullName: string; phone: string; skills: Set<string>; extraEmails: string;
  }>(null);
  const [pw, setPw] = useState({ current: '', next: '', confirm: '' });
  const [busy, setBusy] = useState(false);

  if (error) return <ErrorState message={error.message} hint={error.hint} onRetry={reload} />;
  if (loading || !data) return <Skeleton rows={6} />;

  const d = draft ?? {
    fullName: data.fullName,
    phone: data.phone ?? '',
    skills: new Set(data.skills),
    extraEmails: data.extraEmails.join(', '),
  };
  const set = (patch: Partial<typeof d>) => setDraft({ ...d, ...patch });
  const toggleSkill = (k: string) => {
    const next = new Set(d.skills);
    if (next.has(k)) next.delete(k); else next.add(k);
    set({ skills: next });
  };

  const save = async () => {
    setBusy(true);
    try {
      await api.patch('/me/profile', {
        fullName: d.fullName,
        phone: d.phone || null,
        skills: [...d.skills],
        extraEmails: d.extraEmails.split(/[,;\s]+/).map((x) => x.trim()).filter(Boolean),
      });
      toast.push('ok', 'Đã lưu hồ sơ');
      setDraft(null); reload(); reloadSession();
    } catch (e: any) { toast.push('error', e.message); } finally { setBusy(false); }
  };

  const changePassword = async () => {
    if (pw.next !== pw.confirm) { toast.push('error', 'Hai ô mật khẩu mới chưa khớp nhau.'); return; }
    setBusy(true);
    try {
      await api.patch('/me/profile', { currentPassword: pw.current, newPassword: pw.next });
      toast.push('ok', 'Đã đổi mật khẩu');
      setPw({ current: '', next: '', confirm: '' });
    } catch (e: any) { toast.push('error', e.message); } finally { setBusy(false); }
  };

  return (
    <div className="page space-y-4 max-w-3xl">
      <div>
        <h1 className="text-lg font-semibold text-slate-100 m-0">Hồ sơ cá nhân</h1>
        <p className="text-xs text-slate-500 mt-0.5 mb-0">
          {data.fullName} · {data.code}{data.title ? ` · ${data.title}` : ''}
        </p>
      </div>

      <Card title="Thông tin liên hệ"
        action={<button className="btn btn-primary btn-sm" disabled={busy || !draft} onClick={save}>Lưu</button>}>
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Họ và tên" required>
              <input className="field w-full" value={d.fullName} onChange={(e) => set({ fullName: e.target.value })} />
            </Field>
            <Field label="Số điện thoại">
              <input className="field w-full" value={d.phone} onChange={(e) => set({ phone: e.target.value })} />
            </Field>
          </div>

          <Field label="Email đăng nhập"
            hint="Đổi email đăng nhập là đổi danh tính tài khoản — việc đó của Quản trị hệ thống.">
            <input className="field w-full" value={data.email ?? ''} disabled />
          </Field>

          <Field label="Email khác"
            hint="Cách nhau bằng dấu phẩy. Email phụ chỉ để liên lạc, không đăng nhập được.">
            <input className="field w-full" value={d.extraEmails}
              placeholder="vidu@gmail.com, congviec@pisa.edu.vn"
              onChange={(e) => set({ extraEmails: e.target.value })} />
          </Field>

          <Field label="Kỹ năng bạn phụ trách được"
            hint="Đây là NĂNG LỰC, dùng để gợi ý khi phân công — không phải quyền nhập điểm.">
            <div className="flex flex-wrap gap-1.5">
              {data.allSkills.map((k) => (
                <button key={k} type="button" className={`btn btn-sm ${d.skills.has(k) ? 'btn-primary' : ''}`}
                  onClick={() => toggleSkill(k)}>
                  {skillLabel(k)}
                </button>
              ))}
            </div>
          </Field>
        </div>
      </Card>

      <Card title="Vai trò và phạm vi">
        <div className="flex flex-wrap gap-1.5">
          {(session?.grants ?? []).map((g, i) => (
            <Info key={i}>
              {g.roleName} · {g.branchName ?? 'Toàn hệ thống'}
            </Info>
          ))}
        </div>
        <SectionNote>
          Vai trò và chi nhánh do <strong>Quản trị hệ thống</strong> cấp — không tự sửa được ở đây, vì tự cấp cho
          mình thì bước duyệt thành vô nghĩa. Nhãn màu vàng là <strong>quyền cấp riêng</strong> cho cá nhân bạn,
          ngoài quyền đến từ vai trò.
        </SectionNote>
      </Card>

      <Card title="Đổi mật khẩu"
        action={
          <button className="btn btn-sm" disabled={busy || !pw.current || !pw.next} onClick={changePassword}>
            Đổi mật khẩu
          </button>
        }>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Mật khẩu hiện tại" required>
            <input className="field w-full" type="password" autoComplete="current-password"
              value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} />
          </Field>
          <Field label="Mật khẩu mới" required hint="Ít nhất 6 ký tự.">
            <input className="field w-full" type="password" autoComplete="new-password"
              value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} />
          </Field>
          <Field label="Nhập lại mật khẩu mới" required>
            <input className="field w-full" type="password" autoComplete="new-password"
              value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} />
          </Field>
        </div>
        <SectionNote>
          Bản demo không gửi email thật nên <strong>không có luồng quên mật khẩu</strong>. Quên thì nhờ Quản trị
          hệ thống đặt lại hộ.
        </SectionNote>
      </Card>
    </div>
  );
}
