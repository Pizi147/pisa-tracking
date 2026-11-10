/**
 * BAND & NGƯỠNG (QTV2-BAND, chủ SP 11/11 "band điểm"; PTA chốt XM-1 11/11; đặc tả `2026-11-11-quan-tri-v2-design.md` mục 5.5, 6.2).
 * Hai cấu hình có phiên bản (bảng `cau_hinh_phien_ban`, Quản trị sửa, Quản lý xem):
 *  · KỲ VỌNG MT FAST TRACK — kỳ vọng = Target − x theo lần MT: MT1 1.0 · MT2 0.5 · MT3+ 0 · lộ trình RF mọi MT 0.
 *  · NGƯỠNG LỚP THƯỜNG (%) — Học lại dưới `hocLai` · Cân nhắc `hocLai`–(`len` − 1) · Lên từ `len` · Mini Test đạt từ `miniTest`. "Đạt từ" của lớp vẫn
 *    là ngưỡng của chương trình (Chương trình & lộ trình).
 * MỐC CHỌN BẢN (PTA chốt 11/11): `created_at` của LƯỢT (MT / Final), so cả GIỜ với lúc lưu bản. Lượt được tạo một lần khi mở lộ trình / lớp ⇒ sửa chỉ
 * áp cho lộ trình / lớp MỞ TỪ NAY; lượt của lộ trình đang chạy giữ mức cũ (sửa điểm sau vẫn theo mức đó). Mini Test: ngày làm.
 * Bảng rỗng = bản gốc (đúng giá trị cũ) ⇒ ngày đầu không đổi hành vi. Máy chủ (`platform/cauHinh.ts`) và web (phiên) gọi `datNguonBand`.
 */
import { banTaiMoc, type BanPhienBan } from './phienBan.ts';

export const KY_VONG_FT_GOC = { mt1: 1, mt2: 0.5, mt3: 0, rf: 0 } as const;
export const NGUONG_THUONG_GOC = { hocLai: 50, len: 60, miniTest: 70 } as const;
export type KyVongFt = { -readonly [K in keyof typeof KY_VONG_FT_GOC]: number };
export type NguongThuong = { -readonly [K in keyof typeof NGUONG_THUONG_GOC]: number };

const GOC_KV: BanPhienBan<KyVongFt> = { id: 0, tu: '', v: { ...KY_VONG_FT_GOC } };
const GOC_NG: BanPhienBan<NguongThuong> = { id: 0, tu: '', v: { ...NGUONG_THUONG_GOC } };
let nguonKv: () => readonly BanPhienBan<KyVongFt>[] = () => [GOC_KV];
let nguonNg: () => readonly BanPhienBan<NguongThuong>[] = () => [GOC_NG];
/** Máy chủ / web đặt nguồn (cũ → mới); `null` = chỉ bản gốc (phép kiểm). */
export function datNguonBand(kv: (() => readonly BanPhienBan<KyVongFt>[]) | null, ng: (() => readonly BanPhienBan<NguongThuong>[]) | null): void {
  nguonKv = kv ?? (() => [GOC_KV]);
  nguonNg = ng ?? (() => [GOC_NG]);
}

/** Bản kỳ vọng FT tại `moc` (`created_at` của lượt MT; thiếu = bản mới nhất — lượt sắp tạo). */
export const kyVongFtTai = (moc?: string | null): KyVongFt => ({ ...KY_VONG_FT_GOC, ...(banTaiMoc(nguonKv(), moc, true) ?? GOC_KV).v });
/** Ngưỡng lớp thường tại `moc` (`created_at` của lượt Final / ngày làm Mini Test; thiếu = bản mới nhất). Trả TỈ LỆ 0–1 (so với tỷ lệ chưa làm tròn). */
export function nguongThuongTai(moc?: string | null): { hocLai: number; len: number; miniTest: number } {
  const v = { ...NGUONG_THUONG_GOC, ...(banTaiMoc(nguonNg(), moc, true) ?? GOC_NG).v };
  return { hocLai: v.hocLai / 100, len: v.len / 100, miniTest: v.miniTest / 100 };
}
/** Mini Test đạt khi tỷ lệ ≥ ngưỡng của bản tại ngày làm (thay hằng `NGUONG_MINI_TEST`). */
export const nguongMiniTest = (ngayLam?: string | null): number => nguongThuongTai(ngayLam).miniTest;
/** Nhãn % của bản mới nhất cho chữ trên màn ("50–59 %", "≥ 70 %"): `{ hocLai, len, miniTest }` dạng số nguyên %. */
export const nguongThuongHienTai = (): NguongThuong => ({ ...NGUONG_THUONG_GOC, ...(nguonNg().at(-1) ?? GOC_NG).v });

