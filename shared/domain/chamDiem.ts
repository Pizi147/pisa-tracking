/**
 * LUẬT THUẦN CỦA VIỆC CHẤM ĐIỂM — khu vực Test (spec §3.5).
 *
 * Ở đây chỉ có luật KHÔNG ĐỌC DATABASE: nhãn hàng lớp của Lịch Test, dựng ô của lưới lớp thường, đếm ngược cửa
 * sổ sửa dấu "-", tính tuần kế tiếp, và luật lý do hiệu chỉnh điểm. Máy chủ và giao diện cùng gọi một nơi, nên hai
 * bên không thể nói hai con số khác nhau — và harness kiểm được mà không cần mở trình duyệt.
 */
import { mondayOfDate } from './week.ts';

/** Lịch Test lọc lớp nào (PR-UX1 Q4): lớp người xem có phân công, hay cả phạm vi được xem. */
export type PhamViLichTest = 'cua-toi' | 'tat-ca';

export type LoaiNhanLop = 'da-cham' | 'chua-toi-han' | 'cho-ban' | 'cho-gv-khac' | 'cho-cham';

/**
 * NHÃN MỘT HÀNG LỚP Ở LỊCH TEST (PR-UX1 Q6, Q7) — một trạng thái, ≤ 3 từ, nói bài còn lại là của ai. Quá hạn KHÔNG
 * nằm ở đây: cột Hạn đã nói (mockup 17 B-5, quá hạn nói một lần). Người không chấm (Quản lý) thấy "Chờ chấm" — với họ
 * "GV khác" sai nghĩa.
 */
export function nhanLopLichTest(i: { conBai: number; conBaiCuaToi: number; chuaToiHan: boolean; coDayLop: boolean })
  : { loai: LoaiNhanLop; chu: string } {
  if (i.conBai === 0) return { loai: 'da-cham', chu: 'Đã chấm' };          // web thêm ✓ nhỏ (G-1)
  if (i.chuaToiHan) return { loai: 'chua-toi-han', chu: 'Chưa đến lịch' };
  if (i.conBaiCuaToi > 0) return { loai: 'cho-ban', chu: 'Chờ bạn chấm' };
  return i.coDayLop ? { loai: 'cho-gv-khac', chu: 'Chờ GV khác' } : { loai: 'cho-cham', chu: 'Chờ chấm' };
}

/** Lớp nào tự mở khi vào Lịch Test (Q8): người có phân công — lớp còn bài của mình; Quản lý — lớp còn bài. */
export const lopTuMo = (i: { conBai: number; conBaiCuaToi: number; coPhanCong: boolean }) =>
  (i.coPhanCong ? i.conBaiCuaToi > 0 : i.conBai > 0);

/**
 * MỘT Ô CỦA LƯỚI LỚP THƯỜNG: số câu đúng / tổng số câu (Writing và Speaking chấm theo thang điểm thì là điểm đạt /
 * tổng điểm — cùng hai ô, xem ⓘ của lưới).
 *
 * `vienVang` = tổng của dòng này KHÁC tổng đang đặt ở đầu cột, tức là em làm đề khác. Không có tổng cố định theo
 * chương trình, nên "khác tổng cột" là chỉ báo duy nhất có thật.
 */
export function oLuoiThuong(i: { diem: number | null; tong: number | null; tongCot: number | null }): {
  hien: string; vienVang: boolean; trong: boolean;
} {
  const trong = i.diem === null || i.diem === undefined;
  return {
    trong,
    hien: trong || i.tong === null ? '' : `${i.diem}/${i.tong}`,
    vienVang: i.tong !== null && i.tongCot !== null && i.tong !== i.tongCot,
  };
}

/**
 * CÂU KẾT QUẢ CỦA MỘT DÒNG LỚP THƯỜNG. Thiếu điểm KHÁC chưa đạt (spec §3.5): môn chưa chấm không bị đếm thành môn
 * trượt, nên khi chưa đủ điểm thì nói rõ "trên số môn ĐÃ CHẤM".
 */
export function ketQuaThuong(i: { dat: number; daCham: number; tong: number; thieu: string[]; tyLe?: number | null; khongChiaMon?: boolean }): {
  chinh: string; phu: string | null;
} {
  /* MH7: Pre FOU không chia môn — chỉ % tổng. Làm tròn CHỈ để hiện; đạt/không xét trên tỷ lệ chính xác ở máy chủ. */
  if (i.khongChiaMon && i.tyLe != null) return { chinh: `${Math.round(i.tyLe * 100)}%`, phu: null };
  if (i.daCham === 0) return { chinh: 'Chưa nhập điểm', phu: null };
  const du = i.daCham >= i.tong;
  return {
    chinh: du ? `${i.dat}/${i.tong} môn đạt` : `${i.dat}/${i.daCham} môn đạt (đã chấm)`,
    phu: du || !i.thieu.length ? null : `còn ${i.thieu.join(', ')} chưa chấm`,
  };
}

