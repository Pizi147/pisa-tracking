/**
 * OV-11a (rà soát 14/10, TE-5, TE-6, CA3-1) · N38 (05/11) — MỘT luật cho mọi cổng ghi vắng: gõ "-", nút Vắng trong hộp, ⋯ "Vắng".
 * Thuần: không đọc DB, không tự đọc ngày.
 */
import { mondayOfDate } from './week.ts';
import { addDaysIso } from './sos.ts';
import { tuanKeTiep } from './chamDiem.ts';
import { t } from '../i18n/index.ts';

/**
 * MT CŨ THEO TỪNG KỸ NĂNG (N38 · PR-MT-VANG L3): tuần thi (thứ Hai) của KỸ NĂNG đó cách tuần hiện tại ≥ 2 tuần. Chỉ dùng để xử lý "-"
 * (Không dự thi); định nghĩa MT cũ của cả lượt (`laMtCu` — hạn chấm, Case 4 tuần, T1) giữ nguyên. Lớp thường cùng mốc (mục 3).
 */
export const laMtCuKyNang = (tuanThi: string, homNay: string): boolean => addDaysIso(mondayOfDate(tuanThi), 14) <= mondayOfDate(homNay);

/**
 * N38 (PR-MT-VANG, chủ SP 05/11) — MỘT hàm cho mọi lối "-" Mock (gõ "-", nút Vắng, ⋯ Vắng). Ba câu: gõ "-" là dời sang TUẦN NGAY SAU TUẦN THI
 * (không theo tuần hiện tại — L1); vắng lần 2 là huỷ (L2); MT cũ của kỹ năng = Không dự thi (L3). `lan` = số lần vắng tính từ lần xếp tay gần nhất
 * (`absence_move_count`). Không còn "thẻ Quản lý" (L4): vướng lượt khác thì máy chủ vẫn dời, chỉ cảnh báo.
 */
export function chuyenVang(o: { lan: number; tuanThi: string; homNay: string }): { kq: 'doi' | 'huy' | 'khong-du-thi'; tuanDich: string | null } {
  if (laMtCuKyNang(o.tuanThi, o.homNay)) return { kq: 'khong-du-thi', tuanDich: null };
  if (o.lan >= 1) return { kq: 'huy', tuanDich: null };
  return { kq: 'doi', tuanDich: tuanKeTiep(mondayOfDate(o.tuanThi)) };
}

/** Hoàn tác "-" (21/10): 10 giây trên web; máy chủ nhận thêm 5 giây cho mạng chậm. */
export const HOAN_TAC_VANG_MS = 10_000;
export function duocHoanTacVang(ghiLuc: string | null | undefined, bayGio: number): boolean {
  return !!ghiLuc && bayGio - Date.parse(ghiLuc) <= HOAN_TAC_VANG_MS + 5_000;
}

/**
 * Kết quả một lần ghi vắng (máy chủ trả): `doi` lần 1 dời tuần (`canhBao` khi vướng lượt khác — vẫn dời, L4) · `huy` lần 2 huỷ ·
 * `khong-du-thi` MT cũ / lớp thường ≥ 2 tuần · `cho-o-kia` Writing mới một task "-".
 */
export type KetQuaVang = { kq: 'doi' | 'huy' | 'khong-du-thi' | 'cho-o-kia'; tuanMoi?: string | null; canhBao?: string | null };

/** Thông báo sau khi ghi — nói đúng hậu quả (CA3-1). */
export function cauDaGhiVang(mon: string, tenHv: string | undefined, k: KetQuaVang | null | undefined): string {
  const em = tenHv ? ` · ${tenHv}` : '';
  if (k?.kq === 'khong-du-thi') return t('Đã ghi Không dự thi · {mon}{em}', { mon, em });
  const sau = k?.kq === 'doi' && k.tuanMoi ? t(' · dời {tuanMoi}', { tuanMoi: k.tuanMoi }) + (k.canhBao ? ` · ${k.canhBao}` : '') : k?.kq === 'huy' ? t(' · huỷ (vắng 2 lần)') : '';
  return t('Đã ghi vắng {mon}{em}{sau}', { mon, em, sau });
}

/**
 * LỚP THƯỜNG "-" (Q1 14/10, N38 mục 3): dời sang TUẦN NGAY SAU TUẦN THI (như Mock L1); tuần thi cách tuần hiện tại ≥ 2 tuần → Không dự thi
 * (không dời, không tính vắng, hết nợ). Vắng bao nhiêu lần cũng không huỷ.
 */
export function luatVangThuong(tuanThi: string, homNay: string): { khongDuThi: true } | { khongDuThi: false; tuanMoi: string } {
  if (laMtCuKyNang(tuanThi, homNay)) return { khongDuThi: true };
  return { khongDuThi: false, tuanMoi: tuanKeTiep(mondayOfDate(tuanThi)) };
}

/**
 * LÝ DO "ĐÃ HUỶ" MỘT KỸ NĂNG MT (Rulebook §21.4 T5, UI-CHAM-TEST): vắng lần 2 (`huyVang`) → "vắng 2 lần" · huỷ khác của kỹ năng (thẻ dời cũ bị
 * từ chối / hết hạn — dữ liệu trước N38) → "QL từ chối dời". MT cũ "-" không phải huỷ (Không dự thi, N38 L3). Cả lượt huỷ → null.
 */
export function lyDoHuy(o: { huyVang?: boolean; sit?: string | null }): string | null {
  if (o.huyVang) return t('vắng 2 lần');
  return o.sit === 'cancelled' ? t('QL từ chối dời') : null;
}
