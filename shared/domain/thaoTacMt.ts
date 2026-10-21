/**
 * THAO TÁC MỘT KỸ NĂNG CỦA MỘT ĐỢT THEO TRẠNG THÁI (PR-XLMT — T38, K4 §4d, K4-15, K4-27).
 *
 * Một nguồn cho "ở trạng thái này, người xem này thấy nút gì": hồ sơ Mock, hộp kỹ năng Kế hoạch Test và menu ⋯ ô lưới lớp
 * thường đều vẽ theo `thaoTacKyNang` — không nơi nào tự dựng menu thứ hai. Máy chủ kiểm lại mọi luật chặn.
 */
import { mondayOfDate } from './week.ts';
import { t } from '../i18n/index.ts';

export type ThaoTac = 'nhap-diem' | 'sua-diem' | 'dat-lich' | 'doi-lich' | 'doi-han' | 'bo-ky-nang' | 'dua-lai' | 'bao-vang' | 'huy-diem'
  | 'xep-lai' | 'tra-loi-de-nghi' | 'khoi-phuc' | 'khong-mock-lai' | 'khoi-phuc-diem';

export const CHU_THAO_TAC: Record<ThaoTac, string> = {
  'nhap-diem': t('Nhập điểm'), 'sua-diem': t('Sửa điểm'), 'dat-lich': t('Xếp lịch'), 'doi-lich': t('Dời lịch thi'), 'doi-han': t('Dời hạn chấm'),
  'bo-ky-nang': t('Huỷ kỹ năng'), 'dua-lai': t('Đưa lại vào đợt'), 'bao-vang': t('Vắng'), 'huy-diem': t('Huỷ điểm'),
  'xep-lai': t('Xếp lại bài vắng'), 'tra-loi-de-nghi': t('Trả lời đề nghị dời'), 'khoi-phuc': t('Khôi phục và đặt tuần'),
  'khong-mock-lai': t('Không mock lại'), 'khoi-phuc-diem': t('Khôi phục điểm'),
};

export type TrangThaiTT = 'khong-yeu-cau' | 'chua-xep' | 'chua-toi-tuan' | 'dang-thi' | 'co-diem' | 'vang' | 'cho-duyet' | 'da-huy' | 'lich-su'
  | 'huy-vang';

export function trangThaiTT(o: {
  batBuoc: boolean; tuanBatDau: string | null; coDiem: boolean; sit: string | null; choDuyet: boolean; lichSu: boolean; homNay: string;
  /** T3 (PR-MTa): kỹ năng huỷ vì vắng 2 lần. Tuỳ chọn để nơi gọi cũ không đổi. */
  huyVang?: boolean;
  /** LUAT-34: MT cũ, mọi ô của kỹ năng "-" (`no_show_cu`) = Đã huỷ · vắng MT cũ — cùng nút với vắng 2 lần (Khôi phục / Giữ huỷ). */
  huyCu?: boolean;
}): TrangThaiTT {
  if (!o.batBuoc) return 'khong-yeu-cau';
  if (o.coDiem) return 'co-diem';
  if (o.huyCu && o.sit !== 'cancelled') return o.choDuyet ? 'cho-duyet' : 'huy-vang';
  /* PR-MTGON: đã huỷ xét TRƯỚC MT cũ — kỹ năng huỷ của MT cũ vẫn có "Đưa lại vào đợt". */
  /* PR-MTb sau rà (I1): huỷ vì vắng mà đang có đề nghị dời chờ → "chờ duyệt" (Quản lý trả lời đề nghị, không Khôi phục / Không mock lại song song). */
  if (o.huyVang && o.sit === 'cancelled') return o.choDuyet ? 'cho-duyet' : 'huy-vang';
  if (o.sit === 'cancelled') return 'da-huy';
  if (o.lichSu) return 'lich-su';          // MT cũ chưa điểm: chỉ nhập bù — không dời, không vắng, không hạn
  if (o.choDuyet) return 'cho-duyet';
  if (o.sit === 'absent') return 'vang';
  if (!o.tuanBatDau) return 'chua-xep';
  return o.tuanBatDau.slice(0, 10) > mondayOfDate(o.homNay) ? 'chua-toi-tuan' : 'dang-thi';
}

