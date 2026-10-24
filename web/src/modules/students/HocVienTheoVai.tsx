import { t } from '@shared/i18n/index.ts';
import { chuPhuHuynh, type LienHe } from '@shared/domain/index.ts';

/*
 * UI-HV-LOP-TVV (L1): bảng V4 của TVV / CX đã gỡ — mọi vai dùng bảng V5 (`StudentsPage` › `TrangTheoLop`). Tệp giữ ô Phụ huynh dùng chung.
 */

/** Ô "Phụ huynh": tên (quan hệ) + SĐT; chỉ có SĐT em thì ghi "Em · …"; trống "chưa có" (không đỏ — liên hệ không bắt buộc). */
export function OPhuHuynh({ l }: { l: LienHe }) {
  const ten = chuPhuHuynh(l);
  if (!ten && !l.parentPhone) {
    return l.phone ? <span className="text-xs text-slate-400">{t('Em')} · <span className="tabular-nums text-slate-200">{l.phone}</span></span>
      : <span className="text-xs text-slate-500">{t('chưa có')}</span>;
  }
  return (
    <>
      {ten && <span className="block truncate text-slate-200" title={ten}>{ten}</span>}
      {l.parentPhone && <a href={`tel:${l.parentPhone.replace(/[^\d+]/g, '')}`} className="block text-xs tabular-nums text-slate-400 no-underline hover:text-slate-100">{l.parentPhone}</a>}
    </>
  );
}
