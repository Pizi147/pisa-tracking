import { useState, type MouseEvent } from 'react';
import { api, invalidate } from '../../lib/api.ts';
import { useToast } from '../../ui/Toast.tsx';
import { t } from '@shared/i18n/index.ts';
import { useKhoiPhucThiThat } from './PanelBuocTiep.tsx';

const LAM_MOI = ['/students', '/classes', '/hoc-vien-lop', '/lo-trinh', '/my-work', '/work', '/cycles', '/tong-quan'];

/**
 * SAU-THI-GON (chủ SP 21/11): "Không thi" bấm TẠI CHỖ khi ngày thi đã qua mà chưa có KQ — dòng Công việc, ô Lịch thi, hồ sơ HV. Một bấm lưu ngay (đường sẵn có
 * `PUT /cycles/:id/outcome {khongThi}` — máy chủ kiểm quyền, giữ ghi chú cũ) + toast "Đã lưu · Không thi · Hoàn tác" (khôi phục bản trước). Nơi gọi chỉ vẽ nút khi người xem
 * nhập KQ được (cùng điều kiện nút Nhập KQ). Sau đó Bước tiếp như cũ.
 */
export function NutKhongThi({ cycleId, className = 'btn btn-sm min-h-[44px] whitespace-nowrap sm:min-h-0', onDone }: { cycleId: number; className?: string; onDone?: () => void }) {
  const toast = useToast();
  const [dang, setDang] = useState(false);
  const khoiPhuc = useKhoiPhucThiThat(cycleId, onDone);
  const bam = async (e: MouseEvent) => {
    e.stopPropagation();
    setDang(true);
    try {
      const r = await api.put<{ khoiPhucId?: number | null }>(`/cycles/${cycleId}/outcome`, { khongThi: true });
      LAM_MOI.forEach((k) => invalidate(k));
      onDone?.();
      const id = r?.khoiPhucId ?? null;
      if (id) toast.hoanTac(t('Đã lưu · Không thi'), () => { khoiPhuc(id, true).catch((x: any) => toast.push('error', x?.message ?? t('Không lưu được'))); }, { key: `thi-that:${cycleId}` });
      else toast.push('ok', t('Đã lưu · Không thi'));
    } catch (x: any) { toast.push('error', x?.message ?? t('Không lưu được')); } finally { setDang(false); }
  };
  return <button type="button" className={className} disabled={dang} onClick={(e) => void bam(e)}>{dang ? t('Đang lưu…') : t('Không thi')}</button>;
}
