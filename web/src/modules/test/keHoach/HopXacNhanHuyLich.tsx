import { useState } from 'react';
import { ConfirmDialog } from '../../../ui/Drawer.tsx';
import { dongHeQuaVuot, type LuotSeHuyLich } from '@shared/domain/index.ts';

export type { LuotSeHuyLich };

/**
 * HỘP XÁC NHẬN DỜI VƯỢT (PR-LM Q-0310-1; PR-MTa T2, mockup 05/10 phần 4): chỉ mở khi lượt bị vượt ĐÃ CÓ ĐIỂM (`canLyDoVuot`) — chưa
 * điểm thì lưu thẳng. Mỗi lượt một dòng hệ quả (`dongHeQuaVuot`), Lý do bắt buộc. Dùng chung cho hộp xếp lịch (Kế hoạch Test, panel
 * Lộ trình), "Dời lịch thi cả đợt" và dời một kỹ năng. Tiêu đề đúng mockup ("Dời MT1 sang W2 NOV?") thuộc PR-MTb.
 */
export function HopXacNhanHuyLich({ ds, busy, onQuayLai, onXacNhan }: {
  ds: LuotSeHuyLich[]; busy: boolean; onQuayLai: () => void; onXacNhan: (lyDo: string) => void;
}) {
  const [lyDo, setLyDo] = useState('');
  return (
    <ConfirmDialog open z="z-[80]" danger busy={busy} closeLabel="Đóng" confirmLabel="Dời và huỷ" confirmDisabled={!lyDo.trim()}
      title="Dời và huỷ kết quả?"
      onClose={onQuayLai} onConfirm={() => onXacNhan(lyDo.trim())}
      body={(
        <>
          <ul className="m-0 mb-3 list-disc space-y-0.5 pl-5">
            {ds.map((x) => <li key={x.attemptId}>{dongHeQuaVuot(x)}</li>)}
          </ul>
          <label className="block">
            <span className="label">Lý do</span>
            <textarea className="field w-full" rows={2} maxLength={300} value={lyDo} onChange={(e) => setLyDo(e.target.value)} />
          </label>
        </>
      )} />
  );
}
