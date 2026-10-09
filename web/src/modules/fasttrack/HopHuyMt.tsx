import { useState } from 'react';
import { api, invalidate } from '../../lib/api.ts';
import { useApi } from '../../lib/useApi.ts';
import { useToast } from '../../ui/Toast.tsx';
import { ConfirmDialog } from '../../ui/Drawer.tsx';
import { Truong } from '../../ui/KhungPanel.tsx';

export type HeQuaHuy = { cachDuoc: 'ca-luot' | null; case: number; pa: number; phoiHop: number };

/**
 * HỘP HUỶ MT{n} (PR-MTGON luật 4, T67): một câu nói hệ quả, kèm Case / Phối hợp sẽ đóng. Lý do tuỳ chọn (rà #282) — trống thì nhật ký ghi "Huỷ MT{n}".
 * PR-HOP1: dùng ở Hồ sơ MT và ⋯ đầu `HopKyNang`. Không truyền `heQua` thì tự đọc `viewer.huyLuot` của lượt (`trongHop`: nằm trên hộp z-60).
 */
export function HopHuyMt({ open, onClose, attemptId, attemptNo, heQua, trongHop, onDone }: {
  open: boolean; onClose: () => void; attemptId: number; attemptNo: number; heQua?: HeQuaHuy | null; trongHop?: boolean; onDone: () => void;
}) {
  const toast = useToast();
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const doc = useApi<{ viewer: { huyLuot: HeQuaHuy | null } }>(open && heQua === undefined ? `/attempts/${attemptId}` : null);
  const hq = heQua === undefined ? doc.data?.viewer.huyLuot ?? null : heQua;
  const dong = hq ? [hq.case ? `${hq.case} Case` : null, hq.phoiHop ? `${hq.phoiHop} việc Phối hợp` : null].filter(Boolean) : [];
  return (
    <ConfirmDialog
      open={open} onClose={onClose} danger busy={busy} z={trongHop ? 'z-[70]' : undefined}
      title={`Huỷ MT${attemptNo}?`} closeLabel="Không huỷ" confirmLabel={`Huỷ MT${attemptNo}`}
      body={
        <div className="space-y-2">
          <p>Lịch và điểm của lượt này sẽ bỏ. Xếp lại thì vẫn là MT{attemptNo}.</p>
          {dong.length > 0 && <p>Đóng {dong.join(', ')} sinh từ lượt này.</p>}
          <Truong nhan="Lý do" tuyChon>
            <input className="field" value={reason} maxLength={300} onChange={(e) => setReason(e.target.value)} placeholder="Ví dụ: em nghỉ học" />
          </Truong>
        </div>
      }
      onConfirm={async () => {
        setBusy(true);
        try {
          await api.post(`/attempts/${attemptId}/cancel`, { reason: reason.trim() || null });
          invalidate('/attempts'); invalidate('/tong-quan'); invalidate('/ke-hoach-test');
          onDone(); onClose(); toast.push('ok', `Đã huỷ MT${attemptNo}`);
        } catch (e: any) { toast.push('error', e.message); } finally { setBusy(false); }
      }}
    />
  );
}
