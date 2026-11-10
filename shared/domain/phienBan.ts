/**
 * CẤU HÌNH CÓ PHIÊN BẢN (Quản trị V2 — Hạn mặc định, Kỳ vọng FT, Ngưỡng lớp thường; bảng chung `cau_hinh_phien_ban`).
 * Một bản = `{ id, tu, v }`: `tu` = NGÀY giờ VN có hiệu lực (bản gốc `tu` = '' — trước mọi việc), `v` = giá trị. "Chỉ áp cho cái sinh sau": hàm luật
 * tra bản có hiệu lực TẠI MỐC CỦA CHÍNH VIỆC ĐÓ (ngày tạo lượt, ngày nhập điểm đầu…). Không import gì (dùng ở đáy cây import).
 */
export type BanPhienBan<T> = { id: number; tu: string; v: T };

/** Ngày giờ VN của một mốc: ISO có múi giờ (`Z`, `+07:00`) → cộng về +7; chỉ ngày / không múi giờ → giữ. */
export const ngayVN = (s: string) => (/T.*([zZ]|[+-]\d{2}:?\d{2})$/.test(s) && Number.isFinite(Date.parse(s)) ? new Date(Date.parse(s) + 7 * 3_600_000).toISOString().slice(0, 10) : s.slice(0, 10));

/** Bản có hiệu lực tại `moc` (thiếu = bây giờ = bản mới nhất). So theo NGÀY: việc sinh cùng ngày lưu theo bản mới. */
export function banTaiMoc<T>(ds: readonly BanPhienBan<T>[], moc?: string | null): BanPhienBan<T> | undefined {
  const ngay = moc ? ngayVN(moc) : null;
  let chon: BanPhienBan<T> | undefined;
  for (const b of ds) if (!ngay || b.tu.slice(0, 10) <= ngay) chon = b;
  return chon;
}
