import { useState } from 'react';
import { api, invalidate } from '../../../lib/api.ts';
import { useApi } from '../../../lib/useApi.ts';
import { ErrorState, Skeleton } from '../../../ui/ui.tsx';
import { HangNhom } from '../../../ui/HangNhom.tsx';
import { Nhan } from '../../../ui/Nhan.tsx';
import { useToast } from '../../../ui/Toast.tsx';
import { LuoiKeHoach } from './LuoiKeHoach.tsx';
import type { LopKH, LuoiFTData, LuoiThuongData } from './kieu.ts';
import { kyHieuLop } from '@shared/domain/index.ts';
import { t } from '@shared/i18n/index.ts';

/**
 * MỘT LỚP TRONG KẾ HOẠCH TEST: hàng lớn `HangNhom` (N-2 — `▾/▸ {mã}` · `{chi nhánh} · {n} HV` · bên phải tóm tắt: FT
 * `MT3 đang thi · MT4 chưa xếp 4 em`, lớp thường `đang W8/8`) rồi lưới HV × đợt khi mở. Lưới chỉ được tải khi mở lớp.
 * Lớp thường còn em chưa có bài → nút nhỏ `Xếp cả lớp theo đề xuất`.
 */
export function LopKeHoach({ lop, mo, onToggle, onHienDien, chiCanXepLai = false, hvChon = null }: {
  lop: LopKH; mo: boolean; onToggle: () => void; onHienDien: (open: boolean) => void; chiCanXepLai?: boolean;
  /** OV-15c (C18): em vừa chọn ở ô tìm (thuộc lớp này) — lưới cuộn tới hàng em. */
  hvChon?: number | null;
}) {
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const xepCaLop = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const r = await api.post<{ created: number }>(`/regular/classes/${lop.id}/plan`, {});
      toast.push('ok', `Đã tạo ${r.created} bài`);
      invalidate('/ke-hoach-test'); invalidate('/attempts'); invalidate('/cham');
    } catch (e: any) {
      toast.push('error', e.message ?? 'Không tạo được — thử lại.');
    } finally {
      setBusy(false);
    }
  };
  const nutXep = lop.loai === 'thuong' && lop.hvChuaCoLich > 0 && !lop.chiXem ? (
    <button type="button" className="btn btn-sm ml-2 min-h-[28px] align-middle font-normal" disabled={busy} onClick={() => void xepCaLop()}
      title={`${lop.hvChuaCoLich} em chưa có Progress Test / Final Test`}>
      {busy ? 'Đang tạo…' : 'Xếp cả lớp theo đề xuất'}
    </button>
  ) : null;

  return (
    <div className="overflow-hidden rounded-lg border" style={{ borderColor: 'var(--line)' }}>
      <table className="w-full">
        <tbody>
          <HangNhom mo={mo} onMo={onToggle} nhan={`lớp ${lop.code}`}
            tieuDe={(
              <span className="block min-w-0">
                <span className="flex flex-wrap items-baseline gap-x-2">
                  <span>{lop.code}</span>
                  {lop.chiXem && <Nhan tone="muted">{t('Chỉ xem')}</Nhan>}
                  <span className="text-xs font-normal text-slate-400">{[lop.chiNhanh, kyHieuLop(lop.chuongTrinh, null) ?? lop.chuongTrinh].filter(Boolean).join(' · ')}{(lop.chiNhanh || lop.chuongTrinh) && ' · '}{lop.soHv} HV</span>
                </span>
                <span className="block truncate text-xs font-normal text-slate-400 sm:hidden">{lop.tomTat}{nutXep}</span>
              </span>
            )}>
            {/* `.hang-lon > td` đặt chữ đậm 12.5px với độ ưu tiên cao hơn tiện ích Tailwind — chữ phụ phải đặt thẳng vào style. */}
            <td className="hidden pr-3 text-right text-slate-300 sm:table-cell" style={{ fontWeight: 400, fontSize: 12 }}>{lop.tomTat}{nutXep}</td>
          </HangNhom>
        </tbody>
      </table>
      {mo && <NoiDungLop lop={lop} onHienDien={onHienDien} chiCanXepLai={chiCanXepLai} hvChon={hvChon} />}
    </div>
  );
}

function NoiDungLop({ lop, onHienDien, chiCanXepLai, hvChon }: { lop: LopKH; onHienDien: (open: boolean) => void; chiCanXepLai: boolean; hvChon: number | null }) {
  const ft = useApi<LuoiFTData>(lop.loai === 'ft' ? `/ke-hoach-test/ft/${lop.id}` : null);
  const th = useApi<LuoiThuongData>(lop.loai === 'thuong' ? `/ke-hoach-test/thuong/${lop.id}` : null);
  const s = lop.loai === 'ft' ? ft : th;
  if (s.error) return <div className="p-3"><ErrorState message={s.error.message} hint={s.error.hint} onRetry={s.reload} /></div>;
  if (s.loading || !s.data) return <div className="p-3"><Skeleton rows={4} /></div>;
  return <LuoiKeHoach loai={lop.loai} data={s.data} onReload={s.reload} onHienDien={onHienDien} chiCanXepLai={chiCanXepLai} hvChon={hvChon} />;
}
