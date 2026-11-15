/**
 * HD3-1 — NGỮ CẢNH CỦA NÚT "?" (đặc tả `2026-11-13-overhaul-v6/15-huong-dan-v3.md` mục 4.2, 8.1, 8.2). Không chứa chữ hướng dẫn (gói chính không kéo
 * nội dung): panel việc ghi DÒNG VIỆC đang mở, dòng quy chế ghi câu đang hiện; ⓘ quy chế và "?" nổi trên nền mờ gọi `moHuongDan`.
 * "?" đọc một lần lúc mở. Chữ lấy từ dòng việc đã nạp — 0 câu đọc thêm.
 */
export type ViecMo = { group: string; key: string; tieuDe: string; lop: string | null; mine: boolean; chonPa?: boolean;
  /** Dòng chưa có người giữ (chưa phân công) — dải trung tính thay "Việc của {vai}" (PTA Overhaul rà #1761). */
  chuaGiu?: boolean };
export type QuyCheMo = { chu: string; chiTiet?: string };

/** Ngăn ghi theo thứ tự gắn: mục gắn sau = trên cùng. Trả hàm gỡ (dùng làm cleanup của effect). */
function nganGhi<T>() {
  const ds: { v: T }[] = [];
  return {
    ghi: (v: T) => { const o = { v }; ds.push(o); return () => { const i = ds.indexOf(o); if (i >= 0) ds.splice(i, 1); }; },
    tren: (): T | null => ds[ds.length - 1]?.v ?? null,
  };
}
const viec = nganGhi<ViecMo>();
const quyChe = nganGhi<QuyCheMo>();
export const ghiViecMo = viec.ghi;
export const viecMoTren = viec.tren;
export const ghiQuyCheMo = quyChe.ghi;
export const quyCheTren = quyChe.tren;

/** Mở panel Hướng dẫn từ nơi khác thanh trên (ⓘ dòng quy chế, "?" nổi trên nền mờ) — thanh trên nghe sự kiện này. */
export const MO_HD = 'pisa:mo-huong-dan';
export const moHuongDan = () => window.dispatchEvent(new Event(MO_HD));
