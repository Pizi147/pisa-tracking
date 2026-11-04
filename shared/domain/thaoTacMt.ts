/**
 * THAO TÁC MỘT KỸ NĂNG CỦA MỘT ĐỢT THEO TRẠNG THÁI (PR-XLMT — T38, K4 §4d, K4-15, K4-27).
 *
 * Một nguồn cho "ở trạng thái này, người xem này thấy nút gì": hồ sơ Mock, hộp kỹ năng Kế hoạch Test và menu ⋯ ô lưới lớp
 * thường đều vẽ theo `thaoTacKyNang` — không nơi nào tự dựng menu thứ hai. Máy chủ kiểm lại mọi luật chặn.
 */
import { mondayOfDate } from './week.ts';
import { t } from '../i18n/index.ts';

/* N38 (PR-MT-VANG): bỏ 'xep-lai' (Xếp lại bài vắng), 'dua-lai' (Đưa lại vào đợt), 'khong-mock-lai' (Giữ huỷ) — chọn tuần (Dời) thay cả ba (L5, L6).
   'khoi-phuc' chỉ còn ở lớp thường (dữ liệu "đã huỷ" cũ). */
export type ThaoTac = 'nhap-diem' | 'sua-diem' | 'dat-lich' | 'doi-lich' | 'doi-han' | 'bo-ky-nang' | 'bao-vang' | 'huy-diem'
  | 'tra-loi-de-nghi' | 'khoi-phuc' | 'khoi-phuc-diem';

export const CHU_THAO_TAC: Record<ThaoTac, string> = {
  'nhap-diem': t('Nhập điểm'), 'sua-diem': t('Sửa điểm'), 'dat-lich': t('Xếp lịch'), 'doi-lich': t('Dời lịch'), 'doi-han': t('Dời hạn chấm'),
  'bo-ky-nang': t('Bỏ khỏi đợt'), 'bao-vang': t('Vắng'), 'huy-diem': t('Huỷ điểm'),
  'tra-loi-de-nghi': t('Trả lời đề nghị dời'), 'khoi-phuc': t('Khôi phục và đặt tuần'), 'khoi-phuc-diem': t('Khôi phục điểm'),
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
  /* PR-MTGON: đã huỷ xét TRƯỚC MT cũ. PR-MTb (I1): huỷ vì vắng mà còn thẻ dời cũ chờ (dữ liệu trước N38) → "chờ duyệt". */
  if (o.huyVang && o.sit === 'cancelled') return o.choDuyet ? 'cho-duyet' : 'huy-vang';
  if (o.sit === 'cancelled') return 'da-huy';
  if (o.lichSu) return 'lich-su';          // MT cũ chưa điểm: chỉ nhập bù — không dời, không vắng, không hạn
  if (o.choDuyet) return 'cho-duyet';
  if (o.sit === 'absent') return 'vang';
  if (!o.tuanBatDau) return 'chua-xep';
  return o.tuanBatDau.slice(0, 10) > mondayOfDate(o.homNay) ? 'chua-toi-tuan' : 'dang-thi';
}

/** Tuần thi (thứ Hai `tuanBatDau`) đã kết thúc trước tuần chứa `homNay` — cờ `quaTuan` của `QuyenTT` (chủ SP 28/10). */
export const tuanDaQua = (tuanBatDau: string | null | undefined, homNay: string): boolean => !!tuanBatDau && tuanBatDau.slice(0, 10) < mondayOfDate(homNay);

/** `nhapDiem` = quyền sửa ô THẬT của người xem (đã gồm R11 — Quản lý hiệu chỉnh sau hoàn tất vẫn đúng). */
export type QuyenTT = {
  nhapDiem: boolean; quanLy: boolean; gvcn: boolean; laFt: boolean; dotHoanTat: boolean;
  /** OV-10a: `attempt.skip_skill` (Huỷ kỹ năng / Đưa lại) và `deadline.override` (Dời hạn chấm) — Admin có `plan.week` mà không có hai khoá này. Bỏ trống = theo `quanLy`. */
  huy?: boolean; han?: boolean;
  /** LUAT-34 (T20b): ô có điểm đã huỷ còn cất (`ket_qua_huy` loại `huy_diem`) → "Khôi phục điểm" cho người sửa được ô. */
  diemHuy?: boolean;
  /** CV-LOI (V4B H15): máy chủ cho đổi lịch kỹ năng này (`canMoveSkillSchedule`: Quản lý, hoặc GVCN / GVBM đúng môn ở lớp thường). Bỏ trống = suy theo vai. */
  doiLich?: boolean;
  /** Chủ SP 28/10: tuần thi của kỹ năng ĐÃ QUA (Chủ nhật < hôm nay) — GVCN được "Dời lịch" (máy chủ `gvcnDoiMtCu`). */
  quaTuan?: boolean;
};

