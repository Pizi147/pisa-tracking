/**
 * CẤU HÌNH CÓ PHIÊN BẢN (Quản trị V2 — Hạn mặc định, Kỳ vọng FT, Ngưỡng lớp thường; bảng chung `cau_hinh_phien_ban`).
 * Một bản = `{ id, tu, v }`: `tu` = NGÀY giờ VN có hiệu lực (bản gốc `tu` = '' — trước mọi việc), `v` = giá trị. "Chỉ áp cho cái sinh sau": hàm luật
 * tra bản có hiệu lực TẠI MỐC CỦA CHÍNH VIỆC ĐÓ (ngày tạo lượt, ngày nhập điểm đầu…). Không import gì (dùng ở đáy cây import).
 */
/** `luc` = lúc lưu đầy đủ (ISO) — loại so theo GIỜ (Kỳ vọng FT, Ngưỡng lớp thường: mốc = `created_at` của lượt). */
export type BanPhienBan<T> = { id: number; tu: string; v: T; luc?: string };

/** Ngày giờ VN của một mốc: ISO có múi giờ (`Z`, `+07:00`) → cộng về +7; chỉ ngày / không múi giờ → giữ. */
export const ngayVN = (s: string) => (/T.*([zZ]|[+-]\d{2}:?\d{2})$/.test(s) && Number.isFinite(Date.parse(s)) ? new Date(Date.parse(s) + 7 * 3_600_000).toISOString().slice(0, 10) : s.slice(0, 10));

/**
 * Bản có hiệu lực tại `moc` (thiếu = bây giờ = bản mới nhất). Mặc định so theo NGÀY (Hạn mặc định: việc sinh cùng ngày lưu theo bản mới).
 * `theoGio` (Kỳ vọng FT, Ngưỡng lớp thường — PTA 11/11): mốc có giờ so với LÚC LƯU (`luc`) — lượt tạo 9:00, lưu 15:00 thì lượt đó giữ bản cũ.
 */
export function banTaiMoc<T>(ds: readonly BanPhienBan<T>[], moc?: string | null, theoGio = false): BanPhienBan<T> | undefined {
  if (!moc) return ds.at(-1);
  const ms = theoGio && moc.includes('T') ? Date.parse(moc) : NaN;
  const ngay = ngayVN(moc);
  let chon: BanPhienBan<T> | undefined;
  for (const b of ds) {
    const lucMs = b.luc ? Date.parse(b.luc) : NaN;
    const truoc = Number.isFinite(ms) && Number.isFinite(lucMs) ? lucMs <= ms : b.tu.slice(0, 10) <= ngay;
    if (b.id === 0 || truoc) chon = b;
  }
  return chon;
}
