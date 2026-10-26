/**
 * MENU ⋮ Ở HỒ SƠ HỌC VIÊN (PR-UX3, Q10) — luật thuần: mục nào hiện, theo quyền và tình trạng. Web (`StudentManagePanel.tsx`) chỉ vẽ menu thả
 * và mở THẲNG panel của mục được chọn. Ẩn một mục không phải là chặn nó: máy chủ vẫn kiểm quyền.
 */
import { t } from '../i18n/index.ts';
/* P7 SV-LO-TRINH (N11): một mục "Tạm dừng/ Kết thúc học" thay Tạm dừng / Thôi học + Lưu trữ + Bỏ lưu trữ + Học lại; "Quay lại học" cho em tạm dừng
   và em đã kết thúc (đường `hocLai` cũ). API cũ (`archive`, `unarchive`, `hoc-lai`) giữ ở máy chủ cho dữ liệu cũ — web không bày. */
export type ViecQuanLy = 'info' | 'lo-trinh-tiep' | 'lo-trinh' | 'chuyen-lop' | 'outcome' | 'tam-dung-ket-thuc' | 'quay-lai'
  | 'xoa-hoc-vien' | 'de-xuat-sua' | 'de-xuat-chuyen-lop' | 'lich-su-sua';

export const NHAN_VIEC_QUAN_LY: Record<ViecQuanLy, string> = {
  info: t('Sửa thông tin'),
  'lo-trinh-tiep': t('Cuối khoá…'),
  'lo-trinh': t('Lộ trình'),
  'chuyen-lop': t('Chuyển lớp…'),
  'de-xuat-chuyen-lop': t('Đề xuất chuyển lớp…'),
  outcome: t('Kết quả thi thật'),
  'tam-dung-ket-thuc': t('Tạm dừng/ Kết thúc học'),
  'quay-lai': t('Quay lại học'),
  'xoa-hoc-vien': t('Xoá học viên'),
  'de-xuat-sua': t('Đề xuất sửa thông tin…'),
  'lich-su-sua': t('Lịch sử'),   // OV-15g: một tên cho mọi nơi (thuật ngữ A-043)
};

/** OV-11d (HV-3, Q4): hồ sơ đã Lưu trữ khoá — máy chủ trả câu này (400) ở mọi đường sửa hồ sơ / lộ trình / thi thật / Case. P7: lối ra là Quay lại học. */
export const CAU_LUU_TRU = 'Đã lưu trữ — Quay lại học trước rồi sửa.';
/** P7 [ĐX]: em Tạm dừng (Lưu trữ) vẫn sửa được thông tin liên hệ — TVV gọi mời học lại. Chủ SP không đồng ý thì bỏ dòng cho phép ở `updateStudent` + mục ⋯. */
export const TRUONG_LIEN_HE_TAM_DUNG = ['email', 'phone', 'parentName', 'parentRelation', 'parentPhone'] as const;

export type LopHocQuyen = {
  ghiLoTrinhTiep: boolean; chuyenLop: boolean; /** PR-CT: GVCN đề xuất; Quản lý (`chuyenLop`) ra lệnh. */ deXuatChuyenLop?: boolean; tamDung: boolean; quayLai: boolean;
  ketThuc: boolean; luuTru: boolean; boLuuTru: boolean;
  /** PR-LUI-b: Quản lý / Quản trị cho em đã kết thúc học quay lại (về lớp cũ hoặc sang lớp mới). */
  hocLai?: boolean;
};

/** P7 (N11): hộp "Tạm dừng/ Kết thúc học" — `tamDung` = ô "Có thể quay lại học" bật được (em đang học); `ketThuc` = Kết thúc học được (chưa kết thúc).
 * Cả hai false → không có mục. Máy chủ vẫn kiểm. */
export function coTheTamDungKetThuc(quyen: Pick<LopHocQuyen, 'tamDung' | 'ketThuc'> | null | undefined, status?: string): { tamDung: boolean; ketThuc: boolean } {
  return { tamDung: !!quyen?.tamDung && status === 'active', ketThuc: !!quyen?.ketThuc && (status === 'active' || status === 'inactive') };
}

/**
 * Các mục của menu ⋯ hồ sơ HV (PR-OV2b, mockup overhaul-2 §6; P7 mockup V6 trang-thai-hv k1): Sửa thông tin · Chuyển lớp · Tạm dừng/ Kết thúc học trước; các mục
 * khác giữ điều kiện cũ, xếp sau một vạch (Lộ trình tiếp theo, Lộ trình FT, Đề xuất…, Kết quả thi thật, Quay lại học);
 * Xoá học viên CUỐI, vạch đỏ, chỉ Quản trị hệ thống. `suaThongTin`: Admin / TVV / CX (`student.edit_info`) — mục Sửa thông tin. OV-8b: `suaThem`
 * (TVV / CX, `student.edit_more`) thêm Kết quả thi thật; Tạm dừng/ Kết thúc học / Quay lại học theo cờ `lopHoc.quyen` của máy chủ.
 * Không có mục nào → nơi gọi không vẽ ⋯. Ẩn một mục không phải là chặn nó: máy chủ vẫn kiểm quyền.
 */