/** ≤ 1 nút chính + ≤ 3 mục menu (K4-27). "Lịch sử" KHÔNG nằm trong menu dòng — ở dòng thời gian của đợt (YC-13.6). */
export function thaoTacKyNang(tt: TrangThaiTT, q: QuyenTT): { chinh: ThaoTac | null; menu: ThaoTac[] } {
  const ql = q.quanLy, ftQl = q.laFt && q.quanLy && (q.huy ?? true), han = ql && (q.han ?? true);
  /* PR-MTGON (luật 3): Quản lý FT "Huỷ kỹ năng" ở MỌI trạng thái còn kỹ năng trong đợt (có điểm thì web hỏi "Xoá điểm và huỷ kỹ năng?"). */
  const huy: ThaoTac[] = ftQl ? ['bo-ky-nang'] : [];
  /* LUAT-34 (T20b): ô trống có điểm cũ đã huỷ còn cất → "Khôi phục điểm" một bấm, người sửa được ô. */
  const khoiPhuc: ThaoTac[] = q.diemHuy && (q.nhapDiem || ql) ? ['khoi-phuc-diem'] : [];
  /* Chủ SP 28/10: GVCN dời MT tuần đã qua (kể cả có điểm) — như Quản lý, chỉ "Dời lịch". */
  const doi = ql || (q.gvcn && !!q.quaTuan);
  /* N38 (PR-MT-VANG L5, L6): FT vắng / đã huỷ / huỷ vắng 2 lần / bỏ khỏi đợt → "Dời lịch" = chọn tuần = xếp lại từ đầu (một thao tác thay Xếp lại
     bài vắng, Khôi phục, Giữ huỷ, Đưa lại vào đợt). Máy chủ `setSkillWeek` / `luuDot` làm phần còn lại. */
  const xepLai: ThaoTac | null = q.laFt && ql ? 'doi-lich' : null;
  switch (tt) {
    case 'khong-yeu-cau': return { chinh: ftQl ? 'doi-lich' : null, menu: [] };
    case 'chua-xep': return { chinh: ql ? 'dat-lich' : null, menu: huy };
    case 'chua-toi-tuan': return { chinh: q.nhapDiem ? 'nhap-diem' : null, menu: [...(ql ? ['doi-lich'] : []), ...huy] as ThaoTac[] };
    case 'dang-thi': return { chinh: q.nhapDiem ? 'nhap-diem' : null,
      menu: [...khoiPhuc, ...(q.gvcn || ql ? ['bao-vang'] : []), ...(han ? ['doi-han'] : []), ...(doi ? ['doi-lich'] : []), ...huy] as ThaoTac[] };
    /* PR-MTb T20: Quản lý / Quản trị dời được kỹ năng đã có điểm (điểm đi theo; máy chủ `setSkillWeek` `quanLy`). LUAT-34 (L3): "Đủ điểm"
     * không còn khoá — Huỷ điểm theo quyền sửa ô. */
    case 'co-diem': return { chinh: q.nhapDiem ? 'sua-diem' : null,
      menu: [...(doi ? ['doi-lich'] : []), ...(q.nhapDiem || ql ? ['huy-diem'] : []), ...huy] as ThaoTac[] };
    /* `vang` chỉ còn dữ liệu trước N38 (vắng chờ thẻ Quản lý) → Dời (L5). CV-LOI (V4B H15): cờ quyền máy chủ `doiLich` thắng; không cờ thì suy
       như máy chủ — GVCN chỉ lớp thường (`SCHEDULE_MOVE` loại FT). */
    case 'vang': return { chinh: (q.doiLich ?? (ql || (q.gvcn && !q.laFt))) ? 'doi-lich' : null, menu: huy };
    /* Thẻ dời cũ còn chờ (dữ liệu trước N38): Quản lý trả lời thẻ, hoặc Dời (thẻ tự rút, L5). */
    case 'cho-duyet': return { chinh: ql ? 'tra-loi-de-nghi' : null, menu: ql && q.laFt ? ['doi-lich', ...huy] as ThaoTac[] : [] };
    /* Lớp thường giữ Khôi phục và đặt tuần (dữ liệu "đã huỷ" cũ). */
    case 'da-huy': return { chinh: q.laFt ? xepLai : ql ? 'khoi-phuc' : null, menu: huy };
    case 'lich-su': return { chinh: q.nhapDiem ? 'nhap-diem' : null, menu: [...khoiPhuc, ...(doi ? ['doi-lich'] : []), ...huy] as ThaoTac[] };
    /* L2: huỷ vắng 2 lần đã là kết cục (không việc, không "Giữ huỷ"); muốn xếp lại thì Dời. Chỉ Quản lý (luật 09/10). */
    case 'huy-vang': return { chinh: xepLai, menu: huy };
  }
}

