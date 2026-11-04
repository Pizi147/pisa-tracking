import { createContext, useContext, type ReactNode, type SelectHTMLAttributes } from 'react';
import { createPortal } from 'react-dom';
import { useSearchParams } from 'react-router-dom';
import { OSo } from '../../ui/OSo.tsx';
import { NutLuat } from '../../ui/NutLuat.tsx';
import { t } from '@shared/i18n/index.ts';
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

/* ------------------------------------------------------------------ V8-PT (mockup `thiet-ke/v8/phan-tich.html`, chủ SP duyệt 29/10) */

/** Ô đoạn của hàng lọc (`.doan`): cao 36 (375: 44, hết bề rộng), chữ 14, viền ô nhập; mục đang chọn nền nhấn nhạt + chữ đậm + vạch đáy nhấn. */
export const DOAN = 'inline-flex h-9 shrink-0 overflow-hidden rounded-lg border border-[color:var(--o-nhap-vien)] max-sm:h-11 max-sm:w-full';
export const doanNut = (bat: boolean) => `inline-flex cursor-pointer items-center justify-center gap-1.5 whitespace-nowrap border-0 px-3 text-sm [&+button]:border-l [&+button]:border-[color:var(--o-nhap-vien)] max-sm:flex-1 max-sm:px-1.5 max-sm:text-[15px] ${
  bat ? 'bg-[color:var(--accent-soft)] font-bold text-[color:var(--text)] shadow-[inset_0_-2px_0_var(--accent)]' : 'bg-[color:var(--o-nhap-nen)] font-medium text-[color:var(--text-dim)] hover:text-[color:var(--text)]'}`;

/** Ô chọn của hàng lọc (`.o-chon`): ô chọn gốc (bàn phím, đọc màn hình) dáng ô nhập cao 36, chữ 14, mũi tên nét mảnh; `dangLoc` = viền nhấn khi đang lọc. */
export function OChon({ className = '', dangLoc = false, children, ...p }: SelectHTMLAttributes<HTMLSelectElement> & { dangLoc?: boolean }) {
  return (
    <span className={`relative inline-flex shrink-0 ${className}`}>
      <select {...p} className={`h-9 w-full cursor-pointer appearance-none rounded-lg border bg-[color:var(--o-nhap-nen)] pl-3 pr-8 text-sm text-[color:var(--text)] max-sm:h-11 ${
        dangLoc ? 'border-[color:var(--accent)] font-bold shadow-[inset_0_0_0_1px_var(--accent)]' : 'border-[color:var(--o-nhap-vien)] font-medium'}`}>{children}</select>
      <svg aria-hidden className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[color:var(--text-faint)]" width="10" height="6" viewBox="0 0 10 6" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M1 1l4 4 4-4" /></svg>
    </span>
  );
}

/** V8-PT: số trong chip Đạt / SOS không gạch chân, mang màu chip (chip đã là ô bấm — mockup `.chip-so`). */
export const SO_TRONG_CHIP = '!no-underline !text-inherit !font-semibold';

/** PT-GON (M7): khung rỗng của Phân tích — MỘT câu ở đầu khung (không căn giữa khung cao, không câu phụ) + nút (Xem Toàn bộ). */
export function RongDau({ chu, nut }: { chu: string; nut?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3">
      <p className="m-0 text-sm text-[color:var(--text-dim)]">{chu}</p>{nut}
    </div>
  );
}

/** V8-PT (D2): rỗng → một bấm sang "Toàn bộ" (cùng tham số khoảng chung với ô Thời gian); đang Toàn bộ thì không vẽ. */
export function NutXemToanBo() {
  const [params, setParams] = useSearchParams();
  if (params.get('kieu') === 'toan-bo') return null;
  const xem = () => {
    const next = new URLSearchParams(params);
    next.set('kieu', 'toan-bo'); next.delete('tu'); next.delete('den');
    setParams(next, { replace: false });
  };
  return <button type="button" className="btn btn-sm min-h-[44px] sm:min-h-0" onClick={xem}>{t('Xem Toàn bộ')}</button>;
}

/** Nút Xuất Excel cuối hàng lọc (mockup `XUAT`); 375: nút vuông 44 chỉ biểu tượng, chữ đầy đủ ở aria-label (khung C2). */
export function NutXuat({ nhan, onClick, tat, title }: { nhan: string; onClick: () => void; tat?: boolean; title?: string }) {
  return (
    <button type="button" className="btn h-9 text-sm font-semibold max-sm:h-11 max-sm:w-11 max-sm:justify-center max-sm:px-0" onClick={onClick} disabled={tat} title={title ?? nhan} aria-label={nhan}>
      <svg aria-hidden width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M8 2.5v8M4.5 7.5L8 11l3.5-3.5M3 13.5h10" /></svg>
      <span className="max-sm:hidden">{nhan}</span>
    </button>
  );
}

