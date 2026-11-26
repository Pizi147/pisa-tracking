import { useId, useRef, useState } from 'react';
import { api, invalidate } from '../../lib/api.ts';
import { useSession } from '../../lib/session.tsx';
import { useToast } from '../../ui/Toast.tsx';
import { ChonNguoi } from '../../ui/PeoplePicker.tsx';
import { ONgay } from '../../ui/ONgay.tsx';
import { LOP_MUC_HAN } from '../../ui/Nhan.tsx';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import { mucHan, ngay, type NguoiChon } from '@shared/domain/index.ts';
import { t } from '@shared/i18n/index.ts';
import type { KhoiGv } from './KhoiGiaoViec.tsx';

type ViecCon = NonNullable<KhoiGv['viecCon']>[number];
const XONG = (x: ViecCon) => x.tienDo === 'done' || x.tienDo === 'stopped';

/**
 * VIỆC CON (TUYEN-1, N72 ⑥ — mockup v27 `.vcon`, như việc Vận hành N59): một tầng, tên · người · hạn, tick = xong; không chặn việc cha, không vào số việc của việc cha.
 * Dữ liệu đi cùng khối giao việc (`GET /giao-viec/:loai/:id` → `viecCon`) — không request riêng. Tạo = `POST /mgmt-tasks` (`chaLoai`, `chaId`, BAOPH-0);
 * quyền tạo theo máy chủ (Head · Quản trị · CX — cờ `nav.vanHanh`). Tick: người được giao việc con hoặc người quản Vận hành (máy chủ kiểm lại).
 */
export function MucViecCon({ g, onDoi }: { g: KhoiGv; onDoi: () => void }) {
  const { session } = useSession();
  const { homNay } = useNgayNghiepVu();
  const hn = homNay ?? '';
  const toast = useToast();
  const [them, setThem] = useState(false);
  const [dang, setDang] = useState<number | null>(null);
  const ds = g.viecCon ?? [];
  const taoDuoc = !!session?.nav?.vanHanh && g.mo;
  if (!ds.length && !taoDuoc) return null;
  const toi = session?.user?.fullName;
  const tick = async (x: ViecCon) => {
    setDang(x.id);
    try { await api.post(`/mgmt-tasks/${x.id}/update`, { progress: x.tienDo === 'done' ? 'doing' : 'done' }); invalidate('/my-work'); onDoi(); }
    catch (e: any) { toast.push('error', e?.message ?? t('Không lưu được')); } finally { setDang(null); }
  };
  const soXong = ds.filter(XONG).length;
  return (
    <section className="grid gap-1" aria-label={t('Việc con')}>
      <h3 className="m-0 mb-0.5 text-[13px] font-semibold text-dim">{t('Việc con')}{ds.length > 0 && <span className="ml-1.5 tabular-nums">{soXong}/{ds.length}</span>}</h3>
      {ds.map((x) => {
        const xong = XONG(x);
        const laToi = !!toi && x.nguoi === toi;
        const muc = x.han && !xong && hn ? mucHan(x.han, hn) : 'xa';
        return (
          <div key={x.id} className="grid min-h-[40px] grid-cols-[18px_minmax(0,1fr)_max-content_max-content] items-center gap-x-3 rounded-lg border px-3 text-sm max-sm:min-h-[52px] max-sm:grid-cols-[18px_minmax(0,1fr)_max-content] max-sm:py-1.5"
            style={{ borderColor: 'var(--line)', background: 'var(--surface)' }}>
            <input type="checkbox" className="h-[18px] w-[18px] accent-[color:var(--accent)]" checked={x.tienDo === 'done'} disabled={dang === x.id || x.tienDo === 'stopped' || !(laToi || session?.nav?.vanHanh)}
              aria-label={t('Xong: {ten}', { ten: x.ten })} onChange={() => void tick(x)} />
            <span className={`min-w-0 ${xong ? 'text-faint line-through' : 'text-[color:var(--text)]'}`}>{x.ten}</span>
            <span className="whitespace-nowrap text-dim max-sm:col-start-2 max-sm:row-start-2 max-sm:text-[13px]">{laToi ? t('Bạn') : x.nguoi ?? t('chưa giao')}</span>
            <span className={`whitespace-nowrap text-[13px] tabular-nums ${xong ? 'text-dim' : LOP_MUC_HAN[muc]}`}>{x.han ? ngay(x.han) : t('không hạn')}</span>
          </div>
        );
      })}
      {taoDuoc && (them
        ? <ThemViecCon g={g} onHuy={() => setThem(false)} onXong={() => { setThem(false); invalidate('/my-work'); onDoi(); }} />
        : <button type="button" className="btn btn-sm mt-0.5 min-h-[44px] justify-self-start sm:min-h-[30px]" onClick={() => setThem(true)}>{t('+ Việc con')}</button>)}
    </section>
  );
}

