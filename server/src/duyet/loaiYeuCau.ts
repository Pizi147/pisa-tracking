/**
 * GIAO KÈO LOẠI THẺ CỦA HỘP CHỜ DUYỆT (PR-DUYET) — ĐÂY LÀ THỨ PR-SOS / YT4 / LT2 / MT ĐỌC.
 *
 * Một loại thẻ = một khoá ở cuối `LOAI_YEU_CAU` + một dòng `LOAI_YC_META` (shared/domain/yeuCauDuyet.ts) + MỘT phần tử ở cuối
 * `DINH_NGHIA_LOAI` dưới đây. Luồng nguồn tạo thẻ bằng `taoYeuCau` trong giao dịch của mình; quyết định đi qua hộp
 * (`duyetYeuCau` / `tuChoiYeuCau` / `traLoiYeuCau` ở yeuCau.ts) gọi `khiDuyet`/`khiTuChoi`/`khiTraLoi` TRONG giao dịch của hộp.
 * Hàm nguồn tự gọi `chotYeuCau` (idempotent) — đường cũ không qua hộp vẫn chốt đúng thẻ.
 */
import type { Principal } from '../permissions.ts';
import type { LoaiYeuCau, TrangThaiYc } from '../../../shared/domain/index.ts';

export type YeuCauRow = {
  id: number; loai: LoaiYeuCau; doi_tuong_loai: string; doi_tuong_id: number; hoc_vien_id: number | null;
  lop_id: number | null; chi_nhanh_id: number | null; nguoi_xin: number | null; ly_do: string | null; du_lieu: string | null;
  han_duyet: string | null; trang_thai: TrangThaiYc; tao_luc: string;
};

/** Dữ liệu nạp TRƯỚC cho cả danh sách (một câu mỗi bảng) — `moTa` chỉ đọc từ đây. `them`: phần riêng của loại (từ `nap`). */
export type NguCanhThe = {
  homNay: string;
  hocVien: Map<number, string>;
  lop: Map<number, string>;
  nguoi: Map<number, string>;
  them: Map<number, any>;
};

export type DinhNghiaLoai = {
  loai: LoaiYeuCau;
  /** Áp quyết định vào bảng nguồn — chạy TRONG tx của hộp. Hàm nguồn tự gọi `chotYeuCau`; không gọi cũng được, hộp chốt sau. */
  khiDuyet?: (p: Principal, yc: YeuCauRow, vao: { ghiChu: string | null; duLieu?: unknown }) => void;
  khiTuChoi?: (p: Principal, yc: YeuCauRow, lyDo: string) => void;
  khiTraLoi?: (p: Principal, yc: YeuCauRow, traLoi: string) => void;
  /** Điều kiện SQL "đối tượng không còn ý nghĩa" trên bí danh `y` (một biểu thức, không tham số) + lý do hiện trên thẻ. */
  chet?: { sql: string; lyDo: string };
  /** Báo lên: tạo thẻ mới (ON CONFLICT DO NOTHING) + trả số thẻ tạo. Gọi trong `quetYeuCau`; không có gì để tạo thì không mở tx. */
  quet?: (conn: any, homNay: string) => number;
  /** Nạp phần riêng của loại cho MỘT lô thẻ (một câu) → `ngu.them.get(yc.id)`. */
  nap?: (conn: any, ds: YeuCauRow[]) => Map<number, any>;
  /** Chữ riêng của thẻ: dòng tiêu đề sau nhãn phân loại, các dòng phụ, câu "Nếu duyệt: …", đường "Mở". Chỉ đọc. */
  moTa: (yc: YeuCauRow, ngu: NguCanhThe) => { tieuDe: string; dong: string[]; neuDuyet?: string; mo?: string };
};

/** MỖI PR THÊM MỘT PHẦN TỬ VÀO CUỐI MẢNG — không sửa phần tử của PR khác. */
export const DINH_NGHIA_LOAI: DinhNghiaLoai[] = [];

export function dinhNghiaCua(loai: string): DinhNghiaLoai | undefined {
  return DINH_NGHIA_LOAI.find((d) => d.loai === loai);
}