/** Ba khe của hàng lọc chung (`PhanTich`): `dau` = ô đoạn đầu hàng thay chương trình (Kết quả Test: Mock Test | Thi thật), `giua` = ô riêng của tab
 *  sau Mọi lớp (Theo tuần ▾, Mọi kết quả ▾, Gọn | Đầy đủ, Tìm GV, chip GV ✕), `phai` = cuối hàng (Xuất Excel · In · ⋯). */
export type KheLoc = 'dau' | 'giua' | 'phai';
export const KheHangLoc = createContext<Record<KheLoc, HTMLElement | null> | null>(null);
/** Đưa ô của tab lên hàng lọc chung; ngoài Phân tích (không có khe) thì vẽ tại chỗ. */
export function VaoHangLoc({ o = 'giua', children }: { o?: KheLoc; children: ReactNode }) {
  const khe = useContext(KheHangLoc);
  if (!khe) return <>{children}</>;
  const el = khe[o];
  return el ? createPortal(children, el) : null;
}

/** Một thẻ chỉ số (`.chi-so`): tên 13 · "trong kỳ" mờ · số 28 / 700 (số trơn hoặc `SoO` bấm được) · chữ nhỏ cạnh số · dòng mẫu 12 mờ. */
export type ChiSo = { ten: ReactNode; ky?: ReactNode; gt: ReactNode; nho?: ReactNode; mau?: ReactNode; rong2?: boolean };
const COT_CHI_SO: Record<number, string> = { 1: 'lg:grid-cols-1', 2: 'lg:grid-cols-2', 3: 'lg:grid-cols-3', 4: 'lg:grid-cols-4', 5: 'lg:grid-cols-5', 6: 'lg:grid-cols-6' };
/** DẢI THẺ CHỈ SỐ đầu tab (V8-PT, G7: cùng hàm với dòng Tổng / bảng). 1440: một hàng đều cột; 375: hai cột, thẻ `rong2` trải hai cột. */
export function DaiChiSo({ ds }: { ds: ChiSo[] }) {
  return (
    <div className={`grid grid-cols-2 gap-2 sm:gap-3 ${COT_CHI_SO[ds.length] ?? 'lg:grid-cols-5'}`}>
      {ds.map((c, i) => (
        <div key={i} className={`flex min-w-0 flex-col gap-0.5 rounded-xl border px-3 pb-3 pt-2.5 sm:px-4 sm:pb-3.5 sm:pt-3 ${c.rong2 ? 'max-lg:col-span-2' : ''}`}
          style={{ background: 'var(--surface)', borderColor: 'var(--line)' }}>
          <span className="text-[13px] font-medium text-[color:var(--text-dim)] sm:whitespace-nowrap">
            {c.ten}{c.ky && <i className="font-normal not-italic text-[color:var(--text-faint)] max-sm:block"><span className="max-sm:hidden"> · </span>{c.ky}</i>}
          </span>
          <span className="flex flex-wrap items-baseline gap-x-2 text-[28px] font-bold leading-tight tabular-nums text-[color:var(--text)] [font-family:var(--phong-so,inherit)]">
            {c.gt}{c.nho && <small className="text-[13px] font-medium text-[color:var(--text-dim)]">{c.nho}</small>}
          </span>
          {c.mau && <span className="text-xs text-[color:var(--text-faint)]">{c.mau}</span>}
        </div>
      ))}
    </div>
  );
}

/** ĐẦU THẺ BẢNG (`.the-dau`): tên 15 / 700 · chip đếm · phụ 13 · (phải) điều khiển + ⓘ Cách tính — ⓘ ra khỏi đầu cột (G9). */
export function DauThe({ ten, dem, phu, phai, cachTinh }: { ten: ReactNode; dem?: ReactNode; phu?: ReactNode; phai?: ReactNode; cachTinh?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5 border-b px-4 py-3 max-sm:px-3" style={{ borderColor: 'var(--line)' }}>
      <h2 className="m-0 text-[15px] font-bold text-[color:var(--text)]">{ten}</h2>
      {dem != null && (
        <span className="inline-flex h-[22px] items-center whitespace-nowrap rounded border px-[7px] text-xs font-semibold tabular-nums text-[color:var(--text)]"
          style={{ borderColor: 'var(--line-strong)', background: 'var(--surface)' }}>{dem}</span>
      )}
      {phu && <span className="text-[13px] text-[color:var(--text-dim)]">{phu}</span>}
      {(phai || cachTinh) && (
        <span className="ml-auto flex items-center gap-2">
          {phai}
          {cachTinh && <NutLuat phai label={t('Cách tính')}>{cachTinh}</NutLuat>}
        </span>
      )}
    </div>
  );
}
