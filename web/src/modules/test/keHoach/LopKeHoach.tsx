import { useState } from 'react';
import { api, invalidate } from '../../../lib/api.ts';
import { useApi } from '../../../lib/useApi.ts';
import { ErrorState, Skeleton } from '../../../ui/ui.tsx';
import { Link } from 'react-router-dom';
import { MuiTenMo } from '../../../ui/HangNhom.tsx';
import { CHIP_TRON } from '../../../ui/Nhan.tsx';
import { useToast } from '../../../ui/Toast.tsx';
import { LuoiKeHoach } from './LuoiKeHoach.tsx';
import type { LopKH, LuoiFTData, LuoiThuongData, SoLoc } from './kieu.ts';
import { dich, t } from '@shared/i18n/index.ts';

/**
 * MỘT LỚP TRONG KẾ HOẠCH TEST — hàng lớp TÁCH TRƯỜNG (U05, mockup V11 `.hl-kh`, 10.2 #9): ▸ · mã (→ hồ sơ lớp) · n HV · GVCN · đợt đang chạy
 * ("MT3 đang làm bài" / lớp thường "đang tuần 8/8") · ô số "Chưa xếp lịch MT · n em" + "Vắng · n em" (BPXL-2, mockup v22; bấm = lọc lớp đó) hoặc
 * "Chỉ xem"; đang lọc theo một số thì chỉ còn ô số đó; rồi lưới HV × đợt khi mở
 * (tải khi mở). Lớp thường còn em chưa có bài → nút nhỏ `Xếp cả lớp theo đề xuất`.
 */
export function LopKeHoach({ lop, mo, onToggle, onHienDien, loc = null, hvChon = null, onLocLop }: {
  lop: LopKH; mo: boolean; onToggle: () => void; onHienDien: (open: boolean) => void;
  /** Số đang lọc (`?so=`): lưới chỉ còn em khớp ("chua-xep" thiếu MT · "vang" vắng tuần này). */
  loc?: SoLoc | null;
  /** Ô số "Chưa xếp lịch MT · n em" / "Vắng · n em" — bật lọc số đó cho lớp này. */
  onLocLop?: (so: 'chua-xep' | 'vang') => void;
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
      toast.push('ok', t('Đã tạo {n} bài', { n: r.created }));
      invalidate('/ke-hoach-test'); invalidate('/attempts'); invalidate('/cham');
    } catch (e: any) {
      toast.push('error', e.message ?? t('Không tạo được — thử lại.'));
    } finally {
      setBusy(false);
    }
  };
  const nutXep = lop.loai === 'thuong' && lop.hvChuaCoLich > 0 && !lop.chiXem ? (
    <button type="button" className="btn btn-sm min-h-[28px] font-normal" disabled={busy} onClick={(e) => { e.stopPropagation(); void xepCaLop(); }}
      title={t('{n} em chưa có Progress Test / Final Test', { n: lop.hvChuaCoLich })}>
      {busy ? t('Đang tạo…') : t('Xếp cả lớp theo đề xuất')}
    </button>
  ) : null;

  return (
    <section aria-label={t('lớp {ma}', { ma: lop.code })}>
      <div className={`hl-kh ${mo ? 'mo-lop' : ''}`} onClick={onToggle}>
        <MuiTenMo mo={mo} onMo={onToggle} nhan={t('lớp {ma}', { ma: lop.code })} />
        {lop.xemHoSo === false ? <span className="text-[15px] font-bold">{lop.code}</span>
          : <Link to={`/hoc-vien/lop/${lop.id}`} className="ten-ho-so text-[15px] font-bold" onClick={(e) => e.stopPropagation()}>{lop.code}</Link>}
        <span className="hl-kh-phu"><b className="tabular-nums">{lop.soHv}</b> {t('{n} HV', { n: lop.soHv }).replace(/^\d+\s*/, '')}</span>
        <span className="hl-kh-phu">{lop.gvcn ? <>{t('GVCN')} <b>{lop.gvcn}</b></> : lop.chiNhanh}</span>
        <span className="hl-kh-phu">{lop.dotChay ? dich(lop.dotChay) : lop.loai === 'thuong' ? dich(lop.tomTat) : ''}</span>
        <span className="flex min-w-0 flex-wrap items-center gap-2">
          {lop.chiXem ? <span className={`${CHIP_TRON} !border-[var(--line-strong)] bg-[var(--surface)] text-dim`}>{t('Chỉ xem')}</span>
            : lop.loai === 'ft' && lop.chuaCoLichTiep > 0 && (!loc || loc === 'chua-xep') ? (
              <button type="button" className="o-so" onClick={(e) => { e.stopPropagation(); onLocLop?.('chua-xep'); }}>{t('Chưa xếp lịch MT · {n} em', { n: lop.chuaCoLichTiep })}</button>
            ) : null}
          {lop.loai === 'ft' && lop.vangTuanNay > 0 && (!loc || loc === 'vang') && (
            /* BPXL-2 (N38): em vắng tuần này — chỉ thông tin (đã dời / đã huỷ); bấm = lọc em vắng của lớp. */
            <button type="button" className="o-so" onClick={(e) => { e.stopPropagation(); onLocLop?.('vang'); }}>{t('Vắng · {n} em', { n: lop.vangTuanNay })}</button>
          )}
          {nutXep}
        </span>
      </div>
      {mo && <NoiDungLop lop={lop} onHienDien={onHienDien} loc={loc} hvChon={hvChon} />}
    </section>
  );
}

function NoiDungLop({ lop, onHienDien, loc, hvChon }: { lop: LopKH; onHienDien: (open: boolean) => void; loc: SoLoc | null; hvChon: number | null }) {
  const ft = useApi<LuoiFTData>(lop.loai === 'ft' ? `/ke-hoach-test/ft/${lop.id}` : null);
  const th = useApi<LuoiThuongData>(lop.loai === 'thuong' ? `/ke-hoach-test/thuong/${lop.id}` : null);
  const s = lop.loai === 'ft' ? ft : th;
  if (s.error) return <div className="p-3"><ErrorState message={s.error.message} hint={s.error.hint} status={s.error.status} onRetry={s.reload} /></div>;
  if (s.loading || !s.data) return <div className="p-3"><Skeleton rows={4} /></div>;
  return <LuoiKeHoach loai={lop.loai} data={s.data} onReload={s.reload} onHienDien={onHienDien} loc={loc} hvChon={hvChon} />;
}
