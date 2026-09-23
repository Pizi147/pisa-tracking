/**
 * MENU ⋮ Ở HỒ SƠ HỌC VIÊN (PR-UX3, Q10) — luật thuần: mục nào hiện, theo quyền và tình trạng. Web (`StudentManagePanel.tsx`) chỉ vẽ menu thả
 * và mở THẲNG panel của mục được chọn. Ẩn một mục không phải là chặn nó: máy chủ vẫn kiểm quyền.
 */
export type ViecQuanLy = 'info' | 'lo-trinh-tiep' | 'lo-trinh' | 'chuyen-lop' | 'outcome' | 'tam-dung' | 'quay-lai' | 'ket-thuc' | 'luu-tru' | 'bo-luu-tru';

export const NHAN_VIEC_QUAN_LY: Record<ViecQuanLy, string> = {
  info: 'Thông tin học viên',
  'lo-trinh-tiep': 'Lộ trình tiếp theo',
  'lo-trinh': 'Lộ trình',
  'chuyen-lop': 'Chuyển lớp',
  outcome: 'Kết luận lộ trình',
  'tam-dung': 'Tạm dừng học',
  'quay-lai': 'Quay lại học',
  'ket-thuc': 'Kết thúc học',
  'luu-tru': 'Lưu trữ',
  'bo-luu-tru': 'Bỏ lưu trữ',
};

export type LopHocQuyen = {
  ghiLoTrinhTiep: boolean; chuyenLop: boolean; tamDung: boolean; quayLai: boolean;
  ketThuc: boolean; luuTru: boolean; boLuuTru: boolean;
};

/**
 * Các mục của menu ⋮, đúng thứ tự PR-LT: Thông tin · Lộ trình tiếp theo (lớp thường) · Lộ trình (FT) · Chuyển lớp · Kết luận lộ trình (CHỈ FT,
 * Q15/Q18) · Tạm dừng/Quay lại/Kết thúc học · Lưu trữ/Bỏ lưu trữ. Không có mục nào → nơi gọi không vẽ ⋮ (GVBM không có mục nào).
 */
export function mucQuanLyHocVien({ canEdit, lopHoc, cycle, status }: {
  canEdit: boolean;
  lopHoc?: { quyen: LopHocQuyen } | null;
  cycle: { ratio?: boolean } | null;
  status?: string;
}): { key: ViecQuanLy; nhan: string }[] {
  const quyen = lopHoc?.quyen;
  const ratio = !!cycle?.ratio;
  const dangHoc = status === 'active';
  const ds: ViecQuanLy[] = [];
  if (canEdit) ds.push('info');
  if (quyen?.ghiLoTrinhTiep) ds.push('lo-trinh-tiep');
  if (canEdit && cycle && !ratio) ds.push('lo-trinh');
  if (quyen?.chuyenLop) ds.push('chuyen-lop');
  if (canEdit && cycle && !ratio) ds.push('outcome');
  if (quyen?.tamDung && dangHoc) ds.push('tam-dung');
  if (quyen?.quayLai && !dangHoc && status === 'inactive') ds.push('quay-lai');
  if (quyen?.ketThuc && status !== 'finished') ds.push('ket-thuc');
  if (quyen?.luuTru) ds.push('luu-tru');
  if (quyen?.boLuuTru) ds.push('bo-luu-tru');
  return ds.map((key) => ({ key, nhan: NHAN_VIEC_QUAN_LY[key] }));
}
