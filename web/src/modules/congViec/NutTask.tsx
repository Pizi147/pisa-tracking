import { useEffect, useRef, useState } from 'react';
import { api, invalidate } from '../../lib/api.ts';
import { useSession } from '../../lib/session.tsx';
import { MenuDong } from '../../ui/MenuDong.tsx';
import { HopNeo } from '../../ui/HopNeo.tsx';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import { QuickReport } from '../cases/QuickReport.tsx';
import { RecordViolationPanel } from '../yThuc/RecordViolationPanel.tsx';
import { HopTinhHinh } from '../yThuc/TinhHinh.tsx';
import { ToKhop } from '../../ui/ToKhop.tsx';
import { IconNhom } from './DanhSachViec.tsx';
import { t } from '@shared/i18n/index.ts';

export type EmTask = { id: number; ten: string; lopId: number; lop: string; tvv: string | null };
type Em = EmTask;
type Loai = 'case' | 'vi-pham' | 'tinh-hinh';
/** Chủ SP 14/11 (lời 17): tên nút "+ Task", thứ tự Case · Vi phạm / Nhắc nhở · Tình hình học tập. */
const MUC: [Loai, string][] = [['case', t('Case')], ['vi-pham', t('Vi phạm / Nhắc nhở')], ['tinh-hinh', t('Tình hình học tập')]];
/** GD-4a (mockup ⑤ F1, [XM-7]): menu giữ biểu tượng mục — cờ Case · khiên Ý thức · bóng lời Tình hình. */
const IC: Record<Loai, string> = { case: 'case-hoc-thuat', 'vi-pham': 'y-thuc', 'tinh-hinh': 'tinh-hinh' };
const TOI_DA_TINH_HINH = 8;

/**
 * "+ TASK" Ở TRANG ĐẦU GV (GD-1, mockup v21 ① K5; `04-thiet-ke.md` 5.4 + mục 12): menu 3 mục → hộp "Chọn em" (gõ tên, em lớp của tôi lên trước,
 * lớp bên cạnh tên; Tình hình học tập chọn nhiều ≤ 8) → ĐÚNG form đang có (QuickReport · RecordViolationPanel · hộp Báo tình hình) — cùng quyền, cùng luật.
 * Tìm em: `/tim/hoc-vien` (một câu mỗi lần gõ, ≥ 2 ký tự, chờ 250 ms). Nút cũ ở hồ sơ lớp / HV giữ nguyên.
 * `noi`: nút ở đầu trang (máy rộng) hoặc nút tròn nổi trên thanh tab dưới (< 640 px, K8a).
 * GD-4a (mockup ⑤ F): MỘT nút cho trang đầu, hồ sơ lớp, hồ sơ HV — `lopId`: mở từ hồ sơ lớp, nhóm "Lớp này" lên đầu; `em`: hồ sơ HV điền sẵn em → bỏ bước chọn.
 * < 640 px menu neo đáy (F4).
 */
export function NutTask({ noi, lopId, em: emSan }: { noi: 'dau' | 'noi'; lopId?: number; em?: EmTask }) {
  const neo = useRef<HTMLSpanElement>(null);
  const [loai, setLoai] = useState<Loai | null>(null);
  const [em, setEm] = useState<Em[] | null>(null);
  const { homNay } = useNgayNghiepVu();
  const dong = () => { setLoai(null); setEm(null); };
  const xong = () => { invalidate('/my-work'); dong(); };
  const mat = noi === 'dau'
    ? <span className="inline-flex h-8 items-center px-3 text-[13px] font-semibold">{t('+ Task')}</span>
    : <span className="grid h-[60px] w-[60px] place-items-center text-sm font-bold">{t('+ Task')}</span>;
  return (
    <>
      <span ref={neo} className={noi === 'noi' ? 'fixed bottom-[80px] right-4 z-[35] sm:hidden' : 'max-sm:hidden'}>
        <MenuDong nhan={t('Task: Case, vi phạm / nhắc nhở, tình hình học tập')} mat={mat} tieuDeDay={t('+ Task')}
          lopNut={noi === 'dau' ? 'btn btn-primary !p-0' : 'btn btn-primary !rounded-full !p-0 shadow-lg'}
          muc={MUC.map(([k, nhan]) => ({ key: k, nhan, bieuTuong: <IconNhom k={IC[k]} />, onChon: () => { setEm(emSan ? [emSan] : null); setLoai(k); } }))} />
      </span>
      {loai && !em && <HopChonEm neo={neo} loai={loai} lopId={lopId} onDong={dong} onChon={setEm} />}
      {loai === 'case' && em?.[0] && <QuickReport open onClose={dong} studentId={em[0].id} studentName={em[0].ten} lop={em[0].lop} onDone={xong} />}
      {loai === 'vi-pham' && em?.[0] && <RecordViolationPanel open onClose={dong} studentId={em[0].id} studentName={em[0].ten} lop={em[0].lop} onDone={xong} />}
      {loai === 'tinh-hinh' && em?.length && (
        <HopTinhHinh neo={neo} homNay={homNay} che={{ loai: 'bao', em: em.map((e) => ({ id: e.id, ten: e.ten, tvv: e.tvv })) }} onDong={dong} onXong={() => invalidate('/my-work')} />
      )}
    </>
  );
}