/** Thêm một việc con tại chỗ: tên · người · hạn (tuỳ chọn) · Thêm / Huỷ. Một khoá mỗi lần mở — bấm lại sau lỗi mạng không tạo đôi. */
function ThemViecCon({ g, onHuy, onXong }: { g: KhoiGv; onHuy: () => void; onXong: () => void }) {
  const { session } = useSession();
  const toast = useToast();
  const [ten, setTen] = useState('');
  const [nguoi, setNguoi] = useState<NguoiChon | null>(null);
  const [han, setHan] = useState('');
  const [busy, setBusy] = useState(false);
  const [loi, setLoi] = useState<string | null>(null);
  const khoa = useRef(`vc-${g.loai}-${g.id}-${Date.now()}`);
  const id = useId();
  const gui = async () => {
    if (!ten.trim() || busy) return;
    setBusy(true); setLoi(null);
    try {
      const uid = nguoi?.kieu === 'toi' ? session?.user?.id ?? null : nguoi?.kieu === 'tai_khoan' ? nguoi.id : null;
      await api.post('/mgmt-tasks', { title: ten.trim(), chaLoai: g.loai, chaId: g.id, assigneeUserId: uid, due: han || null, idempotencyKey: khoa.current });
      toast.push('ok', t('Đã thêm việc con'));
      onXong();
    } catch (e: any) { setLoi(e?.message ?? t('Không lưu được')); } finally { setBusy(false); }
  };
  return (
    <div className="grid gap-2 rounded-lg border p-3" style={{ borderColor: 'var(--line-strong)', background: 'var(--surface-2)' }} role="group" aria-label={t('Thêm việc con')}
      onKeyDown={(e) => { if (e.key === 'Escape' && !busy) { e.preventDefault(); onHuy(); } }}>
      <label htmlFor={id} className="text-[13px] font-semibold">{t('Tên việc con')}</label>
      <input id={id} className="field w-full" autoFocus maxLength={200} autoComplete="off" value={ten} readOnly={busy} onChange={(e) => setTen(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); void gui(); } }} />
      <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_200px]">
        <ChonNguoi nhom="nhan_vien" value={nguoi} onChange={setNguoi} choNgoai={false} ariaLabel={t('Người làm')} placeholder={t('Người làm')} />
        <ONgay kieu="ngay" value={han} onChange={setHan} ariaLabel={t('Hạn')} />
      </div>
      {loi && <p role="alert" className="m-0 text-[13px] text-bad">⚠ {loi}</p>}
      <span className="flex gap-2">
        <button type="button" className="btn btn-sm btn-primary min-h-[44px] sm:min-h-[32px]" disabled={busy || !ten.trim()} onClick={() => void gui()}>{busy ? t('Đang lưu…') : t('Thêm việc con')}</button>
        <button type="button" className="btn btn-sm min-h-[44px] sm:min-h-[32px]" disabled={busy} onClick={onHuy}>{t('Huỷ')}</button>
      </span>
    </div>
  );
}
