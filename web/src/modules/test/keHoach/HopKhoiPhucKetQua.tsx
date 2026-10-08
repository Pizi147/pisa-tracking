import { useState } from 'react';
import { api, invalidate } from '../../../lib/api.ts';
import { ConfirmDialog } from '../../../ui/Drawer.tsx';
import { Truong } from '../../../ui/KhungPanel.tsx';
import { useToast } from '../../../ui/Toast.tsx';
import type { KetQuaHuy } from '@shared/domain/index.ts';

/**
 * HỘP "KHÔI PHỤC KẾT QUẢ" (PR-MTb Task 8, T2): Quản lý trả lại điểm của MT đã huỷ do dời vượt. Dùng chung hồ sơ Mock (menu đầu
 * trang) và ⋯ hàng Lộ trình. Lý do TUỲ CHỌN. Máy chủ chặn khi ô đã có điểm mới / lượt vượt vẫn đứng sau (R1 Q2): câu lỗi hiện
 * trong hộp, hộp mở, chữ đã gõ còn nguyên (state của hộp, không remount).
 */
export function HopKhoiPhucKetQua({ attemptId, nhan, ketQua, onDong, onXong }: {
  attemptId: number; nhan: string; ketQua: KetQuaHuy; onDong: () => void; onXong: () => void;
}) {
  const toast = useToast();
  const [lyDo, setLyDo] = useState('');
  const [busy, setBusy] = useState(false);
  const [loiMay, setLoiMay] = useState<string | null>(null);
  const lam = async () => {
    if (busy) return;
    setBusy(true); setLoiMay(null);
    try {
      await api.post(`/attempts/${attemptId}/khoi-phuc-ket-qua`, { lyDo: lyDo.trim() || null });
      for (const k of ['/attempts', '/tong-quan', '/classes', '/students', '/ke-hoach-test', '/cycles', '/my-work']) invalidate(k);
      toast.push('ok', `Đã khôi phục kết quả ${nhan}`);
      onXong(); onDong();
    } catch (e: any) { setLoiMay(e.message); } finally { setBusy(false); }
  };
  return (
    <ConfirmDialog open z="z-[80]" busy={busy} closeLabel="Đóng" confirmLabel="Khôi phục" title={`Khôi phục kết quả ${nhan}?`}
      onClose={onDong} onConfirm={() => void lam()}
      body={(
        <div className="space-y-3">
          <p className="m-0">{nhan}: {ketQua.soDiem} điểm đã huỷ{ketQua.vuotBoi ? ` khi dời ${ketQua.vuotBoi}` : ''}.</p>
          <Truong nhan="Lý do" tuyChon>
            <textarea className="field w-full" rows={2} maxLength={300} value={lyDo} onChange={(e) => setLyDo(e.target.value)} />
          </Truong>
          {loiMay && <p className="m-0 text-xs font-semibold text-bad" role="alert">{loiMay}</p>}
        </div>
      )} />
  );
}
