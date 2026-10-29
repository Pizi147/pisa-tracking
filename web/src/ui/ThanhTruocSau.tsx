import { useEffect, useState, type ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { docNguCanhDs, keBen, type NguCanhDs, type TenTrang } from '@shared/domain/index.ts';
import { useChongVe, useTenTrang, useVe } from '../lib/quayLai.ts';
import { Menu } from './Menu.tsx';
import { t } from '@shared/i18n/index.ts';

const khoaLuu = (loai: NguCanhDs['loai']) => `pisa.ds.${loai}`;
const luu = (ds: NguCanhDs) => { try { sessionStorage.setItem(khoaLuu(ds.loai), JSON.stringify(ds)); } catch { /* chế độ riêng tư: tải lại thì mất danh sách, dùng danh sách dự phòng */ } };
const doc = (loai: NguCanhDs['loai'], id: number): NguCanhDs | null => {
  try { return docNguCanhDs(JSON.parse(sessionStorage.getItem(khoaLuu(loai)) ?? 'null'), loai, id); } catch { return null; }
};

type Cha = TenTrang & { url: string };
/* V8-HSL: dáng gọn (chữ, không khung) — vùng chạm 44 px ở điện thoại bằng `after`. */
const GON_VE = "relative inline-flex max-w-full items-center gap-1 border-0 bg-transparent p-0 text-[13px] font-medium text-slate-400 hover:text-slate-100 after:absolute after:inset-x-0 after:-inset-y-2.5 after:content-[''] sm:after:hidden";
const GON_NUT = "relative inline-grid h-6 w-7 place-items-center rounded-md border-0 bg-transparent text-slate-400 hover:bg-[color:var(--nut-hover)] hover:text-slate-100 after:absolute after:-inset-2 after:content-[''] sm:after:hidden";

/**
 * NÚT "‹ {tên nguồn}" ĐẦU MỌI HỒ SƠ (PR-OV5b, mockup M1 §6): về đúng URL + vị trí cuộn của nơi bắt đầu (`web/src/lib/quayLai.ts`);
 * đã đi qua nhiều hồ sơ thì menu "Các bước" về từng bước. Chưa có nguồn (mở link thẳng / tải lại) → `cha`.
 * `ten` / `chiTiet`: tên của CHÍNH hồ sơ này — hiện ở nút / menu của hồ sơ kế tiếp nếu đi tiếp từ đây.
 */
export function DuongVe({ cha, ten, chiTiet, tieuDe, children, gon }: {
  cha: Cha; ten?: string | null; chiTiet?: string | null;
  /** V8-HSL (mockup v8 hồ sơ lớp hàng ①): "‹ nguồn" chữ 13 px nhạt, không khung nút — hàng cao 24 px; điện thoại vẫn chạm 44 px (`after`). */
  gon?: boolean;
  /** OV-11i: tiêu đề tab (mặc định `ten`). */
  tieuDe?: string | null; children?: ReactNode;
}) {
  useTenTrang(ten, chiTiet, tieuDe);
  const chong = useChongVe();
  const ve = useVe();
  const dich = chong[0] ?? cha;
  return (
    <div className={`flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] ${gon ? 'min-h-6' : 'mb-1.5'}`}>
      <button type="button" className={gon ? GON_VE : 'btn btn-sm min-h-[44px] max-w-full sm:min-h-[32px]'} onClick={() => ve(dich.url, !chong.length)}
        title={t('Về {vai}', { vai: dich.ten }) + (dich.chiTiet ? ` · ${dich.chiTiet}` : '')}>
        <span aria-hidden>‹</span><span className="min-w-0 truncate">{dich.ten}</span>
      </button>
      {dich.chiTiet && !gon && <span className="min-w-0 truncate text-slate-500">{dich.chiTiet}</span>}
      {chong.length > 1 && (
        <Menu label={t('Các bước ({n})', { n: chong.length })} align="left" className="btn btn-sm btn-ghost min-h-[44px] sm:min-h-[32px]"
          items={chong.map((b) => ({ label: `‹ ${b.ten}`, hint: b.chiTiet, onClick: () => ve(b.url) }))} />
      )}
      {children}
    </div>
  );
}

/**
 * "‹ {tên nguồn} · ‹ Trước · 3/11 Học viên & Lớp · Sau ›" cho hồ sơ học viên và hồ sơ lớp (chủ sản phẩm 03/10, Q-0310-4).
 * Danh sách: (1) `location.state.ds` — danh sách vừa mở, đúng bộ lọc + thứ tự đang dùng; (2) `sessionStorage` (tải lại trang);
 * (3) `dsDuPhong` (mở thẳng bằng link: lớp của em, A→Z). Chuyển hồ sơ dùng `replace` để "Quay lại" vẫn về danh sách, không qua từng hồ sơ.
 */
export function ThanhTruocSau({ loai, id, duong, dsDuPhong, cha, ten, chiTiet, gon }: {
  gon?: boolean;
  loai: NguCanhDs['loai']; id: number; duong: (id: number) => string;
  dsDuPhong?: () => Promise<{ ids: number[]; nhan: string }>;
  cha: Cha; ten?: string | null; chiTiet?: string | null;
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const tuState = docNguCanhDs((location.state as { ds?: unknown } | null)?.ds, loai, id);
  const [ds, setDs] = useState<NguCanhDs | null>(() => tuState ?? doc(loai, id));
  useEffect(() => {
    const co = tuState ?? doc(loai, id);
    if (co) { setDs(co); luu(co); return undefined; }
    if (!dsDuPhong) { setDs(null); return undefined; }
    let huy = false;
    dsDuPhong().then((r) => { if (!huy && r.ids.includes(id)) setDs({ loai, ids: r.ids, nhan: r.nhan }); }).catch(() => { if (!huy) setDs(null); });
    return () => { huy = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loai, id]);

  const ben = ds ? keBen(ds.ids, id) : null;
  const sang = (to: number | null) => { if (to !== null && ds) navigate(duong(to), { state: { ds }, replace: true }); };
  /* `[` / `]` — phím tắt, không bắt khi đang gõ chữ. */
  useEffect(() => {
    if (!ben) return undefined;
    const phim = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (e.ctrlKey || e.metaKey || e.altKey || t?.closest('input,textarea,select,[contenteditable="true"]')) return;
      if (e.key === '[') sang(ben.truoc); else if (e.key === ']') sang(ben.sau);
    };
    document.addEventListener('keydown', phim);
    return () => document.removeEventListener('keydown', phim);
  }); // eslint-disable-line react-hooks/exhaustive-deps

  const nut = gon ? `${GON_NUT} disabled:opacity-40` : 'btn btn-sm btn-ghost min-h-[44px] sm:min-h-0 disabled:opacity-40';
  return (
    /* OV-11i (P1-3): tab hồ sơ HV ghi tên em, hồ sơ lớp ghi mã lớp — bỏ chữ "Hồ sơ (lớp)" của tên nút Quay lại. */
    <DuongVe cha={cha} ten={ten} chiTiet={chiTiet} tieuDe={ten?.replace(loai === 'lop' ? /^Hồ sơ lớp / : /^Hồ sơ /, '')} gon={gon}>
      {ben && ds && (
        <span className="ml-auto flex items-center gap-1 text-xs text-slate-400" role="group" aria-label={t('Chuyển trong danh sách {ds}', { ds: ds.nhan })}>
          <button type="button" className={nut} disabled={ben.truoc === null} onClick={() => sang(ben.truoc)} aria-label={t('Trước')} title={t('Trước ( [ )')}>
            ‹{!gon && <span className="max-sm:sr-only"> {t('Trước')}</span>}
          </button>
          <span className={`tabular-nums ${gon ? 'text-[13px]' : ''}`} title={ds.nhan}><b className={`font-semibold ${gon ? 'text-slate-100' : 'text-slate-200'}`}>{ben.viTri}/{ben.tong}</b><span className={gon ? '' : 'max-sm:sr-only'}> · {ds.nhan}</span></span>
          <button type="button" className={nut} disabled={ben.sau === null} onClick={() => sang(ben.sau)} aria-label="Sau" title="Sau ( ] )">
            {!gon && <span className="max-sm:sr-only">{t('Sau')} </span>}›
          </button>
        </span>
      )}
    </DuongVe>
  );
}
