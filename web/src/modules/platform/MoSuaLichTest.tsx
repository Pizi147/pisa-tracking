import { useState } from 'react';
import { api } from '../../lib/api.ts';
import { useApi } from '../../lib/useApi.ts';
import { useSession } from '../../lib/session.tsx';
import { fmtDateTime } from '../../lib/format.ts';
import { useToast } from '../../ui/Toast.tsx';
import { Card, ErrorState, Skeleton } from '../../ui/ui.tsx';
import { NutLuat } from '../../ui/NutLuat.tsx';
import { CHIP_TRON } from '../../ui/Nhan.tsx';
import { t } from '@shared/i18n/index.ts';

type TrangThai = { bat: boolean; nguoi: string | null; luc: string | null };

/**
 * QUẢN TRỊ › QUYỀN & NHẬT KÝ › MỞ SỬA LỊCH TEST (chủ SP 06/11) — MỘT công tắc, chỉ Quản trị hệ thống thấy và bấm (máy chủ 403 vai khác).
 * BẬT: GVCN (lớp mình chủ nhiệm), Admin, Quản lý sửa được lịch Test / Kế hoạch Test kể cả thứ Sáu – Chủ nhật (bỏ khoá N15). TẮT: luật cũ.
 * Bấm là có hiệu lực ngay; muốn đổi ý bấm lại (nhật ký ghi cả hai lần) — không hộp xác nhận.
 */
export function MoSuaLichTest() {
  const { data: tai, error, loading, reload } = useApi<TrangThai>('/admin/mo-sua-lich-test');
  /* Kết quả của lần bấm gần nhất (PUT trả trạng thái mới) — hiện ngay, không chờ tải lại. */
  const [vua, setVua] = useState<TrangThai | null>(null);
  const data = vua ?? tai;
  const { reload: napLaiPhien } = useSession();
  const toast = useToast();
  const [busy, setBusy] = useState(false);

  const doi = async (bat: boolean) => {
    if (busy) return;
    setBusy(true);
    try {
      setVua(await api.put<TrangThai>('/admin/mo-sua-lich-test', { bat }));
      toast.push('ok', bat ? t('Đã mở sửa lịch Test') : t('Đã tắt mở sửa lịch Test'));
      void napLaiPhien();   // cờ `moSuaLichTest` của phiên (nạp lại phiên cũng xoá bản vừa xem)
    } catch (e: any) {
      toast.push('error', e?.message ?? t('Không lưu được'));
    } finally { setBusy(false); }
  };

  if (error) return <Card title={t('Mở sửa lịch Test')}><ErrorState message={error.message} hint={error.hint} status={error.status} onRetry={reload} /></Card>;
  if (loading || !data) return <Card title={t('Mở sửa lịch Test')}><Skeleton rows={1} /></Card>;
  return (
    /* QTV2-QUYEN: MỘT hàng — tên + ⓘ (hậu quả) · trạng thái · ai bật · nút. */
    <section className="card flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3">
      <h2 className="h-khoi m-0 inline-flex items-center gap-1.5 text-lg font-bold text-slate-100">{t('Mở sửa lịch Test')}
        <NutLuat label={t('Mở sửa lịch Test')}>{t('Mở: GVCN (lớp mình), Admin, Quản lý sửa được lịch Test kể cả Thứ Sáu – CN.')}</NutLuat></h2>
      <span className="inline-flex min-w-0 flex-wrap items-center gap-2" role="status">
        <span className={`${CHIP_TRON} ${data.bat ? 'border-ok-line bg-ok-bg text-ok' : 'border-[var(--line-strong)] bg-[var(--surface)] text-dim'}`}>
          {data.bat ? t('Đang mở') : t('Đang tắt')}
        </span>
        {data.bat && (
          <span className="min-w-0 break-words text-sm text-slate-300">
            {t('Bật bởi {nguoi} lúc {luc}', { nguoi: data.nguoi ?? '—', luc: data.luc ? fmtDateTime(data.luc) : '—' })}
          </span>
        )}
      </span>
      <button type="button" className={`btn ml-auto min-h-[44px] sm:min-h-0 ${data.bat ? '' : 'btn-primary'}`} disabled={busy} aria-busy={busy || undefined}
        aria-label={`${data.bat ? t('Tắt') : t('Bật')} — ${t('Mở sửa lịch Test')}`} onClick={() => void doi(!data.bat)}>
        {busy ? t('Đang lưu…') : data.bat ? t('Tắt') : t('Bật')}
      </button>
    </section>
  );
}
