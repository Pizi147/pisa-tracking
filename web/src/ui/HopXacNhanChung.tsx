import { useEffect, useState } from 'react';
import { t } from '../../../shared/i18n/index.ts';
import { datHoiXacNhan } from '../lib/api.ts';
import { ConfirmDialog } from './Drawer.tsx';

/** RKC: hộp hỏi chung cho 409 `canXacNhan` (lib/api.ts) — câu máy chủ nêu đúng ảnh hưởng; đồng ý → gửi lại, Đóng → thao tác báo lỗi như cũ. */
export function HopXacNhanChung() {
  const [hoi, setHoi] = useState<{ cau: string; nut?: string; tra: (ok: boolean) => void } | null>(null);
  useEffect(() => datHoiXacNhan((cau, nut) => new Promise<boolean>((tra) => setHoi({ cau, nut, tra }))), []);
  const dong = (ok: boolean) => { hoi?.tra(ok); setHoi(null); };
  return (
    <ConfirmDialog open={!!hoi} onClose={() => dong(false)} onConfirm={() => dong(true)} title={t('Xác nhận')}
      body={hoi?.cau} confirmLabel={hoi?.nut ?? t('Vẫn làm')} z="z-[90]" />
  );
}
