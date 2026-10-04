import { ConfirmDialog } from '../../../ui/Drawer.tsx';
import { useNgayNghiepVu } from '../../../ui/ngayNghiepVu.ts';
import { tuanLich } from '@shared/domain/index.ts';

/** Một lượt sẽ bị huỷ lịch vì bị vượt — `seHuyLich` của `/ke-hoach-test/dot/kiem` hoặc `details` của 409. */
export type LuotSeHuyLich = { attemptId: number; nhan: string; tuan: string };

/**
 * HỘP XÁC NHẬN HUỶ LỊCH (PR-LM, Q-0310-1): dời một MT vượt lượt sau thì lượt bị vượt bỏ tuần, giữ lượt. Nêu từng lượt và tuần đang có
 * trước khi lưu — không lưu ngầm. Dùng chung cho hộp xếp lịch (Kế hoạch Test, panel Lộ trình) và "Dời lịch thi cả đợt".
 */
export function HopXacNhanHuyLich({ ds, busy, onQuayLai, onXacNhan }: {
  ds: LuotSeHuyLich[]; busy: boolean; onQuayLai: () => void; onXacNhan: () => void;
}) {
  const { homNay } = useNgayNghiepVu();
  return (
    <ConfirmDialog open z="z-[80]" danger busy={busy} closeLabel="Quay lại" confirmLabel="Huỷ lịch và lưu"
      title={`Huỷ lịch ${ds.map((x) => x.nhan).join(', ')}?`}
      onClose={onQuayLai} onConfirm={onXacNhan}
      body={(
        <>
          <p className="m-0 mb-2">Lịch mới vượt qua {ds.length === 1 ? 'lượt này' : 'các lượt này'}. Lưu thì {ds.length === 1 ? 'lượt' : 'các lượt'} dưới đây về <b>Chưa xếp lịch</b> — lượt vẫn giữ số MT, chưa có điểm nào bị đụng tới.</p>
          <ul className="m-0 list-disc space-y-0.5 pl-5">
            {ds.map((x) => <li key={x.attemptId}><b className="text-slate-100">{x.nhan}</b> · đang ở {tuanLich(x.tuan, homNay)}</li>)}
          </ul>
        </>
      )} />
  );
}
