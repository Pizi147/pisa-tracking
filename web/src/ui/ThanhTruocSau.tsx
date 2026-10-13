import { useEffect, useState, type ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { docNguCanhDs, keBen, type NguCanhDs, type TenTrang } from '@shared/domain/index.ts';
import { useChongVe, useTenTrang, useVe } from '../lib/quayLai.ts';
import { Menu } from './Menu.tsx';

const khoaLuu = (loai: NguCanhDs['loai']) => `pisa.ds.${loai}`;
const luu = (ds: NguCanhDs) => { try { sessionStorage.setItem(khoaLuu(ds.loai), JSON.stringify(ds)); } catch { /* chế độ riêng tư: tải lại thì mất danh sách, dùng danh sách dự phòng */ } };
const doc = (loai: NguCanhDs['loai'], id: number): NguCanhDs | null => {
  try { return docNguCanhDs(JSON.parse(sessionStorage.getItem(khoaLuu(loai)) ?? 'null'), loai, id); } catch { return null; }
};

type Cha = TenTrang & { url: string };

/**
 * NÚT "‹ {tên nguồn}" ĐẦU MỌI HỒ SƠ (PR-OV5b, mockup M1 §6): về đúng URL + vị trí cuộn của nơi bắt đầu (`web/src/lib/quayLai.ts`);
 * đã đi qua nhiều hồ sơ thì menu "Các bước" về từng bước. Chưa có nguồn (mở link thẳng / tải lại) → `cha`.
 * `ten` / `chiTiet`: tên của CHÍNH hồ sơ này — hiện ở nút / menu của hồ sơ kế tiếp nếu đi tiếp từ đây.
 */
export function DuongVe({ cha, ten, chiTiet, children }: { cha: Cha; ten?: string | null; chiTiet?: string | null; children?: ReactNode }) {
  useTenTrang(ten, chiTiet);
  const chong = useChongVe();
  const ve = useVe();
  const dich = chong[0] ?? cha;
  return (
    <div className="mb-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px]">
      <button type="button" className="btn btn-sm min-h-[44px] max-w-full sm:min-h-[32px]" onClick={() => ve(dich.url, !chong.length)}
        title={`Về ${dich.ten}${dich.chiTiet ? ` · ${dich.chiTiet}` : ''}`}>
        <span aria-hidden>‹</span><span className="min-w-0 truncate">{dich.ten}</span>
      </button>
      {dich.chiTiet && <span className="min-w-0 truncate text-slate-500">{dich.chiTiet}</span>}
      {chong.length > 1 && (
        <Menu label={`Các bước (${chong.length})`} align="left" className="btn btn-sm btn-ghost min-h-[44px] sm:min-h-[32px]"
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
export function ThanhTruocSau({ loai, id, duong, dsDuPhong, cha, ten, chiTiet }: {
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

  const nut = 'btn btn-sm btn-ghost min-h-[44px] sm:min-h-0 disabled:opacity-40';
  return (
    <DuongVe cha={cha} ten={ten} chiTiet={chiTiet}>
      {ben && ds && (
        <span className="ml-auto flex items-center gap-1 text-xs text-slate-400" role="group" aria-label={`Chuyển trong danh sách ${ds.nhan}`}>
          <button type="button" className={nut} disabled={ben.truoc === null} onClick={() => sang(ben.truoc)} aria-label="Trước" title="Trước ( [ )">
            ‹<span className="max-sm:sr-only"> Trước</span>
          </button>
          <span className="tabular-nums" title={ds.nhan}><b className="font-semibold text-slate-200">{ben.viTri}/{ben.tong}</b><span className="max-sm:sr-only"> · {ds.nhan}</span></span>
          <button type="button" className={nut} disabled={ben.sau === null} onClick={() => sang(ben.sau)} aria-label="Sau" title="Sau ( ] )">
            <span className="max-sm:sr-only">Sau </span>›
          </button>
        </span>
      )}
    </DuongVe>
  );
}
