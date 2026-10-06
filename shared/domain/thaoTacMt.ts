/**
 * THAO TÁC MỘT KỸ NĂNG CỦA MỘT ĐỢT THEO TRẠNG THÁI (PR-XLMT — T38, K4 §4d, K4-15, K4-27).
 *
 * Một nguồn cho "ở trạng thái này, người xem này thấy nút gì": hồ sơ Mock, hộp kỹ năng Kế hoạch Test và menu ⋯ ô lưới lớp
 * thường đều vẽ theo `thaoTacKyNang` — không nơi nào tự dựng menu thứ hai. Máy chủ kiểm lại mọi luật chặn.
 */
import { mondayOfDate } from './week.ts';

export type ThaoTac = 'nhap-diem' | 'sua-diem' | 'dat-lich' | 'doi-lich' | 'doi-han' | 'bo-ky-nang' | 'dua-lai' | 'bao-vang' | 'huy-diem'
  | 'xep-lai' | 'tra-loi-de-nghi' | 'khoi-phuc' | 'xin-doi' | 'khong-mock-lai';

export const CHU_THAO_TAC: Record<ThaoTac, string> = {
  'nhap-diem': 'Nhập điểm', 'sua-diem': 'Sửa điểm', 'dat-lich': 'Xếp lịch', 'doi-lich': 'Dời lịch thi', 'doi-han': 'Dời hạn chấm',
  'bo-ky-nang': 'Bỏ kỹ năng khỏi đợt', 'dua-lai': 'Đưa lại vào đợt', 'bao-vang': 'Báo vắng', 'huy-diem': 'Huỷ điểm',
  'xep-lai': 'Xếp lại bài vắng', 'tra-loi-de-nghi': 'Trả lời đề nghị dời', 'khoi-phuc': 'Khôi phục và đặt tuần',
  'xin-doi': 'Xin dời', 'khong-mock-lai': 'Không mock lại',
};

export type TrangThaiTT = 'khong-yeu-cau' | 'chua-xep' | 'chua-toi-tuan' | 'dang-thi' | 'co-diem' | 'vang' | 'cho-duyet' | 'da-huy' | 'lich-su'
  | 'huy-vang';

export function trangThaiTT(o: {
  batBuoc: boolean; tuanBatDau: string | null; coDiem: boolean; sit: string | null; choDuyet: boolean; lichSu: boolean; homNay: string;
  /** T3 (PR-MTa): kỹ năng huỷ vì vắng 2 lần. Tuỳ chọn để nơi gọi cũ không đổi. */
  huyVang?: boolean;
}): TrangThaiTT {
  if (!o.batBuoc) return 'khong-yeu-cau';
  if (o.coDiem) return 'co-diem';
  if (o.lichSu) return 'lich-su';          // MT cũ chưa điểm: chỉ nhập bù — không dời, không vắng, không hạn
  if (o.huyVang && o.sit === 'cancelled') return 'huy-vang';
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
    /* T3 (PR-MTa): Quản lý khôi phục và đặt tuần / không mock lại; GVCN xin dời; GVBM không có thao tác. */
    case 'huy-vang': return { chinh: q.quanLy ? 'khoi-phuc' : q.gvcn ? 'xin-doi' : null, menu: q.quanLy ? ['khong-mock-lai'] : [] };
  }
}

/** Thao tác có ô lý do (T7) — các nút của `ThaoTac` cộng những thao tác không nằm trong menu kỹ năng. */
export type ThaoTacLyDo = ThaoTac | 'huy-luot' | 'huy-ket-qua' | 'tu-choi' | 'thi-lai' | 'huy-lich';

export const CHU_LY_DO: Record<ThaoTacLyDo, string> = {
  ...CHU_THAO_TAC, 'huy-luot': 'Huỷ lượt', 'huy-ket-qua': 'Huỷ kết quả', 'tu-choi': 'Từ chối', 'thi-lai': 'Thi lại', 'huy-lich': 'Huỷ lịch',
};

/** T7 (PR-MTa, 05/10): lý do BẮT BUỘC chỉ khi mất kết quả (huỷ điểm, huỷ lượt, huỷ kết quả do dời vượt) hoặc Quản lý từ chối. */
export const LY_DO_BAT_BUOC: readonly ThaoTacLyDo[] = ['huy-diem', 'huy-luot', 'huy-ket-qua', 'tu-choi'];

export function canLyDo(t: ThaoTacLyDo): boolean {
  return LY_DO_BAT_BUOC.includes(t);
}

/** `null` = được; thao tác bắt buộc mà trống → "Huỷ điểm: cần ghi lý do.". Không tối thiểu ký tự (T7). Máy chủ gọi lại đúng hàm này. */
export function kiemLyDoThaoTac(t: ThaoTacLyDo, s: string | null | undefined): string | null {
  return canLyDo(t) && !(s ?? '').trim() ? `${CHU_LY_DO[t]}: cần ghi lý do.` : null;
}
