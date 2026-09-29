/**
 * THAO TÁC MỘT KỸ NĂNG CỦA MỘT ĐỢT THEO TRẠNG THÁI (PR-XLMT — T38, K4 §4d, K4-15, K4-27).
 *
 * Một nguồn cho "ở trạng thái này, người xem này thấy nút gì": hồ sơ Mock, hộp kỹ năng Kế hoạch Test và menu ⋯ ô lưới lớp
 * thường đều vẽ theo `thaoTacKyNang` — không nơi nào tự dựng menu thứ hai. Máy chủ kiểm lại mọi luật chặn.
 */
import { LY_DO_TOI_THIEU } from './chamDiem.ts';
import { mondayOfDate } from './week.ts';

export type ThaoTac = 'nhap-diem' | 'sua-diem' | 'dat-lich' | 'doi-lich' | 'doi-han' | 'bo-ky-nang' | 'dua-lai' | 'bao-vang' | 'huy-diem'
  | 'xep-lai' | 'tra-loi-de-nghi' | 'khoi-phuc';

export const CHU_THAO_TAC: Record<ThaoTac, string> = {
  'nhap-diem': 'Nhập điểm', 'sua-diem': 'Sửa điểm', 'dat-lich': 'Xếp lịch', 'doi-lich': 'Dời lịch thi', 'doi-han': 'Dời hạn chấm',
  'bo-ky-nang': 'Bỏ kỹ năng khỏi đợt', 'dua-lai': 'Đưa lại vào đợt', 'bao-vang': 'Báo vắng', 'huy-diem': 'Huỷ điểm',
  'xep-lai': 'Xếp lại bài vắng', 'tra-loi-de-nghi': 'Trả lời đề nghị dời', 'khoi-phuc': 'Khôi phục và đặt tuần',
};

export type TrangThaiTT = 'khong-yeu-cau' | 'chua-xep' | 'chua-toi-tuan' | 'dang-thi' | 'co-diem' | 'vang' | 'cho-duyet' | 'da-huy' | 'lich-su';

export function trangThaiTT(o: {
  batBuoc: boolean; tuanBatDau: string | null; coDiem: boolean; sit: string | null; choDuyet: boolean; lichSu: boolean; homNay: string;
}): TrangThaiTT {
  if (!o.batBuoc) return 'khong-yeu-cau';
  if (o.coDiem) return 'co-diem';
  if (o.lichSu) return 'lich-su';          // lượt lịch sử chưa điểm: chỉ nhập bù — không dời, không vắng, không hạn
  if (o.sit === 'cancelled') return 'da-huy';
  if (o.choDuyet) return 'cho-duyet';
  if (o.sit === 'absent') return 'vang';
  if (!o.tuanBatDau) return 'chua-xep';
  return o.tuanBatDau.slice(0, 10) > mondayOfDate(o.homNay) ? 'chua-toi-tuan' : 'dang-thi';
}

/** `nhapDiem` = quyền sửa ô THẬT của người xem (đã gồm R11 — Quản lý hiệu chỉnh sau hoàn tất vẫn đúng). */
export type QuyenTT = { nhapDiem: boolean; quanLy: boolean; gvcn: boolean; laFt: boolean; dotHoanTat: boolean };

/** ≤ 1 nút chính + ≤ 3 mục menu (K4-27). "Lịch sử" KHÔNG nằm trong menu dòng — ở dòng thời gian của đợt (YC-13.6). */
export function thaoTacKyNang(tt: TrangThaiTT, q: QuyenTT): { chinh: ThaoTac | null; menu: ThaoTac[] } {
  const ql = q.quanLy, ftQl = q.laFt && q.quanLy;
  switch (tt) {
    case 'khong-yeu-cau': return { chinh: ftQl ? 'dua-lai' : null, menu: [] };
    case 'chua-xep': return { chinh: ql ? 'dat-lich' : null, menu: ftQl ? ['bo-ky-nang'] : [] };
    case 'chua-toi-tuan': return { chinh: q.nhapDiem ? 'nhap-diem' : null, menu: [...(ql ? ['doi-lich'] : []), ...(ftQl ? ['bo-ky-nang'] : [])] as ThaoTac[] };
    case 'dang-thi': return { chinh: q.nhapDiem ? 'nhap-diem' : null,
      menu: [...(q.gvcn || ql ? ['bao-vang'] : []), ...(ql ? ['doi-han', 'doi-lich'] : [])] as ThaoTac[] };
    case 'co-diem': return { chinh: q.nhapDiem ? 'sua-diem' : null, menu: (q.dotHoanTat ? ql : q.nhapDiem || ql) ? ['huy-diem'] : [] };
    case 'vang': return { chinh: q.gvcn || ql ? 'xep-lai' : null, menu: [] };
    case 'cho-duyet': return { chinh: ql ? 'tra-loi-de-nghi' : null, menu: [] };
    case 'da-huy': return { chinh: ql ? 'khoi-phuc' : null, menu: [] };
    case 'lich-su': return { chinh: q.nhapDiem ? 'nhap-diem' : null, menu: [] };
  }
}

/** K4-15: lý do bắt buộc? Dời/xếp lịch thi chỉ bắt buộc khi tuần thi hiện tại đã bắt đầu. */
export function canLyDo(t: ThaoTac, tuanDaBatDau: boolean): boolean {
  if (t === 'doi-lich' || t === 'dat-lich') return tuanDaBatDau;
  return t === 'doi-han' || t === 'bo-ky-nang' || t === 'bao-vang' || t === 'huy-diem';
}

/** `null` = lý do dùng được; còn lại là câu lỗi mở đầu bằng tên thao tác. Máy chủ gọi lại đúng hàm này. */
export function kiemLyDoThaoTac(ten: string, s: string | null | undefined): string | null {
  const t = (s ?? '').trim();
  if (!t) return `${ten}: cần ghi lý do.`;
  return t.length < LY_DO_TOI_THIEU ? `${ten}: lý do cần ít nhất ${LY_DO_TOI_THIEU} ký tự.` : null;
}