/**
 * GD-4a (mockup ⑤ F2, F3): kết quả nhóm theo lớp, có nhãn + số — "Lớp này" (mở từ hồ sơ lớp) → từng lớp của tôi ("· chủ nhiệm") → "Lớp khác"; tô chữ khớp.
 * ponytail: ô tìm riêng của "+ Task" — GD-5 thay bằng ô chọn có tìm chung (mẫu ⑤ A) khi nâng `ChonNguoi`.
 */
function HopChonEm({ neo, loai, lopId, onDong, onChon }: {
  neo: React.RefObject<HTMLElement | null>; loai: Loai; lopId?: number; onDong: () => void; onChon: (em: Em[]) => void;
}) {
  const { session } = useSession();
  const pc = session?.assignments ?? [];
  const lopToi = new Set(pc.map((a) => a.classId));
  const chuNhiem = new Set(pc.filter((a) => a.isCore).map((a) => a.classId));
  const nhieu = loai === 'tinh-hinh';
  const [chu, setChu] = useState('');
  const [kq, setKq] = useState<Em[]>([]);
  const [dang, setDang] = useState(0);
  const [chon, setChon] = useState<Em[]>([]);
  const [loi, setLoi] = useState<string | null>(null);
  const luot = useRef(0);
  const o = useRef<HTMLInputElement>(null);
  /* HopNeo focus phần tử bấm được đầu tiên (nút ✕) sau khi vẽ — đưa focus về ô gõ ở lượt kế (người dùng gõ tên ngay). */
  useEffect(() => { const h = setTimeout(() => o.current?.focus()); return () => clearTimeout(h); }, []);
  useEffect(() => {
    const q = chu.trim();
    if (q.length < 2) { setKq([]); return undefined; }
    const my = ++luot.current;
    const h = setTimeout(() => {
      api.get<Em[]>(`/tim/hoc-vien?q=${encodeURIComponent(q)}`)
        /* Em các lớp của tôi lên trước (mockup K5b), giữ thứ tự tên máy chủ trong mỗi phần. */
        .then((r) => { if (my === luot.current) { setLoi(null); setDang(0); setKq([...r.filter((e) => lopToi.has(e.lopId)), ...r.filter((e) => !lopToi.has(e.lopId))].slice(0, 8)); } })
        .catch((e: any) => { if (my === luot.current) { setKq([]); setLoi(e?.message ?? t('Không tìm được — thử lại.')); } });
    }, 250);
    return () => clearTimeout(h);
  }, [chu]);   // eslint-disable-line react-hooks/exhaustive-deps
  const conLai = kq.filter((e) => !chon.some((c) => c.id === e.id));
  /* Thứ tự nhóm: lớp này → lớp của tôi (theo mã) → lớp khác; `ds` phẳng theo đúng thứ tự vẽ để ↑ ↓ đi khớp. */
  const hang = (e: Em) => (e.lopId === lopId ? 0 : lopToi.has(e.lopId) ? 1 : 2);
  const ds = [...conLai].sort((a, b) => hang(a) - hang(b) || (hang(a) === 1 ? a.lop.localeCompare(b.lop) : 0));
  const tenNhom = (e: Em) => (hang(e) === 0 ? `${t('Lớp này')} · ${e.lop}` : hang(e) === 1 ? (chuNhiem.has(e.lopId) ? `${e.lop} · ${t('chủ nhiệm')}` : e.lop) : t('Lớp khác'));
  const nhom = new Map<string, number>();
  for (const e of ds) nhom.set(tenNhom(e), (nhom.get(tenNhom(e)) ?? 0) + 1);
  const lay = (e: Em) => {
    if (!nhieu) { onChon([e]); return; }
    if (chon.length < TOI_DA_TINH_HINH) setChon((c) => [...c, e]);
    setChu('');
  };
  const tieuDe = MUC.find(([k]) => k === loai)![1];
  return (
    <HopNeo neo={neo} nhan={tieuDe} rong={440} onNgoai={onDong}>
      <div className="flex items-start justify-between gap-3 border-b pb-2.5" style={{ borderColor: 'var(--line)' }}>
        <div className="grid gap-0.5"><b className="text-base font-bold text-slate-100">{tieuDe}</b><span className="text-[13px] text-dim">{t('Chọn em')}</span></div>
        <button type="button" className="btn btn-sm h-8 w-8 !px-0 max-sm:h-11 max-sm:w-11" aria-label={t('Đóng')} onClick={onDong}>✕</button>
      </div>
      {nhieu && chon.length > 0 && (
        <span className="flex flex-wrap items-center gap-1.5">
          {chon.map((e) => (
            <span key={e.id} className="inline-flex h-7 items-center gap-1 rounded-full border pl-2.5 pr-1 text-[13px] font-medium surface-2" style={{ borderColor: 'var(--line-strong)' }}>
              {e.ten}<button type="button" aria-label={t('Bỏ {ten}', { ten: e.ten })} className="h-6 w-6 appearance-none rounded-full border-0 bg-transparent text-slate-500 max-sm:h-11 max-sm:w-11"
                onClick={() => setChon((c) => c.filter((x) => x.id !== e.id))}>✕</button>
            </span>
          ))}
          <span className="text-xs tabular-nums text-faint">{chon.length} / {TOI_DA_TINH_HINH}</span>
        </span>
      )}
      <input ref={o} name="tim-em" autoComplete="off" spellCheck={false} className="field h-10 text-[15px] max-sm:h-11" role="combobox" aria-expanded={ds.length > 0} aria-controls="tim-em-task" aria-autocomplete="list"
        aria-label={t('Gõ tên em')} placeholder={t('Gõ tên em…')} value={chu} disabled={nhieu && chon.length >= TOI_DA_TINH_HINH}
        aria-activedescendant={ds[dang] ? `tim-em-${ds[dang].id}` : undefined}
        onChange={(e) => setChu(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); if (ds.length) setDang((i) => (i + (e.key === 'ArrowDown' ? 1 : ds.length - 1)) % ds.length); }
          else if (e.key === 'Enter' && ds[dang]) { e.preventDefault(); lay(ds[dang]); }
        }} />
      {ds.length > 0 && (
        <ul id="tim-em-task" role="listbox" aria-label={t('Học viên')} className="m-0 grid max-h-[288px] list-none overflow-y-auto p-0">
          {ds.map((e, i) => [
            (i === 0 || tenNhom(ds[i - 1]) !== tenNhom(e)) && (
              <li key={`n:${tenNhom(e)}`} role="presentation" className="sticky top-0 flex items-baseline gap-2 bg-[color:var(--surface)] px-2.5 pb-0.5 pt-2 text-xs font-semibold text-faint">
                {tenNhom(e)} <span className="font-medium tabular-nums">{nhom.get(tenNhom(e))}</span>
              </li>
            ),
            <li key={e.id} id={`tim-em-${e.id}`} role="option" aria-selected={i === dang}
              className={`grid min-h-11 cursor-pointer content-center rounded-md px-2.5 py-1 ${i === dang ? 'bg-[color:var(--accent-soft)]' : ''}`}
              onMouseEnter={() => setDang(i)} onMouseDown={(ev) => ev.preventDefault()} onClick={() => lay(e)}>
              {/* Mockup ⑤ `.oc-muc`: tên 14 / 500 (chữ khớp đậm màu nhấn), lớp dòng phụ 12 mờ. */}
              <span className="min-w-0 truncate text-sm font-medium leading-snug text-[color:var(--text)] [&_mark]:rounded-none [&_mark]:bg-transparent [&_mark]:p-0 [&_mark]:font-bold [&_mark]:text-[color:var(--accent)]"><ToKhop chu={e.ten} q={chu} /></span>
              <small className="text-xs text-faint">{e.lop}</small>
            </li>,
          ])}
        </ul>
      )}
      {chu.trim().length >= 2 && !ds.length && !loi && <p role="status" className="m-0 text-[13px] text-dim">{t('Không thấy em nào khớp.')}</p>}
      {loi && <p role="alert" className="m-0 text-[13px] text-late">⚠ {loi}</p>}
      {nhieu && (
        <div className="flex justify-end gap-2 border-t pt-2.5" style={{ borderColor: 'var(--line)' }}>
          {/* ⑤ F3 + rà đồng bộ 15/11 mục B: một chân "Đóng · Tiếp" cho hộp chọn em. */}
          <button type="button" className="btn max-sm:h-11 max-sm:flex-1" onClick={onDong}>{t('Đóng')}</button>
          <button type="button" className="btn btn-primary max-sm:h-11 max-sm:flex-1" disabled={!chon.length} onClick={() => onChon(chon)}>{t('Tiếp ›')}</button>
        </div>
      )}
    </HopNeo>
  );
}
