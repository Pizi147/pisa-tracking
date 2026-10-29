import { forwardRef } from 'react';
import { ChonNguoi, type NguoiTrongDs } from '../../../ui/PeoplePicker.tsx';
import { NoiNeo } from '../../classes/HopLuuPhanCong.tsx';
import { t } from '@shared/i18n/index.ts';

export type TrangThaiO = 'binh-thuong' | 'trong' | 'nghi' | 'doi' | 'loi' | 'cho-doi' | 'khac-doi';

/**
 * Ô GV của góc Phân công GV (mockup v9 `.o-gv`): nút dáng ô nhập nhẹ (viền khi rê / focus, ▾ luôn hiện). Trạng thái có CHỮ, không chỉ màu:
 * "– Chưa có" · "⚠ đã nghỉ" · "trước: …" (nháp) · "→ B" (chờ đổi) · "↻ người khác vừa đổi". Lỗi luật dưới ô (`aria-describedby`).
 * Chỉ xem (CX): chữ thường, không nút.
 */
export const OGv = forwardRef<HTMLButtonElement, {
  nhanO: string; ten: string | null; trangThai: TrangThaiO; to: boolean; phu?: string; loi?: string; idLoi?: string;
  chiXem: boolean; mo: boolean; dataO?: string; onMo: () => void;
}>(function OGv({ nhanO, ten, trangThai, to, phu, loi, idLoi, chiXem, mo, dataO, onMo }, ref) {
  if (chiXem) {
    return (
      <div className="pc-o-xem" data-to={to || undefined}>
        {ten ? <span className={to ? 'font-bold' : ''}>{ten}</span> : <span className="trong">– {t('Chưa có')}</span>}
        {phu && <span className="p">{phu}</span>}
      </div>
    );
  }
  const nhanDoc = [`${nhanO}: ${ten ?? t('Chưa có')}`, phu, to ? t('đang tô') : ''].filter(Boolean).join(', ');
  return (
    <>
      <button ref={ref} type="button" className={`pc-o-gv ${trangThai} ${to ? 'to' : ''}`} data-o={dataO} data-to={to || undefined}
        aria-haspopup="listbox" aria-expanded={mo} aria-label={nhanDoc} title={ten ?? undefined}
        aria-invalid={trangThai === 'loi' || undefined} aria-describedby={loi ? idLoi : undefined} onClick={onMo}>
        <span className="t">
          <span className="truncate">{ten ?? t('Chưa có')}</span>
          {phu && <span className="p truncate">{phu}</span>}
        </span>
      </button>
      {loi && <span className="pc-loi-o" id={idLoi}>{loi}</span>}
    </>
  );
});

/** Danh sách chọn GV của một ô = `ChonNguoi` sẵn có (gõ tên + danh sách nhóm), dòng cuối "Bỏ trống (Chưa có)"; hộp nổi neo dưới ô. */
export function ChonGvPc({ neo, nhanO, ds, tamDuoi, onChon, onDong }: {
  neo: HTMLElement | null; nhanO: string; ds: NguoiTrongDs[]; tamDuoi?: boolean; onChon: (v: number | '') => void; onDong: () => void;
}) {
  const chon = (v: number | '') => { onChon(v); onDong(); neo?.focus(); };
  return (
    <NoiNeo neo={neo} rong={340} tamDuoi={tamDuoi} nhan={t('{o}: chọn GV', { o: nhanO })} giuFocus={false} onDong={onDong} className="pc-chon">
      <ChonNguoi nhom="giao_vien" choToi={false} choNgoai={false} tuMo value={null} ds={ds} ariaLabel={t('{o}: chọn GV', { o: nhanO })}
        placeholder={t('Gõ tên GV…')} khongKhop={(go) => t('Không có GV khớp «{chu}»', { chu: go })}
        them={{ nhan: t('Bỏ trống (Chưa có)'), onChon: () => chon('') }}
        onChange={(v) => { if (v?.kieu === 'tai_khoan') chon(v.id); }} />
    </NoiNeo>
  );
}