/** Khoảng % của một dải Cuối khoá theo bản mới nhất (chữ số, không cần dịch): `< 50%` · `50–59%` · `60–69%` · `≥ 70%` (`nguongDat` = "Đạt từ" của lớp, tỉ lệ). */
export function khoangDai(dai: string, nguongDat: number): string | null {
  const n = nguongThuongHienTai();
  const dat = Math.round(nguongDat * 100);
  if (dai === 'duoi_50') return `< ${n.hocLai}%`;
  if (dai === '50_59') return `${n.hocLai}–${n.len - 1}%`;
  if (dai === '60_69') return `${n.len}–${dat - 1}%`;
  return dai === 'dat' ? `≥ ${dat}%` : null;
}

/** Tên trường cho nhật ký + màn Band & ngưỡng. */
export const TEN_KY_VONG_FT: Record<keyof KyVongFt, string> = { mt1: 'Kỳ vọng MT1', mt2: 'Kỳ vọng MT2', mt3: 'Kỳ vọng MT3 trở đi', rf: 'Kỳ vọng lộ trình RF' };
export const TEN_NGUONG_THUONG: Record<keyof NguongThuong, string> = { hocLai: 'Học lại dưới', len: 'Lên từ', miniTest: 'Mini Test đạt từ' };

const laKhoaLa = (o: object, goc: object) => Object.keys(o).find((k) => !Object.hasOwn(goc, k));
/** Kiểm một bản kỳ vọng: Target − x, x từ 0 đến 3, bước 0.5; đủ khoá, không khoá lạ. Trả lỗi đầu tiên (kèm trường) hoặc null. */
export function kiemKyVongFt(v: unknown): { ma: string | null; loi: string } | null {
  if (!v || typeof v !== 'object') return { ma: null, loi: 'Thiếu dữ liệu kỳ vọng.' };
  const o = v as Record<string, unknown>;
  const la = laKhoaLa(o, KY_VONG_FT_GOC);
  if (la) return { ma: null, loi: `Trường không có: ${la}.` };
  for (const k of Object.keys(KY_VONG_FT_GOC)) {
    const n = o[k];
    if (typeof n !== 'number' || !Number.isFinite(n) || n < 0 || n > 3 || !Number.isInteger(n * 2)) return { ma: k, loi: 'Phải từ 0 đến 3, bước 0.5.' };
  }
  return null;
}
/** Kiểm một bản ngưỡng: số nguyên %, 0 < học lại < lên ≤ 100, Mini Test 1–100; đủ khoá, không khoá lạ. */
export function kiemNguongThuong(v: unknown): { ma: string | null; loi: string } | null {
  if (!v || typeof v !== 'object') return { ma: null, loi: 'Thiếu dữ liệu ngưỡng.' };
  const o = v as Record<string, unknown>;
  const la = laKhoaLa(o, NGUONG_THUONG_GOC);
  if (la) return { ma: null, loi: `Trường không có: ${la}.` };
  for (const k of Object.keys(NGUONG_THUONG_GOC)) {
    const n = o[k];
    if (typeof n !== 'number' || !Number.isInteger(n) || n < 1 || n > 100) return { ma: k, loi: 'Phải là số nguyên từ 1 đến 100.' };
  }
  if ((o.hocLai as number) >= (o.len as number)) return { ma: 'len', loi: '"Lên từ" phải lớn hơn "Học lại dưới".' };
  return null;
}
