import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../ui/Toast.tsx';
import { t } from '@shared/i18n/index.ts';
import { useDaXemHd, useVaiHd } from './MucHuongDan.tsx';

/**
 * HD-a — DẢI "Mới dùng PISA TRACKING?" ở Tổng quan (mockup OV-13 §5c): chỉ tài khoản chưa mở Hướng dẫn, vai đã có nội dung. Xem → trang Hướng dẫn
 * (trang tự ghi "đã xem"); Ẩn → tắt hẳn, nhớ theo tài khoản (vẫn mở được qua menu Tài khoản › Hướng dẫn, OV-15a). Lưu lỗi thì dải hiện lại + báo.
 */
export function DaiMoiDung() {
  const { chuaXem, ghi } = useDaXemHd();
  const { coNoiDung } = useVaiHd();
  const [an, setAn] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();
  if (!chuaXem || !coNoiDung || an) return null;
  return (
    /* TQ-GON (M8): MỘT hàng cả ở 375 — chữ + Xem · Ẩn cùng hàng; câu phụ "Xem 5 việc…" chỉ ở màn rộng (375 rê / đọc màn vẫn có qua `title`). */
    <div className="card flex items-center gap-x-3 px-3.5 py-2 text-sm text-slate-300" style={{ borderColor: 'var(--accent-line)' }} title={t('Xem 5 việc hằng tuần của bạn (3 phút)')}>
      <span className="min-w-0 flex-1"><b className="font-semibold text-slate-100">{t('Mới dùng PISA TRACKING?')}</b><span className="max-sm:hidden">{' '}{t('Xem 5 việc hằng tuần của bạn (3 phút)')}</span></span>
      <span className="flex shrink-0 gap-2">
        <button type="button" className="btn btn-primary btn-sm max-sm:min-h-[44px]" onClick={() => navigate('/huong-dan')}>{t('Xem')}</button>
        <button type="button" className="btn btn-sm btn-ghost max-sm:min-h-[44px]" onClick={async () => {
          setAn(true);
          if (!(await ghi())) { setAn(false); toast.push('error', t('Không lưu được — thử lại.')); }
        }}>{t('Ẩn')}</button>
      </span>
    </div>
  );
}
