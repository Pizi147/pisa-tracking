import { useState, type ReactNode } from 'react';
import { useApi } from '../../lib/useApi.ts';
import { Drawer } from '../../ui/Drawer.tsx';
import { SoLieuO } from '../../ui/SoLieuO.tsx';
import { DongDanhSach, type DongSoLieu } from '../../ui/SoLieu.tsx';
import { Empty, ErrorState, Skeleton } from '../../ui/ui.tsx';
import { KHOANG_MAC_DINH, type ChuongTrinh, type Khoang } from '@shared/domain/index.ts';

/**
 * `SoLieuO` trong ô bảng căn phải: ngăn danh sách (Drawer) nằm ngay dưới ô nên thừa hưởng `text-align: right` — bọc `text-left` để chữ trong
 * ngăn căn trái như mọi ngăn khác.
 */
export function SoO(props: Parameters<typeof SoLieuO>[0]) {
  return <span className="inline-block text-left"><SoLieuO {...props} /></span>;
}

/** Props chung của các góc nhìn của Phân tích — cùng bộ lọc chi nhánh · chương trình · khoảng · lớp (PhanTich.tsx). */
export type PhamViPhanTich = { branchId: number | null; ct: ChuongTrinh; tg: Khoang; classId: number | null };

/** Chuỗi tham số bộ lọc chung, cùng luật với `TongHopTestSos` (không ghi tham số mặc định). */
export function thamSoLoc(p: PhamViPhanTich, them: Record<string, string> = {}): string {
  const qs = new URLSearchParams();
  if (p.branchId) qs.set('branchId', String(p.branchId));
  if (p.ct !== 'ca-hai') qs.set('ct', p.ct);
  if (p.tg !== KHOANG_MAC_DINH) qs.set('tg', String(p.tg));
  if (p.classId) qs.set('lop', String(p.classId));
  for (const [k, v] of Object.entries(them)) qs.set(k, v);
  return qs.toString();
}

/**
 * Cột đầu của hàng lớn/hàng con DÍNH TRÁI khi bảng cuộn ngang (375px, G-11). `HangNhom`/`HangCon` (UX0) không có `sticky-col`
 * nên đặt bằng biến thể `td:first-child`; nền của `td` đã do CSS `.hang-lon`/`.hang-con` tô đặc nên không lộ chữ phía sau.
 */
export const DINH_TRAI = '[&>td:first-child]:sticky [&>td:first-child]:left-0 [&>td:first-child]:z-[5]';

/**
 * NÚT CHỮ MỞ MỘT NGĂN DANH SÁCH (G-8: một ngăn một lúc, G-10: số ngăn = số dòng). Giống `SoLieuO nguon=…` nhưng nút là một cụm chữ
 * ("Mở danh sách Case cần GV phân loại →") chứ không phải một con số; nguồn phải trả `{ n, tieuDe, rows }` bằng chính hàm sinh ra số.
 */
export function NutMoDanhSach({ nguon, tieuDe, children, className = '' }: { nguon: string; tieuDe: string; children: ReactNode; className?: string }) {
  const [mo, setMo] = useState(false);
  const { data, loading, error, reload } = useApi<{ n: number; tieuDe: string; rows: DongSoLieu[] }>(mo ? nguon : null, [nguon, mo]);
  return (
    <>
      <button type="button" onClick={() => setMo(true)}
        className={`appearance-none bg-transparent border-0 p-0 cursor-pointer underline decoration-dotted underline-offset-4 hover:text-white ${className}`}>
        {children}
      </button>
      <Drawer open={mo} onClose={() => setMo(false)} title={data?.tieuDe ?? tieuDe} subtitle="Đúng những mục tạo nên con số vừa bấm">
        {error ? <ErrorState message={error.message} hint={error.hint} onRetry={reload} />
          : loading || !data ? <Skeleton rows={5} />
          : !data.rows.length ? <Empty title="Không có mục nào" />
          : <DongDanhSach rows={data.rows} onPick={() => setMo(false)} />}
      </Drawer>
    </>
  );
}

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
