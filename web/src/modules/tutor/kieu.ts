/** TU-b · TU2-6: kiểu dữ liệu trang Tutor (khớp `server/src/tutors/trang.ts`) + nhãn dùng chung bảng / panel / hộp. */
import { addDaysIso, mondayOfDate, type KhoangNgay } from '@shared/domain/index.ts';
import { t } from '@shared/i18n/index.ts';

export type KetLuan = 'on' | 'can_cai_thien' | 'ngung';
export type TyLe = [number, number];
export type NoiDay = { id: number; ten: string } | 'online' | null;
export type SoTutor = { buoi: number; chuanBi: TyLe; taiLieu: TyLe; feedbackGv: TyLe; danhGia: number | null };
export type DongTutor = SoTutor & {
  id: number; ten: string; sdt: string | null; noiDay: NoiDay; kyNang: string[];
  ketLuan: { kl: KetLuan; luc: string } | null; chuY: string | null; thieu: ('sdt' | 'noiDay')[];
  /** TU2-5: `gv` = dòng danh bạ của một GV (`gvId` = tài khoản) — không ai Sửa / Xoá ở trang này; `suaDuoc` = người xem Sửa được dòng này. */
  loai: 'gv' | 'tutor'; gvId: number | null; suaDuoc: boolean;
};
export type ChiNhanh = { id: number; ten: string };
export type BangTutor = {
  dong: DongTutor[]; goTay: { soTen: number; soBuoi: number } | null; coSua: boolean; chiNhanh: string | null; dsChiNhanh: ChiNhanh[];
  /** TU13: Thêm tutor / Tải danh sách / Gộp. `chiNhanhDanhBa` = chi nhánh Head được đặt nơi dạy (null = mọi chi nhánh). */
  coDanhBa: boolean; chiNhanhDanhBa: ChiNhanh[] | null;
};
export type BuoiDay = {
  id: number; ngay: string; hocVien: string; lop: string | null; nguoiGhi: string | null; kn: string; soBuoi: number;
  chuanBi: boolean | null; taiLieu: boolean | null; feedbackGv: boolean | null; danhGia: number | null; nhanXet: string; nhanXetTutor: string | null;
};
export type NhanXet = { id: number; kl: KetLuan; noiDung: string; luc: string; suaLuc: string | null; nguoi: string; coSua: boolean; coXoa: boolean };
export type PanelTutorKq = { tutor: DongTutor; so: SoTutor; coSua: boolean; coDanhBa: boolean; coBuoi: boolean; nhanXet: NhanXet[]; buoi: BuoiDay[] };
/** Ba tiêu chí (cùng thứ tự `TIEU_CHI_TUTOR` của TU-a): khoá dữ liệu + nhãn cột (bảng: "Tài liệu" ngắn — R2.2). */
export type TieuChi = 'chuanBi' | 'taiLieu' | 'feedbackGv';
export const TIEU_CHI: { k: TieuChi; nhan: string }[] = [
  { k: 'chuanBi', nhan: t('Chuẩn bị') }, { k: 'taiLieu', nhan: t('Tài liệu') }, { k: 'feedbackGv', nhan: t('Feedback GV') },
];

export const NHAN_KET_LUAN: Record<KetLuan, string> = { on: t('Ổn'), can_cai_thien: t('Cần cải thiện'), ngung: t('Ngừng hợp tác') };
export const KET_LUAN: KetLuan[] = ['on', 'can_cai_thien', 'ngung'];
export const nhanNoiDay = (n: NoiDay) => (n === 'online' ? t('Chỉ online') : n ? n.ten : '—');
/** Kỹ năng cách nhau một khoảng ("W1 W2") — mockup Ⓣ2. */
export const nhanKyNang = (ks: string[]) => ks.join(' ');
/** Bỏ dấu + chữ thường — ô tìm tên. */
export const boDau = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/gi, 'd').toLowerCase().replace(/\s+/g, ' ').trim();
/** "0912 345 678" — đọc dễ. */
export const nhanSdt = (s: string | null) => (s && s.length === 10 ? `${s.slice(0, 4)} ${s.slice(4, 7)} ${s.slice(7)}` : s ?? '');
/** Nhận xét về người dạy: tối thiểu 8 ký tự (R2.6 / XM-7 — cùng luật máy chủ `kiemNhanXet`). */
export const NX_TOI_THIEU = 8;
/** R2.3: khoảng mặc định của trang Tutor = 4 tuần gồm tuần này (URL trống = khoảng này). */
export const khoangTutorMacDinh = (homNay: string): KhoangNgay => {
  const t2 = mondayOfDate(homNay);
  return { kieu: '2-tuan', tu: addDaysIso(t2, -21), den: addDaysIso(t2, 6) };
};
