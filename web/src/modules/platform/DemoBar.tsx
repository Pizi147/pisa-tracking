import { useState } from 'react';
import { api, invalidateAll } from '../../lib/api.ts';
import { useSession } from '../../lib/session.tsx';
import { useApi } from '../../lib/useApi.ts';
import { useToast } from '../../ui/Toast.tsx';
import { ConfirmDialog, Modal } from '../../ui/Drawer.tsx';
import { Alert, Field, Info, Status } from '../../ui/ui.tsx';
import { fmtDate } from '../../lib/format.ts';
import { dich, t } from '@shared/i18n/index.ts';

type Account = {
  id: number; code: string; fullName: string; title: string | null;
  grants: { role: string; roleName: string; scope: string }[];
  assignmentCount: number;
};

const SCENARIOS = [
  { key: 'normal', label: t('Bình thường') },
  { key: 'loading', label: t('Đang tải (skeleton)') },
  { key: 'empty', label: t('Không có dữ liệu') },
  { key: 'error', label: t('Lỗi khi tải') },
  { key: 'save_failure', label: t('Không lưu được') },
];

/** Thanh Công cụ demo — tách hẳn khỏi nghiệp vụ. */
export function DemoBar() {
  const { session, switchAccount, reload } = useSession();
  const toast = useToast();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const accounts = useApi<Account[]>(pickerOpen ? '/demo/accounts' : null);

  const scenario = session?.scenario ?? 'normal';

  const setScenario = async (value: string) => {
    await api.put('/demo/config', { scenario: value });
    invalidateAll();
    await reload();
    toast.push('info', t('Kịch bản demo: {ten}', { ten: SCENARIOS.find((s) => s.key === value)?.label }));
  };

  const setDemoDate = async (value: string) => {
    try {
      await api.put('/demo/config', { demoDate: value });
      invalidateAll();
      await reload();
      toast.push('ok', t('Ngày demo: {ngay}', { ngay: fmtDate(value) }));
    } catch (e: any) {
      toast.push('error', e.message);
    }
  };

  return (
    /* K5 (mockup HK2 mục 5): điện thoại một dòng — "Demo" · ngày · Công cụ · Tài khoản (nút 44 px, cả thanh ≤ 53 px). Máy tính giữ nguyên. */
    /* EN-SOT (03/11): thanh demo theo tiếng của trang như mọi màn (trước giữ tiếng Việt). */
    <div className="flex items-center gap-2 flex-wrap px-4 py-1.5 max-sm:px-3 max-sm:py-1 text-xs border-b bg-[color:var(--bg)]" style={{ borderColor: 'var(--line)' }}>
      <Alert tone="warn"><span className="sm:hidden">Demo</span><span className="max-sm:hidden">{t('Dữ liệu demo')}</span></Alert>
      <span className="text-slate-500 hidden sm:inline">{t('Toàn bộ dữ liệu là giả, không phải dữ liệu thật của trung tâm.')}</span>
      <div className="flex-1" />
      <span className="text-slate-400 whitespace-nowrap">
        <span className="max-sm:hidden">{t('Ngày demo:')} </span><strong className="text-slate-200 max-sm:font-semibold">{fmtDate(session?.demoDate)}</strong>
      </span>
      {scenario !== 'normal' && <Alert>{t('Kịch bản: {ten}', { ten: SCENARIOS.find((s) => s.key === scenario)?.label })}</Alert>}
      <button className="btn btn-sm max-sm:min-h-[44px]" aria-label={t('Công cụ demo')} onClick={() => setToolsOpen(true)}>
        <span className="sm:hidden">{t('Công cụ')}</span><span className="max-sm:hidden">{t('Công cụ demo')}</span></button>
      <button className="btn btn-sm btn-primary max-sm:min-h-[44px]" aria-label={t('Đổi tài khoản demo')} onClick={() => setPickerOpen(true)}>
        <span className="sm:hidden">{t('Tài khoản')}</span><span className="max-sm:hidden">{t('Đổi tài khoản demo')}</span></button>

      <Modal open={pickerOpen} onClose={() => setPickerOpen(false)} title={t('Chọn tài khoản demo')} width="max-w-3xl">
        <p className="text-xs text-slate-400 mb-3">
          {t('Phiên đăng nhập do máy chủ cấp cho tài khoản mẫu. Đây là cơ chế chỉ dành cho bản demo local, không phải xác thực dùng cho sản phẩm thật.')}
        </p>
        {accounts.loading && <div className="text-slate-400">{t('Đang tải danh sách…')}</div>}
        <div className="grid gap-2">
          {(accounts.data ?? []).map((a) => (
            <button
              key={a.id}
              className={`text-left card p-3 hover:border-sky-300/40 ${session?.user?.id === a.id ? 'border-sky-300/60' : ''}`}
              onClick={async () => {
                setPickerOpen(false);
                if (await switchAccount(a.id)) toast.push('ok', t('Đang dùng tài khoản: {ten}', { ten: a.fullName }));
              }}
            >
              <div className="flex items-center justify-between gap-2">
                <div>
                  <div className="font-medium text-slate-100">{a.fullName} <span className="text-slate-500 text-xs">· {a.code}</span></div>
                  <div className="text-xs text-slate-400">{a.title}</div>
                </div>
                {session?.user?.id === a.id && <Status kind="doing">{t('Đang dùng')}</Status>}
              </div>
              <div className="flex flex-wrap gap-1 mt-2">
                {a.grants.map((r, i) => (
                  <Info key={i}>{dich(r.roleName)} · {dich(r.scope)}</Info>
                ))}
                {a.assignmentCount > 0 && <Info>{t('{n} phân công lớp/kỹ năng', { n: a.assignmentCount })}</Info>}
              </div>
            </button>
          ))}
        </div>
      </Modal>

      <Modal open={toolsOpen} onClose={() => setToolsOpen(false)} title={t('Công cụ demo')} width="max-w-xl">
        <div className="space-y-4">
          <Field label={t('Ngày demo dùng cho mọi phép tính hạn và tuần')}
            hint={t('Đổi ngày để xem lại trạng thái quá hạn / sắp đến hạn. Dữ liệu seed được sinh tương đối theo ngày này.')}>
            <div className="flex gap-2">
              <input type="date" className="field" defaultValue={session?.demoDate}
                onBlur={(e) => e.target.value && setDemoDate(e.target.value)} />
              <button className="btn" onClick={() => setDemoDate('')}>{t('Dùng ngày thật')}</button>
            </div>
          </Field>

          <Field label={t('Kịch bản giao diện')}
            hint={t('Chỉ bật khi bạn muốn thử. Hệ thống không bao giờ tự sinh lỗi ngẫu nhiên khi dùng bình thường.')}>
            <select className="field" value={scenario} onChange={(e) => setScenario(e.target.value)}>
              {SCENARIOS.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
            </select>
          </Field>

          <div className="border-t pt-3" style={{ borderColor: 'var(--line)' }}>
            <div className="label">{t('Nạp lại dữ liệu mẫu')}</div>
            <p className="text-xs text-slate-500 mb-2">
              {t('Xoá toàn bộ thay đổi bạn đã nhập và tạo lại dữ liệu gốc. Chạy trong terminal:')} <code className="text-sky-200">npm run seed</code>
            </p>
            <button className="btn btn-danger btn-sm" onClick={() => setResetOpen(true)}>{t('Hướng dẫn nạp lại')}</button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={resetOpen} onClose={() => setResetOpen(false)} busy={busy}
        title={t('Nạp lại dữ liệu mẫu')}
        confirmLabel={t('Tôi đã hiểu')}
        body={
          <div className="space-y-2">
            <p>{t('Bản demo không cho phép xoá cơ sở dữ liệu từ giao diện để tránh mất dữ liệu thử nghiệm ngoài ý muốn.')}</p>
            <p>{t('Dừng ứng dụng, chạy lệnh sau rồi khởi động lại:')}</p>
            <pre className="surface-2 p-2 rounded text-sky-200 text-xs">npm run seed</pre>
          </div>
        }
        onConfirm={() => { setBusy(false); setResetOpen(false); }}
      />
    </div>
  );
}
