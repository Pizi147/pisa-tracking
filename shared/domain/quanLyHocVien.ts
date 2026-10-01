/**
 * MENU ⋮ Ở HỒ SƠ HỌC VIÊN (PR-UX3, Q10) — luật thuần: mục nào hiện, theo quyền và tình trạng. Web (`StudentManagePanel.tsx`) chỉ vẽ menu thả
 * và mở THẲNG panel của mục được chọn. Ẩn một mục không phải là chặn nó: máy chủ vẫn kiểm quyền.
 */
export type ViecQuanLy = 'info' | 'lo-trinh-tiep' | 'lo-trinh' | 'chuyen-lop' | 'outcome' | 'tam-dung' | 'quay-lai' | 'ket-thuc' | 'luu-tru' | 'bo-luu-tru'
  | 'xoa-hoc-vien' | 'de-xuat-sua' | 'de-xuat-chuyen-lop';

export const NHAN_VIEC_QUAN_LY: Record<ViecQuanLy, string> = {
  info: 'Thông tin học viên',
  'lo-trinh-tiep': 'Lộ trình tiếp theo',
  'lo-trinh': 'Lộ trình',
  'chuyen-lop': 'Chuyển lớp…',
  'de-xuat-chuyen-lop': 'Đề xuất chuyển lớp…',
  outcome: 'Kết luận lộ trình',
  'tam-dung': 'Tạm dừng học',
  'quay-lai': 'Quay lại học',
  'ket-thuc': 'Kết thúc học',
  'luu-tru': 'Lưu trữ',
  'bo-luu-tru': 'Bỏ lưu trữ',
  'xoa-hoc-vien': 'Xoá học viên',
  'de-xuat-sua': 'Đề xuất sửa thông tin…',
};

export type LopHocQuyen = {
  ghiLoTrinhTiep: boolean; chuyenLop: boolean; /** PR-CT: GVCN đề xuất; Quản lý (`chuyenLop`) ra lệnh. */ deXuatChuyenLop?: boolean; tamDung: boolean; quayLai: boolean;
  ketThuc: boolean; luuTru: boolean; boLuuTru: boolean;
};

/**
 * Các mục của menu ⋮, đúng thứ tự PR-LT: Thông tin · Lộ trình tiếp theo (lớp thường) · Lộ trình (FT) · Chuyển lớp · Kết luận lộ trình (CHỈ FT,
 * Q15/Q18) · Tạm dừng/Quay lại/Kết thúc học · Lưu trữ/Bỏ lưu trữ · (PR-XOA) Xoá học viên — CUỐI CÙNG, sau đường kẻ, chữ đỏ, chỉ Quản trị
 * hệ thống (`coTheXoa` = `viewer.coTheXoa`). Không có mục nào → nơi gọi không vẽ ⋮ (GVBM không có mục nào).
 */