/** `nhapDiem` = quyền sửa ô THẬT của người xem (đã gồm R11 — Quản lý hiệu chỉnh sau hoàn tất vẫn đúng). */
export type QuyenTT = {
  nhapDiem: boolean; quanLy: boolean; gvcn: boolean; laFt: boolean; dotHoanTat: boolean;
  /** OV-10a: `attempt.skip_skill` (Huỷ kỹ năng / Đưa lại) và `deadline.override` (Dời hạn chấm) — Admin có `plan.week` mà không có hai khoá này. Bỏ trống = theo `quanLy`. */
  huy?: boolean; han?: boolean;
  /** LUAT-34 (T20b): ô có điểm đã huỷ còn cất (`ket_qua_huy` loại `huy_diem`) → "Khôi phục điểm" cho người sửa được ô. */
  diemHuy?: boolean;
  /** CV-LOI (V4B H15): máy chủ cho đổi lịch kỹ năng này (`canMoveSkillSchedule`: Quản lý, hoặc GVCN / GVBM đúng môn ở lớp thường). Bỏ trống = suy theo vai. */
  doiLich?: boolean;
};

/** ≤ 1 nút chính + ≤ 3 mục menu (K4-27). "Lịch sử" KHÔNG nằm trong menu dòng — ở dòng thời gian của đợt (YC-13.6). */
export function thaoTacKyNang(tt: TrangThaiTT, q: QuyenTT): { chinh: ThaoTac | null; menu: ThaoTac[] } {
  const ql = q.quanLy, ftQl = q.laFt && q.quanLy && (q.huy ?? true), han = ql && (q.han ?? true);
  /* PR-MTGON (luật 3): Quản lý FT "Huỷ kỹ năng" ở MỌI trạng thái còn kỹ năng trong đợt (có điểm thì web hỏi "Xoá điểm và huỷ kỹ năng?"). */
  const huy: ThaoTac[] = ftQl ? ['bo-ky-nang'] : [];
  /* LUAT-34 (T20b): ô trống có điểm cũ đã huỷ còn cất → "Khôi phục điểm" một bấm, người sửa được ô. */
  const khoiPhuc: ThaoTac[] = q.diemHuy && (q.nhapDiem || ql) ? ['khoi-phuc-diem'] : [];
  switch (tt) {
    case 'khong-yeu-cau': return { chinh: ftQl ? 'dua-lai' : null, menu: [] };
    case 'chua-xep': return { chinh: ql ? 'dat-lich' : null, menu: huy };
    case 'chua-toi-tuan': return { chinh: q.nhapDiem ? 'nhap-diem' : null, menu: [...(ql ? ['doi-lich'] : []), ...huy] as ThaoTac[] };
    case 'dang-thi': return { chinh: q.nhapDiem ? 'nhap-diem' : null,
      menu: [...khoiPhuc, ...(q.gvcn || ql ? ['bao-vang'] : []), ...(han ? ['doi-han'] : []), ...(ql ? ['doi-lich'] : []), ...huy] as ThaoTac[] };
    /* PR-MTb T20: Quản lý / Quản trị dời được kỹ năng đã có điểm (điểm đi theo; máy chủ `setSkillWeek` `quanLy`). LUAT-34 (L3): "Đủ điểm"
     * không còn khoá — Huỷ điểm theo quyền sửa ô. */
    case 'co-diem': return { chinh: q.nhapDiem ? 'sua-diem' : null,
      menu: [...(ql ? ['doi-lich'] : []), ...(q.nhapDiem || ql ? ['huy-diem'] : []), ...huy] as ThaoTac[] };
    /* CV-LOI (V4B H15): nút theo cờ quyền máy chủ (`doiLich`); không có cờ thì suy như máy chủ — GVCN chỉ lớp thường (`SCHEDULE_MOVE` loại FT). */
    case 'vang': return { chinh: (q.doiLich ?? (ql || (q.gvcn && !q.laFt))) ? 'xep-lai' : null, menu: huy };
    case 'cho-duyet': return { chinh: ql ? 'tra-loi-de-nghi' : null, menu: [] };
    /* PR-MTGON: kỹ năng đã huỷ (dữ liệu cũ, kể cả MT cũ) → "Đưa lại vào đợt" (Quản lý FT); lớp thường giữ Khôi phục. */
    case 'da-huy': return { chinh: ftQl ? 'dua-lai' : ql ? 'khoi-phuc' : null, menu: [] };
    case 'lich-su': return { chinh: q.nhapDiem ? 'nhap-diem' : null, menu: [...khoiPhuc, ...huy] };
    /* T3 (PR-MTa): Chỉ Quản lý khôi phục và đặt tuần / không mock lại (luật 09/10: GVCN không xử lý lịch Test). */
    case 'huy-vang': return { chinh: q.quanLy ? 'khoi-phuc' : null, menu: q.quanLy ? ['khong-mock-lai'] : [] };
  }
}

