import { useState } from 'react';
import { ApiError, api, invalidate } from '../../lib/api.ts';
import { useToast } from '../../ui/Toast.tsx';
import { Truong } from '../../ui/KhungPanel.tsx';
import { ChonNguoi } from '../../ui/PeoplePicker.tsx';
import { t } from '@shared/i18n/index.ts';

/**
 * R1-NO-CU (đặc tả 27/10 mục 4.5, D17): hộp một ô đổi người phụ trách Case — dùng ở dải đầu Ngăn Case và ở dòng việc "Chọn người phụ trách" (Công việc).
 * Danh sách = ứng viên máy chủ gửi (`doiChu.ungVien`: GV dạy kỹ năng của Case ở lớp em + GVCN); máy chủ kiểm lại. `ownerCu` = người lúc mở —
 * người khác vừa đổi → 409: câu lỗi dưới ô, nơi gọi tải lại Case, GIỮ người đang chọn.
 */
export function DoiNguoiPhuTrach({ caseId, ownerCu, ungVien, onXong, onTaiLai, onHuy }: {
  caseId: number; ownerCu: number | null; ungVien: { id: number; ten: string | null }[];
  onXong: () => void; onTaiLai: () => void; onHuy?: () => void;
}) {
  const toast = useToast();
  const ds = ungVien.filter((u) => u.id !== ownerCu).map((u) => ({ id: u.id, ten: u.ten ?? '—' }));
  const [chon, setChon] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [loi, setLoi] = useState<string | null>(null);
  const luu = async () => {
    if (chon === null) { setLoi(t('Chọn người phụ trách.')); return; }
    setBusy(true); setLoi(null);
    try {
      await api.post(`/cases/${caseId}/nguoi-phu-trach`, { ownerId: chon, ownerCu });
      invalidate('/cases'); invalidate('/my-work'); invalidate('/students');
      toast.push('ok', t('Đã đổi người phụ trách: {ten}', { ten: ds.find((u) => u.id === chon)?.ten ?? '' }));
      onXong();
    } catch (e: any) {
      setLoi(e?.message ?? t('Không lưu được'));
      if (e instanceof ApiError && e.status === 409) onTaiLai();
    } finally { setBusy(false); }
  };
  const ten = ds.find((u) => u.id === chon)?.ten;
  return (
    <div className="flex flex-col gap-2">
      <Truong nhan={t('Người phụ trách')} batBuoc loi={loi} as="div">
        <ChonNguoi nhom="giao_vien" choToi={false} choNgoai={false} tuMo ariaLabel={t('Người phụ trách')} ds={ds}
          value={chon !== null && ten ? { kieu: 'tai_khoan', id: chon, ten } : null}
          onChange={(v) => { setChon(v?.kieu === 'tai_khoan' ? v.id : null); setLoi(null); }} />
      </Truong>
      <div className="flex flex-wrap gap-2">
        <button type="button" className="btn btn-primary min-h-[44px] sm:min-h-0" disabled={busy} onClick={() => void luu()}>{busy ? t('Đang lưu…') : t('Lưu · đóng')}</button>
        {onHuy && <button type="button" className="btn min-h-[44px] sm:min-h-0" disabled={busy} onClick={onHuy}>{t('Đóng')}</button>}
      </div>
    </div>
  );
}
