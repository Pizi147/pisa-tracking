import { useState } from 'react';
import { useApi } from '../../lib/useApi.ts';
import { api } from '../../lib/api.ts';
import { useSession } from '../../lib/session.tsx';
import { useToast } from '../../ui/Toast.tsx';
import { Card, ErrorState, Field, Info, NutChon, SectionNote, Skeleton } from '../../ui/ui.tsx';
import { skillLabel, skillShort } from '../../lib/format.ts';
import { ENTRY_SKILLS, nhanPhamVi } from '@shared/domain/index.ts';
import { LA_BAN_CHINH } from '../../lib/banChinh.ts';
import { dich, t } from '@shared/i18n/index.ts';

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
/**
 * Ô CHỌN KỸ NĂNG PHỤ TRÁCH ĐƯỢC (MH1, K1-51) — đúng 5 ô nhập L · R · W1 · W2 · S, tên đầy đủ ở tooltip. Tên môn lớp thường (G+V,
 * P, Tổng hợp) là tên của Ô LỚP, không phải năng lực của người. Dùng chung: Hồ sơ cá nhân · Quản trị › Tài khoản · Đăng ký.
 */
export function ChonKyNang({ value, onToggle, disabled }: {
  value: ReadonlySet<string> | readonly string[]; onToggle: (k: string) => void; disabled?: boolean;
}) {
  const co = (k: string) => ('has' in value ? value.has(k) : value.includes(k));
  return (
    <div className="flex flex-wrap gap-1.5" role="group" aria-label={t('Kỹ năng phụ trách được')}>
      {ENTRY_SKILLS.map((k) => (
        <NutChon key={k} nho chon={co(k)} disabled={disabled} title={skillLabel(k)} onClick={() => onToggle(k)}
          className="min-w-[52px] justify-center">
          {skillShort(k)}
        </NutChon>
      ))}
    </div>
  );
}

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
      toast.push('ok', t('Đã lưu hồ sơ'));
      setDraft(null); reload(); reloadSession();
    } catch (e: any) { toast.push('error', e.message); } finally { setBusy(false); }
  };

  /* OV-11b (QT-10h): nút Đổi mật khẩu chỉ bật khi đủ độ dài và hai ô khớp; lệch thì báo dưới ô. */
  const lechMk = !!pw.confirm && pw.next !== pw.confirm;
  const duMk = !!pw.current && pw.next.length >= 6 && pw.next === pw.confirm;
  /* QT-10d: kỹ năng phụ trách được chỉ có nghĩa với người dạy. */
  const nguoiDay = (session?.grants ?? []).some((g) => g.role === 'teacher');
  const changePassword = async () => {
    setBusy(true);
    try {
      await api.patch('/me/profile', { currentPassword: pw.current, newPassword: pw.next });
      toast.push('ok', t('Đã đổi mật khẩu'));
      setPw({ current: '', next: '', confirm: '' });
    } catch (e: any) { toast.push('error', e.message); } finally { setBusy(false); }
  };

  return (
    <div className="page space-y-4 max-w-3xl">
      <div>
        <h1 className="text-lg font-semibold text-slate-100 m-0">{t('Hồ sơ cá nhân')}</h1>
        <p className="text-xs text-slate-500 mt-0.5 mb-0">
          {data.fullName} · {data.code}{data.title ? ` · ${dich(data.title)}` : ''}
        </p>
      </div>

      <Card title={t('Thông tin liên hệ')}>
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t('Họ và tên')} required>
              <input className="field w-full" value={d.fullName} onChange={(e) => set({ fullName: e.target.value })} />
            </Field>
            <Field label={t('Số điện thoại')}>
              <input className="field w-full" value={d.phone} onChange={(e) => set({ phone: e.target.value })} />
            </Field>
          </div>

          <Field label={t('Email đăng nhập')}
            hint={t('Đổi email đăng nhập là đổi danh tính tài khoản — việc đó của Quản trị hệ thống.')}>
            <input className="field w-full" value={data.email ?? ''} disabled />
          </Field>

          <Field label={t('Email khác')}
            hint={t('Cách nhau bằng dấu phẩy. Email phụ chỉ để liên lạc, không đăng nhập được.')}>
            <input className="field w-full" value={d.extraEmails}
              placeholder="vidu@gmail.com, congviec@pisa.edu.vn"
              onChange={(e) => set({ extraEmails: e.target.value })} />
          </Field>

          {nguoiDay && (
            <Field label={t('Kỹ năng bạn phụ trách được')}
              hint={t('Đây là NĂNG LỰC, dùng để gợi ý khi phân công — không phải quyền nhập điểm.')}>
              <ChonKyNang value={d.skills} onToggle={toggleSkill} />
            </Field>
          )}
          {/* K1-54: Lưu ở CHÂN thẻ — sau khi đã đọc hết các ô, không lẫn với tiêu đề. */}
          <div className="flex justify-end border-t pt-3" style={{ borderColor: 'var(--line)' }}>
            <button className="btn btn-primary min-h-[44px] sm:min-h-0" disabled={busy || !draft} onClick={save}>{t('Lưu')}</button>
          </div>
        </div>
      </Card>

      <Card title={t('Vai trò và phạm vi')}>
        <div className="flex flex-wrap gap-1.5 [&>span]:whitespace-normal">
          {(session?.grants ?? []).map((g, i) => <Info key={i}>{nhanPhamVi(g)}</Info>)}
        </div>
        <SectionNote>
          {t('Vai trò và chi nhánh do')} <strong>{t('Quản trị hệ thống')}</strong> {t('cấp — không tự sửa được ở đây, vì tự cấp cho mình thì bước duyệt thành vô nghĩa.')}
        </SectionNote>
      </Card>

      <Card title={t('Đổi mật khẩu')}
        action={
          <button className="btn btn-sm" disabled={busy || !duMk} onClick={changePassword}>
            {t('Đổi mật khẩu')}
          </button>
        }>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label={t('Mật khẩu hiện tại')} required>
            <input className="field w-full" type="password" autoComplete="current-password"
              value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} />
          </Field>
          <Field label={t('Mật khẩu mới')} required hint={t('Ít nhất 6 ký tự.')}>
            <input className="field w-full" type="password" autoComplete="new-password"
              value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} />
          </Field>
          <Field label={t('Nhập lại mật khẩu mới')} required loi={lechMk ? t('Hai ô chưa khớp') : null}>
            <input className="field w-full" type="password" autoComplete="new-password"
              value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} />
          </Field>
        </div>
        {/* CA1-7: câu "Bản demo…" chỉ ở bản demo. */}
        {!(LA_BAN_CHINH || session?.banChinh) && (
          <SectionNote>
            {t('Bản demo không gửi email thật nên')} <strong>{t('không có luồng quên mật khẩu')}</strong>. {t('Quên thì nhờ Quản trị hệ thống đặt lại hộ.')}
          </SectionNote>
        )}
      </Card>
    </div>
  );
}