/**
 * MENU ⋯ CỦA HỘP MỘT ĐỢT (PR-MTb Task 5, mockup phần 2): NĂM mục cố định, thứ tự cố định — mục chưa làm được vẫn hiện, mờ, `viSao` là tooltip.
 * `duoc` lấy từ `thaoTacKyNang` (một nguồn). `thay` = thao tác thật khi bấm "Đổi tuần" ở dòng vắng / đã huỷ (đường cũ: Xếp lại bài vắng /
 * Khôi phục và đặt tuần). "Không mock lại", "Khôi phục kết quả" không nằm ở đây (hồ sơ Mock / ⋯ hàng Lộ trình).
 */
export type MucHop = 'doi-tuan' | 'doi-han' | 'bao-vang' | 'huy-diem' | 'nhat-ky';
export const CHU_MUC_HOP: Record<MucHop, string> = { 'doi-tuan': t('Đổi tuần'), 'doi-han': t('Dời hạn chấm'), 'bao-vang': t('Vắng'), 'huy-diem': t('Huỷ điểm'), 'nhat-ky': t('Nhật ký') };

/** Vì sao mục mờ (≤ 6 từ). `moi` = đợt chưa tạo. */
function viSaoMo(muc: MucHop, tt: TrangThaiTT, moi: boolean): string {
  if (moi) return t('Đợt chưa tạo');
  if (muc === 'huy-diem' && tt !== 'co-diem') return t('Chưa có điểm');
  switch (tt) {
    case 'co-diem': return t('Đã có điểm');
    case 'chua-xep': case 'chua-toi-tuan': return t('Chưa tới tuần thi');
    case 'vang': return t('Bài đang vắng');
    case 'da-huy': case 'huy-vang': return t('Phần thi đã huỷ');
    case 'cho-duyet': return t('Chờ duyệt');
    case 'lich-su': return t('MT cũ');
    /* OV-11e (TE-12): Đổi tuần / Dời hạn chấm mờ ở đây là thiếu quyền (Admin không dời hạn — OV-10a), không phải "không thi". */
    default: return muc === 'doi-tuan' || muc === 'doi-han' ? t('Chỉ Quản lý') : t('Không thi đợt này');
  }
}

