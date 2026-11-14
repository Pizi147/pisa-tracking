import { useEffect, useRef, useState } from 'react';
import { api, invalidate } from '../../lib/api.ts';
import { useSession } from '../../lib/session.tsx';
import { MenuDong } from '../../ui/MenuDong.tsx';
import { HopNeo } from '../../ui/HopNeo.tsx';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import { QuickReport } from '../cases/QuickReport.tsx';
import { RecordViolationPanel } from '../yThuc/RecordViolationPanel.tsx';
import { HopTinhHinh } from '../yThuc/TinhHinh.tsx';
import { t } from '@shared/i18n/index.ts';

type Em = { id: number; ten: string; lopId: number; lop: string; tvv: string | null };
type Loai = 'case' | 'vi-pham' | 'tinh-hinh';
/** Chủ SP 14/11 (lời 17): tên nút "+ Task", thứ tự Case · Vi phạm / Nhắc nhở · Tình hình học tập. */
const MUC: [Loai, string][] = [['case', t('Case')], ['vi-pham', t('Vi phạm / Nhắc nhở')], ['tinh-hinh', t('Tình hình học tập')]];
const TOI_DA_TINH_HINH = 8;

/**
 * "+ TASK" Ở TRANG ĐẦU GV (GD-1, mockup v21 ① K5; `04-thiet-ke.md` 5.4 + mục 12): menu 3 mục → hộp "Chọn em" (gõ tên, em lớp của tôi lên trước,
 * lớp bên cạnh tên; Tình hình học tập chọn nhiều ≤ 8) → ĐÚNG form đang có (QuickReport · RecordViolationPanel · hộp Báo tình hình) — cùng quyền, cùng luật.
 * Tìm em: `/tim/hoc-vien` (một câu mỗi lần gõ, ≥ 2 ký tự, chờ 250 ms). Nút cũ ở hồ sơ lớp / HV giữ nguyên.
 * `noi`: nút ở đầu trang (máy rộng) hoặc nút tròn nổi trên thanh tab dưới (< 640 px, K8a).
 */
export function NutTask({ noi }: { noi: 'dau' | 'noi' }) {
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
        <MenuDong nhan={t('Task: Case, vi phạm / nhắc nhở, tình hình học tập')} mat={mat}
          lopNut={noi === 'dau' ? 'btn btn-primary !p-0' : 'btn btn-primary !rounded-full !p-0 shadow-lg'}
          muc={MUC.map(([k, nhan]) => ({ key: k, nhan, onChon: () => { setEm(null); setLoai(k); } }))} />
      </span>
      {loai && !em && <HopChonEm neo={neo} loai={loai} onDong={dong} onChon={setEm} />}
      {loai === 'case' && em?.[0] && <QuickReport open onClose={dong} studentId={em[0].id} studentName={em[0].ten} lop={em[0].lop} onDone={xong} />}
      {loai === 'vi-pham' && em?.[0] && <RecordViolationPanel open onClose={dong} studentId={em[0].id} studentName={em[0].ten} lop={em[0].lop} onDone={xong} />}
      {loai === 'tinh-hinh' && em?.length && (
        <HopTinhHinh neo={neo} homNay={homNay} che={{ loai: 'bao', em: em.map((e) => ({ id: e.id, ten: e.ten, tvv: e.tvv })) }} onDong={dong} onXong={() => invalidate('/my-work')} />
      )}
    </>
  );
}

function HopChonEm({ neo, loai, onDong, onChon }: {
  neo: React.RefObject<HTMLElement | null>; loai: Loai; onDong: () => void; onChon: (em: Em[]) => void;
}) {
  const { session } = useSession();
  const lopToi = new Set((session?.assignments ?? []).map((a) => a.classId));
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
      api.get<Em[]>(`/tim/hoc-vien?q=${encodeURIComponent(q)}&lop=toi`)
        /* Em các lớp của tôi lên trước (mockup K5b), giữ thứ tự tên máy chủ trong mỗi phần. */
        .then((r) => { if (my === luot.current) { setLoi(null); setDang(0); setKq([...r.filter((e) => lopToi.has(e.lopId)), ...r.filter((e) => !lopToi.has(e.lopId))].slice(0, 8)); } })
        .catch((e: any) => { if (my === luot.current) { setKq([]); setLoi(e?.message ?? t('Không tìm được — thử lại.')); } });
    }, 250);
    return () => clearTimeout(h);
  }, [chu]);   // eslint-disable-line react-hooks/exhaustive-deps
  const ds = kq.filter((e) => !chon.some((c) => c.id === e.id));
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
          {ds.map((e, i) => (
            <li key={e.id} id={`tim-em-${e.id}`} role="option" aria-selected={i === dang}
              className={`flex min-h-[40px] cursor-pointer items-center justify-between gap-3 rounded-md px-2.5 text-[15px] max-sm:min-h-[44px] ${i === dang ? 'bg-[color:var(--accent-soft)]' : ''}`}
              onMouseEnter={() => setDang(i)} onMouseDown={(ev) => ev.preventDefault()} onClick={() => lay(e)}>
              <span className="min-w-0 text-[color:var(--text)]">{e.ten}</span><small className="shrink-0 text-xs text-faint">{e.lop}</small>
            </li>
          ))}
        </ul>
      )}
      {chu.trim().length >= 2 && !ds.length && !loi && <p role="status" className="m-0 text-[13px] text-dim">{t('Không thấy em nào khớp.')}</p>}
      {loi && <p role="alert" className="m-0 text-[13px] text-late">⚠ {loi}</p>}
      {nhieu && (
        <div className="flex justify-end border-t pt-2.5" style={{ borderColor: 'var(--line)' }}>
          <button type="button" className="btn btn-primary max-sm:h-11 max-sm:flex-1" disabled={!chon.length} onClick={() => onChon(chon)}>{t('Tiếp ›')}</button>
        </div>
      )}
    </HopNeo>
  );
}