export function mucQuanLyHocVien({ canEdit, lopHoc, cycle, status, coTheXoa, deXuatSua }: {
  canEdit: boolean;
  lopHoc?: { quyen: LopHocQuyen } | null;
  cycle: { ratio?: boolean } | null;
  status?: string;
  /** PR-XOA: chỉ Quản trị hệ thống. */
  coTheXoa?: boolean;
  /** PR-DUYET (T44): GV của lớp KHÔNG có `cycle.edit` (`viewer.coTheDeXuatSua`) — GVBM nay có ⋮ với đúng mục này. */
  deXuatSua?: boolean;
}): { key: ViecQuanLy; nhan: string; nhom: NhomViecQuanLy; phu?: string; nguyHiem?: boolean; keTruoc?: boolean | 'dam' | 'do' }[] {
  const quyen = lopHoc?.quyen;
  const ratio = !!cycle?.ratio;
  const dangHoc = status === 'active';
  const ds: ViecQuanLy[] = [];
  if (canEdit) ds.push('info');
  if (quyen?.ghiLoTrinhTiep) ds.push('lo-trinh-tiep');
  if (canEdit && cycle && !ratio) ds.push('lo-trinh');
  if (deXuatSua && dangHoc) ds.push('de-xuat-sua');
  if (quyen?.chuyenLop) ds.push('chuyen-lop');
  if (quyen?.deXuatChuyenLop && dangHoc) ds.push('de-xuat-chuyen-lop');
  if (canEdit && cycle && !ratio) ds.push('outcome');
  if (quyen?.tamDung && dangHoc) ds.push('tam-dung');
  if (quyen?.quayLai && !dangHoc && status === 'inactive') ds.push('quay-lai');
  if (quyen?.ketThuc && status !== 'finished') ds.push('ket-thuc');
  if (quyen?.luuTru) ds.push('luu-tru');
  if (quyen?.boLuuTru) ds.push('bo-luu-tru');
  if (coTheXoa) ds.push('xoa-hoc-vien');
  /* PR-VAI-b (K3-48): chia nhóm Thông tin · Lộ trình · Lớp (giữ thứ tự trong nhóm, TẬP MỤC THEO QUYỀN KHÔNG ĐỔI); vạch đậm trước Tạm dừng /
     Quay lại / Kết thúc, vạch đỏ trước Xoá; mục có hệ quả thêm một dòng phụ. */
  const xep = [...ds].sort((a, b) => THU_TU_NHOM.indexOf(NHOM_VIEC[a]) - THU_TU_NHOM.indexOf(NHOM_VIEC[b]));
  const dauNang = xep.find((k) => k === 'tam-dung' || k === 'quay-lai' || k === 'ket-thuc');
  return xep.map((key) => ({
    key, nhan: NHAN_VIEC_QUAN_LY[key], nhom: NHOM_VIEC[key],
    ...(PHU_VIEC[key] ? { phu: PHU_VIEC[key] } : {}),
    ...(key === 'xoa-hoc-vien' ? { nguyHiem: true, keTruoc: 'do' as const } : key === dauNang ? { keTruoc: 'dam' as const } : {}),
  }));
}

export type NhomViecQuanLy = 'thong-tin' | 'lo-trinh' | 'lop';
export const NHAN_NHOM_VIEC_QUAN_LY: Record<NhomViecQuanLy, string> = { 'thong-tin': 'Thông tin', 'lo-trinh': 'Lộ trình', lop: 'Lớp' };
const THU_TU_NHOM: readonly NhomViecQuanLy[] = ['thong-tin', 'lo-trinh', 'lop'];
const NHOM_VIEC: Record<ViecQuanLy, NhomViecQuanLy> = {
  info: 'thong-tin', 'de-xuat-sua': 'thong-tin',
  'lo-trinh-tiep': 'lo-trinh', 'lo-trinh': 'lo-trinh', outcome: 'lo-trinh',
  'chuyen-lop': 'lop', 'de-xuat-chuyen-lop': 'lop', 'tam-dung': 'lop', 'quay-lai': 'lop', 'ket-thuc': 'lop', 'luu-tru': 'lop', 'bo-luu-tru': 'lop',
  'xoa-hoc-vien': 'lop',
};
/** Một dòng hệ quả (mockup 24 B) — chỉ mục có hệ quả mới có. */
const PHU_VIEC: Partial<Record<ViecQuanLy, string>> = {
  'lo-trinh': 'target, thi dự kiến, lịch MT',
  'de-xuat-sua': 'Quản lý duyệt rồi mới đổi',
  'chuyen-lop': 'chọn lớp đích và tuần bắt đầu',
  'de-xuat-chuyen-lop': 'Quản lý duyệt rồi ra lệnh',
  'tam-dung': 'mọi hạn của em dừng · giữ lớp, lộ trình',
  'quay-lai': 'hạn tính lại từ ngày quay lại',
  'ket-thuc': 'đóng lộ trình · hồ sơ chỉ xem',
  'xoa-hoc-vien': 'chỉ Quản trị hệ thống thấy dòng này',
};