/**
 * DS02 — đếm ngược nhẹ trong ô đang mang dấu "-" của lớp Fast Track: còn bao nhiêu ngày để đổi sang điểm thật trước
 * khi hết Chủ nhật của tuần thi. CHỈ CHỮ, không tô đỏ (plan.md §20 DS02). Lớp thường không dùng hàm này: ở đó dấu "-"
 * dời môn sang tuần sau ngay, không có cửa sổ sửa.
 */
export function demNguocSuaDau(cuoiTuan: string | null, homNay: string): string | null {
  if (!cuoiTuan) return null;
  const het = cuoiTuan.slice(0, 10);
  const nay = homNay.slice(0, 10);
  if (nay > het) return null;
  if (nay === het) return 'Còn hôm nay để sửa';
  const soNgay = Math.round((Date.parse(`${het}T00:00:00Z`) - Date.parse(`${nay}T00:00:00Z`)) / 86400000);
  return `Còn ${soNgay} ngày để sửa`;
}

/** Thứ Hai của tuần kế tiếp — dùng khi lớp thường ghi "-" và môn đó tự dời (C08). */
export function tuanKeTiep(weekStart: string): string {
  const monday = mondayOfDate(weekStart);
  return new Date(Date.parse(`${monday}T00:00:00Z`) + 7 * 86400000).toISOString().slice(0, 10);
}

/** Một câu trạng thái chấm cho dòng kỹ năng của Lịch Test. */
export function trangThaiChamLabel(i: { conBai: number; tong: number; quaHan: boolean; chuaToiHan: boolean }): string {
  if (i.conBai === 0) return 'Đã chấm xong';
  if (i.chuaToiHan) return 'Chưa đến lịch';
  return i.quaHan ? `Quá hạn · còn ${i.conBai} bài` : `Còn ${i.conBai} bài`;
}

/**
 * TRẠNG THÁI LƯU THEO TỪNG Ô của lưới chấm (PR-UX1, lỗi thật bản chính 24/09): trước đây một dòng chỉ nhớ lần lưu CUỐI
 * — ô L lưu hỏng (503/BUSY/mạng) rồi ô R lưu được thì dòng hiện "Đã lưu", giáo viên tưởng đủ điểm. Nay mỗi ô giữ trạng
 * thái riêng; dòng chỉ "đã lưu" khi KHÔNG còn ô nào lỗi.
 *
 *   bat-dau     gửi ô lên máy chủ            → dang-luu
 *   thanh-cong  máy chủ nhận                 → da-luu (xoá lỗi cũ của chính ô đó)
 *   loi         lỗi mạng / 5xx               → loi (giữ tới khi chính ô đó lưu được)
 *   bo          máy chủ từ chối có chủ ý (4xx của lệnh "-"), hộp lý do tự báo lỗi → ô về như chưa gửi
 */
export type TrangThaiLuuO = 'dang-luu' | 'da-luu' | 'loi';
export function capNhatLuuO(
  o: Readonly<Record<string, TrangThaiLuuO>>, oKey: string, su: 'bat-dau' | 'thanh-cong' | 'loi' | 'bo',
): Record<string, TrangThaiLuuO> {
  const moi = { ...o };
  if (su === 'bo') delete moi[oKey];
  else moi[oKey] = su === 'bat-dau' ? 'dang-luu' : su === 'thanh-cong' ? 'da-luu' : 'loi';
  return moi;
}
/** Dòng/hàng lớp: có ô lỗi → "n ô chưa lưu" (thắng mọi trạng thái khác); còn ô đang gửi → đang lưu; rồi mới đã lưu. */
export function tomTatLuuDong(cacO: readonly (TrangThaiLuuO | null | undefined)[]): { tt: TrangThaiLuuO | null; soLoi: number } {
  const soLoi = cacO.filter((x) => x === 'loi').length;
  if (soLoi) return { tt: 'loi', soLoi };
  if (cacO.includes('dang-luu')) return { tt: 'dang-luu', soLoi: 0 };
  return { tt: cacO.includes('da-luu') ? 'da-luu' : null, soLoi: 0 };
}
export const chuOChuaLuu = (n: number) => `${n} ô chưa lưu`;

/** T10 (PR-MTa): band nhập tay — số hữu hạn 0..9, bậc 0.5. `null` = hợp lệ. */
export function kiemBand(v: unknown): string | null {
  return typeof v === 'number' && Number.isFinite(v) && v >= 0 && v <= 9 && Number.isInteger(v * 2)
    ? null : 'Band từ 0 đến 9, bậc 0.5 (ví dụ 6.5 hoặc b6).';
}

export type ONhapLR = { raw: number } | { band: number };

/** T10: ô L/R — số nguyên = số câu đúng (như cũ); có dấu chấm hoặc tiền tố "b" = band. '' → null. */
export function docONhapLR(s: string): ONhapLR | { loi: string } | null {
  const t = s.trim();
  if (!t) return null;
  if (/^\d+$/.test(t)) return { raw: Number(t) };
  const m = /^[bB](\d+(?:\.\d+)?)$|^(\d+\.\d+)$/.exec(t);
  const band = m ? Number(m[1] ?? m[2]) : NaN;
  const loi = kiemBand(band);
  return loi ? { loi } : { band };
}
