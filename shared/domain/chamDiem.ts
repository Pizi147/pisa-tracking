/**
 * LUẬT THUẦN CỦA VIỆC CHẤM ĐIỂM — khu vực Test (spec §3.5).
 *
 * Ở đây chỉ có luật KHÔNG ĐỌC DATABASE: xếp việc chấm vào ba mục theo hạn, dựng ô của lưới lớp thường, đếm ngược cửa
 * sổ sửa dấu "-", tính tuần kế tiếp, và luật lý do hiệu chỉnh điểm. Máy chủ và giao diện cùng gọi một nơi, nên hai
 * bên không thể nói hai con số khác nhau — và harness kiểm được mà không cần mở trình duyệt.
 */
import { mondayOfDate } from './week.ts';

export type MucCanCham = 'qua-han' | 'tuan-nay' | 'sap-toi';

export const MUC_CAN_CHAM: readonly MucCanCham[] = ['qua-han', 'tuan-nay', 'sap-toi'] as const;

export const MUC_CAN_CHAM_LABEL: Record<MucCanCham, string> = {
  'qua-han': 'Quá hạn',
  'tuan-nay': 'Tuần này',
  'sap-toi': 'Sắp tới',
};

/**
 * Một việc chấm thuộc mục nào. CHƯA CÓ HẠN KHÔNG PHẢI QUÁ HẠN: môn chưa tới tuần thi thì chưa nợ ai cái gì, xếp nó
 * vào "Quá hạn" là vu oan cho người chấm.
 */
export function mucCanCham(han: string | null, homNay: string, cuoiTuanNay: string): MucCanCham {
  if (!han) return 'sap-toi';
  const d = han.slice(0, 10);
  if (d < homNay.slice(0, 10)) return 'qua-han';
  return d <= cuoiTuanNay.slice(0, 10) ? 'tuan-nay' : 'sap-toi';
}

/** Ba mục cố định, luôn đủ ba (mục rỗng vẫn hiện với số 0 — mockup 05a2 phương án A). */
export function nhomCanCham<T extends { han: string | null }>(
  dong: T[], o: { homNay: string; cuoiTuanNay: string },
): Array<{ muc: MucCanCham; nhan: string; dong: T[] }> {
  return MUC_CAN_CHAM.map((muc) => ({
    muc,
    nhan: MUC_CAN_CHAM_LABEL[muc],
    dong: dong.filter((x) => mucCanCham(x.han, o.homNay, o.cuoiTuanNay) === muc),
  }));
}

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
export function ketQuaThuong(i: { dat: number; daCham: number; tong: number; thieu: string[] }): {
  chinh: string; phu: string | null;
} {
  if (i.daCham === 0) return { chinh: 'Chưa nhập điểm', phu: null };
  const du = i.daCham >= i.tong;
  return {
    chinh: du ? `Đạt ${i.dat}/${i.tong} môn` : `Đạt ${i.dat}/${i.daCham} môn đã chấm`,
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

/** Một câu trạng thái chấm cho Lịch Test và cho dòng Cần chấm. */
export function trangThaiChamLabel(i: { conBai: number; tong: number; quaHan: boolean; chuaToiHan: boolean }): string {
  if (i.conBai === 0) return 'Đã chấm xong';
  if (i.chuaToiHan) return 'Chưa tới hạn';
  return i.quaHan ? `Quá hạn · còn ${i.conBai} bài` : `Còn ${i.conBai} bài`;
}

/** RB-5 — sửa một ô đã có điểm chính thức thì phải nói vì sao. Ngắn quá thì không phải một lý do. */
export const LY_DO_TOI_THIEU = 5;

export function kiemLyDo(s: string | null | undefined): string | null {
  const t = (s ?? '').trim();
  if (!t) return 'Sửa điểm đã nhập thì phải ghi lý do.';
  if (t.length < LY_DO_TOI_THIEU) return `Lý do cần ít nhất ${LY_DO_TOI_THIEU} ký tự để người sau đọc còn hiểu.`;
  return null;
}