export function menuHopKyNang(tt: TrangThaiTT, q: QuyenTT, moi: boolean):
  Array<{ muc: MucHop; duoc: boolean; thay?: 'xep-lai' | 'khoi-phuc'; viSao: string | null }> {
  const t = thaoTacKyNang(tt, q);
  /* PR-MTGON: kỹ năng đã huỷ — nút chính là "Đưa lại vào đợt"; "Đổi tuần" trong hộp vẫn là đưa lại + đặt tuần (đường Khôi phục). */
  const thay = t.chinh === 'xep-lai' ? 'xep-lai' as const : t.chinh === 'khoi-phuc' || (tt === 'da-huy' && q.quanLy) ? 'khoi-phuc' as const : undefined;
  /* MT cũ chưa điểm: `thaoTacKyNang` không cho dời, nhưng Quản lý vẫn sửa tuần hồ sơ (PR-LM D3, T20 — máy chủ `setSkillWeek` cho). */
  const doiTuan = moi ? q.quanLy : t.chinh === 'dat-lich' || t.menu.includes('doi-lich') || !!thay || (tt === 'lich-su' && q.quanLy);
  const duoc: Record<MucHop, boolean> = {
    'doi-tuan': doiTuan,
    'doi-han': !moi && t.menu.includes('doi-han'),
    'bao-vang': !moi && t.menu.includes('bao-vang'),
    'huy-diem': !moi && t.menu.includes('huy-diem'),
    'nhat-ky': !moi,
  };
  return (Object.keys(CHU_MUC_HOP) as MucHop[]).map((muc) => ({
    muc, duoc: duoc[muc], ...(muc === 'doi-tuan' && !moi && thay ? { thay } : {}), viSao: duoc[muc] ? null : viSaoMo(muc, tt, moi),
  }));
}

/**
 * PR-HOP1 (luật 1) · PR-DON: dòng của hộp một đợt đổi theo "Tuần chung" — "Đổi tuần" làm thẳng (không qua Xếp lại / Khôi phục), kể cả đã có
 * điểm / đã thi (điểm giữ). Dòng đã huỷ, vắng, chờ duyệt thì không. Hộp (`HopKyNang`) và phép kiểm dùng chung hàm này.
 */
export function theoTuanChung(tt: TrangThaiTT, q: QuyenTT, moi: boolean): boolean {
  const doiTuan = menuHopKyNang(tt, q, moi)[0];
  return doiTuan.duoc && !doiTuan.thay;
}

/** Thao tác có ô lý do (T7) — các nút của `ThaoTac` cộng những thao tác không nằm trong menu kỹ năng. */
export type ThaoTacLyDo = ThaoTac | 'huy-luot' | 'huy-ket-qua' | 'tu-choi' | 'thi-lai' | 'huy-lich';

export const CHU_LY_DO: Record<ThaoTacLyDo, string> = {
  ...CHU_THAO_TAC, 'huy-luot': t('Huỷ lượt'), 'huy-ket-qua': t('Huỷ kết quả'), 'tu-choi': t('Từ chối'), 'thi-lai': t('Thi lại'), 'huy-lich': t('Huỷ lịch'),
};

/** T7 (PR-MTa, 05/10): lý do BẮT BUỘC chỉ khi huỷ kết quả (dữ liệu cũ), Quản lý từ chối. Huỷ điểm một kỹ năng: tuỳ chọn, như xoá
 *  trắng ô (T22; chủ sản phẩm 06/10). Huỷ MT{n}: tuỳ chọn (PR-MTGON, rà #282 — bảng chữ đã duyệt không có ô lý do bắt buộc). */
export const LY_DO_BAT_BUOC: readonly ThaoTacLyDo[] = ['huy-ket-qua', 'tu-choi'];

export function canLyDo(t: ThaoTacLyDo): boolean {
  return LY_DO_BAT_BUOC.includes(t);
}

/** `null` = được; thao tác bắt buộc mà trống → "Huỷ điểm: cần ghi lý do.". Không tối thiểu ký tự (T7). Máy chủ gọi lại đúng hàm này. */
export function kiemLyDoThaoTac(tt: ThaoTacLyDo, s: string | null | undefined): string | null {
  return canLyDo(tt) && !(s ?? '').trim() ? t('{x}: cần ghi lý do.', { x: CHU_LY_DO[tt] }) : null;
}
