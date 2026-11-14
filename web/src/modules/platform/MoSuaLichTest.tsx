import { useRef, useState } from 'react';
import { api } from '../../lib/api.ts';
import { useApi } from '../../lib/useApi.ts';
import { useSession } from '../../lib/session.tsx';
import { fmtDateTime } from '../../lib/format.ts';
import { useToast } from '../../ui/Toast.tsx';
import { Card, ErrorState, Skeleton } from '../../ui/ui.tsx';
import { NutLuat } from '../../ui/NutLuat.tsx';
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
  const dang = useRef(false);   // chặn bấm lặp — đọc được cả trong hàm Hoàn tác tạo từ lần vẽ trước

  /* GD-17c (mockup ⑩ K7, R10.2): công tắc — bấm là có hiệu lực ngay (không hộp hỏi) + toast Hoàn tác (= bấm lại; máy chủ ghi cả hai lần như nay).
     Lưu lỗi: công tắc về vị trí cũ (trạng thái chỉ đổi khi máy chủ trả về) + toast lỗi. */
  const doi = async (bat: boolean, hoanTac = false) => {
    if (dang.current) return;
    dang.current = true; setBusy(true);
    try {
      setVua(await api.put<TrangThai>('/admin/mo-sua-lich-test', { bat }));
      const chu = bat ? t('Đã mở sửa lịch Test') : t('Đã tắt mở sửa lịch Test');
      if (hoanTac) toast.push('ok', t('Đã hoàn tác'));
      else toast.hoanTac(chu, () => doi(!bat, true), { key: 'mo-sua-lich-test' });
      void napLaiPhien();   // cờ `moSuaLichTest` của phiên (nạp lại phiên cũng xoá bản vừa xem)
    } catch (e: any) {
      toast.push('error', e?.message ?? t('Không lưu được'));
    } finally { dang.current = false; setBusy(false); }
  };

  if (error) return <Card title={t('Mở sửa lịch Test')}><ErrorState message={error.message} hint={error.hint} status={error.status} onRetry={reload} /></Card>;
  if (loading || !data) return <Card title={t('Mở sửa lịch Test')}><Skeleton rows={1} /></Card>;
  return (
    /* QTV2-QUYEN: MỘT hàng — tên + ⓘ (hậu quả) · trạng thái · ai bật · nút. */
    <section className="card flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3">
      <h2 className="h-khoi m-0 inline-flex items-center gap-1.5 text-lg font-bold text-slate-100">{t('Mở sửa lịch Test')}
        <NutLuat label={t('Mở sửa lịch Test')}>{t('Mở: GVCN (lớp mình), Admin, Quản lý sửa được lịch Test kể cả Thứ Sáu – CN.')}</NutLuat></h2>
      {data.bat && (
        <span className="min-w-0 break-words text-sm text-slate-300" role="status">
          {t('Bật bởi {nguoi} lúc {luc}', { nguoi: data.nguoi ?? '—', luc: data.luc ? fmtDateTime(data.luc) : '—' })}
        </span>
      )}
      <button type="button" role="switch" aria-checked={data.bat} disabled={busy} aria-busy={busy || undefined}
        aria-label={`${t('Mở sửa lịch Test')}: ${data.bat ? t('Có') : t('Không')}`} onClick={() => void doi(!data.bat)}
        className={`ml-auto inline-flex min-h-[44px] cursor-pointer items-center gap-2 border-0 bg-transparent text-[13px] font-semibold sm:min-h-[36px] ${data.bat ? 'text-slate-100' : 'text-slate-400'}`}>
        {data.bat ? t('Có') : t('Không')}
        <span aria-hidden className={`relative h-[22px] w-[38px] shrink-0 rounded-full border transition-colors ${data.bat ? 'border-[color:var(--accent)] bg-[color:var(--accent)]' : 'border-[color:var(--line-strong)] bg-[color:var(--surface-2)]'}`}>
          <span className={`absolute left-0 top-[2px] h-4 w-4 rounded-full transition-transform ${data.bat ? 'translate-x-[18px] bg-[color:var(--bg)]' : 'translate-x-[2px] bg-slate-400'}`} />
        </span>
      </button>
    </section>
  );
}
