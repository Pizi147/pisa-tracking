import { useState } from 'react';
import { ConfirmDialog } from '../../../ui/Drawer.tsx';
import { kiemLyDoThaoTac, type LuotSeHuyLich } from '@shared/domain/index.ts';

export type { LuotSeHuyLich };

/**
 * HỘP XÁC NHẬN DỜI VƯỢT (PR-LM Q-0310-1; PR-MTa T2; PR-MTb T6 — mockup test-MT 05/10 phần 4). Chỉ mở khi lượt bị vượt ĐÃ CÓ ĐIỂM
 * (`canLyDoVuot`) — chưa điểm thì lưu thẳng, nơi gọi hiện chip vàng. Chữ do nơi gọi dựng bằng `chuDoiVuot` / `chuXepVuotGop`
 * (`lichMt.ts`): `tieuDe`, `cau` (có thể trống), `dong` = mỗi lượt / mỗi em một dòng hệ quả. Lý do BẮT BUỘC (`kiemLyDoThaoTac('huy-ket-qua')`).
 * Dùng chung cho hộp một đợt (Kế hoạch Test, hồ sơ HV › Lộ trình), "Dời lịch thi cả đợt", dời một kỹ năng và panel hàng loạt.
 *
 * Chống mất chữ: ô Lý do là state của hộp — nơi gọi giữ hộp MỞ khi lưu lỗi (`loiMay`) và khi 409 trả danh sách mới (chỉ đổi props,
 * không remount), nên chữ đã gõ còn nguyên. `lyDoDau` = chữ đã gõ ở ô lý do của hộp mẹ (chỉ lấy lúc mở).
 */
export function HopXacNhanHuyLich({ tieuDe, cau, dong, busy, loiMay = null, lyDoDau = '', onDong, onXacNhan }: {
  tieuDe: string; cau: string; dong: string[]; busy: boolean;
  /** Lỗi máy chủ lúc lưu (không phải 409) — hiện dưới ô Lý do, hộp vẫn mở. */
  loiMay?: string | null; lyDoDau?: string;
  onDong: () => void; onXacNhan: (lyDo: string) => void;
}) {
  const [lyDo, setLyDo] = useState(lyDoDau);
  const loi = kiemLyDoThaoTac('huy-ket-qua', lyDo);
  return (
    <ConfirmDialog open z="z-[80]" danger busy={busy} closeLabel="Đóng" confirmLabel="Dời và huỷ" confirmDisabled={!!loi} confirmTitle={loi ?? undefined}
      title={tieuDe}
      onClose={onDong} onConfirm={() => { if (!loi) onXacNhan(lyDo.trim()); }}
      body={(
        <>
          {cau && <p className="m-0 mb-1.5">{cau}</p>}
          <ul className="m-0 mb-3 list-disc space-y-0.5 pl-5">
            {dong.map((x) => <li key={x}>{x}</li>)}
          </ul>
          <label className="block">
            <span className="label">Lý do</span>
            <textarea className="field w-full" rows={2} maxLength={300} autoFocus aria-required="true" aria-describedby={loiMay ? 'hop-vuot-loi' : undefined}
              value={lyDo} onChange={(e) => setLyDo(e.target.value)} />
          </label>
          {loiMay && <p id="hop-vuot-loi" className="m-0 mt-1.5 text-xs font-semibold text-bad" role="alert">{loiMay}</p>}
        </>
      )} />
  );
}
