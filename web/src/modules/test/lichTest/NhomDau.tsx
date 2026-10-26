import type { ReactNode } from 'react';
import { MuiTenMo } from '../../../ui/HangNhom.tsx';

/**
 * ĐẦU NHÓM của Lịch tuần (UI-LICH-TUAN, dieu-chinh-cuoi khu a `.nhom-dau`): ▸ tên nhóm đậm + dòng tóm tắt chữ thường; "Quá hạn chấm" chữ đỏ.
 * R1-PHAN-CAP-TEST (M2 A2): thanh nền `--cap-nhom`, chữ 17 / 700 (mockup 16 → bậc thang chữ), số 13 / 500 — không viền; hai nhóm cách nhau khe 10 px nền thẻ (LichTestTab).
 * Bấm cả dải để mở / thu. `rong`: không có gì để mở — dải tĩnh, không mũi tên (vị trí nhóm không nhảy — PR-LT3 D1).
 */
export function NhomDau({ id, mo, onMo, tieuDe, phu, qua, rong, children }: {
  id: string; mo: boolean; onMo: () => void; tieuDe: string; phu?: ReactNode; qua?: boolean; rong?: boolean; children?: ReactNode;
}) {
  return (
    <section>
      <div className={`flex min-h-[48px] items-center gap-2.5 bg-[color:var(--cap-nhom)] px-4 py-2.5 text-lg font-bold ${rong ? '' : 'cursor-pointer'} ${qua && !rong ? 'text-late' : rong ? 'text-slate-400' : 'text-slate-100'}`}
        onClick={rong ? undefined : (e) => { if (!(e.target as HTMLElement).closest('a,button')) onMo(); }}>
        {rong ? <span className="h-4 w-4 shrink-0" aria-hidden /> : <MuiTenMo mo={mo} onMo={onMo} nhan={tieuDe} />}
        <span className="whitespace-nowrap">{tieuDe}</span>
        {phu && <span className="min-w-0 text-[13px] font-medium text-slate-400">{phu}</span>}
      </div>
      {mo && !rong && <div id={id}>{children}</div>}
    </section>
  );
}