/**
 * DÒNG KỸ NĂNG CỦA HỘP MỘT ĐỢT (N38 · U05 chủ SP 05/11 "nút riêng cho từng môn"): ba NÚT Dời · Vắng · Bỏ khỏi đợt (thao tác lịch của môn) rồi ⋯
 * (Dời hạn chấm · Huỷ điểm · Nhật ký — thao tác cũ giữ). Thứ tự cố định; mục chưa làm được vẫn hiện, mờ, `viSao` là tooltip. `duoc` lấy từ
 * `thaoTacKyNang` (một nguồn). Dời ở MỌI trạng thái = chọn tuần = xếp lại từ đầu (L5); kỹ năng đang bỏ khỏi đợt → Dời đưa lại (L6).
 */
export type MucHop = 'doi-tuan' | 'bao-vang' | 'bo-ky-nang' | 'doi-han' | 'huy-diem' | 'nhat-ky';
/** Ba mục đầu là nút trên dòng; còn lại nằm trong ⋯. */
export const NUT_HOP: readonly MucHop[] = ['doi-tuan', 'bao-vang', 'bo-ky-nang'];
export const CHU_MUC_HOP: Record<MucHop, string> = {
  'doi-tuan': t('Dời'), 'bao-vang': t('Vắng'), 'bo-ky-nang': t('Bỏ khỏi đợt'), 'doi-han': t('Dời hạn chấm'), 'huy-diem': t('Huỷ điểm'), 'nhat-ky': t('Nhật ký'),
};

/** Vì sao mục mờ (≤ 6 từ). `moi` = đợt chưa tạo. */
function viSaoMo(muc: MucHop, tt: TrangThaiTT, moi: boolean): string {
  if (muc === 'bo-ky-nang' && tt === 'khong-yeu-cau') return t('Đã bỏ khỏi đợt');
  if (moi) return muc === 'bao-vang' || muc === 'doi-han' || muc === 'huy-diem' || muc === 'nhat-ky' ? t('Đợt chưa tạo') : t('Chỉ Quản lý');
  if (muc === 'huy-diem' && tt !== 'co-diem') return t('Chưa có điểm');
  switch (tt) {
    case 'co-diem': return t('Đã có điểm');
    case 'chua-xep': case 'chua-toi-tuan': return t('Chưa tới tuần Test');
    case 'vang': return t('Bài đang vắng');
    case 'da-huy': case 'huy-vang': return t('Kỹ năng đã huỷ');
    case 'cho-duyet': return t('Chờ duyệt');
    case 'lich-su': return t('Chỉ nhập bù');   // SV-NX-CASE (N8): không ghi chữ "cũ"
    /* OV-11e (TE-12): Dời / Dời hạn chấm mờ ở đây là thiếu quyền (Admin không dời hạn — OV-10a), không phải "không thi". */
    default: return muc === 'doi-tuan' || muc === 'doi-han' || muc === 'bo-ky-nang' ? t('Chỉ Quản lý') : t('Không có trong đợt này');
  }
}

export function menuHopKyNang(tt: TrangThaiTT, q: QuyenTT, moi: boolean): Array<{ muc: MucHop; duoc: boolean; viSao: string | null }> {
  const t = thaoTacKyNang(tt, q);
  /* MT cũ chưa điểm: `thaoTacKyNang` không cho dời, nhưng Quản lý vẫn sửa tuần hồ sơ (PR-LM D3, T20 — máy chủ `setSkillWeek` cho). */
  const doiTuan = moi ? q.quanLy : t.chinh === 'dat-lich' || t.chinh === 'doi-lich' || t.menu.includes('doi-lich') || (tt === 'lich-su' && q.quanLy);
  const duoc: Record<MucHop, boolean> = {
    'doi-tuan': doiTuan,
    'bao-vang': !moi && t.menu.includes('bao-vang'),
    /* Đợt mới: bỏ kỹ năng trước khi tạo (Quản lý FT); đợt đã có: theo bảng thao tác. */
    'bo-ky-nang': moi ? q.laFt && q.quanLy && (q.huy ?? true) : t.menu.includes('bo-ky-nang'),
    'doi-han': !moi && t.menu.includes('doi-han'),
    'huy-diem': !moi && t.menu.includes('huy-diem'),
    'nhat-ky': !moi,
  };
  return (Object.keys(CHU_MUC_HOP) as MucHop[]).map((muc) => ({ muc, duoc: duoc[muc], viSao: duoc[muc] ? null : viSaoMo(muc, tt, moi) }));
}

/**
 * PR-HOP1 (luật 1) · PR-DON: dòng của hộp một đợt đổi theo "Tuần chung" — Dời làm thẳng, kể cả đã có điểm / đã thi (điểm giữ). Dòng vắng,
 * chờ duyệt, đã huỷ, bỏ khỏi đợt thì không (mỗi dòng đó chọn tuần riêng bằng Dời — L5). Hộp (`HopKyNang`) và phép kiểm dùng chung hàm này.
 */
export function theoTuanChung(tt: TrangThaiTT, q: QuyenTT, moi: boolean): boolean {
  return menuHopKyNang(tt, q, moi)[0].duoc && !(['vang', 'cho-duyet', 'da-huy', 'huy-vang', 'khong-yeu-cau'] as TrangThaiTT[]).includes(tt);
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
