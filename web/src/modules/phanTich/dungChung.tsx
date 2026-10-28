import type { ReactNode } from 'react';
import { OSo } from '../../ui/OSo.tsx';
import type { ChuongTrinh, KhoangNgay } from '@shared/domain/index.ts';

/**
 * `OSo` trong ô bảng căn phải: ngăn danh sách (KhungPanel) nằm ngay dưới ô nên thừa hưởng `text-align: right` — bọc `text-left` để chữ trong
 * ngăn căn trái như mọi ngăn khác.
 */
export function SoO(props: Parameters<typeof OSo>[0]) {
  return <span className="inline-block text-left"><OSo {...props} /></span>;
}

/** Props chung của các góc nhìn của Phân tích — cùng bộ lọc chi nhánh · chương trình · khoảng thời gian (OV-15e, C29) · lớp (PhanTich.tsx). */
export type PhamViPhanTich = { branchId: number | null; ct: ChuongTrinh | null; khoang: KhoangNgay; classId: number | null };

/** Chuỗi tham số bộ lọc chung gửi máy chủ — khoảng LUÔN ghi rõ `kieu`/`tu`/`den` (máy chủ không tự đoán mặc định). */
export function thamSoLoc(p: PhamViPhanTich, them: Record<string, string> = {}): string {
  const qs = new URLSearchParams();
  if (p.branchId) qs.set('branchId', String(p.branchId));
  if (p.ct) qs.set('ct', p.ct);   // null = khối gộp (Ý thức)
  qs.set('kieu', p.khoang.kieu); qs.set('tu', p.khoang.tu); qs.set('den', p.khoang.den);
  if (p.classId) qs.set('lop', String(p.classId));
  for (const [k, v] of Object.entries(them)) qs.set(k, v);
  return qs.toString();
}

/**
 * Cột đầu của hàng lớn/hàng con DÍNH TRÁI khi bảng cuộn ngang (375px, G-11). `HangNhom`/`HangCon` (UX0) không có `sticky-col`
 * nên đặt bằng biến thể `td:first-child`; nền của `td` đã do CSS `.hang-lon`/`.hang-con` tô đặc nên không lộ chữ phía sau.
 */
export const DINH_TRAI = '[&>td:first-child]:sticky [&>td:first-child]:left-0 [&>td:first-child]:z-[5]';

/** Dòng tóm tắt đầu bảng: `<b>27 học viên có Case…</b> · 38 Case · 9 lớp` + ⓘ luật. */
export function DongTomTat({ chinh, phu, luat }: { chinh: ReactNode; phu?: ReactNode; luat?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1 px-4 py-2.5 text-sm">
      <b className="font-semibold text-slate-100">{chinh}</b>
      {phu && <span className="text-xs text-slate-500">· {phu}</span>}
      {luat}
    </div>
  );
}

/** `↑3` đỏ (nhiều hơn) · `↓1` xanh lá (ít hơn) · `=` xám — cùng luật với `nhanSoVoiTruoc` của luật thuần. */
export const MAU_SO_VOI_TRUOC = { bad: 'text-bad', ok: 'text-ok', muted: 'text-faint' } as const;