export function mucQuanLyHocVien({ canEdit, suaThongTin, suaThem, lopHoc, cycle, status, coTheXoa, deXuatSua }: {
  canEdit: boolean;
  /** PR-OV2b: có `student.edit_info` (không cần `student.edit`). */
  suaThongTin?: boolean;
  /** OV-8b: có `student.edit_more` (TVV / CX) — Kết quả thi thật. */
  suaThem?: boolean;
  lopHoc?: { quyen: LopHocQuyen; chiXem?: boolean } | null;
  cycle: { ratio?: boolean } | null;
  status?: string;
  /** PR-XOA: chỉ Quản trị hệ thống. */
  coTheXoa?: boolean;
  /** PR-DUYET (T44): GV của lớp KHÔNG có `cycle.edit` (`viewer.coTheDeXuatSua`) — GVBM nay có ⋮ với đúng mục này. */
  deXuatSua?: boolean;
}): { key: ViecQuanLy; nhan: string; phu?: string; nguyHiem?: boolean; keTruoc?: boolean | 'dam' | 'do' }[] {
  const quyen = lopHoc?.quyen;
  /* OV-11d (HV-3, Q4): hồ sơ Lưu trữ "chỉ xem" — không Sửa thông tin / Lộ trình / Kết quả thi thật (máy chủ 400 `CAU_LUU_TRU`).
     P7: em Tạm dừng (Lưu trữ) trừ 3 việc — Quay lại học · Kết thúc học · Sửa thông tin liên hệ ([ĐX]). */
  const chiXem = !!lopHoc?.chiXem;
  const tamDungLuuTru = chiXem && status === 'inactive';
  const ratio = !!cycle?.ratio;
  const dangHoc = status === 'active';
  const dau: ViecQuanLy[] = [];
  const sau: ViecQuanLy[] = [];
  if ((canEdit || suaThongTin) && (!chiXem || tamDungLuuTru)) dau.push('info');
  if (quyen?.chuyenLop && !chiXem) dau.push('chuyen-lop');
  const td = coTheTamDungKetThuc(quyen, status);
  if (td.tamDung || td.ketThuc) dau.push('tam-dung-ket-thuc');
  if (quyen?.ghiLoTrinhTiep && !chiXem) sau.push('lo-trinh-tiep');
  if (canEdit && cycle && !ratio && !chiXem) sau.push('lo-trinh');
  /* OV-11d (HV-15): GVCN (`canEdit`) gửi đề xuất Target ngay ở Sửa thông tin — không thêm cửa thứ hai; GVBM giữ mục này. */
  if (deXuatSua && dangHoc && !canEdit) sau.push('de-xuat-sua');
  if (quyen?.deXuatChuyenLop && dangHoc) sau.push('de-xuat-chuyen-lop');
  if ((canEdit || suaThem) && cycle && !ratio && !chiXem) sau.push('outcome');
  /* P7: Quay lại học — em tạm dừng (`quayLai`) hoặc em đã kết thúc (`hocLai`, Quản lý). */
  if ((quyen?.quayLai && status === 'inactive') || (quyen?.hocLai && status === 'finished')) sau.push('quay-lai');
  /* OV-13j: ai sửa được thông tin em thì xem được lịch sử sửa (cả khi hồ sơ đã Lưu trữ — chỉ xem). */
  if (canEdit || suaThongTin) sau.push('lich-su-sua');
  if (coTheXoa) sau.push('xoa-hoc-vien');
  return [...dau, ...sau].map((key, i) => ({
    key, nhan: NHAN_VIEC_QUAN_LY[key],
    ...(PHU_VIEC[key] ? { phu: PHU_VIEC[key] } : {}),
    ...(key === 'xoa-hoc-vien' ? { nguyHiem: true, keTruoc: 'do' as const } : i === dau.length && i > 0 ? { keTruoc: 'dam' as const } : {}),
  }));
}

/**
 * OV-10b (mockup vai 13/10 mục 1, 6): ⋯ dòng học viên của TVV / CX / Admin — cùng mục, cùng thứ tự ⋯ hồ sơ HV của vai đó (`mucQuanLyHocVien`), chỉ
 * việc thông tin / trạng thái: Sửa thông tin · Tạm dừng/ Kết thúc học · Quay lại học · Kết quả thi thật. Nơi gọi thêm "Mở hồ sơ".
 */
export function mucDongTheoVai(i: { suaThongTin: boolean; suaThem: boolean; ft: boolean; status: string }) {
  const quyen: LopHocQuyen = { ghiLoTrinhTiep: false, chuyenLop: false, tamDung: i.suaThem, quayLai: i.suaThem, ketThuc: i.suaThem, luuTru: false, boLuuTru: false };
  return mucQuanLyHocVien({ canEdit: false, suaThongTin: i.suaThongTin, suaThem: i.suaThem, lopHoc: { quyen }, cycle: { ratio: !i.ft }, status: i.status })
    .filter((m) => m.key === 'info' || m.key === 'tam-dung-ket-thuc' || m.key === 'quay-lai' || m.key === 'outcome');
}

/** Một dòng hệ quả (mockup 24 B) — chỉ mục có hệ quả mới có. */
const PHU_VIEC: Partial<Record<ViecQuanLy, string>> = {
  'lo-trinh': t('lịch MT'),
  'de-xuat-sua': t('Quản lý duyệt rồi mới đổi'),
  'chuyen-lop': t('chọn lớp chuyển đến và tuần bắt đầu'),
  'de-xuat-chuyen-lop': t('Quản lý duyệt rồi quyết định'),
  'tam-dung-ket-thuc': t('em vào Lưu trữ · tạm dừng giữ lớp'),
  'quay-lai': t('hạn tính lại từ ngày quay lại'),
  'xoa-hoc-vien': t('chỉ Quản trị hệ thống thấy dòng này'),
};
