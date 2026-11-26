import { useRef, useState } from 'react';
import { ApiError, api, invalidate } from '../../lib/api.ts';
import { useSession } from '../../lib/session.tsx';
import { useToast } from '../../ui/Toast.tsx';
import { HopNeo } from '../../ui/HopNeo.tsx';
import { ChonNguoi } from '../../ui/PeoplePicker.tsx';
import { t } from '@shared/i18n/index.ts';

export type NguoiXepLich = { userId: number; ten: string } | null;
type KqDoi = { xepLich: NguoiXepLich; hoanTac: number | null; soViec?: number };

/**
 * VAI-1 (N77, mockup v29 K1 / V2): CỤM "XẾP LỊCH" — CVXL đã nhận lớp. BPXL: "Xếp lịch Bạn · Bỏ nhận" / "Xếp lịch {tên} · Nhận lại" / "Chưa ai nhận · Nhận lớp" —
 * một nút, bấm là lưu (`POST /classes/:id/xep-lich`, `cu` = người đang thấy → 409 khi vừa có người khác nhận), toast Hoàn tác. `ganHo` (Head / GĐCN / Quản trị /
 * lead BPXL — máy chủ `ganHoDuoc`): ô tên bấm mở hộp chọn BPXL (`ungVien`). Người khác: chữ trơn.
 */
export function XepLichLop({ classId, code, xepLich, onDoi, ganHo, ungVien, dong }: {
  classId: number; code: string; xepLich: NguoiXepLich; onDoi: (x: NguoiXepLich) => void;
  ganHo?: boolean; ungVien?: { id: number; ten: string; chiNhanh: string }[];
  /** Hàng lớp Kế hoạch Test: cụm thẳng cột (nhãn căn phải · nút rộng cố định). */
  dong?: boolean;
}) {
  const { session } = useSession();
  const toast = useToast();
  const toi = session?.user?.id;
  const laBpxl = !!session?.roles?.includes('scheduler');
  const [busy, setBusy] = useState(false);
  const [mo, setMo] = useState(false);
  const neo = useRef<HTMLButtonElement>(null);

  const doi = async (userId: number | null, tenMoi: string) => {
    if (busy) return;
    setBusy(true); setMo(false);
    try {
      const r = await api.post<KqDoi>(`/classes/${classId}/xep-lich`, { userId, cu: xepLich?.userId ?? null });
      onDoi(r.xepLich);
      invalidate('/ke-hoach-test'); invalidate('/my-work');
      const chu = (userId === null ? t('Đã bỏ nhận {lop}', { lop: code }) : userId === toi ? t('Đã nhận {lop}', { lop: code }) : t('{ten} xếp lịch {lop}', { ten: tenMoi, lop: code }))
        + (r.soViec ? ` · ${t('{n} việc Xếp lịch họp chuyển theo', { n: r.soViec })}` : '');
      const key = `xep-lich-lop-${classId}`;
      if (r.hoanTac === null) { toast.push('ok', chu, { key }); return; }
      toast.hoanTac(chu, async () => {
        try {
          const h = await api.post<{ xepLich: NguoiXepLich }>(`/classes/${classId}/xep-lich/hoan-tac`);
          onDoi(h.xepLich); invalidate('/ke-hoach-test'); invalidate('/my-work');
          toast.push('ok', t('Đã hoàn tác'), { key });
        } catch (e: any) { toast.push('error', e?.message ?? t('Chưa hoàn tác được — thử lại.'), { key }); }
      }, { key });
    } catch (e: any) {
      if (e instanceof ApiError && e.status === 409) {
        toast.push('error', t('Lớp vừa có người khác nhận.'), { hanhDong: { nhan: t('Tải lại'), onBam: () => invalidate('/ke-hoach-test') } });
        invalidate(`/classes/${classId}/xep-lich`);
      } else toast.push('error', e?.message ?? t('Không lưu được — thử lại.'));
    } finally { setBusy(false); }
  };

  const cuaToi = !!xepLich && xepLich.userId === toi;
  const nhan = (
    <span className="whitespace-nowrap">
      {t('Xếp lịch')} {xepLich ? <b className="font-bold text-slate-100">{cuaToi ? t('Bạn') : xepLich.ten}</b> : null}
    </span>
  );
  /* Head / GĐCN / Quản trị / lead BPXL: ô tên mở hộp chọn BPXL (lưu ngay khi chọn). */
  if (ganHo) {
    const ds = (ungVien ?? []).map((u) => ({ id: u.id, ten: u.ten, phu: `BPXL${u.chiNhanh ? ` · ${u.chiNhanh}` : ''}${u.id === xepLich?.userId ? ` · ${t('đang nhận')}` : ''}` }));
    return (
      <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-[13px] text-dim">
        {t('Xếp lịch')}
        <button ref={neo} type="button" className="inline-flex min-h-7 items-center gap-1 rounded-md border-0 bg-transparent px-1 font-bold text-slate-100 hover:text-[color:var(--accent)] max-sm:min-h-[44px]"
          aria-haspopup="dialog" aria-expanded={mo} disabled={busy} aria-label={t('Đổi người xếp lịch: {ten}', { ten: xepLich?.ten ?? t('chưa ai nhận') })}
          onClick={() => setMo((v) => !v)}>
          {xepLich ? xepLich.ten : <span className="font-medium text-faint">{t('Chưa ai nhận')}</span>}
          <span aria-hidden className="text-dim">▾</span>
        </button>
        {mo && (
          <HopNeo neo={neo} nhan={t('Người xếp lịch {lop}', { lop: code })} rong={320} onNgoai={() => setMo(false)} lop="grid gap-2 p-3">
            <ChonNguoi value={null} onChange={(v) => { if (v?.kieu === 'tai_khoan' && v.id !== xepLich?.userId) void doi(v.id, v.ten); }} nhom="nhan_vien"
              ds={ds} tinh tuMo choToi={false} choNgoai={false} placeholder={t('Tìm người xếp lịch')} ariaLabel={t('Người xếp lịch')} tieuDe={t('Người xếp lịch')} />
            {xepLich && <button type="button" className="btn btn-sm min-h-[44px] justify-self-start sm:min-h-[32px]" disabled={busy}
              onClick={() => void doi(null, '')}>{t('Bỏ người xếp lịch')}</button>}
          </HopNeo>
        )}
      </span>
    );
  }
  if (!laBpxl) return xepLich && !dong ? <span className="text-[13px] text-dim">{nhan}</span> : null;
  return (
    <span className={`${dong ? 'xl-dong' : 'inline-flex items-center gap-2.5'} text-[13px] text-dim`} onClick={(e) => e.stopPropagation()}>
      {xepLich ? <span className="xl-ai">{nhan}</span> : <span className="xl-ai whitespace-nowrap">{!dong && `${t('Xếp lịch')} `}<span className="text-faint">{t('Chưa ai nhận')}</span></span>}
      <button type="button" className={`btn btn-sm min-w-[92px] justify-center max-sm:min-h-[44px] ${xepLich ? '' : 'btn-primary'}`} disabled={busy}
        onClick={() => void doi(cuaToi ? null : toi ?? null, session?.user?.fullName ?? '')}>
        {busy ? t('Đang lưu…') : cuaToi ? t('Bỏ nhận') : xepLich ? t('Nhận lại') : t('Nhận lớp')}
      </button>
    </span>
  );
}
