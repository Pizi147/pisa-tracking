import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../ui/Toast.tsx';
import { t } from '@shared/i18n/index.ts';
import { useDaXemHd, useVaiHd } from './MucHuongDan.tsx';

/**
 * HD-a — DẢI "Mới dùng PISA?" ở Tổng quan (mockup OV-13 §5c): chỉ tài khoản chưa mở Hướng dẫn, vai đã có nội dung. Xem → trang Hướng dẫn
 * (trang tự ghi "đã xem"); Ẩn → tắt hẳn, nhớ theo tài khoản (vẫn mở được qua "?"). Lưu lỗi thì dải hiện lại + báo.
 */
export function DaiMoiDung() {
  const { chuaXem, ghi } = useDaXemHd();
  const { coNoiDung } = useVaiHd();
  const [an, setAn] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();
  if (!chuaXem || !coNoiDung || an) return null;
  return (
    <div className="card flex flex-wrap items-center gap-x-3 gap-y-2 px-3.5 py-2.5 text-sm text-slate-300" style={{ borderColor: 'var(--accent-line)' }}>
      <span className="min-w-0 flex-1 basis-[16rem]"><b className="font-semibold text-slate-100">{t('Mới dùng PISA?')}</b>{' '}{t('Xem 5 việc hằng tuần của bạn (3 phút)')}</span>
      <span className="flex gap-2 max-sm:w-full [&>button]:max-sm:flex-1 [&>button]:max-sm:justify-center">
        <button type="button" className="btn btn-primary btn-sm" onClick={() => navigate('/huong-dan')}>{t('Xem')}</button>
        <button type="button" className="btn btn-sm btn-ghost" onClick={async () => {
          setAn(true);
          if (!(await ghi())) { setAn(false); toast.push('error', t('Không lưu được — thử lại.')); }
        }}>{t('Ẩn')}</button>
      </span>
    </div>
  );
}
